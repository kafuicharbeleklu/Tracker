import React, { useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import NavButton from '../ui/NavButton';
import { ViewType } from '../../types';
import { useAccessControl } from '../../hooks/useAccessControl';
import { DESTINATIONS, getDestinationShortLabel } from '../../constants/destinations';

interface NavigationBarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onMoreClick?: () => void;
    embedded?: boolean;
    className?: string;
}

type NavDestinationId = 'dashboard' | 'equipment' | 'approvals' | 'users' | 'more';
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

interface NavItemProps {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    tabIndex: number;
    ariaLabel?: string;
    badge?: number;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
    ({ icon, label, active, onClick, onKeyDown, tabIndex, ariaLabel, badge }, ref) => (
        <NavButton
            ref={ref}
            surface="bar"
            active={active}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={tabIndex}
            aria-current={active ? 'page' : undefined}
            aria-label={ariaLabel ?? label}
            title={label}
        >
            <div className="relative flex items-center justify-center w-16 h-8 transition-all duration-short4 ease-emphasized">
                <MaterialIcon
                    name={icon}
                    size={24}
                    filled={active}
                    className={cn('transition-all', active ? 'text-primary' : 'text-[var(--color-neutral-500)]')}
                />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-error text-on-error text-[10px] font-bold rounded-full px-1 leading-none">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </div>
            <span
                className={cn(
                    'text-label-medium max-w-full truncate px-0.5 transition-colors duration-short4',
                    active ? 'text-[var(--color-text-primary)] font-black' : 'text-[var(--color-text-secondary)]'
                )}
            >
                {label}
            </span>
        </NavButton>
    )
);

NavItem.displayName = 'NavItem';

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

    if (view === 'approvals' || view === 'new_request') {
        return 'approvals';
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
    embedded = false,
    className
}) => {
    const { permissions } = useAccessControl();
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const destinations = useMemo(() => {
        const activeId = resolveBottomNavDestination(currentView);

        const items: Array<{
            id: NavDestinationId;
            icon: string;
            label: string;
            onSelect: () => void;
            ariaLabel?: string;
        }> = [];

        if (permissions.canViewInventory) {
            items.push({
                id: 'dashboard',
                icon: DESTINATIONS.dashboard.icon,
                label: getDestinationShortLabel('dashboard'),
                onSelect: () => onViewChange('dashboard'),
            });

            items.push({
                id: 'equipment',
                icon: DESTINATIONS.equipment.icon,
                label: getDestinationShortLabel('equipment'),
                onSelect: () => onViewChange('equipment'),
            });
        }

        if (permissions.canViewApprovals) {
            items.push({
                id: 'approvals',
                icon: DESTINATIONS.approvals.icon,
                label: getDestinationShortLabel('approvals'),
                onSelect: () => onViewChange('approvals'),
            });
        }

        if (permissions.canViewUsers) {
            items.push({
                id: 'users',
                icon: DESTINATIONS.users.icon,
                label: getDestinationShortLabel('users'),
                onSelect: () => onViewChange('users'),
            });
        }

        items.push({
            id: 'more',
            icon: 'menu',
            label: 'Plus',
            onSelect: () => {
                if (onMoreClick) {
                    onMoreClick();
                    return;
                }
                onViewChange('settings');
            },
            ariaLabel: onMoreClick ? 'Ouvrir le menu' : 'Plus',
        });

        return items.slice(0, 5).map((item) => ({
            ...item,
            active: activeId !== null && item.id === activeId,
        }));
    }, [currentView, onMoreClick, onViewChange, permissions.canViewApprovals, permissions.canViewInventory, permissions.canViewUsers]);

    const activeIndex = Math.max(0, destinations.findIndex((item) => item.active));

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
        <nav
            aria-label="Navigation principale"
            role="navigation"
            className={cn(
                'h-[68px] w-full flex items-center gap-2 px-2 py-1',
                // Autonome (hors BottomAppBar) : ce nav est le conteneur du bas → il porte lui-même
                // la safe-area. Embarqué, c'est BottomAppBar qui la réserve (pas de double inset).
                !embedded &&
                    'bg-surface border-t border-[var(--color-border-default)] z-50 pb-[max(0px,env(safe-area-inset-bottom))]',
                className
            )}
        >
            {destinations.map((item, index) => (
                <NavItem
                    key={item.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    icon={item.icon}
                    label={item.label}
                    active={item.active}
                    onClick={item.onSelect}
                    onKeyDown={(event) => handleItemKeyDown(index, event)}
                    tabIndex={index === activeIndex ? 0 : -1}
                    ariaLabel={item.ariaLabel ?? item.label}
                />
            ))}
        </nav>
    );
};




