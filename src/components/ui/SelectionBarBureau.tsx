import React, { createContext, useContext } from 'react';
import { X } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Posé par `SelectionBarBureau` : les gestes qu'on lui confie savent qu'ils sont dans la barre
 * du haut, sombre — le ⋮ du débordement s'y ouvre vers le bas, sans creux clair.
 */
export const DansLaBarreDeSelection = createContext(false);
export const useDansLaBarreDeSelection = () => useContext(DansLaBarreDeSelection);

interface SelectionBarBureauProps {
    count: number;
    total: number;
    onExit: () => void;
    onSelectAll?: () => void;
    onClearAll?: () => void;
    /** Les gestes sur la sélection — les mêmes que le pied du téléphone. */
    actions?: React.ReactNode;
    /** Le ⋮ des autres gestes (`BulkOverflow`). */
    overflow?: React.ReactNode;
    className?: string;
}

/**
 * **La sélection groupée au bureau** (26/09) — 17.2 est dessinée au téléphone : une barre
 * sombre remplace l'en-tête, un pied pleine largeur porte les gestes. Posée telle quelle
 * au bureau, elle couvrait la barre latérale, étirait « Exporter » sur 1 348 px et faisait
 * sauter la page (le titre disparaissait, la liste remontait de 64).
 *
 * Au bureau, **le titre reste** ; la ligne d'outils cède la place à cette barre, dans les
 * marges de la page et à sa hauteur (40, 48 au doigt) : la croix, « 2 sur 14 », « Tout »,
 * puis les gestes à leur largeur, à droite — la barre de Gmail et de Linear, dans la
 * teinte sombre de 17.2.
 */
const SelectionBarBureau: React.FC<SelectionBarBureauProps> = ({
    count,
    total,
    onExit,
    onSelectAll,
    onClearAll,
    actions,
    overflow,
    className,
}) => {
    const toutPris = total > 0 && count >= total;
    const bascule = toutPris ? onClearAll : onSelectAll;

    return (
        <div
            role="toolbar"
            aria-label="Sélection"
            className={cn(
                'bg-inverse-surface text-inverse-on-surface mvt-contenu doigt:min-h-12 flex min-h-10 items-center gap-1 rounded-md py-1 pr-1 pl-1',
                className,
            )}
        >
            <button
                type="button"
                onClick={onExit}
                aria-label="Quitter la sélection"
                aria-keyshortcuts="Escape"
                className="focus-visible:ring-primary doigt:h-10 doigt:w-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] outline-none hover:bg-white/10 focus-visible:ring-2"
            >
                <Icon glyph={X} size={18} />
            </button>

            <span
                className="doigt:text-ts-sub doigt:leading-ts-sub min-w-0 truncate px-1.5 text-[0.8125rem] leading-[1.125rem] font-semibold tabular-nums"
                aria-live="polite"
            >
                {count} sur {total}
            </span>

            {bascule && (
                <button
                    type="button"
                    onClick={bascule}
                    className="focus-visible:ring-primary doigt:h-10 doigt:text-ts-sub flex h-8 shrink-0 items-center rounded-[4px] px-2 text-[0.8125rem] leading-[1.125rem] font-medium text-[var(--tk-color-on-dark-2)] outline-none hover:bg-white/10 hover:text-inherit focus-visible:ring-2"
                >
                    {toutPris ? 'Aucun' : 'Tout'}
                </button>
            )}

            <span className="flex-1" />

            {/* Les gestes gardent leur largeur : 32 de haut dans la barre (40 au doigt), 13 en 500. */}
            <DansLaBarreDeSelection.Provider value={true}>
                <div className="doigt:[&_button]:h-10 doigt:[&_button]:min-h-10 flex shrink-0 items-center gap-2 [&_button]:h-8 [&_button]:min-h-8 [&_button]:px-3 [&_button]:text-[0.8125rem] [&_button]:leading-[1.125rem]">
                    {actions}
                </div>
                {overflow}
            </DansLaBarreDeSelection.Provider>
        </div>
    );
};

export default SelectionBarBureau;
