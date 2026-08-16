import { useCallback, useMemo, useState } from 'react';

/**
 * Le mode sélection — planche **17.2** (composant partagé, 4 écrans : Tâches,
 * Catalogue, Inventaire, Utilisateurs).
 *
 * L'état vit ici pour que les quatre écrans ne le réinventent pas quatre fois. Les
 * règles que ce crochet tient :
 *
 * **S1 — aucun acte grisé en attente d'une sélection.** `isActive` passe à `false`
 * dès que rien n'est coché : la barre d'actions **n'existe pas**, elle n'est pas
 * désactivée. Un bouton grisé demande de deviner ce qui le débloquerait.
 *
 * **S3 — le compte se qualifie.** `count` ne se lit jamais seul : `total` est
 * demandé pour que l'écran écrive « 5 sélectionnés sur 17 ». Le dénominateur est ce
 * qui permet de juger si la sélection est complète.
 *
 * Sortir du mode **vide la sélection** : elle n'a pas de sens hors du régime qui la
 * montre, et la garder en mémoire ferait revenir un état que rien n'affiche.
 */

export interface Selection {
    /** Le régime de sélection est-il engagé ? */
    isActive: boolean;
    selectedIds: ReadonlySet<string>;
    count: number;
    isSelected: (id: string) => boolean;
    /** Bascule un élément. Le premier coché engage le régime, le dernier décoché en sort. */
    toggle: (id: string) => void;
    /** Entre en sélection — par l'appui long ou par l'entrée « Sélectionner » du menu (S2). */
    enter: (id?: string) => void;
    /** Sort du régime et vide la sélection. */
    exit: () => void;
    selectAll: (ids: readonly string[]) => void;
    /** Vide sans sortir : « Tout désélectionner » de la barre du haut. */
    clear: () => void;
}

export const useSelection = (): Selection => {
    const [isActive, setIsActive] = useState(false);
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

    const toggle = useCallback((id: string) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            // S1 : plus rien de coché, plus de régime — donc plus de barre d'actions.
            setIsActive(next.size > 0);
            return next;
        });
    }, []);

    const enter = useCallback((id?: string) => {
        setIsActive(true);
        if (id) setSelectedIds(new Set([id]));
    }, []);

    const exit = useCallback(() => {
        setIsActive(false);
        setSelectedIds(new Set());
    }, []);

    const selectAll = useCallback((ids: readonly string[]) => {
        setSelectedIds(new Set(ids));
        setIsActive(ids.length > 0);
    }, []);

    const clear = useCallback(() => {
        setSelectedIds(new Set());
        setIsActive(false);
    }, []);

    const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

    return useMemo(
        () => ({
            isActive,
            selectedIds,
            count: selectedIds.size,
            isSelected,
            toggle,
            enter,
            exit,
            selectAll,
            clear,
        }),
        [isActive, selectedIds, isSelected, toggle, enter, exit, selectAll, clear]
    );
};

export default useSelection;
