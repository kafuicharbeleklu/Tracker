import React, { useMemo, useState } from 'react';
import { ChartBar } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
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
 *   le dépasse passe à l'orange d'état ; les autres sont au bleu (au vert, jusqu'au 10/10).
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
 *
 * **Au téléphone, une rangée par mois** (10/10, proposition retenue). Sur 361 px, douze barres
 * verticales faisaient onze pixels chacune ; les mois s'écrivaient d'une lettre (J, J, J…) et
 * un seul montant se lisait sans toucher : le pic. La figure y devient un tableau qui porte
 * ses barres — le mois, sa barre couchée, son montant au bout. Le douzième est un trait
 * vertical que chaque barre franchit ou non, et un ▲ suit le montant qui le dépasse : le
 * dépassement ne tient plus à la couleur seule. Les mois à venir ne prennent pas de rangée,
 * une ligne les nomme. Dès la tablette, les barres verticales gardent leur place.
 *
 * **Le bleu remplace le vert, partout** (10/10). Le vert et l'orange d'état ne se séparaient
 * pas pour un daltonien (écart mesuré de 5,9 en deutéranopie, quand il en faut 8) ; le bleu
 * et l'orange, si (21,7).
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

/** « en neuf mois » : le compte des mois vécus s'écrit en lettres. */
const EN_LETTRES = [
    'zéro',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
];

/** « Octobre à décembre », « Novembre et décembre », « Décembre » — les mois qui restent. */
const moisAVenir = (depuis: number): string => {
    const noms = MOIS_LONGS.slice(depuis);
    const texte =
        noms.length > 2
            ? `${noms[0]} à ${noms[noms.length - 1]}`
            : noms.length === 2
              ? `${noms[0]} et ${noms[1]}`
              : (noms[0] ?? '');
    return texte.charAt(0).toUpperCase() + texte.slice(1);
};

const TEINTE_DANS_SA_PART = 'bg-[var(--tk-color-st-bleu)]';
const TEINTE_AU_DELA = 'bg-[var(--tk-color-st-orange)]';

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
    /* Au téléphone, une rangée par mois ; dès la tablette, douze barres debout. */
    const enRangees = useMediaQuery(MEDIA.compact);
    const sommet = Math.max(...parMois, part);
    /* Debout, l'axe porte des repères ronds ; couchées, les barres n'ont pas d'axe : la plus
       longue s'arrête juste avant son montant. */
    const plafond = enRangees ? sommet / 0.956 || 1 : plafondRond(sommet);
    const n = (v: number) => formatNumber(v, compactNotation);
    const court = uniteDe(plafondRond(sommet));
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
            {/* Au téléphone, la lecture passe sous le titre : côte à côte sur 330 px, le
                titre se coupait en deux lignes et le montant du pic en points de suite. */}
            <header className="medium:flex-row medium:items-baseline medium:justify-between flex min-h-6 flex-col gap-x-3 gap-y-0.5">
                <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                    Consommation par mois
                </h3>
                {total > 0 &&
                    (enRangees ? (
                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                            {court(total)} en {EN_LETTRES[moisVecus]} mois · pic en{' '}
                            {MOIS_LONGS[pic]}
                        </span>
                    ) : lecture ? (
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
            ) : enRangees ? (
                <figure
                    className="mt-3.5 flex flex-col"
                    aria-label={`Consommation ${year} par mois, en ${currency}`}
                >
                    {/* Un tableau qui porte ses barres : 44 pour le mois, la barre, 68 pour le
                        montant. Le trait du douzième traverse toutes les rangées. */}
                    <ol className="relative">
                        {part > 0 && (
                            <span
                                aria-hidden="true"
                                className="bg-on-surface/45 pointer-events-none absolute inset-y-0 z-[1] w-px"
                                style={{
                                    left: `calc(52px + (100% - 128px) * ${part / plafond})`,
                                }}
                            />
                        )}
                        {parMois.slice(0, moisVecus).map((valeur, mois) => {
                            const auDela = part > 0 && valeur > part;
                            return (
                                <li
                                    key={MOIS_COURTS[mois]}
                                    className="text-ts-sub leading-ts-sub grid h-8 grid-cols-[44px_minmax(0,1fr)_68px] items-center gap-2 tabular-nums"
                                >
                                    <span
                                        className={cn(
                                            mois === moisEnCours
                                                ? 'text-on-surface font-medium'
                                                : 'text-on-surface-variant',
                                        )}
                                    >
                                        {MOIS_COURTS[mois]}
                                    </span>
                                    <span aria-hidden="true" className="block h-3">
                                        {valeur > 0 && (
                                            <i
                                                className={cn(
                                                    'mvt-jauge block h-full min-w-0.5 rounded-r-[4px]',
                                                    auDela ? TEINTE_AU_DELA : TEINTE_DANS_SA_PART,
                                                )}
                                                style={{ width: `${(valeur / plafond) * 100}%` }}
                                            />
                                        )}
                                    </span>
                                    <span className="text-on-surface text-right whitespace-nowrap">
                                        {court(valeur)}
                                        {auDela && (
                                            <>
                                                {' '}
                                                <b
                                                    aria-hidden="true"
                                                    className="align-[1px] text-[0.625rem] text-[var(--tk-color-st-orange)]"
                                                >
                                                    ▲
                                                </b>
                                                <span className="sr-only">
                                                    , au-delà du douzième
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                    {part > 0 && (
                        <p className="text-on-surface-variant mt-1.5 pl-[52px] text-[0.75rem] leading-4 tabular-nums">
                            │ 1/12 de l’enveloppe · {court(part)}
                        </p>
                    )}
                    {moisVecus < 12 && (
                        <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                            {moisAVenir(moisVecus)} : à venir.
                        </p>
                    )}
                    {part > 0 && (
                        <figcaption className="text-on-surface-variant mt-3 flex flex-wrap items-center gap-x-[18px] gap-y-1.5 text-[0.75rem] leading-4">
                            <span className="flex items-center gap-1.5">
                                <i
                                    className={cn('h-2.5 w-2.5 rounded-[2px]', TEINTE_DANS_SA_PART)}
                                />
                                dans sa part
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className={cn('h-2.5 w-2.5 rounded-[2px]', TEINTE_AU_DELA)} />▲
                                au-delà du douzième
                            </span>
                        </figcaption>
                    )}
                </figure>
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
                                    /* Le montant en tête de barre. */
                                    const etiquette = valeur > 0 && !avenir;
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
                                                    /* La valeur exacte du mois, au survol (10/10). */
                                                    data-infobulle={`${MOIS_LONGS[mois]} : ${n(valeur)} ${currency}${auDela ? ', au-delà du douzième de l’enveloppe' : ''}`}
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
                                                                    ? TEINTE_AU_DELA
                                                                    : TEINTE_DANS_SA_PART,
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

                    {/* Les mois ; le mois en cours en encre pleine. */}
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
                                {mois}
                            </span>
                        ))}
                    </div>

                    {part > 0 && (
                        <figcaption className="text-on-surface-variant mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] leading-4">
                            <span className="flex items-center gap-1.5">
                                <i className={cn('h-2 w-2 rounded-[2px]', TEINTE_DANS_SA_PART)} />
                                dans sa part
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className={cn('h-2 w-2 rounded-[2px]', TEINTE_AU_DELA)} />
                                au-delà du douzième
                            </span>
                        </figcaption>
                    )}
                </figure>
            )}
        </section>
    );
};

export default MonthlySpendChart;
