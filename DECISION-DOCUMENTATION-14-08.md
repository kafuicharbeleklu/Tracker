# DÉCISION — l'explorateur de documentation : exclu du périmètre de dessin

**14/08/2026.** Dernière décision ouverte du planning du 11/08 (§4, « route de production ; 1 décision :
dessiner ou exclure »). **Décision : exclure.** Zéro planche.

---

## 1 · Le motif d'inscription ne tient pas : ce n'est pas une route de production

`DocumentationExplorerPage.tsx` (478 lignes) est **exporté et jamais importé**. Une recherche sur
`DocumentationExplorer` et sur `/documentation` dans tout `src/` ne rend que trois occurrences, toutes
dans le fichier lui-même : sa définition, son `export default`, et une ancre interne
`href="#/documentation/ui-flow-map"` qui pointe sur une route **qu'aucun routeur ne déclare**.

Aucune vue du produit n'y mène. Aucun rail, aucune barre du bas, aucun réglage. **Personne ne peut y
arriver**, et l'ancre du logo est un lien mort vers lui-même.

## 2 · Son contenu n'est pas destiné à l'utilisateur

La page rend `UI_FLOW_MAP.md?raw` — un document d'**architecture interne** : 33 écrans, leurs
transitions, 10 points d'audit, et les noms de fichiers source (`LoginPage.tsx`,
`Sidebar.tsx · NavigationRail.tsx`). Son lecteur est l'équipe, pas le gestionnaire de parc.

Un graphe de parcours avec ports d'entrée et de sortie, mini-carte, mode déplacement de nœuds et
inspecteur d'arête est un **outil de conception**. Le dessiner comme un écran du produit reviendrait à
livrer notre propre plan de travail dans l'application.

## 3 · Ce que le dessiner coûterait, et à quoi cela servirait

Le gabarit n'existe pas dans le système : un **canevas pannable à nœuds** n'est ni une liste, ni une
fiche, ni un flux, ni un référentiel. Il faudrait un neuvième gabarit, ses règles de zoom, de
sélection, de survol d'arête, son régime tactile — pour **un écran, hors du parcours, sans
utilisateur**. C'est le rapport coût/emploi exactement inverse de celui qui a fait dessiner les vues
transverses (une vue, vingt emplois).

## 4 · Ce que l'exclusion ne couvre pas — et qui reste un vrai manque

L'exclusion porte sur **cet écran-là**. Elle ne dit rien du besoin d'aide de l'utilisateur, et le
produit y a un défaut mesuré, ailleurs :

**Le « Centre d'aide » de `SettingsPage.tsx` porte quatre tuiles mortes** — *Documentation*,
*Support*, *Tutoriels*, *FAQ*. Ce sont des `<Button variant="outlined">` **sans `onClick`** : elles
ont l'apparence exacte d'un geste et ne font rien. Quatre promesses, zéro destination.

Ce n'est pas une planche de plus : le Centre d'aide est **une section de la page Paramètres**, donc un
état à dessiner **dans** la planche 14.1 — ou quatre lignes à retirer, si le produit n'a rien derrière.
La question est de contenu, pas de dessin : *y a-t-il une documentation utilisateur à ouvrir ?* Tant
qu'on ne le sait pas, dessiner les tuiles serait dessiner une promesse qu'on ne peut pas tenir.

## 5 · Conséquence sur la couverture

Le périmètre passe de **36 à 35 écrans**, dont **30 couverts**. Les 5 restants sont ceux que le
recadrage du 11/08 avait déjà écartés avec leur motif ; l'explorateur les rejoint, motif écrit.

**Le planning du 11/08 est clos : sept vagues, zéro décision ouverte.**
