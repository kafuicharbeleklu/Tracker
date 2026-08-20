import { MEDIA } from '../../constants/breakpoints';
import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface FullScreenLayoutProps {
    title: string;
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
                        'px-page-sm medium:px-page mx-auto max-w-5xl',
                        isCompactLandscape ? 'py-2' : 'py-3',
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

                            <h1
                                className={cn(
                                    'section-title medium:line-clamp-1 line-clamp-2 px-1 text-center leading-snug',
                                    isCompactLandscape && 'text-title-medium',
                                )}
                            >
                                {title}
                            </h1>

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
                                <h1
                                    className={cn(
                                        'section-title medium:line-clamp-1 line-clamp-2 leading-snug',
                                        isCompactLandscape && 'text-title-medium',
                                    )}
                                >
                                    {title}
                                </h1>
                            </div>

                            <div className="flex items-center gap-2">
                                {headerActions}
                                <CloseButton onClick={onClose} />
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
