# Correctifs code — lot 2 : fiche utilisateur (planche 05.2)

**2 septembre 2026.** Périmètre : `UserDetailsPage` et ce que le store doit porter pour qu'elle ne montre plus rien de fabriqué. Suppose le lot 1 appliqué (C2 : `navigateToItem` connaît les assistants ; C4 : `onEditUser`).

Fichiers du lot :
- `code-lot-2/UserDetailsPage.tsx.txt` → remplace `src/features/users/pages/UserDetailsPage.tsx` (entier).
- Diffs D1 à D7 ci-dessous (types, DataContext, AppLayout, AssignmentWizardPage, UsersPage, EquipmentDetailsPage).

---

## Ce que la page fait désormais, et d'où vient chaque fait

| Fait affiché | Source | Avant |
| --- | --- | --- |
| État de l'accès (actif / suspendu le … par … / invité) | `user.status`, `suspendedAt`, `suspendedBy` | trois libellés codés en dur, `pending` lu « Départ prévu » |
| Date de départ | `user.departureDate` (champ propre) | confondue avec `status === 'pending'` |
| Demandes en cours | `approvals` — bénéficiaire ou demandeur, `ACTIVE_APPROVAL_STATUSES` | `req.requestedBy?.id` + `'pending'` : champs inexistants, toujours 0 |
| Objets détenus : code, type, date | `assetId`, `type`, `confirmedAt ?? assignedAt` ; tiret si absent | `item.code`, `item.category`, `item.assignmentDate` : inexistants, date fixe |
| Signal « à récupérer » sous une rangée | `Equipment.holderAlert` (écrit par `updateUser`) ou dérivé de l'état du compte | — |
| Note | `user.managerNote` {texte, auteur, date} | état React, perdu au rechargement |
| Historique | `events` : mouvements où la personne figure + événements `USER` sur son id ; vide → « Aucun mouvement enregistré » | trois événements inventés |
| Dernier accès | `user.lastLogin` ; « jamais connecté » si absent | repli `'14/01'` |
| Téléphone | `user.phone` ; rangée absente sinon | repli `'+33 6 00 00 00 01'` |
| Mot de passe, code PIN | `authService.getAllUsers()` → `MustChangePassword`, `PinStatus` | « Défini » en dur |

Culs-de-sac fermés : Modifier la fiche → `onEditUser` ; Attribuer → `#/wizards/assignment?userId=` ; Organiser la restitution → un objet : assistant direct, plusieurs : feuille listant les objets, « Restituer » par objet (`?equipmentId=`) ; Tout l'historique → déploiement dans la fiche ; Suspendre / Réactiver → `updateUser` + `authService.setUserStatus` (best effort) ; Note → `updateUser` ; Réinitialiser le mot de passe → `authService.resetUserPassword`.

Libellé ↔ règle : `canUpdateUserByBusinessRule` refuse de suspendre avec une demande en cours. L'entrée de menu le dit (« Bloqué : une demande est en cours à son nom ») et le tap ouvre une feuille qui mène à la file, au lieu d'échouer après confirmation.

---

## D1 — `src/types/index.ts` : les champs que la fiche lit

Sur `User` : `suspendedAt`, `suspendedBy`, `suspensionReason`, `departureDate` (indépendant de `status`), `managerNote { text, authorId, authorName, updatedAt }`.
Sur `Equipment` : `holderAlert { kind: 'suspended' | 'departure'; since; until?; userId }` — écrit et levé par `DataContext.updateUser`, jamais à la main.

## D2 — `src/context/DataContext.tsx` : `updateUser` journalise l'acte et signale les objets

Le journal dit l'acte (« Compte de X suspendu », « Départ de X fixé au … », « Note de gestionnaire mise à jour pour X ») au lieu de « Mise à jour du profil ». `metadata` porte `accountStatus` / `reason` / `departureDate` ; `isSensitive` vaut le changement de note (le texte n'entre pas au journal, l'événement oui).

