# DOSSIER DE PASSATION — du dessin au code

**14/08/2026.** Le chantier de dessin est clos : **35 planches**, un registre de règles, un lexique,
quatre documents de décision. Ce dossier ne résume pas les planches — il donne **l'ordre de marche** :
par quoi commencer, ce qui dépend de quoi, et ce qu'aucun dessin ne peut réparer.

Les planches sont dans `screens/`, visibles dans l'onglet Design System, groupées par domaine. Chacune
porte ses colonnes légendées (`État —`, `Vue —`, `Relevé —`), son intro qui dit ce qu'elle tranche, et
une colonne `Relevé` qui nomme ce que le code fait aujourd'hui et pourquoi cela change.

---

## 1 · Les quatre documents à lire avant la première ligne de code

| Document | Ce qu'il vous évite |
| --- | --- |
| `REGLES-TRANSVERSES.md` | Le registre normatif : les hauteurs, les vignettes, les icônes, les héros. **Un nombre y est donné, pas une variable** — ne créez pas de jeton pour une vignette. |
| `LEXIQUE.md` | Un mot par acte. Les libellés du code y sont comparés au mot retenu, avec le statut *existant / renommage à valider*. |
| `screens/direction-compact-piste.html` (00.1) | La direction de forme : palette, échelle typographique, densité, icônes. C'est la planche à ouvrir quand vous hésitez sur une valeur. |
| `screens/regimes-piste.html` + 00.4 + 00.5 | Les trois régimes et les huit gabarits portés. **La navigation change trois fois, le contenu jamais.** |

---

## 2 · L'ordre de construction — par effet de levier, pas par écran

Construire écran par écran est l'erreur qui a produit les trente `medium:grid-cols-2` et les sept
`max-w-*`. Trois composants partagés portent **la moitié du produit** : ils passent en premier.

### Étape 1 — les trois composants transverses (avant tout écran)

| Ordre | Composant | Planche | Emplois |
| --- | --- | --- | --- |
| 1 | **L'attente et le scan** — squelettes, scan par lot, hors ligne | 17.3 | **28 écrans**, 3 emplois de scan |
| 2 | **Sélection et confirmation** — mode sélection, confirmation destructive | 17.2 | **20 emplois**, dont 9 confirmations |
| 3 | **États d'écran** — vide, erreur d'acte, hors ligne, introuvable, refusé | 17.1 | 4 états, tous les écrans |

Rien d'autre ne devrait être écrit avant. Un écran construit sans eux les réinventera localement, et
c'est exactement la dette que le chantier a relevée.

### Étape 2 — les gabarits porteurs

Huit gabarits couvrent les 30 écrans. Construisez **le gabarit**, puis instanciez.

| Gabarit | Planche de référence | Régime tablette |
| --- | --- | --- |
| Liste / file | 04.1, 08.1 | 00.3, 00.4 |
| Fiche (détail) | 04.2 | 00.3 |
| Formulaire plein écran | 04.3 | 00.5 |
| Assistant (flux à étapes) | 06.1 | 00.5 |
| Référentiel de réglages | 14.1 | 00.4 |
| Tableau de bord | 03.1 | 00.4 |
| Feuille / dialogue | 17.2 | 00.3 (dialogue ≥ 840) |
| Canevas de scan | 17.3 | — |

### Étape 3 — les écrans, par domaine

Dans l'ordre des groupes : 02 Connexion · 03 Tableau de bord · 04 Équipement · 05 Utilisateur ·
06 Attribuer et restituer · 07 Mon compte · **08 Tâches** · 09 Catalogue · 10 Emplacements ·
11 Rôles · 14 Paramètres · 15 Finances · 16 Audit.

« Tâches » manquait à cette liste alors qu'elle est une destination de plein droit — c'est
l'oubli qui avait laissé la planche s'appeler `03.3` dans ce dossier et `08.1` sur sa carte.
Le numéro qui fait foi est **08.1** ; voir `REGLES-TRANSVERSES.md` §5.1.

---

## 3 · Index des planches

