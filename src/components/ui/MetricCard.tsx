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
  className
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
          "bg-surface border border-outline-variant rounded-xl p-3 shadow-elevation-1 flex flex-col gap-1.5 transition-all duration-short4 ease-emphasized group",
          onClick && "cursor-pointer hover:shadow-elevation-2 hover:border-outline active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
          className
        )}
      >
        {/* Titres FR longs : 2 lignes plutôt qu'une troncature (« DEMANDES EN C... ») */}
        <div className="flex items-start justify-between gap-2">
          <p className="section-label min-w-0 line-clamp-2 leading-snug">{title}</p>
          {icon && (
            <div className="shrink-0 text-on-surface-variant group-hover:text-primary transition-colors duration-short4">
              {icon}
            </div>
          )}
        </div>
        <p className="text-title-large font-semibold text-on-surface leading-none">{value}</p>
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
        "bg-surface border border-outline-variant rounded-xl p-5 min-h-[128px] shadow-elevation-1 flex flex-col transition-all duration-short4 ease-emphasized group",
        onClick && "cursor-pointer hover:shadow-elevation-2 hover:border-outline active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">{title}</p>
        {icon && (
          <div className="text-on-surface-variant group-hover:text-primary transition-colors duration-short4">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex-1">
        <p className="text-[1.875rem] font-semibold text-on-surface mb-1 leading-none tracking-normal">{value}</p>
        {subtitle && (
          <p className="text-body-small text-on-surface-variant mt-2">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className={cn(
          "flex items-center gap-1.5 mt-4 text-label-medium",
          trend.direction === 'up' ? "text-tertiary" : "text-error"
        )}>
          <div className={cn(
            "p-1 rounded-md",
            trend.direction === 'up' ? "bg-tertiary-container" : "bg-error-container"
          )}>
            <MaterialIcon name={trend.direction === 'up' ? "trending_up" : "trending_down"} size={14} />
          </div>
          <span>{trend.value > 0 && trend.direction === 'up' ? '+' : ''}{trend.value}%</span>
          {trend.label && (
            <span className="text-on-surface-variant">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
