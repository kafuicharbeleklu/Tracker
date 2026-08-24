import { Equipment } from '../../../types';

/**
 * **Les deux codes d'un équipement** — planche 04.3, section « Ce que c'est ».
 *
 * Un objet du parc en porte deux, et ils ne servent pas à la même chose :
 *
 * - **l'identifiant lisible** — `LPT-HQ-01` — *« composé du type, du site et du rang.
 *   Modifiable : c'est lui qui sera collé sur l'objet »*. C'est le `name` de la donnée,
 *   et c'est lui que `siteCodeOf` (10.1) relit pour déduire le code d'un site ;
 * - **le code interne** — `ASSET-10001` — *« généré, montré au moment de
 *   l'enregistrement, jamais tapé : un identifiant saisi à la main est un doublon en
 *   puissance »*.
 *
 * Les deux se calculent ici, pour la saisie d'une fiche **et** pour l'import d'un
 * fichier : deux endroits qui fabriqueraient le même code chacun de son côté
 * finiraient par en fabriquer deux différents.
 */

/**
 * Le préfixe de type, **relevé sur le parc** et non déduit du nom de la catégorie : un
 * moniteur porte `SCR`, une souris `MSE`, un casque `HDP`. Une catégorie créée par un
 * administrateur retombe sur ses trois premières lettres.
 */
const TYPE_PREFIXES: Record<string, string> = {
    Furniture: 'FRN',
    Headphones: 'HDP',
    Keyboard: 'KEY',
    Laptop: 'LPT',
    Monitor: 'SCR',
    Mouse: 'MSE',
    Phone: 'PHN',
    Printer: 'PRT',
    Server: 'SVR',
    Tablet: 'TAB',
};

export const typePrefix = (type: string): string =>
    TYPE_PREFIXES[type] ||
    (type || 'ACT')
        .replace(/[^A-Za-z]/g, '')
        .slice(0, 3)
        .toUpperCase();

/**
 * Le segment central — le **site**. Relevé sur les codes des actifs déjà rattachés au
 * site (la règle de `siteCodeOf`) ; fabriqué à partir du nom seulement à défaut. Ce qui
 * est relevé prime sur ce qui est deviné.
 */
export const siteSegment = (site: string, parc: Equipment[]): string => {
    const segments = parc
        .filter((item) => item.site === site)
        .map((item) => (item.name || '').split('-')[1])
        .filter(Boolean);

    if (segments.length > 0) {
        const [first] = segments;
        if (segments.every((segment) => segment === first)) return first;
    }

    return (
        site
            .replace(/[^A-Za-z]/g, '')
            .slice(0, 3)
            .toUpperCase() || 'HQ'
    );
};

/** `TYPE-SITE-RANG` — le rang suit le dernier utilisé sur ce couple, jamais le total. */
export const proposeReadableId = (type: string, site: string, parc: Equipment[]): string => {
    if (!type || !site) return '';
    const prefix = `${typePrefix(type)}-${siteSegment(site, parc)}`;
    const used = parc
        .map((item) => item.name || '')
        .filter((name) => name.startsWith(`${prefix}-`))
        .map((name) => parseInt(name.slice(prefix.length + 1), 10))
        .filter((rank) => Number.isFinite(rank));
    const next = (used.length > 0 ? Math.max(...used) : 0) + 1;
    return `${prefix}-${String(next).padStart(2, '0')}`;
};

/**
 * Le prochain code interne. Il suit le **dernier rang connu**, jamais l'horloge :
 * `ASSET-${Date.now()}` produisait `ASSET-1787...` à côté des `ASSET-10001` du parc.
 */
export const nextInternalCode = (parc: Equipment[]): string => {
    const ranks = parc
        .map((item) => parseInt((item.assetId || '').replace(/^ASSET-/, ''), 10))
        .filter((rank) => Number.isFinite(rank));
    return `ASSET-${(ranks.length > 0 ? Math.max(...ranks) : 10000) + 1}`;
};
