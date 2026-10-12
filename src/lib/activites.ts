import { firestore } from './firebase';
import { ecouterEcritures, ecouterLesDocumentsEcrits } from './firestorePersistence';

/**
 * **Ce qui dure, pendant qu'on continue ailleurs** (11/10) : l'activité que l'îlot montre.
 *
 * Un import de trois cents lignes entre dans l'application d'un coup, mais part vers la base
 * par lots : pendant ce temps, rien ne disait où il en était, et l'on pouvait fermer
 * l'onglet avant la fin. L'envoi se suit maintenant ici, document confirmé après document
 * confirmé, quelle que soit la page où l'on est allé.
 *
 * Une activité à la fois : la dernière annoncée. Elle se termine quand la base a répondu
 * pour chaque document, ou quand il n'y a plus rien en attente ; elle reste alors un instant
 * (`faite`), puis s'efface.
 */
export interface Activite {
    id: number;
    /** Ce qui est en cours : « Import ». */
    titre: string;
    /** Sur quoi : le nom du fichier. */
    detail?: string;
    /** Les documents que la base a confirmés. */
    fait: number;
    total: number;
    /** Les lignes qui n'entrent pas : refusées à la lecture du fichier, ou par la base. */
    refusees: number;
    etat: 'en cours' | 'faite';
}

/** Le temps pendant lequel une activité finie reste dite. */
const ACCUSE_MS = 2200;
/** Sans rien en attente au bout de ce temps, il n'y avait rien à envoyer. */
const GARDE_MS = 2500;
/** La file vide depuis ce temps : tout est parti. */
const FILE_VIDE_MS = 800;

let courante: Activite | null = null;
let numero = 0;
const abonnes = new Set<() => void>();
const publier = () => abonnes.forEach((abonne) => abonne());

export const ecouterLActivite = (abonne: () => void): (() => void) => {
    abonnes.add(abonne);
    return () => {
        abonnes.delete(abonne);
    };
};
export const lireLActivite = (): Activite | null => courante;

interface Envoi {
    titre: string;
    detail?: string;
    /** La collection dont on compte les documents confirmés. */
    collection: string;
    total: number;
    /** Les lignes déjà refusées à la lecture du fichier. */
    refusees?: number;
}

/**
 * Suit l'envoi de `total` documents d'une collection vers la base. À appeler quand ils
 * viennent d'entrer dans l'application. Sans base (mode de démonstration), il n'y a rien à
 * suivre.
 */
export const suivreUnEnvoi = ({ titre, detail, collection, total, refusees = 0 }: Envoi) => {
    if (!firestore || total <= 0) return;
    numero += 1;
    const id = numero;
    courante = { id, titre, detail, fait: 0, total, refusees, etat: 'en cours' };
    publier();

    let refusDeLaBase = 0;
    let vuEnAttente = false;
    let fileVide: ReturnType<typeof setTimeout> | undefined;
    const poser = (changement: Partial<Activite>) => {
        if (courante?.id !== id) return;
        courante = { ...courante, ...changement };
        publier();
    };
    const arreter = () => {
        arreterLesDocuments();
        arreterLesEcritures();
        clearTimeout(garde);
        clearTimeout(fileVide);
    };
    const finir = () => {
        if (courante?.id !== id || courante.etat === 'faite') return;
        arreter();
        poser({ etat: 'faite' });
        setTimeout(() => {
            if (courante?.id === id) {
                courante = null;
                publier();
            }
        }, ACCUSE_MS);
    };
    /** Rien n'est jamais parti : l'activité s'efface sans accusé. */
    const abandonner = () => {
        arreter();
        if (courante?.id === id) {
            courante = null;
            publier();
        }
    };

    const arreterLesDocuments = ecouterLesDocumentsEcrits((nom, confirmes, refuses) => {
        if (nom !== collection || courante?.id !== id) return;
        refusDeLaBase += refuses;
        const fait = Math.min(total, courante.fait + confirmes);
        poser({ fait, refusees: refusees + refusDeLaBase });
        if (fait + refusDeLaBase >= total) finir();
    });
    const arreterLesEcritures = ecouterEcritures(({ enAttente }) => {
        clearTimeout(fileVide);
        if (enAttente > 0) vuEnAttente = true;
        else if (vuEnAttente) fileVide = setTimeout(finir, FILE_VIDE_MS);
    });
    const garde = setTimeout(() => {
        if (!vuEnAttente) abandonner();
    }, GARDE_MS);
};
