# Audit — Logique métier (Chantier D)

> Diagnostic + plan d'action priorisé. **Aucune implémentation.** Chaque point indique le **risque** et l'**impact** d'un correctif.
> Date : 2026-06-30 · Périmètre : `context/DataContext.tsx` (2363 l.), `lib/businessRules.ts`, `lib/rbac.ts`, `config/rbacDefaults.ts`, `hooks/useHistory.ts`, `lib/persistence.ts`.
> **Complété le 2026-07-09** par la **§7** (Chantier D vague 1 : diagnostic des 5 items hérités du Chantier C — pas un ré-audit complet), le **2026-07-10** par la **§8** (caractérisation D12/typingKeyword, implémentée en §8.5) et la **§9** (vague 2 : persistance des approbations, statuts legacy, double couche RBAC, transitions non couvertes — diagnostic en attente d'arbitrage D13-D16).

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

- **D12** (§7.1/§7.6) — `assignedEquipmentId` jamais posé sur le chemin wizard-depuis-demande (workflow de dotation cassé côté équipement) — **Majeur**, à arbitrer. → **Caractérisé en §8.1–8.2, ✅ corrigé et vérifié en §8.5 (commit `948ad49`).**
- Garde-fou `typingKeyword` mort dans `ConfirmationDialog` (§7.5, découverte annexe) — Mineur, XS. → **Caractérisé en §8.3, ✅ corrigé et vérifié en §8.5 (commit `1cdaad1`).**
- Faux facteurs du wizard (étiquetés DEMO) — non arbitrés (reliquat D9).

---

## 8. Passe du 2026-07-10 (bis) — caractérisation avant arbitrage : portée de D12 + inventaire du garde-fou `typingKeyword`

> **Diagnostic uniquement — zéro retouche de code, zéro retouche de données.** Deux questions posées avant arbitrage : (1) D12 touche-t-il toutes les demandes du workflow ou un sous-ensemble, et des données mock sont-elles déjà orphelines ; (2) inventaire des appels qui croient avoir la protection « taper le mot-clé ». Même convention Constaté/Déduit qu'en §7.

### 8.1 D12 — portée : **systémique, 100 % du chemin workflow** (aucun sous-ensemble)

**Constaté (code lu, chaîne fermée de bout en bout)** — il n'existe que **deux écritures** de `assignedEquipmentId` dans tout le code (grep exhaustif) : `AssignmentWizardPage.tsx:188` (mutation directe — avalée) et `:249` (`addApproval` — attribution directe, saine). Aucune autre. Et il n'existe qu'**un seul point d'entrée** du wizard avec `approvalId` : le bouton « Affecter » d'`ApprovalsPage.tsx:238-244` (le Dashboard ne fait que des transitions, jamais d'affectation). La question « quel sous-ensemble ? » se réduit donc aux branches internes du wizard — et **les deux branches perdent le champ** :

1. **Branche principale** (`status ∈ {WAITING_IT_PROCESSING, Pending}`, `AssignmentWizardPage.tsx:161-193`) : `updateApproval(id, 'WAITING_DOTATION_APPROVAL')` est appelé **avant** la mutation. `setApprovals(prev => prev.map(item => item.id === id ? { ...item, status } : item))` (`DataContext.tsx:2102`) est le **premier dispatch du batch** → React évalue l'updater *eagerly* au moment de l'appel : le clone `{...item}` est fabriqué **avant** que `approvals[appIndex].assignedEquipmentId = …` (:186-190) ne s'exécute. La mutation atterrit sur l'objet périmé de l'ancien tableau ; l'état committé ne porte jamais le champ. (Mécanisme déjà **observé au rendu** le 10-07, §7.1 — pas seulement déduit.)
2. **Branche « legacy/fallback »** (tout autre statut, dont `Processing` réaligné en §7.1 ; :195-216) : elle ne **tente même pas** de poser le champ — `updateApproval(id, 'PENDING_DELIVERY')` + `updateEquipment` direct, et c'est tout.

En aval, **tous** les consommateurs de transitions reposent exclusivement sur la synchro interne d'`updateApproval` (`DataContext.tsx:2104-2118`), gardée par `if (oldApproval?.assignedEquipmentId)` : `ApprovalsPage.tsx:205,261`, `DashboardPage.tsx:258,277`. Aucun ne compense par un `updateEquipment` direct. Donc pour **chaque** demande passée par le workflow : `Completed` ne produit jamais `{status:'Attribué', assignmentStatus:'CONFIRMED'}` (`businessRules.ts:576-583`), `Rejected`/`Cancelled` ne libère jamais (`:584-590`) — l'équipement reste `En attente / WAITING_DOTATION_APPROVAL` avec le bénéficiaire posé par le wizard (:171-183), **pour toujours**.

**Réponse à la question de priorité** : oui, c'est le chemin principal d'attribution (le workflow 4 étapes, D1) qui est cassé **côté équipement** sur **toutes** les demandes sans exception — aucune condition, aucun ordre de champs, aucun type de demande n'y échappe. La seule voie saine est l'**attribution directe** admin (wizard sans `approvalId`, `addApproval` portant le champ à la création :249) — qui contourne précisément le workflow. Le paradoxe de la vague 1 : le chemin de corruption §7.1 n'était reproductible **que** via l'attribution directe *parce que* le workflow, lui, ne pose jamais le lien.

**Déduit (chemin tracé, non exercé)** — effet cumulatif via la boucle de refus de dotation : `WAITING_DOTATION_APPROVAL → WAITING_IT_PROCESSING` (`getApprovalRejectTarget`, `businessRules.ts:387-388`) fait revenir la demande au wizard ; l'équipement précédemment réservé n'étant plus `Disponible`, il est absent de la liste du wizard (filtre `:132`) → l'IT en choisit un **second** → une même demande peut orphaniser **plusieurs** équipements. Et chaque orphelin sort définitivement du pool assignable (même filtre).

**Issue de secours partielle seulement** : le formulaire d'édition (`AddEquipmentPage` en mode edit) permet de forcer `status` à la main (« Statut inventaire », `:532-538`, options `:33-43`) mais son payload (`:205-232`) ne touche **ni `assignmentStatus` ni `user`** → une « réparation » manuelle rend l'affichage sain (`getDisplayedEquipmentStatus` ne lit `assignmentStatus` que si `status === 'En attente'`, `businessRules.ts:434-443`) mais laisse les données sales. La suppression est bloquée (`canDeleteEquipmentByBusinessRule` refuse `En attente`, `:594-600`).

- **Correctif évident (pour l'arbitrage, non implémenté)** : faire porter `assignedEquipmentId`/`assignedEquipmentName` par `updateApproval` (paramètre optionnel intégré au même `setApprovals` immutable) et supprimer la mutation directe :186-190 ; la branche fallback doit le porter aussi (ou disparaître — les statuts qu'elle visait ont été réalignés en §7.1). Noter que la synchro équipement d'`updateApproval` lit `oldApproval.assignedEquipmentId` (:2104) — sur la transition qui *pose* le champ, la garde devra considérer la nouvelle valeur, pas l'ancienne.
- **Sévérité confirmée : Majeur** (Bloquant si backend — c'est le flux nominal de dotation) · **Effort : XS–S** (un point d'écriture, deux branches, plus le nettoyage de données §8.2).

