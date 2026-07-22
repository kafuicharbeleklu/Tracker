import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import MaterialIcon from '../ui/MaterialIcon';

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
        "h-16 bg-surface border-b border-outline-variant",
        "flex items-center justify-between px-4",
        className
      )}
    >
      <div className="flex items-center min-w-0 flex-1">
        {leadingAction && (
          <Button
            variant="text"
            size="sm"
            onClick={leadingAction.onClick}
            aria-label={leadingAction.label}
            title={leadingAction.label}
            className="!w-10 !h-10 !min-h-10 !min-w-10 !p-0"
            icon={<MaterialIcon name={leadingAction.icon} size={24} />}
          />
        )}
        <div className={cn("section-title truncate ml-1 flex-1 text-[var(--color-text-primary)]", titleClassName)} role="heading" aria-level={2}>
          {title}
        </div>
      </div>

      {trailingActions.length > 0 && (
        <div className="flex items-center">
          {trailingActions.slice(0, 3).map((action) => (
            <Button
              key={`${action.icon}-${action.label}`}
              variant="text"
              size="sm"
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
              className="!w-10 !h-10 !min-h-10 !min-w-10 !p-0"
              icon={<MaterialIcon name={action.icon} size={24} />}
            />
          ))}
        </div>
      )}
    </header>
  );
};

export default TopAppBar;


