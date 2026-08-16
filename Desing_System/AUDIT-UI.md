# AUDIT-UI — cohérence, densité, vues de référence

Écrit le **2026-07-31**, en réponse aux points 4 et 5 des retours.
Compagnon de `LEXIQUE.md` (les mots) : ce document-ci traite des **composants**, de la
**structure de page** et des **flux**.

> **Les valeurs ne se décident plus ici.** Elles vivent dans **`REGLES-TRANSVERSES.md`**,
> écrit le 31/07 : registre normatif, une valeur par rôle, un journal de décisions, et la
> procédure pour faire évoluer un standard globalement plutôt que dans une planche. Ce
> document-ci reste le récit — ce qui a été trouvé, ce qui a été corrigé, pourquoi.

> **Le 01/08, cet audit a été refait à l'envers.** Au lieu de partir des points signalés, le
> projet entier a été indexé — chaque déclaration de style des dix-huit planches, regroupée par
> rôle — puis toute règle portant deux valeurs a été instruite : **101 divergences** brutes,
> 28 écarts retenus, dont **trois corrections annoncées le 31/07 et appliquées à moitié**.
> Le compte rendu est dans **`RAPPORT-AUDIT-2026-08-01.md`** ; les valeurs sont au registre
> §2 bis. Ce qui est écrit ci-dessous reste vrai, à une réserve près : les numéros de planche
> (« planche 05.4, 14, 17 »…) datent d'avant la renumérotation du volet — table de
> correspondance en `REGLES-TRANSVERSES.md` **§5.1**.

---

## Ce qui a cessé d'être vrai depuis — relevé du 04/08

**Ce document est un récit, et un récit ne se réécrit pas** : le corps ci-dessous est laissé
intact, y compris là où il s'est trompé ou a été dépassé. Mais il porte des phrases **tournées
vers l'avenir** — « à reprendre », « non dessinée », « priorité n°1 » — et celles-là ne vieillissent
pas comme le reste : elles **mentent activement** à qui les lit aujourd'hui. Elles sont donc
listées ici, à la date où elles ont cessé d'être vraies.

| Où | Ce que le texte annonce | État réel |
| --- | --- | --- |
| §3, *ce qui reste* | « **À reprendre** : fiche utilisateur (05.2) et fiche équipement (04.2) — une passe de fusion de cartes » | **fait le 01/08** — `RAPPORT-AUDIT` §3.2 point 6 : *la règle est désormais tenue*, une carte d'une ligne fusionnée |
| §3 b | « Échelle retenue, **quatre marches** et pas une de plus » | **dépassé le 01/08** — l'échelle en compte **cinq**, plus un rang à part pour les contrôles. Registre §2.6 |
| §5, tableau des flux | « Créer un compte → **première connexion non dessinée** » | **dessinée le 02/08**, planche 02.2 |
| §5, conclusion | « Le point de passage obligé reste la page **Tâches, qui n'est pas dessinée**. **Priorité n°1.** » | **livrée le 31/07**, planche 03.3 |
| §6, point 4 | « **Première connexion** — à dessiner » | **livrée le 02/08** |
| §6, point 5 | « **Passe de densité** sur les planches 04.2 et 8, une fois les règles du §3 validées » | **faite le 04/08** — `--gap` ramené à 20, crans de densité alignés, `.quiet` déposée. Registre §2.16 |
| En-tête | renvoi à `REGLES-TRANSVERSES.md` **§5.7** | **§5.7 n'existe pas** — la table de correspondance est en **§5.1**. Corrigé ci-dessus |

> **Pourquoi ce relevé existe.** Le 03/08, un arbitrage a été rendu **sur un constat faux** — on
> croyait une barre de navigation absente, elle était là. Le mécanisme est le même ici : un document
> normatif qui annonce un chantier déjà clos fait travailler deux fois, ou fait décider à côté.
> **Un document qui ne peut pas être réécrit doit au moins dire où il a cessé d'être vrai.**

---

## 1 · La règle des vues de référence

> **Un acte = une vue = un fichier.** Deux points d'entrée vers le même acte ouvrent
> **la même vue**, au même endroit, avec les mêmes champs. Ce qui peut différer : l'en-tête
> (« ouvert depuis le tableau de bord ») et le pré-remplissage. **Rien d'autre.**

