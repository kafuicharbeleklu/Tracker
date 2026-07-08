import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface SegmentedButtonOption {
    value: string;
    label: string;
    icon?: string;
}

interface SegmentedButtonProps {
    /** Array of 2-5 options */
    options: SegmentedButtonOption[];
    /** Current selected value(s) — string for single-select, string[] for multi-select */
    value: string | string[];
    /** Change handler */
    onChange: (value: string | string[]) => void;
    /** Allow multiple selections */
    multiSelect?: boolean;
    /** Density variant */
    density?: 'default' | 'compact';
    /** Disabled */
    disabled?: boolean;
    className?: string;
}

/**
 * MD3 Segmented Button — 2-5 options, single or multi-select.
 * Uses outlined container with shared borders, active indicator with checkmark.
 *
 * @see https://m3.material.io/components/segmented-buttons/overview
 */
const SegmentedButton: React.FC<SegmentedButtonProps> = ({
    options,
    value,
    onChange,
    multiSelect = false,
    density = 'default',
    disabled = false,
    className,
}) => {
    const selectedValues = Array.isArray(value) ? value : [value];

    const handleClick = (optionValue: string) => {
        if (disabled) return;

        if (multiSelect) {
            const current = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange(current.length > 0 ? current : selectedValues); // prevent deselecting all
        } else {
            onChange(optionValue);
        }
    };

    return (
        <div
            role="group"
            className={cn(
                "inline-flex gap-1 rounded-xl border border-outline-variant bg-surface p-1 shadow-elevation-1",
                disabled && "opacity-[0.38] cursor-not-allowed",
                className
            )}
        >
            {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleClick(option.value)}
                        aria-pressed={isSelected}
                        className={cn(
                            "relative flex items-center justify-center gap-2 transition-all duration-short4 ease-emphasized outline-none",
                            "focus-visible:ring-2 focus-visible:ring-primary/30",
                            density === 'compact' ? "px-3 h-8 text-label-medium" : "px-4 h-10 text-label-large",
                            "rounded-lg",
                            isSelected
                                ? "bg-primary text-on-primary shadow-sm"
                                : "bg-surface text-on-surface",
                            !disabled && !isSelected && "hover:bg-surface-container",
                            !disabled && isSelected && "hover:bg-primary/90",
                            !disabled && "active:scale-[0.98]",
                        )}
                    >
                        {/* Checkmark for selected state */}
                        {isSelected && (
                            <MaterialIcon
                                name="check"
                                size={18}
                                className="shrink-0"
                            />
                        )}

                        {/* Icon (only when not selected or no checkmark conflict) */}
                        {option.icon && !isSelected && (
                            <MaterialIcon
                                name={option.icon}
                                size={18}
                                className="shrink-0"
                            />
                        )}

                        <span className="truncate">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedButton;


