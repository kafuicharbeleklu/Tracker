# UI Flow Map

## Périmètre vérifié

Relevé statique du code source du projet, effectué le 2026-08-03. L'application est une SPA React 19 / TypeScript / Vite avec routage par hash interne (`src/hooks/useRouter.ts`), et non une application Flutter. Aucun `Navigator`, `GoRouter`, `AutoRoute`, `Drawer` Flutter, `SpeedDial` ou widget Flutter n'existe dans le dépôt.

Les pages sont sélectionnées par `useAppNavigation`, puis montées de façon lazy par `src/components/layout/AppLayout.tsx`. Les dialogues, feuilles et modales sont des surfaces locales : ils ne changent pas de route.

## Carte globale

```mermaid
flowchart TD
    Start["App.tsx"] --> Docs["Documentation Explorer\n#/documentation/ui-flow-map"]
    Start --> Dev{"#/dev/design-system et DEV ?"}
    Dev -->|oui| Gallery["DesignSystemGalleryPage"]
    Dev -->|non| Providers["Toast > Auth > Data > Finance > Confirmation"]
    Providers --> Gate{"Etat d'authentification"}
    Gate -->|accessDenied| Denied["AccessDeniedPage"]
    Gate -->|needsPasswordChange| Password["ChangePasswordPage"]
    Gate -->|non authentifie| Login["LoginPage"]
    Gate -->|authentifie| Shell["AppLayout + useAppNavigation"]
    Login --> Dashboard

    Shell --> Dashboard["Dashboard"]
    Shell --> Inventory["Equipements"]
    Shell --> Users["Utilisateurs"]
    Shell --> Approvals["Approbations"]
    Shell --> Management["Gestion"]
    Shell --> Rbac["Roles et acces"]
    Shell --> Locations["Emplacements"]
    Shell --> Audit["Audit"]
    Shell --> Finance["Finances"]
    Shell --> Reports["Rapports"]
    Shell --> Settings["Parametres"]

    Dashboard --> Assignment["Assistant attribution"]
    Dashboard --> Return["Assistant retour"]
    Dashboard --> Request["Nouvelle demande"]
    Dashboard --> Inventory
    Dashboard --> Approvals
    Dashboard --> Audit
    Dashboard --> Finance

    Inventory --> EquipmentDetail["Detail equipement"]
    Inventory --> EquipmentForm["Ajout / edition equipement"]
    Inventory --> ImportEquipment["Import equipements"]
    Inventory --> UserDetail["Detail utilisateur"]
    Inventory --> AuditDetail["Detail audit"]
    EquipmentDetail --> Inventory
    EquipmentDetail --> EquipmentForm
    EquipmentDetail --> Assignment
    EquipmentDetail --> Return

    Users --> UserDetail
    Users --> UserForm["Ajout / edition utilisateur"]
    Users --> ImportUsers["Import utilisateurs"]
    UserDetail --> Users
    UserDetail --> UserForm
    UserDetail --> EquipmentDetail
    UserDetail --> Assignment

    Approvals --> Request
    Approvals --> Assignment
    Assignment --> Inventory
    Return --> Inventory
    Request --> Approvals

    Management --> CategoryDetail["Detail categorie"]
    Management --> ModelDetail["Detail modele"]
    Management --> ImportModels["Import modeles"]
    CategoryDetail --> ModelDetail
    Audit --> AuditDetail
    AuditDetail --> Audit
    Locations --> ImportLocations["Import emplacements"]
```

## Surfaces de navigation

| Surface | Condition | Couverture |
| --- | --- | --- |
| `Sidebar` | Toujours montée, modale sous `expanded` | 11 destinations |
| `NavigationRail` | Moyen ou compact paysage | 4 destinations principales + menu |
| `NavigationBar` | Compact portrait, vue prise en charge | 4 destinations principales + « Plus » |
| `TopAppBar` | Compact portrait, sauf Audit | Titre + ouverture du menu, pas de destination |

Sources : `AppLayout.tsx`, `Sidebar.tsx`, `NavigationRail.tsx`, `NavigationBar.tsx`, `TopAppBar.tsx`.

## Ecrans mutualisés

```mermaid
flowchart LR
    Inventory --> EquipmentDetail
    UserDetail --> EquipmentDetail
    Inventory --> UserDetail
    Users --> UserDetail
    Dashboard --> Assignment
    Approvals --> Assignment
    Audit --> AuditDetail
    Inventory --> AuditDetail
    PhysicalAudit["PhysicalAuditView"] --> AuditDetail
    AddRoute["#/inventory/add"] --> EquipmentForm
    EditRoute["#/inventory/edit/:id"] --> EquipmentForm
    AddUserRoute["#/users/add"] --> UserForm
    EditUserRoute["#/users/edit/:id"] --> UserForm
```

Les actions locales ouvrant `Modal`, `SideSheet`, `BottomSheet`, `SecurityGate` ou `ConfirmationDialog` ne sont volontairement pas représentées comme des routes : elles restent dans l'écran d'origine.
