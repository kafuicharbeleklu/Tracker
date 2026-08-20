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
        <div
            className={cn(
                'bg-surface shadow-elevation-1 border-outline-variant p-card rounded-xl border',
                className,
            )}
        >
            <h3 className="text-label-large text-on-surface mb-6">{title}</h3>
            {items.length > 0 ? (
                <>
                    <div className="text-label-small text-on-surface-variant mb-3 flex items-center justify-between gap-3">
                        <span>
                            {visibleFrom}-{visibleTo} sur {items.length}
                        </span>
                        {totalPages > 1 && (
                            <span>
                                Page {currentPage}/{totalPages}
                            </span>
                        )}
                    </div>

                    <div className={cn('overflow-y-auto pr-2', maxHeightClassName)}>
                        <div className="border-outline-variant relative ml-3 space-y-0 border-l-2">
                            {pageItems.map((item) => (
                                <div key={item.id} className="relative pb-8 pl-8 last:pb-0">
                                    <div className="bg-surface border-outline absolute top-0 -left-[10px] flex h-5 w-5 items-center justify-center rounded-full border-2">
                                        <MaterialIcon
                                            name={item.icon || 'history'}
                                            size={12}
                                            className="text-primary"
                                        />
                                    </div>
                                    <div className="medium:flex-row medium:justify-between medium:items-start flex flex-col gap-1.5">
                                        <div className="min-w-0">
                                            <p className="text-body-small text-on-surface font-semibold break-words">
                                                {item.title}
                                            </p>
                                            {(item.actor || item.meta) && (
                                                <p className="text-label-small text-on-surface-variant break-words">
                                                    {item.actor ? `Par ${item.actor}` : null}
                                                    {item.actor && item.meta ? ' • ' : null}
                                                    {item.meta || null}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-label-small text-on-surface-variant bg-surface-container rounded-md px-2 py-1 font-bold whitespace-nowrap">
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
                                className="border-outline-variant bg-surface text-label-small text-on-surface-variant hover:bg-surface-container focus-visible:ring-focus-ring focus-visible:ring-offset-surface duration-short4 inline-flex h-9 items-center gap-1 rounded-lg border px-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-38"
                                aria-label="Page précédente de l'historique"
                            >
                                <MaterialIcon name="chevron_left" size={16} />
                                Précédent
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="border-outline-variant bg-surface text-label-small text-on-surface-variant hover:bg-surface-container focus-visible:ring-focus-ring focus-visible:ring-offset-surface duration-short4 inline-flex h-9 items-center gap-1 rounded-lg border px-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-38"
                                aria-label="Page suivante de l'historique"
                            >
                                Suivant
                                <MaterialIcon name="chevron_right" size={16} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="border-outline-variant bg-surface-container-low rounded-md border border-dashed p-6 text-center">
                    <p className="text-body-medium text-on-surface-variant">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
};

export default MovementTimeline;
