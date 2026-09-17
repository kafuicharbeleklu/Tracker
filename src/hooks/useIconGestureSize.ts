import { createContext, useContext } from 'react';

/**
 * **La mesure du carré d'un bouton d'icône — c'est le gabarit qui la décide.**
 *
 * Au téléphone et dans un flux (00.5), le geste d'icône fait 48 de côté : la barre de
 * 56, la barre d'un formulaire, le titre d'une feuille. Dans le chrome du bureau
 * (17.11) il fait 40 : l'en-tête de page, la ligne d'outils, la barre latérale.
 *
 * C'est la même primitive posée dans deux gabarits, et seul le gabarit sait où il
 * est. Relevé du 13/09 : 51 écrans de bureau portaient leurs gestes d'en-tête à 48,
 * parce que chaque page glissait son bouton sans savoir qu'elle était au bureau — et
 * qu'une hauteur posée par l'appelant ne battait pas le minimum de la primitive.
 */
export type IconGestureSize = 48 | 40;

export const IconGestureSizeContext = createContext<IconGestureSize>(48);

export const useIconGestureSize = (): IconGestureSize => useContext(IconGestureSizeContext);
