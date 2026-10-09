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

const AUDIT_SORTIE_KEY = 'audit_sortie_de_campagne';
/** Au-delà, on ne « revient » plus de la campagne : on arrive à l'inventaire. */
const RETOUR_IMMEDIAT_MS = 10_000;

/** La page de campagne note l'instant où on la quitte. */
export const noterSortieDeCampagne = (): void => {
    try {
        sessionStorage.setItem(AUDIT_SORTIE_KEY, String(Date.now()));
    } catch {
        // Ignore storage failures.
    }
};

/**
 * Demander à la vue globale d'ouvrir le choix sur les locaux d'un site — l'accueil, quand le
 * local où l'on comptait est fini : reprendre, c'est alors choisir le suivant.
 */
export const ouvrirLeChoixSur = (scope: AuditScopePreference): void => {
    rememberAuditScope(scope);
    noterSortieDeCampagne();
};

/**
 * **Le site qu'on vient de quitter** (09/10) — quand on arrive de la page de campagne à
 * l'instant, et que la campagne portait sur un local. La vue globale s'en sert pour rouvrir
 * le choix sur les locaux de ce site : compter un site, c'est enchaîner ses locaux, et
 * repasser par le pays puis le site à chaque local coûtait trois gestes. Lecture seule :
 * elle peut être appelée deux fois (mode strict) sans rien changer.
 */
export const siteQuitteALInstant = (): { country: string; site: string } | null => {
    try {
        const sortie = Number(sessionStorage.getItem(AUDIT_SORTIE_KEY));
        if (!sortie || Date.now() - sortie > RETOUR_IMMEDIAT_MS) return null;
        const brut = sessionStorage.getItem(AUDIT_SCOPE_PREF_KEY);
        const scope = brut ? (JSON.parse(brut) as AuditScopePreference) : null;
        if (!scope?.country || !scope.site || (!scope.local && !scope.horsLocal)) return null;
        return { country: scope.country, site: scope.site };
    } catch {
        return null;
    }
};
