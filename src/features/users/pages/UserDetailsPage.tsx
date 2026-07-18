import { MEDIA } from '../../../constants/breakpoints';
import React, { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { ViewType, AppUser } from '../../../types';
import { useData } from '../../../context/DataContext';
import { authService } from '../../../services/authService';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { PageTabs, getTabElementId, getTabPanelId } from '../../../components/ui/PageTabs';
import Menu, { MenuItem } from '../../../components/ui/Menu';
import { DetailHeader } from '../../../components/layout/DetailHeader';
import DetailPageShell from '../../../components/layout/DetailPageShell';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../lib/utils';
import MovementTimeline, { MovementTimelineItem } from '../../../components/ui/MovementTimeline';
import DemoBadge from '../../../components/ui/DemoBadge';
import { getCategoryIcon } from '../../../constants/categoryIcons';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';
import {
    ACTIVE_APPROVAL_STATUSES,
    canDeleteUserByRoleRule,
    getHistoryEventIcon,
    getStatusLabel,
    isEquipmentMovementEvent,
} from '../../../lib/businessRules';

interface UserDetailsPageProps {
    userId: string;
    onBack: () => void;
    onViewChange?: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
}

type UserDetailsTab = 'overview' | 'equipment';
const USER_DETAILS_TABS_ID_BASE = 'user-details-tabs';

const MAX_USER_MOVEMENT_HISTORY_ITEMS = 200;

const UserDetailsPage: React.FC<UserDetailsPageProps> = ({ userId, onBack, onEquipmentClick }) => {
    const { users, equipment, events, approvals, deleteUser } = useData();
    const { showToast } = useToast();
    const { permissions, user: currentUserAuth } = useAccessControl();
    const { navigate } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();

    const user = users.find(u => u.id === userId);
    const [activeTab, setActiveTab] = useState<UserDetailsTab>('overview');
    const [authUser, setAuthUser] = useState<AppUser | null>(null);
    const [latestTempPassword, setLatestTempPassword] = useState<string | null>(null);
    const [latestTempPin, setLatestTempPin] = useState<string | null>(null);
    const isCompactLayout = useMediaQuery(MEDIA.belowExpanded);
    const isPhone = useMediaQuery(MEDIA.compact);
    const canManageAccountSecurity = permissions.canManageUsers
        || currentUserAuth?.role === 'SuperAdmin'
        || currentUserAuth?.role === 'Admin';

    useEffect(() => {
        if (user?.email && canManageAccountSecurity) {
            authService.getAllUsers().then(appUsers => {
                const found = appUsers.find(u => u.MicrosoftEmail?.toLowerCase() === user.email.toLowerCase());
                setAuthUser(found || null);
            });
        }
    }, [user, canManageAccountSecurity]);

    const targetUserId = user?.id ?? userId;
    const targetUserName = user?.name ?? '';
    const userEquipment = useMemo(
        () => equipment.filter((item) => item.user?.name === targetUserName || item.user?.id === targetUserId),
        [equipment, targetUserId, targetUserName],
    );
    const primaryDevice = userEquipment[0];
    const displayPhone = user?.phone || '+33 6 00 00 00 00';
    const currentEquipmentIds = useMemo(
        () => new Set(userEquipment.map((item) => item.id)),
        [userEquipment],
    );
    const normalizedUserName = useMemo(() => targetUserName.trim().toLowerCase(), [targetUserName]);

    const userUsageEventItems = useMemo<MovementTimelineItem[]>(() => (
        events
            .filter((event) => {
                if (!isEquipmentMovementEvent(event)) return false;

                const beneficiaryId = typeof event.metadata?.beneficiaryId === 'string'
                    ? event.metadata.beneficiaryId
                    : null;
                const previousUserId = typeof event.metadata?.previousUserId === 'string'
                    ? event.metadata.previousUserId
                    : null;
                const beneficiaryName = typeof event.metadata?.beneficiaryName === 'string'
                    ? event.metadata.beneficiaryName.trim().toLowerCase()
                    : null;
                const previousUserName = typeof event.metadata?.previousUser === 'string'
                    ? event.metadata.previousUser.trim().toLowerCase()
                    : null;

                return (
                    event.actorId === targetUserId
                    || beneficiaryId === targetUserId
                    || previousUserId === targetUserId
                    || beneficiaryName === normalizedUserName
                    || previousUserName === normalizedUserName
                    || currentEquipmentIds.has(event.targetId)
                );
            })
            .map((event) => ({
                id: event.id,
                timestamp: event.timestamp,
                title: event.description || 'Mouvement enregistré',
                actor: event.actorName,
                meta: event.targetName,
                icon: getHistoryEventIcon(event.type),
            }))
    ), [currentEquipmentIds, events, normalizedUserName, targetUserId]);

    const syntheticUserUsageItems = useMemo<MovementTimelineItem[]>(() => (
        userEquipment.flatMap((equipmentItem) => {
            const entries: MovementTimelineItem[] = [];
            if (equipmentItem.assignedAt) {
                entries.push({
                    id: `synthetic-user-assigned-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.assignedAt,
                    title: `Attribution de ${equipmentItem.name}`,
                    actor: equipmentItem.assignedByName || 'Système',
                    meta: equipmentItem.assetId,
                    icon: 'assignment_ind',
                });
            }
            if (equipmentItem.confirmedAt) {
                entries.push({
                    id: `synthetic-user-confirmed-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.confirmedAt,
                    title: `Réception confirmée: ${equipmentItem.name}`,
                    meta: equipmentItem.assetId,
                    icon: 'task_alt',
                });
            }
            if (equipmentItem.returnRequestedAt) {
                entries.push({
                    id: `synthetic-user-return-requested-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.returnRequestedAt,
                    title: `Restitution demandée: ${equipmentItem.name}`,
                    meta: equipmentItem.assetId,
                    icon: 'assignment_return',
                });
            }
            if (equipmentItem.returnInspectedAt) {
                entries.push({
                    id: `synthetic-user-return-inspected-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.returnInspectedAt,
                    title: `Restitution inspectée: ${equipmentItem.name}`,
                    meta: equipmentItem.assetId,
                    icon: 'fact_check',
                });
            }
            if (equipmentItem.repairStartDate) {
                entries.push({
                    id: `synthetic-user-repair-start-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.repairStartDate,
                    title: `Maintenance démarrée: ${equipmentItem.name}`,
                    meta: equipmentItem.assetId,
                    icon: 'build',
                });
            }
            if (equipmentItem.repairEndDate) {
                entries.push({
                    id: `synthetic-user-repair-end-${targetUserId}-${equipmentItem.id}`,
                    timestamp: equipmentItem.repairEndDate,
                    title: `Maintenance terminée: ${equipmentItem.name}`,
                    meta: equipmentItem.assetId,
                    icon: 'build_circle',
                });
            }
            return entries;
        })
    ), [targetUserId, userEquipment]);

    const userMovementItems = useMemo(() => (
        [...userUsageEventItems, ...syntheticUserUsageItems]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .filter((entry, index, list) => (
                list.findIndex(
                    (candidate) =>
                        candidate.title === entry.title
                        && candidate.meta === entry.meta
                        && new Date(candidate.timestamp).getTime() === new Date(entry.timestamp).getTime(),
                ) === index
            ))
            .slice(0, MAX_USER_MOVEMENT_HISTORY_ITEMS)
    ), [syntheticUserUsageItems, userUsageEventItems]);

    if (!user) return <div className="p-page-sm medium:p-page text-center text-on-surface-variant">Utilisateur non trouvé</div>;

    const pendingApprovalCount = approvals.filter((approval) =>
        ACTIVE_APPROVAL_STATUSES.includes(approval.status)
        && (approval.requesterId === targetUserId || approval.beneficiaryId === targetUserId),
    ).length;

    const summaryStats = [
        { label: 'Équipements Assignés', value: userEquipment.length },
        { label: 'Demandes en Attente', value: pendingApprovalCount }
    ];

    const isOwnProfile = currentUserAuth?.id === userId;
    const isTeamMember = user.managerId === currentUserAuth?.id;
    const activeSuperAdminCount = users.filter(
        (existingUser) => existingUser.role === 'SuperAdmin' && existingUser.status !== 'inactive',
    ).length;
    const isProtectedSuperAdmin = user.role === 'SuperAdmin' && currentUserAuth?.role !== 'SuperAdmin';
    const roleDeleteDecision = canDeleteUserByRoleRule({
        actorRole: currentUserAuth?.role,
        targetRole: user.role,
        isSelfDelete: isOwnProfile,
        activeSuperAdminCount,
    });
    const canEdit = (permissions.canManageUsers && !isProtectedSuperAdmin) || isTeamMember || isOwnProfile;
    const canDelete = permissions.canManageUsers && roleDeleteDecision.allowed;

    const handleAssignClick = () => {
        navigate(`/wizards/assignment?context=user_details&userId=${encodeURIComponent(user.id)}`);
    };

    const handlePrimaryDeviceClick = () => {
        if (primaryDevice && onEquipmentClick) {
            onEquipmentClick(primaryDevice.id);
        }
    };

    const handleEditProfile = () => {
        navigate(`/users/edit/${userId}`);
    };

    const handleDelete = () => {
        if (!roleDeleteDecision.allowed) {
            showToast(roleDeleteDecision.reason || `Suppression impossible pour ${user.name}.`, "error");
            return;
        }

        if (userEquipment.length > 0) {
            showToast(`Impossible de supprimer ${user.name} : des équipements sont encore rattachés à ce compte.`, "error");
            return;
        }

        requestConfirmation({
            title: "Supprimer définitivement l'utilisateur",
            message: `Êtes-vous certain de vouloir supprimer le compte de ${user.name} ? Cette action supprimera tout son historique et est irréversible.`,
            confirmText: "Supprimer le compte",
            variant: "danger",
            confirmKeyword: user.role !== 'User' ? "SUPPRIMER" : undefined,
            onConfirm: () => {
                const decision = deleteUser(user.id);
                if (decision.allowed) {
                    showToast(`L'utilisateur ${user.name} a été supprimé définitivement.`, 'success');
                    if (isDemoSeedUser(user.id)) {
                        showToast(DEMO_RESEED_NOTICE, 'info');
                    }
                    onBack();
                    return;
                }
                showToast(decision.reason || `Suppression impossible pour ${user.name}.`, 'error');
            }
        });
    };

    const ensureSystemAccount = async (): Promise<AppUser | null> => {
        if (authUser) return authUser;

        try {
            const account = await authService.createUser({
                MicrosoftEmail: user?.email || '',
                FirstName: user?.name.split(' ')[0] || '',
                LastName: user?.name.split(' ').slice(1).join(' ') || '',
                Role: user.role,
                Title: user?.name,
            });
            setAuthUser(account);
            showToast('Compte système créé automatiquement.', 'info');
            return account;
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Impossible de créer le compte système.";
            showToast(message, 'error');
            return null;
        }
    };

    const handleResetPassword = () => {
        if (!canManageAccountSecurity) {
            showToast("Action réservée aux administrateurs.", "error");
            return;
        }

        const accountMissing = !authUser;
        requestConfirmation({
            title: 'Réinitialiser le mot de passe',
            message: accountMissing
                ? `Aucun compte système n'existe pour ${user.name}. Un compte sera créé puis un mot de passe temporaire sera généré.`
                : `Un mot de passe temporaire sera généré pour ${user.name}. L'utilisateur devra le changer à la prochaine connexion.`,
            confirmText: 'Réinitialiser',
            variant: 'warning',
            onConfirm: async () => {
                const account = await ensureSystemAccount();
                if (!account) return;

                try {
                    const result = await authService.resetUserPassword(account.id);
                    setAuthUser(result.user);
                    setLatestTempPassword(result.temporaryPassword);
                    setLatestTempPin(null);

                    try {
                        if (navigator?.clipboard?.writeText) {
                            await navigator.clipboard.writeText(result.temporaryPassword);
                            showToast(`Mot de passe temporaire: ${result.temporaryPassword} (copié).`, 'success');
                            return;
                        }
                    } catch {
                        // Clipboard may be unavailable (permissions/non secure context).
                    }

                    showToast(`Mot de passe temporaire: ${result.temporaryPassword}`, 'success');
                } catch (error) {
                    const message = error instanceof Error
                        ? error.message
                        : 'Réinitialisation du mot de passe impossible.';
                    showToast(message, 'error');
                }
            },
        });
    };

    const handleResetPin = () => {
        if (!canManageAccountSecurity) {
            showToast("Action réservée aux administrateurs.", "error");
            return;
        }

        const accountMissing = !authUser;
        requestConfirmation({
            title: 'Réinitialiser le PIN',
            message: accountMissing
                ? `Aucun compte système n'existe pour ${user.name}. Un compte sera créé puis un PIN temporaire sera généré.`
                : `Un PIN temporaire sera généré pour ${user.name}. L'utilisateur devra le changer lors de sa prochaine validation sécurisée.`,
            confirmText: 'Réinitialiser PIN',
            variant: 'warning',
            onConfirm: async () => {
                const account = await ensureSystemAccount();
                if (!account) return;

                try {
                    const result = await authService.resetUserPin(account.id);
                    setAuthUser(result.user);
                    setLatestTempPin(result.temporaryPin);
                    setLatestTempPassword(null);

                    try {
                        if (navigator?.clipboard?.writeText) {
                            await navigator.clipboard.writeText(result.temporaryPin);
                            showToast(`PIN temporaire: ${result.temporaryPin} (copié).`, 'success');
                            return;
                        }
                    } catch {
                        // Clipboard may be unavailable (permissions/non secure context).
                    }

                    showToast(`PIN temporaire: ${result.temporaryPin}`, 'success');
                } catch (error) {
                    const message = error instanceof Error
                        ? error.message
                        : 'Réinitialisation du PIN impossible.';
                    showToast(message, 'error');
                }
            },
        });
    };

    const handleToggleAccountStatus = () => {
        if (!canManageAccountSecurity) {
            showToast("Action réservée aux administrateurs.", "error");
            return;
        }
        if (!authUser) {
            showToast("Aucun compte système trouvé. Créez ou réinitialisez d'abord le compte.", "warning");
            return;
        }

        const isInactive = authUser.Status === 'inactive';
        const nextStatus: AppUser['Status'] = isInactive ? 'active' : 'inactive';

        requestConfirmation({
            title: isInactive ? 'Activer le compte' : 'Suspendre le compte',
            message: isInactive
                ? `Le compte de ${user.name} sera réactivé immédiatement.`
                : `Le compte de ${user.name} sera suspendu et ne pourra plus se connecter.`,
            confirmText: isInactive ? 'Activer' : 'Suspendre',
            variant: isInactive ? 'info' : 'warning',
            onConfirm: async () => {
                try {
                    const updated = await authService.setUserStatus(authUser.id, nextStatus);
                    setAuthUser(updated);
                    showToast(
                        nextStatus === 'inactive'
                            ? 'Compte suspendu.'
                            : 'Compte réactivé.',
                        'success',
                    );
                } catch (error) {
                    const message = error instanceof Error
                        ? error.message
                        : 'Mise à jour du statut impossible.';
                    showToast(message, 'error');
                }
            },
        });
    };

    const formatDateTime = (value?: string) => {
        if (!value) return 'Jamais';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDeviceIcon = (type: string) => getCategoryIcon(type);

    const menuItems: MenuItem[] = [
        ...(canDelete ? [{
            id: 'delete-profile',
            label: 'Supprimer le compte',
            icon: 'delete',
            onSelect: handleDelete,
            destructive: true,
        }] : []),
    ];

    const compactAction = menuItems.length > 0 ? (
        <div className="flex items-center gap-1">
            {canEdit && (
                <Button
                    variant="text"
                    onClick={handleEditProfile}
                    className="rounded-full w-11 h-11 min-w-0 p-0 flex items-center justify-center"
                    icon={<MaterialIcon name="edit" size={22} />}
                    aria-label="Modifier le profil"
                />
            )}
            {menuItems.length > 0 && (
                <Menu
                    title="Options de gestion"
                    items={menuItems}
                    align="end"
                    widthClassName="w-56"
                    trigger={(
                        <Button
                            variant="text"
                            className="rounded-full w-11 h-11 p-0 flex items-center justify-center transition-colors"
                            aria-label="Menu d'actions"
                        >
                            <MaterialIcon name="more_vert" size={24} />
                        </Button>
                    )}
                />
            )}
        </div>
    ) : canEdit ? (
        <Button
            variant="text"
            onClick={handleEditProfile}
            className="rounded-full w-11 h-11 min-w-0 p-0 flex items-center justify-center"
            icon={<MaterialIcon name="edit" size={22} />}
            aria-label="Modifier le profil"
        />
    ) : null;

    const desktopAction = (canEdit || menuItems.length > 0) ? (
        <div className="flex items-center gap-2">
            {canEdit && (
                <Button
                    variant="outlined"
                    onClick={handleEditProfile}
                    icon={<MaterialIcon name="edit" size={18} />}
                >
                    Modifier
                </Button>
            )}
            {menuItems.length > 0 && (
                <Menu
                    title="Options de gestion"
                    items={menuItems}
                    align="end"
                    widthClassName="w-56"
                    trigger={(
                        <Button
                            variant="text"
                            className="rounded-full w-10 h-10 p-0 flex items-center justify-center transition-colors"
                            aria-label="Menu d'actions"
                        >
                            <MaterialIcon name="more_vert" size={24} />
                        </Button>
                    )}
                />
            )}
        </div>
    ) : null;

    const userDetailsTabs: Array<{ id: UserDetailsTab; label: string; shortLabel?: string }> = [
        { id: 'overview', label: 'Aperçu & Sécurité', shortLabel: 'Aperçu' },
        { id: 'equipment', label: 'Équipements' },
    ];

    const compactBar = (
        <div className="flex h-full items-center gap-2">
                        <Button
                            variant="text"
                            onClick={onBack}
                            className="h-11 w-11 min-w-0 rounded-full !text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-none shadow-none p-0"
                            icon={<MaterialIcon name="arrow_back" size={24} />}
                            aria-label="Retour"
                        />

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="relative shrink-0">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-10 h-10 rounded-full border-2 border-surface shadow-elevation-1 bg-surface-container object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-title-small text-on-surface font-bold truncate">{user.name}</h1>
                                <p className="text-label-small text-on-surface-variant truncate">{user.role} • {user.department}</p>
                            </div>
                        </div>

                        {compactAction}
        </div>
    );

    const compactHero = (
        <div className="px-page-sm medium:px-page pb-2">
                        <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center gap-2 text-body-small text-on-surface-variant">
                                <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-sm border border-outline-variant min-w-0 max-w-full">
                                    <MaterialIcon name="mail" size={14} className="text-primary shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-sm border border-outline-variant">
                                    <MaterialIcon name="phone" size={14} className="text-primary" />
                                    <span className="truncate">{displayPhone}</span>
                                </div>
                            </div>

                            {user.lastLogin && (
                                <p className="text-label-small text-on-surface-variant">Dernier login : {formatDateTime(user.lastLogin)}</p>
                            )}
                        </div>
        </div>
    );

    const detailsTabs = (
        <PageTabs
            activeId={activeTab}
            onChange={(tabId) => setActiveTab(tabId as UserDetailsTab)}
            idBase={USER_DETAILS_TABS_ID_BASE}
            ariaLabel="Navigation détails utilisateur"
            items={userDetailsTabs}
        />
    );

    const desktopHero = (
                        <DetailHeader
                            leadingVisual={(
                                <div className="relative">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-24 h-24 large:w-32 large:h-32 rounded-full border-4 border-surface shadow-elevation-2 bg-surface-container object-cover"
                                    />
                                </div>
                            )}
                            title={user.name}
                            subtitle={(
                                <div className="space-y-3">
                                    <p className="text-on-surface-variant text-body-large flex items-center gap-2">
                                        {user.role} <span className="w-1 h-1 rounded-full bg-outline-variant" /> {user.department}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-3 text-body-small text-on-surface-variant">
                                        <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-sm border border-outline-variant">
                                            <MaterialIcon name="mail" size={16} className="text-primary" />
                                            {user.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-sm border border-outline-variant">
                                            <MaterialIcon name="phone" size={16} className="text-primary" />
                                            {displayPhone}
                                        </div>
                                        {user.lastLogin && (
                                            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-sm border border-outline-variant">
                                                <MaterialIcon name="schedule" size={16} className="text-primary" />
                                                Dernier login : {formatDateTime(user.lastLogin)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            actions={desktopAction}
                            contentClassName="large:items-start"
                        />
    );

    const desktopBar = (scrolled: boolean) => (
        <div className="flex h-full items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button
                    variant="text"
                    onClick={onBack}
                    className="h-10 w-10 min-w-0 p-0 rounded-full"
                    icon={<MaterialIcon name="arrow_back" size={20} />}
                    aria-label="Retour"
                />
                <div
                    className={cn(
                        'flex items-center gap-2 min-w-0 transition-opacity duration-medium2 ease-emphasized',
                        scrolled ? 'opacity-100 visible' : 'opacity-0 invisible'
                    )}
                >
                    <img
                        src={user.avatar}
                        alt={user.name}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container object-cover"
                    />
                    <div className="min-w-0">
                        <p className="text-body-medium font-semibold text-on-surface truncate">{user.name}</p>
                        <p className="text-label-small text-on-surface-variant truncate">{user.role} • {user.department}</p>
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    'shrink-0 transition-opacity duration-medium2 ease-emphasized',
                    scrolled ? 'opacity-100 visible' : 'opacity-0 invisible'
                )}
            >
                {desktopAction}
            </div>
        </div>
    );

    return (
        <DetailPageShell
            bar={isCompactLayout ? () => compactBar : desktopBar}
            hero={isCompactLayout ? compactHero : desktopHero}
            tabs={detailsTabs}
        >
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <section
                            role="tabpanel"
                            id={getTabPanelId(USER_DETAILS_TABS_ID_BASE, 'overview')}
                            aria-labelledby={getTabElementId(USER_DETAILS_TABS_ID_BASE, 'overview')}
                        >
                            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-macro">
                            <div className="expanded:col-span-3 space-y-6">
                            {primaryDevice && isPhone ? (
                                /* Variante compacte téléphone (X9) : rangée fonctionnelle au lieu du héro décoratif */
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={handlePrimaryDeviceClick}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePrimaryDeviceClick(); }}
                                    className="bg-surface rounded-md border border-outline-variant shadow-elevation-1 p-4 flex items-center gap-4 w-full cursor-pointer hover:bg-surface-container-low transition-colors duration-short4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                                >
                                    <div className="shrink-0 w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant">
                                        <MaterialIcon name={getDeviceIcon(primaryDevice.type)} size={24} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-label-small text-on-surface-variant uppercase tracking-wide">Appareil principal</p>
                                        <p className="text-title-medium text-on-surface truncate">{primaryDevice.name}</p>
                                        <p className="text-body-small text-on-surface-variant truncate">
                                            <span className="font-mono">{primaryDevice.assetId}</span> · {primaryDevice.status}
                                        </p>
                                    </div>
                                    <MaterialIcon name="chevron_right" size={20} className="text-outline shrink-0" />
                                </div>
                            ) : primaryDevice ? (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={handlePrimaryDeviceClick}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePrimaryDeviceClick(); }}
                                    className="bg-gradient-to-br from-inverse-surface to-inverse-surface/90 rounded-md p-card text-inverse-on-surface shadow-elevation-3 relative overflow-hidden group w-full cursor-pointer hover:scale-[1.01] hover:shadow-elevation-4 transition-all duration-medium2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary blur-[120px] opacity-10 rounded-full pointer-events-none"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-inverse-on-surface/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col expanded:flex-row items-center gap-8">
                                        <div className="shrink-0 p-6 bg-inverse-on-surface/10 rounded-xl border border-inverse-on-surface/10 backdrop-blur-md group-hover:bg-inverse-on-surface/15 transition-colors duration-medium2">
                                            <MaterialIcon name={getDeviceIcon(primaryDevice.type)} size={64} className="text-primary" />
                                        </div>

                                        <div className="flex-1 text-center expanded:text-left">
                                            <div className="flex items-center justify-center expanded:justify-start gap-3 mb-2">
                                                <span className="text-primary text-label-medium font-bold uppercase tracking-widest border border-primary/30 px-2 py-0.5 rounded text-[10px]">Appareil principal</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary/20 text-tertiary text-label-small">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary"></div>
                                                    {primaryDevice.status}
                                                </div>
                                            </div>

                                            <h3 className="text-display-small mb-2 group-hover:text-primary transition-colors">{primaryDevice.name}</h3>

                                            <div className="flex flex-wrap items-center justify-center expanded:justify-start gap-x-8 gap-y-4 mt-6">
                                                <div className="text-left">
                                                    <p className="text-label-small text-on-surface-variant uppercase tracking-wide opacity-70">Modèle</p>
                                                    <p className="text-title-medium">{primaryDevice.model}</p>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-label-small text-on-surface-variant uppercase tracking-wide opacity-70">Type</p>
                                                    <p className="text-title-medium">{primaryDevice.type}</p>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-label-small text-on-surface-variant uppercase tracking-wide opacity-70">Identifiant</p>
                                                    <p className="text-title-medium font-mono">{primaryDevice.assetId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 self-end expanded:self-center opacity-0 group-hover:opacity-100 transition-opacity duration-medium2 -translate-x-4 group-hover:translate-x-0">
                                            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                                                <MaterialIcon name="arrow_forward" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-surface rounded-md p-10 border border-dashed border-outline-variant text-center">
                                    <MaterialIcon name="devices_other" size={48} className="text-outline mx-auto mb-4" />
                                    <p className="text-title-medium text-on-surface mb-2">Aucun appareil principal</p>
                                    <p className="text-body-medium text-on-surface-variant mb-6 max-w-md mx-auto">Cet utilisateur n'a pas d'équipement principal assigné. Assignez un ordinateur ou une tablette pour démarrer.</p>
                                    {permissions.canManageInventory && (
                                        <Button
                                            type="button"
                                            variant="filled"
                                            onClick={handleAssignClick}
                                            icon={<MaterialIcon name="add" size={18} />}
                                        >
                                            Assigner un équipement
                                        </Button>
                                    )}
                                </div>
                            )}

                            {canManageAccountSecurity && (
                                <div className="bg-surface rounded-md p-card shadow-elevation-1 border border-outline-variant">
                                    <div className="flex flex-col medium:flex-row medium:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-primary-container rounded-md shrink-0">
                                                <MaterialIcon name="security" size={24} className="text-on-primary-container" />
                                            </div>
                                            <div>
                                                <h3 className="text-title-medium text-on-surface flex items-center gap-2">
                                                    Sécurité du Compte
                                                    {!import.meta.env.VITE_AUTH_API_BASE_URL && (
                                                        <DemoBadge title="Statuts issus du service d'authentification de démonstration — aucun backend configuré" />
                                                    )}
                                                </h3>
                                                <p className="text-body-medium text-on-surface-variant mt-1">Gérez les accès et le statut de connexion.</p>

                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className={`px-2 py-0.5 rounded text-label-small font-medium border ${
                                                        authUser?.Status === 'active'
                                                            ? 'bg-notebook-success/10 text-notebook-success border-notebook-success/20'
                                                            : authUser?.Status === 'pending'
                                                                ? 'bg-warning/10 text-warning border-warning/30'
                                                                : 'bg-notebook-danger/10 text-notebook-danger border-notebook-danger/20'
                                                    }`}>
                                                        {authUser?.Status === 'active'
                                                            ? 'ENTRA ID: ACTIF'
                                                            : authUser?.Status === 'pending'
                                                                ? 'ENTRA ID: EN ATTENTE'
                                                                : 'ENTRA ID: INACTIF'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className={`px-2 py-0.5 rounded text-label-small font-medium border ${
                                                        authUser?.PinStatus === 'active'
                                                            ? 'bg-notebook-success/10 text-notebook-success border-notebook-success/20'
                                                            : authUser?.PinStatus === 'pending'
                                                                ? 'bg-warning/10 text-warning border-warning/30'
                                                                : 'bg-outline-variant/50 text-on-surface-variant border-outline-variant'
                                                    }`}>
                                                        {authUser?.PinStatus === 'active'
                                                            ? 'PIN: ACTIF'
                                                            : authUser?.PinStatus === 'pending'
                                                                ? 'PIN: À RÉINITIALISER'
                                                                : 'PIN: NON CONFIGURÉ'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 shrink-0">
                                            <Button
                                                variant="outlined"
                                                onClick={handleResetPassword}
                                                icon={<MaterialIcon name="lock_reset" size={18} />}
                                            >
                                                Réinitialiser MDP
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={handleResetPin}
                                                icon={<MaterialIcon name="pin" size={18} />}
                                            >
                                                Réinitialiser PIN
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                className={
                                                    authUser?.Status === 'inactive'
                                                        ? '!text-notebook-success !border-notebook-success/40 hover:!bg-notebook-success/10'
                                                        : '!text-error !border-error/30 hover:!bg-error/5'
                                                }
                                                onClick={handleToggleAccountStatus}
                                                icon={<MaterialIcon name={authUser?.Status === 'inactive' ? 'check_circle' : 'block'} size={18} />}
                                                disabled={!authUser}
                                            >
                                                {authUser?.Status === 'inactive' ? 'Activer' : 'Suspendre'}
                                            </Button>
                                        </div>
                                    </div>
                                    {!authUser && (
                                        <p className="mt-3 text-body-small text-on-surface-variant">
                                            Aucun compte système lié. Les actions de réinitialisation créeront le compte automatiquement.
                                        </p>
                                    )}

                                    {latestTempPassword && (
                                        <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Mot de passe temporaire</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <code className="rounded-sm bg-surface px-2 py-1 text-body-medium text-on-surface">
                                                    {latestTempPassword}
                                                </code>
                                                <Button
                                                    variant="text"
                                                    size="sm"
                                                    icon={<MaterialIcon name="content_copy" size={16} />}
                                                    onClick={async () => {
                                                        try {
                                                            if (navigator?.clipboard?.writeText) {
                                                                await navigator.clipboard.writeText(latestTempPassword);
                                                                showToast('Mot de passe temporaire copié.', 'success');
                                                            } else {
                                                                showToast("Copie automatique indisponible dans ce navigateur.", 'warning');
                                                            }
                                                        } catch {
                                                            showToast('Impossible de copier automatiquement le mot de passe.', 'warning');
                                                        }
                                                    }}
                                                >
                                                    Copier
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {latestTempPin && (
                                        <div className="mt-4 rounded-md border border-primary/30 bg-primary-container/20 px-3 py-2">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">PIN temporaire</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <code className="rounded-sm bg-surface px-2 py-1 text-body-medium text-on-surface">
                                                    {latestTempPin}
                                                </code>
                                                <Button
                                                    variant="text"
                                                    size="sm"
                                                    icon={<MaterialIcon name="content_copy" size={16} />}
                                                    onClick={async () => {
                                                        try {
                                                            if (navigator?.clipboard?.writeText) {
                                                                await navigator.clipboard.writeText(latestTempPin);
                                                                showToast('PIN temporaire copié.', 'success');
                                                            } else {
                                                                showToast("Copie automatique indisponible dans ce navigateur.", 'warning');
                                                            }
                                                        } catch {
                                                            showToast('Impossible de copier automatiquement le PIN.', 'warning');
                                                        }
                                                    }}
                                                >
                                                    Copier
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <MovementTimeline
                                title="Historique d'utilisation des équipements"
                                items={userMovementItems}
                                emptyMessage="Aucun mouvement d'équipement enregistré pour cet utilisateur."
                            />
                            </div>

                            <div className="space-y-6">
                                <div className="bg-surface rounded-md p-card shadow-elevation-1 border border-outline-variant">
                                    <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest mb-4">RÉSUMÉ DES ACTIFS</h3>
                                    <div className="space-y-4">
                                        {summaryStats.map((stat, idx) => (
                                            <div key={idx} className="flex items-center justify-between border-b border-outline-variant last:border-0 pb-2 last:pb-0">
                                                <span className="text-body-medium text-on-surface-variant">{stat.label}</span>
                                                <span className="text-title-large font-bold text-on-surface">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-surface rounded-md p-card shadow-elevation-1 border border-outline-variant flex flex-col">
                                    <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest mb-4">NOTES MANAGER</h3>
                                    <div className="flex-1 bg-surface-container-low rounded-sm p-4 text-body-medium text-on-surface-variant mb-4 leading-relaxed border border-outline-variant italic">
                                        {user.managerId ? (
                                            <>
                                                <p className="mb-2">Sous la supervision directe.</p>
                                                <p>"Employé performant, gestion du matériel exemplaire."</p>
                                            </>
                                        ) : (
                                            "Aucune note récente pour cet utilisateur."
                                        )}
                                    </div>
                                    <Button
                                        variant="tonal"
                                        onClick={() => showToast('Fonctionnalité de note bientôt disponible', 'info')}
                                        className="self-end"
                                        size="sm"
                                        icon={<MaterialIcon name="edit_note" size={18} />}
                                    >
                                        Éditer
                                    </Button>
                                </div>
                            </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'equipment' && (
                        <section
                            role="tabpanel"
                            id={getTabPanelId(USER_DETAILS_TABS_ID_BASE, 'equipment')}
                            aria-labelledby={getTabElementId(USER_DETAILS_TABS_ID_BASE, 'equipment')}
                        >
                            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-macro">
                            {userEquipment.length > 0 ? (
                                userEquipment.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => onEquipmentClick && onEquipmentClick(item.id)}
                                        className="bg-surface rounded-md p-card shadow-elevation-1 border border-transparent hover:border-primary/50 hover:shadow-elevation-2 transition-all duration-short4 cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-surface-container-low rounded-md group-hover:bg-primary-container transition-colors">
                                                <MaterialIcon name={getDeviceIcon(item.type)} size={24} className="text-on-surface-variant group-hover:text-primary" />
                                            </div>
                                            <Badge variant={item.status === 'Attribué' ? 'info' : 'neutral'}>{getStatusLabel(item.status)}</Badge>
                                        </div>
                                        <h4 className="text-title-medium text-on-surface mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                                        <p className="text-body-small text-on-surface-variant mb-4">{item.assetId}</p>
                                        <div className="flex items-center gap-2 text-label-small text-on-surface-variant pt-4 border-t border-outline-variant">
                                            <MaterialIcon name="schedule" size={12} /> Assigné le {new Date(item.assignedAt || Date.now()).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-surface rounded-md border border-dashed border-outline-variant">
                                    <MaterialIcon name="info" size={32} className="text-outline mb-3" />
                                    <p className="text-on-surface-variant">Aucun équipement assigné.</p>
                                </div>
                            )}
                            {permissions.canManageInventory && (
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={handleAssignClick}
                                    className="h-auto min-h-[200px] w-full !rounded-md !border-2 !border-dashed !border-outline-variant !bg-transparent !p-card !text-on-surface-variant !flex-col !items-center !justify-center group hover:!border-primary hover:!bg-primary-container/20 hover:!text-on-surface"
                                >
                                    <div className="w-12 h-12 bg-surface-container-low rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                        <MaterialIcon name="add" size={24} />
                                    </div>
                                    <span className="text-label-large text-on-surface-variant group-hover:text-on-surface">Assigner un nouvel équipement</span>
                                </Button>
                            )}
                            </div>
                        </section>
                    )}
                </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </DetailPageShell>
    );
};

export default UserDetailsPage;

