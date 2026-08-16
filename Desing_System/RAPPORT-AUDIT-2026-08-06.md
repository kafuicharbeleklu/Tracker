# RAPPORT-AUDIT — 2026-08-06

Balayage complet, **mesuré sur les vingt-cinq planches du projet et sur le dépôt**, pas sur les
rapports antérieurs. Trois volets demandés : la revue du projet, la revue du design system, la
couverture fonctionnelle — puis les recommandations.

> **Le résultat en une ligne.** La journée du 06/08 a fait basculer le rapport de force : le
> registre a rattrapé son retard — **28 rôles déclarés, 7 arbitrages rendus, 2 interdits du brief
> tranchés, la loi du delà de 393 px écrite** — et c'est maintenant **le dessin qui est en
> retard sur le registre**. Vingt rôles portent encore plus d'une déclaration alors que le texte
> canonique de chacun est écrit et nomme les planches à aligner. Deux autres choses ont changé
> de camp : la barre du bas du produit **est** désormais celle des planches (`tasks` existe), et
> **une planche neuve, 14.1 Paramètres, n'est inscrite nulle part** — ni au readme, ni au
> tableau d'état, ni au manifeste.

---

## 1 · Ce qui a été mesuré, et comment

| Objet | Méthode | Volume |
| --- | --- | --- |
| Jetons | déclarations `:root`, comparées nom par nom | 36 noms × 25 planches |
| Composants | toutes les règles CSS, comparées **déclaration contre déclaration** après normalisation | 1 057 sélecteurs, 279 partagés par ≥ 3 planches |
| Registre | rôles à sélecteur simple confrontés au texte de `REGLES-TRANSVERSES.md` | 103 rôles |
| Interdits du brief | capitales, rayons, graisses, cibles, émojis — comptés dans la source | 25 planches |
| États | erreur / chargement / hors ligne, relevés au mot dans le rendu | 25 planches |
| Couverture | `ViewType` du dépôt (`useAppNavigation.ts`) et `bottomNavViews` confrontés aux planches | 31 vues |

**Ce que la méthode ne voit pas** : elle compare des déclarations, pas des intentions. Deux
planches d'accord sur une valeur fausse restent invisibles — c'est la limite inscrite au registre
le 05/08. Le relevé des états est un relevé de **mots**, donc une borne haute.

---

## 2 · Revue du projet — les planches

**25 pistes de travail** (une de plus que le manifeste), 15 répliques de référence figées
(groupe 01), 11 pistes archivées, 13 documents normatifs à la racine.

Colonne **dessin** : *finalisé* = validé par l'utilisateur ; *en cours* = piste livrée, en attente
de validation ; *brouillon* = livrée mais non inscrite aux documents.
Colonne **produit** : ce qui est effectivement porté dans le code.

