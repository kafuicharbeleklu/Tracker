# Portage des planches — où on en est

**Établi le 04/09/2026, tenu à jour le 06/09**, contre `_ds_manifest.json` du projet Claude Design « TRACKER »
(40 cartes). Ce fichier se tient à jour à chaque planche portée : c'est la seule carte
qui dise ce qui reste, et elle a déjà démenti une estimation faite de tête.

**20 portées · 10 partielles · 11 restantes** (06/09 : 02.1 remesurée, 02.2 construite, 03.1 repassée, 17.7 portée, 17.1 à 17.5, 17.8 et 17.10 avancées ; **17.4 et 17.2 closes le 06/09 au soir** — les deux assistants sont devenus des feuilles, la sélection groupée porte ses quatre écrans, **06.1**, **06.4** et **06.5** sont portées, **06.3** est engagée et donne enfin son bandeau à 17.5 ; **09.1** et **09.2** reprises à la mesure).

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
| 00.5 | Sans rail | `FullScreenFormLayout` (`WizardLayout` supprimé le 06/09 : 17.4 proscrit les assistants) | **non porté** |

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
| 04.1 | Liste équipements | `InventoryPage`, `ListRow` | **portée** — en-tête 17.8, filtre en feuille, rangée de 68 mesurée le 07/09 |
| 04.2 | Détail équipement | `EquipmentDetailsPage` | **porté** (pilote) |
| 04.3 | Créer, corriger, sortir | `AddEquipmentPage`, `ImportEquipmentPage`, `IncidentSheet`, `RetireSheet` | **portée** (mesurée) |
| 04.4 | La suite de l'incident | — (entité `Incident`, lot 8 non appliqué) | **non porté** |
| 05.1 | Liste utilisateurs | `UsersPage` | **portée** (repassée à la mesure) |
| 05.2 | Fiche d'une personne | `UserDetailsPage` | **portée** (repassée à la mesure) |
| 05.3 | Créer un compte | `InviteSheet`, `AddUserPage`, `ImportUsersPage` | **portée** — création par invitation |
| 06.1 | Le parcours complet | `HandoverTrail`, `HandoverActSheet`, `ReturnActSheet`, `ActSheet` | **portée** — le fil, l'attente et **les quatre feuilles** ; la réception s'atteste depuis la fiche |
| 06.2 | L'attestation | `Attestation`, `PinField`, `SignaturePad` | **portée** — sauf « définir son code », qui vit en 07.1 et 02.2 |
| 06.3 | Fins de flux | `ClosureBanner`, `DetailTemplate.banner` | **partiel** — les formes 1 et 2 sont portées et mesurées ; restent la forme 3 et « signaler un écart » |
| 06.4 | Demander un équipement | `RequestSheet` (`NewRequestPage` supprimée) | **portée** — feuille sur la page, choix du type en tuiles, deux crans d'urgence, destination dite avant le geste |
| 06.5 | Arbitrer une demande | `ApprovalDetailsPage` (`/tasks/request/:id`) | **portée** — le détail qu'une rangée ouvre : le motif, ce qu'il détient, le parcours, et les gestes selon qui lit |
| 07.1 | Mon compte | `SettingsPage` (`/settings/account`) | **non porté** |
| 09.1 | Catalogue | `ManagementPage`, `CategoryDetailsPage`, `AddCategoryPage` | **portée** — en-tête 17.8, partitions en feuille, vide et feuille d'ajout (07/09) |
| 09.2 | Fiche de modèle et imports | `ModelDetailsPage`, `ReferentialImportTemplate` | **portée** — la fiche du modèle et les deux imports, mesurés |
| 10.1 | Emplacements | `LocationsPage`, `SiteDetailsPage` | **porté** |
| 11.1 | Accès | `RbacPage` | **non porté** — refonte, arbitrage en attente |
| 14.1 | Paramètres | `SettingsPage` | **non porté** |
| 15.1 | Finances et rapports | `FinanceManagementPage`, `ExpenseJournalPage`, `ReportsPage` | **partiel** — l'exercice en cours porté le 07/09 ; restent les exercices, la saisie et les rapports |
| 16.1 | Inventaire — vue globale | `AuditPage`, `placeAudit`, `AuditOverview*` | **portée** — les deux niveaux, le héro, le périmètre à deux axes ; sur le gabarit 17.8 |
| 16.2 | Inventaire — la campagne | `AuditDetailsPage` | **portée** — le parc et les écarts en deux écrans, le scan dans le héro, la clôture au ⋮ |
| 18.1 | Historique — le journal | `HistoryPage` | **portée** — le journal par jour, les natures en chips, un fait ouvert |

## Les composants partagés — 17.

Ils portent la moitié du produit : une décision y vaut pour N écrans.

| | Planche | Composant | État |
| --- | --- | --- | --- |
| 17.1 | États d'écran (4 états) | `ScreenState` | **partiel** — mesures du 06/09 portées (96 · 22/28 · 16/24, marges 24 · 16 · 64), introuvable et refusé sur la forme commune ; **hors ligne reste en bandeau** |
| 17.2 | Sélection et confirmation (22 emplois) | `SelectionTopBar`, `BulkActionBar`, `BulkOverflow`, `SelectableRow`, `ConfirmationSheet` | **portée** — confirmation sur la forme des pages, sélection groupée mesurée sur ses **quatre écrans** ; restent les titres en verbe et les actes groupés de la file |
| 17.3 | L'attente et le scan (28 écrans) | `Skeleton`, `ScanView` | **partiel** — squelettes aux hauteurs réelles et à la nuance du creux (06/09) ; **le scan reste** |
| 17.4 | La feuille d'acte (9 actes) | `ActSheet`, `HandoverActSheet`, `ReturnActSheet` | **portée** — six blocs, choix du bloc 1 et du bloc 2, remise en présence ; plus aucun assistant |
| 17.5 | Le retour transitoire (168 messages) | `Snackbar`, `InlineError` | **partiel** — snackbar aux mesures du 06/09 (56 · 14/20), message au champ porté ; **le bandeau et le tri des 168 messages restent** |
| 17.6 | Le geste d'ajout (6 emplois) | `FabContainer` | **partiel** — ancrage 80 / 16, et le vide ouvre la feuille au lieu d'un chemin direct ; **la forme de la feuille reste** |
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

**Les quatre feuilles sont portées** (06/09, au soir). L'informatique remet
(`HandoverActSheet`), la personne rend et l'informatique réceptionne (`ReturnActSheet`),
et **la personne confirme sa réception** depuis la fiche de l'objet.

Cette dernière écrivait **directement**, sans attestation : le passage de main n'avait de
preuve que d'un côté — celui qui remet signait, celui qui reçoit tapait un bouton. Or
17.4 la range parmi ses neuf actes. Le bouton ouvre donc la feuille, dont les blocs 2 et
3 sont vides (la table les note « — ») : reste l'objet, l'attestation, et une ligne de
conséquence. Le verbe est *« Je confirme »* — celui de la personne, comme *« Je rends »* —
là où la rangée de la file dit « Confirmer ».

Le chemin générique est traité aussi : quand rien n'est connu, la feuille s'ouvre sur le
choix du bloc 1, et 17.4 le dessine — recherche et scan sur une ligne, l'objet demandé en
tête.

**Un écart repéré au passage, et laissé à 03.1.** La rangée « réception » du tableau de
bord mène à la file, quand la table de 17.4 dit qu'elle doit ouvrir *« la fiche de l'objet
reçu »*. C'est la rangée qui est en cause, pas la feuille.

## Ordre proposé

1. **Les composants partagés d'abord** — 17.1, 17.5 (17.7, 17.2 et 17.4 sont faites). Une décision pour N écrans,
   et ils passent avant les pages qui les emploient (c'est ce que dit `PROMPT-AGENT-CODE.md`
   §2, étape 1).
2. **Les transitions** — 06.2, 06.1, 06.4, 06.5 sont faites et 06.3 est engagée (formes 1
   et 2). Le groupe 06 est **fonctionnellement complet** : demander, arbitrer, remettre,
   confirmer, rendre, réceptionner, et dire que c'est fait.
3. **Les listes et fiches restantes** — 04.1, 09.1, 15.1.
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
| La vue a changé | **bandeau** en tête de page (06.3) | **portée** — `ClosureBanner`, 06/09 |
| Il faut trancher | feuille de 17.2 | non portée (17.2) |

**Le bandeau est arrivé avec 06.3** (06/09, au soir), et avec ses appelants : il ne se
créait pas à vide, il fallait que les clôtures du groupe 06 existent. Trois d'entre elles
le portent — la réception confirmée, le compte suspendu, la demande envoyée — et les trois
annonçaient jusque-là par snackbar, c'est-à-dire par la forme réservée à ce qui **n'a rien
changé**.

**Le tri des 168 messages reste entier.** La planche est explicite : *« un message de
90 signes en snackbar n'est pas un message trop long, c'est un tri mal fait. »* Le
produit annonce encore par snackbar des succès qui changent la vue — une réception
confirmée, une demande validée — là où la planche veut le bandeau. C'est une reprise
appel par appel, dans 31 fichiers, et elle se fait avec les écrans qui les portent.

---

## 17.2 — la confirmation prend la forme des pages, la sélection ses quatre écrans

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

**La sélection groupée est portée** (06/09, au soir), sur ses quatre écrans : Tâches,
Catalogue, Actifs, Équipe.

| Élément | Planche | Avant |
| --- | --- | --- |
| Barre de sélection | **56**, intérieur `0 8 0 4` | 72, intérieur `4 8` |
| Le compte | « 1 sur 257 », Archivo 600 **17 sur 24** | « 1 sélectionné » en 28, « sur 257 » en sous-ligne |
| « Tout » | un geste à droite, 48 de haut, 14 sur 20 | un lien souligné dans la sous-ligne |
| La case | `.box` de 40, `.ck` de **24** au rayon 4, filet de 1,5 ; prise, encre pleine | un glyphe carré de la bibliothèque |
| Le pied | grille **`1fr 48px`**, `12 16 16`, au bas de **l'écran** | flex, `12 20`, `sticky` dans un conteneur qui ne défile pas |
| Le débordement | le ⋮ porte les autres actes | un second verbe étiqueté, rogné à 48 px |

**Le défaut de fond : le pied n'était nulle part.** Mesuré à 393 px sur l'inventaire, il
tombait à **y = 1579** — 727 px sous le pli. `sticky bottom-0` ne colle qu'à un conteneur
qui défile, et celui-là ne défile pas : on entrait donc dans un régime de sélection dont
on ne pouvait rien faire. Il est maintenant posé au bas de l'écran, comme la barre du bas.

**Et il prend sa place, il ne s'empile pas dessus.** *« L'écran change de régime ; il ne
gagne pas une couche »* : la barre du haut est remplacée, la navigation cède le bas au
pied d'actes, et la recherche, les partitions et le porte-voix se taisent — sinon la
sélection ajoutait 140 px de chrome et un second palier haut que S3 interdit. La coque et
la liste n'étant pas dans le même arbre, le fait passe par un contexte d'une ligne,
`SelectionRegimeContext`, que seul le gabarit de liste déclare.

**S2 est resserrée** : *« une seule entrée, l'appui long »* (arbitré le 06/09). Le code et
ses commentaires annonçaient encore « deux entrées, dont une écrite dans le menu » — la
règle d'avant l'arbitrage.

**Ce qui reste.**

- **Les titres de confirmation sont encore des questions.** *« Supprimer Latitude 5540 du
  parc ? »* là où la planche veut le verbe seul et le sujet en rangée. C'est une reprise
  de contenu sur onze appels, elle se fait avec les écrans qui les portent.
- **Les actes groupés de la file ne sont pas tranchés.** La planche liste « Valider ·
  Réaffecter · Refuser » pour 03.3, et les dessine dans une feuille de confirmation **sans
  attestation** — quand 17.4 déclare les trois comme des actes attestés. Arbitrer entre
  deux planches n'appartient pas à un portage : la file n'expose donc que **Exporter**,
  qui ne change rien et ne pose pas la question.
- **La suppression groupée du catalogue n'est pas posée** : `deleteCategory` ne regarde
  pas si le type est employé, et supprimer d'un geste dix types qui portent des actifs les
  laisserait sans catégorie. C'est un garde à écrire avant l'acte, pas un bouton à poser.
- Le menu de débordement nomme ses icônes en **Material Symbols**, comme les autres menus
  du produit ; le canon du reste est Phosphor. Changer le contrat de `Menu` est son propre
  lot.

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

---

## 17.3 — l'attente prend la forme de ce qui arrive

*« Le squelette n'a aucune valeur propre »* (passe du 06/09). Il prend la hauteur de la
rangée réelle et la nuance du creux de la page.

| Élément | Planche | Avant |
| --- | --- | --- |
| Rangée de liste | **68**, la mesure de 04.1 | 72 |
| Rangée de file | **56**, la mesure de 03.3 | 64 |
| Nuance | le creux de la page | un gris à lui, le neutre 200 |
| Rayon | 2 | 2 |

Le geste de rangée disparaît aussi du squelette de file : *« une rangée de file ne porte
ni verbe ni ⋮ »* (R15), donc réserver la place d'un bouton qui n'arrivera pas faisait
sauter la ligne à l'arrivée de la donnée — exactement ce que le squelette évite.

Mesuré pendant l'hydratation Firestore, réseau ralenti : rangée de 68, écart de 16,
nuance du creux, rayon 2.

**La règle A4 est tenue là où elle s'applique.** *« Ce qui est déjà connu est déjà
vrai »* : quand une page attend sa donnée, `ListTemplate` garde son en-tête et ne
remplace que les rangées. Le squelette sans en-tête qu'on voit parfois est celui du
**chargement de la route** : à cet instant la page n'existe pas encore, et il n'y a pas
d'en-tête à tenir pour vrai.

**Ce qui reste sur 17.3 : le scan.** La planche ne le dessine pas — *« le scanner est
unique, dessiné dans 04.1 ; 17.3 en reprend deux états tels quels »* — il se porte donc
avec 04.1.

---

## 17.4 — la feuille d'acte remplace le pavé partagé, puis les deux assistants

Le composant `ActSheet` porte les **six blocs** dans leur ordre : l'objet, l'autre partie
quand l'acte en a une, la seule question propre à l'acte, l'attestation, ce que cela
déclenche, le verbe. Le bloc 4 réemploie `Attestation`, qui portait déjà la règle de
06.2 — **le compte décide de la méthode**, jamais un choix au moment du geste.

**Trois actes de la file y passent** : valider une demande, confirmer une réception,
refuser une demande. Les trois fermaient par `SecurityGate`, c'est-à-dire par **un code
administrateur unique et partagé** ; le rapport d'écarts du 05/09 le classait majeur.
C'est désormais le code personnel de celui qui agit, ou sa signature s'il n'a pas défini
de code. Le refus gagne au passage la forme complète : son motif est le bloc 3, là où il
vivait dans une feuille ordinaire sans attestation.

**Les deux assistants sont convertis** (06/09, au soir). `AssignmentWizardPage` (809
lignes) et `ReturnWizardPage` (895 lignes) sont supprimés, avec le gabarit `WizardLayout`
qu'ils étaient seuls à employer. Trois actes de la table les remplacent :
`HandoverActSheet` porte **Remettre**, `ReturnActSheet` porte **Restituer** et
**Réceptionner le retour** — c'est l'objet qui décide lequel des deux s'ouvre, un objet
attribué se rend, un objet en « retour à confirmer » se réceptionne.

**Les deux adresses survivent, elles n'ouvrent plus un écran.** `/wizards/assignment` et
`/wizards/return` restent les cibles des tâches, des fiches et des liens profonds ;
`AppLayout` les lit désormais comme des **actes** et pose la feuille sur la page où l'on
est — la fiche de l'objet quand l'adresse en nomme un, l'écran précédent sinon. C'est ce
que la planche demande, et cela évite de réécrire sept points d'entrée.

**Ce que la planche a ajouté au composant.** `ActSheet` sait maintenant qu'un bloc peut
être *à choisir* : recherche et scan sur une ligne, l'objet demandé en tête et en bleu,
le compte à droite du libellé. Tant qu'un bloc se choisit, la feuille n'a **ni bloc 4 ni
pied** — il n'y a rien à attester. Le scan réemploie `ScanView` (17.3) par
`ActScanOverlay`, et n'accepte qu'un code appartenant à la liste proposée.

**La case « remise immédiate » est devenue l'état « en présence ».** L'assistant
demandait *avant* d'attester si la remise était immédiate, et écrivait alors les deux
attestations d'un coup : la personne était réputée avoir confirmé sans avoir rien signé.
La feuille pose la question **après** — *« Karim confirme-t-il maintenant ? »* — et si le
destinataire est là, il signe sur cet appareil, par signature seulement.

**Deux défauts trouvés à la mesure, et corrigés.** La remise à zéro de la feuille
dépendait de la liste des équipements : la remise modifiait cette liste, l'effet
repartait, et la feuille retombait sur le choix de l'objet **au moment précis** où elle
devait proposer la confirmation en présence. Et l'attestation ne repartait qu'à la
fermeture : le tracé de celui qui remet valait pour celui qui reçoit, si bien que « Il
confirme » était actif avant que quiconque ait signé. `ActSheet` repart maintenant à zéro
**quand le signataire change**, et remonte le bloc entier.

