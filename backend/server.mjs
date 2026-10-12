/**
 * **Le serveur du Tracker** : la collecte des machines, et l'administration des comptes.
 *
 *   npm run backend:agent
 *
 * La collecte reçoit ce que les postes, un export d'annuaire ou un scan réseau envoient
 * (`POST /api/agent/checkin`, `/batch`), le range sur le disque (`collecte/registre.mjs`) et,
 * si Firestore est branché, le pousse vers l'application (`collecte/versFirestore.mjs`).
 * `backend/README.md` décrit les routes et les variables.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ouvrirLeRegistre } from './collecte/registre.mjs';
import { lireLaRemontee, lireLeLot } from './collecte/remontee.mjs';

export const VERSION = '2.0.0';

const CLE_AGENT_PAR_DEFAUT = 'NEEMBA_AGENT_KEY';
const CLE_ADMIN_PAR_DEFAUT = 'NEEMBA_ADMIN_KEY';
const BOUCLE_LOCALE = new Set(['127.0.0.1', '::1', 'localhost']);

const asString = (value) => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const enListe = (valeur) =>
    String(valeur ?? '')
        .split(',')
        .map((element) => element.trim())
        .filter(Boolean);

/**
 * Comparer deux secrets sans que la durée de la comparaison ne renseigne sur le bon : les
 * deux passent par la même empreinte, donc ont la même longueur.
 */
const memeSecret = (propose, attendu) => {
    if (!propose || !attendu) return false;
    const a = createHash('sha256').update(propose).digest();
    const b = createHash('sha256').update(attendu).digest();
    return timingSafeEqual(a, b);
};

const toPublicAuthUser = (user) => {
    if (!isObject(user)) return user;
    const { TemporaryPassword: _temporaryPassword, ...safeUser } = user;
    return safeUser;
};

const generateTempPassword = () => `Tmp#${Math.random().toString(36).slice(2, 10)}!`;
// Quatre chiffres (REGLES-TRANSVERSES.md §2.1). Le PIN remis ici est saisi dans les
// pavés du client, qui n'ont que quatre cases : en émettre six le rendait inutilisable.
const generateTempPin = () => String(Math.floor(1000 + Math.random() * 9000));

const createDefaultAuthUsers = () => {
    const now = new Date().toISOString();
    return [
        {
            id: '1',
            Title: 'Alice Admin',
            MicrosoftEmail: 'alice.admin@tracker.app',
            Role: 'SuperAdmin',
            Status: 'active',
            PinStatus: 'active',
            MustChangePassword: false,
            CreatedDate: now,
            CreatedBy: 'System',
            LastLoginDate: now,
        },
        {
            id: '2',
            Title: 'Bob Manager',
            MicrosoftEmail: 'bob.manager@tracker.app',
            Role: 'Manager',
            Status: 'active',
            PinStatus: 'active',
            MustChangePassword: false,
            CreatedDate: now,
            CreatedBy: 'System',
        },
        {
            id: '3',
            Title: 'Charlie New',
            MicrosoftEmail: 'charlie.new@tracker.app',
            Role: 'User',
            Status: 'pending',
            PinStatus: 'pending',
            MustChangePassword: true,
            CreatedDate: now,
            CreatedBy: 'Alice Admin',
        },
        {
            id: '4',
            Title: 'Dave Inactive',
            MicrosoftEmail: 'dave.inactive@tracker.app',
            Role: 'User',
            Status: 'inactive',
            PinStatus: 'not_set',
            MustChangePassword: false,
            CreatedDate: now,
            CreatedBy: 'Alice Admin',
        },
    ];
};

/**
 * **La configuration, lue de l'environnement.**
 *
 * Sans clé posée, le serveur tourne avec les clés d'essai du dépôt : elles sont publiques,
 * il n'écoute alors que la machine locale. Pour l'ouvrir au réseau, il faut de vraies clés.
 */
