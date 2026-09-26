# REVUE FINALE AVANT PLANIFICATION — 2026-08-11

Quatrième passage, et le premier à croiser trois sources : le **code**, les **planches**, et des
**références externes** choisies d'après les manques relevés. Périmètre : **compact seulement**
(téléphone 393 px, tablette 600–840 px).

Le codebase reste une **référence fonctionnelle**. Ce document ne s'en sert que pour dire *ce que
chaque planche doit couvrir* — jamais à quoi elle doit ressembler.

**Ce que ce passage a changé par rapport au recadrage du matin :** il a trouvé **six écrans dont la
richesse fonctionnelle avait été sous-estimée**, **un patron structurant absent des 28 planches**
(les onglets), et il **ferme deux questions bloquantes** qui traînaient depuis le 28/07.

---

## 1 · Revue du code — l'inventaire corrigé

31 fichiers de page dans `src/features/*/pages/`, plus 5 écrans hors session : **36 écrans**, comme
au relevé du 07/08. Le nombre est bon. **C'est la profondeur de chaque écran qui était fausse.**

### 1.1 Le patron absent : les onglets

`PageTabs` est employé dans **10 vues**, pour **30 onglets** au total. **Aucune planche n'en dessine
un seul.**

| Vue | Onglets réels |
| --- | --- |
| `settings` | **5** — Affichage · Compte & Sécurité · Finances & Paramètres · Collecte automatique · Aide |
| `rbac` | **4** — Rôles & groupes · Permissions · Workflows · Affectations |
| `audit_details` | **4 + 2** — À scanner · Retrouvés · Manquants · Écarts (**avec badges de comptage**), sur deux onglets de niveau supérieur |
| `finance` | **3** — Synthèse Globale · Journal Dépenses · Pilotage Budget |
| `approvals` | 2 — En cours · Historique |
| `management` | 2 — Catégories · Modèles |
| `category_details` | 2 — Modèles · Tous les actifs |
| `user_details` | 2 — Aperçu & Sécurité · Équipements |
| `audit` | 2 — Vue globale · Détails campagne |

Une seule planche a **explicitement tranché** de les retirer : 05.2 argumente que les onglets
*Aperçu / Équipements* séparaient ce qui devait être lu ensemble. C'est un arbitrage recevable. Les
**neuf autres** ne l'ont pas pris : elles ont simplement dessiné le premier onglet et ignoré le
reste. Sur `settings` cela veut dire **un onglet sur cinq**, sur `rbac` **un sur quatre**.

### 1.2 Deux questions bloquantes fermées par le code

- **La sélection multiple existe déjà.** `ManagementPage` porte « Exporter la sélection » et
  « Supprimer la sélection » dans son `ListActionFab`. La question n°2 de `PASSATION.md` §9 — *la
  file permet-elle la sélection multiple ?* — est **fermée : oui**, et le patron est déjà écrit
  côté code. La planche 03.3 peut donc la dessiner sans attendre d'arbitrage.
- **Le geste de confirmation destructive est un contexte, pas un composant local.**
  `useConfirmation` est consommé par **9 vues** (inventaire, utilisateurs, fiche utilisateur,
  fiche équipement, emplacements, catalogue, RBAC, finances, audit). Il y a donc **une** vue de
  confirmation à dessiner, réemployée neuf fois — pas neuf dialogues.

### 1.3 Un composant qui n'existe que dans la vitrine

**`Snackbar` n'est employé nulle part dans `features/`** — uniquement dans
`DesignSystemGalleryPage`, le build DEV. Or la **forme 2 des clôtures** (« l'accusé en ligne »,
arrêtée le 31/07 pour la relance, le lien de mot de passe, l'écart signalé et l'invitation) repose
entièrement dessus. **La règle est dessinée, le composant est en vitrine, et aucun écran ne
l'appelle.** À trancher côté produit avant de porter les planches de flux.

### 1.4 Six écrans plus riches que leur planche

