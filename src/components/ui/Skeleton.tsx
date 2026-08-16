import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Squelettes d'attente — planche **17.3** (composant partagé, 28 écrans), registre §2.39.
 *
 * **A1 — la forme décide.** Squelette quand on connaît *la forme* de ce qui arrive
 * — liste, fiche, file ; tourniquet quand on ne connaît que *la durée* — un envoi,
 * une validation. Ce ne sont pas deux styles concurrents, ce sont deux réponses à
 * deux questions. Le tourniquet, lui, ne vit que dans le bouton qui l'a lancé
 * (`Button loading`), jamais en plein écran.
 *
 * **A2 — la forme est exacte.** Même hauteur de rangée, même vignette, même nombre
 * de lignes que le contenu attendu : l'écran se **peuple**, il ne se recompose pas.
 * Un squelette approximatif fait sauter la page à l'arrivée des données, et coûte
 * alors plus qu'il ne rapporte.
 *
 * **A3 — ni couleur, ni vague brillante.** Une seule nuance, et aucune animation :
 * le balayage lumineux attire l'œil **sur l'attente** au lieu de l'en détourner.
 *
 * **A4 — ce qui est déjà connu est déjà vrai.** Le titre de l'écran, les onglets, le
 * fil d'Ariane ne dépendent d'aucune donnée : ils restent affichés pour de bon.
 * C'est pourquoi ces composants ne dessinent **que le contenu** — la barre du haut
 * reste celle de l'écran.
 *
 * **A5 — rien avant 300 ms** : voir `useDelayedPending`.
 *
 * Trois formes couvrent les vingt-huit écrans, et la planche les compte :
 * liste (4 écrans) · fiche (5) · file (3), les autres n'attendent rien de long.
 */

interface SkeletonProps {
    className?: string;
}

/**
 * Un bloc nu. Hauteur par défaut 12 px — la ligne secondaire ; le parent
 * dimensionne le reste. Rayon 2 (la planche dit 3 ; l'échelle du produit ne
 * connaît que 2/4/8 et le registre interdit d'en inventer un quatrième).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={cn('h-3 rounded-xs bg-skeleton', className)} aria-hidden="true" />
);

/** La vignette de rangée en attente — 40 × 40, rayon 6 (§2.2). */
const SkeletonVignette: React.FC<{ round?: boolean }> = ({ round = false }) => (
    <Skeleton className={cn('h-10 w-10 shrink-0', round ? 'rounded-full' : 'rounded-vignette')} />
);

/**
 * Les largeurs ne sont pas décoratives : une liste dont toutes les lignes font la
 * même longueur ne ressemble à aucune liste. Cinq paires, reprises de la planche.
 */
const ROW_WIDTHS: ReadonlyArray<readonly [string, string]> = [
    ['w-[78%]', 'w-[46%]'],
    ['w-[64%]', 'w-[52%]'],
    ['w-[83%]', 'w-[41%]'],
    ['w-[70%]', 'w-[56%]'],
    ['w-[75%]', 'w-[44%]'],
];

interface SkeletonRowProps {
    /** Rangée avec vignette (liste d'objets ou de personnes) ou sans (rangée de réglage). */
    withThumb?: boolean;
    /** Index de la rangée — choisit sa paire de largeurs. */
    index?: number;
    className?: string;
}

/**
 * Une rangée de liste au repos : la vignette de 40 px, le titre au rang 3 et sa
 * sous-ligne. Hauteur 72 px — celle d'une rangée de liste, à toutes les largeurs
 * (§2.43).
 */
export const SkeletonRow: React.FC<SkeletonRowProps> = ({ withThumb = true, index = 0, className }) => {
    const [title, sub] = ROW_WIDTHS[index % ROW_WIDTHS.length];

    return (
        <div className={cn('flex min-h-[72px] items-center gap-3 py-2.5', className)}>
            {withThumb && <SkeletonVignette />}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className={cn('h-[15px]', title)} />
                <Skeleton className={sub} />
            </div>
            {withThumb && <Skeleton className="w-[38px] shrink-0" />}
        </div>
    );
};

interface SkeletonListProps {
    /**
     * **Cinq rangées, jamais une seule** : un squelette à une rangée annonce une
     * liste vide.
     */
    rows?: number;
    withThumb?: boolean;
    className?: string;
    /** Libellé lu par les lecteurs d'écran pendant l'attente. */
    label?: string;
}

/** Squelette de **liste** — Inventaire · Utilisateurs · Catalogue · Emplacements. */
export const SkeletonList: React.FC<SkeletonListProps> = ({
    rows = 5,
    withThumb = true,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('divide-y divide-outline-variant', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow key={i} index={i} withThumb={withThumb} />
        ))}
    </div>
);

interface SkeletonQueueProps {
    rows?: number;
    className?: string;
    label?: string;
}

/**
 * Squelette de **file** — Tâches · Demandes · Audit. Rangée plus courte (64 px),
 * marque d'événement **ronde** (§2.5 : ce n'est pas une vignette, c'est un fait
 * passé) et le geste de rangée à droite.
 */
export const SkeletonQueue: React.FC<SkeletonQueueProps> = ({
    rows = 3,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('divide-y divide-outline-variant', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex min-h-16 items-center gap-3 py-2.5">
                <SkeletonVignette round />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-[15px] w-4/5" />
                    <Skeleton className="w-1/2" />
                </div>
                <Skeleton className="h-8 w-14 shrink-0 rounded-sm" />
            </div>
        ))}
    </div>
);

interface SkeletonDetailProps {
    /** Nombre de rangées de la carte de références. */
    rows?: number;
    className?: string;
    label?: string;
}

/**
 * Squelette de **fiche** — Équipement · Utilisateur · Modèle · Catégorie · Rôle.
 *
 * C'est la seule forme où **le héro se dessine aussi** : il est le bloc le plus
 * lourd de l'écran, et l'omettre ferait sauter tout le reste de 200 px à l'arrivée
 * des données. Sa composition suit R3 (§0.4) : une étiquette, un sujet, un état,
 * puis **trois métriques au plus**.
 */
export const SkeletonDetail: React.FC<SkeletonDetailProps> = ({
    rows = 3,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('flex flex-col', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>

        <div className="flex flex-col gap-3 bg-surface-container p-5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-[26px] w-8/12 rounded-sm" />
            <Skeleton className="w-[150px]" />
            <div className="mt-2 flex gap-5">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-1 flex-col gap-[7px]">
                        <Skeleton className="h-5 w-14" />
                        <Skeleton className="w-3/4" />
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
            <Skeleton className="h-12 rounded-sm" />
            <div className="rounded-card bg-surface p-4">
                <Skeleton className="mb-3.5 h-[11px] w-32" />
                <div className="divide-y divide-outline-variant">
                    {Array.from({ length: rows }, (_, i) => (
                        <div key={i} className="flex min-h-14 items-center gap-3 py-2.5">
                            <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Skeleton className="h-[15px] w-2/3" />
                                <Skeleton className="w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonList;
