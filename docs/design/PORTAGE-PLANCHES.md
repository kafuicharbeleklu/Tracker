# Portage des planches — où on en est

**Établi le 04/09/2026, tenu à jour le 06/09**, contre `_ds_manifest.json` du projet Claude Design « TRACKER »
(40 cartes). Ce fichier se tient à jour à chaque planche portée : c'est la seule carte
qui dise ce qui reste, et elle a déjà démenti une estimation faite de tête.

**14 portées · 6 partielles · 22 restantes** (06/09 : 02.1 remesurée, 02.2 construite, 03.1 repassée, 17.7 portée, 17.1, 17.5 et la confirmation de 17.2 aux mesures).

Une planche est dite **portée** quand sa forme a été relevée sur la planche elle-même
(pas sur un lot), appliquée, et vérifiée à l'écran à 393 px.

---

## Les références du système — 00.

| | Planche | Ce qu'elle porte dans le code | État |
| --- | --- | --- | --- |
| 00.1 | Direction esthétique | `index.css` — les 58 valeurs du socle | **acquis** (bascule du 15/08) |
| 00.2 | Lexique | vocabulaire des écrans | non relevé |
| 00.3 | Les trois régimes | `AppLayout`, les bascules 600 / 840 | **non porté** |
| 00.4 | Le rail | `NavigationRail`, `Sidebar`, gabarits ≥ 768 | **non porté** |
| 00.5 | Sans rail | `WizardLayout`, `FullScreenFormLayout` | **non porté** |

