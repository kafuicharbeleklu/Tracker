# RAPPORT-AUDIT — 2026-08-07

Audit croisé **codebase Tracker ↔ projet Claude Design**. Tout est remesuré sur les fichiers du
jour : les 27 fichiers de `screens/`, les 36 écrans du dépôt, les 13 documents normatifs. Aucun
chiffre n'est repris d'un rapport antérieur sans avoir été recompté.

> *(Mise à jour du 08/08 : planches 15.1 et 06.5 livrées. Couverture **28 / 36**, plus aucun écran
> « à réinstruire ». Ne reste que l'explorateur de documentation.)*
>
> **Le résultat en une ligne.** Les six arbitrages ouverts ont été tranchés et appliqués dans la
> foulée de cet audit : les rôles divergents passent de **37 (06/08) à 24 (relevé du matin) à 10**,
> et **il ne reste aucune divergence de composant produit** — les dix restantes sont le chrome de
> planche (6 rôles, sans propriétaire) et les quatre familles de statut, qui doivent diverger par
> surface. **Puis le socle de chrome a été écrit et appliqué à son tour** : les 27 formes des six
> rôles d'échafaudage sont ramenées à un socle unique, et le projet tombe à **4 divergences, toutes
> voulues — zéro divergence subie**. Le fait neuf du jour est ailleurs : **le dénominateur de
> couverture était faux**. Le produit ne porte pas 31 écrans mais **36** — cinq écrans hors session
> (dont deux routes publiques jamais recensées : la galerie du design system et l'explorateur de
> documentation) n'ont jamais figuré dans un tableau de couverture.

---

## 0 · Rappel de cadrage

Une planche ne reproduit pas l'écran du produit : elle en propose la **version repensée**. Les
différences de dessin ne sont donc jamais comptées comme des écarts. Ce rapport ne relève que :
la **couverture** (un écran du code existe-t-il quelque part dans le dessin), la **complétude**
(les états et régimes de cet écran sont-ils traités), et la **cohérence interne** du design system.

Méthode : relevé automatique sur la source. Jetons = déclarations `:root` comparées nom par nom.
Composants = toutes les règles à sélecteur simple, normalisées (déclarations triées) puis comparées
déclaration contre déclaration. **L'analyseur a été corrigé trois fois dans la journée** (registre
§2.48) : il retire désormais les commentaires du sélecteur, éclate les sélecteurs groupés, exclut
les répliques `-actuel` sans `@dsCard`, et publie **deux seuils** — ≥ 3 planches pour les
composants partagés, = 2 pour les homonymes. Les chiffres ci-dessous sont ceux de l'analyseur
corrigé ; ceux des audits antérieurs ne leur sont pas comparables. États = relevé de **mots** dans le rendu, donc **borne haute**.
Couverture = `ViewType` de `useAppNavigation.ts` + branches de routage de `App.tsx`.

---

## 1 · Inventaire des pages, vues et états — d'après le code

### 1.1 Les 36 écrans du produit

**31 `ViewType`**, routés par `useAppNavigation.ts` depuis le hash, plus **5 écrans hors session**
routés par `App.tsx` en amont de l'arbre de providers.

