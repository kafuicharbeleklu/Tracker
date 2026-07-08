# Audit UX Complet — Neemba Tracker (22/02/2026)

## Périmètre et méthode
- Revue heuristique desktop + mobile des parcours critiques: Auth, Navigation, Inventaire, Utilisateurs, Finance, Audit, Rôles & accès.
- Contrôles automatisés exploités:
  - `docs/md3-multidevice-audit-results-2026-02-22.json` et `.md` (60/60 pass).
  - `docs/md3-a11y-automation-results-2026-02-20.md` (dernier run exploitable: 11/11 pass).
- Lecture ciblée du code UI/flows pour corréler les symptômes UX aux points d’implémentation.

## Synthèse exécutive
- Score UX global estimé: **6.6 / 10**
- Points forts:
  - Cohérence visuelle globale en progression (tokens MD3, densité plus homogène).
  - Listes principales (inventaire/users) mieux structurées et plus scannables.
  - Contrôles mobile présents sur les parcours critiques (FAB d’actions, wizard, audit).
- Points à corriger en priorité:
  - Audit: prévention d’erreur insuffisante sur le ciblage de service et la clôture.
  - Navigation mobile: état actif ambigu pour plusieurs vues.
  - Accessibilité sémantique incomplète (tabs/panels, zones de filtres, items cliquables non natifs).
  - Robustesse d’interaction: soumission formulaire non native et absence de fallback erreur sur routes lazy.

## Findings priorisés

### Bloquants

1. **Lancement d’audit sur service implicite (première ligne), sans sélection explicite**
- Impact: risque de démarrer/auditer le mauvais service.
- Preuve: `src/features/audit/components/PhysicalAuditView.tsx:270`, `src/features/audit/components/PhysicalAuditView.tsx:299`, `src/features/audit/components/PhysicalAuditView.tsx:426`.
- Détail: `handleStartAudit` et “Ouvrir le détail” ciblent `displayedRows[0]` sans état de sélection utilisateur.
- Correctif: imposer une sélection de ligne (state `selectedServiceRow`), désactiver “Démarrer/Ouvrir” si non sélectionné, et afficher le service sélectionné dans le CTA.

2. **Incohérence de périmètre pendant session d’audit**
- Impact: l’UI peut afficher un service A alors que la baseline auditée reste celle de B.
- Preuve: `src/features/audit/pages/AuditDetailsPage.tsx:263`, `src/features/audit/pages/AuditDetailsPage.tsx:268`, `src/features/audit/pages/AuditDetailsPage.tsx:516`, `src/features/audit/pages/AuditDetailsPage.tsx:545`.
- Détail: la baseline (`baselineIds`) est figée au démarrage, mais les sélecteurs Pays/Site/Service restent modifiables.
- Correctif: verrouiller les sélecteurs tant que la session est active, ou réinitialiser explicitement la session au changement de périmètre.

3. **Clôture d’audit destructive sans confirmation de masse**
- Impact: retrait involontaire d’équipements du service (manquants) en un clic.
- Preuve: `src/features/audit/pages/AuditDetailsPage.tsx:335`, `src/features/audit/pages/AuditDetailsPage.tsx:360`, `src/features/audit/pages/AuditDetailsPage.tsx:366`.
- Correctif: ajouter un modal de confirmation avec volume impacté + conséquence métier, exiger une confirmation explicite.

### Majeurs

4. **Action mobile “Scanner un QR” trompeuse sur la vue Audit globale**
- Impact: libellé promet un scan, action réelle ouvre seulement le détail.
- Preuve: `src/features/audit/components/PhysicalAuditView.tsx:461`, `src/features/audit/components/PhysicalAuditView.tsx:465`, `src/features/audit/components/PhysicalAuditView.tsx:479`.
- Correctif: soit ouvrir directement le scanner (ou side sheet de scan), soit renommer l’action “Ouvrir détail audit”.

5. **Navigation mobile: vues Finance/Gestion/Audit/Settings sans état actif clair**
- Impact: perte d’orientation, onglet actif non identifiable.
- Preuve: `src/components/layout/AppLayout.tsx:88`, `src/components/layout/AppLayout.tsx:101`, `src/components/layout/NavigationBar.tsx:76`, `src/components/layout/NavigationBar.tsx:108`.
- Détail: `resolveBottomNavDestination` retourne `null` pour plusieurs vues affichées via “Plus”.
- Correctif: mapper ces vues vers `more` (aria-current + style actif), ou ajouter des destinations explicites.

