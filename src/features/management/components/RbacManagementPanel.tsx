import React, { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import Badge from '../../../components/ui/Badge';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageTabs, TabItem } from '../../../components/ui/PageTabs';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import {
    AuthMethod,
    PermissionKey,
    PermissionRule,
    RbacRole,
    ScopeConstraint,
    WorkflowDefinition,
    WorkflowStepDefinition,
} from '../../../types/rbac';
import { RBAC_PERMISSIONS } from '../../../config/rbacDefaults';

const copyScope = (scope: ScopeConstraint): ScopeConstraint => ({
    ...scope,
    countries: scope.countries ? [...scope.countries] : undefined,
    sites: scope.sites ? [...scope.sites] : undefined,
    services: scope.services ? [...scope.services] : undefined,
    userIds: scope.userIds ? [...scope.userIds] : undefined,
});

const cloneRoleFromTemplate = (template: RbacRole, name: string): RbacRole => ({
    id: `role.custom.${Date.now()}`,
    name,
    kind: 'custom',
    baseRoleId: template.id,
    permissions: template.permissions.map((permission) => ({ ...permission })),
    authPolicy: {
        ...template.authPolicy,
        requiredMethods: [...template.authPolicy.requiredMethods],
    },
    dataScopes: (template.dataScopes || []).map(copyScope),
});

const toggleInArray = (values: string[], id: string, checked: boolean): string[] => {
    if (checked) {
        if (values.includes(id)) return values;
        return [...values, id];
    }
    return values.filter((entry) => entry !== id);
};

const TIMEOUT_POLICY_OPTIONS = [
    { id: 'remind', label: 'Relance' },
    { id: 'escalate', label: 'Escalade' },
    { id: 'auto_approve', label: 'Validation auto' },
    { id: 'auto_reject', label: 'Rejet auto' },
] as const;

const VIEW_PERMISSION_KEYS = Object.values(RBAC_PERMISSIONS.views) as PermissionKey[];
const ACTION_PERMISSION_KEYS = Object.values(RBAC_PERMISSIONS.actions) as PermissionKey[];
export type RbacSection = 'roles' | 'permissions' | 'workflows' | 'assignments';
type WorkflowConfigStep = 'select' | 'approvers' | 'sla' | 'review';

const WORKFLOW_CONFIG_STEPS: Array<{ id: WorkflowConfigStep; label: string; hint: string }> = [
    { id: 'select', label: 'Workflow', hint: 'Sélection et contexte' },
    { id: 'approvers', label: 'Étapes', hint: 'Validateurs et ordre' },
    { id: 'sla', label: 'SLA', hint: 'Délais et escalade' },
    { id: 'review', label: 'Validation', hint: 'Résumé et sauvegarde' },
];

interface RbacManagementPanelProps {
    section?: RbacSection;
    onSectionChange?: (section: RbacSection) => void;
}

const PERMISSION_LABELS: Record<PermissionKey, string> = {
    'view.dashboard': 'Tableau de bord',
    'view.inventory': 'Inventaire',
    'view.finance': 'Finances',
    'view.approvals': 'Approbations',
    'view.audit': 'Audit',
    'view.reports': 'Rapports',
    'view.management': 'Gestion',
    'view.locations': 'Emplacements',
    'view.settings': 'Parametres',
    'view.users': 'Utilisateurs',
    'action.inventory.manage': 'Gerer inventaire',
    'action.inventory.import': 'Importer inventaire',
    'action.inventory.export': 'Exporter inventaire',
    'action.finance.manage': 'Gerer finances',
    'action.finance.import': 'Importer finances',
    'action.finance.export': 'Exporter finances',
    'action.users.manage': 'Gerer utilisateurs',
    'action.approvals.manage': 'Gerer approbations',
    'action.audit.manage': 'Gerer audit',
    'action.audit.scan': 'Scanner audit',
    'action.reports.view': 'Consulter rapports',
    'action.reports.export': 'Exporter rapports',
    'action.management.manage': 'Gerer configuration',
    'action.locations.manage': 'Gerer emplacements',
    'action.settings.manage': 'Gerer parametres',
};

const AUTH_METHOD_OPTIONS: Array<{ id: AuthMethod; label: string }> = [
    { id: 'password', label: 'Mot de passe' },
    { id: '2fa', label: '2FA' },
    { id: 'pin', label: 'PIN' },
    { id: 'sso', label: 'SSO' },
    { id: 'otp', label: 'OTP' },
    { id: 'biometric', label: 'Biometrie' },
];

const isPermissionAllowed = (permissions: PermissionRule[], key: PermissionKey): boolean => {
    return permissions.some((entry) => entry.key === key && entry.effect === 'allow' && (entry.access || 'read') !== 'none');
};

const updatePermissionAllow = (
    permissions: PermissionRule[],
    key: PermissionKey,
    checked: boolean,
): PermissionRule[] => {
    if (checked) {
        const existingIndex = permissions.findIndex((entry) => entry.key === key);
        if (existingIndex >= 0) {
            const next = [...permissions];
            next[existingIndex] = { ...next[existingIndex], effect: 'allow', access: 'read' };
            return next;
        }
        return [...permissions, { key, effect: 'allow', access: 'read' }];
    }

    return permissions.filter((entry) => entry.key !== key);
};

const copyWorkflowStep = (step: WorkflowStepDefinition): WorkflowStepDefinition => ({
    ...step,
    timeout: {
        ...step.timeout,
    },
    conditions: step.conditions
        ? step.conditions.map((condition) => ({
            ...condition,
            value: Array.isArray(condition.value) ? [...condition.value] : condition.value,
        }))
        : undefined,
});

const cloneWorkflowFromTemplate = (template: WorkflowDefinition, name: string): WorkflowDefinition => ({
    id: `workflow.custom.${Date.now()}`,
    name,
    enabled: true,
    steps: (template.steps || []).map(copyWorkflowStep),
});

const buildNewWorkflowStep = (index: number, defaultRoleId?: string): WorkflowStepDefinition => ({
    id: `step_${Date.now()}_${index}`,
    label: `Etape ${index + 1}`,
    approverType: 'role',
    approverId: defaultRoleId || '',
    required: true,
    timeout: {
        slaHours: 24,
        onTimeout: 'remind',
    },
});

