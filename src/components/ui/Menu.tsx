import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from './MaterialIcon';
import Divider from './Divider';

export interface MenuItem {
    id: string;
    label: string;
    description?: string;
    onSelect: () => void;
    icon?: string;
    trailingText?: string;
    disabled?: boolean;
    destructive?: boolean;
    dividerBefore?: boolean;
    /**
     * La rangée en cours, quand le menu porte une **partition** et non des actes : elle
     * prend le creux `--inset` et l'encre de l'onglet actif, exactement comme la rangée
     * courante de la feuille « Plus » (17.7). Un menu qui change de vue doit dire dans
     * laquelle on est — sinon il faut l'ouvrir pour le savoir, puis le refermer.
     */
    selected?: boolean;
}

interface MenuProps {
    /**
     * Le déclencheur. Le menu lui **greffe** `id`, `aria-*`, `onClick` et `onKeyDown` :
     * son type doit donc dire qu'il accepte des attributs d'élément, sinon
     * `trigger.props` reste `unknown` et le clonage se fait à l'aveugle.
     */
    trigger: React.ReactElement<React.HTMLAttributes<HTMLElement> & { id?: string }>;
    items: MenuItem[];
    title?: string;
    align?: 'start' | 'end';
    placement?: 'bottom' | 'top';
    widthClassName?: string;
    className?: string;
}

/**
 * MD3 Menu (standard) with keyboard navigation and proper ARIA semantics.
 * - Container: surface-container + elevation level 3
 * - Item height: 48dp
 */
