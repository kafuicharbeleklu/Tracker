import { useCallback } from 'react';

import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { getExpenseSourceFile } from '../../../lib/financeFileStorage';
import { FinanceExpense } from '../../../types';
import { formatExpenseAmount } from '../lib/expensePresentation';

type ResolvedExpenseSource = {
    url: string;
    fileName: string;
    revokeAfterUse: boolean;
};

/**
 * Les gestes qui portent sur une dépense — **supprimer, voir la facture, la
 * télécharger** — partagés par le journal et le panneau de détail.
 *
 * Le journal les déclenche depuis une rangée, le panneau depuis son pied ; c'est
 * le même geste, donc la même confirmation et le même message. Les recopier dans
 * les deux écrans, c'était accepter qu'ils divergent.
 */
export const useExpenseActions = () => {
    const { settings } = useData();
    const { deleteFinanceExpense } = useFinanceData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const requestExpenseDeletion = useCallback(
        (expense: FinanceExpense, onDeleted?: () => void) => {
            requestConfirmation({
                title: 'Supprimer cette dépense ?',
                message: `Cette action supprimera définitivement la dépense "${expense.supplier}" (${formatExpenseAmount(expense.amount, expense.currencyCode || settings.currency)}).`,
                variant: 'danger',
                confirmText: 'Supprimer',
                cancelText: 'Annuler',
                confirmKeyword: 'SUPPRIMER',
                onConfirm: () => {
                    const isDeleted = deleteFinanceExpense(expense.id);
                    if (!isDeleted) {
                        showToast('Suppression impossible.', 'error');
                        return;
                    }
                    onDeleted?.();
                    showToast('Dépense supprimée.', 'success');
                },
            });
        },
        [requestConfirmation, settings.currency, deleteFinanceExpense, showToast]
    );

    const resolveExpenseSource = useCallback(
        async (expense: FinanceExpense): Promise<ResolvedExpenseSource | null> => {
            if (expense.sourceFileId) {
                try {
                    const stored = await getExpenseSourceFile(expense.sourceFileId);
                    if (stored?.blob) {
                        return {
                            url: URL.createObjectURL(stored.blob),
                            fileName: expense.sourceFileName || stored.name || `depense-${expense.id}.pdf`,
                            revokeAfterUse: true,
                        };
                    }
                } catch {
                    // Ignore storage read errors and fallback to legacy URL.
                }
            }

            if (expense.sourceFileUrl) {
                return {
                    url: expense.sourceFileUrl,
                    fileName: expense.sourceFileName || `depense-${expense.id}.pdf`,
                    revokeAfterUse: false,
                };
            }

            return null;
        },
        []
    );

    const previewSourceFile = useCallback(
        async (expense: FinanceExpense) => {
            const source = await resolveExpenseSource(expense);
            if (!source) {
                showToast('Prévisualisation indisponible: aucun fichier source enregistré.', 'warning');
                return;
            }

            const previewWindow = window.open(source.url, '_blank', 'noopener,noreferrer');
            if (!previewWindow) {
                if (source.revokeAfterUse && source.url.startsWith('blob:')) {
                    URL.revokeObjectURL(source.url);
                }
                showToast('Prévisualisation bloquée par le navigateur.', 'warning');
                return;
            }

            if (source.revokeAfterUse && source.url.startsWith('blob:')) {
                window.setTimeout(() => URL.revokeObjectURL(source.url), 60_000);
            }
        },
        [resolveExpenseSource, showToast]
    );

    const downloadSourceFile = useCallback(
        async (expense: FinanceExpense) => {
            const source = await resolveExpenseSource(expense);
            if (!source) {
                showToast('Téléchargement indisponible: aucun fichier source enregistré.', 'warning');
                return;
            }

            const link = document.createElement('a');
            link.href = source.url;
            link.download = source.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (source.revokeAfterUse && source.url.startsWith('blob:')) {
                window.setTimeout(() => URL.revokeObjectURL(source.url), 1_000);
            }
        },
        [resolveExpenseSource, showToast]
    );

    return { requestExpenseDeletion, previewSourceFile, downloadSourceFile };
};
