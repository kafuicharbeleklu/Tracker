import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * `none` : la page pose elle-même ses marges (mise en page à panneaux, en-tête
   * collant…). Sans cette porte de sortie, l'appelant devait neutraliser un
   * padding RESPONSIVE — ce qu'une classe non préfixée ne sait pas faire :
   * `p-0` ne bat pas `medium:p-page`, d'où les surcharges importantes du
   * constat AUDIT_MOBILE #15.
   */
  padding?: 'page' | 'none';
}

/**
 * Conteneur standard pour toutes les pages
 * Applique l'espacement unifié et l'animation d'entrée
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  padding = 'page'
}) => {
  return (
    <main className={cn(
      // MD3 page margins: 16dp compact, 24dp medium+
      padding === 'page' && "p-page-sm medium:p-page pb-10",
      "space-y-5",
      "animate-in fade-in slide-in-from-bottom-4 duration-500",
      "w-full min-w-0 max-w-[1600px] mx-auto",
      className
    )}>
      {children}
    </main>
  );
};
