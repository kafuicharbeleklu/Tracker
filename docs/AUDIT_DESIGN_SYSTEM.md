# Audit — Design System propriétaire Tracker (Chantier B)

> Diagnostic + palette/tokens proposés. **Aucune implémentation à ce stade.**
> Date : 2026-06-30 · Branche : `main`
> Décisions déléguées par le commanditaire : direction colorimétrique + sort du sélecteur d'accent (tranchées ci-dessous, §5).
> Inputs validés : nom produit « Tracker » · **light-first** (dark différé) · 3 form factors à égalité (cf. audit UX).

---

## 1. Résumé exécutif

L'application n'a pas « un » design system mais **trois systèmes de couleurs superposés** qui ne se connaissent pas, et **aucun ne porte la couleur de marque réelle `#FDC910`**. La cible n'est plus « appliquer MD3 » mais **construire notre DS propriétaire ancré sur l'identité Neemba/CAT**, avec une architecture de tokens unique.

Décisions de direction retenues (justifiées en §5) :
- **Jaune `#FDC910` = couleur PRIMAIRE** (boutons remplis à **texte sombre**), **jamais comme couleur de texte/lien sur fond clair** (contraste insuffisant). ⟵ *mis à jour : le jaune est primaire, pas seulement accent.*
- **Anthracite (noir chaud CAT `#2E2725`) = couleur secondaire / texte** (boutons « dark » à texte blanc, texte courant, icônes).
- **Sémantiques (succès/erreur/alerte/info) choisies pour ne pas entrer en collision avec le jaune** — point critique car l'« alerte » est aujourd'hui un ambre quasi identique à la marque.
- **Suppression du sélecteur d'accent multi-couleurs** au profit d'une identité de marque unique (réversible).

---

## 2. Méthode & sources

- Extraction des couleurs de marque depuis `src/assets/NEEMBA_LOGO.png` (échantillonnage pixel).
- Lecture des tokens : `index.css` (1091 lignes), `tailwind.config.js`, `src/lib/md3Theme.ts`.
- Audit de cohérence interne : `grep` sur les ~50 composants `src/components/ui/`.
- Réutilisation comme **diagnostic de l'état actuel** (pas comme cible) : `docs/md3-anomalies-register.md`, `docs/md3-audit-report-2026-02-14.md`, `docs/md3-remediation-roadmap.md`.
- Outillage QA : `scripts/check-md3-compliance.mjs`, `.github/workflows/md3-compliance.yml`.

---

## 3. Couleurs de marque (confirmées)

