/**
 * **Où l'application garde ses données dans le navigateur**, quand aucune base n'est branchée.
 *
 * Deux contextes les lisent et les écrivent (`DataContext`, `FinanceDataContext`), et la
 * démonstration du site public y verse la simulation avant qu'ils ne démarrent
 * (`lib/semerLaDemonstration`). Une seule liste, pour que les trois parlent des mêmes clés.
 */
export const CLES_DES_DONNEES = {
    settings: { current: 'tracker_settings', legacy: 'neemba_settings' },
    users: { current: 'tracker_users', legacy: 'neemba_users' },
    equipment: { current: 'tracker_equipment', legacy: 'neemba_equipment' },
    categories: { current: 'tracker_categories', legacy: 'neemba_categories' },
    models: { current: 'tracker_models', legacy: 'neemba_models' },
    events: { current: 'tracker_events', legacy: 'neemba_events' },
    serviceManagers: { current: 'tracker_service_managers', legacy: 'neemba_service_managers' },
    rbacRoles: { current: 'tracker_rbac_roles', legacy: 'neemba_rbac_roles' },
    rbacGroups: { current: 'tracker_rbac_groups', legacy: 'neemba_rbac_groups' },
    rbacAssignments: { current: 'tracker_rbac_assignments', legacy: 'neemba_rbac_assignments' },
    rbacWorkflows: { current: 'tracker_rbac_workflows', legacy: 'neemba_rbac_workflows' },
    detectedDevices: { current: 'tracker_detected_devices', legacy: 'neemba_detected_devices' },
    approvals: { current: 'tracker_approvals', legacy: 'neemba_approvals' },
    locations: { current: 'tracker_locations', legacy: 'neemba_locations' },
} as const;

export const CLES_DES_FINANCES = {
    financeExpenses: { current: 'tracker_finance_expenses', legacy: 'neemba_finance_expenses' },
    financeBudgets: { current: 'tracker_finance_budgets', legacy: 'neemba_finance_budgets' },
} as const;
