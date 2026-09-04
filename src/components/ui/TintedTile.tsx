import React from 'react';
import Icon from './Icon';
import { cn } from '../../lib/utils';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

export type TintedTileTone = 'bleu' | 'vert' | 'ambre' | 'orange' | 'danger' | 'neutre';

/**
 * La tuile teintée de la passe sobre (03/09) — `.qual` des planches.
 *
 * Elle sort les chiffres du héro. Avant, une fiche empilait trois métriques dans la
 * bande inversée ; la passe les pose **dessous**, en deux tuiles au plus, chacune
 * d'une paire teintée. Le héro retrouve son sujet, et le chiffre gagne une couleur
 * qui dit sa nature — bleu ce qu'on détient, ambre ce qui attend.
 *
 * Une tuile qui mène quelque part est un bouton ; une tuile qui ne fait qu'énoncer
 * reste une boîte. La différence se voit au curseur, pas au fond.
 *
 * Employée par 05.2 (fiche d'une personne) et 11.1 (accès). Métrique de la planche :
 * rayon 8, padding 16/18, pastille d'icône 32 à fond blanc translucide, chiffre
 * Archivo 600 à 22 px, libellé 12 px.
 */
interface TintedTileProps {
    tone: TintedTileTone;
    glyph: PhosphorGlyph;
    /** Le chiffre, ou le mot qui en tient lieu. Chiffres tabulaires. */
    value: React.ReactNode;
    /** Ce que le chiffre compte, au singulier ou au pluriel selon lui. */
    label: React.ReactNode;
    /**
     * Pleine largeur, en rangée : la valeur à gauche, son libellé à droite, alignés
     * sur la ligne de base. C'est le logement des **valeurs longues** — un prix à
     * sept chiffres ne tient pas dans une demi-tuile (planche 04.2, `.qual .w`).
     */
    wide?: boolean;
    onClick?: () => void;
    className?: string;
}

const TONE: Record<TintedTileTone, string> = {
    bleu: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    vert: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    ambre: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    orange: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    danger: 'bg-[var(--tk-color-tint-danger)] text-[var(--tk-color-on-tint-danger)]',
    /**
     * Le ton d'un **total**, pas d'un état. « 14 actifs au parc » ne se peint pas :
     * ce n'est ni bon, ni en attente, ni cassé — c'est la somme des trois autres.
     * La planche 03.1 le déclare surface pleine, encre normale, et la pastille prend
     * le creux au lieu du blanc translucide, qui serait invisible dessus.
     */
    neutre: 'bg-surface text-on-surface',
};

/** Sur un fond teinté la pastille s'éclaircit ; sur la surface pleine, elle se creuse. */
const CHIP_TONE: Record<TintedTileTone, string> = {
    bleu: 'bg-white/55',
    vert: 'bg-white/55',
    ambre: 'bg-white/55',
    orange: 'bg-white/55',
    danger: 'bg-white/55',
    neutre: 'bg-surface-container',
};

const TintedTile: React.FC<TintedTileProps> = ({
    tone,
    glyph,
    value,
    label,
    wide = false,
    onClick,
    className,
}) => {
    const chip = (
        <span
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]',
                CHIP_TONE[tone],
            )}
        >
            <Icon glyph={glyph} size={18} />
        </span>
    );
    const number = (
        <span className="font-brand text-[22px] leading-7 font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
            {value}
        </span>
    );

    const body = wide ? (
        <>
            {chip}
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                {number}
                <span className="text-[16px] leading-6 opacity-85">{label}</span>
            </span>
        </>
    ) : (
        <>
            {chip}
            <span className="min-w-0">
                <span className="block">{number}</span>
                <span className="mt-0.5 block text-[12px] leading-4 opacity-85">{label}</span>
            </span>
        </>
    );

    const shell = cn(
        'flex min-w-0 rounded-lg px-[18px] py-4 text-left',
        wide ? 'col-span-2 items-center gap-3.5' : 'flex-col gap-2.5',
        TONE[tone],
        className,
    );

    if (!onClick) return <div className={shell}>{body}</div>;

    return (
        <button type="button" onClick={onClick} className={cn(shell, 'cursor-pointer')}>
            {body}
        </button>
    );
};

/**
 * Deux tuiles par ligne. Une tuile `wide` prend la ligne entière — c'est ainsi que
 * 04.2 loge trois repères : deux côte à côte, la valeur monétaire dessous.
 */
export const TintedTileRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-2 gap-3">{children}</div>
);

export default TintedTile;
