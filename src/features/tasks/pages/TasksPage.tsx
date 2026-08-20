import { getCategoryGlyph } from '../../../constants/categoryIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretRight,
    Check,
    CheckCircle,
    ClipboardText,
    ClockCounterClockwise,
    DotsThreeVertical,
    Funnel,
    Info,
    Laptop,
    Package,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import ListTemplate, { type ListFacet } from '../../../components/layout/ListTemplate';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Menu from '../../../components/ui/Menu';
import { rowActivation } from '../../../lib/a11y';
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

/** La boîte de travail unique de la planche 08.1. */
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
    /**
     * Ce que la rangée ouvre. **Facultatif** : une tâche dont l'objet n'existe pas
     * encore — une demande sans équipement affecté — n'ouvre rien, elle porte son
     * geste sur place. Elle valait obligatoirement `'approvals'`, ce qui envoyait
     * vers un **second inventaire de la même file** (17.7 : « deux portes vers la
     * même file »). Corrigé le 20/08.
     */
    target?: ViewType;
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

/**
 * La nature d'une tâche se lit à une **paire teintée**, pas à un mot dans le contexte
 * — c'est le sous-titre même de la planche 03.3. Une paire = un fond et l'encre qui
 * tient dessus ; le socle les déclare ensemble pour qu'aucune ne dérive sans l'autre.
 * Métrique de `.np` : hauteur 22, rayon 4 (R11 : une étiquette de **mots** n'est pas
 * une pilule), 11 px / 500.
 */
const NATURE_TINT: Record<TaskNature, string> = {
    validation: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    remise: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    reception: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    retour: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    collecte: 'bg-[var(--tk-color-surface-muted-strong)] text-on-surface-variant',
};

/** Le mot que porte la pastille : au singulier, il qualifie UNE tâche. Les libellés
 *  de `NATURE_LABEL` sont au pluriel parce qu'ils comptent une facette. */
const NATURE_BADGE: Record<TaskNature, string> = {
    validation: 'Validation',
    collecte: 'Collecte',
    remise: 'Remise',
    reception: 'Réception',
    retour: 'Retour',
};

/**
 * `.rbtn` — le geste d'une rangée, déclaré **une seule fois**. Métrique du registre
 * (§2.14) et de la planche 03.3 : **44 px**, `padding: 0 14px`, rayon 4, **13 px / 500**.
 *
 * Le remplissage suit la **surface**, jamais l'écran (§2.7) : ces rangées sont sur une
 * carte claire, donc `--inset` et l'encre. Le tableau de bord emploie le même rôle sur
 * son héro inversé, où c'est le voile blanc qui s'applique — deux surfaces, deux
 * remplissages, un seul rôle.
 *
 * Il y en avait **deux ici**, et l'un des deux prenait la surface inversée `--dark` :
 * l'encre du héro et de la barre de sélection, jamais celle d'un geste de rangée.
 */
const ROW_ACTION =
    'h-11 shrink-0 px-3.5 text-[13px] bg-surface-container text-on-surface hover:bg-[var(--tk-color-surface-muted-strong)] hover:text-on-surface';

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



const extractInitials = (name?: string): string | undefined => {
    if (!name) return undefined;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase();
};

/**
 * Ce qu'ouvre une rangée d'approbation : **l'équipement dont elle parle**, comme une
 * rangée d'équipement ouvre le sien. Tant qu'aucun objet n'est affecté — une demande
 * encore à arbitrer — il n'y a rien à ouvrir : la rangée porte son geste sur place et
 * ne navigue pas. C'est ce qui remplace le renvoi vers l'ancienne liste des demandes.
 */
