import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretDown,
    EnvelopeSimple,
    Funnel,
    Plus,
    UsersThree,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useDebounce } from '../../../hooks/useDebounce';
import useSelection from '../../../hooks/useSelection';
import { ViewType, UserRole } from '../../../types';

import ListTemplate, { type ListFacet } from '../../../components/layout/ListTemplate';
import ListRow from '../../../components/ui/ListRow';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { FabContainer } from '../../../components/ui/FabContainer';
import BottomSheet from '../../../components/ui/BottomSheet';

import { canDeleteUserByRoleRule, getStatusLabel } from '../../../lib/businessRules';
import { buildCsvLine } from '../../../lib/csv';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';

/**
 * Annuaire des personnes — **porté sur la planche 05.1** (gabarit `ListTemplate`).
 *
 * *Un annuaire de parc, pas un annuaire d'entreprise.* Le gestionnaire l'ouvre pour
 * deux choses : trouver une personne dont on lui parle, et **choisir à qui attribuer
 * un objet**. La question n'est donc jamais « qui travaille ici » — l'entreprise a
 * déjà un annuaire pour ça — mais **qui détient quoi**.
 *
 * **Ce que le portage ajoute**, et c'est la seule donnée qui décide quelque chose :
 * **le nombre d'équipements détenus**. C'est le pendant exact de « chez qui est
 * l'objet » sur la liste des actifs, dans l'autre sens.
 *
 * **Ce qu'il retire :**
 *
 * - **les avatars illustrés** → des initiales. Onze visages de dessin animé dans une
 *   liste font onze taches de couleur qui ne signifient rien et pèsent plus que les
 *   noms.
 * - **les badges de rôle en majuscules colorées** — deux interdits d'un coup : les
 *   capitales (§8.4), et **la couleur qui code une catégorie** (§8.8). Un rôle n'est
 *   pas un état ; le peindre, c'est le défaut corrigé au tableau de bord. Le rôle
 *   devient **un mot**, en fin de première ligne, à la place qu'occupe le type sur la
 *   liste des actifs.
 * - **la corbeille de rangée** et **la pagination** — même arbitrage que 04.1.
 * - **l'e-mail de la rangée.** Il reste **clé de recherche** — le champ l'annonce —
 *   mais trente caractères écrasaient le nom qu'ils accompagnaient. Écart assumé avec
 *   `ASSET-10001`, gardé sur les actifs : une étiquette se lit **sur l'objet**, une
 *   adresse ne se lit pas sur une personne.
 *
 * **Le tri est dit.** Il n'y a pas d'ordre naturel pour des personnes : la liste
 * actuelle rangeait sans le dire. Il est alphabétique, il partage la ligne du
 * décompte, et il se renverse.
 */

const STORAGE_KEY_SEARCH = 'users_search';
const STORAGE_KEY_ROLE = 'users_role';

/** L'ordre de lecture des rôles, du plus nombreux au plus rare (05.1). */
const FACET_ORDER: UserRole[] = ['User', 'Manager', 'Admin', 'SuperAdmin'];

