# RECADRAGE — 2026-08-11

Réponse aux trois constats du 11/08 : **couverture incomplète**, **qualité insuffisante après la
connexion et le tableau de bord**, et **déficit d'iconographie**. Périmètre de tout ce document : **compact seulement**
(téléphone 393 px et tablette 600–840 px). Le desktop n'est pas traité.

Le codebase `TRACKER/` est repris comme **référence fonctionnelle** : pages, données, états,
comportements. Il n'est plus repris comme référence visuelle. Ce point n'était pas écrit ; il
l'est maintenant, en tête du registre.

**Quatre livrables :**

1. le tableau de couverture ci-dessous (§2) ;
2. l'audit iconographique (§3) ;
3. la direction esthétique — `screens/direction-compact-piste.html`, planche **01.1** ;
4. le backlog priorisé (§5).

---

## 1 · Ce qui a été mesuré, et pourquoi les planches se ressemblent

Le constat de qualité est vérifiable sans ouvrir un fichier. Quatre mesures sur les 26 planches :

| Mesure | Connexion · Tableau de bord | Les 24 autres |
| --- | --- | --- |
| Plafond typographique | **28 px** · **30–34 px** | **20–22 px sur 16 planches** |
| Fonds sombres `#0A191D` par planche | 1 · 6 | 1 à 3, souvent un bouton, jamais un héro |
| Appels au jaune de marque | 2 · 2 | **1 à 2** — et sur 9 planches, un seul |
| Animations (`@keyframes`) | 0 · 0 | **0 — sur les 26 fichiers** |
| Sprite d'icônes | recopié dans le fichier | **recopié dans les 28 fichiers** |

**Le diagnostic tient en une phrase : la modernité de la connexion et du tableau de bord ne venait
pas d'un goût, elle venait de quatre leviers — un palier typographique haut, une surface sombre qui
porte le sujet, un jaune réservé au geste, un mouvement. Sur les planches suivantes, ces quatre
leviers n'ont pas été tirés.** Le travail s'est déplacé vers la justesse fonctionnelle — quel mot,
quelle règle, quel état — et il est bon ; mais chaque écran a été *transposé* rôle par rôle depuis
le produit, jamais *redessiné*. Le résultat est correct, conforme au registre, et plat.

Trois symptômes récurrents, tous mesurables :

- **L'empilement de cartes blanches.** Onze cartes sur Paramètres, douze sur Mon compte, dix sur
  Catalogue. Une carte qui ne porte pas un sujet mais une liste de trois lignes est un conteneur
  gratuit : elle coûte un fond, un rayon, un retrait, et ne hiérarchise rien.
- **Trois poids pour tout.** 13 px demi-gras pour les titres, 13 px pour les valeurs, 12 px pour
  les sous-titres. À dix-sept informations par écran, l'œil n'a aucun point d'entrée.
- **La rangée à chevron comme réponse universelle.** 13 chevrons sur Paramètres, 10 sur Arbitrer,
  8 sur Demander. Le chevron dit « il y a autre chose ailleurs » ; répété, il dit « cet écran ne
  décide rien ».

Ce que ce recadrage **ne remet pas en cause** : la couverture fonctionnelle, le lexique, les six
chaînes de flux, les règles d'états et de clôtures, les arbitrages du registre. Tout cela reste.
C'est la couche de mise en forme qui est reprise.

---

## 2 · Tableau de couverture — 36 écrans, version compact

Statuts : **absente** · **répliquée** (dessinée, conforme, sans gain esthétique — plafond ≤ 22 px,
pas de héro, pas de geste coloré) · **modernisée** (les quatre leviers tirés).

