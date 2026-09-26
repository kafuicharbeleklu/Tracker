import { useEffect, useState } from 'react';

/**
 * **La fenêtre d'arrivée d'une page** (26/09) — vraie le temps que ses rangées et ses cartes
 * entrent en cascade (`mvt-cascade`, `mvt-cascade-cartes`), puis fausse : une rangée montée
 * ensuite (au défilement, par un filtre) arrive sans cascade. La page change, la fenêtre se
 * rouvre (`cle`).
 */
export const useEntree = (cle?: unknown, duree = 900): boolean => {
    const [actif, setActif] = useState(true);
    useEffect(() => {
        setActif(true);
        const fin = window.setTimeout(() => setActif(false), duree);
        return () => window.clearTimeout(fin);
    }, [cle, duree]);
    return actif;
};
