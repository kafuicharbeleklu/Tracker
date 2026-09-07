import React from 'react';
import { DotsThreeVertical } from '@phosphor-icons/react';

import Icon from './Icon';
import Menu, { type MenuItem } from './Menu';

/**
 * **Le débordement du pied de sélection** — planche 17.2.
 *
 * Le pied ne tient qu'un verbe et ce carré de 48 : *« le ⋮ du pied porte les autres »*.
 * Un second acte étiqueté dans la colonne du débordement serait rogné à 48 px de large
 * — c'est ce que faisaient les deux listes avant le 06/09, avec « Sortir du parc » et
 * « Supprimer » réduits à un rectangle sans texte.
 *
 * Le menu s'ouvre **vers le haut** : il part d'un pied posé au bas de l'écran.
 */
const BulkOverflow: React.FC<{ items: MenuItem[]; label?: string }> = ({
    items,
    label = 'Autres actions sur la sélection',
}) => {
    if (items.length === 0) return null;

    return (
        <Menu
            placement="top"
            align="end"
            widthClassName="w-[260px]"
            items={items}
            trigger={
                <button
                    type="button"
                    aria-label={label}
                    className="bg-surface-container text-on-surface focus-visible:ring-focus-ring flex h-12 w-12 items-center justify-center rounded-[4px] outline-none focus-visible:ring-2"
                >
                    <Icon glyph={DotsThreeVertical} size={20} />
                </button>
            }
        />
    );
};

export default BulkOverflow;
