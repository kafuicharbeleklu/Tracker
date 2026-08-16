# État des lieux — 01/08/2026

Clôture de la Passe 3, arbitrages en attente, et bilan du plan `PASSATION.md` §14.

---

## 1 · `.thumb` / `.ico` / `.av` / `.si .ic` — la question était périmée

**Aucun des quatre n'existe dans une planche de travail.** Je les avais listés « ouverts » en fin
de Passe 3 sur la foi de mes propres notes de Passe 2 — sans revérifier. C'est exactement le
réflexe que la Passe 3 reproche au registre déclaratif, commis dans le rapport qui le dénonce.

Où ils survivent, et pourquoi c'est légitime :

| Nom | Fichiers | Statut |
| --- | --- | --- |
| `.av` | `screens/actuel/login.html`, `dashboard.html` | **réplique de l'existant** — hors canon (§2.30) |
| `.thumb` · `.av` | `screens/archive/` (8 fichiers) | pistes abandonnées, sans `@dsCard`, hors volet |
| `.ico` · `.si .ic` | — | n'existent plus nulle part |

**Ce qui coexiste réellement dans les planches**, après relevé exhaustif :

| Nom | Planches | Valeurs | Usages |
| --- | --- | --- | --- |
| **`.vig`** | 13 | 40 × 40, rayon 6, `--inset` / `--ink2`, Archivo 600 15 px | 88 |
| **`.avat`** | 2 (03.1, 03.2) | 44 × 44, **cercle**, `--dark` / `#fff` | 7 |
| `.vig.sm` | 1 (04.2) | 36 × 36, rayon 4 | 3 |

### Ce que je propose, et pourquoi

**Garder deux noms — `.vig` et `.avat` — parce que la distinction est réelle et porte un sens.**
Le carré est le **sujet d'une ligne** : une personne ou un objet, dans une liste. Le rond est
**vous**, le compte connecté, dans la barre du haut, et nulle part ailleurs. C'est la seule
distinction de forme du système, et elle dit *« celui-là, c'est celui qui regarde »*. Les fondre
ferait perdre l'information ; les laisser sans règle laissait la porte à un troisième.
→ Écrit en **§2.31**, avec les deux jeux de valeurs.

**Un défaut trouvé en le vérifiant, corrigé :** `.avat` portait **13 px en 03.2 et 15 px en 03.1**.
Même composant, deux tailles de texte. Unifié sur 15.

### Deux points que je n'ai pas tranchés seul

- **`.vig.sm`** — 36 px, rayon 4, dans 04.2 seulement, toujours pour une ligne de document. C'est
  une **densité locale** inventée pour un cas, sans règle au registre. Deux issues : la déclarer
  comme variante légitime (les pièces jointes sont secondaires, elles ont droit à moins de place),
  ou la supprimer et remettre `.vig` à 40. Je penche pour **supprimer** — trois occurrences dans
  une planche ne justifient pas une seconde taille de vignette dans le système.
- **Les émojis de `login-piste`** — les quatre comptes de démonstration sont des `.vig` contenant
  🙂 😮 😌 😄. C'est une reprise fidèle de l'existant, mais dans une **piste**, pas dans une
  réplique. Soit c'est délibéré (on cite l'écran actuel), soit ce bloc doit passer aux initiales
  comme partout ailleurs.

---

## 2 · `.pick` et `.hint` — les deux rôles, avec leurs exemples

### `.pick` — deux composants sans rien en commun

| | Rôle A — **le choix fait** | Rôle B — **la barre d'action collante** |
| --- | --- | --- |
| Planches | 06.1, 04.3 | 05.1 |
| CSS | rangée à filet, rayon 4, `min-height:48px` | `position:sticky;bottom:0`, fond `--surface`, filet **en haut** |
| Contenu | `KD` · *Karim Diallo · Support · Bureau Paris* · **Changer** | un bouton : **Attribuer à Ethan Employé** |
| Ce que c'est | **un contrôle de formulaire** : l'entité retenue, et le moyen d'en changer | **un plancher d'écran** : le geste qui suit la sélection en cours |

Aucune propriété partagée, aucune des deux ne dérive de l'autre. Le nom colle au rôle A — *pick*,
ce qu'on a choisi. Le rôle B n'est pas un choix du tout : c'est là où le choix **aboutit**.