| # | Planche | Fichier |
| --- | --- | --- |
| 00.1 | Direction esthétique — la référence de forme | `direction-compact-piste.html` |
| 00.2 | Lexique — un mot par acte | `lexique-piste.html` |
| 00.3 | Les trois régimes — au-delà du téléphone | `regimes-piste.html` |
| 00.4 | Le rail — tableau de bord, file, référentiel | `regimes-2-rail-piste.html` |
| 00.5 | Sans rail — l'assistant et le formulaire | `regimes-3-sans-rail-piste.html` |
| 02.1 | Connexion | `login-piste.html` |
| 02.2 | Première connexion | `login-2-premiere-connexion-piste.html` |
| 03.1 | Tableau de bord | `dashboard-1-tableau-piste.html` |
| 03.2 | « À traiter » — la ligne, le bouton, le seuil | `dashboard-2-atraiter-piste.html` |
| 08.1 | Tâches — la boîte de travail | `dashboard-3-taches-piste.html` |
| 04.1 | Liste équipements | `equipement-1-liste-piste.html` |
| 04.2 | Détail équipement | `equipement-2-detail-piste.html` |
| 04.3 | Créer, corriger, sortir un équipement | `equipement-3-creation-piste.html` |
| 04.4 | La suite de l'incident | `equipement-4-incident-suite-piste.html` |
| 05.1 | Liste utilisateurs | `utilisateur-1-liste-piste.html` |
| 05.2 | Détail utilisateur | `utilisateur-2-detail-piste.html` |
| 05.3 | Créer un compte utilisateur | `utilisateur-3-creation-piste.html` |
| 05.4 | Administrer le compte d'une personne | `utilisateur-4-compte-piste.html` |
| 06.1 | Le parcours complet | `attribution-1-parcours-piste.html` |
| 06.2 | La preuve — méthode et saisie | `attribution-2-preuve-piste.html` |
| 06.3 | Fins de flux — les clôtures | `attribution-3-fins-de-flux-piste.html` |
| 06.4 | Demander un équipement | `attribution-4-demander-piste.html` |
| 06.5 | Arbitrer les demandes | `attribution-5-arbitrer-piste.html` |
| 07.1 | Mon compte | `mon-compte-piste.html` |
| 09.1 | Catalogue | `catalogue-1-referentiel-piste.html` |
| 09.2 | Fiche de modèle et imports | `catalogue-2-modele-piste.html` |
| 10.1 | Emplacements | `emplacements-1-referentiel-piste.html` |
| 11.1 | Rôles et permissions | `roles-1-permissions-piste.html` |
| 14.1 | Paramètres | `parametres-piste.html` |
| 15.1 | Finances et Rapports | `finances-1-rapports-piste.html` |
| 16.1 | Audit — vue globale | `audit-1-vue-globale-piste.html` |
| 16.2 | Audit — la campagne | `audit-2-campagne-piste.html` |
| 17.1 | États d'écran — 4 états | `etats-piste.html` |
| 17.2 | Sélection et confirmation — 20 emplois | `transverses-1-selection-piste.html` |
| 17.3 | L'attente et le scan — 28 écrans | `transverses-2-attente-scan-piste.html` |

---

## 4 · Ce qu'aucun dessin ne répare — les dettes bloquantes

Ces points ne sont pas des choix de forme. Tant qu'ils tiennent, l'écran dessiné **ne peut pas être
juste**, quel que soit le soin du portage.

### D1 · Département contre service — bloque l'audit *(la plus lourde)*

Les actifs portent un **département** (`department: "IT HQ"`, valeur par défaut des 7 actifs français),
le référentiel de lieux porte un **service** (« IT », « Finance »). Les deux vocabulaires ne se
recoupent pas : **quatre services sur sept n'attendent aucun actif**, et l'audit d'un service vide n'a
pas de sens.

**À faire côté données**, pas côté écran : un seul référentiel, et une migration des valeurs
existantes. Voir 16.1, relevé V3.

### D2 · Deux faux comptes dans la vue globale d'audit

- `selectedCountry = countries[0]` au montage : l'écran s'ouvre filtré sur la France, **7 actifs sur
  14 hors de vue**, sans qu'un mot le dise.
- `missing = expected − found` : avant le premier scan, `found` vaut 0, donc l'écran **déclare tout le
  parc manquant**.

Le dessin corrige la présentation (périmètre nommé, chiffres absents plutôt que faux) ; le calcul reste
à reprendre. Voir 16.1, relevés V1 et V2.

### D3 · La clôture d'audit n'ouvre aucune tâche

