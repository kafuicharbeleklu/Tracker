import { useCallback, useEffect, useState } from 'react';

import { useMediaQuery } from './useMediaQuery';
import { MEDIA } from '../constants/breakpoints';

/**
 * **Cartes ou tableau — et qui décide.**
 *
 * Arbitrage de la recherche bureau du 08/09 : les deux formes **coexistent**, avec un
 * sélecteur dans l'en-tête de liste (17.8, à côté du tri) ; **cartes par défaut sous
 * 1280, tableau par défaut à 1280**. Le motif est une mesure : à 1280 moins les 264 de
 * la barre latérale, il reste 990 px, et six colonnes y tiennent sans troncature.
 *
 * Le choix est **retenu par liste**. Il ne l'est pas par compte au sens strict — le
 * produit n'a pas de préférences serveur : c'est le navigateur qui s'en souvient, donc
 * la personne sur sa machine. Un stockage refusé rend simplement le défaut de largeur.
 *
 * ## Le défaut n'est pas le choix
 *
 * Tant que personne n'a touché au sélecteur, la forme **suit la fenêtre** : élargir
 * l'écran fait passer au tableau, le rétrécir ramène les cartes. Dès qu'on choisit, ce
 * choix tient — c'est le sens d'un sélecteur. Sous 840 il n'y en a pas : six colonnes
 * sur un téléphone ne se lisent pas, et 17.8 n'a pas la place de poser le geste.
 */
export type ListView = 'cartes' | 'tableau';

const cle = (listId: string) => `tk_list_view_${listId}`;

const lire = (listId: string): ListView | null => {
    try {
        const brut = localStorage.getItem(cle(listId));
        return brut === 'cartes' || brut === 'tableau' ? brut : null;
    } catch {
        return null;
    }
};

export interface ListViewState {
    view: ListView;
    setView: (view: ListView) => void;
    /** Le régime autorise-t-il le choix ? Sous 840, non. */
    canChoose: boolean;
}

export const useListView = (listId: string): ListViewState => {
    const large = useMediaQuery(MEDIA.twoColumn);
    const expanded = useMediaQuery(MEDIA.expandedUp);
    const [choix, setChoix] = useState<ListView | null>(() => lire(listId));

    /* Changer de liste change de mémoire : chaque liste a la sienne. */
    useEffect(() => {
        setChoix(lire(listId));
    }, [listId]);

    const setView = useCallback(
        (view: ListView) => {
            setChoix(view);
            try {
                localStorage.setItem(cle(listId), view);
            } catch {
                // Ignore storage failures.
            }
        },
        [listId],
    );

    const defaut: ListView = large ? 'tableau' : 'cartes';
    const view: ListView = !expanded ? 'cartes' : (choix ?? defaut);

    return { view, setView, canChoose: expanded };
};
