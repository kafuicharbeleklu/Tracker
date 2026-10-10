import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge ne connaît pas le vocabulaire maison du design system : sans
 * déclaration, tout `text-<inconnu>` est classé couleur et le typescale MD3
 * avalerait les couleurs de texte (cf. docs/AUDIT_DESIGN_SYSTEM.md §11.4).
 * Toute future classe maison à préfixe utilitaire (`text-*`, `shadow-*`, …)
 * doit être déclarée ici — synchro vérifiée par `scripts/check-cn-merge.mjs`.
 */
/**
 * Espacements MD3 nommés (tailwind.config.js `spacing`). Sans déclaration,
 * tailwind-merge ne voit pas que `p-card` et `px-4` visent la même propriété :
 * les deux classes sont émises et c'est l'ordre du CSS qui tranche — ce qui
 * obligeait les appelants à écrire un `!` pour reprendre la main.
 */
const SPACING_TOKENS = ['page', 'page-sm', 'card', 'card-compact', 'fab'];
const SPACING_PREFIXES = [
    'p',
    'px',
    'py',
    'pt',
    'pr',
    'pb',
    'pl',
    'ps',
    'pe',
    'm',
    'mx',
    'my',
    'mt',
    'mr',
    'mb',
    'ml',
    'ms',
    'me',
    'gap',
    'gap-x',
    'gap-y',
] as const;

/**
 * **L'échelle par régime** — six rôles dont la taille et l'interligne changent au bureau
 * (index.css, 22/09) : titre de page, titre de feuille, titre de rangée, corps, geste,
 * secondaire.
 */
const TYPE_SCALE_ROLES = ['page', 'sheet', 'head', 'body', 'control', 'sub'];

const spacingClassGroups = Object.fromEntries(
    SPACING_PREFIXES.map((prefix) => [prefix, [{ [prefix]: SPACING_TOKENS }]]),
);

const twMerge = extendTailwindMerge({
    extend: {
        /**
         * Échelles maison connues de tailwind-merge. `radius` couvre d'un coup tous
         * les groupes `rounded-*`, `spacing` tous les groupes dimensionnels (w-, h-,
         * p-, m-, gap-…) : sans ça, `rounded-adn-card` ne chasse pas le `rounded-xl`
         * d'une primitive et les deux classes sont émises — c'est l'ordre du CSS qui
         * tranche, donc le `!` de reprise en main (AUDIT_MOBILE #15).
         */
        theme: {
            // Échelle de l'ADN mobile (DESIGN_BRIEF.md §3) — 10 / 14 / 16.
            // `card` et `vignette` (10/10) : les deux rayons de rôle du système. Sans eux,
            // un bouton en forme de carte gardait le `rounded-md` de la primitive à côté de
            // `rounded-card`, et l'ordre du CSS rendait 4 px au lieu de 8 — les tuiles d'une
            // campagne, celles du catalogue et des emplacements.
            radius: ['adn-control', 'adn-card', 'adn-sheet', 'card', 'vignette'],
            // Diamètre du FAB de l'ADN (52 px) : doit chasser le `w-14 h-14` du size.
            spacing: ['fab'],
        },
        classGroups: {
            ...spacingClassGroups,
            // Typescale MD3 (index.css) : des tailles de texte, pas des couleurs.
            'font-size': [
                {
                    text: [
                        'display-large',
                        'display-medium',
                        'display-small',
                        'headline-large',
                        'headline-medium',
                        'headline-small',
                        'title-large',
                        'title-medium',
                        'title-small',
                        'body-large',
                        'body-medium',
                        'body-small',
                        'label-large',
                        'label-medium',
                        'label-small',
                        'stat-value',
                        // Rôles de l'ADN mobile (index.css, DESIGN_BRIEF.md §2)
                        'stat-value-mobile',
                        'headline-medium-plain',
                        'title-medium-plain',
                        'label-large-plain',
                        'label-small-plain',
                        // L'échelle par régime (index.css, `@utility text-ts-*`, 22/09).
                        ...TYPE_SCALE_ROLES.map((role) => `ts-${role}`),
                    ],
                },
            ],
            // …et son interligne : `leading-ts-body` doit chasser un `leading-6`.
            leading: [{ leading: TYPE_SCALE_ROLES.map((role) => `ts-${role}`) }],
            // Élévations MD3 (tailwind.config.js boxShadow) : même groupe que shadow-none.
            shadow: [
                {
                    shadow: [
                        'elevation-0',
                        'elevation-1',
                        'elevation-2',
                        'elevation-3',
                        'elevation-4',
                        'elevation-5',
                        // Les trois ombres des planches — feuille, dialogue, geste d'ajout.
                        'sheet',
                        'dialog',
                        'fab',
                    ],
                },
            ],
        },
    },
});

/**
 * Merge class names conditionally, resolving Tailwind utility conflicts:
 * the last written class of a property group wins, regardless of the
 * stylesheet emission order.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
    return twMerge(classes.filter(Boolean).join(' '));
}
