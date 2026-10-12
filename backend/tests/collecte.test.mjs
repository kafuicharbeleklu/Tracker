/**
 * Les essais du serveur de collecte : `npm run backend:test`.
 *
 * Chaque essai monte un vrai serveur sur un port libre et un dossier provisoire, et lui parle
 * par HTTP comme le ferait un poste.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import {
    hoteValable,
    idDeMachine,
    identifiantsDe,
    memeMachine,
    serieValable,
    uuidValable,
} from '../collecte/identite.mjs';
import { lireLaRemontee, lireLeLot } from '../collecte/remontee.mjs';
import { demarrerLeServeur, lireLaConfiguration } from '../server.mjs';

const CLE = 'cle-des-postes-pour-les-essais';
const CLE_ADMIN = 'cle-admin-pour-les-essais';
const muet = { log() {}, warn() {}, error() {} };

const poste = (plus = {}) => ({
    schema: 'neemba.agent.checkin.v1',
    generatedAt: '2026-10-10T08:00:00.000Z',
    source: 'agent',
    agentVersion: '2.0.0',
    device: {
        machineName: 'PC-LOME-001',
        hostname: 'PC-LOME-001',
        serialNumber: 'SN123456',
        biosUuid: '4c4c4544-0038-3110-8052-b7c04f4e5332',
        macAddress: '00-1a-2b-3c-4d-5e',
        ipAddress: '10.10.0.25',
        os: 'Windows 11 Pro 23H2',
        ramGb: 16,
        storageGb: 512,
        type: 'Laptop',
        model: 'Dell Latitude 7420',
        ...plus.device,
    },
    user: { name: 'k.mensah', email: 'K.Mensah@neemba.com' },
    context: { country: 'Togo', site: 'Lomé Siège', service: 'IT' },
    apps: { sentinelOne: true, matrix42: false, manageEngine: true },
    ...Object.fromEntries(Object.entries(plus).filter(([nom]) => nom !== 'device')),
});

const monter = async (plus = {}) => {
    const dossier = plus.dossier ?? (await mkdtemp(join(tmpdir(), 'collecte-')));
    const config = {
        ...lireLaConfiguration({
            NEEMBA_AGENT_API_KEY: CLE,
            NEEMBA_ADMIN_API_KEY: CLE_ADMIN,
            HOST: '127.0.0.1',
            PORT: '0',
        }),
        dossier,
        ...plus,
    };
    const serveur = await demarrerLeServeur(config, { journaliser: muet });
    const base = `http://127.0.0.1:${serveur.adresse().port}`;
    const appeler = async (chemin, { methode = 'GET', corps, enTetes = {}, brut = false } = {}) => {
        const reponse = await fetch(base + chemin, {
            method: methode,
            headers: {
                ...(corps !== undefined && !brut ? { 'Content-Type': 'application/json' } : {}),
                ...enTetes,
            },
            body: corps === undefined ? undefined : brut ? corps : JSON.stringify(corps),
        });
        const texte = await reponse.text();
        return {
            statut: reponse.status,
            enTetes: reponse.headers,
            corps: texte ? JSON.parse(texte) : null,
        };
    };
    const envoyer = (corps, enTetes = { 'x-api-key': CLE }) =>
        appeler('/api/agent/checkin', { methode: 'POST', corps, enTetes });
    return { serveur, dossier, appeler, envoyer };
};

describe("L'identité d'une machine", () => {
    test('les valeurs d’usine ne désignent aucune machine', () => {
        assert.equal(serieValable('To Be Filled By O.E.M.'), '');
        assert.equal(serieValable('Default string'), '');
        assert.equal(serieValable('0000000'), '');
        assert.equal(serieValable('SN123456'), 'sn123456');
        assert.equal(uuidValable('00000000-0000-0000-0000-000000000000'), '');
        assert.equal(uuidValable('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'), '');
        assert.equal(uuidValable('03000200-0400-0500-0006-000700080009'), '');
        assert.equal(
            uuidValable('4C4C4544-0038-3110-8052-B7C04F4E5332'),
            '4c4c4544003831108052b7c04f4e5332',
        );
    });

    test('le nom se compare sans son domaine', () => {
        assert.equal(hoteValable('PC-01.neemba.local'), 'pc-01');
        assert.equal(hoteValable('PC-01'), 'pc-01');
        assert.equal(hoteValable('10.10.0.25'), '10.10.0.25');
        assert.equal(hoteValable('localhost'), '');
    });

    test('la carte réseau peut changer, la machine reste la même', () => {
        const surSaStation = identifiantsDe({
            biosUuid: '4c4c4544-0038-3110-8052-b7c04f4e5332',
            macAddress: 'AA:BB:CC:00:00:01',
        });
        const enWifi = identifiantsDe({
            biosUuid: '4c4c4544-0038-3110-8052-b7c04f4e5332',
            macAddress: 'AA:BB:CC:00:00:02',
        });
        assert.equal(memeMachine(surSaStation, enWifi), true);
        assert.equal(
            idDeMachine({
                biosUuid: '4c4c4544-0038-3110-8052-b7c04f4e5332',
                macAddress: 'AA:BB:CC:00:00:01',
            }),
            idDeMachine({
                biosUuid: '4C4C4544-0038-3110-8052-B7C04F4E5332',
                macAddress: 'AA:BB:CC:00:00:02',
            }),
        );
    });

    test('deux UUID différents sont deux machines, même sur la même station', () => {
        const a = identifiantsDe({
            biosUuid: '4c4c4544-0038-3110-8052-b7c04f4e5332',
            macAddress: 'AA:BB:CC:00:00:01',
            hostname: 'PC-01',
        });
        const b = identifiantsDe({
            biosUuid: '5d5d5544-0038-3110-8052-b7c04f4e5999',
            macAddress: 'AA:BB:CC:00:00:01',
            hostname: 'PC-01',
        });
        assert.equal(memeMachine(a, b), false);
    });

    test('une machine connue par son nom est retrouvée quand son agent remonte', () => {
        const parLAnnuaire = identifiantsDe({ hostname: 'pc-01.neemba.local' });
        const parLAgent = identifiantsDe({ hostname: 'PC-01', serialNumber: 'SN123456' });
        assert.equal(memeMachine(parLAnnuaire, parLAgent), true);
    });

    test('l’identifiant du document est lisible et stable', () => {
        assert.equal(idDeMachine({ serialNumber: ' SN 123/456 ' }), 'det_sn_sn-123-456');
        assert.equal(idDeMachine({ macAddress: '00:1A:2B:3C:4D:5E' }), 'det_mac_001a2b3c4d5e');
        assert.equal(idDeMachine({ hostname: 'PC-01.neemba.local' }), 'det_hote_pc-01');
        assert.equal(idDeMachine({ serialNumber: 'Default string' }), '');
    });
});

describe('La lecture d’une remontée', () => {
    test('le schéma v1 : la clé du corps est rendue à part, jamais gardée', () => {
        const lue = lireLaRemontee({ ...poste(), auth: { apiKey: 'secret' } });
        assert.equal(lue.ok, true);
        assert.equal(lue.cle, 'secret');
        assert.equal(JSON.stringify(lue.remontee).includes('secret'), false);
        assert.equal(lue.remontee.macAddress, '00:1A:2B:3C:4D:5E');
        assert.equal(lue.remontee.ram, '16 GB');
        assert.equal(lue.remontee.userEmail, 'k.mensah@neemba.com');
        assert.deepEqual(lue.remontee.agents, {
            sentinelOne: true,
            matrix42: false,
            manageEngine: true,
        });
    });

    test('l’ancienne écriture à plat', () => {
        const lue = lireLaRemontee({
            hostname: 'PC-02',
            serial_number: 'ABC12345',
            ram_gb: 8,
            api_key: 'k',
            sentinelOne: 'yes',
        });
        assert.equal(lue.ok, true);
        assert.equal(lue.cle, 'k');
        assert.equal(lue.remontee.serialNumber, 'ABC12345');
        assert.equal(lue.remontee.ram, '8 GB');
        assert.equal(lue.remontee.agents.sentinelOne, true);
    });

    test('un annuaire qui ne dit rien des logiciels ne dit pas « absents »', () => {
        const lue = lireLaRemontee({ source: 'active_directory', hostname: 'PC-03' });
        assert.equal(lue.ok, true);
        assert.equal(lue.remontee.agents, undefined);
    });

    test('une horloge en avance ne date pas la remontée', () => {
        const maintenant = Date.parse('2026-10-10T08:00:00Z');
        const lue = lireLaRemontee(
            { hostname: 'PC-04', generatedAt: '2031-01-01T00:00:00Z' },
            { maintenant },
        );
        assert.equal(lue.remontee.scannedAt, '2026-10-10T08:00:00.000Z');
    });

    test('ce qui est refusé', () => {
        assert.equal(lireLaRemontee('texte').ok, false);
        assert.equal(lireLaRemontee({ schema: 'autre.v9', hostname: 'PC' }).ok, false);
        assert.equal(lireLaRemontee({ source: 'inconnue', hostname: 'PC' }).ok, false);
        assert.equal(lireLaRemontee({ hostname: 'PC', generatedAt: 'hier' }).ok, false);
        assert.equal(lireLaRemontee({ serialNumber: 'Default string', os: 'Windows' }).ok, false);
    });

    test('sans identifiant de remontée, la machine et l’instant en tiennent lieu', () => {
        const a = lireLaRemontee(poste()).remontee.checkinId;
        const b = lireLaRemontee(poste()).remontee.checkinId;
        assert.equal(a, b);
        assert.match(a, /^det_uuid_.+@2026-10-10T08:00:00\.000Z$/);
    });

    test('un lot se lit en tableau, en objet « checkins » ou ligne par ligne', () => {
        assert.equal(lireLeLot('[{"hostname":"A"},{"hostname":"B"}]').entrees.length, 2);
        const enveloppe = lireLeLot('{"auth":{"apiKey":"k"},"checkins":[{"hostname":"A"}]}');
        assert.equal(enveloppe.entrees.length, 1);
        assert.equal(enveloppe.cle, 'k');
        const lignes = lireLeLot('{"hostname":"A"}\n\n{"hostname":"B"}\nabîmée\n');
        assert.equal(lignes.entrees.length, 3);
        assert.equal(lignes.entrees[2], null);
        assert.equal(lireLeLot('   ').ok, false);
    });
});

describe('La configuration', () => {
    test('sans clé, le serveur n’écoute que la machine locale', () => {
        const config = lireLaConfiguration({});
        assert.equal(config.hote, '127.0.0.1');
        assert.equal(config.clesDEssai, true);
    });

    test('les clés d’essai ne s’ouvrent pas au réseau', () => {
        assert.throws(() => lireLaConfiguration({ HOST: '0.0.0.0' }), /Clés d'essai/);
        assert.throws(
            () => lireLaConfiguration({ HOST: '0.0.0.0', NEEMBA_AGENT_API_KEY: CLE }),
            /Clés d'essai/,
        );
        const ouvert = lireLaConfiguration({
            NEEMBA_AGENT_API_KEY: CLE,
            NEEMBA_ADMIN_API_KEY: CLE_ADMIN,
        });
        assert.equal(ouvert.hote, '0.0.0.0');
        assert.equal(ouvert.clesDEssai, false);
    });

    test('plusieurs clés de poste, pour en changer sans coupure', () => {
        const config = lireLaConfiguration({
            NEEMBA_AGENT_API_KEYS: 'ancienne, nouvelle',
            NEEMBA_ADMIN_API_KEY: CLE_ADMIN,
        });
        assert.deepEqual(config.clesAgent, ['ancienne', 'nouvelle']);
    });

    test('Firestore ne se branche que sur demande', () => {
        assert.equal(
            lireLaConfiguration({ FIREBASE_ADMIN_CREDENTIALS: '/un/fichier.json' }).versFirestore,
            false,
        );
        assert.equal(lireLaConfiguration({ AGENT_SINK: 'firestore' }).versFirestore, true);
    });
});

describe('Le serveur', () => {
    let banc;
    before(async () => {
        banc = await monter();
    });
    after(async () => {
        await banc.serveur.fermer();
        await rm(banc.dossier, { recursive: true, force: true });
    });

    test('la santé ne livre ni chemin ni décompte sans la clé d’administration', async () => {
        const publique = await banc.appeler('/api/agent/checkin/health');
        assert.equal(publique.statut, 200);
        assert.deepEqual(Object.keys(publique.corps).sort(), ['now', 'ok', 'service', 'version']);
        const detaillee = await banc.appeler('/api/agent/checkin/health', {
            enTetes: { 'x-admin-key': CLE_ADMIN },
        });
        assert.equal(typeof detaillee.corps.collecte.machines, 'number');
        assert.equal(JSON.stringify(detaillee.corps).includes(banc.dossier), false);
    });

    test('sans clé ou avec une mauvaise clé : refusé', async () => {
        assert.equal((await banc.envoyer(poste(), {})).statut, 401);
        assert.equal((await banc.envoyer(poste(), { 'x-api-key': 'fausse' })).statut, 401);
        assert.equal(
            (await banc.envoyer({ ...poste(), auth: { apiKey: 'fausse' } }, {})).statut,
            401,
        );
    });

    test('la clé passe par l’en-tête, par Bearer, ou par le corps des anciens agents', async () => {
        const parEnTete = await banc.envoyer(poste({ checkinId: 'chk-entete' }));
        assert.equal(parEnTete.statut, 201);
        assert.equal(parEnTete.corps.nouvelle, true);
        assert.match(parEnTete.corps.machineId, /^det_uuid_/);
        const parBearer = await banc.envoyer(poste({ checkinId: 'chk-bearer' }), {
            Authorization: `Bearer ${CLE}`,
        });
        assert.equal(parBearer.statut, 201);
        assert.equal(parBearer.corps.nouvelle, false);
        const parLeCorps = await banc.envoyer(
            { ...poste({ checkinId: 'chk-corps' }), auth: { apiKey: CLE } },
            {},
        );
        assert.equal(parLeCorps.statut, 201);
    });

    test('la même remontée deux fois : reconnue, avec ou sans identifiant', async () => {
        const encore = await banc.envoyer(poste({ checkinId: 'chk-entete' }));
        assert.equal(encore.statut, 200);
        assert.equal(encore.corps.duplicate, true);
        const sansId = poste({ generatedAt: '2026-10-10T12:00:00.000Z' });
        assert.equal((await banc.envoyer(sansId)).statut, 201);
        assert.equal((await banc.envoyer(sansId)).corps.duplicate, true);
    });

    test('la clé n’est jamais écrite sur le disque', async () => {
        await banc.serveur.registre.fermer();
        for (const nom of await readdir(banc.dossier)) {
            if (!nom.startsWith('agent-')) continue;
            const contenu = await readFile(join(banc.dossier, nom), 'utf8');
            assert.equal(contenu.includes(CLE), false, `${nom} contient la clé`);
        }
    });

    test('une machine qui change de carte réseau reste une seule machine', async () => {
        const enWifi = poste({
            checkinId: 'chk-wifi',
            device: { macAddress: '00:1A:2B:3C:4D:99', ipAddress: '192.168.1.40' },
        });
        assert.equal((await banc.envoyer(enWifi)).corps.nouvelle, false);
        const machines = await banc.appeler('/api/agent/machines', {
            enTetes: { 'x-admin-key': CLE_ADMIN },
        });
        assert.equal(machines.corps.count, 1);
        assert.equal(machines.corps.machines[0].faits.macAddress, '00:1A:2B:3C:4D:99');
        assert.equal(machines.corps.machines[0].remontees >= 4, true);
    });

    test('lire les remontées et les machines demande la clé d’administration', async () => {
        assert.equal((await banc.appeler('/api/agent/checkin')).statut, 401);
        assert.equal((await banc.appeler('/api/agent/machines')).statut, 401);
        /* La clé des postes n'ouvre pas la lecture : chaque poste la détient. */
        assert.equal(
            (await banc.appeler('/api/agent/machines', { enTetes: { 'x-admin-key': CLE } })).statut,
            401,
        );
        const lues = await banc.appeler('/api/agent/checkin?limit=2', {
            enTetes: { 'x-admin-key': CLE_ADMIN },
        });
        assert.equal(lues.corps.count, 2);
        assert.equal(lues.corps.entries[0].payload.apiKey, undefined);
    });

    test('ce qui est mal formé est refusé avec sa raison', async () => {
        const sansMachine = await banc.envoyer({ os: 'Windows 11' });
        assert.equal(sansMachine.statut, 400);
        assert.match(sansMachine.corps.message, /Aucun identifiant/);
        const abime = await banc.appeler('/api/agent/checkin', {
            methode: 'POST',
            corps: '{pas du json',
            brut: true,
            enTetes: { 'x-api-key': CLE, 'Content-Type': 'application/json' },
        });
        assert.equal(abime.statut, 400);
        assert.equal((await banc.appeler('/api/inconnue')).statut, 404);
    });

    test('un lot : chaque remontée a sa réponse', async () => {
        const lot = [
            poste({
                checkinId: 'lot-1',
                device: {
                    machineName: 'PC-KARA-001',
                    hostname: 'PC-KARA-001',
                    serialNumber: 'KARA0001',
                    biosUuid: '',
                    macAddress: '',
                },
            }),
            { os: 'sans identifiant' },
            poste({ checkinId: 'chk-entete' }),
            {
                source: 'active_directory',
                hostname: 'SRV-AD-01.neemba.local',
                os: 'Windows Server 2022',
            },
        ];
        const reponse = await banc.appeler('/api/agent/checkin/batch', {
            methode: 'POST',
            corps: lot,
            enTetes: { 'x-api-key': CLE },
        });
        assert.equal(reponse.statut, 200);
        assert.equal(reponse.corps.ok, false);
        assert.deepEqual(
            [
                reponse.corps.received,
                reponse.corps.stored,
                reponse.corps.duplicates,
                reponse.corps.rejected,
            ],
            [4, 2, 1, 1],
        );
        assert.equal(reponse.corps.results[1].ok, false);
        assert.equal(reponse.corps.results[2].duplicate, true);
        assert.equal(reponse.corps.results[3].machineId, 'det_hote_srv-ad-01');
    });

    test('un lot ligne par ligne, et un lot sans aucune clé', async () => {
        const lignes = [
            JSON.stringify(
                poste({
                    checkinId: 'nd-1',
                    device: {
                        machineName: 'PC-SOKODE-001',
                        hostname: 'PC-SOKODE-001',
                        serialNumber: 'SOKO0001',
                        biosUuid: '',
                        macAddress: '',
                    },
                }),
            ),
            JSON.stringify(
                poste({
                    checkinId: 'nd-2',
                    device: {
                        machineName: 'PC-SOKODE-002',
                        hostname: 'PC-SOKODE-002',
                        serialNumber: 'SOKO0002',
                        biosUuid: '',
                        macAddress: '',
                    },
                }),
            ),
        ].join('\n');
        const reponse = await banc.appeler('/api/agent/checkin/batch', {
            methode: 'POST',
            corps: lignes,
            brut: true,
            enTetes: { 'x-api-key': CLE, 'Content-Type': 'application/x-ndjson' },
        });
        assert.equal(reponse.corps.stored, 2);
        const sansCle = await banc.appeler('/api/agent/checkin/batch', {
            methode: 'POST',
            corps: [poste({ checkinId: 'x' })],
        });
        assert.equal(sansCle.statut, 401);
    });

    test('les origines : la machine locale et la liste admise, pas les autres', async () => {
        const locale = await banc.appeler('/api/agent/checkin/health', {
            enTetes: { Origin: 'http://localhost:5173' },
        });
        assert.equal(locale.enTetes.get('access-control-allow-origin'), 'http://localhost:5173');
        const etrangere = await banc.appeler('/api/agent/checkin/health', {
            enTetes: { Origin: 'https://ailleurs.example' },
        });
        assert.equal(etrangere.enTetes.get('access-control-allow-origin'), null);
        const preliminaire = await banc.appeler('/api/agent/checkin', {
            methode: 'OPTIONS',
            enTetes: { Origin: 'http://localhost:5173' },
        });
        assert.equal(preliminaire.statut, 204);
    });

    test('le module des comptes répond comme avant', async () => {
        assert.equal((await banc.appeler('/api/auth/users')).statut, 401);
        const comptes = await banc.appeler('/api/auth/users', {
            enTetes: { 'x-admin-key': CLE_ADMIN },
        });
        assert.equal(comptes.corps.count, 4);
        const pin = await banc.appeler('/api/auth/users/3/reset-pin', {
            methode: 'POST',
            corps: {},
            enTetes: { 'x-admin-key': CLE_ADMIN },
        });
        assert.match(pin.corps.temporaryPin, /^\d{4}$/);
    });
});

