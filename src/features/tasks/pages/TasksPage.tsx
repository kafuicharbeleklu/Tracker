import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretRight,
    CheckCircle,
    ClipboardText,
    DeviceMobile,
    Funnel,
    Headphones,
    Key,
    Laptop,
    Monitor,
    Mouse,
    Package,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import ListTemplate, { type ListFacet } from '../../../components/layout/ListTemplate';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import BottomSheet from '../../../components/ui/BottomSheet';
import SecurityGate from '../../../components/security/SecurityGate';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import {
    canUserActOnApproval,
    getAvailableApprovalActions,
    isApprovalActiveStatus,
    isApprovalHistoryStatus,
} from '../../../lib/businessRules';
import { getCategoryLabel } from '../../../constants/glossary';
import { ApprovalStatus, ViewType } from '../../../types';
import { cn } from '../../../lib/utils';

/** La boîte de travail unique de la planche 03.3. */
export type TaskNature = 'validation' | 'collecte' | 'reception' | 'retour' | 'remise';
type TaskScope = 'todo' | 'following' | 'history';
type TaskOrder = 'oldest' | 'newest';

interface Task {
    id: string;
    nature: TaskNature;
    scope: TaskScope;
    /** Ce dont il s'agit — un objet ou une personne, jamais le nom de la tâche. */
    title: string;
    /** L'état qui appelle le geste ou explique le suivi. */
    context: string;
    /** Depuis quand, quand la donnée le dit. */
    since: string | null;
    /** Le verbe n'apparaît que si la transition est réellement disponible ici. */
    action?: string;
    target: ViewType;
    targetId?: string;
    /**
     * La machine remontée par la collecte. Elle **s'examine ici** : la planche 14.1
     * a sorti sa file de Paramètres — « Paramètres règle les sources ; il ne garde
     * pas leur produit » — et un geste qui renvoyait à l'écran de réglages faisait
     * traverser trois onglets pour dire oui ou non.
     */
    deviceId?: string;
    initials?: string;
    icon?: PhosphorGlyph;
    transition?: { approvalId: string; nextStatus: ApprovalStatus };
}

const NATURE_LABEL: Record<TaskNature, string> = {
    validation: 'Demandes',
    collecte: 'Collecte',
    remise: 'Remises',
    reception: 'Réceptions',
    retour: 'Retours',
};

const SCOPE_LABEL: Record<TaskScope, string> = {
    todo: 'À faire',
    following: 'À suivre',
    history: 'Historique',
};

const TASKS_PAGE_SIZE = 30;

/** Jours écoulés, en entier — une file se lit en jours, pas en minutes. */
const daysSince = (iso: string | null): number | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

const ageLabel = (iso: string | null): string => {
    const days = daysSince(iso);
    if (days === null || days === 0) return "aujourd'hui";
    if (days === 1) return '1 j';
    return `${days} j`;
};

const getCategoryGlyph = (category?: string): PhosphorGlyph => {
    switch (category?.toUpperCase()) {
        case 'LAPTOP':
            return Laptop;
        case 'MONITOR':
        case 'SCREEN':
            return Monitor;
        case 'MOUSE':
            return Mouse;
        case 'PHONE':
        case 'MOBILE':
            return DeviceMobile;
        case 'HEADSET':
        case 'HEADPHONES':
            return Headphones;
        case 'KEYBOARD':
        case 'ACCESSORY':
            return Key;
        default:
            return Package;
    }
};

const extractInitials = (name?: string): string | undefined => {
    if (!name) return undefined;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase();
};

const getApprovalContext = (status: ApprovalStatus): string => {
    switch (status) {
        case 'WAITING_MANAGER_APPROVAL':
            return 'Validation du manager';
        case 'WAITING_IT_PROCESSING':
            return 'Attribution à préparer';
        case 'WAITING_DOTATION_APPROVAL':
            return 'Validation de la dotation';
        case 'PENDING_DELIVERY':
            return 'Réception à confirmer';
        case 'Completed':
            return 'Réception confirmée';
        case 'Rejected':
            return 'Demande refusée';
        case 'Cancelled':
            return 'Demande annulée';
    }
};

