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
        elevated: 'bg-surface',
        filled: 'bg-surface-container',
        outlined: 'bg-surface border border-outline',
    };
    const interactiveVariantStyles = {
        elevated: 'hover:bg-surface-container',
        filled: 'hover:bg-surface-variant',
        outlined: 'hover:bg-surface-container hover:border-outline',
    };

    const resolvedAriaLabel = isInteractive
        ? (ariaLabel ?? (typeof title === 'string' ? title : undefined))
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
                'rounded-card duration-short4 ease-emphasized flex min-h-[80px] flex-col overflow-hidden transition-all',
                variantStyles[variant],
                isInteractive && interactiveVariantStyles[variant],
                // `active:scale` : état pressé annoncé par la doc du composant mais jamais
                // implémenté — aligné sur MetricCard/EntityRow (Tracker DS v1, tâche 1).
                isInteractive &&
                    'focus-visible:ring-focus-ring focus-visible:ring-offset-surface cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99]',
                disabled && 'pointer-events-none opacity-60',
                className,
            )}
        >
            {/* Media slot */}
            {media && <div className="rounded-t-card overflow-hidden">{media}</div>}

            <div className="flex flex-1 flex-col p-4">
                {(title || actionIcon || icon) && (
                    <div className="mb-4 flex min-h-8 items-center justify-between">
                        <div className="flex items-center gap-3">
                            {icon && <div className="text-on-surface-variant">{icon}</div>}
                            {title && (
                                <h3 className="text-title-medium-plain text-on-surface">{title}</h3>
                            )}
                        </div>

                        {actionIcon && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onActionClick?.();
                                }}
                                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container duration-short4 ease-emphasized focus-visible:ring-focus-ring focus-visible:ring-offset-surface -mr-1 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-[0.38]"
                                aria-label={actionLabel || 'Action'}
                                disabled={!onActionClick}
                            >
                                {actionIcon}
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1">{children}</div>
            </div>
        </section>
    );
};

export default React.memo(Card);
