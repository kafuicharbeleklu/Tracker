import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * **La liste virtualisée** (« windowing ») — 23/09, à la place de « Charger la suite ».
 *
 * *« Charger juste la partie visible, et quand l'utilisateur descend, charger ce qui est
 * en bas et libérer ce qui est en haut. »* C'est la technique de TanStack Virtual ou de
 * react-window : on ne monte que les rangées qui tombent dans la fenêtre, plus une marge
 * de quelques rangées de part et d'autre (`overscan`) ; deux cales vides, au-dessus et
 * au-dessous, gardent à la liste sa hauteur réelle — la barre de défilement dit donc
 * toujours la vraie longueur, et on peut sauter au bout d'un geste. 5 000 actifs, c'est
 * une trentaine de rangées dans le DOM.
 *
 * Ce que le crochet ne présume pas :
 * - **qui défile.** Au téléphone c'est le document, au bureau `<main>` ou le corps de la
 *   page, dans un tableau son propre cadre. La bande visible est calculée comme
 *   l'intersection de la fenêtre et de **tous** les ancêtres qui coupent leur contenu ;
 *   l'écoute se fait en capture sur le document, qui reçoit le défilement de n'importe
 *   quel conteneur.
 * - **la hauteur des rangées.** Elle est estimée, puis **mesurée** : chaque rangée montée
 *   est relue par un `ResizeObserver`, et la mesure remplace l'estimation. Une hauteur
 *   fausse ne ferait pas qu'un à-coup — sur mille rangées, un pixel d'écart par rangée
 *   décale la fenêtre de mille pixels, et l'écran montrerait une cale vide.
 *
 * Le contrat avec l'appelant : les rangées rendues sont les **enfants directs** de
 * l'élément qui porte `anchorRef`, dans l'ordre, et les deux cales portent
 * `data-cale` (voir `VIRTUAL_SPACER`). C'est ce qui permet de mesurer sans poser de
 * `ref` sur des composants qui n'en acceptent pas.
 *
 * Ce que ce n'est pas : de la pagination côté serveur. Les données du parc arrivent déjà
 * en mémoire par les abonnements de `DataContext` ; ce qui coûtait, c'était de monter des
 * milliers de rangées, et c'est ce que la fenêtre supprime.
 */

/** L'attribut des deux cales — les rangées se reconnaissent à son absence. */
export const VIRTUAL_SPACER = { 'data-cale': '', 'aria-hidden': true } as const;

interface Options {
    count: number;
    /** La hauteur supposée de la rangée `index`, tant qu'elle n'a pas été mesurée. */
    estimateSize: (index: number) => number;
    /** Les pixels montés au-delà de la bande visible, de chaque côté. */
    overscanPx?: number;
}

export interface VirtualWindow<T extends HTMLElement> {
    anchorRef: React.RefObject<T | null>;
    start: number;
    end: number;
    /** Hauteur de la cale du haut. */
    before: number;
    /** Hauteur de la cale du bas. */
    after: number;
}

const COUPE = new Set(['auto', 'scroll', 'hidden', 'clip']);

/** Les ancêtres qui coupent leur contenu : la bande visible est leur intersection. */
const ancetresCoupants = (el: HTMLElement): HTMLElement[] => {
    const liste: HTMLElement[] = [];
    for (let p = el.parentElement; p; p = p.parentElement) {
        if (COUPE.has(getComputedStyle(p).overflowY)) liste.push(p);
    }
    return liste;
};

/** Le premier indice dont la fin dépasse `y` — recherche dichotomique dans les cumuls. */
const indiceA = (cumuls: Float64Array, count: number, y: number): number => {
    let bas = 0;
    let haut = count;
    while (bas < haut) {
        const milieu = (bas + haut) >> 1;
        if (cumuls[milieu + 1] <= y) bas = milieu + 1;
        else haut = milieu;
    }
    return bas;
};

