import React from 'react';
import { Minus, Plus } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **Le pas à pas** (25/09) — un nombre entier qu'on ajuste d'un cran : une durée en
 * années, un pourcentage par cinq. Il remplace le champ numérique nu de l'amortissement,
 * où l'on tapait « 3 » dans une case de 96 px sans savoir en quelle unité, et que le
 * clavier du téléphone ouvrait en plein écran pour un chiffre.
 *
 * Le moins et le plus encadrent la valeur, qui porte son unité ; aux bornes, le geste qui
 * les franchirait s'éteint. La valeur est annoncée (`aria-live`) à chaque cran.
 */
interface StepperProps {
    /** Ce qu'on règle, pour qui ne voit pas la rangée : « Durée en années ». */
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    /** La valeur écrite, unité comprise : « 3 ans », « 10 % ». */
    format?: (value: number) => string;
    className?: string;
}

const Stepper: React.FC<StepperProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    format = (valeur) => String(valeur),
    className,
}) => {
    const borne = (valeur: number) => Math.min(max, Math.max(min, valeur));
    return (
        <div
            role="group"
            aria-label={label}
            className={cn(
                'border-outline-variant bg-surface inline-flex h-10 shrink-0 items-center rounded-md border',
                className,
            )}
        >
            <Button
                variant="text"
                iconOnly
                aria-label={`${label} : moins`}
                disabled={value <= min}
                onClick={() => onChange(borne(value - step))}
                className="h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 rounded-md"
            >
                <Icon glyph={Minus} size={18} />
            </Button>
            <span
                aria-live="polite"
                className="font-brand text-on-surface text-ts-body leading-ts-body min-w-[4.5rem] px-1 text-center font-semibold tabular-nums"
            >
                {format(value)}
            </span>
            <Button
                variant="text"
                iconOnly
                aria-label={`${label} : plus`}
                disabled={value >= max}
                onClick={() => onChange(borne(value + step))}
                className="h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 rounded-md"
            >
                <Icon glyph={Plus} size={18} />
            </Button>
        </div>
    );
};

export default Stepper;
