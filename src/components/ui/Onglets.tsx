import React from 'react';

import { cn } from '../../lib/utils';

export interface Onglet {
    id: string;
    label: string;
    /** Le compte, quand l'onglet en porte un — l'historique n'en porte pas. */
    count?: number;
}

interface OngletsProps {
    items: Onglet[];
    active: string;
    onSelect: (id: string) => void;
    /** Ce que les onglets partagent — « Partition de la file ». */
    label: string;
    className?: string;
}

/**
 * **Les onglets segmentés** (26/09) — trois vues d'une même liste, posées à côté du titre au
 * bureau : un creux de rayon 4 et 3 d'intérieur, l'onglet retenu en surface claire et
 * légèrement levée. 13 sur 18 en 500 ; le compte en encre tertiaire, à l'encre sur l'onglet
 * retenu. Premier emploi : Tâches (« À faire · À suivre · Historique »).
 *
 * Ce sont des boutons à état (`aria-pressed`) et non des onglets ARIA : ils filtrent la même
 * liste, ils n'ouvrent pas de panneau à eux.
 */
const Onglets: React.FC<OngletsProps> = ({ items, active, onSelect, label, className }) => (
    <div
        role="group"
        aria-label={label}
        className={cn('bg-surface-muted-strong inline-flex gap-0.5 rounded-md p-[3px]', className)}
    >
        {items.map((item) => {
            const retenu = item.id === active;
            return (
                <button
                    key={item.id}
                    type="button"
                    aria-pressed={retenu}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                        'duration-short3 flex items-center rounded-[4px] px-3 py-[5px] text-[0.8125rem] leading-[1.125rem] font-medium whitespace-nowrap transition-[background-color,color,box-shadow]',
                        'focus-visible:ring-focus-ring outline-none focus-visible:ring-2',
                        retenu
                            ? 'bg-surface text-on-surface shadow-[0_1px_2px_rgba(10,25,29,0.1)]'
                            : 'text-text-secondary hover:text-on-surface',
                    )}
                >
                    {item.label}
                    {typeof item.count === 'number' && (
                        <span
                            className={cn(
                                'ml-1.5 tabular-nums',
                                retenu ? 'text-on-surface' : 'text-text-tertiary',
                            )}
                        >
                            {item.count}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

export default Onglets;
