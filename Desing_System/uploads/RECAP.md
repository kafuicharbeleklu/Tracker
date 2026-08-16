# RECAP — comprendre Tracker et reprendre le chantier

Point d'entrée du projet. Écrit le **2026-07-26**.

Si tu arrives sur ce dépôt sans rien connaître, lis ce fichier en entier : il explique ce
qu'est l'application, comment elle est faite, ce qui est en cours, et par quoi continuer.
Il ne remplace pas les documents de référence — il te dit lequel ouvrir et quand.

---

## 0. La carte des documents

| Fichier | Ce qu'il contient | Quand l'ouvrir |
| --- | --- | --- |
| **`RECAP.md`** | ce fichier — vue d'ensemble et point d'entrée | en premier |
| `CLAUDE.md` | conventions de code, commandes, architecture technique | avant d'écrire du code |
| `DESIGN_BRIEF.md` | **l'ADN mobile — ses Interdits §8 sont bloquants** | avant toute tâche d'interface |
| `DESIGN_SYSTEM.md` | le système : nommage des tokens, matrice d'états, choix de primitive, gouvernance | quand tu touches un composant |
| `DESIGN_SYSTEM_CHANGELOG.md` | journal obligatoire de toute évolution de composant ou de token | à chaque modification |
| `docs/passation-design-mobile.md` | passation détaillée du chantier design en cours | pour reprendre le chantier |
| `AUDIT_MOBILE.md` | les 20 constats de l'audit mobile initial | contexte historique |
| `README.md` / `AGENTS.md` | docs historiques, **partiellement périmées** | avec prudence |

⚠️ `README.md` et `AGENTS.md` mentionnent React Router et omettent `FinanceDataContext`.
**Le code fait foi.**

---

## 1. Ce qu'est Tracker

Une application interne de **suivi de parc informatique** pour **Neemba**, entreprise
présente dans plusieurs pays. Elle sert à savoir qui détient quel matériel, à traiter les
demandes d'attribution et de retour, à mener des audits physiques du parc, et à suivre les
coûts.

L'interface est **en français**. Ne jamais nommer un pays dans les textes : Neemba est
multinational.

Les utilisateurs ne voient pas la même chose selon leur rôle. Trois profils comptent :
l'**informaticien / administrateur** (qui gère le parc), le **manager** (qui valide les
demandes de son équipe) et l'**utilisateur final** (qui possède du matériel et en demande).

---

## 2. Comment l'application est faite

Détails complets dans `CLAUDE.md`. L'essentiel à ne pas rater :

**React 19 + TypeScript + Vite 6, Tailwind v4.** Pas de lanceur de tests : on vérifie avec
`npm run build`, `npm run lint:ds`, puis un essai manuel et les scripts QA Playwright.

**Le routage est fait maison — ce n'est PAS React Router.** C'est un routeur à ancre
(`#/...`) : `src/hooks/useRouter.ts` lit et écrit le hash, `useAppNavigation.ts` traduit
les segments d'URL en `ViewType`, et `AppLayout.tsx` fait un `switch` dessus. Ajouter une
page = trois endroits à modifier **ensemble**.

**Les données sont fictives.** Elles viennent de `src/data/mockData.tsx` et sont persistées
dans le `localStorage`. Pas de base de données. Les mutations sont filtrées par des règles
métier (`src/lib/businessRules.ts`) qui renvoient une décision plutôt que de lever une
erreur — il faut lire `.allowed` / `.reason` à l'appel.

**Deux chemins d'authentification** : Azure AD via MSAL pour le réel, et une connexion de
démonstration réservée au développement. ⚠️ *Point non résolu* : la cible produit est
« e-mail + mot de passe, le backend décide s'il vérifie contre Azure ou en base locale ».
Techniquement, valider un mot de passe Azure AD depuis un serveur passe par le flux **ROPC**,
que Microsoft déconseille et qui **casse dès qu'il y a MFA ou accès conditionnel**. À
trancher avec l'administrateur Azure avant de construire le backend.

**Deux couches d'autorisation** : un moteur RBAC fin (`src/lib/rbac.ts`, consommé via
`useAccessControl`) et des garde-fous de rôle plus grossiers dans les règles métier.

**Un détail qui a déjà induit en erreur** : `DashboardPage.tsx:50` fait
`equipment = filterEquipment(allEquipment, users)`. **Tous** les compteurs et graphiques du
tableau de bord sont calculés sur cet ensemble déjà restreint au périmètre de la personne
connectée. Ne pas supposer qu'ils montrent le parc entier.

