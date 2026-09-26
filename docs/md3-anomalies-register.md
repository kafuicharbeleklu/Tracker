# Registre des anomalies MD3

Date: 2026-02-14
Source: audit complet `docs/md3-audit-report-2026-02-14.md`

Note:
- 77 controles en ecart ont ete identifies pendant l'audit.
- Le registre ci-dessous consolide les ecarts en 38 anomalies actionnables (dedup par cause racine).

## Mise a jour de statut (2026-02-16)

| ID | Statut | Commentaire |
|---|---|---|
| MD3-HIGH-011 | Fermee | Suppression du runtime Tailwind CDN et migration vers generation build-time via Vite (`index.html`, `index.css`, `vite.config.ts`). |
| MD3-CRIT-008 | Partiellement fermee | Navigation adaptive validee automatiquement sur 6 devices / 60 flows (`docs/md3-multidevice-audit-results-2026-02-16.md`). |
| MD3-CRIT-007 | Partiellement fermee | Code splitting actif (lazy routes + manual chunks). Chunk principal reduit de ~1338kB a ~25kB; plus aucun chunk >500kB apres build du 2026-02-16. |

## A) Critiques (P0)

| ID | Categorie | Probleme | Impact | Effort | Evidence | Action recommandee |
|---|---|---|---|---:|---|---|
| MD3-CRIT-001 | Responsive | Breakpoints incoherents entre build/runtime | Layout/navigation instables | 6h | `tailwind.config.js:11`, `index.html:127` | Unifier la source de truth breakpoints et supprimer divergence runtime |
| MD3-CRIT-002 | Theme | Dark mode incomplet (classe `dark` sans styles effectifs) | Non conformite light/dark | 12h | `src/context/DataContext.tsx:255` | Definir schema dark complet et usage `dark:*`/tokens |
| MD3-CRIT-003 | Colors | Roles `warning` utilises mais non definis | Etats visuels casses | 4h | `src/features/finance/pages/FinanceManagementPage.tsx:478`, `tailwind.config.js:14` | Remplacer par roles MD3 ou definir role semantique coherent |
| MD3-CRIT-004 | Components | Couverture MD3 incomplet e (FAB, date picker, sheets, radio, bottom nav) | Conformite globale impossible | 80h | recherche composants: aucun match | Implementer roadmap composants manquants |
| MD3-CRIT-005 | A11y forms | ARIA formulaires absent (`aria-invalid`, `aria-describedby`, `aria-required`) | Accessibilite degradee | 10h | recherche globale `src/`: aucun match | Ajouter linking ARIA sur tous champs |
| MD3-CRIT-006 | Motion a11y | `prefers-reduced-motion` absent | Non conformite accessibilite motion | 2h | recherche `prefers-reduced-motion`: aucun match | Ajouter override global animations/transitions |
| MD3-CRIT-007 | Performance | Pas de code splitting (imports synchrones massifs) | LCP/TTI et bundle degrades | 14h | `src/components/Dashboard.tsx:14`, chunk 961.87kB | Introduire `React.lazy` + `Suspense` par route |
| MD3-CRIT-008 | Adaptive nav | Strategie navigation par window size classes incompl ete | UX incoherente selon device | 16h | `src/components/layout/Sidebar.tsx:81`, `src/components/Dashboard.tsx:218` | Definir pattern compact/medium/expanded conforme MD3 |

## B) Elevees (P1)

