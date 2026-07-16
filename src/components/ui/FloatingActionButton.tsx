import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * MD3 FAB variants.
     * - primary: Primary Container color (Default for main action)
     * - secondary: Secondary Container color (Alternative)
     * - tertiary: Tertiary Container color
     * - surface: Surface color (Low emphasis)
     */
    variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';

    /**
     * FAB sizes.
     * - small: 40dp (Mini FAB)
     * - medium: 56dp (Standard FAB)
     * - large: 96dp (Large FAB)
     */
    size?: 'small' | 'medium' | 'large';

    /**
     * Icon to display. Can be a MaterialIcon name string or a ReactNode.
     */
    icon: string | React.ReactNode;

    /**
     * Optional label for Extended FAB.
     * If provided, the FAB transforms into an Extended FAB.
     */
    label?: string;

    /**
     * If true, the FAB is in a lowered elevation state (e.g. when scrolling).
     */
    lowered?: boolean;
}

/**
 * Material Design 3 Floating Action Button (FAB).
 * Used for the primary action on a screen.
 */
const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
    ({ variant = 'primary', size = 'medium', icon, label, lowered = false, className, ...props }, ref) => {

        // Extended FAB check
        const isExtended = !!label;

        const baseStyles = cn(
            "inline-flex items-center justify-center shrink-0",
            "transition-all duration-short4 ease-emphasized",
            "cursor-pointer overflow-hidden",
            "shadow-elevation-3 hover:shadow-elevation-4 active:shadow-elevation-3", // Standard FAB elevation
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
            // State Layer
            "relative after:absolute after:inset-0 after:bg-current after:opacity-0 hover:after:opacity-[0.08] active:after:opacity-[0.12] after:transition-opacity after:pointer-events-none"
        );

        const variants = {
            primary: "bg-primary-container text-on-primary-container",
            secondary: "bg-secondary-container text-on-secondary-container",
            tertiary: "bg-tertiary-container text-on-tertiary-container",
            surface: "bg-surface-container-high text-primary",
        };

        const sizes = {
            small: "w-10 h-10 rounded-md", // 40dp, shape-medium (12dp)
            medium: "w-14 h-14 rounded-lg", // 56dp, shape-large (16dp)
            large: "w-24 h-24 rounded-xl", // 96dp, shape-extra-large (28dp)
        };

        const extendedStyles = isExtended ? cn(
            "h-14 px-4 rounded-lg w-auto gap-2", // Height 56dp, shape-large (16dp)
            // Typography for Extended FAB (Label Large)
            "text-label-large font-medium"
        ) : "";

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    isExtended ? extendedStyles : sizes[size],
                    lowered && "shadow-elevation-1 hover:shadow-elevation-2",
                    className
                )}
                {...props}
            >
                {/* Icon rendering */}
                <span className={cn(
                    "inline-flex shrink-0 z-10",
                    size === 'large' ? "w-9 h-9" : "w-6 h-6"
                )}>
                    {typeof icon === 'string' ? (
                        <MaterialIcon name={icon} size={size === 'large' ? 36 : 24} />
                    ) : (
                        icon
                    )}
                </span>

                {/* Extended Label rendering */}
                {isExtended && (
                    <span className="z-10 whitespace-nowrap">{label}</span>
                )}
            </button>
        );
    }
);

FloatingActionButton.displayName = 'FloatingActionButton';
export default FloatingActionButton;

