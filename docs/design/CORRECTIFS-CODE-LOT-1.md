# Correctifs code — lot 1 : bugs bloquants (routeur, adresses mortes)

**2 septembre 2026.** À appliquer dans `TRACKER/` tel quel : aucune planche à dessiner, ce sont des adresses et des clés de routeur. Chaque correctif nomme le fichier, la ligne relevée le 01/09, le texte actuel et le texte cible. Vérification en fin de document.

---

## C1 — `NewRequestPage.tsx` : la demande envoyée (ou annulée) mène à une 404

`src/features/tasks/pages/NewRequestPage.tsx`, lignes ~160 et ~168.

```diff
-            navigate('/approvals');
+            navigate('/tasks');
```
(les deux occurrences : après `showToast(successMsg, 'success')` et dans `onCancel`).

## C2 — `useAppNavigation.ts` : `navigateToItem` ignore les assistants et l'édition

`src/hooks/useAppNavigation.ts`, `routeMap` de `navigateToItem` (~ligne 197).

```diff
             const routeMap: Partial<Record<ViewType, (id: string) => string>> = {
                 equipment_details: (id) => `/inventory/${id}`,
                 edit_equipment: (id) => `/inventory/edit/${id}`,
                 user_details: (id) => `/users/${id}`,
                 edit_user: (id) => `/users/edit/${id}`,
                 category_details: (id) => `/management/categories/${id}`,
                 model_details: (id) => `/management/models/${id}`,
-                audit_details: (id) => `/audit/details/${id}`, // Assuming this path
+                audit_details: () => `/audit/details`,
                 site_details: (id) => `/locations/site/${encodeURIComponent(id)}`,
+                // Les rangées « Remettre » / « Réceptionner » / « Restituer » de la file (TasksPage)
+                // arrivent ici avec l'identifiant de l'équipement ; les deux assistants lisent
+                // `equipmentId` dans le hash. Sans ces deux clés, le tap ne faisait rien.
+                assignment_wizard: (id) => `/wizards/assignment?equipmentId=${encodeURIComponent(id)}`,
+                return_wizard: (id) => `/wizards/return?equipmentId=${encodeURIComponent(id)}`,
             };
```

Effet : `TasksPage.openTask` → `onItemClick('return_wizard', item.id)` ouvre l'assistant sur le bon objet ; `UserDetailsPage` peut ouvrir l'édition (C4).

## C3 — `ModelDetailsPage.tsx` : les rangées d'unités n'ouvrent rien

`src/features/management/pages/ModelDetailsPage.tsx`, lignes ~346 et ~350.

```diff
-                                    onClick={() => navigateToItem('equipment', item.id)}
+                                    onClick={() => navigateToItem('equipment_details', item.id)}
```
(idem dans le `onKeyDown` quatre lignes plus bas). `'equipment'` n'est pas une clé de `navigateToItem`.

## C4 — `UserDetailsPage.tsx` : « Modifier la fiche » est un geste mort

`src/features/users/pages/UserDetailsPage.tsx`, `menuItems`, entrée `edit` (~ligne 311).

```diff
-            onSelect: () => onViewChange?.('edit_user'),
+            onSelect: () => onEditUser?.(user.id),
```
et dans les props :
```diff
 interface UserDetailsPageProps {
     userId: string;
     onBack: () => void;
     onViewChange?: (view: ViewType) => void;
     onEquipmentClick?: (id: string) => void;
+    onEditUser?: (id: string) => void;
 }
```
`AppLayout.tsx`, case `'user_details'` :
```diff
                     <UserDetailsPage
                         userId={selectedItemId}
                         onBack={() => handleViewChange('users')}
                         onViewChange={handleViewChange}
                         onEquipmentClick={(id) => handleItemClick('equipment_details', id)}
+                        onEditUser={(id) => handleItemClick('edit_user', id)}
                     />
```

## C5 — `AppLayout.tsx` : `CategoryDetailsPage` sans `onModelClick`

Case `'category_details'` (~ligne 466) :
```diff
                     <CategoryDetailsPage
                         categoryId={selectedItemId}
                         onBack={() => handleViewChange('management')}
+                        onModelClick={(id) => handleItemClick('model_details', id)}
                     />
```

## C6 — `EquipmentDetailsPage.tsx` : trois adresses qui ne portent pas leur cible

`src/features/inventory/pages/EquipmentDetailsPage.tsx`.