| # | Écran | Route | Fonctionnalité | Composants structurants |
| --- | --- | --- | --- | --- |
| 1 | `dashboard` | `/` | Accueil, à traiter, raccourcis | `MetricCard` · `EntityRow` · `FabContainer` |
| 2 | `equipment` | `/inventory` | Liste du parc, recherche, filtres | `SearchFilterBar` · `EntityRow` · `EmptyState` · `Pagination` |
| 3 | `equipment_details` | `/inventory/:id` | Fiche équipement, actes, historique | `DetailPageShell` · `MovementTimeline` · `StatusBadge` |
| 4 | `add_equipment` | `/inventory/add` | Créer un équipement (scan SN mobile) | `FullScreenFormLayout` · `InputField` · `SelectField` |
| 5 | `edit_equipment` | `/inventory/edit/:id` | Corriger la fiche — **même vue que 4** | idem |
| 6 | `import_equipment` | `/inventory/import` | Import CSV d'une livraison | `FileDropzone` · `TableScrollArea` |
| 7 | `equipment` *(filtré)* | `/inventory/filter/:f` | Liste pré-filtrée depuis le tableau de bord | idem 2 — **état de la vue 2**, pas une vue |
| 8 | `users` | `/users` | Annuaire | `SearchFilterBar` · `EntityRow` · `UserAvatar` |
| 9 | `user_details` | `/users/:id` | Fiche personne, équipements détenus | `DetailPageShell` · `Menu` · `StatusBadge` |
| 10 | `add_user` | `/users/add` | Inviter une personne | `FullScreenFormLayout` |
| 11 | `edit_user` | `/users/edit/:id` | Modifier — **même vue que 10** | idem |
| 12 | `import_users` | `/users/import` | Import de l'annuaire | `FileDropzone` |
| 13 | `tasks` | `/tasks` | File de travail unifiée | `EmptyState` · `Chip` · `EntityRow` |
| 14 | `approvals` | `/approvals` | Demandes en attente d'arbitrage | `ApprovalRow` · `EmptyState` |
| 15 | `new_request` | `/approvals/new` | Demander un équipement | `BottomSheet` · `SegmentedButton` |
| 16 | `assignment_wizard` | `/wizards/assignment` | Attribuer — assistant | `WizardLayout` · `EmptyState` ×2 · `TransactionTicketModal` |
| 17 | `return_wizard` | `/wizards/return` | Restituer — assistant | `WizardLayout` · `EmptyState` |
| 18 | `management` | `/management` | Référentiel : catégories et modèles | `PageTabs` · `EmptyState` ×2 |
| 19 | `add_category` | `/management/categories/add` | Créer une famille | `FullScreenFormLayout` |
| 20 | `category_details` | `/management/categories/:id` | Fiche de type | `DetailPageShell` |
| 21 | `add_model` | `/management/models/add` | Créer un modèle | `FullScreenFormLayout` |
| 22 | `model_details` | `/management/models/:id` | Fiche de modèle | `DetailPageShell` |
| 23 | `import_models` | `/management/models/import` | Import de modèles | `FileDropzone` |
| 24 | `locations` | `/locations` | Pays → site → local | `EmptyState` |
| 25 | `import_locations` | `/locations/import` | Import d'emplacements | `FileDropzone` |
| 26 | `rbac` | `/rbac/roles` | Rôles et permissions | `RbacManagementPanel` · `EmptyState` ×4 |
| 27 | `settings` | `/settings` | Paramètres, dont un fragment « mon compte » | `Toggle` · `SelectField` |
| 28 | `audit` | `/audit/overview` | Inventaire physique | `AuditOverviewMobile` · `BottomSheet` |
| 29 | `audit_details` | `/audit/details/:id` | Session d'audit | `SideSheet` · `PageTabs` |
| 30 | `finance` | `/finance` | Budgets et dépenses | `SideSheet` · `AddBudgetModal` · `AddExpenseModal` |
| 31 | `reports` | `/reports` | Rapports | `TableScrollArea` |
| 32 | `not_found` | *(section inconnue)* | 404 explicite | — |
| **33** | `LoginPage` | hors session | Connexion | `InputField` · `Button` |
| **34** | `ChangePasswordPage` | hors session — `needsPasswordChange` | Mot de passe imposé à l'arrivée | `FullScreenLayout` |
| **35** | `AccessDeniedPage` | hors session — `accessDenied` | Accès refusé | — |
| **36** | `DocumentationExplorerPage` | `/documentation/ui-flow-map` | Explorateur de la carte des flux — **route de production** | — |
| **(dev)** | `DesignSystemGalleryPage` | `/dev/design-system` | Vitrine des primitives — **`import.meta.env.DEV` seulement** | tous |

**Dépendances de vues à retenir** : `edit_*` réemploie la vue `add_*` (une seule vue de dessin
suffit) ; `/inventory/filter/:f` est un **état** de la liste, pas une vue ; les deux wizards
partagent l'étape de preuve ; `settings` héberge le fragment « mon compte » qui n'a pas de vue
propre ; les cinq écrans 33–36 vivent **hors de l'arbre de providers** et ne peuvent donc porter ni
donnée métier ni coque de navigation.

### 1.2 États présents dans le code

| État | Où il existe | Constat |
| --- | --- | --- |
| Vide | `EmptyState` dans 9 vues (`approvals`, `equipment`, `users`, `tasks`, `management`×2, `rbac`×4, les 2 wizards, `audit`) | couvert |
| Chargement | `LoadingSpinner` (plein écran au démarrage, variante linéaire), `Skeleton` | présent, mais **non systématisé par vue** |
| Erreur de rendu | `ErrorBoundary` racine + par vue dans `AppLayout` | couvert |
| Erreur de saisie / refus | `Snackbar`, `ConfirmationDialog`, messages de champ | présent, **pas de règle unique** |
| **Hors ligne** | **aucune occurrence** de `navigator.onLine` dans `src/` | **absent du code** |
| Responsive | 5 points de rupture (`breakpoints.ts` : 600 · 840 · 1200 · 1600), `useMediaQuery(MEDIA.belowExpanded)` employé dans 4 vues seulement | doctrine côté code = MD3 ; application partielle |
| **Cible tactile 48 px** | **aucune occurrence** de `min-h-[48px]` / utilitaire équivalent | **absente du code** |

---

## 2 · Inventaire des planches Claude Design

**28 fichiers dans `screens/`** : **26 pistes** portant une ligne `@dsCard` — 25 au relevé du
matin, plus **09.2 livrée le jour même** — et 2 répliques de référence sans carte
(`login-actuel.html`, `dashboard-actuel.html`). 11 pistes archivées.

