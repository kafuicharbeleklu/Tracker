/**
 * SAUVEGARDER FIRESTORE — toute la base, dans un fichier JSON.
 *
 *   node scripts/sauvegarder-firestore.mjs
 *
 * Exporte chaque collection racine, chaque document et ses sous-collections, en gardant les
 * types de Firestore (dates, références, points, octets) sous une forme que
 * `scripts/restaurer-firestore.mjs` sait réécrire à l'identique.
 *
 * Le fichier va dans `backups/` (hors de Git : il contient des données personnelles).
 * La clé de service : `FIREBASE_ADMIN_CREDENTIALS`, ou le fichier à la racine du projet.
 * Lecture seule : ce script n'écrit rien dans la base.
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, initializeApp } from 'firebase-admin/app';
import { DocumentReference, GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

/** Une valeur Firestore → du JSON sans perte de type. */
const encoder = (valeur) => {
    if (valeur instanceof Timestamp) {
        return { __type: 'timestamp', seconds: valeur.seconds, nanoseconds: valeur.nanoseconds };
    }
    if (valeur instanceof GeoPoint) {
        return { __type: 'geopoint', latitude: valeur.latitude, longitude: valeur.longitude };
    }
    if (valeur instanceof DocumentReference) return { __type: 'ref', path: valeur.path };
    if (Buffer.isBuffer(valeur) || valeur instanceof Uint8Array) {
        return { __type: 'bytes', base64: Buffer.from(valeur).toString('base64') };
    }
    if (Array.isArray(valeur)) return valeur.map(encoder);
    if (valeur && typeof valeur === 'object') {
        return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, encoder(v)]));
    }
    return valeur;
};

/** Une collection et, récursivement, les sous-collections de ses documents. */
const exporterCollection = async (reference) => {
    const instantane = await reference.get();
    const documents = [];
    for (const doc of instantane.docs) {
        const sousCollections = {};
        for (const sous of await doc.ref.listCollections()) {
            sousCollections[sous.id] = await exporterCollection(sous);
        }
        documents.push({
            id: doc.id,
            data: encoder(doc.data()),
            ...(Object.keys(sousCollections).length ? { collections: sousCollections } : {}),
        });
    }
    return documents;
};

const compter = (documents) =>
    documents.reduce(
        (n, doc) =>
            n +
            1 +
            Object.values(doc.collections ?? {}).reduce((m, sous) => m + compter(sous), 0),
        0,
    );

const main = async () => {
    const collections = {};
    for (const reference of await db.listCollections()) {
        collections[reference.id] = await exporterCollection(reference);
    }

    const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
    const dossier = path.join(projectRoot, 'backups');
    fs.mkdirSync(dossier, { recursive: true });
    const fichier = path.join(dossier, `firestore-${serviceAccount.project_id}-${horodatage}.json`);

    const resume = Object.fromEntries(
        Object.entries(collections).map(([id, docs]) => [id, compter(docs)]),
    );
    const total = Object.values(resume).reduce((a, b) => a + b, 0);
    fs.writeFileSync(
        fichier,
        JSON.stringify(
            { projet: serviceAccount.project_id, date: new Date().toISOString(), resume, total, collections },
            null,
            1,
        ),
    );

    console.log(`Sauvegarde : ${path.relative(projectRoot, fichier)}`);
    for (const [id, n] of Object.entries(resume)) console.log(`  ${id.padEnd(24)} ${n}`);
    console.log(`  ${'TOTAL'.padEnd(24)} ${total}`);
};

main().catch((erreur) => {
    console.error('Sauvegarde impossible :', erreur.message);
    process.exit(1);
});
