# Workflows

## Authentification

```mermaid
flowchart TD
    App --> AccessDenied{"accessDenied ?"}
    AccessDenied -->|oui| Denied["AccessDeniedPage"]
    AccessDenied -->|non| Password{"needsPasswordChange ?"}
    Password -->|oui| Change["ChangePasswordPage"]
    Password -->|non| Auth{"isAuthenticated ?"}
    Auth -->|non| Login["LoginPage"]
    Auth -->|oui| Dashboard["AppLayout / Dashboard"]
    Login -->|login| Dashboard
```

## Cycle de vie équipement

```mermaid
flowchart TD
    Dashboard --> Inventory["Equipements"]
    Inventory -->|Ajouter / FAB| Add["AddEquipmentPage"]
    Add -->|onSave| Inventory
    Inventory -->|rangée| Detail["EquipmentDetailsPage"]
    Detail -->|Modifier| Edit["AddEquipmentPage, mode edition"]
    Edit -->|onSave| Detail
    Detail -->|Retour| Inventory
    Detail -->|Attribuer| Assignment["AssignmentWizardPage"]
    Detail -->|Restituer| Return["ReturnWizardPage"]
    Assignment --> Inventory
    Return --> Inventory
```

L'asymétrie ajout/édition est réelle : l'ajout revient à la liste, l'édition revient à la fiche (`AppLayout.tsx`).

## Cycle utilisateur

```mermaid
flowchart TD
    Users["Utilisateurs"] -->|Ajouter / FAB| AddUser["AddUserPage"]
    AddUser -->|onSave| Users
    Users -->|rangée| UserDetail["UserDetailsPage"]
    UserDetail -->|Modifier| EditUser["AddUserPage, mode edition"]
    EditUser -->|onSave| UserDetail
    UserDetail -->|equipement attribue| EquipmentDetail["EquipmentDetailsPage"]
    UserDetail -->|Attribuer| Assignment["AssignmentWizardPage"]
```

## Approbation vers attribution

```mermaid
flowchart TD
    Approvals["Approbations"] --> Choice{"Action de la demande"}
    Choice -->|assign| Hash["#/wizards/assignment?approvalId=...&userId=...&category=..."]
    Hash --> Router["useRouter retire la query du chemin"]
    Hash --> Wizard["AssignmentWizardPage relit window.location.hash"]
    Wizard --> Summary["Validation et mise a jour de l'approbation"]
    Summary --> Inventory["Equipements"]
```

Le transfert de paramètres est fonctionnellement séparé du routeur : seul le wizard relit la query (`AssignmentWizardPage.tsx:60-67`).

## Restitution

```mermaid
flowchart LR
    Dashboard --> Return["ReturnWizardPage / WizardLayout"]
    EquipmentDetail["Detail equipement"] --> Return
    Return -->|Annuler| Inventory["Equipements"]
    Return -->|Terminer| Inventory
```

## Demande d'équipement

```mermaid
flowchart LR
    Dashboard --> NewRequest["NewRequestPage / FullScreenFormLayout"]
    Approvals --> NewRequest
    NewRequest -->|soumettre ou annuler| Approvals
```

## Imports en masse

```mermaid
flowchart TD
    Inventory --> IE["ImportEquipmentPage"]
    Users --> IU["ImportUsersPage"]
    Management --> IM["ImportModelsPage"]
    Locations --> IL["ImportLocationsPage"]
    IE --> Drop["FileDropzone > apercu > validation"]
    IU --> Drop
    IM --> Drop
    IL --> Drop
    Drop --> Save["onSave"]
```

Les deux premiers parcours n'ont pas le contrat de retour requis au montage ; voir `07-ux-audit.md`.

## Audit physique

```mermaid
flowchart TD
    Audit --> Physical["PhysicalAuditView"]
    Audit --> Mobile["AuditOverviewMobile (compact)"]
    Physical --> AuditDetail["AuditDetailsPage"]
    Mobile --> AuditDetail
    AuditDetail -->|Retour| Audit
```
