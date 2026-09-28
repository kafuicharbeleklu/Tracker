import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';

export type TeinteDeTuile = 'vert' | 'bleu' | 'orange' | 'ambre' | 'neutre';

export interface TuileDeCampagne {
    id: string;
    glyph: PhosphorGlyph;
    teinte: TeinteDeTuile;
    label: string;
    valeur: number;
    /** « sur 9 · 22 % » — à côté du chiffre. */
    suffixe?: string;
    /** La phrase sous le chiffre. */
    detail?: string;
    /** Le chiffre et sa phrase passent à l'orange : il y a quelque chose à faire. */
    alerte?: boolean;
    /** Une jauge, de 0 à 100 — la tuile des retrouvés. */
    progression?: number;
    choisie?: boolean;
    onClick?: () => void;
}

const PASTILLE: Record<TeinteDeTuile, string> = {
    vert: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    bleu: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    orange: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    ambre: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    neutre: 'bg-surface-container text-on-surface-variant',
};

/**
 * **Les tuiles de la campagne** (28/09, refonte — « éclater le héros »). Le bloc sombre
 * portait l'état, le lieu, trois chiffres, la jauge et le geste en un seul aplat. Ses
 * chiffres deviennent quatre tuiles claires, chacune teintée par ce qu'elle compte — le vert
 * des retrouvés, le bleu de ce qui reste, l'orange de ce qui demande une décision, l'ambre
 * des fiches corrigées — et **chacune est un filtre** : elle remplace les puces, et la tuile
 * choisie est cerclée.
 */
const TuilesDeCampagne: React.FC<{ tuiles: TuileDeCampagne[]; className?: string }> = ({
    tuiles,
    className,
}) => (
    <section
        aria-label="Où en est le comptage"
        className={cn('grid shrink-0 grid-cols-4 gap-4', className)}
    >
        {tuiles.map((tuile) => (
            <Button
                key={tuile.id}
                variant="text"
                layout="card"
                aria-pressed={tuile.onClick ? Boolean(tuile.choisie) : undefined}
                onClick={tuile.onClick}
                className={cn(
                    'bg-surface hover:bg-surface flex h-auto min-h-0 flex-col items-stretch gap-2 rounded-xl px-[18px] py-4 text-left font-normal whitespace-normal active:scale-100',
                    tuile.choisie && 'shadow-[0_0_0_2px_var(--tk-color-text-primary)]',
                    !tuile.onClick && 'cursor-default',
                )}
            >
                <span className="flex items-center gap-2.5">
                    <span
                        className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            PASTILLE[tuile.teinte],
                        )}
                    >
                        <Icon glyph={tuile.glyph} size={18} />
                    </span>
                    <span className="text-text-secondary min-w-0 flex-1 truncate text-[0.8125rem] leading-[1.125rem] font-medium">
                        {tuile.label}
                    </span>
                    {tuile.choisie && (
                        <span className="text-on-surface text-[0.6875rem] leading-4 font-semibold tracking-[0.04em] uppercase">
                            affiché
                        </span>
                    )}
                </span>
                <span className="flex items-baseline gap-1.5">
                    <span
                        className={cn(
                            'font-brand text-[1.875rem] leading-9 font-semibold tabular-nums',
                            tuile.alerte
                                ? 'text-[var(--tk-color-on-tint-orange)]'
                                : 'text-on-surface',
                        )}
                    >
                        {tuile.valeur}
                    </span>
                    {tuile.suffixe && (
                        <span className="text-text-secondary text-[0.875rem] leading-5 tabular-nums">
                            {tuile.suffixe}
                        </span>
                    )}
                </span>
                {typeof tuile.progression === 'number' ? (
                    <span className="bg-surface-muted-strong block h-1.5 overflow-hidden rounded-full">
                        <span
                            className="mvt-jauge duration-medium2 ease-emphasized block h-full rounded-full bg-[var(--tk-color-st-vert)] transition-[width]"
                            style={{ width: `${Math.min(100, Math.max(0, tuile.progression))}%` }}
                        />
                    </span>
                ) : (
                    tuile.detail && (
                        <span
                            className={cn(
                                'text-[0.75rem] leading-4',
                                tuile.alerte
                                    ? 'font-medium text-[var(--tk-color-on-tint-orange)]'
                                    : 'text-text-secondary',
                            )}
                        >
                            {tuile.detail}
                        </span>
                    )
                )}
            </Button>
        ))}
    </section>
);

export default TuilesDeCampagne;
