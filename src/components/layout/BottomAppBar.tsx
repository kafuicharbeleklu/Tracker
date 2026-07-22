import React from 'react';
import { cn } from '../../lib/utils';

interface BottomAppBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile bottom shell aligned with the SmartProcure navigation bar.
 */
const BottomAppBar: React.FC<BottomAppBarProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "min-h-16 w-full bg-surface/95 backdrop-blur-md border-t border-outline-variant shadow-[0_-1px_10px_rgba(0,0,0,0.04)]",
        // Réserve l'encoche basse (barre d'accueil iOS) sous les items de nav, sans réduire leur hauteur utile de 68 px.
        "pb-[max(0px,env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default BottomAppBar;
