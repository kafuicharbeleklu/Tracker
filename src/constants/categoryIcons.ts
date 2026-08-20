import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    DeviceMobile,
    DeviceTablet,
    HardDrives,
    Headphones,
    Key,
    Laptop,
    Monitor,
    Mouse,
    Package,
    Printer,
} from '@phosphor-icons/react';

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

/**
 * La même correspondance en **Phosphor** — la bibliothèque du dessin (règle I1), vers
 * laquelle les écrans portés basculent un à un. Elle vit ici et non dans un écran :
 * la file (08.1) et la campagne d'audit (16.2) en portaient chacune une copie, et deux
 * copies d'une table de correspondance divergent au premier type ajouté.
 *
 * La map Material Symbols au-dessus reste tant que des écrans non portés la consomment.
 * Les deux disparaîtront ensemble le jour où la table de `CORRESPONDANCE-ICONES.md`
 * sera la seule source — elles ne se fusionnent pas avant, sous peine de faire rendre
 * un nom de glyphe Phosphor à un composant Material.
 */
const CATEGORY_GLYPH_MAP: Record<string, PhosphorGlyph> = {
    laptop: Laptop,
    monitor: Monitor,
    screen: Monitor,
    keyboard: Key,
    accessory: Key,
    mouse: Mouse,
    headphones: Headphones,
    headset: Headphones,
    smartphone: DeviceMobile,
    phone: DeviceMobile,
    mobile: DeviceMobile,
    tablet: DeviceTablet,
    printer: Printer,
    server: HardDrives,
};

/** Glyphe de vignette (§2.2) — `Package` quand la catégorie n'est pas connue. */
export const getCategoryGlyph = (category?: string | null): PhosphorGlyph =>
    CATEGORY_GLYPH_MAP[(category || '').trim().toLowerCase()] ?? Package;
