import React from 'react';
import { cn } from '../../lib/utils';

interface MaterialIconProps {
    /** Material Symbols icon name (e.g. 'dashboard', 'search', 'settings') */
    name: string;
    /** Size in pixels (default: 24) */
    size?: number;
    /** Whether icon should be filled (active state for nav, etc.) */
    filled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Weight of the icon (100-700, default: 400) */
    weight?: number;
}

/**
 * Material Symbols Outlined icon component.
 * Uses the variable font loaded via Google Fonts CDN.
 *
 * @example
 * <MaterialIcon name="dashboard" />
 * <MaterialIcon name="home" filled size={20} />
 */
const MaterialIcon: React.FC<MaterialIconProps> = ({
    name,
    size = 24,
    filled = false,
    className,
    weight = 400,
}) => {
    return (
        <span
            className={cn('material-symbols-outlined select-none', className)}
            style={{
                fontSize: size,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
                lineHeight: 1,
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            aria-hidden="true"
        >
            {name}
        </span>
    );
};

export default MaterialIcon;
