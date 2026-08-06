/**
 * Vocabulaire partagé de l'audit physique par service.
 *
 * Extrait de `PhysicalAuditView` pour être consommé AUSSI par la vue compacte
 * (`AuditOverviewMobile`) sans créer d'import circulaire entre les deux.
 * Aucun changement de comportement : mêmes types, mêmes fonctions.
 */

export interface ServiceAuditRow {
    country: string;
    site: string;
    service: string;
    expected: number;
    found: number;
    missing: number;
    exceptions: number;
    progress: number;
    lastScanAt: string | null;
    status: 'A lancer' | 'En cours' | 'Complet' | 'A planifier';
}

/** Valeur sentinelle « aucun filtre » des selects de périmètre. */
export const ALL_VALUE = '__all__';

export const buildRowKey = (row: Pick<ServiceAuditRow, 'country' | 'site' | 'service'>): string =>
    `${row.country}::${row.site}::${row.service}`;

export const formatLastScan = (value: string | null): string => {
    if (!value) return 'Jamais';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Jamais';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/** Libellé affiché d'un statut de campagne (les valeurs internes sont sans accent). */
export const STATUS_LABELS: Record<ServiceAuditRow['status'], string> = {
    'A lancer': 'À lancer',
    'En cours': 'En cours',
    Complet: 'Complet',
    'A planifier': 'À planifier',
};
