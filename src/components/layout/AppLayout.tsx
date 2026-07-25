import { MEDIA } from '../../constants/breakpoints';
import { DESTINATIONS } from '../../constants/destinations';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { NavigationBar } from './NavigationBar';
import { NavigationRail } from './NavigationRail';
import TopAppBar from './TopAppBar';
import BottomAppBar from './BottomAppBar';
import { ViewType } from '../../types';
import Button from '../ui/Button';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { APP_CONFIG } from '../../config';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { useAccessControl } from '../../hooks/useAccessControl';

const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
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

import LoadingSpinner from '../ui/LoadingSpinner';

const PageLoadingFallback: React.FC = () => (
    <div data-testid="route-loading-fallback" className="flex items-center justify-center h-full min-h-[50vh]">
        <LoadingSpinner size="lg" text="Chargement de la vue..." />
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
        'approvals',
        'users',
        'finance',
        'management',
        'rbac',
        'locations',
        'audit',
        'reports',
        'settings',
    ];
    const usesBottomNavShortcuts = isCompact && !isCompactLandscape && bottomNavViews.includes(currentView);
    const showBottomNav = usesBottomNavShortcuts && !isMobileMenuOpen;
    const showTopAppBar = isCompact && !isCompactLandscape;

    const getTopAppBarTitle = (view: ViewType): string => {
        switch (view) {
            // Sections : libellés issus du registre unique de destinations (X1)
            case 'dashboard': return DESTINATIONS.dashboard.label;
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
                return <DashboardPage onViewChange={handleViewChange} onNavigate={handleNavigate} />;
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
                ) : <UsersPage onViewChange={handleViewChange} />;
            case 'add_user':
                return <AddUserPage onCancel={() => goBack()} onSave={() => goBack()} />;
            case 'edit_user':
                return selectedItemId ? (
                    <AddUserPage
                        userId={selectedItemId}
                        onCancel={() => handleItemClick('user_details', selectedItemId)}
                        onSave={() => handleItemClick('user_details', selectedItemId)}
                    />
                ) : <UsersPage onViewChange={handleViewChange} />;
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
                // AddCategoryPage/AddModelPage sont des modales de ManagementPage, pas des
                // pages routées : le lien profond rend la liste parente, modale déjà ouverte.
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
                return <SettingsPage onLogout={onLogout} />;

            // Wizards & Forms
            case 'assignment_wizard':
                return (
                    <AssignmentWizardPage
                        onCancel={() => handleViewChange('equipment')}
                        onComplete={() => handleViewChange('equipment')}
                    />
                );
            case 'return_wizard':
                return (
                    <ReturnWizardPage
                        onCancel={() => handleViewChange('equipment')}
                        onComplete={() => handleViewChange('equipment')}
                    />
                );

            case 'not_found':
                return (
                    <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center text-center">
                        <p className="text-display-large font-bold text-outline mb-2" aria-hidden="true">404</p>
                        <h2 className="text-display-small mb-4">Page introuvable</h2>
                        <p className="text-body-large text-on-surface-variant mb-6 max-w-md">
                            L'adresse demandée n'existe pas ou n'est plus disponible. Vérifiez le lien ou revenez à l'accueil.
                        </p>
                        <Button variant="filled" onClick={() => handleViewChange('dashboard')}>
                            Retour au tableau de bord
                        </Button>
                    </div>
                );

            default:
                // Fallback for views not yet implemented or imported
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
        <div className="flex h-dvh bg-[var(--color-app-bg)] overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                currentView={currentView}
                onViewChange={handleViewChange}
                onSettingsClick={() => handleViewChange('settings')}
                onLogout={onLogout}
                subtractPrimaryDestinations={useRailNavigation || usesBottomNavShortcuts}
                isModalMode={!isExpandedUp}
                isMobileOpen={isMobileMenuOpen}
                closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            {/* MD3 Navigation Rail: medium + compact landscape */}
            {useRailNavigation && !isMobileMenuOpen && (
                <NavigationRail
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    compact={isCompactLandscape}
                    className="shrink-0"
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Top App Bar */}
                {showTopAppBar && (
                    <TopAppBar
                        title={getTopAppBarTitle(currentView)}
                        leadingAction={showBottomNav ? undefined : {
                            icon: 'menu',
                            label: 'Ouvrir le menu',
                            onClick: () => setIsMobileMenuOpen(true),
                        }}
                        className="shrink-0"
                        titleClassName="text-title-medium"
                    />
                )}

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto bg-[var(--color-app-bg)] relative">
                    {/* Filet par vue (#17) : la `key` remonte le boundary à chaque navigation,
                        donc la coque de nav suffit à sortir d'une page cassée — sans recharger. */}
                    <ErrorBoundary key={currentView} context={`vue: ${currentView}`}>
                        <Suspense fallback={<PageLoadingFallback />}>
                            {renderContent()}
                        </Suspense>
                    </ErrorBoundary>
                </div>

                {showBottomNav && (
                    <BottomAppBar className="shrink-0">
                        <NavigationBar
                            currentView={currentView}
                            onViewChange={handleViewChange}
                            onMoreClick={() => setIsMobileMenuOpen(true)}
                            embedded
                        />
                    </BottomAppBar>
                )}
            </main>
        </div>
    );
};

export default AppLayout;












