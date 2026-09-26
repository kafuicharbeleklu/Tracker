import { MEDIA } from '../../constants/breakpoints';
import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MESURE_DOUBLE } from '../../lib/regimeBureau';

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
    /**
     * `flux` — la mesure de 560 à toutes les largeurs (00.5). `double` — deux mesures dès
     * 1 000, pour un formulaire dont les sections se rangent en colonnes
     * (`COLONNES_FORMULAIRE`, cf. `regimeBureau.ts`).
     */
    mesure?: 'flux' | 'double';
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
    mesure = 'flux',
}) => {
    const borne = mesure === 'double' ? MESURE_DOUBLE : undefined;
    const isCompactLandscape = useMediaQuery(MEDIA.belowExpandedLandscape);
    const pleinEcranDuTelephone = useMediaQuery(MEDIA.compact);
    const surface = useRef<HTMLDivElement>(null);

    /* Arrivé pendant le passage d'une page (une page chargée à la demande), il termine
       l'animation de ses ancêtres : transformés, ils le cadreraient au lieu de la fenêtre. */
    useEffect(() => {
        const element = surface.current;
        if (!element || typeof document.getAnimations !== 'function') return;
        for (const animation of document.getAnimations()) {
            const cible = (animation.effect as KeyframeEffect | null)?.target;
            if (cible instanceof Element && cible !== element && cible.contains(element)) {
                animation.finish();
            }
        }
    }, []);

    /*
     * **Échap referme, comme sur une feuille ou un dialogue.** La surface couvre tout
     * l'écran : au doigt, la flèche de retour est la sortie, mais au clavier il n'y en
     * avait aucune — une saisie ouverte par-dessus une page restait ouverte tant qu'on
     * ne visait pas la flèche. `Modal` fermait déjà sur Échap ; la coque qui le remplace
     * ne peut pas en savoir moins.
     */
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);
    const useSymmetricHeader = Boolean(headerContent) && !headerActions;

    return (
        <div
            /* La coque ne fait pas glisser la page quand elle s'ouvre sur un écran plein : il
               est fixé à la fenêtre, et une enveloppe animée le cadrerait le temps de la
               transition (`useTransitionDePage`). Il a sa propre entrée. */
            data-plein-ecran
            ref={surface}
            className={cn(
                /* **Un écran plein couvre le chrome, sinon il n'est pas plein.** Il
                   tenait `z-50`, la mesure de la barre du bas : montée au-dessus d'une
                   page à onglets — la saisie d'une dépense sur 15.3 —, la barre et le
                   geste d'ajout traversaient la surface. `z-[100]` est l'étage des
                   surfaces qui couvrent, celui des feuilles et des dialogues ; le
                   retour transitoire reste au-dessus, à 110. */
                'bg-surface fixed inset-0 z-[100] flex h-full flex-col',
                /* Au téléphone, il monte du bord comme un dialogue plein écran de Material ;
                   au-delà, il se pose en fondu (26/09). */
                pleinEcranDuTelephone ? 'mvt-feuille-entree' : 'mvt-contenu',
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
                        /* **La barre suit la mesure du flux** (23/09) : bornée à 1 024, elle
                           posait le retour et « Enregistrer » à 230 px de part et d'autre
                           d'un formulaire de 560 — les deux gestes de la saisie étaient
                           ailleurs que ce qu'on remplissait. 00.5 le dit du pied ; c'est
                           vrai de la tête. */
                        /* La géométrie de `BarreDePage` (24/09) : intérieur `8 / 16 / 12`,
                           rangée de 48, retour rentré de 12 — le titre tombe à 56 / 16, comme
                           sur les listes et les fiches. */
                        'medium:px-page mx-auto flex max-w-[560px] items-center px-4',
                        borne,
                        isCompactLandscape ? 'min-h-12 py-1' : 'min-h-12 pt-2 pb-3',
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
                                           **24**, comme le retour de toutes les barres de 56
                                           (23/09 ; il tenait 20, seul de sa taille). */
                                        className="text-on-surface -ml-3 h-12 min-h-12 w-12 min-w-12 rounded-md border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <Icon glyph={ArrowLeft} size={24} />
                                    </Button>
                                ) : (
                                    <span className="h-12 w-12" aria-hidden="true" />
                                )}
                            </div>

                            <div className="min-w-0 px-1 text-center">
                                <h1
                                    className={cn(
                                        /* 17 sur 24 en Archivo 600 — `.tbar h2`. */
                                        /* 28 sur 32, comme la barre des listes (23/09) ; une ligne, coupée. */
                                        'font-brand text-on-surface text-ts-page leading-ts-page line-clamp-1 font-semibold tracking-[-0.02em]',
                                        isCompactLandscape && 'text-ts-control leading-ts-control',
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
                                           **24**, comme le retour de toutes les barres de 56
                                           (23/09 ; il tenait 20, seul de sa taille). */
                                        className="text-on-surface -ml-3 h-12 min-h-12 w-12 min-w-12 rounded-md border-none p-0 shadow-none"
                                        aria-label="Retour"
                                    >
                                        <Icon glyph={ArrowLeft} size={24} />
                                    </Button>
                                )}
                                <div className="min-w-0">
                                    <h1
                                        className={cn(
                                            /* 28 sur 32, comme la barre des listes (23/09) ; une ligne, coupée. */
                                            'font-brand text-on-surface text-ts-page leading-ts-page line-clamp-1 font-semibold tracking-[-0.02em]',
                                            isCompactLandscape &&
                                                'text-ts-control leading-ts-control',
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
                            'px-page-sm medium:px-page mx-auto max-w-[560px]',
                            borne,
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
                        borne,
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
                    <div className={cn('mx-auto flex max-w-[560px] justify-end gap-3', borne)}>
                        {footerActions}
                    </div>
                </div>
            )}
        </div>
    );
};
