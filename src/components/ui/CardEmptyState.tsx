import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **Le vide d'une carte** — arbitrage du commanditaire, 22/09.
 *
 * *« Je préfère qu'elle ait une taille fixe avec une bonne gestion d'état à vide, que
 * d'avoir la taille grandir en fonction des contenus. »* Le vide tenait en une ligne de
 * 12 ou de 14 sous le titre : la carte se réduisait à 80 px à côté de voisines de 400,
 * et se lisait comme un oubli plutôt que comme un fait.
 *
 * Il prend désormais **le corps de la carte, centré** : la pastille ronde de 48, ce qui
 * est vrai en 16 / 500, ce que cela veut dire en 14, et au plus un geste. Dans une carte
 * de hauteur imposée (la grille du bureau), il remplit la place ; ailleurs, il tient
 * **160 px au moins**.
 *
 * Ce n'est pas `ScreenState` (17.1) : celui-là occupe un écran — pastille de 96, titre
 * de 22. Une carte vide n'est qu'une part de page.
 */
interface CardEmptyStateProps {
    glyph: PhosphorGlyph;
    title: string;
    description?: React.ReactNode;
    /** Le vert de ce qui est en ordre ; le creux neutre pour ce qui n'existe pas encore. */
    tone?: 'neutral' | 'positive';
    /** Un geste, au plus — celui qui remplit la carte. */
    action?: React.ReactNode;
    className?: string;
}

const CardEmptyState: React.FC<CardEmptyStateProps> = ({
    glyph,
    title,
    description,
    tone = 'neutral',
    action,
    className,
}) => (
    <div
        className={cn(
            'flex min-h-40 flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center',
            className,
        )}
    >
        <span
            className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                tone === 'positive'
                    ? 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]'
                    : 'bg-surface-container text-on-surface-variant',
            )}
        >
            <Icon glyph={glyph} size={24} />
        </span>
        <div>
            <p className="text-on-surface text-ts-body leading-ts-body font-medium">{title}</p>
            {description && (
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub mx-auto mt-1 max-w-[280px]">
                    {description}
                </p>
            )}
        </div>
        {action}
    </div>
);

export default CardEmptyState;
