import { MEDIA } from '../../../constants/breakpoints';
import React, { useMemo, useState, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Card from '../../../components/ui/Card';
import { Approval, ViewType, HistoryEvent } from '../../../types';
import { useData } from '../../../context/DataContext';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useAccessControl } from '../../../hooks/useAccessControl';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import SecurityGate from '../../../components/security/SecurityGate';
import { calculateLinearDepreciation, formatCurrency, formatDate, formatNumber } from '../../../lib/financial';
import { MetricCard } from '../../../components/ui/MetricCard';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { useHistory } from '../../../hooks/useHistory';
import { cn } from '../../../lib/utils';
import TransactionTicketModal from '../../../components/modals/TransactionTicketModal';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import {
    ACTIVE_APPROVAL_STATUSES,
    canUserActOnApproval,
    getHistoryEventIcon,
    getHistoryEventSentence,
    isOperationalEquipmentStatus,
} from '../../../lib/businessRules';

interface DashboardPageProps {
    onViewChange: (view: ViewType) => void;
    onNavigate?: (path: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onViewChange, onNavigate }) => {
    const { equipment: allEquipment, users, approvals, updateApproval, settings } = useData();
    const { filterEquipment, permissions, user: currentUser } = useAccessControl();
    const { getRecentActivity } = useHistory();
    const { showToast } = useToast();
    const isCompact = useMediaQuery(MEDIA.compact);
    const isMedium = useMediaQuery(MEDIA.medium);
    const [animateChart, setAnimateChart] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimateChart(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

    const equipment = useMemo(() => filterEquipment(allEquipment, users), [allEquipment, users, filterEquipment]);

    const recentEvents = useMemo(() => {
        const all = getRecentActivity(20);
        return all.slice(0, 8); // Slightly increased for the new list view
    }, [getRecentActivity]);

    const equipmentById = useMemo(
        () => new Map(allEquipment.map((item) => [item.id, item])),
        [allEquipment],
    );

    const pendingManagerValidations = useMemo(() => {
        if (!currentUser) return [];

        return approvals
            .filter((approval) =>
                (approval.status === 'WAITING_MANAGER_APPROVAL'
                    || approval.status === 'WAITING_DOTATION_APPROVAL')
                && canUserActOnApproval({
                    approval,
                    actorRole: currentUser.role,
                    actorId: currentUser.id,
                    users,
                }),
            )
            .map((approval) => {
                const linkedEquipment = approval.assignedEquipmentId
                    ? equipmentById.get(approval.assignedEquipmentId)
                    : undefined;
                return {
                    approvalId: approval.id,
                    approvalStatus: approval.status,
                    beneficiaryName: approval.beneficiaryName,
                    beneficiaryAvatar: users.find((user) => user.id === approval.beneficiaryId)?.avatar,
                    equipmentName:
                        approval.assignedEquipmentName
                        || linkedEquipment?.name
                        || approval.equipmentName
                        || approval.equipmentCategory,
                };
            });
    }, [approvals, currentUser, equipmentById, users]);

    const equipmentToConfirm = useMemo(() => {
        if (!currentUser) return [];

        return approvals
            .filter((approval) =>
                approval.status === 'PENDING_DELIVERY'
                && canUserActOnApproval({
                    approval,
                    actorRole: currentUser.role,
                    actorId: currentUser.id,
                    users,
                }),
            )
            .map((approval) => {
                const linkedEquipment = approval.assignedEquipmentId
                    ? equipmentById.get(approval.assignedEquipmentId)
                    : undefined;
                return {
                    approvalId: approval.id,
                    equipmentName:
                        approval.assignedEquipmentName
                        || linkedEquipment?.name
                        || approval.equipmentName
                        || approval.equipmentCategory,
                };
            });
    }, [approvals, currentUser, equipmentById, users]);

    const financialTotals = useMemo(() => {
        return equipment.reduce((acc, item) => {
            if (item.financial) {
                const stats = calculateLinearDepreciation(
                    item.financial.purchasePrice,
                    item.financial.purchaseDate,
                    item.financial.depreciationYears,
                    item.financial.purchasePrice > 0 ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100 : 0
                );
                acc.totalPurchaseValue += item.financial.purchasePrice || 0;
                acc.totalCurrentValue += stats.currentValue;
                acc.totalMonthlyDepreciation += stats.monthlyDepreciation;
            }
            return acc;
        }, { totalPurchaseValue: 0, totalCurrentValue: 0, totalMonthlyDepreciation: 0 });
    }, [equipment]);

    const assignedCount = equipment.filter(e => e.status === 'Attribué').length;
    const availableCount = equipment.filter(e => e.status === 'Disponible').length;
    const pendingCount = equipment.filter(e => e.status === 'En attente').length;
    const repairCount = equipment.filter(e => e.status === 'En réparation').length;
    const totalCount = equipment.length;

    const categories = equipment.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedCategories = (Object.entries(categories) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4);

    const chartColors = useMemo(() => ([
        { hex: 'var(--md-sys-color-primary)', bg: 'bg-primary' },
        { hex: 'var(--md-sys-color-secondary)', bg: 'bg-secondary' },
        { hex: 'var(--md-sys-color-tertiary)', bg: 'bg-tertiary' },
        { hex: 'var(--md-sys-color-error)', bg: 'bg-error' }
    ]), []);

    const chartData = useMemo(() => {
        let accumulatedPercent = 0;
        return sortedCategories.map(([catName, count], idx) => {
            const percent = totalCount > 0 ? ((count as number) / totalCount) * 100 : 0;
            const offset = accumulatedPercent;
            accumulatedPercent += percent;
            return { catName, count, percent, offset, color: chartColors[idx % chartColors.length] };
        });
    }, [sortedCategories, totalCount, chartColors]);

    const warrantyMetrics = useMemo(() => {
        const activeFleet = equipment.filter(e => e.operationalStatus !== 'Retiré');
        const now = new Date();

        const toPercent = (count: number, total: number) => total > 0 ? Math.round((count / total) * 100) : 0;

        const underWarranty = activeFleet.filter(e => e.warrantyEnd && new Date(e.warrantyEnd) > now);
        const expiredWarranty = activeFleet.filter(e => e.warrantyEnd && new Date(e.warrantyEnd) <= now);
        const unknownWarranty = activeFleet.filter(e => !e.warrantyEnd);

        const countOperational = (items: typeof equipment) => items.filter(e => isOperationalEquipmentStatus(e.status)).length;

        const baseSegments = [
            {
                key: 'under-warranty',
                shortLabel: 'Garantie',
                count: underWarranty.length,
                availability: toPercent(countOperational(underWarranty), underWarranty.length),
                stroke: 'var(--md-sys-color-primary)',
                dotClass: 'bg-primary'
            },
            {
                key: 'expired-warranty',
                shortLabel: 'Hors garantie',
                count: expiredWarranty.length,
                availability: toPercent(countOperational(expiredWarranty), expiredWarranty.length),
                stroke: 'var(--md-sys-color-tertiary)',
                dotClass: 'bg-tertiary'
            },
            {
                key: 'unknown-warranty',
                shortLabel: 'Sans date',
                count: unknownWarranty.length,
                availability: toPercent(countOperational(unknownWarranty), unknownWarranty.length),
                stroke: 'var(--md-sys-color-outline-variant)',
                dotClass: 'bg-outline-variant'
            }
        ];

        let cumulative = 0;
        const segments = baseSegments.map(segment => {
            const percent = toPercent(segment.count, activeFleet.length);
            const offset = -cumulative;
            cumulative += percent;
            return { ...segment, percent, offset };
        });

        const globalAvailability = toPercent(countOperational(activeFleet), activeFleet.length);

        const recentCount = activeFleet.filter(e => {
            if (!e.financial?.purchaseDate) return false;
            return new Date().getFullYear() - new Date(e.financial.purchaseDate).getFullYear() <= 3;
        }).length;

        const agingCount = activeFleet.filter(e => {
            if (!e.financial?.purchaseDate) return false;
            return new Date().getFullYear() - new Date(e.financial.purchaseDate).getFullYear() >= 5;
        }).length;

        let insight = 'Ajoutez des dates de garantie pour un suivi plus fiable.';

        if (activeFleet.length === 0) {
            insight = 'Aucun équipement actif à analyser.';
        } else if (underWarranty.length === 0 && expiredWarranty.length === 0) {
            insight = 'Ajoutez des dates de garantie pour un suivi plus fiable.';
        } else if (expiredWarranty.length === 0) {
            insight = 'Le parc suivi est entièrement sous garantie.';
        } else {
            const diff = segments[0].availability - segments[1].availability;
            if (diff >= 10) insight = `Le parc sous garantie est +${diff} pts plus disponible.`;
            else if (diff <= -5) insight = 'Le parc hors garantie reste performant, surveillez la maintenance.';
            else insight = 'Disponibilité proche entre parc garanti et hors garantie.';
        }

        return {
            activeCount: activeFleet.length,
            globalAvailability,
            segments,
            recentCount,
            agingCount,
            insight
        };
    }, [equipment]);
    // Step-up uniforme (D9, audit §7.1) : mêmes transitions que les rangées Approbations,
    // donc même PIN via SecurityGate — le dialog de confirmation simple ne suffit plus.
    const handleConfirmReceipt = (approvalId: string): boolean => {
        const decision = updateApproval(approvalId, 'Completed');
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast('Réception confirmée.', 'success');
        return true;
    };

    const handleManagerValidation = (
        approvalId: string,
        status: Approval['status'],
        approve: boolean,
    ): boolean => {
        const isDotation = status === 'WAITING_DOTATION_APPROVAL';
        const nextStatus: Approval['status'] = isDotation
            ? (approve ? 'PENDING_DELIVERY' : 'WAITING_IT_PROCESSING')
            : (approve ? 'WAITING_IT_PROCESSING' : 'Rejected');

        const decision = updateApproval(approvalId, nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }

        if (isDotation) {
            showToast(
                approve
                    ? 'Dotation validée. En attente de confirmation utilisateur.'
                    : 'Dotation renvoyée au traitement IT.',
                approve ? 'success' : 'info',
            );
            return true;
        }

        showToast(
            approve
                ? "Besoin validé. Demande transmise à l'IT."
                : 'Demande rejetée.',
            approve ? 'success' : 'info',
        );
        return true;
    };

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        if (diffDays === 0) return `Aujourd'hui, ${timeStr}`;
        if (diffDays === 1) return `Hier, ${timeStr}`;
        return formatDate(date) + ', ' + timeStr;
    };

    const handleStatusClick = (status: string) => {
        if (onNavigate) {
            onNavigate(`/inventory/filter/${encodeURIComponent(status)}`);
        }
    };

    // Composition par persona (audit D2) : les KPIs de flotte n'ont pas de sens
    // pour un utilisateur simple — il voit « mes équipements / mes demandes ».
    const myEquipmentCount = allEquipment.filter(
        (item) => item.user?.id === currentUser?.id || item.user?.name === currentUser?.name,
    ).length;
    const myActiveRequestCount = approvals.filter(
        (approval) =>
            ACTIVE_APPROVAL_STATUSES.includes(approval.status)
            && (approval.requesterId === currentUser?.id || approval.beneficiaryId === currentUser?.id),
    ).length;
    const myPendingReceiptCount = approvals.filter(
        (approval) => approval.status === 'PENDING_DELIVERY' && approval.beneficiaryId === currentUser?.id,
    ).length;

    const KPI_CARDS = permissions.canManageInventory ? [
        { label: 'Total Actifs', count: totalCount, icon: 'inventory_2', color: 'text-primary', onClick: () => handleStatusClick('') },
        { label: 'Attribués', count: assignedCount, icon: 'person_check', color: 'text-secondary', onClick: () => handleStatusClick('Attribué') },
        { label: 'En attente', count: pendingCount, icon: 'hourglass_top', color: 'text-primary', onClick: () => handleStatusClick('En attente') },
        { label: 'Disponibles', count: availableCount, icon: 'check_circle', color: 'text-tertiary', onClick: () => handleStatusClick('Disponible') },
        { label: 'En Réparation', count: repairCount, icon: 'build', color: 'text-error', onClick: () => handleStatusClick('En réparation') },
    ] : [
        { label: 'Mes équipements', count: myEquipmentCount, icon: 'devices', color: 'text-primary', onClick: () => handleStatusClick('') },
        { label: 'Demandes en cours', count: myActiveRequestCount, icon: 'pending_actions', color: 'text-secondary', onClick: () => onViewChange('approvals') },
        { label: 'Réceptions à confirmer', count: myPendingReceiptCount, icon: 'move_to_inbox', color: 'text-tertiary', onClick: () => onViewChange('approvals') },
    ];
    const dashboardHeaderActions = !isCompact && !isMedium ? (
        <div className="flex gap-2">
            {permissions.canManageInventory ? (
                <>
                    <Button variant="tonal" icon={<MaterialIcon name="assignment_return" size={18} />} onClick={() => onViewChange('return_wizard')}>
                        Retour
                    </Button>
                    <Button variant="filled" icon={<MaterialIcon name="person_add" size={18} />} onClick={() => onViewChange('assignment_wizard')}>
                        Attribuer
                    </Button>
                </>
            ) : (
                <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => onViewChange('new_request')}>
                    Nouvelle demande
                </Button>
            )}
        </div>
    ) : null;

    const dashboardCompactActions = isCompact ? (
        permissions.canManageInventory ? (
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="tonal"
                    icon={<MaterialIcon name="assignment_return" size={18} />}
                    onClick={() => onViewChange('return_wizard')}
                    className="w-full justify-center"
                >
                    Retour
                </Button>
                <Button
                    variant="filled"
                    icon={<MaterialIcon name="person_add" size={18} />}
                    onClick={() => onViewChange('assignment_wizard')}
                    className="w-full justify-center"
                >
                    Attribuer
                </Button>
            </div>
        ) : (
            <Button
                variant="filled"
                icon={<MaterialIcon name="add" size={18} />}
                onClick={() => onViewChange('new_request')}
                className="w-full justify-center"
            >
                Nouvelle demande
            </Button>
        )
    ) : null;

    const dashboardSubtitle = isMedium ? undefined : "Vue d'ensemble de votre parc informatique.";
    const dashboardBreadcrumb = isMedium ? undefined : 'Tableau de bord';

    return (
        <PageContainer>
            <TransactionTicketModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />

            <PageHeader
                title={GLOSSARY.DASHBOARD}
                subtitle={dashboardSubtitle}
                breadcrumb={dashboardBreadcrumb}
                actions={dashboardHeaderActions}
            />

            {dashboardCompactActions && (
                <div className="mb-6">
                    {dashboardCompactActions}
                </div>
            )}

            {/* KPI ROW - TOP LEVEL (cartes demi-hauteur sur téléphone — X9) */}
            <div className={cn(
                "grid grid-cols-2 mb-6 relative z-10",
                isCompact ? "gap-2" : "medium:grid-cols-3 gap-4",
                !isCompact && (KPI_CARDS.length > 3 ? "expanded:grid-cols-5" : "expanded:grid-cols-3")
            )}>
                {KPI_CARDS.map((kpi, idx) => (
                    <MetricCard
                        key={idx}
                        compact={isCompact}
                        title={kpi.label}
                        value={formatNumber(kpi.count, settings.compactNotation)}
                        onClick={kpi.onClick}
                        className={cn(!isCompact && "min-h-[132px]", idx === KPI_CARDS.length - 1 && KPI_CARDS.length % 2 === 1 ? "col-span-2 medium:col-span-1" : "")}
                        icon={<MaterialIcon name={kpi.icon} size={isCompact ? 20 : 24} className={kpi.color} />}
                    />
                ))}
            </div>

            {/* MAIN LAYOUT: 2 Columns (Content + Sidebar) */}
            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">

                {/* LEFT COLUMN (Main Content) */}
                <div className="expanded:col-span-2 space-y-6">

                    {/* ALERTS SECTION (Conditional) */}
                    {(pendingManagerValidations.length > 0 || equipmentToConfirm.length > 0) && (
                        <div className="space-y-4 animate-in slide-in-from-top-4">
                            {pendingManagerValidations.length > 0 && (
                                <div className="p-4 bg-tertiary-container rounded-md border border-tertiary/20 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <MaterialIcon name="shield_person" size={24} className="text-on-tertiary-container" />
                                        <h3 className="text-title-medium text-on-tertiary-container">Validations Managériales ({pendingManagerValidations.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {pendingManagerValidations.map(e => (
                                            <div key={e.approvalId} className="bg-surface/80 p-3 rounded flex items-center justify-between backdrop-blur-sm">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={e.beneficiaryName || ''} src={e.beneficiaryAvatar} size="xs" />
                                                    <div className="flex flex-col">
                                                        <span className="text-body-medium font-medium">{e.beneficiaryName} — {e.equipmentName}</span>
                                                        <span className="text-label-small text-on-surface-variant">
                                                            {e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Étape: Validation dotation' : 'Étape: Validation manager'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <SecurityGate
                                                        onVerified={() => handleManagerValidation(e.approvalId, e.approvalStatus, false)}
                                                        title={e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Renvoyer' : 'Refuser'}
                                                        description={`${e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Renvoyer' : 'Refuser'} cette demande ?`}
                                                        entityId={e.approvalId}
                                                        entityName={e.equipmentName}
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                variant="text"
                                                                className="text-error px-2"
                                                            >
                                                                {e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Renvoyer' : 'Refuser'}
                                                            </Button>
                                                        }
                                                    />
                                                    <SecurityGate
                                                        onVerified={() => handleManagerValidation(e.approvalId, e.approvalStatus, true)}
                                                        title={e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Valider dotation' : 'Valider'}
                                                        description="Confirmer cette action."
                                                        entityId={e.approvalId}
                                                        entityName={e.equipmentName}
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                variant="tonal"
                                                                className="px-3"
                                                            >
                                                                {e.approvalStatus === 'WAITING_DOTATION_APPROVAL' ? 'Valider dotation' : 'Valider'}
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {equipmentToConfirm.length > 0 && (
                                <div className="p-4 bg-primary-container rounded-md border border-primary/20 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <MaterialIcon name="inventory" size={24} className="text-on-primary-container" />
                                        <h3 className="text-title-medium text-on-primary-container">Réceptions à confirmer ({equipmentToConfirm.length})</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {equipmentToConfirm.map(e => (
                                            <SecurityGate
                                                key={e.approvalId}
                                                onVerified={() => handleConfirmReceipt(e.approvalId)}
                                                title="Confirmer la réception"
                                                description="Confirmez-vous avoir bien reçu cet équipement ?"
                                                entityId={e.approvalId}
                                                entityName={e.equipmentName}
                                                trigger={
                                                    <Button size="sm" variant="filled" icon={<MaterialIcon name="check" size={14} />}>
                                                        Valider {e.equipmentName}
                                                    </Button>
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FINANCIAL SUMMARY (Admin Only) */}
                    {permissions.canManageInventory && (
                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4">
                            <MetricCard
                                title="Total Dépenses"
                                value={formatCurrency(financialTotals.totalPurchaseValue, settings.currency, settings.compactNotation)}
                                subtitle="Investissement initial total"
                                icon={<MaterialIcon name="account_balance_wallet" size={24} className="text-secondary" />}
                                className="border-l-4 border-l-secondary"
                            />
                            <MetricCard
                                title="Valeur Actuelle"
                                value={formatCurrency(financialTotals.totalCurrentValue, settings.currency, settings.compactNotation)}
                                subtitle="Après amortissement"
                                icon={<MaterialIcon name="savings" size={24} className="text-primary" />}
                                className="border-l-4 border-l-primary"
                                onClick={() => onViewChange('finance')}
                            />
                        </div>
                    )}

                    {/* RECENT ACTIVITY LIST */}
                    <Card
                        title="Derniers événements"
                        onActionClick={() => onViewChange('audit')}
                        actionIcon={<MaterialIcon name="history" size={18} />}
                        className="min-h-[400px]"
                    >
                        <div className="mt-2 space-y-0 divide-y divide-outline-variant/50">
                            {recentEvents.length > 0 ? (
                                recentEvents.map((event) => {
                                    const actor = users.find(u => u.id === event.actorId);
                                    return (
                                        <Button
                                            variant="text"
                                            size="sm"
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="!w-full !text-left !flex !items-center !gap-4 !p-3 !whitespace-normal hover:!bg-surface-container-low !transition-colors !cursor-pointer group !-mx-2 !px-2 !rounded-sm !justify-start !text-on-surface"
                                        >
                                            <div className="relative">
                                                <UserAvatar name={event.actorName} src={actor?.avatar} size="sm" />
                                                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 border border-outline-variant flex items-center justify-center leading-none">
                                                    <MaterialIcon name={getHistoryEventIcon(event.type)} size={12} className="text-primary" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body-medium text-on-surface leading-tight">
                                                    {getHistoryEventSentence({
                                                        event,
                                                        perspectiveActorId: currentUser?.id,
                                                    })}
                                                </p>
                                                <p className="text-body-small text-on-surface-variant mt-0.5">
                                                    {formatRelativeTime(event.timestamp)}
                                                </p>
                                            </div>
                                            <MaterialIcon name="chevron_right" size={16} className="text-outline-variant group-hover:text-primary transition-colors" />
                                        </Button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-on-surface-variant italic">Aucune activité récente.</div>
                            )}
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN (Sidebar Stats) */}
                <div className="space-y-6">

                    {/* DISTRIBUTION CHART */}
                    <Card title="Répartition par Type" className="overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-6 relative">
                            {/* Simple Donut Chart Representation */}
                            <div className="w-40 h-40 relative flex items-center justify-center mb-6">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--md-sys-color-surface-container-high)" strokeWidth="3" />
                                    {chartData.map((item, idx) => (
                                        <circle
                                            key={item.catName}
                                            cx="18" cy="18" r="15.915"
                                            fill="transparent"
                                            stroke={item.color.hex}
                                            strokeWidth="3"
                                            strokeDasharray={animateChart ? `${item.percent} ${100 - item.percent}` : `0 100`}
                                            strokeDashoffset={`-${item.offset}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-[1000ms] ease-emphasized"
                                            style={{ transitionDelay: `${idx * 150}ms` }}
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-headline-medium font-black text-on-surface">{totalCount}</span>
                                    <span className="text-label-small uppercase tracking-widest text-on-surface-variant">Actifs</span>
                                </div>
                            </div>

                            <div className="w-full space-y-2 px-2">
                                {chartData.map((item) => (
                                    <div key={item.catName} className="flex items-center justify-between text-body-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.color.bg}`} />
                                            <span className="text-on-surface">{item.catName}</span>
                                        </div>
                                        <span className="text-title-small text-on-surface-variant">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* HEALTH CENTER - PERFORMANCE COMPARISON */}
                    <Card title="Performance & Garantie" className="overflow-hidden">
                        <div className="p-2 space-y-5">
                            <div className="flex flex-col items-center justify-center py-2 relative">
                                <div className="w-40 h-40 relative flex items-center justify-center mb-4">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--md-sys-color-surface-container-high)" strokeWidth="3" />
                                        {warrantyMetrics.segments.map(segment => (
                                            <circle
                                                key={segment.key}
                                                cx="18"
                                                cy="18"
                                                r="15.915"
                                                fill="transparent"
                                                stroke={segment.stroke}
                                                strokeWidth="3"
                                                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                                                strokeDashoffset={segment.offset}
                                                strokeLinecap={segment.percent > 0 ? "round" : "butt"}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        ))}
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-headline-small font-bold text-on-surface">{warrantyMetrics.globalAvailability}%</span>
                                        <span className="text-label-small uppercase tracking-widest text-on-surface-variant">Dispo globale</span>
                                    </div>
                                </div>

                                {/* Simplified Legend */}
                                <div className="w-full space-y-2 px-2">
                                    {warrantyMetrics.segments.map(segment => (
                                        <div key={segment.key} className="flex items-center justify-between text-body-medium">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full", segment.dotClass)} />
                                                <span className="text-on-surface font-medium">{segment.shortLabel}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-on-surface font-bold">{segment.count}</span>
                                                <span className="text-label-small text-on-surface-variant">{segment.percent}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-surface-container-low p-3 rounded-md border border-outline-variant/50 text-body-medium text-on-surface-variant">
                                {warrantyMetrics.insight}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-label-small text-on-surface-variant uppercase">≤ 3 ans</span>
                                    <span className="text-label-medium font-bold text-on-surface">{warrantyMetrics.recentCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-label-small text-on-surface-variant uppercase">≥ 5 ans</span>
                                    <span className="text-label-medium font-bold text-error">{warrantyMetrics.agingCount}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* HELP / SUPPORT TEASER */}
                    <Card title="Besoin d'aide ?" variant="filled">
                        <p className="text-body-medium text-on-surface-variant mb-4">Consultez la documentation ou contactez le support.</p>
                    </Card>

                </div>
            </div>
        </PageContainer>
    );
};

export default DashboardPage;


