Statut *dessin* : **finalisé** = validé par l'utilisateur · **en cours** = livrée, en attente de
verdict · **brouillon** = livrée mais pas encore inscrite aux documents.

| N° | Planche | Fichier | Écran(s) du code | Dessin | Produit |
| --- | --- | --- | --- | --- | --- |
| 02.1 | Connexion | `login-piste` | 33 | **finalisé** 26/07 | non portée |
| 02.2 | Première connexion | `login-2-premiere-connexion-piste` | 34 (+ invitation) | en cours 02/08 | non portée |
| 03.1 | Tableau de bord | `dashboard-1-tableau-piste` | 1 | **finalisé** 28/07 | non portée |
| 03.2 | « À traiter » | `dashboard-2-atraiter-piste` | 1 (bloc) | en cours 31/07 | non portée |
| 03.3 | Tâches — la file | `dashboard-3-taches-piste` | 13 | en cours 31/07 | **vue créée** 06/08 |
| 04.1 | Liste équipements | `equipement-1-liste-piste` | 2 + 7 | **finalisé** 29/07 | non portée |
| 04.2 | Détail équipement | `equipement-2-detail-piste` | 3 | **finalisé** 29/07 | non portée |
| 04.3 | Créer, corriger, sortir | `equipement-3-creation-piste` | 4 · 5 · 6 | en cours 30/07 | non portée |
| 04.4 | La suite de l'incident | `equipement-4-incident-suite-piste` | **aucun** | en cours 02/08 | non portée |
| 05.1 | Liste utilisateurs | `utilisateur-1-liste-piste` | 8 | **finalisé** 30/07 | non portée |
| 05.2 | Détail utilisateur | `utilisateur-2-detail-piste` | 9 | en cours 30/07 | non portée |
| 05.3 | Créer un compte | `utilisateur-3-creation-piste` | 10 · 11 · 12 | en cours 30/07 | non portée |
| 05.4 | Administrer un compte | `utilisateur-4-compte-piste` | actes de 9 | en cours 31/07 | non portée |
| 06.1 | Le parcours complet | `attribution-1-parcours-piste` | 16 · 17 | en cours 30/07 | non portée |
| 06.2 | La preuve | `attribution-2-preuve-piste` | étape de 16 · 17 | en cours 31/07 | non portée |
| 06.3 | Fins de flux | `attribution-3-fins-de-flux-piste` | clôtures de 16 · 17 | en cours 31/07 | non portée |
| 06.4 | Demander un équipement | `attribution-4-demander-piste` | 15 | en cours 05/08 | **appliquée** 06/08 |
| **06.5** | **Arbitrer les demandes** | `attribution-5-arbitrer-piste` | 14 | **en cours 08/08** | non portée |
| 07.1 | Mon compte | `mon-compte-piste` | fragment de 27 | en cours 31/07 | non portée |
| 08 | Lexique | `lexique-piste` | documentation | **finalisé** 31/07 | s.o. |
| 09.1 | Catalogue | `catalogue-1-referentiel-piste` | 18 · 19 · 20 | en cours 05/08 | **partielle** |
| **09.2** | **Fiche de modèle et imports** | `catalogue-2-modele-piste` | 21 · 22 · 23 · 25 | **en cours 07/08** | non portée |
| **15.1** | **Finances et Rapports** | `finances-1-rapports-piste` | 30 · 31 | **en cours 08/08** | non portée |
| 10.1 | Emplacements | `emplacements-1-referentiel-piste` | 24 | en cours 05/08 | non portée |
| 11.1 | Rôles et permissions | `roles-1-permissions-piste` | 26 | en cours 05/08 | non portée |
| 12.1 | États transverses | `etats-piste` | 32 · 35 + transverse | en cours 06/08 | **partielle** |
| 13.1 | Les trois régimes | `regimes-piste` | transverse | en cours 06/08 | non portée |
| 14.1 | Paramètres | `parametres-piste` | 27 | en cours 06/08 *(inscrite le 06/08)* | non portée |

**6 validées · 19 en attente de verdict · 22 sur 25 non portées.**

---

## 3 · Couverture — codebase contre Claude Design

### 3.1 Livrable demandé : le tableau écran par écran