| N° | Planche | Fonction de l'application | Dessin | Produit |
| --- | --- | --- | --- | --- |
| 02.1 | Connexion | `LoginPage` | **finalisé** (26/07) | non portée |
| 02.2 | Première connexion | `ChangePasswordPage` + invitation | en cours (02/08) | non portée |
| 03.1 | Tableau de bord | `DashboardPage` | **finalisé** (28/07) | non portée |
| 03.2 | « À traiter » — ligne, bouton, seuil | bloc du tableau de bord | en cours (31/07) | non portée |
| 03.3 | Tâches — la file | `tasks` | en cours (31/07) | **vue créée** (06/08) — manquent *code PIN* et *réparations* |
| 04.1 | Liste équipements | `InventoryPage` | **finalisé** (29/07) | non portée |
| 04.2 | Détail équipement | `EquipmentDetailsPage` | **finalisé** (29/07) | non portée |
| 04.3 | Créer, corriger, sortir | `Add`/`Edit`/`ImportEquipmentPage` | en cours (30/07) | non portée |
| 04.4 | La suite de l'incident | **aucune vue** | en cours (02/08) | non portée |
| 05.1 | Liste utilisateurs | `UsersPage` | **finalisé** (30/07) | non portée |
| 05.2 | Détail utilisateur | `UserDetailsPage` | en cours (30/07) | non portée |
| 05.3 | Créer un compte | `AddUserPage` + `ImportUsersPage` | en cours (30/07) | non portée |
| 05.4 | Administrer un compte | actes de `UserDetailsPage` | en cours (31/07) | non portée |
| 06.1 | Le parcours complet | `AssignmentWizard` · `ReturnWizard` | en cours (30/07) | non portée |
| 06.2 | La preuve | étape des deux wizards | en cours (31/07) | non portée |
| 06.3 | Fins de flux | clôtures | en cours (31/07) | non portée |
| 06.4 | Demander un équipement | `NewRequestPage` | en cours (05/08) | **appliquée** (06/08) |
| 07.1 | Mon compte | **pas de vue** (partiel dans `SettingsPage`) | en cours (31/07) | non portée |
| 08 | Lexique — un mot par acte | documentation | **finalisé** (31/07) | s.o. |
| 09.1 | Catalogue | `ManagementPage` · `AddCategory` · `CategoryDetails` | en cours (05/08) | **partielle** — `assignable`, libellés |
| 10.1 | Emplacements | `LocationsPage` | en cours (05/08) | non portée |
| 11.1 | Rôles et permissions | `RbacPage` | en cours (05/08) | non portée |
| 12.1 | Les états transverses | transverse | en cours (06/08) | **partielle** — restent refus en rangée, hors ligne |
| 13.1 | Les trois régimes | transverse (`NavigationBar`/`Rail`/`Sidebar`) | en cours (06/08) | non portée |
| 14.1 | Paramètres | `SettingsPage` | **brouillon** (06/08) | non portée |

**Ce que ce tableau dit** : sur 25 planches, **6 sont validées**, 18 sont livrées et attendent un
verdict, 1 n'est pas inscrite. Côté produit, **21 planches sur 25 ne sont pas portées** — l'écart
de temps entre le dessin et le code est aujourd'hui le plus gros risque du chantier, devant
n'importe quel écart de style : une planche non portée vieillit, et le code décide à sa place.

---

## 3 · Revue du design system

### 3.1 Ce qui tient — mesuré

| Contrôle | Résultat |
| --- | --- |
| Valeurs de jetons | **0 divergence** sur 36 noms × 25 planches |
| Registre | **99 rôles sur 103** déclarés — contre 75 sur 103 le 05/08 |
| Familles de statut | `--live-*` sur surface inversée, `--st-*` sur surface claire, sans exception |
| Densité | `--rowy`, `--pad`, `--gap`, `--btnh` employés partout ; plus une seule gouttière en dur |
| `.arow` | **métriques convergées** : 56 px et `var(--rowy)` sur les 6 planches — l'arbitrage du 05/08 est appliqué |
| Émojis · points d'exclamation | **0** sur 25 planches |

### 3.2 Inventaire

**Jetons (36).** Surfaces `--canvas` `--surface` `--inset` · encres `--ink` `--ink2` `--ink3` ·
filets `--line` `--line-strong` `--dark-line` · marque `--brand` `--nav-on` · inversé `--dark`
`--dark-2` `--on-dark` `--on-dark-2` · statut en deux familles · `--danger` · densité `--gap`
`--pad` `--rowy` `--btnh` et leurs trois crans · boutons `--btn-y-bg` `--btn-y-fg`.

**Typographie.** Inter (corps) et Archivo (identité), cinq marches plus un rang de contrôle.
Graisses déclarées : **400 (63) · 500 (483) · 600 (134)**.

**Rayons.** 4 px (158) · 8 px (89) · 6 px (57) · 2 px (43) · 50 % (20). **Hors échelle : 9 px (4),
3 px (4), 11 px (1).**

**Composants.** 1 057 sélecteurs déclarés, dont **279 partagés par au moins trois planches**.
**67 portent plus d'une forme.** Répartition :

