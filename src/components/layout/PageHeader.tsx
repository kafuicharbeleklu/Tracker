import { MEDIA } from '../../constants/breakpoints';
import React from 'react';
import { cn } from '../../lib/utils';
import IconButton from '../ui/IconButton';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  hasMenu?: boolean;
  sticky?: boolean;
  /** Leading navigation icon (e.g. 'arrow_back', 'menu') */
  leadingIcon?: {
    icon: string;
    onClick: () => void;
    label?: string;
  };
  /**
   * Keeps title/subtitle visible in content on compact portrait.
   * By default the TopAppBar title is considered the single source on mobile.
   */
  showContentTitleOnCompact?: boolean;
}

/**
 * Compact portrait affiche le TopAppBar : le titre du PageHeader y est masqué.
 * Les pages qui enveloppent le PageHeader dans leur propre bandeau sticky
 * doivent utiliser ce hook pour ne pas rendre une enveloppe vide (X11).
 */
export const useHasMobileTopBar = (): boolean => {
  const isCompact = useMediaQuery(MEDIA.compact);
  const isLandscape = useMediaQuery(MEDIA.landscape);
  return isCompact && !isLandscape;
};

/**
 * SmartProcure-style page header: compact label/title block with optional actions.
 * Contrat responsive : les actions passent sous le titre jusqu'à expanded
 * (pas d'écrasement du titre en medium) ; en compact portrait le titre est
 * porté par le TopAppBar et le header ne rend que les actions (ou rien).
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  actions,
  sticky = true,
  leadingIcon,
  showContentTitleOnCompact = false,
}) => {
  const hasMobileTopBar = useHasMobileTopBar();
  const hideContentHeader = hasMobileTopBar && !showContentTitleOnCompact;

  if (hideContentHeader && !actions) {
    return null;
  }

  return (
    <div
      className={cn(
        !hideContentHeader && sticky && 'sticky top-0 z-30',
        !hideContentHeader && 'bg-[var(--color-app-bg)]',
        '-mx-page-sm px-page-sm medium:-mx-page medium:px-page',
        hideContentHeader ? 'mb-4 pt-1' : '-mt-4 pt-4 medium:-mt-6 medium:pt-6 mb-5 pb-3',
        'transition-all duration-short4'
      )}
    >
      {!hideContentHeader && breadcrumb && (
        <p className="section-label mb-2">
          {breadcrumb}
        </p>
      )}

      <div
        className={cn(
          hideContentHeader
            ? 'flex items-center justify-end flex-wrap'
            : 'flex flex-col gap-3 expanded:flex-row expanded:items-start expanded:justify-between'
        )}
      >
        {!hideContentHeader && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {leadingIcon && (
              <IconButton
                icon={leadingIcon.icon}
                variant="standard"
                size={24}
                onClick={leadingIcon.onClick}
                className="-ml-2 shrink-0"
                aria-label={leadingIcon.label || 'Retour'}
              />
            )}
            <div className="min-w-0">
              <h1 className="page-title mb-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-body-medium text-[var(--color-text-muted)]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {actions && (
          <div
            className={cn(
              'flex items-center gap-2 medium:gap-3',
              hideContentHeader
                ? 'w-full ml-auto justify-end max-w-full flex-wrap'
                : 'justify-start expanded:justify-end flex-wrap flex-shrink-0'
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};




