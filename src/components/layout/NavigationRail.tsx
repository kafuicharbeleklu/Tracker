import React, { useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import IconButton from '../ui/IconButton';
import NavButton from '../ui/NavButton';
import { ViewType } from '../../types';
import { useAccessControl } from '../../hooks/useAccessControl';
import { DESTINATIONS, getDestinationShortLabel } from '../../constants/destinations';

interface NavigationRailProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onMenuClick: () => void;
    compact?: boolean;
    className?: string;
}

interface RailItemProps {
    destinationId: ViewType;
    icon: string;
    label: string;
    active: boolean;
    compact?: boolean;
    onClick: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    tabIndex: number;
}

const RailItem = React.forwardRef<HTMLButtonElement, RailItemProps>(
    (
        { destinationId, icon, label, active, compact = false, onClick, onKeyDown, tabIndex },
        ref,
    ) => (
        <NavButton
            ref={ref}
            surface="rail"
            active={active}
            dense={compact}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={tabIndex}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            aria-describedby={compact ? undefined : `rail-label-${destinationId}`}
            title={label}
        >
            <span
                className={cn(
                    compact
                        ? 'inline-flex h-7 w-full items-center justify-center rounded-lg'
                        : 'inline-flex h-8 w-full items-center justify-center rounded-lg',
                    active ? 'bg-primary text-on-primary' : '',
                )}
            >
                <MaterialIcon name={icon} size={24} filled={active} />
            </span>
            <span
                id={`rail-label-${destinationId}`}
                className={cn(
                    'text-label-small max-w-full text-center leading-tight',
                    compact && 'hidden',
                )}
            >
                {label}
            </span>
        </NavButton>
    ),
);

RailItem.displayName = 'RailItem';

/**
 * MD3 Navigation Rail (medium layouts): 80dp width with icon + label destinations.
 * Includes a menu action to open the full drawer.
 */
export const NavigationRail: React.FC<NavigationRailProps> = ({
    currentView,
    onViewChange,
    onMenuClick,
    compact = false,
    className,
}) => {
    const { permissions } = useAccessControl();
    const destinationRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const allRailItems = [
        ...(permissions.canViewInventory
            ? [
                  {
                      id: 'dashboard' as ViewType,
                      icon: DESTINATIONS.dashboard.icon,
                      label: getDestinationShortLabel('dashboard'),
                  },
              ]
            : []),
        ...(permissions.canViewInventory
            ? [
                  {
                      id: 'equipment' as ViewType,
                      icon: DESTINATIONS.equipment.icon,
                      label: getDestinationShortLabel('equipment'),
                  },
              ]
            : []),
        ...(permissions.canViewApprovals
            ? [
                  {
                      // La file, et elle seule. Le commentaire d'origine gardait « Approbations »
                      // au rail comme « l'archive » de la file — mais l'archive est l'onglet
                      // Historique de Tâches, pas un second écran. 17.7 tranche : une seule
                      // porte, la file. Fermée le 20/08, comme côté barre latérale.
                      id: 'tasks' as ViewType,
                      icon: DESTINATIONS.tasks.icon,
                      label: getDestinationShortLabel('tasks'),
                  },
              ]
            : []),
        ...(permissions.canViewUsers
            ? [
                  {
                      id: 'users' as ViewType,
                      icon: DESTINATIONS.users.icon,
                      label: getDestinationShortLabel('users'),
                  },
              ]
            : []),
    ];
    const railItems = allRailItems;

    const destinations = useMemo(
        () =>
            railItems.map((item) => ({
                ...item,
                active: currentView === item.id,
                onSelect: () => onViewChange(item.id),
            })),
        [currentView, onViewChange, railItems],
    );

    const activeIndex = Math.max(
        0,
        destinations.findIndex((item) => item.active),
    );

    const focusDestination = useCallback((index: number) => {
        destinationRefs.current[index]?.focus();
    }, []);

    const handleRailKeyDown = useCallback(
        (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (destinations.length === 0) {
                return;
            }

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    focusDestination((index + 1) % destinations.length);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    focusDestination((index - 1 + destinations.length) % destinations.length);
                    break;
                case 'Home':
                    event.preventDefault();
                    focusDestination(0);
                    break;
                case 'End':
                    event.preventDefault();
                    focusDestination(destinations.length - 1);
                    break;
                default:
                    break;
            }
        },
        [destinations.length, focusDestination],
    );

    return (
        <aside
            aria-label="Navigation secondaire"
            className={cn(
                compact
                    ? 'h-full w-16 border-r border-white/[0.03] bg-[var(--color-sidebar-bg)]'
                    : 'h-full w-[76px] border-r border-white/[0.03] bg-[var(--color-sidebar-bg)]',
                compact
                    ? 'flex flex-col items-center justify-between py-2'
                    : 'flex flex-col items-center justify-between py-3',
                className,
            )}
            style={{
                background:
                    'linear-gradient(180deg, var(--color-sidebar-gradient-from) 0%, var(--color-sidebar-gradient-to) 100%)',
            }}
        >
            <div className={cn('flex flex-col items-center gap-2', compact && 'gap-2')}>
                <IconButton
                    icon="menu"
                    variant="nav"
                    onClick={onMenuClick}
                    aria-label="Ouvrir le menu lateral"
                    title="Menu"
                />

                <nav
                    className={cn('mt-1 flex flex-col items-center gap-2', compact && 'gap-2')}
                    aria-label="Destinations principales"
                >
                    {destinations.map((item, index) => (
                        <RailItem
                            key={item.id}
                            ref={(el) => {
                                destinationRefs.current[index] = el;
                            }}
                            destinationId={item.id}
                            icon={item.icon}
                            label={item.label}
                            active={item.active}
                            compact={compact}
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleRailKeyDown(index, event)}
                            tabIndex={index === activeIndex ? 0 : -1}
                        />
                    ))}
                </nav>
            </div>
        </aside>
    );
};
