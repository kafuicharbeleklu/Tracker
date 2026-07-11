import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    User,
    Equipment,
    Approval,
    HistoryEvent,
    Category,
    Model,
    AppSettings,
    ApprovalStatus,
    AuditScanPayload,
    AuditScanResult,
    AgentCheckInPayload,
    AgentCheckInResult,
    AssignmentStatus,
    DetectedDevice,
} from '../types';
import { mockAllUsersExtended, mockAllEquipment, mockLocationCountries, mockPendingApprovals, mockApprovalHistory, mockHistoryEvents, mockCategories, mockModels, CATEGORY_ICONS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { getPersistedValue } from '../lib/persistence';
import { DEMO_RESEED_DISABLED } from '../lib/demoSeed';
import {
    buildRbacAssignmentFromUser,
    DEFAULT_RBAC_GROUPS,
    DEFAULT_RBAC_ROLES,
    DEFAULT_WORKFLOW_DEFINITIONS,
    SYSTEM_ROLE_IDS,
} from '../config/rbacDefaults';
import { resolveEffectiveAccess } from '../lib/rbac';
import {
    EffectiveAccessProfile,
    RbacGroup,
    RbacRole,
    UserAccessAssignment,
    WorkflowDefinition,
} from '../types/rbac';
import {
    ACTIVE_APPROVAL_STATUSES,
    BusinessRuleDecision,
    canDeleteEquipmentByBusinessRule,
    canDeleteUserByBusinessRule,
    canManageInventoryByRole,
    canManageLocationsByRole,
    canManageSystemByRole,
    canManageUsersByRole,
    canTransitionApprovalStatus,
    canUpdateUserByBusinessRule,
    getEquipmentUpdatesForApprovalStatus,
    getRefusalDecisionKind,
    isApprovalActiveStatus,
    MANAGER_VALIDATION_PENDING_STATUSES,
} from '../lib/businessRules';

// Structure des données de localisation pour la cascade
interface LocationData {
    countries: string[];
    sites: Record<string, string[]>; // Clé: Pays -> Valeur: Liste de sites
    services: Record<string, string[]>; // Clé: Site -> Valeur: Liste de services
}

interface DataContextType {
    users: User[];
    equipment: Equipment[];
    detectedDevices: DetectedDevice[];
    categories: Category[];
    models: Model[];
    approvals: Approval[];
    events: HistoryEvent[];
    locationData: LocationData;
    serviceManagers: Record<string, string>; // NOUVEAU: Mapping Service Name -> Manager ID
    settings: AppSettings;
    rbacRoles: RbacRole[];
    rbacGroups: RbacGroup[];
    rbacAssignments: UserAccessAssignment[];
    rbacWorkflows: WorkflowDefinition[];

    addUser: (user: User) => BusinessRuleDecision;
    updateUser: (id: string, updates: Partial<User>) => BusinessRuleDecision;
    deleteUser: (id: string) => BusinessRuleDecision;
    addEquipment: (item: Equipment) => void;
    updateEquipment: (id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => void;
    deleteEquipment: (id: string) => boolean;
    upsertEquipmentFromAuditScan: (
        payload: AuditScanPayload,
        scope: { country: string; site: string; service: string },
    ) => AuditScanResult;
    ingestAgentCheckIn: (payload: AgentCheckInPayload) => AgentCheckInResult;
    promoteDetectedDeviceToInventory: (
        detectedDeviceId: string,
        scope?: { country: string; site: string; service: string },
    ) => AuditScanResult;
    markDetectedDeviceAsIgnored: (detectedDeviceId: string) => boolean;
    removeEquipmentFromServiceAfterAudit: (
        equipmentId: string,
        scope: { country: string; site: string; service: string },
    ) => boolean;
    updateApproval: (
        id: string,
        status: ApprovalStatus,
        options?: { assignedEquipmentId?: string; assignedEquipmentName?: string; reason?: string },
    ) => BusinessRuleDecision;
    addApproval: (approval: Omit<Approval, 'id'>) => void;
    logEvent: (event: Omit<HistoryEvent, 'id' | 'timestamp'>) => void;

    addLocation: (type: 'country' | 'site' | 'service', name: string, parentId?: string) => boolean;
    renameLocation: (type: 'country' | 'site' | 'service', oldName: string, newName: string, parentId?: string) => boolean;
    deleteLocation: (type: 'country' | 'site' | 'service', name: string, parentId?: string) => void;
    assignManagerToService: (serviceName: string, managerId: string) => void; // NOUVEAU

    // Category CRUD
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => boolean;

    // Model CRUD
    addModel: (model: Omit<Model, 'id'>) => void;
    updateModel: (id: string, updates: Partial<Model>) => void;
    deleteModel: (id: string) => boolean;

    // Global Settings
    updateSettings: (newSettings: Partial<AppSettings>) => void;

    // RBAC
    getRbacAssignmentForUser: (userId: string) => UserAccessAssignment | undefined;
    getEffectiveAccessForUser: (userId: string) => EffectiveAccessProfile | null;
    upsertRbacRole: (role: RbacRole) => BusinessRuleDecision;
    deleteRbacRole: (roleId: string) => BusinessRuleDecision;
    upsertRbacGroup: (group: RbacGroup) => BusinessRuleDecision;
    deleteRbacGroup: (groupId: string) => BusinessRuleDecision;
    upsertRbacWorkflow: (workflow: WorkflowDefinition) => BusinessRuleDecision;
    deleteRbacWorkflow: (workflowId: string) => BusinessRuleDecision;
    upsertUserRbacAssignment: (
        userId: string,
        updates: Partial<Omit<UserAccessAssignment, 'userId'>>,
    ) => BusinessRuleDecision;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    currency: 'XOF',
    fiscalYearStart: '01',
    defaultDepreciationMethod: 'linear',
    defaultDepreciationYears: 3,
    salvageValuePercent: 0,
    renewalThreshold: 85,
    roundingRule: 'standard',
    compactNotation: false,
    autoCollectionAgentEnabled: false,
    autoCollectionAgentApiKey: 'NEEMBA_AGENT_KEY',
    autoCollectionApiBaseUrl: 'http://localhost:8787',
    autoCollectionForwardToApi: false,
    autoCollectionHeartbeatMinutes: 240,
    autoCollectionAdEnabled: false,
    autoCollectionAdHost: '',
    autoCollectionAdBaseDn: '',
    autoCollectionAdServiceAccount: '',
    autoCollectionNetworkEnabled: false,
    autoCollectionNetworkRanges: '',
    autoCollectionRequireManualValidation: true,
};

const STORAGE_KEYS = {
    settings: { current: 'tracker_settings', legacy: 'neemba_settings' },
    users: { current: 'tracker_users', legacy: 'neemba_users' },
    equipment: { current: 'tracker_equipment', legacy: 'neemba_equipment' },
    categories: { current: 'tracker_categories', legacy: 'neemba_categories' },
    models: { current: 'tracker_models', legacy: 'neemba_models' },
    events: { current: 'tracker_events', legacy: 'neemba_events' },
    serviceManagers: { current: 'tracker_service_managers', legacy: 'neemba_service_managers' },
    rbacRoles: { current: 'tracker_rbac_roles', legacy: 'neemba_rbac_roles' },
    rbacGroups: { current: 'tracker_rbac_groups', legacy: 'neemba_rbac_groups' },
    rbacAssignments: { current: 'tracker_rbac_assignments', legacy: 'neemba_rbac_assignments' },
    rbacWorkflows: { current: 'tracker_rbac_workflows', legacy: 'neemba_rbac_workflows' },
    detectedDevices: { current: 'tracker_detected_devices', legacy: 'neemba_detected_devices' },
    approvals: { current: 'tracker_approvals', legacy: 'neemba_approvals' },
} as const;

const normalizeMatch = (value?: string) => (value || '').trim().toLowerCase();

const normalizeMacAddress = (value?: string) =>
    normalizeMatch(value).replace(/[^a-z0-9]/g, '');

const normalizeUuid = (value?: string) =>
    normalizeMatch(value).replace(/[^a-z0-9]/g, '');

interface MatchCandidate {
    equipment: Equipment;
    score: number;
}

const scoreEquipmentMatch = (payload: AgentCheckInPayload, equipment: Equipment): number => {
    let score = 0;

    const payloadSerial = normalizeMatch(payload.serialNumber);
    const payloadAssetId = normalizeMatch(payload.assetId);
    const payloadHostname = normalizeMatch(payload.hostname || payload.machineName);
    const payloadBiosUuid = normalizeUuid(payload.biosUuid);
    const payloadMac = normalizeMacAddress(payload.macAddress);

    const equipmentSerial = normalizeMatch(equipment.serialNumber);
    const equipmentAssetId = normalizeMatch(equipment.assetId);
    const equipmentHostname = normalizeMatch(equipment.hostname || equipment.name);
    const equipmentBiosUuid = normalizeUuid(equipment.biosUuid);
    const equipmentMac = normalizeMacAddress(equipment.macAddress);

    if (payloadBiosUuid && equipmentBiosUuid && payloadBiosUuid === equipmentBiosUuid) score += 100;
    if (payloadSerial && equipmentSerial && payloadSerial === equipmentSerial) score += 90;
    if (payloadMac && equipmentMac && payloadMac === equipmentMac) score += 70;
    if (payloadAssetId && equipmentAssetId && payloadAssetId === equipmentAssetId) score += 65;
    if (payloadHostname && equipmentHostname && payloadHostname === equipmentHostname) score += 40;

    return score;
};

const resolveEquipmentMatchCandidates = (payload: AgentCheckInPayload, equipment: Equipment[]): MatchCandidate[] => {
    return equipment
        .map((item) => ({ equipment: item, score: scoreEquipmentMatch(payload, item) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
};

const buildDetectedFingerprint = (payload: AgentCheckInPayload): string => {
    const serial = normalizeMatch(payload.serialNumber);
    const biosUuid = normalizeUuid(payload.biosUuid);
    const mac = normalizeMacAddress(payload.macAddress);
    const assetId = normalizeMatch(payload.assetId);
    const hostname = normalizeMatch(payload.hostname || payload.machineName);

    const strong = [serial, biosUuid, mac].filter(Boolean).join('|');
    if (strong) return `hw:${strong}`;
    if (assetId) return `asset:${assetId}`;
    if (hostname) return `host:${hostname}`;
    return `unknown-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
};

const buildScanAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'user')}`;

const DEFAULT_SITE_BY_COUNTRY: Record<string, string> = {
    France: 'Bureau Paris',
    'Sénégal': 'Campus Dakar',
    Togo: 'Lomé Siège',
};

const DEFAULT_DEPARTMENT_BY_COUNTRY: Record<string, string> = {
    France: 'IT HQ',
    'Sénégal': 'Support Afrique',
    Togo: 'Direction',
};

const buildFallbackHostname = (name: string, assetId: string): string => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || assetId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const addYearsToDate = (dateValue?: string, years = 2): string | undefined => {
    if (!dateValue) return undefined;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return undefined;
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().slice(0, 10);
};

const inferCountryFromUser = (user: User): string => {
    if (user.country) return user.country;
    if (user.managedCountries && user.managedCountries.length > 0) return user.managedCountries[0];
    const department = (user.department || '').toLowerCase();
    if (department.includes('sénégal') || department.includes('afrique')) return 'Sénégal';
    if (department.includes('togo') || department.includes('direction')) return 'Togo';
    return 'France';
};

const inferSiteFromCountry = (country: string): string => {
    if (country === 'Sénégal') return 'Campus Dakar';
    if (country === 'Togo') return 'Lomé Siège';
    return 'Bureau Paris';
};

const normalizeUserRecord = (persisted: User, seed?: User): User => {
    const merged: User = {
        ...(seed || persisted),
        ...persisted,
    };
    const country = inferCountryFromUser(merged);
    const site = merged.site || seed?.site || inferSiteFromCountry(country);
    const dialingCode = country === 'Sénégal' ? '+221' : country === 'Togo' ? '+228' : '+33';
    const safeId = merged.id || '00';
    const paddedId = safeId.padStart(2, '0');

    return {
        ...merged,
        country,
        site,
        status: merged.status || 'active',
        phone: merged.phone || `${dialingCode} 6 00 00 00 ${paddedId}`,
    };
};

const mergePersistedUsersWithSeed = (parsed: unknown[]): User[] => {
    const persistedUsers = parsed.filter((entry): entry is User => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'email' in entry;
    });

    const seedById = new Map(mockAllUsersExtended.map((item) => [item.id, item]));
    const seedByEmail = new Map(mockAllUsersExtended.map((item) => [item.email.toLowerCase(), item]));

    const mergedPersisted = persistedUsers.map((entry) => {
        const seedMatch = seedById.get(entry.id) || seedByEmail.get((entry.email || '').toLowerCase());
        return normalizeUserRecord(entry, seedMatch);
    });

    const mergedIds = new Set(mergedPersisted.map((item) => item.id));
    const seededMissing = DEMO_RESEED_DISABLED
        ? []
        : mockAllUsersExtended
              .filter((seed) => !mergedIds.has(seed.id))
              .map((seed) => normalizeUserRecord(seed, seed));

    return [...mergedPersisted, ...seededMissing];
};

const normalizeEquipmentRecord = (persisted: Equipment, seed?: Equipment): Equipment => {
    const mergedFinancial = {
        purchasePrice: 0,
        purchaseDate: '2025-01-01',
        depreciationYears: 3,
        depreciationMethod: 'linear' as const,
        ...(seed?.financial || {}),
        ...(persisted.financial || {}),
    };

    const merged: Equipment = {
        ...(seed || persisted),
        ...persisted,
        financial: mergedFinancial,
        securityAgents: persisted.securityAgents || seed?.securityAgents,
        user: persisted.user !== undefined ? persisted.user : seed?.user,
    };

    const country = merged.country || seed?.country || 'France';
    const site = merged.site || seed?.site || DEFAULT_SITE_BY_COUNTRY[country] || 'Bureau Paris';
    const userDepartment = merged.user && typeof merged.user === 'object'
        ? (merged.user as Partial<User>).department
        : undefined;
    const department = merged.department || userDepartment || seed?.department || DEFAULT_DEPARTMENT_BY_COUNTRY[country] || 'IT HQ';
    const warrantyEnd = merged.warrantyEnd || seed?.warrantyEnd || addYearsToDate(
        mergedFinancial.purchaseDate,
        Math.max(1, mergedFinancial.depreciationYears || 2),
    );
    const serialNumber = merged.serialNumber || seed?.serialNumber || `SN-${merged.assetId.replace(/[^A-Za-z0-9]/g, '')}`;
    const hostname = merged.hostname || seed?.hostname || buildFallbackHostname(merged.name, merged.assetId);
    const isComputingAsset = ['Laptop', 'Server', 'Printer'].includes(merged.type);

    return {
        ...merged,
        country,
        site,
        department,
        warrantyEnd,
        serialNumber,
        hostname,
        os: merged.os || seed?.os || (isComputingAsset ? 'Windows 11 Pro' : 'N/A'),
        ram: merged.ram || seed?.ram || (isComputingAsset ? '16 GB' : 'N/A'),
        storage: merged.storage || seed?.storage || (isComputingAsset ? '512 GB SSD' : 'N/A'),
        securityAgents: merged.securityAgents || {
            sentinelOne: isComputingAsset,
            matrix42: isComputingAsset,
            manageEngine: isComputingAsset,
            lastCheckedAt: '2026-01-15T09:00:00Z',
        },
    };
};

const mergePersistedEquipmentWithSeed = (parsed: unknown[]): Equipment[] => {
    const persistedEquipment = parsed.filter((entry): entry is Equipment => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'assetId' in entry;
    });

    const seedById = new Map(mockAllEquipment.map((item) => [item.id, item]));
    const seedByAssetId = new Map(mockAllEquipment.map((item) => [item.assetId, item]));

    const mergedPersisted = persistedEquipment.map((entry) => {
        const seedMatch = seedById.get(entry.id) || seedByAssetId.get(entry.assetId);
        return normalizeEquipmentRecord(entry, seedMatch);
    });

    const mergedIds = new Set(mergedPersisted.map((item) => item.id));
    const seededMissing = DEMO_RESEED_DISABLED
        ? []
        : mockAllEquipment
              .filter((seed) => !mergedIds.has(seed.id))
              .map((seed) => normalizeEquipmentRecord(seed, seed));

    return [...mergedPersisted, ...seededMissing];
};

const APPROVAL_SEED: readonly Approval[] = [...mockPendingApprovals, ...mockApprovalHistory];

const DEFAULT_APPROVAL_IMAGE = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop';

const normalizeApprovalRecord = (entry: Approval, seed?: Approval): Approval => ({
    ...(seed || {}),
    ...entry,
    image: entry.image || seed?.image || DEFAULT_APPROVAL_IMAGE,
    createdAt: entry.createdAt || seed?.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || seed?.updatedAt || new Date().toISOString(),
});

const mergePersistedApprovalsWithSeed = (parsed: unknown[]): Approval[] => {
    const persistedApprovals = parsed.filter((entry): entry is Approval => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'status' in entry;
    });

    const seedById = new Map(APPROVAL_SEED.map((item) => [item.id, item]));
    const mergedPersisted = persistedApprovals.map((entry) =>
        normalizeApprovalRecord(entry, seedById.get(entry.id)));

    // Option B (D8) : la copie persistée prime par id, le re-seed ne réinjecte que les absents.
    const mergedIds = new Set(mergedPersisted.map((item) => item.id));
    const seededMissing = DEMO_RESEED_DISABLED
        ? []
        : APPROVAL_SEED.filter((seed) => !mergedIds.has(seed.id));

    return [...mergedPersisted, ...seededMissing];
};

// Réparation au chargement (§9.1) : libère tout équipement réservé par un workflow
// d'approbation qu'aucune approbation active ne référence via assignedEquipmentId —
// assainit les orphelins hérités d'avant D12/D15 et les flux morts au reload avant D13.
// PENDING_RETURN est exclu : la restitution ne passe pas par une approbation.
const APPROVAL_WORKFLOW_ASSIGNMENT_STATUSES: readonly AssignmentStatus[] = [
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
];

const releaseOrphanedWorkflowEquipment = (
    equipmentList: Equipment[],
    approvalList: readonly Approval[],
): { repaired: Equipment[]; changedIds: string[] } => {
    const referencedIds = new Set(
        approvalList
            .filter((approval) => isApprovalActiveStatus(approval.status) && approval.assignedEquipmentId)
            .map((approval) => approval.assignedEquipmentId as string),
    );

    const changedIds: string[] = [];
    const repaired = equipmentList.map((item) => {
        const isWorkflowReserved = item.status === 'En attente'
            && !!item.assignmentStatus
            && APPROVAL_WORKFLOW_ASSIGNMENT_STATUSES.includes(item.assignmentStatus);
        if (!isWorkflowReserved || referencedIds.has(item.id)) return item;
        changedIds.push(item.id);
        return { ...item, status: 'Disponible' as const, assignmentStatus: 'NONE' as const, user: null };
    });

    return { repaired, changedIds };
};

const uniqueStrings = (items?: string[]): string[] =>
    Array.from(new Set((items || []).filter((item): item is string => typeof item === 'string' && item.length > 0)));

const sanitizeAssignment = (assignment: UserAccessAssignment): UserAccessAssignment => ({
    userId: assignment.userId,
    roleIds: uniqueStrings(assignment.roleIds),
    groupIds: uniqueStrings(assignment.groupIds),
    directPermissions: assignment.directPermissions || [],
    temporaryRoles: assignment.temporaryRoles || [],
    authPolicyOverride: assignment.authPolicyOverride,
    dataScopeOverrides: assignment.dataScopeOverrides || [],
});

const mergePersistedRbacRoles = (parsed: unknown[]): RbacRole[] => {
    const persistedRoles = parsed.filter((entry): entry is RbacRole => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'permissions' in entry;
    });

    const defaultsById = new Map(DEFAULT_RBAC_ROLES.map((role) => [role.id, role]));

    const mergedDefaults = DEFAULT_RBAC_ROLES.map((defaultRole) => {
        const persisted = persistedRoles.find((item) => item.id === defaultRole.id);
        if (!persisted) return defaultRole;

        if (defaultRole.kind === 'system') {
            return {
                ...defaultRole,
                ...persisted,
                id: defaultRole.id,
                kind: 'system' as const,
                immutable: true,
            };
        }

        return {
            ...defaultRole,
            ...persisted,
        };
    });

    const customPersisted = persistedRoles.filter((role) => !defaultsById.has(role.id));
    return [...mergedDefaults, ...customPersisted];
};

const mergePersistedRbacGroups = (parsed: unknown[]): RbacGroup[] => {
    const persistedGroups = parsed.filter((entry): entry is RbacGroup => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'roleIds' in entry;
    });

    const defaultsById = new Map(DEFAULT_RBAC_GROUPS.map((group) => [group.id, group]));
    const mergedDefaults = DEFAULT_RBAC_GROUPS.map((defaultGroup) => {
        const persisted = persistedGroups.find((item) => item.id === defaultGroup.id);
        if (!persisted) return defaultGroup;
        return {
            ...defaultGroup,
            ...persisted,
            roleIds: uniqueStrings(persisted.roleIds),
        };
    });

    const customPersisted = persistedGroups
        .filter((group) => !defaultsById.has(group.id))
        .map((group) => ({
            ...group,
            roleIds: uniqueStrings(group.roleIds),
        }));

    return [...mergedDefaults, ...customPersisted];
};

const mergePersistedRbacWorkflows = (parsed: unknown[]): WorkflowDefinition[] => {
    const persisted = parsed.filter((entry): entry is WorkflowDefinition => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'id' in entry && 'steps' in entry;
    });

    const defaultsById = new Map(DEFAULT_WORKFLOW_DEFINITIONS.map((workflow) => [workflow.id, workflow]));
    const mergedDefaults = DEFAULT_WORKFLOW_DEFINITIONS.map((defaultWorkflow) => {
        const fromStorage = persisted.find((item) => item.id === defaultWorkflow.id);
        return fromStorage ? { ...defaultWorkflow, ...fromStorage } : defaultWorkflow;
    });

    const customPersisted = persisted.filter((workflow) => !defaultsById.has(workflow.id));
    return [...mergedDefaults, ...customPersisted];
};

