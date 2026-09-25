import React, { useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
} from '../../../components/layout/ReferentialImportTemplate';
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

/** Ce qu'une ligne retenue écrira. */
interface UserDraft {
    name: string;
    email: string;
    role?: string;
    department?: string;
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

const COLUMNS: ImportColumn[] = [
    { key: 'Name', required: true },
    { key: 'Email', required: true },
    { key: 'Role' },
    { key: 'Department' },
];

/* Séparateur virgule : `parse` le relit tel quel. */
const SAMPLE = {
    fileName: 'modele-import-utilisateurs.csv',
    content: [
        buildCsvLine(['Name', 'Email', 'Role', 'Department'], ','),
        buildCsvLine(['Awa Diop', 'awa.diop@exemple.com', 'User', 'IT'], ','),
    ].join('\n'),
};

/**
 * **Importer des personnes — le gabarit des imports** (05.3, 24/09).
 *
 * L'écran était le seul import à ne pas passer par `ReferentialImportTemplate` :
 * « Étape 1: Télécharger le fichier CSV » en gras, une carte cernée, puis un tableau à
 * six colonnes défilant dans les deux sens avec des pastilles « OK / Erreur ». Il prend
 * le contrat en jetons, le dépôt, puis le décompte « ce qui sera créé » et les lignes
 * refusées avec leur cause — comme les équipements, les modèles et les emplacements.
 * Une adresse déjà connue est refusée avec sa cause : elle n'entre pas deux fois.
 */
const ImportUsersPage: React.FC<ImportUsersPageProps> = ({ onCancel, onSave }) => {
    const { showToast } = useToast();
    const { users, addUser } = useData();
    const { user: currentUser } = useAccessControl();
    /* Rôle appliqué aux personnes retenues quand la colonne Role est vide. `SuperAdmin`
       ne s'offre pas à qui ne l'est pas : `addUser` le refuserait ligne par ligne. */
    const [defaultRole, setDefaultRole] = useState<UserRole>('User');

    const parse = (text: string): ImportCandidate<UserDraft>[] => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
        if (lines.length < 2) return [];
        const separateur = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
        const headers = parseCsvLine(lines[0], separateur).map((h) => h.trim().toLowerCase());
        const vus = new Set<string>();
        return lines.slice(1).map((line, index) => {
            const values = parseCsvLine(line, separateur);
            const draft: Partial<UserDraft> = {};
            headers.forEach((key, i) => {
                const v = values[i]?.trim();
                if (key.includes('nom') || key.includes('name')) draft.name = v;
                else if (key.includes('mail')) draft.email = v;
                else if (key.includes('role') || key.includes('rôle')) draft.role = v;
                else if (key.includes('depart') || key.includes('service')) draft.department = v;
            });
            const email = draft.email?.toLowerCase() ?? '';
            let error: string | undefined;
            if (!draft.name || !draft.email) error = 'Nom et adresse requis';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Adresse illisible';
            else if (users.some((u) => u.email.toLowerCase() === email))
                error = 'A déjà un compte à cette adresse';
            else if (vus.has(email)) error = 'Adresse en double dans le fichier';
            vus.add(email);
            return {
                line: index + 2,
                label: draft.name || '(sans nom)',
                error,
                value: error ? undefined : (draft as UserDraft),
            };
        });
    };

    /**
     * L'import écrit, ligne par ligne, par la même porte que la saisie : `addUser`.
     * Une ligne refusée par la règle est nommée, pas avalée. Lot 4, U2.
     */
    const handleImport = (drafts: UserDraft[]) => {
        let created = 0;
        const refused: string[] = [];
        for (const draft of drafts) {
            const role = ROLE_BY_CSV[(draft.role || '').trim().toLowerCase()] ?? defaultRole;
            const name = draft.name.trim();
            const user: User = {
                id: '', // posé par addUser
                name,
                email: draft.email.trim().toLowerCase(),
                role,
                department: draft.department?.trim() || '',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
                // Invité au sens d'authService : le mot de passe se définit à l'arrivée.
                status: 'pending',
                mustChangePassword: true,
                /* **Chaque ligne importée reçoit son lien**, comme une invitation à
                   l'unité (05.3) : le produit n'envoie pas de courriel. */
                invitedAt: new Date().toISOString(),
                invitedBy: currentUser?.name,
                invitationToken: `${Date.now().toString().slice(-4)}${Math.random().toString(16).slice(2, 10)}`,
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
        if (created > 0)
            showToast(
                `${created} personne${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} en attente.`,
                'success',
            );
        refused.forEach((r) => showToast(r, 'error'));
        if (created > 0 || refused.length === 0) onSave();
    };

    return (
        <ReferentialImportTemplate<UserDraft>
            title="Importer des utilisateurs"
            onCancel={onCancel}
            columns={COLUMNS}
            sample={SAMPLE}
            noun={{ one: 'personne', many: 'personnes' }}
            contractNote="Nom et adresse sont requis ; l'adresse sera l'identifiant de connexion."
            dropSubLabel="CSV, séparateur virgule ou point-virgule, encodage UTF-8"
            parse={parse}
            onImport={handleImport}
            reglages={
                /* Le rôle appliqué aux lignes sans colonne Role — après avoir vu qui
                   entre, pas avant (05.3). */
                <SelectField
                    label="Rôle des personnes retenues"
                    name="defaultRole"
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value as UserRole)}
                    options={ROLE_OPTIONS.filter(
                        (o) => o.value !== 'SuperAdmin' || currentUser?.role === 'SuperAdmin',
                    )}
                    supportingText="Une colonne Role renseignée l'emporte, ligne par ligne."
                />
            }
        />
    );
};

export default ImportUsersPage;
