# RAPPORT — PASSE 3 · 2026-08-01

Reprise de vos quatre points. Ils sont tous les quatre **fondés**, et le troisième — « il doit y
en avoir d'autres » — l'était le plus : la comparaison visuelle entre planches a sorti **vingt
identifiants d'icônes portant deux ou trois dessins différents**, dont le bouton filtre n'était
qu'un cas parmi vingt.

Je commence par la question que vous posez en dernier, parce qu'elle commande les trois autres.

---

## 0 · Pourquoi le rapport précédent a déclaré le bouton filtre « harmonisé »

**Il ne mentait pas, il mesurait la mauvaise chose.**

La passe 2 a comparé les trois pages sur la **boîte** : `48 × 48`, rayon 4, filet `--line-strong`,
survol `--inset`, badge `.fbtn b`, `aria-label`. Ces sept valeurs étaient — et sont toujours —
identiques au caractère dans les trois planches. La conclusion « même composant » suivait
logiquement de la mesure.

Ce que la mesure ne contenait pas : **le dessin du glyphe.** §2.24 déclarait *« Glyphe `i-filter`,
20 px »*. Elle fixait le **nom de l'appel** et sa **taille** — pas le **tracé appelé**. Or chaque
planche embarque **sa propre copie du sprite** :

| | Tracé de `i-filter` |
| --- | --- |
| **Tâches** (03.3) | `M3.5 6h17` · `M6.5 12h11` · `M10 18h4` |
| **Équipements** (04.1) et **Équipe** (05.1) | `M3 6h18` · `M6 12h12` · `M10 18h4` |

Trois traits décroissants dans les deux cas, mais un **écartement différent** : celui de 04.1/05.1
descend de 18 à 12 à 4 et se lit comme un entonnoir ; celui de 03.3 descend de 17 à 11 à 4, plus
étroit, plus « lignes empilées ». Vous avez décrit exactement cette différence. **La boîte était
conforme et le bouton n'avait pas la même allure** — les deux affirmations sont vraies en même
temps.

**La faute est de méthode, et elle a un nom déjà écrit au registre :** l'emploi n°5 dit qu'une
valeur canonique *s'énonce, elle ne se désigne pas*. §2.24 **désignait** un glyphe par son
identifiant. C'est la même faute que « identique aux deux autres », commise sur un objet qui n'est
pas du CSS — et c'est pour cela qu'aucun des neuf contrôles ne pouvait l'attraper : **les neuf
lisaient la feuille de style, aucun ne lisait le sprite.**

→ Le tracé est désormais **écrit** dans §2.24. Et l'**emploi n°10** compare le contenu de chaque
`<symbol>`, texte contre texte, entre toutes les planches.

---

## 1 · Barre de recherche sur Tâches — **exception, documentée** (§2.30)

C'est voulu, et voici la raison, qui n'était écrite nulle part :

**Une recherche cherche un identifiant que la personne a sous les yeux** — un code collé sur une
machine (04.1 : *« Code, identifiant, modèle »*), un nom lu dans un courriel (05.1 : *« Nom,
e-mail, département »*). **Une tâche n'a pas d'identifiant propre.** Elle désigne un objet et une
personne, qui en ont un chacun, et qui se cherchent dans leur liste à eux. La file de travail ne
se cherche pas, elle se vide : l'ordre est *le plus ancien d'abord*, et à 999 tâches la planche
écrit déjà que **filtrer par nature est le seul geste utile**.

**Ce qui ferait tomber l'exception**, écrit d'avance pour qu'on n'ait pas à la redébattre : le jour
où une tâche porte une **référence propre** — un numéro de ticket qu'on se cite au téléphone — elle
devient cherchable, et la barre revient, à l'identique de 04.1 et 05.1.

C'est la première entrée d'une section qui manquait : **§2.30, les exceptions déclarées.** Sans
elle, un futur contrôle d'harmonisation « corrigerait » Tâches au nom de la conformité — le même
mécanisme qui aurait détruit `.btn-ghost` à la passe 2.

---

## 2 · Le bouton filtre — l'écart était réel, il est corrigé

`i-filter` porte désormais **un seul tracé** dans les trois planches : celui de 04.1/05.1, choisi
parce qu'il est majoritaire et parce que c'est celui qui se lit comme un entonnoir.

Et en le corrigeant, la barre de filtres elle-même a livré deux écarts de plus :

| # | Écart | Cause | Traitement |
| --- | --- | --- | --- |
| 2.1 | **`.frow`** — la rangée qui porte le bouton filtre — n'avait pas `align-items:center` dans 04.1 et 05.1 | invisible tant que le champ et le bouton font tous deux 48 px ; le jour où l'un grandit, ils se décalent | corrigé, texte unique dans les 3 |
| 2.2 | **le champ de recherche portait le gris du texte sur le conteneur** (`color:var(--ink2)` sur `.field`), là où les formulaires le portent sur l'enfant `.ph` | deux anatomies pour un composant, comme `.rrow` à la passe 2 : la même faute de sous-spécification | corrigé — `.field` a **une** déclaration, l'espoir de saisie est `.ph` partout |

