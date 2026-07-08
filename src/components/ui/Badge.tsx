import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Status / category indicator badge.
 * Palette sémantique adossée aux tokens du DS (var(--color-*)) :
 * success → vert, warning → orange (≠ jaune marque), danger → rouge, info → bleu, neutral → neutre chaud.
 */
const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-container text-on-surface',
  success: 'bg-success-light text-success-strong',
  warning: 'bg-warning-light text-warning-strong',
  danger: 'bg-danger-light text-danger-strong',
  info: 'bg-info-light text-info-strong',
  neutral: 'bg-surface-container text-on-surface',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-label-small uppercase whitespace-nowrap",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;

