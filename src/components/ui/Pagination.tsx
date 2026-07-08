import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-6 pb-20 medium:pb-0", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 p-0 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-all duration-short4 ease-emphasized"
        aria-label="Page précédente"
      >
        <MaterialIcon name="chevron_left" size={18} />
      </button>

      <div className="flex items-center gap-2">
        {pages.map(page => {
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
                  "w-10 h-10 flex items-center justify-center rounded-lg text-label-large font-semibold transition-all duration-short4 ease-emphasized",
                  currentPage === page
                    ? "bg-primary text-on-primary shadow-elevation-1"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                {page}
              </button>
            );
          } else if (
            (page === currentPage - 2 && page > 1) ||
            (page === currentPage + 2 && page < totalPages)
          ) {
            return <span key={`dots-${page}`} className="text-on-surface-variant px-1">...</span>;
          }
          return null;
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 p-0 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-all duration-short4 ease-emphasized"
        aria-label="Page suivante"
      >
        <MaterialIcon name="chevron_right" size={18} />
      </button>
    </div>
  );
};

export default Pagination;
