# RAPPORT-AUDIT — 2026-08-05

Balayage complet du projet, **mesuré sur les fichiers publiés** — les vingt et une planches
récupérées du serveur, pas les rapports antérieurs. Deux volets demandés : l'état du projet et
l'état du design system, puis la couverture fonctionnelle face à l'application.

> **Le résultat en une ligne.** La couche des valeurs ne diverge plus du tout — **0 divergence
> sur 36 jetons × 21 planches**, et la règle des deux familles de statut (§2.10 bis) est tenue
> sans exception. Ce qui reste est ailleurs : **28 des 86 composants partagés n'ont jamais été
> nommés au registre**, et les **trois planches du 05/08 ont été bâties sur une copie du socle
> antérieure aux corrections du 04–05/08**. Quatre de leurs écarts sont corrigés dans ce même
> mouvement ; quatre autres demandent un arbitrage et sont restés intacts.

---

## 1 · Ce qui a été mesuré, et comment

| Objet | Méthode | Volume |
| --- | --- | --- |
| Jetons | toutes les déclarations `:root`, commentaires retirés, comparées nom par nom | 36 noms × 21 planches |
| Composants | toutes les règles CSS à sélecteur simple, comparées **déclaration contre déclaration** | 86 rôles partagés par ≥ 3 planches |
| Pastilles de statut | famille déclarée **et** surface d'emploi, relevée sur le parent réel | 10 planches, 45 emplois |
| Interdits du brief | capitales, rayons, graisses, cibles tactiles, émojis — comptés dans le rendu | 21 planches |
| États | vide / erreur / chargement / hors ligne, comptés **dans le cadre du téléphone** seulement | 21 planches |
| Couverture | `ViewType` et pages du dépôt confrontées aux planches | 30 vues, 32 pages |

**Ce que cette méthode ne voit pas**, et il faut le dire : elle compare des déclarations. Elle ne
juge pas la valeur sur laquelle plusieurs planches s'accordent — c'est exactement la limite que
§2.37 s'est inscrite le 05/08, et c'est elle qui a laissé passer le trio 09.x.

---

## 2 · Revue du projet — les planches

**21 pistes de travail**, 15 répliques de référence (groupe 01, baseline figée), 11 pistes
archivées, 8 documents normatifs.

| N° | Planche | Fonction de l'application | Statut |
| --- | --- | --- | --- |
| 02.1 | Connexion | `LoginPage` | **validé** (26/07) |
| 02.2 | Première connexion | `ChangePasswordPage` + invitation | piste livrée 02/08 |
| 03.1 | Tableau de bord | `DashboardPage` | **validé** (28/07) |
| 03.2 | « À traiter » | bloc du tableau de bord | piste livrée 31/07 |
| 03.3 | Tâches — la file | **aucune vue dans le code** | piste livrée 31/07 |
| 04.1 | Liste équipements | `InventoryPage` | **validée** (29/07) |
| 04.2 | Détail équipement | `EquipmentDetailsPage` | **validée** (29/07) |
| 04.3 | Créer, corriger, sortir | `Add/Edit/ImportEquipmentPage` | piste livrée 30/07 |
| 04.4 | La suite de l'incident | **aucune vue** | piste livrée 02/08 |
| 05.1 | Liste utilisateurs | `UsersPage` | **validée** (30/07) |
| 05.2 | Détail utilisateur | `UserDetailsPage` | piste livrée 30/07 |
| 05.3 | Créer un compte | `AddUserPage` + `ImportUsersPage` | piste livrée 30/07 |
| 05.4 | Administrer un compte | actes de `UserDetailsPage` | piste livrée 31/07 |
| 06.1 | Le parcours complet | `AssignmentWizard` · `ReturnWizard` | piste livrée 30/07 |
| 06.2 | La preuve | étape des deux wizards | piste livrée 31/07 |
| 06.3 | Fins de flux | clôtures | piste livrée 31/07 |
| 07.1 | Mon compte | **pas de vue** (partiel dans `SettingsPage`) | piste livrée 31/07 |
| 08 | Lexique | documentation | livré 31/07 |
| 09.1 | Catalogue | `ManagementPage` · `AddCategory` · `CategoryDetails` | piste livrée 05/08 |
| 09.2 | Emplacements | `LocationsPage` | piste livrée 05/08 |
| 09.3 | Rôles et permissions | `RbacPage` | piste livrée 05/08 |

