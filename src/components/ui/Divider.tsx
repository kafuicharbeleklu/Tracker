import React from 'react';
import { cn } from '../../lib/utils';

interface DividerProps {
    /** Divider variant */
    variant?: 'full-width' | 'inset' | 'middle';
    /** Vertical divider (for horizontal layouts) */
    vertical?: boolean;
    /** Custom class */
    className?: string;
}

/**
 * MD3 Divider — 1dp line using outline-variant.
 * Supports full-width, inset (16dp start padding), and middle (16dp both sides).
 *
 * @see https://m3.material.io/components/divider/overview
 */
const Divider: React.FC<DividerProps> = ({
    variant = 'full-width',
    vertical = false,
    className,
}) => {
    if (vertical) {
        return (
            <div
                role="separator"
                aria-orientation="vertical"
                className={cn(
                    'bg-outline-variant w-px shrink-0 self-stretch',
                    variant === 'inset' && 'my-4',
                    variant === 'middle' && 'my-4',
                    className,
                )}
            />
        );
    }

    return (
        <hr
            role="separator"
            className={cn(
                'bg-outline-variant h-px shrink-0 border-0',
                variant === 'full-width' && 'w-full',
                variant === 'inset' && 'ml-4',
                variant === 'middle' && 'mx-4',
                className,
            )}
        />
    );
};

export default Divider;