| # | Écran du produit | Planche | Statut actuel | Action requise |
| --- | --- | --- | --- | --- |
| 33 | `LoginPage` | 02.1 | **modernisée** | aucune — référence |
| 34 | `ChangePasswordPage` | 02.2 | **modernisée** | aucune |
| 1 | `dashboard` | 03.1 · 03.2 | **modernisée** | régime tablette |
| 2 | `equipment` | 04.1 | **modernisée** | régime tablette |
| 4·5 | `add_equipment` · `edit_equipment` | 04.3 | **modernisée** | + scan SN, + erreurs de saisie |
| 6 | `import_equipment` | 04.3 | **modernisée** | aucune |
| 16·17 | `assignment_wizard` · `return_wizard` | 06.1 · 06.2 | **modernisée** | régime tablette |
| 21·22 | `add_model` · `model_details` | 09.2 | **modernisée** | aucune |
| 23·25 | `import_models` · `import_locations` | 09.2 | **modernisée** | aucune |
| 30·31 | `finance` · `reports` | 15.1 | **modernisée** | aucune |
| — | fragment « mon compte » | 07.1 | **modernisée** | aucune |
| 3 | `equipment_details` | 04.2 | **répliquée** | **refaire — gabarit porteur** |
| 13 | `tasks` | 03.3 | **répliquée** | **refaire — gabarit porteur** |
| 8 | `users` | 05.1 | **répliquée** | **refaire — gabarit porteur** |
| 9 | `user_details` | 05.2 | **répliquée** | refaire (hérite de 04.2) |
| 10·11·12 | `add_user` · `edit_user` · `import_users` | 05.3 | **répliquée** | passe légère — la feuille est bonne, l'échelle manque |
| — | actes sur un compte | 05.4 | **répliquée** | refaire (hérite de 05.2) |
| 18·19·20 | `management` · `add_category` · `category_details` | 09.1 | **répliquée** | refaire |
| 24 | `locations` | 10.1 | **répliquée** | refaire |
| 26 | `rbac` | 11.1 | **répliquée** | refaire |
| 27 | `settings` | 14.1 | **répliquée** | refaire — **démontrée en 01.1** |
| 14 | `approvals` | 06.5 | **répliquée** | refaire |
| 15 | `new_request` | 06.4 | **répliquée** | passe légère |
| — | clôtures des deux assistants | 06.3 | **répliquée** | passe légère + les 3 mouvements |
| — | suite de l'incident | 04.4 | **répliquée** | refaire |
| 32·35 | `not_found` · `AccessDeniedPage` | 12.1 | **répliquée** | passe légère |
| 7 | `equipment` *(pré-filtré)* | 04.1 | **absente** *(état non dessiné)* | à dessiner comme état de 04.1 |
| 28 | `audit` | — | **absente** *(exclue le 05/08)* | **exclusion à confirmer ou à lever** |
| 29 | `audit_details` | — | **absente** *(exclue le 05/08)* | idem |
| 36 | `DocumentationExplorerPage` | — | **absente** | décision : dessiner ou exclure |
| — | `DesignSystemGalleryPage` | — | hors périmètre (build DEV) | à acter, une ligne |

**Écrans transverses absents**, qui ne sont dans aucune planche et qui manquent partout :

| Objet | Où il manque | Action |
| --- | --- | --- |
| **Hors ligne** | absent du code *et* du dessin | à dessiner une fois, à appliquer partout |
| **Chargement par vue** | `Skeleton` existe, aucune règle | une règle, trois formes (liste, fiche, file) |
| **Scan** — SN et code-barres | le geste existe déjà dans le produit (facture) | à dessiner une fois, réemployé 3 fois |
| **Régime tablette 600–840** | 3 gabarits sur 8 | 5 gabarits restants |

**Bilan** : 11 planches modernisées couvrant **15 écrans** · 15 planches répliquées couvrant
**17 écrans** · **4 écrans absents** (dont 2 exclus par décision à réinstruire) + 4 objets
transverses. La couverture fonctionnelle n'est donc pas le problème principal : **c'est le niveau
de 17 écrans sur 32 dessinés.**

---

## 3 · Audit iconographique

### 3.1 Le constat est juste, mais la cause n'est pas celle qu'on croit

**Un set existe déjà, et il est fourni** : **73 symboles distincts**, **1 001 emplois** répartis sur
les 28 planches, un sprite `<symbol>` dans **chaque** fichier. Le déficit ne vient donc pas d'un
manque de dessins. Il vient de **quatre choses qui n'ont jamais été gouvernées** :

| # | Défaut mesuré | Mesure | Conséquence |
| --- | --- | --- | --- |
| 1 | **Aucune source unique** | le sprite est recopié dans les **28** planches — `i-close` y figure **22 fois**, `i-back` 22, `i-dash` 22 | toute correction doit être faite 22 fois, donc ne l'est pas |
| 2 | **Divergence déjà installée** | **11 symboles sur 73 ont deux tracés différents** selon la planche | le même acte ne se dessine plus pareil d'un écran à l'autre |
| 3 | **Le trait dérive** | **13 épaisseurs** en usage : 1,7 (331 fois) · 1,8 (74) · 2,1 · 2 · 1,6 · 1,9 · 2,2 · 1,5 · 2,8 · 2,4 · 2,66 · 3,1 · 2,65 | le poids optique change de rangée en rangée |
| 4 | **Deux systèmes qui s'ignorent** | le produit dessine avec **Material Symbols Outlined** (police variable, `opsz 20..48, wght 100..700, FILL 0..1`) ; les planches tracent des SVG à la main | **rien de ce qui est dessiné n'est implémentable sans une table de correspondance** — et elle n'existe pas |

