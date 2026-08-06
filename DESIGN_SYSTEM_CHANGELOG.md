# Journal du Tracker DS

Toute évolution de la couche de tokens (`index.css`, `tailwind.config.js`) ou de
la librairie (`src/components/ui/**`) s'inscrit ici. Un changement de composant
absent de ce journal est, du point de vue du DS, un changement qui n'a pas eu
lieu (voir la définition de « terminé », `DESIGN_SYSTEM.md` §14.3).

**Format d'une entrée**

```
## [version] — AAAA-MM-JJ

### Ajouté / Modifié / Corrigé / Déprécié / Retiré
- `Composant` — ce qui change, et **pourquoi**. Impact sur le rendu au repos :
  aucun / re-baseline nécessaire (checkpoints concernés).
```

Trois règles :

- On écrit **pourquoi**, pas seulement quoi. « Ajout de `active:scale` » n'a
  aucune valeur six mois plus tard ; « le composant annonçait un état pressé
  qu'il n'implémentait pas » en a.
- L'**impact sur le rendu au repos** est toujours déclaré. C'est ce qui décide
  s'il faut re-baseliner les références visuelles.
- Une dépréciation annonce son **remplaçant** et sa date de retrait.

---

## [1.2.1] — 2026-07-26

### Corrigé

- **Échelle de rayons — retour au carré (Q-B5 tranchée).** `--tk-radius-control`,
  `--tk-radius-card` et `--tk-radius-sheet` portaient les valeurs 10 / 14 / 16 du brief.
  Appliquées à l'écran Audit, elles ont été jugées **trop arrondies pour la nature du
  projet** : l'identité voulue est « légèrement adouci, mais qui se lit encore comme un
  carré ». Les trois rôles pointent désormais sur l'échelle canonique — 4 / 8 / 8
  (`--tk-radius-md`, `--tk-radius-lg`). **Pourquoi garder les rôles** plutôt que revenir
  à `rounded-md`/`rounded-lg` aux appels : ils nomment une *intention* (contrôle, carte,
  feuille) que les crans ne nomment pas, et ils concentrent le réglage en un point — si
  l'arrondi doit rebouger, c'est trois lignes, pas une chasse dans les composants.
  `DESIGN_BRIEF.md` §3, §10 (Q-B5) et §11.1 corrigés : il n'y a plus deux échelles.
  Impact au repos : **écran Audit compact uniquement** (seul consommateur de ces rôles) —
  cartes 14 → 8, contrôles 10 → 4, FAB et feuille 16 → 8. Captures régénérées.

---

## [1.2.0] — 2026-07-25

**Première bascule ADN mobile : l'écran Audit en compact (< 600 px).** Les tokens
cibles du brief cessent d'être dormants ; le pont Tailwind est alimenté pour la
première fois (`DESIGN_BRIEF.md` §9.2). Medium et expanded ne sont **pas** touchés :
la vue compacte est un rendu séparé, sélectionné en JS (`MEDIA.compact`), et non un
jeu de variantes responsives sur l'arbre historique — c'est la seule façon d'avoir
la garantie que les autres classes de fenêtre restent identiques au pixel.

### Ajouté

- **Pont Tailwind — namespace `adn-*`** (`tailwind.config.js`). Couleurs
  (`text-adn-text`, `-secondary`, `-muted`, `bg-adn-surface-muted`, `border-adn-line`,
  `text-adn-danger`, `bg-adn-warning-light`, `text-adn-warning-strong`,
  `text-adn-success`, `bg-adn-pressed`, `text-adn-on-brand`) et rayons
  (`rounded-adn-control`, `rounded-adn-card`, `rounded-adn-sheet`), plus le
  cran d'espacement `fab` (52 px). **Pourquoi un namespace** plutôt que de repointer
  `rounded-card` & co. : les rôles canoniques servent tous les écrans non basculés ;
  les repointer aurait rhabillé l'application d'un coup. Ces classes disparaissent en
  fin de bascule. Impact au repos : **aucun** (entrées purement additives).
- **`index.css` — variantes typographiques `-plain`** : `.text-headline-medium-plain`,
  `.text-title-medium-plain`, `.text-label-large-plain`, `.text-label-small-plain`,
  `.text-stat-value-mobile`. Identiques à leur cran d'origine **sauf la graisse**,
  portée par le nouveau rôle `--tk-type-weight-strong-next` (500) — l'ADN n'admet que
  deux graisses par écran (interdit §8.5) quand l'échelle canonique panache 500/600/700.
  **Pourquoi des classes et pas un `font-medium` à l'appel** : le typescale vit dans
  `index.css`, donc APRÈS les utilitaires Tailwind dans la cascade ; à spécificité
  égale `.text-title-medium` (700) gagne et la surcharge est perdue en silence. Mesuré
  au `getComputedStyle`, pas supposé. Le bloc est volontairement placé après
  `.page-title`/`.section-title` pour gagner aussi contre elles.