| Écran du codebase | Planche | Statut | Écart identifié |
| --- | --- | --- | --- |
| `dashboard` | 03.1 · 03.2 | couvert, validé | pas de régime medium/expanded |
| `equipment` | 04.1 | couvert, validé | — |
| `equipment` *(filtré)* | 04.1 | couvert | l'entrée pré-filtrée depuis le tableau de bord n'est pas montrée |
| `equipment_details` | 04.2 | couvert, validé | — |
| `add_equipment` · `edit_equipment` | 04.3 | couvert | pas d'erreur de saisie ; scan SN mobile non dessiné |
| `import_equipment` | 04.3 | couvert | — |
| `users` | 05.1 | couvert, validé | — |
| `user_details` | 05.2 | couvert | pas d'erreur ; `.prov` et `.ch` hors canon |
| `add_user` · `edit_user` · `import_users` | 05.3 | couvert | — |
| `tasks` | 03.3 | couvert, **porté** | 2 natures de la planche sans donnée : *code PIN à définir*, *réparations* |
| `new_request` | 06.4 | couvert, **porté** | — |
| `assignment_wizard` · `return_wizard` | 06.1 · 06.2 · 06.3 | couvert | pas de régime au-delà de 393 ; `.btn.busy` non réemployé |
| `management` · `add_category` · `category_details` | 09.1 | couvert | **s'arrête au type** |
| `locations` | 10.1 | couvert | — |
| `rbac` | 11.1 | couvert | — |
| `settings` | 14.1 | couvert | — |
| `not_found` | 12.1 | couvert, **porté** | — |
| `LoginPage` | 02.1 | couvert, validé | **hors canon sur 2 rôles** (`.field`, `.note`) |
| `ChangePasswordPage` | 02.2 | couvert | — |
| `AccessDeniedPage` | 12.1 | couvert, **porté** | refus engagé depuis une rangée non porté |
| `model_details` | **09.2** | **couvert** *(07/08)* | la fiche répond au stock ; le repli inventé des spécifications est retiré |
| `add_model` | **09.2** | **couvert** *(07/08)* | — |
| `import_models` | **09.2** | **couvert** *(07/08)* | contrat de colonnes, décompte, lignes refusées nommées |
| `import_locations` | **09.2** | **couvert** *(07/08)* | + le refus « parent introuvable », que le produit affiche en « Type invalide » |
| `finance` | **15.1** | **couvert** *(08/08)* | le héro porte le reste, pas l'enveloppe ; le classement CAPEX/OPEX n'est plus deviné du montant |
| `reports` | **15.1** | **couvert** *(08/08)* | chaque rapport porte ses lignes et ses colonnes avant l'export ; l'exception à la largeur de lecture est nommée (`.tscroll`) |
| `approvals` | **06.5** | **couvert** *(08/08)* | l'exclusion est levée : le repli sous « Tâches » est un regroupement de **barre de navigation**, pas une disparition d'écran |
| **`DocumentationExplorerPage`** | — | **manquant, jamais recensé** | route de **production** (`/documentation/ui-flow-map`), hors coque, hors design system |
| `DesignSystemGalleryPage` | — | hors périmètre | build DEV uniquement — à acter |
| `audit` · `audit_details` | — | exclu par décision | déjà basculé dans le code, sert de référence |

**Couverture : 28 écrans dessinés sur 36 · 0 manquant · 0 à réinstruire · 3 exclus · 5 regroupés
sous une planche parente.** *(21/36 au relevé du 07/08 ; 09.2 puis 15.1 ferment les six écrans
manquants. Ne restent qu'une décision — `approvals` — et l'explorateur de documentation.)* *(21/36 au relevé du matin ; la planche 09.2, livrée le jour même,
ferme les quatre écrans du référentiel.)* Le dénominateur corrigé fait passer la couverture de « 22/31 » annoncée
hier à **21/36 réellement mesurés** — l'écart tient entièrement aux cinq écrans hors session, dont
un seul (`AccessDeniedPage`) était couvert sans le savoir.

**Dessiné sans écran dans le code** : 04.4 *La suite de l'incident* et 07.1 *Mon compte*.

### 3.2 Complétude des planches existantes

| Dimension | Mesure du jour | Commentaire |
| --- | --- | --- |
| Erreur / refus / saisie invalide | **22 sur 22** *(08/08)* | Passe faite. Le dénominateur était faux : **3 planches n'engagent aucune écriture** — 03.1, 09.1 et 11.1 n'ont que des raccourcis et des navigations, et sont **exemptes** (§2.55). Les 9 autres portent désormais l'erreur au point d'engagement |
| Chargement | **2 sur 25** | 12.1 tient le gabarit `.sk` ; il n'est réemployé qu'une fois |
| Hors ligne | **1 sur 25** | 12.1 seule — **et le code n'en a aucune trace** |
| Geste en cours (`.btn.busy`) | **1 sur 25** | 12.1 seule ; les deux wizards en ont besoin |
| `@media` | **0 sur 25** | attendu : 13.1 démontre les régimes par des cadres de largeur fixe, pas par des requêtes |
| Régimes au-delà de 393 px | **3 gabarits sur 8** | 13.1 traite liste, fiche, feuille. Restent tableau de bord, wizard, formulaire plein écran, file de tâches, référentiel |

---

## 4 · Revue du design system

### 4.1 Ce qui tient — mesuré aujourd'hui

