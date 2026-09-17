import React, { useEffect, useMemo, useState } from 'react';
import { DotsThreeVertical, ListBullets } from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import ScreenState from '../../../components/ui/ScreenState';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import type { FinanceExpense, FinanceExpenseType } from '../../../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import { useBudgetExercise } from '../hooks/useBudgetExercise';
import { useExpenseActions } from '../hooks/useExpenseActions';
import { EXPENSE_TYPE_LABELS, getExpenseStatusLabel } from '../lib/expensePresentation';

interface ExpenseJournalPageProps {
    onBack: () => void;
}

/** Les cinq natures de dépense, dans l'ordre où la feuille de filtre les pose. */
const NATURES: readonly FinanceExpenseType[] = [
    'Purchase',
    'License',
    'Maintenance',
    'Service',
    'Cloud',
];

type PeriodeId = 'exercice' | 'trimestre' | 'mois';

const PERIODES: readonly { id: PeriodeId; label: string }[] = [
    { id: 'exercice', label: 'Exercice' },
    { id: 'trimestre', label: 'Ce trimestre' },
    { id: 'mois', label: 'Ce mois' },
];

/** « Août 2026 » — l'en-tête d'une carte de mois. */
const titreDuMois = (iso: string): string =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(iso));

/** « 6 août » — la date d'une écriture, sans son année : la carte la porte. */
const jourEtMois = (iso: string): string =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(iso));

/**
 * `.vig` — **deux lettres du fournisseur**, comme « DL » pour Dell Technologies et
 * « MS » pour Microsoft : un seul mot donne ses deux premières lettres, sinon la
 * vignette d'un fournisseur en un mot n'en porterait qu'une, seule au milieu de 40.
 */
const initiales = (nom: string): string => {
    const mots = (nom || '').split(/[\s-]+/).filter(Boolean);
    if (mots.length === 0) return '?';
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
    return (mots[0][0] + mots[1][0]).toUpperCase();
};

const cleDuMois = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * **Le journal des dépenses — 15.3, « Vue — le journal des dépenses ».**
 *
 * L'historique de ce qui a consommé l'enveloppe, **groupé par mois avec le total du
 * mois**. Chaque rangée ouvre sa dépense ; son ⋮ voit la facture ou supprime.
 *
 * Il portait la page d'avant les planches : un fil d'Ariane « Finances » au-dessus d'un
 * titre de 30, une carte nommée « Historique des Transactions », un tableau à sept
 * colonnes caché sous 600 et, en dessous, une liste de cartes qui redisait les mêmes
 * faits dans une autre grammaire — deux corps pour une liste, aucune recherche, aucun
 * filtre, aucun mois. Il prend ici le gabarit des huit listes (17.8), celui que
 * l'Historique (18.1) emploie déjà pour la même forme : *un journal groupé par période,
 * avec le total de la période en tête de carte.*
 *
 * ## Trois écarts avec la planche, et pourquoi
 *
 * **Le poste ne filtre pas.** 15.3 pose trois axes — poste, nature, période. Une dépense
 * du produit **ne porte pas de poste** : le panneau de détail le *devine* aujourd'hui,
 * en cherchant la ligne de budget dont le type coïncide. Or 15.1 a précisément fait
 * tomber la devinette (« un chiffre deviné ne se présente pas comme un chiffre su ») ;
 * un filtre bâti dessus compterait faux. L'axe reviendra avec le lien, pas avant.
 *
 * **La rangée ne redit pas « Modifier ».** Le ⋮ de la planche l'y met ; la colonne
 * suivante de la même planche le met aussi dans le héro de la dépense ouverte, où le
 * produit le porte déjà. Deux chemins vers le même formulaire n'en font pas un meilleur.
 *
 * **Les trois chemins du bouton flottant** — photographier, importer, saisir — sont les
 * **deux modes** de la feuille d'enregistrement (« scan » et « saisie ») : au téléphone,
 * photographier et importer ouvrent le même sélecteur de fichier.
 */
