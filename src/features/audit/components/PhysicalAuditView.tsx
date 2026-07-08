import { MEDIA } from '../../../constants/breakpoints';
import React, { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { ViewType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import SelectField from '../../../components/ui/SelectField';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ListActionFab from '../../../components/ui/ListActionFab';
import { cn } from '../../../lib/utils';

interface PhysicalAuditViewProps {
    onViewChange?: (view: ViewType) => void;
}

interface ServiceAuditRow {
    country: string;
    site: string;
    service: string;
    expected: number;
    found: number;
    missing: number;
    exceptions: number;
    progress: number;
    lastScanAt: string | null;
    status: 'A lancer' | 'En cours' | 'Complet' | 'A planifier';
}

const AUDIT_SCOPE_PREF_KEY = 'audit_scope_pref';
const ALL_VALUE = '__all__';
const AUDIT_FILTER_PANEL_ID = 'audit-global-filter-panel';

const normalize = (value?: string): string => (value || '').trim().toLowerCase();
const buildRowKey = (row: Pick<ServiceAuditRow, 'country' | 'site' | 'service'>): string => `${row.country}::${row.site}::${row.service}`;

const readMetadata = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

const formatLastScan = (value: string | null): string => {
    if (!value) return 'Jamais';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Jamais';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const statusPill = (status: ServiceAuditRow['status']) => {
    if (status === 'Complet') {
        return <span className="inline-flex items-center rounded-sm bg-tertiary-container px-2 py-1 text-label-small font-semibold text-on-tertiary-container">Complet</span>;
    }
    if (status === 'En cours') {
        return <span className="inline-flex items-center rounded-sm bg-primary-container px-2 py-1 text-label-small font-semibold text-on-primary-container">En cours</span>;
    }
    if (status === 'A lancer') {
        return <span className="inline-flex items-center rounded-sm bg-secondary-container px-2 py-1 text-label-small font-semibold text-on-secondary-container">À lancer</span>;
    }
    return <span className="inline-flex items-center rounded-sm bg-surface-container-high px-2 py-1 text-label-small font-semibold text-on-surface-variant">À planifier</span>;
};

export const PhysicalAuditView: React.FC<PhysicalAuditViewProps> = ({ onViewChange }) => {
    const { showToast } = useToast();
    const { navigateToView } = useAppNavigation();
    const { locationData, equipment, events } = useData();
    const isMobile = useMediaQuery(MEDIA.belowExpanded);

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<string>(locationData.countries[0] || ALL_VALUE);
    const [selectedSite, setSelectedSite] = useState<string>(ALL_VALUE);
    const [selectedService, setSelectedService] = useState<string>(ALL_VALUE);
    const [selectedStatus, setSelectedStatus] = useState<string>(ALL_VALUE);
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 250);

    useEffect(() => {
        if (selectedCountry === ALL_VALUE) return;
        if (!locationData.countries.includes(selectedCountry)) {
            setSelectedCountry(locationData.countries[0] || ALL_VALUE);
        }
    }, [locationData.countries, selectedCountry]);

    const allSites = useMemo(() => {
        const siteSet = new Set<string>();
        Object.values(locationData.sites).forEach((sites) => {
            sites.forEach((site) => siteSet.add(site));
        });
        return Array.from(siteSet);
    }, [locationData.sites]);

    const countryOptions = useMemo(
        () => [{ value: ALL_VALUE, label: 'Tous les pays' }, ...locationData.countries.map((country) => ({ value: country, label: country }))],
        [locationData.countries],
    );

    const siteOptions = useMemo(() => {
        const sites = selectedCountry === ALL_VALUE
            ? allSites
            : (locationData.sites[selectedCountry] || []);
        return [{ value: ALL_VALUE, label: 'Tous les sites' }, ...sites.map((site) => ({ value: site, label: site }))];
    }, [allSites, locationData.sites, selectedCountry]);

    useEffect(() => {
        if (selectedSite === ALL_VALUE) return;
        if (!siteOptions.some((option) => option.value === selectedSite)) {
            setSelectedSite(ALL_VALUE);
        }
    }, [selectedSite, siteOptions]);

    const serviceOptions = useMemo(() => {
        const serviceSet = new Set<string>();
        const targetSites = selectedSite === ALL_VALUE
            ? (selectedCountry === ALL_VALUE ? allSites : (locationData.sites[selectedCountry] || []))
            : [selectedSite];

        targetSites.forEach((site) => {
            (locationData.services[site] || []).forEach((service) => serviceSet.add(service));
        });

        return [{ value: ALL_VALUE, label: 'Tous les services' }, ...Array.from(serviceSet).map((service) => ({ value: service, label: service }))];
    }, [allSites, locationData.services, locationData.sites, selectedCountry, selectedSite]);

    useEffect(() => {
        if (selectedService === ALL_VALUE) return;
        if (!serviceOptions.some((option) => option.value === selectedService)) {
            setSelectedService(ALL_VALUE);
        }
    }, [selectedService, serviceOptions]);

    const auditEvents = useMemo(() => {
        return events
            .map((event) => ({
                event,
                metadata: readMetadata(event.metadata),
            }))
            .filter(({ event, metadata }) => {
                if (event.targetType !== 'EQUIPMENT' || !metadata) return false;
                const source = readString(metadata.source);
                return source.startsWith('audit_');
            });
    }, [events]);

    const allRows = useMemo(() => {
        const rows: ServiceAuditRow[] = [];

        locationData.countries.forEach((country) => {
            const sites = locationData.sites[country] || [];
            sites.forEach((site) => {
                const services = locationData.services[site] || [];
                services.forEach((service) => {
                    const scopedEquipment = equipment.filter((item) =>
                        normalize(item.country) === normalize(country)
                        && normalize(item.site) === normalize(site)
                        && normalize(item.department) === normalize(service),
                    );

                    const expected = scopedEquipment.length;
                    const scopedIds = new Set(scopedEquipment.map((item) => item.id));

                    const scopedAuditEvents = auditEvents.filter(({ metadata }) =>
                        normalize(readString(metadata?.scopeCountry)) === normalize(country)
                        && normalize(readString(metadata?.scopeSite)) === normalize(site)
                        && normalize(readString(metadata?.scopeService)) === normalize(service),
                    );

                    const scanEvents = scopedAuditEvents.filter(({ metadata }) => readString(metadata?.source) === 'audit_scan');
                    const alignEvents = scopedAuditEvents.filter(({ metadata }) => readString(metadata?.source) === 'audit_scan_alignment');

                    const scannedScoped = new Set<string>();
                    scanEvents.forEach(({ event }) => {
                        if (event.targetId) scannedScoped.add(event.targetId);
                    });

                    const found = Array.from(scannedScoped).reduce((count, id) =>
                        (scopedIds.has(id) ? count + 1 : count), 0);
                    const missing = Math.max(expected - found, 0);
                    const exceptions = alignEvents.length;
                    const progress = expected > 0 ? Math.round((found / expected) * 100) : 0;
                    const lastScanAt = scanEvents.length > 0
                        ? scanEvents.reduce((latest, current) =>
                            (new Date(current.event.timestamp).getTime() > new Date(latest).getTime() ? current.event.timestamp : latest), scanEvents[0].event.timestamp)
                        : null;

                    let status: ServiceAuditRow['status'] = 'A planifier';
                    if (expected > 0 && found >= expected) status = 'Complet';
                    else if (expected > 0 && found > 0) status = 'En cours';
                    else if (expected > 0) status = 'A lancer';

                    rows.push({
                        country,
                        site,
                        service,
                        expected,
                        found,
                        missing,
                        exceptions,
                        progress,
                        lastScanAt,
                        status,
                    });
                });
            });
        });

        return rows;
    }, [auditEvents, equipment, locationData.countries, locationData.services, locationData.sites]);

    const scopedRows = useMemo(() => {
        return allRows.filter((row) => {
            const matchesCountry = selectedCountry === ALL_VALUE || row.country === selectedCountry;
            const matchesSite = selectedSite === ALL_VALUE || row.site === selectedSite;
            const matchesService = selectedService === ALL_VALUE || row.service === selectedService;
            return matchesCountry && matchesSite && matchesService;
        });
    }, [allRows, selectedCountry, selectedService, selectedSite]);

    const displayedRows = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        return scopedRows.filter((row) => {
            const matchesStatus = selectedStatus === ALL_VALUE || row.status === selectedStatus;
            const matchesSearch = query.length === 0
                || row.service.toLowerCase().includes(query)
                || row.site.toLowerCase().includes(query)
                || row.country.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [debouncedSearch, scopedRows, selectedStatus]);

    const selectedRow = useMemo(
        () => displayedRows.find((row) => buildRowKey(row) === selectedRowKey) || null,
        [displayedRows, selectedRowKey],
    );

    useEffect(() => {
        if (!selectedRowKey) return;
        if (!displayedRows.some((row) => buildRowKey(row) === selectedRowKey)) {
            setSelectedRowKey(null);
        }
    }, [displayedRows, selectedRowKey]);

    const totals = useMemo(() => {
        const expected = scopedRows.reduce((sum, row) => sum + row.expected, 0);
        const found = scopedRows.reduce((sum, row) => sum + row.found, 0);
        const missing = scopedRows.reduce((sum, row) => sum + row.missing, 0);
        const exceptions = scopedRows.reduce((sum, row) => sum + row.exceptions, 0);
        const coverage = expected > 0 ? Math.round((found / expected) * 100) : 0;
        const activeCampaigns = scopedRows.filter((row) => row.status === 'En cours').length;
        return { expected, found, missing, exceptions, coverage, activeCampaigns };
    }, [scopedRows]);

    const persistScopePreference = (row?: ServiceAuditRow) => {
        try {
            const payload = row
                ? { country: row.country, site: row.site, service: row.service }
                : {
                    country: selectedCountry === ALL_VALUE ? '' : selectedCountry,
                    site: selectedSite === ALL_VALUE ? '' : selectedSite,
                    service: selectedService === ALL_VALUE ? '' : selectedService,
                };
            sessionStorage.setItem(AUDIT_SCOPE_PREF_KEY, JSON.stringify(payload));
        } catch {
            // Ignore storage failures.
        }
    };

    const openAuditDetails = (row?: ServiceAuditRow) => {
        persistScopePreference(row);
        if (typeof onViewChange === 'function') {
            onViewChange('audit_details');
            return;
        }
        navigateToView('audit_details');
    };

    const handleStartAudit = () => {
        const targetRow = selectedRow;
        if (!targetRow) {
            showToast('Sélectionnez un service avant de lancer un audit.', 'warning');
            return;
        }

        showToast(`Audit prêt pour ${targetRow.service} (${targetRow.site}).`, 'success');
        openAuditDetails(targetRow);
    };

    const handleOpenSelectedAuditDetails = () => {
        if (!selectedRow) {
            showToast('Sélectionnez un service avant d’ouvrir le détail.', 'warning');
            return;
        }
        openAuditDetails(selectedRow);
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="rounded-card border border-outline-variant bg-surface p-4 medium:p-5 shadow-elevation-1">
                <div className="flex flex-col gap-4 medium:flex-row medium:items-start medium:justify-between">
                    <div>
                        <p className="mb-1 inline-flex items-center gap-2 text-label-small font-semibold uppercase tracking-wider text-primary">
                            <MaterialIcon name="fact_check" size={16} />
                            Audit physique
                        </p>
                        <h3 className="text-title-large font-semibold text-on-surface">Pilotage des services à auditer</h3>
                        <p className="mt-1 text-body-small text-on-surface-variant">
                            Utilisez les filtres de périmètre puis ouvrez un service pour lancer ou reprendre une session.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                        <Button
                            variant="outlined"
                            icon={<MaterialIcon name="visibility" size={16} />}
                            onClick={handleOpenSelectedAuditDetails}
                            disabled={!selectedRow}
                        >
                            Ouvrir le détail
                        </Button>
                        <Button
                            variant="filled"
                            icon={<MaterialIcon name="play_arrow" size={16} />}
                            onClick={handleStartAudit}
                            disabled={!selectedRow}
                        >
                            Démarrer
                        </Button>
                    </div>
                </div>
                <p className="mt-3 text-body-small text-on-surface-variant">
                    {selectedRow
                        ? `Service sélectionné: ${selectedRow.service} • ${selectedRow.site} • ${selectedRow.country}`
                        : 'Sélectionnez un service dans la liste pour activer les actions.'}
                </p>

                <div className="mt-4 grid grid-cols-2 large:grid-cols-6 gap-3">
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Attendus</p>
                        <p className="text-title-large font-semibold text-on-surface">{totals.expected}</p>
                    </div>
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Scannés</p>
                        <p className="text-title-large font-semibold text-on-surface">{totals.found}</p>
                    </div>
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Manquants</p>
                        <p className="text-title-large font-semibold text-error">{totals.missing}</p>
                    </div>
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Écarts</p>
                        <p className="text-title-large font-semibold text-on-surface">{totals.exceptions}</p>
                    </div>
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Campagnes actives</p>
                        <p className="text-title-large font-semibold text-on-surface">{totals.activeCampaigns}</p>
                    </div>
                    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
                        <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Couverture</p>
                        <p className="text-title-large font-semibold text-on-surface">{totals.coverage}%</p>
                    </div>
                </div>

                <div className="mt-4 rounded-md border border-outline-variant bg-surface-container-low p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-label-small uppercase tracking-wide text-on-surface-variant">
                            Progression globale
                        </span>
                        <span className="text-title-small font-semibold text-on-surface">
                            {totals.found}/{totals.expected} • {totals.coverage}%
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${totals.coverage}%` }} />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                <SelectField
                    label="Pays"
                    name="auditCountry"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    options={countryOptions}
                />
                <SelectField
                    label="Site"
                    name="auditSite"
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    options={siteOptions}
                />
                <SelectField
                    label="Service"
                    name="auditService"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    options={serviceOptions}
                />
            </section>

            <SearchFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={() => setShowFilters((prev) => !prev)}
                filterActive={showFilters}
                filterPanelId={AUDIT_FILTER_PANEL_ID}
                resultCount={displayedRows.length}
                placeholder="Rechercher un service, un site ou un pays..."
            />

            {showFilters && (
                <div
                    id={AUDIT_FILTER_PANEL_ID}
                    className="rounded-card border border-outline-variant bg-surface p-3"
                    role="region"
                    aria-label="Filtres audit global"
                >
                    <div className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                        <SelectField
                            label="Statut campagne"
                            name="auditCampaignStatus"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            options={[
                                { value: ALL_VALUE, label: 'Tous les statuts' },
                                { value: 'A lancer', label: 'À lancer' },
                                { value: 'En cours', label: 'En cours' },
                                { value: 'Complet', label: 'Complet' },
                                { value: 'A planifier', label: 'À planifier' },
                            ]}
                        />
                    </div>
                </div>
            )}

            <section className="rounded-card border border-outline-variant bg-surface shadow-elevation-1 overflow-hidden">
                <div className="hidden medium:grid grid-cols-[minmax(0,_2.2fr)_90px_90px_90px_90px_130px_130px_auto] gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3 text-label-small uppercase tracking-wide text-on-surface-variant">
                    <span>Service</span>
                    <span className="text-right">Attendus</span>
                    <span className="text-right">Scannés</span>
                    <span className="text-right">Manquants</span>
                    <span className="text-right">Écarts</span>
                    <span className="text-right">Dernier scan</span>
                    <span className="text-right">Statut</span>
                    <span className="text-right">Action</span>
                </div>

                {displayedRows.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">
                        Aucun service ne correspond aux filtres actuels.
                    </div>
                ) : (
                    displayedRows.map((row) => (
                        <div
                            key={`${row.country}-${row.site}-${row.service}`}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedRowKey === buildRowKey(row)}
                            onClick={() => setSelectedRowKey(buildRowKey(row))}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedRowKey(buildRowKey(row));
                                }
                            }}
                            className={cn(
                                'grid grid-cols-1 medium:grid-cols-[minmax(0,_2.2fr)_90px_90px_90px_90px_130px_130px_auto] gap-2 border-b border-outline-variant/60 px-4 py-3 last:border-b-0 medium:items-center outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                                selectedRowKey === buildRowKey(row) && 'bg-secondary-container/35',
                            )}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-title-small text-on-surface">
                                    {row.service}
                                    {selectedRowKey === buildRowKey(row) && (
                                        <span className="ml-2 inline-flex items-center rounded-sm bg-secondary-container px-2 py-0.5 text-label-small font-semibold text-on-secondary-container">
                                            Sélectionné
                                        </span>
                                    )}
                                </p>
                                <p className="truncate text-body-small text-on-surface-variant">{row.site} • {row.country}</p>
                            </div>
                            <span className="text-body-small text-on-surface text-right">{row.expected}</span>
                            <span className="text-body-small text-on-surface text-right">{row.found}</span>
                            <span className="text-body-small text-error text-right">{row.missing}</span>
                            <span className="text-body-small text-on-surface text-right">{row.exceptions}</span>
                            <span className="text-body-small text-on-surface-variant text-right">{formatLastScan(row.lastScanAt)}</span>
                            <div className="flex justify-end">{statusPill(row.status)}</div>
                            <div className="flex justify-end">
                                <Button
                                    variant="text"
                                    size="sm"
                                    icon={<MaterialIcon name="arrow_forward" size={16} />}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedRowKey(buildRowKey(row));
                                        openAuditDetails(row);
                                    }}
                                >
                                    Ouvrir
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {isMobile && (
                <ListActionFab
                    label="Audit"
                    sheetTitle="Actions Audit"
                    actions={[
                        {
                            id: 'scan-audit-mobile',
                            label: 'Ouvrir détail audit',
                            icon: 'visibility',
                            variant: 'filled' as const,
                            onSelect: handleOpenSelectedAuditDetails,
                            disabled: !selectedRow,
                        },
                        {
                            id: 'start-audit-mobile',
                            label: 'Démarrer un audit',
                            icon: 'play_arrow',
                            variant: 'outlined' as const,
                            onSelect: handleStartAudit,
                            disabled: !selectedRow,
                        },
                    ]}
                />
            )}
        </div>
    );
};
