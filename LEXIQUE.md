# LEXIQUE — un mot par acte

Écrit le **2026-07-31**. Sert de référence unique pour les **planches** et pour le **code**.
Compagnon de la planche `screens/lexique-piste.html` (groupe « 13 »).

**Règle.** Un acte = un mot, partout : bouton, titre de feuille, ligne du tableau de bord,
libellé d'historique, nom de statut. Deux mots pour un acte, c'est deux actes pour le lecteur.

**Trois statuts, et ils sont contraignants :**

| Statut | Ce que ça veut dire |
| --- | --- |
| **existant** | Le mot est déjà celui du produit. Rien à faire côté code. |
| **renommage à valider** | Le mot proposé n'est pas celui du code. **À trancher avec l'équipe** avant implémentation. Aucun renommage n'est glissé en silence (§7, erreur n°4). |
| **dette signalée** | Écart de nommage relevé, **non corrigé** : ce n'est pas un arbitrage de maquette. |

---

## 1 · Les actes de la chaîne d'attribution

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Attribuer** — l'IT engage un objet vers une personne | *Assigner* (code) | existant |
| **Remettre l'équipement** — l'IT atteste la remise physique | *Remettre*, *Donner* | existant |
| **Confirmer la réception** — le porteur atteste avoir reçu | *accuse réception*, *accuser réception* (planche 06.1), *Confirmer* seul (dashboard) | **existant** — l'écran « Réceptions à confirmer » porte déjà le mot |
| **Valider la demande** — l'acte du manager | *Valider* seul (dashboard), *Approuver* (écran Approbations) | existant |
| **Validation du manager** — l'état de la demande | *Validation managériale*, *Validation manager* | existant |
| **Demander la restitution** — l'IT réclame **un** objet | *Récupérer* (matrice, planche 06.1) | existant |
| **Organiser la restitution** — l'IT réclame **tous** les objets d'une personne | — | existant · variante **plurielle**, à définir comme telle |
| **Restituer** — l'acte du porteur qui rend | *Retour matériel*, *Retourner*, *Rendre* | **renommage à valider** |
| **Réceptionner** — l'IT clôt le retour et constate l'état | *Réceptionner et constater l'état* (matrice) | existant · **deux provenances, un seul acte** : le retour d'une restitution et le retour d'une réparation (04.4) ouvrent la **même vue**, seul l'en-tête change |
| **Réaffecter** — passer un objet d'une personne à une autre | *Transférer* | existant · **n'évite aucune attestation** |

## 2 · Les statuts d'un objet

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Disponible** | *En stock* | existant |
| **En attente** — remis, pas encore reçu | *En transit*, *À confirmer* | existant |
| **Attribué** | *Assigné* | existant |
| **Retour à confirmer** — rendu, pas encore réceptionné | *En retour* | existant |
| **En réparation** | *Maintenance* | existant |
| **Sortir du parc** — l'acte de sortie définitive | *Supprimer* (code) | **renommage à valider** |

## 3 · Les preuves

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **code PIN** — le code de remise, 4 chiffres | *code à 4 chiffres*, *Code de remise à 4 chiffres*, *code* seul | existant · **jamais lisible**, y compris du gestionnaire |
| **signature** | *signature manuscrite*, *émargement* | existant |
| **empreinte** | *biométrie* | existant |
| **attestation** — la trace signée d'un passage de main | *preuve*, *validation* | existant · **survit à la suppression du compte** |
| **Réinitialiser le code PIN** | *Réinitialiser le code* | existant |
| **Réinitialiser le mot de passe** | — | existant · **comptes locaux uniquement** |
| **Définir son code PIN** — l'acte du **porteur** | *Choisissez un code à 4 chiffres* (06.2, 02.2), *Définir un nouveau code* | existant · **pendant** de « Réinitialiser le code PIN », qui est l'acte de l'IT |
| **Code PIN à définir** — l'état d'un compte qui n'en a pas | *Compte sans code* | existant · **c'est une tâche** (03.3), pas un défaut silencieux |

