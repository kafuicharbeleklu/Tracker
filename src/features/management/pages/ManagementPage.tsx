import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    CaretRight,
    Clock,
    FolderOpen,
    Funnel,
    Plus,
    SortAscending,
    UploadSimple,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import { FabContainer } from '../../../components/ui/FabContainer';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import ListRow from '../../../components/ui/ListRow';
import { OfflineBanner } from '../../../components/ui/ContextBanner';
import ScreenState from '../../../components/ui/ScreenState';
import SearchField from '../../../components/ui/SearchField';
import { MEDIA } from '../../../constants/breakpoints';
import { getCategoryLabel } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { CATEGORY_ICONS, renderCategoryIcon } from '../../../constants/categoryIcons';
import { useDebounce } from '../../../hooks/useDebounce';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
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

/** La rangée d'une feuille de choix — 64 px, vignette de 40, chevron à droite. */
const ADD_ROW_CLASS =
    'flex min-h-16 w-full items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface-container';
const ADD_ROW_GLYPH_CLASS =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-vignette bg-surface-container text-on-surface-variant';

interface ManagementPageProps {
    onCategoryClick?: (id: string) => void;
    onViewChange?: (view: ViewType) => void;
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
    const typeCountLabel = `${categories.length} type${categories.length > 1 ? 's' : ''}`;

    const sheetFilterCount = (typeStateFilter ? 1 : 0) + (methodFilter ? 1 : 0);
    const isFiltered =
        Boolean(debouncedSearch) || familyFilter !== ALL_FAMILIES || sheetFilterCount > 0;
    const isReferentialEmpty = categories.length === 0;

