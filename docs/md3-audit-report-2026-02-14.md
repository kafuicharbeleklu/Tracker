# Audit MD3 Complet - neemba-tracker-login

Date: 2026-02-14
Statut: Execution completee (audit statique + build production)
Perimetre: code React/TS, styles/tokens, composants UI, responsive, motion, a11y, architecture

## 1) Resume executif

Score global MD3: 45/100

| Categorie | Score | Anomalies critiques | Anomalies totales | Taux |
|---|---:|---:|---:|---:|
| Design system & fondations | 7/15 | 2 | 14 | 47% |
| Composants UI | 13/30 | 2 | 26 | 43% |
| Responsive & adaptive | 5/15 | 1 | 10 | 33% |
| Motion & animations | 6/10 | 1 | 7 | 60% |
| Accessibilite | 7/15 | 1 | 11 | 47% |
| Architecture technique | 7/15 | 1 | 9 | 47% |
| **TOTAL** | **45/100** | **8** | **77** | **45%** |

Repartition priorites:
- Critiques (P0): 8
- Elevees (P1): 24
- Moyennes (P2): 29
- Faibles (P3): 16

Conclusion:
- Le projet possede une base MD3 solide cote tokens (couleurs/surface/shape/elevation/typography/motion).
- La conformite est toutefois bloquee par des ecarts structurants: dark mode incomplet, breakpoints incoherents, couverture composants MD3 partielle, lacunes a11y, et performance de bundle.

## 2) Contexte projet confirme

| Item | Valeur observee |
|---|---|
| React | 19.2.3 (`package.json:14`) |
| TypeScript | Oui (`package.json:25`) |
| Build tool | Vite (`package.json:26`) |
| UI library | Custom (pas de MUI/material deps) (`package.json:11`) |
| Scripts | `dev`, `build`, `preview` (`package.json:6`) |
| Tests auto | Aucun script test |

Verification build:
- `npm run build` passe.
- Warning Vite: chunks > 500kB.
- Chunk principal: `dist/assets/index-CVq01zYt.js` ~961.87kB (gzip 274.16kB).

## 3) Methodologie d'audit

1. Audit statique du code `src/`, `index.css`, `index.html`, `tailwind.config.js`.
2. Verification architecture/theme/tokens.
3. Couverture composants MD3 via recherche systematique.
4. Verification a11y statique (ARIA/focus/touch target).
5. Verification build/perf via production build.

Limites:
- Pas de campagne manuelle device lab (iPhone/iPad/4K).
- Pas d'execution Lighthouse/axe/NVDA dans cette passe CLI.

## 4) Partie 1 - Design System & Fondations

### 4.1 Couleurs

Points conformes:
- Roles MD3 principaux definis: `primary`, `secondary`, `tertiary`, `error`, `surface`, `outline`, `inverse`, `scrim` (`index.css:10`, `index.css:35`, `index.css:54`, `index.css:58`).
- Containers surface presentes (`index.css:45`).
- Mapping Tailwind vers variables MD3 present (`tailwind.config.js:14`, `index.html:16`).

Ecarts:
- Pas de palette tonale complete 0..100 exposee/utilisable par role.
- Role `warning` utilise dans features mais non defini dans theme:
  - usages: `src/features/finance/components/AddBudgetModal.tsx:60`, `src/features/finance/pages/FinanceManagementPage.tsx:478`, `src/features/approvals/pages/ApprovalsPage.tsx:240`
  - absence dans config couleur: `tailwind.config.js:14`
- Accent color dynamique via palette custom non MD3 tonale (`src/context/DataContext.tsx:56`).

### 4.2 Light/Dark mode

Points conformes:
- Preference theme persistee (`src/context/DataContext.tsx:238`).
- Respect logique `system` via `prefers-color-scheme` (`src/context/DataContext.tsx:259`).

Ecarts critiques:
- Classe `.dark` ajoutee/supprimee (`src/context/DataContext.tsx:255`) mais pas de variantes `dark:*` detectees.
- Aucun schema dark complet applique a l'UI.

### 4.3 Typographie

Points conformes:
- Tokens typescale MD3 complets definis (`index.css:120` a `index.css:166`).
- Classes utilitaires typographiques MD3 presentees (`index.css:258`).

Ecarts:
- Usage mixte MD3/ad-hoc:
  - classes MD3: 428 occurrences
  - classes ad-hoc (`text-sm/xl/...`, `font-bold/black`): 433 occurrences
- Harmonisation insuffisante sur pages feature.

### 4.4 Elevation & shape

Points conformes:
- Elevation tokens 0..5 definis (`index.css:170`).
- Shape tokens alignes MD3 (`index.css:179`).
- Card variante MD3 presente (`src/components/ui/Card.tsx:14`).

Ecarts:
- Dialog principal a `shadow-elevation-3` (`src/components/ui/Modal.tsx:143`) vs cible MD3 typique level 4.
- Incoherence scrim dialogs (`bg-scrim/32` vs `bg-scrim/60` dans `src/components/modals/SettingsModal.tsx:70`).

### 4.5 Spacing

