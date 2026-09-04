# Correctifs code — lot 3 : assistant de restitution (planche 06.1, colonne « l'informatique réceptionne et constate »)

**2 septembre 2026.** Zone d'ombre n° 6 de `CARTE_PROJET.md` tranchée : **l'écran fait foi sur ce qu'il promet, la règle fait foi sur ce qu'elle écrit** — on corrige les *valeurs* que l'écran envoie, pas le dictionnaire. Les trois crans de l'écran sont des décisions (« ce que l'objet devient »), pas des degrés d'usure ; ils doivent pointer les entrées de `RETURN_STATUS_BY_CONDITION` qui produisent le statut annoncé.

| Cran affiché | Envoyait | Produisait | Envoie désormais | Produit |
| --- | --- | --- | --- | --- |
| Repart en stock | `Bon` | Disponible ✓ | `Bon` | Disponible |
| À réviser d'abord | `Moyen` | **Disponible** ✗ | `Mauvais` | En réparation |
| Hors service | `Mauvais` | **En réparation** ✗ | `'Hors service'` | Retiré |

`Excellent`, `Moyen`, `Dégradé` restent dans la règle (données héritées, API) sans être sélectionnables : un cran de plus à l'écran serait une nuance que personne ne saurait choisir devant l'objet.

Fichier : `src/features/inventory/pages/ReturnWizardPage.tsx`.

## R1 — les valeurs envoyées

`type ReturnCondition = ReturnInspectionCondition` (le type de la règle, désormais exporté depuis `businessRules.ts`). Le cran « À réviser d'abord » envoie `Mauvais`, le cran « Hors service » envoie `'Hors service'` et annonce « passe « Retiré », l'historique reste » — aucune demande de validation n'est créée par le code, la promesse tombe.

## R2 — la conséquence dite sous le cran

`condition === 'Mauvais'` porte « en réparation » ; `condition === 'Hors service'` porte « passe « Retiré » : il sort des disponibles, son historique et ses attestations restent ».

## R3 — la synthèse

« Statut après confirmation » annonce `Retiré` / `En réparation` / `Disponible` selon le cran, au lieu du couple binaire.

## R4 — le sous-titre lit la donnée

`returnRequestedAt` et le nom du porteur remplacent « Rendu par Karim Diallo, hier à 17:20 ». Sans donnée, la phrase se réduit — elle n'invente pas. Les quatre autres replis `|| 'Karim Diallo'` deviennent `|| 'Vous'` pour l'acteur courant et `|| '—'` pour le porteur.

## Vérification

1. Réceptionner un retour, cran « À réviser d'abord » → fiche de l'objet : « En réparation », `repairStartDate` posé, geste primaire « Clore l'intervention ».
2. Cran « Hors service » → « Retiré » ; la synthèse l'annonçait.
3. Sous-titre : nom du porteur et heure de `returnRequestedAt` ; sans heure, pas d'heure.
4. `grep -n "Karim Diallo" src/` vide.

### Relevé d'application (04/09/2026)

Les quatre points passent, y compris l'écriture réelle vérifiée dans `tracker_equipment` après un parcours complet de l'assistant (attestation par signature incluse) :
`{"status":"En réparation","repairStartDate":true}` puis `{"status":"Retiré"}`. Le sous-titre affiche « Rendu par Jane Manager, le 03/09 17:20 ».
