import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../types';
import { mockAllUsersExtended, mockAllEquipment, mockLocationCountries, mockPendingApprovals, mockApprovalHistory, mockHistoryEvents, mockCategories, mockModels, CATEGORY_ICONS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { applyMd3Theme } from '../lib/md3Theme';
import { getPersistedValue } from '../lib/persistence';
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
    categories: Category[];
    models: Model[];
    approvals: Approval[];
    events: HistoryEvent[];
    locationData: LocationData;
    serviceManagers: Record<string, string>; // NOUVEAU: Mapping Service Name -> Manager ID
    settings: AppSettings;

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
    removeEquipmentFromServiceAfterAudit: (
        equipmentId: string,
        scope: { country: string; site: string; service: string },
    ) => boolean;
    updateApproval: (id: string, status: ApprovalStatus) => BusinessRuleDecision;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    accentColor: 'yellow',
    currency: 'XOF',
    fiscalYearStart: '01',
    defaultDepreciationMethod: 'linear',
    defaultDepreciationYears: 3,
    salvageValuePercent: 0,
    renewalThreshold: 85,
    roundingRule: 'standard',
    compactNotation: false
};

const STORAGE_KEYS = {
    settings: { current: 'tracker_settings', legacy: 'neemba_settings' },
    users: { current: 'tracker_users', legacy: 'neemba_users' },
    equipment: { current: 'tracker_equipment', legacy: 'neemba_equipment' },
    categories: { current: 'tracker_categories', legacy: 'neemba_categories' },
    models: { current: 'tracker_models', legacy: 'neemba_models' },
    events: { current: 'tracker_events', legacy: 'neemba_events' },
    serviceManagers: { current: 'tracker_service_managers', legacy: 'neemba_service_managers' },
} as const;

const extractPersistedIds = (items: unknown[]): Set<string> => {
    const ids = items
        .map((item) => {
            if (typeof item !== 'object' || item === null || !('id' in item)) return undefined;
            const rawId = (item as { id?: unknown }).id;
            return typeof rawId === 'string' ? rawId : undefined;
        })
        .filter((id): id is string => typeof id === 'string');

    return new Set(ids);
};

const normalizeMatch = (value?: string) => (value || '').trim().toLowerCase();

const buildScanAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'user')}`;

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
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const merged = [...parsed];
                    const ids = extractPersistedIds(parsed);
                    mockAllUsersExtended.forEach(seedUser => {
                        if (!ids.has(seedUser.id)) {
                            merged.push(seedUser);
                        }
                    });
                    return merged;
                }
            }
            return mockAllUsersExtended;
        } catch {
            return mockAllUsersExtended;
        }
    });

    const [equipment, setEquipment] = useState<Equipment[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.equipment.current, STORAGE_KEYS.equipment.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const merged = [...parsed];
                    const ids = extractPersistedIds(parsed);
                    mockAllEquipment.forEach(seedEquipment => {
                        if (!ids.has(seedEquipment.id)) {
                            merged.push(seedEquipment);
                        }
                    });
                    return merged;
                }
            }
            return mockAllEquipment;
        } catch {
            return mockAllEquipment;
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
    const [approvals, setApprovals] = useState<Approval[]>([...mockPendingApprovals, ...mockApprovalHistory]);

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

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.users.current, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.equipment.current, JSON.stringify(equipment));
    }, [equipment]);

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

    // --- THEME & ACCENT COLOR APPLICATION ---
    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const syncTheme = () => {
            applyMd3Theme({
                root,
                accentColor: settings.accentColor,
                themeMode: settings.theme,
                prefersDark: mediaQuery.matches,
            });
        };

        syncTheme();

        if (settings.theme !== 'system') {
            return;
        }

        const onSystemThemeChange = () => syncTheme();
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', onSystemThemeChange);
            return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
        }

        mediaQuery.addListener(onSystemThemeChange);
        return () => mediaQuery.removeListener(onSystemThemeChange);
    }, [settings.accentColor, settings.theme]);

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

    const assignManagerToService = useCallback((serviceName: string, managerId: string) => {
        const permissionDecision = canManageLocationsByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

        setServiceManagers(prev => ({ ...prev, [serviceName]: managerId }));

        // OPTIONNEL : Mettre à jour rétroactivement les utilisateurs existants de ce service ?
        // Pour l'instant, on laisse l'existant tel quel, la règle s'applique aux nouveaux/modifiés.
    }, [currentUser?.role]);

    const addUser = useCallback((user: User): BusinessRuleDecision => {
        const permissionDecision = canManageUsersByRole(currentUser?.role);
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
        const permissionDecision = canManageUsersByRole(currentUser?.role);
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
        const permissionDecision = canManageInventoryByRole(currentUser?.role);
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

    const updateEquipment = useCallback((id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => {
        const permissionDecision = canManageInventoryByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

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
                } else if (nextItem.assignmentStatus === 'DISPUTED') {
                    eventType = 'ASSIGN_DISPUTED';
                    description = `Litige utilisateur déclaré`;
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

    const deleteEquipment = useCallback((id: string) => {
        const permissionDecision = canManageInventoryByRole(currentUser?.role);
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
        const permissionDecision = canManageInventoryByRole(currentUser?.role);
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

    const removeEquipmentFromServiceAfterAudit = useCallback((
        equipmentId: string,
        scope: { country: string; site: string; service: string },
    ): boolean => {
        const permissionDecision = canManageInventoryByRole(currentUser?.role);
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
    }, [currentUser?.role, equipment, updateEquipment]);

    const updateApproval = useCallback((id: string, status: ApprovalStatus): BusinessRuleDecision => {
        const oldApproval = approvals.find(a => a.id === id);
        if (!oldApproval) {
            return { allowed: false, reason: 'Demande introuvable.' };
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

        const now = new Date().toISOString();
        setApprovals(prev => prev.map(item => item.id === id ? { ...item, status, requestDate: 'Aujourd\'hui' } : item));

        if (oldApproval?.assignedEquipmentId) {
            const equipmentUpdates = getEquipmentUpdatesForApprovalStatus({
                status,
                actorId: currentUser?.id,
                nowISO: now,
            });

            if (equipmentUpdates) {
                updateEquipment(oldApproval.assignedEquipmentId, equipmentUpdates, {
                    source: 'approval_workflow',
                    approvalId: id,
                    approvalStatus: status,
                });
            }
        }

        if (oldApproval) {
            let eventType: HistoryEvent['type'] = 'UPDATE';
            if (status === 'WAITING_IT_PROCESSING') eventType = 'APPROVAL_MANAGER';
            else if (status === 'Approved') eventType = 'APPROVAL_ADMIN';
            else if (status === 'Rejected') eventType = 'APPROVAL_REJECT';

            logEvent({
                type: eventType,
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'APPROVAL',
                targetId: id,
                targetName: `Demande de ${oldApproval.requesterName}`,
                description: `Statut mis à jour: ${status}`,
                metadata: { from: oldApproval.status, to: status },
                isSystem: false,
                isSensitive: false
            });
        }
        return { allowed: true };
    }, [approvals, currentUser, logEvent, updateEquipment, users]);

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
        const permissionDecision = canManageLocationsByRole(currentUser?.role);
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
    }, [currentUser?.role]);

    const renameLocation = useCallback((type: 'country' | 'site' | 'service', oldName: string, newName: string, parentId?: string) => {
        const permissionDecision = canManageLocationsByRole(currentUser?.role);
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
    }, [currentUser?.role, serviceManagers]);

    const deleteLocation = useCallback((type: 'country' | 'site' | 'service', name: string, parentId?: string) => {
        const permissionDecision = canManageLocationsByRole(currentUser?.role);
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
    }, [currentUser?.role]);

    const addCategory = useCallback((catData: Omit<Category, 'id'>) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

        const newId = Date.now().toString();
        setCategories(prev => [...prev, { ...catData, id: newId }]);
    }, [currentUser?.role]);
    const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, [currentUser?.role]);
    const deleteCategory = useCallback((id: string) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return false;
        }

        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
    }, [currentUser?.role]);
    const addModel = useCallback((modelData: Omit<Model, 'id'>) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

        const newId = Date.now().toString();
        setModels(prev => [...prev, { ...modelData, id: newId }]);
    }, [currentUser?.role]);
    const updateModel = useCallback((id: string, updates: Partial<Model>) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return;
        }

        setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, [currentUser?.role]);
    const deleteModel = useCallback((id: string) => {
        const permissionDecision = canManageSystemByRole(currentUser?.role);
        if (!permissionDecision.allowed) {
            return false;
        }

        setModels(prev => prev.filter(m => m.id !== id));
        return true;
    }, [currentUser?.role]);

    const contextValue = useMemo(() => ({
        users,
        equipment,
        categories,
        models,
        approvals,
        events,
        locationData,
        serviceManagers, // Exposed
        settings,
        addUser,
        updateUser,
        deleteUser,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        upsertEquipmentFromAuditScan,
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
    }), [users, equipment, categories, models, approvals, events, locationData, serviceManagers, settings, addUser, updateUser, deleteUser, addEquipment, updateEquipment, deleteEquipment, upsertEquipmentFromAuditScan, removeEquipmentFromServiceAfterAudit, updateApproval, addApproval, logEvent, addLocation, renameLocation, deleteLocation, assignManagerToService, addCategory, updateCategory, deleteCategory, addModel, updateModel, deleteModel, updateSettings]);

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