**Dette documentaire relevée** : le tableau « État » du readme donnait encore Catalogue,
Emplacements et Rôles « à faire » et ignorait 04.4 — corrigé le jour même. `PASSATION.md` s'arrête
au 31/07. Le registre **ne nommait 09.2 et 09.3 nulle part** (09.1 y figure douze fois).

---

## 3 · Revue du design system

### 3.1 Ce qui tient — mesuré

| Contrôle | Résultat |
| --- | --- |
| Valeurs de jetons | **0 divergence** sur 36 noms × 21 planches |
| Statut par surface (§2.10 bis) | 10 planches, **0 emploi hors de sa surface** : `--live-*` sur inversé, `--st-*` sur clair |
| Sprite | 37 identifiants, un tracé par nom |
| Barre du bas | une famille de balisage, 5 entrées gestionnaire / 4 utilisateur, sans écart |
| Socle `.card` `.sheet` `.tb` `.grip` `.sfoot` `.vig` `.btn-y/-d/-o` | déclaration unique sur 11 à 18 planches |

### 3.2 Inventaire

**Jetons (36)** — surfaces `--canvas/--surface/--inset` · encres `--ink/--ink2/--ink3` · filets
`--line/--line-strong/--dark-line` · marque `--brand/--nav-on` · inversé
`--dark/--dark-2/--on-dark/--on-dark-2` · statut en deux familles · `--danger` · densité
`--gap/--pad/--rowy/--btnh` et ses trois crans · boutons `--btn-y-bg/-fg`.

**Typographie** — Inter (corps) et Archivo (identité), cinq marches plus un rang de contrôle.
Graisses déclarées : **400 (50) · 500 (358) · 600 (112)**.

**Rayons** — 4 px (135) · 8 px (79) · 6 px (46) · 2 px (41) · 50 % (19), **plus 9 px (4), 3 px
(4), 11 px (1)** hors échelle.

**Composants** — **86 partagés** par au moins trois planches, dont **28 jamais nommés au
registre** et **21 portant plus d'une déclaration** (dont 4 légitimes : les `.st-*`, qui doivent
diverger par surface).

### 3.3 Les écarts

| # | Écart | Preuve | État |
| --- | --- | --- | --- |
| 1 | Bande sous la barre du haut sans marge en tête — le défaut que §2.37 interdit, écrite le même jour | `.seek{padding:0 20px 12px}` en 09.2 et 09.3 contre `12px 20px` en 04.1, 05.1, 09.1 | **corrigé** |
| 2 | Titre de carte à 17 px Archivo 600, contre le rang 4 (13 px / 500) | `.ch h3` dans les trois 09.x | **corrigé** |
| 3 | **12,5 px** réintroduit, valeur nommément bannie par §2.6 | `.warn` dans les trois 09.x | **corrigé** |
| 4 | Gouttière de rangée en dur, hors du jeton de densité | `.arow{padding:6px 0}` dans les trois 09.x, `--rowy` ailleurs | **corrigé** |
| 5 | `.hact` — bloc de gestes de **surface inversée** — employée sur carte claire, alors que §2.14 a créé `.cact` pour ce cas | filet `--line` au lieu de `--dark-line`, trois 09.x | **à arbitrer** |
| 6 | **`.ch` porte deux composants sans rapport** : en-tête de carte (7 planches) et micro-libellé en capitales 11 px (`.conseq .ch`, 5 planches) | mesuré | **à arbitrer** |
| 7 | **`.arow` porte deux jeux de métriques** : rangée de réglage (05.2, 07.1) et rangée de référence (09.x) | filet sur l'élément contre filet sur `+`, corps 15 contre 14 px | **à arbitrer** |
| 8 | La vignette à glyphe s'appelle **`.ico`** au registre (§2.21), **`.lth`** dans les planches (04.1, 09.1, 09.2 — 28 emplois), et `.vig`/`.avat` seuls sont déclarés en §2.31 | mesuré | **à arbitrer** |
| 9 | **28 composants sans règle**, dont `.warn` (12 planches), `.lab` (11), `.tid` (8), `.btn-full` (8, en tension avec §2.29), `.note` (7), `.fab` (5), `.sort`, `.cnt`, `.at2` | relevé automatique | ouvert |
| 10 | **02.1 « Connexion », validée, n'a jamais été réalignée** — seule planche hors canon sur `.btn`, `.field`, `.field .ph`, `.lab`, `.note` | 5 divergences isolées | ouvert |
| 11 | **Capitales dans 18 planches sur 21** (`.lab`, `.sh`, `.abs .at`, `.tree .yn`, `th`) alors que le brief les interdit — et le registre ne dit rien, ni pour ni contre | mesuré | **à trancher** |
| 12 | **Cibles sous 48 px** : `.chip` 40 px (6 planches), `.sort` 44 px (5), `.sgrp .chip` 44 px (5) ; le registre ne déclare 44 px que pour `.rbtn` | mesuré | **à trancher** |
| 13 | **Rayons hors échelle** : 9 px, 3 px, 11 px — et le readme (2/4/8) contredit le registre (6 px pour toute vignette) | mesuré | **à trancher** |
| 14 | Divergences résiduelles de rôle : `.note` (3 formes), `.hero` (3), `.more .mo` (3), `.idh` (voile blanc en 04.4), `.pick`, `.lfoot`, `.bhead`, `.ev` | 17 rôles hors `.st-*` | ouvert |