**Vérification, à 393 px, sur le jeu réel.** Mesuré contre les déclarations de la
planche : titre 22/28/600, sous-titre 14/20, corps `12px 20px 0` et gouttière 16, pied en
deux colonnes égales `16px 20px 4px` au-dessus d'un filet, boutons de 48 au rayon 4,
ligne de recherche de 48 et bouton de scan de 48, rangées de choix de 56 à gouttière 12
avec filet entre elles et vignette de 40 au rayon 4, teinte bleue sur l'objet demandé,
rangée choisie de 56 en fond enfoncé, valeur de 48. Le pied était 4 px trop court : il
l'est corrigé pour tout le monde, l'écart datait du portage initial du composant.

**Les quatre entrées rejouées à l'écran** : depuis une tâche (blocs 1 et 2 remplis,
« Plus tard » au lieu d'« Annuler »), depuis la fiche d'un objet attribué (bloc 1 rempli,
verbe « Je rends »), depuis l'accueil (la feuille s'ouvre sur le choix, **par-dessus
l'accueil**), et une remise entière jusqu'au bout — attestation, confirmation en
présence, objet passé « Attribué · réception confirmée » sur sa fiche.

---

## 06.4 — la demande devient une feuille, et sa page disparaît

`NewRequestPage` (251 lignes, plein écran, quatre champs) est supprimée. La planche en
fait *« une feuille sur la page où l'on est »*, avec trois questions dans l'ordre où
elles se décident : **quoi**, **pourquoi maintenant**, **à quel point c'est pressé**.
Comme pour les deux actes de l'inventaire, l'adresse survit — `/tasks/new` reste la cible
du bouton d'accueil — mais elle pose la feuille au lieu d'ouvrir un écran.

| Élément | Planche | Avant |
| --- | --- | --- |
| La forme | une feuille sur la page | une page plein écran |
| Le type | une **feuille de choix**, familles et tuiles de 88 | un menu déroulant |
| L'urgence | **deux crans** — Normale, Urgente | trois, dont un sans effet |
| Le bénéficiaire | une rangée, absente quand on demande pour soi | un sélecteur toujours présent |
| La destination | *« Ce que cela déclenche »*, avant le geste | une note sous le formulaire |
| Après l'envoi | pas d'écran de confirmation | un retour à la file |

**Deux crans, pas trois** : *« le produit n'en distingue pas trois »*. Une demande
« basse » suivait exactement le même chemin qu'une demande normale — le cran ne
choisissait rien.

**La note de bas de feuille se tait quand elle mentirait.** La planche écrit que
*« serveurs, imprimantes et mobilier »* ne sont pas dans la liste : ils appartiennent à un
lieu. Le code filtre bien sur `assignable`, mais **le catalogue chargé les propose tous** —
`DataContext` donne `assignable: true` par défaut à une catégorie enregistrée avant
l'existence du champ, et l'inventaire importé est dans ce cas. La note n'apparaît donc que
si quelque chose est effectivement exclu. **C'est une réparation de donnée à faire dans
Firestore** — poser `assignable: false` sur ces trois types —, pas un défaut de la feuille.

**Trois formes sont montées dans `FormParts`** plutôt que dans la feuille : la rangée de
choix `.pick`, l'échelle courte `.seg` et la tuile `.tile`. Elles viennent des planches et
serviront ailleurs — 17.6 dessine la même feuille de choix, 04.3 la même échelle. Le
contrôle du design system l'exige d'ailleurs : un contrôle natif vit dans
`src/components/ui/**`, pas dans un écran.

**Ce qui reste sur 06.4** : l'état « après l'envoi » — le bandeau *« Demande envoyée »* et
la rangée « Ma demande » sous les équipements du profil. Le bandeau est la **forme 3 de
17.5**, celle qui manquait faute d'appelant ; elle en a un maintenant, et se portera avec
la fiche de la personne.

---

## 16.1 — le service n'est pas un lieu, et l'écran ne montrait rien

*« Un comptage physique compte ce qui est dans un lieu : le périmètre d'une campagne est
un site, ou un local quand le site en a. Le service n'est pas un lieu et ne borne plus
rien. »* (16.1, passe du 03/09.)

L'écran groupait par **service**. Or les objets portent un **département** là où le
référentiel porte un **service** : aucune rangée ne se formait, et l'inventaire physique
s'ouvrait sur *« 0 service · 0 attendu · aucun service ne correspond »*. **Un écran
d'inventaire qui n'affiche aucun lieu ne peut pas être lancé** — c'était une page morte.

| Élément | Planche | Avant |
| --- | --- | --- |
| L'unité d'une rangée | un **lieu** — site, puis local | un service |
| D'où viennent les lieux | des **objets situés** — *« tout actif qui a un emplacement entre dans une campagne »* | du seul référentiel, qui était vide |
| Le périmètre | pays + statut | pays + site + service + statut |
| Le titre | **Inventaire**, 28 sur 32 | « Audit », 22 |
| La vignette | teintée par l'état, épingle ou porte | un glyphe unique, gris |
| La sous-ligne | pays · **N attendus** · N locaux | le site, puis une pastille d'état |

Deux ajouts ont été nécessaires au modèle : **`Equipment.local`** — la salle, l'étage —
que le tableur portait dans sa colonne `Emplacement` et que l'import jetait dans une note
de texte libre ; et la lecture des lieux **depuis les objets**, pas seulement depuis le
référentiel.

**Résultat mesuré** : « Inventaire · 1 lieu · tout le parc · **243 actifs attendus** », une
rangée « Lomé Siège · Togo · 243 attendus » avec son geste « Lancer ». L'écran était vide,
il compte maintenant le parc réel.

**Deux graphies pour un même site** ont été unifiées au passage : les feuilles réseau du
tableur écrivent « Lomé », les autres « Lomé Siège ». L'inventaire en faisait deux lieux à
compter. L'import unifie à l'écriture, et un repli tient les enregistrements déjà en base.

### La passe du 07/09 — les deux niveaux, et le gabarit qui les porte

**17.8 tranche ce que 16.1 laissait ouvert.** La matrice du composant partagé accorde à
16.1 la recherche et le filtre, et lui **refuse** l'action de page et le tri — *« une
campagne d'inventaire a un ordre d'avancement »*. Elle ajoute : *« aucun onglet dans le
corpus »*. L'écran est donc passé sur `ListTemplate`, et son en-tête écrit à la main —
un `<h1>`, une bande de recherche, deux onglets, un bandeau de portée — a disparu avec.
Deux fentes ont été ajoutées au gabarit pour cela : `hero` et `note`.

| Élément | Planche | Avant |
| --- | --- | --- |
| Les niveaux | site → local → équipements, **un par écran** | un seul niveau, et deux onglets |
| Le héro | surface inversée : surtitre, gros chiffre 44, tuiles, jauge, ligne de lecture | un chiffre nu sur le fond de page, puis une carte de quatre chiffres |
| Le périmètre | **pays et statut** | pays, site, service, statut |
| Le geste de pied | aucun — *« la vue ne scanne ni ne clôture, elle désigne le lieu à ouvrir »* | trois libellés, en pied de page |
| L'ordre | l'avancement | aucun tri appliqué, alors que la ligne en annonçait un |

**Une rangée que la planche ne dessine pas, et que le tableur impose.** Sur la fixture de
16.1 chaque objet est dans une pièce ; dans le parc réel, **211 des 243 n'en portent
aucune**. Le second niveau montre donc les neuf locaux *et* le site hors de ses locaux —
sans quoi 87 % du parc sortait de l'inventaire physique sans qu'aucun écran ne le dise.

**Le troisième niveau lisait encore un service.** `AuditDetailsPage` filtrait sur
`item.department` et écrivait `scopeService` dans ses événements ; 16.1, lui, compte
désormais sur `scopeLocal`. La chaîne était rompue au milieu : un scan n'aurait jamais été
compté. `AuditScope`, `AuditScanResolution` (`found_in_place`), `placeMatches` et la
clôture (« retiré du lieu ») ont suivi.

**Deux fautes que seule la mesure a montrées** (relevé du 07/09, un scan posé dans « Salle
serveur ») : le site se lisait comme un périmètre plat, si bien qu'**un scan dans une pièce
déclarait « 242 manquants » sur 243** — la règle « un manquant n'existe pas avant d'avoir
cherché » valait par rangée, pas pour la rangée qui en contient d'autres ; le compte d'un
site s'agrège maintenant de ses lieux, et le même relevé donne « 20 manquants ». Et
`0 % comptés` s'affichait à côté d'`1 trouvé` : en dessous du pour cent, l'écran écrit
`< 1 %`.

**Ce que la réparation Firestore a cassé au passage.** Le nettoyage vidait `rbacRoles`,
`rbacGroups`, `rbacWorkflows` et `rbacAssignments` avec les résidus de démonstration. Ce
sont des **définitions de droits**, pas de la donnée : la base vidée, **toutes** les pages
ont répondu « Accès refusé », sans écran pour rouvrir quoi que ce soit. Deux corrections :
le script ne les efface plus, et le référentiel des droits repart de ses valeurs par défaut
quand le magasin n'en porte aucune — une base sans aucun rôle est une base neuve, pas une
base dont l'administrateur a tout retiré.

---

## Les trois fiches, et le menu contextuel — passe du 07/09

Relevé du commanditaire : *« la page détail équipement, détail user, modèle n'est pas
encore conforme, même le format du menu contextuel de certaines pages n'est pas aligné »*.
Mesuré, il avait raison sur les quatre points.

### Le menu contextuel — `menus.css`, la feuille partagée

Le projet design porte **`screens/menus.css`** : c'est là que le menu est déclaré une
fois pour toutes, et le code en divergeait sur sept valeurs.

| Élément | `menus.css` | Avant |
| --- | --- | --- |
| Le libellé d'une entrée | **16 sur 24** | `text-body-medium`, soit **13 sur 19** |
| L'intérieur d'une entrée | `8 16` | `px-3`, soit 12 |
| La surface | `--surface` | `bg-surface-container`, le creux |
| Le relief | une ombre, **pas de filet** | `shadow-elevation-3` **et** une bordure |
| L'intérieur du menu | `8 0` | `py-1`, soit 4 |
| La largeur | `min-width:236px` | `w-[262px]`, fixe |
| Le glyphe | `--ink2` | la couleur du libellé |
| Le séparateur | pleine largeur, `8 0` | encarté de 8, marge 4 |
| Le rouge | `--on-tint-danger` | `--error`, plus clair |

Trois marches de caractère en moins dans le seul endroit du produit où l'on choisit un
acte du bout du pouce : c'est ce qui se voyait le plus. Corrigé dans `Menu`, donc sur les
huit écrans qui l'emploient d'un coup. `ModelDetailsPage` posait en plus un
`className="w-[262px]"` qui recouvrait la largeur du composant : retiré.

### 04.2, 05.2, 09.2 — les qualifiants sont **dans** le héro

Les trois fiches sortaient leurs repères chiffrés du héro pour les poser en dessous, en
**tuiles teintées à pictogramme**. La passe du 05/09 des trois planches dit l'inverse, et
dans les mêmes mots : *« les repères chiffrés sont des tuiles dans le héro, les mêmes que
09, 10 et 16 »*, *« deux côte à côte, la valeur monétaire en pleine largeur »*, **« pas de
teinte : le chiffre et son libellé suffisent »**. C'est aussi ce que R3 impose — *« trois
métriques au plus, **dans le voile** »*.

`DetailHero` a donc gagné `metricsStyle="qual"` : grille de deux colonnes sur le voile
blanc à 8 %, une tuile pouvant prendre les deux colonnes et se coucher (le prix), une
autre pouvant ouvrir (`.qual > a` de 05.2 : « 1 demande en cours »). Les `TintedTile` des
deux fiches sont parties avec.

Quatre mesures fausses relevées au passage, toutes dans le gabarit partagé :

| Élément | Planche | Avant |
| --- | --- | --- |
| `.ty`, le surtitre | 12 sur 16 | `text-label-small`, **11** |
| `.tid .code`, la barre | 16 sur 20 | 15 sur 20 |
| `.hrow`, la rangée de relation | 20 au-dessus, 16 d'intérieur, titre **17/24** | 8 et 8, titre 15/21 en graisse d'appui |
| `.hrow.three .hk` | intérieur `12 10` à trois de front | `12 14`, où « réparation » se coupe |

### 04.2 — ce que la fiche inventait, et ce qui la tordait

Second relevé du commanditaire : *« la page détail équipement n'est toujours pas corrigée,
elle n'est pas complète, ensuite elle a un gros bug qui tord l'affichage »*. Regardée à
l'écran — pas mesurée —, elle portait quatre fautes, dont deux graves.

**Le produit inventait des faits.** `normalizeEquipmentRecord` remplissait les trois
spécifications manquantes : `os: 'Windows 11 Pro'`, `ram: '16 GB'`, `storage: '512 GB SSD'`
pour tout portable, serveur ou imprimante sans données — **des valeurs fausses données pour
vraies**, que le support aurait lues au téléphone. Et pour tout le reste, la chaîne
littérale `'N/A'` : une borne Wi-Fi affichait trois rangées « Mémoire N/A · Stockage N/A ·
Système N/A », trois lignes pour ne rien dire. 09.2 tranche : *« la fiche refuse d'inventer
quand la donnée manque : "Aucune spécification saisie", **jamais "Processeur standard"** »*.
Un filtre écarte désormais ce que le tableur écrit quand il ne sait pas (« N/A », « - »,
« néant »), les trois champs restent vides, et la carte dit **une** ligne : « Spécifications
— aucune saisie ».

**Ce qui tordait l'affichage : `text-label-small`.** Ce style porte un interlettrage de
`.075em`, juste pour une micro-étiquette **en capitales**. Trois phrases françaises en
minuscules l'empruntaient — la note d'amortissement, le détail d'une rangée de référence,
la ligne d'auteur d'un mouvement — et il les étirait lettre à lettre. Elles passent en
12 sur 16 sans interlettrage. *(49 des 83 emplois de ce style dans le produit ne portent
pas `uppercase` : la même vérification reste à faire ailleurs.)*

**Deux fautes de mesure :** la barre d'amortissement à 100 % tirait le **rouge d'erreur** —
un actif amorti n'est pas une panne, la planche déclare l'orange de la famille d'état ; et
la ligne de renvoi « Amortissement · dans Finances » était un `Button` du système, dont
l'intérieur poussait **le chevron 14 px hors de la carte**, sur le fond de page. Elle
devient la rangée `.more` de la planche : 48 de haut, un filet au-dessus, la destination à
droite en 12, le chevron dedans.

### Le défaut que la mesure ne pouvait pas voir — les fiches en deux colonnes dans le cadre

Troisième relevé du commanditaire, **capture à l'appui** : les trois fiches débordent et
sont incomplètes. Mes vérifications, toutes conduites dans une fenêtre de 393 px, ne
voyaient rien — et pour cause.

`DetailTemplate` déclarait sa requête de mise en page **en constante privée** :
`const TWO_COLUMN = '(min-width: 1280px)'`. Elle échappait donc à
`MOBILE_ONLY_ANSWERS`, la table qui répond aux requêtes de largeur pour le téléphone que
le produit joue, et consultait **la vraie fenêtre**. Sur un écran de bureau, les trois
fiches se mettaient donc en **deux colonnes à l'intérieur du cadre de 393 px** : le héro
sortait du cadre à droite — « 16 mois / de garantie » coupé, « à l'achat » coupé,
« Attribuer » coupé — et la colonne des cartes tombait **entièrement hors champ**. D'où
l'écran vide sous le héro : les cartes existaient, elles étaient à 400 px du bord droit.

Invisible à 393 px, où cadre et fenêtre ont la même largeur. C'est le trou de la mise en
dimension mobile du 06/09, qui tenait sur trois couches : la table, le `tailwind.config`,
et le cadre.

Deux corrections :

- la requête entre dans `MEDIA` sous le nom `twoColumn`, et dans la table des réponses ;
- `useMediaQuery` **ne consulte plus la fenêtre pour une requête de dimension qu'il ne
  connaît pas** : toute requête qui ne parle que de largeur, hauteur ou orientation est
  évaluée contre le 393 × 852. Seules celles qui parlent de l'appareil — le survol, la
  finesse du pointeur — restent lues sur l'appareil. La prochaine constante privée ne
  pourra plus rouvrir le même trou.

**Vérifié dans une fenêtre de 1512 × 945** : le cadre fait 393, rien n'en sort sur aucune
des trois fiches, et les cartes sont revenues.

### La barre des fiches, alignée sur 17.8

