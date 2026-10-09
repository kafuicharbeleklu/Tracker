import React, { useEffect, useMemo } from 'react';
import {
    CaretLeft,
    CaretUpDown,
    List,
    SidebarSimple,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import { cn } from '../../lib/utils';
import { ViewType } from '../../types';
import { DESTINATIONS, sectionOfView, type DestinationId } from '../../constants/destinations';
import { useNavigationDestinations } from '../../hooks/useNavigationDestinations';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';
import { useAccountMenu } from '../../hooks/useAccountMenu';
import { usePendingTasks } from '../../hooks/usePendingTasks';
import { APP_CONFIG } from '../../config';
import Icon from '../ui/Icon';
import Menu from '../ui/Menu';
import Button from '../ui/Button';

/**
 * **La barre latérale — régime `expanded` (≥ 840), planche 00.3.**
 *
 * *« Le rail s'ouvre : chaque destination porte son mot entier, et le compte de ce qui
 * attend un geste devient lisible. »* C'est le troisième des trois régimes que 00.3
 * déclare — en bas, debout, écrite en toutes lettres — et le seul que le produit n'avait
 * jamais reçu : sous `MOBILE_ONLY`, la barre latérale n'était pas rendue du tout, et ce
 * qui dormait ici était **une autre barre**.
 *
 * ## Ce que la précédente était, et pourquoi rien n'en reste
 *
 * Un dégradé sombre de 256 px, dix destinations à plat, sans groupes, sans compte, sans
 * pied. `00.1` donne la direction de forme — sobre, claire —, `00.3` donne la mesure :
 * **264 px sur `--surface`**, un filet à droite, des rangées de 48 au rayon 8, la
 * courante en creux `--inset`. Rien de sombre : au bureau, la seule zone inversée d'un
 * écran reste « À traiter ».
 *
 * Elle portait aussi **un tiroir modal** — voile, piège à focus, bouton de fermeture —
 * qui n'était plus monté nulle part : au téléphone, le débordement est la feuille
 * « Plus » (17.7). Et ses props ne correspondaient plus à son seul appelant :
 * `setIsCollapsed` et `onSettingsClick` étaient déclarées requises, jamais passées ;
 * `isModalMode` valait `true` par défaut, si bien que la barre *permanente* rendait la
 * croix du tiroir et une rangée « Déconnexion » que 17.7 range dans le compte. Rien de
 * cela n'était visible tant que le composant ne s'affichait pas.
 *
 * ## Deux étages, et le second est nommé
 *
 * Les quatre **principales** — celles de la barre du bas —, puis les **groupes** que
 * « Plus » range au téléphone : *Référentiels*, *Suivi*, *Administration* (17.7). Au
 * bureau il n'y a plus de « Plus » : les groupes se déplient. La liste et ses droits
 * viennent de `useNavigationDestinations`, la même réponse pour les quatre surfaces —
 * la feuille et la barre latérale n'ouvraient pas les mêmes rangées au même compte.
 *
 * ## Repliée, elle devient le rail
 *
 * *« Repliable à 88 »* (recherche bureau du 08/09, motif de Linear). 88, c'est la mesure
 * du rail de 00.3, et la rangée y prend la forme du rail : 72 × 64, glyphe puis mot en
 * 11. Replier ne fabrique donc pas une troisième forme de navigation — cela ramène la
 * barre latérale au régime qui la précède. Le raccourci est `[`, et l'état est retenu.
 *
 * ## Sur tablette, le rail porte ses mots
 *
 * Sous 1 280 la barre ne se déploie pas (25/09). Repliée, elle n'était que des glyphes de
 * 20 dans 64 px, et leurs noms des infobulles — qu'un doigt ne fait jamais paraître : sur
 * tablette, on naviguait à la forme d'une icône. Le rail y reprend donc la forme de Material
 * (80 px, le glyphe dans un creux de 56 × 32, **son mot dessous**) et en garde la borne :
 * **sept cases au plus**. Au-delà, six destinations et « Plus », qui ouvre le reste à droite
 * du rail, par groupes. Le bureau replié (≥ 1 280, à la souris) garde les glyphes seuls et
 * leurs infobulles.
 *
 * ## Le pied porte la personne
 *
 * Avatar, nom, rôle, ⋮ — le motif « profil épinglé en bas » des outils d'équipe, retenu
 * par la recherche du 08/09 et dessiné par la colonne bureau de 03.1. Le ⋮ ouvre le
 * **même** menu que l'avatar de l'accueil (`useAccountMenu`) : Mon compte, Paramètres,
 * Aide et support, et la sortie.
 */
interface SidebarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    /**
     * Le régime autorise-t-il le déploiement ? **Sous 1280, non** (25/09 ; c'était sous 840) :
     * sur tablette la barre est le **rail à mots** — déployée, elle prenait 240 px d'un écran
     * de 1024 ou 1180. Le geste de repli et son raccourci n'existent donc pas là.
     */
    canExpand?: boolean;
    className?: string;
}

