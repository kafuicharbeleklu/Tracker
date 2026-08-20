/**
 * Utilitaires de sécurité pour Tracker
 */

/**
 * Valide le code PIN administrateur.
 * En production, cette fonction appellerait une API pour vérifier le hash.
 */
// PIN de step-up administrateur.
// Configurable via VITE_ADMIN_PIN ; fallback dev uniquement.
// Cible : vérification côté backend (hash) — cf. docs/AUDIT_MECANISMES_SIMULES.md (E-A1).
//
// **Quatre chiffres** depuis l'alignement sur REGLES-TRANSVERSES.md §2.1 : le pavé de
// SecurityGate est passé de six cases à quatre, et un code de six ne pouvait plus s'y
// saisir. La valeur reste volontairement triviale — c'est un contrôle de démonstration,
// vérifié côté client et écrit en clair dans la source livrée : la faire ressembler à un
// secret ferait croire qu'elle en est un. Le risque est consigné, pas masqué.
const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN ?? '1234').toString();

export function validateAdminPIN(pin: string): boolean {
  return pin === ADMIN_PIN;
}

/** Issue du facteur d'authentification (le PIN lui-même). */
export type SecurityFactorOutcome = 'SUCCESS' | 'FAILED' | 'BLOCKED';
/** Issue de l'action protégée, consignée APRÈS son dénouement. */
export type SecurityActionOutcome = 'EXECUTED' | 'DENIED' | 'NOT_RUN';

/**
 * Log une action sécurisée dans le journal d'audit global.
 * Deux faits distincts : `factorOutcome` (le PIN) et `actionOutcome` (l'action protégée) —
 * un PIN valide suivi d'un refus métier donne SUCCESS + DENIED, pas un faux « SUCCESS ».
 */
export function logSecurityAction(
  action: string,
  userId: string,
  entityId: string,
  validationMethod: 'PIN' | 'PIN_SIGNATURE',
  factorOutcome: SecurityFactorOutcome,
  actionOutcome: SecurityActionOutcome
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[SECURITY AUDIT][${timestamp}] User: ${userId} | Action: ${action} | Entity: ${entityId} | Method: ${validationMethod} | Factor: ${factorOutcome} | Outcome: ${actionOutcome}`;

  if (factorOutcome === 'FAILED' || factorOutcome === 'BLOCKED' || actionOutcome === 'DENIED') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  // En production : appel API vers la table d'audit
}

