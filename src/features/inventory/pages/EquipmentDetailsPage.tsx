import { MEDIA } from '../../../constants/breakpoints';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { GLOSSARY } from '../../../constants/glossary';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { calculateLinearDepreciation, formatCurrency } from '../../../lib/financial';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { DetailHeader } from '../../../components/layout/DetailHeader';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../lib/utils';
import MovementTimeline, { MovementTimelineItem } from '../../../components/ui/MovementTimeline';
import DemoBadge from '../../../components/ui/DemoBadge';
import {
    getHistoryEventIcon,
    isEquipmentMovementEvent,
    getStatusLabel,
} from '../../../lib/businessRules';

interface EquipmentDetailsPageProps {
    equipmentId: string;
    onBack: () => void;
}

const MAX_MOVEMENT_HISTORY_ITEMS = 200;

const EquipmentDetailsPage: React.FC<EquipmentDetailsPageProps> = ({ equipmentId, onBack }) => {
    const { equipment, users, events, updateEquipment, deleteEquipment, settings } = useData();
    const { showToast } = useToast();
    const { permissions } = useAccessControl();
    const { navigate } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();

    const item = equipment.find(e => e.id === equipmentId);

    // Calculate Depreciation Memoized
    const financialStats = useMemo(() => {
        if (!item?.financial) return null;
        return calculateLinearDepreciation(
            item.financial.purchasePrice,
            item.financial.purchaseDate,
            item.financial.depreciationYears,
            item.financial.purchasePrice > 0 ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100 : 0
        );
    }, [item]);

    const [isScrolled, setIsScrolled] = useState(false);
    const [heroImageFailed, setHeroImageFailed] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHeroImageFailed(false);
    }, [equipmentId]);
    const isCompactLayout = useMediaQuery(MEDIA.belowExpanded);

    const equipmentMovementItems = useMemo<MovementTimelineItem[]>(() => {
        if (!item) return [];

        const eventItems: MovementTimelineItem[] = events
            .filter((event) => {
                return isEquipmentMovementEvent(event) && event.targetId === item.id;
            })
            .map((event) => ({
                id: event.id,
                timestamp: event.timestamp,
                title: event.description || 'Mouvement enregistré',
                actor: event.actorName,
                icon: getHistoryEventIcon(event.type),
            }));

        const syntheticItems: MovementTimelineItem[] = [];
        if (item.assignedAt) {
            syntheticItems.push({
                id: `synthetic-assigned-${item.id}`,
                timestamp: item.assignedAt,
                title: `Attribution initiée${item.user?.name ? ` pour ${item.user.name}` : ''}`,
                actor: item.assignedByName || 'Système',
                icon: 'assignment_ind',
            });
        }
        if (item.confirmedAt) {
            syntheticItems.push({
                id: `synthetic-confirmed-${item.id}`,
                timestamp: item.confirmedAt,
                title: 'Réception confirmée par l’utilisateur',
                icon: 'task_alt',
            });
        }
        if (item.repairStartDate) {
            syntheticItems.push({
                id: `synthetic-repair-start-${item.id}`,
                timestamp: item.repairStartDate,
                title: 'Entrée en maintenance',
                icon: 'build',
            });
        }
        if (item.repairEndDate) {
            syntheticItems.push({
                id: `synthetic-repair-end-${item.id}`,
                timestamp: item.repairEndDate,
                title: 'Fin de maintenance',
                icon: 'build_circle',
            });
        }
        if (item.financial?.purchaseDate) {
            syntheticItems.push({
                id: `synthetic-created-${item.id}`,
                timestamp: item.financial.purchaseDate,
                title: 'Ajouté à l’inventaire',
                icon: 'add_circle',
            });
        }

        const merged = [...eventItems, ...syntheticItems]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const deduped: MovementTimelineItem[] = [];
        const seen = new Set<string>();
        merged.forEach((movement) => {
            const key = `${movement.title}|${new Date(movement.timestamp).toISOString()}`;
            if (seen.has(key)) return;
            seen.add(key);
            deduped.push(movement);
        });

        return deduped.slice(0, MAX_MOVEMENT_HISTORY_ITEMS);
    }, [events, item]);

    if (!item) return <div className="p-page-sm medium:p-page text-center text-on-surface-variant">{GLOSSARY.EQUIPMENT} non trouvé</div>;

    const resolvedCurrentUser = item.user
        ? users.find((user) =>
            (item.user?.id && user.id === item.user.id)
            || (item.user?.email && user.email === item.user.email)
            || (item.user?.name && user.name === item.user.name),
        )
        : null;
    const assignmentWizardPath = `/wizards/assignment?context=equipment_details&equipmentId=${encodeURIComponent(item.id)}`;
    const canOpenAssignmentFromCard = permissions.canManageInventory && item.status === 'Disponible';

    const handleOpenAssignmentWizard = () => {
        navigate(assignmentWizardPath);
    };

    const handleCurrentUserCardClick = () => {
        if (resolvedCurrentUser?.id) {
            navigate(`/users/${resolvedCurrentUser.id}`);
            return;
        }
        if (canOpenAssignmentFromCard) {
            handleOpenAssignmentWizard();
        }
    };

    const getStatusVariant = (status: string): 'success' | 'info' | 'warning' | 'danger' => {
        if (status === 'Disponible') return 'success';
        if (status === 'Attribué' || status === 'Assigné') return 'info';
        if (status === 'En réparation' || status === 'Perdu' || status === 'Manquant') return 'danger';
        return 'warning';
    };

    const formatStatus = (status: string) => getStatusLabel(status, { short: true });

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateCompact = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const addYears = (dateString: string, years: number) => {
        const date = new Date(dateString);
        date.setFullYear(date.getFullYear() + years);
        return date.toISOString();
    };

    const handleDownload = (docName: string) => {
        showToast(`Téléchargement de ${docName}...`, 'info');
    };

    const handleReport = () => {
        showToast('Signalement envoyé au support.', 'info');
    };

    const handleConfirmEndRepair = () => {
        requestConfirmation({
            title: "Terminer la réparation",
            message: `Confirmez-vous que l'équipement "${item.name}" est de nouveau fonctionnel ? Il sera marqué comme "Disponible" dans l'inventaire.`,
            confirmText: "Mettre en service",
            variant: "warning",
            onConfirm: () => {
                updateEquipment(item.id, {
                    status: 'Disponible',
                    repairEndDate: new Date().toISOString(),
                });
                showToast("Équipement remis en service", 'success');
            }
        });
    };

    const handleDelete = () => {
        if (item.status !== 'Disponible' && item.status !== 'En réparation') {
            showToast("Impossible de supprimer un équipement attribué.", "error");
            return;
        }

        requestConfirmation({
            title: "Supprimer l'équipement",
            message: `Êtes-vous sûr de vouloir supprimer l'équipement "${item.name}" ? Cette action est irréversible.`,
            confirmText: "Supprimer définitivement",
            variant: "danger",
            requireTyping: true,
            typingKeyword: "SUPPRIMER",
            onConfirm: () => {
                if (deleteEquipment(item.id)) {
                    showToast(GLOSSARY.SUCCESS_DELETE(GLOSSARY.EQUIPMENT), 'success');
                    onBack(); // Retour à la liste
                } else {
                    showToast("Erreur lors de la suppression.", "error");
                }
            }
        });
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollTop = scrollContainerRef.current.scrollTop;
            const COLLAPSE_ENTER = 72;
            const COLLAPSE_EXIT = 24;

            if (!isScrolled && scrollTop > COLLAPSE_ENTER) {
                setIsScrolled(true);
            } else if (isScrolled && scrollTop < COLLAPSE_EXIT) {
                setIsScrolled(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-container-low overflow-hidden">
            {/* Header / Hero */}
            {isCompactLayout ? (
                <div className="sticky top-0 z-20 bg-surface border-b border-outline-variant shadow-elevation-1">
                    <div className="px-page-sm py-2.5 medium:px-page flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Button
                                variant="text"
                                onClick={onBack}
                                className="h-11 w-11 min-w-0 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-none shadow-none p-0"
                                icon={<MaterialIcon name="arrow_back" size={24} />}
                                aria-label="Retour"
                            />
                            <div className="min-w-0">
                                <div className="font-bold text-title-small text-on-surface truncate">{item.name}</div>
                                <div className="text-label-small text-on-surface-variant font-mono truncate">{item.assetId}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {permissions.canManageInventory && (
                                <Button
                                    variant="text"
                                    icon={<MaterialIcon name="edit" size={22} />}
                                    onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                    className="h-11 w-11 p-0 min-w-0 rounded-full"
                                    aria-label="Modifier"
                                    title="Modifier"
                                />
                            )}
                            <Button
                                variant="text"
                                icon={<MaterialIcon name="warning" size={22} />}
                                onClick={handleReport}
                                className="h-11 w-11 p-0 min-w-0 rounded-full"
                                aria-label="Signaler"
                                title="Signaler"
                            />
                        </div>
                    </div>

                    <div
                        className={cn(
                            'px-page-sm medium:px-page overflow-hidden transition-all duration-medium4 ease-emphasized',
                            isScrolled ? 'max-h-0 opacity-0 pb-0' : 'max-h-72 opacity-100 pb-3'
                        )}
                    >
                        <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={getStatusVariant(item.status)}>
                                    {formatStatus(item.status)}
                                </Badge>
                                <span className="inline-flex items-center rounded-xs border border-outline-variant bg-surface-container px-2 py-0.5 text-label-small text-on-surface-variant">{item.type}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-1 text-body-small text-on-surface-variant">
                                <div className="flex items-center gap-1.5">
                                    <MaterialIcon name="location_on" size={14} />
                                    {item.country || 'N/A'}, {item.site || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MaterialIcon name="calendar_today" size={14} />
                                    Acheté le {formatDateCompact(item.financial?.purchaseDate)}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCurrentUserCardClick}
                                disabled={!resolvedCurrentUser?.id && !canOpenAssignmentFromCard}
                                className={cn(
                                    "w-full flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 shadow-elevation-1 text-left transition-colors",
                                    (resolvedCurrentUser?.id || canOpenAssignmentFromCard)
                                        ? "cursor-pointer hover:bg-surface-container-low"
                                        : "cursor-default",
                                )}
                            >
                                {resolvedCurrentUser ? (
                                    <>
                                        <img
                                            src={resolvedCurrentUser.avatar}
                                            alt={resolvedCurrentUser.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-7 h-7 rounded-full bg-surface-container"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-label-small text-on-surface-variant">Utilisateur attribué</p>
                                            <p className="text-body-small text-on-surface font-medium truncate">{resolvedCurrentUser.name}</p>
                                        </div>
                                        <MaterialIcon name="chevron_right" size={16} className="text-outline-variant shrink-0" />
                                    </>
                                ) : (
                                    <>
                                        <div className="w-7 h-7 rounded-full bg-surface-container border border-dashed border-outline-variant flex items-center justify-center shrink-0">
                                            <MaterialIcon name="add" size={14} className="text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-label-small text-on-surface-variant">Utilisateur actuel</p>
                                            <p className="text-body-small text-on-surface font-medium truncate">Non attribué</p>
                                        </div>
                                        {canOpenAssignmentFromCard && <MaterialIcon name="chevron_right" size={16} className="text-outline-variant shrink-0" />}
                                    </>
                                )}
                            </button>

                            {permissions.canManageInventory && (
                                <div className="flex flex-wrap gap-2">
                                    {item.status === 'Disponible' && (
                                        <Button
                                            variant="filled"
                                            icon={<MaterialIcon name="person_add" size={18} />}
                                            onClick={handleOpenAssignmentWizard}
                                            className="!h-10 !rounded-md"
                                        >
                                            {GLOSSARY.ASSIGN}
                                        </Button>
                                    )}
                                    {item.status === 'Attribué' && (
                                        <Button
                                            variant="tonal"
                                            icon={<MaterialIcon name="undo" size={18} />}
                                            onClick={() => navigate('/wizards/return')}
                                            className="!h-10 !rounded-md"
                                        >
                                            {GLOSSARY.RETURN}
                                        </Button>
                                    )}
                                    {(item.status === 'Disponible' || item.status === 'En réparation') && (
                                        <Button
                                            variant="outlined"
                                            icon={<MaterialIcon name="delete" size={18} />}
                                            onClick={handleDelete}
                                            className="!h-10 !rounded-md"
                                        >
                                            Supprimer
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sticky top-0 z-20 bg-surface border-b border-outline-variant shadow-elevation-1">
                    <div
                        className={cn(
                            'overflow-hidden transition-all duration-medium4 ease-emphasized',
                            isScrolled ? 'max-h-0 opacity-0' : 'max-h-[520px] opacity-100'
                        )}
                    >
                        <DetailHeader
                            onBack={onBack}
                            className="border-b-0"
                            pretitle={(
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant={getStatusVariant(item.status)}>
                                        {formatStatus(item.status)}
                                    </Badge>
                                    <span className="text-on-surface-variant font-mono text-body-small bg-surface-container px-2 py-0.5 rounded-xs border border-outline-variant">{item.assetId}</span>
                                </div>
                            )}
                            title={item.name}
                            subtitle={(
                                <div className="flex flex-wrap gap-6 text-body-small text-on-surface-variant pt-2">
                                    <div className="flex items-center gap-2">
                                        <MaterialIcon name="laptop" size={16} />
                                        {item.type}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MaterialIcon name="location_on" size={16} />
                                        {item.country || 'N/A'}, {item.site || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MaterialIcon name="calendar_today" size={16} />
                                        Acheté le {formatDateCompact(item.financial?.purchaseDate)}
                                    </div>
                                </div>
                            )}
                            leadingVisual={(
                                <div className="w-28 h-28 medium:w-40 medium:h-40 bg-surface-container-low rounded-md flex items-center justify-center border border-outline-variant p-4">
                                    {item.image && !heroImageFailed ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-contain mix-blend-multiply"
                                            onError={() => setHeroImageFailed(true)}
                                        />
                                    ) : (
                                        <MaterialIcon name="inventory_2" size={48} className="text-outline" />
                                    )}
                                </div>
                            )}
                            actions={(
                                <div className="flex flex-col gap-3 w-full large:w-auto">
                                    <div className="flex gap-2">
                                        {permissions.canManageInventory && (
                                            <>
                                                <Button
                                                    variant="outlined"
                                                    icon={<MaterialIcon name="edit" size={18} />}
                                                    onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                                    className="bg-surface-container-low hover:bg-surface-container text-on-surface border-none"
                                                    title="Modifier"
                                                >
                                                    <span className="hidden large:inline">Modifier</span>
                                                </Button>

                                                {(item.status === 'Disponible' || item.status === 'En réparation') && (
                                                    <Button
                                                        variant="danger"
                                                        icon={<MaterialIcon name="delete" size={18} />}
                                                        onClick={handleDelete}
                                                        className="bg-error-container hover:bg-error-container/80 text-on-error-container border-none shadow-none"
                                                        title="Supprimer"
                                                    >
                                                        <span className="hidden large:inline">Supprimer</span>
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        <Button
                                            variant="outlined"
                                            icon={<MaterialIcon name="warning" size={18} />}
                                            onClick={handleReport}
                                            className="border-outline-variant"
                                        >
                                            Signaler
                                        </Button>
                                    </div>

                                    {permissions.canManageInventory && (
                                        <div className="flex gap-2">
                                            {item.status === 'Disponible' && (
                                                <Button
                                                    variant="filled"
                                                    icon={<MaterialIcon name="person_add" size={18} />}
                                                    onClick={handleOpenAssignmentWizard}
                                                    className="flex-1"
                                                >
                                                    {GLOSSARY.ASSIGN}
                                                </Button>
                                            )}

                                            {item.status === 'Attribué' && (
                                                <Button
                                                    variant="tonal"
                                                    icon={<MaterialIcon name="undo" size={18} />}
                                                    onClick={() => navigate('/wizards/return')}
                                                    className="flex-1"
                                                >
                                                    {GLOSSARY.RETURN}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            contentClassName="large:items-center"
                        />
                    </div>

                    <div
                        className={cn(
                            'overflow-hidden transition-all duration-medium4 ease-emphasized',
                            isScrolled ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                        )}
                    >
                        <div className="px-page py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Button
                                    variant="text"
                                    onClick={onBack}
                                    className="h-10 w-10 min-w-0 p-0 rounded-full"
                                    icon={<MaterialIcon name="arrow_back" size={20} />}
                                    aria-label="Retour"
                                />
                                <div className="min-w-0">
                                    <p className="text-body-medium font-semibold text-on-surface truncate">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-label-small text-on-surface-variant font-mono truncate">{item.assetId}</span>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {formatStatus(item.status)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {permissions.canManageInventory && (
                                    <Button
                                        variant="text"
                                        icon={<MaterialIcon name="edit" size={20} />}
                                        onClick={() => navigate(`/inventory/edit/${item.id}`)}
                                        className="h-10 w-10 min-w-0 p-0 rounded-full"
                                        aria-label="Modifier"
                                    />
                                )}
                                <Button
                                    variant="text"
                                    icon={<MaterialIcon name="warning" size={20} />}
                                    onClick={handleReport}
                                    className="h-10 w-10 min-w-0 p-0 rounded-full"
                                    aria-label="Signaler"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Content */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="p-page-sm medium:p-page overflow-y-auto flex-1 scroll-smooth"
            >
                <div className="max-w-7xl mx-auto">

                    {/* Repair Workflow Banner */}
                    {item.status === 'En réparation' && permissions.canManageInventory && (
                        <div className="mb-6 p-4 bg-primary-container border border-outline-variant rounded-md flex flex-col medium:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <MaterialIcon name="build" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-label-large text-on-primary-container">Maintenance en cours</h3>
                                    <p className="text-body-small text-on-primary-container/80">
                                        Cet équipement est marqué comme étant en réparation.
                                        {item.repairStartDate && ` Depuis le ${formatDateCompact(item.repairStartDate)}`}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="filled"
                                onClick={handleConfirmEndRepair}
                                className="shrink-0 w-full medium:w-auto"
                            >
                                Terminer la réparation
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-4 gap-6">
                        {/* Left Col - Specs & Info */}
                        <div className="expanded:col-span-3 space-y-6">
                            {/* Highlights */}
                            <div className="grid grid-cols-1 medium:grid-cols-3 gap-4">
                                <div className="bg-surface p-card rounded-md shadow-elevation-1 border border-outline-variant">
                                    <div className="flex items-center gap-3 text-on-surface-variant mb-2 text-label-small uppercase tracking-wider">
                                        <MaterialIcon name="monitor_heart" size={16} /> Santé
                                        {item.status !== 'En réparation' && <DemoBadge className="ml-auto" />}
                                    </div>
                                    <div className={`text-headline-small font-bold ${item.status === 'En réparation' ? 'text-primary' : 'text-tertiary'}`}>
                                        {item.status === 'En réparation' ? 'Maintenance' : '100%'}
                                    </div>
                                    <div className="text-label-small text-on-surface-variant mt-1">
                                        {item.status === 'En réparation' ? 'Intervention requise' : 'Aucun problème détecté'}
                                    </div>
                                </div>
                                <div className="bg-surface p-card rounded-md shadow-elevation-1 border border-outline-variant">
                                    <div className="flex items-center gap-3 text-on-surface-variant mb-2 text-label-small uppercase tracking-wider">
                                        <MaterialIcon name="shield" size={16} /> Garantie
                                    </div>
                                    <div className="text-headline-small font-bold text-on-surface">24 Mois</div>
                                    <div className="text-label-small text-on-surface-variant mt-1">Expire le {formatDate(item.warrantyEnd)}</div>
                                </div>
                                <div className="bg-surface p-card rounded-md shadow-elevation-1 border border-outline-variant">
                                    <div className="flex items-center gap-3 text-on-surface-variant mb-2 text-label-small uppercase tracking-wider">
                                        <MaterialIcon name="settings" size={16} /> Maintenance
                                        <DemoBadge className="ml-auto" />
                                    </div>
                                    <div className="text-headline-small font-bold text-on-surface">A jour</div>
                                    <div className="text-label-small text-on-surface-variant mt-1">Dernier patch: Hier</div>
                                </div>
                            </div>

                            {/* FINANCIAL DASHBOARD */}
                            {financialStats && item.financial && permissions.canManageInventory && (
                                <div className="bg-surface rounded-md shadow-elevation-1 border border-outline-variant p-card animate-in fade-in slide-in-from-bottom-2">
                                    <h3 className="text-title-medium text-on-surface mb-6 flex items-center gap-2">
                                        <MaterialIcon name="payments" size={20} className="text-primary" /> Informations financières
                                    </h3>

                                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-8">
                                        {/* Left Column: Values */}
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">PRIX D'ACHAT</p>
                                                <p className="text-headline-small font-bold text-on-surface">{formatCurrency(item.financial.purchasePrice, settings.currency)}</p>
                                                <p className="text-label-small text-on-surface-variant mt-1 flex items-center gap-1">
                                                    <MaterialIcon name="calendar_today" size={12} /> Acheté le {formatDate(item.financial.purchaseDate)}
                                                </p>
                                            </div>

                                            {/* Règle X12 : accent jaune en filet, jamais en couleur de texte */}
                                            <div className="border-l-4 border-l-primary pl-3">
                                                <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">VALEUR ACTUELLE</p>
                                                <div className="flex items-end gap-3">
                                                    <p className="text-headline-medium font-black text-on-surface leading-none">
                                                        {formatCurrency(financialStats.currentValue, settings.currency)}
                                                    </p>
                                                    <span className="text-body-small font-bold text-on-surface-variant mb-1">
                                                        ({(100 - financialStats.progressPercent).toFixed(0)}% restante)
                                                    </span>
                                                </div>
                                                <p className="text-label-small text-on-surface-variant mt-2">
                                                    Amorti à {financialStats.progressPercent.toFixed(1)}% sur {item.financial.depreciationYears} ans
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">AMORTISSEMENT TOTAL</p>
                                                <p className="text-title-large font-bold text-error flex items-center gap-1">
                                                    <MaterialIcon name="trending_down" size={20} /> -{formatCurrency(financialStats.totalDepreciation, settings.currency)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column: Chart & Details */}
                                        <div className="flex flex-col justify-center">
                                            <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-4">ÉVOLUTION DE LA VALEUR</p>

                                            {/* Visual Progress Bar */}
                                            <div className="relative h-10 bg-surface-container-highest rounded-md overflow-hidden mb-2 border border-outline-variant">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-long2 flex items-center justify-end px-3"
                                                    style={{ width: `${100 - financialStats.progressPercent}%` }}
                                                >
                                                    {(100 - financialStats.progressPercent) > 25 && (
                                                        <span className="text-on-primary font-bold text-label-small">{formatCurrency(financialStats.currentValue, settings.currency)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-label-small text-on-surface-variant uppercase tracking-wider mb-6">
                                                <span>Achat ({new Date(item.financial.purchaseDate).getFullYear()})</span>
                                                <span>Aujourd'hui</span>
                                                <span>Fin ({new Date(item.financial.purchaseDate).getFullYear() + item.financial.depreciationYears})</span>
                                            </div>

                                            <div className="bg-surface-container-low rounded-md p-4 space-y-3 text-body-small border border-outline-variant">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-on-surface-variant">Amortissement mensuel</span>
                                                    <span className="font-bold text-on-surface">{formatCurrency(financialStats.monthlyDepreciation, settings.currency)}</span>
                                                </div>
                                                <div className="w-full h-px bg-outline-variant"></div>
                                                <div className="flex justify-between items-start gap-3">
                                                    <span className="text-on-surface-variant">Valeur résiduelle</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-on-surface">{formatCurrency(item.financial.salvageValue || 0, settings.currency)}</span>
                                                        {(item.financial.salvageValue || 0) === 0 && (
                                                            <p className="text-label-small text-on-surface-variant mt-0.5">Valeur comptable minimale atteinte</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full h-px bg-outline-variant"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-on-surface-variant">Fin amortissement</span>
                                                    <span className="font-bold text-on-surface">
                                                        {formatDate(addYears(item.financial.purchaseDate, item.financial.depreciationYears))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    {financialStats.progressPercent > 80 && !financialStats.isFullyDepreciated && (
                                        <div className="mt-6 p-4 bg-primary-container border border-outline-variant rounded-md flex items-start gap-3">
                                            <MaterialIcon name="error" size={20} className="text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-label-large text-on-primary-container">Fin de vie proche</h4>
                                                <p className="text-body-small text-on-primary-container/80 mt-1">
                                                    Cet équipement est amorti à {financialStats.progressPercent.toFixed(1)}%.
                                                    Envisagez son remplacement prochainement.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {financialStats.isFullyDepreciated && (
                                        <div className="mt-6 p-4 bg-error-container border border-outline-variant rounded-md flex items-start gap-3">
                                            <MaterialIcon name="warning" size={20} className="text-error shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-label-large text-on-error-container">Amortissement terminé</h4>
                                                <p className="text-body-small text-on-error-container/80 mt-1">
                                                    Cet équipement a atteint sa valeur résiduelle comptable.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Specs */}
                            <div className="bg-surface rounded-md shadow-elevation-1 border border-outline-variant overflow-hidden">
                                <div className="px-card py-4 border-b border-outline-variant bg-surface-container-low">
                                    <h3 className="text-label-large text-on-surface">Spécifications techniques</h3>
                                </div>
                                <div className="p-card grid grid-cols-1 medium:grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <span className="block text-label-small text-on-surface-variant uppercase tracking-wide mb-1">Modèle</span>
                                        <span className="font-medium text-on-surface">{item.model}</span>
                                    </div>
                                    <div>
                                        <span className="block text-label-small text-on-surface-variant uppercase tracking-wide mb-1">Mémoire (RAM)</span>
                                        <span className="font-medium text-on-surface">{item.ram || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-label-small text-on-surface-variant uppercase tracking-wide mb-1">Stockage</span>
                                        <span className="font-medium text-on-surface">{item.storage || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-label-small text-on-surface-variant uppercase tracking-wide mb-1">Système d'exploitation</span>
                                        <span className="font-medium text-on-surface">{item.os || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-label-small text-on-surface-variant uppercase tracking-wide mb-1">Numéro de série</span>
                                        <span className="font-mono bg-surface-container px-2 py-0.5 rounded-xs text-body-small text-on-surface">{item.serialNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <MovementTimeline
                                title="Historique de vie"
                                items={equipmentMovementItems}
                                emptyMessage="Aucun mouvement enregistré pour cet équipement."
                            />
                        </div>

                        {/* Right Col - Current User & Docs */}
                        <div className="space-y-6">
                            {/* Current User Card */}
                            <div className="bg-surface rounded-md shadow-elevation-1 border border-outline-variant p-card">
                                <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest mb-4">UTILISATEUR ACTUEL</h3>
                                <button
                                    type="button"
                                    onClick={handleCurrentUserCardClick}
                                    disabled={!resolvedCurrentUser?.id && !canOpenAssignmentFromCard}
                                    className={cn(
                                        "w-full rounded-md border p-4 text-left transition-all duration-short4",
                                        (resolvedCurrentUser?.id || canOpenAssignmentFromCard)
                                            ? "cursor-pointer border-outline-variant bg-surface hover:bg-surface-container-low hover:border-primary/40"
                                            : "cursor-default border-dashed border-outline-variant bg-surface-container-low",
                                    )}
                                >
                                    {resolvedCurrentUser ? (
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={resolvedCurrentUser.avatar}
                                                alt={resolvedCurrentUser.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-14 h-14 rounded-full bg-surface-container"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-on-surface text-title-medium truncate">{resolvedCurrentUser.name}</div>
                                                <div className="text-body-small text-on-surface-variant flex items-center gap-1">
                                                    <MaterialIcon name="open_in_new" size={12} /> Ouvrir la fiche utilisateur
                                                </div>
                                            </div>
                                            <MaterialIcon name="chevron_right" size={18} className="text-outline-variant shrink-0" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface border border-dashed border-outline-variant flex items-center justify-center shrink-0">
                                                <MaterialIcon name="add" size={18} className="text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body-medium font-semibold text-on-surface">Non attribué</p>
                                                <p className="text-label-small text-on-surface-variant">Cliquer pour lancer l’attribution</p>
                                            </div>
                                            {canOpenAssignmentFromCard && <MaterialIcon name="chevron_right" size={18} className="text-outline-variant shrink-0" />}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Documents */}
                            <div className="bg-surface rounded-md shadow-elevation-1 border border-outline-variant p-card">
                                <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                                    DOCUMENTS
                                    <DemoBadge className="ml-auto" title="Documents fictifs de démonstration — aucune GED n'est connectée" />
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload('Facture_Achat.pdf')}
                                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-surface-container-low cursor-pointer transition-colors duration-short4 border border-transparent hover:border-outline-variant text-left"
                                        aria-label="Télécharger Facture_Achat.pdf"
                                    >
                                        <div className="w-10 h-10 bg-error-container text-on-error-container rounded-sm flex items-center justify-center">
                                            <MaterialIcon name="description" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-body-small font-bold text-on-surface truncate">Facture_Achat.pdf</div>
                                            <div className="text-label-small text-on-surface-variant">1.2 MB</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload('Contrat_Garantie.pdf')}
                                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-surface-container-low cursor-pointer transition-colors duration-short4 border border-transparent hover:border-outline-variant text-left"
                                        aria-label="Télécharger Contrat_Garantie.pdf"
                                    >
                                        <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-sm flex items-center justify-center">
                                            <MaterialIcon name="description" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-body-small font-bold text-on-surface truncate">Contrat_Garantie.pdf</div>
                                            <div className="text-label-small text-on-surface-variant">850 KB</div>
                                        </div>
                                    </button>
                                </div>
                                <Button variant="outlined" className="w-full mt-4 text-primary font-bold hover:underline justify-center">Voir tout</Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentDetailsPage;



