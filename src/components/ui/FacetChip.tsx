import React from 'react';
import { X, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Pastille d'axe — planches **04.1** et **00.4**.
 *
 * **Elle a quitté la bande pour la feuille.** La passe sobre du 02/09 ne dessine
 * plus de rangée de pastilles sous la recherche : `.chips` reste déclaré dans les
 * feuilles de style de 04.1, 05.1 et 03.3, et **aucune des trois ne l'emploie**.
 * Les axes — l'état et ses comptes en tête — sont devenus les groupes de la feuille
 * « Filtrer », et c'est la ligne du décompte qui nomme ce qui est posé. Le dessin de
 * la pastille, lui, n'a pas bougé : c'est la même `.chip` à sa nouvelle place.
 *
 * **Le compteur n'est pas décoratif** : une pastille sans nombre ne dit pas si
 * l'axe vaut d'être touché. Il porte la graisse d'appui sur l'encre secondaire —
 * jamais l'encre pleine, qui appartient au libellé.
 *
 * **Ses mesures, que trois planches écrivent à l'identique** : 40 de haut, 14
 * d'intérieur, rayon 4, **15 sur 20** — la troisième marche de R15 —, gouttière 7,
 * fond `inset`, et la sélection en `dark` pleine.
 *
 * **Ce qui la sépare de `Chip`** (§11) : `Chip` est la puce MD3 de 32 px dont la
 * sélection est **jaune plein** ; celle-ci est la pastille des planches — sélection
 * en **surface inversée**, un décompte en chiffres tabulaires. Le jaune n'y entre
 * pas : le budget de deux jaunes par écran est déjà pris par l'onglet actif et le
 * bouton d'ajout (X12). Deux rôles, deux noms ; un écran non basculé garde `Chip`.
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
            {icon && (
                <Icon glyph={icon} size={18} className={selected ? undefined : TONE_CLASS[tone]} />
            )}
            {label}
            {typeof count === 'number' && (
                <b
                    className={cn(
                        'font-medium tabular-nums',
                        selected ? 'text-[var(--tk-color-on-dark-2)]' : 'text-text-muted',
                    )}
                >
                    {count}
                </b>
            )}
        </>
    );
    const focusRing =
        'outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

    if (selected && onClear) {
        return (
            <span
                className={cn(
                    'bg-inverse-surface text-inverse-on-surface flex min-h-10 shrink-0 items-center rounded-md text-[15px] leading-5 whitespace-nowrap',
                    className,
                )}
            >
                <button
                    type="button"
                    onClick={onClick}
                    aria-pressed="true"
                    className={cn(
                        'flex min-h-10 items-center gap-[7px] rounded-l-md pl-3.5',
                        focusRing,
                    )}
                >
                    {content}
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    aria-label={clearLabel ?? `Retirer le filtre ${label}`}
                    className={cn(
                        'flex min-h-10 w-9 items-center justify-center rounded-r-md hover:bg-white/10',
                        focusRing,
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
                'flex min-h-10 shrink-0 items-center gap-[7px] rounded-md px-3.5 text-[15px] leading-5 whitespace-nowrap',
                focusRing,
                selected
                    ? 'bg-inverse-surface text-inverse-on-surface'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                className,
            )}
        >
            {content}
        </button>
    );
};

export default FacetChip;
