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
 * L'interrupteur — `.sw` des planches **00.4** et **14.1**.
 *
 * **44 × 26, rayon plein** : le creux `--inset-2` au repos, le sombre du produit une fois
 * posé, et un bouton rond de 20, blanc, à 3 du bord, qui glisse de 18 sans changer de
 * taille. Il reprenait l'interrupteur MD3 — 52 × 32, cerné, jaune une fois posé, un
 * bouton qui grossissait en changeant d'état — relevé sur 8 écrans le 13/09. Le jaune
 * est la couleur d'un acte ; un réglage posé n'en est pas un.
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
                        'duration-medium1 ease-emphasized h-[26px] w-11 rounded-full transition-colors',
                        'peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                        checked ? 'bg-inverse-surface' : 'bg-surface-muted-strong',
                    )}
                    aria-hidden="true"
                />
                {/* Thumb */}
                <div
                    className={cn(
                        'duration-medium1 ease-emphasized bg-surface absolute top-[3px] left-[3px] flex h-5 w-5 items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform',
                        checked ? 'translate-x-[18px]' : 'translate-x-0',
                    )}
                    aria-hidden="true"
                >
                    {icon && (
                        <MaterialIcon name={icon} size={14} className="text-on-surface-variant" />
                    )}
                </div>
            </div>
            {label && <span className="text-on-surface text-[16px] leading-6">{label}</span>}
        </label>
    );
};

export default Toggle;
