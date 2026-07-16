import React, { useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
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
    ({ destinationId, icon, label, active, compact = false, onClick, onKeyDown, tabIndex }, ref) => (
        <Button
            ref={ref}
            variant="text"
            size="sm"
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={tabIndex}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            aria-describedby={compact ? undefined : `rail-label-${destinationId}`}
            className={cn(
                compact
                    ? "!w-12 !min-h-12 !px-1 !py-1 !flex-col !items-center !justify-center !gap-0.5 !rounded-lg"
                    : "!w-20 !min-h-16 !px-2 !py-1 !flex-col !items-center !justify-center !gap-1 !rounded-lg",
                "!outline-none focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-inset",
                "!transition-all !duration-short4 !ease-emphasized",
                active ? "!text-white" : "!text-neutral-400 hover:!text-white hover:!bg-white/5"
            )}
            title={label}
        >
            <span
                className={cn(
                    compact ? "w-full h-7 rounded-lg inline-flex items-center justify-center" : "w-full h-8 rounded-lg inline-flex items-center justify-center",
                    active ? "bg-primary text-on-primary" : ""
                )}
            >
                <MaterialIcon name={icon} size={24} filled={active} />
            </span>
            <span
                id={`rail-label-${destinationId}`}
                className={cn("text-label-small text-center leading-tight max-w-full", compact && "hidden")}
            >
                {label}
            </span>
        </Button>
    )
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
        ...(permissions.canViewInventory ? [{
            id: 'dashboard' as ViewType,
            icon: DESTINATIONS.dashboard.icon,
            label: getDestinationShortLabel('dashboard'),
        }] : []),
        ...(permissions.canViewInventory ? [{
            id: 'equipment' as ViewType,
            icon: DESTINATIONS.equipment.icon,
            label: getDestinationShortLabel('equipment'),
        }] : []),
        ...(permissions.canViewApprovals ? [{
            id: 'approvals' as ViewType,
            icon: DESTINATIONS.approvals.icon,
            label: getDestinationShortLabel('approvals'),
        }] : []),
        ...(permissions.canViewUsers ? [{
            id: 'users' as ViewType,
            icon: DESTINATIONS.users.icon,
            label: getDestinationShortLabel('users'),
        }] : []),
    ];
    const railItems = allRailItems;

    const destinations = useMemo(() => railItems.map((item) => ({
        ...item,
        active: currentView === item.id,
        onSelect: () => onViewChange(item.id),
    })), [currentView, onViewChange, railItems]);

    const activeIndex = Math.max(0, destinations.findIndex((item) => item.active));

    const focusDestination = useCallback((index: number) => {
        destinationRefs.current[index]?.focus();
    }, []);

    const handleRailKeyDown = useCallback((index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
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
    }, [destinations.length, focusDestination]);

    return (
        <aside
            aria-label="Navigation secondaire"
            className={cn(
                compact ? "w-16 h-full bg-[var(--color-sidebar-bg)] border-r border-white/[0.03]" : "w-[76px] h-full bg-[var(--color-sidebar-bg)] border-r border-white/[0.03]",
                compact ? "flex flex-col items-center justify-between py-2" : "flex flex-col items-center justify-between py-3",
                className
            )}
            style={{ background: 'linear-gradient(180deg, #131517 0%, #111315 100%)' }}
        >
            <div className={cn("flex flex-col items-center gap-2", compact && "gap-2")}>
                <IconButton
                    icon="menu"
                    variant="standard"
                    onClick={onMenuClick}
                    className="!text-neutral-400 hover:!text-white hover:!bg-white/5 focus-visible:!ring-primary"
                    aria-label="Ouvrir le menu lateral"
                    title="Menu"
                />

                <nav className={cn("flex flex-col items-center gap-2 mt-1", compact && "gap-2")} aria-label="Destinations principales">
                    {destinations.map((item, index) => (
                        <RailItem
                            key={item.id}
                            ref={(el) => { destinationRefs.current[index] = el; }}
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