Points conformes:
- Quelques tokens spacing existent (`tailwind.config.js:120`).

Ecarts:
- Forte presence de valeurs arbitraires `[xxpx]` dans de nombreux ecrans/composants (ex: `src/components/layout/PageContainer.tsx:23`, `src/features/locations/pages/LocationsPage.tsx:311`).
- Alignement partiel a la grille 4dp.

### 4.6 Iconographie

Points conformes:
- Material Symbols variable font centralise (`src/components/ui/MaterialIcon.tsx:18`).
- Support taille/weight/fill (`src/components/ui/MaterialIcon.tsx:27`, `src/components/ui/MaterialIcon.tsx:37`).

## 5) Partie 2 - Composants UI (couverture et conformite)

Statuts:
- OK: majoritairement conforme
- Partiel: present mais incomplet/non uniforme
- Manquant: non implemente

| Domaine | Composant MD3 | Statut | Evidence |
|---|---|---|---|
| Actions | Buttons (5 variantes) | Partiel | `src/components/ui/Button.tsx:6` |
| Actions | FAB (small/large/extended) | Manquant | aucun match |
| Actions | Icon button variantes/toggle | Partiel | usages disperses sans primitive dediee |
| Actions | Segmented buttons | Manquant | aucun composant dedie |
| Communication | Badges (dot/numeric/large) | Partiel | `src/components/ui/Badge.tsx:4` |
| Communication | Progress indicators MD3 | Partiel | impl ad-hoc `src/components/security/FacialRecognitionScan.tsx:112` |
| Communication | Snackbar | Partiel | `src/context/ToastContext.tsx:83` |
| Containment | Cards (elevated/filled/outlined) | OK (partiel) | `src/components/ui/Card.tsx:14` |
| Containment | Dividers | Partiel | pas de primitive dediee |
| Containment | Lists MD3 | Partiel | pas de list item standard MD3 |
| Navigation | Bottom app bar | Manquant | aucun composant dedie |
| Navigation | Bottom navigation | Manquant | aucun composant dedie |
| Navigation | Drawer | Partiel | `src/components/layout/Sidebar.tsx:24` |
| Navigation | Rail | Partiel | logique drawer/collapse custom |
| Navigation | Tabs | Partiel+ | `src/components/ui/PageTabs.tsx:69` |
| Navigation | Top app bar variants | Partiel | `src/components/Dashboard.tsx:218`, `src/components/layout/FullScreenLayout.tsx:28` |
| Selection | Checkboxes | Manquant (dedie) | seul switch `src/components/ui/Toggle.tsx:21` |
| Selection | Chips (assist/filter/input/suggestion) | Partiel+ | `src/components/ui/Chip.tsx:5` |
| Selection | Date pickers | Manquant | aucun composant dedie |
| Selection | Menus (role menu/menuitem) | Manquant/Partiel | `SelectField` en listbox (`src/components/ui/SelectField.tsx:215`) |
| Selection | Radio buttons | Manquant | aucun match |
| Selection | Sliders | Partiel | `src/components/modals/SettingsModal.tsx:262` |
| Selection | Switches | Partiel+ | `src/components/ui/Toggle.tsx:12` |
| Text inputs | Text fields filled/outlined | Partiel+ | `src/components/ui/InputField.tsx:17`, `src/components/ui/TextArea.tsx:7` |
| Dialogs/sheets | Dialogs | Partiel+ | `src/components/ui/Modal.tsx:139` |
| Dialogs/sheets | Bottom sheets | Manquant | aucun match |
| Dialogs/sheets | Side sheets | Manquant | aucun match |
| Dialogs/sheets | Tooltips | Partiel | tooltip custom `src/components/layout/SidebarItem.tsx:108` |
| Autres | Carousel | Manquant | aucun composant dedie |
| Autres | Search composant MD3 | Partiel | `src/components/ui/SearchFilterBar.tsx` |

Ecarts fonctionnels critiques detectes:
- Incoherence API bouton: `variant="outline"` utilise mais type attend `outlined` (`src/features/management/pages/SettingsPage.tsx:306`, `src/components/ui/Button.tsx:6`).
- Snackbar duree 3s sans action, 6s avec action (`src/context/ToastContext.tsx:61`) vs pratique MD3 frequente 4-10s.

## 6) Partie 3 - Responsive & Adaptive

### 6.1 Breakpoints

Ecarts critiques:
- Divergence entre config Tailwind projet et config runtime CDN:
  - `md-expanded: 840px` defini dans `tailwind.config.js:11`
  - runtime `index.html` ne definit que `xs` (`index.html:127`)
- Usage reel `md-expanded` dans l'app: 10 occurrences (`src/components/layout/Sidebar.tsx:71`, `src/components/Dashboard.tsx:218`).

### 6.2 Navigation adaptative

Etat:
- Navigation mobile/desktop custom avec sidebar collapse.
- Pas de pattern complet MD3 par window size class (bottom nav compact, rail medium, rail+drawer expanded).

## 7) Partie 4 - Motion & Animations

Points conformes:
- Easing et durees MD3 tokenises (`index.css:189`, `index.css:198`).
- State layer utilitaire present (`index.css:229`).

