import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
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
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { FinanceBudgetItem, ViewType } from '../../../types';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';

interface FinanceManagementPageProps {
    onViewChange: (view: ViewType) => void;
    /** `.tb` de 15.1 — la flèche du `.top`. Le domaine s'atteint depuis « Plus ». */
    onBack?: () => void;
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
const FinanceManagementPage: React.FC<FinanceManagementPageProps> = ({ onViewChange, onBack }) => {
    const isCompact = useMediaQuery(MEDIA.compact);
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
        /* **Le canevas derrière les cartes.** La page se peignait en `bg-surface`, la
           couleur des cartes elles-mêmes : « Les postes » et « Aller à » se fondaient
           dans le fond, et seul un filet — que la planche ne déclare pas — les
           détachait. `.phone` de 15.1 est sur le canevas, `.card` sur la surface. */
        <div className="flex h-full flex-col">
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

                  **Le bloc épouse l'intérieur de la page, pas celui du bureau.**
                  `PageContainer` pose 16 au téléphone et 24 au-delà ; le bloc se retirait
                  de 24 partout, si bien qu'à 393 il débordait de 8 à gauche, à droite et
                  en haut — la flèche touchait le bord et le titre montait de 8 (mesuré le
                  11/09 : flèche à 0, titre à 56, là où les listes du gabarit posent la
                  flèche à 8 et le titre à 60).
                */}
                {/* Au-delà de 600, **l'en-tête du bureau** (17.11) : sur le canevas, sans filet, les
                    gestes d'icône en carrés de 40. Le bloc blanc du téléphone y faisait une seconde
                    surface au-dessus des cartes (13/09). */}
                <IconGestureSizeContext.Provider value={isCompact ? 48 : 40}>
                    <div
                        className={cn(
                            'mb-4 flex flex-col gap-3',
                            isCompact
                                ? 'border-outline-variant bg-surface -mx-page-sm -mt-page-sm border-b px-4 pt-2 pb-3'
                                : '-mt-1',
                        )}
                    >
                        <div className="flex min-h-12 items-center gap-1">
                            {/* `.tt` de 15.1 ouvre sur `.tb` — **la flèche de retour**, que la
                                page n'avait pas : atteinte depuis « Plus », elle ne se
                                quittait que par la barre du bas. Au bureau, 15.1 n'en dessine
                                pas : la barre latérale mène déjà partout. */}
                            {onBack && isCompact && (
                                <Button
                                    variant="text"
                                    iconOnly
                                    aria-label="Retour"
                                    onClick={onBack}
                                    className="text-on-surface hover:bg-surface-container -ml-3 shrink-0 rounded-md"
                                >
                                    <Icon glyph={ArrowLeft} size={24} />
                                </Button>
                            )}
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
                                        className="text-on-surface hover:bg-surface-container shrink-0 rounded-md"
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
                </IconGestureSizeContext.Provider>

                {/* **Une seule largeur de lecture — 960 px** (§2.43). */}
                <Reading className="animate-in fade-in slide-in-from-bottom-4 duration-medium2">
                    {/* `.page` de 15.1 — **16 entre les blocs**, la gouttière du produit. */}
                    <div className="space-y-4">
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
                        <section className="bg-inverse-surface text-inverse-on-surface rounded-card px-5 pt-[22px] pb-5">
                            <span className="block text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                                Exercice {selectedYear} · {currentBudget.status.toLowerCase()}
                            </span>
                            {/* `.big` — **le nombre, puis l'unité à côté** : Archivo 44
                                sur 48 pour l'un, 14 sur 20 en encre estompée pour
                                l'autre, comme le héro de 16.1. La devise passait dans le
                                `<b>` avec le chiffre : « XOF » s'écrivait alors en 44, et
                                une seconde fois sous la jauge. */}
                            <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                                <b className="font-brand text-[44px] leading-[48px] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                    {formatNumber(budgetStats.remaining, settings.compactNotation)}
                                </b>
                                <span className="text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                                    {settings.currency}
                                </span>
                            </div>
                            <span className="mt-1 block text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                                restants sur{' '}
                                {formatNumber(budgetStats.totalAllocated, settings.compactNotation)}
                            </span>
                            {budgetStats.totalAllocated > 0 && (
                                <>
                                    {/* `.prog` — 6 px, rayon 2, sur le voile à 12 %. */}
                                    <div className="mt-5 h-1.5 overflow-hidden rounded-xs bg-white/[0.12]">
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
                        {/* `.card` — **fond de surface, rayon 8, intérieur 8 / 16**, et rien
                            d'autre : ni filet ni ombre, qu'aucune planche ne déclare et
                            que les sept écrans déjà portés n'ont pas. Elle tenait 16 de
                            tous les côtés et un cadre. */}
                        <section className="rounded-card bg-surface px-4 py-2">
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
                                                    {/* **Des nombres nus.** `.bv` de 15.1
                                                        écrit « 18 900 000 / 21 000 000 » :
                                                        la devise est dite une fois, dans
                                                        le héro. Le produit l'accolait aux
                                                        deux montants et au restant — trois
                                                        « XOF » par rangée, trente-trois sur
                                                        l'écran, et une ligne qui touchait
                                                        son libellé. */}
                                                    <span className="text-on-surface-variant text-[14px] leading-5 whitespace-nowrap tabular-nums">
                                                        <b className="text-on-surface text-[16px] font-medium">
                                                            {formatNumber(
                                                                item.spent,
                                                                settings.compactNotation,
                                                            )}
                                                        </b>{' '}
                                                        /{' '}
                                                        {formatNumber(
                                                            item.allocated,
                                                            settings.compactNotation,
                                                        )}
                                                    </span>
                                                </div>
                                                {/* `.gauge` — **le vert d'état**, l'orange
                                                    quand l'enveloppe est épuisée. Elle
                                                    tirait le bleu, qui ne dit rien ici. */}
                                                <div className="bg-surface-container h-1.5 overflow-hidden rounded-xs">
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
                                                            : `${formatNumber(itemRemaining, settings.compactNotation)} restants`}
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
                        <section className="rounded-card bg-surface px-4 py-2">
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
                                        detail: `${currentBudget.items.length} ligne${currentBudget.items.length > 1 ? 's' : ''} · ${formatNumber(budgetStats.totalAllocated, settings.compactNotation)} affectés`,
                                        aller: () => setIsAddBudgetModalOpen(true),
                                    },
                                    {
                                        id: 'depenses',
                                        glyph: ListBullets,
                                        titre: 'Les dépenses',
                                        detail: `${financeExpenses.length} écriture${financeExpenses.length > 1 ? 's' : ''} · ${formatNumber(budgetStats.totalSpent, settings.compactNotation)}`,
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
