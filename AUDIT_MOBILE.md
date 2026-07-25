# AUDIT MOBILE / RESPONSIVE — Tracker

**Date :** 2026-07-22
**Périmètre :** état des lieux factuel, orienté mobile (< 600 px) et tablette (600–839 px), sans aucune modification de code ni recommandation.
**Convention de catégories :**

- **[FAIT]** — vérifié directement dans le code (référence fichier:ligne fournie).
- **[OBSERVÉ]** — constaté au rendu / déductible du code mais dont l'effet visuel exact reste à confirmer sur appareil.
- **[NON VÉRIFIABLE]** — nécessite un test manuel / appareil réel ; le protocole est décrit en §9.

**Limite de méthode (captures).** L'application se lance via `npm run dev` (Vite, port 3000), mais l'environnement est un montage `hgfs` avec des `node_modules` d'origine Windows (binaires natifs sensibles au redémarrage). Plutôt que de générer de nouvelles captures, cet audit s'appuie sur les **captures de référence déjà présentes dans le dépôt** : `docs/md3-visual-baseline/compact/*.png` (viewport **393×852 px, iPhone 14 Pro**, `hasTouch`, `scripts/run-md3-visual-regression.mjs:19`) et `.../medium/*.png` (**768×1024, iPad Mini**, ligne 20). Ces largeurs couvrent la cible « 390 » et « 768 » du brief ; il n'existe pas de baseline à 360 px. Les captures « expanded » sont à 1440 px (ligne 21). Aucune capture n'a été régénérée pour préserver l'intégrité du dépôt (règle « no modification »).

---

## 1. STACK & ARCHITECTURE

### 1.1 Stack technique — [FAIT]

| Domaine | Choix | Référence |
|---|---|---|
| Framework | **React 19.2.3** + **TypeScript ~5.8.2** | `package.json:29-30,52` |
| Build | **Vite 6.2** (`@vitejs/plugin-react`, `@tailwindcss/vite`) | `package.json:54`, `vite.config.ts:1-14` |
| Router | **Routeur maison à base de hash** — *pas* de react-router | `src/hooks/useRouter.ts`, `useAppNavigation.ts` |
| UI / composants | **Bibliothèque interne** (`src/components/ui/*`, 35 primitives) — pas de lib tierce | `src/components/ui/` |
| Styling | **Tailwind CSS v4.1.18** chargé via `@config` (pas de bloc `@theme`) + **tokens MD3 en variables CSS** | `index.css:1`, `tailwind.config.js` |
| État | **React Context** (5 providers), pas de Redux/Zustand | `App.tsx`, `src/context/*` |
| Icônes | Material Symbols Outlined (police variable) | `index.html:23-25`, `src/components/ui/MaterialIcon.tsx` |
| PWA | manifest + `theme-color` + `apple-touch-icon` | `index.html:11-14`, `public/manifest.webmanifest` |