describe('Les garde-fous', () => {
    test('un corps trop gros est refusé sans être gardé', async () => {
        const banc = await monter({ maxOctets: 2000 });
        try {
            const gros = { ...poste(), bourre: 'x'.repeat(5000) };
            assert.equal((await banc.envoyer(gros)).statut, 413);
            assert.equal((await banc.envoyer(poste())).statut, 201);
        } finally {
            await banc.serveur.fermer();
            await rm(banc.dossier, { recursive: true, force: true });
        }
    });

    test('trop de clés fausses depuis une adresse : elle attend', async () => {
        const banc = await monter({ echecsToleres: 3 });
        try {
            for (let essai = 0; essai < 3; essai += 1) {
                assert.equal(
                    (await banc.envoyer(poste(), { 'x-api-key': `fausse-${essai}` })).statut,
                    401,
                );
            }
            const bloquee = await banc.envoyer(poste());
            assert.equal(bloquee.statut, 429);
            assert.equal(Number(bloquee.enTetes.get('retry-after')) > 0, true);
        } finally {
            await banc.serveur.fermer();
            await rm(banc.dossier, { recursive: true, force: true });
        }
    });

    test('la cadence borne ce qu’une adresse envoie par minute', async () => {
        const banc = await monter({ parMinute: 2 });
        try {
            assert.equal((await banc.envoyer(poste({ checkinId: 'c1' }))).statut, 201);
            assert.equal((await banc.envoyer(poste({ checkinId: 'c2' }))).statut, 201);
            assert.equal((await banc.envoyer(poste({ checkinId: 'c3' }))).statut, 429);
        } finally {
            await banc.serveur.fermer();
            await rm(banc.dossier, { recursive: true, force: true });
        }
    });

    test('un lot plus long que la borne est refusé en entier', async () => {
        const banc = await monter({ maxParLot: 2 });
        try {
            const lot = [1, 2, 3].map((n) => ({ hostname: `PC-${n}` }));
            const reponse = await banc.appeler('/api/agent/checkin/batch', {
                methode: 'POST',
                corps: lot,
                enTetes: { 'x-api-key': CLE },
            });
            assert.equal(reponse.statut, 413);
        } finally {
            await banc.serveur.fermer();
            await rm(banc.dossier, { recursive: true, force: true });
        }
    });
});