6. **Pattern tabs incomplet côté panneaux (a11y + compréhension)**
- Impact: navigation par onglets moins intelligible pour lecteurs d’écran et clavier.
- Preuve: `src/components/ui/PageTabs.tsx:97`, `src/features/finance/pages/FinanceManagementPage.tsx:684`, `src/features/finance/pages/FinanceManagementPage.tsx:721`, `src/features/users/pages/UserDetailsPage.tsx:586`, `src/features/users/pages/UserDetailsPage.tsx:694`.
- Détail: les tabs exposent `aria-controls`, mais les contenus ne déclarent pas de `role="tabpanel"` avec id correspondant.
- Correctif: ajouter des sections `tabpanel` mappées aux ids des tabs.

7. **Actions de documents en détail équipement non sémantiques**
- Impact: interaction clavier/lecteur d’écran dégradée.
- Preuve: `src/features/inventory/pages/EquipmentDetailsPage.tsx:823`, `src/features/inventory/pages/EquipmentDetailsPage.tsx:836`.
- Détail: `div` cliquables avec `onClick` sans équivalent bouton.
- Correctif: remplacer par `<button type="button">` + `aria-label`, conserver style visuel.

8. **Feedback “Enregistrer” ambigu sur Paramètres**
- Impact: confusion entre sections auto-save et sections nécessitant sauvegarde.
- Preuve: `src/features/management/pages/SettingsPage.tsx:297`, `src/features/management/pages/SettingsPage.tsx:321`, `src/features/management/pages/SettingsPage.tsx:366`.
- Détail: bouton Save visible partout mais activable seulement pour `finance/collection`.
- Correctif: rendre le CTA contextuel par section (auto-save vs save explicite) et afficher un feedback “Enregistré”.

9. **Barre de recherche: bouton filtre non relié à la zone de filtres**
- Impact: accessibilité et compréhension de l’ouverture/fermeture des filtres.
- Preuve: `src/components/ui/SearchFilterBar.tsx:90`, `src/features/inventory/pages/InventoryPage.tsx:351`, `src/features/users/pages/UsersPage.tsx:330`.
- Correctif: ajouter `aria-controls` + id stable sur le panneau de filtres; déplacer le focus au premier filtre à l’ouverture.

10. **Rôles & accès: charge cognitive élevée dans le mode Workflow**
- Impact: compréhension difficile, erreurs de configuration probables.
- Preuve: `src/features/management/components/RbacManagementPanel.tsx:1023`, `src/features/management/components/RbacManagementPanel.tsx:1072`, `src/features/management/components/RbacManagementPanel.tsx:1211`.
- Détail: beaucoup de blocs éditables simultanés, même en mode “simple”.
- Correctif: découper en étapes progressives (Sélection workflow -> Étapes -> Règles SLA -> Validation finale) avec résumé sticky.

### Mineurs

11. **Toast global positionné top-center, superposition ponctuelle du header/actions**
- Impact: bruit visuel et masquage temporaire de zones clés.
- Preuve: `src/components/ui/Snackbar.tsx:97`.
- Correctif: décaler en bas (mobile) ou marge top dynamique selon présence header sticky.

12. **Login hors mode démo: expérience de blocage peu explicite**
- Impact: “Se connecter” présent mais impossible si démo désactivée.
- Preuve: `src/features/auth/pages/LoginPage.tsx:73`.
- Correctif: masquer le formulaire démo en prod ou afficher explicitement le mode d’authentification réel attendu.

## Complément — Passe 2 (22/02/2026)

### Majeurs (nouveaux)

13. **Rail compact tronqué à 3 destinations (équipe masquée)**
- Impact: en mode compact/landscape, “Équipe” disparaît de la navigation primaire, ce qui casse la découvrabilité.
- Preuve: `src/components/layout/NavigationRail.tsx:84`, `src/components/layout/NavigationRail.tsx:101`, `src/components/layout/NavigationRail.tsx:106`.
- Détail: `allRailItems` inclut `users`, puis `slice(0, 3)` retire systématiquement la 4e destination.
- Correctif: conserver toutes les destinations autorisées dans le rail compact, ou rendre la troncature explicite via overflow/scroll + indicateur.

14. **Layouts de formulaires sans `<form>` (pas de soumission Enter ni validation native)**
- Impact: perte d’ergonomie clavier et de garde-fous HTML natifs sur des formulaires critiques.
- Preuve: `src/components/layout/FullScreenFormLayout.tsx:6`, `src/components/layout/FullScreenFormLayout.tsx:31`, `src/components/layout/FullScreenFormLayout.tsx:53`, `src/features/inventory/pages/AddEquipmentPage.tsx:197`, `src/features/inventory/pages/AddEquipmentPage.tsx:251`.
- Détail: le layout expose seulement `onSave` sur bouton; aucune balise `form`/`onSubmit` n’est propagée.
- Correctif: introduire un vrai `<form onSubmit={...}>` dans `FullScreenFormLayout`, connecter `onSave` via submit, et typer les validations.

