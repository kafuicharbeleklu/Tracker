# Passation — chantier design mobile Tracker

## 0. Avertissement de lecture — la numérotation de ce journal est **historique**

Ce document est un **journal daté** : ses numéros de planche et ses noms de fichiers sont ceux
qui avaient cours au moment de l'écriture, et ils n'ont **pas** été réécrits — réécrire un
journal, c'est en perdre la valeur de preuve. Le volet a été renuméroté le 31/07 (§17).
Pour lire ce document, la correspondance est la suivante :

| Ce journal dit | La planche s'appelle | Fichier |
| --- | --- | --- |
| planche 4 | **04.2** | `equipement-2-detail-piste.html` |
| planche 7 · 9 | **06.1** | `attribution-1-parcours-piste.html` |
| planche 8 | **05.2** | `utilisateur-2-detail-piste.html` |
| planche 10 | **05.3** | `utilisateur-3-creation-piste.html` |
| planche 11 | **05.4** | `utilisateur-4-compte-piste.html` |
| planche 12 | **03.2** | `dashboard-2-atraiter-piste.html` |
| planche 13 | **08** | `lexique-piste.html` |
| planche 14 | **06.2** | `attribution-2-preuve-piste.html` |
| planche 15 | **06.3** | `attribution-3-fins-de-flux-piste.html` |
| planche 16 | **03.3** | `dashboard-3-taches-piste.html` |
| planche 17 | **07.1** | `mon-compte-piste.html` |

**Les documents normatifs, eux, ont été réécrits** : `REGLES-TRANSVERSES.md`, `AUDIT-UI.md` et
`LEXIQUE.md` ne désignent plus les planches que par leur numéro actuel. Un registre qui désigne
mal ne se fait pas lire.

Document de reprise. Écrit le **2026-07-26**, mis à jour le **2026-07-30** (Dashboard, Détail équipement,
Liste équipements et **Liste utilisateurs** validés ; planches Attribuer/restituer, Workflow et Détail utilisateur
livrées ; **passe d'assainissement du 30/07 au soir** : bloc dupliqué supprimé, groupes 7 et 9 fusionnés, vignettes
harmonisées, et les **quatre vues manquantes des équipements** + le **parcours de création de compte** dessinés).
À lire en entier avant de toucher à quoi que ce soit dans ce projet.

---

## 1. De quoi il s'agit

