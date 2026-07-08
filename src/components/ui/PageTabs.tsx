
import React, { useRef, useCallback, useEffect, useId, useState } from 'react';
import { cn } from '../../lib/utils';
import Badge from './Badge';
import MaterialIcon from './MaterialIcon';

export interface TabItem {
  id: string;
  label: string;
  /** Libellé court affiché en compact (<600px) à la place de `label` (X8-bis).
      Pattern issu des onglets finance (« Synthèse Globale » → « Synthèse »). */
  shortLabel?: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

const sanitizeIdPart = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-');
export const getTabElementId = (idBase: string, itemId: string): string => `${idBase}-tab-${sanitizeIdPart(itemId)}`;
export const getTabPanelId = (idBase: string, itemId: string): string => `${idBase}-panel-${sanitizeIdPart(itemId)}`;

interface PageTabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  idBase?: string;
  ariaLabel?: string;
}

/**
 * MD3 Tabs — Primary tabs with active indicator.
 * Uses title-small type, primary active indicator.
 * Full ARIA tablist/tab pattern with ←/→/Home/End keyboard navigation.
 */
export const PageTabs: React.FC<PageTabsProps> = ({
  items,
  activeId,
  onChange,
  className,
  idBase,
  ariaLabel = 'Navigation par onglets',
}) => {
  const generatedBaseId = useId().replace(/:/g, '');
  const baseId = idBase ? sanitizeIdPart(idBase) : generatedBaseId;
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));

  const updateOverflow = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const left = scroller.scrollLeft > 1;
    const right = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
    setOverflow((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    updateOverflow();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [items, updateOverflow]);

  const scrollTabs = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.6, behavior: 'smooth' });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (items.length === 0) {
      return;
    }

    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = index < items.length - 1 ? index + 1 : 0;
        break;

      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = index > 0 ? index - 1 : items.length - 1;
        break;

      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onChange(items[index].id);
        return;

      default:
        return;
    }

    tabsRef.current[nextIndex]?.focus();
    onChange(items[nextIndex].id);
  }, [items, onChange]);

  return (
    <div className={cn("w-full bg-surface border border-outline-variant rounded-xl p-1 shadow-elevation-1", className)}>
      <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateOverflow}
        className="flex items-center gap-1 overflow-x-auto no-scrollbar"
        role="tablist"
        aria-orientation="horizontal"
        aria-label={ariaLabel}
      >
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          const tabId = getTabElementId(baseId, item.id);
          const panelId = getTabPanelId(baseId, item.id);

          return (
            <button
              key={item.id}
              ref={el => { tabsRef.current[index] = el; }}
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group relative flex items-center gap-2 min-h-10 px-3 py-2 rounded-lg text-label-large transition-all duration-short4 ease-emphasized outline-none select-none whitespace-nowrap",
                "focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              )}
            >
              {/* Icon */}
              {item.icon && (
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-on-primary" : "text-on-surface-variant group-hover:text-on-surface"
                )}>
                  {React.isValidElement(item.icon)
                    ? React.cloneElement(item.icon as React.ReactElement<Record<string, unknown>>, { size: 18 })
                    : item.icon}
                </span>
              )}

              {/* Label — libellé court adaptatif en compact (X8-bis) */}
              {item.shortLabel ? (
                <>
                  <span className="medium:hidden">{item.shortLabel}</span>
                  <span className="hidden medium:inline">{item.label}</span>
                </>
              ) : (
                <span>{item.label}</span>
              )}

              {/* Badge */}
              {item.badge !== undefined && (
                <Badge
                  variant={isActive ? 'warning' : 'neutral'}
                  className={cn("ml-1 px-1.5 py-0 h-4 min-w-[16px]", isActive ? "bg-on-primary text-primary" : "")}
                >
                  {item.badge}
                </Badge>
              )}

              {/* Active indicator — 3px bar */}
            </button>
          );
        })}
      </div>

      {/* Affordance d'overflow : fondu + chevron quand des onglets sont hors écran (nav clavier via ←/→) */}
      {overflow.left && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-start rounded-l-lg bg-gradient-to-r from-surface via-surface/80 to-transparent"
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={() => scrollTabs(-1)}
            className="pointer-events-auto ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-elevation-1 transition-colors duration-short4 hover:text-on-surface"
          >
            <MaterialIcon name="chevron_left" size={18} />
          </button>
        </div>
      )}
      {overflow.right && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-end rounded-r-lg bg-gradient-to-l from-surface via-surface/80 to-transparent"
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={() => scrollTabs(1)}
            className="pointer-events-auto mr-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-elevation-1 transition-colors duration-short4 hover:text-on-surface"
          >
            <MaterialIcon name="chevron_right" size={18} />
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
