import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Material Symbols icon name */
    icon: string;
    /** MD3 Icon Button variant */
    variant?: 'standard' | 'filled' | 'tonal' | 'outlined' | 'nav';
    /** Icon size in dp. Default 24 */
    size?: number;
    /**
     * Taille de la boîte : `default` = 40×40dp (MD3), `dense` = 32×32dp pour les
     * actions posées EN SURIMPRESSION d'un contenu (effacer une signature, etc.).
     * Évite la surcharge de largeur/hauteur (AUDIT_MOBILE #15). La hit-box tactile
     * reste à 48dp via `touch-target`.
     */
    density?: 'default' | 'dense';
    /** Whether the button is in selected/toggled state */
    selected?: boolean;
    /** Whether the icon should be filled (solid) when selected */
    filled?: boolean;
    /** Accessible label (required when no visible text) */
    'aria-label': string;
}

const DENSITY_STYLES: Record<NonNullable<IconButtonProps['density']>, string> = {
    default: 'w-10 h-10',
    dense: 'w-8 h-8',
};

const VARIANT_STYLES: Record<
    NonNullable<IconButtonProps['variant']>,
    { base: string; hover: string; selected: string; selectedHover: string; focusRing?: string }
> = {
    standard: {
        base: 'text-on-surface-variant',
        hover: 'hover:bg-on-surface-variant/[0.08]',
        selected: 'bg-primary text-on-primary',
        selectedHover: 'hover:shadow-elevation-1',
    },
    filled: {
        base: 'bg-surface-container-highest text-on-surface-variant',
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
    // Pendant de `Button variant="nav"` : chrome posé sur les surfaces SOMBRES
    // (sidebar, rail), anneau de focus `primary` car le `focus-ring` anthracite
    // y est invisible.
    nav: {
        base: 'bg-transparent text-on-nav-surface-variant',
        hover: 'hover:bg-white/5 hover:text-on-nav-surface',
        selected: 'bg-primary text-on-primary',
        selectedHover: 'hover:shadow-elevation-1',
        focusRing: 'focus-visible:ring-primary',
    },
};

/**
 * MD3 Icon Button — Standard, Filled, Tonal, and Outlined variants.
 * 40×40dp touch target, 24dp icon, with optional toggle (selected/unselected) state.
 *
 * @see https://m3.material.io/components/icon-buttons/overview
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            icon,
            variant = 'standard',
            size = 24,
            density = 'default',
            selected = false,
            filled: filledProp,
            className,
            disabled,
            ...props
        },
        ref,
    ) => {
        const styles = VARIANT_STYLES[variant];
        const isFilled = filledProp !== undefined ? (selected ? filledProp : false) : selected;

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    // Base: 40×40dp visual, centered icon. `touch-target` porte la hit-box à
                    // 48×48 sur tactile sans changer le visuel (index.css) ; sur coarse il rétablit
                    // aussi overflow:visible pour que state-layer (overflow:hidden) ne clippe pas la zone.
                    'touch-target inline-flex items-center justify-center rounded-lg',
                    'duration-short4 ease-emphasized transition-all',
                    'focus-visible:ring-focus-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-[0.38] disabled:shadow-none',
                    'state-layer active:scale-[0.92]',
                    DENSITY_STYLES[density],
                    // Variant-specific
                    selected ? styles.selected : styles.base,
                    !disabled && (selected ? styles.selectedHover : styles.hover),
                    styles.focusRing,
                    className,
                )}
                {...props}
            >
                <MaterialIcon name={icon} size={size} filled={isFilled} />
            </button>
        );
    },
);

IconButton.displayName = 'IconButton';
export default IconButton;
