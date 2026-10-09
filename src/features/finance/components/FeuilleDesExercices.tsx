import React, { useMemo, useState } from 'react';
import {
    CalendarPlus,
    CaretRight,
    ChartDonut,
    Check,
    Copy,
    FileText,
    LockSimple,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { AddBudgetModal } from './AddBudgetModal';

/**
 * **Passer d'un exercice à l'autre — une feuille, plus une page** (09/10).
 *
 * 15.1, colonne 3 en faisait un écran : *« le passage d'une année à l'autre, et l'endroit où
 * un exercice neuf se définit »*. À l'usage, la page ne faisait qu'aiguiller — chaque rangée
 * menait ailleurs : à Finances sur une autre année, aux lignes d'un exercice, à la lecture
 * d'un budget. On y entrait pour en ressortir aussitôt, et la flèche de Finances y ramenait.
 * Le commanditaire a retenu la revue de navigation : c'est une feuille, ouverte sur la page
 * où l'on est, qui se referme sur le choix.
 *
 * Le contenu est celui de la page, dans le même ordre :
 *
 * - **À définir** — l'exercice suivant, **reprendre** celui en cours (ses lignes, montants à
 *   revoir, rien de consommé), **lire un budget**, ou partir de zéro. Ils mènent aux lignes
 *   de l'année (15.2).
 * - **En cours** — l'exercice ouvert, sa consommation.
 * - **Clos** — ce qu'ils ont consommé sur ce qu'ils avaient. Un exercice clos se lit et
 *   s'exporte.
 */
interface FeuilleDesExercicesProps {
    open: boolean;
    onClose: () => void;
    /** L'exercice que la page montre : il porte la coche. */
    anneeAffichee?: number;
    /** Choisir un exercice : la page qui a ouvert la feuille le montre. */
    onChoisir: (annee: number) => void;
}

const Rangee: React.FC<{
    glyph: PhosphorGlyph;
    teinte?: string;
    titre: string;
    detail: string;
    choisi?: boolean;
    onOpen: () => void;
}> = ({ glyph, teinte, titre, detail, choisi = false, onOpen }) => (
    <Button
        variant="text"
        onClick={onOpen}
        aria-current={choisi ? 'true' : undefined}
        className="border-outline-variant hover:bg-surface-container -mx-5 flex h-auto min-h-16 w-[calc(100%+2.5rem)] items-center justify-start gap-3 rounded-none border-t px-5 py-2 text-left font-normal whitespace-normal first:border-t-0"
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
        <Icon
            glyph={choisi ? Check : CaretRight}
            size={20}
            className={cn('shrink-0', choisi ? 'text-on-surface' : 'text-text-tertiary')}
        />
    </Button>
);

/** L'intitulé d'un groupe — 12, encre secondaire, comme un groupe de liste. */
const Groupe: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
    <section className="pt-3 first:pt-0">
        <h3 className="text-on-surface-variant pb-1 text-[0.75rem] leading-4 font-medium">
            {titre}
        </h3>
        <div className="flex flex-col">{children}</div>
    </section>
);

const FeuilleDesExercices: React.FC<FeuilleDesExercicesProps> = ({
    open,
    onClose,
    anneeAffichee,
    onChoisir,
}) => {
    const { settings } = useData();
    const { financeBudgets, financeExpenses, upsertFinanceBudget } = useFinanceData();
    const { showToast } = useToast();
    const [importOuvert, setImportOuvert] = useState(false);
    const n = (v: number) => formatNumber(v, settings.compactNotation);

    const choisir = (annee: number) => {
        onClose();
        onChoisir(annee);
    };
    const lignesDe = (annee: number) => {
        onClose();
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
        <>
            <BottomSheet
                id="feuille-des-exercices"
                open={open}
                onClose={onClose}
                title="Exercices"
                subtitle={`${total} exercice${total > 1 ? 's' : ''} · ${clos.length} clos`}
            >
                <div className="flex flex-col pb-2">
                    {enCours.length > 0 && (
                        <Groupe titre="En cours">
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
                                        choisi={b.year === anneeAffichee}
                                        onOpen={() => choisir(b.year)}
                                    />
                                );
                            })}
                        </Groupe>
                    )}

                    <Groupe titre="À définir">
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
                            onOpen={() => {
                                onClose();
                                setImportOuvert(true);
                            }}
                        />
                    </Groupe>

                    {clos.length > 0 && (
                        <Groupe titre={`Clos · ${clos.length}`}>
                            {clos.map((b) => (
                                <Rangee
                                    key={b.year}
                                    glyph={LockSimple}
                                    titre={`Exercice ${b.year}`}
                                    detail={`${n(consommeDe(b.items))} sur ${n(b.totalAllocated)}`}
                                    choisi={b.year === anneeAffichee}
                                    onOpen={() => choisir(b.year)}
                                />
                            ))}
                        </Groupe>
                    )}
                </div>
            </BottomSheet>

            <AddBudgetModal isOpen={importOuvert} onClose={() => setImportOuvert(false)} />
        </>
    );
};

export default FeuilleDesExercices;
