import { RefObject, useEffect, useState } from 'react';

/** Course minimale avant de basculer — évite le clignotement sur les micro-scrolls. */
const SCROLL_DELTA = 8;
/** En deçà, on est encore « en haut de liste » : le FAB reste visible. */
const REVEAL_OFFSET = 72;

/**
 * Remonte au premier ancêtre réellement scrollable. Le contenu des pages vit dans le
 * conteneur `overflow-y-auto` d'`AppLayout`, PAS dans `window` : écouter le scroll de
 * la fenêtre ne déclencherait jamais rien.
 */
const findScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
    let node = element?.parentElement ?? null;
    while (node) {
        const { overflowY } = window.getComputedStyle(node);
        if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }
    return window;
};

/**
 * Masque un élément flottant pendant le scroll DESCENDANT, le rétablit dès que
 * l'utilisateur remonte (DESIGN_BRIEF.md §5 : « FAB masqué au scroll descendant »).
 *
 * @param anchorRef élément de la page servant à retrouver le conteneur scrollable.
 * @returns `true` quand l'élément flottant doit être masqué.
 */
export const useHideOnScrollDown = (anchorRef: RefObject<HTMLElement | null>): boolean => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const target = findScrollParent(anchorRef.current);
        const readTop = () =>
            target instanceof Window ? window.scrollY : target.scrollTop;

        let lastTop = readTop();

        const handleScroll = () => {
            const top = readTop();
            const delta = top - lastTop;
            if (Math.abs(delta) < SCROLL_DELTA) return;
            lastTop = top;
            setHidden(delta > 0 && top > REVEAL_OFFSET);
        };

        target.addEventListener('scroll', handleScroll, { passive: true });
        return () => target.removeEventListener('scroll', handleScroll);
    }, [anchorRef]);

    return hidden;
};
