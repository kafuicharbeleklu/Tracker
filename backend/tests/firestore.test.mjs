/**
 * La poussée vers Firestore, contre l'émulateur :
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8086 npm run backend:test
 *
 * Sans émulateur déclaré, ces essais sont passés : ils n'écrivent jamais dans une vraie base.
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { demarrerLeServeur, lireLaConfiguration } from '../server.mjs';

const EMULATEUR = process.env.FIRESTORE_EMULATOR_HOST || '';
const CLE = 'cle-des-postes-pour-les-essais';
const CLE_ADMIN = 'cle-admin-pour-les-essais';
const muet = { log() {}, warn() {}, error() {} };

/* Une machine neuve à chaque passage : l'émulateur garde les précédentes. */
const SERIE = `ESSAI${randomBytes(4).toString('hex').toUpperCase()}`;
const MACHINE = `det_sn_${SERIE.toLowerCase()}`;

const poste = (plus = {}) => ({
    schema: 'neemba.agent.checkin.v1',
    generatedAt: new Date().toISOString(),
    source: 'agent',
    device: {
        machineName: `PC-${SERIE}`,
        hostname: `PC-${SERIE}`,
        serialNumber: SERIE,
        os: 'Windows 11 Pro 23H2',
        ramGb: 16,
        type: 'Laptop',
        model: 'Dell Latitude 7420',
        ...plus.device,
    },
    user: { name: 'k.mensah' },
    apps: { sentinelOne: true, matrix42: false, manageEngine: false },
    ...Object.fromEntries(Object.entries(plus).filter(([nom]) => nom !== 'device')),
});

