import { useEffect, useMemo, useCallback } from 'react';
import { cheminPrecedent } from '../lib/cheminParcouru';
import { useRouter } from './useRouter';
import { ViewType } from '../types';
import { DESTINATIONS } from '../constants/destinations';

const VIEW_TITLES: Record<ViewType, string> = {
    // Sections : libellés issus du registre unique de destinations (X1)
    dashboard: DESTINATIONS.dashboard.label,
    equipment: DESTINATIONS.equipment.label,
    equipment_details: 'Détails équipement',
    add_equipment: 'Ajouter un équipement',
    edit_equipment: 'Modifier un équipement',
    import_equipment: 'Importer équipements',
    users: DESTINATIONS.users.label,
    user_details: 'Détails utilisateur',
    add_user: 'Ajouter un utilisateur',
    edit_user: 'Modifier utilisateur',
    import_users: 'Importer utilisateurs',
    new_request: 'Nouvelle demande',
    approval_details: 'Demande',
    tasks: 'Tâches',
    management: DESTINATIONS.management.label,
    rbac: DESTINATIONS.rbac.label,
    add_category: 'Ajouter une catégorie',
    add_model: 'Ajouter un modèle',
    import_models: 'Importer modèles',
    category_details: 'Détails catégorie',
    model_details: 'Détails modèle',
    locations: DESTINATIONS.locations.label,
    site_details: 'Détail site',
    import_locations: 'Importer localisations',
    audit: DESTINATIONS.audit.label,
    audit_details: 'Détails audit',
    history: DESTINATIONS.history.label,
    reports: DESTINATIONS.reports.label,
    assignment_wizard: "Remettre l'équipement",
    return_wizard: 'Rendre et réceptionner',
    finance: DESTINATIONS.finance.label,
    finance_expenses: 'Journal des dépenses',
    finance_lines: 'Lignes du budget',
    finance_exercises: 'Exercices',
    settings: DESTINATIONS.settings.label,
    not_found: 'Page introuvable',
};

