import React, { useEffect, useCallback, useRef, useState, useId } from 'react';
import { cn } from '../../lib/utils';
import CloseButton from './CloseButton';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';

interface BottomSheetProps {
    /** Optional id for aria-controls linkage */
    id?: string;
    /** Whether the sheet is open */
    open: boolean;
    /** Close handler */
    onClose: () => void;
    /** Content */
    children: React.ReactNode;
    /** Show drag handle */
    dragHandle?: boolean;
    /** Title (optional) */
    title?: string;
    /**
     * `.sttl .sub` — ce que le titre situe : « Aujourd'hui à 09:42 · Lomé Siège » sous le
     * fait ouvert de 18.1. 14 sur 20, encre secondaire, 4 sous le titre.
     */
    subtitle?: string;
    /** Classes du titre — permet à un écran d'imposer sa graisse (l'ADN mobile n'en
        admet que deux par écran, DESIGN_BRIEF.md §8.5, et `.section-title` porte 700). */
    titleClassName?: string;
    /**
     * **L'emploi de la feuille** (25/09, format tablette). `acte` (par défaut) : en bas au
     * téléphone, centrée au-delà, **bornée à 640 de haut** — la feuille de formulaire d'Apple.
     * `filtre` : en bas au téléphone ; **en bas encore de 600 à 839**, 640 de large au plus
     * (M3) ; **en panneau à droite dès 840**, sur un voile léger, pour que la liste filtrée
     * reste visible et se mette à jour à chaque pastille.
     */
    emploi?: 'acte' | 'filtre';
    /** Custom class */
    className?: string;
}

