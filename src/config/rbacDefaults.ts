import { User, UserRole } from '../types';
import {
    AuthenticationPolicy,
    EffectiveAccessProfile,
    PermissionAccessLevel,
    PermissionRule,
    RbacGroup,
    RbacRole,
    UserAccessAssignment,
    WorkflowDefinition,
} from '../types/rbac';
import { resolveEffectiveAccess } from '../lib/rbac';

type RbacAssignmentOverride = Omit<Partial<UserAccessAssignment>, 'userId'>;

const baseAuthPolicy = (overrides?: Partial<AuthenticationPolicy>): AuthenticationPolicy => ({
    requiredMethods: ['password'],
    sessionMaxMinutes: 480,
    requireStepUpForSensitiveActions: false,
    ...(overrides || {}),
});

const allow = (
    key: PermissionRule['key'],
    access: PermissionAccessLevel = 'read',
): PermissionRule => ({
    key,
    effect: 'allow',
    access,
});

const deny = (
    key: PermissionRule['key'],
    access: PermissionAccessLevel = 'read',
): PermissionRule => ({
    key,
    effect: 'deny',
    access,
});

export const RBAC_PERMISSIONS = {
    views: {
        dashboard: 'view.dashboard',
        inventory: 'view.inventory',
        finance: 'view.finance',
        approvals: 'view.approvals',
        audit: 'view.audit',
        reports: 'view.reports',
        management: 'view.management',
        locations: 'view.locations',
        settings: 'view.settings',
        users: 'view.users',
    },
    actions: {
        inventoryManage: 'action.inventory.manage',
        inventoryImport: 'action.inventory.import',
        inventoryExport: 'action.inventory.export',
        financeManage: 'action.finance.manage',
        financeImport: 'action.finance.import',
        financeExport: 'action.finance.export',
        usersManage: 'action.users.manage',
        // Pas de clé approvals.manage : l'autorité d'approbation est relationnelle
        // (manager-de, bénéficiaire-de) et vit dans les gates de businessRules —
        // inexprimable par ce moteur sans recréer les divergences de §9.0 (D16).
        auditManage: 'action.audit.manage',
        auditScan: 'action.audit.scan',
        reportsView: 'action.reports.view',
        reportsExport: 'action.reports.export',
        managementManage: 'action.management.manage',
        locationsManage: 'action.locations.manage',
        settingsManage: 'action.settings.manage',
    },
} as const;

export const SYSTEM_ROLE_IDS = {
    superAdmin: 'role.system.superadmin',
    admin: 'role.system.admin',
    manager: 'role.system.manager',
    employee: 'role.system.employee',
} as const;

export const CUSTOM_ROLE_IDS = {
    hr: 'role.custom.hr',
    financeController: 'role.custom.finance_controller',
    externalAuditor: 'role.custom.external_auditor',
    securityLead: 'role.custom.security_lead',
} as const;

export const SYSTEM_ROLE_ID_BY_USER_ROLE: Record<UserRole, string> = {
    SuperAdmin: SYSTEM_ROLE_IDS.superAdmin,
    Admin: SYSTEM_ROLE_IDS.admin,
    Manager: SYSTEM_ROLE_IDS.manager,
    User: SYSTEM_ROLE_IDS.employee,
};

const allViewPermissions: PermissionRule[] = Object.values(RBAC_PERMISSIONS.views).map((key) =>
    allow(key, 'read'),
);

