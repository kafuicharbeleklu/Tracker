import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    CalendarPlus,
    CaretRight,
    ChartDonut,
    Copy,
    FileText,
    LockSimple,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import BarreDePage from '../../../components/layout/BarreDePage';
import Reading from '../../../components/layout/Reading';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { CORPS_BUREAU, PAGE_BUREAU } from '../../../lib/regimeBureau';
import { AddBudgetModal } from '../components/AddBudgetModal';

/**
 * **15.1, colonne 3 — « passer d'un exercice à l'autre »** (porté le 24/09).
 *
 * *« Le passage d'une année à l'autre, et l'endroit où un exercice neuf se définit :
 * reprendre 2026, lire un fichier, ou partir de zéro. Les clos se lisent et s'exportent,
 * sans se modifier. »*
 *
 * Le produit n'avait pas cet écran : un exercice neuf s'ouvrait par une boîte générique
 * (« Définir le Budget Annuel », puis « Nouvel exercice »), sans reprise de l'année
 * d'avant, et on changeait d'année par un sélecteur. Trois cartes, dans l'ordre de la
 * planche :
 *
 * - **À définir** — l'exercice suivant (« aucune ligne · à projeter »), **reprendre** celui
 *   en cours (ses lignes, montants à revoir, rien de consommé), **lire un budget** (la boîte
 *   d'import), et au pied, *« ou partir de zéro, ligne par ligne »*. Les trois mènent aux
 *   lignes du budget de l'année (15.2), où rien n'est écrit avant « Enregistrer » —
 *   sauf la reprise, qui pose d'abord les lignes reprises.
 * - **En cours** — l'exercice ouvert, sa consommation.
 * - **Clos** — ce qu'ils ont consommé sur ce qu'ils avaient ; *« un exercice clos se lit
 *   et s'exporte »*.
 *
 * Toucher un exercice ouvre l'accueil des finances sur lui (`/finance?annee=`).
 */
interface ExercisesPageProps {
    onBack: () => void;
}

const Rangee: React.FC<{
    glyph: PhosphorGlyph;
    teinte?: string;
    titre: string;
    detail: string;
    onOpen: () => void;
}> = ({ glyph, teinte, titre, detail, onOpen }) => (
    <Button
        variant="text"
        onClick={onOpen}
        className="border-outline-variant hover:bg-surface-container -mx-4 flex h-auto min-h-16 w-[calc(100%+2rem)] items-center justify-start gap-3 rounded-none border-t px-4 py-2 text-left font-normal whitespace-normal first:border-t-0"
    >
        <span
            className={cn(
                'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center',
                teinte ?? 'bg-surface-container text-on-surface-variant',
            )}
        >
            <Icon glyph={glyph} size={20} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                {titre}
            </span>
            <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate tabular-nums">
                {detail}
            </span>
        </span>
        <Icon glyph={CaretRight} size={20} className="text-text-tertiary shrink-0" />
    </Button>
);

const Carte: React.FC<{ titre: string; compte?: number; children: React.ReactNode }> = ({
    titre,
    compte,
    children,
}) => (
    <section className="rounded-card bg-surface px-4 pt-2 pb-1">
        <div className="flex min-h-12 items-center justify-between gap-3">
            <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">{titre}</h3>
            {compte !== undefined && (
                <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                    {compte}
                </span>
            )}
        </div>
        <div className="flex flex-col">{children}</div>
    </section>
);

