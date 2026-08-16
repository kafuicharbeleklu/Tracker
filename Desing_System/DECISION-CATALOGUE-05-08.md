# Catégories du catalogue — options soumises à arbitrage · **tranché le 05/08 (§6), réponse A corrigée (§7)**

Écrit le **2026-08-05**. Reprend le §5 de `RAPPORT-PASSE-2.md` et le confronte à la **donnée réelle
du produit** (`src/data/mockData.tsx`, `src/types/index.ts`, et les écrans qui la consomment).
L'ordre imposé par `REGLES-TRANSVERSES.md` §5.7 est tenu : **présenter, obtenir l'arbitrage, puis
dessiner.** Rien n'est dessiné ici.

> **§4 recommandait A1 sur une mesure prise sur le mauvais composant. C'est faux, et §7 le
> corrige : la réponse est A2.** §4 est laissé tel quel — un raisonnement réécrit ne montre plus
> où il a dérapé.

---

## 1 · L'état réel, mesuré

**Huit catégories dans la donnée**, à clé anglaise :
`Laptop · Monitor · Keyboard · Mouse · Server · Headphones · Furniture · Printer`

Et un fait de structure qui commande tout le reste — `src/types/index.ts:174` :

```ts
export interface Equipment {
  type: string; // Linked to Category name
```

**Le type d'un équipement n'est pas une référence : c'est le *nom affiché* de la catégorie, recopié
en chaîne de caractères.** La jointure se fait par le libellé. C'est la donnée qui décide de la
question B, pas une préférence de langue.

**Le préfixe du code d'actif n'est pas la catégorie**, et la donnée le confirme : `LPT-HQ-01` et
`MBP-SALES-01` sont tous deux `type: 'Laptop'` ; `SCR-DK-01` est `Monitor`, `HDP-DK-01` est
`Headphones`. Le préfixe dit la **famille de modèle**, la catégorie dit le **type**. Deux axes.

---

## 2 · La dette n'est pas « anglais dans la donnée, français dans les planches ». Il y a **quatre** traductions, et elles divergent

| Source | Où | Contenu |
| --- | --- | --- |
| **1** | `Category.description` — *dans la donnée* | descriptif, au pluriel : « Ordinateurs portables », « Écrans et moniteurs », « Casques audio », « Mobilier de bureau » |
| **2** | `CATEGORY_LABELS`, `ManagementPage.tsx:33` | libellé, au singulier : « Ordinateur portable », « **Moniteur** », « Casque », « Mobilier » — **10 entrées pour 8 catégories** |
| **3** | options en dur, `NewRequestPage.tsx:170` | **6 entrées sur 8**, dont « **Écran** » |
| **4** | les planches | 8 types en français, « Moniteur » |

**Ce que les trois premières sources disent de `Monitor` : « Écrans et moniteurs », « Moniteur »,
« Écran ».** Trois libellés, un seul objet.

### 2.1 · Et ce n'est pas seulement lexical — deux défauts fonctionnels

**`NewRequestPage` écrit des types qui ne joignent aucune catégorie.** Ses options portent
`value: 'Headset'` et `value: 'Other'` ; la donnée ne connaît que `Headphones`, et pas `Other`.
Une demande de casque créée depuis cet écran produit un équipement dont le type **ne correspond à
aucune catégorie du catalogue** — donc sans icône, sans amortissement par défaut, et invisible à
tout filtre par catégorie. Rien ne le signale : `type` est un `string`.

**Le même écran ne propose ni `Server`, ni `Printer`, ni `Furniture`.** On ne peut pas demander une
imprimante.

**`CATEGORY_LABELS` porte deux entrées fantômes** — `Tablet` et `Phone` — pour des catégories qui
n'existent pas. Symétrique du défaut précédent : la table de traduction et la donnée ont dérivé
dans les deux sens.

---

## 3 · Question B — la langue. **Tranchée par la donnée, à mon sens**

| Option | Principe | Ce que la mesure en dit |
| --- | --- | --- |
| **B1** — clé anglaise, libellé porté par la donnée | `Category.name` reste `Laptop` (clé de jointure), un champ **`label`** porte « Ordinateur portable » | Rien à migrer. **Une seule table**, et elle vit là où vit la catégorie. |
| **B2** — migrer la donnée en français | `Laptop` → `Ordinateur portable` dans la base | **Casse la jointure et la logique métier, en silence.** Voir ci-dessous. |
| **B3** — statu quo, l'interface traduit | — | **Déjà en échec, mesuré** : 4 tables, 3 libellés pour un objet, 1 clé fausse qui produit des données orphelines. |

**Pourquoi B2 est plus cher qu'il n'en a l'air.** La clé anglaise n'est pas seulement une clé de
jointure, elle est **écrite en dur dans la logique métier** :

- `DataContext.tsx:355` — `['Laptop', 'Server', 'Printer'].includes(merged.type)` décide si un actif
  est « informatique » (et donc s'il porte un nom d'hôte, une adresse MAC…) ;
- `TransactionTicketModal.tsx:48` — `equipmentSnapshot?.type === 'Laptop'` ;
- quatre valeurs par défaut `|| 'Laptop'` (création de catégorie, import CSV, `DataContext:1789`).

