# Revue de logique des planches — 15 août 2026

## Conclusion courte

L'impression de doublon est fondée, mais pas à l'endroit le plus apparent :

- **03.2 « À traiter » et 03.3 « Tâches » ne sont pas un doublon.** La première est
  l'aperçu borné du tableau de bord ; la seconde doit être la file de travail complète.
- **03.3 « Tâches » et 06.5 « Arbitrer les demandes » entrent réellement en collision.**
  Ce sont deux files actives sous le même onglet de navigation, avec deux promesses
  différentes et aucun contrat qui les relie.
- **04.1 « Équipements » et 17.3 « Attente et scan » redéfinissent tous deux le
  scanner.** Le premier dessine six états ; le second n'en définit que deux modes et
  se présente comme l'unique référence.

Le système doit préciser pour chaque planche si elle est une **référence de composant**,
une **page de produit**, un **pattern local** ou une **étape de flux**. Aujourd'hui, ces
quatre niveaux sont mélangés dans les mêmes groupes.

## 1. Le cas « Tâches »

### Ce qui n'est pas un doublon : 03.2 → 03.3

`dashboard-2-atraiter-piste.html` fixe la zone **À traiter du dashboard** : trois
rangées maximum, puis une redirection. Elle dit explicitement que le tableau de bord
ne devient jamais une file. `dashboard-3-taches-piste.html` fixe la **file entière** :
tri par ancienneté, filtres, arrivée pré-filtrée, pagination au-delà de 999 et état vide.

La relation correcte est donc :

```text
Dashboard / À traiter (aperçu et priorisation)
                │
                └──► Tâches (file complète et traitement)
```

À conserver, mais à rendre plus explicite dans le manifeste : 03.2 est un *pattern de
dashboard*, pas une destination indépendante. Son titre peut devenir « Aperçu des
tâches sur le tableau de bord » pour retirer toute ambiguïté.

### Le vrai doublon : 03.3 ↔ 06.5

| Planche | Ce qu'elle promet | Ce qui crée le conflit |
| --- | --- | --- |
| 03.3 `Tâches — la file` | « destination unique » des liens du dashboard et de la moitié des flux ; une tâche attend mon geste et disparaît quand il est fait. | Onglet bas **Tâches** actif, filtres nature/ordre/portée, action directe sur les rangées. |
| 06.5 `Arbitrer les demandes` | File des décisions à prendre et demandes à suivre, avec validation/refus, historique et état vide. | Même onglet bas **Tâches** actif, mais une seconde file, ses propres sections et ses propres règles de tri. |

Le conflit devient direct dans `attribution-4-demander-piste.html` : après l'envoi,
la réponse est annoncée « dans **Tâches** » et la demande existante ouvre « la file des
tâches filtrée sur lui ». Or 06.5 dessine précisément le suivi des demandes et les
décisions de validation. Une personne ne peut pas savoir quelle destination est la vraie
source de suivi.

Il faut choisir un modèle.

### Modèle recommandé : une boîte de travail unique

Conserver l'onglet **Tâches** et en faire le conteneur unique :

```text
Tâches
├── À faire        réceptionner, valider, arbitrer une demande, valider une machine
├── À suivre       mes demandes en cours, demandes de mon équipe sans action possible
└── Historique     demandes et tâches terminées/annulées
```

- 03.3 devient la planche maîtresse de cette boîte de travail.
- 06.5 ne garde plus une deuxième page de liste : elle devient le **détail de demande
  et les gestes d'arbitrage**, ouvert depuis une ligne de Tâches.
- Les machines détectées que 14.1 envoie vers Tâches deviennent une nature de tâche,
  au même niveau que réception ou validation.
