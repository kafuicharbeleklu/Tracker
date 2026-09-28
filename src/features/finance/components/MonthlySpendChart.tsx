import React, { useMemo, useState } from 'react';
import { ChartBar } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import type { FinanceExpense } from '../../../types';

/**
 * **La consommation mois par mois** — l'histogramme de Finances (23/09, à la demande :
 * *« lire la consommation sur l'année, quel mois on a le plus consommé »*).
 *
 * Ce qui est tranché, et pourquoi :
 * - **Des barres verticales, une par mois**, l'axe à zéro. C'est la forme qui compare des
 *   quantités dans le temps ; une courbe suggérerait une continuité entre deux factures.
 * - **Un seul repère : le douzième de l'enveloppe**, en tirets. Il répond à la seule
 *   question qu'un mois pose à un budget — *a-t-on dépensé plus que sa part ?* Un mois qui
 *   le dépasse passe à l'orange d'état ; les autres gardent le vert des jauges du produit.
 * - **Le pic est nommé** dans l'en-tête, et son montant est écrit sur sa barre : on
 *   n'a pas à survoler douze barres pour trouver la plus haute. Les autres montants se
 *   lisent au survol, au focus, et par le lecteur d'écran.
 * - **Les mois à venir n'ont pas de barre**, pas une barre à zéro : un mois qui n'a pas eu
 *   lieu n'a rien consommé, il n'a simplement pas encore été vécu.
 *
 * **La passe du 27/09** (« améliore l'histogramme, bureau et téléphone ») :
 * - **Chaque mois se lit**, et pas seulement le pic : son montant en tête de barre dès la
 *   tablette ; au doigt comme à la souris, **un mois touché** écrit sa lecture exacte dans
 *   l'en-tête (« mars · 10 178 000 · 122 % du douzième ») et les autres s'estompent. Le
 *   montant ne vivait que dans une infobulle native, qu'aucun doigt ne déclenche.
 * - **Des unités compactes** sur l'axe et les barres (« 20 M », « 15,3 M ») : l'axe écrivait
 *   « 20 000 000 », débordait de la carte au téléphone et en mangeait le cinquième. La
 *   lecture de l'en-tête garde le montant exact.
 * - **Le repère se nomme sur sa ligne** (« 1/12 · 8,3 M »), la légende ne garde que les deux
 *   teintes ; elle écrivait « un douzième de l'enveloppe · 8 333 333,3 ».
 * - **Des barres plus fines que leur colonne** : elles se touchaient presque, et la figure
 *   faisait bloc.
 */

const MOIS_COURTS = [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
];
const MOIS_LONGS = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
];

/** Le plafond « rond » de l'axe : 1, 2, 2,5 ou 5 × 10ⁿ au-dessus de la valeur. */
const plafondRond = (valeur: number): number => {
    if (valeur <= 0) return 1;
    const puissance = 10 ** Math.floor(Math.log10(valeur));
    const pas = [1, 2, 2.5, 5, 10].find((p) => p * puissance >= valeur) ?? 10;
    return pas * puissance;
};

/**
 * **Une seule unité pour toute la figure** — le million dès que le plafond l'atteint, sinon
 * le millier : « 15,3 M », « 850 k » ne se côtoient jamais sur le même axe (la notation
 * compacte d'`Intl` mélange les deux d'une barre à l'autre).
 */
const uniteDe = (plafond: number) => {
    const [diviseur, suffixe] =
        plafond >= 1_000_000 ? [1_000_000, ' M'] : plafond >= 1_000 ? [1_000, ' k'] : [1, ''];
    const format = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
    return (valeur: number) =>
        valeur === 0 ? '0' : `${format.format(valeur / diviseur)}${suffixe}`;
};

interface MonthlySpendChartProps {
    expenses: FinanceExpense[];
    year: number;
    /** L'enveloppe de l'exercice — son douzième fait le repère. */
    allocated: number;
    currency: string;
    compactNotation: boolean;
    className?: string;
}

