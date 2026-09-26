/**
 * CHARGER LA SIMULATION — remplacer tout le contenu de Firestore par le jeu de simulation.
 *
 *   node scripts/simulation/charger.mjs              aperçu : ce qui serait supprimé et écrit
 *   node scripts/simulation/charger.mjs --confirmer  vide la base, puis charge le jeu
 *
 * Garde-fous :
 * - refuse de vider la base sans une sauvegarde du même projet dans `backups/`
 *   (`node scripts/sauvegarder-firestore.mjs`), et **sans avoir vérifié qu'il peut écrire** : le
 *   26/09, le quota d'écritures était épuisé, la base a été vidée et rien n'a pu être réécrit ;
 * - vérifie la cohérence du jeu avant d'écrire quoi que ce soit (identifiants uniques,
 *   références entre personnes, demandes et objets, aucun objet « en attente » orphelin —
 *   que l'application « réparerait » en écrivant dès son premier chargement) ;
 * - écarte tout nom de personne présent dans la base réelle ou sa sauvegarde ;
 * - conserve les réglages de l'organisation (`meta/settings`) : c'est de la configuration. Absents
 *   de la base, ils sont repris dans la dernière sauvegarde.
 *
 * Retour arrière : `node scripts/restaurer-firestore.mjs backups/<fichier>.json --confirmer`.
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { build } from 'esbuild';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ecrivainSurveille, sonderEcriture } from '../lib/sonde-ecriture.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(ici, '../..');
const CONFIRMER = process.argv.includes('--confirmer');

const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const sansAccent = (texte) =>
    String(texte || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

/** Compile le générateur TypeScript (types et règles de l'application compris). */
const chargerGenerateur = async () => {
    const sortie = path.join(ici, '.jeu.mjs');
    await build({
        entryPoints: [path.join(ici, 'jeu.ts')],
        bundle: true,
        platform: 'node',
        format: 'esm',
        packages: 'external',
        outfile: sortie,
        logLevel: 'error',
    });
    return import(`${pathToFileURL(sortie).href}?v=${Date.now()}`);
};

/** Les noms réels à ne jamais reproduire : la base actuelle et la dernière sauvegarde. */
const nomsReels = async () => {
    const noms = new Set();
    const actuels = await db.collection('users').get();
    actuels.docs.forEach((doc) => noms.add(sansAccent(doc.data().name)));
    const dossier = path.join(projectRoot, 'backups');
    const sauvegardes = fs.existsSync(dossier)
        ? fs.readdirSync(dossier).filter((f) => f.startsWith(`firestore-${serviceAccount.project_id}-`))
        : [];
    for (const fichier of sauvegardes) {
        const contenu = JSON.parse(fs.readFileSync(path.join(dossier, fichier), 'utf8'));
        for (const doc of contenu.collections?.users ?? []) noms.add(sansAccent(doc.data?.name));
    }
    return { noms, sauvegardes };
};

/** La cohérence du jeu, avant toute écriture. */
const verifier = (jeu) => {
    const erreurs = [];
    for (const [collection, docs] of Object.entries(jeu)) {
        const ids = docs.map((d) => d.id);
        if (new Set(ids).size !== ids.length) erreurs.push(`${collection} : identifiants en double`);
        if (ids.some((id) => /^\d+$/.test(id) && Number(id) <= 14)) {
            erreurs.push(`${collection} : identifiant du jeu de démonstration (l'application l'écarterait)`);
        }
    }
    const personnes = new Map(jeu.users.map((d) => [d.id, d.data]));
    const objets = new Map(jeu.equipment.map((d) => [d.id, d.data]));
    for (const { data: p } of jeu.users) {
        if (p.managerId && !personnes.has(p.managerId)) erreurs.push(`personne ${p.id} : manager inconnu`);
    }
    for (const { data: o } of jeu.equipment) {
        if (o.user?.id && !personnes.has(o.user.id)) erreurs.push(`objet ${o.id} : porteur inconnu`);
    }
    const actives = new Set(['WAITING_MANAGER_APPROVAL', 'WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY']);
    const reclames = new Set();
    for (const { data: d } of jeu.approvals) {
        if (!personnes.has(d.beneficiaryId)) erreurs.push(`demande ${d.id} : bénéficiaire inconnu`);
        if (!personnes.has(d.requesterId)) erreurs.push(`demande ${d.id} : demandeur inconnu`);
        if (d.assignedEquipmentId && !objets.has(d.assignedEquipmentId)) erreurs.push(`demande ${d.id} : objet inconnu`);
        if (actives.has(d.status) && d.assignedEquipmentId) reclames.add(d.assignedEquipmentId);
    }
    for (const { data: o } of jeu.equipment) {
        if (o.status === 'En attente' && actives.has(o.assignmentStatus) && !reclames.has(o.id)) {
            erreurs.push(`objet ${o.id} : en attente sans demande (l'application le libérerait)`);
        }
    }
    return erreurs;
};

