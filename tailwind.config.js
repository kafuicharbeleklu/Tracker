/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        // MD3 Breakpoints (Overriding defaults)
        screens: {
            'compact': { 'max': '599px' },
            'medium': '600px',
            'expanded': '840px',
            'large': '1200px',
            'extra-large': '1600px',
        },
        extend: {

            /* ---- MD3 COLOR SYSTEM ---- */
            colors: {
                // MD3 Primary
                primary: {
                    DEFAULT: 'var(--md-sys-color-primary)',
                    container: 'var(--md-sys-color-primary-container)',
                    hover: 'var(--color-primary-hover)',
                },
                'on-primary': {
                    DEFAULT: 'var(--md-sys-color-on-primary)',
                    container: 'var(--md-sys-color-on-primary-container)',
                },
                // MD3 Secondary
                secondary: {
                    DEFAULT: 'var(--md-sys-color-secondary)',
                    container: 'var(--md-sys-color-secondary-container)',
                },
                'on-secondary': {
                    DEFAULT: 'var(--md-sys-color-on-secondary)',
                    container: 'var(--md-sys-color-on-secondary-container)',
                },
                // MD3 Tertiary
                tertiary: {
                    DEFAULT: 'var(--md-sys-color-tertiary)',
                    container: 'var(--md-sys-color-tertiary-container)',
                },
                'on-tertiary': {
                    DEFAULT: 'var(--md-sys-color-on-tertiary)',
                    container: 'var(--md-sys-color-on-tertiary-container)',
                },
                // MD3 Error
                error: {
                    DEFAULT: 'var(--md-sys-color-error)',
                    container: 'var(--md-sys-color-error-container)',
                },
                'on-error': {
                    DEFAULT: 'var(--md-sys-color-on-error)',
                    container: 'var(--md-sys-color-on-error-container)',
                },
                // Échelle de référence marque — courte à dessein (Q-V5)
                brand: {
                    50: 'var(--ref-brand-50)',
                    100: 'var(--ref-brand-100)',
                    200: 'var(--ref-brand-200)',
                },
                // Couleurs sémantiques (adossées aux tokens --color-*)
                success: {
                    DEFAULT: 'var(--color-success)',
                    light: 'var(--color-success-light)',
                    strong: 'var(--color-success-strong)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    light: 'var(--color-warning-light)',
                    strong: 'var(--color-warning-strong)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    light: 'var(--color-info-light)',
                    strong: 'var(--color-info-strong)',
                },
                danger: {
                    DEFAULT: 'var(--color-danger)',
                    light: 'var(--color-danger-light)',
                    strong: 'var(--color-danger-strong)',
                },
                // MD3 Surface & Background
                surface: {
                    DEFAULT: 'var(--md-sys-color-surface)',
                    dim: 'var(--md-sys-color-surface-dim)',
                    bright: 'var(--md-sys-color-surface-bright)',
                    variant: 'var(--md-sys-color-surface-variant)',
                    // @deprecated — Use surface-container-low instead
                    subtle: 'var(--md-sys-color-surface-container-low)',
                    // @deprecated — Use surface (DEFAULT) instead
                    background: 'var(--md-sys-color-surface)',
                },
                'on-surface': {
                    DEFAULT: 'var(--md-sys-color-on-surface)',
                    variant: 'var(--md-sys-color-on-surface-variant)',
                },
                // MD3 Surface Containers
                'surface-container': {
                    lowest: 'var(--md-sys-color-surface-container-lowest)',
                    low: 'var(--md-sys-color-surface-container-low)',
                    DEFAULT: 'var(--md-sys-color-surface-container)',
                    high: 'var(--md-sys-color-surface-container-high)',
                    highest: 'var(--md-sys-color-surface-container-highest)',
                },
                // MD3 Outline
                outline: {
                    DEFAULT: 'var(--md-sys-color-outline)',
                    variant: 'var(--md-sys-color-outline-variant)',
                },
                // Q-V2 — indicateur de focus unifié (opaque)
                'focus-ring': 'var(--color-focus-ring)',
                // MD3 Inverse
                'inverse-surface': 'var(--md-sys-color-inverse-surface)',
                'inverse-on-surface': 'var(--md-sys-color-inverse-on-surface)',
                'inverse-primary': 'var(--md-sys-color-inverse-primary)',
                // MD3 Scrim
                scrim: 'var(--md-sys-color-scrim)',

                // @deprecated — Use on-surface / on-surface-variant instead
                dark: {
                    DEFAULT: 'var(--md-sys-color-on-surface)',
                    light: 'var(--md-sys-color-on-surface-variant)',
                },
            },

            /* ---- MD3 ELEVATION (Box Shadow) ---- */
            boxShadow: {
                'elevation-0': 'var(--md-sys-elevation-0)',
                'elevation-1': 'var(--md-sys-elevation-1)',
                'elevation-2': 'var(--md-sys-elevation-2)',
                'elevation-3': 'var(--md-sys-elevation-3)',
                'elevation-4': 'var(--md-sys-elevation-4)',
                'elevation-5': 'var(--md-sys-elevation-5)',
            },

            /* ---- MD3 SHAPE SCALE ---- */
            borderRadius: {
                'none': 'var(--md-sys-shape-none)',
                'xs': 'var(--md-sys-shape-extra-small)',
                'sm': 'var(--md-sys-shape-small)',
                'md': 'var(--md-sys-shape-medium)',
                'lg': 'var(--md-sys-shape-large)',
                'xl': 'var(--md-sys-shape-extra-large)',
                'full': 'var(--md-sys-shape-full)',
                // Rayon de carte unifié (= rounded-xl / shape-extra-large) pour cohérence des surfaces
                'card': 'var(--md-sys-shape-extra-large)',
                // @deprecated — Use rounded-full (shape-full) instead
                'pill': 'var(--md-sys-shape-full)',
            },

            /* ---- MD3 SPACING ---- */
            spacing: {
                'page': '1.5rem',
                'page-sm': '1rem',
                'card': '1.5rem',
                'card-compact': '1rem',
            },

            /* ---- MD3 MOTION ---- */
            transitionTimingFunction: {
                'emphasized': 'var(--md-sys-motion-easing-emphasized)',
                'emphasized-decelerate': 'var(--md-sys-motion-easing-emphasized-decelerate)',
                'emphasized-accelerate': 'var(--md-sys-motion-easing-emphasized-accelerate)',
                'md-standard': 'var(--md-sys-motion-easing-standard)',
                'standard-decelerate': 'var(--md-sys-motion-easing-standard-decelerate)',
                'standard-accelerate': 'var(--md-sys-motion-easing-standard-accelerate)',
            },
            transitionDuration: {
                'short1': 'var(--md-sys-motion-duration-short1)',
                'short2': 'var(--md-sys-motion-duration-short2)',
                'short3': 'var(--md-sys-motion-duration-short3)',
                'short4': 'var(--md-sys-motion-duration-short4)',
                'medium1': 'var(--md-sys-motion-duration-medium1)',
                'medium2': 'var(--md-sys-motion-duration-medium2)',
                'medium3': 'var(--md-sys-motion-duration-medium3)',
                'medium4': 'var(--md-sys-motion-duration-medium4)',
                'long1': 'var(--md-sys-motion-duration-long1)',
                'long2': 'var(--md-sys-motion-duration-long2)',
                // @deprecated — Use duration-short2 (200ms) instead
                'micro': '200ms',
                // @deprecated — Use duration-medium1 (300ms) instead
                'macro': '300ms',
            },

            /* ---- MD3 TYPOGRAPHY ---- */
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