### 8.2 D12 — données mock : **2 équipements déjà semés dans l'état orphelin** (non touchés)

**Constaté (`mockData.tsx` lu ; merge de persistance vérifié)** — le seed ne contient que 2 approbations (`mockPendingApprovals` id '1' `Pending`, `mockApprovalHistory` id '2' `Approved`, `:488-549`) et **aucune ne porte `assignedEquipmentId`**. Or 2 équipements sont semés réservés :

| Équipement | État semé | Pourquoi c'est un orphelin |
|---|---|---|
| id '1' **LPT-HQ-01** (ASSET-10001), `mockData.tsx:295-302` | `status: 'En attente'`, `assignmentStatus: 'PENDING_DELIVERY'`, **`user: null`** | Aucune approbation ne pointe vers lui → aucune transition ne le libérera jamais. Incohérence interne en prime : la demande démo assortie (approbation id '1', même modèle Dell Latitude 7420) est à `Pending` — deux étapes **en amont** de l'état de l'équipement — et `user: null` alors que `PENDING_DELIVERY` signifie « en attente de confirmation par le bénéficiaire » : personne ne peut confirmer. |
| id '10' **LPT-DK-03** (ASSET-90001), `:363-372` | `status: 'En attente'`, `assignmentStatus: 'WAITING_MANAGER_APPROVAL'`, **`user: null`** | Aucune approbation du seed n'existe à un statut d'attente manager → même impasse. |

Ces deux-là sont **semés ainsi** (décor « flux en cours » du seed initial), pas produits par le bug au runtime — mais ils ont exactement la forme d'orphelin que D12 produit, et ils sont **indélébiles par le workflow**. Nuance de persistance qui aggrave le tableau : les équipements sont persistés et la copie persistée **prime** sur le seed (`DataContext.tsx:378-390` ; le re-seed §7.3 ne réinjecte que les éléments *supprimés*), mais les **approbations ne sont jamais persistées** (`useState` pur sur les mocks, `DataContext.tsx:618`, aucune clé storage). Conséquence : au premier rechargement, **tout** équipement persisté en `En attente` avec un `assignmentStatus` de workflow est orphelin de fait — l'approbation qui le « portait » a disparu et le seed n'en recrée que 2, sans lien. Le bug D12 et la non-persistance des approbations produisent donc le même état final ; corriger D12 seul laisse le workflow cassé **à travers les reloads** (déjà noté §7.1 : toute repro tient en une session).

**Conséquence pour l'arbitrage — le correctif de code ne suffit pas seul** : il faudra aussi (a) corriger le seed pour les ids '1' et '10' (soit les rendre cohérents — approbation liée portant le champ — soit les ramener à `Disponible`), (b) décider du sort des états persistés (une réparation au chargement peut être simple : libérer tout équipement `En attente` à `assignmentStatus` de workflow, puisqu'aucune approbation ne survit au reload de toute façon — ou consigne « vider le storage » assumée pour la démo), et (c) trancher si la **persistance des approbations** entre au périmètre D12 ou reste en vague 2 — sans elle, le workflow corrigé ne survit toujours pas à un reload. **Rien n'a été touché.**

### 8.3 Garde-fou « taper le mot-clé » : **mort depuis le commit initial** — inventaire des 6 sites qui croient l'avoir

**Constaté (code lu + `git log -S` + `tsc` exécutés)** — le mécanisme existe et est **fonctionnel côté dialogue** : `ConfirmationDialog` rend le champ de saisie et désactive le bouton tant que le mot ne correspond pas (`ConfirmationDialog.tsx:55-66, 100-113`) — mais sous le prop **`confirmKeyword`** (`:19`). Le contexte, lui, transmet **`requireTyping`/`typingKeyword`** (`ConfirmationContext.tsx:64-65`), props inconnues du dialogue → silencieusement ignorées. `git log -S` : `confirmKeyword` date du commit initial `125a79e` et `typingKeyword` n'a **jamais** existé dans le dialogue — le garde-fou n'a donc **jamais fonctionné de toute la vie du repo**. Aucune trahison visible à l'écran : la phrase « Tapez X pour confirmer » vit dans le bloc `confirmKeyword` du dialogue et les `message` des appelants n'annoncent pas la saisie — les dialogues dégradent en simple confirmation danger à deux boutons, d'où l'invisibilité.

**Pourquoi rien ne l'a attrapé (méta-constat, dépasse ce bug)** : `npm run build` = `vite build` pur (esbuild, **aucun typecheck**) ; ESLint sans règles type-aware ; et surtout **`@types/react` n'est pas installé** (`node_modules/@types/` : babel, node… pas de react) avec un `tsconfig` non-strict → `import React` est un module implicitement `any`, donc **la vérification des props JSX est morte dans tout le projet** (vérifié : `npx tsc --noEmit` → 29 erreurs préexistantes, zéro sur `ConfirmationContext` ; check isolé du fichier → 0 erreur). Tout renommage de prop, n'importe où, passe silencieusement — ce bug est le premier exemplaire *trouvé*, pas forcément le seul.

**Les 6 appels qui déclarent `typingKeyword` (= croient avoir la protection) et ce qu'ils protègent réellement aujourd'hui en un clic :**

| # | Site | Mot-clé | Action protégée (en théorie) | Gardes restantes réelles |
|---|---|---|---|---|
| 1 | `UserDetailsPage.tsx:250-269` | SUPPRIMER | **Suppression définitive d'un utilisateur + tout son historique** ; `requireTyping: user.role !== 'User'` (:255) — la saisie était **spécifiquement réservée aux comptes privilégiés** (Manager/Admin/SuperAdmin) | `roleDeleteDecision` + refus si équipements rattachés (:240-248) ; puis un clic |
| 2 | `AuditDetailsPage.tsx:396-405` | **CLOTURER** | **Clôture d'audit** : marque N machines `Manquant` **en masse** et les retire du service (`removeEquipmentFromServiceAfterAudit`, `DataContext.tsx:2026-2058`) | Session démarrée + non déjà clôturée ; puis un clic |
| 3 | `EquipmentDetailsPage.tsx:219-238` | SUPPRIMER | Suppression définitive d'un équipement | Statut ∈ {Disponible, En réparation} (:214) + `canDeleteEquipmentByBusinessRule` ; puis un clic |
| 4 | `FinanceManagementPage.tsx:364-389` | SUPPRIMER | Suppression définitive d'une dépense (pièce financière) | Aucune autre ; un clic |
| 5 | `ManagementPage.tsx:214-227` | SUPPRIMER | Suppression d'une catégorie | Refus si actifs liés (:208-212) ; puis un clic |
| 6 | `ManagementPage.tsx:249-262` | SUPPRIMER | Suppression d'un modèle | Refus si actifs liés (:243-247) ; puis un clic |

**Les deux sensibles du lot, à dire clairement** : le **site 1** — la suppression d'un compte **privilégié** avec son historique est exactement le cas pour lequel la friction supplémentaire avait été conçue (le `requireTyping` conditionnel le prouve), et c'est aujourd'hui un clic ; et le **site 2** — seule action **de masse** du lot (N machines `Manquant` d'un coup), dont l'annulation est manuelle machine par machine. Les sites 5-6 sont les moins exposés (pré-garde « 0 actifs liés » déjà bloquante).

