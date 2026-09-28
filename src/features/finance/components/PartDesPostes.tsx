import React, { useMemo } from 'react';

import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';
import type { FinanceBudgetItem } from '../../../types';
import { getPosteGlyph } from '../lib/expensePresentation';

const pourcent = (part: number, tout: number): number =>
    tout > 0 ? Math.round((part / tout) * 100) : 0;

interface PartDesPostesProps {
    postes: FinanceBudgetItem[];
    /** Au-delà, les plus entamés seulement — ce sont eux qui demandent un regard. */
    max?: number;
    className?: string;
}

/**
 * **La part de chaque poste** (27/09) — la carte « Par poste » de Finances, reprise du
 * bandeau de la refonte des Dépenses : un poste par ligne, son glyphe (le type de dépense
 * qu'il reçoit), son nom, une jauge courte et la part de l'enveloppe consommée, à l'orange
 * d'état au-delà de 100 %. « Les postes », à côté, garde le détail : les montants, le
 * classement CAPEX / OPEX, le restant.
 */
const PartDesPostes: React.FC<PartDesPostesProps> = ({ postes, max, className }) => {
    const montres = useMemo(() => {
        if (!max || postes.length <= max) return postes;
        return [...postes]
            .sort(
                (a, b) =>
                    (b.allocated > 0 ? b.spent / b.allocated : 0) -
                    (a.allocated > 0 ? a.spent / a.allocated : 0),
            )
            .slice(0, max);
    }, [max, postes]);

    if (postes.length === 0) {
        return (
            <p className="text-text-secondary text-[0.8125rem] leading-[1.125rem]">
                Aucun poste sur l’exercice.
            </p>
        );
    }

    return (
        <ul className={cn('flex flex-col', className)}>
            {montres.map((poste) => {
                const part = pourcent(poste.spent, poste.allocated);
                const depasse = poste.allocated > 0 && poste.spent > poste.allocated;
                return (
                    <li
                        key={poste.category}
                        className="text-on-surface flex h-10 min-w-0 items-center gap-2 text-[0.8125rem] leading-[1.125rem]"
                    >
                        <Icon
                            glyph={getPosteGlyph(poste.type)}
                            size={18}
                            className="text-text-secondary shrink-0"
                        />
                        <span className="min-w-0 flex-1 truncate">{poste.category}</span>
                        <span className="bg-surface-muted-strong block h-1 w-16 shrink-0 overflow-hidden rounded-full">
                            <span
                                className={cn(
                                    'mvt-jauge duration-medium2 ease-emphasized block h-full rounded-full transition-[width]',
                                    depasse
                                        ? 'bg-[var(--tk-color-st-orange)]'
                                        : 'bg-[var(--tk-color-st-vert)]',
                                )}
                                style={{ width: `${Math.min(100, part)}%` }}
                            />
                        </span>
                        <span
                            className={cn(
                                'w-10 shrink-0 text-right font-medium tabular-nums',
                                depasse && 'font-semibold text-[var(--tk-color-on-tint-orange)]',
                            )}
                        >
                            {part} %
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};

export default PartDesPostes;
