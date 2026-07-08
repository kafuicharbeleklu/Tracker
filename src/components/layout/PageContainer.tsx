import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Conteneur standard pour toutes les pages
 * Applique l'espacement unifié et l'animation d'entrée
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className
}) => {
  return (
    <main className={cn(
      // MD3 page margins: 16dp compact, 24dp medium+
      "p-page-sm medium:p-page",
      "space-y-5 pb-10",
      "animate-in fade-in slide-in-from-bottom-4 duration-500",
      "max-w-[1600px] mx-auto",
      className
    )}>
      {children}
    </main>
  );
};
