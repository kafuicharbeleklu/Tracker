# Tracker DS — espace de noms et couche de tokens

> Système de design propre à l'équipe, extrait de l'UI de **Neemba Tracker**.
> Ce document fait autorité sur le **nommage** et sur la **règle de consommation**
> des tokens. Les valeurs, contrastes et règles chromatiques restent décrits par
> [`docs/DESIGN_TOKENS_SPEC.md`](docs/DESIGN_TOKENS_SPEC.md) et
> [`docs/AUDIT_DESIGN_SYSTEM.md`](docs/AUDIT_DESIGN_SYSTEM.md).

**État au 2026-07-25** — la couche sémantique porte le préfixe `--tk-`.
L'ancien vocabulaire Material Design 3 (`--md-sys-*`) n'est plus une source :
il survit en **alias `@deprecated`** pour permettre une migration progressive.

| | Nombre |
| --- | --- |
| Tokens primitifs (tier 1) | 20 |
| Tokens sémantiques `--tk-*` (tier 2) | 171 |
| Tokens de composant (tier 3) | 9 |
| Alias `@deprecated` | 175 |

Sur les 171 tokens sémantiques, **163 sont d'anciens tokens renommés** et 8 sont
nouveaux : 4 crans d'espacement (§2.7) et 4 rôles créés pour solder la
consommation de primitifs par les composants (§2.8). Les 175 alias se
décomposent en 171 renvois vers un `--tk-*` (§2.2 à §2.6 — deux anciens noms
peuvent viser le même rôle) et 4 legacy sans contrepartie (§2.9).

---

## 1. Convention de nommage

### 1.1 Les trois tiers

Un token appartient à exactement un tier. La dépendance ne va que dans un sens :
**composant → sémantique → primitif**.

| Tier | Préfixe | Rôle | Qui a le droit de le lire |
| --- | --- | --- | --- |
| **1 — Primitif** | `--cat-*`, `--ref-*`, `--color-neutral-*` | Valeur brute de la marque. Aucune signification d'usage. | `index.css` seulement |
| **2 — Sémantique** | `--tk-*` | Le **rôle** : ce que la valeur veut dire. | Composants, pont Tailwind |
| **3 — Composant** | `--color-sidebar-*`, `--color-login-*` | Portée d'un seul composant. | Le composant propriétaire |

### 1.2 Grammaire du tier 2

```
--tk-<catégorie>-<rôle>[-<variante>]
```

| Catégorie | Exemples |
| --- | --- |
| `color` | `--tk-color-primary`, `--tk-color-on-surface-variant`, `--tk-color-warning-strong` |
| `radius` | `--tk-radius-none`, `--tk-radius-xs` … `--tk-radius-xl`, `--tk-radius-full` |
| `elevation` | `--tk-elevation-0` … `--tk-elevation-5` |
| `motion` | `--tk-motion-duration-short2`, `--tk-motion-easing-emphasized` |
| `state` | `--tk-state-hover-opacity`, `--tk-state-focus-opacity` |
| `type` | `--tk-type-title-large-size`, `--tk-type-font-brand` |
| `space` | `--tk-space-page`, `--tk-space-card-compact` |

Le tier 2 n'a **pas** de marqueur de tier dans son nom : c'est la couche publique,
donc la couche par défaut. Seuls les tiers 1 et 3 sont marqués.

### 1.3 Direction des alias

Les nouveaux noms sont la **source** (ils portent la valeur littérale ou pointent
vers un primitif) ; les anciens noms sont des **feuilles** :

```css
--tk-color-primary: var(--cat-yellow);          /* source */
--md-sys-color-primary: var(--tk-color-primary); /* @deprecated 2026-07-25 */
```

⚠️ **Un token `--tk-*` ne doit jamais pointer vers un alias.** Une propriété
personnalisée qui boucle est *invalide en silence* : elle ne « plante » pas, elle
cesse simplement de rendre une couleur. La garde
`scripts/check-design-tokens.mjs` échoue sur ce cas et sur tout cycle.

---

## 2. Table de correspondance ancien → nouveau

### 2.1 Règles de préfixe

