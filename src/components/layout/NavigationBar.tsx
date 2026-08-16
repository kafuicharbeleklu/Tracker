import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    SquaresFour,
    Laptop,
    CheckCircle,
    UsersThree,
    List,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import { getDestinationShortLabel } from '../../constants/destinations';

interface NavigationBarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onMoreClick?: () => void;
    onLogout?: () => void;
    embedded?: boolean;
    className?: string;
}

type NavDestinationId = 'dashboard' | 'equipment' | 'tasks' | 'users' | 'more';
const MORE_VIEWS: ViewType[] = [
    'finance',
    'management',
    'rbac',
    'add_category',
    'add_model',
    'import_models',
    'category_details',
    'model_details',
    'locations',
    'import_locations',
    'audit',
    'audit_details',
    'reports',
    'settings',
];

interface BottomNavItem {
    id: NavDestinationId;
    glyph: PhosphorGlyph;
    label: string;
    onSelect: () => void;
    active?: boolean;
    ariaLabel?: string;
}

interface MenuItemData {
    id: string;
    label: string;
    description?: string;
    onSelect: () => void;
    destructive?: boolean;
    dividerBefore?: boolean;
}

const resolveBottomNavDestination = (view: ViewType): NavDestinationId | null => {
    if (
        view === 'equipment' ||
        view === 'equipment_details' ||
        view === 'add_equipment' ||
        view === 'edit_equipment' ||
        view === 'import_equipment' ||
        view === 'assignment_wizard' ||
        view === 'return_wizard'
    ) {
        return 'equipment';
    }

    if (
        view === 'users' ||
        view === 'user_details' ||
        view === 'add_user' ||
        view === 'edit_user' ||
        view === 'import_users'
    ) {
        return 'users';
    }

    if (view === 'tasks' || view === 'approvals' || view === 'new_request') {
        return 'tasks';
    }

    if (view === 'dashboard') {
        return 'dashboard';
    }

    if (MORE_VIEWS.includes(view)) {
        return 'more';
    }

    return null;
};

