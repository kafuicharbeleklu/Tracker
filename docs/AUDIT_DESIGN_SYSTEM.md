# Audit — Design System propriétaire Tracker (Chantier B · v2)

> **v2 — remise à jour sur l'état réel du dépôt.** Palette consolidée + mesures en rendu réel, constats composants, verdict garde-fou CI. ~~Aucune refonte avant validation.~~ **Validé et exécuté le 2026-07-16** — verdicts en §9, registre d'exécution et re-mesures en §10.
> Date : 2026-07-16 · Branche : `main` (HEAD `27eaf54`) · Remplace la v1 du 2026-06-30.
> La v1 a été **largement exécutée** depuis (commit `6efe3be`, 2026-07-08 — cf. §2.2) : ce document ne repart pas du diagnostic v1 mais de **l'état implémenté**, et propose ce qui reste à trancher/corriger.
> Contexte aval : la validation de la palette débloque **X7** (Chantier C, en attente).

---

## 1. Résumé exécutif

L'essentiel de la direction v1 est **en production** : jaune `#FDC910` primaire (noir-sur-jaune mesuré **11,22:1**), neutres chauds ancrés sur le noir CAT, warning orange, sélecteur d'accent retiré, `md3Theme.ts` supprimé, garde-fou CI adapté. Les composants `ui/` sont propres au scan (0 hex en dur, 0 classe Tailwind couleur brute).

Ce qui reste, mesuré et localisé :

1. **Les 4 bases sémantiques échouent en contraste** là où elles servent de texte ou de fond rempli : succès `#10b981` → **2,54:1**, danger `#ef4444` → **3,76:1**, info `#3b82f6` → **3,68:1** (cible 4,5). Ce sont des valeurs Tailwind par défaut, jamais alignées sur la spec §2.4. **Proposition mesurée : succès `#047857` (5,48), danger `#DC2626` (4,83), info `#2563EB` (5,17)** — les paires light/strong des badges, elles, passent toutes (6,2–7,2:1) et ne bougent pas.
2. **Les deux idiomes de focus sont quasi invisibles** : ring jaune 20 % → **1,10:1**, ring noir 10 % (InputField) → **1,25:1** (cible 3:1). À unifier sur un indicateur opaque.
3. **Deux violations vivantes de la règle anti-collision / X12** dans `ui/` : `ConfirmationDialog` variante `warning` posée sur le **jaune de marque** (`bg-primary-container`), et `SelectFilter` ouvert qui passe son libellé en **texte jaune sur fond clair** (1,55:1).
4. **Trois vocabulaires de tokens coexistent encore dans la librairie** (`bg-primary`, `bg-[var(--color-anthracite)]`, `bg-white`) et le fossile Amber (~370 lignes mortes en tête d'`index.css`, dont un bloc dark inopérant) reste la moitié du fichier de tokens.

---

## 2. Vérifications préalables (demandées avant toute proposition)

### 2.1 Logo — couleurs de marque confirmées contre le fichier réel

`src/assets/NEEMBA_LOGO.png` existe (627×168, ajouté par `6efe3be`). Échantillonnage pixel (comptage exhaustif) :

| Couleur | Hex | Pixels | Rôle |
|---|---|---|---|
| Jaune marque | **`#FDC910`** | 57 516 (dominant) | Bandeau Neemba + triangle CAT — **une seule teinte pour les deux marques** |
| Noir | **`#000000`** | 22 824 | Typo « Neemba », panneau CAT |
| Blanc | **`#FFFFFF`** | 14 166 | « CAT », respirations |

Le reste (`#FEFEFE`, `#FDC500`…) est de l'anti-aliasing. **Identique à la mesure Chantier C (X12)** — le `#FDC910` de la couche de tokens est le bon.

### 2.2 Historique de la colorimétrie — un seul rebrand, pas de revert

Historique complet de `index.css` / `tailwind.config.js` / `src/lib/md3Theme.ts` :

| Commit | Date | Contenu |
|---|---|---|
| `125a79e` | 2026-02-19 | Init : palette MD3 tonale **seed Amber `#FFC107`** + theming runtime (`md3Theme.ts`, accents yellow/blue/purple/emerald/orange, dark via `prefers-color-scheme`) |
| `6efe3be` | 2026-07-08 | **Le** rebrand Neemba/CAT : couche de tokens (ex-« SmartProcure compatibility layer ») en fin d'`index.css`, suppression de `md3Theme.ts`, light forcé (`DataContext` retire `.dark` + `colorScheme='light'`), logo/icône/manifest, Inter. C'est bien le commit « theme/rebrand » aperçu lors du nettoyage git de Chantier C (il embarque le travail de l'ère de l'audit du 07-02, committé le 08-07) |
| `47706d1` / `cb3d09d` | 2026-07-08 | Règle X12 dans la spec / fix mojibake — pas de changement de palette |

**Aucun revert nulle part** : `main` est la seule branche, le reflog ne contient que ces commits, le seul commit orphelin (`adbaaa6`) est un stash D19 sans rapport. Le souvenir « passage à plus foncé puis retour » correspond à deux épisodes réels **mais non commités séparément** :

- **La phase anthracite-primaire** : la direction v1 initiale faisait de l'anthracite (`#1F2227`/`#111315`) la couleur primaire (boutons sombres) et du jaune un simple accent. Elle a été **prévisualisée** (la spec garde la trace : Q-T2 « validé en preview », puis « **Plus de bascule vers l'anthracite-primaire en Étape 2** » et la mention « mis à jour : le jaune est primaire ») puis renversée en jaune-primaire **avant commit** — le tout squashé dans `6efe3be`, d'où l'absence de trace git. Vestige encore visible : le dégradé froid `#131517→#111315` en dur dans `Sidebar.tsx:211` / `NavigationRail.tsx:156` (cf. §6).
- **La mort du dark mode** : avant le 08-07, l'app honorait le thème sombre de l'OS (bloc `prefers-color-scheme: dark` + runtime). La couche de marque, inconditionnelle et placée après dans la cascade, **recouvre les 35 tokens que le bloc dark redéfinissait** (vérifié : recouvrement 35/35, zéro fuite) — sous un OS en sombre, l'app est passée de sombre à claire au rebrand.

**Conclusion stabilité** : l'état de départ est **stable depuis le 08-07** (une seule mutation de palette dans toute l'histoire du dépôt), mais il traîne ses fossiles (bloc Amber + bloc dark morts, vestiges anthracite froids).

---

## 3. Architecture de tokens — état réel

`index.css` (1 107 lignes, Tailwind v4 via **`@config "./tailwind.config.js"`** — pas de `@theme` ; les classes `primary`, `on-surface`… viennent de `tailwind.config.js → theme.extend.colors → var(--md-sys-*)`) :

| Zone | Lignes | État |
|---|---|---|
| Palette MD3 Amber (`--md-ref-palette-*` + assignations sys) | ~12–324 | **Morte** : chaque `--md-sys-color-*` est réassigné plus bas ; les `--md-ref-palette-*` ne sont plus référencés par rien de vivant |
| Bloc `@media (prefers-color-scheme: dark)` | ~325–381 | **Mort** (recouvert 35/35 par la couche marque + light forcé dans `DataContext.tsx:878-882`) |
| Typescale / state-layers / utilitaires | ~382–857 | Vivant |
| **Couche de marque CAT** (ex-« SmartProcure ») | 858–1107 | **Source de vérité effective** : `--cat-yellow/--cat-black`, `--color-*` (neutres chauds, sémantiques, sidebar), réassignation de tous les `--md-sys-color-*`, rayons, typescale compacte |

