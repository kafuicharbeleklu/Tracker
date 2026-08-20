import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';

import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import Reading from '../../../components/layout/Reading';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { rowActivation } from '../../../lib/a11y';
import { formatCurrency } from '../../../lib/financial';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';
import { useExpenseActions } from '../hooks/useExpenseActions';
import {
    EXPENSE_TYPE_LABELS,
    formatExpenseAmount,
    formatExpenseDate,
    getExpenseStatusLabel,
    getExpenseStatusVariant,
    getExpenseTypeGlyph,
    toExpenseDescriptionPreview,
} from '../lib/expensePresentation';

interface ExpenseJournalPageProps {
    onBack: () => void;
}

/**
 * **Le journal des dépenses — une destination, pas un onglet** (planche 15.1).
 *
 * La planche pose le lien depuis la page Finances — « Voir les 47 dépenses de
 * l'exercice » — et ne le fait pas revenir sur la même page : la liste complète
 * est un autre écran. Elle vivait ici dans un onglet, sous deux cartes métriques
 * qui redisaient les chiffres du héro et une carte pointillée qui doublait le
 * bouton d'en-tête ; les trois sont tombées avec les onglets.
 *
 * Le tableau reste **dans la largeur de lecture** et glisse dans son propre
 * cadre : l'exception de §2.43 est réservée à l'aperçu d'un rapport (colonne 4 de
 * la planche), pas à une liste qu'on parcourt.
 */
const ExpenseJournalPage: React.FC<ExpenseJournalPageProps> = ({ onBack }) => {
    const { settings } = useData();
    const { financeExpenses, financeBudgets } = useFinanceData();
    const { requestExpenseDeletion } = useExpenseActions();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

    const [exerciseYear, setExerciseYear] = useState<number>(
        () => financeBudgets[0]?.year || new Date().getFullYear()
    );

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === exerciseYear)) {
            setExerciseYear(financeBudgets[0].year);
        }
    }, [financeBudgets, exerciseYear]);

    const { currentBudget } = useBudgetExercise(exerciseYear);

    /* Le total des dépenses tenait une carte métrique à lui seul, au-dessus de la
       liste — à côté de deux autres qui redisaient le héro. Il tient dans la ligne
       qui compte déjà les rangées : c'est un fait sur la liste, pas un tableau de
       bord. */
    const countLabel = useMemo(() => {
        const total = financeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = `${financeExpenses.length} dépense${financeExpenses.length > 1 ? 's' : ''}`;
        return `${count} · ${formatCurrency(total, settings.currency, settings.compactNotation)} · exercice ${exerciseYear}`;
    }, [financeExpenses, settings.currency, settings.compactNotation, exerciseYear]);

    return (
        <div className="flex flex-col h-full bg-surface">
            <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} />
            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
                budgetItems={currentBudget.items}
            />

            <PageContainer>
                <PageHeader
                    title="Journal des dépenses"
                    subtitle={countLabel}
                    breadcrumb="Finances"
                    showContentTitleOnCompact
                    leadingIcon={{ icon: 'arrow_back', onClick: onBack, label: 'Retour aux finances' }}
                    actions={
                        <Button
                            variant="filled"
                            icon={<Icon glyph={Plus} size={18} />}
                            onClick={() => setIsAddExpenseModalOpen(true)}
                            className="whitespace-nowrap"
                        >
                            Enregistrer une dépense
                        </Button>
                    }
                />

                <Reading className="animate-in fade-in slide-in-from-bottom-4 duration-medium2">
                    <Card title="Historique des Transactions">
                        <div className="hidden medium:block overflow-x-auto">
                            <table className="w-full text-body-medium text-left">
                                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Fournisseur</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Montant</th>
                                        <th className="px-6 py-4 text-center">Statut</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {financeExpenses.length > 0 ? (
                                        financeExpenses.map((exp) => (
                                            <tr
                                                key={exp.id}
                                                className="hover:bg-surface-container/50 focus-visible:ring-focus-ring group cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                                                {...rowActivation(() => setSelectedExpenseId(exp.id))}
                                            >
                                                <td className="px-6 py-4 text-on-surface-variant font-mono text-body-small whitespace-nowrap">
                                                    {formatExpenseDate(exp.date)}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-on-surface whitespace-nowrap">
                                                    {exp.supplier}
                                                </td>
                                                <td className="px-6 py-4 text-on-surface-variant max-w-[260px]">
                                                    <span className="block truncate" title={exp.description}>
                                                        {toExpenseDescriptionPreview(exp.description)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Icon glyph={getExpenseTypeGlyph(exp.type)} size={18} className="text-on-surface-variant" />
                                                        <span className="text-label-medium font-medium whitespace-nowrap">{EXPENSE_TYPE_LABELS[exp.type]}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-on-surface text-right tabular-nums whitespace-nowrap">
                                                    {formatExpenseAmount(exp.amount, exp.currencyCode || settings.currency)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant={getExpenseStatusVariant(exp.status)}>
                                                        {getExpenseStatusLabel(exp.status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="text"
                                                        size="sm"
                                                        className="h-8 w-8 min-w-0 p-0 rounded-full text-error hover:bg-error-container/40"
                                                        aria-label={`Supprimer la dépense ${exp.id}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            requestExpenseDeletion(exp, () => setSelectedExpenseId((current) => (current === exp.id ? null : current)));
                                                        }}
                                                    >
                                                        <Icon glyph={Trash} size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant">
                                                Aucune dépense enregistrée pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Vue cartes (compact) — Historique des transactions */}
                        <div className="medium:hidden divide-y divide-outline-variant">
                            {financeExpenses.length > 0 ? (
                                financeExpenses.map((exp) => (
                                    <div
                                        key={exp.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedExpenseId(exp.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setSelectedExpenseId(exp.id);
                                            }
                                        }}
                                        className="p-4 space-y-2 cursor-pointer hover:bg-surface-container/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="font-bold text-on-surface min-w-0 truncate">{exp.supplier}</span>
                                            <Badge variant={getExpenseStatusVariant(exp.status)}>
                                                {getExpenseStatusLabel(exp.status)}
                                            </Badge>
                                        </div>
                                        {exp.description && (
                                            <p className="text-body-small text-on-surface-variant truncate" title={exp.description}>
                                                {toExpenseDescriptionPreview(exp.description)}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-label-small text-on-surface-variant min-w-0">
                                                <span className="font-mono whitespace-nowrap">{formatExpenseDate(exp.date)}</span>
                                                <span className="inline-flex items-center gap-1 truncate">
                                                    <Icon glyph={getExpenseTypeGlyph(exp.type)} size={18} />
                                                    {EXPENSE_TYPE_LABELS[exp.type]}
                                                </span>
                                            </div>
                                            <span className="font-bold text-on-surface tabular-nums whitespace-nowrap">
                                                {formatExpenseAmount(exp.amount, exp.currencyCode || settings.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="text"
                                                size="sm"
                                                className="h-9 min-w-0 px-2 rounded-full text-error hover:bg-error-container/40"
                                                aria-label={`Supprimer la dépense ${exp.id}`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    requestExpenseDeletion(exp, () => setSelectedExpenseId((current) => (current === exp.id ? null : current)));
                                                }}
                                                icon={<Icon glyph={Trash} size={18} />}
                                            >
                                                Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center text-on-surface-variant">
                                    Aucune dépense enregistrée pour le moment.
                                </div>
                            )}
                        </div>
                    </Card>
                </Reading>
            </PageContainer>
        </div>
    );
};

export default ExpenseJournalPage;
