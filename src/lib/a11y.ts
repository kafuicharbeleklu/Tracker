import type { KeyboardEvent } from 'react';

/**
 * Une rangée cliquable est une commande, et une commande s'atteint au clavier.
 *
 * Le produit posait `onClick` sur des `<div>`, des `<tr>` et des cartes : à la souris
 * elles répondent, au clavier elles **n'existent pas** — le tabulateur les saute, et
 * il n'y a aucun moyen de les activer. Sept emplois relevés le 20/08 : la file des
 * tâches, les modèles du catalogue, les dépenses, les cartes d'emplacements.
 *
 * ## Pourquoi pas un élément de commande natif
 *
 * Parce que ces rangées **contiennent déjà des commandes** — un geste au bout de la
 * ligne, un chevron, une case de sélection. Une commande imbriquée dans une commande
 * est du HTML invalide, et les lecteurs d'écran s'y perdent. Le motif retenu est celui
 * que l'ARIA prévoit pour ce cas : `role="button"` + `tabIndex` + activation clavier.
 *
 * ## Espace ET Entrée
 *
 * Une commande native s'active des deux ; la réimplémenter à moitié est pire que ne
 * rien faire, puisque l'élément **annonce** son rôle. `Espace` demande un
 * `preventDefault` : sans lui la page défile sous les doigts de qui vient d'activer.
 *
 * ```tsx
 * <div {...rowActivation(() => openTask(task))} className="…">
 * ```
 */
export const rowActivation = (onActivate: () => void) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent) => {
        // La cible de l'événement peut être un bouton imbriqué : il s'active seul,
        // et la rangée ne doit pas s'activer par-dessus.
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onActivate();
        }
    },
});
