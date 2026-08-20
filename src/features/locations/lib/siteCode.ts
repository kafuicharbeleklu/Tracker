import { Equipment } from '../../../types';

/**
 * **Le code d'un site — relevé sur les codes d'actifs, jamais deviné** (planche 10.1).
 *
 * *« Code — porté par les codes d'actifs : LPT-`HQ`-01. »* Le site n'a pas de champ de
 * code dans la donnée ; il se lit sur le segment central des codes d'équipement qui
 * lui sont rattachés.
 *
 * Il n'est rendu que si **tous** les actifs du site s'accordent sur ce segment. Le
 * parc porte aussi des codes bâtis sur autre chose qu'un lieu — `MBP-SALES-01` —, et
 * prendre le plus fréquent donnerait un code d'apparence sûre pour une déduction
 * fragile : *« ce qui n'est pas relevé n'est pas inventé »*. À défaut, le site n'a pas
 * de code, et sa fiche le dit.
 */
export const siteCodeOf = (siteEquipment: Equipment[]): string | undefined => {
    const segments = siteEquipment
        .map((item) => (item.name || '').split('-')[1])
        .filter((segment): segment is string => Boolean(segment));

    if (segments.length === 0 || segments.length !== siteEquipment.length) return undefined;
    const [first] = segments;
    return segments.every((segment) => segment === first) ? first : undefined;
};
