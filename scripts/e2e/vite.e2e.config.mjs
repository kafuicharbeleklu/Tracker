/**
 * Le serveur des tests de bout en bout (`scripts/e2e/lancer.mjs`).
 *
 * La configuration du produit, plus une **file de demandes réaliste** injectée dans le jeu de
 * démonstration — seize demandes à chaque étape du parcours. Le jeu de démonstration seul n'en
 * porte qu'une : il ne permettrait d'éprouver ni l'enchaînement, ni le clavier, ni la
 * validation en lot de Tâches. L'injection ne vit qu'ici : le jeu du produit ne change pas.
 *
 * Firestore est coupé par le lanceur (`VITE_FIREBASE_DISABLED=true`) : les tests ne lisent ni
 * n'écrivent jamais la base.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Une date `n` jours avant le lancement : les âges restent ceux qu'on attend. */
const ilYa = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

// [id, demandeur, nom, rôle, bénéficiaire, nom, type, modèle, motif, urgence, statut, âge (j), coût]
const DEMANDES = [
    [
        '101',
        '4',
        'Ethan Employé',
        'User',
        '4',
        'Ethan Employé',
        'Laptop',
        'Dell Latitude 7440',
        'Portable actuel en fin de garantie, batterie HS',
        'high',
        'WAITING_IT_PROCESSING',
        1,
        1180,
    ],
    [
        '102',
        '5',
        'Abdoulaye Deen TOURE',
        'User',
        '5',
        'Abdoulaye Deen TOURE',
        'Monitor',
        'Dell P2723D',
        'Second écran pour la PAO',
        'normal',
        'WAITING_IT_PROCESSING',
        3,
        320,
    ],
    [
        '103',
        '8',
        'Fatou Support',
        'User',
        '8',
        'Fatou Support',
        'Headset',
        'Jabra Evolve2 65',
        'Casque cassé, support téléphonique',
        'high',
        'WAITING_IT_PROCESSING',
        0,
        210,
    ],
    [
        '104',
        '9',
        'Marc Finance',
        'User',
        '9',
        'Marc Finance',
        'Phone',
        'iPhone 15',
        'Astreinte clôture trimestrielle',
        'normal',
        'WAITING_IT_PROCESSING',
        6,
        890,
    ],
    [
        '105',
        '11',
        'Lea Marketing',
        'User',
        '11',
        'Lea Marketing',
        'Keyboard',
        'Logitech MX Keys',
        'Clavier azerty demandé',
        'low',
        'WAITING_IT_PROCESSING',
        12,
        110,
    ],
    [
        '106',
        '3',
        'Jane Manager',
        'Manager',
        '4',
        'Ethan Employé',
        'DockingStation',
        'Dell WD19S',
        'Pour le poste de Ethan en télétravail',
        'normal',
        'WAITING_IT_PROCESSING',
        9,
        240,
    ],
    [
        '107',
        '7',
        'Oumar Manager Dakar',
        'Manager',
        '8',
        'Fatou Support',
        'Laptop',
        'Lenovo ThinkPad T14',
        'Nouvelle recrue support Dakar',
        'high',
        'WAITING_IT_PROCESSING',
        2,
        1050,
    ],
    [
        '108',
        '4',
        'Ethan Employé',
        'User',
        '4',
        'Ethan Employé',
        'Mouse',
        'Logitech MX Master 3S',
        'Souris ergonomique',
        'low',
        'WAITING_MANAGER_APPROVAL',
        4,
        99,
    ],
    [
        '109',
        '5',
        'Abdoulaye Deen TOURE',
        'User',
        '5',
        'Abdoulaye Deen TOURE',
        'Laptop',
        'MacBook Pro 14"',
        'Montage vidéo',
        'normal',
        'WAITING_MANAGER_APPROVAL',
        7,
        2390,
    ],
    [
        '110',
        '8',
        'Fatou Support',
        'User',
        '8',
        'Fatou Support',
        'Monitor',
        'Dell P2423',
        'Écran principal défaillant',
        'normal',
        'WAITING_MANAGER_APPROVAL',
        15,
        260,
    ],
    [
        '111',
        '11',
        'Lea Marketing',
        'User',
        '11',
        'Lea Marketing',
        'Tablet',
        'iPad Air',
        'Salons et démos clients',
        'low',
        'WAITING_MANAGER_APPROVAL',
        21,
        780,
    ],
    [
        '112',
        '9',
        'Marc Finance',
        'User',
        '9',
        'Marc Finance',
        'Laptop',
        'Dell Latitude 7440',
        'Renouvellement programmé',
        'normal',
        'WAITING_DOTATION_APPROVAL',
        5,
        1180,
    ],
    [
        '113',
        '10',
        'Nora Finance Manager',
        'Manager',
        '10',
        'Nora Finance Manager',
        'Monitor',
        'Dell U2724D',
        'Double écran contrôle de gestion',
        'normal',
        'WAITING_DOTATION_APPROVAL',
        11,
        540,
    ],
    [
        '114',
        '4',
        'Ethan Employé',
        'User',
        '4',
        'Ethan Employé',
        'Headset',
        'Jabra Evolve2 55',
        'Casque réunion',
        'low',
        'PENDING_DELIVERY',
        2,
        180,
    ],
    [
        '115',
        '5',
        'Abdoulaye Deen TOURE',
        'User',
        '5',
        'Abdoulaye Deen TOURE',
        'Phone',
        'Samsung Galaxy S24',
        'Téléphone de terrain',
        'normal',
        'PENDING_DELIVERY',
        8,
        720,
    ],
    [
        '116',
        '6',
        'Clara Admin France',
        'Admin',
        '11',
        'Lea Marketing',
        'Laptop',
        'Dell Latitude 5450',
        'Remplacement après vol',
        'high',
        'PENDING_DELIVERY',
        1,
        980,
    ],
];

const echapper = (texte) => String(texte).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const approvals = DEMANDES.map(
    ([id, rq, rqn, rqr, be, ben, cat, mod, motif, urgence, statut, age, cout]) => `{
  id: '${id}', requesterId: '${rq}', requesterName: '${echapper(rqn)}', requesterRole: '${rqr}',
  beneficiaryId: '${be}', beneficiaryName: '${echapper(ben)}', isDelegated: ${rq !== be},
  equipmentCategory: '${cat}', equipmentModel: '${echapper(mod)}', reason: '${echapper(motif)}',
  urgency: '${urgence}', estimatedCost: ${cout}, status: '${statut}',
  createdAt: '${ilYa(age)}', updatedAt: '${ilYa(Math.max(0, age - 1))}',
  equipmentName: '${echapper(mod)}', equipmentType: '${cat}', requestType: 'Attribution',
  requester: '${echapper(rqn)}', requestDate: '${age}j', image: '',
}`,
).join(',\n');

const fileRealiste = {
    name: 'file-realiste',
    enforce: 'pre',
    transform(code, id) {
        if (!/src[\\/]data[\\/]mockData\.tsx$/.test(id)) return null;
        const marque = 'export const mockPendingApprovals: Approval[] = [';
        if (!code.includes(marque)) {
            throw new Error('scripts/e2e : mockPendingApprovals introuvable dans mockData.tsx');
        }
        return code.replace(marque, `${marque}\n${approvals},\n`);
    },
};

export default {
    root: racine,
    // Un cache à part : le serveur de développement du projet garde le sien.
    cacheDir: path.join(racine, 'node_modules/.vite-e2e'),
    plugins: [fileRealiste, react(), tailwindcss()],
    resolve: { alias: { '@': racine } },
    logLevel: 'warn',
};
