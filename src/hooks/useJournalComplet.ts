import { useEffect } from 'react';

import { useData } from '../context/DataContext';

/**
 * **Cet écran a besoin de tout le journal** (27/09).
 *
 * Sans cache local, l'ouverture de l'application ne lit que les derniers événements et ceux
 * des campagnes d'inventaire : c'est ce que montrent l'accueil et la file. L'historique, la
 * fiche d'un objet ou d'une personne, les rapports et le parcours d'une demande remontent plus
 * loin ; ils appellent ce crochet, qui lit le journal entier une fois (il entre alors dans le
 * cache). Rend `true` quand le journal est entier.
 *
 * `actif` à `false` le laisse en attente : la feuille d'une tâche, au téléphone, ne le
 * demande qu'une fois ouverte sur une tâche qui en a besoin (08/10).
 */
export const useJournalComplet = (actif = true): boolean => {
    const { journalComplet, demanderJournalComplet, isHydrating } = useData();

    useEffect(() => {
        if (actif && !journalComplet && !isHydrating) demanderJournalComplet();
    }, [actif, journalComplet, isHydrating, demanderJournalComplet]);

    return journalComplet;
};
