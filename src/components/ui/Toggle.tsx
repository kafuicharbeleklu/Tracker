import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    /** Material Symbols icon name to show inside the handle */
    icon?: string;
    className?: string;
}

/**
 * MD3 Switch component.
 * Track: 52x32, Thumb: 16px (off) / 24px (on)
 * Uses primary + primaryContainer tokens.
 */
const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
    icon,
    className,
}) => {
    return (
        <label
            className={cn(
                'group inline-flex items-center gap-3 select-none',
                disabled ? 'cursor-not-allowed opacity-38' : 'cursor-pointer',
                className,
            )}
        >
            <div className="relative">
                {/* `peer` : l'input est visuellement masqué (sr-only) mais reste l'élément
            focalisable. Sans relais `peer-focus-visible` sur la piste, le composant
            n'avait AUCUN état de focus — invisible au clavier (Tracker DS v1, tâche 1). */}
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                    role="switch"
                    aria-checked={checked}
                    aria-label={label || 'Toggle'}
                />
                {/* Track */}
                <div
                    className={cn(
                        'duration-medium1 ease-emphasized h-[32px] w-[52px] rounded-full border-2 transition-all',
                        'peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                        checked
                            ? 'bg-primary border-primary'
                            : 'bg-surface-container-highest border-outline',
                    )}
                    aria-hidden="true"
                />
                {/* Thumb (state layer + thumb) */}
                <div
                    className={cn(
                        'shadow-elevation-1 duration-medium1 ease-emphasized absolute flex transform items-center justify-center rounded-full transition-all',
                        'before:duration-short2 before:absolute before:inset-[-8px] before:rounded-full before:bg-current before:opacity-0 before:transition-opacity group-hover:before:opacity-[0.08]',
                        checked
                            ? 'bg-on-primary top-[3px] h-6 w-6 translate-x-[24px]'
                            : icon
                              ? 'bg-surface-container-highest top-[3px] h-6 w-6 translate-x-[2px]'
                              : 'bg-outline top-[7px] h-4 w-4 translate-x-[6px]',
                    )}
                    aria-hidden="true"
                >
                    {icon && (
                        <MaterialIcon
                            name={icon}
                            size={16}
                            className={cn(
                                'duration-medium1 transition-colors',
                                checked ? 'text-on-primary-container' : 'text-on-surface-variant',
                            )}
                        />
                    )}
                </div>
            </div>
            {label && (
                <span className="text-body-medium text-on-surface group-hover:text-on-surface duration-short4 transition-colors">
                    {label}
                </span>
            )}
        </label>
    );
};

export default Toggle;
