/**
 * Map centrale catégorie d'équipement → icône Material Symbols (audit X10).
 * Source unique — ne plus définir de map locale ni de fallback trompeur
 * (ex. tout afficher en « monitor ») dans les composants.
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
    laptop: 'laptop_mac',
    monitor: 'monitor',
    keyboard: 'keyboard',
    mouse: 'mouse',
    headphones: 'headphones',
    smartphone: 'smartphone',
    phone: 'smartphone',
    tablet: 'tablet_mac',
    printer: 'print',
    server: 'dns',
};

/** Icône neutre quand la catégorie est inconnue — préférable à une icône fausse. */
export const UNKNOWN_CATEGORY_ICON = 'devices_other';

export const getCategoryIcon = (category?: string | null): string =>
    CATEGORY_ICON_MAP[(category || '').trim().toLowerCase()] ?? UNKNOWN_CATEGORY_ICON;