export const DEFAULT_RBAC_ROLES: RbacRole[] = [
    {
        id: SYSTEM_ROLE_IDS.superAdmin,
        name: 'SuperAdmin',
        kind: 'system',
        immutable: true,
        permissions: [
            ...allViewPermissions,
            ...Object.values(RBAC_PERMISSIONS.actions).map((key) => allow(key, 'delete')),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', '2fa', 'sso'],
            sessionMaxMinutes: 120,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'global' }],
    },
    {
        id: SYSTEM_ROLE_IDS.admin,
        name: 'Admin',
        kind: 'system',
        immutable: false,
        permissions: [
            ...allViewPermissions,
            allow(RBAC_PERMISSIONS.actions.inventoryManage, 'delete'),
            allow(RBAC_PERMISSIONS.actions.inventoryImport, 'write'),
            allow(RBAC_PERMISSIONS.actions.inventoryExport, 'write'),
            allow(RBAC_PERMISSIONS.actions.financeManage, 'delete'),
            allow(RBAC_PERMISSIONS.actions.financeImport, 'write'),
            allow(RBAC_PERMISSIONS.actions.financeExport, 'write'),
            allow(RBAC_PERMISSIONS.actions.usersManage, 'delete'),
            allow(RBAC_PERMISSIONS.actions.auditManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.auditScan, 'write'),
            allow(RBAC_PERMISSIONS.actions.reportsView, 'read'),
            allow(RBAC_PERMISSIONS.actions.reportsExport, 'write'),
            allow(RBAC_PERMISSIONS.actions.managementManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.locationsManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.settingsManage, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', '2fa'],
            sessionMaxMinutes: 240,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'country' }],
    },
    {
        id: SYSTEM_ROLE_IDS.manager,
        name: 'Manager',
        kind: 'system',
        immutable: false,
        permissions: [
            allow(RBAC_PERMISSIONS.views.dashboard, 'read'),
            allow(RBAC_PERMISSIONS.views.inventory, 'read'),
            allow(RBAC_PERMISSIONS.views.approvals, 'read'),
            allow(RBAC_PERMISSIONS.views.audit, 'read'),
            allow(RBAC_PERMISSIONS.views.reports, 'read'),
            allow(RBAC_PERMISSIONS.views.settings, 'read'),
            allow(RBAC_PERMISSIONS.views.users, 'read'),
            allow(RBAC_PERMISSIONS.actions.reportsView, 'read'),
            allow(RBAC_PERMISSIONS.actions.auditScan, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', 'pin'],
            sessionMaxMinutes: 300,
            requireStepUpForSensitiveActions: false,
        }),
        dataScopes: [{ level: 'team' }],
    },
    {
        id: SYSTEM_ROLE_IDS.employee,
        name: 'Employé',
        kind: 'system',
        immutable: false,
        permissions: [
            allow(RBAC_PERMISSIONS.views.dashboard, 'read'),
            allow(RBAC_PERMISSIONS.views.inventory, 'read'),
            allow(RBAC_PERMISSIONS.views.approvals, 'read'),
            allow(RBAC_PERMISSIONS.views.settings, 'read'),
            allow(RBAC_PERMISSIONS.actions.auditScan, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password'],
            sessionMaxMinutes: 480,
            requireStepUpForSensitiveActions: false,
        }),
        dataScopes: [{ level: 'self' }],
    },
    {
        id: CUSTOM_ROLE_IDS.hr,
        name: 'RH',
        kind: 'custom',
        baseRoleId: SYSTEM_ROLE_IDS.manager,
        permissions: [
            allow(RBAC_PERMISSIONS.views.users, 'read'),
            allow(RBAC_PERMISSIONS.actions.usersManage, 'write'),
            allow(RBAC_PERMISSIONS.views.reports, 'read'),
            allow(RBAC_PERMISSIONS.actions.reportsView, 'read'),
            deny(RBAC_PERMISSIONS.actions.financeManage, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', '2fa'],
            sessionMaxMinutes: 240,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'service' }],
    },
    {
        id: CUSTOM_ROLE_IDS.financeController,
        name: 'Comptable',
        kind: 'custom',
        baseRoleId: SYSTEM_ROLE_IDS.manager,
        permissions: [
            allow(RBAC_PERMISSIONS.views.finance, 'read'),
            allow(RBAC_PERMISSIONS.actions.financeManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.financeExport, 'write'),
            allow(RBAC_PERMISSIONS.actions.reportsView, 'read'),
            allow(RBAC_PERMISSIONS.actions.reportsExport, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', '2fa'],
            sessionMaxMinutes: 180,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'country' }],
    },
    {
        id: CUSTOM_ROLE_IDS.externalAuditor,
        name: 'Auditeur externe',
        kind: 'custom',
        permissions: [
            allow(RBAC_PERMISSIONS.views.audit, 'read'),
            allow(RBAC_PERMISSIONS.views.reports, 'read'),
            allow(RBAC_PERMISSIONS.views.inventory, 'read'),
            allow(RBAC_PERMISSIONS.actions.reportsView, 'read'),
            deny(RBAC_PERMISSIONS.actions.inventoryManage, 'write'),
            deny(RBAC_PERMISSIONS.actions.financeManage, 'write'),
            deny(RBAC_PERMISSIONS.actions.usersManage, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', 'otp'],
            sessionMaxMinutes: 120,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'custom', expression: 'assigned-audit-scope' }],
    },
    {
        id: CUSTOM_ROLE_IDS.securityLead,
        name: 'Responsable sécurité',
        kind: 'custom',
        baseRoleId: SYSTEM_ROLE_IDS.admin,
        permissions: [
            allow(RBAC_PERMISSIONS.views.settings, 'read'),
            allow(RBAC_PERMISSIONS.actions.settingsManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.auditManage, 'write'),
            allow(RBAC_PERMISSIONS.actions.auditScan, 'write'),
        ],
        authPolicy: baseAuthPolicy({
            requiredMethods: ['password', '2fa', 'otp'],
            sessionMaxMinutes: 120,
            requireStepUpForSensitiveActions: true,
        }),
        dataScopes: [{ level: 'country' }],
    },
];

