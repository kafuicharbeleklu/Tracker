import { MEDIA } from '../../constants/breakpoints';
import React, { useEffect, useRef, useCallback, useState, useId } from 'react';
import { cn } from '../../lib/utils';
import CloseButton from './CloseButton';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface SideSheetProps {
    /** Whether the sheet is open */
    open: boolean;
    /** Close handler */
    onClose: () => void;
    /** Optional title */
    title?: string;
    /** Optional short description shown in header */
    description?: string;
    /** Content */
    children: React.ReactNode;
    /** Optional footer actions */
    footer?: React.ReactNode;
    /** Optional className for the scrollable content container */
    contentClassName?: string;
    /** Side where the sheet appears */
    side?: 'right' | 'left';
    /** Width token from MD3 side sheet guidance */
    width?: 'standard' | 'detached';
    /** Whether to show a modal scrim */
    modal?: boolean;
    /** Whether user can dismiss via outside click/escape/close button */
    dismissible?: boolean;
    /** Optional description id override for aria-describedby */
    ariaDescribedBy?: string;
    /** Custom class */
    className?: string;
}

/**
 * MD3 Adaptive Sheet.
 * - Compact/Medium (0-839dp): behaves as a modal bottom sheet.
 * - Expanded+ (840dp+): behaves as a side sheet.
 * Standard side-sheet width: 360dp, detached: 256dp, elevation level 1.
 */
const SideSheet: React.FC<SideSheetProps> = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    contentClassName,
    side = 'right',
    width = 'standard',
    modal = true,
    dismissible = true,
    ariaDescribedBy,
    className,
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflowRef = useRef<string>('');
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const isCompactOrMedium = useMediaQuery(MEDIA.belowExpanded);
    const titleId = useId();
    const internalDescriptionId = useId();
    const resolvedDescriptionId = ariaDescribedBy ?? (description ? internalDescriptionId : undefined);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
        } else if (visible) {
            // Même régression que Modal, introduite par le même commit (`283dd58`) :
            // avec `!visible`, la fermeture d'un panneau monté n'amorçait jamais
            // l'animation de sortie et le panneau restait affiché. Voir Modal.tsx.
            setClosing(true);
        }
    }, [open, visible]);

    const handleClose = useCallback(() => {
        if (!dismissible) return;
        onClose();
    }, [dismissible, onClose]);

    const restoreBodyOverflow = useCallback(() => {
        document.body.style.overflow = previousBodyOverflowRef.current;
    }, []);

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

    useEffect(() => {
        if (visible && !closing) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            if (modal) {
                previousBodyOverflowRef.current = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
            }

            requestAnimationFrame(() => {
                const focusable = getFocusableElements();
                if (focusable.length > 0) {
                    focusable[0].focus();
                }
            });
        } else if (!visible) {
            if (modal) {
                restoreBodyOverflow();
            }
            previousFocusRef.current?.focus();
        }

        return () => {
            if (modal) {
                restoreBodyOverflow();
            }
        };
    }, [visible, closing, modal, getFocusableElements, restoreBodyOverflow]);

    useEffect(() => {
        if (!visible || closing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }

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

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, closing, getFocusableElements, handleClose]);

    if (!visible) return null;

    const renderAsBottomSheet = isCompactOrMedium;

    const widthClass = width === 'standard'
        ? 'w-[min(100vw,360px)]'
        : 'w-[min(100vw,256px)]';

    const sideClass = renderAsBottomSheet
        ? 'inset-x-0 bottom-0 border-t border-outline-variant rounded-t-xl'
        : side === 'right'
            ? 'right-0 border-l border-outline-variant rounded-none'
            : 'left-0 border-r border-outline-variant rounded-none';

    const animationClass = renderAsBottomSheet
        ? (
            closing
                ? 'animate-out slide-out-to-bottom-4 fade-out duration-200'
                : 'animate-in slide-in-from-bottom-4 fade-in duration-medium2'
        )
        : (
            closing
                ? (side === 'right'
                    ? 'animate-out slide-out-to-right-4 fade-out duration-200'
                    : 'animate-out slide-out-to-left-4 fade-out duration-200')
                : (side === 'right'
                    ? 'animate-in slide-in-from-right-4 fade-in duration-medium2'
                    : 'animate-in slide-in-from-left-4 fade-in duration-medium2')
        );

    return (
        <div className="fixed inset-0 z-[100]">
            {modal && (
                <div
                    aria-hidden="true"
                    className={cn(
                        'absolute inset-0 bg-scrim/[0.32]',
                        closing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-medium2'
                    )}
                    onClick={handleClose}
                />
            )}

            <div
                ref={sheetRef}
                role="dialog"
                aria-modal={modal || undefined}
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : 'Panneau latéral'}
                aria-describedby={resolvedDescriptionId}
                onAnimationEnd={handleAnimationEnd}
                className={cn(
                    'absolute bg-surface shadow-elevation-2 flex flex-col',
                    renderAsBottomSheet ? 'max-h-[90vh] w-full' : `top-0 bottom-0 ${widthClass}`,
                    sideClass,
                    animationClass,
                    className
                )}
            >
                {(title || dismissible) && (
                    <div className="px-5 py-4 border-b border-outline-variant flex items-start justify-between gap-4 shrink-0">
                        <div className="min-w-0">
                            {title && <h2 id={titleId} className="section-title">{title}</h2>}
                            {description && (
                                <p id={resolvedDescriptionId} className="mt-1 text-body-small text-on-surface-variant">
                                    {description}
                                </p>
                            )}
                        </div>
                        {dismissible && <CloseButton onClick={handleClose} />}
                    </div>
                )}

                <div className={cn('flex-1 overflow-y-auto custom-scrollbar px-5 py-4', contentClassName)}>
                    {children}
                </div>

                {footer && (
                    <div className="px-5 py-4 border-t border-outline-variant bg-surface-container shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideSheet;

