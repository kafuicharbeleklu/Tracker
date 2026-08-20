# Tracker — maquettes mobiles

Miroir de travail du design system de l'application **Tracker** (Neemba Togo).
La source de vérité reste le code : `index.css` pour les valeurs, `DESIGN_SYSTEM.md`
pour le nommage, `DESIGN_BRIEF.md` pour l'ADN mobile. Ce projet-ci sert à **décider**,
pas à définir.

## Règles à ne pas casser

Elles viennent des « Interdits absolus » du brief. Une maquette qui en casse une ne
pourra pas être implémentée telle quelle.

1. **Jaune : deux usages par écran maximum.** Jamais en fond d'onglet, de carte ou de
   badge décoratif. Texte sur jaune : toujours noir.
2. **Deux graisses de police par écran** : 400 pour le corps, 500 pour titres, valeurs
   et actions. Rien d'autre.
3. **Rayons : 2 / 4 / 6 / 8 px, plus la pastille.** Jauges et filets à 2, contrôles à 4,
   **vignettes et héros d'identité à 6**, cartes à 8. Ce qui est rond parce qu'il est rond —
   compteur, étiquette de statut — prend `var(--r-pill)`, jamais la moitié de sa hauteur écrite
   en dur. L'identité voulue est « légèrement adouci, mais qui se lit encore comme un carré ».
   Pas de 10, 14, 16. *(Le 6 était employé 47 fois sans être admis ; tranché le 07/08 — voir
   `REGLES-TRANSVERSES.md` §2.49.)*
4. **Aucune MAJUSCULE** hors codes techniques (`ASSET-20002`).
5. **Aucun point d'exclamation**, aucun ton administratif. Libellés d'action =
   verbe + objet.
6. **Cartes sans bordure ET sans ombre** à la fois.
7. **Cibles tactiles ≥ 48 px.**
8. **Pas de bouton désactivé accompagné d'une phrase d'instruction.** Si l'action est
   impossible, on la masque.

## Palette

| Rôle | Valeur |
| --- | --- |
| Fond de page | `#FAF9F7` |
| Carte | `#FFFFFF` |
| Texte principal | `#1A1917` |
| Texte secondaire | `#78746C` |
| Filet | `#F0EEE9` |
| Bordure de champ | `#8E877E` |
| Jaune de marque | `#FDC910` |
| Danger | `#B3261E` |
| Succès | `#1B7F4D` |
| Attention | fond `#FEF3D6`, texte `#7A5A00` |

## Cohérence

**Un acte = une vue.** Deux points d'entrée vers le même acte ouvrent la même vue : seuls
l'en-tête et le pré-remplissage diffèrent. `AUDIT-UI.md` tient l'inventaire des actes, de
leurs points d'entrée, des composants partagés et des règles de densité.

## Vocabulaire

**Un acte = un mot**, dans les planches et dans le code. La liste fait foi : `LEXIQUE.md` à la
racine, doublée de la planche `screens/lexique-piste.html`. Un mot qui n'y est pas se propose,
il ne se glisse pas — et un renommage du code y est marqué **à valider**, jamais appliqué en
silence.

## Méthode

Chaque écran commence par répondre à trois questions, **avant** le moindre pixel :

- à qui il sert ;
- quelle décision la personne y prend ;
- ce qu'elle fait juste après.

Si on ne sait pas répondre, on ne dessine pas.

## Rangement des fichiers

**Une planche = une vue = un fichier = un groupe de cartes.** Nommage :
`screens/<famille>-<n>-<vue>-piste.html` (familles : `login`, `dashboard`, `equipement`,
`utilisateur`, `attribution`). Le `<n>` est le numéro de sous-section : c'est lui qui fixe l'ordre
des cartes à l'intérieur du groupe, qui suit le nom de fichier. Une famille à une seule vue s'en
passe (`login-piste.html`, `mon-compte-piste.html`, `lexique-piste.html`).

