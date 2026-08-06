import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  /** The title of the card */
  title?: string;
  /** Optional decorative icon */
  icon?: React.ReactNode;
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** MD3 Card variant: elevated (default), filled, or outlined */
  variant?: 'elevated' | 'filled' | 'outlined';
  /** Optional action icon in the header */
  actionIcon?: React.ReactNode;
  /** Label for the action icon (accessibility) */
  actionLabel?: string;
  /** Click handler for the action icon */
  onActionClick?: () => void;
  /** Makes the entire card clickable */
  onClick?: () => void;
  /** Optional media element (image/video) displayed above header */
  media?: React.ReactNode;
  /** Optional aria-label when clickable and title is not provided */
  ariaLabel?: string;
  /** Disable clickable behavior while preserving visual content */
  disabled?: boolean;
}

/**
 * Carte du DS (vocabulaire tokens, bordure systématique outline-variant).
 * - Elevated (défaut) : surface + shadow-sm
 * - Filled : surface-container, sans ombre
 * - Outlined : surface, sans ombre
 * Supports clickable cards with focus, hover, and pressed states.
 */
const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  className,
  variant = 'elevated',
  actionIcon,
  actionLabel,
  onActionClick,
  onClick,
  media,
  ariaLabel,
  disabled = false,
}) => {
  const isInteractive = Boolean(onClick) && !disabled;
  const variantStyles = {
    elevated: 'bg-surface border border-outline-variant shadow-sm',
    filled: 'bg-surface-container border border-outline-variant shadow-none',
    outlined: 'bg-surface border border-outline-variant shadow-none',
  };
  const interactiveVariantStyles = {
    elevated: 'hover:bg-background hover:border-outline',
    filled: 'hover:bg-surface hover:border-outline',
    outlined: 'hover:bg-background hover:border-outline',
  };

  const resolvedAriaLabel = isInteractive
    ? ariaLabel ?? (typeof title === 'string' ? title : undefined)
    : undefined;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <section
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={resolvedAriaLabel}
      aria-disabled={disabled || undefined}
      className={cn(
        'rounded-xl flex flex-col min-h-[80px] transition-all duration-short4 ease-emphasized overflow-hidden',
        variantStyles[variant],
        isInteractive && interactiveVariantStyles[variant],
        // `active:scale` : état pressé annoncé par la doc du composant mais jamais
        // implémenté — aligné sur MetricCard/EntityRow (Tracker DS v1, tâche 1).
        isInteractive && 'cursor-pointer active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface outline-none',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* Media slot */}
      {media && (
        <div className="rounded-t-xl overflow-hidden">
          {media}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {(title || actionIcon || icon) && (
          <div className="flex justify-between items-center mb-4 min-h-8">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="text-on-surface-variant">
                  {icon}
                </div>
              )}
              {title && <h3 className="text-title-medium text-on-surface">{title}</h3>}
            </div>

            {actionIcon && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onActionClick?.(); }}
                className="text-on-surface-variant cursor-pointer hover:text-on-surface hover:bg-surface-container h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors duration-short4 ease-emphasized focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0 -mr-1 disabled:opacity-[0.38] disabled:cursor-not-allowed"
                aria-label={actionLabel || "Action"}
                disabled={!onActionClick}
              >
                {actionIcon}
              </button>
            )}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </section>
  );
};

export default React.memo(Card);

