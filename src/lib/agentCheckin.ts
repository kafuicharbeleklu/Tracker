import { AgentCheckInPayload } from '../types';

export interface ParseAgentCheckInResult {
    ok: boolean;
    payload?: AgentCheckInPayload;
    error?: string;
}

export interface ParseAgentBatchResult {
    ok: boolean;
    payloads: AgentCheckInPayload[];
    errors: string[];
}

export const AGENT_CHECKIN_SCHEMA_V1 = 'neemba.agent.checkin.v1';

const asString = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'oui', 'installed', 'present'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'non', 'absent', 'missing'].includes(normalized)) return false;
    return undefined;
};

const normalizeCapacity = (value: unknown, unit = 'GB'): string | undefined => {
    const raw = asString(value);
    if (!raw) return undefined;
    if (/\b(gb|go|mb|mo|tb|to)\b/i.test(raw)) return raw;
    if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} ${unit}`;
    return raw;
};

const read = (source: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
        if (key in source) return source[key];
    }
    return undefined;
};

const parseKeyValueInput = (raw: string): Record<string, unknown> => {
    const map: Record<string, unknown> = {};
    const chunks = raw
        .split(/\r?\n|[;|]/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);

    chunks.forEach((chunk) => {
        const separatorIndex = chunk.includes('=') ? chunk.indexOf('=') : chunk.indexOf(':');
        if (separatorIndex <= 0) return;
        const key = chunk.slice(0, separatorIndex).trim();
        const value = chunk.slice(separatorIndex + 1).trim();
        if (!key) return;
        map[key] = value;
    });

    return map;
};

const normalizeFromLegacyObject = (source: Record<string, unknown>): AgentCheckInPayload => {
    const payload: AgentCheckInPayload = {
        source: asString(read(source, ['source', 'collector', 'origin'])) as AgentCheckInPayload['source'],
        checkinId: asString(read(source, ['checkinId', 'checkin_id', 'id'])),
        agentVersion: asString(read(source, ['agentVersion', 'agent_version', 'version'])),
        apiKey: asString(read(source, ['apiKey', 'api_key', 'agentKey', 'agent_key', 'token'])),
        machineName: asString(read(source, ['machineName', 'machine_name', 'computerName', 'computer_name', 'deviceName', 'device_name'])),
        hostname: asString(read(source, ['hostname', 'host', 'hostName'])),
        assetId: asString(read(source, ['assetId', 'asset_id', 'assetTag', 'asset_tag'])),
        serialNumber: asString(read(source, ['serialNumber', 'serial_number', 'sn'])),
        biosUuid: asString(read(source, ['biosUuid', 'bios_uuid', 'uuid'])),
        os: asString(read(source, ['os', 'operatingSystem', 'operating_system'])),
        ram: normalizeCapacity(read(source, ['ram', 'ramGb', 'ram_gb', 'memory'])),
        storage: normalizeCapacity(read(source, ['storage', 'disk', 'diskGb', 'disk_gb'])),
        type: asString(read(source, ['type', 'deviceType', 'device_type'])),
        model: asString(read(source, ['model'])),
        userName: asString(read(source, ['userName', 'user_name', 'username'])),
        userEmail: asString(read(source, ['userEmail', 'user_email', 'email'])),
        country: asString(read(source, ['country', 'pays'])),
        site: asString(read(source, ['site'])),
        service: asString(read(source, ['service', 'department', 'departement'])),
        scannedAt: asString(read(source, ['scannedAt', 'scanned_at', 'timestamp', 'generatedAt', 'generated_at'])),
        macAddress: asString(read(source, ['macAddress', 'mac_address', 'mac'])),
        ipAddress: asString(read(source, ['ipAddress', 'ip_address', 'ip'])),
        domain: asString(read(source, ['domain', 'adDomain', 'ad_domain'])),
        cpu: asString(read(source, ['cpu', 'processor'])),
    };

    const sentinelOne = asBoolean(read(source, ['sentinelOne', 'sentinel_one', 'sentinelone']));
    const matrix42 = asBoolean(read(source, ['matrix42', 'matrix_42']));
    const manageEngine = asBoolean(read(source, ['manageEngine', 'manage_engine', 'manageengine']));
    if (sentinelOne !== undefined || matrix42 !== undefined || manageEngine !== undefined) {
        payload.agents = {
            sentinelOne,
            matrix42,
            manageEngine,
        };
    }

    return payload;
};

const normalizeFromSchemaV1 = (source: Record<string, unknown>): AgentCheckInPayload => {
    const device = (source.device && typeof source.device === 'object') ? source.device as Record<string, unknown> : {};
    const user = (source.user && typeof source.user === 'object') ? source.user as Record<string, unknown> : {};
    const context = (source.context && typeof source.context === 'object') ? source.context as Record<string, unknown> : {};
    const apps = (source.apps && typeof source.apps === 'object') ? source.apps as Record<string, unknown> : {};
    const auth = (source.auth && typeof source.auth === 'object') ? source.auth as Record<string, unknown> : {};

    return {
        source: (asString(source.source) as AgentCheckInPayload['source']) || 'agent',
        checkinId: asString(source.checkinId),
        agentVersion: asString(source.agentVersion),
        apiKey: asString(auth.apiKey ?? source.apiKey),
        machineName: asString(device.machineName),
        hostname: asString(device.hostname),
        assetId: asString(device.assetId),
        serialNumber: asString(device.serialNumber),
        biosUuid: asString(device.biosUuid),
        os: asString(device.os),
        ram: normalizeCapacity(device.ramGb ?? device.ram),
        storage: normalizeCapacity(device.storageGb ?? device.storage),
        type: asString(device.type),
        model: asString(device.model),
        userName: asString(user.name),
        userEmail: asString(user.email),
        country: asString(context.country),
        site: asString(context.site),
        service: asString(context.service),
        scannedAt: asString(source.generatedAt ?? source.timestamp),
        macAddress: asString(device.macAddress),
        ipAddress: asString(device.ipAddress),
        domain: asString(device.domain),
        cpu: asString(device.cpu),
        agents: {
            sentinelOne: asBoolean(apps.sentinelOne),
            matrix42: asBoolean(apps.matrix42),
            manageEngine: asBoolean(apps.manageEngine),
        },
    };
};

const validatePayload = (payload: AgentCheckInPayload): ParseAgentCheckInResult => {
    const hasMachineIdentity = Boolean(payload.assetId || payload.hostname || payload.machineName || payload.serialNumber);
    if (!hasMachineIdentity) {
        return {
            ok: false,
            error: "Check-in invalide: aucun identifiant machine détecté (assetId, hostname ou serial).",
        };
    }

    return { ok: true, payload };
};

export const parseAgentCheckInObject = (value: unknown): ParseAgentCheckInResult => {
    if (!value || typeof value !== 'object') {
        return { ok: false, error: 'Payload check-in invalide: objet attendu.' };
    }

    const source = value as Record<string, unknown>;
    const schema = asString(source.schema);

    if (schema && schema !== AGENT_CHECKIN_SCHEMA_V1) {
        return {
            ok: false,
            error: `Schema check-in non supporté (${schema}). Schema attendu: ${AGENT_CHECKIN_SCHEMA_V1}.`,
        };
    }

    const payload = schema === AGENT_CHECKIN_SCHEMA_V1
        ? normalizeFromSchemaV1(source)
        : normalizeFromLegacyObject(source);

    return validatePayload(payload);
};

export const parseAgentCheckInRaw = (rawValue: string): ParseAgentCheckInResult => {
    const raw = rawValue.trim();
    if (!raw) {
        return { ok: false, error: 'Le contenu check-in est vide.' };
    }

    let source: unknown;
    try {
        source = JSON.parse(raw);
    } catch {
        source = parseKeyValueInput(raw);
    }

    return parseAgentCheckInObject(source);
};

export const parseAgentBatchContent = (rawValue: string): ParseAgentBatchResult => {
    const raw = rawValue.trim();
    if (!raw) {
        return { ok: false, payloads: [], errors: ['Fichier vide.'] };
    }

    const payloads: AgentCheckInPayload[] = [];
    const errors: string[] = [];

    try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            parsed.forEach((entry, index) => {
                const result = parseAgentCheckInObject(entry);
                if (result.ok && result.payload) payloads.push(result.payload);
                else errors.push(`Ligne ${index + 1}: ${result.error || 'format invalide'}.`);
            });
        } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).checkins)) {
            const checkins = (parsed as Record<string, unknown>).checkins as unknown[];
            checkins.forEach((entry, index) => {
                const result = parseAgentCheckInObject(entry);
                if (result.ok && result.payload) payloads.push(result.payload);
                else errors.push(`Entrée ${index + 1}: ${result.error || 'format invalide'}.`);
            });
        } else {
            const single = parseAgentCheckInObject(parsed);
            if (single.ok && single.payload) payloads.push(single.payload);
            else errors.push(single.error || 'Payload invalide.');
        }
    } catch {
        const lines = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        lines.forEach((line, index) => {
            const result = parseAgentCheckInRaw(line);
            if (result.ok && result.payload) payloads.push(result.payload);
            else errors.push(`Ligne ${index + 1}: ${result.error || 'format invalide'}.`);
        });
    }

    return {
        ok: payloads.length > 0,
        payloads,
        errors,
    };
};