export const lireLaConfiguration = (env = process.env) => {
    const clesAgent = [
        ...enListe(env.NEEMBA_AGENT_API_KEYS),
        ...enListe(env.NEEMBA_AGENT_API_KEY),
        ...enListe(env.AGENT_API_KEY),
    ];
    const cleAdmin = asString(env.NEEMBA_ADMIN_API_KEY);
    const clesDEssai = clesAgent.length === 0 || !cleAdmin;
    const hote = asString(env.HOST) || (clesDEssai ? '127.0.0.1' : '0.0.0.0');

    if (clesDEssai && !BOUCLE_LOCALE.has(hote) && env.NEEMBA_ALLOW_DEFAULT_KEYS !== '1') {
        throw new Error(
            `Clés d'essai sur ${hote} : posez NEEMBA_AGENT_API_KEY et NEEMBA_ADMIN_API_KEY avant d'ouvrir le serveur au réseau.`,
        );
    }

    return {
        hote,
        port: Number(env.PORT || 8787),
        clesAgent: clesAgent.length > 0 ? clesAgent : [CLE_AGENT_PAR_DEFAUT],
        cleAdmin: cleAdmin || CLE_ADMIN_PAR_DEFAUT,
        clesDEssai,
        dossier: resolve(process.cwd(), env.AGENT_DATA_DIR || 'backend/data'),
        maxOctets: Number(env.AGENT_MAX_BODY_BYTES || 1024 * 1024),
        maxOctetsDeLot: Number(env.AGENT_MAX_BATCH_BYTES || 8 * 1024 * 1024),
        maxParLot: Number(env.AGENT_MAX_BATCH_ITEMS || 2000),
        maxIdentifiantsVus: Number(env.AGENT_MAX_INDEX_IDS || 10000),
        journalMaxOctets: Number(env.AGENT_JOURNAL_MAX_BYTES || 20 * 1024 * 1024),
        parMinute: Number(env.AGENT_RATE_PER_MINUTE || 1200),
        echecsToleres: Number(env.AGENT_MAX_AUTH_FAILURES || 20),
        origines: enListe(env.AGENT_ALLOWED_ORIGINS),
        derriereUnMandataire: env.AGENT_TRUST_PROXY === '1',
        /* Firestore ne se branche que sur demande : un essai local ne doit jamais écrire
           dans la base publiée parce qu'un fichier d'identifiants traînait là. */
        versFirestore: asString(env.AGENT_SINK).toLowerCase() === 'firestore',
    };
};

const UNE_MINUTE = 60_000;
const FENETRE_DES_ECHECS = 5 * UNE_MINUTE;

/**
 * Monter le serveur. `config` vient de `lireLaConfiguration` ; les tests y passent un
 * dossier provisoire et le port 0.
 */
