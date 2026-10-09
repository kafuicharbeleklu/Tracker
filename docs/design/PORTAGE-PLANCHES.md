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
| 00.3 | Les trois régimes | `AppLayout`, les bascules 600 / 840 | **portée** le 08/09 — coque, barre latérale, rail ; mesures reprises par 17.11 le 09/09 |
| 00.4 | Le rail | `Sidebar` repliée (`NavigationRail` supprimé) | **portée** le 08/09 — le rail *est* la barre repliée, 88 |
| 00.5 | Sans rail | `FullScreenFormLayout` (`WizardLayout` supprimé le 06/09 : 17.4 proscrit les assistants) | **portée** le 09/09 — feuille centrée à 560, formulaire borné, chaque champ à sa mesure |

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
| 02.1 | Connexion | `LoginPage` | **portée** le 06/09, mesurée (repos · erreur au champ · mot de passe oublié · lien envoyé) ; filigrane LIVE recalé et teinté le 09/09 |
| 02.2 | Première connexion | `FirstLoginPage` (`#/invite/:jeton`) | **portée** le 06/09 — lot 15 : invitation, mot de passe, code de remise, quatre cas d'échec |
| 03.1 | Tableau de bord | `DashboardPage` | **portée** — repassée le 06/09 sur la passe du 05/09 (carte « Le parc », cartes à 16, rangées sans verbe, image de cartouche) |
| 03.2 | « À traiter » | zone du tableau de bord | porté avec 03.1 |
| 03.3 | Tâches | `TasksPage` | **portée** — la file, la feuille d'une tâche ; **bureau porté le 09/09** : file 7/12, tâche choisie en panneau 5/12, porte vers le détail d'une demande |
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
| 07.1 | Mon compte | `SettingsPage` (`/settings/account`) | **portée** (10/09) — le héro d'identité, les trois cartes d'actes, la feuille de mot de passe et les trois états de la signature, mesurés |
| 09.1 | Catalogue | `ManagementPage`, `CategoryDetailsPage`, `AddCategoryPage` | **portée** — en-tête 17.8, partitions en feuille, vide et feuille d'ajout (07/09) |
| 09.2 | Fiche de modèle et imports | `ModelDetailsPage`, `ReferentialImportTemplate` | **portée** — la fiche du modèle et les deux imports, mesurés |
| 10.1 | Emplacements | `LocationsPage`, `SiteDetailsPage` | **porté** |
| 11.1 | Accès | `RbacPage` | **non porté** — refonte, arbitrage en attente |
| 14.1 | Paramètres | `SettingsPage` | **portée** (10/09) — les cinq groupes à filets, une icône par réglage, ni sous-ligne ni note ; les écrans de réglage derrière |
| 15.1 | Finances — l'exercice | `FinanceManagementPage` | **portée** — l'exercice en cours porté le 07/09, **mesuré et repris le 10/09** ; reste l'écran « Exercices » (le sélecteur en tient lieu) |
| 15.2 | Finances — les lignes | `AddBudgetModal` | **non portée** — les lignes se règlent en modale, la planche en fait une page |
| 15.3 | Finances — les dépenses | `ExpenseJournalPage` | **portée** (10/09) — le journal par mois sur le gabarit 17.8, héro, recherche, filtre en feuille ; l'axe « poste » manque, faute de lien dépense → ligne de budget |
| 15.4 | Finances — la saisie | `AddExpenseModal` | **partielle** — deux modes (fichier, saisie) ; non mesurée contre la planche |
| 15.5 | Finances — les rapports | `ReportsPage` | **non portée** |
| 16.1 | Inventaire — vue globale | `AuditPage`, `placeAudit`, `AuditOverview*` | **portée** — les deux niveaux, le héro, le périmètre à deux axes ; sur le gabarit 17.8. **Bureau porté le 09/09** : bande de chiffres, sites en tableau 8/12, site choisi en panneau 4/12 |
| 16.2 | Inventaire — la campagne | `AuditDetailsPage` | **portée** — le parc et les écarts en deux écrans, le scan dans le héro, la clôture au ⋮. **Bureau porté le 09/09** : campagne 7/12, écarts 5/12 en panneau, « Saisir un code » à la place du scan |
| 18.1 | Historique — le journal | `HistoryPage` | **portée en entier le 22/09** — les six colonnes : le journal par jour (quatre faits par jour, « Voir les n autres »), la feuille à trois axes (nature, période avec l'exercice, **personne ou objet**), **le fait ouvert et sa preuve** (fil des attestations, signature apposée, renvois), **Mon historique** pour le porteur, le vide qui nomme son filtre, le bureau en tableau avec ⋮, tri et rangées au défilement |

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
| 17.11 | Le chrome du bureau (9 écrans) | `Sidebar`, `ListTemplate`, `DetailTemplate`, `DataTable`, `SearchField`, `FacetChip` | **portée aux neuf écrans** (09/09) — barre latérale, en-tête de liste et ligne d'outils, en-tête de fiche, patrons « tableau », « fiche 7/5 » et « deux niveaux ». Restent trois détails, listés plus bas |

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

---

## 17.11 — le chrome du bureau, dessiné le 09/09 et porté le jour même

La vague bureau des 08 et 09/09 a donné une vue à 1280 à neuf écrans, et **chacun
redessinait la barre latérale et l'en-tête dans sa planche**. 17.11 les dessine une fois
et dit ce qui varie : le titre, le compte, le geste de page, les pastilles. Ce qui ne
varie jamais : la barre latérale de 240, les rayons 2 · 4 · 8, et **l'absence de filet**
— entre les chiffres d'une bande, entre les rangées, au bord de la barre latérale.

### La barre latérale : 240, rangée de 40, rayon 4 — et un creux qui n'existait pas

Elle avait été portée le 08/09 d'après 00.3 et la note de recherche : **264**, rangées de
48 au rayon 8, texte 14. 17.11 tranche à **240**, rangée **40**, **13 sur 18**, gouttière
10, rayon **4** — et les colonnes bureau de 03.1, 05.1, 18.1 et 03.3 disaient déjà cela.
Le filet de droite part : *« le fond `--surface` la sépare du canevas, sans filet »*.

Deux choses que seule la mesure a montrées :

- **La rangée courante prenait la mauvaise teinte.** La planche demande `--inset-2`
  (#edeae3) ; le code écrivait `bg-surface-container-high`, qui vaut #f4f2ef. Le pont
  Tailwind ne portait aucune classe pour `--inset-2` — et `bg-surface-muted-strong`,
  écrit dans `ListTemplate` pour le bandeau de provenance, était donc **une classe
  inerte** de plus (cf. `text-text-muted`, 57 emplois, 04/09). Le jeton est déclaré :
  `surface-muted` / `surface-muted-strong`.
- **Toutes les rangées étaient en graisse d'appui**, parce que `Button` pose `font-medium`
  pour tout le monde. La planche ne l'accorde qu'à la courante.

Le rail (88) **garde le compte** — *« le rail garde les icônes et le compte »* — en
pastille au coin de la boîte de 72 × 64 ; il ne le retirait pas seulement, il posait un
filet entre les groupes que la planche ne dessine pas.

### L'en-tête de liste : trois bandes deviennent deux

Au bureau, `ListTemplate` empilait le titre à 20, la bande de recherche du téléphone,
puis la ligne de service. 17.11 rassemble : **`.dhead`** — titre **28 sur 32**, compte à
côté en **13 sur 16**, geste de page à droite — puis **une seule ligne d'outils** :
recherche à **320** (cernée, 40 de haut), pastilles, tri et sélecteur cartes/tableau
poussés à droite. Mesuré à 1512 : en-tête 52 de haut, gouttière 16 ; ligne d'outils
gouttière 12 ; champ 320 × 40 ; cran du sélecteur 40 × 38 ; bouton de page 40, rayon 4.

`SearchField` et `FacetChip` reçoivent pour cela un régime **`dense`** : le téléphone
garde le creux de 48 en 16, le bureau prend le cerné de 40 en 14 (et la pastille en 13).

### Le geste d'ajout ne flotte plus — `pageAction`

*« Rien ne flotte sauf ce qui flotte »* (17.11 : dialogue, menu, infobulle). Le bouton
rond restait posé au-dessus du vide en bas à droite d'un écran de 1512. La page **déclare
maintenant son geste** (`pageAction`), et le gabarit le place : bouton rond au-dessus de
la barre du bas au téléphone (17.6), bouton jaune de l'en-tête au bureau. Une déclaration,
deux placements — au lieu de deux copies, comme c'était déjà le cas pour 04.1 et 05.1.

**Et le scan quitte le bureau** : *« le geste de la caméra reste au téléphone »*. Au
bureau, c'est la recherche qui prend le code.

### Le tableau prend la largeur ; la carte garde ses 960

§2.43 borne la lecture à 960 **et déclare l'exception** : *« un tableau que l'on vient
comparer prend toute la largeur ; ce n'est pas de la lecture, c'est du balayage »*. Le
tableau dense de 04.1 et 05.1 tenait dans les 960 de lecture, **et dans une carte** : il
faisait donc une carte dans une carte, avec 16 px d'intérieur entre les deux, sous une
ligne d'outils large de 1 464. Il prend maintenant le corps entier (1 224 à 1512).

### La fiche : le nom devient le titre, et les colonnes passent à 7/5

`DetailTemplate` gardait au bureau la barre de 56 du téléphone, filet compris, avec le
code en 17. 17.11 en fait un **en-tête de page** : retour en carré de 40, nom en **28 sur
32**, fil (`crumb`) dessous si l'écran est un second niveau, actes et ⋮ à droite, sans
filet. La bascule à deux colonnes prend enfin les proportions de la planche — **7/12 et
5/12** au lieu de 440 px fixes, qui laissaient 760 px à la référence : la colonne qu'on
consulte était plus large que celle où l'on agit.

### 18.1 — le journal en tableau

*« Le patron de 04.1 pour le temps. »* La sous-ligne du téléphone se déplie en trois
colonnes — **Par**, **Attestation**, **Lieu** — et ne garde que le complément du fait ;
l'heure ferme la rangée. **Les jours restent** : `DataTable` reçoit `groupOf`, qui pose
une rangée de séparation de **36** sur le canevas, avec son compte, chaque fois que la
clé change.

### Ce qui reste de 17.11

*(Réglé le même jour — voir « La ligne d'outils, l'export et deux mesures », plus bas :
les pastilles de 18.1 et 03.3, l'export du journal, les trois mesures de 03.1 et le geste
du héro de 16.2.)*

- **« Personne ou objet »**, le troisième filtre que 18.1 pose sur sa ligne d'outils : le
  produit n'a pas cet axe, ni au téléphone ni au bureau. Il se porterait avec le sélecteur
  de personne de la feuille, que la planche dessine et que le code n'a pas encore.

### 03.3 au bureau, et l'écart avec 06.5 — tranché par une porte

17.11 et la colonne bureau de 03.3 posent **la tâche choisie en panneau à droite** —
contexte, deux décisions, puis les portes —, y compris pour une **demande**. Mais 06.5,
portée le 06/09, tranche l'inverse au téléphone : *« la rangée d'une demande ouvre son
détail »*, et ce détail est un **écran** (`ApprovalDetailsPage`), pas une feuille.

Les deux planches veulent la même chose à des endroits différents, et la sortie est celle
que 03.3 dessine elle-même : **le panneau porte des portes**. Au bureau, une rangée de
demande **sélectionne** — le panneau montre le motif, le contexte et les décisions — et
une ligne nommée, « Ouvrir le détail de la demande », mène à l'écran de 06.5, qui garde
le parcours et ce que la personne détient. Au téléphone, rien ne change : la rangée
ouvre le détail.

Le contenu de la feuille est devenu **une fonction, deux logements** (`contenuDeLaTache`) :
la feuille au téléphone, le panneau au bureau, à la croix près — une colonne ne se
referme pas, on y choisit la tâche suivante.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes (`ds:check`, tokens, `cn()`,
encodage) · `npm run build` ✓ · parcours **393 · 768 · 1280 · 1512** sur six écrans
(accueil, actifs, équipe, tâches, historique, inventaire) : **aucun débordement
horizontal, aucune erreur console** · barre latérale, en-tête, ligne d'outils, sélecteur
et tableau **mesurés** au `getComputedStyle` contre les déclarations de 17.11.

> **Un piège de formatage, pour mémoire.** `npx prettier --write tailwind.config.js`
> retire les guillemets des clés d'un seul mot (`'page'` → `page`) — et la garde
> `check-cn-merge.mjs` compte les espacements nommés avec une regex qui ne voit que les
> clés **entre guillemets** : 5 devenaient 2, et la sonde tombait. Le fichier de config
> ne passe pas par Prettier.

---

## Le patron « deux niveaux » — 16.1 et 16.2 au bureau (09/09)

*« Le téléphone empile trois niveaux, un par écran ; le bureau en pose deux côte à
côte »* (16.1). Les deux planches d'inventaire l'écrivent au même endroit : la liste à
gauche, ce que le téléphone ouvrait en second écran à droite — **et cliquer une rangée
sélectionne au lieu de naviguer**.

### Ce que le gabarit reçoit

`ListTemplate` gagne `panel` et `panelRatio` (4 ou 5). Le panneau n'existe **qu'à partir
de 1280**, il disparaît en sélection groupée — la page ne traite plus un sujet, elle en
désigne plusieurs (17.2) —, et il ne défile pas avec la liste : c'est elle qui défile
sous lui.

Une conséquence qu'il fallait tirer : **la mesure de lecture ne s'applique pas à une
colonne**. La liste occupe déjà 7 ou 8 douzièmes du corps ; la borner une seconde fois à
960 laissait un vide entre elle et le panneau dès 1 700 px de fenêtre.

### 16.1 — la bande, le tableau des sites, le site choisi

- **La bande de chiffres remplace le héro** : cinq nombres — attendus, sites et locaux,
  jamais vérifiés, campagnes en cours, écarts relevés — avec le point de couleur de
  l'état qu'ils comptent. Elle **ne suit pas la sélection** : la bande dit où l'on en
  est, le panneau dit ce qu'on regarde.
- **Les sites deviennent un tableau à cinq colonnes** (lieu, attendus, statut, geste),
  rangée 64, la courante en `--inset-2`, la survolée en `--inset`. Le chevron disparaît :
  la sélection le remplace.
- **Le panneau est la colonne 2 de la planche, telle quelle** — même héro, mêmes rangées
  de locaux, même note de pied.

Le calcul a suivi la forme : `AuditOverviewContainer` filtre les sites **en permanence**
et non plus seulement quand aucun n'est ouvert, et il calcule **deux jeux de chiffres**
— ceux du parc pour la bande, ceux du site choisi pour le panneau. Ouvrir un site
n'efface plus la recherche au bureau : elle filtre la liste de gauche, qui reste à
l'écran.

**Un état que la planche ne dessine pas** : tant qu'aucun site n'est choisi, le panneau
porte une invitation d'une ligne. La planche montre toujours un site sélectionné ; faire
apparaître le panneau au premier clic ferait sauter la largeur de la liste sous le
curseur.

### 16.2 — la campagne à gauche, les écarts à droite

- **Les écarts n'ont plus d'écran ni de carte de tension** : ils sont la colonne de
  droite, cartes de décision telles quelles, sous un en-tête de panneau qui dit ce qui
  reste à trancher. *« La file est sous les yeux, c'est elle qui tient lieu d'alerte. »*
- **La clôture dit ce qui la retient**, en pied de colonne : « Clôturer s'ouvrira dans le
  ⋮ une fois les n écarts tranchés » — la phrase que la carte de tension portait au
  téléphone.
- **Pas de scan** (17.11) : au bureau, le héro dit **« Saisir un code »** et ouvre la
  saisie qui accepte aussi le contenu d'un QR. Le geste ne disparaît pas, il change de
  porte — un poste fixe n'a pas de caméra à approcher d'une étiquette.
- **L'en-tête est celui d'une fiche** : retour, le lieu en 28, son fil dessous,
  « Exporter » en acte nommé (il quitte donc le ⋮, où il ferait doublon) et le ⋮ pour
  l'abandon et la clôture.
- **Le local paraît en bout de rangée** : la colonne est assez large pour dire *où*
  l'objet est attendu, et c'est ce qu'on cherche en parcourant un site entier.

`DetailHero` reçoit `actionsInline` : au téléphone le geste s'étire, parce qu'on le vise
au pouce ; au bureau il garde sa mesure — un bouton de 700 px n'est pas plus facile à
viser, il est seulement plus grand que ce qu'il fait.

### Ce qui reste de ces deux planches

- Le héro de 16.2 pose son geste **à droite du sujet** au bureau (grille `1fr auto`) ; le
  produit le garde sous la jauge, à sa mesure. C'est la dernière différence de forme.
- 16.1 garde son entonnoir et sa feuille de périmètre ; la planche les laisse dans
  l'en-tête, ce qui est déjà le cas.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes · `npm run build` ✓ · parcours
**393 · 768 · 1280 · 1512** sur six écrans : aucun débordement, aucune erreur console ·
la sélection d'un site et l'ouverture d'une campagne mesurées à 1512 · le second niveau
du téléphone (site ouvert, retour, héro, rangées) revérifié à 393.

---

## 03.3 au bureau — la file et la tâche choisie (09/09)

Le neuvième écran de 17.11, et le dernier. *« Une boîte de travail se traite sans quitter
la page : cliquer une rangée la sélectionne, le panneau change. »*

- **La file garde ses rangées** (56, marque ronde) et prend 7 douzièmes ; la rangée
  choisie passe en `--inset-2`, comme la rangée courante de la barre latérale.
- **La feuille devient le panneau** — même contenu, à la croix près : une colonne ne se
  referme pas, on y choisit la tâche suivante. Le contenu est désormais **une fonction à
  deux logements**, pas deux copies.
- **La porte vers 06.5** clôt l'écart entre les deux planches : voir la section
  précédente.
- **File vide, pas de panneau** : « Vous êtes à jour » n'a pas besoin d'une colonne qui
  invite à choisir ce qui n'existe pas.

### Ce qui reste de 03.3

Les trois partitions et les natures montent en **pastilles sur la ligne d'outils** dans la
planche ; le produit les garde dans la feuille de filtre (R11), comme au téléphone. Le
gabarit sait déjà les porter — `facets` les rend en pastilles denses — ; c'est la page qui
doit les déclarer, et cela vaut aussi pour 18.1.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes · `npm run build` ✓ · une demande
créée dans la session, puis **sélectionnée dans la file à 1512** : rangée en creux, motif
cité, décision et porte dans le panneau, aucun débordement · le téléphone revérifié à
393 : la feuille s'ouvre comme avant.

---

## La ligne d'outils, l'export et deux mesures — la fin de 17.11 (09/09)

Les quatre détails que la passe précédente laissait ouverts.

### Les axes de filtre montent sur la ligne d'outils — 18.1 et 03.3

Au téléphone, un axe est un **groupe de puces dans la feuille** (R11) : elle a la place de
les montrer toutes, avec leurs comptes, et on les compare avant de choisir. Au bureau la
feuille n'existe pas, et un axe à sept valeurs prendrait la place de la recherche. D'où
`FilterMenuChip` — **la pastille dense de 17.11, dont le geste ouvre au lieu de basculer** :
elle dit ce qui est posé, son menu montre le reste avec les comptes, et elle reste cernée
tant que l'axe est ouvert (une pastille sombre annonce un filtre, et « toutes les natures »
n'en est pas un).

- **18.1** : « Toutes les natures ▾ » et « 30 jours ▾ » remplacent l'entonnoir au bureau.
  L'axe des natures est **multiple** — la feuille du téléphone en pose plusieurs — donc la
  pastille sait dire « 3 natures » plutôt que la première d'entre elles.
- **03.3** : les **trois partitions** deviennent des pastilles à compte (`facets` du
  gabarit), la nature une pastille à menu, et **l'ordre monte à droite** en `sort` — il n'a
  que deux valeurs, il se bascule.

Un défaut est apparu à la mesure : le bandeau « n des m » du gabarit, qui rapporte une
facette au tout, écrivait **« 1 des 0 »** sur la file — ses trois partitions sont
**disjointes**, aucune n'est le tout des autres. `ListTemplate` reçoit `disjointFacets`, et
le bandeau se tait là où il n'a rien à rapporter.

### L'export du journal — 18.1

Acte nommé dans l'en-tête, comme la planche le pose. Il exporte **ce qui est affiché**,
filtres compris : un journal exporté en entier ne répond à aucune question, celui qu'on
regarde en répond une. Six colonnes : date, heure, fait, par, attestation, lieu.

### 03.1 — trois mesures, dont une invisible

L'en-tête du tableau de bord tenait déjà la forme « Vue d'ensemble » (titre 28/32,
sous-titre 14/20, gestes à droite, puis la bande). Trois écarts au relevé :

- ses deux boutons faisaient **48** au lieu de 40 — `h-10` seul ne bat pas le `min-h-12` de
  la taille `md` ; c'est le même piège que le bouton de page des listes ;
- la légende de la bande sortait en **500** : `Button` pose sa graisse à tout ce qu'il
  contient, et `.bande .k` n'en déclare aucune ;
- et la page **n'avait pas de `h1`** — son titre était un `h2`, si bien que le plan du
  document commençait à la deuxième marche.

### 16.2 — le geste du héro remonte à droite du sujet

`DetailHero` reçoit `actionsInline` : le héro passe alors en **grille `minmax(0,1fr) auto`**
— l'identité en colonne 1, le geste en colonne 2 sur la première rangée, **les chiffres et
la jauge en travers** (`1/-1`), exactement comme 16.2 les dessine. Au téléphone rien ne
change : le geste s'étire sous la jauge, où le pouce l'atteint.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes · `npm run build` ✓ · les deux
lignes d'outils **mesurées à 1512** (18.1 : recherche 320, deux pastilles à menu, export ;
03.3 : recherche, nature, trois partitions, ordre à droite) · l'en-tête du tableau de bord
remesuré (titre 28/32, sous-titre 14/20, gestes **40**, bande 22/26 et 12/16 en 400) · le
héro de 16.2 revu à 1512 · parcours **393 · 768 · 1280 · 1512**, aucun débordement, aucune
erreur console.

---

## Lot 28 — la signature enregistrée, et un seul pavé (09/09)

Premier des cinq bons de travail 28 à 32 (`PROMPT-LOTS-28-32.md`). *« Importer, recadrer et
garder une signature ; quand le code PIN vaut, l'apposer d'elle-même comme preuve
visuelle. »* Planches 07.1, 17.4, 17.10.

### D4 — un seul pavé, et il est personnel

`SecurityGate` et son `ADMIN_PIN` sont **supprimés**. Un code administrateur unique, écrit
en clair et connu de toute l'informatique, prouvait seulement que *quelqu'un* de l'équipe
avait tapé le secret d'équipe : il ne disait pas qui. Ses deux appelants (03.1, 03.3)
étaient déjà passés à la feuille d'acte lors de la passe sobre ; il ne restait que le
composant, mort, et sa fonction de vérification.

**Deux actes reçoivent le bloc 4** qui leur manquait : **déclarer un incident** et **sortir
du parc**. Ce sont deux des neuf actes de 17.4 — le premier retire un objet à quelqu'un, le
second le retire au parc — et ni l'un ni l'autre ne demandait de preuve. Le verbe reste
éteint tant que l'attestation n'est pas faite.

### D1 — le service, et le type qui manquait

`services/signatureService.ts` : **IndexedDB** (`tracker_signatures`, un `Blob` PNG par
personne), et **la seule porte** vers le stockage — `get`, `getSavedAt`, `save`, `remove`.
Une image ne va pas dans `localStorage` : en base64 elle pèse un tiers de plus, dans un
quota partagé, relue en synchrone au démarrage. `User.signatureId` dit qu'elle existe ;
l'image, elle, reste hors de la fiche — 61 fiches à 300 Ko feraient 18 Mo par lecture
d'annuaire.

`AttestationMethod` **quitte le composant pour le domaine** (`types/`) et gagne une
troisième valeur : `pin+signature`. Ce n'est pas une méthode de plus, c'est le code qui a
autorisé l'apposition. Son libellé est nommé une fois (`LIBELLE_ATTESTATION`) — le journal,
la colonne « Attestation » du bureau et les feuilles d'acte l'écrivaient chacun de leur
côté, et aucun des trois ne connaissait la troisième valeur.

### D2 — 07.1 : « Ma signature », ses trois états

La rangée disait la vérité de l'époque — *« tracée à chaque remise, jamais conservée »*.
Elle ouvre maintenant :

- **sans signature** : la feuille de source (17.6, sans pied) — « Choisir une image » ou
  « Prendre en photo », le refus **dans la rangée** (17.10) : « trop-lourde.jpg fait 6 Mo,
  au-delà de 5 Mo » ;
- **le recadrage** : une page « Recadrer », `<canvas>` de 320 sur `--inset-2`, l'image
  glissée au pointeur, un curseur de 0,5× à 4× (`Slider`, primitive neuve), un cadre à
  quatre poignées **au rapport de la case d'attestation** — recadrer dans une forme et
  apposer dans une autre ferait mentir l'aperçu. Aucune librairie : `SignaturePad` avait
  déjà prouvé que le Canvas natif suffit ;
- **avec signature** : la feuille qui la montre, dit ce qu'elle change, et porte les deux
  gestes — Supprimer, Remplacer (qui purge l'ancienne avant d'écrire).

La borne des 5 Mo n'a pas été réécrite : `lib/fileImport.ts` la portait déjà, **réglable en
14.1** — la signature s'y range comme les autres pièces.

### D3 — le bloc 4 lit deux faits

`Attestation` reçoit la signature du signataire (lue par `ActSheet` via le service, **et
seulement s'il a un code** : elle ne s'appose que pour celui qui saisit son propre code sur
son propre appareil). Trois sorties :

- code juste **et** signature : la case passe en teinte verte, l'image s'affiche, « apposée
  · code PIN », `pin+signature` — **aucun tap de plus** ;
- code juste, sans image : « Attesté par code PIN, 09:42. Sans signature enregistrée, le
  code suffit. » ;
- sans code : le tracé, inchangé.

Un piège qui s'est vu à l'écran : `settle()` remonte la méthode à l'appelant mais ne
changeait pas l'**état local** — la case restait le pavé et la note disait « sans signature
enregistrée » alors que l'image était bien là. La méthode retenue est maintenant posée aux
deux endroits.

### Ce qui reste du lot 28

- **L'enregistrement d'attestation sur les entités** (D1, seconde moitié) :
  `{ method, at, by, onDeviceOf?, signatureRef? }` en remplacement de `handoverProof`
  (chaîne libre) sur `Equipment`, `Incident` et `Approval`. La **méthode** part déjà au
  journal pour l'incident et la sortie du parc (`metadata.method`, que 18.1 relit) ; c'est
  la structure complète qui manque.
- **La suspension d'un compte** (05.2), troisième acte cité par D4, n'a pas encore son
  bloc 4.
- Les **lots 29 à 32** (campagne d'inventaire objet, incident objet, budget, navigation)
  ne sont pas commencés.

### Vérifié

`tsc` **0** · `eslint` **0** · les quatre gardes vertes · `npm run build` ✓ · et les
vérifications du lot, dans le navigateur à 393 :

1. import d'un PNG → recadrage → « Enregistrer » : la rangée dit « importée le 9
   septembre », et `tracker_signatures` porte **un** enregistrement (14 Ko) ;
2. code PIN posé, puis remise depuis 04.2 : **la signature s'appose seule**, « apposée ·
   code PIN » ;
3. sans image enregistrée, le même acte dit « Attesté par code PIN, 17:09 » ;
5. un JPG de 6 Mo : refus **dans la rangée**, l'ancienne signature intacte ;
6. `grep -rn "validateAdminPIN\|ADMIN_PIN" src/` : plus rien qu'un commentaire d'histoire ;
7. `logSecurityAction` ne reçoit que la méthode et l'issue — aucun code n'est journalisé.

> **Un piège d'outillage, pour mémoire.** `npx prettier --write src/` réécrit **tout** le
> dossier : 50 fichiers changent de fin de ligne (l'arbre est en CRLF, `HEAD` en LF) et
> quelques-uns se reformatent, pour zéro ligne de contenu. Formater **fichier par fichier**,
> et jamais un dossier.

## Le filigrane LIVE du bandeau de marque — 09/09 et 10/09

Le « motif cartouche » de 02.1 est le **système LIVE de Neemba** : angles emboîtés,
losange, cercles concentriques, quatre triangles (`images/imgdownloader-76bd8c9f.png`, et
les cartes `…-26235495.webp`, `…-cd7fdb1d.webp`). Quatre temps, dans
`src/features/auth/components/BrandBanner.tsx` et dans les planches 02.1 **et** 02.2 —
02.2 reprend le bandeau « à l'identique », et avait gardé l'ancien tracé.

1. **Recalé pour le téléphone.** À 393, trois montants passaient derrière « Tracker » et
   la promesse ; le cadre suit la hauteur réelle du bandeau (393 × 199) ; trait 1,6 → 1,2.
2. **Teinté.** Le cartouche de la charte ne pose pas ses filets en blanc : chaque famille
   porte sa teinte, rabattue sur le fond entre 21 et 29 % (relevé à la pipette). Le blanc
   à 16 % donnait la même luminance en gris — un motif, plus le système.
3. **Dessiné entier, puis refusé.** Le commanditaire voyait les glyphes coupés « tronqués » ;
   entiers et empilés dans la colonne de droite, ils se lisaient, mais en semis, « sans la
   touche d'esthétique attendue ».
4. **Le cartouche des cartes LIVE**, choisi sur une planche de quatre propositions (sonar,
   cartouche, lame, cartouche avec accent — `scratchpad/propositions.html`) : les angles en
   grand, coupés par la gauche, au-dessus du titre ; la diagonale olive par l'angle
   haut-droit ; un triangle bleu au bord droit, ces deux-là fondus vers le texte par un
   masque ; et **un seul accent en couleur pleine**, deux arcs orange dans l'angle bas-droit
   (centre à 5 et 7 du coin, rayons 16 et 32, trait 6 — rentrés le 10/09 sur la capture
   du commanditaire, où il n'en restait qu'une écharde). Filets à **30 %**, accent à 100 %.

Où ça vit : hues en primitifs `--ref-live-{vert,jaune,orange,bleu}`, mélange en jetons de
composant `--color-login-live-*` (`color-mix`, `index.css`) plus `--color-login-live-accent`
(l'orange plein), consommés par le seul `BrandBanner.tsx` — ajouté aux propriétaires de
`--color-login-` dans `scripts/check-design-tokens.mjs`. **Deux cadres** de 393 × 199 en
`slice` : l'un ancré à gauche et en haut (les angles ; `-top-4` en forme courte, sinon le
filet jaune tombe sur la troisième ligne), l'autre à droite et en bas (le reste et l'accent).
Un écran large étire la bande sans étirer le dessin. Vérifié à 393 (long 199, court 167),
360 et 1512 ; viewports remesurés : 02.1 → 1330 × 1606, 02.2 → 2160 × 2009.

## Vérification mobile, page par page — 393 px (depuis le 09/09)

Méthode : `getComputedStyle` sur la page rendue à 393, comparé aux déclarations de la
planche (`portage-methode-mesure`). Une ligne par planche ; les écarts corrigés, puis
ceux qu'on garde et pourquoi.

- **02.1 Connexion** (09/09) — libellé et icône de champ en encre secondaire, sans
  rougir ni foncer au focus (`InputField`). Gardé : la couronne de focus au jeton du
  système plutôt qu'à `--ink` (Q-V2) ; pas de mode « annuaire » (le produit n'a pas de SSO).
- **02.2 Première connexion** (09/09) — conforme.
- **03.1 Tableau de bord** (10/09) — corrigé : l'avatar de l'en-tête à **44** (`iconOnly`
  posait `min-h-12 min-w-12` que `h-11` ne battait pas) ; **plus de filet sous le titre**
  des cartes à rangées (« Derniers événements », « Mes équipements », « Types en tension ») :
  l'en-tête `.ch` est devenu `<header>`, sans quoi `first-of-type:border-t-0` sur des
  rangées `div` ne visait jamais la première ; la rangée du héro `.trow` à **56 / 8 / 12**
  (elle valait 68 / 12 / 16 — non mesurable ce jour, la session n'ayant rien à traiter).
  Gardé : « Hors service : N retirés, M manquants » sous la barre du parc, que la planche ne
  dessine pas parce que son jeu n'a pas de reste — c'est un chiffre, pas une note ; et
  « Tout mon historique → Mon profil » pour le porteur, qui n'a pas accès au journal 18.1.
- **03.3 Tâches** (10/09) — corrigé : la ligne `.ord` met **la partition en tête, en 500,
  et le compte à droite** (« **À suivre** · les plus anciennes d'abord · 1 », « 6 des 17 »
  avec une nature posée) — `count.regard` et `count.de` de `ListTemplate`, la forme
  ordinaire (« **14** actifs · … ») ne bouge pas ; la rangée `.trow` à **56 / 8 / 12** (elle
  portait 68 / 12 / 16, les mesures de la rangée d'actifs de 04.1) ; le titre d'une demande
  est **l'objet** (« Ordinateur portable »), plus « Demande: objet » — la nature vit en
  sous-ligne et dans la teinte (`RequestSheet`, nouvelles demandes seulement). Gardé : le
  bloc du titre à 48 (la planche dit 44 sans action de page ; le gabarit garde la hauteur
  d'un geste pour que le titre ne bouge pas d'une liste à l'autre), et la recherche à pleine
  opacité sur la file vide (la planche l'éteint à 40 % ; un champ qui a l'air désactivé
  sans l'être trompe). Non mesurable : la feuille d'une tâche et « À faire » côté
  gestionnaire — la demande créée dans une session ne persiste pas (quota Firestore).
- **04.1 Actifs** (10/09) — corrigé : le titre est **« Actifs »** pour les deux rôles (le mot
  de la barre du bas, 17.7 ; le code disait « Équipements » / « Mes équipements »). Conforme
  pour le reste : bloc 17.8, `.lrow` 68 / 12 / 16, vignette 40, `.l1` 16 + type 12, `.l2` 14
  avec le glyphe d'état, identifiant en 12 à droite, « Charger la suite », FAB 56 à 80 / 16.
  Gardé : la recherche à 68 du haut (04.1 dit 60, 17.8 dit 68 — le composant fait foi).
- **04.2 Détail équipement** (10/09) — corrigé, et c'est la fiche pilote : la page à
  **16 / 16 / 24, 16 d'écart** (`DetailTemplate`, qui portait 20 partout — les sept fiches en
  héritent) ; les **en-têtes de carte à 17 / 500 / 24, sans icône** ; `ReferenceRow` à
  **48 / 12 / 16** (elle portait 44 / 11 / 13, l'échelle d'avant R15 ; quatre emplois), valeur
  sans graisse, creux en encre tertiaire, copie en 16 ; `ProportionRow` : libellé et
  conséquence en **16 / 24**, `b` en 400 ; la provenance de l'amortissement retirée (R15 :
  aucune note) ; l'historique en rangées `.ev` (marque 32, 16 / 24 + 14 / 20) et son renvoi
  vers **l'Historique** (18.1) au lieu d'Audit ; les documents en rangées `.doc` ; le badge
  d'état du héro en 400. Conforme : le héro (22 / 20 / 20, badge 28, `.ty` 12 capitales,
  28 / 32, `.hrow` 56, tuiles 22 / 28 + 12 / 16, geste 48). Non mesurable : porteur en
  réparation (ex-04.4), le compte suspendu.
- **04.3 Créer, corriger, sortir** (10/09) — corrigé : la coque de formulaire
  (`FullScreenLayout`) rend son retour en **Phosphor à 48** (il portait un glyphe Material
  de 40) et la page à **16 / 24** (elle portait 32) ; le formulaire : colonnes à 12, `<b>` en
  500, et **les trois notes retirées** (Configuration, Achat, Documents — R15, la planche ne les
  dessine pas). Les feuilles « Déclarer un incident » et « Sortir du parc » sont conformes
  (titre 22 / 28, sujet 40 + 16 / 14, crans de 56, conséquences 28 / 14, pied 48) ; leur croix
  passe en Phosphor à 48 (`CloseButton`, toutes les feuilles du produit). Non mesuré : l'import
  de fichier (arbitrage 17.6 / 04.3 en attente). **`<b>`/`<strong>` sont à 500 pour tout le
  produit** (`index.css`) : deux graisses, et le 700 du navigateur n'en est pas une.
  **Dette relevée** : `MaterialIcon` reste employé par une trentaine de composants (`Menu`,
  `Chip`, `SelectField`, `Toggle`, `Pagination`, `EmptyState`, `UserAvatar`…) — I2 / I3
  demandent Phosphor partout ; c'est un chantier à part, pas une retouche de planche.
- **04.4 La suite de l'incident** (10/09) — mesuré après une déclaration signée dans la
  session : la feuille « Prendre en charge » est conforme (titre 22 / 28 et sous-ligne, sujet
  40 + 16 / 14, bandeau de garantie 14 / 20, réparateur en `.pick` 56, deux colonnes à 12,
  champs 48, conséquences 28 / 14, pied 48). Corrigé sur la fiche en réparation (04.2,
  `e-rep`) : le geste primaire est **« Réceptionner le retour »** (il disait « Clore
  l'intervention ») ; le badge d'état dit **« En réparation »** en entier (il sortait
  « En Répar. ») ; « L'événement » quand l'historique n'en compte qu'un. Non mesuré : le
  remplacement lié (feuille de 06.1 depuis l'incident) et « Réceptionner » — ils demandent
  une prise en charge enregistrée, que le quota Firestore ne garde pas.
- **05.1 Équipe** (10/09) — corrigé : le nom en **17 / 24, chasse −.01em** (`ListRow`, prop
  `person` ; il sortait en 16 comme un code d'actif). Conforme : bloc 17.8, `.ord` avec le tri
  « Nom », rangée 68 / 12 / 16, sous-ligne « site · n objets » en 14 / 20, FAB. Gardé : `.ord`
  avec le nombre en 500 (05.1 dit 400, 17.8 dit encre pleine — le composant fait foi).
- **05.2 Fiche d'une personne** (10/09) — corrigé : les cartes à rangées (`RuleGroup`) à
  **8 / 16** au lieu de 8 / 20, et la gouttière des rangées à **16** (elle était restée à 12
  malgré son commentaire). Conforme : héro (initiale 56, `.ty`, 28 / 32, badge 28, tuiles,
  geste 48), `.ch` 48 avec 17 / 500, rangées 60 / 10 en 16 / 24 + 14 / 20, valeur en 500.
  Gardé : badge d'état en 400 (05.2 dit 500 ; 04.2, la fiche pilote, dit 400).
- **05.3 Créer un compte** (10/09) — conforme : la feuille des deux chemins, « Inviter une
  personne » (titre 22 / 28, phrase 14 / 20, adresse 48, crans de rôle 56 en 16 + 14,
  conséquences, pied 48). Écart de modèle : Pays + Site en deux colonnes là où la planche
  n'a qu'un site (le produit rattache par pays). Non mesuré : l'import d'équipe, le compte en
  attente, « compléter la fiche » (mode édition de 05.2).
- **06.1 Le parcours complet** (10/09) — « Remettre l'équipement » mesuré depuis la fiche :
  conforme (titre 22 / 28 et phrase 14 / 20, sujet 40 + 16 / 14, « Remis à » en `.pick` 56 avec
  le nom en 500, « À partir du » à 48, attestation à 120, conséquence 28 / 14, pied 48).
  Écart de forme accepté : le destinataire se choisit **dans la feuille** (bloc 1 de 17.4 :
  recherche 48, rangées 56) et non sur la page « Remettre à » de 05.1. Non mesurés : confirmer
  la réception, rendre, réceptionner (ils demandent une remise persistée).
- **06.2 L'attestation** (10/09) — sans code, la signature s'impose et la feuille le dit
  (« Pas encore de code PIN : signez. ») : conforme. Le champ à six cases se mesure en 07.1.
- **06.3 Fins de flux** (10/09) — la forme 2 mesurée sur « Demande envoyée » (bandeau 56,
  titre 16 / 500, ligne 14 / 20, teinte) : conforme. Formes 1 et 3 non mesurées.
- **06.4 Demander un équipement** (10/09) — conforme : feuille (titre 22 / 28, phrase 14 / 20,
  `.pick` 56 avec « Choisir » en 15 / 500, motif à 96, sous-ligne 14 / 20, segment 44 aux crans
  de 36 en 14, conséquence, pied 48). Non mesuré : la feuille de choix du type en tuiles.
- **06.5 Arbitrer une demande** (10/09) — non mesurable ce jour : la demande créée dans la
  session ne persiste pas (quota Firestore) et la rangée « À suivre » n'était plus là au
  second passage. À reprendre quand le quota est rendu.
- **07.1 Mon compte** (10/09) — corrigé : 16 d'écart entre le héro et les cartes (il valait
  20). Conforme : barre 56 / 17, héro (56, `.ty`, 28 / 32, courriel 14 / 20), trois cartes à
  8 / 16 avec `.ch` 48 et `.arow` 56 (vignette 40, 16 / 24 + 14 / 20). Gardé : « Définir mon
  code PIN » en feuille (six cases de 44 × 56 à 10, chiffre 24 Archivo) là où 06.2 dessine une
  page à deux étapes ; pas de « Mes sessions » ni de double authentification (le produit n'a
  ni sessions nommées ni 2FA).
- **09.1 Catalogue** (10/09) — corrigé : la page à **16 / 16 / 24** (96 sous le bouton
  flottant), l'écart des familles à **16**, et la carte d'une famille à **4 / 16** — elle
  portait 20 / 36, 20 d'écart et 16 d'intérieur. Conforme : bloc 17.8, en-tête de famille
  hors carte (`.fh` 32 + 17 / 500 + compte 14 / 20), rangées 64, clé en chasse fixe à droite.
- **10.1 Emplacements** (10/09) — conforme : bloc 17.8 sans entonnoir (l'arbre se descend,
  il ne se filtre pas), `.ord` à 12 / 16, en-tête de pays à code en pastille, rangées de site
  68 avec « n actifs · n personnes · n locaux », FAB. Rien à reprendre.
- **11.1 Accès** (10/09) — corrigé : **une carte dans une carte**. Le corps de la page est
  fait de groupes à filets, qui sont déjà des cartes ; le gabarit en posait une autour, et
  les rangées s'en trouvaient rentrées de 16 de plus que sur les autres listes (297 au lieu
  de 329). `ListTemplate` reçoit un troisième corps, **`body="cartes"`** : la mesure de
  lecture reste, la carte du gabarit tombe, les enfants s'espacent de 16.
- **14.1 Paramètres** (10/09) — conforme : barre 56, groupes à filets à 8 / 16 avec en-tête
  17 / 500, rangées 60 / 10 (titre 16 / 24, conséquence 14 / 20, **valeur à droite en 500**),
  note de pied en 12 / 16 sur le filet. La valeur ne redit jamais le sous-titre.
- **18.1 Historique** (10/09) — corrigé : **un jour, une carte** (`.day`, surface, rayon 8,
  8 / 16, 16 entre deux). Les jours étaient des sections à filet dans une carte unique : la
  date se lisait comme un titre de rangée, pas comme l'en-tête de sa journée. Conforme
  ailleurs : bloc 17.8 avec badge d'entonnoir, `.ord`, marque ronde de 32 teintée par la
  nature, fait 16 / 24 + auteur et méthode 14 / 20, heure 12 tabulaire.

- **07.1, « changer mon mot de passe »** (10/09, relevé par le commanditaire) — la feuille
  la plus éloignée de sa planche du lot : titre « Mot de passe », trois champs nus, un pied à
  deux boutons de largeurs inégales. Huit écarts corrigés : le titre devient **« Changer mon
  mot de passe »**, la phrase de tête (« Vous resterez connecté sur cet appareil. ») revient,
  la **jauge à quatre segments** paraît sous chacune des deux saisies, la règle de longueur
  se lit **avant** la faute (12 caractères — le refus valait encore 8 là où
  `PASSWORD_MIN_LENGTH` dit 12), « Confirmer » redevient « Confirmer le nouveau mot de
  passe », la note « votre **code PIN** ne change pas : il signe, il n'ouvre pas » sépare les
  deux secrets, le pied passe en **deux colonnes égales** avec « Enregistrer », et l'écart du
  corps à 16. La jauge de 02.2 est extraite en `PasswordMeter` : deux planches la déclarent,
  elle n'a donc qu'un dessin. **Arbitrage** : 02.2 la pose à 12 du champ, 07.1 à 10 — le
  composant garde 12, la valeur de la planche qui l'a fait naître.

- **07.1, « Vue — Mon compte »** (10/09, relevé par le commanditaire) — la géométrie était
  juste (barre 56, page 16 / 16 / 24, héro 22 / 20 / 20 à avatar 56, cartes 8 / 16, rangées 56
  à vignette 40, 16 / 24 + 14 / 20). L'écart était **dans ce que les rangées disent**.
  *« Chaque acte n'a qu'une entrée, l'état se lit en sous-ligne »* : deux rangées sur trois le
  faisaient (« aucune, à tracer à chaque remise », « sans lui, chaque remise se trace »), la
  troisième portait une **règle** — « il ouvre la session, il ne signe pas » — et c'est
  exactement la phrase que la feuille pose désormais sous ses champs : elle était donc dite
  deux fois et n'apprenait rien du compte. Le modèle n'avait pas la donnée que la planche
  écrit (« changé il y a 4 mois ») : `User.passwordChangedAt` est ajouté, la feuille l'inscrit
  au succès comme `signatureId` s'inscrit, et la rangée lit « changé le … » ou « jamais changé
  depuis l'ouverture du compte ». Au passage, `authService.changePassword` refusait à **8**
  signes quand `PASSWORD_MIN_LENGTH` en déclare **12** — la même longueur est maintenant
  déclarée une seule fois, du service à l'écran.
  **Gardé, faute de produit** : « Double authentification » et « Mes sessions », que 07.1
  dessine en colonnes 3 et 7 ; le produit n'a ni 2FA ni registre de sessions. La carte « Où je
  suis connecté » n'a donc qu'une rangée et pas son décompte d'appareils.

- **07.1, les trois états de la signature** (10/09, relevés par le commanditaire) —
  **« D'où vient l'image »** : la phrase de tête manquait (« Une image de votre signature.
  Avec votre code PIN, elle s'apposera d'elle-même. ») — la feuille demandait un fichier
  sans dire ce qu'il deviendrait ; et le conseil de la photo reprend la formulation de la
  planche, la nôtre se tronquant à 393.
  **« Recadrer »** : cadre au rayon 8 (il valait 4), le curseur reçoit **le moins et le
  plus** que `.zoom` déclare, sa piste passe à **4** et sa poignée à **24 carrée** (elle
  valait 6 et une pastille ronde de 20 — le diamètre d'un bouton radio : une poignée qui se
  glisse et une case qui se coche n'ont pas à se ressembler), la valeur à 14 sur 20 dans ses
  40, et la phrase de garantie descend **sous** le réglage avec sa main — elle ne dit plus
  quoi faire, elle dit ce que le geste garantit. Les crans vivent dans `Slider`, pas dans
  l'écran : posés là, c'étaient deux contrôles natifs hors des primitives, et le contrôle DS
  l'a refusé à juste titre.
  **« Signature enregistrée »** : la phrase de tête, la **date en haut à droite**, le bloc
  de conséquences repris — il s'intitulait « Ce que cela change » sans dire *quoi*, alors que
  la question posée ici est « puis-je la supprimer », et 07.1 l'écrit : **« Si vous la
  supprimez »** — avec ses deux pastilles de 28 teintées. L'aperçu passe de 120 à **160** :
  120 était la hauteur de la case d'attestation, choisie pour relire l'image « dans la forme
  qu'elle aura sur la preuve », mais à 120 **la date et le tracé se chevauchent** — une
  signature claire passe par-dessus le coin où la date se pose. 07.1 donne 160 parce qu'ici
  on juge l'image, alors que sur la preuve on la constate.
  **Gardé** : les quatre poignées en équerres plutôt que les carrés blancs de la planche
  (elles ne se saisissent pas, et un carré blanc promet qu'on peut les tirer) ; pas de voile
  sombre autour du cadre, le canevas *étant* le cadre — ce qu'on voit est ce qui sera
  enregistré ; et le pied du recadrage détaché par un filet plutôt que collé au bas, cette
  vue vivant dans le flux des réglages et non dans une coque pleine page.

- **14.1 + 07.1, la carte « L'application »** (10/09, demandée par le commanditaire) — la
  dernière colonne de 07.1 dessine un écran de Paramètres à deux cartes : « Mon compte » et
  **« L'application »** (Notifications · Langue et site · Aide), la version en pied. Le
  produit portait les quatre groupes de **14.1**, qui fait foi sur cette page (§ une page,
  une planche), mais **rien** des trois rangées de 07.1. Le groupe « L'application » est
  ajouté entre « L'informatique » et « À propos ». **Ce qui n'a pas été redit** : la version
  reste dans « À propos », où 14.1 la range — la reprendre en pied l'aurait mise deux fois ;
  et « Contacter le support » **se déplace** au lieu de se dupliquer, sous le nom que 07.1
  lui donne, « Aide ». **Deux rangées sur trois ne s'ouvrent pas, et c'est exact** : rien
  n'est réglable derrière — les deux notifications sont celles que le produit émet, la langue
  est le français, le site vient de la fiche où un gestionnaire le change (05.2). Un chevron
  y promettrait un écran qui n'existe pas, ce que 14.1 a précisément fait tomber du Centre
  d'aide. La sous-ligne d'« Aide » porte l'adresse et **ne promet pas de « documentation »** :
  le produit n'en a aucune à ouvrir.

- **14.1, la mise en page des rangées** (10/09, demandée par le commanditaire : « aligner
  Paramètres sur le style de Mon compte, avec des icônes ; certains détails sont trop
  longs »). Deux planches donnent deux grammaires à cette page : **14.1** pose la valeur à
  droite et **aucune vignette** ; **07.1** pose une vignette de 40 et met l'état en
  sous-ligne, sans valeur. Le commanditaire tranche pour la vignette, et « Mon compte »
  l'emploie déjà — deux écrans atteints par le même menu ne gagnent rien à s'écrire dans
  deux grammaires. `RuleGroup.Row` reçoit donc un `glyph` optionnel ; 05.2 et 11.1 ne le
  passent pas et ne changent pas.
  **Ce que la vignette coûte, et comment il est payé.** Elle prend 52 px, et titre + valeur
  ne tenaient plus : « Périodicité de l'inventaire » sortait en « Périodicité de l'inve… ».
  Un réglage qu'on ne peut pas nommer ne se règle pas — **avec une vignette, le titre passe
  donc à la ligne au lieu de se couper** (sans elle, l'ellipse reste : 11.1 la veut, et ses
  titres sont courts). Et la place se reprend sur les valeurs et les sous-lignes, jamais sur
  les titres : « Code PIN à définir » devient **« À définir »** (le pictogramme d'alerte et
  le titre disent le reste) ; « français · Lomé Siège » passe en sous-ligne, où 07.1 le met ;
  les sous-lignes de « Devise », « Amortissement », « Périodicité », « Taille » et « Sources »
  tombent, titre et valeur s'y suffisant.
  **Rien n'est perdu au passage** : les deux portées chiffrées que 14.1 tient à montrer —
  « décide de la valeur de N actifs », « donne son sens à “en retard” sur N sites » —
  **descendent dans l'écran du réglage**, en pied de groupe, là où 14.1 les porte aussi et
  là où l'on s'apprête à changer la valeur. Résultat : rangées de **60 à 69** au lieu de 60
  à 104, aucun titre coupé, une icône par réglage.

- **14.1, la passe de dépouillement** (10/09, demandée par le commanditaire : « il est plus
  simple de garder les boutons sans les détails ou commentaires ; le nom des boutons Langue
  et Thème est trop long »). La passe précédente avait raccourci les sous-lignes ; celle-ci
  les **supprime**, et avec elles les notes grises de groupe. Ce qui tombe : les deux notes
  de « Vous » et de « L'informatique » (trois lignes de gris pour une carte d'une rangée,
  qui expliquaient le classement plutôt que le réglage) ; la sous-ligne de « Notifications »,
  devenue sa **valeur** « Réceptions, relances » ; l'adresse sous « Aide », la flèche de
  sortie disant déjà qu'on part écrire ; et la moitié qui plaidait dans « Clair — identité
  Neemba ». Ce qui se raccourcit : **« Langue et site » devient « Langue »**, valeur
  « Français » — le site, que la valeur portait en « français · Lomé Siège », est déjà sous
  le nom dans le héro de Mon compte, et une rangée ne porte qu'un fait ; **« Thème »** garde
  « Clair ». Les notes ne sont pas perdues : elles vivent dans l'écran du réglage, où elles
  se lisent au moment d'agir. Relevé à 393 : rangées **60 · 60 · 60 · 61 · 61 · 61 · 68 · 68
  · 69 · 69 · 69**, aucun titre coupé, une icône par réglage, et une page qui se parcourt
  d'un regard au lieu de se lire.

- **Une règle sans couche avalait le 600 d'Archivo** (10/09, trouvée en mesurant 15.1).
  Le produit posait `b, strong { font-weight: 500 }` pour ramener le 700 du navigateur
  dans les deux graisses de R15 — mais **hors de toute couche**, et une règle sans couche
  l'emporte sur `@layer utilities` : c'est le piège que ce fichier documente déjà pour le
  `h1 {…}` qui neutralisait les chasses négatives. Conséquence mesurée : tout `<b>` portant
  `font-semibold` rendait **500 au lieu de 600** — le restant de 15.1 en 44, celui de 16.1,
  les trois totaux de 11.1, le compte de l'import, les trois chiffres de 15.5 ; et
  symétriquement les cinq `<strong className="font-normal">` de 04.2 rendaient 500 au lieu
  de 400. La règle passe dans `@layer base` : elle corrige toujours le 700 du navigateur, et
  n'importe quelle classe de graisse la reprend.

- **15.1 au téléphone** (10/09) — conforme sur `.top` (8 / 16 / 12, gouttière 12, titre
  28 sur 32), sur le héro (22 / 20 / 20, surtitre 12 en capitales espacées, jauge de 6,
  ligne de lecture 12), sur `.ch` (48, 17 sur 24, compte 14 sur 20), sur `.post`
  (12 d'intérieur, gouttière 8, nom 16 sur 24, montants 14 sur 20 dont le consommé en 16)
  et sur `.lrow` (64, vignette 40, 16 sur 24 + 14 sur 20). **Six écarts relevés et repris** :
  la page se peignait en `bg-surface`, **la couleur des cartes elles-mêmes**, si bien que
  « Les postes » et « Aller à » se fondaient dans le fond et qu'un filet — qu'aucune planche
  ne déclare — les détachait ; le fond passe au canevas et les deux cartes prennent la
  grammaire du produit (rayon 8, intérieur 8 / 16, ni filet ni ombre). Les jauges portaient
  le rayon 4 au lieu du **2** de `.prog` et de `.gauge`. Les blocs s'espaçaient de 20 au
  lieu des **16** de `.page`. Le chiffre du héro avalait la devise — « 42 700 000 XOF »
  **en 44** — quand `.big` met le nombre en 44 et l'unité en 14 à côté, comme 16.1 ; et la
  même devise se répétait sur chaque poste, trois fois par rangée, trente-trois fois sur
  l'écran. Enfin `.tb` manquait : la page s'atteint depuis « Plus » et **ne se quittait que
  par la barre du bas**. Reste non porté : `.hact` « Changer d'exercice » et l'écran
  « Exercices » (colonne 3), auxquels le sélecteur d'année du bloc fixe tient lieu de place.

- **15.3 — le journal des dépenses, porté** (10/09). La page n'était pas portée du tout :
  fil d'Ariane « Finances » au-dessus d'un titre de 30, une carte « Historique des
  Transactions », un tableau à sept colonnes caché sous 600 **et** une liste de cartes
  qui redisait les mêmes faits en dessous — deux corps pour une liste, aucune recherche,
  aucun filtre, aucun mois. Elle prend le gabarit des huit listes (17.8) et la forme que
  18.1 emploie déjà pour un journal : **une carte par mois, son total en tête**, rangées de
  64 à vignette de 40, montant nu à droite et ⋮ au bout. S'y ajoutent le héro « Consommé à
  ce jour » — que le filtre ne touche pas —, la bande de recherche (« Fournisseur, facture,
  objet »), la feuille de filtre à deux axes en puces et le geste d'enregistrement.
  **Trois écarts assumés** : l'axe **poste** de la feuille n'existe pas, une dépense du
  produit ne portant aucun lien vers une ligne de budget — le panneau de détail le *devine*
  encore, et 15.1 a précisément fait tomber la devinette ; « Modifier » ne se redit pas dans
  le ⋮ de la rangée, la dépense ouverte le portant déjà ; et les trois chemins du bouton
  flottant (photographier, importer, saisir) sont les **deux modes** de la feuille
  d'enregistrement, l'appareil photo et le fichier ouvrant le même sélecteur au téléphone.
  Mesuré à 393 sur quatre écritures saisies dans l'écran : mois 48 / 17 sur 24 avec son
  total en 14 sur 20, rangées **64 · 65 · 65**, vignette 40 rayon 4, titre 16 sur 24,
  sous-ligne 14 sur 20, montant 16 sur 24 tabulaire, ⋮ de 48 débordant de 12.
  **Le compte ne s'écrit que filtré** : 15.3 ne dessine pas de ligne de service, son héro
  disant déjà « consommés en 47 écritures » ; dès qu'un filtre ou une recherche restreint la
  liste, la ligne revient et dit le rapport.

- **16.1 au téléphone** (10/09) — conforme sur le bloc fixe (8 / 16 / 12, gouttière 12,
  titre 28 sur 32, `.srch` et `.fbtn` à 48), sur le héro (22 / 20 / 20, chiffre Archivo 44
  sur 48, unité 14 sur 20, `.hrow` à 20 avec deux `.hk` de 12 / 10 sur le voile blanc à 8 %,
  valeur 22 sur 28 et clé 12 sur 16 à 2), et sur `.fnote` (14 sur 20, gouttière 8). **Trois
  écarts repris** : `.trow` déclare **56** et la rangée tenait le plancher de 64 — celui de
  la rangée d'objet de 04.1, quand 16.1 range des lieux *en file* ; `.mini`, l'avancement
  dans la rangée, portait le rayon 4 au lieu de **2** ; et `.tb` manquait au premier niveau,
  la page s'atteignant depuis « Plus » et ne se quittant que par la barre du bas — la flèche
  ferme le site quand un site est ouvert, et quitte l'inventaire sinon.
  **Deux écarts déjà arbitrés, laissés tels quels** : la ligne de service porte le compte à
  gauche (« 1 lieu · 1 en retard ») là où 16.1 met le tri à gauche et le compte à droite —
  c'est la forme ordinaire de 17.8, et *« le gabarit décide, pas la page »* ; et le bouton
  flottant « Lancer une campagne » n'existe pas, la matrice de 17.8 refusant l'action de
  page à cet écran (une campagne se lance depuis la rangée de son lieu).

- **La ligne de compte fait un `.top`** (10/09, trouvé en mesurant le second niveau de
  16.1). Le gabarit des listes ne posait l'intérieur `8 / 16 / 12` de `.top` que lorsqu'une
  **bande de recherche** existait ; sinon il retombait sur `.tbar.plain`, la barre de 56
  tout compris de 04.1. Or le second niveau de 16.1 — un site ouvert, qui ne se cherche pas
  — porte bien une ligne de compte : elle se collait au filet, sans les 12 que la planche
  déclare, et le bloc mesurait **65 au lieu de 97**. La condition regarde maintenant la
  bande *ou* la ligne ; la barre de 56 reste pour ce qu'elle vise, un titre et rien dessous.

- **16.2 au téléphone** (10/09) — conforme sur `.tbar` (56, retour 48, `.tid .code` Archivo
  600 en 17 sur 24, ⋮ à 48), sur le sujet du héro (Archivo 28 sur 32 à 4 du surtitre), sur
  `.hrow` (20, gouttière 12) et sur les trois `.hk` (valeur 22 sur 28, clé 12 sur 16).
  **Cinq écarts repris** : `.md`, la ligne qui situe la campagne, tenait **13 sur 19** — une
  marche que R15 ne déclare pas, héritée de l'ancien `body-medium` — au lieu de 14 sur 20,
  et 4 de marge au lieu de 2 ; c'est le `DetailHero` partagé qui la portait, donc les sept
  fiches la corrigent ensemble. `.prog` prenait le **rayon plein** au lieu de 2, sur un voile
  à 16 % au lieu de 12. La ligne de lecture sous la jauge prenait le corps de la page,
  **14 sur 21**, deux points de plus que la clé des tuiles juste au-dessus : elle passe au
  12 sur 16 de `.pk`. Les cartes portaient une **ombre** qu'aucune planche ne déclare, et la
  carte des rangées n'avait aucun intérieur vertical là où `.card` en veut 4 ; la carte de
  décision `.ec` valait 16 / 14 au lieu de **16 / 20**. Enfin la page se peignait en
  `surface-container-low` — **exactement la couleur de `surface`** dans les jetons du
  produit, donc celle de ses propres cartes : sans l'ombre, elles disparaissaient. Elle
  passe sur le canevas, comme `.phone` de la planche.
  **Trois écarts laissés, et dits** : les rangées d'objets emploient la rangée partagée de
  04.1 (**70**) là où `.trow` de 16.2 déclare 56 — deux planches, deux hauteurs pour le même
  objet, et c'est la primitive qui tient ; les puces du parc emploient la pastille partagée
  (40 de haut, 15 sur 20) là où `.chip` de 16.2 en veut 36 et 14 sur 20 ; et chaque rangée
  porte son état en bout (« à scanner »), que la puce active dit déjà — la planche ne le
  répète pas.

- **Les en-têtes, ramenés à deux mesures** (10/09, demandé par le commanditaire :
  « harmoniser la taille de tous les headers »). Relevé à 393 sur les vingt-trois écrans :
  **quatre mesures coexistaient**, dont deux que R15 ne déclare pas.

  | mesure | ce qui la portait | verdict |
  | --- | --- | --- |
  | **28 sur 32**, Archivo 600, −.02em | les douze listes, Paramètres, Finances | `.top` — la mesure d'une **destination** |
  | **17 sur 24**, Archivo 600, −.01em | la fiche d'un objet, Mon compte, Amortissement, Recadrer | `.tbar` — la mesure de **ce qu'une rangée ouvre** |
  | **18 sur 23** | la barre du haut, la modale, le panneau latéral (`.section-title`) | **inventée** — passe à 22 sur 28, le `.sttl h3` des feuilles |
  | **30 sur 36** | Rapports (`.page-title`) | **inventée** — passe à 28 sur 32 |

  **Le doublon des pages plein écran.** Ajouter un équipement écrivait « Équipement » dans
  la barre du haut, en 18, puis « Nouvel équipement » douze pixels plus bas, en 17 : deux
  barres, deux mesures, un écran. Neuf vues étaient dans ce cas — les six formulaires et
  imports, plus les deux boîtes du Catalogue qui redisaient « Catalogue » au-dessus du
  `.top` du Catalogue. Elles rejoignent `adnMobileViews`, la liste des vues qui portent
  leur propre en-tête. La barre du haut, elle, prend la mesure de `.tbar` (56 de haut,
  17 sur 24) au lieu de 64 et du titre de feuille.

  **Rapports** portait le seul en-tête à trois étages du produit : un fil d'Ariane
  « Rapports », un titre « Rapports » de 30, et au-dessus une barre « Rapports » de 18 —
  trois fois le même mot à trois mesures. Il prend le `.top` des destinations, avec sa
  flèche de retour. `PageHeader` et `DetailHeader` n'ont plus aucun emploi.

  **« Mon compte » passe en 28 — arbitrage du commanditaire (11/09).** 07.1 le dessine
  dans un `.tbar` à 17, comme tout ce qu'une rangée ouvre. Mais c'est le seul de ces
  écrans à avoir son adresse propre (`/settings/account`), à s'atteindre par deux chemins
  — Paramètres et l'avatar de 03.1 — et à porter un héro : vu de l'usage, c'est une
  destination. Il prend donc le `.top` de Paramètres. **Les cinq écrans de réglage —
  Devise, Amortissement, Périodicité, Fichiers, Sources — gardent le `.tbar` à 17** : eux
  n'existent qu'au bout d'une rangée, et 14.1 les dessine ainsi.

  **La flèche de retour, au même endroit partout** (11/09, mesuré en vérifiant Mon compte).
  Les sept destinations qui en portent une la plaçaient à **trois** endroits : les listes du
  gabarit à 8 du bord, titre à 60 ; Finances et Rapports à 0, titre à 56 ; Paramètres et
  Mon compte à 16, titre à 68. Finances et Rapports se retiraient de 24 — l'intérieur du
  bureau — dans une page qui n'en pose que 16 au téléphone : le bloc débordait de 8 à
  gauche, à droite et **en haut**, si bien que le titre montait aussi de 8. Paramètres et
  Mon compte ne rentraient pas leur flèche comme `.top .tt` le demande. Les sept sortent
  maintenant à **flèche 8–56, titre à 60**, la mesure du gabarit.

- **Les rangées d'acte disent un état, plus un commentaire** (10/09, même demande :
  « garder les boutons sans les détails ou commentaire »). Mon compte portait des phrases
  là où 07.1 écrit un état : « jamais changé depuis l'ouverture du compte » — coupé à
  « …du comp » —, « sans lui, chaque remise se trace », « aucune, à tracer à chaque
  remise », « de cet appareil seulement ». Elles deviennent **« jamais changé »**,
  **« à définir »**, **« aucune »**, et « Se déconnecter » n'en porte plus du tout :
  `subtitle` devient optionnel sur `ActionCard.Row`, une rangée sans état n'ayant pas à
  inventer une seconde ligne. « à définir » est le mot que Paramètres emploie déjà pour le
  même code PIN — deux écrans atteints par le même menu ne gagnent rien à le nommer
  autrement. Une rangée de l'index avait échappé à la passe précédente,
  « N machines détectées à valider · Elles attendent dans Tâches » : la flèche de sortie
  dit la destination, le titre dit le reste.
  **Les sous-lignes des écrans de réglage restent** — « Au bout de laquelle un objet ne
  vaut plus rien au bilan », « 1 200 000 s'écrit 1,2 M » : 14.1 les déclare là, et c'est
  au moment de changer une valeur qu'on a besoin de savoir ce qu'elle change.

- **Le bandeau « Données de démonstration » est retiré** (11/09, demandé par le
  commanditaire). Il paraissait en tête de chaque page quand Firestore ne répondait pas
  — quota quotidien épuisé, réseau coupé — avec « Le magasin distant n'a pas répondu :
  rien de ce qui est écrit ici n'y sera enregistré ». La coque ne le rend plus ; le
  drapeau `remoteUnavailable` reste exposé par `DataContext`, pour un écran qui voudrait
  un jour dire l'état hors ligne à sa place. Vérifié à 393 en coupant toute requête
  Firestore : aucun bandeau sur l'accueil, les actifs ni les finances.
  **Le retrait est conforme à 17.1**, qui dit l'état hors ligne *« dans la forme de l'état
  vide, jamais en bandeau »* — `OfflineBanner` était déjà tombé le 08/09 pour cette raison ;
  c'était le dernier bandeau de ce genre. **Ce que couvre l'état « Hors ligne » qui reste**,
  relevé le 11/09 en coupant le réseau de l'appareil : il paraît sur une liste **qui n'a
  rien à montrer** (Tâches) ; une liste déjà remplie (Actifs, Historique) garde ses rangées
  sans le dire, et une fiche retire son geste d'écriture sans le dire. Il se règle sur
  `navigator.onLine`, donc sur le réseau de l'appareil : **le quota Firestore épuisé, réseau
  présent, n'est plus signalé nulle part** — c'était le seul cas propre au bandeau retiré.

- **07.1, la feuille « Définir mon code PIN » remise sur un axe** (11/09, relevé du
  commanditaire : « le formulaire de définition de PIN n'est pas aligné »). Le formulaire
  de code est la vue de référence de 06.2, que 02.2 (écran 3) reprend telle quelle :
  `.pinpage` y **centre tout** — la phrase, les six cases, l'indication, la note. La
  feuille centrait les cases (`PinField` les pose ainsi partout) mais laissait le texte au
  bord : la phrase partait à 21 px, les cases à 40, la note à 21, et aucun bloc ne tombait
  sur l'axe d'un autre. La phrase et la note sont maintenant centrées sur 300 px au plus,
  comme `.ps` et `.fine` ; la note passe de 12 sur 16 à **14 sur 20**, la mesure de `.fine` ;
  et la phrase équilibre ses lignes (`text-wrap: balance`), sans quoi sa deuxième ligne
  s'ouvrait sur un tiret seul. Mesuré à 393 : les trois blocs centrés à **197**, le milieu
  de la feuille. Le titre de la feuille reste à gauche, comme dans toutes les feuilles.

- **Le code PIN se saisit deux fois, comme un mot de passe** (11/09, demandé par le
  commanditaire). La feuille de 07.1 n'en prenait qu'une, la sixième frappe enregistrant
  seule : une faute de frappe devenait le code, et ne se découvrait qu'à la première remise,
  devant la personne qui tend l'objet. 02.2 posait pourtant la règle — *« chacun se saisit
  deux fois »* — et la première connexion l'appliquait déjà. **Les deux écrans partagent
  maintenant un seul formulaire**, `PinConfirmation` (crochet `usePinConfirmation` +
  composant), que 02.2 appelle *« le même fichier »* : saisie, puis confirmation ; `.pinsteps`
  à deux temps ; une ligne d'indication qui dit quoi faire (« Vous le retaperez pour le
  confirmer », « Retapez-le », « Les deux codes concordent ») ; et « Recommencer » quand les
  deux diffèrent. Un code faible est refusé **dès la première saisie**, avant qu'on le
  retape pour rien, avec le message exact de la règle (« ni une suite, ni six fois le même
  chiffre » — la première connexion disait « un chiffre répété », ce qui écartait à tort
  112233). La feuille gagne le pied de celle du mot de passe, **Annuler / Enregistrer**, et
  « Enregistrer » ne s'allume que lorsque les deux saisies concordent. Sa note de bas
  (« Sans code, la remise se prouve par un tracé ») tombe : la ligne d'indication en
  occupe la place.
  Parcouru à 393 : code faible refusé au premier temps ; premier code accepté, second temps
  allumé, cases vidées ; second code différent, rouge et « Recommencer » ; Recommencer
  ramène au premier temps ; deux codes identiques, vert et « Enregistrer » allumé. La
  première connexion n'a pas été parcourue — elle exige un lien d'invitation, qu'on ne
  crée pas sur la base du commanditaire —, mais elle rend désormais le même composant.

- **Remplacer son code PIN exige l'actuel** (11/09, demandé par le commanditaire).
  La feuille ne le demandait pas, et le disait : *« setUserPin ne le vérifie pas »*. Qui
  trouvait le téléphone de quelqu'un ouvert pouvait donc poser son propre code et
  attester des remises en son nom. Trois choses changent, et **la vérification est réelle,
  pas décorative** :
  1. **La règle métier l'exige.** `setUserPin(userId, pin, currentPin)` refuse le
     remplacement de *son propre* code sans le code en place (« Le code actuel ne
     correspond pas »), et refuse un nouveau code identique à l'ancien. Un écran qui
     oublierait de le demander ne la contournerait pas. Poser un premier code (02.2, ou
     après une réinitialisation) et poser le code d'autrui (05.2) n'en demandent pas.
  2. **La feuille le demande en premier temps**, seul, avant le nouveau code et sa
     confirmation : `.pinsteps` compte **trois** tirets au lieu de deux (`PinSteps`,
     `stepsBefore` de `PinConfirmation`).
  3. **Trois essais**, la borne de l'attestation — désormais une seule constante,
     `PIN_MAX_ATTEMPTS`, que `Attestation` lit aussi. Le compte **survit à la fermeture de
     la feuille** (stockage de session de l'onglet) : sans cela, la rouvrir rendait trois
     essais neufs, et la borne ne bornait rien. Au bout, la feuille ne demande plus rien et
     dit la seule issue : l'informatique réinitialise le code depuis la fiche (05.2), et le
     premier code se pose alors sans ancien.
  Parcouru à 393 sur un code posé dans la session : premier temps « Entrez votre code
  actuel », un tiret sur trois ; faux, « Encore 2 essais » ; feuille refermée puis rouverte,
  faux, « Dernier essai » ; juste, deux tirets sur trois ; nouveau code identique à
  l'actuel, refusé ; nouveau code puis confirmation, « Enregistrer » allumé, « Code PIN
  remplacé » ; trois essais faux, la feuille n'offre plus que « Fermer ».
  **Limite à connaître** : la vérification se fait dans l'application, comme celle de
  l'attestation d'une remise ; le code vit sur le compte, sans empreinte. Elle arrête qui
  trouve un téléphone ouvert, pas qui ouvre les outils du navigateur.

- **16.2, la campagne remise d'aplomb** (11/09, relevé du commanditaire : « campagne
  n'est pas aligné »). Mesuré bloc par bloc à 393, trois écarts :
  1. **La rangée de pastilles sortait de l'écran** — 16 → 466 px pour une page qui
     s'arrête à 377 : « Manquants » était coupé. Elles prenaient la mesure de 04.1 et 15.3
     (40 de haut, 15 sur 20, 14 d'intérieur) **et un pictogramme chacune**, là où `.chip`
     de 16.2 fait 36, 14 sur 20, 12 d'intérieur, sans pictogramme, et **sur fond de
     surface** — elles sont posées sur le canevas, où le creux d'une pastille de feuille
     ne se détachait plus. `FacetChip` reçoit `compact` et `onCanvas` ; les trois tiennent
     désormais entre 16 et 355.
  2. **Le héro portait 16 px de vide au-dessus de son surtitre** : `DetailHero` posait
     toujours `mt-4` sur `.ty`, une marge faite pour le séparer de la pastille d'état. Sans
     pastille, le surtitre tombait à 38 du haut au lieu des 22 de `.hero`. La marge ne
     s'applique plus qu'après une pastille — ce qui corrige aussi la fiche d'un modèle et
     celle d'une catégorie, qui n'en ont pas. La fiche d'un équipement, qui en a une, ne
     bouge pas.
  3. **La légende de liste était rentrée de 2** au lieu des 4 de `.ord` et de la ligne de
     compte de toutes les listes — sur le parc comme sur les écarts.
  Remesuré : surtitre à 22, pastilles 16–121 · 129–234 · 242–355, légende 20–373, carte
  16–377.

- **04.2, les gestes du porteur remis à la planche** (11/09, relevé du commanditaire :
  « les boutons d'action comme Restituer, Incident ne sont pas alignés avec les
  planches »). Mesuré sur la fiche d'un ordinateur vue par son porteur :

  | | `.hact.two` de 04.2 | produit avant |
  | --- | --- | --- |
  | disposition | deux colonnes égales, 12 d'écart | empilés pleine largeur, 10 d'écart |
  | intérieur | 12 | 16 |
  | premier geste | « Incident », jaune | « Déclarer un incident », jaune |
  | « Restituer » | `.btn-d` : blanc à 12 % sur le héro | `tonal` : presque noir sur un héro presque noir |

  Les deux gestes sont désormais côte à côte, 154,5 px chacun — **exactement sous les deux
  tuiles du héro**, qui partagent la même grille. « Incident » garde son nom entier pour
  qui ne voit pas l'écran (`aria-label`) ; la feuille qui s'ouvre le porte dans son titre.
  Le blanc à 12 % devient `BOUTON_SUR_HERO`, repris par « Annuler la remise », le geste
  secondaire du gestionnaire quand une remise attend, qui avait le même défaut.
  **Écarts laissés dans la vue du porteur, non demandés** : 04.2 ne montre pas au porteur
  sa propre rangée (« ABBEY Gianni »), écrit « Attribué — à vous » dans la pastille, et
  remplace le prix par la date de remise dans une troisième tuile. « Réception non
  confirmée » n'est pas un défaut des gestes : l'objet vient du tableur, sans date de
  réception.

**Restent à mesurer au téléphone** : 15.2, 15.4 et 15.5 (les lignes du budget, la saisie
d'une dépense, les rapports), 17.1 à 17.10 (les
composants partagés, mesurés en place dans les écrans mais jamais contre leur propre
planche), et 06.5 (le détail d'une demande — la demande créée dans une session ne persiste
pas, quota Firestore).

**Comment mesurer un écran dont la donnée est vide.** Les dépenses n'existent pas dans la
base : `FIREBASE_BACKEND_ENABLED` purge le stockage local à chaque démarrage, si bien qu'on
ne peut pas semer un jeu d'essai par là. Le harnais de 15.3 saisit donc quatre écritures
**par l'écran lui-même**, en coupant au passage toute écriture Firestore
(`page.route` sur `:commit`, `/Write/`, `:batchWrite`) : la page reçoit ses rangées, la base
ne reçoit rien. À reprendre pour tout écran dont l'état ne peut pas se fabriquer autrement.

## Relevé mesuré de toute l'application, et ce qu'il a corrigé (13/09)

**La demande** : *« dresse la liste de chaque élément des planches et vérifie-la sur toute
l'application »* — le commanditaire relevait, passe après passe, *« un bouton, un
espacement, un en-tête »* hors planche. La réponse n'est pas une relecture : c'est une
mesure.

**Comment.** Les 44 planches ont été rendues et chaque élément relevé par
`getComputedStyle` (971 familles). L'application a été parcourue au téléphone (393), à la
tablette (768) et au bureau (1280) — 165 états d'écran : chaque route, ses feuilles de
filtre et d'ajout, la première rangée de chaque liste, chaque entrée des ⋮ et chaque geste
de héro, le menu du compte, les rangées de Paramètres. Chaque élément mesuré est rattaché
à son composant React par la fibre, puis comparé valeur par valeur à la famille de planche
qu'il porte. Toute écriture Firestore était coupée (`page.route`) : rien n'a été écrit dans
la base du commanditaire.

**La ligne de base du 13/09** : 193 écarts — 10 de structure,
157 visibles, 26 mineurs. **Après les corrections et les six arbitrages** :
53 — 1 de structure, 49 visibles, 3 mineurs, sur les mêmes 165 états.

### Ce qui a changé, par la cause et non par l'écran

- **Aucun bouton ne porte d'ombre.** Les variantes pleines, bordées et « élevées » de
  `Button` en portaient une (87 écrans). Le bouton texte passe à l'encre pleine (`.tb`,
  `.btn-ghost`).
- **Le carré d'un geste d'icône se reprend.** `iconOnly` forçait un minimum de 48 qu'une
  hauteur posée par l'appelant ne battait pas — c'est le piège noté au 10/09, réglé à la
  source. Dans le chrome du bureau, **c'est le gabarit qui passe le geste à 40**
  (`IconGestureSizeContext`, posé par l'en-tête de `ListTemplate` et de `DetailTemplate`),
  et `FilterButton` le lit aussi. Les flux (00.5) et les feuilles gardent 48.
- **Trois ombres, et rien d'autre ne flotte** : `--tk-shadow-sheet`, `--tk-shadow-dialog`,
  `--tk-shadow-fab` (classes `shadow-sheet`, `shadow-dialog`, `shadow-fab`). Les feuilles
  perdent leur cerné, le voile passe au sombre du produit à 42 % (`--tk-color-scrim`), la
  feuille d'acte se centre à 560 au-delà de 600, le `Modal` prend la forme de `.dial`. Les
  cartes des fiches, des rapports et des imports perdent l'élévation MD3.
- **Deux encres hors socle retirées par leur jeton** : l'encre secondaire (`#57514A`)
  vaut désormais `--ink2`, et l'encre secondaire sur le sombre vaut `--on-dark-2`
  (le héro et ses tuiles, 23 écrans).
- **Le chrome du bureau** : `.sh2` en 400, l'avatar en Inter 12/500, la marque du rail en
  16. Les en-têtes de Rapports, Finances, Paramètres et du rôle ouvert passent à la forme
  du bureau au-delà de 600 ; Catalogue et Emplacements prennent le champ de 320 × 40 et
  les boutons d'en-tête de 40.
- **Plus de bouton flottant au bureau** : l'emplacement `fab` des gabarits monte dans
  l'en-tête au-delà de 600, et `ListActionFab` y prend la forme `.hbtn`
  (`AddGesturePlacementContext`).
- **Rangées et tableaux** : `ListRow` retire les 2 px entre ses lignes (68, et non 70–71)
  et passe le type en `--ink3` ; `DataTable` pose `0 10` et l'en-tête en `--ink2` ;
  `RuleGroup` reçoit la forme `grp` de 14.1 (nom du groupe en 12/16, rangées de 56 qui
  portent leurs côtés, note sur le creux).
- **Contrôles** : l'interrupteur prend `.sw` (44 × 26, creux / sombre), l'étiquette d'un
  champ multiligne `.lab` (12/16 500), la barre d'un formulaire `0 8 0 4`, le libellé des
  feuilles de filtre de 05.1 `.fh`.
- **Phosphor à la source** : `MaterialIcon` rend le glyphe que désigne
  `CORRESPONDANCE-ICONES.md` (le geste d'ajout, la flèche de liste, le dépôt de fichier…) ;
  un nom absent de la table garde l'ancien glyphe. Le bouton d'enregistrement du plein
  écran perd sa disquette.
- **La source d'un fichier au téléphone** (17.10) : plus de zone à glisser-déposer ; une
  rangée de choix, et la feuille « Fichiers · Photothèque · Prendre en photo » quand une
  image est un chemin possible. La zone reste au-delà de 600.

### Ce que la mesure a écarté, et qu'il ne faut pas « corriger »

- **Le rail tablette suit 17.11** (88, `16 8`, rangées de rayon 4, sans filet) : conforme.
  C'est 00.4 qui est en retard et doit être redessinée.
- **Les titres du tableau de bord et de la connexion** sont hors du bloc `.top` dans les
  planches aussi.
- **Les boutons texte** (« Hors service : … », le tri en 12/500) ne sont pas des `.btn`.
- **Les rangées de menu** suivent `menus.css` (48 au moins, `8 16`) ; seule la seconde
  ligne de description est un ajout du produit.

### Les six arbitrages — tranchés le 13/09

Les planches se contredisaient sur six points ; le commanditaire a délégué le choix. Deux
règles ont tranché : **la planche de page la plus récente l'emporte sur la planche de
référence plus ancienne**, et **à défaut, la majorité des planches** (§2.26).

1. **Le rayon des vignettes : 4.** Les planches de liste (04.1 `.lth`, 05.1, 03.3 `.vig`)
   le dessinent, et l'échelle du socle est 2 · 4 · 8. `--tk-radius-vignette` passe à 4.
   *Planches à aligner* : 04.2 (`.doc`), 00.4, 00.5.
2. **La rangée de liste : 68, partout.** 04.1 et 05.1 sont les dessins de page les plus
   récents ; la rangée d'une personne perd aussi ses 2 px. *Planche à aligner* : 00.4 (72).
3. **À 768, le chrome suit 17.11** : champ d'outils de 40, gestes d'en-tête de 40. Le rail
   y suit déjà 17.11 ; l'en-tête le suit aussi, et `touch-target` garde une cible de 48 au
   doigt. Aucun changement de code. *Planche à redessiner* : 00.4 (rail, recherche, gestes).
4. **Les petits libellés prennent `.lab`** — 12/16 en 500, `--ink2`, sans capitales. Trois
   planches contre trois : `.lab` l'emporte parce que c'est l'étiquette d'un champ, d'un
   groupe de réglages et d'une légende de menu, et que les passes récentes ont retiré les
   capitales. Appliqué aux feuilles de filtre (04.1, 05.1, 03.3) et à deux étiquettes de
   05.2 et 03.3. L'en-tête de la liste des sites de 16.1 n'en est pas : 16.1 le dessine en
   11, capitales espacées, encre tertiaire, et le code le suit (corrigé le 13/09 au soir,
   l'arbitrage l'avait d'abord emporté à tort). *Planches à aligner* : 03.3, 04.1, 05.1.
5. **La pastille d'état du héro : 500** — onze emplois contre deux. *Planche à aligner* :
   04.2 (`.bst.att`).
6. **Une entrée de menu tient sur une ligne** (`menus.css`, 05.2) : la conséquence d'un
   acte se lit dans la feuille qu'il ouvre. La description n'est plus lue que par le
   lecteur d'écran — sauf sur un acte impossible, où elle dit pourquoi, en bout de ligne
   (17.6).

### Restent à faire

Les derniers `Modal` (ajout d'un type, d'un modèle, d'une dépense — 09.1 et 15.4 dessinent
une feuille ou un plein écran), les styles typographiques hors échelle encore relevés
(98 écrans : `13/19` et `11/16 .82` des pages anciennes), et les pages
d'import de 05.3 et du budget, qui portent encore la palette MD3.

### Le piège qui a faussé deux relevés

Le serveur de dev ne voit **qu'une partie** des écritures sur hgfs : sur 45 fichiers édités,
5 étaient encore servis dans leur version d'avant (`ListRow`, `ListActionFab`, `RbacPage`,
`FullScreenFormLayout`, `ModelDetailsPage`). Le relevé les montrait « sans effet ». Vite
relancé, le dernier relevé est le seul qui vaut. Avant toute mesure : relancer, puis
vérifier une marque de l'édition dans le module servi.

**Familles d'éléments entièrement conformes** : 32 sur 76 au relevé, 65 sur 74 après.

### Vérifié

`tsc --noEmit` 0 erreur ; `eslint --max-warnings=0` sur les fichiers touchés ;
`check-ds-compliance`, `check-design-tokens`, `check-cn-merge` : OK. Prettier fichier par
fichier sur les lignes touchées. Relevé complet repassé après chaque lot.

### Élément par élément — la seconde passe du 13/09

**Pourquoi une seconde mesure.** La première comparait des familles d'éléments (tous les
boutons pleins, tous les en-têtes de liste) ; elle laissait passer ce que le commanditaire
voyait encore : un libellé à 40 au lieu de 20, une sous-ligne qui passe à la ligne, un
titre à 60 au lieu de 56. La seconde apparie chaque colonne de planche à l'écran qu'elle
dessine (58 paires) et chaque élément par son texte d'interface, chiffres masqués
(674 éléments). Pour chacun : famille, taille, graisse, casse et couleur ; la
position du texte ; son retrait dans la surface peinte la plus proche ; la hauteur, le
fond et le rayon de cette surface ; l'espace qui le sépare de l'élément du dessus.

**Résultat** : 511 écarts visibles au premier appariement, 337 au dernier. Le
relevé par famille passe de 53 à 50 (1 de structure, 46 visibles, 3 mineurs), 66 familles conformes sur 74.

#### Ce que la seconde passe a corrigé

- **Le corps d'une feuille** pose 12 au-dessus et 20 de côté (`.sbody`) : tout contenu
  tombait 4 px trop bas, et dix phrases de tête le rattrapaient d'une marge négative. Les
  feuilles de filtre ne redoublent plus la gouttière (libellés et pastilles à 20, et non
  40) ; le pied `.sfoot` court d'un bord à l'autre, sans marge en trop (cinq feuilles de
  filtre, neuf feuilles d'acte).
- **Les pastilles de filtre suivent leur planche** : 14 sur 20 et 36 de haut, comme 04.1,
  05.1, 09.1, 16.1 et 17.8 (Actifs, Catalogue, Inventaire, Dépenses). Seules 03.3 et 18.1
  dessinent 15 et 40 : Tâches et Historique les gardent.
- **La flèche de retour rentre de 12** — huit planches de page l'écrivent, 17.9 seule
  écrivait 8 : le titre tombe à 56. Catalogue et Emplacements reçoivent la flèche que
  09.1 et 10.1 dessinent ; au bureau, Finances et Rapports n'en portent plus.
- **La barre du bas** : la case active ne change que de couleur (400, et non 500).
- **Paramètres** : les rangées de 14.1 n'ont pas de vignette (titre à 32, et non 84).
- **Les feuilles d'ajout** (Catalogue, Emplacements) : `.orow` sans marge de côté, titre
  en 400 à 72 ; la sous-ligne ne passe plus à la ligne.
- **Le bureau** : le tableau de bord n'est plus centré sur 960 — `.main` de 03.1 court
  sur toute la largeur, `.zones` en 8fr / 4fr ; la légende de la bande tient une boîte de
  24 (la bande mesure 82) ; l'en-tête de la liste des sites de 16.1 revient en 11,
  capitales, encre tertiaire ; les cellules `td.dim` d'Équipe passent à l'encre secondaire.
- **Les fiches** : en-têtes de carte en 17 / 500, comptes en 14 (09.1, 09.2) ; la carte
  « Référence » d'un type en trois `.rrow` ; les unités d'un modèle en `.lrow` à vignette,
  sa carte « Référence » et ses `.more` centrés ; les rangées d'accès de 05.2 à vignette ;
  « à désigner » et « jamais » en encre tertiaire (10.1).

#### Ce que la seconde passe écarte

- les **appariements croisés** : un texte de planche retrouvé ailleurs dans l'écran (la
  barre latérale, la note sous les jetons d'un import, la carte derrière une feuille) ;
- le **survol** laissé par le robot sur la première rangée d'une feuille ;
- les **largeurs de colonnes** d'un tableau, qui dépendent des données ;
- les **sélections différentes** d'une planche à l'écran (« Tout » choisi ici,
  « Périphériques » là).

#### Restent — et deux demandent un choix

- **Rapports (15.5)** : la planche range quatre rapports en rangées `.lrow`, l'export au
  bout, sans choix de la personne ni jetons de colonnes ; l'écran porte des cartes et
  « Historique par personne ». Aligner retire une fonction : à arbitrer.
- **Paramètres (14.1)** : les rangées de la planche portent une sous-ligne chiffrée
  (« Décide de la valeur de 14 actifs », « Vaut pour les 9 imports ») que le code avait
  retirée à dessein ; la remettre suppose de calculer ces comptes : à arbitrer.
- Sans arbitrage : les hauteurs des rangées de 11.1 ; la liste des sites de 16.1 au bureau
  (rangées de 64 en creux, et non cartes de 96) ; la typographie de Finances au bureau ;
  les métriques du héro de 04.2 au bureau ; la conséquence en rangées à pastille des
  feuilles de 05.2 ; l'en-tête trié `th.sorted` des tableaux.

#### Le piège qui a coûté une passe

Une correction de ce journal **pendant** le relevé a fait recharger toutes les pages :
Vite surveille la racine entière, `docs/` compris. La session démo est tombée, treize
écrans ont été relevés sur la page de connexion ; la garde l'a vu, la passe a été
refaite. Rien ne s'écrit sous la racine pendant une mesure.

**Après le dernier relevé** : la clé de donnée de 09.1 passe en 14 sur 20 — le style des
jetons d'import —, et non 14 sur 24 hérité de la rangée : c'était le seul écart neuf du
relevé v12. Vérifié par `eslint`, Prettier, le contrôle DS et le module servi ; pas encore
remesuré.

### Les deux arbitrages, et le gréement refait (16/09)

**Le gréement avait disparu.** Le scratchpad vivait sous `/tmp`, effacé au redémarrage :
crawlers, moteur de règles, appariement, copies de planches et toutes les mesures. Les
scripts se sont relus dans le transcript de la session (blocs d'outil `Write` et `cat >`),
leur historique d'édition rejoué, et les deux qui manquaient — la mesure des planches et
les rectangles de texte du crawler — ont été réécrits. Les 46 planches ont été reprises
par `DesignSync` et vérifiées contre le projet vivant. Le gréement vit désormais dans
`~/tracker-audit`, hors `/tmp`.

**Un avertissement sur les chiffres** : le moteur rejoué n'est pas identique à celui du
13/09 — il compte 75 familles là où l'autre en comptait 74. Le relevé v14 ne se compare
donc pas chiffre pour chiffre au précédent : 53 écarts (2 de structure, 44 visibles,
7 mineurs), 62 familles conformes sur 75 ; élément par élément, 345 écarts visibles sur
682 éléments appariés.

**Rapports (15.5) — la forme de la planche, la fonction du produit.** La planche range
quatre rapports en rangées : vignette, nom, compte et colonnes en sous-ligne, export au
bout (44 sur le creux) ; celui qui n'a rien le dit dans sa sous-ligne et perd son bouton.
L'écran portait quatre cartes, des jetons de colonnes et un sélecteur de personne. La
planche l'emporte sur la forme ; elle ne l'emporte pas sur une fonction qu'elle n'a jamais
eue à dessiner — 15.5 date d'avant le rapport par personne et ne connaît pas le PDF. Les
deux restent joignables : **la rangée ouvre l'aperçu**, et c'est là qu'on choisit la
personne et le format. Écarts visibles de l'écran : 14 → 1, et le dernier tient à la
donnée de démonstration (sans actif de plus de trois ans, la rangée prend l'état « rien à
exporter »).

**Paramètres (14.1) — la sous-ligne chiffrée revient, à sa mesure.** `RuleGroup` pose
désormais 12 sur 16 dans un groupe de réglages et garde 14 sur 20 dans une carte : c'est
cette confusion qui avait fait retirer les sous-lignes le 10/09, quand elles disputaient
leur place à la valeur. Les comptes existaient déjà dans l'écran — actifs gouvernés par
l'amortissement par défaut, sites que la périodicité concerne —, et le nombre d'imports
est celui du produit (quatre), pas les neuf de la planche. **« Mon compte » garde sa valeur
plutôt que la sous-ligne** : la planche n'y met aucune valeur, l'écran y dit l'état du code
PIN, et le dire deux fois coûterait la lisibilité ; écart assumé de 6 px. Restent 9 écarts,
presque tous dus au repli sur deux lignes des sous-lignes de la planche.

**Le piège du jour** : remplacer un binaire dans `node_modules` **pendant que Vite tourne**
tue son service esbuild, et toute écriture dans `node_modules` fait resynchroniser le
partage depuis Windows — les quatre natifs Linux disparaissent d'un coup. Symptôme : le
serveur sert des pages d'erreur, puis refuse de démarrer. La manœuvre des quatre paquets
(`tracker-natifs-linux`) répare en une minute.

### La mesure du bureau, les rangées de 11.1 et la feuille de 05.2 (17/09)

**Au bureau, aucune planche ne borne son corps.** `.main` n'y porte qu'une gouttière de 24 :
à 1280, les zones occupent 992. Le produit bornait chaque page à 960 **et la centrait** —
le contenu tombait 16 px trop à droite et perdait 32 de large. La mesure de lecture s'efface
donc au-delà de 1200 (`Reading`, le gabarit des listes, celui des fiches, la page des accès) ;
en deçà elle vaut, car c'est là qu'on lit des lignes de texte.

**À deux niveaux, la bande de tête couvre les deux zones.** 16.1 la pose au-dessus de
`.zones` ; le gabarit la posait dans la colonne de la liste, où ses cinq chiffres se
partageaient 8/12 de la page : la légende « actifs attendus · tout le parc » passait à la
ligne et la bande mesurait 98 au lieu de 82. Inventaire au bureau : 20 écarts visibles → 15.

**Les rangées de 11.1 portent le nom de la page, et rien dessous.** La clé technique
(`equipment.view`) tenait la sous-ligne de chaque permission : elle nommait le code plutôt
que la page, et poussait la rangée de 60 à 65. Le rôle ouvert : 33 écarts → 18.

**Accès reçoit sa flèche de retour**, comme Catalogue et Emplacements avant lui : on y arrive
depuis « Plus », et 11.1 la dessine.

**La feuille « Suspendre le compte » prend l'anatomie de 05.2** : la phrase de tête en 14 sur
20 — la planche n'y met pas de bandeau teinté, et une alerte ambre pour un acte réversible dit
le contraire du texte —, la rangée de la personne (vignette 40, nom en 16, ce qu'elle détient
en 14), le bloc `.conseq` en creux où **chaque conséquence tient sa ligne** avec sa pastille de
28, puis le motif et un pied à deux colonnes égales. L'écran portait une pilule ambre, une
liste à puces en 13 et deux boutons alignés à droite.

**Ce que la mesure écarte, et qu'il ne faut pas « corriger »** : au bureau, la liste des sites
de 16.1 paraît en creux de 64 contre des cartes de 96 — la planche y dessine sa première
rangée **survolée**, et c'est ce survol que la mesure lit comme une surface. Les rangées du
produit font déjà 64. De même, la gouttière d'une carte varie d'une planche à l'autre — 16 en
05.2 et 09.1, 20 en 09.2, 11.1 et 15.5 — : il n'y a pas une valeur à appliquer, et aucune ne
sera choisie sans arbitrage.

**Relevé v17** : 314 écarts visibles élément par élément (320 avant ce lot, 511 au premier
appariement) ; par famille, 53 écarts (2 de structure, 44 visibles, 7 mineurs) et 62 familles
conformes sur 75. La feuille « Suspendre » passe de 9 écarts à 3 — les deux qui restent tiennent
à un mot (« Le nom sort des sélecteurs » contre « Elle sort des sélecteurs ») et à 12 px sous le
champ du motif.

**Un piège de mesure, deux fois** : la passe téléphone de v17 est revenue presque vide — listes
de 56 rangées au lieu de 272, fiches manquantes faute de rangée à ouvrir. Ce n'est pas l'écran
qui a changé, c'est la donnée qui n'était pas là. La garde des états l'a vu (74 états au lieu de
83) ; la passe a été refaite seule, puis fusionnée avec le bureau du même relevé. **Un relevé
dont le nombre d'états baisse ne se lit pas : il se refait.**

### Les tableaux disent leur tri, et Finances prend sa bande de bureau (18/09)

**`th.sorted` de 17.11** : la colonne qui ordonne la liste passe à l'encre pleine et porte sa
flèche ; les autres restent en encre secondaire. Elle suit le tri **réel** de l'écran, et non
l'exemple de la planche : le nom et son sens pour Équipe, l'heure décroissante pour Historique,
l'option choisie pour Actifs — qui range par ajout récent au repos, donc marque « Dernier
mouvement » là où la planche montre « Code ». L'en-tête porte aussi `aria-sort` : l'ordre se dit,
il ne se dessine pas seulement. **Un écart assumé** : tant que les deux tris diffèrent, la mesure
comptera une couleur d'écart sur Actifs.

**Au bureau, Finances prend `.bande`** (15.1 à 1280) : quatre repères en 28 sur le sombre — ce
qui reste avec sa jauge et sa devise en 13, la part consommée, les postes et leurs enveloppes
épuisées, les dépenses et la dernière date. Le héro de 44 est un dessin de téléphone, et il y
reste.

**Deux pièges de mesure, notés pour la suite :**
- **Envelopper un libellé change ce qu'on mesure.** La flèche de tri avait d'abord été posée
  dans un `span` autour du libellé : rendu identique, mais l'en-tête n'avait plus de texte
  propre et son retrait se lisait contre la cellule (10) au lieu du tableau. Le relevé est
  passé de 314 à 330 écarts avant que la cause soit comprise. La planche garde le libellé en
  texte direct ; le code aussi, désormais.
- **Le seuil du moteur de règles.** Un style n'entre dans l'échelle admise que s'il paraît dans
  **deux planches** ou **trois fois**. La devise en Archivo 13 de la bande de 15.1 n'existe
  qu'une fois, dans une seule planche : l'écran qui la copie exactement est donc signalé. C'est
  le seuil qui parle, pas un écart — ne pas « corriger » ce style.

**Relevé v19** : 316 écarts visibles élément par élément ; par famille, 54 écarts (2 de
structure, 45 visibles, 7 mineurs), 62 familles conformes sur 75. Le moteur lit désormais les
planches **mesurées polices chargées** : sans elles, une famille de caractères relevée en
recours faussait l'échelle admise.

### La typographie en rem, et le plancher à 11 (18/09)

**La demande** : *« aligne la taille de police de tout le projet avec les standards
internationaux »*, puis *« fais des recherches sur les applications mobiles »*.

**Ce que disent les standards, vérifié.** Aucune norme internationale ne fixe de taille en
pixels. WCAG 2.2 — la référence normative, reprise par EN 301 549 — n'impose **aucune taille
minimale** ; elle impose que le texte puisse doubler (1.4.4), que la page se recompose à 320
(1.4.10) et que les réglages d'espacement de l'utilisateur s'appliquent (1.4.12). Material 3
pose corps 16, corps moyen 14, plus petite étiquette 11, **en `sp`** — donc suivant le réglage
de l'utilisateur ; Apple pose le corps à 17 pt, un plancher à 11 pt, et le Dynamic Type à douze
crans. Facebook et Instagram n'inventent pas de tailles : ils suivent le réglage du système.

**L'échelle des planches n'était donc pas en cause** : 11 · 12 · 14 · 16 · 17 est exactement la
plage de Material et tient dans celle d'Apple. **C'était l'unité.** Tout était en pixels figés,
et surtout `html{font-size:16px}` **écrasait le réglage du navigateur** : un lecteur qui
grossit le texte n'obtenait rien. La racine passe à `100%`, et 664 tailles et interlignes, plus
36 jetons, passent en rem — 14px devient 0,875rem, c'est-à-dire 14px. **Le relevé le prouve :
sur les 58 paires, rien n'a bougé d'un pixel.** L'application suit désormais le lecteur, comme
`sp` sur Android et Dynamic Type sur iOS.

**Plancher à 11.** Le produit descendait à 10 (les initiales d'un avatar, cinq emplois). Sur les
39 textes sous 11 px relevés dans les planches, **36 sont des annotations de planche** et les
trois autres vivent dans une étude de densité, dont deux exposants. Aucune planche de produit ne
descend donc sous 11 : le plancher d'Apple et de Material s'applique sans contredire personne.

**Accès prend la gouttière de 11.1** — `.card{padding:8px 20px}` — au lieu des 16 du gabarit,
qui restent vrais pour 04.1 et 05.2. **Et deux erreurs s'annulaient** : la page de cette fiche
posait 20 de gouttière au lieu des 16 de `.page`, ce qui compensait les 16 de la carte. Les deux
corrigées, le titre d'une permission tombe à 36 comme la planche l'écrit. Accès : 14 → 8 écarts,
le rôle ouvert 22 → 18.

**Deux choix laissés au produit, assumés** : la feuille d'incident garde « Immobilisé, à
réviser » présélectionné, comme 04.3 le dessine et comme 04.4 le confirme (*« aucun statut
nouveau : En réparation suffit »*) ; et la rangée « Mon compte » garde sa valeur — l'état du
code PIN — là où 14.1 met une sous-ligne sans valeur.

**Relevé v24** : 298 écarts visibles élément par élément (511 au premier appariement) ; par
famille, 54 écarts (2 de structure, 45 visibles, 7 mineurs), 62 familles conformes sur 75.

### Le héro, la rangée de liste, et une règle qui visait mal (19/09)

**L'initiale d'un héro ne se resserre pas.** `DetailHero` portait un interlettrage négatif sur
la vignette ; les planches y dessinent de l'Archivo 20 sur 30, en 600, sans resserrement. Vingt-
huit écrans le portaient. La page Paramètres, elle, redéclarait par-dessus sa propre vignette
(famille, corps, graisse) alors que le composant les donne déjà : la déclaration locale est
tombée, l'avatar n'est plus qu'une initiale passée au composant.

**La référence d'une rangée de liste est du chiffre à chasse fixe.** `ListRow` affichait sa
référence dans la police de texte en 13 ; les planches la posent en 12 sur 16, chasse fixe,
interlettrage 0,02em, chiffres tabulaires — c'est une clé qu'on lit en colonne, pas une phrase.
Treize écrans.

**Une règle qui visait mal vaut un faux écart.** `D-HERO-TILE` attendait 22 et lisait 20 sur
dix-huit écrans : elle appariait l'initiale ronde du héro avec les tuiles de mesures. Elle
exclut désormais les surfaces rondes. Ce genre d'écart ne se corrige pas dans le produit — il se
corrige dans la mesure, sinon on déforme l'écran pour satisfaire l'appareil.

**Ce que la mesure écarte, ajouté à la liste** : au tableau de bord, les rangées d'événements du
produit font 91 contre 56 sur la planche — non pas une gouttière, mais la longueur du libellé :
« Vous avez ouvert une session Kafui Charbel EKLU. » fait 48 signes là où la planche en dessine
18 (« Dell Latitude 7420 »). Ces événements de session sont écrits par les passes de mesure
elles-mêmes, qui se connectent à chaque tour.

**Relevé v26** : 303 écarts visibles élément par élément ; par famille, 48 écarts (2 de
structure, 42 visibles, 4 mineurs), 63 familles conformes sur 75, sur 165 états mesurés.

### Les trois saisies d'ajout quittent la fenêtre (19/09, second lot)

**Une saisie est un écran, pas une fenêtre.** 09.2 dessine « créer un modèle » avec la coque
de 04.3 — barre de 56, flèche de retour, le verbe seul à droite — et 15.4 fait de même pour une
dépense. Les trois saisies tenaient dans un `Modal` : au téléphone, une boîte qui remplissait
l'écran **sans en avoir la barre** ; au-delà de 600, un cadre de 560 avec un pied à deux
boutons que la planche ne porte pas. Le type, le modèle et la dépense prennent la coque de
plein écran ; c'était le dernier écart de **structure** du relevé du 13/09.

**Le type y gagne sa mise au net.** L'écran empruntait la palette MD3 : cartes cernées à
l'ombre, titres en capitales espacées (« CE QUE LE TYPE AUTORISE »), deux cartes à cocher de
120 de haut pour un choix binaire, une grille de pictogrammes à anneau jaune qui grossissait au
survol. La méthode d'amortissement passe à l'échelle courte `.seg` (deux crans, le pris en
surface), et le pictogramme à une case carrée sur le creux — `GlyphTile`, posée dans les
primitives, l'encre inversée pour le cran pris.

**Un acte court reste une feuille.** Renommer un site, ajouter un local, ajouter un
emplacement : un champ, parfois deux. Ils ouvraient un `Modal` — au téléphone, un écran entier
pour une ligne de texte. Ils prennent la feuille de 17.x, qui monte du bas au téléphone et se
centre à 560 au-delà de 600, avec son pied à deux colonnes égales.

**Trois défauts que le portage a mis au jour, et qui n'étaient pas de mise en page :**
- **Une route d'ajout n'en fermait pas une autre.** De `#/management/categories/add` à
  `#/management/models/add`, les deux saisies restaient montées l'une sur l'autre : invisible
  tant que c'étaient des fenêtres de 560, franc dès qu'elles occupent l'écran.
- **Un écran plein ne couvrait pas le chrome.** `FullScreenLayout` tenait `z-50`, la mesure de
  la barre du bas : ouvert par-dessus une page à onglets, la barre et le geste d'ajout le
  traversaient. Il passe à `z-[100]`, l'étage des surfaces qui couvrent ; le retour transitoire
  reste au-dessus, à 110.
- **Échap ne refermait rien.** `Modal` fermait sur Échap ; la coque qui le remplace ne le
  faisait pas — au clavier, une saisie ouverte par-dessus une page n'avait aucune sortie.

**Quatrième artefact de mesure, à ne pas « corriger »** : sur 09.2 et 15.4, le titre d'une
section part à 80 parce que la planche y dessine une pastille de 32 (`.si`) ; sur 04.3 et 05.3
la même pastille est **dans le balisage mais éteinte** (`display:none`, 7 occurrences chacune).
Une pastille qu'on laisse en place et qu'on éteint est une décision, pas un oubli : les
sections restent sans pictogramme, et les cinq écarts de position qui en découlent sont un
désaccord entre planches.

**Relevé v27** : 38 écarts (**1 de structure**, 33 visibles, 4 mineurs), 63 familles conformes
sur 73, 301 écarts visibles élément par élément sur 699 éléments appariés — neuf de plus qu'en
v26, les trois saisies étant enfin comparables à leur planche.

### L'échelle de type recalée, et les dernières familles (21/09)

**L'échelle de rôles venait d'avant les planches.** Les utilitaires `text-body-*`,
`text-label-*`, `text-title-*` — 290 emplois environ — lisaient un registre antérieur (34 · 28 ·
20 · 15 · 13 · 11) : une sous-ligne en 13 sur 19 là où les planches écrivent 14 sur 20, une
donnée en 15 sur 21 là où elles écrivent 16 sur 24, un petit libellé en 11 espacé de 0,075em
là où l'arbitrage du 13/09 fixe `.lab` en 12 sur 16, et trois titres en **700**, une graisse
qu'aucune planche ne dessine. Les jetons sont recalés sur l'échelle des planches — 28/32 ·
22/28 · 17/24 · 16/24 · 14/20 · 12/16, graisses 400 / 500 / 600 — et **le corps du document
prend `--t3`, 16 sur 1,5**, au lieu d'emprunter le cran « mention » : tout texte qui ne
déclarait pas sa taille sortait en 13. Relevé élément par élément inchangé à un écart près :
la bascule n'a rien fait déborder.

**Les pieds d'import n'ont qu'un bouton.** 04.3, 09.2 (deux fois) et 05.3 dessinent le même
`.pfoot` : « Importer 10 fiches », pleine largeur, et rien d'autre. Le produit posait aussi
« Annuler », grisé tant qu'aucun fichier n'était lu — on ne pouvait pas renoncer à l'import
avant de l'avoir commencé. La coque de formulaire gagne ce second gabarit (`footer-full`),
que son propre commentaire décrivait déjà.

**La fiche d'équipement** : la vignette du porteur, dans le héro, prend le bleu vif de la
marque à 24 % (elle tenait le bleu d'information de l'interface, absent de toute planche) ;
le chiffre de garantie prend l'interligne 1,05 et le resserrement de `.wrow .v` ; le numéro de
série perd l'espacement de 0,4 px que `.cp` ne donne à aucune valeur.

**Des copies locales remplacées par le composant partagé** : les boutons de filtre de Tâches
et d'Historique (écrits à la main, ils restaient à 48 dans le chrome de 768 où `FilterButton`
prend 40) ; les puces de la feuille de Tâches (une copie de `FacetChip` sur `Button`, lue
comme un bouton en 400) ; l'avertissement des accès (le rappel neutre de 02.2 en 12 sur 17,
là où 11.1 met l'ambre en 14 sur 20).

**Les barres** : l'écran introuvable reçoit sa flèche de retour et le nom court de la planche
(« Introuvable »), sa barre `0 8 0 4` et son titre à 60 ; la barre d'un rôle ouvert perd la
clé technique en sous-titre (R16) et prend 17 sur 24.

**Quatre règles de l'audit visaient mal, corrigées dans l'appareil** : `H-TOP-BLOCK` exemptait
le tableau de bord par composant propriétaire, qui avait changé le 17/09 (01.1 pose son
salut sur la toile, sans bloc blanc) ; `C-CARD` lisait `.bande` (14 20, dessinée ainsi en
01.1 et 16.1) comme une carte ; `L-VIG` lisait la garniture d'initiales, sans fond ou rognée
par son parent arrondi ; `M-ITEM` lisait le déclencheur d'un menu comme l'un de ses articles.

**Ce qui reste — huit écarts, tous expliqués et laissés** : l'anneau de focus que la passe
laisse sur un bouton de filtre et sur un champ après Échap (4 + 4 : le produit fait juste) ;
la pastille « dev » des comptes de démonstration en 11, que 02.1 dessine en 10 (le plancher
de 11 arbitré le 18/09) ; l'exposant de « 1er », en em ; la devise de 15.1 en Archivo 13,
propre à cette planche ; le point plein de `.opt.on .rd`, peint de l'encre du cran comme la
planche le fait ; et la note du héro d'un rôle, que 11.1 ne dessine pas — une question de
contenu, pas de style.

**Relevé v31** : **8 écarts** (0 de structure, 8 visibles), **73 familles conformes sur 73**,
296 écarts visibles élément par élément sur 696 appariés.

### Les tableaux du bureau, le geste d'ajout et la barre latérale (22/09)

**Un tableau de planche se tasse à gauche, et une colonne prend le reste.** Les `<colgroup>` de
04.1, 05.1, 18.1 et 15.3 laissent les colonnes à leur contenu (`.tbl td` en `nowrap`) et en
désignent **une** à `width:100%` — « Dernier mouvement », « État du compte ». `DataTable`
répartissait au contraire toute la largeur entre les colonnes (`max-w-0` sur chaque cellule) :
le tableau s'étalait d'un bord à l'autre, « Objets » partait à 1 030 là où 05.1 le pose à 700.
Il gagne `grow` ; dans un tableau qui en a une, les autres colonnes se tiennent à leur contenu
**jusqu'à un plafond** (leur `width`) — les exemples des planches sont courts, un parc réel
porte des noms de trente signes, et sans plafond Équipements débordait de 120 px.
La colonne de tête rend **42** comme sur les planches (leur `<col>` en demande 52, le tableau
la ramène à son contenu : 10 d'intérieur, la case de 18 et ses marges de 7) — la case garde
une cible de 48 par `touch-target`, sans toucher à la mise en page. Le tableau perd le filet
qui l'entourait : aucune des sept planches à tableau n'en dessine. Première colonne : 330 → 316,
la position de la planche.

**Au bureau, les chemins d'ajout sont un menu ancré.** 17.11 et 05.1 dessinent « + Ajouter ⌄ » ;
15.3 le dit : *« le geste avec ses trois chemins en menu ancré »*. Le bouton d'en-tête ouvrait
la feuille du téléphone, centrée en dialogue. `pageAction` reçoit `paths` : au bureau, un
`Menu` sous un bouton à chevron (légende « Nouvel équipement », trois chemins avec leurs
glyphes) ; au téléphone, le bouton rond ouvre toujours la feuille. `MenuItem` accepte un
glyphe Phosphor, pour le scan et le fichier CSV que la table des noms Material ne connaît pas.

**La barre latérale prend les noms des planches** : « Accueil », « Actifs », « Inventaire
physique » — les douze barres latérales de bureau les écrivent ainsi. Elle écrivait « Tableau
de bord » et « Équipements » : une page titrée « Actifs » s'ouvrait depuis une entrée
« Équipements ». « Rapports » reste : les planches de bureau ne l'y mettent pas, mais la
feuille « Plus » de 17.7 la tient pour une destination, et la retirer couperait les rapports
d'inventaire à qui n'a pas accès aux Finances.

**Ce que la mesure écarte, ajouté à la liste** : sur l'entrée active de la barre latérale, la
planche écrit le texte dans le lien peint lui-même, le produit dans un `span` à l'intérieur du
bouton peint — le rapprochement lit donc la planche contre la barre (50) et le produit contre
l'entrée (38), pour les mêmes pixels. Compter l'élément lui-même comme surface répare cette
paire et casse tous les en-têtes de tableau (le `th` collant du produit est peint, celui de la
planche non) : essayé, retiré. Au tableau de bord, la mosaïque du produit est celle **sans
campagne en cours** (trois cartes, l'État du parc sur toute la rangée) quand la planche dessine
l'état avec campagne ; les liens `.more` sont bien à 16 dans leur carte.

**Relevé v33** : 8 écarts, 73 familles conformes sur 73 ; 303 écarts visibles élément par
élément sur **730** appariés — trente de plus, parce que les noms de la barre latérale se lisent
enfin comme sur les planches.

### Finances et la file au bureau (22/09, second lot)

**Finances au bureau prend les deux zones de 15.1** — 7 et 5 : les postes à gauche, les
destinations à droite ; elles s'empilaient sur toute la largeur. La rangée d'un poste devient
la grille de `.dsk .post` : le nom et son restant (étiquette CAPEX/OPEX) dans la première
colonne, la jauge sur 140, les montants à droite sur 172 en 13 ; rangée de 64, **sans filet**
entre les postes. Les deux cartes prennent `.dsk .card`, `4 20 8`, et l'en-tête des postes dit
« consommé / enveloppe » au bureau — l'en-tête de la colonne des montants — là où le téléphone
garde le compte. « Exercices », la seconde carte de droite, n'est pas posée : l'écran qu'elle
ouvre n'existe pas encore.

**La bande de Finances mesure 112, pas 108.** 15.1 écrit la légende `.k` **en ligne** dans son
lien : sa ligne prend la hauteur du corps (24) et non ses 16. Le produit garde 12 sur 16 et rend
l'écart par la marge (8 au lieu de 4), sans inventer un interligne que l'échelle n'a pas.

**La file : les pastilles avant le menu.** 03.3 pose « À faire · À suivre · Historique » puis
« Toutes les natures ⌄ », à 12 l'une de l'autre comme tous les outils, le tri seul poussé à
droite. Le gabarit posait le menu de filtre devant les pastilles, et le groupe des pastilles
s'étirait sur la ligne (8 entre elles). Seule la file porte les deux.

**Écartés, sans correction** : sur l'Inventaire physique, « Jamais vérifié » de la rangée
rapproché de « jamais vérifié » de la bande (appariement sans casse) ; l'Historique au bureau
porte dans la planche une colonne d'actes au survol (⋮) que le produit n'a pas encore — un
manque de fonction, pas d'espacement — et ses colonnes se partagent la largeur selon le contenu
d'exemple. **Piège** : un relevé de tablette revenu à 3 141 rangées (157 états) a été refait,
pas lu ; le second en compte 8 839.

**Relevé v34** : 8 écarts, 73 familles conformes sur 73 ; élément par élément 303 → **291**
(Finances au bureau 12 → 6, tableau de bord 17 → 13, file 13 → 11).

### Les écrans du téléphone, rangée par rangée (22/09, troisième lot)

**La précision d'une section suit son titre.** Les trois planches de création l'écrivent dans le
paragraphe du titre (`<p class="ct">Configuration <span class="cs">…`) ; `FormSection` la calait
au bout de la ligne, en voisine. Elle passe dans la ligne, 8 après le titre, en **12 sur 16 à
l'encre tertiaire** — la forme de 05.3 et 09.2 ; 04.3, seule, la dessine en 14 sur l'encre
secondaire.

**L'unité fait partie de la valeur.** 04.3 écrit « 1 250 XOF » d'un seul tenant, en 16 sur
l'encre pleine ; le suffixe de `InputField` était une mention grise en 12. Un champ ne peut pas
faire suivre ce qu'on tape : l'unité garde le bout du champ, mais prend la taille de la valeur.

**Le retrait se voit avant de se lire.** 11.1 passe à l'encre tertiaire le nom d'une page où le
rôle n'a « Aucun » accès (`.row.z`) — `RuleGroup.Row` reçoit `off`. 09.1 passe à l'encre
secondaire un type sans modèle (`.lrow.mute`) — `ListRow` reçoit `muted`. L'état le disait déjà ;
le retrait le fait voir d'un coup d'œil.

**La fiche d'une personne, au bureau : l'historique à gauche.** 05.2 le pose sous ce qu'elle
détient à 1280, et après le compte et les accès à 393. `DetailTemplate` reçoit `asideTail` —
ce qui ferme la colonne de gauche en deux colonnes, et la page en une.

**Accès** : la rangée « 5 groupes » reçoit sa vignette de 40 et la sous-ligne de 11.1 mot pour
mot (« Ce qui s'ajoute aux rôles »), à **12** de sa vignette — la rangée partagée tient les 16 de
05.2, et 11.1 en dessine 12.

**Écartés, sans correction** : les feuilles d'acte (sortir du parc, incident) mesurées vides là
où la planche les dessine remplies — un choix fait, des photos prises, le bouton actif ; les
pastilles d'import (`.chp`) appariées au `<b>Type</b>` de la phrase dessous ; « Auditeur externe »
et « Périodicité », dont la sous-ligne réelle diffère de l'exemple.

**Relevé v35** : 8 écarts, 73 familles conformes sur 73 ; élément par élément **290**.

### Le défilement du bureau (22/09)

**Au-delà de 600 px, rien ne défilait.** Le verrou de la dimension mobile — `html, body, #root
{ height:100%; overflow:hidden }` sous `@media (min-width: 600px)` — fixe la racine à la fenêtre
parce que c'est `.tk-frame-scroll` qui défile, à l'intérieur de l'appareil. Il était posé sans
condition et a survécu à la levée de `MOBILE_ONLY` (08/09) : sans cadre, la page était coupée
au bas de la fenêtre sur toutes les destinations — 1 228 px d'Actifs, 3 036 d'Équipe, dans
900. Il ne s'applique plus que sous `html:has(.tk-frame)`.

**La barre latérale partait avec la page.** `body` et `#root` portaient `overflow-x: hidden`,
qui en fait des conteneurs de défilement ; la barre, `sticky top-0`, se collait à eux — qui ne
défilent jamais — et non à la fenêtre. Ils passent à `overflow-x: clip` : le débordement
latéral est coupé de la même façon, sans conteneur. Vérifié à la molette à 393, 768 et 1280 :
chaque page défile jusqu'à sa fin, la barre latérale reste en place.

**Pourquoi la mesure ne l'avait pas vu** : le relevé lit `getBoundingClientRect` sur tout le
DOM, et un contenu coupé se mesure quand même. Seul un défilement réel — molette, puis
`scrollY` — le révèle.

### 18.1 — l'Historique, porté en entier (22/09)

Le portage du 07/09 n'avait pris que deux colonnes sur six : le journal au repos et le tableau
du bureau. Les quatre autres sont portées, et avec elles ce que le journal devait écrire pour
qu'on puisse les relire.

**Un fait, pas une description.** La couche de données écrit « Statut mis à jour:
PENDING_DELIVERY » ; la planche veut « LFW-PF5XK2M remis ». `features/history/lib/journal.ts`
fait la traduction, une fois, pour les trois lectures : le titre (le code d'actif et le
participe), la préposition de l'autre partie (« à Karim Diallo », « par Jane Smith », « pour
Fatou Ndiaye »), la méthode, le lieu, la nature et la marque. Un fait qu'il ne sait pas nommer
garde sa description. La nature suit la **source** de l'acte avant son type : une campagne
d'inventaire écrit des `CREATE`, un incident un `UPDATE` — « Inventaires » comptait zéro.

**La feuille : trois axes.** La période gagne **Exercice** (le mois de début vient de Paramètres,
comme aux Finances). **Personne ou objet** se cherche au lieu de se choisir en chips : la
recherche et la liste de 06.4, les personnes puis les objets, chacun avec son nombre de faits,
et seulement ceux que le journal cite. Au bureau, la troisième pastille ouvre ce choix en
dialogue — `FilterMenuChip` reçoit `onOpen`. La période **au repos** (30 jours, ou tout pour Mon
historique) n'est pas un filtre posé : le badge ne compte que ce qui s'en écarte, comme la
colonne « aucun fait » le montre (deux filtres pour « Inventaires · 7 jours »).

**Le fait ouvert montre sa preuve.** Le fil `.trail` reprend `HandoverTrail` : un passage de main
écrit deux faits, ouvrir l'un montre les deux attestations dans l'ordre, et la seconde qui
manque encore se dit (« n'a pas encore confirmé »). Une réception est attestée **par qui
reçoit**, même écrite depuis la session de qui remet. La signature enregistrée ne se montre que
si elle était déjà posée au moment du fait : la remplacer purge l'ancienne, et montrer la
nouvelle sous un fait plus ancien ferait attester un trait qui n'a pas été apposé. Deux renvois,
l'objet et la personne, quand ils existent encore et qu'on peut les ouvrir. `BottomSheet` reçoit
`subtitle` (`.sttl .sub`).

**Ce que le journal écrit désormais.** Une remise écrit sa preuve dans l'événement (`proof`,
copie de `handoverProof`, que la remise suivante remplace sur l'objet) et sa méthode par son
code (`method`) ; toute écriture d'objet écrit le **lieu au moment de l'acte** (`location`). Les
faits antérieurs ne les portent pas : leur colonne dit « — » et leur fil « méthode non
consignée » — rien n'est reconstitué.

**Mon historique.** Le journal entier se lit par qui lit les rapports ; les autres y arrivaient
quand même par l'adresse et **lisaient tout** — `HistoryPage` lisait `events` sans le
périmètre de `useHistory`. Ils lisent maintenant ce qui les concerne (leurs actes, ce qui leur
a été remis ou repris, leurs demandes, leur compte ; ni la sécurité, ni l'histoire d'un objet
d'avant qu'ils ne le tiennent), sans recherche, l'entonnoir dans la rangée du titre, sous le
nom de la planche. La rangée « Mon historique » est dans « Plus » et dans la barre latérale
(`useNavigationDestinations` reçoit `libelles`). Le responsable lit son équipe, par
`useHistory`, dont `filterEvents` devient stable.

**Au bureau.** Le ⋮ au survol (ouvrir le fait, l'objet, la personne) — `DataTable` n'ouvre plus
la rangée sous sa cellule d'actes, et `Menu` reçoit `floating` : posé en absolu, le cadre du
tableau le rognait à la hauteur des rangées. La colonne « Fait » prend le reste (`grow`). Le
tri (« Plus récent » / « Plus ancien »), et **les suivants au défilement** par cinquantaine
(« 50 sur 496 · les suivants au défilement »). L'export suit `canExportReports`.

**Deux défauts trouvés en chemin, antérieurs au portage.** `navigateToView` n'avait pas
d'entrée `history` : la rangée de « Plus », celle de la barre latérale et « Tout l'historique »
de l'accueil **ne menaient nulle part** depuis le 07/09 — seule l'adresse ouvrait la page. Et
`history` manquait à la liste des vues qui gardent la barre du bas, que 18.1 dessine avec
« Plus » allumé. Le titre d'un dialogue sans poignée collait au bord (4 px) : `BottomSheet`
pose 16 dans ce cas, comme `ActSheet`.

**Mesuré à 393** : jour 8 / 16 rayon 8, en-tête 48 (`8 0 4`, 17 / 24 en 500, compte 14 / 20),
rangée 56 (60 sur deux lignes), gouttière 12, marque 32, fait 16 / 24, sous-ligne 14 / 20,
âge 12 / 16 tertiaire ; `.more` 48, 16 en 500, filet ; `.ord` 12 / 16 ; titre de feuille
22 / 28 Archivo `-.015em`, sous-titre 14 / 20 à 4. **Non mesurable** : la signature apposée
(aucun fait du jeu n'est postérieur à la méthode `pin+signature`) et l'état « à confirmer »
(aucune remise en attente dans le jeu).

### La connexion au bureau : le plein champ (22/09)

**Au bureau, la connexion n'était que celle du téléphone élargie** — un bandeau sombre de 200,
une colonne de formulaire, un grand vide, les comptes de démonstration relégués en bas. Trois
directions ont été proposées (panneau de marque, plein champ, bandeau et carte) ; le
commanditaire a retenu **B, le plein champ**.

Au-delà de 600, la page devient le bleu-noir de la marque et **le cartouche LIVE la traverse** :
les angles emboîtés coupés par le bord gauche, la diagonale olive par l'angle haut-droit, le
triangle bleu au bord droit, un filet bleu dans l'angle bas-gauche, et l'unique accent plein —
les deux arcs orange de l'angle bas-droit, en quart d'anneau. Quatre cadres ancrés aux coins,
jamais étirés ; sous 1 200 ils se réduisent d'un tiers, pour qu'aucun filet ne passe derrière
« Tracker » (refus déjà prononcé au bandeau). Le bloc de marque se centre au-dessus d'**une carte
blanche de 440** — titre « Connexion », les champs, le lien, le geste jaune — et les comptes de
démonstration passent sous la carte, sur le sombre. Mot de passe oublié et lien envoyé prennent
la même carte.

`AuthShell` reçoit `field`, `AUTH_PANEL` (dans `authLayout.ts`) fait la carte, `BrandBanner` se
centre au-delà de 600 et porte `BrandField`. **Le téléphone ne change pas.** Les écrans de 02.2
qui portent le bandeau prennent la même forme ; ses étapes à barre (mot de passe, code PIN) non.
La planche 02.1 ne dessine que le téléphone : la vue bureau n'y est pas ajoutée sans demande.

### L'échelle de type par régime : le bureau descend d'un cran (22/09)

**La demande** : *« aligne la taille de police de tout le projet avec les standards
internationaux, facebook, instagram, notion, etc… desktop comme mobile »* — la seconde fois,
après le 18/09, où seule l'unité avait changé (px → rem) et pas un pixel.

**Le constat.** Le produit rendait **les mêmes tailles au téléphone et au bureau** : corps 16,
titre de rangée 17, titre de page 28. Au téléphone c'est la norme — iOS (Title 1 28, Title 2 22,
Body 17), Material (Headline 28, Title 22, Body 16 / 14) ; Facebook (15) et Instagram (14) sont un
cran en dessous. Au bureau c'est un cran au-dessus de tout le monde : Notion, Linear, GitHub et
Facebook web tiennent leur interface en **14**, leur secondaire en 12-13, leurs titres de page
entre 20 et 32.

**L'arbitrage du commanditaire (22/09)** : bureau dense, téléphone inchangé, planches intactes.

| Rôle | Téléphone | Bureau |
| --- | --- | --- |
| Titre de page | 28 / 32 | **24** / 32 |
| Titre de feuille | 22 / 28 | **20** / 28 |
| Titre de rangée | 17 / 24 | **15 / 22** |
| Corps | 16 / 24 | **14 / 20** |
| Geste (pastille, initiales) | 15 / 20 | **14** / 20 |
| Secondaire | 14 / 20 | **13 / 18** |
| Légende, plancher | 12 / 16, 11 | inchangés |

**Le régime du bureau = une fenêtre de 840 et plus *et* un pointeur fin.** La largeur seule ne
suffit pas : un téléphone couché dépasse 840, et une tablette tenue au doigt garde les tailles
qu'on lit à bout de bras. Les champs de saisie gardent 16 au téléphone — sous 16, iOS agrandit
la page au focus.

**Comment.** Six utilitaires `text-ts-{page,sheet,head,body,control,sub}` (la taille seule) et
`leading-ts-*` (l'interligne seul), déclarés en `@utility` dans `index.css`, lisent des jetons
`--tk-ts-*` et leurs pendants `-bureau`. Un jeton n'étant déclaré qu'une fois (garde des jetons),
la bascule vit dans les règles, comme l'échelle compacte. Les **rôles maison**
(`text-body-large`, `text-title-large`, `.page-title`…) basculent dans un bloc posé après la
dernière classe de rôle, et le `body` avec eux. 432 tailles écrites en dur dans 77 fichiers sont
passées aux utilitaires, avec leur interligne quand il était apparié dans la même chaîne ; une
taille seule hérite de son interligne, comme `text-[1rem]` le faisait. `cn()` connaît les douze
classes, et `check-cn-merge` les vérifie désormais (82 cas).

**Ce qui reste en dur, à dessein** : le chrome déjà dense du bureau (tableau `DataTable` en 14,
barre latérale en 13, pastilles à menu, champ de recherche dense, boutons d'en-tête de 40), les
tailles préfixées (`large:text-[0.875rem]`), la légende, le plancher et les chiffres de héros.
L'exposant de « 1er » (0,7em) tombait à 9,8 au bureau : il est borné à 11.

**Mesuré, avant et après, sur les mêmes données.** Firestore étant au bout de son quota, deux
serveurs ont tourné sur les données de démonstration : l'arbre actuel, et une copie où la passe
est inversée. Sur treize écrans : **à 393, zéro écart** ; **à 1280, 237 écarts**, tous dans le
sens voulu (77 corps 16 → 14, 72 secondaires 14 → 13, 20 titres de rangée 17 → 15, 18 titres de
page 28 → 24, 13 titres de feuille 22 → 20, le reste hérité).

**Le relevé des planches comptera ces écarts au bureau** : ils sont voulus. Les planches
dessinent toujours le bureau aux tailles du téléphone.

### La feuille d'acte ne monte plus à 97 % (22/09)

**Le choix d'un bloc reste dans la feuille** — la planche le dit : *« la feuille s'ouvre sur le
choix du bloc 1 … Pas de stepper, pas de page »*. Mais elle dessine quatre objets ; le parc en
propose 72 à remettre et 117 à retourner, et la feuille montait avec sa liste jusqu'à **97 %**
de l'écran (94 % au bureau) : une page, sans ses atouts. Elle prend désormais **75 %, fixes**
quand la liste est longue (plus de six rangées) — fixes, pour ne pas sauter de hauteur à chaque
lettre tapée —, plafonnés à 75 % quand elle est courte ; **la recherche et l'intitulé du groupe
restent en place**, seule la liste défile. La page d'où la feuille vient reste lisible au-dessus.
L'acte lui-même (date, attestation, conséquence) suit son contenu jusqu'à 90 %, le plafond de
`BottomSheet`. Vérifié au téléphone et au bureau, pour « Lequel ? » comme pour « À qui ? ».

### L'attestation a son étape (22/09)

**La demande** : *« la carte de signature de la feuille est de petite hauteur et trop
rectangle ; remplace le libellé Effacer par une icône ; on peut carrément avoir une feuille
dédiée pour signer / PIN »*.

**Mesuré avant de choisir.** La feuille « Remettre l'équipement » faisait **745 px** sur un
téléphone de 852, pour un plafond de 767 (90 %). La case de signature — 353 × 120, trois
fois plus large que haute — ne pouvait gagner que 20 px sans faire défiler la feuille. Le
commanditaire a tranché pour l'étape dédiée, **contre 17.4** (*« Votre attestation — et
c'est un bloc, jamais un écran »*).

**Deux temps, une seule feuille.** Le récapitulatif (l'objet, l'autre partie, la question,
ce que cela déclenche) se clôt par **Continuer** ; l'étape suivante ne porte que
l'attestation, avec **Retour** et le verbe de l'acte. La feuille change de contenu comme elle
le fait déjà pour choisir un bloc : pas d'écran, pas de page de validation. Revenir au
récapitulatif rend l'attestation. Appliqué aux trois feuilles qui attestent : `ActSheet`
(remettre, recevoir, rendre, réceptionner, trancher une demande…), **Sortir du parc** (où
Continuer attend le motif) et **Déclarer un incident**.

**La case prend 4:3**, plafonnée à 320 px et à 42 % de l'écran : **353 × 265** au téléphone,
520 × 320 au bureau. La signature apposée par le code occupe la même case. Le canevas se règle
sur la taille affichée, à la densité de l'écran — il était dessiné à 720 × 240 puis étiré, ce
qui aurait écrasé le trait à 4:3. **Effacer devient la gomme**, un bouton d'icône de 40 à la
place de l'invite « signez ici ».

**Mesuré après** (393 × 852, données de démonstration) : récapitulatif 537 px, attestation
520 px — plus aucune des deux ne touche le plafond. L'incident et la sortie du parc gardent un
récapitulatif qui défile (photos, crans, commentaire), leur attestation tient en 512.

### L'en-tête reste (22/09)

**La question** : *« normalement les headers doivent être fixes non ? »* — oui. 17.8 :
*« L'en-tête est fixe ; le contenu défile »* ; 04.1 le redit de la recherche, 01.1 au bureau
(*« barre latérale et en-tête restent »*), 04.2 de l'en-tête de fiche. Le code n'en tenait
aucun : sur 15 routes, le titre sortait de l'écran au premier défilement.

**Posé** : le bloc d'en-tête de `ListTemplate` et de `DetailTemplate` dans un conteneur
`sticky top-0` sur le fond du canevas ; même règle pour les six pages qui dessinent leur
propre en-tête (Tableau de bord, Catalogue, Finances, Paramètres, Emplacements, Rapports).
Là où l'en-tête du bureau n'avait pas de fond, il remonte dans la marge du haut et la reprend
en padding : posé, le titre n'a pas bougé ; collé, il ne touche pas le bord.

**Mesuré** : 15 routes × 393 et 1280, titre à la même hauteur avant et après 700 px de
défilement, partout. **Pas fait** : la ligne des colonnes des tableaux du bureau part encore
avec les rangées — aucune planche ne la fige, on ne l'invente pas.

### Le bureau prend de l'air : rail d'icônes, gouttière, mesure, cartes de taille fixe (22/09)

**La demande** : *« le menu latéral rétracté déborde avec les icônes et leur libellé […] le
margin du desktop est trop petit, ce qui fait que les cartes apparaissent trop larges avec
beaucoup d'espacement vide […] évite que les cartes aient une taille très petite à vide, je
préfère qu'elles aient une taille fixe avec une bonne gestion d'état à vide »*.

**La barre repliée ne montre que les glyphes** — 64 px au lieu de 88, des carrés de 40, le
nom en infobulle et en nom accessible, la pastille des tâches au coin du glyphe, et un blanc
de 12 entre les groupes. 17.11 posait le mot en 11 sous le glyphe, dans 72 × 64 : les noms
longs s'y coupaient (« Emplace… »). Le rail de la tablette, qui est la même barre, suit.

**La gouttière suit la fenêtre** : `--tk-space-page` passe de 24 à `clamp(24px, 3vw, 40px)`
— 24 au rail, 38 à 1 280, 40 dès 1 334. Une seule déclaration (le garde des jetons interdit de
la redéclarer par régime) ; Finances et Rapports, qui la lisent en `calc`, suivent.

**Le contenu se centre au-delà de 1 280** (`AppLayout`, dès 840) : à 1 920 la page faisait
1 632 px — des cartes de 1 300 px pour trois lignes, un tableau dont la dernière colonne
prenait la moitié de l'écran. Elle en fait 1 200 entre deux gouttières, le canevas continue de
chaque côté.

**Les cartes du tableau de bord ont une taille fixe** (grille de 1 280) : **448** pour la file
et les événements, **320** pour la mosaïque. Une liste plus longue défile dans sa carte, le
renvoi (`.more`) se cale au pied. La note qui gardait au héro « sa hauteur naturelle » (deux
lignes, 128 px, à côté d'événements de 440) est remplacée : le héro remplit sa case et centre
son vide.

**Une carte vide garde sa place** — `CardEmptyState`, composant partagé : pastille de 48, le
fait en 16 / 500, ce qu'il veut dire en 14, **160 px au moins** hors grille. Posé sur les vides
du tableau de bord (file, événements, types en tension, budget, équipements du porteur) et sur
l'historique vide des fiches d'un objet et d'une personne. Ce n'est pas `ScreenState` (17.1),
qui occupe un écran.

### Une seule grille au tableau de bord (22/09)

**La demande** : *« améliore le style de grille de la version desktop »* — précisée : la grille
des cartes du tableau de bord.

**Relevé** : trois découpes sur trois rangées — la file et les événements en `8fr 4fr`, la
mosaïque en 7/5, État du parc sur 12. Aucun bord ne tombait sous celui du dessus (à 1280 :
915 / 931, puis 834 / 850, puis rien). Et les cartes larges étaient vides : 03.1 y pose un
`.duo` (Budget : la jauge et **trois montants** ; État du parc : **deux jauges côte à côte**)
que le code n'avait jamais porté.

**Posé** — arbitrage du commanditaire, contre la mosaïque 7/5 · 5/7 de 03.1 :
- **Une seule grille de 12 colonnes**, rangées de 448 puis 320 : la gouttière entre la file et
  les événements est la même ligne que celle des cartes du dessous.
- **Sans campagne** : Budget, État du parc, Types en tension, un tiers chacun.
  **Avec campagne** : Budget 8 · Inventaire 4, puis État du parc 8 · Types en tension 4 — la
  colonne de droite reste celle des événements, et les cartes de 8 prennent le `.duo`.
- **Budget porte ses trois montants** (Consommé, Restant, Renouvellement <ligne>) ; dans la
  grille, le renouvellement quitte la note d'État du parc, comme sur la planche.

**Mesuré** à 1280, 1440, 1600 et 1920, avec et sans campagne (campagne simulée par un
interrupteur local retiré aussitôt) : bords identiques d'une rangée à l'autre, aucun
débordement de carte. La bande de chiffres garde ses cinq cases : cinq ne se posent pas
sur douze colonnes.

### Moins par rangée, des axes qui se déplient (22/09)

**La demande** : *« la liste user, des registres et des feuilles est un peu dense ; fais des
recherches UI en ligne pour nous proposer quelque chose »*.

**Ce que dit l'état de l'art.** Material 3 : une rangée à deux lignes fait 72 dp et ne porte
**qu'une** ligne secondaire ; une feuille modale ne s'ouvre pas au-delà de la moitié de
l'écran et ne porte que l'essentiel. NN/g (divulgation progressive) : ce qui sert souvent
reste sous les yeux, le reste se déplie — le seul vrai risque est de cacher ce dont on a
besoin. Pencil & Paper (tables d'entreprise) : 40 / 48 / 56 px de rangée selon la densité
voulue, et surtout **ne pas répéter dans la cellule ce que dit l'en-tête**, garder les filets
fins pour réduire le bruit.

**Mesuré avant.** Catalogue : rangée de 64 portant **quatre** faits — le type, « 2 modèles »,
« 4 actifs dans le parc », et la **clé technique** en chasse fixe (`Laptop`,
`DockingStation`). Emplacements : trois compteurs (« 8 actifs · 8 personnes · 1 local »).
Feuille de filtre de l'Équipe : quatre axes, **22 puces, 800 px** sur un écran de 852.
Actifs : cinq axes, dont l'emplacement qui porte les sites *et* les locaux.

**Ce qui change, et contre quelle planche.**

- **Catalogue (09.1)** : la clé technique quitte la rangée — elle sert aux imports, pas à
  reconnaître un type, et se lit sur la fiche, carte « Référence ». « rien pour en créer »
  tombe aussi : la pastille « aucun modèle » le dit déjà, deux centimètres plus haut. La
  rangée garde le type, les actifs, et le nombre de modèles à droite.
- **Emplacements (10.1)** : deux chiffres au lieu de trois. Le compte des locaux quitte la
  rangée, comme les locaux eux-mêmes l'ont quittée — la planche écrit déjà *« les locaux
  sont dans la fiche du site, pas dans la liste »*.
- **Les feuilles de filtre** : un axe montre **six valeurs** et nomme le reste (« Voir les 3
  autres »). La valeur retenue reste toujours visible, où qu'elle soit dans la liste — c'est
  le « mauvais partage » que NN/g décrit. Composant partagé `FacetChipGroup` (Équipe) ; la
  feuille des Actifs reçoit la même règle sur ses axes longs (Emplacement, Type), par son
  `SheetGroup`.

**Mesuré après** (393 × 852) : feuille de l'Équipe **678 px** (767 une fois un axe déplié),
feuille des Actifs **639 px**, aucune des deux ne défile. Les rangées gardent leurs mesures —
68 au téléphone, 48 au tableau du bureau : ce n'était pas la hauteur qui était dense, c'était
le nombre de faits.

**Non touché** : l'Équipe au téléphone (rangée à deux lignes, déjà conforme) et son tableau
de bureau (cinq colonnes, rangées de 48).

### Deux faits par rangée au téléphone (22/09, second lot)

**La demande**, précisée : *« liste des équipements, utilisateurs, et feuilles utilisateur et
équipement pendant affectation et retour — bref toutes les listes en version mobile »*.

**La règle existait déjà, et n'était pas appliquée.** `ListRow` la documente depuis le 20/08 :
*« Deux faits au téléphone, quatre au-delà (00.4) : le modèle et la date apparaissent dès
`medium` parce que la place existe. »* Material 3 dit la même chose — une rangée à deux lignes
ne porte qu'une ligne secondaire — et NN/g y ajoute que le reste se relève, il ne s'affiche pas.

**Mesuré à 393 :**

| Liste | Avant | Après |
| --- | --- | --- |
| Actifs | 4 faits : code, **type**, état ou porteur, **ASSET-10001** | 2 : code, état ou porteur |
| Dépenses | jour · poste · **référence de pièce** · état | jour · poste · libellé · état |
| Choisir un objet / une personne (remise, restitution) | nom, sous-ligne, **chevron sur chaque rangée** | nom, sous-ligne |
| Équipe | nom, site · objets détenus | inchangé — la rangée n'en portait que deux |
| Tâches, Historique, Inventaire, Accès | 2 faits + l'âge ou le geste | inchangés |

**Deux identifiants pour un objet** : la rangée d'un actif portait son code (`LPT-HQ-01`) **et**
sa référence (`ASSET-10001`), sur 393 px. Le type et la référence reviennent dès la tablette,
et se lisent de toute façon sur la fiche.

**Le chevron par rangée tombe** dans les listes des feuilles d'acte : c'est l'arbitrage du
07/09 sur la feuille « Plus » — *« toutes les rangées mènent ailleurs, la flèche ne distingue
rien de sa voisine »* — appliqué au choix de l'objet et de la personne.

### Actifs au bureau, relu sur 04.1 et 17.11 (22/09)

**La remarque** : *« la version Actifs de desktop n'est pas fidèle à la planche »*. Relevé
contre 04.1 (colonne « Vue — bureau à 1280, le tableau ») et 17.11 (la ligne d'outils), en
mesurant l'écran à 1280 :

| Ce que la planche pose | Ce que le code faisait | Corrigé |
| --- | --- | --- |
| `.lead` 52, vignette de 32 au repos, la case au survol | colonne rendue à 42, **vide** au repos | oui — `rowLead` dans `DataTable`, le pictogramme du type |
| `th` « État », « Site · local » | « Statut », « Site / local » | oui |
| `.fchip` de 17.11 : pastille cernée de 40, « Filtrer » en 13/500 | carré muet de 40 | oui — et les cinq listes du bureau en profitent |
| `.tbl tr.foc` : anneau de 2 au dedans, mêmes révélations | rangée **ni atteignable ni ouvrable au clavier** | oui — `tabIndex`, Entrée et Espace, anneau 2 px |
| ⋮ de rangée au survol, menu de la rangée, clic droit | absent | **non** — voir ci-dessous |

**Mesuré après** : champ 320 × 40, pastille 40 en 13/500 cernée, tri 13/500, `.lead` 52,
rangée 48, en-tête 40 en 12/500, anneau de focus `2px solid` à `-2px`.

**Le ⋮ de rangée, posé ensuite** (même jour, après arbitrage). La planche lui donne cinq
verbes ; trois d'entre eux — attribuer, restituer, réaffecter — sont **des adresses**
(`/wizards/assignment`, `/wizards/return`), et « Modifier la fiche » aussi. La rangée les
ouvre donc par les mêmes adresses que 04.2 : aucun acte n'est recopié, aucune feuille ne
déménage. Le verbe du milieu suit l'état, comme le bouton de la fiche.

**La sortie du parc n'y est pas**, et c'est délibéré : c'est l'acte le plus destructeur, il
s'atteste (17.4, bloc 4) et garde ses deux portes existantes — la fiche, et la sélection
multiple avec sa confirmation. Le paramètre `context=` de la fiche n'a pas été recopié :
personne ne le lit.

**Mesuré** : colonne d'actes à 48, ⋮ invisible au repos, révélé au survol et au focus, menu
ancré sous lui (« Ouvrir la fiche · Attribuer · Modifier la fiche » sur un actif
disponible), et « Attribuer » ouvre l'assistant sur le bon actif.

**Reste ouvert** : en cartes, de 840 à 1279, la planche montre aussi un ⋮ sur la rangée
survolée. Pas fait.

### La mesure du bureau sur les autres pages (22/09)

**La demande** : *« améliore le style de grille de la version desktop sur les autres
pages »*. Mesuré à 1440 (1 200 px de contenu) avant de toucher :

- **Paramètres, Accès, Rapports, Catalogue, Emplacements, Dépenses** : un corps qui est une
  colonne de rangées, étiré sur 1 200. Le nom d'un réglage à gauche, sa valeur à 1 100 px de
  là — l'œil perd la ligne. C'est le défaut que `Reading` corrige au téléphone et qu'il
  relâchait au-delà de 1 200.
- **Fiches (04.2, 05.2), Finances, Inventaire** : deux colonnes 7/5 remplies, rien à reprendre.
- **Actifs, Équipe, Historique** : des tableaux, qui se balayent et remplissent ce qu'on leur
  donne. Ils gardent toute la largeur.

**Posé** : `.main.read` de 17.11 — **1 008 px de contenu** — sur les corps en colonne, au-delà
de 1 200 comme en deçà. `Reading` prend un `desk`, `ListTemplate` borne le gabarit entier
(gouttières comprises) sauf en tableau et sauf à deux zones, et les deux pages à mise en page
propre (Catalogue, Emplacements) bornent leur en-tête **et** leur corps sur la même valeur.

**Mesuré après**, à 1440 : les six pages en colonne se terminent toutes à 1 008 de contenu,
au pixel près ; les tableaux et les pages à deux zones sont inchangés ; les 45 en-têtes fixes
(15 routes × 393, 1280, 1920) tiennent toujours.

**Pas vérifié** : Tâches (03.3), dont le corps à deux niveaux demande une file non vide — les
données de démonstration n'en portent aucune.

### Finances au bureau, relu sur 15.1 (23/09)

**La remarque** : *« la page finance n'est pas alignée avec la planche »*. Relevé contre la
colonne « Vue — bureau à 1280 » de 15.1 et sa feuille `finances.css` :

| Ce que la planche pose | Ce que le code faisait |
| --- | --- |
| `.dhead` : le titre, **la sous-ligne** « Exercice 2026 · en cours · au 3 septembre » (14/20), puis **« Changer d'exercice »** et **« Enregistrer une dépense »** (jaune) | titre seul, un ⋮ de deux verbes, et un sélecteur d'exercice **pleine largeur** que la planche ne dessine nulle part au bureau |
| `Aller à` — **trois** destinations : lignes, dépenses, **rapports** | deux |
| **La carte « Exercices »** dans la colonne de droite (`.zcol`) | absente : l'exercice ne se changeait que par le sélecteur |
| Le pied de la carte des postes : **« Ajuster les enveloppes »**, rangée de 48 | absent — la carte disait l'état des postes sans offrir de les corriger |
| `.dsk .lrow` et `.dsk .post` : **pas de filet**, fond au survol à rayon 4, rentrés de 8 | filets entre les rangées, aucun survol |

**Posé**, au bureau seulement — le téléphone garde son ⋮, son sélecteur et ses deux
destinations, comme les trois colonnes de la planche le dessinent. « Changer d'exercice »
ouvre un menu ancré à son bouton : l'écran « Exercices » du téléphone n'existe pas, et 17.11
interdit une coordonnée écrite à la main.

**Mesuré après** (1440) : sous-ligne 14/20 en encre secondaire, rangées sans filet à rayon 4
avec leur fond au survol, trois destinations, et la carte « Exercices » qui n'apparaît que
s'il existe un autre exercice — les données de démonstration n'en portent qu'un.

### L'en-tête d'une liste perd une ligne au téléphone (23/09)

**La demande** : *« 243 actifs · tous les états · 20 affichés · 243 au parc — sur la version
mobile il rallonge trop la hauteur des header »*.

**Mesuré** : l'en-tête d'une liste faisait **159 px** avant la première rangée — titre 48,
recherche 48, ligne de service 18 et ses gouttières. La ligne coûtait **30 px** pour y écrire
un nombre.

**Ce qui change, au téléphone seulement :**

- **Le nombre rejoint le titre** — « **Actifs** 14 actifs », comme `.cnt2` au bureau, aligné
  sur la première ligne du titre, en 12 sur 16, qui cède avant lui.
- **Le tri monte dans la bande de recherche** : un bouton d'icône de 48 entre le champ et
  l'entonnoir, qui dit son cran par son nom accessible et son infobulle. C'était le seul geste
  de la ligne de service.
- **La ligne ne reste que là où elle porte une phrase** : la file (03.3) et le journal (18.1)
  nomment ce qu'on regarde — « À faire · les plus anciennes d'abord », « Tout · les plus
  récents ». Ailleurs — Actifs, Équipe, Catalogue, Emplacements, Dépenses — elle disparaît.
- **Le décompte ne dit plus ce qui ne change pas** : « tous les états » (l'absence de filtre),
  « 20 affichés » (la pagination, que « Charger la suite » annonce au bas de la liste) et
  « 243 au parc » (le même nombre, tant qu'aucun filtre ne réduit la liste) sont retirés.
  Reste « 243 actifs », et « 12 actifs · en réparation » quand un filtre est posé.
- L'invite de recherche des Actifs tient en deux mots au téléphone (« Code ou modèle »), la
  bande portant un geste de plus.

**Mesuré après** : **129 px** sur Actifs, Équipe et Catalogue — 30 de moins, la première
rangée d'autant plus haute. Tâches et Historique gardent leurs 157.

**Écart assumé** : 17.8 dessine cette ligne de service sous la recherche, et le bureau la
garde. C'est l'arbitrage du commanditaire pour le téléphone.

### La rangée du téléphone passe à 72, et le scan quitte l'en-tête (23/09)

**La demande** : *« retire l'icône scan dans le header de Actifs »* ; *« je trouve toujours
que la hauteur des listes sur le format mobile est trop petite »*.

**Le scan quitte la rangée du titre.** Il reste un geste de téléphone (17.11), mais il vit là
où l'on ajoute : la feuille « Nouvel équipement » l'offre en **première route**, sous le geste
d'ajout, à portée de pouce. Un glyphe de plus dans l'en-tête lui prenait 48 px et redisait un
chemin qui existait déjà.

**La rangée passe de 68 à 72 au téléphone**, et garde 68 au-delà. C'est la mesure de Material
pour une rangée à **deux lignes** (72 dp, vignette 40, texte à 72 du bord) ; Apple pose sa
cellule à sous-titre à 60 pt et rappelle qu'une cible se vise à 44 au moins — sur un
téléphone, la rangée **est** la cible. 04.1 dessine 68 : ils ont été mesurés sur une planche
de bureau, où la souris vise au pixel. La rangée dense du Catalogue suit le même écart :
64 au bureau, **68** au téléphone.

Les quatre pixels reviennent en **air autour du texte**, pas en contenu : la rangée porte
toujours deux faits. **Mesuré à 393 × 852** : rangée 72, neuf rangées visibles sous un en-tête
de 129 — contre huit et demie auparavant, l'en-tête ayant maigri de 30 px le même jour.

**S'il faut plus d'air** : 80 px avec une vignette de 48 — la forme des listes à photo — coûte
une rangée visible. Non retenu à ce stade.

### Une note dit une chose (23/09)

**La demande** : *« les détails […] sont trop longs et encombrants »*, avec en exemple la
note des rôles, celle de l'amortissement, le pied des rapports et la sous-ligne « Le franc
CFA est la seule devise du parc ».

**La règle** : une note porte **un fait**, en une phrase, dans la langue de la personne —
jamais la mécanique du produit. R15 le disait déjà pour les écrans (*« aucune note dans
l'écran »*) ; les groupes de réglages et les cartes de règles y avaient échappé.

| Écran | Avant | Après |
| --- | --- | --- |
| Accès — les rôles | 3 phrases, `UserRole` et le filtrage en dur | « Les rôles du système ne se suppriment pas. La portée d'un rôle est déclarée, pas encore appliquée. » |
| Accès — refus, portée, rôles protégés, groupes | 231, 226, 180, 150 signes | 42, 47, 45, 96 |
| Paramètres — lecture des montants | une note + « Le franc CFA est la seule devise du parc » | rien : le titre du groupe et la valeur XOF le disent |
| Paramètres — amortissement | cinq lignes (l'ordre des plans, le passé, le compte) | « Il ne vaut que pour les types sans plan à eux — 14 actifs aujourd'hui. » |
| Paramètres — fichiers, sources, agents | 238, 162, 94 signes | 71, 55, 55 |
| Rapports — pied | « Chaque export part en CSV ; le PDF et le choix de la personne s'ouvrent depuis la rangée. » | « Export en CSV. Le PDF et le choix de la personne s'ouvrent depuis la rangée. » |
| Introuvable, campagne | 155 et 141 signes | 71 et 99 |

**Ce qui reste long, à dessein** : les états vides (17.1), où la phrase *est* le contenu de
l'écran, et la note « Aucun bouton d'enregistrement » des Paramètres, qui dit une règle du
produit en une ligne.

### La page tient la fenêtre, et c'est le corps qui défile (23/09)

**La demande** : *« on avait demandé d'éviter que les cartes aient une taille très petite
à vide ou quand elles n'ont qu'un seul élément à afficher […] une taille fixe max
directement, scrollable pleine, avec une bonne gestion d'état à vide, plutôt que la taille
grandisse en fonction du contenu. Mais ce n'est pas appliqué à toutes les pages où ça
devrait se faire (Inventaire, finance, audit, paramètres, Site, etc.) »*.

L'arbitrage du 22/09 n'avait été posé que sur l'accueil (rangées de 448 et 320). Relevé au
bureau avant la passe, fenêtre de 1 440 × 900 :

| Écran | La carte | Le canevas nu dessous |
| --- | --- | --- |
| Historique, un seul fait | 124 px | ~700 px |
| Emplacements, un site par pays | 76 px | ~370 px |
| Inventaire, panneau sans site choisi | 138 px | ~560 px |
| Tâches, panneau sans tâche ouverte | 110 px | ~590 px |
| Équipe, 11 personnes | 568 px | 180 px |

**Ce qui est posé** — `src/lib/regimeBureau.ts`, trois classes, **au-delà de 840 px
seulement** :

- `PAGE_BUREAU` (`expanded:h-full`) sur la racine d'un écran ;
- `CADRE_BUREAU` (`expanded:min-h-0`) sur chaque étage intermédiaire — sans lui, un enfant
  en `flex-1` refuse de descendre sous la hauteur de son contenu ;
- `CORPS_BUREAU` (`min-h-0 flex-1 overflow-y-auto` + `[&>*]:shrink-0`) sur le corps qui
  reste, et son défilement.

Deux conditions ont dû être réglées avant que la chaîne tienne :

1. **La coque n'avait pas de hauteur.** `AppLayout` était en `min-h-screen` : une hauteur
   *minimale* ne borne rien, et un `h-dvh` posé plus bas était repoussé par la croissance
   des parents (le catalogue faisait 1 447 px de racine pour 900 de fenêtre). La coque
   prend donc `expanded:h-dvh`, et **`<main>` devient le conteneur de défilement** —
   `getAppScroller` le retrouve par l'identifiant qui servait au cadre mobile. Un écran qui
   n'adopte pas le régime ne casse pas : `<main>` le fait défiler, comme le document avant.
2. **Une colonne `flex` qui défile écrase ses enfants** au lieu de les laisser déborder :
   la carte des rôles perdait 54 px de sa liste sur une fenêtre de 700. D'où le
   `shrink-0` porté par `CORPS_BUREAU` à ses enfants directs.

**Les écrans repris** : le gabarit `ListTemplate` (Actifs, Équipe, Tâches, Historique,
Inventaire physique, Dépenses, Accès), plus Catalogue et Emplacements qui refont son
chrome à la main, Paramètres (dont le corps portait déjà son `overflow-y-auto` sans
hauteur à remplir), la Campagne (deux zones qui défilent chacune pour soi) et Finances
(les deux colonnes à même hauteur, les postes qui défilent dans leur carte, « Ajuster les
enveloppes » calé au pied).

**Les états vides prennent la boîte** : `CardEmptyState` remplace les deux invitations en
vignette (Inventaire, Tâches), et les `ScreenState` des listes se centrent dans ce qui
reste au lieu de se coller sous la recherche.

**Deux effets de bord traités** : la sentinelle de défilement du journal observait le
viewport — elle y restait visible en permanence une fois le tableau borné, et réclamait
page après page ; `DataTable` reçoit donc un `onNearEnd` qui écoute **son** scrollport. Et
le ⋮ d'une dépense prend `floating`, sinon le corps qui défile le coupe.

**Ce qui n'a pas changé, et pourquoi** : sous 840 px, rien — un téléphone n'a pas de
hauteur à distribuer, et c'est la page qui défile (vérifié à 393 : document de 1 317 px sur
Actifs, en-tête et rangées au pixel près). Les fiches (actif, personne, site, type) gardent
leur hauteur de contenu : ce sont des pages de lecture, et étirer « Référence » à trois
rangées sur 800 px creuserait un vide au lieu d'en combler un. Rapports garde sa carte de
quatre rangées fixes.

**Mesure après la passe** : sur les 24 routes du produit, à 1 440 × 900 comme à 1 024 × 700,
le document vaut exactement la fenêtre — plus une page qui défile sous son propre en-tête —
et aucun corps n'est coupé.

### Quatre demandes du 23/09 (soir) : fenêtre virtuelle, air des jauges, colonne centrée, Finances

**1. La liste ne monte que ce qui se voit.** « Charger la suite » (Actifs) et les tranches
de cinquante du journal sont remplacées par une **fenêtre virtuelle** (*windowing*, la
technique de TanStack Virtual et de react-window) : `src/hooks/useVirtualWindow.ts`. On
monte les rangées visibles et une marge de 480 px de chaque côté ; deux cales gardent la
hauteur réelle, donc la barre de défilement dit la vraie longueur. Les hauteurs sont
estimées (48 en tableau, 36 pour une rangée de jour, 72/68 en cartes) puis **mesurées**
par `ResizeObserver`. Branché dans `DataTable` (Actifs, Équipe, Historique au bureau) et
dans les listes en cartes d'Actifs et d'Équipe. Mesuré avec 3 000 actifs : 25 à 37
rangées dans le DOM, la bonne rangée au milieu et au bout. `onNearEnd` (posé plus tôt dans
la journée) est retiré : plus rien à réclamer. *Ce n'est pas de la pagination serveur* :
les données arrivent déjà en mémoire par `DataContext` ; ce qui coûtait, c'était le DOM.
Le journal au téléphone garde ses jours plafonnés à quatre faits.

**2. L'air des jauges de l'accueil** (Budget, État du parc, Types en tension). Grille de 8
(Atlassian `space.100`–`space.300`) et proximité : 16 entre le chiffre et le ruban, 12
entre le ruban et sa note, **24** avant le groupe suivant (montants, seconde jauge) ; le
ruban passe de 6 à **8** (variante épaisse de l'indicateur linéaire Material 3).

**3. La colonne de lecture se centre.** `Reading desk` et les gabarits bornés à 1 008
(`ListTemplate`, Catalogue, Emplacements) prennent `mx-auto` ; les titres de Rapports et
de Paramètres suivent la colonne. Mesuré : 96/96 à 1 440, 336/336 à 1 920.

**4. Finances refondue au bureau.**
- La bande sombre éclate en **quatre tuiles** (`FinanceKpiTiles`) : restant (et sa
  jauge), consommé, **moyenne mensuelle** et sa projection en fin d'exercice (orange si
  elle dépasse l'enveloppe), postes (épuisés, le plus entamé).
- **Histogramme mensuel** (`MonthlySpendChart`) : une barre par mois, axe à zéro, le
  douzième de l'enveloppe en tirets ; au-delà, la barre passe à l'orange ; le pic est nommé
  et chiffré ; les mois à venir n'ont pas de barre.
- **Huit postes au plus**, les plus entamés d'abord, puis « Voir les N postes ».
- Grille de 12 : histogramme 8 · « Aller à » 4, postes 8 · exercices 4. Au téléphone : le
  héro, les postes, l'histogramme, « Aller à ». La date de la dernière dépense passe dans
  « Les dépenses ».

*Piège de banc* : sur hgfs, le serveur de dev ne réinjecte pas toujours les classes
Tailwind neuves d'un module chargé en différé (`order-*` absents de la feuille injectée,
présents dans `?direct`). Le build de production les porte ; vérifier l'ordre d'une
colonne sur un build + preview, pas sur le dev.

### Inventaire au bureau : la bande en grille, la carte du site fixe (23/09)

**La demande** : *« éclater également Inventaire pour avoir une grille (actifs attendus,
sites…), histogramme ou diagramme selon la pertinence »* ; et le nom du site, sa ligne
« Togo · site · 9 locaux » et son héro *« devraient être fixes dans une carte isolée
au-dessus de la liste »*.

- **La bande de 16.1 devient une grille de 12** (≥ 1280, `AuditOverview`) : un
  **diagramme de couverture** sur 6 colonnes, puis trois tuiles de 2 — actifs attendus,
  sites (locaux, jamais vérifiés), campagnes en cours (écarts relevés, en orange s'il y en
  a). Même gabarit que les tuiles de Finances.
- **Le diagramme** : une barre empilée des **actifs** (pas des sites) selon l'état de
  leur site — à jour, en cours, en retard (au-delà de la périodicité de 14.1), jamais
  vérifiés — avec le pourcentage « à jour » en chiffre de tête et une légende qui compte
  actifs et sites. Barre plutôt que camembert : quatre parts d'un tout s'alignent mieux
  sur une ligne, et tiennent dans la hauteur d'une tuile.
- **Le panneau du site** : le titre et sa ligne quittent le canevas et entrent dans le
  héro sombre (surtitre « Togo · site · 9 locaux », nom du site en 22), qui forme une
  carte fixe ; seuls les locaux défilent dessous, la note reste au pied. Le surtitre ne se
  redit plus.
- Au téléphone et sous 1280 : rien ne change (vérifié à 393).
- *Reprise du même soir* : la tuile de couverture prend le gabarit des autres tuiles (titre
  12, chiffre 28, phrase 14, ruban de **8** à 16 dessous — il était de 12, sous un en-tête
  à deux bouts) et la légende de l'histogramme de Finances (pastille, mot, compte ; les
  sites dits au lecteur d'écran par le ruban, une part vide estompée).
- *Seconde reprise* (« pas aussi élégant ; la liste n'affiche que trois éléments ; la carte
  du haut occupe la moitié ») : le panneau du site devient **une seule carte blanche**. En
  tête, le pays, le nom en 22 et trois chiffres en 17 sur une ligne (hors campagne :
  attendus, locaux à compter, dernier comptage ; en campagne : attendus, trouvés, écarts,
  et le ruban de 8) — 140 px au lieu de 240. Un filet, « Locaux · N » avec la note passée
  dans une `InfoTip`, puis les locaux, qui prennent le reste et défilent : 7 visibles à
  900 de fenêtre, contre 3. Le héro sombre ne sert plus qu'au téléphone.
- *Troisième reprise* : **deux cartes distinctes, présentes avant tout choix** — la carte
  du site (à vide : « Site / Aucun site choisi » et trois tirets, à la même hauteur) et la
  carte des locaux (à vide : `CardEmptyState` « Choisissez un site » ; site sans local :
  « Aucun local dans ce site »). Choisir un site remplit deux cadres, rien ne bouge. Le
  compte de l'en-tête de liste est celui des locaux, pas des rangées (« hors local » n'en
  est pas un).

### Cinq demandes du 23/09 (nuit) : tableaux, phrases, photos, 15.2, grilles restantes

**1. Plus de barre de défilement horizontale sous les tableaux.** Le ⋮ de rangée était
rentré de 8 dans 6 d'intérieur : il sortait de 2 px de sa cellule, et ces 2 px ouvraient
une barre sous Actifs et Historique. La cellule prend 4 de part et d'autre du carré de 40.
Sans colonne de reste, `DataTable` passe en `table-fixed` : le navigateur pose les colonnes
en pixels (case, ⋮) puis répartit le reste **au prorata** des pour cent — mesuré, 25/11/15/
17/16/16 rendent 255/112/153/173/163/163 à 1 440, sans débord. (`calc(% − px)` sur un
`<col>` est ignoré par Chrome, qui retombe sur des colonnes égales.)

**2. Les phrases de « Derniers événements »** (`getHistoryEventSentence`) : une ouverture ou
une fermeture de session n'a pas d'objet — « Vous avez ouvert une session. », sans redire
le nom de la personne qui lit ; une cible qui est le lecteur s'écrit « votre compte ».

**3. Plus de photo floue.** `DetailHero` perd sa photo en fond (étirée sous un voile à
80 %) ; les listes (Actifs, modèles d'un type) montrent le pictogramme ou l'initiale. La
photo s'ouvre par un **œil dans le coin haut droit du héro** (`DetailHero.corner`,
`ImagePreview`) : une visionneuse plein écran, fond sombre, image **à sa taille réelle,
jamais agrandie** (réduite seulement pour tenir), sa définition au pied ; Échap, la croix ou
un geste à côté la ferment. Les photos de démonstration font 100 × 100 : elles restent
petites, c'est le prix de la netteté.

**4. 15.2 — Lignes du budget, portée.** « Définir le Budget Annuel » était une boîte
générique sans consommé. `BudgetLinesPage` (`/finance/lines/<année>`) : au téléphone la
barre à « Enregistrer », le héro (enveloppe, réparti, état) et la carte des lignes ; au
bureau le **tableau éditable à six colonnes** (enveloppe en champ — `AmountField`, jauge,
restant, ⋮) et son **pied qui totalise**. La seule règle — pas de baisse sous le consommé —
se dit sur la ligne. La boîte ne sert plus qu'à ouvrir un **nouvel exercice**.
*Écart assumé* : « Supprimer · 18 dépenses » devient « déjà consommée » (les dépenses ne
sont pas encore rattachées à leur ligne). *Défaut trouvé en passant* : le champ perdait sa
sélection au focus et ajoutait les chiffres tapés au bout (« 850005000 ») ; il resélectionne.

**5. Les grilles restantes.**
- **Fiches** : une carte marquée `data-colonne="gauche"` passe sous le héro au bureau et
  garde sa place au téléphone (`DetailTemplate`). Modèles d'un type, unités d'un modèle,
  locaux d'un site à gauche ; l'historique et les documents d'un actif aussi (`asideTail`).
  Colonnes mesurées : actif 707/665, type 400/364, modèle 464/208, site 415/200 (au lieu de
  226/389 et 184/580).
- **Accueil d'un employé** : la grille du gestionnaire (file 8 · événements 4, puis ses
  chiffres, ses équipements, sa garantie à 4), au lieu de cartes pleine largeur.
- **Formulaires plein écran** : la barre suit la mesure de 560 du flux (00.5) — le retour et
  « Enregistrer » étaient à 230 px de part et d'autre du formulaire.

**Plantage trouvé et corrigé** : Actifs plantait pour un **employé** (« Maximum update depth
exceeded ») — la fenêtre virtuelle effaçait ses mesures à chaque liste neuve, et cette vue
recalcule sa liste à chaque rendu. Les mesures restent désormais attachées à l'indice.
Balayage après correction : 4 comptes de démo × 21 routes × 2 largeurs, aucune panne.

### Les grilles du bureau, page par page (23/09, fin de soirée)

Demande : *« améliore le style de grille de la version desktop sur les autres pages »* — Site
(« Locaux est trop long »), Emplacements, Catalogue, la campagne « Lomé Siège — hors local »
et le vide des Écarts, Rapports, Accès, et Mon compte / Paramètres. Rien ne change au
téléphone : chaque grille est derrière une largeur (≥ 840 ou ≥ 1280).

- **Emplacements** (≥ 840) : un site est une carte — nom, puis actifs et personnes en
  chiffres ; par trois (deux sous 1 200) ; « Jamais servi » éteint la carte.
- **Catalogue** (≥ 840, hors sélection) : un type est une carte — pictogramme, nom, modèles
  et actifs au parc ; « aucun modèle » en ambre avec l'horloge.
- **Fiche de type** (≥ 1280) : les modèles en cartes de trois — l'initiale de la marque,
  le nom, puis ce qu'ils comptent au parc.
- **Fiche de site** (≥ 1280) : les locaux en tuiles de trois, la dernière ajoute. Le clic
  d'une rangée de local ouvrait… la suppression ; elle passe au ⋮, nommée.
- **Campagne** : le site va au titre de la page, le lieu (« Hors local », un local) au héro,
  et le site redescend dans sa sous-ligne ; plus de « Lomé Siège — hors local » écrit deux
  fois. Au bureau, les Écarts vides deviennent une carte à la hauteur de la zone, qui dit ce
  qu'elle recevra avant le premier scan et « Aucun écart » après.
- **Rapports** (≥ 840) : quatre cartes en grille de deux — ce que le rapport contient en une
  ligne, son compte, puis **CSV et PDF à parts égales** (15.1), qui ouvrent l'aperçu sur le
  format demandé.
- **Accès** (≥ 1280) : les rôles sur 8, les groupes sur 4 — et au bureau la carte **liste
  les groupes** (les cinq premiers et leurs membres), contre 11.1 qui n'y met qu'un renvoi :
  un renvoi seul laissait 400 px de vide.
- **Paramètres** (≥ 1280) : les groupes en deux colonnes équilibrées (colonnes de texte, pas
  une grille : aucun trou sous un groupe court). **Mon compte** : l'identité à gauche (5),
  les actes à droite (7).
- **Mon compte et Paramètres ne fusionnent pas** : le premier est à chacun (mot de passe,
  PIN, signature, session), le second à l'administration (devise, amortissement, sources).
  Les fusionner montrerait à un employé une page de réglages où il ne peut rien régler, ou
  cacherait son propre compte derrière des droits d'administrateur. Ils restent deux
  destinations, reliées par la rangée « Mon compte » de Paramètres.

### L'écran d'erreur prend la forme des états d'écran (23/09)

`ErrorBoundary` empruntait l'ancien `EmptyState` : glyphe Material, titre de 20, une phrase
de trois propositions, un bouton de 56, et le détail technique dans une boîte à filet. Il
passe par `ScreenState` (17.1), comme la page introuvable et le hors-ligne : pastille de 96
et glyphe Phosphor (`WarningCircle`), titre de 22 **qui dit le fait** (« Cette page n'a pas
pu s'afficher »), une phrase courte, **deux gestes** empilés — Recharger, Revenir à
l'accueil — et **l'heure de l'incident** au pied, que la phrase demandait de donner au
support sans la montrer. Le détail technique reste au développement, dans le panneau de
pied des états. La racine (« L'application n'a pas pu démarrer ») prend la même phrase.

*En passant* : la galerie du design system plantait à l'ouverture depuis le 08/09 —
`DetailTemplate` et `ListTemplate` y lisaient `useData()` hors de `DataProvider`. Ils lisent
désormais `useOptionalData()`, qui rend `undefined` hors de l'application.

### Téléphone : titres, jauges, Finances et ses filles, Rapports, Accès (23/09, nuit)

- **Un seul titre de page, 28 sur 32** (Archivo 600), parente ou secondaire : les barres de
  56 des fiches (`DetailTemplate`), des sous-écrans de Paramètres, de la fiche d'un rôle, de
  la campagne, des formulaires plein écran et de « Lignes du budget » tenaient 17. Écart
  assumé à 17.8. Mesuré : les 13 pages vérifiées titrent à 28px/32px 600.
- **Icônes par rôle** : 24 pour le retour d'une barre de téléphone (les formulaires tenaient
  20, seuls de leur taille), 20 dans l'en-tête du bureau, 20 en rangée, 18 en ligne.
- **Un seul rythme de jauge** : `ProportionRow` (fiche d'actif, garantie et valeur) prend
  celui de `Gauge` — 16 / 12, ruban de 8, chiffre en 22 ; 24 avant le filet qui sépare deux
  jauges. Sur l'accueil empilé, le renvoi de pied (« Valeur et amortissement ») prend 24
  d'air ; la grille du bureau le cale au pied par `data-pied`.
- **Finances au téléphone** : le sélecteur « 2026 (En cours) » quitte l'en-tête fixe et
  devient la pastille du surtitre du héro, qui ouvre la liste des exercices ; le héro porte
  le consommé et la moyenne mensuelle ; **trois postes** (les plus entamés) puis « Voir les
  N postes », qui mène à « Lignes du budget ». Postes et lignes : ruban de 8, rangées de 16.
- **Lignes du budget** : titre à 28, « Enregistrer » devient une coche nommée (le titre se
  coupait) ; les rangées prennent le rythme des jauges.
- **Rapports** : les cartes du bureau à toutes les largeurs — CSV et PDF à parts égales
  (15.1) plutôt que la rangée de 15.5 qui cachait le PDF.
- **Accès** : la carte des groupes les liste aussi au téléphone (trois, puis le renvoi).
- *Défaut trouvé* : un commentaire de code s'affichait en tête de Rapports après le retrait
  d'une branche. Le balayage des comptes cherche désormais tout `/*` ou `*/` visible.

### La taille des icônes, par rôle et mesurée (23/09)

Relevé sur 20 routes aux deux largeurs, chaque icône rapportée à la hauteur de son contrôle.
La règle, qui est celle que 17.11 et `FilterButton` suivaient déjà :

| Rôle | Taille |
| --- | --- |
| Geste d'une barre de 56 au téléphone (retour, ⋮, fermer, valider), bouton flottant | **24** |
| Contrôle de 36 à 48 : bouton à libellé, bouton d'icône, geste d'en-tête du bureau (carré de 40), chevron et ⋮ d'une rangée, copie d'une valeur | **20** |
| Dans une ligne de texte de 12 à 14 : état, note, pastille, bouton `sm`, vignette de 32 | **18** |
| Vignette de 40 · pastille de 48 · état d'écran de 96 | 20 · 24 · 32 |

Écarts corrigés : 27 icônes à 18 dans des contrôles de 40 ou 48 (chevrons de renvoi de
l'accueil, de la fiche d'actif, du type, de l'import ; « Attribuer », « Restituer »,
« Ajouter » de l'en-tête ; filtre, menus déroulants et tri de la ligne d'outils ; CSV/PDF ;
copie du numéro de série ; les quatre gestes du héro d'une personne). Et le ⋮ des fiches,
posé à 24 ici et 20 là : `Icon` accepte désormais **`size="geste"`**, qui suit le carré que le
gabarit a décidé (`IconGestureSizeContext`) — 24 dans le carré de 48, 20 dans celui de 40.
Relevé après correction : aucun écart au bureau ; au téléphone, seules les deux exceptions
voulues (le filtre de la bande de recherche à 20, le bouton flottant à 24).

*Reprise* : au téléphone, les rangées de l'Historique posaient la marque ronde de **32** et un
glyphe de **18**, quand toutes les autres listes posent une vignette de **40** et un glyphe de
**20**. `MarqueRonde` prend une taille : 32 / 18 dans la colonne de tête du tableau (la
vignette de `DataTable`), 40 / 20 dans une rangée. Les faits des cartes « Derniers
événements », « Historique » d'un actif et d'une personne suivent : un fait a la même marque
partout. Mesuré : 40 / 20 sur les cinq écrans concernés.


### En-têtes alignés, « Exercices » porté, bouton flottant des lignes (24/09)

- **Une seule barre du haut au téléphone** — `BarreDePage` : intérieur `8 / 16 / 12`,
  rangée de 48, retour rentré de 12. Les fiches (`DetailTemplate`), la fiche d'un rôle, la
  campagne, « Lignes du budget », les sous-écrans de Paramètres et les formulaires plein
  écran posaient leur titre à 60 / 12 dans une barre de 56 ; ils le posent à **56 / 16**,
  comme les listes. Mesuré sur 14 écrans : titre à 56 / 16 partout, barre de 69 pour un
  titre seul, de 129 avec la recherche.
- **Le compte à côté du titre pour toutes les listes** : Tâches et Historique (qui passent
  un `regard`) et Emplacements (qui écrit son en-tête) gardaient la ligne de service sous
  la recherche (« À faire · les plus anciennes d'abord », « 4 sites · 3 pays ») — 157 px
  d'en-tête contre 129. La règle du 23/09 vaut maintenant pour elles.
- **15.1, colonne 3 — « Exercices »**, porté (`ExercisesPage`, `/finance/exercices`) : À
  définir (l'exercice suivant « à projeter », « Reprendre 2026 » — ses lignes, rien de
  consommé —, « Lire un budget », « ou partir de zéro »), En cours, Clos (« un exercice clos
  se lit et s'exporte »). « Changer d'exercice » (en-tête du bureau, pastille du héro au
  téléphone, ⋮) y mène ; toucher un exercice rouvre Finances sur lui (`?annee=`). La boîte
  « Nouvel exercice » n'est plus qu'un chemin : « Lire un budget ».
- **Lignes du budget au téléphone : le bouton flottant** (`ListActionFab`, 17.7) remplace la
  rangée « Ajouter une ligne » du pied de carte ; le vide ne double plus le geste. Au bureau,
  le pied du tableau garde « Ajouter une ligne ».
- L'histogramme mensuel reste lisible à 393 : initiales des mois, pic chiffré, légende sur
  deux lignes.

### Nouvelle ligne, nouvelle dépense, histogramme, fiche Site au téléphone (24/09)

Demande : *« propose une refonte plus convenable pour nouvelle ligne, enregistrer dépense ;
un peu plus de hauteur aux cartes des histogrammes ; détails site en mobile. »*

- **Nouvelle ligne (15.2)** — la boîte centrée (`Modal`) devient une **feuille**
  (`BottomSheet` : monte du bas au téléphone, centrée à 560 au-delà). Relevé à 393 : deux
  champs vides, et le second cran du segmenté « OPEX — frais courant » sortait de l'écran.
  La feuille porte : le sous-titre *Budget 2026 · N XOF à répartir* ; le nom (refus en
  ligne si le poste existe déjà) ; **« Déjà connus »**, les postes des autres exercices
  absents de celui-ci (vraies lignes, montant repris) ; l'enveloppe en chiffres groupés,
  suffixe devise ; **l'effet avant le geste** (`FormWarn` vert « il restera X à
  répartir », orange « dépasse l'enveloppe de X : elle passera à Y ») ; la nature en deux
  `OptionRow` nommées par ce qu'elles désignent. Pied `.sfoot` : Annuler / **Ajouter la
  ligne**, fermé tant que le nom manque. Renommer et Modifier le montant prennent la même
  feuille ; le montant refuse de descendre sous le consommé, dans la feuille.
- **Nouvelle dépense (15.4)** — le réglage « Comment saisir · Lire une facture | Saisir à
  la main » tombe : **un seul formulaire**, la facture en tête (la lire remplit ce
  qu'elle dit franchement ; « lu sur la facture » sous le champ acquis), puis *La
  dépense* (montant + devise, fournisseur, date et n° côte à côte), **Le poste** et
  *Description*. Le poste n'est plus une liste déroulante de natures : une `OptionRow` par
  ligne où la dépense **s'impute réellement** (`getBudgetCategoryByExpenseType`, remonté
  de `FinanceDataContext` vers `lib/financial.ts`), chacune avec *CAPEX · X restants*.
  L'avertissement d'imputation calculait sur `item.type` — faux dès qu'une ligne portait
  un autre nom que celui de l'imputation ; il lit désormais la ligne imputée, et dit si
  elle sera ouverte, dépassée, ou ce qu'il restera. Téléphone : la coche remplace le mot
  « Enregistrer », qui coupait le titre en « Nouvelle… ».
  *Écarts assumés* : 15.4 pose les champs en rangées `.xrow` à chevron et un bloc
  « Justificatifs · N » à plusieurs fichiers ; le produit ne garde qu'un fichier par
  dépense et ne rattache pas une dépense à un objet (chips Équipement/Lot…) — non portés.
- **Histogramme mensuel** — zone de tracé 176 → **240** au téléphone, **288** dès 1200
  (figure mesurée : 316 à 393, 344 à 1440).
- **Fiche Site au téléphone (10.1)** — la phrase du héro, identique sur tous les sites
  (« Une adresse : c'est elle qui décide… »), devient un fait : *N locaux · N actifs sans
  local*. **Les locaux passent avant la Référence** (dont deux rangées sur trois sont le
  plus souvent vides). Chaque local : sa vignette, son compte, **un ruban de sa part du
  parc du site**, et un ⋮ « Supprimer le local » — la rangée ouvrait, au toucher, la
  confirmation de suppression. Toucher ouvre les actifs du site. Une rangée ambre
  **« Sans local »** dit ce qui n'est rangé nulle part.

Vérifié : tsc, eslint 0, contrôles DS/jetons/cn/encodage, captures 393 et 1440, balayage
des 4 comptes démo (0 panne).

### Bureau : carte de site, fiche de rôle, 15.2, formulaires et imports (24/09, suite)

- **Carte de site (Emplacements, ≥ 840)** — deux étages : vignette, nom et chevron ; puis
  un filet et deux cases égales séparées d'un filet (le mot en 12, le nombre en 22, zéro en
  tertiaire). Les chiffres se serraient à gauche sous le nom (« 8 8 »). Site jamais servi :
  sablier ambre et « Jamais servi · aucun actif, personne » dans le même étage.
- **Fiche d'un rôle (11.1, ≥ 1280)** — grille de 12 : héro (7) et **« Qui le porte »**
  (5, carte neuve, liste bornée qui défile, rangée → fiche de la personne) ; dessous, les
  deux matrices (7) et refus / héritage / portée / rôle du système (5). « Modifier le
  rôle », « Enregistrer », « Supprimer » montent dans l'en-tête. Téléphone : même ordre,
  « Qui le porte » avant les gestes.
- **15.2 au bureau** — tableau (8) et **carte de l'enveloppe** (4) dès 1 280 : le chiffre
  en 28, une barre consommé / réparti / libre (orange au-delà), la part CAPEX / OPEX, le
  refus, « Ajouter une ligne ». Colonnes chiffrées resserrées (100/140/96/132) ; le pied
  dit « Total · N lignes ».
- **Renommer le site** — la feuille « Modifier le site » ne portait qu'un nom et promettait
  « sans effet sur les actifs » : c'était vrai, et c'était le **bug** — `renameLocation`
  renommait le référentiel seul, actifs et personnes gardaient l'ancien nom et sortaient du
  site. Le renommage emporte désormais `equipment.site`, `user.site` (et `country`,
  `local` au niveau concerné) ; la feuille s'appelle « Renommer le site », refuse un nom
  pris, dit ce qui suit (actifs, personnes, locaux) et la fiche suit le nouveau nom.
  Vérifié au banc : 8 actifs et 8 personnes suivent.
- **Formulaires plein écran au bureau — arbitrage contre 00.5.** 00.5 borne le flux à
  560 « à toutes les largeurs ». La règle vise le champ ; appliquée à la page, elle
  laissait 880 px vides à 1 440. Dès 1 200 : **deux colonnes de 560** (`MESURE_DOUBLE`,
  `COLONNES_FORMULAIRE` dans `regimeBureau.ts`, `FullScreenLayout mesure="double"`) ; la
  barre et le pied suivent la même mesure. Portés : fiche d'équipement, fiche de personne,
  type, modèle, dépense. Chaque champ garde sa largeur de lecture.
- **Imports** — contrat et dépôt côte à côte ; après lecture, le fichier (5) et « ce qui
  sera créé » (7). Le bouton de pied reprend sa taille au bout (plus de barre de 1 136).
  **« Importer des utilisateurs » passe sur `ReferentialImportTemplate`** : il était seul à
  garder « Étape 1: Télécharger le fichier CSV », un tableau à six colonnes et des
  pastilles OK/Erreur. Nouvelle fente `reglages` du gabarit : le rôle des personnes
  retenues, après lecture. Une adresse en double dans le fichier est refusée avec sa cause.

Vérifié : tsc, eslint 0, contrôles DS/jetons/cn/encodage, captures 1200/1440/393,
balayage des 4 comptes (0 panne).

### Compte au titre au bureau, en-têtes fixes, menu du compte, modèles d'un type (24/09, soir)

- **Le compte à côté du titre, au bureau aussi.** La règle du 24/09 n'avait été branchée
  qu'au téléphone. Catalogue (« 13 types · 110 modèles · 243 actifs » + tri) et
  Emplacements (« 4 sites · 3 pays » / « 14 actifs ») écrivaient encore leur ligne sous la
  recherche : le compte monte à côté du titre (13 sur 16, retrait de 6 comme `.cnt2`), le
  tri du Catalogue passe au bout de la ligne d'outils. Rapports (« 4 exports fixes ») et
  Dépenses (« N écritures », « N écritures sur M » filtré) en reçoivent un ; Dépenses ne
  l'écrivait que filtré, sous la recherche.
- **Lignes du budget et Exercices : l'en-tête reste** — `PAGE_BUREAU` / `CORPS_BUREAU` ;
  le corps de 15.2 défile sur toute la largeur et centre son contenu à 1 280 par ses marges.
- **Menu du compte (barre latérale)** : aligné sur le ⋮, il faisait 236 px pour 224 de
  barre et partait à −12, coupé. Il passe en `floating`, et `Menu` borne désormais tout
  menu flottant à 8 px du bord de la fenêtre.
- **Modèles d'un type** : en cartes dès 840 (2 de front, 3 dès 1 200) ; sous 1 280 la
  rangée courait sur 700 px pour un nom et un compte.
- **Menu du compte, la vraie cause** (24/09, suite) : la barre latérale est `sticky`, donc
  un contexte d'empilement à elle ; le `z-50` du menu n'y valait que dedans, et le contenu
  principal le recouvrait — barre repliée, on n'en voyait que les 64 px qui dépassent. La
  barre passe à `z-30` (au-dessus des en-têtes collants `z-20`, sous les feuilles
  `z-[100]`). **Toute la rangée de la personne ouvre le menu** (pastille, nom, rôle, glyphe
  haut/bas) au lieu d'un ⋮ ; `Menu` accepte `rootClassName` pour ce déclencheur pleine
  rangée. Barre repliée : la pastille gardait un survol clair sous des initiales blanches.

### L'écran d'erreur, sobre (24/09)

Demande : *« repenser la page d'erreur de manière plus sobre mais élégante, bureau comme
téléphone »*. La forme des états d'écran (pastille de 96, titre centré, boutons empilés,
heure en note) laisse place à **une colonne de lecture de 480, alignée à gauche** : un
repère orange de 20, le titre en 28 sur 32, la phrase ; sous un filet, **les deux faits du
support** — « Survenu le 24 septembre à 08:05:09 », « Page /reports » — et « Copier pour
le support » (heure, page, message, en un geste) ; puis « Recharger la page » et « Revenir
à l’accueil », côte à côte dès 600, empilés au téléphone. Le détail technique reste réservé
au développement, en pied, discret. Vérifié en forçant une erreur de rendu (module de
Rapports remplacé au banc) à 393 et 1 440.

### Inventaire des formulaires et surfaces au bureau (24/09, nuit)

Demande : *« certains formulaires sont encore présentés sous format mobile »*. Relevé
systématique à 1 440 : 22 fichiers ouvrent des feuilles, 3 des boîtes, 5 des feuilles
d'acte, 2 des panneaux latéraux, plus les formulaires en page. Les feuilles (remettre,
retourner, incident, sortie du parc, filtres, invitation, mot de passe, code PIN,
signature, ajouter un emplacement, créer) sont des dialogues centrés de 560 (00.5) : laissés.
Traités :

- **Sous-écrans de Paramètres** — des rangées de téléphone sur 1 008, la valeur à 900 px
  de son libellé. Dès 1 200 : deux colonnes pour Devise, Amortissement, Sources ; 560
  centrés pour Périodicité, Taille de fichier, Recadrer.
- **`/users/add`** — l'écran « Un compte se crée par invitation » et son retour étaient une
  impasse : l'adresse ouvre la liste Équipe **avec la feuille d'invitation ouverte**
  (`UsersPage inviter`), la refermer revient à `/users`.
- **« Nouvel exercice » → « Lire un budget »** — la boîte de 896 (onglets « Import fichier |
  Saisie manuelle », « Données pré-remplies par IA » en capitales et sa confiance, tableau
  à en-têtes espacés, **trois lignes d'exemple chiffrées**) devient un formulaire plein écran
  à double mesure : le fichier (ou « Saisir à la main »), la lecture en cours, puis la
  lecture et l'exercice (année, enveloppe) à gauche, les postes à droite ; « Créer
  l'exercice » dans la barre. Une ligne vide au départ.
- **Aperçu d'un export (Rapports)** — l'acte était écrit trois fois ; le format se choisit
  en deux crans, le pied porte le seul verbe (« Exporter en PDF »), l'aperçu passe à 896
  pour que ses sept colonnes tiennent.

### Le parcours de réparation : incident → dépôt → devis → prestataire → facture (24/09)

Demande : *« déclarer un incident diffère de la prise en charge, mais le badge est le même ;
implémenter les validations USER → IT → Prestataire, le devis à la prise en charge, la
facture ou le reçu à la récupération, le tout connecté au budget et aux dépenses »*.
Arbitrages du commanditaire : attestation du porteur au dépôt, bon facultatif côté
prestataire, dépense créée d'office à la récupération ; **le devis : l'informatique seule
sous un seuil, la Finance au-delà** (décidé pour lui, seuil réglable, 150 000 par défaut).

- **Modèle** : `Equipment.repair` (`RepairCase`) et `repairHistory` ; étapes `declared →
  deposited → quote_pending → at_repairer`, clôture à la récupération. Porte unique
  `advanceRepair` (DataContext), gardée par étape et par rôle (`financeManage` pour le
  devis). Réglage `repairQuoteThreshold` (Paramètres › L'entreprise › Validation des devis).
- **Badges distincts** (`presentationEtat`, `reparation.ts`) : « Incident déclaré »,
  « À prendre en charge », « Devis à valider » (ambre), « En réparation » (orange) — dans la
  fiche et la liste Actifs. L'état reste `En réparation` pour les compteurs.
- **Fiche** : un seul geste par étape (Recevoir le dépôt / Prendre en charge / Examiner le
  devis / Récupérer), carte « Où en est la réparation » (`HandoverTrail`).
- **Dépôt** (`DepositSheet`) : le porteur atteste ; sur l'appareil de l'informatique il
  signe (17.4 : jamais le code d'autrui).
- **Prise en charge** : hors garantie, le prestataire se nomme (il était déduit), le devis
  (fichier + montant) est requis, le bon d'enlèvement facultatif ; la feuille dit qui valide
  et ce qu'il restera sur la ligne Maintenance. Le toast « Montant envoyé en validation »
  n'envoyait rien : c'est maintenant une vraie validation.
- **Devis** (`QuoteDecisionSheet`) : montant, prestataire, fichier (Ouvrir), impact sur la
  ligne ; refus motivé, lu par l'informatique (« devis refusé, à reprendre »).
- **Récupération** : fournisseur, montant payé (pré-rempli du devis), facture ou reçu requis
  hors garantie → **dépense créée** (Maintenance & Services, justificatif, « Réparation
  <objet> (<code>) ») ; écart au devis signalé ; l'objet repart chez son porteur par la
  remise ordinaire.
- **Tâches** : nature « Réparations » — l'IT reçoit, prend en charge, récupère (en retard →
  « À faire ») ; la Finance examine ; le porteur voit « à déposer ».
- Fichiers gardés au magasin local (`financeFileStorage`), comme les justificatifs.

Vérifié au banc à 1 440 et 393 : devis de 200 000 → Finance → validé → facture 210 000 →
dépense créée, objet en `PENDING_DELIVERY` chez son porteur, dossier archivé ; 4 comptes,
0 panne. *Non couvert* : l'engagement du devis n'est pas encore réservé sur la ligne avant
la facture (il est dit, pas retenu) ; le dépôt attesté n'a pas été joué au banc (signature).

### Rythme des cartes, en-têtes secondaires, Finances au téléphone, CAPEX/OPEX (24/09)

- **Un seul rythme vertical** pour Budget, État du parc (accueil) et Garantie et valeur
  (fiche) : titre → chiffre **20**, chiffre → ruban 16, ruban → phrase 12, **20 · filet · 20**
  entre deux blocs, **20 · filet** avant le renvoi du pied. Mesuré avant : 12 dans la fiche
  (les marges du titre et du chiffre fusionnaient, la carte n'étant pas `flex`), 24/13 autour
  du filet de l'accueil, 38 avant le renvoi de la fiche.
- **En-têtes secondaires au bureau** : même taille que les listes (24, l'échelle dense du
  22/09) mais une rangée plus basse ; ils prennent **20 d'air + 52** (`min-h-[72px]`) comme
  ListTemplate — le titre tombe à 30 comme « Actifs » (fiches, Site, Type, Modèle, personne,
  rôle, campagne, 15.2, Exercices, sous-écrans de Paramètres).
- **Finances au téléphone** : « Aller à » monte sous le héro (elle fermait la page, sous
  l'histogramme) ; la pastille « EXERCICE 2026 · EN COURS › » devient **le fait à gauche**
  (« Exercice 2026 » + point de statut) **et le geste à droite** (« Changer »).
- **CAPEX bleu, OPEX ambre** (`NatureBadge`, `NATURE_TEINTE`) : postes de Finances, lignes
  de 15.2, choix de nature de « Nouvelle ligne », barres « Par nature ».

### Référentiels au téléphone : une rangée à chiffre (24/09)

Demande : *« une refonte UI plus élégante des pages Type, Emplacements, Site, Inventaire,
Accès, version mobile »*. Chaque page avait inventé sa rangée ; elles partagent désormais
**`FactRow`** (`components/ui/FactRow.tsx`) : vignette de 40 teintée par la nature, nom et
fait, **le chiffre à droite avec son unité** (Archivo 17 / 12), chevron.

- **Type** — « Référence » (clé / valeur, clé technique en police machine) devient
  **« Réglages »** : « Attribuable à une personne » (vert) et « Linéaire sur 3 ans » (bleu)
  avec leur règle dessous — la note d'amortissement quitte sa carte d'avertissement ; la clé
  de donnée descend en pied. Modèles : initiale de marque, compte d'actifs en chiffre. Le lien
  « Voir les 4 actifs » passe dans la tuile du héro.
- **Emplacements** — actifs en chiffre, personnes et locaux en fait ; site jamais servi
  éteint, sablier, « Jamais servi » en ambre.
- **Inventaire** — l'état en sous-ligne avec son point (« jamais vérifié », « en cours ·
  3/8 », « complet »), les attendus en chiffre, et « Lancer » devient un carré ▶ ambre
  (libellé accessible complet) au lieu de trois boutons gris empilés.
- **Accès** — la portée se voit : glyphe et teinte par portée (tout le parc orange, pays
  bleu, équipe/service vert, soi neutre, sur mesure ambre), porteurs en chiffre ; groupes
  pareils, membres en chiffre.
- **Site** — « Référence » en rangées : le fait en titre (« TOG », « à désigner »,
  « jamais »), ce qu'il est dessous ; « dernier inventaire » ouvre l'inventaire.

### Emplacements au bureau : le globe en pointillés (24/09, essai)

Demande : la grille de cartes laissait le tiers droit vide ; *« un globe 3D pointillé qui
modélise chaque pays, mis en valeur selon le nombre d'actifs ; en cliquant un pays, sa
carte s'affiche »*. Dès 1 280 : le globe (7/12, carte sombre) et, à droite (5/12), **Les
pays** puis **la carte du pays choisi** (ses sites en `FactRow`). Par défaut, le pays qui
porte le plus d'actifs. Entre 840 et 1 280, la grille de cartes ; au téléphone, la liste.

- **Sans dépendance** (`GlobePointille`) : projection orthographique en canvas 2D ; les
  terres sont une grille de 2° (5 394 points, `lib/terres.ts`, 2,7 Ko) calculée hors dépôt
  depuis Natural Earth 1:110 m (`world-atlas`, domaine public) — ni `d3-geo` ni
  `world-atlas` ne sont des dépendances. 61 images/s au banc.
- **Nœuds** : taille et halo ∝ √actifs, orange LIVE ; le choisi en jaune, cerné, pulsé.
  Étiquettes = vrais boutons (nom + « 8 actifs »), masquées au dos du globe ; le canvas est
  `aria-hidden`, la liste des pays reste le chemin accessible.
- **Mouvement** : dérive lente sans choix, pivot vers le pays choisi, rotation à la main ;
  `prefers-reduced-motion` : ni dérive ni animation.
- **Position des pays** : `lib/paysCoordonnees.ts` (centres approximatifs, Afrique, Europe
  et principaux autres) par nom sans casse ni accent ; un pays absent n'est pas placé et
  la note sous le globe le nomme.
- **Zoom au choix** (demande du 24/09) : choisir un pays fait pivoter **et approcher** le
  globe (×2,1, même amorti) ; « Vue d'ensemble » dans l'en-tête le ramène entier. La page
  s'ouvre sur la vue d'ensemble, la carte de droite sur le pays le plus équipé. Approché,
  le canvas s'efface en cercle (masque radial) au lieu de se couper au carré.
- **Tous les pays, sans carte autour, sans collision** (24/09, suite) :
  - `paysCoordonnees.ts` est **généré pour 236 territoires** (Natural Earth 1:50 m) : centre du
    plus grand territoire, nom français (`Intl.DisplayNames`), anglais, code ISO, variantes
    d'usage (RDC, Centrafrique, Côte d'Ivoire…). Codes obsolètes écartés (DD, DY, FX, HV,
    YD, RH…). Un nom non reconnu est dit sous le globe.
  - **Plus de carte sombre** : la sphère porte le bleu-noir de la marque et flotte sur la
    page ; « Vue d'ensemble » se pose sur elle.
  - **Zoom adaptatif** : ×12 / distance au plus proche voisin (en degrés), borné entre ×2,1
    et ×4 — Togo/Bénin (1,4°) à ×4. Grille de terres de **1°** dès ×1,6 (seuls les points à
    l'écran se dessinent).
  - **Étiquettes sans chevauchement** : placées à chaque image (choisi d'abord, puis par
    poids), à droite, à gauche, dessus, dessous ; sans place libre, l'étiquette s'efface et
    le point reste, nommé par la liste.
- **Globe clair, fondu au décor** (24/09, suite : *« pas un globe sombre ; les pointillés oui,
  mais fondu au décor »*) : plus de corps bleu-noir ni de contour ; terres en pointillés
  `--st-bleu`, trame d'océan à 6 % d'encre, ombrage de 5 % vers le bord, masque radial à
  94 %. Étiquettes claires (surface, ombre légère), le choisi en jaune. **Focus allégé** :
  anneau du pays choisi en filet d'encre de 1 (il faisait 1,5 en jaune), anneau clavier des
  étiquettes à 1 sans décalage (le `Button` pose 2 + 2).

### Connexion au téléphone : le champ de marque et la feuille (24/09)

Demande : *« une login page mobile plus élégante »*. Le téléphone prolonge la direction B du
bureau (22/09) : **tout l'écran est le bleu-noir de la marque**, le cartouche LIVE et le bloc
de marque (filet jaune, « Tracker » en 36/40, la promesse) prennent la hauteur libre et
posent leur texte en bas ; **le formulaire monte du bas dans une feuille** (`AUTH_PANEL` :
coins hauts de 20, 20 de recouvrement, ombre vers le haut, marge du bas sur la zone sûre),
titrée « Connexion » comme la carte du bureau. « Mot de passe oublié ? » passe à droite sous
le champ, sans soulignement ; les comptes de démonstration ferment la feuille. Avant : un
bandeau de 200, un formulaire sur le beige, **440 px vides**, puis les comptes collés en bas.
Même feuille pour la première connexion (`FirstLoginPage`). Tablette et bureau inchangés.

### Le chargement LIVE (24/09)

Demande : *« une superbe animation de chargement personnalisée, sur les symboles de nos valeurs
LIVE »*. `LiveLoader` (`components/ui/LiveLoader.tsx`) pose les quatre signes dans leur carré
de la charte — angles emboîtés (vert), losange dans le losange (jaune), triangles en moulin
(bleu), cercles concentriques (orange) — et les anime **à tour de rôle, dans le sens des
aiguilles d'une montre**, chacun selon sa nature : les angles se tracent du plus petit au plus
grand, le losange pivote d'un quart de tour et son cœur bat, le moulin tourne, les cercles
émettent une onde. Le signe actif est plein, les autres à 28 %. Cycle 2,4 s ; sans mouvement,
ils s'allument seulement. Animations CSS dans `index.css` (§ « Le chargement LIVE ») ; jetons
`--tk-color-mark-live-*` (couleurs de marque, pour le motif seul, sur le bleu-noir).
`LoadingSpinner` le porte : **plein écran** (démarrage, documentation, galerie, chargement des
données) = le bleu-noir, les signes vifs à 72, « Tracker » et le message ; **dans une page** =
la version claire aux teintes du produit. Les chargements de page gardent leurs squelettes.

### Campagne au téléphone, bouton flottant de Finances (25/09)

- **Campagne (16.2)** — ce qui s'ouvre au toucher d'un site de l'inventaire :
  - **« Scanner » devient un bouton flottant étendu** (glyphe QR + mot, ancrage 17.6) au
    téléphone ; il quitte le héro, où il disparaissait au premier défilement. Au bureau,
    « Saisir un code » reste dans le héro. Le corps réserve 112 px sous la dernière rangée.
  - **Rangées `FactRow`** : le **modèle** en titre (on cherche un objet, pas un code), le
    code et le porteur dessous ; la vignette teintée par l'état (neutre à scanner, vert
    retrouvé, orange manquant, ambre hors site) ; à droite, seulement ce qui change —
    l'heure d'un retrouvé, « manquant », « hors site », et le local au bureau. « à scanner »
    ne se répète plus sur chaque ligne : la puce active le dit.
- **Finances au téléphone** : bouton flottant « Enregistrer une dépense » (acte unique, il
  ouvre la saisie directement), offert à qui a le droit d'écrire une dépense.

### L'état vide des listes, centré au téléphone (25/09)

Tâches (et toute liste de `ListTemplate`) : au téléphone, l'état vide restait collé sous la
recherche (titre à 281 px sur 852) — son conteneur ne prenait la hauteur restante qu'au bureau
(`expanded:flex-1`). Il la prend à toutes les largeurs : le bloc se centre dans l'espace entre
la recherche et la barre du bas (titre à 451). Même règle pour l'état hors ligne.

### La navigation de retour, relevée sur toutes les pages (25/09)

Demande : *« certaines pages comme Groupes n'ont pas de bouton retour ; fais un checking complet »*.
Relevé automatisé de **38 adresses × 2 largeurs** (393, 1 440) : titre, présence d'une flèche
dans l'en-tête, et **où elle mène** une fois touchée. Règle retenue : au bureau, les
destinations de la barre latérale n'ont pas de flèche (la barre y mène) ; toute autre page en a
une, au téléphone comme au bureau.

- **Retour qui ne faisait rien** (téléphone) : Catalogue, Emplacements, Inventaire, Finances —
  `goBack` renvoyait à la racine de la section, donc à la page elle-même. Depuis une racine, il
  mène maintenant à l'Accueil, comme Accès, Historique, Rapports et Paramètres.
- **Sous-pages en liste sans retour au bureau** : Groupes (→ Accès) et Dépenses (→ Finances).
  `ListTemplate` prend `retourAuBureau` et `backLabel` : la flèche de 20 se pose devant le titre,
  comme sur les fiches.
- Vérifiés sans défaut : fiches (actif, personne, type, modèle, rôle, site, demande, campagne),
  formulaires et imports, Lignes du budget, Exercices, Paramètres (et Mon compte → Paramètres),
  fenêtres Remettre / Retourner / Nouvelle demande / Inviter (« Fermer »).
- **La flèche suit le chemin parcouru** (25/09, décidé pour le commanditaire) : elle revient à
  l'écran d'où l'on vient — une fiche de personne ouverte depuis un rôle ramène au rôle, une
  fiche d'actif ouverte depuis l'Accueil ramène à l'Accueil — et ne remonte l'arborescence
  qu'à défaut de chemin (lien direct, rechargement). `lib/cheminParcouru.ts` : une pile
  d'adresses tenue par un seul écouteur (`installerCheminParcouru`, App.tsx), gardée pour la
  session de l'onglet ; revenir sur une adresse déjà visitée tronque la pile (après
  « Enregistrer », la flèche de la fiche ne rouvre pas le formulaire) ; la connexion la vide ;
  une redirection (`/rbac` → `/rbac/roles`) et un renommage de site **remplacent** l'adresse
  (`remplacerAdresseCourante`) au lieu d'en laisser une qui boucle ou ne mène plus nulle part.
  Branchée dans `goBack`, dans les flèches et « Annuler » d'`AppLayout` (`retourVers`, repli
  sur l'ancienne cible) et dans Accès (`retourAuxRoles`). Vérifié par 5 scénarios × 2 largeurs
  et 6 cas unitaires du module.

### Listes bornées : les modèles d'un type, les locaux d'un site (25/09)

Demande : *« la liste Modèles a beaucoup trop de lignes ; la carte Locaux ne doit pas grandir
indéfiniment »*. Nouveau `components/ui/ListeBornee` — la règle des cartes à hauteur fixe
(22/09) pour les listes d'une fiche sans plafond naturel : la liste se borne et **défile dans la
carte** (pas de « Voir plus », arbitrage du 23/09), la borne coupe une rangée en deux pour que
la suite se voie, un fondu au pied s'éteint en fin de liste, `overscroll-contain`, zone
atteignable au clavier ; `pleineLargeur` garde les rangées débordantes et les anneaux de focus
sans défilement horizontal. Menus de rangée dedans : `floating`.

- **Type › Modèles** : 5 rangées et demie au téléphone (22 rem), 2 rangées de tuiles et demie au
  bureau (18 rem) ; **triés du plus utilisé au moins utilisé**. Mesuré avec 22 modèles : carte
  416 px au téléphone (liste de 1 513), 352 au bureau (984).
- **Site › Locaux** : 22 rem au téléphone (« Ajouter un local » reste en pied de carte), 16,5 rem
  au bureau avec la tuile « Ajouter un local » **en tête** pour rester visible. Mesuré avec 15
  locaux : 456 px au téléphone, 332 au bureau.
- **Une rangée de plus, à la demande** (*« affiche une ligne supplémentaire pour la liste
  modèle »*, puis *« fais de même pour locaux »*) : 26 rem au téléphone pour les deux listes
  (6 rangées et demie), 25,75 rem au bureau pour les modèles et 23,25 pour les locaux (3 rangées
  de tuiles et demie). Remesuré : zone de 416 px au téléphone pour les deux ; au bureau 412
  (modèles) et 372 (locaux) ; aucun débordement horizontal, fondu éteint en fin de liste.

### Les vides dans leur carte, les filtres à leur place (25/09)

Demande : *« revue de l'état par défaut vide de plusieurs pages, ils ne sont pas dans le
dynamisme de notre design system, exemple la page Dépenses — pas besoin de ce bouton
Enregistrer une dépense au centre ; vérifie que toutes les pages sont alignées avec nos
conventions ; la position du filtre de la page Campagne ne les respecte pas »*. Relevé au banc
(listes vidées, réensemencement coupé par `VITE_DISABLE_DEMO_RESEED`), 393 et 1440.

**Quatre règles, désormais celles de tout vide :**

- **V1 — Le vide d'une liste reste dans sa carte.** Il flottait sur le canevas en forme
  d'écran (rond de 96, titre de 22), sous un héro qui, lui, est une carte. `ListTemplate`
  pose maintenant la carte des rangées autour de `empty` (même mesure, pleine hauteur) et les
  pages y mettent un `CardEmptyState` : Actifs, Équipe, Tâches, Historique, Dépenses, Groupes,
  Accès, Inventaire physique ; Catalogue et Emplacements (en-têtes écrits à la main) font de
  même. `ScreenState` reste aux écrans qui *sont* l'état : introuvable, refusé, hors ligne,
  fiche absente, « Aucune campagne ouverte ». Les enfants ne suivent plus sous le vide (ils
  n'y portaient que l'en-tête d'un tableau vide).
- **V2 — Le vide ne redouble pas le geste de la page.** Retirés : « Enregistrer une
  dépense », « Ajouter un équipement », « Ajouter une personne », « Créer le premier pays »,
  « Ajouter le premier modèle » (fiche d'un type), « Ajouter une ligne » (Lignes du budget
  au bureau). Le geste reste à sa place — flottant au téléphone, dans l'en-tête au bureau.
  **Contre l'arbitrage du 06/09** (17.1 / 17.6 : « le vide ouvre la même feuille ») et 09.1
  colonne 3. Emplacements garde son bouton flottant sur un référentiel vide (il disparaissait,
  le vide portait seul le geste) et sa feuille met « Un pays » en tête tant qu'il n'y en a
  aucun.
- **V3 — Filtré, le vide le dit** : entonnoir, « … ne correspond », une seule sortie en
  bouton cerné qui nomme ce qu'elle rend (« Voir les 14 équipements »). Tâches affichait
  « Vous êtes à jour » sous une recherche sans résultat : corrigé.
- **V4 — Un vide de carte est un `CardEmptyState`, jamais une ligne sous le titre** (règle du
  22/09, restée non appliquée à quatre endroits) : Finances › Les postes, Modèle › Unités,
  fiche d'une personne › Équipements détenus, Type › Modèles. Le pied « Voir les N unités »
  d'un modèle ne paraît plus que s'il reste des unités à voir (il disait « Voir les 1 unités »).

L'ancienne forme `EmptyState` (carré de 56, titre en 700) n'avait plus que les huit vides de
la campagne : portés en `CardEmptyState` (vert pour « Tout est retrouvé », « Aucun manquant »,
« Aucun écart »), composant supprimé, spécimen de la galerie remplacé.

**Au passage, un écart de convention** : le Catalogue n'avait **aucun geste d'ajout au-delà du
téléphone** (le bouton flottant y est réservé). Il a son « Ajouter ⌄ » d'en-tête, les trois
chemins de la feuille en menu ancré, comme Actifs.

**La campagne — les puces montent dans la bande fixe** (contre 16.2, qui les pose sous le
héro, dans ce qui défile). La règle de toutes les listes (17.8 : un filtre posé ne part pas au
premier défilement ; R11) : au bureau, la ligne d'outils sous le titre porte la recherche à 320
et les puces ; au téléphone, la bande porte la recherche et l'entonnoir, la feuille « Filtrer »
porte « Ce qu'on regarde », et la ligne de compte (« Les 8 qui restent à trouver · 8 sur 8 »)
est fixe elle aussi. L'en-tête du téléphone est devenu `sticky` (il défilait). **Nouveau** : la
recherche « Modèle, code, porteur » — elle ne fait que chercher, elle n'enregistre pas de scan
(« Saisir un code » reste dans le héro) ; posée, le compte dit « 1 des 8 ».

Mesuré : bande de recherche à 80 px avant et après 400 px de défilement (téléphone), 90 au
bureau ; vides filtrés relevés sur dix listes aux deux largeurs ; balayage 4 comptes × 22 pages
× 2 largeurs : 0 panne.

### Les noms longs, au téléphone d'abord (25/09)

Demande : *« j'avais signalé que certaines listes comme Équipements ont des noms d'équipement
trop longs — version mobile »* (le 24/09, « les lignes de Modèles sont trop longues » avait été
lu comme une largeur de rangée, pas comme une longueur de nom). Relevé au banc avec des noms du
parc réel (`Togo-AP55C-A400474CC7A47E7-NEW-BAT`, « HP EliteBook 840 G8 Notebook PC … — Direction
financière ») : coupés au bout d'**une** ligne, ils perdaient leur fin — le numéro ou le service
qui les distingue de leurs voisins. Au bureau, la colonne Modèle (11 %) coupait tout
(« Lenovo Thin… »), et le héro d'un modèle prenait quatre lignes en 28.

**Règle (`lib/nomLong`)** : le titre d'une rangée, d'une tuile ou d'une cellule prend **deux
lignes avant l'ellipse**, se coupe aux tirets et au besoin n'importe où (`overflow-wrap:
anywhere`, un code n'a pas d'espace), et garde le nom entier en infobulle ; la sous-ligne reste
sur une ligne. `whitespace-normal` est dans la règle : un titre posé dans un `Button` héritait
de son `nowrap`. Appliquée à `ListRow` (Actifs, campagne, Équipe, choix d'un modèle),
`FactRow`, `ActSheet` (parties et choix d'un objet), aux tuiles de modèles d'un type, aux
rangées « Équipements détenus » d'une fiche, au titre d'une tâche, à la file « À traiter » de
l'accueil, au code d'une carte d'écart, à la rangée d'une demande.

- **Tableau** : `DataColumn.wrap` — Code et Modèle des Actifs sur deux lignes ; Modèle passe
  de 11 à 19 %, pris aux colonnes à vocabulaire fixe (Code 24, Porteur 14, Site · local 15,
  État 14, Dernier mouvement 14). Le fait de l'Historique aussi.
- **Héro** : un sujet de plus de 28 signes descend d'un palier (28 → 22), toujours entier.
- **Référence** : un numéro de série long passe à la ligne au lieu de sortir de la rangée.

Mesuré à 393 : rangée de 92 px pour un nom sur deux lignes, 72 pour un code court, aucun
débordement horizontal sur dix écrans ; balayage 4 comptes × 22 pages × 2 largeurs : 0 panne.

### Amortissement, fiche d'un rôle, page d'un groupe, recadrage de signature (25/09)

Demande : *« refonte des pages amortissement, détails rôle et détail groupe, recadrage de
signature importée plus efficace version mobile »*, puis *« la zone de cadrage est trop petite,
c'était là mon véritable problème »*. Relevé avant/après au banc, 393 et 1440.

**Recadrage de signature (07.1)** — au téléphone le cadre 3:1 tenait 330 × 110 dans une boîte
de 320, l'image n'était visible que dans le cadre, arrivait au hasard de sa composition, et
« pincez pour zoomer » était écrit sans être programmé.
- **Plein écran au téléphone** (contre 07.1, « zone 320 de haut ») : fond sombre, l'image sur
  toute la hauteur (535 px à 393), le cadre sur toute la largeur (369 × 123), les réglages en
  pied. Au-delà du téléphone, la scène reste dans la page (560 × 320).
- **Cadrage automatique** : l'image est lue une fois (fond = 80ᵉ centile de luminance, encre =
  ce qui s'en écarte) ; le cadre se pose sur le tracé avec sa marge. Double toucher ou
  « Recadrer automatiquement » y revient.
- **Gestes** : glisser, **pincer** (deux pointeurs, autour de leur milieu), molette au bureau.
- **Le fond est effacé** : le PNG ne garde que le tracé, qui se pose sur la case verte de
  l'attestation au lieu d'y faire un rectangle de papier. Le cadre le montre sur blanc.
  (« Ni seuil de contraste » de 07.1 tombe : le seuil est automatique, sans commande.)

**Fiche d'un rôle** — 2 200 px au téléphone, sept rangées « lecture », une carte qui affichait
`kind === 'system'`, une note ambre de 250 signes. Désormais : héro (porteurs, vues x/10,
actions x/14, connexion en une phrase ; « ne se supprime pas » dans le surtitre), **Qui le
porte** en tête (liste bornée), **Ce qu'il ouvre** en pastilles (cochables en modification),
**Ce qu'il permet** avec les refus dans la même carte, **Où il s'applique** avec l'héritage.
Au téléphone les actes passent dans le ⋮ ; en modification, le pied « Annuler · Enregistrer »
prend la place de la barre du bas (régime de 17.2). Au bureau, deux colonnes 7 | 5.

**Page d'un groupe** (`/rbac/groups/:id`, contre l'arbitrage « un groupe n'a pas de fiche : une
feuille suffit ») — héro (portée « Pays : France », membres, rôles, droits en plus), **Ses
membres**, **Ce qu'il ajoute** (le rôle, qui ouvre sa fiche), **Où il s'applique**. « Ajouter ou
retirer des membres » : une liste à cocher, un seul enregistrement pour plusieurs changements.
**Correctif** : porteurs et membres se comptent désormais sur l'affectation (enregistrée, sinon
déduite du compte) — une personne ajoutée depuis l'écran n'apparaissait jamais, l'ajout écrivant
l'affectation et le compte lisant `rbacGroupIds`.

**Amortissement (14.1)** — un aperçu dessine la courbe de valeur du plan par défaut, avec sa
phrase (« Il perd 33,3 % de son prix chaque année ; il ne vaut plus rien au bout de 3 ans ») ;
la méthode se choisit sur deux cartes à courbe ; durée et résiduel se règlent au pas
(`components/ui/Stepper`, nouveau) au lieu de champs de 96 px sans unité ; les types paraissent
sous leur nom français, ceux qui prennent le défaut d'abord, et ouvrent leur fiche. Le renvoi
« La devise et l'année fiscale sont ailleurs » tombe. **Écart signalé à l'écran** : le calcul du
parc reste linéaire quelle que soit la méthode (`calculateLinearDepreciation`) ; choisir le
dégressif affiche « Les valeurs du parc se calculent encore en linéaire ».
`lib/financial.echeancierAmortissement` ne sert que l'aperçu.

Mesuré : ajout d'un membre (1 → 2, la liste suit), modification d'un rôle au téléphone (2/10 →
3/10 vues), pincement 2,7× → 5,4× ; balayage 4 comptes × 22 pages × 2 largeurs : 0 panne.

### Finances : six postes au bureau (25/09)

Demande : *« réduire le nombre de lignes de Les postes à 6 »*. `POSTES_MONTRES` passe de 8 à 6 :
la carte montre les six postes les plus entamés, puis « Voir les N postes » ; le téléphone en
garde trois. Vérifié avec 13 postes : « les 6 plus entamés sur 13 », pied « Voir les 13 postes ».

### Les noms longs tiennent une ligne (25/09, second arbitrage)

Demande : *« il faut tronquer les noms d'équipement trop longs, exemple
Togo-AP55C-A400474CC7A47E7-NEW-BAT, en version mobile comme desktop, pour que les lignes soient
harmonisées et pas certaines plus hautes que d'autres »*. **Contre la règle du matin** (« deux
lignes avant l'ellipse ») : `lib/nomLong` pose désormais `NOM_SUR_UNE_LIGNE` (`block min-w-0
truncate`) sur les mêmes titres — `ListRow`, `FactRow`, `ActSheet`, tuiles de modèles, rangées
« Équipements détenus », tâches, file « À traiter », carte d'écart, demande. Le nom entier reste
en infobulle et sur la fiche. `DataTable` perd son option `wrap` : Code, Modèle (Actifs) et Fait
(Historique) reviennent à une ligne coupée. L'identifiant de droite d'une rangée (`ListRow`, vue
en cartes) se coupe aussi, borné à la moitié de la ligne : il écrasait l'état et sortait de la
carte.

Mesuré avec `Togo-AP55C-A400474CC7A47E7-NEW-BAT`, un nom de 80 signes et un code de 58 sans
séparateur : rangées toutes à 72 px au téléphone, 68 en cartes (768 et 1440), 48 en tableau ;
aucun débordement.

### Noms longs sur les pages, photos jointes, tablette (25/09, fin de journée)

**Noms longs, suite** (*« les noms sont toujours trop longs dans les listes sur la version
mobile »*). Relevé à 393 sur quatorze écrans, noms injectés dans le parc, le journal et les
demandes : seule la liste « Derniers événements » de l'accueil passait encore à la ligne (quatre
lignes pour « Vous avez ajouté … »). Elle tient une ligne, comme l'historique d'une fiche. Hors
listes : une valeur de référence qui est une chaîne (modèle, numéro de série) se coupe sur une
ligne — l'infobulle la montre, le bouton copie la valeur entière — et le sujet d'un héro
s'arrête à **deux lignes**.

**Photos jointes** (*« on n'a pas de miniature de la photo qu'on importe dans certains
formulaires, comme Déclarer un incident ; le projet crée des icônes, qui disparaissent au
clic »*). Le champ ne gardait que le nom du fichier : une icône d'appareil photo par photo, et un
toucher la retirait. Nouveau `components/ui/PhotosJointes` + `usePhotosJointes` : la miniature
réelle (56), un toucher l'ouvre en grand sur fond sombre avec « Retirer la photo », la croix du
coin la retire ; les adresses locales sont libérées au retrait et à la fermeture. Posé sur
« Déclarer un incident » et « Réceptionner le retour » ; l'acte enregistre toujours les noms.

**Tablette** (*« la version tablette est loin d'être convenable ; le menu latéral devrait exister
en mode rétracté uniquement »*).
- La barre latérale n'existe que **repliée sous 1280** (`MEDIA.bureau`, nouveau) : déployée,
  elle prenait 240 px d'un iPad en paysage (1024 à 1194). Elle ne se déploie qu'au bureau.
- `MEDIA.twoColumn` passe de **1280 à 1100** : le seuil supposait la barre déployée
  (1280 − 240) ; avec la barre repliée, 1100 − 64 donnent la même largeur. À 1180, les fiches
  (équipement, personne, type, site, rôle, groupe), les panneaux (Tâches, Inventaire physique),
  les tableaux (Actifs, Historique) et l'accueil prennent leur mise en page de bureau ; ils
  restaient sur une colonne étirée sur 1 000 px. Sous 1100 (iPad en portrait, 1024), la
  colonne unique reste.
- **Reste** : Finances et quelques grilles suivent les classes `large:` (1200), pas
  `twoColumn` ; entre 1100 et 1199 elles gardent leur forme en colonne.

Mesuré : barre de 64 à 820, 1024, 1133 et 1180, contenu de 756 à 1 116 px, aucun débordement ni
erreur sur vingt écrans par taille.

### Tablette au doigt : rien ne se révèle au survol (25/09)

Relevé en émulant une vraie tablette (écran tactile, `hover: none`) à 1180 × 820 : depuis le
passage de `twoColumn` à 1100, les Actifs et l'Équipe s'ouvraient en **tableau** sur un iPad en
paysage, avec **28 et 11 commandes invisibles** (case de sélection, ⋮ de rangée, révélées au
survol seulement) et 17 et 14 cibles sous 40 px. Corrigé : `useListView` n'ouvre le tableau par
défaut qu'**à la souris** (`MEDIA.hoverCapable`) — au doigt, les cartes ; le tableau reste au
choix — et `DataTable`, sans survol, affiche en permanence la case et les actes. Remesuré : 0
commande cachée, 0 cible trop petite sur Actifs, Équipe et Historique.

### Format tablette, lot P1 : le rail à mots, deux colonnes dès 1 000, filtres et feuilles (25/09)

Appliqué à la demande (*« applique le P1 »*) de la proposition « format tablette » publiée le même
jour (revue mesurée au doigt, lignes directrices Material 3 et iPadOS). Trois lots.

**P1a — le rail porte ses mots.** Sous 1 280, la barre repliée n'était que des glyphes de 20 dans
64 px, et leurs noms des infobulles qu'un doigt ne fait jamais paraître. Sur tablette, la barre
devient le rail de Material : **80 px, le glyphe de 24 dans un creux de 56 × 32, le mot en 12 sur
16 dessous**, et **sept cases au plus**. Un compte de sept destinations ou moins les voit toutes ;
au-delà, les quatre principales, puis l'inventaire physique et les finances, et « Plus », qui
ouvre le reste **à droite du rail** (nouveau `placement="right"` du `Menu` flottant), par groupes
séparés d'un filet ; la case « Plus » s'allume quand on est sur l'une de ses pages. Le menu du
compte s'ouvre lui aussi à droite du rail, au lieu de le couvrir. **Écart assumé contre 00.3 et
l'arbitrage du 22/09** : 00.3 dessine le rail à 88 avec le mot en 11, le 22/09 avait retiré le
mot (noms coupés à 64 px). À 80 px et 12 px, les sept mots tiennent sur une ligne ; au rail,
l'inventaire physique porte le libellé du registre, « Inventaire ». Le **bureau replié** (≥ 1 280,
à la souris) garde les glyphes seuls et leurs infobulles.

**P1b — deux colonnes dès 1 000.** `MEDIA.twoColumn` passe de 1 100 à **1 000** : l'iPad de 1 024
en paysage (944 px à côté du rail) prend enfin les fiches à deux colonnes, les panneaux à deux
niveaux et l'accueil en grille. Un écran Tailwind **`deux:`** (1 000) suit le même seuil pour ce
qui attendait `large:` (1 200) : Finances (tuiles, histogramme, postes), l'index des Paramètres et
l'amortissement, les formulaires à double mesure (`COLONNES_FORMULAIRE`, `MESURE_DOUBLE`, le bouton
d'enregistrement), les ajouts d'équipement et de personne, l'import de référentiels.

**P1c — filtres et feuilles.** `BottomSheet` reçoit un **emploi** : `acte` (défaut) ou `filtre`. Une
feuille de filtre monte du bas au téléphone ; **de 600 à 839, du bas encore mais 640 de large au
plus** ; **dès 840, en panneau de 360 à droite, sur toute la hauteur et sur un voile de 12 %**,
pour que la liste filtrée reste lisible. Son pied (« Tout effacer · Voir les N », marqué
`data-pied`) descend au bas du panneau et y reste. Les huit feuilles de filtre sont passées
(Actifs, Équipe, Tâches, Catalogue, Historique, Dépenses, relevé d'inventaire, périmètre de la
campagne). Les feuilles d'acte — `BottomSheet` en emploi `acte` et `ActSheet` — restent centrées
au-delà du téléphone mais **ne dépassent plus 640 px de haut** (la feuille de formulaire
d'Apple) : « Remettre l'équipement » montait à 90 % d'un iPad debout.

Mesuré (émulation tactile à 768 × 1024, 820 × 1180, 1024 × 768, 1180 × 820 ; souris à 1 440) :
rail de 80, sept cases de 62 px, aucun mot coupé ; « Plus » à 8 px du rail ; filtre de 640 × 507
en bas à 768 et 820, panneau de 360 × hauteur de fenêtre dès 1 024, pied à 12 px du bas ; feuille
d'acte de 560 × 640 au plus ; formulaires sur deux colonnes dès 1 024, une à 820 ; aucun
débordement horizontal.

Le rail selon le compte : super admin et admin — six cases et « Plus » (Catalogue, Emplacements,
Historique, Rapports, Accès) ; manager — sept destinations, toutes au rail, sans « Plus » ;
employé — quatre cases, « Mon historique » sur deux lignes. Balayage des quatre comptes à 393,
768, 1 024 et 1 440 sur vingt-deux écrans : aucune panne.

### Format tablette, lot P2 : liste et fiche dès 840, un panneau tenu, la densité suit le pointeur (25/09)

Appliqué à la demande (*« applique le P2 »*). Trois lots.

**P2a — la liste et la fiche côte à côte, dès 840.** Actifs, Équipe et Historique posent, en
cartes, **la liste fixe de 360 px à gauche et la fiche dans le reste** (`ListTemplate
listeEtFiche`) ; toucher une rangée ouvre l'objet à droite, la rangée ouverte garde le creux
`--inset-2`. La fiche est **la page elle-même** (`EquipmentDetailsPage`, `UserDetailsPage`) rendue
dans le panneau (`PanneauDeFiche`, `FicheEnPanneauContext`) : mêmes cartes, mêmes gestes ;
`DetailTemplate` y pose un en-tête sans retour — le nom en titre de feuille, « Ouvrir en pleine
page », le ⋮ — et une seule colonne. Pour l'Historique, le fait s'y lit dans une carte
(`FactSheet enPanneau`), et le tableau du journal exige désormais une souris. **L'objet ouvert est
dans l'adresse** (`?ouvert=ID`, `useObjetOuvert`) : un rechargement, un lien, le retour depuis la
pleine page le retrouvent ; sous 840 — un iPad qu'on tourne —, la liste passe la main à la page
de l'objet (ou à la feuille du fait), et le retour ramène à la liste sans rebondir. Changer
d'objet n'est pas un pas du chemin parcouru. Au tableau, la rangée ouvre la page, comme avant ;
au bureau à la souris, le tableau reste le défaut et rien ne change. **Tâches** ouvre son panneau
dès 840 (au lieu de 1 000), avec la file à 360 sous 1 280 ; au-delà, les douzièmes de 03.3.

**P2b — un panneau tenu.** De 600 à 999, et dans le panneau d'une liste, **le héro met ses chiffres
en ligne** sous un filet au lieu de tuiles de 70 px : le héro d'un actif passe de 439 à 358 px à
768. Les cartes d'une fiche vont **par deux** dès que leur colonne fait 680 px (requête de
conteneur, pas de fenêtre) : Référence à côté de Garantie, Réglages à côté de Modèles ; la fin de
page (l'historique) garde la largeur. **Écart avec la proposition** : à 768 (colonne de 640), la
paire laissait 312 px à la carte de référence et coupait le numéro de série ; le seuil est posé à
680, la paire vaut donc dès 820 (iPad Air, Pro 11) et 768 garde une colonne. À 820, un numéro de
série de 13 signes perd encore 8 px (coupé sur une ligne, copiable en entier). La colonne de 720 de
la proposition ne se pose pas : avec le rail de 80, le contenu fait au plus 711 px sous 840. Ligne
la plus longue mesurée : 41 à 48 signes (104 avant, à 768).

**P2c — la densité suit le pointeur.** Une variante Tailwind **`doigt:`** (fenêtre ≥ 840 tenue
sans souris, `pointer: coarse`) rend leurs 48 px aux gestes de 40 du chrome du bureau : boutons
d'en-tête et d'outils, tri, bascule Cartes / Tableau, recherche, filtre, carré d'icône, rangées de
la barre latérale. Repliée au doigt au-delà de 1 280, la barre devient le rail à mots (une
infobulle ne paraît jamais sous le doigt). Mesuré à 1 366 × 1 024 au doigt (iPad 13") : **aucune
cible sous 44 px** sur sept écrans (12 à 19 par écran avant) ; à 1 440 à la souris, rien ne change
(rangées de 40, glyphes seuls repliée).

### Format tablette, lot P3 : les largeurs libres et le clavier (25/09)

Appliqué à la demande (*« applique le P3 »*).

**Les largeurs d'iPadOS 26.** Les fenêtres s'y redimensionnent librement : le produit a été
balayé à **500, 600, 744, 820, 840, 1 024, 1 133, 1 180, 1 280 et 1 376 px**, au doigt, sur
vingt-quatre écrans (listes, fiches, finances, réglages, formulaires, tâches). Rien ne déborde,
rien ne casse. La navigation bascule où elle doit : barre du bas sous 600, rail à mots de 600 à
1 279, barre déployable dès 1 280 ; la liste et la fiche dès 840. Le relevé mesure la **zone de
frappe réelle** (la couronne `::before` comprise) contre 44 px. Trois lacunes, corrigées :
- **la variante `doigt:` commençait à 840** : le rail (600–839) porte déjà le chrome du bureau, et
  « Filtrer » et le tri y restaient à 40 au doigt. Elle vaut dès 600 ; le téléphone ne change pas ;
- **les pastilles** (`FacetChip`) n'avaient aucune couronne, au téléphone comme ailleurs : elles
  reçoivent `touch-target` (48 de frappe, rien de visible), et la bande du bureau ses 48 visibles ;
- **le chiffre cliquable d'une carte** (`Figure`, « 14 actifs » de l'accueil, 65 × 28) reçoit la
  couronne. « Choisir » (59 × 35) et l'ⓘ de la campagne (18 × 18) avaient déjà la leur.

**⌘K (Ctrl+K) pour chercher.** Le curseur va dans la recherche de la page (`ListTemplate` la
marque `data-recherche-de-page`), ou dans celle de la feuille ouverte — le choix d'un
bénéficiaire ; sur une page sans recherche, Actifs s'ouvre, le curseur dans son champ. Au bureau,
à la souris, le champ vide porte la marque « ⌘K » (« Ctrl K » hors Mac) en encre tertiaire, qui
s'efface au focus.

**Échap pour fermer — une chose à la fois, la plus proche.** Les feuilles, dialogues, menus et
aperçus le traitaient déjà. S'y ajoutent : le viseur de scan (la saisie manuelle d'abord), la
**fiche ouverte à côté d'une liste**, la tâche ouverte dans le panneau de Tâches, et la
**sélection groupée**. La page ne ferme rien tant qu'un calque est ouvert (`lib/clavier.ts`).
Dans la recherche, Échap vide le champ, puis rend la main à la page.

**Relevé en passant — un acte engagé depuis la fiche d'un panneau.** « Attribuer » dans la fiche
ouverte à côté d'Actifs posait la **page** de l'actif sous la feuille, et la refermer y restait :
la liste était perdue. L'adresse de l'acte garde maintenant l'objet ouvert (`ouvert=`) : la liste
et sa fiche restent sous la feuille, et la refermer y ramène. La coque retenait aussi, dans un
rendu intermédiaire, l'adresse de l'acte comme « écran précédent » ; elle ne retient plus une
adresse d'acte.

Mesuré au banc : quatorze vérifications clavier sur quatorze (⌘K et Ctrl+K, depuis une liste,
depuis Finances, dans une feuille ; Échap sur la recherche, une feuille puis la fiche, un acte,
la sélection, une tâche).

### Le mouvement : ouvertures, fermetures, passages (26/09)

Demandé : *« améliore les animations et les transitions — les ouvertures, fermetures, etc. »*.

**Ce qu'on a relevé.** Les feuilles ne glissaient que de **16 px** (`slide-in-from-bottom-4`) : elles
apparaissaient en fondu au lieu de monter du bord. **Trois classes employées n'existaient pas** —
`slide-in-from-bottom` (la feuille « Plus » du téléphone, `Modal`), `slide-in-from-left-4` (le
panneau de gauche), `medium:zoom-in-95` (une classe CSS écrite à la main ne prend pas de variante) :
ces surfaces ne bougeaient pas. **Les durées `duration-short4` · `duration-medium2` ne réglaient
que les transitions**, pas les animations : le menu s'ouvrait en 300 ms au lieu de 200. Et **la
moitié des surfaces se démontaient à la fermeture** : feuilles d'acte, confirmations, menus, feuille
« Plus », aperçus de photo, feuille de demande — elles disparaissaient d'un coup.

**Sept rôles de mouvement** (`index.css`, « Le mouvement du produit »), sur les jetons de Material 3 —
entrer décélère sur 250 à 400 ms, sortir accélère sur 100 à 200 ms :
- `mvt-feuille-*` — la feuille du bas **monte du bord de l'écran** (400 ms) et y redescend (200) ;
- `mvt-dialogue-*` — le dialogue centré se pose (fondu, 97 %, 8 px ; 250) et s'efface (150) ;
- `mvt-panneau-*` — le panneau latéral glisse de son bord (400) et y retourne (200) ;
- `mvt-voile-*` — le voile suit sa surface ; `mvt-menu-*` — le menu se déplie depuis son ancre (200)
  et s'efface (100) ; `mvt-contenu` — un contenu en remplace un autre (fondu, 6 px) ; `mvt-barre`.

**Toute surface part comme elle est venue.** `usePresence` garde une surface montée le temps de sa
sortie (filet de sécurité à 400 ms) ; `useDerniereValeur` garde son contenu quand l'appelant la
montait sur `{acte && …}`. Posés sur `BottomSheet`, `ActSheet`, `ConfirmationSheet`, `SideSheet`,
`Modal`, `Menu`, la feuille « Plus », `ImagePreview`, `PhotosJointes` ; les feuilles d'acte de la
coque, de la fiche, des tâches et de l'approbation restent montées et reçoivent `open`. Une feuille
d'acte se remet à zéro à **l'ouverture** — remise à la fermeture, elle sautait d'étape en partant.
Tirée vers le bas puis lâchée, une feuille **repart de là où le doigt l'a laissée** (elle remontait
d'un coup avant de redescendre). Pendant sa sortie, elle ne retient plus le doigt.

**Le passage d'une page à l'autre** (`useTransitionDePage`, API Web Animations, sans remonter la
page) : **fondu** d'une destination à l'autre (200 ms) ; **de la droite** en descendant d'un cran,
**de la gauche** en remontant (300 ms, 24 px). Une feuille ouverte sur une page ne change pas la
page : rien ne bouge. Un formulaire plein écran (`data-plein-ecran`) garde sa propre entrée — il
monte du bord au téléphone — et termine l'animation de ses ancêtres, qui le cadreraient sinon.
Les entrées propres de `PageContainer` (500 ms) et de Finances, qui s'y seraient ajoutées, tombent.

**Les petits mouvements.** La fiche qui en remplace une autre dans le panneau d'une liste, la tâche
ouverte dans Tâches : fondu. La barre latérale se replie en glissant (250 ms). Une rangée de liste
s'éclaire sous le doigt, jusqu'aux bords de sa carte. La barre de la sélection groupée monte du bas.

**Réduire les animations** : rien ne bouge (la règle globale ramène tout à 1 ms), et les surfaces
se ferment quand même. Mesuré au banc (`document.getAnimations()`) : 29 vérifications sur 29 —
téléphone, tablette, bureau, mouvement réduit —, un formulaire plein écran calé sur la fenêtre à
chaque image de son entrée, et les quatorze vérifications clavier du P3 toujours vraies.

### Revue du texte et de l'espacement, trois formats (26/09)

Demandé : *« revue spacing, police, typographie des versions mobile, tablette et desktop »*, puis
*« fais des recherches en ligne pour t'inspirer des meilleures applications »*. Relevé mesuré de
24 écrans à 393, 820 et 1 024 au doigt et 1 440 à la souris (fonte, taille, interligne, graisse de
chaque texte ; retrait, gouttière et écart de chaque carte), comparé à Material 3, Apple, Primer,
Atlassian, Polaris, Carbon, Fluent 2 et aux règles d'Inter. Proposition publiée :
https://claude.ai/artifact/FurEuKeEgkY2AcZXVQDGsu

**Conforme aux références** : corps 16/24 au téléphone et 14/20 au bureau, tablette au doigt sur
l'échelle du téléphone (l'iPad reprend celle de l'iPhone), gouttières 16 · 25 · 31 · 40, écart de
16 entre cartes, rangées 72/68, lignes de 41 à 48 signes, graisses 400 · 500 · 600 ; 89 à 91 % des
textes dans l'échelle.

**Corrigé** : les en-têtes du tableau des lignes du budget sortaient en 700 (un `th` natif n'hérite
pas de la graisse de sa rangée) → 500 ; les initiales des « Derniers événements » tenaient 13 dans une
vignette de 40 → la taille de rangée de toutes les autres vignettes.

**En attente d'arbitrage** (lots de la proposition) : un seul retrait de carte (16 au téléphone,
20 dès 600 — aujourd'hui 16 et 20 mêlés dans chaque format) ; les phrases écrites en 12 (13 au
téléphone, 19 au bureau) au texte secondaire ; les interlignes hors échelle (12/18, 14/21, tuiles
22/26) ; le chrome de la tablette au doigt aux tailles du téléphone ; titre de page 28/34 ;
approche d'Inter et montants d'affichage à 40/48.

**Décidé et appliqué** (*« décide pour moi »*, 26/09) :
- **Retrait des cartes : 16 partout**, et non 20 dès la tablette comme proposé d'abord. Le bureau a
  choisi le 22/09 la densité des outils de travail (texte en 14) ; Primer et Material posent 16 à
  toutes les tailles ; toutes les rangées sont calées sur 16 (rangée cochée ou ouverte jusqu'aux
  bords, filets pleine largeur). Dix-sept cartes à 20 ramenées à 16 (Accès, fiche d'un modèle,
  campagne, Rapports, Finances, amortissement, imports) ; dans les Accès, les `RuleGroup` perdent
  leur `px-5` et leurs rangées pleine largeur (`-mx-5` → `-mx-4`) — leur pied de note, calé sur 16,
  restait décalé de 4 px. Le héro sombre et les panneaux qui reprennent une feuille gardent 20.
- **Les phrases au secondaire** (`text-ts-sub`, 14 puis 13 au bureau) : sous-lignes et notes de
  `RuleGroup` (écart assumé contre 14.1, qui les dessine en 12 — elles passent à la ligne plutôt que
  de serrer la valeur), note du héro, notes du Catalogue et de l'accueil, `Notice`, notes des
  sous-écrans de Réglages, de l'import et d'une dépense. Le 12 reste aux étiquettes, dates, comptes,
  surtitres et légendes de figure.
- **Interlignes** remis dans l'échelle (lien de pied de carte, rangées de l'accueil, chiffres de la
  bande en 22/28, « depuis N jours »). Piège relevé : `cn()` retire `leading-*` quand une taille de
  texte suit dans les classes d'un bouton — poser l'interligne après la taille.
- **Chrome de la tablette au doigt** aux tailles du téléphone (`doigt:text-ts-*`) : boutons d'en-tête
  15, pastilles et menus de filtre 15, tri et compte 14, rangées de la barre latérale 14, recherche
  **16** (sous 16, Safari agrandit la page au focus).
- **Titre de page 28/34** au doigt (`--tk-ts-page-line`), 24/32 au bureau
  (`--tk-ts-page-line-bureau`, et `.page-title`).
- **Grands montants 44 → 40/48**. L'approche d'Inter n'est pas touchée.

Remesuré : 92 à 94 % des textes dans l'échelle (91 avant), cartes à 16 sur les quatre formats,
phrases en 12 de 13 à 7 au téléphone et de 19 à 8 au bureau (légendes seulement), aucune graisse
700 ; balayage des quatre comptes sans panne.

### Le mouvement, seconde vague : la page s'assemble, les mesures se remplissent (26/09)

Demandé : *« encore plus de fluidité et plus d'animations, mobile, tablette et desktop »*.
Toujours sur les jetons de Material 3, et rien ne bouge sous « Réduire les animations ».

- **La page s'assemble à son arrivée** (`useEntree`, fenêtre de 900 ms) : les rangées d'une liste
  (`data-rangee` sur `ListRow`, `SelectableRow`, les rangées de l'Historique et les `tr` de
  `DataTable`) et les cartes d'une fiche, de l'accueil, de Finances, des Réglages, des Rapports et
  de la campagne entrent en cascade — fondu et 6 px, 25 ms d'écart, les douze premières. Une rangée
  montée ensuite (au défilement, par un filtre) arrive sans cascade. Dans le panneau d'une liste, la
  fiche garde son seul fondu.
- **Les chiffres comptent** (`ChiffreAnime`) : la bande de l'accueil (`Figure`), les tuiles de
  Finances, les grands nombres de l'accueil, de la campagne, des Dépenses et des Lignes du budget —
  de 0 à leur valeur en 700 ms, puis de l'ancienne à la nouvelle quand elle change. Seuls les entiers
  comptent ; la largeur finale est réservée (rien ne bouge autour) ; le lecteur d'écran lit la valeur
  finale.
- **Les jauges se remplissent** (`mvt-jauge`, 20 barres, `ProportionRow` compris) depuis la gauche,
  et glissent quand leur valeur change ; **l'histogramme** de Finances monte mois après mois.
- **La navigation répond** : le creux de la destination choisie se déploie dans le rail ; l'icône
  choisie de la barre du bas rebondit.
- **Les petits contrôles** : la coche d'une case arrive avec un rebond, le chevron d'un menu de
  filtre pivote à l'ouverture, pastilles et bascule Cartes / Tableau changent de couleur en fondu ;
  les faits dépliés de l'Historique arrivent en fondu.
- **Le défilement reste où il est** : feuilles, feuille d'acte, confirmation, panneau latéral,
  « Plus » et panneau d'une liste ne propagent plus leur défilement à la page (`overscroll-contain`).

Relevé en passant : l'avance d'un compte pouvait être négative une image (horodatage antérieur au
départ) — un chiffre passait par « −3 » ; bornée. Mesuré (`document.getAnimations()`) : 19
vérifications sur 19 aux trois formats et en mouvement réduit ; 1 277 images de chiffres sans valeur
négative.

### Tâches au bureau, refondue : la file dit ce qui presse et se traite sans la quitter (26/09)

Proposée le 26/09 (relevé mesuré au banc, maquette, six lots), acceptée telle quelle (*« okay go »*),
avec les réponses recommandées aux trois questions : retard en ambre à 3 jours et en rouge à 7, liste
fixe de 400, « ce qui presse d'abord » par défaut.

- **« À faire » = ce que vous pouvez faire, et un seul décompte.** La file est construite une fois
  (`features/tasks/lib/file.ts`, `useFileDeTaches`) ; la page, l'accueil, la barre latérale et la
  barre du bas la lisent. La règle est `approvalAttendLActeur` (nouvelle, dans `businessRules`) : le
  manager du bénéficiaire pour une validation, l'informatique pour une remise, le bénéficiaire pour
  une réception. Le super administrateur est l'informatique et le manager de ceux qu'il encadre ; ce
  qu'il peut forcer passe dans « À suivre », avec ses gestes, écrits « à sa place ». Relevé avant :
  super administrateur, barre 9, onglet 17, 8 tâches lui revenant ; après : 8 partout, Manager 3 = 3,
  Admin 8 = 8, Employé 1 = 1.
- **« À suivre » nomme qui a la main** : « chez Jane Manager », « chez l'informatique », « réception à
  confirmer » — depuis la dernière transition, pas depuis le dépôt.
- **La file dit ce qui presse** : groupes « En retard · 7 jours et plus », « Cette semaine »,
  « Aujourd'hui », l'urgence signalée en tête de chacun ; l'âge en ambre dès 3 jours, en rouge dès 7 ;
  la marque « Urgent » ; au bureau, la nature écrite sur la rangée. Deux filtres rapides, « Urgentes »
  et « En retard », avec leur compte. L'ordre a trois crans (ce qui presse, les plus anciennes, les
  plus récentes). Le téléphone prend les groupes et les couleurs ; la nature y reste à la vignette.
- **Liste de 400 dès 1 200** (360 en deçà), la tâche prend le reste — à toutes les largeurs du bureau.
- **Le panneau de décision** (`PanneauDeTache`) : la nature et l'urgence, l'objet et pour qui, le
  motif, **trois faits** (coût estimé et reste de la ligne « Matériel IT » pour qui lit la finance ;
  stock au site du bénéficiaire et ailleurs, ou l'unité proposée pour une dotation ; ce que la personne
  détient de pareil et depuis combien d'années), **l'unité à remettre** choisie sur place, **le
  parcours** (partagé avec 06.5, `lib/parcours.ts`), et un pied qui reste en bas : **un seul acte
  appuyé**, « Refuser » en second. Sous 520 de panneau, les trois faits deviennent une carte à trois
  lignes.
- **Refuser s'écrit dans le pied** : motifs courants en puces (selon l'étape), texte libre, motif
  obligatoire (le champ le dit), ⌘/Ctrl + Entrée pour refuser, Échap pour se reprendre.
- **La file s'enchaîne** : la tâche ouverte vit dans l'adresse (`?ouvert=`), la première s'ouvre à
  l'arrivée, et quand elle quitte la file (décidée, filtrée, changement d'onglet) celle qui prend sa
  place s'ouvre. Seul Échap laisse le panneau vide.
- **Valider et refuser se défont au lieu de s'attester** : la décision n'est écrite qu'au bout de
  cinq secondes ; sa tâche quitte la file et un bandeau propose « Annuler » (Z). Quitter la page ou la
  fenêtre écrit ce qui attendait. Le bandeau est **à part du snackbar**, dont la file d'attente aurait
  pu montrer « Annuler » après l'écriture.
- **La remise depuis le panneau** ouvre la feuille de remise avec la demande, la personne **et
  l'unité choisie** ; `ouvert=` suit : la file reste dessous et on y revient.
- **Le clavier** : J/K, A (l'acte), R (refuser), Entrée (la demande), X (cocher), Z (se reprendre),
  « ? » (l'aide), marqués dans le pied sous un pointeur fin. **Valider en lot** : une case au survol
  de la vignette ; « Valider les N » quand la sélection ne compte que des validations de même étape.

**Arbitrages contre les planches, à reporter :**

- **17.4** — au bureau, valider et refuser une demande **ne demandent plus le code personnel** : cinq
  secondes pour se reprendre à la place. Au téléphone rien ne change (06.5 et la feuille d'acte). La
  remise et la réception gardent leur attestation. **Validé par le commanditaire le 27/09** (« 4 —
  oui vas-y ») : l'écart n'est plus en attente, il est tranché ; 17.4 est à reporter.
- **17.5** — le bandeau « Annuler » dure 5 s et vit hors du snackbar (4 s, non négociable).
- **03.3** — la file de 400 remplace les douzièmes au bureau ; l'ordre par défaut devient « ce qui
  presse d'abord » ; la nature revient écrite sur la rangée du bureau (la passe du 02/09 l'avait
  confiée à la seule couleur).
- **03.1** — l'accueil lit la file entière : la remise y prend l'ambre, la réparation l'orange.
- **06.5** — le parcours ne marque « en attente » que l'étape courante, et nomme le manager.

Relevé en passant : les remises et retours d'objets revenaient à « tout rôle sauf l'utilisateur » —
un manager y trouvait des remises qu'il ne pouvait pas faire, et jamais la réception de son propre
objet ; ils reviennent à qui gère l'inventaire, dans son périmètre (`filterEquipment`).

Mesuré au banc riche : 30 vérifications sur 30 (quatre comptes, bureau, tablette, téléphone) — dont
badge = onglet = accueil, J/K, A puis Z, écriture à 5 s, refus sans motif puis avec, onglet suivi,
Échap, lot, remise sur la file ; la ligne d'outils tient à 1 440 (champ de 280, « Ce qui presse »).

#### Tâches au bureau : alignée sur la maquette de la proposition (26/09, seconde passe)

Relevé de l'utilisateur : *« la page n'est pas 100 % fidèle à la page proposée »*. Comparée
propriété par propriété à la maquette (`.mq` de la proposition), puis reprise :

- **En-tête** : les trois partitions en **onglets segmentés à côté du titre** (`Onglets`, nouvelle
  primitive), sans ligne de compte. `ListTemplate` reçoit `titreAnnexe` et `outilsBureau`.
- **Ligne d'outils** : champ de 300 × 36, puces de 32 « Toutes · Urgentes · En retard » avec leur
  compte, « Ce qui presse d'abord » à droite ; le menu Nature quitte le bureau (la nature est écrite
  sur la rangée et se cherche par son nom).
- **Rangée** : vignette de 36 (12 en 600), titre 14/20 en 500 et la nature en puce, sous-ligne d'une
  ligne « personne · motif » ou « personne, par … », âge « 0 j », « Urgent » en 11/16 600 ; au
  bureau la remise garde le bleu de la vignette ; la rangée ouverte prend le creux et un filet court.
  « À suivre » : « ⏸ chez Jane Manager depuis 15 j », et « Relancer » en ambre à la place de l'âge.
- **Groupes et couleurs tels que dessinés** : « En retard · plus de 7 jours » (au-delà de 7), la
  semaine en ambre, le jour même en gris. La maquette et la question de la proposition divergeaient
  (« ambre dès 3 jours ») : le dessin l'emporte. Les âges comptent depuis **le dépôt** de la demande,
  comme la maquette.
- **Panneau** : titre Archivo 600 20/28 tout à l'encre ; « demandée hier par … · validée par … »
  (l'auteur de la validation lu dans le journal, jamais supposé) ; faits à 15/20 en 600 ;
  unités « LPT-HQ-07 · Bureau Paris · reçue le 12/09 » ; **frise du parcours** à points
  (`etapesDeLaFrise`, auteurs et heures du journal) ; pied à gestes de 40 sans icône, « J K tâche
  suivante · ↵ détail » (l'indication « détail » est cliquable ; au doigt, la porte reste écrite).
- **Bandeau** : surface inversée, message en 14, « Annuler » en jaune 600 ; plus d'icône ni de jauge.

Écarts qui restent, et pourquoi : le ⏸ est en graisse *regular* (I2 réserve *fill* à l'onglet
actif) ; les rayons de 6 de la maquette prennent 4 (le registre ne connaît que 2, 4 et 8) ; l'ordre
dans un groupe suit la règle « urgence, puis la plus ancienne » là où la maquette rangeait « Cette
semaine » dans l'ordre des données. Mesuré : 30 vérifications de gestes sur 30, largeurs 30 relevés
sans défaut, DS et sonde `cn()` propres.

### La sélection groupée au bureau (26/09)

Demandé : *« corrige la mise en forme lorsqu'on fait une sélection dans une liste »*. 17.2 est
dessinée au téléphone, et le bureau la prenait telle quelle : une barre sombre remplaçait tout
l'en-tête (titre compris, la liste remontait de 64), un pied **pleine fenêtre** passait sous la
barre latérale et étirait « Exporter » sur 1 348 px ; dans Tâches, le panneau se retirait et la
liste sautait de 400 à 1 008 px en changeant d'alignement.

- **Dès 600 (rail et bureau), le titre reste** ; la ligne d'outils cède la place à
  `SelectionBarBureau` — dans les marges de la page, à la hauteur de la ligne (40, 48 au doigt) :
  la croix, « 2 sur 14 », « Tout » / « Aucun », puis les gestes **à leur largeur** (32, 40 au
  doigt) et le ⋮, qui s'ouvre alors vers le bas (`BulkOverflow` lit `DansLaBarreDeSelection`).
- **Plus de pied au bureau** : `BulkActionBar` ne vit plus qu'au téléphone.
- **Le panneau d'une liste reste** et résume : « 2 dans la sélection — les gestes de la barre
  s'appliquent à chacun. Échap pour en sortir. » La liste ne bouge plus.
- Le Catalogue, qui compose son en-tête lui-même, prend la même barre (600–839 : au-delà, il est
  en cartes et ne sélectionne pas).
- Le téléphone ne change pas : barre sombre en haut, pied en bas (17.2).

**Arbitrage contre 17.2, à reporter** : au bureau, la sélection ne remplace plus l'en-tête et le
panneau ne se retire plus. Mesuré : Actifs (tableau), Tâches, Équipe au bureau, Actifs et
Catalogue à 768 au doigt, téléphone — 14 vérifications sur 14 (la première rangée ne bouge pas,
« Exporter » à 77 px, ⋮ sous la barre, Échap sort) ; gestes de Tâches 30/30, clavier 14/14,
mouvement 17/17.

### Une carte montre une part, sa page montre tout (09/10)

Demandé : *« évite de rendre des cartes scrollable, j'avais déjà souligné ce problème ; affiche
une partie et rends la totalité accessible depuis une page dédiée »*. Le 08/10 la carte « Locaux »
d'un site avait pris cette forme ; la règle vaut désormais pour toutes. **Elle revient sur
« Listes bornées » (25/09)** et sur le « pas de Voir plus » du 23/09 : `ListeBornee` est retirée.
La hauteur fixe des cartes du bureau (22/09) reste ; ce qui change, c'est que la suite ne se lit
plus en défilant dedans.

Relevé mesuré avant (quatre fenêtres, vingt pages) : dix cartes défilaient dans leur hauteur. La
pire était de la veille — le panneau de l'inventaire, 101 px pour six locaux à 1366 × 657.

Deux pièces communes :

- `components/ui/ToutVoir` — `ToutVoir` (« Tous les modèles 8 › ») et `PiedDeCarte`, le pied qui le
  porte sous un filet. **Le pied ne paraît que si la carte ne montre pas tout.**
- `hooks/useCeQuiTient` — pour une carte dont la hauteur vient de la fenêtre : il montre **les
  pièces qui tiennent entières** (les autres restent en place, `visibility: hidden`, pour être
  mesurées quand la carte grandit) et réserve la hauteur du pied. Zone : `relative min-h-0 flex-1
  overflow-clip`. Sur une page qui défile, un plafond fixe suffit.

| Carte | Elle montre | Le reste |
| --- | --- | --- |
| Fiche d'un type › Modèles | 6 tuiles, 5 rangées au téléphone | `/management/categories/<type>/modeles` (`TypeModelesPage`) |
| Accès › rôle › Qui le porte | 5 personnes | `/rbac/roles/<id>/personnes` |
| Accès › groupe › Ses membres | 5 personnes | `/rbac/groups/<id>/membres` |
| Paramètres › Amortissement › types | 6 types | l'écran « Plans par type » |
| Inventaire › panneau (sites, locaux) | ce qui tient | `/audit/lieux/<pays>[/<site>]` (`AuditLieux`) |
| Campagne › Écarts | ce qui tient, à trancher d'abord | l'écran « Écarts », ouvert au bureau |
| Campagne › Fiches corrigées | ce qui tient | la liste « Fiches corrigées » |
| Campagne › Activité | ce qui tient, six au plus | l'écran « Activité » |
| Accueil › Types en tension | ce qui tient, cinq au plus | `/management/tension` (`TypesEnTensionPage`) |
| Accueil › Derniers événements | ce qui tient | l'historique (déjà) |
| Finances › Les postes | ce qui tient, six au plus | les lignes du budget (déjà) |

Trouvé en chemin :

- **Le panneau de l'inventaire demande sa hauteur** (`zonesClassName` de `ListTemplate`,
  `expanded:min-h-[28rem]`) : sur une fenêtre basse la bande de tête ne lui laissait pas une
  rangée. En deçà c'est la page qui défile (117 px à 1366 × 657) et le panneau garde son résumé,
  trois rangées et son renvoi — la règle de la colonne d'une campagne (28/09). Le retour aux sites
  du pays est rentré dans l'en-tête de la carte : sur sa ligne, il prenait la place d'un local.
- **« Types en tension »** était plafonnée à cinq en silence, et sa note comptait les types coupés
  parmi ceux qui « ont au moins une unité » (`lib/tensionDesTypes`).
- L'écran « Écarts » n'existait qu'au téléphone : la chaîne de rendu du bureau passait avant lui.

**Ce qui défile encore, et pourquoi** : la liste d'une page (Actifs, Tâches, Équipe, la file d'une
campagne, le journal des dépenses), un tableau, le panneau d'un objet ouvert, une feuille. Ce ne
sont pas des cartes qui montrent une part d'autre chose : ce sont la page, ou ce qu'on a ouvert.

Mesuré au banc (émulateur 8086), à 1366 × 657, 1440 × 900, 1024 × 768 et 393 × 852 :
132 vérifications sur 132 — pièces entières, pied présent quand la carte tronque, page d'arrivée
complète, retour au point de départ ; l'écran « Écarts » au bureau sur quatre écarts créés pour
l'essai. Suite `cartes` ajoutée à `qa:e2e` (17 vérifications sur le jeu de démonstration, à
1366 × 657 ; mutée : un plafond porté à 99 la fait échouer).

**À reporter sur les planches** : 09.1 (Modèles), 14.1 (amortissement), 16.1 et 16.2 (panneau,
colonne de campagne), 03.1 (accueil), 17.x pour le pied commun.
