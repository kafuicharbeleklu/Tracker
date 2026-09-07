# L'intégration de l'inventaire Neemba Togo — analyse du 06/09/2026

Établi en lisant `Inventaire_Neemba_Togo_2026.xlsx`, le script `scripts/import-inventory.mjs`
et l'état réellement chargé par l'application.

## 1. Ce que le tableur contient

**13 feuilles, 243 lignes.**

| Feuille | Lignes | Feuille | Lignes |
| --- | --- | --- | --- |
| Ordinateurs | 89 | Switch | 9 |
| Phone | 67 | Access Point | 8 |
| Ecrans | 36 | Interco | 6 |
| Imprimantes | 10 | Tablette | 6 |
| Serveur | 4 | Pare-feux | 3 |
| NAS | 2 | Vidéo-Projecteur | 2 |
| Station Accueil | 1 | | |

Les feuilles n'ont pas le même en-tête : les postes portent `Nom AD`, `Numéro de Série`,
`Categorie`, `Statut` ; le réseau porte `Pays`, `Site`, `Type d'Equipement`, `Maintenu`.
L'import lit les deux, et c'est bien fait.

## 2. Ce qui est réellement entré, et ce qui s'y est mêlé

| Collection | Total chargé | Du tableur | Résidus de démonstration |
| --- | --- | --- | --- |
| Équipements | 257 | **243** | **14** — `ASSET-10001`, `ASSET-90001`… |
| Utilisateurs | 73 | 62 (+1 créé dans l'application) | **11** — Alice SuperAdmin, Ethan Employé… |
| Demandes | 9 | 0 | **9** — « Demande: Headset », etc. |

**D'où viennent les résidus.** L'import vide `users` et `equipment` avant d'écrire :
après lui, la base ne contenait que le tableur. Les données de démonstration y sont
revenues **ensuite**, écrites par l'application : quand Firestore ne répond pas,
l'hydratation laisse le jeu de démonstration en place et l'effet de persistance
l'écrivait dans la base. Corrigé le 06/09 — le seed ne part plus au magasin distant.

## 3. Le défaut d'intégration : le type d'un objet est le nom de sa feuille

`import-inventory.mjs` écrit `type: sheetName`. Le parc porte donc des types nommés
« Ordinateurs », « Ecrans », « Phone », « Interco », « Station Accueil » — qui ne sont
**aucune** des clés du catalogue (`Laptop`, `Monitor`, `Phone`, `Printer`, `Server`,
`Tablet`, `Keyboard`, `Mouse`, `Headphones`, `Furniture`).

Ce que cela casse, et qui se voit :

- la fiche du type « Ordinateur portable » annonce **4 actifs** quand le parc en contient
  **89** ;
- aucun des 243 objets ne rejoint son type au catalogue ;
- les filtres par type listent des noms de feuilles ;
- les pictogrammes de catégorie retombent sur le glyphe par défaut.

**Le tableur, lui, porte la bonne information** : la feuille *Ordinateurs* a une colonne
`Categorie` qui vaut `Laptop` (66) ou `Desktop` (23) ; les feuilles réseau ont
`Type d'Equipement` (`Switch`, `Modem`, `Routeur`, `Gateway`, `Serveur`, `Access Point`,
`Pare-feux`). L'import ne les lit pas pour le type.

### Ce qu'une correspondance juste demande

| Ce que le tableur dit | Lignes | Clé du catalogue | Existe ? |
| --- | --- | --- | --- |
| Categorie = Laptop | 66 | `Laptop` | oui |
| Categorie = Desktop | 23 | `Desktop` | **non** |
| feuille Ecrans | 36 | `Monitor` | oui |
| feuille Phone | 67 | `Phone` | oui |
| feuille Imprimantes | 10 | `Printer` | oui |
| feuille Tablette | 6 | `Tablet` | oui |
| Serveur, NAS, Interco/Serveur | 7 | `Server` | oui |
| Switch | 9 | `Switch` | **non** |
| Access Point | 8 | `AccessPoint` | **non** |
| Pare-feux | 3 | `Firewall` | **non** |
| Modem, Routeur, Gateway, Chek Point | 5 | `NetworkDevice` | **non** |
| Vidéo-Projecteur | 2 | `Projector` | **non** |
| Station Accueil | 1 | `DockingStation` | **non** |

**Sept types manquent au catalogue**, dont un — `Desktop` — couvre 23 machines. C'est une
décision de référentiel : elle appartient au commanditaire, pas au script d'import.

## 4. Les autres écarts relevés

- **Aucun prix d'achat** : les 243 objets ont `purchasePrice` vide. Les Finances ne
  peuvent donc rien amortir. Le tableur ne porte pas la colonne ; il n'y a rien à
  corriger côté code.
- **Deux noms pour un lieu** : `Lomé` (32 objets, feuilles réseau) et `Lomé Siège` (211).
  C'est le même site.
- **16 objets en « Autre »** : le tableur le dit, rien dans la donnée ne permet de
  trancher. Ils gardent leur mot — voir `src/lib/equipmentStatus.ts`.
- **111 objets sans porteur** : normal, ce sont les disponibles, les retirés et le réseau.

## 5. Le quota Firestore — ce qui bloquait, et ce qui a été fait le 07/09

**La réparation est passée.** Le quota s'est remis à zéro à minuit heure du Pacifique, et
`node scripts/reparer-tout.mjs --apply` a été exécuté le 07/09. Ce que la base porte
maintenant, compté sur Firestore :

| Collection | Avant | Après |
| --- | --- | --- |
| `users` | 73 | **61** |
| `equipment` | 257 | **243** |
| `categories` | 8 | **13** |
| `models` | 6 | **110** |
| `approvals` · `events` · `financeExpenses` | 9 · 419 · 0 | **0 · 0 · 0** |
| `meta/locations` | 1 pays, 1 site | 1 pays, 1 site, **9 locaux** |
| `financeBudgets/2026` | absent | **42 700 000 XOF, 11 enveloppes** |

Trente-deux actifs portent un local ; les 211 autres n'en portent aucun, et c'est ce fait
qui a imposé la rangée « hors local » du second niveau de 16.1.

**Deux incidents pendant la passe, tous deux corrigés :**

- La première exécution s'est arrêtée après avoir *vidé* `categories` et avant de les
  réécrire — un échec transitoire du `bulkWriter` sur le premier document. La base est
  restée sans catégorie jusqu'à ce que l'import soit relancé. Une réparation qui vide
  avant d'écrire doit être relancée jusqu'au bout, pas abandonnée à mi-chemin.
- Le script vidait aussi les quatre collections `rbac*`. Ce sont des **définitions de
  droits**, pas de la donnée de démonstration : toutes les pages ont répondu « Accès
  refusé ». Le script ne les touche plus, et le produit repart de ses rôles par défaut
  quand le magasin n'en porte aucun.

### Ce que la console mesurait quand tout était bloqué

Toute lecture et toute écriture répondaient `RESOURCE_EXHAUSTED: Quota exceeded`.

**Ce que la console mesure** sur la période du 6 au 7 septembre (UTC−7) :

| | Consommé | Plafond du plan gratuit |
| --- | --- | --- |
| Lectures | **133 000** | 50 000 |
| Écritures | **20 000** | 20 000 |
| Suppressions | 893 | 20 000 |

**Les écritures sont exactement au plafond** : c'est la signature du défaut. L'application
réécrivait **la collection entière** à chaque changement d'état — confirmer une réception,
c'est modifier un équipement, et cela écrivait les 257 documents du parc. Quatre-vingts
gestes suffisaient donc à épuiser la journée. Corrigé le 06/09 : seul ce qui a changé est
écrit, soit environ **250 fois moins**.

**Les lectures viennent d'ailleurs** : chaque chargement de page hydrate une quinzaine de
collections, soit quatre à six cents lectures. Deux cent cinquante chargements — ceux du
travail de portage et de ses vérifications automatisées — expliquent les 133 000. C'est
le second chantier : ne pas tout relire à chaque montage.

Le quota se remet à zéro chaque jour à minuit, heure du Pacifique.

## 6. Ce que l'écran montre déjà, et ce qui reste à réparer en base

**Les deux ne sont plus la même chose.** Depuis le 06/09, l'application **écarte à la
lecture** toute ligne qu'elle reconnaît comme un élément de démonstration, et n'en écrit
plus aucune. Les écrans sont donc justes — 243 actifs, 62 comptes, aucune tâche
fantôme — **avant même** que la base soit nettoyée.

Ce qui reste en base : les 14 actifs, les 11 comptes et les 9 demandes de démonstration
que l'application y avait écrits. Ils n'apparaissent plus, mais ils occupent des
documents et fausseraient tout outil qui lirait Firestore directement.

### La commande, si la base doit être remise d'aplomb

```
node scripts/reparer-tout.mjs           # simulation : recompte, ne touche à rien
node scripts/reparer-tout.mjs --apply   # vide, réimporte l'inventaire et le budget
```

Elle vérifie d'abord que Firestore répond, vide les collections dérivées (demandes,
journal, dépenses — **pas** le RBAC, qui est de la configuration), relance l'import de
l'inventaire — qui vide et réécrit
`users`, `equipment`, `categories`, `models` et les emplacements —, importe le budget,
puis recompte. Trois commandes à retenir, c'était trois occasions d'en oublier une.

