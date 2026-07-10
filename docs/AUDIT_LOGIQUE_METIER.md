# Audit — Logique métier (Chantier D)

> Diagnostic + plan d'action priorisé. **Aucune implémentation.** Chaque point indique le **risque** et l'**impact** d'un correctif.
> Date : 2026-06-30 · Périmètre : `context/DataContext.tsx` (2363 l.), `lib/businessRules.ts`, `lib/rbac.ts`, `config/rbacDefaults.ts`, `hooks/useHistory.ts`, `lib/persistence.ts`.
> **Complété le 2026-07-09** par la **§7** (Chantier D vague 1 : diagnostic des 5 items hérités du Chantier C — pas un ré-audit complet ; la vague 2 reste à ouvrir séparément).

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

---

## 7. Passe du 2026-07-09 — Chantier D vague 1 (5 items hérités du Chantier C)

> **Diagnostic uniquement — aucune modification de code.** Périmètre borné aux 5 items repérés pendant le Chantier C ; l'audit complet (transitions non couvertes, double couche RBAC + businessRules, monolithe `DataContext`) reste une **vague 2 séparée**. Rien côté style/UI au-delà de ce que le fix logique impose ; pas de TypeScript strict ni de test runner introduits ici.
>
> **Convention** : chaque fait est **Constaté** (code lu, ou commande exécutée quand précisé) ou **Déduit** (chemin tracé dans le code mais non exercé au rendu). Sévérité : Bloquant / Majeur / Mineur / Polish · Effort : XS / S / M / L. Pour chaque item : risque si on ne touche à rien, correctif proposé, risque du correctif (et quoi vérifier), et **valeur d'un test unitaire léger** — sans monter de test runner maintenant (décision D7, séparée).

### 7.1 Approbations — les actions par rangée ignorent la machine à états (« Refuser » sur demande approuvée)

**Constaté — la chaîne complète, quatre maillons :**

