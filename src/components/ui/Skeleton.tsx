import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Squelette de chargement — planche 12.1, registre §2.39.
 *
 * Règle : rien avant 300 ms, puis **la forme de ce qui arrive** — jamais un tourniquet.
 * La place est tenue pendant l'attente, donc l'écran ne saute pas quand la donnée arrive.
 * Le squelette n'emploie aucune couleur propre : c'est la surface d'information,
 * utilisée comme une absence.
 */

interface SkeletonProps {
    className?: string;
}

/** Un bloc nu — à dimensionner par le parent. */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={cn('bg-surface-container rounded-sm', className)} aria-hidden="true" />
);

interface SkeletonRowProps {
    /** Rangée avec vignette (liste d'objets ou de personnes) ou sans (rangée de réglage). */
    withThumb?: boolean;
    className?: string;
}

/**
 * Une rangée de liste au repos : la vignette de 40 px (§2.2), le titre au rang 3
 * et sa sous-ligne. Les largeurs varient d'une rangée à l'autre — une liste dont
 * toutes les lignes font la même longueur ne ressemble à aucune liste.
 */
export const SkeletonRow: React.FC<SkeletonRowProps> = ({ withThumb = true, className }) => (
    <div className={cn('flex items-center gap-3 py-2.5 min-h-[72px]', className)}>
        {withThumb && <Skeleton className="w-10 h-10 rounded-md shrink-0" />}
        <div className="flex-1 min-w-0">
            <Skeleton className="h-[15px] w-1/2" />
            <Skeleton className="h-3 w-3/4 mt-1.5" />
        </div>
    </div>
);

interface SkeletonListProps {
    /** Trois rangées par défaut : le squelette dit la forme, il ne promet pas un nombre. */
    rows?: number;
    withThumb?: boolean;
    className?: string;
    /** Libellé lu par les lecteurs d'écran pendant l'attente. */
    label?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    rows = 3,
    withThumb = true,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('divide-y divide-outline-variant', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow key={i} withThumb={withThumb} />
        ))}
    </div>
);

export default SkeletonList;
