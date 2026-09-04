import React, { useEffect, useMemo, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    ArrowCircleRight,
    CaretDown,
    Clock,
    FileCsv,
    Keyboard,
    Package,
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
import FilterButton from '../../../components/ui/FilterButton';
import FacetChip from '../../../components/ui/FacetChip';
import ListRow from '../../../components/ui/ListRow';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { FabContainer } from '../../../components/ui/FabContainer';
import FloatingActionButton from '../../../components/ui/FloatingActionButton';
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
 *
 * ## Ce que la passe sobre du 02/09 déplace
 *
 * **Les états quittent la bande et deviennent le premier groupe du filtre.** La
 * planche ne dessine plus de rangée de pastilles sous la recherche : `.chips` reste
 * déclaré dans sa feuille de style et n'est employé nulle part. Les quatre états —
 * avec leurs comptes — ouvrent la feuille « Filtrer », et **c'est la ligne du
 * décompte qui nomme ce qu'on voit** (« 14 actifs · tous les états », « 2 actifs ·
 * en réparation »). Une pastille posée n'était lisible qu'en haut de la liste ;
 * la ligne du décompte, elle, tient la phrase entière.
 *
 * **L'arrivée pré-filtrée perd son bandeau.** La colonne « depuis le tableau de
 * bord » de la planche ne porte ni jeton ni provenance : le filtre se dit par la
 * pastille de l'entonnoir, par le décompte qui le nomme, et par la sortie en pied
 * de liste — « Voir les 14 actifs du parc ». Trois marques valent mieux qu'un
 * quatrième bandeau au-dessus de la liste.
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

/**
 * `.sh` + `.sgrp` de la planche : le libellé du groupe en **12 sur 16**, capitales
 * espacées de 6 %, encre tertiaire — puis ses pastilles, gouttière 8, sur deux
 * lignes s'il le faut. Le libellé était deux crans trop sombre et sans sa mesure.
 */
const SheetGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div>
        <p className="text-text-tertiary text-[12px] leading-4 tracking-[0.06em] uppercase">
            {label}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
);

/**
 * `.si.big` — une des trois routes de la feuille d'ajout. La planche donne 64 de
 * haut, 6 px d'intérieur vertical, gouttière 14, une vignette de 40 au rayon 6, un
 * titre de **16 sur 24 en chasse normale** et son explication en 14 sur 20.
 */