- **Correctif évident (pour l'arbitrage, non implémenté)** : aligner le nom du prop (le contexte passe `confirmKeyword={options.requireTyping ? options.typingKeyword : undefined}`, ou renommage franc des options) — XS. Le méta-constat `@types/react` est un chantier séparé (installer les types + résorber ce que ça révélera ; ou a minima l'inscrire au registre comme dette de vérification).
- **Sévérité : Mineur en démo** (l'affordance annoncée dans le code n'a jamais existé à l'écran, personne n'a rien perdu) **mais Majeur le jour où les suppressions deviennent durables** (backend, Chantier A) · **Effort : XS** (le renommage) — le méta-constat, lui, est **M+ et à chiffrer à part**.

### 8.4 Récapitulatif de la passe

| Question posée | Verdict |
|---|---|
| D12 : toutes les demandes workflow ou un sous-ensemble ? | **Toutes** — les 2 branches du wizard perdent le champ, aucun appelant aval ne compense, aucune condition n'y échappe (Constaté). La boucle refus-dotation peut orphaniser plusieurs équipements par demande (Déduit). |
| D12 : orphelins déjà présents dans les mocks ? | **Oui, 2** (LPT-HQ-01 id '1', LPT-DK-03 id '10') — semés ainsi, indélébiles par le workflow, survivent au re-seed via la persistance. Correctif code seul insuffisant : seed + états persistés à traiter. **Non touchés.** |
| `typingKeyword` : qui croit être protégé ? | **6 sites** (tableau §8.3) ; garde-fou mort depuis le commit initial (`confirmKeyword` vs `typingKeyword`). Sensibles : suppression de comptes privilégiés (UserDetails) et clôture d'audit en masse (CLOTURER). Méta-constat : `@types/react` absent → vérification de props JSX morte projet-wide. |

**Aucune implémentation. En attente d'arbitrage** : D12 (correctif + stratégie de nettoyage des données), renommage du prop `typingKeyword`, et sort du méta-constat `@types/react`.
- Baselines visuelles Approbations à rafraîchir (badge/rangées SuperAdmin volontairement modifiés par 7.1) — de préférence après arbitrage D12 pour éviter un double refresh.

### 8.5 Implémentation (2026-07-10, arbitrage reçu) — D12 ✅ · `typingKeyword` ✅

Arbitrage : D12 approuvé (portage du lien + branche fallback + 2 orphelins du seed) ; renommage `typingKeyword` approuvé (les 6 sites) ; **persistance des approbations explicitement hors lot** ; §8.3 méta-constat `@types/react` hors lot (chantier séparé à chiffrer). Deux commits distincts, chaque lot : build + lint verts + vérification Playwright au rendu (session unique, storage réinitialisé, alice.admin).

**D12 — commit `948ad49`** :

- `updateApproval(id, status, options?)` porte désormais `assignedEquipmentId`/`assignedEquipmentName` dans le **même `setApprovals` immutable** ; la mutation directe du wizard (`:186-190`) est supprimée et la branche fallback passe le lien aussi. La synchro équipement interne **s'efface quand `options` est fourni** : le wizard reste l'écrivain équipement complet (bénéficiaire, `assignedBy`) — vérifié au journal : exactement 1 événement équipement par passage wizard, pas de doublon.
- **Boucle refus-dotation : exercée réellement — le seul portage du lien ne la couvrait PAS.** Sans traitement dédié, le retour `WAITING_DOTATION_APPROVAL → WAITING_IT_PROCESSING` aurait maintenu l'équipement réservé (`getEquipmentUpdatesForApprovalStatus` ne connaissait que le statut cible) et le second passage du wizard aurait écrasé le lien en laissant le 1er choix orphelin — l'aggravation déduite en §8.1. Ajout : sur cette transition (détectée via nouveau paramètre `previousStatus`), l'équipement proposé est **libéré** (`Disponible/NONE/user:null`) et le lien de l'approbation est **rompu**. Vérifié au rendu : 1er choix libéré au refus et resté libre, 2e choix mené jusqu'à `Completed`.
- **Seed : orphelins réinitialisés à `Disponible/NONE`** (ids '1' LPT-HQ-01, '10' LPT-DK-03, métadonnées `assignedBy/At` retirées) plutôt que « réparés » par des approbations liées. Pourquoi : la demande démo id '1' à `Pending` est le point d'entrée démo du wizard (l'avancer pour coller à l'équipement l'aurait détruite) ; aucun état d'approbation atteignable ne produit un équipement réservé à `WAITING_MANAGER_APPROVAL` sans bénéficiaire ; et surtout, les approbations n'étant pas persistées, **tout état « en cours » semé re-orphelinerait au premier reload** — `Disponible`/`Attribué(CONFIRMED)` sont les deux seuls états seed stables tant que la persistance n'est pas tranchée.
- Vérifié au rendu (3 demandes neuves, chaîne complète) : `Completed` ⇒ `Attribué/CONFIRMED` + bénéficiaire ; `Rejected` ⇒ `Disponible/NONE/user:null` ; boucle refus-dotation close proprement ; les 2 ex-orphelins du seed sont `Disponible` sur storage vierge.

**`typingKeyword` — commit `1cdaad1`** : renommage franc — `ConfirmationOptions.confirmKeyword` remplace `requireTyping`/`typingKeyword`, les 6 sites alignés, conditionnel d'`UserDetailsPage` préservé (`confirmKeyword: role !== 'User' ? 'SUPPRIMER' : undefined`). Vérifié au rendu sur les 2 sites sensibles, **deux issues chacun** : suppression d'un compte Admin (SUPPRIMEUR ⇒ bouton désactivé ; SUPPRIMER ⇒ suppression effective) ; clôture d'audit 4 machines (CLOTURE ⇒ bloqué ; CLOTURER ⇒ machines `Manquant`). Contre-épreuve du conditionnel : compte `User` ⇒ confirmation simple sans mot-clé. Les 4 autres sites : même mécanique partagée, build + lint + grep (zéro occurrence morte restante).

**Restent ouverts après cette passe** :

