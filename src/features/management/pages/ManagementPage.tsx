import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    Books,
    CaretRight,
    Clock,
    Cube,
    Desktop,
    FileCsv,
    Funnel,
    Laptop,
    Network,
    Plugs,
    Plus,
    SortAscending,
    Tag,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import { FabContainer } from '../../../components/ui/FabContainer';
import FacetChip from '../../../components/ui/FacetChip';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
import ListRow from '../../../components/ui/ListRow';
import SelectionTopBar from '../../../components/ui/SelectionTopBar';
import BulkActionBar from '../../../components/ui/BulkActionBar';
import { useSelection } from '../../../hooks/useSelection';
import { useDeclareSelectionRegime } from '../../../context/SelectionRegimeContext';
import { buildCsvLine } from '../../../lib/csv';
import ScreenState from '../../../components/ui/ScreenState';
import SearchField from '../../../components/ui/SearchField';
import { MEDIA } from '../../../constants/breakpoints';
import { getCategoryLabel } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { CATEGORY_ICONS, renderCategoryIcon } from '../../../constants/categoryIcons';
import { useDebounce } from '../../../hooks/useDebounce';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { cn } from '../../../lib/utils';
import { CATEGORY_FAMILIES, Category, ViewType } from '../../../types';
import AddCategoryPage from './AddCategoryPage';
import AddModelPage from './AddModelPage';

const ALL_FAMILIES = 'Toutes';

/**
 * **Un type sans famille le dit ; il n'est pas rangé d'office.**
 *
 * Le repli était « Mobilier et divers » — une vraie famille du référentiel. Une donnée
 * persistée avant l'ajout du champ, ou importée par un CSV qui ne le porte pas, s'y
 * retrouvait donc **classée**, et rien à l'écran ne la distinguait d'un type
 * effectivement rangé : les quatre familles de l'arbitrage A2 se réduisaient à une.
 * C'est la faute que 15.1 nomme — *un classement deviné ne se présente pas comme un
 * classement su*. Ce cinquième groupe n'existe pas sur la planche parce que la planche
 * n'a pas de donnée sans famille ; il porte le manque au lieu de le masquer, et il se
 * vide à mesure qu'on renseigne les fiches.
 */
const UNFILED_FAMILY = 'Sans famille';

/**
 * **Les quatre familles, leur pictogramme et leur teinte** — 09.1, `.fh .si`. Elles sont
 * fixées (A2) : le référentiel se parcourt d'un bout à l'autre, et quatre en-têtes se
 * distinguent d'un coup d'œil quand ils portent une image. Sans elle, quatre titres de
 * 13 px se ressemblaient tous.
 */
const FAMILY_GLYPH: Record<string, PhosphorGlyph> = {
    Informatique: Desktop,
    Périphériques: Plugs,
    'Impression et réseau': Network,
    'Mobilier et divers': Cube,
};

const FAMILY_TINT: Record<string, string> = {
    Informatique: 'bg-tint-bleu text-on-tint-bleu',
    Périphériques: 'bg-tint-vert text-on-tint-vert',
    'Impression et réseau': 'bg-tint-ambre text-on-tint-ambre',
    'Mobilier et divers': 'bg-tint-orange text-on-tint-orange',
};

/** L'ordre d'affichage : les quatre familles du référentiel, puis le manque. */
const FAMILY_ORDER: string[] = [...CATEGORY_FAMILIES, UNFILED_FAMILY];

/** L'axe « état du type » de la feuille de filtre (09.1, colonne 1). */
type TypeStateFilter = '' | 'no-model' | 'no-asset';
type MethodFilter = '' | 'linear' | 'degressive';

/**
 * Le tri du référentiel — **il ordonne les types, jamais les familles**.
 *
 * Le regroupement famille → type est l'arbitrage A2, pas une option de tri : une
 * liste qui perd ses familles selon un menu apprend une grammaire par ouverture.
 * Le bouton reprend donc le libellé de la planche — « Par famille » — et les
 * autres choix réordonnent les types **à l'intérieur** de chaque famille.
 */
const SORT_OPTIONS = [
    { id: 'famille', label: 'Par famille' },
    { id: 'nom-desc', label: 'Nom (Z-A)' },
    { id: 'amortissement-court', label: 'Amortissement (court)' },
    { id: 'amortissement-long', label: 'Amortissement (long)' },
] as const;

/** Les deux axes de la feuille de filtre (09.1) — `.sgrp`, pastilles de 44 px. */
const TYPE_STATE_OPTIONS: { value: TypeStateFilter; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'no-model', label: 'Sans modèle' },
    { value: 'no-asset', label: 'Sans aucun actif' },
];