Le point 4 est le plus lourd, et il n'avait jamais été relevé : le produit charge Material Symbols
depuis Google Fonts et l'appelle via un composant unique `MaterialIcon` — nom, taille, `FILL`,
`wght`. Un développeur qui porte une planche n'a **aucun moyen** de savoir quel nom Material
correspond à `i-retire` ou à `i-perif`.

### 3.2 Où des icônes manquent vraiment

| Famille | État au 11/08 | Manque |
| --- | --- | --- |
| **Statuts** | portés par une **puce de couleur seule** | **5 pictogrammes** — en service, attribué, en attente, hors service, retiré. La couleur seule échoue au daltonisme et au scan rapide |
| **Catégories d'équipement** | 4 pictogrammes pour **8 catégories** au Catalogue | serveur, imprimante, réseau, licence |
| **États vides** | le produit exige un pictogramme pour chacun de ses **9 `EmptyState`** ; les planches n'en dessinent **aucun** — les marqueurs d'état vide n'apparaissent que dans 4 planches | **5 pictogrammes** : parc vide, file vide, sans résultat, référentiel vide, sans droit |
| **Preuve** | signature existe ; `i-pin` est une **épingle d'emplacement**, pas un pavé de code — le code PIN n'avait donc aucun pictogramme | **pavé de code** et **empreinte** — deux des trois méthodes arrêtées le 31/07 |
| **Argent** | aucun | enveloppe budgétaire (4 enveloppes CAPEX/OPEX) |
| **Notifications** | **4 badges de comptage** sur 28 planches, aucune icône de relance | relance, et le badge sur l'onglet de la barre du bas |
| **Scan** | le geste est déjà dans le produit (facture) | pictogramme de scan — réemployé 3 fois (SN, code-barres, facture) |

### 3.3 Le système retenu — **Phosphor Icons**

**Décision : on abandonne le set maison et on adopte une bibliothèque.** C'était l'arbitrage laissé
ouvert ; il est tranché dans l'autre sens que la première recommandation, et pour une raison simple :
gouverner un set maison demandait un fichier, une règle et une vigilance permanente — **adopter une
bibliothèque supprime le problème au lieu de l'administrer**. Les 11 tracés divergents disparaissent
avec le set qui les portait, et les 16 pictogrammes manquants n'ont plus à être dessinés.

