import React from 'react';
import { X } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Barre du haut en régime de sélection — planche **17.2**, passe du 06/09.
 *
 * **Elle remplace la barre du haut, elle ne se superpose pas.** L'écran change de
 * régime ; il ne gagne ni une couche ni un second palier haut (17.8). Elle garde donc
 * les **56 px** de la barre qu'elle remplace, passe à l'inversé pour que le changement
 * se voie sans être lu, et son geste de sortie prend la place du retour.
 *
 * **S3 — le compte se qualifie.** *« 3 sur 17 »*, jamais « 3 » : le dénominateur dit si
 * la sélection est complète. Il se lit d'un coup, sur une ligne, dans la marche de la
 * barre de détail — Archivo 600 sur 17/24 —, et non sur deux lignes de 28 qui faisaient
 * de la barre un titre de page.
 *
 * **« Tout » est un geste à droite**, pas un lien souligné dans une sous-ligne : il
 * bascule vers « Aucun » quand tout est pris, et la bascule est la même cible de 48.
 */

interface SelectionTopBarProps {
    count: number;
    total: number;
    onExit: () => void;
    /** Prendre tout ce que la liste montre. */
    onSelectAll?: () => void;
    /** Tout relâcher — le même geste, une fois tout pris. */
    onClearAll?: () => void;
    /** Le débordement, quand un acte ne tient pas dans le pied (§2.13). */
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
    const toutPris = total > 0 && count >= total;
    const bascule = toutPris ? onClearAll : onSelectAll;

    return (
        <div
            className={cn(
                'bg-inverse-surface text-inverse-on-surface flex min-h-14 items-center gap-1 border-b border-[var(--tk-color-dark-line)] pr-2 pl-1',
                className,
            )}
        >
            <button
                type="button"
                onClick={onExit}
                aria-label="Quitter la sélection"
                className="focus-visible:ring-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] outline-none hover:bg-white/10 focus-visible:ring-2"
            >
                <Icon glyph={X} />
            </button>

            {/* `.cnt` — le compte devient le porte-voix de l'écran : le sujet n'est plus
                la liste, c'est ce qui est coché. */}
            <span
                className="font-brand min-w-0 flex-1 truncate px-1 text-[17px] leading-6 font-semibold tracking-[-0.01em] tabular-nums"
                aria-live="polite"
            >
                {count} sur {total}
            </span>

            {bascule && (
                <button
                    type="button"
                    onClick={bascule}
                    className="focus-visible:ring-primary flex min-h-12 shrink-0 items-center rounded-[4px] px-3 text-[14px] leading-5 font-medium outline-none hover:bg-white/10 focus-visible:ring-2"
                >
                    {toutPris ? 'Aucun' : 'Tout'}
                </button>
            )}

            {overflow}
        </div>
    );
};

export default SelectionTopBar;