Ecarts:
- Opacites state layer focus/pressed a 0.10 (`index.css:211`, `index.css:212`) au lieu de 0.12 attendu frequemment.
- Nombreuses durees hardcodees `duration-200/300/500` hors tokens (ex: `src/components/layout/PageContainer.tsx:22`, `src/components/modals/SettingsModal.tsx:70`).
- `prefers-reduced-motion` absent.

## 8) Partie 5 - Accessibilite

### 8.1 Contraste

Calculs sur paires de tokens principales:
- on-primary/primary: 6.53:1
- on-secondary/secondary: 6.50:1
- on-tertiary/tertiary: 6.46:1
- on-error/error: 6.46:1
- on-surface/surface: 16.41:1
- on-surface-variant/surface-variant: 7.22:1

Conclusion: les paires de tokens principales passent globalement AA.

### 8.2 Navigation clavier et focus

Points conformes:
- Focus trap + Escape dans modal principal (`src/components/ui/Modal.tsx:93`, `src/components/ui/Modal.tsx:98`).
- Tablist accessible (`src/components/ui/PageTabs.tsx:69`).

Ecarts:
- Suppressions focus visible (`focus:ring-0`) dans plusieurs pages (ex: `src/features/users/pages/UserDetailsPage.tsx:114`, `src/features/inventory/pages/EquipmentDetailsPage.tsx:116`).
- Toggle password hors tab flow (`src/components/ui/InputField.tsx:148`).

### 8.3 ARIA formulaires

Ecarts critiques:
- Aucun `aria-invalid`, `aria-required`, `aria-describedby` detecte globalement dans `src/`.

### 8.4 Touch targets

Ecarts:
- Boutons a `h-7` sur dashboard (`src/features/dashboard/pages/DashboardPage.tsx:255`) en dessous de 48dp.
- `CloseButton` compact (`p-2 h-auto`) potentiellement insuffisant selon contexte (`src/components/ui/CloseButton.tsx:12`).

### 8.5 Images

- Compte `img`: 23
- Compte `alt=`: 23

Observation: bonne couverture quantitative, validation qualitative alt a confirmer manuellement.

## 9) Partie 6 - Architecture & implementation technique

Points conformes:
- Tokens MD3 centraux bien presents dans `index.css`.
- Composants UI custom deja structures.

Ecarts critiques/eleves:
- Pas de code splitting route-level:
  - aucun `React.lazy`/`import()` detecte
  - imports synchrones massifs dans `src/components/Dashboard.tsx:14`
- Runtime Tailwind CDN dans `index.html:11` (risque de divergence avec config build).
- Composants morts/incomplets:
  - `src/components/ui/WizardLayout.tsx` vide (0 octet)
  - `src/components/modals/SettingsModal.tsx` non reference.

## 10) Top anomalies prioritaires (extrait)

1. `MD3-CRIT-001` Breakpoints runtime/build incoherents.
2. `MD3-CRIT-002` Dark mode incomplet malgre toggle logique.
3. `MD3-CRIT-003` Roles couleur `warning` utilises mais non definis.
4. `MD3-CRIT-004` Couverture composants MD3 incompl ete (FAB/date picker/sheets/radio/bottom nav).
5. `MD3-CRIT-005` ARIA formulaires manquants + password toggle non tabbable.
6. `MD3-CRIT-006` `prefers-reduced-motion` absent.
7. `MD3-CRIT-007` Bundle principal trop lourd, pas de lazy loading.
8. `MD3-CRIT-008` Navigation adaptive non alignee sur window size classes MD3.

Details complets: voir `docs/md3-anomalies-register.md`.

## 11) Plan d'action priorise

Plan detaille: voir `docs/md3-migration-plan.md`.

Synthese effort:
- Phase 1 (fondations critiques): 38h
- Phase 2 (composants primaires): 74h
- Phase 3 (composants manquants): 62h
- Phase 4 (responsive/layout): 38h
- Phase 5 (a11y/tests): 28h
- Phase 6 (perf/polish/doc): 18h
- Total estime: 258h

## 12) Quick wins (<2h)

1. Ajouter `prefers-reduced-motion` global.
2. Corriger `variant="outline"` -> `outlined`.
3. Ajouter `aria-invalid`, `aria-describedby`, `aria-required` sur inputs.
4. Rendre password toggle tabbable.
5. Remplacer usages `warning` non definis par roles MD3 valides.
6. Retirer `focus:ring-0` sans alternative.

## 13) References officielles

- Colors: https://m3.material.io/styles/color/overview
- Typography: https://m3.material.io/styles/typography/overview
- Elevation: https://m3.material.io/styles/elevation/overview
- Shape: https://m3.material.io/styles/shape/overview
- Components: https://m3.material.io/components
- Window size classes: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
- Motion tokens: https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- WCAG quickref: https://www.w3.org/WAI/WCAG21/quickref/

## 14) Statut d'execution de l'audit

- Audit statique: termine
- Audit build/perf: termine
- Rapport executif: termine
- Registre anomalies detaillees: termine
- Plan de migration priorise: termine

