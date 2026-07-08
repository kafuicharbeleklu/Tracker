import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-10 px-6 text-center',
                className,
            )}
        >
            <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center mb-4 border border-outline-variant">
                <MaterialIcon name={icon} size={28} className="text-on-surface-variant" />
            </div>

            <h3 className="text-title-medium text-on-surface mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-body-medium text-on-surface-variant mb-6 max-w-md">
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
};
