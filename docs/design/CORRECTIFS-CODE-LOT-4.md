# Correctifs code — lot 4 : import d'utilisateurs (planche 05.3, colonne « importer un fichier »)

**2 septembre 2026.** `ImportUsersPage.handleImport` = `setTimeout` + toast « importés avec succès » : **aucun `addUser`**. Question (a) de 05.3 tranchée par le code : l'import est un fichier CSV. Le lot fait écrire l'import, ligne par ligne, avec les trois issues que la planche dessine : créée, déjà là (même adresse), invalide.

Fichier : `src/features/users/pages/ImportUsersPage.tsx`.

## U1 — le store et les doublons

La page consomme `useData()` (`users`, `addUser`) et `useAccessControl()`. `ParsedUserRow._status` gagne `'skipped'` : une adresse déjà en base n'est pas une faute, la ligne est ignorée et le dit (« A déjà un compte à cette adresse »), en teinte neutre et non en danger. `stats` gagne `skipped`, et l'en-tête de l'aperçu compte les trois issues.

## U2 — `handleImport` écrit

Chaque ligne valide passe par `addUser` — la même porte que la saisie. Le rôle vient de la colonne `Role` (table `ROLE_BY_CSV`), sinon du sélecteur `defaultRole`. Le compte naît `status: 'pending'` (invité au sens d'`authService`) avec `mustChangePassword`. Une ligne refusée par la règle est **nommée** dans un toast, pas avalée. `authService.createUser` suit en best effort : le store fait foi.

`defaultRole` se règle sous l'aperçu — après avoir vu qui entre, pas avant. `SuperAdmin` ne s'offre pas à qui ne l'est pas : `addUser` le refuserait ligne par ligne.

## U3 — le bouton compte ce qui s'écrira

`Importer N personne(s)`, désactivé quand `stats.valid === 0`.

## Vérification

1. Fichier de 6 lignes dont 2 adresses déjà en base et 1 sans adresse → aperçu : 3 valides, 2 « déjà un compte », 1 « Nom et Email requis » ; bouton « Importer 3 personnes ».
2. Importer → 3 comptes neufs, état « Invité », manager posé si le service en a un (`serviceManagers`) ; `tracker_users` écrit ; F5 conserve.
3. Journal : 3 événements `CREATE` USER.
4. Réimporter le même fichier → 5 ignorées, 1 invalide, bouton désactivé.

### Relevé d'application (04/09/2026)

Les quatre points passent. `tracker_users` : 11 → 14. Les rôles sont lus de la colonne (`Kofi Mensah` → Manager, `Sara Benali` sans colonne → `User` du sélecteur), tous en `status: 'pending'`, et la cascade `serviceManagers` a posé `managerId: '3'` sur le compte du service Sales sans qu'on le demande. Le filtre « Invité » de la feuille (lot 2, D5) ne ramène que les trois. Au réimport : 0 valide, 5 déjà là, 1 erreur, geste primaire désactivé.