Une planche porte **toutes les variantes de sa vue** — profils (gestionnaire / utilisateur
final), régimes de volume, états — en colonnes ou en réglages, jamais en fichiers séparés.
*(La règle inverse valait au début du chantier ; les fichiers `dashboard-piste-admin.html` et
assimilés sont dans `screens/archive/`.)*

**Le groupe « 01. Référence — l'UI actuelle, avant refonte » est une baseline, pas un chantier.**
Il porte les quinze répliques de l'état initial du produit et sert **uniquement de point de
comparaison**. Chaque sujet qui y figure a sa proposition dans la section du même nom :
Tableau de bord → `03.1`, Détail équipement → `04.2`, Utilisateurs — liste → `05.1`, Détail
utilisateur → `05.2`, Connexion → `02`. **On n'y ajoute rien**, et aucune décision ne s'y prend.

**Une fonctionnalité = une section parente ; ses variantes sont des sous-sections**, jamais des
titres de premier niveau supplémentaires. Le numéro parent est sur deux chiffres (`01`, `02`, …)
pour que l'ordre affiché reste l'ordre réel ; la sous-section porte le numéro du parent (`04.1`,
`04.2`, …) et fixe l'ordre de lecture à l'intérieur du groupe.

| Section | Sous-sections |
| --- | --- |
| `01. Référence — l'UI actuelle, avant refonte` | les quinze répliques |
| `02. Connexion` | — |
| `03. Tableau de bord` | `03.1` direction retenue · `03.2` « à traiter » · `03.3` tâches |
| `04. Équipement` | `04.1` liste · `04.2` détail · `04.3` créer, corriger, sortir |
| `05. Utilisateur` | `05.1` liste · `05.2` détail · `05.3` créer un compte · `05.4` gérer un compte |
| `06. Attribuer et restituer` | `06.1` parcours complet · `06.2` la preuve · `06.3` fins de flux · `06.4` demander un équipement |
| `07. Mon compte` | — |
| `08. Lexique — un mot par acte` | — |
| `15. Finances et rapports` | `15.1` Finances et Rapports |
| `09. Catalogue` | `09.1` le référentiel · `09.2` fiche de modèle et imports |
| `10. Emplacements` | — |
| `11. Rôles et permissions` | — |
| `12. États — quand l'écran n'a rien à montrer` | — |
| `13. Au-delà du téléphone` | — |
| `14. Paramètres` | — |

**Numérotation des cartes — tranché le 06/08.** Une carte porte **le numéro de sa section** :
`09.1 Catalogue`, `10.1 Emplacements`, `11.1 Rôles et permissions`, `12.1 Les états transverses`.
Les deux cartes qui portaient encore `09.2` et `09.3` dans des sections `10.` et `11.` ont été
renumérotées.

Un nouveau sujet rejoint la section parente à laquelle il appartient, avec le sous-numéro
suivant. On n'ouvre une section parente que pour une fonctionnalité qui n'en a pas encore.

Une piste rejetée est déplacée dans `screens/archive/` le jour même de la décision, et **perd
sa ligne `@dsCard`** pour disparaître du volet. Rien n'est supprimé.

`_ds_manifest.json` **est régénéré automatiquement** à chaque tour — ne pas l'écrire à la main.

**L'état actuel n'est plus recopié dans chaque planche** (décision du 30/07, pour économiser la
génération). Les captures vivent une seule fois dans `screens/actuel/` — `<ecran>.png` pour un
écran, `<flux>-<n>-<etape>.png` pour un flux modal — et la planche les **nomme** en une ligne au
lieu de les afficher. Les défauts relevés sont écrits dans `PASSATION.md`. Les répliques
`-actuel.html` de Login et Dashboard restent comme référence, sans `@dsCard` ; on n'en crée plus.

## Ce qui est passé au produit — au 06/08

Une planche livrée n'est pas une planche implémentée. Cette table dit où en est le portage ;
elle se lit avec le tableau « État » ci-dessous, qui parle du dessin.

