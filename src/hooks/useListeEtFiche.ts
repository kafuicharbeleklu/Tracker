import { useEffect } from 'react';

import { MEDIA } from '../constants/breakpoints';
import { remplacerAdresseCourante, sansObjetOuvert } from '../lib/cheminParcouru';
import { useMediaQuery } from './useMediaQuery';
import { useObjetOuvert } from './useObjetOuvert';
import { useEchap } from './useEchap';

/**
 * **La liste et la fiche côte à côte, dès 840** (P2a, 25/09) — ce qu'une liste d'objets
 * partage : Actifs, Équipe, Historique.
 *
 * - `possible` : la page s'y prête maintenant (les cartes, pas le tableau ; une fiche à
 *   montrer). Au tableau, l'objet ouvert est oublié : le tableau ouvre la page.
 * - `sousLeSeuil` : ce que devient l'objet ouvert quand la fenêtre passe sous 840 — un
 *   iPad qu'on tourne, une fenêtre qu'on rétrécit. La fiche reste : la page de l'objet
 *   pour un actif ou une personne ; pour l'historique, la feuille du fait, qui reçoit
 *   `fermer` pour retirer `?ouvert=` de l'adresse.
 *
 * Rend `actif` (la page pose la liste et la fiche), `ouvert` (l'identifiant affiché à
 * côté, ou `null`), `ouvrir` et `fermer`.
 */
export const useListeEtFiche = (
    possible: boolean,
    sousLeSeuil: (id: string, fermer: () => void) => void,
) => {
    const deuxPanneaux = useMediaQuery(MEDIA.expandedUp);
    const { ouvert, ouvrir, fermer } = useObjetOuvert();

    useEffect(() => {
        if (!ouvert) return;
        if (!deuxPanneaux) sousLeSeuil(ouvert, fermer);
        else if (!possible) fermer();
    }, [deuxPanneaux, fermer, ouvert, possible, sousLeSeuil]);

    const actif = possible && deuxPanneaux;
    /* Échap referme la fiche ouverte à côté (P3) — la liste reste, le panneau invite. */
    useEchap(actif && Boolean(ouvert), fermer);
    return { actif, ouvert: actif ? ouvert : null, ouvrir, fermer };
};

/**
 * **Passer la main à la page de l'objet** sans laisser derrière soi l'adresse qui la
 * rouvrirait : la liste nue remplace `?ouvert=` dans l'historique et dans le chemin
 * parcouru, puis la page de l'objet s'empile. Le retour ramène à la liste — il ne rebondit
 * pas sur la fiche.
 */
export const passerALaPage = (adresseDeLaFiche: string) => {
    const adresseDeLaListe = sansObjetOuvert(window.location.hash.replace(/^#/, '') || '/');
    window.history.replaceState(window.history.state, '', `#${adresseDeLaListe}`);
    remplacerAdresseCourante(adresseDeLaListe);
    window.location.hash = adresseDeLaFiche;
};
