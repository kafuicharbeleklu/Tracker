import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

const collectionsToClear = [
    'detectedDevices',
    'categories',
    'models',
    'approvals',
    'events',
    'rbacRoles',
    'rbacGroups',
    'rbacWorkflows',
    'rbacAssignments',
    'financeExpenses',
    'financeBudgets',
];

const metaDocsToClear = ['settings', 'serviceManagers'];

function loadServiceAccount(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Service account file not found: ${filePath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
        throw new Error('Service account JSON is missing required fields.');
    }

    return serviceAccount;
}

function getAdminFirestore() {
    const serviceAccount = loadServiceAccount(serviceAccountPath);
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    }
    return getFirestore();
}

async function clearCollection(db, collectionName) {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
        return 0;
    }

    const writer = db.bulkWriter();
    snapshot.docs.forEach((documentSnapshot) => writer.delete(documentSnapshot.ref));
    await writer.close();
    return snapshot.size;
}

async function clearSeedUsers(db) {
    const snapshot = await db.collection('users').get();
    const seedDocs = snapshot.docs.filter((documentSnapshot) => {
        const email = String(documentSnapshot.data().email || '');
        return !email.toLowerCase().endsWith('@neemba.local');
    });

    if (seedDocs.length === 0) {
        return 0;
    }

    const writer = db.bulkWriter();
    seedDocs.forEach((documentSnapshot) => writer.delete(documentSnapshot.ref));
    await writer.close();
    return seedDocs.length;
}

async function clearSeedEquipment(db) {
    const snapshot = await db.collection('equipment').get();
    const seedDocs = snapshot.docs.filter((documentSnapshot) =>
        String(documentSnapshot.data().assetId || '').startsWith('ASSET-'),
    );

    if (seedDocs.length === 0) {
        return 0;
    }

    const writer = db.bulkWriter();
    seedDocs.forEach((documentSnapshot) => writer.delete(documentSnapshot.ref));
    await writer.close();
    return seedDocs.length;
}

async function run() {
    const db = getAdminFirestore();
    let deletedCount = 0;

    const seedUsersDeleted = await clearSeedUsers(db);
    console.log(`users(seed/test): ${seedUsersDeleted} document(s) deleted`);
    deletedCount += seedUsersDeleted;

    const seedEquipmentDeleted = await clearSeedEquipment(db);
    console.log(`equipment(seed/test): ${seedEquipmentDeleted} document(s) deleted`);
    deletedCount += seedEquipmentDeleted;

    for (const collectionName of collectionsToClear) {
        const count = await clearCollection(db, collectionName);
        console.log(`${collectionName}: ${count} document(s) deleted`);
        deletedCount += count;
    }

    for (const docId of metaDocsToClear) {
        await db.collection('meta').doc(docId).delete();
        console.log(`meta/${docId}: deleted`);
    }

    console.log(`Cleanup finished. Deleted ${deletedCount} document(s) from test collections.`);
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
