import { useRef } from 'react';

/**
 * **La dernière valeur non nulle** (26/09) — ce qu'une feuille montrait quand on l'a
 * refermée. Une feuille montée sur `{acte && <ActSheet …/>}` disparaissait avec son acte ;
 * montée sur la dernière valeur et ouverte sur la valeur courante, elle garde son contenu
 * le temps de redescendre.
 */
export const useDerniereValeur = <T>(valeur: T | null | undefined): T | null => {
    const derniere = useRef<T | null>(valeur ?? null);
    if (valeur !== null && valeur !== undefined) derniere.current = valeur;
    return valeur ?? derniere.current;
};