| Nature | Nombre | Jugement |
| --- | --- | --- |
| Chrome de planche — `.phone` (11 formes), `.colnote` (6), `.page` (5), `.wrap` (4), `.intro`, `.col`, `.band`, `body`, les 4 règles de réglage | **12** | **sans propriétaire** : ce n'est pas du produit, et rien ne le déclare |
| Familles de statut `.st-a` `.st-v` `.st-o` `.st-b` | 4 | **légitime** — elles doivent diverger par surface |
| Rôles produits à sélecteur simple | **21** | à aligner — le registre nomme déjà le texte canonique |
| Sélecteurs composés (`.ch h3`, `.at2 .t`, `.tid .code`, `.opt .s`…) | 30 | suivent leur parent |

### 3.3 Les écarts, avec leur preuve

| # | Écart | Preuve mesurée | État |
| --- | --- | --- | --- |
| **1** | **14.1 Paramètres n'était inscrite dans aucun document.** La planche est livrée, porte `@dsCard group="14. Paramètres"` ; le readme la donnait « à faire » et sa section manquait à la table de rangement | fichier `screens/parametres-piste.html`, absent des 24 cartes du manifeste | **corrigé le 06/08** — readme à jour ; le manifeste se régénère au tour suivant |
| **2** | **02.1 Connexion, validée le 26/07, n'a toujours pas été réalignée.** Seule planche hors canon, sur cinq rôles | `.btn` (pas de `display:flex`, pas de centrage), `.field` (`background` + `height` au lieu de `min-height` + `margin-bottom:18px`), `.lab` (`display:block`), `.note` (largeur 393 en dur), `.field .ph` | **ouvert depuis le 05/08** |
| **3** | **`.note` porte deux composants.** La note de bloc (8 planches, texte canonique au registre) et un encart bordé de 44 px de haut en 04.3 / 04.4 | `border:1px solid var(--line);min-height:44px;padding:11px 12px` contre `font-size:12px;margin-top:7px` | **nommé au registre, non appliqué** (§2.42 : « 3 planches à aligner ») |
| **4** | **`.ch` porte trois formes.** L'en-tête de carte à ligne de base et compte à droite (7 planches) ; la variante centrée sans marge (03.1, 04.2) ; la même **avec** `margin-bottom:4px` (03.2, 05.2) | `align-items:baseline;justify-content:space-between;gap:12px` contre `align-items:center;gap:10px` (± marge) | **arbitrage rendu le 06/08, application partielle** |
| **5** | **`.at2` porte deux formes** alors que `.arow`, son parent, a convergé | `display:flex;flex-direction:column;gap:2px` (09.1, 10.1, 11.1, 14.1) contre `flex:1;min-width:0` seul (07.1, 05.2) | **ouvert** |
| **6** | **`.hero` porte quatre formes** — trois ne diffèrent que par `isolation` / `overflow` / `position`, la quatrième par une image de fond | 03.2 porte `url(../uploads/footer-cartouche-bas-nl.webp)` ; 04.2 et 05.2 portent le contexte d'empilement ; 13.1 n'a ni l'un ni l'autre | **ouvert** |
| **7** | **Six rôles divergent par une seule déclaration** — le coût de la copie, pas d'un désaccord | `.prov` (filet et gouttière absents en 04.2 / 05.2) · `.lfoot` (`tabular-nums` en 04.1 / 05.1 seulement) · `.idh` (voile blanc en 04.4) · `.pick` (`padding:0 12px` en 04.3) · `.bst` (opacité .12 et graisse 500 en 04.4) · `.idt` (`padding-top` 1 contre 2) | **ouvert** |
| **8** | **Le chrome de planche n'a pas de propriétaire.** `.phone` existe en **onze formes**, `.colnote` en six, `.page` en cinq. Aucune n'est déclarée nulle part, et `.col` / `.sprite` / `.idhead` / `.idt` sont les **quatre seuls rôles ≥ 3 planches absents du registre** | relevé automatique sur 25 planches | **ouvert, jamais instruit** |
| **9** | **Trois rayons hors échelle subsistent** — 9 px (4 emplois), 3 px (4), 11 px (1) — et le readme (2/4/8) contredit toujours le registre (6 px pour les vignettes) | relevé | **à trancher** |
| **10** | **Trois graisses, pas deux.** Le brief en autorise deux par écran ; le relevé donne 400 · 500 · 600, le 600 étant l'identité Archivo | 63 · 483 · 134 déclarations | **à confirmer contre le brief** |
| **11** | **Les capitales sont admises pour le seul micro-libellé (§2.41) — la conformité n'est pas vérifiée.** 22 planches sur 25 portent au moins un `text-transform:uppercase` ; 02.2, 03.2, 04.4 et login-2 en portent trois ou quatre | relevé | **règle écrite, contrôle à faire** |
| **12** | **Les cibles à 40 / 44 px ne sont plus un écart de dessin, mais une dette de portage (§2.41).** La zone de frappe à 48 px doit être ajoutée au code ; aucune planche ne la note | `.chip` 40 px dans 6 planches, `.sort` / `.cnt` / `.rrow` / `.cp` 44 px dans une douzaine | **transféré au portage** |
| **13** | **`PASSATION.md` s'arrêtait au 31/07.** Six jours de décisions — le trio 09/10/11, 12.1, 13.1, 14.1, et le début du portage — n'étaient journalisés que dans le registre et les rapports | dernière section : § 17, 31/07 | **corrigé le 06/08** — §18 à §23 |

