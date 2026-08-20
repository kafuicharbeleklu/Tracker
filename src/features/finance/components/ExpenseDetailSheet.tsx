import React, { useMemo, useState } from 'react';
import { Receipt, Warning } from '@phosphor-icons/react';

import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import SideSheet from '../../../components/ui/SideSheet';
import { TextArea } from '../../../components/ui/TextArea';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { parseAmountString } from '../../../lib/expenseExtraction';
import { formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import {
    FinanceBudgetItem,
    FinanceExpense,
    FinanceExpenseStatus,
    FinanceExpenseType,
} from '../../../types';
import { useExpenseActions } from '../hooks/useExpenseActions';
import {
    EXPENSE_STATUS_OPTIONS,
    EXPENSE_TYPE_LABELS,
    EXPENSE_TYPE_OPTIONS,
    formatExpenseAmount,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusVariant,
    toExpenseDisplayTitle,
} from '../lib/expensePresentation';

interface ExpenseDetailSheetProps {
    /** L'identifiant de la dépense ouverte, `null` quand le panneau est fermé. */
    expenseId: string | null;
    onClose: () => void;
    /** Les postes de l'exercice, pour dire sur lequel la dépense s'impute. */
    budgetItems: FinanceBudgetItem[];
}

const emptyForm = () => ({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    amount: '',
    type: 'Purchase',
    status: 'Paid',
    description: '',
    invoiceNumber: '',
});

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
    const { financeExpenses, updateFinanceExpense } = useFinanceData();
    const { showToast } = useToast();
    const { requestExpenseDeletion, previewSourceFile, downloadSourceFile } = useExpenseActions();

    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [expenseForm, setExpenseForm] = useState(emptyForm);

    const expense = useMemo(
        () => (expenseId ? (financeExpenses.find((item) => item.id === expenseId) ?? null) : null),
        [financeExpenses, expenseId],
    );

    const editingExpense = useMemo(
        () =>
            editingExpenseId
                ? (financeExpenses.find((item) => item.id === editingExpenseId) ?? null)
                : null,
        [financeExpenses, editingExpenseId],
    );

    const openExpenseEditor = (target: FinanceExpense) => {
        setEditingExpenseId(target.id);
        setExpenseForm({
            date: target.date,
            supplier: target.supplier,
            amount: target.amount.toFixed(2).replace('.', ','),
            type: target.type,
            status: target.status,
            description: target.description,
            invoiceNumber: target.invoiceNumber || '',
        });
    };

    const closeExpenseEditor = () => {
        setEditingExpenseId(null);
        setExpenseForm(emptyForm());
    };

    const handleExpenseFormChange = (field: keyof ReturnType<typeof emptyForm>, value: string) => {
        setExpenseForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleExpenseUpdate = () => {
        if (!editingExpense) return;

        const normalizedAmount = parseAmountString(expenseForm.amount);
        if (!normalizedAmount || normalizedAmount <= 0) {
            showToast('Le montant doit être supérieur à zéro.', 'error');
            return;
        }

        if (!expenseForm.supplier.trim()) {
            showToast('Le fournisseur est obligatoire.', 'error');
            return;
        }

        const isUpdated = updateFinanceExpense(editingExpense.id, {
            date: expenseForm.date,
            supplier: expenseForm.supplier.trim(),
            amount: normalizedAmount,
            type: expenseForm.type as FinanceExpenseType,
            status: expenseForm.status as FinanceExpenseStatus,
            description: expenseForm.description.trim() || `Facture ${expenseForm.supplier.trim()}`,
            invoiceNumber: expenseForm.invoiceNumber.trim() || undefined,
        });

        if (!isUpdated) {
            showToast('Modification impossible: données invalides ou doublon détecté.', 'error');
            return;
        }

        showToast('Dépense mise à jour avec succès.', 'success');
        closeExpenseEditor();
    };

    const matchingBudgetItem = useMemo(() => {
        if (!expense) return null;
        return (
            budgetItems.find(
                (item) =>
                    item.type === expense.type ||
                    item.category
                        .toLowerCase()
                        .includes(EXPENSE_TYPE_LABELS[expense.type].toLowerCase()),
            ) ?? null
        );
    }, [budgetItems, expense]);

    return (
        <>
            <Modal
                isOpen={!!editingExpense}
                onClose={closeExpenseEditor}
                title={
                    editingExpense
                        ? `Modifier · ${toExpenseDisplayTitle(editingExpense)}`
                        : 'Modifier la dépense'
                }
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button variant="outlined" onClick={closeExpenseEditor}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={handleExpenseUpdate}>
                            Enregistrer
                        </Button>
                    </>
                }
            >
                <div className="medium:grid-cols-2 grid grid-cols-1 gap-4">
                    <InputField
                        label="Fournisseur"
                        value={expenseForm.supplier}
                        onChange={(event) =>
                            handleExpenseFormChange('supplier', event.target.value)
                        }
                        required
                    />
                    <InputField
                        label="Date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(event) => handleExpenseFormChange('date', event.target.value)}
                        required
                    />
                    <InputField
                        label="Montant"
                        value={expenseForm.amount}
                        onChange={(event) => handleExpenseFormChange('amount', event.target.value)}
                        supportingText="Format accepté: 1.000.000,00"
                        required
                    />
                    <InputField
                        label="Référence facture"
                        value={expenseForm.invoiceNumber}
                        onChange={(event) =>
                            handleExpenseFormChange('invoiceNumber', event.target.value)
                        }
                    />
                    <SelectField
                        name="expense-type-edit"
                        label="Type"
                        value={expenseForm.type}
                        onChange={(event) => handleExpenseFormChange('type', event.target.value)}
                        options={EXPENSE_TYPE_OPTIONS}
                    />
                    <SelectField
                        name="expense-status-edit"
                        label="Statut"
                        value={expenseForm.status}
                        onChange={(event) => handleExpenseFormChange('status', event.target.value)}
                        options={EXPENSE_STATUS_OPTIONS}
                    />
                </div>
                <div className="mt-4">
                    <TextArea
                        label="Description"
                        value={expenseForm.description}
                        onChange={(event) =>
                            handleExpenseFormChange('description', event.target.value)
                        }
                        rows={4}
                    />
                </div>
            </Modal>

            <SideSheet
                open={!!expense}
                onClose={onClose}
                title={expense ? `Détail · ${expense.supplier}` : 'Détail de la dépense'}
                width="standard"
                className="rounded-none"
                footer={
                    expense ? (
                        <div className="flex w-full items-center justify-end gap-3">
                            <Button variant="outlined" onClick={() => openExpenseEditor(expense)}>
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
                        <div className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border p-4">
                            <div className="flex min-h-[48px] items-center gap-3">
                                <div className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]">
                                    <Icon glyph={Receipt} size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <b className="text-on-surface block truncate text-[14px] font-medium">
                                        {expense.sourceFileName ||
                                            `facture-${expense.supplier.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                                    </b>
                                    <span className="text-on-surface-variant block text-[12px]">
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
                                            className="h-8 px-2 text-[13px]"
                                        >
                                            Voir
                                        </Button>
                                        <Button
                                            variant="text"
                                            size="sm"
                                            onClick={() => {
                                                void downloadSourceFile(expense);
                                            }}
                                            className="h-8 px-2 text-[13px]"
                                        >
                                            Télécharger
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CARTE 2 : CE QUE LA MACHINE A LU (PLANCHE 15.1 .xrow) */}
                        <div className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[13px] font-medium">
                                    Ce que la machine a lu
                                </h3>
                                {expense.extractionConfidence && (
                                    <span className="text-on-surface-variant text-[11px] font-medium tracking-wide">
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
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Fournisseur
                                    </span>
                                    <span className="text-on-surface flex-1 truncate font-medium">
                                        {expense.supplier}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
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
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Date
                                    </span>
                                    <span className="text-on-surface flex-1 font-medium">
                                        {formatExpenseDate(expense.date)}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
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
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
                                    <span className="text-on-surface-variant w-[106px] shrink-0">
                                        Type
                                    </span>
                                    <span className="text-on-surface flex-1 font-medium">
                                        {EXPENSE_TYPE_LABELS[expense.type]}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
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
                                    <div className="flex items-baseline gap-2.5 py-[9px] text-[13px]">
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
                                    <div className="bg-surface-container text-on-surface-variant border-outline-variant flex gap-2.5 rounded-md border p-[11px_12px] text-[12px] leading-[17px]">
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