| Ancien préfixe | Nouveau préfixe |
| --- | --- |
| `--md-sys-color-` | `--tk-color-` |
| `--md-sys-elevation-` | `--tk-elevation-` |
| `--md-sys-motion-` | `--tk-motion-` |
| `--md-sys-state-` | `--tk-state-` |
| `--md-sys-typescale-` | `--tk-type-` |
| `--md-sys-shape-` | `--tk-radius-` (crans renommés, cf. §2.4) |

### 2.2 Couleur — rôles (35)

| Ancien nom | Nouveau nom (source) |
| --- | --- |
| `--md-sys-color-background` | `--tk-color-background` |
| `--md-sys-color-error` | `--tk-color-error` |
| `--md-sys-color-error-container` | `--tk-color-error-container` |
| `--md-sys-color-inverse-on-surface` | `--tk-color-inverse-on-surface` |
| `--md-sys-color-inverse-primary` | `--tk-color-inverse-primary` |
| `--md-sys-color-inverse-surface` | `--tk-color-inverse-surface` |
| `--md-sys-color-on-background` | `--tk-color-on-background` |
| `--md-sys-color-on-error` | `--tk-color-on-error` |
| `--md-sys-color-on-error-container` | `--tk-color-on-error-container` |
| `--md-sys-color-on-primary` | `--tk-color-on-primary` |
| `--md-sys-color-on-primary-container` | `--tk-color-on-primary-container` |
| `--md-sys-color-on-secondary` | `--tk-color-on-secondary` |
| `--md-sys-color-on-secondary-container` | `--tk-color-on-secondary-container` |
| `--md-sys-color-on-surface` | `--tk-color-on-surface` |
| `--md-sys-color-on-surface-variant` | `--tk-color-on-surface-variant` |
| `--md-sys-color-on-tertiary` | `--tk-color-on-tertiary` |
| `--md-sys-color-on-tertiary-container` | `--tk-color-on-tertiary-container` |
| `--md-sys-color-outline` | `--tk-color-outline` |
| `--md-sys-color-outline-variant` | `--tk-color-outline-variant` |
| `--md-sys-color-primary` | `--tk-color-primary` |
| `--md-sys-color-primary-container` | `--tk-color-primary-container` |
| `--md-sys-color-scrim` | `--tk-color-scrim` |
| `--md-sys-color-secondary` | `--tk-color-secondary` |
| `--md-sys-color-secondary-container` | `--tk-color-secondary-container` |
| `--md-sys-color-surface` | `--tk-color-surface` |
| `--md-sys-color-surface-bright` | `--tk-color-surface-bright` |
| `--md-sys-color-surface-container` | `--tk-color-surface-container` |
| `--md-sys-color-surface-container-high` | `--tk-color-surface-container-high` |
| `--md-sys-color-surface-container-highest` | `--tk-color-surface-container-highest` |
| `--md-sys-color-surface-container-low` | `--tk-color-surface-container-low` |
| `--md-sys-color-surface-container-lowest` | `--tk-color-surface-container-lowest` |
| `--md-sys-color-surface-dim` | `--tk-color-surface-dim` |
| `--md-sys-color-surface-variant` | `--tk-color-surface-variant` |
| `--md-sys-color-tertiary` | `--tk-color-tertiary` |
| `--md-sys-color-tertiary-container` | `--tk-color-tertiary-container` |

### 2.3 Couleur — rôles de marque CAT (27)

Ces tokens vivaient sous le préfixe générique `--color-*`, où rien ne les
distinguait des primitifs (`--color-neutral-*`). Ils rejoignent le tier 2 ;
ce qui reste sous `--color-*` est désormais, par construction, primitif ou
tier 3.