export const demarrerLeServeur = async (config, { journaliser = console } = {}) => {
    const state = { authUsers: [], tempPasswords: {}, tempPins: {} };
    const fichierDesComptes = join(config.dossier, 'auth-users.json');
    const fichierDesMotsDePasse = join(config.dossier, 'auth-temp-passwords.json');
    const fichierDesPins = join(config.dossier, 'auth-temp-pins.json');

    await mkdir(config.dossier, { recursive: true });
    if (!existsSync(fichierDesComptes)) {
        await writeFile(
            fichierDesComptes,
            JSON.stringify(createDefaultAuthUsers(), null, 2),
            'utf8',
        );
    }
    if (!existsSync(fichierDesMotsDePasse)) {
        await writeFile(
            fichierDesMotsDePasse,
            JSON.stringify({ 3: generateTempPassword() }, null, 2),
            'utf8',
        );
    }
    if (!existsSync(fichierDesPins)) {
        await writeFile(fichierDesPins, JSON.stringify({ 3: generateTempPin() }, null, 2), 'utf8');
    }

    const registre = await ouvrirLeRegistre({
        dossier: config.dossier,
        maxIdentifiantsVus: config.maxIdentifiantsVus,
        journalMaxOctets: config.journalMaxOctets,
    });
    let firestore = null;
    if (config.versFirestore) {
        const { ouvrirFirestore } = await import('./collecte/versFirestore.mjs');
        firestore = await ouvrirFirestore({ registre, version: VERSION, journaliser });
    }

    /* ── Qui appelle, et à quelle cadence ───────────────────────────────────────── */
    const echecs = new Map();
    const cadence = new Map();

    const ipDe = (request) => {
        if (config.derriereUnMandataire) {
            const transmis = asString(request.headers['x-forwarded-for']).split(',')[0].trim();
            if (transmis) return transmis;
        }
        return request.socket.remoteAddress || '';
    };

    const elaguer = (table, garder) => {
        if (table.size < 5000) return;
        for (const [cle, valeur] of table) if (!garder(valeur)) table.delete(cle);
    };

    /** Trop de clés fausses depuis cette adresse : elle attend la fin de la fenêtre. */
    const bloqueJusqua = (ip) => {
        const suivi = echecs.get(ip);
        if (!suivi) return 0;
        if (Date.now() - suivi.depuis >= FENETRE_DES_ECHECS) {
            echecs.delete(ip);
            return 0;
        }
        return suivi.nombre >= config.echecsToleres ? suivi.depuis + FENETRE_DES_ECHECS : 0;
    };

    const noterUnEchec = (ip) => {
        const maintenant = Date.now();
        const suivi = echecs.get(ip);
        if (!suivi || maintenant - suivi.depuis >= FENETRE_DES_ECHECS) {
            echecs.set(ip, { nombre: 1, depuis: maintenant });
        } else {
            suivi.nombre += 1;
        }
        elaguer(echecs, (valeur) => maintenant - valeur.depuis < FENETRE_DES_ECHECS);
    };

    /** `true` si l'adresse reste sous sa cadence après ces `poids` remontées. */
    const sousLaCadence = (ip, poids = 1) => {
        const minute = Math.floor(Date.now() / UNE_MINUTE);
        const suivi = cadence.get(ip);
        if (!suivi || suivi.minute !== minute) {
            cadence.set(ip, { minute, nombre: poids });
            elaguer(cadence, (valeur) => valeur.minute === minute);
            return poids <= config.parMinute;
        }
        suivi.nombre += poids;
        return suivi.nombre <= config.parMinute;
    };

    const cleDeLaRequete = (request) => {
        const enTete = asString(request.headers['x-api-key']);
        if (enTete) return enTete;
        const autorisation = asString(request.headers.authorization);
        return autorisation.toLowerCase().startsWith('bearer ') ? autorisation.slice(7).trim() : '';
    };

    const cleAgentValable = (cle) => config.clesAgent.some((attendue) => memeSecret(cle, attendue));

    /* ── Lire et répondre ───────────────────────────────────────────────────────── */
    const origineAdmise = (origine) => {
        if (!origine) return '';
        if (config.origines.includes(origine)) return origine;
        try {
            return BOUCLE_LOCALE.has(new URL(origine).hostname) ? origine : '';
        } catch {
            return '';
        }
    };

    const writeJson = (response, statusCode, body, enTetes = {}) => {
        const origine = origineAdmise(asString(response.req?.headers.origin));
        response.writeHead(statusCode, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            Vary: 'Origin',
            ...(origine
                ? {
                      'Access-Control-Allow-Origin': origine,
                      'Access-Control-Allow-Headers':
                          'Content-Type, Authorization, x-api-key, x-admin-key',
                      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  }
                : {}),
            ...enTetes,
        });
        response.end(statusCode === 204 ? undefined : JSON.stringify(body));
    };

    const lireLeCorps = (request, max) =>
        new Promise((rendre, refuser) => {
            const morceaux = [];
            let octets = 0;
            let trop = false;
            request.on('data', (morceau) => {
                if (trop) return;
                octets += morceau.length;
                if (octets > max) {
                    /* On cesse de garder, mais on laisse finir : couper la connexion ici
                       priverait l'appelant de sa réponse. */
                    trop = true;
                    morceaux.length = 0;
                    return;
                }
                morceaux.push(morceau);
            });
            request.on('end', () => {
                if (trop)
                    refuser(Object.assign(new Error('Payload trop volumineux.'), { statut: 413 }));
                else rendre(Buffer.concat(morceaux).toString('utf8'));
            });
            request.on('error', () =>
                refuser(Object.assign(new Error('Lecture du body impossible.'), { statut: 400 })),
            );
        });

    const lireLeJson = async (request, max = config.maxOctets) => {
        const texte = await lireLeCorps(request, max);
        if (!texte) return {};
        try {
            return JSON.parse(texte);
        } catch {
            throw Object.assign(new Error('JSON invalide.'), { statut: 400 });
        }
    };

    const extractAdminKey = (request, body = null) => {
        const headerKey = asString(request.headers['x-admin-key']);
        if (headerKey) return headerKey;

        const authHeader = asString(request.headers.authorization);
        if (authHeader.toLowerCase().startsWith('bearer ')) {
            return authHeader.slice(7).trim();
        }

        if (body && isObject(body)) {
            return asString(body.adminKey);
        }
        return '';
    };

    const isAdminAuthorized = (request, body = null) =>
        memeSecret(extractAdminKey(request, body), config.cleAdmin);

    const loadAuthStore = async () => {
        try {
            const usersRaw = await readFile(fichierDesComptes, 'utf8');
            const users = JSON.parse(usersRaw);
            state.authUsers = Array.isArray(users)
                ? users.map((user) => ({
                      ...user,
                      PinStatus: asString(user?.PinStatus) || 'not_set',
                  }))
                : createDefaultAuthUsers();
        } catch {
            state.authUsers = createDefaultAuthUsers();
        }

        try {
            const tempRaw = await readFile(fichierDesMotsDePasse, 'utf8');
            const tempPasswords = JSON.parse(tempRaw);
            state.tempPasswords = isObject(tempPasswords) ? tempPasswords : {};
        } catch {
            state.tempPasswords = {};
        }

        try {
            const tempRaw = await readFile(fichierDesPins, 'utf8');
            const tempPins = JSON.parse(tempRaw);
            state.tempPins = isObject(tempPins) ? tempPins : {};
        } catch {
            state.tempPins = {};
        }
    };

    const saveAuthStore = async () => {
        await writeFile(fichierDesComptes, JSON.stringify(state.authUsers, null, 2), 'utf8');
        await writeFile(
            fichierDesMotsDePasse,
            JSON.stringify(state.tempPasswords, null, 2),
            'utf8',
        );
        await writeFile(fichierDesPins, JSON.stringify(state.tempPins, null, 2), 'utf8');
    };

    await loadAuthStore();

    /* ── La collecte ────────────────────────────────────────────────────────────── */
    const refuserLaCadence = (response, ip) => {
        const jusqua = bloqueJusqua(ip);
        if (jusqua) {
            writeJson(
                response,
                429,
                { ok: false, message: 'Trop de clés refusées depuis cette adresse.' },
                { 'Retry-After': String(Math.ceil((jusqua - Date.now()) / 1000)) },
            );
            return true;
        }
        return false;
    };

    const SOURCE_ETEINTE = {
        ok: false,
        code: 'source_inactive',
        message: 'Collecte désactivée dans les réglages.',
    };

    const recevoirUneRemontee = async (request, response) => {
        const ip = ipDe(request);
        if (refuserLaCadence(response, ip)) return;

        let brut;
        try {
            brut = await lireLeJson(request);
        } catch (erreur) {
            writeJson(response, erreur.statut || 400, { ok: false, message: erreur.message });
            return;
        }

        const lue = lireLaRemontee(brut);
        if (!cleAgentValable(cleDeLaRequete(request) || lue.cle)) {
            noterUnEchec(ip);
            writeJson(response, 401, { ok: false, message: 'Clé API invalide.' });
            return;
        }
        if (!sousLaCadence(ip)) {
            writeJson(
                response,
                429,
                { ok: false, message: 'Cadence dépassée.' },
                { 'Retry-After': '60' },
            );
            return;
        }
        if (!lue.ok) {
            writeJson(response, 400, { ok: false, message: lue.erreur });
            return;
        }
        if (firestore && !firestore.sourceActive(lue.remontee.source)) {
            writeJson(response, 403, SOURCE_ETEINTE);
            return;
        }

        let resultat;
        try {
            [resultat] = await registre.recevoir([lue.remontee], { ipSource: ip });
        } catch (erreur) {
            journaliser.error('[collecte] remontée non enregistrée :', erreur.message);
            writeJson(response, 500, {
                ok: false,
                message: "Impossible d'enregistrer le check-in.",
            });
            return;
        }

        if (resultat.doublon) {
            writeJson(response, 200, {
                ok: true,
                duplicate: true,
                message: 'Check-in déjà traité.',
                checkinId: resultat.checkinId,
            });
            return;
        }

        firestore?.signaler();
        writeJson(response, 201, {
            ok: true,
            duplicate: false,
            message: 'Check-in enregistré.',
            checkinId: resultat.checkinId,
            storedId: resultat.idEnregistre,
            machineId: resultat.machine.id,
            nouvelle: resultat.nouvelle,
        });
    };

    const recevoirUnLot = async (request, response) => {
        const ip = ipDe(request);
        if (refuserLaCadence(response, ip)) return;

        let texte;
        try {
            texte = await lireLeCorps(request, config.maxOctetsDeLot);
        } catch (erreur) {
            writeJson(response, erreur.statut || 400, { ok: false, message: erreur.message });
            return;
        }

        const lot = lireLeLot(texte);
        if (!lot.ok) {
            writeJson(response, 400, { ok: false, message: lot.erreur });
            return;
        }
        if (lot.entrees.length > config.maxParLot) {
            writeJson(response, 413, {
                ok: false,
                message: `Lot trop long : ${config.maxParLot} remontées au plus.`,
            });
            return;
        }

        const cleCommune = cleAgentValable(cleDeLaRequete(request) || lot.cle);
        const resultats = [];
        const admises = [];
        let sansCle = 0;
        lot.entrees.forEach((entree, index) => {
            const lue = lireLaRemontee(entree);
            if (!cleCommune && !cleAgentValable(lue.cle)) {
                sansCle += 1;
                resultats[index] = { index, ok: false, message: 'Clé API invalide.' };
            } else if (!lue.ok) {
                resultats[index] = { index, ok: false, message: lue.erreur };
            } else if (firestore && !firestore.sourceActive(lue.remontee.source)) {
                resultats[index] = { index, ...SOURCE_ETEINTE };
            } else {
                admises.push({ index, remontee: lue.remontee });
            }
        });

        if (sansCle === lot.entrees.length) {
            noterUnEchec(ip);
            writeJson(response, 401, { ok: false, message: 'Clé API invalide.' });
            return;
        }
        if (!sousLaCadence(ip, admises.length)) {
            writeJson(
                response,
                429,
                { ok: false, message: 'Cadence dépassée.' },
                { 'Retry-After': '60' },
            );
            return;
        }

        let recues;
        try {
            recues = await registre.recevoir(
                admises.map(({ remontee }) => remontee),
                { ipSource: ip },
            );
        } catch (erreur) {
            journaliser.error('[collecte] lot non enregistré :', erreur.message);
            writeJson(response, 500, { ok: false, message: "Impossible d'enregistrer le lot." });
            return;
        }

        let enregistrees = 0;
        let doublons = 0;
        recues.forEach((recue, rang) => {
            const { index } = admises[rang];
            if (recue.doublon) doublons += 1;
            else enregistrees += 1;
            resultats[index] = {
                index,
                ok: true,
                duplicate: recue.doublon,
                checkinId: recue.checkinId,
                machineId: recue.machine?.id,
            };
        });
        if (enregistrees > 0) firestore?.signaler();

        const refusees = lot.entrees.length - recues.length;
        writeJson(response, 200, {
            ok: refusees === 0,
            received: lot.entrees.length,
            stored: enregistrees,
            duplicates: doublons,
            rejected: refusees,
            results: resultats,
        });
    };

    const handleGetAuthUsers = async (request, response) => {
        if (!isAdminAuthorized(request)) {
            writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
            return;
        }

        writeJson(response, 200, {
            ok: true,
            count: state.authUsers.length,
            users: state.authUsers.map((user) => toPublicAuthUser(user)),
        });
    };

    const handleResetAuthUserPassword = async (request, response, userId) => {
        let rawBody = {};
        try {
            rawBody = await lireLeJson(request);
        } catch (error) {
            writeJson(response, 400, { ok: false, message: error.message });
            return;
        }

        if (!isAdminAuthorized(request, rawBody)) {
            writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
            return;
        }

        const index = state.authUsers.findIndex((user) => asString(user.id) === asString(userId));
        if (index === -1) {
            writeJson(response, 404, { ok: false, message: 'Utilisateur introuvable.' });
            return;
        }

        const user = state.authUsers[index];
        const temporaryPassword = generateTempPassword();

        const updatedUser = {
            ...user,
            MustChangePassword: true,
            Status: asString(user.Status).toLowerCase() === 'inactive' ? 'pending' : user.Status,
            InvitationSentDate: new Date().toISOString(),
        };

        state.authUsers[index] = updatedUser;
        state.tempPasswords[asString(user.id)] = temporaryPassword;

        try {
            await saveAuthStore();
        } catch {
            writeJson(response, 500, { ok: false, message: 'Persistance du reset impossible.' });
            return;
        }

        writeJson(response, 200, {
            ok: true,
            user: toPublicAuthUser(updatedUser),
            temporaryPassword,
            persistedAt: new Date().toISOString(),
        });
    };

    const handleResetAuthUserPin = async (request, response, userId) => {
        let rawBody = {};
        try {
            rawBody = await lireLeJson(request);
        } catch (error) {
            writeJson(response, 400, { ok: false, message: error.message });
            return;
        }

        if (!isAdminAuthorized(request, rawBody)) {
            writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
            return;
        }

        const index = state.authUsers.findIndex((user) => asString(user.id) === asString(userId));
        if (index === -1) {
            writeJson(response, 404, { ok: false, message: 'Utilisateur introuvable.' });
            return;
        }

        const user = state.authUsers[index];
        const temporaryPin = generateTempPin();

        const updatedUser = {
            ...user,
            PinStatus: 'pending',
            InvitationSentDate: new Date().toISOString(),
        };

        state.authUsers[index] = updatedUser;
        state.tempPins[asString(user.id)] = temporaryPin;

        try {
            await saveAuthStore();
        } catch {
            writeJson(response, 500, {
                ok: false,
                message: 'Persistance du reset PIN impossible.',
            });
            return;
        }

        writeJson(response, 200, {
            ok: true,
            user: toPublicAuthUser(updatedUser),
            temporaryPin,
            persistedAt: new Date().toISOString(),
        });
    };

    const handleSetAuthUserStatus = async (request, response, userId) => {
        let rawBody = {};
        try {
            rawBody = await lireLeJson(request);
        } catch (error) {
            writeJson(response, 400, { ok: false, message: error.message });
            return;
        }

        if (!isAdminAuthorized(request, rawBody)) {
            writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
            return;
        }

        const requestedStatus = asString(rawBody.status).toLowerCase();
        if (!['active', 'inactive', 'pending'].includes(requestedStatus)) {
            writeJson(response, 400, { ok: false, message: 'Statut invalide.' });
            return;
        }

        const index = state.authUsers.findIndex((user) => asString(user.id) === asString(userId));
        if (index === -1) {
            writeJson(response, 404, { ok: false, message: 'Utilisateur introuvable.' });
            return;
        }

        const user = state.authUsers[index];
        const updatedUser = {
            ...user,
            Status: requestedStatus,
        };

        state.authUsers[index] = updatedUser;

        try {
            await saveAuthStore();
        } catch {
            writeJson(response, 500, { ok: false, message: 'Persistance du statut impossible.' });
            return;
        }

        writeJson(response, 200, {
            ok: true,
            user: toPublicAuthUser(updatedUser),
            persistedAt: new Date().toISOString(),
        });
    };

    const server = createServer(async (request, response) => {
        if (!request.url) {
            writeJson(response, 400, { ok: false, message: 'URL invalide.' });
            return;
        }

        if (request.method === 'OPTIONS') {
            writeJson(response, 204, null);
            return;
        }

        let url;
        try {
            url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        } catch {
            writeJson(response, 400, { ok: false, message: 'URL invalide.' });
            return;
        }
        const resetPasswordMatch = url.pathname.match(
            /^\/api\/auth\/users\/([^/]+)\/reset-password$/,
        );
        const resetPinMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/reset-pin$/);
        const setStatusMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/status$/);

        try {
            if (request.method === 'GET' && url.pathname === '/api/agent/checkin/health') {
                /* Sans clé : le service répond, rien de plus. Le détail (et jamais un
                   chemin du disque) est pour qui tient la clé d'administration. */
                const detail = isAdminAuthorized(request)
                    ? { collecte: { ...registre.etat(), firestore: firestore?.etat() ?? null } }
                    : {};
                writeJson(response, 200, {
                    ok: true,
                    service: 'neemba-agent-checkin',
                    version: VERSION,
                    now: new Date().toISOString(),
                    ...detail,
                });
                return;
            }

            if (request.method === 'GET' && url.pathname === '/api/agent/checkin') {
                if (!isAdminAuthorized(request)) {
                    writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
                    return;
                }
                const limite = Math.max(
                    1,
                    Math.min(500, Number(url.searchParams.get('limit') || 25)),
                );
                const entries = await registre.dernieresRemontees({
                    limite,
                    depuis: asString(url.searchParams.get('since')),
                });
                writeJson(response, 200, { ok: true, count: entries.length, entries });
                return;
            }

            if (request.method === 'GET' && url.pathname === '/api/agent/machines') {
                if (!isAdminAuthorized(request)) {
                    writeJson(response, 401, { ok: false, message: 'Accès admin requis.' });
                    return;
                }
                const machines = registre.machines({
                    depuis: asString(url.searchParams.get('since')),
                    source: asString(url.searchParams.get('source')),
                    limite: Math.max(
                        1,
                        Math.min(5000, Number(url.searchParams.get('limit') || 500)),
                    ),
                });
                writeJson(response, 200, { ok: true, count: machines.length, machines });
                return;
            }

            if (request.method === 'GET' && url.pathname === '/api/auth/health') {
                writeJson(response, 200, {
                    ok: true,
                    service: 'neemba-auth-admin',
                    now: new Date().toISOString(),
                    ...(isAdminAuthorized(request) ? { usersCount: state.authUsers.length } : {}),
                });
                return;
            }

            if (request.method === 'GET' && url.pathname === '/api/auth/users') {
                await handleGetAuthUsers(request, response);
                return;
            }

            if (request.method === 'POST' && resetPasswordMatch) {
                await handleResetAuthUserPassword(
                    request,
                    response,
                    decodeURIComponent(resetPasswordMatch[1]),
                );
                return;
            }

            if (request.method === 'POST' && resetPinMatch) {
                await handleResetAuthUserPin(
                    request,
                    response,
                    decodeURIComponent(resetPinMatch[1]),
                );
                return;
            }

            if (request.method === 'POST' && setStatusMatch) {
                await handleSetAuthUserStatus(
                    request,
                    response,
                    decodeURIComponent(setStatusMatch[1]),
                );
                return;
            }

            if (request.method === 'POST' && url.pathname === '/api/agent/checkin') {
                await recevoirUneRemontee(request, response);
                return;
            }

            if (request.method === 'POST' && url.pathname === '/api/agent/checkin/batch') {
                await recevoirUnLot(request, response);
                return;
            }

            writeJson(response, 404, { ok: false, message: 'Route introuvable.' });
        } catch (erreur) {
            journaliser.error('[tracker-backend] requête interrompue :', erreur);
            if (!response.headersSent)
                writeJson(response, 500, { ok: false, message: 'Erreur du serveur.' });
            else response.end();
        }
    });

    /* Une connexion qui n'envoie rien ne retient pas le serveur. */
    server.headersTimeout = 15_000;
    server.requestTimeout = 60_000;

    await new Promise((pret, echec) => {
        server.once('error', echec);
        server.listen(config.port, config.hote, pret);
    });

    return {
        server,
        registre,
        firestore,
        adresse: () => server.address(),
        async fermer() {
            await new Promise((fini) => server.close(fini));
            server.closeAllConnections?.();
            await firestore?.fermer();
            await registre.fermer();
        },
    };
};