- `useHideOnScrollDown` (`src/hooks/`) — masque un élément flottant au scroll
  descendant (brief §5). Remonte au premier ancêtre réellement scrollable : le
  contenu des pages vit dans le conteneur `overflow-y-auto` d'`AppLayout`, pas dans
  `window`, et un écouteur sur la fenêtre ne se déclencherait jamais.

### Modifié

- `PageTabs` — nouvelle prop `appearance` (`brand` par défaut, `neutral`). En
  `neutral` : segmented control de l'ADN (fond neutre, segment actif **blanc**,
  segments à largeur égale, rayon de carte avec un segment au rayon de contrôle). Le
  jaune n'est plus jamais un fond d'onglet (interdits §8.1, décision §4 du brief).
  Impact au repos : **aucun** hors `appearance="neutral"` — la valeur par défaut rend
  exactement les mêmes classes qu'avant.
- `SearchFilterBar` — props `filterCount` et `filterButtonClassName`. Le compteur de
  filtres actifs s'affiche **en chiffres** sur le bouton filtre (brief §4 : « un
  bouton filtre unique avec compteur »), pas en pastille muette. Impact au repos :
  **aucun** tant que `filterCount` vaut 0 (défaut) — largeur de bouton, réservation
  d'espace et `aria-label` inchangés.
- `EmptyState` / `BottomSheet` — prop `titleClassName`. Leurs titres codaient en dur
  un cran à 700 : sans crochet, un écran ne pouvait pas tenir sa contrainte de deux
  graisses. Impact au repos : **aucun** (prop absente = rendu identique).
- `Chip` — la croix de suppression reçoit `.touch-target`. Sa boîte mesurait ~28 px,
  sous le plancher de 48 px (`DESIGN_SYSTEM.md` §12). Impact au repos : **aucun** —
  le pseudo-élément ne peint rien et n'agit que sur pointeur grossier.
