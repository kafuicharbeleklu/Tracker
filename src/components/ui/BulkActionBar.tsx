import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Pied d'actions groupées — planche **17.2**, passe du 06/09.
 *
 * **S1 — aucun acte grisé en attente d'une sélection.** Ce pied **n'existe pas** à
 * sélection vide : il n'est pas désactivé, il n'est pas là. Un bouton grisé demande à
 * l'utilisateur de deviner ce qui le débloquerait. Le composant rend donc `null` dès que
 * rien n'est coché — la règle est portée par le code, pas par l'appelant.
 *
 * **Il est posé au bas de l'écran, pas au bas de la liste.** Il était `sticky` dans un
 * conteneur qui ne défile pas : mesuré le 06/09, il tombait à **727 px sous le pli** sur
 * l'inventaire, c'est-à-dire nulle part. Les actes d'une sélection restent sous le
 * pouce, quelle que soit la longueur de la liste — sinon la sélection est un régime dans
 * lequel on entre sans pouvoir en faire quoi que ce soit.
 *
 * **Un verbe et le débordement**, dans la grille que la planche déclare : `1fr 48px`. Ce
 * qui n'est pas possible sur les éléments cochés n'y figure pas ; ce qui déborde va au ⋮,
 * jamais dans une troisième colonne.
 */

interface BulkActionBarProps {
    /** Le nombre d'éléments cochés — le pied disparaît à zéro (S1). */
    count: number;
    /** Le ou les gestes possibles sur la sélection. */
    children: React.ReactNode;
    /** Le bouton de débordement, carré de 48, quand d'autres actes existent. */
    overflow?: React.ReactNode;
    className?: string;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, children, overflow, className }) => {
    if (count < 1) return null;

    return (
        <div
            className={cn(
                'border-outline-variant bg-surface fixed right-0 bottom-0 left-0 z-50 grid gap-3 border-t px-4 pt-3 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
                overflow ? 'grid-cols-[1fr_48px]' : 'grid-cols-1',
                className,
            )}
        >
            <div className="grid auto-cols-fr grid-flow-col gap-3">{children}</div>
            {overflow}
        </div>
    );
};

export default BulkActionBar;
