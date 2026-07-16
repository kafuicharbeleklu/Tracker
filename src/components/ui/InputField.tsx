import React, { useId, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
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
  /** Label text */
  label?: string;
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
 * MD3 Text Field component.
 * - Filled (default): surface-container-highest bg, bottom border active indicator
 * - Outlined: transparent bg, outline border
 * - Includes ARIA linking for errors/supporting text.
 */
const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(({
  icon,
  trailingIcon,
  onTrailingIconClick,
  trailingIconLabel = 'Action',
  prefix,
  suffix,
  isPassword = false,
  label,
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
}, ref) => {
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
  const hasTrailingElement = Boolean(isPasswordField || trailingIcon || suffix);
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

  const resolvedAriaDescribedBy = describedByValues.length > 0 ? describedByValues.join(' ') : undefined;
  const resolvedAriaInvalid = ariaInvalidProp ?? (error ? true : undefined);
  const resolvedAriaRequired = ariaRequiredProp ?? (props.required ? true : undefined);
  const resolvedAriaLabel =
    (props['aria-label'] as string | undefined) ??
    (!label ? props.placeholder : undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    props.onChange?.(e);
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-label-medium font-bold uppercase mb-2 transition-colors duration-short4",
            error ? "text-error" : isFocused ? "text-[var(--color-text-primary)]" : "text-[var(--color-neutral-600)]",
            isDisabled && "text-on-surface/[0.38]"
          )}
        >
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative group">
        {hasLeadingElement && (
          <div
            className={cn(
              'absolute inset-y-0 left-4 flex items-center gap-2 pointer-events-none transition-colors duration-short4',
              error ? 'text-error' : isFocused ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-neutral-500)]',
              isDisabled && 'text-on-surface/[0.38]'
            )}
            aria-hidden="true"
          >
            {icon}
            {prefix && (
              <span className="text-body-medium text-[var(--color-neutral-500)]">
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
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
          className={cn(
            'w-full min-h-11 px-4 py-3 text-title-small font-medium text-[var(--color-text-primary)]',
            'transition-[color,background-color,border-color,box-shadow] duration-short4 ease-emphasized',
            'focus:outline-none',
            'placeholder:text-[var(--color-neutral-500)]',
            'disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:placeholder:text-on-surface/[0.38]',
            isOutlined
              ? cn(
                'bg-surface rounded-lg border',
                error
                  ? 'border-error hover:border-error focus:border-error focus:ring-2 focus:ring-error/20'
                  : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] focus:border-black focus:ring-4 focus:ring-black/10',
                'disabled:border-on-surface/[0.12] disabled:bg-surface'
              )
              : cn(
                'bg-surface rounded-lg border',
                error
                  ? 'border-error hover:border-error focus:border-error focus:ring-2 focus:ring-error/20'
                  : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] focus:border-black focus:ring-4 focus:ring-black/10',
                'disabled:bg-on-surface/[0.04] disabled:border-on-surface/[0.12]'
              ),
            hasLeadingElement ? 'pl-12' : 'pl-4',
            hasTrailingElement ? 'pr-12' : 'pr-4',
            className,
          )}
          {...props}
        />

        {hasTrailingElement && (
          <div className="absolute inset-y-0 right-3 flex items-center gap-1">
            {suffix && (
              <span className="text-body-small text-[var(--color-neutral-500)] pointer-events-none">
                {suffix}
              </span>
            )}

            {!isPasswordField && trailingIcon && (
              onTrailingIconClick ? (
                <button
                  type="button"
                  onClick={onTrailingIconClick}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-[var(--color-neutral-500)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] focus-visible:ring-2 focus-visible:ring-black/10 transition-colors duration-short4"
                  aria-label={trailingIconLabel}
                >
                  {trailingIcon}
                </button>
              ) : (
                <span className="h-10 w-10 inline-flex items-center justify-center text-[var(--color-neutral-500)] pointer-events-none" aria-hidden="true">
                  {trailingIcon}
                </span>
              )
            )}

            {isPasswordField && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-[var(--color-neutral-500)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] focus-visible:ring-2 focus-visible:ring-black/10 transition-colors duration-short4"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
              >
                <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {(error || supportingText || showCounter) && (
        <div className="flex items-start justify-between gap-2 ml-4">
          <div className="min-h-[16px]">
            {error && (
              <p id={errorId} className="text-body-small text-error" role="alert">
                {error}
              </p>
            )}

            {!error && supportingText && (
              <p id={supportingId} className="text-body-small text-[var(--color-text-muted)]">
                {supportingText}
              </p>
            )}
          </div>

          {showCounter && (
            <p id={counterId} className="text-body-small text-[var(--color-text-muted)] tabular-nums whitespace-nowrap" aria-live="polite">
              {currentValue.length}/{props.maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;

