export type RbacRoleKind = 'system' | 'custom';

export type PermissionEffect = 'allow' | 'deny';
export type PermissionSourceKind = 'role' | 'group' | 'user_direct';

export type PermissionAccessLevel = 'none' | 'read' | 'write' | 'delete';

export type AppViewKey =
    | 'dashboard'
    | 'inventory'
    | 'finance'
    | 'approvals'
    | 'audit'
    | 'reports'
    | 'management'
    | 'locations'
    | 'settings'
    | 'users';

export type BusinessActionKey =
    | 'inventory.manage'
    | 'inventory.import'
    | 'inventory.export'
    | 'finance.manage'
    | 'finance.import'
    | 'finance.export'
    | 'users.manage'
    | 'audit.manage'
    | 'audit.scan'
    | 'reports.view'
    | 'reports.export'
    | 'management.manage'
    | 'locations.manage'
    | 'settings.manage';

export type PermissionKey = `view.${AppViewKey}` | `action.${BusinessActionKey}`;

export type ScopeLevel = 'global' | 'country' | 'site' | 'service' | 'team' | 'self' | 'custom';

export interface ScopeConstraint {
    level: ScopeLevel;
    countries?: string[];
    sites?: string[];
    services?: string[];
    userIds?: string[];
    expression?: string;
}

export type AuthMethod = 'password' | '2fa' | 'pin' | 'sso' | 'otp' | 'biometric';

export interface AuthenticationPolicy {
    requiredMethods: AuthMethod[];
    sessionMaxMinutes: number;
    requireStepUpForSensitiveActions: boolean;
}

export interface PermissionRule {
    key: PermissionKey;
    effect: PermissionEffect;
    access?: PermissionAccessLevel;
    scope?: ScopeConstraint;
}

export interface WorkflowStepTimeoutPolicy {
    slaHours: number;
    onTimeout: 'remind' | 'escalate' | 'auto_approve' | 'auto_reject';
    escalationTargetRoleId?: string;
}

export interface WorkflowCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: string | number | boolean | string[];
}

export interface WorkflowStepDefinition {
    id: string;
    label: string;
    approverType: 'role' | 'group';
    approverId: string;
    required: boolean;
    timeout: WorkflowStepTimeoutPolicy;
    conditions?: WorkflowCondition[];
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    enabled: boolean;
    steps: WorkflowStepDefinition[];
}

export interface RbacRole {
    id: string;
    name: string;
    kind: RbacRoleKind;
    immutable?: boolean;
    baseRoleId?: string;
    parentRoleId?: string;
    permissions: PermissionRule[];
    authPolicy: AuthenticationPolicy;
    dataScopes?: ScopeConstraint[];
}

export interface RbacGroup {
    id: string;
    name: string;
    roleIds: string[];
    permissions?: PermissionRule[];
    dataScopes?: ScopeConstraint[];
    authPolicy?: Partial<AuthenticationPolicy>;
}

export interface TemporaryRoleAssignment {
    roleId: string;
    startsAt: string;
    endsAt: string;
}

export interface UserAccessAssignment {
    userId: string;
    roleIds?: string[];
    groupIds?: string[];
    directPermissions?: PermissionRule[];
    temporaryRoles?: TemporaryRoleAssignment[];
    authPolicyOverride?: Partial<AuthenticationPolicy>;
    dataScopeOverrides?: ScopeConstraint[];
}

export interface PermissionCandidate {
    key: PermissionKey;
    effect: PermissionEffect;
    access: PermissionAccessLevel;
    sourceKind: PermissionSourceKind;
    sourceId: string;
    priority: number;
    scope?: ScopeConstraint;
}

export interface PermissionConflict {
    key: PermissionKey;
    winner: PermissionCandidate;
    losers: PermissionCandidate[];
}

export interface EffectivePermissionDecision {
    key: PermissionKey;
    effect: PermissionEffect;
    access: PermissionAccessLevel;
    sourceKind: PermissionSourceKind;
    sourceId: string;
    scope?: ScopeConstraint;
}

export interface EffectiveAccessProfile {
    userId: string;
    roleIds: string[];
    groupIds: string[];
    permissions: Partial<Record<PermissionKey, EffectivePermissionDecision>>;
    conflicts: PermissionConflict[];
    authPolicy: AuthenticationPolicy;
    dataScopes: ScopeConstraint[];
}

export interface ResolveEffectiveAccessInput {
    userId: string;
    assignment?: UserAccessAssignment;
    roles: RbacRole[];
    groups: RbacGroup[];
    now?: Date;
}