const getTimeoutPolicyLabel = (value: WorkflowStepDefinition['timeout']['onTimeout']): string => {
    if (value === 'remind') return 'Relance';
    if (value === 'escalate') return 'Escalade';
    if (value === 'auto_approve') return 'Validation automatique';
    return 'Rejet automatique';
};

const getConditionSummary = (step: WorkflowStepDefinition): string => {
    if (!step.conditions || step.conditions.length === 0) {
        return 'Toujours active';
    }

    const firstCondition = step.conditions[0];
    const rawValue = Array.isArray(firstCondition.value)
        ? firstCondition.value.join(', ')
        : String(firstCondition.value);
    const suffix = step.conditions.length > 1 ? ` (+${step.conditions.length - 1})` : '';
    return `${firstCondition.field} ${firstCondition.operator} ${rawValue}${suffix}`;
};

const formatSlaLabel = (hours: number): string => {
    if (!Number.isFinite(hours) || hours <= 0) return '-';
    if (hours % 24 === 0) {
        const days = hours / 24;
        return `${days} j`;
    }
    return `${hours} h`;
};

const RbacManagementPanel: React.FC<RbacManagementPanelProps> = ({
    section,
    onSectionChange,
}) => {
    const {
        users,
        rbacRoles,
        rbacGroups,
        rbacAssignments,
        rbacWorkflows,
        getRbacAssignmentForUser,
        getEffectiveAccessForUser,
        upsertRbacRole,
        deleteRbacRole,
        upsertRbacGroup,
        deleteRbacGroup,
        upsertRbacWorkflow,
        deleteRbacWorkflow,
        upsertUserRbacAssignment,
    } = useData();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const canManageConfig = currentUser?.role === 'SuperAdmin';
    const canManageAssignments = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin';

    const [roleName, setRoleName] = useState('');
    const [roleTemplateId, setRoleTemplateId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupRoleIds, setGroupRoleIds] = useState<string[]>([]);
    const [assignmentUserId, setAssignmentUserId] = useState('');
    const [assignmentRoleIds, setAssignmentRoleIds] = useState<string[]>([]);
    const [assignmentGroupIds, setAssignmentGroupIds] = useState<string[]>([]);
    const [editingRoleId, setEditingRoleId] = useState('');
    const [draftPermissions, setDraftPermissions] = useState<PermissionRule[]>([]);
    const [draftRequiredMethods, setDraftRequiredMethods] = useState<AuthMethod[]>(['password']);
    const [draftSessionMaxMinutes, setDraftSessionMaxMinutes] = useState(480);
    const [draftStepUpValidation, setDraftStepUpValidation] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [workflowTemplateId, setWorkflowTemplateId] = useState('');
    const [editingWorkflowId, setEditingWorkflowId] = useState('');
    const [draftWorkflowName, setDraftWorkflowName] = useState('');
    const [draftWorkflowEnabled, setDraftWorkflowEnabled] = useState(true);
    const [draftWorkflowSteps, setDraftWorkflowSteps] = useState<WorkflowStepDefinition[]>([]);
    const [workflowEditorMode, setWorkflowEditorMode] = useState<'simple' | 'advanced'>('simple');
    const [workflowConfigStep, setWorkflowConfigStep] = useState<WorkflowConfigStep>('select');
    const [activeSection, setActiveSection] = useState<RbacSection>(section || 'roles');

    const sortedUsers = useMemo(
        () => [...users].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        [users],
    );
    const sortedRoles = useMemo(
        () => [...rbacRoles].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        [rbacRoles],
    );
    const sortedGroups = useMemo(
        () => [...rbacGroups].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        [rbacGroups],
    );
    const sortedWorkflows = useMemo(
        () => [...rbacWorkflows].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
        [rbacWorkflows],
    );
    const roleNameById = useMemo(
        () => new Map(sortedRoles.map((role) => [role.id, role.name])),
        [sortedRoles],
    );
    const groupNameById = useMemo(
        () => new Map(sortedGroups.map((group) => [group.id, group.name])),
        [sortedGroups],
    );

    useEffect(() => {
        if (!roleTemplateId && sortedRoles.length > 0) {
            setRoleTemplateId(sortedRoles[0].id);
        }
    }, [roleTemplateId, sortedRoles]);

    useEffect(() => {
        if (!workflowTemplateId && sortedWorkflows.length > 0) {
            setWorkflowTemplateId(sortedWorkflows[0].id);
        }
    }, [workflowTemplateId, sortedWorkflows]);

    useEffect(() => {
        if (editingRoleId || sortedRoles.length === 0) return;
        const preferredRole = sortedRoles.find((role) => role.kind === 'custom') || sortedRoles[0];
        setEditingRoleId(preferredRole.id);
    }, [editingRoleId, sortedRoles]);

    useEffect(() => {
        if (editingWorkflowId || sortedWorkflows.length === 0) return;
        setEditingWorkflowId(sortedWorkflows[0].id);
    }, [editingWorkflowId, sortedWorkflows]);

    useEffect(() => {
        if (!assignmentUserId && sortedUsers.length > 0) {
            setAssignmentUserId(sortedUsers[0].id);
        }
    }, [assignmentUserId, sortedUsers]);

    useEffect(() => {
        if (!assignmentUserId) return;
        const assignment = getRbacAssignmentForUser(assignmentUserId);
        const userRecord = users.find((entry) => entry.id === assignmentUserId);
        setAssignmentRoleIds(assignment?.roleIds || userRecord?.rbacRoleIds || []);
        setAssignmentGroupIds(assignment?.groupIds || userRecord?.rbacGroupIds || []);
    }, [assignmentUserId, getRbacAssignmentForUser, rbacAssignments, users]);

    const editingRole = useMemo(
        () => sortedRoles.find((role) => role.id === editingRoleId) || null,
        [editingRoleId, sortedRoles],
    );
    const editingWorkflow = useMemo(
        () => sortedWorkflows.find((workflow) => workflow.id === editingWorkflowId) || null,
        [editingWorkflowId, sortedWorkflows],
    );

    useEffect(() => {
        if (!editingRole) return;
        setDraftPermissions(editingRole.permissions || []);
        setDraftRequiredMethods(
            editingRole.authPolicy.requiredMethods.length > 0
                ? [...editingRole.authPolicy.requiredMethods]
                : ['password'],
        );
        setDraftSessionMaxMinutes(editingRole.authPolicy.sessionMaxMinutes || 480);
        setDraftStepUpValidation(Boolean(editingRole.authPolicy.requireStepUpForSensitiveActions));
    }, [editingRole]);

    useEffect(() => {
        if (!editingWorkflow) return;
        setDraftWorkflowName(editingWorkflow.name);
        setDraftWorkflowEnabled(editingWorkflow.enabled !== false);
        setDraftWorkflowSteps((editingWorkflow.steps || []).map(copyWorkflowStep));
    }, [editingWorkflow]);

    useEffect(() => {
        setWorkflowConfigStep('select');
    }, [editingWorkflowId]);

    const effectiveProfile = useMemo(() => {
        if (!assignmentUserId) return null;
        return getEffectiveAccessForUser(assignmentUserId);
    }, [assignmentUserId, getEffectiveAccessForUser]);

    const roleNameIndex = useMemo(() => {
        return new Set(sortedRoles.map((role) => role.name.trim().toLowerCase()));
    }, [sortedRoles]);

    const canEditSelectedRole = canManageConfig && editingRole?.kind === 'custom';

    const onCreateRole = () => {
        if (!canManageConfig) {
            showToast('Seul un SuperAdmin peut créer des rôles.', 'error');
            return;
        }

        const trimmedName = roleName.trim();
        if (!trimmedName) {
            showToast('Le nom du rôle est requis.', 'warning');
            return;
        }
        if (roleNameIndex.has(trimmedName.toLowerCase())) {
            showToast('Un rôle avec ce nom existe déjà.', 'warning');
            return;
        }

        const template = sortedRoles.find((entry) => entry.id === roleTemplateId);
        if (!template) {
            showToast('Rôle modèle introuvable.', 'error');
            return;
        }

        const decision = upsertRbacRole(cloneRoleFromTemplate(template, trimmedName));
        if (!decision.allowed) {
            showToast(decision.reason || 'Impossible de créer ce rôle.', 'error');
            return;
        }

        showToast(`Rôle "${trimmedName}" créé.`, 'success');
        setRoleName('');
    };

    const onDeleteRole = (role: RbacRole) => {
        requestConfirmation({
            title: 'Supprimer le rôle',
            message: `Confirmer la suppression du rôle "${role.name}" ?`,
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => {
                const decision = deleteRbacRole(role.id);
                if (!decision.allowed) {
                    showToast(decision.reason || 'Suppression refusée.', 'error');
                    return;
                }
                showToast(`Rôle "${role.name}" supprimé.`, 'success');
            },
        });
    };

    const onSaveRoleConfiguration = () => {
        if (!editingRole) {
            showToast('Aucun role selectionne.', 'warning');
            return;
        }
        if (!canManageConfig) {
            showToast('Seul un SuperAdmin peut modifier un role.', 'error');
            return;
        }
        if (editingRole.kind !== 'custom') {
            showToast('Les roles systeme sont en lecture seule.', 'warning');
            return;
        }

        const uniqueMethods = Array.from(new Set(draftRequiredMethods));
        const nextMethods = (uniqueMethods.length > 0 ? uniqueMethods : ['password']) as AuthMethod[];
        const normalizedSessionMinutes = Math.min(1440, Math.max(15, Math.round(draftSessionMaxMinutes || 480)));

        const decision = upsertRbacRole({
            ...editingRole,
            permissions: draftPermissions,
            authPolicy: {
                ...editingRole.authPolicy,
                requiredMethods: nextMethods,
                sessionMaxMinutes: normalizedSessionMinutes,
                requireStepUpForSensitiveActions: draftStepUpValidation,
            },
        });

        if (!decision.allowed) {
            showToast(decision.reason || 'Mise a jour du role refusee.', 'error');
            return;
        }

        showToast(`Role "${editingRole.name}" mis a jour.`, 'success');
    };

    const onCreateGroup = () => {
        if (!canManageConfig) {
            showToast('Seul un SuperAdmin peut créer des groupes.', 'error');
            return;
        }

        const trimmedName = groupName.trim();
        if (!trimmedName) {
            showToast('Le nom du groupe est requis.', 'warning');
            return;
        }
        if (groupRoleIds.length === 0) {
            showToast('Sélectionnez au moins un rôle pour ce groupe.', 'warning');
            return;
        }

        const decision = upsertRbacGroup({
            id: `group.custom.${Date.now()}`,
            name: trimmedName,
            roleIds: groupRoleIds,
        });

        if (!decision.allowed) {
            showToast(decision.reason || 'Impossible de créer ce groupe.', 'error');
            return;
        }

        showToast(`Groupe "${trimmedName}" créé.`, 'success');
        setGroupName('');
        setGroupRoleIds([]);
    };

    const onCreateWorkflow = () => {
        if (!canManageConfig) {
            showToast('Seul un SuperAdmin peut creer des workflows.', 'error');
            return;
        }

        const trimmedName = workflowName.trim();
        if (!trimmedName) {
            showToast('Le nom du workflow est requis.', 'warning');
            return;
        }

        const duplicate = sortedWorkflows.some((workflow) => workflow.name.trim().toLowerCase() === trimmedName.toLowerCase());
        if (duplicate) {
            showToast('Un workflow avec ce nom existe deja.', 'warning');
            return;
        }

        const template = sortedWorkflows.find((entry) => entry.id === workflowTemplateId);
        if (!template) {
            showToast('Workflow modele introuvable.', 'error');
            return;
        }

        const nextWorkflow = cloneWorkflowFromTemplate(template, trimmedName);
        const decision = upsertRbacWorkflow(nextWorkflow);
        if (!decision.allowed) {
            showToast(decision.reason || 'Creation du workflow refusee.', 'error');
            return;
        }

        setWorkflowName('');
        setEditingWorkflowId(nextWorkflow.id);
        showToast(`Workflow "${trimmedName}" cree.`, 'success');
    };

    const onDeleteWorkflow = (workflow: WorkflowDefinition) => {
        requestConfirmation({
            title: 'Supprimer le workflow',
            message: `Confirmer la suppression de "${workflow.name}" ?`,
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => {
                const decision = deleteRbacWorkflow(workflow.id);
                if (!decision.allowed) {
                    showToast(decision.reason || 'Suppression refusee.', 'error');
                    return;
                }

                const remaining = sortedWorkflows.filter((entry) => entry.id !== workflow.id);
                setEditingWorkflowId(remaining[0]?.id || '');
                showToast(`Workflow "${workflow.name}" supprime.`, 'success');
            },
        });
    };

    const onAddWorkflowStep = () => {
        const defaultRoleId = sortedRoles[0]?.id;
        setDraftWorkflowSteps((prev) => [...prev, buildNewWorkflowStep(prev.length, defaultRoleId)]);
    };

    const updateWorkflowStep = (
        stepId: string,
        updater: (step: WorkflowStepDefinition) => WorkflowStepDefinition,
    ) => {
        setDraftWorkflowSteps((prev) => prev.map((step) => (step.id === stepId ? updater(step) : step)));
    };

    const onMoveWorkflowStep = (index: number, direction: 'up' | 'down') => {
        setDraftWorkflowSteps((prev) => {
            const nextIndex = direction === 'up' ? index - 1 : index + 1;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.splice(nextIndex, 0, item);
            return next;
        });
    };

    const onRemoveWorkflowStep = (stepId: string) => {
        if (draftWorkflowSteps.length <= 1) {
            showToast('Le workflow doit contenir au moins une etape.', 'warning');
            return;
        }
        setDraftWorkflowSteps((prev) => prev.filter((step) => step.id !== stepId));
    };

    const onSaveWorkflowConfiguration = () => {
        if (!editingWorkflow) {
            showToast('Aucun workflow selectionne.', 'warning');
            return;
        }
        if (!canManageConfig) {
            showToast('Seul un SuperAdmin peut modifier les workflows.', 'error');
            return;
        }

        const trimmedName = draftWorkflowName.trim();
        if (!trimmedName) {
            showToast('Le nom du workflow est requis.', 'warning');
            return;
        }
        if (draftWorkflowSteps.length === 0) {
            showToast('Ajoutez au moins une etape.', 'warning');
            return;
        }

        const missingApprover = draftWorkflowSteps.find((step) => !step.approverId);
        if (missingApprover) {
            showToast(`Etape sans validateur: "${missingApprover.label}".`, 'warning');
            return;
        }

        const normalizedSteps = draftWorkflowSteps.map((step, index) => ({
            ...step,
            id: step.id?.trim() || `step_${Date.now()}_${index}`,
            label: step.label?.trim() || `Etape ${index + 1}`,
            timeout: {
                ...step.timeout,
                slaHours: Math.max(1, Math.round(step.timeout.slaHours || 1)),
                escalationTargetRoleId:
                    step.timeout.onTimeout === 'escalate'
                        ? (step.timeout.escalationTargetRoleId || sortedRoles[0]?.id || '')
                        : undefined,
            },
        }));

        const decision = upsertRbacWorkflow({
            ...editingWorkflow,
            id: editingWorkflow.id,
            name: trimmedName,
            enabled: draftWorkflowEnabled,
            steps: normalizedSteps,
        });

        if (!decision.allowed) {
            showToast(decision.reason || 'Mise a jour du workflow refusee.', 'error');
            return;
        }

        showToast(`Workflow "${trimmedName}" mis a jour.`, 'success');
    };

    const onDeleteGroup = (groupId: string, groupNameValue: string) => {
        requestConfirmation({
            title: 'Supprimer le groupe',
            message: `Confirmer la suppression du groupe "${groupNameValue}" ?`,
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => {
                const decision = deleteRbacGroup(groupId);
                if (!decision.allowed) {
                    showToast(decision.reason || 'Suppression refusée.', 'error');
                    return;
                }
                showToast(`Groupe "${groupNameValue}" supprimé.`, 'success');
            },
        });
    };

    const onSaveAssignment = () => {
        if (!canManageAssignments) {
            showToast('Permissions insuffisantes pour modifier les affectations.', 'error');
            return;
        }
        if (!assignmentUserId) {
            showToast('Sélectionnez un utilisateur.', 'warning');
            return;
        }

        const decision = upsertUserRbacAssignment(assignmentUserId, {
            roleIds: assignmentRoleIds,
            groupIds: assignmentGroupIds,
        });

        if (!decision.allowed) {
            showToast(decision.reason || "Impossible d'enregistrer l'affectation.", 'error');
            return;
        }

        showToast('Affectation RBAC mise à jour.', 'success');
    };

    useEffect(() => {
        if (!section) return;
        if (section !== activeSection) {
            setActiveSection(section);
        }
    }, [section, activeSection]);

    const sectionTabs: TabItem[] = [
        {
            id: 'roles',
            label: 'Rôles & groupes',
            icon: <MaterialIcon name="admin_panel_settings" size={18} />,
        },
        {
            id: 'permissions',
            label: 'Permissions',
            icon: <MaterialIcon name="rule" size={18} />,
        },
        {
            id: 'workflows',
            label: 'Workflows',
            icon: <MaterialIcon name="timeline" size={18} />,
        },
        {
            id: 'assignments',
            label: 'Affectations',
            icon: <MaterialIcon name="supervisor_account" size={18} />,
        },
    ];

    const handleSectionChange = (id: string) => {
        if (id === 'roles' || id === 'permissions' || id === 'workflows' || id === 'assignments') {
            setActiveSection(id);
            onSectionChange?.(id);
        }
    };

    const getApproverLabel = (step: WorkflowStepDefinition): string => {
        if (step.approverType === 'role') {
            return roleNameById.get(step.approverId) || 'Role non defini';
        }
        return groupNameById.get(step.approverId) || 'Groupe non defini';
    };

    const workflowConfigStepIndex = Math.max(
        0,
        WORKFLOW_CONFIG_STEPS.findIndex((entry) => entry.id === workflowConfigStep),
    );
    const canGoWorkflowBack = workflowConfigStepIndex > 0;
    const canGoWorkflowNext = workflowConfigStepIndex < WORKFLOW_CONFIG_STEPS.length - 1;
    const goToPreviousWorkflowStep = () => {
        if (!canGoWorkflowBack) return;
        setWorkflowConfigStep(WORKFLOW_CONFIG_STEPS[workflowConfigStepIndex - 1].id);
    };
    const goToNextWorkflowStep = () => {
        if (!canGoWorkflowNext) return;
        setWorkflowConfigStep(WORKFLOW_CONFIG_STEPS[workflowConfigStepIndex + 1].id);
    };

    return (
        <div className="space-y-6">
            {/* Rangées denses sur compact, cartes dès medium (X9) */}
            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-5 gap-2 medium:gap-3">
                {[
                    { label: 'Rôles', value: sortedRoles.length },
                    { label: 'Groupes', value: sortedGroups.length },
                    { label: 'Affectations', value: rbacAssignments.length },
                    { label: 'Workflows', value: rbacWorkflows.length },
                    { label: 'Conflits (utilisateur)', value: effectiveProfile?.conflicts.length || 0 },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-card border border-outline-variant bg-surface p-3 medium:p-4 flex items-center justify-between gap-3 medium:block"
                    >
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">{stat.label}</p>
                        <p className="text-headline-small text-on-surface medium:mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <PageTabs
                items={sectionTabs}
                activeId={activeSection}
                onChange={handleSectionChange}
            />

            {activeSection === 'roles' && (
                <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                <div className="rounded-card border border-outline-variant bg-surface p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-title-medium text-on-surface">Rôles</h3>
                        {!canManageConfig && <Badge variant="neutral">Lecture seule</Badge>}
                    </div>

                    <div className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                        <InputField
                            label="Nom du rôle"
                            value={roleName}
                            onChange={(event) => setRoleName(event.target.value)}
                            placeholder="Ex: Responsable conformité"
                            className="medium:col-span-2"
                            disabled={!canManageConfig}
                        />
                        <SelectField
                            label="Rôle modèle"
                            name="roleTemplateId"
                            value={roleTemplateId}
                            onChange={(event) => setRoleTemplateId(event.target.value)}
                            disabled={!canManageConfig}
                            options={sortedRoles.map((role) => ({ value: role.id, label: role.name }))}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="filled"
                            icon={<MaterialIcon name="add" size={18} />}
                            onClick={onCreateRole}
                            disabled={!canManageConfig}
                        >
                            Nouveau rôle
                        </Button>
                    </div>

                    <div className="rounded-card border border-outline-variant overflow-hidden">
                        {sortedRoles.length > 0 ? (
                            sortedRoles.map((role, index) => (
                                <div
                                    key={role.id}
                                    className={`flex items-center gap-3 px-4 py-3 ${index < sortedRoles.length - 1 ? 'border-b border-outline-variant' : ''}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-body-large text-on-surface truncate">{role.name}</p>
                                        <p className="text-label-small text-on-surface-variant truncate">{role.id}</p>
                                    </div>
                                    <Badge variant={role.kind === 'system' ? 'info' : 'warning'}>
                                        {role.kind === 'system' ? 'Système' : 'Personnalisé'}
                                    </Badge>
                                    <Badge variant="neutral">{role.permissions.length} permissions</Badge>
                                    {canManageConfig && role.kind === 'custom' && (
                                        <IconButton
                                            icon="delete"
                                            aria-label={`Supprimer ${role.name}`}
                                            variant="standard"
                                            className="text-error"
                                            onClick={() => onDeleteRole(role)}
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-6">
                                <EmptyState
                                    icon="admin_panel_settings"
                                    title="Aucun rôle"
                                    description="Créez votre premier rôle personnalisé."
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-card border border-outline-variant bg-surface p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-title-medium text-on-surface">Groupes</h3>
                        {!canManageConfig && <Badge variant="neutral">Lecture seule</Badge>}
                    </div>

                    <InputField
                        label="Nom du groupe"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder="Ex: Support Sénégal"
                        disabled={!canManageConfig}
                    />

                    <div>
                        <p className="text-body-small text-on-surface-variant mb-2">Rôles du groupe</p>
                        <div className="rounded-card border border-outline-variant p-3 max-h-40 overflow-y-auto space-y-2">
                            {sortedRoles.map((role) => (
                                <label key={role.id} className="flex items-center gap-2 text-body-small text-on-surface">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                        checked={groupRoleIds.includes(role.id)}
                                        onChange={(event) => setGroupRoleIds((prev) => toggleInArray(prev, role.id, event.target.checked))}
                                        disabled={!canManageConfig}
                                    />
                                    <span>{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="filled"
                            icon={<MaterialIcon name="group_add" size={18} />}
                            onClick={onCreateGroup}
                            disabled={!canManageConfig}
                        >
                            Nouveau groupe
                        </Button>
                    </div>

                    <div className="rounded-card border border-outline-variant overflow-hidden">
                        {sortedGroups.length > 0 ? (
                            sortedGroups.map((group, index) => (
                                <div
                                    key={group.id}
                                    className={`flex items-center gap-3 px-4 py-3 ${index < sortedGroups.length - 1 ? 'border-b border-outline-variant' : ''}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-body-large text-on-surface truncate">{group.name}</p>
                                        <p className="text-label-small text-on-surface-variant truncate">
                                            {group.roleIds.length} rôle(s)
                                        </p>
                                    </div>
                                    {canManageConfig && (
                                        <IconButton
                                            icon="delete"
                                            aria-label={`Supprimer ${group.name}`}
                                            variant="standard"
                                            className="text-error"
                                            onClick={() => onDeleteGroup(group.id, group.name)}
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-6">
                                <EmptyState
                                    icon="groups"
                                    title="Aucun groupe"
                                    description="Créez des groupes pour simplifier les affectations."
                                />
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}

            {activeSection === 'permissions' && (
                <div className="rounded-card border border-outline-variant bg-surface p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-title-medium text-on-surface">Edition des permissions</h3>
                    {!canManageConfig && <Badge variant="neutral">Lecture seule</Badge>}
                </div>

                <SelectField
                    label="Role a modifier"
                    name="editingRoleId"
                    value={editingRoleId}
                    onChange={(event) => setEditingRoleId(event.target.value)}
                    options={sortedRoles.map((role) => ({
                        value: role.id,
                        label: `${role.name} (${role.kind === 'system' ? 'Systeme' : 'Personnalise'})`,
                    }))}
                />

                {editingRole ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={editingRole.kind === 'system' ? 'info' : 'warning'}>
                                {editingRole.kind === 'system' ? 'Role systeme' : 'Role personnalise'}
                            </Badge>
                            <Badge variant="neutral">{draftPermissions.length} regles</Badge>
                            <Badge variant="neutral">{draftRequiredMethods.length} methode(s) auth</Badge>
                        </div>

                        {editingRole.kind === 'system' && (
                            <div className="rounded-sm border border-outline-variant bg-surface-container px-3 py-2 text-body-small text-on-surface-variant">
                                Ce role est systeme et ne peut pas etre modifie directement.
                                Dupliquez-le pour creer une variante personnalisable.
                            </div>
                        )}

                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4">
                            <div>
                                <p className="text-body-small text-on-surface-variant mb-2">Vues accessibles</p>
                                <div className="rounded-card border border-outline-variant p-3 space-y-2 max-h-64 overflow-y-auto">
                                    {VIEW_PERMISSION_KEYS.map((permissionKey) => (
                                        <label key={permissionKey} className="flex items-center gap-2 text-body-small text-on-surface">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                                checked={isPermissionAllowed(draftPermissions, permissionKey)}
                                                onChange={(event) => setDraftPermissions((prev) => updatePermissionAllow(prev, permissionKey, event.target.checked))}
                                                disabled={!canEditSelectedRole}
                                            />
                                            <span>{PERMISSION_LABELS[permissionKey]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-body-small text-on-surface-variant mb-2">Actions metier</p>
                                <div className="rounded-card border border-outline-variant p-3 space-y-2 max-h-64 overflow-y-auto">
                                    {ACTION_PERMISSION_KEYS.map((permissionKey) => (
                                        <label key={permissionKey} className="flex items-center gap-2 text-body-small text-on-surface">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                                checked={isPermissionAllowed(draftPermissions, permissionKey)}
                                                onChange={(event) => setDraftPermissions((prev) => updatePermissionAllow(prev, permissionKey, event.target.checked))}
                                                disabled={!canEditSelectedRole}
                                            />
                                            <span>{PERMISSION_LABELS[permissionKey]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 medium:grid-cols-3 gap-4">
                            <div className="medium:col-span-2">
                                <p className="text-body-small text-on-surface-variant mb-2">Methodes d'authentification</p>
                                <div className="rounded-card border border-outline-variant p-3 grid grid-cols-1 medium:grid-cols-2 gap-2">
                                    {AUTH_METHOD_OPTIONS.map((option) => (
                                        <label key={option.id} className="flex items-center gap-2 text-body-small text-on-surface">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                                checked={draftRequiredMethods.includes(option.id)}
                                                onChange={(event) => {
                                                    setDraftRequiredMethods((prev) => {
                                                        const next = toggleInArray(prev, option.id, event.target.checked) as AuthMethod[];
                                                        return next.length > 0 ? next : ['password'];
                                                    });
                                                }}
                                                disabled={!canEditSelectedRole}
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <InputField
                                    label="Duree session (min)"
                                    type="number"
                                    min={15}
                                    max={1440}
                                    value={draftSessionMaxMinutes}
                                    onChange={(event) => setDraftSessionMaxMinutes(Number(event.target.value))}
                                    disabled={!canEditSelectedRole}
                                />
                                <label className="flex items-center gap-2 text-body-small text-on-surface">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                        checked={draftStepUpValidation}
                                        onChange={(event) => setDraftStepUpValidation(event.target.checked)}
                                        disabled={!canEditSelectedRole}
                                    />
                                    <span>Step-up requis pour actions sensibles</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="save" size={18} />}
                                onClick={onSaveRoleConfiguration}
                                disabled={!canEditSelectedRole}
                            >
                                Enregistrer le role
                            </Button>
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon="admin_panel_settings"
                        title="Aucun role selectionne"
                        description="Selectionnez un role pour consulter et modifier ses permissions."
                    />
                )}
                </div>
            )}

            {activeSection === 'workflows' && (
                <div className="rounded-card border border-outline-variant bg-surface p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-title-medium text-on-surface">Workflows d'approbation</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-sm border border-outline-variant bg-surface-container-low p-1">
                                <Button
                                    size="sm"
                                    variant={workflowEditorMode === 'simple' ? 'filled' : 'text'}
                                    onClick={() => setWorkflowEditorMode('simple')}
                                >
                                    Simple
                                </Button>
                                <Button
                                    size="sm"
                                    variant={workflowEditorMode === 'advanced' ? 'filled' : 'text'}
                                    onClick={() => setWorkflowEditorMode('advanced')}
                                >
                                    Avance
                                </Button>
                            </div>
                            {!canManageConfig && <Badge variant="neutral">Lecture seule</Badge>}
                        </div>
                    </div>

                    <p className="text-body-small text-on-surface-variant">
                        {workflowEditorMode === 'simple'
                            ? "Mode simple: focus sur validateur, delai, action en retard."
                            : "Mode avance: reglage complet (type de validateur, escalade, logique conditionnelle)."}
                    </p>

                    <div className="rounded-sm border border-outline-variant bg-surface-container-low p-3 space-y-3">
                        <p className="text-label-medium text-on-surface">Parcours guidé</p>
                        <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-4 gap-2">
                            {WORKFLOW_CONFIG_STEPS.map((step, index) => (
                                <Button
                                    key={step.id}
                                    variant={workflowConfigStep === step.id ? 'filled' : 'outlined'}
                                    size="sm"
                                    onClick={() => setWorkflowConfigStep(step.id)}
                                    className="!justify-start !h-auto !rounded-sm !px-3 !py-2"
                                >
                                    <span className="font-semibold">{index + 1}.</span> {step.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-2">
                            <p className="text-body-small text-on-surface-variant">
                                Étape active: <span className="font-semibold text-on-surface">{WORKFLOW_CONFIG_STEPS[workflowConfigStepIndex].label}</span> · {WORKFLOW_CONFIG_STEPS[workflowConfigStepIndex].hint}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="text"
                                    size="sm"
                                    icon={<MaterialIcon name="chevron_left" size={16} />}
                                    onClick={goToPreviousWorkflowStep}
                                    disabled={!canGoWorkflowBack}
                                >
                                    Précédent
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="sm"
                                    icon={<MaterialIcon name="chevron_right" size={16} />}
                                    onClick={goToNextWorkflowStep}
                                    disabled={!canGoWorkflowNext}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    </div>

                    {(workflowConfigStep === 'select' || !editingWorkflow) && (
                        <>
                            <div className="grid grid-cols-1 medium:grid-cols-4 gap-3">
                                <InputField
                                    label="Nouveau workflow"
                                    value={workflowName}
                                    onChange={(event) => setWorkflowName(event.target.value)}
                                    placeholder="Ex: Attribution RH"
                                    className="medium:col-span-2"
                                    disabled={!canManageConfig}
                                />
                                <SelectField
                                    label="Workflow modele"
                                    name="workflowTemplateId"
                                    value={workflowTemplateId}
                                    onChange={(event) => setWorkflowTemplateId(event.target.value)}
                                    disabled={!canManageConfig}
                                    options={sortedWorkflows.map((workflow) => ({ value: workflow.id, label: workflow.name }))}
                                />
                                <div className="flex items-end">
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="add" size={18} />}
                                        onClick={onCreateWorkflow}
                                        disabled={!canManageConfig}
                                        className="w-full"
                                    >
                                        Creer
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 medium:grid-cols-[1fr_auto] gap-3">
                                <SelectField
                                    label="Workflow a modifier"
                                    name="editingWorkflowId"
                                    value={editingWorkflowId}
                                    onChange={(event) => setEditingWorkflowId(event.target.value)}
                                    options={sortedWorkflows.map((workflow) => ({ value: workflow.id, label: workflow.name }))}
                                />
                                <div className="flex items-end">
                                    <Button
                                        variant="danger"
                                        icon={<MaterialIcon name="delete" size={18} />}
                                        onClick={() => editingWorkflow && onDeleteWorkflow(editingWorkflow)}
                                        disabled={!canManageConfig || !editingWorkflow}
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                {editingWorkflow ? (
                    <>
                        {workflowConfigStep === 'review' && (
                            <div className="rounded-sm border border-outline-variant bg-surface-container-low p-3 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={draftWorkflowEnabled ? 'success' : 'neutral'}>
                                        {draftWorkflowEnabled ? 'Workflow actif' : 'Workflow inactif'}
                                    </Badge>
                                    <Badge variant="neutral">{draftWorkflowSteps.length} etape(s)</Badge>
                                </div>
                                <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Apercu du pipeline</p>
                                <div className="space-y-2">
                                    {draftWorkflowSteps.map((step, index) => (
                                        <div
                                            key={`summary_${step.id}`}
                                            className="rounded-sm border border-outline-variant bg-surface px-3 py-2 flex items-start gap-3"
                                        >
                                            <div className="h-7 w-7 shrink-0 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-small font-semibold">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-body-medium text-on-surface truncate">
                                                    {step.label || `Etape ${index + 1}`}
                                                </p>
                                                <p className="text-label-small text-on-surface-variant truncate">
                                                    {getApproverLabel(step)} • SLA {formatSlaLabel(step.timeout.slaHours)} • {getTimeoutPolicyLabel(step.timeout.onTimeout)}
                                                </p>
                                                {workflowEditorMode === 'advanced' && (
                                                    <p className="text-label-small text-on-surface-variant truncate">
                                                        Condition: {getConditionSummary(step)}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={step.required ? 'info' : 'neutral'}>
                                                {step.required ? 'Obligatoire' : 'Optionnelle'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {workflowConfigStep === 'select' && (
                            <div className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                            <InputField
                                label="Nom du workflow"
                                value={draftWorkflowName}
                                onChange={(event) => setDraftWorkflowName(event.target.value)}
                                disabled={!canManageConfig}
                                className="medium:col-span-2"
                            />
                            <label className="flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container px-3 py-2 text-body-small text-on-surface">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                    checked={draftWorkflowEnabled}
                                    onChange={(event) => setDraftWorkflowEnabled(event.target.checked)}
                                    disabled={!canManageConfig}
                                />
                                <span>Workflow actif</span>
                            </label>
                            </div>
                        )}

                        {(workflowConfigStep === 'approvers' || workflowConfigStep === 'sla') && (
                            <div className="flex items-center justify-between gap-3">
                            <p className="text-body-small text-on-surface-variant">
                                {workflowConfigStep === 'approvers'
                                    ? 'Configurez les étapes, les validateurs et les obligations.'
                                    : 'Réglez les délais SLA et les actions en retard.'}
                            </p>
                            <Button
                                variant="outlined"
                                size="sm"
                                icon={<MaterialIcon name="add" size={16} />}
                                onClick={onAddWorkflowStep}
                                disabled={!canManageConfig}
                            >
                                Ajouter une etape
                            </Button>
                            </div>
                        )}

                        {(workflowConfigStep === 'approvers' || workflowConfigStep === 'sla') && (
                            <div className="space-y-3">
                            {draftWorkflowSteps.map((step, index) => (
                                <div key={step.id} className="rounded-sm border border-outline-variant bg-surface-container-low p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-label-medium text-on-surface">Etape {index + 1}</p>
                                            <p className="text-label-small text-on-surface-variant">
                                                {getApproverLabel(step)} • SLA {formatSlaLabel(step.timeout.slaHours)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <IconButton
                                                icon="arrow_upward"
                                                aria-label={`Monter l'etape ${index + 1}`}
                                                variant="standard"
                                                onClick={() => onMoveWorkflowStep(index, 'up')}
                                                disabled={!canManageConfig || index === 0}
                                            />
                                            <IconButton
                                                icon="arrow_downward"
                                                aria-label={`Descendre l'etape ${index + 1}`}
                                                variant="standard"
                                                onClick={() => onMoveWorkflowStep(index, 'down')}
                                                disabled={!canManageConfig || index === draftWorkflowSteps.length - 1}
                                            />
                                            <IconButton
                                                icon="delete"
                                                aria-label={`Supprimer l'etape ${index + 1}`}
                                                variant="standard"
                                                className="text-error"
                                                onClick={() => onRemoveWorkflowStep(step.id)}
                                                disabled={!canManageConfig}
                                            />
                                        </div>
                                    </div>

                                    {workflowConfigStep === 'approvers' && (
                                        <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-4 gap-3">
                                        <div className="expanded:col-span-2">
                                            <InputField
                                                label="Libelle de l'etape"
                                                value={step.label}
                                                onChange={(event) => updateWorkflowStep(step.id, (current) => ({ ...current, label: event.target.value }))}
                                                disabled={!canManageConfig}
                                            />
                                            <p className="mt-1 text-label-small text-on-surface-variant">
                                                Exemple: Validation manager, Traitement IT, Confirmation utilisateur.
                                            </p>
                                        </div>
                                        {workflowEditorMode === 'advanced' && (
                                            <SelectField
                                                label="Type validateur"
                                                name={`approverType-${step.id}`}
                                                value={step.approverType}
                                                onChange={(event) => {
                                                    const nextType = event.target.value as 'role' | 'group';
                                                    const nextApproverId = nextType === 'role'
                                                        ? (sortedRoles[0]?.id || '')
                                                        : (sortedGroups[0]?.id || '');
                                                    updateWorkflowStep(step.id, (current) => ({
                                                        ...current,
                                                        approverType: nextType,
                                                        approverId: nextApproverId,
                                                    }));
                                                }}
                                                disabled={!canManageConfig}
                                                options={[
                                                    { value: 'role', label: 'Role' },
                                                    { value: 'group', label: 'Groupe' },
                                                ]}
                                            />
                                        )}
                                        <SelectField
                                            label="Validateur"
                                            name={`approverId-${step.id}`}
                                            value={step.approverId}
                                            onChange={(event) => updateWorkflowStep(step.id, (current) => ({ ...current, approverId: event.target.value }))}
                                            disabled={!canManageConfig}
                                            options={(step.approverType === 'role' ? sortedRoles : sortedGroups).map((target) => ({
                                                value: target.id,
                                                label: target.name,
                                            }))}
                                        />
                                        <label className="flex items-center gap-2 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-small text-on-surface">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                                checked={step.required}
                                                onChange={(event) => updateWorkflowStep(step.id, (current) => ({ ...current, required: event.target.checked }))}
                                                disabled={!canManageConfig}
                                            />
                                            <span>Etape obligatoire</span>
                                        </label>
                                        </div>
                                    )}

                                    {workflowConfigStep === 'sla' && (
                                        <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-4 gap-3">
                                        <InputField
                                            label="SLA (heures)"
                                            type="number"
                                            min={1}
                                            value={step.timeout.slaHours}
                                            onChange={(event) => updateWorkflowStep(step.id, (current) => ({
                                                ...current,
                                                timeout: {
                                                    ...current.timeout,
                                                    slaHours: Number(event.target.value),
                                                },
                                            }))}
                                            disabled={!canManageConfig}
                                        />
                                        <SelectField
                                            label="Action en retard"
                                            name={`onTimeout-${step.id}`}
                                            value={step.timeout.onTimeout}
                                            onChange={(event) => updateWorkflowStep(step.id, (current) => ({
                                                ...current,
                                                timeout: {
                                                    ...current.timeout,
                                                    onTimeout: event.target.value as WorkflowStepDefinition['timeout']['onTimeout'],
                                                    escalationTargetRoleId:
                                                        event.target.value === 'escalate'
                                                            ? (current.timeout.escalationTargetRoleId || sortedRoles[0]?.id || '')
                                                            : undefined,
                                                },
                                            }))}
                                            disabled={!canManageConfig}
                                            options={TIMEOUT_POLICY_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
                                        />
                                        {workflowEditorMode === 'advanced' && (
                                            <SelectField
                                                label="Escalade vers role"
                                                name={`escalationTargetRoleId-${step.id}`}
                                                value={step.timeout.escalationTargetRoleId || ''}
                                                onChange={(event) => updateWorkflowStep(step.id, (current) => ({
                                                    ...current,
                                                    timeout: {
                                                        ...current.timeout,
                                                        escalationTargetRoleId: event.target.value,
                                                    },
                                                }))}
                                                disabled={!canManageConfig || step.timeout.onTimeout !== 'escalate'}
                                                options={sortedRoles.map((role) => ({ value: role.id, label: role.name }))}
                                            />
                                        )}
                                        </div>
                                    )}

                                    <div className="rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-small text-on-surface-variant">
                                        <span className="font-medium text-on-surface">Resume:</span>{' '}
                                        {getApproverLabel(step)} • SLA {formatSlaLabel(step.timeout.slaHours)} •{' '}
                                        {getTimeoutPolicyLabel(step.timeout.onTimeout)}
                                        {workflowEditorMode === 'advanced' ? ` • Condition: ${getConditionSummary(step)}` : ''}
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}

                        {workflowConfigStep === 'review' && (
                            <div className="flex justify-end">
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="save" size={18} />}
                                onClick={onSaveWorkflowConfiguration}
                                disabled={!canManageConfig}
                            >
                                Enregistrer le workflow
                            </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon="timeline"
                        title="Aucun workflow"
                        description="Creez ou selectionnez un workflow pour le configurer."
                    />
                )}
                </div>
            )}

            {activeSection === 'assignments' && (
                <div className="rounded-card border border-outline-variant bg-surface p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-title-medium text-on-surface">Affectations utilisateur</h3>
                    {!canManageAssignments && <Badge variant="neutral">Lecture seule</Badge>}
                </div>

                <SelectField
                    label="Utilisateur"
                    name="assignmentUserId"
                    value={assignmentUserId}
                    onChange={(event) => setAssignmentUserId(event.target.value)}
                    options={sortedUsers.map((user) => ({ value: user.id, label: `${user.name} - ${user.role}` }))}
                />

                <div className="grid grid-cols-1 medium:grid-cols-2 gap-4">
                    <div>
                        <p className="text-body-small text-on-surface-variant mb-2">Rôles directs</p>
                        <div className="rounded-card border border-outline-variant p-3 max-h-44 overflow-y-auto space-y-2">
                            {sortedRoles.map((role) => (
                                <label key={role.id} className="flex items-center gap-2 text-body-small text-on-surface">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                        checked={assignmentRoleIds.includes(role.id)}
                                        onChange={(event) => setAssignmentRoleIds((prev) => toggleInArray(prev, role.id, event.target.checked))}
                                        disabled={!canManageAssignments}
                                    />
                                    <span>{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-body-small text-on-surface-variant mb-2">Groupes</p>
                        <div className="rounded-card border border-outline-variant p-3 max-h-44 overflow-y-auto space-y-2">
                            {sortedGroups.map((group) => (
                                <label key={group.id} className="flex items-center gap-2 text-body-small text-on-surface">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                        checked={assignmentGroupIds.includes(group.id)}
                                        onChange={(event) => setAssignmentGroupIds((prev) => toggleInArray(prev, group.id, event.target.checked))}
                                        disabled={!canManageAssignments}
                                    />
                                    <span>{group.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-3">
                    <div className="text-body-small text-on-surface-variant">
                        {effectiveProfile ? (
                            <span>
                                Permissions effectives: {Object.keys(effectiveProfile.permissions).length}
                                {' - '}
                                Conflits: {effectiveProfile.conflicts.length}
                            </span>
                        ) : (
                            <span>Aucun profil effectif disponible.</span>
                        )}
                    </div>
                    <Button
                        variant="filled"
                        icon={<MaterialIcon name="save" size={18} />}
                        onClick={onSaveAssignment}
                        disabled={!canManageAssignments}
                    >
                        Enregistrer
                    </Button>
                </div>
                </div>
            )}
        </div>
    );
};

export default RbacManagementPanel;
