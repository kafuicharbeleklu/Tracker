import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    CaretRight,
    DoorOpen,
    Funnel,
    GlobeHemisphereWest,
    Info,
    MapPin,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import FacetChip from '../../../components/ui/FacetChip';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
import InfoTip from '../../../components/ui/InfoTip';
import { PiedDeCarte, ToutVoir, HAUTEUR_DU_PIED } from '../../../components/ui/ToutVoir';
import { cn } from '../../../lib/utils';
import {
    ALL_VALUE,
    buildRowKey,
    CountryAuditRow,
    enRetard,
    formatSince,
    PlaceAuditRow,
    STATUS_LABELS,
} from '../placeAudit';
import { useData } from '../../../context/DataContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { useEntree } from '../../../hooks/useEntree';
import { useDerniereValeur } from '../../../hooks/useDerniereValeur';
import { useCeQuiTient } from '../../../hooks/useCeQuiTient';
import RangeeDeLieu, { TEINTE_STATUT } from './RangeeDeLieu';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import { JAUGE, JAUGE_RANGEE } from '../../../lib/jauge';

/**
 * **Le périmètre ne se filtre plus que par l'état** (09/10). 16.1 disait *« Pays, puis le
 * statut »* : le pays est devenu le premier niveau de la liste — on le choisit, on ne le
 * filtre pas. Le service avait été retiré le 06/09 : il n'est pas un lieu.
 */
type FilterKey = 'status';

/** Ce que le panneau du bureau donne à mesurer : il n'en montre jamais autant. */
const LIEUX_AU_PANNEAU = 12;

interface ScopeOption {
    value: string;
    label: string;
    /** Ce qui reste après ce choix. Un filtre sans compte se choisit à l'aveugle (16.1). */
    count: number;
}

export interface AuditScopeFilters {
    status: string;
}

interface Totaux {
    expected: number;
    found: number;
    missing: number;
    exceptions: number;
    coverage: number;
    activeCampaigns: number;
    lastScanAt: string | null;
}

/**
 * **Le choix du lieu en cours** — un pays, puis un site, puis un local (09/10). La feuille
 * du téléphone et le panneau du bureau montrent la même chose : les sites du pays tant
 * qu'aucun n'est ouvert, puis les locaux du site.
 */
export interface ChoixDuLieu {
    pays: string;
    /** Le site ouvert dans le choix ; `null` : on en est aux sites du pays. */
    site: string | null;
    sites: PlaceAuditRow[];
    locaux: PlaceAuditRow[];
    /** Les chiffres de ce qu'on regarde : le pays, ou le site ouvert. */
    totaux: Totaux;
    /** Combien de locaux — ceux du site ouvert, sinon ceux de tous les sites du pays. */
    locauxComptes: number;
    /** Le pays a plusieurs sites : de ses locaux, on peut revenir à ses sites. */
    retourAuxSites: boolean;
}

interface AuditOverviewProps {
    /**
     * Ce que liste le premier niveau : les **pays**, ou les **sites** à plat quand le
     * référentiel n'a qu'un pays ou qu'une recherche est posée.
     */
    niveau: 'pays' | 'sites';
    countries: CountryAuditRow[];
    /** Les sites retenus par le statut et la recherche — la liste à plat, et les comptes. */
    sites: PlaceAuditRow[];
    choix: ChoixDuLieu | null;
    /** Les chiffres du parc — le héro du téléphone, la bande du bureau. */
    totals: Totaux;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: AuditScopeFilters;
    filterOptions: Record<FilterKey, ScopeOption[]>;
    onFilterChange: (key: FilterKey, value: string) => void;
    onResetFilters: () => void;
    onChooseCountry: (country: string) => void;
    onOpenPlace: (row: PlaceAuditRow) => void;
    /** Lancer le comptage du lieu porté par la rangée — le geste de `.rbtn`. */
    onStartPlace: (row: PlaceAuditRow) => void;
    /** Dans le choix, revenir des locaux d'un site aux sites du pays. */
    onBackToSites: () => void;
    /** Le panneau n'en montre qu'une part : ouvrir la page qui porte tous les lieux du choix. */
    onOpenAllPlaces: () => void;
    onCloseChoix: () => void;
    /** Les actifs qu'aucun site ne situe : ils ne peuvent pas être comptés. */
    unscopedAssets: number;
    /** Le total des sites avant recherche et statut — pour dire « 3 des 12 ». */
    totalSiteCount: number;
    /** `.tb` du `.top` — quitter l'inventaire. */
    onLeave?: () => void;
}

const FILTER_LABELS: Record<FilterKey, string> = {
    status: 'Statut',
};

/**
 * `.hk` — une tuile du héro : le fait en Archivo 22, ce qu'il mesure en 12 dessous.
 * Le voile est le même blanc à 8 % que sur 09 et 10 ; il n'est pas une surface, il
 * n'a donc ni filet ni ombre.
 */
const HeroTile: React.FC<{ value: React.ReactNode; label: string; tone?: 'ecart' }> = ({
    value,
    label,
    tone,
}) => (
    <div className="min-w-0 flex-1 rounded-[4px] bg-white/[0.08] px-2.5 py-3">
        <span
            className={cn(
                'font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] tabular-nums',
                tone === 'ecart' && 'text-[var(--tk-color-live-ambre)]',
            )}
        >
            {value}
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] leading-4 text-[var(--tk-color-on-dark-2)]">
            {label}
        </span>
    </div>
);

/**
 * `.rbtn` — **le geste de rangée, et il n'est jamais peint.** La planche déclare un
 * seul geste de rangée : le creux de la page pour fond, encre normale, 40 de haut,
 * 15 en graisse d'appui. Le jaune n'entre pas dans une liste : il désignerait autant
 * de gestes primaires qu'il y a de lieux à compter.
 */
const ROW_ACTION_CLASS =
    'bg-surface-container text-on-surface hover:bg-surface-container-high h-10 min-h-10 doigt:h-12 doigt:min-h-12 shrink-0 rounded-sm px-3.5 text-ts-control font-medium';

