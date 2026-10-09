import React from 'react';

import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import { useEntree } from '../../../hooks/useEntree';
import { JAUGE } from '../../../lib/jauge';

/**
 * **Les quatre chiffres de l'exercice, chacun sa tuile** — la bande sombre de 15.1
 * éclatée au bureau (23/09, à la demande : *« éclater la première carte pour avoir
 * quelque chose de beaucoup plus aéré »*).
 *
 * La bande tenait quatre repères de 28 sur un seul aplat sombre, séparés de 16 : ils se
 * lisaient comme une phrase au lieu de quatre réponses. Les tableaux de bord financiers
 * posent leurs indicateurs **en tête, une tuile chacun**, et c'est ce qu'on fait : même
 * gabarit pour les quatre — ce qu'on lit (12, encre secondaire), le chiffre (28, Archivo),
 * ce qu'il veut dire (14) —, avec 24 d'intérieur et 16 entre elles.
 *
 * Le troisième chiffre est **neuf** : la moyenne mensuelle, et ce qu'elle donne en fin
 * d'exercice si elle tient. C'est la seule façon de lire un budget avant qu'il soit
 * épuisé — « 12 % consommés » ne dit pas si c'est tôt ou tard dans l'année.
 */

interface Tuile {
    cle: string;
    titre: string;
    valeur: string;
    unite?: string;
    sens: React.ReactNode;
    /** La part consommée, pour la jauge de la première tuile. */
    jauge?: number;
    alerte?: boolean;
}

interface FinanceKpiTilesProps {
    remaining: number;
    allocated: number;
    spent: number;
    percent: number;
    currency: string;
    compactNotation: boolean;
    /** Le jour de la mesure — « au 23 septembre ». */
    dateLabel: string;
    /** Mois vécus de l'exercice : 12 s'il est clos, 0 s'il est à venir. */
    monthsElapsed: number;
    postes: number;
    epuisees: number;
    plusEntame: { category: string; percent: number } | null;
    className?: string;
}

const FinanceKpiTiles: React.FC<FinanceKpiTilesProps> = ({
    remaining,
    allocated,
    spent,
    percent,
    currency,
    compactNotation,
    dateLabel,
    monthsElapsed,
    postes,
    epuisees,
    plusEntame,
    className,
}) => {
    const entree = useEntree();
    const n = (v: number) => formatNumber(v, compactNotation);
    /* Arrondis à l'unité : une moyenne « 1 937,8 » prétend à une précision que neuf
       mois de factures n'ont pas. */
    const moyenne = monthsElapsed > 0 ? Math.round(spent / monthsElapsed) : 0;
    const projection = Math.round((monthsElapsed > 0 ? spent / monthsElapsed : 0) * 12);
    const enCours = monthsElapsed > 0 && monthsElapsed < 12;

    const tuiles: Tuile[] = [
        {
            cle: 'restant',
            titre: 'Restant',
            valeur: n(remaining),
            unite: currency,
            sens: `sur ${n(allocated)} affectés`,
            jauge: allocated > 0 ? percent : undefined,
            alerte: remaining < 0,
        },
        {
            cle: 'consomme',
            titre: 'Consommé',
            valeur: n(spent),
            unite: currency,
            sens: `${Math.round(percent)} % de l’enveloppe · au ${dateLabel}`,
        },
        {
            cle: 'moyenne',
            titre: 'Moyenne mensuelle',
            valeur: monthsElapsed > 0 ? n(moyenne) : '—',
            unite: monthsElapsed > 0 ? currency : undefined,
            sens:
                monthsElapsed === 0 ? (
                    'l’exercice n’est pas encore ouvert'
                ) : enCours ? (
                    <>
                        à ce rythme,{' '}
                        <span
                            className={cn(
                                'tabular-nums',
                                allocated > 0 && projection > allocated
                                    ? 'text-[var(--tk-color-st-orange)]'
                                    : 'text-on-surface',
                            )}
                        >
                            {n(projection)}
                        </span>{' '}
                        fin décembre
                    </>
                ) : (
                    'sur les douze mois de l’exercice'
                ),
        },
        {
            cle: 'postes',
            titre: 'Postes',
            valeur: `${postes}`,
            sens: (
                <>
                    {epuisees > 0
                        ? `${epuisees} enveloppe${epuisees > 1 ? 's' : ''} épuisée${epuisees > 1 ? 's' : ''}`
                        : 'aucune enveloppe épuisée'}
                    {plusEntame && (
                        <span className="block truncate">
                            le plus entamé : {plusEntame.category} ·{' '}
                            {Math.round(plusEntame.percent)} %
                        </span>
                    )}
                </>
            ),
            alerte: epuisees > 0,
        },
    ];

    return (
        <div
            className={cn(
                'deux:grid-cols-4 grid grid-cols-2 gap-4',
                entree && 'mvt-cascade-cartes',
                className,
            )}
        >
            {tuiles.map((tuile) => (
                <section key={tuile.cle} className="rounded-card bg-surface flex flex-col p-4">
                    <h3 className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                        {tuile.titre}
                    </h3>
                    <p className="mt-3 flex items-baseline gap-2">
                        <span
                            className={cn(
                                'font-brand text-ts-page leading-ts-page font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums',
                                tuile.alerte
                                    ? 'text-[var(--tk-color-st-orange)]'
                                    : 'text-on-surface',
                            )}
                        >
                            <ChiffreAnime valeur={tuile.valeur} />
                        </span>
                        {tuile.unite && (
                            <span className="text-on-surface-variant text-[0.8125rem] leading-4">
                                {tuile.unite}
                            </span>
                        )}
                    </p>
                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                        {tuile.sens}
                    </p>
                    {tuile.jauge !== undefined && (
                        /* Le ruban de 8 — la variante épaisse de Material 3, comme les jauges
                           de l'accueil — à 16 de sa phrase. */
                        <div className={cn('bg-surface-container mt-4 overflow-hidden', JAUGE)}>
                            <i
                                className={cn(
                                    'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                    'block h-full',
                                    tuile.jauge >= 100
                                        ? 'bg-[var(--tk-color-st-orange)]'
                                        : 'bg-[var(--tk-color-st-vert)]',
                                )}
                                style={{ width: `${Math.min(tuile.jauge, 100)}%` }}
                            />
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
};

export default FinanceKpiTiles;
