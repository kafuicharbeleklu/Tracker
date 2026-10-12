/**
 * **Reconnaître une machine d'une remontée à l'autre.**
 *
 * Module partagé : le serveur de collecte et l'application le lisent tous les deux
 * (`src/lib/identiteDeMachine.ts`). Une machine déposée à la main dans l'application et la
 * même machine remontée par son agent doivent tomber sur le même identifiant, sinon elle
 * apparaît deux fois dans Tâches.
 *
 * L'ancienne empreinte collait le numéro de série, l'UUID et l'adresse MAC bout à bout. Or
 * l'adresse MAC change avec la carte qui a le réseau (Wi-Fi, câble, station d'accueil) : un
 * portable posé sur sa station devenait une seconde machine. On retient donc **un seul**
 * identifiant, le plus sûr disponible, et les autres ne servent qu'à retrouver une machine
 * déjà connue.
 */

/**
 * Ce que les constructeurs laissent dans le BIOS quand ils n'y écrivent rien : des valeurs
 * que des centaines de machines partagent, donc qui n'en désignent aucune.
 */
const SERIES_CREUSES = new Set([
    'to be filled by o.e.m.',
    'to be filled by oem',
    'default string',
    'system serial number',
    'chassis serial number',
    'system product name',
    'not specified',
    'not applicable',
    'not available',
    'unknown',
    'invalid',
    'none',
    'null',
    'n/a',
    'oem',
    'o.e.m.',
    '123456789',
    '1234567890',
]);

/** UUID d'usine que des cartes mères entières portent à l'identique. */
const UUID_CREUX = new Set([
    '03000200040005000006000700080009',
    '00020003000400050006000700080009',
]);

const texte = (valeur) => {
    if (typeof valeur === 'string') return valeur.trim();
    if (typeof valeur === 'number' && Number.isFinite(valeur)) return String(valeur);
    return '';
};

const unSeulSigne = (valeur) => valeur.length === 0 || /^(.)\1*$/.test(valeur);

const enEtiquette = (valeur) =>
    valeur
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

/** Le numéro de série, en minuscules ; vide s'il ne désigne aucune machine. */
export const serieValable = (valeur) => {
    const serie = texte(valeur).toLowerCase();
    if (serie.length < 4 || SERIES_CREUSES.has(serie)) return '';
    if (unSeulSigne(serie.replace(/[^a-z0-9]/g, ''))) return '';
    return serie;
};

/** L'UUID du BIOS, réduit à ses 32 chiffres ; vide s'il est d'usine. */
export const uuidValable = (valeur) => {
    const uuid = texte(valeur)
        .toLowerCase()
        .replace(/[^a-f0-9]/g, '');
    if (uuid.length !== 32 || unSeulSigne(uuid) || UUID_CREUX.has(uuid)) return '';
    return uuid;
};

/** L'adresse MAC, réduite à ses 12 chiffres ; vide si elle est nulle ou de diffusion. */
export const macValable = (valeur) => {
    const mac = texte(valeur)
        .toLowerCase()
        .replace(/[^a-f0-9]/g, '');
    if (mac.length !== 12 || unSeulSigne(mac)) return '';
    return mac;
};

/** L'étiquette d'actif posée par l'informatique. */
export const etiquetteValable = (valeur) => {
    const etiquette = texte(valeur).toLowerCase();
    return etiquette.length >= 2 ? etiquette : '';
};

/**
 * Le nom de la machine, sans son domaine : l'agent envoie « PC-01 », l'annuaire et le DNS
 * « pc-01.neemba.local ». Une adresse IP reste entière.
 */
export const hoteValable = (valeur) => {
    const hote = texte(valeur).toLowerCase().replace(/\.+$/, '');
    if (!hote || hote === 'localhost') return '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hote)) return hote;
    return hote.split('.')[0];
};

/**
 * Les cinq identifiants d'une machine, du plus sûr au moins sûr. Accepte une remontée
 * (`biosUuid`, `serialNumber`…) comme une machine déjà rangée, qui portent les mêmes noms.
 */
export const identifiantsDe = (machine) => ({
    uuid: uuidValable(machine?.biosUuid),
    serie: serieValable(machine?.serialNumber),
    mac: macValable(machine?.macAddress),
    actif: etiquetteValable(machine?.assetId),
    hote: hoteValable(machine?.hostname || machine?.machineName),
});

const ORDRE = ['uuid', 'serie', 'mac', 'actif', 'hote'];

/** Les clés sous lesquelles une machine se retrouve : « uuid:… », « serie:… »… */
export const clesDe = (identifiants) =>
    ORDRE.filter((nom) => identifiants[nom]).map((nom) => `${nom}:${identifiants[nom]}`);

/** A-t-on de quoi désigner une machine ? */
export const estIdentifiable = (identifiants) => clesDe(identifiants).length > 0;

/**
 * L'identifiant du document : le même pour le serveur et pour l'application, et le même à
 * chaque remontée. Vide quand rien ne désigne la machine.
 */
export const idDeMachine = (machine) => {
    const identifiants = identifiantsDe(machine);
    if (identifiants.uuid) return `det_uuid_${identifiants.uuid}`;
    if (identifiants.serie) return `det_sn_${enEtiquette(identifiants.serie)}`;
    if (identifiants.mac) return `det_mac_${identifiants.mac}`;
    if (identifiants.actif) return `det_actif_${enEtiquette(identifiants.actif)}`;
    if (identifiants.hote) return `det_hote_${enEtiquette(identifiants.hote)}`;
    return '';
};

/**
 * Deux relevés désignent-ils la même machine ?
 *
 * L'UUID puis le numéro de série tranchent, **dans les deux sens** : deux UUID différents
 * sont deux machines, même si elles ont porté le même nom ou partagé une station d'accueil.
 * L'adresse MAC, l'étiquette et le nom ne servent qu'à défaut.
 */
export const memeMachine = (a, b) => {
    if (a.uuid && b.uuid) return a.uuid === b.uuid;
    if (a.serie && b.serie) return a.serie === b.serie;
    if (a.mac && b.mac && a.mac === b.mac) return true;
    if (a.actif && b.actif) return a.actif === b.actif;
    return Boolean(a.hote && b.hote && a.hote === b.hote);
};
