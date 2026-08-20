import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

/**
 * ⚠️ **Forme héritée — remplacée par `ScreenState`** (planche 17.1).
 *
 * L'état vide y prend sa forme canonique : la marque ronde de 112 px, le titre au
 * palier haut, deux portes au plus. Celle-ci reste en place le temps que ses douze
 * appels soient portés — elle disparaît avec le dernier. Ne pas l'employer dans du
 * code neuf : deux formes pour un même moment, c'est la divergence que le registre
 * appelle « un nom, deux rôles » (§2.18).
 */
interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    /** Classes du titre — permet à un écran d'imposer sa graisse (l'ADN mobile n'en
        admet que deux par écran, DESIGN_BRIEF.md §8.5, et `text-title-medium` porte 700). */
    titleClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className,
    titleClassName,
}) => {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-10 px-6 text-center',
                className,
            )}
        >
            <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center mb-4 border border-outline-variant">
                <MaterialIcon name={icon} size={28} className="text-on-surface-variant" />
            </div>

            <h3 className={cn('text-title-medium text-on-surface mb-2', titleClassName)}>
                {title}
            </h3>

            {description && (
                <p className="text-body-medium text-on-surface-variant mb-6 max-w-md">
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
};