---

## 4 · Couverture fonctionnelle

### 4.1 Les 31 vues du produit face aux planches

| Vue du code | Planche | État |
| --- | --- | --- |
| `dashboard` · `equipment` · `equipment_details` · `users` · `user_details` | 03.1 · 04.1 · 04.2 · 05.1 · 05.2 | couvert |
| `add_equipment` · `edit_equipment` · `import_equipment` | 04.3 | couvert |
| `add_user` · `edit_user` · `import_users` | 05.3 · 05.4 | couvert |
| `assignment_wizard` · `return_wizard` | 06.1 · 06.2 · 06.3 | couvert |
| `new_request` | 06.4 | couvert, **porté** |
| `tasks` | 03.3 | couvert, **porté** — 2 natures manquantes |
| `management` · `add_category` · `category_details` | 09.1 | couvert |
| `locations` · `rbac` | 10.1 · 11.1 | couvert |
| `settings` | 14.1 | couvert, non inscrit |
| `not_found` | 12.1 | couvert, **porté** |
| `model_details` · `add_model` · `import_models` · `import_locations` | — | **manquant** — 09.1 s'arrête au type, aucune fiche de modèle, aucun import du référentiel |
| `finance` · `reports` | — | **manquant** — jamais instruit |
| `approvals` | — | exclu volontairement, **mais à réinstruire** : la barre du bas replie désormais `approvals`, `new_request` et `tasks` sous l'onglet « Tâches » (`NavigationBar.tsx:111`) |
| `audit` · `audit_details` | — | exclu — déjà basculé dans le code, sert de référence |

**Couverture : 22 vues sur 31 dessinées, 6 manquantes, 3 exclues par décision.**

**Dessiné sans vue dans le code** : 07.1 *Mon compte* (aucun `ViewType`, un fragment dans
`SettingsPage`) et 04.4 *La suite de l'incident*. C'était aussi le cas de 03.3 jusqu'au 06/08 ;
le portage a résolu ce décalage-là.

### 4.2 Le décalage qui commandait tout est résorbé

Le rapport du 05/08 relevait que la barre du bas dessinée — Accueil · Actifs · Tâches · Équipe ·
Plus — pointait vers un écran inexistant. Le code porte désormais `tasks` comme `ViewType`,
comme destination de la barre et du rail, et `DESTINATIONS.tasks` existe. **Les planches et le
produit racontent la même navigation.** Reste un point de lexique : « Approbations » est devenu
« Demandes » dans le produit **avant** d'être inscrit au lexique.

### 4.3 États

| État | Couverture | Commentaire |
| --- | --- | --- |
| Vide / absence | large, et sujet à part entière en 09.1, 10.1, 12.1 | traité |
| Erreur, refus, saisie invalide | **13 planches sur 25** | la règle est écrite (§2.39) ; les planches antérieures ne l'ont pas rétro-appliquée |
| Chargement | **6 sur 25** — 12.1 en fait le gabarit (`.sk`) | passé de 0 à 6 le 06/08 |
| Hors ligne | **1 sur 25** — 12.1 seule | proposition, non portée |
| Geste en cours (`.btn.busy`) | 12.1 seule | à réemployer dans les wizards |

