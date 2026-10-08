/**
 * **Côte à côte tant que ça tient, à la ligne sinon** (07/10).
 *
 * Trois chiffres de front, deux gestes de même largeur : les planches les dessinent à 393 px,
 * en colonnes égales (`grid-cols-3`, `grid-cols-2`). Une colonne égale ne connaît pas ce
 * qu'elle porte : à 360, « en réparation » mordait sur la marge de sa carte ; à 320, il en
 * sortait, et « Annuler la remise » dépassait de son bouton (relevé du 07/10, 46 pages de
 * 320 à 430).
 *
 * La rangée souple garde le dessin et lui donne une issue :
 * - tant que chaque case tient dans sa part, les parts sont **égales** — c'est la planche ;
 * - une case plus longue que sa part prend **sa largeur**, et les autres se partagent le reste ;
 * - quand elles ne tiennent plus de front, la dernière **passe à la ligne**.
 *
 * Aucun seuil de largeur : la rangée se règle sur son contenu, donc aussi sur un libellé
 * plus long demain, ou un texte agrandi dans les réglages du téléphone.
 *
 * `RANGEE_SOUPLE` va sur la rangée, avec sa gouttière (`gap-x-*`, et `gap-y-*` pour le jour
 * où elle se replie) ; `CASE_SOUPLE` sur chacun de ses enfants. `min-w-fit` : la case ne
 * descend pas sous son contenu — et c'est cette largeur que la rangée lit pour décider de
 * passer à la ligne.
 */
export const RANGEE_SOUPLE = 'flex flex-wrap';
export const CASE_SOUPLE = 'min-w-fit flex-1';

/* Deux gestes de même largeur (les gestes d'un héro, le pied d'une feuille) suivent la même
   règle par les utilitaires `duo-de-gestes` et `duo-de-pied` d'`index.css`. */
