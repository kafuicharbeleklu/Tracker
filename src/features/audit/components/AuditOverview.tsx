import React, { useMemo, useState } from 'react';
import { CaretRight, DoorOpen, Funnel, Info, MapPin, Play } from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import FacetChip from '../../../components/ui/FacetChip';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
import InfoTip from '../../../components/ui/InfoTip';
import { cn } from '../../../lib/utils';
import {
    ALL_VALUE,
    buildRowKey,
    enRetard,
    formatSince,
    PlaceAuditRow,
    STATUS_LABELS,
} from '../placeAudit';
import { useData } from '../../../context/DataContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { useEntree } from '../../../hooks/useEntree';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';

/**
 * **Le périmètre d'un comptage est un lieu et un état** — 16.1 : *« Pays, puis le
 * statut : la liste est déjà celle des sites. »* Le service a été retiré le 06/09 : il
 * n'est pas un lieu, et il ne bornait rien qu'on puisse aller compter.
 */
type FilterKey = 'country' | 'status';

interface ScopeOption {
    value: string;
    label: string;
    /** Ce qui reste après ce choix. Un filtre sans compte se choisit à l'aveugle (16.1). */
    count: number;
}

export interface AuditScopeFilters {
    country: string;
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

interface AuditOverviewProps {
    rows: PlaceAuditRow[];
    /**
     * **Les sites, toujours** — au bureau ils restent à gauche pendant qu'on lit le site
     * choisi à droite (16.1, colonne bureau). Au téléphone, `rows` les porte déjà quand
     * aucun site n'est ouvert, et cette liste-ci ne sert pas.
     */
    sites: PlaceAuditRow[];
    /** Les chiffres du parc retenu — la bande du bureau, qui ne suit pas la sélection. */
    totalsParc: Totaux;
    /** Combien de lieux la portée laisse — le dénominateur de la ligne de compte. */
    scopedPlaceCount: number;
    /** Combien de locaux ces lieux comptent — la première tuile du héro. */
    scopedLocalCount: number;
    totals: Totaux;
    /** Le site ouvert : la liste montre alors ses locaux, et le titre porte son nom. */
    openedSite: { country: string; site: string } | null;
    onCloseSite: () => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: AuditScopeFilters;
    filterOptions: Record<FilterKey, ScopeOption[]>;
    onFilterChange: (key: FilterKey, value: string) => void;
    onResetFilters: () => void;
    onOpenPlace: (row: PlaceAuditRow) => void;
    /** Lancer le comptage du lieu porté par la rangée — le geste de `.rbtn`. */
    onStartPlace: (row: PlaceAuditRow) => void;
    /** Les actifs qu'aucun site ne situe : ils ne peuvent pas être comptés. */
    unscopedAssets: number;
    /** Le total avant recherche et statut — pour dire « 3 des 12 ». */
    totalRowCount: number;
    /**
     * `.tb` du `.top` — **la flèche de retour du premier niveau**. Les quatre colonnes de
     * 16.1 la dessinent ; la page s'atteint depuis « Plus » et ne se quittait, sans elle,
     * que par la barre du bas. Un site ouvert la reprend pour refermer le site.
     */
    onLeave?: () => void;
}

const FILTER_LABELS: Record<FilterKey, string> = {
    country: 'Pays',
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
    rows,
    sites,
    totalsParc,
    scopedPlaceCount,
    scopedLocalCount,
    totals,
    openedSite,
    onCloseSite,
    searchQuery,
    onSearchChange,
    filters,
    filterOptions,
    onFilterChange,
    onResetFilters,
    onOpenPlace,
    onStartPlace,
    unscopedAssets,
    totalRowCount,
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
        () =>
            (enDeuxNiveaux ? sites : rows).filter((row) =>
                enRetard(row, settings.inventoryPeriodMonths),
            ).length,
        [enDeuxNiveaux, rows, settings.inventoryPeriodMonths, sites],
    );

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
        if (filters.country !== ALL_VALUE) constraints.push(`le pays ${filters.country}`);
        if (filters.status !== ALL_VALUE && statusLabel)
            constraints.push(`le statut « ${statusLabel.toLowerCase()} »`);
        if (searchQuery.trim()) constraints.push(`« ${searchQuery.trim()} »`);
        return constraints;
    }, [filters, statusLabel, searchQuery]);

    const emptyCause =
        activeConstraints.length === 0
            ? "Aucun actif n'est situé : un objet sans emplacement ne peut pas être compté sur place."
            : `${activeConstraints.join(' et ')} se contredisent. Élargissez le statut ou effacez la recherche.`;

    /** Le surtitre du héro : la portée, en toutes lettres. */
    const heroKicker = openedSite
        ? `${openedSite.country} · site`
        : filters.country !== ALL_VALUE
          ? filters.country
          : 'Tout le parc';

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
                            value={openedSite ? scopedLocalCount : scopedPlaceCount}
                            label={
                                openedSite
                                    ? `${scopedLocalCount > 1 ? 'locaux' : 'local'} à compter`
                                    : `site${scopedPlaceCount > 1 ? 's' : ''} · ${scopedLocalCount} ${scopedLocalCount > 1 ? 'locaux' : 'local'}`
                            }
                        />
                        <HeroTile value="—" label="jamais vérifié" />
                    </>
                )}
            </div>

            {/* `.prog` et `.pk` — la jauge et sa ligne de lecture n'existent qu'en
                campagne : une barre à zéro devant un parc jamais compté ne mesure rien. */}
            {isCampaignActive && (
                <>
                    <div className="mt-5 flex h-1.5 overflow-hidden rounded-sm bg-white/[0.12]">
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
                {openedSite ? (
                    <>
                        Troisième niveau : le local s'ouvre sur ses équipements et le scan. Le site
                        se clôt quand tous ses locaux sont comptés.
                    </>
                ) : (
                    <>
                        Un site sans local se lance ici. Un site avec locaux s'ouvre : on choisit le
                        local, puis on compte.
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
                    </>
                )}
            </span>
        </div>
    );

    /* Les cinq colonnes du tableau des sites — la même grille pour l'en-tête et les
       rangées, sinon elles cessent de s'aligner à la première troncature. */
    const GRILLE_SITE = 'grid grid-cols-[40px_minmax(0,1fr)_96px_140px_84px] items-center gap-3';

    /** La teinte de l'état d'un lieu — la même dans la vignette et dans la pastille. */
    const TEINTE_STATUT: Record<PlaceAuditRow['status'], string> = {
        'A lancer': 'bg-[var(--tk-color-st-ambre)]',
        'En cours': 'bg-[var(--tk-color-st-bleu)]',
        Complet: 'bg-[var(--tk-color-st-vert)]',
        'A planifier': '',
    };

    /**
     * **Une rangée de site au bureau** — cinq colonnes : le lieu, ce qu'on y attend,
     * l'état, le geste. *« Cliquer une rangée ne navigue pas : elle se sélectionne et le
     * panneau change »*, et le chevron disparaît — la sélection le remplace.
     */
    const rangeeDeSite = (row: PlaceAuditRow) => {
        const ouvreUnNiveau = !row.local && !row.horsLocal && (row.localCount ?? 0) > 0;
        const seLance = !ouvreUnNiveau && row.status === 'A lancer';
        const muet = row.expected === 0;
        const choisi =
            openedSite?.site === row.site && openedSite?.country === row.country && ouvreUnNiveau;
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

    /**
     * **Une rangée de lieu** — la même au téléphone et dans le panneau du bureau : le
     * panneau *est* la colonne 2 de la planche, mêmes rangées comprises.
     */
    const rangeeDeLieu = (row: PlaceAuditRow, index: number, niveau: 'site' | 'local') => {
        /* Un site qui a des locaux **ouvre** ; un lieu qui se compte
                       directement et n'a jamais été compté porte le verbe. */
        const ouvreUnNiveau = !row.local && !row.horsLocal && (row.localCount ?? 0) > 0;
        const seLance = !ouvreUnNiveau && row.status === 'A lancer';
        const muet = row.expected === 0;

        return (
            <div
                key={buildRowKey(row)}
                role="button"
                tabIndex={0}
                onClick={() => onOpenPlace(row)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenPlace(row);
                    }
                }}
                /* `.trow` — **56**, gouttière 12, 8 d'intérieur. Elle tenait 64 : le
                   plancher de la rangée d'objet (04.1), quand 16.1 range des lieux en
                   file et déclare la mesure des files. Le contenu en fait 60 de toute
                   façon — vignette 40, deux lignes de 24 et 20 — et le plancher ne
                   servait qu'à écarter les rangées d'un lieu sans sous-ligne. */
                className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                    index > 0 && 'border-outline-variant border-t',
                )}
            >
                {/* `.vig` — la teinte dit l'état du lieu : ambre quand rien
                                n'a été compté, bleu pendant, vert au bout. Un local porte
                                une porte, un site une épingle. */}
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

                <div className="min-w-0 flex-1">
                    <span
                        className={cn(
                            'text-ts-body leading-ts-body block truncate',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.local ?? row.site}
                    </span>
                    {/* **L'état dans la sous-ligne, le compte à droite** (24/09) : « France ·
                        8 attendus » disait le nombre dans la phrase ; il passe en chiffre, et la
                        sous-ligne dit où en est le lieu, par un point de sa teinte. */}
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub flex min-w-0 items-center gap-1.5">
                        {/* Le pays cède la place à l'état : entre le chiffre et le ▶, la sous-ligne
                            n'avait plus que 150 px et coupait « jamais véri… ». */}
                        {niveau === 'local' && row.horsLocal && (
                            <span className="shrink-0">Hors local ·</span>
                        )}
                        {!muet && (
                            <i
                                aria-hidden="true"
                                className={cn(
                                    'h-2 w-2 shrink-0 rounded-xs',
                                    TEINTE_STATUT[row.status] || 'bg-outline',
                                )}
                            />
                        )}
                        <span className="truncate">
                            {muet
                                ? 'rien à inventorier'
                                : row.status === 'En cours'
                                  ? `en cours · ${row.found}/${row.expected}`
                                  : row.status === 'Complet'
                                    ? 'complet'
                                    : row.status === 'A lancer'
                                      ? 'jamais vérifié'
                                      : STATUS_LABELS[row.status].toLowerCase()}
                        </span>
                    </span>
                    {/* `.mini` — l'avancement du lieu, dans la rangée : il
                                    n'existe qu'une fois le comptage commencé. */}
                    {row.status === 'En cours' && (
                        <span className="bg-outline-variant mt-1.5 flex h-1 max-w-[200px] overflow-hidden rounded-xs">
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
                {seLance ? (
                    <Button
                        variant="text"
                        iconOnly
                        aria-label={`Lancer le comptage — ${row.local ?? row.site}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onStartPlace(row);
                        }}
                        className="bg-tint-ambre text-on-tint-ambre doigt:h-12 doigt:min-h-12 doigt:w-12 doigt:min-w-12 h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-md hover:opacity-90"
                    >
                        <Icon glyph={Play} size={20} emphasis="fill" />
                    </Button>
                ) : (
                    <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                )}
            </div>
        );
    };

    /**
     * **La bande de chiffres** — au bureau, elle remplace le héro : *« la bande reprend
     * le héro du téléphone »* (16.1, colonne bureau), et elle ne suit pas la sélection.
     * Chaque nombre est une porte : le point de couleur dit l'état qu'il compte.
     */
    const locauxDuParc = useMemo(
        () => sites.reduce((somme, row) => somme + (row.localCount ?? 0), 0),
        [sites],
    );

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
                    className="bg-surface-container mt-4 flex h-2 gap-px overflow-hidden rounded-xs"
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
            {tuile(
                'Actifs attendus',
                totalsParc.expected,
                filters.country === ALL_VALUE ? 'tout le parc' : filters.country,
                'attendus',
            )}
            {tuile(
                'Sites',
                sites.length,
                `${locauxDuParc} ${locauxDuParc > 1 ? 'locaux' : 'local'} · ${couverture.parts.jamais.sites} jamais vérifié${couverture.parts.jamais.sites > 1 ? 's' : ''}`,
                'sites',
            )}
            {tuile(
                'Campagnes en cours',
                totalsParc.activeCampaigns,
                <span
                    className={cn(totalsParc.exceptions > 0 && 'text-[var(--tk-color-st-orange)]')}
                >
                    {totalsParc.exceptions} écart{totalsParc.exceptions > 1 ? 's' : ''} relevé
                    {totalsParc.exceptions > 1 ? 's' : ''}
                </span>,
                'campagnes',
            )}
        </div>
    );

    /**
     * **Le panneau du site choisi** — 4 douzièmes : *« le panneau de droite est la
     * colonne 2 telle quelle »*, même héro, mêmes rangées, même note.
     *
     * Tant qu'aucun site n'est choisi, il porte une invitation. La planche ne dessine pas
     * cet état — elle montre toujours un site sélectionné — mais un panneau qui
     * apparaîtrait au premier clic ferait sauter la largeur de la liste sous le curseur.
     */
    /**
     * **Le panneau du site — claire, et la liste d'abord** (23/09, reprise).
     *
     * Le héro sombre prenait la moitié de la colonne : à 900 de fenêtre, la liste des
     * locaux n'en montrait que trois, et la note en retenait encore 60 au pied. Le site
     * tient désormais dans une carte blanche de 140 px — le pays, le nom en 22, trois
     * chiffres en 17 sur une ligne, le petit gabarit des tuiles —, et ses locaux dans une
     * seconde carte qui prend le reste et défile. La note passe dans l'infobulle de
     * l'en-tête de liste : on la lit quand on la cherche.
     */
    const chiffresDuSite: Array<{
        cle: string;
        valeur: React.ReactNode;
        libelle: string;
        ecart?: boolean;
    }> = isCampaignActive
        ? [
              { cle: 'attendus', valeur: totals.expected, libelle: 'attendus' },
              { cle: 'trouves', valeur: totals.found, libelle: 'trouvés' },
              {
                  cle: 'ecarts',
                  valeur: totals.exceptions,
                  libelle: `écart${totals.exceptions > 1 ? 's' : ''}`,
                  ecart: totals.exceptions > 0,
              },
          ]
        : [
              {
                  cle: 'attendus',
                  valeur: totals.expected,
                  libelle: `actif${totals.expected > 1 ? 's' : ''} attendu${totals.expected > 1 ? 's' : ''}`,
              },
              {
                  cle: 'locaux',
                  valeur: scopedLocalCount,
                  libelle: `${scopedLocalCount > 1 ? 'locaux' : 'local'} à compter`,
              },
              {
                  cle: 'verifie',
                  valeur: totals.lastScanAt ? formatSince(totals.lastScanAt) : '—',
                  libelle: totals.lastScanAt ? 'dernier comptage' : 'jamais vérifié',
              },
          ];

    /**
     * **Deux cartes, toujours là** (23/09, troisième reprise) : la carte du site en tête,
     * celle de ses locaux dessous. Elles existent **avant** qu'un site soit choisi — à
     * vide, chacune dit ce qu'elle montrera —, si bien que choisir un site remplit deux
     * cadres au lieu de faire apparaître un panneau : rien ne bouge sous le curseur.
     */
    const panneau = (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <section className="bg-surface shrink-0 rounded-xl px-4 pt-4 pb-4">
                <span className="text-on-surface-variant block text-[0.75rem] leading-4">
                    {openedSite ? `${openedSite.country} · site` : 'Site'}
                </span>
                <h2
                    className={cn(
                        'font-brand text-ts-sheet leading-ts-sheet mt-1 truncate font-semibold tracking-[-0.015em]',
                        openedSite ? 'text-on-surface' : 'text-text-tertiary',
                    )}
                >
                    {openedSite ? openedSite.site : 'Aucun site choisi'}
                </h2>
                {/* À vide, les trois cases gardent leur place avec un tiret : la carte a
                    déjà sa hauteur, et le site choisi ne la fera pas grandir. */}
                <dl className="mt-4 grid grid-cols-3 gap-3">
                    {chiffresDuSite.map((chiffre) => (
                        <div key={chiffre.cle} className="min-w-0">
                            <dt className="sr-only">{chiffre.libelle}</dt>
                            <dd
                                className={cn(
                                    'font-brand text-ts-head leading-ts-head truncate font-semibold tabular-nums',
                                    !openedSite
                                        ? 'text-text-tertiary'
                                        : chiffre.ecart
                                          ? 'text-[var(--tk-color-st-orange)]'
                                          : 'text-on-surface',
                                )}
                            >
                                {openedSite ? chiffre.valeur : '—'}
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
                {openedSite && isCampaignActive && (
                    /* En campagne, le ruban de 8 des autres jauges, à 16 des chiffres. */
                    <div className="bg-surface-container mt-4 h-2 overflow-hidden rounded-xs">
                        <i
                            className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-st-vert)] transition-[width]"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                )}
            </section>

            <section className="bg-surface flex min-h-0 flex-1 flex-col rounded-xl">
                <header className="flex shrink-0 items-center gap-1 px-4 pt-3">
                    <h3 className="text-on-surface-variant min-w-0 flex-1 text-[0.75rem] leading-4 font-medium">
                        {/* Le compte des locaux, celui de la carte du site : la rangée « hors local »
                            n'en est pas un. */}
                        Locaux{openedSite ? ` · ${scopedLocalCount}` : ''}
                    </h3>
                    <InfoTip
                        title="Comment on compte"
                        detail="Le local s'ouvre sur ses équipements et le scan. Le site se clôt quand tous ses locaux sont comptés."
                    />
                </header>
                {!openedSite ? (
                    <CardEmptyState
                        glyph={MapPin}
                        title="Choisissez un site"
                        description="Ses locaux s'affichent ici, avec ce qu'il reste à compter dans chacun."
                    />
                ) : rows.length > 0 ? (
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
                        {rows.map((row, index) => rangeeDeLieu(row, index, 'local'))}
                    </div>
                ) : (
                    <CardEmptyState
                        glyph={DoorOpen}
                        title="Aucun local dans ce site"
                        description="Il se compte d'un seul tenant : lancez-le depuis sa rangée."
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

    return (
        <>
            <ListTemplate
                /* 16.1 range ses lieux en file : rangées de 56, marque ronde. */
                skeleton="file"
                /* Au bureau, le titre ne change plus avec le niveau : les deux tiennent
                   dans l'écran, et c'est le panneau qui nomme le site choisi. */
                title={!enDeuxNiveaux && openedSite ? openedSite.site : 'Inventaire'}
                onBack={!enDeuxNiveaux && openedSite ? onCloseSite : onLeave}
                /* La bande de chiffres prend la place du héro : elle dit la même chose
                   en ligne, et le héro descend dans le panneau, au niveau du site. */
                hero={enDeuxNiveaux ? bande : hero}
                panel={enDeuxNiveaux ? panneau : undefined}
                /* 8/4 : cinq colonnes à gauche pèsent plus qu'un héro et deux rangées. */
                panelRatio={4}
                note={!enDeuxNiveaux && rows.length > 0 ? note : undefined}
                /* Le second niveau **est** un site : il ne se cherche ni ne se filtre,
                   il se lit. La recherche et l'entonnoir appartiennent au premier. */
                /* La recherche et le périmètre appartiennent au premier niveau — et au
                   bureau le premier niveau ne quitte jamais l'écran. */
                search={
                    openedSite && !enDeuxNiveaux
                        ? undefined
                        : {
                              value: searchQuery,
                              onChange: onSearchChange,
                              placeholder: 'Site, local, pays',
                          }
                }
                filter={
                    openedSite && !enDeuxNiveaux ? undefined : (
                        /* `.fbtn` — le bouton partagé : 48 au téléphone, 40 dans la ligne
                           d'outils du bureau. Il était retapé ici à la main. */
                        <FilterButton
                            label="Choisir le périmètre"
                            count={activeFilterCount}
                            onClick={() => setFiltersOpen(true)}
                        />
                    )
                }
                /* 17.8 : **16.1 n'a pas de slot de tri** — *« une campagne d'inventaire a
                   un ordre d'avancement »*. La ligne de compte le nomme, et c'est tout. */
                count={{
                    total: enDeuxNiveaux ? sites.length : rows.length,
                    noun: enDeuxNiveaux
                        ? `site${sites.length > 1 ? 's' : ''} · ${
                              retards > 0 ? `${retards} en retard` : 'les jamais vérifiés d’abord'
                          }`
                        : openedSite
                          ? `lieu${rows.length > 1 ? 'x' : ''} à compter · en cours d'abord`
                          : `${rows.length === totalRowCount ? '' : `des ${scopedPlaceCount} · `}lieu${rows.length > 1 ? 'x' : ''} · ${
                                /* La périodicité de 14.1 rend « en retard » disable : au-delà
                                 d'elle, un lieu que personne n'a recompté est en dette. Le
                                 dire ici plutôt que dans la sous-ligne d'une rangée — la
                                 sous-ligne est tronquée, la ligne d'ordre ne l'est pas. */
                                retards > 0 ? `${retards} en retard` : 'les jamais vérifiés d’abord'
                            }`,
                }}
                empty={empty}
                hasRows={enDeuxNiveaux ? sites.length > 0 : rows.length > 0}
            >
                {enDeuxNiveaux ? (
                    <>
                        {/* `.lh` — les en-têtes ne se tronquent jamais : ils portent le
                            sens de toute leur colonne (17.11). */}
                        <div
                            className={cn(
                                GRILLE_SITE,
                                /* `.dlist .lh` de 16.1 — ce ne sont pas les en-têtes d'un
                                   tableau (17.11) : la liste des sites porte les siens en 11,
                                   capitales espacées, encre tertiaire. */
                                'text-text-tertiary pt-2.5 pb-1.5 text-[0.6875rem] leading-4 tracking-[0.06em] uppercase',
                            )}
                        >
                            <span />
                            <span>Site</span>
                            <span className="text-right">Attendus</span>
                            <span>Statut</span>
                            <span />
                        </div>
                        {sites.map((row) => rangeeDeSite(row))}
                    </>
                ) : (
                    rows.map((row, index) =>
                        rangeeDeLieu(row, index, openedSite ? 'local' : 'site'),
                    )
                )}
            </ListTemplate>

            {/* Feuille de périmètre — 16.1 colonne 3 : deux axes, chacun avec ses comptes.
                Pastilles de 14 sur 20, 36 de haut. */}
            <BottomSheet
                id="audit-scope-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Périmètre"
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
                        className="border-outline-variant -mx-5 mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1"
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
                            Voir {rows.length} lieu{rows.length > 1 ? 'x' : ''}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </>
    );
};
