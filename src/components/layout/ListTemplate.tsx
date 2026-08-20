import React, { useMemo } from 'react';
import { ArrowBendDownLeft, ArrowLeft, Funnel, List, SortAscending, X } from '@phosphor-icons/react';

import Icon from '../ui/Icon';
import Button from '../ui/Button';
import SearchField from '../ui/SearchField';
import FacetChip from '../ui/FacetChip';
import { SkeletonList } from '../ui/Skeleton';
import SelectionTopBar from '../ui/SelectionTopBar';
import BulkActionBar from '../ui/BulkActionBar';
import { OfflineBanner } from '../ui/ContextBanner';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDelayedPending } from '../../hooks/useDelayedPending';
import { MEDIA } from '../../constants/breakpoints';
import { cn } from '../../lib/utils';
import type { FacetTone } from '../ui/FacetChip';

/**
 * Gabarit **liste / file** — planches **04.1** (liste) et **08.1** (file), régime
 * tablette **00.4**. Il porte quatre écrans : Inventaire, Utilisateurs, Catalogue,
 * Emplacements — plus la file de Tâches.
 *
 * **Une liste sert à trouver, pas à lire.** On l'ouvre pour une seule chose :
 * retrouver l'objet dont on vous parle, ou choisir dans ce qui est disponible.
 * Tout ce que le gabarit impose découle de là.
 *
 * ## Ce qu'il décide une fois pour les quatre écrans
 *
 * - **Ni pagination, ni corbeille de rangée.** Deux pages pour 14 actifs, la page
 *   active en aplat jaune : c'était un troisième jaune, et pour atteindre la page 2
 *   il fallait défiler dix rangées puis viser 40 px sous le bouton flottant. À la
 *   place : **on cherche, on filtre**. Sur un parc, on ne feuillette pas.
 * - **Les états montent en tête, avec leurs compteurs.** L'axe sur lequel on filtre
 *   presque toujours — *qu'est-ce qui est disponible* — devient visible. Le bouton
 *   de filtre garde le reste et porte un compteur dès qu'un filtre est posé.
 * - **Le tri partage la ligne du décompte**, et le décompte nomme ses deux nombres
 *   quand la liste est réduite (« 14 actifs · 2 affichés »).
 * - **Un seul jaune dans le contenu** : le bouton d'ajout (§X12 — le budget est de
 *   deux, et l'onglet actif en prend un).
 * - **La largeur de lecture s'arrête à 960 px** (§2.43). Une liste étirée sur
 *   1600 px n'est pas plus lisible : l'œil perd la ligne entre le nom et la valeur.
 *
 * ## Ce qui change avec la largeur — six lignes, et rien d'autre (00.4)
 *
 * | | compact | ≥ 600 |
 * | --- | --- | --- |
 * | navigation | barre du bas | rail *(porté par `AppLayout`)* |
 * | padding | 16 | 24 |
 * | recherche | champ dans la bande | champ dans la page |
 * | pastilles | défilantes | **toutes visibles** |
 * | faits par rangée | 2 | **4**, jamais inventés |
 * | en-tête | barre à filet | titre + compteur, sans filet |
 *
 * > **Une divergence entre les deux planches, tranchée ici.** 00.4 annonce la recherche
 * > comme un *ajout* du régime large (« loupe → champ permanent ») ; 04.1, qui est la
 * > planche de la page, dessine le **champ permanent dès 393 px**, avec son invite
 * > (« Code, identifiant, modèle »). C'est 04.1 qui l'emporte : le cadre de 393 px de 00.4
 * > est une **comparaison de rangées**, pas la spécification du compact. Signalé plutôt
 * > que résolu en silence.
 *
 * **Ni hauteur de rangée, ni vignette, ni échelle typographique, ni rayon, ni place
 * du jaune.** C'est ce que la planche démontre en posant les deux largeurs côte à
 * côte.
 *
 * ## Ce qu'il branche pour l'écran
 *
 * L'attente (17.3), le vide (17.1), le hors-ligne (17.1) et le mode sélection
 * (17.2) sont câblés **ici** : un écran qui adopte ce gabarit les reçoit sans les
 * réécrire — c'est tout l'objet de l'étape 1.
 */

export interface ListFacet {
    id: string;
    label: string;
    /** Le décompte. Un axe de filtre sans compteur ne dit pas ce qu'il vaut. */
    count?: number;
    icon?: PhosphorGlyph;
    /** Teinte du glyphe — même vocabulaire que `ListRow`. */
    tone?: FacetTone;
}