| Ancien nom | Nouveau nom (source) |
| --- | --- |
| `--color-app-bg` | `--tk-color-app-bg` |
| `--color-border-default` | `--tk-color-border-default` |
| `--color-border-strong` | `--tk-color-border-strong` |
| `--color-brand` | `--tk-color-brand` |
| `--color-brand-dark` | `--tk-color-brand-dark` |
| `--color-brand-hover` | `--tk-color-brand-hover` |
| `--color-brand-text` | `--tk-color-brand-text` |
| `--color-danger` | `--tk-color-danger` |
| `--color-danger-light` | `--tk-color-danger-light` |
| `--color-danger-strong` | `--tk-color-danger-strong` |
| `--color-focus-ring` | `--tk-color-focus-ring` |
| `--color-info` | `--tk-color-info` |
| `--color-info-light` | `--tk-color-info-light` |
| `--color-info-strong` | `--tk-color-info-strong` |
| `--color-primary-dark` | `--tk-color-brand-dark` |
| `--color-primary-default` | `--tk-color-brand` |
| `--color-primary-hover` | `--tk-color-primary-hover` |
| `--color-success` | `--tk-color-success` |
| `--color-success-light` | `--tk-color-success-light` |
| `--color-success-strong` | `--tk-color-success-strong` |
| `--color-surface-muted` | `--tk-color-surface-muted` |
| `--color-text-muted` | `--tk-color-text-muted` |
| `--color-text-primary` | `--tk-color-text-primary` |
| `--color-text-secondary` | `--tk-color-text-secondary` |
| `--color-warning` | `--tk-color-warning` |
| `--color-warning-light` | `--tk-color-warning-light` |
| `--color-warning-strong` | `--tk-color-warning-strong` |

### 2.4 Forme (13)

La chaîne à deux niveaux `--md-sys-shape-* → --radius-*` est **aplatie** : les
littéraux vivent dans `--tk-radius-*`, et les deux anciennes familles sont des
alias. Les crans changent de nom mais **pas de valeur** (2 / 4 / 4 / 8 / 8 px).

| Ancien nom | Nouveau nom (source) |
| --- | --- |
| `--md-sys-shape-extra-large` | `--tk-radius-xl` |
| `--md-sys-shape-extra-small` | `--tk-radius-xs` |
| `--md-sys-shape-full` | `--tk-radius-full` |
| `--md-sys-shape-large` | `--tk-radius-lg` |
| `--md-sys-shape-medium` | `--tk-radius-md` |
| `--md-sys-shape-none` | `--tk-radius-none` |
| `--md-sys-shape-small` | `--tk-radius-sm` |
| `--radius-2xl` | `--tk-radius-xl` |
| `--radius-full` | `--tk-radius-full` |
| `--radius-lg` | `--tk-radius-md` |
| `--radius-md` | `--tk-radius-sm` |
| `--radius-sm` | `--tk-radius-xs` |
| `--radius-xl` | `--tk-radius-lg` |

> ⚠️ `--radius-sm`…`--radius-2xl` appartiennent au **namespace de thème de
> Tailwind v4**. En les déclarant, `index.css` surcharge ce que produisent
> `rounded-2xl` et consorts. Ces alias-là ne sont donc **pas** supprimables sans
> changer le rendu : les retirer ferait resurgir les valeurs par défaut de
> Tailwind (`--radius-2xl: 1rem` au lieu de 8 px). Même remarque pour
> `--text-*`.

### 2.5 Élévation (6), mouvement (16), couches d'état (3)

Renommage de préfixe pur, sans changement de cran ni de valeur.

| Ancien nom | Nouveau nom (source) |
| --- | --- |
| `--md-sys-elevation-0` | `--tk-elevation-0` |
| `--md-sys-elevation-1` | `--tk-elevation-1` |
| `--md-sys-elevation-2` | `--tk-elevation-2` |
| `--md-sys-elevation-3` | `--tk-elevation-3` |
| `--md-sys-elevation-4` | `--tk-elevation-4` |
| `--md-sys-elevation-5` | `--tk-elevation-5` |
| `--md-sys-state-focus-opacity` | `--tk-state-focus-opacity` |
| `--md-sys-state-hover-opacity` | `--tk-state-hover-opacity` |
| `--md-sys-state-pressed-opacity` | `--tk-state-pressed-opacity` |

Mouvement : `--md-sys-motion-duration-{short1…long2}` →
`--tk-motion-duration-{…}` et `--md-sys-motion-easing-{…}` →
`--tk-motion-easing-{…}` (16 tokens, correspondance terme à terme).

