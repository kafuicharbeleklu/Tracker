import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChartBar,
    CheckCircle,
    ClipboardText,
    Coins,
    FolderOpen,
    Gear,
    Laptop,
    List,
    MapPin,
    ShieldCheck,
    SquaresFour,
    UsersThree,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { ViewType } from '../../types';
import { useAccessControl } from '../../hooks/useAccessControl';
import Icon from '../ui/Icon';
import {
    DESTINATIONS,
    getDestinationShortLabel,
    type DestinationId,
} from '../../constants/destinations';

/**
 * La barre du bas et le menu « Plus » — composant partagé **17.7**, 28 écrans.
 *
 * ## « Plus » est une feuille de choix, pas un panneau de coin
 *
 * La cinquième case ouvre une **liste de chemins**. Le système ne connaît qu'une
 * forme pour cela : la **feuille montante de §2.9** — pleine largeur, poignée,
 * **sans pied**. Un panneau ancré au coin serait une seconde forme d'overlay pour
 * l'office de la feuille, à côté de celle de 17.1 et de celle de 17.5.
 *
 * Ce qu'elle remplace : un panneau de **272 px** calé en bas à droite, portant
 * l'identité de la personne, **huit rangées à deux lignes** et un numéro de version
 * — dix-neuf lignes pour huit chemins, et 113 px de vide à sa gauche.
 *
 * ## Le voile s'arrête au-dessus de la barre
 *
 * Même règle que le snackbar de 17.5 : **un menu ne recouvre pas la destination qui
 * l'a ouvert**. Le voile s'arrête à 56 px du bas, la case « Plus » reste pressable,
 * et c'est elle qui referme. Le code posait le voile à `z-55` par-dessus la barre à
 * `z-50` : la case portait `aria-expanded` tout en étant **impressable** — l'attribut
 * annonçait un geste que le voile empêchait.
 *
 * ## Ce que la feuille ne porte pas, et pourquoi
 *
 * - **Le compte, ni la déconnexion.** Ils sont à l'avatar, en haut (arbitrage A4).
 *   Deux portes vers « Mon compte » en font une de trop — et la règle de cette
 *   planche est plus nette encore : *la cinquième case ne porte que des destinations,
 *   jamais un acte*. **Se déconnecter est un acte**, le seul qui quitte le produit.
 *   La planche le dessinait pourtant dans la feuille, en rouge, sous un second filet :
 *   elle se contredisait. Retiré le 20/08. Il reste joignable par l'avatar au tableau
 *   de bord, et par **Paramètres** — la rangée juste au-dessus — partout ailleurs.
 * - **La version.** Elle appartient à Paramètres : une surface de navigation dit où
 *   aller, pas ce qu'on exécute. Le pied affichait `v2.4.1` quand `APP_CONFIG` dit
 *   `v1.2.0` — une valeur en dur qui avait déjà divergé.
 * - **Les descriptions.** Six sur huit ne disaient rien de plus que leur libellé
 *   (« Finances » / *Budgets, dépenses et coûts*). R13 n'en autorise qu'une, et
 *   seulement si elle apprend quelque chose.
 *
 * ## Un libellé de destination se lit dans le registre
 *
 * `DESTINATIONS` fait foi, et son propre commentaire d'en-tête l'énonce : *« ne plus
 * définir de libellé de destination directement dans un composant »*. Quatre libellés
 * sur six le violaient — « Catalogue & Modèles », « Journal d'audit », « Rapports &
 * Exports », « Rôles & Permissions ».
 */
interface NavigationBarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onMoreClick?: () => void;
    embedded?: boolean;
    className?: string;
}

type NavDestinationId = 'dashboard' | 'equipment' | 'tasks' | 'users' | 'more';
const MORE_VIEWS: ViewType[] = [
    'finance',
    'finance_expenses',
    'management',
    'rbac',
    'add_category',
    'add_model',
    'import_models',
    'category_details',
    'model_details',
    'locations',
    'site_details',
    'import_locations',
    'audit',
    'audit_details',
    'reports',
    'settings',
];

interface BottomNavItem {
    id: NavDestinationId;
    glyph: PhosphorGlyph;
    label: string;
    onSelect: () => void;
    active?: boolean;
    ariaLabel?: string;
}

