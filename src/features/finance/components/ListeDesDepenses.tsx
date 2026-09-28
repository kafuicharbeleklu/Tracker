import React, { useEffect, useRef } from 'react';
import { Repeat } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { formatNumber, getBudgetCategoryByExpenseType } from '../../../lib/financial';
import { NOM_SUR_UNE_LIGNE } from '../../../lib/nomLong';
import { cn } from '../../../lib/utils';
import type { FinanceExpense } from '../../../types';
import { getPosteGlyph } from '../lib/expensePresentation';

export interface MoisDuJournal {
    cle: string;
    /** « Septembre 2026 ». */
    titre: string;
    total: number;
    depenses: FinanceExpense[];
}

/** « 24 sept. » — la date d'une écriture, sans son année : le mois la porte. */
export const dateCourte = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? iso
        : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
};

interface ListeDesDepensesProps {
    mois: MoisDuJournal[];
    ouverteId: string | null;
    onOuvrir: (depense: FinanceExpense) => void;
    notationCompacte: boolean;
}

/**
 * **Le journal resserré, quand une dépense est ouverte** (27/09) — la file de 400 à gauche du
 * panneau, comme Tâches : le tableau n'y tiendrait pas, et la liste n'y sert plus qu'à passer
 * d'une dépense à l'autre. Une rangée garde ce qui la fait reconnaître : le poste en glyphe,
 * le fournisseur, le jour et le poste en sous-ligne, le montant, et l'attente si elle y est.
 *
 * La rangée ouverte prend le creux et le filet court à gauche de Tâches ; elle est ramenée
 * dans la vue quand elle change (J et K, ou l'arrivée depuis le tableau).
 */
const ListeDesDepenses: React.FC<ListeDesDepensesProps> = ({
    mois,
    ouverteId,
    onOuvrir,
    notationCompacte,
}) => {
    const cadre = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ouverteId) return;
        cadre.current
            ?.querySelector(`[data-depense="${CSS.escape(ouverteId)}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [ouverteId]);

    return (
        <div className="bg-surface flex min-h-0 flex-col overflow-hidden rounded-xl">
            <div ref={cadre} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {mois.map((groupe) => (
                    <section key={groupe.cle} aria-label={groupe.titre}>
                        <h3 className="bg-surface-container border-outline-variant sticky top-0 z-[1] flex h-8 items-center justify-between gap-3 border-b px-4">
                            <span className="text-on-surface text-[0.8125rem] leading-4 font-semibold">
                                {groupe.titre}
                            </span>
                            <span className="text-on-surface text-[0.8125rem] leading-4 font-semibold tabular-nums">
                                {formatNumber(groupe.total, notationCompacte)}
                            </span>
                        </h3>
                        {groupe.depenses.map((depense) => {
                            const ouverte = depense.id === ouverteId;
                            return (
                                <div
                                    key={depense.id}
                                    data-depense={depense.id}
                                    className="border-outline-variant relative border-b"
                                >
                                    {ouverte && (
                                        <span
                                            aria-hidden="true"
                                            className="bg-inverse-surface absolute top-2 bottom-2 left-0 z-[1] w-[3px] rounded-r-[2px]"
                                        />
                                    )}
                                    <Button
                                        variant="text"
                                        layout="card"
                                        aria-current={ouverte ? 'true' : undefined}
                                        onClick={() => onOuvrir(depense)}
                                        className={cn(
                                            'h-14 min-h-0 w-full gap-3 rounded-none px-4 py-0 font-normal whitespace-normal active:scale-100',
                                            'focus-visible:ring-offset-0 focus-visible:ring-inset',
                                            ouverte
                                                ? 'bg-surface-muted-strong hover:bg-surface-muted-strong'
                                                : 'hover:bg-surface-container/50',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'text-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                                                ouverte ? 'bg-surface' : 'bg-surface-container',
                                            )}
                                        >
                                            <Icon glyph={getPosteGlyph(depense.type)} size={18} />
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        'text-on-surface text-ts-body leading-ts-body font-medium',
                                                        NOM_SUR_UNE_LIGNE,
                                                    )}
                                                >
                                                    {depense.supplier}
                                                </span>
                                                {depense.status === 'Recurring' && (
                                                    <>
                                                        <Icon
                                                            glyph={Repeat}
                                                            size={18}
                                                            className="text-text-tertiary shrink-0"
                                                        />
                                                        <span className="sr-only">récurrente</span>
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-text-secondary truncate text-[0.8125rem] leading-[1.125rem]">
                                                {dateCourte(depense.date)} ·{' '}
                                                {getBudgetCategoryByExpenseType(depense.type)}
                                            </span>
                                        </span>
                                        <span className="flex shrink-0 flex-col items-end gap-0.5">
                                            <span className="text-on-surface text-ts-body leading-ts-body font-medium tabular-nums">
                                                {formatNumber(depense.amount, notationCompacte)}
                                            </span>
                                            {depense.status === 'Pending' && (
                                                <span className="rounded-[4px] bg-[var(--tk-color-tint-ambre)] px-1.5 text-[0.6875rem] leading-[1.125rem] font-medium text-[var(--tk-color-on-tint-ambre)]">
                                                    En attente
                                                </span>
                                            )}
                                        </span>
                                    </Button>
                                </div>
                            );
                        })}
                    </section>
                ))}
            </div>
        </div>
    );
};

export default ListeDesDepenses;