const ExercisesPage: React.FC<ExercisesPageProps> = ({ onBack }) => {
    const isCompact = useMediaQuery(MEDIA.compact);
    const { settings } = useData();
    const { financeBudgets, financeExpenses, upsertFinanceBudget } = useFinanceData();
    const { showToast } = useToast();
    const [importOuvert, setImportOuvert] = useState(false);
    const n = (v: number) => formatNumber(v, settings.compactNotation);

    const ouvrir = (annee: number) => {
        window.location.hash = `/finance?annee=${annee}`;
    };
    const lignesDe = (annee: number) => {
        window.location.hash = `/finance/lines/${annee}`;
    };

    const tries = useMemo(
        () => [...financeBudgets].sort((a, b) => b.year - a.year),
        [financeBudgets],
    );
    const enCours = tries.filter((b) => b.status === 'En cours' && b.items.length > 0);
    const clos = tries.filter((b) => b.status !== 'En cours');
    const aProjeter = tries.filter((b) => b.status === 'En cours' && b.items.length === 0);
    const reference = enCours[0] ?? clos[0];
    const plusRecente = tries[0]?.year ?? new Date().getFullYear() - 1;
    const suivante = plusRecente + 1;
    const suivanteExiste = financeBudgets.some((b) => b.year === suivante);

    const consommeDe = (items: { spent: number }[]) => items.reduce((s, i) => s + i.spent, 0);
    const depensesDe = (annee: number) =>
        financeExpenses.filter((e) => new Date(e.date).getFullYear() === annee).length;

    /** Reprendre l'exercice de référence : ses lignes, ses montants, rien de consommé. */
    const reprendre = () => {
        if (!reference) return;
        upsertFinanceBudget({
            year: suivante,
            status: 'En cours',
            totalAllocated: reference.totalAllocated,
            items: reference.items.map((item) => ({ ...item, spent: 0 })),
        });
        showToast(
            `Exercice ${suivante} ouvert avec les ${reference.items.length} lignes de ${reference.year}.`,
            'success',
        );
        lignesDe(suivante);
    };

    const total = financeBudgets.length + (suivanteExiste ? 0 : 1);

    return (
        /* **L'en-tête reste, le corps défile** (24/09) — le régime des listes au bureau :
           l'en-tête partait avec le tableau. */
        <div className={cn('bg-background flex min-w-0 flex-1 flex-col', PAGE_BUREAU)}>
            <IconGestureSizeContext.Provider value={isCompact ? 48 : 40}>
                {isCompact ? (
                    <BarreDePage
                        className="sticky top-0 z-20"
                        title="Exercices"
                        onBack={onBack}
                        backLabel="Retour aux finances"
                    />
                ) : (
                    <header className="px-page large:mx-auto large:max-w-[calc(63rem+2*var(--tk-space-page))] flex min-h-[72px] w-full items-center gap-2 pt-5">
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour aux finances"
                            onClick={onBack}
                            className="text-on-surface-variant hover:text-on-surface -ml-2.5 shrink-0"
                        >
                            <Icon glyph={ArrowLeft} size={20} />
                        </Button>
                        <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 truncate font-semibold tracking-[-0.02em]">
                            Exercices
                        </h1>
                        <span className="text-text-muted pt-1.5 text-[0.8125rem] leading-4 tabular-nums">
                            {total} exercice{total > 1 ? 's' : ''} · {clos.length} clos
                        </span>
                    </header>
                )}
            </IconGestureSizeContext.Provider>

            <div className={cn('medium:px-page px-4 pt-4 pb-6', CORPS_BUREAU)}>
                <Reading desk className="flex flex-col gap-4">
                    <Carte titre="À définir">
                        {!suivanteExiste && (
                            <Rangee
                                glyph={CalendarPlus}
                                teinte="bg-tint-ambre text-on-tint-ambre"
                                titre={`Exercice ${suivante}`}
                                detail="aucune ligne · à projeter"
                                onOpen={() => lignesDe(suivante)}
                            />
                        )}
                        {aProjeter.map((b) => (
                            <Rangee
                                key={b.year}
                                glyph={CalendarPlus}
                                teinte="bg-tint-ambre text-on-tint-ambre"
                                titre={`Exercice ${b.year}`}
                                detail="aucune ligne · à projeter"
                                onOpen={() => lignesDe(b.year)}
                            />
                        ))}
                        {reference && !suivanteExiste && (
                            <Rangee
                                glyph={Copy}
                                titre={`Reprendre ${reference.year}`}
                                detail={`${reference.items.length} ligne${reference.items.length > 1 ? 's' : ''}, montants à revoir`}
                                onOpen={reprendre}
                            />
                        )}
                        <Rangee
                            glyph={FileText}
                            titre="Lire un budget"
                            detail="tableur ou PDF"
                            onOpen={() => setImportOuvert(true)}
                        />
                        {!suivanteExiste && (
                            <Button
                                variant="text"
                                onClick={() => lignesDe(suivante)}
                                className="border-outline-variant text-on-surface-variant text-ts-sub leading-ts-sub -mx-4 min-h-12 w-[calc(100%+2rem)] justify-start rounded-none border-t px-4 font-normal"
                            >
                                Ou partir de zéro, ligne par ligne.
                            </Button>
                        )}
                    </Carte>

                    {enCours.length > 0 && (
                        <Carte titre="En cours">
                            {enCours.map((b) => {
                                const consomme = consommeDe(b.items);
                                const part =
                                    b.totalAllocated > 0
                                        ? Math.round((consomme / b.totalAllocated) * 100)
                                        : 0;
                                const dep = depensesDe(b.year);
                                return (
                                    <Rangee
                                        key={b.year}
                                        glyph={ChartDonut}
                                        teinte="bg-tint-vert text-on-tint-vert"
                                        titre={`Exercice ${b.year}`}
                                        detail={`${part} % consommés · ${dep} dépense${dep > 1 ? 's' : ''}`}
                                        onOpen={() => ouvrir(b.year)}
                                    />
                                );
                            })}
                        </Carte>
                    )}

                    {clos.length > 0 && (
                        <Carte titre="Clos" compte={clos.length}>
                            {clos.map((b) => (
                                <Rangee
                                    key={b.year}
                                    glyph={LockSimple}
                                    titre={`Exercice ${b.year}`}
                                    detail={`${n(consommeDe(b.items))} sur ${n(b.totalAllocated)}`}
                                    onOpen={() => ouvrir(b.year)}
                                />
                            ))}
                            <p className="border-outline-variant text-text-muted text-ts-sub leading-ts-sub -mx-4 border-t px-4 py-3">
                                Un exercice clos se lit et s’exporte.
                            </p>
                        </Carte>
                    )}
                </Reading>
            </div>

            <AddBudgetModal isOpen={importOuvert} onClose={() => setImportOuvert(false)} />
        </div>
    );
};

export default ExercisesPage;
