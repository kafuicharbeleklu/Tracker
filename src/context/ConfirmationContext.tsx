import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import ConfirmationSheet, {
  ConfirmationDetail,
  ConfirmationReason,
} from '../components/ui/ConfirmationSheet';

/**
 * La confirmation est consommée **par contexte**, jamais comme un composant local :
 * une vue, neuf écrans, vingt-neuf appels (planche 17.2). C'est ce qui rend le
 * portage de la planche gratuit pour les écrans — ils n'ont rien à redessiner.
 */

/**
 * Hérité : la couleur du geste. `danger` = rouge, `warning` / `info` = sombre.
 * Conservé pour les appels existants ; les nouveaux disent `tone` et `irreversible`,
 * qui séparent la couleur (C3) de l'affirmation (C4).
 */
type LegacyVariant = 'danger' | 'warning' | 'info';

interface ConfirmationOptions {
  /** C1 — nomme le sujet : « Supprimer Latitude 5540 du parc ? » */
  title: string;
  /** C2 — la conséquence, et ce qui est conservé. */
  message: React.ReactNode;
  variant?: LegacyVariant;
  tone?: 'destructive' | 'neutral';
  /** C4 — ajoute la ligne rouge « Cette action est irréversible. » */
  irreversible?: boolean;
  /** C3 — le verbe. « Supprimer », « Suspendre », jamais « OK ». */
  confirmText?: string;
  cancelText?: string;
  icon?: PhosphorGlyph;
  /** Les faits qui pèsent sur la décision — détenteur, valeur, mouvements. */
  details?: ConfirmationDetail[];
  /** Le motif, quand l'acte en réclame un ; il est transmis tel quel. */
  reason?: ConfirmationReason;
  /** Mot-clé que l'utilisateur doit taper pour armer le bouton de confirmation */
  confirmKeyword?: string;
  onConfirm: (reason?: string) => Promise<void> | void;
}

interface ConfirmationContextType {
  requestConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

const DEFAULT_OPTIONS: ConfirmationOptions = {
  title: '',
  message: '',
  onConfirm: () => {},
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConfirmationOptions>(DEFAULT_OPTIONS);

  const requestConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setError(null);
    setIsOpen(true);
  }, []);

  const closeConfirmation = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleConfirm = async (reason?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await options.onConfirm(reason);
      closeConfirmation();
    } catch (caught) {
      console.error('Erreur lors de la confirmation:', caught);
      setIsLoading(false);
      // 17.1, règle 1 — l'erreur vit là où le geste a été engagé : la feuille reste
      // ouverte, le motif reste écrit, et le geste primaire devient « Réessayer ».
      setError(
        caught instanceof Error && caught.message
          ? `L’action n’a pas abouti. ${caught.message}`
          : 'L’action n’a pas abouti. Rien n’a été modifié.'
      );
    }
  };

  // La couleur suit l'appel hérité tant que l'écran n'a pas été porté ; la ligne
  // « irréversible », elle, ne s'invente pas — un acte ne se déclare pas définitif
  // parce qu'il était rouge.
  const tone = options.tone ?? (options.variant === 'danger' ? 'destructive' : 'neutral');

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation, closeConfirmation }}>
      {children}
      <ConfirmationSheet
        isOpen={isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        tone={tone}
        irreversible={options.irreversible ?? false}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        icon={options.icon}
        details={options.details}
        reason={options.reason}
        confirmKeyword={options.confirmKeyword}
        isLoading={isLoading}
        error={error}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
