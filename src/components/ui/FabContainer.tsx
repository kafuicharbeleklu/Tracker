import React from 'react';
import { cn } from '../../lib/utils';

interface FabContainerProps {
    children: React.ReactNode;
    className?: string;
    description?: string; // For accessibility
    style?: React.CSSProperties;
}

/**
 * L'ancrage du geste d'ajout — **planche 17.6, et il se calcule.**
 *
 * `64 px` de barre du bas `+ 16 px` de gouttière = **80 px du bas**, et **16 px du
 * bord droit** (passe du 06/09). L'ancienne règle « 56 + 20 = 76 » est caduque avec
 * la barre de 56 : les deux termes ont changé le même jour, et les reporter à moitié
 * aurait posé le bouton à 4 px de la barre.
 *
 * Ce conteneur posait `bottom-6 right-6` avant cela — **24 px** —, c'est-à-dire le
 * bouton **sur** la barre, en aplomb de la case « Plus ». Trois autres valeurs
 * circulaient dans le produit pour dégager la même barre, dont aucune n'était dérivée
 * d'elle.
 *
 * **La zone sûre s'ajoute aux 80 px, elle ne les remplace pas.** Sur un téléphone à
 * encoche basse, l'encoche pousse le bouton vers le haut ; elle ne redéfinit pas la
 * hauteur de la barre.
 */
export const FabContainer: React.FC<FabContainerProps> = ({
    children,
    className,
    description,
    style,
}) => {
    return (
        <div
            className={cn(
                'fixed right-4 z-50 flex flex-col items-end gap-4',
                'bottom-[calc(env(safe-area-inset-bottom,0px)+80px)]',
                'pointer-events-none [&>*]:pointer-events-auto', // Allow clicking through empty space
                className,
            )}
            style={style}
            role="group"
            aria-label={description || 'Floating Actions'}
        >
            {children}
        </div>
    );
};
