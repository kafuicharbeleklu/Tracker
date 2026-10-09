/**
 * Les tests de bout en bout des gestes : `npm run qa:e2e` (toutes les suites), ou
 * `npm run qa:e2e -- taches clavier` (les suites nommées).
 *
 * Le lanceur démarre son propre serveur (`vite.e2e.config.mjs`, Firestore coupé), ouvre
 * chaque suite dans un navigateur neuf, et sort en échec dès qu'une vérification échoue.
 * Les captures des écrans fautifs vont dans `docs/.tmp/e2e/` (ignoré par git).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { creerBilan } from './outils.mjs';
import clavier from './clavier.mjs';
import imports from './imports.mjs';
import scan from './scan.mjs';
import selection from './selection.mjs';
import taches from './taches.mjs';

const SUITES = { taches, selection, clavier, imports, scan };
const HOTE = '127.0.0.1';
const PORT = Number(process.env.E2E_PORT ?? 4176);
const BASE = `http://${HOTE}:${PORT}`;
const VITE = path.resolve('node_modules/vite/bin/vite.js');
const CONFIG = path.resolve('scripts/e2e/vite.e2e.config.mjs');

const demandees = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const inconnues = demandees.filter((nom) => !SUITES[nom]);
if (inconnues.length) {
    process.stderr.write(
        `Suite inconnue : ${inconnues.join(', ')}. Suites : ${Object.keys(SUITES).join(', ')}\n`,
    );
    process.exit(2);
}
const aLancer = demandees.length ? demandees : Object.keys(SUITES);

const attendreLeServeur = async (adresse, delai = 120_000) => {
    const debut = Date.now();
    while (Date.now() - debut < delai) {
        try {
            if ((await fetch(adresse)).ok) return;
        } catch {
            // Pas encore levé.
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`Le serveur ne répond pas sur ${adresse}`);
};

const serveur = spawn(
    process.execPath,
    [VITE, '--config', CONFIG, '--host', HOTE, '--port', String(PORT), '--strictPort'],
    {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, VITE_FIREBASE_DISABLED: 'true' },
    },
);
serveur.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
serveur.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));

const { ok, resultats } = creerBilan();
let navigateur;
let plantage = null;
try {
    await attendreLeServeur(BASE);
    navigateur = await chromium.launch();
    /* **Chauffer le serveur avant la première suite** (09/10). Le premier chargement compile
       l'application à la demande ; sur une machine lente il dépassait les 180 s de la suite
       passée en tête, qui échouait pour une raison étrangère à ce qu'elle vérifie — une fois
       « tâches », une fois « sélection », jamais la même. */
    const chauffe = await navigateur.newPage();
    await chauffe.goto(`${BASE}/#/login`, { timeout: 600_000 }).catch(() => {});
    await chauffe
        /* `:visible` — la liste des comptes existe deux fois dans la page, une masquée. */
        .locator('[aria-label^="Connexion démo"]:visible')
        .first()
        .waitFor({ timeout: 300_000 })
        .catch(() => {});
    await chauffe.close();
    for (const nom of aLancer) {
        process.stdout.write(`\n— ${nom} —\n`);
        try {
            await SUITES[nom](navigateur, BASE, ok);
        } catch (erreur) {
            // Une suite qui plante compte pour un échec, et les suivantes tournent quand même.
            ok(nom, 'la suite va au bout', false, erreur.message.split('\n')[0]);
        }
    }
} catch (erreur) {
    plantage = erreur;
} finally {
    await navigateur?.close();
    serveur.kill();
}

const echecs = resultats.filter((r) => !r.verdict);
process.stdout.write(
    `\n${resultats.length - echecs.length}/${resultats.length} vérifications passent.\n`,
);
if (plantage) process.stderr.write(`Lancement impossible : ${plantage.message}\n`);
for (const r of echecs) process.stdout.write(`  ✗ [${r.suite}] ${r.nom.trim()}\n`);
process.exit(plantage || echecs.length ? 1 : 0);