1. **`getStepDetails` sert des libellés statiques pour *tous* les statuts** (`ApprovalsPage.tsx:275-365`) : `rejectText: 'Refuser'` partout — y compris `Approved` (:316-324), `Rejected` (:326-334), `Cancelled` (:336-344), `Completed` (:346-354) et le repli « Statut inconnu » (:357-364) — sans jamais dériver la disponibilité depuis `APPROVAL_TRANSITIONS` (`businessRules.ts:108-119`, où `Approved`/`Rejected`/`Cancelled`/`Completed` n'ont **aucune entrée source**).
2. **Seul le SuperAdmin voit ces boutons sur des statuts terminaux** : `canUserActOnApproval` retourne `true` inconditionnellement pour SuperAdmin (`businessRules.ts:342`), sans vérifier `isApprovalActiveStatus`. Conséquence directe : l'onglet « En cours » du SuperAdmin (`ApprovalsPage.tsx:71-84`, `actionable = approvals.filter(...)`) contient **toutes** les demandes, y compris terminées — elles apparaissent en double (En cours **et** Historique) et gonflent le badge de l'onglet (:261-267). Pour Manager/Admin/User, les gates (`businessRules.ts:162-164`) ne couvrent que des statuts actifs : pas de boutons trompeurs.
3. **`handleAction` n'a pas de branche pour ces statuts** (`ApprovalsPage.tsx:213-241`) : sur `Approved`/`Rejected`/`Cancelled`/`Completed`, « Voir » = **step-up PIN puis silence total** (aucune navigation, aucun toast). Idem pour le statut legacy **`Processing`** : il est dans `IT_GATES` (:163) et reçoit le bouton « Affecter » (`getStepDetails:286`), mais `handleAction:219` ne teste que `WAITING_IT_PROCESSING || Pending` → « Affecter » sur un `Processing` = PIN + no-op (atteignable par un Admin avec des données legacy persistées ; aucun mock n'a ce statut aujourd'hui).
4. **Step-up incohérent entre surfaces** : les deux boutons de rangée sont enveloppés dans `SecurityGate` (PIN réel, `ApprovalRow.tsx:99-131` et :209-241) — y compris le « Voir » en lecture seule. Or le **Dashboard fait les mêmes transitions sans aucun PIN** (`DashboardPage.tsx:256-286` : confirmation de réception via simple dialog, validation manager/dotation en direct), et le wizard d'attribution a sa **propre** étape de validation aux facteurs factices (« Empreinte » = validation instantanée, PIN accepté quel que soit le code : `AssignmentWizardPage.tsx:290-315`, :492 ; étiquetée DemoBadge « Simulation » :464-468) — alors que le docstring de `SecurityGate.tsx:21-26` affirme que ces méthodes « ont été retirées ».

**Déduit — le verdict « cosmétique » du Chantier C ne tient que pour `Approved` :** le refus d'une demande **déjà `Rejected`** *écrit réellement*. `handleReject` (`ApprovalsPage.tsx:243-257`) recalcule `nextStatus='Rejected'` ; `canTransitionApprovalStatus` court-circuite en `{allowed:true}` quand `status === nextStatus` (`businessRules.ts:453-455`) — **avant** le contrôle de table (:457-463). `updateApproval` (`DataContext.tsx:2088-2130`) rejoue alors les effets de bord : si la demande a un `assignedEquipmentId`, `getEquipmentUpdatesForApprovalStatus('Rejected')` force `{status:'Disponible', assignmentStatus:'NONE', user:null}` (`businessRules.ts:526-532`) — **même si l'équipement a été réattribué à quelqu'un d'autre depuis** — et un événement `APPROVAL_REJECT` dupliqué est journalisé avec le toast « Demande rejetée ». Chemin étroit (SuperAdmin uniquement, demande rejetée avec équipement lié, clic volontaire + PIN) mais c'est une **écriture de corruption accessible par un bouton visible**. Pour `Approved` (vérifié au clic le 07-07 en Chantier C) le blocage reste correct : pas d'entrée dans la table, refus avant le bypass SuperAdmin (:465). Non reproduit au rendu dans cette passe — à reproduire (2 min) avant/pendant le correctif.

- **Risque si on ne touche à rien** : piste d'audit polluée + libellés menteurs pour le persona le plus puissant ; le cas `Rejected→Rejected` peut libérer un équipement attribué. Aggravation nette au branchement backend (les écritures deviendraient durables).
- **Correctif proposé** (générique, pas du cas-par-cas) :
  1. Dériver la disponibilité des actions depuis la machine à états : un helper `businessRules` du type `getAvailableApprovalActions(approval, actor)` s'appuyant sur `APPROVAL_TRANSITIONS` + les gates existants ; `getStepDetails` ne garde que la présentation (libellés/couleurs).
  2. Corriger le bypass d'affichage : `canUserActOnApproval` → pour SuperAdmin, retourner `isApprovalActiveStatus(approval.status)` au lieu de `true` (:342). Règle en un coup : boutons terminaux, pollution de l'onglet « En cours », badge.
  3. Rendre la tolérance same-status **sans effets de bord** dans `updateApproval` (retour `{allowed:true}` précoce sans update équipement ni log) — plutôt que l'interdire : les re-soumissions du wizard (`AssignmentWizardPage.tsx:162,196`) bénéficient du no-op silencieux. → **Décision D10**.
  4. Traiter `Processing` dans `handleAction` (l'aligner sur la branche wizard) ou l'exclure des gates actionnables — au choix lors de l'implémentation.
  5. Cohérence step-up : PIN uniquement sur les actions **qui écrivent**, uniformément (rangées Approbations *et* Dashboard) ; « Voir » sans PIN — avec le point 2, « Voir » disparaît de toute façon des rangées actives (il n'existe aucune page de détail de demande vers laquelle naviguer : `features/approvals` = ApprovalsPage + NewRequestPage). Les faux facteurs du wizard sont étiquetés DEMO mais contredisent la politique — à trancher. → **Décision D9**.
- **Risque du correctif / à vérifier** : le SuperAdmin perd des boutons qui, aujourd'hui, ne font rien ou font pire — pas une régression fonctionnelle, mais l'onglet « En cours » d'alice.admin **rétrécit** (badge inclus) → baselines visuelles Approbations à rafraîchir ; balayage des 3 personas (alice/jane/ethan) sur la page + les tickets Dashboard ; wizard de bout en bout (la re-soumission ne doit pas se mettre à toaster une erreur — d'où la variante no-op de D10).
- **Test unitaire léger ?** **Oui, le meilleur candidat des 5.** `canUserActOnApproval`, `canTransitionApprovalStatus`, `getEquipmentUpdatesForApprovalStatus` et le futur `getAvailableApprovalActions` sont des fonctions pures ; une table statut × rôle × cible aurait attrapé et le bouton fantôme et le `Rejected→Rejected`. Sans runner, un simple script Node jetable peut servir de harnais de validation ponctuel ; l'investissement durable reste suspendu à D7.
- **Sévérité : Majeur** (écriture de corruption étroite mais réelle ; Bloquant si backend) · **Effort : S–M**.

> ✅ **Reproduit puis implémenté le 2026-07-10** (gate de reproduction exigé avant correctif — honoré).
>
> **Reproduction live (Playwright, rendu réel)** — la corruption décrite est **confirmée**, avec une précision de surface :
> - **Chemin confirmé (attribution directe)** : attribution directe de PRT-HQ-01 → Ethan (approbation implicite portant `assignedEquipmentId` via `addApproval`) → Refuser (PIN) → équipement libéré (comportement attendu) → réattribution directe à Marc → re-« Refuser » sur l'ancienne approbation **déjà `Rejected`**, encore visible dans « En cours » du SuperAdmin → **équipement écrasé `Disponible/user:null`** malgré l'affectation en cours à Marc + **`APPROVAL_REJECT` dupliqué** dans le journal. Mécanisme et effets exactement comme déduits.
> - **Divergence de surface découverte** : le chemin « demande du workflow » ne peut PAS corrompre, car **`assignedEquipmentId` n'atteint jamais l'état React** sur ce chemin. La mutation directe `approvals[appIndex].assignedEquipmentId = …` (`AssignmentWizardPage.tsx:186-190`) est avalée par le **calcul eager de l'updater** de `setApprovals` (le `{...item}` est évalué au moment de l'appel `updateApproval`, AVANT la mutation). Conséquence plus grave que la corruption elle-même : **l'équipement réservé via le wizard-depuis-demande ne suit plus jamais les transitions de la demande** — jamais `Attribué` sur `Completed`, réservation orpheline `En attente/user` sur `Rejected` (observé au rendu sur les deux cas). **Non corrigé — hors périmètre du paquet approuvé, nouvelle décision requise (→ D12 ci-dessous).**
>
> **Paquet implémenté (tel qu'approuvé)** :
> 1. `getAvailableApprovalActions` (`businessRules.ts`) dérive primaire + refus depuis `APPROVAL_TRANSITIONS` × gates ; `ApprovalsPage.handleAction/handleReject` consomment la dérivation (plus de cas-par-cas), `getStepDetails` ne garde que la présentation — les libellés d'action des statuts terminaux sont purgés.
> 2. Bypass d'affichage corrigé : `canUserActOnApproval` → SuperAdmin passe par `isApprovalActiveStatus`. Vérifié au rendu : mock `Approved` sorti d'« En cours » (badge 2→1), présent en Historique **sans** boutons ; rangée `Rejected` disparue d'« En cours » après rejet.
> 3. **D10** : tolérance same-status = retour `{allowed:true}` précoce dans `updateApproval`, **zéro effet de bord** (ni équipement, ni événement).
> 4. `Processing` aligné sur la branche wizard (`kind: 'assign'` dans la table de dérivation) — plus de PIN + no-op ; non exerçable au rendu (aucune persistance des approbations, aucun mock), vérifié au code.
> 5. **D9** : PIN uniquement sur les actions qui écrivent, uniformément — les 3 boutons de tickets Dashboard (validation manager, validation dotation, confirmation réception) passent par `SecurityGate` (le dialog simple de réception est remplacé) ; « Voir » a disparu avec le point 2. Les faux facteurs du wizard (étiquetés DEMO) restent en l'état — non arbitrés explicitement.
>
> **Vérifié** : build + lint verts ; smoke Playwright par statut — chaîne complète `Pending→wizard→WAITING_DOTATION_APPROVAL→PENDING_DELIVERY→Completed` avec PIN à chaque rangée ; rejet à `PENDING_DELIVERY` ; **chemin de corruption re-testé → mort** (la réattribution à Marc survit, aucune rangée `Refusée` actionnable) ; Dashboard : clic ticket → sheet PIN obligatoire → transition OK ; balayage jane/ethan : 0 demande indue, pages saines. Baselines visuelles Approbations : à rafraîchir en fin de chantier (badge/rangées SuperAdmin volontairement modifiés).

### 7.2 X16 — le journal de sécurité confond le facteur et l'action protégée

**Constaté** (reprend X16 du rapport UX §5, vérifié au rendu le 07-07 ; re-lecture code ce jour) :

- `SecurityGate` journalise **au succès du PIN, avant le dénouement de l'action** : `logSecurityAction(title, actorId, entityId, 'PIN', 'SUCCESS')` à `SecurityGate.tsx:65`, puis l'événement persisté `logEvent({type:'VIEW_SENSITIVE', …})` :67-78, alors que `onVerified()` — l'action réelle — ne part que **1,2 s plus tard** (:79-82) et peut être refusée par la couche métier (cf. §7.1).
- Le contrat n'a **qu'un champ `status`** (`'SUCCESS' | 'FAILED' | 'BLOCKED'`, `security.ts:26`) : il décrit le facteur, mais se lit comme l'issue de l'action. Un « Refuser » PIN-validé puis bloqué laisse `Status: SUCCESS`.
- Le journal **persisté** a le même défaut, plus un second : type `VIEW_SENSITIVE` (« Consultation de données sensibles », `businessRules.ts:286`) pour des actions qui sont des **transitions d'état**, avec `targetName: title` (= le libellé du bouton, ex. « Refuser ») au lieu de l'entité. La phrase d'historique devient « X a consulté des données sensibles de Refuser ».
- `logSecurityAction` n'écrit qu'en console (`security.ts:31-37`) — impact démo aujourd'hui, mais c'est **le contrat qui sera vraisemblablement repris côté backend**.

- **Risque si on ne touche à rien** : toute relecture d'audit conclut à tort que les actions gated ont abouti ; Mineur tant que c'est console + événement mal typé, **Majeur dès que le journal devient réel**.
- **Correctif proposé — séparer les deux faits en deux champs** : `factorOutcome: 'SUCCESS'|'FAILED'|'BLOCKED'` (le PIN) et `actionOutcome: 'EXECUTED'|'DENIED'|'NOT_RUN'` (l'action protégée), consignés **après** le dénouement. Implique de faire remonter l'issue : `onVerified` retourne un résultat (les handlers l'ont déjà — `applyApprovalTransition` retourne un booléen, `ApprovalsPage.tsx:199-211`) ou la journalisation migre au call-site. Pour l'événement persisté : type dédié (ex. `SECURITY_STEP_UP`) ou a minima `metadata.outcome`, et `targetName` = l'entité, pas le libellé du bouton.
- **Risque du correctif** : faible — changement de contrat de log pur ; vérifier que les échecs PIN (FAILED/BLOCKED) continuent de logger `actionOutcome:'NOT_RUN'`, et qu'aucun consommateur ne filtre sur `VIEW_SENSITIVE` (constaté : seuls `useHistory.ts:41,79` filtrent, et sur `isSensitive`, pas sur le type).
- **Test unitaire léger ?** Valeur moyenne : la difficulté est dans le **séquencement** (log après dénouement), peu testable unitairement sans runner ni environnement React. Un test aurait du sens plus tard pour figer le contrat à deux champs une fois extrait dans une fonction pure de construction d'entrée de journal.
- **Sévérité : Mineur aujourd'hui / Majeur dès backend** · **Effort : XS–S**.

> ✅ **Implémenté le 2026-07-10** (design à deux champs approuvé tel que proposé) — `logSecurityAction` porte désormais `factorOutcome` (`SUCCESS|FAILED|BLOCKED`) **et** `actionOutcome` (`EXECUTED|DENIED|NOT_RUN`), consignés **après** le dénouement : `SecurityGate.onVerified` retourne `boolean | void` (`false` = refus métier → `DENIED`), et la journalisation (console + événement persisté) a migré dans le timeout post-validation. L'événement persisté est un type dédié **`SECURITY_STEP_UP`** (icône/action/titre ajoutés aux maps `businessRules`), avec `targetName` = **l'entité** (nouveau prop `entityName`, alimenté par les rangées Approbations et les tickets Dashboard) et `metadata.{action, factorOutcome, actionOutcome}` — la phrase d'historique devient « X a validé une action sensible sur PRT-HQ-01 » au lieu de « …consulté des données sensibles de Refuser ». Vérifié au rendu : PIN erroné → `Factor: FAILED | Outcome: NOT_RUN` ; actions abouties → `SUCCESS | EXECUTED` en console et en événement persisté (5 `SECURITY_STEP_UP` avec le bon `targetName` sur le parcours de smoke). Aucun consommateur ne filtrait sur `VIEW_SENSITIVE` (re-vérifié) ; les handlers concernés (rangées, Dashboard) remontent tous leur issue.

### 7.3 INV-9 — le réamorçage mock ressuscite les suppressions (décision de conception, pas un bug mécanique)

**Constaté — deux voies de résurrection distinctes** (confirme et précise la §7 du rapport UX) :

1. **Liste vidée → re-seed intégral** : l'hydratation exige `parsed.length > 0` (`DataContext.tsx:539` users, :554 equipment). Un `[]` persisté — l'utilisateur a tout supprimé — est traité comme « jamais persisté » et le seed mock complet revient au rechargement.
2. **Suppression unitaire → résurrection ciblée** : `seededMissing` ré-injecte tout élément du seed dont l'id est absent du persisté (`DataContext.tsx:307-311` users, :381-385 equipment). Toute suppression d'un élément *seedé* est donc annulée au prochain chargement, alors que le toast de suppression annonce un succès et que la persistance écrit bien à chaque mutation (:714-719). Les créations et modifications utilisateur survivent, elles, correctement.

À noter : **aucune affordance « réinitialiser les données de démo » n'existe** (grep Settings/persistence) — la seule restauration volontaire possible passe par vider le localStorage à la main. Et cette mécanique a un coût QA documenté : « liste vide impossible » (limites de la passe UX §1).

- **Risque si on ne touche à rien** : contrat de suppression menteur (succès affiché, données ressuscitées), états vides intestables, comportement inexplicable pour un utilisateur de démo.
- **Deux options — à trancher, je ne décide pas seul (→ Décision D8)** :
  - **Option A — tombstones (les suppressions survivent)** : persister les ids seed supprimés (ex. clé `tracker_deleted_seed_ids` par domaine), filtrer `seededMissing` avec ; accepter `[]` comme état valide (distinguer `null` = jamais persisté de `[]` = vidé volontairement). *Implications* : suppressions durables et états vides enfin testables (lève une limite QA du Chantier C) ; les nouveaux éléments de seed ajoutés par les devs continuent d'apparaître (souhaitable) ; en contrepartie il **faut** une affordance « Réinitialiser les données de démo » (sinon un élément supprimé est irrécupérable sans DevTools), la logique de merge — déjà signalée « source de bugs silencieux » en §4 — se complexifie encore, et tout ceci est du jetable que le Chantier A (backend) remplacera.
  - **Option B — réamorçage assumé (comportement de démo, étiqueté)** : ne rien changer à la mécanique, la rendre honnête : toast spécifique à la suppression d'un élément seedé (« Élément de démonstration — il sera restauré au prochain chargement »), mention dans Paramètres. *Implications* : zéro risque de régression sur le merge, effort XS ; mais le contrat de suppression reste semi-factice pour les éléments seed, les états vides restent intestables, et INV-9 reste ouvert au registre en « by design documenté ».
  - Point commun aux deux : si B est retenu, corriger quand même le cas 1 (`[]` re-seedé) serait incohérent avec « réamorçage assumé » — B assume les **deux** voies ; A les traite les deux. Pas de panachage.
- **Risque du correctif (si A)** : régressions de merge silencieuses (utilisateurs avec un localStorage existant en cours de migration de clés `neemba_*`→`tracker_*`, `persistence.ts`) ; à vérifier : matrice {null, `[]`, partiel, avec tombstones} × {users, equipment} au chargement, et le parcours « tout supprimer puis recharger ».
- **Test unitaire léger ?** **Oui (si A)** : `mergePersistedUsersWithSeed`/`mergePersistedEquipmentWithSeed` sont pures ; la matrice ci-dessus s'encode en une dizaine de cas et verrouillerait la décision de conception. C'est le deuxième meilleur candidat après §7.1. (Si B : rien à tester, c'est de l'étiquetage.)
- **Sévérité : Majeur** (au registre depuis la vague 2 du C) · **Effort : A = M · B = XS**.

> ✅ **Implémenté le 2026-07-10** (D8 tranchée : **Option B** — réamorçage assumé et étiqueté — **plus un bypass dev-only**, pas de tombstones ni d'UI « Réinitialiser la démo » : couche mock temporaire que le Chantier A remplacera).
> - **Étiquetage** : nouveau module `src/lib/demoSeed.ts` (`isDemoSeedUser`/`isDemoSeedEquipment` sur les ids du seed, libellé `DEMO_RESEED_NOTICE`). Les 6 call sites de suppression (Users ×3, Inventory/Equipment ×3) toastent « Élément de démonstration : il sera restauré au prochain chargement. » après le succès quand l'élément vient du seed (une seule notice en suppression groupée). Mention permanente ajoutée dans **Paramètres → Aide** (« Données de démonstration : … restaurés à chaque chargement ; vos créations et modifications sont conservées »). La mécanique de merge est inchangée : les deux voies de résurrection restent assumées.
> - **Bypass dev-only** (variable d'env, aucune UI) : `VITE_DISABLE_DEMO_RESEED=true` (pris en compte seulement en DEV) court-circuite `seededMissing` dans les deux merges **et** accepte `[]` persisté comme état valide — les suppressions survivent au rechargement et les listes vides deviennent testables (lève la limite QA « liste vide impossible » du Chantier C).
> - **Vérifié au rendu (les deux modes)** : sans flag — suppression d'un équipement seedé → toast succès + notice démo, reload → élément ressuscité (assumé), mention visible dans Paramètres/Aide ; avec flag (serveur dev relancé) — même suppression → **durable après reload**, `tracker_equipment` forcé à `[]` + reload → reste vide et l'inventaire rend son EmptyState. INV-9 passe au registre en **« by design documenté »**.

### 7.4 DataContext — 12× `react-hooks/exhaustive-deps` sur `currentUser.role` : verdict ligne par ligne

**Constaté (ESLint exécuté ce jour** : `npx eslint src/context/DataContext.tsx` → 12 erreurs, toutes « **unnecessary** dependency: 'currentUser.role' » — la règle dit que la dep est **en trop**, pas manquante**)**. Les 12 callbacks suivent le même motif : la garde de permission lit `currentUserAccessRef.current` **au moment de l'appel**, et le corps ne référence `currentUser` nulle part.

Le point que l'analyse statique ne dit pas mais qui rend la suppression sûre : la ref est réassignée **à chaque rendu** (`DataContext.tsx:839-840`, assignation dans le corps du composant, pas dans un effet). Un changement de rôle en cours de session fait re-rendre `DataProvider` (il consomme `useAuth`) → la ref est fraîche avant que tout handler puisse s'exécuter. La dep `currentUser?.role` ne servait qu'à recréer l'identité du callback, ce qui n'a d'effet observable que si un consommateur met la fonction dans un dep-array d'effet — vérifié : **les 12 fonctions ne sont invoquées que dans des handlers d'événements** (LocationsPage, SettingsPage, AuditDetailsPage, ManagementPage, AddCategoryPage, AddModelPage).

| Ligne | Fonction | Garde (lecture à l'appel) | `currentUser` lu dans le corps ? | Verdict |
|---|---|---|---|---|
| 1194 | `assignManagerToService` | `canManageLocationsByRole(ref)` :1185 | non | **ESLint a raison — retirer** → `[]` |
| 1980 | `promoteDetectedDeviceToInventory` | `canManageInventoryByRole(ref)` :1910 | non | **retirer** → `[detectedDevices, upsertEquipmentFromAuditScan]` |
| 2051 | `removeEquipmentFromServiceAfterAudit` | `canManageInventoryByRole(ref)` :2023 | non | **retirer** → `[equipment, updateEquipment]` |
| 2181 | `addLocation` | `canManageLocationsByRole(ref)` :2155 | non | **retirer** → `[]` |
| 2228 | `renameLocation` | `canManageLocationsByRole(ref)` :2184 | non (mais lit `serviceManagers` :2215) | **retirer** → `[serviceManagers]` (conserver celle-ci) |
| 2254 | `deleteLocation` | `canManageLocationsByRole(ref)` :2231 | non | **retirer** → `[]` |
| 2264 | `addCategory` | `canManageSystemByRole(ref)` :2257 | non | **retirer** → `[]` |
| 2272 | `updateCategory` | `canManageSystemByRole(ref)` :2266 | non | **retirer** → `[]` |
| 2281 | `deleteCategory` | `canManageSystemByRole(ref)` :2274 | non | **retirer** → `[]` |
| 2290 | `addModel` | `canManageSystemByRole(ref)` :2283 | non | **retirer** → `[]` |
| 2298 | `updateModel` | `canManageSystemByRole(ref)` :2292 | non | **retirer** → `[]` |
| 2307 | `deleteModel` | `canManageSystemByRole(ref)` :2300 | non | **retirer** → `[]` |

Contre-exemple qui confirme le motif : les callbacks qui lisent **réellement** `currentUser` (ex. `markDetectedDeviceAsIgnored` :2017, `addApproval` :2151) le listent correctement et ne sont pas flaggés.

- **Risque si on ne touche à rien** : lint rouge permanent = la politique zéro-warning est morte (tout nouveau warning se noie) ; aucun bug runtime identifié.
- **Correctif proposé** : retirer les 12 deps, exactement comme au tableau. Aucun contournement `eslint-disable`.
- **Risque du correctif** : quasi nul (les callbacks deviennent *plus* stables). À vérifier : `npm run lint` vert + smoke en dev — changer de persona sans recharger (alice → jane) et exercer une mutation par famille (emplacement, catégorie, modèle) pour confirmer que la garde par ref suit bien le rôle.
- **Test unitaire léger ?** **Non** — l'identité d'un `useCallback` et la fraîcheur d'une ref ne se testent pas utilement sans environnement React ; ici, **le lint est le test**.
- **Sévérité : Mineur** (dette de qualité, pas de bug) · **Effort : XS**.

> ✅ **Implémenté le 2026-07-10** — les 12 deps retirées exactement comme au tableau (9× `[]`, 3 avec deps restantes conservées dont `[serviceManagers]` pour `renameLocation`). Vérifié : `npm run lint` vert (politique zéro-warning rétablie), `npm run build` OK, smoke Playwright en dev : alice.admin ajoute emplacement + catégorie + modèle avec succès, puis bascule alice→jane.manager **sans reload** — formulaire catégorie non rendu et bouton « Ajouter un pays » absent pour jane : la garde par ref suit bien le rôle en cours de session.

### 7.5 Reports — 4 exports débranchés du store vivant (confirme la requalification §8.2 du rapport UX)

**Constaté** (`ReportsPage.tsx`) : la page importe `mockReports, mockAllEquipment, mockAllUsersExtended` **directement depuis `data/mockData`** (:2) et n'appelle jamais `useData()` — seule page métier dans ce cas ; tout le reste de l'app consomme le DataContext. Détail des 4 cartes (`mockData.tsx:551-556`) :

| Carte | Promesse affichée | Ce que l'export produit réellement |
|---|---|---|
| 1 « Inventaire Complet » | liste complète des équipements | le **seed mock figé** (`:24-33` CSV, `:97-106` PDF) — créations/modifs/suppressions locales absentes |
| 2 « Historique par Utilisateur » | « toutes les attributions et retours pour un utilisateur spécifique » | la **liste des utilisateurs** (nom/email/rôle/département/dernière connexion, `:34-42`, `:107-115`) — aucun historique, aucun choix d'utilisateur |
| 3 « Équipement Vieillissant » | équipements de plus de 3 ans | repli placebo : CSV d'une ligne `{info:"Rapport générique"}` (`:43-47`), PDF « rapport de démonstration » (`:116-124`) |
| 4 « Expiration des Garanties » | garanties expirant sous 90 jours | même repli placebo |

À noter aussi : la permission RBAC `action.reports.export` existe (`rbacDefaults.ts:66`, exposée `canExportReports`, `useAccessControl.ts:75`) mais **n'est consultée nulle part** — la vue est gatée (`AppLayout.tsx:180`), les boutons d'export non.

- **Risque si on ne touche à rien** : des exports « officiels » (CSV/PDF téléchargés, donc partageables) qui ne reflètent pas l'état réel du parc — le pire des mensonges possibles pour une app de tracking ; 2 cartes sur 4 sont des placebos purs.
- **Correctif proposé — rebrancher sur le DataContext vivant, comme le reste de l'app** : `useData()` → `equipment`, `users`, `events`, puis :
  - Carte 1 : exporter `equipment` (trivial).
  - Carte 2 : les données existent (`events` filtrés par `isEquipmentMovementEvent`, `businessRules.ts:426-429`, avec `metadata.beneficiaryId`). Deux variantes : **(a)** export global groupé par utilisateur — zéro UI nouvelle ; **(b)** sélecteur d'utilisateur — seule variante qui tient la promesse « pour un utilisateur spécifique », au prix du petit ajout d'UI que le fix logique impose. → **Décision D11**.
  - Carte 3 : dérivable de `equipment[].financial.purchaseDate` (> 3 ans) — champ garanti par `normalizeEquipmentRecord` (`DataContext.tsx:315-322`).
  - Carte 4 : dérivable de `equipment[].warrantyEnd` (fenêtre 90 j) — champ backfillé par la même normalisation (:338-341).
  - Au passage : consulter `canExportReports` sur les boutons (la permission existe déjà, c'est une ligne).
- **Risque du correctif / à vérifier** : les exports deviennent dépendants de l'état local (c'est le but) — vérifier le rendu CSV/PDF avec un parc modifié (création + suppression + attribution) ; les cas limites de dates (garantie expirée vs expirant, achat exactement à 3 ans) ; encodage CSV des accents (déjà géré par `buildCsvLine`). Question de périmètre laissée ouverte (vague 2, chevauche le géo-scoping §2) : faut-il **scoper** les exports au périmètre de l'acteur (Admin multi-pays) ? Aujourd'hui rien n'est scopé ; le correctif ne change pas cette donne, il la rend juste visible.
- **Test unitaire léger ?** **Oui pour les fonctions de fenêtre de dates** (carte 3 et 4) si on les extrait en helpers purs (`buildAgingReport(equipment, now)`, `buildWarrantyReport(equipment, now, 90)`) — les bornes de dates sont exactement le genre de logique qui régresse en silence. Cartes 1-2 : le test n'apporterait rien de plus qu'une lecture.
- **Sévérité : Majeur** (requalifié ainsi en §8.2 du rapport UX) · **Effort : M** (cartes 1-2a = S ; 3-4 + variante 2b = M au total).

> ✅ **Implémenté le 2026-07-10** (D11 tranchée : **sélecteur d'utilisateur**, pas l'export groupé). `ReportsPage` n'importe plus rien de `data/mockData` : `useData()` fournit `equipment`/`users`/`events`, et les 4 jeux de données viennent de constructeurs purs extraits dans **`src/lib/reports.ts`** (`buildInventoryReportRows`, `buildUserMovementReportRows`, `buildAgingReportRows`, `buildWarrantyReportRows` — seuils exportés `AGING_THRESHOLD_YEARS=3`, `WARRANTY_WINDOW_DAYS=90`, prêts pour des tests de bornes si D7 aboutit). Carte 2 : `SelectField` utilisateur (mouvement = bénéficiaire **ou** détenteur précédent, tri anté-chronologique) ; export refusé avec message si aucun utilisateur choisi ; le nom figure dans le titre PDF et le nom de fichier. Cartes 3-4 : dates invalides écartées, garanties déjà expirées exclues de la fenêtre. Jeu de résultat vide → toast « Aucune donnée à exporter » (plus de placebo). `canExportReports` consulté : les 8 boutons d'export sont désactivés sans la permission (la carte méta des 4 rapports vit désormais dans la page ; `mockReports` n'a plus de consommateur).
>
> **Vérifié au rendu (Playwright, téléchargements réels relus)** : parc modifié (attribution PRT-HQ-01→Marc + suppression MSE-TOG-02) → CSV inventaire = 13 lignes = état vivant, Marc visible, équipement supprimé absent ; carte 2 sans sélection → message, avec Marc → l'attribution du jour dans l'export ; carte 3 = exactement les 3 équipements achetés avant 2026-07-10 − 3 ans (âges 3-4 ans corrects) ; carte 4 = fenêtre vide sur les mocks (toutes les garanties sont passées ou ≥ 2027) → toast honnête, cohérent avec le calcul direct sur l'état persisté ; PDF carte 1 téléchargé sans erreur. Le scoping géographique des exports reste explicitement hors périmètre (vague 2, §2).
>
> **Découverte annexe (non traitée, à verser au registre)** : le garde-fou « taper SUPPRIMER » des suppressions est **mort** — `ConfirmationContext` transmet `requireTyping`/`typingKeyword` mais `ConfirmationDialog` ne consomme que `confirmKeyword` : aucun champ de saisie n'est rendu et la confirmation dangereuse se fait en un clic (constaté au rendu sur la suppression d'équipement). Sévérité : Mineur (démo) mais affordance de sécurité annoncée et absente · Effort : XS.

### 7.6 Décisions requises (suite de D1–D7) et récapitulatif

- **D8** (§7.3) — INV-9 : **Option A** (tombstones : les suppressions d'éléments seed survivent au rechargement + affordance « Réinitialiser la démo » + `[]` accepté) ou **Option B** (réamorçage assumé et étiqueté, effort XS) ?
- **D9** (§7.1) — Politique de step-up : PIN uniquement sur les actions qui écrivent, uniformément (rangées Approbations **et** Dashboard) ; « Voir » sans PIN ; que fait-on des faux facteurs du wizard (alignement sur `SecurityGate`, ou maintien étiqueté DEMO) ?
- **D10** (§7.1) — Transitions same-status : no-op **sans effets de bord** (recommandé : préserve les re-soumissions du wizard) ou interdiction stricte ?
- **D11** (§7.5) — « Historique par Utilisateur » : export global groupé par utilisateur (zéro UI) ou sélecteur d'utilisateur (tient la promesse de la carte) ?
- **D12** (§7.1, découverte de la reproduction du 2026-07-10, **non traité**) — `assignedEquipmentId` n'atteint jamais l'état sur le chemin wizard-depuis-demande (mutation directe `AssignmentWizardPage.tsx:186-190` avalée par le calcul eager de l'updater React). Conséquence : l'équipement réservé via une demande du workflow **ne suit aucune transition ultérieure** (réservation orpheline sur rejet, jamais `Attribué` sur `Completed`). Correctif évident : faire porter `assignedEquipmentId`/`assignedEquipmentName` par `updateApproval` (ou un `setApprovals` immutable dédié) au lieu de la mutation directe. Sévérité : **Majeur** (workflow de dotation cassé de bout en bout côté équipement) · Effort : XS–S. **À arbitrer avant toute retouche.**

| Item | Sévérité | Effort | Décision bloquante | Test unitaire léger |
|---|---|---|---|---|
| 7.1 Actions approbations hors machine à états | Majeur (Bloquant si backend) | S–M | D9, D10 | **Oui** — fonctions pures, meilleur candidat |
| 7.2 X16 journal facteur vs action | Mineur (Majeur si backend) | XS–S | — | Moyen — après extraction du contrat |
| 7.3 INV-9 résurrection des suppressions | Majeur | A = M · B = XS | **D8** | Oui si A (merge pur) |
| 7.4 12× exhaustive-deps | Mineur | XS | — (verdict rendu, prêt) | Non — le lint est le test |
| 7.5 Reports sur mocks statiques | Majeur | M | D11 | Oui — bornes de dates (cartes 3-4) |

> Séquencement suggéré après arbitrage : **7.4** (débloque le lint, zéro risque) → **7.1** (+ 7.2 dans la foulée, même zone) → **7.5** → **7.3** (selon D8). Aucune implémentation avant feu vert explicite.

### 7.7 Clôture de la vague 1 (2026-07-10)

Feu vert reçu avec arbitrages : D8 = Option B + bypass dev-only ; D9 = PIN uniquement sur les écritures, uniformément ; D10 = same-status no-op sans effets de bord ; D11 = sélecteur d'utilisateur (+ branchement `canExportReports`). Gate spécifique 7.1 : reproduction live exigée avant correctif — **honorée, corruption confirmée** (voir §7.1).

**Les 5 items sont implémentés et vérifiés** (annotations ✅ par section ; séquence exécutée 7.4 → repro → 7.1+7.2 → 7.5 → 7.3 ; chaque lot : build + lint verts + smoke Playwright du scénario spécifique + commit dédié). Restent ouverts :

- **D12** (§7.1/§7.6) — `assignedEquipmentId` jamais posé sur le chemin wizard-depuis-demande (workflow de dotation cassé côté équipement) — **Majeur**, à arbitrer.
- Garde-fou `typingKeyword` mort dans `ConfirmationDialog` (§7.5, découverte annexe) — Mineur, XS.
- Faux facteurs du wizard (étiquetés DEMO) — non arbitrés (reliquat D9).
- Baselines visuelles Approbations à rafraîchir (badge/rangées SuperAdmin volontairement modifiés par 7.1) — de préférence après arbitrage D12 pour éviter un double refresh.
