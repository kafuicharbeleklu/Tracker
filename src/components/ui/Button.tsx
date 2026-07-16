import React from 'react';
import { cn } from '../../lib/utils';

export type CanonicalButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger';
type LegacyButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** MD3 button variants (legacy aliases still accepted for backward compatibility) */
  variant?: CanonicalButtonVariant | LegacyButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  /** Legacy alias kept for backward compatibility */
  startIcon?: React.ReactNode;
  /** Shows a loading spinner and disables interactions */
  loading?: boolean;
  /** Accessible fallback label when loading and no visible text exists */
  loadingLabel?: string;
  children?: React.ReactNode;
}

const LEGACY_VARIANT_MAP: Record<LegacyButtonVariant, CanonicalButtonVariant> = {
  primary: 'filled',
  secondary: 'tonal',
  ghost: 'outlined',
};

const VARIANT_STYLES: Record<CanonicalButtonVariant, string> = {
  filled: "bg-primary text-on-primary shadow-sm hover:bg-primary-hover disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  tonal: "bg-[var(--color-anthracite)] text-white shadow-sm hover:bg-[var(--color-anthracite-strong)] disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  outlined: "bg-surface text-[var(--color-text-primary)] border border-[var(--color-border-default)] shadow-sm hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-border-strong)] disabled:border-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  text: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] disabled:text-on-surface/[0.38]",
  elevated: "bg-surface text-[var(--color-text-primary)] border border-[var(--color-border-default)] shadow-sm hover:bg-[var(--color-neutral-50)] disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38] disabled:shadow-elevation-0",
  danger: "bg-error text-on-error shadow-sm hover:bg-error/90 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
};

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: "min-h-8 px-3 py-1.5 text-label-medium gap-1.5",
  md: "min-h-10 px-4 py-2 text-label-large gap-2",
  lg: "min-h-11 px-5 py-2.5 text-label-large gap-2",
};

const resolveVariant = (variant: ButtonProps['variant'] | string | undefined): CanonicalButtonVariant => {
  if (!variant) {
    return 'filled';
  }

  if (variant in LEGACY_VARIANT_MAP) {
    return LEGACY_VARIANT_MAP[variant as LegacyButtonVariant];
  }

  if (variant in VARIANT_STYLES) {
    return variant as CanonicalButtonVariant;
  }

  return 'filled';
};

const normalizeIcon = (icon: React.ReactNode): React.ReactNode => {
  if (!React.isValidElement(icon) || typeof icon.type === 'string') {
    return icon;
  }

  const iconProps = (icon.props ?? {}) as Record<string, unknown>;
  if (iconProps.size !== undefined) {
    return icon;
  }

  return React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, { size: 18 });
};

/**
 * MD3 Button component with canonical variants:
 * Filled, Filled Tonal, Outlined, Text, Elevated.
 * Legacy aliases are mapped for gradual migration.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'filled',
    size = 'md',
    icon,
    startIcon,
    children,
    className,
    disabled,
    loading = false,
    loadingLabel = 'Chargement',
    type,
    ...props
  }, ref) => {
    const resolvedVariant = resolveVariant(variant);
    const isDisabled = Boolean(disabled || loading);
    const leadingIcon = icon ?? startIcon;
    const resolvedIcon = loading
      ? <span className="inline-flex h-[18px] w-[18px] rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
      : normalizeIcon(leadingIcon);
    const hasVisibleLabel = React.Children.count(children) > 0;

    const baseStyles = cn(
      "inline-flex items-center justify-center rounded-lg min-w-10 leading-none",
      "transition-[color,background-color,box-shadow,opacity,transform,filter] duration-short4 ease-emphasized",
      "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      "disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.98] select-none whitespace-nowrap",
      "font-bold"
    );

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(baseStyles, VARIANT_STYLES[resolvedVariant], SIZE_STYLES[size], className)}
        {...props}
      >
        {resolvedIcon && <span className="inline-flex shrink-0 items-center justify-center">{resolvedIcon}</span>}
        {children}
        {loading && !hasVisibleLabel && <span className="sr-only">{loadingLabel}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