export const useAppNavigation = () => {
    const { routeSegments, navigate } = useRouter();

    // Parse URL to View Logic
    // Renamed internal variable to 'computedView' to avoid ReferenceError with 'currentView'
    const { currentView, selectedId, filterParam } = useMemo(() => {
        let computedView: ViewType = 'dashboard';
        let id: string | null = null;
        let filter: string | null = null;

        const section = routeSegments[0] || 'dashboard';
        const action = routeSegments[1];
        const param = routeSegments[2];

        if (section === 'dashboard') {
            computedView = 'dashboard';
        } else if (section === 'inventory') {
            if (action === 'add') computedView = 'add_equipment';
            else if (action === 'edit') {
                computedView = 'edit_equipment';
                id = param;
            } else if (action === 'import') computedView = 'import_equipment';
            else if (action === 'filter') {
                computedView = 'equipment';
                filter = decodeURIComponent(param || '');
            } else if (action) {
                computedView = 'equipment_details';
                id = action;
            } else computedView = 'equipment';
        } else if (section === 'users') {
            if (action === 'add') computedView = 'add_user';
            else if (action === 'edit') {
                computedView = 'edit_user';
                id = param;
            } else if (action === 'import') computedView = 'import_users';
            else if (action) {
                computedView = 'user_details';
                id = action;
            } else computedView = 'users';
        } else if (section === 'tasks') {
            // « Nouvelle demande » est un geste de la file, et son adresse le dit : elle
            // vivait sous /approvals/new, la section qui n'existe plus.
            if (action === 'new') computedView = 'new_request';
            /* 06.5 — le détail d'une demande est un écran, pas une feuille : c'est
               devant lui qu'on refuse, qu'on renvoie ou qu'on abandonne. */
            else if (action === 'request' && param) {
                computedView = 'approval_details';
                id = param;
            } else computedView = 'tasks';
        } else if (section === 'management') {
            if (action === 'categories') {
                if (param === 'add') computedView = 'add_category';
                else if (param) {
                    computedView = 'category_details';
                    id = param;
                }
            } else if (action === 'models') {
                if (param === 'add') computedView = 'add_model';
                else if (param === 'import') computedView = 'import_models';
                else if (param) {
                    computedView = 'model_details';
                    id = param;
                }
            } else {
                computedView = 'management';
            }
        } else if (section === 'rbac') {
            computedView = 'rbac';
        } else if (section === 'locations') {
            if (action === 'import') computedView = 'import_locations';
            // Le site est le seul niveau de l'arbre qui s'ouvre : ni le pays — trois pays,
            // un écran qui les listerait ferait payer une frappe pour rien (10.1) — ni le
            // local, qui se tient sur la fiche de son site.
            else if (action === 'site' && param) {
                computedView = 'site_details';
                id = decodeURIComponent(param);
            } else computedView = 'locations';
        } else if (section === 'audit') {
            if (action === 'details') computedView = 'audit_details';
            else if (action === 'overview') computedView = 'audit';
            else computedView = 'audit';
        } else if (section === 'history') {
            computedView = 'history';
        } else if (section === 'reports') {
            computedView = 'reports';
        } else if (section === 'finance') {
            // Le journal complet est une destination, pas un onglet (planche 15.1) :
            // « Voir les N dépenses de l'exercice » mène ici, et le retour ramène
            // à la page Finances.
            if (action === 'expenses') computedView = 'finance_expenses';
            // 15.2 — les lignes d'un exercice : `/finance/lines/<année>`.
            else if (action === 'lines') computedView = 'finance_lines';
            // 15.1, colonne 3 — passer d'un exercice à l'autre.
            else if (action === 'exercices') computedView = 'finance_exercises';
            else computedView = 'finance';
        } else if (section === 'settings') {
            computedView = 'settings';
        } else if (section === 'wizards') {
            if (action === 'assignment') computedView = 'assignment_wizard';
            else if (action === 'return') computedView = 'return_wizard';
            else computedView = 'not_found';
        } else {
            // Section inconnue : vue 404 explicite plutôt qu'un dashboard silencieux
            computedView = 'not_found';
        }

        return { currentView: computedView, selectedId: id, filterParam: filter };
    }, [routeSegments]);

    // Centralized Title Management
    useEffect(() => {
        const title = VIEW_TITLES[currentView] || 'Tracker';
        document.title = `${title} - Tracker`;
    }, [currentView]);

    // Navigate to View Logic (Reverse Mapping)
    const navigateToView = useCallback(
        (view: ViewType) => {
            const routeMap: Partial<Record<ViewType, string>> = {
                dashboard: '/',
                equipment: '/inventory',
                add_equipment: '/inventory/add',
                import_equipment: '/inventory/import',
                users: '/users',
                add_user: '/users/add',
                import_users: '/users/import',
                tasks: '/tasks',
                new_request: '/tasks/new',
                management: '/management',
                rbac: '/rbac/roles',
                add_category: '/management/categories/add',
                add_model: '/management/models/add',
                import_models: '/management/models/import',
                locations: '/locations',
                import_locations: '/locations/import',
                site_details: '/locations',
                audit: '/audit/overview',
                audit_details: '/audit/details',
                /* 18.1 — l'adresse se lisait (`#/history` ouvrait la page) mais ne
                   s'écrivait pas : la rangée de « Plus », celle de la barre latérale et
                   « Tout l'historique » de l'accueil ne menaient nulle part. */
                history: '/history',
                reports: '/reports',
                finance: '/finance',
                finance_expenses: '/finance/expenses',
                finance_lines: '/finance/lines',
                finance_exercises: '/finance/exercices',
                settings: '/settings',
                assignment_wizard: '/wizards/assignment',
                return_wizard: '/wizards/return',
            };

            if (routeMap[view]) {
                navigate(routeMap[view]!);
            }
        },
        [navigate],
    );

    const navigateToItem = useCallback(
        (view: ViewType, id: string) => {
            const routeMap: Partial<Record<ViewType, (id: string) => string>> = {
                equipment_details: (id) => `/inventory/${id}`,
                edit_equipment: (id) => `/inventory/edit/${id}`,
                user_details: (id) => `/users/${id}`,
                edit_user: (id) => `/users/edit/${id}`,
                category_details: (id) => `/management/categories/${id}`,
                model_details: (id) => `/management/models/${id}`,
                audit_details: () => `/audit/details`,
                site_details: (id) => `/locations/site/${encodeURIComponent(id)}`,
                approval_details: (id) => `/tasks/request/${encodeURIComponent(id)}`,
                // Les rangées « Remettre » / « Réceptionner » / « Restituer » de la file (TasksPage)
                // arrivent ici avec l'identifiant de l'équipement ; les deux assistants lisent
                // `equipmentId` dans le hash. Sans ces deux clés, le tap ne faisait rien.
                assignment_wizard: (id) =>
                    `/wizards/assignment?equipmentId=${encodeURIComponent(id)}`,
                return_wizard: (id) => `/wizards/return?equipmentId=${encodeURIComponent(id)}`,
            };

            if (routeMap[view]) {
                navigate(routeMap[view]!(id));
            }
        },
        [navigate],
    );

    /**
     * **Remonter d'un cran** : d'une page de section vers la racine de la section, et de
     * la racine vers l'Accueil. Le retour renvoyait toujours à la racine de la section —
     * y compris depuis la racine elle-même : au téléphone, la flèche de Catalogue,
     * Emplacements, Inventaire et Finances ne faisait rien (relevé du 25/09).
     */
    const goBack = useCallback(() => {
        const section = routeSegments[0];
        const racine =
            section === 'inventory'
                ? '/inventory'
                : section === 'users'
                  ? '/users'
                  : section === 'management'
                    ? '/management'
                    : section === 'audit'
                      ? '/audit/overview'
                      : section === 'tasks' && routeSegments[1] === 'new'
                        ? '/tasks'
                        : section === 'finance'
                          ? '/finance'
                          : section === 'locations'
                            ? '/locations'
                            : '/';
        const ici = `/${routeSegments.filter(Boolean).join('/')}`;
        /* **Le chemin parcouru d'abord** (25/09) : on revient d'où l'on vient ; l'arborescence
           n'est que le repli d'une page ouverte sans chemin. */
        navigate(cheminPrecedent() ?? (racine === ici ? '/' : racine));
    }, [routeSegments, navigate]);

    /** Revenir d'où l'on vient, ou à défaut vers `repli`. */
    const retour = useCallback((repli: string) => navigate(cheminPrecedent() ?? repli), [navigate]);

    return {
        currentView,
        selectedId,
        filterParam,
        routeSegments,
        navigate,
        navigateToView,
        navigateToItem,
        goBack,
        retour,
    };
};
