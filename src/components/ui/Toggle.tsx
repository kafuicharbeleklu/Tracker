import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    /**
     * Le nom que lit un lecteur d'écran quand l'interrupteur n'écrit pas son libellé : la
     * rangée qui le porte le dit déjà. Sans lui, il s'annonçait « Toggle ».
     */
    nom?: string;
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
    nom,
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
                    aria-label={label || nom || 'Interrupteur'}
                />
                {/* Track */}
                <div
                    className={cn(
                        'duration-medium1 ease-emphasized h-[26px] w-11 rounded-full transition-colors',
                        'peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                        checked ? 'bg-contrast-fill' : 'bg-surface-muted-strong',
                    )}
                    aria-hidden="true"
                />
                {/* Thumb */}
                <div
                    className={cn(
                        /* Le pouce glisse au ressort ample (11/10) : il dépasse d'un rien sa butée puis s'y
                           pose. La couleur de la piste, elle, garde sa courbe : pas de rebond sur une
                           couleur. */
                        'mvt-ressort-ample absolute top-[3px] left-[3px] flex h-5 w-5 items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform',
                        /* Le bouton est blanc en clair, allumé ou non. En sombre, il prend
                           l'encre du plein une fois allumé, et l'encre secondaire éteint :
                           la couleur de la carte s'y confondait avec la piste. */
                        checked
                            ? 'bg-on-contrast-fill translate-x-[18px]'
                            : 'bg-surface sombre:bg-on-surface-variant translate-x-0',
                    )}
                    aria-hidden="true"
                >
                    {icon && (
                        <MaterialIcon name={icon} size={14} className="text-on-surface-variant" />
                    )}
                </div>
            </div>
            {label && <span className="text-on-surface text-ts-body leading-ts-body">{label}</span>}
        </label>
    );
};

export default Toggle;
