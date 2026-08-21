import { AuditScanPayload } from '../types';
import { parseAgentCheckInRaw } from './agentCheckin';

interface ParseAuditQrResult {
    ok: boolean;
    payload?: AuditScanPayload;
    error?: string;
}

/** Un code d'actif tel que le produit les émet : `ASSET-10001`. */
const ASSET_CODE = /^asset[-_ ]?\d+$/i;

/**
 * Une valeur lue **en clair** sur l'étiquette : pas d'accolade, pas de `clé=valeur`,
 * pas de retour à la ligne — et une longueur d'étiquette, pas de paragraphe.
 */
const looksLikeBareCode = (value: string): boolean =>
    value.length > 0
    && value.length <= 64
    && !/[\n\r{}]/.test(value)
    && !value.includes('=');

/**
 * **Le scan lit un numéro de série ou un code-barres, pas seulement un QR** (17.3, et
 * relevé C6 de 16.1).
 *
 * L'audit n'acceptait que la charge structurée d'un QR — JSON ou `clé=valeur` — alors
 * que le vocabulaire du produit parle depuis toujours de numéro de série et de
 * code-barres, et que 17.3 dessine le cadre de visée sur *« le numéro de série ou le
 * code-barres »*. Une étiquette collée sur un portable porte rarement un JSON.
 *
 * La charge structurée reste lue en premier : elle porte plus que l'identité — le
 * poste, l'utilisateur, les agents. À défaut, la valeur nue devient une **clé
 * d'identité**, et une seule : elle part dans `assetId` quand elle a la forme d'un code
 * d'actif, dans `serialNumber` sinon. La remplir dans les deux champs à la fois ferait
 * écraser le numéro de série d'un actif par son code, puisque c'est le scan qui écrit.
 */
export const parseAuditQrPayload = (rawValue: string): ParseAuditQrResult => {
    const parsed = parseAgentCheckInRaw(rawValue);
    if (parsed.ok && parsed.payload) {
        return { ok: true, payload: parsed.payload };
    }

    const bare = rawValue.trim();
    if (looksLikeBareCode(bare)) {
        return {
            ok: true,
            payload: ASSET_CODE.test(bare) ? { assetId: bare } : { serialNumber: bare },
        };
    }

    return {
        ok: false,
        error: parsed.error || 'Code illisible — attendu un numéro de série, un code d’actif ou le contenu d’un QR.',
    };
};
