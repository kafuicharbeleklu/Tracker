import React, { useMemo, useState } from 'react';
import {
    Buildings,
    CaretRight,
    CheckCircle,
    CircleDashed,
    CircleHalf,
    ClockCountdown,
    Funnel,
    MagnifyingGlassMinus,
    Play,
} from '@phosphor-icons/react';
import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { PageTabs } from '../../../components/ui/PageTabs';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import SelectField from '../../../components/ui/SelectField';
import { cn } from '../../../lib/utils';
import { ALL_VALUE, ServiceAuditRow } from '../serviceAudit';

type FilterKey = 'country' | 'site' | 'service' | 'status';

interface SelectOption {
    value: string;
    label: string;
}

export interface AuditScopeFilters {
    country: string;
    site: string;
    service: string;
    status: string;
}

interface AuditOverviewProps {
    rows: ServiceAuditRow[];
    scopedServiceCount: number;
    totals: {
        expected: number;
        found: number;
        missing: number;
        exceptions: number;
        coverage: number;
        activeCampaigns: number;
    };
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: AuditScopeFilters;
    filterOptions: Record<FilterKey, SelectOption[]>;
    onFilterChange: (key: FilterKey, value: string) => void;
    onResetFilters: () => void;
    onOpenService: (row: ServiceAuditRow) => void;
    /** Lancer la campagne du service porté par la rangée — le geste de `.rbtn`. */
    onStartService: (row: ServiceAuditRow) => void;
    /** Les actifs qu'aucun service du référentiel ne réclame (dette V3). */
    unscopedAssets: number;
    onStartAudit: () => void;
    onOpenDetailsTab: () => void;
}

const FILTER_LABELS: Record<FilterKey, string> = {
    country: 'Pays',
    site: 'Site',
    service: 'Service',
    status: 'Statut',
};

const statusConfig = (status: ServiceAuditRow['status']) => {
    switch (status) {
        case 'Complet':
            return {
                label: 'complet',
                glyph: CheckCircle,
                colorClass: 'text-[var(--tk-color-st-vert)]',
            };
        case 'En cours':
            return {
                label: 'en cours',
                glyph: CircleHalf,
                colorClass: 'text-[var(--tk-color-st-bleu)]',
            };
        case 'A lancer':
            return {
                label: 'à lancer',
                glyph: ClockCountdown,
                colorClass: 'text-[var(--tk-color-st-ambre)]',
            };
        default:
            return {
                label: 'rien à auditer',
                glyph: CircleDashed,
                colorClass: 'text-text-secondary',
            };
    }
};

const StatusBadge: React.FC<{ status: ServiceAuditRow['status'] }> = ({ status }) => {
    const config = statusConfig(status);
    return (
        <span
            className={cn(
                'text-body-small inline-flex shrink-0 items-center gap-1.5 font-medium',
                config.colorClass,
            )}
        >
            <Icon glyph={config.glyph} size={16} />
            {config.label}
        </span>
    );
};

