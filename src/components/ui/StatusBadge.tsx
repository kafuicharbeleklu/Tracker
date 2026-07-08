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
 * StatusBadge — palette sémantique adossée aux tokens du DS :
 * success → vert, info → bleu, warning → orange (≠ jaune marque),
 * danger → rouge, neutral → neutre chaud.
 */
type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success-light text-success-strong',
  info: 'bg-info-light text-info-strong',
  warning: 'bg-warning-light text-warning-strong',
  danger: 'bg-danger-light text-danger-strong',
  neutral: 'bg-surface-container text-on-surface',
};

const STATUS_CONFIG: Record<string, { tone: StatusTone; label?: string }> = {
  // Equipment
  'Disponible': { tone: 'success' },
  'Attribué': { tone: 'info' },
  'Assigné': { tone: 'info' },
  'En attente': { tone: 'warning' },
  'En réparation': { tone: 'danger', label: 'En réparation' },
  'En maintenance préventive': { tone: 'warning' },
  'Retiré': { tone: 'neutral' },
  'Perdu': { tone: 'danger' },
  'Réformé': { tone: 'neutral' },
  'Manquant': { tone: 'danger' },

  // Approvals
  'Pending': { tone: 'warning', label: 'En attente' },
  'Processing': { tone: 'info', label: 'En traitement' },
  'Approved': { tone: 'success', label: 'Approuvé' },
  'Rejected': { tone: 'danger', label: 'Rejeté' },
  'Completed': { tone: 'success', label: 'Terminé' },
  'Cancelled': { tone: 'neutral', label: 'Annulé' },
  'Expired': { tone: 'danger', label: 'Expiré' },

  // Approval workflow states
  'WAITING_MANAGER_APPROVAL': { tone: 'warning', label: 'Validation en cours' },
  'WAITING_IT_PROCESSING': { tone: 'info', label: 'Traitement en cours' },
  'WAITING_DOTATION_APPROVAL': { tone: 'warning', label: 'Validation en cours' },
  'PENDING_DELIVERY': { tone: 'warning', label: 'En attente' },
  'PENDING_RETURN': { tone: 'info', label: 'Retour en cours' },

  // Legacy workflow
  'WaitingManager': { tone: 'warning', label: 'Validation en cours' },
  'WaitingUser': { tone: 'warning', label: 'En attente' },

  // Urgency
  'high': { tone: 'danger', label: 'Urgent' },
  'normal': { tone: 'neutral', label: 'Normal' },
  'low': { tone: 'neutral', label: 'Basse' },

  // Roles
  'SuperAdmin': { tone: 'success', label: 'Super Admin' },
  'Admin': { tone: 'info', label: 'Admin' },
  'Manager': { tone: 'warning', label: 'Manager' },
  'User': { tone: 'neutral', label: 'Utilisateur' },
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
  const config = STATUS_CONFIG[status] ?? { tone: 'neutral' as StatusTone };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all duration-short4",
        TONE_CLASSES[config.tone],
        SIZE_CLASSES[size],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;

