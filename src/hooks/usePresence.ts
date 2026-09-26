import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * **Une surface reste là le temps de partir** (26/09) — feuilles, dialogues, menus.
 *
 * Fermée, une surface était démontée à l'instant : elle disparaissait d'un coup, là où
 * elle était arrivée en glissant. `usePresence` la garde montée pendant sa sortie
 * (`sortant`) et la démonte à la fin de l'animation (`finDeSortie`, à poser sur
 * `onAnimationEnd` de la surface — seulement pour **sa** propre animation, pas pour celle
 * d'un enfant qui finirait avant). Un filet de sécurité la démonte de toute façon après
 * 400 ms : une animation qui ne se joue pas (onglet caché) ne laisse pas un voile posé.
 */
export const usePresence = (ouvert: boolean) => {
    const [monte, setMonte] = useState(ouvert);
    const [sortant, setSortant] = useState(false);
    /* Lu seulement pour savoir s'il y a quelque chose à faire sortir. */
    const monteRef = useRef(monte);
    monteRef.current = monte;

    useEffect(() => {
        if (ouvert) {
            setMonte(true);
            setSortant(false);
        } else if (monteRef.current) {
            setSortant(true);
        }
    }, [ouvert]);

    const terminer = useCallback(() => {
        setMonte(false);
        setSortant(false);
    }, []);

    useEffect(() => {
        if (!sortant) return;
        const filet = window.setTimeout(terminer, 400);
        return () => window.clearTimeout(filet);
    }, [sortant, terminer]);

    /** À poser sur `onAnimationEnd` de la surface qui sort. */
    const finDeSortie = useCallback(
        (event: React.AnimationEvent<HTMLElement>) => {
            if (event.target === event.currentTarget && sortant) terminer();
        },
        [sortant, terminer],
    );

    return { monte, sortant, finDeSortie };
};
