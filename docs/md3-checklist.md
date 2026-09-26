# MD3 Code Review Checklist

Derniere mise a jour: 2026-02-14
Projet: `neemba-tracker-login`
Reference principale: https://m3.material.io/

## 1) Regles de validation (gates)

- [ ] `GATE-01` Aucun blocker critique (P0) ouvert sur la PR.
- [ ] `GATE-02` `npm run build` passe sans erreur.
- [ ] `GATE-03` Aucun composant interactif sans focus visible.
- [ ] `GATE-04` Tous les elements tactiles interactifs respectent `48x48dp` minimum.
- [ ] `GATE-05` Les changements de theme (light/dark) restent fonctionnels.
- [ ] `GATE-06` Les attributs ARIA critiques sont presents (`aria-label`, `aria-invalid`, `aria-describedby` selon le contexte).

## 2) Fondations MD3

### 2.1 Couleurs

- [ ] Les roles MD3 sont utilises via tokens (`primary`, `secondary`, `tertiary`, `error`, `surface`, `outline`, `inverse`, `scrim`).
- [ ] Aucun role de couleur non defini (ex: `warning`) n'est introduit.
- [ ] Les couleurs ne sont pas hardcodees dans les composants (pas de `#xxxxxx` hors tokens).
- [ ] Les etats interactifs utilisent des state layers MD3.
- [ ] Le contraste WCAG AA est respecte pour texte/composants principaux.

### 2.2 Typographie

- [ ] Les classes MD3 (`text-display-*`, `text-headline-*`, `text-title-*`, `text-body-*`, `text-label-*`) sont privilegiees.
- [ ] Les classes ad-hoc (`text-sm`, `text-xl`, etc.) sont justifiees et limitees.
- [ ] Les styles de boutons utilisent `Label Large` (ou equivalent tokenise).
- [ ] Les titres suivent une hierarchie coherente et semantique.

### 2.3 Elevation, Shape, Spacing

- [ ] Les elevations utilisent les tokens (`shadow-elevation-0..5`).
- [ ] Les rayons utilisent les tokens shape (`rounded-xs/sm/md/lg/xl/full`).
- [ ] Les espacements suivent une grille 4dp.
- [ ] Les valeurs arbitraires (`[xxpx]`) sont evitees ou justifiees.

### 2.4 Iconographie

- [ ] Les icones utilisent Material Symbols (pas de set legacy melange).
- [ ] Taille standard des icones (20/24/40/48) selon contexte.
- [ ] Icon buttons sans texte ont un `aria-label`.

## 3) Composants UI MD3

### 3.1 Actions

- [ ] Buttons: variantes MD3 presentes et coherentes (`filled`, `tonal`, `outlined`, `text`, `elevated`).
- [ ] Pas d'API incoherente (`outline` vs `outlined`).
- [ ] Etats verifier: `enabled`, `hover`, `focus`, `pressed`, `disabled`.
- [ ] Ripple/state-layer visible et conforme.

### 3.2 Saisie

- [ ] Text fields: variantes `outlined` et `filled` conformes.
- [ ] Password toggle accessible clavier (tabbable).
- [ ] Erreurs correctement annoncees (`aria-invalid`, message lie via `aria-describedby`).
- [ ] Labels visibles et associes a `id/for`.

### 3.3 Containment et feedback

- [ ] Cards: variantes `elevated`, `filled`, `outlined` conformes.
- [ ] Snackbars: duree MD3 (4-10s en general), action optionnelle, role live region.
- [ ] Dialogs: `role="dialog"`, `aria-modal`, focus trap, Escape.

### 3.4 Navigation

- [ ] Pattern adaptatif defini par window size class (compact/medium/expanded+).
- [ ] Navigation mobile conforme (bottom nav ou drawer modal).
- [ ] Navigation desktop/tablette conforme (rail et/ou drawer).
- [ ] Top app bar suit un comportement coherent (small/medium/large selon ecran/usage).

### 3.5 Selection et composants secondaires

- [ ] Checkboxes/radios/switches couvrent les etats requis.
- [ ] Menus utilisent semantique menu quand necessaire (`role="menu"`, `menuitem`).
- [ ] Tooltips suivent un comportement coherent (hover/focus, delai, dismissal).
- [ ] Les composants MD3 manquants sont identifies (FAB, date picker, sheets, etc.).

## 4) Responsive et adaptatif

- [ ] Breakpoints MD3 coherents entre config build et runtime.
- [ ] Aucune divergence de config Tailwind entre `tailwind.config.js` et `index.html`.
- [ ] Layout sans debordement horizontal aux tailles cibles.
- [ ] Marges et gutters conformes (compact 16dp, medium+ 24dp).
- [ ] Composants critiques verifies sur compact, medium, expanded et large.

## 5) Motion

- [ ] Easing MD3 utilise (`emphasized`, `decelerate`, `accelerate`, `standard`).
- [ ] Durees tokenisees privilegiees (`duration-short*`, `medium*`, `long*`).
- [ ] Pas de multiplication non justifiee de `duration-200/300/500` hardcodees.
- [ ] `prefers-reduced-motion` pris en charge.

## 6) Accessibilite (WCAG 2.1 AA)

- [ ] Contraste conforme AA sur texte et composants.
- [ ] Navigation clavier complete sans blocage.
- [ ] Focus visible present sur tous les elements interactifs.
- [ ] Pas de suppression de focus sans alternative (`focus:ring-0` a eviter).
- [ ] Touch targets >= `48x48dp`.
- [ ] Images informatives avec `alt` pertinent; images decoratives avec `alt=""`.

## 7) Architecture et implementation

- [ ] Design tokens centralises et reutilises.
- [ ] Pas de duplication de configuration theme/breakpoints.
- [ ] Code splitting applique sur routes/features lourdes (`React.lazy`, `import()`).
- [ ] Bundle size surveillee (alerte chunk traitee si necessaire).
- [ ] Composants morts/fichiers vides traites (supprimes ou implementes).

## 8) Preuves attendues dans la PR

- [ ] Liste des fichiers modifies (avec rationale par fichier).
- [ ] Captures avant/apres pour changements UI visibles.
- [ ] Note de validation build (`npm run build`).
- [ ] Note de validation manuelle des flux impactes.
- [ ] Si a11y impactee: resultats Lighthouse/axe ou checklist manuelle.

## 9) Rubrique de scoring rapide (optionnel)

Attribuer un score par section:

- Fondations: `/15`
- Composants UI: `/30`
- Responsive/adaptatif: `/15`
- Motion: `/10`
- Accessibilite: `/15`
- Architecture/perf: `/15`

Score total MD3: `/100`

Seuil recommande:

- `>= 95`: conforme MD3 cible
- `85-94`: conforme avec ecarts mineurs
- `< 85`: remediation requise avant merge sur features structurantes
