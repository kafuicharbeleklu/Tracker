/**
 * Utilitaires de sécurité pour Tracker
 */

/**
 * Valide le code PIN administrateur.
 * En production, cette fonction appellerait une API pour vérifier le hash.
 */
// **Le code administrateur partagé n'existe plus** — lot 28, D4. Un `ADMIN_PIN` unique,
// écrit en clair et connu de toute l'informatique, prouvait seulement que *quelqu'un* de
// l'équipe avait tapé le secret d'équipe : il ne disait pas qui. Les neuf actes de 17.4
// attestent maintenant avec le **code personnel** de celui qui agit (`User.pin`), par le
// bloc 4 de la feuille d'acte — et `SecurityGate`, qui portait ce pavé, est supprimé.
//
// **Six chiffres.** Le registre a tranché deux fois. §2.1 disait « quatre, sans
// exception », et le produit s'y était rangé ; son journal l'a **renégocié le 02/09** :
// « le code PIN passe à six chiffres partout (02.2, 06.2, 07.1, SecurityGate, lot 25).
// Une seule longueur, la nouvelle. » La planche 06.2 du 03/09 dessine six cases et
// titre sa section « Six chiffres ». Le titre de §2.1 n'a pas suivi la renégociation
// que son propre journal enregistre — **à faire corriger dans le registre**, la valeur
// appliquée ici étant la plus récente et la seule que les planches dessinent.
//
// La valeur reste volontairement triviale — c'est un contrôle de démonstration, vérifié
// côté client et écrit en clair dans la source livrée : la faire ressembler à un secret
// ferait croire qu'elle en est un. Le risque est consigné, pas masqué.
/**
 * **La longueur d'un code PIN, nommée une fois.** Le pavé, la remise à zéro, le
 * déclenchement de la vérification et la génération d'un code temporaire en dérivent —
 * elle était écrite en dur à cinq endroits, ce qui est exactement pourquoi elle avait
 * pu diverger sans que personne le voie.
 */
export const PIN_LENGTH = 6;

/**
 * **Trois essais** pour prouver qu'on connaît un code — 06.2, colonne 2. La règle vaut
 * pour l'attestation d'une remise et pour le remplacement de son propre code (07.1) :
 * une seule borne, sinon l'une finirait par diverger de l'autre sans que personne le voie.
 */
export const PIN_MAX_ATTEMPTS = 3;

/*
  **La borne d'un fichier importé n'est pas ici** — lot 28, D6 demandait un
  `MAX_FILE_BYTES` unique ; `lib/fileImport.ts` le porte déjà, et mieux : la valeur est
  **réglable en 14.1** (`settings.maxImportFileMb`), `getImportLimitBytes()` la rend au
  moment de s'en servir, et `formatFileSize` l'écrit comme un refus se lit. La signature
  enregistrée s'y range comme les autres pièces : c'est un fichier, pas un cas.
*/

/**
 * Ce qu'un code PIN ne peut pas être — planche 02.2, écran 3 : *« ni une suite, ni six
 * fois le même chiffre »*. Six chiffres, une suite montante ou descendante refusée,
 * un chiffre répété refusé. L'année de naissance n'est pas vérifiable ici : la phrase
 * de l'écran la déconseille, le code ne la connaît pas.
 */
export const isValidPinFormat = (pin: string): boolean => {
    if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return false;
    if (/^(\d)\1+$/.test(pin)) return false;
    const digits = pin.split('').map(Number);
    const step = digits[1] - digits[0];
    if (Math.abs(step) === 1 && digits.every((d, i) => i === 0 || d - digits[i - 1] === step))
        return false;
    return true;
};

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
    actionOutcome: SecurityActionOutcome,
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