| Contrôle | Résultat |
| --- | --- |
| **Jetons** | **36 noms, 0 divergence de valeur** sur 25 planches |
| Rôles à sélecteur simple partagés par ≥ 3 planches | **101**, dont **97 à forme unique** |
| Rôles divergents | **4** en fin de journée — 10 après les arbitrages, 24 au relevé du matin, 37 la veille |
| **Divergences subies** | **0 — au seuil de ≥ 3 planches.** Les 4 restantes sont les familles de statut, qui doivent diverger par surface |
| **Au seuil de 2 planches** | **5 homonymes** — deux composants sous un nom : `.mrow` `.bar` `.count` `.hrow` `.demo` (+ `.panel`, écart réel). `.foot` et `.brand` tranchés le jour même. **Un homonyme naît de deux emplois, pas de trois** : le seuil du relevé ne pouvait pas les voir (registre §2.47) |
| **Angles morts de l'analyseur** | **5, tous trouvés le 07/08** : sélecteur commenté (7 divergences cachées), seuil à 3 planches (5 homonymes), sélecteur groupé (la 3ᵉ forme de `.intro`), le recensement qui ne compte que le déclaré (une **quatrième graisse** imposée par le navigateur), et **le relevé qui ne lit que les blocs `<style>`** — **79 surcharges inline** lui échappaient, dont 6 qui défont une métrique canonique. Corrigés, sauf les 6, instruits en §2.51 |
| Familles de statut | `--live-*` / `--st-*` séparées par surface, sans exception |
| `.arow`, `.lfoot`, `.at2`, `.bst`, `.idt`, `.lab`, `.btn` | **convergés** — la passe du 06/08 est vérifiée au rendu |
| Émojis · points d'exclamation | **0** |

### 4.2 Les divergences, par nature — relevé du matin, et état après la passe du jour

| Nature | Rôles | Jugement |
| --- | --- | --- |
| **Chrome de planche, sans propriétaire** | `.phone` (9 formes) · `.colnote` (6) · `.wrap` (4) · `.page` (4) · `.intro` (2) · `.col` (2) | **6 rôles, 27 formes — traités le 07/08** (registre §2.46). Sous les 27 formes, **deux variables réelles** : une hauteur plancher par planche, passée en jetons `--phone-h` / `--colnote-h`, et une convention de marge écrite de deux façons |
| **Divergence légitime** | `.st-a` · `.st-v` · `.st-o` · `.st-b` | 4 — elles **doivent** différer selon la surface |
| **Variantes sans nom — arbitrage requis** | `.note` (3) · `.ch` (3) · `.prov` (2) · `.pick` (2) · `.idh` (2) · `.hero` (2) | **6 — tranchés et appliqués le 07/08**, voir §4.3 et registre §2.45 |
| **Dérives mécaniques** | `.field` (02.1 seule) · `.tb` (13.1) · `.bhead` · `.two` | **4 — appliquées le 07/08.** `.two` et le `.pick.done` de 04.3 étaient des **règles mortes** : déposées |
| **Faux positifs — un seul l'était vraiment** | `.card` | **1.** Sa seconde forme vient de `login-actuel`, une **baseline figée** : le relevé exclut désormais les fichiers sans `@dsCard` |
| **…et deux ne l'étaient pas** | `.nav` · `.foot` | **Corrigé en fin de journée.** `.nav` divergeait bien — 13.1 portait `margin-top:auto`, invisible au relevé du matin ; `margin-top:auto` **entre au canon** et 19 planches sont réécrites. `.foot` est un **homonyme** (pied de planche vs note de téléphone), tranché en `.pfoot` / `.foot` — voir §2.47 |

### 4.3 Les six arbitrages — tranchés le 07/08

**Règle de tranchage retenue : le nom nu revient à la forme majoritaire mesurée, la minoritaire
prend un modificateur.** Décisions inscrites au registre §2.45, appliquées sur dix planches.

| Rôle | Décision | Rendu |
| --- | --- | --- |
| `.note` bordé | devient **`.free`** — c'est un champ, pas une note | identique |
| `.ch` | le majoritaire garde `.ch` ; le centré devient **`.ch.glyph`**, ce qui fond au passage ses deux sous-formes | +4 px sous l'en-tête de 03.1 et 04.2 — **voulu** |
| `.prov` | **`.prov.in`** — même phrase, contenant différent | identique |
| `.pick` | le nom nu revient à la forme remplie ; **`.pick.done` supprimée** | identique |
| `.idh` | **`.idh.obj`** — le voile bleu reste réservé aux personnes | identique |
| `.hero` | **`.hero.plain`** — l'alignement mécanique doublait un espacement (voir ci-dessous) | identique |

**Deux pièges qui justifient de mesurer avant d'aligner.** Le `.field` de 02.1 semblait dériver par
un `background:var(--surface)` de trop ; en réalité son `.panel` est sur `--canvas` et non sur une
carte — retirer le fond aurait fondu le champ dans la page (→ `.field.oncv`). Et le `.hero` de 13.1
aurait reçu `gap:13px` alors que son `.hact` porte déjà `margin-top:14px` : 27 px au lieu de 14
(→ `.hero.plain`).

