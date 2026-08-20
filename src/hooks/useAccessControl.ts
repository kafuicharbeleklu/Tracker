import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Equipment, User } from '../types';
import { buildRbacAssignmentFromUser, RBAC_PERMISSIONS } from '../config/rbacDefaults';
import { isPermissionGranted, resolveEffectiveAccess } from '../lib/rbac';

export const useAccessControl = () => {
    const { currentUser } = useAuth();
    const { rbacRoles, rbacGroups, getRbacAssignmentForUser } = useData();

    const role = currentUser?.role;

    const effectiveAccess = useMemo(() => {
        if (!currentUser) {
            return resolveEffectiveAccess({
                userId: 'anonymous',
                assignment: { userId: 'anonymous', roleIds: [] },
                roles: rbacRoles,
                groups: rbacGroups,
            });
        }

        const assignment =
            getRbacAssignmentForUser(currentUser.id) || buildRbacAssignmentFromUser(currentUser);

        return resolveEffectiveAccess({
            userId: currentUser.id,
            assignment,
            roles: rbacRoles,
            groups: rbacGroups,
        });
    }, [currentUser, getRbacAssignmentForUser, rbacGroups, rbacRoles]);

    const permissions = {
        // Core views
        canViewDashboard: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.dashboard,
            'read',
        ),

        // Inventory
        canViewInventory: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.inventory,
            'read',
        ),
        canManageInventory: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.inventoryManage,
            'write',
        ),

        // Users
        canViewUsers: isPermissionGranted(effectiveAccess, RBAC_PERMISSIONS.views.users, 'read'),
        canManageUsers: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.usersManage,
            'write',
        ),

        // Approvals — pas de canManageApprovals : les mutations passent par les gates
        // relationnelles de canTransitionApprovalStatus (businessRules), pas par RBAC (D16).
        canViewApprovals: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.approvals,
            'read',
        ),

        // Finance
        canViewFinance: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.finance,
            'read',
        ),
        canManageFinance: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.financeManage,
            'write',
        ),

        // Management (Categories, Models)
        canViewManagement: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.management,
            'read',
        ),
        canManageSystem: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.managementManage,
            'write',
        ),

        // Locations
        canViewLocations: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.views.locations,
            'read',
        ),
        canManageLocations: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.locationsManage,
            'write',
        ),

        // Audit
        canViewAudit: isPermissionGranted(effectiveAccess, RBAC_PERMISSIONS.views.audit, 'read'),
        canScanAudit: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.auditScan,
            'write',
        ),
        canManageAudit: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.auditManage,
            'write',
        ),

        // Reports
        canViewReports:
            isPermissionGranted(effectiveAccess, RBAC_PERMISSIONS.views.reports, 'read') ||
            isPermissionGranted(effectiveAccess, RBAC_PERMISSIONS.actions.reportsView, 'read'),
        canExportReports: isPermissionGranted(
            effectiveAccess,
            RBAC_PERMISSIONS.actions.reportsExport,
            'write',
        ),
    };

    // Filter Equipment based on Role (Data Row Level Security)
    const filterEquipment = (equipment: Equipment[], allUsers: User[]) => {
        if (!currentUser) return [];
        if (role === 'SuperAdmin') return equipment;

        if (role === 'Admin') {
            // Admin sees equipment in their managed countries
            if (currentUser.managedCountries && currentUser.managedCountries.length > 0) {
                return equipment.filter(
                    (item) => item.country && currentUser.managedCountries?.includes(item.country),
                );
            }
            return equipment; // Fallback if no specific countries managed
        }

        if (role === 'Manager') {
            // Manager sees:
            // 1. Their own equipment
            // 2. Equipment assigned to their direct reports
            return equipment.filter((item) => {
                const isOwn = item.user?.email === currentUser.email;
                // Find if the equipment user reports to this manager
                const assignedUser = allUsers.find((u) => u.email === item.user?.email);
                const isDirectReport = assignedUser?.managerId === currentUser.id;
                return isOwn || isDirectReport;
            });
        }

        if (role === 'User') {
            // User only sees their own equipment
            return equipment.filter((item) => item.user?.email === currentUser.email);
        }

        return [];
    };

    // Filter Users based on Role
    const filterUsers = (users: User[]) => {
        if (!currentUser) return [];
        if (role === 'SuperAdmin' || role === 'Admin') return users;

        if (role === 'Manager') {
            // Manager sees themselves and their direct reports
            return users.filter((u) => u.id === currentUser.id || u.managerId === currentUser.id);
        }

        // Users shouldn't technically see the user list, but if they do, only themselves
        return users.filter((u) => u.id === currentUser.id);
    };

    const simulateAccess = (roleIds: string[], groupIds?: string[]) =>
        resolveEffectiveAccess({
            userId: 'simulation-user',
            assignment: {
                userId: 'simulation-user',
                roleIds,
                groupIds: groupIds || [],
            },
            roles: rbacRoles,
            groups: rbacGroups,
        });

    return {
        filterEquipment,
        filterUsers,
        role: currentUser?.role,
        user: currentUser,
        permissions,
        effectiveAccess,
        simulateAccess,
    };
};
