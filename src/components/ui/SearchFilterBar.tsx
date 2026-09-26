import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface SearchFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onFilterClick?: () => void;
    filterActive?: boolean;
    filterPanelId?: string;
    resultCount?: number;
    /** Nombre de filtres ACTIFS — pastille sur le bouton filtre (DESIGN_BRIEF.md §4 :
      « un bouton filtre unique avec compteur + chips des filtres actifs »).
      Absent ou 0 : aucune pastille, rendu strictement inchangé. */
    filterCount?: number;
    placeholder?: string;
    className?: string;
    /** Classes appliquées au bouton filtre (habillage ADN : rayon, couleurs d'état). */
    filterButtonClassName?: string;
}

/**
 * MD3 Search Bar.
 * Uses surface-container-high background, pill shape, and MD3 tokens.
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
    searchValue,
    onSearchChange,
    onFilterClick,
    filterActive,
    filterPanelId,
    resultCount,
    filterCount = 0,
    placeholder = 'Rechercher...',
    className,
    filterButtonClassName,
}) => {
    const [localFilterActive, setLocalFilterActive] = React.useState(false);
    const hasCount = resultCount !== undefined;
    const isExternallyControlled = typeof filterActive === 'boolean';
    const isFilterActive = isExternallyControlled ? filterActive : localFilterActive;
    // Always reserve one fixed slot for filter icon to keep all bars consistent.
    const hasFilterCount = filterCount > 0;
    const controlCount = (searchValue ? 1 : 0) + (hasCount ? 1 : 0) + 1 + (hasFilterCount ? 1 : 0);
    const trailingSpaceClass =
        controlCount >= 3
            ? 'pr-44 medium:pr-48'
            : controlCount === 2
              ? 'pr-32 medium:pr-36'
              : 'pr-16 medium:pr-20';

    const handleFilterAction = () => {
        if (onFilterClick) {
            onFilterClick();
        }
        if (!isExternallyControlled) {
            setLocalFilterActive((prev) => !prev);
        }
    };

    // Le champ natif porte `focus:outline-none` : sans relais, le focus clavier n'était
    // signalé que par une élévation (contraste insuffisant pour un indicateur de focus).
    // L'anneau est porté par le conteneur, qui est la forme perçue du champ, et ciblé sur
    // `input:focus-visible` pour ne pas doubler l'anneau propre des boutons de la barre
    // (Tracker DS v1, tâche 1).
    return (
        <div
            role="search"
            className={cn(
                'bg-surface border-outline-variant shadow-elevation-1 duration-short4 hover:shadow-elevation-2 focus-within:shadow-elevation-2 has-[input:focus-visible]:ring-focus-ring rounded-xl border transition-shadow has-[input:focus-visible]:ring-2',
                className,
            )}
        >
            <div className="group relative flex min-h-12 items-center">
                {/* Leading icon */}
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <MaterialIcon
                        name="search"
                        size={20}
                        className="text-on-surface-variant group-focus-within:text-on-surface duration-short4 transition-colors"
                    />
                </div>

                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className={cn(
                        'text-on-surface placeholder-on-surface-variant text-body-medium h-12 w-full rounded-lg bg-transparent py-0 pl-12 focus:outline-none',
                        trailingSpaceClass,
                    )}
                />

                <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                    {/* Clear button (shows when text entered) */}
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="text-on-surface-variant hover:bg-surface-container duration-short4 focus-visible:ring-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
                            aria-label="Effacer la recherche"
                        >
                            <MaterialIcon name="close" size={18} />
                        </button>
                    )}

                    {/* Result count chip */}
                    {hasCount && (
                        <span className="medium:inline-flex bg-surface-container-highest text-label-small text-on-surface-variant border-outline-variant hidden h-8 min-w-8 items-center justify-center rounded-sm border px-2 whitespace-nowrap">
                            {resultCount}
                        </span>
                    )}

                    {/* Trailing filter button (always visible for consistency) */}
                    <button
                        type="button"
                        onClick={handleFilterAction}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleFilterAction();
                            }
                        }}
                        className={cn(
                            'duration-short4 ease-emphasized focus-visible:ring-focus-ring state-layer flex h-10 w-10 items-center justify-center rounded-lg transition-all outline-none focus-visible:ring-2 active:scale-95',
                            isFilterActive
                                ? 'bg-primary text-on-primary shadow-elevation-1'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                            hasFilterCount && 'w-auto min-w-10 gap-1 px-2',
                            filterButtonClassName,
                        )}
                        aria-label={
                            hasFilterCount
                                ? `Filtres (${filterCount} actif${filterCount > 1 ? 's' : ''})`
                                : isFilterActive
                                  ? 'Masquer les filtres'
                                  : 'Afficher les filtres'
                        }
                        aria-pressed={isFilterActive}
                        aria-controls={onFilterClick ? filterPanelId : undefined}
                        aria-expanded={onFilterClick ? isFilterActive : undefined}
                    >
                        <MaterialIcon name="tune" size={18} />
                        {/* Compteur de filtres actifs : chiffre en clair, pas une pastille muette —
                l'information « combien » doit être lisible sans ouvrir la feuille. */}
                        {hasFilterCount && (
                            <span className="text-label-medium tabular-nums">{filterCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
