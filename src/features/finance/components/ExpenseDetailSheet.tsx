import React, { useMemo, useState } from 'react';
import { Receipt, Warning } from '@phosphor-icons/react';

import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import SideSheet from '../../../components/ui/SideSheet';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { FinanceBudgetItem } from '../../../types';
import { useExpenseActions } from '../hooks/useExpenseActions';
import {
    EXPENSE_TYPE_LABELS,
    formatExpenseAmount,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusVariant,
    posteDeLaDepense,
} from '../lib/expensePresentation';
import ExpenseEditModal from './ExpenseEditModal';

interface ExpenseDetailSheetProps {
    /** L'identifiant de la dépense ouverte, `null` quand le panneau est fermé. */
    expenseId: string | null;
    onClose: () => void;
    /** Les postes de l'exercice, pour dire sur lequel la dépense s'impute. */
    budgetItems: FinanceBudgetItem[];
}

/**
 * Le détail d'une dépense — **colonne 2 de la planche 15.1**, en panneau latéral.
 *
 * Il s'ouvre depuis les deux écrans qui listent des dépenses : « Dernières
 * dépenses » sur la page Finances, et le journal. Il lit la dépense **dans la
 * donnée, par son identifiant** plutôt que sur une copie passée en prop : une
 * modification faite dans le panneau se voit donc immédiatement dans le panneau,
 * sans qu'un écran ait à recoudre son état.
 *
 * Il porte les trois cartes de la planche : le fichier lu (`.fread`), ce que la
 * machine en a tiré (`.xrow`), et l'imputation budgétaire (`.warn`).
 */
