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
    /** Classes du titre — permet à un écran d'imposer sa graisse (l'ADN mobile n'en
        admet que deux par écran, DESIGN_BRIEF.md §8.5, et `.section-title` porte 700). */
    titleClassName?: string;
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
    titleClassName,
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
    const compact = useMediaQuery(MEDIA.compact);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
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

    const handleAnimationEnd = () => {
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
        resetDrag();
        if (shouldClose) {
            onClose();
        }
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
                'fixed inset-0 z-[100] flex justify-center',
                compact ? 'items-end' : 'items-center p-4',
            )}
        >
            {/* Scrim */}
            <div
                className={cn(
                    /* `.scrim` — le sombre du produit à 42 %, pas un noir à 32 %. */
                    'bg-scrim/[0.42] absolute inset-0',
                    closing
                        ? 'animate-out fade-out duration-200'
                        : 'animate-in fade-in duration-200',
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
                    'bg-surface relative flex max-h-[90vh] w-full flex-col',
                    /* La mesure du contenu d'un flux — 560, et elle ne dépend pas de
                       l'écran. Un champ de 680 px pour un numéro de série est plus
                       difficile à viser, à relire, et il fait mentir la hiérarchie.
                       La feuille qui monte porte son ombre vers le haut ; le dialogue
                       centré, l'ombre descendante de `.dial`. */
                    compact
                        ? 'shadow-sheet rounded-t-xl'
                        : 'shadow-dialog max-w-[560px] rounded-xl',
                    closing
                        ? 'animate-out fade-out duration-200'
                        : 'animate-in fade-in duration-200',
                    compact &&
                        (closing
                            ? 'slide-out-to-bottom-4 duration-300'
                            : 'slide-in-from-bottom-4 duration-300'),
                    !compact && (closing ? 'zoom-out-95' : 'zoom-in-95'),
                    !isDragging && 'duration-short4 ease-emphasized transition-transform',
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
                    <div className="flex items-center gap-2 pt-1 pr-3 pb-0 pl-5">
                        <h2
                            id={titleId}
                            className={cn(
                                'font-brand text-on-surface min-w-0 flex-1 text-[22px] leading-7 font-semibold tracking-[-0.015em]',
                                titleClassName,
                            )}
                        >
                            {title}
                        </h2>
                        <CloseButton onClick={onClose} />
                    </div>
                )}

                {/* `.sbody` — 12 au-dessus et 20 de côté ; les 12 du pied, la planche les donne
                    à la feuille elle-même. Le corps en tenait 16 et 16 : tout contenu tombait
                    4 px trop bas, et dix phrases de tête le rattrapaient d'une marge négative
                    qui dépassait de 3 (relevé du 13/09). Le pied `.sfoot` d'une feuille court
                    d'un bord à l'autre : il reprend les 20 de côté par une marge négative. */}
                <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-3">{children}</div>
            </div>
        </div>
    );
};

export default BottomSheet;
