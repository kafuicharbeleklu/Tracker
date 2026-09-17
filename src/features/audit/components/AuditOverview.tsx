import React, { useMemo, useState } from 'react';
import { CaretRight, DoorOpen, Info, MagnifyingGlassMinus, MapPin } from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
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
                'font-brand block text-[22px] leading-7 font-semibold tracking-[-0.015em] tabular-nums',
                tone === 'ecart' && 'text-[var(--tk-color-live-ambre)]',
            )}
        >
            {value}
        </span>
        <span className="mt-0.5 block truncate text-[12px] leading-4 text-[var(--tk-color-on-dark-2)]">
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
    'bg-surface-container text-on-surface hover:bg-surface-container-high h-10 min-h-10 shrink-0 rounded-sm px-3.5 text-[15px] font-medium';

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
            <span className="block text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                {heroKicker}
            </span>

            {/* `.big` — **un seul nombre**, et c'est l'écart dès qu'il en existe un.
                Avant le premier scan, il n'y a rien à comparer : ce sont les attendus. */}
            <div className="mt-2 flex items-baseline gap-2.5">
                <b className="font-brand text-[44px] leading-[48px] font-semibold tracking-[-0.03em] tabular-nums">
                    {hasPendingDecisions
                        ? totals.missing
                        : isCampaignClean
                          ? totals.found
                          : totals.expected}
                </b>
                <span className="text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
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
                            className="block h-full bg-[var(--tk-color-live-vert)]"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-[12px] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
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
        <div className="text-on-surface-variant flex items-start gap-2 px-1 text-[14px] leading-5">
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
                            'block truncate text-[16px] leading-6',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.site}
                    </span>
                    <span className="text-on-surface-variant block truncate text-[13px] leading-5">
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
                        'text-right text-[14px] leading-5 tabular-nums',
                        muet ? 'text-on-surface-variant' : 'text-on-surface',
                    )}
                >
                    {row.expected}
                    {commence && (
                        <small className="text-on-surface-variant block text-[12px] leading-4">
                            {row.found} trouvé{row.found > 1 ? 's' : ''}
                        </small>
                    )}
                </span>

                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 text-[14px] leading-5 whitespace-nowrap',
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
                            className={cn(ROW_ACTION_CLASS, 'h-9 min-h-9 px-3 text-[14px]')}
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
                            'block truncate text-[16px] leading-6',
                            muet ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {row.local ?? row.site}
                    </span>
                    <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                        <RowSubline row={row} level={niveau} />
                    </span>
                    {/* `.mini` — l'avancement du lieu, dans la rangée : il
                                    n'existe qu'une fois le comptage commencé. */}
                    {row.status === 'En cours' && (
                        <span className="bg-outline-variant mt-1.5 flex h-1 max-w-[200px] overflow-hidden rounded-xs">
                            <i
                                className="block h-full bg-[var(--tk-color-live-vert)]"
                                style={{ width: `${row.progress}%` }}
                            />
                        </span>
                    )}
                </div>

                {seLance ? (
                    <Button
                        variant="text"
                        onClick={(event) => {
                            event.stopPropagation();
                            onStartPlace(row);
                        }}
                        className={ROW_ACTION_CLASS}
                    >
                        Lancer
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
    const jamaisVerifies = useMemo(
        () => sites.filter((row) => row.status === 'A lancer' && row.expected > 0).length,
        [sites],
    );

    const bande = (
        <section className="bg-surface flex rounded-lg px-5 py-3.5">
            {[
                {
                    cle: 'attendus',
                    valeur: totalsParc.expected,
                    legende: `actif${totalsParc.expected > 1 ? 's' : ''} attendu${totalsParc.expected > 1 ? 's' : ''} · ${
                        filters.country === ALL_VALUE ? 'tout le parc' : filters.country
                    }`,
                },
                {
                    cle: 'lieux',
                    valeur: sites.length,
                    legende: `site${sites.length > 1 ? 's' : ''} · ${locauxDuParc} ${locauxDuParc > 1 ? 'locaux' : 'local'}`,
                },
                {
                    cle: 'jamais',
                    valeur: jamaisVerifies,
                    legende: `jamais vérifié${jamaisVerifies > 1 ? 's' : ''}`,
                    teinte: 'bg-[var(--tk-color-st-ambre)]',
                },
                {
                    cle: 'encours',
                    valeur: totalsParc.activeCampaigns,
                    legende: `campagne${totalsParc.activeCampaigns > 1 ? 's' : ''} en cours`,
                    teinte: 'bg-[var(--tk-color-st-bleu)]',
                },
                {
                    cle: 'ecarts',
                    valeur: totalsParc.exceptions,
                    legende: `écart${totalsParc.exceptions > 1 ? 's' : ''} relevé${totalsParc.exceptions > 1 ? 's' : ''}`,
                },
            ].map((chiffre) => (
                <div
                    key={chiffre.cle}
                    className="border-outline-variant min-w-0 flex-1 py-0.5 pr-4 not-first:pl-4"
                >
                    <span className="font-brand text-on-surface flex items-center gap-2 text-[22px] leading-[26px] font-semibold tabular-nums">
                        {chiffre.teinte && (
                            <i
                                aria-hidden="true"
                                className={cn('h-2 w-2 shrink-0 rounded-xs', chiffre.teinte)}
                            />
                        )}
                        {chiffre.valeur}
                    </span>
                    {/* La légende **se replie**, elle ne se coupe pas : « actifs attendus ·
                        tout le parc » vaut 175 px en 12, et la bande n'en donne que 200 à
                        1280. Une ellipse y mangerait le périmètre, qui est le sujet. Sa boîte
                        tient 24 — 16 de ligne, 4 de part et d'autre —, sans marge : dans
                        16.1 elle est un `span` en ligne. */}
                    <span className="text-on-surface-variant block py-1 text-[12px] leading-4">
                        {chiffre.legende}
                    </span>
                </div>
            ))}
        </section>
    );

    /**
     * **Le panneau du site choisi** — 4 douzièmes : *« le panneau de droite est la
     * colonne 2 telle quelle »*, même héro, mêmes rangées, même note.
     *
     * Tant qu'aucun site n'est choisi, il porte une invitation. La planche ne dessine pas
     * cet état — elle montre toujours un site sélectionné — mais un panneau qui
     * apparaîtrait au premier clic ferait sauter la largeur de la liste sous le curseur.
     */
    const panneau = openedSite ? (
        <div className="flex flex-col gap-4">
            <div className="px-1">
                <h2 className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                    {openedSite.site}
                </h2>
                <p className="text-on-surface-variant mt-0.5 text-[14px] leading-5">
                    {openedSite.country} · site · {scopedLocalCount}{' '}
                    {scopedLocalCount > 1 ? 'locaux' : 'local'}
                </p>
            </div>
            {hero}
            {rows.length > 0 && (
                <section className="bg-surface rounded-xl px-4">
                    {rows.map((row, index) => rangeeDeLieu(row, index, 'local'))}
                </section>
            )}
            {note}
        </div>
    ) : (
        <div className="bg-surface text-on-surface-variant flex flex-col items-center gap-2 rounded-xl px-5 py-8 text-center">
            <Icon glyph={MapPin} size={24} className="text-text-tertiary" />
            <p className="text-[14px] leading-5">
                Choisissez un site pour voir ses locaux et son avancement.
            </p>
        </div>
    );

    /** Le vide nomme la contradiction — `.vide` de la colonne 4. */
    const empty = (
        <div className="flex flex-col items-center gap-4 px-4 pt-6 pb-16 text-center">
            <span className="bg-surface-container text-text-muted flex h-24 w-24 items-center justify-center rounded-full">
                <Icon glyph={MagnifyingGlassMinus} size={32} />
            </span>
            <div>
                <p className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                    Aucun lieu ne correspond
                </p>
                <p className="text-on-surface-variant mx-auto mt-1 max-w-[280px] text-[16px] leading-6">
                    {emptyCause}
                </p>
            </div>
            {activeConstraints.length > 0 && (
                <Button variant="tonal" className="justify-center" onClick={onResetFilters}>
                    {activeConstraints.length > 1
                        ? `Effacer les ${activeConstraints.length} filtres`
                        : 'Effacer le filtre'}
                </Button>
            )}
        </div>
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
                                'text-text-tertiary pt-2.5 pb-1.5 text-[11px] leading-4 tracking-[0.06em] uppercase',
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
            >
                <div className="flex flex-col pb-0">
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key, index) => (
                        <React.Fragment key={key}>
                            <p
                                className={cn(
                                    'text-on-surface-variant pb-2 text-[12px] leading-4 font-medium',
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
                    <div className="border-outline-variant -mx-5 mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
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

/**
 * La sous-ligne de 16.1 — elle ne dit pas la même chose aux deux niveaux. Au premier,
 * d'où l'on est et combien de locaux restent à ouvrir ; au second, l'avancement du
 * local. Le gras y porte le fait, jamais le décor.
 */
const RowSubline: React.FC<{ row: PlaceAuditRow; level: 'site' | 'local' }> = ({ row, level }) => {
    if (row.expected === 0) {
        return <>{level === 'site' ? row.country : row.site} · rien à inventorier</>;
    }

    if (level === 'site') {
        return (
            <>
                {row.country} ·{' '}
                <b className="text-on-surface font-medium">{row.expected} attendus</b>
                {(row.localCount ?? 0) > 0 && (
                    <>
                        {' '}
                        · {row.localCount} {(row.localCount ?? 0) > 1 ? 'locaux' : 'local'}
                    </>
                )}
            </>
        );
    }

    const prefixe = row.horsLocal ? 'Hors local · ' : '';
    if (row.status === 'En cours') {
        return (
            <>
                {prefixe}
                <b className="text-on-surface font-medium">En cours</b> · {row.found} /{' '}
                {row.expected} comptés
            </>
        );
    }
    if (row.status === 'Complet') {
        return (
            <>
                {prefixe}
                <b className="text-on-surface font-medium">Complet</b> · {row.found} /{' '}
                {row.expected}
            </>
        );
    }
    return (
        <>
            {prefixe}
            <b className="text-on-surface font-medium">
                {row.expected} attendu{row.expected > 1 ? 's' : ''}
            </b>{' '}
            · jamais compté
        </>
    );
};