Échantillonnage de `NEEMBA_LOGO.png` (les autres valeurs sont de l'anti-aliasing) :

| Couleur | Hex | RGB | Surface logo | Rôle dans l'identité |
|---|---|---|---|---|
| Jaune marque | **`#FDC910`** | 253, 201, 16 | 54,6 % | Bandeau Neemba + triangle CAT (teinte unique) |
| Noir | **`#000000`** | 0, 0, 0 | 21,7 % | Typo « Neemba », panneau CAT, triangle |
| Blanc | **`#FFFFFF`** | 13,4 % | « CAT », contrastes |

Le jaune est **identique** sur Neemba et CAT → une seule teinte de marque à gérer.

---

## 4. État actuel — trois systèmes de couleurs concurrents

> C'est le constat central du chantier. Aucun composant `ui/` ne contient de hex en dur (0 occurrence — bon point), **mais** il existe trois vocabulaires de tokens disjoints :

### Système 1 — Tokens MD3 générés au runtime
`src/lib/md3Theme.ts:103-123` génère `--md-sys-color-*` à partir d'une couleur seed via `@material/material-color-utilities` (`themeFromSourceColor`). Seed jaune par défaut = **`#FFC107`** (`md3Theme.ts:33`), pas la marque. Gère le dark mode (`md3Theme.ts:56-63, 121`).

### Système 2 — Set statique custom `--color-*`
`index.css:872-906`, **non régénéré** par le moteur de thème (donc **insensible au dark mode et à l'accent**), pourtant **majoritairement utilisé dans les composants `ui/`** :
- `--color-brand: #ffcc00` / `-hover: #e6b800` / `-dark: #cca300` / `-text: #151619` → **un 2ᵉ jaune (`#ffcc00`)**.
- `--color-neutral-50..900` : rampe de gris **froide générique** (type Tailwind gray, `#6b7280`…), **non dérivée de la marque**.
- `--color-text-primary/secondary/muted`, `--color-border-default/subtle/strong`, `--color-surface*`.
- `--color-warning: #f59e0b` (ambre) / `--color-warning-light: #fef3c7`.

### Système 3 — Classes Tailwind brutes
Certains composants court-circuitent les deux systèmes : `Badge.tsx:20` utilise `bg-amber-100 text-amber-800` ; `ReportsPage.tsx:131` code `[255,193,7]` (= `#FFC107`) pour les PDF.

### Conséquences

| Problème | Preuve | Gravité |
|---|---|---|
| **3 jaunes différents**, aucun = `#FDC910` | `md3Theme.ts:33` (`#FFC107`), `index.css:872` (`#ffcc00`), `Badge.tsx:20` (amber) | P0 |
| Les composants `ui/` consomment le set **statique** `--color-*` → **ne réagissent ni au dark ni à l'accent** | usages `var(--color-neutral-500)`, `var(--color-text-primary)`, `var(--color-border-default)` dans `ui/` | P0 |
| Rampe de neutres **froide**, dissonante avec un jaune chaud | `index.css:893-902` | P1 |
| **`warning` (`#f59e0b`) quasi identique au jaune de marque** → confusion état/marque | `index.css:886`, `Badge.tsx:20` | P0 (sécurité visuelle) |
| Double source de vérité statique (`index.css`) vs runtime (`md3Theme.ts`) | `index.css:121-175` vs `md3Theme.ts:115-120` | P1 |

---

## 5. Décisions de direction (déléguées → tranchées)

### 5.1 Rôle du jaune : PRIMAIRE (fond bouton, texte sombre)

**Justification contraste (WCAG 2.1)** — ratio de contraste de `#FDC910` :

| Combinaison | Ratio | AA texte normal (4.5) | AA grand texte (3.0) |
|---|---|---|---|
| `#FDC910` texte **sur blanc** | ~1,6:1 | ❌ | ❌ |
| `#FDC910` texte sur noir | ~13,4:1 | ✅ | ✅ |
| **Noir texte sur fond `#FDC910`** | ~13,4:1 | ✅ AAA | ✅ |
| Blanc texte sur fond `#FDC910` | ~1,6:1 | ❌ | ❌ |

→ Le jaune n'est lisible **qu'en tant que surface portant du texte noir** (exactement l'usage du logo). Il **ne peut pas** servir de couleur de texte, de lien, ni de bordure fine sur blanc. **Décision (mise à jour) : jaune = PRIMAIRE** — couleur des boutons primaires/CTA (fond jaune, **texte noir**, 13,4:1 ✅) ; **anthracite = secondaire/texte** (boutons « dark », texte courant, liens, icônes). Seule règle stricte conservée : **jamais de texte/lien jaune sur fond clair**.

On assume ici une **identité de marque forte façon Caterpillar** (jaune primaire central), et non l'approche « accent neutre » de Linear/Notion/Stripe — à la condition de toujours employer le jaune en **fond à texte sombre**.

### 5.2 Sélecteur d'accent multi-couleurs → **retiré**

`SettingsPage.tsx:301` + `types/index.ts:20` exposent `yellow|blue|purple|emerald|orange`. Incompatible avec une identité de marque forte et unique. **Recommandation : retirer le choix utilisateur** (garder éventuellement le mécanisme en interne pour le futur, mais une seule marque par défaut). Réversible si tu préfères conserver la personnalisation.

### 5.3 Dark mode : **light-first** (ta consigne)
On définit la palette complète en clair ; les tokens dark sont **prévus dans l'architecture** (§7) mais non finalisés cette passe. Le moteur dark existant (`md3Theme.ts`) sera remplacé par des tokens dark figés plus tard.

---

## 6. Palette propriétaire proposée (à valider)

> Valeurs indicatives à affiner en implémentation. Objectif : une rampe **anthracite** primaire, des **neutres légèrement chauds** (pour s'accorder au jaune chaud), une **marque** jaune en échelle, des **sémantiques nettement distinctes du jaune**.

### 6.1 Marque (accent)
| Token | Hex | Usage |
|---|---|---|
| `brand/500` (base) | `#FDC910` | Accent principal, fond CTA (texte noir) |
| `brand/600` (hover) | `#E3B40C` | État survol de l'accent |
| `brand/700` (active) | `#C39A09` | État pressé |
| `brand/100` (subtle) | `#FFF4CC` | Fonds de mise en avant légers |
| `brand/on` | `#1A1A1A` | Texte/icône sur surface marque |

### 6.2 Primaire fonctionnel — anthracite
| Token | Hex (indicatif) | Usage |
|---|---|---|
| `primary/900` | `#111315` | Texte fort, primaire pressé |
| `primary/800` | `#1F2227` | Boutons primaires |
| `primary/700` | `#2E333A` | Hover primaire |
| `primary/on` | `#FFFFFF` | Texte sur primaire |

### 6.3 Neutres (légèrement chauds, ancrés marque)
Remplacer la rampe froide actuelle (`#6b7280`…) par une rampe **warm-neutral** 50→950 (sous-ton chaud discret) pour harmoniser avec le jaune. Rôles : fonds (`surface`, `surface-variant`), textes (`on-surface`, `on-surface-variant`, `muted`), bordures (`outline`, `outline-variant`).

### 6.4 Sémantiques — **éloignées du jaune en teinte**
| Rôle | Hex (indicatif) | Note anti-collision |
|---|---|---|
| Succès | `#1E8E3E` (vert) | OK |
| Erreur/Danger | `#D32F2F` (rouge) | OK |
| **Alerte/Warning** | **`#E8710A` (orange franc)** | **Décalé du `#FDC910`** : on **n'utilise pas d'ambre** (`#f59e0b`) pour éviter la confusion avec la marque |
| Info | `#1A73E8` (bleu) | OK |

> ⚠️ Le point le plus délicat du DS : « alerte » et « marque » ne doivent jamais se confondre. Reco = warning **orange**, marque **jaune**, et on bannit l'ambre intermédiaire.

---

## 7. Architecture de tokens cible (3 niveaux)

Unifier les 3 systèmes derrière **une seule cascade** :

```
1. Référence (primitives)   --ref-brand-500, --ref-neutral-100, --ref-green-600 …  (valeurs hex figées)
2. Système (sémantique)     --color-primary, --color-on-primary, --color-accent,
                            --color-surface, --color-on-surface, --color-outline,
                            --color-success/-error/-warning/-info …  (alias vers ref)
3. Composant (optionnel)    --button-primary-bg, --card-radius …      (alias vers système)
```

- Le **mode** (light/dark) ne réassigne que le niveau 2 → niveau 1 figé.
- Tailwind v4 `@theme` mappe les classes utilitaires vers le niveau 2 (plus de `bg-amber-100` en dur).
- **Suppression du runtime `md3Theme.ts`** (génération tonale MD3) au profit de tokens figés — sauf si on garde une seed pour générer la rampe une seule fois en build.

---

## 8. Cohérence interne des composants `ui/` (dette visuelle)

| Constat | Preuve | Action |
|---|---|---|
| **Rayons incohérents** : 7 valeurs (`rounded-lg`×36, `-md`×14, `-full`×12, `-xl`×9, `-t`×3, `-none`×3, `-sm`×1) | `grep ui/` | Définir une échelle de rayons à 3-4 crans et la tokeniser |
| **Typo** : usage mixte typescale (`text-body-*`, `text-label-*`…) **et** ad-hoc (registre : 433 occurrences ad-hoc) | `MD3-HIGH-005`, `grep ui/` | Standardiser sur une échelle typographique unique |
| **Espacements arbitraires** `[xxpx]` hors grille 4dp | `MD3-HIGH-012`, `PageContainer.tsx` | Migrer vers tokens de spacing |
| **Styles inline** `style={{…}}` | `NavigationRail.tsx`, `Sidebar.tsx`, `ListActionFab.tsx`, `MaterialIcon.tsx` | Externaliser vers classes/tokens (sauf valeurs dynamiques légitimes) |
| **Tokens dual** dans `ui/` (set statique `--color-*` au lieu des sys tokens) | usages `var(--color-neutral-*)`, `var(--color-text-*)` | Remettre tous les `ui/` sur le niveau 2 unifié |
| **Sémantiques en dur** | `Badge.tsx:20` (`bg-amber-100`), `ConfirmationDialog`, `StatusBadge` | Brancher sur tokens `--color-warning/-success/...` |

Items composants encore ouverts hérités du registre (à recroiser, certains résolus depuis fév. : bottom nav, code splitting) : états hover/pressed non systématiques sur cards (`MD3-MED-002`, `Card.tsx:47`), chips incomplets (`Chip.tsx:45`), durées d'animation hardcodées (`duration-200/300/500`, `MD3-MED-011`).

---

## 9. Sort de l'outillage QA (actuellement seul garde-fou CI bloquant)

`scripts/check-md3-compliance.mjs` n'est **pas** un validateur de conformité MD3 : c'est un **linter de garde-fou** qui interdit les hex en dur (allowlist : `LoginPage.tsx`, `md3Theme.ts`), les patterns legacy (`text-dark`, `bg-dark`, `surface-subtle`, `variant="outline"`) et les contrôles natifs dans `ui/`.

→ **Recommandation : l'ADAPTER, pas le supprimer.**
- Conserver l'interdiction de hex en dur (cœur de la discipline tokens) — **mais retirer `md3Theme.ts` de l'allowlist** une fois le moteur supprimé.
- Remplacer les patterns « MD3 legacy » par les nouveaux interdits (ex. bannir `bg-amber-*`/`text-amber-*` et l'usage direct des classes de couleur Tailwind hors tokens).
- Renommer (`check-design-tokens.mjs`) et adapter le workflow `md3-compliance.yml` → `design-tokens.yml`.
- Le garder **bloquant en CI** pour ne pas régresser pendant la refonte. (Question CI lint/tests transverse — cf. §11.)

---

## 10. Plan d'action priorisé (correctifs — à exécuter après validation)

**P0 — Fondations tokens (déblocage de tout le reste)**
1. Geler la palette §6 (après tes arbitrages §11) → niveau 1 (référence) dans `index.css`.
2. Définir le niveau 2 (sémantique) et mapper `@theme` Tailwind v4 ; intégrer `#FDC910` comme accent, anthracite comme primaire.
3. Trancher le warning **orange** vs marque jaune ; supprimer l'ambre.
4. Décider du sort du runtime `md3Theme.ts` (supprimer vs seed build-time).

**P1 — Convergence des composants**
5. Migrer tous les `ui/` du set statique `--color-*` vers le niveau 2 unifié.
6. Supprimer les sémantiques en dur (`Badge`, `StatusBadge`, `ConfirmationDialog`, PDF `ReportsPage`).
7. Retirer le sélecteur d'accent (`SettingsPage`, `types`, `DataContext`).
8. Normaliser rayons / typo / spacing (échelles tokenisées).

**P2 — Hygiène & dark**
9. Externaliser les styles inline ; cleanup alias legacy (`MD3-LOW-003`).
10. Préparer les tokens dark (niveau 2) sans les activer (light-first).

**P3 — Outillage**
11. Adapter `check-md3-compliance.mjs` + workflow CI aux nouveaux interdits.

---

## 11. Questions résiduelles (avant exécution)

- **Q-B1** — Valides-tu la **direction** §5 (jaune accent / anthracite primaire / accent-selector retiré) et la **palette indicative** §6, ou veux-tu d'abord des **maquettes côte à côte** de 2-3 variantes ?
- **Q-B2** — **Warning = orange `#E8710A`** (pour éviter la confusion avec la marque) : OK, ou tu tiens à un jaune/ambre pour l'alerte ?
- **Q-B3** — **Neutres chauds** (accordés au jaune) ou neutres froids/neutres purs ? (choix esthétique structurant)
- **Q-B4** — Runtime de theming MD3 (`md3Theme.ts`) : **supprimer** (tokens figés) ou **conserver** une génération build-time depuis une seed ?
- **Q-B5** — Polices : garder `Inter` (`tailwind.config.js:161`) ou aligner sur une éventuelle police de charte Neemba/CAT ? Existe-t-il une charte de marque officielle (au-delà du logo) ?
- **Q-B6** — Confirmes-tu **MD3 abandonné comme cible** (on garde seulement les audits comme diagnostic), donc renommage de l'outillage et des docs `md3-*` ?
