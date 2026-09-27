/**
 * RESTAURER FIRESTORE — remettre la base dans l'état d'une sauvegarde.
 *
 *   node scripts/restaurer-firestore.mjs backups/<fichier>.json              aperçu
 *   node scripts/restaurer-firestore.mjs backups/<fichier>.json --confirmer  restauration
 *
 * La restauration **vide toute la base** (chaque collection racine, sous-collections comprises),
 * puis réécrit chaque document de la sauvegarde à l'identique, types compris (dates, références,
 * points, octets — voir `sauvegarder-firestore.mjs`). Le projet de la sauvegarde doit être celui
 * de la clé de service : on ne restaure pas une base dans une autre par mégarde.
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, initializeApp } from 'firebase-admin/app';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { ecrivainSurveille, sonderEcriture } from './lib/sonde-ecriture.mjs';
import { annoncerNouvelleGeneration } from './lib/generation.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [fichier] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const CONFIRMER = process.argv.includes('--confirmer');

if (!fichier) {
    console.error('Usage : node scripts/restaurer-firestore.mjs backups/<fichier>.json [--confirmer]');
    process.exit(1);
}

const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

const sauvegarde = JSON.parse(fs.readFileSync(path.resolve(fichier), 'utf8'));
if (sauvegarde.projet !== serviceAccount.project_id) {
    console.error(
        `Sauvegarde du projet « ${sauvegarde.projet} », clé de service de « ${serviceAccount.project_id} » : refusé.`,
    );
    process.exit(1);
}

/** Le JSON de la sauvegarde → des valeurs Firestore. */
const decoder = (valeur) => {
    if (Array.isArray(valeur)) return valeur.map(decoder);
    if (valeur && typeof valeur === 'object') {
        switch (valeur.__type) {
            case 'timestamp':
                return new Timestamp(valeur.seconds, valeur.nanoseconds);
            case 'geopoint':
                return new GeoPoint(valeur.latitude, valeur.longitude);
            case 'ref':
                return db.doc(valeur.path);
            case 'bytes':
                return Buffer.from(valeur.base64, 'base64');
            default:
                return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, decoder(v)]));
        }
    }
    return valeur;
};

const ecrireCollection = (ecrivain, reference, documents) => {
    let n = 0;
    for (const doc of documents) {
        ecrivain.set(reference.doc(doc.id), decoder(doc.data)).catch(() => {});
        n += 1;
        for (const [sous, docs] of Object.entries(doc.collections ?? {})) {
            n += ecrireCollection(ecrivain, reference.doc(doc.id).collection(sous), docs);
        }
    }
    return n;
};

const main = async () => {
    console.log(`Sauvegarde du ${sauvegarde.date} — projet ${sauvegarde.projet}, ${sauvegarde.total} documents :`);
    for (const [id, n] of Object.entries(sauvegarde.resume)) console.log(`  ${id.padEnd(24)} ${n}`);

    const actuelles = await db.listCollections();
    console.log('\nContenu actuel, qui serait supprimé :');
    for (const reference of actuelles) {
        console.log(`  ${reference.id.padEnd(24)} ${(await reference.count().get()).data().count}`);
    }

    if (!CONFIRMER) {
        console.log('\nAperçu seulement. Ajouter --confirmer pour restaurer.');
        return;
    }

    /* Avant de supprimer quoi que ce soit : peut-on réécrire ? (voir lib/sonde-ecriture.mjs) */
    const sonde = await sonderEcriture(serviceAccount);
    if (!sonde.ok) {
        console.error(`\nRien n’est supprimé : ${sonde.raison}`);
        process.exit(1);
    }

    console.log('\nVidage…');
    for (const reference of actuelles) await db.recursiveDelete(reference);

    console.log('Restauration…');
    const { ecrivain, bilan } = ecrivainSurveille(db);
    let ecrits = 0;
    for (const [id, documents] of Object.entries(sauvegarde.collections)) {
        ecrits += ecrireCollection(ecrivain, db.collection(id), documents);
    }
    await ecrivain.close();
    if (bilan.echecs > 0) {
        console.error(
            `\n${bilan.echecs} écriture(s) sur ${ecrits} refusée(s)${bilan.quotaEpuise ? ' — quota Firestore épuisé' : ''} : ${bilan.premiereErreur}`,
        );
        console.error('Relancer la restauration une fois la cause levée ; la sauvegarde reste intacte.');
        process.exit(1);
    }
    /* Les navigateurs gardent la base en cache : ils doivent tout relire. */
    await annoncerNouvelleGeneration(db, 'restauration d’une sauvegarde');

    console.log(`\n${ecrits} documents restaurés. Contrôle :`);
    const avaitSynchro = sauvegarde.collections.meta?.some((document) => document.id === 'synchro');
    for (const [id, enSauvegarde] of Object.entries(sauvegarde.resume)) {
        const n = (await db.collection(id).count().get()).data().count;
        /* L'annonce de génération ajoute `meta/synchro` quand la sauvegarde ne l'avait pas. */
        const attendu = id === 'meta' && !avaitSynchro ? enSauvegarde + 1 : enSauvegarde;
        console.log(`  ${n === attendu ? '✓' : '✗'} ${id.padEnd(24)} ${n} / ${attendu}`);
    }
};

main().catch((erreur) => {
    console.error('Restauration impossible :', erreur.message);
    process.exit(1);
});
