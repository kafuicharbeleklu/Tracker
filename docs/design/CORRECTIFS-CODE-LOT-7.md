# Correctifs code — lot 7 : une seule confirmation de réception (zone n° 9)

**2 septembre 2026.** Deux chemins confirmaient une réception : depuis la file, `updateApproval(…, 'Completed')` synchronise l'équipement ; depuis la fiche équipement, `updateEquipment({ CONFIRMED })` **n'écrivait que l'objet** — l'approbation liée restait `PENDING_DELIVERY` pour toujours, et la garde acteur d'`updateEquipment` **refusait silencieusement le bénéficiaire**, la personne même censée confirmer (§9.0/D15). Le libellé « Réception confirmée » s'affichait dans les deux cas.

Arbitrage : **une seule écriture, dans le store**, appelée par les deux écrans.

## S1 — `DataContext` : `confirmEquipmentReception`

Garde : le porteur, son manager, ou un gestionnaire. Deux chemins internes — une demande porte l'objet (la transition d'approbation fait foi et synchronise), ou attribution directe (même écriture, `source: 'direct_reception'`).

## S2 — `EquipmentDetailsPage`

Le geste appelle l'écriture unique, et n'apparaît qu'à qui la règle laisse confirmer.

## S3 — `TasksPage`

La rangée `delivery-<id>` porte `reception` et confirme sur place, par le sas comme les autres transitions.

## S4 — `DashboardPage`

Sans objet ici — voir le relevé.

## Vérification

1. Demande jusqu'à `PENDING_DELIVERY` ; le bénéficiaire confirme **depuis la fiche** → approbation `Completed`, objet `Attribué / CONFIRMED`, `confirmedBy` = bénéficiaire, un seul `ASSIGN_CONFIRMED`.
2. Attribution directe → file « Confirmer » → même état, `source: 'direct_reception'`.
3. Un tiers : pas de bouton.
4. `grep "assignmentStatus: 'CONFIRMED'" src/features` vide.

### Relevé d'application (04/09/2026)

**V1, V3, V4 passent.** V1 vérifié à l'écriture : `{"appro":"Completed","eq":{"a":"CONFIRMED","by":"4"},"confirmEvents":1,"sources":["approval_workflow"]}`.

**Écart trouvé en chemin, et corrigé.** Le bouton n'apparaissait **jamais** au bénéficiaire : dans `primaryAction`, la branche « non-gestionnaire » retournait « Déclarer un incident / Restituer » **avant** le test de réception. C'est la moitié UI du défaut que le lot corrige côté écriture — le lot ne la nommait pas. La branche de réception est remontée en tête.

**V2 n'est pas éprouvable, et ce n'est pas un manque du code.** L'état qu'elle vise — un objet en `PENDING_DELIVERY` qu'aucune demande ne référence — **ne peut pas exister dans ce produit** : le seul producteur de `PENDING_DELIVERY` est `AssignmentWizardPage`, et il appelle toujours `addApproval` avec `assignedEquipmentId`, y compris pour une attribution directe. La branche `isHolder && !approvalEquipmentIds.has(item.id)` de la file est donc inatteignable aujourd'hui. Le code de S3 est conservé — il est correct et protège une donnée importée — mais il ne se vérifie pas à l'écran.
(Observé au passage, cause non localisée : un objet en `PENDING_DELIVERY` posé à la main sans demande derrière est remis à `Disponible / NONE` en moins d'une seconde au rechargement.)

**S4 est sans objet.** `DashboardPage` n'appelle `updateEquipment` nulle part et dérive ses réceptions **uniquement** des approbations : sa confirmation passait déjà par `updateApproval`, le chemin synchronisé. Le défaut que S4 décrit n'existe pas ici.