const approvalTarget = (approval: { assignedEquipmentId?: string }) =>
    approval.assignedEquipmentId
        ? { target: 'equipment_details' as ViewType, targetId: approval.assignedEquipmentId }
        : {};

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
    /* La recherche que `.srch` dessine sur la planche — « Personne, objet, code » —
       et que la bande n'avait pas, alors que les cinq autres listes la portent. */
    const [query, setQuery] = useState('');
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
                        ...approvalTarget(approval),
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
                    ...approvalTarget(approval),
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
                    ...approvalTarget(approval),
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
        const byNature = nature === 'toutes' ? scopeTasks : scopeTasks.filter((task) => task.nature === nature);
        // La recherche porte sur ce que la rangée montre : le sujet et son contexte.
        const needle = query.trim().toLowerCase();
        const selected = needle
            ? byNature.filter(
                  (task) =>
                      task.title.toLowerCase().includes(needle) ||
                      task.context.toLowerCase().includes(needle)
              )
            : byNature;
        return [...selected].sort((left, right) => {
            const leftDate = left.since ? new Date(left.since).getTime() : Number.POSITIVE_INFINITY;
            const rightDate = right.since ? new Date(right.since).getTime() : Number.POSITIVE_INFINITY;
            return order === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
        });
    }, [nature, order, query, scopeTasks]);

    useEffect(() => {
        setVisibleCount(TASKS_PAGE_SIZE);
    }, [nature, order, query, scope]);

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
        } else if (task.target && task.targetId) {
            onItemClick(task.target, task.targetId);
        } else if (task.target) {
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
                        <span className="absolute -right-1.5 -top-1.5 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-inverse-surface px-1 text-label-small font-semibold tabular-nums text-inverse-on-surface">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            }
            /*
              LES TROIS PORTÉES — dans le menu de l'en-tête, pas dans la bande.
              La planche 03.3 les dessine en contrôle segmenté ; le produit les met
              au ⋮. La raison est la cohérence entre listes : Tâches était **la seule**
              des six à porter une couche de contrôle que les autres n'ont pas, et P2
              autorise une action de page à cet emplacement. Le coût est réel et il est
              assumé : une partition dans un menu ne dit plus d'un coup d'œil où l'on
              est — c'est le sous-titre qui le porte, et la rangée en cours est marquée
              du creux de l'onglet actif. Arbitré le 20/08.
            */
            actions={
                <Menu
                    align="end"
                    items={(Object.keys(SCOPE_LABEL) as TaskScope[]).map((key) => ({
                        id: key,
                        label: SCOPE_LABEL[key],
                        trailingText:
                            key === 'history' || scopeCounts[key] === 0
                                ? undefined
                                : String(scopeCounts[key]),
                        selected: scope === key,
                        onSelect: () => setScope(key),
                    }))}
                    trigger={
                        <Button variant="text" iconOnly aria-label="Changer de vue">
                            <Icon glyph={DotsThreeVertical} />
                        </Button>
                    }
                />
            }
            search={{
                value: query,
                onChange: setQuery,
                placeholder: 'Personne, objet, code',
            }}
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
                    after={
                        scope === 'todo' ? (
                            <>
                                <p className="text-body-medium text-on-surface mb-2.5 font-medium">
                                    Ce qui arrivera ici
                                </p>
                                {[
                                    {
                                        glyph: Check,
                                        text: (
                                            <>
                                                Une demande <b className="text-on-surface font-medium">validée par un manager</b> — vous aurez la remise à faire.
                                            </>
                                        ),
                                    },
                                    {
                                        glyph: ClockCounterClockwise,
                                        text: (
                                            <>
                                                Une restitution attestée — vous aurez la{' '}
                                                <b className="text-on-surface font-medium">réception</b> à faire.
                                            </>
                                        ),
                                    },
                                    {
                                        glyph: Info,
                                        text: (
                                            <>
                                                Un retour qui <b className="text-on-surface font-medium">dépasse 7 jours</b> — il remontera seul, en tête.
                                            </>
                                        ),
                                    },
                                ].map((line, index) => (
                                    <p
                                        key={index}
                                        className="border-outline-variant text-body-medium text-on-surface-variant flex gap-2.5 border-t py-2.5 leading-[19px] first-of-type:border-t-0 first-of-type:pt-0"
                                    >
                                        <Icon glyph={line.glyph} size={18} className="mt-0.5 shrink-0" />
                                        <span>{line.text}</span>
                                    </p>
                                ))}
                            </>
                        ) : undefined
                    }
                />
            }
        >
            {visibleTasks.map((task) => {
                const IconGlyph = task.icon || Package;

                return (
                    /*
                      `.trow` de la planche 03.3 : rangée à plat, séparée par un filet,
                      12 px de gouttière, 10 px de padding vertical. Le creux du survol
                      déborde de 8 px — la mesure que 05.1 déclare pour une rangée en creux.
                    */
                    <div
                        key={task.id}
                        {...rowActivation(() => openTask(task))}
                        className="border-outline-variant hover:bg-surface-container/50 -mx-2 flex cursor-pointer items-center gap-3 rounded-md border-t px-2 py-2.5 transition-colors first:border-t-0"
                    >
                        <div className="rounded-vignette bg-surface-container text-body-large font-brand text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center font-semibold">
                            {task.initials ? <span>{task.initials}</span> : <Icon glyph={IconGlyph} size={20} />}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-label-large text-on-surface truncate font-medium">{task.title}</p>
                            {/*
                              La nature passe en **paire teintée** et quitte le texte :
                              « Validation du manager · 9 j » disait deux fois la même chose,
                              une fois en gris. La pastille nomme, l'âge décide — c'est lui
                              qui porte l'encre pleine, puisqu'une file se traite par le haut.
                            */}
                            <span className="text-body-small text-on-surface-variant mt-1 flex items-center gap-2">
                                <span
                                    className={cn(
                                        'text-label-small inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-md px-2 font-medium',
                                        NATURE_TINT[task.nature]
                                    )}
                                >
                                    {NATURE_BADGE[task.nature]}
                                </span>
                                <span className="text-on-surface shrink-0 font-medium">{ageLabel(task.since)}</span>
                            </span>
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
                                        <Button variant="tonal" size="sm" className={ROW_ACTION}>
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
                                className={ROW_ACTION}
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
                    className="border-outline-variant text-on-surface w-full justify-center gap-2.5 rounded-none border-t px-0"
                >
                    {/*
                      `.pag` — la file **pagine, elle ne synthétise pas** (règle de 03.3).
                      Le geste et le repère ne sont pas au même rang : « Voir les 11
                      suivantes » se vise, « 6 sur 17 » se lit. Ils étaient sur une seule
                      ligne, au même poids — le repère se lisait alors comme une partie
                      du geste.
                    */}
                    <span>
                        Voir les{' '}
                        {Math.min(TASKS_PAGE_SIZE, filteredTasks.length - visibleTasks.length)}{' '}
                        suivantes
                    </span>
                    <span className="text-body-small text-on-surface-variant font-normal tabular-nums">
                        {visibleTasks.length} sur {filteredTasks.length}
                    </span>
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
                            <p className="rounded-md bg-surface-container px-3 py-2.5 text-body-small text-text-secondary">
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
                        <p className="text-label-small tracking-[0.06em] text-text-secondary uppercase">Nature</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                                variant={nature === 'toutes' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setNature('toutes')}
                                className={cn(
                                    // Une chip DANS la feuille de filtre monte à 44 px (`.sgrp .chip`) :
                                    // elle est seule cible de sa ligne, là où la bande en aligne cinq à 40.
                                    'min-h-11 px-3 text-body-medium font-medium',
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
                                        // Une chip DANS la feuille de filtre monte à 44 px (`.sgrp .chip`) :
                                    // elle est seule cible de sa ligne, là où la bande en aligne cinq à 40.
                                    'min-h-11 px-3 text-body-medium font-medium',
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
                        <p className="text-label-small tracking-[0.06em] text-text-secondary uppercase">Ordre</p>
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
                                        // Une chip DANS la feuille de filtre monte à 44 px (`.sgrp .chip`) :
                                    // elle est seule cible de sa ligne, là où la bande en aligne cinq à 40.
                                    'min-h-11 px-3 text-body-medium font-medium',
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
                        <p className="text-label-small tracking-[0.06em] text-text-secondary uppercase">Vue</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.keys(SCOPE_LABEL) as TaskScope[]).map((taskScope) => (
                                <Button
                                    key={taskScope}
                                    variant={scope === taskScope ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setScope(taskScope)}
                                    className={cn(
                                        // Une chip DANS la feuille de filtre monte à 44 px (`.sgrp .chip`) :
                                    // elle est seule cible de sa ligne, là où la bande en aligne cinq à 40.
                                    'min-h-11 px-3 text-body-medium font-medium',
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
