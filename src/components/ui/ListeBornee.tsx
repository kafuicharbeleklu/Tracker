import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../../lib/utils';

/**
 * **Une liste qui ne fait pas grandir sa carte** (25/09) — la règle des cartes à hauteur
 * fixe (22/09), pour les listes d'une fiche qui n'ont pas de plafond naturel : les modèles
 * d'un type, les locaux d'un site. Chaque ajout allongeait la carte, et la fiche avec elle.
 *
 * La liste se borne à `hauteur` et **défile dedans** — pas de « Voir plus » ni de pagination
 * (arbitrage du 23/09). La borne coupe volontairement une rangée en deux : ce qui dépasse se
 * voit. Un fondu au pied dit qu'il reste à lire ; il s'éteint en fin de liste, et n'existe pas
 * quand tout tient. Le défilement ne se propage pas à la page (`overscroll-contain`), et la
 * zone se prend au clavier.
 *
 * Un menu de rangée posé dedans doit être `floating`, sinon la zone qui défile le coupe.
 */
interface ListeBorneeProps {
    /** La hauteur maximale, en rem. */
    hauteur: number;
    /** Ce que la zone contient, pour qui la parcourt au clavier : « Les 23 modèles ». */
    label: string;
    /**
     * La zone s'étend aux bords d'une carte de 16 d'intérieur et reprend cette marge dedans :
     * les rangées qui débordent jusqu'au bord de la carte (`FactRow` ouvrable) et les anneaux
     * de focus des tuiles y tiennent sans faire défiler la zone de côté.
     */
    pleineLargeur?: boolean;
    children: React.ReactNode;
    className?: string;
}

const ListeBornee: React.FC<ListeBorneeProps> = ({
    hauteur,
    label,
    pleineLargeur = false,
    children,
    className,
}) => {
    const zone = useRef<HTMLDivElement>(null);
    const [resteAVoir, setResteAVoir] = useState(false);
    const [deborde, setDeborde] = useState(false);

    const mesurer = useCallback(() => {
        const el = zone.current;
        if (!el) return;
        setDeborde(el.scrollHeight > el.clientHeight + 2);
        setResteAVoir(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
    }, []);

    useEffect(() => {
        const el = zone.current;
        if (!el) return;
        mesurer();
        const observateur = new ResizeObserver(mesurer);
        observateur.observe(el);
        if (el.firstElementChild) observateur.observe(el.firstElementChild);
        return () => observateur.disconnect();
    }, [mesurer, children]);

    return (
        <div className={cn('relative', pleineLargeur && '-mx-4', className)}>
            <div
                ref={zone}
                onScroll={mesurer}
                role="region"
                aria-label={label}
                tabIndex={deborde ? 0 : undefined}
                className={cn(
                    'focus-visible:ring-focus-ring overflow-x-hidden overflow-y-auto overscroll-contain rounded-sm focus-visible:ring-2 focus-visible:outline-none',
                    pleineLargeur && 'px-4 py-0.5',
                )}
                style={{ maxHeight: `${hauteur}rem` }}
            >
                {children}
            </div>
            {resteAVoir && (
                <div
                    aria-hidden="true"
                    className="from-surface pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent"
                />
            )}
        </div>
    );
};

export default ListeBornee;
