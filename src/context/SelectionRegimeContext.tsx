import React, { createContext, useContext, useEffect } from 'react';

/**
 * **Le régime de sélection, su de la coque** — planche 17.2.
 *
 * *« L'écran change de régime ; il ne gagne pas une couche »* : la barre du haut est
 * remplacée, et le pied d'actes prend la place de la barre du bas. Or ces deux barres
 * n'appartiennent pas au même arbre — la liste porte l'une, `AppLayout` porte l'autre.
 * Sans ce canal, la coque ne peut pas savoir qu'une liste est entrée en sélection, et
 * l'écran se retrouve avec **deux pieds empilés** : les actes de la sélection, puis la
 * navigation, c'est-à-dire la couche que la planche refuse.
 *
 * Le contexte ne porte qu'un fait, et la liste est seule à le déclarer.
 */

interface SelectionRegime {
    /** Une liste de cet écran est-elle en sélection ? */
    active: boolean;
    /** Déclaré par le gabarit de liste, jamais par une page. */
    declare: (active: boolean) => void;
}

export const SelectionRegimeContext = createContext<SelectionRegime>({
    active: false,
    declare: () => {},
});

export const useSelectionRegime = (): SelectionRegime => useContext(SelectionRegimeContext);

/**
 * Déclare le régime pour la durée de vie de l'écran, et le relâche en partant — un
 * écran qu'on quitte en sélection ne doit pas laisser la coque sans sa barre du bas.
 */
export const useDeclareSelectionRegime = (active: boolean): void => {
    const { declare } = useSelectionRegime();
    useEffect(() => {
        declare(active);
        return () => declare(false);
    }, [active, declare]);
};

export const SelectionRegimeProvider: React.FC<{
    value: SelectionRegime;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <SelectionRegimeContext.Provider value={value}>{children}</SelectionRegimeContext.Provider>
);