export const ExpenseDetailSheet: React.FC<ExpenseDetailSheetProps> = ({
    expenseId,
    onClose,
    budgetItems,
}) => {
    const { settings } = useData();
    const { financeExpenses } = useFinanceData();
    const { requestExpenseDeletion, previewSourceFile, downloadSourceFile } = useExpenseActions();

    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

    const expense = useMemo(
        () => (expenseId ? (financeExpenses.find((item) => item.id === expenseId) ?? null) : null),
        [financeExpenses, expenseId],
    );

    const closeExpenseEditor = () => setEditingExpenseId(null);

    /* Le poste qui a compté la dépense — la règle d'imputation, pas une ressemblance. */
    const matchingBudgetItem = useMemo(
        () => (expense ? posteDeLaDepense(expense, budgetItems) : null),
        [budgetItems, expense],
    );

    return (
        <>
            <ExpenseEditModal expenseId={editingExpenseId} onClose={closeExpenseEditor} />

            <SideSheet
                open={!!expense}
                onClose={onClose}
                title={expense ? `Détail · ${expense.supplier}` : 'Détail de la dépense'}
                width="standard"
                className="rounded-none"
                footer={
                    expense ? (
                        <div className="flex w-full items-center justify-end gap-3">
                            <Button
                                variant="outlined"
                                onClick={() => setEditingExpenseId(expense.id)}
                            >
                                Modifier
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() =>
                                    requestExpenseDeletion(expense, () => {
                                        closeExpenseEditor();
                                        onClose();
                                    })
                                }
                            >
                                Supprimer
                            </Button>
                        </div>
                    ) : undefined
                }
            >
                {expense && (
                    <div className="space-y-4">
                        {/* CARTE 1 : FICHIER SOURCE LU (PLANCHE 15.1 .fread) */}
                        <div className="bg-surface border-outline-variant rounded-lg border p-4">
                            <div className="flex min-h-[48px] items-center gap-3">
                                <div className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                                    <Icon glyph={Receipt} size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <b className="text-on-surface text-ts-sub block truncate font-medium">
                                        {expense.sourceFileName ||
                                            `facture-${expense.supplier.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                                    </b>
                                    <span className="text-on-surface-variant block text-[0.75rem]">
                                        lue le {formatExpenseDate(expense.date)}
                                    </span>
                                </div>
                                {(expense.sourceFileName ||
                                    expense.sourceFileId ||
                                    expense.sourceFileUrl) && (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <Button
                                            variant="text"
                                            size="sm"
                                            onClick={() => {
                                                void previewSourceFile(expense);
                                            }}
                                            className="h-8 px-2 text-[0.8125rem]"
                                        >
                                            Voir
                                        </Button>
                                        <Button
                                            variant="text"
                                            size="sm"
                                            onClick={() => {
                                                void downloadSourceFile(expense);
                                            }}
                                            className="h-8 px-2 text-[0.8125rem]"
                                        >
                                            Télécharger
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CARTE 2 : CE QUE LA MACHINE A LU (PLANCHE 15.1 .xrow) */}
                        <div className="bg-surface border-outline-variant rounded-lg border p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[0.8125rem] font-medium">
                                    Ce que la machine a lu
                                </h3>
                                {expense.extractionConfidence && (
                                    <span className="text-on-surface-variant text-[0.6875rem] font-medium tracking-wide">
                                        Confiance{' '}
                                        {expense.extractionConfidence === 'high'
                                            ? 'élevée'
                                            : expense.extractionConfidence === 'medium'
                                              ? 'moyenne'
                                              : 'faible'}
                                    </span>
                                )}
                            </div>
                            <div className="divide-outline-variant divide-y">
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Fournisseur
                                    </span>
                                    <span className="text-on-surface flex-1 truncate font-medium">
                                        {expense.supplier}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Montant
                                    </span>
                                    <span className="text-on-surface flex-1 font-medium tabular-nums">
                                        {formatExpenseAmount(
                                            expense.amount,
                                            expense.currencyCode || settings.currency,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Date
                                    </span>
                                    <span className="text-on-surface flex-1 font-medium">
                                        {formatExpenseDate(expense.date)}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        N° de facture
                                    </span>
                                    <span
                                        className={cn(
                                            'flex-1 font-medium tabular-nums',
                                            !expense.invoiceNumber && 'text-text-muted font-normal',
                                        )}
                                    >
                                        {expense.invoiceNumber || 'non renseigné'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Type
                                    </span>
                                    <span className="text-on-surface flex-1 font-medium">
                                        {EXPENSE_TYPE_LABELS[expense.type]}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Statut
                                    </span>
                                    <div className="flex-1">
                                        <Badge variant={getExpenseStatusVariant(expense.status)}>
                                            {getExpenseStatusLabel(expense.status)}
                                        </Badge>
                                    </div>
                                </div>
                                {expense.description && (
                                    <div className="flex items-baseline gap-2.5 py-[9px] text-[0.8125rem]">
                                        <span className="text-on-surface-variant w-[106px] shrink-0">
                                            Description
                                        </span>
                                        <span className="text-on-surface flex-1 font-normal">
                                            {expense.description}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* IMPUTATION BUDGETAIRE (PLANCHE 15.1 .warn) */}
                        {matchingBudgetItem &&
                            (() => {
                                const itemSpentPct =
                                    matchingBudgetItem.allocated > 0
                                        ? (matchingBudgetItem.spent /
                                              matchingBudgetItem.allocated) *
                                          100
                                        : 0;
                                const remaining =
                                    matchingBudgetItem.allocated - matchingBudgetItem.spent;

                                return (
                                    <div className="bg-surface-container text-on-surface-variant border-outline-variant text-ts-sub leading-ts-sub flex gap-2.5 rounded-md border p-[11px_12px]">
                                        <Icon
                                            glyph={Warning}
                                            size={18}
                                            className="text-on-surface-variant mt-[1px] shrink-0"
                                        />
                                        <span>
                                            <b className="text-on-surface font-medium">
                                                Cette dépense s'impute sur «&nbsp;
                                                {matchingBudgetItem.category}&nbsp;»
                                            </b>
                                            , qui est consommé à {itemSpentPct.toFixed(0)} %. Il
                                            reste{' '}
                                            <b className="text-on-surface font-medium">
                                                {formatCurrency(
                                                    remaining,
                                                    settings.currency,
                                                    settings.compactNotation,
                                                )}
                                            </b>{' '}
                                            sur le poste.
                                        </span>
                                    </div>
                                );
                            })()}
                    </div>
                )}
            </SideSheet>
        </>
    );
};

export default ExpenseDetailSheet;
