# Spécification des tokens — Design System Tracker

> Palette **figée** + plan d'implémentation. Dérivé de `docs/AUDIT_DESIGN_SYSTEM.md` (direction validée).
> Date : 2026-06-30 · Direction validée : **jaune `#FDC910` = PRIMAIRE** (boutons remplis, texte sombre), anthracite = **secondaire / texte**, neutres **chauds**, sélecteur d'accent **retiré**, warning **orange**, **light-first** (dark différé).
>
> **Contexte marque** : Neemba est un **concessionnaire Caterpillar**. La palette est alignée sur l'identité **CAT** : jaune machine (`#FDC910`, logo ≈ CAT yellow), **noir chaud officiel CAT `#2E2725`** (et non un noir pur/froid), typographie de référence **Soleil**. Sources : voir fin de document.
>
> **Statut : Étape 1 RÉALISÉE** (socle de tokens CAT non-cassant, cf. §5). Build/lint non exécutés ici (`node_modules` absent de l'environnement) ; à vérifier via `npm run dev`/`build`.

---

## 1. Police (décision déléguée → tranchée)

**Recommandation : conserver `Inter`** pour toute l'UI (déjà configuré, `tailwind.config.js:161`), avec **chiffres tabulaires** (`font-feature-settings: "tnum"`) sur les contextes data-dense (tableaux inventaire, finance, audit).

Justification : Inter est conçu pour les interfaces denses (excellente lisibilité aux petites tailles, métriques stables), c'est le standard des SaaS B2B de référence, et le coût de migration est nul. La personnalité de marque est portée par la **couleur** et le **logo**, pas par une police display risquée.

> **Note CAT** : la typographie officielle Caterpillar est **Soleil** (Regular/Bold) — une linéale géométrique sous **licence payante**. Option d'upgrade si tu disposes de la licence : Soleil sur les titres, Inter sur le corps/data. Alternative géométrique gratuite proche : *Hanken Grotesk* / *Mulish*. → micro-question Q-T5.

---

## 2. Palette figée

### 2.1 Marque = PRIMAIRE — ancrée sur `#FDC910` (boutons remplis, **texte noir** ; jamais en texte/lien sur fond clair)
| Token réf. | Hex | Usage |
|---|---|---|
| `--ref-brand-50` | `#FFF9E6` | Fonds très légers |
| `--ref-brand-100` | `#FFF1C2` | Surfaces de mise en avant |
| `--ref-brand-200` | `#FEE491` | |
| `--ref-brand-300` | `#FED95E` | |
| `--ref-brand-400` | `#FDD134` | |
| **`--ref-brand-500`** | **`#FDC910`** | **Primaire — fond bouton/CTA (texte noir)** |
| `--ref-brand-600` | `#E3B40C` | Hover accent |
| `--ref-brand-700` | `#B88E09` | Active accent |
| `--ref-brand-on` | `#1A1A1A` | Texte/icône sur surface marque |

### 2.2 Anthracite = **secondaire / texte** — noir chaud CAT
> Le jaune étant **primaire**, l'anthracite porte les actions **secondaires**, le texte et les icônes (et sert de bouton « dark » à texte blanc).
| Token réf. | Hex | Usage |
|---|---|---|
| **`--cat-black` / `--color-anthracite`** | **`#2E2725`** | **CAT Black — bouton secondaire/« dark » (texte blanc), icônes** |
| `--color-anthracite-strong` | `#1C1917` | Texte fort, pressé |
| `--color-neutral-700` | `#3D3833` | Texte secondaire / hover |

### 2.3 Neutres chauds — ancrés sur le noir CAT (remplace la rampe froide `#6b7280…`)
Rampe **telle qu'implémentée** en Étape 1 (`--color-neutral-*`), 800 = CAT Black :
| Token | Hex |
|---|---|
| `--color-neutral-50` | `#FAF9F7` |
| `--color-neutral-100` | `#F4F2EF` |
| `--color-neutral-200` | `#E8E4DF` |
| `--color-neutral-300` | `#D6D0C8` |
| `--color-neutral-400` | `#A8A199` |
| `--color-neutral-500` | `#79736B` |
| `--color-neutral-600` | `#57514A` |
| `--color-neutral-700` | `#3D3833` |
| `--color-neutral-800` | `#2E2725` (CAT Black) |
| `--color-neutral-900` | `#1C1917` |

### 2.4 Sémantiques — **éloignées du jaune** (texte sombre pour AA)
| Rôle | Base | Container (light) | `on-` |
|---|---|---|---|
| Succès | `#1E8E3E` | `#E6F4EA` | `#FFFFFF` |
| Erreur | `#D32F2F` | `#FCE8E6` | `#FFFFFF` |
| **Warning** | **`#E8710A`** (orange) | `#FDEBD9` | `#1A1A1A` |
| Info | `#1A73E8` | `#E8F0FE` | `#FFFFFF` |

> Aucune valeur ambre/jaune dans les sémantiques → zéro collision avec la marque.

### 2.5 Règle X12 — le jaune n'est **jamais** une couleur de texte/glyphe sur fond clair

> Source : `docs/AUDIT_UX_RESPONSIVE.md` §5 X12 (2026-07-07), ratios mesurés au rendu (`getComputedStyle`, luminance WCAG).

- **Interdit** : `#FDC910` (et `text-primary` rendu jaune) comme couleur de **texte ou de glyphe porteur de sens** sur fond clair — mesuré **~1,55:1** sur blanc, échec du seuil texte (4,5:1) **et** du seuil non-texte (3:1).
- **Permis** : le jaune comme **fond** avec texte/icône noirs — mesuré **11,2:1** (boutons remplis, onglets actifs, KPI héro).
- **Icônes décoratives** : une icône jaune sur fond clair n'est tolérée que **doublée d'un second indice** au contraste suffisant (libellé sombre en gras, chip, fond teinté) — le jaune ne doit jamais être le seul vecteur de l'information.
- Mise en évidence d'un élément courant dans une liste : **teinte de fond neutre + chip**, pas de titre jaune (~2:1 sur fond clair).

---

## 3. Tokens sémantiques (niveau 2) — assignations **light**

| Token système | → Référence | Contraste clé |
|---|---|---|
| `--color-primary` | `--cat-yellow` `#FDC910` | **texte noir** 13,4:1 ✅ |
| `--color-on-primary` | `#1A1A1A` | jamais blanc (blanc/jaune = 1,6:1 ❌) |
| `--color-secondary` (anthracite) | `--cat-black` `#2E2725` | texte blanc 13:1 ✅ |
| `--color-on-secondary` | `#FFFFFF` | |
| `--color-surface` | `#FFFFFF` | |
| `--color-surface-variant` | `--ref-neutral-100` | |
| `--color-surface-container` | `--ref-neutral-50` | |
| `--color-background` | `--ref-neutral-50` | |
| `--color-on-surface` | `--ref-neutral-900` | 15:1 ✅ |
| `--color-on-surface-variant` | `--ref-neutral-600` | 7:1 ✅ |
| `--color-outline` | `--ref-neutral-300` | |
| `--color-outline-variant` | `--ref-neutral-200` | |
| `--color-success/-error/-warning/-info` | bases §2.4 | |

> **Dark** (différé) : seuls ces tokens niveau 2 seront réassignés ; le niveau 1 (réf.) reste figé. Noms réservés dès maintenant pour ne pas refactorer plus tard.

---

## 4. Échelles structurelles

### 4.1 Rayons — échelle effective **2 / 4 / 8 / full** (mise à jour 2026-07-22, audit UX §9.2)
L'échelle réellement rendue (`index.css` `--radius-*` → `--md-sys-shape-*` → `tailwind.config.js`) :

| Cran | Valeur | Nom canonique | Alias rendant la même valeur (dépréciés à l'écriture) |
|---|---|---|---|
| extra-small | `2px` | `rounded-xs` | — |
| small/medium | `4px` | `rounded-md` | `rounded-sm` |
| large | `8px` | `rounded-card` | `rounded-lg`, `rounded-xl` |
| stade | `9999px` | `rounded-full` | `rounded-pill` (déjà déprécié en config) |

**Règle d'imbrication (formalisée — c'était la pratique de facto)** : surface externe (carte, panneau, modale) = **8px** (`rounded-card`) ; élément interne (chip, vignette, champ, tuile dense) = **4px** (`rounded-md`). `rounded-full` est réservé aux éléments **circulaires** (avatars, pastilles, FAB, boutons icône) — pas aux chips texte, alignés sur la primitive `Badge` (4px).

**Gardes** (`md3:check`, CI-bloquant) : `rounded` nu (0,25rem défaut Tailwind, décorrélé des tokens) et `rounded-2xl`/`rounded-3xl` (non remappés) sont interdits dans `src/`. Piège connu : les noms de variables CSS sont décalés d'un cran vs les utilitaires (`--radius-lg` = 4px alimente `rounded-md`) — en CSS artisanal, repartir des `--md-sys-shape-*`.

### 4.2 Typographie — **normalisation différée** (blocage technique)
Le code est déjà à **82 %** sur l'échelle (`text-body/label/title-*`, 675 usages) ; ~151 usages ad-hoc subsistent (`text-xs/sm`, `text-[Npx]`, surtout dans `features/`).

**Blocage identifié** : les classes `.text-*` de l'échelle (index.css ~l.428-558) sont **hors `@layer`** et **forcent `font-weight`** → en CSS, le non-layered gagne sur le layered, donc elles **écrasent `font-bold`** de Tailwind. Migrer naïvement `text-xs font-bold` → `text-body-small font-bold` ferait **passer le gras en maigre** (boutons, badges, labels), souvent indétectable par script (taille et poids sur des lignes séparées, ex. `Button` `baseStyles` vs `SIZE_STYLES`).

**✅ Réalisé** (via la boucle de build Windows du commanditaire) : migration par script **conscient du poids** (détection ligne-à-ligne `font-bold`/`font-medium` → choix `label-*`/`body-*`/`title-*`), **~143 remplacements / 24 fichiers**, build validé (aucun écart constaté). Choix assumé : boutons/badges passent du gras 700 au poids `label` (500-600). Restent **4 micro-labels sous-échelle (9-10px, nav)** en exception. Piste ouverte si on veut re-gras les boutons/badges : passer les `.text-*` en `@layer components` (font-bold redevient composable) — à faire avec build.

**Cran hors-MD3 `stat-value` (2026-07-18, audit UX §9.1)** : rôle « valeur de stat/KPI » unique — `text-stat-value` = **30px/36 w700** (24px/28 en compact <600px, section Responsive Typography d'index.css). Remplace le `text-[1.875rem]` arbitraire de MetricCard et l'écrasement `title-large` (18px) des tuiles compactes : même rôle → même cran, quel que soit l'écran. Toute nouvelle classe maison `text-*` doit être déclarée dans `cn()` (`src/lib/utils.ts`) et couverte par `scripts/check-cn-merge.mjs` — fait pour `stat-value`.

### 4.3 Spacing
Grille **4dp** stricte ; supprimer les valeurs arbitraires `[xxpx]` (`MD3-HIGH-012`).

### 4.4 Cibles tactiles — plancher 44px (formalisé le 2026-07-18, audit UX §9.1)
Toute surface interactive rend **au minimum 44×44 px** (`min-h-11`/`min-w-11` ou boîte équivalente), sur toutes les classes d'appareil — c'était le plancher *de facto* du chantier (SidebarItem, actions UserDetails…) sans être écrit nulle part. La cible confort MD3 reste 48dp ; 44px est le plancher en dessous duquel on ne descend pas (première violation corrigée : boutons Attribuer/Retour/Supprimer du héro compact EquipmentDetails, 40px → 44px). Un conteneur cliquable entier (tuile de stat, rangée) satisfait le plancher pour ses enfants décoratifs.

---

## 5. Plan d'implémentation **non-cassant** (séquencé)

> Objectif : faire basculer le visuel **sans casser** les ~50 composants d'un coup.

**Étape 1 — Socle tokens (additif, zéro régression structurelle) — ✅ RÉALISÉ**
Approche retenue (vu l'architecture réelle à 3 couches) :
1. ✅ Réécriture en place des valeurs de la couche « SmartProcure compatibility layer » (`index.css:863-1016`) vers la palette **CAT** : `--color-brand = #FDC910`, références `--cat-yellow`/`--cat-black`/`--color-anthracite`, rampe `--color-neutral-*` **chaude** (800 = `#2E2725`), textes/surfaces chauds, `--color-warning = #E8710A`, `::selection` jaune marque.
2. ✅ Ajout de `--md-sys-color-surface-variant` (manquait statiquement, était fourni par le runtime).
3. ✅ **Neutralisation du theming runtime** (`DataContext.tsx` : suppression de l'appel `applyMd3Theme` + import) → la palette CAT statique devient autoritaire (couche 3 ne l'écrase plus). Light-first forcé.

> **Direction définitive** : `--md-sys-color-primary` = **jaune** (`var(--color-brand)` = `#FDC910`), `on-primary` **sombre** (`#1A1A1A`). Le jaune est la couleur **primaire** (boutons remplis) ; l'anthracite passe en **secondaire/texte**. ✅ Déjà correct dans le code : `Button.tsx` variante `filled` = `bg-primary text-on-primary` (texte sombre lisible) ; aucun combo `bg-primary`+`text-white` détecté. → **Plus de bascule vers l'anthracite-primaire en Étape 2.**

→ **Point de validation visuelle (à faire)** : `npm run dev` + revue d'écrans. Attendu : jaune `#FDC910`, neutres/fonds chauds, texte noir chaud, alertes orange — partout, sans migration de composant.

**Étape 2 — Convergence des composants (par lots)**
- ✅ **Lot 1** — sémantiques en dur → tokens : `Badge`, `StatusBadge` (Tailwind brut → classes `success/warning/danger/info` adossées aux tokens + variantes `-strong`/`-light`), PDF `ReportsPage`. **Warning = orange** (≠ jaune marque).
- ✅ **Lot 2** — bouton secondaire (`Button` variante `tonal`/`secondary`) → **anthracite CAT `#2E2725`** (hover `#1C1917`).
- ✅ **Lot 3a** — rayons unifiés **2/4/6/8 px** (carré/industriel, suppression du 3px).
- ✅ **Lot 3b** — typo : **migrée** (~143 remplacements / 24 fichiers, script conscient du poids, validé build Windows). 4 micro-labels sous-échelle (9-10px) laissés en exception.

**Étape 3 — Nettoyage**
- ✅ **7. `md3Theme.ts` supprimé** (Q-T4 = supprimer) + **sélecteur d'accent retiré** (`SettingsPage`, `types/index.ts` `accentColor`, défaut `DataContext`). Zéro référence orpheline.
- ⏭️ **8.** Couche de tokens (ex-« SmartProcure ») **conservée** : c'est désormais la source de vérité, pas un shim. Nettoyage des alias legacy `tailwind.config` (`MD3-LOW-003`) à part, optionnel.
- ✅ **9.** `check-md3-compliance.mjs` adapté : `md3Theme.ts` retiré de l'allowlist + **ban du jaune/ambre Tailwind brut** ajouté. **Garde-fou toujours bloquant.** Renommage du script/workflow → optionnel (churn) — non fait.
- ⚠️ **Effet de bord à traiter** : le **sélecteur de thème** (Clair/Sombre/Système, `SettingsPage`) est désormais **inerte** (runtime neutralisé en Étape 1, light forcé). À masquer (light-only) ou à recâbler quand le dark sera réimplémenté (Étape 4).

**Étape 4 — Dark (différé)**
10. Réassigner les tokens niveau 2 en variante dark + activer le sélecteur de thème.

---

## 6. Definition of Done (DS)
- Une seule cascade de tokens (réf → système → composant) ; plus de set `--color-*` statique parallèle ni de classes couleur Tailwind brutes.
- `#FDC910` présent **uniquement** comme accent ; primaire = anthracite ; warning = orange.
- `npm run build` + `check-design-tokens` verts ; audits a11y/multidevice non régressés.
- Zéro hex en dur hors `index.css` (et `LoginPage` si justifié).

---

## 7. Micro-questions résiduelles (n'empêchent pas de démarrer l'Étape 1)
- **Q-T1** — Valides-tu les **valeurs hex exactes** §2 (notamment la rampe neutre chaude et l'orange warning `#E8710A`) ?
- **Q-T2** — Primaire `#1F2227` (légèrement froid) : on le **réchauffe** pour s'aligner aux neutres chauds (ex. `#262320`), ou on garde tel quel (validé en preview) ?
- **Q-T3** — Rayon par défaut **10px** te convient (vs plus carré 6px / plus arrondi 12px) ?
- **Q-T4** — `md3Theme.ts` : **supprimer** (tokens figés) ou **conserver** une génération build-time ?
- **Q-T5** — Police : **Inter** validé, ou tu veux que j'explore une police display de marque pour les titres (Soleil sous licence, ou alternative gratuite proche) ?

---

## 8. Sources (recherche identité Caterpillar)
- Couleurs marque CAT (jaune machine, noir chaud `#2E2725`, PMS) : [brandpalettes.com](https://brandpalettes.com/caterpillar-brand-colors/), [brandcolorcode.com](https://www.brandcolorcode.com/caterpillar-inc).
- Langage/design system & typographie **Soleil** : [digital.cat.com — general guidelines](https://digital.cat.com/node/806), [Cat — nouvelle identité produit](https://www.cat.com/en_US/news/machine-press-releases/new-identity-for-cat-products-reflects-the-brands-premium-quality.html).
- Couleur de marque canonique de **ce** concessionnaire : extraction pixel de `src/assets/NEEMBA_LOGO.png` → `#FDC910` (≈ CAT yellow).