const main = async () => {
    const { construireJeu } = await chargerGenerateur();
    const { noms, sauvegardes } = await nomsReels();
    const jeu = construireJeu({ maintenant: new Date(), nomsInterdits: noms });

    const erreurs = verifier(jeu);
    const reutilises = jeu.users.filter((d) => noms.has(sansAccent(d.data.name)));
    if (reutilises.length) erreurs.push(`${reutilises.length} nom(s) de personne réelle dans le jeu`);

    const existantes = await db.listCollections();
    console.log(`Projet : ${serviceAccount.project_id}`);
    console.log('\nÀ supprimer (contenu actuel) :');
    for (const reference of existantes) {
        const n = (await reference.count().get()).data().count;
        console.log(`  ${reference.id.padEnd(22)} ${n}${reference.id === 'meta' ? '  (meta/settings conservé)' : ''}`);
    }
    console.log('\nÀ écrire (jeu de simulation) :');
    for (const [collection, docs] of Object.entries(jeu)) console.log(`  ${collection.padEnd(22)} ${docs.length}`);

    if (erreurs.length) {
        console.error('\nJeu incohérent — rien n’est écrit :');
        erreurs.slice(0, 30).forEach((e) => console.error(`  ✗ ${e}`));
        process.exit(1);
    }
    console.log('\n✓ Jeu cohérent.');

    if (!CONFIRMER) {
        console.log('Aperçu seulement. Ajouter --confirmer pour vider la base et charger le jeu.');
        return;
    }
    if (sauvegardes.length === 0) {
        console.error('Aucune sauvegarde de ce projet dans backups/ : lancer d’abord scripts/sauvegarder-firestore.mjs.');
        process.exit(1);
    }

    /* Avant de supprimer quoi que ce soit : peut-on réécrire ? */
    const sonde = await sonderEcriture(serviceAccount);
    if (!sonde.ok) {
        console.error(`\nRien n’est supprimé : ${sonde.raison}`);
        process.exit(1);
    }

    /* Les réglages : ceux de la base, ou à défaut ceux de la dernière sauvegarde. */
    const enBase = await db.collection('meta').doc('settings').get();
    let reglages = enBase.exists ? enBase.data() : null;
    if (!reglages) {
        const derniere = sauvegardes.sort().at(-1);
        const contenu = JSON.parse(fs.readFileSync(path.join(projectRoot, 'backups', derniere), 'utf8'));
        reglages = contenu.collections?.meta?.find((doc) => doc.id === 'settings')?.data ?? null;
        if (reglages) console.log(`Réglages repris de la sauvegarde ${derniere}.`);
    }

    console.log('\nVidage…');
    for (const reference of existantes) await db.recursiveDelete(reference);

    console.log('Chargement…');
    const { ecrivain, bilan } = ecrivainSurveille(db);
    let envoyes = 0;
    const ecrire = (reference, donnees) => {
        /* Une écriture refusée est comptée par le bilan ; sa promesse ne doit pas faire tomber
           le script (c'est ce qui l'avait arrêté net le 26/09). */
        ecrivain.set(reference, donnees).catch(() => {});
        envoyes += 1;
    };
    for (const [collection, docs] of Object.entries(jeu)) {
        for (const doc of docs) {
            ecrire(db.collection(collection).doc(doc.id), JSON.parse(JSON.stringify(doc.data)));
        }
    }
    if (reglages) ecrire(db.collection('meta').doc('settings'), reglages);
    await ecrivain.close();

    if (bilan.echecs > 0) {
        console.error(
            `\n${bilan.echecs} écriture(s) sur ${envoyes} refusée(s)${bilan.quotaEpuise ? ' — quota Firestore épuisé' : ''} : ${bilan.premiereErreur}`,
        );
        console.error('Relancer le chargement une fois la cause levée ; la sauvegarde reste intacte.');
        process.exit(1);
    }

    console.log(`\n${envoyes} documents écrits. Contrôle :`);
    for (const collection of [...Object.keys(jeu)]) {
        const n = (await db.collection(collection).count().get()).data().count;
        const attendu = jeu[collection].length + (collection === 'meta' && reglages ? 1 : 0);
        console.log(`  ${n === attendu ? '✓' : '✗'} ${collection.padEnd(22)} ${n} / ${attendu}`);
    }
};

main().catch((erreur) => {
    console.error('Chargement impossible :', erreur.message);
    process.exit(1);
});
