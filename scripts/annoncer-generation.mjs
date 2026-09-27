/**
 * ANNONCER UNE NOUVELLE GÉNÉRATION — chaque navigateur relira la base en entier à sa prochaine
 * ouverture, au lieu de ne relire que ce qui a changé.
 *
 *   node scripts/annoncer-generation.mjs "retouche dans la console"
 *
 * À lancer après une modification faite hors de l'application et hors des scripts du dépôt
 * (console Firebase, outil tiers) : ces écritures ne posent pas `_maj`, et les caches des
 * navigateurs ne les verraient qu'à leur expiration (7 jours). Une écriture, et à la prochaine
 * ouverture de chaque appareil, une lecture complète.
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { annoncerNouvelleGeneration } from './lib/generation.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motif = process.argv.slice(2).join(' ').trim() || 'annonce manuelle';

const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });

const generation = await annoncerNouvelleGeneration(getFirestore(), motif);
console.log(`Génération ${generation} annoncée (${motif}).`);
