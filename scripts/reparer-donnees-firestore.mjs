import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * RÉPARER LES DONNÉES DE FIRESTORE — remettre le tableur au poste de vérité.
 *
 * Ce que ce script répare, et pourquoi il a fallu l'écrire (06/09/2026)
 * ------------------------------------------------------------------------
 * L'import initial vide `users` et `equipment` avant d'écrire : après lui, Firestore ne
 * contenait que les 243 lignes du tableur de Neemba Togo. Les données de démonstration
 * y sont revenues **ensuite**, écrites par l'application elle-même : quand Firestore ne
 * répond pas — quota épuisé, réseau coupé —, l'hydratation laisse le jeu de
 * démonstration en place, et l'effet de persistance l'écrivait dans la base. Ethan
 * Employé et LPT-DK-03 ont ainsi rejoint l'inventaire réel, d'où les résidus dans
 * « À traiter », « Tâches » et « Équipements ».
 *
 * Le code ne le refera plus (`DataContext` n'écrit plus le seed, et n'écrit que ce qui
 * a changé). Ce script nettoie ce qui est déjà passé.
 *
 * Ce qu'il fait, dans cet ordre
 * ------------------------------------------------------------------------
 * 1. Vide les collections dérivées — demandes, journal, référentiel, RBAC, finances :
 *    elles se reconstruisent à l'usage et ne portent aucune donnée du tableur.
 * 2. Laisse `users` et `equipment` à l'import, qui est leur source : relancer
 *    `import-inventory.mjs` juste après remet exactement le contenu du tableur.
 *
 * Il ne s'exécute pas sans `--apply` : par défaut il annonce ce qu'il ferait.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

/** Ce qui se reconstruit à l'usage, et ne vient jamais du tableur. */
const COLLECTIONS_DERIVEES = [
    'approvals',
    'events',
    'detectedDevices',
    'categories',
    'models',
    'rbacRoles',
    'rbacGroups',
    'rbacWorkflows',
    'rbacAssignments',
    'financeBudgets',
    'financeExpenses',
];

/** Ce que le tableur produit — laissé à `import-inventory.mjs`. */
const COLLECTIONS_DU_TABLEUR = ['users', 'equipment'];

const applique = process.argv.includes('--apply');

function firestoreAdmin() {
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Clé de service introuvable : ${serviceAccountPath}`);
    }
    const compte = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!getApps().length) {
        initializeApp({ credential: cert(compte), projectId: compte.project_id });
    }
    return getFirestore();
}

async function viderCollection(db, nom) {
    const instantane = await db.collection(nom).get();
    if (instantane.empty) return 0;
    let ecrites = 0;
    let lot = db.batch();
    for (const document of instantane.docs) {
        lot.delete(document.ref);
        ecrites += 1;
        if (ecrites % 400 === 0) {
            await lot.commit();
            lot = db.batch();
        }
    }
    await lot.commit();
    return instantane.size;
}

async function run() {
    const db = firestoreAdmin();

    console.log(applique ? '— Réparation (écriture)' : '— Réparation (simulation, sans --apply)');
    console.log('');

    for (const nom of COLLECTIONS_DU_TABLEUR) {
        try {
            const instantane = await db.collection(nom).get();
            console.log(
                `${nom.padEnd(18)} ${String(instantane.size).padStart(4)} documents — laissés à l'import`,
            );
        } catch (error) {
            console.log(`${nom.padEnd(18)} — illisible : ${error.code} ${error.message}`);
            if (error.code === 8) {
                console.log('');
                console.log(
                    'QUOTA ÉPUISÉ. Firestore refuse lectures et écritures jusqu’à la remise à zéro',
                );
                console.log(
                    'quotidienne (minuit, heure du Pacifique). Relancez ce script après.',
                );
                process.exitCode = 1;
                return;
            }
        }
    }

    console.log('');
    for (const nom of COLLECTIONS_DERIVEES) {
        try {
            if (!applique) {
                const instantane = await db.collection(nom).get();
                console.log(
                    `${nom.padEnd(18)} ${String(instantane.size).padStart(4)} documents — à vider`,
                );
                continue;
            }
            const supprimes = await viderCollection(db, nom);
            console.log(`${nom.padEnd(18)} ${String(supprimes).padStart(4)} documents supprimés`);
        } catch (error) {
            console.log(`${nom.padEnd(18)} — refusé : ${error.code} ${error.message}`);
        }
    }

    console.log('');
    console.log(
        applique
            ? 'Fait. Relancez ensuite : node scripts/import-inventory.mjs'
            : 'Rien n’a été écrit. Ajoutez --apply pour exécuter.',
    );
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