export const AuditOverview: React.FC<AuditOverviewProps> = ({
    rows,
    scopedServiceCount,
    totals,
    searchQuery,
    onSearchChange,
    filters,
    filterOptions,
    onFilterChange,
    onResetFilters,
    onOpenService,
    onStartService,
    unscopedAssets,
    onStartAudit,
    onOpenDetailsTab,
}) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilters = useMemo(
        () =>
            (Object.keys(FILTER_LABELS) as FilterKey[])
                .filter((key) => filters[key] !== ALL_VALUE)
                .map((key) => ({
                    key,
                    label: `${FILTER_LABELS[key]} · ${
                        filterOptions[key].find((option) => option.value === filters[key])?.label ??
                        filters[key]
                    }`,
                })),
        [filterOptions, filters],
    );

    /**
     * **Les trois moments de l'écran** (16.1, colonnes 1 et 2). Au repos, rien n'a été
     * scanné. En campagne, l'écart décide. Et quand la campagne est propre, le seul
     * geste restant est de clôturer — ce n'est pas le même écran que « il reste des
     * décisions à prendre », et il ne se dit pas avec les mêmes mots.
     */
    const isCampaignActive =
        totals.found > 0 ||
        totals.missing > 0 ||
        totals.exceptions > 0 ||
        totals.activeCampaigns > 0;
    const hasPendingDecisions = totals.missing > 0 || totals.exceptions > 0;
    const isCampaignClean = isCampaignActive && !hasPendingDecisions;
    const isScopeFiltered =
        filters.country !== ALL_VALUE ||
        filters.site !== ALL_VALUE ||
        filters.service !== ALL_VALUE;

    /**
     * **Le périmètre courant se lit dans la barre du haut, et il se retire d'un tap**
     * (16.1). Il nommait le pays et lui seul : une portée posée sur un site ou un
     * service s'affichait « périmètre actif », ce qui ne dit rien — or *« un périmètre
     * ne s'applique jamais en silence »*. Il nomme désormais l'axe le plus fin des
     * trois, celui qui décide réellement de ce qu'on voit.
     */
    const scopeLabel =
        filters.service !== ALL_VALUE
            ? filters.service
            : filters.site !== ALL_VALUE
              ? filters.site
              : filters.country !== ALL_VALUE
                ? filters.country
                : 'tout le parc';

    return (
        <Reading className="space-y-4 pb-12">
            <header className="flex flex-col gap-1">
                <h1 className="font-brand text-on-surface text-[22px] font-semibold tracking-[-0.015em]">
                    Audit
                </h1>
                <p className="text-body-small text-text-secondary">
                    <span className="tabular-nums">{scopedServiceCount}</span> service
                    {scopedServiceCount > 1 ? 's' : ''} · {scopeLabel}
                </p>
            </header>

            <PageTabs
                appearance="neutral"
                allViewsButton={false}
                idBase="audit-overview"
                ariaLabel="Vues de l'audit"
                activeId="overview"
                onChange={(tabId) => {
                    if (tabId === 'details') onOpenDetailsTab();
                }}
                items={[
                    { id: 'overview', label: 'Vue globale' },
                    /* La puce dit **combien de décisions attendent** de l'autre côté :
                       sans elle, l'onglet ne se distingue pas d'un onglet vide (16.1). */
                    {
                        id: 'details',
                        label: 'Détails campagne',
                        shortLabel: 'Détails',
                        /* Elle compte **les manquants et les écarts** — les décisions en
                           attente —, pas les actifs scannés, et elle n'apparaît que
                           lorsqu'il y en a. */
                        badge: hasPendingDecisions ? totals.missing + totals.exceptions : undefined,
                    },
                ]}
            />

            {/* Bandeau de périmètre actif (Planche 16.1) */}
            {isScopeFiltered && (
                <div className="bg-surface-container text-body-small text-on-surface flex items-center justify-between gap-2 rounded-md p-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Icon glyph={Funnel} size={16} className="text-text-secondary shrink-0" />
                        <span className="truncate">
                            {/* V1 est corrigé : l'écran ne pose plus de périmètre tout seul.
                                Le bandeau ne dit donc plus « posé à l'ouverture, pas par
                                vous » — il nomme la portée et met sa sortie à côté. */}
                            Périmètre <strong>{scopeLabel}</strong>
                        </span>
                    </div>
                    <Button
                        variant="text"
                        size="sm"
                        onClick={onResetFilters}
                        className="text-body-small h-auto min-h-0 shrink-0 p-0 underline"
                    >
                        Tout voir
                    </Button>
                </div>
            )}

            {/* Porte-voix (Planche 16.1) */}
            <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-baseline gap-2">
                    <b className="font-brand text-on-surface text-[30px] font-semibold tracking-[-0.02em] tabular-nums">
                        {hasPendingDecisions
                            ? totals.missing
                            : isCampaignClean
                              ? totals.found
                              : totals.expected}
                    </b>
                    <span className="text-body-medium text-text-secondary">
                        {hasPendingDecisions
                            ? `manquant${totals.missing > 1 ? 's' : ''}, et ${totals.exceptions} écart${totals.exceptions > 1 ? 's' : ''}`
                            : isCampaignClean
                              ? `retrouvés sur ${totals.expected}`
                              : `actif${totals.expected > 1 ? 's' : ''} attendu${totals.expected > 1 ? 's' : ''}, aucun vérifié`}
                    </span>
                </div>
                <p className="text-body-small text-text-secondary">
                    {hasPendingDecisions ? (
                        <>
                            Sur <strong>{totals.expected} attendus</strong>, {totals.found}{' '}
                            retrouvés. Les {totals.missing} manquants et les {totals.exceptions}{' '}
                            objets trouvés hors campagne sont les{' '}
                            <strong>seules lignes qui demandent une décision</strong> — le reste est
                            déjà vérifié.
                        </>
                    ) : isCampaignClean ? (
                        <>
                            <strong>Aucun écart.</strong> La campagne peut être clôturée telle
                            quelle : c'est le seul cas où la clôture ne retire aucun actif d'un
                            service.
                        </>
                    ) : (
                        <>
                            <strong>Dernier inventaire : jamais.</strong> Le parc compte{' '}
                            {totals.expected} actif
                            {totals.expected > 1 ? 's' : ''} attendu{totals.expected > 1 ? 's' : ''}{' '}
                            dans ce périmètre.
                        </>
                    )}
                </p>
            </div>

            {/* Bloc des 4 chiffres — en campagne seulement (Planche 16.1 Relevé V2) */}
            {isCampaignActive && (
                <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
                    <div className="divide-outline-variant flex divide-x">
                        <div className="min-w-0 flex-1 px-2 first:pl-0">
                            <p className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                {totals.expected}
                            </p>
                            <p className="text-body-small text-text-secondary">attendus</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2">
                            <p className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                {totals.found}
                            </p>
                            <p className="text-body-small text-text-secondary">retrouvés</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2">
                            <p className="font-brand text-error text-[20px] font-semibold tabular-nums">
                                {totals.missing}
                            </p>
                            <p className="text-body-small text-text-secondary">manquants</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2 last:pr-0">
                            <p className="font-brand text-[20px] font-semibold text-[var(--tk-color-st-orange)] tabular-nums">
                                {totals.exceptions}
                            </p>
                            <p className="text-body-small text-text-secondary">écarts</p>
                        </div>
                    </div>

                    <div className="bg-surface-container mt-3 h-1 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-on-surface h-full transition-all duration-300"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                    <p className="text-body-small text-text-secondary mt-2 tabular-nums">
                        {totals.found} sur {totals.expected} · {totals.coverage} %
                    </p>
                </section>
            )}

            {/* Barre de recherche et filtres */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <SearchFilterBar
                        searchValue={searchQuery}
                        onSearchChange={onSearchChange}
                        onFilterClick={() => setFiltersOpen(true)}
                        filterActive={filtersOpen}
                        filterPanelId="audit-scope-filter-sheet"
                        filterCount={activeFilters.length}
                        placeholder="Rechercher un service"
                    />
                </div>
            </div>

            {/* Liste des services */}
            <div className="text-body-small text-text-secondary flex items-baseline justify-between px-0.5">
                <span>Les jamais vérifiés d'abord</span>
                <span className="font-brand text-on-surface font-semibold tabular-nums">
                    {rows.length} service{rows.length > 1 ? 's' : ''} · {totals.expected} attendu
                    {totals.expected > 1 ? 's' : ''}
                </span>
            </div>

            {rows.length === 0 ? (
                <section className="bg-surface shadow-elevation-1 flex flex-col items-center justify-center gap-3 rounded-lg p-8 text-center">
                    <Icon glyph={MagnifyingGlassMinus} size={36} className="text-text-secondary" />
                    <div>
                        <h3 className="font-brand text-body-large text-on-surface font-semibold">
                            Aucun service ne correspond
                        </h3>
                        <p className="text-body-small text-text-secondary mt-1 max-w-[280px]">
                            Élargissez le périmètre ou effacez la recherche pour afficher les
                            services du parc.
                        </p>
                    </div>
                    <Button variant="outlined" size="sm" onClick={onResetFilters}>
                        Effacer les filtres
                    </Button>
                </section>
            ) : (
                <section className="bg-surface shadow-elevation-1 divide-outline-variant divide-y overflow-hidden rounded-lg">
                    {rows.map((row) => (
                        <div
                            key={`${row.country}-${row.site}-${row.service}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenService(row)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onOpenService(row);
                                }
                            }}
                            className="hover:bg-surface-container flex min-h-[64px] w-full cursor-pointer items-center gap-3 p-3.5 text-left transition-colors"
                        >
                            <div className="bg-surface-container text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                                <Icon glyph={Buildings} size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <span className="font-brand text-body-medium text-on-surface block truncate font-semibold">
                                    {row.service}
                                </span>
                                <div className="text-body-small text-text-secondary mt-0.5 flex items-center gap-2">
                                    <span className="truncate">{row.site}</span>
                                    <span>·</span>
                                    <StatusBadge status={row.status} />
                                </div>
                            </div>

                            {row.status === 'A lancer' ? (
                                <Button
                                    variant="tonal"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStartService(row);
                                    }}
                                    className="shrink-0"
                                >
                                    Lancer
                                </Button>
                            ) : row.status === 'En cours' ? (
                                <Button
                                    variant="filled"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenService(row);
                                    }}
                                    className="shrink-0"
                                >
                                    Reprendre
                                </Button>
                            ) : (
                                <Icon
                                    glyph={CaretRight}
                                    size={18}
                                    className="text-text-secondary shrink-0"
                                />
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* `.hint` — **ce n'est pas un état vide de dessin, c'est une donnée à
                réconcilier** : les actifs portent un département là où le référentiel
                porte un service, et les deux vocabulaires ne se recoupent pas (16.1,
                dette V3). La planche le dit en clair sous la liste. */}
            {unscopedAssets > 0 && (
                <p className="text-body-small text-text-secondary px-0.5 leading-[17px]">
                    <strong className="text-on-surface font-medium">
                        {unscopedAssets} actif{unscopedAssets > 1 ? 's' : ''} n'
                        {unscopedAssets > 1 ? 'entrent' : 'entre'} dans aucune campagne
                    </strong>
                    {
                        " — ils ne sont rattachés à aucun service du référentiel. Ce n'est pas un vide de dessin : c'est une donnée à réconcilier."
                    }
                </p>
            )}

            {/* Bouton principal de pied de page (Planche 16.1) */}
            <Button variant="filled" className="mt-2 w-full justify-center" onClick={onStartAudit}>
                <Icon glyph={Play} size={18} />
                Lancer une campagne sur ce périmètre
            </Button>

            {/* Feuille de filtre (Planche 16.1 Colonne 3) */}
            <BottomSheet
                id="audit-scope-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Périmètre"
            >
                <div className="space-y-4">
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                        <SelectField
                            key={key}
                            label={FILTER_LABELS[key]}
                            name={`auditScope-${key}`}
                            value={filters[key]}
                            onChange={(event) => onFilterChange(key, event.target.value)}
                            options={filterOptions[key]}
                        />
                    ))}

                    <div className="border-outline-variant flex items-center gap-3 border-t pt-2">
                        <Button variant="ghost" onClick={onResetFilters}>
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="flex-1 justify-center"
                            onClick={() => setFiltersOpen(false)}
                        >
                            Voir les {rows.length} services
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </Reading>
    );
};
