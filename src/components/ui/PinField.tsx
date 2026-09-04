import React, { useEffect, useRef, useState } from 'react';

import { PIN_LENGTH } from '../../lib/security';
import { cn } from '../../lib/utils';

/**
 * **Le champ du code PIN** — planche 06.2, colonne 2. *Un seul composant sur toutes
 * les feuilles.*
 *
 * ## La règle de masquage, et pourquoi elle existe
 *
 * *« Le chiffre tapé reste lisible, les précédents se masquent. »* On corrige une
 * frappe sans exposer le code : le lecteur voit ce qu'il vient de faire, l'épaule
 * voisine ne voit rien. Un champ tout masqué oblige à tout effacer au premier doute ;
 * un champ tout lisible expose six chiffres à la ronde.
 *
 * ## La sixième frappe valide seule
 *
 * *« Validation sans bouton. »* Un pavé complet n'attend rien : il n'y a plus qu'une
 * chose à faire, et demander un tap de plus pour la faire n'ajoute aucune décision.
 *
 * ## Le refus ne vide pas le champ en silence
 *
 * Le pavé se cerne de rouge, garde ses chiffres, et **dit combien d'essais restent**
 * avant que la signature prenne le relais. Un champ qui se vide sans phrase laisse
 * croire à une faute de frappe qu'on n'a pas faite.
 *
 * ## Ses mesures, déclarées par la planche
 *
 * Case **44 × 56**, rayon 4, écart **10**, chiffre **24 en Archivo 600**, clavier
 * numérique du système. Elles valaient `64 × 76` et 34 px — la géométrie de juillet,
 * dessinée pour quatre cases : à six, la rangée débordait la largeur du téléphone.
 *
 * **Ce composant ne sert qu'au code PIN.** Un autre code — application
 * d'authentification, code de secours, code à usage unique — se saisit dans un champ
 * ordinaire : ces six cases sont le signe visuel du PIN, et les employer ailleurs
 * apprend au lecteur une chose fausse.
 */

export type PinFieldState = 'idle' | 'error' | 'ok';

interface PinFieldProps {
    /** Le code saisi, piloté par l'appelant. */
    value: string;
    onChange: (value: string) => void;
    /** Appelé à la **dernière frappe**, avec le code complet. */
    onComplete?: (value: string) => void;
    state?: PinFieldState;
    disabled?: boolean;
    autoFocus?: boolean;
    /** Ce que le pavé nomme pour un lecteur d'écran. */
    label?: string;
}

const PinField: React.FC<PinFieldProps> = ({
    value,
    onChange,
    onComplete,
    state = 'idle',
    disabled = false,
    autoFocus = false,
    label = 'Code PIN',
}) => {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    /** L'index de la dernière frappe : c'est le seul chiffre qui reste lisible. */
    const [lastTyped, setLastTyped] = useState<number | null>(null);

    useEffect(() => {
        if (autoFocus) refs.current[0]?.focus();
    }, [autoFocus]);

    useEffect(() => {
        if (value.length === 0) setLastTyped(null);
    }, [value]);

    const setDigit = (index: number, digit: string) => {
        if (disabled) return;
        const clean = digit.replace(/\D/g, '').slice(-1);
        const next = value.padEnd(PIN_LENGTH, ' ').split('');
        next[index] = clean || ' ';
        const joined = next.join('').replace(/ +$/, '');

        onChange(joined.trimEnd());
        if (!clean) {
            setLastTyped(null);
            return;
        }
        setLastTyped(index);
        if (index < PIN_LENGTH - 1) {
            refs.current[index + 1]?.focus();
        } else {
            const complete = joined.replace(/\s/g, '');
            if (complete.length === PIN_LENGTH) onComplete?.(complete);
        }
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !value[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    return (
        <div
            className="flex justify-center gap-2.5"
            role="group"
            aria-label={`${label} — ${PIN_LENGTH} chiffres`}
        >
            {Array.from({ length: PIN_LENGTH }, (_, index) => {
                const digit = value[index] ?? '';
                const filled = Boolean(digit && digit !== ' ');
                /* Le dernier tapé se lit ; les autres deviennent un point. */
                const shown = filled ? (index === lastTyped ? digit : '•') : '';
                return (
                    <input
                        key={index}
                        ref={(el) => {
                            refs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        disabled={disabled}
                        value={shown}
                        onChange={(event) => setDigit(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        onFocus={(event) => event.currentTarget.select()}
                        aria-label={`Chiffre ${index + 1} sur ${PIN_LENGTH}`}
                        className={cn(
                            'font-brand h-14 w-11 rounded-md text-center text-[24px] font-semibold caret-transparent outline-none',
                            'duration-short4 transition-[box-shadow,background-color]',
                            filled
                                ? 'text-on-surface bg-surface-container'
                                : 'text-text-tertiary bg-transparent shadow-[inset_0_0_0_1px_var(--tk-color-outline-variant)]',
                            !filled &&
                                'focus:shadow-[inset_0_0_0_2px_var(--tk-color-text-primary)]',
                            filled && 'focus:shadow-[inset_0_0_0_2px_var(--tk-color-text-primary)]',
                            state === 'error' &&
                                '!shadow-[inset_0_0_0_1.5px_var(--tk-color-error)]',
                            state === 'ok' &&
                                '!bg-[var(--tk-color-tint-vert)] !text-[var(--tk-color-on-tint-vert)] !shadow-none',
                            disabled && 'opacity-60',
                        )}
                    />
                );
            })}
        </div>
    );
};

export default PinField;
