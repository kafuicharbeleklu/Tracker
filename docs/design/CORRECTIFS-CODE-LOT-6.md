# Correctifs code — lot 6 : annuler ma demande (planche 03.3, onglet « À suivre »)

**2 septembre 2026.** Fin de la zone n° 8 : le refus est branché (lot 5), l'**annulation par le demandeur** ne l'était pas. Le store la connaît (`Cancelled`, `DecisionNoteKind = 'CANCEL'`, motif facultatif) ; `getAvailableApprovalActions` renvoie `cancel` et la page ne consommait que `primary`.

Fichier : `src/features/tasks/pages/TasksPage.tsx`.

## A1 — la rangée « À suivre » d'une demande à moi porte l'annulation

`Task` gagne `cancel?: { approvalId }`, calculé dans la branche des demandes suivies. `getAvailableApprovalActions` ne rend `cancel` qu'au demandeur lui-même — le bénéficiaire d'une demande déléguée ne l'a pas.

## A2 — le ⋮ sur la rangée suivie

Le chevron laisse la place à un `Menu` — « Ouvrir la demande », « Annuler ma demande… ».

## A3 — la feuille : motif facultatif, pas de code personnel

Une annulation n'engage personne d'autre que moi : pas de `SecurityGate` (le step-up signe des décisions sur autrui).

## A4 — `NewRequestPage`, colonne « une demande est déjà en cours » (06.4)

Le rappel gagne un lien « Voir dans les Tâches ».

## Vérification

1. Demande `WAITING_MANAGER_APPROVAL` à son nom → « À suivre » : ⋮ → « Annuler ma demande… » → feuille sans code → `Cancelled`, `decisionNote.kind === 'CANCEL'`, événement `APPROVAL_CANCEL`.
2. « Historique » : la rangée porte « Annulée · par moi », motif cité s'il existe.
3. Une demande `PENDING_DELIVERY` n'offre pas l'annulation : on refuse la réception (lot 5).
4. La demande d'un tiers : chevron seul.

### Relevé d'application (04/09/2026)

**A4 non applicable pour l'instant, et non contourné.** Le rappel « vous avez déjà une demande en cours » **n'existe pas encore** dans `NewRequestPage` : il arrive avec le lot 17 (la page devient `RequestSheet`). Ajouter le lien maintenant aurait voulu dire écrire d'abord le rappel, donc faire le lot 17 à sa place, avec une forme qu'il n'a pas encore arbitrée. À reprendre **dans le lot 17**.

Les quatre vérifications passent :
- V1 : `{"status":"Cancelled","kind":"CANCEL","reason":"Plus besoin, poste libre trouvé.","evt":"APPROVAL_CANCEL"}`, aucune saisie de code.
- V2 : la rangée d'historique lit « Demande annulée · Ethan Employé ».
- V3 : une remise en cours n'offre que « Refuser… ».
- V4 : la demande d'un tiers n'affiche aucun ⋮.

**Écart traité en chemin :** la rangée ne rendait **jamais** `task.context` — un arbitrage antérieur l'avait retiré parce qu'il doublait la pastille de nature (« Validation du manager · 9 j » disait deux fois la même chose). C'est vrai sur « À faire » et « À suivre » ; c'est faux dans l'**historique**, où la pastille ne peut pas porter l'issue. Le contexte s'y affiche donc, et lui seul, enrichi de l'auteur de la décision quand `decisionNote` en porte un. Le motif reste au détail, il est trop long pour une rangée.