## 4 · Les incidents et les demandes

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Déclarer un incident** | *Signaler*, *Signaler une panne*, *Signaler un problème* (fiche équipement, matrice) | existant |
| **Signaler un écart** — à la réception, quand l'objet ne correspond pas | — | existant · **à ne pas confondre** avec « Déclarer un incident » |
| **Demander un équipement** | *Nouvelle demande*, *Faire une demande* | **renommage à valider** |
| **Prendre en charge** — l'IT engage la réparation : qui répare, quand, qui paie | *Traiter*, *Ouvrir un ticket* | existant · l'acte qui suit « Déclarer un incident » (04.4) |
| **Attribuer un remplacement** — donner un objet le temps d'une réparation | *Prêter*, *Prêt* | existant · **c'est une attribution**, liée à l'incident. « Prêt » est écarté : ce serait un second mot pour *attribuer* |
| **Refermer l'incident** | *Clôturer*, *Résoudre* | existant · se fait **à la réception du retour**, pas avant |

## 5 · Les comptes

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Suspendre le compte** / **Réactiver le compte** | *Désactiver*, *Bloquer* | existant · **réversible, donc jamais en rouge** |
| **Supprimer le compte** | — | existant · **irréversible, seul acte rouge** |
| **Inviter par e-mail** | *Créer un utilisateur* | existant |
| **Importer depuis l'annuaire** | *Synchroniser* | existant |
| **Compte en attente** — invité, pas encore connecté | *Non activé*, *Pending* | existant |

## 6 · Les fiches — ajouté le 04/08

