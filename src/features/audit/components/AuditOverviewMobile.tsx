import React, { useMemo, useRef, useState } from 'react';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Chip from '../../../components/ui/Chip';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FabContainer } from '../../../components/ui/FabContainer';
import FloatingActionButton from '../../../components/ui/FloatingActionButton';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { PageTabs } from '../../../components/ui/PageTabs';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import SelectField from '../../../components/ui/SelectField';
import { useHideOnScrollDown } from '../../../hooks/useHideOnScrollDown';
import { cn } from '../../../lib/utils';
import { ALL_VALUE, formatLastScan, ServiceAuditRow, STATUS_LABELS } from '../serviceAudit';

/**
 * Écran Audit — vue COMPACTE (< 600 px), premier écran passé à l'ADN mobile v1
 * (DESIGN_BRIEF.md du 2026-07-25).
 *
 * Ce fichier ne rend QUE le compact : medium et expanded restent servis par le
 * rendu historique de `PhysicalAuditView`, inchangé au pixel. La bascule est
 * volontairement écran par écran (brief §9), d'où le namespace de classes `adn-*`
 * qui ne touche aucun autre écran.
 *
 * Décisions de l'ADN appliquées ici :
 *   §1  jaune limité à DEUX usages sur l'écran — le FAB et la destination active de
 *       la barre du bas ; rien d'autre n'est jaune (ni onglet, ni barre de
 *       progression, ni chip).
 *   §2  deux graisses : 400 (corps) et 500 (valeurs, titres, actions). Les crans
 *       du typescale qui portent 600/700 sont remplacés par leur variante `-plain`
 *       (index.css) — un `font-medium` à l'appel serait perdu dans la cascade.
 *   §3  cartes blanches, rayon 14, SANS bordure ni ombre, sur canvas teinté ;
 *       2 niveaux d'imbrication maximum (carte > rangée).
 *   §4  onglets = segmented neutre ; filtres = bouton unique + compteur + chips ;
 *       stats = UNE carte à séparateurs ; état vide « intelligent ».
 *   §8  aucune MAJUSCULE hors code technique, aucun bouton désactivé accompagné
 *       d'une phrase d'instruction (les deux boutons morts de l'en-tête ont
 *       disparu : l'action « Ouvrir » vit sur la carte du service).
 */

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
    /** Nombre de services du PÉRIMÈTRE (pays/site/service) — base du sous-titre et des KPI. */
    scopedServiceCount: number;
    totals: {
        expected: number;
        found: number;
        missing: number;
        exceptions: number;
        coverage: number;
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

/**
 * Tons de statut. Le brief ne connaît que rouge / vert / ambre + neutres (§1) et
 * interdit d'empiler des sémantiques décoratives : « À lancer » et « En cours »
 * partagent donc l'ambre — c'est le LIBELLÉ qui les distingue, pas une 4ᵉ couleur.
 */
const STATUS_TONES: Record<ServiceAuditRow['status'], string> = {
    'A lancer': 'bg-adn-warning-light text-adn-warning-strong',
    'En cours': 'bg-adn-warning-light text-adn-warning-strong',
    Complet: 'bg-success-light text-adn-success',
    'A planifier': 'bg-adn-surface-muted text-adn-text-secondary',
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
    `${count} ${count > 1 ? pluralForm : singular}`;

const StatusBadge: React.FC<{ status: ServiceAuditRow['status'] }> = ({ status }) => (
    <span
        className={cn(
            'inline-flex shrink-0 items-center rounded-adn-control px-2 py-1 text-body-small',
            STATUS_TONES[status],
        )}
    >
        {STATUS_LABELS[status]}
    </span>
);

/** Rangée de 4 stats d'une carte de service : valeur 14/500, micro-label 11 bas de casse. */
const ServiceStats: React.FC<{ row: ServiceAuditRow }> = ({ row }) => {
    const cells = [
        { label: 'Attendus', value: row.expected, danger: false },
        { label: 'Scannés', value: row.found, danger: false },
        { label: 'Manquants', value: row.missing, danger: row.missing > 0 },
        { label: 'Écarts', value: row.exceptions, danger: false },
    ];

    return (
        <div className="mt-3 flex">
            {cells.map((cell) => (
                <div key={cell.label} className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'text-title-small tabular-nums',
                            cell.danger ? 'text-adn-danger' : 'text-adn-text',
                        )}
                    >
                        {cell.value}
                    </p>
                    <p className="text-label-small-plain text-adn-text-secondary">{cell.label}</p>
                </div>
            ))}
        </div>
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
    const anchorRef = useRef<HTMLDivElement>(null);
    const fabHidden = useHideOnScrollDown(anchorRef);

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
        [filterOptions, filters],
    );

    // Sous-titre contextuel (§5) : la 2ᵉ partie disparaît quand il n'y a rien à traiter —
    // un « 0 manquant » affiché serait du bruit, pas une information.
    const subtitle = totals.missing > 0
        ? `${plural(scopedServiceCount, 'service')} · ${plural(totals.missing, 'manquant')} à traiter`
        : plural(scopedServiceCount, 'service');

    const kpis = [
        { label: 'Attendus', value: totals.expected, danger: false },
        { label: 'Scannés', value: totals.found, danger: false },
        { label: 'Manquants', value: totals.missing, danger: totals.missing > 0 },
        { label: 'Écarts', value: totals.exceptions, danger: false },
    ];

    return (
        // pb-20 : dégagement pour le FAB (52 px flottant à 88 px du bas) — la dernière
        // carte reste entièrement atteignable (brief §5, « padding-bottom suffisant »).
        <div ref={anchorRef} className="space-y-6 pb-20">
            <header>
                <h1 className="text-headline-medium-plain text-adn-text">Audit</h1>
                <p className="mt-1 text-body-medium text-adn-text-secondary">{subtitle}</p>
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
                    { id: 'details', label: 'Détails' },
                ]}
            />

            {/* Bloc KPI — UNE carte à séparateurs verticaux (§4 : « pas une mini-carte
                par chiffre », 4 stats maximum). « Campagnes actives » et « Couverture »
                quittent ce bloc : la couverture est reprise par la ligne de progression
                ci-dessous et vit déjà dans l'onglet Détails. */}
            <Card
                variant="outlined"
                className="min-h-0 rounded-adn-card border-0 shadow-none"
            >
                <div className="flex divide-x divide-adn-line">
                    {kpis.map((kpi) => (
                        <div key={kpi.label} className="min-w-0 flex-1 px-2 first:pl-0 last:pr-0">
                            <p
                                className={cn(
                                    'text-stat-value-mobile tabular-nums',
                                    kpi.danger ? 'text-adn-danger' : 'text-adn-text',
                                )}
                            >
                                {kpi.value}
                            </p>
                            <p className="text-body-small text-adn-text-secondary">{kpi.label}</p>
                        </div>
                    ))}
                </div>

                {/* Barre 4 px — remplissage ENCRE, pas jaune : le jaune est déjà pris par le
                    FAB et la nav (§1, deux usages maximum). Bords francs : l'échelle de
                    rayons s'arrête à 4 px et une barre de 4 px de haut n'a pas de coin
                    à adoucir — l'identité voulue reste carrée (§3, Q-B5). */}
                <div
                    className="mt-4 h-1 w-full overflow-hidden bg-adn-surface-muted"
                    role="progressbar"
                    aria-valuenow={totals.coverage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progression de l'audit"
                >
                    <div
                        className="h-full bg-adn-text transition-[width] duration-medium2 ease-standard-decelerate"
                        style={{ width: `${totals.coverage}%` }}
                    />
                </div>
                <p className="mt-2 text-body-small text-adn-text-secondary tabular-nums">
                    Progression {totals.found}/{totals.expected} · {totals.coverage} %
                </p>
            </Card>

            <div className="space-y-3">
                {/* Filtres : un bouton unique à compteur + chips (§4). Les trois selects
                    empilés en tête de liste ont disparu — ils vivent dans la feuille. */}
                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={onSearchChange}
                    onFilterClick={() => setFiltersOpen(true)}
                    filterActive={filtersOpen}
                    filterPanelId="audit-mobile-filter-sheet"
                    filterCount={activeFilters.length}
                    placeholder="Rechercher un service"
                    className="rounded-adn-control border-outline shadow-none"
                    filterButtonClassName="rounded-adn-control"
                />

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {activeFilters.map((filter) => (
                            <Chip
                                key={filter.key}
                                variant="input"
                                label={filter.label}
                                onClose={() => onFilterChange(filter.key, ALL_VALUE)}
                                className="rounded-adn-control border-0 bg-adn-surface-muted text-adn-text text-label-large-plain"
                            />
                        ))}
                    </div>
                )}
            </div>

            {rows.length === 0 ? (
                <Card variant="outlined" className="min-h-0 rounded-adn-card border-0 shadow-none">
                    {/* La primitive titre porte 700, soit une 3ᵉ graisse sur l'écran
                        (interdit §8.5) : ramenée à la graisse forte de l'ADN. */}
                    <EmptyState
                        icon="search_off"
                        title="Aucun service ne correspond"
                        description="Élargissez le périmètre ou effacez la recherche."
                        action={
                            <Button variant="text" className="text-label-large-plain" onClick={onResetFilters}>
                                Effacer les filtres
                            </Button>
                        }
                        titleClassName="text-title-medium-plain"
                        className="px-0 py-4"
                    />
                </Card>
            ) : (
                <div className="space-y-3">
                    {rows.map((row) => (
                        <Card
                            key={`${row.country}-${row.site}-${row.service}`}
                            variant="outlined"
                            onClick={() => onOpenService(row)}
                            ariaLabel={`Ouvrir l'audit du service ${row.service}, ${row.site}`}
                            // Carte de l'ADN : ni bordure ni ombre, rayon 14, pressé = fond
                            // neutre opaque en 100 ms (§6) plutôt qu'une mise à l'échelle.
                            className="min-h-0 rounded-adn-card border-0 shadow-none duration-short2 hover:bg-surface active:scale-100 active:bg-adn-pressed"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-title-medium-plain text-adn-text">
                                        {row.service}
                                    </p>
                                    <p className="mt-0.5 truncate text-body-small text-adn-text-secondary">
                                        {row.site} · {row.country}
                                    </p>
                                </div>
                                <StatusBadge status={row.status} />
                            </div>

                            {/* État vide intelligent (§4) : pas de grille de zéros. */}
                            {row.expected === 0 ? (
                                <p className="mt-3 text-body-medium text-adn-text-secondary">
                                    Aucun actif attendu
                                </p>
                            ) : (
                                <ServiceStats row={row} />
                            )}

                            <div className="mt-3 flex items-center justify-between gap-3 border-t border-adn-line pt-3">
                                <span className="min-w-0 truncate text-body-small text-adn-text-secondary">
                                    Dernier audit · {formatLastScan(row.lastScanAt)}
                                </span>
                                {/* Affordance, pas un contrôle : la cible tactile est la carte
                                    entière (bien au-delà des 48 px). Un bouton imbriqué dans un
                                    élément déjà cliquable serait un piège au clavier. */}
                                <span className="inline-flex shrink-0 items-center gap-1 text-title-small text-adn-text">
                                    Ouvrir
                                    <MaterialIcon name="arrow_forward" size={16} />
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* FAB 52 px, rayon 16, jaune — masqué au scroll descendant (§5). */}
            <FabContainer
                className={cn(
                    'right-5 transition-all duration-short4 ease-emphasized',
                    fabHidden && 'translate-y-24 opacity-0 [&>*]:pointer-events-none',
                )}
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
                description="Actions Audit"
            >
                <FloatingActionButton
                    icon="play_arrow"
                    aria-label="Lancer un audit sur le périmètre courant"
                    onClick={onStartAudit}
                    className="w-fab h-fab rounded-adn-sheet bg-primary text-adn-on-brand"
                />
            </FabContainer>

            <BottomSheet
                id="audit-mobile-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Filtrer"
                titleClassName="text-title-medium-plain"
                className="rounded-t-adn-sheet"
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

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            variant="text"
                            className="text-label-large-plain"
                            onClick={onResetFilters}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="flex-1 justify-center text-label-large-plain"
                            onClick={() => setFiltersOpen(false)}
                        >
                            Voir {plural(rows.length, 'service')}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};
