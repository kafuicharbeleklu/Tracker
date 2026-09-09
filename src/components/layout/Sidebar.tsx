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
                'focus-visible:ring-focus-ring rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset',
                collapsed
                    ? /* `.rail>a` — 72 × 64, le glyphe puis le mot en 11. Le padding
                         horizontal du bouton est neutralisé : à 16 px de chaque côté il
                         ne restait que 40 px de texte, et six destinations sur onze
                         partaient en « Catal… ». */
                      'mx-auto flex min-h-16 w-[72px] flex-col items-center justify-center gap-1 !px-1 text-center text-[11px] leading-4'
                    : 'flex min-h-12 w-full items-center gap-3 px-3 text-left text-[14px] leading-5',
                active
                    ? 'bg-surface-container text-on-surface font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface',
            )}
        >
            <Icon
                glyph={destination.glyph}
                size={20}
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
            {/* `.side>a .n` — le compte de ce qui attend un geste, 12 tabulaire en encre
                tertiaire. Replié, il n'y a pas la place : le rail le dira autrement. */}
            {!collapsed && count !== undefined && count > 0 && (
                <span className="text-text-tertiary ml-auto shrink-0 text-[12px] leading-4 tabular-nums">
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
                /* `.side` — sur la surface, un filet à droite, et elle tient la
                   **fenêtre** : c'est le corps qui défile sous elle, comme `.side` dans
                   le `.dsk` des planches. */
                'bg-surface border-outline-variant sticky top-0 flex h-screen shrink-0 flex-col border-r py-4',
                isCollapsed ? 'w-[88px] px-2' : 'w-[264px] px-3',
                className,
            )}
        >
            {/* `.sbrand` — le nom du produit, et le geste qui replie. */}
            <div
                className={cn(
                    'flex min-h-10 items-center gap-2.5 pb-4',
                    isCollapsed ? 'justify-center' : 'px-2',
                )}
            >
                {!isCollapsed && (
                    <span className="font-brand text-on-surface min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em]">
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
                        className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface h-10 w-10 shrink-0 rounded-lg shadow-none"
                    >
                        <Icon glyph={isCollapsed ? SidebarSimple : CaretLeft} size={20} />
                    </Button>
                ) : (
                    /* Le rail garde la marque du produit, sans geste : deux lettres
                       valent mieux qu'un espace vide au-dessus des destinations. */
                    <span className="font-brand text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center text-[13px] font-semibold">
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
                            /* Replié, le nom du groupe n'a pas la place : un filet dit
                               la même coupure sans mentir sur ce qu'il sépare. */
                            <span
                                aria-hidden="true"
                                className="bg-outline-variant mx-auto my-2 block h-px w-10"
                            />
                        ) : (
                            <p className="text-text-tertiary px-3 pt-3 pb-1 text-[11px] leading-4 font-medium tracking-[0.06em] uppercase">
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
                    'border-outline-variant mt-auto flex items-center gap-2.5 border-t pt-3',
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
                                className="font-brand h-8 w-8 shrink-0 rounded-full bg-[var(--tk-color-inverse-surface)] text-[12px] font-semibold text-white shadow-none hover:opacity-90"
                            >
                                {compte.initiales}
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <span className="font-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-[12px] font-semibold text-white">
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
                                    className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface h-10 w-10 shrink-0 rounded-lg shadow-none"
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