Conséquences : (a) toute lecture « naïve » du haut du fichier ment sur les couleurs réelles ; (b) deux définitions de chaque token sys (la cascade départage) ; (c) le vocabulaire *composant* mélange trois accès — classes tokenisées (`bg-primary`), valeurs arbitraires (`bg-[var(--color-anthracite)]`), Tailwind brut (`bg-white`).

Périmé au passage : `CLAUDE.md` référence encore `src/lib/md3Theme.ts` (supprimé) ; `@material/material-color-utilities` est une **dépendance morte** dans `package.json` ; `AppSettings.theme` (`'light'|'dark'|'system'`) est un champ sans UI ni effet.

---

## 4. Palette v2 (proposition à valider)

Principe : **on ne redessine pas ce qui est validé en production** (marque, neutres chauds, containers) ; on **complète le niveau référence, on corrige les 4 bases sémantiques et le focus**, mesures à l'appui. Les noms de rôles (`primary`, `on-surface`, `surface-container`…) sont conservés — c'est la valeur qui change, pas le vocabulaire.

### 4.1 Méthode de mesure (rendu réel)

Sonde Playwright sur l'app réelle (`npm run dev`, Chromium) : swatches injectés dans la page pour que le navigateur résolve la **cascade réelle d'`index.css`** (var(), calques alpha composités), fond échantillonné **au pixel** sur screenshot, texte lu en `getComputedStyle` et composité si alpha, ratio WCAG 2.1. Sanity-check : la paire noir-sur-jaune ressort à **11,22:1**, identique à la mesure X12 de Chantier C (11,2:1).

### 4.2 Marque (inchangé — validé, mesuré)

| Token | Hex | Mesure | Verdict |
|---|---|---|---|
| `--cat-yellow` / `--color-brand` / primaire | `#FDC910` | noir `#1A1A1A` dessus : **11,22:1** | ✅ AAA |
| `--color-brand-hover` | `#E3B40C` | noir dessus : **8,95:1** | ✅ |
| `--color-brand-dark` (active) | `#B88E09` | (état pressé, texte noir) | ✅ conservé — trancher une fois pour toutes vs `#C39A09` de la v1 : **on garde `#B88E09`** (implémenté) |
| `primary-container` / `on-primary-container` | `#FFF4B8` / `#2F2500` | **13,63:1** | ✅ |
| Mise en avant `bg-primary/10` + `on-primary-container` | composite mesuré | **14,40:1** | ✅ idiome X12 lot 1 confirmé |
| Échelle référence complète `--ref-brand-50..700` (spec §2.1) | `#FFF9E6 → #B88E09` | — | À matérialiser dans `index.css` (aujourd'hui seuls 500/600/700 existent, sous d'autres noms) |

**Interdits X12 re-mesurés** (inchangés) : jaune texte sur blanc **1,55:1** ; jaune glyphe seul **1,55:1** (< 3:1) ; le « filet » jaune (border-l-4) reste **décoratif** — toujours doublé d'un indice sombre.

### 4.3 Neutres chauds (inchangés — validés, mesurés)

Rampe implémentée `--color-neutral-50..900` (`#FAF9F7 → #1C1917`, 800 = CAT Black `#2E2725`) conservée telle quelle. Mesures des rôles texte :

| Rôle | Valeur | Sur | Mesure | Verdict |
|---|---|---|---|---|
| `on-surface` | `#1C1917` | surface `#FFFFFF` / background `#FAF9F7` | **17,49 / 16,62:1** | ✅ |
| `on-surface-variant` | `#6E675F` | surface / surface-container `#F4F2EF` | **5,57 / 4,99:1** | ✅ |
| `text-secondary` | `#57514A` | surface | **7,83:1** | ✅ |
| Label InputField | `#79736B` (neutral-500) | surface | **4,69:1** | ⚠️ passe de justesse — **proposer neutral-600 `#57514A`** (7,83:1), ce qui résorbe aussi la divergence de vocabulaire (cf. §6) |
| Placeholder | `#A8A199` (neutral-400) | surface | **2,55:1** | ❌ — proposer **neutral-500 `#79736B`** (4,69:1) pour les placeholders porteurs d'exemple |
| `outline` (bordures contrôles) | `#8E877E` | surface | **3,55:1** | ✅ ≥ 3:1 non-texte |
| `outline-variant` (séparateurs) | `#E8E4DF` | surface | 1,27:1 | — décoratif, assumé |
| Désactivé `on-surface/38%` | composite | 2,37:1 | — exempt WCAG, mesure pour mémoire |

### 4.4 Sémantiques — **le cœur de la v2** (bases corrigées, paires badges conservées)

