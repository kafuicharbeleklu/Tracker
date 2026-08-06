# Components Map

## Arbre de coque

```mermaid
flowchart TD
    App["App.tsx"] --> RootBoundary["ErrorBoundary racine"]
    RootBoundary --> Providers["Toast / Auth / Data / FinanceData / Confirmation"]
    Providers --> AppLayout
    AppLayout --> Sidebar["Sidebar > SidebarItem"]
    AppLayout --> Rail["NavigationRail > NavButton"]
    AppLayout --> Top["TopAppBar"]
    AppLayout --> Bottom["BottomAppBar > NavigationBar > NavButton"]
    AppLayout --> RouteBoundary["ErrorBoundary par vue"]
    RouteBoundary --> Suspense["Suspense > LoadingSpinner"]
    Suspense --> Pages["Pages lazy"]
```

## Gabarits de page

```mermaid
flowchart TD
    Full["FullScreenLayout"] --> Wizard["WizardLayout"]
    Full --> Form["FullScreenFormLayout"]
    Wizard --> Assignment["AssignmentWizardPage"]
    Wizard --> Return["ReturnWizardPage"]
    Form --> AddEquipment["AddEquipmentPage"]
    Form --> AddUser["AddUserPage"]
    Form --> ImportEquipment["ImportEquipmentPage"]
    Form --> ImportUsers["ImportUsersPage"]
    Form --> ImportModels["ImportModelsPage"]
    Form --> ImportLocations["ImportLocationsPage"]
    Form --> NewRequest["NewRequestPage"]
    Detail["DetailPageShell > DetailHeader"] --> EquipmentDetail["EquipmentDetailsPage"]
    Detail --> UserDetail["UserDetailsPage"]
    List["PageContainer + PageHeader"] --> Inventory["InventoryPage"]
    List --> Users["UsersPage"]
    List --> Locations["LocationsPage"]
    List --> Management["ManagementPage"]
    List --> Approvals["ApprovalsPage"]
```

## Structure récurrente de liste

```mermaid
flowchart LR
    Page["Page de liste"] --> Header["PageHeader"]
    Page --> Filter["SearchFilterBar + SelectFilter"]
    Page --> Tabs["PageTabs, selon page"]
    Page --> Rows["EntityRow / Card / TableScrollArea"]
    Page --> Status["StatusBadge / Badge / Chip"]
    Page --> Pagination
    Page --> Empty["EmptyState"]
    Page --> Fab["ListActionFab"]
    Page --> Confirm["useConfirmation"]
```

## Dépendances fonctionnelles notables

| Elément | Dépendances / appelants vérifiés |
| --- | --- |
| `SecurityGate` | `DashboardPage`, `ApprovalRow` |
| `TransactionTicketModal` | `DashboardPage` |
| `PhysicalAuditView` | `AuditPage` |
| `AuditOverviewMobile` | `AuditPage`, compact |
| `AddCategoryPage` / `AddModelPage` | `ManagementPage`, modales locales |
| `AddBudgetModal` / `AddExpenseModal` | `FinanceManagementPage` |
| `RbacManagementPanel` | `RbacPage` |

Les arbres indiquent les dépendances structurantes de navigation et de rendu. Les composants de primitives de `src/components/ui` restent des dépendances partagées transverses, détaillées dans `06-shared-components.md`.
