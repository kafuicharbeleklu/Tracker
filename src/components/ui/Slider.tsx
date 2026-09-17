import React, { useId } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';

import Icon from './Icon';

import { cn } from '../../lib/utils';

/**
 * **Le curseur** — un réglage continu, et le seul du produit : le zoom du recadrage de
 * signature (07.1, lot 28 D2).
 *
 * Il s'appuie sur `<input type="range">` **natif** : c'est lui qui porte le clavier
 * (flèches, Origine/Fin), le pointeur, le tactile et la restitution vocale de la valeur.
 * Le réécrire en `div` et `pointerdown` reviendrait à refaire, moins bien, ce que le
 * navigateur fait déjà — et à le refaire pour chaque plateforme.
 *
 * **La piste et la poignée sont celles de 07.1** : `.trk` de **4** dans le creux
 * `--inset-2`, poignée de **24, rayon 4**, sur la surface, portée par l'ombre de niveau 1.
 * Elles valaient 6 et une pastille ronde de 20 — le diamètre d'un bouton radio : une
 * poignée qui se glisse et une case qui se coche n'ont pas à se ressembler.
 */
interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    /** Ce que le curseur règle, pour qui ne voit pas l'écran — « Zoom ». */
    label: string;
    /** La valeur en toutes lettres — « 1,4× » —, lue à la place du nombre brut. */
    valueText?: string;
    /**
     * **Le moins et le plus qui encadrent la piste** (`.zoom` de 07.1). Le curseur seul
     * demande un geste fin pour un réglage grossier ; les deux crans donnent le pas, et
     * disent au passage dans quel sens la piste travaille. Ils appartiennent au curseur :
     * posés dans l'écran, ils y seraient deux contrôles natifs hors des primitives.
     */
    steppers?: boolean;
    /** Le pas d'un cran — plus large que `step`, qui est celui du glissement. */
    stepperStep?: number;
    className?: string;
}

const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    min,
    max,
    step = 0.1,
    label,
    valueText,
    steppers = false,
    stepperStep,
    className,
}) => {
    const id = useId();
    const cran = stepperStep ?? step * 2;
    const borne = (valeur: number) =>
        Math.min(max, Math.max(min, Number(valeur.toFixed(4))));

    const bouton =
        'text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus-visible:ring-focus-ring flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 disabled:opacity-40';

    return (
        <div className={cn('flex min-h-12 items-center gap-3', className)}>
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            {steppers && (
                <button
                    type="button"
                    aria-label="Réduire"
                    disabled={value <= min}
                    onClick={() => onChange(borne(value - cran))}
                    className={bouton}
                >
                    <Icon glyph={Minus} size={20} />
                </button>
            )}
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                aria-valuetext={valueText}
                onChange={(event) => onChange(Number(event.target.value))}
                className={cn(
                    'h-1 w-full cursor-pointer appearance-none rounded-sm bg-[var(--tk-color-surface-muted-strong)]',
                    'focus-visible:ring-focus-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-surface',
                    /* La poignée : 24, rayon 4, surface, ombre. Les deux sélecteurs sont
                       nécessaires — WebKit et Firefox ne nomment pas la même pièce. */
                    '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:rounded-[4px] [&::-webkit-slider-thumb]:bg-[var(--tk-color-surface)]',
                    '[&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(10,25,29,0.3)]',
                    '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:border-0',
                    '[&::-moz-range-thumb]:rounded-[4px] [&::-moz-range-thumb]:bg-[var(--tk-color-surface)]',
                    '[&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(10,25,29,0.3)]',
                )}
            />
            {steppers && (
                <button
                    type="button"
                    aria-label="Agrandir"
                    disabled={value >= max}
                    onClick={() => onChange(borne(value + cran))}
                    className={bouton}
                >
                    <Icon glyph={Plus} size={20} />
                </button>
            )}
            {/* `.zoom .v` — 40 de large, 14 sur 20 : 13 n'est sur aucune marche. */}
            {valueText && (
                <span className="text-on-surface-variant w-10 shrink-0 text-right text-[14px] leading-5 tabular-nums">
                    {valueText}
                </span>
            )}
        </div>
    );
};

export default Slider;
