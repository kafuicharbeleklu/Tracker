import { createContext, useContext } from 'react';

/**
 * **Où se pose le geste d'ajout — au pouce, ou dans l'en-tête.**
 *
 * Au téléphone il flotte, carré de 56 au-dessus de la barre du bas (17.6). Au bureau il
 * n'y a plus de pouce : *« plus de FAB au bureau »* (17.11) — le même geste devient un
 * bouton d'en-tête, à côté du titre. C'est le gabarit qui sait dans quel régime il est et
 * qui pose le geste dans son en-tête ; le geste prend la forme de l'endroit.
 *
 * Relevé du 13/09 : la fiche d'un type et la liste des accès gardaient leur bouton
 * flottant au bureau, parce qu'elles le passaient par l'emplacement libre du gabarit.
 */
export type AddGesturePlacement = 'float' | 'header';

export const AddGesturePlacementContext = createContext<AddGesturePlacement>('float');

export const useAddGesturePlacement = (): AddGesturePlacement =>
    useContext(AddGesturePlacementContext);