    const clearSheetFilters = () => {
        setTypeStateFilter('');
        setMethodFilter('');
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
                showToast(
                    'Aucune nouvelle catégorie importée (doublons ou données invalides).',
                    'warning',
                );
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
                inutilisable, et sa durée d'amortissement. Les pastilles de feuille
                montent à 44 px (`.sgrp .chip`) : on les vise au pouce, on ne les
                parcourt pas du regard comme la rangée de familles. */}
            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
            >
                <div className="flex flex-col px-0 pb-0">
                    <p className="text-text-muted px-5 pt-3.5 pb-1.5 text-[11px] font-medium tracking-[0.06em] uppercase">
                        État du type
                    </p>
                    <div className="flex flex-wrap gap-2 px-5">
                        {TYPE_STATE_OPTIONS.map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => setTypeStateFilter(option.value)}
                                className={cn(
                                    'flex min-h-11 items-center rounded-md px-3 text-[13px] transition-colors',
                                    typeStateFilter === option.value
                                        ? 'bg-inverse-surface text-inverse-on-surface'
                                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-text-muted px-5 pt-3.5 pb-1.5 text-[11px] font-medium tracking-[0.06em] uppercase">
                        Amortissement
                    </p>
                    <div className="flex flex-wrap gap-2 px-5">
                        {METHOD_OPTIONS.map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => setMethodFilter(option.value)}
                                className={cn(
                                    'flex min-h-11 items-center rounded-md px-3 text-[13px] transition-colors',
                                    methodFilter === option.value
                                        ? 'bg-inverse-surface text-inverse-on-surface'
                                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="border-outline-variant mt-3 flex items-center gap-3 border-t px-5 pt-3.5 pb-0.5">
                        <Button variant="ghost" className="px-1" onClick={clearSheetFilters}>
                            Tout effacer
                        </Button>
                        <Button
                            variant="tonal"
                            className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 flex-1"
                            onClick={() => setIsFilterSheetOpen(false)}
                        >
                            Voir les {filteredCategories.length} type
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
                <div className="flex flex-col py-2">
                    <button type="button" className={ADD_ROW_CLASS} onClick={openAddModel}>
                        <span className={ADD_ROW_GLYPH_CLASS}>
                            <Icon glyph={Plus} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[15px] font-medium">
                                Un modèle
                            </span>
                            <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                il se range sous un type existant et emporte marque et amortissement
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={18}
                            className="text-text-secondary shrink-0"
                        />
                    </button>

                    <button type="button" className={ADD_ROW_CLASS} onClick={openAddCategory}>
                        <span className={ADD_ROW_GLYPH_CLASS}>
                            <Icon glyph={Plus} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[15px] font-medium">
                                Un type
                            </span>
                            <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                une entrée de référentiel : il change ce que voient tous les filtres
                                du produit
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={18}
                            className="text-text-secondary shrink-0"
                        />
                    </button>

                    {/* Les deux imports en masse. La planche les renvoie aux Paramètres —
                        ils demandent les clés de la donnée, que personne ne connaît avant
                        d'avoir créé un type à la main. Ils restent ici en attendant ce
                        déplacement, plutôt que de devenir injoignables : c'est la seule
                        porte du produit vers l'import de modèles. */}
                    <p className="border-outline-variant text-text-muted mt-2 border-t px-5 pt-3.5 pb-1.5 text-[11px] font-medium tracking-[0.06em] uppercase">
                        Importer en masse
                    </p>

                    <button
                        type="button"
                        className={ADD_ROW_CLASS}
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            handleTriggerCategoryImport();
                        }}
                    >
                        <span className={ADD_ROW_GLYPH_CLASS}>
                            <Icon glyph={UploadSimple} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[15px] font-medium">
                                Des types, depuis un CSV
                            </span>
                            <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                nom, description, méthode, durée, valeur résiduelle, pictogramme
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={18}
                            className="text-text-secondary shrink-0"
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
                        <span className={ADD_ROW_GLYPH_CLASS}>
                            <Icon glyph={UploadSimple} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block text-[15px] font-medium">
                                Des modèles, depuis un fichier
                            </span>
                            <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                le contrat de colonnes s'affiche avant le dépôt
                            </span>
                        </span>
                        <Icon
                            glyph={CaretRight}
                            size={18}
                            className="text-text-secondary shrink-0"
                        />
                    </button>
                </div>
            </BottomSheet>

            {/* LA BARRE — `.tbar` de 09.1, reprise au caractère de 04.1 : 56 px, titre
                Archivo, filet en bas au téléphone ; au rail, ni filet ni redite de la
                destination, que le rail porte déjà (00.4). */}
            {isCompact ? (
                <div className="border-outline-variant bg-surface flex min-h-14 items-center justify-between border-b px-5 py-1">
                    <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[20px] leading-7 font-semibold tracking-[-0.015em]">
                        Catalogue
                    </h1>
                </div>
            ) : (
                <div className="px-page flex items-center gap-3 pt-5">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                        <h1 className="font-brand text-on-surface shrink-0 text-[20px] leading-7 font-semibold tracking-[-0.015em]">
                            Catalogue
                        </h1>
                        {/* Le porte-voix **est** le compteur de l'en-tête au rail (00.4 :
                        « titre + compteur, sans filet »). Il vivait deux bandes plus bas
                        en Archivo 28, sous un « N types » qui redisait la moitié de sa
                        phrase : trois compteurs se recoupaient avant la première rangée.
                        Au téléphone il reste où 09.1 le dessine — dans la page, en 28. */}
                        <span className="text-text-secondary min-w-0 truncate text-[13px] leading-5">
                            <b className="font-brand text-on-surface font-semibold tabular-nums">
                                {modelCountLabel}
                            </b>
                            {` au catalogue, sous ${typeCountLabel}`}
                        </span>
                    </div>
                    <span className="flex-1" />
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Plus} size={18} />}
                        onClick={() => setIsAddSheetOpen(true)}
                    >
                        Ajouter au catalogue
                    </Button>
                </div>
            )}

            <OfflineBanner />

            {/* LA BANDE — `.seek` : le champ et le bouton de filtre à 8 px, la rangée
                de familles 10 px dessous. Chrome attaché à l'en-tête au téléphone
                (surface + filet), simple bande de page au rail (§2.37, 00.4).
                Elle disparaît avec le référentiel vide : un outil qui trie ce qui
                n'existe pas apprend que l'écran est cassé. */}
            {!isReferentialEmpty && (
                <div
                    className={cn(
                        'flex flex-col gap-2.5',
                        isCompact
                            ? 'border-outline-variant bg-surface border-b px-5 py-3'
                            : 'px-page pt-4',
                    )}
                >
                    <Reading className="flex items-center gap-2">
                        <SearchField
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Type, modèle, marque"
                            className="flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => setIsFilterSheetOpen(true)}
                            aria-label="Filtrer"
                            className="border-outline text-on-surface hover:bg-surface-container focus-visible:ring-focus-ring relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                        >
                            <Icon glyph={Funnel} size={20} />
                            {sheetFilterCount > 0 && (
                                <span className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-[18px] font-semibold tabular-nums">
                                    {sheetFilterCount}
                                </span>
                            )}
                        </button>
                    </Reading>

                    {/* Les pastilles de famille (A2) — à 393 px elles défilent, dès 600
                        elles tiennent toutes : un filtre qu'on ne voit pas se choisit à
                        l'aveugle. */}
                    <Reading className="overflow-hidden">
                        <div
                            className={cn(
                                'flex [scrollbar-width:none] gap-2 overflow-x-auto',
                                isCompact ? 'pr-1' : 'flex-wrap',
                            )}
                        >
                            {familyFacets.map((facet) => (
                                <FacetChip
                                    key={facet.id}
                                    label={facet.label}
                                    count={facet.count}
                                    selected={facet.id === familyFilter}
                                    onClick={() => setFamilyFilter(facet.id)}
                                />
                            ))}
                        </div>
                    </Reading>
                </div>
            )}