/** Le rail compte sept cases au plus — Material en admet trois à sept. */
const RAIL_MAX = 7;

/**
 * **Ce qui monte au rail quand tout n'y tient pas**, après les quatre principales : la
 * campagne et les finances, que l'on ouvre chaque semaine ; le reste attend dans « Plus »
 * (proposition « format tablette », lot P1a, 25/09).
 */
const RAIL_PROMUES: DestinationId[] = [
    'audit',
    'finance',
    'locations',
    'management',
    'history',
    'reports',
    'rbac',
];

/**
 * **Une case du rail** — 56 de haut au moins, le glyphe de 24 dans un creux de 56 × 32,
 * le mot en 12 sur 16 dessous, sur deux lignes au plus. Elle transmet ce qu'on lui passe :
 * « Plus » la reçoit du menu qui s'y greffe.
 */
const RailCase: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        glyph: PhosphorGlyph;
        label: string;
        active: boolean;
        count?: number;
    }
> = ({ glyph, label, active, count, className, ...rest }) => (
    <Button
        variant="text"
        layout="card"
        {...rest}
        aria-current={active && !rest['aria-haspopup'] ? 'page' : undefined}
        className={cn(
            /* Le bouton du DS, défait de sa boîte : la case est une colonne, le creux est
               sur le glyphe, et l'anneau de focus aussi. */
            'group flex h-auto min-h-14 w-full min-w-0 flex-col items-center justify-start gap-1 rounded-none px-0 pt-1 pb-1.5 text-center text-[0.75rem] leading-4 whitespace-normal shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
            active
                ? 'text-on-surface font-medium'
                : 'text-on-surface-variant hover:text-on-surface font-normal',
            className,
        )}
    >
        <span
            className={cn(
                'group-focus-visible:ring-focus-ring relative flex h-8 w-14 shrink-0 items-center justify-center rounded-md transition-colors group-focus-visible:ring-2',
                /* Le creux de la destination choisie se déploie depuis son centre (26/09). */
                active
                    ? 'bg-surface-muted-strong mvt-indicateur'
                    : 'group-hover:bg-surface-container',
            )}
        >
            <Icon glyph={glyph} size={24} emphasis={active ? 'fill' : 'regular'} />
            {count !== undefined && count > 0 && (
                /* La clé suit le nombre : il rebondit quand une tâche arrive (08/10). */
                <span
                    key={count}
                    className={cn(
                        'mvt-pop text-on-surface absolute -top-1 -right-1 rounded-xs px-[5px] text-[0.6875rem] leading-4 font-normal tabular-nums',
                        active ? 'bg-surface' : 'bg-surface-muted-strong',
                    )}
                >
                    {count}
                </span>
            )}
        </span>
        <span className="line-clamp-2 w-full px-0.5">{label}</span>
    </Button>
);

