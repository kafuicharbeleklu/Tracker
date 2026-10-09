import { getCategoryLabel } from '../constants/glossary';
import type { Equipment } from '../types';

export interface TypeEnTension {
    type: string;
    label: string;
    total: number;
}

/**
 * **Les types en tension** — ceux dont aucune unité n'est disponible, les plus fournis
 * d'abord. La carte de l'accueil en montre une part ; la page `/management/tension` les
 * porte tous (09/10). `calmes` compte les autres types : ceux qui ont au moins une unité.
 */
export const typesEnTension = (
    equipment: Equipment[],
): { enTension: TypeEnTension[]; calmes: number } => {
    const parType = new Map<string, { total: number; disponibles: number }>();
    equipment.forEach((item) => {
        const entree = parType.get(item.type) ?? { total: 0, disponibles: 0 };
        entree.total += 1;
        if (item.status === 'Disponible') entree.disponibles += 1;
        parType.set(item.type, entree);
    });
    const enTension = [...parType.entries()]
        .filter(([, entree]) => entree.disponibles === 0)
        .map(([type, entree]) => ({ type, label: getCategoryLabel(type), total: entree.total }))
        .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'fr'));
    return { enTension, calmes: parType.size - enTension.length };
};