- `AppLayout` — la barre d'application ne rend plus sur les vues passées à l'ADN
  (liste `adnMobileViews`, aujourd'hui `audit`). Ces vues portent elles-mêmes
  l'en-tête « titre 22 + sous-titre contextuel » (§5) ; la barre n'aurait affiché
  qu'un **doublon du titre**, la navigation étant déjà assurée par la barre du bas.
  La page reprend à son compte le dégagement d'encoche (`env(safe-area-inset-top)`).
  Impact au repos : **compact `/audit` uniquement**.
- `src/lib/utils.ts` — `cn()` connaît désormais l'échelle de rayons (`theme.radius`)
  et le cran `fab` (`theme.spacing`) de l'ADN, plus les cinq classes `-plain`. Sans
  ça, `rounded-adn-card` ne chasserait pas le `rounded-xl` d'une primitive (les deux
  classes émises, l'ordre du CSS tranche) et les classes `-plain` seraient prises
  pour des couleurs de texte, avalant les couleurs (`AUDIT_DESIGN_SYSTEM.md` §11.4).
  `scripts/check-cn-merge.mjs` gagne une section 1d qui verrouille ces deux points.

### Divergence ouverte

- **Q-B6 — graisse forte : 500 (écran) contre 600 (système).** Le brief §2 retient
  600 ; la spec de l'écran Audit du 2026-07-25 impose 500 pour tous les crans forts
  (titre 22, valeurs 20, nom de carte 16, action 14). L'écran respecte l'interdit
  §8.5 dans les deux cas (400 + une seule graisse forte). Choix : suivre la spec
  d'écran. Un seul point à basculer si l'arbitrage tranche pour 600 :
  `--tk-type-weight-strong-next`.

---

## [1.1.0] — 2026-07-25

Adoption du contrat de design mobile **ADN mobile v1** (`DESIGN_BRIEF.md`). La
couche de tokens accueille les valeurs cibles ; **aucun composant n'est touché**
et **aucun écran n'a basculé** — la bascule est progressive, écran par écran
(procédure `DESIGN_BRIEF.md` §9).

### Ajouté

- **Couche sémantique — 26 tokens cibles** (bloc « ADN MOBILE v1 » d'`index.css`,
  171 → 197 rôles). Deux conventions : `<rôle>-next` quand le rôle canonique
  existe et est consommé (le suffixe porte la valeur cible), `<rôle>` nu quand le
  rôle est nouveau. Pourquoi cette gymnastique plutôt que de repointer directement
  les rôles canoniques : `--tk-color-danger`, `--tk-color-success`,
  `--tk-color-text-*` etc. sont consommés par les écrans via le pont Tailwind — les
  repointer aurait rhabillé toute l'application d'un coup, ce que le brief exclut
  explicitement. Couverture : neutres chauds affinés (§1), sémantiques
  `#B3261E`/`#1B7F4D`/ambre (§1), graisse et tracking de la typographie mobile (§2),
  rayons 10/14/16 (§3), espacements 20/12/16/24 (§3), hauteur de contrôle 48 et FAB
  52 (§4/§5), or de navigation active (§5), fond de retour tactile (§6).
  Impact sur le rendu au repos : **aucun** — aucun de ces tokens n'est référencé
  hors de sa déclaration (vérifié par balayage), baselines inchangées.
- `--tk-size-touch-target` (48 px) — **seul token cible consommé** : l'utilitaire
  `.touch-target` portait la valeur en dur. Valeur identique, donc zéro diff
  visuel ; le plancher de cible tactile devient réglable comme le reste du tier 2.

### Modifié

- `scripts/check-ds-compliance.mjs` — documentation seule, aucun changement de
  règle. Les gardes `title=` (avertissement) et couleur hex (bloquante, périmètre
  `src/**`) sont rattachées aux « Interdits absolus » `DESIGN_BRIEF.md` §8, et
  l'en-tête déclare que la couverture est **partielle** : les interdits de
  structure ne sont pas décidables lexicalement et se vérifient en revue. La seule
  exception hex assumée — `<meta name="theme-color">` d'`index.html`, qu'aucune
  variable CSS ne peut porter — est désormais écrite.

### Déprécié

- Aucun. Les rôles canoniques divergents (`--tk-color-danger`, `--tk-radius-*`,
  `--tk-space-page`…) restent la source **tant que des écrans les consomment** ;
  ils ne seront retirés qu'à la fin de bascule, quand les valeurs `-next` seront
  reportées dans les rôles canoniques.

---

## [1.0.1] — 2026-07-25

Aucun changement de la librairie ni de la couche de tokens. Entrée conservée
ici parce qu'elle **retire** un usage de `Tooltip` que le DS avait entériné.

### Retiré

- `Tooltip` sur les avatars de comptes démo (`LoginPage`) — l'infobulle se
  positionnait sur le libellé de la section et répétait une information que le
  badge-lettre codait déjà (« Alice SuperAdmin · SuperAdmin »). Remplacée par
  la donnée **écrite en clair** dans une liste de rangées de 48 px (avatar +
  prénom + rôle). Rappel §11.3 : une infobulle complète une information déjà
  visible, elle ne la porte pas. Quand l'infobulle est le seul endroit où
  l'identité est lisible, c'est la mise en page qu'il faut corriger.
  Impact sur le rendu au repos : `LoginPage` uniquement, re-baseline du
  checkpoint `login` nécessaire (compact / medium / expanded).

---

## [1.0.0] — 2026-07-25 — Tracker DS v1

Première version gouvernée. Aucun changement de style : l'existant est codifié,
et les états **manquants** sont comblés. Le rendu au repos est inchangé sur
l'ensemble de la librairie — tous les ajouts se déclenchent au clavier, au
pointeur, ou sur une prop qu'aucun appelant vivant n'active.

### Corrigé — régressions bloquantes

- `Modal`, `SideSheet` — **ne se fermaient plus**. Le commit `283dd58` avait
  inversé la condition de sortie (`else if (visible)` → `else if (!visible)`) :
  à la fermeture d'une boîte montée en permanence (`isOpen` passe à `false`
  alors que `visible` vaut `true`), aucune branche ne s'exécutait, `closing`
  restait faux, l'animation de sortie n'était jamais amorcée — et
  `document.body.style.overflow` restait bloqué à `hidden`. Touchait tous les
  appelants qui gardent la boîte montée : `LocationsPage`, `AddBudgetModal`,
  `AddExpenseModal`, `FinanceManagementPage`, `AddModelPage`,
  `AddCategoryPage`, et `ConfirmationDialog` — donc toutes les confirmations de
  l'application. `BottomSheet`, épargné par ce commit, a servi de référence.
  **Découvert par la galerie** le jour de sa mise en service : le défaut est
  invisible en revue de code et absent des références visuelles, qui ne
  photographient que des boîtes fermées.
  *Impact rendu au repos : aucun.*

### Ajouté — états manquants (`DESIGN_SYSTEM.md` §10.4)

- `Toggle` — **focus-visible**. L'input est `sr-only` : sans relais
  `peer-focus-visible` sur la piste, l'interrupteur n'avait aucun indicateur de
  focus. Invisible au clavier.
- `FileDropzone` — **focus-visible et accès clavier**. `div` cliquable dont
  l'`<input type="file">` est `hidden`, donc non focalisable : la zone était
  inatteignable au clavier. Ajout de `role="button"`, `tabIndex`,
  Entrée/Espace, anneau de focus.