> 00.3 à 00.5 tiennent le **régime tablette et bureau**. Tout ce qui a été porté jusqu'ici
> l'a été au téléphone.
>
> **Le chantier est mis en attente le 06/09**, à la demande du commanditaire : *« pour le
> moment on veut le projet en dimension mobile »*. Les 28 écrans se dessinent au
> téléphone, et une fenêtre large montre **l'appareil des planches** — 393 × 852, rayon
> 8 — centré sur le bureau, plutôt qu'une seconde mise en page à porter deux fois.
>
> L'interrupteur est `MOBILE_ONLY`, expliqué dans `src/constants/breakpoints.ts`. Il agit
> sur trois couches : les réponses de `useMediaQuery`, les classes de fenêtre de Tailwind
> (`medium:`, `expanded:`, `large:` deviennent inertes — 122 emplois d'un coup), et le
> cadre de `index.css`. Le remettre à `false` ici **et** dans `tailwind.config.js` rouvre
> le chantier là où il s'était arrêté.

## Les pages du produit

| | Planche | Écran(s) | État |
| --- | --- | --- | --- |
| 02.1 | Connexion | `LoginPage` | **portée** le 06/09, mesurée (repos · erreur au champ · mot de passe oublié · lien envoyé) |
| 02.2 | Première connexion | `FirstLoginPage` (`#/invite/:jeton`) | **portée** le 06/09 — lot 15 : invitation, mot de passe, code de remise, quatre cas d'échec |
| 03.1 | Tableau de bord | `DashboardPage` | **portée** — repassée le 06/09 sur la passe du 05/09 (carte « Le parc », cartes à 16, rangées sans verbe, image de cartouche) |
| 03.2 | « À traiter » | zone du tableau de bord | porté avec 03.1 |
| 03.3 | Tâches | `TasksPage` | **porté** |
| 04.1 | Liste équipements | `InventoryPage` | **portée** (mesurée) |
| 04.2 | Détail équipement | `EquipmentDetailsPage` | **porté** (pilote) |
| 04.3 | Créer, corriger, sortir | `AddEquipmentPage`, `ImportEquipmentPage`, `IncidentSheet`, `RetireSheet` | **portée** (mesurée) |
| 04.4 | La suite de l'incident | — (entité `Incident`, lot 8 non appliqué) | **non porté** |
| 05.1 | Liste utilisateurs | `UsersPage` | **portée** (repassée à la mesure) |
| 05.2 | Fiche d'une personne | `UserDetailsPage` | **portée** (repassée à la mesure) |
| 05.3 | Créer un compte | `InviteSheet`, `AddUserPage`, `ImportUsersPage` | **portée** — création par invitation |
| 06.1 | Le parcours complet | `HandoverTrail`, les deux assistants | **partiel** — le fil et l'attente sont portés ; les quatre feuilles restent |
| 06.2 | L'attestation | `Attestation`, `PinField`, `SignaturePad` | **portée** — sauf « définir son code », qui vit en 07.1 et 02.2 |
| 06.3 | Fins de flux | les clôtures | **non porté** |
| 06.4 | Demander un équipement | `NewRequestPage` | **non porté** |
| 06.5 | Arbitrer une demande | détail d'arbitrage | **non porté** — la planche dit qu'elle cesse d'être une file |
| 07.1 | Mon compte | `SettingsPage` (`/settings/account`) | **non porté** |
| 09.1 | Catalogue | `ManagementPage`, `CategoryDetailsPage`, `AddCategoryPage` | **non porté** |
| 09.2 | Fiche de modèle et imports | `ModelDetailsPage`, les trois imports | **non porté** |
| 10.1 | Emplacements | `LocationsPage`, `SiteDetailsPage` | **porté** |
| 11.1 | Accès | `RbacPage` | **non porté** — refonte, arbitrage en attente |
| 14.1 | Paramètres | `SettingsPage` | **non porté** |
| 15.1 | Finances et rapports | `FinanceManagementPage`, `ExpenseJournalPage`, `ReportsPage` | **non porté** |
| 16.1 | Inventaire — vue globale | `AuditPage` | **non porté** |
| 16.2 | Inventaire — la campagne | `AuditDetailsPage` | **non porté** |

## Les composants partagés — 17.

Ils portent la moitié du produit : une décision y vaut pour N écrans.

| | Planche | Composant | État |
| --- | --- | --- | --- |
| 17.1 | États d'écran (4 états) | `ScreenState` | **partiel** — mesures du 06/09 portées (96 · 22/28 · 16/24, marges 24 · 16 · 64), introuvable et refusé sur la forme commune ; **hors ligne reste en bandeau** |
| 17.2 | Sélection et confirmation (22 emplois) | `SelectionTopBar`, `BulkActionBar`, `ConfirmationSheet` | **partiel** — la **confirmation** est portée sur la forme des pages (06/09) ; **la sélection reste** |
| 17.3 | L'attente et le scan (28 écrans) | `Skeleton`, `ScanView` | **non porté** |
| 17.4 | La feuille d'acte (9 actes) | la feuille des actes | **non porté** |
| 17.5 | Le retour transitoire (168 messages) | `Snackbar`, `InlineError` | **partiel** — snackbar aux mesures du 06/09 (56 · 14/20), message au champ porté ; **le bandeau et le tri des 168 messages restent** |
| 17.6 | Le geste d'ajout (6 emplois) | `FabContainer` | **partiel** — ancrage 64 + 16 = 80 porté le 06/09 ; la feuille de choix reste |
| 17.7 | La barre du bas (28 écrans) | `NavigationBar` | **portée** le 06/09 — 64 / 24 / 12, badge chiffré, feuille « Plus » en trois groupes sur le canon des rangées de 56 |
| 17.8 | L'en-tête de liste (8 emplois) | `ListTemplate` | **partiel** — bloc aux mesures du 06/09, ligne de tri rentrée dans le bloc fixe ; **les chips de partition restent dans l'en-tête** |
| 17.9 | La donnée et son explication | `InfoTip` | **non porté** |

---

## Deux arbitrages tranchés le 04/09

**17.8 est antérieure à la passe sobre, et 04.1 l'emporte.** La planche du composant
décrit un en-tête à titre de 20 px et un champ de recherche **cerné** ; les quatre
planches de pages de la passe sobre (03.3, 04.1, 05.1, 10.1) donnent 28 px et un champ
**rempli**. 17.8 garde par ailleurs les pastilles d'état dans la bande, que 04.1 déplace
dans la feuille de filtre. Sa matrice des six slots reste juste — c'est son dessin qui a
vieilli. À reprendre quand la planche sera rejouée.

**Le dessin de l'import reste celui de 09.2.** 04.3 colonne 2 dessine l'import du parc
en deux cartes à tuile teintée, avec sa barre de progression et son pied jaune ; le
gabarit `ReferentialImportTemplate` sert **trois** écrans, et le redessiner pour un
seul les ferait diverger. Le **contrat** de 04.3 est porté (pays et emplacement
requis, identifiant déduit, huit colonnes facultatives) ; sa **forme** attend 09.2.

**Le rayon de vignette reste à 6.** 04.1 et 05.1 écrivent `border-radius:4px` sur la
vignette de rangée, mais le socle (`styles.css`) déclare « 6 pour les héros et les
vignettes », et `CORRESPONDANCE-ICONES.md` §6 le redit — « vignette de rangée (40 px,
rayon 6) ». Deux sources transverses contre deux pages : le jeton ne bouge pas.

## Ce que le compte apprend

**Les transitions sont le trou le plus large.** Le groupe `06.` — le parcours, l'attestation,
les clôtures, la demande, l'arbitrage — n'est pas touché du tout côté forme. Les lots 1 à 7
y ont corrigé des mécanismes (le refus, l'annulation, la réception, le barème du retour),
pas leur dessin. C'est là que vit « la validation d'une tâche », et elle passe par
l'attestation de 06.2, qu'aucun écran ne dessine encore.

**Les formulaires n'ont rien reçu.** Créer, corriger, sortir un équipement (04.3), créer un
compte (05.3), les fiches de catalogue et les trois imports (09.1, 09.2) : sept écrans de
saisie, aucun porté.

**Les composants partagés non plus.** 17.1 à 17.9 valent chacun pour N écrans ; les porter
tôt évite de reprendre N fois la même chose. 17.7 (la barre du bas) et 17.1 (les états
d'écran) touchent les 28 écrans à eux deux.

**Et tout ce qui précède ne concerne que le téléphone.** 00.3 à 00.5 tiennent le rail et le
bureau, et rien n'a été relevé de ce côté.

## Ce que 06.1 demande encore

La planche remplace **les deux assistants par quatre feuilles**, une par acte, posées
sur la page d'où le geste part : l'informatique remet (fiche de l'objet), la personne
confirme (Tâches), la personne rend (sa fiche), l'informatique réceptionne (Tâches).
Chacune ne pose que la question restée ouverte, puis demande une attestation.

Ce qui est fait : le **fil à deux lignes** (`.ack`), l'attente comme état visible avec
son propriétaire et ses deux gestes, et la méthode d'attestation écrite sur la remise.

Ce qui reste : les quatre feuilles elles-mêmes. Attention en les portant — la planche
suppose que **le contexte fournit les deux côtés** (l'objet vient de la fiche, le
destinataire de la demande validée). Le chemin générique — « Attribuer » depuis la
fiche d'une personne ou depuis rien — a encore besoin d'une sélection, que la planche
ne dessine pas. À signaler plutôt qu'à inventer.

## Ordre proposé

1. **Les composants partagés d'abord** — 17.1, 17.7, 17.5, 17.2. Une décision pour N écrans,
   et ils passent avant les pages qui les emploient (c'est ce que dit `PROMPT-AGENT-CODE.md`
   §2, étape 1).
2. **Les transitions** — 06.2 puis 06.1, 06.4, 06.5, 06.3. Le cœur fonctionnel, et le trou
   le plus visible.
3. **Les listes et fiches restantes** — 04.1, 09.1, 09.2, 16.1, 16.2, 15.1.
4. **Les formulaires** — 04.3, 05.3.
5. **Les réglages** — 14.1, 07.1, 11.1 (celle-ci après arbitrage du vocabulaire RBAC).
6. **Le rail et le bureau** — 00.3, 00.4, 00.5, sur tout ce qui précède.

---

## Ce que la passe du 06/09 laisse ouvert sur la coque

- **Le rail de 17.7 est blanc, celui du produit est sombre.** La planche dessine le
  rail (600–839 px) sur `--surface`, filet `--line`, entrées de 64 en `nav-on`. Le
  produit porte un rail **sombre**, de la même famille que la barre latérale de
  ≥ 840 px — que 17.7 ne dessine pas. Porté ce jour : sa **largeur (80)** et son
  **badge**, qui sont des faits ; la teinte est un arbitrage de socle, parce que
  changer le rail seul donnerait deux surfaces de navigation contradictoires.
- **Historique (18.1) n'a pas de page**, donc pas de rangée dans « Suivi » : un geste
  mort est pire qu'un manque. La rangée s'ajoute avec l'écran.
- **« Rôles & accès » contre « Rôles et permissions »** : le registre des destinations
  porte le premier, la feuille de 17.7 le second. Le libellé fait partie de l'arbitrage
  en attente sur 11.1 ; il n'a pas été tranché ici.

---

## La dimension mobile, et ce qu'elle met en attente (06/09)

Tant que `MOBILE_ONLY` vaut `true` :

- **Le rail et la barre latérale ne s'affichent plus.** La coque choisit toujours la barre
  du bas. Le désaccord de teinte entre le rail blanc de 17.7 et le rail sombre du produit
  n'a donc plus d'effet visible, mais il n'est pas tranché pour autant.
- **La mesure de 560 px de 00.5** reste écrite dans les pages hors session
  (`AUTH_MEASURE`). Elle ne se voit pas : la colonne du téléphone est plus étroite. Elle
  reprendra son office le jour où le régime bureau se rouvre.
- **Les 122 classes de fenêtre du code restent en place.** Elles ne sont pas retirées,
  elles sont neutralisées : le travail déjà fait pour la tablette n'est pas perdu.

---

## 17.1 — ce que la passe du 06/09 laisse à faire

Les mesures sont portées et les trois écrans qui empruntent l'état vide en partagent
désormais un seul : l'état vide des listes, la page introuvable et l'accès refusé.

Reste la **règle 2 de la planche**, qui n'est pas une mesure mais un comportement :
*« Hors ligne, on lit, on n'écrit pas. »* L'état doit se dire **dans la forme de l'état
vide** — motif `wifi-slash`, titre, phrase, heure de la dernière lecture — et non en
bandeau ; et sur une page déjà chargée, **les gestes qui écrivent disparaissent** au lieu
de s'afficher barrés. Le produit porte aujourd'hui `OfflineBanner`, un bandeau, et aucun
écran ne retire ses gestes d'écriture. C'est un changement de comportement sur les
28 écrans, pas une reprise de forme : il vaut son propre lot.

La planche note elle-même que ce point n'est pas tranché côté code : *« le produit stocke
aujourd'hui dans le navigateur et son serveur est optionnel — ce que “écrire” veut dire
exactement quand il n'y a pas de réseau reste à trancher »*.

---

## 17.5 — ce qui est porté, et la forme qui manque

La planche donne **quatre formes**, triées par une seule question : *qu'est-ce qui a
changé, et qui doit agir ?*

| Réponse | Forme | État |
| --- | --- | --- |
| Rien n'a changé, personne n'agit | snackbar sombre au-dessus de la barre | **portée** — 56 de haut, intérieur 8 / 14, message 14 sur 20, geste 14 sur 20 sur une cible de 40, effacement à 4 s, un seul à l'écran |
| Un champ précis est en cause | message au champ | **portée** — 14 sur 20, glyphe de 18, 8 px sous le champ, filet danger (02.1, 06/09) |
| La vue a changé | **bandeau** en tête de page (06.3) | **manquante** |
| Il faut trancher | feuille de 17.2 | non portée (17.2) |

**Le bandeau n'existe pas encore dans le produit**, et il ne se crée pas à vide : ses
emplois sont les clôtures d'actes du groupe 06, qui ne sont pas portées. Un composant
sans appelant serait du code mort ; il arrivera avec 06.3.

**Le tri des 168 messages reste entier.** La planche est explicite : *« un message de
90 signes en snackbar n'est pas un message trop long, c'est un tri mal fait. »* Le
produit annonce encore par snackbar des succès qui changent la vue — une réception
confirmée, une demande validée — là où la planche veut le bandeau. C'est une reprise
appel par appel, dans 31 fichiers, et elle se fait avec les écrans qui les portent.

---

## 17.2 — la confirmation est portée, la sélection non

**La confirmation prend la forme des pages** (passe du 06/09). Relevé de la planche :
les écrans qui confirment portaient tous la même feuille, et 17.2 en dessinait une autre.
Le composant partagé s'y range désormais, pour ses onze appels.

| Élément | Planche | Avant |
| --- | --- | --- |
| Cercle-icône de tête | **retiré** | rond de 48, teinté |
| Titre | 22 sur 28, chasse −.015 | 22 sur 27 |
| Réversibilité | **sous-titre** sous le titre, rouge si irréversible | ligne rouge après le corps |
| Conséquence | bloc « Ce que cela change » dans un creux, rayon 4 | paragraphe libre |
| Motif | creux sans filet | champ bordé |
| Pied | deux verbes de **même largeur**, 12 d'écart | Annuler en texte, verbe étiré |

Deux propriétés s'ajoutent au contrat, sans rien casser : `reversibleNote`, la phrase
« Réversible : … » que seul l'appelant connaît, et `subject`, l'objet en rangée que la
planche nomme `.fixed`.

**Ce qui reste, et pourquoi ce n'est pas un oubli.**

- **Les titres sont encore des questions.** *« Supprimer Latitude 5540 du parc ? »* là où
  la planche veut le verbe seul et le sujet en rangée. C'est une reprise de contenu sur
  onze appels, elle se fait avec les écrans qui les portent.
- **La sélection multiple n'est pas portée** : barre sombre de 56 remplaçant la barre du
  haut, compte « 3 sur 17 », case de 24 à la place de la vignette, pied d'actes absent à
  sélection vide, et **l'appui long pour seule entrée** (arbitré le 06/09). Ses quatre
  écrans — Tâches, Catalogue, Actifs, Équipe — ne sont pas dans le périmètre porté.

---

## 17.8 — le bloc est aux mesures, les partitions non

La planche a été **rejouée le 06/09** : elle dessinait le gabarit en deux morceaux avec un
segment d'onglets, les huit pages portent un seul bloc, et c'est la planche qui s'est
rangée sur les pages. L'arbitrage du 04/09 noté plus haut — *« 17.8 est antérieure à la
passe sobre, et 04.1 l'emporte »* — est donc clos : les deux disent la même chose.

| Élément | Planche | Avant |
| --- | --- | --- |
| Bloc `.top` | 8 en haut, **12** en bas, 12 entre les lignes | 8 et 16 |
| Rangée du titre | **48**, la mesure de son geste | 56, plus 12 de padding sur le titre |
| Ligne de tri et de compte | **12 sur 16**, *dans le bloc fixe* | 14 sur 20, dans le contenu qui défile |

Le dernier point est le plus important, et la planche l'écrit : *« un filtre posé dans la
page disparaît au premier défilement, et la liste devient un sous-ensemble sans
étiquette. »* La ligne appartient à l'en-tête, avec la recherche et l'entonnoir.

**Ce qui reste : le cinquième slot n'existe plus, mais le code le porte encore.** Les
partitions sont des chips **dans la feuille de filtre** depuis le 05/09 ; `ListTemplate`
les affiche toujours dans la bande (`facets`). Les retirer demande que chaque page ait sa
feuille de filtre — c'est un lot par page, pas une reprise du gabarit.
