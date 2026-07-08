import React from 'react';
import MaterialIcon from './MaterialIcon';
import Button, { ButtonProps } from './Button';
import { cn } from '../../lib/utils';

const CloseButton: React.FC<ButtonProps> = ({ className, onClick, ...props }) => {
  return (
    <Button
      variant="text"
      size="sm"
      onClick={onClick}
      className={cn("w-10 h-10 min-h-10 min-w-10 p-0 text-on-surface-variant hover:text-on-surface rounded-lg border-none", className)}
      aria-label="Fermer"
      {...props}
    >
      <MaterialIcon name="close" size={20} />
    </Button>
  );
};

export default CloseButton;
