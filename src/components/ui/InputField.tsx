import React, { useId, useMemo, useState } from 'react';
import { XCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import Icon from './Icon';
import MaterialIcon from './MaterialIcon';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Optional Material Symbols icon name */
    icon?: React.ReactNode;
    /** Optional trailing icon element */
    trailingIcon?: React.ReactNode;
    /** Click handler for trailing icon */
    onTrailingIconClick?: () => void;
    /** Accessible label for trailing icon button */
    trailingIconLabel?: string;
    /** Optional prefix text */
    prefix?: string;
    /** Optional suffix text */
    suffix?: string;
    /** Whether this is a password field with toggle */
    isPassword?: boolean;
    /** Whether a password field exposes its visibility toggle */
    showPasswordToggle?: boolean;
    /** Label text */
    label?: string;
    /** Optional class names for the field container and label */
    containerClassName?: string;
    labelClassName?: string;
    /** Hides the visual required marker while preserving native required semantics */
    hideRequiredIndicator?: boolean;
    /** Optional class names for a leading icon or prefix wrapper */
    leadingElementClassName?: string;
    /** Error message */
    error?: string;
    /** Helper/supporting text */
    supportingText?: string;
    /** Show character count helper when maxLength is provided */
    showCharacterCount?: boolean;
    /** MD3 variant: outlined (default) or filled */
    variant?: 'outlined' | 'filled';
}

/**
 * MD3 Text Field component (vocabulaire tokens du DS).
 * - Les deux variantes rendent surface + bordure outline-variant ; elles ne
 *   diffèrent que par le traitement disabled (filled : fond on-surface/4 %).
 * - Focus = bordure + ring opaques focus-ring (Q-V2) ; label text-secondary.
 * - Includes ARIA linking for errors/supporting text.
 */
