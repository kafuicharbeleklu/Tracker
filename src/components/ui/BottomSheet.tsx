import React, { useEffect, useCallback, useRef, useState, useId } from 'react';
import { cn } from '../../lib/utils';
import CloseButton from './CloseButton';

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
 * MD3 Modal Bottom Sheet — full-width on compact and centered on larger screens.
 * Includes scrim overlay, drag handle, focus trap, escape support, and close animation.
 *
 * @see https://m3.material.io/components/bottom-sheets/overview
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
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Scrim */}
            <div
                className={cn(
                    "absolute inset-0 bg-scrim/[0.32]",
                    closing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-200"
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
                    "relative w-full max-h-[90vh] bg-surface rounded-t-xl shadow-elevation-4 border border-outline-variant flex flex-col",
                    closing
                        ? "animate-out slide-out-to-bottom-4 fade-out duration-300"
                        : "animate-in slide-in-from-bottom-4 duration-300",
                    "expanded:max-w-[640px]",
                    !isDragging && "transition-transform duration-short4 ease-emphasized",
                    className
                )}
                style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
            >
                {/* Drag handle */}
                {dragHandle && (
                    <div
                        className="flex justify-center pt-3 pb-1 cursor-grab touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={resetDrag}
                    >
                        <div className="w-8 h-1 rounded-full bg-on-surface-variant/40" />
                    </div>
                )}

                {/* Title */}
                {title && (
                    <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                        <h2 id={titleId} className={cn('section-title', titleClassName)}>{title}</h2>
                        <CloseButton onClick={onClose} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;

