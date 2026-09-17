import { MEDIA } from '../../constants/breakpoints';
import { DESTINATIONS } from '../../constants/destinations';
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { NavigationBar } from './NavigationBar';
import TopAppBar from './TopAppBar';
import { ViewType } from '../../types';
import Button from '../ui/Button';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { scrollAppToTop } from '../../lib/appScroll';
import { APP_CONFIG } from '../../config';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import ScreenState from '../ui/ScreenState';
import { MagnifyingGlass, PaperPlaneTilt } from '@phosphor-icons/react';
import { useAccessControl } from '../../hooks/useAccessControl';
import { SkeletonList } from '../ui/Skeleton';
import { SelectionRegimeProvider } from '../../context/SelectionRegimeContext';
import RequestSheet from '../../features/tasks/components/RequestSheet';
import ClosureBanner, { type ClosureBannerProps } from '../ui/ClosureBanner';
import HandoverActSheet from '../../features/inventory/components/HandoverActSheet';
import ReturnActSheet from '../../features/inventory/components/ReturnActSheet';

const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
const TasksPage = lazy(() => import('../../features/tasks/pages/TasksPage'));
const ApprovalDetailsPage = lazy(() => import('../../features/tasks/pages/ApprovalDetailsPage'));
const FinanceManagementPage = lazy(
    () => import('../../features/finance/pages/FinanceManagementPage'),
);
const ExpenseJournalPage = lazy(() => import('../../features/finance/pages/ExpenseJournalPage'));
const ManagementPage = lazy(() => import('../../features/management/pages/ManagementPage'));
const RbacPage = lazy(() => import('../../features/management/pages/RbacPage'));
const LocationsPage = lazy(() => import('../../features/locations/pages/LocationsPage'));
const AuditPage = lazy(() => import('../../features/audit/pages/AuditPage'));
const HistoryPage = lazy(() => import('../../features/history/pages/HistoryPage'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('../../features/management/pages/SettingsPage'));
const ImportEquipmentPage = lazy(
    () => import('../../features/inventory/pages/ImportEquipmentPage'),
);
const AddEquipmentPage = lazy(() => import('../../features/inventory/pages/AddEquipmentPage'));
const AddUserPage = lazy(() => import('../../features/users/pages/AddUserPage'));
const ImportUsersPage = lazy(() => import('../../features/users/pages/ImportUsersPage'));
const EquipmentDetailsPage = lazy(
    () => import('../../features/inventory/pages/EquipmentDetailsPage'),
);
const UserDetailsPage = lazy(() => import('../../features/users/pages/UserDetailsPage'));
const CategoryDetailsPage = lazy(
    () => import('../../features/management/pages/CategoryDetailsPage'),
);
const ModelDetailsPage = lazy(() => import('../../features/management/pages/ModelDetailsPage'));
const ImportModelsPage = lazy(() => import('../../features/management/pages/ImportModelsPage'));
const ImportLocationsPage = lazy(
    () => import('../../features/locations/pages/ImportLocationsPage'),
);
const SiteDetailsPage = lazy(() => import('../../features/locations/pages/SiteDetailsPage'));
const AuditDetailsPage = lazy(() => import('../../features/audit/pages/AuditDetailsPage'));

interface AppLayoutProps {
    onLogout: () => void;
}

/**
 * Attente d'une vue — planche 17.3, registre §2.39 : on montre **la forme de ce qui
 * arrive**, pas un tourniquet. La place est tenue, donc l'écran ne saute pas à
 * l'arrivée de la donnée ; et « Chargement de la vue » nommait la mécanique, pas ce
 * que la personne attend.
 */
const PageLoadingFallback: React.FC = () => (
    <div data-testid="route-loading-fallback" className="medium:p-6 p-4">
        <SkeletonList rows={4} />
    </div>
);

/** L'objet que l'adresse d'un acte désigne — `?equipmentId=` dans le hash. */
const lireObjetDeLAdresse = (): string | null => {
    const hash = window.location.hash;
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    if (!query) return null;
    return new URLSearchParams(query).get('equipmentId');
};

/** Le repli de la barre latérale, retenu d'une session à l'autre. */
const SIDEBAR_COLLAPSED_KEY = 'tk_sidebar_collapsed';

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
    /**
     * **Le repli de la barre latérale est retenu par personne** (recherche bureau du
     * 08/09, motif de Linear). Un état que l'on repose à chaque chargement n'est pas un
     * réglage : c'est un geste à refaire. Un stockage refusé — navigation privée, site
     * bloqué — rend simplement la barre déployée, qui est le défaut.
     */
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isSidebarCollapsed ? '1' : '0');
        } catch {
            // Ignore storage failures.
        }
    }, [isSidebarCollapsed]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isCompact = useMediaQuery(MEDIA.compact);
    const isLandscape = useMediaQuery(MEDIA.landscape);
    const isMedium = useMediaQuery(MEDIA.medium);
    const isExpandedUp = useMediaQuery(MEDIA.expandedUp);
    const isCompactLandscape = isCompact && isLandscape;
    const useRailNavigation = isMedium || isCompactLandscape;

    const {
        currentView: vueDemandee,
        selectedId: selectedIdRoute,
        routeSegments,
        navigate,
        navigateToView,
        navigateToItem,
        goBack,
    } = useAppNavigation();
    const { permissions, user: currentUser } = useAccessControl();

    /**
     * **Les deux assistants sont devenus des feuilles d'acte** (17.4) : *« jamais un
     * wizard à étapes, une page de validation »*. Leurs deux adresses survivent — les
     * tâches, les fiches et les liens profonds y renvoient — mais elles n'ouvrent plus
     * un écran : elles ouvrent **la feuille sur la page où l'on est**, c'est-à-dire la
     * fiche de l'objet quand l'adresse en désigne un, l'inventaire sinon.
     */
    /**
     * **Demander un équipement est une feuille**, pas un écran (06.4) : *« une feuille
     * sur la page où l'on est »*. Comme les deux actes de l'inventaire, l'adresse
     * survit — le bouton de l'accueil et le lien profond `/tasks/new` y mènent —, mais
     * elle pose la feuille au lieu d'ouvrir une page.
     */
    const demandeEnCours = vueDemandee === 'new_request';

    const acteDemande: 'remise' | 'retour' | null =
        vueDemandee === 'assignment_wizard'
            ? 'remise'
            : vueDemandee === 'return_wizard'
              ? 'retour'
              : null;
    /*
     * Sans le droit d'agir sur l'inventaire, l'adresse **reste une vue** : le refus se
     * lit, comme avant. Sinon la page dessous s'afficherait normalement, sans feuille
     * et sans un mot — un geste qui ne fait rien est pire qu'un geste refusé.
     */
    const acteEnCours = acteDemande && permissions.canManageInventory ? acteDemande : null;
    const objetDeLActe = acteEnCours ? lireObjetDeLAdresse() : null;

    /*
     * **La page que la feuille couvre.** Quand l'adresse nomme un objet, c'est sa fiche
     * — l'acte parle de lui. Quand elle n'en nomme aucun (l'accueil, le FAB), c'est
     * *« la page où l'on est »* : l'écran précédent, retenu ici, et non l'inventaire,
     * qui ferait changer d'écran un geste qui n'en change pas.
     */
    const ecranPrecedent = useRef<{ view: ViewType; id: string | null }>({
        view: 'dashboard',
        id: null,
    });
    useEffect(() => {
        if (!acteDemande && vueDemandee !== 'new_request') {
            ecranPrecedent.current = { view: vueDemandee, id: selectedIdRoute };
        }
    }, [acteDemande, vueDemandee, selectedIdRoute]);

    const currentView: ViewType = acteEnCours
        ? objetDeLActe
            ? 'equipment_details'
            : ecranPrecedent.current.view
        : demandeEnCours
          ? ecranPrecedent.current.view
          : vueDemandee;
    const selectedItemId =
        acteEnCours || demandeEnCours
            ? (acteEnCours ? objetDeLActe : null) || ecranPrecedent.current.id
            : selectedIdRoute;

    /**
     * **La clôture d'un acte engagé depuis une feuille** — 06.3, forme 2 : *« rien de
     * visible n'a changé, l'effet est chez quelqu'un d'autre »*. La feuille se referme
     * sur la page d'où l'on vient, et cette page ne sait rien de ce qui vient d'être
     * fait : c'est la coque qui a ouvert la feuille, c'est donc elle qui porte l'accusé.
     *
     * Il **reste jusqu'à la sortie de l'écran**, et pas une seconde de plus.
     */
    const [cloture, setCloture] = useState<(ClosureBannerProps & { vue: ViewType }) | null>(null);
    /*
     * Il est posé **avant** la navigation qui referme la feuille : le nettoyer sur tout
     * changement de vue l'effaçait donc à l'instant même où il apparaissait. Il nomme
     * l'écran auquel il appartient, et ne s'efface qu'en le quittant.
     */
    useEffect(() => {
        setCloture((precedente) =>
            precedente && precedente.vue !== currentView ? null : precedente,
        );
    }, [currentView, selectedIdRoute]);

    /** Refermer une feuille, c'est revenir à la page qu'elle couvrait, jamais quitter. */
    const revenirDerriereLaFeuille = () => {
        if (ecranPrecedent.current.id) {
            navigateToItem(ecranPrecedent.current.view, ecranPrecedent.current.id);
        } else handleViewChange(ecranPrecedent.current.view);
    };

    const fermerLActe = () => {
        if (objetDeLActe) navigateToItem('equipment_details', objetDeLActe);
        else if (ecranPrecedent.current.id) {
            navigateToItem(ecranPrecedent.current.view, ecranPrecedent.current.id);
        } else handleViewChange(ecranPrecedent.current.view);
    };
    const [inventoryFilter, setInventoryFilter] = useState<string | null>(null);
    /**
     * Le site reçu par une liste qu'on ouvre depuis la fiche d'un site (10.1, C2 :
     * *« ouvre la liste des équipements, filtrée sur ce site »*). Il ne survit pas à
     * une navigation ordinaire vers la même liste : on n'arrive filtré que quand on
     * vient d'un écran qui a désigné le périmètre.
     */
    const [scopedSite, setScopedSite] = useState<string | null>(null);

    const handleViewChange = (view: ViewType) => {
        if (view === 'equipment') setInventoryFilter(null);
        if (view === 'equipment' || view === 'users') setScopedSite(null);
        navigateToView(view);
        scrollAppToTop();
    };

    const handleItemClick = (view: ViewType, id: string) => {
        navigateToItem(view, id);
        scrollAppToTop();
    };

    const handleNavigate = (path: string) => {
        if (path.startsWith('/inventory/site/')) {
            setScopedSite(decodeURIComponent(path.split('/inventory/site/')[1]));
            setInventoryFilter(null);
            navigateToView('equipment');
            scrollAppToTop();
        } else if (path.startsWith('/users/site/')) {
            setScopedSite(decodeURIComponent(path.split('/users/site/')[1]));
            navigateToView('users');
            scrollAppToTop();
        } else if (path.startsWith('/inventory/filter/')) {
            const status = decodeURIComponent(path.split('/inventory/filter/')[1]);
            setInventoryFilter(status);
            navigateToView('equipment');
        } else if (path === '/inventory') {
            setInventoryFilter(null);
            navigateToView('equipment');
        } else {
            /*
             * Toute autre adresse part au routeur telle quelle. La liste ci-dessus ne
             * couvrait que les renvois porteurs d'un périmètre ; les trois autres —
             * `/users/<id>`, `/settings/account`, `/documentation/ui-flow-map` — tombaient
             * dans le vide, et les rangées du menu de compte (planche 03.1) ne faisaient
             * rien du tout. Un `else` muet transforme chaque nouvelle destination en
             * geste mort.
             */
            navigate(path);
            scrollAppToTop();
        }
    };

    const bottomNavViews: ViewType[] = [
        'dashboard',
        'equipment',
        'equipment_details',
        'tasks',
        'users',
        'user_details',
        'finance',
        'finance_expenses',
        'management',
        'rbac',
        'category_details',
        'model_details',
        'locations',
        'site_details',
        'audit',
        'audit_details',
        'reports',
        'settings',
    ];
    /*
     * **Le régime de sélection prend le bas de l'écran** (17.2). La barre du haut est
     * remplacée par le compte, et le pied d'actes prend la place de la navigation :
     * *« l'écran change de régime ; il ne gagne pas une couche »*. Empiler les deux
     * ferait 140 px de chrome au bas d'un téléphone, et la planche ne dessine jamais
     * la navigation sous les actes d'une sélection.
     */
    const [enSelection, setEnSelection] = useState(false);
    const regimeSelection = useMemo(
        () => ({ active: enSelection, declare: setEnSelection }),
        [enSelection],
    );

    const usesBottomNavShortcuts =
        isCompact && !isCompactLandscape && bottomNavViews.includes(currentView);
    const showBottomNav = usesBottomNavShortcuts && !isMobileMenuOpen && !enSelection;

    /* La barre du bas publie sa hauteur à la racine du document. Le retour transitoire
       (17.5) est monté par `ToastProvider`, en dehors de cet arbre : il ne peut pas hériter
       d'une variable posée ici, et il doit pourtant se poser au-dessus de la barre sans
       jamais la recouvrir. Hors session — la connexion est montée hors d'`AppLayout` — la
       variable retombe à 0 et le snackbar reprend ses 12 px de bord. */
    useEffect(() => {
        const root = document.documentElement;
        // 64 px — la hauteur que 17.7 déclare depuis la passe du 05/09 (elle valait 56).
        // En sélection, c'est le pied d'actes qui occupe le bas : 12 + 48 + 16 (17.2).
        const hauteur = enSelection ? '76px' : showBottomNav ? '64px' : '0px';
        root.style.setProperty('--tk-size-bottom-bar', hauteur);
        return () => root.style.setProperty('--tk-size-bottom-bar', '0px');
    }, [showBottomNav, enSelection]);

    /**
     * Vues passées à l'ADN mobile (DESIGN_BRIEF.md §5) : elles portent elles-mêmes
     * l'en-tête « titre 22 + sous-titre contextuel » ou leur propre barre de détail.
     */
    const adnMobileViews: ViewType[] = [
        'audit',
        'audit_details',
        'equipment',
        'equipment_details',
        'users',
        'user_details',
        'dashboard',
        'tasks',
        'model_details',
        'category_details',
        'settings',
        'rbac',
        'finance_expenses',
        /* Emplacements et la fiche d'un site portent la barre de 04.1 et celle de la
           fiche : la barre du haut redirait la destination une ligne plus bas. */
        'locations',
        'site_details',
        /* Le Catalogue porte désormais la barre de 04.1 — titre, filet, geste —
           comme les quatre autres listes du gabarit : la barre du haut la
           redirait une ligne plus bas. */
        'management',
        /* Le détail d'une demande (06.5) porte sa propre barre « Demande » : la
           barre du haut ajoutait un « Tracker » au-dessus, deux bandes pour une
           seule identité. */
        'approval_details',
        /* L'Historique (18.1) prend le gabarit de liste 17.8, qui porte son titre :
           la barre du haut l'écrivait une seconde fois, juste au-dessus. */
        'history',
        /* Finances (15.1) porte son `.top` depuis le 07/09, avec son titre en 28 : la
           barre du haut écrivait « Finances » au-dessus de « Finances ». */
        'finance',
        /*
          **Les pages plein écran portent déjà leur barre**, et elles en recevaient une
          seconde. `FullScreenFormLayout` et `ReferentialImportTemplate` posent le `.tbar`
          des planches — 56, titre 17 sur 24 — ; la barre du haut écrivait au-dessus
          « Équipement » puis « Nouvel équipement », « Import utilisateurs » puis
          « Importer des utilisateurs » : **deux barres, deux mesures, un écran**.
        */
        'add_equipment',
        'edit_equipment',
        'import_equipment',
        'add_user',
        'edit_user',
        'import_users',
        'import_models',
        'import_locations',
        /* Ajouter une catégorie ou un modèle, c'est le Catalogue **et une boîte
           par-dessus** : la barre du haut y redisait « Catalogue » au-dessus du `.top`
           du Catalogue. */
        'add_category',
        'add_model',
        /* Les Rapports portent le `.top` des destinations depuis le 10/09. */
        'reports',
    ];
    const showTopAppBar = isCompact && !isCompactLandscape && !adnMobileViews.includes(currentView);

    const getTopAppBarTitle = (view: ViewType): string => {
        switch (view) {
            // Sections : libellés issus du registre unique de destinations (X1)
            case 'dashboard':
                return DESTINATIONS.dashboard.label;
            case 'tasks':
                return 'Tâches';
            case 'equipment':
                return DESTINATIONS.equipment.label;
            case 'equipment_details':
                return 'Détail équipement';
            case 'add_equipment':
            case 'edit_equipment':
                return 'Équipement';
            case 'import_equipment':
                return 'Import équipements';
            case 'users':
                return DESTINATIONS.users.label;
            case 'user_details':
                return 'Profil utilisateur';
            case 'add_user':
            case 'edit_user':
                return 'Utilisateur';
            case 'import_users':
                return 'Import utilisateurs';
            case 'finance':
                return DESTINATIONS.finance.label;
            case 'finance_expenses':
                return 'Journal des dépenses';
            case 'management':
                return DESTINATIONS.management.label;
            case 'add_category':
            case 'add_model':
                return DESTINATIONS.management.label;
            case 'rbac':
                return DESTINATIONS.rbac.label;
            case 'category_details':
                return 'Détail catégorie';
            case 'model_details':
                return 'Détail modèle';
            case 'import_models':
                return 'Import modèles';
            case 'locations':
                return DESTINATIONS.locations.label;
            case 'site_details':
                return 'Détail site';
            case 'import_locations':
                return 'Import emplacements';
            case 'audit':
                return DESTINATIONS.audit.label;
            case 'audit_details':
                return 'Détail audit';
            case 'history':
                return DESTINATIONS.history.label;
            case 'reports':
                return DESTINATIONS.reports.label;
            case 'settings':
                return DESTINATIONS.settings.label;
            case 'not_found':
                return 'Page introuvable';
            default:
                return APP_CONFIG.appName;
        }
    };

    useEffect(() => {
        if (isExpandedUp && isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [isExpandedUp, isMobileMenuOpen]);

    const renderContent = () => {
        const canAccessView = (view: ViewType): boolean => {
            if (
                view === 'add_equipment' ||
                view === 'edit_equipment' ||
                view === 'import_equipment'
            ) {
                return permissions.canManageInventory;
            }
            if (view === 'assignment_wizard' || view === 'return_wizard') {
                return permissions.canManageInventory;
            }
            /*
             * « Mon profil » du menu de compte (03.1) ouvre sa **propre** fiche. C'est la
             * même vue que l'annuaire, mais pas le même acte : un employé n'a pas
             * `users:read` et se voyait refuser sa propre page.
             */
            if (view === 'user_details' && selectedItemId && selectedItemId === currentUser?.id) {
                return true;
            }
            if (view === 'users' || view === 'user_details') return permissions.canViewUsers;
            if (view === 'add_user' || view === 'edit_user' || view === 'import_users') {
                return permissions.canManageUsers;
            }
            if (view === 'finance' || view === 'finance_expenses') {
                return permissions.canViewFinance || permissions.canManageFinance;
            }
            if (
                view === 'management' ||
                view === 'rbac' ||
                view === 'add_category' ||
                view === 'add_model' ||
                view === 'import_models' ||
                view === 'category_details' ||
                view === 'model_details'
            ) {
                return permissions.canViewManagement || permissions.canManageSystem;
            }
            if (view === 'locations' || view === 'site_details' || view === 'import_locations') {
                return permissions.canViewLocations || permissions.canManageLocations;
            }
            if (view === 'audit' || view === 'audit_details') {
                return (
                    permissions.canViewAudit ||
                    permissions.canScanAudit ||
                    permissions.canManageAudit
                );
            }
            if (view === 'reports') return permissions.canViewReports;
            return true;
        };

        if (!canAccessView(currentView)) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-display-small mb-4">Accès refusé</h2>
                    <p className="text-body-large text-on-surface-variant mb-6">
                        Vous n'avez pas les permissions nécessaires pour cette page.
                    </p>
                    <Button variant="filled" onClick={() => handleViewChange('dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            );
        }

        switch (currentView) {
            case 'dashboard':
                return (
                    <DashboardPage onViewChange={handleViewChange} onNavigate={handleNavigate} />
                );
            case 'equipment':
                return (
                    <InventoryPage
                        onViewChange={handleViewChange}
                        onEquipmentClick={(id) => handleItemClick('equipment_details', id)}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                        initialStatus={inventoryFilter}
                        initialSite={scopedSite}
                    />
                );
            case 'equipment_details':
                return selectedItemId ? (
                    <EquipmentDetailsPage
                        equipmentId={selectedItemId}
                        onBack={() => handleViewChange('equipment')}
                    />
                ) : (
                    <InventoryPage onViewChange={handleViewChange} />
                );
            case 'add_equipment':
                return <AddEquipmentPage onCancel={() => goBack()} onSave={() => goBack()} />;
            case 'edit_equipment':
                return selectedItemId ? (
                    <AddEquipmentPage
                        equipmentId={selectedItemId}
                        onCancel={() => handleItemClick('equipment_details', selectedItemId)}
                        onSave={() => handleItemClick('equipment_details', selectedItemId)}
                    />
                ) : (
                    <InventoryPage onViewChange={handleViewChange} />
                );
            case 'import_equipment':
                /* Les deux imports du parc et de l'équipe recevaient `onViewChange`
                   quand ils attendent `onCancel` / `onSave` : refermer ou enregistrer
                   levait « onSave is not a function ». Les imports de 09.2 (modèles,
                   emplacements) étaient, eux, montés correctement. */
                return (
                    <ImportEquipmentPage
                        onCancel={() => handleViewChange('equipment')}
                        onSave={() => handleViewChange('equipment')}
                    />
                );

            case 'users':
                return (
                    <UsersPage
                        onViewChange={handleViewChange}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                        initialSite={scopedSite}
                    />
                );
            case 'user_details':
                return selectedItemId ? (
                    <UserDetailsPage
                        userId={selectedItemId}
                        onBack={() => handleViewChange('users')}
                        onViewChange={handleViewChange}
                        onEquipmentClick={(id) => handleItemClick('equipment_details', id)}
                        onEditUser={(id) => handleItemClick('edit_user', id)}
                    />
                ) : (
                    <UsersPage
                        onViewChange={handleViewChange}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                    />
                );
            case 'add_user':
                return <AddUserPage onCancel={() => goBack()} onSave={() => goBack()} />;
            case 'edit_user':
                return selectedItemId ? (
                    <AddUserPage
                        userId={selectedItemId}
                        onCancel={() => handleItemClick('user_details', selectedItemId)}
                        onSave={() => handleItemClick('user_details', selectedItemId)}
                    />
                ) : (
                    <UsersPage
                        onViewChange={handleViewChange}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                    />
                );
            case 'import_users':
                return (
                    <ImportUsersPage
                        onCancel={() => handleViewChange('users')}
                        onSave={() => handleViewChange('users')}
                    />
                );

            case 'finance':
                return <FinanceManagementPage onViewChange={handleViewChange} onBack={goBack} />;
            case 'finance_expenses':
                return <ExpenseJournalPage onBack={() => handleViewChange('finance')} />;

            case 'management':
                return (
                    <ManagementPage
                        onViewChange={handleViewChange}
                        onCategoryClick={(id) => handleItemClick('category_details', id)}
                        onBack={goBack}
                    />
                );
            case 'add_category':
            case 'add_model':
                return (
                    <ManagementPage
                        onViewChange={handleViewChange}
                        onCategoryClick={(id) => handleItemClick('category_details', id)}
                        initialAddModal={currentView === 'add_category' ? 'category' : 'model'}
                    />
                );
            case 'rbac':
                return <RbacPage onBack={goBack} />;
            case 'category_details':
                return selectedItemId ? (
                    <CategoryDetailsPage
                        categoryId={selectedItemId}
                        onBack={() => handleViewChange('management')}
                        onModelClick={(id) => handleItemClick('model_details', id)}
                    />
                ) : (
                    <ManagementPage onViewChange={handleViewChange} />
                );
            case 'model_details':
                return selectedItemId ? (
                    <ModelDetailsPage
                        modelId={selectedItemId}
                        onBack={() => handleViewChange('management')}
                    />
                ) : (
                    <ManagementPage onViewChange={handleViewChange} />
                );
            case 'import_models':
                return <ImportModelsPage onCancel={() => goBack()} onSave={() => goBack()} />;

            case 'locations':
                return (
                    <LocationsPage
                        onViewChange={handleViewChange}
                        onSiteClick={(site) => handleItemClick('site_details', site)}
                        onBack={goBack}
                    />
                );
            case 'site_details':
                return selectedItemId ? (
                    <SiteDetailsPage
                        siteName={selectedItemId}
                        onBack={() => handleViewChange('locations')}
                        onViewChange={handleViewChange}
                        onNavigate={handleNavigate}
                    />
                ) : (
                    <LocationsPage
                        onViewChange={handleViewChange}
                        onSiteClick={(site) => handleItemClick('site_details', site)}
                    />
                );
            case 'import_locations':
                return <ImportLocationsPage onCancel={() => goBack()} onSave={() => goBack()} />;

            case 'audit':
                return <AuditPage onViewChange={handleViewChange} onBack={goBack} />;
            case 'audit_details':
                return (
                    <AuditDetailsPage
                        onBack={() => handleViewChange('audit')}
                        onViewChange={handleViewChange}
                    />
                );
            case 'history':
                return <HistoryPage onBack={goBack} />;
            case 'reports':
                return <ReportsPage onBack={goBack} />;
            case 'settings':
                return (
                    <SettingsPage
                        onLogout={onLogout}
                        onNavigate={handleViewChange}
                        onBack={goBack}
                        initialSection={routeSegments[1] === 'account' ? 'account' : undefined}
                    />
                );

            case 'tasks':
                // Planche 08.1 : la destination unique des liens du tableau de bord.
                return <TasksPage onNavigate={handleViewChange} onItemClick={handleItemClick} />;
            case 'approval_details':
                return (
                    <ApprovalDetailsPage
                        approvalId={selectedItemId || undefined}
                        onBack={() => handleViewChange('tasks')}
                    />
                );

            case 'not_found':
                /*
                  Planche 17.1 : le « 404 » est un code d'un autre métier, adressé à
                  personne, et « vérifiez le lien » suppose une adresse que personne n'a
                  tapée sur un téléphone. Reste ce qui est vrai, et les deux portes qui
                  servent — empilées, pleine largeur, la primaire d'abord.

                  Porté sur `ScreenState` le 06/09 : introuvable, refusé et hors ligne
                  partagent une seule forme, et celle-ci employait encore la composition
                  héritée (marque de 56, titre d'un autre palier, portes en ligne). Le
                  renvoi dit **l'Historique**, le mot du lexique depuis le 03/09.
                */
                return (
                    <ScreenState
                        icon={MagnifyingGlass}
                        title="Cette page n'existe plus"
                        description="L'équipement ou la personne que vous cherchiez a peut-être été sortie du parc, ou son compte supprimé. Son historique, lui, est conservé dans l'Historique."
                        actions={
                            <>
                                <Button
                                    variant="filled"
                                    className="!rounded-[4px]"
                                    onClick={() => handleViewChange('dashboard')}
                                >
                                    Revenir à l'accueil
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="!rounded-[4px]"
                                    onClick={() => handleViewChange('equipment')}
                                >
                                    Chercher dans les équipements
                                </Button>
                            </>
                        }
                    />
                );

            default:
                return (
                    <div className="p-8 text-center">
                        <h2 className="text-display-small mb-4">Vue non trouvée ({currentView})</h2>
                        <p className="text-body-large text-on-surface-variant mb-6">
                            Cette page est en cours de construction ou le lien est incorrect.
                        </p>
                        <Button variant="filled" onClick={() => handleViewChange('dashboard')}>
                            Retour au tableau de bord
                        </Button>
                    </div>
                );
        }
    };

    return (
        <SelectionRegimeProvider value={regimeSelection}>
            <div className="bg-background flex min-h-screen flex-col font-sans">
                {/* Top App Bar — Mobile Only when active */}
                {/*
                  `onMenuClick` n'existe pas sur `TopAppBar` — la barre n'a qu'un
                  `leadingAction`. Le rappel ouvrait le **tiroir modal** de l'ancienne
                  barre latérale, qui n'est plus monté : au téléphone, le débordement
                  est la feuille « Plus » (17.7).
                */}
                {showTopAppBar && <TopAppBar title={getTopAppBarTitle(currentView)} />}

                <div className="relative flex min-h-0 flex-1">
                    {/*
                      **Une seule barre pour deux régimes** (00.3). Le rail *est* la barre
                      latérale repliée : *« la même liste de destinations, debout »*. Le
                      produit en tenait deux — `NavigationRail` (80 px, quatre entrées, un
                      `onMenuClick` requis que personne ne passait) et `Sidebar` —, avec
                      deux jeux de droits et deux réponses à « où suis-je ». À `medium` la
                      barre est repliée et ne se déploie pas : 00.3 y tient le rail, et
                      264 px sur 768 ne laisseraient pas ses 360 px à une colonne.
                    */}
                    {(isExpandedUp || useRailNavigation) && (
                        <Sidebar
                            currentView={currentView}
                            onViewChange={handleViewChange}
                            isCollapsed={isSidebarCollapsed || !isExpandedUp}
                            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            canExpand={isExpandedUp}
                        />
                    )}

                    {/* Main Content Area */}
                    <main
                        className={`bg-background relative flex min-w-0 flex-1 flex-col ${
                            enSelection ? 'pb-[76px]' : usesBottomNavShortcuts ? 'pb-16' : ''
                        }`}
                    >
                        <ErrorBoundary>
                            {/* L'accusé se pose **en tête de page**, là où la planche le
                                dessine — au-dessus de ce que l'écran montrait déjà. */}
                            {/*
                              **Plus de bandeau « Données de démonstration »** — retiré à la
                              demande du commanditaire (11/09). Il paraissait en tête de
                              chaque page quand Firestore ne répondait pas (quota quotidien
                              épuisé, réseau coupé). Le drapeau `remoteUnavailable` reste
                              exposé par `DataContext` : un écran qui voudrait un jour le
                              dire, à sa place et à sa manière, n'a qu'à le lire.
                            */}

                            {cloture && (
                                <div className="px-4 pt-4">
                                    <ClosureBanner {...cloture} />
                                </div>
                            )}
                            <Suspense fallback={<PageLoadingFallback />}>
                                {renderContent()}
                            </Suspense>
                        </ErrorBoundary>
                    </main>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                {showBottomNav && (
                    <NavigationBar currentView={currentView} onViewChange={handleViewChange} />
                )}

                {/* 06.4 — demander un équipement, sur la page où l'on est. */}
                <RequestSheet
                    open={demandeEnCours}
                    onClose={revenirDerriereLaFeuille}
                    onSent={(envoi) =>
                        setCloture({
                            vue: ecranPrecedent.current.view,
                            tone: 'bleu',
                            glyph: PaperPlaneTilt,
                            title: 'Demande envoyée',
                            detail: `${envoi.type} · chez ${envoi.destination}`,
                        })
                    }
                />

                {/* Les deux actes de l'inventaire — la feuille, jamais l'assistant. */}
                {acteEnCours && (
                    <>
                        <HandoverActSheet
                            open={acteEnCours === 'remise'}
                            onClose={fermerLActe}
                            initialEquipmentId={objetDeLActe || undefined}
                        />
                        <ReturnActSheet
                            open={acteEnCours === 'retour'}
                            onClose={fermerLActe}
                            initialEquipmentId={objetDeLActe || undefined}
                        />
                    </>
                )}
            </div>
        </SelectionRegimeProvider>
    );
};

export default AppLayout;
