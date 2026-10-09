/**
 * **Deux mesures de jauge pour tout le produit** (08/10).
 *
 * Vingt-deux barres de progression portaient quatre hauteurs (4, 6, 8 et 10 px) et quatre
 * arrondis (2 px, 4 px, 6 px, pilule) : à l'accueil, la barre du parc faisait 6 px sous celle
 * de l'inventaire en cours, 8 px, deux cartes côte à côte. La mesure suit désormais le rôle :
 *
 * - `JAUGE` — **la mesure d'une carte ou d'un héro**, celle qu'on lit en premier : le parc,
 *   l'inventaire en cours, une tuile, un poste ouvert, l'enveloppe d'un exercice. 8 px.
 * - `JAUGE_RANGEE` — **une barre par rangée**, répétée dans une liste ou un tableau : les
 *   postes, les lignes du budget, les lieux d'une campagne, mes équipements. 6 px.
 *
 * Un seul arrondi, 2 px (`rounded-xs`), celui que les planches dessinaient sur les jauges ;
 * le plein n'en pose pas d'autre — la piste le rogne (`overflow-hidden`). La piste garde sa
 * teinte : `surface-container` sur une carte, plus sombre sur un fond déjà creux, voilée de
 * blanc sur un héro sombre.
 *
 * Ce ne sont pas des jauges : l'attente indéterminée (`LoadingSpinner variant="linear"`, la
 * lecture d'un justificatif), un trait qui dit « ça travaille », pas « combien ».
 */
export const JAUGE = 'h-2 rounded-xs';
export const JAUGE_RANGEE = 'h-1.5 rounded-xs';
