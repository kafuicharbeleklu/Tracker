import type { Equipment } from '../types';

/**
 * **Le vocabulaire d'état d'un objet importé, ramené à celui du produit.**
 *
 * L'inventaire de Neemba Togo est entré dans Firestore depuis un tableur, et il porte
 * ses propres mots : *Actif*, *Hors service*, *Défectueux*, *Autre*. Le produit, lui,
 * en déclare neuf, et ses écrans comptent sur eux — le tableau de bord annonçait
 * 257 actifs dont ses trois compteurs n'en reconnaissaient que 74.
 *
 * ## Ce qui décide, et ce qui n'est pas décidé ici
 *
 * Deux correspondances ne sont pas des choix : **le produit les avait déjà tranchées**
 * dans le barème du retour, qui envoie *Hors service* sur **Retiré** et *Mauvais* sur
 * **En réparation**. Les reprendre ailleurs, c'est tenir un seul vocabulaire.
 *
 * *Actif* est le seul mot qui demande à lire l'objet : un actif **détenu** est
 * *Attribué*, un actif **sans porteur** est *Disponible*. C'est la lecture qu'en fait
 * déjà le reste du produit, où le porteur et l'état ne se contredisent jamais.
 *
 * *Autre* n'est pas traduit. Seize objets le portent, et rien dans la donnée ne dit
 * lequel des neuf états il vaut : le deviner ferait entrer dans l'inventaire une
 * certitude que la source n'a pas. Ils gardent leur mot, comptent dans le total, et
 * n'apparaissent dans aucun compteur d'état — ce qui est exact.
 *
 * ## La casse et les accents
 *
 * La source porte *Hors service* et *Hors Service*, *Défectueux* et *Defectueux* : deux
 * paires qui ne diffèrent que par une majuscule ou un accent, et que tout comptage lit
 * comme quatre états. La clé de correspondance est donc **sans casse ni accent**.
 *
 * ## Où elle s'applique
 *
 * À la **lecture**, dans le normaliseur des enregistrements. La base garde ses valeurs
 * d'origine : une correspondance qui réécrit la source rend le tableur et Firestore
 * irréconciliables, et se relit mal le jour où l'un des deux change.
 */

/** Sans casse, sans accent, sans espaces de bord — la clé de comparaison. */
const clef = (valeur: string): string =>
    valeur
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();

/**
 * Les mots de la source qui ont un équivalent certain. `null` = l'état se lit sur
 * l'objet (voir *Actif*), absent = le mot n'a pas d'équivalent et se conserve.
 */
const CORRESPONDANCE: Record<string, Equipment['status'] | null> = {
    actif: null,
    'hors service': 'Retiré',
    defectueux: 'En réparation',
    // Les neuf états du produit se reconnaissent eux-mêmes : une base déjà propre
    // traverse la fonction sans rien changer.
    disponible: 'Disponible',
    attribue: 'Attribué',
    'en attente': 'En attente',
    'en reparation': 'En réparation',
    'en maintenance preventive': 'En maintenance préventive',
    retire: 'Retiré',
    perdu: 'Perdu',
    reforme: 'Réformé',
    manquant: 'Manquant',
};

/**
 * @param statut le mot porté par la source
 * @param aUnPorteur vrai quand l'objet est au nom de quelqu'un — c'est ce qui départage
 *   un *Actif* attribué d'un *Actif* en stock.
 * @returns l'état du produit, ou le mot d'origine quand il n'a pas d'équivalent.
 */
export const normalizeEquipmentStatus = (
    statut: string | undefined,
    aUnPorteur: boolean,
): Equipment['status'] => {
    if (!statut) return aUnPorteur ? 'Attribué' : 'Disponible';

    const correspondance = CORRESPONDANCE[clef(statut)];
    if (correspondance === null) return aUnPorteur ? 'Attribué' : 'Disponible';
    return correspondance ?? statut;
};
