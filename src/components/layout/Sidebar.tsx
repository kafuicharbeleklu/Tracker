import React, { useEffect } from 'react';
import { CaretLeft, DotsThreeVertical, SidebarSimple } from '@phosphor-icons/react';

import { cn } from '../../lib/utils';
import { ViewType } from '../../types';
import { DESTINATIONS, sectionOfView, type DestinationId } from '../../constants/destinations';
import { useNavigationDestinations } from '../../hooks/useNavigationDestinations';
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
     * Le régime autorise-t-il le déploiement ? À `medium` (600–839), non : 00.3 y tient
     * **le rail**, et déployer 264 px sur 768 ne laisserait pas ses 360 px à une
     * colonne. Le geste de repli et son raccourci n'existent donc pas là.
     */
    canExpand?: boolean;
    className?: string;
}

/** `.side>a` — 48 de haut, gouttière 12, rayon 8, 14 px ; en creux quand on y est. */
const SideRow: React.FC<{
    id: DestinationId;
    active: boolean;
    collapsed: boolean;
    count?: number;
    onSelect: () => void;
}> = ({ id, active, collapsed, count, onSelect }) => {
    const destination = DESTINATIONS[id];
    const label = collapsed ? (destination.shortLabel ?? destination.label) : destination.label;

    return (
        <Button
            variant="text"
            layout="card"
            onClick={onSelect}
            aria-current={active ? 'page' : undefined}
            /* Replié, le libellé court est visible mais peut se tronquer : le
               `title` **redit** ce que la rangée montre déjà et que l'`aria-label`
               vocalise — c'est le seul emploi que le socle autorise. */
            aria-label={collapsed ? destination.label : undefined}
            title={collapsed ? destination.label : undefined}
            className={cn(
                'h-auto min-w-0 shadow-none hover:bg-transparent',
                /* Rayon **4**, pas 8 : l'échelle du bureau est 2 · 4 · 8 et 17.11 met
                   la rangée au premier cran utile — 8 est le rayon d'une carte, et une
                   rangée de navigation n'en est pas une. */
                'focus-visible:ring-focus-ring rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset',
                collapsed
                    ? /* `.side.fold>a` — 72 × 64, le glyphe puis le mot en 11. Le padding
                         horizontal du bouton est neutralisé : à 16 px de chaque côté il
                         ne restait que 40 px de texte. */
                      'relative mx-auto flex min-h-16 w-[72px] flex-col items-center justify-center gap-1 !px-1 text-center text-[11px] leading-4'
                    : /* `.side>a` — **40 de haut, 13 sur 18, gouttière 10, rayon 4.**
                         J'avais posé 48 / 14 / 12 / rayon 8 en lisant 00.3 ; 17.11
                         consolide le chrome des neuf écrans et c'est elle qui fait foi. */
                      'flex min-h-10 w-full items-center gap-2.5 px-2.5 text-left text-[13px] leading-[18px]',
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
                size={18}
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
            <span className={cn('min-w-0 truncate', collapsed ? 'max-w-full' : 'flex-1')}>
                {label}
            </span>
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
                    className={cn(
                        'text-on-surface shrink-0 rounded-xs px-[5px] text-[11px] leading-4 tabular-nums',
                        active ? 'bg-surface' : 'bg-surface-muted-strong',
                        collapsed ? 'absolute top-1.5 right-2' : 'ml-auto',
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
    const { principales, groupes } = useNavigationDestinations();
    const { count: pendingCount } = usePendingTasks();
    const compte = useAccountMenu();
    const section = sectionOfView(currentView);

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
                */
                'bg-surface sticky top-0 flex h-screen shrink-0 flex-col py-4',
                isCollapsed ? 'w-[88px] px-2' : 'w-[240px] px-3',
                className,
            )}
        >
            {/* `.sbrand` — le nom du produit, et le geste qui replie. */}
            <div
                className={cn(
                    /* `.brand` — 40 de haut, `0 0 0 10` d'intérieur, 8 dessous (17.11).
                       Elle prenait 16 dessous et 8 à gauche : le nom ne s'alignait pas
                       sur le glyphe des rangées, qui commence à 10. */
                    'flex min-h-10 items-center gap-2.5 pb-2',
                    isCollapsed ? 'justify-center' : 'pl-2.5',
                )}
            >
                {!isCollapsed && (
                    <span className="font-brand text-on-surface min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.01em]">
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
                        className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface h-10 w-10 shrink-0 rounded-md shadow-none"
                    >
                        <Icon glyph={isCollapsed ? SidebarSimple : CaretLeft} size={20} />
                    </Button>
                ) : (
                    /* Le rail garde la marque du produit, sans geste : deux lettres
                       valent mieux qu'un espace vide au-dessus des destinations. */
                    <span className="font-brand text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center text-[16px] font-semibold tracking-[-0.01em]">
                        {APP_CONFIG.appName.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            <nav
                aria-label="Destinations"
                className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1"
            >
                {principales.map(rangee)}

                {groupes.map((groupe) => (
                    <React.Fragment key={groupe.label}>
                        {isCollapsed ? (
                            /* Replié, le nom du groupe n'a pas la place — et **rien ne
                               le remplace** : la colonne « rail » de 17.11 enchaîne ses
                               dix destinations sans coupure, et le chrome du bureau ne
                               pose pas de filet. Un filet y dirait une séparation que le
                               rail, sans les noms, ne peut plus nommer. */
                            <React.Fragment />
                        ) : (
                            <p className="text-text-tertiary px-2.5 pt-3 pb-1 text-[11px] leading-4 font-normal tracking-[0.06em] uppercase">
                                {groupe.label}
                            </p>
                        )}
                        {groupe.ids.map(rangee)}
                    </React.Fragment>
                ))}
            </nav>

            {/* `.sfoot` — la personne, épinglée en bas. */}
            <div
                className={cn(
                    /* `.sfoot` — `margin-top:auto`, gouttière 10, `12 4 0`. **Pas de
                       filet** : 17.11 n'en dessine aucun au bord de la barre. */
                    'mt-auto flex items-center gap-2.5 px-1 pt-3',
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
                        placement="top"
                        title={compte.legende}
                        items={compte.items}
                        trigger={
                            <Button
                                variant="text"
                                iconOnly
                                aria-label={`Compte — ${compte.nom}`}
                                className="h-8 w-8 shrink-0 rounded-full bg-[var(--tk-color-inverse-surface)] text-[12px] font-medium text-white shadow-none hover:opacity-90"
                            >
                                {compte.initiales}
                            </Button>
                        }
                    />
                ) : (
                    <>
                        {/* `.av` — Inter 12 en 500 : l'Archivo est la voix du produit, pas celle des initiales (17.11). */}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-[12px] font-medium text-white">
                            {compte.initiales}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface block truncate text-[13px] leading-4">
                                {compte.nom}
                            </span>
                            <span className="text-on-surface-variant block truncate text-[12px] leading-4">
                                {compte.role}
                            </span>
                        </span>
                        <Menu
                            align="end"
                            placement="top"
                            title={compte.legende}
                            items={compte.items}
                            trigger={
                                <Button
                                    variant="text"
                                    iconOnly
                                    aria-label={`Compte — ${compte.nom}`}
                                    className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface h-10 w-10 shrink-0 rounded-md shadow-none"
                                >
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
