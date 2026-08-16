# Emplacements — ce qu'il faut trancher avant de dessiner 09.2

Écrit le 05/08, après lecture de la capture du produit actuel (`screens/actuel/emplacements.png`,
393 px) et relevé des valeurs d'emplacement **dans les planches livrées**. L'ordre du catalogue est
repris : options d'abord, arbitrage, **puis** dessin.

---

## Ce qui est observé, et rien de plus

**Sur la capture du produit.** Trois cartes empilées — *Pays* (France, Sénégal, Togo), *Sites*
(Bureau Paris, Bureau Lyon), *Services* (IT, Marketing Europe, Finance) — chaque rangée portant un
crayon et une corbeille, puis une quatrième carte *« Récapitulatif de l'emplacement »* : hiérarchie
France → Bureau Paris → IT, **Responsable · Non assigné**, **8 équipements**, **8 utilisateurs**,
**Dernier audit · —**. Bouton flottant `+`.

**Les trois cartes sont en cascade, et c'est ce qui rend la capture partielle.** *Sites* ne montre
pas les sites du parc, il montre **ceux de France** — le pays sélectionné. Il n'y a donc **aucune
divergence** entre la capture et les planches sur les sites : *Bureau Dakar* n'est pas absent du
produit, il est sous *Sénégal*, non déplié. **Un écran en cascade ne s'inventorie pas sur une seule
capture** — c'est la même faute que la carte bornée du tableau de bord (§ registre, 05/08), sous une
autre forme.

**Ce que la capture dit d'elle-même.** Les deux compteurs sont suffixés
**« AU SITE — SERVICE NON RENSEIGNÉ »** : le troisième niveau est sélectionné, et **aucun des deux
nombres ne le concerne**. Le niveau existe dans l'arbre et ne porte aucune donnée.

**Dans les planches livrées** (relevé par recherche, 05/08) : *Bureau Paris*, *Bureau Dakar*,
**Salle serveurs** — cette dernière employée comme **pair d'un site** (feuille de filtre de 04.1
reprise en 09.1, création d'équipement 04.3, restitution 06.x). Les codes d'actifs portent
**HQ · SNG · TOG** (`LPT-HQ-01`, `SCR-SNG-02`, `MSE-TOG-02`). *Bureau Lyon* n'apparaît dans **aucune**
planche : un site sans aucun actif.

---

## A · Le **service** appartient-il à l'arbre des emplacements ?

Un service n'est pas un lieu. Aujourd'hui il est le troisième niveau d'une arborescence
géographique, et les fiches utilisateur l'écrivent comme un couple : *« Finance · Bureau Paris »*,
*« Support · Bureau Dakar »* — **deux axes, pas une descente**.

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **A1** | **Garder les trois niveaux.** Pays → Site → Service. | Le produit d'aujourd'hui. Un service par site : *Marketing Europe* sous *Bureau Paris* est une entité qui n'a rien de parisien, et *IT* devra être recréé sous chaque site. Les compteurs restent vides à ce niveau, comme la capture l'avoue. |
| **A2** | **Deux référentiels, deux écrans.** L'arbre garde la **géographie** (Pays → Site) ; le **service** devient un attribut de la personne, tenu là où on tient les personnes. | Le geste « créer un service » quitte cet écran. C'est un déplacement, pas une suppression — et il rend les compteurs vrais à tous les niveaux qui restent. |
| **A3** | **Le service reste affiché, en lecture seule** : un site liste ses services parce que ses utilisateurs en portent un, sans qu'on puisse en créer ici. | Une troisième carte qui n'est plus un niveau de l'arbre mais une **conséquence** — donc à ne jamais mettre en cascade avant le récapitulatif. |

**Recommandation : A2.** Un axe se juge à ce qu'il porte. Le pays et le site portent des actifs,
des utilisateurs et une campagne d'audit ; le service, de l'aveu de l'écran lui-même, ne porte rien.

---

## B · Faut-il un niveau **sous** le site ?

Les planches emploient **Salle serveurs** comme un emplacement, et l'arbre du produit n'a pas de
place pour elle : ce n'est ni un pays, ni un site, ni un service. `SVR-HQ-01` est *« en salle
serveurs »* dans trois planches — donc la valeur est déjà en circulation.

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **B1** | **Un quatrième niveau, facultatif : le local.** Site → *(local)*. Un site sans local reste valide. | Un niveau de plus à dessiner, mais **borné** : on ne descend pas sous le local. Il rend vrai ce que les planches disent déjà. |
| **B2** | **Le local n'est pas un emplacement** : c'est une précision de la fiche d'équipement, texte libre (04.3 porte déjà « Bureau Paris · 3ᵉ étage » sur une fiche utilisateur). | Aucun écran neuf. Mais on ne peut plus filtrer dessus, et la feuille de filtre de 04.1 **le fait déjà** — il faudrait retirer *Salle serveurs* de deux planches livrées. |
| **B3** | **« Salle serveurs » devient un site.** | Faux : elle est *dans* le Bureau Paris. Un site est une adresse ; deux sites à la même adresse cassent le seul usage vraiment établi — *« l'objet et son porteur sont sur le même site, aucun transport à prévoir »* (06.x). |

**Recommandation : B1.** C'est la seule qui ne demande pas de défaire une planche livrée, et le
niveau est facultatif — un parc mono-local ne le voit jamais.

---

## C · Cet écran **édite** le référentiel, ou **lit** le parc par lieu ?

Le produit actuel fait les deux à moitié : trois listes d'édition (crayon, corbeille) et un
récapitulatif de lecture, **2 142 px, trois écrans de haut**. La dette du tableau de bord est
ouverte depuis le 28/07 : *« le dashboard ne dit rien du où ; pour une entreprise multi-sites,
par emplacement décide probablement plus que par catégorie »*.

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **C1** | **Référentiel seul.** Une liste de sites, on en ouvre un pour le corriger. La lecture du parc par lieu se fait dans 04.1, par le filtre *Emplacement* qui existe. | L'écran devient court et sans ambiguïté. Le « où » du parc reste une question sans écran — mais il a déjà un **filtre**. |
| **C2** | **Référentiel + état du lieu.** La fiche d'un site porte ses compteurs, son responsable, sa dernière campagne d'audit, et **renvoie** vers 04.1 filtré. | Le récapitulatif du produit actuel, mais **sur la fiche du site** au lieu d'une quatrième carte suspendue sous trois cascades. Un renvoi, jamais un second inventaire. |
| **C3** | **Vue par emplacement à part entière** : répartition du parc par site, en tête de l'écran. | C'est un écran d'analyse. Il double *Rapports*, qui n'est pas dessiné, et crée la seconde vérité que le projet refuse partout. |

**Recommandation : C2.** Elle solde la dette du 28/07 sans créer d'écran d'analyse : le « où »
devient lisible par site, et le seul inventaire reste celui de 04.1.

---

## Ce que l'arbitrage débloque, et ce qu'il ne débloque pas

- **A** décide si *Rôles* (09.3) hérite d'un axe « service » pour ses périmètres, ou seulement d'un
  axe « site ». C'est la seule des trois qui touche l'écran suivant.
- **B** décide si la feuille de filtre de 04.1 garde *Salle serveurs* — donc si deux planches
  livrées bougent.
- **C** ne touche que 09.2.
- **Aucune des trois** ne dit *quelles langues* portera le référentiel (§5.8, ouvert) : un nom de
  site est de la **donnée saisie**, pas une nomenclature fermée.
