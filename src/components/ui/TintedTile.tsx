import React from 'react';
import Icon from './Icon';
import { cn } from '../../lib/utils';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

export type TintedTileTone = 'bleu' | 'vert' | 'ambre' | 'orange' | 'danger';

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
    onClick?: () => void;
    className?: string;
}

const TONE: Record<TintedTileTone, string> = {
    bleu: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    vert: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    ambre: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    orange: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    danger: 'bg-[var(--tk-color-tint-danger)] text-[var(--tk-color-on-tint-danger)]',
};

const TintedTile: React.FC<TintedTileProps> = ({
    tone,
    glyph,
    value,
    label,
    onClick,
    className,
}) => {
    const body = (
        <>
            <span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-white/55">
                <Icon glyph={glyph} size={18} />
            </span>
            <span className="min-w-0">
                <span className="font-brand block text-[22px] leading-7 font-semibold tracking-[-0.015em] tabular-nums">
                    {value}
                </span>
                <span className="mt-0.5 block text-[12px] leading-4 opacity-85">{label}</span>
            </span>
        </>
    );

    const shell = cn(
        'flex min-w-0 flex-col gap-2.5 rounded-lg px-[18px] py-4 text-left',
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

/** Les tuiles vont par deux au plus, côte à côte — jamais trois (planche 05.2). */
export const TintedTileRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-2 gap-3">{children}</div>
);

export default TintedTile;
