import { AuditScanPayload } from '../types';
import { parseAgentCheckInRaw } from './agentCheckin';

interface ParseAuditQrResult {
    ok: boolean;
    payload?: AuditScanPayload;
    error?: string;
}

export const parseAuditQrPayload = (rawValue: string): ParseAuditQrResult => {
    const parsed = parseAgentCheckInRaw(rawValue);
    if (!parsed.ok || !parsed.payload) {
        return {
            ok: false,
            error: parsed.error || 'QR invalide.',
        };
    }

    return {
        ok: true,
        payload: parsed.payload,
    };
};
