import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

export interface SnackbarMessage {
    id: string;
    message: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
    variant?: 'default' | 'error' | 'success';
    showClose?: boolean;
}

interface SnackbarProps {
    messages: SnackbarMessage[];
    onDismiss: (id: string) => void;
    className?: string;
}

const VARIANT_STYLES = {
    default: 'bg-inverse-surface text-inverse-on-surface',
    error: 'bg-error-container text-on-error-container',
    success: 'bg-tertiary-container text-on-tertiary-container',
};

/**
 * Snackbar overlay — Bottom-center notification with queue, action, and auto-dismiss.
 * Handles one message at a time; remaining messages queue.
 *
 * Usage:
 * ```tsx
 * const [messages, setMessages] = useState<SnackbarMessage[]>([]);
 * const dismiss = (id: string) => setMessages(m => m.filter(x => x.id !== id));
 * const show = (msg: string) => setMessages(m => [...m, { id: Date.now().toString(), message: msg }]);
 *
 * <Snackbar messages={messages} onDismiss={dismiss} />
 * ```
 *
 * @see https://m3.material.io/components/snackbar/overview
 */
const Snackbar: React.FC<SnackbarProps> = ({ messages, onDismiss, className }) => {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = messages[0];

    const handleDismiss = useCallback(() => {
        if (!current || closing) return;
        setClosing(true);
    }, [current, closing]);

    const handleAnimationEnd = useCallback(() => {
        if (closing && current) {
            setVisible(false);
            setClosing(false);
            onDismiss(current.id);
        }
    }, [closing, current, onDismiss]);

    // Show new message
    useEffect(() => {
        if (current && !visible && !closing) {
            setVisible(true);
            setClosing(false);
        }
    }, [current, visible, closing]);

    // Auto-dismiss timer
    useEffect(() => {
        if (!current || !visible || closing) return;

        const duration = current.duration ?? 4000;
        if (duration <= 0) return; // No auto-dismiss

        timerRef.current = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [current, visible, closing, handleDismiss]);

    if (!visible || !current) return null;

    const variant = current.variant || 'default';
    const actionColorClass = variant === 'default'
        ? 'text-inverse-primary hover:text-inverse-primary/80 hover:bg-inverse-primary/[0.08]'
        : variant === 'error'
            ? 'text-error hover:text-error/80 hover:bg-error/[0.08]'
            : 'text-tertiary hover:text-tertiary/80 hover:bg-tertiary/[0.08]';

    return (
        <div
            className={cn(
                "fixed left-4 right-4 z-[110] flex justify-center pointer-events-none",
                "bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]",
                "compact:bottom-[max(6rem,calc(env(safe-area-inset-bottom,0px)+1rem))]",
                "expanded:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))]",
                className
            )}
        >
            <div
                role="status"
                aria-live="polite"
                onAnimationEnd={handleAnimationEnd}
                className={cn(
                    "pointer-events-auto inline-flex items-center gap-2 px-4 py-3 rounded-lg shadow-elevation-3 min-w-0",
                    "max-w-[calc(100vw-32px)] expanded:min-w-[344px] expanded:max-w-[560px]",
                    VARIANT_STYLES[variant],
                    closing
                        ? "animate-out fade-out slide-out-to-bottom-4 duration-150"
                        : "animate-in fade-in slide-in-from-bottom-4 duration-300"
                )}
            >
                {/* Message text */}
                <p className="flex-1 text-body-medium min-w-0 break-words">
                    {current.message}
                </p>

                {/* Action button */}
                {current.action && (
                    <button
                        type="button"
                        onClick={() => {
                            current.action?.onClick();
                            handleDismiss();
                        }}
                        className={cn(
                            'shrink-0 min-h-10 text-label-large font-medium transition-opacity duration-short4 px-3 py-1 rounded-lg outline-none',
                            'focus-visible:ring-2 focus-visible:ring-current',
                            actionColorClass
                        )}
                    >
                        {current.action.label}
                    </button>
                )}

                {/* Close icon */}
                {current.showClose !== false && (
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="shrink-0 w-10 h-10 inline-flex items-center justify-center -mr-1 rounded-lg hover:opacity-80 transition-opacity duration-short4 outline-none focus-visible:ring-2 focus-visible:ring-current"
                        aria-label="Fermer la notification"
                    >
                        <MaterialIcon name="close" size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Snackbar;