const METHOD_OPTIONS: { value: MethodFilter; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'linear', label: 'Linéaire' },
    { value: 'degressive', label: 'Dégressif' },
];

/**
 * `.orow` de 09.1 — la rangée de la feuille d'ajout : **64 de haut, gouttière 12**, un
 * filet entre deux, et **aucune marge de côté** : la feuille pose déjà ses 20, et le titre
 * tombe à 72. Elle en ajoutait 20 de plus — le titre à 92, et « Un nom et son type ; le
 * reste plus tard » passait à la ligne (relevé du 13/09).
 */
const ADD_ROW_CLASS =
    'flex min-h-16 w-full items-center gap-3 border-t border-outline-variant py-2 text-left transition-colors first-of-type:border-t-0 hover:bg-surface-container';
/**
 * `.vig` — **une teinte par chemin**, comme la planche les distingue : le type en bleu,
 * le modèle en vert, l'import en ambre. Les trois portaient le même creux gris et le
 * même glyphe `+`, si bien qu'aucune ne se reconnaissait avant d'être lue.
 */
const ADD_ROW_GLYPH_CLASS = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]';

interface ManagementPageProps {
    onCategoryClick?: (id: string) => void;
    onViewChange?: (view: ViewType) => void;
    /** Le retour vers « Plus » — la flèche de 09.1, au téléphone seulement. */
    onBack?: () => void;
    /** Lien profond /management/{categories|models}/add : modale ouverte au rendu. */
    initialAddModal?: 'category' | 'model';
}

/**
 * **Le Catalogue — une page, et une seule** (planche 09.1).
 *
 * L'écran portait deux onglets, « Catégories » et « Modèles » : deux listes
 * plates côte à côte. La planche n'en dessine qu'une — le référentiel des
 * **types**, rangé sous ses **familles** — et range les modèles là où ils
 * appartiennent : **sous leur type** (`CategoryDetailsPage`), avec leur propre
 * fiche (09.2, `ModelDetailsPage`). Le geste d'ajout est unique et demande ce
 * qu'on ajoute, plutôt que de faire changer d'onglet.
 *
 * Ce que la planche pose et qui manquait : les **pastilles de famille** — le
 * filtre principal de l'écran depuis l'arbitrage A2 —, la facette **« sans
 * modèle »** qui est la raison d'être de cet écran (*le signal « catalogue à
 * nettoyer » vit ici, pas sur le dashboard*), le tri sur la ligne de décompte, et
 * un **état vide du référentiel** distinct du filtre trop serré : le premier jour
 * d'une installation, « ajustez votre recherche » n'a rien à ajuster.
 *
 * Ce qui est tombé : la pagination (le référentiel est borné, §04.1), la corbeille
 * et le crayon en survol de rangée (*une suppression se décide devant l'objet*),
 * l'export, et le mode sélection — supprimer un type se fait sur sa fiche, qui
 * porte déjà le geste et sa confirmation.
 */
