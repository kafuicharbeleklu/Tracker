import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Proportion — planche **04.2** : *une rangée, jamais un anneau*.
 *
 * La fiche portait un tiers d'écran pour dire « amorti à 50 % » : prix d'achat,
 * valeur actuelle, amortissement **en rouge**, barre jaune et tableau de trois
 * lignes. Rien là-dedans ne portait de décision.
 *
 * Ce qui reste tient en trois éléments : **le nombre et ce qu'il mesure**, la barre,
 * puis **la conséquence** — ce qu'il faudra faire, et quand. Un pourcentage qui
 * n'appelle rien n'a pas besoin d'être vu ; c'est la phrase qui décide.
 *
 * **Un amortissement n'est pas une anomalie**, et le rouge ne s'y invite pas : la
 * teinte `attention` est réservée au cran où la proportion appelle réellement un
 * geste (« à renouveler cette année »). Partout ailleurs, la barre est de l'encre.
 *
 * **La provenance se déclare** : « amortissement issu du paramétrage par catégorie,
 * pas d'une réévaluation ». Sans elle, un chiffre exact passe pour une mesure.
 */

interface ProportionRowProps {
    /** Le nombre — « 50 % ». */
    value: React.ReactNode;
    /** Ce qu'il mesure, en toutes lettres — « de la garantie écoulée ». */
    label: React.ReactNode;
    /** 0 à 100. */
    percent: number;
    /**
     * `neutral` : l'encre — le cas normal. `positive` : ce qui protège (garantie en
     * cours). `attention` : le seul cran qui appelle un geste.
     */
    tone?: 'neutral' | 'positive' | 'attention';
    /** La conséquence : ce qu'il faudra faire, et quand. */
    note?: React.ReactNode;
    /** D'où vient le chiffre. Un chiffre sans provenance passe pour une mesure. */
    source?: React.ReactNode;
    className?: string;
}

const TONE_FILL: Record<NonNullable<ProportionRowProps['tone']>, string> = {
    neutral: 'bg-on-surface',
    positive: 'bg-success',
    attention: 'bg-danger',
};

const ProportionRow: React.FC<ProportionRowProps> = ({
    value,
    label,
    percent,
    tone = 'neutral',
    note,
    source,
    className,
}) => {
    const clamped = Math.max(0, Math.min(100, percent));

    return (
        <div className={className}>
            <p className="mt-3 flex items-baseline gap-2.5">
                {/* Le chiffre est au rang du sujet — 20 px. Il valait 24, qui n'est sur aucune
                    marche de l'échelle (§2.6 : 34 / 28 / 20 / 15 / 13 / 11, et rien d'autre). */}
                <span className="font-brand text-on-surface text-[20px] leading-none font-semibold tabular-nums">
                    {value}
                </span>
                <span className="text-body-large text-text-secondary min-w-0 flex-1 leading-[19px]">
                    {label}
                </span>
            </p>

            <div
                role="img"
                aria-label={`${clamped} %`}
                className="bg-surface-container mt-3.5 h-1.5 overflow-hidden rounded-xs"
            >
                <span
                    className={cn('block h-full rounded-xs', TONE_FILL[tone])}
                    style={{ width: `${clamped}%` }}
                />
            </div>

            {note && (
                <p className="text-body-medium text-text-secondary mt-2 leading-[18px]">{note}</p>
            )}

            {source && (
                <p className="text-label-small text-on-surface-variant mt-2.5 leading-4">
                    {source}
                </p>
            )}
        </div>
    );
};

export default ProportionRow;
