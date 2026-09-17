import React from 'react';
import { CaretDown } from '@phosphor-icons/react';

import Icon from './Icon';
import Menu, { type MenuItem } from './Menu';
import { cn } from '../../lib/utils';

/**
 * **La pastille à menu de la ligne d'outils du bureau** — 18.1 et 03.3 : « Toutes les
 * natures ▾ », « 30 jours ▾ », « Personne ou objet ▾ ».
 *
 * Au téléphone, un axe de filtre est un **groupe de puces dans la feuille** (R11) : la
 * feuille a la place de les montrer toutes, avec leurs comptes, et on les compare avant
 * de choisir. Au bureau la feuille n'existe pas — la ligne d'outils tient sur une ligne,
 * et un axe à sept valeurs y prendrait la place de la recherche. La pastille dit donc
 * **ce qui est posé**, et son menu montre le reste, comptes compris.
 *
 * **Elle porte la même forme que `FacetChip` en régime `dense`** — 40 de haut, 12
 * d'intérieur, 13 sur 18, cernée sur `--surface`, la sélection en surface inversée. Ce
 * n'est pas une seconde pastille : c'est la même, dont le geste ouvre au lieu de basculer.
 *
 * **Au repos, elle n'est pas retenue.** L'option neutre — « Toutes les natures », « Tout »
 * — laisse la pastille cernée : une pastille sombre annonce un filtre posé, et un axe
 * ouvert n'en est pas un.
 */

export interface FilterMenuOption {
    id: string;
    label: string;
    /** Le décompte de l'axe. Un filtre sans compte se choisit à l'aveugle (16.1). */
    count?: number;
}

interface FilterMenuChipProps {
    /** Le nom de l'axe, pour qui ne voit pas la pastille — « Nature », « Période ». */
    axis: string;
    options: FilterMenuOption[];
    value: string;
    onChange: (id: string) => void;
    /**
     * L'option qui vaut « aucun filtre posé ». Retenue, la pastille reste au repos ; son
     * libellé est celui que la pastille porte alors.
     */
    neutralId: string;
    /**
     * Ce que la pastille dit quand plusieurs valeurs sont retenues — « 3 natures ». Un axe
     * multiple existe : la feuille du téléphone en pose plusieurs, et la pastille du bureau
     * doit dire la vérité plutôt que la première d'entre elles.
     */
    summary?: string;
    /** Un filtre est-il posé ? Par défaut, dès que la valeur n'est plus la neutre. */
    posed?: boolean;
    /** Les valeurs retenues, quand l'axe en accepte plusieurs. Par défaut, `value` seule. */
    selectedIds?: string[];
    className?: string;
}

const FilterMenuChip: React.FC<FilterMenuChipProps> = ({
    axis,
    options,
    value,
    onChange,
    neutralId,
    summary,
    posed,
    selectedIds,
    className,
}) => {
    const retenue = options.find((option) => option.id === value) ?? options[0];
    const pose = posed ?? value !== neutralId;
    const retenus = selectedIds ?? [value];

    const items: MenuItem[] = options.map((option) => ({
        id: option.id,
        label: option.label,
        trailingText: typeof option.count === 'number' ? String(option.count) : undefined,
        selected:
            option.id === neutralId
                ? retenus.length === 0 || retenus.includes(neutralId)
                : retenus.includes(option.id),
        onSelect: () => onChange(option.id),
    }));

    return (
        <Menu
            align="start"
            title={axis}
            items={items}
            trigger={
                <button
                    type="button"
                    aria-label={`${axis} : ${summary ?? retenue?.label ?? ''}`}
                    className={cn(
                        'flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[13px] leading-[18px] font-medium whitespace-nowrap',
                        'focus-visible:ring-focus-ring focus-visible:ring-offset-surface outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        pose
                            ? 'bg-inverse-surface border-inverse-surface text-inverse-on-surface'
                            : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container',
                        className,
                    )}
                >
                    {summary ?? retenue?.label}
                    {!summary && typeof retenue?.count === 'number' && (
                        <b
                            className={cn(
                                'font-normal tabular-nums',
                                pose ? 'text-[var(--tk-color-on-dark-2)]' : 'text-text-muted',
                            )}
                        >
                            {retenue.count}
                        </b>
                    )}
                    <Icon glyph={CaretDown} size={18} />
                </button>
            }
        />
    );
};

export default FilterMenuChip;
