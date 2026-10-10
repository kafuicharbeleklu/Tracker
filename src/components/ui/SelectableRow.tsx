import React from 'react';
import { Check } from '@phosphor-icons/react';

import Icon from './Icon';
import { useLongPress } from '../../hooks/useLongPress';
import { cn } from '../../lib/utils';

/**
 * **La case de sélection** — planche 17.2, déclaration `.box` / `.ck`.
 *
 * Elle occupe la place exacte de la vignette : **40 px, même position**, pour que le
 * texte de la rangée ne bouge pas d'un point quand le régime change. La case elle-même
 * fait 24 au rayon 4, un filet de 1,5 au repos ; prise, elle se remplit d'encre et porte
 * la coche. Les glyphes carrés de la bibliothèque n'ont ni ce filet ni ce remplissage,
 * et faisaient de la case un dessin parmi d'autres.
 */
export const SelectionBox: React.FC<{
    selected: boolean;
    /** La boîte prend la place d'une vignette de 36 (la file du bureau) : la rangée garde sa hauteur. */
    dense?: boolean;
}> = ({ selected, dense = false }) => (
    <span
        className={cn('flex shrink-0 items-center justify-center', dense ? 'h-9 w-9' : 'h-10 w-10')}
    >
        <span
            className={cn(
                'duration-short3 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] transition-[background-color,box-shadow]',
                selected
                    ? 'bg-inverse-surface text-surface'
                    : 'shadow-[inset_0_0_0_1.5px_var(--tk-color-border-strong)]',
            )}
        >
            {/* La coche arrive avec un léger rebond (26/09). */}
            {selected && <Icon glyph={Check} size={18} className="mvt-pop" />}
        </span>
    </span>
);

/**
 * **Une rangée qui sait entrer en sélection** — planche 17.2, règle S2.
 *
 * *« Une seule entrée : l'appui long »* (arbitré le 06/09), sur téléphone comme sur
 * tablette, et aucune entrée dans un menu. Pendant le régime, la rangée ne s'ouvre plus :
 * elle coche. C'est le même élément qui porte les deux rôles — le point de bascule est la
 * rangée elle-même, pas une poignée qui apparaîtrait à côté.
 *
 * `ListRow` porte cette mécanique pour les listes qui l'emploient ; ce composant la rend
 * aux écrans qui dessinent leurs propres rangées, la file (03.3) et le catalogue (09.1),
 * pour qu'elle ne soit pas réécrite trois fois.
 */
interface SelectableRowProps {
    /** Ouvre l'objet. Jamais appelé pendant une sélection. */
    onOpen: () => void;
    selectionActive: boolean;
    selected: boolean;
    onToggle: () => void;
    /** Entrer en sélection sur cette rangée. */
    onLongPress: () => void;
    className?: string;
    /** L'ancre de la rangée — une file qui avance au clavier la fait venir à l'écran. */
    id?: string;
    /**
     * Ce que la rangée est, en clé (`data-nature`) — pour qui la cherche sans la lire : une
     * rangée sobre n'écrit plus forcément sa nature.
     */
    nature?: string;
    children: React.ReactNode;
}

const SelectableRow: React.FC<SelectableRowProps> = ({
    onOpen,
    selectionActive,
    selected,
    onToggle,
    onLongPress,
    className,
    id,
    nature,
    children,
}) => {
    const appuiLong = useLongPress(selectionActive ? undefined : onLongPress);

    const activer = () => (selectionActive ? onToggle() : onOpen());

    return (
        <div
            id={id}
            data-nature={nature}
            data-rangee
            role={selectionActive ? 'checkbox' : 'button'}
            aria-checked={selectionActive ? selected : undefined}
            tabIndex={0}
            onClick={activer}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activer();
                }
            }}
            {...appuiLong}
            className={className}
        >
            {children}
        </div>
    );
};

export default SelectableRow;
