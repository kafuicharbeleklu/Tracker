import React, { useMemo, useState } from 'react';
import { ViewType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import {
    ALL_VALUE,
    compareByProgress,
    CountryAuditRow,
    placeLabel,
    PlaceAuditRow,
    STATUS_LABELS,
} from '../placeAudit';
import { rememberAuditScope, siteQuitteALInstant } from '../../../lib/auditScope';
import { lireLaCampagne } from '../campagne';
import { AuditOverview, type ChoixDuLieu } from './AuditOverview';
import AuditLieux from './AuditLieux';
import { useRouter } from '../../../hooks/useRouter';

interface AuditOverviewContainerProps {
    onViewChange?: (view: ViewType) => void;
    /** La flèche du `.top` de 16.1 — quitter l'inventaire, quand aucun site n'est ouvert. */
    onLeave?: () => void;
}

/** Options du filtre « statut de campagne » — source unique des deux rendus. */
const STATUS_OPTIONS = [
    { value: ALL_VALUE, label: 'Tous' },
    { value: 'A lancer', label: STATUS_LABELS['A lancer'] },
    { value: 'En cours', label: STATUS_LABELS['En cours'] },
    { value: 'A valider', label: STATUS_LABELS['A valider'] },
    { value: 'Validee', label: STATUS_LABELS.Validee },
    { value: 'Complet', label: STATUS_LABELS.Complet },
    { value: 'A planifier', label: STATUS_LABELS['A planifier'] },
];

const normalize = (value?: string): string => (value || '').trim().toLowerCase();

/** L'adresse de la page des lieux d'un pays, ou des locaux d'un de ses sites. */
const adresseDesLieux = (country: string, site: string | null): string =>
    `/audit/lieux/${encodeURIComponent(country)}${site ? `/${encodeURIComponent(site)}` : ''}`;

/**
 * Les chiffres d'un ensemble de lieux. Il en faut **deux** au bureau : ceux du parc, que
 * la bande porte, et ceux du site choisi, que le panneau porte — et le second ne doit pas
 * remplacer le premier quand on sélectionne.
 */
const totauxDe = (base: PlaceAuditRow[]) => {
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
};

const readMetadata = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
};

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * **Le calcul de la vue globale de l'inventaire — il ne dessine plus rien.**
 *
 * Trois niveaux de lieux, **un seul écran** (09/10) : les **pays**, puis les **sites** du
 * pays choisi, puis les **locaux** du site ouvert — les deux derniers dans une feuille au
 * téléphone, dans le panneau au bureau. Le quatrième, les équipements et le scan, est un
 * autre écran (16.2), et la rangée d'un local y mène.
 *
 * Avant, le premier niveau était la liste des sites, le pays un filtre, et au téléphone les
 * locaux remplaçaient la liste. Le périmètre n'a plus qu'**un axe à filtrer**, le statut :
 * le pays se choisit, il ne se filtre plus ; et le service a été retiré le 06/09 — il n'est
 * pas un lieu et ne bornait rien qu'on puisse aller compter.
 */
