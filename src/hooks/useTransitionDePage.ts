import { useEffect, useRef, type RefObject } from 'react';

/** Une durée ou une courbe du système, lue sur la racine : les jetons font foi. */
const jeton = (nom: string, repli: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;

/**
 * **Le passage d'une page à l'autre** (26/09) — l'axe partagé de Material 3.
 *
 * - Changer de destination (Accueil → Actifs) : **fondu**, la page d'avant n'a pas de
 *   rapport spatial avec la suivante.
 * - Descendre d'un cran (Actifs → une fiche, Finances → les dépenses) : la page arrive
 *   **de la droite** ; remonter : **de la gauche**. On sait d'où l'on vient.
 *
 * L'enveloppe du contenu est animée par l'API Web Animations, sans être remontée : une
 * page garde ce qu'elle tient en mémoire, et une feuille ouverte par-dessus (un acte, une
 * invitation) ne change pas la page affichée — rien ne bouge. « Réduire les animations » :
 * rien ne bouge du tout.
 *
 * `page` identifie la page affichée (vue et objet) ; l'adresse donne sa section et sa
 * profondeur.
 */
export const useTransitionDePage = (contenu: RefObject<HTMLElement | null>, page: string) => {
    const precedente = useRef<{ page: string; section: string; profondeur: number } | null>(null);

    useEffect(() => {
        const segments = (window.location.hash.replace(/^#/, '').split('?')[0] || '/')
            .split('/')
            .filter(Boolean);
        const actuelle = { page, section: segments[0] ?? '', profondeur: segments.length };
        const avant = precedente.current;
        precedente.current = actuelle;
        if (!avant || avant.page === actuelle.page) return;

        const element = contenu.current;
        if (!element || typeof element.animate !== 'function') return;
        /* Un écran plein (`FullScreenLayout`) est fixé à la fenêtre : animer l'enveloppe le
           cadrerait sur elle le temps du passage. Il a sa propre entrée. */
        if (element.querySelector('[data-plein-ecran]')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const sens =
            avant.section !== actuelle.section || avant.profondeur === actuelle.profondeur
                ? 'fondu'
                : actuelle.profondeur > avant.profondeur
                  ? 'avant'
                  : 'arriere';
        const decalage = sens === 'avant' ? 24 : sens === 'arriere' ? -24 : 0;
        const duree = parseFloat(
            jeton(
                sens === 'fondu' ? '--tk-motion-duration-short4' : '--tk-motion-duration-medium2',
                '250ms',
            ),
        );
        element.animate(
            [
                { opacity: 0, transform: `translate3d(${decalage}px, 0, 0)` },
                { opacity: 1, transform: 'none' },
            ],
            {
                duration: duree,
                easing: jeton('--tk-motion-easing-emphasized-decelerate', 'ease-out'),
            },
        );
    }, [contenu, page]);
};
