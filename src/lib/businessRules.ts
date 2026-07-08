import {
    Approval,
    ApprovalStatus,
    AssignmentStatus,
    Equipment,
    EventType,
    HistoryEvent,
    User,
    UserRole,
} from '../types';
import { RBAC_PERMISSIONS } from '../config/rbacDefaults';
import { isPermissionGranted } from './rbac';
import { EffectiveAccessProfile } from '../types/rbac';

export interface BusinessRuleDecision {
    allowed: boolean;
    reason?: string;
}

const buildPermissionGuardDecision = (
    access: EffectiveAccessProfile | null | undefined,
    permissionKey: typeof RBAC_PERMISSIONS.actions[keyof typeof RBAC_PERMISSIONS.actions],
    areaLabel: string,
): BusinessRuleDecision => {
    if (access && isPermissionGranted(access, permissionKey, 'write')) {
        return { allowed: true };
    }

    return {
        allowed: false,
        reason: `Action refusée: permissions insuffisantes pour la section ${areaLabel}.`,
    };
};

export const canManageInventoryByRole = (access?: EffectiveAccessProfile | null): BusinessRuleDecision =>
    buildPermissionGuardDecision(access, RBAC_PERMISSIONS.actions.inventoryManage, 'Inventaire');

export const canManageFinanceByRole = (access?: EffectiveAccessProfile | null): BusinessRuleDecision =>
    buildPermissionGuardDecision(access, RBAC_PERMISSIONS.actions.financeManage, 'Finances');

export const canManageUsersByRole = (access?: EffectiveAccessProfile | null): BusinessRuleDecision =>
    buildPermissionGuardDecision(access, RBAC_PERMISSIONS.actions.usersManage, 'Utilisateurs');

export const canManageSystemByRole = (access?: EffectiveAccessProfile | null): BusinessRuleDecision =>
    buildPermissionGuardDecision(access, RBAC_PERMISSIONS.actions.managementManage, 'Gestion');

export const canManageLocationsByRole = (access?: EffectiveAccessProfile | null): BusinessRuleDecision =>
    buildPermissionGuardDecision(access, RBAC_PERMISSIONS.actions.locationsManage, 'Emplacements');

interface ApprovalTransitionContext {
    approval: Approval;
    nextStatus: ApprovalStatus;
    actorRole?: UserRole;
    actorId?: string;
    users: User[];
}

interface EquipmentFromApprovalContext {
    status: ApprovalStatus;
    actorId?: string;
    nowISO: string;
}

interface ApprovalActionContext {
    approval: Approval;
    actorRole?: UserRole;
    actorId?: string;
    users: User[];
}

interface HistorySentenceContext {
    event: HistoryEvent;
    perspectiveActorId?: string;
}

interface UserUpdateContext {
    user: User;
    updates: Partial<User>;
    hasActiveApprovals: boolean;
    hasPendingManagerValidations: boolean;
    actorRole?: UserRole;
}

interface UserDeleteContext {
    hasAssignedEquipment: boolean;
    hasActiveApprovals: boolean;
    actorRole?: UserRole;
    targetRole?: UserRole;
    isSelfDelete?: boolean;
    activeSuperAdminCount?: number;
}

interface ReturnWorkflowContext {
    phase: 'initiation' | 'inspection';
    condition?: ReturnInspectionCondition;
    actorId?: string;
    nowISO: string;
}

type ReturnInspectionCondition =
    | 'Excellent'
    | 'Bon'
    | 'Moyen'
    | 'Mauvais'
    | 'Dégradé'
    | 'Hors service';