interface ListTemplateProps {
    title: string;
    /** Le second fait de l'en-tête — « 14 au parc ». Jamais une redite du titre. */
    subtitle?: string;
    onBack?: () => void;
    /** Gestes de l'en-tête : scanner, filtrer, ajouter. Deux au plus au téléphone. */
    actions?: React.ReactNode;

    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
    };
    /** Le bouton de filtre et sa feuille — l'appelant les fournit, le gabarit les place. */
    filter?: React.ReactNode;

    facets?: ListFacet[];
    activeFacetId?: string;
    onFacetSelect?: (id: string) => void;
    /** Retrait direct de la facette active (arrivée pré-filtrée, par exemple). */
    onActiveFacetClear?: () => void;
    activeFacetClearLabel?: string;

    /**
     * Arrivée pré-filtrée depuis un autre écran. Le produit applique aujourd'hui le
     * filtre **sans le dire** : on arrive sur deux rangées là où le parc en compte
     * quatorze. Trois choses le disent ici — le jeton retirable, la provenance en
     * toutes lettres, et un geste de sortie qui **nomme sa destination** (« Voir les
     * 14 équipements »), jamais « effacer les filtres ».
     */
    origin?: {
        token: string;
        from: React.ReactNode;
        clearLabel: string;
        onClear: () => void;
        /** Les autres listes conservent le jeton ; 04.1 montre seulement la provenance. */
        displayToken?: boolean;
        /** La sortie de 04.1 est une ligne de liste, pas un CTA tonal. */
        clearPresentation?: 'button' | 'more';
        /** Une arrivée peut exposer sa sortie dans le bandeau plutôt qu'en pied de page. */
        inlineClearLabel?: string;
        showClearAction?: boolean;
    };

    count?: { total: number; shown?: number; noun: string };
    sort?: { label: string; onClick: () => void };

    /** Mode sélection (17.2). Absent : l'écran ne sélectionne pas. */
    selection?: {
        active: boolean;
        count: number;
        total: number;
        onExit: () => void;
        onSelectAll?: () => void;
        onClearAll?: () => void;
        /** Les actes possibles sur la sélection courante — deux au plus. */
        actions?: React.ReactNode;
        /** Le débordement de la barre du haut : ce qui ne tient pas dans le pied. */
        overflow?: React.ReactNode;
        /** Le débordement du pied, quand un troisième acte existe. */
        bulkOverflow?: React.ReactNode;
    };

    loading?: boolean;
    /** Ce que l'écran montre quand il n'y a rien — un `ScreenState` (17.1). */
    empty?: React.ReactNode;
    /** Le pied de liste : ce que la liste compte, ou ce qu'elle attend. */
    footer?: React.ReactNode;
    /** Le bouton flottant — le seul jaune du contenu. */
    fab?: React.ReactNode;
    /** Les rangées. */
    children?: React.ReactNode;
    /** Nombre de rangées métier : les panneaux et modales ne doivent pas masquer un état vide. */
    hasRows?: boolean;
    className?: string;
}

/** La mesure de lecture du système : 960 px, une seule valeur (§2.43). */
const Reading: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('w-full max-w-[960px]', className)}>{children}</div>
);