const MonthlySpendChart: React.FC<MonthlySpendChartProps> = ({
    expenses,
    year,
    allocated,
    currency,
    compactNotation,
    className,
}) => {
    const maintenant = new Date();
    /** Le nombre de mois vécus de l'exercice : 12 s'il est passé, 0 s'il est à venir. */
    const moisVecus =
        year < maintenant.getFullYear()
            ? 12
            : year > maintenant.getFullYear()
              ? 0
              : maintenant.getMonth() + 1;

    const parMois = useMemo(() => {
        const sommes = new Array<number>(12).fill(0);
        expenses.forEach((expense) => {
            const date = new Date(expense.date);
            if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
            sommes[date.getMonth()] += expense.amount;
        });
        return sommes;
    }, [expenses, year]);

    const total = parMois.reduce((a, b) => a + b, 0);
    const part = allocated > 0 ? allocated / 12 : 0;
    const pic = parMois.reduce((best, v, i) => (v > parMois[best] ? i : best), 0);
    const plafond = plafondRond(Math.max(...parMois, part));
    const n = (v: number) => formatNumber(v, compactNotation);
    const court = uniteDe(plafond);
    /** Le mois touché — sa lecture exacte passe dans l'en-tête ; un second geste la retire. */
    const [choisi, setChoisi] = useState<number | null>(null);
    const moisEnCours = year === maintenant.getFullYear() ? maintenant.getMonth() : -1;
    const lecture =
        choisi !== null
            ? {
                  mois: MOIS_LONGS[choisi],
                  valeur: n(parMois[choisi]),
                  part: part > 0 ? Math.round((parMois[choisi] / part) * 100) : null,
                  auDela: part > 0 && parMois[choisi] > part,
                  enCours: choisi === moisEnCours,
              }
            : null;

    return (
        <section className={cn('rounded-card bg-surface flex flex-col p-4', className)}>
            {/* Au téléphone, le pic passe sous le titre : côte à côte sur 330 px, le
                titre se coupait en deux lignes et le montant du pic en points de suite. */}
            <header className="medium:flex-row medium:items-baseline medium:justify-between flex min-h-6 flex-col gap-x-3 gap-y-0.5">
                <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                    Consommation par mois
                </h3>
                {total > 0 &&
                    (lecture ? (
                        /* La lecture du mois touché — exacte, et rapportée au douzième. */
                        <span
                            aria-live="polite"
                            className="text-on-surface text-ts-sub leading-ts-sub truncate tabular-nums"
                        >
                            {lecture.mois}
                            {lecture.enCours && ' (en cours)'} ·{' '}
                            <b className="font-semibold">{lecture.valeur}</b>
                            {lecture.part !== null && (
                                <>
                                    {' · '}
                                    <span
                                        className={cn(
                                            lecture.auDela &&
                                                'font-medium text-[var(--tk-color-on-tint-orange)]',
                                        )}
                                    >
                                        {lecture.part} % du douzième
                                    </span>
                                </>
                            )}
                        </span>
                    ) : (
                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub truncate tabular-nums">
                            pic en {MOIS_LONGS[pic]} · {n(parMois[pic])}
                        </span>
                    ))}
            </header>

            {total === 0 ? (
                <CardEmptyState
                    glyph={ChartBar}
                    title={`Aucune dépense en ${year}`}
                    description="Chaque dépense saisie prend sa place dans le mois de sa date."
                />
            ) : (
                <figure
                    className="mt-5 flex flex-1 flex-col"
                    aria-label={`Consommation ${year} par mois, en ${currency}`}
                >
                    <div className="deux:min-h-72 flex min-h-60 flex-1 gap-3">
                        {/* L'axe : trois repères, zéro compris — une barre se lit contre lui. */}
                        <div
                            aria-hidden="true"
                            className="text-text-tertiary relative w-8 shrink-0 text-right text-[0.6875rem] leading-4 tabular-nums"
                        >
                            {[1, 0.5, 0].map((f) => (
                                <span
                                    key={f}
                                    className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
                                    style={{ top: `${(1 - f) * 100}%` }}
                                >
                                    {court(plafond * f)}
                                </span>
                            ))}
                        </div>

                        <div className="relative flex-1">
                            {[1, 0.5, 0].map((f) => (
                                <span
                                    key={f}
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute inset-x-0 h-px',
                                        f === 0 ? 'bg-outline' : 'bg-outline-variant',
                                    )}
                                    style={{ top: `${(1 - f) * 100}%` }}
                                />
                            ))}
                            {part > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="border-on-surface-variant pointer-events-none absolute inset-x-0 z-[1] border-t border-dashed"
                                    style={{ bottom: `${(part / plafond) * 100}%` }}
                                >
                                    {/* Le repère se nomme sur sa ligne, au bout droit — là où
                                        les mois à venir laissent la place. */}
                                    <span className="bg-surface text-on-surface-variant absolute right-0 bottom-0.5 rounded-sm pl-1 text-[0.6875rem] leading-4 tabular-nums">
                                        1/12 · {court(part)}
                                    </span>
                                </span>
                            )}

                            {/* Les barres montent de leur base, mois après mois (26/09). Chaque
                                mois vécu est un geste : touché, il écrit sa lecture en tête. */}
                            <ol className="medium:gap-3 mvt-colonnes absolute inset-0 grid grid-cols-12 items-end gap-1.5">
                                {parMois.map((valeur, mois) => {
                                    const avenir = mois >= moisVecus;
                                    const auDela = part > 0 && valeur > part;
                                    const estChoisi = choisi === mois;
                                    const efface = choisi !== null && !estChoisi;
                                    const hauteur = `${(valeur / plafond) * 100}%`;
                                    /* Le montant en tête de barre : toujours dès la tablette ;
                                       au téléphone, celui du mois touché, sinon celui du pic. */
                                    const etiquette = valeur > 0 && !avenir;
                                    const etiquetteAuTelephone =
                                        estChoisi || (choisi === null && mois === pic);
                                    return (
                                        <li
                                            key={mois}
                                            className="relative flex h-full flex-col justify-end"
                                        >
                                            {avenir ? null : (
                                                <Button
                                                    variant="text"
                                                    aria-pressed={estChoisi}
                                                    aria-label={`${MOIS_LONGS[mois]} : ${n(valeur)} ${currency}${auDela ? ', au-delà du douzième de l’enveloppe' : ''}`}
                                                    onClick={() =>
                                                        setChoisi(estChoisi ? null : mois)
                                                    }
                                                    /* La colonne entière est la cible (20 × 240 au téléphone) : la
                                                       zone de 48 de `touch-target` y débordait sur les mois voisins,
                                                       et toucher mars choisissait avril. */
                                                    className="group/barre relative h-full min-h-0 w-full min-w-0 flex-col items-center justify-end gap-0 rounded-none p-0 before:content-none! hover:bg-transparent focus-visible:ring-offset-0 active:scale-100"
                                                >
                                                    {etiquette && (
                                                        <span
                                                            aria-hidden="true"
                                                            className={cn(
                                                                /* Au-dessus du repère, sur le fond de la carte : la ligne du
                                                                   douzième ne barre jamais un montant. */
                                                                'mvt-contenu bg-surface absolute left-1/2 z-[2] -translate-x-1/2 rounded-sm px-0.5 text-center text-[0.6875rem] leading-4 font-medium whitespace-nowrap tabular-nums transition-opacity',
                                                                estChoisi
                                                                    ? 'text-on-surface'
                                                                    : 'text-on-surface-variant',
                                                                !etiquetteAuTelephone &&
                                                                    'medium:block hidden',
                                                                efface && 'opacity-40',
                                                            )}
                                                            style={{
                                                                bottom: `calc(${hauteur} + 4px)`,
                                                            }}
                                                        >
                                                            {court(valeur)}
                                                        </span>
                                                    )}
                                                    {valeur > 0 && (
                                                        <span
                                                            className={cn(
                                                                'mvt-colonne duration-medium2 ease-emphasized block min-h-0.5 w-[64%] max-w-10 rounded-t-[4px] transition-[height,opacity]',
                                                                auDela
                                                                    ? 'bg-[var(--tk-color-st-orange)]'
                                                                    : 'bg-[var(--tk-color-st-vert)]',
                                                                efface
                                                                    ? 'opacity-35'
                                                                    : 'group-hover/barre:opacity-85',
                                                            )}
                                                            style={{ height: hauteur }}
                                                        />
                                                    )}
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </div>

                    {/* Les mois — l'initiale au téléphone, l'abréviation dès la tablette ; le
                        mois en cours en encre pleine. */}
                    <div
                        aria-hidden="true"
                        className="medium:gap-3 mt-2 ml-11 grid grid-cols-12 gap-1.5 text-center text-[0.6875rem] leading-4"
                    >
                        {MOIS_COURTS.map((mois, i) => (
                            <span
                                key={mois}
                                className={cn(
                                    'truncate',
                                    i === choisi ||
                                        (choisi === null &&
                                            i === moisVecus - 1 &&
                                            year === maintenant.getFullYear())
                                        ? 'text-on-surface font-medium'
                                        : i >= moisVecus
                                          ? 'text-text-tertiary'
                                          : 'text-on-surface-variant',
                                )}
                            >
                                <span className="medium:hidden">{mois[0].toUpperCase()}</span>
                                <span className="medium:inline hidden">{mois}</span>
                            </span>
                        ))}
                    </div>

                    {part > 0 && (
                        <figcaption className="text-on-surface-variant mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] leading-4">
                            <span className="flex items-center gap-1.5">
                                <i className="h-2 w-2 rounded-[2px] bg-[var(--tk-color-st-vert)]" />
                                dans sa part
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="h-2 w-2 rounded-[2px] bg-[var(--tk-color-st-orange)]" />
                                au-delà du douzième
                            </span>
                            <span className="medium:hidden w-full">
                                Touchez un mois pour le lire.
                            </span>
                        </figcaption>
                    )}
                </figure>
            )}
        </section>
    );
};

export default MonthlySpendChart;
