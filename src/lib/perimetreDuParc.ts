/**
 * **Le périmètre qu'un autre écran passe à la liste des actifs** (09/10).
 *
 * La liste ne savait recevoir qu'un site et un état. La rangée d'un local ouvrait donc tout
 * son site, et « Voir les actifs » d'un type ou d'un modèle la liste entière : le geste
 * promettait une partie du parc et montrait le parc. Trois axes de plus — le local, le type,
 * le modèle —, portés par des adresses de renvoi que la coque intercepte :
 * `/inventory/site/<site>/local/<local>`, `/inventory/type/<type>`, `/inventory/model/<modèle>`.
 */
export interface PerimetreDuParc {
    /** Un local du site reçu, ou `SANS_LOCAL` pour ce que le site ne range nulle part. */
    local?: string;
    /** La clé d'un type du catalogue (`Laptop`). */
    type?: string;
    /** Le nom d'un modèle. */
    model?: string;
}

/** Les actifs d'un site qu'aucun local ne situe — la rangée « Sans local ». */
export const SANS_LOCAL = '__sans_local__';

/** L'adresse de renvoi vers les actifs d'un local (ou du reste du site). */
export const adresseDuLocal = (site: string, local: string | null): string =>
    `/inventory/site/${encodeURIComponent(site)}/local/${encodeURIComponent(local ?? SANS_LOCAL)}`;

/** Lit une adresse de renvoi ; `null` si elle ne porte pas de périmètre. */
export const lirePerimetreDuParc = (
    path: string,
): { site: string | null; perimetre: PerimetreDuParc | null } | null => {
    const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
    if (segments[0] !== 'inventory') return null;
    if (segments[1] === 'site' && segments[2]) {
        return {
            site: segments[2],
            perimetre: segments[3] === 'local' && segments[4] ? { local: segments[4] } : null,
        };
    }
    if (segments[1] === 'type' && segments[2])
        return { site: null, perimetre: { type: segments[2] } };
    if (segments[1] === 'model' && segments[2])
        return { site: null, perimetre: { model: segments[2] } };
    return null;
};
