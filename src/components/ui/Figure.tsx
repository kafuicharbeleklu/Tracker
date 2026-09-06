import React from 'react';
import { cn } from '../../lib/utils';

export type FigureTone = 'bleu' | 'vert' | 'orange' | 'ambre' | 'danger';

/**
 * **Le chiffre et son libellé** — `.qual` de la passe du 05/09 (03.1, 09.1, 10.1,
 * 16.1) : un nombre en Archivo 600 22 / 28, dessous son libellé 14 / 20 en encre
 * secondaire, précédé d'une **pastille carrée de 8** (rayon 2) qui porte la teinte de
 * l'état. Le chiffre ne se peint pas : c'est la pastille qui dit bleu, vert, orange.
 *
 * Trois emplois : posé nu dans une carte qui en aligne trois (« Le parc »), en carte
 * blanche à part entière (`card`, les deux tuiles du porteur), ou en ligne (`inline`,
 * le total en tête de carte : 22 puis un mot en 14). Une figure qui mène quelque part
 * est un bouton ; celle qui énonce reste une boîte.
 */
interface FigureProps {
    value: React.ReactNode;
    label: React.ReactNode;
    /** La teinte de la pastille ; sans teinte, pas de pastille. */
    tone?: FigureTone;
    layout?: 'stack' | 'inline';
    /** Une carte blanche à part entière — rayon 8, 16 d'intérieur. */
    card?: boolean;
    onClick?: () => void;
    'aria-label'?: string;
    className?: string;
}

const DOT: Record<FigureTone, string> = {
    bleu: 'bg-[var(--tk-color-st-bleu)]',
    vert: 'bg-[var(--tk-color-st-vert)]',
    orange: 'bg-[var(--tk-color-st-orange)]',
    ambre: 'bg-[var(--tk-color-st-ambre)]',
    danger: 'bg-[var(--tk-color-st-rouge)]',
};

const Figure: React.FC<FigureProps> = ({
    value,
    label,
    tone,
    layout = 'stack',
    card = false,
    onClick,
    className,
    ...rest
}) => {
    const number = (
        <span className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
            {value}
        </span>
    );
    const caption =
        layout === 'inline' ? (
            <span className="text-on-surface-variant ml-1 text-[14px] leading-5 font-normal">
                {label}
            </span>
        ) : (
            <span className="text-on-surface-variant flex items-center gap-1.5 text-[14px] leading-5 whitespace-nowrap">
                {tone && (
                    <span
                        className={cn('h-2 w-2 shrink-0 rounded-xs', DOT[tone])}
                        aria-hidden="true"
                    />
                )}
                {label}
            </span>
        );

    const shell = cn(
        'min-w-0 text-left',
        layout === 'inline' ? 'inline-flex items-baseline' : 'flex flex-col',
        card && 'rounded-card bg-surface p-4',
        onClick &&
            'focus-visible:ring-focus-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
    );

    if (!onClick) {
        return (
            <div className={shell} aria-label={rest['aria-label']}>
                {number}
                {caption}
            </div>
        );
    }

    return (
        <button type="button" onClick={onClick} className={shell} aria-label={rest['aria-label']}>
            {number}
            {caption}
        </button>
    );
};

export default Figure;
