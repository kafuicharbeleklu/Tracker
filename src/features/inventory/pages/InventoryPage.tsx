import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import { ViewType } from '../../../types';
import StatusBadge from '../../../components/ui/StatusBadge';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { useAccessControl } from '../../../hooks/useAccessControl';
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
import { useConfirmation } from '../../../context/ConfirmationContext';
import { getDisplayedEquipmentStatus, getStatusLabel } from '../../../lib/businessRules';
import { buildCsvLine } from '../../../lib/csv';
import { DEMO_RESEED_NOTICE, isDemoSeedEquipment } from '../../../lib/demoSeed';

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY_SEARCH = 'inventory_search';
const STORAGE_KEY_STATUS = 'inventory_status';
const INVENTORY_FILTER_PANEL_ID = 'inventory-filter-panel';

interface InventoryPageProps {
    onViewChange: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
    onUserClick?: (id: string) => void;
    initialStatus?: string | null;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onViewChange, onEquipmentClick, initialStatus }) => {
    const { equipment, users, deleteEquipment } = useData();
    const { filterEquipment, permissions } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const isCompact = useMediaQuery(MEDIA.compact);

    const accessibleEquipment = useMemo(() => filterEquipment(equipment, users), [equipment, users, filterEquipment]);

    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '');
    const [statusFilter, setStatusFilter] = useState(() => initialStatus || sessionStorage.getItem(STORAGE_KEY_STATUS) || '');
    const [showFilters, setShowFilters] = useState(() => Boolean(initialStatus || sessionStorage.getItem(STORAGE_KEY_STATUS)));
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
    const filterPanelRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_STATUS, statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        if (initialStatus) {
            setStatusFilter(initialStatus);
        }
    }, [initialStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter]);

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

    const filteredEquipment = useMemo(() => {
        return accessibleEquipment.filter(item => {
            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch =
                item.name.toLowerCase().includes(searchLower) ||
                item.assetId.toLowerCase().includes(searchLower) ||
                item.user?.name?.toLowerCase().includes(searchLower) ||
                item.type.toLowerCase().includes(searchLower);

            const matchesStatus = statusFilter === '' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [accessibleEquipment, debouncedSearch, statusFilter]);

    const statusFilterOptions = useMemo(() => {
        const preferredOrder = [
            'Disponible',
            'Attribué',
            'En attente',
            'En réparation',
            'En maintenance préventive',
            'Manquant',
            'Perdu',
            'Retiré',
            'Réformé',
        ];

        const seen = new Set<string>();
        const dynamicStatuses = accessibleEquipment
            .map((item) => item.status)
            .filter(Boolean)
            .filter((status): status is string => {
                if (seen.has(status)) return false;
                seen.add(status);
                return true;
            });

        const merged = [...new Set([...preferredOrder, ...dynamicStatuses])];
        return merged.map((status) => ({
            value: status,
            label: getStatusLabel(status),
        }));
    }, [accessibleEquipment]);

    useEffect(() => {
        setSelectedEquipmentIds((prev) => {
            const filteredIds = new Set(filteredEquipment.map((item) => item.id));
            const next = prev.filter((id) => filteredIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [filteredEquipment]);

    useEffect(() => {
        if (!selectionMode) {
            setSelectedEquipmentIds([]);
        }
    }, [selectionMode]);

    const totalPages = useMemo(() => Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE), [filteredEquipment]);
    const paginatedEquipment = useMemo(() => {
        return filteredEquipment.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredEquipment, currentPage]);
    const handleExport = (itemsToExport = filteredEquipment) => {
        if (itemsToExport.length === 0) {
            showToast('Aucune donnée à exporter avec les filtres actuels.', 'info');
            return;
        }

        const headers = [
            'Nom',
            'Asset ID',
            'Type',
            'Modele',
            'Statut',
            'Utilisateur',
            'Email utilisateur',
            'Site',
            'Pays',
            'Date achat',
            'Prix achat',
            'Fin de garantie',
            'Numero de serie',
            'Hostname'
        ];

        const rows = itemsToExport.map(item => [
            item.name,
            item.assetId,
            item.type,
            item.model,
            item.status,
            item.user?.name || '',
            item.user?.email || '',
            item.site || '',
            item.country || '',
            item.financial?.purchaseDate || '',
            item.financial?.purchasePrice ?? '',
            item.warrantyEnd || '',
            item.serialNumber || '',
            item.hostname || ''
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
        link.download = `equipements-${fileDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`${itemsToExport.length} équipement(s) exporté(s).`, 'success');
    };

    const selectedEquipmentSet = useMemo(() => new Set(selectedEquipmentIds), [selectedEquipmentIds]);
    const pageEquipmentIds = useMemo(() => paginatedEquipment.map((item) => item.id), [paginatedEquipment]);
    const selectedEquipment = useMemo(
        () => filteredEquipment.filter((item) => selectedEquipmentSet.has(item.id)),
        [filteredEquipment, selectedEquipmentSet],
    );
    const selectedCount = selectedEquipmentIds.length;
    const allVisibleSelected = pageEquipmentIds.length > 0 && pageEquipmentIds.every((id) => selectedEquipmentSet.has(id));
    const someVisibleSelected = pageEquipmentIds.some((id) => selectedEquipmentSet.has(id));

    const toggleSelection = (id: string, checked: boolean) => {
        setSelectedEquipmentIds((prev) => {
            if (checked) {
                if (prev.includes(id)) return prev;
                return [...prev, id];
            }
            return prev.filter((entry) => entry !== id);
        });
    };

    const togglePageSelection = (checked: boolean) => {
        setSelectedEquipmentIds((prev) => {
            const next = new Set(prev);
            pageEquipmentIds.forEach((id) => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return Array.from(next);
        });
    };

    const handleBulkDelete = () => {
        if (selectedCount === 0) return;

        requestConfirmation({
            title: 'Supprimer la sélection',
            message: `Supprimer ${selectedCount} équipement(s) sélectionné(s) ? Les équipements en cours d’attribution seront ignorés.`,
            confirmText: 'Supprimer',
            variant: 'danger',
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;
                let seeded = 0;

                selectedEquipmentIds.forEach((id) => {
                    if (deleteEquipment(id)) {
                        deleted += 1;
                        if (isDemoSeedEquipment(id)) seeded += 1;
                    } else {
                        blocked += 1;
                    }
                });

                setSelectedEquipmentIds([]);

                if (deleted > 0) {
                    showToast(`${deleted} équipement(s) supprimé(s).`, 'success');
                }
                if (seeded > 0) {
                    showToast(DEMO_RESEED_NOTICE, 'info');
                }
                if (blocked > 0) {
                    showToast(`${blocked} équipement(s) n’ont pas pu être supprimés (statut non compatible).`, 'warning');
                }
            },
        });
    };

    const handleDeleteOne = (id: string, name: string) => {
        requestConfirmation({
            title: "Supprimer l'équipement",
            message: `Supprimer "${name}" ?`,
            confirmText: 'Supprimer',
            variant: 'danger',
            onConfirm: () => {
                if (deleteEquipment(id)) {
                    showToast(`${name} supprimé.`, 'success');
                    if (isDemoSeedEquipment(id)) {
                        showToast(DEMO_RESEED_NOTICE, 'info');
                    }
                    return;
                }
                showToast("Suppression impossible: équipement attribué ou en attente.", 'warning');
            },
        });
    };

    const inventoryHeaderActions = isCompact ? null : (
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
            {permissions.canManageInventory && (
                <>
                    <Button variant="outlined" className="hidden medium:inline-flex" icon={<MaterialIcon name="upload" size={18} />} onClick={() => onViewChange('import_equipment')}>Importer</Button>
                    <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => onViewChange('add_equipment')}>Ajouter</Button>
                </>
            )}
        </div>
    );
    const hasActiveFilters = Boolean(statusFilter || searchQuery);
    const headerSubtitle = hasActiveFilters
        ? `${filteredEquipment.length} actif(s) filtré(s) sur ${accessibleEquipment.length} visible(s) selon vos droits.`
        : `${accessibleEquipment.length} actif(s) visible(s) selon vos droits.`;
    const activeFilterSummary = [
        statusFilter ? 'Statut: ' + statusFilter : null,
        searchQuery ? 'Recherche: "' + searchQuery + '"' : null,
    ].filter(Boolean).join(' • ');
    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
    };
    return (
        <PageContainer>
            <PageHeader
                title={GLOSSARY.EQUIPMENT_PLURAL}
                subtitle={headerSubtitle}
                breadcrumb={GLOSSARY.INVENTORY}
                actions={inventoryHeaderActions}
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
                                filterPanelId={INVENTORY_FILTER_PANEL_ID}
                                placeholder="Rechercher..."
                            />
                        </div>
                    </div>
                ) : (
                    <SearchFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        onFilterClick={() => setShowFilters((prev) => !prev)}
                        filterActive={showFilters}
                        filterPanelId={INVENTORY_FILTER_PANEL_ID}
                        resultCount={filteredEquipment.length}
                        placeholder="Rechercher..."
                    />
                )}

                {isCompact && (
                    <p className="-mt-3 text-body-small text-on-surface-variant">
                        {filteredEquipment.length} actif{filteredEquipment.length > 1 ? 's' : ''}
                    </p>
                )}

                {hasActiveFilters && (
                    <div className="-mt-2 rounded-md border border-secondary/30 bg-secondary-container/40 px-3 py-2.5 flex flex-col medium:flex-row medium:items-center medium:justify-between gap-1.5">
                        <div className="inline-flex items-center gap-1.5 text-label-small text-on-secondary-container">
                            <MaterialIcon name="filter_alt" size={14} />
                            <span className="font-semibold uppercase tracking-wide">Filtre actif</span>
                        </div>
                        <p className="text-body-small text-on-secondary-container/90 truncate" title={activeFilterSummary}>
                            {activeFilterSummary}
                        </p>
                    </div>
                )}

                {showFilters && (
                    <div
                        id={INVENTORY_FILTER_PANEL_ID}
                        ref={filterPanelRef}
                        className="flex flex-col medium:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-short4"
                        role="region"
                        aria-label="Filtres inventaire"
                    >
                        <SelectFilter
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Tous les statuts"
                            options={statusFilterOptions}
                            className="w-full medium:w-64"
                        />
                        {(statusFilter || searchQuery) && (
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
                                    onClick={() => handleExport(selectedEquipment)}
                                >
                                    Exporter sélection
                                </Button>
                                {permissions.canManageInventory && (
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
                                className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
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
                    {paginatedEquipment.length > 0 ? (
                        paginatedEquipment.map((item) => {
                            const canDeleteRow = !selectionMode && permissions.canManageInventory;
                            return (
                                <EntityRow
                                key={item.id}
                                image={item.image}
                                imageFit="cover"
                                title={item.name}
                                onClick={() => {
                                    if (selectionMode) {
                                        toggleSelection(item.id, !selectedEquipmentSet.has(item.id));
                                        return;
                                    }
                                    onEquipmentClick && onEquipmentClick(item.id);
                                }}
                                selected={selectionMode && selectedEquipmentSet.has(item.id)}
                                selectionControl={selectionMode ? (
                                    <input
                                        type="checkbox"
                                        checked={selectedEquipmentSet.has(item.id)}
                                        onChange={(event) => toggleSelection(item.id, event.target.checked)}
                                        className="h-4 w-4 accent-[var(--md-sys-color-primary)]"
                                        aria-label={`Sélectionner ${item.name}`}
                                    />
                                ) : undefined}
                                subtitle={
                                    <div className="flex items-center gap-3">
                                        <span className="text-label-small font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant">
                                            {item.assetId}
                                        </span>
                                        <span className="text-body-small text-on-surface-variant truncate">• {item.type}</span>
                                    </div>
                                }
                                status={(
                                    <div className="flex medium:w-[164px] items-center justify-end pr-1">
                                        <StatusBadge
                                            status={getDisplayedEquipmentStatus({
                                                status: item.status,
                                                assignmentStatus: item.assignmentStatus,
                                            })}
                                            size="sm"
                                        />
                                    </div>
                                )}

                                location={
                                    <div className="flex w-full min-w-0 items-center gap-1.5 text-label-small text-on-surface-variant">
                                        <MaterialIcon name="location_on" size={16} className="shrink-0" />
                                        <span className="truncate text-body-medium">{item.site || 'N/A'}</span>
                                    </div>
                                }
                                meta={
                                    <div className="flex w-full min-w-0 items-center self-center">
                                        {item.user ? (
                                            <div className="flex w-full min-w-0 items-center gap-3">
                                                <UserAvatar name={item.user.name || ''} src={item.user.avatar} size="md" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-body-medium font-medium text-on-surface truncate">{item.user.name}</span>
                                                    <span className="text-label-small text-on-surface-variant truncate">{item.user.department || 'Employé'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex w-full min-w-0 items-center gap-3 text-on-surface-variant">
                                                <div className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center shrink-0">
                                                    <MaterialIcon name="person_off" size={16} />
                                                </div>
                                                <span className="text-body-medium truncate">Non assigné</span>
                                            </div>
                                        )}
                                    </div>
                                }
                                actions={
                                    canDeleteRow ? (
                                        <Button
                                            variant="text"
                                            size="sm"
                                            className="h-9 w-9 min-w-0 p-0 rounded-full !text-error hover:bg-error-container/40"
                                            icon={<MaterialIcon name="delete" size={18} />}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDeleteOne(item.id, item.name);
                                            }}
                                            aria-label={`Supprimer ${item.name}`}
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
                                icon="inventory_2"
                                title={accessibleEquipment.length === 0 ? "Aucun équipement" : "Aucun résultat"}
                                description={accessibleEquipment.length === 0 ? "Commencez par ajouter votre premier équipement." : "Ajustez vos filtres de recherche."}
                                action={
                                    accessibleEquipment.length === 0 && permissions.canManageInventory ? (
                                        <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => onViewChange('add_equipment')}>
                                            Ajouter un équipement
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
                    label="Équipement"
                    sheetTitle="Actions Équipements"
                    actions={[
                        {
                            id: 'toggle-selection',
                            label: selectionMode ? 'Terminer sélection' : 'Mode sélection',
                            icon: selectionMode ? 'checklist_rtl' : 'check_box',
                            variant: 'outlined' as const,
                            onSelect: () => setSelectionMode((prev) => !prev),
                        },
                        ...(permissions.canManageInventory ? [
                            {
                                id: 'scan-equipment-qr',
                                label: 'Scanner QR machine',
                                icon: 'qr_code_scanner',
                                variant: 'outlined' as const,
                                onSelect: () => onViewChange('audit_details'),
                            },
                            {
                                id: 'add-equipment',
                                label: 'Ajouter un équipement',
                                icon: 'add',
                                variant: 'filled' as const,
                                onSelect: () => onViewChange('add_equipment'),
                            },
                            {
                                id: 'import-equipment',
                                label: 'Importer des équipements',
                                icon: 'upload',
                                variant: 'outlined' as const,
                                onSelect: () => onViewChange('import_equipment'),
                            },
                        ] : []),
                        {
                            id: 'export-equipment',
                            label: 'Exporter la liste',
                            icon: 'download',
                            variant: 'outlined' as const,
                            onSelect: handleExport,
                        },
                        ...(selectionMode && selectedCount > 0 ? [
                            {
                                id: 'export-selected-equipment',
                                label: 'Exporter la sélection',
                                icon: 'download',
                                variant: 'outlined' as const,
                                onSelect: () => handleExport(selectedEquipment),
                            },
                            ...(permissions.canManageInventory ? [{
                                id: 'delete-selected-equipment',
                                label: 'Supprimer la sélection',
                                icon: 'delete',
                                variant: 'outlined' as const,
                                onSelect: handleBulkDelete,
                            }] : []),
                        ] : []),
                    ]}
                />
            )}

            {
                filteredEquipment.length > 0 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )
            }
        </PageContainer >
    );
}

export default InventoryPage;