describe(
    'La poussée vers Firestore',
    { skip: !EMULATEUR && 'FIRESTORE_EMULATOR_HOST absent' },
    () => {
        let serveur;
        let dossier;
        let base;
        let admin;
        let reglagesAvant;

        const monter = async () => {
            const config = {
                ...lireLaConfiguration({
                    NEEMBA_AGENT_API_KEY: CLE,
                    NEEMBA_ADMIN_API_KEY: CLE_ADMIN,
                    HOST: '127.0.0.1',
                    PORT: '0',
                    AGENT_SINK: 'firestore',
                }),
                dossier,
            };
            serveur = await demarrerLeServeur(config, { journaliser: muet });
        };

        const envoyer = async (corps) => {
            const reponse = await fetch(
                `http://127.0.0.1:${serveur.adresse().port}/api/agent/checkin`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': CLE },
                    body: JSON.stringify(corps),
                },
            );
            return { statut: reponse.status, corps: await reponse.json() };
        };

        /** L'écoute des réglages est asynchrone : on attend que le serveur ait suivi. */
        const jusquA = async (attendu, corps) => {
            for (let essai = 0; essai < 40; essai += 1) {
                const reponse = await envoyer(corps());
                if (reponse.statut === attendu) return reponse;
                await new Promise((suite) => setTimeout(suite, 150));
            }
            throw new Error(`Le serveur n'a jamais répondu ${attendu}.`);
        };

        before(async () => {
            const { initializeApp } = await import('firebase-admin/app');
            const { getFirestore } = await import('firebase-admin/firestore');
            admin = initializeApp({ projectId: 'tracker-c801e' }, `essai-${Date.now()}`);
            base = getFirestore(admin);
            reglagesAvant = (await base.doc('meta/settings').get()).data();
            dossier = await mkdtemp(join(tmpdir(), 'collecte-fs-'));
            await base
                .doc('meta/settings')
                .set({ autoCollectionAgentEnabled: false }, { merge: true });
            await monter();
        });

        after(async () => {
            await serveur?.fermer();
            if (reglagesAvant) await base.doc('meta/settings').set(reglagesAvant);
            const { deleteApp } = await import('firebase-admin/app');
            await deleteApp(admin);
            await rm(dossier, { recursive: true, force: true });
        });

        test('source éteinte dans les réglages : la remontée est refusée et rien n’est gardé', async () => {
            const reponse = await envoyer(poste());
            assert.equal(reponse.statut, 403);
            assert.equal(reponse.corps.code, 'source_inactive');
            assert.equal(serveur.registre.etat().machines, 0);
            assert.equal((await base.doc(`detectedDevices/${MACHINE}`).get()).exists, false);
        });

        test('un export d’annuaire passe, lui : il n’a pas d’interrupteur', async () => {
            const reponse = await envoyer({ source: 'active_directory', hostname: `SRV-${SERIE}` });
            assert.equal(reponse.statut, 201);
        });

        test('source allumée : la machine arrive dans `detectedDevices`, en attente', async () => {
            await base
                .doc('meta/settings')
                .set({ autoCollectionAgentEnabled: true }, { merge: true });
            const reponse = await jusquA(201, () => poste({ checkinId: `c1-${SERIE}` }));
            assert.equal(reponse.corps.machineId, MACHINE);
            await serveur.firestore.pousserMaintenant();

            const lu = (await base.doc(`detectedDevices/${MACHINE}`).get()).data();
            assert.equal(lu.status, 'pending_review');
            assert.equal(lu.source, 'agent');
            assert.equal(lu.machineName, `PC-${SERIE}`);
            assert.equal(lu.serialNumber, SERIE);
            assert.equal(lu.model, 'Dell Latitude 7420');
            assert.equal(lu.currentUserName, 'k.mensah');
            assert.deepEqual(lu.apps, { sentinelOne: true, matrix42: false, manageEngine: false });
            assert.equal(typeof lu.firstSeenAt, 'string');
            assert.equal(
                typeof lu._maj.toMillis(),
                'number',
                "l'écoute de l'application filtre sur _maj",
            );
            assert.equal(lu.matchConfidence, undefined, "le rapprochement reste à l'application");
            assert.equal(JSON.stringify(lu).includes(CLE), false);
        });

        test('la décision de l’informatique survit aux remontées suivantes', async () => {
            const document = base.doc(`detectedDevices/${MACHINE}`);
            const avant = (await document.get()).data();
            await document.set({ status: 'ignored', matchConfidence: 'none' }, { merge: true });

            const reponse = await envoyer(
                poste({ checkinId: `c2-${SERIE}`, device: { os: 'Windows 11 Pro 24H2' } }),
            );
            assert.equal(reponse.statut, 201);
            await serveur.firestore.pousserMaintenant();

            const apres = (await document.get()).data();
            assert.equal(apres.status, 'ignored');
            assert.equal(apres.matchConfidence, 'none');
            assert.equal(apres.os, 'Windows 11 Pro 24H2');
            assert.equal(apres.firstSeenAt, avant.firstSeenAt);
        });

        test('une remontée qui ne change rien n’écrit rien', async () => {
            const document = base.doc(`detectedDevices/${MACHINE}`);
            const avant = (await document.get()).data()._maj.toMillis();
            const reponse = await envoyer(
                poste({
                    checkinId: `c3-${SERIE}`,
                    device: { os: 'Windows 11 Pro 24H2', ipAddress: '10.0.0.77' },
                }),
            );
            assert.equal(reponse.statut, 201);
            await serveur.firestore.pousserMaintenant();
            assert.equal((await document.get()).data()._maj.toMillis(), avant);
        });

        test('le serveur se signale dans `meta/collecte`', async () => {
            const etat = (await base.doc('meta/collecte').get()).data();
            assert.equal(typeof etat.vuLe, 'string');
            assert.equal(typeof etat.version, 'string');
            assert.equal(typeof etat.machines, 'number');
        });

        test('registre perdu : la machine est complétée, pas recréée', async () => {
            await serveur.fermer();
            await unlink(join(dossier, 'agent-machines.json'));
            await monter();
            await serveur.firestore.pousserMaintenant();
            const lu = (await base.doc(`detectedDevices/${MACHINE}`).get()).data();
            assert.equal(lu.status, 'ignored');
            assert.equal(lu.os, 'Windows 11 Pro 24H2');
        });
    },
);
