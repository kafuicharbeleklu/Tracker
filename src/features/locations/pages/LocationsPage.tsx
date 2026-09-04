import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretRight,
    DoorOpen,
    FileCsv,
    GlobeHemisphereWest,
    MapPin,
    Plus,
    UploadSimple,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import { OfflineBanner } from '../../../components/ui/ContextBanner';
import { FabContainer } from '../../../components/ui/FabContainer';
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
const LocationsPage: React.FC<LocationsPageProps> = ({ onViewChange, onSiteClick }) => {
    const { locationData, equipment, users, addLocation } = useData();
    const { showToast } = useToast();
    const isCompact = useMediaQuery(MEDIA.compact);

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
        <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Site, local, pays"
        />
    );

    return (
        <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
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
                    ].map((option) => (
                        <Button
                            key={option.key}
                            variant="text"
                            className="flex min-h-16 w-full items-center justify-start gap-3 rounded-none px-5 py-2 text-left"
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
                                <span className="text-on-surface block truncate text-[16px] leading-6">
                                    {option.title}
                                </span>
                                <span className="text-text-secondary block truncate text-[14px] leading-5">
                                    {option.sub}
                                </span>
                            </span>
                            <Icon
                                glyph={CaretRight}
                                size={20}
                                className="text-text-muted shrink-0"
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

            {/* `.top` — **un seul bloc** : le titre à 28 px et la recherche sous lui,
                sur le même fond de surface, séparés de 12. La planche ne met plus de
                bande de filtres entre les deux. */}
            {isCompact ? (
                <div className="border-outline-variant bg-surface flex flex-col gap-3 border-b px-4 pt-2 pb-3">
                    <h1 className="font-brand text-on-surface min-w-0 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                        {GLOSSARY.LOCATIONS}
                    </h1>
                    {!isReferentialEmpty && searchField}
                </div>
            ) : (
                <div className="px-page flex flex-col gap-3 pt-5">
                    <div className="flex items-center gap-3">
                        <h1 className="font-brand text-on-surface min-w-0 flex-1 truncate text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {GLOSSARY.LOCATIONS}
                        </h1>
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
                    {!isReferentialEmpty && <Reading>{searchField}</Reading>}
                </div>
            )}

            <OfflineBanner />

            {/* `.page` — gouttière de 16, et 96 px de pied quand le FAB est là. */}
            <div
                className={cn(
                    'medium:px-page flex flex-1 flex-col px-4 pt-4 pb-6',
                    isCompact && !isReferentialEmpty && 'pb-24',
                )}
            >
                {isReferentialEmpty ? (
                    <ScreenState
                        icon={GlobeHemisphereWest}
                        title="Aucun emplacement"
                        description="Sans pays ni site, aucun actif ne peut être localisé."
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
                    <Reading className="flex flex-col gap-4">
                        {/* `.ord` — deux faits, un de chaque côté, à 12/16. C'est ce qui
                            reste du porte-voix et de la note de pied réunis. */}
                        <div className="text-text-secondary flex items-center justify-between gap-3 px-1 text-[12px] leading-4">
                            <span className="truncate tabular-nums">
                                {sites.length} site{sites.length > 1 ? 's' : ''} ·{' '}
                                {locationData.countries.length} pays
                            </span>
                            <span className="shrink-0 tabular-nums">
                                {localisedAssets} actif{localisedAssets > 1 ? 's' : ''}
                            </span>
                        </div>

                        {visibleSites.length > 0 ? (
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
                                                <span className="font-brand text-[13px] font-semibold tracking-[0.02em]">
                                                    {code}
                                                </span>
                                            ) : (
                                                <Icon glyph={GlobeHemisphereWest} size={18} />
                                            )}
                                        </span>
                                        <span className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                                            {country}
                                        </span>
                                        <span className="text-text-secondary shrink-0 text-[14px] leading-5 tabular-nums">
                                            {items.length} site{items.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="rounded-card bg-surface px-4 py-1">
                                        {items.map((site) => (
                                            <ListRow
                                                key={site.name}
                                                vignette={
                                                    /* `.lrow.mute` éteint aussi la vignette :
                                                       un site qui n'a jamais servi se lit
                                                       d'un coup d'œil, sans qu'on ait à
                                                       chercher le mot. */
                                                    <span
                                                        className={
                                                            site.neverServed
                                                                ? 'text-text-muted'
                                                                : undefined
                                                        }
                                                    >
                                                        <Icon glyph={MapPin} size={20} />
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
                                                /* Une seule sous-ligne, et elle porte tous les
                                                   chiffres du site : la planche a vidé la droite
                                                   de la rangée pour n'y laisser que le chevron.
                                                   Un site qui n'a jamais servi le dit là, en
                                                   ambre — pas par une pastille d'état, que la
                                                   planche ne dessine plus. */
                                                holder={
                                                    site.neverServed ? (
                                                        <b className="font-medium text-[var(--tk-color-on-tint-ambre)]">
                                                            Jamais servi
                                                        </b>
                                                    ) : (
                                                        [
                                                            `${site.assetCount} actif${site.assetCount > 1 ? 's' : ''}`,
                                                            `${site.userCount} personne${site.userCount > 1 ? 's' : ''}`,
                                                            site.locals.length > 0
                                                                ? `${site.locals.length} local${site.locals.length > 1 ? 'aux' : ''}`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')
                                                    )
                                                }
                                                onOpen={() => onSiteClick?.(site.name)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <ScreenState
                                icon={MapPin}
                                title="Aucun site ne correspond"
                                description="Élargissez la recherche, ou revenez à la totalité du référentiel."
                                actions={
                                    isFiltered ? (
                                        <Button variant="filled" onClick={() => setSearchQuery('')}>
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