export const DEFAULT_RBAC_GROUPS: RbacGroup[] = [
    {
        id: 'group.it.france',
        name: 'IT France',
        roleIds: [SYSTEM_ROLE_IDS.admin],
        dataScopes: [{ level: 'country', countries: ['France'] }],
    },
    {
        id: 'group.it.senegal',
        name: 'IT Sénégal',
        roleIds: [SYSTEM_ROLE_IDS.admin],
        dataScopes: [{ level: 'country', countries: ['Sénégal'] }],
    },
    {
        id: 'group.finance.reviewers',
        name: 'Validation Finance',
        roleIds: [CUSTOM_ROLE_IDS.financeController],
        dataScopes: [{ level: 'service', services: ['Finance'] }],
    },
    {
        id: 'group.audit.operators',
        name: 'Opérateurs Audit',
        roleIds: [SYSTEM_ROLE_IDS.manager],
        permissions: [allow(RBAC_PERMISSIONS.actions.auditScan, 'write')],
    },
    {
        id: 'group.external.auditors',
        name: 'Auditeurs externes',
        roleIds: [CUSTOM_ROLE_IDS.externalAuditor],
    },
];

export const DEFAULT_RBAC_ASSIGNMENTS_BY_EMAIL: Record<string, RbacAssignmentOverride> = {
    'alice.admin@tracker.app': {
        roleIds: [SYSTEM_ROLE_IDS.superAdmin],
    },
    'bob.senegal@tracker.app': {
        groupIds: ['group.it.senegal'],
    },
    'clara.france@tracker.app': {
        groupIds: ['group.it.france'],
    },
    'marc.finance@tracker.app': {
        groupIds: ['group.finance.reviewers'],
    },
    'nora.manager@tracker.app': {
        roleIds: [CUSTOM_ROLE_IDS.financeController],
    },
    'oumar.manager@tracker.app': {
        groupIds: ['group.audit.operators'],
    },
};