| ID | Categorie | Probleme | Impact | Effort | Evidence | Action recommandee |
|---|---|---|---|---:|---|---|
| MD3-HIGH-001 | Buttons | API incoherente `outline` vs `outlined` | Style/variant incorrect | 0.25h | `src/features/management/pages/SettingsPage.tsx:306`, `src/components/ui/Button.tsx:6` | Corriger usages et type union |
| MD3-HIGH-002 | Dialogs | Elevation dialog principale a level 3 | Ecart spec MD3 dialog | 1h | `src/components/ui/Modal.tsx:143` | Passer a level 4 pour dialogs |
| MD3-HIGH-003 | Dialogs | Scrim incoherent (32 vs 60) | Incoherence visuelle | 1h | `src/components/ui/Modal.tsx:128`, `src/components/modals/SettingsModal.tsx:70` | Uniformiser scrim selon contexte |
| MD3-HIGH-004 | Snackbar | Duree 3s/6s au lieu de fenetre MD3 courante | Lisibilite/messages | 1h | `src/context/ToastContext.tsx:61` | Ajuster a 4-10s configurable |
| MD3-HIGH-005 | Typography | Usage ad-hoc egal/depasse usage MD3 classes | Incoherence design system | 8h | comptage classes (433 ad-hoc) | Standardiser vers classes typescale MD3 |
| MD3-HIGH-006 | State layer | Focus/pressed opacities 0.10 vs 0.12 | Feedback interactif non standard | 0.5h | `index.css:211`, `index.css:212` | Aligner valeurs state layer |
| MD3-HIGH-007 | Focus | Presence de `focus:ring-0` sur pages interactives | Perte focus visible | 2h | `src/features/users/pages/UserDetailsPage.tsx:114` | Restaurer indicateur focus visible |
| MD3-HIGH-008 | Inputs | Password toggle hors tabulation | Access clavier reduit | 0.5h | `src/components/ui/InputField.tsx:148` | Retirer `tabIndex={-1}` |
| MD3-HIGH-009 | Touch targets | Boutons <48dp (h-7) | Risque mobile et a11y | 2h | `src/features/dashboard/pages/DashboardPage.tsx:255` | Forcer min touch target 48dp |
| MD3-HIGH-010 | Touch targets | CloseButton potentiellement trop compact | Risque tappable area | 1h | `src/components/ui/CloseButton.tsx:12` | Normaliser taille cible touch |
| MD3-HIGH-011 | Responsive | Utilisation runtime Tailwind CDN en prod | Divergence config/perf | 4h | `index.html:11` | S'appuyer sur pipeline build unique |
| MD3-HIGH-012 | Spacing | Multiples valeurs arbitraires `[xxpx]` | Rupture grille 4dp | 10h | ex `src/components/layout/PageContainer.tsx:23` | Remplacer par tokens spacing |
| MD3-HIGH-013 | Components | Menus MD3 semantiques absents (`role=menu`) | a11y/navigation | 6h | recherche roles menu: 0 | Implementer primitive Menu MD3 |
| MD3-HIGH-014 | Components | Bottom navigation absente | Pattern compact non conforme | 12h | aucun composant dedie | Ajouter composant navigation bar MD3 |
| MD3-HIGH-015 | Components | Date picker absent | Feature MD3 selection manquante | 12h | aucun composant dedie | Introduire date picker modal/docked |
| MD3-HIGH-016 | Components | Radio button absent | Couverture selection incomplet e | 6h | recherche radio: 0 | Ajouter primitive radio group |

## C) Moyennes (P2)

