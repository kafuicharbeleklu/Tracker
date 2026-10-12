/**
 * **Lire une remontée** : ce qu'un agent, un export d'annuaire ou un scan réseau envoie,
 * ramené à une seule forme et débarrassé de ce qui ne doit pas être gardé.
 *
 * Deux écritures sont acceptées : le schéma `neemba.agent.checkin.v1` (les faits rangés sous
 * `device`, `user`, `context`, `apps`, `auth`) et l'ancienne écriture à plat. La clé d'API,
 * quand elle voyage dans le corps, est rendue à part : elle n'entre jamais dans la remontée,
 * donc ni dans le journal ni dans le registre.
 */
import { isIP } from 'node:net';
import { estIdentifiable, identifiantsDe, idDeMachine, macValable } from './identite.mjs';

export const SCHEMA = 'neemba.agent.checkin.v1';
export const SOURCES = ['agent', 'active_directory', 'network_scan'];

/** Une horloge de poste en avance de plus de dix minutes ne date pas la remontée. */
const AVANCE_TOLEREE_MS = 10 * 60 * 1000;

const estObjet = (valeur) =>
    valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);

/** Un texte sans caractère de contrôle, aux espaces ramenés à un, borné. */
const propre = (valeur, max = 200) => {
    const brut =
        typeof valeur === 'string'
            ? valeur
            : typeof valeur === 'number' && Number.isFinite(valeur)
              ? String(valeur)
              : '';
    return brut
        .replace(/[\u0000-\u001f\u007f]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
};

const premier = (...valeurs) => {
    for (const valeur of valeurs) {
        const lu = propre(valeur);
        if (lu) return lu;
    }
    return '';
};

/** `true`, `false`, ou rien quand la remontée n'en dit rien. */
const ouiNon = (valeur) => {
    if (typeof valeur === 'boolean') return valeur;
    if (typeof valeur === 'number') return valeur === 1;
    if (typeof valeur !== 'string') return undefined;
    const lu = valeur.trim().toLowerCase();
    if (['true', '1', 'yes', 'oui', 'installed', 'present'].includes(lu)) return true;
    if (['false', '0', 'no', 'non', 'absent', 'missing'].includes(lu)) return false;
    return undefined;
};

const capacite = (valeur, enGo) => {
    const lu = propre(valeur, 40);
    if (lu) return /\d\s*(gb|go|gib|tb|to|mb|mo)\b/i.test(lu) ? lu : `${lu} GB`;
    const nombre = Number(enGo);
    return Number.isFinite(nombre) && nombre > 0 ? `${Math.round(nombre)} GB` : '';
};

const adresseMac = (valeur) => {
    const mac = macValable(valeur);
    return mac ? mac.toUpperCase().match(/.{2}/g).join(':') : '';
};

const adresseIp = (valeur) => {
    const lu = propre(valeur, 60);
    return isIP(lu) ? lu : '';
};

const courriel = (valeur) => {
    const lu = propre(valeur, 160).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lu) ? lu : '';
};

/**
 * @returns {{ ok: true, remontee: object, cle: string } | { ok: false, erreur: string, cle: string }}
 */
