/**
 * **Vocabulaire de l'inventaire physique — par lieu, pas par service.**
 *
 * *« Un comptage physique compte ce qui est dans un lieu : le périmètre d'une campagne
 * est un site, ou un local quand le site en a. Le service n'est pas un lieu et ne borne
 * plus rien. »* (16.1, passe du 03/09.)
 *
 * L'écran groupait par service. Les objets, eux, portent un **département** là où le
 * référentiel porte un **service** : aucune rangée ne se formait, et la vue s'ouvrait
 * sur « 0 service · 0 attendu · aucun service ne correspond ». Un inventaire physique
 * qui n'affiche aucun lieu ne peut pas être lancé.
 *
 * Deux niveaux, une seule forme de rangée : un **site** tant qu'aucun n'est ouvert,
 * puis ses **locaux**. Un site sans local saute le second niveau et se lance depuis le
 * premier.
 */

export interface PlaceAuditRow {
    country: string;
    site: string;
    /** Le local, au second niveau. Absent : la rangée **est** le site. */
    local?: string;
    /**
     * **Le site hors de ses locaux** — la rangée que le tableur impose et que la planche
     * n'avait pas à dessiner. Sur la fixture de 16.1, chaque objet est dans une pièce ;
     * dans le parc réel, **211 des 243** n'en portent aucune. Sans cette rangée, ouvrir
     * Lomé Siège afficherait neuf locaux totalisant 32 actifs, et les 211 autres
     * disparaîtraient de l'inventaire physique — un périmètre qu'aucun écran ne
     * permettrait plus de compter.
     */
    horsLocal?: boolean;
    /** Combien de locaux ce site compte — dit dans la sous-ligne du premier niveau. */
    localCount?: number;
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

export const buildRowKey = (
    row: Pick<PlaceAuditRow, 'country' | 'site' | 'local' | 'horsLocal'>,
): string => `${row.country}::${row.site}::${row.local ?? ''}::${row.horsLocal ? 'hors' : ''}`;

/** Le nom que porte la rangée : le local quand il y en a un, sinon le site. */
export const placeLabel = (row: PlaceAuditRow): string => row.local ?? row.site;

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

/**
 * « il y a 12 min » — dans une campagne, ce qui compte est **quand** le lieu a été vu,
 * pas la date complète. C'est ce que `.pk` porte à droite du héro de 16.1
 * (« démarrée il y a 40 min », « terminée il y a 5 min »).
 */
export const formatSince = (value?: string | null): string => {
    if (!value) return '-';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '-';
    const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    return `il y a ${Math.floor(hours / 24)} j`;
};

/** Libellé affiché d'un statut de campagne (les valeurs internes sont sans accent). */
export const STATUS_LABELS: Record<PlaceAuditRow['status'], string> = {
    'A lancer': 'À lancer',
    'En cours': 'En cours',
    Complet: 'Complet',
    'A planifier': 'Rien à inventorier',
};

/**
 * **L'ordre de la liste est l'avancement** — 17.8 le tranche pour 16.1 : *« une campagne
 * d'inventaire a un ordre d'avancement »*, et c'est pourquoi l'écran n'a pas de slot de
 * tri. Ce qui tourne d'abord, puis ce qui n'a jamais été compté, puis ce qui est fini,
 * puis ce qu'il n'y a rien à compter.
 */
const RANG: Record<PlaceAuditRow['status'], number> = {
    'En cours': 0,
    'A lancer': 1,
    Complet: 2,
    'A planifier': 3,
};

export const compareByProgress = (a: PlaceAuditRow, b: PlaceAuditRow): number => {
    const rang = RANG[a.status] - RANG[b.status];
    if (rang !== 0) return rang;
    /* À statut égal, le plus gros périmètre d'abord : c'est celui qui coûte le plus à
       laisser non vérifié. */
    if (a.expected !== b.expected) return b.expected - a.expected;
    return placeLabel(a).localeCompare(placeLabel(b), 'fr');
};
