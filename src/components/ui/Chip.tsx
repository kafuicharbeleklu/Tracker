import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

interface ChipProps {
    /** Label text displayed inside the chip */
    label: string;
    /** MD3 chip variant: assist, filter, input, or suggestion */
    variant?: ChipVariant;
    /** Whether the chip is currently selected (filter/input) */
    selected?: boolean;
    /** Whether the chip is disabled */
    disabled?: boolean;
    /** Leading Material Symbols icon name */
    leadingIcon?: string;
    /** Whether to show a close button (input variant) */
    onClose?: () => void;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * MD3 Chip — Assist, Filter, Input, and Suggestion chip variants.
 * Follows Material Design 3 specification:
 * - Compact SmartProcure radius
 * - Surface container-low fill, on-surface text
 * - State layer on hover/focus/press
 * - Selected state uses secondary-container
 * - 8dp height with label-large typography
 */
const Chip: React.FC<ChipProps> = ({
    label,
    variant = 'assist',
    selected = false,
    disabled = false,
    leadingIcon,
    onClose,
    onClick,
    className,
}) => {
    const isInteractive = !!onClick || variant === 'filter';
    const showClose = variant === 'input' && !!onClose;
    const showCheckmark = variant === 'filter' && selected;

    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                // Base — MD3 chip shape & layout
                "inline-flex items-center gap-2 rounded-md px-3 h-8 text-label-large border transition-all duration-short4 ease-emphasized outline-none select-none",
                // Focus ring
                "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                // State layer for interactive chips
                isInteractive && !disabled && "cursor-pointer hover:bg-surface-container",
                // Disabled state
                disabled && "opacity-38 cursor-not-allowed",

                // Variant-specific styles
                selected
                    ? "bg-primary text-on-primary border-transparent hover:bg-primary/90"
                    : "bg-surface-container-low text-on-surface border-outline",

                className
            )}
            aria-pressed={variant === 'filter' ? selected : undefined}
            aria-label={label}
        >
            {/* Leading icon or checkmark */}
            {showCheckmark && (
                <MaterialIcon name="check" size={18} className="text-on-primary" />
            )}
            {leadingIcon && !showCheckmark && (
                <MaterialIcon name={leadingIcon} size={18} />
            )}

            {/* Label */}
            <span>{label}</span>

            {/* Trailing close icon (input variant) */}
            {showClose && (
                <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Supprimer ${label}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose?.();
                        }
                    }}
                    className="ml-0.5 -mr-1 rounded-md p-2 -m-1.5 hover:bg-on-surface/[0.08] transition-colors cursor-pointer"
                >
                    <MaterialIcon name="close" size={16} />
                </span>
            )}
        </button>
    );
};

export default Chip;


