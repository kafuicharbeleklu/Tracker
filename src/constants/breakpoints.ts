/**
 * Breakpoints — source unique de vérité (classes de taille de fenêtre MD3).
 *
 * ⚠️ Doit rester aligné avec `tailwind.config.js` (clé `theme.screens`) :
 *   compact (<600), medium (600–839), expanded (≥840), large (≥1200), extra-large (≥1600).
 * Toute la couche JS (useMediaQuery / useBreakpoint) consomme ces valeurs ;
 * ne plus écrire de requête média en dur dans les composants.
 */
export const BREAKPOINTS = {
    compactMax: 599,
    mediumMin: 600,
    mediumMax: 839,
    expandedMin: 840,
    largeMin: 1200,
    extraLargeMin: 1600,
} as const;

export const MEDIA = {
    /** Compact : téléphones (< 600px) */
    compact: `(max-width: ${BREAKPOINTS.compactMax}px)`,
    /** Compact + Medium : sous le seuil expanded (< 840px) */
    belowExpanded: `(max-width: ${BREAKPOINTS.mediumMax}px)`,
    /** Medium : tablettes portrait (600–839px) */
    medium: `(min-width: ${BREAKPOINTS.mediumMin}px) and (max-width: ${BREAKPOINTS.mediumMax}px)`,
    /** Expanded et au-delà (≥ 840px) */
    expandedUp: `(min-width: ${BREAKPOINTS.expandedMin}px)`,
    /** Orientation paysage */
    landscape: '(orientation: landscape)',
    /** Sous expanded, en paysage (téléphone/petite tablette en paysage) */
    belowExpandedLandscape: `(max-width: ${BREAKPOINTS.mediumMax}px) and (orientation: landscape)`,
    /** Pointeur principal avec survol (souris/trackpad) — requis pour les actions hover-reveal */
    hoverCapable: '(hover: hover) and (pointer: fine)',
} as const;

export type MediaKey = keyof typeof MEDIA;