| ID | Categorie | Probleme | Impact | Effort | Evidence | Action recommandee |
|---|---|---|---|---:|---|---|
| MD3-MED-001 | Typography | Faible usage display styles | Hierarchie visuelle limitee | 3h | count `text-display-`: 4 | Revoir headings hero/pages |
| MD3-MED-002 | Cards | Hover/pressed non systematique sur cards interactives | Feedback inconsistent | 3h | `src/components/ui/Card.tsx:47` | Ajouter etats standardises |
| MD3-MED-003 | Badges | Dot/large badge non formalises | Couverture partielle | 3h | `src/components/ui/Badge.tsx:4` | Ajouter variantes badge MD3 |
| MD3-MED-004 | Progress | Pas de primitive Circular/Linear reusable | duplication styles | 5h | `src/components/security/FacialRecognitionScan.tsx:112` | Creer composants progress dedies |
| MD3-MED-005 | Divider | Pas de composant divider dedie | incoherence separators | 2h | utilitaires disperses | Ajouter composant Divider |
| MD3-MED-006 | Lists | Pas de list item heights 56/72/88 standard | list UX non uniform e | 6h | pas de primitive list | Creer ListItem variants |
| MD3-MED-007 | Navigation | Top app bar variants small/medium/large non formalisees | adaptation inegale | 8h | `src/components/layout/FullScreenLayout.tsx:28` | Definir primitives app bar |
| MD3-MED-008 | Chips | Etats disabled/selected/draggable partiels | ecarts de comportement | 4h | `src/components/ui/Chip.tsx:45` | Completer etats MD3 |
| MD3-MED-009 | Slider | Un seul slider ad-hoc | couverture selection partielle | 3h | `src/components/modals/SettingsModal.tsx:262` | composant Slider standard |
| MD3-MED-010 | Tooltip | Tooltip custom non complet (delay/placement mobile) | incoherence UX | 4h | `src/components/layout/SidebarItem.tsx:108` | composant Tooltip MD3 |
| MD3-MED-011 | Motion | Durees hardcodees nombreuses (`duration-200/300/500`) | coherence motion reduite | 4h | multiples fichiers | migrer vers tokens duration-* |
| MD3-MED-012 | Theme | Accent palettes custom non tonales MD3 | coherence couleur reduite | 6h | `src/context/DataContext.tsx:56` | passer a generation tonale MD3 |
| MD3-MED-013 | A11y | Qualite semantique headings a verifier manuellement | navigation SR incertaine | 4h | verification manuelle requise | audit heading map par page |
| MD3-MED-014 | A11y | Alt text qualitatif non valide | risque descriptif faible | 2h | 23 img / 23 alt | revue qualitative alt |

## D) Faibles (P3)

| ID | Categorie | Probleme | Impact | Effort | Evidence | Action recommandee |
|---|---|---|---|---:|---|---|
| MD3-LOW-001 | Hygiene | `WizardLayout.tsx` vide | dette mineure | 0.5h | `src/components/ui/WizardLayout.tsx` | supprimer ou implementer |
| MD3-LOW-002 | Hygiene | `SettingsModal` non reference | dette maintenance | 1h | `src/components/modals/SettingsModal.tsx` | supprimer ou reconnecter |
| MD3-LOW-003 | Legacy naming | aliases `dark.light`, `surface.subtle` deprecies | confusion tokens | 1h | `tailwind.config.js:59`, `tailwind.config.js:87` | cleanup alias legacy |
| MD3-LOW-004 | Snackbar shape | `rounded-xs` sur snackbar | detail visuel | 0.5h | `src/context/ToastContext.tsx:89` | aligner radius spec |
| MD3-LOW-005 | Nav badges | taille badge compacte en collapsed | lisibilite | 0.5h | `src/components/layout/SidebarItem.tsx:101` | ajuster min size |
| MD3-LOW-006 | Motion naming | `micro/macro` deprecies maintenus | lisibilite theme | 0.5h | `tailwind.config.js:147` | retirer aliases |

## E) Dependances et ordre d'execution recommande

1. MD3-CRIT-001 (breakpoints)
2. MD3-CRIT-002 (dark mode)
3. MD3-CRIT-003 (warning role)
4. MD3-CRIT-005 + MD3-HIGH-007/008/009 (a11y de base)
5. MD3-CRIT-007 (code splitting)
6. MD3-CRIT-004 (composants manquants) et MD3-CRIT-008 (adaptive nav)

## F) Definition of done (DoD)

- Tous P0 fermes.
- Tous P1 fermes ou planifies avec date/owner.
- Build stable (`npm run build`).
- Checklist review appliquee: `docs/md3-checklist.md`.
- Verification manuelle: clavier + mobile compact + desktop expanded.