`flaggedAsMissing` retire les actifs du service. Deux manquants sur quatre sont **attribués** : leur
porteur doit dire où l'objet est passé. Sans création de tâche, un manquant n'est qu'un mot dans une
fiche. Voir 16.2.

### D4 · `Snackbar` n'est appelé par aucun écran

Le composant existe et n'est employé nulle part. **La forme 2 des clôtures (06.3) repose entièrement
dessus.** Ou le produit l'adopte, ou cette forme perd son second cas.

### D5 · La cible tactile est sous la norme, à toutes les largeurs

`IconButton` est à **40 × 40** avec une hit-box élargie ; le registre demande **48**. À la tablette on
touche encore : un rail ne dispense pas d'un doigt. Les gestes du rail font **64 × 72**.

### D6 · Le régime tablette n'existe presque pas

`MEDIA.medium` n'est employé que dans **2 vues sur 28**. Les 26 autres passent du téléphone au grand
écran avec les défauts du navigateur. **Le dessin est ici en avance sur le produit** : 00.4 et 00.5
donnent les cinq portages manquants, 00.3 les trois autres.

### D7 · Trente grilles et sept mesures posées écran par écran

`medium:grid-cols-2` ×30, et sept `max-w-*` différents. À remplacer par **une** mesure de lecture
(960 px), **une** mesure de contenu de flux (560 px), et le plancher de colonne (360 px) qui décide
seul du passage à deux colonnes.

### D8 · Gestes morts

Le « Centre d'aide » de `SettingsPage.tsx` porte quatre `<Button>` **sans `onClick`** — Documentation,
Support, Tutoriels, FAQ. `DocumentationExplorerPage.tsx` est **exporté et jamais importé** : aucune
route ne le déclare. Voir 14.1 (colonne *Relevé*) et `DECISION-DOCUMENTATION-14-08.md`.

### D9 · Hors ligne n'est pas détecté

**Aucune occurrence de `navigator.onLine`.** L'état est dessiné (17.1) et n'a aucun déclencheur.

### D10 · Icônes — `MaterialIcon` à remplacer par Phosphor

Le dessin est passé à **Phosphor** (00.1). Côté code, cela veut dire réécrire le composant d'icône et
reprendre les correspondances. Le registre fixe deux tailles d'emploi (18 et 20 px en rangée) et la
règle I3 : **un état se dit par un pictogramme *et* un mot**, jamais par la seule couleur.

---

## 5 · Périmètre — ce qui est dessiné, et ce qui ne l'est pas

**30 écrans de production couverts sur 35.** Les écarts, chacun avec son motif écrit :

| Écran | Statut |
| --- | --- |
| `DocumentationExplorerPage` | **Exclu.** Non routé, contenu d'architecture interne, exigerait un neuvième gabarit. `DECISION-DOCUMENTATION-14-08.md` |
| `DesignSystemGalleryPage` | **Hors périmètre.** Outil de build DEV, jamais exposé à l'utilisateur — acté ici, une ligne. |
| `not_found` · `AccessDeniedPage` | Couverts comme **états** dans 17.1, pas comme planches propres. |
| `equipment` pré-filtré | Couvert comme **état** de 04.1 (« arrivée pré-filtrée depuis le tableau de bord »). |

---

## 6 · Trois règles qui sauvent du temps

1. **Ce qui gagne de la place gagne des rangées, pas de la hauteur.** Une rangée fait 72 px à 393 px et
   72 px à 1280 px. Un réglage 56. Une vignette 40. Un écran large mérite **plus de rangées visibles**.
2. **Un compteur qui appelle une action n'est pas un compteur, c'est une tâche.** Sa place est la file,
   pas un écran de réglages. Jurisprudence du tableau de bord, appliquée partout.
3. **On n'annonce pas ce qui n'existe pas.** Pas de « bientôt disponible », pas de bouton sans
   destination. Un geste mort est pire qu'un manque : il fait chercher deux fois avant de renoncer.

---

## 7 · Journal

`PASSATION.md` porte les trente entrées du chantier, dans l'ordre. Chaque planche y a son entrée : ce
qu'elle tranche, ce qu'elle emprunte, et les arbitrages qui s'écartent du plan — avec leur raison.
C'est là qu'il faut chercher **pourquoi** une planche dit ce qu'elle dit.
