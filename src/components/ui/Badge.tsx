import React from 'react';
import { cn } from '../../lib/utils';

export type SemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type BadgeVariant = SemanticTone | 'default';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

/**
 * Carte unique des tons sémantiques des badges (paires light/strong validées Q-V1) :
 * success → vert, warning → orange (≠ jaune marque), danger → rouge, info → bleu,
 * neutral → neutre chaud. Également consommée par StatusBadge — une seule source (C7).
 */
export const TONE_CLASSES: Record<SemanticTone, string> = {
    success: 'bg-success-light text-success-strong',
    warning: 'bg-warning-light text-warning-strong',
    danger: 'bg-danger-light text-danger-strong',
    info: 'bg-info-light text-info-strong',
    neutral: 'bg-surface-container text-on-surface',
};

/** Status / category indicator badge. */
const variants: Record<BadgeVariant, string> = {
    ...TONE_CLASSES,
    default: TONE_CLASSES.neutral,
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
    return (
        <span
            className={cn(
                'text-label-small inline-flex items-center justify-center rounded-md px-2 py-0.5 whitespace-nowrap',
                variants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
};

export default Badge;