const AddRoute: React.FC<{
    glyph: PhosphorGlyph;
    title: string;
    detail: string;
    onClick: () => void;
}> = ({ glyph, title, detail, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="hover:bg-surface-container flex min-h-16 items-center gap-3.5 px-5 py-1.5 text-left transition-colors"
    >
        <span className="rounded-vignette bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center">
            <Icon glyph={glyph} size={20} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="text-on-surface block text-[16px] leading-6">{title}</span>
            <span className="text-text-muted block text-[14px] leading-5">{detail}</span>
        </span>
        <Icon glyph={CaretDown} size={18} className="text-text-tertiary shrink-0 -rotate-90" />
    </button>
);

interface InventoryPageProps {
    onViewChange: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
    onUserClick?: (id: string) => void;
    initialStatus?: string | null;
    /** Le site reçu d'un autre écran — la fiche d'un site renvoie ici, filtrée (10.1, C2). */
    initialSite?: string | null;
}

const InventoryPage: React.FC<InventoryPageProps> = ({
    onViewChange,
    onEquipmentClick,
    initialStatus,
    initialSite,
}) => {
    const { equipment, users, deleteEquipment } = useData();
    const { currentUser } = useAuth();
    const { filterEquipment, permissions } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const isManager = permissions.canManageInventory;

    const accessibleEquipment = useMemo(
        () => filterEquipment(equipment, users),
        [equipment, users, filterEquipment],
    );

    // Équipements de l'utilisateur connecté (pour la vue « Mes équipements »)
    const userEquipment = useMemo(() => {
        if (!currentUser) return [];
        return accessibleEquipment.filter(
            (item) => item.user?.id === currentUser.id || item.user?.name === currentUser.name,
        );
    }, [accessibleEquipment, currentUser]);

    const [searchQuery, setSearchQuery] = useState(
        () => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '',
    );
    const [statusFilter, setStatusFilter] = useState(
        () => initialStatus || sessionStorage.getItem(STORAGE_KEY_STATUS) || '',
    );
    /** Vrai tant qu'on n'a pas quitté le filtre reçu d'un autre écran. */
    const [arrivedFiltered, setArrivedFiltered] = useState(() =>
        Boolean(initialStatus || initialSite),
    );
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
    const [locationFilter, setLocationFilter] = useState<string>(() => initialSite || 'Tous');
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
                    .map((item) => item.type),
            ),
        ).sort((left, right) =>
            getCategoryLabel(left).localeCompare(getCategoryLabel(right), 'fr'),
        );
    }, [accessibleEquipment, familyFilter]);

    /* L'état est entré dans la feuille : il compte donc dans la pastille de
       l'entonnoir. C'est elle qui porte le « 1 » de la colonne « arrivée
       pré-filtrée » de la planche, là où le bandeau le disait avant. */
    const activeSheetFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter) count += 1;
        if (familyFilter !== 'Toutes') count += 1;
        if (typeFilter) count += 1;
        if (locationFilter !== 'Tous') count += 1;
        if (periodFilter !== 'Toute période') count += 1;
        return count;
    }, [statusFilter, familyFilter, typeFilter, locationFilter, periodFilter]);

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
                const itemYear = new Date(
                    item.financial?.purchaseDate || item.updatedAt,
                ).getFullYear();
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
                getCategoryLabel(a.type).localeCompare(getCategoryLabel(b.type), 'fr'),
            );
        }
        if (activeSort === 'status') {
            return [...list].sort((a, b) => a.status.localeCompare(b.status));
        }
        if (activeSort === 'oldest') {
            return [...list].sort(
                (a, b) =>
                    new Date(a.financial?.purchaseDate || a.updatedAt).getTime() -
                    new Date(b.financial?.purchaseDate || b.updatedAt).getTime(),
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
        [filteredEquipment, visibleCount],
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

    const selectedEquipment = useMemo(
        () => filteredEquipment.filter((item) => selection.isSelected(item.id)),
        [filteredEquipment, selection],
    );

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
            'Hostname',
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

        const csvContent = [buildCsvLine(headers), ...rows.map((row) => buildCsvLine(row))].join(
            '\n',
        );
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

        /* C1 — sur une sélection à un, la question porte le nom de l'objet ; « cet
           équipement » oblige à refermer la feuille pour savoir lequel. */
        const soleTarget =
            ids.length === 1 ? equipment.find((item) => item.id === ids[0]) : undefined;

        requestConfirmation({
            title: soleTarget
                ? `Sortir ${soleTarget.name} du parc ?`
                : `Sortir ${ids.length} équipements du parc ?`,
            message: (
                <>
                    {soleTarget ? 'Il quitte' : 'Ils quittent'} l’inventaire et les rapports.{' '}
                    <strong className="text-on-surface font-medium">
                        Leur historique est conservé
                    </strong>{' '}
                    et reste consultable depuis le journal d’audit.
                    {soleTarget ? '' : ' Les équipements en cours d’attribution sont ignorés.'}
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
                    showToast(`${blocked} équipement(s) au statut non compatible.`, 'warning');
                }
            },
        });
    };

    const clearArrivalFilter = () => {
        setStatusFilter('');
        setLocationFilter('Tous');
        setArrivedFiltered(false);
        setSortIndex(DEFAULT_SORT_INDEX);
    };

    const handleClearAllSheetFilters = () => {
        setStatusFilter('');
        setFamilyFilter('Toutes');
        setTypeFilter('');
        setLocationFilter('Tous');
        setPeriodFilter('Toute période');
        setArrivedFiltered(false);
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
        periodFilter !== 'Toute période',
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
                            className="text-on-surface hover:bg-surface-container flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
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
                        <FilterButton
                            onClick={() => setIsFilterSheetOpen(true)}
                            count={activeSheetFiltersCount}
                        />
                    ) : undefined
                }
                origin={
                    /* **La planche ne dessine plus de bandeau d'arrivée.** Sa colonne
                       « arrivée pré-filtrée depuis le tableau de bord » ne porte ni
                       jeton ni provenance : elle montre la pastille sur l'entonnoir,
                       la ligne du décompte qui nomme le filtre, et cette sortie en
                       pied de liste — qui **nomme sa destination**, jamais « effacer
                       les filtres ». Le bandeau faisait une quatrième marque pour la
                       même chose, au-dessus des rangées qu'on est venu lire. */
                    arrivedFiltered && (statusFilter || (initialSite && locationFilter !== 'Tous'))
                        ? {
                              token: statusFilter ? getStatusLabel(statusFilter) : locationFilter,
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
                              total: filteredEquipment.length,
                              shown: visibleEquipment.length,
                              /* « 14 actifs · tous les états », « 2 actifs · en
                                 réparation » : la ligne du décompte **nomme ce qu'on
                                 voit**, puisque plus aucune pastille ne le dit. */
                              noun: statusFilter
                                  ? `actifs · ${getStatusLabel(statusFilter).toLowerCase()}`
                                  : 'actifs · tous les états',
                          }
                        : undefined
                }
                sort={
                    isManager
                        ? {
                              label: SORT_OPTIONS[sortIndex].label,
                              onClick: () =>
                                  setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length),
                          }
                        : undefined
                }
                selection={{
                    active: selection.isActive,
                    count: selection.count,
                    total: filteredEquipment.length,
                    onExit: selection.exit,
                    onSelectAll: () =>
                        selection.selectAll(filteredEquipment.map((item) => item.id)),
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
                        title={
                            isFiltered ? 'Aucun équipement ne correspond' : 'Aucun équipement ici'
                        }
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
                                <Button
                                    variant="filled"
                                    onClick={() => onViewChange('add_equipment')}
                                >
                                    Ajouter un équipement
                                </Button>
                            ) : undefined
                        }
                    />
                }
                /* La barre du bas fait 56 px : le bouton flottant se pose au-dessus,
                   jamais dessus — la planche le place à 76 px du bas. */
                fab={
                    /* 17.6 — **le bouton du geste d'ajout est un composant, pas une
                       copie.** Il était réécrit à la main ici et sur l'autre liste, à
                       deux fichiers de distance, et les deux copies avaient déjà
                       divergé : deux jetons de texte pour le même contraste, et un
                       ancrage retapé par-dessus celui du conteneur. L'ancrage se
                       calcule une fois — 56 de barre + 20 de gouttière — et il vit
                       dans `FabContainer`. La feuille, elle, reste à la page : ses
                       rangées portent une explication que 17.6 ne dessine pas. */
                    isManager && !selection.isActive ? (
                        <FabContainer description="Ajouter un équipement">
                            <FloatingActionButton
                                icon="add"
                                size="medium"
                                variant="primary"
                                className="bg-primary text-on-primary"
                                aria-label="Ajouter un équipement"
                                onClick={() => setIsAddSheetOpen(true)}
                            />
                        </FabContainer>
                    ) : undefined
                }
            >
                {visibleEquipment.map((item) => {
                    if (!isManager) {
                        // Vue Utilisateur final (Colonne 3)
                        const isRep = item.status === 'En réparation';
                        const isPending = item.assignmentStatus === 'PENDING_DELIVERY';
                        const repairDays = getDaysSince(item.repairStartDate || item.updatedAt);
                        /* « Depuis le — » : la fiche n'a ni confirmation ni dernier
                           mouvement. La planche n'écrit jamais une date absente ;
                           sans date, la rangée dit l'état, qui reste vrai. */
                        const sinceDate = formatDate(item.confirmedAt || item.updatedAt);

                        const userStatus = isRep
                            ? {
                                  label:
                                      repairDays > 0
                                          ? `En réparation · ${repairDays} j`
                                          : 'En réparation',
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
                                    label:
                                        sinceDate === '—' ? 'Attribué' : `Depuis le ${sinceDate}`,
                                    icon: ArrowCircleRight,
                                    tone: 'info' as const,
                                };

                        return (
                            <ListRow
                                key={item.id}
                                vignette={
                                    item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
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
                        }),
                    );

                    /* **La seconde ligne dit chez qui, ou l'état.** La planche écrit
                       « Disponible » sous le code d'un actif libre — pas son site :
                       un actif disponible à Paris se lit d'abord *disponible*, et le
                       site n'ajoute rien qu'on soit venu chercher. Le porteur prend
                       la place dès qu'il existe, et un local en tient lieu quand
                       l'objet est attribué à une pièce (« Salle serveurs »). */
                    const repairDays = getDaysSince(item.repairStartDate || item.updatedAt);
                    const holderText =
                        item.status === 'En réparation'
                            ? repairDays > 0
                                ? `En réparation · ${repairDays} j`
                                : 'En réparation'
                            : (item.user?.name ??
                              (item.status === 'Attribué' ? item.site : undefined) ??
                              status.label);

                    return (
                        <ListRow
                            key={item.id}
                            vignette={
                                item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
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
                    /* `.more` : 48 de haut, un filet au-dessus, **15 en 500** sur
                       l'encre pleine, chevron 18 sur l'encre secondaire. */
                    <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        className="border-outline-variant text-on-surface hover:bg-surface-container flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 border-t text-[15px] font-medium transition-colors"
                    >
                        <Icon glyph={CaretDown} size={18} className="text-text-muted" />
                        Charger la suite
                    </button>
                )}

                {/* Feuille montante Filtrer (Planche 04.1) — quatre groupes, dans
                    l'ordre de la planche : État, Famille, Emplacement, Ajouté. */}
                <BottomSheet
                    open={isFilterSheetOpen}
                    onClose={() => setIsFilterSheetOpen(false)}
                    title="Filtrer"
                >
                    <div className="flex flex-col gap-4">
                        {/* **Le premier groupe du filtre, et il porte les comptes.**
                            C'est le déplacement de la passe sobre : les états ne
                            vivent plus en pastilles sous la recherche. */}
                        <SheetGroup label="État">
                            {facets.map((facet) => (
                                <FacetChip
                                    key={facet.id}
                                    label={facet.label}
                                    count={facet.count}
                                    icon={facet.icon}
                                    tone={facet.tone}
                                    selected={
                                        facet.id === 'tous'
                                            ? !statusFilter
                                            : facet.id === statusFilter
                                    }
                                    onClick={() => {
                                        setStatusFilter(facet.id === 'tous' ? '' : facet.id);
                                        if (arrivedFiltered) setSortIndex(DEFAULT_SORT_INDEX);
                                        setArrivedFiltered(false);
                                    }}
                                />
                            ))}
                        </SheetGroup>

                        <SheetGroup label="Famille">
                            {FAMILIES.map((family) => (
                                <FacetChip
                                    key={family}
                                    label={family}
                                    selected={familyFilter === family}
                                    onClick={() => {
                                        setFamilyFilter(family);
                                        setTypeFilter('');
                                    }}
                                />
                            ))}
                        </SheetGroup>

                        {familyFilter !== 'Toutes' && availableTypesForFamily.length > 0 && (
                            <SheetGroup label="Type">
                                <FacetChip
                                    label="Tous les types"
                                    selected={!typeFilter}
                                    onClick={() => setTypeFilter('')}
                                />
                                {availableTypesForFamily.map((type) => (
                                    <FacetChip
                                        key={type}
                                        label={getCategoryLabel(type)}
                                        selected={typeFilter === type}
                                        onClick={() => setTypeFilter(type)}
                                    />
                                ))}
                            </SheetGroup>
                        )}

                        <SheetGroup label="Emplacement">
                            {availableLocations.map((loc) => (
                                <FacetChip
                                    key={loc}
                                    label={loc}
                                    selected={locationFilter === loc}
                                    onClick={() => setLocationFilter(loc)}
                                />
                            ))}
                        </SheetGroup>

                        <SheetGroup label="Ajouté">
                            {PERIODS.map((period) => (
                                <FacetChip
                                    key={period}
                                    label={period}
                                    selected={periodFilter === period}
                                    onClick={() => setPeriodFilter(period)}
                                />
                            ))}
                        </SheetGroup>

                        {/* `.sfoot` — **deux colonnes égales**, filet au-dessus. Le
                            « voir » nomme son nombre ; il ne dit pas « appliquer ». */}
                        <div className="border-outline-variant mt-2 grid grid-cols-2 gap-3 border-t pt-4">
                            <Button variant="ghost" onClick={handleClearAllSheetFilters}>
                                Tout effacer
                            </Button>
                            <Button
                                variant="tonal"
                                className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
                                onClick={() => setIsFilterSheetOpen(false)}
                            >
                                Voir les {filteredEquipment.length}
                            </Button>
                        </div>
                    </div>
                </BottomSheet>

                {/* Feuille montante Nouvel équipement (Planche 04.1) — `.si.big` :
                    64 de haut, vignette 40 au rayon 6, titre 16 sur 24 **sans
                    graisse d'appui**, explication 14 sur 20 sur l'encre secondaire.
                    Le titre était en 500 et l'explication deux crans trop petite. */}
                <BottomSheet
                    open={isAddSheetOpen}
                    onClose={() => setIsAddSheetOpen(false)}
                    title="Nouvel équipement"
                >
                    <div className="-mx-5 flex flex-col">
                        <AddRoute
                            glyph={Scan}
                            title="Scanner l’étiquette"
                            detail="le code et le type sont lus sur l’objet"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                setIsScanning(true);
                                setScanHit(null);
                            }}
                        />
                        <AddRoute
                            glyph={Keyboard}
                            title="Saisir la fiche"
                            detail="type, code, emplacement, numéro de série"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                onViewChange('add_equipment');
                            }}
                        />
                        {/* 17.6 nomme l'acte « Importer un fichier », et c'est ce que la
                            destination fait : un CSV, une ligne par unité. « Importer une
                            livraison » est l'autre chemin — la file de scan de 04.3,
                            colonne 2 — que la planche laisse encore à spécifier. */}
                        <AddRoute
                            glyph={FileCsv}
                            title="Importer un fichier"
                            detail="une ligne par objet, l’identifiant déduit"
                            onClick={() => {
                                setIsAddSheetOpen(false);
                                onViewChange('import_equipment');
                            }}
                        />
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
                                        item.serialNumber?.toLowerCase() === hit.code.toLowerCase(),
                                );
                                if (found) {
                                    onEquipmentClick?.(found.id);
                                }
                            }}
                            onRetry={() => setScanHit(null)}
                            /* La vue ne décode rien (17.3) : sans cette saisie, le viseur
                               s'ouvrait sur un cadre qui ne pouvait jamais rien lire, et
                               « Saisir à la main » se contentait de le refermer. */
                            onManualSubmit={(code) => {
                                const found = accessibleEquipment.find(
                                    (item) =>
                                        item.assetId.toLowerCase() === code.toLowerCase() ||
                                        item.serialNumber?.toLowerCase() === code.toLowerCase() ||
                                        item.name.toLowerCase() === code.toLowerCase(),
                                );
                                setScanHit({
                                    id: `scan_${Date.now()}`,
                                    code,
                                    detail: found
                                        ? `${found.name} · ${found.model}`
                                        : 'Aucun actif ne porte ce code',
                                    kind: found ? 'expected' : 'exception',
                                });
                            }}
                        />
                    </div>
                )}
            </ListTemplate>
        </>
    );
};

export default InventoryPage;