Au passage, la barre de `DetailTemplate` divergeait du composant partagé sur quatre
valeurs : intérieur `px-2 py-1` au lieu de `0 8 0 4` (asymétrique — le retour est un carré
de 48 qui porte son air à gauche, le ⋮ à droite n'en a pas), le code en 16 sur 20 au lieu
de **17 sur 24**, et sa sous-ligne en `text-label-small` **plus** un `tracking-[0.03em]`
ajouté par-dessus : l'identifiant technique s'en trouvait étiré deux fois.

*(04.2 écrit bien 16/20 pour son `.code` — mais c'est la seule des quatre planches à barre :
05.2, 09.2 et 16.2 écrivent 17/24, et 17.8 le déclare pour les huit écrans.)*

### La rangée qui débordait — et deux choses qu'elle cachait

Relevé du commanditaire : *« il y a un bug sur la liste équipement, elle déborde »*. Le bug
est de moi, posé la veille : j'avais mis `shrink-0` sur le code de `ListRow`, parce que la
planche l'écrit `flex:0 0 auto`. Elle peut : ses codes tiennent en dix caractères
(`LPT-HQ-01`). Le parc réel en porte de **trente-quatre** —
`Togo-AP55C-A400474CC7A47E7-NEW-BAT` — et un élément qui ne peut pas rétrécir **sort de sa
carte**. Le code porte donc `min-w-0` : l'ordre de cession est tenu autrement, par un type
**borné à 45 %** de la ligne. En `flex-1` (base 0) il disparaissait entièrement dès qu'un
code prenait toute la largeur, et une rangée sans type ne dit plus ce qu'est l'objet.

Une fois le débordement levé, la capture a montré ce qu'il masquait : **les 243 vignettes
étaient des images cassées**. L'import posait une photo d'illustration Unsplash par famille
de feuille — la même image de portable pour les 89 ordinateurs, la même borne pour les
8 points d'accès. Trois défauts en un : ce n'est **pas la photo de l'objet**, le domaine est
**bloqué** par la politique de ressources croisées du navigateur, et une adresse externe
dans une fiche d'inventaire est une dépendance qu'on ne contrôle pas. L'import ne pose plus
rien, et la rangée passe par `Thumbnail`, qui écoute l'échec et rend le **pictogramme de la
catégorie** — celui que 09.1 arrête pour les huit familles.

### 15.1 — l'exercice en cours

L'accueil des finances portait la bonne matière dans une autre grammaire que les quatre
domaines voisins (04, 09, 10, 16), qui écrivent tous le même héro.

| Élément | Planche | Avant |
| --- | --- | --- |
| `.hero` | intérieur `22 / 20 / 20` | 16 |
| `.ty` | 12/16, `.07em`, **capitales** | 12/17, ni l'un ni l'autre |
| `.big` | Archivo **44 / 48**, `-.03em` | **28**, `tracking-tight` |
| ce sur quoi il se compte | une ligne à part, 14/20 | fondu dans un `span` coupé par un `<br>` |
| `.prog` | 6 px sur le voile à 12 %, remplissage vert d'état | **absente** |
| `.pk` | deux faits, un de chaque côté | une phrase |
| les filets | aucun | deux |

La jauge manquait, et c'est le seul dessin qui dise d'un coup où en est l'exercice.

**La carte des postes** : titre de carte en 13 px au lieu de **17/24**, et le montant affecté
rendu dans un `<s>` — **barré**, ce qui dit « annulé » d'un montant qui ne l'est pas. La
jauge tirait le bleu ; la planche déclare le vert d'état, l'orange à l'épuisement.
L'étiquette CAPEX/OPEX était une pastille ronde en 11 px : `.tag` fait 20 de haut, rayon 4,
sur le creux — c'est une étiquette de donnée.

**L'en-tête** passait par `PageHeader`, qui pose un fil d'Ariane « Finances » au-dessus
d'un titre « Finances » et n'a pas l'échelle du palier haut. Il devient le `.top` des autres
domaines — fond de surface, un filet, intérieur `8 / 16 / 12`, titre **28 sur 32** — et la
vue entre dans `adnMobileViews`, sans quoi la coque écrivait « Finances » une troisième
fois au-dessus.

**« Aller à »** remplace « Dernières dépenses ». 15.1 le dit : *« l'accueil du domaine porte
un exercice et **deux destinations** : ses lignes, ses dépenses »*. La carte montrait à la
place un extrait de trois lignes de la page voisine, qu'il fallait lire jusqu'au bout pour
découvrir qu'elle existait. Les deux rangées la nomment et la comptent — « 11 lignes ·
42 700 000 XOF affectés », « 0 écriture ».

### 09.1 — le vide, et la feuille d'ajout

Les deux derniers états de la planche.

**Le référentiel vide portait un bouton que 09.1 ne dessine pas.** Sa colonne 5 est
explicite : *« un seul geste d'ajout, le FAB, le même qu'au repos ; la phrase dit par quoi
commencer »*. L'écran avait un « Créer le premier type » en plein milieu **et** une note de
pied sur l'import — et, pire, **le bouton flottant s'effaçait justement là**
(`!isReferentialEmpty`), c'est-à-dire au seul moment où il est le seul chemin. Le geste
reste donc au même endroit, vide ou non ; la phrase devient celle de la planche, et le
pictogramme les livres plutôt qu'un dossier.

**La feuille d'ajout portait quatre chemins, la planche en déclare trois** — et dans
l'ordre inverse. *Un type* passe en tête : un modèle se range **sous** un type, et l'import
lit des types au catalogue ; commencer par le modèle proposait le second étage avant le
premier. Le quatrième — « des types, depuis un CSV » — sort : 09.1 renvoie cet import aux
Paramètres, *« il demande les clés de la donnée, que personne ne connaît avant d'avoir créé
un type à la main »*.

Chaque chemin reprend sa **vignette teintée** — le type en bleu, le modèle en vert,
l'import en ambre. Les trois portaient le même creux gris et le même glyphe `+` : aucune ne
se reconnaissait avant d'être lue. Mesuré : rangées de 64, gouttière 12, vignettes de 40.

### 04.1 — la rangée de référence, deux mesures

La liste des actifs était déjà sur le gabarit : en-tête 17.8 (titre 28/32, bloc `8/16/12`,
gouttière 12), le scan comme **seule action de page du corpus**, le filtre en feuille avec
ses quatre axes, le bouton flottant et ses trois chemins, la ligne de compte à 12/16. Deux
mesures divergeaient sur `ListRow`, le composant que six listes emploient :

| Élément | Planche | Avant |
| --- | --- | --- |
| `.l1 .c`, le code | **16 sur 24**, sans interlettrage | 17/24 en `-.01em`, la marche des titres de carte |
| `.l1 .ty`, le type | `flex:1`, **aligné à droite**, il s'y coupe | `shrink-0` avec `ml-auto` |

La seconde n'est pas cosmétique : 04.1 pose la règle en toutes lettres — *« le code entier
et le type en petit à droite : **c'est le type qui cède, jamais le code** »*. Avec un type
`shrink-0`, c'était l'inverse — sur `Togo-AP55C-A400474CC7A47E7-NEW-BAT · Borne Wi-Fi`,
le **code** se tronquait pour laisser au type sa place entière, et c'est le code qu'on lit
au téléphone avec le support.

### Les cinq en-têtes, harmonisés — et trois gestes remis à leur place

Suite du relevé du commanditaire, le 07/09. Cinq écrans, cinq corrections.

**Le bouton « Ajouter » que j'avais posé dans l'en-tête du Catalogue était une faute.**
17.8 le dit sans détour : *« une seule action de page dans le corpus : le scan de 04.1.
Partout ailleurs le geste de création vit dans le "+" (17.6) : le gabarit autorise **zéro**
action, et c'est le cas ordinaire. »* Et le Catalogue portait **déjà** son bouton
flottant : j'avais ouvert une seconde porte vers la même feuille.

**Quatre tailles de caractère pour la même barre.** Type et Modèle portaient leur nom
commun en 17/24 ; la fiche d'un site portait un **fil d'Ariane en 14 sur 20** —
« Emplacements › Togo › Lomé Siège » —, trois faits que le héro écrit déjà juste dessous.
Elle dit maintenant **« Site »**, comme les autres. Les cinq en-têtes mesurent : listes
**28/32** (Catalogue, Emplacements), fiches **17/24** (Type, Modèle, Site).

**Trois fiches n'avaient pas de ⋮.** Le type alignait « Modifier » et « Supprimer » en
boutons au bas de son contenu, après trois cartes ; le site posait « Modifier » dans son
héro, où le geste primaire est déjà pris ; et aucun des deux ne suivait la fiche d'un
modèle, qui a son menu depuis le début. Les trois l'ont, avec le même ordre : l'acte
ordinaire, un filet, l'acte destructeur en encre de danger.

**« Ajouter un modèle » vivait en pied de carte**, sous la liste des modèles d'un type, où
il se découvrait après avoir défilé. Il passe au **bouton flottant** (17.6) — d'où une
fente `fab` sur le gabarit de fiche : une fiche qui contient une liste a un acte de
création, et cet acte flotte, comme sur les listes.

**Et la ligne de compte d'Emplacements** vivait dans le contenu, comme celle du Catalogue :
elle remonte dans le bloc fixe.

### 09.1 — l'en-tête du Catalogue, et la rangée de filtres qui n'aurait pas dû exister

Relevé du commanditaire : *« on avait convenu de ne pas avoir de ligne avec les options de
filtre, et que les options seraient directement intégrées et accessibles depuis l'overlay
du filtre. Catalogue n'est pas aligné avec ça. Le header de Catalogue ne l'est pas non
plus. »*

Le Catalogue portait **trois bandes** avant sa première rangée :

| | Ce qu'il avait | Ce que 17.8 déclare |
| --- | --- | --- |
| La barre | 56 px, titre en **20 sur 28** | **un seul bloc**, titre **28 sur 32** |
| La bande | un second bloc, filet propre, recherche et entonnoir | dans le même bloc |
| Les familles | **une rangée de pastilles** qui défile | des **chips dans la feuille de filtre** |
| La ligne de compte | dans le contenu, donc elle défilait | dans le bloc **fixe** |

Le slot des partitions a été retiré du gabarit le 06/09 : *« là où une partition exclusive
existe, elle est en chips dans la feuille de filtre, et la ligne de tri la nomme »* — et
la règle qui le porte est plus large : *« tout ce qui restreint la liste vit dans l'en-tête
ou dans sa feuille, jamais dans le contenu ; l'en-tête est fixe, le contenu défile »*.

Les quatre familles sont donc dans la feuille, en tête de ses trois axes ; le badge de
l'entonnoir les compte ; « Tout effacer » les rend ; et la ligne de compte les nomme —
« 13 types · Informatique · 110 modèles · 243 actifs ». Les deux autres axes de la feuille,
qui étaient des boutons dessinés à la main en 13 px, prennent la pastille partagée.

Mesuré : titre 28/32, bloc `8 / 16 / 12` avec gouttière 12, une seule bande, plus de rangée
de familles. Les barres des deux fiches — le type et le modèle — mesurent 56, intérieur
`0 8 0 4`, code 17/24, **un étage**.

### 18.1 — l'Historique, pour que la rangée mène quelque part

La feuille « Plus » réservait la place d'*Historique* et la laissait vide, avec sa raison
écrite dans le code : *« la page n'existe pas encore, et une rangée qui ne mène nulle part
est pire qu'une rangée absente »*. La règle tenait ; il fallait l'écran. Le commanditaire
a demandé le bouton le 07/09, la page a donc été portée.

Elle prend le gabarit des huit listes (17.8) : titre, recherche « Identifiant, personne,
lieu », entonnoir à badge, ligne de compte. Le journal se lit **groupé par jour** — la
carte `.day`, son titre (« Aujourd'hui », « Hier », puis la date) et son compte —, et
chaque rangée porte **un fait** : la marque ronde de 32 qui dit la nature par le
pictogramme *et* la teinte, le fait en titre, qui l'a posé et par quelle méthode en
sous-ligne, l'heure à droite. Un fait **système** est cerclé sans fond : il n'a pas
d'auteur à teinter.

Les six natures sont **des chips dans la feuille de filtre** (R11, comme 03.3 et 16.1),
avec la période ; jamais des onglets. Et *« rien ne se refait ici »* : une rangée ouvre le
fait, elle ne le modifie pas.

Deux mesures corrigées dans la foulée : le gabarit portant déjà le titre, la vue entre
dans `adnMobileViews` — sans quoi la coque en écrivait un second juste au-dessus ; et le
titre d'une rangée est **le fait**, pas son sujet, sans quoi une connexion s'affichait
« Kafui EKLU » au-dessus de « Kafui EKLU · Connexion réussie ».

### Le menu contextuel — sans pictogramme et sans chevron

Arbitrage du 07/09. Le menu de l'avatar portait trois vignettes pour trois libellés qui se
lisent seuls, et un chevron par rangée dans une liste où **toutes** les rangées mènent
ailleurs : le glyphe n'ajoutait rien au mot, la flèche ne distinguait rien de sa voisine.
Les deux partent. La feuille « Plus » perd ses chevrons pour la même raison — elle garde
ses vignettes, qui distinguent huit destinations entre elles.

### La barre du parc — pourquoi elle n'était pas pleine

Relevé du commanditaire : *« la barre 243 actifs n'est pas pleine, je pense que c'est lié à
certains équipements dont le statut n'est pas défini »*. Deux causes, dont une était bien
celle-là.

**Seize actifs portaient le mot *Autre*.** Le normaliseur d'états le laissait passer tel
quel, sur une décision antérieure : *« rien dans la donnée ne dit lequel des neuf états il
vaut ; le deviner ferait entrer une certitude que la source n'a pas »*. Les seize lignes,
regardées une à une, disent le contraire : ce n'est pas un état, c'est **le choix le moins
engageant d'une liste déroulante**. Trois portent un utilisateur nommé, les treize autres
n'en ont aucun — des écrans, des tablettes, une station d'accueil en réserve. Le porteur
est renseigné, et le produit sait déjà en déduire l'état : c'est exactement ce qu'il fait
pour *Actif*. `autre` se lit donc comme `actif` — **déduire n'est pas deviner quand la
donnée porte de quoi déduire**. Zéro actif non classé après correction.

**La barre n'avait pas de fond.** La planche compte trois états et sa fixture s'y épuise
(7 + 5 + 2 = 14) ; le parc réel n'a aucune raison de s'y épuiser — un actif *retiré* ou
*manquant* n'est ni attribué, ni disponible, ni en réparation. Sans fond, ce reste laissait
un blanc et la barre paraissait inachevée. Elle prend le creux de la page, le même que la
jauge `.wbar` de la carte voisine : il dit « le reste du parc », il ne le peint pas en état.

Et le reste est **nommé état par état** sous les trois compteurs — « 34 retirés,
11 manquants » —, dans l'idiome `.calm` de la carte voisine. « 45 hors des trois états »
aurait demandé d'aller chercher lesquels.

### Le menu de l'avatar — l'identité en tête, et l'aide qui manquait

Le 06/09 j'ai lu *« le menu contextuel de l'avatar ne reprend pas l'avatar »* comme une
consigne — retirer la pastille — alors que c'était **le relevé d'un manque**. Le
commanditaire l'a redit le 07/09 : la ligne d'identité revient, avec la pastille, le nom,
le rôle et son rattachement.

Ce que l'arbitrage du 06/09 écartait vraiment, et qui reste écarté : **« Mon profil »**,
qui n'a pas de page dans ce produit.

**« Aide et support »** était tombée dans la même passe. Elle revient, mais pas sur son
ancienne destination : elle pointait `/documentation/ui-flow-map`, une adresse qu'aucune
route ne sert — le geste ne faisait rien. Elle ouvre désormais le courrier au support
informatique, la seule aide que ce produit possède réellement depuis que le « Centre
d'aide » et ses quatre pavés ont été réduits à une ligne dans Paramètres.

Le menu porte donc : l'identité, **Mon compte · Paramètres · Aide et support**, un filet,
puis la sortie en encre de danger.

### R16 — une barre n'a pas de sous-titre

Relevé du commanditaire : *« on avait convenu dans nos règles que les header ne devaient
pas avoir de sous-titre »*. C'est R16, que 17.8 écrit pour son premier slot — *« 28/32
Archivo, **un seul étage, jamais de sous-titre** »* — et que 05.2 applique aussi à ses
feuilles : *« les feuilles n'ont plus de sous-titre : la phrase passe en tête de corps »*.

La fente `reference` de `DetailTemplate` **était** ce sous-titre, et ses quatre appelants y
mettaient tous un fait que le héro écrit trois centimètres plus bas :

| Écran | La barre disait | Le héro dit |
| --- | --- | --- |
| 04.2 Équipement | `A400474CC7A47E7` | la carte Référence : « Numéro de série · A400474CC7A47E7 » |
| 05.2 Personne | « Utilisateur · Technique » | « UTILISATEUR · TECHNIQUE » |
| 09.1 Type | « Ordinateur portable » | « Ordinateur portable » |
| 06.5 Demande | la catégorie demandée | l'étiquette du héro |

Le second étage désaxait aussi le titre : dans une barre de 56, un bloc de deux lignes
centre son ensemble, pas son titre. La fente est **retirée du gabarit** — pas seulement de
ses appelants — pour qu'un cinquième ne la rouvre pas.

**Mesuré sur les quatre fiches** : barre de 56, **un étage**, titre centré à 28 sur 28.

### Le menu du ⋮ — il s'ouvrait par-dessus la barre

`menus.css` place la liste à `top:52px`, c'est-à-dire **sous** la barre de 56. Le composant
posait `absolute … mt-2` **sans `top`** : une boîte absolue sans `top` prend sa position
statique, et dans un conteneur en `flex` aligné au centre, c'est le haut du conteneur. Le
menu recouvrait donc le titre et le bouton de retour. Il porte maintenant `top-full`.

Et il **allumait sa première entrée** à l'ouverture, quelle que soit la façon dont on
l'ouvrait : au doigt, cette rangée grisée se lit comme un choix déjà fait — et c'est le
premier acte de la liste, souvent le plus engageant. Le clavier garde son point de départ,
le doigt n'en a plus.

### 09.2 — deux gestes que la fiche n'avait pas

Le héro du modèle ne portait **aucun** geste : « Remettre » n'existait nulle part sur cet
écran, et « Modifier » ne vivait que dans le ⋮. La planche pose les deux dans `.hact`, en
deux colonnes égales — le jaune remet une unité disponible, le second modifie la fiche.
Et la barre du haut affichait le nom du modèle *et* sa marque et son type : exactement les
deux lignes que le héro écrit juste dessous. Elle dit maintenant **« Modèle »**, le nom
commun, comme la planche.

---

## 16.2 — la campagne : deux écrans, et un geste qui était mort

*« Le parc du lieu, les écarts en carte de tension, le ⋮ au tap. »* (16.2, passe du
03/09.) La campagne portait la bonne matière — le parc, les puces, les cartes de
décision, la confirmation de clôture — mais rangée autrement que la planche.

| Élément | Planche | Avant |
| --- | --- | --- |
| Le parc et les écarts | **deux écrans**, reliés par la carte de tension | deux onglets côte à côte |
| Ce qui annonce les écarts | `.tens`, carte ambre **en tête du parc**, avec « Trancher » | une puce sur un onglet, et un bandeau en pied |
| Le scan | `.hact` **dans le héro**, le seul jaune de l'écran | en pied de contenu, sous quarante rangées |
| La clôture | dans le **⋮**, et seulement une fois les écarts tranchés | un bouton de pied, remplacé par un bandeau quand elle est bloquée |
| La barre du haut | « Campagne », puis « Écarts » | « Campagne d'audit » et le périmètre en 11 px, redits sous le héro |
| L'actif chez le réparateur | **hors site, justifié** : ni retrouvé ni manquant | compté manquant à la clôture |

**Deux gestes étaient à l'écran sans être atteignables.**

`ScanView` ne dessine « Saisir à la main » que dans son **mode simple** — or la campagne
l'ouvre en **mode lot**, et cette vue ne décode rien par contrat (17.3 : *« la lecture
reste celle que ce produit possède réellement — la saisie du contenu du QR »*). Le seul
moyen d'enregistrer une lecture d'inventaire n'existait donc pas. L'affordance est
remontée hors du ternaire : elle vaut pour les deux modes, comme 17.3 le déclare.

Une fois affichée, elle restait **injoignable** : la vue de scan était posée à `z-50`,
exactement le plan du bandeau de navigation, qui vient après elle dans le document et
passait devant. Le bouton se voyait, et aucun doigt ne l'atteignait. La vue passe à
`z-[90]` — au-dessus du bandeau, en dessous des feuilles (`100`), puisque la saisie
s'ouvre par-dessus le scan qui l'appelle.

**Une fente de plus sur le héro partagé** : `gauge`. La jauge passait par `note`, qui se
rend **après** le geste et sous un filet — l'avancement se lisait donc sous le bouton qui
le fait avancer. Elle se rend maintenant entre les cases et le geste, l'ordre que 16.1 et
16.2 écrivent toutes deux.

**Relevé de bout en bout** (07/09, sur les données réelles) : scan d'un attendu → 1 / 21 ·
5 % ; scan d'un objet enregistré ailleurs → carte de tension « 1 objet non attendu ici ·
Trancher » ; écran des écarts → « Cet actif est enregistré sur Lomé Siège. Il a été trouvé
dans Salle serveur. Vit-il ici ? » → « Il reste là-bas » → la carte devient « 1 écart
tranché · 1 laissé là-bas » ; le ⋮ ouvre alors Exporter, Clôturer, Abandonner ; la clôture
donne « INVENTAIRE PHYSIQUE · CLÔTURÉE ».

---

## 09.2 — la question qu'on pose à un modèle se lit dans le héro

*« Un modèle n'est pas un objet : c'est ce dont on a plusieurs exemplaires, et la question
qu'on lui pose est **combien puis-je en attribuer maintenant**. »* La fiche répondait à
cette question **dans une carte, sous le héro**, avec une phrase pour expliquer la barre :
il fallait descendre pour lire ce que la planche met en premier.

| Élément | Planche | Avant |
| --- | --- | --- |
| Le héro | **le même que la fiche de type** : identité, barre du parc, **trois cases** | un héro à lui, image 52, un compte de 32 |
| L'intérieur du héro | `22 / 20 / 20` | `16 / 16 / 16` |
| L'étiquette | le **libellé** du type — « Ordinateur portable » | sa clé — « Laptop » |
| La répartition | `.split` de 8, collée au-dessus des cases | une carte séparée, plus une phrase d'explication |

`DetailHero` a gagné pour cela un logement de **barre de répartition**, qui se lit avant
les chiffres : la barre donne la proportion d'un coup, les chiffres donnent ensuite
l'exactitude. La carte « Le parc de ce modèle » disparaît — son contenu est monté dans le
héro, et sa phrase expliquait une barre qui n'a pas besoin d'être expliquée.

### Les deux imports, repris à l'échelle de la planche

**Ils étaient déjà un seul composant** — `ReferentialImportTemplate`, partagé par les
modèles et les emplacements —, mais sa forme datait d'une lecture antérieure. Mesuré et
repris :

| Élément | Planche | Avant |
| --- | --- | --- |
| Titre de section | `.sh` — pictogramme **32 teinté**, titre 17 sur 24 | un `h3` de 13 px |
| Le contrat | des **jetons** en chasse fixe, 32 de haut, les requis en bleu | trois rangées : nom, description, mot du contrat |
| Ce qu'il exige | **une phrase** sous les jetons | une description par colonne |
| Le fichier lu | `.pick` — vignette verte, « N lignes · N colonnes », **Changer** | une vignette grise, « N lignes lues », une croix |
| Le décompte | **28 sur 32** et la **proportion en barre** | deux cases de 24, sans rapport entre elles |
| Les verdicts | une liste : numéro de ligne, nom, cause, **carré vert ou rouge** | une liste des seules refusées, sans carré |

**La liste montre la première retenue, puis les refusées.** Tout lister ferait défiler
cinq cents rangées pour trouver les trois qui demandent un geste ; ne montrer que les
refusées laisserait croire que rien n'a été lu. C'est ce que la planche dessine.

Un `title=` posé sur un jeton a été retiré au passage : le contrôle du design system le
refuse — *« l'attribut natif ne se déclenche pas au tap »* —, et ce qu'il portait est
justement ce que la phrase du contrat dit désormais.

**Ce qui reste sur 09.2** : les deux gestes du héro du modèle (« Remettre », « Modifier »)
et sa carte « Référence » — l'amortissement hérité du type, les spécifications absentes.

---

## 09.1 — la passe sobre retire le porte-voix, et rend son héro au type

La planche a été **rejouée le 03/09**, et deux de ses décisions contredisent le portage
antérieur. Elles ont été relevées sur la planche courante, pas sur un lot.

| Élément | Planche | Avant |
| --- | --- | --- |
| En-tête de famille | pictogramme **32 teinté**, nom 17 sur 24, compte 14 sur 20 | un titre de 13 px, sans image |
| Ligne de compte | **12 sur 16** : types, modèles, actifs | un porte-voix Archivo **28** puis une ligne de 13 |
| Rangée de type | `.lrow` **64**, gouttière 12 | la rangée de 04.1 : 68, gouttière 16 |
| Clé de la donnée | **chasse fixe**, et « clé ? » pointillé quand elle manque | Inter, et rien quand elle manque |
| Fiche d'un type | un **héro** : la famille, le nom, **deux cases** — modèles, actifs | pas de héro du tout |

**Le porte-voix de 28 n'est plus dessiné.** Il disait ce que la ligne de compte dit, une
marche plus haut, et poussait la première rangée hors de l'écran. Le tri reste à droite de
cette ligne : 09.1 ne le dessine pas, mais il existe dans le produit et 17.8 lui donne
cette place.

**Le héro de la fiche d'un type est revenu.** Le portage précédent l'avait retiré en
écrivant que *« 09.1 ne dessine pas de héro sur la fiche d'un type »* — c'était vrai d'une
lecture antérieure. La planche courante le dessine, avec exactement deux mesures. Le
compte d'actifs n'est pas une liste, et la règle qui l'interdisait tient toujours : *« les
actifs ne sont pas listés ici, ils sont dans 04.1, et un second inventaire est une seconde
vérité »*. Un chiffre n'est pas un inventaire.

`DetailHero` a gagné pour cela une **forme de mesures en cases** (`.hk` : voile blanc,
rayon 4, valeur 22 sur 28), distincte de la rangée filetée de 04.2 ; et `ListRow` un cran
**dense** (64 · 12), pour les rangées qui portent deux faits courts au lieu de quatre.

**Ce qui reste sur 09.1** : l'état vide du référentiel (*« Le catalogue est vide —
commencez par un type »*), la feuille d'ajout à trois chemins, le geste « Modifier » dans
le héro, le bandeau ambre du type sans modèle, et les partitions qui doivent descendre
dans la feuille de filtre (c'est le reliquat commun de 17.8).

---

## 06.3 — la clôture prend la forme de ce que l'acte laisse

*« La forme d'une clôture dépend de ce que l'acte laisse derrière lui, pas de son
importance. »* Trois questions, trois formes, **classées par coût** — on prend la moins
chère qui suffit.

| Forme | Quand | État |
| --- | --- | --- |
| 1 · l'écran a changé | le sujet est là, tout se met à jour sous les yeux | **portée** — réception confirmée, compte suspendu |
| 2 · l'accusé en ligne | rien de visible n'a changé, l'effet est ailleurs | **portée** — demande envoyée |
| 3 · l'écran de clôture | le sujet a disparu | **reste** — un seul emploi : supprimer un compte |

**Le bandeau existait dans deux planches et dans aucun fichier.** 17.5 le déclarait —
*« la vue a changé → bandeau en tête de page (06.3) »* — et notait qu'il ne pouvait pas
se construire faute d'appelant. 06.4 lui en a donné un, 06.3 lui donne sa forme :
`ClosureBanner`, 56 de haut, intérieur `12 / 16`, rayon 8, gouttière 12, titre 16 sur 24
en 500 et le détail 14 sur 20 sous lui. Mesuré à 393 px sur les deux formes.

**Ce que le bandeau remplace.** Un snackbar annonçait « Demande envoyée », « Compte
suspendu », « Réception confirmée » — c'est-à-dire la **forme 1 de 17.5**, réservée à ce
qui n'a rien changé et n'attend personne. Or ces trois actes changent la vue : la fiche
passe « Attribué », le héro s'éteint, la file gagne une ligne. Les trois snackbars sont
retirés ; le bandeau dit la même chose là où le changement se lit.

**Le geste du bandeau existe quand l'acte se défait ici même.** « Annuler » sous une
suspension réactive sans repasser par une confirmation : redemander l'accord pour défaire
ce qu'on vient de faire est une question de trop. Il n'y en a pas sous une suppression.

**Un défaut trouvé à la mesure.** L'accusé de la demande envoyée est posé **avant** la
navigation qui referme la feuille : le nettoyer à chaque changement de vue l'effaçait à
l'instant où il apparaissait. Il nomme désormais l'écran auquel il appartient, et ne
s'efface qu'en le quittant — ce que la planche demande pour la forme 2, *« il reste
jusqu'à la sortie de l'écran »*.

**Ce qui reste sur 06.3.**

- **La forme 3** — supprimer un compte : le bandeau doit survivre au retour vers la liste,
  et la carte « Où le retrouver » n'existe pas. La suppression vit sur la fiche, le
  bandeau sur la liste : il faut un canal entre les deux, comme celui du régime de
  sélection.
- **« Signaler un écart »** — le contraire d'une confirmation : trois natures, un motif
  obligatoire, l'objet qui reste en attente. **Le magasin n'a pas de signalement** : ni
  entité, ni transition. C'est une écriture à concevoir, pas une feuille à dessiner.
- Les autres emplois de la forme 2 — relance, invitation — annoncent encore par snackbar.
  Ils se reprendront avec leurs écrans.

---

## 06.5 — la demande cesse d'être une rangée qu'on tranche à l'aveugle

*« La rangée de 03.3 suffit pour un oui ; un non, un renvoi ou un abandon se prennent
ici, devant ce qu'on décide. »* Une rangée de demande ouvrait une feuille de détail qui
citait le motif et rien d'autre : on validait ou refusait **sans voir ce que la personne
détient déjà**, ni ce qui est disponible, ni où en est le parcours. C'est-à-dire sans la
donnée qui fait le oui ou le non.

`ApprovalDetailsPage` est un écran, adressé `/tasks/request/:id`, et la rangée y mène.

| Ce que l'écran porte | Qui le lit |
| --- | --- |
| Le héro : l'objet demandé, la personne, l'état et **depuis quand** | tous |
| « Ce qu'il demande » — le motif tel quel, et ce qu'il détient | le manager |
| « Disponibles à *site* » et « Il détient déjà » | l'informatique |
| « La décision » — motif, auteur, **méthode** | une demande close |
| « Le parcours » — trois étapes, et où il s'arrête | tous |

**Les gestes suivent qui lit, pas seulement l'état.** Le manager valide ou refuse.
L'informatique **ne valide pas, elle remet** : son geste ouvre la feuille de remise de
17.4, bénéficiaire et demande connus. Le demandeur, lui, peut retirer sa demande tant que
rien n'est parti — et lui seul.

**Le fil sait maintenant s'arrêter.** `HandoverTrail` n'avait que trois états — fait, en
attente, en retard. Une demande refusée n'est pas « en attente pour toujours » : l'état
`fail` a été ajouté, et les étapes qui suivent un arrêt disent *« n'a pas eu lieu »* au
lieu de faire croire qu'elles attendent. Chaque étape peut aussi porter son glyphe : le
parcours d'une demande nomme ses acteurs — la poignée de main, la personne.

**La trace gagne sa méthode.** `decisionNote` gardait qui et quand, jamais **comment** —
alors que 06.2 réclame les trois et que 06.5 les affiche ensemble. `updateApproval`
accepte désormais `method`, et la feuille d'acte la lui passe.

**Refuser est sombre, pas rouge.** *« Rien d'irréversible »* : le demandeur lira le motif
et pourra redéposer. `ActSheet` reçoit un `confirmVariant` pour cela — le rouge reste à ce
qui ne se défait pas (17.2, C3).

**Vérifié à l'écran**, sur une demande réelle de la file : la rangée ouvre
`/tasks/request/…`, le héro annonce « Attend l'informatique depuis 57 jours », la carte
des disponibles dit honnêtement *« rien de ce type n'est disponible ici »* quand c'est le
cas, le parcours affiche « 2 sur 3 », et « Refuser » ouvre la feuille d'acte dont le verbe
reste inactif tant que rien n'est attesté.

**Ce qui reste sur 06.5** : la rangée de la file **n'a pas encore son verbe en ligne**.
17.4 le décrit — *« taper la ligne change d'écran, taper le verbe ouvre la feuille »* —
mais c'est une reprise de la rangée de 03.3, pas de cet écran.

---

## 17.10 — la borne de 5 Mo, qui n'existait nulle part

La planche l'écrit : *« 5 Mo par fichier, pour toutes les formes »*, et elle note que
**le code n'en portait aucune**. Le rapport d'écarts du 05/09 le relève aussi : *« aucune
taille maximale sur aucun `accept=` »*. Un fichier de cent mégaoctets partait dans la
lecture et l'écran restait sur son attente sans jamais rien dire.

La valeur vit maintenant **une seule fois**, dans `src/lib/fileImport.ts`, avec la
partition et la phrase de refus. Les deux primitives d'import la portent, donc les neuf
emplois aussi.

| Surface | Ce qu'elle fait d'un fichier trop lourd |
| --- | --- |
| La zone de dépôt | l'écarte et l'annonce **sous la zone**, en nommant le fichier et sa taille |
| Le sélecteur caché | ne le remet pas à l'appelant, et rend la phrase par `onReject` |
| Saisie d'un équipement | facture et garantie : snackbar, rien n'a changé à l'écran |
| Feuille d'incident | message **au champ des photos**, là où le choix a été fait |

Le tri des formes suit 17.5 : un champ précis en cause donne un message au champ, un acte
qui n'a rien changé donne un snackbar. La zone annonce aussi sa borne au repos —
« 5 Mo par fichier au plus » — parce qu'une limite qui ne se découvre qu'au refus est une
limite qu'on rencontre toujours trop tard.

Vérifié : un fichier de 6 Mo déposé sur l'import d'annuaire est refusé par
« annuaire-trop-gros.csv fait 6 Mo, au-delà de 5 Mo. »

**Ce qui reste sur 17.10** : les quatre formes de la planche (tabulaire, pièce, photo,
image à recadrer), la feuille de source à deux chemins, et le ⋮ qui remplace ou retire
une pièce — *« aucun bouton “Changer” sur la rangée du fichier »*. Ils se portent avec
les écrans qui les emploient. Le réglage de la borne en 14.1 attend le portage de cette
page.

---

## 17.6 — le vide n'offrait qu'un chemin sur trois

*« Le bouton n'est jamais désactivé et ne disparaît pas au vide »* (17.6), et l'état vide
*« ouvre la même feuille que le bouton, jamais un chemin direct »* (17.1, arbitré le
06/09). Le rapport d'écarts du 05/09 le classait mineur, à tort : le geste du vide
court-circuitait la feuille et n'offrait donc **qu'un chemin sur trois**, au moment
précis où les deux autres servent le plus.

| Liste | Le vide menait à | Il ouvre maintenant |
| --- | --- | --- |
| Actifs | la saisie d'une fiche | la feuille : scanner · saisir · importer |
| Équipe | l'invitation d'une personne | la feuille : inviter · importer un annuaire |

Le bouton flottant, lui, était déjà présent au vide sur les deux listes : cette moitié du
relevé ne se vérifiait plus.

Deux notes de code disaient encore l'ancien ancrage — « 56 de barre + 20 de gouttière »,
« 76 px du bas ». Elles disent la règle du 06/09.

**Vérifié en partie.** L'état vide s'affiche avec son bouton flottant, et le geste du
vide **filtré** ramène bien à la totalité du parc. La branche corrigée est celle du vide
**non filtré**, qu'un inventaire de 257 actifs ne permet pas d'atteindre : elle est lue,
typée et d'une ligne, mais pas vue à l'écran.

**Ce qui reste sur 17.6** : la forme de la feuille de choix — rangées de 56, vignette de
40, sous-ligne, pas de pied, et *« un acte impossible reste, grisé, sa sous-ligne dit la
cause »*. Les deux feuilles portent aujourd'hui des boutons bordés.

---

## Deux écarts de navigation, et la conversion des assistants

**Le retour d'une fiche de modèle rend la catégorie** (rapport d'écarts du 05/09, 09.2).
On descend famille → type → modèle ; remonter d'un modèle jusqu'à la racine du catalogue
fait refaire deux pas à qui n'en avait fait qu'un. Un modèle nomme sa famille, la fiche de
catégorie s'adresse par identifiant : la correspondance se fait dans la fiche du modèle,
et à défaut le retour reste celui que la coque donne. *Appliqué et typé ; le parcours
complet — catalogue, type, modèle, retour — n'a pas été rejoué à l'écran.*

