import React, { useRef, useCallback, useEffect, useId, useState } from 'react';
import { cn } from '../../lib/utils';
import Badge from './Badge';
import MaterialIcon from './MaterialIcon';
import BottomSheet from './BottomSheet';

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
export const getTabElementId = (idBase: string, itemId: string): string =>
    `${idBase}-tab-${sanitizeIdPart(itemId)}`;
export const getTabPanelId = (idBase: string, itemId: string): string =>
    `${idBase}-panel-${sanitizeIdPart(itemId)}`;

interface PageTabsProps {
    items: TabItem[];
    activeId: string;
    onChange: (id: string) => void;
    className?: string;
    idBase?: string;
    ariaLabel?: string;
    /** Breakpoint à partir duquel `label` remplace `shortLabel` (X8-bis).
      'medium' (défaut) : libellés courts <600px ; 'expanded' : aussi entre 600 et 839px —
      pour les barres où les onglets naissent hors écran même en medium (§9.3 Paramètres). */
    shortLabelBreakpoint?: 'medium' | 'expanded';
    /** Bouton « toutes les vues » en bout de barre → feuille de bas listant les onglets
      (décision F6 au registre X8). Rendu uniquement quand des onglets débordent ;
      false pour le désactiver. */
    allViewsButton?: boolean;
    /** Habillage de la barre.
      - `brand` (défaut) : barre sur surface, onglet actif rempli jaune — rendu
        historique, conservé sur tous les écrans non basculés.
      - `neutral` : segmented control de l'ADN mobile (fond `surface-muted` de l'ADN,
        segment actif BLANC, segments à largeur égale). DESIGN_BRIEF.md §4 :
        « PLUS JAMAIS de pilule jaune » — et §1, le jaune n'est pas un fond d'onglet
        (interdit §8.1). À utiliser sur les écrans passés à l'ADN. */
    appearance?: 'brand' | 'neutral';
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
    shortLabelBreakpoint = 'medium',
    allViewsButton = true,
    appearance = 'brand',
}) => {
    const isNeutral = appearance === 'neutral';
    const generatedBaseId = useId().replace(/:/g, '');
    const baseId = idBase ? sanitizeIdPart(idBase) : generatedBaseId;
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });
    const [allViewsOpen, setAllViewsOpen] = useState(false);
    const activeIndex = Math.max(
        0,
        items.findIndex((item) => item.id === activeId),
    );
    const showAllViewsButton = allViewsButton && (overflow.left || overflow.right);

    const updateOverflow = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const left = scroller.scrollLeft > 1;
        const right = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
        setOverflow((prev) =>
            prev.left === left && prev.right === right ? prev : { left, right },
        );
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

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, index: number) => {
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
        },
        [items, onChange],
    );

    return (
        <div
            className={cn(
                'bg-surface border-outline-variant shadow-elevation-1 flex w-full items-center gap-1 rounded-xl border p-1',
                // Segmented neutre : plus de bordure ni d'ombre. Rayon de CARTE sur le
                // conteneur, rayon de CONTRÔLE sur le segment actif — l'écart vaut le padding
                // de 4 px, donc l'imbrication reste régulière quelle que soit l'échelle.
                isNeutral && 'bg-adn-surface-muted rounded-adn-card border-0 shadow-none',
                className,
            )}
        >
            <div className="relative min-w-0 flex-1">
                <div
                    ref={scrollerRef}
                    onScroll={updateOverflow}
                    className="no-scrollbar flex items-center gap-1 overflow-x-auto"
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
                                ref={(el) => {
                                    tabsRef.current[index] = el;
                                }}
                                role="tab"
                                id={tabId}
                                aria-selected={isActive}
                                aria-controls={panelId}
                                tabIndex={index === activeIndex ? 0 : -1}
                                onClick={() => onChange(item.id)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className={cn(
                                    // `touch-target` : hit-box tactile ≥48px (index.css). L'onglet vit dans un
                                    // scroller overflow-x-auto qui borne l'extension VERTICALE à la hauteur de la
                                    // bande (40px) ; l'extension HORIZONTALE — l'axe des ratés sur une barre
                                    // d'onglets scrollable — est bien portée à 48px.
                                    'touch-target group text-label-large duration-short4 ease-emphasized relative flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 whitespace-nowrap transition-all outline-none select-none',
                                    'focus-visible:ring-focus-ring focus-visible:ring-2',
                                    isActive
                                        ? 'bg-primary text-on-primary shadow-sm'
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                                    // Segmented neutre : segments à largeur égale, actif BLANC sur le fond
                                    // neutre — le jaune reste réservé à l'action primaire et à la nav (§1).
                                    // `-plain` : le cran `label-large` porte 600 ; l'ADN veut la graisse forte
                                    // unique de l'écran (§4). Un `font-medium` serait perdu — le typescale vit
                                    // dans index.css, donc APRÈS les utilitaires Tailwind dans la cascade.
                                    isNeutral &&
                                        'rounded-adn-control text-label-large-plain flex-1 justify-center',
                                    isNeutral &&
                                        (isActive
                                            ? 'bg-surface text-adn-text shadow-none'
                                            : 'text-adn-text-secondary hover:text-adn-text bg-transparent hover:bg-transparent'),
                                )}
                            >
                                {/* Icon — masquée en compact quand la place manque (X8-bis, §9.6) */}
                                {item.icon && (
                                    <span
                                        className={cn(
                                            'medium:inline-flex hidden transition-colors',
                                            isActive
                                                ? 'text-on-primary'
                                                : 'text-on-surface-variant group-hover:text-on-surface',
                                        )}
                                    >
                                        {React.isValidElement(item.icon)
                                            ? React.cloneElement(
                                                  item.icon as React.ReactElement<
                                                      Record<string, unknown>
                                                  >,
                                                  { size: 18 },
                                              )
                                            : item.icon}
                                    </span>
                                )}

                                {/* Label — libellé court adaptatif en compact (X8-bis) */}
                                {item.shortLabel ? (
                                    shortLabelBreakpoint === 'expanded' ? (
                                        <>
                                            <span className="expanded:hidden">
                                                {item.shortLabel}
                                            </span>
                                            <span className="expanded:inline hidden">
                                                {item.label}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="medium:hidden">{item.shortLabel}</span>
                                            <span className="medium:inline hidden">
                                                {item.label}
                                            </span>
                                        </>
                                    )
                                ) : (
                                    <span>{item.label}</span>
                                )}

                                {/* Badge */}
                                {item.badge !== undefined && (
                                    <Badge
                                        variant="neutral"
                                        className={cn(
                                            'ml-1 h-4 min-w-[16px] px-1.5 py-0',
                                            // Onglet actif (rempli jaune) : pastille inverse noir/jaune — le ! est requis,
                                            // cn ne fait pas de tailwind-merge et l'override perdait la cascade.
                                            isActive ? 'bg-on-primary text-primary' : '',
                                        )}
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
                        className={cn(
                            'pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-start rounded-l-lg bg-gradient-to-r to-transparent',
                            isNeutral
                                ? 'from-adn-surface-muted via-adn-surface-muted/80'
                                : 'from-surface via-surface/80',
                        )}
                    >
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => scrollTabs(-1)}
                            className="bg-surface-container text-on-surface-variant shadow-elevation-1 duration-short4 hover:text-on-surface pointer-events-auto ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                        >
                            <MaterialIcon name="chevron_left" size={18} />
                        </button>
                    </div>
                )}
                {overflow.right && (
                    <div
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-end rounded-r-lg bg-gradient-to-l to-transparent',
                            isNeutral
                                ? 'from-adn-surface-muted via-adn-surface-muted/80'
                                : 'from-surface via-surface/80',
                        )}
                    >
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => scrollTabs(1)}
                            className="bg-surface-container text-on-surface-variant shadow-elevation-1 duration-short4 hover:text-on-surface pointer-events-auto mr-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                        >
                            <MaterialIcon name="chevron_right" size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Bouton « toutes les vues » (F6/X8) : rendu seulement quand des onglets débordent */}
            {showAllViewsButton && (
                <button
                    type="button"
                    onClick={() => setAllViewsOpen(true)}
                    aria-label={`Toutes les vues (${items.length})`}
                    aria-haspopup="dialog"
                    className="touch-target text-on-surface-variant duration-short4 hover:bg-surface-container hover:text-on-surface focus-visible:ring-focus-ring flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-0.5 rounded-md px-1.5 transition-colors outline-none focus-visible:ring-2"
                >
                    <MaterialIcon name="unfold_more" size={18} />
                    <span className="text-label-small font-semibold">{items.length}</span>
                </button>
            )}
            {allViewsButton && (
                <BottomSheet
                    open={allViewsOpen}
                    onClose={() => setAllViewsOpen(false)}
                    title="Toutes les vues"
                >
                    <nav aria-label={ariaLabel} className="flex flex-col gap-1 pb-2">
                        {items.map((item) => {
                            const isActive = activeId === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-current={isActive ? 'true' : undefined}
                                    onClick={() => {
                                        setAllViewsOpen(false);
                                        if (!isActive) onChange(item.id);
                                    }}
                                    className={cn(
                                        // Feuille « toutes les vues » : rangées 44px → hit-box 48px sur tactile (index.css).
                                        'touch-target text-label-large duration-short4 focus-visible:ring-focus-ring flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2',
                                        isActive
                                            ? 'bg-primary text-on-primary'
                                            : 'text-on-surface hover:bg-surface-container',
                                    )}
                                >
                                    {item.icon && (
                                        <span
                                            className={
                                                isActive
                                                    ? 'text-on-primary'
                                                    : 'text-on-surface-variant'
                                            }
                                        >
                                            {React.isValidElement(item.icon)
                                                ? React.cloneElement(
                                                      item.icon as React.ReactElement<
                                                          Record<string, unknown>
                                                      >,
                                                      { size: 20 },
                                                  )
                                                : item.icon}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                    {item.badge !== undefined && (
                                        <Badge
                                            variant="neutral"
                                            className={cn(
                                                'h-4 min-w-[16px] px-1.5 py-0',
                                                isActive && 'bg-on-primary text-primary',
                                            )}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                    {isActive && <MaterialIcon name="check" size={18} />}
                                </button>
                            );
                        })}
                    </nav>
                </BottomSheet>
            )}
        </div>
    );
};
