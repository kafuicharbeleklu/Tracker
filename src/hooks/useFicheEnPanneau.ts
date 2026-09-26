import { createContext, useContext } from 'react';

/**
 * **La fiche est-elle ouverte dans le panneau d'une liste ?** (P2a, 25/09)
 *
 * Dès 840, Actifs, Équipe, Historique et Tâches posent la liste à gauche (360) et la fiche
 * à droite. C'est la même fiche que la page — mêmes cartes, mêmes gestes —, mais dans une
 * colonne de 330 à 800 px et non plus dans la fenêtre : `DetailTemplate` y pose un en-tête
 * sans retour, une seule colonne, et le héro y met ses chiffres en ligne. Les requêtes de
 * fenêtre ne peuvent pas le savoir ; le panneau le dit à ce qu'il contient.
 */
export interface FicheEnPanneau {
    /** Ouvrir la fiche en pleine page — l'adresse propre de l'objet. */
    onPleinePage?: () => void;
}

export const FicheEnPanneauContext = createContext<FicheEnPanneau | null>(null);

export const useFicheEnPanneau = (): FicheEnPanneau | null => useContext(FicheEnPanneauContext);
