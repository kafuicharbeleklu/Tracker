import { APP_SCROLLER_ID } from '../components/layout/MobileFrame';

/**
 * **Ce qui défile dans le produit.** Au téléphone, c'est le document ; **au bureau,
 * c'est `<main>`** — depuis que la coque tient la fenêtre (23/09), pour que le corps
 * d'un écran puisse défiler sous son en-tête. Dans le cadre de la dimension mobile,
 * c'était la couche interne du cadre.
 *
 * Un `window.scrollTo(0, 0)` posé en dur remonterait le document, qui ne bouge pas :
 * changer de page laisserait la nouvelle page au milieu, à la hauteur où l'on avait
 * quitté la précédente.
 */
export const getAppScroller = (): Window | HTMLElement => {
    const cadre = document.getElementById(APP_SCROLLER_ID);
    /* Le même identifiant porte les deux : la couche du cadre mobile hier, `<main>`
       aujourd'hui. Il ne défile qu'au bureau — ailleurs, c'est le document. */
    if (cadre && getComputedStyle(cadre).overflowY !== 'visible') return cadre;
    return window;
};

/** Remonter en tête de page, quel que soit le conteneur qui défile. */
export const scrollAppToTop = (): void => {
    getAppScroller().scrollTo(0, 0);
};
