import React, { useEffect, useMemo, useState } from 'react';
import { CaretRight, DotsThreeVertical, Plus } from '@phosphor-icons/react';

import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import Reading from '../../../components/layout/Reading';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import SelectField from '../../../components/ui/SelectField';
import { MEDIA } from '../../../constants/breakpoints';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { FinanceBudgetItem, ViewType } from '../../../types';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';
import { formatExpenseDate } from '../lib/expensePresentation';

interface FinanceManagementPageProps {
    onViewChange: (view: ViewType) => void;
}

/**
 * Le classement d'une ligne de budget — **relevé sur la ligne, jamais déduit**.
 *
 * Le produit le devinait : deux listes de mots-clés, puis un repli sur le montant —
 * au-dessus de 5 000, investissement ; en dessous, frais courants. La colonne
 * s'appelait « Type (IA) » et rien, à l'écran, ne distinguait cette supposition d'un
 * classement saisi. Planche 15.1 : *un chiffre deviné ne se présente pas comme un
 * chiffre su* — celui-ci **se demande**, à la saisie du budget.
 *
 * Une ligne héritée qui n'en porte pas n'affiche rien : un blanc se remarque et se
 * corrige, une supposition se recopie dans le rapport de clôture.
 */
const budgetCapitalization = (item: FinanceBudgetItem): 'CAPEX' | 'OPEX' | null =>
    item.capitalization ?? null;

/**
 * **Finances — une page, et une seule** (planche 15.1, colonne « Vue — Finances,
 * ce qui reste »).
 *
 * La page portait trois onglets — vue d'ensemble, dépenses, budget — et énonçait
 * les mêmes trois chiffres (alloué, dépensé, restant) **trois fois** : dans le
 * héro, puis dans deux rangées de cartes métriques, une par onglet. La liste des
 * postes existait deux fois : ici en jauges, et redessinée en tableau sous
 * « Détails du budget ». La planche tranche : *la question posée à un budget
 * n'est pas « combien a-t-on prévu », c'est « combien reste-t-il »* — un seul
 * énoncé, dans le héro, et une seule liste de postes.
 *
 * Ce qui reste donc à l'écran : le héro, les postes avec leur jauge, les trois
 * dernières dépenses. Le journal complet n'est pas un onglet mais **une
 * destination** (`finance_expenses`), atteinte par le lien de la planche —
 * « Voir les N dépenses de l'exercice ».
 */