| Planche | Dans le produit |
| --- | --- |
| `03.3` Tâches | **vue créée** — file, tri par ancienneté, filtres par nature, état vide ; l'onglet de la barre du bas, du rail et de la barre latérale l'ouvre. Deux natures de la planche manquent : *code PIN à définir* et *réparations*, dont la donnée n'existe pas |
| `06.4` Demander un équipement | **appliquée** — titre, urgence à deux crans, message des vingt caractères, types non attribuables retirés, émoji supprimé |
| `12.1` États transverses | **partielle** — squelette de chargement, page introuvable, accès refusé, et la règle d'erreur sur deux wizards. Restent : les refus engagés depuis une rangée, et le hors-ligne |
| `09.1` Catalogue | **partielle** — l'attribut `assignable` et la source unique de libellés |
| Toutes les autres | **non portées** |

## État

| Écran | Statut |
| --- | --- |
| Connexion | piste B retenue, **validée** |
| Tableau de bord | **validé** — « héro inversé vivant », admin + utilisateur |
| Détail équipement | **validé** (29/07) — 4 états + utilisateur final |
| Liste équipements | **validée** (29/07) — 3 volumes + scanner adaptatif |
| Liste utilisateurs | **validée** (30/07) — 3 volumes + sélecteur de destinataire |
| Attribuer / restituer | piste livrée (30/07) — **partielle**, complétée par le workflow |
| Workflow d'attribution | **piste livrée** (30/07) — chaîne à 5 maillons, 3 origines, preuve de remise |
| Détail utilisateur | **piste livrée** (30/07) — 3 états de compte + « Mon profil » |
| Créer un compte utilisateur | **piste livrée** (30/07) — inviter / importer + compte en attente |
| Gérer un compte utilisateur | **piste livrée** (31/07) — suspendre, supprimer, réinitialiser PIN / mot de passe |
| « À traiter » : ligne, bouton, seuil | **piste livrée** (31/07) — matrice + 3 régimes de volume |
| Lexique — un mot par acte | **livré** (31/07) — `LEXIQUE.md` + planche 13 |
| La preuve — méthode et saisie | **piste livrée** (31/07) — règle de choix, champ PIN masqué, nouveau code |
| Fins de flux — les clôtures | **piste livrée** (31/07) — trois formes, écart, suspension, suppression |
| Page « Tâches » | **piste livrée** (31/07) — file, filtres, pré-filtrage, 999, état vide |
| Mon compte (mot de passe, 2FA) | **piste livrée** (31/07) — vue de référence unique + renvoi Paramètres |
| Déclarer un incident | **livré** — la déclaration en 04.3, et sa suite en **04.4** (02/08) : prise en charge, remplacement, retour |
| Sélecteur d'objets à l'échelle | **livré** (30/07) — groupé par modèle, unité désignée |
| Catalogue | **piste livrée** (05/08) — familles → types, fiche de type, attribut `assignable` |
| Emplacements | **piste livrée** (05/08) — pays → site → local, fiche de site, site qui n'a jamais servi |
| Rôles (RBAC) | **piste livrée** (05/08) — huit rôles rangés par effet, permissions appliquées contre déclarées |
| Finances, Rapports | à faire |
| Demander un équipement | **piste livrée** (05/08) — la feuille, le choix du type, la demande pour un autre, l'état « une demande est déjà en cours » |
| Les états transverses | **piste livrée** (06/08) — chargement, geste en cours, acte qui échoue, hors ligne, introuvable, accès refusé |
| Les trois régimes (au-delà de 393 px) | **piste livrée** (06/08) — rail, barre latérale, largeur de lecture unique, colonnes déduites du contenu, feuille → dialogue |
| Paramètres | **piste livrée** (06/08) — trois propriétaires, le réglage qui s'applique au geste, la conséquence dite, ce qui tombe |
| Fiche de modèle et imports du référentiel | **piste livrée** (07/08) — 09.2 : la fiche de modèle, créer un modèle, importer des modèles, importer des emplacements |
| Approbations | **ne pas y toucher** — jugé déjà bon |
| Audit | déjà basculé dans le code, sert de référence |
