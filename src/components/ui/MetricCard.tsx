import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    /** Material Symbols icon name */
    icon?: React.ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
        label?: string;
    };
    /** Variante carte demi-hauteur (écrans compacts — X9). Masque subtitle et trend. */
    compact?: boolean;
    onClick?: () => void;
    className?: string;
    /** Couleur sémantique de la valeur (ex. text-error pour « Manquants »). */
    valueClassName?: string;
}

/**
 * MD3 MetricCard — Elevated card style for KPI display.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    compact = false,
    onClick,
    className,
    valueClassName,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    if (compact) {
        return (
            <div
                onClick={onClick}
                onKeyDown={handleKeyDown}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                className={cn(
                    'bg-surface rounded-card duration-short4 ease-emphasized group flex flex-col gap-1.5 p-3 transition-all',
                    onClick &&
                        'hover:bg-surface-container focus-visible:ring-focus-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99]',
                    className,
                )}
            >
                {/* Titres FR longs : 2 lignes plutôt qu'une troncature (« DEMANDES EN C... ») */}
                <div className="flex items-start justify-between gap-2">
                    <p className="text-label-small text-on-surface-variant line-clamp-2 min-w-0">
                        {title}
                    </p>
                    {icon && (
                        <div className="text-on-surface-variant group-hover:text-on-surface duration-short4 shrink-0 transition-colors">
                            {icon}
                        </div>
                    )}
                </div>
                <p className={cn('text-stat-value text-on-surface', valueClassName)}>{value}</p>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={cn(
                'bg-surface rounded-card duration-short4 ease-emphasized group flex min-h-[120px] flex-col p-4 transition-all',
                onClick &&
                    'hover:bg-surface-container focus-visible:ring-focus-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99]',
                className,
            )}
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <p className="section-label">{title}</p>
                {icon && (
                    <div className="text-on-surface-variant group-hover:text-on-surface duration-short4 transition-colors">
                        {icon}
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="flex-1">
                <p className={cn('text-stat-value-mobile text-on-surface mb-1', valueClassName)}>
                    {value}
                </p>
                {subtitle && (
                    <p className="text-body-small text-on-surface-variant mt-2">{subtitle}</p>
                )}
            </div>

            {/* Trend */}
            {trend && (
                <div
                    className={cn(
                        'text-label-medium mt-4 flex items-center gap-1.5',
                        trend.direction === 'up' ? 'text-tertiary' : 'text-error',
                    )}
                >
                    <div
                        className={cn(
                            'rounded-md p-1',
                            trend.direction === 'up'
                                ? 'bg-tertiary-container'
                                : 'bg-error-container',
                        )}
                    >
                        <MaterialIcon
                            name={trend.direction === 'up' ? 'trending_up' : 'trending_down'}
                            size={14}
                        />
                    </div>
                    <span>
                        {trend.value > 0 && trend.direction === 'up' ? '+' : ''}
                        {trend.value}%
                    </span>
                    {trend.label && <span className="text-on-surface-variant">{trend.label}</span>}
                </div>
            )}
        </div>
    );
};
