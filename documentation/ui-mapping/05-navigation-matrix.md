# Navigation Matrix

| Origine | Elément interactif | Action | Destination / effet | Workflow | Partagé | Observation |
| --- | --- | --- | --- | --- | --- | --- |
| Sidebar / Rail / Bottom nav | `NavButton` | sélectionner une destination | 11 sections principales | navigation globale | `DESTINATIONS` | RBAC appliqué par surface |
| Login | bouton de connexion | `login` | Dashboard | authentification | `AuthContext` | branche rendue par `App.tsx` |
| Dashboard | carte de statut | cliquer | Inventaire filtré | consultation | `onNavigate` | seul parcours utilisant `onNavigate` |
| Dashboard | Attribuer | cliquer | Assistant attribution | attribution | `WizardLayout` | `onViewChange` |
| Dashboard | Restituer | cliquer | Assistant retour | restitution | `WizardLayout` | `onViewChange` |
| Dashboard | Nouvelle demande | cliquer | Nouvelle demande | demande | `FullScreenFormLayout` | `onViewChange` |
| Dashboard | cartes Demandes / Réceptions | cliquer | Approbations | approbation | `MetricCard` | deux entrées convergentes |
| Dashboard | Finances | cliquer | Finances | finance | `MetricCard` | route directe |
| Dashboard | action Audit | cliquer | Audit | audit | `PageHeader` | route directe |
| Dashboard | ticket transaction | ouvrir | `SideSheet` local | consultation | `TransactionTicketModal` | pas de route |
| Inventaire | rangée équipement | cliquer | détail équipement | équipement | `EntityRow` | convergent avec détail utilisateur |
| Inventaire | porteur | cliquer | détail utilisateur | utilisateur | `EntityRow` | convergent avec Utilisateurs |
| Inventaire | Ajouter / FAB | cliquer | ajout équipement | création | `ListActionFab` | formulaire plein écran |
| Inventaire | Importer | cliquer | import équipements | import | `FullScreenFormLayout` | montage défectueux |
| Inventaire | menu rapide Audit | sélectionner | détail audit | audit | `Menu` | aucun id transmis |
| Détail équipement | Retour | cliquer | Inventaire | équipement | `DetailPageShell` | retour explicite |
| Détail équipement | Modifier | cliquer | édition équipement | équipement | `AddEquipmentPage` | `navigate` brut |
| Détail équipement | utilisateur courant | cliquer | détail utilisateur | utilisateur | `Card` | selon utilisateur résolu |
| Détail équipement | Attribuer | cliquer | Assistant attribution | attribution | `WizardLayout` | query potentielle |
| Détail équipement | Restituer | cliquer | Assistant retour | restitution | `WizardLayout` | `navigate` brut |
| Utilisateurs | rangée utilisateur | cliquer | détail utilisateur | utilisateur | `EntityRow` | convergent |
| Utilisateurs | Ajouter / FAB | cliquer | ajout utilisateur | création | `ListActionFab` | formulaire plein écran |
| Utilisateurs | Importer | cliquer | import utilisateurs | import | `FullScreenFormLayout` | montage défectueux |
| Détail utilisateur | Retour | cliquer | Utilisateurs | utilisateur | `DetailPageShell` | retour explicite |
| Détail utilisateur | Modifier | cliquer | édition utilisateur | utilisateur | `AddUserPage` | `navigate` brut |
| Détail utilisateur | équipement | cliquer | détail équipement | équipement | `EntityRow` | convergent |
| Détail utilisateur | Attribuer | cliquer | Assistant attribution | attribution | `WizardLayout` | query dans hash |
| Approbations | Nouvelle demande / FAB | cliquer | nouvelle demande | demande | `ListActionFab` | `navigate` brut |
| Approbations | action `assign` | déclencher | Assistant attribution | attribution | `ApprovalRow`, `SecurityGate` | query relue par wizard |
| Gestion | rangée catégorie | cliquer | détail catégorie | catalogue | `EntityRow` | détail routé |
| Gestion | rangée modèle | cliquer | détail modèle | catalogue | `EntityRow` | détail routé |
| Gestion | Ajouter catégorie / modèle | cliquer | modal locale | catalogue | `AddCategoryPage`, `AddModelPage` | routes d'initialisation possibles |
| Gestion | Importer modèles | cliquer | import modèles | import | `FullScreenFormLayout` | contrat correct |
| Détail catégorie | modèle | cliquer | détail modèle | catalogue | `CategoryDetailsPage` | convergence |
| Emplacements | Importer | cliquer | import emplacements | import | `FullScreenFormLayout` | `navigate` brut |
| Emplacements | cartes pays/site/service | action ajouter | modal locale | emplacement | `Modal` | pas de route |
| Emplacements | cartes de synthèse | cliquer | inventaire / utilisateurs / audit | consultation | `Card` | `div onClick` pour trois cartes |
| Audit | démarrer / FAB | cliquer | détail audit | audit | `PhysicalAuditView` | identifiant non routé |
| Détail audit | Retour | cliquer | Audit | audit | `PageTabs` | `onViewChange` |
| Paramètres | Déconnexion | cliquer | Login | authentification | `onLogout` | seul écran avec ce prop |
| Toutes listes concernées | suppression | confirmer | mise à jour locale | suppression | `useConfirmation` | dialogue, pas de route |
