import React, { useEffect, useMemo, useState } from 'react';
import {
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
import FlecheDeRetour from '../../../components/ui/FlecheDeRetour';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { exerciceParDefaut, formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { FinanceBudgetItem, ViewType } from '../../../types';
import FeuilleDesExercices from '../components/FeuilleDesExercices';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';
import FinanceKpiTiles from '../components/FinanceKpiTiles';
import MonthlySpendChart from '../components/MonthlySpendChart';
import ListActionFab from '../../../components/ui/ListActionFab';
import { useAccessControl } from '../../../hooks/useAccessControl';
import NatureBadge from '../components/NatureBadge';
import { useEntree } from '../../../hooks/useEntree';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import ChiffreAjuste from '../../../components/ui/ChiffreAjuste';
import PartDesPostes from '../components/PartDesPostes';
import { JAUGE, JAUGE_RANGEE } from '../../../lib/jauge';

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
/** Les postes montrés sur l'accueil du domaine ; le reste s'ouvre en entier. Six depuis le 25/09. */
const POSTES_MONTRES = 6;

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
    /* Les cartes de Finances entrent en cascade à l'arrivée (26/09). */
    const entree = useEntree();
    const isCompact = useMediaQuery(MEDIA.compact);
    /* Le geste flottant n'est offert qu'à qui peut écrire une dépense. */
    const { permissions } = useAccessControl();
    const canManageFinance = permissions.canManageFinance;
    const { settings } = useData();
    const { financeExpenses, financeBudgets } = useFinanceData();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

    /* L'exercice demandé par l'adresse (`/finance?annee=2025`, depuis « Exercices »), sinon
       celui de l'année (`exerciceParDefaut`). */
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        const requete = window.location.hash.split('?')[1];
        const annee = requete ? Number(new URLSearchParams(requete).get('annee')) : NaN;
        return Number.isInteger(annee) && annee > 1900
            ? annee
            : (exerciceParDefaut(financeBudgets) ?? new Date().getFullYear());
    });
    /**
     * 15.1, colonne 3 — « Exercices », où l'on change d'année et en ouvre une : **une
     * feuille sur cette page** depuis le 09/10, plus un écran. L'ancienne adresse
     * (`/finance/exercices`) l'ouvre d'emblée.
     */
    const [exercicesOuverts, setExercicesOuverts] = useState(() =>
        window.location.hash.startsWith('#/finance/exercices'),
    );
    const ouvrirLesExercices = () => setExercicesOuverts(true);
    /* L'adresse peut arriver alors que la page est déjà là : elle ouvre aussi la feuille. */
    useEffect(() => {
        const surAdresse = () => {
            if (window.location.hash.startsWith('#/finance/exercices')) setExercicesOuverts(true);
        };
        window.addEventListener('hashchange', surAdresse);
        return () => window.removeEventListener('hashchange', surAdresse);
    }, []);

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === selectedYear)) {
            setSelectedYear(exerciceParDefaut(financeBudgets) ?? financeBudgets[0].year);
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

    /** Les mois vécus de l'exercice regardé : 12 s'il est passé, 0 s'il est à venir. */
    const moisVecus = useMemo(() => {
        const maintenant = new Date();
        if (selectedYear < maintenant.getFullYear()) return 12;
        if (selectedYear > maintenant.getFullYear()) return 0;
        return maintenant.getMonth() + 1;
    }, [selectedYear]);

    /** Les postes, **les plus entamés d'abord** — ce sont eux qui demandent un regard. */
    const postesParEntame = useMemo(
        () =>
            [...currentBudget.items].sort(
                (a, b) =>
                    (b.allocated > 0 ? b.spent / b.allocated : 0) -
                    (a.allocated > 0 ? a.spent / a.allocated : 0),
            ),
        [currentBudget.items],
    );
    /* **Trois postes au téléphone, six au bureau** (23/09 : « on ne peut pas lister autant
       de postes en mobile » ; huit ramenés à six le 25/09) — les plus entamés ; le reste vit
       sur « Lignes du budget ». */
    const postesMax = isCompact ? 3 : POSTES_MONTRES;
    const postesTronques = postesParEntame.length > postesMax;
    const postesMontres = postesParEntame.slice(0, postesMax);
    const plusEntame =
        postesParEntame[0] && postesParEntame[0].allocated > 0
            ? {
                  category: postesParEntame[0].category,
                  percent: (postesParEntame[0].spent / postesParEntame[0].allocated) * 100,
              }
            : null;

    /** 15.2 — ajuster les enveloppes de l'exercice regardé, sur sa page. La boîte
        « Définir le budget » reste le chemin d'un **nouvel** exercice (et de l'import). */
    const ouvrirLesLignes = () => {
        window.location.hash = `/finance/lines/${selectedYear}`;
    };

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
            <FeuilleDesExercices
                open={exercicesOuverts}
                onClose={() => setExercicesOuverts(false)}
                anneeAffichee={selectedYear}
                onChoisir={setSelectedYear}
            />
            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
                budgetItems={currentBudget.items}
            />

            {/* **Le geste de la page, flottant, au téléphone** (25/09) : « Enregistrer une
                dépense » ne vivait que dans le ⋮. C'est l'acte pour lequel on ouvre les
                finances en déplacement ; il prend l'ancrage des gestes d'ajout (17.6). Au
                bureau, il est déjà un bouton de l'en-tête. */}
            {isCompact && canManageFinance && (
                <ListActionFab
                    label="dépense"
                    actions={[
                        {
                            id: 'depense',
                            label: 'Enregistrer une dépense',
                            icon: 'add',
                            onSelect: () => setIsAddExpenseModalOpen(true),
                        },
                    ]}
                />
            )}

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
                                : 'bg-background -mt-page pt-5',
                        )}
                    >
                        <div
                            className={cn(
                                'flex items-center gap-1',
                                isCompact ? 'min-h-12' : 'min-h-[52px]',
                            )}
                        >
                            {/* `.tt` de 15.1 ouvre sur `.tb` — **la flèche de retour**, que la
                                page n'avait pas : atteinte depuis « Plus », elle ne se
                                quittait que par la barre du bas. Au bureau, 15.1 n'en dessine
                                pas : la barre latérale mène déjà partout. */}
                            {onBack && (
                                <FlecheDeRetour
                                    onBack={onBack}
                                    compact={isCompact}
                                    /* 8 jusqu'au titre, comme les listes : la rangée n'en met que 4. */
                                    className={isCompact ? undefined : 'mr-1'}
                                />
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
                                <p className="text-on-surface-variant text-ts-body leading-ts-body deux:block mt-0.5 hidden">
                                    Exercice {selectedYear} · {currentBudget.status.toLowerCase()} ·
                                    au {currentFrenchDate}
                                </p>
                            </div>

                            {/* **Les deux gestes passent dans l'en-tête au bureau** (15.1) :
                                « Changer d'exercice » — le sélecteur du téléphone devient un
                                menu ancré à son bouton — et « Enregistrer une dépense », le
                                geste jaune. Au téléphone ils restent au ⋮ : *« trois contrôles
                                empilés repousseraient le héro sous la ligne de flottaison »*. */}
                            {/* « Changer d'exercice » ouvre l'écran « Exercices » (15.1) : on y
                                change d'année, et on y en ouvre une (24/09). */}
                            <Button
                                variant="text"
                                onClick={ouvrirLesExercices}
                                className="border-outline-variant bg-surface text-on-surface hover:bg-surface-container deux:inline-flex doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control hidden h-10 min-h-10 shrink-0 gap-2 !rounded-[4px] border px-3 text-[0.875rem] font-medium !shadow-none"
                                icon={<Icon glyph={CalendarBlank} size={20} />}
                            >
                                Changer d’exercice
                            </Button>
                            <Button
                                variant="filled"
                                onClick={() => setIsAddExpenseModalOpen(true)}
                                icon={<Icon glyph={Plus} size={20} />}
                                className="deux:inline-flex doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control hidden h-10 min-h-10 shrink-0 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium shadow-none"
                            >
                                Enregistrer une dépense
                            </Button>
                            <Menu
                                align="end"
                                /* Le ⋮ du téléphone : au bureau, ses deux verbes sont des
                                   boutons. */
                                items={[
                                    /* 15.2 : ajuster les lignes a sa page ; la boîte ne sert
                                       plus qu'à ouvrir un exercice (saisi ou importé). */
                                    {
                                        id: 'lignes',
                                        label: 'Ajuster les enveloppes',
                                        description: 'les lignes du budget de l’exercice',
                                        onSelect: ouvrirLesLignes,
                                    },
                                    {
                                        id: 'exercices',
                                        label: 'Les exercices',
                                        description: 'changer d’année, ouvrir la suivante',
                                        onSelect: ouvrirLesExercices,
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
                                        className="text-on-surface hover:bg-surface-container deux:hidden shrink-0 rounded-md"
                                    >
                                        <Icon glyph={DotsThreeVertical} size="geste" />
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </IconGestureSizeContext.Provider>

                {/* **Une seule largeur de lecture — 960 px** (§2.43). */}
                <Reading>
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
                            <section className="bg-inverse-surface text-inverse-on-surface rounded-card @container px-5 pt-[22px] pb-5">
                                {/* **Changer d'exercice, depuis le héro** (23/09) — 15.1 en fait
                                    un geste du héro. Le sélecteur pleine largeur posé sous le
                                    titre (« 2026 (En cours) ») faisait une barre de plus dans
                                    l'en-tête fixe pour un geste rare. Le surtitre devient une
                                    pastille qui ouvre l'écran « Exercices » (24/09). */}
                                {/* **Le fait à gauche, le geste à droite** (24/09). La pastille
                                    en capitales espacées « EXERCICE 2026 · EN COURS › » mêlait
                                    l'étiquette et l'acte : on ne savait pas si elle se lisait ou
                                    se touchait. L'exercice s'écrit en casse de phrase avec son
                                    statut en point de couleur ; « Changer » est un bouton. */}
                                <div className="-mt-1.5 flex items-center justify-between gap-3">
                                    <span className="text-ts-sub leading-ts-sub flex min-w-0 items-center gap-2">
                                        <b className="text-inverse-on-surface font-medium whitespace-nowrap">
                                            Exercice {selectedYear}
                                        </b>
                                        {/* L'ellipse se pose sur le mot, pas sur la rangée : une
                                            boîte `flex` coupe sans points de suspension, et
                                            « en cours » finissait en « en c » à 320 (07/10). */}
                                        <span className="flex min-w-0 items-center gap-1.5 text-[var(--tk-color-on-dark-2)]">
                                            <i
                                                className={cn(
                                                    'h-1.5 w-1.5 shrink-0 rounded-full',
                                                    currentBudget.status === 'En cours'
                                                        ? 'bg-[var(--tk-color-live-vert)]'
                                                        : 'bg-[var(--tk-color-on-dark-2)]',
                                                )}
                                            />
                                            <span className="truncate">
                                                {currentBudget.status.toLowerCase()}
                                            </span>
                                        </span>
                                    </span>
                                    <Button
                                        variant="text"
                                        onClick={ouvrirLesExercices}
                                        aria-label={`Changer d'exercice — ${selectedYear}`}
                                        icon={<Icon glyph={CalendarBlank} size={18} />}
                                        className="text-inverse-on-surface hover:text-inverse-on-surface h-8 min-h-8 shrink-0 gap-1.5 rounded-md bg-white/10 px-2.5 text-[0.8125rem] leading-4 font-medium hover:bg-white/15"
                                    >
                                        {/* Sous 360 px, le calendrier seul : le mot prenait la
                                            place du statut de l'exercice. Le nom du geste
                                            reste dit par `aria-label`. */}
                                        <span className="exigu:sr-only">Changer</span>
                                    </Button>
                                </div>
                                {/* `.big` — **le nombre, puis l'unité à côté** : Archivo 44
                                    sur 48 pour l'un, 14 sur 20 en encre estompée pour
                                    l'autre, comme le héro de 16.1. La devise passait dans le
                                    `<b>` avec le chiffre : « XOF » s'écrivait alors en 44, et
                                    une seconde fois sous la jauge. */}
                                <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                                    <b className="font-brand text-[2.5rem] leading-[3rem] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                        {/* Le reste d'un exercice à dix chiffres ne tient pas en
                                            40 sur 248 px : il descend juste assez, et laisse sa
                                            place à la devise (07/10). */}
                                        <ChiffreAjuste
                                            texte={formatNumber(
                                                budgetStats.remaining,
                                                settings.compactNotation,
                                            )}
                                            reserve="3rem"
                                        >
                                            <ChiffreAnime
                                                valeur={formatNumber(
                                                    budgetStats.remaining,
                                                    settings.compactNotation,
                                                )}
                                            />
                                        </ChiffreAjuste>
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
                                        <div
                                            className={cn(
                                                'mt-5 overflow-hidden bg-white/[0.12]',
                                                JAUGE,
                                            )}
                                        >
                                            <i
                                                className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-live-vert)] transition-[width]"
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
                                {/* Les deux chiffres des tuiles du bureau, dans le voile : ce qui
                                    est parti, et à quelle allure (23/09). */}
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        {
                                            cle: 'consomme',
                                            valeur: formatNumber(
                                                budgetStats.totalSpent,
                                                settings.compactNotation,
                                            ),
                                            libelle: 'consommés',
                                        },
                                        {
                                            cle: 'moyenne',
                                            valeur:
                                                moisVecus > 0
                                                    ? formatNumber(
                                                          Math.round(
                                                              budgetStats.totalSpent / moisVecus,
                                                          ),
                                                          settings.compactNotation,
                                                      )
                                                    : '—',
                                            libelle: 'par mois en moyenne',
                                        },
                                    ].map((chiffre) => (
                                        <div
                                            key={chiffre.cle}
                                            className="@container min-w-0 rounded-[4px] bg-white/[0.08] px-2.5 py-3"
                                        >
                                            <span className="font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] tabular-nums">
                                                <ChiffreAjuste texte={chiffre.valeur} />
                                            </span>
                                            <span className="mt-0.5 block truncate text-[0.75rem] leading-4 text-[var(--tk-color-on-dark-2)]">
                                                {chiffre.libelle}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            /*
                              **Au bureau, la bande éclate en quatre tuiles** (23/09) : ce qui
                              reste, ce qui est consommé, la moyenne mensuelle et ce qu'elle
                              donne en fin d'année, les postes. La bande sombre de 15.1 les
                              tenait sur un seul aplat, serrés comme une phrase.
                            */
                            <FinanceKpiTiles
                                remaining={budgetStats.remaining}
                                allocated={budgetStats.totalAllocated}
                                spent={budgetStats.totalSpent}
                                percent={spentPercent}
                                currency={settings.currency}
                                compactNotation={settings.compactNotation}
                                dateLabel={currentFrenchDate}
                                monthsElapsed={moisVecus}
                                postes={currentBudget.items.length}
                                epuisees={enveloppesEpuisees}
                                plusEntame={plusEntame}
                            />
                        )}

                        {/* **Au bureau, deux zones à 7 et 5** (15.1 à 1280) : les postes à gauche,
                            les destinations à droite. Elles s'empilaient sur toute la largeur. */}
                        {/* **Les deux zones vont à même hauteur** (23/09) : à `items-start`,
                            la colonne de droite s'arrêtait 120 px avant celle de gauche, et
                            « Exercices » flottait en carte courte au milieu du canevas. */}
                        {/* **Une grille de 12 au bureau** (23/09) : l'histogramme (8) et
                            « Aller à » (4) sur la première rangée, les postes (8) et les
                            exercices (4) sur la seconde. Au téléphone, une colonne dont
                            l'ordre est porté par `order` : les postes d'abord, comme avant. */}
                        <div
                            className={cn(
                                'deux:grid deux:grid-cols-12 deux:items-stretch deux:gap-4 flex flex-col gap-4',
                                entree && 'mvt-cascade-cartes',
                            )}
                        >
                            <MonthlySpendChart
                                className="deux:order-none deux:col-span-8 deux:row-start-1 order-3"
                                expenses={financeExpenses}
                                year={selectedYear}
                                allocated={budgetStats.totalAllocated}
                                currency={settings.currency}
                                compactNotation={settings.compactNotation}
                            />

                            {/* SECTION 1 : LES POSTES (PLANCHE 15.1) */}
                            {/* `.card` — **fond de surface, rayon 8, intérieur 8 / 16**, et rien
                            d'autre : ni filet ni ombre, qu'aucune planche ne déclare et
                            que les sept écrans déjà portés n'ont pas. Elle tenait 16 de
                            tous les côtés et un cadre. */}
                            {/* `.dsk .card` — `4 20 8` au bureau. */}
                            <section className="rounded-card bg-surface deux:order-none deux:col-span-8 deux:row-start-2 deux:flex deux:min-h-0 deux:flex-col deux:pt-1 deux:pb-2 order-2 px-4 py-2">
                                {/* `.ch` — 48 de haut, titre **17 sur 24** en graisse d'appui,
                                le compte en 14 sur 20. Il tenait 13 px des deux côtés. */}
                                <div className="flex min-h-12 items-baseline justify-between gap-3 pt-2 pb-1">
                                    <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                                        Les postes
                                    </h3>
                                    {/* Au téléphone le compte ; au bureau, **l'en-tête de la
                                    colonne des montants** — « consommé / enveloppe ». */}
                                    <span className="text-on-surface-variant deux:hidden text-ts-sub leading-ts-sub tabular-nums">
                                        {postesTronques
                                            ? `les ${postesMax} plus entamés`
                                            : currentBudget.items.length}
                                    </span>
                                    <span className="text-on-surface-variant deux:inline text-ts-sub leading-ts-sub hidden">
                                        {postesTronques
                                            ? `les ${postesMax} plus entamés sur ${currentBudget.items.length} · consommé / enveloppe`
                                            : 'consommé / enveloppe'}
                                    </span>
                                </div>
                                {/* Au bureau, **pas de filet** entre les postes (`.dsk .post`,
                                `border-top:0`) : la grille aligne, le filet ne sépare plus rien. */}
                                {/* Les postes défilent **dans la carte** : douze enveloppes ne
                                    rallongent plus la page, et le pied reste au pied. */}
                                <div className="divide-outline-variant deux:min-h-0 deux:flex-1 deux:divide-y-0 deux:overflow-y-auto divide-y">
                                    {currentBudget.items.length > 0 ? (
                                        postesMontres.map((item, idx) => {
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
                                                    className="deux:grid deux:grid-cols-[minmax(0,1fr)_140px_172px] deux:items-center deux:gap-x-4 deux:gap-y-0 deux:py-2.5 flex flex-col gap-3 py-4"
                                                >
                                                    {/* `.bt` — le nom en 16/24, puis **le
                                                    consommé sur l'affecté** : le premier en
                                                    encre pleine, le second en secondaire.
                                                    Il était barré (`<s>`), ce qui dit
                                                    « annulé » d'un montant qui ne l'est
                                                    pas. */}
                                                    {/* **Les montants passent sous le nom s'ils ne tiennent
                                                    pas à côté** (07/10) : « 13 050 000 / 12 000 000 »
                                                    ne se coupe pas, et sortait de la carte de 29 px
                                                    à 320. Le nom demande 112 px ; quand la rangée
                                                    ne les a pas, elle se replie. */}
                                                    <div className="deux:contents flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                                        <span className="text-on-surface deux:col-start-1 deux:row-start-1 deux:truncate text-ts-body leading-ts-body min-w-0 flex-[1_1_7rem]">
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
                                                        <span className="text-on-surface-variant deux:col-start-3 deux:row-span-2 deux:row-start-1 deux:text-right deux:text-[0.8125rem] text-ts-sub leading-ts-sub whitespace-nowrap tabular-nums">
                                                            <b className="text-on-surface deux:text-[0.875rem] deux:leading-5 text-ts-body font-medium">
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
                                                    <div
                                                        className={cn(
                                                            'bg-surface-container deux:col-start-2 deux:row-span-2 deux:row-start-1 overflow-hidden',
                                                            JAUGE_RANGEE,
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
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
                                                    <div className="text-on-surface-variant deux:col-start-1 deux:row-start-2 deux:-mt-0.5 flex items-center gap-2 text-[0.75rem] leading-4">
                                                        {/* Une ligne qui ne porte pas son classement **n'affiche rien** : un
                                                        blanc se remarque et se corrige, une supposition se recopie
                                                        dans le rapport de clôture (15.1). */}
                                                        {/* `.tag` — 20 de haut, rayon 4, teinté par
                                                            la nature (24/09). */}
                                                        <NatureBadge nature={classification} />
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
                                        /* Un vide de carte, jamais une ligne de 12 sous le
                                           titre (22/09) — relevé le 25/09. */
                                        <CardEmptyState
                                            glyph={Calculator}
                                            title="Aucun poste pour cet exercice"
                                            description="Les enveloppes se posent dans les lignes du budget."
                                        />
                                    )}
                                </div>
                                {/* **Le pied de la carte des postes** (15.1 au bureau) : une
                                    rangée de 48 qui mène aux enveloppes. Sans elle, la carte
                                    dit l'état des postes sans offrir de les corriger, et le
                                    geste ne vivait qu'au ⋮ du téléphone. */}
                                {postesTronques && (
                                    /* **Six postes, pas davantage** (23/09 : « la liste des
                                       postes est trop longue » ; six depuis le 25/09) — les plus
                                       entamés, ceux qui demandent un regard. Le reste est à un
                                       geste. */
                                    <button
                                        type="button"
                                        onClick={ouvrirLesLignes}
                                        className="border-outline-variant text-on-surface hover:bg-surface-container deux:-mx-2 deux:rounded-[4px] deux:border-t-0 deux:px-2 flex min-h-12 w-full shrink-0 cursor-pointer items-center gap-2 border-t text-left"
                                    >
                                        <span className="text-ts-body leading-ts-body min-w-0 flex-1 font-medium">
                                            Voir les {currentBudget.items.length} postes
                                        </span>
                                        <Icon
                                            glyph={CaretRight}
                                            size={20}
                                            className="text-text-tertiary shrink-0"
                                        />
                                    </button>
                                )}
                                {currentBudget.items.length > 0 && !postesTronques && (
                                    <button
                                        type="button"
                                        onClick={ouvrirLesLignes}
                                        className="text-on-surface hover:bg-surface-container deux:mt-auto deux:flex -mx-2 hidden min-h-12 w-full shrink-0 cursor-pointer items-center gap-2 rounded-[4px] px-2 text-left"
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

                            {/* `.zcol` de 15.1 — où aller, puis les autres exercices : deux
                                cartes placées chacune dans sa rangée de la grille. */}
                            {/*
                          **« ALLER À » — deux destinations, pas un aperçu.** 15.1 :
                          *« l'accueil du domaine porte un exercice et **deux
                          destinations** : ses lignes, ses dépenses »*. La carte listait à
                          la place les trois dernières dépenses, avec un lien au bout :
                          un extrait de la page voisine, qu'il fallait lire pour découvrir
                          qu'elle existait. Les deux rangées la nomment et la comptent.
                          Au bureau, `.dsk .card` — `4 20 8`, comme la carte des postes.
                        */}
                            {/* La colonne de droite : où aller, puis **la part de chaque poste** (27/09) — les
                                types de dépense et leur part de l'enveloppe (`PartDesPostes`). Elle
                                occupe la place que « Aller à » laissait vide à côté de
                                l'histogramme. Au bureau seulement. */}
                            <div className="deux:order-none deux:col-span-4 deux:row-start-1 order-1 flex flex-col gap-4">
                                <section className="rounded-card bg-surface deux:pt-1 deux:pb-2 px-4 py-2">
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
                                            aller: ouvrirLesLignes,
                                            bureauSeul: false,
                                        },
                                        {
                                            id: 'depenses',
                                            glyph: ListBullets,
                                            titre: 'Les dépenses',
                                            /* La date de la dernière écriture vivait dans la bande sombre ; elle
                                               revient ici, à côté du journal qu'elle date. */
                                            detail: `${financeExpenses.length} écriture${financeExpenses.length > 1 ? 's' : ''}${derniereDepense ? ` · dernière le ${derniereDepense}` : ''}`,
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
                                                rangee.bureauSeul ? 'deux:flex hidden' : 'flex',
                                                /* `.dsk .lrow` — **pas de filet au bureau**, un
                                                   fond au survol à rayon 4, rentré de 8. */
                                                'deux:hover:bg-surface-container deux:-mx-2 deux:rounded-[4px] deux:px-2',
                                                index > 0 &&
                                                    'border-outline-variant deux:border-t-0 border-t',
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
                                <section className="rounded-card bg-surface expanded:block deux:pt-1 deux:pb-2 hidden px-4 py-2">
                                    <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                                        <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                                            Par poste
                                        </h3>
                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub">
                                            part de l’enveloppe
                                        </span>
                                    </div>
                                    <PartDesPostes postes={currentBudget.items} max={4} />
                                </section>
                            </div>

                            {/*
                              **« EXERCICES » — la carte de droite du bureau** (15.1) : *« la
                              vue Exercices devient une carte de droite »*. Le bureau n'avait
                              que le sélecteur de l'en-tête, qui dit l'année et rien d'autre :
                              ni ce qu'un exercice clos a consommé, ni qu'un exercice à venir
                              n'a aucune ligne. L'exercice affiché n'y est pas — c'est toute
                              la page qui le porte.
                            */}
                            {autresExercices.length > 0 && (
                                <section className="rounded-card bg-surface deux:order-none deux:col-span-4 deux:row-start-2 deux:flex deux:min-h-0 deux:flex-col deux:pt-1 deux:pb-2 order-4 hidden px-4 py-2">
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
                </Reading>
            </PageContainer>
        </div>
    );
};

export default FinanceManagementPage;