---

## 3 · Les autres écarts du même type — **vous aviez raison, il y en avait vingt**

J'ai fait ce que vous demandiez : comparer les planches **entre elles**, sur ce que l'œil voit,
et non sur ce que le registre déclare. Deux relevés nouveaux.

### 3.1 · Le sprite — 20 identifiants, 2 ou 3 dessins chacun

Seize planches, seize copies du sprite, **jamais comparées**. Résultat mesuré :

`i-alert` (3 triangles différents) · `i-box` (3 cubes) · `i-check` (3, dont un cerclé) ·
`i-more`/`i-dots` (**deux noms** pour les trois points, et 2 dessins) · `i-out` (2, **en sens
opposés**) · `i-search` · `i-mail` · `i-shield` · `i-pin` · `i-cal` · `i-doc` · `i-scan` ·
`i-wrench` · `i-bio` · `i-lead` · `i-back` · `i-down` · `i-right` · `i-filter` · `i-box`.

**28 symboles réécrits, 11 planches.** Le canon est majoritaire par défaut, sauf trois cas où la
majorité avait tort et où c'est écrit (§2.28) :

- **`i-out`** — la variante majoritaire pointait **vers la gauche**. La direction d'une flèche est
  un sens, pas un style : sortante vers la gauche, elle entre en collision avec `i-back` et
  `i-return`. C'est la minoritaire, vers la droite, qui est retenue.
- **`i-scan`** — la mire dont le trait de lecture **dépasse les équerres** se lit comme un défaut
  de tracé. Retenue : celle qui reste dans le cadre.