a) Le lien « dans Audit, filtré sur cet actif » (~ligne 665) pointe une query que personne ne lit. Tant que l'Audit n'a pas de filtre par actif, **le lien dit vrai ou disparaît** :
```diff
-                                onClick={() => navigate(`/audit?targetId=${encodeURIComponent(item.id)}`)}
+                                onClick={() => navigate('/audit/overview')}
…
-                                    dans Audit, filtré sur cet actif
+                                    dans Audit
```
(le filtre par actif est noté pour la planche 16.1 — zone d'ombre n° 13 de `CARTE_PROJET.md`).

b) « Restituer » (deux occurrences, ~lignes 300 et 331) ouvre l'assistant sans l'objet :
```diff
-                        onClick={() => navigate('/wizards/return')}
+                        onClick={() => navigate(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`)}
```

c) `PENDING_CONFIRMATION` n'existe pas dans `AssignmentStatus` (~lignes 384 et 500) :
```diff
-        if (item.assignmentStatus === 'PENDING_CONFIRMATION' || item.status === 'En attente') {
+        if (item.assignmentStatus === 'PENDING_DELIVERY') {
…
-                            : item.assignmentStatus === 'PENDING_CONFIRMATION' && holder
+                            : item.assignmentStatus === 'PENDING_DELIVERY' && holder
```

## C7 — `InventoryPage.tsx` : même statut fantôme

`src/features/inventory/pages/InventoryPage.tsx`, lignes ~498 et ~708 : remplacer `'PENDING_CONFIRMATION'` par `'PENDING_DELIVERY'`.

## C8 — `DashboardPage.tsx` : « Réceptionner » un retour sans dire lequel

~ligne 826 :
```diff
-                                                onClick={() => onViewChange('return_wizard')}
+                                                onClick={() => onNavigate?.(`/wizards/return?equipmentId=${encodeURIComponent(entry.id.replace(/^return-/, ''))}`)}
```
(`entry.id` vaut `return-<equipmentId>` pour une tâche de retour.)

## C9 — `TasksPage.tsx` : la demande chez l'IT n'a pas de bouton

Dans le `useMemo` des tâches, branche `isActionable` (~ligne 300). Quand `primary.kind === 'assign'`, la rangée doit ouvrir l'assistant avec la demande :
```diff
                 const transition =
                     primary?.kind === 'transition' && primary.nextStatus
                         ? { approvalId: approval.id, nextStatus: primary.nextStatus }
                         : undefined;
+                const assign = primary?.kind === 'assign' ? { approvalId: approval.id } : undefined;

                 out.push({
                     id: `approval-${approval.id}`,
                     nature: approval.status === 'PENDING_DELIVERY' ? 'reception' : 'validation',
                     scope: 'todo',
                     title,
                     context: getApprovalContext(approval.status),
                     since: approval.createdAt ?? null,
-                    action: transition ? getApprovalActionLabel(approval.status) : undefined,
+                    action: transition ? getApprovalActionLabel(approval.status) : assign ? 'Remettre' : undefined,
                     transition,
+                    assign,
                     ...approvalTarget(approval),
```
Type `Task` : ajouter `assign?: { approvalId: string }`. Dans `openTask` :
```diff
     const openTask = (task: Task) => {
         if (task.deviceId) {
             setReviewDeviceId(task.deviceId);
+        } else if (task.assign) {
+            window.location.hash = `/wizards/assignment?approvalId=${encodeURIComponent(task.assign.approvalId)}`;
         } else if (task.target && task.targetId) {
```
(`AssignmentWizardPage` lit déjà `approvalId` et `category` dans le hash. Le libellé et le ⋮ de refus suivent la planche **03.3**, colonne « la rangée d'une demande » — lot 2.)

---

## Vérification (après application)

1. Déposer une demande depuis `/tasks/new` → retour sur `/tasks`, snackbar « transmise ». Annuler → `/tasks`.
2. File → rangée « Retour à réceptionner » → tap « Réceptionner » ouvre `/wizards/return?equipmentId=…` à l'étape 2 sur le bon objet. Idem « Remettre » (équipement `PENDING_DELIVERY`) et « Restituer » (porteur).
3. File → demande `WAITING_IT_PROCESSING` (Admin) → bouton « Remettre » → assistant titré « Affectation pour Demande #… ».
4. Fiche d'un modèle → tap sur une unité → fiche de l'équipement.
5. Fiche d'un type → tap sur un modèle → fiche du modèle (plus d'erreur `onModelClick is not a function`).
6. Fiche utilisateur → ⋮ → Modifier la fiche → `/users/edit/:id`.
7. Fiche équipement → Restituer → assistant pré-rempli ; Historique → « dans Audit » ouvre l'Audit.
8. `npm run lint` — les comparaisons à `'PENDING_CONFIRMATION'` ont disparu (grep vide).
