import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { TableScrollArea } from '../../../components/ui/TableScrollArea';
import { buildCsvLine, parseCsvLine } from '../../../lib/csv';

interface ImportUsersPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface ParsedUserRow {
    _id: number;
    _status: 'valid' | 'error';
    _error: string;
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    [key: string]: string | number | undefined;
}

const ImportUsersPage: React.FC<ImportUsersPageProps> = ({ onCancel, onSave }) => {
    const { showToast } = useToast();
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

            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                showToast("Le fichier semble vide.", "error");
                setIsProcessing(false);
                return;
            }

            const headers = parseCsvLine(lines[0], ',');

            const data = lines.slice(1).map((line, index) => {
                const values = parseCsvLine(line, ',');
                const row: ParsedUserRow = {
                    _id: index,
                    _status: 'valid',
                    _error: ''
                };

                headers.forEach((header, i) => {
                    const key = header.toLowerCase();
                    if (key.includes('nom') || key.includes('name')) row.name = values[i];
                    else if (key.includes('mail')) row.email = values[i];
                    else if (key.includes('role')) row.role = values[i];
                    else if (key.includes('depart') || key.includes('service')) row.department = values[i];
                    else row[key] = values[i];
                });

                if (!row.name || !row.email) {
                    row._status = 'error';
                    row._error = 'Nom et Email requis';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                    row._status = 'error';
                    row._error = 'Format Email invalide';
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
            valid: parsedData.filter(d => d._status === 'valid').length,
            invalid: parsedData.filter(d => d._status === 'error').length
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

    const handleImport = () => {
        if (!file || stats.valid === 0) return;
        setTimeout(() => {
            showToast(`${stats.valid} utilisateurs importés avec succès.`, 'success');
            onSave();
        }, 1000);
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
            saveLabel={isProcessing ? "Analyse..." : `Importer ${stats.valid > 0 ? `(${stats.valid})` : ''}`}
            isSaving={!previewMode || stats.valid === 0}
        >
            {!previewMode ? (
                <div className="bg-surface rounded-card p-page shadow-elevation-1 border border-outline-variant animate-in fade-in zoom-in-95 duration-300">
                    <h3 className="text-label-large font-bold text-on-surface mb-4">Étape 1: Télécharger le fichier CSV</h3>
                    <p className="text-body-medium text-on-surface-variant mb-6">
                        Colonnes attendues : <span className="font-mono bg-surface-container px-1 rounded-md">Name</span>, <span className="font-mono bg-surface-container px-1 rounded-md">Email</span>, <span className="font-mono bg-surface-container px-1 rounded-md">Role</span>, <span className="font-mono bg-surface-container px-1 rounded-md">Department</span>.
                    </p>

                    <div className="mb-8">
                        <Button variant="outlined" onClick={handleDownloadTemplate} icon={<MaterialIcon name="download" size={18} />}>
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
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-elevation-1 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center text-secondary">
                                <MaterialIcon name="description" size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-on-surface text-label-large">{file?.name}</p>
                                <div className="flex items-center gap-3 text-body-small mt-0.5">
                                    <span className="text-on-surface-variant">{stats.total} lignes</span>
                                    <span className="text-tertiary font-bold">{stats.valid} valides</span>
                                    {stats.invalid > 0 && <span className="text-error font-bold">{stats.invalid} erreurs</span>}
                                </div>
                            </div>
                        </div>
                        <Button variant="outlined" size="sm" onClick={reset} className="text-error">Changer</Button>
                    </div>

                    <div className="bg-surface rounded-xl shadow-elevation-1 border border-outline-variant overflow-hidden">
                        <TableScrollArea
                            label="Aperçu des utilisateurs à importer"
                            scrollerClassName="max-h-[400px]"
                        >
                            <table className="w-full text-body-medium text-left">
                                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 sticky left-0 z-20 bg-surface-container border-r border-outline-variant">Statut</th>
                                        <th className="px-4 py-3">Nom</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Rôle</th>
                                        <th className="px-4 py-3">Département</th>
                                        <th className="px-4 py-3">Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {parsedData.map((row) => (
                                        <tr key={row._id} className={cn("group hover:bg-surface-container transition-colors", row._status === 'error' && "bg-error-container/50")}>
                                            <td className="px-4 py-3 sticky left-0 z-10 bg-surface group-hover:bg-surface-container border-r border-outline-variant transition-colors">
                                                {row._status === 'valid' ? <Badge variant="success">OK</Badge> : <Badge variant="danger">Erreur</Badge>}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-on-surface">{row.name || '-'}</td>
                                            <td className="px-4 py-3 text-on-surface-variant">{row.email || '-'}</td>
                                            <td className="px-4 py-3">{row.role || 'User'}</td>
                                            <td className="px-4 py-3 text-on-surface-variant">{row.department || '-'}</td>
                                            <td className="px-4 py-3 text-label-medium text-error font-bold">{row._error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableScrollArea>
                    </div>
                </div>
            )}
        </FullScreenFormLayout>
    );
};

export default ImportUsersPage;
