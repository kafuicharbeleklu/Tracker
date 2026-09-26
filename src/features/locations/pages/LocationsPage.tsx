import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CaretRight,
    Hourglass,
    DoorOpen,
    FileCsv,
    Funnel,
    GlobeHemisphereWest,
    MapPin,
    Plus,
    UploadSimple,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import { FabContainer } from '../../../components/ui/FabContainer';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import FactRow from '../../../components/ui/FactRow';
import GlobePointille from '../components/GlobePointille';
import { positionDuPays } from '../lib/paysCoordonnees';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import SearchField from '../../../components/ui/SearchField';
import SelectField from '../../../components/ui/SelectField';
import { MEDIA } from '../../../constants/breakpoints';
import { GLOSSARY } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../lib/utils';
import { CADRE_BUREAU, CORPS_BUREAU, PAGE_BUREAU } from '../../../lib/regimeBureau';
import { ViewType } from '../../../types';
import { countryCodeOf } from '../lib/siteCode';

type NewLocationKind = 'site' | 'local' | 'country';

/**
 * **La pastille de code d'un pays** (planche 10.1, `.fh .si` — 32 px, rayon 4,
 * Archivo 600 à 13 px, interlettrage +0,02 em).
 *
 * La teinte **distingue une famille de la suivante**, elle ne qualifie rien : un pays
 * n'a ni humeur ni état. Elle est donc prise dans l'ordre du référentiel, jamais
 * déduite d'un chiffre — la règle « une teinte par nature de chiffre » de la passe
 * sobre ne s'applique qu'aux tuiles qui portent un nombre.
 */
const COUNTRY_TINT = [
    'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
] as const;

interface LocationsPageProps {
    onViewChange?: (view: ViewType) => void;
    onSiteClick?: (site: string) => void;
    /** Le retour vers « Plus » — la flèche de 10.1, au téléphone seulement. */
    onBack?: () => void;
}

/**
 * **Emplacements — une liste, pas trois cascades** (planche 10.1, **passe sobre du
 * 03/09**).
 *
 * L'écran empilait trois cartes à choisir dans l'ordre — Pays, puis Sites, puis
 * Services — et un récapitulatif qui ne s'allumait qu'une fois un **service**
 * désigné. La planche d'août avait déjà remplacé cela par **une** liste de sites
 * groupée par pays ; la passe sobre du 03/09 rejoue la même page avec moins de
 * texte et plus d'air.
 *
 * **A2 — l'arbre ne garde que la géographie : pays → site → local.** Le service en
 * sort, parce que ce n'est pas un lieu : il reste un attribut de la **personne**.
 *
 * **Il n'y a pas d'écran de pays, et c'est une décision.** *« Le pays est un groupe,
 * pas un passage obligé. »* Il porte son **code** — celui qui préfixe les
 * identifiants, Togo → LFW, Bénin → COO — dans une pastille de 32 px, son nom à
 * 17 px et son décompte de sites.
 *
 * ## Ce que la passe sobre change, et pourquoi la planche le veut
 *
 * - **Le titre passe de 20 à 28 px** (`--t1`, Archivo 600/32, −0,02 em) et **la
 *   recherche entre dans le même bloc que lui** (`.top`, un seul fond de surface,
 *   `8px 16px 12px`, gouttière de 12). Le porte-voix de la planche d'août — le
 *   « 4 sites » à 28 px posé dans la page — **disparaît** : il est absorbé par le
 *   titre, qui dit déjà où l'on est.
 * - **Les pastilles de facette par pays disparaissent.** La planche n'en dessine
 *   aucune : la liste est *déjà* groupée par pays, et le champ cherche « Site,
 *   local, pays ». Un filtre qui redit le groupement fait payer une frappe pour ne
 *   rien apprendre — c'est la cascade qu'on retire, sous une autre forme.
 * - **Le bouton de tri disparaît** lui aussi. L'ordre est fixe : les sites qui
 *   servent d'abord, puis les autres, chacun par ordre alphabétique.
 * - **Les locaux quittent la liste** : ils vivent dans la fiche du site (`.colnote` :
 *   *« Les locaux sont dans la fiche du site, pas dans la liste »*).
 * - **Une rangée ne porte plus de nombre à droite.** Ses chiffres descendent dans la
 *   sous-ligne — « 8 actifs · 8 personnes · 1 local » — et la droite n'a plus qu'un
 *   chevron.
 * - **Aucune note dans l'écran** (R15). Les deux paragraphes qui expliquaient qu'un
 *   site s'ouvre avant d'être équipé, et que six actifs sur quatorze ne sont pas
 *   ventilés, sont partis : le premier ne disait rien que la rangée ne dise déjà,
 *   le second est devenu la ligne `.ord` du haut de page.
 * - **La feuille d'ajout gagne un quatrième chemin** : importer un fichier (09.2).
 *
 * ## L'écart que la planche ne peut pas lever seule
 *
 * La feuille annonce un pays comme *« un nom et son code à trois lettres »*. Le store
 * ne porte pas ce champ — `LocationData.countries` est un `string[]` —, si bien que
 * le code affiché est **relevé** sur les identifiants d'actifs (`countryCodeOf`), et
 * que la modale de création ne le demande pas. Le champ manque dans
 * `src/context/DataContext.tsx`, hors du périmètre de ce portage.
 */