/** Une rangée de la feuille « Plus » : un glyphe, un libellé du registre, rien d'autre. */
interface MoreRow {
    id: string;
    /** L'entrée du registre dont la rangée porte le libellé — absente pour la déconnexion. */
    destination?: DestinationId;
    label: string;
    glyph: PhosphorGlyph;
    onSelect: () => void;
}

/**
 * Les glyphes des six sections secondaires, fixés par la planche 17.7. Ils ne
 * vivent pas dans `DESTINATIONS` : le registre porte des noms Material Symbols,
 * consommés par les surfaces qui n'ont pas encore basculé sur Phosphor.
 */
const MORE_GLYPHS: Record<string, PhosphorGlyph> = {
    finance: Coins,
    management: FolderOpen,
    locations: MapPin,
    audit: ClipboardText,
    reports: ChartBar,
    rbac: ShieldCheck,
    settings: Gear,
};

/**
 * De la vue courante vers la section secondaire qui la contient — c'est elle que la
 * feuille marque en creux à la réouverture. Une case fourre-tout ne peut pas dire
 * laquelle des six on regarde ; deux surfaces le font et suffisent : la barre de
 * titre nomme la page, et la feuille rouvre sur la rangée en creux.
 */
const MORE_SECTION_OF_VIEW: Partial<Record<ViewType, DestinationId>> = {
    finance: 'finance',
    finance_expenses: 'finance',
    management: 'management',
    add_category: 'management',
    add_model: 'management',
    import_models: 'management',
    category_details: 'management',
    model_details: 'management',
    locations: 'locations',
    site_details: 'locations',
    import_locations: 'locations',
    audit: 'audit',
    audit_details: 'audit',
    reports: 'reports',
    rbac: 'rbac',
    settings: 'settings',
};

const resolveBottomNavDestination = (view: ViewType): NavDestinationId | null => {
    if (
        view === 'equipment' ||
        view === 'equipment_details' ||
        view === 'add_equipment' ||
        view === 'edit_equipment' ||
        view === 'import_equipment' ||
        view === 'assignment_wizard' ||
        view === 'return_wizard'
    ) {
        return 'equipment';
    }

    if (
        view === 'users' ||
        view === 'user_details' ||
        view === 'add_user' ||
        view === 'edit_user' ||
        view === 'import_users'
    ) {
        return 'users';
    }

    if (view === 'tasks' || view === 'new_request') {
        return 'tasks';
    }

    if (view === 'dashboard') {
        return 'dashboard';
    }

    if (MORE_VIEWS.includes(view)) {
        return 'more';
    }

    return null;
};

/**
 * Une rangée de la feuille : 52 px, rayon `--r-4` de la commande (R11), un glyphe de
 * 20 et un libellé de 15/500. La section courante prend le creux `--inset` et son
 * glyphe passe en `--nav-on` plein — exactement la marque de l'onglet actif de la
 * barre, jamais une seconde couleur.
 */
const MoreSheetRow: React.FC<{ row: MoreRow; here?: boolean; onDone: () => void }> = ({
    row,
    here = false,
    onDone,
}) => (
    <button
        type="button"
        role="menuitem"
        onClick={() => {
            row.onSelect();
            onDone();
        }}
        className={cn(
            'text-on-surface flex min-h-[52px] w-full items-center gap-3.5 rounded-md px-3 text-left text-[15px] font-medium transition-colors',
            here ? 'bg-surface-container' : 'hover:bg-surface-container',
        )}
    >
        <Icon
            glyph={row.glyph}
            size={20}
            emphasis={here ? 'fill' : 'regular'}
            className={here ? 'text-[var(--tk-color-nav-active)]' : 'text-on-surface-variant'}
        />
        <span className="min-w-0 flex-1 truncate">{row.label}</span>
    </button>
);