Ensuite, vider le stockage local du navigateur : les copies `tracker_*` gardent l'ancien
état jusqu'à la prochaine hydratation.

## 7. Les comptes : une personne, un compte, et un administrateur

**Deux personnes comptaient double.** La déduplication se faisait sur le nom **brut** :
« kafui Charbel EKLU » et « Kafui Charbel EKLU » donnaient deux comptes — avec la *même*
adresse générée —, et « Aichatou » / « Aïchatou BARRY-AHMED » de même. La clé est
désormais le nom normalisé (casse et accents repliés) : **59 comptes**, pas 61.

**Personne n'administrait le produit.** Le tableur ne dit rien des droits, donc l'import
posait `role: 'User'` sur les 61 lignes ; après le nettoyage du 07/09, aucun compte réel
n'ouvrait plus les écrans de gestion. Un registre `IDENTITES_DECLAREES` en tête de
`scripts/import-inventory.mjs` porte ce que la feuille ne porte pas — l'adresse réelle et
le rôle —, et il survit à chaque réimport. Il contient aujourd'hui une entrée :
**Kafui Charbel EKLU, `charbel.eklu@neemba.com`, SuperAdmin** (vérifié à l'écran : équipe,
catalogue, emplacements, inventaire, finances, rôles & accès).

> **Le produit ne vérifie aucun mot de passe.** `AuthContext` est un simulateur : il
> résout l'adresse dans le référentiel et ouvre la session, quel que soit le mot de passe
> saisi — le champ n'est contrôlé que sur sa présence. Il n'existe ni champ `password` sur
> `User`, ni empreinte, ni magasin d'identifiants. Un mot de passe communiqué aujourd'hui
> n'est donc **stocké nulle part**, et l'adresse seule suffit à entrer. C'est le chantier
> d'authentification, distinct du portage des planches.

## 8. Le budget 2026

`Budget 2026 - Togo.xlsx`, feuille **Budget** : **15 lignes**. La seizième n'en est pas
une — c'est le total, reconnaissable à sa catégorie vide ; la lire comme une ligne
doublait l'exercice à 85,4 M au lieu de 42,7 M.

| | XOF |
| --- | --- |
| Total de l'exercice | **42 700 000** |
| dont CAPEX | 20 790 000 |
| dont OPEX | 21 910 000 |

Regroupé en **11 enveloppes** par catégorie et par nature comptable — la maille que
l'écran des finances additionne. La plus lourde : la mise en conformité de la salle
serveur, 10 M. `spent` vaut zéro : un budget prévisionnel ne se présente pas comme
consommé, les dépenses réelles entrent par le journal (15.2).

La feuille **Références** n'est pas importée : ce sont des listes de saisie
(fournisseurs, sociétés, sites d'autres pays) qui ne décrivent pas ce budget-ci.