const APPROVAL_TRANSITIONS: Partial<Record<ApprovalStatus, readonly ApprovalStatus[]>> = {
    WAITING_MANAGER_APPROVAL: ['WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    WAITING_IT_PROCESSING: ['WAITING_DOTATION_APPROVAL', 'Rejected', 'Cancelled'],
    WAITING_DOTATION_APPROVAL: ['PENDING_DELIVERY', 'WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    PENDING_DELIVERY: ['Completed', 'Rejected', 'Cancelled'],

    // Legacy compatibility
    WaitingManager: ['WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    Pending: ['WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 'Rejected', 'Cancelled'],
    Processing: ['WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 'Rejected', 'Cancelled'],
    WaitingUser: ['Completed', 'Rejected', 'Cancelled'],
};

const LEGACY_APPROVAL_ACTIVE_STATUSES: readonly ApprovalStatus[] = [
    'Pending',
    'Processing',
    'WaitingManager',
    'WaitingUser',
];

const MODERN_APPROVAL_ACTIVE_STATUSES: readonly ApprovalStatus[] = [
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
];

export const ACTIVE_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
    ...LEGACY_APPROVAL_ACTIVE_STATUSES,
    ...MODERN_APPROVAL_ACTIVE_STATUSES,
];

const APPROVAL_HISTORY_STATUSES: readonly ApprovalStatus[] = [
    'Approved',
    'Rejected',
    'Completed',
    'Cancelled',
];

export const MANAGER_VALIDATION_PENDING_STATUSES: readonly ApprovalStatus[] = [
    'WaitingManager',
    'WAITING_MANAGER_APPROVAL',
    'WAITING_DOTATION_APPROVAL',
];

const RETURN_STATUS_BY_CONDITION: Record<ReturnInspectionCondition, Equipment['status']> = {
    Excellent: 'Disponible',
    Bon: 'Disponible',
    Moyen: 'Disponible',
    Mauvais: 'En réparation',
    Dégradé: 'En maintenance préventive',
    'Hors service': 'Retiré',
};

const MANAGER_GATES: readonly ApprovalStatus[] = ['WAITING_MANAGER_APPROVAL', 'WaitingManager', 'WAITING_DOTATION_APPROVAL'];
const IT_GATES: readonly ApprovalStatus[] = ['WAITING_IT_PROCESSING', 'Pending', 'Processing'];
const USER_CONFIRMATION_GATES: readonly ApprovalStatus[] = ['PENDING_DELIVERY', 'WaitingUser'];
const DISPLAYABLE_PENDING_ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
    'PENDING_RETURN',
];
const STATUS_DISPLAY_LABELS: Record<string, { default: string; short?: string }> = {
    // Equipment
    Disponible: { default: 'Disponible' },
    Attribué: { default: 'Attribué' },
    Assigné: { default: 'Assigné' },
    'En attente': { default: 'En attente' },
    'En réparation': { default: 'En réparation', short: 'En Répar.' },
    'En maintenance préventive': { default: 'Maintenance préventive' },
    Retiré: { default: 'Retiré' },
    Perdu: { default: 'Perdu' },
    Réformé: { default: 'Réformé' },
    Manquant: { default: 'Manquant' },

    // Approval
    Pending: { default: 'En attente' },
    Processing: { default: 'En traitement' },
    Approved: { default: 'Approuvé' },
    Rejected: { default: 'Rejeté' },
    Completed: { default: 'Terminé' },
    Cancelled: { default: 'Annulé' },
    Expired: { default: 'Expiré' },
    WAITING_MANAGER_APPROVAL: { default: 'Validation en cours' },
    WAITING_IT_PROCESSING: { default: 'Traitement en cours' },
    WAITING_DOTATION_APPROVAL: { default: 'Validation en cours' },
    PENDING_DELIVERY: { default: 'En attente' },
    PENDING_RETURN: { default: 'Retour en cours' },
    WaitingManager: { default: 'Validation en cours' },
    WaitingUser: { default: 'En attente' },

    // Roles / misc badges
    SuperAdmin: { default: 'Super Admin' },
    Admin: { default: 'Admin' },
    Manager: { default: 'Manager' },
    User: { default: 'Utilisateur' },
    high: { default: 'Urgent' },
    normal: { default: 'Normal' },
    low: { default: 'Basse' },
};
const HISTORY_EVENT_ICONS: Partial<Record<EventType, string>> = {
    CREATE: 'add_circle',
    UPDATE: 'history',
    DELETE: 'delete',
    ASSIGN: 'assignment_ind',
    ASSIGN_PENDING: 'assignment_ind',
    ASSIGN_MANAGER_WAIT: 'how_to_reg',
    ASSIGN_MANAGER_OK: 'fact_check',
    ASSIGN_IT_PROCESSING: 'engineering',
    ASSIGN_IT_SELECTED: 'devices',
    ASSIGN_DOTATION_WAIT: 'pending_actions',
    ASSIGN_DOTATION_OK: 'task_alt',
    ASSIGN_CONFIRMED: 'task_alt',
    ASSIGN_DISPUTED: 'report_problem',
    RETURN: 'assignment_return',
    REPAIR_START: 'build',
    REPAIR_END: 'build_circle',
    APPROVAL_CREATE: 'post_add',
    APPROVAL_MANAGER: 'how_to_reg',
    APPROVAL_ADMIN: 'verified',
    APPROVAL_REJECT: 'cancel',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'download',
    VIEW_SENSITIVE: 'visibility',
};
const HISTORY_EVENT_ACTIONS: Partial<Record<EventType, string>> = {
    CREATE: 'ajouté',
    UPDATE: 'mis à jour',
    DELETE: 'supprimé',
    ASSIGN: 'attribué',
    ASSIGN_PENDING: "initié l'attribution de",
    ASSIGN_MANAGER_WAIT: 'demandé une validation pour',
    ASSIGN_MANAGER_OK: 'validé',
    ASSIGN_IT_PROCESSING: 'lancé le traitement IT pour',
    ASSIGN_IT_SELECTED: 'sélectionné un actif pour',
    ASSIGN_DOTATION_WAIT: 'envoyé en validation de dotation',
    ASSIGN_DOTATION_OK: 'validé la dotation de',
    ASSIGN_CONFIRMED: 'confirmé la réception de',
    ASSIGN_DISPUTED: 'signalé un litige sur',
    RETURN: 'retourné',
    REPAIR_START: 'passé en réparation',
    REPAIR_END: 'sorti de réparation',
    APPROVAL_CREATE: 'créé une demande liée à',
    APPROVAL_MANAGER: 'validé une demande liée à',
    APPROVAL_ADMIN: 'traité une demande liée à',
    APPROVAL_REJECT: 'refusé une demande liée à',
    LOGIN: 'ouvert une session',
    LOGOUT: 'fermé une session',
    EXPORT: 'exporté des données sur',
    VIEW_SENSITIVE: 'consulté des données sensibles de',
};
const MOVEMENT_HISTORY_EVENT_TYPES: readonly EventType[] = [
    'CREATE',
    'ASSIGN',
    'ASSIGN_PENDING',
    'ASSIGN_MANAGER_WAIT',
    'ASSIGN_MANAGER_OK',
    'ASSIGN_IT_PROCESSING',
    'ASSIGN_IT_SELECTED',
    'ASSIGN_DOTATION_WAIT',
    'ASSIGN_DOTATION_OK',
    'ASSIGN_CONFIRMED',
    'ASSIGN_DISPUTED',
    'RETURN',
    'REPAIR_START',
    'REPAIR_END',
];

const findUserByApprovalRef = (users: User[], id?: string, name?: string) => {
    return users.find((user) => {
        if (id && user.id === id) return true;
        if (name && (user.name === name || user.email === name)) return true;
        return false;
    });
};

const isManagerOfRequest = (approval: Approval, actorId: string, users: User[]) => {
    const requester = findUserByApprovalRef(users, approval.requesterId, approval.requesterName);
    const beneficiary = findUserByApprovalRef(users, approval.beneficiaryId, approval.beneficiaryName);

    if (approval.requesterId === actorId || approval.beneficiaryId === actorId) return true;
    if (requester?.managerId === actorId) return true;
    if (beneficiary?.managerId === actorId) return true;
    return false;
};

export const isApprovalActiveStatus = (status: ApprovalStatus): boolean =>
    ACTIVE_APPROVAL_STATUSES.includes(status);

export const isApprovalHistoryStatus = (status: ApprovalStatus): boolean =>
    APPROVAL_HISTORY_STATUSES.includes(status);

export const isLegacyApprovalWorkflow = (status: ApprovalStatus): boolean =>
    LEGACY_APPROVAL_ACTIVE_STATUSES.includes(status);

export const isModernApprovalWorkflow = (status: ApprovalStatus): boolean =>
    MODERN_APPROVAL_ACTIVE_STATUSES.includes(status);

export const canUserActOnApproval = ({
    approval,
    actorRole,
    actorId,
    users,
}: ApprovalActionContext): boolean => {
    if (!actorRole || !actorId) return false;
    if (actorRole === 'SuperAdmin') return true;

    if (MANAGER_GATES.includes(approval.status)) {
        return actorRole === 'Manager' && isManagerOfRequest(approval, actorId, users);
    }

    if (IT_GATES.includes(approval.status)) {
        return actorRole === 'Admin';
    }

    if (USER_CONFIRMATION_GATES.includes(approval.status)) {
        return approval.beneficiaryId === actorId;
    }

    return false;
};

export const getStatusLabel = (
    status: string,
    options?: { short?: boolean },
): string => {
    const entry = STATUS_DISPLAY_LABELS[status];
    if (!entry) return status;
    if (options?.short && entry.short) return entry.short;
    return entry.default;
};

export const getDisplayedEquipmentStatus = ({
    status,
    assignmentStatus,
}: {
    status: Equipment['status'];
    assignmentStatus?: Equipment['assignmentStatus'];
}): string => {
    if (status !== 'En attente') {
        return status;
    }

    if (assignmentStatus && DISPLAYABLE_PENDING_ASSIGNMENT_STATUSES.includes(assignmentStatus)) {
        return assignmentStatus;
    }

    return status;
};

export const isOperationalEquipmentStatus = (status: Equipment['status']): boolean =>
    status === 'Disponible' || status === 'Attribué';

export const getHistoryEventIcon = (eventType: EventType): string =>
    HISTORY_EVENT_ICONS[eventType] || 'history';

const isMovementHistoryEventType = (eventType: EventType): boolean =>
    MOVEMENT_HISTORY_EVENT_TYPES.includes(eventType);

const readMetadataString = (value: unknown): string | null =>
    typeof value === 'string' ? value : null;

const isMovementUpdateEvent = (event: HistoryEvent): boolean => {
    if (event.type !== 'UPDATE') return false;

    const fromStatus = readMetadataString(event.metadata?.fromStatus);
    const toStatus = readMetadataString(event.metadata?.toStatus);
    if (fromStatus !== null && toStatus !== null && fromStatus !== toStatus) {
        return true;
    }

    const fromAssignmentStatus = readMetadataString(event.metadata?.fromAssignmentStatus);
    const toAssignmentStatus = readMetadataString(event.metadata?.toAssignmentStatus);
    if (
        fromAssignmentStatus !== null
        && toAssignmentStatus !== null
        && fromAssignmentStatus !== toAssignmentStatus
    ) {
        return true;
    }

    const beneficiaryId = readMetadataString(event.metadata?.beneficiaryId);
    const previousUserId = readMetadataString(event.metadata?.previousUserId);
    return beneficiaryId !== null || previousUserId !== null;
};

export const isEquipmentMovementEvent = (event: HistoryEvent): boolean => {
    if (event.targetType !== 'EQUIPMENT') return false;
    return isMovementHistoryEventType(event.type) || isMovementUpdateEvent(event);
};

export const getHistoryEventSentence = ({
    event,
    perspectiveActorId,
}: HistorySentenceContext): string => {
    const action = HISTORY_EVENT_ACTIONS[event.type] || 'agi sur';
    const target = event.targetName || 'cet élément';
    const isSelf = Boolean(perspectiveActorId && event.actorId === perspectiveActorId);
    const subject = isSelf ? 'Vous avez' : `${event.actorName || 'Un utilisateur'} a`;
    return `${subject} ${action} ${target}.`;
};

export const canTransitionApprovalStatus = ({
    approval,
    nextStatus,
    actorRole,
    actorId,
    users,
}: ApprovalTransitionContext): BusinessRuleDecision => {
    if (!actorRole) {
        return { allowed: false, reason: 'Session invalide: rôle manquant.' };
    }

    if (approval.status === nextStatus) {
        return { allowed: true };
    }

    const allowedTargets = APPROVAL_TRANSITIONS[approval.status] || [];
    if (!allowedTargets.includes(nextStatus)) {
        return {
            allowed: false,
            reason: `Transition non autorisée: ${approval.status} -> ${nextStatus}.`,
        };
    }

    if (actorRole === 'SuperAdmin') {
        return { allowed: true };
    }

    if (MANAGER_GATES.includes(approval.status)) {
        if (actorRole !== 'Manager') {
            return { allowed: false, reason: 'Cette étape est réservée au manager.' };
        }
        if (!actorId || !isManagerOfRequest(approval, actorId, users)) {
            return { allowed: false, reason: 'Vous ne gérez pas ce collaborateur.' };
        }
        return { allowed: true };
    }

    if (IT_GATES.includes(approval.status)) {
        if (actorRole !== 'Admin') {
            return { allowed: false, reason: 'Cette étape est réservée à l’IT.' };
        }
        return { allowed: true };
    }

    if (USER_CONFIRMATION_GATES.includes(approval.status)) {
        if (!actorId || approval.beneficiaryId !== actorId) {
            return { allowed: false, reason: 'Seul le bénéficiaire peut confirmer la réception.' };
        }
        return { allowed: true };
    }

    return { allowed: true };
};

export const getEquipmentUpdatesForApprovalStatus = ({
    status,
    actorId,
    nowISO,
}: EquipmentFromApprovalContext): Partial<Equipment> | null => {
    if (status === 'WAITING_MANAGER_APPROVAL') {
        return { status: 'En attente', assignmentStatus: 'WAITING_MANAGER_APPROVAL' };
    }
    if (status === 'WAITING_IT_PROCESSING') {
        return {
            status: 'En attente',
            assignmentStatus: 'WAITING_IT_PROCESSING',
            managerValidationBy: actorId,
            managerValidationAt: nowISO,
        };
    }
    if (status === 'WAITING_DOTATION_APPROVAL') {
        return { status: 'En attente', assignmentStatus: 'WAITING_DOTATION_APPROVAL' };
    }
    if (status === 'PENDING_DELIVERY') {
        return { status: 'En attente', assignmentStatus: 'PENDING_DELIVERY' };
    }
    if (status === 'Completed') {
        return {
            status: 'Attribué',
            assignmentStatus: 'CONFIRMED',
            confirmedBy: actorId,
            confirmedAt: nowISO,
        };
    }
    if (status === 'Rejected' || status === 'Cancelled') {
        return {
            status: 'Disponible',
            assignmentStatus: 'NONE',
            user: null,
        };
    }
    return null;
};

export const canDeleteEquipmentByBusinessRule = (
    equipment: Equipment,
    hasBusinessHistory: boolean,
): BusinessRuleDecision => {
    if (equipment.status === 'Attribué' || equipment.status === 'En attente') {
        return { allowed: false, reason: 'Impossible de supprimer un actif attribué ou en attente.' };
    }

    if (hasBusinessHistory) {
        return { allowed: false, reason: 'Suppression bloquée: actif avec historique métier existant.' };
    }

    return { allowed: true };
};

export const canUpdateUserByBusinessRule = ({
    user,
    updates,
    hasActiveApprovals,
    hasPendingManagerValidations,
    actorRole,
}: UserUpdateContext): BusinessRuleDecision => {
    if (user.role === 'SuperAdmin' && actorRole !== 'SuperAdmin') {
        return {
            allowed: false,
            reason: 'Seul un SuperAdmin peut modifier un compte SuperAdmin.',
        };
    }

    if (updates.role === 'SuperAdmin' && actorRole !== 'SuperAdmin') {
        return {
            allowed: false,
            reason: 'Seul un SuperAdmin peut attribuer le rôle SuperAdmin.',
        };
    }

    const wantsDeactivate = updates.status === 'inactive' && user.status !== 'inactive';
    if (wantsDeactivate && hasActiveApprovals) {
        return {
            allowed: false,
            reason: 'Impossible de désactiver un utilisateur avec des demandes en cours.',
        };
    }

    const managerChanged = !!updates.managerId && updates.managerId !== user.managerId;
    if (managerChanged && hasPendingManagerValidations) {
        return {
            allowed: false,
            reason: 'Impossible de changer le manager pendant une validation en attente.',
        };
    }

    return { allowed: true };
};

export const canDeleteUserByRoleRule = ({
    actorRole,
    targetRole,
    isSelfDelete = false,
    activeSuperAdminCount = 0,
}: {
    actorRole?: UserRole;
    targetRole?: UserRole;
    isSelfDelete?: boolean;
    activeSuperAdminCount?: number;
}): BusinessRuleDecision => {
    if (!actorRole) {
        return {
            allowed: false,
            reason: 'Suppression impossible: rôle de session introuvable.',
        };
    }

    if (!targetRole) {
        return {
            allowed: false,
            reason: 'Suppression impossible: rôle de la cible introuvable.',
        };
    }

    if (isSelfDelete) {
        return {
            allowed: false,
            reason: 'Suppression impossible: vous ne pouvez pas supprimer votre propre compte.',
        };
    }

    if (actorRole !== 'SuperAdmin' && actorRole !== 'Admin') {
        return {
            allowed: false,
            reason: 'Suppression impossible: permissions insuffisantes.',
        };
    }

    if (targetRole === 'SuperAdmin') {
        if (actorRole !== 'SuperAdmin') {
            return {
                allowed: false,
                reason: 'Seul un SuperAdmin peut supprimer un compte SuperAdmin.',
            };
        }

        if (activeSuperAdminCount <= 1) {
            return {
                allowed: false,
                reason: 'Suppression impossible: au moins un SuperAdmin actif doit rester.',
            };
        }
    }

    if (targetRole === 'Admin' && actorRole === 'Admin') {
        return {
            allowed: false,
            reason: 'Un Admin ne peut pas supprimer un autre compte Admin.',
        };
    }

    return { allowed: true };
};

export const canDeleteUserByBusinessRule = ({
    hasAssignedEquipment,
    hasActiveApprovals,
    actorRole,
    targetRole,
    isSelfDelete,
    activeSuperAdminCount,
}: UserDeleteContext): BusinessRuleDecision => {
    const roleDecision = canDeleteUserByRoleRule({
        actorRole,
        targetRole,
        isSelfDelete,
        activeSuperAdminCount,
    });
    if (!roleDecision.allowed) {
        return roleDecision;
    }

    if (hasAssignedEquipment) {
        return {
            allowed: false,
            reason: 'Suppression impossible: ce compte possède encore des équipements assignés.',
        };
    }

    if (hasActiveApprovals) {
        return {
            allowed: false,
            reason: 'Suppression impossible: des demandes liées à cet utilisateur sont en cours.',
        };
    }

    return { allowed: true };
};

export const getEquipmentUpdatesForReturnWorkflow = ({
    phase,
    condition,
    actorId,
    nowISO,
}: ReturnWorkflowContext): Partial<Equipment> => {
    if (phase === 'initiation') {
        return {
            status: 'En attente',
            assignmentStatus: 'PENDING_RETURN',
            returnRequestedAt: nowISO,
            returnRequestedBy: actorId,
        };
    }

    const resolvedCondition = condition || 'Bon';
    const finalStatus = RETURN_STATUS_BY_CONDITION[resolvedCondition];
    const isRepairFlow = finalStatus === 'En réparation';

    return {
        status: finalStatus,
        assignmentStatus: 'NONE',
        user: null,
        assignedBy: undefined,
        assignedAt: undefined,
        assignedByName: undefined,
        managerValidationBy: undefined,
        managerValidationAt: undefined,
        confirmedBy: undefined,
        confirmedAt: undefined,
        reservedFor: undefined,
        reservedAt: undefined,
        returnInspectedAt: nowISO,
        lastReturnCondition: resolvedCondition,
        repairStartDate: isRepairFlow ? nowISO : undefined,
    };
};

