import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowCircleRight,
    CaretDown,
    Clock,
    Funnel,
    Keyboard,
    Package,
    Plus,
    Scan,
    Warning,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useDebounce } from '../../../hooks/useDebounce';
import useSelection from '../../../hooks/useSelection';
import { ViewType } from '../../../types';

import ListTemplate, { type ListFacet } from '../../../components/layout/ListTemplate';
import ListRow from '../../../components/ui/ListRow';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { FabContainer } from '../../../components/ui/FabContainer';
import BottomSheet from '../../../components/ui/BottomSheet';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';

import { getDisplayedEquipmentStatus, getStatusLabel } from '../../../lib/businessRules';
import { getCategoryLabel } from '../../../constants/glossary';
import { getStatusPresentation } from '../../../constants/statusPresentation';
import { buildCsvLine } from '../../../lib/csv';
import { DEMO_RESEED_NOTICE, isDemoSeedEquipment } from '../../../lib/demoSeed';

/**
 * Liste des équipements — **portée sur la planche 04.1** (gabarit `ListTemplate`).
 *
 * *Une liste sert à trouver, pas à lire.* Le gestionnaire l'ouvre pour retrouver
 * l'objet dont on lui parle, ou choisir dans ce qui est disponible ; il enchaîne sur
 * la fiche, puis sur attribuer.
 *
 * Pour l'utilisateur final (« Mes équipements ») : disparition de la recherche, des filtres,
 * du tri, et du FAB — 4 rangées claires disant depuis quand l'objet est à lui.
 */

const STORAGE_KEY_SEARCH = 'inventory_search';
const STORAGE_KEY_STATUS = 'inventory_status';

/** L'ordre de lecture des états, quand ils sont présents au parc. */
const FACET_ORDER = [
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

const SORT_OPTIONS = [
    { id: 'recent', label: 'Ajout récent' },
    { id: 'oldest', label: 'Ancienneté' },
    { id: 'name', label: 'Code / Nom' },
    { id: 'type', label: 'Type' },
    { id: 'status', label: 'Statut' },
] as const;

const DEFAULT_SORT_INDEX = 0;
const ARRIVAL_SORT_INDEX = SORT_OPTIONS.findIndex((option) => option.id === 'oldest');

const FAMILIES = [
    'Toutes',
    'Informatique',
    'Périphériques',
    'Impression et réseau',
    'Mobilier et divers',
] as const;

type EquipmentFamily = Exclude<(typeof FAMILIES)[number], 'Toutes'>;

/** Les clés de données restent stables ; la langue affichée est portée par le glossaire. */
const FAMILY_TYPE_KEYS: Record<EquipmentFamily, readonly string[]> = {
    Informatique: ['Laptop', 'Server', 'Desktop', 'Computer'],
    Périphériques: ['Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Phone', 'Tablet'],
    'Impression et réseau': ['Printer', 'Switch', 'Router'],
    'Mobilier et divers': ['Furniture', 'Accessory'],
};

const PERIODS = ['Toute période', '30 derniers jours', 'Cette année'] as const;
const PAGE_SIZE = 20;

const formatDate = (isoOrDate?: string | Date): string => {
    if (!isoOrDate) return '—';
    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
    }).format(date);
};

const getDaysSince = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

