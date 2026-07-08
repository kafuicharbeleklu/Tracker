import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8787);
const MAX_BODY_BYTES = Number(process.env.AGENT_MAX_BODY_BYTES || 1024 * 1024);
const MAX_INDEX_IDS = Number(process.env.AGENT_MAX_INDEX_IDS || 10000);

const API_KEY = (
    process.env.NEEMBA_AGENT_API_KEY
    || process.env.AGENT_API_KEY
    || 'NEEMBA_AGENT_KEY'
).trim();
const ADMIN_API_KEY = (
    process.env.NEEMBA_ADMIN_API_KEY
    || 'NEEMBA_ADMIN_KEY'
).trim();

const DATA_DIR = resolve(process.cwd(), process.env.AGENT_DATA_DIR || 'backend/data');
const CHECKIN_FILE = join(DATA_DIR, 'agent-checkins.jsonl');
const INDEX_FILE = join(DATA_DIR, 'agent-checkin-index.json');
const AUTH_USERS_FILE = join(DATA_DIR, 'auth-users.json');
const AUTH_TEMP_PASSWORDS_FILE = join(DATA_DIR, 'auth-temp-passwords.json');
const AUTH_TEMP_PINS_FILE = join(DATA_DIR, 'auth-temp-pins.json');

const ALLOWED_SOURCES = new Set(['agent', 'active_directory', 'network_scan']);

const state = {
    seenCheckinIds: new Set(),
    authUsers: [],
    tempPasswords: {},
    tempPins: {},
};

const asString = (value) => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
};

const asBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeCapacity = (value, fallbackNumber) => {
    const text = asString(value);
    if (text) {
        if (/\d+\s*(gb|go|gib)/i.test(text)) return text;
        return `${text} GB`;
    }
    if (typeof fallbackNumber === 'number' && Number.isFinite(fallbackNumber)) {
        return `${Math.round(fallbackNumber)} GB`;
    }
    return '';
};

const fingerprintFromPayload = (payload) =>
    [
        payload.assetId,
        payload.serialNumber,
        payload.biosUuid,
        payload.macAddress,
        payload.hostname,
        payload.machineName,
    ]
        .map((value) => asString(value).toLowerCase())
        .filter(Boolean)
        .join('|');

const safeCompare = (left, right) => {
    if (!left || !right) return false;
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
};

const toPublicAuthUser = (user) => {
    if (!isObject(user)) return user;
    const { TemporaryPassword: _temporaryPassword, ...safeUser } = user;
    return safeUser;
};

const generateTempPassword = () => `Tmp#${Math.random().toString(36).slice(2, 10)}!`;
const generateTempPin = () => String(Math.floor(100000 + Math.random() * 900000));

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