describe('Ce qui survit à un arrêt', () => {
    test('le registre est relu, et se reconstruit du journal s’il manque', async () => {
        const premier = await monter();
        const { dossier } = premier;
        try {
            await premier.envoyer(poste({ checkinId: 'avant-1' }));
            await premier.envoyer(
                poste({
                    checkinId: 'avant-2',
                    device: {
                        machineName: 'PC-ANEHO-001',
                        hostname: 'PC-ANEHO-001',
                        serialNumber: 'ANEH0001',
                        biosUuid: '',
                        macAddress: '',
                    },
                }),
            );
            await premier.serveur.fermer();

            const second = await monter({ dossier });
            assert.equal(second.serveur.registre.etat().machines, 2);
            assert.equal(
                (await second.envoyer(poste({ checkinId: 'avant-1' }))).corps.duplicate,
                true,
            );
            await second.serveur.fermer();

            await unlink(join(dossier, 'agent-machines.json'));
            const troisieme = await monter({ dossier });
            assert.equal(troisieme.serveur.registre.relues, 2);
            assert.equal(troisieme.serveur.registre.etat().machines, 2);
            assert.equal(
                (await troisieme.envoyer(poste({ checkinId: 'avant-2' }))).corps.duplicate,
                true,
            );
            await troisieme.serveur.fermer();
        } finally {
            await rm(dossier, { recursive: true, force: true });
        }
    });

    test('le journal se tourne quand il grossit, et garde les derniers', async () => {
        const banc = await monter({ journalMaxOctets: 900 });
        try {
            for (let n = 0; n < 6; n += 1) {
                assert.equal((await banc.envoyer(poste({ checkinId: `tour-${n}` }))).statut, 201);
            }
            const fichiers = await readdir(banc.dossier);
            assert.equal(fichiers.includes('agent-checkins.jsonl'), true);
            assert.equal(
                fichiers.some((nom) => /^agent-checkins-.+\.jsonl$/.test(nom)),
                true,
            );
        } finally {
            await banc.serveur.fermer();
            await rm(banc.dossier, { recursive: true, force: true });
        }
    });
});
