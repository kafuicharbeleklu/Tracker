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
    /** Les deux colonnes — l'écran `deux:` de Tailwind (25/09). */
    deuxColonnesMin: 1000,
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
    /**
     * La fiche à **deux colonnes** — le héro à gauche, les cartes à droite. Elle vivait
     * en constante privée de `DetailTemplate`, donc hors de la table ci-dessous : sur une
     * fenêtre de bureau elle répondait « oui » et le gabarit posait deux colonnes **dans
     * le cadre de 393 px**. Le héro sortait du cadre à droite et la colonne des cartes
     * tombait entièrement hors champ : les trois fiches paraissaient vides sous leur héro.
     *
     * **1 000, et plus 1 280** (25/09). 1 280 supposait la barre latérale déployée : 1 280 −
     * 240 laissaient 1 040 px aux colonnes. Sur tablette la barre n'existe qu'en rail (80) : un
     * iPad en paysage (1 024 à 1 194) a presque autant de place qu'un bureau de 1 280, et ses
     * fiches restaient sur une colonne étirée. Un premier pas à 1 100 laissait encore l'iPad
     * de 1 024 sur une colonne ; à 1 000, 1 000 − 80 donnent 920 — une liste de 360 et un
     * détail de 536, les deux volets de Material dès 840. Les classes `deux:` (Tailwind)
     * suivent le même seuil : Finances, Paramètres et formulaires attendaient 1 200.
     */
    twoColumn: `(min-width: ${BREAKPOINTS.deuxColonnesMin}px)`,
    /**
     * **Le bureau** — la barre latérale s'y déploie (≥ 1280). En deçà, sur tablette, elle
     * n'existe que repliée (25/09).
     */
    bureau: '(min-width: 1280px)',
    /**
     * **Un panneau tenu** (P2b, 25/09) — de 600 à 999 : la tablette debout, l'iPad partagé,
     * et le paysage sous le seuil des deux colonnes. Une fiche y est un seul panneau : le
     * héro y met ses chiffres en ligne au lieu de tuiles, et les cartes vont par deux.
     */
    panneauTenu: `(min-width: ${BREAKPOINTS.mediumMin}px) and (max-width: ${BREAKPOINTS.deuxColonnesMin - 1}px)`,
} as const;

/**
 * **La mise en attente de la dimension bureau — levée le 08/09.**
 *
 * Le commanditaire avait tenu le produit en dimension mobile à toutes les largeurs le
 * 06/09 (*« pour le moment on veut le projet en dimension mobile »*), le temps que les
 * 45 planches soient dessinées au téléphone. Cette modélisation est finie ; l'ordre du
 * 08/09 est de lever la restriction. La fenêtre large **reprend donc sa mise en page** :
 * le rail plutôt que la barre du bas, les classes de fenêtre à nouveau vivantes, plus de
 * colonne de 393 px centrée sur le bureau.
 *
 * L'interrupteur agissait à trois endroits, et il faut les trois dans le même sens pour
 * que le rendu soit franc :
 *
 * 1. **Ici**, pour la couche JavaScript : à `true`, `useMediaQuery` répondait comme un
 *    téléphone de 393 × 852 en portrait, donc la coque choisissait la barre du bas et
 *    jamais le rail.
 * 2. **`tailwind.config.js`**, pour la couche CSS : à `true`, les classes de fenêtre
 *    `medium:`, `expanded:` et `large:` cessaient de s'appliquer — 122 emplois d'un
 *    coup, qu'aucune reprise écran par écran n'aurait neutralisés sans oubli.
 * 3. **`index.css`** (`.tk-frame`, monté par `MobileFrame`), pour la mise en page : la
 *    colonne du produit tenait 393 px et se centrait sur le bureau, avec les surfaces
 *    flottantes calées sur elle. À `false`, le cadre ne se monte plus et c'est le
 *    document qui redevient le conteneur de défilement — `getAppScroller` le suit.
 *
 * **Ce que la levée ne fait pas** : porter les régimes 00.3 / 00.4 / 00.5. Ce qui
 * apparaît au-delà de 600 px est l'état où le chantier bureau s'était arrêté le 06/09,
 * pas la passe du 08/09 (§2.43 ter). Voir `docs/design/PORTAGE-PLANCHES.md`.
 *
 * Revenir au régime mobile seul : remettre `true` ici **et** dans `tailwind.config.js`.
 */
export const MOBILE_ONLY = false;

/** Le téléphone que le produit jouerait si `MOBILE_ONLY` repassait à vrai — celui des planches. */
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
    [MEDIA.twoColumn]: false,
    [MEDIA.bureau]: false,
    [MEDIA.panneauTenu]: false,
};

export type MediaKey = keyof typeof MEDIA;
