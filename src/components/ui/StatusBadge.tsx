import React from 'react';
import { cn } from '../../lib/utils';
import { getStatusLabel } from '../../lib/businessRules';
import { TONE_CLASSES, type SemanticTone } from './Badge';

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
type ApprovalStatus = 'Rejected' | 'Completed' | 'Cancelled';
type UrgencyStatus = 'low' | 'normal' | 'high';

interface StatusBadgeProps {
  status: EquipmentStatus | ApprovalStatus | UrgencyStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * StatusBadge — tons sémantiques partagés avec Badge (TONE_CLASSES, une seule
 * source — C7). Les libellés affichés viennent exclusivement de
 * getStatusLabel() (businessRules) : ce fichier ne mappe que statut → ton.
 */
const STATUS_TONES: Record<string, SemanticTone> = {
  // Equipment
  'Disponible': 'success',
  'Attribué': 'info',
  'Assigné': 'info',
  'En attente': 'warning',
  'En réparation': 'danger',
  'En maintenance préventive': 'warning',
  'Retiré': 'neutral',
  'Perdu': 'danger',
  'Réformé': 'neutral',
  'Manquant': 'danger',

  // Approvals
  'Rejected': 'danger',
  'Completed': 'success',
  'Cancelled': 'neutral',

  // Approval workflow states
  'WAITING_MANAGER_APPROVAL': 'warning',
  'WAITING_IT_PROCESSING': 'info',
  'WAITING_DOTATION_APPROVAL': 'warning',
  'PENDING_DELIVERY': 'warning',
  'PENDING_RETURN': 'info',

  // Urgency
  'high': 'danger',
  'normal': 'neutral',
  'low': 'neutral',

  // Roles
  'SuperAdmin': 'success',
  'Admin': 'info',
  'Manager': 'warning',
  'User': 'neutral',
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
  const tone = STATUS_TONES[status] ?? 'neutral';

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all duration-short4",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;

