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
const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN ?? '123456').toString();

export function validateAdminPIN(pin: string): boolean {
  return pin === ADMIN_PIN;
}

/**
 * Log une action sécurisée dans le journal d'audit global.
 */
export function logSecurityAction(
  action: string,
  userId: string,
  entityId: string,
  validationMethod: 'PIN' | 'PIN_SIGNATURE',
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED'
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[SECURITY AUDIT][${timestamp}] User: ${userId} | Action: ${action} | Method: ${validationMethod} | Status: ${status}`;
  
  if (status === 'FAILED' || status === 'BLOCKED') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
  
  // En production : appel API vers la table d'audit
}

