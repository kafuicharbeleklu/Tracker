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
 * `56 px` de barre du bas `+ 20 px` de gouttière de page = **76 px du bas**, et
 * **20 px du bord droit**, en aplomb du contenu. Ce conteneur posait `bottom-6
 * right-6` — **24 px** —, c'est-à-dire le bouton **sur** la barre : il recouvrait la
 * case « Plus ». Trois autres valeurs circulaient dans le produit pour dégager la
 * même barre, dont aucune n'était dérivée d'elle.
 *
 * **La zone sûre s'ajoute aux 76 px, elle ne les remplace pas.** Sur un téléphone à
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
                'fixed right-5 z-50 flex flex-col items-end gap-4',
                'bottom-[calc(env(safe-area-inset-bottom,0px)+76px)]',
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
