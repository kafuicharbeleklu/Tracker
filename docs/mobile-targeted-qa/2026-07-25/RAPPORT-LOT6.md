# Lot 6 mobile — constat #15 (§4.2) : éliminer la cause des surcharges `!`

**Date :** 2026-07-25
**Périmètre :** AUDIT_MOBILE.md §4.2, constat #15 — « ~1004 préfixes `!` dans le JSX, concentrés sur les boutons de nav qui neutralisent les styles de `Button` ».
**Objectif :** supprimer la *cause* (des primitives qui n'expriment pas ce dont les appelants ont besoin), pas les symptômes.

---

## 0. Le chiffre du constat était faux — et de beaucoup

Le `~1004` de l'audit compte tous les `!` du JSX, **y compris les négations JavaScript** (`if (!user)`, `!allowed`, `!isCollapsed`…). Un `grep` naïf en donne 1110 sur `src/` ; les classes Tailwind réelles, mesurées en ne comptant que les tokens situés **dans un littéral de chaîne** et dont la forme est une classe (tiret, deux-points, slash ou valeur arbitraire), sont **381**.

| Mesure | Valeur |
|---|---|
| `grep` naïf de `!` (audit) | ~1004–1110 |
| Préfixes `!` Tailwind réels — **avant** | **381** |
| Préfixes `!` Tailwind réels — **après** | **4** |
| **Réduction** | **−98,9 %** (objectif : ≥ 80 %) |

C'est le **troisième** constat de l'audit surévalué après §5-Finances et `ModelDetailsPage` (#12) : le compteur est joint (`scripts/`-hors-dépôt, cf. §7) pour que la mesure soit rejouable.

---

## 1. Analyse — ce que la nav combattait réellement

### 1.1 Un fait structurant : `!` n'est pas redondant avec tailwind-merge

`cn()` est un `twMerge` étendu depuis L1 (`af5405f`), et la tentation était de conclure que tous les `!` étaient devenus inutiles. **Faux, et c'est mesuré :** tailwind-merge ne reconnaît **pas** la forme préfixe v3 `!px-0` (il ne connaît que le suffixe v4 `px-0!`). Il la traite en classe inconnue et la laisse passer :

```
cn('px-4 py-2', '!px-0 !py-0')  ->  "px-4 py-2 !px-0 !py-0"      (les 4 émises)
cn('px-4 py-2',  'px-0  py-0')  ->  "px-0 py-0"                   (dédoublonnées)
```

Les deux rendus sont identiques (dans un cas `!important` tranche, dans l'autre twMerge a déjà supprimé le perdant), mais **le premier émet des règles mortes**. C'est exactement ce que documente la sonde existante `check-cn-merge` (« une classe `!` ne supprime pas la non-`!` »). Chaque suppression a donc été validée classe par classe, pas supposée.

### 1.2 Les 5 familles de styles que la nav neutralise

Union des classes fournies par `Button` et re-spécifiées par la barre, le rail et le tiroir :

| Famille | Classes de `Button` combattues |
|---|---|
| **Géométrie / espacement** | `px-4 py-2`, `px-3 py-1.5`, `min-h-10`, `min-h-8`, `min-w-10`, `gap-2`, `gap-1.5` |
| **Direction du flux** | `inline-flex` (→ `flex-col` en barre/rail, `flex` en tiroir) |
| **Couleurs de variante** | `text-text-secondary`, `bg-transparent`, `hover:bg-surface-container`, `hover:text-on-surface` |
| **Anneau de focus** | `focus-visible:ring-focus-ring` (anthracite, invisible sur la sidebar sombre) |
| **Motion** | `transition-[color,background-color,box-shadow,…]` (→ `transition-all`) |

### 1.3 Taux de neutralisation par composant cible

Part des classes fournies par `Button` dont le groupe de propriétés est re-spécifié par l'appelant :

| Composant cible | `!` | Taux | Décision |
|---|---:|---:|---|
| `SidebarItem` (tiroir) | 34 | **33 %** | **composant autonome** |
| `NavigationRail` / `RailItem` | 33 | **30 %** | **composant autonome** |
| `NavigationBar` / `NavItem` | 15 | **23 %** | **composant autonome** |
| `Sidebar` / bascule de repli | 11 | **33 %** | variante `Button variant="nav"` |
| `TopAppBar` / actions d'icône | 10 | **10 %** | prop `Button iconOnly` |
| `AddCategoryPage` / tuile de méthode | 34 | **24 %** | prop `Button layout="card"` |
| Assistants / tuile de choix | 41 + 36 | **15 %** | prop `Button layout="card"` |

**Le critère n'est pas le seul taux, c'est ce qui reste partagé.** Pour les trois surfaces de nav, le résidu se réduit à la sémantique `<button>`, au focus et aux états désactivés — trop peu pour justifier l'héritage, alors que le coût était de 82 `!`. Pour la bascule de la sidebar (33 % également), au contraire, tout le reste de `Button` sert : seule la **palette** change → une variante suffit. Même logique pour les tuiles : elles gardent la peau `outlined`, le focus, le disabled, l'`active:scale` ; seule la **mise en page** manque → une prop.

---

## 2. Ce qui a été livré

### 2.1 `src/components/ui/NavButton.tsx` — nouvelle primitive autonome

Ne wrappe plus `Button`. Trois presets (`surface="bar" | "rail" | "drawer"`) × `active` × `dense`, avec la géométrie, la palette, le focus et la motion propres à chaque surface. Migrés dessus : `NavigationBar.NavItem`, `NavigationRail.RailItem`, `SidebarItem` — **82 `!` supprimés, 0 introduit**.

Le composant vit dans `src/components/ui/` et non dans `layout/` : le garde-fou `md3:check` réserve les contrôles natifs (`<button>`) aux primitives du DS. C'est le contrôle qui a tranché l'emplacement, pas une préférence.

### 2.2 `Button` — `variant="nav"`, `iconOnly`, `layout="card"`

- **`variant="nav"`** — chrome posé sur surface **sombre** : `bg-transparent text-[var(--color-neutral-400)] hover:bg-white/5 hover:text-white focus-visible:ring-primary`. L'anneau `primary` est là parce que le token `focus-ring` (anthracite opaque) est invisible sur la sidebar.
- **`iconOnly`** — boîte carrée par `size` (`w-10 h-10 min-h-10 min-w-10 p-0`), pour les actions d'icône des barres d'application.
- **`layout="card"`** — `h-auto justify-start text-left` : la tuile de choix. Le fond, le rayon et le padding restent à l'appelant (ils varient d'une tuile à l'autre) ; ce qui est mutualisé, c'est ce que *toutes* neutralisaient.

### 2.3 `IconButton` — `variant="nav"`, `density`

- **`variant="nav"`** — pendant du précédent (bouton menu du rail).
- **`density="dense"`** — boîte 32 dp pour les actions en surimpression (effacer une signature). La hit-box tactile reste à 48 dp via `touch-target`.

### 2.4 `PageContainer` — prop `padding`

`padding="none"` pour les pages qui posent elles-mêmes leurs marges (mise en page à panneaux, en-tête collant). Sans cette porte de sortie, l'appelant devait neutraliser un padding **responsive**, ce qu'aucune classe non préfixée ne sait faire — d'où les `!` (voir §4.2, la seule régression du lot).

### 2.5 `cn()` — les espacements nommés déclarés à tailwind-merge

`p-card`, `px-page`, `p-page-sm`, `p-card-compact` étaient **invisibles** pour tailwind-merge : `p-card` et `px-4` ne se voyaient pas, les deux règles étaient émises et l'ordre du CSS tranchait — d'où des `!` de reprise en main. Les 4 tokens de `tailwind.config.js` sont désormais déclarés pour les familles `p*`, `m*` et `gap*` (`src/lib/utils.ts`), exactement comme l'étaient déjà le typescale et les élévations.

La sonde `scripts/check-cn-merge.mjs` gagne une **section 1c** qui vérifie la synchro `tailwind.config.js` ⇄ config twMerge (45 → **49 vérifications**). Un futur espacement nommé ajouté sans déclaration fera échouer le CI.

---

## 3. Résultat : les 4 `!` survivants

Tous concentrés sur **un seul mécanisme**, et tous justifiés :

| Site | `!` | Justification |
|---|---|---|
| `AddEquipmentPage.tsx:323` | `!text-label-small` | **No-op silencieux à conserver.** `.text-label-small` est une classe écrite à la main dans `index.css`, pas un utilitaire Tailwind : Tailwind **n'émet aucune règle** `.\!text-label-small` (vérifié dans le CSS construit : `plain=1, bang=0`). Retirer le `!` *activerait* le typescale — un changement visuel, pas un nettoyage. À traiter dans un lot dédié avec re-baseline. |
| `AddEquipmentPage.tsx:453` | `!text-label-small` | idem |
| `SettingsPage.tsx:385` | `!text-title-small` | idem (`plain=1, bang=0`) |
| `SettingsPage.tsx:385` | `!font-medium` | **Porteur.** Il bat `.text-label-medium`, classe d'`index.css` déclarée **hors `@layer`** : une règle non-layered l'emporte sur tout utilitaire Tailwind (layered) à spécificité égale. Seul `!important` reprend la main. Vérifié : `plain=1, **bang=1**` — la règle importante existe bel et bien. |

**Piège Tailwind v4 (point 4 de la commande) :** aucune correction n'a introduit la forme `!variant:` (no-op silencieux). Vérifié par `grep` : 0 occurrence de `!<variante>:` dans `src/` — et 0 occurrence de la forme `variante:!` également, toutes ayant été éliminées.

---

## 4. Vérifications

| Contrôle | Résultat |
|---|---|
| **Références visuelles Playwright** (compact / medium / expanded × 13 checkpoints) | voir §4.1 |
| `npm run lint` (`--max-warnings 0`) | ✅ |
| `npm run md3:check` | ✅ |
| `npm run check:encoding` | ✅ |
| `npm run check:cn-merge` | ✅ 49 vérifications |
| `npm run build` | ✅ |
| Compte des `!` avant/après | 381 → 4 (**−98,9 %**) |
| Audit « négations JS intactes » | ✅ 0 régression |

### 4.1 Protocole d'imputation

Un **run témoin a été exécuté avant toute modification** (l'arbre portait déjà les lots 4–5 non commités) : **36/39 `match`, 3 `changed` = Dashboard × 3**, l'instabilité documentée. Le run final est comparé à ce témoin, **checkpoint par checkpoint et au sha256** — le seuil de 0,05 % du script ne vaut pas preuve pixel (dette émeraude, §11).

| Run | `match` | `changed` | Détail |
|---|---:|---:|---|
| **Témoin** (avant toute modification) | 36/39 | 3 | Dashboard × 3 |
| **Final** | **36/39** | **3** | Dashboard × 3 |

**Nouveaux écarts par rapport au témoin : AUCUN.** Les 3 `changed` sont exactement les mêmes checkpoints qu'avant intervention.

Contrôle **au sha256** (le seuil de 0,05 % ne suffit pas) : **36/39 hashes strictement identiques** au témoin. Les 3 restants :

- `medium/dashboard` et `expanded/dashboard` — déjà `changed` dans le témoin (instabilité connue) ;
- `expanded/finance` — `match` dans les deux runs, hash différent sous le seuil : bruit d'anticrénelage / dérive de la fonte Google non épinglée, sans rapport avec le lot (aucune de ses classes n'a été touchée).


### 4.2 Une régression trouvée et corrigée en cours de route

Le premier run complet après migration a fait apparaître **2 écarts nouveaux : Settings en medium et expanded** (compact intact) — la colonne des sections décalée de 24 px vers la gauche. Deux mécanismes se sont additionnés, sur les deux `PageContainer` de la page :

```
PageContainer  ->  "p-page-sm medium:p-page pb-10"
call-site      ->  "!p-0 md:!px-page"   (avant)
```

1. **Une classe non préfixée ne neutralise pas une variante responsive.** `!p-0`, étant `!important`, écrasait aussi `medium:p-page` et `pb-10`. Retirer le `!` laisse `p-0` sans prise sur `medium:p-page` : le padding réapparaît au-delà de 600 px.
2. **L'ordre d'émission des breakpoints n'est pas celui qu'on croit.** Première tentative de correction : `p-0 medium:p-0 md:px-page` — elle a *empiré* les choses. Tailwind v4 conserve ses breakpoints natifs (`md` = 768 px existe bel et bien, vérifié : le sélecteur `.md\:px-page` est présent dans le CSS construit) **et** émet les breakpoints personnalisés du projet **après** eux. `medium:p-0` (600 px) l'emportait donc sur `md:px-page` (768 px) malgré une borne inférieure — l'inverse de l'intuition.

**Correction retenue — la cause, pas le symptôme :** `PageContainer` imposait un padding responsive *sans porte de sortie*. Il reçoit une prop `padding="none"`, et les deux appels de `SettingsPage` déclarent leur intention au lieu de la combattre. Zéro `!`, zéro classe de neutralisation, et **iso-rendu vérifié** (Settings `match` sur les 3 appareils).

**Généralisation :** un audit croisé (sites dé-`!` × primitives portant des utilitaires responsives) n'a trouvé que ces 2 sites dans tout le dépôt. Règle à retenir : *une classe non préfixée ne neutralise pas une variante responsive de la primitive* — si le besoin existe, c'est à la primitive d'exposer l'option.

---

## 5. Écarts de comportement assumés

Trois changements ne sont pas des iso-rendus. Aucun n'est capturé par les références (survol / tiroir mobile), tous sont volontaires.

1. **Survol des destinations ACTIVES du rail et du tiroir.** Elles héritaient de `Button variant="text"` un `hover:bg-surface-container` / `hover:text-on-surface` — des tokens de surface **claire**, appliqués sur le fond **sombre** du rail. Survoler l'élément actif l'éclaircissait. `NavButton` passe aux tokens de la surface sombre (`hover:bg-white/5` au rail, `hover:bg-primary-hover` au tiroir). Figer ce défaut dans la nouvelle primitive aurait été contraire à l'objet du lot.
2. **`CloseButton`.** Son `!text-on-surface-variant` battait aussi le `className` de l'appelant : la sidebar mobile demandait `text-[var(--color-neutral-400)]` sans jamais l'obtenir. La couleur devient un **défaut** (non important) ; l'appelant obtient enfin ce qu'il écrit.
3. **Classes mortes non ré-émises.** `NavButton` n'émet plus `px-0`, `py-0`, `min-h-0`, `border-none`, `shadow-none`, `min-w-10`, `group` : toutes étaient sans effet (le preflight Tailwind met déjà `padding: 0` sur `button` — vérifié dans le CSS construit ; `min-w-10` est inerte face à `w-12`/`w-20`/`w-full` ; aucun sélecteur `group-*` dans les enfants).

---

## 6. Défauts latents découverts (hors périmètre, non corrigés)

Signalés sans les traiter — chacun demande une décision produit et un re-baseline :

1. **`!text-label-small` / `!text-title-small` = no-op silencieux.** Deuxième famille de no-op après `!variant:`, et plus insidieuse : mettre un `!` sur une classe maison d'`index.css` ne produit **rien** (Tailwind n'émet la variante importante que pour les utilitaires qu'il possède). 3 sites, 3 typescales qui ne s'appliquent pas.
2. **Token `notebook-success` inexistant.** `UserDetailsPage.tsx:790/805/839` utilise `bg-notebook-success/10`, `text-notebook-success`, `border-notebook-success/40` : absent de `tailwind.config.js` **et** d'`index.css` → **0 règle** dans le CSS construit. Ces états n'ont aucune couleur.
3. **Deux vocabulaires de breakpoints cohabitent.** `theme.screens` du config JS n'**écrase pas** les breakpoints natifs de Tailwind v4 : `sm/md/lg/…` restent disponibles à côté de `compact/medium/expanded/large/extra-large`, et les personnalisés sont émis **après** les natifs. `SettingsPage.tsx:362` mélange les deux (`md:px-page` au milieu de classes `expanded:`), ce qui rend l'ordre de cascade contre-intuitif (cf. §4.2). À uniformiser sur le vocabulaire du projet — avec re-baseline, car `md` (768) et `medium` (600) ne couvrent pas la même plage.
4. **`font-bold` de `Button` est inopérant.** `.text-label-*`/`.text-title-*` étant hors `@layer`, elles gagnent : le poids réel des libellés de bouton vient du typescale, pas de `font-bold`. Cohérent visuellement aujourd'hui, mais la classe ment.

---

## 7. Outillage de la mesure

Trois sondes jetables (hors dépôt, dans le scratchpad de session) ont servi à ne rien supposer :

- **compteur de `!`** conscient des littéraux de chaîne (exclut les négations JS et les accès indexés `!items[i]`) ;
- **discriminateur twMerge** — `cn(t + ' ' + t) === t` distingue les classes dont twMerge connaît le groupe (104 sur 111) de celles qu'il ignore (`duration-short4`, `ease-emphasized`, `p-card`, `px-page`), pour lesquelles le `!` pouvait être porteur ;
- **oracle de cascade** — rejoue `!` = même règle + `!important`, et compare le jeu de classes **effectif** avant/après pour chaque état de chaque composant migré (10 états de nav + le chrome). C'est lui qui a garanti l'iso-rendu avant même la première capture.

Ils ne sont pas versionnés : la sonde pérenne, elle, est `check-cn-merge` (section 1c ajoutée).
