import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import Tooltip from '../ui/Tooltip';
import NavButton from '../ui/NavButton';

interface SidebarItemProps {
    /** Material Symbols icon name */
    icon: string;
    label: string;
    active?: boolean;
    badge?: string | number;
    isCollapsed?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * MD3 Navigation Drawer Item.
 * Active state uses secondaryContainer-style indicator with filled icon.
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
    icon,
    label,
    active,
    badge,
    isCollapsed = false,
    onClick,
    className,
}) => {
    const badgeCount = typeof badge === 'number' ? badge : (badge ? parseInt(badge as string) : 0);

    const item = (
        <NavButton
            surface="drawer"
            active={active}
            dense={isCollapsed}
            onClick={onClick}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={className}
        >
            {/* Icon — filled when active (MD3 spec) */}
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                <MaterialIcon
                    name={icon}
                    size={24}
                    filled={active || false}
                    weight={active ? 600 : 400}
                />
            </span>

            {/* Label — MD3 Label Large */}
            {!isCollapsed && (
                <span className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-medium2 ease-emphasized text-label-large w-auto opacity-100 ml-3",
                    active ? "font-semibold" : "font-medium"
                )}>
                    {label}
                </span>
            )}

            {/* Badge */}
            {badge && badgeCount > 0 && (
                <span className={cn(
                    "flex items-center justify-center bg-error text-on-error rounded-full shadow-elevation-1 transition-all duration-medium2",
                    isCollapsed
                        ? "absolute top-1 right-1 min-w-[18px] h-[18px] text-[9px] p-0.5 leading-none z-10 text-label-small"
                        : "ml-auto w-auto min-w-[20px] h-5 px-1.5 text-label-small"
                )}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}
        </NavButton>
    );

    // Rétracté : étiquette via la primitive Tooltip en stratégie fixed — un tooltip maison
    // posé DANS le bouton (overflow-hidden) ou dans le scroller de la sidebar serait clippé
    // et invisible (§9.5).
    if (isCollapsed) {
        return (
            <Tooltip content={label} placement="right" strategy="fixed" delay={300}>
                {item}
            </Tooltip>
        );
    }

    return item;
};

export default SidebarItem;

