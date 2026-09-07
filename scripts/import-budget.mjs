import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import XLSX from 'xlsx';

/**
 * IMPORT DU BUDGET — « Budget 2026 - Togo.xlsx » vers Firestore.
 *
 * Ce que le tableur porte
 * ------------------------------------------------------------------
 * Une feuille **Budget** de 15 lignes de dépense prévue, plus une seizième qui n'est
 * pas une ligne : c'est le **total**, reconnaissable à sa catégorie vide. La lire comme
 * une ligne doublait l'exercice — 85,4 M au lieu de 42,7 M.
 *
 * Une feuille **Références** : des listes de saisie (catégories, sociétés, sites,
 * fournisseurs) qui ne décrivent pas ce budget-ci. Elle n'est pas importée.
 *
 * Ce qui est écrit
 * ------------------------------------------------------------------
 * Un document `financeBudgets/2026`, avec une **enveloppe par catégorie et par nature**
 * (CAPEX / OPEX) : c'est la maille que l'écran des finances additionne et affiche. La
 * désignation de chaque ligne est conservée dans `detail`, pour que l'enveloppe puisse
 * dire ce qu'elle recouvre plutôt que de rester un chiffre nu.
 *
 * `spent` vaut zéro : **rien n'a encore été dépensé**, et un budget prévisionnel ne
 * doit pas se présenter comme consommé. Les dépenses réelles entrent par le journal
 * (15.2), pas par ce fichier.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const workbookPath = path.join(projectRoot, 'Budget 2026 - Togo.xlsx');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

const EXERCICE = 2026;
const dryRun = process.argv.includes('--dry-run');

/** La nature comptable de la ligne, telle que l'écran des finances la nomme. */
function natureDeLaDepense(designation, categorie) {
    const texte = `${designation} ${categorie}`.toLowerCase();
    if (texte.includes('maintenance')) return 'Maintenance';
    if (texte.includes('abonnement') || texte.includes('licence') || texte.includes('sage'))
        return 'License';
    if (texte.includes('forfait') || texte.includes('lien internet') || texte.includes('cloud'))
        return 'Service';
    return 'Purchase';
}

function lireLignes() {
    const wb = XLSX.readFile(workbookPath);
    const feuille = wb.Sheets['Budget'];
    if (!feuille) throw new Error('Feuille « Budget » introuvable.');

    return XLSX.utils
        .sheet_to_json(feuille, { defval: '' })
        .map((row) => ({
            categorie: String(row['Catégorie'] || '').trim(),
            designation: String(row['Désignation'] || '').trim(),
            capitalisation: String(row['OPEX/CAPEX'] || '').trim().toUpperCase(),
            site: String(row['Site'] || '').trim(),
            societe: String(row['Société'] || '').trim(),
            prixUnitaire: Number(row[' Prix unitaire '] ?? row['Prix unitaire'] ?? 0) || 0,
            quantite: Number(row['Quantité'] ?? 0) || 0,
            total: Number(row[' Total '] ?? row['Total'] ?? 0) || 0,
            commentaire: String(row['Commentaire'] || '').trim(),
        }))
        /* La ligne de total n'a ni catégorie ni désignation : elle n'est pas une ligne. */
        .filter((ligne) => ligne.categorie && ligne.designation && ligne.total > 0);
}

function construireBudget(lignes) {
    const enveloppes = new Map();

    for (const ligne of lignes) {
        const capitalisation = ligne.capitalisation === 'CAPEX' ? 'CAPEX' : 'OPEX';
        const type = natureDeLaDepense(ligne.designation, ligne.categorie);
        const cle = `${ligne.categorie}::${capitalisation}`;

        if (!enveloppes.has(cle)) {
            enveloppes.set(cle, {
                category: ligne.categorie,
                type,
                capitalization: capitalisation,
                allocated: 0,
                spent: 0,
                detail: [],
            });
        }

        const enveloppe = enveloppes.get(cle);
        enveloppe.allocated += ligne.total;
        enveloppe.detail.push(
            ligne.quantite > 1
                ? `${ligne.designation} (${ligne.quantite} × ${ligne.prixUnitaire.toLocaleString('fr-FR')})`
                : ligne.designation,
        );
    }

    const items = Array.from(enveloppes.values())
        .map((enveloppe) => ({ ...enveloppe, detail: enveloppe.detail.join(' · ') }))
        .sort((a, b) => b.allocated - a.allocated);

    return {
        year: EXERCICE,
        status: 'En cours',
        totalAllocated: items.reduce((somme, item) => somme + item.allocated, 0),
        items,
        updatedAt: new Date().toISOString(),
        sourceFileName: path.basename(workbookPath),
    };
}

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

async function run() {
    const lignes = lireLignes();
    const budget = construireBudget(lignes);

    console.log(`Lignes retenues : ${lignes.length}`);
    console.log(`Enveloppes      : ${budget.items.length}`);
    console.log(`Total alloué    : ${budget.totalAllocated.toLocaleString('fr-FR')} XOF`);
    for (const item of budget.items) {
        console.log(
            `  ${item.category.padEnd(16)} ${item.capitalization.padEnd(6)} ${String(item.allocated).padStart(9)}  ${item.detail.slice(0, 60)}`,
        );
    }

    if (dryRun) {
        const sortie = path.join(projectRoot, 'backend', 'data', 'budget-import-preview.json');
        fs.mkdirSync(path.dirname(sortie), { recursive: true });
        fs.writeFileSync(sortie, JSON.stringify(budget, null, 2), 'utf8');
        console.log(`\nAperçu écrit dans ${sortie} — rien n'a été envoyé.`);
        return;
    }

    const db = firestoreAdmin();
    await db.collection('financeBudgets').doc(String(EXERCICE)).set(budget, { merge: false });
    console.log(`\nExercice ${EXERCICE} enregistré.`);
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
