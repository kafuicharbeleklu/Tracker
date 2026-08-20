import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import SidebarItem from './SidebarItem';
import { ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import { DESTINATIONS } from '../../constants/destinations';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { APP_CONFIG } from '../../config';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onSettingsClick: () => void;
    /** Déconnexion à 2 taps depuis le tiroir modal (§9.3) — non rendue en sidebar permanente. */
    onLogout?: () => void;
    /** Tiroir = complément de la barre/rail (§9.8, renverse Top 10 #3) : masque les 4
        destinations primaires que la barre du bas ou le rail porte déjà — même fonction
        pure des permissions que NavigationBar/NavigationRail, donc résultat identique
        quelle que soit la page d'ouverture. Laisser false quand aucune barre n'est rendue
        (fiches compactes : le tiroir est l'unique nav → tout afficher). */
    subtractPrimaryDestinations?: boolean;
    className?: string;
    isModalMode?: boolean;
    isMobileOpen?: boolean;
    closeMobileMenu?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
    currentView,
    onViewChange,
    onSettingsClick,
    onLogout,
    subtractPrimaryDestinations = false,
    className,
    isModalMode = true,
    isMobileOpen = false,
    closeMobileMenu,
}) => {
    const { currentUser } = useAuth();
    const { permissions } = useAccessControl();
    const { approvals, users } = useData();
    const drawerRef = useRef<HTMLElement | null>(null);
    const previousFocusedElementRef = useRef<HTMLElement | null>(null);

    const handleItemClick = (view: ViewType) => {
        onViewChange(view);
        if (closeMobileMenu) closeMobileMenu();
    };
    const showModalDrawer = isModalMode && isMobileOpen;
    const hidePrimary = isModalMode && subtractPrimaryDestinations;

    const role = currentUser?.role;

    const relevantApprovals = useMemo(() => {
        if (!currentUser) return [];

        if (role === 'User') {
            return approvals.filter((a) => a.requester === currentUser.name);
        }

        if (role === 'Manager') {
            const teamUserNames = users
                .filter((u) => u.managerId === currentUser.id)
                .map((u) => u.name);
            teamUserNames.push(currentUser.name);

            return approvals.filter((a) => teamUserNames.includes(a.requester));
        }

        return approvals;
    }, [approvals, currentUser, users, role]);

    const ACTIVE_APPROVAL_STATUSES = new Set([
        'WAITING_MANAGER_APPROVAL',
        'WAITING_IT_PROCESSING',
        'WAITING_DOTATION_APPROVAL',
        'PENDING_DELIVERY',
    ]);

    const pendingCount = relevantApprovals.filter((a) =>
        ACTIVE_APPROVAL_STATUSES.has(a.status),
    ).length;
    const isNavSectionActive = (
        section:
            | 'dashboard'
            | 'equipment'
            | 'users'
            | 'tasks'
            | 'finance'
            | 'management'
            | 'rbac'
            | 'locations'
            | 'audit'
            | 'reports'
            | 'settings',
    ): boolean => {
        switch (section) {
            case 'dashboard':
                return currentView === 'dashboard';
            case 'equipment':
                return [
                    'equipment',
                    'equipment_details',
                    'add_equipment',
                    'edit_equipment',
                    'import_equipment',
                    'assignment_wizard',
                    'return_wizard',
                ].includes(currentView);
            case 'users':
                return ['users', 'user_details', 'add_user', 'edit_user', 'import_users'].includes(
                    currentView,
                );
            case 'tasks':
                // La file absorbe « nouvelle demande » : c'est un geste de la file,
                // plus une section à part (17.7).
                return ['tasks', 'new_request'].includes(currentView);
            case 'finance':
                return ['finance', 'finance_expenses'].includes(currentView);
            case 'management':
                return [
                    'management',
                    'category_details',
                    'model_details',
                    'import_models',
                    'add_category',
                    'add_model',
                ].includes(currentView);
            case 'rbac':
                return currentView === 'rbac';
            case 'locations':
                return ['locations', 'site_details', 'import_locations'].includes(currentView);
            case 'audit':
                return ['audit', 'audit_details'].includes(currentView);
            case 'reports':
                return currentView === 'reports';
            case 'settings':
                return currentView === 'settings';
            default:
                return false;
        }
    };

    useEffect(() => {
        if (!showModalDrawer || !drawerRef.current) {
            return;
        }

        previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
        const drawerElement = drawerRef.current;
        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusableSelector = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(',');

        const getFocusableElements = (): HTMLElement[] => {
            const elements = Array.from(
                drawerElement.querySelectorAll(focusableSelector),
            ) as HTMLElement[];
            return elements.filter((element) => {
                const isDisabled = element.hasAttribute('disabled');
                const isAriaHidden = element.getAttribute('aria-hidden') === 'true';
                return !isDisabled && !isAriaHidden;
            });
        };

        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            drawerElement.focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMobileMenu?.();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = getFocusableElements();
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
        };

        drawerElement.addEventListener('keydown', handleKeyDown);

        return () => {
            drawerElement.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousBodyOverflow;

            const previous = previousFocusedElementRef.current;
            if (previous) {
                requestAnimationFrame(() => previous.focus());
            }
        };
    }, [showModalDrawer, closeMobileMenu]);

    return (
        <>
            {/* Mobile Overlay (Scrim) */}
            <div
                className={cn(
                    'bg-scrim/[0.32] expanded:hidden duration-medium2 ease-emphasized fixed inset-0 z-[90] transition-opacity',
                    showModalDrawer
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            <aside
                ref={drawerRef}
                role={showModalDrawer ? 'dialog' : undefined}
                aria-modal={showModalDrawer ? true : undefined}
                aria-label={showModalDrawer ? 'Menu de navigation' : undefined}
                tabIndex={showModalDrawer ? -1 : undefined}
                className={cn(
                    'fixed inset-y-0 left-0 z-[100]',
                    'expanded:static expanded:z-auto',
                    'duration-medium4 ease-emphasized flex h-full flex-col justify-between border-r border-white/[0.03] bg-[var(--color-sidebar-bg)] text-white transition-all',
                    showModalDrawer
                        ? 'w-[85vw] max-w-[360px] translate-x-0'
                        : 'expanded:translate-x-0 -translate-x-full',
                    isCollapsed ? 'expanded:w-[76px]' : 'expanded:w-64',
                    className,
                )}
                style={{
                    background:
                        'linear-gradient(180deg, var(--color-sidebar-gradient-from) 0%, var(--color-sidebar-gradient-to) 100%)',
                }}
            >
                <div
                    className={cn(
                        'custom-scrollbar duration-medium2 ease-emphasized flex h-full flex-col overflow-y-auto transition-all',
                        isCollapsed && !isMobileOpen ? 'p-3' : 'p-4',
                    )}
                >
                    {/* Header / Logo — rétracté : TR puis chevron empilés sur 2 rangées, le
                        chevron flottant (-right-3) chevauchait le badge TR de 15px (§9.5) */}
                    <div
                        className={cn(
                            'duration-medium2 relative mb-6 flex min-h-11 items-center transition-all',
                            isCollapsed && !isMobileOpen
                                ? 'flex-col justify-center gap-1'
                                : isCollapsed
                                  ? 'justify-center'
                                  : 'justify-between',
                        )}
                    >
                        {isCollapsed && !isMobileOpen ? (
                            <div className="text-body-small text-primary flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 font-black select-none">
                                TR
                            </div>
                        ) : (
                            <div className="duration-medium2 flex items-center gap-2 overflow-hidden transition-all">
                                <span className="text-title-large font-brand font-extrabold whitespace-nowrap text-white">
                                    {APP_CONFIG.appName}
                                </span>
                            </div>
                        )}

                        {isModalMode ? (
                            <CloseButton
                                onClick={closeMobileMenu}
                                className="text-on-nav-surface-variant hover:text-on-nav-surface focus-visible:ring-primary duration-medium2 rounded-lg p-2 transition-all hover:bg-white/5"
                            />
                        ) : (
                            <Button
                                variant="nav"
                                size="sm"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className={cn(
                                    'expanded:flex duration-medium2 hidden h-auto rounded-lg border-none p-1.5 shadow-none transition-all',
                                    isCollapsed &&
                                        !isMobileOpen &&
                                        'mx-auto h-11 min-h-11 w-11 min-w-11 p-0',
                                )}
                                aria-label={isCollapsed ? 'Déployer le menu' : 'Réduire le menu'}
                                icon={
                                    <MaterialIcon
                                        name={isCollapsed ? 'chevron_right' : 'chevron_left'}
                                        size={24}
                                    />
                                }
                            />
                        )}
                    </div>

                    {/* Navigation Items — tiroir-complément : les 4 destinations primaires ne
                        sont rendues que si la barre/rail ne les porte pas déjà (§9.8) */}
                    <nav
                        aria-label={hidePrimary ? 'Autres sections' : 'Sections principales'}
                        className={cn(
                            'duration-medium2 space-y-1 transition-all',
                            isCollapsed && !isMobileOpen && 'flex flex-col items-center',
                        )}
                    >
                        {hidePrimary && (
                            <p className="text-label-small text-on-nav-surface-variant px-3 pb-1 font-semibold tracking-wider uppercase">
                                Autres sections
                            </p>
                        )}

                        {!hidePrimary && permissions.canViewInventory && (
                            <>
                                <SidebarItem
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    icon={DESTINATIONS.dashboard.icon}
                                    label={DESTINATIONS.dashboard.label}
                                    active={isNavSectionActive('dashboard')}
                                    onClick={() => handleItemClick('dashboard')}
                                />
                                <SidebarItem
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    icon={DESTINATIONS.equipment.icon}
                                    label={DESTINATIONS.equipment.label}
                                    active={isNavSectionActive('equipment')}
                                    onClick={() => handleItemClick('equipment')}
                                />
                            </>
                        )}

                        {!hidePrimary && permissions.canViewUsers && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.users.icon}
                                label={DESTINATIONS.users.label}
                                active={isNavSectionActive('users')}
                                onClick={() => handleItemClick('users')}
                            />
                        )}

                        {!hidePrimary && permissions.canViewApprovals && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.tasks.icon}
                                label={DESTINATIONS.tasks.label}
                                active={isNavSectionActive('tasks')}
                                onClick={() => handleItemClick('tasks')}
                                badge={pendingCount > 0 ? pendingCount : undefined}
                            />
                        )}

                        {/*
                          « Approbations » n'est plus une destination — planche 17.7.
                          Sa matrice des douze destinations la marque en divergence :
                          « Elle est un onglet de Tâches ; la barre latérale en fait
                          pourtant une douzième entrée — deux portes vers la même file,
                          à fermer côté latéral. » La barre du bas les avait déjà
                          fusionnées, la feuille « Plus » ne l'a jamais portée. Fermée
                          ici le 20/08, au rail avec elle, puis la page elle-même : ce
                          n'était pas un détail d'arbitrage mais **une seconde liste** —
                          `ApprovalsPage` ne prenait aucune prop et paginait la même
                          donnée avec les mêmes règles. « Nouvelle demande » a rejoint la
                          file, dont elle est un geste.
                        */}

                        {(permissions.canViewFinance || permissions.canManageFinance) && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.finance.icon}
                                label={DESTINATIONS.finance.label}
                                active={isNavSectionActive('finance')}
                                onClick={() => handleItemClick('finance')}
                            />
                        )}

                        {(permissions.canViewManagement || permissions.canManageSystem) && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.management.icon}
                                label={DESTINATIONS.management.label}
                                active={isNavSectionActive('management')}
                                onClick={() => handleItemClick('management')}
                            />
                        )}

                        {(permissions.canViewManagement || permissions.canManageSystem) && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.rbac.icon}
                                label={DESTINATIONS.rbac.label}
                                active={isNavSectionActive('rbac')}
                                onClick={() => handleItemClick('rbac')}
                            />
                        )}

                        {(permissions.canViewLocations || permissions.canManageLocations) && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.locations.icon}
                                label={DESTINATIONS.locations.label}
                                active={isNavSectionActive('locations')}
                                onClick={() => handleItemClick('locations')}
                            />
                        )}

                        {(permissions.canViewAudit ||
                            permissions.canScanAudit ||
                            permissions.canManageAudit) && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.audit.icon}
                                label={DESTINATIONS.audit.label}
                                active={isNavSectionActive('audit')}
                                onClick={() => handleItemClick('audit')}
                            />
                        )}

                        {permissions.canViewReports && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon={DESTINATIONS.reports.icon}
                                label={DESTINATIONS.reports.label}
                                active={isNavSectionActive('reports')}
                                onClick={() => handleItemClick('reports')}
                            />
                        )}
                    </nav>

                    {/* Bottom Actions */}
                    <nav
                        aria-label="Actions secondaires"
                        className={cn(
                            'mt-auto space-y-1 pt-4',
                            isCollapsed && !isMobileOpen && 'flex flex-col items-center',
                        )}
                    >
                        <SidebarItem
                            isCollapsed={isCollapsed && !isMobileOpen}
                            icon={DESTINATIONS.settings.icon}
                            label={DESTINATIONS.settings.label}
                            active={isNavSectionActive('settings')}
                            onClick={() => {
                                onSettingsClick();
                                if (closeMobileMenu) closeMobileMenu();
                            }}
                        />
                        {isModalMode && onLogout && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="logout"
                                label="Déconnexion"
                                onClick={() => {
                                    if (closeMobileMenu) closeMobileMenu();
                                    onLogout();
                                }}
                            />
                        )}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
