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

export interface AuditMobileFilters {
    country: string;
    site: string;
    service: string;
    status: string;
}

interface AuditOverviewMobileProps {
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
    filters: AuditMobileFilters;
    filterOptions: Record<FilterKey, SelectOption[]>;
    onFilterChange: (key: FilterKey, value: string) => void;
    onResetFilters: () => void;
    onOpenService: (row: ServiceAuditRow) => void;
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
        <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-body-small font-medium', config.colorClass)}>
            <Icon glyph={config.glyph} size={16} />
            {config.label}
        </span>
    );
};

export const AuditOverviewMobile: React.FC<AuditOverviewMobileProps> = ({
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
                        filterOptions[key].find((option) => option.value === filters[key])?.label
                        ?? filters[key]
                    }`,
                })),
        [filterOptions, filters]
    );

    const isCampaignActive = totals.found > 0 || totals.missing > 0 || totals.activeCampaigns > 0;
    const isScopeFiltered = filters.country !== ALL_VALUE || filters.site !== ALL_VALUE || filters.service !== ALL_VALUE;

    return (
        <div className="space-y-4 pb-12">
            <header className="flex flex-col gap-1">
                <h1 className="font-brand text-[22px] font-semibold tracking-[-0.015em] text-on-surface">Audit</h1>
                <p className="text-body-small text-text-secondary">
                    {scopedServiceCount} service{scopedServiceCount > 1 ? 's' : ''} · {isScopeFiltered ? (filters.country !== ALL_VALUE ? filters.country : 'périmètre filtré') : 'tout le parc'}
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
                    { id: 'details', label: 'Détails campagne' },
                ]}
            />

            {/* Bandeau de périmètre actif (Planche 16.1) */}
            {isScopeFiltered && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-surface-container p-3 text-body-small text-on-surface">
                    <div className="flex items-center gap-2 min-w-0">
                        <Icon glyph={Funnel} size={16} className="text-text-secondary shrink-0" />
                        <span className="truncate">
                            Périmètre <strong>{filters.country !== ALL_VALUE ? filters.country : 'actif'}</strong>
                        </span>
                    </div>
                    <Button variant="text" size="sm" onClick={onResetFilters} className="h-auto min-h-0 p-0 text-body-small underline shrink-0">
                        Tout voir
                    </Button>
                </div>
            )}

            {/* Porte-voix (Planche 16.1) */}
            <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-baseline gap-2">
                    <b className="font-brand text-[30px] font-semibold tracking-[-0.02em] tabular-nums text-on-surface">
                        {isCampaignActive ? totals.missing : totals.expected}
                    </b>
                    <span className="text-body-medium text-text-secondary">
                        {isCampaignActive
                            ? `manquant${totals.missing > 1 ? 's' : ''}, et ${totals.exceptions} écart${totals.exceptions > 1 ? 's' : ''}`
                            : 'actifs attendus, aucun vérifié'}
                    </span>
                </div>
                <p className="text-body-small text-text-secondary">
                    {isCampaignActive ? (
                        <>
                            Sur <strong>{totals.expected} attendus</strong>, {totals.found} retrouvés. Les {totals.missing} manquants demandent une décision.
                        </>
                    ) : (
                        <>
                            <strong>Dernier inventaire : jamais.</strong> Le parc compte {totals.expected} actifs attendus dans ce périmètre.
                        </>
                    )}
                </p>
            </div>

            {/* Bloc des 4 chiffres — en campagne seulement (Planche 16.1 Relevé V2) */}
            {isCampaignActive && (
                <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                    <div className="flex divide-x divide-outline-variant">
                        <div className="flex-1 min-w-0 px-2 first:pl-0">
                            <p className="font-brand text-[20px] font-semibold tabular-nums text-on-surface">{totals.expected}</p>
                            <p className="text-body-small text-text-secondary">attendus</p>
                        </div>
                        <div className="flex-1 min-w-0 px-2">
                            <p className="font-brand text-[20px] font-semibold tabular-nums text-on-surface">{totals.found}</p>
                            <p className="text-body-small text-text-secondary">retrouvés</p>
                        </div>
                        <div className="flex-1 min-w-0 px-2">
                            <p className="font-brand text-[20px] font-semibold tabular-nums text-error">{totals.missing}</p>
                            <p className="text-body-small text-text-secondary">manquants</p>
                        </div>
                        <div className="flex-1 min-w-0 px-2 last:pr-0">
                            <p className="font-brand text-[20px] font-semibold tabular-nums text-[var(--tk-color-st-orange)]">{totals.exceptions}</p>
                            <p className="text-body-small text-text-secondary">écarts</p>
                        </div>
                    </div>

                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-container">
                        <div
                            className="h-full bg-on-surface transition-all duration-300"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                    <p className="mt-2 text-body-small text-text-secondary tabular-nums">
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
                        filterPanelId="audit-mobile-filter-sheet"
                        filterCount={activeFilters.length}
                        placeholder="Rechercher un service"
                    />
                </div>
            </div>

            {/* Liste des services */}
            <div className="flex items-baseline justify-between text-body-small text-text-secondary px-0.5">
                <span>Les jamais vérifiés d'abord</span>
                <span className="font-brand font-semibold tabular-nums text-on-surface">
                    {rows.length} service{rows.length > 1 ? 's' : ''} · {totals.expected} attendu{totals.expected > 1 ? 's' : ''}
                </span>
            </div>

            {rows.length === 0 ? (
                <section className="flex flex-col items-center justify-center gap-3 rounded-lg bg-surface p-8 text-center shadow-elevation-1">
                    <Icon glyph={MagnifyingGlassMinus} size={36} className="text-text-secondary" />
                    <div>
                        <h3 className="font-brand text-body-large font-semibold text-on-surface">
                            Aucun service ne correspond
                        </h3>
                        <p className="mt-1 text-body-small text-text-secondary max-w-[280px]">
                            Élargissez le périmètre ou effacez la recherche pour afficher les services du parc.
                        </p>
                    </div>
                    <Button variant="outlined" size="sm" onClick={onResetFilters}>
                        Effacer les filtres
                    </Button>
                </section>
            ) : (
                <section className="rounded-lg bg-surface shadow-elevation-1 divide-y divide-outline-variant overflow-hidden">
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
                            className="flex min-h-[64px] w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-surface-container cursor-pointer"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-text-secondary">
                                <Icon glyph={Buildings} size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <span className="block truncate font-brand text-body-medium font-semibold text-on-surface">
                                    {row.service}
                                </span>
                                <div className="mt-0.5 flex items-center gap-2 text-body-small text-text-secondary">
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
                                        onOpenService(row);
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
                                <Icon glyph={CaretRight} size={18} className="shrink-0 text-text-secondary" />
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* Bouton principal de pied de page (Planche 16.1) */}
            <Button
                variant="filled"
                className="w-full justify-center mt-2"
                onClick={onStartAudit}
            >
                <Icon glyph={Play} size={18} />
                Lancer une campagne sur ce périmètre
            </Button>

            {/* Feuille de filtre (Planche 16.1 Colonne 3) */}
            <BottomSheet
                id="audit-mobile-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Périmètre"
            >
                <div className="space-y-4">
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                        <SelectField
                            key={key}
                            label={FILTER_LABELS[key]}
                            name={`auditMobile-${key}`}
                            value={filters[key]}
                            onChange={(event) => onFilterChange(key, event.target.value)}
                            options={filterOptions[key]}
                        />
                    ))}

                    <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
                        <Button
                            variant="ghost"
                            onClick={onResetFilters}
                        >
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
        </div>
    );
};