Les paires *light/strong* (badges, l'usage dominant) **passent toutes et ne changent pas** : succès 6,29:1, warning 6,28:1, danger 6,80:1, info 7,15:1.

Les **bases** actuelles sont des valeurs Tailwind (`emerald/red/blue-500`) jamais alignées sur la spec §2.4, et échouent partout où elles portent du texte ou un fond rempli :

| Rôle | Base actuelle | Mesure texte/blanc | Mesure blanc/rempli | **Base proposée** | Mesures (texte/blanc · blanc/rempli) |
|---|---|---|---|---|---|
| Succès (`--color-success`, alias `tertiary`) | `#10b981` | **2,54** ❌ | **2,54** ❌ | **`#047857`** | **5,48 ✅ · 5,48 ✅** |
| Danger (`--color-danger`, alias `error`) | `#ef4444` | **3,76** ❌ | **3,76** ❌ (Button danger) | **`#DC2626`** | **4,83 ✅ · 4,83 ✅** |
| Info (`--color-info`) | `#3b82f6` | **3,68** ❌ | **3,68** ❌ | **`#2563EB`** | **5,17 ✅ · 5,17 ✅** |
| Warning (`--color-warning`) | `#E8710A` | glyphe : 3,09 ✅ (limite) | texte sombre dessus : 5,63 ✅ | **inchangé** — mais le warning *texte inline* passe par `warning-strong #9A3412` (ou `#C2410C`, mesuré 5,18) | — |

Notes : les valeurs de la spec §2.4 ont aussi été mesurées — succès `#1E8E3E` **échoue** (4,21), info `#1A73E8` passe de justesse (4,51), danger `#D32F2F` passe (4,98). Les propositions ci-dessus dominent sur les deux faces (texte et rempli) tout en restant dans les teintes actuelles — migration quasi invisible sur les badges (light/strong intacts), visible uniquement sur tendances/montants/liens/boutons remplis, précisément là où c'est aujourd'hui illisible. La distance de teinte au jaune marque est préservée (aucun ambre).

### 4.5 Focus (nouveau — unification nécessaire)

Deux idiomes coexistent, **tous deux invisibles au sens WCAG** (cible 3:1 vs l'état non focus) :

| Idiome actuel | Où | Mesure |
|---|---|---|
| `ring-2 ring-primary/20` (+ `border-primary`) | SelectField, TextArea, SelectFilter, Chip | ring seul : **1,10:1** ❌ (la bordure jaune 1px qui l'accompagne : 1,55:1) |
| `focus:ring-4 ring-black/10` + `border-black` | InputField | ring : **1,25:1** ❌ (la bordure noire porte tout) |

**Proposition** : un seul token `--color-focus-ring: var(--color-anthracite) #2E2725`, indicateur **opaque** 2px avec offset (`ring-2 ring-[--color-focus-ring] ring-offset-1`, ou `border` + `ring` sombres) sur tous les composants de saisie/interactifs. Noir chaud sur blanc ≥ 13:1, aucune mesure supplémentaire requise. Le jaune reste l'indicateur de **sélection** (rempli noir-sur-jaune), le focus clavier devient anthracite — deux états, deux codes visuels distincts (aujourd'hui confondus).

### 4.6 Dark (réservé, non activé — light-first maintenu)

Architecture conservée : seul le **niveau 2** (rôles) sera réassigné, le niveau 1 (référence) reste figé. Points déjà mesurés qui serviront tels quels en dark : jaune sur `#1C1917` **11,27:1** ✅ (Snackbar action, nav active), blanc sur `#1C1917` **17,49:1** ✅. Préalable de refonte : **exciser le bloc Amber + le bloc dark morts** (§3) pour que la future variante dark ait une seule cascade à réassigner, au lieu de trois.

---

## 5. Constats composants — `src/components/**` (51 fichiers : `ui/` 36, `layout/` 13, `modals/` 1, `security/` 1)

> Le « ~50 composants » de la v1 = `src/components/**`. Paysage acté depuis la v1 : `PageTabs` est l'unique tablist (9 consommateurs), `src/lib/reports.ts` existe, `ConfirmationOptions.confirmKeyword` a remplacé l'ancien mécanisme, `accentColor` a bien disparu.

### 5.1 Ce qui est propre (à préserver)

- **0 hex en dur, 0 classe Tailwind couleur brute, 0 échelle de gris froide** dans `ui/`, `modals/`, `security/` (scan complet).
- **Idiome « sélectionné » unifié et conforme X12** : `bg-primary text-on-primary` identique dans PageTabs, Pagination, SearchFilterBar, Chip, SegmentedButton, IconButton filled — noir-sur-jaune 11,22:1 partout.
- Scrim unique `bg-scrim/[0.32]` (Modal, BottomSheet, SideSheet) ; hiérarchie d'élévation cohérente (menu 3, sheets 2–4).
- Rayons : le rendu réel se réduit à **3 crans + full (2/4/8 px)** — les 10 classes `rounded-*` recensées convergent via les tokens. Incohérence résiduelle : le commentaire d'`index.css:922` annonce « 2/4/6/8 » mais `--radius-lg: 4px` (= md) et `--radius-2xl: 8px` (= xl) — le cran 6 n'existe pas ; vocabulaire redondant à assumer ou résorber, le rendu, lui, est cohérent.

### 5.2 P0 — contredit les règles du DS (à corriger dès validation)

| # | Constat | Preuve | Effet |
|---|---|---|---|
| C1 | **ConfirmationDialog `warning` sur le jaune de marque** : `iconBg: bg-primary-container` | `ConfirmationDialog.tsx:23-27` | Collision marque/alerte que le DS bannit explicitement (spec §2.4) ; doit passer sur `warning-light`/`warning-strong`. Sa variante `info` utilise `secondary-container` (gris) au lieu du bleu info — même famille |
| C2 | **SelectFilter ouvert = libellé jaune sur fond clair** : `border-primary text-primary` | `SelectFilter.tsx:167` | Violation X12 vivante (1,55:1) ; le libellé doit rester `on-surface`, le jaune porté par bordure/ring |
| C3 | **Focus quasi invisible** sur toute la famille champs + Chip | mesures §4.5 | Accessibilité clavier ; unifier sur le focus anthracite |
| C4 | **Bases sémantiques illisibles** partout où elles portent texte/rempli | mesures §4.4 ; `Button danger`, `text-tertiary` (tendances), liens info | Corrigé par la palette v2 (changement de valeur, zéro changement de code composant) |

### 5.3 P1 — divergences internes de la librairie

| # | Constat | Preuve |
|---|---|---|
| C5 | **Trois vocabulaires dans Button** : `filled` = tokens (`bg-primary`), `tonal` = arbitraire (`bg-[var(--color-anthracite)]` — et le nom « tonal » ne décrit plus un bouton sombre rempli), `outlined`/`elevated` = brut (`bg-white`) | `Button.tsx:28-33` |
| C6 | **InputField vit dans un autre système** que SelectField/TextArea : focus noir `ring-4` vs focus primaire `ring-2` ; labels `--color-neutral-500` vs `on-surface-variant` ailleurs ; tout le fichier en `text-[var(--color-*)]` | `InputField.tsx:118-234` vs `SelectField.tsx:229`, `TextArea.tsx:96` |
| C7 | **Carte de tons sémantiques dupliquée** dans Badge et StatusBadge (`variants` ≡ `TONE_CLASSES`) ; en outre les `label` de `STATUS_CONFIG` sont **morts** (le rendu passe par `getStatusLabel()` de businessRules) — double source dormante de libellés | `Badge.tsx:17-24`, `StatusBadge.tsx:32-38,88-99` |
| C8 | **Glyphe jaune seul comme feedback** (famille récurrente, X12 « jamais seul vecteur ») : chevron `group-hover:text-primary` (EntityRow:187), icônes hover (MetricCard:60,86 ; SearchFilterBar:56), `IconButton` standard `selected: text-primary` (le sélectionné n'est signalé QUE par le jaune, 1,55:1), FAB variante `surface` = `text-primary` sur container clair | `ui/` grep |
| C9 | **Sidebar/NavigationRail : dégradé anthracite froid en dur** `#131517→#111315` (vestige de la direction abandonnée, §2.2) posé PAR-DESSUS le token chaud `--color-sidebar-bg #1C1917` — le rendu réel est froid pendant que le système dit chaud ; blanchi via l'allowlist du garde-fou CI (§6) au lieu d'être tokenisé | `Sidebar.tsx:211`, `NavigationRail.tsx:156` |
| C10 | **« success » a deux noms** : Badge/StatusBadge disent `success-*`, Snackbar/tendances disent `tertiary` (mappé sur la même valeur). Cohérent visuellement, illisible lexicalement — choisir un axe (recommandé : `success` partout, `tertiary` en alias de compat) | `Snackbar.tsx:22-23,92` |
| C11 | Card : commentaire MD3 périmé (« surface-container-low + elevation-1 ») vs code (`bg-white` + `shadow-sm` non-token) ; Chip : commentaire « selected = secondary-container » vs code `bg-primary` | `Card.tsx:33,54-56`, `Chip.tsx:32,66` |

### 5.4 P2 — hygiène

- `ListActionFab` s'auto-force en `!bg-primary !text-on-primary` (!important) et gère son propre positionnement bottom (calc safe-area) en parallèle de `FabContainer` — deux systèmes de placement FAB.
- `DemoBadge` ≈ duplicata du Badge `default` ; `CloseButton` ≈ IconButton standard contraint.
- Dropdowns : `Menu` = `bg-surface-container`, SelectField/SelectFilter = `bg-surface` — deux fonds de menu.
- `SelectFilter.tsx:212` : coche de l'option sélectionnée en `text-on-primary` sur fond clair — rend noir par accident (le token signifie « texte sur jaune ») ; sémantique de token détournée.
- Durées d'animation encore en `duration-150/200/300` (19 occurrences `ui/`) à côté des tokens `duration-short*` utilisés ailleurs.
- Styles inline légitimes restants : `ListActionFab` (calc safe-area), `MaterialIcon` (font-variation dynamique), `WizardLayout` ; + les deux dégradés C9 (à tokeniser, eux).
- Fossiles hors composants : bloc Amber + bloc dark (§3), dépendance `@material/material-color-utilities`, champ `AppSettings.theme`, dossier vide `layout/Navigation/`, `CLAUDE.md` périmé sur `md3Theme.ts`/`@theme`.

---

## 6. Garde-fou CI — verdict : **ADAPTER (conserver bloquant), ne pas remplacer**

État réel de `scripts/check-md3-compliance.mjs` (142 l.) : linter de discipline tokens — interdits legacy (`text-dark`, `variant="outline"`…), **ban du jaune/ambre Tailwind brut** (ajouté à l'Étape 3 de la spec ✅), hex hors allowlist, contrôles natifs hors `ui/`. Workflow `md3-compliance.yml` : `md3:check` + build sur push/PR (+ job visuel Playwright sur PR).

| Décision | Détail |
|---|---|
| **Garder bloquant** | C'est le seul garde-fou couleur du dépôt et il a déjà empêché des régressions (zéro hex/brut dans `ui/`) |
| **Rétrécir l'allowlist hex** | `NavigationRail.tsx` et `Sidebar.tsx` y ont été ajoutés pour blanchir les dégradés froids C9 — tokeniser le dégradé (`--color-sidebar-gradient-*`) puis les retirer ; il ne doit rester que `LoginPage.tsx` (si toujours justifié) |
| **Élargir le ban Tailwind brut** | Aujourd'hui seuls `amber/yellow` sont interdits ; étendre à toute la palette nommée (`red/green/blue/gray/slate/…-NNN`) + `bg-white`/`text-black` dans `src/components/**` — actuellement 0 occurrence hors `bg-white`, c'est le moment de verrouiller |
| **Ajouter la sonde contraste** (proposition) | Le script de mesure §4.1 est rejouable ; en faire un `qa:contrast` sur les paires du §4 avec seuils — c'est le niveau de rigueur Linear/Stripe (jamais « recalculé de tête », toujours re-mesuré) |
| **Renommage** (`check-design-tokens.mjs` / `design-tokens.yml`) | Toujours optionnel — churn pur, à faire seulement si on touche au fichier pour l'élargissement ci-dessus |
| **`check:encoding` : intouchable** | Chaîné dans `lint:md3` (`package.json:16`) mais **sans lien avec MD3** — il survit tel quel quoi qu'on décide ici. Constat au passage : il ne tourne **pas** en CI (le workflow n'appelle que `md3:check`) — l'ajouter au job serait cohérent avec sa raison d'être (garde anti-mojibake née de `cb3d09d`) |

---

## 7. Niveau de finition — comparaison rigueur d'exécution (Linear / Notion / Stripe Dashboard)

Même grille que Chantier C : on compare la **rigueur**, pas l'identité visuelle.

**Au niveau** : discipline de tokens dans les composants (zéro valeur en dur — peu d'équipes y sont réellement) ; un idiome de sélection unique appliqué partout ; contrastes **mesurés au rendu** et consignés (la plupart des DS s'arrêtent au calcul sur hex) ; garde-fou bloquant en CI.

**Sous le niveau** — ce qui séparerait Tracker d'un Linear/Stripe en revue de design :
1. **Focus clavier invisible** (§4.5) — chez Stripe/Linear, l'indicateur de focus est un invariant non négociable, toujours opaque.
2. **Un composant, un système** : InputField dans un vocabulaire, SelectField dans un autre, Button dans trois (C5/C6) — la marque de fabrique de ces équipes est qu'un grep du même rôle retourne la même classe partout.
3. **Zéro fossile embarqué** : la moitié d'`index.css` est morte (§3) ; ces équipes suppriment le legacy dans le même commit que son remplacement.
4. **Les commentaires font foi** : trois commentaires de composants mentent sur le code (C11, radius §5.1) — un DS de référence traite un commentaire faux comme un bug.
5. **Sémantiques AA sur les deux faces** (texte et rempli) — corrigé par §4.4.

---

## 8. Plan proposé (après validation — rien n'est exécuté)

**Lot A — palette v2 (change 4 valeurs, débloque X7)** : bases sémantiques §4.4 + placeholder/label §4.3 dans la couche de marque ; aucune modification de composant (tout passe par les tokens). Re-mesure sonde + `qa:visual:update` (attendu : diffs sur tendances/boutons danger/liens info uniquement).
**Lot B — focus unifié** : token + migration des 5 composants de saisie + Chip (C3).
**Lot C — corrections P0 composants** : C1, C2 (2 fichiers).
**Lot D — excision des fossiles** : bloc Amber + bloc dark + dép morte + `AppSettings.theme` (~420 lignes en moins, `index.css` devient mono-couche) ; retrait allowlist + tokenisation dégradé sidebar (C9) ; alignement doc (`CLAUDE.md`).
**Lot E — convergence librairie** : C5–C8, C10, C11 (mécanique, guidée par grep).
**Lot F — CI** : élargissements §6.

## 9. Questions à trancher — **tranchées le 2026-07-16**

- **Q-V1** — Bases sémantiques : valides-tu **`#047857` / `#DC2626` / `#2563EB`** (mesures §4.4) ? (Alternative spec §2.4 : `#D32F2F` passe aussi ; `#1E8E3E` et `#1A73E8` sont éliminés/limites par la mesure.)
  **✅ Verdict : approuvé, les 3 valeurs mesurées.** Les paires light/strong des badges ne bougent pas.
- **Q-V2** — Focus anthracite opaque (§4.5) : OK, ou tu tiens à un focus jaune (il faudrait alors un jaune assombri dédié type `#B88E09`, à mesurer en ring) ?
  **✅ Verdict : approuvé** — focus anthracite opaque unifié, remplace les deux idiomes invisibles (ring jaune 20 %, ring noir 10 %). Sur surface sombre (sidebar/rail), l'indicateur reste le jaune **opaque** (11,3:1 sur `#1C1917`).
- **Q-V3** — Sidebar : on **tokenise le dégradé actuel** (rendu inchangé, froid) ou on **réaligne sur le noir chaud CAT** `#1C1917/#2E2725` (rendu légèrement plus chaud, cohérent marque) ?
  **✅ Verdict initial : réalignement sur les neutres chauds** — **révisé en cours d'exécution** : après aperçu, préférence pour **l'ancien rendu** du menu latéral → dégradé **tokenisé** (`--color-sidebar-gradient-*`, objectif CI atteint) mais **valeurs d'origine conservées** (`#131517→#111315`, option A). L'identité sombre froide du menu est donc désormais un **choix acté**, plus un vestige. Les gris de texte passent tout de même par la rampe (`--color-neutral-400`, visuellement identique au `neutral-400` Tailwind brut).
- **Q-V4** — `success` vs `tertiary` (C10) : un seul nom ? Lequel ?
  **✅ Verdict : les deux rôles restent distincts**, même s'ils se ressemblent dans certains cas — un statut doit rester non ambigu, pas juste un accent parmi d'autres. `success` = rôle de **statut** (badges, toasts, états validés) ; `tertiary` = rôle d'**accent** MD3, aujourd'hui adossé à la même valeur verte (`var(--color-success)`), libre de diverger plus tard. **Pas de renommage de masse** ; l'alias fait que la correction Q-V1 se propage aux deux.
- **Q-V5** — L'échelle `--ref-brand-50..400` (fonds jaunes très légers) : à matérialiser maintenant ou à la demande ?
  **✅ Verdict : échelle courte, à dessein** — 2-3 paliers utiles à l'accent/bordure/fond (`--ref-brand-50/100/200` de la spec §2.1), **pas** une échelle complète 50-900 : une échelle longue inviterait à utiliser le jaune plus largement que le rôle d'accent établi. Tout palier supplémentaire devra être justifié par un besoin concret avant implémentation.

**Décisions complémentaires (même date)** : les 2 P0 (C1, C2) sont des violations de règles déjà actées → corriger sans re-arbitrage ; la famille C8 « glyphe jaune seul » reçoit le traitement du Top 10 de Chantier C (libellés/glyphes en `on-surface`(-variant), jaune conservé en bordure/ring/fond) ; `check:encoding` doit tourner **en CI**, pas seulement dans `lint:md3` local ; garde-fou CI : allowlist hex rétrécie + ban Tailwind brut élargi comme proposé en §6.

## 10. Registre d'exécution (au fil de l'eau)

| # | Lot | Contenu | État |
|---|---|---|---|
| E1 | Lot A — palette v2 | Bases sémantiques `#047857/#DC2626/#2563EB` ; label InputField → neutral-600, placeholders → neutral-500/on-surface-variant plein ; échelle brand courte 50/100/200 (Q-V1/Q-V5) | ✅ `0f6dcec` |
| E2 | Lot B — focus | Token `--color-focus-ring` (anthracite opaque) + migration de tous les idiomes alpha (`ring-primary/10..40`, `ring-black/10`) et des rings jaunes opaques sur clair ; jaune opaque conservé sur surfaces sombres (Q-V2/C3) | ✅ `c9fcd95` + résiduels features `0615447` |
| E3 | Lot C — P0 | C1 ConfirmationDialog (warning → `warning-light/strong`, info → `info-light/strong`) ; C2 SelectFilter (libellé `on-surface`, jaune en bordure/ring) | ✅ `2c19758` |
| E4 | Famille C8 | Chevron EntityRow, icônes hover MetricCard/SearchFilterBar, IconButton standard selected + filled base, FAB `surface`, FileDropzone (hover jaune — même famille, découverte au balayage) | ✅ `2c19758` |
| E5 | Q-V3 — sidebar | Dégradé tokenisé, gris de texte → rampe chaude, retrait allowlist. **Révisé** : valeurs du dégradé revenues à `#131517→#111315` (préférence pour l'ancien rendu, option A) | ✅ `0ed75a0` révisé `944a431` |
| E6 | Hygiène tokens | `bg-white`/`text-black` opaques → `bg-surface`/`on-surface` dans `src/components/**` (préalable au ban CI ; overlays alpha conservés) | ✅ `ecb460d` |
| E7 | Lot F — CI | Allowlist hex réduite à LoginPage ; ban palette nommée + `bg-white`/`text-black` opaques sur `src/components/**` (détection vérifiée par injection) ; `check:encoding` dans le workflow | ✅ `13b1331` |
| E8 | Vérification | build + lint + md3:check ✅ ; sonde en rendu réel ✅ (détail ci-dessous) ; re-baseline visuel complet ✅ `cc8222a` (14 rafraîchies / 25 match ; approvals/locations/management/settings identiques sur 3 devices → sidebar et badges intacts ; solde aussi les 8 diffs hérités du seed D14) | ✅ |
| E9 | Lot D — excision des fossiles | Bloc Amber + bloc dark morts d'`index.css` (−333 l., le fichier passe à 813 l. mono-couche, `30c92f3`) ; dépendance morte `@material/material-color-utilities` + champ `AppSettings.theme` sans UI ni effet (`42dcaf3`) ; `CLAUDE.md` aligné (`ddfff1a`). **Mort vérifiée avant ET re-vérifiée après** : 0 référence à `--md-ref-palette-*`/`prefers-color-scheme`/la dépendance/`.theme` dans le code vivant ; cross-check exhaustif : chaque `var(--*)` consommé (config + CSS + src) a une définition dans `index.css`. Neutralité visuelle prouvée : suite complète re-jouée sur l'état post-excision **39/39 match** contre les baselines `cc8222a` posées avant (rapport `md3-visual-regression-results-2026-07-16`) ; build + lint + md3:check + check:encoding ✅ | ✅ `30c92f3`+`42dcaf3`+`ddfff1a`, vérifié 16-07 |
| E10 | X7 (Chantier C) — palette badges | Débloqué par Q-V1 (paires light/strong conservées) : vérifié **en rendu réel** (41 badges, 4 pages) — les 5 tons mesurent 6,28–7,15:1, neutral 15,65:1, valeurs identiques aux mesures §4.4. Découverte corrigée : pastille de comptage `PageTabs` (onglet actif) rendait warning-light au lieu de l'inverse noir/jaune voulu (`cn` sans tailwind-merge → l'override perdait la cascade) ; fix `!bg-on-primary !text-primary`, mesuré 11,22:1. X7 clos dans `AUDIT_UX_RESPONSIVE.md` §5/§7.1/§8 | ✅ 16-07 |
| E11 | Lot E — convergence librairie | **C5** Button : un seul vocabulaire tokenisé — tonal → `bg-anthracite`/`text-inverse-on-surface`, outlined/elevated → `bg-surface` + `border-outline-variant` + `hover:bg-background`, text → `text-text-secondary` ; tokens `anthracite`, `background`, `text-secondary` exposés dans `tailwind.config.js`. **C6** InputField : 13 valeurs arbitraires `[var(--color-*)]` → classes tokens, valeurs identiques sauf placeholders/icônes `#79736B`→`#6E675F` (convergence délibérée sur `on-surface-variant`, alignés SelectField/TextArea) ; label reste `#57514A` (décision E1) via `text-text-secondary` ; docstring réaligné. **C7** carte de tons unique `TONE_CLASSES` exportée par Badge et consommée par StatusBadge ; `label` morts de STATUS_CONFIG supprimés (le rendu passe par `getStatusLabel()` seul). **C10** clos **par décision Q-V4** (success = statut, tertiary = accent, pas de renommage) — aucun code. **C11** commentaires menteurs Card/Chip réécrits sur le code réel + Card convergé (9 arbitraires → tokens). **Découverte majeure en cours de route — collision de cascade** : l'ancien vocabulaire arbitraire était émis en *tête* de feuille CSS (toute surcharge call-site gagnait), le vocabulaire tokenisé sort *après* `text-error`/`on-surface-variant` → **19 des 26 call-sites de Button à surcharge couleur non-`!` basculaient** (13 boutons danger perdaient leur rouge — dont « Refuser » Approbations, confirmé au pixel — et 6 chromes fermer/retour glissaient de ton). Arbitré avec l'utilisateur : **`!` sur les 26 sites** (idiome du repo), cascade désormais déterministe ; hover non touchés (émis structurellement après les bases). Vérifié : 0 arbitraire dans `ui/` ; smoke rendu réel au pixel (tonal `#2E2725`/blanc, outlined `#1C1917`/`#E8E4DF`, text `#57514A`, label/placeholder/disabled conformes) ; **suite visuelle complète** : équivalence prouvée avec l'avant-Lot E par run témoin (seuls diffs = pastille E10 + dérive de fonte Google, cf. note) ; **a11y 16/16 Pass** ; re-baseline 5 checkpoints | ✅ `743eefe`+`7949998`, 16-07 |
| E12 | §11 L1+L2 — `tailwind-merge` dans `cn()` | **Feu vert utilisateur** : étude approuvée telle quelle, 3 lots dans l'ordre, les 26 `!` E11 conservés à l'adoption. **L1** (`af5405f`, 17-07) : `tailwind-merge@3.6.0` + `extendTailwindMerge` (typescale 15 → `font-size`, `shadow-elevation-0..5` → `shadow`), fix d'ordre `Menu.tsx:249` dans le même commit, sonde `scripts/check-cn-merge.mjs` (43 vérifs, synchro `index.css`/`tailwind.config.js`) chaînée dans `lint:md3`. **L2** (17/18-07) : suite visuelle complète — 15 checkpoints changés, **attribution pixel exhaustive a posteriori** (détail §11.8 : réparations merge vers l'intention écrite **au-delà des 6 listées**, dérive de fonte, flaky Dashboard, + **dette de baseline émeraude soldée**), re-baseline accepté puis re-vérifié **39/39 match** ; **sonde rendu réel 9/9** (les 6 no-ops §11.3 dont les 2 surprises EntityRow/SelectField + les 3 réparations découvertes) ; **a11y 16/16 Pass** (18-07) ; `lint:md3` ✅. **L3** (dépose des `!` utility-vs-utility) : différé, facultatif, non programmé — décision utilisateur | ✅ `af5405f` + re-baseline, 18-07 |

### 10.1 Re-mesures en rendu réel (sonde §4.1, cascade résolue dans l'app, 2026-07-16)

Tous les tokens résolvent aux valeurs attendues (swatches `var()` injectés, `getComputedStyle` — tout est opaque, pas de compositing en jeu) :

| Paire | Mesure | Attendu |
|---|---|---|
| noir sur jaune (`on-primary`/`primary`) | **11,22:1** | 11,22 — **inchangé** ✅ |
| `on-primary-container`/`primary-container` | **13,63:1** | 13,63 — **inchangé** ✅ |
| succès `#047857` texte/blanc · blanc/rempli | **5,48 · 5,48** | 5,48 ✅ (tertiary suit : 5,48) |
| danger `#DC2626` | **4,83 · 4,83** | 4,83 ✅ |
| info `#2563EB` | **5,17 · 5,17** | 5,17 ✅ |
| focus-ring `#2E2725` sur blanc | **14,65:1** | ≥ 13 ✅ — rendu réel vérifié : InputField focus = bordure + ring 2px `rgb(46,39,37)` opaques |
| label neutral-600 / placeholder neutral-500 | **7,83 / 4,69** | ✅ |
| texte sidebar `#A8A199` sur dégradé `#131517` | **7,17:1** | ✅ (jaune item actif : 11,80) |
| C2 SelectFilter ouvert (rendu réel) | libellé `#1C1917`, bordure+ring `#FDC910` opaques | ✅ plus de texte jaune |

CSS émis vérifié : `.ring-focus-ring`/`border-focus-ring` + variantes focus générées ; `focus-visible:!ring-primary` généré avec `!important` (l'ancienne forme `!focus-visible:*` de SidebarItem/RailItem **ne générait aucun CSS** — les items de sidebar n'avaient en réalité aucun indicateur de focus ; corrigé au passage). `ring-primary/20` restants = états de *sélection* d'AddCategoryPage (doublés bordure+fond+texte), hors périmètre focus.

### 10.2 Reliquats consignés à la clôture du Lot E (2026-07-16)

- **`layout/` parle encore le vocabulaire arbitraire** : 19 occurrences `[var(--color-*)]` dans 8 fichiers (NavigationBar ×5, Sidebar ×3, NavigationRail ×3, TopAppBar ×2, PageHeader ×2, AppLayout ×2, SidebarItem, BottomAppBar) — hors périmètre C5-C7/C10-C11, laissées sciemment (consigne : ne pas élargir sans arbitrage). Migration mécanique possible avec la même grille d'équivalences que C6, **mais** relire E11 d'abord : changer le vocabulaire déplace l'ordre d'émission CSS et peut faire basculer des surcharges non-`!`.
- **Roulette de cascade structurelle** : `cn()` est un simple join (pas de tailwind-merge) — deux utilitaires de même propriété sur un même élément se départagent à l'ordre d'émission de la feuille, pas à l'ordre d'écriture. Les 26 surcharges couleur des call-sites de Button sont désormais toutes en `!` (E11) et la pastille PageTabs aussi (E10), mais tout futur call-site non-`!` rejouera à la roulette. Piste durable : vrai `tailwind-merge` dans `cn()` (décision d'architecture non prise — dépendance nouvelle, comportement de tous les composants affecté, npm install fragile sur hgfs). **→ Adopté (L1 `af5405f`) et vérifié (L2) — E12 et §11.8. Reliquat restant : L3 (dépose des `!` utility-vs-utility), différé et facultatif.**
- **Dérive de fonte Google** : Material Symbols est chargée depuis fonts.googleapis.com au runtime ; le glyphe `task_alt` a changé de dessin entre deux runs du même jour (prouvé par run témoin sur code identique) et l'anti-aliasing du texte flappe avec. Baselines re-figées le 16-07 ; si le bruit revient, envisager l'auto-hébergement des fontes (pin de version).

## 11. Étude d'architecture — `tailwind-merge` dans `cn()` (2026-07-17, **aucune implémentation**)

Étude demandée suite au reliquat §10.2 « roulette de cascade » (deux morsures documentées : pastille PageTabs E10, 19/26 boutons E11). Toutes les affirmations ci-dessous sont **mesurées** : analyse statique des 196 appels croisée avec l'ordre d'émission du CSS compilé (`dist/` du 16-07, post-Lot E, seuls des commits docs depuis), et sonde empirique de `tailwind-merge@3.6.0` exécutée sur les combinaisons réelles du codebase.

### 11.1 Mécanisme actuel

`src/lib/utils.ts:5` : `cn = classes.filter(Boolean).join(' ')`. Le docstring prétend « lightweight replacement for clsx + tailwind-merge » — c'est faux, il n'y a **aucune** fusion. Aucune dépendance existante ne peut faire le travail : ni `clsx`, ni `classnames`, ni `tailwind-merge` nulle part (package.json, lock, node_modules vérifiés). La signature n'accepte que `string | undefined | null | false` — aucun call-site n'utilise la syntaxe objet de clsx, donc **clsx est inutile** : adopter tailwind-merge = envelopper la sortie du join dans `twMerge()`, signature inchangée.

**Rappel des trois étages de cascade de l'app** (indispensable pour cadrer ce que merge peut et ne peut pas faire) :
1. `!important` (les surcharges E10/E11) — gagne sur tout ;
2. **CSS non-layerisé d'`index.css`** (typescale `.text-title-medium`…, `.section-title`, `.state-layer`, `.duration-300`…) : Tailwind v4 émet ses utilities dans `@layer`, or le CSS hors layer prime sur tout CSS layerisé — ces classes maison battent donc *toute* utility non-`!`, quel que soit l'ordre ;
3. entre utilities : ordre d'émission de la feuille (= la roulette).

`tailwind-merge` n'agit **que sur l'étage 3**, et uniquement sur les chaînes qu'il sait classifier. Il ne remplace pas les `!` qui combattent l'étage 2.

### 11.2 Ampleur

- **196 appels `cn()` dans 65 fichiers** de `src/`.
- **49 sites font transiter un prop `className` par `cn`** (48 en dernière position — la position de merge par excellence) : Button, CloseButton, ListActionFab, MaterialIcon, SelectField, PageTabs, Toggle, SearchFilterBar, SelectFilter, MovementTimeline, Pagination, UserAvatar (ui/) + PageContainer et consorts (layout/).
- Button est la plus grosse surface : `cn(base, VARIANT_STYLES, SIZE_STYLES, className)` (`src/components/ui/Button.tsx:113`) — chaque call-site qui passe une couleur joue à la roulette (d'où E11).
- ≈ 49 call-sites en `features/` passent aujourd'hui des classes `!` via `className` (sur-ensemble des 26 Button consignés en E11).

### 11.3 Qui dépend de l'ordre actuel ? (analyse statique × CSS compilé)

Filtrage des 196 appels : paires de classes de **même groupe de propriété fin** (couleur-de-fond vs couleur-de-fond, etc.), **mêmes variantes**, pouvant **coexister sur le même élément** (gardes non exclusives) → **30 paires vraies**, triées par le gagnant réel dans la feuille compilée :

| Catégorie | Paires | Verdict sous merge |
|---|---|---|
| Déjà déterministes (`!`, Sidebar:245) | 5 | inchangé |
| Faux positifs (gardes mutuellement exclusives : SegmentedButton, Menu `text-error`, branches de ternaires) | 6 | inchangé |
| « Dernier écrit gagne déjà » (états disabled/error d'InputField/SelectField/TextArea, bordure EntityRow…) | 12 | inchangé — merge entérine ce qui marche par chance |
| **No-ops latents que merge réparerait** (le dernier écrit *devrait* gagner mais perd à l'émission) | **6** | **rendu change, vers l'intention écrite** |
| **Dépendance au bug dans le mauvais sens** (le premier écrit gagne et c'est l'intention) | **1** | **régression à corriger à l'adoption** |

**Les 6 no-ops latents actuellement en production** (même famille que la pastille PageTabs pré-X7) :
- `src/components/ui/EntityRow.tsx:70` — **la teinte de sélection des cartes ne s'applique pas** : `bg-surface` (base) est émis après `bg-primary-container/45` → une carte sélectionnée n'a que sa bordure primaire, pas de fond teinté. La variante *liste* teinte correctement (sa base n'a pas de `bg`).
- `src/components/ui/InputField.tsx:117` — le label d'un champ **désactivé** ne s'estompe pas : `text-text-secondary` bat `text-on-surface/[0.38]`. (Le même pattern en état *error* fonctionne, par chance d'émission — d'où l'asymétrie jamais remarquée.)
- `src/components/ui/SelectField.tsx:224` et `:232` (2 variantes) — la bordure **focus** reste `border-outline-variant` : `border-focus-ring` perd à l'émission, seul le `ring-2` marque le focus.
- `src/components/ui/Chip.tsx:52` — le hover d'un chip *filter* **sélectionné** rend `hover:bg-surface-container` (gris) au lieu de `hover:bg-primary/90`.
- `src/components/layout/Sidebar.tsx:245` — le chevron flottant (sidebar repliée) n'a pas son `shadow-md` : `shadow-none` (base) gagne. *(Réparé seulement avec la config étendue §11.4 — `shadow-elevation-*` doit être déclaré dans le groupe `shadow`.)*

**La régression (1 cas)** : `src/components/ui/Menu.tsx:249` — libellé d'item **désactivé** : `text-on-surface-variant` (arg 3, l'intention) gagne aujourd'hui parce qu'émis après `text-on-surface` (arg 5, branche else du ternaire destructive). Merge garde le **dernier écrit** → le gris serait perdu (l'`opacity-[0.38]` atténue encore, mais la couleur devient fausse). Correction d'une ligne (réordonner les args) à inclure dans le lot d'adoption.

Conclusion Q3 : oui, une chose dépend du comportement actuel (Menu, 1 ligne), et 6 rendus visibles changeraient — tous vers l'intention écrite dans le code, mais **diffs qa:visual attendus** → re-baseline obligatoire (synergie avec le re-baseline complet déjà dû côté Chantier D).

### 11.4 LE risque n° 1 — classification du vocabulaire maison (préalable non négociable)

Le typescale MD3 (15 classes `.text-display-large` … `.text-label-small`) est du **CSS maison hors layer** (`index.css`), pas des utilities — mais tailwind-merge ne voit que des chaînes, et par défaut classe tout `text-<inconnu>` comme **couleur**. Sonde mesurée sur `tailwind-merge@3.6.0` :

```
twMerge('min-h-8 px-3 py-1.5 text-label-medium gap-1.5 text-on-primary')
→ 'min-h-8 px-3 py-1.5 gap-1.5 text-on-primary'        // typescale AVALÉ
```

Dans Button, l'ordre réel est `VARIANT` (couleur) **puis** `SIZE` (typescale) : c'est donc la **couleur** qui serait supprimée — `twMerge('… text-on-primary …', '… text-label-large …')` garde le dernier → **tous les boutons filled perdraient `text-on-primary`**. Adoption naïve = casse silencieuse généralisée (812 usages typescale dans `src/`), avec ou sans `!` aux call-sites.

**Config corrective, validée par la même sonde (tous les cas passent)** :

```ts
extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [{ text: [/* les 15 noms du typescale */] }],
            shadow: [{ shadow: ['elevation-0', …, 'elevation-5'] }],
        },
    },
});
```

Vérifié sous config étendue : typescale + couleurs coexistent ; `shadow-none` vs `shadow-elevation-1` fusionne correctement (répare Sidebar:245) ; `text-[var(--color-*)]` (les 19 arbitraires de `layout/`, §10.2) est classé couleur et coexiste avec le typescale ; `text-[9px]` est bien classé taille. **Contrepartie** : cette config devient une surface de maintenance couplée à `index.css`/`tailwind.config.js` — toute future classe maison à préfixe utilitaire (`text-*`, `shadow-*`…) devra y être déclarée. Candidat garde-fou : étendre `md3:check` pour vérifier la synchro (même esprit que le ban hex).

### 11.5 Les `!` d'E10/E11 — recommandation (décision utilisateur)

Mesuré : merge **préserve** les classes non-importantes face à une `!` (pas d'interaction) → **garder tous les `!` à l'adoption garantit zéro diff de rendu imputable à leur retrait**. Ensuite, deux familles distinctes :

- **(a) `!` utility-vs-utility** (les 26 Button E11, pastille PageTabs E10) : redondants *en principe* une fois merge + config en place — le call-site écrit en dernier gagnerait structurellement. Leur dépose rendrait la garantie **structurelle** (ordre d'écriture) au lieu de **ponctuelle** (important), ce qui est plus sain à long terme — mais chaque retrait est un risque visuel à re-vérifier site par site.
- **(b) `!` qui combattent du CSS hors-utilities** (classes non-layerisées d'`index.css`, styles internes déjà `!` comme Sidebar:245) : merge **ne les remplace pas** (étage 2, §11.1) — à garder définitivement.

**Recommandation** : garder tous les `!` dans le lot d'adoption ; dépose de la famille (a) en lot différé, facultatif, avec vérification visuelle dédiée — jamais en même temps que l'adoption. Trancher famille par famille, pas en bloc.

### 11.6 Poids réel

- `tailwind-merge@3.6.0` : **zéro dépendance transitive, pur JS** (pas de binaire natif — l'install sur hgfs reste à faire avec le protocole habituel, risque faible).
- Mesuré avec l'esbuild du projet (bundle + minify, `twMerge` + `extendTailwindMerge`) : **27,98 kB min / 8,63 kB gzip**. Atterrit dans le chunk `vendor` (174,6 kB min aujourd'hui, soit ~+16 % de ce chunk ; comparaison : vendor-react 194,5 kB). Chunk critique, mais coût modeste à l'échelle de l'app.
- CPU : cache LRU intégré (500 entrées) ; 196 call-sites — négligeable.

### 11.7 Recommandation globale et plan (rien n'est exécuté)

**Adopter, mais uniquement avec la config étendue §11.4** — sans elle le risque est critique (prouvé), avec elle il est faible et borné aux 7 sites de §11.3. Alternatives écartées : statu quo + discipline `!` (chaque futur call-site rejoue la roulette — c'est le mode d'échec déjà documenté deux fois) ; mini-merge maison (c'est littéralement l'origine du problème, cf. docstring de `utils.ts`).

Plan proposé en 3 lots, chacun avec son gate :
1. **L1 — adoption** : dépendance + `cn()` = `twMerge(join)` avec config étendue + fix d'ordre Menu.tsx:249 + reproduction de la sonde §11.4 en script de fumée ; build + lint + md3:check.
2. **L2 — vérification** : contrôle en rendu réel des 6 no-ops réparés (§11.3) + re-baseline qa:visual complet (à mutualiser avec le re-baseline dû côté Chantier D ; discipline run témoin pour la dérive de fonte).
3. **L3 — différé, facultatif** : dépose progressive des `!` famille (a) (§11.5), site par site, vérif visuelle à chaque lot.

**En attente de feu vert — aucune implémentation.** *(Feu vert reçu — exécution consignée en §11.8 et E12.)*

### 11.8 Exécution L1+L2 (2026-07-17/18) — constats de vérification

**L1 livré** (`af5405f`) conformément au plan : adoption + config étendue §11.4 + fix Menu dans le même commit + sonde `check-cn-merge.mjs` (43 vérifs) chaînée dans `lint:md3`. D20/D21 n'ayant pas atterri, pas de mutualisation de re-baseline côté Chantier D.

**L2 — suite visuelle.** Le run du 17-07 a signalé **15 checkpoints changés** (8 compact, 3 medium, 4 expanded), acceptés puis re-vérifiés 39/39. Attribution pixel exhaustive (ancien vs nouveau, par clusters), **quatre causes, aucune régression contraire à l'intention** :

1. **Réparations merge au-delà des 6 no-ops listés** — la grille §11.3 (30 paires) était complète pour les couleurs/ombres mais **incomplète pour les propriétés de layout**. Mesuré en rendu réel, même mécanisme (l'override écrit au call-site perdait à l'émission, merge le fait gagner) : `NavigationBar` NavItem `gap-1` vs `gap-2` de Button md (icône +2px/libellé −2px CSS, les 8 pages compact) ; pastille `PageTabs` `px-1.5` vs `px-2` de Badge (pastille plus étroite, onglets voisins décalés — management/approvals/audit_details, 3 devices) ; `ListActionFab` `right-4` vs `right-6` de FabContainer (FAB 8px plus près du bord) ; `p-0`/`px` des boutons texte et d'en-tête (« Retour », « Refuser », « Nouvelle demande » — contenus décalés de quelques px) ; chevron sidebar (padding). Toutes vers l'intention écrite.
2. **Dérive de fonte Google** (connue, §10.2) : glyphe `check_circle` de la sidebar au dessin différent, anti-aliasing.
3. **Flaky data Dashboard** (connu) : compteurs 0↔2 / 5↔3.
4. **Dette de baseline soldée** : le badge « Attribué » d'`expanded/user_details` rendait encore l'émeraude **#10B981** (baseline du **03-07**, jamais rafraîchie depuis) alors que l'app rend `#047857` depuis palette v2 — diff ~0,04 % **sous le seuil de 0,05 %** (`PIXEL_DIFF_RATIO_THRESHOLD`), donc « match » à chaque run jusqu'à ce que les réparations merge fassent franchir le seuil au checkpoint. **Leçon méthodologique : un « match » de la suite n'est pas une preuve pixel — le seuil peut masquer un diff local réel pendant des semaines.**

**L2 — sonde rendu réel (9/9, 18-07)** : SelectField focus = bordure `rgb(46,39,37)` (focus-ring) ✅ ; InputField désactivé = label `oklab(…/0.38)` ✅ ; Chip filter sélectionné+hover = `primary/90` ✅ (chip réel de l'étape Accessoires du wizard retour ; le `className` rendu montre `hover:bg-surface-container` écarté par merge) ; chevron sidebar repliée = `shadow-md` ✅ ; EntityRow liste sélectionnée = `primary-container/45` hors survol ✅ ; gap NavItem 4px, pastille 6px (noir `#1A1A1A`/jaune — E10 intact), FAB `right:16px` ✅. Constats annexes : **la variante `card` d'EntityRow n'a aucun call-site vivant** (la « surprise » n°1 est une réparation latente — vérifiée par élément synthétique sur le CSS réel : merge rend la teinte, l'ancien join rendait `bg-surface`) ; au survol d'une rangée sélectionnée, `hover:bg-surface-container` masque la teinte (hover-variant émis après les bases — préexistant, pas un effet merge).

**a11y 16/16 Pass** (18-07). **L3** : différé, facultatif, à saisir d'opportunité — non programmé (décision utilisateur).
