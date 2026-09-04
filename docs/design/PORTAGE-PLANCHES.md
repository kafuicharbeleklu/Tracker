# Portage des planches — où on en est

**Établi le 04/09/2026**, contre `_ds_manifest.json` du projet Claude Design « TRACKER »
(40 cartes). Ce fichier se tient à jour à chaque planche portée : c'est la seule carte
qui dise ce qui reste, et elle a déjà démenti une estimation faite de tête.

**9 portées · 1 partielle · 30 restantes.**

Une planche est dite **portée** quand sa forme a été relevée sur la planche elle-même
(pas sur un lot), appliquée, et vérifiée à l'écran à 393 px.

---

## Les références du système — 00.

| | Planche | Ce qu'elle porte dans le code | État |
| --- | --- | --- | --- |
| 00.1 | Direction esthétique | `index.css` — les 58 valeurs du socle | **acquis** (bascule du 15/08) |
| 00.2 | Lexique | vocabulaire des écrans | non relevé |
| 00.3 | Les trois régimes | `AppLayout`, les bascules 600 / 840 | **non porté** |
| 00.4 | Le rail | `NavigationRail`, `Sidebar`, gabarits ≥ 768 | **non porté** |
| 00.5 | Sans rail | `WizardLayout`, `FullScreenFormLayout` | **non porté** |

> 00.3 à 00.5 tiennent le **régime tablette et bureau**. Tout ce qui a été porté jusqu'ici
> l'a été au téléphone. C'est un chantier à part entière, et il touche les 28 écrans.

## Les pages du produit

| | Planche | Écran(s) | État |
| --- | --- | --- | --- |
| 02.1 | Connexion | `LoginPage` | porté le 08/08, **avant** la passe — à revérifier |
| 02.2 | Première connexion | `ChangePasswordPage` | non porté (lot 15 non appliqué) |
| 03.1 | Tableau de bord | `DashboardPage` | **porté** |
| 03.2 | « À traiter » | zone du tableau de bord | porté avec 03.1 |
| 03.3 | Tâches | `TasksPage` | **porté** |
| 04.1 | Liste équipements | `InventoryPage` | **portée** (mesurée) |
| 04.2 | Détail équipement | `EquipmentDetailsPage` | **porté** (pilote) |
| 04.3 | Créer, corriger, sortir | `AddEquipmentPage`, `ImportEquipmentPage`, `IncidentSheet`, `RetireSheet` | **portée** (mesurée) |
| 04.4 | La suite de l'incident | — (entité `Incident`, lot 8 non appliqué) | **non porté** |
| 05.1 | Liste utilisateurs | `UsersPage` | **porté** |
| 05.2 | Fiche d'une personne | `UserDetailsPage` | **porté** |
| 05.3 | Créer un compte | `InviteSheet`, `AddUserPage`, `ImportUsersPage` | **portée** — création par invitation |
| 06.1 | Le parcours complet | `AssignmentWizardPage`, `ReturnWizardPage` | **non porté** |
| 06.2 | L'attestation | l'étape d'attestation des deux assistants | **non porté** |
| 06.3 | Fins de flux | les clôtures | **non porté** |
| 06.4 | Demander un équipement | `NewRequestPage` | **non porté** |
| 06.5 | Arbitrer une demande | détail d'arbitrage | **non porté** — la planche dit qu'elle cesse d'être une file |
| 07.1 | Mon compte | `SettingsPage` (`/settings/account`) | **non porté** |
| 09.1 | Catalogue | `ManagementPage`, `CategoryDetailsPage`, `AddCategoryPage` | **non porté** |
| 09.2 | Fiche de modèle et imports | `ModelDetailsPage`, les trois imports | **non porté** |
| 10.1 | Emplacements | `LocationsPage`, `SiteDetailsPage` | **porté** |
| 11.1 | Accès | `RbacPage` | **non porté** — refonte, arbitrage en attente |
| 14.1 | Paramètres | `SettingsPage` | **non porté** |
| 15.1 | Finances et rapports | `FinanceManagementPage`, `ExpenseJournalPage`, `ReportsPage` | **non porté** |
| 16.1 | Inventaire — vue globale | `AuditPage` | **non porté** |
| 16.2 | Inventaire — la campagne | `AuditDetailsPage` | **non porté** |

## Les composants partagés — 17.

Ils portent la moitié du produit : une décision y vaut pour N écrans.

