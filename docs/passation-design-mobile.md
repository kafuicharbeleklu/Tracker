# Passation — chantier design mobile Tracker

Document de reprise. Écrit le **2026-07-26**. À lire en entier avant de toucher à quoi que
ce soit dans ce projet.

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
3. **Chaque écran est livré avec la réplique de l'existant à côté** — `xxx-actuel.html`.
   Sans point de comparaison, l'utilisateur ne peut pas juger. Ne jamais livrer une
   proposition seule.
4. **Lire le code avant de proposer.** L'utilisateur l'a demandé explicitement : « si tu
   avais réellement bien lu la documentation du projet… ». Poser des questions est bien,
   mais après avoir cherché la réponse soi-même.
5. **Chaque écran répond d'abord à trois questions**, avant le moindre pixel : à qui il
   sert, quelle décision la personne y prend, ce qu'elle fait juste après. Si on ne sait
   pas répondre, on ne dessine pas.
6. **Ne consigner comme tranché que ce que l'utilisateur a dit explicitement.** Voir §7.

## 3. Où sont les choses

**Projet Claude Design : « Tracker — Neemba Togo »**
`3eb16569-439b-4f3f-b5ec-e88f30adcd99`

Deux autres projets existent et **ne servent à rien ici** : « Design System » (vidé, ne
contient plus que ses fichiers techniques) et « Modernist » (kit de démarrage générique
fourni, sans rapport avec Tracker).

```
readme.md                          règles + palette
PASSATION.md                       ce document
screens/ui-actuelle.html           galerie des 15 écrans compacts actuels
screens/actuel/*.png               les captures (393 px, hauteur réelle)
screens/login-actuel.html          \
screens/login-piste-a.html          } Login
screens/login-piste-b.html         /  ← PISTE RETENUE
screens/dashboard-actuel.html      \
screens/dashboard-admin.html        } Dashboard
screens/dashboard-utilisateur.html /
screens/dashboard-analyse.md       analyse du code + arbitrages
```

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
| **Dashboard** | admin + utilisateur validés | 2 513 px |
| Détail équipement | à faire — **le plus long de l'application** | 2 666 px |
| Rôles (RBAC) | à faire | 2 368 px |
| Emplacements | à faire | 2 142 px |
| Catalogue | à faire | 1 836 px |
| Finances | à faire | 1 766 px |
| Détail utilisateur | à faire | 1 574 px |
| Inventaire / Utilisateurs | à faire — **même moule**, les deux tombent d'un coup | 1 476 / 1 436 px |
| Rapports | à faire | 1 247 px |
| Approbations | **ne pas y toucher** — jugé déjà bon par l'utilisateur | 992 px |
| Paramètres | à faire | 866 px |

Prochain écran proposé : **détail équipement** (le plus long, donc le plus rentable).
L'utilisateur n'a pas encore confirmé cet ordre.

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
- **Anneau conservé pour une proportion unique** (garantie) ; **barres pour le
  multi-catégories** (répartition par type). L'anneau à quatre parts ne se compare pas au
  pouce et c'est lui qui imposait le rouge/vert décoratifs.
- **Dashboard utilisateur : composition strictement identique à l'existant.** Aucune
  section ajoutée ni retirée. Seule la forme change.

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

## 8. Pièges techniques de l'outil DesignSync

- **`_ds_manifest.json` n'est PAS régénéré** quand on ajoute des fichiers. Les nouvelles
  cartes n'apparaissent pas dans le volet Design System, alors que les fichiers sont bien
  stockés. **Correctif : réécrire `_ds_manifest.json` à la main** avec tous les chemins de
  cartes. `register_assets` ne suffit pas — il alimente un autre registre.
- L'utilisateur doit **recharger en vidant le cache** (`Ctrl + Maj + R`).
- `finalize_plan` exige **`writes` ET `deletes`**, même vide.
- Les **chemins relatifs d'images fonctionnent** : `actuel/xxx.png` depuis
  `screens/ui-actuelle.html`.
- Écrire un fichier existant le remplace ; le volet reflète la nouvelle version au
  rechargement.

## 9. Points ouverts

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
  « Garantie » ? Maintenant qu'on sait qu'ils sont scopés à ses propres équipements,
  l'argument pour les retirer est beaucoup plus faible. **À l'utilisateur de dire.**

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
