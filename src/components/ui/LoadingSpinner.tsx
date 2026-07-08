import React from 'react';

interface LoadingSpinnerProps {
    className?: string;
    variant?: 'spinner' | 'linear';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    className = '',
    variant = 'spinner',
    size = 'md',
    text,
    fullScreen = false,
}) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4',
    };

    const containerClasses = fullScreen
        ? 'fixed inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm z-50 animate-in fade-in duration-300'
        : `flex flex-col items-center justify-center p-4 ${className}`;

    if (variant === 'linear') {
        return (
            <div className={`w-full max-w-md ${containerClasses}`}>
                <div className="h-1 w-full bg-surface-container-highest overflow-hidden rounded-full">
                    <div className="animate-linear-indeterminate h-full bg-primary origin-left" />
                </div>
                {text && (
                    <p className="mt-4 text-body-medium text-on-surface-variant animate-pulse">
                        {text}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className="relative">
                <div
                    className={`
                        ${sizeClasses[size]}
                        rounded-full
                        border-primary/30
                    `}
                />
                <div
                    className={`
                        ${sizeClasses[size]}
                        absolute top-0 left-0
                        rounded-full
                        border-t-primary
                        border-r-primary
                        border-b-transparent
                        border-l-transparent
                        animate-spin
                    `}
                />
            </div>

            {text && (
                <p className="mt-4 text-body-medium text-on-surface-variant font-medium animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
