import React, { useId, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  supportingText?: string;
  variant?: 'outlined' | 'filled';
  showCharacterCount?: boolean;
}

/**
 * MD3 TextArea - supports outlined and filled variants.
 * Keeps API parity with InputField for supporting text/error/counter behavior.
 */
export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  supportingText,
  variant = 'filled',
  showCharacterCount = false,
  className,
  rows = 4,
  id: providedId,
  'aria-describedby': ariaDescribedByProp,
  'aria-invalid': ariaInvalidProp,
  'aria-required': ariaRequiredProp,
  ...props
}) => {
  const generatedId = useId();
  const textAreaId = providedId || generatedId;
  const isDisabled = Boolean(props.disabled);

  const errorId = error ? `${textAreaId}-error-text` : undefined;
  const supportingTextId = supportingText ? `${textAreaId}-supporting-text` : undefined;
  const counterId = showCharacterCount && typeof props.maxLength === 'number' ? `${textAreaId}-counter` : undefined;
  const currentValue = useMemo(() => {
    if (props.value === null || props.value === undefined) {
      if (props.defaultValue === null || props.defaultValue === undefined) {
        return '';
      }
      return String(props.defaultValue);
    }
    return String(props.value);
  }, [props.defaultValue, props.value]);

  const describedByValues = [
    ariaDescribedByProp as string | undefined,
    error ? errorId : undefined,
    !error && supportingText ? supportingTextId : undefined,
    counterId,
  ].filter(Boolean) as string[];

  const resolvedAriaDescribedBy = describedByValues.length > 0 ? describedByValues.join(' ') : undefined;
  const resolvedAriaInvalid = ariaInvalidProp ?? (error ? true : undefined);
  const resolvedAriaRequired = ariaRequiredProp ?? (props.required ? true : undefined);
  const resolvedAriaLabel =
    (props['aria-label'] as string | undefined) ??
    (!label ? props.placeholder : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textAreaId}
          className={cn(
            'block text-body-small ml-1 transition-colors duration-short4',
            error ? 'text-error' : 'text-on-surface-variant',
            isDisabled && 'text-on-surface/[0.38]'
          )}
        >
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textAreaId}
        rows={rows}
        aria-label={resolvedAriaLabel}
        aria-invalid={resolvedAriaInvalid}
        aria-required={resolvedAriaRequired}
        aria-describedby={resolvedAriaDescribedBy}
        className={cn(
          'w-full min-h-24 px-3 py-2',
          'focus:outline-none',
          'transition-[color,background-color,border-color,box-shadow] duration-short4 ease-emphasized resize-none',
          'text-on-surface text-body-medium',
          'placeholder:text-on-surface-variant',
          'disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:placeholder:text-on-surface/[0.38]',
          variant === 'filled'
            ? cn(
              'bg-surface border rounded-lg',
              error
                ? 'border-error hover:border-error focus:border-error focus:ring-2 focus:ring-error/20'
                : 'border-outline-variant hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:bg-on-surface/[0.04] disabled:border-on-surface/[0.12]'
            )
            : cn(
              'bg-surface border rounded-lg',
              error
                ? 'border-error hover:border-error focus:border-error focus:ring-2 focus:ring-error/20'
                : 'border-outline-variant hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:border-on-surface/[0.12] disabled:bg-surface'
            ),
          className
        )}
        {...props}
      />

      {(error || supportingText || counterId) && (
        <div className="flex items-start justify-between gap-2 ml-4">
          <div className="min-h-[16px]">
            {error && (
              <p id={errorId} className="text-body-small text-error animate-in slide-in-from-top-1 duration-200" role="alert">
                {error}
              </p>
            )}

            {!error && supportingText && (
              <p id={supportingTextId} className="text-body-small text-on-surface-variant">
                {supportingText}
              </p>
            )}
          </div>

          {counterId && (
            <p id={counterId} className="text-body-small text-on-surface-variant tabular-nums whitespace-nowrap" aria-live="polite">
              {currentValue.length}/{props.maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
