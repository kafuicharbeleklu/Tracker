import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChartBar,
    CheckCircle,
    ClipboardText,
    CaretRight,
    Coins,
    FolderOpen,
    Gear,
    Laptop,
    List,
    LockKey,
    MapPin,
    ShieldCheck,
    SquaresFour,
    UsersThree,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { ViewType } from '../../types';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useAuth } from '../../context/AuthContext';
import { usePendingTasks } from '../../hooks/usePendingTasks';
import { useRouter } from '../../hooks/useRouter';
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
    /** Le chiffre rouge de Tâches — ce qui attend un geste (17.7). */
    badge?: number;
    /** Le point rouge, quand un fait appelle sans se compter (un code à définir). */
    dot?: boolean;
}

/**
 * Une rangée de la feuille « Plus » : une vignette, un libellé du registre, et une
 * **sous-ligne seulement quand elle dit un fait** (un code à définir, une campagne
 * ouverte) — jamais une paraphrase du libellé.
 */
interface MoreRow {
    id: string;
    /** L'entrée du registre dont la rangée porte le libellé — absente hors destination. */
    destination?: DestinationId;
    label: string;
    /** Le fait, s'il y en a un. `warn` le peint de l'ambre des choses à faire. */
    fact?: { text: string; warn?: boolean };
    glyph: PhosphorGlyph;
    onSelect: () => void;
}