**[Phosphor Icons](https://phosphoricons.com)** — 1 500 pictogrammes, **six graisses**, licence MIT,
grille 24, et un paquet React (`@phosphor-icons/react`) côté produit. Quatre raisons de le préférer :

1. **Il couvre les 16 manques de §3.2** sans qu'on dessine quoi que ce soit — `hard-drives`,
   `printer`, `network`, `certificate`, `fingerprint`, `wallet`, `tray`,
   `magnifying-glass-minus`, `folder-open`, `shield-warning`.
2. **Ses six graisses donnent la hiérarchie** que le trait unique ne donnait pas : `regular`
   partout, `light` au-delà de 32 px, `fill` pour l'onglet actif seul.
3. **La graisse est une propriété de police, pas un attribut de tracé** — elle ne dérive pas, et
   elle ne peut pas prendre treize valeurs par accident. C'est précisément ce que le set maison ne
   savait pas garantir.
4. **Il est maintenu**, ce qu'un sprite recopié 28 fois ne sera jamais. Et côté produit il
   **remplace** Material Symbols : la table de correspondance nom par nom disparaît avec le besoin
   de pont, et le produit sort de l'apparence MD3 générique par la même occasion.

Emploi dans les planches : `<link>` vers `@phosphor-icons/web` puis `<i class="ph ph-laptop">`.
**Quatre tailles, pas cinq** — 32 (état vide, seul emploi) · 24 (barres) · 20 (rangée, puce) ·
18 (en ligne dans un texte de 13 px).

**Quatre interdits** : pas de pictogramme redessiné à la main quand la bibliothèque en a un ; pas
d'icône décorative en tête de carte ; pas d'icône seule pour un acte engageant, sauf dans les deux
barres, qui sont apprises ; pas d'icône au-delà de 32 px — au-delà c'est une illustration, et le
produit n'en a pas.

**Une exception nommée** : le chevron de rangée reste un signe de rangée à 8 × 14, pas une icône de
la bibliothèque. Il ne suit ni la grille ni les quatre tailles, et c'est voulu — un chevron qui pèse
20 px de large devient un geste, alors qu'il n'annonce qu'une destination.

---

## 4 · Direction esthétique — planche 01.1

`screens/direction-compact-piste.html`. Elle porte la palette et ses droits d'usage, l'échelle
typographique, les composants au niveau attendu, **le système d'icônes en entier** (colonne 5), la
densité chiffrée, et **une démonstration avant/après sur Paramètres** — la planche la plus
symptomatique — pour prouver que le gain vient de la mise en forme seule, sans rien changer au
contenu.

**Les six règles, en résumé :**

| | Règle | Ce qu'elle corrige |
| --- | --- | --- |
| **R1** | **Un porte-voix par écran** — exactement un élément à 28 px ou plus, en Archivo 600 | le plafond à 20 px sur 16 planches |
| **R2** | **L'encre sombre porte le sujet** — toute fiche ouvre sur un héro `#0A191D`, motif à 10 % | le sombre réduit à un fond de bouton |
| **R3** | **Le jaune une seule fois** — le geste primaire, rien d'autre | la marque absente de 9 planches |
| **R4** | **Le filet remplace la carte** — une carte porte un sujet ; une suite de réglages est un groupe à filets | l'empilement de 11 cartes blanches |
| **R5** | **44 px, jamais moins** — rangée 44, bouton 48, champ 52, gouttière 20 | la densité obtenue par serrage |
| **R6** | **Trois mouvements nommés** — feuille 220 ms, bandeau 160 ms, pression 90 ms | 0 animation sur 26 fichiers |
| **I1** | **Une bibliothèque, pas un set maison** — Phosphor Icons, MIT | 28 sprites dupliqués, 11 symboles déjà divergents, 16 pictogrammes manquants |
| **I2** | **Graisse `regular`, quatre tailles** — 32 · 24 · 20 · 18 ; `light` au-delà, `fill` pour l'onglet actif | 13 épaisseurs de trait en usage |
| **I3** | **L'état porte une icône <b>et</b> une couleur** — jamais la couleur seule | 5 états discriminés par la teinte |

**Deux changements de fond au-delà des règles :**

- **Archivo change de rôle.** Elle ne sert plus qu'aux chiffres de code ; elle devient **la police
  du sujet**, au-dessus de 20 px, en 600. C'est le seul levier qui, à lui seul, distingue un écran
  dessiné d'un écran transposé. Cela tranche au passage la question ouverte du 600 (§7 de l'audit
  du 07/08) : **le 600 est une identité, portée par Archivo seule** ; Inter reste à 400/500.
- **Le secondaire passe de `#78746C` à `#6C6862`** — 4,42:1 → 5,1:1. C'est l'arbitrage **Q-B2**,
  ouvert depuis le 28/07, tranché ici : l'écart est imperceptible et il fait passer AA.
- **Le set d'icônes maison est abandonné** au profit de **Phosphor Icons**. C'est le changement le
  plus net de ce recadrage côté composants : on cesse de dessiner des pictogrammes. Voir §3.3.
- **Le héro du sujet est une image voilée, pas un motif géométrique** — le modèle du tableau de
  bord, repris tel quel : photographie en fond, voile d'encre `#0A191D` de .62 en haut à .92 en
  bas. Le motif en semis est retiré de la direction.

---

## 5 · Backlog priorisé — compact seulement

L'ordre suit une seule logique : **ce dont les autres planches héritent passe d'abord.** Refaire la
fiche équipement avant la fiche utilisateur évite de dessiner deux fois le même héro.

### Vague 0 — la passe d'icônes, transverse et préalable

**À faire avant la vague 1, sur les 28 planches d'un coup**, parce que chaque planche reprise ensuite
sans elle rajoute un 29ᵉ sprite dupliqué :

1. charger **Phosphor** dans les 28 planches et **supprimer les 28 sprites locaux** (I1) ;
2. remplacer les `<use href="#i-…">` par `<i class="ph ph-…">` — la correspondance des 73
   identifiants maison vers les noms Phosphor est établie sur la planche 01.1 ;