/** Le pluriel du rôle, tel que la planche l'écrit en tête d'écran. */
const FACET_LABEL: Record<UserRole, string> = {
    User: 'Utilisateurs',
    Manager: 'Managers',
    Admin: 'Admins',
    SuperAdmin: 'Super admin',
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

interface UsersPageProps {
    onUserClick?: (id: string) => void;
    onViewChange: (view: ViewType) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ onUserClick, onViewChange }) => {
    const { users: allUsers, equipment, deleteUser, locationData } = useData();
    const { user: currentUser, filterUsers, permissions } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const users = useMemo(() => filterUsers(allUsers), [allUsers, filterUsers]);
    const activeSuperAdminCount = useMemo(
        () => allUsers.filter((user) => user.role === 'SuperAdmin' && user.status !== 'inactive').length,
        [allUsers]
    );

    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '');
    const [roleFilter, setRoleFilter] = useState(() => sessionStorage.getItem(STORAGE_KEY_ROLE) || '');
    const [ascending, setAscending] = useState(true);
    const selection = useSelection();

    // Filtres avancés feuille montante (05.1)
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState('Tous');
    const [siteFilter, setSiteFilter] = useState('Tous');
    const [statusFilter, setStatusFilter] = useState('Tous');

    // Feuille montante d'ajout (05.1)
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_ROLE, roleFilter);
    }, [roleFilter]);

    /**
     * Ce que chaque personne détient — la donnée que la liste n'avait pas et qui
     * décide du choix d'un destinataire.
     */
    const holdings = useMemo(() => {
        const counts = new Map<string, number>();
        equipment.forEach((item) => {
            const key = item.user?.id || item.user?.email || item.user?.name;
            if (!key) return;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return (user: { id: string; email: string; name: string }) =>
            counts.get(user.id) ?? counts.get(user.email) ?? counts.get(user.name) ?? 0;
    }, [equipment]);

    const departments = useMemo(() => {
        const set = new Set<string>();
        users.forEach((u) => {
            if (u.department) set.add(u.department);
        });
        return ['Tous', ...Array.from(set)];
    }, [users]);

    const sites = useMemo(() => {
        const allSites: string[] = [];
        Object.values(locationData.sites).forEach((sList) => allSites.push(...sList));
        return ['Tous', ...Array.from(new Set(allSites))];
    }, [locationData.sites]);

    const activeSheetFiltersCount = useMemo(() => {
        let count = 0;
        if (departmentFilter !== 'Tous') count += 1;
        if (siteFilter !== 'Tous') count += 1;
        if (statusFilter !== 'Tous') count += 1;
        return count;
    }, [departmentFilter, siteFilter, statusFilter]);

    const filteredUsers = useMemo(() => {
        const searchLower = debouncedSearch.toLowerCase();
        const matching = users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                (user.department && user.department.toLowerCase().includes(searchLower));
            const matchesRole = roleFilter === '' || user.role === roleFilter;
            const matchesDept = departmentFilter === 'Tous' || user.department === departmentFilter;
            const matchesSite = siteFilter === 'Tous' || user.site === siteFilter;
            const matchesStatus =
                statusFilter === 'Tous' ||
                (statusFilter === 'Actif' && user.status === 'active') ||
                (statusFilter === 'Suspendu' && user.status === 'inactive') ||
                (statusFilter === 'Départ prévu' && user.status === 'pending');

            return matchesSearch && matchesRole && matchesDept && matchesSite && matchesStatus;
        });

        // Le tri est dit, donc il est appliqué : alphabétique, réversible.
        return matching
            .slice()
            .sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name, 'fr'));
    }, [users, debouncedSearch, roleFilter, departmentFilter, siteFilter, statusFilter, ascending]);

    const facets = useMemo<ListFacet[]>(() => {
        const counts = new Map<string, number>();
        users.forEach((user) => counts.set(user.role, (counts.get(user.role) ?? 0) + 1));

        return [
            { id: 'tous', label: 'Tous', count: users.length },
            ...FACET_ORDER.filter((role) => counts.has(role)).map((role) => ({
                id: role,
                label: FACET_LABEL[role],
                count: counts.get(role) ?? 0,
            })),
        ];
    }, [users]);

    const selectedUsers = useMemo(
        () => filteredUsers.filter((user) => selection.isSelected(user.id)),
        [filteredUsers, selection]
    );

    const handleExport = (itemsToExport = filteredUsers) => {
        if (itemsToExport.length === 0) {
            showToast('Aucune donnée à exporter avec les filtres actuels.', 'info');
            return;
        }

        const headers = ['Nom', 'Email', 'Département', 'Rôle', 'Dernière connexion', 'Pays', 'Site', 'Statut'];
        const rows = itemsToExport.map((user) => [
            user.name,
            user.email,
            user.department || '',
            user.role,
            user.lastLogin || '',
            user.country || '',
            user.site || '',
            user.status || '',
        ]);

        const csvContent = [buildCsvLine(headers), ...rows.map((row) => buildCsvLine(row))].join('\n');
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

        showToast(`${itemsToExport.length} compte(s) exporté(s).`, 'success');
    };

    const handleBulkDelete = () => {
        if (selection.count === 0) return;
        const ids = [...selection.selectedIds];

        requestConfirmation({
            title:
                ids.length > 1
                    ? `Supprimer ${ids.length} comptes ?`
                    : 'Supprimer ce compte ?',
            message: (
                <p>
                    Les accès associés seront révoqués. Cette opération ne peut pas être
                    annulée.
                </p>
            ),
            confirmText: 'Supprimer',
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;
                let seeded = 0;

                ids.forEach((id) => {
                    const target = allUsers.find((user) => user.id === id);
                    const rule = canDeleteUserByRoleRule({
                        actorRole: currentUser?.role,
                        targetRole: target?.role,
                        isSelfDelete: id === currentUser?.id,
                        activeSuperAdminCount,
                    });
                    if (!rule.allowed) {
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

                selection.exit();

                if (deleted > 0) showToast(`${deleted} compte(s) supprimé(s).`, 'success');
                if (seeded > 0) showToast(DEMO_RESEED_NOTICE, 'info');
                if (blocked > 0) {
                    showToast(`${blocked} compte(s) n’ont pas pu être supprimés.`, 'warning');
                }
            },
        });
    };

    const isFiltered = Boolean(
        roleFilter ||
        debouncedSearch ||
        departmentFilter !== 'Tous' ||
        siteFilter !== 'Tous' ||
        statusFilter !== 'Tous'
    );
    const holdersCount = users.filter((user) => holdings(user) > 0).length;
    const heldCount = users.reduce((total, user) => total + holdings(user), 0);

    return (
        <>
            <ListTemplate
                title="Équipe"
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: 'Nom, e-mail, département',
                }}
                filter={
                    <button
                        type="button"
                        onClick={() => setIsFilterSheetOpen(true)}
                        aria-label="Filtrer"
                        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-outline text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                        <Icon glyph={Funnel} size={20} />
                        {activeSheetFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-inverse-surface px-1 text-[10px] font-semibold tabular-nums text-inverse-on-surface">
                                {activeSheetFiltersCount}
                            </span>
                        )}
                    </button>
                }
                facets={facets}
                activeFacetId={roleFilter || 'tous'}
                onFacetSelect={(id) => setRoleFilter(id === 'tous' ? '' : id)}
                count={{ total: users.length, shown: filteredUsers.length, noun: 'personnes' }}
                sort={{
                    label: ascending ? 'Nom (A → Z)' : 'Nom (Z → A)',
                    onClick: () => setAscending((previous) => !previous),
                }}
                selection={{
                    active: selection.isActive,
                    count: selection.count,
                    total: filteredUsers.length,
                    onExit: selection.exit,
                    onSelectAll: () => selection.selectAll(filteredUsers.map((user) => user.id)),
                    onClearAll: selection.clear,
                    actions: (
                        <Button variant="filled" onClick={() => handleExport(selectedUsers)}>
                            Exporter {selection.count > 1 ? `les ${selection.count}` : ''}
                        </Button>
                    ),
                    bulkOverflow: permissions.canManageUsers ? (
                        <Button variant="danger" onClick={handleBulkDelete}>
                            Supprimer
                        </Button>
                    ) : undefined,
                }}
                empty={
                    <ScreenState
                        icon={UsersThree}
                        title={isFiltered ? 'Personne ne correspond' : 'Aucune personne ici'}
                        description={
                            isFiltered
                                ? 'Élargissez la recherche, ou revenez à toute l’équipe.'
                                : 'Ce périmètre n’a encore aucun compte rattaché.'
                        }
                        actions={
                            isFiltered ? (
                                <Button
                                    variant="filled"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setRoleFilter('');
                                        setDepartmentFilter('Tous');
                                        setSiteFilter('Tous');
                                        setStatusFilter('Tous');
                                    }}
                                >
                                    {`Voir les ${users.length} personnes`}
                                </Button>
                            ) : permissions.canManageUsers ? (
                                <Button variant="filled" onClick={() => onViewChange('add_user')}>
                                    Inviter une personne
                                </Button>
                            ) : undefined
                        }
                    />
                }
                footer={
                    filteredUsers.length > 0 && heldCount > 0
                        ? `${heldCount} des ${equipment.length} actifs sont portés par ${holdersCount} personne${holdersCount > 1 ? 's' : ''}.`
                        : undefined
                }
                fab={
                    permissions.canManageUsers && !selection.isActive ? (
                        <FabContainer description="Ajouter une personne" className="bottom-[76px] right-5 compact:bottom-[76px]">
                            <button
                                type="button"
                                aria-label="Ajouter une personne"
                                className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-[var(--tk-color-brand-text)] shadow-[0_4px_14px_rgba(10,25,29,0.22)] transition-transform active:scale-95 cursor-pointer"
                                onClick={() => setIsAddSheetOpen(true)}
                            >
                                <Icon glyph={Plus} size={24} />
                            </button>
                        </FabContainer>
                    ) : undefined
                }
            >
                {filteredUsers.map((user) => {
                    const held = holdings(user);
                    return (
                        <ListRow
                            key={user.id}
                            vignette={<span className="font-brand text-[15px] font-semibold">{initials(user.name)}</span>}
                            title={user.name}
                            type={getStatusLabel(user.role)}
                            holder={user.department || user.site || '—'}
                            reference={held > 0 ? `${held} équipement${held > 1 ? 's' : ''}` : 'aucun équipement'}
                            referenceClassName={held > 0 ? 'text-text-secondary' : 'text-text-muted'}
                            onOpen={() => onUserClick?.(user.id)}
                            selectionActive={selection.isActive}
                            selected={selection.isSelected(user.id)}
                            onToggle={() => selection.toggle(user.id)}
                            onLongPress={() => selection.enter(user.id)}
                        />
                    );
                })}
            </ListTemplate>

            {/* Feuille montante de filtrage (05.1) */}
            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
            >
                <div className="space-y-4 px-1 pb-2">
                    {/* Département */}
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1.5">
                            Département
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {departments.map((dept) => (
                                <button
                                    key={dept}
                                    type="button"
                                    onClick={() => setDepartmentFilter(dept)}
                                    className={`inline-flex items-center min-h-10 px-3 rounded-md text-[13px] transition-colors cursor-pointer ${
                                        departmentFilter === dept
                                            ? 'bg-inverse-surface text-inverse-on-surface font-medium'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Site */}
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1.5">
                            Site
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {sites.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSiteFilter(s)}
                                    className={`inline-flex items-center min-h-10 px-3 rounded-md text-[13px] transition-colors cursor-pointer ${
                                        siteFilter === s
                                            ? 'bg-inverse-surface text-inverse-on-surface font-medium'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* État du compte */}
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1.5">
                            État du compte
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['Tous', 'Actif', 'Suspendu', 'Départ prévu'].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`inline-flex items-center min-h-10 px-3 rounded-md text-[13px] transition-colors cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-inverse-surface text-inverse-on-surface font-medium'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions de pied */}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant pt-3.5">
                        <button
                            type="button"
                            onClick={() => {
                                setDepartmentFilter('Tous');
                                setSiteFilter('Tous');
                                setStatusFilter('Tous');
                            }}
                            className="text-[14px] font-medium text-on-surface hover:text-text-secondary cursor-pointer"
                        >
                            Tout effacer
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFilterSheetOpen(false)}
                            className="flex-1 max-w-[240px] flex h-12 items-center justify-center rounded-md bg-inverse-surface text-inverse-on-surface text-[14px] font-medium transition-colors hover:bg-inverse-surface/90 cursor-pointer"
                        >
                            Voir les {filteredUsers.length} personnes
                        </button>
                    </div>

                    <p className="text-center text-[11px] text-text-muted">
                        Le rôle n’est pas repris ici : il est déjà en tête d’écran sous forme de pastilles.
                    </p>
                </div>
            </BottomSheet>

            {/* Feuille montante d'ajout (05.1) */}
            <BottomSheet
                open={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                title="Ajouter une personne"
            >
                <div className="space-y-2 px-1 pb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            onViewChange('add_user');
                        }}
                        className="flex w-full min-h-16 items-center gap-3.5 rounded-lg p-2 text-left hover:bg-surface-container transition-colors cursor-pointer"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface">
                            <Icon glyph={EnvelopeSimple} size={20} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-on-surface">Inviter par e-mail</p>
                            <p className="text-[11px] text-text-muted leading-4">
                                La personne choisit son mot de passe à la première connexion.
                            </p>
                        </div>
                        <Icon glyph={CaretDown} size={18} className="shrink-0 -rotate-90 text-text-muted" />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            onViewChange('import_users');
                        }}
                        className="flex w-full min-h-16 items-center gap-3.5 rounded-lg p-2 text-left hover:bg-surface-container transition-colors cursor-pointer"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface">
                            <Icon glyph={UsersThree} size={20} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-on-surface">Importer depuis l’annuaire</p>
                            <p className="text-[11px] text-text-muted leading-4">
                                Le compte existe déjà côté entreprise : rien à saisir.
                            </p>
                        </div>
                        <Icon glyph={CaretDown} size={18} className="shrink-0 -rotate-90 text-text-muted" />
                    </button>

                    <p className="mt-2 border-t border-outline-variant pt-2 text-center text-[11px] text-text-muted">
                        Proposition — le compte peut être invité ou synchronisé depuis l’annuaire.
                    </p>
                </div>
            </BottomSheet>
        </>
    );
};

export default UsersPage;