const LocationsPage: React.FC<LocationsPageProps> = ({ onViewChange, onSiteClick, onBack }) => {
    const { locationData, equipment, users, addLocation } = useData();
    const { showToast } = useToast();
    const isCompact = useMediaQuery(MEDIA.compact);
    /* Les sites en grille de cartes au-delà de 840 (23/09). */
    const enGrille = useMediaQuery(MEDIA.expandedUp);

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [newKind, setNewKind] = useState<NewLocationKind | null>(null);
    const [newName, setNewName] = useState('');
    const [newParent, setNewParent] = useState('');

    const debouncedSearch = useDebounce(searchQuery, 300);

    /** Les sites, à plat, avec ce qui décide d'eux : actifs, personnes, locaux. */
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
                    neverServed: siteEquipment.length === 0 && siteUsers.length === 0,
                };
            }),
        );
    }, [locationData.sites, locationData.locals, equipment, users]);

    /* La recherche est le seul filtre de l'écran : la planche ne dessine aucune
       pastille de facette. Elle porte sur le site, son pays et ses locaux — c'est
       ce que le champ annonce. */
    const visibleSites = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        if (!query) return sites;
        return sites.filter(
            (site) =>
                site.name.toLowerCase().includes(query) ||
                site.country.toLowerCase().includes(query) ||
                site.locals.some((local) => local.toLowerCase().includes(query)),
        );
    }, [sites, debouncedSearch]);

    /**
     * Les familles de la liste — une par pays, dans l'ordre du référentiel.
     *
     * L'ordre **à l'intérieur** d'une famille est fixe, la planche ayant retiré le
     * bouton de tri : ce qui sert passe devant ce qui n'a jamais servi, puis
     * l'alphabet. C'est l'ordre que la planche dessine — *Lomé Siège* avant *Kara*,
     * qui le précéderait pourtant à l'alphabet.
     */
    const families = useMemo(() => {
        const buckets = new Map<string, typeof visibleSites>();
        visibleSites.forEach((site) => {
            buckets.set(site.country, [...(buckets.get(site.country) || []), site]);
        });
        return locationData.countries
            .filter((country) => buckets.has(country))
            .map((country, index) => {
                const items = [...(buckets.get(country) as typeof visibleSites)];
                items.sort((a, b) => {
                    if (a.neverServed !== b.neverServed) return a.neverServed ? 1 : -1;
                    return a.name.localeCompare(b.name, 'fr');
                });
                const countrySites = new Set(
                    ((locationData.sites[country] || []) as string[]).map((name) => name),
                );
                return {
                    country,
                    items,
                    code: countryCodeOf(equipment.filter((item) => countrySites.has(item.site))),
                    tint: COUNTRY_TINT[index % COUNTRY_TINT.length],
                };
            });
    }, [visibleSites, locationData.countries, locationData.sites, equipment]);

    const localisedAssets = useMemo(
        () => equipment.filter((item) => Boolean(item.site)).length,
        [equipment],
    );

    const isFiltered = Boolean(debouncedSearch);

    /* **Le globe au bureau** (24/09, essai) : dès 1 280, la grille de cartes laissait le
       tiers droit vide ; les pays passent sur un globe en pointillés, et le pays choisi
       ouvre sa carte à côté. */
    const avecGlobe = useMediaQuery(MEDIA.twoColumn);
    const statsParPays = useMemo(
        () =>
            families.map(({ country, items, code }) => ({
                country,
                code,
                items,
                actifs: items.reduce((t, site) => t + site.assetCount, 0),
                personnes: items.reduce((t, site) => t + site.userCount, 0),
                position: positionDuPays(country),
            })),
        [families],
    );
    const [paysChoisi, setPaysChoisi] = useState<string | null>(null);
    const paysAffiche =
        statsParPays.find((pays) => pays.country === paysChoisi) ??
        [...statsParPays].sort((a, b) => b.actifs - a.actifs)[0];
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

    const searchField = (
        /* Au bureau, le champ cerné de la ligne d'outils (17.11), 320 × 40. */
        <SearchField
            dense={!isCompact}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Site, local, pays"
            className={isCompact ? undefined : 'w-[320px] max-w-full'}
        />
    );

    return (
        /* **Les emplacements tiennent la fenêtre au bureau** (23/09) — même régime que le
           gabarit des listes : l'en-tête reste, les pays défilent dessous. */
        <div className={cn('relative flex min-h-0 w-full min-w-0 flex-1 flex-col', PAGE_BUREAU)}>
            {/* « Ajouter un emplacement » — la feuille de 10.1 : **quatre chemins, pas
                de pied**. Chaque rangée fait 64 px, porte sa vignette de 40, un titre à
                16/24, une sous-ligne à 14/20 et un chevron. Les sous-lignes de la
                planche disent ce que l'objet *est*, en cinq mots ; elles ne plaident
                plus (R15 : aucune note dans l'écran). */}
            <BottomSheet
                open={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                title="Ajouter un emplacement"
            >
                <div className="divide-outline-variant flex flex-col divide-y">
                    {/* `.orow` de 10.1 — le titre en 400, que le bouton ramenait à 500, et à
                        72 du bord : la feuille pose déjà ses 20 de côté, la rangée n'en
                        rajoute pas (relevé du 13/09). */}
                    {[
                        {
                            key: 'site',
                            glyph: MapPin,
                            tint: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
                            title: 'Un site',
                            sub: 'Une adresse, dans un pays existant',
                            onSelect: () => openCreate('site'),
                        },
                        {
                            key: 'local',
                            glyph: DoorOpen,
                            tint: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
                            title: 'Un local',
                            sub: 'Une salle dans un site',
                            onSelect: () => openCreate('local'),
                        },
                        {
                            key: 'country',
                            glyph: GlobeHemisphereWest,
                            tint: 'bg-surface-container text-on-surface-variant',
                            title: 'Un pays',
                            sub: 'Un nom, pour grouper les sites',
                            onSelect: () => openCreate('country'),
                        },
                        {
                            key: 'import',
                            glyph: FileCsv,
                            tint: 'bg-surface-container text-on-surface-variant',
                            title: 'Importer un fichier',
                            sub: 'Pays, sites, locaux, une ligne chacun',
                            onSelect: () => {
                                setIsAddSheetOpen(false);
                                onViewChange?.('import_locations');
                            },
                        },
                    ]
                        /* Sans pays, le site et le local n'ont nulle part où aller : le pays
                           passe en tête. */
                        .sort((a, b) =>
                            locationData.countries.length === 0
                                ? Number(b.key === 'country') - Number(a.key === 'country')
                                : 0,
                        )
                        .map((option) => (
                            <Button
                                key={option.key}
                                variant="text"
                                className="flex min-h-16 w-full items-center justify-start gap-3 rounded-none px-0 py-2 text-left font-normal"
                                onClick={option.onSelect}
                            >
                                <span
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                                        option.tint,
                                    )}
                                >
                                    <Icon glyph={option.glyph} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                        {option.title}
                                    </span>
                                    <span className="text-text-secondary text-ts-sub leading-ts-sub block truncate">
                                        {option.sub}
                                    </span>
                                </span>
                                <Icon
                                    glyph={CaretRight}
                                    size={20}
                                    className="text-text-tertiary shrink-0"
                                />
                            </Button>
                        ))}
                </div>
            </BottomSheet>
            {/* **Le chemin choisi ouvre une feuille, pas une fenêtre.** 16.1 pose les
                quatre chemins dans une feuille ; celui qu'on prend n'a qu'un ou deux
                champs, et la même surface le porte — montante au téléphone, centrée à
                560 au-delà de 600 (00.5). Il ouvrait un `Modal` : au téléphone, une
                boîte qui prenait tout l'écran pour un seul champ. */}
            <BottomSheet
                open={Boolean(newKind)}
                onClose={closeCreate}
                title={`Ajouter un ${kindLabel}`}
            >
                <div className="flex flex-col gap-4">
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

                    {/* `.sfoot` — deux colonnes égales, filet au-dessus. */}
                    <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={closeCreate}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitCreate}>
                            Ajouter
                        </Button>
                    </div>
                </div>
            </BottomSheet>
            {/* `.top` — **un seul bloc** : le titre à 28 px et la recherche sous lui,
                sur le même fond de surface, séparés de 12. La planche ne met plus de
                bande de filtres entre les deux. Il **reste** quand les sites défilent
                (17.8). */}
            {isCompact ? (
                <div className="border-outline-variant bg-surface sticky top-0 z-20 flex flex-col gap-3 border-b px-4 pt-2 pb-3">
                    <div className="flex min-h-12 items-center gap-1">
                        {onBack && (
                            <Button
                                variant="text"
                                iconOnly
                                aria-label="Retour"
                                onClick={onBack}
                                className="text-on-surface hover:bg-surface-container -ml-3 shrink-0 rounded-md"
                            >
                                <Icon glyph={ArrowLeft} size={24} />
                            </Button>
                        )}
                        <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 shrink font-semibold tracking-[-0.02em]">
                            {GLOSSARY.LOCATIONS}
                        </h1>
                        {/* **Le compte à côté du titre, plus de ligne de service** (24/09) — la
                            règle des listes du 23/09 : « 4 sites » monte en 12 à droite du
                            titre ; les pays se lisent dans les en-têtes de groupe, les actifs
                            dans chaque rangée. */}
                        {!isReferentialEmpty && (
                            <span className="text-text-muted min-w-0 flex-1 truncate pt-1.5 text-[0.75rem] leading-4 tabular-nums">
                                {sites.length} site{sites.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    {!isReferentialEmpty && searchField}
                </div>
            ) : (
                <div className="px-page bg-background large:max-w-[calc(63rem+2*var(--tk-space-page))] large:mx-auto sticky top-0 z-20 flex w-full flex-col gap-3 pt-5">
                    <div className="flex items-center gap-3">
                        <h1 className="font-brand text-on-surface text-ts-page leading-ts-page shrink-0 font-semibold tracking-[-0.02em]">
                            {GLOSSARY.LOCATIONS}
                        </h1>
                        {/* Le compte à côté du titre, comme toutes les listes (24/09) : la
                            ligne de service sous la recherche est retirée au bureau. */}
                        <span className="text-text-muted min-w-0 flex-1 truncate pt-1.5 text-[0.8125rem] leading-4 tabular-nums">
                            {!isReferentialEmpty &&
                                `${sites.length} site${sites.length > 1 ? 's' : ''} · ${locationData.countries.length} pays · ${localisedAssets} actif${localisedAssets > 1 ? 's' : ''}`}
                        </span>
                        <Button
                            variant="outlined"
                            icon={<Icon glyph={UploadSimple} size={20} />}
                            onClick={() => onViewChange?.('import_locations')}
                            className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium"
                        >
                            Importer
                        </Button>
                        <Button
                            variant="filled"
                            icon={<Icon glyph={Plus} size={20} />}
                            onClick={() => setIsAddSheetOpen(true)}
                            className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium"
                        >
                            Ajouter un emplacement
                        </Button>
                    </div>
                    {!isReferentialEmpty && <Reading>{searchField}</Reading>}
                </div>
            )}
            {/* `.page` — gouttière de 16, et 96 px de pied quand le FAB est là. */}
            <div
                className={cn(
                    /* **La mesure du bureau** — `.main.read` de 17.11, 1008 de contenu : un
                       corps qui est une colonne de rangées ne s'étire pas, sinon le nom d'une
                       rangée et son compte se retrouvent aux deux bouts de l'écran. */
                    'large:max-w-[calc(63rem+2*var(--tk-space-page))] large:mx-auto w-full',
                    'medium:px-page flex flex-1 flex-col px-4 pt-4 pb-6',
                    isCompact && 'pb-24',
                    CADRE_BUREAU,
                )}
            >
                {isReferentialEmpty ? (
                    /* **Le référentiel vide, dans sa carte et sans bouton** (25/09) : « Créer
                       le premier pays » doublait le geste d'ajout de la page, qui reste
                       flottant au téléphone et dans l'en-tête au bureau — sa feuille met le
                       pays en tête tant qu'il n'y en a aucun. */
                    <Reading
                        className={cn('bg-surface flex flex-1 flex-col rounded-xl', CADRE_BUREAU)}
                    >
                        <CardEmptyState
                            glyph={GlobeHemisphereWest}
                            title="Aucun emplacement"
                            description="Sans pays ni site, aucun actif ne peut être localisé. Commencez par un pays."
                        />
                    </Reading>
                ) : (
                    <Reading
                        className={cn(
                            'flex flex-col gap-4',
                            visibleSites.length > 0 ? CORPS_BUREAU : cn('flex-1', CADRE_BUREAU),
                        )}
                    >
                        {visibleSites.length > 0 && avecGlobe && paysAffiche ? (
                            <div className="grid grid-cols-12 items-start gap-4">
                                {/* **Le globe, sans carte autour** (24/09) : la sphère porte sa
                                    propre nuit et flotte sur la page ; « Vue d'ensemble » se pose
                                    sur elle quand un pays est choisi. */}
                                <div className="col-span-7 flex flex-col gap-3">
                                    <div className="relative">
                                        <GlobePointille
                                            className="mx-auto max-w-[34rem]"
                                            noeuds={statsParPays.flatMap((pays) =>
                                                pays.position
                                                    ? [
                                                          {
                                                              id: pays.country,
                                                              label: pays.country,
                                                              lat: pays.position[0],
                                                              lng: pays.position[1],
                                                              poids: pays.actifs,
                                                              detail: `${pays.actifs} actif${pays.actifs > 1 ? 's' : ''}`,
                                                          },
                                                      ]
                                                    : [],
                                            )}
                                            /* Rien de choisi : la vue d'ensemble ; un choix
                                               fait pivoter et approcher le globe. */
                                            selection={paysChoisi}
                                            onSelect={setPaysChoisi}
                                        />
                                        {paysChoisi && (
                                            <Button
                                                variant="text"
                                                size="sm"
                                                onClick={() => setPaysChoisi(null)}
                                                icon={
                                                    <Icon glyph={GlobeHemisphereWest} size={18} />
                                                }
                                                className="bg-surface text-on-surface hover:bg-surface-container absolute top-2 right-2 rounded-md px-2.5 shadow-[0_2px_8px_rgba(10,25,29,0.18)]"
                                            >
                                                Vue d’ensemble
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-text-muted px-1 text-center text-[0.75rem] leading-4">
                                        La taille d’un point suit le nombre d’actifs · faites
                                        tourner le globe, choisissez un pays.
                                        {statsParPays.some((pays) => !pays.position) &&
                                            ` Nom non reconnu, donc non placé : ${statsParPays
                                                .filter((pays) => !pays.position)
                                                .map((pays) => pays.country)
                                                .join(', ')}.`}
                                    </p>
                                </div>

                                <div className="col-span-5 flex flex-col gap-4">
                                    <section className="rounded-card bg-surface px-4 py-1">
                                        <div className="flex min-h-12 items-center justify-between pt-2 pb-1">
                                            <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                                                Les pays
                                            </h3>
                                            <span className="text-text-secondary text-ts-sub leading-ts-sub tabular-nums">
                                                {statsParPays.length}
                                            </span>
                                        </div>
                                        {statsParPays.map((pays) => (
                                            <FactRow
                                                key={pays.country}
                                                vignetteText={pays.code || undefined}
                                                glyph={pays.code ? undefined : GlobeHemisphereWest}
                                                tint={
                                                    pays.country === paysAffiche.country
                                                        ? 'ambre'
                                                        : undefined
                                                }
                                                title={pays.country}
                                                subtitle={`${pays.items.length} site${pays.items.length > 1 ? 's' : ''} · ${pays.personnes} personne${pays.personnes > 1 ? 's' : ''}`}
                                                figure={{
                                                    value: pays.actifs,
                                                    unit: pays.actifs > 1 ? 'actifs' : 'actif',
                                                }}
                                                onOpen={() => setPaysChoisi(pays.country)}
                                                className={cn(
                                                    pays.country === paysAffiche.country &&
                                                        'bg-surface-container',
                                                )}
                                            />
                                        ))}
                                    </section>

                                    <section className="rounded-card bg-surface px-4 py-1">
                                        <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                                            <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                                                {paysAffiche.country}
                                            </h3>
                                            <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                                {paysAffiche.items.length} site
                                                {paysAffiche.items.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {paysAffiche.items.map((site) => (
                                            <FactRow
                                                key={site.name}
                                                glyph={site.neverServed ? Hourglass : MapPin}
                                                tint={site.neverServed ? undefined : 'ambre'}
                                                muted={site.neverServed}
                                                title={site.name}
                                                subtitle={
                                                    site.neverServed
                                                        ? 'Jamais servi'
                                                        : `${site.userCount} personne${site.userCount > 1 ? 's' : ''}${site.locals.length > 0 ? ` · ${site.locals.length} ${site.locals.length > 1 ? 'locaux' : 'local'}` : ''}`
                                                }
                                                figure={
                                                    site.neverServed
                                                        ? undefined
                                                        : {
                                                              value: site.assetCount,
                                                              unit:
                                                                  site.assetCount > 1
                                                                      ? 'actifs'
                                                                      : 'actif',
                                                          }
                                                }
                                                onOpen={() => onSiteClick?.(site.name)}
                                            />
                                        ))}
                                    </section>
                                </div>
                            </div>
                        ) : visibleSites.length > 0 ? (
                            families.map(({ country, items, code, tint }) => (
                                /* `.fam` — l'en-tête coiffe la carte sans être dedans
                                   (§2.36), et n'en est séparé que de 8. */
                                <section key={country} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 px-1">
                                        {/* `.fh .si` — la pastille de code. Sans code relevé,
                                            le globe : *ce qui n'est pas relevé n'est pas
                                            inventé*, et trois lettres tirées du nom du pays
                                            en seraient une. */}
                                        <span
                                            className={cn(
                                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]',
                                                code
                                                    ? tint
                                                    : 'bg-surface-container text-on-surface-variant',
                                            )}
                                        >
                                            {code ? (
                                                <span className="font-brand text-[0.8125rem] font-semibold tracking-[0.02em]">
                                                    {code}
                                                </span>
                                            ) : (
                                                <Icon glyph={GlobeHemisphereWest} size={18} />
                                            )}
                                        </span>
                                        <span className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                                            {country}
                                        </span>
                                        <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                            {items.length} site{items.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {enGrille ? (
                                        /*
                                          **Au bureau, un site est une carte** (23/09). Les rangées
                                          de 64 couraient sur 1 008 px pour porter un nom et deux
                                          chiffres : le nom à gauche, le vide au milieu. Les sites
                                          se rangent par trois (deux en deçà de 1 200), chacun sa
                                          carte : le nom, puis ce qu'il porte et qui y est, en
                                          chiffres qu'on compare d'une carte à l'autre. Un site
                                          qui n'a jamais servi s'éteint et le dit en ambre.
                                        */
                                        <ul className="large:grid-cols-3 grid grid-cols-2 gap-3">
                                            {items.map((site) => (
                                                <li key={site.name}>
                                                    {/* **La carte d'un site, en deux étages** (24/09) :
                                                        le nom et le chevron, puis un filet et deux
                                                        cases égales — le mot au-dessus, le nombre en
                                                        22 dessous. Les deux chiffres se serraient à
                                                        gauche sous le nom, en 17, avec leur mot en
                                                        12 collé dessous : on lisait « 8 8 ». */}
                                                    <Button
                                                        variant="text"
                                                        onClick={() => onSiteClick?.(site.name)}
                                                        className="rounded-card bg-surface hover:bg-surface-container h-full w-full flex-col items-stretch justify-start gap-0 p-0 text-left font-normal whitespace-normal"
                                                    >
                                                        <span className="flex min-h-16 items-center gap-3 px-4 py-3">
                                                            <span
                                                                className={cn(
                                                                    'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center',
                                                                    site.neverServed
                                                                        ? 'bg-surface-container text-text-muted'
                                                                        : 'bg-tint-ambre text-on-tint-ambre',
                                                                )}
                                                            >
                                                                <Icon glyph={MapPin} size={20} />
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'text-ts-body leading-ts-body min-w-0 flex-1 truncate font-medium',
                                                                    site.neverServed
                                                                        ? 'text-text-secondary'
                                                                        : 'text-on-surface',
                                                                )}
                                                            >
                                                                {site.name}
                                                            </span>
                                                            <Icon
                                                                glyph={CaretRight}
                                                                size={20}
                                                                className="text-text-tertiary shrink-0"
                                                            />
                                                        </span>
                                                        {site.neverServed ? (
                                                            <span className="border-outline-variant text-ts-sub leading-ts-sub flex min-h-[4.25rem] items-center gap-2 border-t px-4 text-[var(--tk-color-on-tint-ambre)]">
                                                                <Icon
                                                                    glyph={Hourglass}
                                                                    size={18}
                                                                    className="shrink-0"
                                                                />
                                                                <b className="font-medium">
                                                                    Jamais servi
                                                                </b>
                                                                <span className="text-text-tertiary">
                                                                    · aucun actif, personne
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="border-outline-variant divide-outline-variant grid grid-cols-2 divide-x border-t">
                                                                {[
                                                                    {
                                                                        cle: 'actifs',
                                                                        n: site.assetCount,
                                                                        mot: 'Actifs',
                                                                    },
                                                                    {
                                                                        cle: 'personnes',
                                                                        n: site.userCount,
                                                                        mot: 'Personnes',
                                                                    },
                                                                ].map((chiffre) => (
                                                                    <span
                                                                        key={chiffre.cle}
                                                                        className="flex flex-col gap-1 px-4 py-3"
                                                                    >
                                                                        <span className="text-on-surface-variant text-[0.75rem] leading-4">
                                                                            {chiffre.mot}
                                                                        </span>
                                                                        <span
                                                                            className={cn(
                                                                                'font-brand text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em] tabular-nums',
                                                                                chiffre.n === 0
                                                                                    ? 'text-text-tertiary'
                                                                                    : 'text-on-surface',
                                                                            )}
                                                                        >
                                                                            {chiffre.n}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        )}
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        /* **La rangée à chiffre** (24/09) : les actifs à
                                           droite, en chiffre qu'on compare d'un site à
                                           l'autre ; les personnes et les locaux en fait
                                           dessous. « 8 actifs · 8 personnes » se lisait,
                                           ne se comparait pas. Un site jamais servi
                                           s'éteint et le dit en ambre. */
                                        <div className="rounded-card bg-surface px-4 py-1">
                                            {items.map((site) => (
                                                <FactRow
                                                    key={site.name}
                                                    glyph={site.neverServed ? Hourglass : MapPin}
                                                    tint={site.neverServed ? undefined : 'ambre'}
                                                    muted={site.neverServed}
                                                    title={site.name}
                                                    subtitle={
                                                        site.neverServed ? (
                                                            <b className="font-medium text-[var(--tk-color-on-tint-ambre)]">
                                                                Jamais servi
                                                            </b>
                                                        ) : (
                                                            [
                                                                `${site.userCount} personne${site.userCount > 1 ? 's' : ''}`,
                                                                site.locals.length > 0
                                                                    ? `${site.locals.length} ${site.locals.length > 1 ? 'locaux' : 'local'}`
                                                                    : null,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')
                                                        )
                                                    }
                                                    figure={
                                                        site.neverServed
                                                            ? undefined
                                                            : {
                                                                  value: site.assetCount,
                                                                  unit:
                                                                      site.assetCount > 1
                                                                          ? 'actifs'
                                                                          : 'actif',
                                                              }
                                                    }
                                                    onOpen={() => onSiteClick?.(site.name)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))
                        ) : (
                            <div className="bg-surface flex flex-1 flex-col rounded-xl">
                                {isFiltered ? (
                                    <CardEmptyState
                                        glyph={Funnel}
                                        title="Aucun site ne correspond"
                                        description="Élargissez la recherche, ou revenez à la totalité du référentiel."
                                        action={
                                            <Button
                                                variant="outlined"
                                                onClick={() => setSearchQuery('')}
                                            >
                                                Voir les {sites.length} sites
                                            </Button>
                                        }
                                    />
                                ) : (
                                    <CardEmptyState
                                        glyph={MapPin}
                                        title="Aucun site"
                                        description="Les pays sont créés : un site y porte une adresse, et ses locaux."
                                    />
                                )}
                            </div>
                        )}
                    </Reading>
                )}
            </div>
            {isCompact && (
                <FabContainer
                    description="Ajouter un emplacement"
                    /* `.fab` : 16 à droite, 80 en bas — la mesure de la planche, posée
                       par-dessus l'encoche et non à sa place. */
                    className="compact:bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+80px)]"
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
