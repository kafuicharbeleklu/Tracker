import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Pied d'actions groupées — planche **17.2**.
 *
 * **S1 — aucun acte grisé en attente d'une sélection.** Ce pied **n'existe pas** à
 * sélection vide : il n'est pas désactivé, il n'est pas là. Un bouton grisé demande
 * à l'utilisateur de deviner ce qui le débloquerait. Le composant rend donc `null`
 * dès que rien n'est coché — la règle est portée par le code, pas par l'appelant.
 *
 * **Il ne contient que les actes possibles sur la sélection courante.** Ce qui n'est
 * pas possible sur les cinq éléments cochés n'y figure pas ; ce qui déborde va au
 * menu de la barre du haut, pas ici.
 *
 * La distribution appartient au conteneur (§2.29) : les gestes se partagent la
 * largeur, le débordement garde la sienne. Aucune classe de bouton ne le décide.
 */

interface BulkActionBarProps {
    /** Le nombre d'éléments cochés — le pied disparaît à zéro (S1). */
    count: number;
    /** Les gestes possibles sur la sélection. Deux au plus : le reste va au débordement. */
    children: React.ReactNode;
    /** Le bouton de débordement, s'il y a plus d'actes que de place. */
    overflow?: React.ReactNode;
    className?: string;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, children, overflow, className }) => {
    if (count < 1) return null;

    return (
        <div
            className={cn(
                // Collant en bas : les actes de la sélection restent sous le pouce quelle
                // que soit la longueur de la liste — on ne fait pas défiler pour agir.
                'sticky bottom-0 z-30 flex items-center gap-2.5 border-t border-outline-variant bg-surface px-5 py-3',
                'shadow-[0_-6px_18px_rgb(0_0_0/0.07)]',
                className
            )}
        >
            <div className="flex flex-1 items-center gap-2.5 [&>*]:flex-1">{children}</div>
            {overflow}
        </div>
    );
};

export default BulkActionBar;
