import { useMemo } from 'react';

import { useFileDeTaches } from '../features/tasks/hooks/useFileDeTaches';
import type { TaskNature } from '../features/tasks/lib/file';

/**
 * **Ce qui attend le geste de la personne connectée** — la file de 03.3, telle que
 * l'accueil (03.1) la résume et que les barres (17.7) la comptent.
 *
 * *Une décision pour N surfaces.* Ce nombre était calculé ici par une règle, et par une
 * autre dans la page : la barre latérale d'un super administrateur disait 9 quand l'onglet
 * « À faire » en listait 17, et 8 seulement lui revenaient (26/09). Il est désormais **lu
 * dans la file elle-même** — la partition « À faire » de `useFileDeTaches`, dans l'ordre
 * où la page la présente : ce qui presse d'abord.
 */

export interface PendingTask {
    id: string;
    who: string;
    what: string;
    nature: TaskNature;
    /** ISO de l'ouverture de l'attente — la source de `.age`. */
    since?: string;
}

const DAY_MS = 86_400_000;

/** Le nombre de jours d'attente, ou `null` quand la source ne porte pas de date. */
export const daysSince = (iso?: string): number | null => {
    if (!iso) return null;
    const at = new Date(iso).getTime();
    if (Number.isNaN(at)) return null;
    return Math.max(0, Math.floor((Date.now() - at) / DAY_MS));
};

/** Les natures d'attente, dans l'ordre où l'accueil les énumère. */
const RESUME: { nature: TaskNature; label: string }[] = [
    { nature: 'validation', label: 'validations' },
    { nature: 'remise', label: 'remises' },
    { nature: 'reception', label: 'réceptions à confirmer' },
    { nature: 'retour', label: 'retours à réceptionner' },
    { nature: 'reparation', label: 'réparations' },
    { nature: 'collecte', label: 'machines collectées à examiner' },
];

export const usePendingTasks = () => {
    const file = useFileDeTaches();

    const tasks = useMemo<PendingTask[]>(
        () =>
            file
                .filter((task) => task.scope === 'todo')
                .map((task) => ({
                    id: task.id,
                    who: task.who ?? '',
                    what: task.title,
                    nature: task.nature,
                    since: task.since ?? undefined,
                })),
        [file],
    );

    /**
     * « La plus ancienne depuis 14 jours » — `.bigl` du régime saturé de 03.1.
     */
    const oldestWaitDays = useMemo(() => {
        const ages = tasks
            .map((entry) => daysSince(entry.since))
            .filter((d): d is number => d !== null);
        return ages.length > 0 ? Math.max(...ages) : null;
    }, [tasks]);

    /** Les natures d'attente, chacune un renvoi vers la file — régime saturé de 03.1. */
    const breakdown = useMemo(
        () =>
            RESUME.map(({ nature, label }) => ({
                label,
                count: tasks.filter((task) => task.nature === nature).length,
            })).filter((item) => item.count > 0),
        [tasks],
    );

    return { tasks, count: tasks.length, oldestWaitDays, breakdown };
};
