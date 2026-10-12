import { useSyncExternalStore } from 'react';

/**
 * **Ce dont une personne veut être avertie, sur cet appareil** (10/10).
 *
 * Paramètres portait une rangée « Notifications · Réceptions, relances » qui ne s'ouvrait
 * pas : le produit avertissait déjà (bandeau, son, notification du système) sans qu'on puisse
 * rien régler. Les préférences sont **par personne et par appareil** — un téléphone qu'on
 * garde en poche et un poste de bureau ne se règlent pas pareil — et vivent donc ici, dans le
 * navigateur, sous l'identifiant de la personne ; elles ne voyagent pas avec le compte.
 */
export interface PreferencesDAvis {
    /** Une tâche entre dans « À faire ». */
    taches: boolean;
    /** Une demande suivie change de main. */
    avancees: boolean;
    /** Une demande suivie aboutit, est refusée ou annulée. */
    clotures: boolean;
    son: boolean;
    vibration: boolean;
    /** La notification du système, quand l'application n'est pas sous les yeux. */
    systeme: boolean;
}

export const PREFERENCES_D_AVIS_PAR_DEFAUT: PreferencesDAvis = {
    taches: true,
    avancees: true,
    clotures: true,
    son: true,
    vibration: true,
    systeme: true,
};

const cle = (userId: string) => `tracker.avis.${userId}`;
const CHANGEMENT = 'tracker:preferences-d-avis';

/* Une lecture par identifiant, gardée : `useSyncExternalStore` veut la même référence tant
   que rien n'a changé. */
const lues = new Map<string, { brut: string | null; valeur: PreferencesDAvis }>();

export const lireLesPreferencesDAvis = (userId: string | undefined): PreferencesDAvis => {
    if (!userId) return PREFERENCES_D_AVIS_PAR_DEFAUT;
    let brut: string | null = null;
    try {
        brut = localStorage.getItem(cle(userId));
    } catch {
        /* Navigation privée : les préférences par défaut. */
    }
    const connue = lues.get(userId);
    if (connue && connue.brut === brut) return connue.valeur;
    let valeur = PREFERENCES_D_AVIS_PAR_DEFAUT;
    if (brut) {
        try {
            const lu = JSON.parse(brut) as Partial<PreferencesDAvis>;
            valeur = { ...PREFERENCES_D_AVIS_PAR_DEFAUT };
            (Object.keys(PREFERENCES_D_AVIS_PAR_DEFAUT) as (keyof PreferencesDAvis)[]).forEach(
                (nom) => {
                    if (typeof lu[nom] === 'boolean') valeur[nom] = lu[nom];
                },
            );
        } catch {
            /* Une valeur illisible vaut l'absence de valeur. */
        }
    }
    lues.set(userId, { brut, valeur });
    return valeur;
};

export const ecrireLesPreferencesDAvis = (userId: string, valeur: PreferencesDAvis) => {
    try {
        localStorage.setItem(cle(userId), JSON.stringify(valeur));
    } catch {
        /* Navigation privée : le réglage tient jusqu'à la fermeture de l'onglet, pas au-delà. */
        lues.set(userId, { brut: null, valeur });
    }
    window.dispatchEvent(new Event(CHANGEMENT));
};

const sAbonner = (prevenir: () => void) => {
    window.addEventListener(CHANGEMENT, prevenir);
    window.addEventListener('storage', prevenir);
    return () => {
        window.removeEventListener(CHANGEMENT, prevenir);
        window.removeEventListener('storage', prevenir);
    };
};

/** Les préférences de la personne, relues dès qu'elles changent — ici ou dans un autre onglet. */
export const usePreferencesDAvis = (
    userId: string | undefined,
): [PreferencesDAvis, (patch: Partial<PreferencesDAvis>) => void] => {
    const valeur = useSyncExternalStore(
        sAbonner,
        () => lireLesPreferencesDAvis(userId),
        () => PREFERENCES_D_AVIS_PAR_DEFAUT,
    );
    const regler = (patch: Partial<PreferencesDAvis>) => {
        if (userId) ecrireLesPreferencesDAvis(userId, { ...valeur, ...patch });
    };
    return [valeur, regler];
};

/* ------------------------------------------------------------------------ l'essai */

const ESSAI = 'tracker:avis-essai';

/** Demander un avis d'essai : `AvisDesTaches` le montre comme il montrerait une tâche. */
export const essayerLAvis = () => window.dispatchEvent(new Event(ESSAI));

export const ecouterLEssai = (jouer: () => void) => {
    window.addEventListener(ESSAI, jouer);
    return () => window.removeEventListener(ESSAI, jouer);
};