const getApprovalActionLabel = (status: ApprovalStatus): string | undefined => {
    switch (status) {
        case 'WAITING_MANAGER_APPROVAL':
            return 'Valider la demande';
        case 'WAITING_DOTATION_APPROVAL':
            return 'Valider la dotation';
        case 'PENDING_DELIVERY':
            return 'Confirmer la réception';
        default:
            return undefined;
    }
};

const getTransitionSuccessMessage = (status: ApprovalStatus): string => {
    switch (status) {
        case 'WAITING_IT_PROCESSING':
            return 'Demande validée. Transmise à l’IT.';
        case 'PENDING_DELIVERY':
            return 'Dotation validée. En attente de confirmation utilisateur.';
        case 'Completed':
            return 'Réception confirmée.';
        default:
            return 'Demande mise à jour.';
    }
};

interface TasksPageProps {
    onNavigate: (view: ViewType) => void;
    onItemClick: (view: ViewType, id: string) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ onNavigate, onItemClick }) => {
    const {
        approvals,
        equipment,
        users,
        detectedDevices,
        updateApproval,
        promoteDetectedDeviceToInventory,
        markDetectedDeviceAsIgnored,
    } = useData();
    const { user: currentUser, role, permissions } = useAccessControl();
    const { showToast } = useToast();

    const [nature, setNature] = useState<TaskNature | 'toutes'>('toutes');
    const [scope, setScope] = useState<TaskScope>('todo');
    const [order, setOrder] = useState<TaskOrder>('oldest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [reviewDeviceId, setReviewDeviceId] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(TASKS_PAGE_SIZE);

    const tasks = useMemo<Task[]>(() => {
        if (!currentUser) return [];

        const out: Task[] = [];
        const teamUserIds = new Set(
            role === 'Manager'
                ? users.filter((user) => user.managerId === currentUser.id).map((user) => user.id)
                : []
        );
        const isRelatedApproval = (approval: (typeof approvals)[number]) => {
            if (role === 'Admin' || role === 'SuperAdmin') return true;
            if (role === 'Manager') {
                return (
                    approval.requesterId === currentUser.id ||
                    approval.beneficiaryId === currentUser.id ||
                    teamUserIds.has(approval.requesterId) ||
                    teamUserIds.has(approval.beneficiaryId)
                );
            }
            return approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id;
        };

        approvals.forEach((approval) => {
            const equipmentLabel =
                approval.assignedEquipmentName ||
                approval.equipmentName ||
                getCategoryLabel(approval.equipmentCategory || '');
            const beneficiary = approval.beneficiaryName || approval.requesterName;
            const title = beneficiary ? `${beneficiary} — ${equipmentLabel}` : equipmentLabel || 'Demande d’équipement';
            const isActionable = canUserActOnApproval({
                approval,
                actorRole: role,
                actorId: currentUser.id,
                users,
            });

            if (isApprovalHistoryStatus(approval.status)) {
                if (isRelatedApproval(approval)) {
                    out.push({
                        id: `history-${approval.id}`,
                        nature: 'validation',
                        scope: 'history',
                        title,
                        context: getApprovalContext(approval.status),
                        since: approval.updatedAt || approval.createdAt,
                        target: 'approvals',
                        initials: extractInitials(beneficiary),
                        icon: ClipboardText,
                    });
                }
                return;
            }

            if (!isApprovalActiveStatus(approval.status)) return;

            if (isActionable) {
                const primary = getAvailableApprovalActions({
                    approval,
                    actorRole: role,
                    actorId: currentUser.id,
                    users,
                }).primary;
                const transition =
                    primary?.kind === 'transition' && primary.nextStatus
                        ? { approvalId: approval.id, nextStatus: primary.nextStatus }
                        : undefined;

                out.push({
                    id: `approval-${approval.id}`,
                    nature: approval.status === 'PENDING_DELIVERY' ? 'reception' : 'validation',
                    scope: 'todo',
                    title,
                    context: getApprovalContext(approval.status),
                    since: approval.createdAt ?? null,
                    action: transition ? getApprovalActionLabel(approval.status) : undefined,
                    transition,
                    target: 'approvals',
                    initials: extractInitials(beneficiary),
                    icon: ClipboardText,
                });
            } else if (isRelatedApproval(approval)) {
                out.push({
                    id: `following-${approval.id}`,
                    nature: approval.status === 'PENDING_DELIVERY' ? 'reception' : 'validation',
                    scope: 'following',
                    title,
                    context: `${getApprovalContext(approval.status)} · en attente d’un autre intervenant`,
                    since: approval.createdAt ?? null,
                    target: 'approvals',
                    initials: extractInitials(beneficiary),
                    icon: ClipboardText,
                });
            }
        });

        const approvalEquipmentIds = new Set(
            approvals.flatMap((approval) => (approval.assignedEquipmentId ? [approval.assignedEquipmentId] : []))
        );

        equipment.forEach((item) => {
            const title = `${item.name} (${item.assetId})`;
            const isHolder = item.user?.email?.toLowerCase() === currentUser.email?.toLowerCase();

            if (item.assignmentStatus === 'PENDING_DELIVERY') {
                if (role !== 'User') {
                    out.push({
                        id: `handover-${item.id}`,
                        nature: 'remise',
                        scope: 'todo',
                        title,
                        context: item.user?.name ? `Remise à faire à ${item.user.name}` : 'Remise à préparer',
                        since: item.assignedAt ?? null,
                        action: 'Remettre',
                        target: 'assignment_wizard',
                        targetId: item.id,
                        icon: getCategoryGlyph(item.type),
                    });
                } else if (isHolder && !approvalEquipmentIds.has(item.id)) {
                    out.push({
                        id: `delivery-${item.id}`,
                        nature: 'reception',
                        scope: 'todo',
                        title,
                        context: 'Réception à confirmer',
                        since: item.assignedAt ?? null,
                        action: 'Confirmer',
                        target: 'equipment_details',
                        targetId: item.id,
                        icon: getCategoryGlyph(item.type),
                    });
                }
            }

            if (item.assignmentStatus === 'PENDING_RETURN') {
                if (role !== 'User') {
                    out.push({
                        id: `return-${item.id}`,
                        nature: 'retour',
                        scope: 'todo',
                        title,
                        context: item.user?.name
                            ? `Retour à réceptionner de ${item.user.name}`
                            : 'Retour à réceptionner',
                        since: item.returnRequestedAt || item.assignedAt || null,
                        action: 'Réceptionner',
                        target: 'return_wizard',
                        targetId: item.id,
                        icon: getCategoryGlyph(item.type),
                    });
                } else if (isHolder) {
                    out.push({
                        id: `return-user-${item.id}`,
                        nature: 'retour',
                        scope: 'todo',
                        title,
                        context: 'Restitution demandée',
                        since: item.returnRequestedAt || item.assignedAt || null,
                        action: 'Restituer',
                        target: 'return_wizard',
                        targetId: item.id,
                        icon: getCategoryGlyph(item.type),
                    });
                }
            }
        });

        if (permissions.canManageInventory) {
            detectedDevices
                .filter((device) => ['pending_review', 'ambiguous_match'].includes(device.status))
                .forEach((device) => {
                    out.push({
                        id: `collection-${device.id}`,
                        nature: 'collecte',
                        scope: 'todo',
                        title: device.machineName || device.hostname || 'Machine détectée',
                        context:
                            device.status === 'ambiguous_match'
                                ? 'Correspondance à confirmer'
                                : 'Collecte automatique à valider',
                        since: device.firstSeenAt || device.lastSeenAt || null,
                        action: 'Examiner',
                        target: 'tasks',
                        deviceId: device.id,
                        icon: Laptop,
                    });
                });
        }

        return out.sort((left, right) => {
            if (!left.since) return 1;
            if (!right.since) return -1;
            return new Date(left.since).getTime() - new Date(right.since).getTime();
        });
    }, [approvals, equipment, users, detectedDevices, currentUser, role, permissions.canManageInventory]);

    const scopeTasks = useMemo(() => tasks.filter((task) => task.scope === scope), [scope, tasks]);
    const counts = useMemo(() => {
        const next: Record<TaskNature, number> = {
            validation: 0,
            collecte: 0,
            remise: 0,
            reception: 0,
            retour: 0,
        };
        scopeTasks.forEach((task) => {
            next[task.nature] += 1;
        });
        return next;
    }, [scopeTasks]);

    const scopeCounts = useMemo(
        () => ({
            todo: tasks.filter((task) => task.scope === 'todo').length,
            following: tasks.filter((task) => task.scope === 'following').length,
            history: tasks.filter((task) => task.scope === 'history').length,
        }),
        [tasks]
    );

    const facets = useMemo<ListFacet[]>(
        () => [
            { id: 'toutes', label: 'Tout', count: scopeTasks.length },
            ...(Object.keys(NATURE_LABEL) as TaskNature[]).map((taskNature) => ({
                id: taskNature,
                label: NATURE_LABEL[taskNature],
                count: counts[taskNature],
            })),
        ],
        [counts, scopeTasks.length]
    );

    const filteredTasks = useMemo(() => {
        const selected = nature === 'toutes' ? scopeTasks : scopeTasks.filter((task) => task.nature === nature);
        return [...selected].sort((left, right) => {
            const leftDate = left.since ? new Date(left.since).getTime() : Number.POSITIVE_INFINITY;
            const rightDate = right.since ? new Date(right.since).getTime() : Number.POSITIVE_INFINITY;
            return order === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
        });
    }, [nature, order, scopeTasks]);

    useEffect(() => {
        setVisibleCount(TASKS_PAGE_SIZE);
    }, [nature, order, scope]);

    const visibleTasks = useMemo(
        () => filteredTasks.slice(0, visibleCount),
        [filteredTasks, visibleCount]
    );

    const activeFilterCount = Number(nature !== 'toutes') + Number(order !== 'oldest') + Number(scope !== 'todo');
    const orderLabel = order === 'oldest' ? 'Les plus anciennes d’abord' : 'Les plus récentes d’abord';
    const scopeSubtitle =
        scope === 'todo'
            ? scopeCounts.todo === 0
                ? 'Rien n’attend votre geste'
                : `${scopeCounts.todo} ${scopeCounts.todo > 1 ? 'choses attendent votre geste' : 'chose attend votre geste'}`
            : scope === 'following'
              ? `${scopeCounts.following} ${scopeCounts.following > 1 ? 'tâches à suivre' : 'tâche à suivre'}`
              : `${scopeCounts.history} ${scopeCounts.history > 1 ? 'décisions dans l’historique' : 'décision dans l’historique'}`;

    const openTask = (task: Task) => {
        if (task.deviceId) {
            setReviewDeviceId(task.deviceId);
        } else if (task.targetId) {
            onItemClick(task.target, task.targetId);
        } else {
            onNavigate(task.target);
        }
    };

    const completeApprovalTask = (task: Task): boolean => {
        if (!task.transition) return false;
        const decision = updateApproval(task.transition.approvalId, task.transition.nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(getTransitionSuccessMessage(task.transition.nextStatus), 'success');
        return true;
    };

    const reviewDevice = useMemo(
        () => detectedDevices.find((device) => device.id === reviewDeviceId) ?? null,
        [detectedDevices, reviewDeviceId]
    );

    const clearFilters = () => {
        setNature('toutes');
        setScope('todo');
        setOrder('oldest');
    };

    return (
        <ListTemplate
            title="Tâches"
            subtitle={scopeSubtitle}
            filter={
                <Button
                    variant="text"
                    aria-label="Filtrer les tâches"
                    onClick={() => setIsFilterSheetOpen(true)}
                    className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring p-0"
                >
                    <Icon glyph={Funnel} size={20} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-inverse-surface px-1 text-[10px] font-semibold tabular-nums text-inverse-on-surface">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            }
            facets={facets}
            activeFacetId={nature}
            onFacetSelect={(id) => {
                setNature(id as TaskNature | 'toutes');
            }}
            count={{
                total: filteredTasks.length,
                shown: visibleTasks.length,
                noun: 'tâches',
            }}
            sort={{
                label: orderLabel,
                onClick: () => setOrder((current) => (current === 'oldest' ? 'newest' : 'oldest')),
            }}
            hasRows={visibleTasks.length > 0}
            empty={
                <ScreenState
                    icon={CheckCircle}
                    title={scope === 'todo' ? 'Vous êtes à jour' : `Aucune tâche ${SCOPE_LABEL[scope].toLowerCase()}`}
                    description={
                        scope === 'todo'
                            ? 'Rien n’attend votre geste. La file se remplira d’elle-même — vous n’avez pas à revenir la surveiller.'
                            : 'Changez de vue ou de nature pour consulter une autre partie de votre boîte de travail.'
                    }
                    footnote={
                        scope === 'todo'
                            ? 'Les validations, remises, réceptions, retours et appareils détectés arriveront ici lorsqu’ils demanderont votre intervention.'
                            : undefined
                    }
                />
            }
        >
            {visibleTasks.map((task) => {
                const IconGlyph = task.icon || Package;

                return (
                    <div
                        key={task.id}
                        onClick={() => openTask(task)}
                        className="flex min-h-[72px] items-center gap-3 border-t border-outline-variant py-2.5 px-3 rounded-md first:border-t-0 hover:bg-surface-container/50 transition-colors cursor-pointer"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-body-large font-brand font-semibold text-on-surface-variant">
                            {task.initials ? <span>{task.initials}</span> : <Icon glyph={IconGlyph} size={20} />}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-body-large font-medium text-on-surface">{task.title}</p>
                            <p className="truncate text-body-small text-text-secondary">
                                {task.context} · <strong className="font-semibold text-on-surface">{ageLabel(task.since)}</strong>
                            </p>
                        </div>

                        {task.action && task.transition ? (
                            <div onClick={(e) => e.stopPropagation()}>
                                <SecurityGate
                                    onVerified={() => completeApprovalTask(task)}
                                    title={task.action}
                                    description="Confirmez cette action avant de la rendre effective."
                                    entityId={task.transition.approvalId}
                                    entityName={task.title}
                                    trigger={
                                        <Button
                                            variant="tonal"
                                            size="sm"
                                            className="h-10 shrink-0 bg-inverse-surface px-3.5 text-inverse-on-surface hover:bg-inverse-surface/90"
                                        >
                                            {task.action}
                                        </Button>
                                    }
                                />
                            </div>
                        ) : task.action ? (
                            <Button
                                variant="tonal"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTask(task);
                                }}
                                className="h-10 shrink-0 bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-container-high)] px-3.5"
                            >
                                {task.action}
                            </Button>
                        ) : (
                            <Button
                                variant="text"
                                iconOnly
                                size="sm"
                                aria-label={`Ouvrir ${task.title}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTask(task);
                                }}
                                className="shrink-0 text-on-surface-variant"
                            >
                                <Icon glyph={CaretRight} size={20} />
                            </Button>
                        )}
                    </div>
                );
            })}

            {visibleTasks.length < filteredTasks.length && (
                <Button
                    variant="text"
                    onClick={() => setVisibleCount((count) => count + TASKS_PAGE_SIZE)}
                    className="w-full justify-center rounded-none border-t border-outline-variant px-0 text-on-surface"
                >
                    Voir les {Math.min(TASKS_PAGE_SIZE, filteredTasks.length - visibleTasks.length)} suivantes · {visibleTasks.length} sur {filteredTasks.length}
                </Button>
            )}

            {/* La machine remontée s'examine où elle attend — 14.1 a sorti la file de
                Paramètres, et un geste ne traverse pas l'application pour dire oui. */}
            <BottomSheet
                open={reviewDevice !== null}
                onClose={() => setReviewDeviceId(null)}
                title={reviewDevice?.machineName || 'Machine détectée'}
            >
                {reviewDevice && (
                    <div className="flex flex-col gap-3 px-5 py-3">
                        <dl className="flex flex-col">
                            {[
                                ['Nom réseau', reviewDevice.hostname],
                                ['Identifiant', reviewDevice.assetId],
                                ['Numéro de série', reviewDevice.serialNumber],
                                ['Système', reviewDevice.os],
                                [
                                    'Emplacement',
                                    [reviewDevice.country, reviewDevice.site, reviewDevice.service]
                                        .filter(Boolean)
                                        .join(' · '),
                                ],
                                ['Vue pour la dernière fois', ageLabel(reviewDevice.lastSeenAt)],
                            ]
                                .filter(([, value]) => Boolean(value))
                                .map(([label, value]) => (
                                    <div
                                        key={String(label)}
                                        className="flex min-h-11 items-center justify-between gap-3.5 border-t border-outline-variant py-[11px] text-body-medium leading-[19px] first:border-t-0"
                                    >
                                        <dt className="shrink-0 text-text-secondary">{label}</dt>
                                        <dd className="min-w-0 break-words text-right font-medium text-on-surface">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                        </dl>

                        {reviewDevice.status === 'ambiguous_match' && (
                            <p className="rounded-md bg-surface-container px-3 py-2.5 text-[12px] leading-[17px] text-text-secondary">
                                Plusieurs actifs du parc lui ressemblent. L'importer en créerait un de plus —
                                vérifiez d'abord lequel elle est.
                            </p>
                        )}

                        <div className="mt-3 flex items-center gap-3 border-t border-outline-variant pt-3.5">
                            <Button
                                variant="text"
                                onClick={() => {
                                    const ok = markDetectedDeviceAsIgnored(reviewDevice.id);
                                    showToast(ok ? 'Machine ignorée.' : 'Action refusée.', ok ? 'success' : 'warning');
                                    setReviewDeviceId(null);
                                }}
                            >
                                Ignorer
                            </Button>
                            <Button
                                variant="filled"
                                className="flex-1"
                                onClick={() => {
                                    const result = promoteDetectedDeviceToInventory(reviewDevice.id);
                                    showToast(result.message, result.ok ? 'success' : 'error');
                                    if (result.ok) setReviewDeviceId(null);
                                }}
                            >
                                Importer au parc
                            </Button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            <BottomSheet open={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filtrer">
                <div className="flex flex-col gap-4 px-5 py-3">
                    <div>
                        <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Nature</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                                variant={nature === 'toutes' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setNature('toutes')}
                                className={cn(
                                    'min-h-10 px-3 text-body-medium font-medium',
                                    nature === 'toutes'
                                        ? 'bg-inverse-surface text-inverse-on-surface'
                                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                )}
                            >
                                Tout {scopeTasks.length}
                            </Button>
                            {(Object.keys(NATURE_LABEL) as TaskNature[]).map((taskNature) => (
                                <Button
                                    key={taskNature}
                                    variant={nature === taskNature ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setNature(taskNature)}
                                    className={cn(
                                        'min-h-10 px-3 text-body-medium font-medium',
                                        nature === taskNature
                                            ? 'bg-inverse-surface text-inverse-on-surface'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    )}
                                >
                                    {NATURE_LABEL[taskNature]} {counts[taskNature]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Ordre</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(
                                [
                                    ['oldest', 'Les plus anciennes'],
                                    ['newest', 'Les plus récentes'],
                                ] as const
                            ).map(([value, label]) => (
                                <Button
                                    key={value}
                                    variant={order === value ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setOrder(value)}
                                    className={cn(
                                        'min-h-10 px-3 text-body-medium font-medium',
                                        order === value
                                            ? 'bg-inverse-surface text-inverse-on-surface'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    )}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Vue</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.keys(SCOPE_LABEL) as TaskScope[]).map((taskScope) => (
                                <Button
                                    key={taskScope}
                                    variant={scope === taskScope ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setScope(taskScope)}
                                    className={cn(
                                        'min-h-10 px-3 text-body-medium font-medium',
                                        scope === taskScope
                                            ? 'bg-inverse-surface text-inverse-on-surface'
                                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                    )}
                                >
                                    {SCOPE_LABEL[taskScope]} {scopeCounts[taskScope]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant pt-3">
                        <Button variant="ghost" onClick={clearFilters}>
                            Tout effacer
                        </Button>
                        <Button
                            variant="tonal"
                            className="flex-1 bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
                            onClick={() => setIsFilterSheetOpen(false)}
                        >
                            Voir les {filteredTasks.length} tâches
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </ListTemplate>
    );
};

export default TasksPage;