`type` étant un `string`, **aucun de ces tests ne casserait à la compilation** : ils deviendraient
simplement faux. Un serveur cesserait d'être un actif informatique sans qu'aucune erreur n'apparaisse.

> **Précision que la mesure impose à B1.** « Un champ `label_fr` » ne suffit pas si la table reste
> dans un fichier de front : on recrée le cas n°2. Le libellé doit être **un champ de `Category`**,
> et les trois autres sources doivent **disparaître** — `CATEGORY_LABELS` supprimée, les options de
> `NewRequestPage` lues depuis le catalogue, et `Category.description` rendue à son rôle de
> description (« Ordinateurs portables de l'entreprise ») au lieu de servir de second libellé.
> **Une source, sinon ce n'est pas B1, c'est B3 avec un champ de plus.**

---

## 4 · Question A — la structure. **Je change d'avis : A1**

Le rapport du 01/08 recommandait **A2** (deux niveaux, famille → type) sur cet argument :
*« 9 pastilles, deux rangées qui débordent »*. **Cet argument est faux, et c'est la mesure des
planches qui le dit.**

Le composant de filtre est un **défileur horizontal**, pas une grille :

```css
.chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-right:20px;margin-right:-20px}
```

*(relevé dans 03.3, composant partagé avec 04.1 et 05.1 — §2.24)*

Huit pastilles **ne débordent pas sur deux rangées : elles défilent**, comme les cinq natures de
tâches le font déjà. Le problème que A2 venait résoudre n'existe pas dans le dessin.

Restent alors les faits, et ils penchent tous du même côté :

| | |
| --- | --- |
| **Le volume** | 8 catégories, pas 15. A2 ajoute un niveau à maintenir dans la donnée pour un problème d'affichage qu'on n'a pas. |
| **La catégorie n'est pas qu'un filtre** | `Category` porte `defaultDepreciation` — méthode, durée, valeur résiduelle. **C'est un objet de gestion comptable.** Un niveau « famille » au-dessus n'aurait aucune durée d'amortissement à porter : il serait décoratif. |
| **A3 est éliminée comme structure** | *Attribuable / partagé* ne peut pas porter l'amortissement non plus — un portable s'amortit en 3 ans, un mobilier en 10. Regrouper par attribuabilité ferait perdre la seule chose que la catégorie sait faire. |

**Mon avis : A1 — un niveau, tel quel.** Et deux bornes, écrites pour ne pas avoir à redécider :

1. **A2 se pose le jour où le catalogue dépasse une douzaine de catégories** — pas avant. Elle se
   pose alors *par-dessus* A1, comme un champ `family` sur `Category`, sans rien refaire.
2. **A3 revient, mais comme attribut et non comme structure** : un booléen `assignable` sur
   `Category`. Il ne sert pas au filtre — il sert à **retirer serveurs, imprimantes et mobilier du
   sélecteur d'attribution**, où ils n'ont rien à faire aujourd'hui. C'est peu coûteux, c'est juste,
   et c'est indépendant de A.

---

## 5 · Ce qu'il faut trancher

| | Question | Mon avis |
| --- | --- | --- |
| **A** | Structure du catalogue | **A1** — un niveau. A2 différée à ~12 catégories, A3 recyclée en attribut `assignable`. |
| **B** | Langue | **B1** — clé anglaise, libellé **porté par `Category`**, et les trois autres sources supprimées. |
| **C** | *(neuf)* Les deux défauts fonctionnels de §2.1 | Ils ne sont pas un arbitrage de dessin : `Headset` / `Other` produisent des données orphelines, et trois catégories sont indemandables. **À corriger côté produit**, indépendamment de A et B. |

**Une fois A et B tranchées, ce qui se dessine** est mince : le filtre par catégorie ne change pas
de forme (il défile déjà), et le libellé cesse d'être choisi par l'écran. L'essentiel du travail est
côté produit, pas côté planche — c'est ce que la mesure a établi, et c'est pourquoi elle valait
d'être faite avant de dessiner.

---

## 6 · Arbitrage rendu le 05/08

Les deux questions ont été **déléguées**, avec un fait ajouté qui en change une :
*« dans les paramètres il y aura l'option choix de langue »*.

### A — un seul niveau

Les huit catégories restent à plat. **A2** se posera *par-dessus*, comme un champ `family`, le jour
où le catalogue dépassera une douzaine d'entrées — pas avant, et sans rien refaire. **A3** est
recyclée en **attribut** : un booléen `assignable` sur `Category`, qui ne sert pas au filtre mais à
**retirer serveurs, imprimantes et mobilier du sélecteur d'attribution**, où ils n'ont rien à faire
aujourd'hui.

### B — la clé reste un identifiant, le libellé devient une table par langue

`Category.name` reste `Laptop` : c'est une **clé**, pas un mot. Le libellé vit sur `Category`, **en
table par langue** — et non plus en champ unique comme je le proposais avant de connaître le
sélecteur de langue.

**Pourquoi le champ unique ne tient plus.** Un `label` en français aurait été la bonne réponse pour
un produit monolingue. Avec un sélecteur de langue — déjà dessiné en **07.1**, rangée
« Affichage — français » — il faudrait retraduire ce libellé quelque part : c'est-à-dire recréer
exactement la quatrième table qu'on supprime. **Le défaut se reproduirait par construction.**

**Et pourquoi la table vit dans la donnée, pas dans le code.** Les catégories sont **créées par
l'utilisateur** — l'écran « Ajouter une catégorie » existe. Un dictionnaire de traduction côté code
ne couvrirait que les huit catégories livrées ; celle qu'un administrateur crée demain n'aurait
aucun libellé dans aucune langue. La table de libellés est donc **un champ de la catégorie**, avec
repli sur `name` quand une langue manque.

### Ce qui reste à faire, dans l'ordre

| | Quoi | Où |
| --- | --- | --- |
| **1** | ~~Corriger les deux défauts fonctionnels de §2.1~~ **— fait le 05/08.** Les options de `NewRequestPage` sont lues **depuis le catalogue** : `Headset` et `Other` disparaissent, serveur, imprimante et mobilier deviennent demandables. La table de libellés est remontée dans `src/constants/glossary.ts`, source unique du DS (§13) ; `CATEGORY_LABELS` de `ManagementPage` est supprimée. **Trois sources de traduction → une.** *(build + lint verts ; `ds:check` reste rouge sur deux fichiers antérieurs, `DocumentationExplorerPage` et `DemoBadge`, non touchés)* | produit — fait |
| **2** | **Dessiner l'écran du catalogue** — il n'a **jamais** été dessiné : aucune planche « gestion » n'existe, seulement la capture de l'existant (`screens/actuel/gestion.png`). C'est là que vivent la table de libellés, `assignable`, et l'amortissement par défaut. | planche neuve |
| **3** | ~~Supprimer les trois sources concurrentes~~ **— deux sur trois faites le 05/08** avec le point 1. Reste `Category.description`, qui sert encore de second libellé au pluriel (« Ordinateurs portables ») : à rendre à son rôle de description quand la table par langue descendra dans la donnée. | produit — partiel |

Les trois questions que le sélecteur de langue laisse ouvertes — langues retenues et langue de
repli, frontière entre nomenclature et donnée libre, et **les statuts français employés comme
clés** — sont inscrites au registre **§5.8**. Aucune ne se tranche en maquette.

---

## 7 · Correction du 05/08 — la réponse A est **A2**, et §4 était faux

§4 écartait A2 en affirmant que son argument — *« les pastilles débordent »* — ne tenait pas,
parce que le composant de filtre est un défileur horizontal. **La mesure était juste ; elle
portait sur le mauvais composant.**

Il y a **deux** porteurs de pastilles dans ces planches, avec les mêmes `.chip` à l'intérieur :

| Composant | Où | Comportement | 9 pastilles de type donnent |
| --- | --- | --- | --- |
| `.chips` | la rangée **en ligne**, sous la barre de recherche | `overflow-x:auto` — **défile** | 1 rangée, rien ne déborde |
| `.sgrp` | la feuille **« Filtrer »** | `flex-wrap:wrap` — **enroule** | **3 rangées**, 783 px pour 393 px utiles |

L'argument de A2 a toujours porté sur la **feuille**. J'ai mesuré la **rangée en ligne**. Les deux
sont dans le même fichier, portent des pastilles identiques au pixel, et ne débordent pas de la
même façon.

**Vérifié au rendu, à 393 px :** axe à plat **9 pastilles / 3 rangées** ; axe de familles
**5 pastilles / 2 rangées** ; l'axe « Type » de second niveau, quand une famille est prise,
**5 pastilles / 2 rangées** de plus. Une rangée gagnée aujourd'hui — et une **borne** demain :
quatre familles restent quatre à quinze types, la liste à plat en demanderait cinq ou six rangées.

### Ce que la correction ne change pas

**B reste B1**, dans sa forme corrigée par le sélecteur de langue (§6). **A3 reste écartée** comme
structure — `Category` porte `defaultDepreciation`, et « attribuable » n'a pas de durée
d'amortissement — et reste recyclée en **attribut** `assignable`. Le raisonnement de §4 sur ce
point était bon ; c'est la seule branche qui ne dépendait pas de la mesure fausse.

### Et l'état réel du projet, relevé après coup

**La planche 09.1 existe déjà**, dessinée sur A2 et B1, avec ses trois rôles neufs (`.fh`,
`.aid.todo`, `.lrow.mute`) — désormais inscrits au registre §2.36. **La feuille de filtre de 04.1
est déjà convertie** à l'axe « Famille ». Il n'y a donc rien à dessiner : c'était mon document qui
contredisait le projet, pas l'inverse.

> **La leçon, et elle est de méthode.** J'avais écrit ce matin qu'*« un argument de dessin se
> vérifie dans le dessin »*. Je l'ai fait — sur un autre composant. **Une mesure qui fonde une
> décision nomme le sélecteur exact sur lequel elle a été prise**, sans quoi elle est invérifiable,
> et deux composants qui se ressemblent suffisent à la retourner. Inscrit au registre.
