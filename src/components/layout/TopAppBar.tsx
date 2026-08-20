import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import MaterialIcon from '../ui/MaterialIcon';
import Tooltip from '../ui/Tooltip';

interface TopAppBarAction {
    icon: string;
    onClick: () => void;
    label: string;
}

interface TopAppBarProps {
    title: string;
    leadingAction?: TopAppBarAction;
    trailingActions?: TopAppBarAction[];
    className?: string;
    titleClassName?: string;
}

/**
 * Compact mobile app bar aligned with the SmartProcure shell.
 */
const TopAppBar: React.FC<TopAppBarProps> = ({
    title,
    leadingAction,
    trailingActions = [],
    className,
    titleClassName,
}) => {
    return (
        <header
            role="banner"
            className={cn(
                'bg-surface border-outline-variant h-16 border-b',
                'flex items-center justify-between px-4',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center">
                {leadingAction && (
                    // Tooltip maison (au lieu de `title` natif) : hover desktop ET appui long tactile
                    // (600 ms) — l'icône seule n'est plus muette au tap (AUDIT_MOBILE #6).
                    <Tooltip content={leadingAction.label} placement="bottom">
                        <Button
                            variant="text"
                            size="sm"
                            onClick={leadingAction.onClick}
                            aria-label={leadingAction.label}
                            iconOnly
                            icon={<MaterialIcon name={leadingAction.icon} size={24} />}
                        />
                    </Tooltip>
                )}
                <div
                    className={cn(
                        'section-title ml-1 flex-1 truncate text-[var(--tk-color-text-primary)]',
                        titleClassName,
                    )}
                    role="heading"
                    aria-level={2}
                >
                    {title}
                </div>
            </div>

            {trailingActions.length > 0 && (
                // gap-2 : les hit-box étendues à 48px (touch-target) se juxtaposent sans se
                // chevaucher (avant : boutons collés → zones de frappe superposées). AUDIT_MOBILE #7.
                <div className="flex items-center gap-2">
                    {trailingActions.slice(0, 3).map((action) => (
                        <Tooltip
                            key={`${action.icon}-${action.label}`}
                            content={action.label}
                            placement="bottom"
                        >
                            <Button
                                variant="text"
                                size="sm"
                                onClick={action.onClick}
                                aria-label={action.label}
                                iconOnly
                                icon={<MaterialIcon name={action.icon} size={24} />}
                            />
                        </Tooltip>
                    ))}
                </div>
            )}
        </header>
    );
};

export default TopAppBar;