- **Persistance des approbations — point ouvert distinct, non touché (décision d'architecture)** : les équipements sont persistés, les approbations non (`useState` pur) ⇒ toute demande en cours meurt au reload et l'équipement persisté `En attente` devient orphelin de fait. Le correctif D12 est complet **en session** ; il ne survit pas aux reloads sans une couche de persistance des approbations (et la question sœur : réparation au chargement des états persistés hérités — les copies localStorage antérieures au correctif gardent leurs orphelins, consigne actuelle : vider le storage démo). À arbitrer comme chantier propre.
- Méta-constat `@types/react` absent ⇒ vérification de props JSX morte projet-wide (§8.3) — chantier séparé à chiffrer, non touché.
- Faux facteurs du wizard (reliquat D9) — non arbitrés.
- Baselines visuelles Approbations — à rafraîchir maintenant que D12 est passé (badge/rangées SuperAdmin + indicateur de lien désormais réellement rendu).

---

## 9. Passe du 2026-07-10 (ter) — Chantier D vague 2 : diagnostic (4 points)

> **Diagnostic uniquement — zéro retouche de code, zéro retouche de données.** Vague 2 annoncée au lancement du chantier : (1) persistance des approbations, (2) statuts legacy vs modernes, (3) double couche RBAC + businessRules passée au même niveau de rigueur que 7.1/D12, (4) transitions non couvertes de la machine à états d'approbation. Hors périmètre explicite : monolithe `DataContext` et méta-constat `@types/react` (§8.3) — vague 3 séparée si besoin. Même convention Constaté/Déduit qu'en §7-8. Ligne de code = état du repo à `c0c2d5d`.

### 9.0 Constat transversal (découvert en instruisant les points 3 et 4) — la synchro équipement du workflow ne s'exécute **jamais** pour ses acteurs légitimes

C'est le constat dominant de la passe ; les points 3 et 4 y renvoient. Il est présenté d'abord parce qu'il requalifie une partie du verdict « D12 corrigé » de la §8.5.

**Constaté — la chaîne complète, trois maillons :**

1. **La synchro équipement d'`updateApproval` passe par `updateEquipment`** (`DataContext.tsx:2130-2145`), qui ouvre sur une garde `canManageInventoryByRole(currentUserAccessRef.current)` à **retour silencieux** (`DataContext.tsx:1416-1419` : `if (!permissionDecision.allowed) return;` — pas de `BusinessRuleDecision` remonté, pas de toast, pas de log).
2. **`action.inventory.manage` n'est accordé qu'à Admin (delete) et SuperAdmin (delete)** — le rôle système **Manager ne l'a pas** (`rbacDefaults.ts:148-159` : approvalsManage, reportsView, auditScan seulement) et le rôle **Employé ne l'a pas** (`rbacDefaults.ts:168-178`).
3. Or **les seuls acteurs non-SuperAdmin autorisés par la machine à états sur les étapes qui portent un équipement lié sont précisément Manager et bénéficiaire** : `MANAGER_GATES` pour `WAITING_DOTATION_APPROVAL` (`businessRules.ts:163`), `USER_CONFIRMATION_GATES` pour `PENDING_DELIVERY` (`businessRules.ts:165`). L'Admin, seul rôle doté d'inventory.manage, agit à l'étape IT — via le wizard, qui fournit `options` et écrit l'équipement lui-même (chemin sain).

**Conséquence : pour chaque transition jouée par le persona nominal, la demande avance et l'équipement reste figé.** Chemins concrets (tous tracés au code, aucun exercé au rendu dans cette passe) :

| # | Acteur | Transition (rangée `ApprovalsPage.tsx:231-272` ou ticket `DashboardPage.tsx:257-300`) | Ce que dit l'approbation | Ce que fait réellement l'équipement |
|---|---|---|---|---|
| 1 | Manager | Valide la dotation → `PENDING_DELIVERY` | « Dotation validée » | Reste `En attente / WAITING_DOTATION_APPROVAL` — jamais `PENDING_DELIVERY` |
| 2 | Manager | **Refuse la dotation** → `WAITING_IT_PROCESSING` | Lien rompu (D12, `DataContext.tsx:2111-2123`) | **Libération sautée** → équipement réservé que plus aucune approbation ne référence = **orphelin définitif**, exactement l'état que D12 devait éradiquer, et il sort du pool du wizard (filtre `Disponible`, `AssignmentWizardPage.tsx:132`) — la boucle multi-orphelins déduite en §8.1 revient par le chemin nominal |
| 3 | Bénéficiaire (User) | Confirme la réception → `Completed` | « Réception confirmée » | Jamais `Attribué/CONFIRMED`, jamais `confirmedBy/At` — `En attente` pour toujours |
| 4 | Bénéficiaire (User) | Refuse à `PENDING_DELIVERY` → `Rejected` | « Demande rejetée » | Libération sautée → orphelin |

Le chemin 3 vaut aussi pour l'**attribution directe en envoi différé** (approbation implicite à `PENDING_DELIVERY` portant le lien, `AssignmentWizardPage.tsx:227-250`) : la confirmation du bénéficiaire n'attribue jamais l'équipement.

**Pourquoi la vague 1 a conclu « vérifié 17/17 »** : toutes les vérifications au rendu de §7.1/§8.5 ont été conduites en **alice.admin (SuperAdmin)** — `inventory.manage: delete`, bypass total. Le correctif D12 est réel et complet **pour ce persona** ; il n'a jamais été exercé avec jane (Manager) ou ethan (User), qui sont pourtant les écrivains prévus de ces étapes. Le balayage jane/ethan de la vague 1 vérifiait l'*absence de boutons indus*, pas l'issue des transitions légitimes.

- **Requalification** : D12 (§8.5) passe de « corrigé et vérifié » à « corrigé et vérifié **sous SuperAdmin uniquement** ; cassé pour Manager et bénéficiaire ». Le flux 4 étapes multi-personas — la raison d'être du workflow — ne synchronise l'équipement sur **aucune** de ses deux dernières étapes quand il est joué par les bons rôles.
- **Risque si on ne touche à rien** : le workflow nominal produit silencieusement des équipements désynchronisés et des orphelins ; piste d'audit incohérente (l'événement de transition d'approbation est journalisé `DataContext.tsx:2147-2170`, l'événement équipement jamais) ; Bloquant au branchement backend.
- **Correctif candidat (pour arbitrage, non implémenté)** : la synchro équipement d'`updateApproval` est une écriture *système*, conséquence d'une transition déjà autorisée par `canTransitionApprovalStatus` — elle ne devrait pas repasser par la garde *acteur* d'`updateEquipment`. Deux formes possibles : un écrivain interne non exporté (le `setEquipment` + journalisation factorisés, appelés par `updateEquipment`-gardé et par la synchro-non-gardée), ou un paramètre interne « source: workflow » qui saute la garde. **À ne pas faire** : accorder `inventory.manage` aux rôles Manager/Employé (élargirait tout le CRUD inventaire pour corriger un effet de bord).
- **Risque du correctif** : ouvrir un chemin d'écriture équipement non gardé — à confiner strictement à la synchro d'`updateApproval` (qui n'écrit que des champs de statut/attribution dérivés de la machine à états). Gate de reproduction : rejouer les chemins 1-4 au rendu (jane + ethan) **avant** correctif, comme pour 7.1.
- **Sévérité : Majeur (Bloquant si backend)** · **Effort : S** · **Test unitaire léger : moyen** — la faille est dans le câblage des gardes, pas dans une fonction pure ; un test de non-régression utile serait plutôt le smoke Playwright multi-personas.

### 9.1 Point 1 — Persistance des approbations (le point ouvert de D12)

**Constaté — l'anomalie et son pourtour :**

- `approvals` est le **seul domaine métier du store en `useState` pur** : `useState<Approval[]>([...mockPendingApprovals, ...mockApprovalHistory])` (`DataContext.tsx:622`), aucune clé dans `STORAGE_KEYS` (`:161-174`), aucun effet de sauvegarde (les 11 autres domaines en ont un, `:725-771`).
- Le type `Approval` est **entièrement sérialisable** (`types/index.ts:312-356` — que des primitives ; `image` est une string). Pas de ré-inflation à la `Category.icon` (`DataContext.tsx:596-605`) à prévoir.
- Le mécanisme à étendre est stéréotypé et éprouvé 11 fois : initialisation paresseuse `getPersistedValue(current, legacy)` + parse défensif + merge avec le seed + effet `localStorage.setItem`.

**Proposition (pour arbitrage — format, migration, mécanique) :**

1. **Clé** : `tracker_approvals` (legacy `neemba_approvals` pour la symétrie — `getPersistedValue` tolère son inexistence). **Format** : `JSON.stringify(Approval[])`, comme users/equipment.
2. **Merge** : `mergePersistedApprovalsWithSeed(parsed)` sur le modèle exact de `mergePersistedEquipmentWithSeed` (`DataContext.tsx:373-395`) — garde de type (`id` + `status`), copie persistée **prime** par id, normalisation qui backfille les requis (`image`, `validationSteps`, `currentStep`, `createdAt`), `seededMissing` réinjecte les ids '1'/'2' absents (cohérent avec D8/Option B), et respect du bypass `DEMO_RESEED_DISABLED` (`[]` accepté, pas de réinjection), y compris dans l'hydratation (`parsed.length > 0 || DEMO_RESEED_DISABLED`, motif de `:549`/`:565`).
3. **Migration des données déjà en session : aucune à faire.** Il n'a jamais existé de clé approbations dans aucun storage (vérifié : aucun historique de clé, l'état vit en mémoire) — l'état en session au moment du déploiement meurt au reload *aujourd'hui déjà* ; le premier chargement post-changement part du seed puis persiste à la première mutation. C'est le cas de migration le plus simple possible.
4. **La question sœur devient enfin solvable — réparation au chargement des orphelins hérités (§8.2)** : une fois les approbations persistées, l'invariant « toute approbation active référence son équipement via `assignedEquipmentId` » tient à travers les reloads. La réparation possible au chargement : libérer (`Disponible/NONE/user:null`) tout équipement persisté `En attente` avec `assignmentStatus` de workflow **qu'aucune approbation active persistée ne référence**. Elle assainit d'un coup les storages antérieurs au fix D12 (consigne « vider le storage » levée). À noter : elle ne peut s'appuyer que sur `approval.assignedEquipmentId` — le lien inverse `equipment.reservedFor` n'est **jamais écrit** nulle part (seul le workflow de retour l'efface, `businessRules.ts:790-791` ; zéro producteur, grep exhaustif). Inclusion à trancher (recommandée : c'est la moitié « données » du correctif, comme le seed l'était en §8.5).

