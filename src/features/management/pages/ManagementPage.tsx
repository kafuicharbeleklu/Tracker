import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { CATEGORY_ICONS, renderCategoryIcon } from '../../../data/mockData';
import { useData } from '../../../context/DataContext';
import Pagination from '../../../components/ui/Pagination';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { useDebounce } from '../../../hooks/useDebounce';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY, getCategoryLabel } from '../../../constants/glossary';
import Button from '../../../components/ui/Button';
import { ViewType, Category, Model } from '../../../types';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import AddCategoryPage from './AddCategoryPage';
import AddModelPage from './AddModelPage';
import { PageTabs, TabItem } from '../../../components/ui/PageTabs';
import { PageContainer } from '../../../components/layout/PageContainer';
import IconButton from '../../../components/ui/IconButton';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ListActionFab from '../../../components/ui/ListActionFab';

const CATEGORIES_PER_PAGE = 9;
const MODELS_PER_PAGE = 10;
type ManagementTab = 'categories' | 'models';
type CategorySortValue = 'name-asc' | 'name-desc' | 'depreciation-asc' | 'depreciation-desc';
type CategoryMethodFilter = '' | 'linear' | 'degressive';

interface ManagementPageProps {
    onCategoryClick?: (id: string) => void;
    onModelClick?: (id: string) => void;
    onViewChange?: (view: ViewType) => void;
    /** Lien profond /management/{categories|models}/add : modale ouverte au rendu. */
    initialAddModal?: 'category' | 'model';
}