const ManagementPage: React.FC<ManagementPageProps> = ({
    onCategoryClick,
    onViewChange,
    initialAddModal,
    onBack,
}) => {
    const { equipment, categories, models, addCategory } = useData();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [familyFilter, setFamilyFilter] = useState<string>(ALL_FAMILIES);
    const [typeStateFilter, setTypeStateFilter] = useState<TypeStateFilter>('');
    const [methodFilter, setMethodFilter] = useState<MethodFilter>('');
    const [sortIndex, setSortIndex] = useState(0);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);

    const isCompact = useMediaQuery(MEDIA.compact);

    /* 17.2 — le catalogue est l'un des quatre écrans qui portent la sélection groupée. */
    const selection = useSelection();
    useDeclareSelectionRegime(selection.isActive);
    const categoryImportInputRef = useRef<HTMLInputElement | null>(null);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (initialAddModal === 'category') setIsCategoryModalOpen(true);
        else if (initialAddModal === 'model') setIsModelModalOpen(true);
    }, [initialAddModal]);

    /** Le décompte de modèles d'un type — c'est lui qui décide de ce qu'on peut créer. */
    const modelCountByType = useMemo(() => {
        const counts = new Map<string, number>();
        models.forEach((model) => counts.set(model.type, (counts.get(model.type) ?? 0) + 1));
        return counts;
    }, [models]);

    const assetCountByType = useMemo(() => {
        const counts = new Map<string, number>();
        equipment.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));
        return counts;
    }, [equipment]);

    const familyOf = (category: Category): string => category.family || UNFILED_FAMILY;

    /** Le référentiel réduit par la recherche et la feuille, mais pas par la famille. */
    const matchingCategories = useMemo(() => {
        const query = debouncedSearch.toLowerCase();
        return categories.filter((category) => {
            const displayName = getCategoryLabel(category.name).toLowerCase();
            const matchesSearch =
                category.name.toLowerCase().includes(query) ||
                displayName.includes(query) ||
                (category.description || '').toLowerCase().includes(query);
            const matchesMethod =
                methodFilter === '' || category.defaultDepreciation?.method === methodFilter;
            const matchesState =
                typeStateFilter === '' ||
                (typeStateFilter === 'no-model' &&
                    (modelCountByType.get(category.name) ?? 0) === 0) ||
                (typeStateFilter === 'no-asset' &&
                    (assetCountByType.get(category.name) ?? 0) === 0);
            return matchesSearch && matchesMethod && matchesState;
        });
    }, [
        categories,
        debouncedSearch,
        methodFilter,
        typeStateFilter,
        modelCountByType,
        assetCountByType,
    ]);

    /**
     * **Exporter la sélection** — le seul acte groupé du catalogue pour l'instant :
     * il ne change rien, donc il ne demande aucun garde.
     */
    const exporterSelection = () => {
        const choisis = filteredCategories.filter((category) => selection.isSelected(category.id));
        if (choisis.length === 0) {
            showToast('Aucun type sélectionné.', 'info');
            return;
        }

        const entetes = ['Type', 'Famille', 'Modeles', 'Actifs'];
        const lignes = choisis.map((category) => [
            category.name,
            category.family || '',
            String(modelCountByType.get(category.name) ?? 0),
            String(assetCountByType.get(category.name) ?? 0),
        ]);

        const csv = [buildCsvLine(entetes), ...lignes.map((ligne) => buildCsvLine(ligne))].join(
            '\n',
        );
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `catalogue-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(url);

        showToast(`${choisis.length} type(s) exporté(s).`, 'success');
        selection.exit();
    };

    const filteredCategories = useMemo(
        () =>
            familyFilter === ALL_FAMILIES
                ? matchingCategories
                : matchingCategories.filter((category) => familyOf(category) === familyFilter),
        [matchingCategories, familyFilter],
    );

    /**
     * Les pastilles de famille — le filtre principal de l'écran (A2, 09.1).
     *
     * Une famille **bornée** se compte : quatre familles restent quatre à quinze
     * types, là où la liste des types ne l'est pas. Les décomptes suivent la
     * recherche et la feuille, jamais la famille prise — sans quoi la pastille
     * active afficherait le total de la sélection qu'elle vient de produire.
     */
    const familyFacets = useMemo(() => {
        const counts = new Map<string, number>();
        matchingCategories.forEach((category) => {
            const family = familyOf(category);
            counts.set(family, (counts.get(family) ?? 0) + 1);
        });
        return [
            { id: ALL_FAMILIES, label: ALL_FAMILIES, count: matchingCategories.length },
            ...FAMILY_ORDER.filter((family) => counts.has(family)).map((family) => ({
                id: family,
                label: family,
                count: counts.get(family) as number,
            })),
        ];
    }, [matchingCategories]);

    const categoriesByFamily = useMemo(() => {
        const sortOption = SORT_OPTIONS[sortIndex].id;
        const buckets = new Map<string, Category[]>();
        filteredCategories.forEach((category) => {
            const family = familyOf(category);
            buckets.set(family, [...(buckets.get(family) || []), category]);
        });

        return FAMILY_ORDER.filter((family) => buckets.has(family)).map((family) => {
            const items = [...(buckets.get(family) as Category[])];
            items.sort((a, b) => {
                if (sortOption === 'nom-desc')
                    return getCategoryLabel(b.name).localeCompare(getCategoryLabel(a.name), 'fr');
                if (sortOption === 'amortissement-court')
                    return (
                        (a.defaultDepreciation?.years ?? 0) - (b.defaultDepreciation?.years ?? 0)
                    );
                if (sortOption === 'amortissement-long')
                    return (
                        (b.defaultDepreciation?.years ?? 0) - (a.defaultDepreciation?.years ?? 0)
                    );
                return getCategoryLabel(a.name).localeCompare(getCategoryLabel(b.name), 'fr');
            });
            return { family, items };
        });
    }, [filteredCategories, sortIndex]);

    /**
     * Les types qu'on ne peut pas utiliser — **le signal se dit, il ne se déduit
     * pas rangée par rangée**. C'est la note que 09.1 pose sous la liste : le
     * défaut de référentiel se répare sur l'écran qui tient le référentiel.
     */
    const unusableTypes = useMemo(
        () => categories.filter((category) => (modelCountByType.get(category.name) ?? 0) === 0),
        [categories, modelCountByType],
    );

    /** Les types que le filtre par famille ne peut pas atteindre tant qu'ils n'en ont pas. */
    const unfiledTypes = useMemo(
        () => categories.filter((category) => !category.family),
        [categories],
    );

    /* Le porte-voix de 09.1 : « N modèles au catalogue, sous N types ». Une seule
       formulation, que l'en-tête au rail et le bloc du téléphone se partagent. */
    const modelCountLabel = `${models.length} modèle${models.length > 1 ? 's' : ''}`;

    const sheetFilterCount =
        (typeStateFilter ? 1 : 0) +
        (methodFilter ? 1 : 0) +
        (familyFilter !== ALL_FAMILIES ? 1 : 0);
    const isFiltered =
        Boolean(debouncedSearch) || familyFilter !== ALL_FAMILIES || sheetFilterCount > 0;
    const isReferentialEmpty = categories.length === 0;

    const clearSheetFilters = () => {
        setTypeStateFilter('');
        setMethodFilter('');
        setFamilyFilter(ALL_FAMILIES);
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setFamilyFilter(ALL_FAMILIES);
        clearSheetFilters();
    };

    const openAddCategory = () => {
        setIsAddSheetOpen(false);
        setIsCategoryModalOpen(true);
    };

    const openAddModel = () => {
        setIsAddSheetOpen(false);
        setIsModelModalOpen(true);
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

            const existingNames = new Set(
                categories.map((category) => category.name.toLowerCase()),
            );
            const delimiter = lines[0].includes(';') ? ';' : ',';
            const hasHeader = /nom|catég|categorie/i.test(lines[0]);
            const rows = hasHeader ? lines.slice(1) : lines;

            let createdCount = 0;
            let skippedCount = 0;

            rows.forEach((row) => {
                const values = row
                    .split(delimiter)
                    .map((cell) => cell.trim().replace(/^"|"$/g, ''));
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
                showToast('Aucun type ajouté : doublons ou lignes invalides.', 'warning');
            }
        } catch {
            showToast("Impossible d'importer ce fichier CSV.", 'error');
        }
    };

    return (
        <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <AddCategoryPage
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    if (initialAddModal === 'category') onViewChange?.('management');
                }}
                categoryToEdit={null}
            />
            <AddModelPage
                isOpen={isModelModalOpen}
                onClose={() => {
                    setIsModelModalOpen(false);
                    if (initialAddModal === 'model') onViewChange?.('management');
                }}
                modelToEdit={null}
            />
            <input
                ref={categoryImportInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void handleCategoryImportFile(event)}
            />

            {/* La feuille de filtre — deux axes, ceux de 09.1 : ce qui rend un type
                inutilisable, et sa durée d'amortissement. Les pastilles sont celles de
                09.1 et de 17.8 : 14 sur 20, 36 de haut, 12 de côté. Elles tenaient 15 et
                40, la mesure que seules 03.3 et 18.1 dessinent (relevé du 13/09). */}
            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
            >
                <div className="flex flex-col px-0 pb-0">
                    {/* **La famille est ici, pas dans une rangée de l'en-tête.** 17.8 a
                        retiré le slot des partitions le 06/09 : *« là où une partition
                        exclusive existe, elle est en chips dans la feuille de filtre, et
                        la ligne de tri la nomme »*. Elle occupait une bande sous la
                        recherche — une quatrième ligne de commandes avant la première
                        rangée du catalogue. */}
                    <p className="text-on-surface-variant pb-2 text-[12px] leading-4 font-medium">
                        Famille
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {familyFacets.map((facet) => (
                            <FacetChip
                                compact
                                key={facet.id}
                                label={facet.label}
                                count={facet.count}
                                selected={facet.id === familyFilter}
                                onClick={() => setFamilyFilter(facet.id)}
                            />
                        ))}
                    </div>

                    <p className="text-on-surface-variant pt-4 pb-2 text-[12px] leading-4 font-medium">
                        État du type
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {TYPE_STATE_OPTIONS.map((option) => (
                            <FacetChip
                                compact
                                key={option.label}
                                label={option.label}
                                selected={typeStateFilter === option.value}
                                onClick={() => setTypeStateFilter(option.value)}
                            />
                        ))}
                    </div>

                    <p className="text-on-surface-variant pt-4 pb-2 text-[12px] leading-4 font-medium">
                        Amortissement
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {METHOD_OPTIONS.map((option) => (
                            <FacetChip
                                compact
                                key={option.label}
                                label={option.label}
                                selected={methodFilter === option.value}
                                onClick={() => setMethodFilter(option.value)}
                            />
                        ))}
                    </div>

                    <div className="border-outline-variant -mx-5 mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={clearSheetFilters}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => setIsFilterSheetOpen(false)}
                        >
                            Voir {filteredCategories.length} type
                            {filteredCategories.length > 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* « Ajouter au catalogue » — la feuille de 09.1 : on demande ce qu'on
                ajoute, plutôt que de faire changer d'onglet pour le dire. */}
            <BottomSheet
                open={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                title="Ajouter au catalogue"
            >
                <div className="flex flex-col">
                    {/*
                      **Trois chemins, dans l'ordre de la planche** — et le type d'abord :
                      un modèle se range *sous* un type, et l'import lit des types au
                      catalogue. La feuille en portait quatre, le modèle en tête et deux
                      imports au bout ; le second — « des types, depuis un CSV » — n'est pas
                      dans 09.1, qui renvoie l'import des types aux Paramètres : *« ils
                      demandent les clés de la donnée, que personne ne connaît avant
                      d'avoir créé un type à la main »*.
                    */}
                    <button type="button" className={ADD_ROW_CLASS} onClick={openAddCategory}>
                        <span className={cn(ADD_ROW_GLYPH_CLASS, 'bg-tint-bleu text-on-tint-bleu')}>
                            <Icon glyph={Tag} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[16px] leading-6">
                                Un type
                            </span>
                            <span className="text-on-surface-variant block text-[14px] leading-5">
                                Une famille, un nom, attribuable ou non
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={20}
                            className="text-text-tertiary shrink-0"
                        />
                    </button>

                    <button type="button" className={ADD_ROW_CLASS} onClick={openAddModel}>
                        <span className={cn(ADD_ROW_GLYPH_CLASS, 'bg-tint-vert text-on-tint-vert')}>
                            <Icon glyph={Laptop} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[16px] leading-6">
                                Un modèle
                            </span>
                            <span className="text-on-surface-variant block text-[14px] leading-5">
                                Un nom et son type ; le reste plus tard
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={20}
                            className="text-text-tertiary shrink-0"
                        />
                    </button>

                    <button
                        type="button"
                        className={ADD_ROW_CLASS}
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            onViewChange?.('import_models');
                        }}
                    >
                        <span
                            className={cn(ADD_ROW_GLYPH_CLASS, 'bg-tint-ambre text-on-tint-ambre')}
                        >
                            <Icon glyph={FileCsv} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[16px] leading-6">
                                Importer des modèles
                            </span>
                            <span className="text-on-surface-variant block text-[14px] leading-5">
                                Un fichier, une ligne par modèle
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={20}
                            className="text-text-tertiary shrink-0"
                        />
                    </button>
                </div>
            </BottomSheet>

            {/*
              **L'EN-TÊTE DE 17.8 — un seul bloc.** Le catalogue en portait trois : une
              barre de 56 avec le titre en **20**, puis une bande à filet propre avec la
              recherche et l'entonnoir, puis une troisième rangée de pastilles de famille.
              Quatre lignes de commandes avant la première rangée du référentiel.

              Le composant partagé en déclare un : titre **28 sur 32** et l'action de page,
              recherche et entonnoir à 48, la ligne de compte en 12 — *« l'ordre descend du
              général au particulier : où l'on est, ce qu'on cherche, quelle tranche, dans
              quel ordre »*. Les partitions sont dans la feuille (§ ci-dessus).
            */}
            {isCompact && selection.isActive ? (
                /* 17.2 — la barre du haut est **remplacée**, à hauteur égale : l'écran
                   change de régime, il ne gagne pas un palier. */
                <SelectionTopBar
                    count={selection.count}
                    total={filteredCategories.length}
                    onExit={selection.exit}
                    onSelectAll={() =>
                        selection.selectAll(filteredCategories.map((category) => category.id))
                    }
                    onClearAll={selection.clear}
                />
            ) : (
                <div
                    className={cn(
                        'flex flex-col',
                        isCompact
                            ? 'border-outline-variant bg-surface border-b px-4 pt-2 pb-3'
                            : 'px-page pt-5',
                        !isReferentialEmpty && 'gap-3',
                    )}
                >
                    {/* `.tt` — **le titre, et rien d'autre.** 17.8 tranche : *« une seule
                        action de page dans le corpus : le scan de 04.1. Partout ailleurs
                        le geste de création vit dans le "+" (17.6) : le gabarit autorise
                        zéro action, et c'est le cas ordinaire. »* Le bouton « Ajouter »
                        posé ici le 07/09 était une **seconde porte** vers la feuille que
                        le bouton flottant ouvre déjà en bas de l'écran. La flèche de retour,
                        elle, y est : on arrive ici depuis « Plus », comme sur 18.1. */}
                    <div className="flex min-h-12 items-center gap-1">
                        {isCompact && onBack && (
                            <button
                                type="button"
                                aria-label="Retour"
                                onClick={onBack}
                                className="text-on-surface hover:bg-surface-container -ml-3 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
                            >
                                <Icon glyph={ArrowLeft} size={24} />
                            </button>
                        )}
                        <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            Catalogue
                        </h1>
                    </div>

                    {/* La bande disparaît avec le référentiel vide : un outil qui trie ce
                        qui n'existe pas apprend que l'écran est cassé. */}
                    {!isReferentialEmpty && (
                        <>
                            {/* Au bureau, la bande devient la ligne d'outils de 17.11 : le
                                champ cerné de 320 × 40, et le filtre à 40 comme lui. */}
                            <IconGestureSizeContext.Provider value={isCompact ? 48 : 40}>
                                <Reading
                                    className={cn(
                                        'flex items-center',
                                        isCompact ? 'gap-2' : 'gap-3',
                                    )}
                                >
                                    <SearchField
                                        dense={!isCompact}
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        placeholder="Type, modèle, marque"
                                        className={isCompact ? 'flex-1' : 'w-[320px] max-w-full'}
                                    />
                                    <FilterButton
                                        label="Filtrer le catalogue"
                                        count={sheetFilterCount}
                                        onClick={() => setIsFilterSheetOpen(true)}
                                    />
                                </Reading>
                            </IconGestureSizeContext.Provider>

                            {/*
                              `.ord` — **le cinquième slot, dans le bloc fixe.** Il vivait
                              dans le contenu, donc il défilait : *« un filtre posé dans
                              `.page` disparaît au premier défilement, et la liste devient
                              un sous-ensemble sans étiquette »* (17.8). C'est aussi ici que
                              la **famille retenue se nomme**, puisqu'elle n'a plus de
                              rangée à elle : la ligne de tri porte la partition.
                            */}
                            <Reading
                                className={cn(
                                    'text-on-surface-variant flex items-center justify-between gap-3 px-1 text-[12px] leading-4',
                                    selection.isActive && 'hidden',
                                )}
                            >
                                <span className="min-w-0 truncate">
                                    <b className="text-on-surface font-medium tabular-nums">
                                        {filteredCategories.length}
                                    </b>{' '}
                                    type{filteredCategories.length > 1 ? 's' : ''}
                                    {familyFilter !== ALL_FAMILIES && ` · ${familyFilter}`} ·{' '}
                                    {modelCountLabel} · {equipment.length} actifs
                                </span>
                                <Button
                                    variant="text"
                                    onClick={() =>
                                        setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)
                                    }
                                    className="text-on-surface -mr-2 min-h-0 shrink-0 gap-1.5 px-2 text-[12px] leading-4 font-medium hover:bg-transparent"
                                    icon={
                                        <Icon
                                            glyph={SortAscending}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                    }
                                >
                                    {SORT_OPTIONS[sortIndex].label}
                                </Button>
                            </Reading>
                        </>
                    )}
                </div>
            )}

            {/* `.page` — 16 px de haut, 20 de côté et de bas. La planche pousse le bas
                à 92 quand le bouton flottant occupe le coin ; 56 de ces 92 sont la
                barre du bas, que la mise en page porte déjà (`pb-16` sur le contenu).
                Restent 36 : sans eux, la dernière rangée passe sous le bouton. */}
            <div
                className={cn(
                    /* `.page` de 09.1 : 16 de côté, 24 en bas, 96 quand le bouton
                       flottant occupe le coin (10/09 ; le code posait 20 / 36). */
                    'medium:px-page flex flex-1 flex-col px-4 pt-4 pb-6',
                    isCompact && !isReferentialEmpty && 'pb-24',
                )}
            >
                {isReferentialEmpty ? (
                    /* Le référentiel vide — colonne 4 de 09.1. Il ne compte pas jusqu'à
                       zéro : il dit la conséquence, puis met le seul geste utile à
                       portée. */
                    <ScreenState
                        icon={Books}
                        title="Le catalogue est vide"
                        description={
                            <>
                                Commencez par un type : sans lui,{' '}
                                <b className="text-on-surface font-medium">
                                    aucun modèle ni équipement ne peut être créé
                                </b>
                                .
                            </>
                        }
                        /* **Ni bouton, ni note** — 09.1, colonne 5 : *« un seul geste
                           d'ajout, le FAB, le même qu'au repos ; la phrase dit par quoi
                           commencer »*. Le bouton posé ici doublait le geste flottant, et
                           la note expliquait l'import à qui n'a pas encore de type. */
                    />
                ) : (
                    <Reading className="flex flex-col">
                        {filteredCategories.length > 0 ? (
                            <>
                                {/* A2 — deux niveaux, famille → type. Le référentiel est
                                    **borné** : quatre familles restent quatre à quinze types,
                                    il se parcourt donc d'un bout à l'autre, sans pagination.
                                    B1 — la clé anglaise se lit à droite, à la place où la
                                    liste des équipements montre `ASSET-10001`.

                                    L'en-tête de famille **coiffe** la carte sans être dedans
                                    (`.fh`, §2.36) : posé à l'intérieur, un nom de famille se
                                    lirait comme une rangée de plus. */}
                                <div className="flex flex-col gap-4">
                                    {categoriesByFamily.map(({ family, items }) => (
                                        <section key={family}>
                                            {/* `.fh` — le pictogramme de la famille, teinté,
                                                puis son nom en 17 sur 24 et le compte en 14
                                                sur 20. Il valait 13 px sans image : quatre
                                                familles se distinguaient par leur seul nom. */}
                                            <div className="text-on-surface flex items-center gap-3 px-1 pb-2">
                                                <span
                                                    className={cn(
                                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]',
                                                        FAMILY_TINT[family] ??
                                                            'bg-surface-container text-on-surface-variant',
                                                    )}
                                                >
                                                    <Icon
                                                        glyph={FAMILY_GLYPH[family] ?? Cube}
                                                        size={18}
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                                                    {family}
                                                </span>
                                                <span className="text-on-surface-variant shrink-0 text-[14px] leading-5 tabular-nums">
                                                    {items.length} type{items.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="rounded-card bg-surface px-4 py-1">
                                                {items.map((cat) => {
                                                    const modelCount =
                                                        modelCountByType.get(cat.name) ?? 0;
                                                    const assetCount =
                                                        assetCountByType.get(cat.name) ?? 0;
                                                    const unusable = modelCount === 0;
                                                    const label = getCategoryLabel(cat.name);
                                                    /* La clé ne se redit pas quand elle **est** le libellé :
                                                       un type créé par un administrateur n'a pas d'entrée
                                                       de traduction, et « Vidéoprojecteur · Vidéoprojecteur »
                                                       fait passer pour deux faits ce qui n'en est qu'un. */
                                                    const dataKey =
                                                        label === cat.name ? undefined : cat.name;

                                                    return (
                                                        <ListRow
                                                            key={cat.id}
                                                            vignette={
                                                                <span
                                                                    className={
                                                                        unusable
                                                                            ? 'text-text-muted'
                                                                            : undefined
                                                                    }
                                                                >
                                                                    {renderCategoryIcon(cat, 20)}
                                                                </span>
                                                            }
                                                            title={
                                                                /* `.lrow.mute .l1 .c` — un type inutilisable
                                                                   perd l'encre pleine, il ne perd pas son nom. */
                                                                unusable ? (
                                                                    <span className="text-text-secondary">
                                                                        {label}
                                                                    </span>
                                                                ) : (
                                                                    label
                                                                )
                                                            }
                                                            type={
                                                                /* `.l1 .ty` — le décompte de modèles est le
                                                                   porte-voix de la rangée : 13 px, encre
                                                                   pleine, chiffres tabulaires. Sans modèle,
                                                                   il retombe en `.ty.q` — 400, encre pâle :
                                                                   ce n'est plus un nombre, c'est un manque. */
                                                                unusable ? (
                                                                    <span className="text-text-muted text-[13px] font-normal">
                                                                        aucun modèle
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-on-surface text-[13px] font-medium tabular-nums">
                                                                        {modelCount} modèle
                                                                        {modelCount > 1 ? 's' : ''}
                                                                    </span>
                                                                )
                                                            }
                                                            status={
                                                                /* Le glyphe de l'attente, en ambre — la paire
                                                                   canonique du registre §0.3. Un catalogue
                                                                   incomplet n'est pas une panne : jamais le
                                                                   triangle d'alerte. */
                                                                unusable
                                                                    ? {
                                                                          icon: Clock,
                                                                          label: 'aucun modèle',
                                                                          tone: 'pending',
                                                                      }
                                                                    : undefined
                                                            }
                                                            holder={
                                                                unusable
                                                                    ? `${assetCount} actif${assetCount > 1 ? 's' : ''}, rien pour en créer`
                                                                    : `${assetCount} actif${assetCount > 1 ? 's' : ''} dans le parc`
                                                            }
                                                            /* `.key` — la clé anglaise se
                                                               lit en **chasse fixe** : c'est
                                                               une valeur de donnée, pas un
                                                               mot. Absente, la planche la
                                                               réclame — « clé ? », souligné
                                                               en pointillé. */
                                                            reference={dataKey ?? 'clé ?'}
                                                            referenceClassName={cn(
                                                                'font-mono text-text-tertiary',
                                                                !dataKey &&
                                                                    'underline decoration-dotted underline-offset-2',
                                                            )}
                                                            onOpen={() => onCategoryClick?.(cat.id)}
                                                            /* 09.1 — `.lrow` de 64, gouttière 12. */
                                                            dense
                                                            selectionActive={selection.isActive}
                                                            selected={selection.isSelected(cat.id)}
                                                            onToggle={() =>
                                                                selection.toggle(cat.id)
                                                            }
                                                            onLongPress={() =>
                                                                selection.enter(cat.id)
                                                            }
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    ))}
                                </div>

                                {/* `.note` — le signal « catalogue à nettoyer » vit ici, pas
                                    sur le tableau de bord, parce que c'est ici qu'il se répare. */}
                                {unfiledTypes.length > 0 && (
                                    <p className="text-text-secondary mt-[7px] px-0.5 text-[12px] leading-[17px]">
                                        <b className="text-on-surface font-medium">
                                            {unfiledTypes.length > 1
                                                ? `${unfiledTypes.length} types n'ont pas de famille`
                                                : "1 type n'a pas de famille"}
                                        </b>
                                        {
                                            ' — ils se rangent sous « Sans famille » et ne remontent sous aucune des quatre familles du filtre. La famille se renseigne sur la fiche du type.'
                                        }
                                    </p>
                                )}

                                {unusableTypes.length > 0 && (
                                    <p className="text-text-secondary mt-[7px] px-0.5 text-[12px] leading-[17px]">
                                        <b className="text-on-surface font-medium">
                                            {unusableTypes.length > 1
                                                ? `${unusableTypes.length} types n'ont aucun modèle`
                                                : "1 type n'a aucun modèle"}
                                        </b>
                                        {` — ${unusableTypes.map((cat) => getCategoryLabel(cat.name)).join(', ')}. `}
                                        {unusableTypes.length > 1
                                            ? "On ne peut créer aucun équipement de ces types tant qu'un modèle n'y est pas rattaché."
                                            : "On ne peut créer aucun équipement de ce type tant qu'un modèle n'y est pas rattaché."}
                                    </p>
                                )}
                            </>
                        ) : (
                            /* Une liste vide **avec** un filtre posé est un filtre trop
                               serré, pas un référentiel vide : les deux ne se disent pas
                               de la même façon, et seul le premier propose d'élargir. */
                            <ScreenState
                                icon={Funnel}
                                title="Aucun type ne correspond"
                                description="Élargissez la recherche, ou revenez à la totalité du référentiel."
                                actions={
                                    isFiltered ? (
                                        <Button variant="filled" onClick={clearAllFilters}>
                                            Voir les {categories.length} types
                                        </Button>
                                    ) : undefined
                                }
                            />
                        )}
                    </Reading>
                )}
            </div>

            {/* Le bouton flottant — 56 px, rayon 8, le seul jaune du contenu (§X12).
                La barre du bas fait 56 px : il se pose à 76 du bas, au-dessus, jamais
                dessus. */}
            {/* 17.2 — le pied n'existe pas à sélection vide, et il prend la place de la
                barre du bas. La suppression groupée n'y est pas : `deleteCategory` ne
                regarde pas si le type est employé, et supprimer d'un geste dix types
                qui portent des actifs les laisserait sans catégorie. C'est un garde à
                écrire avant l'acte, pas un bouton à poser. */}
            {selection.isActive && (
                <BulkActionBar count={selection.count}>
                    <Button variant="filled" onClick={exporterSelection}>
                        Exporter {selection.count > 1 ? `les ${selection.count}` : ''}
                    </Button>
                </BulkActionBar>
            )}

            {/* Le geste d'ajout ne disparaît pas avec la liste : 09.1 le dessine sur le
                référentiel vide, **au même endroit**. Il s'effaçait justement là où il est
                le seul chemin. */}
            {isCompact && !selection.isActive && (
                <FabContainer
                    description="Ajouter au catalogue"
                    className="compact:bottom-[76px] right-5 bottom-[76px]"
                >
                    <button
                        type="button"
                        aria-label="Ajouter au catalogue"
                        className="bg-primary text-on-primary flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl shadow-[0_4px_14px_rgba(10,25,29,0.22)] transition-transform active:scale-95"
                        onClick={() => setIsAddSheetOpen(true)}
                    >
                        <Icon glyph={Plus} size={24} />
                    </button>
                </FabContainer>
            )}
        </div>
    );
};

export default ManagementPage;
