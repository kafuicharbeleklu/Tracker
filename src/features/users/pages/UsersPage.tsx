import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import StatusBadge from '../../../components/ui/StatusBadge';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { ViewType } from '../../../types';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { useDebounce } from '../../../hooks/useDebounce';
import { EmptyState } from '../../../components/ui/EmptyState';
import { GLOSSARY } from '../../../constants/glossary';
import { EntityRow } from '../../../components/ui/EntityRow';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useToast } from '../../../context/ToastContext';
import ListActionFab from '../../../components/ui/ListActionFab';
import { APP_CONFIG } from '../../../config';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { canDeleteUserByRoleRule } from '../../../lib/businessRules';
import { buildCsvLine } from '../../../lib/csv';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY_SEARCH = 'users_search';
const STORAGE_KEY_DEPT = 'users_department';
const STORAGE_KEY_ROLE = 'users_role';
const USERS_FILTER_PANEL_ID = 'users-filter-panel';

interface UsersPageProps {
  onUserClick?: (id: string) => void;
  onViewChange: (view: ViewType) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ onUserClick, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '');
  const [departmentFilter, setDepartmentFilter] = useState(() => sessionStorage.getItem(STORAGE_KEY_DEPT) || '');
  const [roleFilter, setRoleFilter] = useState(() => sessionStorage.getItem(STORAGE_KEY_ROLE) || '');
  const [showFilters, setShowFilters] = useState(() => Boolean(sessionStorage.getItem(STORAGE_KEY_DEPT) || sessionStorage.getItem(STORAGE_KEY_ROLE)));
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const { users: allUsers, deleteUser } = useData();
  const { role, user: currentUser, filterUsers, permissions } = useAccessControl();
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirmation();
  const isCompact = useMediaQuery(MEDIA.compact);

  const users = useMemo(() => filterUsers(allUsers), [allUsers, filterUsers]);
  const activeSuperAdminCount = useMemo(
    () => allUsers.filter((user) => user.role === 'SuperAdmin' && user.status !== 'inactive').length,
    [allUsers],
  );

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_DEPT, departmentFilter);
  }, [departmentFilter]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_ROLE, roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, departmentFilter, roleFilter]);

  useEffect(() => {
    if (!showFilters) return;
    const focusFirstFilterControl = () => {
      const firstFocusable = filterPanelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    };
    const timeoutId = window.setTimeout(focusFirstFilterControl, 0);
    return () => window.clearTimeout(timeoutId);
  }, [showFilters]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = debouncedSearch.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.department && user.department.toLowerCase().includes(searchLower));

      const matchesDept = departmentFilter === '' || user.department === departmentFilter;
      const matchesRole = roleFilter === '' || user.role === roleFilter;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [users, debouncedSearch, departmentFilter, roleFilter]);

  useEffect(() => {
    setSelectedUserIds((prev) => {
      const visibleIds = new Set(filteredUsers.map((item) => item.id));
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredUsers]);

  useEffect(() => {
    if (!selectionMode) {
      setSelectedUserIds([]);
    }
  }, [selectionMode]);

  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), [filteredUsers]);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredUsers, currentPage]);

  const departments = useMemo(() => {
    const depts = Array.from(new Set(users.map(u => u.department)));
    return depts.map(d => ({ value: d, label: d }));
  }, [users]);

  const handleExport = (itemsToExport = filteredUsers) => {
    if (itemsToExport.length === 0) {
      showToast('Aucune donnée à exporter avec les filtres actuels.', 'info');
      return;
    }

    const headers = ['Nom', 'Email', 'Département', 'Rôle', 'Dernière connexion', 'Pays', 'Site', 'Statut'];
    const rows = itemsToExport.map(user => [
      user.name,
      user.email,
      user.department || '',
      user.role,
      user.lastLogin || '',
      user.country || '',
      user.site || '',
      user.status || ''
    ]);

    const csvContent = [
      buildCsvLine(headers),
      ...rows.map(row => buildCsvLine(row))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const fileDate = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `utilisateurs-${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${itemsToExport.length} utilisateur(s) exporté(s).`, 'success');
  };

  const selectedUserSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const selectedUsers = useMemo(
    () => filteredUsers.filter((user) => selectedUserSet.has(user.id)),
    [filteredUsers, selectedUserSet],
  );
  const pageUserIds = useMemo(() => paginatedUsers.map((user) => user.id), [paginatedUsers]);
  const selectedCount = selectedUserIds.length;
  const allVisibleSelected = pageUserIds.length > 0 && pageUserIds.every((id) => selectedUserSet.has(id));
  const someVisibleSelected = pageUserIds.some((id) => selectedUserSet.has(id));

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedUserIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((entry) => entry !== id);
    });
  };

  const togglePageSelection = (checked: boolean) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      pageUserIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });
  };

  const handleDeleteOne = (id: string, name: string) => {
    const targetUser = allUsers.find((user) => user.id === id);
    const permissionDecision = canDeleteUserByRoleRule({
      actorRole: currentUser?.role,
      targetRole: targetUser?.role,
      isSelfDelete: id === currentUser?.id,
      activeSuperAdminCount,
    });
    if (!permissionDecision.allowed) {
      showToast(permissionDecision.reason || 'Suppression impossible pour cet utilisateur.', 'info');
      return;
    }

    requestConfirmation({
      title: 'Supprimer le compte utilisateur',
      message: `Supprimer le compte de "${name}" ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
      onConfirm: () => {
        const decision = deleteUser(id);
        if (decision.allowed) {
          showToast(`${name} supprimé.`, 'success');
          if (isDemoSeedUser(id)) {
            showToast(DEMO_RESEED_NOTICE, 'info');
          }
          return;
        }
        showToast(decision.reason || 'Suppression impossible pour cet utilisateur.', 'info');
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;

    requestConfirmation({
      title: 'Supprimer la sélection',
      message: `Supprimer ${selectedCount} utilisateur(s) sélectionné(s) ? Les comptes avec équipements assignés seront ignorés.`,
      confirmText: 'Supprimer',
      variant: 'danger',
      onConfirm: () => {
        let deleted = 0;
        let blocked = 0;
        let seeded = 0;

        selectedUserIds.forEach((id) => {
          if (id === currentUser?.id) {
            blocked += 1;
            return;
          }
          const decision = deleteUser(id);
          if (decision.allowed) {
            deleted += 1;
            if (isDemoSeedUser(id)) seeded += 1;
          } else {
            blocked += 1;
          }
        });

        setSelectedUserIds([]);

        if (deleted > 0) {
          showToast(`${deleted} utilisateur(s) supprimé(s).`, 'success');
        }
        if (seeded > 0) {
          showToast(DEMO_RESEED_NOTICE, 'info');
        }
        if (blocked > 0) {
          showToast(`${blocked} utilisateur(s) n’ont pas pu être supprimés.`, 'warning');
        }
      },
    });
  };

  const userHeaderActions = isCompact ? null : (
    <div className="flex items-center gap-3">
      <Button
        variant={selectionMode ? 'filled' : 'outlined'}
        className="hidden medium:inline-flex"
        icon={<MaterialIcon name={selectionMode ? 'checklist_rtl' : 'check_box'} size={18} />}
        onClick={() => setSelectionMode((prev) => !prev)}
      >
        {selectionMode ? 'Terminer sélection' : 'Sélection'}
      </Button>
      <Button variant="outlined" className="hidden medium:inline-flex" icon={<MaterialIcon name="download" size={18} />} onClick={handleExport}>Exporter</Button>
      {permissions.canManageUsers && (
        <>
          <Button variant="outlined" className="hidden medium:inline-flex" icon={<MaterialIcon name="upload" size={18} />} onClick={() => onViewChange('import_users')}>Importer</Button>
          <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => onViewChange('add_user')}>Ajouter</Button>
        </>
      )}
    </div>
  );
  const hasActiveFilters = Boolean(departmentFilter || roleFilter || searchQuery);
  const activeFilterSummary = [
    departmentFilter ? 'Département: ' + departmentFilter : null,
    roleFilter ? 'Rôle: ' + roleFilter : null,
    searchQuery ? 'Recherche: "' + searchQuery + '"' : null,
  ].filter(Boolean).join(' • ');
  const resetFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('');
    setRoleFilter('');
  };
  return (
    <PageContainer>
      <PageHeader
        title={GLOSSARY.USER_PLURAL}
        subtitle={`${users.length} ${role === 'Manager'
          ? 'collaborateur(s) dans votre équipe'
          : 'collaborateurs ' + APP_CONFIG.companyName
          }`}
        breadcrumb={GLOSSARY.USERS}
        actions={userHeaderActions}
      />

      <div className="space-y-6">
        {isCompact ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <SearchFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={() => setShowFilters((prev) => !prev)}
                filterActive={showFilters}
                filterPanelId={USERS_FILTER_PANEL_ID}
                placeholder="Rechercher par nom, email, département..."
              />
            </div>

          </div>
        ) : (
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={() => setShowFilters((prev) => !prev)}
            filterActive={showFilters}
            filterPanelId={USERS_FILTER_PANEL_ID}
            resultCount={filteredUsers.length}
            placeholder="Rechercher par nom, email, département..."
          />
        )}

        {isCompact && (
          <p className="-mt-3 text-body-small text-on-surface-variant">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </p>
        )}

        {hasActiveFilters && (
          <div className="-mt-2 rounded-md border border-secondary/30 bg-secondary-container/40 px-3 py-2.5 flex flex-col medium:flex-row medium:items-center medium:justify-between gap-1.5">
            <div className="inline-flex items-center gap-1.5 text-label-small text-on-secondary-container">
              <MaterialIcon name="filter_alt" size={14} />
              <span className="font-semibold uppercase tracking-wide">Filtres actifs</span>
            </div>
            <p className="text-body-small text-on-secondary-container/90 truncate" title={activeFilterSummary}>
              {activeFilterSummary}
            </p>
          </div>
        )}

        {showFilters && (
          <div
            id={USERS_FILTER_PANEL_ID}
            ref={filterPanelRef}
            className="flex flex-col medium:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-short4"
            role="region"
            aria-label="Filtres utilisateurs"
          >
            <SelectFilter
              options={departments}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              placeholder="Tous les départements"
              className="w-full medium:w-64"
            />
            <SelectFilter
              options={[
                { value: 'SuperAdmin', label: 'SuperAdmin' },
                { value: 'Admin', label: 'Admin' },
                { value: 'Manager', label: 'Manager' },
                { value: 'User', label: 'User' },
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Tous les rôles"
              className="w-full medium:w-64"
            />
            {(departmentFilter || roleFilter || searchQuery) && (
              <Button
                variant="outlined"
                icon={<MaterialIcon name="restart_alt" size={16} />}
                className="w-full medium:w-auto"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}

        {selectionMode && (
          <div className="-mt-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5 flex flex-col gap-2">
            <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-2">
              <p className="text-body-small text-on-surface-variant">
                {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  size="sm"
                  icon={<MaterialIcon name="download" size={16} />}
                  disabled={selectedCount === 0}
                  onClick={() => handleExport(selectedUsers)}
                >
                  Exporter sélection
                </Button>
                {permissions.canManageUsers && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<MaterialIcon name="delete" size={16} />}
                    disabled={selectedCount === 0}
                    onClick={handleBulkDelete}
                  >
                    Supprimer
                  </Button>
                )}
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => setSelectionMode(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-label-small text-on-surface-variant">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--tk-color-primary)]"
                checked={allVisibleSelected}
                ref={(node) => {
                  if (node) {
                    node.indeterminate = !allVisibleSelected && someVisibleSelected;
                  }
                }}
                onChange={(event) => togglePageSelection(event.target.checked)}
              />
              Tout sélectionner sur la page
            </label>
          </div>
        )}

        <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => {
              const roleDeleteDecision = canDeleteUserByRoleRule({
                actorRole: currentUser?.role,
                targetRole: user.role,
                isSelfDelete: user.id === currentUser?.id,
                activeSuperAdminCount,
              });
              const canDeleteRow = !selectionMode && permissions.canManageUsers && roleDeleteDecision.allowed;
              return (
                <EntityRow
                key={user.id}
                image={user.avatar}
                imageFit="cover"
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(user.id, !selectedUserSet.has(user.id));
                    return;
                  }
                  onUserClick && onUserClick(user.id);
                }}
                selected={selectionMode && selectedUserSet.has(user.id)}
                selectionControl={selectionMode ? (
                  <input
                    type="checkbox"
                    checked={selectedUserSet.has(user.id)}
                    onChange={(event) => toggleSelection(user.id, event.target.checked)}
                    className="h-4 w-4 accent-[var(--tk-color-primary)]"
                    aria-label={`Sélectionner ${user.name}`}
                  />
                ) : undefined}
                imageFallback={
                  <UserAvatar
                    name={user.name}
                    src={user.avatar}

                    size="md"
                    className="w-full h-full"
                  />
                }
                title={user.name}
                subtitle={
                  <div className="flex items-center gap-2 text-body-small text-on-surface-variant mt-0.5 min-w-0">
                    <span className="truncate">{user.email}</span>
                  </div>
                }
                location={
                  <div className="flex w-full min-w-0 items-center gap-1.5 text-label-small text-on-surface-variant">
                    <MaterialIcon name="work" size={14} className="shrink-0" />
                    <span className="truncate text-body-medium">{user.department || 'N/A'}</span>
                  </div>
                }
                meta={
                  <div className="hidden expanded:flex w-full min-w-0 justify-end">
                    <div className="w-[220px] text-right">
                      <p className="text-label-small text-on-surface-variant uppercase tracking-wider mb-0.5">Dernière activité</p>
                      <div className="flex items-center justify-end gap-1.5 text-body-small text-on-surface-variant">
                        <MaterialIcon name="schedule" size={12} />
                        <span className="truncate">{user.lastLogin || 'Jamais'}</span>
                      </div>
                    </div>
                  </div>
                }
                status={
                  <div className="flex medium:w-[164px] items-center justify-end pr-1">
                    <StatusBadge status={user.role} size="sm" />
                  </div>
                }
                actions={
                  canDeleteRow ? (
                    <Button
                      variant="text"
                      size="sm"
                      className="h-9 w-9 min-w-0 p-0 rounded-full text-error hover:bg-error-container/40"
                      icon={<MaterialIcon name="delete" size={18} />}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteOne(user.id, user.name);
                      }}
                      aria-label={`Supprimer ${user.name}`}
                      title="Supprimer"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 min-w-0 opacity-0 pointer-events-none" aria-hidden="true" />
                  )
                }
              />
              );
            })
          ) : (
            <div className="p-8">
              <EmptyState
                icon="person_off"
                title="Aucun utilisateur trouvé"
                description="Ajustez vos critères de recherche ou ajoutez un nouveau collaborateur."
                action={
                  users.length === 0 && permissions.canManageUsers ? (
                    <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => onViewChange('add_user')}>
                      Ajouter un utilisateur
                    </Button>
                  ) : hasActiveFilters ? (
                    <Button
                      variant="outlined"
                      icon={<MaterialIcon name="restart_alt" size={18} />}
                      onClick={resetFilters}
                    >
                      Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      {isCompact && (
        <ListActionFab
          label="Utilisateur"
          sheetTitle="Actions Utilisateurs"
          actions={[
            {
              id: 'toggle-selection',
              label: selectionMode ? 'Terminer sélection' : 'Mode sélection',
              icon: selectionMode ? 'checklist_rtl' : 'check_box',
              variant: 'outlined' as const,
              onSelect: () => setSelectionMode((prev) => !prev),
            },
            ...(permissions.canManageUsers ? [
              {
                id: 'add-user',
                label: 'Ajouter un utilisateur',
                icon: 'add',
                variant: 'filled' as const,
                onSelect: () => onViewChange('add_user'),
              },
              {
                id: 'import-users',
                label: 'Importer des utilisateurs',
                icon: 'upload',
                variant: 'outlined' as const,
                onSelect: () => onViewChange('import_users'),
              },
            ] : []),
            {
              id: 'export-users',
              label: 'Exporter la liste',
              icon: 'download',
              variant: 'outlined' as const,
              onSelect: handleExport,
            },
            ...(selectionMode && selectedCount > 0 ? [
              {
                id: 'export-selected-users',
                label: 'Exporter la sélection',
                icon: 'download',
                variant: 'outlined' as const,
                onSelect: () => handleExport(selectedUsers),
              },
              ...(permissions.canManageUsers ? [{
                id: 'delete-selected-users',
                label: 'Supprimer la sélection',
                icon: 'delete',
                variant: 'outlined' as const,
                onSelect: handleBulkDelete,
              }] : []),
            ] : []),
          ]}
        />
      )}
      {filteredUsers.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </PageContainer>
  );
};

export default UsersPage;

