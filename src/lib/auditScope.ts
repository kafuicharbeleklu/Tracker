/**
 * **Le lieu qu'on s'apprête à compter**, passé d'un écran à l'autre.
 *
 * Le comptage (16.2) ne reçoit pas son périmètre en argument : il le relit. Trois
 * surfaces touchent cette clé — la vue globale de l'inventaire (16.1), le comptage
 * lui-même, et l'accueil quand il **reprend** une campagne en cours (03.1) — dont une
 * hors du domaine `audit`. Elle vit donc ici, et n'est déclarée qu'une fois : une clé
 * de stockage recopiée est une clé qui finit par diverger d'un écran à l'autre.
 */

export const AUDIT_SCOPE_PREF_KEY = 'audit_scope_pref';

export interface AuditScopePreference {
    country?: string;
    site?: string;
    /** Le local, au second niveau ; vide quand la campagne porte tout le site. */
    local?: string;
    /** Le site **moins** ses locaux — la rangée que le parc réel impose. */
    horsLocal?: boolean;
}

/** Retenir le lieu avant d'ouvrir le comptage. Un stockage refusé n'empêche rien. */
export const rememberAuditScope = (scope: AuditScopePreference): void => {
    try {
        sessionStorage.setItem(
            AUDIT_SCOPE_PREF_KEY,
            JSON.stringify({
                country: scope.country ?? '',
                site: scope.site ?? '',
                local: scope.local ?? '',
                horsLocal: Boolean(scope.horsLocal),
            }),
        );
    } catch {
        // Ignore storage failures.
    }
};