const ListTemplate: React.FC<ListTemplateProps> = ({
    title,
    subtitle,
    onBack,
    actions,
    search,
    filter,
    facets,
    activeFacetId,
    onFacetSelect,
    onActiveFacetClear,
    activeFacetClearLabel,
    origin,
    count,
    sort,
    selection,
    loading = false,
    empty,
    footer,
    fab,
    children,
    hasRows: hasRowsOverride,
    className,
}) => {
    const isCompact = useMediaQuery(MEDIA.compact);
    const showSkeleton = useDelayedPending(loading);
    const hasRows = hasRowsOverride ?? React.Children.count(children) > 0;

    /** Le bandeau ne s'affiche que si une facette autre que la partition est posée. */
    const activeFilterNotice = useMemo(() => {
        if (!facets || facets.length < 2 || !activeFacetId || !onFacetSelect) return null;
        const whole = facets[0];
        const active = facets.find((facet) => facet.id === activeFacetId);
        if (!active || active.id === whole.id) return null;
        if (typeof active.count !== 'number' || typeof whole.count !== 'number') return null;
        return {
            label: active.label,
            shown: active.count,
            total: whole.count,
            onClear: () => onFacetSelect(whole.id),
        };
    }, [facets, activeFacetId, onFacetSelect]);

    return (
        <div className={cn('relative flex min-h-0 min-w-0 w-full flex-1 flex-col', className)}>
            {selection?.active ? (
                <SelectionTopBar
                    count={selection.count}
                    total={selection.total}
                    onExit={selection.onExit}
                    onSelectAll={selection.onSelectAll}
                    onClearAll={selection.onClearAll}
                    overflow={selection.overflow}
                />
            ) : isCompact ? (
                /* Barre du haut du téléphone (planche 04.1 .tbar.plain) : 56 px de haut,
                   titre 22 px Archivo, 20 px de marge latérale, bouton d'action à droite. */
                <div className="flex min-h-14 items-center justify-between border-b border-outline-variant bg-surface px-5 py-1">
                    {onBack && (
                        <button
                            type="button"
                            aria-label="Retour"
                            onClick={onBack}
                            className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        >
                            <Icon glyph={ArrowLeft} size={24} />
                        </button>
                    )}
                    <h1 className="min-w-0 flex-1 font-brand text-[20px] font-semibold leading-7 tracking-[-0.015em] text-on-surface">
                        {title}
                    </h1>
                    {actions}
                </div>
            ) : (
                /* Au rail, la barre ne redit pas la destination : le rail la porte
                   déjà. Titre, compteur, gestes — sans filet (00.4). */
                <div className="flex items-center gap-3 px-page pt-5">
                    <h1 className="shrink-0 font-brand text-[20px] font-semibold leading-7 tracking-[-0.015em] text-on-surface">
                        {title}
                    </h1>
                    {subtitle && (
                        <span className="text-body-medium tabular-nums text-text-secondary">{subtitle}</span>
                    )}
                    <span className="flex-1" />
                    {actions}
                </div>
            )}

            <OfflineBanner />

            {/* La bande de recherche et les pastilles — chrome attaché à l'en-tête au
                téléphone (§2.37, 12 px symétriques), simple bande de page au rail. */}
            {(search || filter || (facets && facets.length > 0)) && !selection?.active && (
                <div
                    className={cn(
                        'flex flex-col gap-2.5',
                        isCompact
                            ? 'border-b border-outline-variant bg-surface px-5 py-3'
                            : 'px-page pt-4'
                    )}
                >
                    {(search || (filter && !(facets && facets.length > 0 && !search))) && (
                        <Reading className="flex items-center gap-2">
                            {search && (
                                <SearchField
                                    value={search.value}
                                    onChange={search.onChange}
                                    placeholder={search.placeholder}
                                    className="flex-1"
                                />
                            )}
                            {filter}
                        </Reading>
                    )}

                    {facets && facets.length > 0 && (
                        <Reading className={cn('overflow-hidden', !search && filter ? 'flex items-center gap-2' : undefined)}>
                            {/* À 393 px les puces défilent ; dès 600 elles tiennent toutes,
                                et un filtre qu'on ne voit pas se choisit à l'aveugle. */}
                            {!search && filter && <span className="shrink-0">{filter}</span>}
                            <div
                                className={cn(
                                    'flex gap-2 overflow-x-auto [scrollbar-width:none]',
                                    !search && filter && 'min-w-0 flex-1',
                                    isCompact ? 'pr-1' : 'flex-wrap'
                                )}
                            >
                                {facets.map((facet) => (
                                    <FacetChip
                                        key={facet.id}
                                        label={facet.label}
                                        count={facet.count}
                                        icon={facet.icon}
                                        tone={facet.tone}
                                        selected={facet.id === activeFacetId}
                                        onClick={() => onFacetSelect?.(facet.id)}
                                        onClear={
                                            facet.id === activeFacetId ? onActiveFacetClear : undefined
                                        }
                                        clearLabel={activeFacetClearLabel}
                                    />
                                ))}
                            </div>
                        </Reading>
                    )}
                </div>
            )}

            <div className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-5 medium:px-page">
                {origin && (
                    <Reading>
                        <div className="flex flex-wrap items-center gap-2 text-body-small text-text-secondary">
                            {origin.displayToken !== false && (
                                <span className="flex min-h-8 items-center gap-2 rounded-md bg-surface-container px-3 text-on-surface">
                                    {origin.token}
                                    <Button
                                        variant="text"
                                        iconOnly
                                        size="sm"
                                        aria-label={`Retirer le filtre ${origin.token}`}
                                        onClick={origin.onClear}
                                        className="-mr-2 h-6 w-6 min-w-0"
                                    >
                                        <Icon glyph={X} size={18} />
                                    </Button>
                                </span>
                            )}
                            {origin.displayToken === false && (
                                <Icon glyph={ArrowBendDownLeft} size={16} className="shrink-0 text-text-secondary" />
                            )}
                            <span className="min-w-0">{origin.from}</span>
                            {origin.inlineClearLabel && (
                                <button
                                    type="button"
                                    onClick={origin.onClear}
                                    className="shrink-0 cursor-pointer text-[12px] font-medium text-on-surface underline underline-offset-4 hover:text-text-secondary"
                                >
                                    {origin.inlineClearLabel}
                                </button>
                            )}
                        </div>
                    </Reading>
                )}

                {/*
                  LE BANDEAU DE FILTRE ACTIF — `.filt` de la planche 03.3, rendu
                  **obligatoire** par la section C du correctif du 18/08 : « le compteur
                  de chip devient explicitement relatif ». « Validations 6 » sous l'onglet
                  « À faire 17 » doit se lire « **6 des 17** » — sans quoi deux compteurs
                  voisins semblent compter la même chose et ne le font pas.
                  La première facette est la partition entière (« Tout ») : c'est elle qui
                  donne le dénominateur, et c'est vers elle que « Tout voir » ramène.
                */}
                {activeFilterNotice && !selection?.active && (
                    <Reading>
                        <div className="bg-surface-muted-strong text-body-medium flex items-center gap-2.5 rounded-vignette px-3.5 py-[11px] leading-[18px] text-on-surface-variant">
                            <Icon glyph={Funnel} size={18} className="text-on-surface-variant shrink-0" />
                            <span className="min-w-0 flex-1">
                                <b className="text-on-surface font-medium tabular-nums">
                                    {activeFilterNotice.shown} des {activeFilterNotice.total}
                                </b>{' '}
                                — {activeFilterNotice.label.toLowerCase()}
                            </span>
                            <button
                                type="button"
                                onClick={activeFilterNotice.onClear}
                                className="text-on-surface shrink-0 cursor-pointer text-body-small font-medium underline underline-offset-[3px]"
                            >
                                Tout voir
                            </button>
                        </div>
                    </Reading>
                )}

                {count && !selection?.active && (
                    <Reading className="flex min-h-11 items-center justify-between gap-3 text-[13px] text-text-secondary">
                        <span className="whitespace-nowrap">
                            <b className="font-semibold tabular-nums text-on-surface">{count.total}</b>{' '}
                            {count.noun}
                            {typeof count.shown === 'number' && count.shown !== count.total && (
                                <> · {count.shown} affichés</>
                            )}
                        </span>
                        {sort && (
                            <button
                                type="button"
                                onClick={sort.onClick}
                                className="-mr-2 flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2 text-[13px] font-medium text-on-surface hover:bg-surface-container"
                            >
                                <Icon glyph={SortAscending} size={18} className="text-text-secondary" />
                                {sort.label}
                            </button>
                        )}
                    </Reading>
                )}

                {showSkeleton ? (
                    <Reading>
                        <div className="rounded-xl bg-surface px-4">
                            <SkeletonList />
                        </div>
                    </Reading>
                ) : hasRows ? (
                    <Reading>
                        <section className="rounded-xl bg-surface px-4">{children}</section>
                        {footer && (
                            <p className="mt-1.5 text-center text-[12px] tabular-nums text-text-muted">
                                {footer}
                            </p>
                        )}
                    </Reading>
                ) : (
                    !loading && (
                        <>
                            {empty}
                            {children}
                        </>
                    )
                )}

                {origin && origin.showClearAction !== false && (
                    <Reading>
                        {origin.clearPresentation === 'more' ? (
                            <Button
                                variant="text"
                                icon={<Icon glyph={List} size={18} />}
                                onClick={origin.onClear}
                                className="w-full justify-center rounded-none border-t border-outline-variant px-0 text-on-surface"
                            >
                                {origin.clearLabel}
                            </Button>
                        ) : (
                            <Button variant="tonal" onClick={origin.onClear} className="w-full">
                                {origin.clearLabel}
                            </Button>
                        )}
                    </Reading>
                )}
            </div>

            {selection?.active ? (
                <BulkActionBar count={selection.count} overflow={selection.bulkOverflow}>
                    {selection.actions}
                </BulkActionBar>
            ) : (
                fab
            )}
        </div>
    );
};

export default ListTemplate;