→ **Proposition : `.pick` reste au rôle A, le rôle B devient `.abar`** (barre d'action). Une seule
planche à renommer.

### `.hint` — deux notes, deux voix

| | Rôle A — **pied de liste** | Rôle B — **note de champ** |
| --- | --- | --- |
| Planches | 04.1, 05.1 | 07.1 |
| CSS | **centré**, `--ink3`, `tabular-nums` | **aligné à gauche**, `--ink2`, variantes `b` et `.bad` |
| Exemple | *« 11 sur 800 · sur un annuaire de cette taille, la recherche est le seul chemin. »* | *« **Solide.** 12 caractères minimum ; une phrase vaut mieux qu'un mot compliqué. »* |
| Ce que c'est | **le commentaire de la liste sur elle-même** — un compte, une conséquence de volume | **l'aide d'un champ** — ce qu'il faut savoir avant de saisir |

La différence n'est pas cosmétique : l'une **est centrée sous une liste et compte**, l'autre
**suit un champ et conseille**, avec un état d'erreur. Deux voix différentes du produit.

→ **Proposition : le rôle A devient `.lfoot`, `.hint` reste la note de champ** — c'est le sens
courant du mot, et c'est le rôle qui a des variantes (`b`, `.bad`), donc le plus coûteux à
renommer.

**Les deux renommages sont mécaniques** (une planche chacun pour `.pick`, deux pour `.hint`) et je
ne les applique pas sans votre accord : ce sont des décisions de nomenclature, pas des correctifs.

---

## 3 · Passe 3 — clôture

**La Passe 3 est terminée.** `REGLES-TRANSVERSES.md` est à jour, y compris les deux ajouts faits
après le premier envoi du rapport :

| Ajout | Où |
| --- | --- |
| Tracé SVG canonique de `i-filter` (la cause du faux positif) | §2.24 |
| Sprite — un identifiant, un tracé ; table des 6 familles et des 3 arbitrages | §2.28 |
| Distribution / surface — aucune classe `.btn-*` ne porte `flex` | §2.29 + emploi n°11 |
| `.hact.row` = direction · `.hact.bare` = attache · `.acts` détruit | §2.29 |
| **`.hact.row.lead`** — un geste et un désistement | §2.29 |
| **Paire de 04.2 maintenue empilée** — 190 px demandés pour 156 disponibles | §2.29 |
| Exceptions déclarées — recherche sur Tâches, métrique de planche, réplique 03.1 | §2.30 |
| **`.vig` / `.avat`** — deux formes, deux sens | §2.31 |
| Emploi n°10 — comparer les tracés, pas les noms | §1 |
| `.tbar` (6→1), `.field` (4→1), `.frow`, `.vb`, et 9 composants réalignés | journal |

**11 lignes de journal** portent la date du 01/08. Les deux contrôles nouveaux (n°10 sprite,
n°11 distribution) tournent propre sur les seize planches.

---

## 4 · Bilan du plan `PASSATION.md` §14.1

### Ce qui est fait

| | Chantier | Livré |
| --- | --- | --- |
| §14 | **Tâches** — la file, 3 filtres, 3 volumes | `03.3` |
| §14.1 · 1 | **Mon compte** — mot de passe, 2FA, sessions | `07.1` |
| §14.1 · 2 | **Déclarer un incident** — la feuille | `04.3` (+ le signalement en `06.3`) |
| §14.1 · 4 | **Passe de densité** planches 4 et 8 | faite |

### Ce qui reste — et la distinction que vous demandez

**Chantiers de dessin pur** — il faut inventer un écran qui n'existe pas encore :

| Priorité | Chantier | Pourquoi il tient |
| --- | --- | --- |
| **1** | **Première connexion** — accepter l'invitation, définir son code (planche 14, étape 2) | §14.1 · 3, jamais commencé. C'est le **seul trou dans un parcours déjà dessiné** : `05.3` sait inviter, `07.1` sait gérer son compte, et entre les deux il n'y a rien. Un compte invité ne peut pas devenir un compte actif. |
| **2** | **La suite de l'incident** — prise en charge → réparation → retour | §14.1 · 2 n'est fait **qu'à moitié** : on sait déclarer, on ne sait pas ce qui arrive ensuite. C'est le maillon que la passation appelait *« le seul du produit qui manque encore »*, et il manque toujours. |
| **3** | **Catalogue** (catégories, modèles) | Le seul des sept écrans sans chantier qui **bloque un écran déjà dessiné** : `04.3` fait saisir une catégorie que rien ne définit. |
| **4** | Emplacements · Paramètres · Rôles | Nommés dans `AUDIT-UI.md` comme cibles suivantes. Autonomes — aucun écran livré ne les attend. |
| **5** | Finances · Rapports · Audit | Aucune demande, aucune dépendance. À ouvrir seulement si le besoin se déclare. |

**Chantiers de cohérence transverse** — l'état est bon, et c'est mesurable :

- **31 rôles** comparés texte contre texte entre planches : **zéro divergence**.
- **Sprite** : 20 identifiants unifiés, **un tracé par nom**.
- **11 contrôles** dont 2 nés de la Passe 3, tous verts.
- **Trois angles morts méthodologiques** trouvés et refermés en trois passes : jetons hors `:root`,
  propriétés absentes non comparées, tracés non lus.

**Ce qui reste ouvert en transverse tient en une page** : les deux renommages du §2 ci-dessus, la
vignette `.sm`, les émojis de `login-piste`, et les cinq points de la Passe 2 (§4.1–4.3,
catégories A/B) — tous des **décisions**, aucun un défaut.

> **La bascule est franchie.** Les trois premières passes ont trouvé, à chaque fois, une classe
> entière de défauts qu'aucun contrôle ne regardait. La Passe 3 n'a plus trouvé de mécanisme
> nouveau — seulement des applications des deux qu'elle venait d'écrire. **Le prochain effort utile
> est du dessin, pas de l'audit** : première connexion, puis la suite de l'incident.
</content>
<asset>État des lieux 01/08</asset>
