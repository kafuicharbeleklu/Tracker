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

/**
 * **Le code d'un pays — le même relevé, remonté d'un cran** (planche 10.1, passe
 * sobre du 03/09).
 *
 * La planche d'août lisait ce segment comme le code du **site** (« Code — porté par
 * les codes d'actifs : LPT-`HQ`-01 »). La passe sobre le relit comme le code du
 * **pays** : *« Le code du pays est celui qui préfixe les identifiants (Togo → LFW,
 * Bénin → COO) »*. C'est lui que porte la pastille de 32 px devant chaque famille de
 * la liste, et la rangée « Code pays » de la fiche.
 *
 * Même doctrine que {@link siteCodeOf}, et pour la même raison : le code n'est rendu
 * que si **tous** les actifs du pays s'accordent sur le segment. À défaut il n'y a
 * pas de code — la pastille montre alors le globe, et la fiche dit « à relever ».
 * *Ce qui n'est pas relevé n'est pas inventé* : découper trois lettres dans le nom du
 * pays donnerait un code d'apparence sûre pour une invention.
 *
 * **Ce n'est qu'un relevé, et il tient lieu de champ absent.** La planche veut un code
 * *porté par le pays* — la feuille « Ajouter un emplacement » annonce « un nom et son
 * code à trois lettres ». `LocationData.countries` est un `string[]` : il ne peut rien
 * porter de tel. Le jour où le store le portera, cette fonction devient le repli.
 */
export const countryCodeOf = (countryEquipment: Equipment[]): string | undefined =>
    siteCodeOf(countryEquipment);
