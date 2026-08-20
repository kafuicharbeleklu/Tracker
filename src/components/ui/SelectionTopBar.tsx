import React from 'react';
import { X } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Barre du haut en régime de sélection — planche **17.2**.
 *
 * **Elle remplace la barre du haut, elle ne se superpose pas.** L'écran change de
 * régime ; il ne gagne pas une couche. Le geste de sortie prend la place du retour,
 * et la surface passe à l'inversé pour que le changement se voie sans être lu.
 *
 * **S3 — le compte se qualifie.** « 5 sélectionnés **sur 17** », jamais « 5 » : le
 * dénominateur est ce qui permet de juger si la sélection est complète. En régime
 * de sélection, le compte devient le **porte-voix** de l'écran — le sujet n'est plus
 * la liste, c'est ce qui est coché.
 */

interface SelectionTopBarProps {
    count: number;
    total: number;
    onExit: () => void;
    /** « Tout sélectionner » / « Tout désélectionner » — le second geste de la sous-ligne. */
    onSelectAll?: () => void;
    onClearAll?: () => void;
    /** Le débordement : les actes qui ne tiennent pas dans le pied (§2.13). */
    overflow?: React.ReactNode;
    className?: string;
}

const SelectionTopBar: React.FC<SelectionTopBarProps> = ({
    count,
    total,
    onExit,
    onSelectAll,
    onClearAll,
    overflow,
    className,
}) => {
    const allSelected = total > 0 && count >= total;
    const toggleAll = allSelected ? onClearAll : onSelectAll;
    const toggleAllLabel = allSelected ? 'Tout désélectionner' : 'Tout sélectionner';

    return (
        <div
            className={cn(
                'bg-inverse-surface text-inverse-on-surface flex min-h-[72px] items-center gap-1 border-b border-white/[0.14] px-2 py-1',
                className,
            )}
        >
            <button
                type="button"
                onClick={onExit}
                aria-label="Quitter la sélection"
                className="touch-target focus-visible:ring-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2"
            >
                <Icon glyph={X} />
            </button>

            <div className="min-w-0 flex-1 px-1" aria-live="polite">
                <span className="font-brand block text-[28px] leading-[31px] font-semibold tracking-tight tabular-nums">
                    {count} {count > 1 ? 'sélectionnés' : 'sélectionné'}
                </span>
                <span className="text-label-small text-on-nav-surface-variant block font-normal">
                    sur {total}
                    {toggleAll && (
                        <>
                            {' · '}
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="touch-target focus-visible:ring-primary rounded-xs underline underline-offset-2 outline-none focus-visible:ring-2"
                            >
                                {toggleAllLabel}
                            </button>
                        </>
                    )}
                </span>
            </div>

            {overflow}
        </div>
    );
};

export default SelectionTopBar;
