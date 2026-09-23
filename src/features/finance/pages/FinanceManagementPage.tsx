import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CalendarBlank,
    CalendarPlus,
    Calculator,
    CaretRight,
    DotsThreeVertical,
    Export,
    ListBullets,
    LockSimple,
    Plus,
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

    /** Une enveloppe épuisée est une enveloppe dont le consommé a rejoint l'affecté. */
    const enveloppesEpuisees = currentBudget.items.filter(
        (item) => item.allocated > 0 && item.spent >= item.allocated,
    ).length;

    /** La dernière écriture du journal — « dernière le 2 sept. » dans la bande de 15.1. */
    const derniereDepense = useMemo(() => {
        const dates = financeExpenses
            .map((expense) => new Date(expense.date).getTime())
            .filter((time) => !Number.isNaN(time));
        if (dates.length === 0) return null;
        return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
            new Date(Math.max(...dates)),
        );
    }, [financeExpenses]);

    const currentFrenchDate = useMemo(
        () =>
            new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date()),
        [],
    );

    /**
     * **Les autres exercices** — ceux que la carte de droite liste au bureau : celui qu'on
     * regarde n'y est pas, la page entière le porte déjà. Un exercice sans ligne est *à
     * projeter* ; les autres disent ce qu'ils ont consommé sur ce qu'ils avaient.
     */
    const autresExercices = useMemo(
        () =>
            financeBudgets
                .filter((budget) => budget.year !== selectedYear)
                .sort((a, b) => b.year - a.year)
                .map((budget) => {
                    const consomme = budget.items.reduce((somme, item) => somme + item.spent, 0);
                    const aProjeter = budget.items.length === 0;
                    return {
                        year: budget.year,
                        aProjeter,
                        detail: aProjeter
                            ? 'aucune ligne · à projeter'
                            : `${formatNumber(consomme, settings.compactNotation)} sur ${formatNumber(budget.totalAllocated, settings.compactNotation)}`,
                    };
                }),
        [financeBudgets, selectedYear, settings.compactNotation],
    );

    const exercicesClos = useMemo(
        () =>
            financeBudgets.filter(
                (budget) => budget.year !== selectedYear && budget.status !== 'En cours',
            ).length,
        [financeBudgets, selectedYear],
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
                            /* **L'en-tête reste** quand les postes défilent (17.8). Au bureau
                               il remonte dans la marge de la page et la reprend en padding,
                               moins les 4 du `-mt-1` : posé, le titre n'a pas bougé ; collé,
                               il ne touche pas le bord. */
                            'sticky top-0 z-20 mb-4 flex flex-col gap-3',
                            isCompact
                                ? 'border-outline-variant bg-surface -mx-page-sm -mt-page-sm border-b px-4 pt-2 pb-3'
                                : 'bg-background -mt-page pt-[calc(var(--tk-space-page)-0.25rem)]',
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
                            {/* `.tt2` de 15.1 au bureau — **le titre et, sous lui, l'exercice
                                que l'on regarde** : *« Exercice 2026 · en cours · au 3
                                septembre »*. La page ne disait nulle part, au bureau, de quel
                                exercice elle parlait ; le sélecteur pleine largeur le portait
                                pour elle. */}
                            <div className="min-w-0 flex-1">
                                <h1 className="font-brand text-on-surface text-ts-page leading-ts-page font-semibold tracking-[-0.02em]">
                                    Finances
                                </h1>
                                <p className="text-on-surface-variant text-ts-body leading-ts-body large:block mt-0.5 hidden">
                                    Exercice {selectedYear} · {currentBudget.status.toLowerCase()} ·
                                    au {currentFrenchDate}
                                </p>
                            </div>

                            {/* **Les deux gestes passent dans l'en-tête au bureau** (15.1) :
                                « Changer d'exercice » — le sélecteur du téléphone devient un
                                menu ancré à son bouton — et « Enregistrer une dépense », le
                                geste jaune. Au téléphone ils restent au ⋮ : *« trois contrôles
                                empilés repousseraient le héro sous la ligne de flottaison »*. */}
                            <Menu
                                align="end"
                                items={financeBudgets.map((budget) => ({
                                    id: `exercice-${budget.year}`,
                                    label: `Exercice ${budget.year}`,
                                    description: budget.status,
                                    onSelect: () => setSelectedYear(budget.year),
                                }))}
                                trigger={
                                    <Button
                                        variant="text"
                                        className="border-outline-variant bg-surface text-on-surface hover:bg-surface-container large:inline-flex hidden h-10 min-h-10 shrink-0 gap-2 !rounded-[4px] border px-3 text-[0.875rem] font-medium !shadow-none"
                                        icon={<Icon glyph={CalendarBlank} size={20} />}
                                    >
                                        Changer d’exercice
                                    </Button>
                                }
                            />
                            <Button
                                variant="filled"
                                onClick={() => setIsAddExpenseModalOpen(true)}
                                icon={<Icon glyph={Plus} size={20} />}
                                className="large:inline-flex hidden h-10 min-h-10 shrink-0 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium shadow-none"
                            >
                                Enregistrer une dépense
                            </Button>
                            <Menu
                                align="end"
                                /* Le ⋮ du téléphone : au bureau, ses deux verbes sont des
                                   boutons. */
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
                                        className="text-on-surface hover:bg-surface-container large:hidden shrink-0 rounded-md"
                                    >
                                        <Icon glyph={DotsThreeVertical} size={20} />
                                    </Button>
                                }
                            />
                        </div>
                        {/* Changer d'exercice — 15.1 en fait un geste du héro qui mène à
                            l'écran « Exercices » ; celui-ci n'existe pas encore, le sélecteur
                            tient la place et reste dans le bloc fixe. */}
                        {/* 15.1 ne dessine ce sélecteur nulle part au bureau : l'exercice s'y
                            lit dans la sous-ligne et se change par le bouton de l'en-tête. */}
                        <SelectField
                            name="finance-year"
                            value={selectedYear.toString()}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            options={budgetYearOptions}
                            placeholder="Choisir un exercice"
                            className="large:hidden space-y-0"
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
                        {isCompact ? (
                            <section className="bg-inverse-surface text-inverse-on-surface rounded-card px-5 pt-[22px] pb-5">
                                <span className="block text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                                    Exercice {selectedYear} · {currentBudget.status.toLowerCase()}
                                </span>
                                {/* `.big` — **le nombre, puis l'unité à côté** : Archivo 44
                                    sur 48 pour l'un, 14 sur 20 en encre estompée pour
                                    l'autre, comme le héro de 16.1. La devise passait dans le
                                    `<b>` avec le chiffre : « XOF » s'écrivait alors en 44, et
                                    une seconde fois sous la jauge. */}
                                <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                                    <b className="font-brand text-[2.75rem] leading-[3rem] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                        {formatNumber(
                                            budgetStats.remaining,
                                            settings.compactNotation,
                                        )}
                                    </b>
                                    <span className="text-ts-sub leading-ts-sub text-[var(--tk-color-on-dark-2)]">
                                        {settings.currency}
                                    </span>
                                </div>
                                <span className="text-ts-sub leading-ts-sub mt-1 block text-[var(--tk-color-on-dark-2)]">
                                    restants sur{' '}
                                    {formatNumber(
                                        budgetStats.totalAllocated,
                                        settings.compactNotation,
                                    )}
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
                                        <div className="mt-2 flex justify-between gap-3 text-[0.75rem] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
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
                        ) : (
                            /*
                              **Au bureau, `.bande` remplace le héro** (15.1 à 1280) : le grand
                              restant en 44 est un dessin de téléphone. Quatre repères en 28 sur
                              le sombre — ce qui reste et sa jauge, ce qui est consommé, les
                              postes, les dépenses —, chacun sous sa légende en 12.
                            */
                            <section className="bg-inverse-surface text-inverse-on-surface rounded-card flex px-5 py-[18px]">
                                {[
                                    {
                                        cle: 'restant',
                                        valeur: formatNumber(
                                            budgetStats.remaining,
                                            settings.compactNotation,
                                        ),
                                        unite: settings.currency,
                                        legende: `restants sur ${formatNumber(budgetStats.totalAllocated, settings.compactNotation)}`,
                                        jauge: budgetStats.totalAllocated > 0 ? spentPercent : null,
                                    },
                                    {
                                        cle: 'consomme',
                                        valeur: `${spentPercent.toFixed(0)} %`,
                                        legende: `consommés · ${formatNumber(budgetStats.totalSpent, settings.compactNotation)}`,
                                        jauge: null,
                                    },
                                    {
                                        cle: 'postes',
                                        valeur: `${currentBudget.items.length}`,
                                        legende:
                                            enveloppesEpuisees > 0
                                                ? `postes · ${enveloppesEpuisees} enveloppe${enveloppesEpuisees > 1 ? 's' : ''} épuisée${enveloppesEpuisees > 1 ? 's' : ''}`
                                                : 'postes · aucune enveloppe épuisée',
                                        jauge: null,
                                    },
                                    {
                                        cle: 'depenses',
                                        valeur: `${financeExpenses.length}`,
                                        legende: derniereDepense
                                            ? `dépenses · dernière le ${derniereDepense}`
                                            : 'dépenses · aucune écriture',
                                        jauge: null,
                                    },
                                ].map((repere, index) => (
                                    <div
                                        key={repere.cle}
                                        className={cn(
                                            'min-w-0 flex-1 py-0.5 pr-4',
                                            index > 0 && 'pl-4',
                                        )}
                                    >
                                        <span className="font-brand text-ts-page leading-ts-page flex items-baseline gap-2 font-semibold tracking-[-0.02em] tabular-nums">
                                            {repere.valeur}
                                            {repere.unite && (
                                                <small className="text-[0.8125rem] leading-4 font-normal tracking-normal text-[var(--tk-color-on-dark-2)]">
                                                    {repere.unite}
                                                </small>
                                            )}
                                        </span>
                                        {/* `.k` — 12 sur 16. La planche l'écrit en ligne dans
                                            son lien : sa ligne prend la hauteur du corps (24),
                                            et le repère mesure 76. En bloc, l'écart se rend
                                            par la marge — 8 au lieu de 4 —, sans inventer un
                                            interligne que l'échelle n'a pas. */}
                                        <span className="mt-2 block text-[0.75rem] leading-4 text-[var(--tk-color-on-dark-2)]">
                                            {repere.legende}
                                        </span>
                                        {repere.jauge !== null && (
                                            /* `.bp` — 6 px, rayon 2, sur le voile à 12 %, bornée à 220. */
                                            <div className="mt-2.5 h-1.5 max-w-[220px] overflow-hidden rounded-xs bg-white/[0.12]">
                                                <i
                                                    className="block h-full bg-[var(--tk-color-live-vert)]"
                                                    style={{
                                                        width: `${Math.min(repere.jauge, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* **Au bureau, deux zones à 7 et 5** (15.1 à 1280) : les postes à gauche,
                            les destinations à droite. Elles s'empilaient sur toute la largeur. */}
                        <div className="large:grid large:grid-cols-[7fr_5fr] large:items-start large:gap-4 large:space-y-0 space-y-4">
                            {/* SECTION 1 : LES POSTES (PLANCHE 15.1) */}
                            {/* `.card` — **fond de surface, rayon 8, intérieur 8 / 16**, et rien
                            d'autre : ni filet ni ombre, qu'aucune planche ne déclare et
                            que les sept écrans déjà portés n'ont pas. Elle tenait 16 de
                            tous les côtés et un cadre. */}
                            {/* `.dsk .card` — `4 20 8` au bureau. */}
                            <section className="rounded-card bg-surface large:px-5 large:pt-1 large:pb-2 px-4 py-2">
                                {/* `.ch` — 48 de haut, titre **17 sur 24** en graisse d'appui,
                                le compte en 14 sur 20. Il tenait 13 px des deux côtés. */}
                                <div className="flex min-h-12 items-baseline justify-between gap-3 pt-2 pb-1">
                                    <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                                        Les postes
                                    </h3>
                                    {/* Au téléphone le compte ; au bureau, **l'en-tête de la
                                    colonne des montants** — « consommé / enveloppe ». */}
                                    <span className="text-on-surface-variant large:hidden text-ts-sub leading-ts-sub tabular-nums">
                                        {currentBudget.items.length}
                                    </span>
                                    <span className="text-on-surface-variant large:inline text-ts-sub leading-ts-sub hidden">
                                        consommé / enveloppe
                                    </span>
                                </div>
                                {/* Au bureau, **pas de filet** entre les postes (`.dsk .post`,
                                `border-top:0`) : la grille aligne, le filet ne sépare plus rien. */}
                                <div className="divide-outline-variant large:divide-y-0 divide-y">
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
                                                /* `.dsk .post` — **trois colonnes** au bureau : le
                                               nom et son restant, la jauge sur 140, les montants
                                               à droite sur 172 ; rangée de 64, `10 0`. */
                                                <div
                                                    key={idx}
                                                    className="large:grid large:grid-cols-[minmax(0,1fr)_140px_172px] large:items-center large:gap-x-4 large:gap-y-0 large:py-2.5 flex flex-col gap-2 py-3"
                                                >
                                                    {/* `.bt` — le nom en 16/24, puis **le
                                                    consommé sur l'affecté** : le premier en
                                                    encre pleine, le second en secondaire.
                                                    Il était barré (`<s>`), ce qui dit
                                                    « annulé » d'un montant qui ne l'est
                                                    pas. */}
                                                    <div className="large:contents flex items-baseline justify-between gap-3">
                                                        <span className="text-on-surface large:col-start-1 large:row-start-1 large:truncate text-ts-body leading-ts-body">
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
                                                        <span className="text-on-surface-variant large:col-start-3 large:row-span-2 large:row-start-1 large:text-right large:text-[0.8125rem] text-ts-sub leading-ts-sub whitespace-nowrap tabular-nums">
                                                            <b className="text-on-surface large:text-[0.875rem] large:leading-5 text-ts-body font-medium">
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
                                                    <div className="bg-surface-container large:col-start-2 large:row-span-2 large:row-start-1 h-1.5 overflow-hidden rounded-xs">
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
                                                    <div className="text-on-surface-variant large:col-start-1 large:row-start-2 large:-mt-0.5 flex items-center gap-2 text-[0.75rem] leading-4">
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
                                {/* **Le pied de la carte des postes** (15.1 au bureau) : une
                                    rangée de 48 qui mène aux enveloppes. Sans elle, la carte
                                    dit l'état des postes sans offrir de les corriger, et le
                                    geste ne vivait qu'au ⋮ du téléphone. */}
                                {currentBudget.items.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="text-on-surface hover:bg-surface-container large:flex -mx-2 hidden min-h-12 w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 text-left"
                                    >
                                        <span className="text-ts-body leading-ts-body min-w-0 flex-1 font-medium">
                                            Ajuster les enveloppes
                                        </span>
                                        <Icon
                                            glyph={CaretRight}
                                            size={20}
                                            className="text-text-tertiary shrink-0"
                                        />
                                    </button>
                                )}
                            </section>

                            {/* `.zcol` de 15.1 — **la colonne de droite** : où aller, puis les
                                autres exercices. Au téléphone, les deux cartes se suivent. */}
                            <div className="flex flex-col gap-4">
                                {/*
                          **« ALLER À » — deux destinations, pas un aperçu.** 15.1 :
                          *« l'accueil du domaine porte un exercice et **deux
                          destinations** : ses lignes, ses dépenses »*. La carte listait à
                          la place les trois dernières dépenses, avec un lien au bout :
                          un extrait de la page voisine, qu'il fallait lire pour découvrir
                          qu'elle existait. Les deux rangées la nomment et la comptent.
                          Au bureau, `.dsk .card` — `4 20 8`, comme la carte des postes.
                        */}
                                <section className="rounded-card bg-surface large:px-5 large:pt-1 large:pb-2 px-4 py-2">
                                    <div className="flex min-h-12 items-center pt-2 pb-1">
                                        <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                                            Aller à
                                        </h3>
                                    </div>
                                    {[
                                        {
                                            id: 'lignes',
                                            glyph: Calculator,
                                            titre: 'Les lignes du budget',
                                            detail: `${currentBudget.items.length} ligne${currentBudget.items.length > 1 ? 's' : ''} · ${formatNumber(budgetStats.totalAllocated, settings.compactNotation)} affectés`,
                                            aller: () => setIsAddBudgetModalOpen(true),
                                            bureauSeul: false,
                                        },
                                        {
                                            id: 'depenses',
                                            glyph: ListBullets,
                                            titre: 'Les dépenses',
                                            detail: `${financeExpenses.length} écriture${financeExpenses.length > 1 ? 's' : ''} · ${formatNumber(budgetStats.totalSpent, settings.compactNotation)}`,
                                            aller: () => onViewChange('finance_expenses'),
                                            bureauSeul: false,
                                        },
                                        {
                                            /* **Trois destinations au bureau** (15.1) : les
                                               rapports s'y ajoutent. Au téléphone la carte n'en
                                               porte que deux — la planche les compte ainsi, et
                                               « Plus » y mène déjà. */
                                            id: 'rapports',
                                            glyph: Export,
                                            titre: 'Les rapports',
                                            detail: '4 exports fixes',
                                            aller: () => onViewChange('reports'),
                                            bureauSeul: true,
                                        },
                                    ].map((rangee, index) => (
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
                                                'min-h-16 w-full cursor-pointer items-center gap-3 py-2 text-left',
                                                rangee.bureauSeul ? 'large:flex hidden' : 'flex',
                                                /* `.dsk .lrow` — **pas de filet au bureau**, un
                                                   fond au survol à rayon 4, rentré de 8. */
                                                'large:hover:bg-surface-container large:-mx-2 large:rounded-[4px] large:px-2',
                                                index > 0 &&
                                                    'border-outline-variant large:border-t-0 border-t',
                                            )}
                                        >
                                            <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                                <Icon glyph={rangee.glyph} size={20} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                                    {rangee.titre}
                                                </span>
                                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
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

                                {/*
                              **« EXERCICES » — la carte de droite du bureau** (15.1) : *« la
                              vue Exercices devient une carte de droite »*. Le bureau n'avait
                              que le sélecteur de l'en-tête, qui dit l'année et rien d'autre :
                              ni ce qu'un exercice clos a consommé, ni qu'un exercice à venir
                              n'a aucune ligne. L'exercice affiché n'y est pas — c'est toute
                              la page qui le porte.
                            */}
                                {autresExercices.length > 0 && (
                                    <section className="rounded-card bg-surface large:px-5 large:pt-1 large:pb-2 large:block hidden px-4 py-2">
                                        <div className="flex min-h-12 items-center gap-3 pt-2 pb-1">
                                            <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 font-medium">
                                                Exercices
                                            </h3>
                                            {exercicesClos > 0 && (
                                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                                                    {exercicesClos} clos
                                                </span>
                                            )}
                                        </div>
                                        {autresExercices.map((exercice) => (
                                            <button
                                                key={exercice.year}
                                                type="button"
                                                onClick={() => setSelectedYear(exercice.year)}
                                                className={cn(
                                                    'hover:bg-surface-container -mx-2 flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-[4px] px-2 py-2 text-left',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                                                        exercice.aProjeter
                                                            ? 'bg-tint-ambre text-on-tint-ambre'
                                                            : 'bg-surface-container text-on-surface-variant',
                                                    )}
                                                >
                                                    <Icon
                                                        glyph={
                                                            exercice.aProjeter
                                                                ? CalendarPlus
                                                                : LockSimple
                                                        }
                                                        size={20}
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                                        Exercice {exercice.year}
                                                    </span>
                                                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                                        {exercice.detail}
                                                    </span>
                                                </span>
                                                <Icon
                                                    glyph={CaretRight}
                                                    size={20}
                                                    className="text-text-tertiary shrink-0"
                                                />
                                            </button>
                                        ))}
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </Reading>
            </PageContainer>
        </div>
    );
};

export default FinanceManagementPage;
