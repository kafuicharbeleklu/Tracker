import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

/* Doit rester en phase avec les classes h-16 (barre) et top-16 (onglets) ci-dessous. */
const PINNED_BAR_HEIGHT_PX = 64;

interface DetailPageShellProps {
    /** Contenu de la barre épinglée (hauteur fixe h-16). `scrolled` ne doit piloter que du paint-only (opacité/visibilité). */
    bar: (scrolled: boolean) => React.ReactNode;
    /** Bloc d'identité/actions qui défile sous la barre. */
    hero: React.ReactNode;
    /** Onglets épinglés sous la barre une fois le héro défilé. */
    tabs?: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
}

/**
 * Gabarit des pages détail à en-tête escamotable. Contrainte structurelle (audit UX §9.7) :
 * l'escamotage ne doit JAMAIS modifier la géométrie du scrollport — un en-tête frère du
 * scroller (ou sticky à hauteur variable) dont la hauteur dépend du scroll fait osciller le
 * max de défilement et boucle collapse↔expand sur les fiches courtes. Ici la barre est
 * épinglée à hauteur fixe, le héro défile physiquement dessous, et `scrolled` (hystérésis
 * par IntersectionObserver) ne sert qu'à des bascules d'opacité dans la barre.
 */
const DetailPageShell: React.FC<DetailPageShellProps> = ({
    bar,
    hero,
    tabs,
    children,
    contentClassName,
}) => {
    const [scrolled, setScrolled] = useState(false);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroller = scrollerRef.current;
        const heroElement = heroRef.current;
        if (!scroller || !heroElement) return undefined;

        const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
            root: scroller,
            rootMargin: `-${PINNED_BAR_HEIGHT_PX}px 0px 0px 0px`,
        });
        observer.observe(heroElement);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="bg-surface-container-low flex h-full flex-col overflow-hidden">
            <div ref={scrollerRef} className="flex-1 overflow-y-auto scroll-smooth">
                <div className="bg-surface border-outline-variant px-page-sm medium:px-page sticky top-0 z-20 h-16 border-b">
                    {bar(scrolled)}
                </div>
                <div ref={heroRef} className="bg-surface">
                    {hero}
                </div>
                {tabs && (
                    <div className="bg-surface border-outline-variant sticky top-16 z-20 border-b">
                        {tabs}
                    </div>
                )}
                <div className={cn('p-page-sm medium:p-page', contentClassName)}>{children}</div>
            </div>
        </div>
    );
};

export default DetailPageShell;
