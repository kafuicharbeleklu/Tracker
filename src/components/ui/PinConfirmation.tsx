import React, { useCallback, useState } from 'react';

import { isValidPinFormat, PIN_LENGTH } from '../../lib/security';
import { cn } from '../../lib/utils';
import Button from './Button';
import PinField, { type PinFieldState } from './PinField';

/**
 * **Poser un code de remise, en deux temps** — le formulaire de référence de 06.2, que
 * 02.2 reprend *« tel quel : champ, masquage, refus, seconde saisie, c'est le même
 * fichier »*. Il vit donc ici, une fois, pour les deux écrans qui posent un code : la
 * première connexion (02.2, écran 3) et « Mon compte » (07.1).
 *
 * **Chacun se saisit deux fois**, comme un mot de passe : la règle de 02.2 vaut pour les
 * deux secrets. Le code vaut signature et ne se relit jamais — une frappe fausse à la
 * première saisie ne se verrait qu'à la première remise, devant la personne qui tend
 * l'objet. La seconde saisie l'attrape ici.
 *
 * Le crochet porte l'état ; le composant le dessine. L'écran qui les emploie garde son
 * propre cadre — le héro d'une page d'arrivée, ou le pied d'une feuille — et ne lit que
 * trois choses : `matched`, `pin`, et `refuse()` quand l'enregistrement échoue.
 */

export type PinStep = 'entry' | 'confirm';

/** Le refus d'un code faible — `isValidPinFormat` n'en écarte que deux sortes. */
export const PIN_WEAK_MESSAGE = 'Ni une suite, ni six fois le même chiffre.';

export const usePinConfirmation = (options?: {
    /**
     * Un refus propre à l'écran, posé **au premier temps** après le contrôle de format —
     * « le nouveau code est identique à l'actuel », par exemple. Rendre `null` laisse
     * passer.
     */
    validate?: (pin: string) => string | null;
}) => {
    const validate = options?.validate;
    const [step, setStep] = useState<PinStep>('entry');
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [issue, setIssue] = useState<string | null>(null);

    const matched = step === 'confirm' && pin.length === PIN_LENGTH && confirm === pin;

    const onChange = useCallback(
        (value: string) => {
            if (issue) setIssue(null);
            if (step === 'entry') setPin(value);
            else setConfirm(value);
        },
        [issue, step],
    );

    const onComplete = useCallback(
        (value: string) => {
            if (step === 'entry') {
                if (!isValidPinFormat(value)) {
                    setIssue(PIN_WEAK_MESSAGE);
                    return;
                }
                const refus = validate?.(value);
                if (refus) {
                    setIssue(refus);
                    return;
                }
                setStep('confirm');
                setIssue(null);
                return;
            }
            if (value !== pin) setIssue('Les deux codes diffèrent.');
        },
        [pin, step, validate],
    );

    /** Tout reprendre depuis la première saisie. */
    const restart = useCallback(() => {
        setPin('');
        setConfirm('');
        setStep('entry');
        setIssue(null);
    }, []);

    /** Le refus venu de l'enregistrement — il se lit à la même place que les autres. */
    const refuse = useCallback((reason: string) => setIssue(reason), []);

    const state: PinFieldState = issue ? 'error' : matched ? 'ok' : 'idle';

    return { step, pin, confirm, issue, matched, state, onChange, onComplete, restart, refuse };
};

export type PinConfirmationModel = ReturnType<typeof usePinConfirmation>;

/**
 * `.pinsteps` — un tiret par temps, ceux qu'on a faits et celui qu'on vit en encre
 * pleine. Deux pour poser un code ; **trois pour le remplacer**, le code actuel venant
 * d'abord.
 */
export const PinSteps: React.FC<{ total: number; current: number; className?: string }> = ({
    total,
    current,
    className,
}) => (
    <div className={cn('flex gap-1.5', className)} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
            <span
                key={index}
                className={cn(
                    'h-1 w-6 rounded-[2px]',
                    index <= current ? 'bg-on-surface' : 'bg-outline-variant',
                )}
            />
        ))}
    </div>
);

/**
 * Le champ, les deux temps, la ligne d'indication — `.pin`, `.pinsteps` et `.pinhint`
 * de 02.2, **centrés** comme `.pinpage` les pose.
 */
const PinConfirmation: React.FC<{
    model: PinConfirmationModel;
    /** Le nom du champ à chaque temps, pour qui ne voit pas les cases. */
    labels: { entry: string; confirm: string };
    /**
     * Les temps qui précèdent celui-ci — un remplacement demande d'abord le code actuel,
     * et l'indicateur compte alors trois tirets au lieu de deux.
     */
    stepsBefore?: number;
    autoFocus?: boolean;
    className?: string;
}> = ({ model, labels, stepsBefore = 0, autoFocus, className }) => {
    const { step, pin, confirm, issue, matched, state, onChange, onComplete, restart } = model;

    const hint = issue
        ? issue
        : step === 'entry'
          ? 'Vous le retaperez pour le confirmer.'
          : matched
            ? 'Les deux codes concordent.'
            : 'Retapez-le pour le confirmer.';

    return (
        <div className={cn('flex flex-col items-center', className)}>
            <PinField
                /* La clé remet le champ à neuf au second temps : six cases vides, le
                   curseur sur la première. */
                key={step}
                value={step === 'entry' ? pin : confirm}
                onChange={onChange}
                onComplete={onComplete}
                state={state}
                autoFocus={autoFocus}
                label={step === 'entry' ? labels.entry : labels.confirm}
            />

            <PinSteps
                className="mt-4"
                total={stepsBefore + 2}
                current={stepsBefore + (step === 'confirm' ? 1 : 0)}
            />

            <p
                className={cn(
                    'mt-2 max-w-[300px] text-center text-[14px] leading-5',
                    issue ? 'text-error' : 'text-on-surface-variant',
                )}
                role={issue ? 'alert' : undefined}
                aria-live="polite"
            >
                {hint}
                {/* Recommencer n'a de sens qu'une fois le premier code posé : avant, il
                    suffit d'effacer une case. */}
                {issue && step === 'confirm' && (
                    <>
                        {' '}
                        <Button
                            variant="text"
                            onClick={restart}
                            className="text-on-surface hover:text-on-surface h-auto !min-h-0 min-w-0 p-0 align-baseline text-[14px] leading-5 font-medium underline underline-offset-[3px] hover:bg-transparent"
                        >
                            Recommencer
                        </Button>
                    </>
                )}
            </p>
        </div>
    );
};

export default PinConfirmation;
