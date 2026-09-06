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

/**
 * **Le produit est tenu en dimension mobile, à toutes les largeurs de fenêtre.**
 *
 * Arbitrage du commanditaire, 06/09 : *« pour le moment on veut le projet en dimension
 * mobile »*. Le régime tablette et bureau des planches 00.3 à 00.5 n'est pas abandonné,
 * il est **mis en attente** : les 28 écrans se dessinent au téléphone, et la fenêtre
 * large montre ce téléphone plutôt qu'une seconde mise en page à porter deux fois.
 *
 * L'interrupteur agit à trois endroits, et il faut les trois pour que le rendu soit
 * franc :
 *
 * 1. **Ici**, pour la couche JavaScript : `useMediaQuery` répond comme un téléphone de
 *    393 × 852 en portrait, donc la coque choisit la barre du bas et jamais le rail.
 * 2. **`tailwind.config.js`**, pour la couche CSS : les classes de fenêtre `medium:`,
 *    `expanded:` et `large:` cessent de s'appliquer — 122 emplois d'un coup, qu'aucune
 *    reprise écran par écran n'aurait neutralisés sans oubli.
 * 3. **`index.css`**, pour la mise en page : la colonne du produit tient 393 px et se
 *    centre sur le bureau, avec les surfaces flottantes calées sur elle.
 *
 * Repasser au régime complet : mettre `false` ici **et** dans `tailwind.config.js`.
 */
export const MOBILE_ONLY = true;

/** Le téléphone que le produit joue quand `MOBILE_ONLY` vaut vrai — celui des planches. */
export const MOBILE_ONLY_VIEWPORT = { width: 393, height: 852 } as const;

/**
 * Ce que chaque requête de `MEDIA` vaut sur ce téléphone. `hoverCapable` reste lue sur
 * l'appareil réel : une souris est une souris, même devant un rendu mobile, et les
 * gestes révélés au survol en dépendent.
 */
export const MOBILE_ONLY_ANSWERS: Partial<Record<string, boolean>> = {
    [MEDIA.compact]: true,
    [MEDIA.belowExpanded]: true,
    [MEDIA.medium]: false,
    [MEDIA.expandedUp]: false,
    [MEDIA.landscape]: false,
    [MEDIA.belowExpandedLandscape]: false,
};

export type MediaKey = keyof typeof MEDIA;
