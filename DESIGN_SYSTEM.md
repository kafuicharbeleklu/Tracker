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

Plus `npm run lint:ds` (ESLint, `ds:check`, encodage, sonde `cn()`,
garde des tokens) et `npm run build`.

---

# Tracker DS v1 — la librairie

> Les sections 1 à 9 décrivent la **couche de tokens**. Celles qui suivent
> décrivent la **librairie de composants** : états, règles de choix, patterns,
> contenu, gouvernance. Rien n'y est inventé : tout est constaté dans
> `src/components/ui/**` et dans les pages qui les consomment, à l'exception des
> états manquants, comblés et signalés comme tels (§10.4).

---

## 10. Matrice d'états des primitives

### 10.1 Les sept états du DS

| État | Déclencheur | Rendu canonique | Token |
|---|---|---|---|
| **default** | repos | l'apparence de la variante | — |
| **hover** | pointeur capable de survol | changement de fond (jamais de couleur de texte seule) | `--tk-state-hover-opacity` ou fond `surface-container` |
| **focus-visible** | navigation clavier | anneau **opaque** 2 px + décalage 2 px | `focus-ring` (anthracite) — `primary` sur surface sombre |
| **pressed** | appui maintenu | `active:scale-[0.98]` (0,92 pour une action d'icône) et/ou couche d'état | `--tk-state-pressed-opacity` |
| **disabled** | prop `disabled` | opacité 38 % (ou fond/texte `on-surface/[0.12]` et `/[0.38]`) + curseur interdit | `on-surface/[0.38]` |
| **loading** | prop `loading` / `isProcessing` | indicateur + `aria-busy` + interactions neutralisées | — |
| **erreur** | prop `error` (champs) | bordure `error`, message `role="alert"` lié par `aria-describedby`, `aria-invalid` | `error` |

Deux règles non négociables, héritées du Chantier B :

- **X12** — le jaune de marque n'est jamais une couleur de texte sur fond clair
  (1,55:1). Un survol se signale par le **fond**, pas par un texte qui vire au jaune.
- **Q-V2** — l'anneau de focus est **opaque** (`focus-ring`), jamais une teinte
  translucide de la couleur d'accent.

### 10.2 Le survol est borné au pointeur capable, par construction

Tailwind v4 émet chaque utilitaire `hover:` **enveloppé dans
`@media (hover: hover)`** — vérifié dans la CSS bâtie :

```css
@media(hover:hover){ .group-hover\:pointer-events-auto:is(:where(.group):hover *){…} }
```

Il n'y a donc **rien à faire** pour qu'un survol ne « colle » pas au doigt sur
un écran tactile, tant que l'effet passe par un utilitaire `hover:`. Les deux
conséquences pratiques :

1. Un `:hover` écrit **à la main** dans `index.css` n'est PAS protégé. Il n'y en
   a qu'un, assumé : `.state-layer:hover::after`. Toute nouvelle règle manuscrite
   doit s'envelopper elle-même.
2. Quand le survol **porte une information** (action révélée, valeur d'un point
   de graphe), la media-query ne suffit pas : il faut une garde JS
   `useMediaQuery(MEDIA.hoverCapable)` et un chemin tactile équivalent. C'est ce
   que font `LocationsPage`, `AddBudgetModal` et `FinanceManagementPage`.

### 10.3 Matrice composant × états

Légende : **✅** présent avant v1 · **➕** ajouté par Tracker DS v1 · **—** non
applicable (l'état n'a pas de sens pour ce composant) · **↳** délégué à la
primitive sous-jacente.

| Composant | default | hover | focus-visible | pressed | disabled | loading | erreur |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `Badge` | ✅ | — | — | — | — | — | — |
| `BottomSheet` | ✅ | — | ✅ piège + focus initial | — | — | — | — |
| `Button` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `BulkActionBar` | ➕ | ↳ `Button` | ↳ | ↳ | — *(S1 : à sélection vide il n'existe pas, il n'est pas grisé)* | — | — |
| `Card` | ✅ | ✅ si cliquable | ✅ | ➕ | ✅ | — | — |
| `Chip` | ✅ | ✅ | ✅ | ➕ | ✅ *(corrigé)* | — | — |
| `CloseButton` | ↳ `Button` | ↳ | ↳ | ↳ | ↳ | — | — |
| `ConfirmationSheet` | ➕ | ↳ `Button` | ➕ piège + Échap + focus initial | ↳ | ➕ tant que le mot-clé ou le motif manque | ➕ | ➕ *(l'acte échoué garde la feuille ouverte, 17.1 règle 1)* |
| `ContextBanner` · `OfflineBanner` | ➕ | — | — | — | — | — | — *(il **dit** un état, il n'en a pas)* |
| `DemoBadge` | ✅ | — | — | — | — | — | — |
| `DetailHero` | ➕ | ↳ actions | ↳ | ↳ | — | — | — |
| `DetailTemplate` | ➕ | ↳ | ↳ | ↳ | — | ➕ *(`SkeletonDetail` après 300 ms)* | ➕ *(hors ligne ; l'échec d'acte se pose sous le héro)* |
| `Divider` | ✅ | — | — | — | — | — | — |
| `EmptyState` *(déprécié → `ScreenState`)* | ✅ | ↳ action | ↳ action | ↳ action | — | — | — |
| `EntityRow` | ✅ | ✅ | ✅ *(inset)* | ✅ | ✅ | — | — |
| `FacetChip` | ➕ | ✅ | ➕ | — *(voir note)* | — | — | — |
| `ErrorBoundary` | ✅ | — | — | — | — | — | ✅ *(c'est sa raison d'être)* |
| `FabContainer` | ✅ | — | — | — | — | — | — |
| `FileDropzone` | ✅ | ✅ | ➕ | — *(voir note)* | — | ✅ ➕ *(clic et dépôt neutralisés, `aria-busy`)* | — |
| `FloatingActionButton` | ✅ | ✅ | ✅ | ✅ | ➕ | — | — |
| `IconButton` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `Icon` | ➕ | — | — | — | — | — | — *(décoratif : `aria-hidden`, le mot est à côté — I3)* |
| `InlineError` | ➕ | — | — | — | — | — | ➕ *(c'est sa raison d'être)* |
| `InputField` | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `ListRow` | ➕ | — *(voir note)* | ➕ | — | — | ↳ `Skeleton*` | — |
| `ListRow` *(sélection)* | ➕ | — *(S4)* | ➕ | — | — | — | — |
| `ListTemplate` | ➕ | ↳ | ↳ | ↳ | — | ➕ *(squelette après 300 ms)* | ➕ *(hors ligne, vide)* |
| `ListActionFab` | ↳ | ↳ | ↳ | ↳ | ✅ ➕ *(rendu par le FAB)* | — | — |
| `LoadingSpinner` | — | — | — | — | — | ✅ *(c'est sa raison d'être)* | — |
| `MaterialIcon` | ✅ | — | — | — | — | — | — |
| `Menu` | ✅ | ✅ | ✅ *(inset + roving)* | ✅ | ✅ par item | — | — |
| `MetricCard` | ✅ | ✅ si cliquable | ✅ | ✅ | — | — | — |
| `Modal` | ✅ | — | ✅ piège + focus initial | — | — | — | — |
| `MovementTimeline` | ✅ | ✅ | ➕ | ➕ | ✅ | — | — |
| `NavButton` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `PageTabs` | ✅ | ✅ | ✅ | — *(voir note)* | — | — | — |
| `Pagination` | ✅ | ✅ | ➕ | ➕ | ✅ | — | — |
| `ProportionRow` | ➕ | — | — | — | — | — | — *(un amortissement n'est pas une anomalie)* |
| `ReferenceRow` | ➕ | ✅ *(valeur copiable)* | ➕ *(idem)* | — | — | — | — |
| `SearchFilterBar` | ✅ | ✅ | ➕ | ✅ *(bouton filtre)* | — | — | — |
| `ScanView` | ➕ | ✅ | ➕ | — *(voir note)* | — | — *(l'attente **est** la caméra)* | — *(la lecture appartient à l'appelant)* |
| `ScreenState` | ➕ | ↳ action | ↳ action | ↳ action | — | — | ➕ *(introuvable et refusé sont deux de ses trois emplois)* |
| `SegmentedButton` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `SelectField` | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `SelectableRow` | ➕ | — *(voir note)* | ➕ | — | — | — | — |
| `SelectFilter` | ✅ | ✅ | ✅ | — | — | — | — |
| `SelectionTopBar` | ➕ | ✅ | ➕ | — | — | — | — |
| `SearchField` | ➕ | — | ➕ *(anneau porté par le cadre)* | — | — | — | — |
| `SideSheet` | ✅ | — | ✅ piège + focus initial | — | — | — | — |
| `Skeleton*` *(List · Queue · Detail)* | — | — | — | — | — | ➕ *(c'est sa raison d'être)* | — |
| `Snackbar` | ✅ | ✅ | ✅ *(exception, §10.5)* | — | — | — | ✅ `variant="error"` |
| `StatusBadge` | ✅ | — | — | — | — | — | — |
| `TableScrollArea` | ✅ | ✅ | ✅ *(région focalisable)* | — | — | — | — |
| `TextArea` | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `Toggle` | ✅ | ✅ | ➕ | — *(voir note)* | ✅ | — | — |
| `Tooltip` | ✅ | ✅ | ✅ *(s'affiche au focus)* | ✅ *(appui long tactile)* | — | — | — |
| `UserAvatar` | ✅ | — | — | — | — | — | — |

**Notes sur les « — » qui pourraient surprendre**

- `FileDropzone` **pressed** : la zone fait plusieurs centaines de pixels ; un
  retour d'appui y serait illisible. L'état qui compte est le **survol de
  fichier** (`isDragging` → bordure `primary` + fond `primary-container/20`),
  déjà implémenté.
- `ListRow` **hover** : la rangée entière est la cible et le chevron le dit ; les
  planches ne dessinent aucun retour de survol, et **rien de destructif** n'y vit
  qui pourrait en réclamer un (04.1 : la corbeille de rangée est tombée).
- `FacetChip` **pressed** : la sélection est un état **permanent** (surface
  inversée). Un retour d'appui transitoire par-dessus brouillerait sa lecture —
  même raison que `PageTabs`.
- `ListRow` en **sélection**, **hover** : rien n'apparaît au survol — règle **S4** de la planche
  17.2, *jamais un acte au seul survol*. Tout est tactile : les actes de rangée sont
  visibles en permanence ou dans le débordement. Le seul retour est l'état **coché**,
  qui est permanent, pas transitoire.
- `ScanView` **pressed** : le geste qui compte n'est pas l'appui, c'est la **lecture** —
  et elle se dit par le retour visuel **et haptique** de N3, jamais par un état de bouton.
- `PageTabs` **pressed** : l'onglet actif est un état **permanent** (rempli
  jaune). Ajouter un retour d'appui transitoire par-dessus brouillerait la
  lecture de la sélection.
- `Toggle` **pressed** : MD3 ne distingue pas l'appui du basculement sur un
  interrupteur ; la transition du pouce (24 px, 250 ms) EST le retour.
- **disabled** absent de `MetricCard`, `PageTabs`, `SearchFilterBar`,
  `SelectFilter`, `TableScrollArea` : ces composants n'exposent pas la prop. Ce
  n'est pas une lacune d'état — c'est une absence d'API, à ne créer que le jour
  où un appelant en a besoin.

### 10.4 Ce que la v1 a ajouté

Dix états manquants sur huit composants, plus deux corrections. Aucun n'altère
le rendu au repos : tous se déclenchent au clavier, au pointeur ou sur une prop
qu'aucun appelant vivant n'active — d'où des références visuelles inchangées.

| Composant | Ajout | Pourquoi c'était un défaut |
|---|---|---|
| `Toggle` | focus-visible | L'input est `sr-only` : sans relais `peer-focus-visible` sur la piste, l'interrupteur n'avait **aucun** indicateur de focus. Invisible au clavier. |
| `FileDropzone` | focus-visible + accès clavier | `div` cliquable dont l'`<input type="file">` est `hidden` (donc non focalisable) : la zone était **inatteignable au clavier**. Ajout de `role="button"`, `tabIndex`, Entrée/Espace, anneau. |
| `FileDropzone` | loading durci | Le clic était gardé, pas le **dépôt** : on pouvait déposer un fichier pendant un traitement. `aria-busy` ajouté. |
| `FloatingActionButton` | disabled | Le composant acceptait `disabled` **sans aucun rendu associé** : bouton mort d'aspect actif. `ListActionFab` transmettait déjà la prop. |
| `Pagination` | focus-visible + pressed | Seul l'anneau par défaut du navigateur subsistait — hors DS, et invisible sur certains fonds. |
| `MovementTimeline` | focus-visible + pressed | Idem sur sa pagination interne. |
| `SearchFilterBar` | focus-visible | Le champ porte `focus:outline-none` ; le focus n'était signalé que par une **élévation**, indicateur insuffisant. L'anneau est porté par le conteneur et ciblé `has-[input:focus-visible]` pour ne pas doubler celui des boutons de la barre. |
| `Card` | pressed | La documentation du composant annonçait « supports focus, hover, and pressed states » — le pressed n'existait pas. Aligné sur `MetricCard`/`EntityRow`. |
| `Chip` | pressed | Aligné sur les autres contrôles compacts. |
| `Chip` | correction disabled | Le survol du chip **sélectionné** (`hover:bg-primary/90`) s'appliquait même désactivé. |

**Deux régressions bloquantes découvertes par la galerie** (§14.2), corrigées
hors périmètre initial car elles rendaient la vitrine — et l'application —
inutilisables : `Modal` et `SideSheet` ne se **fermaient plus**. Le commit
`283dd58` avait inversé la condition de sortie (`else if (visible)` →
`else if (!visible)`) : à la fermeture d'une boîte montée en permanence
(`isOpen` passe à `false`, `visible` vaut `true`), aucune branche ne
s'exécutait, `closing` restait faux, l'animation de sortie n'était jamais
amorcée — et `document.body.style.overflow` restait bloqué à `hidden`.
`BottomSheet`, non touché par ce commit, avait conservé la forme correcte et a
servi de référence.

### 10.5 Exceptions documentées

- **`Snackbar` — anneau `ring-current` au lieu de `focus-ring`.** La barre est
  posée sur `inverse-surface` (fond sombre) : l'anthracite y disparaîtrait.
  `currentColor` suit la variante (default / error / success). Même logique que
  `variant="nav"` sur `Button`/`IconButton`, qui bascule sur `ring-primary`.
- **`SelectField` / `SelectFilter` — focus piloté en JS** (`isFocused`,
  `isOpen`) plutôt que par `:focus-visible`. Conséquence assumée : l'anneau
  apparaît aussi au clic souris. Le déclencheur est un `combobox` dont l'état
  ouvert doit être visible quelle que soit la modalité d'entrée.
- ~~**`ConfirmationDialog` — indicateur de chargement local**~~ — **caduque le
  2026-08-15** : le composant est remplacé par `ConfirmationSheet` (planche 17.2),
  qui emploie la prop `loading` de `Button`. L'écart n'existe plus faute de porteur.

---

## 11. Règles de choix entre composants proches

L'audit mobile §4.2 signalait trois familles « à surveiller ». Aucune n'est une
duplication : chacune a une règle, énoncée ici et vérifiable sur les appels réels.

### 11.1 `PageTabs` **ou** `SegmentedButton` — verdict : **documenter, ne pas fusionner**

|  | `PageTabs` | `SegmentedButton` |
|---|---|---|
| **Question posée à l'utilisateur** | « quelle **vue** de ce contenu ? » | « avec quel **réglage** faire cette tâche ? » |
| Sémantique ARIA | `tablist` / `tab` / `aria-selected` + `aria-controls` | `group` + `aria-pressed` |
| Clavier | roving `tabIndex`, ←/→/Origine/Fin | chaque segment est un arrêt de tabulation normal |
| Portée | une page ou un panneau entier | un formulaire, une barre d'outils |
| Nombre d'options | non borné (déborde, défile) | 2 à 5, cadre fixe |
| Effet du changement | remplace le corps de la page ; la sélection est un **état de navigation** | change une **donnée** du formulaire en cours |
| Appels réels | 9 pages : Approbations, Audit, Audit (détail), Finances, RBAC, Catégorie (détail), Gestion, Paramètres, Utilisateur (détail) | 2, tous deux dans une boîte de dialogue : « Mode de saisie » (`AddExpenseModal`) et manuel/import (`AddBudgetModal`) |

**Justification du refus de fusion.** Les deux rôles ARIA sont incompatibles :
un `tab` annonce « une vue parmi N, avec un panneau associé », un bouton
`aria-pressed` annonce « une option activée ». Fusionner imposerait un rôle faux
à l'un des deux usages — sur un formulaire, un lecteur d'écran annoncerait un
onglet là où il n'y a pas de panneau. S'ajoute le poids : `PageTabs` porte un
scroller d'overflow, des libellés courts adaptatifs, des pastilles et une
feuille « toutes les vues » — 314 lignes dont aucune n'a de sens dans un
sélecteur de mode à deux options. La séparation coûte un composant de 117
lignes ; la fusion coûterait une régression d'accessibilité.

**Règle opérationnelle.** Si le changement doit pouvoir être **partagé par
URL**, ou s'il remplace le contenu principal → `PageTabs`. S'il est **soumis
avec le formulaire** ou filtre une liste sans quitter la vue → `SegmentedButton`.

### 11.2 `Card` / `MetricCard` / `EntityRow` — un continuum, pas trois cartes

Trois questions, dans l'ordre :

1. **L'objet appartient-il à une collection qu'on parcourt ?** → `EntityRow`.
2. **Sinon, le contenu se réduit-il à un chiffre ?** → `MetricCard`.
3. **Sinon** → `Card`.

| | `Card` | `MetricCard` | `EntityRow` |
|---|---|---|---|
| Contenu | libre (`children`) | un chiffre + son libellé | une **entité** : visuel, titre, sous-titre, statut, méta, actions |
| Élément | `<section>` | `<div>` | `<div role="button"\|"listitem">` |
| Typographie clé | `title-medium` | `stat-value` (30 → 24 px en compact) | `title-small` (liste) / `title-medium` (carte) |
| Variantes | `elevated` · `filled` · `outlined` | plein · `compact` | `list` (séparateur) · `card` (détachée) |
| Responsive | aucune bascule propre | `compact` masque sous-titre et tendance | grille qui replie colonnes → pile ; statut passe sous le titre en compact |
| Exemples | panneaux de Paramètres, blocs de détail | tuiles de Tableau de bord, d'Audit, de RBAC | listes Équipements, Utilisateurs, Emplacements |

**Le piège à éviter** — composer une tuile de stat à partir de `Card` + une
typographie manuelle. C'était l'écart X9 : trois pages affichaient des chiffres
à des tailles différentes. `text-stat-value` n'existe que dans `MetricCard` ;
si un chiffre doit être mis en avant, c'est ce composant qu'on emploie.

**Le second piège** — utiliser `Card` pour une rangée de liste. `EntityRow`
porte tout le comportement responsive de la rangée (repli des colonnes, statut
qui remonte sous le titre en compact). Une `Card` bricolée en rangée le perd,
et c'est exactement ce que le pattern « tableau responsive » (§12.1) cherche à
éviter.

### 11.3 `<Tooltip>` **ou** `title=` — le composant est officiel

**Règle.** L'attribut natif `title=` est autorisé **uniquement en redondance
d'une information déjà visible à l'écran ou déjà vocalisée** (`aria-label`).
Dès qu'il porte seul une information, c'est `<Tooltip>`.

**Pourquoi.** `title` ne se déclenche **pas au tap** : sur téléphone, son
contenu est inatteignable. Sa vocalisation par les lecteurs d'écran est
inconstante et son délai d'apparition n'est pas contrôlable. `<Tooltip>`, lui,
gère l'appui long (600 ms), l'affichage au focus clavier, `role="tooltip"` +
`aria-describedby`, la fermeture par Échap et — via `strategy="fixed"` — les
conteneurs qui clippent.

**Deux cas de redondance acceptés :**

1. `title` = version **complète** d'un texte tronqué par `truncate` /
   `line-clamp-*`. L'information est visible, seulement coupée.
2. `title` = doublon d'un `aria-label` porté par la même balise.

Le linter (§14.1) applique exactement ces deux exemptions et **avertit** sur le
reste. Il ne bloque pas : la redondance « libellé visible juste à côté » — le
cas de `NavigationBar`, dont chaque destination affiche son libellé sous
l'icône — n'est pas décidable lexicalement, et vit dans une liste d'exceptions
explicite.

---


### 11.6 `FacetChip` ou `Chip` · `SearchField` ou `SearchFilterBar`

Deux paires nées du portage du gabarit de liste (2026-08-15). Elles se ressemblent
à l'œil et ne portent pas le même rôle ; la règle est **l'écran**, pas le goût.

| | Écran **non basculé** | Écran porté sur les planches |
| --- | --- | --- |
| puce de filtre | `Chip` — 32 px, sélection **jaune plein** | `FacetChip` — 44 px, sélection en **surface inversée**, avec **décompte** |
| recherche | `SearchFilterBar` — barre MD3 en gélule, bouton de filtre **inclus** | `SearchField` — le champ **seul**, 48 px, rayon 4, le filtre reste à l'écran |

**Pourquoi deux et pas une.** La sélection jaune de `Chip` dépense le budget de
deux jaunes par écran (X12) que les planches réservent à l'onglet actif et au
bouton d'ajout ; et `SearchFilterBar` possède son bouton de filtre, là où le
gabarit veut placer lui-même une feuille de filtre à trois axes. Les deux couples
cohabitent **le temps de la bascule**, comme le namespace `adn-` : la forme
héritée disparaît avec son dernier appel.

## 12. Patterns officiels

Ces patterns ne sont pas des propositions : ce sont les solutions déjà retenues
dans l'application, promues au rang de règle avec leurs critères d'exception.

### 12.1 Tableau responsive

**Le pattern officiel : la recomposition en cartes.** Sous `medium` (600 px),
un tableau devient une pile de cartes, une par ligne, chacune portant les
champs sous forme libellé + valeur. Bascule par CSS, sans duplication de
logique :

```tsx
{/* Desktop : la grille */}
<div className="hidden medium:block overflow-x-auto">
  <table>…</table>
</div>

{/* Compact : une carte par ligne */}
<div className="medium:hidden divide-y divide-outline-variant">
  {items.map(item => (
    <div key={item.id} className="p-4 space-y-2">
      <div className="flex items-center gap-3">
        <img … className="w-10 h-10 rounded-md shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-on-surface truncate">{item.name}</p>
          <p className="font-mono text-body-small text-on-surface-variant truncate">{item.assetId}</p>
        </div>
        <Badge variant="…">{item.status}</Badge>
      </div>
      …
    </div>
  ))}
</div>
```

*Référence : `CategoryDetailsPage.tsx:87,130` et `ModelDetailsPage.tsx:140,196`.*
Quand la ligne est une **entité du domaine**, on n'écrit pas cette carte à la
main : on emploie `EntityRow`, qui la fournit (§11.2).

**Le critère de bascule** — pas la largeur du tableau, mais sa **fonction** :

> L'alignement en colonnes est-il l'**outil de lecture** (on compare des valeurs
> d'une ligne à l'autre), ou le tableau n'est-il qu'un **contenant** de lignes
> qu'on lit une par une ?

Contenant → cartes. Outil de comparaison → exception ci-dessous.

**L'exception : défilement horizontal assumé, première colonne épinglée.**
Réservée aux tableaux dont la lecture EST la comparaison colonne à colonne et
dont l'usage est à dominante bureau — en pratique, les **écrans de vérification
avant import**. On n'y laisse jamais un `overflow-x-auto` nu : la primitive
`TableScrollArea` rend le débordement perceptible et pilotable.

```tsx
<TableScrollArea label="Aperçu des équipements à importer" scrollerClassName="max-h-[400px]">
  <table className="w-full text-body-small text-left">
    <thead className="… sticky top-0 z-10">
      <tr>
        {/* colonne de tête épinglée, fond OPAQUE obligatoire */}
        <th className="px-4 py-3 sticky left-0 z-20 bg-surface-container border-r border-outline-variant">Statut</th>
        …
```

*Référence : `ImportEquipmentPage.tsx:184`.* Ce que la primitive apporte :
fondu + chevron tant qu'il reste du contenu à droite, région `role="region"`
focalisable au clavier (WCAG 2.1.1 — défiler sans souris), et mention
`aria-live` du débordement.

**Deux contraintes de mise en œuvre**, apprises lors du lot 5 :

- Le fond de la colonne épinglée doit être **opaque**. Une teinte translucide
  laisse voir défiler le contenu dessous.
- Si le tableau est un **formulaire** (champs éditables), la bascule doit se
  faire en **JS** (`useMediaQuery`) et non en CSS : deux branches CSS
  dupliqueraient les champs dans le DOM, avec deux valeurs et deux `id`
  (`AddBudgetModal`).

### 12.2 Formulaires

**Moment de la validation — « tard pour punir, tôt pour pardonner ».**

| Moment | Ce qui se passe | Référence |
|---|---|---|
| Saisie | **rien** — aucune erreur n'apparaît pendant la frappe | — |
| Frappe **après** une erreur | l'erreur du champ est **effacée immédiatement** | `LoginPage.tsx:316,336` |
| Soumission | tous les champs sont validés, toutes les erreurs s'affichent d'un coup | `LoginPage.tsx:52-71` |
| Réponse du serveur | l'erreur se pose sur le champ concerné, pas dans un bandeau global | `LoginPage.tsx:103` |

Le `<form>` porte **`noValidate`** : la validation native du navigateur est
neutralisée au profit des messages du DS (en français, stylés, liés en ARIA).

**Style des messages.** Un seul rendu, fourni par la primitive — jamais de
message écrit à côté du champ :

```tsx
<InputField
  label="Adresse e-mail"
  error={emailError}                                  // -> bordure error + message
  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(undefined); }}
  required
/>
```

`InputField`, `TextArea` et `SelectField` en tirent : bordure `error`, libellé
qui passe en `text-error`, message `text-body-small text-error` avec
`role="alert"`, `aria-invalid` sur le champ et `aria-describedby` qui pointe le
message. Le texte d'aide (`supportingText`) et le message d'erreur occupent la
**même ligne** : l'erreur remplace l'aide, elle ne s'y ajoute pas — pas de saut
de mise en page.

**Groupes de champs.** Espacement `space-y-6` entre champs d'un même groupe ;
un groupe est introduit par un `section-label` (petites capitales) ou une
`Card`. Les champs liés (`prefix`/`suffix`, montant + devise) restent dans un
seul `InputField` plutôt que d'être scindés.

**Actions de formulaire.** Toujours en **pied**, alignées à droite, l'action
principale en dernier (`filled`), l'annulation à sa gauche (`outlined` ou
`text`) ; l'annulation est désactivée pendant l'enregistrement.
`FullScreenFormLayout` fournit ce pied par défaut et permet de remonter
l'action principale en en-tête (`submitButtonLocation="header"`) pour les
formulaires longs. Dans une `Modal`, c'est le slot `footer`.

**Astérisque et obligation.** `required` sur le champ suffit : la primitive
ajoute l'astérisque `text-error` et `aria-required`.

### 12.3 Cibles tactiles — 48 px de zone de frappe, 8 px d'écart

**La règle.** Toute cible interactive présente une zone de frappe d'au moins
**48 × 48 px** sur pointeur grossier, et deux cibles voisines sont séparées d'au
moins **8 px** (`gap-2`).

**La mise en œuvre — un pseudo-élément, pas une géométrie.** La classe
`.touch-target` (index.css) étend la zone sans toucher au rendu :

```css
@media (pointer: coarse) {
  .touch-target { position: relative; overflow: visible; }
  .touch-target::before {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 100%; height: 100%; min-width: 48px; min-height: 48px;
    transform: translate(-50%, -50%);
  }
}
```

Quatre propriétés de ce choix, toutes voulues :

1. **Zéro différence visuelle**, à tous les points de rupture — le `::before` ne
   peint rien. Un `min-h` conditionnel, lui, aurait déplacé la mise en page.
2. **Immunisé aux surcharges de taille** : le `::before` impose 48 px même sous
   un `w-8` ou un `!h-9` de l'appelant.
3. **Auto-limité** : n'étend que la dimension réellement inférieure à 48 px. Les
   conteneurs de navigation déjà à 64–80 px ne bougent pas.
4. **`overflow: visible` obligatoire** sur pointeur grossier : sans lui,
   l'`overflow: hidden` de `.state-layer` clipperait la zone étendue. D'où
   l'ordre dans `index.css` — `.touch-target` **après** `.state-layer`.

**Piège de mesure connu.** `getBoundingClientRect()` ne voit pas le
pseudo-élément : l'audit `qa:devices`, qui mesure la boîte, **ne reflète pas**
ce gain. Vérifier une cible tactile se fait en simulant un clic hors de la
boîte (protocole CDP), pas en lisant une hauteur.

Portent `touch-target` : `Button`, `IconButton`, `NavButton`, les onglets de
`PageTabs` et les rangées de sa feuille « toutes les vues ».

### 12.4 États d'interface — quel écran pour quel vide

| Situation | Composant | Ce qui la distingue |
|---|---|---|
| **Rien à afficher, et c'est normal** (liste vide, aucun résultat) | `EmptyState` | Icône + titre + explication + **une action de sortie**. Jamais un simple « Aucune donnée ». |
| **Le contenu arrive** | `LoadingSpinner` | `variant="spinner"` en ligne ; `fullScreen` pour un écran entier ; `variant="linear"` quand la durée est longue et l'étape nommable (extraction OCR, import). |
| **Une page se charge** (`React.lazy`) | `PageLoadingFallback` | Repli du `<Suspense>` d'`AppLayout`. |
| **Une action est en cours** | `Button loading` | Le bouton porte l'attente : spinner intégré, `aria-busy`, interactions neutralisées. Ne **jamais** superposer un `LoadingSpinner fullScreen` à un simple enregistrement. |
| **Le rendu a levé une exception** | `ErrorBoundary` | Monté en **racine** (`App.tsx`, hors providers) et **par vue** (`AppLayout`, `key={currentView}`). |
| **Une règle métier refuse** | `BusinessRuleDecision` + toast | Ce n'est pas une erreur technique : pas de boundary, pas d'écran d'erreur — un message qui explique le refus. |
| **Un champ est invalide** | prop `error` de la primitive | Local au champ (§12.2). |

**Pourquoi la `key` sur le boundary de vue.** Un `ErrorBoundary` ne se
réinitialise pas seul : sans `key={currentView}`, une page ayant planté une fois
resterait cassée jusqu'au rechargement complet. Avec elle, **naviguer suffit à
en sortir** — ce qui, sur mobile et sans console, est la seule issue disponible.

**Ce qu'un boundary ne rattrape pas** : les rejets de promesse et les erreurs
levées dans les gestionnaires d'événements. Ceux-là restent à traiter là où ils
naissent (toast, message de champ).

---

## 13. Contenu — terminologie et rédaction

### 13.1 `src/constants/glossary.ts` est la source officielle

Le glossaire cesse d'être un fichier d'appoint : **un terme qui y figure ne se
réécrit pas ailleurs.** Quand un libellé de section, une action ou un message
standard doit changer, il change là — pas dans la page.

La chaîne est déjà en place pour les **destinations** : `glossary.ts` →
`destinations.ts` (registre unique X1) → les 4 surfaces de navigation + les
titres de document. Un libellé de section n'est plus écrit dans un composant.

**État de la consommation, mesuré.** Sur 32 entrées, **9 sont réellement
consommées** — toutes du bloc « Pages », via `destinations.ts` :

| Bloc | Entrées | Consommées | Constat |
|---|:--:|:--:|---|
| Entités | 6 | 2 | `EQUIPMENT_PLURAL`, `USER_PLURAL`, `LOCATIONS` passent par le registre de destinations. |
| Actions | 9 | 0 | « Ajouter », « Enregistrer », « Annuler »… sont réécrits littéralement dans chaque page. Les valeurs **coïncident** — le risque est la dérive future, pas une incohérence actuelle. |
| Pages | 9 | 7 | Le socle qui fonctionne. |
| Messages | 6 | 0 | Les formules de succès/erreur sont écrites sur place. |
| Placeholders | 2 | 0 | Voir la divergence typographique ci-dessous. |

**Deux écarts relevés, non corrigés en v1** (ils touchent des chaînes affichées,
donc les références visuelles) :

1. `EXAMPLE_PREFIX` vaut `'Ex :'` (espace insécable avant le deux-points, usage
   français) alors que **15 placeholders** de l'application écrivent `Ex:`.
2. Deux destinations contournent le glossaire : `finance: 'Finances'` et
   `rbac: 'Rôles & accès'` sont écrites en dur dans `destinations.ts`.

### 13.2 Conventions rédactionnelles constatées

**Casse de phrase, toujours.** Les libellés sont écrits en casse de phrase
(« Ajouter un équipement », « Rôles & accès »). Les capitales qu'on voit à
l'écran — badges, `section-label` — viennent de la **CSS** (`uppercase`), jamais
de la chaîne. Conséquence : un badge se lit correctement à voix haute et
change de casse sans qu'on touche au texte.

**Une action = un verbe + son objet, dès que l'objet n'est pas évident.**
L'infinitif est la forme des actions. « Ajouter un équipement », « Attribuer »,
« Enregistrer », « Importer utilisateurs ».

> **La leçon « Retour matériel ».** Sur le tableau de bord, deux boutons
> voisins : « Attribuer » (verbe, action claire) et « **Retour matériel** »
> (groupe nominal). Le second ne dit pas ce qu'il fait : ouvre-t-il la liste des
> retours ? un état ? un formulaire ? Il ouvre en réalité l'assistant de retour.
> Le glossaire porte déjà le verbe attendu (`RETURN: 'Retourner'`).
> **La règle** : un intitulé d'action ne peut pas être un groupe nominal.
> `DashboardPage.tsx:355,378` reste le contre-exemple vivant — non corrigé en
> v1 parce que changer la chaîne change la largeur du bouton, donc les
> références visuelles ; consigné au journal.

**Libellés de navigation : courts, nominaux, stables.** Les surfaces
contraintes (barre du bas, rail) consomment `shortLabel` — un mot, ≤ 8
caractères : « Accueil », « Actifs », « Tâches », « Équipe ». Le libellé long
(`label`) reste celui de la barre supérieure et du titre de document.

> **Écart assumé et à surveiller** : `equipment` a pour `label`
> « Équipements » et pour `shortLabel` « **Actifs** ». Deux mots pour un même
> concept, ce que la règle « un concept, un terme » interdit ailleurs. Toléré
> parce que la contrainte est physique (largeur d'un cinquième d'écran) et que
> le `shortLabel` ne coexiste jamais avec le `label` dans une même vue.

**Un concept, un terme.** L'application dit **Équipement** (15 occurrences),
pas « Matériel » (10) ni « Actif » (5) — ces deux derniers subsistent dans des
tournures de phrase, pas comme désignation d'entité. Dire **Emplacement** et
non « Localisation ». « Site » (11) désigne autre chose : le lieu physique
rattaché à un utilisateur.

**Typographie française.** Espace insécable avant `: ; ! ?`, guillemets
français « … », apostrophe typographique ’. La garde `check:encoding` bloque le
mojibake (`Ã©`) avant qu'il n'atteigne le rendu — c'est arrivé.

**Messages.** Le succès nomme l'entité et l'action au participe passé
(« Équipement ajouté avec succès »). L'erreur dit quoi faire, pas ce qui a
raté : « Veuillez saisir votre adresse e-mail. », « Le format de l'adresse
e-mail est invalide. » Un refus de **règle métier** s'énonce comme une règle,
pas comme une panne.

**Étiquetage du simulé.** Toute donnée ou tout mécanisme de démonstration porte
un `<DemoBadge>` (politique X5). Le simulé n'est jamais présenté comme réel.

---

## 14. Gouvernance

### 14.1 `npm run ds:check` — le garde-fou

Anciennement `md3:check`. Renommé avec le passage au design system
propriétaire ; le script est `scripts/check-ds-compliance.mjs`, et il est
**bloquant en CI**.

**Périmètre : `src/**` en entier**, plus `index.html`. Avant la v1, les règles
de couleur ne couvraient que `src/components/**` — `features/` y échappait, et
c'est précisément là que vivaient les **six seuls écarts** du dépôt
(`LoginPage`). Une règle qui ne s'applique qu'aux fichiers déjà conformes ne
garde rien.

**Ce qui bloque :**

1. Classes héritées purgées du pont Tailwind (`*-dark`, `surface-subtle`,
   `rounded-pill`, `duration-micro/macro`, `variant="outline"`).
2. Rayons hors échelle 2/4/8/full (`rounded` nu, `rounded-2xl`, `rounded-3xl`).
3. Jaune/ambre Tailwind brut — la marque passe par les tokens, `warning` est
   orange.
4. Palette Tailwind nommée, `bg-white` / `text-black` **opaques** (les overlays
   alpha `bg-white/5` restent permis).
5. **Couleurs hex en dur — sans liste d'exception.** Les valeurs brutes vivent
   dans `index.css`, qui est hors de `src/`.
6. Contrôles natifs (`<button>`, `<input>`…) hors de `src/components/ui/**`.
7. Tailwind par CDN ou config inline dans `index.html`.

**Ce qui avertit sans bloquer :** `title=` porteur d'information seule (§11.3).
Le script ne regarde que les balises **natives** — sur un composant React,
`title` est une prop affichée (`<Modal title>`), rien à voir avec l'attribut
HTML — et exempte les deux formes de redondance : présence d'un `aria-label`
sur la même balise, ou troncature (`truncate` / `line-clamp-*`) dont le `title`
restitue la version complète. C'est un avertissement parce que la redondance
« libellé visible juste à côté » n'est pas décidable lexicalement ; ce cas vit
dans une liste d'exceptions nommée, à justifier en revue.

Les autres gardes restent inchangées et s'enchaînent dans **`npm run lint:ds`** :
`lint` · `ds:check` · `check:encoding` · `check:cn-merge` · `check:tokens`.

### 14.2 La galerie — `#/dev/design-system`

Vitrine vivante des 39 primitives, **montée uniquement en développement**.
Fichier : `src/features/dev/pages/DesignSystemGalleryPage.tsx`, branchée dans
`App.tsx` **avant** l'arbre de providers et avant la porte d'authentification :
elle n'instancie que des primitives, ne lit aucune donnée métier, et reste
consultable sans session.

**Elle n'illustre rien : elle instancie.** Ce qu'elle affiche est, par
construction, ce que l'application affiche. Elle est d'ailleurs soumise à
`ds:check` comme le reste de `src/**` — la vitrine se plie aux règles qu'elle
expose.

**Ce qu'elle peut montrer, et ce qu'elle ne peut pas.** Les états pilotés par
une prop (repos, sélectionné, désactivé, chargement, erreur) sont rendus côte à
côte. `hover` / `focus-visible` / `pressed` sont des états du **pointeur** et du
**clavier** : ils ne se figent pas dans le balisage. Les blocs concernés portent
la mention « à exercer ».

**Détail d'implémentation qui compte** : le `import()` est placé **dans** la
condition `import.meta.env.DEV`, pas seulement son usage. Un `lazy()` au niveau
du module faisait émettre le chunk quand même — 37 ko de code mort mesurés dans
`dist/`. Avec la condition, la branche entière disparaît du build de production.

**Son premier apport, le jour de sa mise en service** : elle a révélé que
`Modal` et `SideSheet` ne se fermaient plus (§10.4). Le défaut était invisible
en revue de code et absent des références visuelles — qui ne photographient que
des boîtes **fermées**.

### 14.3 « Terminé » pour un composant du DS

Un composant n'entre pas dans `src/components/ui/**` — et n'y est pas modifié —
sans les cinq points suivants. Ils sont cumulatifs.

1. **États complets.** Les sept états de §10.1 sont soit implémentés avec les
   tokens sémantiques, soit **explicitement non applicables**, avec la raison
   écrite dans la matrice §10.3. « Pas eu le temps » n'est pas « non
   applicable ».
2. **Documentation.** Une ligne dans la matrice §10.3 ; un JSDoc en tête de
   fichier qui dit *quand* employer le composant — et, s'il ressemble à un
   autre, ce qui les sépare (§11) ; toute exception au DS justifiée sur place.
3. **Accessibilité.** Focus visible au clavier (anneau opaque, jamais
   `outline: none` seul) ; nom accessible pour toute cible sans texte visible
   (`aria-label` — obligatoire par le type sur `IconButton`) ; état vocalisé
   (`aria-pressed`, `aria-selected`, `aria-invalid`, `aria-busy`) ; contraste
   AA vérifié **contre le fond réel**, pas contre un blanc théorique ; cible
   tactile ≥ 48 px (§12.3) ; navigation clavier complète pour tout composant
   composite (flèches, Origine/Fin, Échap).
4. **Référence visuelle.** `npm run qa:visual:auto` passé, et **chaque**
   différence imputée : soit attendue et re-baselinée (`qa:visual:update`), soit
   expliquée. Le seuil de 0,05 % ne prouve pas l'égalité au pixel — une dette
   chromatique y est déjà passée inaperçue pendant deux semaines. Quand le
   changement touche un token, contrôler au pixel les checkpoints déclarés
   « match ».
5. **`npm run lint:ds` au vert**, avertissements `title=` compris : chacun est
   soit corrigé, soit inscrit dans la liste d'exceptions avec sa justification.

Et la contrepartie : **une entrée dans `DESIGN_SYSTEM_CHANGELOG.md`.** Un
changement de composant qui n'y figure pas est, du point de vue du DS, un
changement qui n'a pas eu lieu.
