import React, { useMemo } from 'react';
import {
    ArrowBendDownLeft,
    ArrowLeft,
    Funnel,
    List,
    Plus,
    Rows,
    SortAscending,
    Table,
    X,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Icon from '../ui/Icon';
import Button from '../ui/Button';
import SearchField from '../ui/SearchField';
import FacetChip from '../ui/FacetChip';
import { FabContainer } from '../ui/FabContainer';
import FloatingActionButton from '../ui/FloatingActionButton';
import { SkeletonList, SkeletonQueue } from '../ui/Skeleton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useData } from '../../context/DataContext';
import { OfflineState } from '../ui/ScreenState';
import SelectionTopBar from '../ui/SelectionTopBar';
import { useDeclareSelectionRegime } from '../../context/SelectionRegimeContext';
import BulkActionBar from '../ui/BulkActionBar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDelayedPending } from '../../hooks/useDelayedPending';
import { MEDIA } from '../../constants/breakpoints';
import { IconGestureSizeContext } from '../../hooks/useIconGestureSize';
import { AddGesturePlacementContext } from '../../hooks/useAddGesturePlacement';
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
     * **Les facettes sont-elles des parts d'un tout ?** Par défaut oui — la première est
     * le tout, et le bandeau dit « 6 des 17 » dès qu'une autre est posée.
     *
     * Une file dont les partitions sont **disjointes** n'a pas de tout : « à faire », « à
     * suivre » et « historique » (03.3) ne se recouvrent pas, et le bandeau y écrivait
     * « 1 des 0 » — un rapport entre deux ensembles qui n'en ont aucun.
     */
    disjointFacets?: boolean;

    /**
     * Arrivée pré-filtrée depuis un autre écran. Le produit applique aujourd'hui le
     * filtre **sans le dire** : on arrive sur deux rangées là où le parc en compte
     * quatorze. Trois choses le disent ici — le jeton retirable, la provenance en
     * toutes lettres, et un geste de sortie qui **nomme sa destination** (« Voir les
     * 14 équipements »), jamais « effacer les filtres ».
     */
    origin?: {
        token: string;
        /**
         * La provenance en toutes lettres. **04.1 ne la dessine pas** : sa colonne
         * « arrivée pré-filtrée » ne porte ni bandeau ni jeton — le filtre se dit par
         * la pastille de l'entonnoir, par la ligne du décompte qui le nomme (« 2 actifs
         * · en réparation »), et par la sortie en pied de liste. Omettre `from` retire
         * le bandeau et ne garde que cette sortie.
         */
        from?: React.ReactNode;
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

    /**
     * Le décompte de la ligne `.ord`. Forme ordinaire : « **14** actifs · tous les
     * états » — le nombre en tête. Forme de 03.3 (17.8, colonne « un filtre posé ») :
     * `regard` nomme ce qu'on regarde à gauche (« **À faire** · les plus anciennes »),
     * et le nombre passe **à droite**, relatif quand `de` est donné (« 6 des 17 »).
     */
    count?: { total: number; shown?: number; noun: string; regard?: React.ReactNode; de?: number };
    sort?: { label: string; onClick: () => void };
    /**
     * **Cartes ou tableau** — la coexistence arbitrée par la recherche bureau du 08/09,
     * son sélecteur posé « à côté du tri », donc dans le cinquième slot de 17.8. Absent :
     * la liste n'a qu'une forme, et il n'y a rien à choisir.
     */
    view?: { value: 'cartes' | 'tableau'; onChange: (value: 'cartes' | 'tableau') => void };
    /**
     * **La mesure du corps** — §2.43 borne la lecture à 960, et déclare l'exception du
     * tableau qu'on vient comparer, qui prend toute la largeur.
     *
     * Une liste à deux formes la déduit de son sélecteur ; une liste qui n'en a qu'une
     * et qui est déjà un tableau au bureau — le journal de 18.1 — la déclare ici.
     *
     * **`cartes` : le corps apporte ses propres surfaces.** Le gabarit pose d'ordinaire
     * *une* carte de rangées autour des enfants (04.1, 05.1). Une page dont le corps est
     * déjà fait de cartes — les groupes à filets de 11.1, les jours de 18.1 — s'y
     * retrouvait **dans une carte dans une carte**, ses rangées rentrées de 16 de plus
     * que celles des autres listes. Elle déclare `cartes` : la mesure de lecture reste,
     * la carte du gabarit tombe, et les enfants s'espacent de 16 comme `.page` le fait.
     */
    body?: 'lecture' | 'tableau' | 'cartes';
    /**
     * **Le second niveau, à droite** — patron « deux niveaux » de 17.11 : *« le sujet ou
     * la file à gauche (7 ou 8/12), ce que le téléphone ouvrait en second écran à droite
     * (5 ou 4/12) »*. Le téléphone empile les niveaux, un par écran ; le bureau les pose
     * côte à côte, et cliquer une rangée **sélectionne** au lieu de naviguer.
     *
     * Il n'apparaît qu'à partir de **1280**. En deçà, le second niveau reste ce qu'il est
     * au téléphone. Absent : la page n'a qu'un niveau.
     */
    panel?: React.ReactNode;
    /** La part du second niveau — 5 douzièmes par défaut, 4 quand la liste porte un tableau (16.1). */
    panelRatio?: 4 | 5;

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

    /**
     * Le héro de la page, **au-dessus des rangées et sous le bloc fixe** — 09.1, 10.1,
     * 15.1 et 16.1 l'écrivent à l'identique : surtitre, gros chiffre, tuiles. Il défile
     * avec le contenu, contrairement à l'en-tête, et il survit à la liste vide : ce
     * qu'il annonce ne dépend pas du filtre posé.
     */
    hero?: React.ReactNode;
    /**
     * `.fnote` — la note de pied de liste : ce que la rangée suivante fera. Elle n'est
     * ni un compte ni un état vide ; elle explique le geste, à gauche, en 14 sur 20.
     */
    note?: React.ReactNode;

    loading?: boolean;
    /**
     * **La forme du squelette suit celle de la liste qu'il annonce** — A2 de 17.3 :
     * *« même hauteur de rangée, même vignette, même nombre de lignes »*. Une liste
     * d'objets a des rangées de 68 à vignette carrée ; une **file** en a de 56 à
     * marque ronde (03.3). Le gabarit posait la première forme sur les deux, si bien
     * que Tâches, Historique et Inventaire sautaient de douze pixels par rangée à
     * l'arrivée de la donnée — ce que le squelette est précisément là pour éviter.
     */
    skeleton?: 'liste' | 'file';
    /** Ce que l'écran montre quand il n'y a rien — un `ScreenState` (17.1). */
    empty?: React.ReactNode;
    /** Le pied de liste : ce que la liste compte, ou ce qu'elle attend. */
    footer?: React.ReactNode;
    /**
     * **Le geste d'ajout de la page — une déclaration, deux placements.**
     *
     * 17.6 le fait flotter au téléphone, au-dessus de la barre du bas. 17.11 dit qu'au
     * bureau **rien ne flotte** — « rien ne flotte sauf ce qui flotte » : un dialogue,
     * un menu, une infobulle — et le range dans l'en-tête, à droite du compte, en
     * bouton jaune de 40. Le geste est le même ; c'est sa place qui change avec le
     * régime, et la page n'a donc pas à le déclarer deux fois.
     */
    pageAction?: {
        /** Le mot du bouton au bureau — « Ajouter », que le titre complète déjà. */
        label: string;
        onClick: () => void;
        /**
         * Le nom du geste en entier — « Ajouter un équipement ». Il vocalise le bouton
         * rond du téléphone, qui n'a que son glyphe à montrer.
         */
        description?: string;
        /** Le glyphe du geste — le plus, sauf mention contraire. */
        glyph?: PhosphorGlyph;
    };
    /**
     * Le bouton flottant écrit à la main — la forme d'avant `pageAction`, gardée pour
     * les écrans que le bureau n'a pas encore reçus (11.1, 09.1).
     */
    fab?: React.ReactNode;
    /** Les rangées. */
    children?: React.ReactNode;
    /** Nombre de rangées métier : les panneaux et modales ne doivent pas masquer un état vide. */
    hasRows?: boolean;
    className?: string;
}

/**
 * La mesure de lecture du système : 960 px, une seule valeur (§2.43).
 *
 * **Elle ne s'applique pas à une colonne** : en deux niveaux, la liste occupe déjà 7 ou
 * 8 douzièmes du corps, et la borner une seconde fois laisserait un vide entre elle et le
 * panneau dès que la fenêtre dépasse 1 700 px.
 */
const Reading: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => <div className={cn('large:max-w-none w-full max-w-[960px]', className)}>{children}</div>;

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
    disjointFacets = false,
    origin,
    count,
    sort,
    view,
    body = 'lecture',
    panel,
    panelRatio = 5,
    selection,
    hero,
    note,
    loading = false,
    skeleton = 'liste',
    empty,
    footer,
    pageAction,
    fab,
    children,
    hasRows: hasRowsOverride,
    className,
}) => {
    const isCompact = useMediaQuery(MEDIA.compact);
    /* 1280 — le seuil des neuf écrans de bureau : 1280 moins les 240 de la barre
       latérale laissent 1 016 px, dont 4 douzièmes font encore 330 px de panneau. */
    const largeurDeuxNiveaux = useMediaQuery(MEDIA.twoColumn);

    /* La coque doit savoir qu'on est en sélection : c'est elle qui porte la barre du
       bas, à qui le pied d'actes prend la place (17.2). */
    useDeclareSelectionRegime(Boolean(selection?.active));
    /*
     * **Le squelette se déclenche à l'hydratation, pas sur demande de la page.**
     * 17.3 pose trois formes pour vingt-huit écrans ; elles étaient définies et
     * **aucun écran ne les montrait**, parce que chaque page aurait dû penser à
     * passer `loading`, et aucune ne le faisait. L'attente est un fait de la couche
     * de données : le gabarit la lit lui-même. A5 tient toujours — `useDelayedPending`
     * ne montre rien avant 300 ms.
     */
    const { derniereLecture, isHydrating } = useData();
    const showSkeleton = useDelayedPending(loading || isHydrating);
    const enLigne = useOnlineStatus();
    const horsLigne = !enLigne;
    const hasRows = hasRowsOverride ?? React.Children.count(children) > 0;

    /** Le bandeau ne s'affiche que si une facette autre que la partition est posée. */
    const activeFilterNotice = useMemo(() => {
        if (disjointFacets) return null;
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
    }, [disjointFacets, facets, activeFacetId, onFacetSelect]);

    /*
     * La bande de recherche : **dans l'en-tête au téléphone**, bande de page au rail.
     * Elle était un bloc à part avec son propre filet ; la passe sobre la replie dans
     * le même bloc que le titre (`.top` des planches 05.1, 03.3, 10.1).
     */
    /**
     * `.ord` — **le cinquième slot de 17.8** : ce qu'on regarde à gauche, combien à
     * droite, en **12 sur 16**. Deux corrections de la passe du 06/09.
     *
     * Elle vivait **dans le contenu**, donc elle défilait : *« un filtre posé dans la
     * page disparaît au premier défilement, et la liste devient un sous-ensemble sans
     * étiquette »*. Elle appartient au bloc fixe, avec la recherche et l'entonnoir.
     *
     * Et elle tenait 14 sur 20 avec un bouton de tri habillé de 44 : la planche déclare
     * 12 sur 16 pour toute la ligne, le tri compris. C'est une ligne de service, pas un
     * geste de page.
     */
    /**
     * `.cnt2` — **le second fait de l'en-tête du bureau** (17.11) : « 11 personnes ·
     * tous les rôles », en 13 sur 16, encre secondaire, à côté du titre.
     *
     * Au téléphone ce compte vit dans la ligne de service (`.ord`), sous la recherche,
     * avec le tri à sa droite. Au bureau **cette ligne n'existe plus** : le tri et le
     * sélecteur de forme montent dans la ligne d'outils, et ce qui restait — le compte —
     * remonte à côté du titre, là où l'œil arrive.
     */
    const ligneDeCompte = useMemo(() => {
        const morceaux: string[] = [];
        if (count) {
            morceaux.push(`${count.total} ${count.noun}`);
            if (typeof count.shown === 'number' && count.shown !== count.total)
                morceaux.push(`${count.shown} affichés`);
        }
        if (subtitle) morceaux.push(subtitle);
        return morceaux.length > 0 ? morceaux.join(' · ') : undefined;
    }, [count, subtitle]);

    /* Au téléphone, `pageAction` reprend la forme de 17.6 : l'ancrage du conteneur, le
       bouton rond, le seul jaune du contenu. */
    const gesteFlottant =
        pageAction && !selection?.active ? (
            <FabContainer description={pageAction.description ?? pageAction.label}>
                <FloatingActionButton
                    icon="add"
                    size="medium"
                    variant="primary"
                    className="bg-primary text-on-primary"
                    aria-label={pageAction.description ?? pageAction.label}
                    onClick={pageAction.onClick}
                />
            </FabContainer>
        ) : null;

    const orderRow =
        count && !selection?.active ? (
            <div className="text-on-surface-variant flex items-center justify-between gap-3 px-1 text-[12px] leading-4">
                {count.regard ? (
                    <span className="min-w-0 truncate">{count.regard}</span>
                ) : (
                    <span className="min-w-0 truncate">
                        <b className="text-on-surface font-medium tabular-nums">{count.total}</b>{' '}
                        {count.noun}
                        {typeof count.shown === 'number' && count.shown !== count.total && (
                            <> · {count.shown} affichés</>
                        )}
                    </span>
                )}
                <span className="flex shrink-0 items-center gap-3">
                    {count.regard && (
                        <span className="tabular-nums">
                            {typeof count.de === 'number' && count.de !== count.total
                                ? `${count.total} des ${count.de}`
                                : count.total}
                        </span>
                    )}
                    {sort && (
                        <button
                            type="button"
                            onClick={sort.onClick}
                            className="text-on-surface flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[12px] leading-4 font-medium"
                        >
                            <Icon glyph={SortAscending} size={18} className="text-text-muted" />
                            {sort.label}
                        </button>
                    )}
                    {/*
                      **Le sélecteur de forme**, à droite du tri. Deux glyphes dans un
                      creux, pas deux mots : la ligne est une ligne de service en 12, et
                      « Cartes / Tableau » y prendrait plus de place que le compte
                      lui-même. Chaque cran dit son nom à qui ne voit pas les glyphes, et
                      porte `aria-pressed` — c'est un état, pas une destination.
                    */}
                    {view && (
                        <span className="bg-surface-container flex shrink-0 items-center rounded-[4px] p-0.5">
                            {[
                                { id: 'cartes' as const, glyph: Rows, mot: 'Cartes' },
                                { id: 'tableau' as const, glyph: Table, mot: 'Tableau' },
                            ].map((cran) => (
                                <button
                                    key={cran.id}
                                    type="button"
                                    onClick={() => view.onChange(cran.id)}
                                    aria-pressed={view.value === cran.id}
                                    aria-label={cran.mot}
                                    title={cran.mot}
                                    className={cn(
                                        'flex h-7 w-7 cursor-pointer items-center justify-center rounded-[3px] border-0 bg-transparent',
                                        view.value === cran.id
                                            ? 'bg-surface text-on-surface shadow-[0_1px_2px_rgba(10,25,29,0.10)]'
                                            : 'text-text-muted hover:text-on-surface',
                                    )}
                                >
                                    <Icon glyph={cran.glyph} size={18} />
                                </button>
                            ))}
                        </span>
                    )}
                </span>
            </div>
        ) : null;

    const hasSeekBand =
        Boolean(search || filter || (facets && facets.length > 0)) && !selection?.active;

    /*
      **Le tableau balaye, il ne se lit pas.** §2.43 borne le contenu à 960 — « une liste
      étirée sur 1600 px n'est pas plus lisible » — et **déclare l'exception** : « un
      tableau que l'on vient comparer prend toute la largeur ; ce n'est pas de la
      lecture, c'est du balayage ». C'est exactement le tableau dense de 17.11, dont
      l'en-tête et la première colonne sont figés pour qu'on puisse aller au bout d'une
      rangée sans perdre son sujet.

      Il ne prend pas non plus la carte de rangées : `DataTable` porte déjà son cadre —
      fond, filet, rayon, défilement. Posé dedans, il faisait une carte dans une carte,
      avec 16 px d'intérieur entre les deux.
    */
    const enTableauLarge = !isCompact && (view?.value === 'tableau' || body === 'tableau');

    /* En sélection groupée, le panneau se retire : la page ne traite plus un sujet, elle
       en désigne plusieurs (17.2). */
    const deuxNiveaux = largeurDeuxNiveaux && Boolean(panel) && !selection?.active;

    /* La ligne d'outils du bureau porte quatre sortes d'objets ; sans aucun, elle
       n'existe pas — un écran sans recherche ni tri n'a pas de bande vide sous son
       titre. */
    const hasDeskTools =
        Boolean(search || filter || (facets && facets.length > 0) || sort || view) &&
        !selection?.active;

    const seekBand = (
        <div className={cn('flex flex-col gap-2.5', !isCompact && 'px-page pt-4')}>
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
                <Reading
                    className={cn(
                        'overflow-hidden',
                        !search && filter ? 'flex items-center gap-2' : undefined,
                    )}
                >
                    {/* À 393 px les puces défilent ; dès 600 elles tiennent toutes,
                                et un filtre qu'on ne voit pas se choisit à l'aveugle. */}
                    {!search && filter && <span className="shrink-0">{filter}</span>}
                    <div
                        className={cn(
                            'flex [scrollbar-width:none] gap-2 overflow-x-auto',
                            !search && filter && 'min-w-0 flex-1',
                            isCompact ? 'pr-1' : 'flex-wrap',
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
    );

    return (
        <div className={cn('relative flex min-h-0 w-full min-w-0 flex-1 flex-col', className)}>
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
                /*
                 * Passe sobre — **le titre et la recherche sont un seul bloc**, avec un
                 * seul filet dessous (`.top` des planches 05.1, 03.3 et 10.1 : fond
                 * surface, 8/16/16 d'intérieur, gouttière 12). Deux bandes empilées, deux
                 * filets, faisaient deux fois l'en-tête.
                 *
                 * Le titre prend la première marche de R15 — **28 px** Archivo 600 sur 32,
                 * et non 20 : c'est `--t1`, la marche que trois planches réclament et que
                 * le gabarit rendait inatteignable depuis la page.
                 */
                <div
                    className={cn(
                        'border-outline-variant bg-surface flex flex-col border-b px-4',
                        /* Avec sa bande : `.top` des planches — 8 en haut, gouttière
                           12, 16 en bas. Sans elle : `.tbar.plain`, une barre de **56
                           tout compris** (04.1 colonne 3, 17.8 colonne 4). Les 8 px
                           qu'on ajoutait faisaient un en-tête de 64 sur un écran qui
                           n'a qu'un titre à porter. */
                        /* `.top` de 17.8 (passe du 06/09) : **8 en haut, 12 en bas**,
                           12 entre les trois lignes. Le pied valait 16, ce qui creusait
                           l'écart entre la ligne de tri et la première rangée. */
                        /* **La ligne de compte suffit à faire un `.top`.** La condition ne
                           regardait que la bande de recherche : le second niveau de 16.1 —
                           un site ouvert, qui ne se cherche pas — retombait sur la barre
                           nue, et sa ligne de compte se collait au filet, sans les 12 que
                           la planche déclare. La barre de 56 tout compris reste pour ce
                           qu'elle vise : un titre, et rien dessous. */
                        hasSeekBand || orderRow ? 'gap-3 pt-2 pb-3' : '',
                    )}
                >
                    {/* `.tt` — la rangée du titre se règle sur son geste : **48**, la
                        mesure du bouton d'icône. Elle tenait 56 et le titre portait 12 px
                        de padding vertical, si bien que le bloc gagnait 8 px que la
                        planche ne déclare pas. */}
                    <div className="flex min-h-12 items-center justify-between gap-1">
                        {onBack && (
                            <button
                                type="button"
                                aria-label="Retour"
                                onClick={onBack}
                                className="text-on-surface hover:bg-surface-container -ml-3 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
                            >
                                <Icon glyph={ArrowLeft} size={24} />
                            </button>
                        )}
                        <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {title}
                        </h1>
                        {actions}
                    </div>
                    {hasSeekBand && seekBand}
                    {orderRow}
                </div>
            ) : (
                /*
                  **L'en-tête « Liste » du bureau — `.dhead` puis `.tools` de 17.11.**
                  Quatre écrans le partagent : 04.1, 05.1, 18.1 et 03.3.
                  La barre ne redit pas la destination — le rail la porte déjà (00.4) —,
                  et elle ne porte pas de filet : *« pas de filet au bord de la barre
                  latérale »*, ni sous l'en-tête.

                  Il tenait le titre à **20** et empilait dessous la bande de recherche
                  du téléphone puis la ligne de service : trois bandes pour dire ce que
                  la planche dit en deux. 17.11 les rassemble — le titre à **28 sur 32**
                  avec son compte à côté, puis **une seule ligne d'outils** : la
                  recherche à 320, les pastilles, le tri et le sélecteur de forme à
                  droite.
                */
                /* Dans le chrome du bureau, un geste d'icône fait 40 (17.11). */
                <IconGestureSizeContext.Provider value={40}>
                    <div className="px-page flex flex-col gap-2 pt-5">
                        <div className="flex min-h-[52px] items-center gap-4">
                            <h1 className="font-brand text-on-surface shrink-0 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                                {title}
                            </h1>
                            {/* Le compte s'aligne sur la **première ligne** du titre, pas sur
                                son milieu : 6 px de retrait, comme `.cnt2` de la planche. */}
                            <span className="text-text-muted min-w-0 flex-1 truncate pt-1.5 text-[13px] leading-4 tabular-nums">
                                {ligneDeCompte}
                            </span>
                            {actions}
                            {/* Le geste d'ajout passé par `fab` monte ici au bureau : il n'y
                                flotte pas (17.11). */}
                            {!horsLigne && fab && (
                                <AddGesturePlacementContext.Provider value="header">
                                    {fab}
                                </AddGesturePlacementContext.Provider>
                            )}
                            {/* `.hbtn` — 40 de haut, rayon 4, `0 12 0 10`, gouttière 8, 14
                                en graisse d'appui. Sans ombre : au bureau, un bouton posé
                                dans l'en-tête ne se détache pas du papier, il en fait
                                partie. */}
                            {pageAction && (
                                <Button
                                    variant="filled"
                                    onClick={pageAction.onClick}
                                    /* `min-h-10` et pas seulement `h-10` : la taille `md`
                                       de `Button` pose `min-h-12`, et une hauteur fixe ne
                                       bat pas un minimum — le bouton restait à 48. */
                                    className="h-10 min-h-10 shrink-0 gap-2 rounded-md pr-3 pl-2.5 text-[14px] font-medium shadow-none"
                                >
                                    <Icon glyph={pageAction.glyph ?? Plus} size={20} />
                                    {pageAction.label}
                                </Button>
                            )}
                        </div>

                        {hasDeskTools && (
                            /* Elle se replie plutôt qu'elle ne déborde : au rail (600–839) il
                               reste 680 px, et le champ, l'entonnoir, les pastilles, le tri
                               et le sélecteur n'y tiennent pas d'une seule ligne. */
                            <div className="flex flex-wrap items-center gap-3 pb-1">
                                {search && (
                                    <SearchField
                                        dense
                                        value={search.value}
                                        onChange={search.onChange}
                                        placeholder={search.placeholder}
                                        className="w-[320px] max-w-full"
                                    />
                                )}
                                {filter}
                                {facets && facets.length > 0 && (
                                    <div className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-2 overflow-x-auto">
                                        {facets.map((facet) => (
                                            <FacetChip
                                                key={facet.id}
                                                dense
                                                label={facet.label}
                                                count={facet.count}
                                                icon={facet.icon}
                                                tone={facet.tone}
                                                selected={facet.id === activeFacetId}
                                                onClick={() => onFacetSelect?.(facet.id)}
                                                onClear={
                                                    facet.id === activeFacetId
                                                        ? onActiveFacetClear
                                                        : undefined
                                                }
                                                clearLabel={activeFacetClearLabel}
                                            />
                                        ))}
                                    </div>
                                )}
                                {/* `.sort` et `.seg` — poussés à droite ensemble : ce sont les
                                    deux réglages de la vue, quand ce qui précède la filtre. */}
                                {(sort || view) && (
                                    <span className="ml-auto flex shrink-0 items-center gap-3">
                                        {sort && (
                                            <button
                                                type="button"
                                                onClick={sort.onClick}
                                                className="text-on-surface flex min-h-10 cursor-pointer items-center gap-1 border-0 bg-transparent text-[13px] leading-[18px] font-medium"
                                            >
                                                <Icon
                                                    glyph={SortAscending}
                                                    size={18}
                                                    className="text-text-muted"
                                                />
                                                {sort.label}
                                            </button>
                                        )}
                                        {view && (
                                            /* `.seg` — deux crans de 40 sur 38 dans un cerné
                                               de rayon 4, le cran retenu en `--inset-2`. Au
                                               téléphone le même sélecteur vit dans la ligne
                                               de service, en creux et sans filet : ici il
                                               s'aligne sur les autres objets de la ligne. */
                                            <span className="border-outline-variant bg-surface flex shrink-0 items-center overflow-hidden rounded-md border">
                                                {[
                                                    {
                                                        id: 'cartes' as const,
                                                        glyph: Rows,
                                                        mot: 'Cartes',
                                                    },
                                                    {
                                                        id: 'tableau' as const,
                                                        glyph: Table,
                                                        mot: 'Tableau',
                                                    },
                                                ].map((cran) => (
                                                    <button
                                                        key={cran.id}
                                                        type="button"
                                                        onClick={() => view.onChange(cran.id)}
                                                        aria-pressed={view.value === cran.id}
                                                        aria-label={cran.mot}
                                                        className={cn(
                                                            'flex h-[38px] w-10 cursor-pointer items-center justify-center border-0 bg-transparent',
                                                            view.value === cran.id
                                                                ? 'bg-surface-muted-strong text-on-surface'
                                                                : 'text-text-muted hover:text-on-surface',
                                                        )}
                                                    >
                                                        <Icon glyph={cran.glyph} size={20} />
                                                    </button>
                                                ))}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </IconGestureSizeContext.Provider>
            )}

            {/* **96 px de pied quand un bouton flottant est posé** (`.phone:has(.fab) .page`),
                sans quoi le bouton recouvre la dernière rangée de la liste. */}
            {/* `.page` — cinq planches de la passe sobre l'écrivent à l'identique :
                gouttière 16, intérieur `16 / 16 / 24`. À deux niveaux, **la bande de tête
                couvre les deux zones** : 16.1 la pose au-dessus de `.zones`, pas dans la
                colonne de la liste, où ses cinq chiffres se partageaient 8/12 de la page et
                où la légende passait à la ligne (relevé du 17/09). */}
            <div
                className={cn(
                    'medium:px-page flex flex-1 flex-col gap-4 px-4 pt-4',
                    isCompact && (fab || gesteFlottant) && !selection?.active ? 'pb-24' : 'pb-6',
                )}
            >
                {deuxNiveaux && hero && <Reading>{hero}</Reading>}

                <div
                    className={cn(
                        'flex min-w-0 flex-1',
                        deuxNiveaux ? 'items-start gap-4' : 'flex-col gap-4',
                    )}
                >
                    <div
                        className={cn(
                            'flex min-w-0 flex-col gap-4',
                            deuxNiveaux ? 'shrink grow-[8] basis-0' : 'flex-1',
                            deuxNiveaux && panelRatio === 5 && 'grow-[7]',
                        )}
                    >
                        {!deuxNiveaux && hero && <Reading>{hero}</Reading>}

                        {origin && origin.from && (
                            <Reading>
                                <div className="text-body-small text-text-secondary flex flex-wrap items-center gap-2">
                                    {origin.displayToken !== false && (
                                        <span className="bg-surface-container text-on-surface flex min-h-8 items-center gap-2 rounded-md px-3">
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
                                        <Icon
                                            glyph={ArrowBendDownLeft}
                                            size={18}
                                            className="text-text-secondary shrink-0"
                                        />
                                    )}
                                    <span className="min-w-0">{origin.from}</span>
                                    {origin.inlineClearLabel && (
                                        <button
                                            type="button"
                                            onClick={origin.onClear}
                                            className="text-on-surface hover:text-text-secondary shrink-0 cursor-pointer text-[12px] font-medium underline underline-offset-4"
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
                                <div className="bg-surface-muted-strong text-body-medium rounded-vignette text-on-surface-variant flex items-center gap-2.5 px-3.5 py-[11px] leading-[18px]">
                                    <Icon
                                        glyph={Funnel}
                                        size={18}
                                        className="text-on-surface-variant shrink-0"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <b className="text-on-surface font-medium tabular-nums">
                                            {activeFilterNotice.shown} des{' '}
                                            {activeFilterNotice.total}
                                        </b>{' '}
                                        — {activeFilterNotice.label.toLowerCase()}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={activeFilterNotice.onClear}
                                        className="text-on-surface text-body-small shrink-0 cursor-pointer font-medium underline underline-offset-[3px]"
                                    >
                                        Tout voir
                                    </button>
                                </div>
                            </Reading>
                        )}

                        {showSkeleton ? (
                            <Reading>
                                <div className="bg-surface rounded-xl px-4">
                                    {skeleton === 'file' ? (
                                        <SkeletonQueue rows={5} />
                                    ) : (
                                        <SkeletonList />
                                    )}
                                </div>
                            </Reading>
                        ) : hasRows ? (
                            enTableauLarge ? (
                                <>
                                    {children}
                                    {footer && (
                                        <p className="text-text-muted mt-1.5 text-center text-[12px] tabular-nums">
                                            {footer}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div
                                    className={cn(
                                        'w-full',
                                        !deuxNiveaux && 'large:max-w-none max-w-[960px]',
                                    )}
                                >
                                    {body === 'cartes' ? (
                                        <div className="flex flex-col gap-4">{children}</div>
                                    ) : (
                                        <section className="bg-surface rounded-xl px-4">
                                            {children}
                                        </section>
                                    )}
                                    {footer && (
                                        <p className="text-text-muted mt-1.5 text-center text-[12px] tabular-nums">
                                            {footer}
                                        </p>
                                    )}
                                </div>
                            )
                        ) : (
                            !loading &&
                            /* 17.1, règle 2 : hors ligne, l'état se dit **dans la forme de
                           l'état vide** — et jamais en bandeau. Quand il n'y a rien à
                           lire, c'est la coupure qu'il faut nommer, pas l'absence de
                           donnée : « aucun équipement » serait faux. */
                            (horsLigne ? (
                                <OfflineState depuis={derniereLecture} />
                            ) : (
                                <>
                                    {empty}
                                    {children}
                                </>
                            ))
                        )}

                        {note && <Reading>{note}</Reading>}

                        {origin && origin.showClearAction !== false && (
                            <Reading>
                                {origin.clearPresentation === 'more' ? (
                                    <Button
                                        variant="text"
                                        icon={<Icon glyph={List} size={18} />}
                                        onClick={origin.onClear}
                                        className="border-outline-variant text-on-surface w-full justify-center rounded-none border-t px-0"
                                    >
                                        {origin.clearLabel}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="tonal"
                                        onClick={origin.onClear}
                                        className="w-full"
                                    >
                                        {origin.clearLabel}
                                    </Button>
                                )}
                            </Reading>
                        )}
                    </div>

                    {/* Le second niveau — il ne défile pas avec la liste, c'est elle qui
                        défile sous lui. */}
                    {deuxNiveaux && (
                        <aside
                            className={cn(
                                'sticky top-4 min-w-0 shrink basis-0',
                                panelRatio === 4 ? 'grow-[4]' : 'grow-[5]',
                            )}
                        >
                            {panel}
                        </aside>
                    )}
                </div>
            </div>

            {selection?.active ? (
                <BulkActionBar count={selection.count} overflow={selection.bulkOverflow}>
                    {selection.actions}
                </BulkActionBar>
            ) : (
                /* *« Les gestes qui écrivent disparaissent — pas grisés, absents. »*
                   Un bouton barré demande de comprendre pourquoi ; l'absence ne
                   demande rien (17.1, règle 2 ; interdit n°8). */
                !horsLigne && isCompact && (fab ?? gesteFlottant)
            )}
        </div>
    );
};

export default ListTemplate;
