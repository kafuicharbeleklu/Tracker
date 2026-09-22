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
 * **Dans la ligne d'outils du bureau, c'est une pastille qui se nomme** — `.fchip` de
 * 17.11 : 40 de haut comme le champ à côté, fond de surface cerné d'un filet, le mot
 * « Filtrer » en 13 / 500 et le compte des filtres posés à côté, en encre secondaire.
 * Le carré muet du téléphone y laissait deviner ce qu'il ouvrait, quand la place
 * d'écrire existe ; la matrice de 17.11 l'écrit ainsi pour les cinq listes du bureau.
 * C'est le gabarit qui donne la mesure, pas la page (`useIconGestureSize`).
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

    if (gestureSize === 40) {
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
                    'border-outline-variant bg-surface text-on-surface hover:bg-surface-container focus-visible:ring-primary text-ts-sub leading-ts-sub flex h-10 min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
                    className,
                )}
            >
                <Icon glyph={Funnel} size={18} />
                Filtrer
                {count > 0 && (
                    <span
                        aria-hidden="true"
                        className="text-on-surface-variant font-normal tabular-nums"
                    >
                        {count}
                    </span>
                )}
            </button>
        );
    }

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
                /* Au téléphone, le carré de 48 de `.fbtn` ; le bureau est sorti plus haut. */
                'h-12 w-12',
                className,
            )}
        >
            <Icon glyph={Funnel} size={20} />
            {count > 0 && (
                <span
                    aria-hidden="true"
                    className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm px-[5px] text-[0.6875rem] leading-[1.125rem] font-medium tabular-nums"
                >
                    {count}
                </span>
            )}
        </button>
    );
};

export default FilterButton;
