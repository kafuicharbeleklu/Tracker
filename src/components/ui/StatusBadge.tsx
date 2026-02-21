import React from 'react';
import { cn } from '../../lib/utils';
import { getStatusLabel } from '../../lib/businessRules';

type EquipmentStatus =
  | 'Disponible'
  | 'Attribué'
  | 'Assigné'
  | 'En attente'
  | 'En réparation'
  | 'En maintenance préventive'
  | 'Retiré'
  | 'Perdu'
  | 'Réformé'
  | 'Manquant';
type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
type UrgencyStatus = 'low' | 'normal' | 'high';

interface StatusBadgeProps {
  status: EquipmentStatus | ApprovalStatus | UrgencyStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * MD3 StatusBadge — Uses MD3 container color tokens.
 */
const STATUS_CONFIG: Record<string, { bg: string; text: string; label?: string }> = {
  // Equipment
  'Disponible': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  'Attribué': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  'Assigné': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  'En attente': { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  'En réparation': { bg: 'bg-error-container', text: 'text-on-error-container', label: 'En réparation' },
  'En maintenance préventive': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  'Retiré': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  'Perdu': { bg: 'bg-error-container', text: 'text-on-error-container' },
  'Réformé': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  'Manquant': { bg: 'bg-error-container', text: 'text-on-error-container' },

  // Approvals
  'Pending': { bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'En attente' },
  'Processing': { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'En traitement' },
  'Approved': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Approuvé' },
  'Rejected': { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Rejeté' },
  'Completed': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Terminé' },
  'Cancelled': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'Annulé' },
  'Expired': { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Expiré' },

  // Approval workflow states (MD3 workflow)
  'WAITING_MANAGER_APPROVAL': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Validation en cours' },
  'WAITING_IT_PROCESSING': { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Traitement en cours' },
  'WAITING_DOTATION_APPROVAL': { bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'Validation en cours' },
  'PENDING_DELIVERY': { bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'En attente' },
  'PENDING_RETURN': { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Retour en cours' },

  // Legacy workflow
  'WaitingManager': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Validation en cours' },
  'WaitingUser': { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'En attente' },

  // Urgency
  'high': { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Urgent' },
  'normal': { bg: 'bg-surface-container-highest', text: 'text-on-surface', label: 'Normal' },
  'low': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'Basse' },

  // Roles
  'SuperAdmin': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Super Admin' },
  'Admin': { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Admin' },
  'Manager': { bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'Manager' },
  'User': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'Utilisateur' },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-label-small',
  md: 'px-2.5 py-0.5 text-label-small',
  lg: 'px-4 py-2 text-label-medium',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className
}) => {
  const config = STATUS_CONFIG[status] || {
    bg: 'bg-surface-container-highest',
    text: 'text-on-surface-variant'
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium uppercase tracking-wider rounded-sm whitespace-nowrap transition-all duration-short4",
        config.bg,
        config.text,
        SIZE_CLASSES[size],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;

