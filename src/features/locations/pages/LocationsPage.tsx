import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretRight,
    Clock,
    DoorOpen,
    Flag,
    GlobeHemisphereWest,
    MapPin,
    Plus,
    SortAscending,
    UploadSimple,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import { OfflineBanner } from '../../../components/ui/ContextBanner';
import { FabContainer } from '../../../components/ui/FabContainer';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import ListRow from '../../../components/ui/ListRow';
import Modal from '../../../components/ui/Modal';
import ScreenState from '../../../components/ui/ScreenState';
import SearchField from '../../../components/ui/SearchField';
import SelectField from '../../../components/ui/SelectField';
import { MEDIA } from '../../../constants/breakpoints';
import { GLOSSARY } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../lib/utils';
import { ViewType } from '../../../types';
import { siteCodeOf } from '../lib/siteCode';

const ALL_COUNTRIES = 'Tous';

const SORT_OPTIONS = [
    { id: 'pays', label: 'Par pays' },
    { id: 'actifs', label: "Par nombre d'actifs" },
    { id: 'nom', label: 'Par nom' },
] as const;

type NewLocationKind = 'site' | 'local' | 'country';

interface LocationsPageProps {
    onViewChange?: (view: ViewType) => void;
    onSiteClick?: (site: string) => void;
}

/**
 * **Emplacements — une liste, pas trois cascades** (planche 10.1).
 *
 * L'écran empilait trois cartes à choisir dans l'ordre — Pays, puis Sites, puis
 * Services, les deux dernières grisées tant que la précédente n'était pas prise — et
 * un récapitulatif qui ne s'allumait qu'une fois un **service** désigné. *« 2 142 px,
 * trois écrans […] Rien ne se choisit pour lire : on ouvre. »*
 *
 * Ici : **une** liste de sites, groupée par pays avec l'en-tête de famille de 09.1, et
 * le récapitulatif descend sur la fiche du site, où il a un sujet.
 *
 * **A2 — l'arbre ne garde que la géographie : pays → site → local.** Le service en
 * sort, parce que ce n'est pas un lieu : *« un axe se juge à ce qu'il porte — pays et
 * site portent des actifs, des utilisateurs et une campagne d'audit ; le service,
 * rien »*. L'écran l'avouait lui-même, en suffixant ses deux compteurs de « au site —
 * service non renseigné ». Il reste dans la donnée, comme périmètre de relevé d'une
 * campagne d'audit, et se tient depuis la fiche du site.
 *
 * **Il n'y a pas d'écran de pays, et c'est une décision.** Trois pays, quatre sites :
 * un écran qui n'offre que *France · Sénégal · Togo* fait payer une frappe pour
 * n'apprendre rien — c'est la cascade qu'on retire. Le pays reste un **groupe**, avec
 * son glyphe et son décompte.
 */