<details><summary>Le relevé du matin, avant décision</summary>

| Rôle | Forme majoritaire | Forme minoritaire | Question fermée |
| --- | --- | --- | --- |
| `.note` | note de bloc, 12/17, `margin-top:7px` — **8 planches** | encart bordé de saisie libre, 44 px, `border:1px solid var(--line)` — **04.3 · 04.4** *(+ une 3ᵉ forme résiduelle en 02.1 : `width:393px`)* | quel nom pour l'encart ? `.free` ? `.ntfield` ? — et **02.1 doit passer à `.intro`** |
| `.ch` | en-tête à ligne de base + compte à droite — **6 planches** | en-tête à glyphe, centré (± `margin-bottom:4px`) — **03.1 · 04.2 · 03.2 · 05.2** | lequel des deux garde `.ch` ? La variante centrée porte déjà deux sous-formes |
| `.prov` | provenance de page, filet haut + gouttière — **15 planches** | provenance **posée dans une carte** — 04.2 · 05.2 | `.prov.in`, ou deux rôles ? |
| `.pick` | rangée de choix remplie, `padding:6px 12px` — **5 planches** | rangée **encore vide**, `padding:0 12px` — 04.3 | `.pick` vide + `.pick.done` remplie, ou l'inverse ? *(04.3 déclare déjà `.pick.done`)* |
| `.idh` | héro d'identité d'une **personne**, voile bleu `rgba(84,169,220,.24)` — 7 planches | héro d'identité d'un **objet**, voile blanc `.12` — 04.4 | `.idh.obj`, ou deux rôles distincts ? |
| `.hero` | héro en colonne, `flex-direction:column;gap:13px` — 04.4 · 05.4 | héro en bloc simple — 13.1 | 13.1 peut-elle simplement reprendre la forme canonique ? ~~*(les 2 formes de 06/08 ont disparu)*~~ **— faux, et corrigé en fin de journée : elles n'avaient pas disparu, l'analyseur ne les voyait pas** (sélecteurs précédés d'un commentaire). `.hero` porte bien trois compositions, traitées en §2.46 |

</details>

### 4.4 Hygiène

| Contrôle ajouté le 07/08 | Mesure | État |
| --- | --- | --- |
| **La barre du bas porte 5 entrées** (§2.43, jamais vérifié) | **54 barres · 21 à quatre entrées sur 9 planches**, toujours sans « Équipe » | **corrigé** — 54/54 conformes, contrôle n°6 inscrit (§2.52) |


| Contrôle | Mesure | État |
| --- | --- | --- |
| **Rayons hors échelle** | 9 px ×4 · 3 px ×4 · 11 px ×1 | **Clos le 07/08** (§2.49). Le 6 entre à l'échelle — 47 emplois sur un rôle unique est une marche, pas un accident. Les neuf hors-échelle étaient **trois intentions** : deux pastilles (`9`, `11` = la moitié de la hauteur écrite en dur → `var(--r-pill)`), une jauge (`3` → `2`, alignée sur `.wbar`), une case à cocher (`3` → `4`, c'est un contrôle). Échelle : **2 / 4 / 6 / 8 + pastille**. Readme corrigé |
| **Graisses** | **déclarées** : 400 ×55 · 500 ×428 · 600 ×126 — **rendues** : les mêmes **plus 700** | **Le recensement ne comptait que les graisses déclarées.** Les `<b>` non couverts par une règle descendante retombaient sur le défaut du navigateur : une **quatrième graisse, écrite nulle part**. **Corrigé le 07/08** — `b{font-weight:500}` au socle des 25 planches (1 512 `<b>`). Reste à confirmer le 600 d'Archivo contre le brief |
| **Capitales** | **22 planches sur 25** portent au moins un `text-transform:uppercase` | §2.41 ne les admet que pour `.lab` et `.sh` — **le contrôle n'a jamais été fait** |
| Cibles tactiles | `.chip` 40 px · `.sort` / `.cnt` / `.rrow` / `.cp` 44 px | **dette de portage** (§2.41) : le code n'a **aucune** cible 48 px déclarée |

---

## 5 · Livrable — maturité des composants du design system

Cinq niveaux : **canonique** = texte au registre + une seule forme mesurée · **convergé** = une
seule forme, pas encore de texte · **à arbitrer** = plusieurs formes, la question est ouverte ·
**à aligner** = plusieurs formes, la décision est déjà écrite · **sans propriétaire** = employé
partout, déclaré nulle part.

