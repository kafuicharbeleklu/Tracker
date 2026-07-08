import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface EntityRowProps {
  image?: string;
  imageFit?: 'contain' | 'cover';
  imageFallback?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  location?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  selectionControl?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isSelectable?: boolean;
  /** Visual selected state for list selection */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Rendering mode: default list-row or MD3 card-row */
  variant?: 'list' | 'card';
}

export const EntityRow: React.FC<EntityRowProps> = React.memo(({
  image,
  imageFit = 'contain',
  imageFallback,
  title,
  subtitle,
  location,
  meta,
  status,
  actions,
  selectionControl,
  onClick,
  className,
  isSelectable = true,
  selected = false,
  disabled = false,
  variant = 'list',
}) => {
  const hasLocation = !!location;
  const isCardVariant = variant === 'card';
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const shouldRenderImage = Boolean(image) && !imageFailed;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : 'listitem'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        isCardVariant
          ? 'group flex items-center gap-4 p-4 min-h-[80px] rounded-xl border border-outline-variant/50 bg-surface relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-all duration-short4 shadow-elevation-0'
          : 'group flex items-center gap-4 p-4 min-h-[80px] border-b border-outline-variant/50 last:border-0 relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-all duration-short4',
        selected
          ? (isCardVariant ? 'bg-primary-container/45 border-primary/30' : 'bg-primary-container/45')
          : 'bg-surface',
        isSelectable && !disabled && (
          isCardVariant
            ? 'hover:bg-surface-container hover:shadow-elevation-1 cursor-pointer active:scale-[0.995]'
            : 'hover:bg-surface-container cursor-pointer active:scale-[0.99]'
        ),
        disabled && 'opacity-[0.38] cursor-not-allowed',
        className
      )}
    >
      {selectionControl && (
        <div
          className="shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {selectionControl}
        </div>
      )}

      {/* Image / Avatar Area */}
      <div className="shrink-0">
        {shouldRenderImage ? (
          <div className={cn(
            'overflow-hidden border border-outline-variant flex items-center justify-center',
            isCardVariant
              ? 'w-14 h-14 bg-surface-container rounded-lg'
              : 'w-12 h-12 bg-surface-container rounded-md'
          )}>
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className={cn(
                'w-full h-full',
                imageFit === 'cover'
                  ? 'object-cover'
                  : cn(
                    'object-contain mix-blend-multiply',
                    isCardVariant ? 'p-1.5' : 'p-1'
                  )
              )}
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className={cn(
            'border border-outline-variant flex items-center justify-center text-on-surface-variant',
            isCardVariant
              ? 'w-14 h-14 rounded-lg bg-surface-container'
              : 'w-12 h-12 rounded-md bg-surface-container'
          )}>
            {imageFallback ?? <MaterialIcon name="inventory_2" size={18} className="text-outline" />}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={cn(
        'flex-1 min-w-0 grid gap-2 expanded:gap-4 items-center',
        hasLocation
          ? 'grid-cols-1 expanded:[grid-template-columns:minmax(0,_2.4fr)_minmax(170px,_1fr)_minmax(220px,_1.4fr)]'
          : 'grid-cols-1 expanded:[grid-template-columns:minmax(0,_2fr)_minmax(220px,_1fr)]'
      )}>
        <div className="min-w-0">
          {/* Règle X12 : pas de jaune en couleur de texte sur fond clair — le
              feedback hover est porté par le fond (hover:bg-surface-container) */}
          <h3 className={cn(
            isCardVariant ? 'text-title-medium text-on-surface truncate' : 'text-title-small text-on-surface leading-snug line-clamp-2 medium:line-clamp-1 break-words',
            'transition-colors'
          )}>
            {title}
          </h3>
          {subtitle && (
            <div className={cn(
              'text-on-surface-variant truncate',
              isCardVariant ? 'mt-1 text-body-small' : 'mt-0.5 text-body-small'
            )}>
              {subtitle}
            </div>
          )}
          {/* Statut : empilé sous le nom en compact (jamais tronqué) ; en colonne dédiée dès medium */}
          {status && (
            <div className="mt-1.5 medium:hidden [&>div]:w-auto [&>div]:justify-start [&>div]:pr-0">
              {status}
            </div>
          )}
        </div>

        {location && (
          <div className="hidden expanded:flex min-w-0 h-full items-center self-center text-body-medium text-on-surface-variant">
            {location}
          </div>
        )}

        {meta && (
          <div className={cn(
            'hidden expanded:flex min-w-0 h-full items-center self-center gap-4 pr-4',
            hasLocation ? 'justify-start' : 'justify-end'
          )}>
            {meta}
          </div>
        )}
      </div>

      {/* Status & Action */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className="hidden medium:flex items-center">{status}</div>
        {actions}
        {onClick && !actions && (
          <MaterialIcon name="chevron_right" size={18} className="text-outline group-hover:text-primary transition-colors duration-short4" />
        )}
      </div>
    </div>
  );
});


