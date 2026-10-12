/**
 * **Ce que les mouvements écrits en JavaScript partagent** (11/10) : les jetons lus sur la
 * racine, le réglage « réduire les animations », et une animation qui ne casse pas quand le
 * navigateur ne connaît pas une courbe en `linear()`.
 *
 * Un mouvement se règle en CSS (`mvt-*`) chaque fois qu'il le peut. Il passe par ici quand il
 * dépend d'une mesure prise à l'instant : la hauteur d'une feuille, le cadre d'une rangée,
 * la place d'un compteur.
 */

/** Une durée ou une courbe du système : les jetons font foi. */
export const jeton = (nom: string, repli: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;

export const mouvementReduit = (): boolean =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** La courbe sans dépassement des couleurs, des opacités et des entrées. */
export const courbeDouce = (): string =>
    jeton('--tk-motion-easing-standard', 'cubic-bezier(0.2, 0, 0, 1)');

/** Le ressort ample (rebond 0,3) : ce qui se déplace ou change de taille. */
export const courbeRessort = (): string =>
    jeton('--tk-motion-easing-ressort-ample', 'cubic-bezier(0.2, 0, 0, 1)');

/**
 * Anime un élément. Une courbe que le navigateur refuse (`linear()` avant Chrome 113,
 * Safari 17.2, Firefox 112) se remplace par la courbe douce au lieu de lever.
 */
export const animer = (
    element: Element,
    images: Keyframe[],
    options: KeyframeAnimationOptions,
): Animation | null => {
    if (typeof element.animate !== 'function') return null;
    try {
        return element.animate(images, options);
    } catch {
        return element.animate(images, { ...options, easing: courbeDouce() });
    }
};
