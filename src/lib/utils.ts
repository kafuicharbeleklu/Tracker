import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge ne connaît pas le vocabulaire maison du design system : sans
 * déclaration, tout `text-<inconnu>` est classé couleur et le typescale MD3
 * avalerait les couleurs de texte (cf. docs/AUDIT_DESIGN_SYSTEM.md §11.4).
 * Toute future classe maison à préfixe utilitaire (`text-*`, `shadow-*`, …)
 * doit être déclarée ici — synchro vérifiée par `scripts/check-cn-merge.mjs`.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
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
                    ],
                },
            ],
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