const Menu: React.FC<MenuProps> = ({
    trigger,
    items,
    title,
    align = 'end',
    placement = 'bottom',
    /*
     `menus.css` du projet design — la feuille partagée des menus : **`min-width:236px`**.
     Une largeur *fixe* de 262 avait été posée le 20/08 pour que le bord ne danse pas
     d'un écran à l'autre ; le plancher règle le même problème sans couper un libellé
     long ni étirer un menu de deux mots.
  */
    widthClassName = 'min-w-[236px] max-w-[calc(100vw-32px)]',
    className,
}) => {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const reactId = useId();

    const menuId = `menu-${reactId.replace(/:/g, '')}`;

    const enabledIndexes = useMemo(
        () =>
            items.map((item, index) => (!item.disabled ? index : -1)).filter((index) => index >= 0),
        [items],
    );

    const firstEnabled = enabledIndexes[0] ?? -1;
    const lastEnabled = enabledIndexes[enabledIndexes.length - 1] ?? -1;

    const closeMenu = useCallback((restoreFocus = true) => {
        setOpen(false);
        setHighlightedIndex(-1);
        if (restoreFocus) {
            requestAnimationFrame(() => {
                triggerRef.current?.focus();
            });
        }
    }, []);

    /**
     * **Ouvert au doigt, aucun acte n'est désigné.** Le menu allumait sa première entrée
     * quelle que soit la façon dont on l'ouvrait : au tap, cette rangée grisée se lit
     * comme un choix déjà fait — et c'est le premier acte de la liste, souvent le plus
     * engageant. Le clavier, lui, a besoin d'un point de départ : il le garde.
     */
    const openMenu = useCallback(
        (parLeClavier = false) => {
            setOpen(true);
            setHighlightedIndex(parLeClavier ? firstEnabled : -1);
        },
        [firstEnabled],
    );

    useEffect(() => {
        if (!open) return;

        const handleOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                closeMenu(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMenu();
        };

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, closeMenu]);

    useEffect(() => {
        if (!open || highlightedIndex < 0) return;
        requestAnimationFrame(() => {
            itemRefs.current[highlightedIndex]?.focus();
        });
    }, [open, highlightedIndex]);

    const moveHighlight = useCallback(
        (direction: 1 | -1) => {
            if (enabledIndexes.length === 0) return;
            if (highlightedIndex < 0) {
                setHighlightedIndex(firstEnabled);
                return;
            }

            const currentPos = enabledIndexes.indexOf(highlightedIndex);
            const nextPos =
                (currentPos + direction + enabledIndexes.length) % enabledIndexes.length;
            setHighlightedIndex(enabledIndexes[nextPos]);
        },
        [enabledIndexes, firstEnabled, highlightedIndex],
    );

    const onMenuKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    moveHighlight(1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    moveHighlight(-1);
                    break;
                case 'Home':
                    event.preventDefault();
                    setHighlightedIndex(firstEnabled);
                    break;
                case 'End':
                    event.preventDefault();
                    setHighlightedIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (highlightedIndex >= 0 && !items[highlightedIndex]?.disabled) {
                        items[highlightedIndex].onSelect();
                        closeMenu();
                    }
                    break;
                case 'Tab':
                    closeMenu(false);
                    break;
                default:
                    break;
            }
        },
        [closeMenu, enabledIndexes, firstEnabled, highlightedIndex, items, moveHighlight],
    );

    const triggerId = trigger.props.id ?? `${menuId}-trigger`;
    const triggerProps = {
        id: triggerId,
        'aria-haspopup': 'menu' as const,
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
            triggerRef.current = event.currentTarget;
            trigger.props.onClick?.(event);
            if (event.defaultPrevented) return;

            if (open) {
                closeMenu(false);
            } else {
                openMenu();
            }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            triggerRef.current = event.currentTarget;
            trigger.props.onKeyDown?.(event);
            if (event.defaultPrevented) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    openMenu(true);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setOpen(true);
                    setHighlightedIndex(lastEnabled);
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (open) {
                        closeMenu(false);
                    } else {
                        openMenu(true);
                    }
                    break;
                default:
                    break;
            }
        },
    };

    return (
        <div ref={rootRef} className="relative inline-flex">
            {React.cloneElement(trigger, triggerProps)}

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={triggerId}
                    onKeyDown={onMenuKeyDown}
                    className={cn(
                        /* `.menu` de `menus.css` — **la surface, pas le creux**, rayon 8,
                           une seule ombre (`0 8px 24px rgba(10,25,29,.2)`) et **aucun
                           filet** : la planche n'en déclare pas, et le filet doublait le
                           bord de l'ombre. Intérieur `8 0` : les rangées vont d'un bord à
                           l'autre, c'est leur propre padding qui les rentre. */
                        'bg-surface absolute z-50 overflow-hidden rounded-lg py-2 shadow-[0_8px_24px_rgba(10,25,29,0.2)]',
                        'animate-in fade-in zoom-in-95 duration-short4',
                        /* `.menu.tr{top:52px}` — **la liste s'ouvre sous la barre**,
                           pas dessus. Sans `top-full`, une boîte absolue sans `top`
                           prend sa position statique : dans un conteneur `flex` aligné
                           au centre, c'est le haut du conteneur — et le menu recouvrait
                           le titre et le retour de la barre de 56 qu'il surmonte. */
                        placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-1',
                        widthClassName,
                        align === 'end'
                            ? placement === 'top'
                                ? 'right-0 origin-bottom-right'
                                : 'right-0 origin-top-right'
                            : placement === 'top'
                              ? 'left-0 origin-bottom-left'
                              : 'left-0 origin-top-left',
                        className,
                    )}
                >
                    {title && (
                        <>
                            {/* `.menu .cap` — 12 sur 16, encre tertiaire, intérieur
                                `6 16 8`. Ni capitales ni interlettrage : c'est une
                                légende, pas une étiquette de section. */}
                            <p className="text-text-muted px-4 pt-1.5 pb-2 text-[12px] leading-4">
                                {title}
                            </p>
                        </>
                    )}

                    {items.map((item, index) => (
                        <React.Fragment key={item.id}>
                            {/* `.menu .sep{height:1px;margin:8px 0}` — **pleine largeur** :
                                il sépare deux groupes d'actes, il n'encadre pas une liste. */}
                            {item.dividerBefore && <Divider className="my-2" />}
                            <button
                                ref={(element) => {
                                    itemRefs.current[index] = element;
                                }}
                                role="menuitem"
                                type="button"
                                disabled={item.disabled}
                                aria-disabled={item.disabled || undefined}
                                tabIndex={!item.disabled && highlightedIndex === index ? 0 : -1}
                                onMouseEnter={() => {
                                    if (!item.disabled) setHighlightedIndex(index);
                                }}
                                onClick={() => {
                                    if (item.disabled) return;
                                    item.onSelect();
                                    closeMenu();
                                }}
                                className={cn(
                                    /* `.menu .mi` — **16 sur 24**, intérieur `8 16`,
                                       gouttière 12, 48 de haut. Elle tenait
                                       `text-body-medium`, c'est-à-dire **13 sur 19** :
                                       trois marches sous ce que la feuille partagée
                                       déclare, dans le seul endroit du produit où l'on
                                       choisit un acte à l'aveugle du bout du pouce. */
                                    'group duration-short3 ease-emphasized state-layer flex w-full items-center gap-3 px-4 py-2 text-left text-[16px] leading-6 transition-[color,background-color,opacity] outline-none',
                                    item.description ? 'min-h-[56px]' : 'min-h-12',
                                    item.selected &&
                                        'bg-surface-container font-medium text-[var(--tk-color-nav-active)]',
                                    'focus-visible:ring-focus-ring focus-visible:ring-2 focus-visible:ring-inset',
                                    /* `.menu .mi.dg` de la feuille partagée — le
                                       rouge **posé sur teinte**, plus sombre que le rouge
                                       d'alerte : un acte destructeur dans une liste se
                                       lit, il ne clignote pas. */
                                    item.destructive && !item.disabled
                                        ? 'text-on-tint-danger'
                                        : 'text-on-surface',
                                    highlightedIndex === index && !item.disabled
                                        ? 'bg-on-surface/[0.12]'
                                        : 'hover:bg-on-surface/[0.08]',
                                    item.disabled
                                        ? 'text-on-surface-variant cursor-not-allowed opacity-[0.38]'
                                        : 'cursor-pointer',
                                )}
                            >
                                {item.icon && (
                                    /* `.menu .mi .ic` prend l'encre secondaire — le glyphe ne
                                       prend la couleur du libellé que sur un acte
                                       destructeur (`.dg .ic{color:inherit}`). */
                                    <MaterialIcon
                                        name={item.icon}
                                        size={20}
                                        className={cn(
                                            item.destructive && !item.disabled
                                                ? undefined
                                                : 'text-on-surface-variant',
                                        )}
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <span className="block truncate">{item.label}</span>
                                    {item.description && (
                                        <span className="text-text-muted mt-0.5 block truncate text-[12px] leading-4 font-normal">
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                                {item.trailingText && (
                                    <span
                                        className={cn(
                                            'text-label-small shrink-0',
                                            item.destructive && !item.disabled
                                                ? 'text-error/80'
                                                : 'text-on-surface-variant',
                                        )}
                                    >
                                        {item.trailingText}
                                    </span>
                                )}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Menu;
