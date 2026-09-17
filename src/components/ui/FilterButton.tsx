import React from 'react';
import { Funnel } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';
import { useIconGestureSize } from '../../hooks/useIconGestureSize';

/**
 * Le bouton de filtre de la bande de recherche — `.fbtn` des planches **04.1**,
 * **05.1** et **03.3**, qui l'écrivent à l'identique.
 *
 * **Il a le fond du champ qu'il accompagne, pas un filet.** La passe sobre remplit
 * la bande : le champ et le bouton partagent `--inset`, 48 de côté, rayon 4. Le
 * bouton cerné faisait deux formes là où la bande n'en montre qu'une — et les trois
 * écrans qui le portent l'avaient chacun retapé à la main, ce qui suffisait à les
 * faire diverger (deux d'entre eux gardaient le filet, un troisième une pastille
 * ronde).
 *
 * **Dans la ligne d'outils du bureau, il fait 40** comme le champ à côté de lui
 * (17.11) : c'est le gabarit qui le dit, pas la page (`useIconGestureSize`).
 *
 * **La pastille de compte est carrée** — rayon 2, 18 de haut, 11 px en 500 sur
 * l'encre sombre —, et elle mord le coin du bouton de 6 px. Ronde, elle empruntait
 * le vocabulaire des notifications, qui compte des choses non lues, pas des filtres
 * posés.
 */
interface FilterButtonProps {
    onClick: () => void;
    /** Le nombre de filtres posés. Zéro : pas de pastille. */
    count?: number;
    /** Ce que le bouton ouvre, pour le lecteur d'écran. */
    label?: string;
    className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
    onClick,
    count = 0,
    label = 'Filtrer',
    className,
}) => {
    const gestureSize = useIconGestureSize();
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={
                count > 0
                    ? `${label} — ${count} filtre${count > 1 ? 's' : ''} posé${count > 1 ? 's' : ''}`
                    : label
            }
            className={cn(
                'bg-surface-container text-on-surface hover:bg-surface-container-high focus-visible:ring-primary relative flex shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
                gestureSize === 40 ? 'h-10 w-10' : 'h-12 w-12',
                className,
            )}
        >
            <Icon glyph={Funnel} size={20} />
            {count > 0 && (
                <span
                    aria-hidden="true"
                    className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm px-[5px] text-[11px] leading-[18px] font-medium tabular-nums"
                >
                    {count}
                </span>
            )}
        </button>
    );
};

export default FilterButton;
