import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

import { animer, courbeDouce, courbeRessort, mouvementReduit } from '../lib/mouvement';

/**
 * **La feuille change de hauteur, pas de contenu** (11/10).
 *
 * Passer du récapitulatif à l'attestation remplaçait le contenu d'un coup : la feuille
 * sautait de 420 à 300 px, et l'on ne savait plus si c'était le même acte. Elle garde
 * maintenant son bord et prend la hauteur de l'étape suivante, pendant que ce qui arrive se
 * pose dedans.
 *
 * - `surface` : la feuille, dont la hauteur suit son contenu.
 * - `cle` : ce qu'elle montre (« recap », « attester », le bloc à choisir). `null` tant
 *   qu'elle est fermée : une feuille qui s'ouvre ne s'anime pas deux fois.
 * - `corps` : ce qui change dedans, et qui arrive en fondu.
 *
 * La hauteur de départ est celle que le navigateur a mesurée en dernier, sans forcer de
 * mise en page ; un second changement pendant le premier repart d'où la feuille en est.
 * Sans `interpolate-size` (Chrome seul) : la hauteur est mesurée.
 */
export const useHauteurQuiSuit = (
    surface: RefObject<HTMLElement | null>,
    cle: string | null,
    corps?: RefObject<HTMLElement | null>,
) => {
    const vue = useRef<number | null>(null);
    const precedente = useRef<string | null>(null);
    const enCours = useRef<Animation | null>(null);
    const montee = cle !== null;

    useEffect(() => {
        const element = surface.current;
        if (!montee || !element || typeof ResizeObserver === 'undefined') return;
        vue.current = element.offsetHeight;
        const observateur = new ResizeObserver(() => {
            vue.current = element.offsetHeight;
        });
        observateur.observe(element);
        return () => {
            observateur.disconnect();
            vue.current = null;
        };
    }, [montee, surface]);

    useLayoutEffect(() => {
        const avantCle = precedente.current;
        precedente.current = cle;
        const element = surface.current;
        if (!element || cle === null || avantCle === null || avantCle === cle) return;
        if (mouvementReduit()) return;

        const avant = vue.current;
        enCours.current?.cancel();
        enCours.current = null;
        const apres = element.offsetHeight;

        if (avant !== null && Math.abs(avant - apres) >= 1) {
            enCours.current = animer(
                element,
                [
                    { height: `${avant}px`, overflow: 'hidden' },
                    { height: `${apres}px`, overflow: 'hidden' },
                ],
                { duration: 450, easing: courbeRessort() },
            );
        }
        if (corps?.current) {
            animer(
                corps.current,
                [
                    { opacity: 0, transform: 'translateY(6px)' },
                    { opacity: 1, transform: 'none' },
                ],
                { duration: 220, delay: 80, fill: 'backwards', easing: courbeDouce() },
            );
        }
    }, [cle, corps, surface]);
};
