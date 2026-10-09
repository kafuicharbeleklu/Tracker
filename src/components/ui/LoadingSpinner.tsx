import React from 'react';

import LiveLoader from './LiveLoader';
import { APP_CONFIG } from '../../config';

interface LoadingSpinnerProps {
    className?: string;
    variant?: 'spinner' | 'linear';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    className = '',
    variant = 'spinner',
    size = 'md',
    text,
    fullScreen = false,
}) => {
    const containerClasses = fullScreen
        ? 'fixed inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm z-50 animate-in fade-in duration-300'
        : `flex flex-col items-center justify-center p-4 ${className}`;

    if (variant === 'linear') {
        return (
            <div className={`w-full max-w-md ${containerClasses}`}>
                <div className="bg-surface-container-highest h-1 w-full overflow-hidden rounded-full">
                    <div className="animate-linear-indeterminate bg-primary h-full origin-left" />
                </div>
                {text && (
                    <p className="text-body-medium text-on-surface-variant mt-4 animate-pulse">
                        {text}
                    </p>
                )}
            </div>
        );
    }

    /* **Le chargement LIVE** (24/09) : les quatre signes des valeurs de Neemba, animés à
       tour de rôle, remplacent le rond qui tournait. Plein écran, c'est le démarrage :
       le bleu-noir de la marque, les signes dans leurs couleurs vives, le nom du produit
       et ce qui se charge. Dans une page, la version claire, aux teintes du produit. */
    const COTE = { sm: 24, md: 40, lg: 56, xl: 72 } as const;

    /* **Sans fondu** (08/10). Le bleu-noir montait depuis la transparence par-dessus une page
       claire : trois cents millisecondes de gris, à l'ouverture puis à la connexion — et à
       chaque phase du chargement, puisque chacune monte son écran. Il s'affiche d'emblée ;
       l'animation, elle, reprend où elle en était (`LiveLoader`). */
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[var(--tk-color-inverse-surface)]">
                <LiveLoader tone="sombre" size={72} label={text || 'Chargement'} />
                <div className="flex flex-col items-center gap-1.5">
                    <span className="font-brand text-inverse-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em]">
                        {APP_CONFIG.appName}
                    </span>
                    {text && (
                        <span className="text-ts-sub leading-ts-sub text-[var(--tk-color-on-dark-2)]">
                            {text}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <LiveLoader tone="clair" size={COTE[size]} label={text || 'Chargement'} />
            {text && (
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-3 font-medium">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
