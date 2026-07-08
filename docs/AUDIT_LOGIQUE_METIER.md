# Audit — Logique métier (Chantier D)

> Diagnostic + plan d'action priorisé. **Aucune implémentation.** Chaque point indique le **risque** et l'**impact** d'un correctif.
> Date : 2026-06-30 · Périmètre : `context/DataContext.tsx` (2363 l.), `lib/businessRules.ts`, `lib/rbac.ts`, `config/rbacDefaults.ts`, `hooks/useHistory.ts`, `lib/persistence.ts`.

---

## 1. Synthèse

La logique métier est **riche et globalement structurée** (vraie machine à états d'approbation, moteur RBAC complet, mutations gardées renvoyant `BusinessRuleDecision`). Mais il existe **une incohérence d'autorisation de fond**, plusieurs **trous de couverture**, et des **zones sur-complexes** (statuts legacy + modernes, `DataContext` monolithe) qui méritent simplification.

---

## 2. Bugs / incohérences

### 🔴 P0 — Incohérence d'autorisation RBAC ↔ businessRules
- **Constat** : deux couches de permission **divergentes**.
  - L'**UI** (`hooks/useAccessControl.ts`) calcule les droits via `resolveEffectiveAccess` = moteur RBAC **complet** (rôles + groupes + permissions directes + rôles temporaires, deny-wins).
  - Les **mutations** de `DataContext` sont gardées par `lib/businessRules.ts`, qui appelle `roleCan` (`config/rbacDefaults.ts:472`). Or `roleCan` **ne regarde que le rôle système de base** (`SYSTEM_ROLE_ID_BY_USER_ROLE[role]`) → il **ignore** groupes, permissions directes et temporaires, et **n'applique pas les `deny`** directs.
- **Risque** :
  - Un droit accordé via **groupe/permission directe** apparaît dans l'UI mais la mutation est **refusée** par `roleCan` → action visible mais cassée.
  - Un **`deny`** RBAC (retrait ciblé d'un droit) est respecté par l'UI mais **pas** par `roleCan` → l'action reste possible côté mutation = **faille d'autorisation**.
- **Impact correctif** : faire pointer les gardes `businessRules` sur le **moteur RBAC effectif** (le même que l'UI). Effort moyen, touche toutes les fonctions `canManage*ByRole`. → **Décision D3**.

### 🟠 P1 — `updateApproval` : journalisation d'événements incomplète
- **Constat** (`DataContext.tsx:2101-2104`) : seuls 3 statuts reçoivent un `EventType` spécifique (`WAITING_IT_PROCESSING`→`APPROVAL_MANAGER`, `Approved`→`APPROVAL_ADMIN`, `Rejected`→`APPROVAL_REJECT`). **Tous les autres** (`WAITING_DOTATION_APPROVAL`, `PENDING_DELIVERY`, `Completed`, `Cancelled`…) sont loggés en **`UPDATE` générique**, alors que `types/index.ts` définit une taxonomie riche (`ASSIGN_DOTATION_WAIT`, `ASSIGN_CONFIRMED`…).
- **Risque** : piste d'audit **appauvrie / trompeuse** ; l'historique ne reflète pas les étapes réelles du workflow.
- **Impact correctif** : faible — compléter le mapping statut→`EventType`. Sûr.

### 🟠 P1 — Historique Admin : géo-scoping non implémenté
- **Constat** (`hooks/useHistory.ts:80-83`) : `if (role === 'Admin' && currentUser.managedCountries) { /* Pour l'instant, on laisse passer tout */ }`. Un Admin censé être limité à ses pays voit **tout l'historique**.
- **Risque** : **sur-exposition de données** si le cloisonnement géographique est une exigence métier.
- **Impact correctif** : moyen, dépend de la **Décision D4** (le géo-scoping est-il requis ?).

### 🟠 P1 — Coexistence statuts d'approbation **legacy + modernes**
- **Constat** : `types/index.ts:297-310` et `businessRules.ts` (`APPROVAL_TRANSITIONS`, `*_ACTIVE_STATUSES`) gèrent **en parallèle** les statuts modernes (`WAITING_MANAGER_APPROVAL`…) **et** legacy (`Pending`, `Processing`, `WaitingManager`, `WaitingUser`). Champs legacy aussi conservés sur `Approval` (`types/index.ts:349`).
- **Risque** : **surface de bug élevée** (chaque règle doit gérer 2 vocabulaires), tests difficiles, transitions ambiguës.
- **Impact correctif** : moyen/élevé — unifier vers le workflow moderne. Dépend des **Décisions D1/D2**.

### 🟡 P2 — Historique « User » : visibilité équipement fragile
- **Constat** (`useHistory.ts:32, 67`) : un User/Manager ne voit un événement `EQUIPMENT` que si `event.metadata?.beneficiaryId` est renseigné. Si un événement équipement n'a pas ce métadonnée, il est **invisible** pour le bénéficiaire concerné.
- **Risque** : un utilisateur **rate des événements sur son propre équipement** (dépend de la rigueur de remplissage des metadata à chaque `logEvent`).
- **Impact correctif** : moyen — croiser avec l'attribution réelle de l'équipement plutôt que la metadata seule.

### 🟡 P2 — Petites incohérences `updateApproval`
- `requestDate: 'Aujourd\'hui'` **codé en dur** à chaque transition (`DataContext.tsx:2082`) — champ legacy, chaîne FR figée au lieu d'une date.
- Rôle de repli **incohérent** dans les logs : `'User'` au refus (l.2065) vs `'Admin'` au succès (l.2110).
- **Risque** : faible (cosmétique/données d'historique). **Impact** : trivial.

---

## 3. Simplifications (zones sur-extrapolées)

### `DataContext` monolithe — 2363 lignes
- Un seul fichier porte users, equipment, approvals, locations, catégories/modèles, **toute la config RBAC** (rôles/groupes/assignations/workflows), settings, devices détectés, historique.
- **Risque actuel** : maintenabilité, re-renders larges, surface de conflit lors des éditions.
- **Proposition** : découper en contextes/domaines (ex. `RbacDataContext`, garder `Data` pour le parc). **Impact** : change des chemins d'import → **Décision D6**.

### Double couche de permission
- Même si on corrige l'incohérence P0, conserver **deux** systèmes (`roleCan` grossier + moteur RBAC) reste fragile. **Proposition** : une **source de vérité unique** (le moteur RBAC) consommée par l'UI **et** les gardes métier.

### Amortissement non rétroactif
- `DataContext.tsx:1186` : « on laisse l'existant tel quel, la règle s'applique aux nouveaux/modifiés ». Les actifs existants ne recalculent pas selon les nouveaux paramètres d'amortissement.
- **Risque** : incohérence comptable entre anciens et nouveaux actifs. → **Décision D5**.

---

## 4. Effets de bord — persistance / `localStorage`

- **Seed mock + persistance fusionnés** : au démarrage, le store est **seedé depuis les mocks** puis **fusionné** avec le `localStorage` (`seedById`/`seedByEmail` ~l.298-381, `mergePersistedRbacAssignments` ~l.476, `getPersistedValue` avec migration de clés legacy `neemba_*`→`tracker_*`).
- **Risque** : des **données persistées obsolètes** peuvent **masquer** des évolutions du code/mock (ou inversement), de façon difficile à diagnostiquer ; logique de merge complexe = source de bugs silencieux. Pertinent surtout **avant** le branchement backend (Chantier A) qui remplacera cette couche.
- **Impact** : à clarifier lors de A ; d'ici là, documenter/encadrer la stratégie de merge.

### Perf (mineur)
- `useHistory.filterEvents` est **recréée à chaque render** (pas de `useMemo`/`useCallback`) → recalcul à chaque rendu des consommateurs. Impact faible.

---

## 5. Plan d'action priorisé (après validation)

> **État au 2026-07-01** : ✅ faits — #1 (consolidation RBAC / P0), #2 (event-mapping), #3 (géo-scoping : branche morte retirée + documentée), #5 (visibilité équipement `useHistory`), #6 (`requestDate` figé). ⏳ différés — #4 (statuts legacy → avec backend), #7 (amortissement), #8 (découpe `DataContext`). Cosmétique non fait : rôles de repli des logs, retrait du `roleCan` mort.

| # | Action | Gravité | Dépend de |
|---|---|---|---|
| 1 | Unifier les gardes `businessRules` sur le **moteur RBAC effectif** (corrige l'incohérence d'autorisation) | 🔴 P0 | D3 |
| 2 | Compléter le mapping statut→`EventType` dans `updateApproval` | 🟠 P1 | — |
| 3 | Trancher + implémenter le **géo-scoping** historique Admin | 🟠 P1 | D4 |
| 4 | Unifier les statuts d'approbation (supprimer legacy) | 🟠 P1 | D1, D2 |
| 5 | Fiabiliser la visibilité équipement dans `useHistory` | 🟡 P2 | — |
| 6 | Nettoyer `updateApproval` (`requestDate`, rôles de repli) | 🟡 P2 | — |
| 7 | Amortissement rétroactif | 🟡 P2 | D5 |
| 8 | Découper `DataContext` par domaine | 🟡 P2 | D6 |
| 9 | Encadrer la stratégie seed/persist | 🟢 P3 | (lié à A) |

> Reco de séquencement : **1 → 2 → 4** (les plus à risque/valeur), puis le reste. Idéalement **avant** le Chantier A (le backend s'appuiera sur une logique assainie).

---

## 6. Décisions requises (avant tout correctif)

- **D1** — Le workflow moderne 4 phases (Manager → IT → Dotation → Réception) est-il **définitif** → on **supprime** les statuts legacy ?
- **D2** — Des **données legacy** circulent-elles (localStorage d'utilisateurs, vraies données) nécessitant une **migration** plutôt qu'une suppression sèche ?
- **D3** — On consolide sur le **moteur RBAC** comme source de vérité unique (UI + gardes métier) ?
- **D4** — Le **géo-scoping** de l'historique Admin est-il une **exigence** (sinon on retire la branche morte) ?
- **D5** — L'**amortissement** doit-il s'appliquer **rétroactivement** aux actifs existants ?
- **D6** — OK pour **découper `DataContext`** (impacte des chemins d'import) ?
- **D7** (transverse) — Souhaites-tu introduire **Vitest** pour sécuriser ces corrections par des tests ? (la logique d'approbation/RBAC s'y prête bien)
