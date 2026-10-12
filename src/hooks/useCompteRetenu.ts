import { useState, useSyncExternalStore } from 'react';

import { ecouterLesVols, volsVers } from '../lib/vol';

/**
 * **Le compteur ne baisse qu'à l'arrivée de la pastille** (11/10) : tant qu'un vol est en
 * route vers lui (`lib/vol`), il garde le chiffre qu'il montrait. Sans vol, il suit sa
 * valeur à l'instant.
 */
export const useCompteRetenu = (valeur: number, compteur: string): number => {
    const vols = useSyncExternalStore(ecouterLesVols, () => volsVers(compteur));
    const [tenu, setTenu] = useState(valeur);
    if (vols === 0 && tenu !== valeur) setTenu(valeur);
    return vols === 0 ? valeur : tenu;
};
