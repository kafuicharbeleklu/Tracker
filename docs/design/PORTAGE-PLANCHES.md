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
| 04.1 | Liste équipements | `InventoryPage` | **portée** (mesurée) |
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
| 09.1 | Catalogue | `ManagementPage`, `CategoryDetailsPage`, `AddCategoryPage` | **partiel** — liste et fiche de type reprises à la mesure du 03/09 ; restent le vide, la feuille d'ajout et les partitions |
| 09.2 | Fiche de modèle et imports | `ModelDetailsPage`, `ReferentialImportTemplate` | **portée** — la fiche du modèle et les deux imports, mesurés |
| 10.1 | Emplacements | `LocationsPage`, `SiteDetailsPage` | **porté** |
| 11.1 | Accès | `RbacPage` | **non porté** — refonte, arbitrage en attente |
| 14.1 | Paramètres | `SettingsPage` | **non porté** |
| 15.1 | Finances et rapports | `FinanceManagementPage`, `ExpenseJournalPage`, `ReportsPage` | **non porté** |
| 16.1 | Inventaire — vue globale | `AuditPage`, `placeAudit`, `AuditOverview*` | **portée** — les deux niveaux, le héro, le périmètre à deux axes ; sur le gabarit 17.8 |
| 16.2 | Inventaire — la campagne | `AuditDetailsPage` | **portée** — le parc et les écarts en deux écrans, le scan dans le héro, la clôture au ⋮ |

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