### 3.4 Ce qui a été corrigé le 05/08, et ce que ça change au rendu

Les quatre premiers écarts n'ont **qu'une cause** : le trio a été dessiné depuis une copie du socle
antérieure aux corrections du 04–05/08. Correction appliquée aux trois planches, mesurée au
navigateur, avant et après :

| Rôle | Avant | Après | Fondement |
| --- | --- | --- | --- |
| `.seek` | `0 px` en tête (09.2, 09.3) | **12 px**, symétrique | §2.37 |
| `.ch h3` | 17 px / 600 / Archivo | **13 px / 500 / Inter** | §2.6 rang 4 |
| `.warn` | 12,5 px · 18 px · gap 9 | **12 px · 17 px · gap 10** | §2.6 · §2.26 |
| `.arow` | `padding: 6px 0` | **`padding: var(--rowy) 0`** | §2.16 |

**DOM strictement identique** dans les trois planches (618 · 429 · 453 éléments) : aucune
structure touchée. Les hauteurs de téléphone bougent de **−15 à +33 px** — les titres de carte
rétrécissent, les rangées retrouvent leur gouttière : deux corrections de sens opposé, comme la
passe de densité du 04/08.

### 3.5 Ce qui n'a pas été touché, et la question exacte à trancher

1. **`.hact` sur carte claire.** Le renommage en `.cact` est mécanique ; son **attache** ne l'est
   pas. Le `.cact` canonique (02.2) ne porte ni filet ni marge, et le trio en a besoin sous son
   `.warn`. *Question : le bloc de gestes sur carte porte-t-il un filet, et sous quel nom ?*
2. **`.ch`, deux composants.** *Question : lequel des deux garde le nom ?* Le micro-libellé en
   capitales est le plus facile à renommer (5 planches, un seul emploi chacune).
3. **`.arow`, deux métriques.** La gouttière est unifiée. *Question : le filet se porte-t-il sur
   l'élément (05.2, 07.1) ou sur `+` (09.x), et le titre de rangée est-il au rang 2 (15 px) ou au
   rang 3 (14 px) ?*
4. **La vignette à glyphe.** *Question : `.ico` du registre ou `.lth` des planches ?* Le perdant
   se dépose le jour même.

---

## 4 · Couverture fonctionnelle

### 4.1 Les vues de l'application face aux planches

| Vue | Planche | État |
| --- | --- | --- |
| `dashboard` · `equipment` · `equipment_details` · `users` · `user_details` | 03.1 · 04.1 · 04.2 · 05.1 · 05.2 | couvert |
| `add/edit/import_equipment` · `add_user` · `import_users` | 04.3 · 05.3 | couvert |
| `assignment_wizard` · `return_wizard` | 06.1 · 06.2 · 06.3 | couvert |
| `locations` · `rbac` · `management` · `add_category` · `category_details` | 09.2 · 09.3 · 09.1 | couvert, non validé |
| `model_details` · `add_model` · `import_models` · `import_locations` | — | **partiel** : 09.1 montre les modèles sous un type, aucune fiche, aucun import |
| `settings` | ligne de renvoi en 07.1 | **partiel** |
| `new_request` — demander un équipement | — | **manquant**, alors que trois planches livrées y mènent |
| `approvals` | — | exclu volontairement |
| `audit` · `audit_details` | — | exclu (déjà basculé dans le code) |
| `finance` · `reports` | — | non designés |
| `not_found` · accès refusé | — | non designés |
| **Tâches** (03.3) | 3 planches y mènent | **l'inverse** : designé, **absent du code** |

### 4.2 Le décalage qui commande tous les autres