| Famille | Composant | Formes | Planches | Maturité |
| --- | --- | --- | --- | --- |
| **Fondations** | 36 jetons (`--canvas` `--ink*` `--line*` `--brand` `--dark*` `--st-*` `--live-*` `--gap` `--pad` `--rowy` `--btnh`…) | 1 | 25 | **canonique** |
| | Typographie — Inter + Archivo, 5 marches | 1 | 25 | **canonique** (réserve : 3 graisses) |
| | Échelle de rayons — 2/4/6/8 + pastille + rond | 1 | 28 | **canonique** *(fermée 08/08, §2.56)* |
| **Actions** | `.btn` · `.btn-y` · `.btn-ghost` · `.btn-full` | 1 | 22 | **canonique** *(fermé le 06/08)* |
| | `.btn.busy` — geste en cours | 1 | 1 | **convergé**, sous-employé |
| | `.tb` — bouton de barre 48 px | 1 | 22 | **canonique** *(fermé 07/08)* |
| | `.fab` · `.cact` · `.hact` | 1 | — | **canonique** |
| **Saisie** | `.field` · `.field .ph` · `.lab` · `.fgrp` · `.field.oncv` | 1 | 17 | **canonique** *(fermé 07/08)* |
| | `.free` — encart de saisie libre | 1 | 2 | **canonique** *(nommé 07/08)* |
| | `.pick` — rangée de choix | 1 | 6 | **canonique** *(fermé 07/08)* |
| | `.opt` · `.rd` — choix exclusif | 1 | 6 | **convergé** |
| | champ code PIN masqué | 1 | 2 | **canonique** (§13.2) |
| **Listes** | `.lrow` · `.arow` · `.lfoot` | 1 | 6–11 | **canonique** *(`.arow` fermé 05/08, `.lfoot` 06/08)* |
| | `.seek` — recherche collante | 1 | 8 | **canonique** |
| | `.frow` · `.chip` — filtres | 1 | 8 | **convergé** (réserve : 40 px < 48) |
| | `.sort` | 1 | 5 | **convergé** (44 px) |
| **Cartes** | `.card` | 1 | 23 | **canonique** |
| | `.ch` + `.ch.glyph` | 1 | 10 | **canonique** *(fermé 07/08)* |
| | `.prov` + `.prov.in` | 1 | 17 | **canonique** *(fermé 07/08)* |
| | `.note` — note de bloc | 1 | 8 | **canonique** *(fermé 07/08)* |
| | `.warn` · `.rule` | 1 | 14 | **canonique** |
| **Identité** | `.hero` + `.plain` `.stack` `.img` `.off` | 1 | 7 | **canonique** *(fermé 07/08 — trois compositions réelles, trois modificateurs)* |
| | `.idh` + `.idh.obj` · `.idhead` · `.idt` | 1 | 8 | **canonique** *(fermé 07/08)* |
| | `.vig` — vignette 40/rayon 6 | 1 | 12 | **canonique** (réserve : rayon hors readme) |
| | `.at2` · `.bst` | 1 | 6 | **canonique** *(fermé 06/08)* |
| **Statuts** | `.st-a` `.st-v` `.st-o` `.st-b` + famille `--live-*` | 2 par surface | 9 | **canonique — divergence voulue** |
| **Navigation** | `.nav` — barre du bas 5 entrées | 1 | 19 | **canonique** *(`margin-top:auto` entré au canon 07/08)* |
| | `.topbar` — barre de titre d'un régime large | 1 | 1 | **canonique** *(dégagé de la collision `.wbar` le 07/08)* |
| | `.rail` 88 px · `.side` 264 px | 1 | 1 | **convergé** — une seule planche les porte |
| | `.bhead` + `.bhead.icon` | 1 | 4 | **canonique** *(fermé 07/08)* |
| **Surfaces** | `.sheet` · `.sttl` · `.sbody` · `.sfoot` | 1 | 9 | **canonique** (§2.43) |
| | `.dial` — feuille devenue dialogue | 1 | 1 | **convergé** — proposé, non porté |
| **États** | `.sk` — squelette | 1 | 2 | **convergé**, sous-employé |
| | état vide | 1 | 5 | **convergé** |
| | hors ligne | 1 | 1 | **proposé** — absent du code |
| **Arbitrage** | `.dstep` (+`.mine` `.end`) — la garde courante | 1 | 1 | **convergé** *(nommé 08/08)* |
| | `.trail` · `.tstep` (+`.done` `.now` `.todo` `.skip`) — le parcours | 1 | 1 | **convergé** *(nommé 08/08)* |
| | `.dec` — une décision et son motif | 1 | 1 | **convergé** *(nommé 08/08)* |
| **Chrome de planche** | `.phone` · `.colnote` · `.wrap` · `.page` · `.intro` (+`.solo`) · `.col` (+`.wide`) · `.band` (+`.gap`) | 1 | 21–25 | **canonique** *(socle déclaré 07/08, §2.46)* |
| | jetons de planche `--phone-h` · `--colnote-h` | — | 23 | **canonique** — la hauteur plancher est locale, la règle est partagée |

---

## 6 · Recommandations — pages à modéliser, par ordre

