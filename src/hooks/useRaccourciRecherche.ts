import { useEffect, useRef } from 'react';

const visible = (element: Element) => element.getClientRects().length > 0;

/** Le champ de recherche de la page, s'il est affiché. */
export const champDeRecherche = (): HTMLInputElement | null =>
    [...document.querySelectorAll<HTMLInputElement>('input[data-recherche-de-page]')].find(
        visible,
    ) ?? null;

/**
 * **⌘K (Ctrl+K) pour chercher** (P3, 25/09) — le raccourci des outils de travail, pour un
 * iPad avec clavier comme pour le bureau.
 *
 * - Une feuille est ouverte : son propre champ de recherche, s'il en a un (le choix d'un
 *   bénéficiaire) ; sinon rien, et le navigateur garde sa touche.
 * - Sinon, la recherche de la page (`data-recherche-de-page`, posée par `ListTemplate`).
 * - Une page sans recherche : `ailleurs` — la coque ouvre Actifs, le champ prêt.
 */
export const useRaccourciRecherche = (ailleurs?: () => void) => {
    const ailleursRef = useRef(ailleurs);
    useEffect(() => {
        ailleursRef.current = ailleurs;
    }, [ailleurs]);

    useEffect(() => {
        const surTouche = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'k') return;
            if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
            const calque = [...document.querySelectorAll('[aria-modal="true"]')]
                .filter(visible)
                .pop();
            const champ = calque
                ? ([...calque.querySelectorAll<HTMLInputElement>('input[type="search"]')].find(
                      visible,
                  ) ?? null)
                : champDeRecherche();
            if (champ) {
                event.preventDefault();
                champ.focus();
                champ.select();
                return;
            }
            if (!calque && ailleursRef.current) {
                event.preventDefault();
                ailleursRef.current();
            }
        };
        document.addEventListener('keydown', surTouche);
        return () => document.removeEventListener('keydown', surTouche);
    }, []);
};