const ExpenseJournalPage: React.FC<ExpenseJournalPageProps> = ({ onBack }) => {
    const { settings } = useData();
    const { financeExpenses, financeBudgets } = useFinanceData();
    const { requestExpenseDeletion, previewSourceFile } = useExpenseActions();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const [filtreOuvert, setFiltreOuvert] = useState(false);
    const [recherche, setRecherche] = useState('');
    const [naturesActives, setNaturesActives] = useState<FinanceExpenseType[]>([]);
    const [periode, setPeriode] = useState<PeriodeId>('exercice');
    const recherchee = useDebounce(recherche, 200);

    const [exerciseYear, setExerciseYear] = useState<number>(
        () => financeBudgets[0]?.year || new Date().getFullYear(),
    );

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === exerciseYear)) {
            setExerciseYear(financeBudgets[0].year);
        }
    }, [financeBudgets, exerciseYear]);

    const { currentBudget } = useBudgetExercise(exerciseYear);

    /** Les écritures de l'exercice — le périmètre dont le héro rend compte. */
    const deLExercice = useMemo(
        () =>
            financeExpenses
                .filter((exp) => new Date(exp.date).getFullYear() === exerciseYear)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [financeExpenses, exerciseYear],
    );

    const consomme = useMemo(
        () => deLExercice.reduce((somme, exp) => somme + exp.amount, 0),
        [deLExercice],
    );

    const dansLaPeriode = useMemo(() => {
        if (periode === 'exercice') return deLExercice;
        const now = new Date();
        const debut =
            periode === 'mois'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return deLExercice.filter((exp) => new Date(exp.date) >= debut);
    }, [deLExercice, periode]);

    const comptesParNature = useMemo(() => {
        const compte = new Map<FinanceExpenseType, number>();
        for (const exp of dansLaPeriode) {
            compte.set(exp.type, (compte.get(exp.type) ?? 0) + 1);
        }
        return compte;
    }, [dansLaPeriode]);

    const affichees = useMemo(() => {
        const terme = recherchee.trim().toLowerCase();
        return dansLaPeriode.filter((exp) => {
            if (naturesActives.length > 0 && !naturesActives.includes(exp.type)) return false;
            if (!terme) return true;
            return [exp.supplier, exp.invoiceNumber, exp.description]
                .filter(Boolean)
                .some((champ) => String(champ).toLowerCase().includes(terme));
        });
    }, [dansLaPeriode, naturesActives, recherchee]);

    /** Les mois, du plus récent au plus ancien, avec le total de chacun. */
    const parMois = useMemo(() => {
        const groupes = new Map<string, FinanceExpense[]>();
        for (const exp of affichees) {
            const cle = cleDuMois(exp.date);
            const liste = groupes.get(cle);
            if (liste) liste.push(exp);
            else groupes.set(cle, [exp]);
        }
        return [...groupes.entries()];
    }, [affichees]);

    const filtresPoses = (naturesActives.length > 0 ? 1 : 0) + (periode !== 'exercice' ? 1 : 0);

    const ouvrirLaFacture = (exp: FinanceExpense) => {
        void previewSourceFile(exp);
    };

    return (
        <>
            <AddExpenseModal
                isOpen={isAddExpenseModalOpen}
                onClose={() => setIsAddExpenseModalOpen(false)}
            />
            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
                budgetItems={currentBudget.items}
            />

            <ListTemplate
                /* Une file d'écritures — squelette de file (17.3, A2). */
                skeleton="file"
                /* Le corps apporte ses propres cartes : une par mois. */
                body="cartes"
                title="Dépenses"
                onBack={onBack}
                search={{
                    value: recherche,
                    onChange: setRecherche,
                    placeholder: 'Fournisseur, facture, objet',
                }}
                filter={
                    <FilterButton
                        label="Filtrer les dépenses"
                        count={filtresPoses}
                        onClick={() => setFiltreOuvert(true)}
                    />
                }
                /*
                  **Le compte ne s'écrit que s'il diffère de celui du héro.** 15.3 ne
                  dessine pas de ligne de service : le héro dit déjà « consommés en 47
                  écritures ». Dès qu'un filtre ou une recherche restreint la liste, la
                  ligne revient — et dit alors le rapport, « 6 des 47 ».
                */
                count={
                    affichees.length !== deLExercice.length
                        ? {
                              total: affichees.length,
                              de: deLExercice.length,
                              noun: 'écritures',
                              regard: <>Dépenses filtrées · les plus récentes</>,
                          }
                        : undefined
                }
                hero={
                    /* `.hero` de 15.3 — le consommé de l'exercice, que le filtre ne
                       touche pas : ce qu'il annonce est le fait de l'exercice. */
                    <section className="bg-inverse-surface text-inverse-on-surface rounded-card px-5 pt-[22px] pb-5">
                        <span className="block text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                            Consommé à ce jour
                        </span>
                        <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                            <b className="font-brand text-[44px] leading-[48px] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                {formatNumber(consomme, settings.compactNotation)}
                            </b>
                            <span className="text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                                {settings.currency}
                            </span>
                        </div>
                        <span className="mt-1 block text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                            consommés en {deLExercice.length} écriture
                            {deLExercice.length > 1 ? 's' : ''} · exercice {exerciseYear}
                        </span>
                    </section>
                }
                pageAction={{
                    label: 'Enregistrer',
                    description: 'Enregistrer une dépense',
                    onClick: () => setIsAddExpenseModalOpen(true),
                }}
                hasRows={parMois.length > 0}
                empty={
                    <ScreenState
                        icon={ListBullets}
                        title={
                            filtresPoses > 0 || recherchee
                                ? 'Aucune écriture ne correspond'
                                : "Aucune dépense sur l'exercice"
                        }
                        description={
                            filtresPoses > 0 || recherchee
                                ? 'Élargissez la période, ou changez de nature.'
                                : "Le journal se remplit à mesure que des factures sont enregistrées : chacune consomme l'enveloppe d'un poste."
                        }
                        actions={
                            filtresPoses > 0 || recherchee ? (
                                <Button
                                    variant="tonal"
                                    onClick={() => {
                                        setNaturesActives([]);
                                        setPeriode('exercice');
                                        setRecherche('');
                                    }}
                                >
                                    Voir tout le journal
                                </Button>
                            ) : (
                                <Button
                                    variant="filled"
                                    onClick={() => setIsAddExpenseModalOpen(true)}
                                >
                                    Enregistrer une dépense
                                </Button>
                            )
                        }
                    />
                }
            >
                {parMois.map(([cle, ecritures]) => {
                    const totalDuMois = ecritures.reduce((somme, exp) => somme + exp.amount, 0);
                    return (
                        /* `.card` — **un mois, une carte** : surface, rayon 8, intérieur
                           8 / 16, et 16 entre deux mois. */
                        <section key={cle} className="rounded-card bg-surface px-4 py-2">
                            {/* `.ch` — le mois et **son total**, 17 sur 24 en graisse
                                d'appui, le total en 14 sur 20 à droite. */}
                            <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                                <h3 className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium first-letter:uppercase">
                                    {titreDuMois(ecritures[0].date)}
                                </h3>
                                <span className="text-on-surface-variant shrink-0 text-[14px] leading-5 tabular-nums">
                                    {formatNumber(totalDuMois, settings.compactNotation)}
                                </span>
                            </div>
                            {ecritures.map((exp, index) => {
                                const nature = EXPENSE_TYPE_LABELS[exp.type].toLowerCase();
                                const complement = exp.invoiceNumber || exp.description?.trim();
                                const etat =
                                    exp.status === 'Paid'
                                        ? undefined
                                        : getExpenseStatusLabel(exp.status).toLowerCase();
                                const sousLigne = [
                                    jourEtMois(exp.date),
                                    nature,
                                    complement,
                                    etat,
                                ]
                                    .filter(Boolean)
                                    .join(' · ');
                                return (
                                    /* `.lrow` — 64 de haut, gouttière 12, un filet entre
                                       deux, et le ⋮ au bout. */
                                    <div
                                        key={exp.id}
                                        className={cn(
                                            'flex min-h-16 w-full items-center gap-3 py-2 text-left',
                                            index > 0 && 'border-outline-variant border-t',
                                        )}
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedExpenseId(exp.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setSelectedExpenseId(exp.id);
                                                }
                                            }}
                                            className="focus-visible:ring-focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[4px] outline-none focus-visible:ring-2"
                                        >
                                            {/* `.vig` — 40, rayon 4, deux lettres du
                                                fournisseur en fonte d'affichage. */}
                                            <span className="bg-surface-container text-on-surface-variant font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold">
                                                {initiales(exp.supplier)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="text-on-surface block truncate text-[16px] leading-6">
                                                    {exp.supplier}
                                                </span>
                                                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                                    {sousLigne}
                                                </span>
                                            </span>
                                            {/* `.amt` — **le nombre nu**, 16 sur 24 :
                                                la devise est dite une fois, dans le héro. */}
                                            <span className="text-on-surface shrink-0 text-[16px] leading-6 tabular-nums">
                                                {formatNumber(exp.amount, settings.compactNotation)}
                                            </span>
                                        </div>
                                        <Menu
                                            align="end"
                                            title={exp.supplier}
                                            items={[
                                                {
                                                    id: 'facture',
                                                    label: exp.sourceFileName
                                                        ? 'Voir son justificatif'
                                                        : 'Aucun justificatif',
                                                    disabled:
                                                        !exp.sourceFileId && !exp.sourceFileUrl,
                                                    onSelect: () => ouvrirLaFacture(exp),
                                                },
                                                {
                                                    id: 'supprimer',
                                                    label: 'Supprimer',
                                                    destructive: true,
                                                    dividerBefore: true,
                                                    onSelect: () =>
                                                        requestExpenseDeletion(exp, () =>
                                                            setSelectedExpenseId((courant) =>
                                                                courant === exp.id ? null : courant,
                                                            ),
                                                        ),
                                                },
                                            ]}
                                            trigger={
                                                <Button
                                                    variant="text"
                                                    iconOnly
                                                    aria-label={`Autres actes sur ${exp.supplier}`}
                                                    className="text-on-surface-variant hover:bg-surface-container -mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-md p-0"
                                                >
                                                    <Icon glyph={DotsThreeVertical} size={20} />
                                                </Button>
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </section>
                    );
                })}
            </ListTemplate>

            {/* La feuille de filtre — les axes en chips, jamais en onglets (R11). Pastilles de
                17.8 : 14 sur 20, 36 de haut. */}
            <BottomSheet open={filtreOuvert} onClose={() => setFiltreOuvert(false)} title="Filtrer">
                <div className="flex flex-col pb-0">
                    {/* `.sbody` et `.sfoot` — la feuille pose déjà 20 de chaque côté : libellés et
                        chips n'en rajoutent pas (ils tombaient à 40), et le pied reprend toute
                        la largeur pour que son filet coure d'un bord à l'autre. */}
                    <p className="text-on-surface-variant pb-2 text-[12px] leading-4 font-medium">
                        Nature
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <FacetChip
                            compact
                            label="Toutes"
                            count={dansLaPeriode.length}
                            selected={naturesActives.length === 0}
                            onClick={() => setNaturesActives([])}
                        />
                        {NATURES.map((nature) => (
                            <FacetChip
                                compact
                                key={nature}
                                label={EXPENSE_TYPE_LABELS[nature]}
                                count={comptesParNature.get(nature) ?? 0}
                                selected={naturesActives.includes(nature)}
                                onClick={() =>
                                    setNaturesActives((prev) =>
                                        prev.includes(nature)
                                            ? prev.filter((x) => x !== nature)
                                            : [...prev, nature],
                                    )
                                }
                            />
                        ))}
                    </div>

                    <p className="text-on-surface-variant pt-4 pb-2 text-[12px] leading-4 font-medium">
                        Période
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {PERIODES.map((p) => (
                            <FacetChip
                                compact
                                key={p.id}
                                label={p.id === 'exercice' ? `Exercice ${exerciseYear}` : p.label}
                                selected={periode === p.id}
                                onClick={() => setPeriode(p.id)}
                            />
                        ))}
                    </div>

                    <div className="border-outline-variant -mx-5 mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={() => {
                                setNaturesActives([]);
                                setPeriode('exercice');
                            }}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => setFiltreOuvert(false)}
                        >
                            Voir les {affichees.length}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </>
    );
};

export default ExpenseJournalPage;
