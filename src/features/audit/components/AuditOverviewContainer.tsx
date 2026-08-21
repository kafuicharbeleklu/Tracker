import React, { useEffect, useMemo, useState } from 'react';
import { ViewType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { ALL_VALUE, buildRowKey, ServiceAuditRow } from '../serviceAudit';
import { AuditOverview } from './AuditOverview';

interface AuditOverviewContainerProps {
    onViewChange?: (view: ViewType) => void;
}

const AUDIT_SCOPE_PREF_KEY = 'audit_scope_pref';

/** Options du filtre « statut de campagne » — source unique des deux rendus. */
const STATUS_OPTIONS = [
    { value: ALL_VALUE, label: 'Tous les statuts' },
    { value: 'A lancer', label: 'À lancer' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Complet', label: 'Complet' },
    { value: 'A planifier', label: 'Rien à auditer' },
];

const normalize = (value?: string): string => (value || '').trim().toLowerCase();

const readMetadata = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * **Le calcul de la vue globale de l'audit — il ne dessine plus rien.**
 *
 * Ce fichier composait un second écran au-delà de 600 px : carte « Pilotage des
 * services à auditer », trois sélecteurs toujours ouverts, un tableau de huit colonnes,
 * un bouton flottant. La planche 16.1 en dessine un seul, et 00.4 n'admet pas une
 * seconde composition — six lignes changent avec la largeur, « et rien d'autre ». Le
 * rendu qui portait la planche vivait sous 600 px : il est devenu **la** vue,
 * `AuditOverview`, et ce conteneur se réduit à ce qu'il faisait bien — les rangées par
 * triplet, les totaux, le périmètre, les gestes.
 */
export const AuditOverviewContainer: React.FC<AuditOverviewContainerProps> = ({ onViewChange }) => {
    const { showToast } = useToast();
    const { navigateToView } = useAppNavigation();
    const { locationData, equipment, events } = useData();
    // Compact (< 600 px) : écran passé à l'ADN mobile (DESIGN_BRIEF.md). Medium et
    // expanded continuent de rendre l'arbre historique ci-dessous, au pixel près.

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>(ALL_VALUE);
    const [selectedSite, setSelectedSite] = useState<string>(ALL_VALUE);
    const [selectedService, setSelectedService] = useState<string>(ALL_VALUE);
    const [selectedStatus, setSelectedStatus] = useState<string>(ALL_VALUE);
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 250);

    useEffect(() => {
        if (selectedCountry === ALL_VALUE) return;
        if (!locationData.countries.includes(selectedCountry)) {
            setSelectedCountry(ALL_VALUE);
        }
    }, [locationData.countries, selectedCountry]);

    const allSites = useMemo(() => {
        const siteSet = new Set<string>();
        (Object.values(locationData.sites) as string[][]).forEach((sites) => {
            sites.forEach((site) => siteSet.add(site));
        });
        return Array.from(siteSet);
    }, [locationData.sites]);

    const countryOptions = useMemo(
        () => [
            { value: ALL_VALUE, label: 'Tous les pays' },
            ...locationData.countries.map((country) => ({ value: country, label: country })),
        ],
        [locationData.countries],
    );

    const siteOptions = useMemo(() => {
        const sites =
            selectedCountry === ALL_VALUE ? allSites : locationData.sites[selectedCountry] || [];
        return [
            { value: ALL_VALUE, label: 'Tous les sites' },
            ...sites.map((site) => ({ value: site, label: site })),
        ];
    }, [allSites, locationData.sites, selectedCountry]);

    useEffect(() => {
        if (selectedSite === ALL_VALUE) return;
        if (!siteOptions.some((option) => option.value === selectedSite)) {
            setSelectedSite(ALL_VALUE);
        }
    }, [selectedSite, siteOptions]);

    const serviceOptions = useMemo(() => {
        const serviceSet = new Set<string>();
        const targetSites =
            selectedSite === ALL_VALUE
                ? selectedCountry === ALL_VALUE
                    ? allSites
                    : locationData.sites[selectedCountry] || []
                : [selectedSite];

        targetSites.forEach((site) => {
            (locationData.services[site] || []).forEach((service) => serviceSet.add(service));
        });

        return [
            { value: ALL_VALUE, label: 'Tous les services' },
            ...Array.from(serviceSet).map((service) => ({ value: service, label: service })),
        ];
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
                    const scopedEquipment = equipment.filter(
                        (item) =>
                            normalize(item.country) === normalize(country) &&
                            normalize(item.site) === normalize(site) &&
                            normalize(item.department) === normalize(service),
                    );

                    const expected = scopedEquipment.length;
                    const scopedIds = new Set(scopedEquipment.map((item) => item.id));

                    const scopedAuditEvents = auditEvents.filter(
                        ({ metadata }) =>
                            normalize(readString(metadata?.scopeCountry)) === normalize(country) &&
                            normalize(readString(metadata?.scopeSite)) === normalize(site) &&
                            normalize(readString(metadata?.scopeService)) === normalize(service),
                    );

                    const scanEvents = scopedAuditEvents.filter(
                        ({ metadata }) => readString(metadata?.source) === 'audit_scan',
                    );
                    const alignEvents = scopedAuditEvents.filter(
                        ({ metadata }) => readString(metadata?.source) === 'audit_scan_alignment',
                    );

                    const scannedScoped = new Set<string>();
                    scanEvents.forEach(({ event }) => {
                        if (event.targetId) scannedScoped.add(event.targetId);
                    });

                    const found = Array.from(scannedScoped).reduce(
                        (count, id) => (scopedIds.has(id) ? count + 1 : count),
                        0,
                    );
                    /**
                     * **V2 — un manquant n'existe pas avant d'avoir cherché.**
                     * `expected − found` déclarait tout le parc manquant au repos :
                     * l'écran s'ouvrait sur « 7 manquants » d'un parc que personne
                     * n'avait scanné, et ce faux compte allumait à lui seul le régime
                     * « campagne en cours » — donc le bloc des quatre chiffres, que la
                     * planche réserve à une campagne qui tourne. Tant qu'aucun scan
                     * n'a eu lieu sur ce périmètre, il n'y a **rien** à compter.
                     */
                    const missing = scanEvents.length > 0 ? Math.max(expected - found, 0) : 0;
                    const exceptions = alignEvents.length;
                    const progress = expected > 0 ? Math.round((found / expected) * 100) : 0;
                    const lastScanAt =
                        scanEvents.length > 0
                            ? scanEvents.reduce(
                                  (latest, current) =>
                                      new Date(current.event.timestamp).getTime() >
                                      new Date(latest).getTime()
                                          ? current.event.timestamp
                                          : latest,
                                  scanEvents[0].event.timestamp,
                              )
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
            const matchesSearch =
                query.length === 0 ||
                row.service.toLowerCase().includes(query) ||
                row.site.toLowerCase().includes(query) ||
                row.country.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [debouncedSearch, scopedRows, selectedStatus]);

    // `selectedRow` — la rangée résolue depuis la clé — a disparu avec les deux gestes
    // de tête qu'elle armait (V5). La sélection ne conditionne plus aucun acte : elle
    // marque la rangée sur laquelle on vient d'agir, et c'est `selectedRowKey` seul qui
    // le dit. Résoudre l'objet entier n'avait plus de lecteur.
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
        /**
         * **La date décide s'il faut lancer** — planche 16.1. Un nombre d'actifs sans
         * date de dernier inventaire ne se juge pas : c'est ce repère, et non le total,
         * que le porte-voix porte au repos.
         */
        const lastScanAt = scopedRows.reduce<string | null>((latest, row) => {
            if (!row.lastScanAt) return latest;
            if (!latest) return row.lastScanAt;
            return new Date(row.lastScanAt).getTime() > new Date(latest).getTime()
                ? row.lastScanAt
                : latest;
        }, null);
        return { expected, found, missing, exceptions, coverage, activeCampaigns, lastScanAt };
    }, [scopedRows]);

    /**
     * Les actifs rattachés à aucun service du référentiel : ils n'entrent dans aucune
     * campagne, et le porte-voix le dit plutôt que de laisser croire que le parc entier
     * est couvert (16.1, dette V3).
     */
    const unscopedAssets = useMemo(
        () => Math.max(equipment.length - allRows.reduce((sum, row) => sum + row.expected, 0), 0),
        [allRows, equipment.length],
    );

    /**
     * **Chaque option de périmètre porte son compte** (16.1, colonne 3) — *« un filtre
     * qui ne dit pas combien il reste après lui se choisit à l'aveugle »*.
     *
     * Les comptes se lisent dans l'ordre où les axes se resserrent : le pays compte sur
     * tout le référentiel, le site sur le pays retenu, le service sur le site retenu, le
     * statut sur la portée entière. Un axe qui compterait sur sa propre sélection
     * afficherait le total de ce qu'il vient de produire, ce qui ne renseigne rien.
     */
    const scopeOptions = useMemo(() => {
        const withCount = (
            base: ServiceAuditRow[],
            options: { value: string; label: string }[],
            match: (row: ServiceAuditRow, value: string) => boolean,
        ) =>
            options.map((option) => ({
                ...option,
                count:
                    option.value === ALL_VALUE
                        ? base.length
                        : base.filter((row) => match(row, option.value)).length,
            }));

        const byCountry =
            selectedCountry === ALL_VALUE
                ? allRows
                : allRows.filter((row) => row.country === selectedCountry);
        const bySite =
            selectedSite === ALL_VALUE
                ? byCountry
                : byCountry.filter((row) => row.site === selectedSite);

        return {
            country: withCount(allRows, countryOptions, (row, value) => row.country === value),
            site: withCount(byCountry, siteOptions, (row, value) => row.site === value),
            service: withCount(bySite, serviceOptions, (row, value) => row.service === value),
            status: withCount(scopedRows, STATUS_OPTIONS, (row, value) => row.status === value),
        };
    }, [
        allRows,
        countryOptions,
        siteOptions,
        serviceOptions,
        scopedRows,
        selectedCountry,
        selectedSite,
    ]);

    /**
     * **Une campagne porte sur un service** — le lexique de 16.1 le dit ainsi : *«
     * Campagne : un service, une session de vérification »*. Le geste de pied doit
     * donc désigner une rangée, pas une portée.
     *
     * Celle qui tourne d'abord — c'est elle qu'on reprend ou qu'on clôture —, sinon
     * la seule que la portée laisse, s'il n'en reste qu'une. Quand la portée en laisse
     * plusieurs, aucun geste ne peut choisir à notre place : la vue le dit et ouvre la
     * feuille de périmètre au lieu de partir sur un écran sans sujet.
     */
    const scopeTargetRow = useMemo(
        () =>
            scopedRows.find((row) => row.status === 'En cours') ??
            (scopedRows.length === 1 ? scopedRows[0] : null),
        [scopedRows],
    );

    const persistScopePreference = (row: ServiceAuditRow) => {
        try {
            sessionStorage.setItem(
                AUDIT_SCOPE_PREF_KEY,
                JSON.stringify({ country: row.country, site: row.site, service: row.service }),
            );
        } catch {
            // Ignore storage failures.
        }
    };

    const openAuditDetails = (row: ServiceAuditRow) => {
        persistScopePreference(row);
        if (typeof onViewChange === 'function') {
            onViewChange('audit_details');
            return;
        }
        navigateToView('audit_details');
    };

    /**
     * Lancer l'audit du service porté par une rangée — planche 16.1, relevé V5.
     *
     * Prend la rangée en argument au lieu de la lire dans `selectedRow` : le geste
     * est sur la rangée, donc son objet ne peut pas manquer et il n'y a plus de
     * garde « sélectionnez d'abord » à écrire. Le toast reste, parce qu'il annonce
     * un fait — la session est prête — et non l'échec d'une condition.
     */
    const startAuditForRow = (row: ServiceAuditRow) => {
        setSelectedRowKey(buildRowKey(row));
        showToast(`Campagne lancée sur ${row.service} (${row.site}).`, 'success');
        openAuditDetails(row);
    };

    /**
     * Le geste de pied — il n'est jamais impossible, mais il ne promet plus ce qu'il
     * ne peut pas tenir. Quand la portée désigne un service, il l'ouvre ; sinon la vue
     * ouvre la feuille de périmètre, et le libellé du bouton dit lequel des deux se
     * produira. Rien de désactivé, rien de grisé (§4).
     */
    const handleStartScopedAudit = () => {
        if (!scopeTargetRow) return;
        openAuditDetails(scopeTargetRow);
    };

    const setFilterValue = (key: 'country' | 'site' | 'service' | 'status', value: string) => {
        if (key === 'country') setSelectedCountry(value);
        else if (key === 'site') setSelectedSite(value);
        else if (key === 'service') setSelectedService(value);
        else setSelectedStatus(value);
    };

    const resetFilters = () => {
        setSelectedCountry(ALL_VALUE);
        setSelectedSite(ALL_VALUE);
        setSelectedService(ALL_VALUE);
        setSelectedStatus(ALL_VALUE);
        setSearchQuery('');
    };

    return (
        <AuditOverview
            rows={displayedRows}
            scopedServiceCount={scopedRows.length}
            totals={totals}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
                country: selectedCountry,
                site: selectedSite,
                service: selectedService,
                status: selectedStatus,
            }}
            filterOptions={scopeOptions}
            onFilterChange={setFilterValue}
            onResetFilters={resetFilters}
            onOpenService={openAuditDetails}
            onStartService={startAuditForRow}
            unscopedAssets={unscopedAssets}
            onStartAudit={handleStartScopedAudit}
            canStartOnScope={Boolean(scopeTargetRow)}
            onOpenDetailsTab={handleStartScopedAudit}
        />
    );
};
