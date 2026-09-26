# Plan de migration MD3 priorise

Date: 2026-02-14
Base: `docs/md3-audit-report-2026-02-14.md` + `docs/md3-anomalies-register.md`

## 1) Objectif

Atteindre une conformite MD3 >= 95/100 en eliminant tous les ecarts critiques et en normalisant les composants, le responsive, la motion et l'accessibilite.

## 2) Planning par phase

## Phase 1 - Fondations critiques (S1-S2)

Objectif: stabiliser theme/tokens/breakpoints/a11y de base.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| MD3-CRIT-001 | Unifier breakpoints build/runtime | 6h | P0 | - |
| MD3-CRIT-002 | Implementer vrai schema dark complet | 12h | P0 | CRIT-001 |
| MD3-CRIT-003 | Corriger roles couleur warning non definis | 4h | P0 | - |
| MD3-CRIT-006 | Ajouter support `prefers-reduced-motion` | 2h | P0 | - |
| MD3-CRIT-005 | Ajouter ARIA formulaires standards | 10h | P0 | - |
| MD3-HIGH-007 | Restaurer focus visible (`focus:ring-0`) | 2h | P1 | - |
| MD3-HIGH-008 | Password toggle tabbable | 0.5h | P1 | - |
| MD3-HIGH-009 | Touch targets critiques >=48dp | 2h | P1 | - |

Total phase 1: 38.5h

## Phase 2 - Composants primaires (S3-S5)

Objectif: aligner primitives UI les plus utilisees.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| MD3-HIGH-001 | Normaliser API variantes Buttons | 0.25h | P1 | - |
| MD3-HIGH-002 | Ajuster elevation dialogs | 1h | P1 | - |
| MD3-HIGH-003 | Uniformiser scrim dialogs | 1h | P1 | - |
| MD3-HIGH-004 | Aligner comportement snackbar | 1h | P1 | - |
| MD3-HIGH-013 | Introduire primitive Menu MD3 | 6h | P1 | - |
| MD3-HIGH-014 | Implementer Bottom Navigation MD3 | 12h | P1 | CRIT-001 |
| MD3-MED-005 | Composant Divider dedie | 2h | P2 | - |
| MD3-MED-006 | Primitive List/ListItem MD3 | 6h | P2 | - |
| MD3-MED-010 | Tooltip MD3 dedie | 4h | P2 | - |
| MD3-MED-008 | Completer etats Chips | 4h | P2 | - |

Total phase 2: 37.25h

## Phase 3 - Composants manquants (S6-S8)

Objectif: couvrir les composants MD3 absents.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| MD3-HIGH-016 | Radio buttons + group | 6h | P1 | - |
| MD3-HIGH-015 | Date picker (modal + docked) | 12h | P1 | - |
| MD3-CRIT-004-A | FAB (standard/small/large/extended) | 12h | P0 | Phase 1 |
| MD3-CRIT-004-B | Bottom sheet (standard/modal) | 12h | P0 | Phase 1 |
| MD3-CRIT-004-C | Side sheet (modal/detached) | 8h | P0 | Phase 1 |
| MD3-CRIT-004-D | Checkbox primitive dediee | 4h | P0 | Phase 1 |
| MD3-MED-009 | Slider primitive dediee | 3h | P2 | - |
| MD3-MED-003 | Badges dot/numeric/large | 3h | P2 | - |
| MD3-MED-004 | Progress primitives circular/linear | 5h | P2 | - |

Total phase 3: 65h

## Phase 4 - Responsive & adaptive (S9-S10)

Objectif: aligner layout/nav par classes de fenetre MD3.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| MD3-CRIT-008 | Strategie nav adaptive complete | 16h | P0 | CRIT-001 |
| MD3-HIGH-012 | Rationaliser spacing arbitraire | 10h | P1 | - |
| MD3-MED-007 | Formaliser top app bar variants | 8h | P2 | - |
| MD3-MED-001 | Reequilibrer hierarchy display/headline | 3h | P2 | - |
| MD3-HIGH-005 | Migration typo ad-hoc -> MD3 classes | 8h | P1 | - |

Total phase 4: 45h

## Phase 5 - Performance & quality (S11-S12)

Objectif: reduire dette perf et fiabiliser quality gates.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| MD3-CRIT-007 | Code splitting route-level | 14h | P0 | - |
| MD3-MED-011 | Migration durees hardcodees -> tokens | 4h | P2 | - |
| MD3-HIGH-011 | Supprimer dependance runtime Tailwind CDN | 4h | P1 | CRIT-001 |
| MD3-LOW-001 | Traiter `WizardLayout.tsx` vide | 0.5h | P3 | - |
| MD3-LOW-002 | Supprimer/reintegrer `SettingsModal` mort | 1h | P3 | - |

Total phase 5: 23.5h

## Phase 6 - Validation & gouvernance (S13)

Objectif: rendre la conformite durable dans les PR futures.

| ID | Tache | Effort | Priorite | Dependances |
|---|---|---:|---|---|
| GOV-001 | Appliquer checklist MD3 sur PR template | 1h | P1 | deja cree |
| GOV-002 | Ajouter script de verification a11y/linters UI | 8h | P2 | - |
| GOV-003 | Revue manuelle multi-devices + clavier | 8h | P1 | phases 1-5 |
| GOV-004 | Baseline KPI et suivi hebdo | 4h | P2 | - |

Total phase 6: 21h

## 3) Estimation globale

- Effort total: ~230h a ~260h (selon profondeur de refonte composants)
- Equipe 1 dev full-time: ~6 a 7 semaines
- Equipe 1 dev a 50%: ~3 a 4 mois

## 4) Quick wins immediats (<1 jour)

1. Corriger `outline` -> `outlined` (15 min).
2. Ajouter `prefers-reduced-motion` global (1h).
3. Rendre password toggle tabbable (30 min).
4. Ajouter ARIA de base sur Input/TextArea (2h).
5. Remplacer 3 usages `warning` non definis (1h).
6. Corriger boutons `h-7` <48dp (1h).

## 5) KPI de suivi

| KPI | Baseline | Cible |
|---|---:|---:|
| Score MD3 global | 45 | >=95 |
| P0 ouverts | 8 | 0 |
| P1 ouverts | 24 | <=3 |
| WCAG AA sur ecrans critiques | partiel | 100% |
| Chunk principal (kB) | 961.87 | <400 |
| LCP cible | inconnu | <2.5s |

## 6) Definition de reussite

- Tous P0 fermes.
- Responsive stable sur compact/medium/expanded/large.
- A11y clavier complete sur flux critiques.
- Performance sans warning chunk majeur.
- Checklist MD3 appliquee systematiquement dans les PR.

