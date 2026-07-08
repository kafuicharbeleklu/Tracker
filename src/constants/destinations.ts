import { GLOSSARY } from './glossary';
import { ViewType } from '../types';

/**
 * Registre unique des destinations de navigation (audit X1).
 *
 * Source de vérité pour libellés, icônes et routes des sections, consommée par
 * les 4 surfaces de navigation (Sidebar, NavigationBar, NavigationRail,
 * TopAppBar via AppLayout) et par les titres de document (useAppNavigation).
 * Ne plus définir de libellé de destination directement dans un composant.
 */
export interface AppDestination {
    /** Libellé complet — sidebar, top app bar, titre de document */
    label: string;
    /** Libellé court — bottom bar et rail (espace contraint) ; absent = utiliser `label` */
    shortLabel?: string;
    /** Nom d'icône Material Symbols */
    icon: string;
    /** Route hash canonique de la section */
    route: string;
}

export type DestinationId = Extract<
    ViewType,
    | 'dashboard'
    | 'equipment'
    | 'approvals'
    | 'users'
    | 'finance'
    | 'management'
    | 'rbac'
    | 'locations'
    | 'audit'
    | 'reports'
    | 'settings'
>;

export const DESTINATIONS: Record<DestinationId, AppDestination> = {
    dashboard: { label: GLOSSARY.DASHBOARD, shortLabel: 'Accueil', icon: 'dashboard', route: '/' },
    equipment: {
        label: GLOSSARY.EQUIPMENT_PLURAL,
        shortLabel: 'Actifs',
        icon: 'devices',
        route: '/inventory',
    },
    approvals: {
        label: GLOSSARY.APPROVALS,
        shortLabel: 'Tâches',
        icon: 'task_alt',
        route: '/approvals',
    },
    users: { label: GLOSSARY.USER_PLURAL, shortLabel: 'Équipe', icon: 'group', route: '/users' },
    finance: { label: 'Finances', icon: 'payments', route: '/finance' },
    management: { label: GLOSSARY.MANAGEMENT, icon: 'tune', route: '/management' },
    rbac: { label: 'Rôles & accès', icon: 'admin_panel_settings', route: '/rbac/roles' },
    locations: { label: GLOSSARY.LOCATIONS, icon: 'location_on', route: '/locations' },
    audit: { label: GLOSSARY.AUDIT, icon: 'fact_check', route: '/audit/overview' },
    reports: { label: GLOSSARY.REPORTS, icon: 'bar_chart', route: '/reports' },
    settings: { label: GLOSSARY.SETTINGS, icon: 'settings', route: '/settings' },
};

/** Libellé court d'une destination (bottom bar / rail). */
export const getDestinationShortLabel = (id: DestinationId): string =>
    DESTINATIONS[id].shortLabel ?? DESTINATIONS[id].label;