- La fiche détail peut conserver ses règles spécifiques (motif, gardes, renvoi à l'IT),
  sans recréer une navigation ni une file concurrente.

L'alternative est de créer une destination distincte **Demandes**. Dans ce cas, 03.3 ne
peut plus affirmer être l'unique file, 06.4 ne peut plus envoyer les demandes vers
Tâches, et le libellé/la navigation doivent rendre la séparation visible. C'est moins
cohérent avec la barre actuelle, qui porte déjà « Tâches » comme inbox de travail.

## 2. Les autres incohérences de planches

| Priorité | Collision ou trou | Constat | Arbitrage attendu |
| --- | --- | --- | --- |
| P1 | Scanner : 04.1 ↔ 17.3 | 17.3 se présente comme l'unique vue de scan avec deux modes (simple, lot). 04.1 redessine un scanner complet à six états (ouverture, code-barres, QR, création, lot, inconnu). | Une seule machine d'états `ScanView` : **mode** (recherche simple / saisie simple / lot) + **état** (lecture, reconnu, inconnu, création nécessaire, progression). 17.3 porte la référence ; 04.1 ne montre que le point d'entrée et la destination après lecture. |
| P1 | File de tâches non exhaustive | 14.1 déplace les « machines détectées à valider » dans 03.3. Mais 03.3 ne dessine ni cette nature ni sa place dans les filtres et états. | Ajouter une matrice des natures de tâche dans la référence Tâches, avec propriétaire, action, destination, tri et vide. |
| P2 | Navigation des formulaires : 00.5 ↔ 06.4 | 00.5 affirme que l'assistant et le formulaire plein écran masquent la navigation. 06.4 montre une demande dans une feuille, sur une page qui conserve la barre du bas. | Nommer deux formes : **flux plein écran** (sans navigation) et **feuille dans une destination** (navigation visible en arrière-plan, non interactive). La règle de 00.5 ne doit s'appliquer qu'à la première. |
| P2 | Référence partagée versus démonstration locale | 17.2 et 17.3 disent que confirmation, sélection, attente et scan sont dessinés une fois. Certaines planches de page reprennent néanmoins de larges fragments pour les contextualiser. | Une planche de page peut montrer une instance contextualisée, mais ne doit pas redéfinir le style ou les états du composant. Ajouter un lien `uses: 17.2` / `uses: 17.3` dans chaque en-tête concerné. |

## 3. Les ressemblances qui sont déjà correctement séparées

Ces paires peuvent sembler dupliquées, mais les planches expliquent correctement leur
frontière. Il ne faut pas les fusionner.

| Paires | Frontière correcte |
| --- | --- |
| 07.1 `Mon compte` / 05.4 `Administrer le compte d'une personne` | Mon propre compte contre l'administration du compte d'autrui. Les actes, l'autorité et les conséquences sont différents. |
| 07.1 `Mon compte` / 14.1 `Paramètres` | Paramètres ne doit être qu'un point d'entrée vers Mon compte, pas un second formulaire. |
| 16.1 `Audit — vue globale` / 16.2 `Audit — campagne` | La première désigne le périmètre et la campagne à ouvrir ; la seconde mène le scan et tranche les écarts. |
| 03.2 `À traiter` / 03.3 `Tâches` | Aperçu limité et priorisation contre file complète et action. |

## 4. Organisation des planches à stabiliser

Ajouter quatre métadonnées obligatoires au commentaire `@dsCard` :

```text
kind: reference | page | pattern | flow
owns: nom(s) du composant ou de la destination dont la planche est propriétaire
uses: référence(s) dont elle reprend une instance
entry: route(s) ou planche(s) qui y mènent
```

Exemples :

- 03.2 : `kind: pattern`, `owns: dashboard-task-preview`, `entry: dashboard`.
- 03.3 : `kind: page`, `owns: task-inbox`, `uses: filter-sheet`.
- 06.5, après arbitrage : `kind: flow`, `owns: approval-decision-detail`,
  `entry: task-inbox`.
- 17.3 : `kind: reference`, `owns: ScanView, loading-states`.

Cette convention empêcherait qu'une planche soit à la fois une page, une règle globale
et une copie de composant — qui est la cause des doublons ressentis aujourd'hui.

## Ordre de correction

1. Décider si **Tâches est l'unique boîte de travail**. Reclasser 06.5 en conséquence.
2. Déplacer la spécification complète du scanner vers 17.3 et faire de 04.1 un consommateur.
3. Déclarer les catégories de planche dans le manifeste et sur chaque en-tête.
4. Compléter la matrice des natures de tâche, notamment la collecte automatique.
5. Clarifier « formulaire plein écran » versus « feuille dans une page ».

Ce nettoyage doit précéder toute adaptation de l'UI : sinon la même fonctionnalité sera
implémentée à deux endroits, avec des parcours et états différents.
