import React, {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useId,
    useMemo,
} from 'react';
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
    /**
     * Un champ de recherche en tête de liste : pour une liste longue (les personnes), où
     * faire défiler soixante noms ne se fait pas.
     */
    avecRecherche?: boolean;
}

/** Sans casse ni accent : « adebayor » trouve « Adébayor ». */
const aPlat = (texte: string) =>
    texte
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const HAUTEUR_DE_LISTE = 240;
const HAUTEUR_DE_RECHERCHE = 52;

/**
 * MD3 Exposed Dropdown Menu (Select).
 * Filled/Outlined styles with MD3 tokens.
 * Full keyboard navigation: ArrowUp/ArrowDown to navigate, Enter/Space to select, Escape to close.
 *
 * **Dans un calque** (10/10, relevé sur la fiche de comptage) : Échap refermait la liste *et*
 * la fenêtre qui la portait, en emportant la saisie ; et la liste du dernier champ, ouverte
 * vers le bas, passait sous le pied de la fenêtre. Échap ne ferme plus que la liste, et elle
 * s'ouvre vers le haut quand la place manque dessous, à la hauteur qui tient.
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
    avecRecherche = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [hasTriggerFocus, setHasTriggerFocus] = useState(false);
    const [filtre, setFiltre] = useState('');
    const [placement, setPlacement] = useState({ versLeHaut: false, max: HAUTEUR_DE_LISTE });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const rechercheRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const generatedId = useId();
    const triggerId = `${name}-${generatedId}-trigger`;
    const listboxId = `${name}-${generatedId}-listbox`;
    const labelId = label ? `${name}-${generatedId}-label` : undefined;
    const errorId = error ? `${name}-${generatedId}-error` : undefined;
    const supportingId = supportingText ? `${name}-${generatedId}-supporting` : undefined;
    const activeDescendantId =
        highlightedIndex >= 0 ? `${name}-${generatedId}-option-${highlightedIndex}` : undefined;
    const describedByValues = [
        error ? errorId : undefined,
        !error && supportingText ? supportingId : undefined,
    ].filter(Boolean) as string[];
    const resolvedAriaDescribedBy =
        describedByValues.length > 0 ? describedByValues.join(' ') : undefined;
    const isFocused = isOpen || hasTriggerFocus;
    const resolvedAriaLabel = label ? undefined : placeholder;

    const montrees = useMemo(() => {
        const cherche = aPlat(filtre.trim());
        return cherche ? options.filter((opt) => aPlat(opt.label).includes(cherche)) : options;
    }, [filtre, options]);

    useEffect(() => {
        if (isOpen) {
            const currentIndex = montrees.findIndex((opt) => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [isOpen, montrees, value]);

    /* **Où la liste tient.** Vers le bas d'abord ; vers le haut si la place manque dessous
       et qu'il y en a davantage dessus. La place se compte jusqu'au premier ancêtre qui
       rogne (le corps d'une fenêtre, une feuille), pas seulement jusqu'au bord de l'écran. */
    useLayoutEffect(() => {
        const declencheur = triggerRef.current;
        if (!isOpen || !declencheur) return;
        const cadre = declencheur.getBoundingClientRect();
        let haut = 0;
        let bas = window.innerHeight;
        for (
            let parent = declencheur.parentElement;
            parent && parent !== document.body;
            parent = parent.parentElement
        ) {
            if (/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflowY)) {
                const bord = parent.getBoundingClientRect();
                haut = Math.max(haut, bord.top);
                bas = Math.min(bas, bord.bottom);
            }
        }
        const MARGE = 12;
        const habillage = (avecRecherche ? HAUTEUR_DE_RECHERCHE : 0) + 18;
        const voulu = Math.min(HAUTEUR_DE_LISTE, Math.max(1, options.length) * 40) + habillage;
        const dessous = bas - cadre.bottom - MARGE;
        const dessus = cadre.top - haut - MARGE;
        const versLeHaut = dessous < voulu && dessus > dessous;
        const place = (versLeHaut ? dessus : dessous) - habillage;
        setPlacement({
            versLeHaut,
            max: Math.max(120, Math.min(HAUTEUR_DE_LISTE, Math.floor(place))),
        });
    }, [avecRecherche, isOpen, options.length]);

    /* À la souris et au clavier, la recherche prend le focus : on tape aussitôt. Au doigt,
       non : le clavier de l'écran mangerait la moitié de la liste avant qu'on ait choisi
       de chercher. */
    useEffect(() => {
        if (!isOpen || !avecRecherche) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;
        rechercheRef.current?.focus();
    }, [avecRecherche, isOpen]);

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
            setFiltre('');
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

    const handleSelect = useCallback(
        (optionValue: string) => {
            onChange({ target: { name, value: optionValue } });
            handleClose();
            /* Le focus revient au champ : il était dans la recherche, qui va disparaître. */
            triggerRef.current?.focus();
        },
        [onChange, name, handleClose],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (disabled) return;
            /* Dans la recherche, les lettres et l'espace s'écrivent ; seules les touches de
               parcours agissent sur la liste. */
            const dansLaRecherche = e.target === rechercheRef.current;
            if (dansLaRecherche && (e.key === ' ' || e.key === 'Home' || e.key === 'End')) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    } else {
                        setHighlightedIndex((prev) => (prev < montrees.length - 1 ? prev + 1 : 0));
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    } else {
                        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : montrees.length - 1));
                    }
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (isOpen && highlightedIndex >= 0 && highlightedIndex < montrees.length) {
                        handleSelect(montrees[highlightedIndex].value);
                    } else if (!isOpen) {
                        setIsOpen(true);
                        setClosing(false);
                    }
                    break;

                case 'Escape':
                    /* Liste ouverte, Échap la referme **et s'arrête là** : la fenêtre ou la
                       feuille qui porte le champ écoute la même touche, et se fermait avec
                       elle. Liste fermée, la touche lui revient. */
                    if (isOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClose();
                        triggerRef.current?.focus();
                    }
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
                        setHighlightedIndex(montrees.length - 1);
                    }
                    break;

                default:
                    if (dansLaRecherche) break;
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        const query = e.key.toLowerCase();
                        const startIndex = highlightedIndex >= 0 ? highlightedIndex + 1 : 0;
                        const rotated = [
                            ...montrees.slice(startIndex),
                            ...montrees.slice(0, startIndex),
                        ];
                        const foundOffset = rotated.findIndex((opt) =>
                            opt.label.toLowerCase().startsWith(query),
                        );
                        if (foundOffset >= 0) {
                            const nextIndex = (startIndex + foundOffset) % montrees.length;
                            if (!isOpen) {
                                setIsOpen(true);
                                setClosing(false);
                            }
                            setHighlightedIndex(nextIndex);
                        }
                    }
                    break;
            }
        },
        [disabled, isOpen, highlightedIndex, montrees, handleSelect, handleClose],
    );

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
                        /* `.lab` — même mesure que sur `InputField` : 12 sur 16 en 500. */
                        'duration-short4 mb-2 block text-[0.75rem] leading-4 font-medium transition-colors',
                        error
                            ? 'text-error'
                            : isFocused
                              ? 'text-on-surface'
                              : 'text-on-surface-variant',
                        disabled && 'text-on-surface/[0.38]',
                    )}
                >
                    {label}
                    {required && <span className="text-error ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    ref={triggerRef}
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
                        /* `.val` de la passe sobre — le même creux que `.field`, et la
                       même marche : 16 sur 24, hauteur 48, intérieur 14, rayon 4. */
                        'text-ts-body leading-ts-body relative min-h-12 w-full py-3 pr-12 pl-3.5 text-left',
                        'duration-short4 ease-emphasized transition-[color,background-color,border-color,box-shadow] outline-none',
                        'disabled:text-on-surface/[0.38] disabled:cursor-not-allowed',
                        variant === 'outlined'
                            ? cn(
                                  'bg-surface rounded-md border',
                                  error
                                      ? 'border-error hover:border-error'
                                      : 'border-outline hover:border-outline',
                                  isFocused &&
                                      (error
                                          ? 'border-error ring-error ring-2'
                                          : 'border-focus-ring ring-focus-ring ring-2'),
                                  'disabled:border-on-surface/[0.12] disabled:bg-surface',
                              )
                            : cn(
                                  'bg-surface-container rounded-md border-0',
                                  error && 'ring-error ring-2',
                                  isFocused &&
                                      (error ? 'ring-error ring-2' : 'ring-focus-ring ring-2'),
                                  'disabled:bg-on-surface/[0.04]',
                              ),
                        disabled ? 'pointer-events-none' : 'cursor-pointer',
                        !value && 'text-text-tertiary',
                    )}
                >
                    <span
                        className={cn(
                            'block truncate',
                            !selectedOption && 'text-on-surface-variant',
                        )}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <MaterialIcon
                            name="arrow_drop_down"
                            size={24}
                            className={cn(
                                'text-on-surface-variant duration-short4 ease-emphasized transition-transform',
                                isOpen && 'rotate-180',
                            )}
                        />
                    </span>
                </button>

                {(isOpen || closing) && !disabled && (
                    <div
                        className={cn(
                            'bg-surface border-outline shadow-elevation-2 absolute z-50 w-full overflow-hidden rounded-md border py-1',
                            placement.versLeHaut
                                ? 'bottom-full mb-1 origin-bottom'
                                : 'top-full mt-1 origin-top',
                            closing ? 'mvt-menu-sortie' : 'mvt-menu-entree',
                        )}
                        role="listbox"
                        id={listboxId}
                        onAnimationEnd={handleAnimationEnd}
                    >
                        {avecRecherche && (
                            <div className="border-outline-variant border-b px-2 pt-1 pb-2">
                                <input
                                    ref={rechercheRef}
                                    type="text"
                                    value={filtre}
                                    onChange={(event) => {
                                        setFiltre(event.target.value);
                                        setHighlightedIndex(0);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Chercher"
                                    aria-label={`Chercher dans ${label ?? placeholder}`}
                                    autoComplete="off"
                                    className="bg-surface-container text-ts-body leading-ts-body text-on-surface placeholder:text-text-tertiary focus-visible:ring-focus-ring h-10 w-full rounded-md px-3 outline-none focus-visible:ring-2"
                                />
                            </div>
                        )}
                        <div
                            className="custom-scrollbar overflow-y-auto py-1"
                            style={{ maxHeight: placement.max }}
                            ref={listRef}
                        >
                            {montrees.length > 0 ? (
                                montrees.map((opt, index) => (
                                    <div
                                        key={opt.value}
                                        ref={(el) => {
                                            optionRefs.current[index] = el;
                                        }}
                                        id={`${name}-${generatedId}-option-${index}`}
                                        onClick={() => handleSelect(opt.value)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        role="option"
                                        aria-selected={value === opt.value}
                                        className={cn(
                                            'text-body-medium duration-short3 flex min-h-10 cursor-pointer items-center justify-between px-3 py-2 transition-colors',
                                            value === opt.value
                                                ? 'bg-primary text-on-primary'
                                                : highlightedIndex === index
                                                  ? 'bg-surface-container text-on-surface'
                                                  : 'text-on-surface hover:bg-surface-container',
                                        )}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {value === opt.value && (
                                            <MaterialIcon
                                                name="check"
                                                size={18}
                                                className="text-on-primary"
                                            />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-body-small text-on-surface-variant px-4 py-3 text-center italic">
                                    {filtre ? 'Aucun résultat' : 'Aucune option'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

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
