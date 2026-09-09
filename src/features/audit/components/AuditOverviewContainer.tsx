import React, { useEffect, useMemo, useState } from 'react';
import { ViewType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import {
    ALL_VALUE,
    buildRowKey,
    compareByProgress,
    placeLabel,
    PlaceAuditRow,
    STATUS_LABELS,
} from '../placeAudit';
import { rememberAuditScope } from '../../../lib/auditScope';
import { AuditOverview } from './AuditOverview';

interface AuditOverviewContainerProps {
    onViewChange?: (view: ViewType) => void;
}

/** Options du filtre « statut de campagne » — source unique des deux rendus. */
const STATUS_OPTIONS = [
    { value: ALL_VALUE, label: 'Tous' },
    { value: 'A lancer', label: STATUS_LABELS['A lancer'] },
    { value: 'En cours', label: STATUS_LABELS['En cours'] },
    { value: 'Complet', label: STATUS_LABELS.Complet },
    { value: 'A planifier', label: STATUS_LABELS['A planifier'] },
];

const normalize = (value?: string): string => (value || '').trim().toLowerCase();

const readMetadata = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * **Le calcul de la vue globale de l'inventaire — il ne dessine plus rien.**
 *
 * Deux niveaux, un par écran (16.1) : les **sites** tant qu'aucun n'est ouvert, puis
 * les **locaux** du site ouvert. Le troisième niveau — les équipements et le scan — est
 * un autre écran (16.2), et la rangée y mène.
 *
 * Le périmètre a **deux axes**, pas quatre : *« Pays, puis le statut : la liste est déjà
 * celle des sites. »* Le site ne se filtre plus, il s'ouvre ; et le service a été retiré
 * le 06/09 — il n'est pas un lieu et ne bornait rien qu'on puisse aller compter.
 */
export const AuditOverviewContainer: React.FC<AuditOverviewContainerProps> = ({ onViewChange }) => {
    const { showToast } = useToast();
    const { navigateToView } = useAppNavigation();
    const { locationData, equipment, events } = useData();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>(ALL_VALUE);
    const [selectedStatus, setSelectedStatus] = useState<string>(ALL_VALUE);
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
    /**
     * **Le site ouvert** — le second niveau de 16.1. *« Trois niveaux, un par écran :
     * le site, puis ses locaux, puis les équipements et le scan (16.2). Pas d'onglets :
     * chaque niveau est une liste, le suivant s'ouvre depuis la rangée. »*
     */
    const [openedSite, setOpenedSite] = useState<{ country: string; site: string } | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 250);

    useEffect(() => {
        if (selectedCountry === ALL_VALUE) return;
        if (!locationData.countries.includes(selectedCountry)) {
            setSelectedCountry(ALL_VALUE);
        }
    }, [locationData.countries, selectedCountry]);

    /**
     * **Les lieux à compter viennent des objets, pas du seul référentiel.** *« Tout
     * actif qui a un emplacement entre dans une campagne »* (16.1). L'écran ne lisait
     * que `locationData` : le référentiel chargé étant vide, il annonçait « 0 attendu »
     * devant un parc de 243 objets, tous situés. Un site déclaré mais vide reste
     * listé — il dit « rien à inventorier » — et un site qu'aucune déclaration ne
     * connaît est compté quand même, puisqu'il porte des objets.
     */
    const paysEtSites = useMemo(() => {
        const table = new Map<string, Set<string>>();
        const ajouter = (country: string, site: string) => {
            if (!country || !site) return;
            if (!table.has(country)) table.set(country, new Set());
            table.get(country)!.add(site);
        };

        locationData.countries.forEach((country) => {
            (locationData.sites[country] || []).forEach((site) => ajouter(country, site));
        });
        equipment.forEach((item) => ajouter(item.country || 'Togo', item.site || ''));

        return Array.from(table.entries()).map(([country, sites]) => ({
            country,
            sites: Array.from(sites).sort((a, b) => a.localeCompare(b, 'fr')),
        }));
    }, [equipment, locationData.countries, locationData.sites]);

    const countryOptions = useMemo(
        () => [
            { value: ALL_VALUE, label: 'Tous' },
            ...paysEtSites.map(({ country }) => ({ value: country, label: country })),
        ],
        [paysEtSites],
    );

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

    /** Les locaux réellement portés par les objets d'un site — le référentiel peut en
        déclarer que rien n'occupe, et l'inverse arrive aussi. */
    const locauxDuSite = useMemo(() => {
        const table = new Map<string, string[]>();
        equipment.forEach((item) => {
            const site = normalize(item.site);
            const local = (item.local || '').trim();
            if (!site || !local) return;
            const liste = table.get(site) ?? [];
            if (!liste.includes(local)) liste.push(local);
            table.set(site, liste);
        });
        table.forEach((liste) => liste.sort((a, b) => a.localeCompare(b, 'fr')));
        return table;
    }, [equipment]);

    /**
     * **Une rangée est un lieu**, et ses chiffres se lisent des objets qui y sont et des
     * scans qui l'ont visé. Le périmètre est le triplet (pays, site, local) — ou, pour
     * la rangée « hors local », le site **moins** ses locaux.
     */
    const statsPour = React.useCallback(
        (
            country: string,
            site: string,
            local: string | undefined,
            horsLocal: boolean,
        ): Omit<PlaceAuditRow, 'country' | 'site' | 'local' | 'horsLocal' | 'localCount'> => {
            const dansLePerimetre = (itemSite?: string, itemLocal?: string) => {
                if (normalize(itemSite) !== normalize(site)) return false;
                if (horsLocal) return !(itemLocal || '').trim();
                if (local === undefined) return true;
                return normalize(itemLocal) === normalize(local);
            };

            const scopedEquipment = equipment.filter(
                (item) =>
                    normalize(item.country) === normalize(country) &&
                    dansLePerimetre(item.site, item.local),
            );

            const expected = scopedEquipment.length;
            const scopedIds = new Set(scopedEquipment.map((item) => item.id));

            const scopedAuditEvents = auditEvents.filter(
                ({ metadata }) =>
                    normalize(readString(metadata?.scopeCountry)) === normalize(country) &&
                    dansLePerimetre(
                        readString(metadata?.scopeSite),
                        readString(metadata?.scopeLocal),
                    ),
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
             * **V2 — un manquant n'existe pas avant d'avoir cherché.** `expected − found`
             * déclarait tout le parc manquant au repos : l'écran s'ouvrait sur « 7
             * manquants » d'un parc que personne n'avait scanné, et ce faux compte
             * allumait à lui seul le régime « campagne en cours ».
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

            let status: PlaceAuditRow['status'] = 'A planifier';
            if (expected > 0 && found >= expected) status = 'Complet';
            else if (expected > 0 && found > 0) status = 'En cours';
            else if (expected > 0) status = 'A lancer';

            return { expected, found, missing, exceptions, progress, lastScanAt, status };
        },
        [auditEvents, equipment],
    );

    /**
     * **Ce qui manque dans un site est la somme de ce qui manque dans ses lieux.**
     *
     * Le premier niveau lisait le site comme un périmètre plat : `expected − found` sur
     * tout le site dès qu'un seul scan l'avait touché. Mesuré le 07/09 : un scan dans la
     * salle serveurs affichait **« 242 manquants »** sur un parc de 243 — les huit autres
     * pièces, que personne n'avait ouvertes, étaient déclarées perdues. La règle V2 (« un
     * manquant n'existe pas avant d'avoir cherché ») valait par rangée ; elle ne valait
     * pas pour la rangée qui en contient d'autres.
     */
    const agreger = React.useCallback(
        (
            morceaux: Array<
                Omit<PlaceAuditRow, 'country' | 'site' | 'local' | 'horsLocal' | 'localCount'>
            >,
        ) => {
            const expected = morceaux.reduce((somme, m) => somme + m.expected, 0);
            const found = morceaux.reduce((somme, m) => somme + m.found, 0);
            const missing = morceaux.reduce((somme, m) => somme + m.missing, 0);
            const exceptions = morceaux.reduce((somme, m) => somme + m.exceptions, 0);
            const lastScanAt = morceaux.reduce<string | null>((recent, m) => {
                if (!m.lastScanAt) return recent;
                if (!recent) return m.lastScanAt;
                return new Date(m.lastScanAt).getTime() > new Date(recent).getTime()
                    ? m.lastScanAt
                    : recent;
            }, null);

            let status: PlaceAuditRow['status'] = 'A planifier';
            if (expected > 0 && found >= expected) status = 'Complet';
            else if (found > 0) status = 'En cours';
            else if (expected > 0) status = 'A lancer';

            return {
                expected,
                found,
                missing,
                exceptions,
                progress: expected > 0 ? Math.round((found / expected) * 100) : 0,
                lastScanAt,
                status,
            };
        },
        [],
    );

    /** Les lieux d'un site : ses locaux, et le reste du site quand des objets y échappent. */
    const morceauxDuSite = React.useCallback(
        (country: string, site: string) => {
            const locaux = locauxDuSite.get(normalize(site)) ?? [];
            if (locaux.length === 0) return null;
            const morceaux = locaux.map((local) => ({
                local,
                stats: statsPour(country, site, local, false),
            }));
            const reste = statsPour(country, site, undefined, true);
            if (reste.expected > 0) morceaux.push({ local: undefined, stats: reste });
            return morceaux;
        },
        [locauxDuSite, statsPour],
    );

    /** Premier niveau : une rangée par site, quel que soit le site ouvert. */
    const siteRows = useMemo(() => {
        const rows: PlaceAuditRow[] = [];
        paysEtSites.forEach(({ country, sites }) => {
            sites.forEach((site) => {
                const morceaux = morceauxDuSite(country, site);
                rows.push({
                    country,
                    site,
                    localCount: (locauxDuSite.get(normalize(site)) ?? []).length,
                    ...(morceaux
                        ? agreger(morceaux.map((m) => m.stats))
                        : statsPour(country, site, undefined, false)),
                });
            });
        });
        return rows;
    }, [agreger, locauxDuSite, morceauxDuSite, paysEtSites, statsPour]);

    /**
     * Second niveau : les locaux du site ouvert, **plus le site hors de ses locaux**
     * quand des objets y échappent. Sans cette dernière rangée, 211 des 243 actifs du
     * parc réel sortiraient de l'inventaire physique sans qu'aucun écran ne le dise.
     */
    /* Le type est **déclaré** : le `...(local === undefined ? … : …)` produit sinon une
       union de deux formes, dont l'une n'a pas `local` — et tout ce qui lit `row.local`
       en aval cesse de compiler alors que la rangée est bien une `PlaceAuditRow`. */
    const localRows = useMemo<PlaceAuditRow[]>(() => {
        if (!openedSite) return [];
        const { country, site } = openedSite;
        const morceaux = morceauxDuSite(country, site);
        if (!morceaux) return [];
        return morceaux.map(({ local, stats }) => ({
            country,
            site,
            ...(local === undefined ? { horsLocal: true } : { local }),
            ...stats,
        }));
    }, [morceauxDuSite, openedSite]);

    const allRows = openedSite ? localRows : siteRows;

    /** Le périmètre ne s'applique qu'au premier niveau : le second **est** un site. */
    const scopedRows = useMemo(() => {
        if (openedSite) return localRows;
        return siteRows.filter(
            (row) => selectedCountry === ALL_VALUE || row.country === selectedCountry,
        );
    }, [localRows, openedSite, selectedCountry, siteRows]);

    const displayedRows = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        const retenues = openedSite
            ? scopedRows
            : scopedRows.filter((row) => {
                  const matchesStatus =
                      selectedStatus === ALL_VALUE || row.status === selectedStatus;
                  const matchesSearch =
                      query.length === 0 ||
                      row.site.toLowerCase().includes(query) ||
                      row.country.toLowerCase().includes(query) ||
                      (locauxDuSite.get(normalize(row.site)) ?? []).some((local) =>
                          local.toLowerCase().includes(query),
                      );
                  return matchesStatus && matchesSearch;
              });
        return [...retenues].sort(compareByProgress);
    }, [debouncedSearch, locauxDuSite, openedSite, scopedRows, selectedStatus]);

    useEffect(() => {
        if (!selectedRowKey) return;
        if (!displayedRows.some((row) => buildRowKey(row) === selectedRowKey)) {
            setSelectedRowKey(null);
        }
    }, [displayedRows, selectedRowKey]);

    /**
     * Le héro compte **la portée**, pas la liste filtrée : au premier niveau tout le
     * parc retenu par le pays, au second le site ouvert dans son entier — locaux
     * compris, et y compris ce qui n'est dans aucun.
     */
    const totals = useMemo(() => {
        const base = openedSite ? localRows : scopedRows;
        const expected = base.reduce((sum, row) => sum + row.expected, 0);
        const found = base.reduce((sum, row) => sum + row.found, 0);
        const missing = base.reduce((sum, row) => sum + row.missing, 0);
        const exceptions = base.reduce((sum, row) => sum + row.exceptions, 0);
        const coverage = expected > 0 ? Math.round((found / expected) * 100) : 0;
        const activeCampaigns = base.filter((row) => row.status === 'En cours').length;
        const lastScanAt = base.reduce<string | null>((latest, row) => {
            if (!row.lastScanAt) return latest;
            if (!latest) return row.lastScanAt;
            return new Date(row.lastScanAt).getTime() > new Date(latest).getTime()
                ? row.lastScanAt
                : latest;
        }, null);
        return { expected, found, missing, exceptions, coverage, activeCampaigns, lastScanAt };
    }, [localRows, openedSite, scopedRows]);

    /**
     * Combien de locaux la portée compte — la tuile du héro. Au premier niveau c'est la
     * somme des locaux des sites retenus ; au second, les locaux du site ouvert, sans
     * compter la rangée « hors local », qui n'en est pas un.
     */
    const scopedLocalCount = useMemo(
        () =>
            openedSite
                ? scopedRows.filter((row) => Boolean(row.local)).length
                : scopedRows.reduce((sum, row) => sum + (row.localCount ?? 0), 0),
        [openedSite, scopedRows],
    );

    /**
     * Les actifs qu'aucun **site** ne situe : ils n'entrent dans aucune campagne, et la
     * note de pied le dit plutôt que de laisser croire que le parc entier est couvert.
     * (Ceux qu'aucun *local* ne situe, eux, ont leur rangée au second niveau.)
     */
    const unscopedAssets = useMemo(
        () => Math.max(equipment.length - siteRows.reduce((sum, row) => sum + row.expected, 0), 0),
        [equipment.length, siteRows],
    );

    /**
     * **Chaque option de périmètre porte son compte** (16.1, colonne 3) — *« un filtre
     * qui ne dit pas combien il reste après lui se choisit à l'aveugle »*. Le pays
     * compte sur tout le référentiel, le statut sur la portée que le pays laisse.
     */
    const scopeOptions = useMemo(() => {
        const withCount = (
            base: PlaceAuditRow[],
            options: { value: string; label: string }[],
            match: (row: PlaceAuditRow, value: string) => boolean,
        ) =>
            options.map((option) => ({
                ...option,
                count:
                    option.value === ALL_VALUE
                        ? base.length
                        : base.filter((row) => match(row, option.value)).length,
            }));

        return {
            country: withCount(siteRows, countryOptions, (row, value) => row.country === value),
            status: withCount(scopedRows, STATUS_OPTIONS, (row, value) => row.status === value),
        };
    }, [countryOptions, scopedRows, siteRows]);

    const persistScopePreference = (row: PlaceAuditRow) =>
        rememberAuditScope({
            country: row.country,
            site: row.site,
            local: row.local,
            horsLocal: row.horsLocal,
        });

    const openAuditDetails = (row: PlaceAuditRow) => {
        persistScopePreference(row);
        if (typeof onViewChange === 'function') {
            onViewChange('audit_details');
            return;
        }
        navigateToView('audit_details');
    };

    /**
     * **La rangée ouvre le niveau suivant** (16.1). Un site qui a des locaux ouvre ses
     * locaux ; un site qui n'en a pas — comme un local, comme le reste d'un site — ouvre
     * le comptage. C'est le seul endroit où les deux niveaux se distinguent.
     */
    const handleOpenPlace = (row: PlaceAuditRow) => {
        if (!row.local && !row.horsLocal && (row.localCount ?? 0) > 0) {
            setOpenedSite({ country: row.country, site: row.site });
            setSearchQuery('');
            return;
        }
        openAuditDetails(row);
    };

    const closeSite = () => {
        setOpenedSite(null);
        setSearchQuery('');
    };

    /**
     * Lancer le comptage du lieu porté par une rangée — le geste `.rbtn`. Il prend la
     * rangée en argument : le geste est sur la rangée, donc son objet ne peut pas
     * manquer et il n'y a pas de garde « sélectionnez d'abord » à écrire.
     */
    const startAuditForRow = (row: PlaceAuditRow) => {
        setSelectedRowKey(buildRowKey(row));
        showToast(
            `Campagne lancée sur ${row.local ? `${row.local} (${row.site})` : placeLabel(row)}.`,
            'success',
        );
        openAuditDetails(row);
    };

    const setFilterValue = (key: 'country' | 'status', value: string) => {
        if (key === 'country') setSelectedCountry(value);
        else setSelectedStatus(value);
    };

    const resetFilters = () => {
        setSelectedCountry(ALL_VALUE);
        setSelectedStatus(ALL_VALUE);
        setSearchQuery('');
    };

    return (
        <AuditOverview
            rows={displayedRows}
            scopedPlaceCount={scopedRows.length}
            scopedLocalCount={scopedLocalCount}
            totals={totals}
            openedSite={openedSite}
            onCloseSite={closeSite}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{ country: selectedCountry, status: selectedStatus }}
            filterOptions={scopeOptions}
            onFilterChange={setFilterValue}
            onResetFilters={resetFilters}
            onOpenPlace={handleOpenPlace}
            onStartPlace={startAuditForRow}
            unscopedAssets={unscopedAssets}
            totalRowCount={allRows.length}
        />
    );
};
