import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Material Symbols icon name */
    icon: string;
    /** MD3 Icon Button variant */
    variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
    /** Icon size in dp. Default 24 */
    size?: number;
    /** Whether the button is in selected/toggled state */
    selected?: boolean;
    /** Whether the icon should be filled (solid) when selected */
    filled?: boolean;
    /** Accessible label (required when no visible text) */
    'aria-label': string;
}

const VARIANT_STYLES = {
    standard: {
        base: 'text-on-surface-variant',
        hover: 'hover:bg-on-surface-variant/[0.08]',
        selected: 'text-primary',
        selectedHover: 'hover:bg-primary/[0.08]',
    },
    filled: {
        base: 'bg-surface-container-highest text-primary',
        hover: 'hover:shadow-elevation-1',
        selected: 'bg-primary text-on-primary',
        selectedHover: 'hover:shadow-elevation-1',
    },
    tonal: {
        base: 'bg-surface-container-high text-on-surface-variant',
        hover: 'hover:shadow-elevation-1',
        selected: 'bg-primary text-on-primary',
        selectedHover: 'hover:shadow-elevation-1',
    },
    outlined: {
        base: 'border border-outline text-on-surface-variant',
        hover: 'hover:bg-on-surface/[0.08]',
        selected: 'bg-inverse-surface text-inverse-on-surface border-transparent',
        selectedHover: 'hover:bg-inverse-surface/90',
    },
};

/**
 * MD3 Icon Button — Standard, Filled, Tonal, and Outlined variants.
 * 48×48dp touch target, 24dp icon, with optional toggle (selected/unselected) state.
 *
 * @see https://m3.material.io/components/icon-buttons/overview
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({
        icon,
        variant = 'standard',
        size = 24,
        selected = false,
        filled: filledProp,
        className,
        disabled,
        ...props
    }, ref) => {

        const styles = VARIANT_STYLES[variant];
        const isFilled = filledProp !== undefined ? (selected ? filledProp : false) : selected;

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    // Base: 48×48dp touch target, centered icon
                    "inline-flex items-center justify-center w-10 h-10 rounded-lg",
                    "transition-all duration-short4 ease-emphasized",
                    "outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                    "disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:shadow-none",
                    "active:scale-[0.92] state-layer",
                    // Variant-specific
                    selected ? styles.selected : styles.base,
                    !disabled && (selected ? styles.selectedHover : styles.hover),
                    className
                )}
                {...props}
            >
                <MaterialIcon
                    name={icon}
                    size={size}
                    filled={isFilled}
                />
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';
export default IconButton;