| Écran | Ce que le code contient réellement | Ce que la planche couvre |
| --- | --- | --- |
| `rbac` | 4 onglets · un **assistant de workflow en 4 étapes** (Workflow · Étapes · SLA · Validation) · **6 méthodes d'authentification** (mot de passe, 2FA, PIN, SSO, OTP, biométrie) · 4 actions automatiques (relance, escalade, validation auto, rejet auto) · profil effectif et **conflits de droits** · 4 états vides | les rôles et une matrice de permissions |
| `audit` · `audit_details` | filtres statut / pays / site / service · 4 onglets à compteurs · scan · `SideSheet` · `BottomSheet` · écarts · clôture de campagne · `ListActionFab` (Scanner, Clôturer) | **exclu du dessin le 05/08** |
| `approvals` | **8 statuts de workflow** (Validation Manager, Traitement IT, Validation dotation, Confirmation utilisateur, Refusée, Annulée, Terminée, inconnu) + 2 onglets | 06.5, livrée le 08/08, sans les 8 statuts |
| `finance` | **5 natures de dépense** (Achat CAPEX, Licence, Maintenance, Service, Cloud) · 3 statuts (Payée, En attente, Récurrente) · 3 onglets · `SideSheet` · 2 modales de saisie | 15.1 couvre la Synthèse et les Rapports |
| `management` | 2 onglets · tri par 4 critères · filtre par méthode d'amortissement · **10 actions de FAB** dont 4 de sélection | 09.1 s'arrête au type |
| `settings` | 5 onglets, dont **Collecte automatique** (agent GPO/Intune, clé d'API, fréquence de check-in) | 14.1 dessine une liste de réglages |

### 1.5 États et régimes — l'état réel du code

| Objet | Réalité mesurée |
| --- | --- |
| `EmptyState` | **12 emplois** dans 9 vues (RBAC en porte 4 à lui seul) |
| `ListActionFab` | **7 vues** — inventaire, utilisateurs, catalogue, emplacements, approbations, audit ×2 |
| `ConfirmationDialog` | **9 vues**, par contexte |
| `Snackbar` | **0 vue** — vitrine DEV seulement |
| Chargement | `LoadingSpinner` + `Skeleton` existent ; **aucune règle par vue** |
| Hors ligne | **aucune occurrence** de `navigator.onLine` |
| Cible tactile 48 px | **aucun utilitaire** — `IconButton` est à 40 × 40 dp avec une hit-box élargie |
| Régime tablette | `MEDIA.medium` employé dans **2 vues seulement** : `dashboard` et `assignment_wizard`. `MEDIA.belowExpanded` dans 5 autres |

---

## 2 · Revue UI/UX des planches — statut par planche

Six critères. **C** = couverture fonctionnelle contre §1 · **H** = hiérarchie visuelle · **DS** =
cohérence avec la direction 01.1 · **M** = modernité · **UX** = parcours, friction, clarté des
actes · **I** = icônes. Notation : ●●● tient · ●●○ à améliorer · ●○○ à repenser.

| Planche | C | H | DS | M | UX | I | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 02.1 Connexion | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | **conserver** — référence |
| 02.2 Première connexion | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** |
| 03.1 · 03.2 Tableau de bord | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** — régime tablette à porter |
| 06.1 Parcours d'attribution | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** |
| 06.2 La preuve | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** |
| 07.1 Mon compte | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** |
| 09.2 Fiche de modèle et imports | ●●● | ●●● | ●●● | ●●● | ●●● | ●●○ | **conserver** |
| 08 Lexique | s.o. | ●●● | ●●● | s.o. | s.o. | s.o. | **conserver** — documentation |
| 13.1 Les trois régimes | ●●○ | ●●○ | ●●● | ●●○ | ●●● | ●●○ | **conserver et étendre** — 3 gabarits sur 8 |
| 04.1 Liste équipements | ●●● | ●●● | ●●● | ●●● | ●●○ | ●●○ | **améliorer** — icônes de catégorie, entrée pré-filtrée |
| 04.3 Créer · corriger · importer | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●○○ | **améliorer** — erreurs de saisie, scan SN |
| 05.1 Liste utilisateurs | ●●● | ●●○ | ●●● | ●●○ | ●●○ | ●○○ | **améliorer** — aligner sur 04.1, ne pas réinventer |
| 05.3 Créer un compte | ●●● | ●●○ | ●●● | ●●○ | ●●● | ●●○ | **améliorer** — palier haut seulement |
| 06.3 Fins de flux | ●●○ | ●●○ | ●●● | ●●○ | ●●● | ●●○ | **améliorer** — porte les 3 mouvements de R6 |
| 06.4 Demander un équipement | ●●● | ●●○ | ●●● | ●●○ | ●●● | ●●○ | **améliorer** — palier haut |
| 12.1 États transverses | ●●○ | ●●○ | ●●● | ●●○ | ●●○ | ●○○ | **améliorer** — accueille les 5 états vides |
| 15.1 Finances et Rapports | ●●○ | ●●● | ●●● | ●●● | ●●○ | ●●○ | **améliorer** — 3 onglets, 5 natures de dépense |
| 03.3 Tâches | ●●○ | ●○○ | ●●○ | ●○○ | ●○○ | ●○○ | **repenser** — écran le plus vu, sélection multiple absente |
| 04.2 Détail équipement | ●●● | ●○○ | ●●○ | ●○○ | ●●○ | ●○○ | **repenser** — gabarit porteur de 5 planches |
| 04.4 Suite de l'incident | ●●○ | ●○○ | ●●○ | ●○○ | ●●○ | ●○○ | **repenser** |
| 05.2 Détail utilisateur | ●●● | ●○○ | ●●○ | ●○○ | ●●● | ●○○ | **repenser** — visuel seul, l'UX est tranchée |
| 05.4 Administrer un compte | ●●○ | ●○○ | ●●○ | ●○○ | ●●○ | ●○○ | **repenser** |
| 06.5 Arbitrer les demandes | ●○○ | ●○○ | ●●○ | ●○○ | ●○○ | ●○○ | **repenser** — 8 statuts absents, 10 chevrons |
| 09.1 Catalogue | ●○○ | ●○○ | ●●○ | ●○○ | ●●○ | ●○○ | **repenser** — 2 onglets, tri, sélection |
| 10.1 Emplacements | ●●○ | ●○○ | ●●○ | ●○○ | ●○○ | ●○○ | **repenser** — hiérarchie à 3 niveaux illisible |
| 11.1 Rôles et permissions | ●○○ | ●○○ | ●●○ | ●○○ | ●○○ | ●○○ | **repenser et étendre** — **le plus gros écart de couverture du projet** |
| 14.1 Paramètres | ●○○ | ●○○ | ●●○ | ●○○ | ●●○ | ●○○ | **repenser** — 1 onglet sur 5 · déjà démontré en 01.1 |

**Bilan : 9 à conserver · 8 à améliorer · 10 à repenser.**

### 2.1 Les trois défauts qui reviennent partout

1. **Le plafond typographique.** 16 planches ne dépassent pas 20–22 px. Sans palier haut, aucune
   hiérarchie n'est possible — c'est mécanique, pas une question de goût.
2. **La rangée à chevron comme réponse universelle.** 13 chevrons sur Paramètres, 10 sur Arbitrer,
   8 sur Demander. Le chevron dit « c'est ailleurs » ; répété, il dit « cet écran ne décide rien ».
   Sur Arbitrer — l'écran qui **décide le plus** — c'est un contresens.
3. **Les états non dessinés.** Chargement dans 3 planches sur 28, alors que le produit a 12
   `EmptyState` et deux composants de chargement. Aucune planche ne dessine un squelette.

### 2.2 Les planches manquantes

| Objet | Nature | Poids |
| --- | --- | --- |
| **`audit` · `audit_details`** | 2 écrans de production, **les plus riches du produit après le dashboard** — l'exclusion du 05/08 tenait à « déjà fait côté code », motif qui ne vaut plus | 2 planches |
| **Le scan** | une vue, **trois emplois** (numéro de série, code-barres, facture). Le geste est déjà dans le vocabulaire du produit | 1 planche |
| **Le chargement** | une règle, **trois formes** : liste, fiche, file | ½ planche, dans 12.1 |
| **Hors ligne** | absent du code *et* du dessin | ½ planche, dans 12.1 |
| **La confirmation destructive** | une vue, **neuf emplois** | ½ planche |
| **Liste pré-filtrée** | état de 04.1, pas une planche | — |
| **Explorateur de documentation** | route de production ; **1 décision** : dessiner ou exclure | 0 ou 1 |

---

## 3 · Références retenues, par thématique

Choisies d'après les manques de §1 et §2 — pas une revue de tendances.

### 3.1 Densité et hiérarchie sur mobile — pour le tableau de bord, Tâches, Finances

La contrainte mobile n'est pas un handicap à compenser mais une discipline : <cite index="13-1,13-3,13-4">chaque écran se concentre sur un seul groupe de métriques plutôt que de comprimer la vue desktop ; sur un projet Uber, les responsables d'opérations terrain avaient besoin de trois ou quatre métriques dans les cinq secondes suivant l'ouverture, et cette contrainte a produit une architecture d'information qui a ensuite clarifié la version desktop</cite>. C'est exactement notre cas : le tableau de bord porte le budget global seul et renvoie le détail à Pilotage.

Pour rendre un chiffre jugeable — le problème que le repère de rythme résolvait sur le dashboard : <cite index="10-1,10-2,10-3">valeur principale plus variation en pourcentage par rapport à une période de référence, petits graphes de tendance à côté du chiffre clé, et libellés qui qualifient l'état</cite>. Et le regroupement thématique paie à l'usage : <cite index="10-7,10-8,10-9,10-10">chaque bloc rassemble ce qui relève d'un même aspect, et après quelques semaines les utilisateurs cessent de « tout lire » pour naviguer par blocs</cite>.

Le cadrage qui tranche notre débat densité / respiration : <cite index="14-13,14-14,14-15">vers 2020 beaucoup d'équipes assimilaient la valeur à la densité — plus de widgets, plus de filtres, plus de graphes ; en 2026 cela se lit comme une pensée inachevée. Les utilisateurs attendent d'abord une priorisation, l'explication ensuite, et la profondeur brute seulement quand ils la demandent.</cite> Le test de coupe : <cite index="15-13,15-14">vos utilisateurs remarqueraient-ils la disparition d'une métrique demain ? Sinon, coupez-la maintenant.</cite>

**Ce qu'on en retient.** R1 (un porte-voix par écran) est confirmée. On y ajoute une règle : **un
chiffre qui ne se compare à rien ne se met pas en tête** — il lui faut un repère, une variation ou
un rythme, sinon il descend d'un cran.

### 3.2 Navigation — pour la barre du bas et les 30 onglets non dessinés

<cite index="26-1,26-2,26-3">La barre d'onglets fonctionne au mieux pour 3 à 5 destinations de premier niveau ; au-delà, les cibles sont trop proches et l'utilisateur déclenche la mauvaise.</cite> Nos quatre onglets plus « Plus » sont donc au bon format, et l'onglet « Plus » est un patron légitime : <cite index="25-15,25-16">quand les destinations ne tiennent pas derrière cinq entrées, on peut recourir à un onglet « Plus »</cite>.

Deux règles que nos planches enfreignent ou risquent d'enfreindre. D'abord : <cite index="25-6,25-7">mêler barre du bas et onglets peut créer la confusion, car leur rapport au contenu devient flou — les onglets partagent un sujet commun, les destinations de la barre du bas sont de premier niveau et sans lien entre elles</cite>. C'est précisément l'argument de la planche 05.2 pour supprimer *Aperçu / Équipements* : deux onglets qui ne portaient pas deux sujets. **Le test devient : deux onglets sont légitimes s'ils portent deux sujets ; sinon ils fusionnent.** Ensuite : <cite index="27-9,27-11">chaque icône de la barre du bas doit mener à une destination et non ouvrir un menu, et la barre ne doit pas porter de contrôles agissant sur l'écran courant</cite> — ce qui valide notre séparation entre la barre du bas et le `ListActionFab`.

Enfin, pour les compteurs de la file et des onglets d'audit : <cite index="27-5,27-6">un badge sur l'icône d'onglet signale une information nouvelle, et permet de communiquer sans intrusion</cite>. Le code d'`audit_details` porte déjà des badges de comptage sur ses quatre onglets ; aucune planche ne les dessine.

### 3.3 Chargement — la règle qui manque à 25 planches

<cite index="24-15,24-16,24-17">Un spinner est une animation générique qui n'indique ni quoi ni combien de temps ; un squelette est un gabarit à la forme du contenu qui laisse anticiper ce qui va s'afficher. On garde le spinner pour les actions courtes (moins d'une seconde), les durées imprévisibles comme un paiement, le retour d'un bouton après clic, ou quand la structure à venir n'est pas prévisible.</cite>

Le gain est mesuré, et il est perceptif, pas réel : <cite index="17-2,17-3,17-4,17-5">les squelettes ne réduisent pas le temps de chargement réel — ils changent la façon dont l'attente est vécue, avec une perception de 20 à 30 % plus rapide qu'un spinner</cite>. Et il se joue vite : <cite index="20-10,20-11">les utilisateurs tolèrent environ une seconde de silence complet avant de supposer une panne ; après trois secondes, l'abandon double</cite>.

**Ce qu'on en retient — la règle, en une phrase.** *Squelette quand on connaît la forme de ce qui
arrive, spinner quand on ne connaît que la durée.* Trois squelettes suffisent : **liste** (rangées),
**fiche** (héro + groupes), **file** (rangées à geste). Le spinner reste dans le bouton, jamais en
plein écran — sauf au démarrage de session, où il est déjà en place.

### 3.4 Sélection multiple et actions groupées — pour Tâches et Catalogue

Le patron canonique, et il répond à la question ouverte de la file à 999 demandes : <cite index="6-1">ce n'est qu'une fois des éléments sélectionnés que les boutons ou menus d'action deviennent actifs, ce qui conduit l'utilisateur dans le flux groupé sans le submerger</cite>. La référence à étudier : <cite index="12-10,12-11">GitHub Issues — un modèle de sélection clair, une barre d'actions groupées solide, une syntaxe de filtre puissante</cite>.

Un piège qui nous concerne directement, puisque tout est tactile : <cite index="12-24,12-25,12-26">les actions qui n'apparaissent qu'au survol sont invisibles aux utilisateurs clavier et tactiles — c'est un défaut d'accessibilité, pas une astuce d'espace</cite>. Et sur la densité des rangées : <cite index="12-18,12-19,12-20">réduire la taille du texte pour faire tenir plus de rangées échange la lisibilité contre le nombre ; il faut un mode de densité compact avec une typographie saine</cite> — ce qui confirme R5 : la densité vient du filet, pas du serrage.

**Ce qu'on en retient.** Une **barre d'actions groupées** qui remplace la barre du haut quand la
sélection est non vide, portant le compte (« 5 sélectionnés »), l'acte principal, le débordement, et
une sortie. Elle sert Tâches, Catalogue, Inventaire et Utilisateurs — **une vue, quatre emplois**.

### 3.5 Scan — la planche à créer

<cite index="38-4,38-5,38-6,38-7">Il faut aider au visée : l'utilisateur doit savoir que le scan est actif et à quelle distance tenir la caméra. Et le retour doit être immanquable — les environnements sont souvent bruyants et chargés, donc visuel, sonore et haptique à la fois.</cite> Le niveau de détail qui distingue un scan utilisable d'un scan pénible : <cite index="38-10">un délai de 150 millisecondes entre le retour de scan et la fermeture de la caméra</cite>.

Trois modes existent en standard, et notre produit en a besoin de deux : <cite index="42-3,42-4,42-5,42-6">le scan simple, optimisé pour un code à la fois, avec écran de confirmation possible ; et le scan par lot, qui enchaîne les codes sans refermer l'écran et peut compter les éléments</cite>. Le lot est ce dont l'audit physique a besoin ; le simple sert l'attribution, la restitution et la saisie de numéro de série.

**Ce qu'on en retient.** **Une vue de scan, deux modes** — *simple* (un objet, confirmation, retour
au flux) et *lot* (compteur qui monte, liste des scans, clôture explicite). Le retour est visuel **et**
haptique, et le mot scanné s'écrit toujours en clair avant d'être accepté.

---

## 4 · Planning priorisé

Sept vagues. L'ordre suit trois principes : **ce qui est transverse passe avant ce qui est local**,
**ce dont d'autres planches héritent passe avant elles**, et **la tablette passe en dernier** —
porter deux fois le même écran, c'est le refaire deux fois.

Unité d'effort : la **planche** (une planche livrée = 3 à 6 colonnes de 393 px).

### Vague 0 — les icônes · **1 passe mécanique**

Charger Phosphor dans les 28 planches, supprimer les 28 sprites locaux, remplacer les `<use>` par
`<i class="ph ph-…">`. Les 11 tracés divergents et les 13 épaisseurs disparaissent avec le set.
**À valider côté code en parallèle** : remplacer `MaterialIcon` par `@phosphor-icons/react`, ce qui
touche `DESTINATIONS`, `EmptyState` et `ConfirmationDialog`, où les noms passent en chaîne.

### Vague 1 — les quatre vues transverses · **2 planches**

Elles sont réemployées 20 fois au total. Les dessiner d'abord, c'est ne pas les dessiner vingt fois.

| # | Objet | Emplois | Direction UI |
| --- | --- | --- | --- |
| 1 | **La barre d'actions groupées** | 4 vues | Remplace la barre du haut dès que la sélection n'est plus vide (§3.4). Porte le compte en Archivo 20, l'acte principal en sombre, le débordement, et « Annuler ». **Aucun acte actif à sélection vide.** |
| 2 | **Les trois squelettes** | toutes | Liste, fiche, file (§3.3). Filets à la place du texte, aucune pulsation colorée, `aria-busy`. Le spinner reste dans le bouton. |
| 3 | **La confirmation destructive** | 9 vues | Une vue, trois natures (supprimer, suspendre, refuser). Le nom du sujet dans la question, jamais « cet élément ». Le geste destructeur en `#B3261E`, jamais en jaune. |
| 4 | **Le scan** | 3 emplois | Deux modes, simple et lot (§3.5). Cadre de visée, retour visuel + haptique, valeur lue en clair, 150 ms avant fermeture. |

### Vague 2 — les trois gabarits porteurs · **3 planches**

| # | Planche | Direction UI, et ce qu'elle fait hériter |
| --- | --- | --- |
| 5 | **04.2 Détail équipement** | Héro en **image voilée** : référence en micro-libellé, **nom du modèle à 28 px Archivo**, état en pictogramme + couleur, et **trois qualifiants chiffrés** sur un filet interne — aujourd'hui dispersés dans trois cartes. Un seul geste jaune + débordement. Historique en groupe à filets à pictogrammes d'acte. **Hérité par 05.2, 09.1, 09.2, 10.1, `audit_details`.** |
| 6 | **03.3 Tâches** | L'écran le plus vu : destination unique de tous les liens du dashboard. Pas de héro (aucun sujet) mais un **compteur porte-voix à 34 px** avec son repère — « 17 choses vous attendent, 5 depuis plus d'une semaine » : un compteur sans repère ne se juge pas (§3.1). Filtres en puces sombres. **Sélection multiple dessinée** (§1.2), branchée sur la barre de la vague 1. Rangées à 48 px, geste secondaire à droite, **jamais au survol** (§3.4). |
| 7 | **05.1 Liste utilisateurs** | Gabarit « liste » commun avec 04.1, déjà à niveau : **aligner, ne pas réinventer**. Avatar 36 px sur rond sombre, nom à 15, appartenance en secondaire, état en pictogramme à droite. Recherche et puces dans un bloc collant. `ph-magnifying-glass-minus` à 32 pour « sans résultat ». |

### Vague 3 — les onglets, et les écrans qu'ils débloquent · **5 planches**

C'est la vague qui ferme le trou de couverture de §1.1. Règle de dessin retenue : **deux onglets
sont légitimes s'ils portent deux sujets ; sinon ils fusionnent** (§3.2).

| # | Planche | Direction UI |
| --- | --- | --- |
| 8 | **14.1 Paramètres** | **Déjà démontrée en 01.1** pour la mise en forme ; il reste à porter les **5 onglets**. Onglets à 44 px, un sujet par onglet, groupes à filets, valeur du réglage à droite de la rangée. L'onglet *Collecte automatique* n'a jamais été dessiné : agent, clé d'API, fréquence, dernière remontée. Aucun jaune — cet écran n'engage rien. |
| 9 | **09.1 Catalogue** | 2 onglets (Catégories · Modèles), tri par 4 critères, filtre par méthode d'amortissement, **sélection multiple** de la vague 1. Chaque type = une rangée, décompte tabulaire à droite, `ph-folder-open` à 32 pour le référentiel vide. Les **8 pictogrammes de catégorie** vivent ici. |
| 10 | **06.5 Arbitrer les demandes** | À refaire : c'est l'écran qui décide le plus et le montre le moins. **Valider / Refuser en gestes de rangée**, pas en navigation. Les **8 statuts de workflow** doivent apparaître — en 2 onglets (En cours · Historique) et en pictogramme d'étape, pas en huit couleurs. Porte-voix = le nombre en attente, avec l'ancienneté du plus vieux. |
| 11 | **15.1 Finances — les 3 onglets** | La Synthèse et les Rapports sont à niveau. Ajouter **Journal** et **Pilotage**, les 5 natures de dépense et les 3 statuts. Chaque filet de consommation porte son **repère de rythme** — la règle du dashboard, appliquée là où le chiffre naît (§3.1). |
| 12 | **11.1 Rôles et permissions** | **Le plus gros écart du projet.** 4 onglets, un **assistant de workflow en 4 étapes**, **6 méthodes d'authentification**, 4 actions automatiques, les **conflits de droits**, 4 états vides. La matrice est le seul endroit où le tableau se justifie ; tout le reste est en groupes à filets avec interrupteurs. À découper en **2 planches** si l'assistant résiste. |

### Vague 4 — les fiches et les flux · **4 planches**

| # | Planche | Direction UI |
| --- | --- | --- |
| 13 | **05.2 Détail utilisateur** | L'UX est déjà tranchée (onglets fusionnés à raison) : **c'est un travail visuel**. Héro de 04.2, nom à 28 px, avatar en rond sombre 56 px, rôle et site en micro-libellé. Les trois états de compte se disent par **inversion du héro**, jamais par un bandeau. |
| 14 | **05.4 Administrer un compte** | Même héro, mêmes actes. `ph-bell-ringing` sur relancer, `ph-dots-nine` sur réinitialiser le code. Branchée sur la confirmation de la vague 1. |
| 15 | **10.1 Emplacements** | **Un niveau par écran** — pays, site, local — fil d'Ariane dans la barre du haut, décompte à droite, porte-voix = le niveau courant à 28 px. La hiérarchie à trois niveaux est ce que la réplique rend illisible. |
| 16 | **04.4 Suite de l'incident** · **06.3 Fins de flux** | Les deux planches où **R6 se voit** : les trois mouvements (feuille 220 ms, bandeau 160 ms, pression 90 ms) s'écrivent ici une fois. **Sous réserve de la décision `Snackbar`** (§1.3) : si le composant reste inutilisé côté code, la forme 2 des clôtures n'a pas de porteur. |

### Vague 5 — les manquants · **3 planches**

| # | Objet | Direction UI |
| --- | --- | --- |
| 17 | **`audit` — vue globale** | 2 onglets, filtres statut / pays / site / service, totaux Attendus · Scannés · Manquants · Écarts en chiffres tabulaires. Le porte-voix est **l'écart**, pas le total : c'est lui qui décide. |
| 18 | **`audit_details` — la campagne** | 4 onglets **à badges de comptage** (§3.2), branchés sur le scan en **mode lot** de la vague 1. Les écarts en trois natures, motif obligatoire. Clôture de campagne = forme 3 des clôtures (un écran, le sujet disparaît). |
| 19 | **12.1 États — complétée** | Accueille les **5 états vides** à 32 px, les **3 squelettes**, et **hors ligne** — le seul état où dessin et code sont tous deux vides. |

### Vague 6 — la tablette · **2 planches**

Le régime **medium 600–840** pour les 5 gabarits restants : tableau de bord, assistant, formulaire
plein écran, file, référentiel. La loi est écrite en 13.1 et démontrée sur 3 gabarits sur 8. Le code
ne connaît `MEDIA.medium` que dans 2 vues (§1.5) : **le dessin est ici en avance sur le produit**, et
c'est la bonne façon d'arriver.

### Récapitulatif

| Vague | Contenu | Effort |
| --- | --- | --- |
| 0 | Icônes — passe mécanique sur 28 planches | 1 passe |
| 1 | 4 vues transverses (20 emplois) | 2 planches |
| 2 | 3 gabarits porteurs | 3 planches |
| 3 | Les onglets — 5 écrans débloqués | 5 à 6 planches |
| 4 | Fiches et flux | 4 planches |
| 5 | Audit ×2 et états complétés | 3 planches |
| 6 | Régime tablette | 2 planches |
| | **Total** | **19 à 20 planches + 1 passe** |

---

## 5 · Les quatre décisions qui conditionnent le planning

1. **`Snackbar`** — le composant n'est appelé par aucun écran du produit (§1.3), alors que la forme 2
   des clôtures repose entièrement dessus. Ou le produit l'adopte, ou la règle des clôtures perd son
   deuxième cas. **Bloque la vague 4.**
2. **`audit` et `audit_details`** — l'exclusion du 05/08 tenait à « déjà fait côté code ». Ce motif
   ne vaut plus, et ces deux écrans sont les plus riches du produit après le dashboard.
   **Bloque la vague 5.**
3. **`11.1` en une ou deux planches** — le RBAC réel porte 4 onglets, un assistant en 4 étapes et
   6 méthodes d'authentification. Une seule planche tiendra difficilement. **Décide l'effort de la
   vague 3.**
4. **Phosphor côté produit** — remplacer `MaterialIcon` par `@phosphor-icons/react`. **Bloque la
   vague 0**, donc tout le reste.
