import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import Tooltip from '../ui/Tooltip';

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
        <Button
            variant="text"
            size="sm"
            onClick={onClick}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
                "group relative !cursor-pointer !transition-all !duration-medium2 !ease-emphasized !flex !items-center !overflow-hidden",
                "!rounded-lg",
                // Accessibility
                "!outline-none focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-inset",
                // Horizontal spacing
                isCollapsed
                    ? "!w-11 !h-11 !min-h-11 !min-w-11 !self-center !mx-auto !px-0 !py-0 !justify-center !gap-0"
                    : "!w-full !min-h-11 !px-3 !py-2.5 !justify-start",
                // MD3 Active: secondaryContainer background, onSecondaryContainer text
                active
                    ? "!bg-primary !text-on-primary !ring-0 !shadow-sm"
                    : "!text-[var(--color-neutral-400)] hover:!bg-white/5 hover:!text-white",
                className
            )}
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
        </Button>
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

