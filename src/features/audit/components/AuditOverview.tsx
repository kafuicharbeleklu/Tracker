import React, { useMemo, useState } from 'react';
import {
    Buildings,
    CaretRight,
    CheckCircle,
    CircleDashed,
    CircleHalf,
    ClockCountdown,
    Funnel,
    MagnifyingGlassMinus,
    Play,
    Scan,
} from '@phosphor-icons/react';
import Reading from '../../../components/layout/Reading';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { PageTabs } from '../../../components/ui/PageTabs';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { cn } from '../../../lib/utils';
import { ALL_VALUE, ServiceAuditRow } from '../serviceAudit';

type FilterKey = 'country' | 'site' | 'service' | 'status';

interface ScopeOption {
    value: string;
    label: string;
    /** Ce qui reste après ce choix. Un filtre sans compte se choisit à l'aveugle (16.1). */
    count: number;
}

export interface AuditScopeFilters {
    country: string;
    site: string;
    service: string;
    status: string;
}

interface AuditOverviewProps {
    rows: ServiceAuditRow[];
    scopedServiceCount: number;
    totals: {
        expected: number;
        found: number;
        missing: number;
        exceptions: number;
        coverage: number;
        activeCampaigns: number;
    };
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: AuditScopeFilters;
    filterOptions: Record<FilterKey, ScopeOption[]>;
    onFilterChange: (key: FilterKey, value: string) => void;
    onResetFilters: () => void;
    onOpenService: (row: ServiceAuditRow) => void;
    /** Lancer la campagne du service porté par la rangée — le geste de `.rbtn`. */
    onStartService: (row: ServiceAuditRow) => void;
    /** Les actifs qu'aucun service du référentiel ne réclame (dette V3). */
    unscopedAssets: number;
    onStartAudit: () => void;
    /**
     * La portée désigne-t-elle **un** service ? Une campagne n'en couvre qu'un — le
     * lexique de la planche le dit —, donc le geste de pied n'a de cible que dans ce
     * cas. Sinon il ouvre la feuille de périmètre, et son libellé l'annonce.
     */
    canStartOnScope: boolean;
    onOpenDetailsTab: () => void;
}

const FILTER_LABELS: Record<FilterKey, string> = {
    country: 'Pays',
    site: 'Site',
    service: 'Service',
    status: 'Statut',
};

const statusConfig = (status: ServiceAuditRow['status']) => {
    switch (status) {
        case 'Complet':
            return {
                label: 'complet',
                glyph: CheckCircle,
                colorClass: 'text-[var(--tk-color-st-vert)]',
            };
        case 'En cours':
            return {
                label: 'en cours',
                glyph: CircleHalf,
                colorClass: 'text-[var(--tk-color-st-bleu)]',
            };
        case 'A lancer':
            return {
                label: 'à lancer',
                glyph: ClockCountdown,
                colorClass: 'text-[var(--tk-color-st-ambre)]',
            };
        default:
            return {
                label: 'rien à auditer',
                glyph: CircleDashed,
                colorClass: 'text-text-secondary',
            };
    }
};

/**
 * **`.rbtn` — le geste de rangée, et il n'est jamais peint.**
 *
 * La planche déclare un seul geste de rangée — le creux de la page pour fond, encre
 * normale, 44 px de haut — et les trois verbes de la liste le portent **à
 * l'identique** : lancer, reprendre, clôturer. Le code en faisait trois boutons
 * différents : « Reprendre » en jaune de marque et « Clôturer » sur la surface
 * inversée. Le jaune de cet écran est déjà pris par le geste de pied — deux usages
 * par écran est le plafond, et une rangée par service en aurait posé autant qu'il y
 * a de campagnes ouvertes.
 */
const ROW_ACTION_CLASS =
    'bg-surface-container text-on-surface hover:bg-surface-container-high min-h-11 shrink-0 rounded-sm px-3.5 text-[13px]';