**Un backend optionnel** (`backend/server.mjs`, Node sans framework, port 8787) existe pour
les check-ins machine et l'administration des comptes. L'application fonctionne sans lui.

---

## 3. Le design system — « Tracker DS »

La marque est propriétaire : **jaune CAT `#FDC910`**, noirs et gris **chauds**, thème clair
uniquement.

Les valeurs vivent dans `index.css`, en **trois étages** :

1. **Primitif** — `--cat-*`, `--ref-*`, `--color-neutral-*` : les valeurs brutes.
   Interdits aux composants.
2. **Sémantique** — `--tk-*` : les **rôles**. C'est la **seule** couche que les composants
   et le pont Tailwind ont le droit de consommer.
3. **Composant** — `--color-sidebar-*`, `--color-login-*` : propres à un composant.

`tailwind.config.js` est le pont : les noms de classes (`bg-primary`, `text-on-surface`…)
n'ont pas changé, seule leur définition pointe désormais sur `--tk-*`.

**Quatre gardes tournent en CI**, réunis dans `npm run lint:ds` :

| Commande | Ce qu'elle empêche |
| --- | --- |
| `ds:check` | couleurs en dur, classes de palette Tailwind brutes, rayons hors échelle, contrôles natifs hors `src/components/ui/**` |
| `check:tokens` | tokens orphelins, cycles, violations d'étage |
| `check:cn-merge` | une classe maison non déclarée à `tailwind-merge`, qui ferait avaler les couleurs |
| `check:encoding` | le mojibake |

**Règle de gouvernance** : toute évolution de composant ou de token doit avoir son entrée
dans `DESIGN_SYSTEM_CHANGELOG.md`. Sans entrée, le changement « n'a pas eu lieu ».

Une galerie de toutes les primitives est servie en développement sur `#/dev/design-system`.

---

## 4. L'ADN mobile — le chantier en cours

`DESIGN_BRIEF.md` est le contrat de design mobile, arrêté le 25/07/2026. Ses **Interdits
absolus (§8) sont bloquants**. Les dix, en résumé :

1. Jaune en fond d'onglet, de carte ou de badge décoratif — **et la barre du bas compte
   comme un usage**, il n'en reste donc qu'un pour le contenu
2. Icône destructive rouge dans une rangée de liste
3. Infobulle native `title=` porteuse d'une information nécessaire
4. Bouton désactivé accompagné d'une phrase d'instruction
5. Plus de **deux graisses** par écran (400 + 500)
6. Carte avec bordure **et** ombre
7. Grille de stats avec carte orpheline pleine largeur
8. Formulaire de création incrusté dans une liste
9. **MAJUSCULES** hors codes techniques
10. Élément nouveau sans spécification

Plus : **rayons 2/4/8 uniquement** (l'échelle 10/14/16 du brief a été essayée puis
abandonnée le 26/07 — trop arrondie, l'identité voulue est « adouci mais qui se lit comme
un carré »), cibles tactiles 48 px, rouge/vert/ambre seulement quand ils portent un sens,
deux niveaux d'imbrication maximum.

**La bascule est progressive, écran par écran.** Un écran basculé rend avec un rendu
compact séparé, sélectionné en JS (`useMediaQuery(MEDIA.compact)`) — jamais par des
variantes responsives sur l'arbre existant. C'est la seule façon de garantir que les
classes de fenêtre medium et expanded restent **identiques au pixel**.

**Un seul écran est basculé à ce jour : l'Audit compact.** Il sert de patron :
`src/features/audit/components/AuditOverviewMobile.tsx`.

---

## 5. Le chantier Claude Design

### Pourquoi

Décider de la forme **hors du code** coûte beaucoup moins cher que d'itérer dans une page
React branchée sur des données réelles, des permissions et 39 captures de non-régression.
La bascule de l'Audit l'a montré : le design pur représentait environ un tiers du temps, le
reste étant l'intégration.

### Ce qui transfère, et ce qui ne transfère pas

C'est le point à comprendre avant d'espérer un gain :

| Ce qu'on décide en design | Coût pour le ramener dans le code |
| --- | --- |
| Une couleur, un rayon, une taille de texte | **quasi nul** — une ligne dans `index.css`, ça se propage |
| L'ordre et la composition d'un écran | **un écran = un chantier** |
| Un composant partagé | moyen, mais profite à tous les écrans d'un coup |

Autrement dit : **passer du temps sur la structure, pas sur les couleurs.** Les couleurs se
changent d'avis dix fois sans conséquence.

Un projet Claude Design ne produit **pas** de composants React. Il produit des pages HTML.
L'intégration reste à faire — elle est déplacée, pas supprimée.

