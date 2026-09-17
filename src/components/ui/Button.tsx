import React from 'react';
import { cn } from '../../lib/utils';
import { useIconGestureSize } from '../../hooks/useIconGestureSize';

export type CanonicalButtonVariant =
    'filled' | 'tonal' | 'outlined' | 'ghost' | 'text' | 'elevated' | 'danger' | 'nav';
type LegacyButtonVariant = 'primary' | 'secondary';

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
};

/*
  **Aucune variante ne porte d'ombre.** Les planches dessinent des boutons à plat,
  posés sur leur surface : *« rien ne flotte sauf ce qui flotte »* (17.11) — la
  feuille, le menu, le dialogue, le geste d'ajout. Les variantes pleines, bordées et
  « élevées » portaient une ombre courte héritée de MD3 : relevée sur 87 écrans le
  13/09, et que chaque en-tête du bureau devait retirer à la main.
*/
const VARIANT_STYLES: Record<CanonicalButtonVariant, string> = {
    filled: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    tonal: 'bg-neutral-fill text-inverse-on-surface hover:bg-neutral-fill-hover disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    outlined:
        'bg-surface text-on-surface border border-outline-variant hover:bg-background hover:border-outline disabled:border-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    /* `.btn-ghost` des planches — **le creux, pas le filet.** Quatre écrans le
       demandent, tous pour le même acte : « Tout effacer » à gauche du pied d'une
       feuille de filtre. `ghost` était un alias vers `outlined`, donc du blanc cerné
       posé sur une feuille blanche : deux formes concurrentes dans un pied qui n'en
       montre qu'une, et un filet de plus que la planche. */
    ghost: 'bg-surface-container text-on-surface hover:bg-surface-container-high disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    /* Le bouton texte et le geste d'icône — `.tb` et le « Annuler » d'un pied — sont
       à l'**encre pleine** dans les planches. Ils prenaient l'encre secondaire, un gris
       qu'aucune planche ne dessine (13/09 : « Annuler », « Choisir », « Changer »). */
    text: 'bg-transparent text-on-surface hover:bg-surface-container disabled:text-on-surface/[0.38]',
    elevated:
        'bg-surface text-on-surface border border-outline-variant hover:bg-background disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    danger: 'bg-error text-on-error hover:bg-error/90 disabled:bg-on-surface/[0.12] disabled:text-on-surface/[0.38]',
    // Chrome de navigation posé sur les surfaces SOMBRES (sidebar, rail) : le
    // contraste y est inversé, d'où un anneau de focus `primary` au lieu du
    // `focus-ring` anthracite (invisible sur fond sombre). Remplace les surcharges
    // de couleur, de survol et d'anneau posées site par site (AUDIT_MOBILE #15).
    nav: 'bg-transparent text-on-nav-surface-variant hover:bg-white/5 hover:text-on-nav-surface focus-visible:ring-primary disabled:text-on-surface/[0.38]',
};

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-8 px-3 py-1.5 text-label-medium gap-1.5',
    /* `.btn` de la passe sobre : hauteur 48, rayon 4, **16 px en 500** — la troisième
       marche de R15. Trois planches (03.3, 05.1, 10.1) la déclarent par `--t3` ; la
       taille valait 14, une valeur que l'échelle des quatre marches ne contient pas.
       `sm` et `lg` ne bougent pas : ce sont d'autres boutons que `.btn`. */
    md: 'min-h-12 px-4 py-2 text-[16px] leading-6 font-medium gap-2',
    lg: 'min-h-11 px-5 py-2.5 text-label-large gap-2',
};

const LAYOUT_STYLES: Record<NonNullable<ButtonProps['layout']>, string> = {
    inline: '',
    card: 'h-auto justify-start text-left',
};

/**
 * Boîte carrée d'une action d'icône, par `size` (cf. prop `iconOnly`).
 *
 * **`md` fait 48 × 48**, et c'est la seule mesure que §2.14 déclare pour un bouton
 * d'icône : `.tb` (barre du haut) et `.fbtn` (filtre) y sont tous deux. Elle valait
 * 40 — une valeur que le registre ne connaît pas, et que les **21 emplois** du
 * produit prenaient tous, puisque aucun ne précise sa taille. La cible tactile était
 * déjà à 48 par la couronne `touch-target` ; c'est la **boîte dessinée** qui manquait,
 * et avec elle la coïncidence entre ce qu'on voit et ce qu'on peut viser.
 * Corrigé le 20/08.
 *
 * **La boîte n'impose plus de minimum** (13/09). Le carré retirait le minimum de
 * hauteur du `size` à sa propre valeur, si bien qu'une hauteur de 40 posée par
 * l'appelant ne le battait pas : le bouton restait à 48. Le carré se dit maintenant
 * par sa largeur et sa hauteur seules, que l'appelant peut reprendre. Et dans le
 * chrome du bureau, c'est le gabarit qui passe `md` à 40 (`useIconGestureSize`).
 */
const ICON_ONLY_STYLES: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'w-10 h-10 min-h-0 min-w-0 p-0',
    md: 'w-12 h-12 min-h-0 min-w-0 p-0',
    lg: 'w-11 h-11 min-h-0 min-w-0 p-0',
};

const resolveVariant = (
    variant: ButtonProps['variant'] | string | undefined,
): CanonicalButtonVariant => {
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
    (
        {
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
        },
        ref,
    ) => {
        const resolvedVariant = resolveVariant(variant);
        const gestureSize = useIconGestureSize();
        const isDisabled = Boolean(disabled || loading);
        const leadingIcon = icon ?? startIcon;
        const resolvedIcon = loading ? (
            <span
                className="inline-flex h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-r-transparent"
                aria-hidden="true"
            />
        ) : (
            normalizeIcon(leadingIcon)
        );
        const hasVisibleLabel = React.Children.count(children) > 0;
        /* Le carré de 48 devient 40 dans le chrome du bureau ; `sm` et `lg` sont des
           choix de l'appelant, que le gabarit ne reprend pas. */
        const iconBox =
            size === 'md' && gestureSize === 40 ? ICON_ONLY_STYLES.sm : ICON_ONLY_STYLES[size];

        const baseStyles = cn(
            // `touch-target` : hit-box ≥ 48px sur tactile (pointer:coarse), rendu visuel inchangé — voir index.css.
            'touch-target inline-flex items-center justify-center rounded-md font-medium min-w-10 leading-none',
            'transition-[color,background-color,box-shadow,opacity,transform,filter] duration-short4 ease-emphasized',
            'outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:cursor-not-allowed disabled:pointer-events-none',
            'active:scale-[0.98] select-none whitespace-nowrap',
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
                    iconOnly && iconBox,
                    className,
                )}
                {...props}
            >
                {resolvedIcon && (
                    <span className="inline-flex shrink-0 items-center justify-center">
                        {resolvedIcon}
                    </span>
                )}
                {children}
                {loading && !hasVisibleLabel && <span className="sr-only">{loadingLabel}</span>}
            </button>
        );
    },
);

Button.displayName = 'Button';
export default Button;
