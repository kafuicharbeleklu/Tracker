/**
 * **Le clavier d'un iPad ou d'un bureau** (P3, 25/09) — ce que deux raccourcis partagent :
 * ⌘K (Ctrl+K) pour chercher, Échap pour fermer.
 *
 * Échap ferme **une** chose à la fois, la plus proche : un calque ouvert (feuille, dialogue,
 * menu) le traite lui-même ; la page ne ferme sa fiche ouverte ou sa sélection que si aucun
 * calque n'est là. Le calque qui se ferme est encore dans le document pendant l'événement :
 * la page le voit, et s'abstient.
 */

/** Une feuille, un dialogue ou un menu est-il ouvert ? Il répond à Échap pour son compte. */
export const unCalqueEstOuvert = (): boolean =>
    Boolean(document.querySelector('[aria-modal="true"], [role="menu"]'));

/** La touche est-elle tapée dans un champ ? Échap y appartient au champ. */
export const estUnChampDeSaisie = (cible: EventTarget | null): boolean => {
    const element = cible as HTMLElement | null;
    return Boolean(
        element &&
        (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)),
    );
};

/** Échap seul, hors d'un champ, et qu'aucun calque ne réclame : c'est à la page. */
export const echapPourLaPage = (event: KeyboardEvent): boolean =>
    event.key === 'Escape' &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !unCalqueEstOuvert() &&
    !estUnChampDeSaisie(event.target);

/**
 * **Une touche simple pour la page** (26/09) — J, K, A, R, Z, « ? », Entrée : la file de
 * Tâches se traite au clavier. Sans modificateur, hors d'un champ, et qu'aucun calque ne
 * réclame. Entrée et Espace appartiennent à ce qui a le focus quand c'est un contrôle.
 */
export const toucheSimplePourLaPage = (event: KeyboardEvent): boolean => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return false;
    if (unCalqueEstOuvert() || estUnChampDeSaisie(event.target)) return false;
    if (event.key === 'Enter' || event.key === ' ') {
        const element = event.target as HTMLElement | null;
        if (
            element?.closest?.(
                'button, a, [role="button"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]',
            )
        )
            return false;
    }
    return true;
};

/** ⌘K sur un Mac ou un iPad, Ctrl+K ailleurs — le libellé que la marque du champ affiche. */
export const RACCOURCI_RECHERCHE =
    typeof navigator !== 'undefined' &&
    (/Mac|iPhone|iPad/.test(navigator.platform) || /Mac OS X|iPhone|iPad/.test(navigator.userAgent))
        ? '⌘K'
        : 'Ctrl K';