### 2.6 Typographie (71)

68 tokens suivent la règle de préfixe
`--md-sys-typescale-<rôle>-<propriété>` → `--tk-type-<rôle>-<propriété>`
(ex. `--md-sys-typescale-title-large-size` → `--tk-type-title-large-size`).

Trois crans hérités, sans équivalent de rôle, ont été renommés d'après leur
consommateur réel :

| Ancien nom | Nouveau nom (source) |
| --- | --- |
| `--text-body` | `--tk-type-base-size` |
| `--text-title-1` | `--tk-type-page-title-size` |
| `--text-title-3` | `--tk-type-section-title-size` |

### 2.7 Espacement (nouveau)

Les crans d'espacement nommés n'étaient que des littéraux dans
`tailwind.config.js`. Ils deviennent des tokens, à valeur inchangée :

| Token | Valeur | Classes |
| --- | --- | --- |
| `--tk-space-page` | `1.5rem` | `p-page`, `px-page`, `gap-page`… |
| `--tk-space-page-sm` | `1rem` | `p-page-sm`… |
| `--tk-space-card` | `1.5rem` | `p-card`… |
| `--tk-space-card-compact` | `1rem` | `p-card-compact`… |

### 2.8 Rôles ajoutés

Créés pour supprimer les dernières consommations de primitifs par des composants
(§4). Valeurs identiques à ce qu'elles remplacent.

| Token | Valeur | Remplace | Classe |
| --- | --- | --- | --- |
| `--tk-color-on-nav-surface` | `#ffffff` | `text-white` sur nav sombre | `text-on-nav-surface` |
| `--tk-color-on-nav-surface-variant` | `var(--color-neutral-400)` | `text-[var(--color-neutral-400)]` | `text-on-nav-surface-variant` |
| `--tk-color-neutral-fill` | `var(--color-anthracite)` | `bg-anthracite` | `bg-neutral-fill` |
| `--tk-color-neutral-fill-hover` | `var(--color-anthracite-strong)` | `bg-anthracite-strong` | `bg-neutral-fill-hover` |

### 2.9 Legacy sans consommateur

Ces quatre tokens n'ont **aucun consommateur** et **aucune contrepartie
`--tk-*`** : on n'importe pas du code mort dans un espace neuf, et les supprimer
sortait du périmètre. Ils restent tels quels dans le bloc d'alias.

| Token | Valeur conservée |
| --- | --- |
| `--color-border-subtle` | `var(--color-neutral-100)` |
| `--color-primary-light` | `#fff4b8` |
| `--text-title-2` | `1.375rem` |
| `--text-caption` | `0.75rem` |

`--color-primary-default` et `--color-primary-dark` sont eux aussi sans
consommateur, mais comme ils dupliquaient un rôle existant ils figurent en §2.3,
pointés sur `--tk-color-brand` / `--tk-color-brand-dark`.

---

## 3. Le pont Tailwind

`tailwind.config.js` ne pointe **que** sur `--tk-*`. En revanche les **noms de
classes utilitaires sont conservés** : `bg-primary`, `text-on-surface`,
`rounded-xl`, `shadow-elevation-2`, `duration-short4` gardent leur nom, seule
leur définition a basculé.

**Pourquoi.** Ces classes sont déjà le vocabulaire de l'application (des milliers
d'occurrences) ; les renommer aurait produit un diff massif pour zéro gain
fonctionnel, et aurait cassé les références visuelles sans rien clarifier. Le
nommage `--tk-*` a de la valeur là où il désambiguïse (les *tokens*, qui étaient
mélangés entre trois familles de préfixes) ; il n'en a pas au niveau des classes,
déjà cohérentes.

Deux entrées du pont ont malgré tout changé de nom, parce qu'elles nommaient un
**primitif** au lieu d'un rôle : `anthracite`/`anthracite-strong` →
`neutral-fill`/`neutral-fill-hover` (1 call site).

Exception documentée : `brand.50/100/200` pointe encore sur `--ref-brand-*`
(tier 1). Cette échelle de référence n'a **aucun call site** aujourd'hui ; le
premier usage devra passer par un rôle.

