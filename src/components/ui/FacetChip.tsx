import React from 'react';
import { X, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Pastille d'axe — planches **04.1** et **00.4**.
 *
 * **L'axe sur lequel on filtre presque toujours devient visible.** Sur un parc, la
 * question posée neuf fois sur dix est *qu'est-ce qui est disponible* : elle monte
 * donc en tête d'écran, en pastilles, **avec leur décompte**. Le bouton de filtre
 * garde le reste — famille, emplacement, période — et porte son propre compteur.
 *
 * **Le compteur n'est pas décoratif** : une pastille sans nombre ne dit pas si
 * l'axe vaut d'être touché.
 *
 * **Ce qui la sépare de `Chip`** (§11) : `Chip` est la puce MD3 de 32 px dont la
 * sélection est **jaune plein** ; celle-ci est la pastille des planches — 44 px de
 * haut, sélection en **surface inversée**, un décompte en chiffres tabulaires. Le
 * jaune n'y entre pas : le budget de deux jaunes par écran est déjà pris par
 * l'onglet actif et le bouton d'ajout (X12). Deux rôles, deux noms ; un écran non
 * basculé garde `Chip`.
 */

export type FacetTone = 'positive' | 'info' | 'pending' | 'attention' | 'refused' | 'muted';

const TONE_CLASS: Record<FacetTone, string> = {
    positive: 'text-[var(--tk-color-st-vert)]',
    info: 'text-[var(--tk-color-st-bleu)]',
    pending: 'text-[var(--tk-color-st-ambre)]',
    attention: 'text-[var(--tk-color-st-orange)]',
    refused: 'text-[var(--tk-color-st-rouge)]',
    muted: 'text-[var(--tk-color-st-gris)]',
};

interface FacetChipProps {
    label: string;
    /** Le décompte de l'axe. */
    count?: number;
    /** Le pictogramme de l'état — il double le mot, il ne le remplace pas (I3). */
    icon?: PhosphorGlyph;
    tone?: FacetTone;
    selected?: boolean;
    onClick?: () => void;
    /** Retire directement le filtre actif, sans devoir repasser par la feuille. */
    onClear?: () => void;
    clearLabel?: string;
    className?: string;
}

const FacetChip: React.FC<FacetChipProps> = ({
    label,
    count,
    icon,
    tone = 'muted',
    selected = false,
    onClick,
    onClear,
    clearLabel,
    className,
}) => {
    const content = (
        <>
            {icon && <Icon glyph={icon} size={18} className={selected ? undefined : TONE_CLASS[tone]} />}
            {label}
            {typeof count === 'number' && <b className="font-semibold tabular-nums">{count}</b>}
        </>
    );
    const focusRing =
        'outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

    if (selected && onClear) {
        return (
            <span
                className={cn(
                    'flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-md bg-inverse-surface text-[13px] text-inverse-on-surface',
                    className
                )}
            >
                <button
                    type="button"
                    onClick={onClick}
                    aria-pressed="true"
                    className={cn('flex min-h-10 items-center gap-[7px] rounded-l-md pl-3', focusRing)}
                >
                    {content}
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    aria-label={clearLabel ?? `Retirer le filtre ${label}`}
                    className={cn(
                        'flex min-h-10 w-9 items-center justify-center rounded-r-md hover:bg-white/10',
                        focusRing
                    )}
                >
                    <Icon glyph={X} size={16} />
                </button>
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                'flex min-h-10 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-md px-3 text-[13px]',
                focusRing,
                selected
                    ? 'bg-inverse-surface text-inverse-on-surface'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                className
            )}
        >
            {content}
        </button>
    );
};

export default FacetChip;