const StatusBadge: React.FC<{ status: ServiceAuditRow['status'] }> = ({ status }) => {
    const config = statusConfig(status);
    return (
        <span
            className={cn(
                'text-body-small inline-flex shrink-0 items-center gap-1.5 font-medium',
                config.colorClass,
            )}
        >
            <Icon glyph={config.glyph} size={16} />
            {config.label}
        </span>
    );
};

export const AuditOverview: React.FC<AuditOverviewProps> = ({
    rows,
    scopedServiceCount,
    totals,
    searchQuery,
    onSearchChange,
    filters,
    filterOptions,
    onFilterChange,
    onResetFilters,
    onOpenService,
    onStartService,
    unscopedAssets,
    onStartAudit,
    canStartOnScope,
    onOpenDetailsTab,
}) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilters = useMemo(
        () =>
            (Object.keys(FILTER_LABELS) as FilterKey[])
                .filter((key) => filters[key] !== ALL_VALUE)
                .map((key) => ({
                    key,
                    label: `${FILTER_LABELS[key]} · ${
                        filterOptions[key].find((option) => option.value === filters[key])?.label ??
                        filters[key]
                    }`,
                })),
        [filterOptions, filters],
    );

    /**
     * **Les trois moments de l'écran** (16.1, colonnes 1 et 2). Au repos, rien n'a été
     * scanné. En campagne, l'écart décide. Et quand la campagne est propre, le seul
     * geste restant est de clôturer — ce n'est pas le même écran que « il reste des
     * décisions à prendre », et il ne se dit pas avec les mêmes mots.
     */
    const isCampaignActive =
        totals.found > 0 ||
        totals.missing > 0 ||
        totals.exceptions > 0 ||
        totals.activeCampaigns > 0;
    const hasPendingDecisions = totals.missing > 0 || totals.exceptions > 0;
    const isCampaignClean = isCampaignActive && !hasPendingDecisions;
    const isScopeFiltered =
        filters.country !== ALL_VALUE ||
        filters.site !== ALL_VALUE ||
        filters.service !== ALL_VALUE;

    /**
     * **Le périmètre courant se lit dans la barre du haut, et il se retire d'un tap**
     * (16.1). Il nommait le pays et lui seul : une portée posée sur un site ou un
     * service s'affichait « périmètre actif », ce qui ne dit rien — or *« un périmètre
     * ne s'applique jamais en silence »*. Il nomme désormais l'axe le plus fin des
     * trois, celui qui décide réellement de ce qu'on voit.
     */
    /**
     * Ce qui est **posé** sur la liste, en toutes lettres — le périmètre, le statut, la
     * recherche. Le bandeau les nomme, et le vide s'en sert pour dire *pourquoi* il est
     * vide plutôt que de constater qu'il l'est.
     */
    const statusLabel = filterOptions.status.find(
        (option) => option.value === filters.status,
    )?.label;
    const activeConstraints = useMemo(() => {
        const constraints: string[] = [];
        if (filters.service !== ALL_VALUE) constraints.push(`service « ${filters.service} »`);
        else if (filters.site !== ALL_VALUE) constraints.push(`site « ${filters.site} »`);
        else if (filters.country !== ALL_VALUE) constraints.push(`pays « ${filters.country} »`);
        if (filters.status !== ALL_VALUE && statusLabel)
            constraints.push(`statut « ${statusLabel.toLowerCase()} »`);
        if (searchQuery.trim()) constraints.push(`recherche « ${searchQuery.trim()} »`);
        return constraints;
    }, [filters, statusLabel, searchQuery]);

    const emptyCause =
        activeConstraints.length === 0
            ? "Aucun service n'est rattaché à ce référentiel : les actifs portent un département là où le référentiel porte un service."
            : `Aucun service ne réunit ${activeConstraints.join(' et ')}. Élargissez l'un des deux, ou effacez tout.`;

    const scopeLabel =
        filters.service !== ALL_VALUE
            ? filters.service
            : filters.site !== ALL_VALUE
              ? filters.site
              : filters.country !== ALL_VALUE
                ? filters.country
                : 'tout le parc';

    return (
        <Reading className="space-y-4 pb-12">
            <header className="flex flex-col gap-1">
                <h1 className="font-brand text-on-surface text-[22px] font-semibold tracking-[-0.015em]">
                    Audit
                </h1>
                <p className="text-body-small text-text-secondary">
                    <span className="tabular-nums">{scopedServiceCount}</span> service
                    {scopedServiceCount > 1 ? 's' : ''} · {scopeLabel}
                </p>
            </header>

            <PageTabs
                appearance="neutral"
                allViewsButton={false}
                idBase="audit-overview"
                ariaLabel="Vues de l'audit"
                activeId="overview"
                onChange={(tabId) => {
                    if (tabId !== 'details') return;
                    /* Une campagne porte sur un service : sans service désigné, il n'y
                       a pas de campagne à ouvrir. L'onglet renvoie alors au périmètre,
                       comme le geste de pied — jamais sur un écran sans sujet. */
                    if (!canStartOnScope) {
                        setFiltersOpen(true);
                        return;
                    }
                    onOpenDetailsTab();
                }}
                items={[
                    { id: 'overview', label: 'Vue globale' },
                    /* La puce dit **combien de décisions attendent** de l'autre côté :
                       sans elle, l'onglet ne se distingue pas d'un onglet vide (16.1). */
                    {
                        id: 'details',
                        label: 'Détails campagne',
                        shortLabel: 'Détails',
                        /* Elle compte **les manquants et les écarts** — les décisions en
                           attente —, pas les actifs scannés, et elle n'apparaît que
                           lorsqu'il y en a. */
                        badge: hasPendingDecisions ? totals.missing + totals.exceptions : undefined,
                    },
                ]}
            />

            {/* Bandeau de périmètre actif (Planche 16.1) */}
            {(isScopeFiltered || filters.status !== ALL_VALUE) && (
                <div className="bg-surface-container text-body-small text-on-surface flex items-center justify-between gap-2 rounded-md p-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Icon glyph={Funnel} size={16} className="text-text-secondary shrink-0" />
                        <span className="truncate">
                            {/* V1 est corrigé : l'écran ne pose plus de périmètre tout seul.
                                Le bandeau ne dit donc plus « posé à l'ouverture, pas par
                                vous » — il nomme la portée et met sa sortie à côté. */}
                            Périmètre <strong>{scopeLabel}</strong>
                            {filters.status !== ALL_VALUE && statusLabel && (
                                <>
                                    {' '}
                                    · statut <strong>{statusLabel.toLowerCase()}</strong>
                                </>
                            )}
                        </span>
                    </div>
                    <Button
                        variant="text"
                        size="sm"
                        onClick={onResetFilters}
                        className="text-body-small h-auto min-h-0 shrink-0 p-0 underline"
                    >
                        Tout voir
                    </Button>
                </div>
            )}

            {/* Porte-voix (Planche 16.1) */}
            <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-baseline gap-2">
                    <b className="font-brand text-on-surface text-[30px] font-semibold tracking-[-0.02em] tabular-nums">
                        {hasPendingDecisions
                            ? totals.missing
                            : isCampaignClean
                              ? totals.found
                              : totals.expected}
                    </b>
                    <span className="text-body-medium text-text-secondary">
                        {hasPendingDecisions
                            ? `manquant${totals.missing > 1 ? 's' : ''}, et ${totals.exceptions} écart${totals.exceptions > 1 ? 's' : ''}`
                            : isCampaignClean
                              ? `retrouvés sur ${totals.expected}`
                              : `actif${totals.expected > 1 ? 's' : ''} attendu${totals.expected > 1 ? 's' : ''}, aucun vérifié`}
                    </span>
                </div>
                <p className="text-body-small text-text-secondary">
                    {hasPendingDecisions ? (
                        <>
                            Sur <strong>{totals.expected} attendus</strong>, {totals.found}{' '}
                            retrouvés. Les {totals.missing} manquants et les {totals.exceptions}{' '}
                            objets trouvés hors campagne sont les{' '}
                            <strong>seules lignes qui demandent une décision</strong> — le reste est
                            déjà vérifié.
                        </>
                    ) : isCampaignClean ? (
                        <>
                            <strong>Aucun écart.</strong> La campagne peut être clôturée telle
                            quelle : c'est le seul cas où la clôture ne retire aucun actif d'un
                            service.
                        </>
                    ) : (
                        <>
                            <strong>Dernier inventaire : jamais.</strong> Le parc compte{' '}
                            {totals.expected} actif
                            {totals.expected > 1 ? 's' : ''} attendu{totals.expected > 1 ? 's' : ''}{' '}
                            dans ce périmètre.
                        </>
                    )}
                </p>
            </div>

            {/* Bloc des 4 chiffres — en campagne seulement (Planche 16.1 Relevé V2) */}
            {isCampaignActive && (
                <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
                    <div className="divide-outline-variant flex divide-x">
                        <div className="min-w-0 flex-1 px-2 first:pl-0">
                            <p className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                {totals.expected}
                            </p>
                            <p className="text-body-small text-text-secondary">attendus</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2">
                            <p className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                {totals.found}
                            </p>
                            <p className="text-body-small text-text-secondary">retrouvés</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2">
                            <p className="font-brand text-error text-[20px] font-semibold tabular-nums">
                                {totals.missing}
                            </p>
                            <p className="text-body-small text-text-secondary">manquants</p>
                        </div>
                        <div className="min-w-0 flex-1 px-2 last:pr-0">
                            <p className="font-brand text-[20px] font-semibold text-[var(--tk-color-st-orange)] tabular-nums">
                                {totals.exceptions}
                            </p>
                            <p className="text-body-small text-text-secondary">écarts</p>
                        </div>
                    </div>

                    <div className="bg-surface-container mt-3 h-1 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-on-surface h-full transition-all duration-300"
                            style={{ width: `${totals.coverage}%` }}
                        />
                    </div>
                    <p className="text-body-small text-text-secondary mt-2 tabular-nums">
                        {totals.found} sur {totals.expected} · {totals.coverage} %
                    </p>
                </section>
            )}

            {/* **La recherche n'existe qu'au repos** (16.1). La colonne « campagne en
                cours » ne la dessine pas : dès qu'un scan a eu lieu, l'écran ne sert plus
                à *trouver un service*, il sert à dire ce que la campagne a laissé à
                décider. Le périmètre, lui, a été posé au lancement — et le bandeau
                au-dessus le nomme, avec sa sortie.

                **Sauf devant une liste vide** : là, le champ et le bouton restent,
                actifs. *« Les faire disparaître avec la liste est ce qui fait croire
                qu'on a perdu le filtre, et non qu'on l'a trop serré. »* */}
            {(!isCampaignActive || rows.length === 0) && (
                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={onSearchChange}
                    onFilterClick={() => setFiltersOpen(true)}
                    filterActive={filtersOpen}
                    filterPanelId="audit-scope-filter-sheet"
                    filterCount={activeFilters.length}
                    placeholder="Rechercher un service"
                />
            )}

            {/* Liste des services */}
            <div className="text-body-small text-text-secondary flex items-baseline justify-between px-0.5">
                <span>Les jamais vérifiés d'abord</span>
                <span className="text-text-muted shrink-0 tabular-nums">
                    {isCampaignActive
                        ? `${rows.length} des ${scopedServiceCount} services`
                        : `${rows.length} service${rows.length > 1 ? 's' : ''} · ${totals.expected} attendu${totals.expected > 1 ? 's' : ''}`}
                </span>
            </div>

            {rows.length === 0 ? (
                <section className="flex flex-col items-center justify-center gap-3.5 px-6 py-10 text-center">
                    <Icon glyph={MagnifyingGlassMinus} size={32} className="text-text-muted" />
                    <div>
                        <h3 className="font-brand text-body-large text-on-surface font-semibold">
                            Aucun service ne correspond
                        </h3>
                        {/* **Il nomme la contradiction** — c'est la seule information
                            utile devant une liste vide : la cause, pas le constat. */}
                        <p className="text-body-small text-text-secondary mt-1 max-w-[320px]">
                            {emptyCause}
                        </p>
                    </div>
                    <Button variant="outlined" size="sm" onClick={onResetFilters}>
                        {activeConstraints.length > 1
                            ? `Effacer les ${activeConstraints.length} filtres`
                            : 'Effacer le filtre'}
                    </Button>
                </section>
            ) : (
                <section className="bg-surface shadow-elevation-1 overflow-hidden rounded-lg">
                    <div className="divide-outline-variant divide-y">
                        {rows.map((row) => (
                            <div
                                key={`${row.country}-${row.site}-${row.service}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => onOpenService(row)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onOpenService(row);
                                    }
                                }}
                                className="hover:bg-surface-container flex min-h-[64px] w-full cursor-pointer items-center gap-3 p-3.5 text-left transition-colors"
                            >
                                <div className="bg-surface-container text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                                    <Icon glyph={Buildings} size={20} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <span className="text-body-medium text-on-surface block truncate font-medium">
                                        {row.service}
                                    </span>
                                    <div className="text-body-small text-text-secondary mt-0.5 flex items-center gap-1.5">
                                        <span className="min-w-0 flex-1 truncate">{row.site}</span>
                                        <StatusBadge status={row.status} />
                                    </div>
                                </div>

                                {row.status === 'A lancer' ? (
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStartService(row);
                                        }}
                                        className={ROW_ACTION_CLASS}
                                    >
                                        Lancer
                                    </Button>
                                ) : row.status === 'En cours' ? (
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenService(row);
                                        }}
                                        className={ROW_ACTION_CLASS}
                                    >
                                        Reprendre
                                    </Button>
                                ) : row.status === 'Complet' ? (
                                    /* Une campagne complète n'attend plus qu'un acte, et c'est
                                   celui-là : la rangée le nomme au lieu d'un chevron. */
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenService(row);
                                        }}
                                        className={ROW_ACTION_CLASS}
                                    >
                                        Clôturer
                                    </Button>
                                ) : (
                                    <Icon
                                        glyph={CaretRight}
                                        size={18}
                                        className="text-text-secondary shrink-0"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* `.hint` — **ce n'est pas un état vide de dessin, c'est une donnée
                        à réconcilier** : les actifs portent un département là où le
                        référentiel porte un service, et les deux vocabulaires ne se
                        recoupent pas (16.1, dette V3). La planche le dit sous les
                        rangées, dans la carte : il parle de la liste, pas de l'écran. */}
                    {unscopedAssets > 0 && (
                        <p className="text-body-small text-text-secondary px-3.5 pb-3.5 leading-[17px]">
                            <strong className="text-on-surface font-medium">
                                {unscopedAssets} actif{unscopedAssets > 1 ? 's' : ''} n'
                                {unscopedAssets > 1 ? 'entrent' : 'entre'} dans aucune campagne
                            </strong>
                            {
                                " — ils ne sont rattachés à aucun service du référentiel. Ce n'est pas un vide de dessin : c'est une donnée à réconcilier."
                            }
                        </p>
                    )}
                </section>
            )}

            {/* LE GESTE DE PIED — **jamais un bouton flottant** : il agit sur le
                périmètre entier, donc sur ce que la liste vient de dire, et il n'a rien à
                recouvrir (16.1). Il a trois libellés, un par moment de l'écran : on lance,
                on reprend, on clôture. */}
            {!canStartOnScope ? (
                /* La portée couvre plusieurs services, et une campagne n'en prend
                   qu'un. Le bouton ne promet donc pas de lancer : il ouvre la feuille
                   qui resserre. Rien de désactivé — ce que l'ADN interdit, c'est le
                   bouton mort accompagné d'une phrase d'instruction. */
                <Button
                    variant="filled"
                    className="mt-2 w-full justify-center"
                    onClick={() => setFiltersOpen(true)}
                >
                    <Icon glyph={Funnel} size={18} />
                    Choisir le service à auditer
                </Button>
            ) : isCampaignClean ? (
                <Button
                    variant="tonal"
                    className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 mt-2 w-full justify-center"
                    onClick={onStartAudit}
                >
                    Clôturer la campagne
                </Button>
            ) : isCampaignActive ? (
                <Button
                    variant="filled"
                    className="mt-2 w-full justify-center"
                    onClick={onStartAudit}
                >
                    <Icon glyph={Scan} size={18} />
                    Reprendre le scan
                </Button>
            ) : (
                <Button
                    variant="filled"
                    className="mt-2 w-full justify-center"
                    onClick={onStartAudit}
                >
                    <Icon glyph={Play} size={18} />
                    Lancer une campagne sur ce périmètre
                </Button>
            )}

            {/* La clôture retire des actifs d'un service : elle se confirme là où elle
                s'explique, sur la campagne (16.2). Le dire ici évite de la chercher. */}
            {hasPendingDecisions && (
                <p className="text-body-small text-text-secondary px-0.5 leading-[17px]">
                    La clôture n'est pas ici :{' '}
                    <strong className="text-on-surface font-medium">
                        elle retire des actifs d'un service
                    </strong>{' '}
                    et se confirme sur la campagne.
                </p>
            )}

            {/* Feuille de filtre (Planche 16.1 Colonne 3) */}
            <BottomSheet
                id="audit-scope-filter-sheet"
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Périmètre"
            >
                <div className="flex flex-col pb-0">
                    {/* **Quatre axes, dans l'ordre où ils se resserrent** — pays → site →
                        service —, puis le statut, qui ne resserre pas un lieu mais un
                        état. Chaque option porte son compte : c'est ce qui distingue un
                        filtre qu'on choisit d'un filtre qu'on tente. */}
                    {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                        <React.Fragment key={key}>
                            <p className="text-text-muted px-5 pt-3.5 pb-1.5 text-[11px] font-medium tracking-[0.06em] uppercase">
                                {FILTER_LABELS[key]}
                            </p>
                            <div className="flex flex-wrap gap-2 px-5">
                                {filterOptions[key].map((option) => (
                                    <Button
                                        key={option.value}
                                        variant="text"
                                        onClick={() => onFilterChange(key, option.value)}
                                        className={cn(
                                            'flex min-h-11 items-center gap-[7px] rounded-md px-3 text-[13px]',
                                            filters[key] === option.value
                                                ? 'bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90'
                                                : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                                        )}
                                    >
                                        {option.label}
                                        <b className="font-semibold tabular-nums">{option.count}</b>
                                    </Button>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}

                    {/* Une feuille de **filtre** a un pied, et le pied dit le résultat
                        avant de le montrer (§2.9). */}
                    <div className="border-outline-variant mt-3 flex items-center gap-3 border-t px-5 pt-3.5 pb-0.5">
                        <Button variant="ghost" className="px-1" onClick={onResetFilters}>
                            Tout effacer
                        </Button>
                        <Button
                            variant="tonal"
                            className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 flex-1 justify-center"
                            onClick={() => setFiltersOpen(false)}
                        >
                            Voir les {rows.length} service{rows.length > 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </Reading>
    );
};