**Incohérence de configuration [FAIT] :** `vite.config.ts:24` déclare encore un chunk `vendor-router` pour `react-router`, dépendance **absente** de `package.json` — configuration morte (le CLAUDE.md le confirme : react-router n'est ni installé ni utilisé).

**Incohérence de police [FAIT] :** `index.html:21-25` précharge **Roboto Flex**, mais `index.css:2` importe **Inter** et toute la config typographique pointe sur Inter (`tailwind.config.js:198-199`, `--font-sans` `index.css:575`). Roboto Flex est chargée puis jamais utilisée ; les polices Google ne sont pas épinglées (pas de `crossorigin`/SRI, `display=swap`).

### 1.2 Structure des dossiers (principaux) — [FAIT]

```
/ (racine)          index.html, index.tsx, App.tsx, index.css  ← entrée hors src/
src/
├─ components/
│  ├─ layout/       shell responsive : AppLayout, Sidebar, NavigationBar/Rail,
│  │                TopAppBar, BottomAppBar, DetailPageShell, PageHeader, WizardLayout…
│  ├─ ui/           35 primitives partagées (Button, Card, Modal, BottomSheet, PageTabs…)
│  ├─ modals/       TransactionTicketModal
│  └─ security/     SecurityGate
├─ features/<domaine>/{pages,components}/
│                   auth, dashboard, inventory, users, approvals, finance,
│                   audit, locations, management, reports, admin
├─ context/         Toast, Auth, Data, FinanceData, Confirmation
├─ hooks/           useRouter, useAppNavigation, useMediaQuery, useBreakpoint…
├─ constants/       breakpoints.ts, destinations.ts, glossary.ts, categoryIcons.ts
├─ config/          rbacDefaults, index
├─ lib/             règles métier, OCR/extraction, rbac, persistence, utils(cn)
├─ data/            mockData (seed localStorage)
├─ services/        authService, agentCollectionService
└─ types/           index.ts, rbac.ts
docs/md3-*          rapports QA + baselines visuels (compact/medium/expanded)
scripts/            check-md3-compliance, run-md3-*-audit (Playwright)
backend/            serveur Node autonome optionnel
```

### 1.3 Design system / tokens — [FAIT] : **présent et à couverture élevée**

Il existe un **design system tokenisé complet** :

- **Source de vérité couleurs** : couche « marque CAT » en fin de `index.css:574-760` (variables `--cat-*`, `--color-*`, `--md-sys-color-*`).
- **Fondations MD3** : motion, state-layers, typescale, shape, elevation en tête de `index.css:13-78`.
- **Pont Tailwind** : `tailwind.config.js:19-201` mappe chaque classe sémantique (`primary`, `on-surface`, `surface-container`, `focus-ring`, `shadow-elevation-*`, `rounded-*`) sur les variables.
- **Garde-fou CI** : `scripts/check-md3-compliance.mjs` (script `md3:check`) interdit hex bruts et classes de palette Tailwind brutes dans `src/components/**`.

**Échantillon de conformité (10 composants) :**

| Composant | Consomme les tokens ? | Preuve |
|---|---|---|
| `ui/Button.tsx` | ✅ tokens sémantiques | `bg-primary text-on-primary` (l.28) |
| `ui/Card.tsx` | ✅ | `bg-surface`, `border-outline-variant` |
| `ui/IconButton.tsx` | ✅ | `text-on-surface-variant`, `focus-ring` (l.76) |
| `ui/PageTabs.tsx` | ✅ | `bg-primary text-on-primary`, `focus-ring` (l.157-159) |
| `layout/TopAppBar.tsx` | ⚠️ mixte | `bg-surface` **+** `border-[var(--color-border-default)]` en arbitraire (l.34) |
| `layout/BottomAppBar.tsx` | ⚠️ mixte | `bg-white/95` **littéral** + token bordure (l.16) |
| `layout/NavigationBar.tsx` | ⚠️ mixte | `text-[var(--color-text-primary)]`, `bg-[var(--color-neutral-100)]` en arbitraire (l.61-62) |
| `audit/PhysicalAuditView.tsx` | ✅ | `bg-tertiary-container`, `text-on-surface` |
| `management/RbacManagementPanel.tsx` | ✅ | `text-on-surface`, `border-outline-variant` |
| `auth/LoginPage.tsx` | ❌ hex bruts | `bg-[#F8FAFC]`, `bg-[#090A0B]`, `bg-[#FBFBFA]` (l.185,189,231) |

**Constat :** la couverture tokens est réelle et forte dans `ui/`, mais la couche `layout/` mélange tokens sémantiques et **valeurs arbitraires `[var(--color-*)]`** (le token brut plutôt que la classe sémantique — hors périmètre du `md3:check` qui ne cible que `src/components/**` sur les hex). `LoginPage` (dans `features/`, non couverte par le linter) porte **3 hex bruts** hors palette de marque (slate/quasi-noir froid) → page à univers chromatique propre.

---

## 2. RESPONSIVE — ÉTAT ACTUEL

### 2.1 Breakpoints — [FAIT] : **centralisés**

Source unique : `src/constants/breakpoints.ts`, alignée sur `tailwind.config.js:9-15`.

| Classe MD3 | Valeur exacte | Usage |
|---|---|---|
| `compact` | `max-width: 599px` | téléphones |
| `medium` | `600px – 839px` | tablette portrait |
| `expanded` | `≥ 840px` | desktop / grand |
| `large` | `≥ 1200px` | — |
| `extra-large` | `≥ 1600px` | — |

Requêtes dérivées : `belowExpanded` (≤839), `landscape`, `belowExpandedLandscape`, `hoverCapable: (hover:hover) and (pointer:fine)` (`breakpoints.ts:18-33`). La couche JS (`useMediaQuery`, `useBreakpoint`) consomme ces constantes ; **aucune media-query en dur** n'a été trouvée dans les composants (tout passe par `MEDIA.*` ou les classes `compact:`/`medium:`/`expanded:`). C'est un point **fort**.

⚠️ **Nuance importante :** le seuil « mobile » est **599 px**, pas 640. Le brief parlait de « < 640 px » ; la bascule réelle téléphone→tablette se fait à **600 px**.

### 2.2 Approche — [FAIT] : **hybride, à dominante desktop-first avec surcouches compact**

- Le shell est **adaptatif unique** (pas de routes mobile/desktop séparées) : `AppLayout.tsx:57-105` choisit Sidebar / NavigationRail / BottomAppBar+NavigationBar selon `useMediaQuery`.
- Les pages sont majoritairement **desktop-first** : le layout par défaut est large, et le mobile est obtenu par `isCompact ? … : …` (Inventaire `InventoryPage.tsx:341`, Users `UsersPage.tsx:320`) ou par des classes `hidden medium:*` (Audit `PhysicalAuditView.tsx:434`). Les listes principales (Inventaire, Utilisateurs) rendent **des cartes `EntityRow` en compact** et **un `<table>` en desktop** — bon découplage.
- Composants dédiés mobile : `TopAppBar`, `BottomAppBar`, `NavigationBar`, `ListActionFab` (FAB + feuille), `BottomSheet`. Composants dédiés desktop : `Sidebar` permanente, `NavigationRail`.

### 2.3 Viewport / safe-areas / unités — [FAIT]

- **Viewport meta** : `index.html:6` = `width=device-width, initial-scale=1.0` — **il manque `viewport-fit=cover`**.
- **Conséquence directe [FAIT] :** sans `viewport-fit=cover`, `env(safe-area-inset-*)` **vaut 0** sur iOS encoché. Or `env(safe-area-inset-bottom)` est utilisé dans `ListActionFab.tsx:46` et `Snackbar.tsx:98-100` → **ce code de safe-area est aujourd'hui inopérant** (se replie sur le fallback `0px`).
- **Barre de navigation basse sans safe-area [FAIT] :** `BottomAppBar.tsx:16` (`min-h-16`, aucun padding bas) et `NavigationBar.tsx:243` (`h-[68px]`) n'intègrent **aucun** `env(safe-area-inset-bottom)`.
- **Unités de hauteur [FAIT] :** le shell et les pages plein-écran utilisent `h-screen` / `min-h-screen` (= `100vh`) — `AppLayout.tsx:369`, `LoginPage.tsx:185,231`, `AccessDeniedPage.tsx:11`, `ChangePasswordPage.tsx:50`. **Aucun `dvh`/`svh`/`lvh`**. Sur navigateurs mobiles à barre d'URL dynamique, `100vh` peut dépasser la zone visible.
- Le reste des unités est sain : `rem`/`px` pour la typo, tokens d'espacement (`p-page-sm`, `gap-*`).

---

## 3. NAVIGATION MOBILE

### 3.1 Barre du bas (Accueil, Actifs, Tâches, Équipe, Plus) — [FAIT]

- **Composant :** `NavigationBar.tsx`, enveloppé dans `BottomAppBar.tsx`, monté par `AppLayout.tsx:418-427`.
- **Condition d'affichage :** `showBottomNav = isCompact && !isCompactLandscape && currentView ∈ bottomNavViews && !isMobileMenuOpen` (`AppLayout.tsx:103-104,90-102`). Donc **uniquement téléphone portrait**, sur les sections principales.
- **Destinations & routes** (via registre unique `destinations.ts:38-60`) : Accueil→`/`, Actifs→`/inventory`, Tâches (Approbations)→`/approvals`, Équipe (Users)→`/users`, **Plus** (icône `menu`). Libellés courts : « Accueil / Actifs / Tâches / Équipe » (`destinations.ts:39-52`). Les items sont filtrés par permissions (`NavigationBar.tsx:151-183`) puis `slice(0,5)` (l.199).
- **État actif y compris en sous-page [FAIT] :** `resolveBottomNavDestination` (`NavigationBar.tsx:92-128`) remonte les vues-détail vers leur section (`equipment_details`→`equipment`, `user_details`→`users`, `new_request`→`approvals`, et toutes les `MORE_VIEWS`→`more`). L'onglet parent reste donc surligné en profondeur. **Bien fait.**
- **A11y :** `role="navigation"`, `aria-current="page"`, navigation clavier ←/→/Home/End avec roving `tabIndex` (`NavigationBar.tsx:211-236`). **Bien fait.**

### 3.2 Panneau « Plus » — [FAIT]

- « Plus » **n'ouvre pas une page ni un BottomSheet** : il appelle `onMoreClick` → `setIsMobileMenuOpen(true)` (`AppLayout.tsx:423`, `NavigationBar.tsx:189-196`), ce qui ouvre la **`Sidebar` en mode tiroir modal** (`Sidebar.tsx:57,208-223`).
- **Contenu [FAIT] :** tiroir-complément — comme la barre du bas porte déjà les 4 destinations primaires, `subtractPrimaryDestinations` les masque (`AppLayout.tsx:378`, `Sidebar.tsx:58,276-320`) et le tiroir n'affiche que « Autres sections » (Finance, Gestion, Rôles, Emplacements, Audit, Rapports) + Paramètres + Déconnexion. La sélection est une **fonction pure des permissions**, donc identique quelle que soit la page d'ouverture.
- **A11y tiroir :** `role="dialog"`, `aria-modal`, **piège de focus**, `Escape`, scrim cliquable, `body overflow:hidden`, restauration du focus (`Sidebar.tsx:118-194`). Largeur `85vw max 360px`. **Bien fait.**

### 3.3 Headers mobiles — [FAIT]

- **Barre haute mobile :** `TopAppBar.tsx`, montée si `showTopAppBar = isCompact && !isCompactLandscape` (`AppLayout.tsx:105,398-409`). Titre issu du registre de destinations (`getTopAppBarTitle`, `AppLayout.tsx:107-142`). Action de gauche = `menu` (ouvre le tiroir) **sauf** quand la barre du bas est visible, auquel cas pas de bouton menu (`AppLayout.tsx:401-405`).
- **Standardisation :** les titres sont centralisés (registre X1) ; les pages internes utilisent `PageHeader` (contenu) qui **s'efface en compact** au profit du `TopAppBar` (`PageHeader.tsx:32-57`, hook `useHasMobileTopBar`). Les pages détail utilisent `DetailPageShell`/`DetailHeader` avec barre épinglée. **Cohérent.**
- **« Retour » du Dashboard [FAIT] — piège de nommage :** sur le tableau de bord, le bouton **« Retour »** n'est **pas** une navigation arrière : il déclenche le **wizard de retour de matériel** (`onViewChange('return_wizard')`, icône `assignment_return`) — `DashboardPage.tsx:350-352,368-375`. Voir §5-Dashboard.

### 3.4 Comportement tablette (600–1024 px) — [FAIT], point d'attention

- **600–839 (medium) :** ni Sidebar permanente (réservée à `expanded ≥840`, `Sidebar.tsx:216-219`), ni barre du bas (réservée au compact). À la place : **`NavigationRail`** (rail 76 px icônes+libellés) + bouton `menu` qui ouvre le tiroir (`AppLayout.tsx:62,385-393`).
- **≥840 (expanded) :** Sidebar permanente, collapsible 76↔256 px.
- **Compact paysage :** bascule sur le rail *compact* (48 px, `AppLayout.tsx:61-62`, `NavigationRail.tsx:42-43`).
- **Point d'attention confirmé [FAIT] :** sur **medium**, plusieurs pages perdent leurs actions primaires. Exemple net : le **Dashboard n'affiche aucun bouton d'action** en medium — `dashboardHeaderActions` exige `!isCompact && !isMedium` (`DashboardPage.tsx:346`) et `dashboardCompactActions` exige `isCompact` (l.365) ; en medium les deux sont `null` → « Attribuer / Retour / Nouvelle demande » **disparaissent** entre 600 et 839 px.

---

## 4. INVENTAIRE DES COMPOSANTS PARTAGÉS

### 4.1 Primitives `src/components/ui/` (35) — [FAIT]

| Catégorie | Composant(s) | Responsive / variantes | Remarque |
|---|---|---|---|
| Boutons | `Button` | tailles sm/md/lg ; variantes filled/tonal/outlined/text/elevated/danger (+alias legacy) | cibles tactiles : §6 |
| | `IconButton` | variantes standard/filled/tonal/outlined + toggle | **40×40 px** malgré commentaire « 48×48 » (l.49,73-74) |
| | `FloatingActionButton`, `ListActionFab`, `FabContainer`, `CloseButton` | FAB + feuille d'actions mobile | `ListActionFab` = FAB compact + BottomSheet |
| Cartes | `Card`, `MetricCard`, `EntityRow` | `MetricCard` a un mode `compact` ; `EntityRow` porte le rendu liste mobile | voir duplication ci-dessous |
| Onglets | `PageTabs`, `SegmentedButton` | `PageTabs` : scroll horizontal + overflow + short-labels + feuille « toutes les vues » | **2 implémentations d'onglets** |
| Overlays | `Modal`, `BottomSheet`, `SideSheet`, `Menu`, `Tooltip`, `ConfirmationDialog` | `Modal` plein-écran en compact / centré ≥medium ; `BottomSheet` full-width + drag | focus-trap partout |
| Champs | `InputField`, `TextArea`, `SelectField`, `SelectFilter`, `Toggle`, `FileDropzone` | labels liés via `useId`/`htmlFor` | §7 |
| Feedback | `Snackbar`, `LoadingSpinner`, `EmptyState`, `Badge`, `StatusBadge`, `Chip`, `DemoBadge` | `Snackbar` positionné avec safe-area | états : §5 |
| Divers | `Pagination`, `SearchFilterBar`, `MovementTimeline`, `MaterialIcon`, `UserAvatar`, `Divider` | | |

### 4.2 Duplications & multiplicité — [FAIT]

- **Onglets — 2 familles :** `PageTabs.tsx` (onglets de page scrollables, ARIA tablist) **et** `SegmentedButton.tsx` (bouton segmenté MD3). Usages distincts mais rôles proches ; à surveiller.
- **Cartes — 3 primitives :** `Card`, `MetricCard`, `EntityRow` — rôles différents (surface générique / tuile de stat / rangée-entité), pas une vraie duplication mais un continuum à documenter.
- **Tables sans équivalent carte — [FAIT, CORRIGÉ le 2026-07-25] :** 8 fichiers contiennent `<table>`. **`ModelDetailsPage` a en réalité déjà une branche carte** (`hidden medium:block` l.140 / `medium:hidden` l.196) livrée par `b9ceed4` (2026-07-08) — comme pour §5-Finances, le constat le comptait à tort. Le nombre réel de tables sans variante était donc **6**, pas 7 : `ImportEquipmentPage`, `ImportUsersPage`, `ImportLocationsPage`, `ImportModelsPage`, `CategoryDetailsPage`, `AddBudgetModal`.
  **TRAITÉ (lot 5, 2026-07-25)** — voir `docs/mobile-targeted-qa/2026-07-25/RAPPORT-LOT5.md` : les 4 tables d'import passent en **défilement horizontal assumé** (primitive `ui/TableScrollArea` : fondu + chevron conditionnels, région focalisable au clavier, colonne « Statut » épinglée `sticky left-0`) ; `CategoryDetailsPage` et `AddBudgetModal` passent en **cartes compactes** (bascule CSS pour la première, bascule JS `useMediaQuery` pour la seconde afin de ne pas dupliquer des champs de formulaire dans le DOM).
- **Tooltip — 2 mécanismes :** le composant maison `<Tooltip>` (3 usages) **vs** l'attribut natif `title=` (**158 occurrences**). Voir §6.
- **`!important` Tailwind — [FAIT, CORRIGÉ le 2026-07-25] :** le chiffre de ~**1004** comptait aussi les **négations JavaScript** (`if (!user)`, `!isCollapsed`…). Les préfixes `!` Tailwind réels — tokens situés dans un littéral de chaîne et de forme « classe » — étaient **381**, pas 1004. Troisième constat surévalué après §5-Finances et `ModelDetailsPage` (#12).
  **TRAITÉ (lot 6, 2026-07-25)** — voir `docs/mobile-targeted-qa/2026-07-25/RAPPORT-LOT6.md` : **381 → 4 (−98,9 %)**. La cause était que les primitives n'exprimaient pas ce dont les appelants avaient besoin. Livré : nouvelle primitive autonome `ui/NavButton` (barre / rail / tiroir — elle ne wrappe plus `Button`, qui était re-spécifié à 23–33 % pour 82 `!` à elle seule) ; `Button` gagne `variant="nav"`, `iconOnly` et `layout="card"` ; `IconButton` gagne `variant="nav"` et `density` ; `PageContainer` gagne `padding="none"` ; les espacements nommés (`p-card`, `px-page`…) sont déclarés à tailwind-merge et couverts par `check-cn-merge` (section 1c).
  Les **4 survivants** sont documentés dans le rapport (§3). Deux découvertes à traiter : (a) un `!` posé sur une classe écrite à la main dans `index.css` est un **no-op silencieux** — Tailwind n'émet la variante importante que pour ses propres utilitaires ; (b) une classe **non préfixée ne neutralise pas une variante responsive** de la primitive.

---

## 5. AUDIT PAGE PAR PAGE (mobile < 600 px)

> Rappel : `isCompact` = `< 600px`. Pour chaque page : fichiers, obtention du layout mobile, constats vérifiés.

### Connexion — `features/auth/pages/LoginPage.tsx`
- **Layout mobile :** panneau marketing gauche masqué (`hidden expanded:flex`, l.189) ; formulaire seul, `min-h-screen`, centré (l.231). Colonne unique en compact.
- **[FAIT] Comptes démo (réponse 5d) :** 4 avatars (`mockAllUsersExtended.slice(0,4)`, l.382). Au **tap**, `fillDemoCredentials(email)` **pré-remplit** e-mail **et** mot de passe (`password123`) — l.387,165-174 — **sans** connexion automatique. Chaque avatar a un `title` **natif** (« Se connecter en tant que … », l.390, **hover-only → invisible au tap**) + un `aria-label` complet (l.388) + un **badge persistant de rôle** = 1ʳᵉ lettre du rôle (`user.role[0]`, l.400). Donc l'indice de rôle survit au tactile (badge « A »/« M »/…), mais le **nom/rôle complet reste hover-only**.
- **[FAIT] hex bruts** hors marque (l.185,189,231) — cf. §1.3.
- **États :** erreurs de champ gérées (`emailError`/`passwordError`), spinner de chargement (`loading` sur le bouton). ✅

### Tableau de bord — `features/dashboard/pages/DashboardPage.tsx`
- **Layout mobile :** `PageContainer` + `PageHeader` (titre masqué en compact, porté par TopAppBar) ; actions en grille 2 colonnes pleine largeur (`dashboardCompactActions`, l.365-395) ; KPIs `grid-cols-2` compact (l.422-426).
- **[FAIT] Boutons « Retour »/« Attribuer » (réponse 5e) :** logique = **wizards de matériel**, pas navigation. « Attribuer »→`assignment_wizard`, « Retour »→`return_wizard` (l.350-354, 368-383). **Gating par permission** `canManageInventory` : sinon un seul bouton « Nouvelle demande »→`new_request` (l.357-360). Pertinence : ce sont des CTA d'action métier légitimes en tête de dashboard ; le **label « Retour » prête à confusion** avec un retour de navigation (même mot que le bouton « Retour » de `DetailHeader.tsx:42`).
- **[FAIT] Trou tablette :** boutons absents en medium (cf. §3.4).
- **États :** pas d'état de chargement/erreur explicite (données mock synchrones) ; sections avec `EmptyState` pour les listes vides. ⚠️ chargement/erreur non applicables au mock.

### Équipements (liste) — `features/inventory/pages/InventoryPage.tsx`
- **Layout mobile [FAIT] :** vrai découplage — `isCompact ? <EntityRow …> : <table>` (l.44,341,471) ; actions d'en-tête masquées en compact (`isCompact ? null`, l.300) et remplacées par un `ListActionFab` (l.587). Barre de recherche/filtre partagée.
- **États :** `EmptyState` présent ; pagination via `Pagination`. ✅

### Équipement (détail) — `features/inventory/pages/EquipmentDetailsPage.tsx`
- **Layout mobile :** `DetailPageShell` (barre épinglée `h-16` à hauteur fixe + héro défilant + onglets `sticky top-16`) — `DetailPageShell.tsx:50-67`. Géométrie du scrollport stable (anti-oscillation documentée). ✅
- 11 usages `hover:` (l. diverses) — états de survol sans équivalent tactile garanti (cf. §6).

### Utilisateurs (liste + profil) — `UsersPage.tsx`, `UserDetailsPage.tsx`
- **Layout mobile [FAIT] :** identique à Inventaire — `isCompact ? EntityRow : table` (`UsersPage.tsx:320,469`), `ListActionFab` (l.575-576). Profil via `DetailPageShell`. ✅

### Approbations — `features/approvals/pages/ApprovalsPage.tsx` (+ `ApprovalRow.tsx`)
- **Layout mobile :** rangées `ApprovalRow` (composant dédié) ; pas de `<table>`. Baseline compacte présente (`docs/md3-visual-baseline/compact/approvals.png`).
- **États :** `EmptyState` utilisé.

### Finances — `features/finance/pages/FinanceManagementPage.tsx`
- **Layout mobile [FAIT] :** les **deux** tables ont une branche carte compacte `medium:hidden`, en regard du `<table>` desktop `hidden medium:block` — livrées dans `f3ee004b` (2026-07-08, « real transactions table with card recomposition ») :
  - **Journal des dépenses** (« Historique des Transactions ») : table l.910, **cartes l.984–1045** (fournisseur, statut, description en ellipsis 1 ligne, date, type+icône, montant aligné à droite, action Supprimer ; rangée cliquable → SideSheet de détail).
  - **Détails du budget** : table l.1133, **cartes l.1207–1263** (catégorie+icône, badge CAPEX/OPEX, grille Alloué/Dépensé/Restant, barre d'utilisation).
  - *Vérifié à 393 px le 2026-07-23* : onglet Journal → 0 `<table>` visible, 5 dépenses rendues en cartes (Dell/Azure/Orange/Adobe/AWS). Les n° de ligne 907/1130/711 d'une révision antérieure du constat sont périmés.
  - Graphiques SVG `group-hover/dot` (l.820) : repli tactile en place via `isHoverCapable` — valeurs de points affichées en permanence hors survol (cf. §6, constat 13).
- Fichier volumineux (1321 lignes), 15 `hover:`, 7 styles inline (SVG). Point de complexité mobile le plus élevé.

### Rôles & accès — `RbacPage.tsx` + `RbacManagementPanel.tsx`
- **Layout mobile [FAIT] :** stats `grid-cols-2` compact (`RbacManagementPanel.tsx:716`) ; sections via `PageTabs` (l.728) ; listes rôles/groupes en `grid-cols-1 expanded:grid-cols-2` (l.735).
- **[FAIT] Troncature « A… », « C… » (réponse 5b) :** provient du **CSS `truncate`** (Tailwind : `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) sur `<p class="… truncate">{role.name}</p>` (`RbacManagementPanel.tsx:750`). La rangée est un **flex horizontal** (`flex items-center gap-3`, l.747) où le bloc-nom `min-w-0 flex-1` **partage la largeur avec deux `Badge` non-rétractables** (« Système/Personnalisé » l.753-755 + « N permissions » l.756) et un `IconButton` suppression (l.757-764). En dessous de ~360 px, les badges consomment la rangée et **comprime le nom jusqu'à 1 lettre + ellipsis**. **Cause = largeur de conteneur (compétition flex), pas troncature JS** ; il **n'y a pas** de bascule `flex-col` en compact.

### Audit — `AuditPage.tsx` → `PhysicalAuditView.tsx` / `AuditDetailsPage.tsx`
- **Layout mobile :** tuiles-résumé `MetricCard` `grid-cols-2` (l.350-357), filtres `grid-cols-1`, FAB mobile (l.504-527), `pb-28` pour dégager le FAB (l.310).
- **[FAIT] Libellés de stats de service absents en mobile (réponse 5a) — distinction nette :**
  1. **Tuiles-résumé en haut** (Attendus/Scannés/Manquants/Écarts) : **présentes et étiquetées** en mobile — `MetricCard compact title="…"` (l.351-354). ✅
  2. **Tableau par service** (le vrai sujet) : l'**en-tête de colonnes** (« Attendus/Scannés/Manquants/Écarts/… ») est `class="hidden medium:grid"` (l.434) → **non rendu < 600 px**. Or les rangées passent en `grid-cols-1` en compact (l.463) et rendent des **valeurs nues sans libellé inline** : `<span>{row.expected}</span> … {row.found} … {row.missing} … {row.exceptions}` (l.479-482). Résultat mobile : sous chaque service, une **pile de nombres droite-alignés (ex. 75 / 60 / 15 / 3) sans aucune étiquette** — parce que les libellés vivaient **uniquement** dans l'en-tête masqué et qu'il n'existe **pas de vrai layout carte** par cellule. **Cause identifiée : `hidden medium:grid` sur l'en-tête + rangée mono-colonne sans libellés par cellule.**

### Paramètres — `features/management/pages/SettingsPage.tsx`
- **Layout mobile [FAIT] :** navigation par `PageTabs` avec `shortLabelBreakpoint="expanded"` (l.368-374) ; **5 sections** : Affichage, Compte & Sécurité, Finances & Paramètres, Collecte automatique, Aide (l.294-299).
- **[FAIT] Débordement des onglets + compteur « 5 » (réponse 5c) :** les onglets vivent dans un conteneur **scrollable horizontalement** (`overflow-x-auto no-scrollbar`, `PageTabs.tsx:134`), avec **affordances d'overflow** (fondu + chevron gauche/droite quand ça déborde, l.214-243) et, en bout de barre, un **bouton « toutes les vues »** rendu **uniquement si débordement** (`showAllViewsButton = overflow.left || overflow.right`, l.61,247). Ce bouton affiche `unfold_more` + **`{items.length}` = le nombre total d'onglets** (l.255-256) → le **« 5 » = 5 onglets au total**, **pas** un compteur de notifications. Le tap ouvre un `BottomSheet` listant toutes les vues (l.259-306).

### Page « Plus »
- N'est pas une page mais le **tiroir modal** (cf. §3.2). Contenu = sections secondaires + Paramètres + Déconnexion.

### États transverses — [FAIT]
- **Vide :** `EmptyState` (8 fichiers). ✅
- **Chargement :** `LoadingSpinner` + `PageLoadingFallback` sur le lazy-loading des pages (`AppLayout.tsx:48-52`) ; `loading` sur `Button`. ✅ (données mock → peu d'états réseau).
- **Erreur :** ~~pas de composant d'erreur générique / error-boundary trouvé~~ ; les erreurs sont locales (champs de formulaire, toasts). **CORRIGÉ (lot 5, 2026-07-25)** : `ui/ErrorBoundary` monté à deux niveaux — autour du `<Suspense>` des pages lazy dans `AppLayout` avec `key={currentView}` (naviguer suffit à récupérer sans recharger), et en racine dans `App.tsx` hors arbre de providers. Repli = `EmptyState` + action « Recharger », `role="alert"`, `console.error` seul (aucune télémétrie). Erreurs locales inchangées. Sonde manuelle 10/10.

---

## 6. INTERACTIONS & TACTILE

### 6.1 Dépendances au survol (hover) — [FAIT]

- **`title=` natif : 158 occurrences** vs **`<Tooltip>` maison : 3**. Le `title` HTML **ne se déclenche pas au tap** → sur mobile, l'immense majorité des infobulles sont **inaccessibles au tactile** (nav items `NavigationBar.tsx:57`, actions `TopAppBar.tsx:45`, avatars démo `LoginPage.tsx:390`, etc.).
- Le composant **`<Tooltip>` maison a, lui, un équivalent tactile** : `onTouchStart` déclenche un **appui long (600 ms)** pour afficher, `onTouchEnd/Cancel` masque (`Tooltip.tsx:85-92,195-197`). Mais il n'est utilisé que 3 fois.
- **Actions révélées au survol (`group-hover`/`opacity-0`) :**
  - `LocationsPage.tsx:345` masque des actions en `opacity-0 group-hover:opacity-100` **mais** ajoute `group-focus-within:*` et est **gardé par `useMediaQuery(MEDIA.hoverCapable)`** (l.30) → dégradation tactile prévue. ✅
  - `AddBudgetModal.tsx:453` : bouton supprimer en `opacity-0 group-hover:opacity-100` **sans** garde `focus-within`/tactile visible → **caché au tactile [OBSERVÉ]**.
  - `FinanceManagementPage.tsx:817` : valeurs de points de graphe en `opacity-0 group-hover/dot:opacity-100` → **données lisibles au survol seulement [OBSERVÉ]**.
  - Micro-transitions `group-hover:` purement décoratives (couleurs/scale) sur MetricCard, EntityRow, PageTabs, wizards — sans perte d'information au tactile. ✅

### 6.2 Cibles tactiles (calcul depuis le CSS) — [FAIT]

| Élément | Dimension calculée | ≥ 44×44 ? |
|---|---|---|
| `Button` size **lg** | `min-h-11` = **44 px** | ✅ (pile) |
| `Button` size **md** (défaut) | `min-h-10` = **40 px** | ❌ **40 < 44** |
| `Button` size **sm** | `min-h-8` = **32 px** | ❌ **32** |
| `IconButton` (toutes variantes) | `w-10 h-10` = **40×40 px** | ❌ **40** (commentaire « 48×48 » erroné, l.49,73) |
| Boutons `TopAppBar` | `!w-10 !h-10` = **40×40** (l.47,66) | ❌ **40** |
| Item barre du bas (`NavItem`) | conteneur `h-[68px]`, `min-w-[64px]` | ✅ **68×64** |
| Item `NavigationRail` plein | `!w-20 !min-h-16` = **80×64** | ✅ |
| Item `NavigationRail` compact | `!w-12 !min-h-12` = **48×48** | ✅ |
| Onglet `PageTabs` | `min-h-10` = **40 px** de haut | ❌ **40** |
| Ligne feuille « toutes les vues » | `min-h-11` = **44** (l.278) | ✅ |
| Avatar démo Login | `!w-12 !h-12` = **48×48** | ✅ |

**Synthèse cibles :** les **conteneurs de navigation** (barre du bas, rail, tiroir) respectent 44–48 px, **bien dimensionnés**. En revanche les **contrôles génériques par défaut** — `Button` md (40), tous les `IconButton` (40×40), onglets `PageTabs` (40) — sont **sous le seuil 44×44** de WCAG 2.5.5 / Apple HIG. Comme `IconButton` porte les actions d'icône (suppression RBAC, actions de barre, en-têtes), l'impact tactile est **transverse**.

### 6.3 Gestes — [FAIT]

- **Swipe-to-dismiss :** oui, sur `BottomSheet` (drag vertical > 120 px ferme, `BottomSheet.tsx:82-102,195-206`).
- **Scroll horizontal** des onglets (`PageTabs`), des tables (`overflow-x-auto`).
- **Pull-to-refresh :** **aucun** (non implémenté).
- Pas de swipe entre onglets ni swipe sur les rangées de liste.

---

## 7. ACCESSIBILITÉ (rapide)

- **Labels de champs — [FAIT] ✅ :** `InputField` lie `<label htmlFor={inputId}>` à un `id` généré par `useId` (`InputField.tsx:66,114-116`), avec repli `aria-label`/placeholder (l.101-103), `aria-required`, astérisque requis. `SelectField`, `TextArea`, `BottomSheet`, `Modal` utilisent aussi `useId`.
- **Boutons icône seule — [FAIT] ✅ (majoritairement) :** `IconButton` **exige** `aria-label` (type TS obligatoire, `IconButton.tsx:17`). `NavItem`, `RailItem`, `TopAppBar`, `CloseButton` fournissent `aria-label`. Risque résiduel : les libellés utiles ne passent que par `title` (hover) dans certains cas (cf. §6.1).
- **Focus visible — [FAIT] ✅ :** anneau opaque unifié `focus-ring` (anthracite, `--color-focus-ring` `index.css:648`) via `focus-visible:ring-2 ring-focus-ring` sur Button/IconButton/PageTabs/BottomSheet. Sur surfaces sombres (sidebar/rail), l'anneau passe au jaune.
- **Ordre de tabulation / clavier — [FAIT] ✅ :** roving `tabIndex` sur barre du bas et rail ; pièges de focus sur Modal/BottomSheet/tiroir ; `Escape` partout.
- **Contrastes (ratios calculés) — [FAIT] :**

| Paire (texte / fond) | Ratio | Verdict |
|---|---|---|
| on-surface `#1C1917` / blanc | **17.5:1** | ✅ AAA |
| text-secondary `#57514A` / blanc | **7.83:1** | ✅ AAA |
| on-surface-variant `#6E675F` / blanc | **5.57:1** | ✅ AA |
| on-surface-variant `#6E675F` / surface-muted `#F4F2EF` | **4.99:1** | ✅ AA (juste) |
| neutral-500 `#79736B` / blanc | **4.69:1** | ✅ AA (juste) |
| **texte noir `#1A1A1A` sur JAUNE `#FDC910`** | **11.2:1** | ✅✅ (motif « rempli jaune ») |
| **JAUNE `#FDC910` en texte sur blanc** | **1.55:1** | ❌ (d'où la règle X12 qui l'interdit) |
| success `#047857` / blanc | 5.48:1 | ✅ AA |
| danger `#DC2626` / blanc | 4.83:1 | ✅ AA |
| info `#2563EB` / blanc | 5.17:1 | ✅ AA |
| **warning `#E8710A` / blanc** | **3.09:1** | ❌ texte normal (✅ si grand/UI ≥3:1) |
| **neutral-400 `#A8A199` / blanc** | **2.55:1** | ❌ texte (placeholder/désactivé) |
| border-strong `#8E877E` / blanc | 3.55:1 | ✅ UI 3:1 |

**Constat contraste :** le socle texte est **conforme AA/AAA**. Deux points de vigilance : **`warning` (#E8710A)** échoue en **texte normal** (3.09) — à réserver aux fonds/gros texte ou basculer sur `warning-strong #9A3412` ; **`neutral-400`** (2.55) ne doit servir qu'à du décoratif. La règle X12 (jaune jamais en texte sur clair) est **justifiée par le calcul** (1.55:1).

**TRAITÉ (lot 5, 2026-07-25)** — détail dans `docs/mobile-targeted-qa/2026-07-25/RAPPORT-LOT5.md` :
- `warning` : recensement exhaustif des 12 usages en classe → **2 seulement portaient du texte** (`UserDetailsPage.tsx:792` et `:807`, badges Entra ID / PIN), basculés sur `text-warning-strong` (2,79:1 → **6,60:1** contre le fond réel `bg-warning/10` = `#FDF1E7`, plus défavorable que le blanc). `Badge` et `ConfirmationDialog` appliquaient déjà la règle. Fonds, bordures et icônes restent en #E8710A.
- `neutral-400` : **aucun écart** — les 6 usages sont tous sur surface sombre (sidebar/rail), soit **6,85–7,17:1**, ✅ AAA. Le 2,55:1 était calculé contre un blanc qui n'existe dans aucun usage réel. Le token n'est pas exposé en classe Tailwind (atteignable seulement en `[var(--color-neutral-400)]`).
- Garde-fous : commentaires de règle ajoutés sur les tokens (`index.css:665-673` et `:679`) pour empêcher la réintroduction de `text-warning` et l'usage de `neutral-400` sur fond clair.

---

## 8. DETTE & INCOHÉRENCES TRANSVERSES

- **Couleurs — [FAIT] :** ~**40 valeurs hex distinctes** définies dans `index.css` (couche marque + neutres 50→900 + sémantiques light/strong). Le `#FFC107` (ancien seed Amber) n'apparaît plus qu'en **commentaire** (`index.css:8`) — palette morte correctement excisée. Hors tokens : **3 hex bruts** dans `LoginPage`. Système globalement **discipliné**.
- **Espacement — [FAIT] :** échelle tokenisée `--radius-*` (2/4/8/full) et spacings `page`/`page-sm`/`card`/`card-compact` (`tailwind.config.js:148-168`) ; le reste = échelle Tailwind standard. Cohérent.
- **Typographie — [FAIT] :** typescale MD3 complet + cran maison `stat-value` (30→24 px en compact, `index.css:72-77,543-546`) ; steps-down responsive display/headline (`index.css:512-547`). Cohérent.
- **Styles inline — [FAIT] :** **20** occurrences `style={{…}}`, dont **7** dans `FinanceManagementPage` (positionnement SVG légitime) et des dégradés sidebar/rail. Faible.
- **`!important` (`!` Tailwind) — [FAIT] :** **~1004** occurrences — dette réelle, concentrée sur les composants de nav qui surchargent `Button`. (Piège v4 connu : `!variant:` est un no-op silencieux, il faut `variant:!`.)
- **Duplications logique UI — [FAIT] :** 2 systèmes d'onglets (PageTabs/SegmentedButton), 2 mécanismes d'infobulle (title/Tooltip), 7 tables sans variante carte mobile (cf. §4.2).
- **Code mort visible — [FAIT] :** chunk `vendor-router` pour react-router absent (`vite.config.ts:24`) ; préchargement Roboto Flex inutilisé (`index.html:21`) ; classes Tailwind marquées `@deprecated` encore exposées (`surface.subtle`, `dark`, `duration.micro/macro`, `borderRadius.pill` — `tailwind.config.js`).

---

## 9. SYNTHÈSE

### 9.1 Tableau récapitulatif

| # | Constat | Catégorie | Gravité | Page(s) | Référence |
|---|---|---|---|---|---|
| 1 | `viewport-fit=cover` absent → `env(safe-area-inset)` = 0 sur iOS encoché ; code safe-area inopérant | [FAIT] | Majeur | Global | `index.html:6` ; `ListActionFab.tsx:46` ; `Snackbar.tsx:98` |
| 2 | Barre du bas / rail sans `safe-area-inset-bottom` | [FAIT] | Majeur | Global mobile | `BottomAppBar.tsx:16` ; `NavigationBar.tsx:243` |
| 3 | `h-screen`/`min-h-screen` (100vh) au lieu de `dvh` | [FAIT] | Majeur | Shell, Login, Access/Change | `AppLayout.tsx:369` ; `LoginPage.tsx:185,231` |
| 4 | Tableau Audit par service : valeurs nues **sans libellés** en compact (en-tête `hidden medium:grid`) | [FAIT] | Majeur | Audit | `PhysicalAuditView.tsx:434,463,479-482` |
| 5 | Troncature nom de rôle → « A… »/« C… » (CSS `truncate` + flex partagé avec badges, pas de `flex-col`) | [FAIT] | Majeur | Rôles & accès | `RbacManagementPanel.tsx:747-756` |
| 6 | Infobulles `title=` natives (158×) inaccessibles au tap ; `<Tooltip>` tactile utilisé 3× | [FAIT] | Majeur | Global | grep `title=` ; `Tooltip.tsx:85-92` |
| 7 | Cibles tactiles < 44 px : `Button` md (40), `IconButton` (40×40), onglets `PageTabs` (40) | [FAIT] | Majeur | Global | `Button.tsx:37-39` ; `IconButton.tsx:73` ; `PageTabs.tsx:156` |
| 8 | Actions primaires du Dashboard **absentes en medium** (600–839) | [FAIT] | Majeur | Dashboard / tablette | `DashboardPage.tsx:346,365` |
| 9 | Comptes démo : nom/rôle complet en `title` hover-only (badge lettre persistant OK) | [FAIT] | Mineur | Connexion | `LoginPage.tsx:388-400` |
| 10 | Bouton « Retour » du Dashboard = wizard de retour matériel (label ambigu) | [FAIT] | Mineur | Dashboard | `DashboardPage.tsx:350` |
| 11 | Compteur « 5 » des onglets Paramètres = nb total d'onglets (pas une notif) | [FAIT] | Info (par design) | Paramètres | `PageTabs.tsx:61,247,256` |
| 12 | ~~7~~ **6** tables sans variante carte mobile (`ModelDetailsPage` en avait déjà une depuis `b9ceed4`) — **CLOS lot 5, 2026-07-25** : 4 imports en scroll assumé (`ui/TableScrollArea` + colonne Statut épinglée), CategoryDetails + AddBudget en cartes | [FAIT] | Mineur | Imports, Détails cat., AddBudget | §4.2 ; `RAPPORT-LOT5.md` |
| 13 | Actions `group-hover` sans repli tactile (supprimer budget, valeurs de graphe) | [OBSERVÉ] | Mineur | Finance | `AddBudgetModal.tsx:453` ; `FinanceManagementPage.tsx:817` |
| 14 | `warning #E8710A` (3.09:1) & `neutral-400 #A8A199` (2.55:1) sous AA en texte — **CLOS lot 5, 2026-07-25** : 2 usages texte de `warning` corrigés (`UserDetailsPage:792,807`) ; `neutral-400` **sans écart** (uniquement sur surface sombre, 6,85–7,17:1) | [FAIT] | Mineur | Global | §7 ; `RAPPORT-LOT5.md` |
| 15 | ~1004 surcharges `!` Tailwind (dette de style) | [FAIT] | Mineur | Global (nav) | grep `!` |
| 16 | Config morte : `vendor-router` (react-router absent) ; Roboto Flex préchargée inutilisée | [FAIT] | Mineur | Build | `vite.config.ts:24` ; `index.html:21` |
| 17 | Pas d'`ErrorBoundary` global (erreurs locales seulement) — **CLOS lot 5, 2026-07-25** : `ui/ErrorBoundary` en racine (`App.tsx`) + par vue (`AppLayout`, `key={currentView}`), repli `EmptyState` + « Recharger », sonde 10/10 | [OBSERVÉ] | Mineur | Global | §5 ; `RAPPORT-LOT5.md` |
| 18 | `layout/` mélange tokens sémantiques et valeurs arbitraires `[var(--color-*)]` ; hex bruts Login | [FAIT] | Mineur | Layout, Login | `NavigationBar.tsx:61` ; `LoginPage.tsx:185` |
| 19 | Seuil mobile réel = **599 px** (et non 640) | [FAIT] | Info | Global | `breakpoints.ts:10-11` |
| 20 | **Points forts** : breakpoints centralisés, tiroir/Modal/BottomSheet avec focus-trap+Escape, état actif nav en profondeur, listes Inventaire/Users en cartes mobiles, contraste texte AA/AAA | [FAIT] | — | — | §3, §5, §7 |

### 9.2 [NON VÉRIFIABLE] — protocole de test manuel suggéré

| Sujet | Appareil / condition | Action | Résultat attendu à vérifier |
|---|---|---|---|
| Safe-area bas | iPhone à encoche (Safari iOS), portrait | Ouvrir une section avec barre du bas ; faire défiler jusqu'en bas | La barre du bas et le FAB ne doivent pas être masqués par la barre d'accueil (constats #1/#2 prédisent un chevauchement tant que `viewport-fit=cover` manque) |
| 100vh dynamique | Safari iOS / Chrome Android, barre d'URL visible puis rétractée | Charger le Dashboard, scroller pour rétracter la barre d'URL | La barre du bas ne doit ni sauter ni sortir de l'écran (constat #3) |
| Infobulles tactiles | Téléphone tactile réel | Taper un item de nav / un avatar démo / une icône à `title` | Vérifier qu'aucune information utile n'est perdue faute de survol (constat #6) |
| Cibles tactiles | Téléphone réel, doigt | Tenter de taper précisément un `IconButton` (ex. suppression RBAC) et un onglet | Mesurer les taps ratés sur cibles 40 px (constat #7) |
| Audit mobile | Téléphone < 400 px | Ouvrir Audit, sélectionner un périmètre avec données | Confirmer que le tableau par service affiche des nombres sans libellé (constat #4) |
| RBAC mobile | Téléphone ~360 px | Ouvrir Rôles & accès, onglet Rôles | Confirmer la troncature du nom à 1 lettre selon les badges présents (constat #5) |
| Dashboard tablette | iPad portrait (~768 px) ou fenêtre 700 px | Ouvrir le Dashboard | Confirmer l'absence des boutons Attribuer/Retour/Nouvelle demande (constat #8) |
| Onglets Paramètres | Téléphone, 5 onglets | Ouvrir Paramètres, observer le débordement | Confirmer fondus+chevrons et bouton « 5 » ouvrant la feuille (constat #11) |
| Clavier logiciel | Téléphone réel, formulaires | Ouvrir un champ dans un `Modal`/`BottomSheet` plein écran | Vérifier que le champ focalisé reste visible au-dessus du clavier (non évaluable en statique) |
| Régénération captures 360 px | — | `npm run dev` + Playwright à 360/390/768 | Comparer aux baselines `docs/md3-visual-baseline/{compact,medium}` (compact = 393 px déjà couvert) |

---

*Fin de l'audit. Aucun fichier de code n'a été modifié ; ce rapport ne contient que des constats (les recommandations feront l'objet d'une étape séparée).*