### 4.4 Responsive

**Toujours zéro `@media` sur 25 planches** — mais ce n'est plus le bon indicateur. **13.1 écrit la
loi du delà de 393 px** (§2.43) : trois régimes, une largeur de lecture unique à 960 px, colonnes
déduites du contenu, feuille montante qui devient dialogue. Ce qui manque désormais n'est plus la
doctrine mais son **application** : 13.1 la démontre sur la liste, la fiche et la feuille ; le
tableau de bord, les wizards et les formulaires plein écran n'ont pas encore leur version au-delà
du téléphone.

---

## 5 · La liste des écarts, en clair

**Bloquants pour le portage**

1. 21 planches sur 25 ne sont pas portées ; le code décide seul pendant ce temps.
2. Les quatre vues du référentiel — fiche de modèle, ajout de modèle, import de modèles, import
   d'emplacements — n'ont aucune vue de référence.
3. `finance` et `reports` : deux destinations de la barre latérale jamais instruites.
4. La zone de frappe à 48 px (§2.41) doit être ajoutée au code ; aucune planche ne la porte.

**Incohérences de design system**

5. 20 rôles produits portent plus d'une déclaration, alors que le registre écrit déjà le texte
   canonique de chacun et **nomme les planches à aligner**. Une passe d'application, pas une
   décision.
6. 02.1 Connexion, validée, reste hors canon sur cinq rôles.
7. `.note` et `.ch` portent chacun deux composants distincts sous un seul nom.
8. Le chrome de planche (`.phone`, `.wrap`, `.page`, `.colnote`) n'appartient à personne et
   dérive : jusqu'à onze formes pour un seul rôle.
9. Trois rayons hors échelle, et un readme qui contredit le registre sur l'échelle elle-même.

**Dette documentaire**

10. ~~14.1 Paramètres n'est ni au readme, ni au tableau d'état, ni à la table de rangement.~~ **corrigé le 06/08**
11. ~~`PASSATION.md` s'arrête au 31/07.~~ **corrigé le 06/08** — §18 à §23
12. « Approbations → Demandes » appliqué au produit avant inscription au lexique.

**Manques d'états et de variantes**

13. Erreur : 13 planches sur 25. Hors ligne : 1 sur 25.
14. Au-delà de 393 px : doctrine écrite, appliquée à trois gabarits sur les huit du projet.

---

## 6 · Ce qu'il faut dessiner, par ordre

| Rang | Chantier | Pourquoi ce rang |
| --- | --- | --- |
| **1** | **Fiche de modèle et imports du référentiel** — `model_details`, `add_model`, `import_models`, `import_locations` | Quatre vues, aucune référence, et 09.1 s'arrête au type en les annonçant. 04.3 a déjà fait le patron d'import : c'est du réemploi, pas de l'invention. |
| **2** | **Les régimes appliqués aux gabarits restants** — tableau de bord, wizard, formulaire plein écran | 13.1 a écrit la loi et l'a montrée sur trois gabarits. Les cinq autres sont le seul endroit où l'implémentation tranchera encore seule. |
| **3** | **Approbations — l'instruire, ou acter sa disparition** | Le produit a replié `approvals` sous l'onglet « Tâches » ; « Approbations » est devenu « Demandes ». La planche exclue volontairement ne l'est plus pour la bonne raison. |
| **4** | **Les erreurs rétro-appliquées** aux planches antérieures à §2.39 | 12 planches livrées ne montrent aucun refus ni aucune saisie invalide, alors que la règle existe depuis le 31/07. |
| **5** | **Finances · Rapports** | Aucune dépendance, aucune demande — mais deux destinations en ligne, non dessinées. |

## 7 · Ce qu'il faut formaliser, par ordre