/** `.side>a` — 48 de haut, gouttière 12, rayon 8, 14 px ; en creux quand on y est. */
const SideRow: React.FC<{
    id: DestinationId;
    active: boolean;
    collapsed: boolean;
    count?: number;
    /** Le nom propre à cette personne — « Mon historique » (`useNavigationDestinations`). */
    libelle?: string;
    onSelect: () => void;
}> = ({ id, active, collapsed, count, libelle, onSelect }) => {
    const destination = DESTINATIONS[id];
    /* **Les noms des planches de bureau** — « Accueil », « Actifs », « Inventaire physique »
       (les douze barres latérales de 17.11 à 18.1). La barre déployée écrivait le libellé
       long, « Tableau de bord » et « Équipements » : une page titrée « Actifs » s'ouvrait
       depuis une entrée « Équipements », deux noms pour une destination. */
    const label =
        libelle ?? destination.sidebarLabel ?? destination.shortLabel ?? destination.label;

    return (
        <Button
            variant="text"
            layout="card"
            onClick={onSelect}
            aria-current={active ? 'page' : undefined}
            /* Replié, le glyphe est seul : l'`aria-label` le nomme, et le `title` en
               fait l'infobulle au survol. */
            aria-label={collapsed ? (libelle ?? destination.label) : undefined}
            title={collapsed ? (libelle ?? destination.label) : undefined}
            className={cn(
                'h-auto min-w-0 shadow-none hover:bg-transparent',
                /* Rayon **4**, pas 8 : l'échelle du bureau est 2 · 4 · 8 et 17.11 met
                   la rangée au premier cran utile — 8 est le rayon d'une carte, et une
                   rangée de navigation n'en est pas une. */
                'focus-visible:ring-focus-ring rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset',
                collapsed
                    ? /* **Repliée, le glyphe seul** (arbitrage du 22/09) — un carré de 40.
                         La planche posait le mot en 11 sous le glyphe, dans 72 × 64 : les
                         noms longs s'y coupaient (« Emplace… ») et la colonne serrait ses
                         rangées. Le nom reste l'infobulle et le nom accessible. */
                      'relative mx-auto flex h-10 min-h-10 w-10 items-center justify-center !px-0'
                    : /* `.side>a` — **40 de haut, 13 sur 18, gouttière 10, rayon 4.**
                         J'avais posé 48 / 14 / 12 / rayon 8 en lisant 00.3 ; 17.11
                         consolide le chrome des neuf écrans et c'est elle qui fait foi. */
                      'doigt:min-h-12 doigt:text-ts-sub doigt:leading-ts-sub flex min-h-10 w-full items-center gap-2.5 px-2.5 text-left text-[0.8125rem] leading-[1.125rem]',
                /* La courante prend `--inset-2`, la survolée `--inset` : deux creux, pas un. */
                /* `Button` pose `font-medium` pour tout le monde : la rangée au repos
                   la reprend à 400, comme `.side>a`. Seule la courante appuie. */
                active
                    ? 'bg-surface-muted-strong text-on-surface font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-normal',
            )}
        >
            <Icon
                glyph={destination.glyph}
                size={collapsed ? 20 : 18}
                emphasis={active ? 'fill' : 'regular'}
                className="shrink-0"
            />
            {/*
              **Une ligne, une ellipse, et l'infobulle dit le reste** — la règle que la
              recherche bureau du 08/09 tranche pour toute troncature. Replié, la boîte
              de 64 ne tient pas « Emplacements » ; le poser sur deux lignes le couperait
              au caractère (« Emplaceme / nts »), et la césure automatique ne s'obtient
              pas partout. Le mot ne se raccourcit pas non plus : une destination porte
              **un** nom, celui du registre — deux noms pour une destination, c'est
              l'écart que 11.1 a fait fermer.
            */}
            {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
            {/*
              `.side>a .n` — **une pastille**, pas un nombre nu : 11 sur 16, `0 5`, rayon
              2, sur `--inset-2` — et sur `--surface` quand la rangée est courante, pour
              rester lisible sur son creux.

              **Le rail la garde** : *« le rail garde les icônes et le compte »* (17.11).
              Elle y monte au coin — `top:6 right:8` —, au-dessus du mot passé sous le
              glyphe. C'est la seule chose que le repli ne retire pas : replier la
              navigation ne doit pas effacer le nombre de gestes qui attendent.
            */}
            {count !== undefined && count > 0 && (
                <span
                    key={count}
                    className={cn(
                        'mvt-pop text-on-surface shrink-0 rounded-xs px-[5px] text-[0.6875rem] leading-4 tabular-nums',
                        active ? 'bg-surface' : 'bg-surface-muted-strong',
                        collapsed ? 'absolute -top-1 -right-1' : 'ml-auto',
                    )}
                >
                    {count}
                </span>
            )}
        </Button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onViewChange,
    isCollapsed,
    onToggleCollapse,
    canExpand = true,
    className,
}) => {
    const { principales, groupes, libelles } = useNavigationDestinations();
    const { count: pendingCount } = usePendingTasks();
    const compte = useAccountMenu();
    const section = sectionOfView(currentView);
    const souris = useMediaQuery(MEDIA.hoverCapable);
    /** Le rail à mots : sous 1 280, et repliée **au doigt** au-delà — une infobulle ne
        paraît jamais sous le doigt, la densité suit le pointeur (P2c, 25/09). Repliée à la
        souris, la barre garde ses glyphes seuls et leurs infobulles. */
    const rail = !canExpand || (isCollapsed && !souris);

    /* Les cases du rail, et ce que « Plus » range. Sept destinations ou moins : toutes au
       rail, sans « Plus ». Au-delà : les principales, puis `RAIL_PROMUES`, jusqu'à six. */
    const { auRail, menuPlus, plusCourant } = useMemo(() => {
        const toutes = [...principales, ...groupes.flatMap((groupe) => groupe.ids)];
        const cases =
            toutes.length <= RAIL_MAX
                ? toutes
                : [...principales, ...RAIL_PROMUES.filter((id) => toutes.includes(id))].slice(
                      0,
                      RAIL_MAX - 1,
                  );
        const items = groupes.flatMap((groupe) =>
            groupe.ids
                .filter((id) => !cases.includes(id))
                .map((id, index) => ({
                    id,
                    label: libelles[id] ?? DESTINATIONS[id].label,
                    glyph: DESTINATIONS[id].glyph,
                    selected: section === id,
                    /* Les groupes de « Plus » se séparent d'un filet : le menu ne porte pas
                       de titre de section. */
                    dividerBefore: index === 0,
                    onSelect: () => onViewChange(id),
                })),
        );
        if (items.length > 0) items[0] = { ...items[0], dividerBefore: false };
        return {
            auRail: cases,
            menuPlus: items,
            plusCourant: items.some((item) => item.selected),
        };
    }, [groupes, libelles, onViewChange, principales, section]);

    /*
      `[` replie et déplie — le raccourci de Linear, retenu par la recherche du 08/09.
      Il ne se déclenche pas dans un champ : on écrit des crochets dans une recherche.
    */
    useEffect(() => {
        if (!canExpand) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return;
            const cible = event.target as HTMLElement | null;
            if (
                cible &&
                (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))
            )
                return;
            event.preventDefault();
            onToggleCollapse();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [canExpand, onToggleCollapse]);

    const rangee = (id: DestinationId) => (
        <SideRow
            key={id}
            id={id}
            active={section === id}
            collapsed={isCollapsed}
            count={id === 'tasks' ? pendingCount : undefined}
            libelle={libelles[id]}
            onSelect={() => onViewChange(id)}
        />
    );

    return (
        <aside
            aria-label="Navigation principale"
            className={cn(
                /*
                  `.side` — **240, et pas de filet** : *« le fond `--surface` la sépare du
                  canevas, sans filet »* (17.11). J'avais porté 264 d'après 00.3 et la
                  note de recherche ; 17.11, dessinée le 09/09 pour consolider le chrome
                  des neuf écrans de bureau, tranche à 240, et les colonnes bureau de
                  03.1 et 05.1 disaient déjà cela.

                  Elle tient la **fenêtre** : c'est le corps qui défile sous elle.

                  **`z-30`, parce que `sticky` isole** (24/09). Un élément collant crée son
                  propre contexte d'empilement : le `z-50` du menu du compte ne valait
                  qu'à l'intérieur de la barre, et le contenu principal, peint après, le
                  recouvrait — barre repliée, on n'en voyait que les 64 px qui dépassent.
                  Au-dessus des en-têtes collants du contenu (`z-20`), sous les feuilles
                  et dialogues (`z-[100]`).
                */
                'bg-surface sticky top-0 z-30 flex h-screen shrink-0 flex-col py-4',
                /* Le rail de tablette : 80, ses cases d'un bord à l'autre. Repliée au
                   bureau : 64, les carrés de 40 et 12 de chaque côté. */
                rail ? 'w-20 px-0' : isCollapsed ? 'w-16 px-3' : 'w-[240px] px-3',
                /* Replier et déplier glissent (26/09) : la barre sautait de 240 à 64 et la
                   page d'un bond. */
                'duration-medium1 ease-emphasized transition-[width]',
                className,
            )}
        >
            {/* `.sbrand` — le nom du produit, et le geste qui replie. */}
            <div
                className={cn(
                    /* `.brand` — 40 de haut, `0 0 0 10` d'intérieur, 8 dessous (17.11).
                       Elle prenait 16 dessous et 8 à gauche : le nom ne s'alignait pas
                       sur le glyphe des rangées, qui commence à 10. */
                    'doigt:min-h-12 flex min-h-10 items-center gap-2.5 pb-2',
                    isCollapsed ? 'justify-center' : 'pl-2.5',
                )}
            >
                {!isCollapsed && (
                    <span className="font-brand text-on-surface min-w-0 flex-1 truncate text-[1rem] font-semibold tracking-[-0.01em]">
                        {APP_CONFIG.appName}
                    </span>
                )}
                {canExpand ? (
                    <Button
                        variant="text"
                        iconOnly
                        onClick={onToggleCollapse}
                        aria-label={
                            isCollapsed ? 'Déployer la navigation ([)' : 'Replier la navigation ([)'
                        }
                        className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface doigt:h-12 doigt:w-12 h-10 w-10 shrink-0 rounded-md shadow-none"
                    >
                        <Icon glyph={isCollapsed ? SidebarSimple : CaretLeft} size={20} />
                    </Button>
                ) : (
                    /* Le rail garde la marque du produit, sans geste : deux lettres
                       valent mieux qu'un espace vide au-dessus des destinations. */
                    <span className="font-brand text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center text-[1rem] font-semibold tracking-[-0.01em]">
                        {APP_CONFIG.appName.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            {rail ? (
                <nav
                    aria-label="Destinations"
                    className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pt-1"
                >
                    {auRail.map((id) => (
                        <RailCase
                            key={id}
                            glyph={DESTINATIONS[id].glyph}
                            label={
                                libelles[id] ??
                                DESTINATIONS[id].shortLabel ??
                                DESTINATIONS[id].label
                            }
                            active={section === id}
                            count={id === 'tasks' ? pendingCount : undefined}
                            onClick={() => onViewChange(id)}
                        />
                    ))}
                    {menuPlus.length > 0 && (
                        <Menu
                            align="start"
                            placement="right"
                            floating
                            rootClassName="w-full"
                            items={menuPlus}
                            trigger={
                                <RailCase
                                    glyph={List}
                                    label="Plus"
                                    active={plusCourant}
                                    aria-label="Plus — autres destinations"
                                />
                            }
                        />
                    )}
                </nav>
            ) : (
                <nav
                    aria-label="Destinations"
                    className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1"
                >
                    {principales.map(rangee)}

                    {groupes.map((groupe) => (
                        <React.Fragment key={groupe.label}>
                            {isCollapsed ? (
                                /* Replié, le nom du groupe n'a pas la place, et le chrome du
                               bureau ne pose pas de filet. **Un blanc de 12** en tient lieu :
                               sans les mots, treize glyphes à la suite ne se regroupent plus
                               d'eux-mêmes. */
                                <span aria-hidden="true" className="h-3 shrink-0" />
                            ) : (
                                <p className="text-text-tertiary px-2.5 pt-3 pb-1 text-[0.6875rem] leading-4 font-normal tracking-[0.06em] uppercase">
                                    {groupe.label}
                                </p>
                            )}
                            {groupe.ids.map(rangee)}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* `.sfoot` — la personne, épinglée en bas. */}
            <div
                className={cn(
                    /* `.sfoot` — `margin-top:auto`, gouttière 10, `12 4 0`. **Pas de
                       filet** : 17.11 n'en dessine aucun au bord de la barre. */
                    'mt-auto flex items-center gap-2.5 pt-3',
                    isCollapsed ? 'justify-center' : 'px-1',
                )}
            >
                {isCollapsed ? (
                    /*
                      **Repliée, c'est la pastille qui ouvre le menu.** Elle ne peut pas
                      rester décorative : sans elle, ni Mon compte ni la sortie ne sont
                      atteignables du rail — et un pied qui montre la personne sans
                      donner accès à son compte est un cul-de-sac.
                    */
                    <Menu
                        align="start"
                        /* À droite du rail, plutôt que par-dessus lui. */
                        placement="right"
                        floating
                        title={compte.legende}
                        items={compte.items}
                        trigger={
                            <Button
                                variant="text"
                                iconOnly
                                aria-label={`Compte — ${compte.nom}`}
                                className="h-8 w-8 shrink-0 rounded-full bg-[var(--tk-color-inverse-surface)] text-[0.75rem] font-medium text-white shadow-none hover:bg-[var(--tk-color-inverse-surface)] hover:opacity-90"
                            >
                                {compte.initiales}
                            </Button>
                        }
                    />
                ) : (
                    /* **Toute la rangée ouvre le menu** (24/09) : la personne — pastille, nom,
                       rôle — est le déclencheur, plus un ⋮ de 40 posé à côté. Le menu part du
                       bord gauche de la rangée et s'ouvre au-dessus. */
                    <Menu
                        align="start"
                        placement="top"
                        floating
                        rootClassName="min-w-0 flex-1"
                        title={compte.legende}
                        items={compte.items}
                        trigger={
                            <Button
                                variant="text"
                                layout="card"
                                aria-label={`Compte — ${compte.nom}`}
                                className="hover:bg-surface-container flex h-auto min-h-12 w-full min-w-0 items-center justify-start gap-2.5 rounded-md px-2 py-2 text-left font-normal shadow-none"
                            >
                                {/* `.av` — Inter 12 en 500 : l'Archivo est la voix du produit, pas celle des initiales (17.11). */}
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-[0.75rem] font-medium text-white">
                                    {compte.initiales}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="text-on-surface block truncate text-[0.8125rem] leading-4">
                                        {compte.nom}
                                    </span>
                                    <span className="text-on-surface-variant block truncate text-[0.75rem] leading-4">
                                        {compte.role}
                                    </span>
                                </span>
                                <Icon
                                    glyph={CaretUpDown}
                                    size={18}
                                    className="text-text-tertiary shrink-0"
                                />
                            </Button>
                        }
                    />
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