**Impact sur les 2 orphelins réparés en vague 1 : aucun.** Ids '1'/'10' sont semés `Disponible/NONE` depuis `948ad49` ; la copie persistée prime et le re-seed ne réinjecte que les supprimés. En revanche, la contrainte consignée en §8.5 — « `Disponible`/`Attribué(CONFIRMED)` sont les deux seuls états seed stables tant que la persistance n'est pas tranchée » — **tombe** après ce changement : un décor « flux en cours » cohérent (approbation liée + équipement réservé) redeviendrait semable. Recommandation : ne pas rouvrir ce décor, le seed minimal actuel est plus sain.

- **Risque si on ne touche à rien** : toute demande en cours meurt au reload ; tout équipement persisté `En attente` de workflow est orphelin de fait au chargement suivant (§8.2) ; le correctif D12 — et celui du §9.0 s'il est fait — ne survivent à aucun F5 ; les scénarios QA multi-sessions restent impossibles.
- **Risque du changement** : (a) la logique de merge, déjà signalée « source de bugs silencieux » (§4), gagne un domaine — mitigé par le fait que les approbations n'ont **aucune mutation de suppression** (seul le vidage manuel du storage crée le cas `seededMissing`) ; (b) **confort démo** : la demande seed id '1' (entrée du wizard) consommée *reste* consommée après reload — comportement honnête mais nouveau ; issues : bypass dev existant ou vidage storage ; (c) protocole de capture : une clé de plus à réinitialiser ; (d) cohérence inter-clés `tracker_equipment`/`tracker_approvals` : deux effets distincts mais flushés au même commit React — risque résiduel faible (quota storage) ; (e) **séquencement — voir 9.2** : persister *après* l'unification des statuts, sinon on grave le vocabulaire legacy dans les storages et la « suppression sèche » devient une vraie migration.
- **Sévérité : Majeur** (condition de survie de D12/§9.0) · **Effort : S** (mécanique stéréotypée) ; **+S** si la réparation au chargement est incluse · **Test unitaire léger : oui** — `mergePersistedApprovalsWithSeed` et la fonction de réparation seraient pures ; même matrice que §7.3 ({null, `[]`, partiel, orphelins} × bypass).

### 9.2 Point 2 — Statuts legacy vs modernes : la fenêtre de suppression est ouverte, et elle se referme au moment où 9.1 est implémenté

**Constaté — qui produit quoi, aujourd'hui, exhaustivement :**