### Le projet

**« Tracker — Neemba Togo »** sur claude.ai/design.
Deux autres projets existent et **ne servent à rien ici** : « Design System » (vidé) et
« Modernist » (kit générique fourni).

```
readme.md                      règles + palette, sous les yeux pendant qu'on dessine
PASSATION.md                   passation détaillée (copie : docs/passation-design-mobile.md)
screens/ui-actuelle.html       galerie des 15 écrans compacts actuels
screens/actuel/*.png           les captures, 393 px, à hauteur réelle
screens/login-*.html           actuel + piste A + piste B (retenue)
screens/dashboard-*.html       actuel + admin + utilisateur
screens/dashboard-analyse.md   analyse du code + arbitrages rendus
```

### La méthode, telle que convenue

1. **Tous les écrans se dessinent d'abord**, puis **une seule vague** d'implémentation
   React. C'est le plus économe : le coût dans l'éditeur, c'est de relire le projet à
   chaque session, pas d'écrire le code.
2. **Un écran à la fois.** Pas de chantiers parallèles.
3. **Chaque proposition est livrée avec la réplique de l'existant à côté.** Sans point de
   comparaison, on ne peut pas juger.
4. **Lire le code avant de proposer.** Chercher la réponse soi-même avant de poser la
   question.
5. **Chaque écran répond d'abord à trois questions** : à qui il sert, quelle décision on y
   prend, ce qu'on fait juste après. Sans réponse, on ne dessine pas.
6. **Ne consigner comme tranché que ce qui a été dit explicitement.**

### Où en sont les écrans

Hauteurs mesurées à 393 px, compte administrateur. Une fenêtre de téléphone fait environ
720 px utiles.

| Écran | État | Hauteur | Défilement |
| --- | --- | --- | --- |
| **Audit** | **implémenté en React** | 1 283 px | 1,8 |
| **Login** | piste B retenue | 852 px | 1 |
| **Dashboard** | admin + utilisateur dessinés | 2 513 px | 3,5 |
| Détail équipement | à faire — **le plus long** | 2 666 px | 3,7 |
| Rôles (RBAC) | à faire | 2 368 px | 3,3 |
| Emplacements | à faire | 2 142 px | 3,0 |
| Catalogue | à faire | 1 836 px | 2,6 |
| Finances | à faire | 1 766 px | 2,5 |
| Détail utilisateur | à faire | 1 574 px | 2,2 |
| Inventaire | à faire — **même moule que Utilisateurs** | 1 476 px | 2,0 |
| Utilisateurs | à faire — hérite du moule d'Inventaire | 1 436 px | 2,0 |
| Détail audit | à faire | 1 284 px | 1,8 |
| Rapports | à faire | 1 247 px | 1,7 |
| Approbations | **ne pas y toucher** — jugé déjà bon | 992 px | 1,4 |
| Paramètres | à faire | 866 px | 1,2 |

### Les décisions déjà prises