- **`i-dots` / `i-more`** — deux identifiants pour un même rôle (« plus d'actions »). `i-dots` est
  supprimé : **un nom, un rôle** (§2.18), la règle valait déjà pour les classes.

### 3.2 · Deux composants transverses divergents que le contrôle « texte contre texte » avait manqués

La passe 2 comparait **29 rôles**. Ces deux-là n'y étaient pas :

| Rôle | État trouvé | Corrigé en |
| --- | --- | --- |
| **`.tbar`** — la barre du haut | **six déclarations différentes** sur 11 planches : trois paddings, deux gouttières, `min-height` dans deux, `position:sticky` dans une | une déclaration + deux variantes **nommées** : `.tbar.plain` (barre à titre, sans bouton de retour — 03.3, 04.1, 05.1) et `.tbar.stick` |
| **`.field`** — le champ | **quatre déclarations** : hauteur fixe *ou* min-height, gris sur le conteneur *ou* sur l'enfant, deux paddings | une déclaration + `.field.multi` (valeur sur plusieurs lignes) et `.field.wact` (champ à bouton en bout) |

**Ce que ça dit du contrôle n°7 :** il compare les rôles **inscrits au registre**. Un composant
transverse absent du registre n'est comparé par personne. Le relevé se fait donc désormais sur
**toutes** les classes présentes dans plus de deux planches, pas sur la liste des rôles connus.

Neuf composants de plus ont été réalignés au passage : `.grip` et `.sttl` (sans `flex` dans les
deux listes, donc compressibles dans une feuille), `.prov`, `.bst`, `.mi`, `.hero`
(`isolation:isolate` manquant en 05.2, alors que §2.27 le déclare), `.behind`, `.thumb`.

---

## 4 · Les deux boutons déformés — la cause, et elle est unique

**Vous les avez vus déformés parce qu'ils l'étaient**, et toutes leurs valeurs canoniques étaient
pourtant respectées. C'est le point le plus instructif de la passe.

```
.btn-o{flex:1;background:var(--inset);color:var(--ink)}     ← la classe de surface
.hact{display:flex;flex-direction:column;gap:10px;…}        ← le conteneur, en COLONNE
```

`flex:1` vaut `flex:1 1 0%`. Dans un conteneur en colonne, l'axe principal est **vertical** :
le `flex-basis:0%` **l'emporte sur `height:var(--btnh)`**. Le bouton conserve son padding
(`0 16px`), son rayon (4), son filet, sa couleur — **le registre est satisfait sur toutes les
lignes** — et il s'écrase à la hauteur de son texte, soit une vingtaine de pixels au lieu de 48.

`flex:1` avait été écrit pour la **paire en rangée** (`.hact.row`), où il est juste. Il vivait dans
la classe de surface, donc il s'appliquait aussi là où le bloc est en colonne.

**Quatre boutons étaient touchés, pas deux :**

| Planche | Bouton |
| --- | --- |
| 06.3 « fins de flux » | **Déclarer un incident** |
| 06.3 « fins de flux » | **Organiser la restitution** |
| 03.2 « à traiter » | le geste secondaire du héro |
| 04.2 « détail équipement » | **Restituer** — et sa paire ne s'affichait pas en deux colonnes (voir ci-dessous) |

**Une correction de plus, trouvée au contrôle visuel de cette passe :** deux planches posaient
`style="flex:0 0 auto"` **en ligne** sur le second bouton d'une paire — la même propriété de
distribution que l'emploi n°11 interdit, à un endroit qu'aucun balayage de classes ne regarde.
Devenue une variante nommée, `.hact.row.lead` : *un geste et un désistement*, le second à la
largeur de son mot.

**La correction porte sur la cause :** aucune classe `.btn-*` ne déclare plus une propriété de
mise en page. `.btn-y`, `.btn-o`, `.btn-d`, `.btn-x`, `.btn-dang` ne portent qu'un **fond** et une
**encre**. La répartition appartient au conteneur — `.sfoot`, `.hact.row`, `.pick`, `.vb` —
et le geste fantôme y garde sa largeur intrinsèque. C'est **l'emploi n°11**.

### 4.1 · Trois dommages collatéraux du même défaut, trouvés en le corrigeant

| # | Écart | Cause |
| --- | --- | --- |
| **4.1** | **`.hact.acts` ne s'appliquait jamais.** 04.2 voulait ses deux gestes en grille `1fr 1fr` ; à spécificité égale, `.hact{display:flex}`, écrit plus bas dans la feuille, l'emportait sur `.acts{display:grid}`. Les deux boutons s'empilaient. | **`.acts` avait été inventé parce que `.hact.row` ne convenait pas** : la planche voulait la rangée **et** le filet du bloc, or `.hact.row` supprimait les deux. Un seul nom portait **deux axes** — la direction et l'attache. Séparés : `.hact.row` (direction) et `.hact.bare` (attache). `.acts` détruit. **Et la grille voulue n'était pas viable** : deux moitiés font 156 px, « Déclarer un incident » en demande 190 — la paire reste **empilée**, et §2.29 dit désormais que la rangée est réservée aux gestes courts. |
| **4.2** | **`.btn-full{width:100%;flex:none}`** dans deux planches. | Quelqu'un avait **déjà rencontré le bug** et l'avait neutralisé sur la classe voisine. Un correctif de symptôme laisse la cause en place partout ailleurs — et rend le vrai défaut plus difficile à voir, puisque deux planches sur seize « fonctionnent ». Supprimé. |
| **4.3** | **`.vb` n'avait aucune règle** (pied du verdict de scanner, 04.1) : deux boutons empilés dans un conteneur sans déclaration. | **L'emploi n°6 l'avait manqué.** Il a été passé sur seize planches à la passe 2 et n'avait sorti que `dBv-adm`. Déclaré. |

---

## 5 · Ce que cette passe change dans la méthode

**Un contrôle ne voit que ce qu'il lit.** Les neuf contrôles de la passe 2 lisaient tous la
**feuille de style**. Le bouton filtre n'était pas un défaut de feuille de style : c'était un
défaut de **sprite**. Et le bouton écrasé n'était pas un défaut de valeur : c'était un défaut de
**mécanisme**, avec toutes les valeurs justes. D'où deux contrôles de plus, qui ne mesurent ni
l'un ni l'autre ce que mesuraient les neuf premiers :

- **n°10** — le contenu de chaque `<symbol>`, comparé entre planches.
- **n°11** — aucune classe de **surface** ne porte une propriété de **distribution**.

**Et une leçon sur ce rapport-ci autant que sur le précédent :** j'ai écrit « l'écart est fermé »
sur la foi d'une mesure que j'avais moi-même définie. La mesure était juste, son périmètre était
faux, et rien dans le rapport ne disait *ce qui avait été comparé*. Correctif de procédure :
**une déclaration de conformité énonce ce qui a été mesuré**, pas seulement son verdict. « Les
trois `.fbtn` sont identiques au caractère » aurait été vrai, vérifiable, et vous aurait permis de
répondre en une ligne : *« et le glyphe ? »*.

**Ce qui reste ouvert**, et que je n'ai pas tranché seul :

- **`.thumb` · `.ico` · `.av` · `.si .ic`** — quatre noms pour ce qui est peut-être **une seule**
  vignette de 40 px, rayon 6. Trois d'entre eux ont déjà été alignés sur ces valeurs à la passe 2,
  ce qui rend la question inévitable : est-ce un composant à un nom, ou quatre rôles distincts ?
  C'est un arbitrage de nomenclature, pas de maquette.
- **`.pick`** et **`.hint`** portent chacun **deux rôles** sous un nom (un sélecteur *et* une barre
  d'action collante ; une aide centrée *et* une note de champ). Même traitement à prévoir que
  `.chip`/`.stg` — un renommage, donc une décision.
- Les cinq points ouverts de la passe 2 (§4.1, §4.2, §4.3, catégories A/B) **restent ouverts** :
  cette passe n'y a pas touché.
</content>
<asset>Rapport passe 3</asset>
