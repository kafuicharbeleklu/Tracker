import React, { useState, useEffect } from 'react';
import MaterialIcon from './MaterialIcon';
import Modal from './Modal';
import Button from './Button';
import InputField from './InputField';
import { cn } from '../../lib/utils';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  variant?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  /** Mot clé que l'utilisateur doit taper pour confirmer */
  confirmKeyword?: string;
}

const VARIANT_CONFIG = {
  warning: {
    icon: 'warning',
    iconBg: 'bg-primary-container',
    iconColor: 'text-on-primary-container',
    confirmVariant: 'filled' as const,
  },
  danger: {
    icon: 'error',
    iconBg: 'bg-error-container',
    iconColor: 'text-on-error-container',
    confirmVariant: 'danger' as const,
  },
  info: {
    icon: 'info',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-on-secondary-container',
    confirmVariant: 'filled' as const,
  },
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'warning',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isLoading = false,
  confirmKeyword,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeywordInput('');
    }
  }, [isOpen]);

  const config = VARIANT_CONFIG[variant];
  const isConfirmDisabled = confirmKeyword
    ? keywordInput.trim().toLowerCase() !== confirmKeyword.toLowerCase()
    : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      icon={
        <div className={cn("p-2 rounded-lg", config.iconBg)}>
          <MaterialIcon name={config.icon} size={24} className={config.iconColor} />
        </div>
      }
      footer={
        <div className="flex items-center gap-3 w-full justify-end">
          <Button variant="text" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            disabled={isConfirmDisabled || isLoading}
          >
            {isLoading ? (
              <MaterialIcon name="progress_activity" size={18} className="animate-spin" />
            ) : null}
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-body-medium text-on-surface-variant">{message}</p>

        {confirmKeyword && (
          <div className="pt-2">
            <p className="text-body-small text-on-surface-variant mb-2">
              Tapez <strong className="text-on-surface">{confirmKeyword}</strong> pour confirmer
            </p>
            <InputField
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder={confirmKeyword}
              variant="outlined"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