export const AuditOverview: React.FC<AuditOverviewProps> = ({
    niveau,
    countries,
    sites,
    choix,
    totals,
    searchQuery,
    onSearchChange,
    filters,
    filterOptions,
    onFilterChange,
    onResetFilters,
    onChooseCountry,
    onOpenPlace,
    onStartPlace,
    onBackToSites,
    onOpenAllPlaces,
    onCloseChoix,
    unscopedAssets,
    totalSiteCount,
    onLeave,
}) => {
    /* Les tuiles de la campagne entrent en cascade à l'arrivée (26/09). */
    const entree = useEntree();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { settings } = useData();
    /**
     * **Les deux niveaux côte à côte, à partir de 1280** — 16.1, colonne bureau : *« le
     * téléphone empile trois niveaux, un par écran ; le bureau en pose deux côte à
     * côte »*. Le troisième, le comptage (16.2), reste un écran.
     */
    const enDeuxNiveaux = useMediaQuery(MEDIA.twoColumn);

    /** Combien de lieux ont dépassé la périodicité réglée dans Paramètres (14.1). */
    const retards = useMemo(
        () => sites.filter((row) => enRetard(row, settings.inventoryPeriodMonths)).length,
        [settings.inventoryPeriodMonths, sites],
    );
    /** Les locaux de tous les sites retenus — la tuile du héro avant le premier scan. */
    const locauxDuParc = useMemo(
        () => sites.reduce((somme, row) => somme + (row.localCount ?? 0), 0),
        [sites],
    );
    /* La feuille garde ce qu'elle montrait le temps de redescendre. */
    const choixMontre = useDerniereValeur(choix);
    /**
     * **Le panneau montre ce qui tient, et renvoie au reste** (09/10) : sa carte recevait
     * sa hauteur de la fenêtre et défilait dedans — 101 px pour six locaux sur un portable
     * de 1366 × 657. Elle montre des rangées entières et un pied, « Tous les locaux 6 › ».
     */
    const lieuxDuChoix = choixMontre
        ? choixMontre.site
            ? choixMontre.locaux.length
            : choixMontre.sites.length
        : 0;
    const partDuChoix = useCeQuiTient(lieuxDuChoix, HAUTEUR_DU_PIED);

    const activeFilterCount = useMemo(
        () =>
            (Object.keys(FILTER_LABELS) as FilterKey[]).filter((key) => filters[key] !== ALL_VALUE)
                .length,
        [filters],
    );

    /**
     * **Les trois moments de l'écran** (16.1, colonnes 1 et 2). Avant le premier scan,
     * un seul nombre : les attendus. En campagne, c'est l'**écart** qui passe en gros.
     * Et quand la campagne est propre, le héro dit ce qui a été retrouvé.
     */
    const isCampaignActive =
        totals.found > 0 ||
        totals.missing > 0 ||
        totals.exceptions > 0 ||
        totals.activeCampaigns > 0;
    const hasPendingDecisions = totals.missing > 0 || totals.exceptions > 0;
    const isCampaignClean = isCampaignActive && !hasPendingDecisions;

    const statusLabel = filterOptions.status.find(
        (option) => option.value === filters.status,
    )?.label;

    /**
     * Ce qui est **posé** sur la liste, en toutes lettres — le pays, le statut, la
     * recherche. Le vide s'en sert pour dire *pourquoi* il est vide plutôt que de
     * constater qu'il l'est.
     */
    const activeConstraints = useMemo(() => {
        const constraints: string[] = [];
        if (filters.status !== ALL_VALUE && statusLabel)
            constraints.push(`le statut « ${statusLabel.toLowerCase()} »`);
        if (searchQuery.trim()) constraints.push(`« ${searchQuery.trim()} »`);
        return constraints;
    }, [filters, statusLabel, searchQuery]);

    const emptyCause =
        activeConstraints.length === 0
            ? "Aucun actif n'est situé : un objet sans emplacement ne peut pas être compté sur place."
            : `${activeConstraints.join(' et ')} se contredisent. Élargissez le statut ou effacez la recherche.`;

    /** Le surtitre du héro : la portée. Le héro compte le parc, quel que soit le choix. */
    const heroKicker = 'Tout le parc';

    const hero = (
        <section className="bg-inverse-surface text-inverse-on-surface rounded-lg px-5 pt-[22px] pb-5">
            <span className="block text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                {heroKicker}
            </span>

            {/* `.big` — **un seul nombre**, et c'est l'écart dès qu'il en existe un.
                Avant le premier scan, il n'y a rien à comparer : ce sont les attendus. */}
            <div className="mt-2 flex items-baseline gap-2.5">
                <b className="font-brand text-[2.5rem] leading-[3rem] font-semibold tracking-[-0.03em] tabular-nums">
                    <ChiffreAnime
                        valeur={
                            hasPendingDecisions
                                ? totals.missing
                                : isCampaignClean
                                  ? totals.found
                                  : totals.expected
                        }
                    />
                </b>
                <span className="text-ts-sub leading-ts-sub text-[var(--tk-color-on-dark-2)]">
                    {hasPendingDecisions
                        ? `manquant${totals.missing > 1 ? 's' : ''}`
                        : isCampaignClean
                          ? `retrouvés sur ${totals.expected}`
                          : `actif${totals.expected > 1 ? 's' : ''} attendu${totals.expected > 1 ? 's' : ''}`}
                </span>
            </div>

            <div className="mt-5 flex gap-3">
                {isCampaignActive ? (
                    <>
                        <HeroTile value={totals.expected} label="attendus" />
                        <HeroTile value={totals.found} label="trouvés" />
                        <HeroTile
                            value={totals.exceptions}
                            label="écart"
                            tone={totals.exceptions > 0 ? 'ecart' : undefined}
                        />
                    </>
                ) : (
                    <>
                        <HeroTile
                            value={sites.length}
                            label={`site${sites.length > 1 ? 's' : ''} · ${locauxDuParc} ${locauxDuParc > 1 ? 'locaux' : 'local'}`}
                        />
                        <HeroTile value="—" label="jamais vérifié" />
                    </>
                )}
            </div>

            {/* `.prog` et `.pk` — la jauge et sa ligne de lecture n'existent qu'en
                campagne : une barre à zéro devant un parc jamais compté ne mesure rien. */}
            {isCampaignActive && (
                <>
                    <div className={cn('mt-5 flex overflow-hidden bg-white/[0.12]', JAUGE)}>
                        <i
                            className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-live-vert)] transition-[width]"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-[0.75rem] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
                        {isCampaignClean ? (
                            <span className="text-[var(--tk-color-live-vert)]">
                                <b className="font-medium">Aucun écart</b>
                            </span>
                        ) : (
                            <span>
                                {/* Un seul objet retrouvé sur 243 fait 0 % à l'arrondi :
                                    « 0 % comptés » à côté d'un « 1 trouvé » se lit comme
                                    une panne. En dessous du pour cent, on le dit. */}
                                <b className="text-inverse-on-surface font-medium">
                                    {totals.found > 0 && totals.coverage === 0
                                        ? '< 1 %'
                                        : `${totals.coverage} %`}
                                </b>{' '}
                                comptés
                            </span>
                        )}
                        <span>{formatSince(totals.lastScanAt)}</span>
                    </div>
                </>
            )}
        </section>
    );

    /**
     * `.fnote` — ce que la rangée suivante fera. Elle n'est pas un état vide : elle
     * explique le geste, et elle change avec le niveau où l'on se trouve.
     */
    const note = (
        <div className="text-on-surface-variant text-ts-sub leading-ts-sub flex items-start gap-2 px-1">
            <Icon glyph={Info} size={18} className="text-text-muted mt-px shrink-0" />
            <span>
                {niveau === 'pays'
                    ? 'Choisissez le pays, puis le site et le local à compter.'
                    : 'Un site s’ouvre sur ses locaux ; sans local, il se compte d’ici.'}
                {unscopedAssets > 0 && (
                    <>
                        {' '}
                        <b className="text-on-surface font-medium">
                            {unscopedAssets} actif{unscopedAssets > 1 ? 's' : ''} n'
                            {unscopedAssets > 1 ? 'entrent' : 'entre'} dans aucune campagne
                        </b>{' '}
                        — aucun site ne les situe.
                    </>
                )}
            </span>
        </div>
    );

    /* Les cinq colonnes du tableau des sites — la même grille pour l'en-tête et les
       rangées, sinon elles cessent de s'aligner à la première troncature. */
    const GRILLE_SITE = 'grid grid-cols-[40px_minmax(0,1fr)_96px_140px_84px] items-center gap-3';

    /**
     * **Une rangée de site au bureau** — cinq colonnes : le lieu, ce qu'on y attend,
     * l'état, le geste. *« Cliquer une rangée ne navigue pas : elle se sélectionne et le
     * panneau change »*, et le chevron disparaît — la sélection le remplace.
     */
    const rangeeDeSite = (row: PlaceAuditRow) => {
        const ouvreUnNiveau = !row.local && !row.horsLocal && (row.localCount ?? 0) > 0;
        const seLance = !ouvreUnNiveau && row.status === 'A lancer';
        const muet = row.expected === 0;
        const choisi = choix?.site === row.site && choix?.pays === row.country && ouvreUnNiveau;
        const commence = row.status !== 'A lancer' && !muet;

        return (
            <div
                key={buildRowKey(row)}
                role="button"
                tabIndex={0}
                aria-current={choisi ? 'true' : undefined}
                onClick={() => onOpenPlace(row)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenPlace(row);
                    }
                }}
                className={cn(
                    GRILLE_SITE,
                    '-mx-2 min-h-16 cursor-pointer rounded-md px-2 py-2 text-left transition-colors',
                    choisi ? 'bg-surface-muted-strong' : 'hover:bg-surface-container',
                )}
            >
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                        muet
                            ? 'bg-surface-container text-text-tertiary'
                            : row.status === 'Complet'
                              ? 'bg-tint-vert text-on-tint-vert'
                              : row.status === 'En cours'
                                ? 'bg-tint-bleu text-on-tint-bleu'
                                : 'bg-tint-ambre text-on-tint-ambre',
                    )}
                >
                    <Icon glyph={row.local ? DoorOpen : MapPin} size={20} />
                </div>

                <div className="min-w-0">
                    <span
                        className={cn(
                            'text-ts-body leading-ts-body block truncate',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.site}
                    </span>
                    <span className="text-on-surface-variant block truncate text-[0.8125rem] leading-5">
                        {row.country}
                        {(row.localCount ?? 0) > 0
                            ? ` · ${row.localCount} ${row.localCount === 1 ? 'local' : 'locaux'}`
                            : ' · sans local'}
                    </span>
                </div>

                {/* Un nombre s'aligne à droite : c'est ce qui permet de comparer deux
                    colonnes d'un coup d'œil (17.11, tableau). */}
                <span
                    className={cn(
                        'text-ts-sub leading-ts-sub text-right tabular-nums',
                        muet ? 'text-on-surface-variant' : 'text-on-surface',
                    )}
                >
                    {row.expected}
                    {commence && (
                        <small className="text-on-surface-variant block text-[0.75rem] leading-4">
                            {row.found} trouvé{row.found > 1 ? 's' : ''}
                        </small>
                    )}
                </span>

                <span
                    className={cn(
                        'text-ts-sub leading-ts-sub inline-flex items-center gap-1.5 whitespace-nowrap',
                        muet ? 'text-text-tertiary' : 'text-on-surface-variant',
                    )}
                >
                    {!muet && (
                        <i
                            aria-hidden="true"
                            className={cn('h-2 w-2 shrink-0 rounded-xs', TEINTE_STATUT[row.status])}
                        />
                    )}
                    {row.status === 'En cours'
                        ? `En cours · ${row.progress} %`
                        : row.status === 'A lancer'
                          ? 'Jamais vérifié'
                          : STATUS_LABELS[row.status]}
                </span>

                <span className="flex justify-end">
                    {seLance && (
                        <Button
                            variant="text"
                            onClick={(event) => {
                                event.stopPropagation();
                                onStartPlace(row);
                            }}
                            className={cn(ROW_ACTION_CLASS, 'text-ts-sub h-9 min-h-9 px-3')}
                        >
                            Lancer
                        </Button>
                    )}
                </span>
            </div>
        );
    };

    /** **Une rangée de lieu** — la même au téléphone, dans le panneau et sur sa page. */
    const rangeeDeLieu = (row: PlaceAuditRow, index: number, niveau: 'site' | 'local') => (
        <RangeeDeLieu
            key={buildRowKey(row)}
            row={row}
            index={index}
            niveau={niveau}
            onOuvrir={onOpenPlace}
            onLancer={onStartPlace}
        />
    );

    /** La teinte de la vignette d'un lieu ou d'un pays, selon son état. */
    const teinteDeVignette = (status: PlaceAuditRow['status'], muet: boolean) =>
        muet
            ? 'bg-surface-container text-text-tertiary'
            : status === 'Complet' || status === 'Validee'
              ? 'bg-tint-vert text-on-tint-vert'
              : status === 'En cours'
                ? 'bg-tint-bleu text-on-tint-bleu'
                : 'bg-tint-ambre text-on-tint-ambre';

    /** « 2 sites · 9 locaux » — ce que le pays ouvre. */
    const contenuDuPays = (row: CountryAuditRow) =>
        `${row.siteCount} site${row.siteCount > 1 ? 's' : ''} · ${row.localCount} ${row.localCount === 1 ? 'local' : 'locaux'}`;

    /** L'état d'un pays, en mots — celui de ses sites réunis. */
    const etatDuPays = (row: CountryAuditRow, bureau: boolean) =>
        row.expected === 0
            ? 'rien à inventorier'
            : row.status === 'En cours'
              ? bureau
                  ? `En cours · ${row.progress} %`
                  : `en cours · ${row.found}/${row.expected}`
              : row.status === 'A lancer'
                ? bureau
                    ? 'Jamais vérifié'
                    : 'jamais vérifié'
                : bureau
                  ? STATUS_LABELS[row.status]
                  : STATUS_LABELS[row.status].toLowerCase();

    /**
     * **Une rangée de pays au téléphone** (09/10) — le premier niveau. Même forme que la
     * rangée d'un lieu : la vignette à la teinte de l'état, ce que le pays ouvre, où il en
     * est, et ce qu'on y attend.
     */
    const rangeeDePays = (row: CountryAuditRow, index: number) => {
        const muet = row.expected === 0;
        return (
            <div
                key={row.country}
                role="button"
                tabIndex={0}
                data-rangee
                onClick={() => onChooseCountry(row.country)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onChooseCountry(row.country);
                    }
                }}
                className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                    index > 0 && 'border-outline-variant border-t',
                )}
            >
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                        teinteDeVignette(row.status, muet),
                    )}
                >
                    <Icon glyph={GlobeHemisphereWest} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <span
                        className={cn(
                            'text-ts-body leading-ts-body block truncate',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.country}
                    </span>
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub flex min-w-0 items-center gap-1.5">
                        <span className="shrink-0">
                            {row.siteCount} site{row.siteCount > 1 ? 's' : ''} ·
                        </span>
                        {!muet && (
                            <i
                                aria-hidden="true"
                                className={cn(
                                    'h-2 w-2 shrink-0 rounded-xs',
                                    TEINTE_STATUT[row.status] || 'bg-outline',
                                )}
                            />
                        )}
                        <span className="truncate">{etatDuPays(row, false)}</span>
                    </span>
                    {row.status === 'En cours' && (
                        <span
                            className={cn(
                                'bg-outline-variant mt-1.5 flex max-w-[200px] overflow-hidden',
                                JAUGE_RANGEE,
                            )}
                        >
                            <i
                                className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-live-vert)] transition-[width]"
                                style={{ width: `${row.progress}%` }}
                            />
                        </span>
                    )}
                </div>
                {!muet && (
                    <span className="flex shrink-0 flex-col items-end">
                        <span className="font-brand text-on-surface text-ts-head leading-ts-head font-semibold tabular-nums">
                            {row.expected}
                        </span>
                        <span className="text-text-muted text-[0.75rem] leading-4">attendus</span>
                    </span>
                )}
                <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
            </div>
        );
    };

    /**
     * **Une rangée de pays au bureau** — la grille des sites, un niveau plus haut. La
     * rangée se sélectionne, et le panneau montre ses sites.
     */
    const rangeeDePaysAuBureau = (row: CountryAuditRow) => {
        const muet = row.expected === 0;
        const choisi = choix?.pays === row.country;
        return (
            <div
                key={row.country}
                role="button"
                tabIndex={0}
                data-rangee
                aria-current={choisi ? 'true' : undefined}
                onClick={() => onChooseCountry(row.country)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onChooseCountry(row.country);
                    }
                }}
                className={cn(
                    GRILLE_SITE,
                    '-mx-2 min-h-16 cursor-pointer rounded-md px-2 py-2 text-left transition-colors',
                    choisi ? 'bg-surface-muted-strong' : 'hover:bg-surface-container',
                )}
            >
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                        teinteDeVignette(row.status, muet),
                    )}
                >
                    <Icon glyph={GlobeHemisphereWest} size={20} />
                </div>
                <div className="min-w-0">
                    <span
                        className={cn(
                            'text-ts-body leading-ts-body block truncate',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.country}
                    </span>
                    <span className="text-on-surface-variant block truncate text-[0.8125rem] leading-5">
                        {contenuDuPays(row)}
                    </span>
                </div>
                <span
                    className={cn(
                        'text-ts-sub leading-ts-sub text-right tabular-nums',
                        muet ? 'text-on-surface-variant' : 'text-on-surface',
                    )}
                >
                    {row.expected}
                    {row.found > 0 && (
                        <small className="text-on-surface-variant block text-[0.75rem] leading-4">
                            {row.found} trouvé{row.found > 1 ? 's' : ''}
                        </small>
                    )}
                </span>
                <span
                    className={cn(
                        'text-ts-sub leading-ts-sub inline-flex items-center gap-1.5 whitespace-nowrap',
                        muet ? 'text-text-tertiary' : 'text-on-surface-variant',
                    )}
                >
                    {!muet && (
                        <i
                            aria-hidden="true"
                            className={cn('h-2 w-2 shrink-0 rounded-xs', TEINTE_STATUT[row.status])}
                        />
                    )}
                    {etatDuPays(row, true)}
                </span>
                <span />
            </div>
        );
    };

    /**
     * **Où en est l'inventaire du parc** — le diagramme de la grille du bureau (23/09).
     *
     * Une barre empilée plutôt qu'un camembert : quatre parts d'un seul tout se comparent
     * mieux alignées sur une ligne, et la barre tient dans la hauteur d'une tuile. Elle
     * compte des **actifs**, pas des sites — un site de 243 actifs jamais vérifié pèse plus
     * qu'un local de deux qu'on vient de recompter. Les sites sans actif n'y entrent pas.
     */
    const couverture = useMemo(() => {
        const parts = {
            ajour: { actifs: 0, sites: 0 },
            encours: { actifs: 0, sites: 0 },
            retard: { actifs: 0, sites: 0 },
            jamais: { actifs: 0, sites: 0 },
        };
        sites.forEach((row) => {
            if (row.expected === 0) return;
            const cle =
                row.status === 'En cours'
                    ? 'encours'
                    : !row.lastScanAt
                      ? 'jamais'
                      : enRetard(row, settings.inventoryPeriodMonths)
                        ? 'retard'
                        : 'ajour';
            parts[cle].actifs += row.expected;
            parts[cle].sites += 1;
        });
        const total = Object.values(parts).reduce((somme, part) => somme + part.actifs, 0);
        return { parts, total };
    }, [sites, settings.inventoryPeriodMonths]);

    const PARTS_COUVERTURE = [
        { cle: 'ajour', libelle: 'à jour', teinte: 'bg-[var(--tk-color-st-vert)]' },
        { cle: 'encours', libelle: 'en cours', teinte: 'bg-[var(--tk-color-st-bleu)]' },
        { cle: 'retard', libelle: 'en retard', teinte: 'bg-[var(--tk-color-st-orange)]' },
        { cle: 'jamais', libelle: 'jamais vérifiés', teinte: 'bg-[var(--tk-color-st-ambre)]' },
    ] as const;

    const partAJour =
        couverture.total > 0
            ? Math.round((couverture.parts.ajour.actifs / couverture.total) * 100)
            : 0;

    /**
     * **La bande éclatée en grille** (23/09, à la demande : « éclater aussi Inventaire pour
     * avoir une grille »). La bande de 16.1 tenait cinq chiffres sur une seule surface ;
     * ils deviennent une tuile chacun, sur la grille de 12 : le diagramme de couverture
     * prend la moitié — c'est la seule réponse à « où en est-on » —, les trois comptes se
     * partagent l'autre. Même gabarit que les tuiles de Finances : 12 pour ce qu'on lit,
     * 28 pour le chiffre, 14 pour ce qu'il veut dire.
     */
    const tuile = (titre: string, valeur: React.ReactNode, sens: React.ReactNode, cle: string) => (
        <section key={cle} className="bg-surface col-span-2 flex flex-col rounded-lg p-4">
            <h3 className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                {titre}
            </h3>
            <span className="font-brand text-on-surface text-ts-page leading-ts-page mt-3 font-semibold tracking-[-0.02em] tabular-nums">
                {valeur}
            </span>
            <span className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">{sens}</span>
        </section>
    );

    const bande = (
        <div
            className={cn('grid grid-cols-12 items-stretch gap-4', entree && 'mvt-cascade-cartes')}
        >
            {/* **Le même gabarit que les autres tuiles** (23/09) : ce qu'on lit en 12, le
                chiffre en 28, ce qu'il veut dire en 14, puis le ruban de **8** à 16 de sa
                phrase — celui des jauges de l'accueil et de Finances. Le diagramme tenait
                un en-tête à deux bouts et un ruban de 12 : il ne ressemblait à rien d'autre. */}
            <section className="bg-surface col-span-6 flex flex-col rounded-lg p-4">
                <h3 className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                    Couverture de l'inventaire
                </h3>
                <span className="font-brand text-on-surface text-ts-page leading-ts-page mt-3 font-semibold tracking-[-0.02em] tabular-nums">
                    {partAJour} %
                </span>
                <span className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                    du parc vérifié dans la périodicité · {couverture.total} actif
                    {couverture.total > 1 ? 's' : ''} situé{couverture.total > 1 ? 's' : ''}
                </span>
                <div
                    role="img"
                    aria-label={PARTS_COUVERTURE.map(
                        (part) =>
                            `${part.libelle} : ${couverture.parts[part.cle].actifs} actifs, ${couverture.parts[part.cle].sites} sites`,
                    ).join(' ; ')}
                    className={cn('bg-surface-container mt-4 flex gap-px overflow-hidden', JAUGE)}
                >
                    {couverture.total > 0 &&
                        PARTS_COUVERTURE.map((part) =>
                            couverture.parts[part.cle].actifs > 0 ? (
                                <i
                                    key={part.cle}
                                    className={cn(
                                        'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                        'block h-full',
                                        part.teinte,
                                    )}
                                    style={{
                                        width: `${(couverture.parts[part.cle].actifs / couverture.total) * 100}%`,
                                    }}
                                />
                            ) : null,
                        )}
                </div>
                {/* La légende de l'histogramme de Finances : la pastille, le mot, le compte.
                    Le nombre de sites est dit par le ruban au lecteur d'écran ; une part vide s'estompe. */}
                <ul className="text-on-surface-variant mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] leading-4 tabular-nums">
                    {PARTS_COUVERTURE.map((part) => {
                        const { actifs } = couverture.parts[part.cle];
                        return (
                            <li
                                key={part.cle}
                                className={cn(
                                    'flex items-center gap-1.5',
                                    actifs === 0 && 'text-text-tertiary',
                                )}
                            >
                                <i
                                    aria-hidden="true"
                                    className={cn(
                                        'h-2 w-2 rounded-[2px]',
                                        actifs === 0 ? 'bg-surface-container' : part.teinte,
                                    )}
                                />
                                {part.libelle} · {actifs}
                            </li>
                        );
                    })}
                </ul>
            </section>
            {tuile('Actifs attendus', totals.expected, 'tout le parc', 'attendus')}
            {tuile(
                'Sites',
                sites.length,
                `${locauxDuParc} ${locauxDuParc > 1 ? 'locaux' : 'local'} · ${couverture.parts.jamais.sites} jamais vérifié${couverture.parts.jamais.sites > 1 ? 's' : ''}`,
                'sites',
            )}
            {tuile(
                'Campagnes en cours',
                totals.activeCampaigns,
                <span className={cn(totals.exceptions > 0 && 'text-[var(--tk-color-st-orange)]')}>
                    {totals.exceptions} écart{totals.exceptions > 1 ? 's' : ''} relevé
                    {totals.exceptions > 1 ? 's' : ''}
                </span>,
                'campagnes',
            )}
        </div>
    );

    /* ── Le choix du lieu : les sites du pays, puis les locaux du site ───────────── */

    /** Revenir des locaux d'un site aux sites de son pays — quand il en a plusieurs. */
    const retourAuxSites = () =>
        choixMontre?.site && choixMontre.retourAuxSites ? (
            <Button
                variant="text"
                onClick={onBackToSites}
                icon={<Icon glyph={ArrowLeft} size={18} />}
                className="text-on-surface-variant hover:text-on-surface text-ts-sub doigt:h-12 doigt:min-h-12 -ml-2 h-10 min-h-10 justify-start gap-1.5 self-start px-2 font-medium"
            >
                Les sites — {choixMontre.pays}
            </Button>
        ) : null;

    /** Les rangées du choix : les locaux du site ouvert, sinon les sites du pays. */
    const rangeesDuChoix = choixMontre
        ? choixMontre.site
            ? choixMontre.locaux.map((row, index) => rangeeDeLieu(row, index, 'local'))
            : choixMontre.sites.map((row, index) => rangeeDeLieu(row, index, 'site'))
        : [];

    /** Les trois chiffres de ce que le panneau regarde : le pays, ou le site ouvert. */
    const totauxDuChoix = choix?.totaux;
    const choixEnCampagne = Boolean(
        totauxDuChoix &&
        (totauxDuChoix.found > 0 ||
            totauxDuChoix.missing > 0 ||
            totauxDuChoix.exceptions > 0 ||
            totauxDuChoix.activeCampaigns > 0),
    );
    const chiffresDuChoix: Array<{
        cle: string;
        valeur: React.ReactNode;
        libelle: string;
        ecart?: boolean;
    }> =
        !choix || !totauxDuChoix
            ? [
                  { cle: 'attendus', valeur: '—', libelle: 'attendus' },
                  { cle: 'trouves', valeur: '—', libelle: 'trouvés' },
                  { cle: 'ecarts', valeur: '—', libelle: 'écarts' },
              ]
            : choixEnCampagne
              ? [
                    { cle: 'attendus', valeur: totauxDuChoix.expected, libelle: 'attendus' },
                    { cle: 'trouves', valeur: totauxDuChoix.found, libelle: 'trouvés' },
                    {
                        cle: 'ecarts',
                        valeur: totauxDuChoix.exceptions,
                        libelle: `écart${totauxDuChoix.exceptions > 1 ? 's' : ''}`,
                        ecart: totauxDuChoix.exceptions > 0,
                    },
                ]
              : [
                    {
                        cle: 'attendus',
                        valeur: totauxDuChoix.expected,
                        libelle: `actif${totauxDuChoix.expected > 1 ? 's' : ''} attendu${totauxDuChoix.expected > 1 ? 's' : ''}`,
                    },
                    {
                        cle: 'locaux',
                        valeur: choix.locauxComptes,
                        libelle: `${choix.locauxComptes > 1 ? 'locaux' : 'local'} à compter`,
                    },
                    {
                        cle: 'verifie',
                        valeur: totauxDuChoix.lastScanAt
                            ? formatSince(totauxDuChoix.lastScanAt)
                            : '—',
                        libelle: totauxDuChoix.lastScanAt ? 'dernier comptage' : 'jamais vérifié',
                    },
                ];

    /**
     * **Le panneau du bureau est la feuille du téléphone** (09/10) : à droite, le pays
     * choisi et ses sites ; un site choisi, et le panneau passe à ses locaux. *« On choisit
     * le site, la feuille s'actualise vers les locaux »* — au bureau, rien ne recouvre la
     * liste : c'est la convention des Tâches, panneau au bureau, feuille au téléphone.
     *
     * **Deux cartes, toujours là** (23/09) : celle de ce qu'on regarde en tête, celle de ses
     * lieux dessous. Elles existent avant tout choix — à vide, chacune dit ce qu'elle
     * montrera —, si bien que choisir remplit deux cadres au lieu de faire apparaître un
     * panneau : rien ne bouge sous le curseur.
     */
    const panneau = (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <section className="bg-surface shrink-0 rounded-xl px-4 pt-4 pb-4">
                <span className="text-on-surface-variant block text-[0.75rem] leading-4">
                    {choix?.site ? `${choix.pays} · site` : niveau === 'pays' ? 'Pays' : 'Site'}
                </span>
                <h2
                    className={cn(
                        'font-brand text-ts-sheet leading-ts-sheet mt-1 truncate font-semibold tracking-[-0.015em]',
                        choix ? 'text-on-surface' : 'text-text-tertiary',
                    )}
                >
                    {choix
                        ? (choix.site ?? choix.pays)
                        : niveau === 'pays'
                          ? 'Aucun pays choisi'
                          : 'Aucun site choisi'}
                </h2>
                {/* À vide, les trois cases gardent leur place avec un tiret : la carte a
                    déjà sa hauteur, et le choix ne la fera pas grandir. */}
                <dl className="mt-4 grid grid-cols-3 gap-3">
                    {chiffresDuChoix.map((chiffre) => (
                        <div key={chiffre.cle} className="min-w-0">
                            <dt className="sr-only">{chiffre.libelle}</dt>
                            <dd
                                className={cn(
                                    'font-brand text-ts-head leading-ts-head truncate font-semibold tabular-nums',
                                    !choix
                                        ? 'text-text-tertiary'
                                        : chiffre.ecart
                                          ? 'text-[var(--tk-color-st-orange)]'
                                          : 'text-on-surface',
                                )}
                            >
                                {chiffre.valeur}
                            </dd>
                            <dd
                                aria-hidden="true"
                                className="text-on-surface-variant mt-0.5 truncate text-[0.75rem] leading-4"
                            >
                                {chiffre.libelle}
                            </dd>
                        </div>
                    ))}
                </dl>
                {choix && totauxDuChoix && choixEnCampagne && (
                    /* En campagne, le ruban de 8 des autres jauges, à 16 des chiffres. */
                    <div className={cn('bg-surface-container mt-4 overflow-hidden', JAUGE)}>
                        <i
                            className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-st-vert)] transition-[width]"
                            style={{ width: `${totauxDuChoix.coverage}%` }}
                        />
                    </div>
                )}
            </section>

            <section className="bg-surface flex min-h-0 flex-1 flex-col rounded-xl">
                <header className="flex min-h-10 shrink-0 items-center gap-1 px-4 pt-2">
                    {/* Le retour aux sites du pays tient dans l'en-tête de la carte (09/10) :
                        sur sa propre ligne, il prenait la place d'une rangée de local. */}
                    {choix?.site && choix.retourAuxSites && (
                        <Button
                            variant="text"
                            onClick={onBackToSites}
                            aria-label={`Les sites — ${choix.pays}`}
                            icon={<Icon glyph={ArrowLeft} size={18} />}
                            className="text-on-surface-variant hover:text-on-surface doigt:h-10 doigt:min-h-10 -ml-2 h-8 min-h-8 shrink-0 gap-1 px-2 text-[0.75rem] leading-4 font-medium"
                        >
                            {choix.pays}
                        </Button>
                    )}
                    <h3 className="text-on-surface-variant min-w-0 flex-1 text-[0.75rem] leading-4 font-medium">
                        {choix?.site
                            ? `Locaux · ${choix.locauxComptes}`
                            : choix
                              ? `Sites · ${choix.sites.length}`
                              : niveau === 'pays'
                                ? 'Sites'
                                : 'Locaux'}
                    </h3>
                    <InfoTip
                        title="Comment on compte"
                        detail="Le local s'ouvre sur ses équipements et le scan. Le site se clôt quand tous ses locaux sont comptés."
                    />
                </header>
                {!choix ? (
                    niveau === 'pays' ? (
                        <CardEmptyState
                            glyph={GlobeHemisphereWest}
                            title="Choisissez un pays"
                            description="Ses sites s'affichent ici ; un site choisi, ses locaux, avec ce qu'il reste à compter."
                        />
                    ) : (
                        <CardEmptyState
                            glyph={MapPin}
                            title="Choisissez un site"
                            description="Ses locaux s'affichent ici, avec ce qu'il reste à compter dans chacun."
                        />
                    )
                ) : rangeesDuChoix.length > 0 ? (
                    <div className="flex min-h-0 flex-1 flex-col px-4">
                        <div
                            ref={partDuChoix.zone}
                            className="relative min-h-0 flex-1 overflow-clip"
                        >
                            {rangeesDuChoix.slice(0, LIEUX_AU_PANNEAU)}
                        </div>
                        {partDuChoix.tronque && (
                            <PiedDeCarte>
                                <ToutVoir
                                    libelle={choix.site ? 'Tous les locaux' : 'Tous les sites'}
                                    total={choix.site ? choix.locauxComptes : choix.sites.length}
                                    onOuvrir={onOpenAllPlaces}
                                />
                            </PiedDeCarte>
                        )}
                    </div>
                ) : (
                    <CardEmptyState
                        glyph={choix.site ? DoorOpen : MapPin}
                        title={choix.site ? 'Aucun local dans ce site' : 'Aucun site à ce statut'}
                        description={
                            choix.site
                                ? "Il se compte d'un seul tenant : lancez-le depuis sa rangée."
                                : 'Élargissez le statut pour retrouver les sites de ce pays.'
                        }
                    />
                )}
            </section>
        </div>
    );

    /** Le vide nomme la contradiction — `.vide` de la colonne 4. */
    /* Dans la carte de la liste, comme tout vide de liste (25/09) : c'était une copie
       écrite à la main de la forme d'écran. */
    const empty = (
        <CardEmptyState
            glyph={Funnel}
            title="Aucun lieu ne correspond"
            description={emptyCause}
            action={
                activeConstraints.length > 0 ? (
                    <Button variant="outlined" onClick={onResetFilters}>
                        {activeConstraints.length > 1
                            ? `Effacer les ${activeConstraints.length} filtres`
                            : 'Effacer le filtre'}
                    </Button>
                ) : undefined
            }
        />
    );

    /** La ligne de compte : ce que la liste montre, et ce qui presse. */
    const urgence = retards > 0 ? `${retards} en retard` : 'les jamais vérifiés d’abord';
    const compte =
        niveau === 'pays'
            ? {
                  total: countries.length,
                  noun: `pays · ${sites.length} site${sites.length > 1 ? 's' : ''} · ${urgence}`,
              }
            : {
                  total: sites.length,
                  noun: `${sites.length === totalSiteCount ? '' : `des ${totalSiteCount} · `}site${sites.length > 1 ? 's' : ''} · ${urgence}`,
              };

    return (
        <>
            <ListTemplate
                /* 16.1 range ses lieux en file : rangées de 56, marque ronde. */
                skeleton="file"
                /* Le titre ne change plus avec le niveau (09/10) : le choix du site et du
                   local se fait par-dessus la liste, qui reste là. */
                title="Inventaire"
                onBack={onLeave}
                /* La bande de chiffres prend la place du héro : elle dit la même chose
                   en ligne. */
                hero={enDeuxNiveaux ? bande : hero}
                panel={enDeuxNiveaux ? panneau : undefined}
                /* **La hauteur que le panneau demande** (09/10) : sur un portable de
                   1366 × 657, la bande de tête ne lui laissait pas une rangée. En deçà de
                   ce minimum c'est la page qui défile, et le panneau garde son résumé,
                   trois rangées et son renvoi — comme la colonne d'une campagne (28/09). */
                zonesClassName="expanded:min-h-[28rem]"
                /* 8/4 : cinq colonnes à gauche pèsent plus qu'un héro et deux rangées. */
                panelRatio={4}
                note={
                    !enDeuxNiveaux && (countries.length > 0 || sites.length > 0) ? note : undefined
                }
                search={{
                    value: searchQuery,
                    onChange: onSearchChange,
                    placeholder: 'Site, local, pays',
                }}
                filter={
                    /* `.fbtn` — le bouton partagé : 48 au téléphone, 40 dans la ligne
                       d'outils du bureau. */
                    <FilterButton
                        label="Filtrer par statut"
                        count={activeFilterCount}
                        onClick={() => setFiltersOpen(true)}
                    />
                }
                /* 17.8 : **16.1 n'a pas de slot de tri** — *« une campagne d'inventaire a
                   un ordre d'avancement »*. La ligne de compte le nomme, et c'est tout. */
                count={compte}
                empty={empty}
                hasRows={niveau === 'pays' ? countries.length > 0 : sites.length > 0}
            >
                {enDeuxNiveaux ? (
                    <>
                        {/* `.lh` — les en-têtes ne se tronquent jamais : ils portent le
                            sens de toute leur colonne (17.11). */}
                        <div
                            className={cn(
                                GRILLE_SITE,
                                /* `.dlist .lh` de 16.1 — ce ne sont pas les en-têtes d'un
                                   tableau (17.11) : la liste porte les siens en 11,
                                   capitales espacées, encre tertiaire. */
                                'text-text-tertiary pt-2.5 pb-1.5 text-[0.6875rem] leading-4 tracking-[0.06em] uppercase',
                            )}
                        >
                            <span />
                            <span>{niveau === 'pays' ? 'Pays' : 'Site'}</span>
                            <span className="text-right">Attendus</span>
                            <span>Statut</span>
                            <span />
                        </div>
                        {niveau === 'pays'
                            ? countries.map((row) => rangeeDePaysAuBureau(row))
                            : sites.map((row) => rangeeDeSite(row))}
                    </>
                ) : niveau === 'pays' ? (
                    countries.map((row, index) => rangeeDePays(row, index))
                ) : (
                    sites.map((row, index) => rangeeDeLieu(row, index, 'site'))
                )}
            </ListTemplate>

            {/* **Le choix du lieu, en feuille** (09/10) — au téléphone et à la tablette : les
                sites du pays, puis, le site choisi, ses locaux. La liste reste derrière ;
                le local choisi mène à la campagne. Au bureau, c'est le panneau. */}
            <BottomSheet
                id="audit-lieu-sheet"
                open={!enDeuxNiveaux && Boolean(choix)}
                onClose={onCloseChoix}
                title={choixMontre ? (choixMontre.site ?? choixMontre.pays) : ''}
                subtitle={
                    choixMontre
                        ? choixMontre.site
                            ? `${choixMontre.pays} · ${choixMontre.locauxComptes} ${choixMontre.locauxComptes > 1 ? 'locaux' : 'local'} · ${choixMontre.totaux.expected} attendus`
                            : `${choixMontre.sites.length} site${choixMontre.sites.length > 1 ? 's' : ''} · ${choixMontre.totaux.expected} attendus`
                        : undefined
                }
            >
                <div className="flex flex-col pb-2">
                    {retourAuxSites()}
                    {rangeesDuChoix.length > 0 ? (
                        rangeesDuChoix
                    ) : (
                        <CardEmptyState
                            glyph={choixMontre?.site ? DoorOpen : MapPin}
                            title={
                                choixMontre?.site
                                    ? 'Aucun local dans ce site'
                                    : 'Aucun site à ce statut'
                            }
                            description={
                                choixMontre?.site
                                    ? "Il se compte d'un seul tenant."
                                    : 'Élargissez le statut pour retrouver les sites de ce pays.'
                            }
                        />
                    )}
                </div>
            </BottomSheet>

            {/* Feuille de filtre — un axe, le statut, avec ses comptes. Pastilles de 14 sur
                20, 36 de haut. */}
            <BottomSheet
                id="audit-scope-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Filtrer"
                emploi="filtre"
            >
                <div className="flex flex-col pb-0">
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key, index) => (
                        <React.Fragment key={key}>
                            <p
                                className={cn(
                                    'text-on-surface-variant pb-2 text-[0.75rem] leading-4 font-medium',
                                    index > 0 && 'pt-4',
                                )}
                            >
                                {FILTER_LABELS[key]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions[key].map((option) => (
                                    <FacetChip
                                        compact
                                        key={option.value}
                                        label={option.label}
                                        count={option.count}
                                        selected={filters[key] === option.value}
                                        onClick={() => onFilterChange(key, option.value)}
                                    />
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                    {/* `.sfoot` — le pied dit le résultat **avant** de le montrer. */}
                    <div
                        data-pied
                        className="border-outline-variant duo-de-pied -mx-5 mt-4 gap-3 border-t px-5 pt-4 pb-1"
                    >
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={onResetFilters}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => setFiltersOpen(false)}
                        >
                            Voir {sites.length} site{sites.length > 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </>
    );
};
