import { mockAllEquipment, mockAllUsersExtended } from '../data/mockData';
import { firestore } from './firebase';

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
/**
 * **Un magasin réel rend le réamorçage caduc.**
 *
 * Le jeu de démonstration existe pour qu'une application sans backend soit utilisable :
 * une liste vidée se re-sème, un élément supprimé revient. Branché sur Firestore, ce
 * contrat devient nuisible — les quatorze actifs et les neuf demandes de démonstration
 * **reviennent à chaque chargement** et se mêlent aux 243 objets de Neemba Togo, quoi
 * qu'on nettoie dans la base. Relevé le 06/09 : nettoyer Firestore n'y suffisait pas,
 * puisque la réinjection est locale.
 *
 * Dès qu'un magasin distant est configuré, la vérité vient de lui. Le bypass de
 * développement reste, pour tester les listes vides sans backend.
 */
export const DEMO_RESEED_DISABLED =
    Boolean(firestore) ||
    (import.meta.env.DEV && import.meta.env.VITE_DISABLE_DEMO_RESEED === 'true');
