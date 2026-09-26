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

export const EntityRow: React.FC<EntityRowProps> = React.memo(
    ({
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
                        ? 'group border-outline-variant/50 bg-surface focus-visible:ring-focus-ring duration-short4 shadow-elevation-0 relative flex min-h-[80px] items-center gap-4 rounded-xl border p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-inset'
                        : 'group border-outline-variant/50 focus-visible:ring-focus-ring duration-short4 relative flex min-h-[80px] items-center gap-4 border-b p-4 transition-all outline-none last:border-0 focus-visible:ring-2 focus-visible:ring-inset',
                    selected
                        ? isCardVariant
                            ? 'bg-primary-container/45 border-primary/30'
                            : 'bg-primary-container/45'
                        : 'bg-surface',
                    isSelectable &&
                        !disabled &&
                        (isCardVariant
                            ? 'hover:bg-surface-container hover:shadow-elevation-1 cursor-pointer active:scale-[0.995]'
                            : 'hover:bg-surface-container cursor-pointer active:scale-[0.99]'),
                    disabled && 'cursor-not-allowed opacity-[0.38]',
                    className,
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
                        <div
                            className={cn(
                                'border-outline-variant flex items-center justify-center overflow-hidden border',
                                isCardVariant
                                    ? 'bg-surface-container h-14 w-14 rounded-lg'
                                    : 'bg-surface-container h-12 w-12 rounded-md',
                            )}
                        >
                            <img
                                src={image}
                                alt={title}
                                loading="lazy"
                                decoding="async"
                                className={cn(
                                    'h-full w-full',
                                    imageFit === 'cover'
                                        ? 'object-cover'
                                        : cn(
                                              'object-contain mix-blend-multiply',
                                              isCardVariant ? 'p-1.5' : 'p-1',
                                          ),
                                )}
                                onError={() => setImageFailed(true)}
                            />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'border-outline-variant text-on-surface-variant flex items-center justify-center border',
                                isCardVariant
                                    ? 'bg-surface-container h-14 w-14 rounded-lg'
                                    : 'bg-surface-container h-12 w-12 rounded-md',
                            )}
                        >
                            {imageFallback ?? (
                                <MaterialIcon
                                    name="inventory_2"
                                    size={18}
                                    className="text-outline"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div
                    className={cn(
                        'expanded:gap-4 grid min-w-0 flex-1 items-center gap-2',
                        hasLocation
                            ? 'expanded:[grid-template-columns:minmax(0,_2.4fr)_minmax(170px,_1fr)_minmax(220px,_1.4fr)] grid-cols-1'
                            : 'expanded:[grid-template-columns:minmax(0,_2fr)_minmax(220px,_1fr)] grid-cols-1',
                    )}
                >
                    <div className="min-w-0">
                        {/* Règle X12 : pas de jaune en couleur de texte sur fond clair — le
              feedback hover est porté par le fond (hover:bg-surface-container) */}
                        <h3
                            className={cn(
                                isCardVariant
                                    ? 'text-title-medium text-on-surface truncate'
                                    : 'text-title-small text-on-surface medium:line-clamp-1 line-clamp-2 leading-snug break-words',
                                'transition-colors',
                            )}
                        >
                            {title}
                        </h3>
                        {subtitle && (
                            <div
                                className={cn(
                                    'text-on-surface-variant truncate',
                                    isCardVariant
                                        ? 'text-body-small mt-1'
                                        : 'text-body-small mt-0.5',
                                )}
                            >
                                {subtitle}
                            </div>
                        )}
                        {/* Statut : empilé sous le nom en compact (jamais tronqué) ; en colonne dédiée dès medium */}
                        {status && (
                            <div className="medium:hidden mt-1.5 [&>div]:w-auto [&>div]:justify-start [&>div]:pr-0">
                                {status}
                            </div>
                        )}
                    </div>

                    {location && (
                        <div className="expanded:flex text-body-medium text-on-surface-variant hidden h-full min-w-0 items-center self-center">
                            {location}
                        </div>
                    )}

                    {meta && (
                        <div
                            className={cn(
                                'expanded:flex hidden h-full min-w-0 items-center gap-4 self-center pr-4',
                                hasLocation ? 'justify-start' : 'justify-end',
                            )}
                        >
                            {meta}
                        </div>
                    )}
                </div>

                {/* Status & Action */}
                <div className="ml-auto flex shrink-0 items-center gap-3">
                    <div className="medium:flex hidden items-center">{status}</div>
                    {actions}
                    {onClick && !actions && (
                        <MaterialIcon
                            name="chevron_right"
                            size={18}
                            className="text-outline group-hover:text-on-surface duration-short4 transition-colors"
                        />
                    )}
                </div>
            </div>
        );
    },
);
