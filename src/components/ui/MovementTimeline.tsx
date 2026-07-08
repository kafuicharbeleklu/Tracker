import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

export interface MovementTimelineItem {
    id: string;
    timestamp: string;
    title: string;
    actor?: string;
    meta?: string;
    icon?: string;
}

interface MovementTimelineProps {
    title: string;
    items: MovementTimelineItem[];
    emptyMessage: string;
    className?: string;
    pageSize?: number;
    maxHeightClassName?: string;
}

const formatTimelineDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const MovementTimeline: React.FC<MovementTimelineProps> = ({
    title,
    items,
    emptyMessage,
    className,
    pageSize = 8,
    maxHeightClassName = 'max-h-[24rem] medium:max-h-[30rem]',
}) => {
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
    const [currentPage, setCurrentPage] = React.useState(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [items.length, safePageSize]);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pageStart = (currentPage - 1) * safePageSize;
    const pageItems = items.slice(pageStart, pageStart + safePageSize);
    const visibleFrom = items.length === 0 ? 0 : pageStart + 1;
    const visibleTo = Math.min(pageStart + pageItems.length, items.length);

    return (
        <div className={cn('bg-surface rounded-xl shadow-elevation-1 border border-outline-variant p-card', className)}>
            <h3 className="text-label-large text-on-surface mb-6">{title}</h3>
            {items.length > 0 ? (
                <>
                    <div className="mb-3 flex items-center justify-between gap-3 text-label-small text-on-surface-variant">
                        <span>{visibleFrom}-{visibleTo} sur {items.length}</span>
                        {totalPages > 1 && <span>Page {currentPage}/{totalPages}</span>}
                    </div>

                    <div className={cn('overflow-y-auto pr-2', maxHeightClassName)}>
                        <div className="space-y-0 relative border-l-2 border-outline-variant ml-3">
                            {pageItems.map((item) => (
                                <div key={item.id} className="relative pl-8 pb-8 last:pb-0">
                                    <div className="absolute -left-[10px] top-0 w-5 h-5 rounded-full bg-surface border-2 border-outline flex items-center justify-center">
                                        <MaterialIcon name={item.icon || 'history'} size={12} className="text-primary" />
                                    </div>
                                    <div className="flex flex-col medium:flex-row medium:justify-between medium:items-start gap-1.5">
                                        <div className="min-w-0">
                                            <p className="text-body-small font-semibold text-on-surface break-words">{item.title}</p>
                                            {(item.actor || item.meta) && (
                                                <p className="text-label-small text-on-surface-variant break-words">
                                                    {item.actor ? `Par ${item.actor}` : null}
                                                    {item.actor && item.meta ? ' • ' : null}
                                                    {item.meta || null}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-label-small font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md whitespace-nowrap">
                                            {formatTimelineDate(item.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 text-label-small text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-all duration-short4"
                                aria-label="Page précédente de l'historique"
                            >
                                <MaterialIcon name="chevron_left" size={16} />
                                Précédent
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 text-label-small text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-all duration-short4"
                                aria-label="Page suivante de l'historique"
                            >
                                Suivant
                                <MaterialIcon name="chevron_right" size={16} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="rounded-md border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
                    <p className="text-body-medium text-on-surface-variant">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
};

export default MovementTimeline;
