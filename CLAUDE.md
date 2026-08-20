# TRACKER — consignes permanentes

## Gestion des planches
- **Édition en place, jamais de duplication.** Une page du produit = une seule planche dans `screens/`. Pour refondre un écran, on modifie la planche existante ; on ne crée pas de copie « v2 » ni de variante à côté.
- Exception unique : une comparaison avant/après explicitement demandée par l'utilisateur.
- **Pas de planche « Référence — UI actuelle ».** Le codebase du tracker (dossier local `TRACKER/`) fait foi comme référence fonctionnelle et visuelle de l'existant. Inutile de le redupliquer en planche.
- Les pistes abandonnées vont dans `screens/archive/` sans `@dsCard`.

## Une page = une planche, et ses états dedans
- **Une planche par page du produit.** Ses états et ses vues se dessinent **à l'intérieur** de cette planche, en colonnes légendées — jamais en planches séparées, jamais en variantes concurrentes.
- **Trois préfixes de légende interne, et pas d'autre :**
  - `État — …` un état de la même vue (au repos, sélection active, vide, erreur, un objet ouvert)
  - `Vue — …` la même page vue par un autre rôle, ou dans un autre emploi (gestionnaire / utilisateur final, choisir un destinataire)
  - `Relevé — …` ce que le produit actuel porte, montré pour être écarté
- **Jamais `Piste — …`** : une piste est une proposition en attente d'arbitrage. Une planche livrée n'en contient pas ; le choix est fait, la légende le dit.
- Une planche séparée **seulement** si l'état est un écran à part entière dans le produit, pas un état de la même vue.
- **Les trois préfixes ne s'appliquent qu'aux planches de page.** Le groupe `00. Références du système` en est **exempt** : ses colonnes sont des chapitres (la palette, l'échelle, les icônes), pas des états d'une vue — aucun des trois mots n'y serait vrai. Le contrôle mécanique n'y compte donc pas les légendes. Arbitré le 14/08 ; le détail est dans `REGLES-TRANSVERSES.md` §A.
- **`.collab` est réservé à la légende d'une colonne.** Un sous-titre à l'intérieur d'une colonne porte `.subh` — sinon le contrôle mécanique des préfixes le compte comme une légende et devient faux. Relevé du 12/08 : 5 sous-titres empruntaient `.collab`, et 71 légendes sur 20 planches n'avaient jamais reçu leur préfixe (la passe du 12/08 n'avait requalifié que les « Piste — »).

## Trois natures de planche, et le groupe le dit
- `00. Références du système` — pas des pages : la direction de forme, le lexique, les régimes.
- `NN. <Domaine>` — les pages du produit, une planche chacune.
- `17. Composants partagés` — un composant dessiné **une seule fois** pour N écrans, avec le nombre d'emplois dans le nom. Une planche de page ne le redessine jamais : elle y renvoie.

## Nommage des cartes
- `@dsCard` en première ligne, groupe numéroté `NN. Nom du groupe`, nom `NN.N Titre`.
- Un même groupe doit porter exactement le même libellé sur toutes ses planches.

## Le viewport d'une carte se mesure, il ne s'estime pas
- `viewport="LxH"` est **obligatoire** sur toute `@dsCard`, et sa hauteur doit être la hauteur réelle du document rendu **à la largeur déclarée**, plus ~80 px de marge.
- Le harnais `scraps/mesure-viewports.html` mesure les 31 planches d'un coup : à relancer après toute planche modifiée, et **toujours** après avoir réécrit une carte.
- Relevé du 12/08 : 13 planches sur 31 étaient coupées (jusqu'à 2 059 px pour le lexique), 2 n'avaient aucun `viewport`. Cause unique : la valeur avait été écrite à la main.

## Règles transverses
Voir `REGLES-TRANSVERSES.md` (icônes I2/I3, hiérarchie de héro R3, etc.) — elles s'appliquent aux 28 écrans, pas seulement à la planche en cours.