| Rang | Chantier | Pourquoi ce rang | Effort |
| --- | --- | --- | --- |
| ~~1~~ | ~~Fiche de modèle et imports du référentiel~~ | **Fait le 07/08** — planche **09.2**, quatre colonnes. Registre §2.50 | — |
| ~~1~~ | ~~Approbations — instruire ou acter la disparition~~ | **Fait le 08/08** — l'exclusion reposait sur une lecture fausse (le repli est un regroupement de nav). Planche **06.5**, quatre colonnes. Registre §2.54 | — |
| ~~2~~ | ~~Les erreurs rétro-appliquées aux 12 planches~~ | **Fait le 08/08** — 9 appliquées, 3 exemptes faute d'écriture engagée. Registre §2.55 | — |
| **3** | **Les régimes appliqués aux 5 gabarits restants** — tableau de bord, wizard, formulaire plein écran, file, référentiel | 13.1 a écrit la loi et l'a montrée sur 3 gabarits sur 8. Les 5 autres sont l'endroit où le portage tranchera seul | extension de 13.1 |
| ~~4~~ | ~~Finances · Rapports~~ | **Fait le 08/08** — planche **15.1**, quatre colonnes. Registre §2.53 | — |
| **5** | **Explorateur de documentation** (`/documentation/ui-flow-map`) | Route de **production**, hors coque, hors design system — à dessiner ou à exclure explicitement. Aujourd'hui elle n'est ni l'un ni l'autre | 1 décision |
| **6** | **Hors ligne** | Dessiné une fois (12.1), absent du code. Le seul état où dessin et code sont tous deux vides | à porter |

## 7 · Recommandations — composants à formaliser, par ordre

| Rang | Objet | Geste | Coût |
| --- | --- | --- | --- |
| ~~1~~ | ~~Le chrome de planche~~ | **Fait le 07/08** — registre §2.46. Divergences subies ramenées à **0** | — |
| ~~2~~ | ~~Les six arbitrages de §4.3~~ | **Faits le 07/08** — registre §2.45 | — |
| ~~3~~ | ~~Les dérives mécaniques~~ | **Faites le 07/08** | — |
| ~~1~~ | ~~L'échelle des rayons~~ | **Tranché le 08/08** (§2.56) — les 9/3/11 px ont bien disparu. Échelle **2/4/6/8** + deux formes hors échelle, pastille et **rond (`50%`, 12 planches, jamais déclaré)**. C'est le readme qui est corrigé | — |
| **1** | **Les six surcharges inline qui défont une métrique canonique** (§2.51) | Un `.phone` qui n'est pas un téléphone, une vignette de 26 px là où §2.43 la dit invariante, deux champs multilignes sans nom, et trois `.prov` écrits à la main avant que `.prov.in` n'existe | 4 décisions |
| **1** | **Les capitales — la passe d'application** | Contrôle fait le 08/08 (§2.56) : **aucun badge, titre ni statut en capitales**, l'interdit du brief est tenu. Les 8 sélecteurs hors règle sont **le même micro-libellé sous d'autres noms** — §2.41 est amendée, restent 5 sélecteurs à fondre dans `.lab` | passe courte |
| **3** | **Les trois graisses** | ~~Quatre en réalité~~ — la 700 est déposée (`b{font-weight:500}` au socle). Reste à confirmer que le 600 d'Archivo est une identité et non une infraction au brief | 1 décision |

---

> **La leçon de méthode du jour.** Deux chiffres bougent en sens inverse. Les divergences de style
> tombent de 37 à 24 parce qu'une passe d'application a eu lieu — la mécanique fonctionne. La
> couverture, elle, **baisse** de 22/31 à 21/36, non pas parce qu'on a perdu du terrain, mais parce
> que le dénominateur était faux : cinq écrans du produit n'avaient jamais été comptés, dont une
> route de production. Un inventaire tiré d'une seule source — ici `ViewType` — ne recense que ce
> que cette source connaît. Le routage de `App.tsx` en savait cinq de plus.
>
> **Et l'analyseur lui-même mentait.** Le motif utilisé par tous les audits antérieurs ne
> reconnaissait pas un sélecteur précédé d'un commentaire CSS : **sept rôles divergents étaient
> invisibles**, dont `.hero` — donné pour fermé le matin même — et une **collision de noms**
> (`.wbar`, jauge de garantie *et* barre de titre). Corriger le seul analyseur a fait passer le
> nombre de rôles partagés de 96 à 103. Avant de croire une mesure, il faut mesurer ce qu'elle ne
> voit pas.
>
> **Et la passe du jour ajoute sa propre leçon.** Sur les treize divergences réputées mécaniques,
> **trois n'existaient pas** (elles venaient des répliques `-actuel`, une baseline figée que le
> relevé n'excluait pas) et **deux auraient cassé le rendu** si on les avait alignées sans regarder
> le contexte. Le relevé automatique dit toujours *où* regarder ; il ne dit jamais *quoi* décider.