const lanceDirectement =
    process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (lanceDirectement) {
    try {
        const config = lireLaConfiguration();
        const serveur = await demarrerLeServeur(config);
        const { port } = serveur.adresse();
        console.log(
            `[tracker-backend] à l'écoute sur http://${config.hote}:${port} (version ${VERSION})`,
        );
        console.log(`[tracker-backend] données : ${config.dossier}`);
        if (config.clesDEssai) {
            console.warn("[tracker-backend] clés d'essai : le serveur n'écoute que cette machine.");
        }
        console.log(
            serveur.firestore
                ? `[tracker-backend] Firestore branché (${serveur.firestore.etat().projet}).`
                : '[tracker-backend] Firestore non branché : les remontées restent sur ce disque.',
        );
        if (serveur.registre.relues > 0) {
            console.log(
                `[tracker-backend] ${serveur.registre.relues} remontée(s) relue(s) du journal.`,
            );
        }

        let arret = false;
        const arreter = async (signal) => {
            if (arret) return;
            arret = true;
            console.log(`[tracker-backend] ${signal} : écriture du registre, puis arrêt.`);
            await serveur.fermer().catch((erreur) => console.error(erreur));
            process.exit(0);
        };
        process.on('SIGINT', () => arreter('SIGINT'));
        process.on('SIGTERM', () => arreter('SIGTERM'));
    } catch (erreur) {
        console.error('[tracker-backend] démarrage impossible :', erreur.message);
        process.exit(1);
    }
}