15. **`EntityRow` combine des rôles non natifs sur une ligne dense de données**
- Impact: lecture difficile pour technologies d’assistance et repérage clavier moins fiable.
- Preuve: `src/components/ui/EntityRow.tsx:64`, `src/components/ui/EntityRow.tsx:65`, `src/components/ui/EntityRow.tsx:66`, `src/components/ui/EntityRow.tsx:89`.
- Détail: la ligne bascule entre `role="button"` et `role="listitem"` sur un `div` multi-zones interactives.
- Correctif: migrer vers un pattern plus sémantique (liste structurée + actions boutons explicites), ou table responsive si densité élevée.

16. **FAB d’actions mobile: relation de contrôle non exposée et position fixe fragile**
- Impact: contrôlabilité a11y incomplète + risque de chevauchement avec la barre basse/zone gestuelle.
- Preuve: `src/components/ui/ListActionFab.tsx:43`, `src/components/ui/ListActionFab.tsx:49`, `src/components/ui/ListActionFab.tsx:55`, `src/components/ui/ListActionFab.tsx:56`.
- Détail: le trigger n’expose ni `aria-controls` ni `aria-expanded`; positionnement fixe `bottom-32 right-4`.
- Correctif: relier trigger <-> sheet (`aria-controls`, `aria-expanded`, id stable) et utiliser une marge basée sur safe-area/bottom-nav.

### Mineurs (nouveaux)

17. **Empty states filtrés sans action de reset contextuelle**
- Impact: pour revenir à des résultats, l’utilisateur doit réouvrir la zone de filtres au lieu d’un reset direct.
- Preuve: `src/features/inventory/pages/InventoryPage.tsx:351`, `src/features/inventory/pages/InventoryPage.tsx:370`, `src/features/inventory/pages/InventoryPage.tsx:526`, `src/features/users/pages/UsersPage.tsx:330`, `src/features/users/pages/UsersPage.tsx:362`, `src/features/users/pages/UsersPage.tsx:514`.
- Détail: le bouton “Réinitialiser les filtres” n’apparaît que dans `showFilters`; l’empty state n’offre pas ce raccourci.
- Correctif: injecter un CTA “Réinitialiser” directement dans l’empty state quand un filtre/recherche est actif.

18. **Routes lazy sans fallback d’erreur (Suspense-only)**
- Impact: en cas d’échec de chargement chunk/réseau, l’utilisateur peut rester sur une vue vide sans voie de reprise.
- Preuve: `src/components/layout/AppLayout.tsx:1`, `src/components/layout/AppLayout.tsx:382`, `src/components/layout/AppLayout.tsx:384`.
- Détail: les routes sont rendues via `Suspense` uniquement, sans Error Boundary dédié.
- Correctif: encapsuler `renderContent()` dans un Error Boundary avec message clair + action “Réessayer”.

## Signaux automatisés à surveiller
- Multi-device: **60/60 pass**, mais `touchSpacingViolationsCount` élevé sur:
  - `return_wizard` (max 30)
  - `assignment_wizard` (max 23)
  - `audit_details` (max 19)
- Recommandation: intégrer un seuil de warning “touch spacing” dans le gate QA, pas seulement overflow/touch target size.

## Plan d’action recommandé

### Sprint 1 (rapide, forte valeur)
1. Sélection explicite + garde-fous sur Audit global (findings 1, 4).
2. Confirmation de clôture audit + verrouillage périmètre session (findings 2, 3).
3. Correctifs navigation mobile active state (finding 5).
4. `aria-controls` sur filtres (finding 9).
5. Corriger la troncature du rail compact (finding 13).
6. Ajouter un reset contextuel dans les empty states filtrés (finding 17).

### Sprint 2 (qualité structurelle)
1. Mise en conformité tabs/panels (finding 6).
2. Conversion des documents cliquables en boutons natifs (finding 7).
3. Refonte UX section Paramètres save/autosave (finding 8).
4. Simplification workflow Rôles & accès en parcours guidé (finding 10).
5. Introduire un vrai pattern `<form onSubmit>` dans les layouts plein écran (finding 14).
6. Refonte sémantique des lignes entité interactives (finding 15).
7. Mise en conformité a11y/safe-area du FAB d’actions mobile (finding 16).

### Sprint 3 (finitions)
1. Ajustement position snackbars (finding 11).
2. Clarification UX login non-démo (finding 12).
3. Seuil QA sur touch spacing (section “Signaux automatisés”).
4. Ajouter un Error Boundary dédié aux vues lazy (finding 18).
