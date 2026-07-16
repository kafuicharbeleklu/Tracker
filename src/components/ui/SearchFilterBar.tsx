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
  placeholder?: string;
  className?: string;
}

/**
 * MD3 Search Bar.
 * Uses surface-container-high background, full rounded shape, and MD3 tokens.
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  onFilterClick,
  filterActive,
  filterPanelId,
  resultCount,
  placeholder = "Rechercher...",
  className
}) => {
  const [localFilterActive, setLocalFilterActive] = React.useState(false);
  const hasCount = resultCount !== undefined;
  const isExternallyControlled = typeof filterActive === 'boolean';
  const isFilterActive = isExternallyControlled ? filterActive : localFilterActive;
  // Always reserve one fixed slot for filter icon to keep all bars consistent.
  const controlCount = (searchValue ? 1 : 0) + (hasCount ? 1 : 0) + 1;
  const trailingSpaceClass = controlCount >= 3
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

  return (
    <div role="search" className={cn("bg-surface border border-outline-variant rounded-xl shadow-elevation-1 transition-shadow duration-short4 hover:shadow-elevation-2 focus-within:shadow-elevation-2", className)}>
      <div className="relative group flex items-center min-h-12">
        {/* Leading icon */}
        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
          <MaterialIcon name="search" size={20} className="text-on-surface-variant group-focus-within:text-primary transition-colors duration-short4" />
        </div>

        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            "w-full h-12 bg-transparent text-on-surface rounded-lg py-0 pl-12 focus:outline-none placeholder-on-surface-variant text-body-medium",
            trailingSpaceClass
          )}
        />

        <div className="absolute right-2 inset-y-0 flex items-center gap-1.5">
          {/* Clear button (shows when text entered) */}
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors duration-short4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Effacer la recherche"
            >
              <MaterialIcon name="close" size={18} />
            </button>
          )}

          {/* Result count chip */}
          {hasCount && (
            <span className="hidden medium:inline-flex h-8 min-w-8 items-center justify-center px-2 rounded-sm bg-surface-container-highest text-label-small text-on-surface-variant border border-outline-variant whitespace-nowrap">
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
              "h-10 w-10 rounded-lg transition-all duration-short4 ease-emphasized flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-focus-ring active:scale-95 state-layer",
              isFilterActive
                ? "bg-primary text-on-primary shadow-elevation-1"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
            aria-label={isFilterActive ? "Masquer les filtres" : "Afficher les filtres"}
            aria-pressed={isFilterActive}
            aria-controls={onFilterClick ? filterPanelId : undefined}
            aria-expanded={onFilterClick ? isFilterActive : undefined}
          >
            <MaterialIcon name="tune" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