La barre du bas dessinée est **Accueil · Actifs · Tâches · Équipe · Plus**. Celle du code est
**dashboard · equipment · approvals · users · more**. **« Tâches » n'existe pas comme `ViewType`**
— et c'est la destination unique des liens du tableau de bord et de la moitié des flux dessinés.
Les planches pointent vers un écran qui n'est pas implémenté ; l'onglet qu'elles ont retiré
(Approbations) est celui qui est en ligne.

### 4.3 États

| État | Couverture |
| --- | --- |
| Vide / absence | **14 / 21** — bien traité, et parfois sujet à part entière (09.1, 09.2) |
| Erreur, refus, saisie invalide | **3 / 21** (02.2, 06.2, 04.4) |
| **Chargement** | **0 / 21** |
| **Hors ligne** | **0 / 21** |
| Régimes de volume | 6 / 21, et bien faits là où ils sont faits |

### 4.4 Responsive

**Aucune variante.** Vingt planches déclarent `width: 393px`, **zéro `@media`**, aucune colonne
tablette ou bureau. Le produit, lui, a trois régimes (`NavigationBar` · `NavigationRail` ·
`Sidebar`). Le design system ne dit donc rien de ce que devient une carte, une feuille montante ou
un héro au-delà de 600 px : l'implémentation tranchera seule, et elle tranchera sans nous.

---

## 5 · Ce qu'il faut dessiner, par ordre

| Rang | Chantier | Pourquoi il tient ce rang |
| --- | --- | --- |
| **1** | **Demander un équipement** (`new_request`) | Seul acte atteignable depuis **trois planches livrées** et dessiné nulle part. Le code de cet écran porte en plus deux défauts relevés le 05/08 (`type:'Headset'` contre `Headphones`) : il est à reprendre de toute façon. |
| **2** | **Paramètres** | 07.1 a tranché sa section Sécurité — une ligne de renvoi ; le reste de l'écran n'a jamais été instruit, et c'est la porte de « Plus ». |
| **3** | **Fiche de modèle et imports du référentiel** | 09.1 s'arrête au type ; `ModelDetailsPage` et les imports (modèles, emplacements) restent sans vue de référence alors que 04.3 en fait déjà une. |
| **4** | **Les états transverses** — chargement, hors ligne, erreur de sauvegarde, page introuvable, accès refusé | Une planche, pas cinq : un gabarit par forme (page, carte, feuille). C'est le **seul manque à zéro** du projet. |
| **5** | **Au-delà de 393 px** | Une planche « ce que devient l'écran à 768 et 1280 » pour les trois gabarits : liste, fiche, feuille. |
| 6 | Finances · Rapports | Aucune dépendance, aucune demande. |

## 6 · Ce qu'il faut formaliser, par ordre

| Rang | Objet | Geste |
| --- | --- | --- |
| **1** | ~~Réaligner le trio 09.x~~ | **fait le 05/08** — quatre corrections, une cause |
| **2** | **Le gabarit de liste** — `.seek` · `.cnt` · `.sort` · `.chips`/`.chip` · `.fh` · `.lrow` · `.lth` · `.lfoot` | Partagé par **cinq planches** (04.1, 05.1, 09.1, 09.2, 09.3), et seuls `.fh` et `.seek` sont déclarés. C'est le patron le plus réemployé du projet et le moins écrit. |
| **3** | **Les quatre arbitrages de §3.5** | Chacun tient en une question fermée ; trois sont des renommages mécaniques une fois la réponse donnée. |
| **4** | **Les 28 composants sans règle**, à commencer par `.warn`, `.lab`, `.note`, `.tid` | Trois des quatre divergeaient déjà : c'est la mesure de ce que coûte l'absence de déclaration. |
| **5** | **Les deux interdits du brief qui ne sont pas tenus** — capitales (18/21), cibles 40/44 px (6 planches) | Soit la règle vaut et il faut corriger, soit elle admet une exception nommée. Aujourd'hui les deux documents se contredisent en silence. |

---

> **La leçon de méthode du jour, inscrite au registre (emploi n°14).** §2.37 a été écrite pendant
> que 09.2 et 09.3 se dessinaient depuis un socle copié **avant** elle. Aucun contrôle ne pouvait
> le voir : ils comparent les planches **entre elles**, et les deux nouvelles étaient d'accord.
> **Une planche neuve se compare au registre, pas à sa sœur** — et une règle écrite aujourd'hui ne
> protège pas ce qui a été copié hier.
