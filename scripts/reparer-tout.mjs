import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * REMETTRE FIRESTORE D'APLOMB — une commande, dans l'ordre.
 *
 * Pourquoi une commande et pas trois
 * ------------------------------------------------------------------
 * La réparation n'a de sens que faite **entièrement** : vider les collections dérivées
 * sans réécrire l'inventaire laisse une base sans référentiel ; réécrire l'inventaire
 * sans vider les demandes laisse les tâches de démonstration en place. Trois commandes
 * à retenir, c'est trois occasions d'en oublier une.
 *
 * Ce qu'elle fait
 * ------------------------------------------------------------------
 * 1. **Elle vérifie que Firestore répond.** Le quota quotidien du plan gratuit s'épuise,
 *    et il refuse alors lectures comme écritures : mieux vaut le dire d'emblée que
 *    d'échouer à mi-chemin.
 * 2. **Elle vide les collections dérivées** — demandes, journal, référentiels, RBAC,
 *    finances. Ce sont elles qui portent les résidus de démonstration : les neuf
 *    demandes « Demande: Headset », les événements de test.
 * 3. **Elle relance l'import de l'inventaire**, qui vide et réécrit `users`,
 *    `equipment`, `categories`, `models` et les emplacements depuis le tableur.
 * 4. **Elle importe le budget** de l'exercice.
 * 5. **Elle recompte** ce qui est en base, pour qu'on voie le résultat.
 *
 * Sans `--apply`, elle ne fait que dire ce qu'elle ferait.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

/**
 * Les collections **dérivées** : elles se recalculent, ou n'ont de sens que rattachées à
 * un inventaire. Ce sont elles qui portent les résidus de démonstration.
 *
 * Les quatre collections `rbac*` en sont sorties le 07/09 : ce sont des **définitions de
 * droits**, c'est-à-dire de la configuration. Les vider a mis toutes les pages du produit
 * sur « Accès refusé », sans écran pour rouvrir quoi que ce soit. Elles ne contiennent
 * aucune donnée de démonstration à retirer — seulement les rôles du système.
 */
const COLLECTIONS_DERIVEES = ['approvals', 'events', 'detectedDevices', 'financeExpenses'];

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
    let lot = db.batch();
    let compte = 0;
    for (const document of instantane.docs) {
        lot.delete(document.ref);
        compte += 1;
        if (compte % 400 === 0) {
            await lot.commit();
            lot = db.batch();
        }
    }
    await lot.commit();
    return instantane.size;
}

function lancer(script, args = []) {
    console.log(`\n▸ node scripts/${script} ${args.join(' ')}`);
    const resultat = spawnSync('node', [path.join(__dirname, script), ...args], {
        stdio: 'inherit',
        cwd: projectRoot,
    });
    if (resultat.status !== 0) {
        throw new Error(`${script} a échoué (code ${resultat.status}).`);
    }
}

async function run() {
    const db = firestoreAdmin();

    console.log(applique ? '— Réparation complète (écriture)' : '— Simulation (sans --apply)\n');

    try {
        await db.collection('equipment').limit(1).get();
    } catch (error) {
        if (error.code === 8) {
            console.log('QUOTA ÉPUISÉ — Firestore refuse lectures et écritures.');
            console.log('Il se remet à zéro chaque jour à minuit, heure du Pacifique.');
            console.log('Relancez cette commande après.');
            process.exitCode = 1;
            return;
        }
        throw error;
    }

    if (!applique) {
        for (const nom of [...COLLECTIONS_DERIVEES, 'users', 'equipment', 'categories', 'models']) {
            const instantane = await db.collection(nom).get();
            console.log(`${nom.padEnd(18)} ${String(instantane.size).padStart(4)} documents`);
        }
        console.log('\nRien n’a été écrit. Ajoutez --apply pour exécuter.');
        return;
    }

    console.log('\n1 · Vider les collections dérivées');
    for (const nom of COLLECTIONS_DERIVEES) {
        const supprimes = await viderCollection(db, nom);
        console.log(`  ${nom.padEnd(18)} ${String(supprimes).padStart(4)} supprimés`);
    }

    console.log('\n2 · Réécrire l’inventaire depuis le tableur');
    lancer('import-inventory.mjs');

    console.log('\n3 · Importer le budget');
    lancer('import-budget.mjs');

    console.log('\n4 · Recompte');
    for (const nom of ['users', 'equipment', 'categories', 'models', 'approvals', 'financeBudgets']) {
        const instantane = await db.collection(nom).get();
        console.log(`  ${nom.padEnd(18)} ${String(instantane.size).padStart(4)} documents`);
    }

    console.log('\nFait. Videz le stockage local du navigateur pour relire la base.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
