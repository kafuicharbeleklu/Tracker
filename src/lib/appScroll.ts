import { APP_SCROLLER_ID } from '../components/layout/MobileFrame';

/**
 * **Ce qui défile dans le produit.** Au téléphone, c'est le document ; dans le cadre
 * de la dimension mobile, c'est la couche interne du cadre.
 *
 * Un `window.scrollTo(0, 0)` posé en dur remonterait le document, qui ne bouge pas :
 * changer de page laisserait la nouvelle page au milieu, à la hauteur où l'on avait
 * quitté la précédente.
 */
export const getAppScroller = (): Window | HTMLElement =>
    document.getElementById(APP_SCROLLER_ID) ?? window;

/** Remonter en tête de page, quel que soit le conteneur qui défile. */
export const scrollAppToTop = (): void => {
    getAppScroller().scrollTo(0, 0);
};