**Tracker** est une application interne de suivi de parc informatique pour **Neemba**
(multinationale, plusieurs pays — ne jamais nommer un pays dans l'interface). React 19 +
TypeScript + Vite 6, Tailwind v4, interface en français, dépôt local, branche
`feat/tracker-ds-namespace`.

Le chantier en cours : **refondre l'interface mobile (< 600 px), écran par écran.**

Ce projet Claude Design sert à **décider** de la forme avant d'écrire du React. Il n'est
pas la source de vérité : celle-ci reste le code (`index.css` pour les valeurs,
`DESIGN_SYSTEM.md` pour le nommage, `DESIGN_BRIEF.md` pour l'ADN mobile).

## 2. Méthode de travail convenue avec l'utilisateur

Elle a été négociée, corrigée en cours de route, et elle est **contraignante** :

1. **Tous les écrans sont dessinés ici d'abord.** L'implémentation React se fera ensuite
   en **une seule vague**, pas écran par écran. Décision prise en cours de chantier après
   qu'un premier écran (Audit) a été implémenté directement en code.
2. **Un écran à la fois.** L'utilisateur refuse qu'on charge plusieurs chantiers en
   parallèle : « on ne progresse pas et il y a beaucoup de tâches inachevées ».
3. **~~Chaque écran est livré avec la réplique de l'existant à côté~~** — **règle amendée le 30/07 par
   l'utilisateur**, pour économiser la génération : **on ne reprend plus l'état actuel en colonne dans
   chaque nouvelle piste.** Les captures vivent une seule fois dans `screens/actuel/` ; la planche les
   **nomme** en une ligne (« défauts relevés sur `actuel/x.png` ») et va droit à la proposition. Ce
   document reste le lieu où les défauts de l'existant sont écrits. *Historique : les planches livrées
   avant l'amendement gardent leur colonne « État actuel » — on ne les refait pas.*
4. **Lire le code avant de proposer.** L'utilisateur l'a demandé explicitement : « si tu
   avais réellement bien lu la documentation du projet… ». Poser des questions est bien,
   mais après avoir cherché la réponse soi-même.
5. **Chaque écran répond d'abord à trois questions**, avant le moindre pixel : à qui il
   sert, quelle décision la personne y prend, ce qu'elle fait juste après. Si on ne sait
   pas répondre, on ne dessine pas.
6. **Ne consigner comme tranché que ce que l'utilisateur a dit explicitement.** Voir §7.
7. **Une planche = une vue, un fichier, un groupe de cartes numéroté** dans l'ordre du parcours.
   Voir la hiérarchie en §3.

## 3. Où sont les choses

**Projet Claude Design : « Tracker — Neemba Togo »**
`3eb16569-439b-4f3f-b5ec-e88f30adcd99`

Deux autres projets existent et **ne servent à rien ici** : « Design System » (vidé, ne
contient plus que ses fichiers techniques) et « Modernist » (kit de démarrage générique
fourni, sans rapport avec Tracker).

```
readme.md                          règles + palette + règle de rangement
PASSATION.md                       ce document — la seule source de vérité des arbitrages
thumbnail.html                     vignette du projet

screens/
  actuel/                          RÉFÉRENCE, jamais recopiée ailleurs
    <ecran>.html                   15 cartes, une par écran actuel (groupe « 1. UI actuelle »)
    <ecran>.png                    captures d'écran (393 px, hauteur réelle)
    <flux>-<n>-<etape>.png         captures d'un flux modal (ex. attribuer-1-equipement.png)

  <famille>-<vue>-piste.html       LES PLANCHES — une par vue, c'est le livrable
  <famille>-<vue>-actuel.html      † obsolète : ne plus en créer (Login/Dashboard gardés)
  dashboard-analyse.md             analyse de code d'un écran (modèle à suivre si besoin)

  tweaks-panel.jsx                 panneau de réglages (starter) — partagé par toutes les planches
  image-slot.js                    emplacements photo remplissables
  archive/                         tout ce qui est écarté (perd son @dsCard)

uploads/                           logo Neemba, photos terrain, motifs LIVE, captures reçues
```

### Nommage et numérotation — à tenir jusqu'à la fin du chantier

**Fichier** : `screens/<famille>-<vue>-piste.html`. Familles utilisées : `login`, `dashboard`,
`equipement`, `utilisateur`, `attribution`. La vue est `liste`, `detail`, ou absente si la famille
n'a qu'une vue.

**Carte** : le commentaire `@dsCard` en première ligne, avec un `group` **numéroté dans l'ordre du
parcours** — c'est lui qui donne la hiérarchie visible dans le volet Design System :

| Groupe | Contenu |
| --- | --- |
| `1. UI actuelle` | les 15 captures de référence |
| `2. Connexion` | Login |
| `3. Tableau de bord` | Dashboard |
| `4. Détail équipement` | fiche équipement |
| `5. Liste équipements` | liste + scanner adaptatif |
| `6. Liste utilisateurs` | annuaire + sélecteur de destinataire |
| `7. Attribuer et restituer` | **une seule carte** : `attribution-piste.html`, le parcours complet (statut → geste → double attestation) |
| `8. Détail utilisateur` | fiche gestionnaire + menu + Mon profil |
| `9. Créer, corriger, sortir un équipement` | saisir/modifier la fiche · importer une livraison · déclarer un incident · sortir du parc |
| `10. Créer un compte utilisateur` | les deux chemins · inviter · importer l'annuaire · le compte en attente |
| `11.…` | la suite, dans l'ordre où elle sera dessinée |

**L'exception « deux fichiers dans le groupe 7 » est annulée le 30/07 au soir, par l'utilisateur.** Elle était une
commodité d'analyse, pas un besoin : « je ne comprends pas la nuance… j'ai l'impression que tu ne comprends pas
réellement ce que nous essayons de faire ». Il avait raison — le geste et la chaîne sont **la même opération à deux
niveaux de zoom**, et côte à côte dans le volet elles se lisent comme deux propositions concurrentes. Les deux
fichiers sont archivés, remplacés par **`attribution-piste.html`**, une seule planche.

**Une planche porte tout ce qui concerne sa vue** : les profils (gestionnaire / utilisateur final),
les régimes de volume, les états. Jamais un fichier par variante — les variantes sont des colonnes
ou des réglages.

**Les quatre réglages d'aspect sont les mêmes sur toutes les planches** (échelle tonale, densité,
place du jaune, intensité de vie), suivis des réglages propres à la planche. Ordre non négociable :
les propres d'abord, les quatre d'aspect ensuite.

### Règle de rangement (en vigueur depuis le 29/07, inscrite dans `readme.md`)

> Une piste rejetée est déplacée dans `screens/archive/` le jour même de la décision.
> **Un seul fichier vivant par vue** : `<famille>-<vue>-piste.html`, avec ses variantes de profil,
> de volume ou d'état sur la même page. *(Formulation d'origine : « deux fichiers vivants, `-actuel`
> et `-piste` » — le `-actuel` est tombé avec l'amendement du 30/07.)*

Contenu actuel de `screens/archive/` : `login-piste-a.html` (piste Login écartée),
`ui-actuelle-galerie.html` (l'ancienne galerie unique, remplacée par 15 cartes distinctes),
`dashboard-piste-combine.html`, `dashboard-piste-{admin,utilisateur}.html`,
`dashboard-final-{admin,utilisateur}.html`, `dashboard-piste-min-{admin,utilisateur}.html`
(la piste minimale jugée fade, remplacée par l'exploration en trois directions). Rien n'est
supprimé, seulement déplacé — et un fichier archivé **perd son commentaire `@dsCard`** pour
disparaître du volet.

**La galerie unique a été éclatée** le 29/07 : chaque écran actuel est une carte à part
(`screens/actuel/<ecran>.html`, groupe « 1. UI actuelle »), classée dans l'ordre de parcours
de l'application — Connexion d'abord, jamais deux écrans sur la même carte. Toutes les cartes
partagent la **hauteur de « Login — piste retenue »** et le même cadrage centré ; la vignette
montre le haut de l'écran, pas l'écran entier réduit.

**La planche Dashboard est un fichier unique à trois colonnes** — État actuel, administrateur,
utilisateur final — plus six réglages dans le panneau Tweaks. Les directions écartées ont été
retirées de la planche ; leurs partis pris restent décrits dans `dashboard-analyse.md`.

## 4. Les règles de design — non négociables

Elles viennent de `DESIGN_BRIEF.md` (« Interdits absolus », §8). Une maquette qui en casse
une ne sera pas implémentée.

1. **Jaune `#FDC910` : deux usages par écran, maximum.** Jamais en fond d'onglet, de carte
   ou de badge décoratif. Texte sur jaune : toujours noir. Attention : la destination
   active de la barre du bas **compte comme un usage**.
2. **Deux graisses par écran** : 400 (corps) et 500 (titres, valeurs, actions).
3. **Rayons : 2 / 4 / 8 px uniquement.** Contrôles 4, cartes 8. L'identité voulue est
   « légèrement adouci, mais qui se lit encore comme un carré ». L'échelle 10/14/16 du
   brief a été **essayée puis abandonnée** le 26/07 (jugée trop arrondie) — voir Q-B5.
4. **Aucune MAJUSCULE** hors codes techniques (`ASSET-20002`).
5. **Aucun point d'exclamation**, aucun ton administratif. Libellés d'action = verbe + objet.
6. **Cartes sans bordure ET sans ombre** à la fois. Blanc sur canvas teinté.
7. **Cibles tactiles ≥ 48 px.**
8. **Rouge / vert / ambre uniquement quand ils portent un sens.** Interdit de coder des
   catégories avec (le dashboard actuel peint « Headphones » en rouge et « Mouse » en vert :
   c'est précisément ce qu'on corrige).
9. **Deux niveaux d'imbrication maximum.** Une liste dense = des rangées séparées par des
   filets **dans une seule carte**, jamais une carte par rangée.
10. **Pas de bouton désactivé accompagné d'une phrase d'instruction.**

### Palette

| Rôle | Valeur | Note |
| --- | --- | --- |
| Fond de page | `#FAF9F7` | |
| Carte | `#FFFFFF` | |
| Texte principal | `#1A1917` | |
| Texte secondaire | `#78746C` | 4,42:1 sur canvas — voir Q-B2 |
| Muted | `#A29D93` | **2,57:1 — interdit pour du texte**, voir Q-B1 |
| Filet | `#F0EEE9` | |
| Bordure de champ | `#8E877E` | |
| Jaune de marque | `#FDC910` | |
| Danger | `#B3261E` | |
| Succès | `#1B7F4D` | |
| Attention | fond `#FEF3D6`, texte `#7A5A00` | |
| Nav active | `#8A6508` | recommandation Q-B3 |

## 5. État des écrans

| Écran | État | Hauteur actuelle |
| --- | --- | --- |
| **Audit** | **déjà implémenté en React** (compact), sert de référence de patron | 1 283 px |
| **Login** | piste B retenue, validée | 852 px |
| **Dashboard** | **terminé** — direction « héro inversé vivant », admin + utilisateur | 2 513 px |
| **Détail équipement** | **validé le 29/07** — gestionnaire (4 états) + utilisateur final | 2 666 px |
| **Liste équipements** | **validée le 29/07** — gestionnaire (3 volumes) + « Mes équipements » + **scanner adaptatif (6 états)** | 2 142 px + planche scanner |
| Rôles (RBAC) | à faire | 2 368 px |
| Emplacements | à faire | 2 142 px |
| Catalogue | à faire | 1 836 px |
| Finances | à faire | 1 766 px |
| Détail utilisateur | *voir la ligne « Détail utilisateur » ci-dessus* | 1 574 px |
| Liste utilisateurs | **validée le 30/07** — `utilisateur-liste-piste.html`, gestionnaire (3 volumes) + sélecteur de destinataire | 1 436 px |
| **Attribuer / restituer** | **refaite le 30/07 au soir** — `attribution-piste.html`, planche unique : la chaîne des statuts, la matrice statut × qui regarde, attribuer (3 écrans), restituer (3 écrans), les trois mécanismes d'attestation. Les deux pistes précédentes sont archivées. | flux modal |
| **Créer / corriger / sortir un équipement** | **piste livrée le 30/07** — `equipement-creation-piste.html`, 4 colonnes : saisir la fiche (= modifier), importer une livraison, déclarer un incident, sortir du parc | flux modal |
| **Créer un compte utilisateur** | **piste livrée le 30/07** — `utilisateur-creation-piste.html`, 4 colonnes : les deux chemins, inviter, importer l'annuaire, le compte en attente | flux modal |
| **Détail utilisateur** | **piste livrée le 30/07** — `utilisateur-detail-piste.html`, fiche gestionnaire (3 états de compte) + menu + « Mon profil » | 1 574 px |
| Rapports | à faire | 1 247 px |
| Approbations | **ne pas y toucher** — jugé déjà bon par l'utilisateur | 992 px |
| Paramètres | à faire | 866 px |

**Prochains écrans** — cinq planches sont **en attente de validation** : Détail utilisateur, Sélecteur d'objets,
Workflow d'attribution, **Créer/corriger/sortir un équipement**, **Créer un compte utilisateur**. Une fois
validées, il reste, dans cet ordre suggéré : **Rôles (RBAC)** — le plus structurant, il
conditionne ce que chaque profil voit partout ailleurs — puis **Emplacements**, **Catalogue** (source du
vocabulaire des types, dette relevée en §6), **Finances**, **Rapports**, **Paramètres**. Approbations et Audit ne
sont pas à toucher.

Le fichier `screens/<ecran>-actuel.html` n'a plus lieu d'être depuis le Détail équipement : la capture réelle est
plus fidèle qu'une réplique redessinée et ne coûte rien. Depuis le **30/07**, elle n'est même plus reprise en
colonne (§2, règle 3 amendée) : les défauts de l'existant sont écrits **ici**, la planche montre la proposition.

## 6. Décisions prises, avec leur raison

### Login — piste B retenue

- **Bandeau de marque** en haut : noir chaud, titre « Tracker » 28/500, promesse en dessous.
- **Pas de logo** : il n'existe pas encore. Un **filet jaune 40 × 3 px** en tient
  l'emplacement. Le carré « TR » a été retiré — l'utilisateur ne l'aime pas et ce n'est pas
  le logo de l'application.
- **Promesse** : « Pilotez vos actifs avec une expérience unifiée. » Reprise du desktop,
  **sans nom de pays** (Neemba est multinational). Sans italique ni graisse fine
  contrairement au desktop : ce serait une 3ᵉ graisse. Le mot « unifiée » n'est **pas** en
  jaune — le filet occupe déjà l'un des deux usages.
- **Aucun bouton Microsoft.** L'utilisateur a tranché : l'écran de production n'affiche
  qu'e-mail + mot de passe. C'est le **backend** qui déterminera en coulisses si le compte
  est sur Azure ou en base locale. ⚠️ *Réserve technique signalée à l'utilisateur, non
  résolue* : authentifier un compte Azure AD avec un mot de passe transmis au serveur passe
  par le flux ROPC, que Microsoft déconseille et qui casse dès qu'il y a MFA ou accès
  conditionnel. À vérifier avec l'administrateur Azure avant de construire le backend.
- **Comptes de démonstration** : l'utilisateur a demandé **deux fois** le retour au format
  d'origine — rangée d'avatars avec pastille jaune portant l'initiale du rôle, nom révélé
  par infobulle. C'est déjà rétabli dans le code. Deux objections lui ont été signalées et
  il a maintenu : la pastille jaune est un badge décoratif (interdit §8.1) et le nom n'est
  accessible qu'à l'appui long. **Ne pas rouvrir le débat**, c'est sa décision ; ça se
  reposera naturellement au moment de la refonte de l'écran.

### Dashboard

- **Deux compositions, pas trois.** Toute la variation par rôle repose sur un seul booléen,
  `permissions.canManageInventory` (`DashboardPage.tsx`). Le **manager n'a pas d'écran
  propre** : il est servi par la donnée, via le bloc « à traiter ». Confirmé par l'utilisateur.
- **Le bloc « à traiter » remonte en tête.** Il existe déjà dans le code (validations
  managériales + réceptions à confirmer, avec leurs boutons) mais il est placé **après** la
  grille de KPI : sur téléphone on dépasse cinq cartes de chiffres avant de voir ce qui
  attend. C'est le principal défaut de composition.
- **KPI dans UNE carte à séparateurs** : admin en **2×2**, utilisateur en **2 + 1**. À
  393 px, quatre ou trois cellules sur une ligne sont trop étroites une fois l'icône
  ajoutée. L'interdit §8.7 vise une mini-carte orpheline, pas une cellule de grille.
- **« En attente » quitte les KPI de l'admin** et rejoint « à traiter » : un statut qui
  demande une action n'a rien à faire dans un compteur.
- **Icônes partout** (en-tête de carte, KPI, boutons, barre du bas) mais **en gris neutre**.
  Confirmé par l'utilisateur. Les repeindre en jaune/vert/rouge comme aujourd'hui
  dépasserait le budget de deux jaunes et remettrait de la couleur qui ne signifie rien. Le
  rouge subsiste sur le **chiffre** de « Réparation ».
- **Pas d'icône sur l'en-tête « Valeur du parc »** : ses deux chiffres portent déjà la leur.
- **Aucun anneau, aucun camembert.** L'anneau à quatre parts ne se compare pas au pouce et
  c'est lui qui imposait le rouge/vert décoratifs. **Révisé le 29/07 :** l'anneau à *deux*
  parts (garantie) est tombé aussi — voir « La carte Garantie mise au régime » ci-dessous.
  Une proportion unique se dit en une rangée ; le multi-catégories en barres.
- **Dashboard utilisateur : composition strictement identique à l'existant.** Aucune
  section ajoutée ni retirée. Seule la forme change.

### Dashboard — direction retenue : « héro inversé vivant » (28/07)

Trois directions avaient été dessinées (A surfaces tonales, B héro inversé, C data
expressive). **B retenue**, puis enrichie après réception des visuels de marque LIVE.

- **La zone dominante est une matière, pas un aplat.** Encre LIVE `#0A191D` posée sur une
  photo du terrain, voile 90 % (réglable). Une seule zone inversée par écran.
- **Les teintes LIVE signifient un état, elles ne décorent pas** : bleu `#54A9DC` attribué,
  vert `#7AB955` disponible, orange `#E45329` réparation. Les **types** restent monochromes —
  un type n'est pas un état (interdit §8.8). Le jaune CAT reste l'unique accent d'action.
- **Plus aucun emoji** : initiales sur pastille pour les personnes, photo réelle pour le
  matériel. Le contenu porte l'image, comme dans les références citées par l'utilisateur
  (YouTube, Spotify, Duolingo, les stores).
- **« Bonjour Alice »** remplace « Tableau de bord ». Titres et chiffres en **Archivo**
  (proche du logotype LIVE), corps en Inter.
- **Aucune animation.** Un écran consulté vingt fois par jour n'en veut pas.
- **Ni logo ni nom complet dans la barre du haut** : le prénom est déjà dans le titre, un
  avatar 44 px suffit. Demandé par l'utilisateur.

#### Le principe qui gouverne tout l'écran

**Le tableau de bord dit la taille et la forme du travail ; il n'est pas le lieu où on le
fait.** Il en découle deux règles appliquées partout :

1. **Aucune liste n'est non bornée.** Une liste qui grandit avec la donnée détruit
   l'architecture de l'écran : passé une vingtaine d'entrées, tout ce qui est en dessous
   devient inatteignable.
2. **Une seule destination : la file « Tâches ».** Les liens du dashboard n'ouvrent pas un
   écran distinct — ils ouvrent le même en **portant le filtre et le tri**. Un second
   inventaire de la même liste créerait une deuxième source de vérité.

#### « À traiter » — quatre régimes de charge

La zone garde une **hauteur bornée** et **change de forme** selon le volume. Sa hauteur suit
le nombre de lignes de sa composition, **jamais** le volume de la file.

| Volume | Forme |
| --- | --- |
| 0 | La zone reste (pas de saut de mise en page d'un jour à l'autre) mais s'apaise. |
| 1–3 | Rangées complètes, action directe sur place. |
| 4–20 | Les 2 plus anciennes + « Voir les N autres », qui porte aussi l'attente la plus longue. |
| 20+ | Aucune rangée : volume en grand, attente la plus longue, répartition par nature d'action — chaque ligne étant elle-même l'entrée filtrée dans la file. |

#### « Répartition par type » → « Types en tension »

Compter les unités de chaque type décrit le parc sans rien décider. Ce qui décide, c'est **de
quel type il ne reste plus rien**. La carte ne liste que les types à **0 unité disponible**,
bornée à cinq lignes. Pas de barre : à zéro disponible, une barre ne porte rien. Ce qui est
couvert est dit en une phrase. La vue utilisateur **garde** « Mes équipements par type » — la
tension n'a pas de sens sur quatre équipements personnels.

#### Avatar et « Plus » — la frontière (révisée le 29/07)

Relevée sur les captures de l'existant, pas inventée : les quatre onglets couvrent quatre
écrans, **les sept autres tombent tous dans « Plus »**.

La première frontière posée le 28/07 était « avatar = la personne, Plus = l'application ».
**La lecture des cinq onglets de l'écran Paramètres l'a invalidée** : cet écran mélange trois
natures — la **personne** (Compte : mot de passe, 2FA, session), l'**entreprise** (Finances,
badgé « GLOBAL » par l'application elle-même ; Collecte : agent GPO/Intune, clé d'API,
fréquence de check-in) et le **méta** (Aide : documentation, support, tutoriels, FAQ, version).
L'onglet **Affichage ne contient aucun réglage** — seulement une phrase annonçant le mode
sombre.

> **Le badge « GLOBAL » de l'onglet Finances est l'aveu du problème** : il n'aurait aucune
> raison d'exister si l'écran était homogène.

**La règle juste** n'est donc pas « la personne » mais :

> Le menu de l'avatar porte **ce qui n'agit pas sur le parc** — moi, et l'application
> elle-même. La navigation porte **le parc**.

- **Menu de l'avatar** : en-tête (initiales, nom, **rôle** — c'est lui qui explique pourquoi
  l'écran ne montre pas la même chose à deux personnes), *Mon profil*, *Mon compte*
  (= l'onglet Compte promu en écran), *Aide et support*, filet, *Se déconnecter*, puis
  `Tracker v1.2.0` en pied de menu.
- **« Plus » = le parc**, en feuille montante, groupé par nature de la chose manipulée :
  Référentiel (Catalogue, Emplacements), Analyse (Finances, Rapports), **Administration**
  (Audit, Rôles et permissions, **Configuration**). Sept entrées à plat sont un mur.
- **Configuration** = les onglets Finances + Collecte. « Paramètres » ne dit plus rien une
  fois la personne partie ailleurs, et le mot entrait en collision avec la destination
  « Finances » déjà présente dans le groupe Analyse.
- **Affichage disparaît.** Un onglet dont l'unique contenu annonce une fonctionnalité future
  est une note de version, pas un onglet. Il redeviendra une ligne dans *Mon compte* le jour
  où le mode sombre existe : une préférence d'apparence n'a de sens qu'appliquée à quelqu'un.

**Ce que le découpage referme, sans arbitrage supplémentaire :**

1. La **double porte** vers le même écran (avatar → Paramètres › Compte et Plus → Paramètres).
2. Le **groupe à une seule entrée** (« Réglages » n'existe plus).
3. La barre d'onglets de Configuration tombe à **2** : plus de défilement horizontal, plus de
   chevrons, plus de compteur « 5 » — **et l'onglet actif peut quitter l'aplat jaune, ce qui
   referme le manquement §8.1**. Le découpage supprime la violation au lieu de la déplacer.
4. La **barre du bas de l'utilisateur passe à 4 onglets** : il n'a plus aucune destination
   dans « Plus ».
5. La **carte morte « Besoin d'aide ? »** disparaît du dashboard : le centre d'aide existait
   déjà, enterré au cinquième onglet d'un écran atteint par un menu de débordement. Le
   contenu et l'affordance existaient tous les deux — ils ne s'étaient jamais rencontrés.
6. L'aide devient atteignable par **tous les rôles**, y compris ceux sans administration.

**Corrections mécaniques appliquées aux deux menus (29/07) :** rangées portées de 44 à
**48 px** (§4.7) ; rayon de la feuille ramené de 12 à **8 px** (§8.3) ; poignée de glissement
en tête de feuille ; fermeture au voile, à Échap et au clic extérieur, un seul menu ouvert à
la fois ; **fin du double état actif** — feuille ouverte, « Plus » prend un aplat de surface et
non l'encre pleine (il dit « menu ouvert », pas « vous êtes ici ») ; sous-titres homogénéisés
(le décompte isolé de « Catalogue » retiré) ; **« Paramètres › Compte » supprimé** comme
sous-titre — un chemin de navigation interne exposé à l'utilisateur, remplacé par ce qu'on y
fait.

Sans cette frontière, les deux menus deviennent concurrents pour les mêmes commandes.

#### La carte Garantie mise au régime (29/07)

Un anneau, un trou, un pourcentage et deux lignes de légende occupaient le tiers d'un écran
pour dire « 9 sur 14 ». À côté, « Types en tension » énonce une décision en trois lignes.

La carte est **conservée mais réduite à une rangée** : le chiffre en grand, la phrase qui le
qualifie, le pourcentage, un filet de proportion de 6 px, puis une ligne qui dit **la
conséquence** — ce que l'anneau ne disait pas. La hauteur est divisée par deux et
l'information gagne : « 5 hors garantie » devient actionnable au lieu d'être une légende.

**La fusion est appliquée** (décision déléguée à la conception le 29/07) : le bloc financier
n'existe plus comme carte autonome. Deux rangées de même grammaire (une part d'un tout) tiennent
dans une carte **« État du parc »**, et un seul lien vers Finances remplace le doublon de
2,5 écrans.

**Corrigé le même jour, après lecture de l'onglet Synthèse de Finances.** La première version de
la rangée disait « 8 276 XOF de valeur restante sur 17 615 investis » : faux cadrage — 8 276 est
la **valeur nette comptable**, soit ce qu'il reste à amortir, et les 9 339 de différence sont
déjà passés en charge. Ces deux chiffres existent déjà nommés sur Finances (« Valeur du parc »,
« Efficacité des actifs 47,0 % ») : le dashboard les rejouait sous un libellé inventé. Le chiffre
qui décide était juste à côté — **« Risque fin de vie : 2 actifs amortis à plus de 85 % »**. Les
deux rangées portent donc désormais du **risque non provisionné** (2 en fin de vie comptable,
5 hors garantie), filets remplis de la part à risque en orange LIVE, et l'argent est subordonné au
lien de bas de carte avec le vocabulaire de l'application. Le filet de valeur prend `--data` (donnée), celui de la garantie `--live-vert`
(état) : la distinction reste sémantique. **La provenance est déclarée** — « estimation issue de
l'amortissement paramétré par catégorie, pas d'une réévaluation ». La vue utilisateur ne
fusionne pas : elle n'a pas de bloc financier.

### Détail équipement — piste livrée le 29/07

`screens/equipement-detail-piste.html` — trois colonnes : la **capture réelle entière** (plus fidèle
qu'une réplique redessinée, et l'écran fait 3,7 hauteurs), la fiche **gestionnaire de parc** (quatre
états), la fiche **utilisateur final**. Six réglages : les quatre d'aspect du chantier + **état de
l'actif** et **âge comptable**, propres à cette fiche.

**Cadrage.** Gestionnaire : *à qui va cette machine, ou faut-il la sortir du parc* → attribuer,
restituer, déclarer un incident. Utilisateur porteur : *est-ce bien la mienne, et quoi faire quand
elle tombe en panne* → signaler, restituer. Les deux voient l'écran ; l'utilisateur y a **ses propres
actions** (réponse de l'utilisateur au cadrage).

**Le principe qui gouverne l'écran :** une fiche répond d'abord à « quel objet, dans quel état, chez
qui, et quoi faire » — cela tient sur le premier écran, sans défilement. Le reste est de la
**référence**, donc bornée et consultée, jamais parcourue. Deux conséquences appliquées partout :
**aucune zone ne défile à l'intérieur de la page** et **aucune information n'est écrite deux fois**.

Arbitrages rendus (tous délégués à la conception par l'utilisateur, formulaire du 29/07) :

- **Un seul en-tête.** « Détail équipement » ne dit rien qu'on ne sache déjà et coûte 56 px avant le
  contenu. La barre porte le code, l'identifiant et un menu de débordement, et elle est le **seul
  endroit où l'identité est écrite** — le héro ne la répète pas.
- **Crayon et triangle deviennent des entrées nommées** dans ce menu (Modifier la fiche, Déclarer un
  incident, Réaffecter, Sortir du parc). Un triangle sans libellé peut vouloir dire « signaler un
  problème » comme « il y a un problème ».
- **Le porteur n'apparaît qu'une fois**, dans le héro, et c'est lui la cible vers la fiche utilisateur.
  L'écran actuel l'annonçait en tête (« utilisateur attribué ») et le répétait en pied (« utilisateur
  actuel »), deux libellés pour une seule destination.
- **Le geste primaire suit l'état** : Attribuer (disponible), Restituer (attribué), Clore
  l'intervention (en réparation), Confirmer la réception (en attente). Ce n'est pas une barre d'actions
  fixe — la capture le montrait déjà (« Attribuer + Supprimer » d'un côté, « Retourner » de l'autre).
- **« Supprimer » quitte le rang primaire** et devient **« Sortir du parc »** dans le menu : une action
  irréversible ne se tient pas à côté d'Attribuer, et un actif qui a un historique ne s'efface pas, il
  se retire des disponibles. *Renommage à valider côté code.*
- **Les trois cartes DÉMO sont retirées.** Santé et Maintenance reviendront comme **deux rangées d'une
  même carte** le jour où l'agent de collecte les alimente — c'est ce que le badge DÉMO avoue. Les
  **documents restent** (facture, contrat de garantie sont des objets réels), descendus en pied de
  fiche, mention DÉMO conservée.
- **Le bloc financier suit le traitement du dashboard** : rouge supprimé (un amortissement n'est pas
  une anomalie), tableau de trois lignes et barre jaune supprimés, **une rangée** + la **conséquence**
  (date de renouvellement, enveloppe d'imputation). Provenance déclarée. Le détail reste derrière un
  lien vers Finances.
- **Le numéro de série passe en premier** et devient **copiable** : seul champ lu à voix haute au
  support. Il était dernier.
- **Historique borné à 3**, sans ascenseur interne, événements répétés agrégés, **rangée entière comme
  cible** (64 px), lien vers **Audit filtré sur cet actif** — l'écran existe déjà, le dupliquer créerait
  une seconde source de vérité.
- **Le pays quitte l'emplacement** (« France, Bureau Paris » → « Bureau Paris »). Le site situe l'objet ;
  le pays est l'**entité**, et s'il y en a plusieurs il appartient au sélecteur de périmètre. Même point
  ouvert que sur le dashboard.
- **Vue utilisateur final** : disparaissent le prix, l'amortissement, la modification, la sortie du parc
  et **l'historique** (il nomme les autres porteurs de la machine — fuite d'information). La garantie
  **change de sens** : elle ne dit plus un risque de parc mais **qui paie la réparation**.

**Données déclarées comme fabriquées à l'écran** : les trois états autres qu'« attribué », la fiche
utilisateur final entière (aucune capture n'existe), et le rattachement du renouvellement à l'enveloppe
« Matériel IT ».

### Liste des équipements — piste livrée le 29/07

`screens/equipement-liste-piste.html` — capture réelle entière / liste **gestionnaire** (3 volumes) /
**« Mes équipements »** utilisateur final. Six réglages : les quatre d'aspect + **volume du parc** et
**identifiant dans la rangée**, devenu **« ce que la caméra voit »** — plus une **planche scanner de six états**
en bas de page.

**Cadrage.** Gestionnaire : *trouver l'objet dont on me parle*, ou *choisir dans ce qui est disponible*
→ la fiche, puis attribuer. Utilisateur porteur : la même destination de navigation lui montre **ses
quatre équipements** — il n'y cherche rien, il y entre.

**Le principe qui gouverne l'écran :** une liste sert à **trouver**, pas à lire. Une rangée porte le
minimum qui permet de **reconnaître et de choisir**, pas une fiche résumée.

Arbitrages rendus :

- **La rangée passe de trois lignes à deux** — 180 px par actif aujourd'hui, d'où 14 actifs répartis sur
  deux pages. Elle gagne au passage **chez qui est l'objet**, l'information la plus demandée sur un parc
  et pourtant absente de la liste actuelle. *À vérifier côté code : l'API expose-t-elle déjà le porteur
  dans la liste ?*
- **La corbeille quitte la rangée.** L'action la plus irréversible de l'écran était en rouge, à droite,
  sous le pouce qui fait défiler dix rangées. Elle est déjà arbitrée sur la fiche (« Sortir du parc »,
  menu de débordement) : une suppression se décide devant l'objet.
- **La pagination disparaît.** Deux pages pour 14 actifs, page active en **aplat jaune** — troisième
  jaune de l'écran après le bouton d'ajout et l'onglet actif. Remplacée par un **défilement par lots**
  (« Charger 20 de plus ») et surtout par la recherche : sur un parc, on ne feuillette pas.
- **L'état sort des majuscules et des aplats** : pastille de teinte LIVE + un mot, en deuxième ligne
  avec le porteur — même grammaire que la fiche. Trois badges pleins en majuscules par écran pesaient
  plus que le nom de l'objet (interdit §8.4).
- **Les quatre états montent en tête avec leurs compteurs.** L'axe sur lequel on filtre presque
  toujours — *qu'est-ce qui est disponible* — devient visible au lieu d'être enfermé derrière un bouton
  muet. Le bouton garde le reste (type, emplacement, période) et **affiche le nombre de filtres actifs**.
- **Le tri apparaît** (il n'existe pas aujourd'hui) et partage la ligne du décompte.
- **Les trois commandes ont leur état ouvert dessiné et cliquable** sur la planche (voile, clic
  extérieur, Échap ; une seule à la fois) :
  - **Filtre** — feuille montante. Elle **ne reprend pas l'état** (déjà en pastilles en tête d'écran) et
    porte les trois axes restants — type, emplacement, période — chacun en **chips à plat, sans
    sous-feuille** : trois axes tiennent sur un écran. Le bouton de validation dit **combien de
    résultats attendent** et il est **noir, pas jaune** : le budget de deux jaunes est pris par le
    bouton d'ajout et l'onglet actif, et une feuille n'est pas un écran séparé.
  - **Scan** — plein cadre sur fond sombre, viseur, une phrase, et un **repli « saisir le code à la
    main »** (un scan échoue : mauvaise lumière, étiquette abîmée).
  - **Bouton d'ajout** — feuille de **choix, pas formulaire** : « ajouter » n'est pas un geste unique
    sur un parc. **Scanner** une étiquette déjà collée, **saisir** une fiche quand il n'y a rien à lire,
    **importer une livraison** de dix machines identiques — ce troisième cas n'est couvert par rien
    aujourd'hui et c'est le plus fréquent en arrivée de stock. Le **formulaire de création reste un
    écran à part**, non traité dans ce chantier. *Les trois chemins sont une proposition ; seul le
    second existe.*
  - **« Plus »** — la feuille **validée sur le dashboard**, reprise à l'identique (Référentiel /
    Analyse / Administration, sept destinations). Aucun nouvel arbitrage.
- **Un geste de scan** est proposé dans la barre du haut : l'application sait déjà scanner une facture,
  et le code-barres de l'étiquette est le chemin le plus court entre l'objet qu'on tient et sa fiche.
  *Mécanisme nouveau — à spécifier avant implémentation.*
- **Vue utilisateur final** : disparaissent recherche, filtres, tri, décompte et bouton d'ajout — six
  commandes pour quatre rangées seraient un formulaire, pas une liste.

**Point laissé au choix de l'utilisateur** : **tranché le 29/07 — ASSET-10001 reste dans la rangée.** Le réglage a
disparu du panneau ; on lit parfois l'identifiant sur l'étiquette collée sur l'objet, et une clé de recherche visible
rassure. Sa place sert désormais à **« ce que la caméra voit »** (voir ci-dessous).

**Les trois propositions hors cadre sont validées** (29/07) : le geste de scan dans la barre du haut, la feuille
d'ajout à trois chemins (scanner / saisir / importer une livraison — seul le second existe), et le remplacement de
la pagination par un défilement par lots. Elles restent **à spécifier avant implémentation**.

**Les deux questions de données ont été tranchées par la conception** (l'utilisateur a délégué le 29/07) :

1. **Le porteur dans la rangée est une exigence, pas une option.** L'affectation est un champ de l'actif au même
   titre que l'état, que la liste affiche déjà. Si la charge utile de la liste ne l'expose pas encore, c'est la
   charge utile qu'on étend — pas la rangée qu'on ampute. **Repli en attendant** : la deuxième ligne montre
   l'**emplacement**, même dessin, plutôt qu'un vide.
2. **Un compteur de pastille ne vaut que s'il compte tout le parc filtré**, jamais la page chargée. Sans total
   côté serveur, un « 5 » qui ne compte que les vingt premiers actifs est un mensonge : dans ce cas les pastilles
   **perdent leur chiffre et restent des filtres**. Règle à reprendre sur les autres écrans — **la forme dégrade,
   elle ne fausse pas.**

#### Le scanner adaptatif (demandé par l'utilisateur le 29/07)

Six états dessinés en bas de planche, deux rangées de trois. La demande : « un scanner intelligent, qui s'adapte
visuellement et fonctionnellement selon qu'on scanne un code-barres ou un QR ».

- **Aucun sélecteur de mode.** Un onglet « Code-barres / QR » ferait nommer par la personne ce que la caméra
  reconnaît en une fraction de seconde. Le viseur part d'une forme neutre et **change de géométrie**.
- **La forme enseigne le geste** : code-barres → bandeau large + ligne de balayage (la main tourne le téléphone
  d'elle-même) ; QR → carré, sans ligne (elle ne voudrait plus rien dire sur un code 2D).
- **Exception assumée au « aucune animation »** : le changement de forme est le retour d'un capteur en temps réel,
  pas un ornement d'écran — au même titre qu'un indicateur de mise au point. *À signaler dans le brief.*
- **La règle fonctionnelle ne dépend pas de la symbologie mais de ce que le code porte** : **une lecture qui se
  contente d'identifier passe sans confirmation ; une lecture qui créerait ou modifierait demande.** Code d'actif
  (1D ou QR) → la fiche, directement. QR de **bon de livraison** → propose d'importer les N actifs, rien n'est
  écrit avant l'accord, fiches ouvertes en brouillon. QR d'**emplacement** → ouvre le **récolement** du lieu.
- **Le scanner se souvient de sa course.** Entré par la loupe : une lecture, puis il s'efface derrière la fiche.
  Entré par un QR d'emplacement ou par « importer une livraison » : il **reste ouvert**, accumule, compte, et dit
  l'écart avec l'attendu. Un scanner qui se referme après chaque objet transforme un récolement de trente
  machines en trente ouvertures de caméra.
- **Aucune impasse** : le sixième état montre le code lu **en clair**, propose de le chercher dans le parc et
  laisse la saisie manuelle. L'**éclairage se propose de lui-même** après quelques secondes sans lecture (cause
  n°1 sur une étiquette brillante).
- **Le jaune du viseur est ramené à un seul usage** : les quatre coins restent en `#FDC910`, la ligne de balayage
  passe en blanc 72 % — elle dit du mouvement, pas de l'accent.

**Reste à spécifier avant implémentation** : symbologies acceptées (Code128 / Code39 / QR / DataMatrix ?), format
des QR d'emplacement et de bon de livraison, lecture à la chaîne (accumulation, doublons, objets lus hors
emplacement), et le brouillon d'import de livraison.

**Données fabriquées, déclarées à l'écran** : BL-2026-118 et son modèle, les 12 objets attendus en salle serveurs,
le code non reconnu 4H7K-92-BX.

**Données déclarées comme fabriquées à l'écran** : les volumes 120 et 800, les porteurs en deuxième
ligne, la répartition 5 / 7 / 2 par état (déduite des captures), et la vue « Mes équipements » entière.

#### Vocabulaire : deux langues pour la même chose

Le dashboard affiche « Laptop / Monitor / Mouse » ; l'écran Catalogue gère **huit catégories
en français** (Mobilier, Casque, Clavier, Ordinateur portable, Moniteur, Souris, Imprimante,
Serveur). Les maquettes reprennent le vocabulaire du Catalogue. **À trancher côté code** : le
dashboard groupe-t-il sur `asset.type` (champ libre) ou sur la catégorie du Catalogue ? Si ce
sont deux champs distincts, c'est une dette de modèle, pas de libellé.

#### Amendements du brief demandés (non arbitrés)

Découlent de la direction retenue et de l'exploration en trois directions. Chacun est une
**demande**, pas un fait acquis :

- **Le noir chaud employé comme _surface_**, pas seulement comme couleur de texte. Règle
  proposée : **une seule surface inversée par écran**, réservée à la zone d'action.
- **Les filets 0,5–1 px comme séparateurs internes**, à inscrire explicitement comme
  contrepoids de l'interdit « bordure + ombre » : une carte sans aucune délimitation interne
  produit de la surcharge.
- **L'activité passe en dernier** (arc décision → état → analyse → activité), alors que le
  code la place avant les graphiques. C'est une proposition de composition.
- **L'agrégation des événements répétés** est un mécanisme nouveau : règle de regroupement,
  libellé, état déplié et zone tactile restent à spécifier (interdit « élément nouveau sans
  spécification »).
- **« Restituer »** remplace « Retour matériel » dans les maquettes : renommage à valider
  côté code.
- **Une échelle de surfaces réétalée** avait été proposée pour la direction « surfaces
  tonales » (canvas `#F2F0EA` → carte `#FFFFFF` → zone interne `#F7F5F0`). La direction
  retenue n'en dépend plus, mais le constat qui l'a motivée reste vrai : en mode clair,
  l'écart canvas↔carte du brief (~2 %) ne suffit pas à créer une hiérarchie.

**Aucune tendance, aucun delta, dans aucun écran** (décision du 26/07) : le jeu de données ne
contient **pas de série temporelle**, sur 14 actifs un delta serait du bruit, et une tendance
simulée dans une maquette de référence finit implémentée. Les chiffres se réfèrent à des
**parts du total** (« 7 sur 14 ») — la composition, pas le temps.

#### Corrections de conformité et de lisibilité relevées en autocontrôle (29/07)

- **Un repère de mesure ne dépend jamais de la teinte de ce qu'il mesure.** Le repère de rythme du
  filet budget avait d'abord été dessiné en encre à 60 % d'opacité, dans un filet dont le
  remplissage (`--data`) est **indiscernable de l'encre au réglage par défaut** : il disparaissait
  purement et simplement dès que la consommation le franchissait — c'est-à-dire dans le seul cas où
  il sert. Corrigé par la **géométrie** et non par la couleur : le repère dépasse le filet de 4 px
  en haut et en bas, avec un liseré de surface qui le détache du remplissage. Lisible dans les deux
  états et sous tous les réglages d'accent.
- **`overflow:hidden` sur un filet interdit à toute marque de s'en échapper.** Retiré ; le
  remplissage porte désormais son propre rayon.
- **Les montants en texte courant portent une espace fine insécable** (U+202F) : « 17 615 » s'était
  coupé en fin de ligne et se lisait comme deux valeurs.
- **Un lien de pied de carte ne porte pas un chiffre.** « Valeur nette comptable 8 276 XOF, soit
  47 % » comme libellé de lien écrasait la mention de destination (« dans Finances ») jusqu'à la
  replier sur deux lignes. Le lien garde un libellé court ; `.more .mo` est passé en `nowrap`.
- **Boutons de rangée à 48 px.** Les pistes précédentes les dessinaient à 36 px, sous la
  cible de l'interdit §8.7.
- **La rangée d'événement agrégée est elle-même la cible** (64 px de haut). « Déplier » n'est
  qu'un **indicateur**, jamais un lien de 12 px isolé — sinon on remplace une non-conformité
  par une autre.

#### Les six réglages de la planche

Aspect — **échelle tonale** (papier chaud / neutre / blanc franc), **densité** (aérée /
standard / compacte, cibles jamais sous 44 px), **place du jaune** (action / donnée / nulle
part), **intensité de vie** (sobre / assumée). Volumétrie, colonne admin seulement — **charge
de travail** (0 → 999) et **variété du parc** (4 types → les 8 catégories). Aucun ne touche la
colonne « État actuel », qui reste une réplique fidèle.

#### CORRECTION MAJEURE du 30/07 — j'avais raté la portée de la fonctionnalité

L'utilisateur a repris la piste : « on a plusieurs cas d'usage, selon la demande d'un manager pour un
collaborateur, selon la demande du collaborateur, ou l'attribution directement par l'IT, avec un workflow de
validation selon les cas. Dans le workflow on a un mécanisme de validation aussi, selon code, fingerprint ou
signature. » **Il avait raison sur les deux points, et la planche 7 est incomplète à cause de ça.**

**Erreur 1 — mauvais niveau d'analyse.** J'ai traité l'attribution comme **un acte** avec des variantes de
saisie selon le point d'entrée. C'est une **chaîne de responsabilité** : quelqu'un exprime un besoin, quelqu'un
l'autorise, l'informatique le sert, l'objet change de mains. Trois personnes, trois moments. La doctrine du
sélecteur (« un point d'entrée ne repose pas une question dont il connaît la réponse ») est juste, mais je l'ai
appliquée aux **données** alors qu'elle vaut aussi pour les **maillons du workflow**.

**Erreur 2 — avoir jeté signature / code / empreinte.** J'ai lu « Validation d'identité administrateur —
SIMULATION » et conclu au théâtre : pourquoi faire signer quelqu'un de déjà connecté ? **La question était mal
posée.** Ces trois mécanismes ne servent pas à authentifier l'opérateur — ils servent à **prouver la remise**.
C'est le bon de livraison signé au comptoir : la trace que *cette* personne a reçu *cet* objet, *ce* jour,
*dans cet état*. C'est ce qui sépare un inventaire **déclaratif** d'un inventaire **opposable**. L'écran actuel
les mettait juste **sur la mauvaise personne** (l'administrateur au lieu du bénéficiaire) et dans une liste
de trois boutons équivalents, ce qui masquait qu'ils répondent à **deux besoins distincts**.

**Leçon à retenir** : quand un écran est marqué « SIMULATION » ou « DÉMO », l'implementation est fausse, **pas
nécessairement l'intention**. Chercher le besoin métier derrière avant de démonter. J'ai eu raison de démonter
les cartes DÉMO du détail équipement (des états inventés) et tort de démonter celle-ci (un acte réel mal placé).

### Workflow d'attribution — piste livrée le 30/07

`screens/attribution-workflow-piste.html`, groupe « 9. Workflow d'attribution ». Un diagramme de chaîne
(3 origines × 5 maillons) puis cinq colonnes. Quatre réglages : **preuve de remise** (signature / code /
à distance) + trois d'aspect.

**La chaîne, cinq maillons qui ne changent jamais d'ordre ni de nom** — 1 Demande · 2 Validation managériale ·
3 Traitement IT · 4 Remise & preuve · 5 Réception confirmée. **Chaque origine y entre à un maillon différent :**

| Origine | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Collaborateur | à faire (lui) | à faire (son manager) | à faire (IT) | à faire | incluse en 4 |
| Manager pour un collaborateur | à faire (lui) | **satisfaite d'office**, à son nom | à faire (IT) | à faire | incluse en 4 |
| IT direct | n'existe pas | n'existe pas* | **point d'entrée** | à faire | incluse en 4 |

\* sauf seuil de valeur — question ouverte (a) ci-dessous.

**Les quatre règles retenues :**

1. **Un demandeur exprime un besoin, il ne choisit pas dans le stock.** Le collaborateur voit des **types**,
   pas des modèles ni des unités : il ne sait pas ce qui est en réserve, et le lui montrer transforme une
   demande en commande. Le **motif** n'est pas un champ de politesse — c'est la **seule matière du maillon 2**.
   Le modèle et l'unité appartiennent au maillon 3 : c'est là que sert le sélecteur groupé par modèle.
2. **Ce qui est satisfait d'office se montre, ne s'escamote pas.** Manager demandeur = valideur : la
   validation est acquise mais **écrite à son nom dans le fil**. Sans cette ligne l'audit lit une attribution
   sans validation et ne distingue pas un cas légitime d'un contournement. Idem IT direct : le fil dit
   « aucune demande — dotation directe » plutôt que de laisser un trou.
3. **La preuve de remise est le seul maillon qu'aucune origine ne saute**, et sa forme dépend d'un seul fait :
   **le bénéficiaire est-il là ?** — contrainte physique, pas préférence d'organisation.
   - **Présent, on a un instant** → il **signe** (récépissé, le plus fort).
   - **Présent mais pressé** (comptoir, atelier, gants, dix remises d'affilée) → il tape son **code à 4
     chiffres**. Aussi opposable, sans passer l'appareil de main en main.
   - **Absent** (objet expédié, remise par un tiers) → **aucune preuve possible sur place, et en inventer une
     serait un mensonge**. L'unité passe **« réservée », pas attribuée**, en « remise à confirmer » ; c'est
     **lui** qui confirme depuis son application, avec relance à 5 jours. *État qui existe déjà côté produit
     sous le nom « réceptions à confirmer » (bloc « à traiter » du dashboard).*
   - **L'empreinte n'est pas un mode de preuve du bénéficiaire** : sur le téléphone de l'IT elle ne prouve que
     l'identité de l'IT. Son vrai usage est en règle 4.
4. **Une restitution peut aussi déclencher une validation** — la nuance qui manquait à la planche 7. « Une
   attribution enregistre une intention, une restitution une observation » était juste mais incomplet :
   **certaines observations sont des décisions financières.** Rendre en bon état ne demande l'accord de
   personne ; déclarer **hors service** est une **sortie d'inventaire** — une écriture de perte, qui remonte
   vers une validation. Le retour lui-même n'attend pas (l'objet quitte le porteur immédiatement) ; c'est la
   *sortie* qui attend. **Ce qui constate passe, ce qui coûte demande** — symmétrique de la règle du scanner.
   **C'est ici que sert l'empreinte** : déverrouiller un acte à conséquence financière **sur son propre
   appareil**. Elle n'atteste pas une remise, elle **autorise une écriture**.

**Trois questions ouvertes, à trancher avant implémentation :**

- **(a)** Existe-t-il un **seuil de valeur** au-delà duquel même l'IT doit faire valider une attribution
  (serveur, véhicule) ? Supposé et signalé, non dessiné.
- **(b)** Le **manager d'un demandeur** est-il porté par les données (lien hiérarchique) ou déduit du
  département ? **Tout le maillon 2 en dépend.**
- **(c)** Le **code de remise** est-il le PIN de la fiche utilisateur, ou un code à usage unique envoyé par
  courriel / SMS ? La planche montre le premier, le moins coûteux.

**Approbations n'est pas touché** — et la capture le confirme comme maillon 2 : ses trois actions (Refuser,
**Affecter**, Annuler) montrent que validation et service sont **déjà séparés** dans le produit, et
« Affecter » est exactement l'entrée du maillon 3. Le chip « Traitement IT » y nomme déjà l'étape.

**Conséquence sur la planche 7** : sa feuille d'attribution « en une seule fois » reste valable **pour le seul
cas de l'IT direct** (maillon 3 comme point d'entrée). Elle n'est pas fausse, elle était **partielle** : il
faut y ajouter la preuve de remise en sortie. À reprendre si la planche 9 est validée.

### Attribuer et restituer — piste livrée le 30/07

`screens/attribution-restitution-piste.html` — groupe « 7. Attribuer et restituer ». Six captures reçues le 30/07
(rangées dans `screens/actuel/attribuer-1…4.png` et `retourner-1…2.png`) : l'attribution en **4 étapes** complète,
et les **2 premières** étapes de la restitution. Cinq réglages : les quatre d'aspect + **origine de la restitution**
(depuis la personne / depuis l'objet).

**La nuance que l'utilisateur a signalée, formulée :** les deux gestes ne sont pas symétriques.

> **Une attribution enregistre une intention** — connue d'avance, entièrement, par celui qui la saisit : elle tient
> en **un seul temps**.
> **Une restitution enregistre une observation** — faite *devant l'objet*, faillible, et c'est la **seule occasion**
> où le parc apprend l'usure : elle mérite son propre temps.

Toute la piste sort de là : l'attribution se replie en **une feuille** (l'objet n'est pas redemandé quand on vient de
sa fiche ; restent *qui* et *à partir de quand*), la restitution garde **deux temps** (ce qui revient, puis l'état).

**Trois manques de la restitution actuelle, corrigés :**

1. **Elle demande de décrire des dégâts avec des mots** (« précisez les dommages… ») sur un téléphone qui a un
   appareil photo. → **photo demandée en premier**, texte derrière et vraiment optionnel.
2. **Elle ne dit pas ce que l'état déclenche.** → les quatre crans sont renommés par leur **conséquence**
   (Repart en stock / Repart avec réserve / À réviser d'abord / Hors service) et la conséquence est **énoncée avant
   de valider** (4ᵉ colonne). Un état qui ne branche sur rien est une information qui meurt dans l'historique.
3. **Elle ne rend qu'un objet à la fois**, par pagination, alors que le vrai moment d'une restitution est un
   **départ** — on rend tout. → entrée depuis la personne, cases à cocher ; le serveur est **décoché par défaut**
   (il change de responsable, pas de lieu).

**Ce qui tombe** : les 4 étapes et la barre de progression doublée du « Étape 2 sur 4 » ; l'**étape 3 SIMULATION**
(signature / empreinte / PIN pour valider quelqu'un **déjà connecté** — démontée, mais la trace de l'opérateur est
écrite automatiquement, sans théâtre de signature) ; la **pagination dans un assistant** ; les badges d'état en
aplats colorés et les rôles en majuscules peintes ; les avatars emoji ; les chips ASSET-… ; les trois jaunes ; et la
synthèse en **boîtes empilées à trois niveaux d'encadrement** → cinq lignes.

**Non visible dans les captures, à cadrer** : le « **Mode de remise** » coupé en bas de l'étape 4 de l'attribution ;
les **étapes 3 et 4 de la restitution** ; et si une restitution peut aujourd'hui **créer une tâche de maintenance**
(la 4ᵉ colonne est donc une proposition).

#### Doctrine du sélecteur — question posée par l'utilisateur le 30/07

> « Comment comptes-tu gérer le listing si pendant l'attribution ou la restitution on a plus de 120 objets ?
> Est-ce la même vue selon qu'on part d'un détail user, d'un détail équipement, ou d'un bouton du dashboard ? »

**Réponse courte : un seul composant de sélection, trois amorces différentes. La vue est la même ; ce qui
change est le nombre de questions qu'elle pose — jamais son dessin.**

**Principe 1 — un sélecteur ne liste jamais le parc, il liste un ensemble de candidats déduit du point
d'entrée.** Chaque origine répond déjà à une partie de la question ; ce qui reste est petit. Le défaut n°1
de l'assistant actuel est là : son étape 1 demande l'objet **même quand on arrive de la fiche de l'objet**.
Règle : **un point d'entrée ne repose jamais une question dont il connaît la réponse.**

**Principe 2 — à l'échelle, on ne choisit pas un numéro de série, on choisit un modèle.** Avec 120 souris
identiques, préférer `MSE-TOG-02` à `MSE-TOG-07` n'est pas une décision, c'est un tirage. Le sélecteur
d'attribution est donc **groupé par modèle, avec un compteur** — « Souris Logitech B100 · 14 disponibles à
Paris » — et **le système désigne l'unité** (la plus ancienne en stock, sur le bon site), affichée avec la
possibilité de la changer pour qui a une raison. C'est ce qui rend l'écran **indifférent au volume** : 14 ou
800 unités, la liste des modèles a la même longueur. Un sélecteur plat par numéro de série grandit avec le
parc ; un sélecteur par modèle grandit avec le catalogue, qui est borné (8 catégories).

**Principe 3 — la restitution ne part jamais d'un objet dans une liste de 800.** On ne restitue pas un objet,
on restitue **depuis quelqu'un**. Donc : choisir la personne (annuaire, borné par l'effectif, avec recherche),
puis sa liste d'objets — **1 à 5, bornée par nature**. Le sélecteur de la capture actuelle (tous les objets
attribués, paginés) est **supprimé** : il pose la question dans le sens où elle ne se pose jamais.

**Principe 4 — le site du destinataire filtre par défaut.** Proposer une souris de Dakar à quelqu'un de Paris
est un transport déguisé en attribution. Les unités des autres sites restent atteignables, sous un intertitre
séparé, avec la conséquence écrite.

**La matrice des points d'entrée** — trois origines × deux gestes :

| Origine | Attribuer | Restituer |
| --- | --- | --- |
| **Fiche équipement** | objet connu → **1 question** : qui. Une feuille, pas d'assistant. | objet **et** porteur connus → **0 sélection** → directement l'écran d'état |
| **Fiche utilisateur** | personne connue → **1 question** : quel modèle (unité désignée, site pré-filtré) | personne connue → **cocher** parmi ce qu'elle détient (1–5) → état |
| **Bouton du dashboard** | **2 questions**, la personne **d'abord**, puis le modèle | **2 questions**, la personne **d'abord**, puis ses objets |

**Pourquoi la personne d'abord depuis le dashboard.** C'est le seul ensemble dont la taille est connue et
stable — l'effectif — et le choisir **réduit immédiatement l'autre côté** : le site du destinataire filtre les
unités disponibles, et pour une restitution sa liste tombe à 1–5. Commencer par l'objet laisse 800 candidats
et n'apprend rien sur la suite.

**Les trois régimes de volume du sélecteur d'objets** reprennent ceux déjà validés sur la liste des
équipements — chips de type en tête avec compteurs, recherche, défilement par lots — appliqués aux **modèles
disponibles** et non aux unités. Cas limite à traiter : **zéro unité disponible sur le site** → on ne montre
pas une liste vide, on annonce les unités des autres sites avec le transport, ou on propose de créer une
demande d'achat.

**Livré le 30/07** : le sélecteur est en **trois colonnes supplémentaires** de
`attribution-restitution-piste.html` — petit parc (14 disponibles), grand parc (800, **le même écran**), et
l'unité désignée avec le cas « zéro disponible sur le site ». En attente de validation.

### Liste utilisateurs — **validée le 30/07**

`screens/utilisateur-liste-piste.html` — capture réelle entière / annuaire **gestionnaire** (3 volumes) /
**sélecteur de destinataire**. Six réglages : les quatre d'aspect + **volume de l'annuaire** (11 / 120 / 800)
et **e-mail dans la rangée** (retiré par défaut). Tous les arbitrages ci-dessous sont appliqués **et validés** :
l'e-mail retiré de la rangée, la feuille d'ajout à deux chemins, le blocage de la suppression d'un compte qui
détient du matériel, et le sélecteur de destinataire.

#### Les arbitrages, et leur raison

Mandat explicite de l'utilisateur : « je te laisse décider pour moi ». Captures lues :
`screens/actuel/utilisateurs.png` et `utilisateur-detail.png`.

**Cadrage.** Le gestionnaire ouvre cette liste pour *trouver une personne*, ou *choisir à qui attribuer*.
Une liste d'utilisateurs dans une application de parc n'est pas un annuaire : elle dit **qui détient quoi**.

Défauts relevés sur la capture, tous déjà arbitrés ailleurs :
1. **Avatars emoji** → initiales sur pastille (décision dashboard du 28/07).
2. **Badges de rôle en MAJUSCULES et en aplats colorés** (vert / bleu / orange) → double interdit §8.4 et
   §8.8 : un rôle n'est pas un état, le peindre est exactement le cas « Headphones en rouge ».
3. **Corbeille rouge par rangée** → part (même arbitrage que la liste équipements).
4. **Pagination avec page active en aplat jaune** → défilement par lots ; 11 annoncés, 10 affichés.
5. **Trois jaunes** : bouton d'ajout, page active, onglet actif.

Décisions prises :
- **Rangée à deux lignes.** L1 : initiales + nom. L2 : rôle · département, et à droite le **nombre
  d'équipements détenus** — c'est le pendant exact du porteur sur la liste équipements, et c'est ce qui
  fait de cet écran une liste de parc plutôt qu'un annuaire. « 0 équipement » est une information.
- **Les rôles montent en tête en pastilles avec compteurs** (super admin 1 / admin 2 / manager 3 /
  utilisateur 5), même grammaire que les états ; le bouton de filtre garde département, site, état du
  compte, activité, et porte le nombre de filtres actifs. **Tri** ajouté (nom, le plus d'équipements,
  sans connexion récente).
- **L'e-mail sort de la rangée** — il reste clé de recherche (le champ l'annonce déjà). Écart assumé avec
  ASSET-10001, gardé lui : on lit une étiquette collée sur un objet, on ne lit pas un e-mail sur une
  personne, et il fait trois fois la longueur du nom qu'il écrase. **Réglage dans le panneau** pour que
  l'utilisateur puisse revenir dessus.
- **Feuille d'ajout à deux chemins** : inviter par e-mail / importer depuis l'annuaire — cohérent avec
  l'arbitrage Login (le backend sait si le compte est Azure ou local). *Proposition.*
- **Colonne 3 = « choisir un destinataire »** : la même liste en contexte d'attribution, atteinte depuis
  le bouton Attribuer de la fiche équipement. C'est ce qui justifie la charge d'équipements et le site
  dans la rangée. *La capture est arrivée le 30/07 : c'est l'**étape 2 d'un assistant en 4 étapes**. Traitée
  en entier sur la planche « Attribuer et restituer » ; la colonne 3 en reste le sélecteur de personne.*
- **Six réglages** : les quatre d'aspect + volume de l'annuaire (11 / 120 / 800) + e-mail dans la rangée.
- **Données fabriquées à déclarer** : le 11ᵉ utilisateur (page 2 non capturée), les départements (déduits
  des noms : IT HQ, Ventes, Finance, Support), la répartition des 7 actifs attribués sur les personnes
  (Alice 2 — confirmé par sa fiche —, Jane 1, Ethan 2, Oumar 1, Marc 1), les volumes 120 et 800.

### Détail utilisateur — piste livrée le 30/07

`screens/utilisateur-detail-piste.html`, groupe « 8. Détail utilisateur ». **Première planche sans colonne
« État actuel »** (règle amendée du 30/07) : les défauts relevés sur `actuel/utilisateur-detail.png` sont écrits
ici et résumés dans l'intro de la planche. Trois colonnes — fiche gestionnaire / le menu de débordement ouvert
(sur Marc, un compte supprimable) / « Mon profil ». Cinq réglages : **état du compte** (actif / suspendu / départ
prévu, qui change le bandeau **et** le geste primaire) + les quatre d'aspect. Tous les arbitrages consignés le
29/07 (section suivante) sont appliqués, plus trois précisions prises au dessin :

- **Le blocage de suppression ne s'explique pas, il s'évite** : quand la personne détient du matériel, l'entrée
  « Supprimer le compte » **disparaît** (règle : une action impossible se masque) et le menu offre à la place
  **« Organiser la restitution »** — le chemin qui débloque. Sur un compte sans matériel, l'entrée est là avec
  sa raison en sous-ligne.
- **La suspension ne rend pas le matériel** : le héro le dit explicitement dans l'état « suspendu ». C'est le
  malentendu le plus coûteux d'un parc.
- **Le serveur figure dans les objets détenus avec la mention « responsable »** : Alice en répond, il ne quitte
  pas la salle. C'est le même arbitrage que la case décochée par défaut dans la restitution.

**Contradiction relevée dans les données de démonstration, à vérifier côté code** : la fiche d'Alice annonce
« Équipements assignés : 2 » alors que l'écran de restitution liste **trois** objets à son nom (LPT-HQ-01,
MSE-HQ-03, SVR-HQ-01). La planche retient **trois**.

### Détail utilisateur — arbitrages pris, planche PAS ENCORE DESSINÉE (29/07)

Même moule que la fiche équipement. **Le principe :** une fiche utilisateur est le **lien entre une
personne et ce qu'elle détient** ; le reste (téléphone, dernier login, notes) est de la référence bornée.

- **Un seul en-tête** : « Profil utilisateur » et la barre au nom font double emploi.
- **Les onglets Aperçu / Équipements disparaissent.** Une personne détient une poignée d'objets : la
  liste tient dans une carte bornée. Et « Équipements assignés : 2 » comptait dans l'Aperçu ce que
  l'onglet listait à côté.
- **« Appareil principal » est supprimé** : notion inventée par l'écran — une souris y figure comme
  appareil principal, ce qui suffit à le prouver.
- **La carte « Sécurité du compte » (DÉMO) est démontée**, mais pas comme les cartes du détail
  équipement : ses **actions sont réelles** (réinitialiser le mot de passe, suspendre) et montent en
  entrées nommées du menu de débordement ; seuls ses **états DÉMO** (Entra ID, PIN) disparaissent.
- **« Demandes en attente : 1 » quitte les compteurs** — jurisprudence dashboard : un statut qui appelle
  une action n'est pas un compteur. Il devient un lien vers la file Tâches filtrée sur la personne.
- **« Notes manager » vide est une carte morte** : la carte n'apparaît qu'avec une note, sinon
  « Ajouter une note » est une entrée du menu.
- **Le geste primaire suit l'état du compte** : Attribuer un équipement (actif), Réactiver (suspendu),
  **Organiser la restitution** (départ prévu — le moment où un parc se perd).
- **Historique borné à 3** + lien vers Audit filtré sur la personne. Ici il est légitime (c'est sa fiche),
  contrairement à la vue utilisateur final du détail équipement.
- **Supprimer un utilisateur qui détient du matériel doit être bloqué** — règle proposée, à valider.
- **Colonne 3 = « Mon profil »**, la destination validée du menu de l'avatar.

### CORRECTION MAJEURE n°2 du 30/07 — la double attestation, et elle existe déjà

L'utilisateur a repris la piste une deuxième fois, et il avait raison une deuxième fois. Ses mots :

> « comment un équipement est attribué, comment un équipement est restitué, et comment les intervenants
> confirment leurs actions ? […] quand un IT donne et qu'un user reçoit ou restitue, **chacun doit valider son
> action** pour qu'on ne se retrouve pas dans une situation ambiguë. Si l'IT ne valide pas et qu'il oublie
> l'opération, comment l'user va prouver qu'il a restitué si l'IT affirme ne pas se rappeler avoir reçu ? »

**Erreur 1 — le découpage en deux planches.** « Le geste » et « La chaîne » n'étaient pas deux sujets, mais la
même opération à deux niveaux de zoom. Découpage d'analyse imposé au lecteur. **Une planche unique**,
`attribution-piste.html`, organisée par les trois questions de l'utilisateur.

**Erreur 2, plus grave — j'avais posé la preuve comme un acte unilatéral.** « Le bénéficiaire signe sur le
téléphone de l'informatique » : c'est un récépissé, ce n'est pas ce qui lève l'ambiguïté. Le besoin réel est
**deux attestations, une par partie, chacune sur son propre acte** — l'informatique atteste avoir remis, la
personne atteste avoir reçu.

**Et ce mécanisme est déjà dans le produit** — je ne l'avais pas vu alors qu'il est écrit dans
`dashboard-analyse.md`, dans ce projet même (§7, erreur n°11, encore) :

- KPI utilisateur : « **Réceptions à confirmer** — les livraisons dont elle doit accuser réception » ;
- KPI administrateur : « **En attente** » ;
- bloc « à traiter » : validations managériales **et** réceptions à confirmer.

Ces deux compteurs sont **les deux faces du même état intermédiaire**. Le produit sait déjà qu'une remise faite
n'est pas une remise reçue ; l'interface ne le disait nulle part.

#### Le modèle retenu, en une phrase

> **Un objet ne change pas de mains sans que les deux parties le disent.** Entre les deux attestations, il est
> dans un état intermédiaire qui **n'accuse personne** : ni disponible pour un autre, ni sous la responsabilité
> de qui que ce soit.

Cinq statuts, quatre transitions, chacune portée par une personne : disponible → *(l'informatique remet et
atteste)* → **en attente** → *(la personne accuse réception et atteste)* → attribué → *(la personne rend et
atteste)* → **retour à confirmer** → *(l'informatique réceptionne, constate l'état et atteste)* → disponible ou
en réparation.

**Ce que le statut décide** : chaque écran qui montre un équipement propose **le geste que le statut autorise, et
lui seul** — c'est la règle qui remplace la barre d'actions fixe. La matrice statut × qui regarde est dessinée en
tête de planche.

**Les trois mécanismes ne sont pas trois boutons équivalents.** Signature (on a un instant, ensemble), code à
4 chiffres (ensemble mais pressé — impossible pour qui ne s'est jamais connecté, il n'a pas de code), empreinte
(sur son **propre** appareil, pour les actes à conséquence financière déclenchés à distance). L'application
propose **celui que la situation permet** ; elle ne fait pas choisir dans une liste.

**Les deux statuts intermédiaires ne prennent pas le jaune de marque.** Première version : « en attente » et
« retour à confirmer » en `#FDC910` — ce qui remettait un **troisième jaune** dans la colonne « quand l'autre
partie n'est pas là » (pastille d'état + bouton Relancer + onglet actif) et faisait cohabiter, à 40 px l'un de
l'autre, un jaune d'état et un jaune d'action. Corrigé : les deux statuts prennent une **ocre propre `#A97C00`**,
de la famille « Attention » du §4, et le héro remplace sa pastille par une **icône d'horloge** — l'état est déjà
écrit en toutes lettres à côté. Règle confirmée : *les teintes LIVE disent un état, le jaune reste l'unique accent
d'action*, et un état qui n'a pas de teinte LIVE prend une ocre, jamais la marque.

#### Les trois décisions déléguées, et leur raison

- **L'attestation est obligatoire des deux côtés.** Facultative, elle ne prouve rien : le jour où elle manque, on
  ne sait pas si le geste n'a pas eu lieu ou si personne n'a cliqué. Ce qui reste libre est le **délai** — l'objet
  peut rester en attente aussi longtemps qu'il faut, visiblement, avec un propriétaire et une relance.
- **« Réaffecter » existe, mais ne saute rien** : c'est une restitution puis une attribution, donc **quatre**
  attestations. Le raccourci porte sur la navigation, jamais sur la preuve.
- **Le manager est un champ saisi** sur la fiche utilisateur, pas déduit du département : deux personnes du même
  service peuvent dépendre de managers différents, et une validation adressée à la mauvaise personne est pire
  qu'une validation absente.

#### Ce qui reste à vérifier côté code — je n'ai pas accès au dépôt depuis ce projet

L'utilisateur a demandé quatre fois « vérifie dans le code ». Ce projet ne contient que les captures et les
analyses ; les trois questions à poser, dans l'ordre :

1. Les actions sont-elles réellement **filtrées par statut**, et où ? (fiche équipement, rangée de liste au
   survol, boutons du tableau de bord.) L'utilisateur pense que oui.
2. L'état « **en attente** » est-il un **statut de l'actif** ou une entrée de file distincte ? Les deux compteurs
   suggèrent un statut, et toute la planche le suppose.
3. Le **mécanisme d'attestation** est-il enregistré avec l'événement d'audit (qui, quand, **par quel moyen**), ou
   seulement l'auteur et l'heure ? C'est ce qui donne sa valeur au fil des passages de main.

### Passe d'assainissement du 30/07 (au soir)

Trois défauts relevés en relisant le chantier, corrigés le jour même.

- **Un bloc dupliqué dans `attribution-restitution-piste.html`.** La rangée du sélecteur d'objets — intro
  comprise — était écrite **deux fois à l'identique** (10 382 caractères, ligne pour ligne). Supprimée. Cause
  probable : une écriture de fichier reprise sans relire la fin. → **Après toute réécriture d'une planche
  existante, vérifier que le nombre de colonnes correspond à ce que la note annonce.**
- **Deux groupes pour un seul parcours.** « 7. Attribuer et restituer » et « 9. Workflow d'attribution »
  décrivaient le même geste à deux niveaux, avec le détail utilisateur (8) coincé entre les deux dans le volet.
  Fusionnés en **« 7. Attribuer, réattribuer, restituer »**, deux cartes : *Le geste* puis *La chaîne*.
- **Les vignettes d'équipement ne s'alignaient pas sur les avatars.** 56 × 42 px (paysage) contre 44 × 44 px
  (carré) : deux rangées de même grammaire, à deux gabarits. La vignette passe en **44 × 44**, et suit la même
  échelle de densité que l'avatar (aérée 52, compacte 40). Un objet et une personne occupent désormais la même
  place dans une rangée — c'est ce qui permet de les lire comme deux listes du même produit. *Le format paysage
  se défendait pour une photo d'écran ou de portable ; il ne se défend pas contre la cohérence des deux listes.*

### Créer, corriger, sortir un équipement — piste livrée le 30/07

`screens/equipement-creation-piste.html`, groupe « 9 ». Quatre colonnes, cinq réglages : **geste** (créer /
modifier, sur la première colonne) + les quatre d'aspect.

**Pourquoi cette planche existe :** la liste des équipements avait validé une feuille d'ajout à trois chemins et
la fiche un menu de débordement à quatre entrées. **Sept destinations nommées, zéro dessinée.** Un menu qui ouvre
le vide est un menu qui ment.

**Le principe :** un écran de saisie ne demande que ce qui **ne se déduit pas**. C'est la doctrine du sélecteur,
appliquée aux **champs** plutôt qu'aux étapes.

- **Créer et modifier sont le même écran.** Mêmes champs, même ordre, même validation ; seuls changent le titre,
  le libellé du bouton et le fait que les champs sont remplis. En faire deux garantit qu'ils divergeront.
- **Ce qui n'est pas saisi** : le modèle vient du **catalogue** et emporte marque, type et durée d'amortissement
  (les redemander ouvre la porte à trois orthographes du même portable) ; le **code `ASSET-…` est généré**,
  montré à l'enregistrement, jamais tapé — un identifiant saisi à la main est un doublon en puissance. Le
  **numéro de série** est le seul champ que rien ne connaît : il est en tête et il se **scanne**.
- **Importer une livraison est une file de saisie, pas un formulaire.** Le BL porte le modèle et la quantité ; il
  manque un numéro de série par unité. La caméra reste ouverte, compte, et dit l'écart avec l'attendu — le
  comportement déjà validé pour le récolement. **Rien n'est écrit avant l'accord**, les fiches s'ouvrent en
  **brouillon** : on peut s'arrêter à 3 sur 12 sans laisser trois demi-fiches dans le parc.
- **Déclarer un incident : photo d'abord**, même jurisprudence que la restitution. Trois crans nommés par ce
  qu'ils déclenchent — continue de servir / immobilisé / hors service — et la conséquence écrite avant de
  valider. Le troisième croise la règle du workflow : **ce qui constate passe, ce qui coûte demande**.
- **Sortir du parc dit trois choses** avant de laisser valider : ce qui disparaît (listes, sélecteurs), ce qui
  reste (l'historique, dans Audit), ce que ça coûte (la valeur résiduelle passe en perte, donc validation). Le
  **motif est le seul champ obligatoire de la planche** — une sortie sans motif rend l'inventaire indéfendable
  six mois plus tard. Sur un objet **attribué**, l'entrée **n'apparaît pas** : elle est remplacée par
  « Organiser la restitution » — *une action impossible se masque, elle ne s'explique pas*, comme la suppression
  d'un compte qui détient du matériel.
- **Le rouge de cette planche est le seul, et il porte un sens** : l'acte est irréversible et produit une écriture
  de perte. C'est le cas que l'interdit §8.8 autorise.

**À trancher côté code** : le produit crée-t-il une tâche de maintenance depuis un incident ? Le rebond
« proposer un remplacement » est nouveau. Le brouillon d'import de livraison reste à spécifier.
**Données fabriquées, déclarées à l'écran** : le modèle Dell Latitude 5540, ASSET-10015, BL-2026-118 et ses trois
numéros de série lus, la valeur résiduelle 312 XOF, les 14 événements.

### Créer un compte utilisateur — piste livrée le 30/07

`screens/utilisateur-creation-piste.html`, groupe « 10 ». Quatre colonnes, cinq réglages : **rôle accordé**
(utilisateur / manager / administrateur — il change l'option retenue *et* la conséquence énoncée) + les quatre
d'aspect.

- **Un compte n'est pas un profil.** Ni nom, ni téléphone, ni département : la personne les porte, ou l'annuaire
  les sait. Inviter tient en **trois réponses** — l'adresse, le rôle, le site. Même règle que le catalogue côté
  équipement.
- **Le rôle est le seul champ à conséquence, il est donc dit par sa portée** : « manager » ne veut rien dire hors
  de cette application, « valide les demandes de son équipe » si. **Les quatre rôles du produit sont dessinés**
  (utilisateur, manager, administrateur, super administrateur) — le quatrième avait d'abord été oublié alors que la
  note l'annonçait : erreur n°8 du §7, relevée en autocontrôle. Un rôle choisi sur son nom est un droit accordé
  à l'aveugle. C'est aussi le pendant du **maillon 2** de la chaîne : sans manager, il n'a personne pour le tenir.
- **Importer depuis l'annuaire porte le volume**, l'invitation non : recherche, cases, compteur. **Ce qui existe
  déjà se montre, désactivé, avec sa raison** — masquer ferait chercher en vain, proposer créerait des doublons.
  **Le rôle s'applique à la sélection entière** : on importe une équipe, pas douze individus ; les exceptions se
  corrigent après, sur les fiches.
- **La quatrième colonne n'est pas un accusé de réception, c'est la fiche** — geste primaire déjà armé, parce que
  ce qu'on fait juste après avoir créé un compte, c'est lui attribuer du matériel.
- **Ce qu'un compte en attente autorise, écrit nulle part jusqu'ici.** On **peut** lui attribuer un équipement :
  l'objet part chez une **personne**, pas chez un compte. On **ne peut pas** lui faire taper son code à 4 chiffres
  à la remise — il n'en a pas encore : sa première remise passe par **signature**. C'est la règle de la planche 7
  (*la forme de la preuve dépend d'un fait, pas d'une préférence*) appliquée à un cas qu'elle n'avait pas prévu —
  le fait n'est plus « le bénéficiaire est-il là » mais « a-t-il déjà un code ».

**Trois questions ouvertes** : (a) l'annuaire d'entreprise est-il réellement interrogeable (Entra ID, LDAP) ou
l'« import » est-il un **fichier** ? — les deux se dessinent différemment ; (b) une invitation **expire-t-elle** ?
la planche propose relance à 7 jours, expiration à 30, *aucun des deux n'existe* ; (c) le rôle est-il **modifiable
après coup**, et par qui ? Si seul le super-administrateur peut le faire, le choix initial est bien plus lourd
qu'il n'en a l'air, et il faudrait le dire à l'écran.
**Données fabriquées, déclarées à l'écran** : Karim Diallo et son adresse, les six personnes de l'annuaire, les
mentions « a déjà un compte », les deux délais de relance.

### Icônes de la barre du bas

Vérifiées dans `src/constants/destinations.ts` — utiliser exactement celles-là :

| Libellé | Icône Material |
| --- | --- |
| Accueil | `dashboard` (quatre rectangles **inégaux**, pas quatre carrés) |
| Actifs | `devices` (moniteur + socle + téléphone, bases alignées) |
| Tâches | `task_alt` |
| Équipe | `group` |
| Plus | `menu` |

## 7. Erreurs commises — à ne pas répéter

Elles ont toutes été relevées par l'utilisateur. Elles disent où sont les pièges.

1. **Avoir consigné comme « arbitrage rendu » une suppression jamais approuvée.** Il avait
   répondu sur le manager, j'en ai déduit une réponse sur les graphiques. → **Ne consigner
   que ce qui a été dit explicitement.**
2. **Avoir affirmé que les graphiques du dashboard portaient sur tout le parc. C'est faux.**
   `DashboardPage.tsx:50` : `equipment = filterEquipment(allEquipment, users)`. KPI,
   répartition et garantie sont **tous** calculés sur cet ensemble déjà filtré par le
   périmètre d'accès. → **Vérifier dans le code avant d'affirmer.**
3. **Avoir ajouté des sections qui n'existent pas** (« Mes équipements », « Mes demandes »)
   dans une maquette censée refléter l'écran actuel.
4. **Avoir renommé un libellé de bouton** (« Nouvelle demande » → « Faire une demande »)
   sans le signaler.
5. **Avoir livré le Dashboard sans sa réplique de l'existant**, alors que le Login en avait
   une. L'utilisateur ne pouvait pas comparer.
6. **Avoir dessiné des icônes approximatives** au lieu de reprendre celles du code.
7. **Avoir écrit des hauteurs en pixels dans la prose** (« ~190 px », « ~245 px »). Une mesure
   dérive au premier ajustement de composition et la note devient fausse en silence. →
   **Énoncer l'invariant, pas la mesure.**
8. **Avoir laissé une note décrire ce qui n'est plus dessiné** (un agrégat retiré, « 9 types »
   devenu 8). → **Quand le dessin change, relire la note qui le commente.**
9. **N'avoir pas déclaré une donnée fabriquée** : la ventilation des disponibles par type est
   une hypothèse, le jeu de démonstration ne donne que le total. → **Toute donnée inventée est
   annoncée comme telle, à l'écran.**
10. **Avoir répondu sur le menu de l'avatar sans avoir lu l'écran Paramètres**, qui possède
    déjà un onglet Compte. La correction est venue de l'utilisateur. → **§2.4, encore.**
11. **Avoir déclaré une vérification impossible** (« je n'ai pas accès au code ») alors que
    l'analyse de `DashboardPage.tsx` était **déjà dans le fichier d'analyse de ce projet**. →
    **Chercher d'abord dans les fichiers du projet. Si l'information n'y est vraiment pas,
    formuler la question précise à poser côté code et attendre la réponse — ne jamais
    inventer, ne jamais bloquer.**
12. **Avoir répondu sur les deux menus après n'avoir regardé qu'une seule capture de l'écran
    Paramètres** — celle de l'onglet ouvert par défaut, sur cinq. Le découpage proposé
    reposait donc sur un cinquième du contenu, et le cinquième onglet (Aide) a invalidé la
    règle énoncée. → **Un écran à onglets n'est pas lu tant que tous ses onglets ne le sont
    pas. Demander les captures manquantes au lieu de raisonner sur celle qu'on a.**
17. **Avoir découpé une planche selon ma logique d'analyse et non selon l'usage.** « Le geste » / « La chaîne » :
    deux niveaux de zoom présentés comme deux sujets. → **Un découpage qui a besoin d'être expliqué est un mauvais
    découpage.**
18. **Avoir cherché la preuve du mauvais côté.** J'ai conclu qu'il fallait faire signer le bénéficiaire sur
    l'appareil de l'informatique, alors que le besoin était que **chacun atteste son propre acte**. Le mécanisme
    existait déjà dans le produit sous le nom « réceptions à confirmer », **et il était écrit dans un fichier de ce
    projet que j'avais moi-même rédigé**. → §7, erreur n°11 : **relire ce que le projet contient déjà avant de
    concevoir**.
14. **Avoir livré une planche contenant un bloc dupliqué à l'identique** — la rangée du sélecteur d'objets,
    écrite deux fois, 10 382 caractères chacune. Personne ne l'a vu pendant une journée parce que la planche est
    longue et qu'on la lit par le haut. → **Une planche se relit par la fin.**
15. **Avoir laissé deux gabarits pour la même rangée** — vignette d'objet en 56 × 42, avatar de personne en
    44 × 44. Chaque planche était cohérente avec elle-même ; l'ensemble ne l'était pas. → **La cohérence se
    vérifie entre les planches, pas dans chacune.**
16. **Avoir nommé sept destinations sans en dessiner aucune** (feuille d'ajout à trois chemins, menu de
    débordement à quatre entrées). Un menu qui ouvre le vide donne l'illusion d'un parcours complet. → **Quand une
    planche nomme une destination, l'inscrire immédiatement dans les écrans à faire.**
13. **Avoir corrigé une cible tactile en créant un pseudo-lien de 12 px** (« Déplier »). Une
    correction d'accessibilité se vérifie sur l'élément réellement cliquable, pas sur
    l'intention.

## 8. Pièges techniques de l'outil DesignSync

- **Le masquage par réglage se fait battre par la spécificité.** Les planches montrent leurs variantes avec
  `.x{display:none}` + `body[data-reglage] .x{display:block}`. Une classe simple pèse (0,1,0) et **perd** contre
  n'importe quelle règle de mise en page descendante — `.conseq .cl{display:flex}`, `.hero .ht>span{display:block}`,
  `.sttl .sub{display:block}` pèsent (0,2,0) ou plus. Résultat : **toutes les variantes s'affichent en même temps**,
  et la feuille déborde. Constaté le 30/07 sur les deux nouvelles planches. **Parade retenue** : tripler la classe
  (`.r-u.r-u.r-u{display:none}`) plutôt que `!important`, et tripler aussi la règle d'affichage pour qu'elle
  repasse devant. **À vérifier systématiquement** : compter les éléments réellement visibles, pas relire le CSS.
- **Une feuille (`.sheet`) ne prévient pas quand elle coupe.** `overflow:hidden` clippe en silence : la dernière
  ligne disparaît sans ascenseur ni indice. Test à faire sur chaque colonne, **dans les trois densités** :
  `sbody.scrollHeight - sbody.clientHeight` doit valoir 0. La densité « aérée » est le pire cas — elle gonfle
  `--rowy`, `--btnh` et `--avs` à la fois, et une liste de six rangées y prend +120 px. **Corollaire** : une rangée
  de liste se borne par une `min-height` fixe, pas par un padding en `var(--rowy)`.

- **`_ds_manifest.json` est désormais régénéré automatiquement** à chaque tour. Ne plus
  l'écrire à la main — c'est un fichier compilé. Même chose pour `_ds_bundle.js` et
  `_adherence.oxlintrc.json`.
- Les cartes du volet Design System viennent du commentaire `@dsCard` en **première ligne**
  du fichier HTML. Sans lui, le fichier existe mais n'apparaît nulle part.
- L'utilisateur doit **recharger en vidant le cache** (`Ctrl + Maj + R`).
- `finalize_plan` exige **`writes` ET `deletes`**, même vide.
- Les **chemins relatifs d'images fonctionnent** : `actuel/xxx.png` depuis
  `screens/ui-actuelle.html`.
- Écrire un fichier existant le remplace ; le volet reflète la nouvelle version au
  rechargement.

### Piège — deux familles de balisage pour un même composant

Relevé sur la **barre du bas**, et c'est le défaut le plus coûteux du chantier : `<nav class="nav">`
avec des icônes `n-*` dans les planches anciennes, `<div class="nav">` avec des `i-*` dans les
récentes. Un inventaire cherchant `<div class="nav">` ne voyait **que la moitié des barres** — d'où
une conclusion « conforme » erronée, puis deux corrections qui ont **empilé** des barres au lieu de
les remplacer, et des `<use href="#i-dash">` pointant vers des symboles absents du sprite local.

**Règle : un balayage de cohérence se fait sur le rôle, jamais sur une chaîne.** Chercher
« qu'est-ce qui sert de barre du bas ici ? », pas `<div class="nav">`. Et vérifier **dans le DOM**,
téléphone par téléphone, pas en comptant des sous-chaînes.

Corollaire : chaque planche portant son propre sprite, **toute icône employée doit être définie dans
le fichier**. Un `<use>` orphelin ne casse rien — il dessine du vide, et ça passe inaperçu.

### Piège récurrent — une classe de réglage écrase `display:flex`

Relevé **trois fois** (planches 11 et 16). Les planches montrent leurs variantes avec des classes
conditionnelles en **triple spécificité** :

```css
.r-g.r-g.r-g{display:none}
body[data-role="gest"] .r-g.r-g.r-g{display:block}
```

Cette règle bat le `display:flex` du composant, qui n'a qu'une classe. Un élément **flex ou grid**
qui porte une classe de réglage perd donc silencieusement sa mise en page : les enfants
redeviennent `inline`, le `gap` cesse d'agir, le centrage disparaît. Rien ne casse — c'est
pourquoi ça passe inaperçu.

**Règle : tout élément flex portant une classe de réglage porte aussi `fx`.** L'échappatoire
existe déjà dans chaque planche :

```css
body[data-role="gest"] .r-g.r-g.r-g.fx{display:flex}
```

À vérifier systématiquement sur `.trow`, `.pag`, `.hero`, `.hi`, `.page`, `.opt`, `.cl` —
tous les composants du chantier qui sont en flex.

## 9. Points ouverts

**Ordre de priorité pour la reprise** — les trois premiers bloquent le dessin, les suivants
bloquent l'implémentation :

1. Le parc est-il réellement **multi-entités** (valeur par entité France / Sénégal / Togo, badgée
   DÉMO) ? Si oui, un sélecteur de périmètre entre dans le menu de l'avatar et **tous les « sur 14 »
   du dashboard changent de sens**.
2. L'écart entre les deux **« total dépenses »** (17 615 dashboard / 17 440 Journal) : deux notions
   ou un défaut ?
3. Le **coût estimé de renouvellement** est-il dérivable ? Il transforme le pont parc ↔ budget en
   verdict.
4. Les dix questions pour Claude Code ci-dessous.
5. Les amendements du brief (surface inversée, filets séparateurs, activité en dernier, agrégation
   d'événements, renommage « Restituer »).
6. Les points de conformité couleur Q-B2, Q-B3, Q-B6.

Puis l'implémentation React de la direction B, **en une seule vague** : les trois directions
explorées n'en produisent qu'une en production.

**Design**

- **Q-B1** — muted `#A29D93` à 2,57:1 : inutilisable pour du texte, y compris non-texte
  (seuil 3:1). Recommandation : réserver au décoratif, faire porter les micro-labels par le
  secondaire. *Appliqué dans les maquettes, non arbitré formellement.*
- **Q-B2** — secondaire `#78746C` à 4,42:1 sur canvas, sous AA. `#726E66` donnerait 4,82:1
  pour un écart imperceptible. **Non tranché.**
- **Q-B3** — nav active `#B8860B` à 3,09:1, insuffisant pour le libellé 11 px. `#8A6508`
  (5,06:1) utilisé dans les maquettes. **Non tranché formellement.**
- **Q-B6** — graisse forte : **500** (spec d'écran, appliqué) contre **600** (brief, niveau
  système). Un seul point à basculer : `--tk-type-weight-strong-next`. **Non tranché.**
- **Dashboard utilisateur** : garder ou retirer « Mes équipements par type » et
  « Garantie » (désormais réduite à une rangée) ? Maintenant qu'on sait qu'ils sont scopés à ses propres équipements,
  l'argument pour les retirer est beaucoup plus faible. **À l'utilisateur de dire.**

**Arbitrages Dashboard en attente (28/07)**

- ~~Le bloc financier double l'écran Finances~~ — **clos le 29/07**, décision déléguée à la
  conception : fusionné avec la garantie en une carte « État du parc », valeur restante
  rapportée à l'investissement, un seul lien vers Finances.
- **Le parc est-il multi-sites — voire multi-entités ?** Emplacements occupe trois écrans et le
  dashboard ne dit rien du *où*. **L'onglet Synthèse de Finances affiche une « valeur par
  entité » sur trois pays (France, Sénégal, Togo)**, badgée DÉMO. Si c'est réel, le sélecteur de
  périmètre appartient au menu de l'avatar et il requalifie tous les « sur 14 » du dashboard.
- ~~Onglets Journal et Pilotage de Finances : non capturés~~ — **lus le 29/07.** Journal = les
  dépenses de l'exercice (total Q1 17 440 XOF, budget restant 132 560, 11,6 % consommé, historique
  des transactions, saisie par **scan de facture**). Pilotage = le budget par **enveloppe
  CAPEX/OPEX** (Matériel IT 85 000, Licences 35 000, Cloud 20 000, Maintenance 10 000 — alloué /
  dépensé / restant, avec import Excel annuel).

  **Conséquence de structure, appliquée :** l'argent du dashboard n'est pas une matière mais
  **trois** — le parc physique (risque : garantie, fin de vie), la valeur comptable (subie, aucune
  décision), le budget de l'exercice (engagement, remis à zéro chaque année). Le test qui tranche :
  *qu'est-ce qui change si le chiffre bouge ?* La valeur nette comptable a donc **quitté le
  dashboard** (elle reste derrière un lien) et une carte **« Budget 2026 »** est apparue. Règle
  retenue : **on compte des choses quand on agit sur des choses, de l'argent quand on engage de
  l'argent** — quantité en tête pour le parc, montant en tête pour le budget.

  **2ᵉ passe, même jour.** (a) Le dashboard porte le **budget global seul** (17 440 sur 150 000,
  11,6 %) : ventiler une enveloppe sur quatre, c'était commencer une ventilation sans la finir. Le
  global cache toutefois l'enveloppe crevée pendant que le total rassure — d'où la règle **dire
  l'exception, jamais la liste** : la note dit « aucune enveloppe ne dépasse son rythme », et le jour
  où l'une le dépasse, c'est elle, nommée, qui apparaît. (b) **Un repère de rythme** est posé sur le
  filet, au quart d'exercice écoulé : 11,6 % n'est ni bon ni mauvais tant qu'on ne sait pas où on en
  est de l'année — le filet dit désormais « 13 points sous le rythme », ce qu'aucun nombre ne dit.
  Journal et Pilotage affichent tous deux un filet nu, donc un chiffre injugeable. (c) **L'amortissement
  n'a pas disparu, il a changé de forme** : de ses trois expressions (VNC, efficacité 47 %, actifs
  amortis à plus de 85 %), seule la troisième porte une décision — elle est en tête d'« État du parc »,
  exprimée en **objets à traiter**. (d) **Le pont entre les deux cartes** est la seule chose que le
  dashboard peut faire mieux que la somme des écrans : « leur renouvellement s'impute sur Matériel IT,
  où 72 500 XOF restent engageables ». Aucun écran de l'application ne met aujourd'hui la pression de
  renouvellement en regard de l'enveloppe CAPEX.
- **Deux « total dépenses » qui ne s'accordent pas** : 17 615 XOF sur le dashboard contre **17 440
  XOF** sur le Journal (« Total dépenses Q1, exercice 2026 »). Hypothèse : prix d'acquisition des
  actifs d'un côté, transactions de l'exercice de l'autre. Deux notions distinctes sous un libellé
  presque identique — dette de vocabulaire avant d'être un défaut d'affichage. **À trancher côté code.**
- **Le scan existe déjà dans l'application** (« Nouvelle Dépense — scanner facture ou saisie
  manuelle »). La suggestion d'un scan de code-barres pour Attribuer / Restituer n'est donc pas une
  invention de maquette : le geste est déjà dans le vocabulaire du produit.
- ~~« Besoin d'aide ? » est une carte vide~~ — **clos le 29/07**, retirée des deux vues ; le
  centre d'aide de l'application remonte dans le menu de l'avatar sous *Aide et support*.
- ~~La barre du bas doit-elle s'adapter au rôle ?~~ — **clos le 29/07**, appliqué : quatre
  onglets pour l'utilisateur. Reste à confirmer côté code qu'il n'a pas accès à Équipe.
- ~~La carte Garantie fusionne-t-elle avec le bloc financier ?~~ — **clos le 29/07**, oui.
- **Les motifs LIVE de la maquette sont des approximations.** Les SVG officiels sont attendus.
- ~~L'amortissement est paramétré par catégorie et la « valeur actuelle » en découle sans le
  dire~~ — **clos le 29/07** : la provenance est écrite sous la rangée de valeur.

**Questions bloquantes pour l'implémentation** (détaillées dans `dashboard-analyse.md`)

1. La file Tâches accepte-t-elle **filtre et tri en paramètres de navigation** ? Toute la
   stratégie de destination unique en dépend.
2. La file permet-elle la **sélection multiple** ? À 999 demandes, sans elle, rien ne tient.
3. Le **nombre de disponibles par type** est-il exposé par l'API ? « Types en tension » en
   dépend entièrement.
4. Le tri par ancienneté et le comptage « 5 premiers + reste » se font-ils **côté serveur** ?
5. Le mot de passe est-il géré dans l'app ou délégué à l'annuaire (AD / SSO) ? S'il est
   délégué, l'entrée disparaît de *Mon compte*.
7. **Découper l'écran Paramètres en deux routes** (*Mon compte* / *Configuration*) est-il
   coûteux, ou les cinq onglets sont-ils déjà des composants indépendants ?
8. L'onglet **Collecte** est-il visible par tous les administrateurs ou réservé au
   super-administrateur ? S'il est réservé, *Configuration* est une destination à droits.
9. Le **budget annuel et sa consommation** sont-ils exposés au dashboard (endpoint, périmètre, date
   d'arrêté) ? La carte « Budget 2026 » en dépend, ainsi que le calcul du repère de rythme.
10. Le **coût estimé de renouvellement** des actifs en fin de vie est-il dérivable (prix
    d'acquisition par actif, modèles du Catalogue) ? Il transformerait le pont en verdict
    (« 72 500 disponibles, ~50 000 nécessaires : couvert »). Toute estimation devra être **déclarée
    comme telle à l'écran**.
6. Une personne peut-elle appartenir à **plusieurs sites** ? Si oui, le sélecteur de périmètre
   appartient au menu de l'avatar — et il change tout ce que l'écran affiche.

**Technique**

- **La police n'est pas figée.** `index.css` charge Inter depuis Google Fonts sans version :
  le rendu dérive tout seul d'un jour à l'autre. La figer invalidera les **39 captures de
  référence** d'un coup, donc c'est à faire en début de chantier. **L'utilisateur n'a pas
  répondu.**
- **« Derniers événements » est-il filtré par rôle ?** L'admin voit les sessions des autres
  utilisateurs. Pour l'utilisateur final, **à vérifier dans le code** avant l'implémentation
  — si ce n'est pas filtré, c'est une fuite d'information.

## 10. Ce qu'il faut savoir du code avant d'implémenter

L'écran **Audit compact est déjà basculé** et sert de patron :
`src/features/audit/components/AuditOverviewMobile.tsx`.

- **Namespace `adn-*`** dans `tailwind.config.js` : `text-adn-text`, `bg-adn-surface-muted`,
  `rounded-adn-card`… Ces classes existent pour les écrans basculés et disparaîtront à la
  fin de la migration.
- **⚠️ Piège de cascade, mesuré :** les classes du typescale vivent dans `index.css`, donc
  **après** les utilitaires Tailwind. À spécificité égale, `.text-title-medium` (700)
  l'emporte sur `.font-medium` (500) et la surcharge est **perdue en silence**. Utiliser les
  variantes **`-plain`** (`.text-title-medium-plain`, `.text-headline-medium-plain`,
  `.text-label-large-plain`, `.text-label-small-plain`, `.text-stat-value-mobile`).
- **`--tk-type-weight-strong-next`** est le levier unique de la graisse forte.
- **`--tk-radius-control / -card / -sheet`** valent désormais **4 / 8 / 8** et pointent sur
  l'échelle canonique.
- **Séparer le compact du reste par une branche JS** (`useMediaQuery(MEDIA.compact)`), pas
  par des variantes responsives : c'est la seule façon de garantir que medium et expanded
  restent identiques au pixel.
- **Gardes à faire passer** : `npm run lint:ds` (lint + `ds:check` + encodage + `cn-merge` +
  `check:tokens`) et `npm run build`. `ds:check` bloque les hex en dur, les classes de
  palette Tailwind brutes et les contrôles natifs hors `src/components/ui/**`.
- **`LoginPage.tsx` porte 9 lignes non commitées** qui sont des corrections de conformité
  (`text-slate-*` et `bg-white` sont interdits par `ds:check`). **Ne pas les annuler.**

---

## 11. Retours du 30/07 au soir — plan arrêté, **dessiné le 31/07**

L'utilisateur **valide tous les points précédents** et ouvre quatre chantiers. Les arbitrages ci-dessous ont été
**raisonnés, retenus, puis dessinés le 31/07**. Trois planches créées, groupes **11**, **12**, **13** — voir §12
pour ce qui a réellement été livré et ce qui reste ouvert.

### 11.1 · Planche 11 — « Gérer un compte utilisateur » (`utilisateur-compte-piste.html`)

Quatre vues nommées dans le menu de débordement du détail utilisateur et **dessinées nulle part** (erreur n°16,
encore) : **suspendre**, **supprimer**, **réinitialiser le code PIN**, **réinitialiser le mot de passe**. Quatre
feuilles montantes, même moule que la planche 7.

Arbitrages retenus :

1. **Suspendre n'est pas rouge.** Le menu actuel le marque `.mi.dang` : c'est un acte **réversible** (« Réactiver
   le compte » existe déjà comme geste primaire). Le rouge est réservé à l'irréversible (§8.8). → `.dang` retiré
   de « Suspendre le compte » dans `utilisateur-detail-piste.html`, gardé sur « Supprimer ». La feuille redit ce
   que le héro dit déjà : **une suspension coupe l'accès, elle ne rend pas le matériel.**
2. **Supprimer dit les trois choses** (même grammaire que « Sortir du parc ») : ce qui disparaît (le compte,
   l'accès, la personne dans les sélecteurs), ce qui **reste** — et c'est le point neuf : **les attestations
   qu'elle a signées ne s'effacent pas.** Supprimer un compte n'efface pas la chaîne de preuve, sinon toute la
   doctrine de double attestation tombe le jour d'un départ. Ce qui coûte : rien, mais le **motif est
   obligatoire**. Blocage déjà tranché : entrée masquée si la personne détient du matériel, remplacée par
   « Organiser la restitution ».
3. **Réinitialiser le code PIN a une conséquence sur les remises**, et c'est la seule raison de la dessiner :
   tant que la personne n'a pas redéfini son code, **ses prochaines réceptions passent par signature**. C'est
   exactement la règle de la 4ᵉ colonne de la planche 10 (compte en attente → pas de code → signature), appliquée
   à un compte existant. La feuille l'écrit avant de valider.
4. **Réinitialiser le mot de passe n'existe pas pour tout le monde — contradiction relevée dans ma propre
   planche.** La fiche d'Alice annonce « Connexion : Annuaire d'entreprise » **et** offre « Réinitialiser le mot
   de passe » : l'application ne peut pas réinitialiser un mot de passe qu'elle ne détient pas. → l'entrée
   **n'apparaît que sur un compte à mot de passe local** (Marc) ; sur un compte annuaire, elle est **absente** et
   la rangée de référence « Connexion » porte la destination (« géré dans l'annuaire d'entreprise »). *Une action
   impossible se masque* — la règle est déjà celle de la suppression. Ferme aussi la question ouverte n°5 du §9,
   côté interface : **la réponse est « les deux, et l'écran le lit dans la donnée »**.

### 11.2 · Planche 12 — « À traiter » : la ligne et le bouton (`dashboard-atraiter-piste.html`)

Question de l'utilisateur : un clic sur la **ligne** et un clic sur le **bouton** mènent-ils au même endroit ?
**Non, et la distinction doit se voir sans être expliquée.**

> **La ligne ouvre le contexte ; le bouton ouvre l'acte.** Ni l'un ni l'autre n'écrit quoi que ce soit.

- **La ligne** → l'écran de l'objet ou de la demande (« D'où part une attribution »), geste primaire **armé selon
  le statut**. C'est le chemin de qui veut savoir avant d'agir : qui, pourquoi, depuis quand, quoi d'autre.
- **Le bouton** → **directement la feuille d'attestation** correspondante (« Remettre l'équipement », « Confirmer
  la réception », « Réceptionner »), pré-remplie. Le raccourci porte sur la **navigation**, jamais sur la
  **preuve** — même règle que « Réaffecter » (planche 7) : aucune attestation n'est sautée. **Aucun bouton du
  tableau de bord n'écrit en un tap.**
- **Un bouton n'apparaît que si l'acte ne demande aucune information supplémentaire.** Sinon la ligne est seule.
  Corollaire : le bouton porte **le verbe de l'acte**, jamais « Ouvrir » ni « Voir » ; la ligne porte l'objet et
  un chevron. C'est ce qui rend les deux chemins lisibles sans légende.
- La feuille ouverte par le bouton garde **un lien vers la fiche** : un raccourci ne doit pas être une impasse.
- Matrice à dessiner : pour chaque nature de ligne (validation du manager · remise à faire · réception à
  confirmer · retour à réceptionner · retour en retard) → qui la voit, statut de l'objet, destination de la
  ligne, libellé du bouton, ou absence de bouton.

**Seuil d'affichage (point 4 de l'utilisateur).** Le mécanisme existe déjà dans la planche Dashboard (quatre
régimes de charge) mais la démo par défaut est à 2 lignes, donc **invisible**. → **3 lignes maximum, toujours**,
puis la redirection, dans **la même forme que les autres sections** (`.more` : libellé + destination + chevron,
« Voir les 12 autres · dans Tâches, par ancienneté »). Au-delà de 20, aucune rangée : volume, attente la plus
longue, répartition par nature — chaque ligne étant l'entrée **filtrée** dans Tâches. La planche 12 montre les
trois régimes côte à côte pour que le seuil soit visible, et le réglage par défaut est **saturé**, pas calme.

### 11.3 · Planche 13 + `LEXIQUE.md` — un mot par acte

Revue complète demandée. Le lexique porte **trois colonnes** : terme retenu · variantes relevées (dans les
planches **et** dans le code) · statut — **existant** ou **renommage à valider** (§7, erreur n°4 : jamais un
renommage silencieux).

Divergences déjà identifiées, à corriger **dans les planches livrées** :

| Terme retenu | Variantes à supprimer | Où |
| --- | --- | --- |
| **Confirmer la réception** *(existant — « Réceptions à confirmer »)* | « accuse réception », « accuser réception » | `attribution-piste` (titre de colonne 3, maillon de la chaîne) |
| **code PIN** | « code à 4 chiffres », « code » | `attribution-piste`, planche 10 |
| **Demander la restitution** *(IT, un objet)* | « Récupérer » | matrice de `attribution-piste`, ligne « Attribué » |
| **Organiser la restitution** *(IT, tous les objets d'une personne)* | — | conservé : c'est la variante plurielle, à définir comme telle |
| **Restituer** *(l'acte du porteur — renommage à valider)* | « Retour matériel », « Retourner », « Rendre » | dashboard, code |
| **Réceptionner** *(IT, clôt le retour)* | « Réceptionner et constater l'état » | matrice |
| **Déclarer un incident** | « Signaler », « Signaler une panne », « Signaler un problème » | `equipement-detail-piste` (bouton utilisateur final), matrice |
| **Valider la demande** *(acte)* / **Validation du manager** *(état)* | « Validation managériale », « Valider » seul | dashboard, planche 7 |
| **Sortir du parc** *(renommage à valider)* | « Supprimer » | code |
| **Demander un équipement** *(renommage à valider)* | « Nouvelle demande », « Faire une demande » | dashboard — **déjà signalé comme erreur n°4, à ne pas glisser en silence** |

**Dette de nommage à signaler, pas à corriger** : l'écran **Approbations** porte le nom d'un concept que la
planche 7 appelle **validation**. Renommer un écran existant n'est pas un arbitrage de maquette.

### 11.4 · Ensuite

Une fois ces trois planches validées : **revue de la page « Tâches »** — c'est la destination unique de tous les
liens du tableau de bord (règle du 28/07), donc l'écran dont dépend la crédibilité de tout le reste. Elle n'est
**pas dessinée** : la planche 12 la rend seulement plus urgente, puisqu'elle est la seule sortie des trois régimes.

---

## 12. Livré le 31/07 — les trois planches, et les corrections de libellé

### 12.1 · Planche 11 — `screens/utilisateur-compte-piste.html` (groupe « 11 »)

Cinq colonnes : **le menu lu dans la donnée** · **Suspendre** · **Supprimer** · **Réinitialiser le code PIN** ·
**Réinitialiser le mot de passe**. Un réglage propre : *mode de connexion du compte* (annuaire = Alice /
mot de passe local = Marc), qui bascule les cinq colonnes ensemble.

Ce qui a été dessiné au-delà du plan :

- **Une grammaire commune aux feuilles à conséquence** : « Ce que cela change » / « Ce que cela ne change pas »,
  puis une **phrase pivot** sur filet jaune, puis le champ de motif. Elle vient de « Sortir du parc » et se
  généralise ici aux quatre actes. La suppression garde les trois temps complets (*disparaît · reste · coûte*).
- **La règle de couleur est énoncée à l'écran, pas seulement appliquée** : trois feuilles gardent le geste
  primaire dans la couleur d'action, la quatrième est rouge, et la planche dit pourquoi.
- **Les états d'absence sont dessinés**, pas seulement décrits. Là où l'acte n'existe pas — PIN de Marc, mot de
  passe d'Alice —, la colonne montre la **carte « Accès »** qui porte la destination, plus un encart de planche
  « Absent de ce menu, et pourquoi ». C'est la démonstration que *masquer* n'est pas *cacher* : la raison reste
  lisible ailleurs dans la fiche.
- **Fermer les sessions ouvertes** est une case décochée dans la feuille de mot de passe, pas un effet implicite :
  une réinitialisation ne doit pas enfermer dehors quelqu'un qui n'a rien demandé.
- **Le PIN et le mot de passe sont déclarés comme deux preuves distinctes** — l'une ouvre l'application, l'autre
  signe une remise. Chaque feuille le redit, parce que la confusion coûterait une attestation.

Corrections portées **dans la planche 8** au passage : `.dang` retiré des deux occurrences de « Suspendre le
compte » ; l'entrée « Réinitialiser le mot de passe » de la fiche d'Alice remplacée par « Réinitialiser le code
PIN » ; la rangée « Connexion » d'Alice porte désormais la destination (*mot de passe géré dans l'annuaire*).

### 12.2 · Planche 12 — `screens/dashboard-atraiter-piste.html` (groupe « 12 »)

La règle en tête de planche, sur filet jaune : **la ligne ouvre le contexte, le bouton ouvre l'acte, ni l'un ni
l'autre n'écrit**. Puis la **matrice à six lignes** — cinq natures plus le cas « unité non désignée » —, puis
cinq colonnes : *la ligne → le contexte* · *le bouton → l'acte pré-rempli* · **trois régimes de volume**.

Points tranchés en dessinant :

- **Deux natures n'ont pas de bouton, et ce n'est pas la même raison.** « Remise à faire, unité non désignée » :
  il faut choisir **quelle** unité part. « Retour en retard » : relancer, prolonger ou escalader **ne sont pas le
  même acte** — un bouton devrait en choisir un, et ce n'est pas au tableau de bord de le faire.
- **La ligne du retour en retard mène à la fiche de la *personne*, pas de l'objet.** À onze jours de retard, le
  sujet n'est plus l'objet.
- **La feuille atteinte par le bouton porte « Voir la fiche »** dans son bloc pré-rempli : un raccourci ne doit
  pas être une impasse. C'est la seule différence visible avec la même feuille atteinte depuis la fiche.
- **Le seuil est réglable de 2 à 5 rangées** dans le panneau, et le nombre de la redirection suit
  (« Voir les 14 autres »). Le nombre se discute alors **sur pièce** plutôt que dans l'abstrait ; **3** reste la
  valeur retenue et le réglage par défaut.
- **Le régime calme n'affiche aucun lien de sortie.** Un lien qui mène à ce qu'on voit déjà use la confiance dans
  tous les autres liens de l'écran.
- Le réglage par défaut du **dashboard livré** (`dashboard-piste.html`) passe de « 2 demandes » à
  « 17 demandes », et son régime chargé porte maintenant **trois** rangées + « Voir les 14 autres » : le
  mécanisme était juste, la démonstration le cachait.

### 12.3 · Planche 13 + `LEXIQUE.md` — `screens/lexique-piste.html` (groupe « 13 »)

Trente-cinq termes en cinq familles (chaîne d'attribution · statuts · preuves · incidents et demandes ·
comptes), chacun avec ses variantes relevées et son statut : **existant** · **renommage à valider** ·
**dette signalée**. Le fichier `LEXIQUE.md` à la racine est le compagnon texte, à tenir à jour avec les planches.

- **Le principe qui a servi d'arbitre** : chaque partie nomme son propre geste. L'IT *remet*, le porteur
  *confirme la réception* ; le porteur *restitue*, l'IT *réceptionne*. Un mot partagé entre les deux parties
  effacerait la double attestation dans le vocabulaire même.
- **Trois renommages seulement demandent une décision** : *Restituer*, *Sortir du parc*,
  *Demander un équipement*. Tout le reste s'aligne sur le produit — y compris là où le code avait raison contre
  mes planches (« Confirmer la réception »).
- **Deux distinctions à ne pas perdre**, ajoutées en dessinant : *Demander la restitution* (un objet) vs
  *Organiser la restitution* (tous les objets d'une personne) ; *Déclarer un incident* (sur un objet détenu) vs
  *Signaler un écart* (au moment de recevoir).

**Onze corrections appliquées dans cinq planches déjà validées** — attribution, fiche équipement, dashboard,
création de compte, fiche utilisateur. Aucune ne change une décision de design : elles alignent le mot sur
l'acte. Le détail est dans `LEXIQUE.md`.

### 12.4 · Ce qui reste ouvert

1. **La page « Tâches »** — non dessinée, et désormais l'écran le plus urgent : les trois régimes de la
   planche 12 y mènent tous, filtrés différemment. C'est la seule sortie du tableau de bord.
2. **Les trois renommages** attendent une décision produit ; les planches les portent en les déclarant.
3. **Rôles (RBAC)** reste le chantier le plus structurant après Tâches.
4. Questions ouvertes du §9 encore vivantes : annuaire réellement interrogeable, lien hiérarchique dans la
   donnée, expiration des invitations. La question n°5 (annuaire ou local) est **fermée côté interface** par la
   planche 11 : les deux, et l'écran le lit dans la donnée.

---

## 13. Retours du 31/07 — sécurité, états manquants, cohérence

Cinq points. Les trois premiers sont dessinés ; les deux derniers sont **audités et
partiellement appliqués**, le reste étant listé par ordre dans `AUDIT-UI.md`.

### 13.1 · Point 1 — la méthode de validation · planche 14, `screens/preuve-piste.html`

La question était : « seul le code PIN semble disponible ». **Les trois méthodes existent
depuis la planche 7** — signature, code PIN, empreinte — mais elles y étaient pilotées par un
**réglage de planche** : un interrupteur de maquettiste, pas une règle d'écran. Le défaut n'était
donc pas l'absence de méthodes, **c'était l'absence de la règle qui les choisit**.

Elle est maintenant dessinée en arbre, trois faits dans l'ordre : *les deux parties sont-elles
ensemble* → *la personne a-t-elle un code* → *l'appareil lit-il une empreinte, et est-ce le sien*.
Le premier « non » du premier test donne le cas le plus fréquent et le plus mal traité : **personne
en face, donc aucune preuve immédiate** — l'objet reste en attente plutôt que de recevoir une
attestation inventée. Chaque feuille garde **un** bouton secondaire pour basculer une fois vers la
méthode voisine, et la méthode employée est **toujours écrite dans l'historique**.

Réponse arrêtée : **les trois méthodes sont définitives**. Une quatrième — le **QR code** présenté
par la personne — est envisageable, non tranchée, et signalée comme telle.

### 13.2 · Point 3 — le champ code PIN · même planche

Un composant unique, cinq temps, avec **masquage progressif** : `· · · ·` → `1 · · ·` →
`• 2 · ·` → `• • 3 ·` → `• • • •`. Le chiffre qui vient d'être tapé reste lisible, les
précédents sont masqués — ce qui permet de corriger une frappe sans jamais exposer le code entier.

Chiffre porté de **22–24 px à 34 px**, case de 52×62 à **64×76**, écart à 12 px. Un **état d'erreur**
a été ajouté : le champ ne se vide pas en silence, il montre que la frappe a été reçue et refusée,
avec le nombre d'essais restants avant bascule vers la signature. **Aucun bouton de validation** :
la quatrième frappe suffit.

Appliqué aux planches **7** et **12** ; les chiffres en clair ont disparu des trois planches.

### 13.3 · Point 2 — les états manquants · planche 15, `screens/fins-de-flux-piste.html`

Les neuf états manquaient parce qu'**aucune règle ne disait quelle forme une clôture doit
prendre**. La planche pose la règle avant de dessiner :

> La forme de la clôture dépend de **ce que l'acte laisse derrière lui**, pas de son importance.

- **Forme 1 — l'écran a changé** (coût zéro). Le sujet est encore là : statut, geste primaire et
  historique se mettent à jour, un bandeau bref confirme puis s'efface. *Réception confirmée,
  réception de retour, validation, suspension, réinitialisation du code.*
- **Forme 2 — l'accusé en ligne** (coût une ligne). Rien de visible n'a changé, l'effet est chez
  quelqu'un d'autre : le bandeau dit quoi, chez qui, quand, et **reste** jusqu'à la sortie.
  *Relance, lien de mot de passe, écart signalé, invitation.*
- **Forme 3 — l'écran de clôture** (coût un écran). Le sujet a **disparu** : il faut une
  destination et dire ce qui reste. **Un seul acte la mérite : supprimer un compte.**

Ce qui a été tranché en dessinant :

- **Aucune coche animée plein écran, aucun « Terminé » à taper.** La preuve est faite ; l'écran
  n'a pas à s'en réjouir. Les durées d'animation sont fixées sur la planche (feuille 220 ms,
  bandeau 160 ms d'entrée, 4 s puis fondu pour la forme 1).
- **Le test d'une bonne clôture** : masquer le bandeau et vérifier que l'information tient encore.
  Si elle ne tient pas, c'est la fiche qu'il faut corriger, pas le bandeau qu'il faut allonger.
- **Le bandeau porte « Annuler » si et seulement si l'acte est défaisable** — une suspension, oui ;
  une confirmation de réception, non.
- **Signaler un écart** est dessiné en entier : trois natures d'écart seulement, parce qu'elles
  n'ouvrent pas la même suite ; motif obligatoire ; et **l'objet reste en attente** — refuser
  n'annule pas la remise, cela la suspend.
- **Compte suspendu** : la fiche *s'inverse* — héro en gris, geste primaire « Réactiver ». C'est le
  retournement qui prouve que l'acte a réussi, pas un message.
- **Compte supprimé** : retour à la liste, et la seule ligne qui compte — *les attestations
  conservées*, qui répond à la seule inquiétude que cet acte provoque.

Le **formulaire de réinitialisation du code PIN côté personne** — celui qui manquait vraiment,
puisque la planche 11 ne montrait que le geste de l'administrateur — est en planche 14 : il dit
d'abord *pourquoi* il est là, refuse les suites évidentes, et se confirme en deux saisies.

### 13.4 · Points 4 et 5 — `AUDIT-UI.md`

Nouveau document à la racine. Il porte ce que `LEXIQUE.md` ne couvre pas : **composants,
structure de page, flux**.

- **La règle des vues de référence** : un acte = une vue. Deux points d'entrée ouvrent la même
  vue ; seul l'en-tête et le pré-remplissage diffèrent. Inventaire des douze actes et de leurs
  points d'entrée.
- **Le cas signalé est tranché** : « Réinitialiser le mot de passe » depuis le menu de la fiche et
  « Mon compte » depuis l'avatar ne sont **pas** la même vue parce que ce ne sont **pas le même
  acte** — envoyer un lien à quelqu'un d'autre, ou changer le sien avec l'ancien. En revanche
  **Paramètres → sécurité est un doublon** : il ne doit porter qu'une ligne de renvoi vers
  « Mon compte », jamais un second formulaire.
- **Dix divergences de composants** relevées, huit corrigées, deux en attente.
- **Densité** : trois causes nommées — trop de cartes, une échelle typographique à deux marches
  seulement, des mises en garde qui occupent la place des données. Trois règles en réponse, dont
  *une carte porte un sujet, pas une ligne* et *ce qui engage se lit là où on agit*. Les planches
  11, 12, 14 et 15 sont écrites dessus ; les planches **4** et **8** demandent une passe de
  fusion de cartes, à faire **après** validation des règles pour ne pas la refaire deux fois.
- **Un seul gabarit de barre du haut** au lieu de trois.
- **Les six chaînes de flux** et leurs trois trous.

### 13.5 · Ordre de reprise

1. **Tâches** — la destination unique de tous les liens du tableau de bord et de la moitié des
   flux. Priorité absolue, et elle grandit à chaque planche livrée.
2. **Mon compte** — la vue de référence du changement de mot de passe par soi-même, plus la ligne
   de renvoi depuis Paramètres.
3. **Déclarer un incident** — la feuille et la chaîne qui suit.
4. **Première connexion** — accepter l'invitation, définir son code (planche 14, étape 2).
5. **Passe de densité** sur les planches 4 et 8.

### 13.6 · Audit complet de cohérence — mené et appliqué le 31/07

Inventaire de **chaque occurrence de chaque composant** sur les treize planches, à la recherche
des écrans qui font la même chose de deux façons. **Huit divergences** trouvées, sept corrigées,
une requalifiée en règle. Le détail est en §2 de `AUDIT-UI.md` ; l'essentiel :

- **Cinq gabarits de barre du haut** pour trois rôles → un seul gabarit (retour · identité ·
  action). `.abar` aligné, `.bhead` réservé aux racines d'onglet, les quatre barres d'objet
  d'`attribution-piste` portent enfin l'identité complète, et l'écran « Attester » — un acte
  plein cadre — a reçu le bouton de retour qui lui manquait.
- **Deux tailles de titre de section** (13 px et 15 px) pour le même rôle : les cartes des deux
  fiches et du dashboard étaient plus lourdes que celles des planches 10 à 15 **sans règle pour
  le justifier**. → 13 px / 500 partout.
- **Cinq remplissages de bouton secondaire** sous trois noms de classe. La règle retenue est
  **une valeur par surface, pas par écran** : `--inset` sur carte claire, voile blanc à 12 %
  sur héro inversé, `--dark` pour le second geste d'une paire sur le canevas. Les deux fiches
  posaient un `--dark-2` sur un héro déjà sombre ; le dashboard employait `--ink` là où tout
  le reste emploie `--dark`.
- **Un même composant sous deux noms** : `.krow` / `.rrow`, la rangée étiquette-valeur.
  Supprimé le doublon, aligné les métriques.
- **Un avatar de rangée en trois tailles** — 38, 40 et 44 px pour le même rôle → 40 px, rayon 6.
- **La barre du bas est conforme** partout : même ordre, mêmes icônes, mêmes libellés.
- **Requalifié en règle plutôt que corrigé** : les feuilles sans pied de page. Ce n'était pas un
  oubli — il existe deux types de feuille, la **feuille de choix** (une liste de chemins, aucun
  engagement, pas de pied) et la **feuille d'acte** (pied obligatoire : « Annuler » fantôme +
  geste primaire). La distinction est maintenant écrite.

Ce que l'audit **n'a pas** corrigé, faute d'être un défaut : les quatre noms de rangée de liste
(`.lrow`, `.orow`, `.prow`, `.trow`) restent, parce que ce sont quatre contenus — mais ils
partagent désormais une seule métrique. Et le héro photographique du dashboard reste distinct des
héros en aplat des fiches : c'est le seul écran d'accueil.

---

## 14. Planche 16 — « Tâches » — **livrée le 31/07**

`screens/taches-piste.html`, groupe « 16 ». Cinq colonnes : *la file (17)* · *les filtres* ·
*arrivée pré-filtrée depuis le dashboard* · *999 et la pagination* · *l'état vide*. Un réglage
propre : le **rôle** (gestionnaire / utilisateur final), qui change le contenu de la file sans
changer l'écran. Les arbitrages du brief ont tous été tenus ; ceux tranchés en dessinant sont
en §14.2.

**Ce que l'écran est.** La **destination unique** de tous les liens du tableau de bord (règle du
28/07) et de la moitié des flux (`AUDIT-UI.md` §5). Ce n'est pas une deuxième liste d'actifs :
c'est la **file de ce qui attend un acte de moi**.

**Cadrage.** À qui : les quatre rôles, mais pas le même contenu. Quelle décision : *par quoi
commencer*. Ce qu'on fait juste après : l'acte, dans la feuille de la planche 7.

Arbitrages retenus :

1. **Une rangée de Tâches est la même rangée que « À traiter »** — même composant, même règle de
   bouton (matrice de la planche 12). Ce qui change : la liste n'est **pas bornée à trois**, et
   elle porte un ordre explicite.
2. **Trois filtres, pas un moteur de recherche** : *par nature* (validation · remise · réception ·
   retour), *par ancienneté* (défaut : le plus vieux d'abord), *à moi seul / à mon équipe*. Les
   liens du dashboard arrivent **pré-filtrés**, et le filtre actif est visible — sinon on ne sait
   pas pourquoi la liste est courte.
3. **Le tri par défaut est l'ancienneté**, jamais la date de création décroissante : une file se
   traite par le haut, et ce qui attend depuis onze jours doit être en haut.
4. **Le retard est un fait, pas une couleur** : « 11 j » en clair, sans badge rouge. Le rouge reste
   réservé à l'irréversible (§8.8).
5. **L'état vide est le seul écran du produit qui a droit à une image** — c'est le bon état, et il
   arrive souvent. « Rien ne vous attend » + ce qui vient ensuite.
6. **Le regroupement par nature est un réglage, pas la structure.** Par défaut, une seule liste
   à plat : mélanger les natures est ce qui permet de traiter dans l'ordre d'ancienneté.
7. **Trois volumes à montrer** : 3 tâches · 17 · 999 — mêmes régimes que le dashboard, mais ici
   la liste ne se replie **jamais** en résumé : c'est sa raison d'être. Elle pagine.
8. **Barre du haut** = gabarit unique, racine d'onglet : titre « Tâches » + compteur en ligne
   secondaire, action = les filtres.

Colonnes prévues : *la file, gestionnaire (17 tâches, filtre actif)* · *la file, utilisateur final
(2 tâches)* · *arrivée pré-filtrée depuis le dashboard* · *l'état vide* · *le régime 999 et sa
pagination*.

### 14.1 · Puis, dans cet ordre

1. **« Mon compte »** — la vue de référence du changement de mot de passe par soi-même (ancien +
   nouveau), 2FA, sessions actives ; **plus** la ligne de renvoi depuis Paramètres, qui ne doit
   **pas** reporter un second formulaire (`AUDIT-UI.md` §1).
2. **« Déclarer un incident »** — la feuille, et la chaîne déclaration → prise en charge →
   réparation → retour. Seule chaîne du produit dont un maillon manque encore.
3. **Première connexion** — accepter l'invitation, définir son code (planche 14, étape 2).
4. **Passe de densité** sur les planches **4** et **8** : fusion de cartes selon le §3 de
   `AUDIT-UI.md` — *une carte porte un sujet, pas une ligne*. **À ne lancer qu'après validation
   des règles**, pour ne pas la refaire deux fois.

---

## 15. Réorganisation du volet — 31/07

**Le constat était juste** : « Tableau de bord », « Détail équipement », « Utilisateurs — liste »
et « Détail utilisateur » apparaissaient à la fois dans « 1. UI actuelle » et dans leur section
numérotée, sans que rien ne dise laquelle fait foi.

**Ce qui a été fait — clarification du rôle, pas suppression.** Les quinze répliques de l'existant
ne sont pas des doublons de travail : ce sont les **captures de l'état initial**, et elles restent
nécessaires pour juger une proposition. Elles ne pouvaient simplement pas porter un numéro de
chantier. Le groupe est donc devenu :

> **0. Référence — l'UI actuelle, avant refonte**

Le **0** le sort de la séquence de travail et le place en tête, avant « 2. Connexion ». Chaque
carte porte désormais en sous-titre : *« État initial du produit, avant refonte. Point de
comparaison — la proposition est dans la section numérotée du même sujet. »* Le doute est levé
carte par carte, pas seulement dans le nom du groupe.

**Aucune fusion de contenu n'était nécessaire** : les répliques et les pistes ne se recouvrent pas.
Depuis la décision du 30/07, une planche **nomme** l'état actuel en une ligne au lieu de le
recopier ; les défauts relevés sont écrits dans ce document, pas dans les maquettes. Les deux
familles sont donc déjà disjointes — il manquait seulement de le dire.

**Correspondance référence → chantier**

| Référence (groupe 0) | Section de travail |
| --- | --- |
| Connexion | 2. Connexion |
| Tableau de bord | 3. Dashboard |
| Détail équipement | 4. Détail équipement |
| Inventaire — liste | 5. Liste équipements |
| Utilisateurs — liste | 6. Liste utilisateurs |
| Détail utilisateur | 8. Détail utilisateur |
| Approbations | 7. Attribuer et restituer *(dette de nommage, `LEXIQUE.md`)* |
| Catalogue · Emplacements · Finances · Rapports · Paramètres · Rôles · Audit | **pas encore de chantier** |

Les sept derniers n'ont **pas** de section numérotée : ce ne sont pas des doublons, ce sont les
écrans qui restent à traiter. `Paramètres` et `Rôles` sont nommés dans `AUDIT-UI.md` comme
prochaines cibles.

**Exhaustivité des sections numérotées — vérifiée.** Aucun écran isolé : chaque planche porte
toutes les variantes de sa vue (profils, régimes de volume, états) en colonnes ou en réglages,
conformément à la règle « une planche = une vue = un fichier = un groupe ». Les seules pistes hors
volet sont dans `screens/archive/`, sans `@dsCard`, comme prévu.

### 14.2 · Ce qui a été tranché en dessinant la planche 16

- **La liste ne se replie jamais en résumé — et c'est la règle qui gouverne l'écran.** Le tableau
  de bord a le droit de dire « 999 » et de s'arrêter là : c'est un écran d'accueil. Tâches ne l'a
  pas : s'y replier renverrait vers un écran qui renvoie vers lui-même. Elle **pagine par 30**, et
  le compteur « 30 sur 999 » dit ce qu'un défilement sans fin cache — combien il en reste.
- **Le bandeau de filtre actif est obligatoire quand on arrive pré-filtré.** Sans lui, on ne
  comprend pas pourquoi la liste est courte et **on croit avoir moins de travail qu'on n'en a** :
  la faute la plus coûteuse d'une file filtrée. Il nomme le filtre et se retire d'un tap.
- **Le libellé du bouton se raccourcit, jamais la règle.** Quand toute la liste porte la même
  nature, « Confirmer la réception » devient « Confirmer » — le complément est déjà dans le
  bandeau et dans chaque rangée. Le **verbe** reste ; c'est lui qui distingue les deux chemins.
- **Chaque filtre porte son compte.** Un filtre qui ne dit pas combien il reste après lui se
  choisit à l'aveugle. Les cinq natures et les deux portées affichent le leur.
- **Aucune recherche.** On ne cherche pas dans une file de dix-sept lignes, on la traite. La
  recherche vit dans Actifs et dans Équipe, où elle a un objet.
- **La feuille de filtres est une feuille de choix** : pas de pied de page, chaque tape agit —
  conforme à la distinction établie au §2.6 de `AUDIT-UI.md` le même jour.
- **L'état vide garde son filtre, éteint.** Il ne disparaît pas : sinon on croit l'avoir perdu, et
  surtout on confondrait *« rien à faire »* avec *« rien ne correspond à ce filtre »* — deux états
  qu'un écran vide unique écraserait.
- **L'état vide enchaîne sur ce qui arrivera ici**, et à quelle condition. Sans cela on revient
  toutes les dix minutes vérifier, ce qui est exactement le comportement que la file doit éviter.
- **Le rôle ne produit pas une version allégée.** L'utilisateur final voit le même écran, le même
  composant de rangée, les mêmes filtres — seulement deux natures au lieu de quatre.

**Reste à dessiner** : « Mon compte » · « Déclarer un incident » · la première connexion · la passe
de densité sur les planches 4 et 8.

---

## 16. Planche 17 — « Mon compte » — livrée le 31/07

`screens/mon-compte-piste.html`, groupe « 17 ». Cinq colonnes : *Mon compte* · *changer mon mot de
passe* · *double authentification* · *mes sessions* · *Paramètres, la ligne de renvoi*. Un réglage
propre : le **mode de connexion**, qui décide ce que l'écran peut gérer et ce qu'il ne peut que
désigner — même mécanique qu'en planche 11.

**Le doublon signalé est fermé.** Trois portes existaient ; ce ne sont pas trois vues du même acte,
ce sont **deux actes et un doublon** :

- agir sur le compte **d'un autre** = envoyer un lien (planche 11), parce que l'administrateur ne
  connaît pas le mot de passe et **ne doit pas le connaître** ;
- changer **le sien** = ancien puis nouveau, et c'est cet écran ;
- **Paramètres → Sécurité ne porte plus de champs** : une rangée, sa valeur, sa destination. C'est
  ce qui garantit qu'à la prochaine modification du formulaire, il n'y aura rien à modifier ici.

Tranché en dessinant :

- **Le code PIN est sur cet écran**, avec le mot de passe. Ce sont mes **deux preuves** ; les ranger
  dans deux écrans différents parce qu'elles servent à des choses différentes est exactement
  l'erreur que la planche 14 avait déjà corrigée côté composant.
- **Pas de confirmation en double du nouveau mot de passe.** Le champ est lisible d'un tap.
  Retaper ce qu'on peut relire ne prouve rien et fait échouer une saisie sur cinq.
- **La jauge décrit, elle n'interdit pas.** Un mot de passe refusé pour une règle non dite est la
  meilleure façon d'en faire écrire un sur un papier collé à l'écran.
- **Changer son mot de passe ne déconnecte pas les autres appareils** : c'est un acte distinct, avec
  sa propre rangée dans les sessions. Les fusionner priverait de l'un des deux.
- **La session courante est nommée et non fermable** depuis la liste : se déconnecter est un geste
  du menu. Le cas réel que l'écran sert est le **poste partagé du comptoir**, laissé ouvert — une
  session qui **peut signer des remises en votre nom**. C'est la raison d'être de l'écran, et elle
  est écrite dedans.
- **L'activation 2FA tient sur un écran, en trois temps.** Trois écrans successifs feraient
  abandonner à l'étape 3 — les codes de secours, celle qu'on croit facultative et qui est la seule
  porte si le téléphone est perdu. L'écran dit que **l'activation n'est pas terminée** sans elle.
- **Le champ à six chiffres est le composant PIN**, six cases au lieu de quatre, même masquage
  progressif. Aucun second composant de saisie de code dans le produit.

**Reste à dessiner** : « Déclarer un incident » et sa chaîne · la première connexion · la passe de
densité sur les planches 4 et 8.

---

## 17. Renumérotation et regroupement du volet — 31/07

Deux défauts signalés le même jour : l'ordre des sections était `1, 10, 11 … 16, 2, 3` (tri
alphabétique sur un numéro à un chiffre), et un même sujet occupait plusieurs titres de premier
niveau — « Liste équipements » et « Détail équipement » étaient deux sections distinctes.

**Règle posée : une fonctionnalité = une section parente ; ses variantes sont des sous-sections.**
Le numéro parent est sur deux chiffres pour que l'ordre affiché soit l'ordre réel. Dix-sept
sections deviennent huit :

| Avant | Après |
| --- | --- |
| `0. Référence` | `01. Référence — l'UI actuelle, avant refonte` |
| `2. Login` | `02. Connexion` |
| `3. Dashboard` · `12. À traiter` · `16. Tâches` | `03. Tableau de bord` → `03.1` · `03.2` · `03.3` |
| `5. Liste équipements` · `4. Détail équipement` · `9. Créer, corriger, sortir` | `04. Équipement` → `04.1` · `04.2` · `04.3` |
| `6. Liste utilisateurs` · `8. Détail utilisateur` · `10. Créer un compte` · `11. Gérer un compte` | `05. Utilisateur` → `05.1` … `05.4` |
| `7. Attribuer et restituer` · `14. La preuve` · `15. Fins de flux` | `06. Attribuer et restituer` → `06.1` · `06.2` · `06.3` |
| `17. Mon compte` | `07. Mon compte` |
| `13. Un mot par acte` | `08. Lexique — un mot par acte` |

**L'ordre des cartes dans un groupe suit le nom de fichier**, pas le numéro écrit dans le titre.
Les planches concernées sont donc renommées `<famille>-<n>-<vue>-piste.html`. Les sections
antérieures de ce document citent les anciens noms : ils se lisent avec cette table.

| Ancien fichier | Nouveau |
| --- | --- |
| `dashboard-piste.html` | `dashboard-1-tableau-piste.html` |
| `dashboard-atraiter-piste.html` | `dashboard-2-atraiter-piste.html` |
| `taches-piste.html` | `dashboard-3-taches-piste.html` |
| `equipement-liste-piste.html` | `equipement-1-liste-piste.html` |
| `equipement-detail-piste.html` | `equipement-2-detail-piste.html` |
| `equipement-creation-piste.html` | `equipement-3-creation-piste.html` |
| `utilisateur-liste-piste.html` | `utilisateur-1-liste-piste.html` |
| `utilisateur-detail-piste.html` | `utilisateur-2-detail-piste.html` |
| `utilisateur-creation-piste.html` | `utilisateur-3-creation-piste.html` |
| `utilisateur-compte-piste.html` | `utilisateur-4-compte-piste.html` |
| `attribution-piste.html` | `attribution-1-parcours-piste.html` |
| `preuve-piste.html` | `attribution-2-preuve-piste.html` |
| `fins-de-flux-piste.html` | `attribution-3-fins-de-flux-piste.html` |

Contenu des planches inchangé : seuls les titres de cartes, les groupes et les noms de fichiers
bougent. Un nouveau sujet rejoint sa section parente avec le sous-numéro suivant ; on n'ouvre une
section parente que pour une fonctionnalité qui n'en a pas.

---

## 18. Du 01/08 au 06/08 — rattrapage du journal, écrit le 06/08

Ce journal s'était arrêté au 31/07 (§17). Six jours de travail n'y figuraient pas : ils étaient
tracés au registre (`REGLES-TRANSVERSES.md` §4, une ligne par décision) et dans les rapports
datés, mais pas ici. Les six sections qui suivent comblent le trou. **Elles renvoient, elles ne
recopient pas** : le texte qui fait foi reste celui du registre et des rapports.

| Jour | Ce qui s'est passé | Où c'est écrit |
| --- | --- | --- |
| 01/08 | Passe 3 close, puis **balayage complet** — jetons, composants, libellés | `RAPPORT-PASSE-3.md` · `RAPPORT-AUDIT-2026-08-01.md` · `ETAT-DES-LIEUX-01-08.md` |
| 02/08 | Planches **02.2** et **04.4** dessinées ; huit rôles scindés ou renommés | registre §4 (02/08) · §2.22 · §2.33 · §2.34 |
| 03–04/08 | Contrôle `.fx` complet, **passe de densité** sur les crans | registre §4 (03–04/08) · §2.33 bis · §5.5 |
| 05/08 | Trois arbitrages instruits, **trio 09/10/11** et **06.4** dessinés, audit complet | les trois `DECISION-*-05-08.md` · `RAPPORT-AUDIT-2026-08-05.md` |
| 06/08 | **12.1**, **13.1**, **14.1** dessinées ; sept arbitrages rendus ; deux interdits tranchés ; **le portage commence** | registre §2.40 à §2.44 · `RAPPORT-AUDIT-2026-08-06.md` |

## 19. 01/08 — le balayage complet, et ce qu'il a changé dans la méthode

Deux choses le même jour. **Passe 3** ferme les écarts signalés au fil de l'eau : le bouton filtre,
les vingt écarts de même nature qu'il cachait, les deux boutons déformés. Puis le reproche qui
compte : *cesser de corriger au fil des remarques*. Le balayage qui suit part du projet entier et
non d'une liste de remarques — il indexe **les `:root`, qui n'avaient jamais été comparés**, et
relève vingt-huit écarts en cinq familles, dont deux familles de noms de jetons qui cohabitaient
(`--ink2` contre `--ink-2`).

**La règle née ce jour-là** : un contrôle qui part d'une liste ne trouve que ce qui est sur la
liste. Depuis, chaque audit repart des fichiers publiés.

## 20. 02/08 — deux planches, et huit noms remis d'aplomb

**02.2 Première connexion.** L'arrivée demande deux secrets l'un après l'autre. Le code PIN n'y est
pas ressaisi : c'est un **renvoi** vers 06.2, seul l'en-tête de provenance change — application
directe de la règle « un acte = une vue ». On redemande ce qu'on ne peut pas relire : le mot de
passe est dévoilable, donc sans champ « confirmer » ; le PIN ne l'est jamais, donc retapé.

**04.4 La suite de l'incident.** Prendre en charge, remplacer, réceptionner, refermer. Aucun statut
nouveau — « En réparation » couvre les temps 2 à 4. Un incident se referme **sur une personne**,
pas sur un objet : le remplacement crée une dette, l'écran de retour la solde.

Huit rôles scindés ou renommés le même jour (`.pick`/`.abar`, `.hint`/`.lfoot`, `.hero`/`.brand`,
`.vig.sm` supprimée, `.cact` créée), et l'interdit des émojis appliqué à 02.

**L'erreur à ne pas répéter, inscrite ce jour-là (emploi n°12)** : une planche neuve héritait de
quatorze règles et huit jetons morts, copiés de sa voisine. Une planche neuve se relève **à
l'écriture**, pas après.

## 21. 03–04/08 — la bascule de réglage, et la densité

Le contrôle `.fx` révèle que **deux mécanismes de bascule coexistaient** sans que le registre le
dise : la classe `.fx` sur quatre planches, le `display` écrit dans le sélecteur de réglage sur
quatre autres. Corollaire découvert au passage : un élément dont la classe de base ne déclare pas
de `display` ne prend jamais `.fx` — sur un paragraphe, la bascule casse le flux du texte.

**Passe de densité** : les planches restées hors du chantier portaient `--rowy` 15/8 au lieu de
14/7. Neuf planches alignées, DOM identique, hauteurs inchangées.

## 22. 05/08 — trois arbitrages, quatre planches, et la limite de la méthode

Trois questions instruites avant de dessiner, chacune dans son document : la structure et la langue
du catalogue, l'appartenance du service à l'arbre des emplacements, ce que montre l'écran des rôles.
Puis **09.1 Catalogue**, **10.1 Emplacements**, **11.1 Rôles**, et **06.4 Demander un équipement**.

**La leçon du jour, et elle a coûté quatre écarts** : les trois planches du trio ont été bâties sur
une copie du socle **antérieure** aux corrections du 04–05/08. Les contrôles ne pouvaient rien voir
— ils comparent les planches entre elles, et les trois nouvelles étaient d'accord. *Une planche
neuve se compare au registre, pas à sa sœur.*

## 23. 06/08 — le registre rattrape, et le portage commence

**Trois planches.** 12.1 *Les états transverses* — chargement, geste en cours, acte qui échoue,
hors ligne, introuvable, accès refusé ; c'était le seul manque à zéro du projet. 13.1 *Les trois
régimes* — la loi du delà de 393 px, trois régimes au lieu de cinq points de rupture, une largeur
de lecture unique à 960 px au lieu de sept `max-w-*`. 14.1 *Paramètres* — cinq sections de trois
natures, un réglage qui appartient à quelqu'un et qui dit ce qu'il change.

**Le registre a rattrapé son retard** : sept arbitrages rendus et appliqués (§2.40), les deux
interdits du brief que les planches ne tenaient pas tranchés (§2.41 — capitales admises pour le
seul micro-libellé, zone de frappe à 48 px portée au code), **les vingt-huit rôles employés sans
règle déclarés** (§2.42), la loi du delà de 393 px écrite (§2.43), les règles de réglage (§2.44).

**Le portage a commencé, et il décide aussi.** 03.3 devient la vue `tasks` et la destination de la
barre du bas — le décalage qui commandait tous les autres est résorbé. 06.4 est appliquée. 12.1
passe partiellement. Deux renommages sont arrivés au produit **avant** d'être inscrits au lexique
(« Approbations » → « Demandes ») : c'est exactement ce que le statut *renommage à valider* devait
empêcher.

**Ce qui reste, mesuré le jour même** (`RAPPORT-AUDIT-2026-08-06.md`) : vingt rôles portent encore
plus d'une déclaration alors que leur texte canonique est écrit et que le registre nomme les
planches à aligner. **Le dessin est désormais en retard sur le registre**, et non l'inverse.



---

## 24. 07/08 — l'audit croisé, et la fin de la passe d'alignement

**Audit complet codebase ↔ Claude Design** — `RAPPORT-AUDIT-2026-08-07.md`. Tout remesuré sur les
fichiers du jour, rien repris d'un rapport antérieur.

**Le fait neuf : le dénominateur de couverture était faux depuis le début.** Tous les inventaires
précédents comptaient les **31 `ViewType`** de `useAppNavigation.ts`. Le routage de `App.tsx` en
porte **cinq de plus**, hors session et hors arbre de providers : `LoginPage`, `ChangePasswordPage`,
`AccessDeniedPage`, la **galerie du design system** (`/dev/design-system`, build DEV seulement) et
l'**explorateur de documentation** (`/documentation/ui-flow-map`) — cette dernière étant une
**route de production** jamais recensée nulle part. Couverture réelle : **21 écrans sur 36**.

*Leçon : un inventaire tiré d'une seule source ne recense que ce que cette source connaît.*

**La passe d'alignement est terminée.** Les six arbitrages ouverts depuis le 06/08 ont été tranchés
(§2.45 du registre) et appliqués sur **dix planches** : 02.1, 03.1, 03.2, 04.2, 04.3, 04.4, 05.2,
06.1, 13.1. Divergences **24 → 10**, et **0 rôle produit divergent** — les dix restantes sont le
chrome de planche (6) et les familles de statut (4, divergence voulue).

**Deux pièges rencontrés, à retenir :**

1. **Le `.field` de 02.1.** Son `background:var(--surface)` semblait une dérive ; la panne était
   dans le contexte : `.panel` y est sur `--canvas`, pas sur une carte. Retirer le fond aurait
   fondu le champ dans la page. → `.field.oncv`.
2. **Le `.hero` de 13.1.** L'alignement mécanique sur le canon ajoutait `gap:13px` à un conteneur
   dont l'enfant porte déjà `margin-top:14px` — 27 px au lieu de 14. → `.hero.plain`.

**Trois règles mortes déposées** : `.note` de 02.1, `.pick.done` de 04.3, `.two` de 13.1.

**Ce qui reste, dans l'ordre** — le socle de chrome de planche (`.phone` 9 formes, `.colnote` 6,
`.wrap` 4, `.page` 4, `.intro` 2, `.col` 2 : **27 formes pour 6 rôles**, jamais instruit), puis la
planche 09.2 (fiche de modèle + imports du référentiel, 4 écrans sans référence), puis la décision
sur Approbations.


### 24.1 · Le socle de chrome — appliqué dans la foulée, 07/08

Le dernier chantier de cohérence du projet est fermé : **27 formes pour 6 rôles de chrome**,
ramenées à un socle unique (registre §2.46). Deux variables réelles sous ces 27 formes — une
hauteur plancher par planche, passée en jetons `--phone-h` / `--colnote-h`, et une convention de
marge écrite de deux façons (`.intro` porte l'espace, pas `.wrap`).

**Divergences subies : 33 (06/08) → 20 → 6 → 0.** Les quatre restantes sont les familles de statut,
qui doivent diverger par surface.

**Deux découvertes que l'analyseur cachait.** En corrigeant le motif pour reconnaître un sélecteur
précédé d'un commentaire CSS, **sept divergences invisibles** sont apparues — dont `.hero` (que je
croyais fermé le matin même) et une **collision de noms** : `.wbar` désignait à la fois une jauge
de garantie et la barre de titre d'un régime large. La seconde est devenue `.topbar`.

**Trois pièges rencontrés pendant la passe, tous du même type — écraser une règle sans l'avoir
lue :**

1. Un motif `\.phone\{` attrape aussi `.fx .phone{`. Les fichiers à occurrences multiples ont été
   mis de côté et repris avec un analyseur à sélecteur exact.
2. Le `.intro` de 02.1 était **volontairement borné à 393 px** — la planche n'a qu'une colonne, et
   un commentaire le disait. L'aligner sur 1180 px l'aurait étalé sur le vide. → `.intro.solo`.
3. `lexique` portait **deux** règles `.band` en cascade ; remplacer « la » règle a détruit la base.
   Réparé en `.band` canonique + `.band.gap`.

*Ces trois-là disent la même chose : le relevé automatique désigne une cible, il ne la décrit pas.*


### 24.2 · Les homonymes sous le seuil — 07/08, fin de journée

**Le contrôle qui a trouvé `.wbar` ne pouvait pas trouver ses semblables.** Le relevé ne regarde
que les rôles employés par ≥ 3 planches. Or **un homonyme naît de deux emplois, pas de trois** —
et le troisième ne vient jamais, puisque personne ne réemploie un nom déjà pris deux fois pour deux
choses. Seuil abaissé à 2 : **sept divergences de plus, dont cinq homonymes**.

Tranchés : `.foot` (le pied de planche devient `.pfoot` et rejoint la famille du chrome) et
`.brand` (`--dark` au canon, 02.2 portait `--ink` ; le contexte d'empilement devient `.brand.art`).
Convergés : `.wrow`, `.wbar`, `.meta`, `.hnote`. **Proposés au registre, non appliqués** :
`.mrow` `.bar` `.count` `.hrow` `.demo` — cinq noms à valider (§2.47), plus `.panel`.

**Un revert assumé.** `.panel` allait converger en ajoutant `gap:var(--gap)` à 02.1 — mais
l'espacement des champs appartient à `.fgrp` depuis le 06/08 : le gap se serait ajouté par-dessus.
Écart déclaré plutôt que corrigé de travers.

**Ce que la journée aura appris, en une ligne** : « zéro divergence » ne voulait dire que « zéro
divergence **au-dessus de trois planches** ». *Tout chiffre de conformité se publie désormais avec
le seuil qui l'a produit.*


### 24.3 · Deux fautes de la dernière passe — 07/08, relues

Les deux corrections finales de la journée sont **la faute que la journée avait érigée en leçon** :
modifier une déclaration sans lire sa voisine.

1. `.foot` → `.pfoot` avait laissé **`.foot b` orpheline**. Les six `<b>` des pieds de 08 sont
   retombés en `font-weight:700` — une **quatrième graisse**, dans un projet qui en discute déjà
   trois. Corrigé en `.pfoot b`.
2. Le `.brand` de 02.2 avait été aligné sur le `--dark` de 02.1 « parce que 02.1 est validée ».
   **Deux commentaires de source disaient l'inverse** : le bleu-noir de 02.1 est une conséquence de
   son motif de marque, pas la forme du rôle. Canon rétabli sur `--ink` (noir chaud, §2.22),
   exception portée par `.brand.art`.

*Un renommage n'est fini que quand les règles descendantes ont suivi — un `.x b` ne proteste jamais.*


### 24.4 · Deux dettes cachées, trouvées après coup — 07/08 au soir

Les deux derniers correctifs de la journée n'ont pas été trouvés par le relevé : **le relevé les
comptait comme des succès.**

1. **La quatrième graisse.** Le recensement compte les `font-weight` *déclarés*. Les 1 512 `<b>` du
   projet n'étaient couverts que par douze règles `.x b` ; tous les autres retombaient sur le
   **700 du navigateur** — une graisse écrite nulle part, dans un projet qui en autorise deux.
   `b{font-weight:500}` au socle des 25 planches.
2. **La variante `.col` effacée.** Le socle a aligné les deux colonnes larges de 13.1 sur le
   `flex:0 0 393px` du canon. Elles **rendaient encore juste**, parce que `min-width:auto` les
   plancheise au min-content de leur cadre — donc aucun contrôle visuel ne pouvait le voir. Le
   premier `min-width:0` posé sur `.col` aurait fait tomber les deux régimes à 393 px.
   `.col.wide{flex:0 0 auto;width:auto}` déclarée et vérifiée sous `min-width:0` forcé.

*Les deux disent la même chose sous deux formes : **un rendu juste ne prouve pas une déclaration
juste**. Le premier laissait le navigateur décider d'une valeur, le second laissait le contenu
décider d'une largeur. Dans les deux cas l'écran avait raison et le fichier avait tort — et c'est
le fichier qu'on porte au produit.*


## 25. 07/08 — planche 09.2, les quatre derniers écrans du référentiel

`screens/catalogue-2-modele-piste.html`, groupe « 09. Catalogue ». Quatre colonnes : *la fiche
d'un modèle* · *créer un modèle* · *importer des modèles* · *importer des emplacements*. Deux
réglages : le traitement des spécifications absentes (honnête / repli inventé du produit) et le
sort d'un fichier à moitié bon (n'importer que les valides / refuser tout).

**Ce que la planche tranche** (registre §2.50) : une fiche de modèle répond au **stock**, pas à la
localisation · un champ vide **se dit**, il ne se comble pas · un import **se juge à ce qui va
entrer** — contrat de colonnes avant le dépôt, décompte avant l'écriture, lignes refusées
**nommées** et cause dite plutôt que symptôme.

**Le contrôle de la planche neuve contre le registre a trouvé quatre écarts, tous chez moi** :
`.rule` et `.fgrp` recopiés de mémoire au lieu du texte canonique, et **trois homonymes** —
`.pfoot`, `.tally`, `.hmeta`. Le troisième est le plus instructif : mon renommage de 04.4
(`.hrow` → `.hmeta`, deux heures plus tôt) heurtait un `.hmeta` déjà présent en 04.2. La rangée
clé/valeur de 04.4 devient `.hkv`.

*Le relevé d'homonymes au seuil de 2 planches doit tourner **avant** d'écrire un nom, pas après.*

**Couverture : 25 écrans dessinés sur 36.** Restent `finance`, `reports`, l'explorateur de
documentation, et `approvals` à réinstruire.


### 25.1 · La cinquième destination — 07/08

Le contrôle de 09.2 a trouvé une barre du bas à **quatre** entrées. Le relevé étendu aux 26
planches en a trouvé **21 sur 54**, sur **neuf planches** : « Équipe » manquait, et le symbole
`#i-group` manquait au sprite de plusieurs d'entre elles — l'entrée n'avait jamais été écrite, pas
retirée. Complétées, symbole ajouté, **54 barres conformes**.

§2.43 déclarait les cinq entrées **la veille**. *Une règle écrite sans contrôle est une règle qui
dérive* — le registre disait quoi, pas comment on vérifie. C'est le **contrôle n°6** (§2.52).

Corrigé au passage : 09.2 marquait « Actifs » comme destination active. La destination active se
lit **à la section, pas à l'écran** — une fiche de modèle appartient au référentiel, qui vit sous
« Plus », comme 09.1 dont elle est la sous-section.


### 25.2 · Les surcharges inline — 07/08, §2.51 fermé

Trente-deux surcharges métriques relevées sur les 26 planches. **Six étaient des variantes sans
nom** — un contrôle dont la valeur passe à la ligne (`.field.multi`, `.val.multi`), une vignette
dans un contrôle (`.vig.sm`), une liste de mentions nue (`.who.bare`), un téléphone rogné
(`.phone.crop`), les cartes muettes du fond (`.card.blank`) — et **vingt-six étaient la même
déclaration recopiée**, repliée dans sa règle de base.

Deux trouvailles au passage : `.phone.tall` **disait le contraire de ce qu'elle fait** (elle
retire le plancher) → `.phone.free` ; et le « téléphone » de prose de 06.1 n'était pas un écran
mais un **panneau à la largeur du téléphone** → `.pnote`.

*Le partage tient à une seule question : le texte est-il identique à tous ses emplois ? Si oui,
il appartient à la règle ; sinon, il nomme une variante.*

**Le design system n'a plus de dette ouverte.** Divergences subies : 0 · barres du bas : 54/54 ·
surcharges qui défont une métrique : 0 · rayons hors échelle : 0 · homonymes : 0.


## 26. 08/08 — planche 15.1, Finances et Rapports

`screens/finances-1-rapports-piste.html`, groupe « 15. Finances et rapports ». Quatre colonnes :
*Finances — ce qui reste* · *Enregistrer une dépense* · *Rapports — ce que chacun contient* ·
*Un rapport avant l'export*. Deux réglages : l'origine du classement CAPEX/OPEX, et le sort d'un
champ mal lu sur une facture.

**Ce que la planche tranche** (registre §2.53) : un chiffre deviné ne se présente pas comme un
chiffre su · la question posée à un budget est « combien reste-t-il » · un rapport dit ce qu'il
contient **avant** l'export, et celui qui n'a rien à dire n'a pas de bouton · le tableau d'un
rapport est **la seule exception** du produit à la largeur de lecture.

**Deux inventions trouvées dans le code**, du même genre que les spécifications de repli de 09.2 :
le classement CAPEX/OPEX **deviné du montant** (seuil 5 000 €), et un champ de facture
**pré-rempli même quand la lecture est incertaine**, avec sa confiance écrite à côté. Les deux sont
gardées en réglage, pour comparaison.

**Le contrôle d'homonymes a tourné avant d'écrire le CSS** et a attrapé **3 noms sur 11** :
`.brow`, `.cnt` (pris par sept planches) et `.cols` (pris par 09.2 la veille). Renommés avant
toute écriture. *Première planche du projet à n'avoir créé aucun homonyme.*

**Couverture : 27 écrans dessinés sur 36.** Restent l'explorateur de documentation et `approvals`
à réinstruire.


---

## 27. 08/08 — planche 06.5, arbitrer les demandes (et l'exclusion levée)

`screens/attribution-5-arbitrer-piste.html`, groupe « 06. Attribution ». Quatre colonnes :
*la file — ce que je décide, ce que j'attends* · *une demande — les quatre gardes, et celle qui
saute* · *refuser, ou renvoyer* · *l'historique — ce qui a été décidé, par qui, et pourquoi*.

**L'écran était exclu pour une mauvaise raison.** Le rapport du 07/08 le disait replié sous
l'onglet « Tâches ». C'est un regroupement de **barre de navigation** — `tasks`, `approvals` et
`new_request` allument la même entrée — et rien d'autre. `approvals` a sa page, sa rangée, sa
permission, ses deux onglets et une machine à états à quatre gardes. L'exclusion est levée ;
la couverture passe à **28 / 36**.

**Trois défauts, tous dans la manière de nommer** (registre §2.54) : la file fusionne ce que je
dois trancher et ce que je ne fais que suivre ; deux gardes distinctes partagent le libellé
« Validation en cours » ; et le « Refuser » de la dotation **ne refuse rien** — il rend la demande
à l'IT, en annonçant au demandeur qu'elle est rejetée.

**Deux réglages** : « La file » (regroupée par qui décide / plate, produit actuel) et « Le renvoi
de dotation » (nommé renvoi / présenté comme un refus, produit actuel).

**Aucun homonyme créé, et aucune rangée inventée** : la file d'arbitrage réemploie le composant de
rangée de 03.3 tel quel. Quatre rôles neufs seulement — `.dstep`, `.trail`, `.tstep`, `.dec`.

**Reste ouvert** : l'explorateur de documentation (`/documentation/ui-flow-map`), route de
production hors coque — à dessiner ou à exclure explicitement.

## 28. 13/08 — planches 16.1 et 16.2, l'audit dessiné (vague 5)

`screens/audit-1-vue-globale-piste.html` et `screens/audit-2-campagne-piste.html`, groupe
« 16. Audit ». Les deux derniers écrans de production absents du dessin. La couverture passe à
**30 / 36** ; il ne reste que le régime tablette et la décision « explorateur de documentation ».

**16.1 — vue globale.** Quatre colonnes : *au repos, aucune campagne n'a jamais tourné* · *une
campagne en cours, l'écart en porte-voix* · *choisir le périmètre, et le cas où il ne reste rien* ·
*le relevé*. Six relevés, dont **deux faux comptes** : l'écran s'ouvre filtré sur
`countries[0]` — la France — sans qu'un mot le dise (7 actifs sur 14 hors de vue), et
`missing = expected − found` **déclare tout le parc manquant** avant le premier scan. Décision de
dessin : le bloc des quatre chiffres **n'apparaît qu'en campagne** ; au repos, un seul nombre — les
attendus — et une date, *jamais*.

**Deux découvertes annexes.** Quatre services sur sept n'attendent aucun actif : les actifs portent
un **département** (« IT HQ », valeur par défaut des 7 actifs français) là où le référentiel porte
un **service** (« IT »). Les deux vocabulaires ne se recoupent pas — **dette de donnée signalée**,
pas arbitrage de maquette. Et le lexique **ne portait aucun mot d'audit** : six termes y entrent,
dont « écart », qui entre en collision avec le « Signaler un écart » de l'attribution.

**16.2 — la campagne.** Quatre colonnes : *le parc du service* · *l'onglet Écarts et les deux
natures* · *la clôture, et ce qu'elle retire du parc* · *le relevé*. Sept relevés, dont un onglet
qui ne peut rien afficher : `missingItems = auditFinalized ? todoItems : []` — « Manquants »
reste vide pendant toute la campagne, puis répète « À scanner ».

**Le seul arbitrage qui s'écarte du plan du 11/08.** La revue demandait **4 onglets à badges** ;
la planche en dessine **2**. À scanner, retrouvés et manquants sont trois états d'un même objet —
le test du 05/08 (deux onglets sont légitimes s'ils portent deux sujets) les fait fusionner en
**un onglet du parc à trois puces**. L'écart reste un onglet : il ne parle pas d'un attendu. Les
badges sont conservés, et celui des écarts est **orange** — c'est le seul qui demande une décision.

**Une règle ajoutée au produit.** *Un écart non tranché bloque la clôture.* Elle remplace le motif
libre : un objet trouvé là où il n'était pas attendu a déjà une réponse — il vit ici, ou il vit
ailleurs. Le code ne porte le geste que pour un des deux cas (`handleAlignService`).

**Le mot-clé à recopier tombe.** La clôture exige aujourd'hui de taper `CLOTURER`. Une friction
n'est utile que si elle fait relire la conséquence ; la confirmation de 17.2 la chiffre à sa place.

**Aucun composant neuf hors la carte d'écart** : six emprunts — scan en mode lot et squelettes
(17.3), confirmation destructive (17.2, 9ᵉ emploi), héro (04.2), rangée (04.1), création de fiche
(04.3). Deux rôles propres : `.ecart` et `.seg` (les onglets, dessinés pour la première fois du
chantier).

**Viewports mesurés** au harnais, jamais estimés : 1720 × 2770 et 1720 × 3050. Le harnais compte
désormais **33 planches**.

## 29. 14/08 — planches 00.4 et 00.5, le régime tablette (vague 6, et fin du planning)

`screens/regimes-2-rail-piste.html` et `screens/regimes-3-sans-rail-piste.html`, groupe
« 00. Références du système ». Les **5 gabarits restants** portés à 768 px. Avec les 3 déjà démontrés
en 00.3, les **8 gabarits du système** ont leur régime tablette : les 28 écrans se rattachent à huit
portages, plus à 28 décisions. **Le planning du 11/08 est épuisé.**

**00.4 — le rail** (tableau de bord, file, référentiel). Trois cadres à 768 px, un cadre de
comparaison à 393, et un relevé. La loi de 00.3 tient : **une colonne**, parce qu'à 768 moins le
rail de 88 il reste 680 px, et deux colonnes tomberaient à 306 px — sous le plancher de 360. Le
réglage « colonnes » dessine l'alternative pour qu'on voie ce qu'on écarte : c'est ce que le produit
fait aujourd'hui, **trente `medium:grid-cols-2`** posées écran par écran.

**Un ajout à la loi, découvert en portant.** 00.3 ne parlait que de contenu à lire. La **bande de
chiffres** n'en est pas : quatre nombres tabulaires n'ont pas de largeur de lecture et se comparent
mieux côte à côte. Elle passe donc **de la pile à la ligne dès 600** — le seul objet du système qui
change de forme avec la largeur. À verser au registre, sinon chaque écran le retranchera.

**00.5 — sans rail** (assistant, formulaire plein écran). Les deux gabarits où la navigation
s'efface. L'assistant remplace son compteur « étape 2 sur 5 » par les **cinq étapes nommées**, en
haut et non à gauche — une colonne d'étapes reprendrait la place du rail qu'on vient de retirer et
coûterait 200 px de mesure.

**Le second ajout, et le plus utile.** Une liste s'élargit, **un formulaire se mesure** : à 768 px,
l'assistant du produit étire son champ « numéro de série » à **680 px pour dix caractères**. Trois
largeurs de champ entrent au registre — **560 px** (mesure du contenu), **240** (une date), **200**
(un nombre) — et le **pied d'acte se borne à la mesure**, faute de quoi le geste finit à 400 px du
dernier champ rempli.

**Neuf relevés**, dont le plus structurant : `MEDIA.medium` n'est employé que dans **2 vues sur
28**, et l'assistant — l'une des deux — montre exactement ce qu'un portage écran par écran produit.
Le dessin est ici **en avance sur le produit**, ce qui était l'intention du planning.

**Deux corrections de mécanique en cours de route**, notées parce qu'elles se reproduiront : un
`style` en ligne portant `display:flex` battait la règle du réglage « colonnes » (le réglage ne
faisait rien) ; et des pistes `1fr` débordaient le cadre de 680 px faute de `minmax(0,1fr)`.

**Viewports mesurés** au harnais : 2840 × 2590 et 2040 × 2380. Le harnais compte **35 planches**,
**aucune coupée**.

---

## État du chantier au 14/08

Les **sept vagues du planning du 11/08 sont terminées.** 35 planches, 30 écrans de production sur
36 couverts, 8 gabarits sur 8 portés à la tablette, 4 vues transverses pour 20 emplois.

**Une décision restait ouverte** : l'**explorateur de documentation** — le dessiner, ou l'exclure
explicitement du périmètre.

## Tranché le 14/08 — l'explorateur est hors périmètre du dessin

`DECISION-EXPLORATEUR-14-08.md`. **Motif** : ce n'est pas un écran du produit mais l'outil qui
cartographie le produit — il ne porte ni équipement, ni personne, ni acte, et aucun lien de la coque
n'y mène. Le dessiner ne trancherait aucune question de produit.

**L'exclusion porte sur le dessin, pas sur le relevé.** La lecture des 478 lignes de
`DocumentationExplorerPage.tsx` a produit **sept relevés**, dont deux à arbitrer côté technique :
la route est servie **avant tout contrôle d'accès et hors de l'arbre de providers** — donc
publiquement atteignable par URL, là où la galerie du design system voisine est fermée par le build
— et elle **embarque `UI_FLOW_MAP.md` dans le bundle client**. Les cinq autres sont du désordre
interne : la page **masque l'essentiel d'elle-même par sélecteurs de descendance**
(`[&>section:nth-child(2)]:hidden`, un `aside` en `hidden`) tout en continuant à livrer le markup,
la recherche et la logique de filtrage ; un inspecteur de relations défini et jamais monté ; des
badges en dur annonçant 33 écrans quand le tableau en porte 27 ; un thème sombre qui écrit sur le
document de l'application ; un canevas fixé à 1660 × 820 px, hors des trois régimes de 00.3.

**Le chantier est clos.** 35 planches, **30 écrans de production sur 36** — les 6 restants sont
l'explorateur (exclu), la galerie du design system (build DEV) et 4 écrans hors session déjà
couverts par 02.1 et 02.2. Aucune décision n'est ouverte.

## 30. 14/08 — passe de cohérence sur les 35 planches, et deux arbitrages de règle

Aucune planche nouvelle. Un **contrôle mécanique** du corpus entier, deux règles tranchées, un retrait
ajouté. Le corpus est désormais cohérent avec le registre et le lexique tels qu'ils sont, et non tels
qu'ils étaient quand chaque planche a été écrite.

**Le contrôle.** 35 cartes, **35 viewports présents** (aucune valeur estimée, toutes mesurées au
harnais), libellés de groupe homogènes sur les 15 groupes, aucune planche coupée.

**Sept légendes requalifiées**, sur trois planches. La passe du 12/08 ne les avait pas vues parce
qu'elle ne cherchait que les « Piste — » : elle a manqué les légendes **numérotées**, qui ne portaient
aucun des trois préfixes.

| Planche | Avant | Après |
| --- | --- | --- |
| 17.2 ×4 | « 1 · Entrer en sélection », etc. | `État — ` ×3, `Relevé — ` pour la colonne de règles |
| 09.1 ×2 | « 04.1 — aucune famille prise » | `Vue — 04.1, …` (une autre page vue depuis celle-ci) |
| 03.3 ×1 | « 999 — la file pagine » | `État — 999 tâches, la file pagine…` |

Le `À planifier` relevé dans 16.1 est un **faux positif légitime** : c'est une citation du code entre
guillemets, dans le relevé V4 qui écarte précisément ce mot.

**Arbitrage 1 — les planches de référence sont exemptes des trois préfixes.** Six légendes de 00.1
(*la palette*, *l'échelle*, *les composants*, *le héro*, *les icônes*, *la démonstration*) sont des
**chapitres**, pas des états d'une vue : `État — ` y serait faux, et `Relevé — ` est défini comme
*ce que le produit porte, montré pour être écarté* — l'inverse de ce que 00.1 fait. **Décision :
exempter le groupe `00. Références du système`**, écrit dans `CLAUDE.md`, motivé dans
`REGLES-TRANSVERSES.md` §A. Pas de quatrième préfixe : un mot de plus à retenir pour six titres, et
l'hésitation entre `Repère — ` et `Relevé — ` coûterait plus que la règle ne rend. Le contrôle
rapporte maintenant **0 légende hors préfixe sur les 32 planches de page** — un contrôle qui rapporte
toujours six erreurs connues finit par ne plus être lu.

**Arbitrage 2 — le « Centre d'aide » tombe, dans 14.1 et non dans une planche neuve.** Quatre pavés —
*Documentation, Support, Tutoriels, FAQ* — en `<Button variant="outlined">` **sans `onClick`** : ils
réagissent au survol et ne mènent nulle part. Le Centre d'aide étant une **section de la page
Paramètres**, le retrait rejoint la colonne « Relevé » de 14.1, qui en portait déjà trois — la
« section qui promet » qu'elle écartait était *Affichage* (le mode sombre annoncé), pas celle-ci. La
colonne passe donc à **quatre retraits**.

Motif : **un geste mort est pire qu'un manque**, parce qu'il fait croire que l'aide existe et qu'on
cherche deux fois avant de renoncer. Ce qui survit, s'il survit quelque chose : **une ligne dans
« À propos » — *Contacter le support* — dont la destination est un réglage que l'organisation
remplit**, et qui ne s'affiche pas si elle est vide. Un écran de réglages ne porte pas une adresse
qu'on n'a pas.

**Viewport de 14.1 remesuré** après l'ajout : 1720 × 2330 (2246 réel). Les 35 planches restent
mesurées et non coupées.

**Ce qui reste, et rien n'est bloqué.** Les **cinq écrans hors couverture** (sur 35) : l'explorateur a
son motif écrit depuis hier, les **quatre autres n'en ont pas** — une note courte par écran rendrait le
périmètre défendable en entier plutôt que subi. Puis le **dossier de passation aux développeurs** :
par quel écran commencer, quels composants partagés construire d'abord (17.2 vaut 20 emplois, 17.3 en
vaut 28), et quelles dettes de données bloquent quoi — la dette *département / service* de 16.1 en
tête, qui vide quatre services sur sept.
