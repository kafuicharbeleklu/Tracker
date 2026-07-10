import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { useDebounce } from '../../../hooks/useDebounce';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useToast } from '../../../context/ToastContext';
import { Approval } from '../../../types';
import { PageTabs, TabItem } from '../../../components/ui/PageTabs';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ApprovalRow } from '../components/ApprovalRow';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ListActionFab from '../../../components/ui/ListActionFab';
import { cn } from '../../../lib/utils';
import {
    canUserActOnApproval,
    getAvailableApprovalActions,
    isApprovalActiveStatus,
    isApprovalHistoryStatus,
    isLegacyApprovalWorkflow,
    isModernApprovalWorkflow,
} from '../../../lib/businessRules';

const ITEMS_PER_PAGE = 10;

type ApprovalView = 'active' | 'history';
type WorkflowSection = {
    id: 'standard' | 'legacy' | 'other' | 'all';
    title?: string;
    description?: string;
    items: Approval[];
};

const ApprovalsPage = () => {
    const [activeView, setActiveView] = useState<ApprovalView>('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { user: currentUser, role } = useAccessControl();
    const { users, approvals, updateApproval } = useData();
    const { navigate } = useAppNavigation();
    const { showToast } = useToast();
    const isCompact = useMediaQuery(MEDIA.compact);

    const userAvatarById = useMemo(() => {
        return new Map(users.map((user) => [user.id, user.avatar]));
    }, [users]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeView, debouncedSearch]);

    const isUserAllowedToValidate = useCallback(
        (approval: Approval) =>
            canUserActOnApproval({
                approval,
                actorRole: role,
                actorId: currentUser?.id,
                users,
            }),
        [currentUser?.id, role, users],
    );

    const activeApprovals = useMemo(() => {
        if (!currentUser) return [];

        const actionable = approvals.filter((approval) => isUserAllowedToValidate(approval));
        const relatedActive = approvals.filter((approval) =>
            isApprovalActiveStatus(approval.status)
            && (approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id),
        );

        const merged = new Map<string, Approval>();
        [...actionable, ...relatedActive].forEach((approval) => merged.set(approval.id, approval));

        return Array.from(merged.values());
    }, [approvals, currentUser, isUserAllowedToValidate]);

    const historyApprovals = useMemo(() => {
        if (!currentUser) return [];

        if (role === 'Admin' || role === 'SuperAdmin') {
            return approvals.filter((approval) => isApprovalHistoryStatus(approval.status));
        }

        if (role === 'Manager') {
            const teamUserIds = users.filter((user) => user.managerId === currentUser.id).map((user) => user.id);
            return approvals.filter((approval) =>
                isApprovalHistoryStatus(approval.status)
                && (
                    approval.requesterId === currentUser.id
                    || teamUserIds.includes(approval.requesterId)
                    || approval.beneficiaryId === currentUser.id
                    || teamUserIds.includes(approval.beneficiaryId)
                ),
            );
        }

        return approvals.filter((approval) =>
            isApprovalHistoryStatus(approval.status)
            && (approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id),
        );
    }, [approvals, currentUser, role, users]);

    const filteredList = useMemo(() => {
        let list = activeView === 'active' ? [...activeApprovals] : [...historyApprovals];

        if (debouncedSearch) {
            const lower = debouncedSearch.toLowerCase();
            list = list.filter((item) =>
                item.equipmentName?.toLowerCase().includes(lower)
                || item.requester?.toLowerCase().includes(lower)
                || item.requesterName?.toLowerCase().includes(lower)
                || item.beneficiaryName?.toLowerCase().includes(lower),
            );
        }

        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
    }, [activeView, activeApprovals, historyApprovals, debouncedSearch]);

    const hasMixedWorkflowFamilies = useMemo(() => {
        if (activeView !== 'active') return false;

        const hasLegacy = filteredList.some((item) => isLegacyApprovalWorkflow(item.status));
        const hasModern = filteredList.some((item) => isModernApprovalWorkflow(item.status));

        return hasLegacy && hasModern;
    }, [activeView, filteredList]);

    // Bandeau affiché uniquement en cas de coexistence réelle des deux parcours,
    // avec un message orienté utilisateur (pas de jargon de workflow).
    const workflowContextMessage = useMemo(() => {
        if (activeView !== 'active' || !hasMixedWorkflowFamilies) return '';
        return 'Certaines demandes suivent un ancien parcours de validation : elles sont regroupées dans une section distincte ci-dessous.';
    }, [activeView, hasMixedWorkflowFamilies]);

    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const paginatedList = filteredList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );
    const paginatedSections = useMemo<WorkflowSection[]>(() => {
        if (activeView !== 'active' || !hasMixedWorkflowFamilies) {
            return [{ id: 'all', items: paginatedList }];
        }

        const standard: Approval[] = [];
        const legacy: Approval[] = [];
        const other: Approval[] = [];

        paginatedList.forEach((item) => {
            if (isModernApprovalWorkflow(item.status)) {
                standard.push(item);
                return;
            }
            if (isLegacyApprovalWorkflow(item.status)) {
                legacy.push(item);
                return;
            }
            other.push(item);
        });

        return [
            {
                id: 'standard',
                title: 'Workflow standard',
                description: 'Validation manager, traitement IT, validation de dotation, confirmation utilisateur.',
                items: standard,
            },
            {
                id: 'legacy',
                title: 'Parcours précédent',
                description: 'Demandes historisées sur le flux précédent.',
                items: legacy,
            },
            {
                id: 'other',
                title: 'Autres statuts',
                description: 'Demandes hors des workflows principaux.',
                items: other,
            },
        ].filter((section) => section.items.length > 0);
    }, [activeView, hasMixedWorkflowFamilies, paginatedList]);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const applyApprovalTransition = (
        approval: Approval,
        nextStatus: Approval['status'],
        successMessage: string,
    ) => {
        const decision = updateApproval(approval.id, nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(successMessage, 'success');
        return true;
    };

    const getRowActions = useCallback(
        (approval: Approval) =>
            getAvailableApprovalActions({
                approval,
                actorRole: role,
                actorId: currentUser?.id,
                users,
            }),
        [currentUser?.id, role, users],
    );

    const TRANSITION_SUCCESS_MESSAGES: Partial<Record<Approval['status'], string>> = {
        WAITING_IT_PROCESSING: 'Demande approuvée. Transmise à l\'IT.',
        PENDING_DELIVERY: 'Dotation approuvée. En attente de confirmation utilisateur.',
        Completed: 'Réception confirmée.',
    };

    const handleAction = (approval: Approval): boolean => {
        const { primary } = getRowActions(approval);
        if (!primary) {
            showToast('Aucune action disponible pour cette demande.', 'error');
            return false;
        }

        if (primary.kind === 'assign') {
            const params = new URLSearchParams();
            params.append('approvalId', approval.id);
            params.append('userId', approval.beneficiaryId);
            params.append('category', approval.equipmentCategory || '');
            navigate(`/wizards/assignment?${params.toString()}`);
            return true;
        }

        return applyApprovalTransition(
            approval,
            primary.nextStatus!,
            TRANSITION_SUCCESS_MESSAGES[primary.nextStatus!] || 'Demande mise à jour.',
        );
    };

    const handleReject = (approval: Approval): boolean => {
        const { reject } = getRowActions(approval);
        if (!reject) {
            showToast('Aucune action disponible pour cette demande.', 'error');
            return false;
        }

        const decision = updateApproval(approval.id, reject.nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        if (reject.nextStatus === 'WAITING_IT_PROCESSING') {
            showToast('Dotation refusée. Retour en traitement IT.', 'info');
        } else {
            showToast('Demande rejetée', 'info');
        }
        return true;
    };

    const activeCount = activeApprovals.length;

    const tabs: TabItem[] = [
        {
            id: 'active',
            label: 'En cours',
            icon: <MaterialIcon name="inbox" />,
            badge: activeCount > 0 ? activeCount : undefined,
        },
        {
            id: 'history',
            label: 'Historique',
            icon: <MaterialIcon name="history" />,
        },
    ];

    const getStepDetails = (approval: Approval) => {
        if (approval.status === 'WAITING_MANAGER_APPROVAL' || approval.status === 'WaitingManager') {
            return {
                label: 'Validation Manager',
                color: 'text-on-tertiary-container',
                bg: 'bg-tertiary-container',
                icon: <MaterialIcon name="how_to_reg" size={14} />,
                btnText: 'Approuver',
                rejectText: 'Refuser',
            };
        }
        if (approval.status === 'WAITING_IT_PROCESSING' || approval.status === 'Pending' || approval.status === 'Processing') {
            return {
                label: 'Traitement IT',
                color: 'text-on-secondary-container',
                bg: 'bg-secondary-container',
                icon: <MaterialIcon name="settings" size={14} />,
                btnText: 'Affecter',
                rejectText: 'Refuser',
            };
        }
        if (approval.status === 'WAITING_DOTATION_APPROVAL') {
            return {
                label: 'Validation dotation',
                color: 'text-on-primary-container',
                bg: 'bg-primary-container',
                icon: <MaterialIcon name="verified" size={14} />,
                btnText: 'Valider dotation',
                rejectText: 'Renvoyer',
            };
        }
        if (approval.status === 'PENDING_DELIVERY' || approval.status === 'WaitingUser') {
            return {
                label: 'Confirmation utilisateur',
                color: 'text-on-secondary-container',
                bg: 'bg-secondary-container',
                icon: <MaterialIcon name="task_alt" size={14} />,
                btnText: 'Confirmer réception',
                rejectText: 'Refuser',
            };
        }
        // Statuts terminaux : présentation seule — aucune action n'existe dans la
        // machine à états (APPROVAL_TRANSITIONS), donc aucun libellé de bouton.
        if (approval.status === 'Approved') {
            return {
                label: 'Approuvée',
                color: 'text-on-tertiary-container',
                bg: 'bg-tertiary-container',
                icon: <MaterialIcon name="check_circle" size={14} />,
            };
        }
        if (approval.status === 'Rejected') {
            return {
                label: 'Refusée',
                color: 'text-on-error-container',
                bg: 'bg-error-container',
                icon: <MaterialIcon name="cancel" size={14} />,
            };
        }
        if (approval.status === 'Cancelled') {
            return {
                label: 'Annulée',
                color: 'text-on-surface-variant',
                bg: 'bg-surface-container-high',
                icon: <MaterialIcon name="do_not_disturb_on" size={14} />,
            };
        }
        if (approval.status === 'Completed') {
            return {
                label: 'Terminée',
                color: 'text-on-surface-variant',
                bg: 'bg-surface-container',
                icon: <MaterialIcon name="task_alt" size={14} />,
            };
        }

        return {
            label: 'Statut inconnu',
            color: 'text-on-surface-variant',
            bg: 'bg-surface-container',
            icon: <MaterialIcon name="help" size={14} />,
        };
    };

    const getWorkflowHint = (approval: Approval) => {
        if (activeView !== 'active' || !hasMixedWorkflowFamilies) return undefined;
        if (isLegacyApprovalWorkflow(approval.status)) return 'Parcours de validation précédent';
        return undefined;
    };

    return (
        <div className="flex flex-col h-full bg-surface-background">
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title={GLOSSARY.APPROVALS}
                        subtitle={role === 'User' ? 'Suivez l\'état de vos demandes d\'équipement.' : 'Centre de validation des demandes.'}
                        breadcrumb={GLOSSARY.APPROVALS}
                        actions={isCompact ? null : (
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="add" size={18} />}
                                onClick={() => navigate('/approvals/new')}
                            >
                                Nouvelle demande
                            </Button>
                        )}
                    />
                </div>

                <PageTabs
                    items={tabs}
                    activeId={activeView}
                    onChange={(id) => setActiveView(id as ApprovalView)}
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-macro space-y-6', isCompact && 'pb-44')}>
                        {isCompact ? (
                            <SearchFilterBar
                                searchValue={searchQuery}
                                onSearchChange={setSearchQuery}
                                placeholder="Rechercher une demande..."
                            />
                        ) : (
                            <SearchFilterBar
                                searchValue={searchQuery}
                                onSearchChange={setSearchQuery}
                                placeholder="Rechercher une demande..."
                                resultCount={filteredList.length}
                            />
                        )}

                        {isCompact && (
                            <p className="-mt-3 text-body-small text-on-surface-variant">
                                {filteredList.length} demande{filteredList.length > 1 ? 's' : ''}
                            </p>
                        )}
                        {activeView === 'active' && workflowContextMessage && (
                            <div className="-mt-2 rounded-md border border-secondary/30 bg-secondary-container/30 px-3 py-2 text-body-small text-on-secondary-container flex items-start gap-2">
                                <MaterialIcon name="info" size={16} className="shrink-0 mt-0.5" />
                                <p>{workflowContextMessage}</p>
                            </div>
                        )}

                        <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 overflow-hidden min-h-[400px]">
                            {paginatedList.length > 0 ? (
                                <div>
                                    {paginatedSections.map((section, sectionIndex) => (
                                        <div key={section.id} className={cn(sectionIndex > 0 && 'border-t border-outline-variant/40')}>
                                            {section.title && (
                                                <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/30">
                                                    <p className="text-label-medium text-on-surface">{section.title}</p>
                                                    {section.description && (
                                                        <p className="text-label-small text-on-surface-variant mt-0.5">{section.description}</p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="divide-y divide-outline-variant/30">
                                                {section.items.map((approval) => {
                                                    const stepDetails = getStepDetails(approval);
                                                    const rowActions = getRowActions(approval);
                                                    const isActionable = activeView === 'active'
                                                        && (rowActions.primary !== null || rowActions.reject !== null);

                                                    return (
                                                        <ApprovalRow
                                                            key={approval.id}
                                                            approval={approval}
                                                            stepDetails={stepDetails}
                                                            // Rangées denses partout sauf « En cours » sur
                                                            // téléphone, qui garde les cartes (§4.3, X14)
                                                            compact={activeView === 'history' || !isCompact}
                                                            showActions={isActionable}
                                                            onApprove={handleAction}
                                                            onReject={handleReject}
                                                            requesterAvatar={userAvatarById.get(approval.requesterId)}
                                                            beneficiaryAvatar={userAvatarById.get(approval.beneficiaryId)}
                                                            workflowHint={getWorkflowHint(approval)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-12">
                                    <EmptyState
                                        icon={activeView === 'active' ? 'inbox' : 'history'}
                                        title={activeView === 'active' ? 'Aucune demande active' : 'Historique vide'}
                                        description={
                                            activeView === 'active'
                                                ? 'Aucune demande à traiter ou à suivre pour le moment.'
                                                : 'Aucune demande passée trouvée.'
                                        }
                                        action={activeView === 'active' && (
                                            <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => navigate('/approvals/new')}>
                                                Faire une demande
                                            </Button>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {isCompact && (
                            <ListActionFab
                                label="Demande"
                                className="bottom-20 right-4"
                                sheetTitle="Actions Demandes"
                                actions={[
                                    {
                                        id: 'new-request',
                                        label: 'Nouvelle demande',
                                        icon: 'add',
                                        variant: 'filled' as const,
                                        onSelect: () => navigate('/approvals/new'),
                                    },
                                ]}
                            />
                        )}

                        {filteredList.length > 0 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        )}
                    </div>
                </PageContainer>
            </div>
        </div>
    );
};

export default ApprovalsPage;
