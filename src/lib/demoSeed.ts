import { mockAllEquipment, mockAllUsersExtended } from '../data/mockData';

/**
 * INV-9 / décision D8 (Option B) — le réamorçage des données de démonstration est
 * ASSUMÉ : les éléments du seed supprimés reviennent au prochain chargement, et une
 * liste vidée est re-semée. Ce module rend ce contrat honnête (toast + mention dans
 * Paramètres) au lieu de le cacher. Couche temporaire : le Chantier A (backend) la remplacera.
 */

const SEED_USER_IDS = new Set(mockAllUsersExtended.map((user) => user.id));
const SEED_EQUIPMENT_IDS = new Set(mockAllEquipment.map((item) => item.id));

export const isDemoSeedUser = (id: string): boolean => SEED_USER_IDS.has(id);
export const isDemoSeedEquipment = (id: string): boolean => SEED_EQUIPMENT_IDS.has(id);

export const DEMO_RESEED_NOTICE =
    'Élément de démonstration : il sera restauré au prochain chargement.';

/**
 * Bypass DEV uniquement (pas d'UI utilisateur) : `VITE_DISABLE_DEMO_RESEED=true`
 * dans `.env.local` désactive le réamorçage — les suppressions survivent au
 * rechargement et `[]` devient un état valide, pour tester les listes vides.
 */
export const DEMO_RESEED_DISABLED =
    import.meta.env.DEV && import.meta.env.VITE_DISABLE_DEMO_RESEED === 'true';
