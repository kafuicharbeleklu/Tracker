import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { TableScrollArea } from '../../../components/ui/TableScrollArea';
import SelectField from '../../../components/ui/SelectField';
import { buildCsvLine, parseCsvLine } from '../../../lib/csv';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { authService } from '../../../services/authService';
import type { User, UserRole } from '../../../types';

interface ImportUsersPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface ParsedUserRow {
    _id: number;
    /* Trois issues, comme la planche 05.3 les dessine : créée, déjà là (même adresse),
       invalide. « déjà là » n'est pas une erreur : la ligne est juste ignorée. */
    _status: 'valid' | 'error' | 'skipped';
    _error: string;
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    [key: string]: string | number | undefined;
}

const ROLE_BY_CSV: Record<string, UserRole> = {
    superadmin: 'SuperAdmin',
    admin: 'Admin',
    administrateur: 'Admin',
    manager: 'Manager',
    user: 'User',
    utilisateur: 'User',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'User', label: 'Utilisateur — voit ce qu’il détient' },
    { value: 'Manager', label: 'Manager — valide les demandes de son équipe' },
    { value: 'Admin', label: 'Admin — gère le parc de son périmètre' },
    { value: 'SuperAdmin', label: 'Super admin — configure l’application' },
];

const ImportUsersPage: React.FC<ImportUsersPageProps> = ({ onCancel, onSave }) => {
    const { showToast } = useToast();
    const { users, addUser } = useData();
    const { user: currentUser } = useAccessControl();
    /* Rôle appliqué aux personnes retenues quand la colonne Rôle est vide. `SuperAdmin`
       ne s'offre pas à qui ne l'est pas : `addUser` le refuserait ligne par ligne. */
    const [defaultRole, setDefaultRole] = useState<UserRole>('User');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedUserRow[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const validateAndSetFile = (uploadedFile: File) => {
        if (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv')) {
            setFile(uploadedFile);
            parseFile(uploadedFile);
        } else {
            showToast('Veuillez télécharger un fichier CSV valide.', 'error');
        }
    };

    const parseFile = (fileToParse: File) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter((line) => line.trim() !== '');
            if (lines.length < 2) {
                showToast('Le fichier semble vide.', 'error');
                setIsProcessing(false);
                return;
            }

            const headers = parseCsvLine(lines[0], ',');

            const data = lines.slice(1).map((line, index) => {
                const values = parseCsvLine(line, ',');
                const row: ParsedUserRow = {
                    _id: index,
                    _status: 'valid',
                    _error: '',
                };

                headers.forEach((header, i) => {
                    const key = header.toLowerCase();
                    if (key.includes('nom') || key.includes('name')) row.name = values[i];
                    else if (key.includes('mail')) row.email = values[i];
                    else if (key.includes('role')) row.role = values[i];
                    else if (key.includes('depart') || key.includes('service'))
                        row.department = values[i];
                    else row[key] = values[i];
                });

                if (!row.name || !row.email) {
                    row._status = 'error';
                    row._error = 'Nom et Email requis';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                    row._status = 'error';
                    row._error = 'Format Email invalide';
                } else if (users.some((u) => u.email.toLowerCase() === row.email!.toLowerCase())) {
                    row._status = 'skipped';
                    row._error = 'A déjà un compte à cette adresse';
                }

                return row;
            });

            setParsedData(data);
            setPreviewMode(true);
            setIsProcessing(false);
        };
        reader.readAsText(fileToParse);
    };

    const stats = useMemo(() => {
        return {
            total: parsedData.length,
            valid: parsedData.filter((d) => d._status === 'valid').length,
            invalid: parsedData.filter((d) => d._status === 'error').length,
            skipped: parsedData.filter((d) => d._status === 'skipped').length,
        };
    }, [parsedData]);

    const handleDownloadTemplate = () => {
        // Delimiter ',' to stay re-importable by parseFile, which splits on commas.
        const csvContent = [
            buildCsvLine(['Name', 'Email', 'Role', 'Department'], ','),
            buildCsvLine(['Awa Diop', 'awa.diop@exemple.com', 'User', 'IT'], ','),
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = 'modele-import-utilisateurs.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /**
     * L'import écrit, ligne par ligne, par la même porte que la saisie : `addUser`.
     * Il portait un `setTimeout` et un toast « importés avec succès » sans qu'aucun
     * compte n'existe. Une ligne refusée par la règle est nommée, pas avalée.
     * Lot 4, U2.
     */
    const handleImport = () => {
        if (!file || stats.valid === 0) return;
        setIsProcessing(true);
        let created = 0;
        const refused: string[] = [];

        for (const row of parsedData) {
            if (row._status !== 'valid' || !row.name || !row.email) continue;
            const role = ROLE_BY_CSV[(row.role || '').trim().toLowerCase()] ?? defaultRole;
            const name = row.name.trim();
            const user: User = {
                id: '', // posé par addUser
                name,
                email: row.email.trim().toLowerCase(),
                role,
                department: row.department?.trim() || '',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
                // Invité au sens d'authService : le mot de passe se définit à l'arrivée.
                status: 'pending',
                mustChangePassword: true,
            };
            const decision = addUser(user);
            if (!decision.allowed) {
                refused.push(`${name} — ${decision.reason || 'refusé par la règle'}`);
                continue;
            }
            created += 1;
            // Invitation côté auth : best effort, le store fait foi.
            authService
                .createUser({ Title: user.name, MicrosoftEmail: user.email, Role: role })
                .catch(() => undefined);
        }

        setIsProcessing(false);
        if (created > 0)
            showToast(
                `${created} personne${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} en attente.`,
                'success',
            );
        if (stats.skipped > 0)
            showToast(
                `${stats.skipped} déjà présente${stats.skipped > 1 ? 's' : ''}, ignorée${stats.skipped > 1 ? 's' : ''}.`,
                'info',
            );
        refused.forEach((r) => showToast(r, 'error'));
        if (created > 0 || refused.length === 0) onSave();
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setPreviewMode(false);
    };

    return (
        <FullScreenFormLayout
            title="Importer des utilisateurs"
            onCancel={onCancel}
            onSave={handleImport}
            saveLabel={
                isProcessing
                    ? 'Analyse...'
                    : `Importer ${stats.valid} personne${stats.valid > 1 ? 's' : ''}`
            }
            isSaving={!previewMode || stats.valid === 0}
        >
            {!previewMode ? (
                <div className="bg-surface rounded-card p-page shadow-elevation-1 border-outline-variant animate-in fade-in zoom-in-95 border duration-300">
                    <h3 className="text-label-large text-on-surface mb-4 font-bold">
                        Étape 1: Télécharger le fichier CSV
                    </h3>
                    <p className="text-body-medium text-on-surface-variant mb-6">
                        Colonnes attendues :{' '}
                        <span className="bg-surface-container rounded-md px-1 font-mono">Name</span>
                        ,{' '}
                        <span className="bg-surface-container rounded-md px-1 font-mono">
                            Email
                        </span>
                        ,{' '}
                        <span className="bg-surface-container rounded-md px-1 font-mono">Role</span>
                        ,{' '}
                        <span className="bg-surface-container rounded-md px-1 font-mono">
                            Department
                        </span>
                        .
                    </p>

                    <div className="mb-8">
                        <Button
                            variant="outlined"
                            onClick={handleDownloadTemplate}
                            icon={<MaterialIcon name="download" size={18} />}
                        >
                            Télécharger le modèle
                        </Button>
                    </div>

                    <FileDropzone
                        onFileSelect={validateAndSetFile}
                        accept=".csv"
                        isProcessing={isProcessing}
                    />
                </div>
            ) : (
                <div className="animate-in slide-in-from-right-8 space-y-6 duration-300">
                    <div className="bg-surface border-outline-variant shadow-elevation-1 flex items-center justify-between rounded-xl border p-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-secondary-container text-secondary flex h-10 w-10 items-center justify-center rounded-lg">
                                <MaterialIcon name="description" size={20} />
                            </div>
                            <div>
                                <p className="text-on-surface text-label-large font-bold">
                                    {file?.name}
                                </p>
                                <div className="text-body-small mt-0.5 flex items-center gap-3">
                                    <span className="text-on-surface-variant">
                                        {stats.total} lignes
                                    </span>
                                    <span className="text-tertiary font-bold">
                                        {stats.valid} valides
                                    </span>
                                    {stats.skipped > 0 && (
                                        <span className="text-on-surface-variant font-bold">
                                            {stats.skipped} déjà là
                                        </span>
                                    )}
                                    {stats.invalid > 0 && (
                                        <span className="text-error font-bold">
                                            {stats.invalid} erreurs
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button variant="outlined" size="sm" onClick={reset} className="text-error">
                            Changer
                        </Button>
                    </div>

                    <div className="bg-surface shadow-elevation-1 border-outline-variant overflow-hidden rounded-xl border">
                        <TableScrollArea
                            label="Aperçu des utilisateurs à importer"
                            scrollerClassName="max-h-[400px]"
                        >
                            <table className="text-body-medium w-full text-left">
                                <thead className="bg-surface-container text-on-surface-variant text-label-medium sticky top-0 z-10 font-bold uppercase">
                                    <tr>
                                        <th className="bg-surface-container border-outline-variant sticky left-0 z-20 border-r px-4 py-3">
                                            Statut
                                        </th>
                                        <th className="px-4 py-3">Nom</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Rôle</th>
                                        <th className="px-4 py-3">Département</th>
                                        <th className="px-4 py-3">Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-outline-variant divide-y">
                                    {parsedData.map((row) => (
                                        <tr
                                            key={row._id}
                                            className={cn(
                                                'group hover:bg-surface-container transition-colors',
                                                row._status === 'error' && 'bg-error-container/50',
                                                // « Déjà là » n'est pas une faute : teinte neutre.
                                                row._status === 'skipped' && 'opacity-60',
                                            )}
                                        >
                                            <td className="bg-surface group-hover:bg-surface-container border-outline-variant sticky left-0 z-10 border-r px-4 py-3 transition-colors">
                                                {row._status === 'valid' ? (
                                                    <Badge variant="success">OK</Badge>
                                                ) : row._status === 'skipped' ? (
                                                    <Badge variant="neutral">Déjà là</Badge>
                                                ) : (
                                                    <Badge variant="danger">Erreur</Badge>
                                                )}
                                            </td>
                                            <td className="text-on-surface px-4 py-3 font-bold">
                                                {row.name || '-'}
                                            </td>
                                            <td className="text-on-surface-variant px-4 py-3">
                                                {row.email || '-'}
                                            </td>
                                            <td className="px-4 py-3">{row.role || 'User'}</td>
                                            <td className="text-on-surface-variant px-4 py-3">
                                                {row.department || '-'}
                                            </td>
                                            <td
                                                className={cn(
                                                    'text-label-medium px-4 py-3 font-bold',
                                                    row._status === 'skipped'
                                                        ? 'text-on-surface-variant'
                                                        : 'text-error',
                                                )}
                                            >
                                                {row._error}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableScrollArea>
                    </div>

                    {/* Le rôle appliqué aux lignes sans colonne Rôle. Il se pose sous
                        l'aperçu — après avoir vu qui entre, pas avant (planche 05.3). */}
                    <div className="mt-4 max-w-sm">
                        <SelectField
                            label="Rôle appliqué aux personnes retenues"
                            name="defaultRole"
                            value={defaultRole}
                            onChange={(e) => setDefaultRole(e.target.value as UserRole)}
                            options={ROLE_OPTIONS.filter(
                                (o) =>
                                    o.value !== 'SuperAdmin' ||
                                    currentUser?.role === 'SuperAdmin',
                            )}
                            supportingText="Une colonne Rôle renseignée dans le fichier l'emporte, ligne par ligne."
                        />
                    </div>
                </div>
            )}
        </FullScreenFormLayout>
    );
};

export default ImportUsersPage;