const mergePersistedRbacAssignments = (
    parsed: unknown[],
    scopedUsers: User[],
): UserAccessAssignment[] => {
    const persisted = parsed.filter((entry): entry is UserAccessAssignment => {
        if (typeof entry !== 'object' || entry === null) return false;
        return 'userId' in entry;
    }).map(sanitizeAssignment);

    const persistedByUserId = new Map(persisted.map((entry) => [entry.userId, entry]));
    const defaultsByUserId = new Map(
        scopedUsers.map((user) => [user.id, sanitizeAssignment(buildRbacAssignmentFromUser(user))]),
    );

    const mergedDefaults = Array.from(defaultsByUserId.values()).map((defaultAssignment) => {
        const override = persistedByUserId.get(defaultAssignment.userId);
        if (!override) return defaultAssignment;

        return sanitizeAssignment({
            ...defaultAssignment,
            ...override,
            userId: defaultAssignment.userId,
            roleIds: uniqueStrings([...(defaultAssignment.roleIds || []), ...(override.roleIds || [])]),
            groupIds: uniqueStrings([...(defaultAssignment.groupIds || []), ...(override.groupIds || [])]),
            directPermissions: [...(defaultAssignment.directPermissions || []), ...(override.directPermissions || [])],
            temporaryRoles: [...(defaultAssignment.temporaryRoles || []), ...(override.temporaryRoles || [])],
            dataScopeOverrides: [
                ...(defaultAssignment.dataScopeOverrides || []),
                ...(override.dataScopeOverrides || []),
            ],
            authPolicyOverride: {
                ...(defaultAssignment.authPolicyOverride || {}),
                ...(override.authPolicyOverride || {}),
            },
        });
    });

    const orphanAssignments = persisted
        .filter((entry) => !defaultsByUserId.has(entry.userId))
        .map(sanitizeAssignment);

    return [...mergedDefaults, ...orphanAssignments];
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();

    // --- SETTINGS ---
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.settings.current, STORAGE_KEYS.settings.legacy);
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), currency: 'XOF' } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    // --- USERS & EQUIPMENT ---
    const [users, setUsers] = useState<User[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.users.current, STORAGE_KEYS.users.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sous bypass dev (INV-9), `[]` persisté = liste volontairement vidée, pas « jamais persisté »
                if (Array.isArray(parsed) && (parsed.length > 0 || DEMO_RESEED_DISABLED)) {
                    return mergePersistedUsersWithSeed(parsed);
                }
            }
            return mockAllUsersExtended.map((item) => normalizeUserRecord(item, item));
        } catch {
            return mockAllUsersExtended.map((item) => normalizeUserRecord(item, item));
        }
    });

    const [equipment, setEquipment] = useState<Equipment[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.equipment.current, STORAGE_KEYS.equipment.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sous bypass dev (INV-9), `[]` persisté = liste volontairement vidée, pas « jamais persisté »
                if (Array.isArray(parsed) && (parsed.length > 0 || DEMO_RESEED_DISABLED)) {
                    return mergePersistedEquipmentWithSeed(parsed);
                }
            }
            return mockAllEquipment.map((item) => normalizeEquipmentRecord(item, item));
        } catch {
            return mockAllEquipment.map((item) => normalizeEquipmentRecord(item, item));
        }
    });

    const [detectedDevices, setDetectedDevices] = useState<DetectedDevice[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.detectedDevices.current, STORAGE_KEYS.detectedDevices.legacy);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return [];
            return parsed as DetectedDevice[];
        } catch {
            return [];
        }
    });

    // --- CATEGORIES ---
    const [categories, setCategories] = useState<Category[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.categories.current, STORAGE_KEYS.categories.legacy);
            if (!saved) return mockCategories;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return mockCategories;
            // Re-inflate icons as React components
            return parsed.map((cat) => {
                const categoryData = (typeof cat === 'object' && cat !== null
                    ? cat
                    : {}) as Partial<Category> & { iconName?: string };

                return {
                    ...categoryData,
                    icon: CATEGORY_ICONS[categoryData.iconName || 'Laptop'] || CATEGORY_ICONS['Laptop']
                } as Category;
            });
        } catch {
            return mockCategories;
        }
    });

    // --- MODELS ---
    const [models, setModels] = useState<Model[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.models.current, STORAGE_KEYS.models.legacy);
            return saved ? JSON.parse(saved) : mockModels;
        } catch {
            return mockModels;
        }
    });

    // --- APPROVALS ---
    const [approvals, setApprovals] = useState<Approval[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.approvals.current, STORAGE_KEYS.approvals.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sous bypass dev (INV-9), `[]` persisté = liste volontairement vidée, pas « jamais persisté »
                if (Array.isArray(parsed) && (parsed.length > 0 || DEMO_RESEED_DISABLED)) {
                    return mergePersistedApprovalsWithSeed(parsed);
                }
            }
            return [...APPROVAL_SEED];
        } catch {
            return [...APPROVAL_SEED];
        }
    });

    // --- HISTORY EVENTS ---
    const [events, setEvents] = useState<HistoryEvent[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.events.current, STORAGE_KEYS.events.legacy);
            return saved ? JSON.parse(saved) : mockHistoryEvents;
        } catch {
            return mockHistoryEvents;
        }
    });

    // --- LOCATIONS MANAGEMENT ---
    const [locationData, setLocationData] = useState<LocationData>(() => {
        return {
            countries: mockLocationCountries,
            sites: {
                'France': ['Bureau Paris', 'Bureau Lyon'],
                'Sénégal': ['Campus Dakar'],
                'Togo': ['Lomé Siège']
            },
            services: {
                'Bureau Paris': ['IT', 'Marketing Europe', 'Finance'],
                'Bureau Lyon': ['Commercial'],
                'Campus Dakar': ['Support Afrique', 'Engineering'],
                'Lomé Siège': ['Direction']
            }
        };
    });

    // --- SERVICE MANAGERS (New) ---
    const [serviceManagers, setServiceManagers] = useState<Record<string, string>>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.serviceManagers.current, STORAGE_KEYS.serviceManagers.legacy);
            // Mock initial: Jane Manager gère 'Sales' et 'Marketing'
            return saved ? JSON.parse(saved) : {
                'Sales': '3',
                'Marketing': '3',
                'Marketing Europe': '3',
                'Commercial': '3'
            };
        } catch {
            return {};
        }
    });

    const [rbacRoles, setRbacRoles] = useState<RbacRole[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.rbacRoles.current, STORAGE_KEYS.rbacRoles.legacy);
            if (!saved) return DEFAULT_RBAC_ROLES;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return DEFAULT_RBAC_ROLES;
            return mergePersistedRbacRoles(parsed);
        } catch {
            return DEFAULT_RBAC_ROLES;
        }
    });

    const [rbacGroups, setRbacGroups] = useState<RbacGroup[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.rbacGroups.current, STORAGE_KEYS.rbacGroups.legacy);
            if (!saved) return DEFAULT_RBAC_GROUPS;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return DEFAULT_RBAC_GROUPS;
            return mergePersistedRbacGroups(parsed);
        } catch {
            return DEFAULT_RBAC_GROUPS;
        }
    });

    const [rbacWorkflows, setRbacWorkflows] = useState<WorkflowDefinition[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.rbacWorkflows.current, STORAGE_KEYS.rbacWorkflows.legacy);
            if (!saved) return DEFAULT_WORKFLOW_DEFINITIONS;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return DEFAULT_WORKFLOW_DEFINITIONS;
            return mergePersistedRbacWorkflows(parsed);
        } catch {
            return DEFAULT_WORKFLOW_DEFINITIONS;
        }
    });

    const [rbacAssignments, setRbacAssignments] = useState<UserAccessAssignment[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.rbacAssignments.current, STORAGE_KEYS.rbacAssignments.legacy);
            if (!saved) {
                return mergePersistedRbacAssignments([], users);
            }

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                return mergePersistedRbacAssignments([], users);
            }
            return mergePersistedRbacAssignments(parsed, users);
        } catch {
            return mergePersistedRbacAssignments([], users);
        }
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.users.current, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.equipment.current, JSON.stringify(equipment));
    }, [equipment]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.detectedDevices.current, JSON.stringify(detectedDevices));
    }, [detectedDevices]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.approvals.current, JSON.stringify(approvals));
    }, [approvals]);

    // Réparation au chargement (§9.1) : une seule passe au montage, sur l'état hydraté.
    // setEquipment fonctionnel = idempotent (le 2e passage StrictMode ne change rien).
    useEffect(() => {
        setEquipment((prev) => {
            const { repaired, changedIds } = releaseOrphanedWorkflowEquipment(prev, approvals);
            return changedIds.length > 0 ? repaired : prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.categories.current, JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.models.current, JSON.stringify(models));
    }, [models]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.events.current, JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.settings.current, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.serviceManagers.current, JSON.stringify(serviceManagers));
    }, [serviceManagers]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.rbacRoles.current, JSON.stringify(rbacRoles));
    }, [rbacRoles]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.rbacGroups.current, JSON.stringify(rbacGroups));
    }, [rbacGroups]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.rbacWorkflows.current, JSON.stringify(rbacWorkflows));
    }, [rbacWorkflows]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.rbacAssignments.current, JSON.stringify(rbacAssignments));
    }, [rbacAssignments]);

    useEffect(() => {
        setRbacAssignments((prev) => mergePersistedRbacAssignments(prev, users));
    }, [users]);

    // --- APPLICATION DU THÈME (Design System Tracker / Caterpillar) ---
    // Les tokens de marque sont figés en CSS (index.css, couche de compatibilité).
    // Light-first : le mode sombre runtime est différé (cf. docs/DESIGN_TOKENS_SPEC.md).
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
    }, []);

    const logEvent = useCallback((eventData: Omit<HistoryEvent, 'id' | 'timestamp'>) => {
        const newEvent: HistoryEvent = {
            ...eventData,
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };
        setEvents(prev => [newEvent, ...prev]);
    }, []);

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings, currency: 'XOF' }));
    }, []);

    const canManageRbacConfig = useCallback((): BusinessRuleDecision => {
        if (!currentUser) {
            return { allowed: false, reason: 'Session invalide.' };
        }

        if (currentUser.role !== 'SuperAdmin') {
            return {
                allowed: false,
                reason: 'Seul un SuperAdmin peut modifier la configuration RBAC globale.',
            };
        }

        return { allowed: true };
    }, [currentUser]);

    const canManageRbacAssignments = useCallback((): BusinessRuleDecision => {
        if (!currentUser) {
            return { allowed: false, reason: 'Session invalide.' };
        }

        if (currentUser.role !== 'SuperAdmin' && currentUser.role !== 'Admin') {
            return {
                allowed: false,
                reason: 'Permissions insuffisantes pour modifier les assignations RBAC.',
            };
        }

        return { allowed: true };
    }, [currentUser]);

    const getRbacAssignmentForUser = useCallback((userId: string): UserAccessAssignment | undefined => {
        return rbacAssignments.find((entry) => entry.userId === userId);
    }, [rbacAssignments]);

    const getEffectiveAccessForUser = useCallback((userId: string): EffectiveAccessProfile | null => {
        const targetUser = users.find((entry) => entry.id === userId);
        if (!targetUser) return null;

        const assignment = getRbacAssignmentForUser(userId) || sanitizeAssignment(buildRbacAssignmentFromUser(targetUser));
        return resolveEffectiveAccess({
            userId: targetUser.id,
            assignment,
            roles: rbacRoles,
            groups: rbacGroups,
        });
    }, [getRbacAssignmentForUser, rbacGroups, rbacRoles, users]);

    // Accès RBAC effectif de l'utilisateur courant, exposé via ref pour les gardes de mutation.
    // Les refs ne déclenchent pas exhaustive-deps → aucun churn de dépendances sur les ~20 callbacks.
    // Source de vérité = moteur RBAC complet (rôles + groupes + permissions directes + deny),
    // identique à l'UI (useAccessControl). Corrige l'incohérence d'autorisation (cf. AUDIT_LOGIQUE_METIER P0).
    const currentUserAccessRef = useRef<EffectiveAccessProfile | null>(null);
    currentUserAccessRef.current = currentUser ? getEffectiveAccessForUser(currentUser.id) : null;

    const upsertRbacRole = useCallback((role: RbacRole): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const roleId = role.id?.trim() || `role.custom.${Date.now()}`;
        const existing = rbacRoles.find((entry) => entry.id === roleId);

        if (existing?.kind === 'system') {
            return {
                allowed: false,
                reason: 'Impossible de modifier un rôle système via cette action.',
            };
        }

        const normalized: RbacRole = {
            ...role,
            id: roleId,
            name: role.name?.trim() || roleId,
            kind: role.kind === 'system' ? 'custom' : role.kind,
            permissions: role.permissions || [],
            authPolicy: role.authPolicy,
            immutable: false,
        };

        setRbacRoles((prev) => {
            if (existing) {
                return prev.map((entry) => (entry.id === roleId ? normalized : entry));
            }
            return [...prev, normalized];
        });

        logEvent({
            type: existing ? 'UPDATE' : 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: roleId,
            targetName: normalized.name,
            description: existing ? `Rôle RBAC mis à jour (${normalized.name})` : `Nouveau rôle RBAC créé (${normalized.name})`,
            metadata: {
                source: 'rbac_roles',
                roleId: roleId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacRoles]);

    const deleteRbacRole = useCallback((roleId: string): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const target = rbacRoles.find((entry) => entry.id === roleId);
        if (!target) {
            return { allowed: false, reason: 'Rôle introuvable.' };
        }

        if (target.kind === 'system' || target.immutable || roleId === SYSTEM_ROLE_IDS.superAdmin) {
            return {
                allowed: false,
                reason: 'Suppression impossible: rôle système protégé.',
            };
        }

        const usedByGroup = rbacGroups.some((group) => group.roleIds.includes(roleId));
        if (usedByGroup) {
            return {
                allowed: false,
                reason: 'Suppression impossible: rôle encore utilisé dans un groupe.',
            };
        }

        const usedByAssignment = rbacAssignments.some((assignment) =>
            (assignment.roleIds || []).includes(roleId)
            || (assignment.temporaryRoles || []).some((item) => item.roleId === roleId),
        );

        if (usedByAssignment) {
            return {
                allowed: false,
                reason: 'Suppression impossible: rôle encore attribué à des utilisateurs.',
            };
        }

        setRbacRoles((prev) => prev.filter((entry) => entry.id !== roleId));

        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: roleId,
            targetName: target.name,
            description: `Rôle RBAC supprimé (${target.name})`,
            metadata: {
                source: 'rbac_roles',
                roleId: roleId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacAssignments, rbacGroups, rbacRoles]);

    const upsertRbacGroup = useCallback((group: RbacGroup): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const groupId = group.id?.trim() || `group.custom.${Date.now()}`;
        const existing = rbacGroups.find((entry) => entry.id === groupId);
        const normalizedGroup: RbacGroup = {
            ...group,
            id: groupId,
            name: group.name?.trim() || groupId,
            roleIds: uniqueStrings(group.roleIds),
            permissions: group.permissions || [],
            dataScopes: group.dataScopes || [],
        };

        setRbacGroups((prev) => {
            if (existing) {
                return prev.map((entry) => (entry.id === groupId ? normalizedGroup : entry));
            }
            return [...prev, normalizedGroup];
        });

        logEvent({
            type: existing ? 'UPDATE' : 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: groupId,
            targetName: normalizedGroup.name,
            description: existing ? `Groupe RBAC mis à jour (${normalizedGroup.name})` : `Nouveau groupe RBAC créé (${normalizedGroup.name})`,
            metadata: {
                source: 'rbac_groups',
                groupId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacGroups]);

    const deleteRbacGroup = useCallback((groupId: string): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const target = rbacGroups.find((entry) => entry.id === groupId);
        if (!target) {
            return { allowed: false, reason: 'Groupe introuvable.' };
        }

        const assigned = rbacAssignments.some((assignment) => (assignment.groupIds || []).includes(groupId));
        if (assigned) {
            return {
                allowed: false,
                reason: 'Suppression impossible: groupe encore assigné à des utilisateurs.',
            };
        }

        setRbacGroups((prev) => prev.filter((entry) => entry.id !== groupId));

        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: groupId,
            targetName: target.name,
            description: `Groupe RBAC supprimé (${target.name})`,
            metadata: {
                source: 'rbac_groups',
                groupId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacAssignments, rbacGroups]);

    const upsertRbacWorkflow = useCallback((workflow: WorkflowDefinition): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const workflowId = workflow.id?.trim() || `workflow.custom.${Date.now()}`;
        const existing = rbacWorkflows.find((entry) => entry.id === workflowId);
        const normalizedWorkflow: WorkflowDefinition = {
            ...workflow,
            id: workflowId,
            name: workflow.name?.trim() || workflowId,
            steps: workflow.steps || [],
            enabled: workflow.enabled !== false,
        };

        setRbacWorkflows((prev) => {
            if (existing) {
                return prev.map((entry) => (entry.id === workflowId ? normalizedWorkflow : entry));
            }
            return [...prev, normalizedWorkflow];
        });

        logEvent({
            type: existing ? 'UPDATE' : 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: workflowId,
            targetName: normalizedWorkflow.name,
            description: existing ? `Workflow RBAC mis à jour (${normalizedWorkflow.name})` : `Nouveau workflow RBAC créé (${normalizedWorkflow.name})`,
            metadata: {
                source: 'rbac_workflows',
                workflowId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacWorkflows]);

    const deleteRbacWorkflow = useCallback((workflowId: string): BusinessRuleDecision => {
        const decision = canManageRbacConfig();
        if (!decision.allowed) return decision;

        const target = rbacWorkflows.find((entry) => entry.id === workflowId);
        if (!target) {
            return { allowed: false, reason: 'Workflow introuvable.' };
        }

        setRbacWorkflows((prev) => prev.filter((entry) => entry.id !== workflowId));

        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: workflowId,
            targetName: target.name,
            description: `Workflow RBAC supprimé (${target.name})`,
            metadata: {
                source: 'rbac_workflows',
                workflowId,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacConfig, currentUser, logEvent, rbacWorkflows]);

    const upsertUserRbacAssignment = useCallback((
        userId: string,
        updates: Partial<Omit<UserAccessAssignment, 'userId'>>,
    ): BusinessRuleDecision => {
        const decision = canManageRbacAssignments();
        if (!decision.allowed) return decision;

        const targetUser = users.find((entry) => entry.id === userId);
        if (!targetUser) {
            return {
                allowed: false,
                reason: 'Utilisateur introuvable.',
            };
        }

        if (targetUser.role === 'SuperAdmin' && currentUser?.role !== 'SuperAdmin') {
            return {
                allowed: false,
                reason: 'Seul un SuperAdmin peut modifier les assignations RBAC d’un SuperAdmin.',
            };
        }

        const seedAssignment = sanitizeAssignment(buildRbacAssignmentFromUser(targetUser));
        const existing = rbacAssignments.find((entry) => entry.userId === userId);

        const nextAssignment = sanitizeAssignment({
            ...(existing || seedAssignment),
            ...updates,
            userId,
            roleIds: updates.roleIds !== undefined
                ? uniqueStrings(updates.roleIds)
                : uniqueStrings((existing || seedAssignment).roleIds),
            groupIds: updates.groupIds !== undefined
                ? uniqueStrings(updates.groupIds)
                : uniqueStrings((existing || seedAssignment).groupIds),
            directPermissions: updates.directPermissions !== undefined
                ? updates.directPermissions
                : ((existing || seedAssignment).directPermissions || []),
            temporaryRoles: updates.temporaryRoles !== undefined
                ? updates.temporaryRoles
                : ((existing || seedAssignment).temporaryRoles || []),
            dataScopeOverrides: updates.dataScopeOverrides !== undefined
                ? updates.dataScopeOverrides
                : ((existing || seedAssignment).dataScopeOverrides || []),
            authPolicyOverride: {
                ...((existing || seedAssignment).authPolicyOverride || {}),
                ...(updates.authPolicyOverride || {}),
            },
        });

        setRbacAssignments((prev) => {
            if (existing) {
                return prev.map((entry) => (entry.userId === userId ? nextAssignment : entry));
            }
            return [...prev, nextAssignment];
        });

        logEvent({
            type: existing ? 'UPDATE' : 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'Admin',
            targetType: 'USER',
            targetId: userId,
            targetName: targetUser.name,
            description: existing
                ? `Assignation RBAC mise à jour pour ${targetUser.name}`
                : `Assignation RBAC créée pour ${targetUser.name}`,
            metadata: {
                source: 'rbac_assignments',
                roleIds: nextAssignment.roleIds,
                groupIds: nextAssignment.groupIds,
            },
            isSystem: false,
            isSensitive: true,
        });

        return { allowed: true };
    }, [canManageRbacAssignments, currentUser, logEvent, rbacAssignments, users]);

    const assignManagerToService = useCallback((serviceName: string, managerId: string) => {
        const permissionDecision = canManageLocationsByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        setServiceManagers(prev => ({ ...prev, [serviceName]: managerId }));

        // OPTIONNEL : Mettre à jour rétroactivement les utilisateurs existants de ce service ?
        // Pour l'instant, on laisse l'existant tel quel, la règle s'applique aux nouveaux/modifiés.
    }, []);

    const addUser = useCallback((user: User): BusinessRuleDecision => {
        const permissionDecision = canManageUsersByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return permissionDecision;
        }

        if (user.role === 'SuperAdmin' && currentUser?.role !== 'SuperAdmin') {
            return {
                allowed: false,
                reason: 'Seul un SuperAdmin peut créer un compte SuperAdmin.',
            };
        }

        const newId = Date.now().toString();

        // AUTOMATIC MANAGER ASSIGNMENT
        const finalUser = user.department && serviceManagers[user.department]
            ? { ...user, id: newId, managerId: serviceManagers[user.department] }
            : { ...user, id: newId };

        logEvent({
            type: 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: newId,
            targetName: user.name,
            description: `Création de l'utilisateur ${user.name}`,
            isSystem: false,
            isSensitive: false
        });

        // LOGIQUE DE NOTIFICATION AUTOMATIQUE AU MANAGER
        if (finalUser.managerId) {
            const manager = users.find(u => u.id === finalUser.managerId);
            if (manager) {
                logEvent({
                    type: 'UPDATE', // Utilisation d'un type générique pour "Notification système"
                    actorId: 'system',
                    actorName: 'Système',
                    actorRole: 'SuperAdmin',
                    targetType: 'USER',
                    targetId: finalUser.managerId,
                    targetName: manager.name,
                    description: `Notification d'effectif : ${finalUser.name} a rejoint l'équipe de ${manager.name} (Service: ${finalUser.department}).`,
                    isSystem: true,
                    isSensitive: false
                });
            }
        }

        setUsers(prev => [...prev, finalUser]);
        return { allowed: true };
    }, [currentUser, logEvent, users, serviceManagers]);

    const updateUser = useCallback((id: string, updates: Partial<User>): BusinessRuleDecision => {
        const permissionDecision = canManageUsersByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return permissionDecision;
        }

        const oldUser = users.find(u => u.id === id);
        if (!oldUser) {
            return { allowed: false, reason: 'Utilisateur introuvable.' };
        }

        const finalUpdates = updates.department && serviceManagers[updates.department]
            ? { ...updates, managerId: serviceManagers[updates.department] }
            : { ...updates };

        const hasActiveApprovals = approvals.some((approval) =>
            ACTIVE_APPROVAL_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );
        const hasPendingManagerValidations = approvals.some((approval) =>
            MANAGER_VALIDATION_PENDING_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );

        const updateDecision = canUpdateUserByBusinessRule({
            user: oldUser,
            updates: finalUpdates,
            hasActiveApprovals,
            hasPendingManagerValidations,
            actorRole: currentUser?.role,
        });
        if (!updateDecision.allowed) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'SuperAdmin',
                targetType: 'USER',
                targetId: id,
                targetName: oldUser.name,
                description: `Mise à jour refusée pour ${oldUser.name}`,
                metadata: {
                    reason: updateDecision.reason,
                    attemptedUpdates: finalUpdates,
                },
                isSystem: false,
                isSensitive: true,
            });
            return updateDecision;
        }

        logEvent({
            type: 'UPDATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: id,
            targetName: oldUser.name,
            description: `Mise à jour du profil de ${oldUser.name}`,
            isSystem: false,
            isSensitive: false
        });

        // Nouvelle notif si changement de département/manager
        if (finalUpdates.managerId && finalUpdates.managerId !== oldUser.managerId) {
            const newManager = users.find(u => u.id === finalUpdates.managerId);
            if (newManager) {
                logEvent({
                    type: 'UPDATE',
                    actorId: 'system',
                    actorName: 'Système',
                    actorRole: 'SuperAdmin',
                    targetType: 'USER',
                    targetId: finalUpdates.managerId,
                    targetName: newManager.name,
                    description: `Notification d'effectif : ${oldUser.name} a rejoint l'équipe de ${newManager.name}.`,
                    isSystem: true,
                    isSensitive: false
                });
            }
        }
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...finalUpdates } : u));
        return { allowed: true };
    }, [users, approvals, currentUser, logEvent, serviceManagers]);

    const deleteUser = useCallback((id: string): BusinessRuleDecision => {
        const permissionDecision = canManageUsersByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return permissionDecision;
        }

        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) {
            return { allowed: false, reason: 'Utilisateur introuvable.' };
        }

        const hasEquipment = equipment.some(e => e.user?.id === id || e.user?.name === userToDelete.name);
        const hasActiveApprovals = approvals.some((approval) =>
            ACTIVE_APPROVAL_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );
        const activeSuperAdminCount = users.filter(
            (existingUser) => existingUser.role === 'SuperAdmin' && existingUser.status !== 'inactive',
        ).length;
        const deleteDecision = canDeleteUserByBusinessRule({
            hasAssignedEquipment: hasEquipment,
            hasActiveApprovals,
            actorRole: currentUser?.role,
            targetRole: userToDelete.role,
            isSelfDelete: currentUser?.id === id,
            activeSuperAdminCount,
        });
        if (!deleteDecision.allowed) {
            return deleteDecision;
        }

        setUsers(prev => prev.filter(u => u.id !== id));

        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: id,
            targetName: userToDelete.name,
            description: `Suppression de l'utilisateur ${userToDelete.name}`,
            isSystem: false,
            isSensitive: false
        });
        return { allowed: true };
    }, [users, equipment, approvals, currentUser, logEvent]);

    const addEquipment = useCallback((item: Equipment) => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        const newItem = { ...item, id: item.id || Date.now().toString() };
        setEquipment(prev => [...prev, newItem]);
        logEvent({
            type: 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'EQUIPMENT',
            targetId: newItem.id,
            targetName: newItem.name,
            description: `Création de l'équipement ${newItem.name}`,
            metadata: { snapshot: newItem },
            isSystem: false,
            isSensitive: false
        });
    }, [currentUser, logEvent]);

    // Écrivain équipement interne, SANS garde acteur : réservé aux écritures système déjà
    // autorisées par une règle amont (synchro d'une transition d'approbation validée par
    // canTransitionApprovalStatus — audit §9.0/D15). Ne jamais l'exposer dans le contexte :
    // toute écriture initiée par un acteur passe par updateEquipment, qui porte la garde.
    const applyEquipmentWrite = useCallback((id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => {
        const oldItem = equipment.find(e => e.id === id);
        if (oldItem) {
            const nextItem = { ...oldItem, ...updates };
            const oldUserId = oldItem.user?.id;
            const nextUserId = nextItem.user?.id;
            const nextUserName = nextItem.user?.name || 'utilisateur';
            let eventType: HistoryEvent['type'] = 'UPDATE';
            let description = `Mise à jour équipement`;
            const metadata: Record<string, unknown> = {
                ...(logMetadata || {}),
                fromStatus: oldItem.status,
                toStatus: nextItem.status,
                fromAssignmentStatus: oldItem.assignmentStatus || 'NONE',
                toAssignmentStatus: nextItem.assignmentStatus || 'NONE',
            };
            if (nextUserId) {
                metadata.beneficiaryId = nextUserId;
                metadata.beneficiaryName = nextUserName;
            }
            if (oldUserId && oldUserId !== nextUserId) {
                metadata.previousUserId = oldUserId;
                metadata.previousUser = oldItem.user?.name || null;
            }

            if (!oldUserId && nextUserId) {
                if (nextItem.assignmentStatus === 'CONFIRMED' || nextItem.status === 'Attribué') {
                    eventType = 'ASSIGN_CONFIRMED';
                    description = `Équipement attribué à ${nextUserName}`;
                } else if (nextItem.assignmentStatus === 'WAITING_MANAGER_APPROVAL') {
                    eventType = 'ASSIGN_MANAGER_WAIT';
                    description = `Attribution initiée pour ${nextUserName} (validation manager requise)`;
                } else if (nextItem.assignmentStatus === 'WAITING_DOTATION_APPROVAL') {
                    eventType = 'ASSIGN_DOTATION_WAIT';
                    description = `Équipement proposé pour ${nextUserName} (validation de dotation en attente)`;
                } else {
                    eventType = 'ASSIGN_PENDING';
                    description = `Attribution initiée pour ${nextUserName}`;
                }
            } else if (oldUserId && !nextUserId) {
                eventType = 'RETURN';
                if (oldItem.assignmentStatus === 'PENDING_RETURN') {
                    description = nextItem.status === 'En réparation'
                        ? `Restitution inspectée: équipement orienté en réparation`
                        : `Restitution inspectée: équipement remis en stock`;
                } else {
                    description = `Retour de l'équipement (${oldItem.user?.name || 'utilisateur'})`;
                }
            } else if (oldItem.status !== 'En réparation' && nextItem.status === 'En réparation') {
                eventType = 'REPAIR_START';
                description = `Entrée en maintenance`;
            } else if (oldItem.status === 'En réparation' && nextItem.status !== 'En réparation') {
                eventType = 'REPAIR_END';
                description = `Fin de maintenance`;
            } else if (oldItem.assignmentStatus !== nextItem.assignmentStatus) {
                if (nextItem.assignmentStatus === 'WAITING_MANAGER_APPROVAL') {
                    eventType = 'ASSIGN_MANAGER_WAIT';
                    description = `En attente de validation manager`;
                } else if (nextItem.assignmentStatus === 'WAITING_IT_PROCESSING') {
                    eventType = 'ASSIGN_IT_PROCESSING';
                    description = `Validation manager reçue, traitement IT en cours`;
                } else if (nextItem.assignmentStatus === 'WAITING_DOTATION_APPROVAL') {
                    eventType = 'ASSIGN_DOTATION_WAIT';
                    description = `En attente de validation de dotation`;
                } else if (nextItem.assignmentStatus === 'PENDING_DELIVERY') {
                    eventType = 'ASSIGN_PENDING';
                    description = `En attente de confirmation utilisateur`;
                } else if (nextItem.assignmentStatus === 'PENDING_RETURN') {
                    eventType = 'RETURN';
                    description = `Restitution initiée, en attente d'inspection IT`;
                    if (nextUserId) {
                        metadata.beneficiaryId = nextUserId;
                        metadata.beneficiaryName = nextUserName;
                    }
                } else if (nextItem.assignmentStatus === 'CONFIRMED') {
                    eventType = 'ASSIGN_CONFIRMED';
                    description = `Réception confirmée par l'utilisateur`;
                    if (nextUserId) {
                        metadata.beneficiaryId = nextUserId;
                        metadata.beneficiaryName = nextUserName;
                    }
                }
            } else if (oldItem.status !== nextItem.status) {
                description = `Statut modifié: ${oldItem.status} → ${nextItem.status}`;
            } else if (oldItem.user?.id !== nextItem.user?.id) {
                description = nextItem.user
                    ? `Réaffectation vers ${nextItem.user.name}`
                    : `Utilisateur retiré`;
            }

            logEvent({
                type: eventType,
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'SuperAdmin',
                targetType: 'EQUIPMENT',
                targetId: id,
                targetName: oldItem.name,
                description,
                metadata,
                isSystem: false,
                isSensitive: false
            });
        }
        setEquipment(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, [equipment, currentUser, logEvent]);

    const updateEquipment = useCallback((id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }
        applyEquipmentWrite(id, updates, logMetadata);
    }, [applyEquipmentWrite]);

    const deleteEquipment = useCallback((id: string) => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) return false;

        const itemToDelete = equipment.find(e => e.id === id);
        if (!itemToDelete) return false;

        const hasBusinessHistory = events.some((event) =>
            event.targetType === 'EQUIPMENT'
            && event.targetId === id
            && event.type !== 'CREATE',
        );
        const decision = canDeleteEquipmentByBusinessRule(itemToDelete, hasBusinessHistory);
        if (!decision.allowed) return false;

        setEquipment(prev => prev.filter(e => e.id !== id));
        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'EQUIPMENT',
            targetId: id,
            targetName: itemToDelete.name,
            description: `Suppression de l'équipement ${itemToDelete.name}`,
            isSystem: false,
            isSensitive: false,
        });
        return true;
    }, [equipment, events, currentUser, logEvent]);

    const upsertEquipmentFromAuditScan = useCallback((
        payload: AuditScanPayload,
        scope: { country: string; site: string; service: string },
    ): AuditScanResult => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return {
                ok: false,
                message: permissionDecision.reason || 'Action refusée: permissions insuffisantes.',
            };
        }

        const scopedCountry = scope.country?.trim();
        const scopedSite = scope.site?.trim();
        const scopedService = scope.service?.trim();
        const scannedAt = payload.scannedAt || new Date().toISOString();

        const byAssetId = normalizeMatch(payload.assetId);
        const bySerial = normalizeMatch(payload.serialNumber);
        const byHostname = normalizeMatch(payload.hostname || payload.machineName);

        const existing = equipment.find((item) => {
            if (byAssetId && normalizeMatch(item.assetId) === byAssetId) return true;
            if (bySerial && normalizeMatch(item.serialNumber) === bySerial) return true;
            if (byHostname && normalizeMatch(item.hostname || item.name) === byHostname) return true;
            return false;
        });

        const scannedUserName = payload.userName?.trim();
        const scannedUserEmail = payload.userEmail?.trim().toLowerCase();
        const matchedUser = users.find((user) =>
            (scannedUserEmail && user.email.toLowerCase() === scannedUserEmail)
            || (scannedUserName && normalizeMatch(user.name) === normalizeMatch(scannedUserName)),
        );
        const scannedUser = scannedUserName || scannedUserEmail
            ? {
                id: matchedUser?.id,
                name: scannedUserName || matchedUser?.name || scannedUserEmail || 'Utilisateur détecté',
                email: scannedUserEmail || matchedUser?.email || '',
                avatar: matchedUser?.avatar || buildScanAvatar(scannedUserName || scannedUserEmail || 'user'),
            }
            : null;

        if (existing) {
            const updates: Partial<Equipment> = {};

            if (payload.machineName && payload.machineName !== existing.name) updates.name = payload.machineName;
            if (payload.assetId && payload.assetId !== existing.assetId) updates.assetId = payload.assetId;
            if (payload.hostname && payload.hostname !== existing.hostname) updates.hostname = payload.hostname;
            if (payload.serialNumber && payload.serialNumber !== existing.serialNumber) updates.serialNumber = payload.serialNumber;
            if (payload.biosUuid && payload.biosUuid !== existing.biosUuid) updates.biosUuid = payload.biosUuid;
            if (payload.macAddress && payload.macAddress !== existing.macAddress) updates.macAddress = payload.macAddress;
            if (payload.os && payload.os !== existing.os) updates.os = payload.os;
            if (payload.ram && payload.ram !== existing.ram) updates.ram = payload.ram;
            if (payload.storage && payload.storage !== existing.storage) updates.storage = payload.storage;
            if (payload.model && payload.model !== existing.model) updates.model = payload.model;
            if (payload.type && payload.type !== existing.type) updates.type = payload.type;

            if (scannedUser) {
                const previousName = existing.user?.name || '';
                const previousEmail = existing.user?.email || '';
                if (
                    normalizeMatch(previousName) !== normalizeMatch(scannedUser.name)
                    || normalizeMatch(previousEmail) !== normalizeMatch(scannedUser.email)
                ) {
                    updates.user = scannedUser;
                }
            }

            if (payload.agents) {
                const previousAgents = existing.securityAgents || {
                    sentinelOne: false,
                    matrix42: false,
                    manageEngine: false,
                    lastCheckedAt: scannedAt,
                };
                updates.securityAgents = {
                    sentinelOne: payload.agents.sentinelOne ?? previousAgents.sentinelOne,
                    matrix42: payload.agents.matrix42 ?? previousAgents.matrix42,
                    manageEngine: payload.agents.manageEngine ?? previousAgents.manageEngine,
                    lastCheckedAt: scannedAt,
                };
            }

            const wasUpdated = Object.keys(updates).length > 0;
            if (wasUpdated) {
                updateEquipment(existing.id, updates, {
                    source: 'audit_scan',
                    scannedAt,
                    scopeCountry: scopedCountry,
                    scopeSite: scopedSite,
                    scopeService: scopedService,
                });
            }

            const serviceMatches =
                normalizeMatch(existing.country) === normalizeMatch(scopedCountry)
                && normalizeMatch(existing.site) === normalizeMatch(scopedSite)
                && normalizeMatch(existing.department) === normalizeMatch(scopedService);

            return {
                ok: true,
                resolution: serviceMatches ? 'found_in_service' : 'found_out_of_service',
                equipmentId: existing.id,
                equipmentName: existing.name,
                serviceMatches,
                wasUpdated,
                message: serviceMatches
                    ? `Machine retrouvée dans le bon service (${scopedService}).`
                    : `Machine détectée mais rattachée à un autre service (${existing.department || 'Non défini'}).`,
            };
        }

        const now = new Date().toISOString();
        const generatedId = `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const generatedAssetId = payload.assetId || `ASSET-SCAN-${Date.now().toString().slice(-6)}`;
        const generatedName = payload.machineName || payload.hostname || generatedAssetId;

        const newEquipment: Equipment = {
            id: generatedId,
            name: generatedName,
            assetId: generatedAssetId,
            type: payload.type || 'Laptop',
            model: payload.model || payload.os || 'Machine détectée',
            status: 'Disponible',
            assignmentStatus: 'NONE',
            image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop',
            user: scannedUser,
            serialNumber: payload.serialNumber,
            biosUuid: payload.biosUuid,
            macAddress: payload.macAddress,
            hostname: payload.hostname || payload.machineName,
            os: payload.os,
            ram: payload.ram,
            storage: payload.storage,
            country: scopedCountry,
            site: scopedSite,
            department: scopedService,
            securityAgents: {
                sentinelOne: payload.agents?.sentinelOne ?? false,
                matrix42: payload.agents?.matrix42 ?? false,
                manageEngine: payload.agents?.manageEngine ?? false,
                lastCheckedAt: scannedAt,
            },
            notes: `Ajouté automatiquement via scan QR d'audit le ${new Date(now).toLocaleString('fr-FR')}.`,
        };

        setEquipment((prev) => [newEquipment, ...prev]);
        logEvent({
            type: 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'EQUIPMENT',
            targetId: newEquipment.id,
            targetName: newEquipment.name,
            description: `Nouvel équipement ajouté depuis scan QR d'audit`,
            metadata: {
                source: 'audit_scan',
                scopeCountry: scopedCountry,
                scopeSite: scopedSite,
                scopeService: scopedService,
            },
            isSystem: false,
            isSensitive: false,
        });

        return {
            ok: true,
            resolution: 'created',
            equipmentId: newEquipment.id,
            equipmentName: newEquipment.name,
            serviceMatches: true,
            wasUpdated: true,
            message: `Nouvelle machine ajoutée au stock (${newEquipment.assetId}).`,
        };
    }, [currentUser, equipment, logEvent, updateEquipment, users]);

    const ingestAgentCheckIn = useCallback((payload: AgentCheckInPayload): AgentCheckInResult => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return {
                ok: false,
                message: permissionDecision.reason || 'Action refusée: permissions insuffisantes.',
            };
        }

        const now = payload.scannedAt || new Date().toISOString();
        const source = payload.source || 'agent';
        const sourceEnabled =
            (source === 'agent' && settings.autoCollectionAgentEnabled)
            || (source === 'active_directory' && settings.autoCollectionAdEnabled)
            || (source === 'network_scan' && settings.autoCollectionNetworkEnabled);
        if (!sourceEnabled) {
            return {
                ok: false,
                message: `Collecte ${source} désactivée dans les paramètres.`,
            };
        }

        if (source === 'agent') {
            const expectedApiKey = settings.autoCollectionAgentApiKey.trim();
            const payloadApiKey = (payload.apiKey || '').trim();
            if (!payloadApiKey || payloadApiKey !== expectedApiKey) {
                return {
                    ok: false,
                    message: 'Check-in agent rejeté: clé API invalide ou absente.',
                };
            }
        }

        const fingerprint = buildDetectedFingerprint(payload);

        const matchCandidates = resolveEquipmentMatchCandidates(payload, equipment);
        const topCandidate = matchCandidates[0];
        const secondCandidate = matchCandidates[1];
        const isAmbiguous = Boolean(
            topCandidate
            && secondCandidate
            && topCandidate.score >= 70
            && Math.abs(topCandidate.score - secondCandidate.score) <= 10,
        );

        let matchConfidence: DetectedDevice['matchConfidence'] = 'none';
        let linkedEquipment: Equipment | undefined;
        if (isAmbiguous) {
            matchConfidence = 'ambiguous';
        } else if (topCandidate && topCandidate.score >= 85) {
            matchConfidence = 'strong';
            linkedEquipment = topCandidate.equipment;
        } else if (topCandidate && topCandidate.score >= 60) {
            matchConfidence = 'weak';
            linkedEquipment = topCandidate.equipment;
        }

        const existing = detectedDevices.find((item) => item.fingerprint === fingerprint);
        const detectedId = existing?.id || `detected_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        let nextStatus: DetectedDevice['status'] =
            matchConfidence === 'strong'
                ? 'linked_existing'
                : matchConfidence === 'ambiguous'
                    ? 'ambiguous_match'
                    : 'pending_review';
        const machineName = payload.machineName || payload.hostname || payload.assetId || existing?.machineName || 'Machine détectée';
        let linkedEquipmentId = linkedEquipment?.id || existing?.linkedEquipmentId;
        let autoImportResult: AuditScanResult | null = null;
        const candidateEquipmentIds = matchCandidates.slice(0, 3).map((entry) => entry.equipment.id);

        const canAutoImport =
            !settings.autoCollectionRequireManualValidation
            && (matchConfidence === 'strong' || matchConfidence === 'none');

        if (canAutoImport) {
            const fallbackCountry = payload.country || linkedEquipment?.country || existing?.country || 'France';
            const targetScope = {
                country: payload.country || linkedEquipment?.country || existing?.country || 'France',
                site: payload.site || linkedEquipment?.site || existing?.site || DEFAULT_SITE_BY_COUNTRY[fallbackCountry] || 'Bureau Paris',
                service: payload.service || linkedEquipment?.department || existing?.service || DEFAULT_DEPARTMENT_BY_COUNTRY[fallbackCountry] || 'IT HQ',
            };

            autoImportResult = upsertEquipmentFromAuditScan({
                ...payload,
                machineName,
                scannedAt: now,
            }, targetScope);

            if (autoImportResult.ok) {
                nextStatus = 'imported';
                matchConfidence = linkedEquipment ? 'strong' : 'none';
                linkedEquipmentId = autoImportResult.equipmentId;
            }
        }

        const nextDevice: DetectedDevice = {
            id: detectedId,
            source,
            fingerprint,
            machineName,
            hostname: payload.hostname || existing?.hostname,
            assetId: payload.assetId || existing?.assetId,
            serialNumber: payload.serialNumber || existing?.serialNumber,
            biosUuid: payload.biosUuid || existing?.biosUuid,
            os: payload.os || existing?.os,
            ram: payload.ram || existing?.ram,
            storage: payload.storage || existing?.storage,
            cpu: payload.cpu || existing?.cpu,
            currentUserName: payload.userName || existing?.currentUserName,
            currentUserEmail: payload.userEmail || existing?.currentUserEmail,
            macAddress: payload.macAddress || existing?.macAddress,
            ipAddress: payload.ipAddress || existing?.ipAddress,
            domain: payload.domain || existing?.domain,
            country: payload.country || existing?.country,
            site: payload.site || existing?.site,
            service: payload.service || existing?.service,
            apps: {
                sentinelOne: payload.agents?.sentinelOne ?? existing?.apps.sentinelOne ?? false,
                matrix42: payload.agents?.matrix42 ?? existing?.apps.matrix42 ?? false,
                manageEngine: payload.agents?.manageEngine ?? existing?.apps.manageEngine ?? false,
            },
            status: nextStatus,
            matchConfidence,
            matchScore: topCandidate?.score || 0,
            candidateEquipmentIds,
            linkedEquipmentId,
            firstSeenAt: existing?.firstSeenAt || now,
            lastSeenAt: now,
        };

        setDetectedDevices((prev) => {
            const hasExisting = prev.some((item) => item.id === detectedId);
            if (hasExisting) {
                return prev.map((item) => (item.id === detectedId ? nextDevice : item));
            }
            return [nextDevice, ...prev];
        });

        logEvent({
            type: existing ? 'UPDATE' : 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'SYSTEM',
            targetId: detectedId,
            targetName: machineName,
            description: existing
                ? `Check-in agent mis à jour pour ${machineName}.`
                : `Machine détectée via collecte automatique: ${machineName}.`,
            metadata: {
                source: 'agent_checkin',
                collector: source,
                matchConfidence,
                matchScore: topCandidate?.score || 0,
                candidateEquipmentIds,
                linkedEquipmentId: linkedEquipment?.id,
            },
            isSystem: false,
            isSensitive: false,
        });

        return {
            ok: true,
            detectedId,
            status: nextStatus,
            linkedEquipmentId,
            message: autoImportResult?.ok
                ? `Check-in traité automatiquement. ${autoImportResult.message}`
                : nextStatus === 'ambiguous_match'
                    ? 'Plusieurs équipements candidats: revue IT requise.'
                    : matchConfidence === 'weak'
                        ? 'Correspondance partielle détectée: validation IT requise.'
                        : linkedEquipment
                            ? `Machine liée à l'équipement existant ${linkedEquipment.assetId}.`
                            : 'Machine placée en file "détectées" en attente de validation.',
        };
    }, [currentUser, detectedDevices, equipment, logEvent, settings.autoCollectionAdEnabled, settings.autoCollectionAgentApiKey, settings.autoCollectionAgentEnabled, settings.autoCollectionNetworkEnabled, settings.autoCollectionRequireManualValidation, upsertEquipmentFromAuditScan]);

    const promoteDetectedDeviceToInventory = useCallback((
        detectedDeviceId: string,
        scope?: { country: string; site: string; service: string },
    ): AuditScanResult => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return {
                ok: false,
                message: permissionDecision.reason || 'Action refusée: permissions insuffisantes.',
            };
        }

        const detected = detectedDevices.find((item) => item.id === detectedDeviceId);
        if (!detected) {
            return {
                ok: false,
                message: 'Machine détectée introuvable.',
            };
        }

        if (detected.status === 'ignored') {
            return {
                ok: false,
                message: 'Cette machine est marquée comme ignorée.',
            };
        }

        const fallbackCountry = detected.country || 'France';
        const targetScope = {
            country: scope?.country || detected.country || 'France',
            site: scope?.site || detected.site || DEFAULT_SITE_BY_COUNTRY[fallbackCountry] || 'Bureau Paris',
            service: scope?.service || detected.service || DEFAULT_DEPARTMENT_BY_COUNTRY[fallbackCountry] || 'IT HQ',
        };

        const result = upsertEquipmentFromAuditScan({
            machineName: detected.machineName,
            hostname: detected.hostname,
            assetId: detected.assetId,
            serialNumber: detected.serialNumber,
            biosUuid: detected.biosUuid,
            macAddress: detected.macAddress,
            os: detected.os,
            ram: detected.ram,
            storage: detected.storage,
            userName: detected.currentUserName,
            userEmail: detected.currentUserEmail,
            country: targetScope.country,
            site: targetScope.site,
            service: targetScope.service,
            scannedAt: detected.lastSeenAt,
            agents: {
                sentinelOne: detected.apps.sentinelOne,
                matrix42: detected.apps.matrix42,
                manageEngine: detected.apps.manageEngine,
            },
        }, targetScope);

        if (result.ok) {
            setDetectedDevices((prev) => prev.map((item) => (
                item.id === detectedDeviceId
                    ? {
                        ...item,
                        status: 'imported',
                        linkedEquipmentId: result.equipmentId,
                        country: targetScope.country,
                        site: targetScope.site,
                        service: targetScope.service,
                        lastSeenAt: new Date().toISOString(),
                    }
                    : item
            )));
        }

        return result;
    }, [detectedDevices, upsertEquipmentFromAuditScan]);

    const markDetectedDeviceAsIgnored = useCallback((detectedDeviceId: string): boolean => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) return false;

        let changed = false;
        setDetectedDevices((prev) => prev.map((item) => {
            if (item.id !== detectedDeviceId) return item;
            changed = true;
            return {
                ...item,
                status: 'ignored',
                lastSeenAt: new Date().toISOString(),
            };
        }));

        if (changed) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'SuperAdmin',
                targetType: 'SYSTEM',
                targetId: detectedDeviceId,
                targetName: 'Collecte automatique',
                description: 'Machine détectée ignorée par IT.',
                metadata: {
                    source: 'agent_checkin',
                    action: 'ignored',
                },
                isSystem: false,
                isSensitive: false,
            });
        }

        return changed;
    }, [currentUser, logEvent]);

    const removeEquipmentFromServiceAfterAudit = useCallback((
        equipmentId: string,
        scope: { country: string; site: string; service: string },
    ): boolean => {
        const permissionDecision = canManageInventoryByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return false;
        }

        const item = equipment.find((entry) => entry.id === equipmentId);
        if (!item) return false;

        const note = `Audit: non retrouvé dans ${scope.service} (${scope.site}, ${scope.country}) le ${new Date().toLocaleDateString('fr-FR')}. Requalification IT requise.`;
        const mergedNotes = item.notes ? `${item.notes}\n${note}` : note;

        updateEquipment(
            equipmentId,
            {
                department: undefined,
                status: 'Manquant',
                notes: mergedNotes,
            },
            {
                source: 'audit_finalize',
                reason: 'missing_in_service',
                scopeCountry: scope.country,
                scopeSite: scope.site,
                scopeService: scope.service,
            },
        );

        return true;
    }, [equipment, updateEquipment]);

    const updateApproval = useCallback((
        id: string,
        status: ApprovalStatus,
        options?: { assignedEquipmentId?: string; assignedEquipmentName?: string; reason?: string },
    ): BusinessRuleDecision => {
        const oldApproval = approvals.find(a => a.id === id);
        if (!oldApproval) {
            return { allowed: false, reason: 'Demande introuvable.' };
        }

        // Tolérance same-status (re-soumissions du wizard) : succès sans AUCUN effet de bord —
        // ni mise à jour d'équipement ni événement (décision D10, audit §7.1).
        if (oldApproval.status === status) {
            return { allowed: true };
        }

        const transitionDecision = canTransitionApprovalStatus({
            approval: oldApproval,
            nextStatus: status,
            actorRole: currentUser?.role,
            actorId: currentUser?.id,
            users,
        });

        if (!transitionDecision.allowed) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'User',
                targetType: 'APPROVAL',
                targetId: id,
                targetName: `Demande de ${oldApproval.requesterName}`,
                description: `Transition refusée ${oldApproval.status} -> ${status}`,
                metadata: {
                    from: oldApproval.status,
                    to: status,
                    reason: transitionDecision.reason,
                },
                isSystem: false,
                isSensitive: true,
            });
            return transitionDecision;
        }

        // Motif obligatoire aux 4 points de refus (§9.7.2/D18) — garde métier,
        // l'obligation ne peut pas vivre que dans l'UI.
        const reason = options?.reason?.trim() || undefined;
        const refusalKind = getRefusalDecisionKind(oldApproval.status, status);
        if (refusalKind && !reason) {
            return { allowed: false, reason: 'Un motif est requis pour refuser ou renvoyer une demande.' };
        }

        const now = new Date().toISOString();
        // Refus de dotation : le lien équipement est rompu, l'IT repartira d'un choix neuf.
        const isDotationRefusal =
            oldApproval.status === 'WAITING_DOTATION_APPROVAL' && status === 'WAITING_IT_PROCESSING';
        // Dernier verdict négatif seulement : toute transition sans motif de refus
        // (validation, affectation, confirmation) purge la note — sinon un renvoi de
        // dotation resterait affiché après la ré-affectation IT. Le journal garde tout.
        // L'annulation (D17) porte une note si un motif est donné (saisie optionnelle).
        const negativeKind = refusalKind ?? (status === 'Cancelled' ? ('CANCEL' as const) : null);
        const decisionNote = negativeKind && reason
            ? {
                  kind: negativeKind,
                  reason,
                  actorId: currentUser?.id || 'system',
                  actorName: currentUser?.name || 'Système',
                  at: now,
              }
            : undefined;
        setApprovals(prev => prev.map(item => item.id === id
            ? {
                  ...item,
                  status,
                  updatedAt: now,
                  decisionNote,
                  assignedEquipmentId: isDotationRefusal
                      ? undefined
                      : (options?.assignedEquipmentId ?? item.assignedEquipmentId),
                  assignedEquipmentName: isDotationRefusal
                      ? undefined
                      : (options?.assignedEquipmentName ?? item.assignedEquipmentName),
              }
            : item));

        // Synchro équipement des transitions de rangée. Quand l'appelant lie un équipement
        // (wizard d'affectation), il réalise lui-même l'écriture équipement complète
        // (bénéficiaire, assignedBy…) — la synchro s'efface pour ne pas doubler l'écriture
        // ni l'événement d'historique. Discriminer sur assignedEquipmentId, PAS sur la
        // présence d'options : un refus passe désormais { reason } seul (§9.7.2, piège n°1).
        // Écriture système via applyEquipmentWrite : la transition vient d'être autorisée
        // par canTransitionApprovalStatus, or les acteurs nominaux de ces étapes (manager,
        // bénéficiaire) n'ont pas inventory.manage — repasser par la garde acteur
        // d'updateEquipment sautait silencieusement la synchro (§9.0/D15).
        if (!options?.assignedEquipmentId && oldApproval.assignedEquipmentId) {
            const equipmentUpdates = getEquipmentUpdatesForApprovalStatus({
                status,
                previousStatus: oldApproval.status,
                actorId: currentUser?.id,
                nowISO: now,
            });

            if (equipmentUpdates) {
                applyEquipmentWrite(oldApproval.assignedEquipmentId, equipmentUpdates, {
                    source: 'approval_workflow',
                    approvalId: id,
                    approvalStatus: status,
                });
            }
        }

        if (oldApproval) {
            let eventType: HistoryEvent['type'] = 'UPDATE';
            // Le refus de dotation partage la cible WAITING_IT_PROCESSING avec la validation
            // manager : discriminer sur (from, to) pour que le journal dise un refus (§9.4-1).
            if (status === 'WAITING_MANAGER_APPROVAL') eventType = 'ASSIGN_MANAGER_WAIT';
            else if (status === 'WAITING_IT_PROCESSING') eventType = isDotationRefusal ? 'APPROVAL_DOTATION_REJECT' : 'APPROVAL_MANAGER';
            else if (status === 'WAITING_DOTATION_APPROVAL') eventType = 'ASSIGN_DOTATION_WAIT';
            else if (status === 'PENDING_DELIVERY') eventType = 'ASSIGN_PENDING';
            else if (status === 'Completed') eventType = 'ASSIGN_CONFIRMED';
            else if (status === 'Rejected') eventType = 'APPROVAL_REJECT';
            else if (status === 'Cancelled') eventType = 'APPROVAL_CANCEL';

            logEvent({
                type: eventType,
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'APPROVAL',
                targetId: id,
                targetName: `Demande de ${oldApproval.requesterName}`,
                description: `Statut mis à jour: ${status}`,
                // L'historique exhaustif des motifs vit ici (renvois successifs inclus) ;
                // Approval.decisionNote ne garde que le dernier état.
                metadata: { from: oldApproval.status, to: status, ...(reason ? { reason } : {}) },
                isSystem: false,
                isSensitive: false
            });
        }
        return { allowed: true };
    }, [approvals, currentUser, logEvent, applyEquipmentWrite, users]);

    const addApproval = useCallback((approval: Omit<Approval, 'id'>) => {
        const newId = Date.now().toString();
        setApprovals(prev => [{ ...approval, id: newId }, ...prev]);

        logEvent({
            type: 'APPROVAL_CREATE',
            actorId: currentUser?.id || approval.requesterId || 'system',
            actorName: currentUser?.name || approval.requesterName || 'Système',
            actorRole: currentUser?.role || 'User',
            targetType: 'APPROVAL',
            targetId: newId,
            targetName: `Demande ${approval.equipmentCategory}`,
            description: `Nouvelle demande: ${approval.reason}`,
            metadata: { urgency: approval.urgency },
            isSystem: false,
            isSensitive: false
        });
    }, [currentUser, logEvent]);

    // --- Location Management ---
    const addLocation = useCallback((type: 'country' | 'site' | 'service', name: string, parentId?: string) => {
        const permissionDecision = canManageLocationsByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return false;
        }

        let success = false;
        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                if (newData.countries.includes(name)) return prev;
                newData.countries = [...newData.countries, name];
                success = true;
            } else if (type === 'site' && parentId) {
                const currentSites = newData.sites[parentId] || [];
                if (currentSites.includes(name)) return prev;
                newData.sites = { ...newData.sites, [parentId]: [...currentSites, name] };
                success = true;
            } else if (type === 'service' && parentId) {
                const currentServices = newData.services[parentId] || [];
                if (currentServices.includes(name)) return prev;
                newData.services = { ...newData.services, [parentId]: [...currentServices, name] };
                success = true;
            }
            return newData;
        });
        return success;
    }, []);

    const renameLocation = useCallback((type: 'country' | 'site' | 'service', oldName: string, newName: string, parentId?: string) => {
        const permissionDecision = canManageLocationsByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return false;
        }

        let success = false;
        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                if (newData.countries.includes(newName)) return prev;
                newData.countries = newData.countries.map(c => c === oldName ? newName : c);
                if (newData.sites[oldName]) {
                    newData.sites[newName] = newData.sites[oldName];
                    delete newData.sites[oldName];
                }
                success = true;
            } else if (type === 'site' && parentId) {
                const currentSites = newData.sites[parentId] || [];
                if (currentSites.includes(newName)) return prev;
                newData.sites[parentId] = currentSites.map(s => s === oldName ? newName : s);
                if (newData.services[oldName]) {
                    newData.services[newName] = newData.services[oldName];
                    delete newData.services[oldName];
                }
                success = true;
            } else if (type === 'service' && parentId) {
                const currentServices = newData.services[parentId] || [];
                if (currentServices.includes(newName)) return prev;
                newData.services[parentId] = currentServices.map(s => s === oldName ? newName : s);

                // Update service manager key
                if (serviceManagers[oldName]) {
                    setServiceManagers(prevMgr => {
                        const newMgr = { ...prevMgr, [newName]: prevMgr[oldName] };
                        delete newMgr[oldName];
                        return newMgr;
                    });
                }

                success = true;
            }
            return newData;
        });
        return success;
    }, [serviceManagers]);

    const deleteLocation = useCallback((type: 'country' | 'site' | 'service', name: string, parentId?: string) => {
        const permissionDecision = canManageLocationsByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                newData.countries = newData.countries.filter(c => c !== name);
                delete newData.sites[name];
            } else if (type === 'site' && parentId) {
                newData.sites[parentId] = (newData.sites[parentId] || []).filter(s => s !== name);
                delete newData.services[name];
            } else if (type === 'service' && parentId) {
                newData.services[parentId] = (newData.services[parentId] || []).filter(s => s !== name);
                setServiceManagers(prev => {
                    const newMgr = { ...prev };
                    delete newMgr[name];
                    return newMgr;
                });
            }
            return newData;
        });
    }, []);

    const addCategory = useCallback((catData: Omit<Category, 'id'>) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        const newId = Date.now().toString();
        setCategories(prev => [...prev, { ...catData, id: newId }]);
    }, []);
    const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);
    const deleteCategory = useCallback((id: string) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return false;
        }

        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
    }, []);
    const addModel = useCallback((modelData: Omit<Model, 'id'>) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        const newId = Date.now().toString();
        setModels(prev => [...prev, { ...modelData, id: newId }]);
    }, []);
    const updateModel = useCallback((id: string, updates: Partial<Model>) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return;
        }

        setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, []);
    const deleteModel = useCallback((id: string) => {
        const permissionDecision = canManageSystemByRole(currentUserAccessRef.current);
        if (!permissionDecision.allowed) {
            return false;
        }

        setModels(prev => prev.filter(m => m.id !== id));
        return true;
    }, []);

    const contextValue = useMemo(() => ({
        users,
        equipment,
        detectedDevices,
        categories,
        models,
        approvals,
        events,
        locationData,
        serviceManagers, // Exposed
        settings,
        rbacRoles,
        rbacGroups,
        rbacAssignments,
        rbacWorkflows,
        addUser,
        updateUser,
        deleteUser,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        upsertEquipmentFromAuditScan,
        ingestAgentCheckIn,
        promoteDetectedDeviceToInventory,
        markDetectedDeviceAsIgnored,
        removeEquipmentFromServiceAfterAudit,
        updateApproval,
        addApproval,
        logEvent,
        addLocation,
        renameLocation,
        deleteLocation,
        assignManagerToService, // Exposed
        addCategory,
        updateCategory,
        deleteCategory,
        addModel,
        updateModel,
        deleteModel,
        updateSettings,
        getRbacAssignmentForUser,
        getEffectiveAccessForUser,
        upsertRbacRole,
        deleteRbacRole,
        upsertRbacGroup,
        deleteRbacGroup,
        upsertRbacWorkflow,
        deleteRbacWorkflow,
        upsertUserRbacAssignment,
    }), [users, equipment, detectedDevices, categories, models, approvals, events, locationData, serviceManagers, settings, rbacRoles, rbacGroups, rbacAssignments, rbacWorkflows, addUser, updateUser, deleteUser, addEquipment, updateEquipment, deleteEquipment, upsertEquipmentFromAuditScan, ingestAgentCheckIn, promoteDetectedDeviceToInventory, markDetectedDeviceAsIgnored, removeEquipmentFromServiceAfterAudit, updateApproval, addApproval, logEvent, addLocation, renameLocation, deleteLocation, assignManagerToService, addCategory, updateCategory, deleteCategory, addModel, updateModel, deleteModel, updateSettings, getRbacAssignmentForUser, getEffectiveAccessForUser, upsertRbacRole, deleteRbacRole, upsertRbacGroup, deleteRbacGroup, upsertRbacWorkflow, deleteRbacWorkflow, upsertUserRbacAssignment]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

