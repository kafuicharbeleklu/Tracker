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
                ? selectedValues.filter((v) => v !== optionValue)
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
                'border-outline-variant bg-surface shadow-elevation-1 inline-flex gap-1 rounded-xl border p-1',
                disabled && 'cursor-not-allowed opacity-[0.38]',
                className,
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
                            'duration-short4 ease-emphasized relative flex items-center justify-center gap-2 transition-all outline-none',
                            'focus-visible:ring-focus-ring focus-visible:ring-2',
                            density === 'compact'
                                ? 'text-label-medium h-8 px-3'
                                : 'text-label-large h-10 px-4',
                            'rounded-lg',
                            isSelected
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface text-on-surface',
                            !disabled && !isSelected && 'hover:bg-surface-container',
                            !disabled && isSelected && 'hover:bg-primary/90',
                            !disabled && 'active:scale-[0.98]',
                        )}
                    >
                        {/* Checkmark for selected state */}
                        {isSelected && <MaterialIcon name="check" size={18} className="shrink-0" />}

                        {/* Icon (only when not selected or no checkmark conflict) */}
                        {option.icon && !isSelected && (
                            <MaterialIcon name={option.icon} size={18} className="shrink-0" />
                        )}

                        <span className="truncate">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedButton;