const LocationsPage: React.FC<LocationsPageProps> = ({ onViewChange, onSiteClick }) => {
    const { locationData, equipment, users, addLocation } = useData();
    const { showToast } = useToast();
    const isCompact = useMediaQuery(MEDIA.compact);

    const [searchQuery, setSearchQuery] = useState('');
    const [countryFilter, setCountryFilter] = useState<string>(ALL_COUNTRIES);
    const [sortIndex, setSortIndex] = useState(0);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [newKind, setNewKind] = useState<NewLocationKind | null>(null);
    const [newName, setNewName] = useState('');
    const [newParent, setNewParent] = useState('');

    const debouncedSearch = useDebounce(searchQuery, 300);

    /** Les sites, à plat, avec ce qui décide d'eux : actifs, utilisateurs, locaux. */
    const sites = useMemo(() => {
        return Object.entries(locationData.sites).flatMap(([country, siteNames]) =>
            (siteNames as string[]).map((name) => {
                const siteEquipment = equipment.filter((item) => item.site === name);
                const siteUsers = users.filter((user) => user.site === name);
                const locals = (locationData.locals[name] || []) as string[];
                return {
                    country,
                    name,
                    locals,
                    assetCount: siteEquipment.length,
                    userCount: siteUsers.length,
                    code: siteCodeOf(siteEquipment),
                    neverServed: siteEquipment.length === 0 && siteUsers.length === 0,
                };
            }),
        );
    }, [locationData.sites, locationData.locals, equipment, users]);

    const matchingSites = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        if (!query) return sites;
        return sites.filter(
            (site) =>
                site.name.toLowerCase().includes(query) ||
                site.country.toLowerCase().includes(query) ||
                site.locals.some((local) => local.toLowerCase().includes(query)),
        );
    }, [sites, debouncedSearch]);

    const visibleSites = useMemo(
        () =>
            countryFilter === ALL_COUNTRIES
                ? matchingSites
                : matchingSites.filter((site) => site.country === countryFilter),
        [matchingSites, countryFilter],
    );

    /** Les pastilles de pays — le seul filtre de l'écran, et il est borné. */
    const countryFacets = useMemo(() => {
        const counts = new Map<string, number>();
        matchingSites.forEach((site) =>
            counts.set(site.country, (counts.get(site.country) ?? 0) + 1),
        );
        return [
            { id: ALL_COUNTRIES, label: ALL_COUNTRIES, count: matchingSites.length },
            ...locationData.countries
                .filter((country) => counts.has(country))
                .map((country) => ({
                    id: country,
                    label: country,
                    count: counts.get(country) as number,
                })),
        ];
    }, [matchingSites, locationData.countries]);

    const sitesByCountry = useMemo(() => {
        const sortOption = SORT_OPTIONS[sortIndex].id;
        const buckets = new Map<string, typeof visibleSites>();
        visibleSites.forEach((site) => {
            buckets.set(site.country, [...(buckets.get(site.country) || []), site]);
        });
        return locationData.countries
            .filter((country) => buckets.has(country))
            .map((country) => {
                const items = [...(buckets.get(country) as typeof visibleSites)];
                items.sort((a, b) => {
                    if (sortOption === 'actifs') return b.assetCount - a.assetCount;
                    return a.name.localeCompare(b.name, 'fr');
                });
                return { country, items };
            });
    }, [visibleSites, locationData.countries, sortIndex]);

    const totalLocals = useMemo(
        () => sites.reduce((sum, site) => sum + site.locals.length, 0),
        [sites],
    );
    const localisedAssets = useMemo(
        () => equipment.filter((item) => Boolean(item.site)).length,
        [equipment],
    );
    const neverServedSites = useMemo(() => sites.filter((site) => site.neverServed), [sites]);

    const isFiltered = Boolean(debouncedSearch) || countryFilter !== ALL_COUNTRIES;
    const isReferentialEmpty = sites.length === 0 && locationData.countries.length === 0;

    /* Le parent possible du nouvel emplacement : un pays pour un site, un site pour
       un local. Un pays n'en a pas. */
    const parentOptions = useMemo(() => {
        if (newKind === 'site') {
            return locationData.countries.map((country) => ({ value: country, label: country }));
        }
        if (newKind === 'local') {
            return sites.map((site) => ({
                value: site.name,
                label: `${site.name} · ${site.country}`,
            }));
        }
        return [];
    }, [newKind, locationData.countries, sites]);

    useEffect(() => {
        if (
            parentOptions.length > 0 &&
            !parentOptions.some((option) => option.value === newParent)
        ) {
            setNewParent(parentOptions[0].value);
        }
    }, [parentOptions, newParent]);

    const openCreate = (kind: NewLocationKind) => {
        setIsAddSheetOpen(false);
        setNewKind(kind);
        setNewName('');
    };

    const closeCreate = () => {
        setNewKind(null);
        setNewName('');
    };

    const submitCreate = () => {
        if (!newKind) return;
        const name = newName.trim();
        if (!name) {
            showToast('Le nom est obligatoire.', 'error');
            return;
        }
        if (newKind !== 'country' && !newParent) {
            showToast(newKind === 'site' ? 'Choisissez un pays.' : 'Choisissez un site.', 'error');
            return;
        }

        const created = addLocation(newKind, name, newKind === 'country' ? undefined : newParent);
        if (!created) {
            showToast(`« ${name} » existe déjà à cet endroit.`, 'error');
            return;
        }
        showToast(`« ${name} » ajouté.`, 'success');
        closeCreate();
    };

    const kindLabel = newKind === 'country' ? 'pays' : newKind === 'local' ? 'local' : 'site';

    return (
        <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
            {/* « Ajouter un emplacement » — la feuille de 10.1 : on demande ce qu'on
                ajoute. Un site est une adresse, un local précise un site sans en être
                un, un pays ne sert qu'à grouper. */}
            <BottomSheet
                open={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                title="Ajouter un emplacement"
            >
                <div className="flex flex-col py-2">
                    {[
                        {
                            kind: 'site' as NewLocationKind,
                            glyph: MapPin,
                            title: 'Un site',
                            note: "une adresse : c'est lui qui décide si une remise demande un transport",
                        },
                        {
                            kind: 'local' as NewLocationKind,
                            glyph: DoorOpen,
                            title: 'Un local',
                            note: 'il précise un site sans en être un — la salle serveurs est dans le Bureau Paris',
                        },
                        {
                            kind: 'country' as NewLocationKind,
                            glyph: Flag,
                            title: 'Un pays',
                            note: "il ne sert qu'à grouper les sites",
                        },
                    ].map((option) => (
                        <Button
                            key={option.kind}
                            variant="text"
                            className="flex min-h-16 w-full items-center justify-start gap-3.5 rounded-none px-5 py-2.5 text-left"
                            onClick={() => openCreate(option.kind)}
                        >
                            <span className="rounded-vignette bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center">
                                <Icon glyph={option.glyph} size={20} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="text-on-surface block text-[15px] font-medium">
                                    {option.title}
                                </span>
                                <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                    {option.note}
                                </span>
                            </span>
                            <Icon
                                glyph={CaretRight}
                                size={18}
                                className="text-text-secondary shrink-0"
                            />
                        </Button>
                    ))}
                </div>
            </BottomSheet>

            <Modal
                isOpen={Boolean(newKind)}
                onClose={closeCreate}
                title={`Ajouter un ${kindLabel}`}
                footer={
                    <>
                        <Button variant="outlined" onClick={closeCreate}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitCreate}>
                            Ajouter
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <InputField
                        label={`Nom du ${kindLabel}`}
                        name="location-name"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        required
                    />
                    {newKind && newKind !== 'country' && (
                        <SelectField
                            label={newKind === 'site' ? 'Pays' : 'Site'}
                            name="location-parent"
                            value={newParent}
                            onChange={(event) => setNewParent(event.target.value)}
                            options={parentOptions}
                            required
                        />
                    )}
                </div>
            </Modal>

            {/* LA BARRE — `.tbar`, reprise au caractère de 04.1. */}
            {isCompact ? (
                <div className="border-outline-variant bg-surface flex min-h-14 items-center justify-between border-b px-5 py-1">
                    <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[20px] leading-7 font-semibold tracking-[-0.015em]">
                        {GLOSSARY.LOCATIONS}
                    </h1>
                </div>
            ) : (
                <div className="px-page flex items-center gap-3 pt-5">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                        <h1 className="font-brand text-on-surface shrink-0 text-[20px] leading-7 font-semibold tracking-[-0.015em]">
                            {GLOSSARY.LOCATIONS}
                        </h1>
                        <span className="text-text-secondary min-w-0 truncate text-[13px] leading-5">
                            <b className="font-brand text-on-surface font-semibold tabular-nums">
                                {sites.length} site{sites.length > 1 ? 's' : ''}
                            </b>
                            {` dans ${locationData.countries.length} pays`}
                        </span>
                    </div>
                    <span className="flex-1" />
                    <Button
                        variant="outlined"
                        icon={<Icon glyph={UploadSimple} size={18} />}
                        onClick={() => onViewChange?.('import_locations')}
                    >
                        Importer
                    </Button>
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Plus} size={18} />}
                        onClick={() => setIsAddSheetOpen(true)}
                    >
                        Ajouter un emplacement
                    </Button>
                </div>
            )}

            <OfflineBanner />

            {!isReferentialEmpty && (
                <div
                    className={cn(
                        'flex flex-col gap-2.5',
                        isCompact
                            ? 'border-outline-variant bg-surface border-b px-5 py-3'
                            : 'px-page pt-4',
                    )}
                >
                    <Reading>
                        <SearchField
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Site, local, pays"
                        />
                    </Reading>
                    <Reading className="overflow-hidden">
                        <div
                            className={cn(
                                'flex [scrollbar-width:none] gap-2 overflow-x-auto',
                                isCompact ? 'pr-1' : 'flex-wrap',
                            )}
                        >
                            {countryFacets.map((facet) => (
                                <FacetChip
                                    key={facet.id}
                                    label={facet.label}
                                    count={facet.count}
                                    selected={facet.id === countryFilter}
                                    onClick={() => setCountryFilter(facet.id)}
                                />
                            ))}
                        </div>
                    </Reading>
                </div>
            )}

            <div
                className={cn(
                    'medium:px-page flex flex-1 flex-col px-5 pt-4 pb-5',
                    isCompact && !isReferentialEmpty && 'pb-9',
                )}
            >
                {isReferentialEmpty ? (
                    <ScreenState
                        icon={GlobeHemisphereWest}
                        title="Aucun emplacement"
                        description={
                            <>
                                Sans pays ni site,{' '}
                                <b className="text-on-surface font-medium">
                                    aucun actif ne peut être localisé
                                </b>{' '}
                                : un équipement tire son lieu d'ici.
                            </>
                        }
                        actions={
                            <Button
                                variant="filled"
                                icon={<Icon glyph={Plus} size={18} />}
                                onClick={() => openCreate('country')}
                            >
                                Créer le premier pays
                            </Button>
                        }
                    />
                ) : (
                    <Reading className="flex flex-col">
                        {/* LE PORTE-VOIX — `.pv` : le niveau courant, à 28 px. */}
                        {isCompact && (
                            <div className="flex items-start gap-2.5 px-0.5 pb-0.5">
                                <Icon
                                    glyph={GlobeHemisphereWest}
                                    size={20}
                                    className="text-text-muted mt-1.5"
                                />
                                <span className="min-w-0">
                                    <b className="font-brand text-on-surface block text-[28px] leading-8 font-semibold tracking-[-0.02em] tabular-nums">
                                        {sites.length} site{sites.length > 1 ? 's' : ''}
                                    </b>
                                    <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                                        dans {locationData.countries.length} pays, portant{' '}
                                        {localisedAssets} actif
                                        {localisedAssets > 1 ? 's' : ''} — le niveau courant est le
                                        référentiel entier.
                                    </span>
                                </span>
                            </div>
                        )}

                        <div className="text-text-secondary flex min-h-11 items-center justify-between gap-3 px-0.5 text-[13px]">
                            <span className="whitespace-nowrap">
                                <b className="text-on-surface font-semibold tabular-nums">
                                    {totalLocals}
                                </b>{' '}
                                local
                                {totalLocals > 1 ? 'aux' : ''} déclaré{totalLocals > 1 ? 's' : ''}
                            </span>
                            <Button
                                variant="text"
                                onClick={() =>
                                    setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)
                                }
                                className="text-on-surface -mr-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium"
                            >
                                <Icon
                                    glyph={SortAscending}
                                    size={18}
                                    className="text-text-secondary"
                                />
                                {SORT_OPTIONS[sortIndex].label}
                            </Button>
                        </div>

                        {visibleSites.length > 0 ? (
                            <>
                                <div className="flex flex-col gap-5">
                                    {sitesByCountry.map(({ country, items }) => (
                                        <section key={country}>
                                            {/* `.fh` — l'en-tête de pays coiffe la carte sans être
                                                dedans (§2.36), et porte son glyphe. */}
                                            <div className="text-on-surface flex items-baseline justify-between gap-3 px-0.5 pb-2 text-[13px] font-medium">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <Icon
                                                        glyph={Flag}
                                                        size={18}
                                                        className="text-text-muted"
                                                    />
                                                    <span className="truncate">{country}</span>
                                                </span>
                                                <span className="text-text-secondary shrink-0 text-[12px] font-normal tabular-nums">
                                                    {items.length} site{items.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="rounded-card bg-surface p-4">
                                                {items.map((site) => (
                                                    <React.Fragment key={site.name}>
                                                        <ListRow
                                                            vignette={
                                                                <span
                                                                    className={
                                                                        site.neverServed
                                                                            ? 'text-text-muted'
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Icon
                                                                        glyph={MapPin}
                                                                        size={20}
                                                                    />
                                                                </span>
                                                            }
                                                            title={
                                                                site.neverServed ? (
                                                                    <span className="text-text-secondary">
                                                                        {site.name}
                                                                    </span>
                                                                ) : (
                                                                    site.name
                                                                )
                                                            }
                                                            type={
                                                                site.neverServed ? (
                                                                    <span className="text-text-muted text-[13px] font-normal">
                                                                        0 actif
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-on-surface text-[13px] font-medium tabular-nums">
                                                                        {site.assetCount} actif
                                                                        {site.assetCount > 1
                                                                            ? 's'
                                                                            : ''}
                                                                    </span>
                                                                )
                                                            }
                                                            status={
                                                                site.neverServed
                                                                    ? {
                                                                          icon: Clock,
                                                                          label: 'jamais servi',
                                                                          tone: 'pending',
                                                                      }
                                                                    : undefined
                                                            }
                                                            holder={
                                                                site.neverServed
                                                                    ? 'Jamais servi · aucun utilisateur'
                                                                    : `${site.userCount} utilisateur${site.userCount > 1 ? 's' : ''}${
                                                                          site.locals.length > 0
                                                                              ? ` · ${site.locals.length} local${site.locals.length > 1 ? 'aux' : ''}`
                                                                              : ''
                                                                      }`
                                                            }
                                                            reference={site.code}
                                                            onOpen={() => onSiteClick?.(site.name)}
                                                        />
                                                        {/* Les locaux apparaissent **sous leur site**, en
                                                            retrait, et seulement là où il y en a. */}
                                                        {site.locals.map((local) => {
                                                            const localAssets = equipment.filter(
                                                                (item) =>
                                                                    item.site === site.name &&
                                                                    item.service === local,
                                                            ).length;
                                                            return (
                                                                <div
                                                                    key={`${site.name}-${local}`}
                                                                    className="pl-8"
                                                                >
                                                                    <ListRow
                                                                        vignette={
                                                                            <Icon
                                                                                glyph={DoorOpen}
                                                                                size={20}
                                                                            />
                                                                        }
                                                                        title={local}
                                                                        type={
                                                                            <span className="text-on-surface text-[13px] font-medium tabular-nums">
                                                                                {localAssets} actif
                                                                                {localAssets > 1
                                                                                    ? 's'
                                                                                    : ''}
                                                                            </span>
                                                                        }
                                                                        holder={`Local du ${site.name}`}
                                                                        onOpen={() =>
                                                                            onSiteClick?.(site.name)
                                                                        }
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>

                                {neverServedSites.length > 0 && (
                                    <p className="text-text-secondary mt-[7px] px-0.5 text-[12px] leading-[17px]">
                                        <b className="text-on-surface font-medium">
                                            {neverServedSites.map((site) => site.name).join(', ')}
                                            {neverServedSites.length > 1
                                                ? ' ne portent rien'
                                                : ' ne porte rien'}
                                        </b>
                                        {
                                            " — ni actif, ni utilisateur. Ce n'est pas une panne : un site s'ouvre avant d'être équipé."
                                        }
                                    </p>
                                )}

                                {localisedAssets < equipment.length && (
                                    <p className="text-text-muted mt-1.5 px-0.5 text-center text-[12px] leading-[17px] tabular-nums">
                                        {localisedAssets} actifs sur {equipment.length} sont
                                        localisés. La ventilation des{' '}
                                        {equipment.length - localisedAssets} autres n'est pas
                                        relevée.
                                    </p>
                                )}
                            </>
                        ) : (
                            <ScreenState
                                icon={MapPin}
                                title="Aucun site ne correspond"
                                description="Élargissez la recherche, ou revenez à la totalité du référentiel."
                                actions={
                                    isFiltered ? (
                                        <Button
                                            variant="filled"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setCountryFilter(ALL_COUNTRIES);
                                            }}
                                        >
                                            Voir les {sites.length} sites
                                        </Button>
                                    ) : undefined
                                }
                            />
                        )}
                    </Reading>
                )}
            </div>

            {isCompact && !isReferentialEmpty && (
                <FabContainer
                    description="Ajouter un emplacement"
                    className="compact:bottom-[76px] right-5 bottom-[76px]"
                >
                    <Button
                        variant="filled"
                        iconOnly
                        aria-label="Ajouter un emplacement"
                        className="flex h-14 w-14 min-w-0 items-center justify-center rounded-xl p-0 shadow-[0_4px_14px_rgba(10,25,29,0.22)] transition-transform active:scale-95"
                        onClick={() => setIsAddSheetOpen(true)}
                    >
                        <Icon glyph={Plus} size={24} />
                    </Button>
                </FabContainer>
            )}
        </div>
    );
};

export default LocationsPage;
