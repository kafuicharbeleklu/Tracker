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
  trigger: React.ReactElement;
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
     §2.13 — un seul composant, une seule largeur : **262 px**. La valeur était une
     fourchette (`min-w-[112px] max-w-[280px]`), donc la largeur suivait le contenu :
     cinq écrans ouvraient le même menu à cinq largeurs, et son bord se déplaçait
     selon l'endroit d'où on l'ouvrait. Un seul appelant posait 262 en dur ; les
     quatre autres dérivaient. Corrigé le 20/08.
  */
  widthClassName = 'w-[262px] max-w-[calc(100vw-32px)]',
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
    () => items.map((item, index) => (!item.disabled ? index : -1)).filter((index) => index >= 0),
    [items]
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

  const openMenu = useCallback(() => {
    setOpen(true);
    setHighlightedIndex(firstEnabled);
  }, [firstEnabled]);

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
    [enabledIndexes, firstEnabled, highlightedIndex]
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
    [closeMenu, enabledIndexes, firstEnabled, highlightedIndex, items, moveHighlight]
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
          openMenu();
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
            openMenu();
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
            // Surface flottante : elle prend le cran de surface (R11), comme la carte et la feuille.
            'absolute z-50 py-1 rounded-lg border border-outline-variant bg-surface-container shadow-elevation-3',
            'animate-in fade-in zoom-in-95 duration-short4',
            placement === 'top' ? 'bottom-full mb-2' : 'mt-2',
            widthClassName,
            align === 'end'
              ? placement === 'top' ? 'right-0 origin-bottom-right' : 'right-0 origin-top-right'
              : placement === 'top' ? 'left-0 origin-bottom-left' : 'left-0 origin-top-left',
            className
          )}
        >
          {title && (
            <>
              <div className="px-4 py-2">
                <p className="text-label-small text-on-surface-variant uppercase tracking-widest">
                  {title}
                </p>
              </div>
              <Divider />
            </>
          )}

          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.dividerBefore && <Divider className="my-1 mx-2" variant="middle" />}
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
                  'group w-full px-3 flex items-center gap-3 text-left text-body-medium outline-none transition-[color,background-color,opacity] duration-short3 ease-emphasized state-layer',
                  item.description ? 'min-h-[52px] py-2' : 'h-12',
                  item.selected && 'bg-surface-container text-[var(--tk-color-nav-active)] font-medium',
                  'focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset',
                  item.destructive && !item.disabled ? 'text-error' : 'text-on-surface',
                  highlightedIndex === index && !item.disabled
                    ? 'bg-on-surface/[0.12]'
                    : 'hover:bg-on-surface/[0.08]',
                  item.disabled
                    ? 'opacity-[0.38] cursor-not-allowed text-on-surface-variant'
                    : 'cursor-pointer'
                )}
              >
                {item.icon && <MaterialIcon name={item.icon} size={20} />}
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                  {item.description && (
                    <span className="block text-[11px] leading-tight text-on-surface-variant truncate mt-0.5 font-normal">
                      {item.description}
                    </span>
                  )}
                </div>
                {item.trailingText && (
                  <span className={cn('text-label-small shrink-0', item.destructive && !item.disabled ? 'text-error/80' : 'text-on-surface-variant')}>
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