const normalizeIncomingPayload = (rawInput) => {
    if (!isObject(rawInput)) {
        return { ok: false, error: 'Payload invalide: objet JSON attendu.' };
    }

    const raw = rawInput;
    const schema = asString(raw.schema);
    if (schema && schema !== 'neemba.agent.checkin.v1') {
        return { ok: false, error: `Schema non supporte (${schema}).` };
    }

    const source = asString(raw.source || raw.collector || raw.origin || 'agent').toLowerCase();
    const generatedAt = asString(raw.generatedAt || raw.scannedAt || raw.timestamp || new Date().toISOString());
    const device = isObject(raw.device) ? raw.device : raw;
    const user = isObject(raw.user) ? raw.user : raw;
    const context = isObject(raw.context) ? raw.context : raw;
    const apps = isObject(raw.apps) ? raw.apps : raw;
    const auth = isObject(raw.auth) ? raw.auth : raw;

    const payload = {
        source: source || 'agent',
        checkinId: asString(raw.checkinId || raw.checkin_id || raw.id),
        agentVersion: asString(raw.agentVersion || raw.agent_version),
        apiKey: asString(auth.apiKey || raw.apiKey || raw.api_key || raw.token),
        machineName: asString(device.machineName || raw.machineName || device.hostname || raw.hostname),
        hostname: asString(device.hostname || raw.hostname),
        assetId: asString(device.assetId || raw.assetId || raw.asset_id),
        serialNumber: asString(device.serialNumber || raw.serialNumber || raw.serial_number),
        biosUuid: asString(device.biosUuid || raw.biosUuid || raw.bios_uuid || device.uuid),
        macAddress: asString(device.macAddress || raw.macAddress || raw.mac || raw.mac_address),
        ipAddress: asString(device.ipAddress || raw.ipAddress || raw.ip || raw.ip_address),
        domain: asString(device.domain || raw.domain || raw.adDomain),
        os: asString(device.os || raw.os),
        ram: normalizeCapacity(device.ram || raw.ram, Number(device.ramGb || raw.ramGb || raw.ram_gb)),
        storage: normalizeCapacity(
            device.storage || raw.storage,
            Number(device.storageGb || raw.storageGb || raw.storage_gb),
        ),
        cpu: asString(device.cpu || raw.cpu),
        type: asString(device.type || raw.type),
        model: asString(device.model || raw.model),
        userName: asString(user.name || raw.userName || raw.user_name || raw.username),
        userEmail: asString(user.email || raw.userEmail || raw.user_email),
        country: asString(context.country || raw.country),
        site: asString(context.site || raw.site),
        service: asString(context.service || raw.service || raw.department),
        scannedAt: generatedAt,
        agents: {
            sentinelOne: asBoolean(apps.sentinelOne ?? raw.sentinelOne),
            matrix42: asBoolean(apps.matrix42 ?? raw.matrix42),
            manageEngine: asBoolean(apps.manageEngine ?? raw.manageEngine),
        },
    };

    if (!ALLOWED_SOURCES.has(payload.source)) {
        return { ok: false, error: `Source non autorisee (${payload.source}).` };
    }

    if (!payload.apiKey) {
        return { ok: false, error: 'Clé API agent absente.' };
    }

    if (Number.isNaN(Date.parse(payload.scannedAt))) {
        return { ok: false, error: 'Date de check-in invalide.' };
    }

    const hasIdentifier = Boolean(
        payload.assetId
        || payload.serialNumber
        || payload.biosUuid
        || payload.macAddress
        || payload.hostname
        || payload.machineName,
    );
    if (!hasIdentifier) {
        return {
            ok: false,
            error: 'Aucun identifiant machine détecté (assetId/serial/biosUuid/mac/hostname).',
        };
    }

    if (!payload.checkinId) {
        payload.checkinId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    return { ok: true, payload };
};

const ensureDataStore = async () => {
    await mkdir(DATA_DIR, { recursive: true });
    if (!existsSync(INDEX_FILE)) {
        await writeFile(INDEX_FILE, JSON.stringify({ seenCheckinIds: [] }, null, 2), 'utf8');
    }
    if (!existsSync(AUTH_USERS_FILE)) {
        await writeFile(AUTH_USERS_FILE, JSON.stringify(createDefaultAuthUsers(), null, 2), 'utf8');
    }
    if (!existsSync(AUTH_TEMP_PASSWORDS_FILE)) {
        await writeFile(
            AUTH_TEMP_PASSWORDS_FILE,
            JSON.stringify({ '3': generateTempPassword() }, null, 2),
            'utf8',
        );
    }
    if (!existsSync(AUTH_TEMP_PINS_FILE)) {
        await writeFile(
            AUTH_TEMP_PINS_FILE,
            JSON.stringify({ '3': generateTempPin() }, null, 2),
            'utf8',
        );
    }
};

const loadIndex = async () => {
    try {
        const raw = await readFile(INDEX_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        const ids = Array.isArray(parsed?.seenCheckinIds) ? parsed.seenCheckinIds : [];
        ids.forEach((id) => {
            const safeId = asString(id);
            if (safeId) state.seenCheckinIds.add(safeId);
        });
    } catch {
        state.seenCheckinIds.clear();
    }
};

const saveIndex = async () => {
    while (state.seenCheckinIds.size > MAX_INDEX_IDS) {
        const oldest = state.seenCheckinIds.values().next().value;
        state.seenCheckinIds.delete(oldest);
    }
    const snapshot = {
        seenCheckinIds: Array.from(state.seenCheckinIds),
        updatedAt: new Date().toISOString(),
    };
    await writeFile(INDEX_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
};

const loadAuthStore = async () => {
    try {
        const usersRaw = await readFile(AUTH_USERS_FILE, 'utf8');
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
        const tempRaw = await readFile(AUTH_TEMP_PASSWORDS_FILE, 'utf8');
        const tempPasswords = JSON.parse(tempRaw);
        state.tempPasswords = isObject(tempPasswords) ? tempPasswords : {};
    } catch {
        state.tempPasswords = {};
    }

    try {
        const tempRaw = await readFile(AUTH_TEMP_PINS_FILE, 'utf8');
        const tempPins = JSON.parse(tempRaw);
        state.tempPins = isObject(tempPins) ? tempPins : {};
    } catch {
        state.tempPins = {};
    }
};

const saveAuthStore = async () => {
    await writeFile(AUTH_USERS_FILE, JSON.stringify(state.authUsers, null, 2), 'utf8');
    await writeFile(AUTH_TEMP_PASSWORDS_FILE, JSON.stringify(state.tempPasswords, null, 2), 'utf8');
    await writeFile(AUTH_TEMP_PINS_FILE, JSON.stringify(state.tempPins, null, 2), 'utf8');
};

const readLastCheckIns = async (limit) => {
    if (!existsSync(CHECKIN_FILE)) return [];
    const text = await readFile(CHECKIN_FILE, 'utf8');
    const lines = text.split(/\r?\n/).filter(Boolean);
    const lastLines = lines.slice(-limit);
    return lastLines
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter(Boolean)
        .reverse();
};

const getBody = async (request) =>
    new Promise((resolveBody, rejectBody) => {
        const chunks = [];
        let bytes = 0;

        request.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > MAX_BODY_BYTES) {
                rejectBody(new Error('Payload trop volumineux.'));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });

        request.on('end', () => {
            try {
                const raw = Buffer.concat(chunks).toString('utf8');
                resolveBody(raw ? JSON.parse(raw) : {});
            } catch {
                rejectBody(new Error('JSON invalide.'));
            }
        });

        request.on('error', () => rejectBody(new Error('Lecture du body impossible.')));
    });

const writeJson = (response, statusCode, body) => {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-admin-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end(JSON.stringify(body));
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

const isAdminAuthorized = (request, body = null) => {
    const provided = extractAdminKey(request, body);
    return safeCompare(provided, ADMIN_API_KEY);
};

const handleCheckIn = async (request, response) => {
    let rawBody;
    try {
        rawBody = await getBody(request);
    } catch (error) {
        writeJson(response, 400, { ok: false, message: error.message });
        return;
    }

    const normalizedResult = normalizeIncomingPayload(rawBody);
    if (!normalizedResult.ok) {
        writeJson(response, 400, { ok: false, message: normalizedResult.error });
        return;
    }

    const payload = normalizedResult.payload;
    if (!safeCompare(payload.apiKey, API_KEY)) {
        writeJson(response, 401, { ok: false, message: 'Clé API invalide.' });
        return;
    }

    const dedupeKey = payload.checkinId || `fp:${fingerprintFromPayload(payload)}`;
    if (state.seenCheckinIds.has(dedupeKey)) {
        writeJson(response, 200, {
            ok: true,
            duplicate: true,
            message: 'Check-in déjà traité.',
            checkinId: payload.checkinId,
        });
        return;
    }

    const record = {
        id: randomUUID(),
        receivedAt: new Date().toISOString(),
        sourceIp: request.socket.remoteAddress || '',
        dedupeKey,
        payload,
    };

    try {
        await appendFile(CHECKIN_FILE, `${JSON.stringify(record)}\n`, 'utf8');
        state.seenCheckinIds.add(dedupeKey);
        await saveIndex();
    } catch {
        writeJson(response, 500, { ok: false, message: "Impossible d'enregistrer le check-in." });
        return;
    }

    writeJson(response, 201, {
        ok: true,
        duplicate: false,
        message: 'Check-in enregistré.',
        checkinId: payload.checkinId,
        storedId: record.id,
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
        rawBody = await getBody(request);
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
        rawBody = await getBody(request);
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
        writeJson(response, 500, { ok: false, message: 'Persistance du reset PIN impossible.' });
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
        rawBody = await getBody(request);
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
        writeJson(response, 204, { ok: true });
        return;
    }

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const resetPasswordMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/reset-password$/);
    const resetPinMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/reset-pin$/);
    const setStatusMatch = url.pathname.match(/^\/api\/auth\/users\/([^/]+)\/status$/);

    if (request.method === 'GET' && url.pathname === '/api/agent/checkin/health') {
        writeJson(response, 200, {
            ok: true,
            service: 'neemba-agent-checkin',
            now: new Date().toISOString(),
            dataDir: DATA_DIR,
            recordsFile: CHECKIN_FILE,
        });
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/agent/checkin') {
        const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 25)));
        try {
            const entries = await readLastCheckIns(limit);
            writeJson(response, 200, { ok: true, count: entries.length, entries });
        } catch {
            writeJson(response, 500, { ok: false, message: 'Lecture des check-ins impossible.' });
        }
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/health') {
        writeJson(response, 200, {
            ok: true,
            service: 'neemba-auth-admin',
            now: new Date().toISOString(),
            usersCount: state.authUsers.length,
            dataDir: DATA_DIR,
        });
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/users') {
        await handleGetAuthUsers(request, response);
        return;
    }

    if (request.method === 'POST' && resetPasswordMatch) {
        const userId = decodeURIComponent(resetPasswordMatch[1]);
        await handleResetAuthUserPassword(request, response, userId);
        return;
    }

    if (request.method === 'POST' && resetPinMatch) {
        const userId = decodeURIComponent(resetPinMatch[1]);
        await handleResetAuthUserPin(request, response, userId);
        return;
    }

    if (request.method === 'POST' && setStatusMatch) {
        const userId = decodeURIComponent(setStatusMatch[1]);
        await handleSetAuthUserStatus(request, response, userId);
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/agent/checkin') {
        await handleCheckIn(request, response);
        return;
    }

    writeJson(response, 404, { ok: false, message: 'Route introuvable.' });
});

const boot = async () => {
    await ensureDataStore();
    await loadIndex();
    await loadAuthStore();

    server.listen(PORT, HOST, () => {
        console.log(`[tracker-backend] API up on http://${HOST}:${PORT}`);
        console.log(`[tracker-backend] using data dir: ${DATA_DIR}`);
    });
};

boot().catch((error) => {
    console.error('[agent-checkin] boot failure:', error);
    process.exit(1);
});
