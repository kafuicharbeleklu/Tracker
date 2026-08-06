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
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false, icon, className }) => {
  return (
    <label className={cn("inline-flex items-center select-none group gap-3", disabled ? "cursor-not-allowed opacity-38" : "cursor-pointer", className)}>
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
          aria-label={label || "Toggle"}
        />
        {/* Track */}
        <div
          className={cn(
            "w-[52px] h-[32px] rounded-full transition-all duration-medium1 ease-emphasized border-2",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
            checked
              ? 'bg-primary border-primary'
              : 'bg-surface-container-highest border-outline'
          )}
          aria-hidden="true"
        />
        {/* Thumb (state layer + thumb) */}
        <div
          className={cn(
            "absolute rounded-full shadow-elevation-1 transition-all duration-medium1 ease-emphasized transform flex items-center justify-center",
            "before:absolute before:inset-[-8px] before:rounded-full before:bg-current before:opacity-0 before:transition-opacity before:duration-short2 group-hover:before:opacity-[0.08]",
            checked
              ? "bg-on-primary w-6 h-6 top-[3px] translate-x-[24px]"
              : icon ? "bg-surface-container-highest w-6 h-6 top-[3px] translate-x-[2px]" : "bg-outline w-4 h-4 top-[7px] translate-x-[6px]"
          )}
          aria-hidden="true"
        >
          {icon && (
            <MaterialIcon
              name={icon}
              size={16}
              className={cn(
                "transition-colors duration-medium1",
                checked ? "text-on-primary-container" : "text-on-surface-variant"
              )}
            />
          )}
        </div>
      </div>
      {label && (
        <span className="text-body-medium text-on-surface group-hover:text-on-surface transition-colors duration-short4">
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
