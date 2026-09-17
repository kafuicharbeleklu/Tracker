import { MEDIA } from '../../constants/breakpoints';
import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import Icon from '../ui/Icon';
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
            <div className="bg-surface border-outline-variant relative z-20 flex-shrink-0 border-b">
                <div
                    className={cn(
                        /* `.tbar` de 04.3 — une barre de **56 tout compris**, et non
                           12 px d'intérieur autour d'un titre : les gestes qu'elle
                           porte font 48, la barre s'aligne dessus. */
                        /* Intérieur `0 8 0 4` au téléphone — le retour de 48 porte déjà son
                           air — et `0 12 0 24` au-delà de 600 (00.5). Il tenait la gouttière
                           de page, 16, si bien que le retour et le titre partaient 12 px trop
                           à droite (13/09). */
                        'medium:pr-3 medium:pl-6 mx-auto flex max-w-5xl items-center pr-2 pl-1',
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
                                        /* `.tb` de 04.3 — 48, rayon 4, le glyphe Phosphor de
                                           20 (I2) : il portait un glyphe Material de 40, seul
                                           de sa famille dans le produit (10/09). */
                                        className="text-on-surface h-12 min-h-12 w-12 min-w-12 rounded-md border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <Icon glyph={ArrowLeft} size={20} />
                                    </Button>
                                ) : (
                                    <span className="h-12 w-12" aria-hidden="true" />
                                )}
                            </div>

                            <div className="min-w-0 px-1 text-center">
                                <h1
                                    className={cn(
                                        /* 17 sur 24 en Archivo 600 — `.tbar h2`. */
                                        'font-brand text-on-surface medium:line-clamp-1 line-clamp-2 text-[17px] leading-6 font-semibold tracking-[-0.01em]',
                                        isCompactLandscape && 'text-[15px] leading-5',
                                    )}
                                >
                                    {title}
                                </h1>
                            </div>

                            <div className="flex items-center justify-end">
                                <CloseButton onClick={onClose} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                            {/* `.tbar` — gouttière 4, et le titre prend 4 d'intérieur : il part à 60. */}
                            <div className="flex min-w-0 items-center gap-1">
                                {onBack && (
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={onBack}
                                        /* `.tb` de 04.3 — 48, rayon 4, le glyphe Phosphor de
                                           20 (I2) : il portait un glyphe Material de 40, seul
                                           de sa famille dans le produit (10/09). */
                                        className="text-on-surface h-12 min-h-12 w-12 min-w-12 rounded-md border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <Icon glyph={ArrowLeft} size={20} />
                                    </Button>
                                )}
                                <div className="min-w-0 px-1">
                                    <h1
                                        className={cn(
                                            'font-brand text-on-surface medium:line-clamp-1 line-clamp-2 text-[17px] leading-6 font-semibold tracking-[-0.01em]',
                                            isCompactLandscape && 'text-[15px] leading-5',
                                        )}
                                    >
                                        {title}
                                    </h1>
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

            {/*
              **Le contenu d'un flux s'arrête à 560 px, à toutes les largeurs** (00.5).
              Une liste gagne des rangées quand l'écran s'élargit — c'est du gain sans
              décision. Un formulaire n'y gagne rien : *« un champ de 680 px pour saisir
              un numéro de série est plus difficile à viser, plus difficile à relire, et
              il fait mentir la hiérarchie — un champ large a l'air d'attendre un long
              texte »*. Il tenait ici 1024.
            */}
            <div className="w-full flex-1 overflow-y-auto scroll-smooth">
                <div
                    className={cn(
                        /* `.fpage` — 16 en haut, 24 en bas (04.3, 09.2) ; le code posait 32. */
                        'px-page-sm medium:px-page mx-auto max-w-[560px]',
                        isCompactLandscape ? 'py-4' : 'pt-4 pb-6',
                    )}
                >
                    {children}
                </div>
            </div>

            {/* Footer */}
            {footerActions && (
                <div
                    className={cn(
                        'bg-surface border-outline-variant sticky bottom-0 z-20 border-t',
                        isCompactLandscape ? 'p-3' : 'p-4',
                    )}
                >
                    {/*
                      **Le corollaire, et c'est celui qu'on oublie : le pied se borne à la
                      même mesure.** Un « Continuer » collé au bord droit d'un écran de
                      768 px n'est plus au bout de ce qu'on vient de lire — il est
                      ailleurs.
                    */}
                    <div className="mx-auto flex max-w-[560px] justify-end gap-3">
                        {footerActions}
                    </div>
                </div>
            )}
        </div>
    );
};