- `FileDropzone` — **état de chargement durci**. Le clic était gardé, pas le
  **dépôt** : un fichier pouvait être déposé pendant un traitement. Ajout de
  `aria-busy` et neutralisation du dépôt.
- `FloatingActionButton` — **disabled**. Le composant acceptait la prop sans
  aucun rendu associé : bouton mort d'aspect actif. `ListActionFab` la
  transmettait déjà.
- `Pagination` — **focus-visible** (anneau du DS au lieu de celui du
  navigateur) et **pressed**.
- `MovementTimeline` — **focus-visible** et **pressed** sur sa pagination
  interne.
- `SearchFilterBar` — **focus-visible**. Le champ porte `focus:outline-none` ;
  le focus n'était signalé que par une élévation, indicateur insuffisant.
  L'anneau est porté par le conteneur et ciblé `has-[input:focus-visible]` pour
  ne pas doubler celui des boutons de la barre.
- `Card` — **pressed**. Le JSDoc annonçait « supports focus, hover, and pressed
  states » ; le pressed n'existait pas. Aligné sur `MetricCard` / `EntityRow`.
- `Chip` — **pressed**.

*Impact rendu au repos : aucun (10 états, 8 composants).*

### Corrigé — états

- `Chip` — le survol du chip **sélectionné** (`hover:bg-primary/90`)
  s'appliquait même désactivé. Conditionné comme celui du chip au repos.
  *Impact rendu au repos : aucun.*

### Ajouté — gouvernance

- **`npm run ds:check`** remplace `md3:check` (`scripts/check-ds-compliance.mjs`).
  Périmètre étendu de `src/components/**` à **`src/**`** pour les règles de
  couleur : `features/` échappait au contrôle, et portait les six seuls écarts
  du dépôt. Nouvelle règle bloquante : **hex en dur sans liste d'exception**.
  Nouvel avertissement : `title=` porteur d'information seule.
  `lint:md3` devient **`lint:ds`**.
- **Galerie `#/dev/design-system`** — vitrine vivante des 39 primitives,
  alimentée par les composants réels, montée uniquement en développement.
  Le `import()` est placé dans la condition `import.meta.env.DEV` : un `lazy()`
  au niveau du module faisait émettre un chunk de 37 ko en production.
- **`DESIGN_SYSTEM.md` §10 à §14** — matrice d'états, règles de choix entre
  composants proches, patterns officiels, conventions de contenu, définition de
  « terminé ».
- **Ce journal.**

### Modifié — conformité (extension du périmètre de `ds:check`)

Six violations, toutes dans `LoginPage.tsx`, toutes corrigées **sans dérive de
rendu** :

- 3 × `text-slate-400` / `text-slate-200` → tokens de composant
  `--color-login-hero-text` et `--color-login-hero-text-muted`. Valeurs reprises
  **en oklch** et non en hex : la conversion vers sRGB de Tailwind v4 ne repasse
  pas exactement par `#E2E8F0` / `#94A3B8`.
- 3 × `className="bg-white"` sur `InputField` → **supprimé**. La variante
  `filled` applique déjà `bg-surface`, dont le token vaut `#ffffff` : la
  surcharge était morte.

L'entrée `HEX_ALLOWLIST` de `LoginPage` est retirée : la page n'a plus d'hex
depuis la tokenisation du constat #18.
*Impact rendu au repos : aucun.*

### Connu — non traité en v1

Ces points sont documentés, pas corrigés : ils touchent des chaînes affichées ou
la structure du DOM, donc les références visuelles.

- **« Retour matériel »** (`DashboardPage.tsx:355,378`) — groupe nominal là où
  la règle impose un verbe + objet (`DESIGN_SYSTEM.md` §13.2). Changer la chaîne
  change la largeur du bouton.
- **`DemoBadge`** — seul avertissement `title=` restant : son infobulle est une
  **définition**, pas une redondance. La convertir en `<Tooltip>` ajouterait un
  conteneur autour de chaque badge.
- **`EXAMPLE_PREFIX`** — le glossaire déclare `'Ex :'` (espacement français) ;
  15 placeholders écrivent `Ex:`.
- **Glossaire sous-consommé** — 9 entrées sur 32 le sont réellement, toutes via
  `destinations.ts`. Les blocs « Actions » et « Messages » sont réécrits
  littéralement dans les pages ; les valeurs coïncident, le risque est la dérive
  future.
- **`finance` et `rbac`** — libellés écrits en dur dans `destinations.ts` au
  lieu de passer par le glossaire.
- **`ConfirmationDialog`** — indicateur de chargement local plutôt que la prop
  `loading` de `Button`.
