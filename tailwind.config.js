/**
 * Pont Tailwind du TRACKER DS.
 *
 * Chaque entrée pointe vers la COUCHE SÉMANTIQUE `--tk-*` (index.css, tier 2) —
 * jamais vers un primitif ni vers un alias @deprecated `--md-sys-*`.
 * Les NOMS de classes utilitaires (`bg-primary`, `text-on-surface`, `rounded-xl`…)
 * sont volontairement inchangés : ils sont déjà le vocabulaire de l'app, seule
 * leur définition a basculé sur `--tk-*`. Renommer les classes aurait touché des
 * milliers de call sites pour zéro gain (DESIGN_SYSTEM.md §3).
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        // Classes de taille de fenêtre — valeurs figées (600/840/1200/1600).
        // Le vocabulaire compact/medium/expanded est CONSERVÉ : décision reportée,
        // 388 usages sur 45 fichiers (DESIGN_SYSTEM.md §8).
        screens: {
            'compact': { 'max': '599px' },
            'medium': '600px',
            'expanded': '840px',
            'large': '1200px',
            'extra-large': '1600px',
        },
        extend: {

            /* ---- COULEUR ---- */
            colors: {
                // Accent primaire
                primary: {
                    DEFAULT: 'var(--tk-color-primary)',
                    container: 'var(--tk-color-primary-container)',
                    hover: 'var(--tk-color-primary-hover)',
                },
                'on-primary': {
                    DEFAULT: 'var(--tk-color-on-primary)',
                    container: 'var(--tk-color-on-primary-container)',
                },
                // Accent secondaire
                secondary: {
                    DEFAULT: 'var(--tk-color-secondary)',
                    container: 'var(--tk-color-secondary-container)',
                },
                'on-secondary': {
                    DEFAULT: 'var(--tk-color-on-secondary)',
                    container: 'var(--tk-color-on-secondary-container)',
                },
                // Accent tertiaire (= sémantique « positif / succès »)
                tertiary: {
                    DEFAULT: 'var(--tk-color-tertiary)',
                    container: 'var(--tk-color-tertiary-container)',
                },
                'on-tertiary': {
                    DEFAULT: 'var(--tk-color-on-tertiary)',
                    container: 'var(--tk-color-on-tertiary-container)',
                },
                // Erreur
                error: {
                    DEFAULT: 'var(--tk-color-error)',
                    container: 'var(--tk-color-error-container)',
                },
                'on-error': {
                    DEFAULT: 'var(--tk-color-on-error)',
                    container: 'var(--tk-color-on-error-container)',
                },
                // Échelle de référence marque — courte à dessein (Q-V5).
                // SEULE entrée du pont qui expose un PRIMITIF (--ref-brand-*) : aucun
                // call site aujourd'hui, à basculer sur un rôle si un usage apparaît.
                brand: {
                    50: 'var(--ref-brand-50)',
                    100: 'var(--ref-brand-100)',
                    200: 'var(--ref-brand-200)',
                },
                // Remplissage neutre sombre (bouton `tonal`) — rôle sémantique :
                // les classes ne nomment plus le primitif `anthracite`.
                'neutral-fill': {
                    DEFAULT: 'var(--tk-color-neutral-fill)',
                    hover: 'var(--tk-color-neutral-fill-hover)',
                },
                // Texte sur surface de navigation SOMBRE (menu latéral / rail / tiroir)
                'on-nav-surface': {
                    DEFAULT: 'var(--tk-color-on-nav-surface)',
                    variant: 'var(--tk-color-on-nav-surface-variant)',
                },
                background: 'var(--tk-color-background)',
                // Rôle de texte CAT sans équivalent dans l'échelle de surface (Chantier B §4.3,
                // 7,83:1) — text-primary ≡ on-surface, text-muted ≡ on-surface-variant, eux, en ont un
                'text-secondary': 'var(--tk-color-text-secondary)',
                // Statuts (adossés aux tokens --tk-color-*)
                success: {
                    DEFAULT: 'var(--tk-color-success)',
                    light: 'var(--tk-color-success-light)',
                    strong: 'var(--tk-color-success-strong)',
                },
                warning: {
                    DEFAULT: 'var(--tk-color-warning)',
                    light: 'var(--tk-color-warning-light)',
                    strong: 'var(--tk-color-warning-strong)',
                },
                info: {
                    DEFAULT: 'var(--tk-color-info)',
                    light: 'var(--tk-color-info-light)',
                    strong: 'var(--tk-color-info-strong)',
                },
                danger: {
                    DEFAULT: 'var(--tk-color-danger)',
                    light: 'var(--tk-color-danger-light)',
                    strong: 'var(--tk-color-danger-strong)',
                },
                // Surfaces
                surface: {
                    DEFAULT: 'var(--tk-color-surface)',
                    dim: 'var(--tk-color-surface-dim)',
                    bright: 'var(--tk-color-surface-bright)',
                    variant: 'var(--tk-color-surface-variant)',
                },
                'on-surface': {
                    DEFAULT: 'var(--tk-color-on-surface)',
                    variant: 'var(--tk-color-on-surface-variant)',
                },
                // Conteneurs de surface
                'surface-container': {
                    lowest: 'var(--tk-color-surface-container-lowest)',
                    low: 'var(--tk-color-surface-container-low)',
                    DEFAULT: 'var(--tk-color-surface-container)',
                    high: 'var(--tk-color-surface-container-high)',
                    highest: 'var(--tk-color-surface-container-highest)',
                },
                // Contours
                outline: {
                    DEFAULT: 'var(--tk-color-outline)',
                    variant: 'var(--tk-color-outline-variant)',
                },
                // Q-V2 — indicateur de focus unifié (opaque)
                'focus-ring': 'var(--tk-color-focus-ring)',
                // Inversés
                'inverse-surface': 'var(--tk-color-inverse-surface)',
                'inverse-on-surface': 'var(--tk-color-inverse-on-surface)',
                'inverse-primary': 'var(--tk-color-inverse-primary)',
                // Voile
                scrim: 'var(--tk-color-scrim)',

                /* ---- ADN MOBILE v1 (DESIGN_BRIEF.md) — rôles cibles ----
                   Namespace `adn-` le temps de la bascule écran par écran : les rôles
                   canoniques (`text-on-surface`, `bg-surface-container`…) restent en
                   place sur les écrans NON basculés, et ces classes-ci ne servent que
                   les écrans passés à l'ADN. Elles disparaissent en fin de bascule,
                   quand les valeurs `-next` seront reportées dans les rôles canoniques
                   (DESIGN_BRIEF.md §9, « Fin de bascule »). */
                'adn-text': 'var(--tk-color-text-primary-next)',
                'adn-text-secondary': 'var(--tk-color-text-secondary-next)',
                // ⚠️ Q-B1 : 2,57:1 — décoratif/désactivé UNIQUEMENT, jamais du texte.
                'adn-text-muted': 'var(--tk-color-text-muted-next)',
                'adn-line': 'var(--tk-color-border-default-next)',
                'adn-surface-muted': 'var(--tk-color-surface-muted-next)',
                'adn-pressed': 'var(--tk-color-pressed-surface)',
                'adn-danger': 'var(--tk-color-danger-next)',
                'adn-success': 'var(--tk-color-success-next)',
                'adn-warning-light': 'var(--tk-color-warning-light-next)',
                'adn-warning-strong': 'var(--tk-color-warning-strong-next)',
                'adn-on-brand': 'var(--tk-color-brand-text-next)',
            },

            /* ---- ÉLÉVATION (box-shadow) ---- */
            boxShadow: {
                'elevation-0': 'var(--tk-elevation-0)',
                'elevation-1': 'var(--tk-elevation-1)',
                'elevation-2': 'var(--tk-elevation-2)',
                'elevation-3': 'var(--tk-elevation-3)',
                'elevation-4': 'var(--tk-elevation-4)',
                'elevation-5': 'var(--tk-elevation-5)',
            },

            /* ---- FORME (rayons) ---- */
            borderRadius: {
                'none': 'var(--tk-radius-none)',
                'xs': 'var(--tk-radius-xs)',
                'sm': 'var(--tk-radius-sm)',
                'md': 'var(--tk-radius-md)',
                'lg': 'var(--tk-radius-lg)',
                'xl': 'var(--tk-radius-xl)',
                'full': 'var(--tk-radius-full)',
                // Rayon de carte unifié (= rounded-xl / --tk-radius-xl) pour cohérence des surfaces
                'card': 'var(--tk-radius-xl)',
                /* ---- Échelle de l'ADN MOBILE v1 : 10 / 14 / 16 (DESIGN_BRIEF.md §3) ----
                   Conflit ASSUMÉ avec l'échelle canonique 2/4/8/full (§11.1 du brief) :
                   les deux coexistent le temps de la bascule, d'où le namespace `adn-`
                   (`rounded-card` reste à 8 px pour les écrans non basculés). */
                'adn-control': 'var(--tk-radius-control)',
                'adn-card': 'var(--tk-radius-card)',
                'adn-sheet': 'var(--tk-radius-sheet)',
            },

            /* ---- ESPACEMENT (crans nommés du DS) ---- */
            spacing: {
                'page': 'var(--tk-space-page)',
                'page-sm': 'var(--tk-space-page-sm)',
                'card': 'var(--tk-space-card)',
                'card-compact': 'var(--tk-space-card-compact)',
                /* Diamètre du FAB de l'ADN mobile (52 px, DESIGN_BRIEF.md §5). Passe par
                   l'échelle `spacing` pour alimenter w-/h- d'un coup ; les crans
                   d'espacement du brief (20/12/16/24) sont eux sur la grille 4 pt
                   native (p-5, gap-3, p-4, gap-6) — le brief l'acte en §3. */
                'fab': 'var(--tk-size-fab)',
            },

            /* ---- MOUVEMENT ---- */
            transitionTimingFunction: {
                'emphasized': 'var(--tk-motion-easing-emphasized)',
                'emphasized-decelerate': 'var(--tk-motion-easing-emphasized-decelerate)',
                'emphasized-accelerate': 'var(--tk-motion-easing-emphasized-accelerate)',
                'md-standard': 'var(--tk-motion-easing-standard)',
                'standard-decelerate': 'var(--tk-motion-easing-standard-decelerate)',
                'standard-accelerate': 'var(--tk-motion-easing-standard-accelerate)',
            },
            transitionDuration: {
                'short1': 'var(--tk-motion-duration-short1)',
                'short2': 'var(--tk-motion-duration-short2)',
                'short3': 'var(--tk-motion-duration-short3)',
                'short4': 'var(--tk-motion-duration-short4)',
                'medium1': 'var(--tk-motion-duration-medium1)',
                'medium2': 'var(--tk-motion-duration-medium2)',
                'medium3': 'var(--tk-motion-duration-medium3)',
                'medium4': 'var(--tk-motion-duration-medium4)',
                'long1': 'var(--tk-motion-duration-long1)',
                'long2': 'var(--tk-motion-duration-long2)',
            },

            /* ---- TYPOGRAPHIE ---- */
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                brand: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
}