/** Un groupe de la feuille : son nom, et ses rangées. Un groupe vide ne s'affiche pas. */
interface MoreGroup {
    label?: string;
    rows: MoreRow[];
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
 * `.arow` — la rangée du **canon des feuilles** (07.1, 17.10, 18.1), portée ici par la
 * passe du 05/09 : **56 px**, une vignette de 40 au creux (rayon 4), le libellé en
 * 16/24, la sous-ligne en 14/20, un chevron de 20 à droite, un filet entre les rangées.
 *
 * Elle valait 52 px avec un glyphe nu de 20 et un libellé en 500 — une forme propre à
 * ce menu, qu'aucune autre feuille du produit ne portait. La section courante garde le
 * creux et son glyphe la teinte de l'onglet actif : c'est la marque de la barre, jamais
 * une seconde couleur.
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
        className="border-outline-variant text-on-surface flex min-h-14 w-full items-center gap-3 border-t py-2 text-left transition-colors first-of-type:border-t-0 hover:bg-transparent"
    >
        <span
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                here
                    ? 'bg-surface-container text-[var(--tk-color-nav-active)]'
                    : 'bg-surface-container text-on-surface-variant',
            )}
        >
            <Icon glyph={row.glyph} size={20} emphasis={here ? 'fill' : 'regular'} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] leading-6">{row.label}</span>
            {row.fact && (
                <span
                    className={cn(
                        'block truncate text-[14px] leading-5',
                        row.fact.warn ? 'text-[var(--tk-color-on-tint-ambre)]' : 'text-on-surface-variant',
                    )}
                >
                    {row.fact.text}
                </span>
            )}
        </span>
        <Icon glyph={CaretRight} size={20} className="text-text-tertiary shrink-0" />
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
    const { currentUser } = useAuth();
    const { navigate } = useRouter();
    const { count: pendingCount } = usePendingTasks();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    /**
     * Le code de remise n'est pas défini : la feuille le dit sur « Mon compte », et
     * l'onglet « Plus » porte le point de la planche. C'est le seul fait que 17.7
     * autorise à remonter jusqu'à la barre.
     */
    const pinToDefine = Boolean(currentUser && !currentUser.pin);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    /**
     * **Trois groupes nommés par ce qu'on y fait** (17.7, passe du 05/09) : les
     * référentiels, le suivi, l'administration — et « Mon compte » ferme la liste. Un
     * groupe vide ne s'affiche pas ; un porteur n'y voit que la dernière rangée.
     *
     * *Historique* (18.1) manque à « Suivi » : la page n'existe pas encore, et une
     * rangée qui ne mène nulle part est pire qu'une rangée absente. Elle s'ajoute avec
     * l'écran, pas avant.
     */
    const moreGroups: MoreGroup[] = useMemo(() => {
        const row = (id: DestinationId): MoreRow => ({
            id,
            destination: id,
            label: DESTINATIONS[id].label,
            glyph: MORE_GLYPHS[id],
            onSelect: () => onViewChange(id),
        });

        const referentiels: MoreRow[] = [];
        if (permissions.canManageInventory) referentiels.push(row('management'));
        if (permissions.canViewLocations) referentiels.push(row('locations'));

        const suivi: MoreRow[] = [];
        if (permissions.canViewAudit) suivi.push(row('audit'));
        if (permissions.canViewFinance) suivi.push(row('finance'));
        if (permissions.canViewReports) suivi.push(row('reports'));

        const administration: MoreRow[] = [];
        // `canManageRbac` n'existe pas dans le jeu de permissions : la rangée
        // « Rôles & accès » ne s'affichait donc JAMAIS. Administrer les rôles est un
        // acte d'administration système — c'est `canManageSystem` qui le garde.
        if (permissions.canManageSystem) administration.push(row('rbac'));
        if (permissions.canManageSystem) administration.push(row('settings'));
        administration.push({
            id: 'account',
            label: 'Mon compte',
            glyph: LockKey,
            fact: pinToDefine ? { text: 'code PIN à définir', warn: true } : undefined,
            onSelect: () => navigate('/settings/account'),
        });

        return [
            { label: 'Référentiels', rows: referentiels },
            { label: 'Suivi', rows: suivi },
            { label: 'Administration', rows: administration },
        ].filter((group) => group.rows.length > 0);
    }, [
        navigate,
        onViewChange,
        pinToDefine,
        permissions.canManageInventory,
        permissions.canManageSystem,
        permissions.canViewAudit,
        permissions.canViewFinance,
        permissions.canViewLocations,
        permissions.canViewReports,
    ]);

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
                badge: pendingCount > 0 ? pendingCount : undefined,
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
            dot: pinToDefine,
        });

        return items.slice(0, 5).map((item) => ({
            ...item,
            active: activeId !== null && item.id === activeId,
        }));
    }, [
        currentView,
        onMoreClick,
        onViewChange,
        pendingCount,
        pinToDefine,
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
                    className="animate-in fade-in fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 bg-[rgba(10,25,29,0.42)] duration-150"
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
                    className="animate-in slide-in-from-bottom bg-surface fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 flex max-h-[calc(100dvh-4rem-env(safe-area-inset-bottom,0px))] flex-col overflow-y-auto rounded-t-lg pb-3 shadow-[0_-10px_30px_rgba(10,25,29,0.20)] duration-200"
                >
                    <span
                        aria-hidden="true"
                        className="bg-outline-variant mx-auto mt-2 mb-0.5 h-1 w-9 shrink-0 rounded-xs"
                    />

                    {/* `.sttl` — le titre des feuilles : 22 sur 28, Archivo 600. */}
                    <div className="px-5 pt-1 pb-1">
                        <h2 className="font-brand text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                            Plus
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4 px-5 pt-3">
                        {moreGroups.map((group) => (
                            <div key={group.label ?? 'sans-groupe'} className="flex flex-col">
                                {/* `.lab` — le nom du groupe, 12 sur 16 en 500. */}
                                {group.label && moreGroups.length > 1 && (
                                    <p className="text-on-surface-variant mb-1 text-[12px] leading-4 font-medium">
                                        {group.label}
                                    </p>
                                )}
                                {group.rows.map((row) => (
                                    <MoreSheetRow
                                        key={row.id}
                                        row={row}
                                        here={row.id === currentSection}
                                        onDone={() => setIsMenuOpen(false)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Planche standard bottom navigation bar (.nav) */}
            <nav
                aria-label="Navigation principale"
                role="navigation"
                className={cn(
                    /* `.nav` — **64 px**, icône 24, étiquette 12 sur 16 (17.7, passe du
                       05/09). Elle valait 56 / 24 / 11 : la hauteur d'avant le scan
                       central retiré, et une étiquette d'un cran sous l'échelle. */
                    'nav bg-surface flex h-16 min-h-16 w-full items-center justify-around border-t border-[var(--tk-color-border-default)] select-none',
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
                            aria-label={
                                item.badge !== undefined
                                    ? `${item.ariaLabel ?? item.label} — ${item.badge} en attente`
                                    : (item.ariaLabel ?? item.label)
                            }
                            title={item.label}
                            className={cn(
                                'relative flex h-full min-h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[12px] leading-4 transition-colors',
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
                            {/* `.bd` — le chiffre rouge, 16 px de haut, calé sur le coin
                                haut-droit du glyphe ; `.dot` quand le fait ne se compte
                                pas. Le lecteur d'écran l'entend dans le nom du geste. */}
                            {item.badge !== undefined && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-2 left-[calc(50%+6px)] flex h-4 min-w-4 items-center justify-center rounded-lg bg-[var(--tk-color-danger)] px-1 text-[11px] leading-4 font-medium text-white tabular-nums"
                                >
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                            {item.dot && item.badge === undefined && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-2.5 left-[calc(50%+8px)] h-2 w-2 rounded-full bg-[var(--tk-color-danger)]"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </>
    );
};
