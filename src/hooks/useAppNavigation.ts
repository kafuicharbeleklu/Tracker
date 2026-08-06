import { useEffect, useMemo, useCallback } from 'react';
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
  approvals: DESTINATIONS.approvals.label,
  new_request: 'Nouvelle demande',
  tasks: 'Tâches',
  management: DESTINATIONS.management.label,
  rbac: DESTINATIONS.rbac.label,
  add_category: 'Ajouter une catégorie',
  add_model: 'Ajouter un modèle',
  import_models: 'Importer modèles',
  category_details: 'Détails catégorie',
  model_details: 'Détails modèle',
  locations: DESTINATIONS.locations.label,
  import_locations: 'Importer localisations',
  audit: DESTINATIONS.audit.label,
  audit_details: 'Détails audit',
  reports: DESTINATIONS.reports.label,
  assignment_wizard: "Assistant d'attribution",
  return_wizard: 'Assistant de retour',
  finance: DESTINATIONS.finance.label,
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
      else if (action === 'edit') { computedView = 'edit_equipment'; id = param; }
      else if (action === 'import') computedView = 'import_equipment';
      else if (action === 'filter') {
        computedView = 'equipment';
        filter = decodeURIComponent(param || '');
      }
      else if (action) { computedView = 'equipment_details'; id = action; }
      else computedView = 'equipment';
    } else if (section === 'users') {
      if (action === 'add') computedView = 'add_user';
      else if (action === 'edit') { computedView = 'edit_user'; id = param; }
      else if (action === 'import') computedView = 'import_users';
      else if (action) { computedView = 'user_details'; id = action; }
      else computedView = 'users';
    } else if (section === 'tasks') {
      computedView = 'tasks';
    } else if (section === 'approvals') {
      if (action === 'new') computedView = 'new_request';
      else computedView = 'approvals';
    } else if (section === 'management') {
      if (action === 'categories') {
        if (param === 'add') computedView = 'add_category';
        else if (param) { computedView = 'category_details'; id = param; }
      } else if (action === 'models') {
        if (param === 'add') computedView = 'add_model';
        else if (param === 'import') computedView = 'import_models';
        else if (param) { computedView = 'model_details'; id = param; }
      } else {
        computedView = 'management';
      }
    } else if (section === 'rbac') {
      computedView = 'rbac';
    } else if (section === 'locations') {
      if (action === 'import') computedView = 'import_locations';
      else computedView = 'locations';
    } else if (section === 'audit') {
      if (action === 'details') computedView = 'audit_details';
      else if (action === 'overview') computedView = 'audit';
      else computedView = 'audit';
    } else if (section === 'reports') {
      computedView = 'reports';
    } else if (section === 'finance') {
      computedView = 'finance';
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
  const navigateToView = useCallback((view: ViewType) => {
    const routeMap: Partial<Record<ViewType, string>> = {
      'dashboard': '/',
      'equipment': '/inventory',
      'add_equipment': '/inventory/add',
      'import_equipment': '/inventory/import',
      'users': '/users',
      'add_user': '/users/add',
      'import_users': '/users/import',
      'tasks': '/tasks',
      'approvals': '/approvals',
      'new_request': '/approvals/new',
      'management': '/management',
      'rbac': '/rbac/roles',
      'add_category': '/management/categories/add',
      'add_model': '/management/models/add',
      'import_models': '/management/models/import',
      'locations': '/locations',
      'import_locations': '/locations/import',
      'audit': '/audit/overview',
      'audit_details': '/audit/details',
      'reports': '/reports',
      'finance': '/finance',
      'settings': '/settings',
      'assignment_wizard': '/wizards/assignment',
      'return_wizard': '/wizards/return'
    };

    if (routeMap[view]) {
      navigate(routeMap[view]!);
    }
  }, [navigate]);

  const navigateToItem = useCallback((view: ViewType, id: string) => {
    const routeMap: Partial<Record<ViewType, (id: string) => string>> = {
      'equipment_details': (id) => `/inventory/${id}`,
      'edit_equipment': (id) => `/inventory/edit/${id}`,
      'user_details': (id) => `/users/${id}`,
      'edit_user': (id) => `/users/edit/${id}`,
      'category_details': (id) => `/management/categories/${id}`,
      'model_details': (id) => `/management/models/${id}`,
      'audit_details': (id) => `/audit/details/${id}`, // Assuming this path
    };

    if (routeMap[view]) {
      navigate(routeMap[view]!(id));
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    const section = routeSegments[0];
    if (section === 'inventory') navigate('/inventory');
    else if (section === 'users') navigate('/users');
    else if (section === 'management') navigate('/management');
    else if (section === 'audit') navigate('/audit/overview');
    else if (section === 'approvals' && routeSegments[1] === 'new') navigate('/approvals');
    else navigate('/');
  }, [routeSegments, navigate]);

  return {
    currentView,
    selectedId,
    filterParam,
    routeSegments,
    navigate,
    navigateToView,
    navigateToItem,
    goBack
  };
};