export const NavigationBar: React.FC<NavigationBarProps> = ({
    currentView,
    onViewChange,
    onMoreClick,
    onLogout,
    embedded = false,
    className,
}) => {
    const { currentUser } = useAuth();
    const { permissions } = useAccessControl();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const initials = useMemo(() => {
        if (!currentUser?.name) return 'U';
        const parts = currentUser.name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0].slice(0, 2).toUpperCase();
    }, [currentUser?.name]);

    const moreMenuItems: MenuItemData[] = useMemo(() => [
        ...(permissions.canViewFinance ? [{
            id: 'finance',
            label: 'Finances',
            description: 'Budgets, dépenses et coûts',
            onSelect: () => onViewChange('finance'),
        }] : []),
        ...(permissions.canManageInventory ? [{
            id: 'management',
            label: 'Catalogue & Modèles',
            description: 'Référentiel des équipements',
            onSelect: () => onViewChange('management'),
        }] : []),
        {
            id: 'locations',
            label: 'Emplacements',
            description: 'Sites, pays et bureaux',
            onSelect: () => onViewChange('locations'),
        },
        ...(permissions.canViewAudit ? [{
            id: 'audit',
            label: 'Journal d’audit',
            description: 'Historique des mouvements',
            onSelect: () => onViewChange('audit'),
        }] : []),
        ...(permissions.canViewReports ? [{
            id: 'reports',
            label: 'Rapports & Exports',
            description: 'Analyses et synthèses',
            onSelect: () => onViewChange('reports'),
        }] : []),
        ...(permissions.canManageRbac ? [{
            id: 'rbac',
            label: 'Rôles & Permissions',
            description: 'Droits et sécurité',
            onSelect: () => onViewChange('rbac'),
        }] : []),
        {
            id: 'settings',
            label: 'Paramètres',
            description: 'Préférences et devises',
            dividerBefore: true,
            onSelect: () => onViewChange('settings'),
        },
        ...(onLogout ? [{
            id: 'logout',
            label: 'Se déconnecter',
            description: 'Fermer la session active',
            destructive: true,
            dividerBefore: true,
            onSelect: onLogout,
        }] : []),
    ], [onLogout, onViewChange, permissions.canManageInventory, permissions.canManageRbac, permissions.canViewAudit, permissions.canViewFinance, permissions.canViewReports]);

    const destinations = useMemo(() => {
        const activeId = resolveBottomNavDestination(currentView);

        const items: BottomNavItem[] = [];

        if (permissions.canViewInventory) {
            items.push({
                id: 'dashboard',
                glyph: SquaresFour,
                label: getDestinationShortLabel('dashboard'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('dashboard');
                },
            });

            items.push({
                id: 'equipment',
                glyph: Laptop,
                label: getDestinationShortLabel('equipment'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('equipment');
                },
            });
        }

        if (permissions.canViewApprovals) {
            items.push({
                id: 'tasks',
                glyph: CheckCircle,
                label: getDestinationShortLabel('tasks'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('tasks');
                },
            });
        }

        if (permissions.canViewUsers) {
            items.push({
                id: 'users',
                glyph: UsersThree,
                label: getDestinationShortLabel('users'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('users');
                },
            });
        }

        items.push({
            id: 'more',
            glyph: List,
            label: 'Plus',
            onSelect: () => {
                if (onMoreClick) {
                    onMoreClick();
                    return;
                }
                setIsMenuOpen((prev) => !prev);
            },
            ariaLabel: onMoreClick ? 'Ouvrir le menu' : 'Plus',
        });

        return items.slice(0, 5).map((item) => ({
            ...item,
            active: activeId !== null && item.id === activeId,
        }));
    }, [currentView, onMoreClick, onViewChange, permissions.canViewApprovals, permissions.canViewInventory, permissions.canViewUsers]);

    const activeIndex = Math.max(0, destinations.findIndex((item) => item.active));

    // Handle outside clicks and escape key for menu
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                moreButtonRef.current &&
                !moreButtonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                moreButtonRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    const focusItem = useCallback((index: number) => {
        itemRefs.current[index]?.focus();
    }, []);

    const handleItemKeyDown = useCallback((index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (destinations.length === 0) {
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                focusItem((index + 1) % destinations.length);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                focusItem((index - 1 + destinations.length) % destinations.length);
                break;
            case 'Home':
                event.preventDefault();
                focusItem(0);
                break;
            case 'End':
                event.preventDefault();
                focusItem(destinations.length - 1);
                break;
            default:
                break;
        }
    }, [destinations.length, focusItem]);

    return (
        <>
            {/* Scrim when menu is open */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-[rgba(10,25,29,0.32)] transition-opacity duration-150"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Context Menu aligned with planche */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-orientation="vertical"
                    aria-label="Menu de navigation secondaire"
                    className="fixed bottom-16 right-2 w-[272px] max-w-[calc(100vw-16px)] bg-surface border border-[var(--tk-color-border-default)] rounded-lg shadow-[0_8px_28px_rgba(10,25,29,0.20),0_0_0_1px_var(--tk-color-border-default)] p-1.5 z-[60] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                >
                    {/* User profile header (planche 01.1 / 05.4 / 07.1) */}
                    {currentUser && (
                        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-0.5">
                            <div className="w-9 h-9 rounded-full bg-[var(--tk-color-inverse-surface)] text-white font-['Archivo'] font-semibold text-[15px] flex items-center justify-center shrink-0 select-none">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-medium text-[var(--tk-color-text-primary)] truncate leading-tight">
                                    {currentUser.name}
                                </div>
                                <div className="text-[11px] text-[var(--tk-color-text-secondary)] truncate mt-0.5">
                                    {currentUser.role} {currentUser.department ? `· ${currentUser.department}` : ''}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Menu items */}
                    {moreMenuItems.map((item) => (
                        <React.Fragment key={item.id}>
                            {item.dividerBefore && <div className="h-[1px] bg-[var(--tk-color-border-default)] my-1" />}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    item.onSelect();
                                    setIsMenuOpen(false);
                                }}
                                className={cn(
                                    'w-full text-left px-2.5 py-2 rounded-md flex flex-col justify-center min-h-[44px] transition-colors',
                                    item.destructive
                                        ? 'text-[var(--tk-color-danger)] hover:bg-[var(--tk-color-surface-muted)] active:bg-[var(--tk-color-surface-muted)]'
                                        : 'text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-muted)] active:bg-[var(--tk-color-surface-muted)]'
                                )}
                            >
                                <span className={cn('text-[14px] font-medium leading-snug', item.destructive && 'text-[var(--tk-color-danger)]')}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <span className="text-[11px] leading-[15px] text-[var(--tk-color-text-muted)] mt-0.5">
                                        {item.description}
                                    </span>
                                )}
                            </button>
                        </React.Fragment>
                    ))}

                    {/* Footer note */}
                    <div className="border-t border-[var(--tk-color-border-default)] mt-1 pt-2 px-2.5 pb-0.5 text-[11px] text-[var(--tk-color-text-muted)] tabular-nums flex items-center justify-between">
                        <span>Tracker v2.4.1</span>
                        <span>Neemba</span>
                    </div>
                </div>
            )}

            {/* Planche standard bottom navigation bar (.nav) */}
            <nav
                aria-label="Navigation principale"
                role="navigation"
                className={cn(
                    'nav h-14 min-h-[56px] w-full flex items-center justify-around bg-surface border-t border-[var(--tk-color-border-default)] select-none',
                    !embedded &&
                        'fixed bottom-0 left-0 right-0 z-50 pb-[max(0px,env(safe-area-inset-bottom))]',
                    className
                )}
            >
                {destinations.map((item, index) => {
                    const isMore = item.id === 'more';
                    const Glyph = item.glyph;
                    return (
                        <button
                            key={item.id}
                            ref={(el) => {
                                itemRefs.current[index] = el;
                                if (isMore) moreButtonRef.current = el;
                            }}
                            type="button"
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleItemKeyDown(index, event)}
                            tabIndex={index === activeIndex ? 0 : -1}
                            aria-current={item.active ? 'page' : undefined}
                            aria-expanded={isMore ? isMenuOpen : undefined}
                            aria-haspopup={isMore ? 'menu' : undefined}
                            aria-label={item.ariaLabel ?? item.label}
                            title={item.label}
                            className={cn(
                                'flex-1 h-full min-h-[56px] flex flex-col items-center justify-center gap-1 text-[11px] transition-colors relative cursor-pointer',
                                item.active
                                    ? 'text-[var(--tk-color-nav-active)] font-medium on'
                                    : 'text-[var(--tk-color-text-secondary)] hover:text-[var(--tk-color-text-primary)]'
                            )}
                        >
                            <Glyph
                                size={24}
                                weight={item.active ? 'fill' : 'regular'}
                                aria-hidden="true"
                                focusable="false"
                                className="flex-none"
                            />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};