---

## 4. Règle : les composants ne consomment QUE la couche sémantique

> Un composant lit `--tk-*` (ou un utilitaire Tailwind qui en dérive), **jamais**
> un primitif, **jamais** un alias `@deprecated`.

**Pourquoi c'est le prérequis du mode sombre.** Un thème sombre se fabrique en
rebranchant le **tier 2** : `--tk-color-surface` passe du blanc à l'anthracite,
`--tk-color-on-surface` fait le chemin inverse, et tout ce qui consomme les rôles
suit automatiquement. Un composant qui écrit `text-[var(--color-neutral-400)]`
court-circuite ce point de bascule : il resterait gris clair sur fond sombre.
Chaque primitif consommé directement est donc une exception à traiter à la main
le jour du thème — c'est-à-dire un bug en attente.

Cette règle est **exécutable** : `npm run check:tokens`
(`scripts/check-design-tokens.mjs`, intégré à `npm run lint:md3`) échoue sur
tout composant qui lit un primitif ou un alias, ainsi que sur les orphelins et
les cycles.

**État actuel** — `src/components/ui/` : 0 écart.
Dette résiduelle, listée dans la garde et destinée à ne faire que décroître :

| Fichier | Token | Pourquoi pas encore migré |
| --- | --- | --- |
| `src/components/layout/NavigationBar.tsx` | `--color-neutral-500` | Icône de destination inactive de la barre du bas (`#79736B`) : aucun rôle sémantique n'a cette valeur, il faut en créer un. |
| `src/features/auth/pages/LoginPage.tsx` | `--color-neutral-50`, `--color-neutral-100` | Fonds locaux des panneaux de connexion. |

---

## 5. Doublons connus (à consolider)

Le renommage a été **mécanique** : la forme du graphe de dépendances est
inchangée, donc les synonymes préexistants ont été reportés tels quels plutôt que
fusionnés — fusionner aurait mélangé un renommage vérifiable avec un changement
de sémantique. À traiter dans un lot dédié :

| Rôle | Synonymes `--tk-*` | Valeur |
| --- | --- | --- |
| Texte principal | `--tk-color-text-primary`, `--tk-color-on-surface`, `--tk-color-on-background` | `#1C1917` |
| Texte atténué | `--tk-color-text-muted`, `--tk-color-on-surface-variant` | `#6E675F` |
| Contour discret | `--tk-color-border-default`, `--tk-color-outline-variant` | `#E8E4DF` |
| Contour de contrôle | `--tk-color-border-strong`, `--tk-color-outline` | `#8E877E` |
| Fond d'application | `--tk-color-app-bg`, `--tk-color-background` | `#FAF9F7` |
| Accent primaire | `--tk-color-brand`, `--tk-color-primary`, `--tk-color-inverse-primary` | `#FDC910` |
| Succès | `--tk-color-success`, `--tk-color-tertiary` | `#047857` |
| Erreur | `--tk-color-danger`, `--tk-color-error` | `#DC2626` |
| Taille de base | `--tk-type-base-size`, `--tk-type-body-medium-size` | `0.875rem` / `14px` |

---

## 6. Classes `@deprecated` purgées (§8)

Retirées de `tailwind.config.js` le 2026-07-25.

| Classe | Usages avant purge | Traitement |
| --- | --- | --- |
| `bg-surface-subtle` | 0 | supprimée |
| `bg-surface-background` | 5 | migrées vers `bg-surface` (même token), puis supprimée |
| `*-dark`, `*-dark-light` | 1 (`fill-dark`) | migré vers `fill-on-surface`, puis supprimée |
| `rounded-pill` | 0 | supprimée |
| `duration-micro` | 0 | supprimée |
| `duration-macro` | 9 | migrées vers `duration-medium2`, puis supprimée |

