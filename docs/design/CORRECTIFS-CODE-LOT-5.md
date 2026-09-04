# Correctifs code — lot 5 : refuser une demande depuis la file (planches 03.3 et 06.5)

**2 septembre 2026.** Zone d'ombre n° 8 de `CARTE_PROJET.md` : les règles du refus existent (motif obligatoire, 4 points de refus, `getApprovalRejectTarget`, garde dans `updateApproval`), **aucune UI ne les déclenche**. La planche 03.3 (colonne « la rangée d'une demande ») et 06.5 dessinent le chemin : le oui sur la rangée, le non dans le ⋮ avec un motif. Suppose le lot 1 (C9 : `assign` sur la rangée IT).

Fichier : `src/features/tasks/pages/TasksPage.tsx`.

## T1 — la rangée porte le refus possible

Le type `Task` gagne `refusal?: { approvalId, nextStatus, requesterName }`, calculé dans le `useMemo` des tâches à côté de `transition` et `assign`. Le refus n'existe **que là où un oui existe** : même acteur, même gate — `canTransitionApprovalStatus` retranche si besoin.

## T2 — le ⋮ de rangée, et le verbe court

Le bloc de rangée devient un couple : le geste primaire (`SecurityGate` ou tap) et, s'il y a un refus possible, un `Menu` — « Ouvrir la demande », « Refuser… » / « Renvoyer à l'IT… », et la fiche du demandeur quand la rangée la connaît. Le verbe raccourcit (« Valider la demande » → **« Valider »**) : la rangée porte maintenant un ⋮ à sa droite, et le sujet garde ses 125 px.

## T3 — la feuille de motif, puis le code personnel

Une `BottomSheet` : le sujet, un bandeau qui dit ce que le refus fait (définitif et lu par le demandeur, ou renvoi au traitement IT), un motif **obligatoire**, puis `SecurityGate`. `updateApproval` écrit `decisionNote` et l'événement `APPROVAL_REJECT` / `APPROVAL_DOTATION_REJECT` ; la rangée quitte « À faire ».

## T4 — `DashboardPage` : pas de refus à l'accueil, et c'est dit

La branche `approve=false` de `validate`, jamais appelée, est **retirée** plutôt que branchée : la planche 03.1 pose que l'accueil porte le oui d'un tap, le non se prend dans la file, où il exige un motif et un code.

## Vérification

1. Manager sur `WAITING_MANAGER_APPROVAL` : rangée « Valider » + ⋮ → « Refuser… » → feuille, bouton inactif sans motif → motif → code → rangée disparue de « À faire ».
2. Admin sur `WAITING_DOTATION_APPROVAL` : ⋮ → « Renvoyer à l'IT… » → statut `WAITING_IT_PROCESSING`, `decisionNote.kind === 'DOTATION_REJECT'`.
3. Réception `PENDING_DELIVERY` côté bénéficiaire : « Confirmer » + ⋮ « Refuser… » → `DELIVERY_REJECT`, équipement libéré.
4. Refus sans motif → refusé par la garde : l'UI n'est pas la seule barrière.
5. Retour et incident : aucun ⋮.

### Relevé d'application (04/09/2026)

Les cinq points passent.
- V1 : `{"status":"Rejected","note":{"kind":"MANAGER_REJECT","reason":"Budget gelé…","actorName":"Alice SuperAdmin"}}`, la file retombe à « Tout 0 ».
- V2 : `{"status":"WAITING_IT_PROCESSING","kind":"DOTATION_REJECT"}`.
- V3 : `{"kind":"DELIVERY_REJECT","eq":{"s":"Disponible","a":"NONE","u":null}}` — l'équipement est bien libéré.
- V4 : la garde vit dans `DataContext.tsx` (« Un motif est requis pour refuser ou renvoyer une demande. »), indépendamment du bouton désactivé.
- V5 : une file ne portant qu'un retour n'affiche aucun ⋮.

**Note d'application :** le nom accessible d'une rangée reprend celui de son ⋮ ; pour viser le déclencheur il faut `button[aria-haspopup="menu"]`, sinon on attrape la rangée entière. Utile pour les prochains harnais.
