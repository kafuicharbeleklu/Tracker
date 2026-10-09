import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * **Ce qui tient, entier, dans une carte à hauteur imposée** (09/10).
 *
 * Au bureau, certaines cartes reçoivent leur hauteur de la fenêtre : le panneau de
 * l'inventaire, la colonne d'une campagne, les cartes de l'accueil. Leur liste défilait
 * dedans. Elle montre désormais **ce qui tient** — des rangées entières, jamais une rangée
 * coupée — et la carte renvoie au reste (`ToutVoir`).
 *
 * La zone (`zone`) est l'élément dont les enfants directs sont les pièces de la liste ; elle
 * doit être `relative min-h-0 flex-1 overflow-clip`. On lui donne quelques pièces de plus
 * que ce qu'elle peut montrer : celles qui ne tiennent pas restent en place, invisibles
 * (`visibility: hidden` — ni lues, ni atteintes au clavier), pour pouvoir être mesurées
 * quand la carte grandit.
 *
 * `reserve` est la hauteur du pied **qui n'existe que si la liste est tronquée** : il prend
 * sa place à la zone en paraissant, et la mesure en tient compte pour ne pas osciller.
 * Un pied toujours présent n'a rien à réserver.
 *
 * Dans une colonne qui n'impose pas de hauteur (le téléphone), la zone a celle de son
 * contenu : tout ce qu'on lui donne tient, et la troncature ne vient que de `total`.
 */
export function useCeQuiTient<T extends HTMLElement = HTMLDivElement>(total: number, reserve = 0) {
    const zone = useRef<T>(null);
    const [vues, setVues] = useState(total);
    const visibles = Math.min(vues, total);
    const tronque = visibles < total;
    /* L'état du pied tel que le dernier rendu l'a posé : la mesure lui rend sa hauteur. */
    const piedPose = useRef(tronque);
    piedPose.current = tronque;

    const mesurer = useCallback(() => {
        const el = zone.current;
        if (!el) return;
        const pieces = Array.from(el.children) as HTMLElement[];
        /* Une liste vide : ce que la zone contient n'est pas une pièce (un état vide). */
        if (total === 0) {
            pieces.forEach((piece) => {
                piece.style.visibility = '';
            });
            setVues(0);
            return;
        }
        const bas = (piece: HTMLElement) => piece.offsetTop + piece.offsetHeight;
        const hauteur = el.clientHeight + (piedPose.current ? reserve : 0);
        const dernier = pieces[pieces.length - 1];
        let n: number;
        if (pieces.length >= total && (!dernier || bas(dernier) <= hauteur + 1)) {
            n = total;
        } else {
            const limite = hauteur - reserve + 1;
            n = 0;
            while (n < pieces.length && bas(pieces[n]) <= limite) n += 1;
            /* Une carte qui ne montrerait rien de sa liste est pire qu'une rangée rognée. */
            if (n === 0 && pieces.length > 0) n = 1;
        }
        pieces.forEach((piece, index) => {
            piece.style.visibility = index < n ? '' : 'hidden';
        });
        setVues((avant) => (avant === n ? avant : n));
    }, [reserve, total]);

    /* Après chaque rendu : les pièces ont pu changer, et React ne sait rien de leur
       visibilité, posée à la main. */
    useLayoutEffect(() => {
        mesurer();
    });

    useEffect(() => {
        const el = zone.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observateur = new ResizeObserver(mesurer);
        observateur.observe(el);
        Array.from(el.children).forEach((piece) => observateur.observe(piece));
        return () => observateur.disconnect();
    });

    return { zone, visibles, tronque };
}