| Source de statut | Statuts produits | Famille |
|---|---|---|
| Seed `mockData.tsx:482-544` | `Pending` (id '1', l'entrée démo du wizard), `Approved` (id '2', décor historique) | **Legacy — les 2 seules occurrences vivantes** |
| `NewRequestPage.tsx:111` | `WAITING_MANAGER_APPROVAL` | Moderne |
| Wizard, attribution directe (`AssignmentWizardPage.tsx:217-239`) | `PENDING_DELIVERY` / `Completed` | Moderne |
| `updateApproval` (cibles de `APPROVAL_TRANSITIONS`) | Modernes + `Rejected`/`Completed`/`Cancelled` | Moderne |

Et surtout : **les approbations ne sont pas persistées** (§9.1) — il ne peut donc exister **aucune donnée legacy en circulation** hors seed. `Processing`, `WaitingManager`, `WaitingUser` sont **inatteignables** (aucun producteur, aucun storage) ; `Approved` n'est **cible d'aucune transition** (`APPROVAL_TRANSITIONS`, `businessRules.ts:109-120` — vérifié valeur par valeur) et ne vit que dans le seed. La question D2 (« des données legacy circulent-elles ? ») a désormais une réponse factuelle : **non, et il est structurellement impossible qu'il y en ait** — jusqu'à ce que 9.1 crée un storage.

**Constaté — ce que la coexistence coûte** (surface morte mais entretenue) : les 4 lignes legacy de `APPROVAL_TRANSITIONS` (`businessRules.ts:116-119`), `LEGACY_APPROVAL_ACTIVE_STATUSES` (`:122-127`), `WaitingManager` dans `MANAGER_VALIDATION_PENDING_STATUSES` (`:148-152`) et `MANAGER_GATES` (`:163`), `Pending`/`Processing` dans `IT_GATES` (`:164`), `WaitingUser` dans `USER_CONFIRMATION_GATES` (`:165`), 3 lignes de `PRIMARY_APPROVAL_ACTIONS` (`:379-385`), 4 libellés (`:187-200`), les helpers `isLegacyApprovalWorkflow`/`isModernApprovalWorkflow` (`:333-337`) ; côté UI : **toute la mécanique de sections mixtes d'ApprovalsPage** (`hasMixedWorkflowFamilies`, bandeau, sections « Parcours précédent », `ApprovalsPage.tsx:130-192, 291-330, 376`), deux tests legacy du Dashboard (`DashboardPage.tsx:69, 100`), trois branches du mapping d'événements (`DataContext.tsx:2149-2155`, dont la branche `Approved` doublement morte). Ironie fonctionnelle : la seule demande que la démo présente en premier (seed `Pending`) s'affiche sous « Parcours précédent » dès que la liste est mixte — le workflow vitrine de la démo est étiqueté comme l'ancien.

**Verdict : oui, c'est simplifiable maintenant, et 7.1/D12 ont fait le gros du travail** (les actions dérivent déjà de la table ; retirer une ligne de table retire le comportement partout). Il n'y a **pas** de vraie raison de compatibilité : pas de données à migrer, pas de backend, et le seul « client » des statuts legacy est le seed lui-même. Migration proposée (2 valeurs à changer dans `mockData.tsx`) :

| Seed | Actuel | Cible | Équivalence |
|---|---|---|---|
| id '1' | `Pending` | `WAITING_IT_PROCESSING` | Même gate (IT), même action primaire (`assign`), même cible de refus ; l'entrée démo du wizard est préservée à l'identique |
| id '2' | `Approved` | `Completed` | Décor d'historique ; libellé « Terminé » au lieu d'« Approuvé » (cosmétique) |

Puis suppression sèche : les 4 valeurs de l'union `ApprovalStatus` (`types/index.ts:297-300`), toutes les entrées de table/gates/labels/helpers listées ci-dessus, les sections mixtes d'ApprovalsPage, les deux tests Dashboard, les branches du mapping d'événements. `Approved` sort aussi d'`APPROVAL_HISTORY_STATUSES` (`:141-146`). À traiter dans la même passe car même famille : **`Expired`** (défini `types/index.ts:309`, libellé, mais **ni actif ni historique** → une demande `Expired` n'apparaîtrait dans *aucun* onglet, `ApprovalsPage.tsx:75-111` ; jamais produit ; `expiresAt` jamais écrit ni lu — grep exhaustif) — à supprimer avec, ou à brancher un jour avec les timeouts des `WorkflowDefinition` (qui les décrivent sans qu'aucun code ne les exécute). Les **champs legacy** de `Approval` (`types/index.ts:348-355`), eux, sont **encore load-bearing pour l'affichage** (`equipmentName` dans la recherche et les fallbacks, `requestDate` affiché par les rangées — et toujours écrit `'Aujourd'hui'` en dur à la création, `NewRequestPage.tsx:120`) : leur retrait est un chantier UI distinct, **hors de ce lot** — ne pas mélanger.

- **Risque si on ne touche à rien** : chaque règle continue de gérer 2 vocabulaires (la §7.1 a montré ce que ça coûte : `Processing` avait un bouton et pas de branche) ; et si 9.1 passe avant, le vocabulaire legacy devient **persistant** — la suppression sèche se transforme en migration de storage avec réparation (précisément ce que D2 craignait).
- **Risque du changement** : faible et bien borné — 2 valeurs de seed + retraits mécaniques ; à vérifier au rendu : l'entrée démo du wizard (id '1') se comporte à l'identique, l'Historique affiche id '2' « Terminé », le bandeau « Parcours précédent » ne se déclenche plus jamais, balayage 3 personas. Baselines Approbations à rafraîchir (déjà dû).
- **Ordre impératif : 9.2 avant 9.1** (sinon migration de storage à écrire en plus).
- **Sévérité : Majeur** (au registre depuis §2/P1, aggravé par la dépendance de 9.1) · **Effort : S** · **Test unitaire léger : oui** — la table statut × rôle × cible de §7.1 devient *plus petite* après suppression ; bon moment pour l'écrire si D7 aboutit.

### 9.3 Point 3 — Double couche RBAC + businessRules : les vrais conflits, cas par cas

> Rappel du périmètre demandé : pas « il y a deux systèmes », mais des cas concrets où les couches se contredisent. Le P0 historique (§2) est bien corrigé pour les gardes `canManage*ByRole` (elles consomment le moteur effectif, `businessRules.ts:20-48`). Les conflits restants sont ailleurs.

**A — Le conflit majeur : businessRules autorise la transition, RBAC bloque silencieusement son effet de bord.** C'est le §9.0 (Manager/bénéficiaire vs `inventory.manage`). Cas d'école de la question posée : « RBAC bloque, businessRules autorise » — dans le **même appel**, les deux couches répondent différemment, et c'est la plus silencieuse des deux qui gagne.

**B — La machine à états d'approbation n'a aucun contact volontaire avec le moteur RBAC** (Constaté) : `canUserActOnApproval` et `canTransitionApprovalStatus` ne raisonnent qu'en `UserRole` grossier + relation (manager de, bénéficiaire de) — `businessRules.ts:339-363, 501-553`. La permission dédiée **`action.approvals.manage` n'est consultée par aucun chemin vivant** : ses seuls lecteurs sont `useAccessControl.canValidateRequest`/`canProcessRequest` (`useAccessControl.ts:129-164`)… qui ont **zéro consommateur** (grep exhaustif). Conséquences concrètes :
  - Un **deny** RBAC sur `approvals.manage` posé à un Manager (via le panel RBAC, où la permission est bien exposée et éditable — « Gérer approbations », `RbacManagementPanel.tsx:96`) **n'a aucun effet** : le Manager continue de valider besoins et dotations. C'est le motif exact du P0 de §2, réapparu sur le domaine approbations.
  - Symétriquement, un **allow** n'ouvre rien : un rôle custom doté d'`approvals.manage: write` ne peut agir sur aucune demande (les gates exigent le `UserRole` littéral).
  - Nuance de surface : un deny sur `view.approvals` masque la page (AppLayout) mais **pas les tickets du Dashboard** (`DashboardPage.tsx:62-121`, aucun test de vue) — les transitions restent jouables depuis le Dashboard.

**C — Une troisième couche, morte et divergente, prête à mordre** (Constaté) : `canValidateRequest`/`canProcessRequest`/`canAssignAsset` (`useAccessControl.ts:129-173`) dupliquent les gates de businessRules **avec une sémantique différente** — `canProcessRequest`/`canAssignAsset` imposent un **périmètre pays** à l'Admin (`managedCountries`), que `canTransitionApprovalStatus` ne connaît pas ; `canValidateRequest` exige `approvals.manage` RBAC, que businessRules ignore. Zéro consommateur aujourd'hui, donc zéro bug runtime — mais c'est un piège : le prochain dev qui branche l'une de ces fonctions introduit une divergence UI/mutation instantanée (bouton masqué pour l'Admin hors pays, mutation pourtant permise ; ou l'inverse). Même famille : `roleCan` (`rbacDefaults.ts:472-481`), mort depuis la consolidation P0, toujours pas retiré (cosmétique §5 non fait). **Proposition** : supprimer les 4, ou les déclarer source unique et les brancher — mais pas l'entre-deux actuel.
  - À noter pour l'arbitrage : le périmètre pays qu'elles encodent est la seule trace « code » du géo-scoping des mutations d'approbation — la décision de le retenir ou non rejoint le géo-scoping des exports laissé ouvert en §7.5.

**D — Garde asymétrique sur les utilisateurs** (Constaté) : `addUser`/`updateUser` ouvrent sur la garde RBAC `users.manage` (`DataContext.tsx:1207-1211, 1263-1267`) ; **`deleteUser` ne la consulte pas** (`:1349-1390`) — il repose uniquement sur la règle grossière `actorRole ∈ {Admin, SuperAdmin}` (`canDeleteUserByRoleRule`, `businessRules.ts:692-697`). Deux lectures divergentes de la même intention :
  - Un Admin frappé d'un **deny `users.manage`** ne peut ni créer ni modifier (refus RBAC) mais **peut supprimer** (la garde manquante) — l'UI masque le bouton (`UserDetailsPage.tsx:223` combine les deux couches), donc défense en profondeur seulement, pas de bouton menteur.
  - Le rôle custom **RH** (livré dans les défauts : `users.manage: write` sur base Manager, `rbacDefaults.ts:187-204`) peut créer et modifier des utilisateurs mais jamais en supprimer — cohérent à l'écran (bouton masqué par `roleDeleteDecision`), incohérent en couches.
  - Correctif évident : ajouter la garde `canManageUsersByRole` en tête de `deleteUser`, comme ses deux sœurs. XS.

**E — Gestion RBAC elle-même : rôle grossier des deux côtés, cohérent mais hors moteur** (Constaté, pour mémoire) : `canManageRbacConfig`/`canManageRbacAssignments` (`DataContext.tsx:799-827`) testent `currentUser.role` littéral, et le panel fait exactement pareil (`RbacManagementPanel.tsx:222-223`) — UI et garde alignées, donc pas de bouton menteur ; mais un deny `management.manage` sur un Admin ne l'empêche pas de gérer les assignations. Auto-référence assumée (qui garde le gardien) ; à consigner, pas à corriger en urgence.

- **Risque si on ne touche à rien** : A est couvert en §9.0 ; B fait du panel RBAC un placebo sur le domaine approbations (l'administrateur croit retirer un droit qui reste actif) ; C/D sont des bombes à retardement de maintenance.
- **Sévérité : A = Majeur (§9.0) · B = Majeur (deny inopérant = faille d'autorisation, même famille que le P0) · C = Mineur (mort) · D = Mineur (défense en profondeur) · E = Polish** · **Effort : B = M (décision de conception : soit brancher `approvals.manage` dans les gates, soit l'assumer « rôle-seul » et retirer la permission du panel — les deux sont défendables, trancher explicitement) ; C = XS (suppression) ; D = XS.**

### 9.4 Point 4 — Machine à états d'approbation : les autres D12 potentiels (champs et effets de bord qui ne suivent pas)

Périmètre : la machine d'approbation seule, pas tout `DataContext`. Le n°1 est le §9.0 (l'effet de bord équipement ne suit pour aucun acteur nominal). Le reste, par gravité décroissante :

1. **Le refus de dotation est journalisé comme une validation** (Constaté, `DataContext.tsx:2147-2170`) : le mapping d'événements ne regarde que le statut **cible** — `WAITING_DOTATION_APPROVAL → WAITING_IT_PROCESSING` (refus, D12) tombe sur `status === 'WAITING_IT_PROCESSING'` → `APPROVAL_MANAGER`, dont la phrase d'historique est « **a validé** une demande liée à » (`businessRules.ts:229, 257, 283`). Un refus de dotation se lit donc comme une validation manager dans l'historique (seul `metadata.from/to` dit la vérité). `previousStatus` est déjà disponible dans la fonction (D12 l'a introduit pour l'équipement) — le mapping peut discriminer sur le couple (from, to). Même famille que X16 : le journal ment sur le sens de l'action. **Sévérité : Mineur en démo, Majeur au backend · Effort : XS.**
2. **`updatedAt` ne suit aucune transition** (Constaté) : posé à la création (`NewRequestPage.tsx:113`, wizard `:241`), jamais rafraîchi par `updateApproval` (le `setApprovals` de `:2113-2124` n'écrit que `status` + lien). Aucun consommateur aujourd'hui (les tris utilisent `createdAt`, `ApprovalsPage.tsx:126`) — champ dormant qui deviendra un mensonge exploité dès qu'un tri « dernière activité » ou un backend s'en servira. **Effort : XS** (une ligne dans le même updater).
3. **`validationSteps`/`currentStep` : le workflow multi-étapes du type est un décor** (Constaté) : écrits une fois à la création (`NewRequestPage.tsx:106-109` : une seule étape Manager, `currentStep: 0` ; wizard : `[]`/`99`), **jamais avancés** par aucune transition, **jamais lus** par aucune UI (grep : seuls les mocks et les créations les touchent ; le `currentStep` de `WizardLayout` est sans rapport). Le champ `ValidationStep.reason` (« raison si rejet ») n'est jamais rempli — **aucune transition de refus ne capture de motif**, nulle part. Deux options cohérentes : supprimer ces champs (aligné avec l'esprit 9.2 — le statut global EST la machine à états réelle) ou les brancher (gros chantier, recouvre les `WorkflowDefinition` RBAC — elles aussi purement déclaratives, timeouts/SLA compris). Recommandation : suppression, et consigner « motif de refus » comme manque fonctionnel distinct. **Effort : suppression = XS-S.**
4. **`Cancelled` est une cible autorisée depuis tous les statuts actifs… que rien ne produit** (Constaté) : présent dans chaque ligne d'`APPROVAL_TRANSITIONS`, libellé, badge — mais la dérivation d'actions ne produit que primaire + refus (`getAvailableApprovalActions`, `businessRules.ts:396-416`) et aucun autre appelant ne l'envoie. En creux : **le demandeur ne peut pas annuler sa propre demande** (`canUserActOnApproval` ne donne aucun droit au requester en dehors des gates de rôle) — un User qui s'est trompé attend le refus du manager. Décision produit plutôt que bug : brancher « Annuler » pour le demandeur sur statuts amont (`WAITING_MANAGER_APPROVAL`/`WAITING_IT_PROCESSING`), ou retirer `Cancelled` des cibles. **Sévérité : Mineur (gap fonctionnel) · Effort : S si branché.**
5. **`DISPUTED` / `disputeReason` : le litige de réception n'existe pas** (Constaté) : `AssignmentStatus.DISPUTED`, `ASSIGN_DISPUTED` (icône/action/titre complets), `disputeReason`/`disputedAt` — zéro producteur (grep). Le « refus » du bénéficiaire à `PENDING_DELIVERY` passe par `Rejected` → libération sèche (§9.0-4), sans capturer ni litige ni motif. Mort-né ou manquant, à trancher avec le motif de refus (point 3). **Effort : retrait = XS.**
6. **La libération d'équipement est incomplète — contrairement au retour** (Constaté) : `getEquipmentUpdatesForApprovalStatus` pour `Rejected`/`Cancelled` et pour le refus de dotation remet `{status, assignmentStatus, user}` (`businessRules.ts:563-569, 595-601`) mais **laisse** `assignedBy/assignedAt/assignedByName/managerValidationBy/managerValidationAt` posés par le wizard (`AssignmentWizardPage.tsx:174-186`) sur l'équipement libéré. Le workflow de retour, lui, purge tout explicitement (`getEquipmentUpdatesForReturnWorkflow`, `:779-795`). Un équipement « Disponible » garde donc les métadonnées de son attribution avortée — données sales du même genre que celles que §8.1 reprochait à l'issue de secours manuelle. **Effort : XS** (aligner sur la purge du retour).
7. Pour mémoire (déjà connu, cohérence) : la tolérance same-status (D10) court-circuite **avant** tout contrôle d'acteur (`DataContext.tsx:2076-2078`) — un acteur sans aucun droit « réussit » un no-op. Sans effet observable ; à re-regarder seulement si le retour d'appel sert un jour à autre chose qu'un toast.

### 9.5 Récapitulatif et séquencement proposé

| Item | Constat clé | Sévérité | Effort | Décision bloquante |
|---|---|---|---|---|
| **9.0** Synchro équipement jamais exécutée pour Manager/bénéficiaire | D12 « vérifié » sous SuperAdmin seulement ; orphelins par le chemin nominal | **Majeur (Bloquant si backend)** | S | **D15** |
| **9.1** Persistance des approbations | Seul domaine non persisté ; migration triviale (aucune donnée existante) ; rend la réparation au chargement possible | Majeur | S (+S réparation) | **D13** |
| **9.2** Statuts legacy | 2 occurrences vivantes, toutes deux dans le seed ; fenêtre de suppression sèche ouverte tant que 9.1 n'est pas fait | Majeur | S | **D14** |
| **9.3-B** `approvals.manage` inopérant | deny/allow RBAC sans effet sur le domaine approbations ; panel placebo | Majeur | M | **D16** |
| **9.3-C/D** Couches mortes + `deleteUser` sans garde RBAC | Divergences latentes | Mineur | XS | — |
| **9.4** Champs/effets qui ne suivent pas (journal du refus, `updatedAt`, `validationSteps`, `Cancelled`, `DISPUTED`, libération incomplète) | Autres D12 en germe | Mineur→Majeur-si-backend | XS–S | D14 (recouvrement) |

**Décisions requises (suite de D1-D12) :**

- **D13** (9.1) — Persistance des approbations : format/mécanique proposés OK ? La **réparation au chargement** des orphelins hérités est-elle incluse au lot ?
- **D14** (9.2) — Suppression sèche des statuts legacy (+ `Expired`, et recouvrement 9.4 : `validationSteps`/`currentStep`, `DISPUTED`) avec migration du seed (2 valeurs) — **avant** D13 ?
- **D15** (9.0) — La synchro équipement d'`updateApproval` devient une écriture système hors garde acteur (écrivain interne confiné) — gate de reproduction multi-personas avant correctif, comme 7.1 ?
- **D16** (9.3-B) — `action.approvals.manage` : brancher dans les gates de la machine à états (le moteur RBAC devient co-décideur des transitions), ou assumer « rôle + relation » et retirer la permission du panel ? (Les deux sont défendables ; l'entre-deux actuel — permission éditable sans effet — ne l'est pas.)

**Séquencement proposé après arbitrage** : **9.0/D15 d'abord** (reproduction jane/ethan puis correctif — c'est le flux nominal qui est cassé, et tout le reste se vérifie *à travers* lui) → **9.2/D14** (suppression legacy, fenêtre ouverte) → **9.1/D13** (persistance, sur vocabulaire assaini) → 9.3-C/D et 9.4 en lots XS groupés → D16 en dernier (décision de conception indépendante). Baselines visuelles Approbations : à rafraîchir une seule fois, après le lot 9.2.

**Aucune implémentation. En attente du feu vert et des arbitrages D13-D16.**

---

## 9.6 Bilan d'implémentation vague 2 (passe du 2026-07-11, annoté au fil des lots)

> Arbitrages reçus : D15 approuvé (gate de reproduction puis écrivain système) ; **D14 avant D13** (ordre impératif) ; D13 approuvé (réparation-au-chargement seulement si l'effort reste S) ; les 6 « autres D12 » de §9.4 approuvés en lots XS (vigilance demandée sur annulation-demandeur et motif de refus : gap fonctionnel, pas simple correctif) ; D16 en délibéré (penchant utilisateur : retirer). Baselines Approbations : un seul refresh, après D14.

### D15 (§9.0) — FAIT (`f9d6766`)

- **Gate de reproduction passé avant correctif, 3/3 conformes au diagnostic** (chaînes complètes au rendu, ethan crée → jane approuve → alice affecte au wizard → étape testée, jamais alice sur les étapes dotation/réception) :
  1. jane valide la dotation → approbation à `PENDING_DELIVERY` (ethan voit « Confirmation utilisateur ») mais LPT-HQ-01 reste `En attente/WAITING_DOTATION_APPROVAL` — figé.
  2. jane refuse la dotation → demande revenue au Traitement IT, lien rompu (D12), mais LPT-DK-03 reste `En attente/WAITING_DOTATION_APPROVAL user=Ethan` — libération sautée, orphelin définitif.
  3. ethan confirme la réception → demande `Completed` (Historique) mais équipement jamais `Attribué/CONFIRMED`, `confirmedBy=null`.
- **Correctif** : le corps d'`updateEquipment` (dérivation d'événement + journalisation + `setEquipment`) est factorisé en `applyEquipmentWrite`, interne au `DataContext` et absent de la valeur du contexte. `updateEquipment` public = garde `canManageInventoryByRole` → `applyEquipmentWrite`. La synchro d'`updateApproval` appelle `applyEquipmentWrite` directement : écriture système d'une transition déjà autorisée par `canTransitionApprovalStatus`, champs confinés aux sorties de `getEquipmentUpdatesForApprovalStatus`. Les deux autres appelants internes (`upsertEquipmentFromAuditScan`, `removeEquipmentFromServiceAfterAudit`) restent sur le chemin gardé — acteurs IT légitimes.
- **Garde non affaiblie, vérifié trois fois** : (a) `applyEquipmentWrite` n'a aucun consommateur hors `DataContext.tsx` (grep) et n'est pas dans la valeur du provider ; (b) `updateEquipment` exposé ouvre toujours sur la garde ; (c) au rendu, jane et ethan n'ont aucune voie d'édition directe d'équipement (0 « Menu d'actions », 0 « Modifier » sur les pages détails, témoin alice = 2 « Modifier »).
- **Après correctif, re-vérification vague 1 rejouée en jane/ethan (ce que la vague 1 n'avait fait qu'en alice.admin), 4 chaînes toutes vertes** :
  - nouvelle demande → … → `Completed` → équipement `Attribué/CONFIRMED`, `confirmedBy='4'` (ethan) ;
  - refus de dotation par jane → équipement libéré `Disponible/NONE/user:null` + demande revenue à l'IT ;
  - rejet par le bénéficiaire à `PENDING_DELIVERY` → `Rejected` (Historique) + libération ;
  - boucle complète : refus dotation → l'équipement libéré **réapparaît au pool du wizard** → ré-affectation du même équipement → validation → confirmation → `Attribué/CONFIRMED`.
- La requalification de §9.0 est levée : D12+D15 tiennent désormais pour les trois personas du flux nominal.