interface InventoryPageProps {
    onViewChange: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
    onUserClick?: (id: string) => void;
    initialStatus?: string | null;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onViewChange, onEquipmentClick, initialStatus }) => {
    const { equipment, users, deleteEquipment } = useData();
    const { currentUser } = useAuth();
    const { filterEquipment, permissions } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const isManager = permissions.canManageInventory;

    const accessibleEquipment = useMemo(
        () => filterEquipment(equipment, users),
        [equipment, users, filterEquipment]
    );

    // Équipements de l'utilisateur connecté (pour la vue « Mes équipements »)
    const userEquipment = useMemo(() => {
        if (!currentUser) return [];
        return accessibleEquipment.filter(
            (item) => item.user?.id === currentUser.id || item.user?.name === currentUser.name
        );
    }, [accessibleEquipment, currentUser]);

    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '');
    const [statusFilter, setStatusFilter] = useState(
        () => initialStatus || sessionStorage.getItem(STORAGE_KEY_STATUS) || ''
    );
    /** Vrai tant qu'on n'a pas quitté le filtre reçu d'un autre écran. */
    const [arrivedFiltered, setArrivedFiltered] = useState(() => Boolean(initialStatus));
    const [isScanning, setIsScanning] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [sortIndex, setSortIndex] = useState(DEFAULT_SORT_INDEX);
    const [scanHit, setScanHit] = useState<ScanHit | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const selection = useSelection();

    // Filtres de la feuille montante
    const [familyFilter, setFamilyFilter] = useState<string>('Toutes');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('Tous');
    const [periodFilter, setPeriodFilter] = useState<string>('Toute période');

    const availableLocations = useMemo(() => {
        const sites = new Set<string>();
        accessibleEquipment.forEach((item) => {
            if (item.site) sites.add(item.site);
        });
        return ['Tous', ...Array.from(sites)];
    }, [accessibleEquipment]);

    const availableTypesForFamily = useMemo(() => {
        if (familyFilter === 'Toutes') return [];

        const familyTypes = FAMILY_TYPE_KEYS[familyFilter as EquipmentFamily];
        return Array.from(
            new Set(
                accessibleEquipment
                    .filter((item) => familyTypes.includes(item.type))
                    .map((item) => item.type)
            )
        ).sort((left, right) => getCategoryLabel(left).localeCompare(getCategoryLabel(right), 'fr'));
    }, [accessibleEquipment, familyFilter]);

    const activeSheetFiltersCount = useMemo(() => {
        let count = 0;
        if (familyFilter !== 'Toutes') count += 1;
        if (typeFilter) count += 1;
        if (locationFilter !== 'Tous') count += 1;
        if (periodFilter !== 'Toute période') count += 1;
        return count;
    }, [familyFilter, typeFilter, locationFilter, periodFilter]);

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_STATUS, statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        if (initialStatus) {
            setStatusFilter(initialStatus);
            setArrivedFiltered(true);
            setSortIndex(ARRIVAL_SORT_INDEX);
        }
    }, [initialStatus]);

    const filteredEquipment = useMemo(() => {
        if (!isManager) {
            return userEquipment;
        }

        const searchLower = debouncedSearch.toLowerCase();
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const currentYear = new Date().getFullYear();

        const list = accessibleEquipment.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchLower) ||
                item.assetId.toLowerCase().includes(searchLower) ||
                item.user?.name?.toLowerCase().includes(searchLower) ||
                item.type.toLowerCase().includes(searchLower) ||
                getCategoryLabel(item.type).toLowerCase().includes(searchLower);

            const matchesStatus = statusFilter === '' || item.status === statusFilter;

            // Filtre Famille
            const matchesFamily =
                familyFilter === 'Toutes' ||
                FAMILY_TYPE_KEYS[familyFilter as EquipmentFamily].includes(item.type);
            const matchesType = !typeFilter || item.type === typeFilter;

            // Filtre Emplacement
            const matchesLocation = locationFilter === 'Tous' || item.site === locationFilter;

            // Filtre Période
            let matchesPeriod = true;
            if (periodFilter === '30 derniers jours') {
                const itemDate = new Date(item.financial?.purchaseDate || item.updatedAt).getTime();
                matchesPeriod = itemDate >= thirtyDaysAgo;
            } else if (periodFilter === 'Cette année') {
                const itemYear = new Date(item.financial?.purchaseDate || item.updatedAt).getFullYear();
                matchesPeriod = itemYear === currentYear;
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesFamily &&
                matchesType &&
                matchesLocation &&
                matchesPeriod
            );
        });

        const activeSort = SORT_OPTIONS[sortIndex]?.id;
        if (activeSort === 'name') {
            return [...list].sort((a, b) => a.name.localeCompare(b.name));
        }
        if (activeSort === 'type') {
            return [...list].sort((a, b) =>
                getCategoryLabel(a.type).localeCompare(getCategoryLabel(b.type), 'fr')
            );
        }
        if (activeSort === 'status') {
            return [...list].sort((a, b) => a.status.localeCompare(b.status));
        }
        if (activeSort === 'oldest') {
            return [...list].sort(
                (a, b) =>
                    new Date(a.financial?.purchaseDate || a.updatedAt).getTime() -
                    new Date(b.financial?.purchaseDate || b.updatedAt).getTime()
            );
        }
        // Par défaut / 'recent' : ordre naturel (ajout récent)
        return list;
    }, [
        accessibleEquipment,
        userEquipment,
        debouncedSearch,
        statusFilter,
        familyFilter,
        typeFilter,
        locationFilter,
        periodFilter,
        sortIndex,
        isManager,
    ]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filteredEquipment]);

    const visibleEquipment = useMemo(
        () => filteredEquipment.slice(0, visibleCount),
        [filteredEquipment, visibleCount]
    );

    /**
     * Les états montent en tête avec leurs compteurs.
     */
    const facets = useMemo<ListFacet[]>(() => {
        const counts = new Map<string, number>();
        accessibleEquipment.forEach((item) => {
            counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
        });

        const present = [
            ...FACET_ORDER.filter((status) => counts.has(status)),
            ...[...counts.keys()].filter((status) => !FACET_ORDER.includes(status)),
        ];

        return [
            { id: 'tous', label: 'Tous', count: accessibleEquipment.length },
            ...present.map((status) => {
                const presentation = getStatusPresentation(status);
                return {
                    id: status,
                    label: getStatusLabel(status),
                    count: counts.get(status) ?? 0,
                    icon: presentation.icon,
                    tone: presentation.tone,
                };
            }),
        ];
    }, [accessibleEquipment]);

    const displayedFacets = useMemo(() => {
        if (!arrivedFiltered || !statusFilter) return facets;
        const activeFacet = facets.find((facet) => facet.id === statusFilter);
        return activeFacet ? [activeFacet, ...facets.filter((facet) => facet.id !== statusFilter)] : facets;
    }, [arrivedFiltered, facets, statusFilter]);

    const selectedEquipment = useMemo(
        () => filteredEquipment.filter((item) => selection.isSelected(item.id)),
        [filteredEquipment, selection]
    );

    const handleExport = (itemsToExport = filteredEquipment) => {
        if (itemsToExport.length === 0) {
            showToast('Aucune donnée à exporter avec les filtres actuels.', 'info');
            return;
        }

        const headers = [
            'Nom', 'Asset ID', 'Type', 'Modele', 'Statut', 'Utilisateur', 'Email utilisateur',
            'Site', 'Pays', 'Date achat', 'Prix achat', 'Fin de garantie', 'Numero de serie', 'Hostname',
        ];

        const rows = itemsToExport.map((item) => [
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
            item.hostname || '',
        ]);

        const csvContent = [buildCsvLine(headers), ...rows.map((row) => buildCsvLine(row))].join('\n');
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

    const handleBulkDelete = () => {
        if (selection.count === 0) return;
        const ids = [...selection.selectedIds];

        requestConfirmation({
            title:
                ids.length > 1
                    ? `Sortir ${ids.length} équipements du parc ?`
                    : 'Sortir cet équipement du parc ?',
            message: (
                <>
                    Ils quittent l’inventaire et les rapports.{' '}
                    <strong className="font-medium text-on-surface">Leur historique est conservé</strong> et
                    reste consultable depuis le journal d’audit. Les équipements en cours d’attribution sont
                    ignorés.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Sortir du parc',
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;
                let seeded = 0;

                ids.forEach((id) => {
                    if (deleteEquipment(id)) {
                        deleted += 1;
                        if (isDemoSeedEquipment(id)) seeded += 1;
                    } else {
                        blocked += 1;
                    }
                });

                selection.exit();

                if (deleted > 0) showToast(`${deleted} équipement(s) sorti(s) du parc.`, 'success');
                if (seeded > 0) showToast(DEMO_RESEED_NOTICE, 'info');
                if (blocked > 0) {
                    showToast(
                        `${blocked} équipement(s) n’ont pas pu être sortis (statut non compatible).`,
                        'warning'
                    );
                }
            },
        });
    };

    const clearArrivalFilter = () => {
        setStatusFilter('');
        setArrivedFiltered(false);
        setSortIndex(DEFAULT_SORT_INDEX);
    };

    const handleClearAllSheetFilters = () => {
        setFamilyFilter('Toutes');
        setTypeFilter('');
        setLocationFilter('Tous');
        setPeriodFilter('Toute période');
    };

    const clearAllListFilters = () => {
        setSearchQuery('');
        clearArrivalFilter();
        handleClearAllSheetFilters();
    };


    const isFiltered = Boolean(
        statusFilter ||
        debouncedSearch ||
        familyFilter !== 'Toutes' ||
        typeFilter ||
        locationFilter !== 'Tous' ||
        periodFilter !== 'Toute période'
    );

    const hasPendingConfirmation = useMemo(
        () => userEquipment.some((item) => item.assignmentStatus === 'PENDING_CONFIRMATION'),
        [userEquipment]
    );

    return (
        <>
            <ListTemplate
                title={isManager ? 'Équipements' : 'Mes équipements'}
                subtitle={isManager ? `${accessibleEquipment.length} au parc` : undefined}
                actions={
                    isManager ? (
                        <button
                            type="button"
                            aria-label="Scanner une étiquette"
                            onClick={() => {
                                setIsScanning(true);
                                setScanHit(null);
                            }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        >
                            <Icon glyph={Scan} size={24} />
                        </button>
                    ) : undefined
                }
                search={
                    isManager
                        ? {
                              value: searchQuery,
                              onChange: setSearchQuery,
                              placeholder: 'Code, identifiant, modèle',
                          }
                        : undefined
                }
                filter={
                    isManager ? (
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
                    ) : undefined
                }
                facets={isManager ? displayedFacets : undefined}
                activeFacetId={statusFilter || 'tous'}
                onActiveFacetClear={arrivedFiltered ? clearArrivalFilter : undefined}
                activeFacetClearLabel={
                    statusFilter ? `Retirer le filtre ${getStatusLabel(statusFilter)}` : undefined
                }
                onFacetSelect={
                    isManager
                        ? (id) => {
                              setStatusFilter(id === 'tous' ? '' : id);
                              if (arrivedFiltered) setSortIndex(DEFAULT_SORT_INDEX);
                              setArrivedFiltered(false);
                          }
                        : undefined
                }
                origin={
                    arrivedFiltered && statusFilter
                        ? {
                              token: getStatusLabel(statusFilter),
                              from: (
                                  <span>
                                      Depuis <b>le tableau de bord</b> · carte « {getStatusLabel(statusFilter)} »
                                  </span>
                              ),
                              clearLabel: `Voir les ${accessibleEquipment.length} actifs du parc`,
                              onClear: clearArrivalFilter,
                              displayToken: false,
                              clearPresentation: 'more',
                          }
                        : undefined
                }
                count={
                    isManager
                        ? {
                              total: statusFilter ? filteredEquipment.length : accessibleEquipment.length,
                              shown: visibleEquipment.length,
                              noun: statusFilter
                                  ? `actifs ${getStatusLabel(statusFilter).toLowerCase()} sur ${accessibleEquipment.length}`
                                  : 'actifs',
                          }
                        : undefined
                }
                sort={
                    isManager
                        ? {
                              label: SORT_OPTIONS[sortIndex].label,
                              onClick: () => setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length),
                          }
                        : undefined
                }
                selection={{
                    active: selection.isActive,
                    count: selection.count,
                    total: filteredEquipment.length,
                    onExit: selection.exit,
                    onSelectAll: () => selection.selectAll(filteredEquipment.map((item) => item.id)),
                    onClearAll: selection.clear,
                    actions: (
                        <Button variant="filled" onClick={() => handleExport(selectedEquipment)}>
                            Exporter {selection.count > 1 ? `les ${selection.count}` : ''}
                        </Button>
                    ),
                    bulkOverflow: isManager ? (
                        <Button variant="danger" onClick={handleBulkDelete}>
                            Sortir du parc
                        </Button>
                    ) : undefined,
                }}
                hasRows={visibleEquipment.length > 0}
                empty={
                    <ScreenState
                        icon={Package}
                        title={isFiltered ? 'Aucun équipement ne correspond' : 'Aucun équipement ici'}
                        description={
                            isFiltered
                                ? 'Élargissez la recherche, ou revenez à la totalité du parc.'
                                : 'Ce périmètre n’a encore aucun actif rattaché.'
                        }
                        actions={
                            isFiltered ? (
                                <Button variant="filled" onClick={clearAllListFilters}>
                                    {`Voir les ${accessibleEquipment.length} équipements`}
                                </Button>
                            ) : isManager ? (
                                <Button variant="filled" onClick={() => onViewChange('add_equipment')}>
                                    Ajouter un équipement
                                </Button>
                            ) : undefined
                        }
                    />
                }
                footer={
                    isManager
                        ? visibleEquipment.length > 0
                            ? visibleEquipment.length === accessibleEquipment.length &&
                              filteredEquipment.length === accessibleEquipment.length
                                ? `Les ${accessibleEquipment.length} actifs du parc.`
                                : undefined
                            : undefined
                        : hasPendingConfirmation
                          ? 'Un équipement en attente de votre confirmation.'
                          : `${userEquipment.length} équipement${userEquipment.length > 1 ? 's' : ''} sous votre responsabilité.`
                }
                /* La barre du bas fait 56 px : le bouton flottant se pose au-dessus,
                   jamais dessus — la planche le place à 76 px du bas. */
                fab={
                    isManager && !selection.isActive ? (
                        <FabContainer description="Ajouter un équipement" className="bottom-[76px] right-5 compact:bottom-[76px]">
                            <button
                                type="button"
                                aria-label="Ajouter un équipement"
                                className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-[0_4px_14px_rgba(10,25,29,0.22)] transition-transform active:scale-95 cursor-pointer"
                                onClick={() => setIsAddSheetOpen(true)}
                            >
                                <Icon glyph={Plus} size={24} />
                            </button>
                        </FabContainer>
                    ) : undefined
                }
            >
                {visibleEquipment.map((item) => {
                    if (!isManager) {
                        // Vue Utilisateur final (Colonne 3)
                        const isRep = item.status === 'En réparation';
                        const isPending = item.assignmentStatus === 'PENDING_CONFIRMATION';

                        const userStatus = isRep
                            ? {
                                  label: `En réparation · ${getDaysSince(item.repairStartDate || item.updatedAt)} j`,
                                  icon: Warning,
                                  tone: 'attention' as const,
                              }
                            : isPending
                              ? {
                                    label: 'Réception à confirmer',
                                    icon: Clock,
                                    tone: 'pending' as const,
                                }
                              : {
                                    label: `Depuis le ${formatDate(item.confirmedAt || item.updatedAt)}`,
                                    icon: ArrowCircleRight,
                                    tone: 'info' as const,
                                };

                        return (
                            <ListRow
                                key={item.id}
                                vignette={
                                    item.image ? (
                                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <Icon glyph={Package} size={20} />
                                    )
                                }
                                title={item.name}
                                type={getCategoryLabel(item.type)}
                                status={userStatus}
                                holder=""
                                reference=""
                                onOpen={() => onEquipmentClick?.(item.id)}
                            />
                        );
                    }

                    // Vue Gestionnaire (Colonnes 2 et 4)
                    const status = getStatusPresentation(
                        getDisplayedEquipmentStatus({
                            status: item.status,
                            assignmentStatus: item.assignmentStatus,
                        })
                    );

                    const holderText =
                        item.status === 'En réparation'
                            ? `En réparation · ${getDaysSince(item.repairStartDate || item.updatedAt)} j`
                            : item.user?.name
                              ? item.user.name
                              : item.site || 'Disponible';

                    return (
                        <ListRow
                            key={item.id}
                            vignette={
                                item.image ? (
                                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <Icon glyph={Package} size={20} />
                                )
                            }
                            title={item.name}
                            type={getCategoryLabel(item.type)}
                            status={status}
                            holder={holderText}
                            reference={item.assetId}
                            onOpen={() => onEquipmentClick?.(item.id)}
                            selectionActive={selection.isActive}
                            selected={selection.isSelected(item.id)}
                            onToggle={() => selection.toggle(item.id)}
                            onLongPress={() => selection.enter(item.id)}
                        />
                    );
                })}

                {isManager && visibleEquipment.length < filteredEquipment.length && (
                    <Button
                        variant="text"
                        icon={<Icon glyph={CaretDown} size={18} />}
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        className="w-full justify-center rounded-none border-t border-outline-variant px-0 text-on-surface"
                    >
                        Charger la suite
                    </Button>
                )}

                {/* Feuille montante Filtrer (Planche 04.1) */}
                <BottomSheet
                    open={isFilterSheetOpen}
                    onClose={() => setIsFilterSheetOpen(false)}
                    title="Filtrer"
                >
                    <div className="flex flex-col gap-4 px-5 py-3">
                        <div>
                            <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Famille</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {FAMILIES.map((family) => (
                                    <button
                                        key={family}
                                        type="button"
                                        onClick={() => {
                                            setFamilyFilter(family);
                                            setTypeFilter('');
                                        }}
                                        className={`flex min-h-10 items-center rounded-md px-3 text-body-medium font-medium transition-colors ${
                                            familyFilter === family
                                                ? 'bg-inverse-surface text-inverse-on-surface'
                                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                        }`}
                                    >
                                        {family}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {familyFilter !== 'Toutes' && availableTypesForFamily.length > 0 && (
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Type</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTypeFilter('')}
                                        className={`flex min-h-10 items-center rounded-md px-3 text-body-medium font-medium transition-colors ${
                                            !typeFilter
                                                ? 'bg-inverse-surface text-inverse-on-surface'
                                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                        }`}
                                    >
                                        Tous les types
                                    </button>
                                    {availableTypesForFamily.map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTypeFilter(type)}
                                            className={`flex min-h-10 items-center rounded-md px-3 text-body-medium font-medium transition-colors ${
                                                typeFilter === type
                                                    ? 'bg-inverse-surface text-inverse-on-surface'
                                                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                            }`}
                                        >
                                            {getCategoryLabel(type)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Emplacement</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {availableLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => setLocationFilter(loc)}
                                        className={`flex min-h-10 items-center rounded-md px-3 text-body-medium font-medium transition-colors ${
                                            locationFilter === loc
                                                ? 'bg-inverse-surface text-inverse-on-surface'
                                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] font-medium tracking-wider text-text-secondary uppercase">Ajouté</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {PERIODS.map((period) => (
                                    <button
                                        key={period}
                                        type="button"
                                        onClick={() => setPeriodFilter(period)}
                                        className={`flex min-h-10 items-center rounded-md px-3 text-body-medium font-medium transition-colors ${
                                            periodFilter === period
                                                ? 'bg-inverse-surface text-inverse-on-surface'
                                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                                        }`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant pt-3">
                            <Button variant="ghost" onClick={handleClearAllSheetFilters}>
                                Tout effacer
                            </Button>
                            <Button
                                variant="tonal"
                                className="flex-1 bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
                                onClick={() => setIsFilterSheetOpen(false)}
                            >
                                Voir les {filteredEquipment.length} équipements
                            </Button>
                        </div>
                    </div>
                </BottomSheet>

                {/* Feuille montante Nouvel équipement (Planche 04.1) */}
                <BottomSheet
                    open={isAddSheetOpen}
                    onClose={() => setIsAddSheetOpen(false)}
                    title="Nouvel équipement"
                >
                    <div className="flex flex-col gap-1 py-2">
                        <button
                            type="button"
                            className="flex min-h-16 items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface-container"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                setIsScanning(true);
                                setScanHit(null);
                            }}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
                                <Icon glyph={Scan} size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-medium text-on-surface">Scanner l’étiquette</p>
                                <p className="text-body-small text-on-surface-variant">le code et le type sont lus sur l’objet</p>
                            </div>
                            <Icon glyph={CaretDown} size={18} className="-rotate-90 text-on-surface-variant" />
                        </button>

                        <button
                            type="button"
                            className="flex min-h-16 items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface-container"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                onViewChange('add_equipment');
                            }}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
                                <Icon glyph={Keyboard} size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-medium text-on-surface">Saisir la fiche</p>
                                <p className="text-body-small text-on-surface-variant">type, code, emplacement, numéro de série</p>
                            </div>
                            <Icon glyph={CaretDown} size={18} className="-rotate-90 text-on-surface-variant" />
                        </button>

                        <button
                            type="button"
                            className="flex min-h-16 items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface-container"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                onViewChange('import_equipment');
                            }}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
                                <Icon glyph={Package} size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-medium text-on-surface">Importer une livraison</p>
                                <p className="text-body-small text-on-surface-variant">plusieurs actifs identiques d’un coup</p>
                            </div>
                            <Icon glyph={CaretDown} size={18} className="-rotate-90 text-on-surface-variant" />
                        </button>

                        <p className="mt-2 border-t border-outline-variant px-5 pt-3 text-body-small text-on-surface-variant">
                            Proposition — le formulaire de création est un écran à part.
                        </p>
                    </div>
                </BottomSheet>

                {isScanning && (
                    <div className="fixed inset-0 z-50 bg-[var(--tk-color-inverse-surface)]">
                        <ScanView
                            mode="simple"
                            onClose={() => setIsScanning(false)}
                            tip="Cadrez l’étiquette collée sur l’objet. Code-barres ou QR, le viseur s’ajuste seul."
                            hit={scanHit}
                            acceptLabel="Ouvrir la fiche"
                            onAccept={(hit) => {
                                setIsScanning(false);
                                const found = accessibleEquipment.find(
                                    (item) =>
                                        item.assetId.toLowerCase() === hit.code.toLowerCase() ||
                                        item.serialNumber?.toLowerCase() === hit.code.toLowerCase()
                                );
                                if (found) {
                                    onEquipmentClick?.(found.id);
                                }
                            }}
                            onRetry={() => setScanHit(null)}
                            onManualEntry={() => {
                                setIsScanning(false);
                            }}
                        />
                    </div>
                )}
            </ListTemplate>
        </>
    );
};

export default InventoryPage;
