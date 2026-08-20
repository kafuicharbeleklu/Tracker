import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div
            className={cn(
                'medium:pb-0 mt-6 flex items-center justify-center gap-2 pb-20',
                className,
            )}
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container focus-visible:ring-focus-ring focus-visible:ring-offset-surface duration-short4 ease-emphasized inline-flex h-10 w-10 items-center justify-center rounded-lg border p-0 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-38"
                aria-label="Page précédente"
            >
                <MaterialIcon name="chevron_left" size={18} />
            </button>

            <div className="flex items-center gap-2">
                {pages.map((page) => {
                    if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    'text-label-large duration-short4 ease-emphasized flex h-10 w-10 items-center justify-center rounded-lg font-semibold transition-all',
                                    'focus-visible:ring-focus-ring focus-visible:ring-offset-surface outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]',
                                    currentPage === page
                                        ? 'bg-primary text-on-primary shadow-elevation-1'
                                        : 'text-on-surface-variant hover:bg-surface-container',
                                )}
                            >
                                {page}
                            </button>
                        );
                    } else if (
                        (page === currentPage - 2 && page > 1) ||
                        (page === currentPage + 2 && page < totalPages)
                    ) {
                        return (
                            <span key={`dots-${page}`} className="text-on-surface-variant px-1">
                                ...
                            </span>
                        );
                    }
                    return null;
                })}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container focus-visible:ring-focus-ring focus-visible:ring-offset-surface duration-short4 ease-emphasized inline-flex h-10 w-10 items-center justify-center rounded-lg border p-0 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-38"
                aria-label="Page suivante"
            >
                <MaterialIcon name="chevron_right" size={18} />
            </button>
        </div>
    );
};

export default Pagination;
