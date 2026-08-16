import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface SelectFieldProps {
  label?: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  supportingText?: string;
  variant?: 'outlined' | 'filled';
  required?: boolean;
  disabled?: boolean;
}

/**
 * MD3 Exposed Dropdown Menu (Select).
 * Filled/Outlined styles with MD3 tokens.
 * Full keyboard navigation: ArrowUp/ArrowDown to navigate, Enter/Space to select, Escape to close.
 */
const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = 'Sélectionnez...',
  className,
  error,
  supportingText,
  variant = 'filled',
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasTriggerFocus, setHasTriggerFocus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const generatedId = useId();
  const triggerId = `${name}-${generatedId}-trigger`;
  const listboxId = `${name}-${generatedId}-listbox`;
  const labelId = label ? `${name}-${generatedId}-label` : undefined;
  const errorId = error ? `${name}-${generatedId}-error` : undefined;
  const supportingId = supportingText ? `${name}-${generatedId}-supporting` : undefined;
  const activeDescendantId = highlightedIndex >= 0 ? `${name}-${generatedId}-option-${highlightedIndex}` : undefined;
  const describedByValues = [error ? errorId : undefined, !error && supportingText ? supportingId : undefined].filter(Boolean) as string[];
  const resolvedAriaDescribedBy = describedByValues.length > 0 ? describedByValues.join(' ') : undefined;
  const isFocused = isOpen || hasTriggerFocus;
  const resolvedAriaLabel = label ? undefined : placeholder;

  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, options, value]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleClose = useCallback(() => {
    if (!isOpen || closing) return;
    setClosing(true);
  }, [isOpen, closing]);

  const handleAnimationEnd = useCallback(() => {
    if (closing) {
      setIsOpen(false);
      setClosing(false);
      setHighlightedIndex(-1);
    }
  }, [closing]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setClosing(false);
    }
  }, [disabled, isOpen, handleClose]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = useCallback((optionValue: string) => {
    onChange({ target: { name, value: optionValue } });
    handleClose();
  }, [onChange, name, handleClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setClosing(false);
        } else {
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setClosing(false);
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
          setClosing(false);
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (isOpen) handleClose();
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;

      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const query = e.key.toLowerCase();
          const startIndex = highlightedIndex >= 0 ? highlightedIndex + 1 : 0;
          const rotated = [...options.slice(startIndex), ...options.slice(0, startIndex)];
          const foundOffset = rotated.findIndex((opt) => opt.label.toLowerCase().startsWith(query));
          if (foundOffset >= 0) {
            const nextIndex = (startIndex + foundOffset) % options.length;
            if (!isOpen) {
              setIsOpen(true);
              setClosing(false);
            }
            setHighlightedIndex(nextIndex);
          }
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, options, handleSelect, handleClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  return (
    <div className={cn('relative space-y-1', className)} ref={dropdownRef}>
      {label && (
        <label
          id={labelId}
          className={cn(
            "block text-[11px] font-medium tracking-[0.02em] mb-1.5 transition-colors duration-short4",
            error ? "text-error" : isFocused ? "text-on-surface" : "text-on-surface-variant",
            disabled && "text-on-surface/[0.38]"
          )}
        >
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <button
        id={triggerId}
        type="button"
        role="combobox"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        onFocus={() => setHasTriggerFocus(true)}
        onBlur={() => setHasTriggerFocus(false)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen ? activeDescendantId : undefined}
        aria-labelledby={labelId}
        aria-label={resolvedAriaLabel}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={resolvedAriaDescribedBy}
        className={cn(
          'w-full min-h-12 px-4 py-3 pr-12 text-left relative text-title-small font-medium',
          'transition-[color,background-color,border-color,box-shadow] duration-short4 ease-emphasized outline-none',
          'disabled:cursor-not-allowed disabled:text-on-surface/[0.38]',
          variant === 'outlined'
            ? cn(
              'bg-surface border rounded-md',
              error
                ? 'border-error hover:border-error'
                : 'border-outline hover:border-outline',
              isFocused && (error ? 'border-error ring-2 ring-error' : 'border-focus-ring ring-2 ring-focus-ring'),
              'disabled:border-on-surface/[0.12] disabled:bg-surface'
            )
            : cn(
              'bg-surface border rounded-md',
              error
                ? 'border-error hover:border-error'
                : 'border-outline hover:border-outline',
              isFocused && (error ? 'border-error ring-2 ring-error' : 'border-focus-ring ring-2 ring-focus-ring'),
              'disabled:bg-on-surface/[0.04] disabled:border-on-surface/[0.12]'
            ),
          disabled ? 'pointer-events-none' : 'cursor-pointer',
          !value && 'text-on-surface-variant',
        )}
      >
        <span className={cn('block truncate', !selectedOption && 'text-on-surface-variant')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <MaterialIcon
            name="arrow_drop_down"
            size={24}
            className={cn('text-on-surface-variant transition-transform duration-short4 ease-emphasized', isOpen && 'rotate-180')}
          />
        </span>
      </button>

      {(isOpen || closing) && !disabled && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 bg-surface rounded-md border border-outline shadow-elevation-2 py-1 origin-top overflow-hidden',
            closing ? 'animate-out fade-out zoom-out-95 duration-150' : 'animate-in fade-in zoom-in-95 duration-200',
          )}
          role="listbox"
          id={listboxId}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1" ref={listRef}>
            {options.length > 0 ? (
              options.map((opt, index) => (
                <div
                  key={opt.value}
                  ref={(el) => { optionRefs.current[index] = el; }}
                  id={`${name}-${generatedId}-option-${index}`}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={value === opt.value}
                  className={cn(
                    'cursor-pointer min-h-10 px-3 py-2 text-body-medium transition-colors duration-short3 flex items-center justify-between',
                    value === opt.value
                      ? 'bg-primary text-on-primary'
                      : highlightedIndex === index
                        ? 'bg-surface-container text-on-surface'
                        : 'text-on-surface hover:bg-surface-container',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <MaterialIcon name="check" size={18} className="text-on-primary" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-body-small text-on-surface-variant text-center italic">Aucune option</div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={errorId} className="text-body-small text-error ml-4" role="alert">
          {error}
        </p>
      )}

      {!error && supportingText && (
        <p id={supportingId} className="text-body-small text-on-surface-variant ml-4">
          {supportingText}
        </p>
      )}
    </div>
  );
};

export default SelectField;
