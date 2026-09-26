# Visual Triage - 2026-02-20

## Contexte
Le rapport `docs/md3-visual-regression-results-2026-02-20.md` retourne `24 changed / 24`.

## Ce qui a ete corrige avant triage
- Les scripts QA etaient sur d'anciens selecteurs/login (`neemba.com`) et ne representaient pas toujours le parcours reel.
- Mise a jour des scripts:
  - `scripts/run-md3-a11y-automation.mjs`
  - `scripts/run-md3-multidevice-audit.mjs`
  - `scripts/run-md3-visual-regression.mjs`
- Verification tactile post-correction: `qa:devices:auto` = 60 pass / 0 fail.

## Statut triage visuel
- Etat: **en attente de validation humaine**.
- Raison: l'outil compare des screenshots pixel-perfect; les changements recents UI/UX peuvent etre intentionnels mais ne doivent pas etre auto-acceptes.

## Procedure recommandee
1. Ouvrir les paires baseline/current sous `docs/md3-visual-baseline/` et `docs/md3-visual-current/2026-02-20/`.
2. Marquer chaque checkpoint `intentional` ou `bug`.
3. Corriger les bugs retenus.
4. Exécuter `npm run qa:visual:update` uniquement pour les changements intentionnels valides.

## Checkpoints concernes
- compact: `login`, `settings`, `assignment_wizard`, `return_wizard`, `add_equipment`, `user_details`, `audit_details`, `finance`
- medium: `login`, `settings`, `assignment_wizard`, `return_wizard`, `add_equipment`, `user_details`, `audit_details`, `finance`
- expanded: `login`, `settings`, `assignment_wizard`, `return_wizard`, `add_equipment`, `user_details`, `audit_details`, `finance`
