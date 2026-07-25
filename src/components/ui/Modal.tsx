import React, { useEffect, useRef, useCallback, useState, useId } from 'react';
import { cn } from '../../lib/utils';
import CloseButton from './CloseButton';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    /** MD3 Dialog icon (optional, displayed centered above title) */
    icon?: React.ReactNode;
    maxWidth?: 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-[560px]';
    /** Optional id of a description element for screen readers */
    ariaDescribedBy?: string;
}

/**
 * SmartProcure dialog with compact radius, white surface, and restrained elevation.
 * Includes focus trap for WCAG 2.1 compliance and exit animations.
 */
const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    icon,
    maxWidth = 'max-w-[560px]',
    ariaDescribedBy,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflowRef = useRef<string>('');
    const titleId = useId();
    const internalDescriptionId = useId();
    const resolvedDescriptionId = ariaDescribedBy ?? internalDescriptionId;
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    const maxWidthClasses = {
        'max-w-md': 'medium:max-w-md',
        'max-w-lg': 'medium:max-w-lg',
        'max-w-xl': 'medium:max-w-xl',
        'max-w-2xl': 'medium:max-w-2xl',
        'max-w-4xl': 'medium:max-w-4xl',
        'max-w-5xl': 'medium:max-w-5xl',
        'max-w-[560px]': 'medium:max-w-[560px]',
    } as const;

    // --- Mount / Unmount with exit animation ---
    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setClosing(false);
        } else if (!visible) {
            // Start exit animation
            setClosing(true);
        }
    }, [isOpen, visible]);

    const finalizeClose = useCallback(() => {
        setVisible(false);
        setClosing(false);
    }, []);

    // Fallback when animationend is not emitted (e.g. reduced-motion: animation none).
    useEffect(() => {
        if (!closing) return;
        const timeout = window.setTimeout(() => {
            finalizeClose();
        }, 220);
        return () => window.clearTimeout(timeout);
    }, [closing, finalizeClose]);

    const handleAnimationEnd = () => {
        if (closing) {
            finalizeClose();
        }
    };

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const restoreBodyOverflow = useCallback(() => {
        document.body.style.overflow = previousBodyOverflowRef.current;
    }, []);

    // --- Focus Trap ---
    const getFocusableElements = useCallback(() => {
        if (!dialogRef.current) return [];
        return Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        );
    }, []);

    useEffect(() => {
        if (visible && !closing) {
            // Save previously focused element
            previousFocusRef.current = document.activeElement as HTMLElement;
            previousBodyOverflowRef.current = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // Focus the first focusable element in the dialog
            requestAnimationFrame(() => {
                const focusable = getFocusableElements();
                if (focusable.length > 0) {
                    focusable[0].focus();
                }
            });
        } else if (!visible) {
            restoreBodyOverflow();
            // Restore focus to previously focused element
            previousFocusRef.current?.focus();
        }
        return () => {
            restoreBodyOverflow();
        };
    }, [visible, closing, getFocusableElements, restoreBodyOverflow]);

    // Handle keyboard: Escape to close + Tab trap
    useEffect(() => {
        if (!visible || closing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusable = getFocusableElements();
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, closing, handleClose, getFocusableElements]);

    if (!visible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-end medium:items-center medium:justify-center medium:p-4 bg-scrim/[0.32]",
                closing
                    ? "animate-out fade-out duration-150"
                    : "animate-in fade-in duration-medium2"
            )}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            onAnimationEnd={handleAnimationEnd}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={resolvedDescriptionId}
                className={cn(
                    // Compact: full-screen dialog (MD3 spec for mobile)
                    "bg-surface w-full flex flex-col overflow-hidden border border-outline-variant",
                    "h-full rounded-none",
                    // Medium+: centered modal dialog
                    "medium:min-w-[280px] medium:h-auto medium:max-h-[90vh] medium:rounded-xl medium:shadow-elevation-4",
                    closing
                        ? "animate-out zoom-out-95 fade-out duration-150"
                        : "animate-in slide-in-from-bottom medium:animate-in medium:zoom-in-95 duration-medium2",
                    maxWidthClasses[maxWidth]
                )}
            >
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-outline-variant">
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-primary">{icon}</span>}
                        <h2 id={titleId} className="section-title">{title}</h2>
                    </div>
                    <CloseButton onClick={handleClose} />
                </div>

                {/* Content */}
                <div id={resolvedDescriptionId} className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">
                    {children}
                </div>

                {/* Actions */}
                {footer && (
                    <div className="px-5 py-4 flex justify-end gap-2 shrink-0 border-t border-outline-variant bg-surface-container">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;


