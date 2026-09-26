/**
 * **Un nom long tient sur une ligne, coupé à l'ellipse** (25/09, second arbitrage).
 *
 * Le parc réel porte des noms de trente à quatre-vingts signes —
 * `Togo-AP55C-A400474CC7A47E7-NEW-BAT`. Le matin du 25/09, ils prenaient deux lignes avant
 * l'ellipse ; le soir, à la demande (« pour que les lignes soient harmonisées, pas certaines
 * plus hautes que d'autres »), ils reviennent à **une ligne**, au téléphone comme au bureau :
 * toutes les rangées d'une liste ont la même hauteur. Le nom entier reste en infobulle
 * (`infobulle`) et sur la fiche de l'objet.
 *
 * `block` : un titre posé dans un `<span>` ne se coupe qu'en bloc ; `whitespace-nowrap` est
 * dans `truncate`.
 */
export const NOM_SUR_UNE_LIGNE = 'block min-w-0 truncate';

/**
 * **Le sujet d'un héro descend d'un palier quand il est long** : en 28, un nom de soixante
 * signes prenait quatre lignes du héro au téléphone. Au-delà de ce seuil il passe au 22 —
 * toujours entier : le héro est l'endroit où on lit le nom en entier.
 */
const SUJET_LONG = 28;

export const estUnSujetLong = (sujet: unknown): boolean =>
    typeof sujet === 'string' && sujet.length > SUJET_LONG;

/** L'infobulle d'un titre : le nom entier, quand c'est du texte. */
export const infobulle = (titre: unknown): string | undefined =>
    typeof titre === 'string' ? titre : undefined;
