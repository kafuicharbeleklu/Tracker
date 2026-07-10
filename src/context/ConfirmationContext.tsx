import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

interface ConfirmationOptions {
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  /** Mot-clé que l'utilisateur doit taper pour armer le bouton de confirmation */
  confirmKeyword?: string;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmationContextType {
  requestConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeConfirmation = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await options.onConfirm();
      closeConfirmation();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      setIsLoading(false);
    }
  };

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation, closeConfirmation }}>
      {children}
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        variant={options.variant || 'warning'}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        confirmKeyword={options.confirmKeyword}
        isLoading={isLoading}
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