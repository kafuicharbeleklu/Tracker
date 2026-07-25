import React from 'react';
import MaterialIcon from './MaterialIcon';
import Button, { ButtonProps } from './Button';
import { cn } from '../../lib/utils';

const CloseButton: React.FC<ButtonProps> = ({ className, onClick, ...props }) => {
  return (
    <Button
      variant="text"
      size="sm"
      iconOnly
      onClick={onClick}
      // Couleur par DÉFAUT, pas imposée : le `!` d'origine gagnait aussi contre le
      // `className` de l'appelant, qui n'avait donc aucun moyen de la changer.
      className={cn("text-on-surface-variant hover:text-on-surface rounded-lg border-none", className)}
      aria-label="Fermer"
      {...props}
    >
      <MaterialIcon name="close" size={20} />
    </Button>
  );
};

export default CloseButton;