export const lireLaRemontee = (brut, { maintenant = Date.now() } = {}) => {
    if (!estObjet(brut)) {
        return { ok: false, erreur: 'Objet JSON attendu.', cle: '' };
    }

    const auth = estObjet(brut.auth) ? brut.auth : {};
    const cle = premier(auth.apiKey, brut.apiKey, brut.api_key, brut.token);

    const schema = propre(brut.schema, 80);
    if (schema && schema !== SCHEMA) {
        return { ok: false, erreur: `Schéma non reconnu (${schema}).`, cle };
    }

    const source = premier(brut.source, brut.collector, brut.origin).toLowerCase() || 'agent';
    if (!SOURCES.includes(source)) {
        return { ok: false, erreur: `Source non reconnue (${source}).`, cle };
    }

    const poste = estObjet(brut.device) ? brut.device : {};
    const personne = estObjet(brut.user) ? brut.user : {};
    const lieu = estObjet(brut.context) ? brut.context : {};
    const outils = estObjet(brut.apps) ? brut.apps : {};

    const dite = premier(brut.generatedAt, brut.scannedAt, brut.timestamp);
    let instant = dite ? Date.parse(dite) : maintenant;
    if (Number.isNaN(instant)) {
        return { ok: false, erreur: 'Date de remontée illisible.', cle };
    }
    if (instant > maintenant + AVANCE_TOLEREE_MS) instant = maintenant;

    const sentinelOne = ouiNon(outils.sentinelOne ?? brut.sentinelOne);
    const matrix42 = ouiNon(outils.matrix42 ?? brut.matrix42);
    const manageEngine = ouiNon(outils.manageEngine ?? brut.manageEngine);
    const outilsDits =
        sentinelOne !== undefined || matrix42 !== undefined || manageEngine !== undefined;

    const remontee = {
        source,
        checkinId: premier(brut.checkinId, brut.checkin_id, brut.id)
            .replace(/[^\w.:@-]+/g, '-')
            .slice(0, 120),
        agentVersion: premier(brut.agentVersion, brut.agent_version).slice(0, 40),
        machineName: premier(
            poste.machineName,
            brut.machineName,
            brut.machine_name,
            brut.computerName,
            poste.hostname,
            brut.hostname,
        ),
        hostname: premier(poste.hostname, brut.hostname, brut.host),
        assetId: premier(poste.assetId, brut.assetId, brut.asset_id, brut.assetTag),
        serialNumber: premier(poste.serialNumber, brut.serialNumber, brut.serial_number, brut.sn),
        biosUuid: premier(poste.biosUuid, brut.biosUuid, brut.bios_uuid, poste.uuid, brut.uuid),
        macAddress: adresseMac(
            premier(poste.macAddress, brut.macAddress, brut.mac_address, brut.mac),
        ),
        ipAddress: adresseIp(premier(poste.ipAddress, brut.ipAddress, brut.ip_address, brut.ip)),
        domain: premier(poste.domain, brut.domain, brut.adDomain),
        os: premier(poste.os, brut.os, brut.operatingSystem),
        ram: capacite(poste.ram ?? brut.ram, poste.ramGb ?? brut.ramGb ?? brut.ram_gb),
        storage: capacite(
            poste.storage ?? brut.storage,
            poste.storageGb ?? brut.storageGb ?? brut.storage_gb,
        ),
        cpu: premier(poste.cpu, brut.cpu, brut.processor),
        type: premier(poste.type, brut.type, brut.deviceType).slice(0, 60),
        model: premier(poste.model, brut.model),
        userName: premier(personne.name, brut.userName, brut.user_name, brut.username),
        userEmail: courriel(premier(personne.email, brut.userEmail, brut.user_email)),
        country: premier(lieu.country, brut.country, brut.pays),
        site: premier(lieu.site, brut.site),
        service: premier(lieu.service, brut.service, brut.department),
        scannedAt: new Date(instant).toISOString(),
        /* Un annuaire ou un scan réseau ne voit pas les logiciels du poste : se taire n'est
           pas dire « absent », et ne doit pas effacer ce que l'agent a relevé. */
        agents: outilsDits
            ? {
                  sentinelOne: sentinelOne ?? false,
                  matrix42: matrix42 ?? false,
                  manageEngine: manageEngine ?? false,
              }
            : undefined,
    };

    if (!estIdentifiable(identifiantsDe(remontee))) {
        return {
            ok: false,
            erreur: 'Aucun identifiant de machine (UUID, série, MAC, étiquette ou nom).',
            cle,
        };
    }

    /* Sans identifiant de remontée, la machine et l'instant en tiennent lieu : la même
       remontée renvoyée deux fois est reconnue. */
    if (!remontee.checkinId) remontee.checkinId = `${idDeMachine(remontee)}@${remontee.scannedAt}`;

    return { ok: true, remontee, cle };
};

/**
 * Un lot : un tableau, un objet `{ checkins: [...] }`, ou une remontée par ligne (NDJSON).
 * Rend aussi la clé posée une fois pour tout le lot.
 *
 * @returns {{ ok: true, entrees: unknown[], cle: string } | { ok: false, erreur: string }}
 */
export const lireLeLot = (texte) => {
    const brut = String(texte ?? '').trim();
    if (!brut) return { ok: false, erreur: 'Lot vide.' };

    let lu;
    try {
        lu = JSON.parse(brut);
    } catch {
        const entrees = [];
        for (const ligne of brut.split(/\r?\n/)) {
            if (!ligne.trim()) continue;
            try {
                entrees.push(JSON.parse(ligne));
            } catch {
                entrees.push(null);
            }
        }
        return { ok: true, entrees, cle: '' };
    }

    if (Array.isArray(lu)) return { ok: true, entrees: lu, cle: '' };
    if (estObjet(lu) && Array.isArray(lu.checkins)) {
        const auth = estObjet(lu.auth) ? lu.auth : {};
        return { ok: true, entrees: lu.checkins, cle: premier(auth.apiKey, lu.apiKey) };
    }
    if (estObjet(lu)) return { ok: true, entrees: [lu], cle: '' };
    return { ok: false, erreur: 'Tableau, objet « checkins » ou NDJSON attendu.' };
};
