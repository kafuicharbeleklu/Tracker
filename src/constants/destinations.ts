import {
    ChartBar,
    CheckCircle,
    ClipboardText,
    ClockCounterClockwise,
    Coins,
    FolderOpen,
    Gear,
    Laptop,
    MapPin,
    ShieldCheck,
    SquaresFour,
    UsersThree,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import { GLOSSARY } from './glossary';
import { ViewType } from '../types';

/**
 * Registre unique des destinations de navigation (audit X1).
 *
 * Source de vérité pour libellés, glyphes, icônes et routes des sections, consommée
 * par les surfaces de navigation (Sidebar — déployée ou en rail —, NavigationBar,
 * TopAppBar via AppLayout) et par les titres de document (useAppNavigation).
 * Ne plus définir de libellé de destination directement dans un composant.
 */
export interface AppDestination {
    /** Libellé complet — sidebar, top app bar, titre de document */
    label: string;
    /** Libellé court — bottom bar et rail (espace contraint) ; absent = utiliser `label` */
    shortLabel?: string;
    /** Nom d'icône Material Symbols — les surfaces qui n'ont pas encore basculé. */
    icon: string;
    /**
     * Le glyphe Phosphor de la destination. Il vivait en table privée dans
     * `NavigationBar` (`MORE_GLYPHS`), donc invisible pour la barre latérale et le
     * rail, qui tiraient un nom Material à la place : **deux dessins pour une même
     * destination**, selon la surface qui l'affichait. Le registre les porte tous les
     * deux, et c'est lui qui dit à quoi ressemble une destination.
     */
    glyph: PhosphorGlyph;
    /** Route hash canonique de la section */
    route: string;
}

export type DestinationId = Extract<
    ViewType,
    | 'dashboard'
    | 'tasks'
    | 'equipment'
    | 'users'
    | 'finance'
    | 'management'
    | 'rbac'
    | 'locations'
    | 'audit'
    | 'history'
    | 'reports'
    | 'settings'
>;

export const DESTINATIONS: Record<DestinationId, AppDestination> = {
    dashboard: {
        label: GLOSSARY.DASHBOARD,
        shortLabel: 'Accueil',
        icon: 'dashboard',
        route: '/',
        glyph: SquaresFour,
    },
    equipment: {
        label: GLOSSARY.EQUIPMENT_PLURAL,
        shortLabel: 'Actifs',
        icon: 'devices',
        route: '/inventory',
        glyph: Laptop,
    },
    /*
      La file de travail, et **la seule**. Le registre déclarait aussi une destination
      « Approbations » : même donnée, mêmes règles métier, une liste de plus. La matrice
      de la planche 17.7 la marquait en divergence — « elle est un onglet de Tâches ;
      deux portes vers la même file ». Retirée le 20/08, avec la page qui la servait.
    */
    tasks: {
        label: 'Tâches',
        shortLabel: 'Tâches',
        icon: 'task_alt',
        route: '/tasks',
        glyph: CheckCircle,
    },
    /*
      **« Équipe », et rien d'autre.** Le registre portait `GLOSSARY.USER_PLURAL` en
      libellé long : la barre latérale déployée disait donc *Utilisateurs* et ouvrait une
      page titrée *Équipe*. Les trois planches qui nomment cette destination écrivent
      « Équipe » — 00.3, la barre de 03.1 bureau, et le titre de 05.1. Deux noms pour une
      destination, c'est l'écart que 11.1 a fait fermer sur « Accès ».
    */
    users: { label: 'Équipe', icon: 'group', route: '/users', glyph: UsersThree },
    finance: { label: 'Finances', icon: 'payments', route: '/finance', glyph: Coins },
    management: {
        label: GLOSSARY.MANAGEMENT,
        icon: 'tune',
        route: '/management',
        glyph: FolderOpen,
    },
    /* 11.1 nomme la page « Accès » : la rangée de la feuille « Plus » et la barre
       disaient « Rôles & accès », deux noms pour une destination. */
    rbac: {
        label: 'Accès',
        icon: 'admin_panel_settings',
        route: '/rbac/roles',
        glyph: ShieldCheck,
    },
    locations: {
        label: GLOSSARY.LOCATIONS,
        icon: 'location_on',
        route: '/locations',
        glyph: MapPin,
    },
    audit: {
        label: GLOSSARY.AUDIT,
        icon: 'fact_check',
        route: '/audit/overview',
        glyph: ClipboardText,
    },
    /* 18.1 — le journal. « Audit » a été scindé le 03/09 : la campagne physique est
     *Inventaire*, le journal est *Historique*, et ce sont deux destinations. */
    history: {
        label: 'Historique',
        icon: 'history',
        route: '/history',
        glyph: ClockCounterClockwise,
    },
    reports: { label: GLOSSARY.REPORTS, icon: 'bar_chart', route: '/reports', glyph: ChartBar },
    settings: { label: GLOSSARY.SETTINGS, icon: 'settings', route: '/settings', glyph: Gear },
};

/** Libellé court d'une destination (bottom bar / rail). */
export const getDestinationShortLabel = (id: DestinationId): string =>
    DESTINATIONS[id].shortLabel ?? DESTINATIONS[id].label;

/**
 * **De quelle destination relève l'écran qu'on regarde.**
 *
 * Trois surfaces répondaient à cette question, chacune à sa façon : `isNavSectionActive`
 * dans la barre latérale (un `switch` de onze cas), `resolveBottomNavDestination` et
 * `MORE_SECTION_OF_VIEW` dans la barre du bas. Une fiche d'équipement pouvait donc
 * allumer « Actifs » en bas et rien du tout à gauche. La table est ici, et une seule
 * fois : c'est elle qui décide de la rangée en creux, quelle que soit la surface.
 *
 * Une vue absente de la table n'appartient à aucune destination — c'est le cas voulu
 * pour `login`, `not_found` et les assistants qui prennent tout l'écran.
 */
export const SECTION_OF_VIEW: Partial<Record<ViewType, DestinationId>> = {
    dashboard: 'dashboard',

    equipment: 'equipment',
    equipment_details: 'equipment',
    add_equipment: 'equipment',
    edit_equipment: 'equipment',
    import_equipment: 'equipment',
    assignment_wizard: 'equipment',
    return_wizard: 'equipment',

    users: 'users',
    user_details: 'users',
    add_user: 'users',
    edit_user: 'users',
    import_users: 'users',

    /* La file absorbe « nouvelle demande » : c'est un geste de la file, plus une
       section à part (17.7). */
    tasks: 'tasks',
    new_request: 'tasks',
    approval_details: 'tasks',

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

    history: 'history',
    reports: 'reports',
    rbac: 'rbac',
    settings: 'settings',
};

/** La destination dont relève une vue, ou `null` quand aucune ne la contient. */
export const sectionOfView = (view: ViewType): DestinationId | null =>
    SECTION_OF_VIEW[view] ?? null;
