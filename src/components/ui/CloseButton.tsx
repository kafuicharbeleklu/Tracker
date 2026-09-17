import React from 'react';
import { X } from '@phosphor-icons/react';
import Icon from './Icon';
import Button, { ButtonProps } from './Button';
import { cn } from '../../lib/utils';

const CloseButton: React.FC<ButtonProps> = ({ className, onClick, ...props }) => {
    return (
        <Button
            variant="text"
            /* `.tb` des feuilles (04.3, 05.2, 17.4) : **48**, rayon 4, la croix Phosphor de
               20 (I2). Il faisait 40 avec un glyphe Material — le seul de sa famille sur
               chaque feuille du produit (10/09). */
            size="md"
            iconOnly
            onClick={onClick}
            // Couleur par DÉFAUT, pas imposée : le `!` d'origine gagnait aussi contre le
            // `className` de l'appelant, qui n'avait donc aucun moyen de la changer.
            className={cn(
                'text-on-surface-variant hover:text-on-surface rounded-md border-none',
                className,
            )}
            aria-label="Fermer"
            {...props}
        >
            <Icon glyph={X} size={20} />
        </Button>
    );
};

export default CloseButton;
