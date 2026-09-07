import React, { useMemo, useState } from 'react';
import {
    CaretRight,
    DoorOpen,
    Funnel,
    Info,
    MagnifyingGlassMinus,
    MapPin,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';
import { ALL_VALUE, buildRowKey, formatSince, PlaceAuditRow } from '../placeAudit';

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

interface AuditOverviewProps {
    rows: PlaceAuditRow[];
    /** Combien de lieux la portée laisse — le dénominateur de la ligne de compte. */
    scopedPlaceCount: number;
    /** Combien de locaux ces lieux comptent — la première tuile du héro. */
    scopedLocalCount: number;
    totals: {
        expected: number;
        found: number;
        missing: number;
        exceptions: number;
        coverage: number;
        activeCampaigns: number;
        lastScanAt: string | null;
    };
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
}) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

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
                title={openedSite ? openedSite.site : 'Inventaire'}
                onBack={openedSite ? onCloseSite : undefined}
                hero={hero}
                note={rows.length > 0 ? note : undefined}
                /* Le second niveau **est** un site : il ne se cherche ni ne se filtre,
                   il se lit. La recherche et l'entonnoir appartiennent au premier. */
                search={
                    openedSite
                        ? undefined
                        : {
                              value: searchQuery,
                              onChange: onSearchChange,
                              placeholder: 'Site, local, pays',
                          }
                }
                filter={
                    openedSite ? undefined : (
                        /* `.fbtn` — 48 carré, rayon 4, en creux. Son compteur est un carré
                           sombre de 18 : il compte des filtres, il ne signale pas une alerte. */
                        <Button
                            variant="text"
                            aria-label="Choisir le périmètre"
                            onClick={() => setFiltersOpen(true)}
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high focus-visible:ring-focus-ring relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md p-0 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <Icon glyph={Funnel} size={20} />
                            {activeFilterCount > 0 && (
                                <span className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[2px] px-[5px] text-[11px] leading-[18px] font-medium tabular-nums">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    )
                }
                /* 17.8 : **16.1 n'a pas de slot de tri** — *« une campagne d'inventaire a
                   un ordre d'avancement »*. La ligne de compte le nomme, et c'est tout. */
                count={{
                    total: rows.length,
                    noun: openedSite
                        ? `lieu${rows.length > 1 ? 'x' : ''} à compter · en cours d'abord`
                        : `${rows.length === totalRowCount ? '' : `des ${scopedPlaceCount} · `}lieu${rows.length > 1 ? 'x' : ''} · les jamais vérifiés d'abord`,
                }}
                empty={empty}
                hasRows={rows.length > 0}
            >
                {rows.map((row, index) => {
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
                            className={cn(
                                'flex min-h-16 w-full cursor-pointer items-center gap-3 py-2 text-left',
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
                                    <RowSubline row={row} level={openedSite ? 'local' : 'site'} />
                                </span>
                                {/* `.mini` — l'avancement du lieu, dans la rangée : il
                                    n'existe qu'une fois le comptage commencé. */}
                                {row.status === 'En cours' && (
                                    <span className="bg-outline-variant mt-1.5 flex h-1 max-w-[200px] overflow-hidden rounded-sm">
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
                                <Icon
                                    glyph={CaretRight}
                                    size={20}
                                    className="text-text-muted shrink-0"
                                />
                            )}
                        </div>
                    );
                })}
            </ListTemplate>

            {/* Feuille de périmètre — 16.1 colonne 3 : deux axes, chacun avec ses comptes. */}
            <BottomSheet
                id="audit-scope-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Périmètre"
            >
                <div className="flex flex-col pb-0">
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                        <React.Fragment key={key}>
                            <p className="text-on-surface-variant px-5 pt-3.5 pb-2 text-[12px] leading-4 font-medium">
                                {FILTER_LABELS[key]}
                            </p>
                            <div className="flex flex-wrap gap-2 px-5">
                                {filterOptions[key].map((option) => (
                                    <FacetChip
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
                    <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
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
