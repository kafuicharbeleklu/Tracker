import { construireJeu, PIN_DE_SIMULATION } from '../../scripts/simulation/jeu';
import { CLES_DES_DONNEES, CLES_DES_FINANCES } from './clesDeStockage';
import { CODE_DE_DEMONSTRATION } from './demonstration';

/**
 * **Verser la simulation dans le navigateur du visiteur** (13/10) : une fois, avant que
 * l'application ne lise ses données. Chargé à la demande par `index.tsx`, et seulement dans
 * la démonstration du site public (voir `lib/demonstration`) : le générateur ne pèse pas sur
 * les autres constructions.
 *
 * Le jeu est daté du jour où il est versé : les âges (« en retard », « cette semaine »)
 * vivent, puis vieillissent avec le navigateur. Ce que le visiteur fait ensuite reste chez
 * lui. Changer `VERSION` reverse le jeu dans les navigateurs déjà venus.
 */
const MARQUE = 'tracker_demonstration';
const VERSION = 'simulation-2';

/** Les collections du jeu, et la clé où l'application les lit. */
const COLLECTIONS: Record<string, string> = {
    users: CLES_DES_DONNEES.users.current,
    equipment: CLES_DES_DONNEES.equipment.current,
    approvals: CLES_DES_DONNEES.approvals.current,
    events: CLES_DES_DONNEES.events.current,
    detectedDevices: CLES_DES_DONNEES.detectedDevices.current,
    categories: CLES_DES_DONNEES.categories.current,
    models: CLES_DES_DONNEES.models.current,
    financeExpenses: CLES_DES_FINANCES.financeExpenses.current,
    financeBudgets: CLES_DES_FINANCES.financeBudgets.current,
};

/** Les documents isolés de `meta`. */
const DOCUMENTS: Record<string, string> = {
    locations: CLES_DES_DONNEES.locations.current,
    serviceManagers: CLES_DES_DONNEES.serviceManagers.current,
    settings: CLES_DES_DONNEES.settings.current,
};

/** Ce que le jeu ne remplit pas repart des valeurs du code. */
const A_REMETTRE = [
    CLES_DES_DONNEES.rbacRoles.current,
    CLES_DES_DONNEES.rbacGroups.current,
    CLES_DES_DONNEES.rbacAssignments.current,
    CLES_DES_DONNEES.rbacWorkflows.current,
];

export const semerLaDemonstration = (): void => {
    try {
        if (localStorage.getItem(MARQUE) === VERSION) return;
        if (PIN_DE_SIMULATION !== CODE_DE_DEMONSTRATION) {
            console.warn('[démonstration] le code dit au visiteur n’est plus celui du jeu.');
        }
        const jeu = construireJeu({ maintenant: new Date() });
        for (const [collection, cle] of Object.entries(COLLECTIONS)) {
            const documents = (jeu[collection] ?? []).map(({ id, data }) => ({ ...data, id }));
            localStorage.setItem(cle, JSON.stringify(documents));
        }
        for (const { id, data } of jeu.meta ?? []) {
            const cle = DOCUMENTS[id];
            if (cle) localStorage.setItem(cle, JSON.stringify(data));
        }
        A_REMETTRE.forEach((cle) => localStorage.removeItem(cle));
        localStorage.setItem(MARQUE, VERSION);
    } catch (erreur) {
        /* Stockage refusé (navigation privée, place manquante) : la démonstration garde le
           petit jeu intégré. */
        console.warn('[démonstration] la simulation n’a pas pu être versée.', erreur);
    }
};