**Login.** Bandeau de marque noir chaud en haut, filet jaune 40 × 3 px à la place du logo
(qui n'existe pas encore), promesse « Pilotez vos actifs avec une expérience unifiée. »
sans nom de pays. **Aucun bouton Microsoft** : l'écran de production n'affiche qu'e-mail +
mot de passe, le backend décidera en coulisses. Les comptes de démonstration reprennent
leur format d'origine (rangée d'avatars, pastille d'initiale) — demandé explicitement, deux
objections signalées et écartées.

**Dashboard.** **Deux compositions seulement**, pilotées par `permissions.canManageInventory` :
administrateur/IT et utilisateur final. Le **manager n'a pas d'écran propre** — il est servi
par la donnée, via le bloc « à traiter ». Ce bloc **remonte en tête** : il existe déjà dans
le code mais il est placé après cinq cartes de chiffres. Les KPI passent dans **une seule
carte à séparateurs** (2×2 pour l'admin, 2+1 pour l'utilisateur). Les icônes restent
partout mais **en gris neutre**. L'anneau est gardé pour une proportion unique, les barres
remplacent l'anneau multi-parts — c'est lui qui imposait du rouge et du vert décoratifs.

---

## 6. Par quoi continuer

1. **Trancher les points ouverts du §8** — surtout la graisse forte et la police non figée,
   qui coûtent plus cher plus on attend.
2. **Dessiner les écrans restants**, dans l'ordre des hauteurs : détail équipement, puis
   RBAC, puis emplacements. Les deux listes (inventaire et utilisateurs) partagent le même
   moule : les traiter ensemble.
3. **Implémenter en une vague**, en suivant le patron de l'Audit.
4. **Ne pas attendre la fin du design pour la logique métier.** Deux problèmes de correction
   sont ouverts dans le circuit d'approbation (notés D20 et D21) et ne dépendent d'aucun
   choix visuel. Un choix de couleur se corrige tard ; une approbation qui passe à tort, non.

---

## 7. Les pièges qui ont déjà coûté du temps

**Cascade CSS.** Les classes du typescale vivent dans `index.css`, donc **après** les
utilitaires Tailwind. À spécificité égale, `.text-title-medium` (700) l'emporte sur
`.font-medium` (500) et la surcharge est **perdue en silence**. Utiliser les variantes
`-plain` (`.text-title-medium-plain`, `.text-headline-medium-plain`, `.text-label-large-plain`,
`.text-label-small-plain`, `.text-stat-value-mobile`). Mesuré au `getComputedStyle`, pas supposé.

**tailwind-merge.** Toute classe maison à préfixe utilitaire doit être déclarée dans
`src/lib/utils.ts`, sinon `cn()` la prend pour une couleur de texte et avale les vraies
couleurs. `check:cn-merge` le vérifie.

**Le seuil visuel n'est pas une preuve.** `qa:visual` tolère 0,05 % de pixels différents :
une dette de couleur est passée inaperçue deux semaines. Contrôler au pixel les captures
« identiques » qui contiennent un token modifié.

**Le volet Claude Design ne se met pas à jour tout seul.** `_ds_manifest.json` n'est pas
régénéré quand on ajoute des fichiers : les nouvelles cartes n'apparaissent pas alors que
les fichiers sont bien stockés. Il faut réécrire le manifeste à la main, et recharger en
vidant le cache.

**Ne pas éditer de fichier pendant un run Playwright** : le rechargement de Vite tue la
capture.

---

## 8. Décisions encore ouvertes

**Design**

- **Graisse forte : 500 ou 600 ?** Le brief retient 600 au niveau système, la spécification
  de l'écran Audit impose 500 — et c'est 500 qui est appliqué. Un seul point à basculer :
  `--tk-type-weight-strong-next`. **À trancher avant le deuxième écran**, sinon deux
  identités se figent.
- **Texte secondaire `#78746C` à 4,42:1** sur le fond de page : sous le seuil AA. `#726E66`
  donnerait 4,82:1 pour un écart imperceptible.
- **Muted `#A29D93` à 2,57:1** : inutilisable pour du texte. Les micro-labels sont portés
  par le secondaire dans les maquettes, mais ce n'est pas formalisé.
- **Nav active `#B8860B` à 3,09:1** : insuffisant pour un libellé de 11 px. `#8A6508`
  (5,06:1) est utilisé dans les maquettes.
- **Dashboard utilisateur** : garder ou retirer « Mes équipements par type » et
  « Garantie » ? Ils sont scopés à ses propres équipements, donc l'argument pour les retirer
  est faible.

**Technique**

- **La police n'est pas figée.** Inter est chargée depuis Google Fonts sans version : le
  rendu dérive tout seul. La figer invalidera les 39 captures de référence d'un coup — donc
  à faire en début de chantier, pas au milieu.
- **« Derniers événements » est-il filtré par rôle ?** L'administrateur voit les sessions
  des autres utilisateurs. Pour l'utilisateur final, à vérifier : si ce n'est pas filtré,
  c'est une fuite d'information.
- **Authentification Azure** : voir la réserve ROPC au §2.

---

## 9. État du dépôt

Branche **`feat/tracker-ds-namespace`**, dernier commit `dee1acd`.

**Environ 47 fichiers ne sont pas commités.** Ils portent le renommage Tracker DS, les
gardes de tokens, la bascule de l'Audit compact et les corrections de conformité. Ce n'est
pas du travail en friche : tout passe `lint:ds` et `build`. Mais **ne pas annuler des
modifications sans les lire** — en particulier les 9 lignes de `LoginPage.tsx`, qui sont des
corrections rendues obligatoires par `ds:check` (`text-slate-*` et `bg-white` y sont
interdits).

## 10. Commandes utiles

```bash
npm run dev              # serveur de développement, port 3000
npm run build            # build de production
npm run lint:ds          # LA commande de vérification : lint + 4 gardes
npm run qa:visual:auto   # non-régression visuelle, 39 captures
npm run qa:a11y:auto     # audit d'accessibilité
npm run backend:agent    # backend optionnel, port 8787
```

Avant de considérer une tâche terminée : `npm run lint:ds`, `npm run build`, et un essai
manuel de l'écran touché.