3. les **11 tracés divergents** et les **13 épaisseurs** disparaissent d'eux-mêmes avec le set ;
4. **acter le remplacement de Material Symbols côté produit** (`@phosphor-icons/react`) : c'est ce
   qui rend le portage direct, sans table de correspondance à entretenir.

Coût : une passe mécanique. Gain : les 16 pictogrammes manquants sont disponibles immédiatement, et
les planches des vagues suivantes n'ont plus à dessiner d'icône — seulement à en poser.

### Vague 1 — les trois gabarits porteurs

| Rang | Planche | Fonctionnalité | Recommandations UI — pas de reprise 1:1 |
| --- | --- | --- | --- |
| **1** | **04.2 Détail équipement** | fiche, actes, historique | Héro sombre : référence en micro-libellé, **nom du modèle à 28 px Archivo**, état en puce, et **trois qualifiants chiffrés** (âge, garantie restante, valeur d'achat) sur un filet interne — ils sont aujourd'hui dispersés dans trois cartes. Geste primaire jaune unique + débordement. Historique en **groupe à filets à puces d'état**, pas en cartes. Ce gabarit sert ensuite à 05.2, 09.1, 09.2, 10.1. **Icônes** : `i-dev` (catégorie, 20) dans le héro, `i-ok`/`i-alert` pour l'état, `i-hist` sur l'historique, `i-scan` sur le SN, `i-more` au débordement. |
| **2** | **03.3 Tâches** | file de travail unifiée | Destination unique de la moitié des liens : c'est l'écran le plus vu. **Pas de héro** (aucun sujet) mais un **compteur porte-voix à 34 px** — « 17 choses vous attendent » — et les filtres en puces sombres actives. Rangée = un acte, un sujet, un geste secondaire à droite ; **48 px minimum**. Sélection multiple à prévoir dans le dessin (999 demandes). **Icônes** : une par nature d'acte en tête de rangée (20) — c'est l'écran où le scan visuel compte le plus ; `i-filter`/`i-sort` dans la barre ; `i-inbox` à 32 pour la file vide. |
| **3** | **05.1 Liste utilisateurs** | annuaire | Gabarit « liste » commun avec 04.1, déjà modernisée : **aligner 05.1 sur 04.1**, ne pas réinventer. Avatar à 36 px sur rond sombre, nom à 15 px, appartenance et compte détenu en secondaire, état en puce à droite. Barre de recherche et puces de filtre dans un seul bloc collant. **Icônes** : `i-search`, `i-filter`, `i-plus` (inviter), `i-nosearch` à 32 pour « sans résultat ». |

### Vague 2 — les écrans plats à fort trafic

| Rang | Planche | Fonctionnalité | Recommandations UI |
| --- | --- | --- | --- |
| **4** | **14.1 Paramètres** | réglages personnels, entreprise, IT | **Déjà démontrée en 01.1** — il n'y a qu'à porter : onze cartes → quatre groupes à filets, **valeur du réglage à droite de la rangée** (elle se lit sans ouvrir), sous-titre qui dit la conséquence et non la valeur, aucun jaune. **Icônes** : aucune en rangée — c'est le seul écran où l'absence est la bonne réponse, les réglages n'ont pas de nature à dessiner. Sauf `i-wait` sur la 2FA inactive. |
| **5** | **05.2 Détail utilisateur** | fiche personne, équipements détenus | Hérite du héro de 04.2 : **nom à 28 px**, rôle et site en micro-libellé, avatar en rond sombre 56 px dans le héro. Les trois états de compte se disent par **inversion du héro** (gris pour suspendu), déjà la règle des clôtures — jamais par un bandeau. Équipements détenus en groupe à filets. **Icônes** : catégorie par équipement détenu (20), `i-bell` sur relancer, `i-pin` sur réinitialiser le code, `i-shield` à 32 si l'écran est refusé. |
| **6** | **09.1 Catalogue** | catégories et modèles | Deux onglets à 44 px, pas des cartes. Chaque type = une rangée avec **son décompte en chiffres tabulaires à droite** et sa tension en puce. Le porte-voix est le nombre de modèles au catalogue. Jonction propre avec 09.2, déjà modernisée. **Icônes** : c'est l'écran des **8 pictogrammes de catégorie** — dont les 4 nouveaux (serveur, imprimante, réseau, licence). `i-folder` à 32 pour le référentiel vide. |
| **7** | **10.1 Emplacements** | pays → site → local | La hiérarchie à trois niveaux est ce que la réplique rend illisible. **Un niveau par écran**, fil d'Ariane dans la barre du haut, décompte d'équipements à droite de chaque rangée, porte-voix = le nom du niveau courant à 28 px. **Icônes** : une par niveau (pays / site / local) à 20, `i-right` dans le fil d'Ariane. |
| **8** | **11.1 Rôles et permissions** | RBAC | La matrice est le seul endroit où le tableau est légitime. Rôle en héro sombre, permissions en **groupes à filets avec interrupteurs à droite**, groupés par domaine. Les quatre états vides du code doivent tous être dessinés. **Icônes** : une par domaine de permission (20) ; `i-shield` à 32 sur les quatre états vides. |
| **9** | **06.5 Arbitrer les demandes** | approbations | 10 chevrons aujourd'hui : c'est l'écran qui décide le plus et qui le montre le moins. **Valider / Refuser en gestes de rangée** (sombre + fantôme), pas en navigation vers une fiche. Porte-voix = nombre de demandes en attente. **Icônes** : `i-check` et `i-close` sur les deux gestes, catégorie du matériel demandé à gauche, `i-inbox` à 32 quand la file est vide. |

### Vague 3 — les flux et les passes légères

| Rang | Planche | Action |
| --- | --- | --- |
| **10** | **05.4 Administrer un compte** | refaire avec 05.2 — mêmes actes, même héro inversé |
| **11** | **04.4 Suite de l'incident** | refaire — chaîne d'états, le seul endroit où R6 se voit vraiment. **Icônes** : `i-alert`, `i-wrench`, `i-ok` sur les trois temps de la chaîne |
| **12** | **06.3 Fins de flux** · **06.4 Demander** · **05.3 Créer un compte** · **12.1 États** | passe légère : échelle et porte-voix seulement. Les feuilles et les règles sont bonnes ; il manque le palier haut. **Écrire les trois mouvements de R6 ici**, une fois, et les réemployer. **Icônes** : `i-sign`/`i-pin`/`i-finger` sur les trois méthodes de preuve en 06.3 ; les **5 états vides à 32 px** en 12.1, qui est leur planche naturelle |

### Vague 4 — les absents

| Rang | Objet | Nature |
| --- | --- | --- |
| **13** | **Hors ligne · chargement · scan** | trois objets transverses, dessinés une fois, appliqués partout. Le scan est déjà dans le vocabulaire du produit (facture) : il est réemployé, pas inventé. |
| **14** | **Liste pré-filtrée** (écran 7) | état de 04.1, pas une planche |
| **15** | **`audit` · `audit_details`** | **exclusion du 05/08 à confirmer ou à lever** — 2 écrans du produit, aujourd'hui hors dessin |
| **16** | **Explorateur de documentation** | 1 décision : dessiner ou exclure explicitement |

### Vague 5 — la tablette

Le régime **medium 600–840** pour les 5 gabarits restants — tableau de bord, assistant, formulaire
plein écran, file, référentiel. La loi est écrite en 13.1 et démontrée sur 3 gabarits sur 8.
À faire **après** la reprise esthétique : porter deux fois le même écran serait le refaire deux fois.

---

## 6 · Décisions attendues avant la vague 0

1. **La direction 01.1 est-elle validée telle quelle ?** Tout le backlog en dépend ; la reprendre
   après trois planches portées, c'est en refaire trois.
2. **Refaire ou passer légèrement.** Le tableau §5 distingue *refaire* (10 planches) de *passe
   légère* (5 planches). Un « tout refaire » est possible mais coûte environ le double.
3. **`audit` et `audit_details`** — l'exclusion du 05/08 tenait au fait que ces écrans venaient
   d'être livrés côté code. Sous le nouveau cadrage, « déjà fait côté code » n'est plus un motif
   d'exclusion : le code n'est plus la référence visuelle.
4. **Phosphor côté produit.** La planche 01.1 est passée à Phosphor ; côté code, cela veut dire
   remplacer `MaterialIcon` par `@phosphor-icons/react` — un composant à réécrire, une
   dépendance à ajouter, et les noms d'icônes à changer là où ils sont passés en chaîne
   (`DESTINATIONS`, `EmptyState`, `ConfirmationDialog`). À valider **avant la vague 0**.