export const NavigationBar: React.FC<NavigationBarProps> = ({
    currentView,
    onViewChange,
    onMoreClick,
    embedded = false,
    className,
}) => {
    const { permissions } = useAccessControl();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const moreSections: MoreRow[] = useMemo(() => {
        const rows: MoreRow[] = [];
        const push = (id: DestinationId) =>
            rows.push({
                id,
                destination: id,
                label: DESTINATIONS[id].label,
                glyph: MORE_GLYPHS[id],
                onSelect: () => onViewChange(id),
            });

        if (permissions.canViewFinance) push('finance');
        if (permissions.canManageInventory) push('management');
        if (permissions.canViewLocations) push('locations');
        if (permissions.canViewAudit) push('audit');
        if (permissions.canViewReports) push('reports');
        // `canManageRbac` n'existe pas dans le jeu de permissions : la rangée
        // « Rôles & accès » ne s'affichait donc JAMAIS. Administrer les rôles est un
        // acte d'administration système — c'est `canManageSystem` qui le garde.
        if (permissions.canManageSystem) push('rbac');

        return rows;
    }, [
        onViewChange,
        permissions.canManageInventory,
        permissions.canManageSystem,
        permissions.canViewAudit,
        permissions.canViewFinance,
        permissions.canViewLocations,
        permissions.canViewReports,
    ]);

    /** Derrière un filet : Paramètres n'est pas un domaine du parc. */
    const moreSettings: MoreRow = useMemo(
        () => ({
            id: 'settings',
            destination: 'settings',
            label: DESTINATIONS.settings.label,
            glyph: MORE_GLYPHS.settings,
            onSelect: () => onViewChange('settings'),
        }),
        [onViewChange],
    );

    const currentSection = MORE_SECTION_OF_VIEW[currentView];

    const destinations = useMemo(() => {
        const activeId = resolveBottomNavDestination(currentView);

        const items: BottomNavItem[] = [];

        if (permissions.canViewInventory) {
            items.push({
                id: 'dashboard',
                glyph: SquaresFour,
                label: getDestinationShortLabel('dashboard'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('dashboard');
                },
            });

            items.push({
                id: 'equipment',
                glyph: Laptop,
                label: getDestinationShortLabel('equipment'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('equipment');
                },
            });
        }

        if (permissions.canViewApprovals) {
            items.push({
                id: 'tasks',
                glyph: CheckCircle,
                label: getDestinationShortLabel('tasks'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('tasks');
                },
            });
        }

        if (permissions.canViewUsers) {
            items.push({
                id: 'users',
                glyph: UsersThree,
                label: getDestinationShortLabel('users'),
                onSelect: () => {
                    setIsMenuOpen(false);
                    onViewChange('users');
                },
            });
        }

        items.push({
            id: 'more',
            glyph: List,
            label: 'Plus',
            onSelect: () => {
                if (onMoreClick) {
                    onMoreClick();
                    return;
                }
                setIsMenuOpen((prev) => !prev);
            },
            ariaLabel: onMoreClick ? 'Ouvrir le menu' : 'Plus',
        });

        return items.slice(0, 5).map((item) => ({
            ...item,
            active: activeId !== null && item.id === activeId,
        }));
    }, [
        currentView,
        onMoreClick,
        onViewChange,
        permissions.canViewApprovals,
        permissions.canViewInventory,
        permissions.canViewUsers,
    ]);

    const activeIndex = Math.max(
        0,
        destinations.findIndex((item) => item.active),
    );

    // Handle outside clicks and escape key for menu
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                moreButtonRef.current &&
                !moreButtonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                moreButtonRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    const focusItem = useCallback((index: number) => {
        itemRefs.current[index]?.focus();
    }, []);

    const handleItemKeyDown = useCallback(
        (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (destinations.length === 0) {
                return;
            }

            switch (event.key) {
                case 'ArrowRight':
                    event.preventDefault();
                    focusItem((index + 1) % destinations.length);
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    focusItem((index - 1 + destinations.length) % destinations.length);
                    break;
                case 'Home':
                    event.preventDefault();
                    focusItem(0);
                    break;
                case 'End':
                    event.preventDefault();
                    focusItem(destinations.length - 1);
                    break;
                default:
                    break;
            }
        },
        [destinations.length, focusItem],
    );

    return (
        <>
            {/*
              LE VOILE — il s'arrête à 56 px du bas. La case « Plus » reste au-dessus,
              donc pressable, et c'est elle qui referme : un menu ne recouvre pas la
              destination qui l'a ouvert (même règle que le snackbar de 17.5).
            */}
            {isMenuOpen && (
                <div
                    className="animate-in fade-in fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 bg-[rgba(10,25,29,0.42)] duration-150"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* LA FEUILLE DE CHOIX — §2.9 : montante, pleine largeur, sans pied. */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-orientation="vertical"
                    aria-label="Autres sections"
                    className="animate-in slide-in-from-bottom bg-surface fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-50 flex max-h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px))] flex-col overflow-y-auto rounded-t-lg pb-2 shadow-[0_-10px_30px_rgba(10,25,29,0.20)] duration-200"
                >
                    <span
                        aria-hidden="true"
                        className="bg-outline-variant mx-auto mt-2 mb-0.5 h-1 w-9 shrink-0 rounded-xs"
                    />

                    <div className="flex items-baseline gap-2 px-5 pt-2 pb-2.5">
                        <h2 className="font-brand text-[20px] leading-[27px] font-semibold tracking-[-0.015em]">
                            Plus
                        </h2>
                        {/*
                          La clé dit où l'on est quand on y est, et combien il y a à
                          voir sinon. Elle tombe quand il n'y a aucune section — la
                          feuille de l'utilisateur final assume d'être courte.
                        */}
                        {currentSection && moreSections.some((row) => row.id === currentSection) ? (
                            <span className="text-body-small text-on-surface-variant">
                                vous êtes dans {DESTINATIONS[currentSection].label}
                            </span>
                        ) : (
                            moreSections.length > 0 && (
                                <span className="text-body-small text-on-surface-variant tabular-nums">
                                    {moreSections.length} sections
                                </span>
                            )
                        )}
                    </div>

                    {moreSections.length > 0 && (
                        <>
                            <div className="flex flex-col px-2">
                                {moreSections.map((row) => (
                                    <MoreSheetRow
                                        key={row.id}
                                        row={row}
                                        here={row.id === currentSection}
                                        onDone={() => setIsMenuOpen(false)}
                                    />
                                ))}
                            </div>
                            <span
                                aria-hidden="true"
                                className="bg-outline-variant mx-5 my-2 h-px"
                            />
                        </>
                    )}

                    <div className="flex flex-col px-2">
                        <MoreSheetRow
                            row={moreSettings}
                            here={currentSection === 'settings'}
                            onDone={() => setIsMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Planche standard bottom navigation bar (.nav) */}
            <nav
                aria-label="Navigation principale"
                role="navigation"
                className={cn(
                    'nav bg-surface flex h-14 min-h-[56px] w-full items-center justify-around border-t border-[var(--tk-color-border-default)] select-none',
                    !embedded &&
                        'fixed right-0 bottom-0 left-0 z-50 pb-[max(0px,env(safe-area-inset-bottom))]',
                    className,
                )}
            >
                {destinations.map((item, index) => {
                    const isMore = item.id === 'more';
                    const Glyph = item.glyph;
                    return (
                        <button
                            key={item.id}
                            ref={(el) => {
                                itemRefs.current[index] = el;
                                if (isMore) moreButtonRef.current = el;
                            }}
                            type="button"
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleItemKeyDown(index, event)}
                            tabIndex={index === activeIndex ? 0 : -1}
                            aria-current={item.active ? 'page' : undefined}
                            aria-expanded={isMore ? isMenuOpen : undefined}
                            aria-haspopup={isMore ? 'menu' : undefined}
                            aria-label={item.ariaLabel ?? item.label}
                            title={item.label}
                            className={cn(
                                'relative flex h-full min-h-[56px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                                item.active
                                    ? 'on font-medium text-[var(--tk-color-nav-active)]'
                                    : 'text-on-surface-variant hover:text-on-surface',
                                // La case ouverte s'allume : elle est au-dessus du voile,
                                // et c'est le seul indice qu'elle est encore pressable.
                                isMore && isMenuOpen && 'bg-surface-container text-on-surface',
                            )}
                        >
                            <Glyph
                                size={24}
                                weight={item.active ? 'fill' : 'regular'}
                                aria-hidden="true"
                                focusable="false"
                                className="flex-none"
                            />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};
