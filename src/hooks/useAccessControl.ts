import { useAuth } from '../context/AuthContext';
import { Equipment, User, Approval } from '../types';

export const useAccessControl = () => {
  const { currentUser } = useAuth();

  const role = currentUser?.role;

  // RBAC Permission Matrix
  const permissions = {
    // Inventory
    canViewInventory: true, // Everyone can see inventory (filtered)
    canManageInventory: role === 'SuperAdmin' || role === 'Admin', // Create/Edit/Delete
    canManageFinance: role === 'SuperAdmin' || role === 'Admin',

    // Users
    canViewUsers: role === 'SuperAdmin' || role === 'Admin' || role === 'Manager',
    canManageUsers: role === 'SuperAdmin' || role === 'Admin',

    // Approvals
    canViewApprovals: true, // Everyone sees approvals (filtered)
    canManageApprovals: role === 'SuperAdmin' || role === 'Admin' || role === 'Manager', // Approve/Reject

    // Management (Categories, Models)
    canManageSystem: role === 'SuperAdmin' || role === 'Admin',

    // Locations
    canManageLocations: role === 'SuperAdmin' || role === 'Admin',

    // Audit
    canManageAudit: role === 'SuperAdmin', // Only SuperAdmin

    // Reports
    canViewReports: role !== 'User', // User cannot see global reports
  };

  // Filter Equipment based on Role (Data Row Level Security)
  const filterEquipment = (equipment: Equipment[], allUsers: User[]) => {
    if (!currentUser) return [];
    if (role === 'SuperAdmin') return equipment;

    if (role === 'Admin') {
      // Admin sees equipment in their managed countries
      if (currentUser.managedCountries && currentUser.managedCountries.length > 0) {
        return equipment.filter(item =>
          item.country && currentUser.managedCountries?.includes(item.country)
        );
      }
      return equipment; // Fallback if no specific countries managed
    }

    if (role === 'Manager') {
      // Manager sees:
      // 1. Their own equipment
      // 2. Equipment assigned to their direct reports
      return equipment.filter(item => {
        const isOwn = item.user?.email === currentUser.email;
        // Find if the equipment user reports to this manager
        const assignedUser = allUsers.find(u => u.email === item.user?.email);
        const isDirectReport = assignedUser?.managerId === currentUser.id;
        return isOwn || isDirectReport;
      });
    }

    if (role === 'User') {
      // User only sees their own equipment
      return equipment.filter(item => item.user?.email === currentUser.email);
    }

    return [];
  };

  // Filter Users based on Role
  const filterUsers = (users: User[]) => {
    if (!currentUser) return [];
    if (role === 'SuperAdmin' || role === 'Admin') return users;

    if (role === 'Manager') {
      // Manager sees themselves and their direct reports
      return users.filter(u => u.id === currentUser.id || u.managerId === currentUser.id);
    }

    // Users shouldn't technically see the user list, but if they do, only themselves
    return users.filter(u => u.id === currentUser.id);
  };

  // Granular Permissions
  const canValidateRequest = (request: Approval, allUsers: User[]) => {
    if (role === 'SuperAdmin') return true;
    if (role === 'Manager') {
      const resolveUser = (userId?: string, userName?: string) => {
        return allUsers.find((user) =>
          (userId && user.id === userId)
          || (userName && (user.name === userName || user.email === userName))
        );
      };

      const requester = resolveUser(request.requesterId, request.requesterName);
      const beneficiary = resolveUser(request.beneficiaryId, request.beneficiaryName);

      const isOwnRequest = request.requesterId === currentUser?.id || request.beneficiaryId === currentUser?.id;
      const managesRequester = requester?.managerId === currentUser?.id;
      const managesBeneficiary = beneficiary?.managerId === currentUser?.id;

      return Boolean(isOwnRequest || managesRequester || managesBeneficiary);
    }
    return false;
  };

  const canProcessRequest = (request: Approval, requesterUser?: User) => {
    if (role === 'SuperAdmin') return true;
    if (role === 'Admin') {
      // Check perimeter (Country)
      // We need to know the requester's country.
      // Passed as arg or we need to find it?
      // Ideally request has 'location' field, or we look up requester.
      if (!requesterUser) return true; // Fail safe or strict?
      return currentUser?.managedCountries?.includes(requesterUser.country || '');
    }
    return false;
  };

  const canAssignAsset = (asset: Equipment) => {
    if (role === 'SuperAdmin') return true;
    if (role === 'Admin') {
      return currentUser?.managedCountries?.includes(asset.country || '');
    }
    return false;
  };

  return {
    filterEquipment,
    filterUsers,
    canValidateRequest,
    canProcessRequest,
    canAssignAsset,
    role: currentUser?.role,
    user: currentUser,
    permissions
  };
};