/**
 * **La feuille d'acte — et ce qu'elle devient dès qu'il y a de la place** (00.5).
 *
 * Au téléphone elle monte du bas, pleine largeur, avec sa poignée : c'est une surface
 * qu'on attrape au pouce. Au-delà de 600 px il n'y a plus de pouce, et la planche
 * tranche : *« à 768 px la feuille ne s'étire pas : elle se centre, à la mesure de
 * 560 px, et le voile couvre tout, rail compris »*.
 *
 * **Les blocs ne changent pas** — mêmes champs, même pied, même ordre. *« Ce qui change
 * est l'air autour, pas la feuille. »* C'est la règle des vues de référence : une seule
 * vue, posée autrement, jamais une seconde vue à maintenir.
 *
 * Et la poignée disparaît avec le geste qu'elle promettait : on ne fait pas glisser un
 * dialogue. Échap et le voile referment ; une feuille titrée garde sa croix.
 *
 * *Un écart de planche assumé : 00.3 §4 écrivait 440 px et un seuil à 840. 00.5 est la
 * planche dédiée à ce gabarit — elle fixe 560 et le démontre à 768. C'est elle qui vaut,
 * et le seuil est pris au premier palier du produit, 600.*
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
    id,
    open,
    onClose,
    children,
    dragHandle = true,
    title,
    subtitle,
    titleClassName,
    emploi = 'acte',
    className,
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflowRef = useRef<string>('');
    const dragStartYRef = useRef<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const titleId = useId();
    /** Sous 600 px, la feuille monte du bas ; au-delà, elle se centre (00.5). */
    const telephone = useMediaQuery(MEDIA.compact);
    const deuxPanneaux = useMediaQuery(MEDIA.expandedUp);
    /* La forme : `bas` (monte du bas), `centre` (dialogue), `cote` (panneau à droite). Un
       filtre reste en bas jusqu'à 839 et passe sur le côté dès 840 ; un acte se centre dès
       600. */
    const forme: 'bas' | 'centre' | 'cote' = telephone
        ? 'bas'
        : emploi === 'filtre'
          ? deuxPanneaux
              ? 'cote'
              : 'bas'
          : 'centre';
    /** La feuille qui monte du bas — pleine largeur au téléphone, 640 au plus au-delà. */
    const compact = forme === 'bas';

    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
            setDragOffset(0);
        } else if (visible) {
            setClosing(true);
        }
    }, [open, visible]);

    const getFocusableElements = useCallback(() => {
        if (!sheetRef.current) return [];
        return Array.from(
            sheetRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
        );
    }, []);

    const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
        /* La sortie de la feuille elle-même, pas celle d'un enfant (un indicateur, un menu). */
        if (event.target !== event.currentTarget) return;
        if (closing) {
            setVisible(false);
            setClosing(false);
        }
    };

    const restoreBodyOverflow = useCallback(() => {
        document.body.style.overflow = previousBodyOverflowRef.current;
    }, []);

    const resetDrag = useCallback(() => {
        dragStartYRef.current = null;
        setIsDragging(false);
        setDragOffset(0);
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragHandle) return;
        dragStartYRef.current = e.clientY;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || dragStartYRef.current === null) return;
        const delta = e.clientY - dragStartYRef.current;
        setDragOffset(Math.max(0, delta));
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        const shouldClose = dragOffset > 120;
        if (shouldClose) {
            /* La feuille repart de là où le doigt l'a laissée : l'offset reste posé, la sortie
               (`mvt-feuille-sortie`, sans image de départ) part de lui. Le remettre à zéro la
               faisait remonter d'un coup avant de redescendre. */
            dragStartYRef.current = null;
            setIsDragging(false);
            onClose();
            return;
        }
        resetDrag();
    };

    useEffect(() => {
        if (!visible || closing) return;

        previousFocusRef.current = document.activeElement as HTMLElement;
        previousBodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            const focusable = getFocusableElements();
            if (focusable.length > 0) focusable[0].focus();
        });

        return () => {
            restoreBodyOverflow();
        };
    }, [visible, closing, getFocusableElements, restoreBodyOverflow]);

    useEffect(() => {
        if (!visible) {
            previousFocusRef.current?.focus();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || closing) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusableElements();
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('keydown', handleTab);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleTab);
        };
    }, [visible, closing, onClose, getFocusableElements]);

    if (!visible) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex',
                /* Pendant sa sortie, la feuille ne retient plus le doigt : la page dessous
                   répond déjà. */
                closing && 'pointer-events-none',
                forme === 'bas' && 'items-end justify-center',
                forme === 'centre' && 'items-center justify-center p-4',
                forme === 'cote' && 'items-stretch justify-end',
            )}
        >
            {/* Scrim */}
            <div
                className={cn(
                    /* `.scrim` — le sombre du produit à 42 %, pas un noir à 32 %. Le panneau de
                       filtre n'en garde que 12 : la liste qu'il filtre doit rester lisible. */
                    'absolute inset-0',
                    forme === 'cote' ? 'bg-scrim/[0.12]' : 'bg-scrim/[0.42]',
                    closing ? 'mvt-voile-sortie' : 'mvt-voile-entree',
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                id={id}
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Panneau inférieur'}
                onAnimationEnd={handleAnimationEnd}
                className={cn(
                    /* **Aucun filet autour de la feuille** : sa surface blanche sur le voile
                       suffit à la détacher. Elle portait un cerné et l'élévation MD3 la plus
                       haute (13/09, 44 écrans). */
                    'bg-surface relative flex w-full flex-col',
                    /* La mesure du contenu d'un flux — 560, et elle ne dépend pas de
                       l'écran. Un champ de 680 px pour un numéro de série est plus
                       difficile à viser, à relire, et il fait mentir la hiérarchie.
                       La feuille qui monte porte son ombre vers le haut ; le dialogue
                       centré, l'ombre descendante de `.dial`. */
                    forme === 'bas' &&
                        (telephone
                            ? 'shadow-sheet max-h-[90vh] rounded-t-xl'
                            : 'shadow-sheet max-h-[80vh] max-w-[640px] rounded-t-xl'),
                    /* 640 de haut au plus — la feuille de formulaire d'Apple ; le corps défile
                       dedans. « Déclarer un incident » montait à 824 sur 1 024 (25/09). */
                    forme === 'centre' &&
                        'shadow-dialog max-h-[min(640px,calc(100dvh-2rem))] max-w-[560px] rounded-xl',
                    forme === 'cote' && 'shadow-dialog h-full max-w-[360px] rounded-l-xl',
                    /* Le mouvement dit d'où vient la feuille (26/09) : du bord bas, du centre,
                       du bord droit — et elle y retourne. */
                    forme === 'bas' && (closing ? 'mvt-feuille-sortie' : 'mvt-feuille-entree'),
                    forme === 'centre' && (closing ? 'mvt-dialogue-sortie' : 'mvt-dialogue-entree'),
                    forme === 'cote' && (closing ? 'mvt-panneau-sortie' : 'mvt-panneau-entree'),
                    !isDragging &&
                        !closing &&
                        'duration-short4 ease-emphasized transition-transform',
                    className,
                )}
                style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
            >
                {/* La poignée n'existe qu'avec le geste qu'elle annonce. */}
                {dragHandle && compact && (
                    <div
                        className="flex cursor-grab touch-none justify-center pt-2 pb-0.5"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={resetDrag}
                    >
                        <div className="bg-outline-variant h-1 w-9 rounded-sm" />
                    </div>
                )}

                {/* Title */}
                {title && (
                    /* `.sttl` de la passe sobre — quatre planches l'écrivent à
                       l'identique (03.3, 04.1, 05.1, 10.1) : **aucun filet** sous le
                       titre, 4 px au-dessus, 20 à gauche, 12 à droite, et le titre à
                       22 sur 28 en Archivo 600. Le filet faisait un second en-tête
                       dans une feuille qui n'en a qu'un. */
                    <div
                        className={cn(
                            'flex items-center gap-2 pr-3 pb-0 pl-5',
                            /* Sans poignée — le dialogue du bureau (00.5) —, les 14 px
                               qu'elle occupait au-dessus du titre tombent avec elle : le
                               titre collait au bord. La feuille d'acte (`ActSheet`) pose
                               16 dans ce cas ; la feuille les pose aussi. */
                            dragHandle && compact ? 'pt-1' : 'pt-4',
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <h2
                                id={titleId}
                                className={cn(
                                    'font-brand text-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em]',
                                    titleClassName,
                                )}
                            >
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <CloseButton onClick={onClose} />
                    </div>
                )}

                {/* `.sbody` — 12 au-dessus et 20 de côté ; les 12 du pied, la planche les donne
                    à la feuille elle-même. Le corps en tenait 16 et 16 : tout contenu tombait
                    4 px trop bas, et dix phrases de tête le rattrapaient d'une marge négative
                    qui dépassait de 3 (relevé du 13/09). Le pied `.sfoot` d'une feuille court
                    d'un bord à l'autre : il reprend les 20 de côté par une marge négative. */}
                <div
                    className={cn(
                        'custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-3',
                        /* Le panneau de filtre court sur toute la hauteur : son pied (`data-pied`,
                           « Tout effacer · Voir les N ») descend au bas du panneau et y reste
                           quand les pastilles défilent — il flottait à mi-hauteur. */
                        forme === 'cote' &&
                            '[&_[data-pied]]:bg-surface [&_[data-pied]]:sticky [&_[data-pied]]:bottom-0 [&_[data-pied]]:mt-auto [&>*]:flex [&>*]:min-h-full [&>*]:flex-col',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
