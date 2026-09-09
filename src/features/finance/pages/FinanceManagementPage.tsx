import React, { useEffect, useMemo, useState } from 'react';
import {
    Calculator,
    CaretRight,
    DotsThreeVertical,
    ListBullets,
} from '@phosphor-icons/react';

import { PageContainer } from '../../../components/layout/PageContainer';
import Reading from '../../../components/layout/Reading';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import SelectField from '../../../components/ui/SelectField';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { FinanceBudgetItem, ViewType } from '../../../types';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';

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
                {/*
                  **`.top` de 15.1** — le même bloc que les autres domaines : fond de
                  surface, un filet dessous, intérieur `8 / 16 / 12`, gouttière 12, et le
                  titre en **28 sur 32**. Il passait par `PageHeader`, qui pose un fil
                  d'Ariane « Finances » au-dessus d'un titre « Finances » et n'a pas
                  l'échelle du palier haut.

                  Les deux actes restent au ⋮ : *« trois contrôles empilés pleine largeur
                  repousseraient le héro — le seul chiffre pour lequel on ouvre cette
                  page — sous la ligne de flottaison. »*
                */}
                <div className="border-outline-variant bg-surface -mx-page -mt-page mb-4 flex flex-col gap-3 border-b px-4 pt-2 pb-3">
                    <div className="flex min-h-12 items-center gap-2">
                        <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            Finances
                        </h1>
                        <Menu
                            align="end"
                            items={[
                                {
                                    id: 'budget',
                                    label: 'Définir le budget',
                                    description: 'les postes de l’exercice et leurs enveloppes',
                                    onSelect: () => setIsAddBudgetModalOpen(true),
                                },
                                {
                                    id: 'expense',
                                    label: 'Enregistrer une dépense',
                                    description: 'une écriture sur un poste',
                                    onSelect: () => setIsAddExpenseModalOpen(true),
                                },
                            ]}
                            trigger={
                                <Button
                                    variant="text"
                                    iconOnly
                                    aria-label="Actes de l’exercice"
                                    className="text-on-surface hover:bg-surface-container flex h-12 w-12 shrink-0 items-center justify-center rounded-md p-0"
                                >
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    </div>
                    {/* Changer d'exercice — 15.1 en fait un geste du héro qui mène à
                        l'écran « Exercices » ; celui-ci n'existe pas encore, le sélecteur
                        tient la place et reste dans le bloc fixe. */}
                    <SelectField
                        name="finance-year"
                        value={selectedYear.toString()}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        options={budgetYearOptions}
                        placeholder="Choisir un exercice"
                        className="space-y-0"
                    />
                </div>

                {/* **Une seule largeur de lecture — 960 px** (§2.43). */}
                <Reading className="animate-in fade-in slide-in-from-bottom-4 duration-medium2">
                    <div className="space-y-5">
                        {/*
                          **LE HÉRO DE 15.1**, dans la grammaire des quatre autres domaines
                          (09, 10, 16, 04) : surtitre en capitales, **le restant en 44**,
                          l'unité à côté, ce sur quoi il se compte dessous, la jauge, puis
                          la ligne de lecture — deux faits, un de chaque côté.

                          Il tenait un intérieur de 16 au lieu de `22 / 20 / 20`, un chiffre
                          en **28** au lieu de 44, deux filets que la planche ne déclare pas,
                          un « restants sur / une enveloppe de » coupé par un `<br>`, et
                          **aucune jauge** — le seul dessin qui dise d'un coup où en est
                          l'exercice.
                        */}
                        <section className="bg-inverse-surface text-inverse-on-surface rounded-lg px-5 pt-[22px] pb-5">
                            <span className="block text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                                Exercice {selectedYear} · {currentBudget.status.toLowerCase()}
                            </span>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                                <b className="font-brand text-[44px] leading-[48px] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                    {formatCurrency(
                                        budgetStats.remaining,
                                        settings.currency,
                                        settings.compactNotation,
                                    )}
                                </b>
                            </div>
                            <span className="mt-1 block text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                                restants sur{' '}
                                {formatCurrency(
                                    budgetStats.totalAllocated,
                                    settings.currency,
                                    settings.compactNotation,
                                )}
                            </span>
                            {budgetStats.totalAllocated > 0 && (
                                <>
                                    {/* `.prog` — 6 px, rayon 2, sur le voile à 12 %. */}
                                    <div className="mt-5 h-1.5 overflow-hidden rounded-sm bg-white/[0.12]">
                                        <i
                                            className="block h-full bg-[var(--tk-color-live-vert)]"
                                            style={{ width: `${Math.min(spentPercent, 100)}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between gap-3 text-[12px] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
                                        <span>
                                            <b className="text-inverse-on-surface font-medium">
                                                {spentPercent.toFixed(0)} %
                                            </b>{' '}
                                            consommés
                                        </span>
                                        <span>au {currentFrenchDate}</span>
                                    </div>
                                </>
                            )}
                        </section>

                        {/* SECTION 1 : LES POSTES (PLANCHE 15.1) */}
                        <section className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border p-4">
                            {/* `.ch` — 48 de haut, titre **17 sur 24** en graisse d'appui,
                                le compte en 14 sur 20. Il tenait 13 px des deux côtés. */}
                            <div className="flex min-h-12 items-baseline justify-between gap-3 pt-2 pb-1">
                                <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                                    Les postes
                                </h3>
                                <span className="text-on-surface-variant text-[14px] leading-5 tabular-nums">
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
                                            <div key={idx} className="flex flex-col gap-2 py-3">
                                                {/* `.bt` — le nom en 16/24, puis **le
                                                    consommé sur l'affecté** : le premier en
                                                    encre pleine, le second en secondaire.
                                                    Il était barré (`<s>`), ce qui dit
                                                    « annulé » d'un montant qui ne l'est
                                                    pas. */}
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <span className="text-on-surface text-[16px] leading-6">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-on-surface-variant text-[14px] leading-5 whitespace-nowrap tabular-nums">
                                                        <b className="text-on-surface text-[16px] font-medium">
                                                            {formatCurrency(
                                                                item.spent,
                                                                settings.currency,
                                                                settings.compactNotation,
                                                            )}
                                                        </b>{' '}
                                                        /{' '}
                                                        {formatCurrency(
                                                            item.allocated,
                                                            settings.currency,
                                                            settings.compactNotation,
                                                        )}
                                                    </span>
                                                </div>
                                                {/* `.gauge` — **le vert d'état**, l'orange
                                                    quand l'enveloppe est épuisée. Elle
                                                    tirait le bleu, qui ne dit rien ici. */}
                                                <div className="bg-surface-container h-1.5 overflow-hidden rounded-sm">
                                                    <div
                                                        className={cn(
                                                            'h-full transition-all duration-300',
                                                            isOver
                                                                ? 'bg-[var(--tk-color-st-orange)]'
                                                                : 'bg-[var(--tk-color-st-vert)]',
                                                        )}
                                                        style={{
                                                            width: `${Math.min(itemPercent, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-on-surface-variant flex items-center gap-2 text-[12px] leading-4">
                                                    {/* Une ligne qui ne porte pas son classement **n'affiche rien** : un
                                                        blanc se remarque et se corrige, une supposition se recopie
                                                        dans le rapport de clôture (15.1). */}
                                                    {classification && (
                                                        /* `.tag` — 20 de haut, rayon **4**,
                                                            creux : c'est une étiquette de
                                                            donnée, pas une pastille. */
                                                        <span className="bg-surface-container text-on-surface-variant inline-flex h-5 items-center rounded-[4px] px-1.5 font-medium">
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

                        {/*
                          **« ALLER À » — deux destinations, pas un aperçu.** 15.1 :
                          *« l'accueil du domaine porte un exercice et **deux
                          destinations** : ses lignes, ses dépenses »*. La carte listait à
                          la place les trois dernières dépenses, avec un lien au bout :
                          un extrait de la page voisine, qu'il fallait lire pour découvrir
                          qu'elle existait. Les deux rangées la nomment et la comptent.
                        */}
                        <section className="bg-surface border-outline-variant shadow-elevation-1 rounded-lg border px-5 py-2">
                            <div className="flex min-h-12 items-center pt-2 pb-1">
                                <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                                    Aller à
                                </h3>
                            </div>
                            {(
                                [
                                    {
                                        id: 'lignes',
                                        glyph: Calculator,
                                        titre: 'Les lignes du budget',
                                        detail: `${currentBudget.items.length} ligne${currentBudget.items.length > 1 ? 's' : ''} · ${formatCurrency(budgetStats.totalAllocated, settings.currency, settings.compactNotation)} affectés`,
                                        aller: () => setIsAddBudgetModalOpen(true),
                                    },
                                    {
                                        id: 'depenses',
                                        glyph: ListBullets,
                                        titre: 'Les dépenses',
                                        detail: `${financeExpenses.length} écriture${financeExpenses.length > 1 ? 's' : ''} · ${formatCurrency(budgetStats.totalSpent, settings.currency, settings.compactNotation)}`,
                                        aller: () => onViewChange('finance_expenses'),
                                    },
                                ] as const
                            ).map((rangee, index) => (
                                /* `.lrow` — 64 de haut, gouttière 12, un filet entre deux. */
                                <div
                                    key={rangee.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={rangee.aller}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            rangee.aller();
                                        }
                                    }}
                                    className={cn(
                                        'flex min-h-16 w-full cursor-pointer items-center gap-3 py-2 text-left',
                                        index > 0 && 'border-outline-variant border-t',
                                    )}
                                >
                                    <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                        <Icon glyph={rangee.glyph} size={20} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface block truncate text-[16px] leading-6">
                                            {rangee.titre}
                                        </span>
                                        <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                            {rangee.detail}
                                        </span>
                                    </span>
                                    <Icon
                                        glyph={CaretRight}
                                        size={20}
                                        className="text-text-tertiary shrink-0"
                                    />
                                </div>
                            ))}
                        </section>
                    </div>
                </Reading>
            </PageContainer>
        </div>
    );
};

export default FinanceManagementPage;
