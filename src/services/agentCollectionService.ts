import type { AgentCheckInPayload } from '../types';

interface AgentApiResponse {
    ok: boolean;
    message?: string;
    duplicate?: boolean;
    checkinId?: string;
}

interface AgentHealthResponse {
    ok: boolean;
    service?: string;
    now?: string;
    dataDir?: string;
}

const normalizeBaseUrl = (rawUrl: string): string => rawUrl.trim().replace(/\/+$/, '');

const toApiPayload = (payload: AgentCheckInPayload, apiKey: string) => ({
    schema: 'neemba.agent.checkin.v1',
    source: payload.source || 'agent',
    generatedAt: payload.scannedAt || new Date().toISOString(),
    checkinId: payload.checkinId,
    agentVersion: payload.agentVersion || 'web-bridge-1.0.0',
    auth: {
        apiKey: payload.apiKey || apiKey,
    },
    device: {
        machineName: payload.machineName,
        hostname: payload.hostname,
        assetId: payload.assetId,
        serialNumber: payload.serialNumber,
        biosUuid: payload.biosUuid,
        macAddress: payload.macAddress,
        ipAddress: payload.ipAddress,
        domain: payload.domain,
        os: payload.os,
        ram: payload.ram,
        storage: payload.storage,
        cpu: payload.cpu,
        type: payload.type,
        model: payload.model,
    },
    user: {
        name: payload.userName,
        email: payload.userEmail,
    },
    context: {
        country: payload.country,
        site: payload.site,
        service: payload.service,
    },
    apps: {
        sentinelOne: payload.agents?.sentinelOne ?? false,
        matrix42: payload.agents?.matrix42 ?? false,
        manageEngine: payload.agents?.manageEngine ?? false,
    },
});

export const postAgentCheckIn = async (
    apiBaseUrl: string,
    payload: AgentCheckInPayload,
    apiKey: string,
    timeoutMs = 7000,
): Promise<AgentApiResponse> => {
    const base = normalizeBaseUrl(apiBaseUrl);
    if (!base) {
        return { ok: false, message: 'URL API manquante.' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${base}/api/agent/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(toApiPayload(payload, apiKey)),
            signal: controller.signal,
        });
        const body = (await response.json()) as AgentApiResponse;
        return {
            ok: Boolean(body.ok && response.ok),
            duplicate: Boolean(body.duplicate),
            checkinId: body.checkinId,
            message: body.message || (response.ok ? 'Check-in envoyé.' : "Erreur d'API."),
        };
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        return {
            ok: false,
            message: isTimeout ? 'Timeout API check-in.' : 'API check-in indisponible.',
        };
    } finally {
        clearTimeout(timeout);
    }
};

export const checkAgentApiHealth = async (
    apiBaseUrl: string,
    timeoutMs = 5000,
): Promise<AgentHealthResponse> => {
    const base = normalizeBaseUrl(apiBaseUrl);
    if (!base) return { ok: false };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${base}/api/agent/checkin/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        const body = (await response.json()) as AgentHealthResponse;
        return {
            ok: Boolean(response.ok && body.ok),
            service: body.service,
            now: body.now,
            dataDir: body.dataDir,
        };
    } catch {
        return { ok: false };
    } finally {
        clearTimeout(timeout);
    }
};
