import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Destination de navigation — primitive AUTONOME (elle ne wrappe pas `Button`).
 *
 * Pourquoi ne pas réutiliser `Button` : les trois surfaces de nav (barre du bas,
 * rail, tiroir) re-spécifiaient 23 à 33 % des classes qu'il fournit — padding et
 * hauteur du `size`, `justify-center`, direction du flex, couleurs de la
 * variante, anneau de focus, transition — au prix de 82 préfixes `!` à elles
 * seules (AUDIT_MOBILE #15 / §4.2). Ce qui restait partagé se réduisait à la
 * sémantique du bouton, au focus et aux états désactivés : trop peu pour
 * justifier l'héritage. La nav est un composant à part entière, pas un bouton
 * déguisé.
 *
 * Les jeux de classes ci-dessous reproduisent à l'identique le rendu résolu par
 * `cn`/tailwind-merge de l'implémentation précédente (les classes mortes que la
 * surcharge masquait — `px-0`, `min-h-0`, `border-none`, `shadow-none`,
 * `min-w-10` — ne sont plus émises : elles étaient déjà sans effet).
 */
export type NavSurface = 'bar' | 'rail' | 'drawer';

export interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Surface d'accueil : barre du bas (compact), rail (medium), tiroir (expanded). */
    surface: NavSurface;
    /** Destination courante — porte aussi `aria-current="page"` côté appelant. */
    active?: boolean;
    /** Variante resserrée : rail en 48dp, tiroir rétracté en 44dp (icône seule). */
    dense?: boolean;
    children?: React.ReactNode;
}

/** Socle commun : sémantique bouton, cible tactile, focus, états désactivés. */
const NAV_BASE = cn(
    // `touch-target` : hit-box ≥ 48px sur pointeur grossier, sans effet visuel (index.css).
    'touch-target select-none whitespace-nowrap font-bold',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    'active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:pointer-events-none disabled:text-on-surface/[0.38]'
);

/** Anneau de focus : `primary` sur les surfaces sombres, token `focus-ring` sinon. */
const FOCUS_STYLES: Record<NavSurface, string> = {
    bar: 'focus-visible:ring-focus-ring',
    rail: 'focus-visible:ring-primary focus-visible:ring-inset',
    drawer: 'focus-visible:ring-primary focus-visible:ring-inset',
};

const SURFACE_STYLES: Record<NavSurface, string> = {
    bar: cn(
        'relative inline-flex flex-col items-center justify-center rounded-lg',
        'flex-1 h-full min-w-[64px] gap-1',
        'text-label-large bg-transparent hover:text-on-surface',
        'transition-all duration-short4 ease-emphasized'
    ),
    rail: cn(
        'inline-flex flex-col items-center justify-center rounded-lg',
        'text-label-medium bg-transparent',
        'transition-all duration-short4 ease-emphasized'
    ),
    drawer: cn(
        'relative flex items-center overflow-hidden rounded-lg cursor-pointer',
        'text-label-medium',
        'transition-all duration-medium2 ease-emphasized'
    ),
};

/** Géométrie par surface × densité. La barre du bas n'a pas de mode resserré. */
const DENSITY_STYLES: Record<NavSurface, { regular: string; dense: string }> = {
    bar: { regular: '', dense: '' },
    rail: {
        regular: 'w-20 min-h-16 px-2 py-1 gap-1',
        dense: 'w-12 min-h-12 px-1 py-1 gap-0.5',
    },
    drawer: {
        regular: 'w-full min-h-11 px-3 py-2.5 justify-start gap-1.5',
        dense: 'w-11 h-11 min-h-11 min-w-11 self-center mx-auto justify-center gap-0',
    },
};

/**
 * Couleurs par surface × état.
 *
 * Le survol des destinations ACTIVES du rail et du tiroir héritait jusqu'ici de
 * `Button variant="text"` (`hover:bg-surface-container` / `hover:text-on-surface`,
 * soit des tokens de surface CLAIRE) : posé sur le fond sombre du rail, l'effet
 * était incohérent. Il passe ici aux tokens de la surface sombre. Écart de
 * comportement assumé et documenté — le survol n'est capturé par aucune
 * référence visuelle.
 */
const STATE_STYLES: Record<NavSurface, { active: string; inactive: string }> = {
    bar: {
        active: 'text-on-surface hover:bg-surface-container',
        inactive: 'text-text-secondary hover:bg-surface-variant',
    },
    rail: {
        active: 'text-on-nav-surface hover:bg-white/5',
        inactive: 'text-on-nav-surface-variant hover:text-on-nav-surface hover:bg-white/5',
    },
    drawer: {
        active: 'bg-primary text-on-primary ring-0 shadow-sm hover:bg-primary-hover',
        inactive: 'bg-transparent text-on-nav-surface-variant hover:bg-white/5 hover:text-on-nav-surface',
    },
};

const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(
    ({ surface, active = false, dense = false, className, children, type, ...props }, ref) => (
        <button
            ref={ref}
            type={type ?? 'button'}
            className={cn(
                NAV_BASE,
                FOCUS_STYLES[surface],
                SURFACE_STYLES[surface],
                dense ? DENSITY_STYLES[surface].dense : DENSITY_STYLES[surface].regular,
                active ? STATE_STYLES[surface].active : STATE_STYLES[surface].inactive,
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
);

NavButton.displayName = 'NavButton';
export default NavButton;
