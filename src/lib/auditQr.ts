import { AuditScanPayload } from '../types';

interface ParseAuditQrResult {
    ok: boolean;
    payload?: AuditScanPayload;
    error?: string;
}

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

const normalizeRam = (value: unknown): string | undefined => {
    const raw = asString(value);
    if (!raw) return undefined;
    if (/\b(gb|go|mb|mo|tb|to)\b/i.test(raw)) return raw;
    if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} GB`;
    return raw;
};

const normalizeStorage = (value: unknown): string | undefined => {
    const raw = asString(value);
    if (!raw) return undefined;
    if (/\b(gb|go|mb|mo|tb|to)\b/i.test(raw)) return raw;
    if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} GB`;
    return raw;
};

const read = (source: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
        if (key in source) return source[key];
    }
    return undefined;
};

const normalizePayload = (source: Record<string, unknown>): AuditScanPayload => {
    const payload: AuditScanPayload = {
        machineName: asString(read(source, ['machineName', 'machine_name', 'computerName', 'computer_name', 'deviceName', 'device_name'])),
        hostname: asString(read(source, ['hostname', 'host', 'hostName'])),
        assetId: asString(read(source, ['assetId', 'asset_id', 'assetTag', 'asset_tag'])),
        serialNumber: asString(read(source, ['serialNumber', 'serial_number', 'sn'])),
        os: asString(read(source, ['os', 'operatingSystem', 'operating_system'])),
        ram: normalizeRam(read(source, ['ram', 'ramGb', 'ram_gb', 'memory'])),
        storage: normalizeStorage(read(source, ['storage', 'disk', 'diskGb', 'disk_gb'])),
        type: asString(read(source, ['type', 'deviceType', 'device_type'])),
        model: asString(read(source, ['model'])),
        userName: asString(read(source, ['userName', 'user_name', 'username'])),
        userEmail: asString(read(source, ['userEmail', 'user_email', 'email'])),
        country: asString(read(source, ['country', 'pays'])),
        site: asString(read(source, ['site'])),
        service: asString(read(source, ['service', 'department', 'departement'])),
        scannedAt: asString(read(source, ['scannedAt', 'scanned_at', 'timestamp'])),
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

export const parseAuditQrPayload = (rawValue: string): ParseAuditQrResult => {
    const raw = rawValue.trim();
    if (!raw) {
        return { ok: false, error: 'Le contenu QR est vide.' };
    }

    let source: Record<string, unknown>;

    try {
        source = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        source = parseKeyValueInput(raw);
    }

    const payload = normalizePayload(source);
    const hasMachineIdentity = Boolean(payload.assetId || payload.hostname || payload.machineName || payload.serialNumber);
    if (!hasMachineIdentity) {
        return {
            ok: false,
            error: "QR invalide: aucun identifiant machine détecté (assetId, hostname ou serial).",
        };
    }

    return { ok: true, payload };
};
