# Audit Global Tracker - 2026-02-20

## Portee
- Application: Neemba Tracker (SPA React/TypeScript)
- Date: 2026-02-20
- Type: audit hybride (automatique + manuel)
- Reference metier complementaire: `audit/Audit_Applicatif_Complet_Tracker (1).docx`

## Sources de preuve
- `docs/audit/audit-evidence-2026-02-20/auto/lint.log`
- `docs/audit/audit-evidence-2026-02-20/auto/build.log`
- `docs/audit/audit-evidence-2026-02-20/auto/qa-a11y-auto.log`
- `docs/audit/audit-evidence-2026-02-20/auto/qa-devices-auto.log`
- `docs/audit/audit-evidence-2026-02-20/auto/qa-visual-auto.log`
- `docs/md3-a11y-automation-results-2026-02-20.md`
- `docs/md3-multidevice-audit-results-2026-02-20.md`
- `docs/md3-visual-regression-results-2026-02-20.md`
- `docs/audit/audit-evidence-2026-02-20/manual/reference-audit-docx-extracted.txt`

## Resume executif
Le socle fonctionnel est present et les controles de base sont en place (lint/build OK, a11y smoke auto OK). En revanche, 3 risques majeurs restent ouverts:
1. Enforcement des permissions principalement cote UI, pas dans toutes les fonctions de mutation du store.
2. Stabilite visuelle encore faible (24/24 regressions visuelles vs baseline, triage manuel requis).
3. Dette technique de structure (DataContext monolithique + persistence locale massive) qui limite evolutivite et fiabilite.

Score global estime: **64/100**.

## Resultats automatiques
- `lint`: OK
- `build`: OK avec warning chunk >500 kB (`vendor-pdfjs`)
- `qa:a11y:auto`: 11/11 pass (smoke clavier/focus)
- `qa:devices:auto`: 60 pass / 0 fail (apres correction des scripts QA + cibles tactiles login)
- `qa:visual:auto`: 0 match / 24 changed (regression ou baseline obsolete)

## Constat detaille (priorise)

### Critique

1. **RBAC non enforce systematiquement dans le store (bypass possible hors UI)**
- Evidence:
  - `src/context/DataContext.tsx:1123` (deleteEquipment) sans check de role.
  - `src/context/DataContext.tsx:732` (deleteFinanceExpense) sans check de role.
  - `src/lib/businessRules.ts:473` (rule suppression equipement) ne valide que l'etat/historique, pas le role acteur.
- Impact:
  - Si une action est declenchee hors ecran protege (ou via futur endpoint/bridge), un role non autorise peut potentiellement supprimer/modifier.
- Recommandation:
  - Ajouter un garde RBAC obligatoire dans chaque mutation critique du DataContext (delete/update/create sensibles), base sur `currentUser.role` + perimetre.

2. **Exposition de secrets temporaires en logs (mode auth mock)**
- Evidence:
  - `src/services/authService.ts:147` log console contenant mot de passe temporaire.
  - `src/context/AuthContext.tsx:46` token mock; `src/context/AuthContext.tsx:100` login demo direct par email.
- Impact:
  - Risque de fuite d'information sensible en environnement partage ou si mode demo active en production.
- Recommandation:
  - Bloquer strictement ces chemins par feature flag d'environnement et supprimer tout log de secret.

### Majeur

3. **Incoherence de nomenclature statuts (legacy + nouveau workflow melanges)**
- Evidence:
  - `src/types/index.ts:259` (ApprovalStatus contient `Pending/Processing/...` et `WAITING_*`).
  - `src/lib/businessRules.ts:129` + `src/lib/businessRules.ts:159` (mapping multiples vers labels identiques).
- Impact:
  - Difficultes de comprehension workflow, tri/statistiques ambigus, risque de transitions metier incoherentes.
- Recommandation:
  - Normaliser la taxonomie de statuts (canonique unique + mapping de migration).

4. **Performance/maintenabilite: DataContext monolithique avec rerenders larges**
- Evidence:
  - `src/context/DataContext.tsx:1359` (provider unique expose tout l'etat + toutes mutations).
  - `src/context/DataContext.tsx:416` a `src/context/DataContext.tsx:450` (multiples ecritures localStorage a chaque update slice).
  - `src/hooks/useAccessControl.ts:37` (fonctions renvoyees non memoisees, recreees a chaque render).
- Impact:
  - Couplage fort, rerenders transverses, debugging plus complexe, risque de boucles de mise a jour.
- Recommandation:
  - Decouper en contexts par domaine (inventory/users/finance/approvals) + selectors memoises.

5. **Responsive mobile/tablette - correction appliquee**
- Evidence:
  - `docs/md3-multidevice-audit-results-2026-02-20.md` -> 60 pass / 0 fail.
  - Correctifs: `src/features/auth/pages/LoginPage.tsx` (cibles tactiles login) et scripts QA (`scripts/run-md3-multidevice-audit.mjs`).
- Impact:
  - Risque tactile initial leve sur le perimetre des flows audites.
- Recommandation:
  - Conserver ce controle en CI pour prevenir les regressions.

6. **Regressions visuelles massives vs baseline**
- Evidence:
  - `docs/md3-visual-regression-results-2026-02-20.md` -> 24/24 changed.
- Impact:
  - Instabilite percue, risque de regressions UI silencieuses.
- Recommandation:
  - Triage changed: intentional vs unintended, puis update baseline uniquement apres validation humaine.

7. **Taille bundle elevee sur modules lourds**
- Evidence:
  - `docs/audit/audit-evidence-2026-02-20/auto/build.log` -> warning >500kB, `vendor-pdfjs` notamment.
- Impact:
  - Cout de chargement initial, surtout reseaux contraints.
- Recommandation:
  - Split plus agressif (import dynamique), chargement a la demande des flows PDF/XLSX.

### Modere

8. **Defauts d'encodage (mojibake) dans le flux budget**
- Evidence:
  - `src/features/finance/components/AddBudgetModal.tsx:51` (`MatÃ©riel IT`), `:59`, `:68`, `:83`.
- Impact:
  - Qualite percue faible, ambiguite libelles.
- Recommandation:
  - Re-encoder en UTF-8 propre et nettoyer toutes chaines accentuees.

9. **Incoherence libelle navigation "Gestion" vs "Catalogue"**
- Evidence:
  - `src/hooks/useAppNavigation.ts:19` (Gestion), `src/components/layout/AppLayout.tsx:117` (Catalogue).
- Impact:
  - Incoherence cognitive/navigation.
- Recommandation:
  - Unifier la terminologie sur toutes les couches (sidebar, topbar, routes, titres).

## Controle specifique demande (admin supprime super admin)
- **Etat actuel:** garde metier present.
- Evidence:
  - `src/lib/businessRules.ts:567` (Admin non SuperAdmin ne peut pas supprimer SuperAdmin).
  - `src/context/DataContext.tsx:964` (deleteUser passe par la regle metier).
- Conclusion:
  - Le cas est protege dans le code audite ce jour.

## Recommandation d'execution (30 jours)
- Semaine 1: verrou RBAC store + suppression logs sensibles.
- Semaine 2: normalisation statuts + migration mapping legacy.
- Semaine 3: tri visual regression + validation humaine baseline.
- Semaine 4: refactor context par domaine + optimisation bundles lourds.

## Livrables associes
- Registre: `docs/audit/audit-register-2026-02-20.csv`
- Backlog: `docs/audit/audit-backlog-2026-02-20.md`
- Scorecard: `docs/audit/audit-scorecard-2026-02-20.md`