Puis, quand le statut ou la date de départ change, les objets encore détenus reçoivent `holderAlert` et un événement système chacun. `equipment` entre dans les dépendances du `useCallback`.

`holderAlert` est levé quand l'objet quitte la personne : dans `applyEquipmentWrite`, un changement de porteur ajoute `holderAlert: undefined` au jeu écrit.

## D3 — `src/components/layout/AppLayout.tsx` : la fiche reçoit l'édition

Déjà fait au lot 1 (C4) : `onEditUser={(id) => handleItemClick('edit_user', id)}`.

## D4 — `AssignmentWizardPage.tsx` : un compte suspendu quitte le sélecteur

La feuille « Suspendre » promet que le nom disparaît des sélecteurs d'attribution ; `filteredUsers` ajoute `u.status !== 'inactive'`.

## D5 — `UsersPage.tsx` : le filtre d'état lit les bons champs

`Invité` = `status === 'pending'` (sens d'`authService`) ; `Départ prévu` = `!!user.departureDate`, et non plus `status === 'pending'`. Les crans passent à cinq : Tous · Actif · Invité · Suspendu · Départ prévu.

## D6 — `src/lib/businessRules.ts` : rien à changer

`canUpdateUserByBusinessRule` garde ses deux refus ; la page les dit avant le tap.

## D7 — `EquipmentDetailsPage.tsx` : la fiche de l'objet porte le signal (planche 04.2)

Dans la branche `holder` du `DetailHero`, le `detail` ajoute la ligne du `holderAlert` (« À récupérer — porteur suspendu le … » / « À récupérer avant son départ le … »). Le geste primaire reste « Restituer ».

---

## Écarts relevés à l'application (04/09/2026)

Trois points où le fichier livré ne collait pas au code du dépôt ; corrigés en place, l'intention conservée :

1. **`Button` n'a pas de prop `fullWidth`** dans ce DS — React la reversait sur le `<button>` du DOM et le signalait à chaque rendu. La pleine largeur passe par la classe `w-full`, comme sur 04.2.
2. **`DetailHero` avalait `statusDetail`** quand un `avatar` est fourni : la variante à avatar ne rendait que la pastille de statut. La ligne « Départ le … » n'avait aucune chance de s'afficher. Corrigé dans `DetailHero`, au bénéfice de toutes les fiches à avatar.
3. **`useEffect` d'`authService`** : les clés `user?.id` / `user?.email` sont extraites avant l'effet, sinon `react-hooks/exhaustive-deps` échoue. L'intention — ne pas relancer l'appel à chaque nouvel objet `user` — est conservée.

---

## Vérification (après application)

1. Fiche d'Alice (`#/users/1`) : « Compte actif » sans date ; objets avec leur `assignedAt` (tiret si absent) ; téléphone du seed ; Mot de passe et Code PIN lus dans `authService` ; historique = lignes du journal, ou « Aucun mouvement enregistré ».
2. ⋮ → Suspendre → motif → confirmer : héro « Suspendu le … · par … », geste primaire « Réactiver », signal « À récupérer — porteur suspendu » sous chaque objet, `tracker_users` et `tracker_equipment` écrits ; **F5 conserve tout**.
3. Réactiver : signal levé, `suspendedAt` effacé, `holderAlert` retiré.
4. ⋮ → Fixer une date de départ : ligne « Départ le … » sous l'état, geste primaire « Organiser la restitution », signal « À récupérer avant le … ».
5. Organiser la restitution : 1 objet → assistant direct ; plusieurs → feuille.
6. Personne avec une demande active : métrique « 1 demande en cours », rangée vers les Tâches, ⋮ Suspendre « Bloqué : … » → feuille « Voir la demande ».
7. Note : ajouter, F5, modifier, supprimer.
8. Assistant d'attribution : un compte suspendu n'apparaît plus dans la liste des personnes.
9. `npm run lint` : plus de `item.code`, `item.category`, `item.assignmentDate`, `req.requestedBy` dans la page.
10. Fiche d'un objet après suspension : « À récupérer — porteur suspendu le … » ; après réactivation, la ligne disparaît.