const FinanceManagementPage: React.FC<FinanceManagementPageProps> = ({ onViewChange }) => {
    const { settings } = useData();
    const { financeExpenses, financeBudgets } = useFinanceData();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const isCompact = useMediaQuery(MEDIA.compact);

    const [selectedYear, setSelectedYear] = useState<number>(
        () => financeBudgets[0]?.year || new Date().getFullYear(),
    );

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === selectedYear)) {
            setSelectedYear(financeBudgets[0].year);
        }
    }, [financeBudgets, selectedYear]);

    const { currentBudget, budgetStats } = useBudgetExercise(selectedYear);
    const spentPercent = Math.min(Math.max(budgetStats.percent, 0), 100);

    const currentFrenchDate = useMemo(
        () =>
            new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date()),
        [],
    );

    const paceNote = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const dayOfYear = Math.floor(
            (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
        );
        const expectedPace = (dayOfYear / 365) * 100;
        const diff = spentPercent - expectedPace;

        if (diff > 12) {
            return `soit un rythme supérieur aux prévisions de l'exercice.`;
        }
        if (diff < -12) {
            return `soit une consommation maîtrisée sur le calendrier de l'exercice.`;
        }
        return `en ligne avec le rythme prévisionnel de l'exercice.`;
    }, [spentPercent]);

    const budgetYearOptions = useMemo(() => {
        if (financeBudgets.length > 0) {
            return financeBudgets.map((budget) => ({
                value: budget.year.toString(),
                label: `${budget.year} (${budget.status})`,
            }));
        }

        return [
            {
                value: selectedYear.toString(),
                label: `${selectedYear} (${currentBudget.status})`,
            },
        ];
    }, [financeBudgets, selectedYear, currentBudget.status]);

    return (
        <div className="bg-surface flex h-full flex-col">
            <AddExpenseModal
                isOpen={isAddExpenseModalOpen}
                onClose={() => setIsAddExpenseModalOpen(false)}
            />
            <AddBudgetModal
                isOpen={isAddBudgetModalOpen}
                onClose={() => setIsAddBudgetModalOpen(false)}
            />
            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
                budgetItems={currentBudget.items}
            />

            <PageContainer>
                {/* Le héro dit l'exercice et son état : un sous-titre de page le
                    redirait une ligne plus haut (15.1). */}
                <PageHeader
                    title="Finances"
                    breadcrumb="Finances"
                    actions={
                        /* Sur téléphone la planche range les deux actes derrière le
                           « ⋮ » de sa barre : trois contrôles empilés pleine largeur
                           repousseraient le héro — le seul chiffre pour lequel on
                           ouvre cette page — sous la ligne de flottaison. */
                        <div className="medium:w-auto medium:gap-3 flex w-full items-center gap-2">
                            <SelectField
                                name="finance-year"
                                value={selectedYear.toString()}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                options={budgetYearOptions}
                                placeholder="Choisir un exercice"
                                className="medium:w-44 medium:flex-none flex-1 space-y-0"
                            />
                            {isCompact ? (
                                <Menu
                                    align="end"
                                    items={[
                                        {
                                            id: 'budget',
                                            label: 'Définir le budget',
                                            icon: 'add',
                                            onSelect: () => setIsAddBudgetModalOpen(true),
                                        },
                                        {
                                            id: 'expense',
                                            label: 'Enregistrer une dépense',
                                            icon: 'receipt_long',
                                            onSelect: () => setIsAddExpenseModalOpen(true),
                                        },
                                    ]}
                                    trigger={
                                        <Button
                                            variant="text"
                                            iconOnly
                                            aria-label="Actions de l'exercice"
                                        >
                                            <Icon glyph={DotsThreeVertical} />
                                        </Button>
                                    }
                                />
                            ) : (
                                <>
                                    <Button
                                        variant="outlined"
                                        icon={<Icon glyph={Plus} size={18} />}
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="whitespace-nowrap"
                                    >
                                        Définir le budget
                                    </Button>
                                    <Button
                                        variant="filled"
                                        icon={<Icon glyph={Plus} size={18} />}
                                        onClick={() => setIsAddExpenseModalOpen(true)}
                                        className="whitespace-nowrap"
                                    >
                                        Enregistrer une dépense
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                {/* **Une seule largeur de lecture — 960 px** (§2.43). */}
                <Reading className="animate-in fade-in slide-in-from-bottom-4 duration-medium2">
                    <div className="space-y-5">
                        {/* HERO PLANCHE 15.1 */}
                        <section className="shadow-elevation-1 flex flex-col gap-3 rounded-lg bg-[var(--tk-color-dark)] p-4 text-[var(--tk-color-on-dark)]">
                            <p className="text-[12px] leading-[17px] text-[var(--tk-color-on-dark-2)]">
                                Exercice {selectedYear} · {currentBudget.status.toLowerCase()}
                            </p>
                            <div className="flex items-baseline gap-2.5 border-t border-[var(--tk-color-dark-line)] pt-3.5">
                                <b className="font-brand text-[28px] font-semibold tracking-tight text-[var(--tk-color-on-dark)] tabular-nums">
                                    {formatCurrency(
                                        budgetStats.remaining,
                                        settings.currency,
                                        settings.compactNotation,
                                    )}
                                </b>
                                <span className="text-[13px] leading-[19px] text-[var(--tk-color-on-dark-2)]">
                                    restants sur
                                    <br />
                                    une enveloppe de{' '}
                                    {formatCurrency(
                                        budgetStats.totalAllocated,
                                        settings.currency,
                                        settings.compactNotation,
                                    )}
                                </span>
                            </div>
                            <p className="mt-1 border-t border-[var(--tk-color-dark-line)] pt-2.5 text-[12px] leading-[17px] text-[var(--tk-color-on-dark-2)]">
                                {spentPercent.toFixed(0)} % consommés au {currentFrenchDate} —{' '}
                                {paceNote}
                            </p>
                        </section>

                        {/* SECTION 1 : LES POSTES (PLANCHE 15.1) */}
                        <section className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[13px] font-medium">
                                    Les postes
                                </h3>
                                <span className="text-on-surface-variant text-[13px] tabular-nums">
                                    {currentBudget.items.length}
                                </span>
                            </div>
                            <div className="divide-outline-variant divide-y">
                                {currentBudget.items.length > 0 ? (
                                    currentBudget.items.map((item, idx) => {
                                        const itemPercent =
                                            item.allocated > 0
                                                ? (item.spent / item.allocated) * 100
                                                : 0;
                                        const itemRemaining = item.allocated - item.spent;
                                        const isOver = itemRemaining < 0 || itemPercent >= 100;
                                        const classification = budgetCapitalization(item);
                                        return (
                                            <div
                                                key={idx}
                                                className="space-y-1.5 py-2.5 first:pt-1 last:pb-1"
                                            >
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <span className="text-on-surface text-[14px] font-normal">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-on-surface text-[14px] font-medium whitespace-nowrap tabular-nums">
                                                        {formatCurrency(
                                                            item.spent,
                                                            settings.currency,
                                                            settings.compactNotation,
                                                        )}{' '}
                                                        <s className="text-[11px] font-normal text-[var(--tk-color-text-muted)] no-underline">
                                                            /{' '}
                                                            {formatCurrency(
                                                                item.allocated,
                                                                settings.currency,
                                                                settings.compactNotation,
                                                            )}
                                                        </s>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-xs bg-[var(--tk-color-surface-container)]">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-xs transition-all duration-300',
                                                            isOver
                                                                ? 'bg-[var(--tk-color-st-orange)]'
                                                                : 'bg-[var(--tk-color-st-bleu)]',
                                                        )}
                                                        style={{
                                                            width: `${Math.min(itemPercent, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-on-surface-variant flex items-center gap-2 text-[12px]">
                                                    {/* Une ligne qui ne porte pas son classement **n'affiche rien** : un
                                                        blanc se remarque et se corrige, une supposition se recopie
                                                        dans le rapport de clôture (15.1). */}
                                                    {classification && (
                                                        <span className="text-on-surface-variant rounded-full bg-[var(--tk-color-surface-container)] px-2 py-0.5 text-[11px] font-medium tracking-wide">
                                                            {classification}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {isOver
                                                            ? 'enveloppe épuisée'
                                                            : `${formatCurrency(itemRemaining, settings.currency, settings.compactNotation)} restants`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-body-small text-text-muted py-4 text-center">
                                        Aucun poste budgétaire défini pour cet exercice.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* SECTION 2 : DERNIÈRES DÉPENSES (PLANCHE 15.1) */}
                        <section className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[13px] font-medium">
                                    Dernières dépenses
                                </h3>
                                <span className="text-on-surface-variant text-[13px] tabular-nums">
                                    {Math.min(3, financeExpenses.length)} sur{' '}
                                    {financeExpenses.length}
                                </span>
                            </div>
                            <div className="divide-outline-variant divide-y">
                                {financeExpenses.length > 0 ? (
                                    financeExpenses.slice(0, 3).map((exp) => (
                                        <div
                                            key={exp.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedExpenseId(exp.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedExpenseId(exp.id);
                                                }
                                            }}
                                            className="hover:bg-surface-container/50 focus-visible:ring-primary -mx-2 flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none focus-visible:ring-2"
                                        >
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-on-surface truncate text-[14px] font-normal">
                                                    {exp.supplier}
                                                </span>
                                                <span className="text-on-surface-variant truncate text-[12px] leading-[17px]">
                                                    {formatExpenseDate(exp.date)} ·{' '}
                                                    {exp.invoiceNumber ||
                                                        exp.description ||
                                                        'Facture'}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-on-surface text-[14px] font-medium whitespace-nowrap tabular-nums">
                                                    {formatCurrency(
                                                        exp.amount,
                                                        exp.currencyCode || settings.currency,
                                                        settings.compactNotation,
                                                    )}
                                                </span>
                                                <Icon
                                                    glyph={CaretRight}
                                                    size={18}
                                                    className="text-on-surface-variant shrink-0"
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-body-small text-text-muted py-4 text-center">
                                        Aucune dépense enregistrée sur cet exercice.
                                    </p>
                                )}
                            </div>
                            {financeExpenses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onViewChange('finance_expenses')}
                                    className="border-outline-variant text-on-surface hover:text-on-surface-variant mt-2 flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 border-0 border-t bg-transparent pt-2 text-left text-[14px] font-medium transition-colors"
                                >
                                    <Icon
                                        glyph={CaretRight}
                                        size={18}
                                        className="text-on-surface-variant shrink-0"
                                    />
                                    Voir les {financeExpenses.length} dépenses de l'exercice
                                </button>
                            )}
                        </section>
                    </div>
                </Reading>
            </PageContainer>
        </div>
    );
};

export default FinanceManagementPage;
