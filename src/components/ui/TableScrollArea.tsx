import React, { useCallback, useEffect, useRef, useState } from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface TableScrollAreaProps {
    /** Contenu défilable — typiquement un `<table>`. */
    children: React.ReactNode;
    /**
     * Libellé de la région défilable. Sert à la fois d'`aria-label` (la région est
     * focalisable au clavier pour permettre le défilement sans souris — WCAG 2.1.1)
     * et de base au texte d'aide affiché quand le tableau déborde.
     */
    label: string;
    /** Classes du conteneur externe (positionne les affordances). */
    className?: string;
    /** Classes du scrollport lui-même (hauteur max, etc.). */
    scrollerClassName?: string;
}

/**
 * Scrollport horizontal ASSUMÉ pour les tableaux denses (AUDIT_MOBILE #12).
 *
 * Traitement retenu quand la recomposition en cartes n'est PAS pertinente (tables
 * de vérification pré-import : l'alignement en colonnes EST l'outil de lecture, et
 * l'usage est desktop-dominant). Plutôt que de laisser un `overflow-x-auto` nu et
 * muet, on rend le débordement perceptible et pilotable :
 *   - fondu + chevron sur le bord droit tant qu'il reste du contenu à droite ;
 *   - région focalisable (`tabIndex=0` + `role="region"`) → défilement au clavier ;
 *   - mention textuelle du débordement pour les lecteurs d'écran.
 *
 * La colonne de tête épinglée (`sticky left-0`) est portée par les tables appelantes,
 * pas par ce composant : elle dépend de la structure de chaque tableau.
 */
export const TableScrollArea: React.FC<TableScrollAreaProps> = ({
    children,
    label,
    className,
    scrollerClassName,
}) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const syncOverflow = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        // Tolérance de 1px : arrondis sub-pixel du layout des tables.
        const next = maxScroll > 1 && el.scrollLeft < maxScroll - 1;
        setCanScrollRight((prev) => (prev === next ? prev : next));
    }, []);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        syncOverflow();

        // Le contenu (nb de lignes/largeur des colonnes) change après parsing du CSV :
        // on observe le scrollport ET son contenu pour recalculer sans dépendre du render.
        const observer = new ResizeObserver(syncOverflow);
        observer.observe(el);
        const content = el.firstElementChild;
        if (content) observer.observe(content);
        return () => observer.disconnect();
    }, [syncOverflow]);

    const scrollRight = () => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
    };

    return (
        <div className={cn('relative', className)}>
            <div
                ref={scrollerRef}
                onScroll={syncOverflow}
                role="region"
                aria-label={label}
                tabIndex={0}
                className={cn(
                    'overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring',
                    scrollerClassName,
                )}
            >
                {children}
            </div>

            {canScrollRight && (
                <>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-12 items-center justify-end bg-gradient-to-l from-surface via-surface/80 to-transparent"
                    >
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-hidden="true"
                            onClick={scrollRight}
                            className="pointer-events-auto mr-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-elevation-1 transition-colors duration-short4 hover:text-on-surface"
                        >
                            <MaterialIcon name="chevron_right" size={18} />
                        </button>
                    </div>
                    <p className="sr-only" aria-live="polite">
                        {label} : contenu plus large que l'écran, défilement horizontal
                        disponible.
                    </p>
                </>
            )}
        </div>
    );
};

export default TableScrollArea;
