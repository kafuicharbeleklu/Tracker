import React, { useMemo } from 'react';
import {
    CaretDown,
    ArrowBendDownLeft,
    Checks,
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
import Menu, { type MenuItem } from '../ui/Menu';
import SearchField from '../ui/SearchField';
import FacetChip from '../ui/FacetChip';
import { FabContainer } from '../ui/FabContainer';
import FloatingActionButton from '../ui/FloatingActionButton';
import { SkeletonList, SkeletonQueue, SkeletonTableau } from '../ui/Skeleton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOptionalData } from '../../context/DataContext';
import { OfflineState } from '../ui/ScreenState';
import SelectionTopBar from '../ui/SelectionTopBar';
import SelectionBarBureau from '../ui/SelectionBarBureau';
import CardEmptyState from '../ui/CardEmptyState';
import { useDeclareSelectionRegime } from '../../context/SelectionRegimeContext';
import BulkActionBar from '../ui/BulkActionBar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDelayedPending } from '../../hooks/useDelayedPending';
import { MEDIA } from '../../constants/breakpoints';
import { IconGestureSizeContext } from '../../hooks/useIconGestureSize';
import { AddGesturePlacementContext } from '../../hooks/useAddGesturePlacement';
import { useEchap } from '../../hooks/useEchap';
import { useEntree } from '../../hooks/useEntree';
import { cn } from '../../lib/utils';
/* Le régime du bureau : la fenêtre, les étages qui rétrécissent, le corps qui défile. */
import { CADRE_BUREAU, CORPS_BUREAU, DOUZIEMES, PAGE_BUREAU } from '../../lib/regimeBureau';
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
    /**
     * **Ce qui suit le titre au bureau, à la place de la ligne de compte** (26/09) — les
     * onglets segmentés de Tâches (« À faire 8 · À suivre 9 · Historique »). Le téléphone
     * garde sa ligne de compte.
     */
    titreAnnexe?: React.ReactNode;
    /**
     * **La ligne d'outils du bureau, posée par la page** (26/09) — quand elle suit sa propre
     * maquette (Tâches : un champ de 300, trois puces de ce qui presse, l'ordre à droite).
     * Elle remplace la ligne composée à partir de `search`, `facets`, `filter` et `sort`,
     * qui restent ceux du téléphone.
     */
    outilsBureau?: React.ReactNode;
    /** Le second fait de l'en-tête — « 14 au parc ». Jamais une redite du titre. */
    subtitle?: string;
    onBack?: () => void;
    /** Le libellé de la flèche, quand « Retour » ne dit pas où l'on va. */
    backLabel?: string;
    /** Gestes de l'en-tête : scanner, filtrer, ajouter. Deux au plus au téléphone. */
    actions?: React.ReactNode;

    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
        /**
         * **Un champ de 280 au bureau** (26/09) — pour une ligne d'outils chargée : celle de
         * Tâches porte trois partitions, la nature, deux filtres rapides et l'ordre.
         */
        etroit?: boolean;
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
     * `unite` le nomme à droite quand la planche l'écrit — 18.1 : « 312 faits », « 0 fait ».
     */
    count?: {
        total: number;
        shown?: number;
        noun: string;
        regard?: React.ReactNode;
        de?: number;
        unite?: string;
    };
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
     * Il n'apparaît qu'à partir de **1 000** (`MEDIA.twoColumn`, 1 280 avant le 25/09). En
     * deçà, le second niveau reste ce qu'il est au téléphone. Absent : la page n'a qu'un
     * niveau.
     */
    panel?: React.ReactNode;
    /** La part du second niveau — 5 douzièmes par défaut, 4 quand la liste porte un tableau (16.1). */
    panelRatio?: 4 | 5;
    /**
     * Des classes pour la rangée des deux zones — la hauteur minimale qu'un panneau demande
     * pour montrer une part utile. En deçà, la page défile au lieu d'écraser le panneau.
     */
    zonesClassName?: string;
    /**
     * **La liste et la fiche** (P2a, 25/09) — le patron liste-détail de Material et d'Apple :
     * dès **840**, la liste fixe de **360 px** à gauche, la fiche dans tout le reste. Il
     * remplace les douzièmes pour les listes d'objets (Actifs, Équipe, Historique, Tâches
     * sur tablette) : une liste se parcourt à largeur de rangée, c'est la fiche qui lit.
     */
    listeEtFiche?: boolean;
    /**
     * **Une file à 400** (26/09) — la liste de Tâches passe de 360 à 400 dès 1 200 : sa
     * rangée porte la nature écrite et l'urgence, et le panneau de décision prend le reste.
     */
    listeLarge?: boolean;

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
    /**
     * Ce que la liste montre quand il n'y a rien — un `CardEmptyState`, que le gabarit
     * pose dans la carte des rangées (25/09). Il ne redouble pas le geste d'ajout de la
     * page : au plus une sortie de filtre, qui nomme sa destination.
     */
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
        /**
         * **Les chemins du geste, au bureau.** Au téléphone, le bouton rond ouvre la feuille
         * de la page (17.7) ; au bureau, 17.11 et 15.3 posent les mêmes chemins **en menu
         * ancré**, sous un bouton qui porte un chevron — « Ajouter ⌄ ». Sans eux, le bouton
         * d'en-tête ouvre la feuille, centrée en dialogue.
         */
        paths?: MenuItem[];
        /** La légende du menu (`.menu .cap`) — « Nouvel équipement ». */
        pathsTitle?: string;
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
    titreAnnexe,
    outilsBureau,
    subtitle,
    onBack,
    backLabel = 'Retour',
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
    listeEtFiche = false,
    listeLarge = false,
    panelRatio = 5,
    zonesClassName,
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
    /* 1 000 — le seuil des écrans à deux niveaux (25/09) : sur tablette la barre latérale est
       un rail (80), et 1 000 − 80 laissent 920 px, ce que Material demande à deux volets ;
       l'iPad de 1 024 en paysage y entre. */
    const largeurDeuxNiveaux = useMediaQuery(MEDIA.twoColumn);
    const largeurListeEtFiche = useMediaQuery(MEDIA.expandedUp);

    /* La coque doit savoir qu'on est en sélection : c'est elle qui porte la barre du
       bas, à qui le pied d'actes prend la place (17.2). */
    useDeclareSelectionRegime(Boolean(selection?.active));
    /* Échap quitte la sélection groupée (P3) — le geste de la croix de la barre de sélection. */
    /* La page s'assemble à son arrivée (26/09) : ses rangées entrent en cascade. */
    const entree = useEntree();
    const sortirDeLaSelection = selection?.onExit;
    useEchap(Boolean(selection?.active && sortirDeLaSelection), () => sortirDeLaSelection?.());
    /*
     * **Le squelette se déclenche à l'hydratation, pas sur demande de la page.**
     * 17.3 pose trois formes pour vingt-huit écrans ; elles étaient définies et
     * **aucun écran ne les montrait**, parce que chaque page aurait dû penser à
     * passer `loading`, et aucune ne le faisait. L'attente est un fait de la couche
     * de données : le gabarit la lit lui-même. A5 tient toujours — `useDelayedPending`
     * ne montre rien avant 300 ms.
     */
    /* Hors application (la galerie du design system), ni lecture ni hydratation. */
    const donnees = useOptionalData();
    const derniereLecture = donnees?.derniereLecture;
    const isHydrating = donnees?.isHydrating ?? false;
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

    /**
     * **Au téléphone, le compte rejoint le titre** (arbitrage du commanditaire, 23/09).
     * La ligne de service coûtait **30 px** d'en-tête (18 et sa gouttière de 12) pour y
     * écrire un nombre : l'en-tête d'une liste faisait 159 px avant la première rangée.
     * Elle ne reste que là où elle porte une **phrase** — la file et le journal, qui
     * nomment ce qu'on regarde (`regard`) : « À faire · les plus anciennes d'abord ».
     * Ailleurs, le nombre se lit à droite du titre, comme `.cnt2` au bureau, et le tri —
     * le seul geste de cette ligne — monte dans la bande de recherche.
     */
    /* **Au téléphone, le compte monte à côté du titre — pour toutes les listes** (24/09).
       Les files (Tâches, Historique) y échappaient parce qu'elles passent un `regard`
       (« À faire · les plus anciennes d'abord ») : il redisait la pastille active et le tri,
       tous deux visibles juste au-dessus, et gardait une ligne de 28 px que les autres
       listes ont perdue le 23/09. */
    const compteAuTitre = isCompact && Boolean(count);

    const orderRow =
        count && !selection?.active && !compteAuTitre ? (
            <div className="text-on-surface-variant flex items-center justify-between gap-3 px-1 text-[0.75rem] leading-4">
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
                                : count.unite
                                  ? `${count.total} ${count.unite}`
                                  : count.total}
                        </span>
                    )}
                    {sort && !isCompact && (
                        <button
                            type="button"
                            onClick={sort.onClick}
                            className="text-on-surface flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[0.75rem] leading-4 font-medium"
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
                    {view && !isCompact && (
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
                                        'duration-short3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[3px] border-0 bg-transparent transition-[background-color,color,box-shadow]',
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

    /**
     * `.srch` — la bande de recherche. **Au téléphone elle porte aussi le tri** depuis le
     * 23/09 : c'était le seul geste de la ligne de service, et la ligne est partie. Un
     * bouton d'icône de 48, à gauche de l'entonnoir, qui dit son cran (« Ajout récent »)
     * par son nom accessible et son infobulle.
     */
    const triAuTelephone = isCompact && sort && !selection?.active;

    const hasSeekBand =
        Boolean(search || filter || (facets && facets.length > 0) || triAuTelephone) &&
        !selection?.active;

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

    /* **En sélection groupée, le panneau reste et résume la sélection** (26/09). 17.2 le
       retirait — la page ne traite plus un sujet, elle en désigne plusieurs —, mais au bureau
       la liste sautait alors de 400 à 1 008 px et changeait d'alignement sous le curseur. Le
       panneau garde sa place et dit ce qui est désigné. */
    const deuxNiveaux = (listeEtFiche ? largeurListeEtFiche : largeurDeuxNiveaux) && Boolean(panel);

    /* La ligne d'outils du bureau porte quatre sortes d'objets ; sans aucun, elle
       n'existe pas — un écran sans recherche ni tri n'a pas de bande vide sous son
       titre. */
    const hasDeskTools =
        Boolean(search || filter || (facets && facets.length > 0) || sort || view) &&
        !selection?.active;

    const seekBand = (
        <div className={cn('flex flex-col gap-2.5', !isCompact && 'px-page pt-4')}>
            {(search ||
                triAuTelephone ||
                (filter && !(facets && facets.length > 0 && !search))) && (
                <Reading className="flex items-center gap-2">
                    {search && (
                        <SearchField
                            raccourci
                            value={search.value}
                            onChange={search.onChange}
                            placeholder={search.placeholder}
                            className="flex-1"
                        />
                    )}
                    {triAuTelephone && sort && (
                        <button
                            type="button"
                            onClick={sort.onClick}
                            aria-label={`Trier — ${sort.label}`}
                            title={sort.label}
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high focus-visible:ring-primary flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
                        >
                            <Icon glyph={SortAscending} size={20} />
                        </button>
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
        <div
            className={cn(
                'relative flex min-h-0 w-full min-w-0 flex-1 flex-col',
                entree && 'mvt-cascade',
                PAGE_BUREAU,
                /* **La mesure du bureau** — `.main.read` de 17.11, 1008. Une liste en cartes
                   est une colonne de rangées : étirée sur 1200, le nom d'une rangée et son
                   compte se retrouvent aux deux bouts de l'écran. Le tableau, lui, remplit ce
                   qu'on lui donne (il se balaye), et un corps à deux zones aussi. */
                !deuxNiveaux &&
                    !enTableauLarge &&
                    /* 1008 de **contenu** : le plafond porte sur le gabarit entier, gouttières
                       comprises, sinon la mesure change d'une page à l'autre selon l'endroit
                       où elle est posée. */
                    'large:max-w-[calc(63rem+2*var(--tk-space-page))] large:mx-auto w-full',
                className,
            )}
        >
            {/* **L'en-tête est fixe ; le contenu défile** (17.8) — titre, recherche,
                pastilles, ligne de compte : *« un filtre posé dans la page disparaît au
                premier défilement, et la liste devient un sous-ensemble sans étiquette »*.
                04.1 le redit de la recherche, et 01.1 au bureau de l'en-tête. Il défilait
                avec la page, au téléphone comme au bureau. */}
            <div className="bg-background sticky top-0 z-20">
                {selection?.active && isCompact ? (
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
                                    aria-label={backLabel}
                                    onClick={onBack}
                                    className="text-on-surface hover:bg-surface-container -ml-3 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
                                >
                                    <Icon glyph={ArrowLeft} size={24} />
                                </button>
                            )}
                            <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 shrink font-semibold tracking-[-0.02em]">
                                {title}
                            </h1>
                            {/* `.cnt2` du téléphone — le compte à droite du titre, aligné
                                sur sa première ligne, en 12 sur 16 : c'est la ligne de
                                service en moins (23/09). Il cède avant le titre et se coupe
                                à l'ellipse. */}
                            {compteAuTitre && count ? (
                                <span className="text-text-muted min-w-0 flex-1 truncate pt-1.5 text-[0.75rem] leading-4 tabular-nums">
                                    {count.total}{' '}
                                    {count.regard ? (count.unite ?? count.noun) : count.noun}
                                </span>
                            ) : (
                                <span className="flex-1" />
                            )}
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
                                <div className="flex shrink-0 items-center gap-2">
                                    {/* La flèche au bureau aussi, partout sauf à l'accueil (08/10) :
                                        une destination de la barre latérale n'en avait pas. */}
                                    {onBack && (
                                        <Button
                                            variant="text"
                                            iconOnly
                                            aria-label={backLabel}
                                            onClick={onBack}
                                            className="text-on-surface-variant hover:text-on-surface -ml-2.5 shrink-0"
                                        >
                                            <Icon glyph={ArrowLeft} size={20} />
                                        </Button>
                                    )}
                                    <h1 className="font-brand text-on-surface text-ts-page leading-ts-page shrink-0 font-semibold tracking-[-0.02em]">
                                        {title}
                                    </h1>
                                </div>
                                {titreAnnexe && !selection?.active ? (
                                    <div className="flex min-w-0 flex-1 items-center">
                                        {titreAnnexe}
                                    </div>
                                ) : (
                                    /* Le compte s'aligne sur la **première ligne** du titre, pas sur
                                       son milieu : 6 px de retrait, comme `.cnt2` de la planche. */
                                    <span className="text-text-muted doigt:text-ts-sub doigt:leading-ts-sub min-w-0 flex-1 truncate pt-1.5 text-[0.8125rem] leading-4 tabular-nums">
                                        {ligneDeCompte}
                                    </span>
                                )}
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
                                {pageAction &&
                                    (pageAction.paths && pageAction.paths.length > 1 ? (
                                        <Menu
                                            align="end"
                                            title={pageAction.pathsTitle}
                                            items={pageAction.paths}
                                            trigger={
                                                /* `.hbtn` à chemins — le plus, le mot, **puis le
                                                   chevron de 18** : il dit qu'un choix suit. */
                                                <Button
                                                    variant="filled"
                                                    className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 shrink-0 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium shadow-none"
                                                >
                                                    <Icon
                                                        glyph={pageAction.glyph ?? Plus}
                                                        size={20}
                                                    />
                                                    {pageAction.label}
                                                    <Icon glyph={CaretDown} size={20} />
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <Button
                                            variant="filled"
                                            onClick={pageAction.onClick}
                                            /* `min-h-10` et pas seulement `h-10` : la taille `md`
                                               de `Button` pose `min-h-12`, et une hauteur fixe ne
                                               bat pas un minimum — le bouton restait à 48. */
                                            className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 shrink-0 gap-2 rounded-md pr-3 pl-2.5 text-[0.875rem] font-medium shadow-none"
                                        >
                                            <Icon glyph={pageAction.glyph ?? Plus} size={20} />
                                            {pageAction.label}
                                        </Button>
                                    ))}
                            </div>

                            {selection?.active ? (
                                /* **La sélection au bureau** (26/09) : le titre reste, la
                                   barre prend la place de la ligne d'outils et porte les
                                   gestes. Plus de pied pleine largeur sous la barre latérale. */
                                <div className="pb-1">
                                    <SelectionBarBureau
                                        count={selection.count}
                                        total={selection.total}
                                        onExit={selection.onExit}
                                        onSelectAll={selection.onSelectAll}
                                        onClearAll={selection.onClearAll}
                                        actions={selection.actions}
                                        overflow={selection.bulkOverflow}
                                    />
                                </div>
                            ) : outilsBureau ? (
                                outilsBureau
                            ) : (
                                hasDeskTools && (
                                    /* Elle se replie plutôt qu'elle ne déborde : au rail (600–839) il
                                   reste 680 px, et le champ, l'entonnoir, les pastilles, le tri
                                   et le sélecteur n'y tiennent pas d'une seule ligne. */
                                    <div className="flex flex-wrap items-center gap-3 pb-1">
                                        {search && (
                                            <SearchField
                                                dense
                                                raccourci
                                                value={search.value}
                                                onChange={search.onChange}
                                                placeholder={search.placeholder}
                                                className={cn(
                                                    'max-w-full',
                                                    search.etroit ? 'w-[280px]' : 'w-[320px]',
                                                )}
                                            />
                                        )}
                                        {/* Les pastilles d'abord, **puis** le menu de filtre : 03.3 pose
                                       « À faire · À suivre · Historique » avant « Toutes les natures ⌄ ».
                                       Le menu passait devant. Seule la file porte les deux. */}
                                        {facets && facets.length > 0 && (
                                            /* `.tools .fchip` — des voisines de la ligne, à **12** comme le
                                           reste des outils ; le groupe ne s'étire plus (`flex-1`),
                                           sinon le menu qui suit partait au bout de la ligne. */
                                            <div className="flex min-w-0 [scrollbar-width:none] items-center gap-3 overflow-x-auto">
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
                                        {filter}
                                        {/* `.sort` et `.seg` — poussés à droite ensemble : ce sont les
                                        deux réglages de la vue, quand ce qui précède la filtre. */}
                                        {(sort || view) && (
                                            <span className="ml-auto flex shrink-0 items-center gap-3">
                                                {sort && (
                                                    <button
                                                        type="button"
                                                        onClick={sort.onClick}
                                                        className="text-on-surface doigt:min-h-12 doigt:text-ts-sub doigt:leading-ts-sub flex min-h-10 cursor-pointer items-center gap-1 border-0 bg-transparent text-[0.8125rem] leading-[1.125rem] font-medium"
                                                    >
                                                        <Icon
                                                            glyph={SortAscending}
                                                            size={20}
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
                                                                onClick={() =>
                                                                    view.onChange(cran.id)
                                                                }
                                                                aria-pressed={
                                                                    view.value === cran.id
                                                                }
                                                                aria-label={cran.mot}
                                                                className={cn(
                                                                    'doigt:h-[46px] doigt:w-12 duration-short3 flex h-[38px] w-10 cursor-pointer items-center justify-center border-0 bg-transparent transition-colors',
                                                                    view.value === cran.id
                                                                        ? 'bg-surface-muted-strong text-on-surface'
                                                                        : 'text-text-muted hover:text-on-surface',
                                                                )}
                                                            >
                                                                <Icon
                                                                    glyph={cran.glyph}
                                                                    size={20}
                                                                />
                                                            </button>
                                                        ))}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </IconGestureSizeContext.Provider>
                )}
            </div>

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
                    /* Le corps **se partage la hauteur restante** au lieu de la fabriquer :
                       sans `min-h-0`, un enfant en `flex-1` ne sait pas rétrécir. */
                    CADRE_BUREAU,
                )}
            >
                {deuxNiveaux && hero && <Reading>{hero}</Reading>}

                <div
                    className={cn(
                        'flex min-w-0 flex-1',
                        deuxNiveaux
                            ? /* Les deux zones vont **à même hauteur** : le panneau ne se
                                 cale plus en haut d'une colonne plus longue que lui. */
                              'min-h-0 items-stretch gap-4'
                            : 'flex-col gap-4',
                        CADRE_BUREAU,
                        deuxNiveaux && zonesClassName,
                    )}
                >
                    <div
                        className={cn(
                            'flex min-w-0 flex-col gap-4',
                            deuxNiveaux
                                ? listeEtFiche
                                    ? cn(
                                          'w-[360px] shrink-0 grow-0',
                                          listeLarge && 'large:w-[400px]',
                                      )
                                    : /* Les lignes de la grille de douze, pas un partage de
                                         ce qui reste (10/10) : la liste tombe sous les tuiles
                                         qui la surmontent. */
                                      DOUZIEMES[panelRatio === 5 ? 7 : 8]
                                : 'flex-1',
                            CADRE_BUREAU,
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
                                            className="text-on-surface hover:text-text-secondary shrink-0 cursor-pointer text-[0.75rem] font-medium underline underline-offset-4"
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
                                <div className="bg-surface-muted-strong text-body-medium rounded-vignette text-on-surface-variant flex items-center gap-2.5 px-3.5 py-[11px] leading-[1.125rem]">
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
                            /* **Le squelette couvre la liste entière** (10/10) : cinq rangées
                               en haut laissaient le reste de la page nu. Au bureau il prend la
                               hauteur du cadre ; au téléphone, celle de l'écran. */
                            <Reading className="expanded:flex expanded:min-h-0 expanded:flex-1 expanded:flex-col">
                                {/* Un tableau attend en tableau — son en-tête de 40 et ses
                                    rangées de 48, bord à bord —, pas en rangées à vignette. */}
                                <div
                                    className={cn(
                                        'bg-surface expanded:min-h-0 expanded:flex-1 overflow-clip rounded-xl',
                                        !enTableauLarge && 'px-4',
                                    )}
                                >
                                    {enTableauLarge ? (
                                        <SkeletonTableau />
                                    ) : skeleton === 'file' ? (
                                        <SkeletonQueue remplir />
                                    ) : (
                                        <SkeletonList remplir />
                                    )}
                                </div>
                            </Reading>
                        ) : hasRows ? (
                            enTableauLarge ? (
                                /* Le tableau porte déjà son cadre et son défilement
                                   (`DataTable` : `overflow-auto`, en-tête et colonne de
                                   tête figés) ; il ne lui manquait que la permission de
                                   rétrécir pour tenir dans la fenêtre. */
                                <div
                                    className={cn(
                                        'flex min-w-0 flex-col',
                                        CADRE_BUREAU,
                                        /* `:first-of-type` — le tableau, et lui seul : le
                                           journal pose une sentinelle de défilement après
                                           lui, et un `[&>div]` nu lui donnait la moitié de
                                           la hauteur. */
                                        'expanded:flex-1 expanded:[&>div:first-of-type]:min-h-0 expanded:[&>div:first-of-type]:flex-1',
                                    )}
                                >
                                    {children}
                                    {footer && (
                                        <p className="text-text-muted mt-1.5 text-center text-[0.75rem] tabular-nums">
                                            {footer}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        'flex w-full flex-col',
                                        !deuxNiveaux && 'large:max-w-none max-w-[960px]',
                                        CADRE_BUREAU,
                                        'expanded:flex-1',
                                    )}
                                >
                                    {body === 'cartes' ? (
                                        <div className={cn('flex flex-col gap-4', CORPS_BUREAU)}>
                                            {children}
                                        </div>
                                    ) : (
                                        /* `.card` des listes — **`2 16`** (04.1, 05.1, 03.3) : deux
                                           pixels au-dessus de la première rangée et sous la
                                           dernière, pour que leur filet ne touche pas l'arrondi.
                                           Elle tenait `0 16`. */
                                        <section
                                            className={cn(
                                                'bg-surface rounded-xl px-4 py-0.5',
                                                CORPS_BUREAU,
                                            )}
                                        >
                                            {children}
                                        </section>
                                    )}
                                    {footer && (
                                        <p className="text-text-muted mt-1.5 text-center text-[0.75rem] tabular-nums">
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
                            /* **Le vide occupe la même boîte que la liste** : il se centre
                               dans ce qui reste de la fenêtre, au lieu de se coller sous la
                               recherche avec 600 px de canevas dessous. */
                            (horsLigne ? (
                                <div
                                    className={cn(
                                        /* `flex-1` à toutes les largeurs (25/09) : au téléphone
                                           le vide restait à sa hauteur, collé sous la recherche. */
                                        'flex flex-1 flex-col justify-center',
                                        CADRE_BUREAU,
                                    )}
                                >
                                    <OfflineState depuis={derniereLecture} />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        /* `flex-1` à toutes les largeurs (25/09) : au téléphone
                                           le vide restait à sa hauteur, collé sous la recherche. */
                                        'flex flex-1 flex-col justify-center',
                                        CADRE_BUREAU,
                                    )}
                                >
                                    {/* **Le vide reste dans la carte de la liste** (25/09) : il
                                        flottait sur le canevas, en forme d'écran (rond de 96,
                                        titre de 22), sous un héro qui, lui, est une carte. La
                                        carte garde la place et la mesure des rangées absentes ;
                                        la page y pose un `CardEmptyState`.
                                        Les enfants n'y suivent plus : sans rangée, ils ne
                                        portaient que l'en-tête d'un tableau vide ou les
                                        intitulés de colonne, posés sous le vide. */}
                                    {empty ? (
                                        <div
                                            className={cn(
                                                'bg-surface flex w-full flex-1 flex-col rounded-xl',
                                                !deuxNiveaux && 'large:max-w-none max-w-[960px]',
                                            )}
                                        >
                                            {empty}
                                        </div>
                                    ) : (
                                        children
                                    )}
                                </div>
                            ))
                        )}

                        {note && <Reading>{note}</Reading>}

                        {origin && origin.showClearAction !== false && (
                            <Reading>
                                {origin.clearPresentation === 'more' ? (
                                    <Button
                                        variant="text"
                                        icon={<Icon glyph={List} size={20} />}
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
                        défile sous lui. Au bureau il prend **toute la hauteur** de la zone
                        et défile pour son propre compte : un site à quinze locaux ne
                        rallonge plus la page, et un panneau vide ne fait plus une vignette
                        de 138 px à côté d'une liste de 300. */}
                    {deuxNiveaux && (
                        <aside
                            className={cn(
                                'sticky top-4 min-w-0',
                                listeEtFiche ? 'shrink grow basis-0' : DOUZIEMES[panelRatio],
                                'expanded:static expanded:min-h-0 expanded:self-stretch expanded:overflow-y-auto expanded:overscroll-contain',
                            )}
                        >
                            {selection?.active ? (
                                /* Le panneau résume ce qui est désigné (26/09). */
                                <div className="bg-surface flex h-full flex-col rounded-xl">
                                    <CardEmptyState
                                        glyph={Checks}
                                        title={`${selection.count} dans la sélection`}
                                        description="Les gestes de la barre s’appliquent à chacun. Échap pour en sortir."
                                    />
                                </div>
                            ) : (
                                panel
                            )}
                        </aside>
                    )}
                </div>
            </div>

            {selection?.active && isCompact ? (
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