**Les deux assistants ont été convertis le 06/09 au soir**, à la demande du
commanditaire : *« convertis les deux assistants en feuilles d'acte »*. Le détail est en
17.4 ci-dessus. Le lot 28 D4 du rapport d'écarts est clos.

**Trois choix faits en portant, et pourquoi.**

*La liste des disponibles n'est pas restreinte au site.* La planche intitule le groupe
« Disponibles à Lomé Siège ». Filtrer sur le site de celui qui remet retirerait de la
liste des objets que l'inventaire importé place ailleurs, sans lui donner d'autre chemin
pour les atteindre. Le groupe s'appelle « Disponibles », les objets du site de
l'opérateur passent devant, aucun ne disparaît.

*« L'IT du site » est résolu, pas inventé.* La table de 17.4 nomme l'autre partie d'une
restitution ; le modèle ne porte pas de rôle « informatique du site ». On prend
l'administrateur du site de l'objet, à défaut le premier administrateur, et sans aucun
compte administrateur le bloc 2 disparaît plutôt que de nommer quelqu'un au hasard.

*« Plus tard » se déduit de l'objet.* La planche dit *« Annuler, ou Plus tard si l'acte
vient d'une tâche »*, et rien dans l'adresse ne dit d'où l'on vient. Mais un objet « en
attente de remise » ou en « retour à confirmer » **est** une tâche de la file : l'acte
reste dû quoi qu'il arrive dans la feuille, et « Plus tard » y est vrai quel que soit le
point de départ.

