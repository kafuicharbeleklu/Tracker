import { MEDIA } from '../../constants/breakpoints';
import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface FullScreenLayoutProps {
    title: string;
    /**
     * La ligne sous le titre — le `.aid` des barres de 04.3 : *« Aucun identifiant tant
     * que la fiche n'est pas créée »*, *« LPT-HQ-01 · fiche existante »*. Elle dit **ce
     * sur quoi on travaille**, pas ce que fait l'écran ; sans elle, une saisie et une
     * correction portent exactement le même en-tête.
     */
    subtitle?: string;
    onClose: () => void;
    onBack?: () => void;
    headerContent?: React.ReactNode;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
    footerActions?: React.ReactNode;
    className?: string;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
    title,
    subtitle,
    onClose,
    onBack,
    headerContent,
    headerActions,
    children,
    footerActions,
    className,
}) => {
    const isCompactLandscape = useMediaQuery(MEDIA.belowExpandedLandscape);
    const useSymmetricHeader = Boolean(headerContent) && !headerActions;

    return (
        <div
            className={cn(
                'bg-surface animate-in fade-in slide-in-from-bottom-4 duration-medium2 fixed inset-0 z-50 flex h-full flex-col',
                className,
            )}
        >
            {/* Header — MD3 Top App Bar */}
            <div className="bg-surface border-outline-variant shadow-elevation-1 relative z-20 flex-shrink-0 border-b">
                <div
                    className={cn(
                        /* `.tbar` de 04.3 — une barre de **56 tout compris**, et non
                           12 px d'intérieur autour d'un titre : les gestes qu'elle
                           porte font 48, la barre s'aligne dessus. */
                        'px-page-sm medium:px-page mx-auto flex max-w-5xl items-center',
                        isCompactLandscape ? 'min-h-12 py-1' : 'min-h-14',
                    )}
                >
                    {useSymmetricHeader ? (
                        <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2">
                            <div className="flex items-center justify-start">
                                {onBack ? (
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={onBack}
                                        className="text-on-surface-variant hover:text-on-surface h-10 min-h-10 w-10 min-w-10 rounded-lg border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <MaterialIcon name="arrow_back" size={20} />
                                    </Button>
                                ) : (
                                    <span className="h-10 w-10" aria-hidden="true" />
                                )}
                            </div>

                            <div className="min-w-0 px-1 text-center">
                                <h1
                                    className={cn(
                                        /* 17 sur 24 en Archivo 600 — `.tbar h2`. */
                                        'font-brand text-on-surface medium:line-clamp-1 line-clamp-2 text-[17px] leading-6 font-semibold tracking-[-0.015em]',
                                        isCompactLandscape && 'text-[15px] leading-5',
                                    )}
                                >
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-on-surface-variant truncate text-[12px] leading-4">
                                        {subtitle}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end">
                                <CloseButton onClick={onClose} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-w-0 items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                {onBack && (
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={onBack}
                                        className="text-on-surface-variant hover:text-on-surface h-10 min-h-10 w-10 min-w-10 rounded-lg border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <MaterialIcon name="arrow_back" size={24} />
                                    </Button>
                                )}
                                <div className="min-w-0">
                                    <h1
                                        className={cn(
                                            'font-brand text-on-surface medium:line-clamp-1 line-clamp-2 text-[17px] leading-6 font-semibold tracking-[-0.015em]',
                                            isCompactLandscape && 'text-[15px] leading-5',
                                        )}
                                    >
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-on-surface-variant truncate text-[12px] leading-4">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {headerActions}
                                {/* Deux sorties pour un seul geste : la flèche suffit. */}
                                {!onBack && <CloseButton onClick={onClose} />}
                            </div>
                        </div>
                    )}
                </div>

                {headerContent && (
                    <div
                        className={cn(
                            'px-page-sm medium:px-page mx-auto max-w-5xl',
                            isCompactLandscape ? 'pb-2' : 'pb-4',
                        )}
                    >
                        {headerContent}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="w-full flex-1 overflow-y-auto scroll-smooth">
                <div
                    className={cn(
                        'px-page-sm medium:px-page mx-auto max-w-5xl',
                        isCompactLandscape ? 'py-4' : 'py-8',
                    )}
                >
                    {children}
                </div>
            </div>

            {/* Footer */}
            {footerActions && (
                <div
                    className={cn(
                        'bg-surface border-outline-variant shadow-elevation-2 sticky bottom-0 z-20 border-t',
                        isCompactLandscape ? 'p-3' : 'p-4',
                    )}
                >
                    <div className="mx-auto flex max-w-5xl justify-end gap-3">{footerActions}</div>
                </div>
            )}
        </div>
    );
};
