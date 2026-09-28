import { MEDIA } from '../constants/breakpoints';
import { useMediaQuery } from './useMediaQuery';

/**
 * **Le scan d'une étiquette, seulement sur un appareil qu'on tient** (27/09, à la demande :
 * *« il n'y a pas de pertinence à avoir scan sur desktop »*).
 *
 * Scanner, c'est viser une étiquette avec la caméra arrière : un téléphone, une tablette. Un
 * poste à souris n'a qu'une webcam tournée vers son utilisateur, et le geste y est un leurre.
 * 17.11 l'avait déjà tranché pour l'inventaire physique (*« le geste de la caméra reste au
 * téléphone »*) ; ce crochet l'étend à tous les écrans qui offrent un scan.
 *
 * Le critère est **le pointeur**, pas la largeur : un iPad en paysage dépasse 1 000 px et
 * garde sa caméra ; un portable, même étroit, a une souris. Le geste retiré ne laisse jamais
 * l'objet sans chemin : la recherche et la saisie restent.
 */
export const useScanPossible = (): boolean => !useMediaQuery(MEDIA.hoverCapable);