export const DEFAULT_WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
    {
        id: 'workflow.assignment.pull.default',
        name: 'Attribution standard (Pull)',
        enabled: true,
        steps: [
            {
                id: 'manager_need_validation',
                label: 'Validation du besoin',
                approverType: 'role',
                approverId: SYSTEM_ROLE_IDS.manager,
                required: true,
                timeout: {
                    slaHours: 48,
                    onTimeout: 'escalate',
                    escalationTargetRoleId: SYSTEM_ROLE_IDS.superAdmin,
                },
            },
            {
                id: 'it_processing',
                label: 'Traitement IT',
                approverType: 'role',
                approverId: SYSTEM_ROLE_IDS.admin,
                required: true,
                timeout: {
                    slaHours: 72,
                    onTimeout: 'remind',
                },
            },
            {
                id: 'manager_dotation_validation',
                label: 'Validation de dotation',
                approverType: 'role',
                approverId: SYSTEM_ROLE_IDS.manager,
                required: true,
                timeout: {
                    slaHours: 24,
                    onTimeout: 'remind',
                },
            },
            {
                id: 'finance_threshold_validation',
                label: 'Validation financière (conditionnelle)',
                approverType: 'role',
                approverId: CUSTOM_ROLE_IDS.financeController,
                required: false,
                timeout: {
                    slaHours: 24,
                    onTimeout: 'escalate',
                    escalationTargetRoleId: SYSTEM_ROLE_IDS.superAdmin,
                },
                conditions: [
                    {
                        field: 'estimatedCost',
                        operator: 'gte',
                        value: 1000,
                    },
                ],
            },
            {
                id: 'user_delivery_confirmation',
                label: 'Confirmation de réception',
                approverType: 'role',
                approverId: SYSTEM_ROLE_IDS.employee,
                required: true,
                timeout: {
                    slaHours: 168,
                    onTimeout: 'remind',
                },
            },
        ],
    },
];

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const mergePermissionRules = (...groups: (PermissionRule[] | undefined)[]): PermissionRule[] => {
    const merged = groups.flatMap((items) => items || []);
    if (merged.length === 0) return [];
    return merged;
};

export const buildRbacAssignmentFromUser = (user?: User | null): UserAccessAssignment => {
    if (!user) {
        return {
            userId: 'anonymous',
            roleIds: [],
            groupIds: [],
            directPermissions: [],
        };
    }

    const defaultRoleId = SYSTEM_ROLE_ID_BY_USER_ROLE[user.role];
    const template = DEFAULT_RBAC_ASSIGNMENTS_BY_EMAIL[user.email.toLowerCase()] || {};

    const roleIds = unique([
        ...(defaultRoleId ? [defaultRoleId] : []),
        ...(template.roleIds || []),
        ...(user.rbacRoleIds || []),
    ]);
    const groupIds = unique([...(template.groupIds || []), ...(user.rbacGroupIds || [])]);

    return {
        userId: user.id,
        roleIds,
        groupIds,
        directPermissions: mergePermissionRules(
            template.directPermissions,
            user.rbacDirectPermissions,
        ),
        temporaryRoles: [...(template.temporaryRoles || []), ...(user.rbacTemporaryRoles || [])],
        authPolicyOverride: {
            ...(template.authPolicyOverride || {}),
            ...(user.rbacAuthPolicyOverride || {}),
        },
        dataScopeOverrides: [
            ...(template.dataScopeOverrides || []),
            ...(user.rbacDataScopeOverrides || []),
        ],
    };
};

export const resolveAccessForUser = (user?: User | null): EffectiveAccessProfile => {
    const assignment = buildRbacAssignmentFromUser(user);
    return resolveEffectiveAccess({
        userId: assignment.userId,
        assignment,
        roles: DEFAULT_RBAC_ROLES,
        groups: DEFAULT_RBAC_GROUPS,
    });
};

export const simulateAccessForRoleIds = (
    roleIds: string[],
    options?: {
        groupIds?: string[];
        directPermissions?: PermissionRule[];
    },
): EffectiveAccessProfile => {
    return resolveEffectiveAccess({
        userId: 'simulation-user',
        assignment: {
            userId: 'simulation-user',
            roleIds: unique(roleIds),
            groupIds: unique(options?.groupIds || []),
            directPermissions: options?.directPermissions || [],
        },
        roles: DEFAULT_RBAC_ROLES,
        groups: DEFAULT_RBAC_GROUPS,
    });
};