Corollaire, déjà tranché en planche 03.2 : **le raccourci porte sur la navigation, jamais sur
le contenu**. Une vue allégée « parce qu'on vient d'ailleurs » est une deuxième vue déguisée,
et elle divergera au premier changement.

### Inventaire des actes et de leur vue unique

| Acte | Vue de référence | Points d'entrée |
| --- | --- | --- |
| Remettre l'équipement | feuille, planche 06.1 | fiche objet · ligne du dashboard · bouton du dashboard · Tâches |
| Confirmer la réception | feuille, planche 06.1 / 14 | fiche objet · bouton du dashboard · notification · Tâches |
| Signaler un écart | feuille, **planche 06.3** | feuille de réception (bouton secondaire) · fiche objet |
| Restituer | feuille, planche 06.1 | fiche objet · dashboard utilisateur |
| Réceptionner | feuille, planche 06.1 | fiche objet · bouton du dashboard · Tâches |
| Valider la demande | feuille, planche 06.1 | Approbations · bouton du dashboard · Tâches · notification |
| Déclarer un incident | feuille, planche **04.3** | fiche objet · « Mes équipements » |
| Suspendre le compte | feuille, planche 05.4 | menu de la fiche utilisateur |
| Supprimer le compte | feuille, planche 05.4 | menu de la fiche utilisateur |
| Réinitialiser le code PIN | feuille, planche 05.4 | menu de la fiche utilisateur |
| **Réinitialiser le mot de passe** *(d'un autre)* | feuille, planche 05.4 | menu de la fiche utilisateur |
| **Changer mon mot de passe** *(le mien)* | feuille, **planche 07.1** | avatar → Mon compte · Paramètres → Sécurité *(renvoi)* |
| Double authentification | écran, **planche 07.1** | Mon compte |
| Fermer une session | liste, **planche 07.1** | Mon compte |
| Définir un nouveau code PIN | écran, **planche 06.2** | première connexion après réinitialisation · Mon profil |

### Le cas signalé — trois portes, une seule pièce

L'exemple donné est exact et il est le plus visible du produit :

1. **menu de la fiche utilisateur** → « Réinitialiser le mot de passe » — *l'administrateur
   agit sur quelqu'un d'autre* ;
2. **avatar → Mon compte** (« Mot de passe, 2FA, session ») — *la personne agit sur elle-même* ;
3. **Paramètres** → section sécurité — *le même acte, une troisième fois*.

**Arbitrage retenu.** Ce ne sont pas trois vues, ce sont **deux actes distincts** et un doublon :

- **Agir sur le compte d'un autre** = envoyer un lien. Vue de référence : la feuille de la
  **planche 05.4**. Elle ne demande jamais l'ancien mot de passe — l'administrateur ne le connaît
  pas et ne doit pas le connaître.
- **Changer son propre mot de passe** = ancien mot de passe + nouveau. Vue de référence :
  **« Mon compte »**, atteinte depuis l'avatar. **Une seule vue**, à dessiner.
- **Paramètres → sécurité** est le **doublon** : il ne doit pas porter de formulaire, seulement
  une ligne qui **renvoie à « Mon compte »**. Une section qui refait un formulaire existant est
  la façon la plus sûre de faire diverger deux écrans.

**Dessiné le 31/07 — planche 07.1**, `screens/mon-compte-piste.html` : l'écran « Mon compte », la
feuille de changement de mot de passe, l'activation de la double authentification, la liste des
sessions, et la section Paramètres réduite à **une ligne de renvoi**. La capture
`screens/actuel/parametres.png` reste la référence de l'existant.

> **Complément du 04/08 — où se prend un acte.** L'asymétrie qui reste entre ces écrans a été
> nommée : sur la fiche **d'un autre**, les actes vivent dans un **menu ⋮** ; sur **mes propres
> réglages**, dans une rangée `.arow` qui **montre l'état et ouvre l'acte**. Ni « Mon profil » ni
> « Mon compte » ne portent de menu ⋮, et c'est le même choix pris deux fois. Registre §2.35.

### Ce que cette planche avait elle-même fait divergier — corrigé le 31/07

Le reproche est juste, et il vise l'endroit exact : **la planche 07.1 a été dessinée à côté d'un
existant au lieu d'être fondue avec lui.** Trois écarts, trois corrections :

1. **Le code PIN à six caractères.** Le champ de la double authentification avait emprunté le
   composant `.pin` **en passant à six cases** et en redéfinissant ses métriques (case à
   `flex:1`, chiffre 26 px au lieu de 34). Le produit s'est donc retrouvé avec deux codes PIN.
   → **`.pin` est restauré à sa métrique canonique — quatre cases**, et il ne sert désormais
   *qu'*au code PIN. Le code de l'application d'authentification, qui fait bien six chiffres,
   se saisit dans un **champ ordinaire** : ce n'est pas un code PIN, il n'emprunte pas son
   composant. Règle inscrite en `REGLES-TRANSVERSES.md` §2.1.

2. **La carte « Mon compte » existait déjà** — dans la fiche « Mon profil », planche 05.2,
   colonne 3 : deux rangées de référence (Connexion, Code PIN) et un bouton « Définir un code
   PIN ». C'était bien la même fonctionnalité, dessinée deux fois.
   → La carte est **démontée** : elle porte une **rangée de renvoi** vers la planche 07.1, au
   composant `.arow` de cette planche et à ses métriques.  Aucun champ, aucun bouton d'acte.

3. **Deux titres voisins pour deux actes distincts.** « Gérer un compte utilisateur »
   (planche 05.4) et « Mon compte » (planche 07.1) se lisaient comme un doublon.
   → 05.4 devient **« Administrer le compte d'une personne »**, et son introduction nomme la
   frontière : *cette planche agit sur le compte d'un autre ; agir sur le sien est la planche 17.*

---

## 2 · Audit complet des composants — 31/07

Inventaire mené **sur les treize planches**, en comptant chaque occurrence de chaque composant.
Le principe de lecture : *deux noms pour un même rôle, ou deux valeurs pour un même nom, sont
une divergence* — même quand le résultat se ressemble à l'œil.

### 2.1 · Barre du haut — cinq gabarits pour trois rôles → **corrigé**

| Gabarit | Où | Verdict |
| --- | --- | --- |
| `.tbar` — retour · identité (16/600 + 11 px) · action | 6 planches | **gabarit unique retenu** |
| `.abar` — retour · titre 19 px · « Enregistrer » | création équipement, création compte | **aligné** sur `.tbar` : titre 19 → 16 px, ligne secondaire ajoutée |
| `.bhead` — titre 19 px seul | attribution (8×), les deux créations | **conservé pour une racine d'onglet uniquement** ; ramené à 16 px |
| `.bhead` sur un écran d'objet | attribution, 4× sur `LPT-HQ-15` | **corrigé** — porte l'identité complète (code + modèle · site) |
| `.topbar` / `.topb` — l'accueil | dashboard / planche 03.2 | **aligné** : titre 22 → 23 px, avatar 40 → 44 px |

Un écran d'acte plein cadre porte désormais **toujours un retour** : « Attester » en était dépourvu.

### 2.2 · Titre de section — deux tailles pour un même rôle → **corrigé**

`.ct` valait **13 px**, `.ch h3` valait **15 px**, et les deux servent d'en-tête de carte. Résultat
visible : les cartes de la **fiche équipement**, de la **fiche utilisateur** et du **dashboard**
avaient un titre plus gros que celles des planches 05.3 à 15 — sans qu'aucune règle ne le demande.
→ **13 px / 500 partout**, conforme à l'échelle en quatre marches du §3. Les titres de héro
(17 px et plus) ne sont pas concernés : ils sont d'un autre rang.

### 2.3 · Bouton secondaire — cinq remplissages → **corrigé**

| Classe | Valeur trouvée | Où |
| --- | --- | --- |
| `.btn-d` | `--dark` | attribution, les deux créations, les deux listes |
| `.btn-d` | `--dark-2` | fiche équipement, fiche utilisateur |
| `.btn-k` | `--ink` | dashboard |
| `.btn-o` | `--inset` | attribution, création compte, planche 06.2 |
| `.btn-o` | `rgba(255,255,255,.12)` | planches 03.2 et 15 |
| `.btn-o` | transparent + bordure | fiche utilisateur |

**Règle retenue — un remplissage par surface, pas par écran :**

- **sur carte claire** → `--inset`, encre ;
- **sur héro inversé** → `rgba(255,255,255,.12)`, blanc ;
- **second geste d'une paire sur le canevas** → `--dark`, blanc.

Corrigés : le dashboard passait de `--ink` à `--dark` ; les deux fiches employaient `--dark-2`
sur un héro déjà sombre — devenu le voile blanc à 12 % ; le bouton à bordure de la fiche
utilisateur devient un aplat `--inset`, comme ses homologues.

### 2.4 · Rangée de référence — deux noms → **corrigé**

`.krow` (création de compte) et `.rrow` (partout ailleurs) sont **le même composant** :
étiquette à gauche, valeur à droite, filet entre. Les paddings différaient de 1 px et les
écarts de 2 px. → `.krow` supprimé, sept occurrences renommées, métriques alignées.

### 2.5 · Rangée de liste — un avatar, trois tailles → **corrigé**

`.lrow .av` 40 px · `.orow .ic` **38 px** · `.prow .av` **44 px** (`--avs`), pour le même rôle :
la vignette d'une rangée de liste. → **40 px, rayon 6 px**, partout. Les quatre noms de rangée
(`.lrow` liste · `.orow` objets détenus · `.prow` annuaire · `.trow` à traiter) sont
**conservés** : ce sont quatre contenus, mais désormais une seule métrique.

### 2.6 · Feuille montante — deux types, et c'est voulu

L'audit a relevé des feuilles **sans pied de page** : « Nouvel équipement », « Ajouter une
personne », « Ajouter des personnes ». Ce n'était pas un oubli, et la distinction méritait d'être
nommée :

- **feuille de choix** — une liste de chemins, aucun engagement → **pas de pied** ; on choisit,
  la feuille suivante s'ouvre ;
- **feuille d'acte** — un formulaire ou une attestation → **pied obligatoire** : « Annuler »
  fantôme à gauche, geste primaire à droite.

Tout le reste de l'anatomie est déjà commun aux treize planches : `grip` · titre + sous-titre ·
corps · pied · note de provenance.

### 2.7 · Barre du bas — **la divergence la plus profonde du chantier**

Mon premier inventaire concluait « aucune divergence ». **Il était faux, et pour une raison qui vaut
d'être notée** : je cherchais `<div class="nav">`, or **deux familles de balisage coexistaient**
pour le même composant — `<nav class="nav">` avec des icônes `n-*` dans les planches anciennes,
`<div class="nav">` avec des `i-*` dans les récentes. La moitié des barres était donc invisible à
l'inventaire, et l'est restée à deux corrections successives, qui ont empilé des barres au lieu de
les remplacer.

**Leçon de méthode, inscrite ici parce qu'elle resservira : un audit qui cherche une seule forme ne
trouve jamais les divergences de forme.** Le balayage se fait sur le *rôle* — « qu'est-ce qui sert
de barre du bas ? » — pas sur une chaîne de caractères.

Normalisé le 31/07 sur les **treize planches** : une seule famille (`<div class="nav">`), un seul
jeu d'icônes (`i-dash` · `i-dev` · `i-task` · `i-group` · `i-menu`), les symboles manquants
ajoutés aux six sprites qui ne les définissaient pas, et **exactement une barre par écran**.

Deux divergences de **contenu** ont été trouvées au passage :

| Où | Ce qui était écrit | Verdict |
| --- | --- | --- |
| Fiche utilisateur, « Mon profil » | Accueil · **Mes actifs** · **Demandes** · Plus | **libellés hors lexique** — corrigés |
| Fiche équipement, utilisateur final | Accueil · Actifs · Tâches · **Équipe** | **onglet qu'il ne peut pas ouvrir** — remplacé par Plus |

« Mes actifs » et « Demandes » n'existent nulle part ailleurs dans le produit ; « Actifs » et
« Tâches » sont les mots du lexique. Et un onglet Équipe présenté à quelqu'un qui n'a pas d'équipe
à gérer est une porte fermée : elle occupe la place de « Plus », qui contient son profil, ses
paramètres et l'aide.

**Deux variantes, et deux seulement :**

- **gestionnaire** — Accueil · Actifs · Tâches · Équipe · Plus *(cinq entrées)* ;
- **utilisateur final** — Accueil · Actifs · Tâches · Plus *(quatre — pas d'Équipe)*.

Mêmes icônes, mêmes libellés, même ordre ; seul l'onglet Équipe est retiré. **« Plus » est présent
dans les deux** : c'est l'entrée du profil et des paramètres, elle ne se supprime jamais.

### 2.8 · Champ code PIN, bandeau de clôture, menu de débordement

Traités le même jour : voir §13.2 et §13.3 de `PASSATION.md`. Un seul composant PIN
(64 × 76, chiffre 34 px, masquage progressif), trois formes de clôture, et la règle
« une action impossible se masque ».

## 3 · Densité et hiérarchie — les trois défauts, et la règle

Le diagnostic est juste. Trois causes, par ordre de gravité :

### a. Trop de cartes, pas assez de silence

Une carte par idée produit une page en escalier où **tout a le même poids**. La règle retenue :

> **Une carte porte un sujet, pas une ligne.** Deux cartes voisines de moins de trois lignes
> chacune sont une seule carte. Une carte d'une seule ligne est une ligne, pas une carte.

Écrans concernés, du pire au moins grave :
1. **Fiche utilisateur** (planche 05.2) — jusqu'à 6 cartes empilées.
2. **Fiche équipement** (planche 04.2) — 5 cartes après le héro.
3. **Créer un compte, colonne 5** (planche 05.3) — 5 sections de formulaire.

### b. L'échelle typographique n'a que deux marches

> ⚠️ **Dépassé le 01/08.** Le tableau ci-dessous en annonce **quatre** ; l'échelle en compte
> **cinq**, plus un rang à part pour les contrôles, qui ne suivent pas l'échelle du texte.
> La version qui fait foi est au registre, **§2.6**. Le constat de départ — *rien ne domine* —
> reste juste ; c'est le remède qui a été précisé.

Aujourd'hui : 15 px pour presque tout, 13 px pour le secondaire. Résultat, **rien ne domine**.
Échelle retenue, quatre marches et pas une de plus :

| Rôle | Taille | Graisse | Emploi |
| --- | --- | --- | --- |
| Titre d'objet | 20–22 px | Archivo 600 | le héro, une fois par écran |
| Titre de section | 13 px | 500 | l'en-tête d'une carte |
| Corps | 15 px | 400 | les valeurs, ce qu'on est venu lire |
| Secondaire | 12–13 px | 400 | la mention, la date, la provenance |

**La donnée clé est en corps, pas en titre de section.** Aujourd'hui c'est souvent l'inverse :
l'étiquette est plus visible que la valeur.

### c. Les mises en garde occupent la place des données

Les encarts d'avertissement en trois lignes coûtent plus que ce qu'ils apportent. Règle :

> **Ce qui engage se lit là où on agit** — une ligne sous le champ, pas un cadre à côté.
> Un encart complet ne se justifie que si l'information **change la décision**, pas si elle
> la commente.

Appliqué dans les planches 06.2 et 15 : la feuille de réception est passée de trois blocs
d'avertissement à **une ligne sous le champ** et un rappel de la sortie de secours.

### Ce qui est déjà appliqué / ce qui reste

- **Appliqué** : planches 05.4, 12, 14, 15 sont écrites sur ces règles.
- ~~**À reprendre** : fiche utilisateur (planche 05.2) et fiche équipement (planche 04.2) — **une passe
  de fusion de cartes**, sans redessiner.~~
  → **Fait le 01/08.** `RAPPORT-AUDIT` §3.2 point 6 : *la règle est désormais tenue* — les fiches
  sont à 2–4 cartes contre 5 et 6 au diagnostic, et la seule violation restante (la carte
  « Documents » à un seul contrat) a été fondue dans « Garantie ». La **passe de densité chiffrée**
  — `--gap`, crans du réglage, `.quiet` — a suivi le **04/08** : registre §2.16.

---

## 4 · Structure de page — un seul gabarit de barre du haut

Trois gabarits coexistent. Un seul est nécessaire :

```
[ retour (48) ] [ identité — titre 16/600 + sous-titre 11 ] [ action (48) ]
```

- **Le retour** est présent dès qu'on n'est pas à la racine d'un onglet.
- **L'identité** porte ce qui distingue cet écran des autres du même type : le code de l'objet,
  le nom de la personne. Jamais le nom de l'écran (« Détail équipement » ne dit rien).
- **L'action** est le menu de débordement, ou « Enregistrer » dans un formulaire — **jamais les
  deux**.

`bhead` (titre seul, sans retour) reste valable **pour la racine d'un onglet uniquement**.
`abar` disparaît : c'est le gabarit unique avec « Enregistrer » en action.

> **Note du 04/08 — `.abar` est un nom recyclé.** Il a bien disparu comme gabarit de barre du haut
> (01/08), puis a été **réattribué le 02/08** à la *barre d'action collante* d'une liste à sélection
> (05.1). Deux objets sans rapport sous le même nom, à un jour d'écart : registre §2.33.

### La barre du bas sur un écran poussé — tranché le 31/07

La convention n'était pas fixée, et l'incohérence traversait plusieurs planches. Elle l'est :

> **Un écran poussé à l'intérieur d'un onglet garde la barre du bas**, avec son onglet d'origine
> actif. L'onglet reste le contexte : le retirer isole l'écran et oblige à remonter par le bouton
> retour pour changer de sujet.

**Deux exceptions, et deux seulement :**

1. **La feuille montante** — elle est posée *sur* un écran qui, lui, porte la barre. Elle n'en
   ajoute pas une seconde.
2. **L'acte plein cadre** — un formulaire à « Enregistrer / Annuler » ou une étape obligatoire
   (« Modifier la fiche », « Définir un nouveau code »). Il est modal par intention : on en sort
   par son propre pied, pas en changeant d'onglet.

Appliqué le 31/07 aux planches **15** (« compte suspendu ») et **17** (« double authentification »,
« mes sessions »), qui l'omettaient sans raison.

> **Une troisième exception a été inscrite le 02/08** : la **séquence de première connexion** —
> barre de titre et compte d'étapes, pas d'onglets, parce qu'il n'y a qu'un chemin. Registre §2.8.

---

## 5 · Continuité des flux — les six chaînes, et leurs trous

| Flux | Chaîne | Trou |
| --- | --- | --- |
| Attribuer | demande → validation → remise → confirmation → attribué | **aucun** |
| Restituer | demande de restitution → restitution → réception → disponible | **aucun** |
| Incident | déclaration → prise en charge → réparation → retour | **aucun** depuis la planche 04.3 |
| Créer un compte | invitation → compte en attente → première connexion → fiche | ~~première connexion non dessinée~~ → **dessinée le 02/08, planche 02.2** |
| Gérer un compte | menu → feuille → clôture | **aucun** depuis les planches 05.4 et 15 |
| Preuve | fait → méthode → saisie → attestation | **aucun** depuis la planche 06.2 |

~~**Le point de passage obligé de tous** reste la page **Tâches**, qui n'est pas dessinée. C'est
la destination unique des liens du tableau de bord (règle du 28/07) et de la moitié des flux
ci-dessus. **Priorité n°1.**~~

→ **Tâches a été livrée le 31/07**, planche 03.3. Les six chaînes sont donc **complètes** : plus
aucun trou de flux au 04/08. Ce qui reste ouvert n'est plus de la continuité mais du **contenu** —
voir `DECISIONS-EN-ATTENTE-02-08.md` §2 et §3.

---

## 6 · Ce qui reste à dessiner, par ordre

1. ~~**Tâches**~~ — **livré le 31/07**, planche 16.
2. ~~**Mon compte**~~ — **livré le 31/07**, planche 07.1, et **fusionné** le même jour avec la carte
   qui l'anticipait dans *Mon profil* (voir §7).
3. ~~**Déclarer un incident**~~ — **livré**, planche 04.3 (feuille photo-d'abord + conséquence).
4. ~~**Première connexion** — accepter l'invitation, définir son code PIN (planche 06.2, étape 2).~~
   → **livrée le 02/08**, planche 02.2.
5. ~~**Passe de densité** sur les planches 04.2 et 8, une fois les règles du §3 validées.~~
   → **faite le 04/08** : `--gap` ramené à 20 sur les trois planches qui portaient 24, crans du
   réglage de densité alignés (ils portaient trois valeurs pour « aérée »), `.quiet` déposée.
   Registre §2.16.

> **Cette liste est vide au 04/08.** Ce qui reste à faire n'est plus du dessin d'écran manquant :
> c'est de l'**application d'arbitrages déjà rendus** (`DECISIONS-EN-ATTENTE-02-08.md` §2 et §3) et
> une **dette d'accessibilité** — douze planches portent encore la famille `--live-*` sur surface
> claire, où elle est sous le seuil de contraste. Registre §2.10 bis.

---

## 7 · Passe de correction du 31/07 — doublons fusionnés, règles normalisées

Demande : *corriger*, pas constater. Chaque doublon fusionné vers une vue unique, chaque règle
transverse ramenée à une valeur, et les valeurs sorties des planches pour vivre dans un registre.

### 7.1 · Doublons fonctionnels — fusionnés

| Doublon | Traitement |
| --- | --- |
| « Mon compte » : planche 07.1 **et** carte de *Mon profil* (05.2) | la carte devient **une rangée de renvoi** vers la planche 07.1 |
| « Mon compte » : planche 07.1 **et** section Sécurité de Paramètres | Paramètres porte **une ligne**, « Sécurité et connexion » → planche 07.1 |
| 05.4 « Gérer un compte utilisateur » lu comme « Mon compte » | **renommée** « Administrer le compte d'une personne », frontière écrite dans l'intro |

Trois points d'entrée — avatar, Paramètres, Mon profil — **une seule vue**. Aucun n'affiche une
interface différente : les deux derniers ne sont que des renvois.

### 7.2 · Règles transverses — normalisées sur l'ensemble du projet

| Règle | Divergences trouvées | Portée corrigée |
| --- | --- | --- |
| **Code PIN = 4 cases**, 64 × 76, chiffre 34 px | 1 planche à **6 cases** et métriques propres | planche 07.1 |
| **`.pin` ne sert qu'au code PIN** | un code d'application dans le composant PIN | planche 07.1 |
| **Vignette de rangée = 40 × 40, rayon 6** | 44 px (2×) · 32 px (1×) · rayon 4 (3×) · rayon 50 % (3×) | 05.1 · 05.2 · 06.1 · 03.1 · 03.2 · 04.2 · 04.3 |
| **Héro d'identité = 52 × 52, rayon 6** | 56 px (1×) · rayon 4 (1×) · rayon 50 % (1×) | 05.2 · 06.1 · 05.3 |
| **Titre de section = 13 px** | 15 px encore déclaré | 03.2 |
| **Un libellé par destination** | « Mot de passe, 2FA, session » / « Mot de passe, session » pour le **même** écran | 03.1, les deux rôles |

**Le cercle contre le carré arrondi** était la divergence la plus répandue et la moins visible :
quatre planches dessinaient les initiales d'une personne dans un cercle, trois dans un carré
arrondi, pour la même rangée. Retenu : **carré arrondi, rayon 6** — la même vignette porte aussi
bien un objet qu'une personne, et un objet dans un cercle ne se lit pas.

### 7.3 · Ce qui change dans la méthode

Le constat de fond du retour est qu'un audit ne tient pas : il décrit un état, et l'état bouge à
la planche suivante. D'où **`REGLES-TRANSVERSES.md`** — non pas un rapport de plus, mais l'endroit
**unique** où une valeur transverse se décide, avec trois obligations :

1. on lit le registre **avant** de dessiner ;
2. une variante n'est pas une variante — c'est un **autre rôle à nommer**, ou une erreur ;
3. faire évoluer un standard est une **décision globale, datée au journal**, appliquée à toutes
   les planches dans le même mouvement — jamais un renforcement local, même bien intentionné.

> **Ce que le 04/08 ajoute à cette liste.** Une quatrième obligation, tirée de six unités de
> correction : **une déclaration de conformité énonce ce qui a été mesuré, et sur quoi.** « Les
> trois `.fbtn` sont identiques » était vrai et inutile ; « identiques au caractère, sprite non
> comparé » aurait permis de répondre en une ligne. Un verdict sans base de mesure se relit deux
> semaines plus tard comme une garantie qu'il n'était pas.
