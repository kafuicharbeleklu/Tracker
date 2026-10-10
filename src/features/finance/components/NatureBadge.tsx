import React from 'react';

import { cn } from '../../../lib/utils';

/**
 * **La nature d'une ligne du budget, en couleur** (24/09) — CAPEX en bleu, un bien qui
 * dure ; OPEX en ambre, ce qui se renouvelle. Les deux étiquettes étaient grises et ne se
 * distinguaient qu'en lisant quatre capitales ; la teinte les fait reconnaître d'un coup
 * d'œil dans une liste de postes. Les paires fond / encre sont celles du socle.
 */
export const NATURE_TEINTE = {
    CAPEX: {
        badge: 'bg-tint-bleu text-on-tint-bleu',
        barre: 'bg-[var(--tk-color-st-bleu)]',
        option: 'bleu',
    },
    OPEX: {
        badge: 'bg-tint-ambre text-on-tint-ambre',
        barre: 'bg-[var(--tk-color-st-ambre)]',
        option: 'ambre',
    },
} as const;

const NatureBadge: React.FC<{ nature?: 'CAPEX' | 'OPEX' | null; className?: string }> = ({
    nature,
    className,
}) =>
    nature ? (
        <span
            /* Le sigle se dit en clair au survol (10/10). */
            data-infobulle={nature === 'CAPEX' ? 'Investissement' : 'Frais courants'}
            className={cn(
                'inline-flex h-5 items-center rounded-[4px] px-1.5 text-[0.75rem] leading-4 font-medium',
                NATURE_TEINTE[nature].badge,
                className,
            )}
        >
            {nature}
        </span>
    ) : null;

export default NatureBadge;
