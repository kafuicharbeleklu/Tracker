import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
    /** Tooltip content (text or rich) */
    content: React.ReactNode;
    /** Trigger element */
    children: React.ReactElement;
    /** Tooltip variant */
    variant?: 'plain' | 'rich';
    /** Preferred placement */
    placement?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before showing (ms). Defaults: plain 1000, rich 500 */
    delay?: number;
    /** Rich tooltips can stay open when hovered/focused */
    interactive?: boolean;
    /** Custom class */
    className?: string;
}

/**
 * MD3 Tooltip — Plain (text) and Rich (text + actions).
 * Plain: max-width 200dp, Body Small, inverse-surface/inverse-on-surface.
 * Rich: max-width 320dp, Body Medium, surface-container + on-surface.
 *
 * @see https://m3.material.io/components/tooltips/overview
 */
const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    variant = 'plain',
    placement = 'top',
    delay,
    interactive,
    className,
}) => {
    const [visible, setVisible] = useState(false);
    const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipId = useId();
    const isInteractive = interactive ?? (variant === 'rich');
    const resolvedDelay = delay ?? (variant === 'plain' ? 1000 : 500);

    const clearTimers = useCallback(() => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }, []);

    const showWithDelay = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        showTimerRef.current = setTimeout(() => setVisible(true), resolvedDelay);
    }, [resolvedDelay]);

    const showNow = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        setVisible(true);
    }, []);

    const hideWithDelay = useCallback(() => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        const timeout = isInteractive ? 120 : 0;
        hideTimerRef.current = setTimeout(() => setVisible(false), timeout);
    }, [isInteractive]);

    const hideNow = useCallback(() => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setVisible(false);
    }, []);

    const handleTouchStart = useCallback(() => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            setVisible(true);
        }, 600);
    }, []);

    const handleBlurWithin = useCallback((e: React.FocusEvent<HTMLElement>) => {
        const nextFocused = e.relatedTarget as Node | null;
        if (nextFocused && wrapperRef.current?.contains(nextFocused)) {
            return;
        }
        hideWithDelay();
    }, [hideWithDelay]);

    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, [clearTimers]);

    useEffect(() => {
        if (!visible || !isInteractive) return;
        const onEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideNow();
            }
        };
        document.addEventListener('keydown', onEscape);
        return () => document.removeEventListener('keydown', onEscape);
    }, [visible, isInteractive, hideNow]);

    const placementClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const isPlain = variant === 'plain';
    const childElement = React.Children.only(children);
    const existingDescribedBy = (childElement.props as Record<string, unknown>)['aria-describedby'];
    const mergedDescribedBy = visible
        ? [existingDescribedBy, tooltipId].filter(Boolean).join(' ')
        : existingDescribedBy;
    const mergedChild = React.cloneElement(childElement, {
        'aria-describedby': mergedDescribedBy as string | undefined,
    });

    return (
        <div
            ref={wrapperRef}
            className="relative inline-flex"
            onMouseEnter={showWithDelay}
            onMouseLeave={hideWithDelay}
            onFocus={showNow}
            onBlur={handleBlurWithin}
            onTouchStart={handleTouchStart}
            onTouchEnd={hideNow}
            onTouchCancel={hideNow}
        >
            {mergedChild}

            {visible && (
                <div
                    id={tooltipId}
                    role="tooltip"
                    className={cn(
                        "absolute z-[100]",
                        "animate-in fade-in zoom-in-95 duration-150",
                        placementClasses[placement],
                        isPlain
                            ? "bg-inverse-surface text-inverse-on-surface text-body-small rounded-md px-2 py-1 max-w-[200px] shadow-elevation-1 pointer-events-none"
                            : "bg-surface-container text-on-surface text-body-medium rounded-md p-4 max-w-[320px] shadow-elevation-2 pointer-events-auto",
                        className
                    )}
                    onMouseEnter={isInteractive ? showNow : undefined}
                    onMouseLeave={isInteractive ? hideWithDelay : undefined}
                    onFocusCapture={isInteractive ? showNow : undefined}
                    onBlurCapture={isInteractive ? handleBlurWithin : undefined}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;