            {/* `.page` — 16 px de haut, 20 de côté et de bas. La planche pousse le bas
                à 92 quand le bouton flottant occupe le coin ; 56 de ces 92 sont la
                barre du bas, que la mise en page porte déjà (`pb-16` sur le contenu).
                Restent 36 : sans eux, la dernière rangée passe sous le bouton. */}
            <div
                className={cn(
                    'medium:px-page flex flex-1 flex-col px-5 pt-4 pb-5',
                    isCompact && !isReferentialEmpty && 'pb-9',
                )}
            >
                {isReferentialEmpty ? (
                    /* Le référentiel vide — colonne 4 de 09.1. Il ne compte pas jusqu'à
                       zéro : il dit la conséquence, puis met le seul geste utile à
                       portée. */
                    <ScreenState
                        icon={FolderOpen}
                        title="Le catalogue est vide"
                        description={
                            <>
                                Sans type ni modèle,{' '}
                                <b className="text-on-surface font-medium">
                                    aucun équipement ne peut être créé
                                </b>{' '}
                                : la fiche d'un actif tire sa marque, son type et sa durée
                                d'amortissement d'ici.
                            </>
                        }
                        actions={
                            <Button
                                variant="filled"
                                icon={<Icon glyph={Plus} size={18} />}
                                onClick={openAddCategory}
                            >
                                Créer le premier type
                            </Button>
                        }
                        footnote="L'import en masse demande les clés de la donnée : il attend qu'un premier type existe."
                    />
                ) : (
                    <Reading className="flex flex-col">
                        {/* LE PORTE-VOIX — `.pv`, Archivo 28 : le nombre de modèles, parce
                            que c'est lui qui décide de ce qu'on peut créer. Au rail il est
                            monté dans l'en-tête, où 00.4 attend le compteur. */}
                        {isCompact && (
                            <div className="px-0.5 pb-0.5">
                                <b className="font-brand text-on-surface block text-[28px] leading-8 font-semibold tracking-[-0.02em] tabular-nums">
                                    {modelCountLabel}
                                </b>
                                <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                    au catalogue, sous {typeCountLabel} — c'est ce nombre qui décide
                                    de ce qu'on peut créer.
                                </span>
                            </div>
                        )}

                        {/* `.cnt` et son tri — 44 px, 13 px, le second fait à gauche. */}
                        <div className="text-text-secondary flex min-h-11 items-center justify-between gap-3 px-0.5 text-[13px]">
                            <span className="whitespace-nowrap">
                                <b className="text-on-surface font-semibold tabular-nums">
                                    {familyFacets.length - 1}
                                </b>{' '}
                                familles ·{' '}
                                <b className="text-on-surface font-semibold tabular-nums">
                                    {equipment.length}
                                </b>{' '}
                                actifs au parc
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)
                                }
                                className="text-on-surface hover:bg-surface-container -mr-2 flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2 text-[13px] font-medium"
                            >
                                <Icon
                                    glyph={SortAscending}
                                    size={18}
                                    className="text-text-secondary"
                                />
                                {SORT_OPTIONS[sortIndex].label}
                            </button>
                        </div>

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
                                <div className="flex flex-col gap-5">
                                    {categoriesByFamily.map(({ family, items }) => (
                                        <section key={family}>
                                            <div className="text-on-surface flex items-baseline justify-between gap-3 px-0.5 pb-2 text-[13px] font-medium">
                                                <span className="min-w-0 truncate">{family}</span>
                                                <span className="text-text-secondary shrink-0 text-[12px] font-normal tabular-nums">
                                                    {items.length} type{items.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="rounded-card bg-surface p-4">
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
                                                            reference={dataKey}
                                                            onOpen={() => onCategoryClick?.(cat.id)}
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
            {isCompact && !isReferentialEmpty && (
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