Un acte transverse aux deux domaines : on modifie la fiche d'un **objet** comme celle d'une
**personne**, et c'est le même geste, au même endroit — le menu de débordement de la fiche.

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Modifier la fiche** | *Modifier le profil* (05.2, corrigé le 04/08), *Éditer* (crayon sans libellé de l'écran actuel) | existant · même mot sur la **fiche équipement** (04.2) et la **fiche utilisateur** (05.2 · 05.4) |
| **Ajouter une note** / **Modifier la note** | *Notes manager* | existant · deux formes du **même** acte, selon qu'une note existe déjà |

> **Pourquoi « fiche » et pas « profil ».** « Profil » est un mot **occupé** : « Mon profil » est
> une destination nommée du menu de l'avatar. Lire « Modifier le profil » sur la fiche d'Alice
> laisse croire qu'on ouvre *son* « Mon profil ». Et le cadrage de 05.2 défend déjà le mot :
> *une fiche utilisateur n'est pas un profil, c'est le pendant de la fiche équipement, dans
> l'autre sens.* Son menu contredisait son propre texte.

> **Ce que ce mot n'est pas.** « Modifier la fiche » ne modifie **jamais le porteur** d'un objet
> ni ce qu'une personne détient : un objet change de mains par une attribution ou une
> restitution, jamais par une correction de fiche (04.3). Et **une fiche n'est pas modifiée par
> son sujet** : l'identité qui y figure est celle qui signe les attestations.

---

## Corrections appliquées le 31/07 dans les planches livrées

| Où | Avant | Après |
| --- | --- | --- |
| `attribution-1-parcours-piste` — titre de colonne, maillon de la chaîne, carte | accuse réception | **confirme la réception** |
| `attribution-1-parcours-piste` — matrice, ligne « Attribué » | Récupérer | **Demander la restitution** |
| `attribution-1-parcours-piste` — matrice, ligne « Retour à confirmer » | Réceptionner et constater l'état | **Réceptionner** |
| `attribution-1-parcours-piste` — matrice, colonne porteur | signaler une panne | **déclarer un incident** |
| `attribution-1-parcours-piste` — historique, carte preuve | code à 4 chiffres | **code PIN** |
| `utilisateur-3-creation-piste` — colonnes 4 et 5 | code à 4 chiffres | **code PIN** |
| `equipement-2-detail-piste` — bouton utilisateur final | Signaler | **Déclarer un incident** |
| `dashboard-1-tableau-piste` — bouton utilisateur | Nouvelle demande | **Demander un équipement** |
| `dashboard-1-tableau-piste` — rangées à traiter | Valider · Confirmer | **Valider la demande** · **Confirmer la réception** |
| `dashboard-1-tableau-piste` — libellé d'état | Validation manager | **Validation du manager** |
| `utilisateur-2-detail-piste` — menu d'Alice | Réinitialiser le mot de passe | **Réinitialiser le code PIN** *(compte annuaire)* |
| `attribution-5-arbitrer-piste` — héro et pied de la fiche | Approuver · Approuver la demande | **Valider** · **Valider la demande** — aligné le 12/08 ; les « Approuver » de la carte de relevé restent, c'est le libellé du produit |

## Correction appliquée le 04/08

| Où | Avant | Après |
| --- | --- | --- |
| `utilisateur-2-detail-piste` — menus des colonnes 1 et 2 | Modifier le profil | **Modifier la fiche** |

**Comment l'écart avait échappé.** Les deux planches disaient chacune un mot cohérent *chez elle* :
05.2 écrivait « Modifier le profil » dans son menu, 05.4 — qui dessine les feuilles de ce même
menu — écrivait « Modifier la fiche ». Aucun contrôle de planche ne pouvait le voir : il faut
comparer **la même entrée du même menu d'une planche à l'autre**. C'est la règle des vues de
référence appliquée aux mots — *deux points d'entrée vers le même acte n'en changent ni les
champs, ni le libellé.*

## Ajouts du 02/08 — nés du dessin des planches 02.2 et 04.4

Cinq actes et un état sont entrés au lexique parce que **les écrans qui les portent ont été
dessinés**, pas parce qu'un balayage les a trouvés. Aucun n'est un renommage : ils nommaient
jusqu'ici des gestes que le produit faisait sans mot, ou ne faisait pas du tout.

**Et un mot a été écarté : « prêt ».** Le remplacement d'un objet en réparation est une
**attribution** — l'objet est au nom de la personne, elle en répond, elle le confirme avec son
code PIN. La seule chose que « prêt » aurait ajoutée, la durée, est déjà portée par le **lien à
l'incident**. Un synonyme qui ne dit rien de neuf est un doublon en puissance.

## Dettes de nommage — signalées, pas corrigées

1. ~~**L'écran « Approbations »**~~ — **tranchée le 06/08**, voir ci-dessous. Elle l'a été
   **dans le mauvais ordre**, et c'est écrit là où ça se voit.
2. ~~**Les catégories du catalogue**~~ — **soldée le 05/08**, voir ci-dessous.
3. **« Actifs » (barre du bas) vs « équipements » (partout ailleurs)**. Le mot de la
   navigation ne change pas — il est court et il est en place —, mais l'écart existe.

### Dette n°2 — soldée le 05/08

Les catégories étaient en anglais dans la donnée et en français dans les planches. L'arbitrage
partiel du 26/07 (*on suit la donnée quand on la cite, le français quand on nomme un type*) n'a
jamais été appliqué côté produit, parce qu'il laissait la traduction dans chaque écran.

**Tranché : clé anglaise dans la donnée, libellé français porté par un champ. Aucun écran ne
traduit.** Les catégories se rangent en deux niveaux, *famille → type*.

| Famille | Type | Clé de la donnée |
| --- | --- | --- |
| Informatique | Ordinateur portable | `Laptop` |
| Informatique | Serveur | *à relever* |
| Périphériques | Moniteur | `Monitor` |
| Périphériques | Clavier | *à relever* |
| Périphériques | Souris | `Mouse` |
| Périphériques | Casque | `Headphones` |
| Impression et réseau | Imprimante | *à relever* |
| Mobilier et divers | Mobilier | *à relever* |

Les quatre *à relever* n'apparaissent pas dans le jeu de démonstration : ils sont laissés vides
plutôt que devinés. Détail et conséquences de maquette : `REGLES-TRANSVERSES.md` §5.7.

## Les trois renommages à trancher — état au 06/08

Ils sont les seuls qui **demandent une décision** avant implémentation :

| Proposé | Aujourd'hui dans le code | Pourquoi | État |
| --- | --- | --- | --- |
| **Restituer** | Retour matériel / Retourner | « Retour matériel » nomme un objet, pas un acte. Le porteur *restitue* ; l'IT *réceptionne*. Deux actes, deux mots. | **en attente** |
| **Sortir du parc** | Supprimer | « Supprimer » un actif suggère qu'il disparaît. Il ne disparaît pas : il sort de l'inventaire et **garde son historique**. | **en attente** |
| **Demander un équipement** | ~~Nouvelle demande~~ | « Nouvelle demande » ne dit pas de quoi. Le bouton doit nommer ce qu'on obtient. | ⚠ **appliqué au code le 06/08 sans validation** |

> **L'anomalie, écrite ici parce qu'elle est de méthode.** Ce tableau existe pour qu'aucun
> renommage ne soit glissé en silence — c'est la règle du statut *renommage à valider*, et
> l'erreur n°4 de la passation. Le 06/08, en portant la planche 06.4 dans le produit, j'ai
> **appliqué** « Demander un équipement » au titre de l'écran sans repasser ici. Le mot est
> celui que ce document proposait, il est employé par les trois boutons qui y mènent, et il
> n'a donc rien changé au vocabulaire du produit — mais **la décision n'a pas été prise, elle
> a été supposée**. Elle reste donc à confirmer, et le geste, lui, est déjà fait.

## Ajouts du 06/08 — nés du portage de 03.3 dans le produit

Porter la file de tâches a demandé de nommer deux objets que le produit confondait sous un
seul écran.

| Terme retenu | Ce que c'est | Statut |
| --- | --- | --- |
| **Tâches** | la **file** : ce qui attend un geste de la personne qui regarde, toutes natures confondues (planche 03.3). C'est la destination des liens du tableau de bord, et l'onglet de la barre du bas | **existant** — la barre du bas portait déjà le mot |
| **Demandes** | la **liste des demandes** et leur historique : l'archive de la file, pas sa concurrente | ⚠ **renommage appliqué au code le 06/08** — voir ci-dessous |

> **La dette n°1, et comment elle a été tranchée.** L'écran s'appelait **« Approbations »**,
> un mot que 06.1 remplace par *validation*. Le 06/08, la file est devenue une vue et a pris
> l'onglet ; l'écran d'origine avait besoin d'un nom qui dise ce qu'il **est** une fois la file
> partie — une liste de demandes. Retenu : **Demandes**.
>
> **Deux réserves, et elles sont à vous.** D'abord, le mot que ce lexique suggérait était
> *validation* : il nomme l'**acte** du manager, pas le contenu de l'écran, et un écran qui
> liste des demandes en cours **et** leur historique n'est pas un écran de validation. Ensuite,
> ce renommage a été **appliqué avant d'être inscrit** — exactement ce que la règle interdit.
> Il se défait en une ligne si *Demandes* ne vous va pas.

## Ajout du 13/08 — les six mots de l'audit

Le lexique ne portait **aucun mot d'audit** : les planches 16.1 et 16.2 en avaient besoin, et le
code en emploie déjà cinq. Relevé dans `AuditDetailsPage.tsx`, `AuditOverviewMobile.tsx` et
`serviceAudit.ts`.

| Terme retenu | Variantes relevées | Statut |
| --- | --- | --- |
| **Campagne** — un service, une session de vérification | *session d'audit*, *audit de service* | existant |
| **Périmètre** — pays · site · service, ce que la vue regarde | *scope* (code) | existant |
| **Attendu** — l'actif que le référentiel place dans le service | *à scanner*, *ciblé* | existant |
| **Retrouvé** — attendu, et scanné | **scanné** (vue globale) | **renommage à valider** — le même fait porte deux mots selon l'onglet |
| **Manquant** — attendu, et introuvable au terme de la campagne | — | existant |
| **Écart** — scanné, et non attendu ici | *exception* (code), *hors service*, *nouveau* | existant · **homonyme, voir ci-dessous** |

**« Écart » porte deux actes.** Il nomme déjà, en §*Attribuer et restituer*, le
**« Signaler un écart »** de la réception — l'objet livré ne correspond pas à l'objet attendu. En
audit, il nomme un objet trouvé là où il n'était pas attendu. Les deux entrées doivent coexister
dans ce lexique : sans cela, la prochaine planche en choisira une au hasard.

**Une dette de donnée, pas de nommage.** Les actifs portent un **département** (« IT HQ »), le
référentiel de lieux porte un **service** (« IT », « Finance »). Ce ne sont pas deux mots pour la
même chose : ce sont deux référentiels qui ne se recoupent pas, et quatre services sur sept
n'attendent donc aucun actif. **Dette signalée**, à réconcilier côté données.
