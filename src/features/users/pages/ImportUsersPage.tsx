import React, { useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
    type TableauImporte,
} from '../../../components/layout/ReferentialImportTemplate';
import SelectField from '../../../components/ui/SelectField';
import { buildCsvLine } from '../../../lib/csv';
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

/* Les colonnes se reconnaissent à leur nom, français compris (09/10). */
const COLUMNS: ImportColumn[] = [
    { key: 'Name', required: true, alias: ['Nom', 'Nom complet', 'Prénom et nom', 'Utilisateur'] },
    /* Les listes du personnel séparent le prénom du nom : « Nom », « Prénoms ». */
    { key: 'FirstName', alias: ['Prénom', 'Prénoms'] },
    { key: 'Email', required: true, alias: ['E-mail', 'Courriel', 'Mail', 'Adresse e-mail'] },
    { key: 'Role', alias: ['Rôle', 'Profil'] },
    { key: 'Department', alias: ['Service', 'Département', 'Direction'] },
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

    const parse = (tableau: TableauImporte): ImportCandidate<UserDraft>[] => {
        const vus = new Set<string>();
        return tableau.lignes.map((ligne) => {
            const prenom = ligne.get('FirstName');
            const nom = ligne.get('Name');
            const draft: UserDraft = {
                name: [prenom, nom].filter(Boolean).join(' '),
                email: ligne.get('Email'),
                role: ligne.get('Role'),
                department: ligne.get('Department'),
            };
            const email = draft.email.toLowerCase();
            let error: string | undefined;
            if (!draft.name || !draft.email) error = 'Nom et adresse requis';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Adresse illisible';
            else if (vus.has(email)) error = 'Adresse en double dans le fichier';
            /* Un compte existe : rien à corriger, et cela passe avant le doublon du fichier. */
            const ecartee =
                email && users.some((u) => u.email.toLowerCase() === email)
                    ? 'A déjà un compte'
                    : undefined;
            if (ecartee) error = undefined;
            vus.add(email);
            const roleInconnu =
                draft.role && !ROLE_BY_CSV[draft.role.trim().toLowerCase()]
                    ? `Rôle « ${draft.role} » inconnu — rôle par défaut appliqué`
                    : undefined;
            return {
                line: ligne.line,
                label: draft.name || '(sans nom)',
                error,
                ecartee,
                remarque: error || ecartee ? undefined : roleInconnu,
                value: error || ecartee ? undefined : draft,
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
            dropSubLabel="CSV ou Excel · une ligne par personne"
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