**Ce qui n'est pas fait, et se voit.** Le bloc 3 de la remise, *« à partir du »*, est une
valeur en lecture — « Aujourd'hui » — comme sur la planche, qui ne lui donne ni sélecteur
ni affordance. Remettre à une date future n'existe donc toujours pas ; l'assistant ne le
savait pas non plus.


---

## 14.1 — les deux bornes qui n'existaient nulle part, et une barre qui redisait

Paramètres était porté depuis la passe des groupes à filets : quatre groupes au lieu de
onze cartes, la valeur à droite, le réglage qui s'applique au geste. Trois choses
restaient, et deux d'entre elles ne se voyaient qu'en mesurant.

### La barre — R16, et deux tailles au lieu d'une

`SettingsBar` écrivait le même titre à **22/28** sur les six vues, avec, sous lui, le
propriétaire du réglage : *« Paramètres · vous »*, *« Paramètres · l'entreprise »*. C'est
exactement ce que **R16** interdit — *une barre porte un titre, un étage, jamais un
sous-titre* — et le renseignement était déjà donné par le groupe à filets d'où l'on
venait.

14.1 n'écrit d'ailleurs pas la même barre sur ses trois colonnes, et la différence n'est
pas cosmétique :

| | forme | déclaration de la planche | mesuré après |
|---|---|---|---|
| l'index | `.top` — c'est une **liste de destinations** | `h1` 28/32 Archivo 600 `-.02em` | `28px/32px 600 -0.56px` Archivo |
| une sous-vue | `.tbar` — c'est **un réglage ouvert** | `.tid .code` 17/24 `-.01em`, barre `min-height:56px`, `padding:0 8px 0 4px` | `17px/24px 600 -0.17px`, `min-h:56px`, `p: 0/8/0/4` |

L'index rejoint donc la barre des cinq autres listes (Actifs, Catalogue, Emplacements,
Finances, Équipe) et les sous-vues celle des fiches. Aucune des six ne porte plus rien
sous son titre — vérifié à la mesure sur les six.

### Les deux bornes de la passe du 05/09

La planche a reçu le 05/09 deux rangées sous « L'entreprise » que le code n'avait pas.
Toutes deux existaient dans le produit **sans écran pour les régler** :

- **Périodicité de l'inventaire — 12 mois.** Elle n'existait nulle part. « En retard »
  n'avait aucun sens faute de savoir sur quoi : `placeAudit.ts` gagne `enRetard()`, et
  16.1 le dit **dans sa ligne d'ordre** — « 1 lieu · 1 en retard » — et non dans la
  sous-ligne d'une rangée, qui est tronquée et n'aurait rien pu porter de plus.
- **Taille maximale d'un fichier — 5 Mo.** Elle vivait en dur dans `lib/fileImport.ts`,
  dont le commentaire annonçait déjà *« 14.1 la rendra réglable le jour où
  l'organisation le demande »*. Le module garde maintenant la borne courante
  (`getImportLimitBytes`), `DataContext` la repose quand le réglage change, et les neuf
  emplois la lisent au moment de refuser un fichier — sans qu'un composant d'interface
  ait à connaître le contexte de données. Vérifié de bout en bout : régler « 2 Mo » puis
  revenir au sommaire, la rangée lit « 2 Mo ».