| Rang | Objet | Geste |
| --- | --- | --- |
| **1** | **La passe d'alignement des 20 rôles** | Le registre écrit déjà le texte canonique et nomme les planches. Aucune décision à prendre : appliquer, mesurer le DOM avant/après, inscrire. |
| **2** | **02.1 Connexion** | Cinq divergences mécaniques sur la plus ancienne planche validée du projet. |
| **3** | **Le chrome de planche** — `.phone` `.wrap` `.page` `.col` `.colnote` `.intro` `.sprite` | Un bloc de socle unique, copié verbatim, déclaré une fois au registre. C'est la moitié des divergences restantes et personne ne l'a jamais instruit. |
| **4** | **`.note` et `.ch`** | Un nom pour l'encart bordé de 04.3/04.4, un nom pour l'en-tête de carte centré. Deux renommages, deux lignes de registre. |
| **5** | **L'échelle des rayons** | Trancher entre le readme (2/4/8) et le registre (6 pour les vignettes), puis déposer 9, 3 et 11 px. |
| **6** | **Le contrôle des capitales** | §2.41 les admet pour `.lab` et `.sh` seuls. Vérifier les 22 planches et corriger ce qui n'est pas un micro-libellé. |

---

## 8 · La passe d'alignement — commencée le 06/08

**Cinq rôles fermés.** Rendu identique dans tous les cas, sauf mention.

| Rôle | Geste | Planches |
| --- | --- | --- |
| `.btn` · `.field` · `.field .ph` · `.lab` | déclarations canoniques ; la pleine largeur passe à `.btn-full` ; l'espacement des champs à un groupe `.fgrp` | 02.1 |
| `.note` de 02.1 | c'était de la **prose de planche**, pas une note de bloc : renommée `.intro` | 02.1 |
| `.at2` | `flex-direction:column;gap:2px` au lieu de `.at2>span{display:block}` + `margin-top` | 07.1 · 05.2 |
| `.bst` | opacité .10, `padding:0 9px`, encre `--on-dark` — la graisse 500 en trop tombe | 04.4 |
| `.idt` | `padding-top:1px` | 04.2 |
| `.lfoot` | `font-variant-numeric:tabular-nums` **ajouté au canon** : le pied de liste porte des comptes, deux planches l'avaient déjà | 06.4 · 09.1 · 10.1 · 12.1 · 13.1 · 14.1 · 11.1 |

**Quatre rôles ne sont pas des dérives — ce sont des variantes qui n'ont pas de nom.** Aucun ne
s'aligne sans décider d'abord, et chacun tient en une question fermée :

| Rôle | Ce que le second emploi est vraiment | Question |
| --- | --- | --- |
| `.prov` | la provenance **posée dans une carte** (04.2, 05.2), sans filet ni gouttière de page | garde-t-elle le nom, ou devient-elle `.prov.in` ? |
| `.idh` | le héro d'identité d'un **objet** (04.4) : voile blanc, pas le bleu réservé aux personnes | `.idh.obj`, ou deux rôles distincts ? |
| `.pick` | la rangée de choix **encore vide** (04.3) : `padding:0 12px`, contre `6px 12px` une fois remplie | `.pick` vide et `.pick.done` remplie, ou l'inverse ? |
| `.note` bordé | l'**encart de saisie libre** de 04.3 / 04.4, bordé, 44 px de haut | quel nom ? `.free` ? `.ntfield` ? |
| `.ch` centré | l'en-tête de carte **à glyphe** (03.1, 03.2, 04.2, 05.2), centré, sans compte à droite | lequel des deux garde `.ch` ?

**Reste après cette passe** : `.hero` (4 formes), `.arow` en lien contre en bloc, et les
sélecteurs composés qui suivront leur parent.

---

> **La leçon de méthode du jour.** Le 05/08, le dessin était en avance et le registre courait
> derrière : 28 rôles servaient sans être écrits. Le 06/08 a inversé la charge — le registre a
> tout déclaré, tranché sept arbitrages et deux interdits, et **nommé lui-même les planches à
> aligner**. Une règle écrite ne corrige rien tant que la passe d'application n'a pas eu lieu ;
> l'écart entre le texte et le dessin est désormais mesurable en une commande, et il vaut vingt
> rôles.
