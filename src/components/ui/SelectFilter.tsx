import React, { useState, useRef, useEffect, useCallback } from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface SelectFilterOption {
    value: string;
    label: string;
}

interface SelectFilterProps {
    label?: string;
    placeholder?: string;
    options: SelectFilterOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

/**
 * MD3 Filter Dropdown — pill-shaped trigger, used in toolbars.
 * Full keyboard navigation: ↑/↓ to navigate, Enter/Space to select, Escape to close.
 */
export const SelectFilter: React.FC<SelectFilterProps> = ({
    label,
    placeholder,
    options,
    value,
    onChange,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Reset highlighted index when opening
    useEffect(() => {
        if (isOpen) {
            const currentIndex = options.findIndex((opt) => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [isOpen, options, value]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex, isOpen]);

    const handleClose = useCallback(() => {
        if (!isOpen || closing) return;
        setClosing(true);
    }, [isOpen, closing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

    const handleAnimationEnd = useCallback(() => {
        if (closing) {
            setIsOpen(false);
            setClosing(false);
            setHighlightedIndex(-1);
        }
    }, [closing]);

    const handleOpen = useCallback(() => {
        if (isOpen) {
            handleClose();
        } else {
            setIsOpen(true);
            setClosing(false);
        }
    }, [isOpen, handleClose]);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = useCallback(
        (optionValue: string) => {
            onChange(optionValue);
            handleClose();
        },
        [onChange, handleClose],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    } else {
                        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    } else {
                        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
                    }
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
                        handleSelect(options[highlightedIndex].value);
                    } else if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    if (isOpen) handleClose();
                    break;

                case 'Home':
                    if (isOpen) {
                        e.preventDefault();
                        setHighlightedIndex(0);
                    }
                    break;

                case 'End':
                    if (isOpen) {
                        e.preventDefault();
                        setHighlightedIndex(options.length - 1);
                    }
                    break;
            }
        },
        [isOpen, highlightedIndex, options, handleSelect, handleClose],
    );

    const defaultLabel = label || placeholder || 'select';
    const listboxId = `${defaultLabel.replace(/\s+/g, '-').toLowerCase()}-filter-listbox`;
    const activeDescendantId =
        highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined;

    return (
        <div className={cn('relative', className)} ref={dropdownRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                onKeyDown={handleKeyDown}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={isOpen ? listboxId : undefined}
                aria-activedescendant={isOpen ? activeDescendantId : undefined}
                className={cn(
                    'text-label-large duration-short4 bg-surface inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border px-3 transition-all outline-none',
                    isOpen
                        ? 'border-focus-ring text-on-surface ring-focus-ring ring-2'
                        : 'border-outline text-on-surface hover:bg-surface-container',
                    'focus-visible:ring-focus-ring focus-visible:ring-2 focus-visible:ring-offset-1',
                )}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : defaultLabel}
                </span>
                <MaterialIcon
                    name="arrow_drop_down"
                    size={20}
                    className={cn(
                        'duration-short4 ease-emphasized shrink-0 transition-transform',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {/* Dropdown */}
            {(isOpen || closing) && (
                <div
                    className={cn(
                        'bg-surface border-outline shadow-elevation-2 absolute z-50 mt-1 max-w-[300px] min-w-[160px] origin-top-left overflow-hidden rounded-md border py-1',
                        closing
                            ? 'animate-out fade-out zoom-out-95 duration-150'
                            : 'animate-in fade-in zoom-in-95 duration-200',
                    )}
                    role="listbox"
                    id={listboxId}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <div className="custom-scrollbar max-h-60 overflow-y-auto py-1">
                        {options.map((opt, index) => (
                            <div
                                key={opt.value}
                                ref={(el) => {
                                    optionRefs.current[index] = el;
                                }}
                                id={`${listboxId}-option-${index}`}
                                onClick={() => handleSelect(opt.value)}
                                role="option"
                                aria-selected={value === opt.value}
                                className={cn(
                                    'text-body-medium duration-short3 flex min-h-10 cursor-pointer items-center justify-between px-3 py-2 transition-colors',
                                    value === opt.value
                                        ? 'bg-primary text-on-primary'
                                        : highlightedIndex === index
                                          ? 'bg-surface-container text-on-surface'
                                          : 'text-on-surface hover:bg-surface-container',
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && (
                                    <MaterialIcon
                                        name="check"
                                        size={18}
                                        className="text-on-primary ml-2 shrink-0"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
