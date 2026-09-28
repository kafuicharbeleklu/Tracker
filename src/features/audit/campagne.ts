import type { PerimetreDeCampagne } from '../../context/DataContext';
import type { HistoryEvent } from '../../types';
import { moisDepuis } from './placeAudit';

/**
 * **La campagne d'inventaire, lue dans le journal** (27/09).
 *
 * Une campagne n'avait pas d'existence propre : ses comptages s'écrivaient au journal
 * (`audit_scan`), mais sa clôture ne s'écrivait nulle part — un rechargement la rouvrait
 * « en cours », personne ne savait qui l'avait close, et aucun responsable ne la relisait.
 * Ses étapes s'écrivent maintenant au journal, comme ses comptages, et son état se lit en
 * rejouant les étapes de son périmètre dans la périodicité d'inventaire :
 *
 * - `audit_cloture` — l'opérateur clôture : le relevé est figé, il attend un responsable ;
 * - `audit_validation` — le responsable valide : les manquants passent manquants ;
 * - `audit_renvoi` — le responsable renvoie, avec un motif : le comptage reprend ;
 * - `audit_abandon`, `audit_relance` — on repart de zéro : les comptages d'avant ne
 *   comptent plus pour la campagne.
 */

export type EtatDeCampagne = 'en_cours' | 'cloturee' | 'validee';

export interface Campagne {
    etat: EtatDeCampagne;
    /** Les comptages antérieurs à cet instant n'appartiennent pas à la campagne. */
    depuis: string | null;
    cloture?: HistoryEvent;
    validation?: HistoryEvent;
    /** Le dernier renvoi, tant que la campagne qu'il a rouverte n'est pas reclôturée. */
    renvoi?: HistoryEvent;
}

const ETAPES = new Set([
    'audit_cloture',
    'audit_validation',
    'audit_renvoi',
    'audit_abandon',
    'audit_relance',
]);

const texte = (valeur: unknown) => (typeof valeur === 'string' ? valeur : '').trim().toLowerCase();

/** L'étape porte-t-elle exactement sur ce périmètre — le site entier n'est pas un local ? */
const surCePerimetre = (event: HistoryEvent, scope: PerimetreDeCampagne): boolean => {
    const m = event.metadata;
    if (!m) return false;
    if (texte(m.scopeCountry) !== texte(scope.country)) return false;
    if (texte(m.scopeSite) !== texte(scope.site)) return false;
    if (Boolean(m.horsLocal) !== Boolean(scope.horsLocal)) return false;
    return texte(m.scopeLocal) === texte(scope.horsLocal ? '' : scope.local);
};

export const lireLaCampagne = (
    events: readonly HistoryEvent[],
    scope: PerimetreDeCampagne,
    periodeMois: number,
): Campagne => {
    const etapes = events
        .filter((event) => {
            const source = event.metadata?.source;
            if (typeof source !== 'string' || !ETAPES.has(source)) return false;
            if (!surCePerimetre(event, scope)) return false;
            const mois = moisDepuis(event.timestamp);
            return mois !== null && mois < periodeMois;
        })
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const campagne: Campagne = { etat: 'en_cours', depuis: null };
    for (const event of etapes) {
        switch (event.metadata?.source) {
            case 'audit_abandon':
            case 'audit_relance':
                campagne.etat = 'en_cours';
                campagne.depuis = event.timestamp;
                campagne.cloture = undefined;
                campagne.validation = undefined;
                campagne.renvoi = undefined;
                break;
            case 'audit_cloture':
                campagne.etat = 'cloturee';
                campagne.cloture = event;
                campagne.renvoi = undefined;
                break;
            case 'audit_renvoi':
                if (campagne.etat === 'cloturee') {
                    campagne.etat = 'en_cours';
                    campagne.renvoi = event;
                    campagne.cloture = undefined;
                }
                break;
            case 'audit_validation':
                if (campagne.etat === 'cloturee') {
                    campagne.etat = 'validee';
                    campagne.validation = event;
                }
                break;
        }
    }
    return campagne;
};

/** Une liste d'identifiants gardée dans les métadonnées d'une étape. */
export const identifiantsDe = (event: HistoryEvent | undefined, cle: string): string[] | null => {
    const valeur = event?.metadata?.[cle];
    return Array.isArray(valeur)
        ? valeur.filter((id): id is string => typeof id === 'string')
        : null;
};
