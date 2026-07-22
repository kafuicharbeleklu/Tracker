# Audit UX/UI & Responsive — Neemba Tracker

> **Diagnostic uniquement — aucune modification de code.**
> Date : **2026-07-07** · Arbre de travail (non commité) · **Remplace la version du 2026-07-02**, dont les constats sont re-vérifiés en §2 (beaucoup ont été corrigés par la vague du 3 juillet) et dont les points encore valides sont conservés avec leurs identifiants (X1…X11).
> **Complété le 2026-07-08** par la §7 (**Vague 2** : clôture de la dette de vérification laissée en §2.3, post-Top 10).
> **Complété le 2026-07-09** par la §8 (**clôture du chantier** : 2 correctifs des découvertes latentes §7.3/§7.5 + spot-check borné de 5 pages — aucune nouvelle vague ouverte).
> **Complété le 2026-07-18** par la §9 (**retours directs F1–F8** : nouvelle passe de rendu ciblée — plusieurs points révisent des décisions déjà actées ; diagnostic seul, aucune implémentation avant validation).
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

**→ Verdicts rendus le 2026-07-08 en §7.1 (Vague 2).** Seul « AUD — empilement de chrome » reste à trancher au rendu.

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
| ReportsPage | Toutes | « Historique par Utilisateur » sans sélecteur d'utilisateur : cible de l'export ambiguë. **Aggravé 09-07 (§8.2)** : l'export réel est la **liste des utilisateurs** (nom/email/rôle/département), pas un historique d'attributions — promesse non tenue, requalifié **Majeur** | Observé + Inféré (code) | Application | ~~Mineur~~ **Majeur** | Sélecteur avant activation + export réellement branché sur l'historique | S |

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
- **X3/X4/X5/X6/X7/X10 — tranchés le 08-07 (§7.1)** : X3 et X10 **résolus** ; X4 ouvert (carte-option sans sémantique radio) ; X6 partiel (helper `formatDate` livré, 6 appels sans locale restants) ; X5 Synthèse **déclassée Majeur→Mineur** (KPI calculés, blocs simulés étiquetés DÉMO) ; ~~X7 toujours bloqué en attente de la palette~~ **X7 résolu le 16-07** : la palette de marque a été arbitrée par le Chantier B (Q-V1, `docs/AUDIT_DESIGN_SYSTEM.md` §9) — paires light/strong des badges validées telles quelles. Vérifié **en rendu réel** (sonde `getComputedStyle` sur 41 badges rendus, 4 pages, alice) : les 5 tons mesurent 6,28–7,15:1 (neutral 15,65:1), zéro jaune de marque dans les badges de statut. Découverte au balayage, corrigée : la pastille de comptage de `PageTabs` sur l'onglet actif perdait silencieusement sa surcharge `bg-on-primary text-primary` contre la variante warning (cn sans tailwind-merge → cascade non déterministe) et rendait warning-light au lieu de l'idiome inverse noir/jaune — corrigé en `variant="neutral"` + `!bg-on-primary !text-primary` (mesuré après correctif : 11,22:1).
- **X12 (nouveau — Majeur, S)** : **règle « le jaune n'est jamais une couleur de texte/glyphe sur fond clair »**. Mesures rendues : noir-sur-jaune = **11,2:1** (excellent — onglets, boutons) ; jaune `#FDC910` sur blanc = **~1,55:1** (échec texte 4,5:1 ET non-texte 3:1). Instances observées : « Exporter en PDF » (Rapports), « VALEUR ACTUELLE » (fiche équipement), noms d'utilisateur courant (listes), label « AUDIT PHYSIQUE » (Audit). Les icônes jaunes sur blanc (KPI, item actif bottom bar) ne passent que grâce à un second indice (libellé sombre en gras) — à inscrire comme exigence. **Règle inscrite + 4 instances corrigées le 08-07** (`DESIGN_TOKENS_SPEC.md` §2.5 ; l'instance « listes » était le hover d'`EntityRow`, pas une sémantique utilisateur-courant). **Balayage complet du solde en §7.3** : ≈15 instances texte restantes dans 7 fichiers (dont « Mettre à jour » carte Sécurité et initiales d'avatar — toutes deux dans Paramètres → Compte). **Solde traité le 08-07** (lot ① §7.5 : 14 corrigées, 1 faux positif — note §7.3).
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

## 7. Vague 2 — clôture de la dette de vérification (2026-07-08)

> Passe **code seul**, réalisée après l'implémentation du Top 10 — tous les verdicts sont **Inférés** sauf mention. Pour X12, les couleurs n'ayant pas changé depuis les mesures rendues du 07-07 (`--md-sys-color-primary` = `#FDC910`, `primary-container` = `#fff4b8`), les ratios mesurés (≈1,4–1,6:1) s'appliquent tels quels aux instances retrouvées. Aucune modification de code.

### 7.1 Items §2.3 — verdicts

| Item 07-02 | Verdict 08-07 | Preuve | App/DS | Sévérité | Effort |
|---|---|---|---|---|---|
| **X3** Actions tactiles Emplacements | **Corrigé** : hover-reveal gardé par `MEDIA.hoverCapable` — actions toujours visibles au tactile (le commentaire du correctif est en place) | `LocationsPage.tsx:346-348` | — | — | — |
| **X4** Carte-option | **Toujours ouvert** : pattern artisanal — `Button` outlined + ~10 surcharges `!` par option, états sélectionnés recodés localement, **aucune sémantique de groupe radio** (ni `role="radiogroup"` ni `aria-checked` ; seul `Toggle` en a un dans tout `src/`) | `ReturnWizardPage.tsx:301-360` (état du retour) ; même famille : `AddCategoryPage.tsx:150/178` (méthode d'amortissement) | DS | Mineur | S (sémantique) → M (composant DS) |
| **X6** Formats de date | **Partiellement corrigé** : helper central `formatDate` fr-FR (`financial.ts:181-185`, docstring explicite) adopté par 6 fichiers ; **6 appels sans locale restants** dans 3 fichiers — `TransactionTicketModal.tsx:108/147/236` (UI visible), `ReturnWizardPage.tsx:83/106` (⚠ écrit la date en locale navigateur dans des notes **persistées**), `ReportsPage.tsx:80` (en-tête d'export) | fichiers cités | Application | Mineur | XS |
| **X7** Palette badges | **Inchangé — toujours bloqué** en attente d'arbitrage de la palette de marque. **Résolu le 16-07** après arbitrage Chantier B (Q-V1) — détail en §5 | — | DS | — | — |
| **X10** Map icônes | **Corrigé** : map centrale catégorie→icône + icône neutre `devices_other` pour l'inconnu (le docstring cite X10 et interdit les maps locales) | `src/constants/categoryIcons.ts` | — | — | — |
| **INV-4** Fallback image | **Corrigé** : `onError` → icône neutre, dans les listes comme sur le héros de fiche | `EntityRow.tsx:119-129`, `EquipmentDetailsPage.tsx:432-443` | — | — | — |
| **INV-8** Parsing CSV | **Corrigé** : parser à état (guillemets, échappement) + garde anti-injection (préfixes `=+-@` neutralisés), consommé par les deux pages d'import. Résiduel toléré : pas de champs multilignes (l'export les normalise) | `csv.ts`, `ImportEquipmentPage.tsx:58-61`, `ImportUsersPage.tsx:57-60` | — | — | — |
| **USR** Stats codées en dur | **Corrigé** : « Équipements Assignés » et « Demandes en Attente » calculés depuis les données réelles | `UserDetailsPage.tsx:199-207` | — | — | — |
| **LOC** Champs de modale jetés | **Toujours ouvert** : `onClose={resetForm}` vide les champs sans garde (clic hors modale = saisie perdue). Impact faible : formulaires à 1-2 champs | `LocationsPage.tsx:235-242, 437` | Application | Polish | XS |
| **LOC** Interactifs imbriqués | **Toujours ouvert** : deux `Button` **dans** un div `role="button"` — boutons imbriqués exposés aux lecteurs d'écran | `LocationsPage.tsx:323-368` | Application | Mineur | S |
| **AUD** Dégagement FAB | **Corrigé** : FAB décalé au-dessus de la bottom bar (`safe-area + 5.5rem`) et converti en feuille d'actions étiquetées | `ListActionFab.tsx:44-60` | — | — | — |
| **AUD** Empilement de chrome | **Non re-vérifié — rendu requis** : à coupler à la prochaine passe Playwright | — | — | — | — |
| **FIN/X5** Synthèse (chiffres inventés) | **Largement corrigé — déclassé Majeur→Mineur** : les KPI et la projection sont **calculés** (vrai moteur d'amortissement, `FinanceManagementPage.tsx:176-201, 254-261`) ; les deux blocs encore simulés portent des `DemoBadge` explicites (« IA Note » :818, « Valeur par Entité » :827) — la politique X5 est appliquée. Résiduels : « Voir le détail complet » **sans `onClick`** (:853, CTA mort), mois de projection figés « Jan–Juin » et « Mai » codé en dur dans la note (:254-261, :819) | `FinanceManagementPage.tsx` | Application | Mineur | XS |
| **EntityRow** Troncature sous-titres | **Partiellement corrigé** : le titre passe en `line-clamp-2` en compact (plus de perte) ; le sous-titre reste `truncate` 1 ligne avec ellipse | `EntityRow.tsx:145, 150-157` | DS | Polish | XS |
| **RBAC** 9 `<select>` natifs | **Corrigé** : **0** `<select>` natif dans `src/` — remplacés par `SelectField`/`SelectFilter` (listbox ARIA, navigation clavier complète) | `SelectField.tsx`, `SelectFilter.tsx` | — | — | — |

À la marge : le constat §4.7-1 (FAB « + » ambigu, Emplacements) était déjà couvert par le code au moment de l'audit — le FAB compact ouvre une feuille à actions étiquetées « Ajouter un pays / un site / un service » contextuelles (+ import/export), livrée avec la vague du 3 juillet (`LocationsPage.tsx:180-215, 566-570`). Le résiduel se réduit à la découvrabilité avant tap, générique à tout FAB → **reclassé Polish**.

### 7.2 INV-9 — le réamorçage mock, confirmé et aggravé (item à part)

**Confirmé, et plus large que le constat du 07-02.** Deux mécanismes distincts dans `DataContext.tsx` :

1. **Un `[]` persistant est re-semé** : l'hydratation n'accepte le localStorage que si `Array.isArray(parsed) && parsed.length > 0` (users :539, equipment :554) — tout vider ramène les mocks au rechargement. Les états vides des listes restent **intestables au rendu**.
2. **La fusion ressuscite les suppressions unitaires** : `mergePersistedUsersWithSeed` / `mergePersistedEquipmentWithSeed` ré-ajoutent tout élément du seed absent de la liste persistée (`seededMissing`, :307-311 et :381-385). Supprimer un utilisateur ou un équipement du seed le fait **revenir au prochain chargement**. Aucun tombstone.

Conséquences : (a) dette de vérification récurrente — `EmptyState` et les flux « liste vide » sont invérifiables, ce qui conditionne la fiabilité de plusieurs constats passés et futurs ; (b) comportement trompeur — une suppression confirmée par dialogue n'est pas durable. **Majeur / M** ; le correctif est une décision de conception (tombstones persistés, ou re-seed opt-in « Restaurer les données de démo » dans Paramètres) — **à trancher avec le Chantier D** (couche données).

### 7.3 X12 — balayage complet du solde

Balayage statique : **67** occurrences de `text-primary` hors états hover/focus, dont **≈15 instances texte** en violation de la règle (spec §2.5) dans 7 fichiers — y compris les 2 notées à la clôture du Top 10, toutes deux dans **Paramètres → Compte** (pas UserDetails) :

| Fichier | Instances texte (jaune sur fond clair) |
|---|---|
| `SettingsPage.tsx` | :785 « Mettre à jour » (carte Sécurité) · :744 initiales d'avatar sur `bg-primary/10` · :466 titre « Aperçu » · :477 montant de simulation · :550 stat appareils liés |
| `FinanceManagementPage.tsx` | :582 lien fournisseur · :1070 « Restant » du budget (branche positive) · :1086 chip `bg-primary/10 text-primary` |
| `EquipmentDetailsPage.tsx` | :608 statut « En réparation » · :870 « Voir tout » |
| `AddCategoryPage.tsx` | :150/:178 méthode d'amortissement active · :232 carte de durée sélectionnée |
| `AddModelPage.tsx` | :130 « Télécharger l'image » |
| `AddEquipmentPage.tsx` | :323 bouton `!text-primary` sur `!bg-primary-container` |
| `UserDetailsPage.tsx` | :751 label « Appareil principal » — **faux positif** (voir note) |

Le reste (~40) : icônes/spinners jaunes sur fond clair accompagnés d'un libellé sombre — couverts par l'exigence « second indice » de la règle ; à ne pas retoucher en masse. Revue au cas par cas uniquement quand l'icône est seule porteuse d'information (ex. spinners `FileDropzone.tsx:119`, `AddExpenseModal.tsx:420/434`).

**Soldé le 2026-07-08 (lot ① §7.5).** Protocole : échantillon de 5 instances re-mesuré au rendu avant traitement (Settings :785/:744, Finance :1070 branche positive, Équipement :608 statut réel « En réparation », AddCategory :150 état sélectionné) — **5/5 en violation, 1,39–1,55:1**, solde jugé fiable. **14 instances corrigées** (idiome Top 10 : valeurs/libellés en `on-surface`(-variant), `on-primary-container` sur fonds teintés primaires, accent jaune conservé en bordure/ring/fond) ; re-mesure post-correctif : **13,6–17,5:1**. **1 faux positif exclu** : `UserDetailsPage:751` — le balayage code-seul ne voyait pas la carte héro `from-inverse-surface` ; mesuré au rendu **11,27:1** (jaune sur `#1c1917`), conforme à la règle (fond sombre). Découverte annexe : la route directe `#/management/categories/add` (vue `add_category`) affiche « Vue non trouvée » — la vue est mappée dans `useAppNavigation` et gatée dans `AppLayout`, mais absente du switch de rendu (AddCategory/AddModel sont des modales de ManagementPage) ; bug de routage latent, hors périmètre C. **Corrigé le 09-07** (`1d183e0`, §8.1).

### 7.4 Le constat « trois implémentations de tabs » ne tient plus

`PageTabs` est désormais **l'unique** implémentation `role="tablist"` de `src/` (9 consommateurs : approbations, audit ×2, finance, gestion ×3, paramètres, fiche utilisateur). La nav Paramètres est migrée en compact/medium (Top 10 #5) et sa nav latérale expanded est une composition voulue à base de variants `Button` standard. `SegmentedButton` subsiste dans 2 modales finance — primitive distincte (bascule de mode), pas une dérive. **Ce qui reste** du registre : le 3ᵉ pattern de **stepper** (RBAC Workflows, §4.8) — hors sujet tabs, inchangé.

### 7.5 Short-list Vague 2 — à valider avant implémentation

> **Implémentée le 2026-07-08/09** (feu vert reçu) : 6 lots livrés en 6 commits (`b029f33`, `67e8e0a`, `9f364b0`, `7dd5e13`, `b7fab94`, `4c14e83`), chacun vérifié build + lint (rouge connu DataContext inchangé) + md3 + encoding + smoke Playwright au rendu. Clôture : baselines visuelles rafraîchies (6 mises à jour intentionnelles, 0 régression, 39/39 Pass) et repasse a11y **16/16 Pass**. Détail par lot dans la colonne « Lot ».

Pas de top 10 cette fois : le solde utile tient en 6 lots, classés par rapport impact/effort.

| # | Lot | Réf. | Sévérité | Effort |
|---|---|---|---|---|
| 1 | **X12 : solder les ≈15 instances texte** (tableau §7.3) — la règle est actée, il ne reste que l'application. **Livré 08-07** : 14 corrigées + 1 faux positif exclu (note §7.3) | 7 fichiers, §7.3 | Majeur | XS×15 ≈ S–M |
| 2 | **CTA morts ×2** : « Voir le détail complet » (Synthèse finance) et « Voir tout » (documents de la fiche équipement) — même famille qu'INV-7 ; câbler ou retirer. **Livré 08-07 : retirés** — les deux étaient des affordances mortes sous des blocs déjà étiquetés DemoBadge (« Valeur par Entité » simulée, documents fictifs), aucune cible réelle à câbler | `FinanceManagementPage.tsx:853`, `EquipmentDetailsPage.tsx:870` | Mineur | XS |
| 3 | **X6 : solder les 6 appels de date sans locale** — dont ReturnWizard qui écrit la locale du navigateur dans des notes persistées. **Livré 08-07** : `formatDate` partout + `formatDateTime` fr-FR ajouté à `financial.ts` pour l'usage `toLocaleString()` ; 0 appel sans locale restant dans `src/` ; vérifié au rendu avec navigateur forcé ja-JP (jj/mm/aaaa conservé). À la marge : les événements hors ASSIGN/RETURN/CREATE/DELETE/UPDATE (ex. LOGIN) ouvrent un ticket au corps vide (dispatch sans branche par défaut, préexistant). **Corrigé le 09-07** (`2ef5980`, §8.1) | 3 fichiers, §7.1 | Mineur | XS |
| 4 | **X5 résiduel Synthèse** : ancrer les mois de projection sur la date courante et dé-coder « Mai » de l'IA Note (ou dériver la phrase des données). **Livré 08-07** : mois générés depuis la date courante (fr-FR), phrase dérivée de la projection (mois où la valeur passe sous 50 % du parc, année affichée si différente) avec repli si aucune dépréciation ; le CTA mort :853 était déjà tombé au lot 2 | `FinanceManagementPage.tsx:254-261, 819` | Mineur | XS–S |
| 5 | **X4 : sémantique radiogroup sur les cartes-options** (état du retour + méthode d'amortissement) ; extraction d'un composant DS seulement si un 3ᵉ usage apparaît. **Livré 08-07** : pattern APG complet sur les deux sites — `role="radiogroup"` étiqueté, `role="radio"` + `aria-checked`, tabindex tournant, flèches directionnelles (vérifié au rendu : sélection + focus suivent les flèches) ; pas de composant DS extrait (2 usages) | `ReturnWizardPage.tsx:301-360`, `AddCategoryPage.tsx:150-240` | Mineur | S |
| 6 | **LOC : dé-imbriquer les interactifs** des rangées Emplacements (rangée = bouton contenant 2 boutons). **Livré 08-07** : la rangée devient un conteneur présentational ; la sélection est un Button DS (`aria-current`) frère des actions Renommer/Supprimer — 0 interactif imbriqué au rendu, hover-reveal et clavier natif conservés | `LocationsPage.tsx:323-368` | Mineur | S |

**Hors short-list, à décision** : **INV-9** (Majeur / M — design de persistance, à trancher avec le Chantier D ; débloque le test des états vides pour toutes les passes suivantes) · **AUD empilement de chrome** + cohérence dashboard↔Approbations par persona (§2.2) : à coupler à la **prochaine passe de rendu** Playwright · **X7** (bloqué palette) · les **L** connus (X13 paysage, X14 DataTable, caméra QR) inchangés.

---

## 8. Clôture du chantier (2026-07-09)

> Périmètre volontairement resserré : les **2 découvertes latentes** consignées lors de la short-list §7.5 sont corrigées, un **spot-check borné à 5 pages** couvre les zones les moins regardées des vagues précédentes, et le chantier est clos. **Aucune nouvelle vague ouverte** — les constats §8.2 sont consignés, pas traités.

### 8.1 Correctifs livrés (2 commits)

| Constat d'origine | Correctif | Commit | Vérification |
|---|---|---|---|
| Route directe `#/management/categories/add` (et `models/add`) → « Vue non trouvée » (§7.3) : vues mappées + gatées mais absentes du switch `AppLayout` ; AddCategory/AddModel sont des **modales** de ManagementPage | Aucun pattern « lien profond → modale » n'existait ; suivi du seul précédent route→état (`initialStatus` d'InventoryPage) : `AppLayout` rend la liste parente avec `initialAddModal`, ManagementPage ouvre la modale (et le bon onglet) au rendu, la **fermeture resynchronise l'URL** sur `/management`. Déclenchement bouton inchangé (état local, pas de navigation) | `1d183e0` | Playwright : deep-link ouvre la bonne modale (titre document inclus), Annuler referme + resynchronise le hash, onglet Modèles actif sur `models/add`, flux bouton intact (0 `role="dialog"` résiduel) |
| Ticket d'activité **au corps vide** pour les types hors ASSIGN\*/RETURN/CREATE/DELETE/UPDATE (§7.5 lot 3, à la marge). Recensement des types **réellement émis** : 18 sur 24 déclarés (jamais émis : `ASSIGN`, `ASSIGN_MANAGER_OK`, `ASSIGN_IT_SELECTED`, `ASSIGN_DOTATION_OK`, `LOGOUT`, `EXPORT`) ; **12 émis non couverts** (LOGIN, APPROVAL\_\*, REPAIR\_\*, ASSIGN_MANAGER_WAIT/IT_PROCESSING/DOTATION_WAIT/DISPUTED, VIEW_SENSITIVE) | Traitement systémique, pas de cas par cas : **rendu générique de repli** (icône via `getHistoryEventIcon` existant, titre via nouvelle map `HISTORY_EVENT_TITLES` de `businessRules.ts`, pastille neutre surface) ; CREATE/DELETE/UPDATE gardent leur iconographie dédiée, tickets attribution/retour inchangés | `2ef5980` | Playwright : LOGIN (« Connexion ») et REPAIR_START (« Entrée en réparation ») rendus avec bloc Cible/Date ; non-régression sur un type déjà couvert |

### 8.2 Spot-check borné — 5 pages (diagnostic seul, aucun correctif)

**Méthode** : captures viewport 1440×900 + 412×915 (protocole annexe), balayage DOM de débordement horizontal (**0 débordement sur les 13 captures**), persona `alice.admin` + page de connexion anonyme. Pages choisies pour leur faible couverture antérieure : **flux auth** (nominal, erreur d'identifiants), **Reports**, **Inventory** (filtres, recherche sans résultat, mobile — au-delà d'INV-4/8/9), **Import équipements**, **Détails équipement**.

**RAS (à préserver)** : Inventory reste la page modèle (bandeau « FILTRE ACTIF » avec rappel de la recherche, état vide « Aucun résultat » avec double « Réinitialiser les filtres », compteur « 0 filtré(s) sur 14 visible(s) ») ; login mobile propre ; import équipements sobre et correct (modèle CSV téléchargeable, CTA désactivés tant que rien n'est déposé).

| Page | Constat | Obs./Inf. | App/DS | Sévérité | Correctif | Effort |
|---|---|---|---|---|---|---|
| ReportsPage | **Les 4 exports lisent les mocks statiques** (`mockAllEquipment`, `mockAllUsersExtended`) et non le `DataContext` vivant : tout ajout/modif/suppression de la session est **absent des exports** (CSV et PDF). Seule page de l'app branchée sur les mocks bruts | Inféré (`ReportsPage.tsx:24-47/97-115`) + Observé | Logique — **Chantier D** (symptôme UX documenté) | **Majeur** | Brancher sur `useData()`/`useHistory()` | S |
| ReportsPage | Cartes « Équipement Vieillissant » et « Expiration des Garanties » (ids 3/4) : aucune branche dédiée → **fallback « Rapport générique »** — CSV d'une ligne `{info, date}`, PDF « rapport de démonstration ». 2 exports sur 4 sont des **placebos** sans chip DÉMO (famille X5) | Inféré (`ReportsPage.tsx:43-47/116-124`) | Logique — **Chantier D** + **X5** | **Majeur** | Implémenter les 2 rapports ou étiqueter DÉMO / retirer les cartes | S–M |
| ReportsPage | « Historique par Utilisateur » : voir la **requalification Majeur** portée au constat existant §4.3 (l'export réel est la liste des utilisateurs) | — | — | — | — | — |
| LoginPage | Identifiants inconnus : l'erreur (style + message « Identifiants incorrects. Vérifiez vos informations. ») n'est portée que par le **champ mot de passe** — l'email fautif reste visuellement valide ; un **toast doublonne** le message inline au même moment. Le message générique lui-même est un bon choix (pas d'énumération de comptes) | Observé | Application | Mineur | Erreur au niveau du formulaire (les 2 champs) ; supprimer le toast redondant | XS |
| ImportEquipmentPage | Aide en français mais **colonnes attendues en anglais** (`Name`, `AssetID`, `Type`, `Model`) — cohérent avec le modèle CSV téléchargeable, donc fonctionnel, mais dissonant dans une UI 100 % française | Observé | Application | Polish | Trancher avec le glossaire (X1) : colonnes françaises partout ou convention anglaise documentée | XS |
| EquipmentDetailsPage | Deux formats de date dans la même vue : « Acheté le **05/01/2025** » (en-tête) vs « Expire le **5 janvier 2028** » / « **5 janvier 2028** » (garantie, amortissement) — X6 avait soldé les locales, pas l'harmonisation court/long | Observé | Application (famille X6) | Polish | Un format par niveau (court en chip, long en corps) via les helpers `financial.ts` | XS |

**Résultat borné assumé** : au-delà de Reports (dont la logique d'export était hors des passes précédentes), rien de significatif ne remonte — les pages re-balayées confirment les acquis.

### 8.3 État QA & dépôt à la clôture

- `build` OK · `lint` : uniquement le rouge connu (12× exhaustive-deps `DataContext.tsx`, décision Chantier D) · `md3:check` + `check:encoding` OK.
- **Visuel : 39/39 Pass, 0 régression, baselines intactes** (`md3-visual-regression-results-2026-07-09`) — run de comparaison seul : aucun état baseliné n'est touché (le ticket ouvert et la route `categories/add` ne sont pas baselinés).
- **A11y : non relancé**, aucune nouvelle surface interactive (la modale du deep-link est la même modale déjà auditée en §7.5 lot 5 ; le ticket générique n'ajoute que du texte dans le SideSheet existant).
- Restent ouverts pour la suite (inchangés) : INV-9, tiroir/X13/X14 (Chantier D/DS), ~~X7 (palette)~~ (**X7 résolu le 16-07**, cf. §5), AUD chrome à re-vérifier au rendu, et les constats §8.2 ci-dessus.

---

## 9. Retours directs F1–F8 (2026-07-18)

> **Diagnostic seul — aucune modification de code.** Huit retours d'usage sur l'app en l'état, au-delà des passes précédentes. Trois d'entre eux **révisent des décisions déjà prises** (F3 ↔ correctif « Déconnexion » du 07-02, F6 ↔ verdict X8 « le scroll d'onglets est voulu », F8 ↔ Top 10 #3 « toujours tout afficher ») : validation explicite requise avant implémentation.
>
> **Méthode** : `npm run dev` + Playwright Chromium (chromium-1228), persona `alice.admin` (+ fiche `ethan.user` pour F7), viewports 393×852 (DPR 3, tactile), 768×1024, 1440×900. Sondes DOM (`getBoundingClientRect`, styles calculés, balayage de débordement horizontal, MutationObserver + journal d'événements scroll pour F7). Chaque constat est étiqueté **Constaté** (≡ « Observé » des sections précédentes : vu/mesuré au rendu) ou **Déduit** (≡ « Inféré » : code seul). Captures et scripts de sonde dans le scratchpad de session (`shots/f1_*`–`f8_*`, éphémère — protocole en annexe).

### 9.1 F1 — Tailles trop petites en mobile (KPI Dashboard, stats Audit, boutons)

**Constat (Constaté — mesures rendues à 393×852) :**

| Élément | Boîte | Typo mesurée | Verdict |
|---|---|---|---|
| KPI Dashboard (`MetricCard compact`) ×5 | 177×81 (dernière 361×81) | titre `section-label` **11 px**/13,2 w700 MAJUSCULES ls 0,825 px · valeur `title-large` **18 px**/24 w700 | Tuile entière cliquable (cible tactile OK) — le problème est typographique |
| Cartes finance de la même page (`MetricCard` non compact) | pleine largeur | valeur **30 px** (`text-[1.875rem]`, hors échelle de tokens) | Incohérence interne : 18 px et 30 px pour le même rôle « valeur de stat », à un scroll d'écart |
| Stats Audit (`PhysicalAuditView`) ×6 | 158×62–78 | libellé **11 px** w500 MAJUSCULES · valeur **18 px** w700 | Non cliquables ; libellé « CAMPAGNES ACTIVES » passe sur 2 lignes et domine la valeur |
| Boutons Retour / Attribuer (compact) | 175×**40** | 14 px w600 | **40 px < plancher de facto 44 px** (`min-h-11` utilisé partout ailleurs en compact : SidebarItem, actions UserDetails) et < cible MD3 48 dp |

Le référentiel demandé n'existe pas formellement : **aucun seuil tactile n'est inscrit dans `DESIGN_TOKENS_SPEC.md`** ; le plancher opérant du chantier est 44 px (44×44 mesurés sur toutes les surfaces récentes). À inscrire. Sur la lisibilité : la valeur 18 px vient de l'écrasement brand de `title-large` (22→18 px, `index.css:716`) — le libellé gras majuscules à crénage large rivalise visuellement avec la valeur, et les KPI paraissent minuscules à côté des cartes finance à 30 px.

**Proposition** : créer un cran typographique dédié `stat-value` (≈ 24 px compact / 30 px expanded — remplace aussi le `text-[1.875rem]` arbitraire), libellé en `label-small` non gras ; le véhiculer par la variante DS « rangée de stats » déjà ouverte (**X9**, couvre aussi RBAC/Audit — jonction §9.4) ; boutons Retour/Attribuer → `size="lg"` (`min-h-11`) en compact ; inscrire le plancher 44 px dans la spec. **Sévérité** : Mineur (lisibilité, pas de perte fonctionnelle). **Effort** : XS (boutons + spec) + S (variante stats, 3 domaines consommateurs).

> **Exécution (2026-07-18).** Cran `text-stat-value` créé (index.css : vars + classe + step-down compact dans la section Responsive Typography — **30px/36 w700, 24px/28 <600px**) ; déclaré dans `cn()` (`utils.ts`) et couvert par `check-cn-merge` (sonde passée de 15 à 16 classes). Véhicule X9 = **MetricCard** (le composant est déjà la primitive stats) : valeur des deux variantes → `text-stat-value` (le `text-[1.875rem]` arbitraire disparaît), libellé de la variante compacte → `label-small` w500 sans majuscules forcées. Mesuré au rendu : à 393, KPI **et** cartes finance = 24px/700 (l'écart 18↔30 du même écran est soldé) ; à 1440 = 30px/36. Boutons Attribuer/Retour/Supprimer du héro compact EquipmentDetails : `!h-10` → `!min-h-11`, mesuré 44px. Plancher tactile 44px inscrit en **§4.4 de DESIGN_TOKENS_SPEC.md** + cran stat-value consigné en §4.2. L'application aux stats RBAC/Audit part avec F4 (§9.4).

### 9.2 F2 — Bordures non harmonisées

**Constat (Déduit — inventaire code, juxtapositions Constatées au rendu §9.1) :** occurrences dans `src/` : `rounded-md` 129 · `full` 120 · `lg` 94 · `card` 81 · `xl` 46 · `sm` 35 · **`rounded` nu 22** · `xs` 15 · `none` 5 · directionnels 5. Après remapping tokens (`tailwind.config.js` → `--md-sys-shape-*` → `--radius-*`), **7 noms rendent 3 valeurs** : `xs`=2 px · `sm`=`md`=4 px · `lg`=`xl`=`card`=8 px · `full`. L'échelle effective **2/4/8/full est donc déjà serrée** — le contraste perçu vient d'ailleurs :

1. **Deux familles de chips** : les primitives DS (`Badge`, `StatusBadge`, `Chip`, `Menu`, `Tooltip`) sont à 4 px, mais ≥ 12 chips ad hoc sont en `rounded-full` (stade complet) : `ApprovalRow.tsx:96/247`, `ReturnWizardPage.tsx:398/455/695`, `AddEquipmentPage.tsx:404`, `AssignmentWizardPage.tsx:743`, `ModelDetailsPage.tsx:42`, `SettingsPage.tsx:341/347/797`… Même rôle, deux formes, parfois dans la même vue.
2. **Même rôle, rayon différent selon la page** : tuiles stats Audit 4 px (`rounded-md`) vs cartes KPI Dashboard 8 px (`rounded-xl`) — mesuré au rendu. De facto l'app suit plutôt une règle d'**imbrication** (surface externe 8 px / élément interne 4 px), mais elle n'est écrite nulle part, d'où les dérives.
3. **Hors-tokens silencieux** : 22 `rounded` nus = 0,25 rem *défaut Tailwind* (coïncide avec 4 px aujourd'hui, décorrélé des tokens demain) ; `rounded-2xl/3xl` (16/24 px, non remappés) restent disponibles sans garde ; les noms de variables CSS sont **décalés d'un cran** vs les utilitaires (`--radius-lg` = 4 px alimente `rounded-md` — piège pour le CSS artisanal) ; `.control-field` (`index.css:799`) est **mort** (0 consommateur).

**Proposition** : inscrire l'échelle **2/4/8/full + la règle d'imbrication** dans `DESIGN_TOKENS_SPEC.md` (nouveau point de registre) ; canoniser un nom par valeur (`xs`/`md`/`card`/`full`, les autres dépréciés en doc) ; convertir les 22 `rounded` nus ; **unifier les chips** sur la primitive (ou créer une variante `pill` unique si l'arrondi complet est souhaité pour les états — un seul choix, à trancher) ; supprimer `.control-field` ; étendre `md3:check` (interdire `rounded` nu et `rounded-2xl/3xl`). **Sévérité** : Mineur. **Effort** : XS (spec + garde + nettoyage) + S (chips, ~12 sites).

> **Exécution (2026-07-22).** (1) **Spec §4.1 réécrite** : la table 6/10/16 (jamais implémentée) remplacée par l'échelle rendue 2/4/8/full, noms canoniques `xs`/`md`/`card`/`full` avec alias dépréciés, règle d'imbrication 8 externe / 4 interne formalisée, piège du décalage `--radius-*` documenté. (2) **20 `rounded` nus convertis** en `rounded-md` (10 fichiers ; le décompte 22 incluait 2 occurrences en commentaire, reformulées). (3) **Chips unifiés sur la primitive** : choix tranché = idiome `Badge` (4 px), les 11 chips texte `rounded-full` listés convertis (`ApprovalRow`, `ReturnWizard` ×3, `AddEquipment`, `AssignmentWizard`, `ModelDetails`, `SettingsPage` ×3, badge 2FA) ; `rounded-full` reste réservé au circulaire (avatars, pastilles, FAB). (4) `.control-field` supprimé d'index.css (0 consommateur). (5) **Garde `md3:check` étendue** : `rounded` nu et `rounded-2xl/3xl` interdits dans `src/` — passe au vert sur l'arbre.

### 9.3 F3 — Paramètres : adaptation réelle + déconnexion accessible

**Constat (Constaté aux 3 tailles) :**
- **Compact 393** : PageTabs opérationnel (fondu + chevron), mais « Compte » (x=366) et « Aide » naissent hors écran ; surtout, le bouton **« Modifier » de la carte profil déborde du viewport** (right = 429 > 393 — seul débordement horizontal détecté sur les 3 pages sondées ; carte `flex` sans repli, `SettingsPage.tsx:745-758`).
- **Medium 768** : **mêmes onglets hors écran** (« Compte » right = 831, « Aide » 916 > 768) — la tablette a le défaut du téléphone ; contenu en colonne unique correcte.
- **Expanded** : nav verticale 256 px + contenu `max-w-3xl` — vraie composition, RAS.
- **Déconnexion** : uniquement dans l'onglet le **moins découvrable** (hors écran sur 2 des 3 classes). Chemin mobile complet : Plus → Paramètres → faire défiler les onglets → Compte → Déconnexion (40 px). Le correctif du 07-02 (« Déconnexion orphelin » → section Compte) a réglé l'orphelin mais créé l'enterrement — c'est la décision à réviser.
- **Découvertes annexes (Constaté + Déduit)** : la carte « Mon Compte » est **codée en dur** — « Alice Admin », `alice.admin@tracker.app`, badges SuperAdmin/IT Department, aucun `useAuth` dans le fichier : tout utilisateur connecté voit Alice ; « Modifier » est un **CTA mort** (aucun `onClick`, famille INV-7) ; les sections sont en état local non routé (`activeSection`) — pas de deep-link ni retour, contrairement à RBAC qui route les siennes.

**Proposition** : (1) **Déconnexion à 2 taps de partout** : l'ajouter à la nav secondaire du tiroir (sous Paramètres), en la conservant dans Compte ; (2) onglets : étendre X8-bis à medium pour cette page (shortLabels aussi entre 600–839 px) et **remonter « Compte » en 2ᵉ position** (« Affichage » 115 px + « Compte » court ≈ 104 px : visible sans scroll même à 393) ; (3) `flex-wrap` sur la carte profil ; (4) brancher la carte sur `useAuth` et câbler ou retirer « Modifier » ; (5) router les sections (parité RBAC). **Sévérité** : Majeur (débordement + logout + carte mensongère). **Effort** : XS×4 + S (routage) ≈ S.

> **Exécution (2026-07-18).** (1) Item « Déconnexion » ajouté à la nav secondaire du **tiroir modal** (`Sidebar.onLogout`, rendu seulement en mode modal — la sidebar permanente desktop est inchangée), conservé dans Compte ; vérifié : Plus → Déconnexion → retour login (2 taps). (2) Carte « Mon Compte » **branchée sur la session** (`useAuth().currentUser` : initiales calculées, nom, e-mail, badges rôle/département) — vérifiée avec **jane.manager** : « Jane Manager », plus aucune trace d'Alice. (3) CTA « Modifier » mort **retiré** (famille INV-7, précédent §7.5-②) — le débordement right=429 disparaît avec lui ; carte passée en `flex-wrap` + `min-w-0` par sûreté. (4) « Compte » en 2ᵉ position + nouvelle option `PageTabs.shortLabelBreakpoint='expanded'` (X8-bis jusqu'à 839 px pour cette page) — mesuré : à 393, « Compte » right=244 (visible sans scroll) ; à 768, les **5 onglets tiennent** (Aide right=655, contre 916 avant). (5) Routage des sections **non traité** (hors feu vert) — reste au reliquat.

### 9.4 F4 — Rôles & accès et Audit : adaptation réelle sur 3 tailles

**Constat (Constaté)** — verdict d'ensemble : les deux pages « tiennent » (0 débordement horizontal mesuré aux 3 tailles) mais la **recomposition n'existe qu'en expanded** ; compact/medium restent des colonnes mobiles étirées avec des stats surdimensionnées.

| Page | Compact | Medium | Expanded |
|---|---|---|---|
| RBAC | 5 bandeaux stats pleine largeur ≈ 1ᵉʳ écran entier (X9 re-confirmé) ; formulaire de création AVANT la liste (on atterrit sur un formulaire) ; ids techniques tronqués (« role.syste… ») | Cartes stats ~150 px de haut pour un chiffre ; 4 onglets visibles ; panneau = colonne mobile élargie | Vraie composition 2 colonnes (§4.8, à préserver) |
| Audit | Vue globale : OK structurellement (typo §9.1). **Détail : « empilement de chrome » enfin re-vérifié** (solde §2.3) : TopAppBar + onglets Vue globale/Détails + Retour + héro + Démarrer/Clôturer + onglets session → le contenu utile commence à ~55 % de l'écran ; onglets session en overflow (« Manqua… ») | Stats 2 colonnes surdimensionnées (même famille que RBAC) ; le **FAB « + » recouvre la colonne Statut/Action** du tableau | Page solide : filtres 3 colonnes, 6 tuiles, table (§4.6, à préserver) |

**Proposition** : la variante « rangée de stats » **X9** (jonction §9.1) traite d'un coup RBAC + Audit en compact/medium ; Audit détail compact : retirer la barre « Vue globale/Détails » sur la vue détail (le Retour l'assume) et coller les onglets session sous le TopAppBar (≈ 1 écran de chrome économisé) ; dégager le FAB medium du tableau (padding-bottom de table, pattern déjà appliqué en compact) ; RBAC : liste avant formulaire de création (ou création derrière un bouton). **Sévérité** : Mineur (RBAC), Majeur (chrome Audit détail). **Effort** : S (stats, FAB, ordre RBAC) + M (chrome Audit détail).

> **Exécution (2026-07-22).** (1) **Stats X9 partout** : les 5 bandeaux RBAC, les 6 tuiles de la vue globale Audit et les 5 tuiles session du détail passent sur `MetricCard compact` (grilles 2 col. compact → 3/5–6 col. au-delà ; nouveau prop `valueClassName` pour « Manquants » en `text-error`) — mesuré : valeurs 24 px compact / 30 px expanded, libellés label-small. (2) **Chrome Audit détail** sous expanded : barre « Vue globale/Détails » retirée, rangée Retour (44 px) + onglets session collée sous le TopAppBar, héro (statut/titre/Démarrer/Clôturer) devenu **carte qui défile avec le contenu** — mesuré à 393 : tablist à y=75 (contre un contenu utile qui commençait à ~55 % de l'écran) ; expanded inchangé (vérifié : barre + héro + Retour présents). (3) **FAB dégagé** : `pb-28` sur la vue globale quand FAB rendu (compact **et** medium — le pattern du détail). (4) **RBAC liste avant formulaire** : cartes Rôles ET Groupes réordonnées (titre → liste → formulaire de création) — vérifié au rendu (« liste-puis-formulaire »).

### 9.5 F5 — Menu latéral rétracté : caractérisation du bug

**Constat (Constaté — mesures DOM + captures à 1440×900) :** l'état rétracté (76 px) est **fonctionnel au clic** (items 44×44 centrés, badge Approbations correct, aucun débordement ni scrollbar horizontale). Deux défauts précis :

1. **Collision chevron/logo** : le bouton « Déployer le menu » (32 px, positionné `!absolute -right-3`) **chevauche le badge « TR » de 15 px** (TR right = 58, chevron x = 43) — le cercle blanc mord le logo en tête de sidebar, très visible sur fond sombre.
2. **Tooltips morts** : `SidebarItem` embarque un tooltip maison (`absolute left-full ml-3`) **à l'intérieur** d'un Button `!overflow-hidden` (`SidebarItem.tsx:41/90`) : au survol il est rendu (opacity 1) mais **clippé — jamais visible** (sonde `elementFromPoint` : c'est la carte de contenu qui reçoit le point). La nav rétractée est donc icônes-seules sans étiquette au survol ; ne reste que le `title` natif (délai ~1 s, non stylé). La classe `hidden large:block` le réservait de toute façon à ≥ 1200 px. Cause **Déduite** : tooltip posé en absolu dans un conteneur clippé, alors que la primitive `Tooltip` du DS existe.

**Proposition** : sortir l'étiquette du bouton — réutiliser `Tooltip` (DS) sur les items rétractés ; header rétracté : empiler TR puis chevron sur 2 rangées (ou remplacer le chevron flottant par un item « Déployer » en bas de nav, à côté de Paramètres). **Sévérité** : Mineur (fonctionnel) mais très visible. **Effort** : S.

> **Exécution (2026-07-22).** (1) Tooltip maison de `SidebarItem` supprimé (et le `title` natif redondant avec) ; les items rétractés sont enveloppés dans la primitive `Tooltip` du DS, nouvelle option `strategy='fixed'` : **bulle rendue en portail `document.body`** avec coordonnées viewport. Découverte en route (au pixel, pas au DOM) : un simple `position:fixed` restait invisible — l'`aside` porte `expanded:translate-x-0`, or **un transform ≠ none fait de l'ancêtre le containing block du fixed**, qui redevient clippé par le scroller interne ; `opacity:1` + `getBoundingClientRect` mentaient, seul `elementFromPoint`/le pixel disaient vrai. Vérifié après portail : bulle visible au survol (capture au pixel) **et** au focus clavier, délai 300 ms. (2) Header rétracté : chevron sorti du flottant `-right-3` (qui mordait TR de 15 px) → **empilement 2 rangées** TR (12–52) puis chevron 44×44 (56–100), zéro chevauchement mesuré. Le tooltip n'est plus réservé à ≥1200 px (l'ancien `hidden large:block` a disparu avec le tooltip maison).

### 9.6 F6 — Alternative aux onglets à scroll horizontal (Audit détail, RBAC)

**Constat (Constaté)** : Audit détail : 4 onglets session, le 3ᵉ coupé à 393 (« Manqua… ») ; RBAC : 4 onglets ≈ 590 px pour 393 (§3). `PageTabs` a déjà fondu + chevron (X8), navigation clavier, et l'API `shortLabel` (X8-bis) — **non exploitée sur ces deux pages** (RBAC : 1 seul shortLabel ; Audit détail : aucun).

**Évaluation des pistes** (demande explicite : comparer avant de recommander) :

| Piste | Pour | Contre | Verdict |
|---|---|---|---|
| **(a) Second FAB sous le FAB principal → overlay des vues** (piste utilisateur) | Persistant, zone du pouce, très découvrable ; le cœur de l'idée (liste verticale des vues dans un overlay tactile) est bon | Audit détail a **déjà** un FAB « + » (qui recouvre déjà la table en medium, §9.4) → pile de 2 FAB + bottom bar ; partout ailleurs le FAB = action primaire de *création* — un FAB de navigation casse cette grammaire ; RBAC n'a pas de FAB → pattern inédit pour 2 pages ; occlusion de contenu | **Non retenu tel quel** — l'overlay est repris en (b) |
| **(b) Feuille de bas déclenchée depuis la barre d'onglets** | Même overlay tactile que (a), ancré là où l'utilisateur regarde ; bouton « toutes les vues » (`unfold_more` + compteur) en bout de PageTabs → `BottomSheet` (primitive DS existante, pattern cousin de `ListActionFab`) listant les vues + badges ; généralisable aux 8 pages consommatrices de PageTabs | Une affordance de plus dans la barre ; S–M d'effort | **Recommandé** (option d'API PageTabs, pas un fork) |
| **(c) Segmenté sur 2 lignes** | Tout visible sans scroll | Hauteur doublée (aggrave le chrome §9.4) ; grille 2×2 fragile avec badges + libellés FR longs ; hors sémantique tablist | Écarté |
| **(d) Épuiser X8-bis d'abord** : shortLabels + icônes masquées en compact | Gratuit, déjà l'idiome du DS (« la vraie solution existe en interne », §3) | Mesures : RBAC ≈ 590 px − icônes (~104 px) − libellés courts ≈ 430–450 px : **ne suffit pas seul à 393** | **À faire en hygiène** (XS), mais pas suffisant |

**Proposition** : (d) immédiatement (XS) + (b) comme réponse système si validée (S–M) ; consigner la décision au registre X8. Tablette/desktop non concernés (onglets tiennent). **Sévérité** : Mineur (découvrabilité). **Effort** : XS + S–M.

### 9.7 F7 — Animation de rétraction UserDetails : reproduite et caractérisée

**Constat (Constaté — reproduction instrumentée)** : l'en-tête rétractable est un **frère** du conteneur de scroll ; `handleScroll` bascule à scrollTop > 72 / < 24 (`UserDetailsPage.tsx:439-451`), blocs animés en `max-h` (duration-medium4), conteneur `scroll-smooth`. **La rétraction change la hauteur du scrollport** : le maximum de scroll bouge sous le doigt.

Reproduction sur **contenu réel** (fiche Alice, 1440×900 stock, débordement 131 px) : boucle complète mesurée — collapse à top > 72 → le conteneur gagne Δ ≈ 142 px → le max de scroll retombe *sous* la position courante → clamp navigateur → événements scroll descendants → top < 24 → ré-expansion → re-collapse… **bascules toutes les ~100 ms, hauteur d'en-tête oscillant 133↔318 px, la boucle continue ~1,2 s après l'arrêt de la molette et se stabilise à top = 0 : le bas de la fiche est inatteignable** (journal complet : scripts de session).

**Fenêtre critique** : débordement ∈ (72, Δ+24) où Δ = hauteur perdue par l'en-tête — mesuré **Δ ≈ 142 px desktop** (fenêtre ≈ 72–166) et **Δ ≈ 62 px compact** (fenêtre ≈ 72–86, étroite — d'où le « par moments » sur téléphone). En deçà de 72 px de débordement, la rétraction ne s'arme jamais (Ethan : 31 px desktop, 0 px onglet Équipements — fonctionnalité morte sur fiches courtes) ; juste au-delà de la fenêtre, saccade résiduelle au clamp sans boucle. Le **même pattern copié-collé vit dans `EquipmentDetailsPage`** (mêmes constantes 72/24, `:239-247`) — même bug latent.

**Proposition** : court terme (**S**) : n'armer la rétraction que si `scrollHeight − clientHeight > Δ + 72 + marge` (Δ mesurable via refs) — supprime la boucle sans toucher au comportement des fiches longues ; moyen terme (**M**) : rétraction **sans variation de géométrie du scrollport** (en-tête à hauteur fixe condensé par transform/opacity, ou en-tête dans la surface de scroll consommant son propre offset), à extraire en composant DS partagé avec EquipmentDetails (2 usages). **Sévérité** : **Majeur** (contenu inatteignable + pompage visuel). 

> **Exécution (2026-07-18) — découplage réel livré (le seuil court-terme n'a pas été retenu, décision utilisateur).** Nouveau `DetailPageShell` (`src/components/layout/`) : barre épinglée à hauteur **fixe** (h-16) *dans* le scroller, héro en flux qui défile physiquement dessous, onglets `sticky top-16` ; identité/actions de la barre desktop révélées par fondu **paint-only** (IntersectionObserver sur le héro, marge = hauteur de barre). La géométrie du scrollport ne varie jamais → la boucle est impossible par construction. UserDetails + EquipmentDetails migrés (états `isScrolled`/`handleScroll` supprimés ; `DetailHeader.onBack` rendu optionnel, le Retour vit dans la barre ; le héro desktop garde ses actions, la barre les reprend une fois le héro sorti). Vérifié au rendu (sonde molette + échantillonnage 2,4 s, personas **alice.admin ET jane.manager**) : fiche Alice desktop, débordement 140 px (ex-fenêtre critique 72–166) → **0 renversement, bas atteint** ; équipement desktop Jane 61 px → idem ; compact 393 user/équipement (712/1706 px) → bas atteint, 0 débordement horizontal ; hauteur de barre constante 64 px sur tous les échantillons. Sur fiche courte le fondu ne s'arme pas (héro encore partiellement visible) — voulu : plus de « fonctionnalité morte » qui saccade.

### 9.8 F8 — Menu « Plus » : complément de la barre du bas (décision renversée)

**Contexte** : le Top 10 #3 (`69ef4e5`) avait acté « toujours afficher toutes les destinations » pour corriger le tiroir à contenu variable. Le retour d'usage renverse la décision : le tiroir « Plus » ne doit montrer que ce qui n'est **pas** sur la barre du bas.

**Constat (Constaté)** : compact — barre = Accueil/Actifs/Tâches/Équipe (+ Plus) ; tiroir = 11 destinations + Paramètres → **4 doublons en tête de tiroir**. Medium — le rail porte les 4 mêmes ; le tiroir modal (bouton menu du rail) affiche aussi tout (capture `f8_drawer_medium`).

**Analyse du piège signalé (Déduit, vérifié dans le code)** : la composition de la barre est une fonction **pure des permissions** (`NavigationBar.tsx:151-197` — jamais de la page). Le bug originel venait de `hidePrimaryShortcuts={usesBottomNavShortcuts}`, qui dépendait de la *vue courante* (barre rendue ou non). La fonction sûre est : **tiroir = destinations permises − barre théorique(permissions, classe d'appareil)** — calculée même quand la barre n'est pas rendue à l'écran. Résultat identique quelle que soit la page d'ouverture ✔.

**Cas limites à trancher avant implémentation :**
1. **Fiches compactes (barre absente)** : sur `equipment_details` & co. la barre disparaît (`AppLayout.tsx:103`) et le tiroir (burger) est l'unique nav ; avec la soustraction, les 4 sections primaires n'y figurent plus — on n'en sort que par Retour. Options : (i) assumer (cohérence du tiroir prime, Retour suffit) ; (ii) **rendre la barre du bas persistante sur les fiches** (MD3 le recommande ; règle au passage le double-affordance burger+retour de §4.1) — la soustraction devient alors toujours « vraie » à l'écran. Recommandation : (ii), sinon (i) consigné comme compromis.
2. **Tablette** : même soustraction avec le set du rail (identique aux 4 de la barre) → tiroir tablette = Finances/Gestion/Rôles & accès/Emplacements/Audit/Rapports/Paramètres ; le rail reste complet ✔.
3. **Desktop et paysage compact** : sidebar permanente = nav complète, **aucun filtrage** ; paysage compact (rail) = règle tablette.
4. **Personas à permissions réduites** : le « tiroir quasi vide » de §3 revient par construction (persona User : complément ≈ Audit + Paramètres) — mais cette fois la barre porte réellement ses sections : le tiroir court est un complément, pas un menu amputé. L'étiqueter (« Autres sections ») pour qu'il se lise comme tel, et y garantir un minimum (Paramètres + Déconnexion, jonction §9.3).

**Proposition** : filtre pur `f(permissions, classe d'appareil)` + intitulé de section dans le tiroir (**S**) ; décision séparée : barre persistante sur les fiches (**S**, change la nav des fiches). **Sévérité** : Mineur (confort) mais **renverse une décision consignée** — à valider explicitement.

### 9.9 Synthèse

| Point | Verdict | Sévérité | Effort | Décision à valider |
|---|---|---|---|---|
| F1 tailles compactes | Constaté (mesures 11/18 px vs 30 px, boutons 40 px) | Mineur | XS + S | Cran `stat-value` + plancher 44 px en spec |
| F2 rayons | Échelle effective 2/4/8/full déjà serrée ; dérives = chips full vs 4 px, `rounded` nus, règle non écrite | Mineur | XS + S | Variante chip unique (4 px ou pill) |
| F3 Paramètres | Majeur : « Modifier » déborde, Compte/Aide hors écran compact **et** medium, logout enterré + carte Compte codée en dur | Majeur | S | Placement Déconnexion (révise le fix 07-02) |
| F4 RBAC/Audit | Adaptation réelle seulement en expanded ; chrome Audit détail re-vérifié (solde §2.3) | Mineur/Majeur | S + M | — |
| F5 sidebar rétractée | 2 bugs précis : chevron/TR (15 px), tooltips clippés (`overflow-hidden`) | Mineur | S | — |
| F6 onglets | 4 pistes comparées ; FAB secondaire non retenu, feuille de bas recommandée + X8-bis en hygiène | Mineur | XS + S–M | Pattern (b) au registre X8 |
| F7 animation UserDetails | **Reproduit** : boucle collapse↔expand (fenêtre 72–Δ+24), bas de fiche inatteignable ; dupliqué dans EquipmentDetails | **Majeur** | S puis M | — |
| F8 menu « Plus » | Fonction pure `permises − barre(permissions)` : déterministe ✔ ; cas fiches/tablette analysés | Mineur | S (+S) | **Renverse Top 10 #3** + barre persistante sur fiches |

Registre : X9 devient le véhicule de F1+F4 ; X8 à compléter par la décision F6 ; nouveaux candidats — règle des rayons (F2) et plancher tactile 44 px (F1) ; F7 appelle un composant « en-tête rétractable » partagé. Découvertes annexes consignées : carte Compte hard-codée + « Modifier » mort (§9.3), `.control-field` mort (§9.2), FAB medium sur la table (§9.4).

---

## Annexe — reproduction

- `npm run dev` (port 3000). Sur la VM Linux, `node_modules` était installé depuis Windows : les 4 binaires natifs Linux (`@rollup/rollup-linux-x64-gnu@4.62.2`, `@esbuild/linux-x64@0.25.12`, `@tailwindcss/oxide-linux-x64-gnu@4.3.2`, `lightningcss-linux-x64-gnu@1.32.0`) ont été extraits dans `node_modules` via `npm pack` + `tar` (**`--no-save`, `package.json`/lock intacts**).
- Playwright Chromium ; connexion démo (placeholder `/Ex:\s*nom@/i` + mot de passe quelconque) ; **session en état React : naviguer par hash uniquement**, jamais recharger après connexion.
- Le shell ne scrolle pas le body : les captures pleine page exigent de poser temporairement `height:auto; overflow:visible` sur `html, body, #root>div, main, main .overflow-y-auto`, puis de rétablir. **Ne jamais diagnostiquer un débordement horizontal sur une capture « déroulée »** (elle gonfle la largeur) — utiliser des captures viewport + un balayage DOM des éléments dont `getBoundingClientRect().right > innerWidth`.
- Contrastes calculés sur les couleurs `getComputedStyle` rendues (formule de luminance relative WCAG).
