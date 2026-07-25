import React from 'react';
import { cn } from '../../lib/utils';

export type CanonicalButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'danger'
  | 'nav';
type LegacyButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** MD3 button variants (legacy aliases still accepted for backward compatibility) */
  variant?: CanonicalButtonVariant | LegacyButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Bouton carré sans libellé (action d'icône) : neutralise le padding horizontal
   * du `size` et impose une boîte carrée. Évite la surcharge de largeur, hauteur
   * et padding répétée dans les barres d'application (AUDIT_MOBILE #15).
   */
  iconOnly?: boolean;
  /**
   * Mise en page du contenu. `card` = tuile de choix : hauteur libre, contenu
   * aligné à gauche. Neutralise `justify-center` + la hauteur du `size`, que les
   * assistants et les listes d'options surchargeaient site par site
   * (AUDIT_MOBILE #15). Le fond, le rayon et le padding restent à la charge de
   * l'appelant : ils varient d'une tuile à l'autre.
   */
  layout?: 'inline' | 'card';
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
  tonal: "bg-neutral-fill text-inverse-on-surface shadow-sm hover:bg-neutral-fill-hover disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  outlined: "bg-surface text-on-surface border border-outline-variant shadow-sm hover:bg-background hover:border-outline disabled:border-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  text: "bg-transparent text-text-secondary hover:text-on-surface hover:bg-surface-container disabled:text-on-surface/[0.38]",
  elevated: "bg-surface text-on-surface border border-outline-variant shadow-sm hover:bg-background disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38] disabled:shadow-elevation-0",
  danger: "bg-error text-on-error shadow-sm hover:bg-error/90 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]",
  // Chrome de navigation posé sur les surfaces SOMBRES (sidebar, rail) : le
  // contraste y est inversé, d'où un anneau de focus `primary` au lieu du
  // `focus-ring` anthracite (invisible sur fond sombre). Remplace les surcharges
  // de couleur, de survol et d'anneau posées site par site (AUDIT_MOBILE #15).
  nav: "bg-transparent text-on-nav-surface-variant hover:bg-white/5 hover:text-on-nav-surface focus-visible:ring-primary disabled:text-on-surface/[0.38]",
};

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: "min-h-8 px-3 py-1.5 text-label-medium gap-1.5",
  md: "min-h-10 px-4 py-2 text-label-large gap-2",
  lg: "min-h-11 px-5 py-2.5 text-label-large gap-2",
};

const LAYOUT_STYLES: Record<NonNullable<ButtonProps['layout']>, string> = {
  inline: "",
  card: "h-auto justify-start text-left",
};

/** Boîte carrée d'une action d'icône, par `size` (cf. prop `iconOnly`). */
const ICON_ONLY_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: "w-10 h-10 min-h-10 min-w-10 p-0",
  md: "w-10 h-10 min-h-10 min-w-10 p-0",
  lg: "w-11 h-11 min-h-11 min-w-11 p-0",
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
    iconOnly = false,
    layout = 'inline',
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
      // `touch-target` : hit-box ≥ 48px sur tactile (pointer:coarse), rendu visuel inchangé — voir index.css.
      "touch-target inline-flex items-center justify-center rounded-lg min-w-10 leading-none",
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
        className={cn(
          baseStyles,
          VARIANT_STYLES[resolvedVariant],
          SIZE_STYLES[size],
          LAYOUT_STYLES[layout],
          iconOnly && ICON_ONLY_STYLES[size],
          className
        )}
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