const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
    (
        {
            icon,
            trailingIcon,
            onTrailingIconClick,
            trailingIconLabel = 'Action',
            prefix,
            suffix,
            isPassword = false,
            showPasswordToggle = true,
            label,
            containerClassName,
            labelClassName,
            hideRequiredIndicator = false,
            leadingElementClassName,
            error,
            supportingText,
            showCharacterCount = false,
            variant = 'filled',
            type = 'text',
            className,
            id: providedId,
            'aria-describedby': ariaDescribedByProp,
            'aria-invalid': ariaInvalidProp,
            'aria-required': ariaRequiredProp,
            ...props
        },
        ref,
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const [internalValue, setInternalValue] = useState(() => {
            if (props.defaultValue === undefined || props.defaultValue === null) return '';
            return String(props.defaultValue);
        });
        const generatedId = useId();

        const inputId = providedId || generatedId;
        const togglePasswordVisibility = () => setShowPassword(!showPassword);

        const isPasswordField = isPassword || type === 'password';
        const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;
        const isControlled = props.value !== undefined;
        const currentValue = useMemo(() => {
            if (isControlled) {
                if (props.value === null || props.value === undefined) return '';
                return String(props.value);
            }
            return internalValue;
        }, [internalValue, isControlled, props.value]);
        const hasLeadingElement = Boolean(icon || prefix);
        const hasPasswordToggle = isPasswordField && showPasswordToggle;
        const hasTrailingElement = Boolean(hasPasswordToggle || trailingIcon || suffix);
        const showCounter = showCharacterCount && typeof props.maxLength === 'number';
        const isDisabled = Boolean(props.disabled);

        const isOutlined = variant === 'outlined';

        const errorId = error ? `${inputId}-error` : undefined;
        const supportingId = supportingText ? `${inputId}-supporting` : undefined;
        const counterId = showCounter ? `${inputId}-counter` : undefined;
        const describedByValues = [
            ariaDescribedByProp as string | undefined,
            error ? errorId : undefined,
            !error && supportingText ? supportingId : undefined,
            counterId,
        ].filter(Boolean) as string[];

        const resolvedAriaDescribedBy =
            describedByValues.length > 0 ? describedByValues.join(' ') : undefined;
        const resolvedAriaInvalid = ariaInvalidProp ?? (error ? true : undefined);
        const resolvedAriaRequired = ariaRequiredProp ?? (props.required ? true : undefined);
        const resolvedAriaLabel =
            (props['aria-label'] as string | undefined) ?? (!label ? props.placeholder : undefined);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isControlled) {
                setInternalValue(e.target.value);
            }
            props.onChange?.(e);
        };

        return (
            <div className={cn('w-full space-y-1', containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            /* `.lab` — 12 sur 16 en 500, encre secondaire, 8 px
                               au-dessus du champ. Elle valait 11 px avec une chasse
                               ouverte : une capitale de plus que l'échelle. */
                            'duration-short4 mb-2 block text-[12px] leading-4 font-medium transition-colors',
                            error
                                ? 'text-error'
                                : isFocused
                                  ? 'text-on-surface'
                                  : 'text-on-surface-variant',
                            isDisabled && 'text-on-surface/[0.38]',
                            labelClassName,
                        )}
                    >
                        {label}
                        {props.required && !hideRequiredIndicator && (
                            <span className="text-error ml-0.5">*</span>
                        )}
                    </label>
                )}
                <div className="group relative">
                    {hasLeadingElement && (
                        <div
                            className={cn(
                                'duration-short4 pointer-events-none absolute inset-y-0 left-3.5 flex items-center gap-2.5 transition-colors',
                                error
                                    ? 'text-error'
                                    : isFocused
                                      ? 'text-on-surface'
                                      : 'text-on-surface-variant',
                                isDisabled && 'text-on-surface/[0.38]',
                                leadingElementClassName,
                            )}
                            aria-hidden="true"
                        >
                            {icon}
                            {prefix && (
                                <span className="text-body-medium text-on-surface-variant">
                                    {prefix}
                                </span>
                            )}
                        </div>
                    )}

                    <input
                        id={inputId}
                        ref={ref}
                        type={inputType}
                        aria-label={resolvedAriaLabel}
                        aria-invalid={resolvedAriaInvalid}
                        aria-required={resolvedAriaRequired}
                        aria-describedby={resolvedAriaDescribedBy}
                        onChange={handleChange}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        className={cn(
                            /*
                             * `.field` de la passe sobre — **le creux, pas le filet.**
                             * Cinq planches (03.3, 04.1, 04.3, 05.1, 10.1) écrivent la
                             * même chose : le fond du creux (`inset` du socle), rayon 4,
                             * hauteur 48, intérieur 14, **16 sur 24 en chasse
                             * normale**. Le champ était cerné, en 15 px et en graisse
                             * 500 : un filet de plus par champ sur des cartes qui en
                             * portent déjà un, et une graisse d'appui sur une valeur
                             * saisie, qui n'appuie rien.
                             *
                             * Les deux branches `isOutlined` étaient d'ailleurs
                             * **identiques** — le rempli n'existait pas, la prop ne
                             * décidait rien. Le filet reste disponible pour le champ
                             * posé sur `surface-container`, où le creux ne se verrait
                             * pas.
                             */
                            'text-on-surface min-h-12 w-full py-3 text-[16px] leading-6',
                            'duration-short4 ease-emphasized transition-[color,background-color,border-color,box-shadow]',
                            'focus:outline-none',
                            'placeholder:text-text-tertiary',
                            'disabled:text-on-surface/[0.38] disabled:placeholder:text-on-surface/[0.38] disabled:cursor-not-allowed',
                            isOutlined
                                ? cn(
                                      'bg-surface rounded-md border',
                                      error
                                          ? 'border-error hover:border-error focus:border-error focus:ring-error focus:ring-2'
                                          : 'border-outline hover:border-outline focus:border-focus-ring focus:ring-focus-ring focus:ring-2',
                                      'disabled:border-on-surface/[0.12] disabled:bg-surface',
                                  )
                                : cn(
                                      'bg-surface-container rounded-md border-0',
                                      error
                                          ? 'ring-error focus:ring-error ring-2 focus:ring-2'
                                          : 'focus:ring-focus-ring focus:ring-2',
                                      'disabled:bg-on-surface/[0.04]',
                                  ),
                            hasLeadingElement ? 'pl-[42px]' : 'px-3.5',
                            hasTrailingElement ? 'pr-12' : 'pr-3.5',
                            className,
                        )}
                        {...props}
                    />

                    {hasTrailingElement && (
                        <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                            {suffix && (
                                <span className="text-body-small text-on-surface-variant pointer-events-none">
                                    {suffix}
                                </span>
                            )}

                            {!isPasswordField &&
                                trailingIcon &&
                                (onTrailingIconClick ? (
                                    <button
                                        type="button"
                                        onClick={onTrailingIconClick}
                                        className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus-visible:ring-focus-ring duration-short4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2"
                                        aria-label={trailingIconLabel}
                                    >
                                        {trailingIcon}
                                    </button>
                                ) : (
                                    <span
                                        className="text-on-surface-variant pointer-events-none inline-flex h-10 w-10 items-center justify-center"
                                        aria-hidden="true"
                                    >
                                        {trailingIcon}
                                    </span>
                                ))}

                            {hasPasswordToggle && (
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus-visible:ring-focus-ring duration-short4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2"
                                    aria-label={
                                        showPassword
                                            ? 'Masquer le mot de passe'
                                            : 'Afficher le mot de passe'
                                    }
                                    aria-pressed={showPassword}
                                >
                                    <MaterialIcon
                                        name={showPassword ? 'visibility_off' : 'visibility'}
                                        size={20}
                                    />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 6 px sous le champ — la métrique de `.ferr` / `.fok` sur 17.5. Portée par le bloc
                    lui-même et non par le `space-y-1` du conteneur : les formulaires qui règlent leur
                    propre rythme neutralisent ce dernier, et le message se retrouvait collé au bord. */}
                {(error || supportingText || showCounter) && (
                    <div className="mt-1.5 ml-4 flex items-start justify-between gap-2">
                        <div className="min-h-[16px]">
                            {/*
                              I3 (§0.3) — l'état porte une icône ET une couleur. `--tk-color-error`
                              seul disparaît pour qui ne distingue pas la teinte, et à l'impression.
                              Le glyphe est fixé par la table du registre : `ph-x-circle`.
                              Forme du message : pattern 17.5, deuxième réponse de la règle de tri —
                              sous CE champ, 40 signes au plus, sans phrase complète.
                            */}
                            {error && (
                                <p
                                    id={errorId}
                                    className="text-body-small text-error flex items-start gap-1.5"
                                    role="alert"
                                >
                                    <Icon glyph={XCircle} size={18} className="mt-px" />
                                    <span>{error}</span>
                                </p>
                            )}

                            {!error && supportingText && (
                                <p
                                    id={supportingId}
                                    className="text-body-small text-on-surface-variant"
                                >
                                    {supportingText}
                                </p>
                            )}
                        </div>

                        {showCounter && (
                            <p
                                id={counterId}
                                className="text-body-small text-on-surface-variant whitespace-nowrap tabular-nums"
                                aria-live="polite"
                            >
                                {currentValue.length}/{props.maxLength}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

InputField.displayName = 'InputField';

export default InputField;