Les deux ouvrent une liste de paliers sur le patron déjà en place (« Retenue » + glyphe,
application au geste, aucun bouton d'enregistrement).

### Ce que la mesure a trouvé, et que l'œil aurait laissé passer

En mesurant la largeur **disponible** pour le titre de chaque rangée contre la largeur
**nécessaire** :

| rangée | disponible | nécessaire | |
|---|---|---|---|
| Devise et année fiscale | 171 | 174 | coupée de **3 px** |
| Contacter le support | 88 | 155 | coupée de **67 px** |

Les deux venaient de leur **valeur**, pas de leur titre. « Contacter le support » portait
l'adresse entière en valeur, là où la planche ne met **aucune** valeur sur une rangée qui
mène ailleurs : l'adresse passe en sous-titre. Et « XOF · 1<sup>er</sup> janv. » se
compose comme la planche l'écrit — l'ordinal en exposant — ce qui rend les trois pixels
manquants. Après : la pire rangée a **1 px de marge**, aucune n'est coupée.

Deux écarts de gabarit trouvés au passage, tous deux corrigés sur `RuleGroup` et valables
pour les cinq écrans qui s'en servent :

- **la gouttière d'une rangée valait 16, la planche dit 12** (11.1 `.row{gap:12px}`) ;
- **le titre ne tenait pas sur une ligne** : 11.1 écrit `white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis` sur `.row .t`, et sans lui « Compte et
  sécurité » passait à la ligne dès qu'une valeur un peu longue lui prenait sa place —
  la rangée de 60 px en faisait 98, et les quatre groupes ne tenaient plus dans l'écran.

### Le chevron qui promettait un écran de plus

Les quatre listes de paliers — mois fiscal, méthode d'amortissement, périodicité, borne
de fichier — portaient un `>` sur chaque ligne. Une rangée qui **choisit** n'ouvre rien :
`RuleGroup.Row` reçoit `choice`, et le chevron tombe. C'est la même règle que pour la
feuille « Plus », dont les flèches ont sauté le 06/09 ; l'état retenu était déjà dit par
le glyphe et le mot (I3).

### Une phrase qui mentait

« À propos » portait en note : *« Les éléments de démonstration (équipements,
utilisateurs) sont restaurés à chaque chargement. »* Le jeu de démonstration a été retiré
et le parc est celui du tableur. La note décrivait un produit qui n'existe plus, dans le
dernier écran où l'on puisse se le permettre. Elle est supprimée. Et « Thème » rend sa
phrase de 69 signes à la valeur, comme la planche : `Thème | Clair — identité Neemba`.

**Ce qui reste sur 14.1.** Les rangées à sous-titre long font **84 px** au lieu des 60 de
la planche : le sous-titre passe à la ligne. C'est le prix de porter **et** une valeur
**et** une conséquence sur la même rangée, là où la planche choisit l'une ou l'autre —
« Mon compte » n'y a pas de valeur, « Version » n'y a pas de sous-titre. `min-height`
reste un minimum, et rien n'est coupé ; c'est un écart assumé, pas un défaut de gabarit.


---

## 07.1 — Mon compte, et la carte qui manquait entièrement

`/settings/account` existait, atteint depuis l'avatar (03.1) et depuis « Vous » (14.1).
Il portait trois groupes à filets — *qui est connecté*, *sécurité*, *session* — c'est-à-dire
la forme d'un écran de réglages appliquée à un écran d'actes. 07.1 en donne une autre :
**un héro d'identité, puis une carte par sujet, une rangée par acte**.

### Ce que la mesure a confirmé

| | déclaré par 07.1 | mesuré |
|---|---|---|
| la barre | `.code` 17/24 Archivo | `Mon compte · 17px/24px` |
| une rangée d'acte | `.arow` `min-height:56px` | 60 px, aucune ne grandit |
| le héro | `.av` 56, `.ty` 12/16 `.07em`, `.nm` 28/32, `.md` 14/20 | les quatre présents |

`.card` et `.arow` sont montés en primitive — `components/ui/ActionCard.tsx`. Ce n'est pas
un rangement : la garde DS a refusé le `<button>` tant qu'il vivait dans la page, et elle
avait raison. Une **rangée d'acte** (vignette, chevron, un geste) et une **rangée de
réglage** (`RuleGroup`, une valeur à droite) ne sont pas la même chose, et les confondre
ferait promettre une valeur là où il y a un acte.

### La carte « Prouver une remise » — la promesse que la destination ne tenait pas

`NavigationBar` affichait déjà, sur la rangée « Mon compte » de la feuille « Plus », le
fait *« code PIN à définir »* — le seul fait que 17.7 autorise à remonter jusqu'à la barre.
`DataContext.setUserPin` était écrit, documenté *« 02.2 écran 3 et **07.1 pour soi** »*, et
consigné au journal comme fait de sécurité. **Il n'y avait aucun écran pour l'appeler sur
soi.** La feuille « Plus » annonçait un manque, l'onglet portait le point, et la
destination ne parlait pas du code.

La feuille du code suit 06.2 : six chiffres, `PinField`, la sixième frappe valide seule, et
le refus **garde les chiffres** en disant ce qui ne va pas. Elle ne demande pas l'ancien
code — `setUserPin` ne le vérifie pas, et un champ de plus laisserait croire qu'un code
oublié protège quelque chose. Vérifié de bout en bout : `123456` refusé
(*« Ni une suite, ni six fois le même chiffre »*), puis un code valide accepté, et la
rangée passe de « Définir » à « Remplacer ».

### Trois défauts trouvés en chemin, tous hors de cet écran

- **`DetailHero` perdait sa sous-ligne sous un avatar.** La variante à avatar ne rendait
  pas `subtitle` : un appelant qui passait les deux la perdait en silence. 07.1 est la
  seule planche qui dessine cette ligne sous un avatar (`.md`, 14/20) ; elle est rendue.
- **Le pavé du code n'avait jamais le focus.** `PinField` le prend dans un effet, mais
  `BottomSheet` pose ensuite le focus sur son premier élément atteignable — la croix — et
  React exécute les effets de l'enfant avant ceux du parent. L'écran demandait six chiffres
  avec le curseur sur le bouton de fermeture. La prise de focus attend une image.
  **Vaut pour toutes les feuilles à code**, `Attestation` comprise.
- **`AuthContext.currentUser` est un instantané qui ne relit jamais le magasin.** Poser son
  propre code le laissait invisible à `Attestation`, qui reçoit `signer.pin` depuis
  `currentUser` sur la fiche d'un objet, dans la file et sur une demande : on posait son
  code, l'écran disait « défini », et la remise suivante réclamait une signature.
  `patchCurrentUser` a été ajouté, et `setUserPin` l'appelle quand la personne se modifie
  elle-même.

### Ce que la 2FA a cédé

La rangée « Compte et sécurité » de 14.1 portait un état *« 2FA active / inactive »* lu
d'un `useState` local — inventé à chaque montage, remis à *inactive* au rechargement, et
sans aucun second facteur derrière. Elle porte désormais l'état du **code PIN**, qui est
réel, qui décide de la façon dont une remise s'atteste, et que 05.2 met exactement là
(*« Sécurité et connexion · Code PIN non défini »*). La bascule 2FA de l'ancienne vue est
retirée avec elle.

**Ce qui reste sur 07.1, et pourquoi.**

- **La signature enregistrée** — importée, recadrée, apposée d'elle-même — n'existe pas
  dans ce produit : `Attestation` fait *tracer* la signature au moment de la remise et
  n'en garde rien. La rangée dit donc ce qui est et n'ouvre rien, plutôt que d'offrir une
  porte vers un écran de recadrage qui n'a pas de magasin derrière lui.
- **« Mes sessions »** est absent : il n'y a pas de magasin de sessions. Reste
  « Se déconnecter · de cet appareil seulement », qui est vrai.
- **« Changer mon mot de passe » est un geste mort**, et c'est le point à arbitrer :
  `authService.changePassword` travaille sur `mockAppUsers`, n'écrit **aucun** mot de
  passe — elle ne fait que retomber `MustChangePassword` — et jette d'emblée quand le
  magasin est Firebase. `AuthContext` n'en vérifie d'ailleurs aucun à l'ouverture : la
  session s'ouvre sur l'adresse. La rangée est **conservée telle quelle** — la retirer
  ferait disparaître un contrôle que l'utilisateur croit actif — mais elle ne fait rien,
  et cela doit être tranché plutôt que masqué par une phrase.


---

## 11.1 — Accès : la liste reprend la forme des cinq autres, et deux zéros étaient faux

L'écran était porté sur une lecture antérieure de 11.1 : un titre à 22/28, un champ de
recherche toujours ouvert, deux jetons « Rôles 8 · Groupes 5 », puis **six cartes** rangeant
les rôles par portée déclarée, chacune avec son décompte de permissions et ses encarts
d'analyse. C'est un écran de diagnostic. La passe du 05/09 de la planche en donne un autre,
*« alignée sur 09 et 10 »* : un en-tête de liste, une carte de rôles, une carte qui mène aux
groupes.

### Les jetons étaient une barre d'onglets

17.8 avait relevé qu'il **n'y a pas d'onglets dans le corpus**. « Rôles 8 / Groupes 5 » en
était une, déguisée en facettes — et 11.1 dessine bien **deux écrans de liste**, « Accès »
puis « Groupes », chacun avec son propre en-tête. Les deux sont désormais deux écrans, et
la seconde carte d'« Accès » ne liste pas les groupes : elle y mène (*« 5 groupes · ce qui
s'ajoute aux rôles »*).

Le passage sur `ListTemplate` donne le reste sans l'écrire : en-tête, fente de recherche,
ligne d'ordre, état vide, et le FAB de 17.6 — *« Créer : un rôle, un groupe, affecter une
personne »*, les trois gestes que la planche met sous le bouton et que l'écran offrait en
deux boutons empilés au bas de la liste.

**Les treize en-têtes du produit sont maintenant à la même mesure** : douze listes à 28/32
Archivo, les fiches à 17/24. « Accès » était la dernière à 22/28. La destination change de
nom avec elle — `DESTINATIONS.rbac` disait « Rôles & accès » quand la page dit « Accès ».

### Les deux zéros

- **« 0 affectations »** dans la ligne d'ordre, et le décompte de droite qui montrait le
  nombre de *permissions* d'un rôle. 11.1 met à droite les **porteurs**, sous un en-tête
  qui le dit. Le zéro venait de ne compter que `rbacRoleIds` : un compte porte son rôle de
  deux façons, et sur ce parc **les 59 comptes** passent par l'autre, le champ historique
  `role` que `SYSTEM_ROLE_ID_BY_USER_ROLE` rattache. Mesuré après : *SuperAdmin 1,
  Employé 58*, ce qui est exactement l'état du parc importé.
- **« 0 membre »**, que j'ai introduit puis corrigé dans la même passe : j'avais écrit
  `group.memberIds`, un champ que `RbacGroup` ne porte pas — `?.` l'a laissé passer au
  typage, et le zéro était le même mensonge que celui que je venais de retirer.
  L'appartenance vit dans `User.rbacGroupIds`. Le zéro qui s'affiche maintenant est
  **vrai** : aucun compte du parc n'appartient encore à un groupe.

### Ce que la valeur d'une rangée dit, et sur quel ton

`.v.q` de 11.1 pose la valeur en chasse normale sur l'encre tertiaire : un nombre de
porteurs se lit, il ne se martèle pas. `RuleGroup.Row` reçoit `quiet` pour cela — la
graisser la mettait au même rang que le nom du rôle.

**Ce qui reste sur 11.1.**

- **Le ⋮ « Exporter les accès »** n'est pas posé : il n'existe aucun utilitaire d'export
  dans le dépôt, et une entrée de menu sans destination est un geste mort.
- **Les trois fiches** — les accès d'une personne, un rôle ouvert, un groupe ouvert — gardent
  leur forme actuelle. La planche leur donne un héro à deux tuiles et un geste, et une
  feuille de paliers à radio ; c'est le morceau suivant.
- L'analyse qui vivait dans la liste — le classement par portée, l'encart sur les branches
  en dur, le repli du périmètre global — **n'est pas perdue** : le fait qui comptait, *« la
  portée écrite sous un nom est déclarée, pas appliquée »*, est passé au pied de la carte
  des rôles, où il se lit en une phrase au lieu de six cartes.

---

## 17.1 et 17.3 — l'attente et les portes fermées, portées le 08/09

Les deux planches étaient **à moitié portées** : les composants existaient, mais rien ne
les déclenchait, et un des quatre états avait la mauvaise forme.

### 17.3 — les squelettes existaient et personne ne les voyait

`Skeleton.tsx` porte les trois formes de la planche aux bonnes mesures depuis le 06/09 —
liste 68, file 56 à marque ronde, fiche avec son héro. **Aucun écran ne les montrait.**
`ListTemplate` et `DetailTemplate` n'affichaient un squelette que si la page leur passait
`loading`, et **aucune des treize pages ne le passait**. Le squelette de file
(`SkeletonQueue`) n'avait ainsi jamais été rendu une seule fois.

Deux corrections, toutes deux au niveau du gabarit plutôt qu'aux treize appels :

- **L'attente est un fait de la couche de données**, pas une décision de page : les deux
  gabarits lisent `isHydrating` du `DataContext` et le combinent au `loading` reçu. A5
  tient — `useDelayedPending` ne montre toujours rien avant 300 ms.
- **La forme du squelette suit celle de la liste qu'elle annonce** (A2). `ListTemplate`
  reçoit `skeleton="liste" | "file"` ; Tâches (03.3), Historique (18.1) et Inventaire
  (16.1) déclarent `file`. Ils annonçaient des rangées de 68 pour des rangées de 56 :
  douze pixels de saut par rangée à l'arrivée de la donnée, ce que le squelette est
  précisément là pour éviter.

### 17.1 — le hors-ligne avait la forme que la planche refuse

Trois des quatre états étaient portés : l'erreur d'acte (`InlineError` + « Réessayer »),
la page introuvable et l'accès refusé, tous sur `ScreenState` au canon du 06/09.

**Le quatrième était un bandeau.** La règle 2 dit l'état hors ligne *« dans la forme de
l'état vide : le motif, le titre, la phrase, et l'heure de la dernière lecture »* — et le
produit portait un `OfflineBanner` sous la barre du haut, en cinq endroits. Un bandeau
annonce la coupure sans dire ce qu'on peut encore faire, et il restait affiché par-dessus
un contenu parfois vide.

- `OfflineState` est né dans `ScreenState.tsx` : motif, titre, phrase, et **l'heure de la
  dernière lecture** — qui n'existait nulle part. `DataContext` expose désormais
  `derniereLecture`, posée à chaque fin d'hydratation.
- `ListTemplate` la montre **à la place de l'état vide** quand le réseau manque : sur une
  liste sans rangée, c'est la coupure qu'il faut nommer, pas l'absence de donnée —
  « aucun équipement » serait faux.
- **Les gestes qui écrivent disparaissent** : le bouton flottant des deux gabarits n'est
  plus rendu hors ligne. *Pas grisés, absents* — un bouton barré demande de comprendre
  pourquoi, l'absence ne demande rien (interdit n°8).
- `OfflineBanner` est retiré ; la galerie montre la nouvelle forme.

Mesuré : liste filtrée à vide, en ligne → *« Aucun équipement ne correspond »* ; la même
hors ligne → *« Hors ligne · Ce qui est déjà chargé reste lisible… · Dernière mise à jour
à l'instant. »*, et le FAB a disparu. Le contenu déjà chargé, lui, reste lisible.

### 17.1, règle 4 — l'accès refusé nomme quelqu'un

*« Il nomme qui peut ouvrir la porte : un nom, jamais l'administrateur. »* L'écran ne le
faisait pas, et son propre commentaire disait pourquoi : *« la planche demande un nom, que
cet écran n'a pas »*. Il l'a : il vit sous `DataProvider`. Il prend le SuperAdmin du parc,
à défaut un Admin, et son geste primaire devient **« Écrire à … »**. Sans aucun compte
administrateur, la phrase générique revient — l'écran ne nomme jamais au hasard.

**Ce qui reste sur 17.3** : le squelette ne se voit en pratique qu'au tout premier
chargement, l'hydratation étant terminée avant qu'on atteigne une liste. C'est le
comportement juste, mais il rend la forme difficile à vérifier à l'œil ; les trois formes
se contrôlent dans la galerie du design system.

---

## 17.5 — le retour transitoire : la forme était juste, l'écriture ne l'était pas

La **forme** de la planche était déjà portée, et bien : `Snackbar` rend `messages[0]` et
rien d'autre — *« un seul à l'écran, le suivant attend son tour »* —, la durée est de
4 000 ms sans exception, et les métriques concordent (56 de haut, gouttière 12, intérieur
8 / 14, fond inversé, verbe en jaune de marque à 40 de haut). Le bandeau de 06.3
(`ClosureBanner`) porte la quatrième réponse, celle où la vue a changé.

Ce qui n'était pas porté, c'est la **règle d'écriture**, et elle est mesurable :

> *« Si le message doit être lu en 4 secondes, il fait 60 signes au plus. Au-delà, ce
> n'est pas un retour transitoire — c'est que la question de tri a été mal répondue. »*

Mesure sur les 139 appels à `showToast` du produit : **15 dépassaient la borne**, jusqu'à
89 signes. Et la planche avait raison sur la cause — deux d'entre eux n'étaient pas des
retours transitoires du tout.

### Treize messages raccourcis

Le fait est gardé, ce que l'écran dit déjà est retiré. Quelques exemples :

| avant | après |
|---|---|
| « Le site n'a pas pu être fermé — un local y est rattaché. Déplacez-le d'abord. » (77) | « Fermeture refusée : un local y est rattaché. » (44) |
| « Action refusée: permissions insuffisantes pour ajouter des dépenses. » (68) | « Vous n'avez pas le droit d'ajouter une dépense. » (47) |
| « Prévisualisation indisponible: aucun fichier source enregistré. » (63) | « Aucun fichier à prévisualiser. » (30) |
| « Matériel sélectionné. En attente de validation par le Manager. » (62) | « En attente de validation par le manager. » (40) |

Les deux-points collés — *« Action refusée: »* — sont passés à l'espace française là où le
message était réécrit.

### Deux messages qui n'étaient pas des retours transitoires

Les contrôles d'enregistrement de **04.3** passaient par un snackbar : *« Choisissez un
modèle au catalogue : il porte le type et la marque »* (66) et *« Le numéro de série est le
seul champ que rien ne connaît : lisez-le sur l'étiquette »* (84). Un champ précis est en
cause — c'est la **troisième réponse** de la question de tri, pas la deuxième : le message
va **au champ**. Il s'effaçait au bout de quatre secondes, loin du champ fautif, et il
fallait deux tentatives pour savoir lequel des deux manquait.

`AddEquipmentPage` porte maintenant un état d'erreurs de champ, effacé à la frappe. Mesuré
sur l'écran vivant : enregistrer à vide pose **deux phrases aux deux champs** et
**n'ouvre aucun snackbar**.

### Après la passe

**137 messages, aucun au-dessus de 60 signes**, le plus long à 60 exactement, moyenne 38.

---

## 04.3 — la passe du 05/09 n'était pas descendue dans le formulaire

Les quatre colonnes de 04.3 existent toutes dans le produit : la saisie
(`AddEquipmentPage`), l'import (`ImportEquipmentPage`), l'incident (`IncidentSheet`) et
la sortie du parc (`RetireSheet`). Ce qui manquait, c'est **la passe sobre du 05/09** —
celle qui a retiré les tuiles d'icône et ramené les cartes à 16.

### La tuile de section tombe

`.sh .si{display:none}` est déclaré **à l'identique par 04.3, 04.4 et 05.3**. Le composant
`FormSection` portait encore la tuile : un carré de 32 teinté « par nature » — bleu pour
la référence, vert pour la configuration, orange pour l'achat. Cette nature ne voulait
rien dire : deux formulaires voisins n'attribuaient pas les mêmes couleurs aux mêmes
idées, et un titre de section se lit sans être annoncé par un carré coloré. C'est ce que
09 et 10 font depuis la passe sobre.

L'intérieur de carte passe de **20 à 16** dans le même mouvement, et la précision (`.cs`)
se pose **au bout de la ligne du titre** au lieu de s'empiler dessous.

Dix appels, deux fichiers ; les props `glyph` et `tint` sortent du composant plutôt que de
rester inertes — une fente inutilisée invite à remettre ce qu'on vient d'ôter. Huit
glyphes d'import sont devenus orphelins et partent avec.

Mesuré : `intérieur 16px · gouttière 16px · rayon 8px`, en-tête `min-h 24px`, titre
`17px/24px 500`, **zéro tuile** — et les cinq sections de 04.2 dans l'ordre.

### R16, encore — et cette fois dans un gabarit

Le rendu a montré ce que la mesure ne voyait pas : la barre affichait
*« Nouvel équipement »* **et**, dessous, *« L'identifiant se déduit à l'enreg… »*. Un
sous-titre de 42 signes dans une barre qui en montre une trentaine — tronqué, donc, et
disant ce que l'écran dit déjà sous le champ de série.

Les barres de 04.3 et 05.3 ne portent que leur titre. La fente `subtitle` est retirée de
`FullScreenLayout` **et** de `FullScreenFormLayout`, pas seulement son contenu : c'est la
troisième fois que R16 est enfreinte au même endroit du système, et une fente qui existe
finit par être remplie.

**Ce qui reste sur 04.3** : la sous-ligne du sélecteur de modèle se tronque au téléphone
(« le type et la marque en vi… ») ; la planche la déclare tronquable, mais elle tient dans
son cadre et pas dans le nôtre — à reprendre avec le libellé, pas avec la mesure.

---

## 04.4, premier acte — « Prendre en charge » annonçait ce qu'il n'écrivait pas

Le ⋮ de la fiche d'un objet en réparation proposait **Prendre en charge**. Le geste
posait un retour transitoire — *« Prise en charge de l'intervention enregistrée »* — et
**n'enregistrait rien** : ni le réparateur, ni la date de retour, ni le coût. C'est le
pire des gestes morts, celui qui affirme avoir réussi.

`TakeChargeSheet` porte la première colonne de 04.4, et le modèle gagne les quatre champs
qui manquaient : `repairer`, `repairExpectedReturn`, `repairCost`, `repairTicket`.

### La garantie décide de la route, et le pied nomme ce qui va se passer

*« Prendre en charge ne demande que ce qui ne se déduit pas. »* Le réparateur n'est donc
pas un champ : sous garantie c'est la **marque**, avec enlèvement sur site ; hors
garantie, l'**atelier du site**. Le coût suit la même règle — « pris en charge » d'un
côté, un montant de l'autre — et le verbe du pied change avec lui : **Prendre en charge**
sous garantie, **Demander la validation** hors garantie, parce qu'un montant part alors
en validation avant que quiconque répare.

Sans date de fin de garantie déclarée, l'écran suppose que l'objet **n'est pas couvert** :
se tromper dans ce sens fait passer un montant en validation, tandis que l'inverse ferait
réparer aux frais de personne.

### Une information n'est dite qu'une fois

La planche l'écrit : *« le bandeau porte la garantie, le bloc de conséquences porte la
suite, et rien ne se répète entre les deux »*. Le bandeau ne redit pas le montant ; les
conséquences ne redisent pas l'état de la garantie.

Vérifié au rendu : bandeau vert *« Sous garantie jusqu'au 1ᵉʳ janvier »*, « Qui répare »
déduit sur la marque avec *enlèvement sur site*, coût en lecture *pris en charge*, deux
conséquences, et le pied qui dit **Prendre en charge**. Le premier du mois prend son
ordinal — `toLocaleDateString` rendait « 1 janvier », qui ne se dit pas.

### Une divergence relevée, non tranchée

`.seg` — le segment d'un choix à deux termes — est déclaré **44 de haut, rayon 6, texte 15**
par 04.4 et **36, rayon 4, texte 14** par 06.4. Le composant `Segmented` suit 06.4 ; je
n'ai pas changé de valeur, parce qu'ajouter une troisième mesure serait pire que de garder
la deuxième. §2.26 demande une déclaration par rôle : **à trancher**.

### Un défaut d'outillage, relevé en passant

`tsc` **ne vérifie pas les props JSX** dans ce dépôt : une prop inexistante passée à un
composant ne produit aucune erreur (testé : `zzzInexistant="x"` sur `SubjectRow` passe,
tandis qu'un `const x: number = 'abc'` est bien vu). J'avais inventé deux props en écrivant
la feuille — `tint` sur `SubjectRow`, `text` au lieu de `content` sur `Consequences` — et
seul la relecture les a trouvées. **Le typage ne protège pas les formulaires de ce dépôt** ;
tant que `tsconfig.json` n'a pas `"strict": true`, toute nouvelle feuille se relit à la
main.

**Ce qui reste sur 04.4** : les deux autres colonnes — le **remplacement lié** (et la dette
qu'il crée) et la **réception du retour** (qui la solde) — ainsi que le **fil d'étapes** que
le porteur lit sur sa fiche pendant la réparation.

---

## 04.4, troisième acte — un objet réparé repart chez son porteur

« Clore l'intervention » ouvrait une confirmation qui posait **toujours la même issue** :
l'objet repassait *Disponible*. Deux erreurs dans un seul geste.

**Un retour de réparation n'a pas une issue mais trois**, et elles ne mènent pas au même
endroit : réparé, réparé mais diminué, irréparable. La confirmation n'en offrait aucune —
elle affirmait la première.

**Et un objet réparé repart chez son porteur**, pas au stock. Le renvoyer aux disponibles
oblige à le réattribuer à la main, et pendant ce temps il apparaît libre alors que
quelqu'un l'attend.

### Le porteur était effacé sans être retenu

C'est le défaut de fond, et il était invisible depuis l'écran : `declareIncident` posait
`user = null` en immobilisant l'objet, **sans garder trace de qui le détenait**. À la
réception, le produit ne pouvait donc pas le rendre — il ne savait plus à qui. Le modèle
gagne `repairPreviousUser`, posé à l'immobilisation et vidé à la réception.

L'objet revient alors en **`PENDING_DELIVERY`**, pas en attribution acquise : son porteur
doit confirmer, comme dans toute remise (06.1).

### Les trois crans, nommés par leur conséquence

C'est la grammaire de 04.3 et de 06.1 : un cran dit ce qu'il **fait**. « Irréparable »
n'enregistre donc rien tout seul — il ouvre **Sortir du parc**, motif déjà écrit, et le
verbe du pied devient *Sortir du parc*. Sortir un objet du parc est un acte à part,
irréversible ; il ne se glisse pas dans la fermeture d'une intervention.

La réserve de « réparé, mais diminué » **s'ajoute** à la note de la fiche au lieu de
l'écraser : ce qui y était dit reste vrai.

Vérifié au rendu : les trois crans, le cran pris en rouge, les conséquences qui changent
avec lui, et le pied qui passe de *Réceptionner* à *Sortir du parc*.

### Le typage, encore

Deux valeurs inventées ont passé `tsc` sans un mot : `conditionNote`, un champ qui
n'existe pas sur `Equipment`, et `assignmentStatus: 'PENDING'`, qui n'est pas une valeur
de l'énumération. Seule la relecture des types les a trouvées. C'est le deuxième acte de
suite où cela arrive — voir la note sur `"strict"` plus haut.

**Ce qui reste sur 04.4** : le **remplacement lié** (colonne 2) et son règlement à la
réception, qui demandent un sélecteur d'objet disponible que le produit n'a pas encore ;
et le **fil d'étapes** que le porteur lit sur sa fiche pendant la réparation.

---

## 03.1 — Le tableau de bord, relu sur la passe du 05/09

La planche a été redessinée (carte `2620x2320`, sous-titre « Passe du 05/09 ; bureau
redessiné le 08/09 ») et la page ne l'avait pas suivie. Six écarts, dont deux qui
faisaient dire au produit des choses fausses.

### Ce qui manquait : « Inventaire en cours »

La passe du 05/09 glisse une carte entre « Le parc » et « Types en tension » : le lieu
compté, la part de son parc retrouvée, et la reprise de la campagne. C'est **la seule
carte de l'écran qui mène à un travail commencé** plutôt qu'à une liste, et elle
n'existait pas.

Elle n'existe que **pendant** un comptage — `useCurrentCampaign` : au moins un objet
retrouvé, pas tous. À 0 % il n'y a rien à reprendre, à 100 % plus rien à faire, et une
carte qui réclame un geste quand aucun n'est dû est une carte de trop. Un **écart** s'y
compte comme en 16.1 (les alignements de scan), jamais les manquants : tant que le tour
du lieu n'est pas fini, ce qui n'a pas été vu n'est pas perdu (règle V2).

« Reprendre » ne repasse pas par la vue globale : le renvoi retient le lieu et ouvre le
comptage (16.2) là où il en était. La clé de portée était **écrite en dur dans deux
fichiers** ; elle devient une seule déclaration, `src/lib/auditScope.ts`, parce qu'un
troisième écran la touche désormais.

### Le budget mesurait un rythme qui n'existe pas

La planche pose le repère de `.wbar b` à **67 % au 3 septembre** — la part d'exercice
écoulée — et date sa phrase du jour. Le code comparait à **25 %** toute l'année : au
8 septembre, il annonçait « 25 points sous le rythme **au quart de l'exercice** » sur un
exercice aux deux tiers passé. Le repère suit maintenant le temps, la phrase porte la
date du jour, et sur un exercice qui n'est pas en cours il n'y a **pas** de rythme à
tenir : la jauge reste seule.

Le chiffre de tête devient le **pourcentage**, l'enveloppe passe au libellé (« 72 % · de
42 000 000 XOF consommés ») : un montant engagé ne se compare à rien tant qu'on n'a pas
lu l'enveloppe qui le suit.

### « 243 sur 243 en fin de vie comptable »

Relevé au rendu, hors planche. `calculateLinearDepreciation` rend `progressPercent: 100`
quand le montant amortissable est nul — une valeur de repli devant une division
impossible. Le parc importé porte `purchasePrice: 0` sur ses 243 actifs : la carte
annonçait donc **tout le parc en fin de vie**, jauge pleine. Sans prix d'achat il n'y a
pas de vie comptable, donc pas de fin : la lecture écarte ces actifs. *Le repli à 100 %
reste dans `lib/financial.ts` et sert ailleurs (Finances, fiche d'un actif) — à
arbitrer.*

### Trois écarts de forme

- **Quatre rangées** dans « À traiter » au régime `forte`, pas trois : la planche en
  dessine quatre à 393 comme à 1280. *(Sa colonne mobile écrit « Voir les 14 autres »
  sous quatre rangées d'un total de 17 — l'étiquette d'un dessin à trois. Le bureau, lui,
  est cohérent : quatre rangées, « les 13 autres ». C'est l'étiquette mobile qui est
  restée en arrière.)*
- **Le compte de l'en-tête** n'appartient qu'au gestionnaire : la colonne du porteur n'en
  porte aucun — sa zone ne compte pas, elle montre ce qui l'attend.
- **Une file ne vous nomme pas à vous.** La colonne du porteur l'écrit sans détour :
  « Écran Dell U2722 · livré le 24 juillet », pas « Marc Finance · réception ». Le nom
  disparaît quand c'est le vôtre ; la date de livraison, elle, n'existe pas au modèle
  (`Approval` n'a pas de `deliveredAt`) — la nature seule reste, et l'inventer serait
  pire.

### Deux renvois

« Tout l'historique » **existe** : la page Historique (18.1) a été écrite le 05/09 et le
renvoi que la planche dessine n'est plus mort. Il est réservé à qui peut lire les
rapports — c'est par là que le journal s'ouvre. Le porteur, lui, n'y a pas accès : son
« Tout mon historique » reste sa fiche, qui porte les mêmes faits bornés à lui.

Et la carte « Inventaire en cours » **ne loge pas son état dans `.mo`**, contrairement à
la colonne mobile de la planche. Mesuré à 393 : le libellé prend 180 px, « commencée
hier, 2 écarts » en prend 147, plus 18 de chevron et 20 de gouttières — **365 px pour 329
disponibles**. La rangée tronquait, et ce qu'elle coupait était le nombre d'écarts,
c'est-à-dire ce qui décide d'y retourner. La colonne bureau de la même planche avait déjà
tranché : la phrase passe en `.wnote`, et `.mo` reprend son rôle — le lieu où l'on va,
comme les quatre autres renvois de l'écran. C'est cette résolution qui est portée aux
deux largeurs.

### Une déclaration en double

`Reading` — la mesure de lecture de §2.43 — était **recopiée dans la page**, à
l'identique du composant partagé `components/layout/Reading`. La copie part.

---

## 03.1 (suite) — le menu de compte rejoint les neuf autres

Le menu de l'avatar portait **sa propre boîte** : un voile fixe posé à la main, un bord,
`shadow-elevation-3`, 300 px de large, des rangées séparées d'un filet, `p-2`. Le produit
compte **neuf autres menus contextuels**, tous rendus par `components/ui/Menu`,
c'est-à-dire par `menus.css` — rayon 8, une seule ombre `0 8px 24px rgba(10,25,29,.2)`,
**aucun filet**, intérieur `8 0`, rangées de 48 (56 avec sous-ligne) à `8 16`, séparateur
pleine largeur. Celui-ci était le seul à ne ressembler à aucun autre.

Et le seul sans **navigation au clavier ni sémantique de menu** : pas de `role="menu"`,
pas de `menuitem`, pas de flèches, pas de retour du focus au déclencheur. Il n'avait
qu'Échap, ajouté à la main.

Le contenu ne bouge pas — il vient des arbitrages du 06 et du 07/09 : ni pictogramme ni
chevron sur les destinations, **Aide et support** qui ouvre le courrier plutôt qu'un
centre d'aide inexistant, la sortie détachée par un filet en encre de danger. L'identité
passe dans la **légende** du menu (`.cap`, 12 / 16, encre tertiaire), le seul en-tête que
la feuille partagée déclare ; la pastille qui la précédait n'a pas suivi, elle redisait
l'avatar qui ouvre le menu à 4 px de là. Le rattachement non plus : il vit dans Mon
compte, et une légende de 12 qui passe à la ligne cesse d'en être une.

Mesuré après coup : `role="menu"`, 236 de large, rayon 8, **bord 0**, l'ombre déclarée,
intérieur `8px 0px`, rangées à `8px 16px` en 16 px, un séparateur, Échap referme.

---

## La dimension mobile seule est levée — 08/09

`MOBILE_ONLY` repasse à **`false`** dans ses deux déclarations (`src/constants/breakpoints.ts`
et `tailwind.config.js`). La fenêtre large reprend sa mise en page : le rail plutôt que la
barre du bas, les 122 classes de fenêtre à nouveau vivantes, et plus de colonne de 393 px
centrée sur le bureau — `MobileFrame` ne monte plus `.tk-frame`, c'est le document qui
redevient le conteneur de défilement, ce que `getAppScroller` suivait déjà.

**Ce que la levée ne fait pas :** porter les régimes 00.3 / 00.4 / 00.5. Ce qui apparaît
au-delà de 600 px est l'état où le chantier bureau s'était arrêté le 06/09 — pas la passe
du 08/09. Sur 03.1 en particulier, il manque tout §2.43 bis : la bande de chiffres en
ligne, la file 8/12 et les événements 4/12 à même hauteur, la mosaïque 7/5 · 5/7, le rail
clair à 240 avec ses trois groupes nommés et son pied d'identité.

### Ce que la levée a mis au jour

**Le rail ne tenait pas la fenêtre.** `Sidebar` et `NavigationRail` portaient `h-full`
dans une rangée de hauteur *auto* : `height:100%` n'y vaut rien, et le rail s'arrêtait
sous sa dernière entrée en laissant le fond nu jusqu'en bas. `stretch` l'aurait étiré à la
hauteur du **contenu**, poussant « Déconnexion » loin sous le pli ; les deux prennent donc
`sticky top-0 h-screen` — la hauteur de la fenêtre, et le corps défile dessous, comme
`.side` dans le `.dsk` des planches. Personne ne l'avait vu : sous `MOBILE_ONLY`, aucun
des deux n'était rendu.

**La fiche à deux colonnes fonctionne enfin.** `MEDIA.twoColumn` (≥ 1280) était le piège
relevé le 07/09 : il posait deux colonnes *dans* le cadre de 393, héro tronqué et cartes
hors champ. Sans cadre, il rend ce qu'il devait rendre — héro à gauche, cartes à droite.

Vérifié à 393, 768 et 1512 sur l'accueil, la liste des équipements, les tâches,
l'inventaire physique, les accès et une fiche d'équipement : **aucun débordement
horizontal, aucune erreur console**.

### Ce que la fenêtre large confirme, et qui reste à arbitrer

Le repli `progressPercent: 100` de `calculateLinearDepreciation` ne ment pas qu'au tableau
de bord. Sur la fiche d'un actif importé (prix d'achat 0), « Garantie et valeur » affiche
**« 100 % de la valeur amortie — 0 XOF restent à amortir · À renouveler cette année. »**
C'est le même repli devant une division impossible, sur un second écran.

---

## 00.3 — la coque de bureau : une seule barre pour deux régimes

La levée de `MOBILE_ONLY` a rendu visible une barre latérale que personne n'avait jamais
regardée. Ce n'était pas celle de la planche.

### Ce qui était là

Un **dégradé sombre de 256 px**, dix destinations à plat, sans groupes, sans compte de
tâches, sans pied. 00.1 donne la direction — sobre, claire ; 00.3 donne la mesure :
**264 px sur `--surface`**, un filet à droite, des rangées de 48 au rayon 8, la courante
en creux `--inset`. Au bureau, la seule zone inversée d'un écran reste « À traiter ».

Elle portait aussi **un tiroir modal** — voile, piège à focus, bouton de fermeture — que
plus rien ne montait : au téléphone, le débordement est la feuille « Plus » (17.7). Et
ses props ne correspondaient plus à son unique appelant : `setIsCollapsed` et
`onSettingsClick` étaient déclarées **requises et jamais passées** (le repli plantait au
clic), `isModalMode` valait `true` par défaut — la barre *permanente* rendait donc la
croix du tiroir et une rangée « Déconnexion » que 17.7 range dans le compte. Rien de cela
n'était visible tant que le composant ne s'affichait pas. **`tsc` ne vérifie pas les props
JSX** dans ce dépôt : c'est la quatrième fois cette semaine.

### Le rail *est* la barre repliée

Le produit tenait **deux** composants — `NavigationRail` (80 px, quatre entrées, un
`onMenuClick` requis que personne ne passait non plus) et `Sidebar` — avec deux jeux de
droits et deux réponses à « où suis-je ». 00.3 n'en décrit qu'un : *« le rail s'ouvre »*,
*« la même liste de destinations, debout »*. `NavigationRail` est supprimé ; à `medium`,
la barre est rendue repliée et ne se déploie pas (264 px sur 768 ne laisseraient pas ses
360 px à une colonne, §3 de 00.3).

Le repli à **88** — la mesure du rail — vient de la recherche bureau du 08/09, avec son
raccourci `[` et son état retenu par personne. Replier ne fabrique donc pas une troisième
forme de navigation : cela ramène la barre au régime qui la précède.

### Trois déclarations qui n'en font plus qu'une

- **Où l'on peut aller** (`useNavigationDestinations`). La feuille « Plus » ouvrait
  *Référentiels* sur `canManageInventory`, la barre latérale la même rangée sur
  `canViewManagement || canManageSystem` ; et la latérale ne portait **pas** *Historique*,
  que la feuille porte depuis le 07/09. Le même compte n'avait pas les mêmes chemins selon
  la largeur de la fenêtre.
- **Où l'on est** (`SECTION_OF_VIEW`, dans le registre). Trois tables y répondaient :
  `isNavSectionActive` (un `switch` de onze cas), `resolveBottomNavDestination`, et
  `MORE_SECTION_OF_VIEW`.
- **À quoi ressemble une destination** (`DESTINATIONS[id].glyph`). Les glyphes Phosphor
  vivaient en table privée dans la barre du bas ; la latérale et le rail tiraient un nom
  Material à la place — **deux dessins pour une même destination**, selon la surface.

Et le **menu de la personne** (`useAccountMenu`) : le pied de la barre latérale ouvre
désormais le même que l'avatar de l'accueil, au lieu d'une seconde liste à recopier.

### Mesuré au rendu

Déployée : **264** de large, `--surface`, filet de 1, intérieur `16px 12px`, rangées de
**48** à `8px 12px`, rayon **8**, **14 px**, la courante sur `--inset`. Repliée : **88**,
rangées de **64**, libellé court en **11**. `[` bascule dans les deux sens. Onze
destinations, trois groupes, *Historique* comprise. Aucun débordement horizontal ni erreur
console à 393, 768 et 1512, sur six écrans.

Un mot trop long — « Emplacements » dans 64 px — **se tronque avec son ellipse et
l'infobulle dit le reste**, la règle que la recherche du 08/09 tranche pour toute
troncature. Il ne se raccourcit pas : une destination porte un nom, celui du registre.

### Deux écarts de planche, à arbitrer

1. **La largeur de la barre latérale.** 00.3 déclare `.side{width:264px}` et la recherche
   du 08/09 dit « Sidebar 264 (§2.43) » ; la **colonne bureau de 03.1** en dessine **240**.
   J'ai porté 264 — la référence système prime sur une planche de page —, mais les deux
   documents datent du même jour.
2. **La grille du tableau de bord à 1280.** La carte de 03.1 annonce *« bande de chiffres,
   file 8/12 + événements 4/12 à même hauteur, puis mosaïque 7/5 · 5/7 »* ; la recherche du
   08/09, elle, tranche *« la file de tâches à gauche (7 col./12), les mouvements récents à
   droite (5 col./12) »* et écarte la mosaïque : *« Parc par site, garanties, incidents
   restent des destinations — pas des tuiles »*. Ce n'est pas la même page. **Rien n'est
   porté côté bureau de 03.1** tant que ce point n'est pas tranché.

---

## 04.1 au bureau — le tableau dense (recherche du 08/09, §2)

Les deux formes **coexistent** : cartes et tableau, avec un sélecteur dans le cinquième
slot de 17.8, à droite du tri. **Cartes par défaut sous 1280, tableau à partir de 1280**,
le choix retenu par liste. Sous 840 il n'y a pas de sélecteur : six colonnes sur un
téléphone ne se lisent pas, et l'en-tête n'a pas la place de poser le geste.

Trois pièces neuves : `useListView` (quelle forme, et qui s'en souvient),
`components/ui/DataTable` (le tableau), et un slot `view` sur `ListTemplate`.

### Ce que le tableau tient

- **Rangée de 48**, quand la carte en fait 72 — §2.43 : un écran large mérite *plus de
  rangées*, pas des rangées plus hautes. Les cibles, elles, ne rétrécissent pas : la case
  garde ses 40 × 40 dans une rangée de 48.
- **En-tête figé** au défilement vertical et **colonne de tête figée** à l'horizontal.
  Quand une case de sélection précède le code, **les deux** sont figées — la case à 0, le
  code à 48 ; figer la case seule laisserait le code partir sous elle.
- **Survol et focus se ressemblent** : fond `--inset`, case révélée à gauche, actes
  secondaires à droite. Ce qui se découvre à la souris se découvre au clavier.
- **Troncature** : une ligne, ellipse, infobulle. Les en-têtes ne se tronquent jamais.

Les six colonnes tranchées : Code · Modèle · Porteur · Site / local · Statut · Dernier
mouvement. Mesuré : en-têtes conformes, rangées à **48**, `thead` et colonne de tête en
`sticky`, aucun débordement horizontal ; la bascule fait l'aller-retour et sa mémoire
survit au rechargement ; à 393, ni tableau ni sélecteur.

**Un écart avec la note** : elle prévoit « six colonnes sans troncature » à 990 px, sur
des codes de dix caractères. Le parc réel en porte de trente-quatre
(`Togo-AP55C-A400474CC7A47E7-NEW-BAT`) : le code se tronque, et c'est l'infobulle qui le
rend — le repli que la note déclare elle-même.

### « Dernier mouvement » lisait un champ qui n'existe pas

La colonne annonçait « — » sur les 243 actifs : elle lisait `item.updatedAt`, et
**`Equipment` n'a pas ce champ**. La carte le lit pourtant en repli à trois autres
endroits de la même page (`item.confirmedAt || item.updatedAt`), depuis toujours. La
colonne prend maintenant la plus récente des dates que l'objet **porte réellement** —
remise, confirmation, demande de retour, départ ou retour d'atelier — et dit « jamais »
quand il n'y en a aucune, ce qui est le cas d'un parc importé.

---

## La cause de six mois de props inventées : `@types/react` n'est pas installé

C'est le vrai résultat de cette passe, et il dépasse le portage.

`item.updatedAt` a résisté à `tsc`. En cherchant pourquoi, j'ai sondé le fichier avec des
erreurs délibérées :

| sonde | attendu | obtenu |
| --- | --- | --- |
| `const n: number = 'une chaîne'` | erreur | **erreur** ✔ |
| `const n: number = item.name` (sur `Equipment[]`) | erreur | *rien* |
| `item.zzzInexistant` | erreur | *rien* |

`tsc` lit bien le fichier ; ce sont les valeurs venues de React qui ne sont pas typées.
Vérification : **`node_modules/@types/react` est absent**, `@types/react-dom` aussi, et
`package.json` ne déclare qu'un seul paquet de types, `@types/node`. `react` ne fournit
pas ses propres déclarations.

Conséquence : `import … from 'react'` résout un module **non typé**, donc `useMemo`,
`useState`, `useCallback` rendent `any`, et `React.FC<Props>` ne contrôle **aucune prop**.

C'est l'explication unique de tout ce que `tsc` a laissé passer cette semaine :
`tint` sur `SubjectRow`, `subtitle` au lieu de `hint` sur `OptionRow`, `conditionNote`,
`assignmentStatus: 'PENDING'`, `RbacGroup.memberIds`, `Sidebar` appelée sans ses props
requises `setIsCollapsed` et `onSettingsClick`, `NavigationRail` sans `onMenuClick`, et
`item.updatedAt`. Aucun de ces défauts n'était une inattention de relecture : **le
compilateur ne pouvait pas les voir**.

Ce n'est **pas** l'absence de `"strict"` — c'est l'absence des déclarations de React.
Installer `@types/react` et `@types/react-dom` fera remonter d'un coup une dette
accumulée sur tout le produit ; c'est un arbitrage, pas un correctif, et `npm install`
échoue sur ce partage hgfs (les binaires natifs viennent de Windows). À trancher.

---

## 05.1 au bureau — et une planche qui contredit la note

La colonne bureau de **05.1 a été dessinée le 08/09** (« §2.43 bis, patron de 04.1 :
tableau à cinq colonnes »). Elle et la note de recherche du même jour ne disent pas la
même chose :

| | planche 05.1 | note du 08/09 |
| --- | --- | --- |
| colonne 4 | **Objets** | Actifs portés |
| colonne 5 | **État du compte** | Dernière connexion |

Les trois premières se recouvrent. **La planche l'emporte** : elle est le dessin de
*cette* page, la note décrit un patron général. Et la mesure tranche dans le même sens —
sur l'annuaire réel, « dernière connexion » vaut *jamais* sur les **59 rangées** : une
colonne qui ne distingue personne. L'état du compte sépare l'actif du suspendu, de
l'invité et du partant, et c'est ce qu'on vient chercher dans un annuaire.

La colonne réutilise `accountMark`, la marque que la carte porte déjà : un compte ne
change pas d'état parce qu'on l'a mis dans une colonne.

Mesuré : cinq en-têtes conformes, rangées à **48**, colonne de tête figée, « Objets »
aligné à droite en chiffres tabulaires, aucun débordement ; à 393, ni tableau ni
sélecteur.

**04.1, lui, n'a pas de colonne bureau dessinée** — sa carte ne mentionne aucune passe
bureau. Ses six colonnes viennent donc de la note, seule autorité pour cette page.

### Une destination portait deux noms

La barre latérale déployée disait **« Utilisateurs »** et ouvrait une page titrée
**« Équipe »** : le registre portait `GLOSSARY.USER_PLURAL` en libellé long et « Équipe »
en libellé court. Les trois planches qui nomment cette destination écrivent « Équipe » —
00.3, la barre de 03.1 bureau, et le titre de 05.1. Le registre s'aligne. C'est le même
écart que 11.1 avait fait fermer sur « Accès ».

### La largeur de la barre latérale — l'arbitrage se précise

05.1 écrit « **Sidebar de 240** », comme 03.1. Deux planches de page à 240 contre 00.3 et
la note de recherche à **264**. J'ai gardé 264 (la référence système prime sur une planche
de page), mais la divergence est maintenant systématique, pas isolée : c'est une valeur à
trancher une fois pour les deux familles de planches.

---

## La dette de types, mesurée — 99 erreurs, 28 fichiers

`@types/react` étant absent, on ne savait pas ce que son installation coûterait. Je l'ai
**mesuré sans rien installer** : les deux paquets tirés dans le bac à sable, un
`tsconfig` de sonde qui les mappe par `paths`, et `tsc` lancé dessus. Le dépôt n'est pas
touché.

**99 erreurs, 28 fichiers** — contre 15 aujourd'hui. Deux fichiers en portent 45 à eux
seuls (`TransactionTicketModal`, `AddBudgetModal`). Ce n'est pas « des centaines » : c'est
une dette qu'on solde en une passe.

| code | nombre | ce que c'est |
| --- | --- | --- |
| TS2339 | 58 | une propriété qui n'existe pas |
| TS2322 | 19 | une valeur du mauvais type |
| TS2345 | 8 | un argument du mauvais type |
| autres | 14 | littéraux, conversions |

### Ce que la sonde a trouvé dans mon propre travail

Trois défauts réels, tous invisibles à `tsc` aujourd'hui, tous dans du code écrit cette
semaine :

- **`item.brand` n'existe pas sur `Equipment`** — `brand` vit sur `Model`. La feuille de
  prise en charge (04.4) déduit le réparateur de la garantie : *« sous garantie, c'est la
  marque »*. Elle lisait `item.brand || item.model`, donc **toujours le modèle**. La page
  résout maintenant la marque au catalogue et la passe.
- **`item.repairReason` n'existe pas non plus**, et les deux feuilles de 04.4 l'affichaient
  dans leur sujet. Ce que le modèle porte est un **incident** (04.3) : une issue, des
  photos, un commentaire libre. Le motif lisible est ce commentaire — `motifIncident`.
  Sans commentaire, la feuille se tait plutôt que d'inventer.
- **Trois glyphes hors de l'échelle** — `size={16}` alors que `IconSize` vaut
  `18 | 20 | 24 | 32`. Deux sont dans les colonnes de statut que je venais d'écrire.

Après correction : **93**. Le reste est antérieur — dont sept lectures de
`item.updatedAt`, un champ que `Equipment` n'a pas.

**La sonde est reproductible** : `<scratchpad>/sonde-types/tsconfig.sonde.json`. Elle sert
de garde-fou tant que les paquets ne sont pas installés — c'est le seul moyen actuel de
voir une prop inventée.

---

## Les types de React sont posés — 08/09

`npm install` échoue sur ce partage hgfs (les binaires de `node_modules` viennent de
Windows). Pose **manuelle**, donc :

1. `npm pack @types/react@19 @types/react-dom@19 csstype@^3.2.2` dans le bac à sable ;
2. détar de chaque paquet, puis `cp -r` vers `node_modules/@types/react`,
   `node_modules/@types/react-dom` et `node_modules/csstype` ;
3. deux lignes ajoutées à `devDependencies`, **en préservant les CRLF** du `package.json`
   — écrit en LF, le diff réécrivait les 61 lignes du fichier.

`csstype` n'est pas optionnel : `@types/react` en dépend, et sans lui rien ne résout.

**Ce que ça ne casse pas.** `npm run build` vaut `vite build` : aucun typecheck. `npm run
lint` est eslint seul. Le build vérifié après pose : **✓ built in 41.56s**. `tsc` reste
une porte manuelle, et c'est elle qui passe de 15 à **93**.

### Deux nettoyages dans la foulée — 93 → 71

**`AddBudgetModal` (22 → 0), et un vrai défaut au passage.** `BudgetLine` ne déclarait pas
`id` — un champ que six créations posaient et que trois lectures utilisaient. Les **trois
lignes de départ** du formulaire, elles, n'en avaient pas : `removeLine(undefined)` ne
filtrait rien, `updateLine(undefined)` ne trouvait personne, et React recevait trois clés
`undefined` côte à côte. Le formulaire s'ouvrait donc sur trois lignes **qu'on ne pouvait
ni corriger ni supprimer**. Vérifié après correction : le retrait d'une ligne de départ
fonctionne.

Au passage, `type` a quitté `BudgetLine` : il était posé sur ces trois lignes et **jamais
relu** — à l'enregistrement la nature se recalcule de la catégorie
(`getFinanceTypeFromCategory`). Deux sources pour un fait, dont une morte.

### Ce qui reste : 71, et un mort de 23

Le plus gros bloc est **`TransactionTicketModal` (23 erreurs)** : il n'est **importé nulle
part** — la documentation le dit appelé par `DashboardPage`, qui ne l'importe plus — et il
lit trois clés de `metadata` que **rien n'écrit** dans le produit (`equipmentSnapshot`,
`userSnapshot`, `condition`). C'est un ticket qui ne pourrait afficher que des blancs. Le
supprimer solde 23 des 71 ; c'est une suppression de composant, donc **votre arbitrage**.

Le reste se répartit sur 23 fichiers, deux à sept erreurs chacun — dont les sept lectures
de `item.updatedAt` déjà relevées.

---

## La dette soldée — `tsc` à zéro

93 au moment de la pose des types, **0** à l'arrivée. Ce qui a été trouvé, par nature.

### Des champs qui n'existent pas — dix lectures

- **`Equipment.updatedAt`** (7 emplois) : le tri « par date d'ajout » retombait dessus, et
  deux rangées sur trois y cherchaient une date de mouvement. Le champ n'a jamais existé.
- **`Equipment.service`** (`SiteDetailsPage`) : le compte d'actifs **par local** d'un site
  filtrait sur `item.service` — le champ est `local`. **Tous les locaux affichaient 0.**
- **`Equipment.purchaseDate`** (`ReportsPage`) : la date d'achat vit dans `financial`. La
  boucle qui calcule l'âge du parc ne s'exécutait jamais, et l'âge restait figé à trois ans.
- **`HistoryEvent.userId`** (`ReportsPage`) : le « plus ancien mouvement » d'une personne
  filtrait sur un champ absent — la liste était toujours vide, la date jamais affichée. Elle
  se lit maintenant des rangées du rapport, dont le prédicat est déjà déclaré ailleurs.

### Des props passées à des composants qui ne les acceptent pas

- **`TopAppBar.onMenuClick`** : le rappel ouvrait le tiroir modal de l'ancienne barre
  latérale, qui n'est plus monté. Retiré, avec l'état mort qu'il pilotait.
- **`ConfirmationSheet.icon`** : la feuille d'acte a perdu son cercle-icône de tête — *« il
  illustrait une décision au lieu de la dire »*. L'option lui survivait, et trois appelants
  la posaient encore dans le vide.
- **`Modal.className`** : `Modal` borne par `maxWidth`. Le `max-w-2xl` de l'aperçu d'un
  rapport n'a jamais rien borné.
- **`DetailTemplate.reference`**, **`ListActionFabItem.variant`** : deux props inventées
  dans la galerie du système.

### Des dérives de bibliothèque

- **pdf.js 5** : `disableWorker` n'existe plus dans les paramètres — la clé était ignorée
  depuis la montée de version. Et `page.render` **exige le canevas** en plus de son
  contexte : sans lui, le rendu d'une page en image échoue, c'est-à-dire **le chemin d'OCR
  d'un PDF scanné**.
- **jspdf** : `getNumberOfPages` n'est pas déclaré sur `internal` ; la conversion passe par
  `unknown`, comme TypeScript le demande.

### Le reste

Sept glyphes hors de l'échelle §0.2 (`14`, `16`, `26` — I2 n'en déclare que quatre), une
`Icon` **sans glyphe** qui ne dessinait rien, deux `ScreenState` sans leur pictogramme
(I3), un `.map(buildCsvLine)` qui passait l'**index** comme délimiteur — la deuxième ligne
du fichier exporté changeait de séparateur —, et les littéraux de `mockData` qui perdaient
leur type avant `.map`.

### Vérifié

`tsc` **0** · `eslint src` **0** (les 7 erreurs héritées sont parties avec) · les quatre
gardes du socle vertes · `npm run build` ✓ en 46 s · parcours à 393, 768 et 1512 sur six
écrans sans débordement ni erreur console · les deux tableaux (04.1, 05.1) et le retrait
d'une ligne de budget re-vérifiés au rendu.

**`tsc --noEmit` est désormais un garde-fou utilisable** : c'est ce qui manquait pour
porter le bureau sans écrire de props inventées.

---

## 03.1 au bureau — la grille de §2.43 bis

Arbitré : **la planche**, mosaïque comprise. Retirer quatre cartes au bureau donnerait
moins au grand écran qu'au petit, ce que §2.43 refuse.

### Onze morceaux, deux compositions

Le fond de la reprise n'est pas la grille, c'est la **décomposition**. Les onze morceaux
de l'écran — en-tête, gestes, à traiter, le parc, inventaire, types en tension, état du
parc, budget, mes équipements, garantie, événements — sont nommés **une fois** et composés
deux fois. Une carte qui change de place ne change pas de contenu ; sans cela, il aurait
fallu deux tableaux de bord, et ils auraient divergé au premier correctif.

### Ce que le bureau ajoute

- **`.dhead`** : le prénom en 28/32, la charge en 14/20, **et les deux gestes sur la même
  ligne** à 40 px. **L'avatar disparaît** — au bureau la personne vit au pied de la barre
  latérale, et deux portes vers son compte en feraient une de trop. Cette règle vaut dès
  600 px, où le rail porte déjà la personne.
- **`.bande`** : cinq chiffres en ligne, chacun une porte vers la liste pré-filtrée. Elle
  *reprend* « Le parc » du téléphone au lieu d'ajouter une tuile — *« pas de tuile
  neuve »* — et « Le parc » disparaît donc du corps au-delà de 840. **Sauf « hors
  garantie »** : le produit n'a pas ce filtre, le chiffre est rendu nu plutôt qu'en porte
  morte.
- **`.zones`** à 1280 : la file en 8/12, les événements en 4/12, **quatre lignes chacune**.
- **`.mosaic`** : Budget 7 · Inventaire 5, puis Types en tension 5 · État du parc 7.

### Deux règles que la planche ne pouvait pas écrire

**C'est la file qui donne sa hauteur à la rangée, jamais l'inverse.** La planche dessine
le régime à 17 tâches, où la file est la plus haute. Au **régime vide** — deux lignes —
`align-items: stretch` fabriquait un pan sombre de 400 px pour dire « rien à traiter ». Le
héro garde donc sa hauteur naturelle ; ce sont les événements qui s'étirent, ce que la
planche demande explicitement (*« ils ne descendent plus le long de la page »*).

**Sans campagne, la mosaïque n'a que trois cartes** : l'État du parc prend alors la rangée
entière plutôt que de laisser un trou de cinq colonnes.

### Le piège de l'extraction

Sorti en constante, `inventaire` est **évalué à chaque rendu** — et son `campagne.site`
sur un `null` faisait tomber tout l'écran derrière l'`ErrorBoundary`. Le garde ne peut pas
rester au point d'appel quand le morceau devient une valeur : il est passé dans la
constante. C'est la seule chose que cette décomposition change au comportement, et elle
est corrigée.

### Vérifié

`tsc` **0** · `eslint` **0** · gardes DS vertes · `npm run build` ✓ 53 s · rendus à 393,
768 et 1512, plus un **contrôle au régime chargé** (17 tâches forcées le temps d'une
capture, forçage retiré et vérifié : 0 résidu) — la file à quatre rangées et son « Voir les
13 autres », les événements bornés à sa hauteur avec « Tout l'historique » calé en bas, le
compte 17 sur l'entrée Tâches du rail.

---

## 00.5 — les deux gabarits sans rail

Les deux derniers de la vague : la feuille d'acte et le formulaire plein écran. Ils n'ont
pas de navigation — *« c'est le seul cas du système où elle s'efface »* — et la planche
leur donne **une mesure de contenu qui ne dépend pas de l'écran**.

### La feuille se centre, elle ne s'étire pas

Au téléphone elle monte du bas, pleine largeur, avec sa poignée : une surface qu'on
attrape au pouce. Au-delà de **600** il n'y a plus de pouce, et elle **se centre à 560**,
le voile couvrant tout, rail compris.

**Les blocs ne changent pas** — mêmes champs, même pied, même ordre : *« ce qui change est
l'air autour, pas la feuille »*. C'est la règle des vues de référence, et c'est pourquoi la
bascule tient dans **un seul composant** : `BottomSheet`, et ses **39 emplois** basculent
avec lui.

La poignée disparaît avec le geste qu'elle promettait — on ne fait pas glisser un dialogue.
Échap et le voile referment ; une feuille titrée garde sa croix.

Mesuré : à 393 la feuille fait **393** de large, ancrée en bas, rayon `8 8 0 0`, poignée
présente ; à 1512 elle fait **560**, centrée, rayon **8** partout, sans poignée.

### Le formulaire se mesure, il ne s'élargit pas

*« Une liste gagne des rangées quand l'écran s'élargit, et c'est un gain. Un formulaire n'y
gagne rien : un champ de 680 px pour saisir un numéro de série est plus difficile à viser,
plus difficile à relire, et il fait mentir la hiérarchie. »* Le contenu tenait **1024** ; il
tient **560**, à toutes les largeurs.

**Et le corollaire, celui qu'on oublie : le pied se borne à la même mesure.** Un
« Continuer » collé au bord droit d'un écran de 768 px n'est plus au bout de ce qu'on vient
de lire — il est ailleurs.

`FullScreenLayout` n'a qu'un consommateur, `FullScreenFormLayout` : tous les écrans pleins
du produit sont des formulaires, et la mesure n'a donc pas besoin d'un réglage.

### Un troisième écart de planche

00.3 §4 écrivait **440 px** et un seuil à **840** pour la même bascule ; 00.5, la planche
dédiée à ce gabarit, fixe **560** et le démontre à **768**. J'ai porté 00.5 — c'est elle qui
décrit l'objet — avec le seuil au premier palier du produit, **600**. À arbitrer avec les
deux autres écarts (barre latérale 240/264, grille de 03.1).

### Ce qui reste de 00.5

*« Chaque champ garde la largeur de ce qu'il attend »* — court 200, date 240, nom la mesure
entière. La règle structurante est portée ; l'application champ par champ se fait écran par
écran, et elle n'est pas commencée.

### Vérifié

`tsc` **0** · `eslint` **0** · gardes DS vertes · `npm run build` ✓ · parcours à 393, 768 et
1512 sans débordement ni erreur console · la feuille de filtre de 04.1 et le formulaire de
création mesurés aux deux régimes.

---

## 00.5, seconde moitié — chaque champ garde la largeur de ce qu'il attend

*« Un numéro de série court ne prend pas 560 px, une date en prend 240, un nom prend la
mesure entière. C'est vrai à 393 px, où la contrainte le faisait seule ; cela doit rester
vrai à 768, où plus rien ne l'impose. »*

La règle vit dans le **champ**, pas dans les écrans : `InputField` gagne une `mesure`
— `courte` (200), `date` (240), `pleine` (défaut). Et **`date` se déduit du type** : une
date n'attend jamais autre chose, aucun appelant n'a à le déclarer. Les six champs de date
du produit sont donc mesurés sans qu'on les touche.

`courte` se déclare, parce qu'elle ne se déduit pas : une durée en années, un pourcentage
résiduel, une fréquence en minutes, un prix d'achat, un montant de réparation. Sept
emplois.

Mesuré sur la fiche de création : `purchasePrice` **200**, `warrantyEnd` **240**,
`os` et `supplier` **480** (la mesure entière du contenu de la carte), `serialNumber` 357
— il partage sa rangée avec le scanner. C'est exactement la hiérarchie que la planche
dessine.

**Ce que la règle empêche** : qu'un champ court devienne une invitation à écrire long, que
le pied d'acte s'éloigne du dernier champ, et que la colonne de gauche perde son bord.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes · `npm run build` ✓ · parcours à
393, 768 et 1512 sans débordement ni erreur console.