| | Planche | Composant | État |
| --- | --- | --- | --- |
| 17.1 | États d'écran (4 états) | `ScreenState` | **non porté** |
| 17.2 | Sélection et confirmation (20 emplois) | `SelectionTopBar`, `BulkActionBar`, `ConfirmationSheet` | **non porté** |
| 17.3 | L'attente et le scan (28 écrans) | `Skeleton`, `ScanView` | **non porté** |
| 17.4 | La feuille d'acte (9 actes) | la feuille des actes | **non porté** |
| 17.5 | Le retour transitoire (168 messages) | `Snackbar`, `InlineError` | **non porté** |
| 17.6 | Le geste d'ajout (6 emplois) | `FabContainer` | **non porté** |
| 17.7 | La barre du bas (28 écrans) | `NavigationBar` | **non porté** |
| 17.8 | L'en-tête de liste (6 emplois) | `ListTemplate` | **partiel** — et **antérieure à la passe sobre** (voir ci-dessous) |
| 17.9 | La donnée et son explication | `InfoTip` | **non porté** |

---

## Deux arbitrages tranchés le 04/09

**17.8 est antérieure à la passe sobre, et 04.1 l'emporte.** La planche du composant
décrit un en-tête à titre de 20 px et un champ de recherche **cerné** ; les quatre
planches de pages de la passe sobre (03.3, 04.1, 05.1, 10.1) donnent 28 px et un champ
**rempli**. 17.8 garde par ailleurs les pastilles d'état dans la bande, que 04.1 déplace
dans la feuille de filtre. Sa matrice des six slots reste juste — c'est son dessin qui a
vieilli. À reprendre quand la planche sera rejouée.

**Le dessin de l'import reste celui de 09.2.** 04.3 colonne 2 dessine l'import du parc
en deux cartes à tuile teintée, avec sa barre de progression et son pied jaune ; le
gabarit `ReferentialImportTemplate` sert **trois** écrans, et le redessiner pour un
seul les ferait diverger. Le **contrat** de 04.3 est porté (pays et emplacement
requis, identifiant déduit, huit colonnes facultatives) ; sa **forme** attend 09.2.

**Le rayon de vignette reste à 6.** 04.1 et 05.1 écrivent `border-radius:4px` sur la
vignette de rangée, mais le socle (`styles.css`) déclare « 6 pour les héros et les
vignettes », et `CORRESPONDANCE-ICONES.md` §6 le redit — « vignette de rangée (40 px,
rayon 6) ». Deux sources transverses contre deux pages : le jeton ne bouge pas.

## Ce que le compte apprend

**Les transitions sont le trou le plus large.** Le groupe `06.` — le parcours, l'attestation,
les clôtures, la demande, l'arbitrage — n'est pas touché du tout côté forme. Les lots 1 à 7
y ont corrigé des mécanismes (le refus, l'annulation, la réception, le barème du retour),
pas leur dessin. C'est là que vit « la validation d'une tâche », et elle passe par
l'attestation de 06.2, qu'aucun écran ne dessine encore.

**Les formulaires n'ont rien reçu.** Créer, corriger, sortir un équipement (04.3), créer un
compte (05.3), les fiches de catalogue et les trois imports (09.1, 09.2) : sept écrans de
saisie, aucun porté.

**Les composants partagés non plus.** 17.1 à 17.9 valent chacun pour N écrans ; les porter
tôt évite de reprendre N fois la même chose. 17.7 (la barre du bas) et 17.1 (les états
d'écran) touchent les 28 écrans à eux deux.

**Et tout ce qui précède ne concerne que le téléphone.** 00.3 à 00.5 tiennent le rail et le
bureau, et rien n'a été relevé de ce côté.

## Ordre proposé

1. **Les composants partagés d'abord** — 17.1, 17.7, 17.5, 17.2. Une décision pour N écrans,
   et ils passent avant les pages qui les emploient (c'est ce que dit `PROMPT-AGENT-CODE.md`
   §2, étape 1).
2. **Les transitions** — 06.2 puis 06.1, 06.4, 06.5, 06.3. Le cœur fonctionnel, et le trou
   le plus visible.
3. **Les listes et fiches restantes** — 04.1, 09.1, 09.2, 16.1, 16.2, 15.1.
4. **Les formulaires** — 04.3, 05.3.
5. **Les réglages** — 14.1, 07.1, 11.1 (celle-ci après arbitrage du vocabulaire RBAC).
6. **Le rail et le bureau** — 00.3, 00.4, 00.5, sur tout ce qui précède.