> **Piège rencontré.** Une clé de *couleur* engendre **tous** les utilitaires de
> couleur, pas seulement `bg-`/`text-`/`border-`. Le premier relevé d'usages de
> `dark` avait manqué un `fill-dark` bien vivant (étiquettes SVG du graphe de
> projection, page Finances) : la classe purgée ne rendait plus rien, et l'écart
> — noir par défaut au lieu de `#1C1917` — passait sous le seuil de
> `qa:visual`. `md3:check` couvre désormais l'ensemble des préfixes
> (`fill`, `stroke`, `accent`, `caret`, `divide`, `from`/`via`/`to`…).
>
> `duration-macro` valait **300 ms** : l'équivalent est `duration-medium2`, pas
> `duration-medium1` (250 ms) comme l'indiquait à tort le commentaire
> `@deprecated` de la config.

---

## 7. Décisions reportées

| Sujet | Décision | Motif |
| --- | --- | --- |
| Renommer les primitifs en `--tk-ref-*` | **Reporté** | Hors périmètre (couche sémantique uniquement). Renommage mécanique, sans consommateur hors `index.css` une fois la dette du §4 soldée. |
| Renommer les tokens de composant en `--tk-cmp-*` | **Reporté** | 9 tokens, ~10 call sites (`Sidebar`, `NavigationRail`, `LoginPage`). Prêt à exécuter. |
| Supprimer les alias `@deprecated` | **Reporté** | C'est l'intérêt du dispositif : migrer fichier par fichier. Attention aux alias `--radius-*`/`--text-*` (§2.4), qui ne sont pas supprimables sans changement de rendu. |
| Consolider les doublons (§5) | **Reporté** | Change la sémantique, pas le nommage. À faire dans un lot séparé et vérifiable. |

---

## 8. Breakpoints — vocabulaire conservé

**Aucun changement de valeur** : `compact` (max 599 px), `medium` (600),
`expanded` (840), `large` (1200), `extra-large` (1600).

**Renommage du vocabulaire : reporté.** Le critère était « uniquement si le coût
est faible ». Il ne l'est pas :

- **388 usages** de préfixes de variante répartis sur **45 fichiers**
  (`medium:` 251, `expanded:` 109, `large:` 25, `compact:` 2,
  `extra-large:` 1) ;
- un alias Tailwind **n'évite pas** ce coût, il l'aggrave : deux vocabulaires
  coexisteraient pour la même largeur, et `compact` étant une requête
  `max-width`, il faudrait dupliquer la règle et non la renommer ;
- le vocabulaire *compact / medium / expanded* décrit une **classe de taille de
  fenêtre**, pas une identité de marque : il n'entre pas en conflit avec
  l'extraction du Tracker DS.

À rouvrir seulement si le renommage accompagne une refonte des règles
responsive — pas seul.

---

## 9. Comment la neutralité de rendu a été vérifiée

Le seuil de `qa:visual` (0,05 %) ne prouve pas l'égalité au pixel — une dette
chromatique y était déjà passée inaperçue. Trois preuves de niveaux différents
ont donc été produites :

1. **Niveau token** — relevé, dans Chromium sur le build de production, de la
   valeur *résolue* de chaque propriété personnalisée de `:root`, avant et après.
   → 473 entrées, **0 valeur modifiée, 0 entrée disparue**. Tous les utilitaires
   étant adossés à `var(…)`, l'égalité des tokens vaut égalité de rendu pour tout
   ce qui passe par eux.
2. **Niveau feuille de style** — les deux CSS bâties sont comparées règle par
   règle (parseur PostCSS, sélecteurs éclatés, `var()` résolus en littéraux).
   → **1 529 sélecteurs communs, 3 écarts** : le bloc `:root` lui-même (le
   renommage), et `-mx-page`/`-mx-page-sm` dont Tailwind n'inline plus la
   négation (`-1rem` → `calc(1rem * -1)`, valeur calculée identique).
   Les 14 sélecteurs disparus et 13 apparus s'apparient un à un, à valeur
   résolue égale.
3. **Niveau pixel** — `npm run qa:visual:auto` : **39/39 checkpoints au même
   statut** qu'un run témoin du même jour effectué avant la migration
   (36 `match`, 3 `changed` = le Dashboard, instable de façon connue et
   antérieure).

Plus `npm run lint:md3` (ESLint, `md3:check`, encodage, sonde `cn()`,
garde des tokens) et `npm run build`.
