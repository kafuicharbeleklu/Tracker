# Audit UX/UI & Responsive — Neemba Tracker

> **Diagnostic uniquement — aucune modification de code.**
> Date : **2026-07-07** · Arbre de travail (non commité) · **Remplace la version du 2026-07-02**, dont les constats sont re-vérifiés en §2 (beaucoup ont été corrigés par la vague du 3 juillet) et dont les points encore valides sont conservés avec leurs identifiants (X1…X11).
>
> **Référentiel** : MD3 n'est **plus la cible**. La cible est le design system propriétaire Neemba/CAT (jaune `#FDC910` / noir / blanc), **non finalisé** — le jaune en accent probable, le noir/charbon en rôle fonctionnel, non arbitré. Aucun écart à la spec Google MD3 n'est signalé comme problème en soi. Chaque constat est **Observé** (vu au rendu) ou **Inféré** (code seul), et typé **Application** (le DS a déjà la solution) ou **Design system** (le DS n'a pas encore de réponse). Sévérité : Bloquant / Majeur / Mineur / Polish · Effort : XS / S / M / **L (= étendre le DS)**.

---

## 1. Méthode & preuves

**Rendu réel** : `npm run dev` + Playwright Chromium 1.61, captures relues visuellement + **mesures DOM** (styles calculés, boîtes englobantes, ratios de contraste WCAG calculés sur les couleurs rendues).

- **Form factors** : téléphone 393×852 (DPR 2-3, tactile), tablette 768×1024, desktop 1440×900, + **téléphone paysage 852×393** (cas absent de la passe du 07-02, qui testait 800×360).
- **Personas** : `alice.admin` (SuperAdmin), `ethan.user` (User), `jane.manager` (Manager), `nora.manager` / `marc.finance` (finance).
- **~150 captures** sur les 11 domaines (toutes les routes principales, onglets, modales, sheets, états d'erreur, 2 wizards pas à pas, tiroir ouvert depuis 3 pages différentes × 2 personas).
- **Objet audité** : l'**arbre de travail** (≈150 fichiers `src/` modifiés non commités depuis `23c8b0a`, incluant le re-branding jaune/noir et une vague de correctifs datée du 3 juillet — les baselines visuelles ont été régénérées le 2026-07-03). Les rapports automatisés de février (`md3-a11y-*`, `md3-multidevice-*`) prédatent cette vague : traités comme pistes périmées, pas comme faits.
- **Preuves** : captures dans le scratchpad de session (`pilot/`, `gapfill/`, `inventory/`, `finance/shots/`, `audit/shots/`, `auth/`, `users/`) — stockage éphémère ; le protocole de régénération est en annexe.

**Limites de cette passe** : listes vides inaccessibles (INV-9 du 07-02 confirmé : un `[]` persistant est re-semé par les mocks) ; pages Détail catégorie/modèle, imports emplacements/modèles et graphiques « Synthèse » finance non re-couverts en profondeur ; instances X5 (simulé vs réel) hors chips « DÉMO » non re-vérifiées une à une ; captures de focus clavier prises (`auth/login_expanded_focus_*.png`) mais non dépouillées ; MSAL réel non testable en dev.

---

## 2. Statut des constats du 2026-07-02

La vague de correctifs du 3 juillet a traité une grande partie de l'audit précédent — plusieurs fichiers citent même les identifiants de l'audit (`destinations.ts` « audit X1 », `WizardLayout.tsx` « audit W-2 »).

### 2.1 Corrigés (vérifiés au rendu ou dans le code)

| Constat 07-02 | Preuve de correction |
|---|---|
| **W** Stepper wizard tronqué (« Équipeme… ») + débordement portrait | Portrait compact = « Étape N sur M » + barre de progression (`WizardLayout.tsx:41-47`, capture `pilot/compact_alice_assignment_wizard.png`) ; libellés complets à 1440px |
| **X1** ≥4 sources de libellés de nav | Registre unique `src/constants/destinations.ts` (docstring cite X1), consommé par Sidebar/NavigationBar/Rail/TopAppBar ; « Taches/Equipe » sans accents du rail : disparu |
| **X2** Libellé actif du rail illisible | Rail tablette : pastille jaune sur l'icône, libellé lisible (`pilot/medium_dashboard.png`) |
| **X8** PageTabs sans affordance d'overflow | Fondu + chevron + navigation clavier implémentés (`PageTabs.tsx:178-208`, capture `pilot/real_rbac_compact.png`). Résiduel : découvrabilité moyenne (§4.1) et Paramètres **hors** PageTabs (§4.8) |
| **X9 (dashboard)** 5 KPI pleine taille sur téléphone | Variante compacte livrée (`MetricCard` prop `compact`, `DashboardPage.tsx:434`) ; densité correcte en capture |
| **DASH** Dashboard non façonné par persona | Persona User : « Mes équipements / Demandes en cours / Réceptions à confirmer » + CTA « Nouvelle demande » (`pilot/compact_ethan_dashboard.png`) |
| **AUTH** Coordonnées perso du développeur en pied de login | Remplacées par mentions internes (« Application interne — contactez votre support informatique », `auth/login_compact.png`) |
| **SET-1** Aperçu amortissement ×1.5 arbitraire | Calcul via le vrai moteur (`calculateLinearDepreciation`, `SettingsPage.tsx:77-92`) + note explicite pour le cas dégressif (`:466-468`) — l'item « SIMULATION » du brief est **réglé** : étiqueté « Aperçu », « Base (Exemple) », note de méthode |
| **SET** « Déconnexion » orphelin en haut de page | Déplacé dans la section Compte (captures `auth/settings_*_account_tab.png`) |
| **LOC** « Dernier audit » codé en dur | Affiche « — » + lien vers les campagnes (`gapfill/locations_expanded.png`) |
| **AUD/LOC** Comptes contradictoires (8 vs 0) | Le repli est désormais étiqueté « AU SITE — SERVICE NON RENSEIGNÉ » côté Emplacements et l'Audit précise « rattaché(s) au service » — la règle est explicitée (les libellés restent améliorables, §4.7) |
| **APP** Bandeau jargon « workflow standard / Parcours précédent » | Absent de toutes les captures approbations |
| **INV-7** « Télécharger le modèle » mort (2 imports) | `handleDownloadTemplate` réel (`ImportEquipmentPage.tsx:150`) |
| **NAV** Destination fantôme `admin_users` | Plus aucune occurrence dans `src/` |
| **NAV** Route inconnue → dashboard silencieux | `useAppNavigation.ts:104-107` route vers `not_found` ; page 404 dédiée (`AppLayout.tsx:326-338`) |
| **X5 (partiel)** Politique simulé ≠ réel | Chips « DÉMO » observées sur la carte Sécurité du compte et la feuille PIN (`pilot/compact_alice_user_details.png`, `gapfill/approval_detail_voir_expanded.png`) — la politique existe, son application n'est pas encore systématique (§2.3) |

### 2.2 Toujours ouverts (re-observés dans cette passe)

| Constat 07-02 | État 07-07 |
|---|---|
| **INV-1** Corbeille destructive seule action par ligne | Toujours vrai, et généralisé : inventaire, utilisateurs, finance (« Supprimer » par carte), RBAC — passé au registre transversal (**X15**, §5) |
| **X9 (hors dashboard)** Densité des stats compactes | RBAC : 5 bandeaux pleine largeur ≈ 1er écran entier (`pilot/real_rbac_compact.png`) ; Audit vue globale : même famille |
| **X11** PageHeader compact/medium | Bande vide toujours rendue au-dessus de la nav de Paramètres en compact (`gapfill/../real_settings_compact.png`) |
| **LOC** Hauteurs de panneaux figées → espaces morts en compact | Toujours visibles (`gapfill/locations_compact.png`) |
| **APP** Vues Manager déroutantes (0 demande vs dashboard) | Non re-testé avec données seedées ; la cohérence croisée dashboard ↔ page Approbations par persona reste à vérifier |

### 2.3 Non re-vérifiés (à reprendre dans la passe suivante)

X3 (actions tactiles Emplacements — **probablement corrigé** : icônes visibles sur la ligne sélectionnée en compact, à confirmer sur vrai tactile) · X4 (carte-option) · X6 (formats de date) · X7 (palette badges — toujours bloqué en attente d'arbitrage de marque) · X10 (map icônes) · INV-4 (fallback image) · INV-8 (parsing CSV) · USR (stats codées en dur — les chiffres affichés sont désormais plausibles, à confirmer dans le code) · LOC (champs de modale jetés, interactifs imbriqués) · AUD (dégagement FAB, empilement de chrome) · FIN (chiffres inventés de la Synthèse — **instance phare X5 à re-vérifier en priorité**) · EntityRow (troncature des sous-titres) · RBAC (9 `<select>` natifs).

---

## 3. Les points signalés dans le brief

| Point signalé | Verdict |
|---|---|
| Badges d'avatar déformés (Derniers événements) | **CONFIRMÉ — mesuré** : 18×22 px (ratio 0,82) avec `border-radius:9999px` → ovale. Cause : wrapper non-flex, l'icône inline-flex 12px repose sur la ligne de base du texte (+4px de descente). `DashboardPage.tsx:555`. Mineur / XS |
| Texte d'événement tronqué au bord | **CONFIRMÉ** : `white-space:nowrap` hérité de `Button` (`Button.tsx:103`) + `text-overflow:clip` → coupe en plein mot sans ellipse, chevron hors écran (393px **et** 768px). Les rangées sont des `Button` à 15 surcharges `!` alors qu'**`EntityRow` existe**. Majeur / XS (call-site) → S (EntityRow). Pas de débordement horizontal au niveau page (mesuré) |
| Sous-menu Rôles & accès à scroll horizontal | **CONFIRMÉ avec nuance** : 4 onglets ≈ 590px pour 393px (« Workflows » à 452px, « Affectations » à 589px, mesures DOM) ; mais `PageTabs` a désormais fondu + chevron (X8 corrigé) — le comportement est voulu, la découvrabilité reste moyenne. Pattern présent sur 8 pages. La **vraie** solution existe déjà en interne : libellés courts adaptatifs de la finance (§4.6). Mineur / S |
| Tiroir : items différents selon la page d'ouverture | **CONFIRMÉ, cause racine identifiée — décision de rendu, PAS le RBAC** : `AppLayout.tsx:366` passe `hidePrimaryShortcuts={usesBottomNavShortcuts}` (`:90-103`) et `Sidebar.tsx:271-309` masque Tableau de bord/Équipements/Utilisateurs/Approbations quand la bottom bar est visible (dédoublonnage volontaire). Reproduit ×3 pages ; cas aggravé persona User : tiroir réduit à **Audit + Paramètres** (~90 % vide). Pas de verrouillage réel (la bottom bar garde les 4 sections) mais perçu comme un menu cassé. Contre-preuve que la redondance est acceptable : en **tablette** le tiroir affiche tout alors que le rail duplique 4 destinations. **Majeur / S** |
| Navigation Paramètres mal adaptée au mobile | **CONFIRMÉ, pire que le cas RBAC** : nav en pilules maison (3ᵉ pattern d'onglets), `min-w-max` → 627px pour 393px, `overflow-x-auto` **sans aucune affordance** — « Collecte au… » coupé, « Compte » et « Aide » indécouvrables. `SettingsPage.tsx:353-375` (Buttons à 8 surcharges `!`). **Majeur / S** |
| Bloc « SIMULATION » (`SettingsPage.tsx:77`) | **Réglé depuis le 07-02** (§2.1) : calcul réel + étiquetage « Aperçu / Base (Exemple) / note de méthode ». Aucune action requise |

---

## 4. Nouveaux constats (postérieurs ou invisibles à la passe du 07-02)

### 4.1 Shell & navigation

**À préserver** : bascule bottom bar ↔ rail ↔ sidebar pilotée par une source unique (`breakpoints.ts`, `AppLayout.tsx:57-62`) ; focus trap complet du tiroir (`Sidebar.tsx:114-190`) ; PageTabs ARIA/clavier complet ; page « Accès refusé » avec issue de secours ; badge de comptage Approbations dans le tiroir.

| Périmètre | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif proposé | Effort |
|---|---|---|---|---|---|---|---|
| Shell | **Téléphone paysage ≥840px** (iPhone 14 Pro/15 Pro Max…) | Classes de fenêtre **largeur seule** : un téléphone en paysage reçoit le shell desktop complet — sidebar ≈30 % de 852px, cartes KPI écrasées, icônes qui chevauchent le texte et débordent des cartes (`pilot/landscape_dashboard.png`). Le chemin `isCompactLandscape` (`AppLayout.tsx:61-62`) ne se déclenche que <600px de large — quasi mort | Observé | **DS** → **X13** | Majeur | Porte de hauteur (ex. `max-height:480px` + paysage → shell rail) | M |
| Tiroir | Téléphone | Cf. §3 (items masqués + tiroir quasi vide User) | Observé | Application | Majeur | Toujours afficher toutes les destinations permises | S |
| Nav | Téléphone | « Tâches » (bottom bar) vs « Approbations » (tiroir/titre) : registre unique mais saut sémantique fort ; les autres paires (Accueil, Actifs, Équipe) passent bien | Observé | Application (wording) | Mineur | shortLabel « Demandes » | XS |
| TopAppBar | Téléphone (fiches) | Burger (barre) + flèche retour (header de page) empilés : deux affordances de navigation contradictoires en ~90px (`pilot/compact_alice_user_details.png`) | Observé | Application | Polish | Retour dans la barre sur les fiches ; burger réservé aux pages racines | S |
| BottomSheet | Téléphone | Feuille « Détail de l'activité » capturée avec la bottom bar **par-dessus** (z-index/course d'animation, `finance/shots/compact_nora_11_ticket_modal.png`) | Observé ×1 — à reproduire | Application | Mineur | Vérifier z-index BottomAppBar vs scrim | XS |

### 4.2 Dashboard

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| Dashboard | Tél./Tablette | Événements : nowrap+clip (§3) | Observé | Application (EntityRow inutilisé) | Majeur | `whitespace-normal` puis EntityRow | XS→S |
| Dashboard | Téléphone | Badge avatar ovale (§3) | Observé | Application | Mineur | `flex items-center justify-center leading-none` | XS |
| Dashboard | Téléphone | `MetricCard` compacte tronque les longs titres FR : « DEMANDES EN C... » (persona User) | Observé | DS (variante compacte sans stratégie de libellé long) | Mineur | Autoriser 2 lignes ou corps réduit | XS–S |
| Dashboard | Téléphone | Carte événements `min-h-[400px]` (`DashboardPage.tsx:539`) : grand vide avec 1 seul événement | Observé | Application | Polish | Pas de min-height en compact | XS |

### 4.3 Approbations + Rapports

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| ApprovalsPage | **Desktop** | Mise en page mobile étirée : colonne unique de grosses cartes, paires de boutons Refuser/Affecter ≈550px, 2 demandes remplissent 1440×900 (`pilot/expanded_alice_approvals.png`) — données pourtant tabulaires. Les patterns denses existent déjà en interne (rangée Historique, grille Audit, table Finance) | Observé | Application + **X14** | **Majeur** | Rangées denses/table en expanded ; cartes conservées en compact | M |
| ApprovalsPage | Toutes | Demande **déjà approuvée** avec bouton « Refuser » actif ; « Voir » (lecture seule) déclenche un **step-up PIN** (étiqueté DÉMO). **Vérifié au clic (07-07)** : le clic ouvre d'abord la grille PIN ; une fois le PIN validé, la transition est **refusée proprement par la couche métier** — `APPROVAL_TRANSITIONS` n'a pas d'entrée `Approved` (`businessRules.ts:108-119`), le refus précède même le bypass SuperAdmin (`:428-436`) ; toast « Transition non autorisée: Approved -> Rejected. », chip « Approuvée » intacte, aucune erreur console (`pilot/refuser_after_pin.png`, `refuser_final_state.png`). **Aucun état incohérent possible → reste Majeur, pas Bloquant** : bug d'affichage (bouton à ne pas rendre) aggravé d'un parcours punitif — l'utilisateur franchit un PIN pour recevoir un message technique brut. Nuance : le journal de sécurité logge « Status: SUCCESS » pour le PIN alors que l'action échoue ensuite — exact mais trompeur dans un journal d'audit | Observé (rendu + code) | Logique — **Chantier D** (symptôme UI documenté) | **Majeur (confirmé)** | UI : ne rendre « Refuser » que si la transition est permise (la matrice est importable) ; message d'erreur utilisateur (pas le littéral technique) ; pas de step-up avant une action vouée à l'échec ni en lecture | — |
| ApprovalsPage | Toutes | « En cours » = grosses cartes, « Historique » = rangées denses : deux traitements de ligne dans deux onglets adjacents | Observé | Application | Mineur | Converger vers la rangée dense (règle aussi le desktop) | S |
| ReportsPage | Toutes | **« Exporter en PDF » : texte jaune sur blanc ≈1,6:1** — action primaire à peine lisible (`gapfill/reports_expanded.png`) | Observé | **X12** | **Majeur** | Bouton tonal/sombre ; jaune réservé aux fonds à texte noir | XS |
| ReportsPage | Toutes | « Historique par Utilisateur » sans sélecteur d'utilisateur : cible de l'export ambiguë | Observé | Application | Mineur | Sélecteur avant activation | S |

### 4.4 Inventaire & Utilisateurs

**À préserver** (confirme le 07-02) : liste inventaire = page modèle sur 3 form factors ; « X actif(s) visible(s) selon vos droits » ; libellés longs (« EN ATTENTE D'APPROBATION MANAGER ») **sans déformation** dans les chips ; wizards au double pattern (stepper desktop ↔ « Étape N sur M » mobile) avec recherche + pagination internes ; dialogues de confirmation sur toutes les actions d'administration utilisateur ; frontière admin clarifiée : `src/features/admin/pages/` est **vide** — l'administration vit dans UserDetails (carte Sécurité) et Gestion/RBAC (Polish : supprimer le dossier vide ou y matérialiser la zone Admin, lié à SET-2 du 07-02).

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| EquipmentDetails | Toutes | « VALEUR ACTUELLE **120 XOF** » en jaune sur blanc ≈1,6:1 (`inventory/compact_alice_details_longbadge.png`) | Observé | **X12** | Majeur | on-surface + accent jaune non textuel | XS |
| Listes (inv./users) | Toutes | Mise en évidence de l'utilisateur courant par **titre de ligne jaune** sur fond clair (~2:1), sémantique non explicitée. **Rectifié 08-07** : c'était l'état **hover** d'`EntityRow` (`group-hover:text-primary`) capté par le pointeur — aucune sémantique utilisateur-courant n'existe | Observé | **X12** | Mineur | ~~Teinte de fond neutre + chip « Vous »~~ → jaune retiré du hover (`34fae70`), feedback porté par le fond | XS |
| UserDetails | Téléphone | « Éditer » (notes) flotte en bas à droite de la carte, détaché de son champ | Observé | Application | Polish | Affordance d'édition dans l'en-tête de carte | XS |

### 4.5 Finance

**À préserver** : le domaine desktop le plus abouti (table réelle, KPI héro noir-sur-jaune 11,2:1, barre budget, CTA pointillé « Nouvelle Dépense ») ; recomposition table→cartes en compact ; **libellés d'onglets adaptatifs en compact** (« Synthèse Globale »→« Synthèse ») — seule page qui résout complètement l'overflow d'onglets : pattern à généraliser (§5 X8-bis).

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| AddBudgetModal | Toutes | **Mojibake** : UTF-8 double-encodé dans le source, rendu « MatÃ©riel IT » (`src/features/finance/components/AddBudgetModal.tsx`) | Observé (octets vérifiés) | Application (contenu) | Majeur | Corriger l'encodage + garde CI (grep `Ã©`) | XS |

### 4.6 Audit

**À préserver — l'hypothèse « candidat au retravail desktop » est réfutée** : la vue globale est la **meilleure page desktop de l'app** (grille Attendus/Scannés/Manquants/Écarts/Dernier scan/Statut/Action, filtres Pays/Site/Service, actions désactivées avant sélection, `gapfill/audit_overview_expanded.png`) ; détail campagne : onglets à compteurs, cycle de session (Démarrer/Réinitialiser/Clôturer), bandeaux honnêtes (« Le scan QR est réservé à la version mobile… »), erreur de scan invalide précise et rejetable (`audit/shots/c9_*.png`), gestion des exceptions et clôture confirmée (c11–c13).

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| AuditDetails — scan | Téléphone | « Scanner un QR machine » = **textarea de collage JSON**, pas de capture caméra (`audit/shots/c8_*.png`) — pour l'opérateur terrain, UX de développeur ; un humain ne peut pas retaper le contenu d'un QR | Observé | **DS/feature** | **Majeur** | Capture caméra (getUserMedia/BarcodeDetector), collage en secours | L |
| Audit vue globale | Desktop | Label « AUDIT PHYSIQUE » jaune sur blanc ≈1,6:1 | Observé | **X12** | Mineur | Libellé sombre ou chip jaune à texte noir | XS |

### 4.7 Emplacements

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| LocationsPage | Téléphone | FAB « + » unique alors que le desktop a trois « + » par colonne : niveau d'ajout (pays/site/service) ambigu | Observé | Application | Mineur | FAB → menu à 3 options, ou boutons par section | XS–S |
| LocationsPage | Téléphone | Contexte de sélection et récapitulatif séparés de 3+ écrans (piles de panneaux) — rejoint la reco 07-02 (accordéon/drill-down) | Observé | Application | Mineur | Drill-down (liste→push) en compact | M |
| LocationsPage | Toutes | « AU SITE — SERVICE NON RENSEIGNÉ » : l'étiquetage du repli (bien) reste cryptique ; « VOIR LES CAMPAGNES D'AUDIT » en pseudo-lien italique | Observé | Application (copy) | Polish | Phrase claire + vrai lien | XS |

### 4.8 Gestion / RBAC / Paramètres

**À préserver** : catalogue desktop en grille 3 colonnes avec onglets à compteurs et actions hover-reveal ; RBAC desktop « Rôles & groupes » en **vraie composition 2 colonnes** (pas une page mobile étirée, `pilot/expanded_alice_rbac.png`) ; Permissions en 2 colonnes de cases cohérentes.

| Page | Plateforme | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|---|
| SettingsPage | Téléphone | Nav en pilules sans affordance (§3, item du brief) | Observé | Application | **Majeur** | Basculer sur `PageTabs` + libellés courts | S |
| RbacManagementPanel | Toutes | **Français sans accents dans tout le panneau** : « Edition des permissions », « Role a modifier », « Gerer inventaire », « Methodes d'authentification », « Enregistrer le role », « Creer », « Avance »… (`pilot/rbac_permissions_expanded.png`) — le reste de l'app est accentué | Observé | Application (contenu) | Mineur | Restaurer les accents (1 fichier) | XS–S |
| RBAC Workflows | Toutes | **3ᵉ pattern de stepper** (« Parcours guidé » en pilules + bascule Simple/Avancé) distinct des deux variantes de `WizardLayout` ; formulaires créer/modifier/supprimer entrelacés sur une même surface avec « Supprimer » rouge proéminent (`pilot/rbac_workflows_expanded.png`) | Observé | Application + DS | Mineur | Réutiliser le stepper WizardLayout ; séparer créer/modifier | M |
| RBAC | Toutes | Listes de cases dans des boîtes à hauteur fixe, coupées en plein item sans affordance de scroll (« Responsable sécurité », « Scanner audit » à moitié visibles) | Observé | Application | Mineur | Fondu/scrollbar visible ; pleine hauteur en expanded | XS–S |
| Catalogue | Tactile | Actions cartes en hover-reveal : repli tactile non vérifié (`MEDIA.hoverCapable` existe) | Inféré | Application | Mineur | Vérifier tap-reveal, sinon kebab permanent | S |

### 4.9 Auth

Domaine sans Majeur : carte de connexion propre (marque TR, champs étiquetés + astérisques, œil mot de passe, comptes démo, erreur e-mail inconnu, `auth/login_compact*.png`) ; « Première connexion » avec erreur de non-correspondance claire (`auth/changepassword_compact_mismatch_error.png`) ; accès refusé aux deux breakpoints. Polish : avatars démo identifiés seulement par pastilles S/A/M/U (découvrabilité) ; pas de bouton SSO visible en build dev (le mode « production only » du 07-02 n'a pas été re-testé).

---

## 5. Registre transversal du design system (X…, continuité 07-02)

- **X1 Résolu** · **X2 Résolu** · **X8 Résolu au niveau composant** (affordance livrée ; découvrabilité moyenne ; Paramètres hors pattern).
- **X8-bis (nouveau, S)** : **généraliser les libellés courts adaptatifs** de la finance dans l'API `PageTabs` (8 pages consommatrices) — la meilleure réponse interne à l'overflow d'onglets. **Livré 08-07** (`TabItem.shortLabel`, `c628b20` + applications finance/management/audit/users).
- **X9 Partiel (S)** : densité compacte livrée pour les KPI dashboard ; toujours manquante pour les bandeaux stats (RBAC, Audit) — variante « rangée de stats » unique au DS.
- **X11 Ouvert (S)** : bande vide du PageHeader toujours rendue (Paramètres compact).
- **X3/X4/X5/X6/X7/X10 : non re-vérifiés** (§2.3) — X5 garde une instance phare à contrôler (Synthèse finance) ; X7 reste bloqué en attente de la palette.
- **X12 (nouveau — Majeur, S)** : **règle « le jaune n'est jamais une couleur de texte/glyphe sur fond clair »**. Mesures rendues : noir-sur-jaune = **11,2:1** (excellent — onglets, boutons) ; jaune `#FDC910` sur blanc = **~1,55:1** (échec texte 4,5:1 ET non-texte 3:1). Instances observées : « Exporter en PDF » (Rapports), « VALEUR ACTUELLE » (fiche équipement), noms d'utilisateur courant (listes), label « AUDIT PHYSIQUE » (Audit). Les icônes jaunes sur blanc (KPI, item actif bottom bar) ne passent que grâce à un second indice (libellé sombre en gras) — à inscrire comme exigence. **Règle inscrite + 4 instances corrigées le 08-07** (`DESIGN_TOKENS_SPEC.md` §2.5 ; l'instance « listes » était le hover d'`EntityRow`, pas une sémantique utilisateur-courant). D'autres instances restent à balayer avec la règle (ex. « Mettre à jour » carte Sécurité, initiales d'avatar).
- **X13 (nouveau — Majeur, M)** : classes de fenêtre **largeur seule** (`breakpoints.ts`) → téléphone paysage ≥840px traité en desktop (§4.1). Ajouter une dimension hauteur/orientation.
- **X14 (nouveau — M–L)** : **pas de DataTable/liste dense partagée**, mais trois implémentations saines à factoriser (grille Audit, `<table>` Finance, colonnes EntityRow). Premier consommateur : Approbations desktop.
- **X15 (nouveau — M, généralise INV-1)** : **convention d'actions destructives par ligne** — corbeille/« Supprimer » rouge sur chaque ligne (inventaire, utilisateurs, finance, RBAC), gardée par confirmation mais lourde et accidentogène au tactile. Menu ⋮ ou suppression en mode sélection.
- **X16 (nouveau — Mineur aujourd'hui, Majeur dès que le journal deviendra réel — XS)** : **le journal de sécurité consigne le résultat du facteur, pas celui de l'action protégée**. Vérifié au rendu (§4.3) : un « Refuser » validé au PIN puis bloqué par la couche métier laisse une trace `Status: SUCCESS` (`SecurityGate.tsx:58-75` → `logSecurityAction`, `src/lib/security.ts:21-33`) — exact (le PIN a réussi) mais trompeur pour toute relecture d'audit : chaque action gated qui échoue après step-up est journalisée comme un succès. Correctif : consigner séparément l'issue du facteur et l'issue de l'action (ou ne journaliser qu'après le dénouement de l'action). Mécanisme DÉMO aujourd'hui, mais ce contrat de journalisation sera vraisemblablement repris tel quel côté backend — à trancher avec le Chantier D.
- **Constat positif transversal** : l'étiquetage « DÉMO » (carte Sécurité, feuille PIN) et « (Exemple) » (aperçu amortissement) applique la politique X5 — à ériger en règle pour toute fonctionnalité simulée.
- **Hygiène de contenu (nouveau — XS + outillage S)** : mojibake (`AddBudgetModal.tsx`) + panneau RBAC sans accents → garde CI (grep séquences `Ã`) et relecture des littéraux FR.

---

## 6. Top 10 — impact maximal / effort minimal (état 07-07)

> **Implémenté le 2026-07-08** (`cea19b8..92c20a0`, 16 commits — chaque lot vérifié : build + lint + md3:check + check:encoding + smoke test Playwright du flux). Notes d'écart : #4 instance « listes » — le « nom d'utilisateur courant en jaune » était en réalité l'état **hover** d'`EntityRow` (`group-hover:text-primary`), aucune sémantique utilisateur-courant n'existe → jaune retiré du hover, chip « Vous » sans objet ; #6 — le mojibake s'étendait à `FinanceManagementPage.tsx` et `index.css` (même cause), corrigés ensemble, garde `npm run check:encoding` chaînée dans `lint:md3` ; #8 — Approbations et ManagementPage n'avaient rien à raccourcir (onglets déjà courts).

| # | Correctif | Réf. | Effort | Pourquoi d'abord | État 08-07 |
|---|---|---|---|---|---|
| 1 | Dé-clipper les événements du dashboard (`whitespace-normal`, puis EntityRow) | `DashboardPage.tsx:546-571` | XS | Perte de contenu sur la page la plus vue | ✅ `cea19b8` (EntityRow reste la cible, X14) |
| 2 | Badge avatar circulaire (`flex items-center justify-center leading-none`) | `DashboardPage.tsx:555` | XS | Signal « cassé » visible dès l'accueil | ✅ `eda9809` (mesuré 18×18) |
| 3 | Tiroir : afficher toutes les destinations permises (retirer `hidePrimaryShortcuts`) | `AppLayout.tsx:366`, `Sidebar.tsx:271-309` | S | Fin du « menu qui perd des sections » ; répare le tiroir du persona User | ✅ `69ef4e5` |
| 4 | X12 : corriger les 4 instances jaune-texte + écrire la règle | Rapports / fiche équipement / listes / Audit | XS×4 | Pires échecs de contraste mesurés (1,6:1) | ✅ règle `47706d1` (spec §2.5) + `ef8949c`/`e60209c`/`34fae70`/`6b6cf53` |
| 5 | Nav Paramètres → PageTabs (libellés courts) | `SettingsPage.tsx:353-375` | S | 2 sections sur 5 redeviennent découvrables | ✅ `ea12ba8` |
| 6 | Mojibake « MatÃ©riel IT » + garde CI | `AddBudgetModal.tsx` | XS | Corruption de texte visible en finance | ✅ `cb3d09d` (+ `check:encoding`) |
| 7 | Accents du panneau RBAC | `RbacManagementPanel.tsx` | XS–S | Qualité de contenu d'une surface d'admin | ✅ `9ffd818` (~65 littéraux) |
| 8 | X8-bis : libellés courts adaptatifs dans PageTabs | `PageTabs.tsx` + 8 pages | S | Traite l'overflow d'onglets partout d'un coup | ✅ API `c628b20` + 4 commits d'application |
| 9 | MetricCard compacte : titres sur 2 lignes | `src/components/ui/MetricCard.tsx` | XS–S | Stoppe « DEMANDES EN C... » | ✅ `7c01621` |
| 10 | Approbations desktop en rangées denses (réutiliser Historique/grille Audit) | `ApprovalsPage.tsx` | M | Pire page desktop « mobile étiré » restante | ✅ `92c20a0` (rangée dense d'Historique + actions inline, ~63px/rangée) |

*(Exclus car logique — Chantier D : « Refuser » sur demande approuvée, PIN sur « Voir ». Exclus car L : capture caméra QR, X14 DataTable, X13 breakpoints — fort impact, additions système.)*

---

## Annexe — reproduction

- `npm run dev` (port 3000). Sur la VM Linux, `node_modules` était installé depuis Windows : les 4 binaires natifs Linux (`@rollup/rollup-linux-x64-gnu@4.62.2`, `@esbuild/linux-x64@0.25.12`, `@tailwindcss/oxide-linux-x64-gnu@4.3.2`, `lightningcss-linux-x64-gnu@1.32.0`) ont été extraits dans `node_modules` via `npm pack` + `tar` (**`--no-save`, `package.json`/lock intacts**).
- Playwright Chromium ; connexion démo (placeholder `/Ex:\s*nom@/i` + mot de passe quelconque) ; **session en état React : naviguer par hash uniquement**, jamais recharger après connexion.
- Le shell ne scrolle pas le body : les captures pleine page exigent de poser temporairement `height:auto; overflow:visible` sur `html, body, #root>div, main, main .overflow-y-auto`, puis de rétablir. **Ne jamais diagnostiquer un débordement horizontal sur une capture « déroulée »** (elle gonfle la largeur) — utiliser des captures viewport + un balayage DOM des éléments dont `getBoundingClientRect().right > innerWidth`.
- Contrastes calculés sur les couleurs `getComputedStyle` rendues (formule de luminance relative WCAG).
