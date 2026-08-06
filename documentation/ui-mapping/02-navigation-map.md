# Navigation Map

## Mécanisme observé

`useRouter.ts` lit `window.location.hash`, retire la query string du chemin routé, et expose des segments. `useAppNavigation.ts` fait la correspondance URL vers `ViewType`; `AppLayout.tsx` monte ensuite la page. Les liens profonds sont donc de la forme `#/section/action/param`.

## Routes et destinations

| Hash | Vue rendue | Page / surface | Notes |
| --- | --- | --- | --- |
| `#/` ou `#/dashboard` | `dashboard` | `DashboardPage` | route par défaut |
| `#/inventory` | `equipment` | `InventoryPage` | liste |
| `#/inventory/filter/:status` | `equipment` | `InventoryPage` | filtre injecté par Dashboard |
| `#/inventory/:id` | `equipment_details` | `EquipmentDetailsPage` | détail |
| `#/inventory/add` | `add_equipment` | `AddEquipmentPage` | création |
| `#/inventory/edit/:id` | `edit_equipment` | `AddEquipmentPage` | édition, composant partagé |
| `#/inventory/import` | `import_equipment` | `ImportEquipmentPage` | contrat de props invalide, voir audit |
| `#/users` | `users` | `UsersPage` | liste |
| `#/users/:id` | `user_details` | `UserDetailsPage` | détail |
| `#/users/add` | `add_user` | `AddUserPage` | création |
| `#/users/edit/:id` | `edit_user` | `AddUserPage` | édition, composant partagé |
| `#/users/import` | `import_users` | `ImportUsersPage` | contrat de props invalide, voir audit |
| `#/approvals` | `approvals` | `ApprovalsPage` | liste et actions |
| `#/approvals/new` | `new_request` | `NewRequestPage` | formulaire |
| `#/management` | `management` | `ManagementPage` | catégories / modèles |
| `#/management/categories/add` | `add_category` | `ManagementPage` + modal | pas une page autonome |
| `#/management/categories/:id` | `category_details` | `CategoryDetailsPage` | détail |
| `#/management/models/add` | `add_model` | `ManagementPage` + modal | pas une page autonome |
| `#/management/models/import` | `import_models` | `ImportModelsPage` | import |
| `#/management/models/:id` | `model_details` | `ModelDetailsPage` | détail |
| `#/rbac/*` | `rbac` | `RbacPage` | section interne ensuite lue par la page |
| `#/locations` | `locations` | `LocationsPage` | liste et modales locales |
| `#/locations/import` | `import_locations` | `ImportLocationsPage` | import |
| `#/audit` ou `#/audit/overview` | `audit` | `AuditPage` | vue physique / mobile |
| `#/audit/details` | `audit_details` | `AuditDetailsPage` | détail |
| `#/audit/details/:id` | `audit_details` | `AuditDetailsPage` | `:id` généré mais ignoré |
| `#/reports` | `reports` | `ReportsPage` | terminal |
| `#/finance` | `finance` | `FinanceManagementPage` | terminal, modales locales |
| `#/settings` | `settings` | `SettingsPage` | terminal |
| `#/wizards/assignment` | `assignment_wizard` | `AssignmentWizardPage` | query lue manuellement par le wizard |
| `#/wizards/return` | `return_wizard` | `ReturnWizardPage` | assistant |
| `#/documentation/ui-flow-map` | hors `ViewType` | `DocumentationExplorerPage` | route publique, avant les providers |
| `#/dev/design-system` | hors `ViewType` | `DesignSystemGalleryPage` | développement uniquement |

## Graphe des conversions de routes

```mermaid
flowchart LR
    Hash["window.location.hash"] --> Router["useRouter"]
    Router --> Nav["useAppNavigation"]
    Nav --> View["ViewType + id + filtre"]
    View --> Layout["AppLayout switch"]
    Layout --> Page["Page lazy"]
    Page -->|onViewChange| Nav
    Page -->|navigate('/...')| Router
    AssignmentPage["AssignmentWizardPage"] -->|lit hash directement| Hash
```

## Routes plausibles mais défectueuses

| Route | Comportement vérifié | Référence |
| --- | --- | --- |
| `#/management/categories` | rend `dashboard` au lieu de Gestion | `useAppNavigation.ts` : branche sans `else` |
| `#/management/models` | rend `dashboard` au lieu de Gestion | `useAppNavigation.ts` : branche sans `else` |
| `#/audit/details/:id` | l'identifiant ne rejoint pas `AuditDetailsPage` | `useAppNavigation.ts`, `AppLayout.tsx` |