export function useVirtualWindow<T extends HTMLElement>({
    count,
    estimateSize,
    overscanPx = 480,
}: Options): VirtualWindow<T> {
    const anchorRef = useRef<T | null>(null);
    const mesures = useRef(new Map<number, number>());
    const [version, setVersion] = useState(0);

    /*
      **Les mesures restent attachées à l'indice, même quand la liste change** (23/09).
      On les effaçait à chaque liste neuve : une page qui recalcule sa liste à chaque
      rendu (la vue d'un employé sur Actifs) effaçait, re-mesurait, relançait un rendu,
      et bouclait jusqu'à « Maximum update depth exceeded ». Une rangée qui change de
      hauteur est de toute façon relue par l'observateur ; une mesure qui ne change pas
      ne relance rien.
    */

    const estimer = useRef(estimateSize);
    estimer.current = estimateSize;

    const cumuls = useMemo(() => {
        const c = new Float64Array(count + 1);
        for (let i = 0; i < count; i += 1) {
            c[i + 1] = c[i] + (mesures.current.get(i) ?? estimer.current(i));
        }
        return c;
        // `version` : une mesure a changé.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, version]);

    /* Une trentaine de rangées d'emblée : la première peinture n'attend pas la mesure. */
    const [fenetre, setFenetre] = useState({ start: 0, end: Math.min(count, 30) });

    const coupants = useRef<HTMLElement[]>([]);
    const recalculer = useCallback(() => {
        const ancre = anchorRef.current;
        if (!ancre) return;
        const a = ancre.getBoundingClientRect();
        let haut = 0;
        let bas = window.innerHeight;
        for (const p of coupants.current) {
            const r = p.getBoundingClientRect();
            haut = Math.max(haut, r.top);
            bas = Math.min(bas, r.bottom);
        }
        const de = Math.max(0, haut - a.top - overscanPx);
        const a_ = Math.max(de, bas - a.top + overscanPx);
        const start = Math.min(indiceA(cumuls, count, de), count);
        const end = Math.min(count, indiceA(cumuls, count, a_) + 1);
        setFenetre((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    }, [count, cumuls, overscanPx]);

    useEffect(() => {
        const ancre = anchorRef.current;
        if (!ancre) return;
        coupants.current = ancetresCoupants(ancre);
        let image = 0;
        const planifier = () => {
            if (image) return;
            image = requestAnimationFrame(() => {
                image = 0;
                recalculer();
            });
        };
        const redimensionner = () => {
            coupants.current = ancetresCoupants(ancre);
            planifier();
        };
        recalculer();
        document.addEventListener('scroll', planifier, { capture: true, passive: true });
        window.addEventListener('resize', redimensionner);
        return () => {
            if (image) cancelAnimationFrame(image);
            document.removeEventListener('scroll', planifier, { capture: true });
            window.removeEventListener('resize', redimensionner);
        };
    }, [recalculer]);

    const start = Math.min(fenetre.start, count);
    const end = Math.min(fenetre.end, count);

    /* La mesure : chaque enfant monté qui n'est pas une cale est la rangée `start + i`. */
    useLayoutEffect(() => {
        const ancre = anchorRef.current;
        if (!ancre) return;
        const rangees = Array.from(ancre.children).filter(
            (el) => !(el as HTMLElement).hasAttribute('data-cale'),
        ) as HTMLElement[];
        const lire = () => {
            let change = false;
            rangees.forEach((el, i) => {
                const h = el.getBoundingClientRect().height;
                const index = start + i;
                if (h > 0 && Math.abs((mesures.current.get(index) ?? -1) - h) > 0.5) {
                    mesures.current.set(index, h);
                    change = true;
                }
            });
            if (change) setVersion((v) => v + 1);
        };
        lire();
        const observateur = new ResizeObserver(lire);
        rangees.forEach((el) => observateur.observe(el));
        return () => observateur.disconnect();
    }, [start, end]);

    return {
        anchorRef,
        start,
        end,
        before: cumuls[start] ?? 0,
        after: Math.max(0, (cumuls[count] ?? 0) - (cumuls[end] ?? 0)),
    };
}
