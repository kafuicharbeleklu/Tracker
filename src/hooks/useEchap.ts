import { useEffect } from 'react';

import { echapPourLaPage } from '../lib/clavier';

/**
 * **Échap ferme ce que la page tient ouvert** (P3, 25/09) — la fiche à côté d'une liste,
 * une sélection groupée —, seulement si aucun calque ne le réclame et hors d'un champ
 * (`echapPourLaPage`). `actif` faux : rien n'écoute.
 */
export const useEchap = (actif: boolean, fermer: () => void) => {
    useEffect(() => {
        if (!actif) return;
        const surTouche = (event: KeyboardEvent) => {
            if (!echapPourLaPage(event)) return;
            event.preventDefault();
            fermer();
        };
        document.addEventListener('keydown', surTouche);
        return () => document.removeEventListener('keydown', surTouche);
    }, [actif, fermer]);
};