const ManagementPage: React.FC<ManagementPageProps> = ({
    onCategoryClick,
    onModelClick,
    onViewChange,
    initialAddModal,
}) => {
    const { equipment, categories, models, addCategory, deleteCategory, deleteModel } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const [activeTab, setActiveTab] = useState<ManagementTab>('categories');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [categorySort, setCategorySort] = useState<CategorySortValue>('name-asc');
    const [categoryMethodFilter, setCategoryMethodFilter] = useState<CategoryMethodFilter>('');
    const [modelTypeFilter, setModelTypeFilter] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const isCompact = useMediaQuery(MEDIA.compact);
    const categoryImportInputRef = useRef<HTMLInputElement | null>(null);

    // Modals state
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [modelToEdit, setModelToEdit] = useState<Model | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (initialAddModal === 'category') {
            setActiveTab('categories');
            setCategoryToEdit(null);
            setIsCategoryModalOpen(true);
        } else if (initialAddModal === 'model') {
            setActiveTab('models');
            setModelToEdit(null);
            setIsModelModalOpen(true);
        }
    }, [initialAddModal]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, debouncedSearch, categorySort, categoryMethodFilter, modelTypeFilter]);

    useEffect(() => {
        setSelectionMode(false);
        setSelectedCategoryIds([]);
        setSelectedModelIds([]);
    }, [activeTab]);

    const filteredModels = useMemo(() => {
        return models.filter((model) => {
            const query = debouncedSearch.toLowerCase();
            const typeLabel = getCategoryLabel(model.type).toLowerCase();
            const matchesSearch = model.name.toLowerCase().includes(query)
                || model.type.toLowerCase().includes(query)
                || typeLabel.includes(query)
                || (model.brand || '').toLowerCase().includes(query);
            const matchesType = modelTypeFilter === '' || model.type === modelTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [models, debouncedSearch, modelTypeFilter]);

    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const query = debouncedSearch.toLowerCase();
            const displayName = getCategoryLabel(category.name).toLowerCase();
            const inName = category.name.toLowerCase().includes(query);
            const inDisplayName = displayName.includes(query);
            const inDescription = (category.description || '').toLowerCase().includes(query);
            const matchesMethod = categoryMethodFilter === '' || category.defaultDepreciation?.method === categoryMethodFilter;
            return (inName || inDisplayName || inDescription) && matchesMethod;
        });
    }, [categories, debouncedSearch, categoryMethodFilter]);

    const sortedCategories = useMemo(() => {
        const categoryList = [...filteredCategories];

        categoryList.sort((a, b) => {
            if (categorySort === 'name-asc') return a.name.localeCompare(b.name, 'fr');
            if (categorySort === 'name-desc') return b.name.localeCompare(a.name, 'fr');
            if (categorySort === 'depreciation-asc') return (a.defaultDepreciation?.years ?? 0) - (b.defaultDepreciation?.years ?? 0);
            return (b.defaultDepreciation?.years ?? 0) - (a.defaultDepreciation?.years ?? 0);
        });

        return categoryList;
    }, [filteredCategories, categorySort]);

    const modelTypeOptions = useMemo(() => {
        return Array.from(new Set(models.map((model) => model.type)))
            .sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'fr'))
            .map((type) => ({ value: type, label: getCategoryLabel(type) }));
    }, [models]);

    const totalCategoryPages = useMemo(() => Math.ceil(sortedCategories.length / CATEGORIES_PER_PAGE), [sortedCategories]);
    const paginatedCategories = useMemo(
        () => sortedCategories.slice((currentPage - 1) * CATEGORIES_PER_PAGE, currentPage * CATEGORIES_PER_PAGE),
        [sortedCategories, currentPage]
    );

    const totalModelPages = useMemo(() => Math.ceil(filteredModels.length / MODELS_PER_PAGE), [filteredModels]);
    const paginatedModels = useMemo(
        () => filteredModels.slice((currentPage - 1) * MODELS_PER_PAGE, currentPage * MODELS_PER_PAGE),
        [filteredModels, currentPage]
    );

    useEffect(() => {
        setSelectedCategoryIds((prev) => {
            const visibleIds = new Set(sortedCategories.map((category) => category.id));
            const next = prev.filter((id) => visibleIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [sortedCategories]);

    useEffect(() => {
        setSelectedModelIds((prev) => {
            const visibleIds = new Set(filteredModels.map((model) => model.id));
            const next = prev.filter((id) => visibleIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [filteredModels]);

    useEffect(() => {
        if (!selectionMode) {
            setSelectedCategoryIds([]);
            setSelectedModelIds([]);
        }
    }, [selectionMode]);

    useEffect(() => {
        const maxPages = activeTab === 'categories' ? totalCategoryPages : totalModelPages;
        if (maxPages > 0 && currentPage > maxPages) {
            setCurrentPage(maxPages);
        }
    }, [activeTab, currentPage, totalCategoryPages, totalModelPages]);

    // --- Category Actions ---
    const handleOpenAddCategory = () => {
        setCategoryToEdit(null);
        setIsCategoryModalOpen(true);
    };

    const handleOpenEditCategory = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        setCategoryToEdit(cat);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        const count = equipment.filter(e => e.type === cat.name).length;
        if (count > 0) {
            showToast(`Impossible : ${count} actifs sont encore liés à cette catégorie.`, 'error');
            return;
        }

        requestConfirmation({
            title: "Supprimer la catégorie",
            message: `Êtes-vous certain de vouloir supprimer la catégorie "${cat.name}" ? Cette action est irréversible.`,
            variant: 'danger',
            confirmKeyword: "SUPPRIMER",
            confirmText: "Supprimer définitivement",
            onConfirm: () => {
                if (deleteCategory(cat.id)) {
                    showToast(`Catégorie "${cat.name}" supprimée`, 'success');
                }
            }
        });
    };

    // --- Model Actions ---
    const handleOpenAddModel = () => {
        setModelToEdit(null);
        setIsModelModalOpen(true);
    };

    const handleOpenEditModel = (e: React.MouseEvent, model: Model) => {
        e.stopPropagation();
        setModelToEdit(model);
        setIsModelModalOpen(true);
    };

    const handleDeleteModel = (e: React.MouseEvent, model: Model) => {
        e.stopPropagation();
        const count = equipment.filter(e => e.model === model.name).length;
        if (count > 0) {
            showToast(`Impossible : ${count} actifs sont encore liés à ce modèle.`, 'error');
            return;
        }

        requestConfirmation({
            title: "Supprimer le modèle",
            message: `Êtes-vous certain de vouloir supprimer le modèle "${model.name}" ? Cette action est irréversible.`,
            variant: 'danger',
            confirmKeyword: "SUPPRIMER",
            confirmText: "Supprimer définitivement",
            onConfirm: () => {
                if (deleteModel(model.id)) {
                    showToast(`Modèle "${model.name}" supprimé`, 'success');
                }
            }
        });
    };

    const selectedCategorySet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);
    const selectedModelSet = useMemo(() => new Set(selectedModelIds), [selectedModelIds]);
    const pageCategoryIds = useMemo(() => paginatedCategories.map((category) => category.id), [paginatedCategories]);
    const pageModelIds = useMemo(() => paginatedModels.map((model) => model.id), [paginatedModels]);

    const selectedCategories = useMemo(
        () => sortedCategories.filter((category) => selectedCategorySet.has(category.id)),
        [sortedCategories, selectedCategorySet],
    );
    const selectedModels = useMemo(
        () => filteredModels.filter((model) => selectedModelSet.has(model.id)),
        [filteredModels, selectedModelSet],
    );

    const allVisibleCategoriesSelected = pageCategoryIds.length > 0 && pageCategoryIds.every((id) => selectedCategorySet.has(id));
    const someVisibleCategoriesSelected = pageCategoryIds.some((id) => selectedCategorySet.has(id));
    const allVisibleModelsSelected = pageModelIds.length > 0 && pageModelIds.every((id) => selectedModelSet.has(id));
    const someVisibleModelsSelected = pageModelIds.some((id) => selectedModelSet.has(id));

    const toggleCategorySelection = (id: string, checked: boolean) => {
        setSelectedCategoryIds((prev) => {
            if (checked) {
                if (prev.includes(id)) return prev;
                return [...prev, id];
            }
            return prev.filter((entry) => entry !== id);
        });
    };

    const toggleModelSelection = (id: string, checked: boolean) => {
        setSelectedModelIds((prev) => {
            if (checked) {
                if (prev.includes(id)) return prev;
                return [...prev, id];
            }
            return prev.filter((entry) => entry !== id);
        });
    };

    const toggleVisibleSelection = (checked: boolean) => {
        if (activeTab === 'categories') {
            setSelectedCategoryIds((prev) => {
                const next = new Set(prev);
                pageCategoryIds.forEach((id) => {
                    if (checked) next.add(id);
                    else next.delete(id);
                });
                return Array.from(next);
            });
            return;
        }

        setSelectedModelIds((prev) => {
            const next = new Set(prev);
            pageModelIds.forEach((id) => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return Array.from(next);
        });
    };

    const handleDeleteSelectedCategories = () => {
        if (selectedCategoryIds.length === 0) return;

        requestConfirmation({
            title: 'Supprimer la sélection',
            message: `Supprimer ${selectedCategoryIds.length} catégorie(s) sélectionnée(s) ?`,
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;

                selectedCategoryIds.forEach((id) => {
                    const category = categories.find((entry) => entry.id === id);
                    if (!category) return;

                    const usedCount = equipment.filter((item) => item.type === category.name).length;
                    if (usedCount > 0) {
                        blocked += 1;
                        return;
                    }

                    if (deleteCategory(id)) deleted += 1;
                });

                setSelectedCategoryIds([]);

                if (deleted > 0) showToast(`${deleted} catégorie(s) supprimée(s).`, 'success');
                if (blocked > 0) showToast(`${blocked} catégorie(s) n'ont pas été supprimées (actifs liés).`, 'warning');
            },
        });
    };

    const handleDeleteSelectedModels = () => {
        if (selectedModelIds.length === 0) return;

        requestConfirmation({
            title: 'Supprimer la sélection',
            message: `Supprimer ${selectedModelIds.length} modèle(s) sélectionné(s) ?`,
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;

                selectedModelIds.forEach((id) => {
                    const model = models.find((entry) => entry.id === id);
                    if (!model) return;

                    const usedCount = equipment.filter((item) => item.model === model.name).length;
                    if (usedCount > 0) {
                        blocked += 1;
                        return;
                    }

                    if (deleteModel(id)) deleted += 1;
                });

                setSelectedModelIds([]);

                if (deleted > 0) showToast(`${deleted} modèle(s) supprimé(s).`, 'success');
                if (blocked > 0) showToast(`${blocked} modèle(s) n'ont pas été supprimés (actifs liés).`, 'warning');
            },
        });
    };

    const escapeCsv = (value: unknown): string => {
        const raw = value === null || value === undefined ? '' : String(value);
        const normalized = raw.replace(/\r?\n/g, ' ').trim();
        if (/[",;]/.test(normalized)) {
            return `"${normalized.replace(/"/g, '""')}"`;
        }
        return normalized;
    };

    const downloadCsv = (filenamePrefix: string, headers: string[], rows: Array<Array<unknown>>) => {
        const csvContent = [
            headers.join(';'),
            ...rows.map((row) => row.map((cell) => escapeCsv(cell)).join(';')),
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const fileDate = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = `${filenamePrefix}-${fileDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportCategories = (itemsToExport = categories) => {
        downloadCsv(
            'categories',
            ['Nom', 'Description', 'Méthode', 'Durée (ans)', 'Valeur résiduelle (%)', 'Icône'],
            itemsToExport.map((category) => [
                getCategoryLabel(category.name),
                category.description || '',
                category.defaultDepreciation?.method || 'linear',
                category.defaultDepreciation?.years ?? 3,
                category.defaultDepreciation?.salvageValuePercent ?? 0,
                category.iconName || 'Laptop',
            ])
        );

        showToast(`${itemsToExport.length} catégorie(s) exportée(s).`, 'success');
    };

    const handleExportModels = (itemsToExport = models) => {
        downloadCsv(
            'modeles',
            ['Nom', 'Type', 'Marque', 'Quantité'],
            itemsToExport.map((model) => [model.name, getCategoryLabel(model.type), model.brand || '', model.count])
        );

        showToast(`${itemsToExport.length} modèle(s) exporté(s).`, 'success');
    };

    const handleTriggerCategoryImport = () => {
        categoryImportInputRef.current?.click();
    };

    const handleCategoryImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        try {
            const content = await file.text();
            const lines = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => Boolean(line));

            if (lines.length === 0) {
                showToast('Le fichier CSV est vide.', 'warning');
                return;
            }

            const existingNames = new Set(categories.map((category) => category.name.toLowerCase()));
            const delimiter = lines[0].includes(';') ? ';' : ',';
            const hasHeader = /nom|catég|categorie/i.test(lines[0]);
            const rows = hasHeader ? lines.slice(1) : lines;

            let createdCount = 0;
            let skippedCount = 0;

            rows.forEach((row) => {
                const values = row.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
                const name = values[0];

                if (!name) {
                    skippedCount += 1;
                    return;
                }

                const normalizedName = name.toLowerCase();
                if (existingNames.has(normalizedName)) {
                    skippedCount += 1;
                    return;
                }

                const method = values[2]?.toLowerCase() === 'degressive' ? 'degressive' : 'linear';
                const years = Number.parseInt(values[3] || '3', 10);
                const salvageValuePercent = Number.parseFloat(values[4] || '0');
                const iconName = values[5] && CATEGORY_ICONS[values[5]] ? values[5] : 'Laptop';

                addCategory({
                    name,
                    description: values[1] || '',
                    icon: CATEGORY_ICONS[iconName],
                    iconName,
                    // Le CSV ne porte pas la colonne : une catégorie importée est attribuable
                    // par défaut, comme celle créée au formulaire.
                    assignable: true,
                    defaultDepreciation: {
                        method,
                        years: Number.isFinite(years) ? Math.max(years, 1) : 3,
                        salvageValuePercent: Number.isFinite(salvageValuePercent)
                            ? Math.min(Math.max(salvageValuePercent, 0), 100)
                            : 0,
                    },
                });

                existingNames.add(normalizedName);
                createdCount += 1;
            });

            if (createdCount > 0) {
                showToast(`${createdCount} catégorie(s) importée(s).`, 'success');
            }

            if (createdCount === 0 && skippedCount > 0) {
                showToast('Aucune nouvelle catégorie importée (doublons ou données invalides).', 'warning');
            }
        } catch {
            showToast("Impossible d'importer ce fichier CSV.", 'error');
        }
    };

    const tabs: TabItem[] = [
        {
            id: 'categories',
            label: 'Catégories',
            icon: <MaterialIcon name="grid_view" />,
            badge: categories.length
        },
        {
            id: 'models',
            label: 'Modèles',
            icon: <MaterialIcon name="inventory_2" />,
            badge: models.length
        }
    ];

    const handleTabChange = (id: string) => {
        if (id === 'categories' || id === 'models') {
            setActiveTab(id);
        }
    };

    const compactActions = (() => {
        const commonActions = [
            {
                id: 'toggle-selection',
                label: selectionMode ? 'Terminer sélection' : 'Mode sélection',
                icon: selectionMode ? 'checklist_rtl' : 'check_box',
                variant: 'outlined' as const,
                onSelect: () => setSelectionMode((prev) => !prev),
            },
        ];

        if (activeTab === 'categories') {
            return [
                ...commonActions,
                {
                    id: 'add-category',
                    label: 'Nouvelle catégorie',
                    icon: 'add',
                    variant: 'filled' as const,
                    onSelect: handleOpenAddCategory,
                },
                {
                    id: 'import-categories',
                    label: 'Importer des catégories',
                    icon: 'upload',
                    variant: 'outlined' as const,
                    onSelect: handleTriggerCategoryImport,
                },
                {
                    id: 'export-categories',
                    label: 'Exporter la liste',
                    icon: 'download',
                    variant: 'outlined' as const,
                    onSelect: () => handleExportCategories(sortedCategories),
                },
                ...(selectionMode && selectedCategoryIds.length > 0 ? [
                    {
                        id: 'export-selected-categories',
                        label: 'Exporter la sélection',
                        icon: 'download',
                        variant: 'outlined' as const,
                        onSelect: () => handleExportCategories(selectedCategories),
                    },
                    {
                        id: 'delete-selected-categories',
                        label: 'Supprimer la sélection',
                        icon: 'delete',
                        variant: 'outlined' as const,
                        onSelect: handleDeleteSelectedCategories,
                    },
                ] : []),
            ];
        }

        return [
            ...commonActions,
            {
                id: 'add-model',
                label: 'Nouveau modèle',
                icon: 'add',
                variant: 'filled' as const,
                onSelect: handleOpenAddModel,
            },
            {
                id: 'import-models',
                label: 'Importer des modèles',
                icon: 'upload',
                variant: 'outlined' as const,
                onSelect: () => onViewChange?.('import_models'),
            },
            {
                id: 'export-models',
                label: 'Exporter la liste',
                icon: 'download',
                variant: 'outlined' as const,
                onSelect: () => handleExportModels(filteredModels),
            },
            ...(selectionMode && selectedModelIds.length > 0 ? [
                {
                    id: 'export-selected-models',
                    label: 'Exporter la sélection',
                    icon: 'download',
                    variant: 'outlined' as const,
                    onSelect: () => handleExportModels(selectedModels),
                },
                {
                    id: 'delete-selected-models',
                    label: 'Supprimer la sélection',
                    icon: 'delete',
                    variant: 'outlined' as const,
                    onSelect: handleDeleteSelectedModels,
                },
            ] : []),
        ];
    })();

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Shared Modals Components */}
            <AddCategoryPage
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    // Resynchronise l'URL du lien profond sur la liste parente.
                    if (initialAddModal === 'category') onViewChange?.('management');
                }}
                categoryToEdit={categoryToEdit}
            />
            <AddModelPage
                isOpen={isModelModalOpen}
                onClose={() => {
                    setIsModelModalOpen(false);
                    if (initialAddModal === 'model') onViewChange?.('management');
                }}
                modelToEdit={modelToEdit}
            />
            <input
                ref={categoryImportInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void handleCategoryImportFile(event)}
            />

            {/* HEADER SECTION */}
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title={GLOSSARY.MANAGEMENT}
                        subtitle={activeTab === 'categories' ? "Définissez la typologie de votre parc." : "Gérez votre catalogue de modèles standardisés."}
                        breadcrumb={GLOSSARY.MANAGEMENT}
                        actions={
                            !isCompact && (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Button
                                        variant={selectionMode ? 'filled' : 'outlined'}
                                        icon={<MaterialIcon name={selectionMode ? 'checklist_rtl' : 'check_box'} size={18} />}
                                        onClick={() => setSelectionMode((prev) => !prev)}
                                    >
                                        {selectionMode ? 'Terminer sélection' : 'Sélection'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        icon={<MaterialIcon name="download" size={18} />}
                                        onClick={activeTab === 'categories'
                                            ? () => handleExportCategories(sortedCategories)
                                            : () => handleExportModels(filteredModels)}
                                    >
                                        Exporter
                                    </Button>
                                    {activeTab === 'categories' ? (
                                        <Button variant="outlined" icon={<MaterialIcon name="upload" size={18} />} onClick={handleTriggerCategoryImport}>
                                            Importer
                                        </Button>
                                    ) : (
                                        <Button variant="outlined" icon={<MaterialIcon name="upload" size={18} />} onClick={() => onViewChange?.('import_models')}>
                                            Importer
                                        </Button>
                                    )}
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="add" size={18} />}
                                        onClick={activeTab === 'categories' ? handleOpenAddCategory : handleOpenAddModel}
                                    >
                                        {activeTab === 'categories' ? 'Nouvelle Catégorie' : 'Nouveau Modèle'}
                                    </Button>
                                </div>
                            )
                        }
                    />
                </div>

                <PageTabs
                    items={tabs}
                    activeId={activeTab}
                    onChange={handleTabChange}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-medium2 pb-12">
                        {activeTab === 'categories' ? (
                            <div className="space-y-6">

                                <div className="flex flex-col medium:flex-row medium:items-center gap-3">
                                    <SearchFilterBar
                                        searchValue={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onFilterClick={() => setShowFilters((prev) => !prev)}
                                        filterActive={showFilters}
                                        placeholder="Rechercher des catégories..."
                                        resultCount={filteredCategories.length}
                                        className="flex-1"
                                    />
                                    {showFilters && (
                                        <div className="flex flex-col medium:flex-row items-stretch medium:items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-short4">
                                            <SelectFilter
                                                options={[
                                                    { value: '', label: 'Toutes les méthodes' },
                                                    { value: 'linear', label: 'Linéaire' },
                                                    { value: 'degressive', label: 'Dégressif' },
                                                ]}
                                                value={categoryMethodFilter}
                                                onChange={(value) => setCategoryMethodFilter(value as CategoryMethodFilter)}
                                                placeholder="Méthode"
                                                className="w-full medium:w-auto"
                                            />
                                            <SelectFilter
                                                options={[
                                                    { value: 'name-asc', label: 'Nom (A-Z)' },
                                                    { value: 'name-desc', label: 'Nom (Z-A)' },
                                                    { value: 'depreciation-asc', label: 'Amortissement (court)' },
                                                    { value: 'depreciation-desc', label: 'Amortissement (long)' },
                                                ]}
                                                value={categorySort}
                                                onChange={(value) => setCategorySort(value as CategorySortValue)}
                                                placeholder="Trier"
                                                className="w-full medium:w-auto"
                                            />
                                            {(searchQuery || categorySort !== 'name-asc' || categoryMethodFilter !== '') && (
                                                <Button
                                                    variant="text"
                                                    className="w-full medium:w-auto"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setCategorySort('name-asc');
                                                        setCategoryMethodFilter('');
                                                    }}
                                                >
                                                    Réinitialiser
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectionMode && (
                                    <div className="-mt-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5 flex flex-col gap-2">
                                        <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-2">
                                            <p className="text-body-small text-on-surface-variant">
                                                {selectedCategoryIds.length} élément{selectedCategoryIds.length > 1 ? 's' : ''} sélectionné{selectedCategoryIds.length > 1 ? 's' : ''}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    icon={<MaterialIcon name="download" size={16} />}
                                                    disabled={selectedCategoryIds.length === 0}
                                                    onClick={() => handleExportCategories(selectedCategories)}
                                                >
                                                    Exporter sélection
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    icon={<MaterialIcon name="delete" size={16} />}
                                                    disabled={selectedCategoryIds.length === 0}
                                                    onClick={handleDeleteSelectedCategories}
                                                >
                                                    Supprimer
                                                </Button>
                                                <Button variant="text" size="sm" onClick={() => setSelectionMode(false)}>
                                                    Annuler
                                                </Button>
                                            </div>
                                        </div>

                                        <label className="inline-flex items-center gap-2 text-label-small text-on-surface-variant">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--tk-color-primary)]"
                                                checked={allVisibleCategoriesSelected}
                                                ref={(node) => {
                                                    if (node) {
                                                        node.indeterminate = !allVisibleCategoriesSelected && someVisibleCategoriesSelected;
                                                    }
                                                }}
                                                onChange={(event) => toggleVisibleSelection(event.target.checked)}
                                            />
                                            Tout sélectionner sur la page
                                        </label>
                                    </div>
                                )}

                                {filteredCategories.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 gap-3 medium:grid-cols-2 expanded:grid-cols-3 medium:gap-6">
                                            {paginatedCategories.map((cat) => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => {
                                                        if (selectionMode) {
                                                            toggleCategorySelection(cat.id, !selectedCategorySet.has(cat.id));
                                                            return;
                                                        }
                                                        onCategoryClick?.(cat.id);
                                                    }}
                                                    className={`bg-surface rounded-card p-4 medium:p-card border shadow-elevation-1 relative group transition-all duration-300 cursor-pointer overflow-hidden ${
                                                        selectionMode && selectedCategorySet.has(cat.id)
                                                            ? 'border-primary shadow-elevation-2'
                                                            : 'border-outline-variant hover:shadow-elevation-3 hover:-translate-y-1'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2 medium:mb-4 relative z-10">
                                                        <div className="w-10 h-10 medium:w-12 medium:h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                                                            {renderCategoryIcon(cat, 24)}
                                                        </div>
                                                        {selectionMode ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCategorySet.has(cat.id)}
                                                                onClick={(event) => event.stopPropagation()}
                                                                onChange={(event) => toggleCategorySelection(cat.id, event.target.checked)}
                                                                className="h-4 w-4 accent-[var(--tk-color-primary)]"
                                                                aria-label={`Sélectionner ${getCategoryLabel(cat.name)}`}
                                                            />
                                                        ) : (
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <IconButton
                                                                    icon="edit"
                                                                    size={16}
                                                                    variant="standard"
                                                                    aria-label={`Modifier ${getCategoryLabel(cat.name)}`}
                                                                    onClick={(e) => handleOpenEditCategory(e, cat)}
                                                                    className="w-9 h-9 shadow-elevation-1"
                                                                />
                                                                <IconButton
                                                                    icon="delete"
                                                                    size={16}
                                                                    variant="standard"
                                                                    aria-label={`Supprimer ${getCategoryLabel(cat.name)}`}
                                                                    onClick={(e) => handleDeleteCategory(e, cat)}
                                                                    className="w-9 h-9 shadow-elevation-1 text-on-surface-variant hover:text-error hover:bg-surface"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h3 className="text-title-medium font-bold text-on-surface mb-1">{getCategoryLabel(cat.name)}</h3>
                                                    <p className="text-body-medium text-on-surface-variant mb-2 medium:mb-4 line-clamp-1 medium:line-clamp-2 medium:min-h-[2.5rem]">{cat.description || 'Aucune description'}</p>
                                                    <div className="border-t border-outline-variant pt-2 medium:pt-4 flex gap-2">
                                                        <Badge variant="info" className="text-label-small">{cat.defaultDepreciation?.method === 'degressive' ? 'Dégressif' : 'Linéaire'}</Badge>
                                                        <span className="text-label-small font-bold text-on-surface-variant">{cat.defaultDepreciation?.years} ans</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination currentPage={currentPage} totalPages={totalCategoryPages} onPageChange={setCurrentPage} />
                                    </>
                                ) : (
                                    <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
                                        <div className="p-8">
                                            <EmptyState
                                                icon="grid_off"
                                                title="Aucune catégorie trouvée"
                                                description="Ajustez votre recherche ou ajoutez une nouvelle catégorie."
                                                action={(
                                                    <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={handleOpenAddCategory}>
                                                        Nouvelle Catégorie
                                                    </Button>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">

                                <div className="flex flex-col medium:flex-row medium:items-center gap-3">
                                    <SearchFilterBar
                                        searchValue={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onFilterClick={() => setShowFilters((prev) => !prev)}
                                        filterActive={showFilters}
                                        placeholder="Rechercher des modèles..."
                                        resultCount={filteredModels.length}
                                        className="flex-1"
                                    />
                                    {showFilters && (
                                        <div className="flex flex-col medium:flex-row items-stretch medium:items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-short4">
                                            <SelectFilter
                                                options={[{ value: '', label: 'Tous les types' }, ...modelTypeOptions]}
                                                value={modelTypeFilter}
                                                onChange={setModelTypeFilter}
                                                placeholder="Type"
                                                className="w-full medium:w-auto"
                                            />
                                            {(searchQuery || modelTypeFilter !== '') && (
                                                <Button
                                                    variant="text"
                                                    className="w-full medium:w-auto"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setModelTypeFilter('');
                                                    }}
                                                >
                                                    Réinitialiser
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectionMode && (
                                    <div className="-mt-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5 flex flex-col gap-2">
                                        <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-2">
                                            <p className="text-body-small text-on-surface-variant">
                                                {selectedModelIds.length} élément{selectedModelIds.length > 1 ? 's' : ''} sélectionné{selectedModelIds.length > 1 ? 's' : ''}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    icon={<MaterialIcon name="download" size={16} />}
                                                    disabled={selectedModelIds.length === 0}
                                                    onClick={() => handleExportModels(selectedModels)}
                                                >
                                                    Exporter sélection
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    icon={<MaterialIcon name="delete" size={16} />}
                                                    disabled={selectedModelIds.length === 0}
                                                    onClick={handleDeleteSelectedModels}
                                                >
                                                    Supprimer
                                                </Button>
                                                <Button variant="text" size="sm" onClick={() => setSelectionMode(false)}>
                                                    Annuler
                                                </Button>
                                            </div>
                                        </div>

                                        <label className="inline-flex items-center gap-2 text-label-small text-on-surface-variant">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--tk-color-primary)]"
                                                checked={allVisibleModelsSelected}
                                                ref={(node) => {
                                                    if (node) {
                                                        node.indeterminate = !allVisibleModelsSelected && someVisibleModelsSelected;
                                                    }
                                                }}
                                                onChange={(event) => toggleVisibleSelection(event.target.checked)}
                                            />
                                            Tout sélectionner sur la page
                                        </label>
                                    </div>
                                )}

                                <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
                                    {paginatedModels.length > 0 ? (
                                        paginatedModels.map((model) => (
                                            <div
                                                key={model.id}
                                                onClick={() => {
                                                    if (selectionMode) {
                                                        toggleModelSelection(model.id, !selectedModelSet.has(model.id));
                                                        return;
                                                    }
                                                    onModelClick?.(model.id);
                                                }}
                                                className={`group flex items-center gap-4 p-4 h-24 border-b border-outline-variant last:border-0 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                                                    selectionMode && selectedModelSet.has(model.id)
                                                        ? 'bg-primary-container/30'
                                                        : 'hover:bg-surface-container'
                                                }`}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {selectionMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModelSet.has(model.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onChange={(event) => toggleModelSelection(model.id, event.target.checked)}
                                                        className="h-4 w-4 accent-[var(--tk-color-primary)] shrink-0"
                                                        aria-label={`Sélectionner ${model.name}`}
                                                    />
                                                )}

                                                <div className="shrink-0 relative w-16 h-12 bg-surface-container rounded-md overflow-hidden border border-outline-variant flex items-center justify-center">
                                                    <MaterialIcon name="image_not_supported" size={18} className="text-outline" />
                                                    <img
                                                        src={model.image}
                                                        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-0.5"
                                                        alt=""
                                                        loading="lazy"
                                                        decoding="async"
                                                        onError={(event) => {
                                                            event.currentTarget.style.visibility = 'hidden';
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-on-surface text-title-small truncate group-hover:text-primary transition-colors" title={model.name}>
                                                        {model.name}
                                                    </h4>
                                                    <div className="mt-1 flex items-center gap-2 text-body-small text-on-surface-variant min-w-0">
                                                        <span className="font-medium text-on-surface truncate">{getCategoryLabel(model.type)}</span>
                                                        {model.brand && <span className="truncate">• {model.brand}</span>}
                                                        <span className="ml-auto shrink-0 font-medium bg-surface-container px-1.5 py-0.5 rounded-sm text-on-surface-variant">{model.count} unités</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 ml-auto">
                                                    {!selectionMode && (
                                                        <>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <IconButton
                                                                    icon="edit"
                                                                    size={16}
                                                                    variant="standard"
                                                                    aria-label={`Modifier ${model.name}`}
                                                                    onClick={(e) => handleOpenEditModel(e, model)}
                                                                    className="w-9 h-9 shadow-elevation-1 text-on-surface-variant hover:text-primary hover:bg-surface"
                                                                    title="Modifier"
                                                                />
                                                                <IconButton
                                                                    icon="delete"
                                                                    size={16}
                                                                    variant="standard"
                                                                    aria-label={`Supprimer ${model.name}`}
                                                                    onClick={(e) => handleDeleteModel(e, model)}
                                                                    className="w-9 h-9 shadow-elevation-1 text-on-surface-variant hover:text-error hover:bg-surface"
                                                                    title="Supprimer"
                                                                />
                                                            </div>
                                                            <MaterialIcon name="chevron_right" size={18} className="text-outline group-hover:text-primary transition-colors" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8">
                                            <EmptyState
                                                icon="inventory_off"
                                                title="Aucun modèle trouvé"
                                                description="Ajustez votre recherche ou ajoutez un nouveau modèle."
                                                action={
                                                    <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={handleOpenAddModel}>
                                                        Nouveau Modèle
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                                {filteredModels.length > 0 && <Pagination currentPage={currentPage} totalPages={totalModelPages} onPageChange={setCurrentPage} />}
                            </div>
                        )}
                    </div>
                    {isCompact && (
                        <ListActionFab
                            label={activeTab === 'categories' ? 'Catégorie' : 'Modèle'}
                            sheetTitle={activeTab === 'categories' ? 'Actions Catégories' : 'Actions Modèles'}
                            actions={compactActions}
                        />
                    )}
                </PageContainer>
            </div>
        </div>
    );
};

export default ManagementPage;