export const AuditOverviewContainer: React.FC<AuditOverviewContainerProps> = ({
    onViewChange,
    onLeave,
}) => {
    const { showToast } = useToast();
    const { navigateToView } = useAppNavigation();
    const { routeSegments, navigate } = useRouter();
    const { locationData, equipment, events, settings } = useData();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>(ALL_VALUE);
    /**
     * **Le choix du lieu** (09/10) — un pays, puis un site, puis un local. Le pays n'est
     * plus un filtre : c'est le premier niveau. Le choix se fait dans une feuille au
     * téléphone, dans le panneau au bureau ; la liste reste derrière.
     */
    const [chosenCountry, setChosenCountry] = useState<string | null>(
        /* Au retour d'une campagne, le choix se rouvre sur le site qu'on vient de compter :
           le local suivant est à un geste. */
        () => siteQuitteALInstant()?.country ?? null,
    );
    /**
     * **Le site ouvert** dans le choix — *« on choisit le site, la feuille s'actualise vers
     * les locaux »*.
     */
    const [openedSite, setOpenedSite] = useState<{ country: string; site: string } | null>(
        siteQuitteALInstant,
    );

    /**
     * **La page de tous les lieux d'un choix** (09/10) — `/audit/lieux/<pays>` pour les
     * sites d'un pays, `/audit/lieux/<pays>/<site>` pour les locaux d'un site. Le panneau
     * du bureau n'en montre qu'une part ; cette adresse les porte tous. Elle prend le pas
     * sur le choix du panneau le temps qu'on y est, sans l'effacer : au retour, le panneau
     * est tel qu'on l'a laissé.
     */
    const lieuDeLaPage = useMemo(() => {
        if (routeSegments[0] !== 'audit' || routeSegments[1] !== 'lieux' || !routeSegments[2])
            return null;
        const country = decodeURIComponent(routeSegments[2]);
        return {
            country,
            site: routeSegments[3] ? decodeURIComponent(routeSegments[3]) : null,
        };
    }, [routeSegments]);
    const paysMontre = lieuDeLaPage ? lieuDeLaPage.country : chosenCountry;
    const siteMontre = useMemo(
        () =>
            lieuDeLaPage
                ? lieuDeLaPage.site
                    ? { country: lieuDeLaPage.country, site: lieuDeLaPage.site }
                    : null
                : openedSite,
        [lieuDeLaPage, openedSite],
    );

    const debouncedSearch = useDebounce(searchQuery, 250);

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

            /* **La campagne, lue au journal** (27/09) : après un abandon ou une relance, les
               comptages d'avant ne comptent plus ; clôturée, elle attend un responsable. */
            const campagne = lireLaCampagne(
                events,
                { country, site, local, horsLocal },
                settings.inventoryPeriodMonths || 12,
            );
            const scanEvents = scopedAuditEvents.filter(
                ({ event, metadata }) =>
                    readString(metadata?.source) === 'audit_scan' &&
                    (!campagne.depuis || event.timestamp > campagne.depuis),
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
            if (campagne.etat === 'validee') status = 'Validee';
            else if (campagne.etat === 'cloturee') status = 'A valider';
            else if (expected > 0 && found >= expected) status = 'Complet';
            else if (expected > 0 && found > 0) status = 'En cours';
            else if (expected > 0) status = 'A lancer';

            return { expected, found, missing, exceptions, progress, lastScanAt, status };
        },
        [auditEvents, equipment, events, settings.inventoryPeriodMonths],
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
            if (morceaux.some((m) => m.status === 'A valider')) status = 'A valider';
            else if (
                morceaux.length > 0 &&
                morceaux.every((m) => m.status === 'Validee' || m.status === 'A planifier') &&
                morceaux.some((m) => m.status === 'Validee')
            )
                status = 'Validee';
            else if (expected > 0 && found >= expected) status = 'Complet';
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
        if (!siteMontre) return [];
        const { country, site } = siteMontre;
        const morceaux = morceauxDuSite(country, site);
        if (!morceaux) return [];
        return morceaux.map(({ local, stats }) => ({
            country,
            site,
            ...(local === undefined ? { horsLocal: true } : { local }),
            ...stats,
        }));
    }, [morceauxDuSite, siteMontre]);

    /**
     * Les sites retenus — statut, recherche —, **calculés en permanence** : ils font les
     * pays du premier niveau, les sites du pays choisi, et la liste à plat d'une recherche.
     */
    const sitesAffiches = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        const retenues = siteRows.filter((row) => {
            const matchesStatus = selectedStatus === ALL_VALUE || row.status === selectedStatus;
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
    }, [debouncedSearch, locauxDuSite, selectedStatus, siteRows]);

    /**
     * **Ce que liste le premier niveau.** Les pays — sauf dans deux cas où ils ne feraient
     * que coûter un geste : **un seul pays** au référentiel (la liste n'aurait qu'une
     * ligne), et **une recherche** (qui tape « Lomé » veut Lomé, pas Togo puis Lomé). La
     * liste est alors celle des sites, à plat.
     */
    const niveau: 'pays' | 'sites' =
        paysEtSites.length <= 1 || debouncedSearch.trim().length > 0 ? 'sites' : 'pays';

    /** Premier niveau : une rangée par pays, ses sites agrégés. */
    const countryRows = useMemo<CountryAuditRow[]>(() => {
        const parPays = new Map<string, PlaceAuditRow[]>();
        sitesAffiches.forEach((row) =>
            parPays.set(row.country, [...(parPays.get(row.country) ?? []), row]),
        );
        const commeLieu = (row: CountryAuditRow): PlaceAuditRow => ({ ...row, site: row.country });
        return [...parPays.entries()]
            .map(([country, sites]) => ({
                country,
                siteCount: sites.length,
                localCount: sites.reduce((somme, row) => somme + (row.localCount ?? 0), 0),
                ...agreger(sites),
            }))
            .sort((a, b) => compareByProgress(commeLieu(a), commeLieu(b)));
    }, [agreger, sitesAffiches]);

    /**
     * **Le choix en cours**, tel que la feuille ou le panneau le montre : les sites du pays
     * choisi, puis les locaux du site ouvert, avec leurs chiffres.
     */
    const choix = useMemo<ChoixDuLieu | null>(() => {
        if (!paysMontre) return null;
        const sites = sitesAffiches.filter((row) => row.country === paysMontre);
        const ouvert = siteMontre && siteMontre.country === paysMontre ? siteMontre.site : null;
        const locaux = ouvert ? [...localRows].sort(compareByProgress) : [];
        return {
            pays: paysMontre,
            site: ouvert,
            sites,
            locaux,
            totaux: totauxDe(ouvert ? localRows : sites),
            /* La rangée « hors local » n'est pas un local. */
            locauxComptes: ouvert
                ? localRows.filter((row) => Boolean(row.local)).length
                : sites.reduce((somme, row) => somme + (row.localCount ?? 0), 0),
            /* Un pays à un seul site n'a pas de niveau « sites » où revenir ; une liste à
               plat non plus. */
            retourAuxSites: niveau === 'pays' && sites.length > 1,
        };
    }, [localRows, niveau, paysMontre, siteMontre, sitesAffiches]);

    /** Le héro et la bande comptent **le parc**, quel que soit le choix en cours. */
    const totals = useMemo(() => totauxDe(siteRows), [siteRows]);

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
    const scopeOptions = useMemo(
        () => ({
            status: STATUS_OPTIONS.map((option) => ({
                ...option,
                count:
                    option.value === ALL_VALUE
                        ? siteRows.length
                        : siteRows.filter((row) => row.status === option.value).length,
            })),
        }),
        [siteRows],
    );

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
     * **Un pays s'ouvre sur ses sites** — et **jamais sur un choix à une seule réponse** :
     * un pays qui n'a qu'un site ouvre directement ses locaux, et si ce site n'a pas de
     * local, le comptage. Quatre des cinq pays du jeu d'essai n'ont qu'un site : leur
     * faire choisir « Cotonou » parmi « Cotonou » serait un geste pour rien.
     */
    const chooseCountry = (country: string) => {
        const sites = sitesAffiches.filter((row) => row.country === country);
        if (sites.length === 1) {
            const seul = sites[0];
            if ((seul.localCount ?? 0) > 0) {
                setChosenCountry(country);
                setOpenedSite({ country, site: seul.site });
            } else openAuditDetails(seul);
            return;
        }
        setChosenCountry(country);
        setOpenedSite(null);
    };

    /**
     * **La rangée ouvre le niveau suivant** (16.1). Un site qui a des locaux ouvre ses
     * locaux ; un site qui n'en a pas — comme un local, comme le reste d'un site — ouvre
     * le comptage.
     */
    const handleOpenPlace = (row: PlaceAuditRow) => {
        if (!row.local && !row.horsLocal && (row.localCount ?? 0) > 0) {
            if (lieuDeLaPage) {
                navigate(adresseDesLieux(row.country, row.site));
                return;
            }
            setChosenCountry(row.country);
            setOpenedSite({ country: row.country, site: row.site });
            return;
        }
        openAuditDetails(row);
    };

    const closeChoix = () => {
        setChosenCountry(null);
        setOpenedSite(null);
    };

    /**
     * Lancer le comptage du lieu porté par une rangée — le geste `.rbtn`. Il prend la
     * rangée en argument : le geste est sur la rangée, donc son objet ne peut pas
     * manquer et il n'y a pas de garde « sélectionnez d'abord » à écrire.
     */
    const startAuditForRow = (row: PlaceAuditRow) => {
        showToast(
            `Campagne lancée sur ${row.local ? `${row.local} (${row.site})` : placeLabel(row)}.`,
            'success',
        );
        openAuditDetails(row);
    };

    /** Du panneau à la page qui porte tous les lieux du choix. */
    const openAllPlaces = () => {
        if (!chosenCountry) return;
        navigate(adresseDesLieux(chosenCountry, openedSite?.site ?? null));
    };

    const resetFilters = () => {
        setSelectedStatus(ALL_VALUE);
        setSearchQuery('');
    };

    if (lieuDeLaPage)
        return (
            <AuditLieux
                pays={lieuDeLaPage.country}
                choix={choix}
                onBack={onLeave}
                onOpenPlace={handleOpenPlace}
                onStartPlace={startAuditForRow}
            />
        );

    return (
        <AuditOverview
            onLeave={onLeave}
            niveau={niveau}
            countries={countryRows}
            sites={sitesAffiches}
            choix={choix}
            totals={totals}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{ status: selectedStatus }}
            filterOptions={scopeOptions}
            onFilterChange={(_key, value) => setSelectedStatus(value)}
            onResetFilters={resetFilters}
            onChooseCountry={chooseCountry}
            onOpenPlace={handleOpenPlace}
            onStartPlace={startAuditForRow}
            onBackToSites={() => setOpenedSite(null)}
            onOpenAllPlaces={openAllPlaces}
            onCloseChoix={closeChoix}
            unscopedAssets={unscopedAssets}
            totalSiteCount={siteRows.length}
        />
    );
};
