# Audit Backlog - 2026-02-20

## P0 (immediat)

1. RBAC serveur/store sur actions destructives
- Scope: `deleteEquipment`, `deleteFinanceExpense`, mutations finance sensibles.
- Critere d'acceptation:
  - Refus explicite si role non autorise.
  - Message d'erreur coherent UI.
  - Journalisation `VIEW_SENSITIVE` ou `UPDATE` avec motif de refus.
- References: `src/context/DataContext.tsx:1123`, `src/context/DataContext.tsx:732`, `src/lib/businessRules.ts:473`.

2. Retrait des logs sensibles auth
- Scope: suppression des mots de passe temporaires en logs + flag demo login.
- Critere d'acceptation:
  - Aucun log de secret en clair.
  - Login demo inactive en mode production.
- References: `src/services/authService.ts:147`, `src/context/AuthContext.tsx:46`, `src/context/AuthContext.tsx:100`.

## P1 (court terme)

1. Normalisation des statuts workflow
- Scope: unifier `ApprovalStatus`/`AssignmentStatus` et labels.
- Critere d'acceptation:
  - Taxonomie canonique documentee.
  - Mapping legacy->canonique applique.
  - Badges cohérents (meme statut, meme libelle/couleur partout).
- References: `src/types/index.ts:259`, `src/lib/businessRules.ts:129`, `src/lib/businessRules.ts:159`.

2. Correctif responsive touch targets
- Scope: tous controles interactifs compact/medium.
- Critere d'acceptation:
  - Hit area >=48x48px pour boutons/icones interactifs.
  - `qa:devices:auto` sans fail touch target.
- References: `docs/md3-multidevice-audit-results-2026-02-20.md`.

3. Triage visual regression
- Scope: 24 ecrans changes vs baseline.
- Critere d'acceptation:
  - Liste "intentional vs bug" validee.
  - Baseline mise a jour uniquement pour changements approuves.
- References: `docs/md3-visual-regression-results-2026-02-20.md`.

4. Fix encodage textes budget
- Scope: `AddBudgetModal` et autres chaines accentuees degradees.
- Critere d'acceptation:
  - Aucun texte mojibake.
  - Relecture FR complete sur finance budget.
- References: `src/features/finance/components/AddBudgetModal.tsx:51`.

## P2 (moyen terme)

1. Refactor DataContext par domaine
- Scope: contexts separes inventory/users/finance/approvals + selectors memoises.
- Critere d'acceptation:
  - Diminution rerenders inutiles.
  - Code plus modulaire et testable.
- References: `src/context/DataContext.tsx:1359`, `src/hooks/useAccessControl.ts:37`.

2. Optimisation performance bundles
- Scope: lazy-load avancé des modules lourds PDF/XLSX.
- Critere d'acceptation:
  - Plus aucun warning >500kB.
  - Temps de chargement initial reduit.
- References: `docs/audit/audit-evidence-2026-02-20/auto/build.log`.

3. Harmonisation terminologie navigation
- Scope: remplacer toute divergence "Catalogue" / "Gestion".
- Critere d'acceptation:
  - Terminologie unique dans sidebar, topbar, titres, routes.
- References: `src/hooks/useAppNavigation.ts:19`, `src/components/layout/AppLayout.tsx:117`.

## Addendum Architecture & Code (2026-02-21)

### P1 (priorite haute)

1. Decouper `DataContext` en contextes metier
- Scope: `InventoryDataProvider`, `UsersDataProvider`, `FinanceDataProvider`, `ApprovalsDataProvider`, `SettingsDataProvider`.
- Critere d'acceptation:
  - Chaque provider expose un contrat TypeScript limite a son domaine.
  - Les composants ne consomment plus l'objet global `useData` quand ce n'est pas necessaire.
  - Rerenders reduits sur pages non concernees.
- References: `src/context/DataContext.tsx:313`, `src/context/DataContext.tsx:1397`.

2. Unifier l'architecture de routing
- Scope: eliminer la duplication hash-router custom + mapping `switch` de vues.
- Critere d'acceptation:
  - Une seule source de verite routes -> composants.
  - Un seul mapping des titres de page.
  - Suppression de la route vide `src/routes/index.ts`.
- References: `src/hooks/useRouter.ts:5`, `src/hooks/useAppNavigation.ts:42`, `src/components/layout/AppLayout.tsx:140`, `src/routes/index.ts:1`.

3. Extraire la logique metier hors des pages lourdes
- Scope: finance import/update/delete, etapes wizard, derivees statistiques.
- Critere d'acceptation:
  - Les pages gardent orchestration UI et rendu.
  - Les regles de traitement sont centralisees dans hooks/services testables.
- References: `src/features/finance/pages/FinanceManagementPage.tsx:273`, `src/features/finance/components/AddExpenseModal.tsx:146`, `src/features/finance/components/AddExpenseModal.tsx:235`.

### P2 (priorite moyenne)

1. Stabiliser `useAccessControl`
- Scope: memoisation des policies, suppression de la branche "Fail safe or strict?" par decision explicite deny-by-default.
- Critere d'acceptation:
  - Fonctions de policy stables (memo/callback) et predictibles.
  - Cas non couverts -> refus explicite.
- References: `src/hooks/useAccessControl.ts:37`, `src/hooks/useAccessControl.ts:116`.

2. Renforcer TypeScript progressivement
- Scope: activer `strict` par lot et retirer `allowJs` si non requis.
- Critere d'acceptation:
  - Plan de migration par dossiers.
  - Aucun blocage build/lint dans la trajectoire.
- References: `tsconfig.json:19`, `tsconfig.json:27`.

3. Aligner la documentation architecture
- Scope: harmoniser `README.md`, `AGENTS.md` et la realite du routing/runtime.
- Critere d'acceptation:
  - Docs d'onboarding sans ambiguite.
  - Workflow dev/deploy documente de facon verifiable.
- References: `README.md:5`, `AGENTS.md:14`, `src/hooks/useRouter.ts:5`.

4. Nettoyage des artefacts de lint
- Scope: retirer les rapports lint residues du repository et ignorer les futures sorties.
- Critere d'acceptation:
  - `lint_report.txt` non versionne.
  - Regles `.gitignore` explicites.
- References: `.gitignore:4`, `lint_report.txt`.

## Verification prevue
- `npm run lint`
- `npm run build`
- `npm run qa:a11y:auto`
- `npm run qa:devices:auto`
- `npm run qa:visual:auto`
