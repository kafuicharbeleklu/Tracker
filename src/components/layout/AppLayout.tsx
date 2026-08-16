import { MEDIA } from '../../constants/breakpoints';
import { DESTINATIONS } from '../../constants/destinations';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { NavigationBar } from './NavigationBar';
import { NavigationRail } from './NavigationRail';
import TopAppBar from './TopAppBar';
import { ViewType } from '../../types';
import Button from '../ui/Button';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { APP_CONFIG } from '../../config';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { EmptyState } from '../ui/EmptyState';
import { useAccessControl } from '../../hooks/useAccessControl';
import { SkeletonList } from '../ui/Skeleton';

const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
const TasksPage = lazy(() => import('../../features/tasks/pages/TasksPage'));
const ApprovalsPage = lazy(() => import('../../features/approvals/pages/ApprovalsPage'));
const NewRequestPage = lazy(() => import('../../features/approvals/pages/NewRequestPage'));
const FinanceManagementPage = lazy(() => import('../../features/finance/pages/FinanceManagementPage'));
const ManagementPage = lazy(() => import('../../features/management/pages/ManagementPage'));
const RbacPage = lazy(() => import('../../features/management/pages/RbacPage'));
const LocationsPage = lazy(() => import('../../features/locations/pages/LocationsPage'));
const AuditPage = lazy(() => import('../../features/audit/pages/AuditPage'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('../../features/management/pages/SettingsPage'));
const AssignmentWizardPage = lazy(() => import('../../features/inventory/pages/AssignmentWizardPage'));
const ReturnWizardPage = lazy(() => import('../../features/inventory/pages/ReturnWizardPage'));
const ImportEquipmentPage = lazy(() => import('../../features/inventory/pages/ImportEquipmentPage'));
const AddEquipmentPage = lazy(() => import('../../features/inventory/pages/AddEquipmentPage'));
const AddUserPage = lazy(() => import('../../features/users/pages/AddUserPage'));
const ImportUsersPage = lazy(() => import('../../features/users/pages/ImportUsersPage'));
const EquipmentDetailsPage = lazy(() => import('../../features/inventory/pages/EquipmentDetailsPage'));
const UserDetailsPage = lazy(() => import('../../features/users/pages/UserDetailsPage'));
const CategoryDetailsPage = lazy(() => import('../../features/management/pages/CategoryDetailsPage'));
const ModelDetailsPage = lazy(() => import('../../features/management/pages/ModelDetailsPage'));
const ImportModelsPage = lazy(() => import('../../features/management/pages/ImportModelsPage'));
const ImportLocationsPage = lazy(() => import('../../features/locations/pages/ImportLocationsPage'));
const AuditDetailsPage = lazy(() => import('../../features/audit/pages/AuditDetailsPage'));

interface AppLayoutProps {
    onLogout: () => void;
}

/**
 * Attente d'une vue — planche 12.1, registre §2.39 : on montre **la forme de ce qui
 * arrive**, pas un tourniquet. La place est tenue, donc l'écran ne saute pas à
 * l'arrivée de la donnée ; et « Chargement de la vue » nommait la mécanique, pas ce
 * que la personne attend.
 */
const PageLoadingFallback: React.FC = () => (
    <div data-testid="route-loading-fallback" className="p-4 medium:p-6">
        <SkeletonList rows={4} />
    </div>
);

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isCompact = useMediaQuery(MEDIA.compact);
    const isLandscape = useMediaQuery(MEDIA.landscape);
    const isMedium = useMediaQuery(MEDIA.medium);
    const isExpandedUp = useMediaQuery(MEDIA.expandedUp);
    const isCompactLandscape = isCompact && isLandscape;
    const useRailNavigation = isMedium || isCompactLandscape;

    const { currentView, selectedId: selectedItemId, navigateToView, navigateToItem, goBack } = useAppNavigation();
    const { permissions } = useAccessControl();
    const [inventoryFilter, setInventoryFilter] = useState<string | null>(null);

    const handleViewChange = (view: ViewType) => {
        if (view === 'equipment') setInventoryFilter(null);
        navigateToView(view);
        window.scrollTo(0, 0);
    };

    const handleItemClick = (view: ViewType, id: string) => {
        navigateToItem(view, id);
        window.scrollTo(0, 0);
    };

    const handleNavigate = (path: string) => {
        if (path.startsWith('/inventory/filter/')) {
            const status = decodeURIComponent(path.split('/inventory/filter/')[1]);
            setInventoryFilter(status);
            navigateToView('equipment');
        } else if (path === '/inventory') {
            setInventoryFilter(null);
            navigateToView('equipment');
        }
    };

    const bottomNavViews: ViewType[] = [
        'dashboard',
        'equipment',
        'equipment_details',
        'tasks',
        'approvals',
        'users',
        'user_details',
        'finance',
        'management',
        'rbac',
        'category_details',
        'model_details',
        'locations',
        'audit',
        'audit_details',
        'reports',
        'settings',
    ];
    const usesBottomNavShortcuts = isCompact && !isCompactLandscape && bottomNavViews.includes(currentView);
    const showBottomNav = usesBottomNavShortcuts && !isMobileMenuOpen;

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
    ];
    const showTopAppBar = isCompact && !isCompactLandscape && !adnMobileViews.includes(currentView);

    const getTopAppBarTitle = (view: ViewType): string => {
        switch (view) {
            // Sections : libellés issus du registre unique de destinations (X1)
            case 'dashboard': return DESTINATIONS.dashboard.label;
            case 'tasks': return 'Tâches';
            case 'equipment': return DESTINATIONS.equipment.label;
            case 'equipment_details': return 'Détail équipement';
            case 'add_equipment':
            case 'edit_equipment': return 'Équipement';
            case 'import_equipment': return 'Import équipements';
            case 'users': return DESTINATIONS.users.label;
            case 'user_details': return 'Profil utilisateur';
            case 'add_user':
            case 'edit_user': return 'Utilisateur';
            case 'import_users': return 'Import utilisateurs';
            case 'approvals': return DESTINATIONS.approvals.label;
            case 'new_request': return 'Nouvelle demande';
            case 'finance': return DESTINATIONS.finance.label;
            case 'management': return DESTINATIONS.management.label;
            case 'add_category':
            case 'add_model': return DESTINATIONS.management.label;
            case 'rbac': return DESTINATIONS.rbac.label;
            case 'category_details': return 'Détail catégorie';
            case 'model_details': return 'Détail modèle';
            case 'import_models': return 'Import modèles';
            case 'locations': return DESTINATIONS.locations.label;
            case 'import_locations': return 'Import emplacements';
            case 'audit': return DESTINATIONS.audit.label;
            case 'audit_details': return 'Détail audit';
            case 'reports': return DESTINATIONS.reports.label;
            case 'settings': return DESTINATIONS.settings.label;
            case 'assignment_wizard': return 'Attribution';
            case 'return_wizard': return 'Retour';
            case 'not_found': return 'Page introuvable';
            default: return APP_CONFIG.appName;
        }
    };

    useEffect(() => {
        if (isExpandedUp && isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [isExpandedUp, isMobileMenuOpen]);

    const renderContent = () => {
        const canAccessView = (view: ViewType): boolean => {
            if (view === 'add_equipment' || view === 'edit_equipment' || view === 'import_equipment') {
                return permissions.canManageInventory;
            }
            if (view === 'assignment_wizard' || view === 'return_wizard') {
                return permissions.canManageInventory;
            }
            if (view === 'users' || view === 'user_details') return permissions.canViewUsers;
            if (view === 'add_user' || view === 'edit_user' || view === 'import_users') {
                return permissions.canManageUsers;
            }
            if (view === 'finance') return permissions.canViewFinance || permissions.canManageFinance;
            if (
                view === 'management'
                || view === 'rbac'
                || view === 'add_category'
                || view === 'add_model'
                || view === 'import_models'
                || view === 'category_details'
                || view === 'model_details'
            ) {
                return permissions.canViewManagement || permissions.canManageSystem;
            }
            if (view === 'locations' || view === 'import_locations') {
                return permissions.canViewLocations || permissions.canManageLocations;
            }
            if (view === 'audit' || view === 'audit_details') {
                return permissions.canViewAudit || permissions.canScanAudit || permissions.canManageAudit;
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
                    <DashboardPage
                        onViewChange={handleViewChange}
                        onNavigate={handleNavigate}
                    />
                );
            case 'equipment':
                return (
                    <InventoryPage
                        onViewChange={handleViewChange}
                        onEquipmentClick={(id) => handleItemClick('equipment_details', id)}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                        initialStatus={inventoryFilter}
                    />
                );
            case 'equipment_details':
                return selectedItemId ? (
                    <EquipmentDetailsPage
                        equipmentId={selectedItemId}
                        onBack={() => handleViewChange('equipment')}
                    />
                ) : <InventoryPage onViewChange={handleViewChange} />;
            case 'add_equipment':
                return <AddEquipmentPage onCancel={() => goBack()} onSave={() => goBack()} />;
            case 'edit_equipment':
                return selectedItemId ? (
                    <AddEquipmentPage
                        equipmentId={selectedItemId}
                        onCancel={() => handleItemClick('equipment_details', selectedItemId)}
                        onSave={() => handleItemClick('equipment_details', selectedItemId)}
                    />
                ) : <InventoryPage onViewChange={handleViewChange} />;
            case 'import_equipment':
                return <ImportEquipmentPage onViewChange={handleViewChange} />;

            case 'users':
                return (
                    <UsersPage
                        onViewChange={handleViewChange}
                        onUserClick={(id) => handleItemClick('user_details', id)}
                    />
                );
            case 'user_details':
                return selectedItemId ? (
                    <UserDetailsPage
                        userId={selectedItemId}
                        onBack={() => handleViewChange('users')}
                        onViewChange={handleViewChange}
                        onEquipmentClick={(id) => handleItemClick('equipment_details', id)}
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
                return <ImportUsersPage onViewChange={handleViewChange} />;

            case 'approvals':
                return <ApprovalsPage />;
            case 'new_request':
                return <NewRequestPage onViewChange={handleViewChange} />;
            case 'finance':
                return <FinanceManagementPage />;

            case 'management':
                return (
                    <ManagementPage
                        onViewChange={handleViewChange}
                        onCategoryClick={(id) => handleItemClick('category_details', id)}
                        onModelClick={(id) => handleItemClick('model_details', id)}
                    />
                );
            case 'add_category':
            case 'add_model':
                return (
                    <ManagementPage
                        onViewChange={handleViewChange}
                        onCategoryClick={(id) => handleItemClick('category_details', id)}
                        onModelClick={(id) => handleItemClick('model_details', id)}
                        initialAddModal={currentView === 'add_category' ? 'category' : 'model'}
                    />
                );
            case 'rbac':
                return <RbacPage />;
            case 'category_details':
                return selectedItemId ? (
                    <CategoryDetailsPage
                        categoryId={selectedItemId}
                        onBack={() => handleViewChange('management')}
                    />
                ) : <ManagementPage onViewChange={handleViewChange} />;
            case 'model_details':
                return selectedItemId ? (
                    <ModelDetailsPage
                        modelId={selectedItemId}
                        onBack={() => handleViewChange('management')}
                    />
                ) : <ManagementPage onViewChange={handleViewChange} />;
            case 'import_models':
                return <ImportModelsPage onCancel={() => goBack()} onSave={() => goBack()} />;

            case 'locations':
                return <LocationsPage />;
            case 'import_locations':
                return <ImportLocationsPage onCancel={() => goBack()} onSave={() => goBack()} />;

            case 'audit':
                return <AuditPage onViewChange={handleViewChange} />;
            case 'audit_details':
                return (
                    <AuditDetailsPage
                        onBack={() => handleViewChange('audit')}
                        onViewChange={handleViewChange}
                    />
                );
            case 'reports':
                return <ReportsPage />;
            case 'settings':
                return <SettingsPage onLogout={onLogout} onNavigate={handleViewChange} />;

            // Wizards & Forms
            case 'assignment_wizard':
                return (
                    <AssignmentWizardPage
                        initialEquipmentId={selectedItemId || undefined}
                        onCancel={() => handleViewChange('equipment')}
                        onComplete={() => handleViewChange('equipment')}
                    />
                );
            case 'return_wizard':
                return (
                    <ReturnWizardPage
                        initialEquipmentId={selectedItemId || undefined}
                        onCancel={() => handleViewChange('equipment')}
                        onComplete={() => handleViewChange('equipment')}
                    />
                );

            case 'tasks':
                // Planche 03.3 : la destination unique des liens du tableau de bord.
                return <TasksPage onNavigate={handleViewChange} onItemClick={handleItemClick} />;

            case 'not_found':
                // Planche 12.1 : le « 404 » est un code d'un autre métier, adressé à
                // personne, et « vérifiez le lien » suppose une adresse que personne n'a
                // tapée sur un téléphone. Reste ce qui est vrai — et les deux portes qui servent.
                return (
                    <EmptyState
                        className="min-h-[60vh]"
                        icon="search_off"
                        title="Cette page n'existe plus"
                        description="L'équipement ou la personne que vous cherchiez a peut-être été sorti du parc, ou son compte supprimé. L'historique, lui, est conservé dans l'audit."
                        action={
                            <div className="flex flex-col medium:flex-row gap-3">
                                <Button variant="filled" onClick={() => handleViewChange('dashboard')}>
                                    Revenir à l'accueil
                                </Button>
                                <Button variant="tonal" onClick={() => handleViewChange('equipment')}>
                                    Chercher dans les équipements
                                </Button>
                            </div>
                        }
                    />
                );

            default:
                return (
                    <div className="p-8 text-center">
                        <h2 className="text-display-small mb-4">Vue non trouvée ({currentView})</h2>
                        <p className="text-body-large text-on-surface-variant mb-6">Cette page est en cours de construction ou le lien est incorrect.</p>
                        <Button variant="filled" onClick={() => handleViewChange('dashboard')}>
                            Retour au tableau de bord
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Top App Bar — Mobile Only when active */}
            {showTopAppBar && (
                <TopAppBar
                    title={getTopAppBarTitle(currentView)}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />
            )}

            <div className="flex flex-1 relative min-h-0">
                {/* Desktop Sidebar */}
                {isExpandedUp && (
                    <Sidebar
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        onLogout={onLogout}
                    />
                )}

                {/* Tablet Navigation Rail */}
                {useRailNavigation && (
                    <NavigationRail
                        currentView={currentView}
                        onViewChange={handleViewChange}
                    />
                )}

                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col min-w-0 bg-background relative ${usesBottomNavShortcuts ? 'pb-16' : ''}`}>
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoadingFallback />}>
                            {renderContent()}
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            {showBottomNav && (
                <NavigationBar
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    onLogout={onLogout}
                />
            )}
        </div>
    );
};

export default AppLayout;
