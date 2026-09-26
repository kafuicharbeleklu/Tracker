import { Handshake, User as UserIcon } from '@phosphor-icons/react';

import type { TrailStep } from '../../../components/ui/HandoverTrail';
import { getCategoryLabel } from '../../../constants/glossary';
import { formatDate } from '../../../lib/financial';
import { approvalRequiresManagerGate } from '../../../lib/businessRules';
import type { Approval, HistoryEvent, User } from '../../../types';

interface ParcoursParams {
    demande: Approval;
    /** La personne qui lit est le manager du bénéficiaire. */
    estLeManager: boolean;
    /** La personne qui lit est le bénéficiaire. */
    estLeBeneficiaire: boolean;
    /** Le nom du manager qui valide, quand on le connaît — « Jane Manager valide ». */
    nomDuManager?: string;
}

/**
 * **Le fil des trois étapes d'une demande** — le manager valide, l'informatique remet, le
 * bénéficiaire confirme (06.5). Le fil dit où l'on en est, **et où le parcours s'est
 * arrêté** quand il s'arrête : les étapes qui suivent un refus n'ont pas eu lieu.
 *
 * La première est **acquise sans attente** quand le demandeur est lui-même le manager du
 * bénéficiaire : son dépôt vaut validation. Partagé par l'écran de la demande et le
 * panneau de décision de la file (26/09) : deux lectures du même parcours ne doivent pas
 * pouvoir diverger.
 */
export const parcoursDeLaDemande = ({
    demande,
    estLeManager,
    estLeBeneficiaire,
    nomDuManager,
}: ParcoursParams): TrailStep[] => {
    const validationAcquise = demande.status !== 'WAITING_MANAGER_APPROVAL';
    const refusee = demande.status === 'Rejected';
    const annulee = demande.status === 'Cancelled';
    const remise = ['PENDING_DELIVERY', 'Completed'].includes(demande.status);
    const confirmee = demande.status === 'Completed';
    const arretee = refusee || annulee;

    const premiere: TrailStep = arretee
        ? {
              state: 'fail',
              title: refusee ? 'Refusée' : 'Retirée par le demandeur',
              detail: demande.decisionNote
                  ? `${demande.decisionNote.actorName} · ${formatDate(demande.decisionNote.at)}`
                  : undefined,
          }
        : validationAcquise
          ? {
                state: 'done',
                title: demande.isDelegated ? 'Validation acquise' : 'Validée',
                detail: demande.isDelegated
                    ? 'le demandeur est le manager · dépôt signé'
                    : `déposée le ${formatDate(demande.createdAt)}`,
            }
          : {
                state: 'late',
                title: estLeManager ? 'Vous validez' : `${nomDuManager ?? 'Le manager'} valide`,
                detail: `déposée le ${formatDate(demande.createdAt)}`,
            };

    return [
        premiere,
        {
            state: arretee ? 'wait' : remise ? 'done' : validationAcquise ? 'late' : 'wait',
            glyph: Handshake,
            title: 'L’informatique remet',
            detail: arretee
                ? 'n’a pas eu lieu'
                : remise
                  ? demande.assignedEquipmentName
                  : demande.status === 'WAITING_DOTATION_APPROVAL'
                    ? `${demande.assignedEquipmentName ?? 'unité proposée'} · dotation à valider`
                    : `choisit ${getCategoryLabel(demande.equipmentCategory).toLowerCase()}`,
        },
        {
            state: arretee ? 'wait' : confirmee ? 'done' : remise ? 'late' : 'wait',
            glyph: UserIcon,
            title: `${estLeBeneficiaire ? 'Vous confirmez' : `${demande.beneficiaryName.split(' ')[0]} confirme`} la réception`,
            detail: arretee ? 'n’a pas eu lieu' : undefined,
        },
    ];
};

/** Une étape de la frise du panneau de décision. */
export interface EtapeDeLaFrise {
    texte: string;
    etat: 'franchie' | 'ici' | 'avenir' | 'arret';
}

const RANG: Partial<Record<Approval['status'], number>> = {
    WAITING_MANAGER_APPROVAL: 0,
    WAITING_IT_PROCESSING: 1,
    WAITING_DOTATION_APPROVAL: 2,
    PENDING_DELIVERY: 3,
    Completed: 4,
};

/** « 25/09, 09:12 » — l'année seulement quand ce n'est pas celle en cours. */
const quand = (iso?: string): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const jour = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
    });
    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${jour}, ${heure}`;
};

const depuis = (iso?: string): string => {
    const at = iso ? new Date(iso).getTime() : Number.NaN;
    if (Number.isNaN(at)) return '';
    const jours = Math.max(0, Math.floor((Date.now() - at) / 86_400_000));
    return jours === 0 ? 'depuis aujourd’hui' : `depuis ${jours} j`;
};

interface FriseParams {
    demande: Approval;
    users: User[];
    /** Le journal : chaque transition d'une demande y a son auteur et son heure. */
    evenements: readonly HistoryEvent[];
    nomDuManager?: string;
}

/**
 * **La frise du parcours** (26/09) — la lecture courte du panneau de décision de Tâches :
 * *« Demandée par Ethan Employé — 25/09, 09:12 · Validée par Jane Manager — 25/09, 11:40 ·
 * À l'informatique depuis 1 j — remise à faire · Réception par Ethan Employé »*.
 *
 * Qui et quand viennent **du journal** (`APPROVAL`, `metadata.to`) : une transition sans
 * trace (une demande d'avant le journal) se dit sans auteur ni heure, jamais devinée.
 */
export const etapesDeLaFrise = ({
    demande,
    users,
    evenements,
    nomDuManager,
}: FriseParams): EtapeDeLaFrise[] => {
    const traces = evenements.filter(
        (event) => event.targetType === 'APPROVAL' && event.targetId === demande.id,
    );
    const trace = (vers: Approval['status'], depuisStatut?: Approval['status']) =>
        [...traces]
            .reverse()
            .find(
                (event) =>
                    event.metadata?.to === vers &&
                    (!depuisStatut || event.metadata?.from === depuisStatut),
            );
    const signe = (verbe: string, event?: HistoryEvent, qui?: string) => {
        const auteur = event?.actorName ?? qui;
        const heure = quand(event?.timestamp);
        return `${verbe}${auteur ? ` par ${auteur}` : ''}${heure ? ` — ${heure}` : ''}`;
    };

    const close = demande.status === 'Rejected' || demande.status === 'Cancelled';
    const cloture = close ? trace(demande.status) : undefined;
    /* Où le parcours s'est arrêté : l'étape d'où la demande a été close. */
    const rangDArret = close
        ? (RANG[cloture?.metadata?.from as Approval['status']] ??
          (demande.decisionNote?.kind === 'MANAGER_REJECT'
              ? 0
              : demande.decisionNote?.kind === 'DELIVERY_REJECT'
                ? 3
                : 1))
        : null;
    const rang = rangDArret ?? RANG[demande.status] ?? 0;
    const manager = nomDuManager ?? 'son manager';
    /* Sans trace au journal, on sait encore s'il y avait un manager à passer — pas qui. */
    const passeParLeManager = approvalRequiresManagerGate(demande, users);

    const etapes: EtapeDeLaFrise[] = [
        {
            texte: `Demandée par ${demande.requesterName}${quand(demande.createdAt) ? ` — ${quand(demande.createdAt)}` : ''}`,
            etat: 'franchie',
        },
    ];

    const arret = (): EtapeDeLaFrise => ({
        texte: signe(
            demande.status === 'Rejected' ? 'Refusée' : 'Annulée',
            cloture,
            demande.decisionNote?.actorName,
        ),
        etat: 'arret',
    });

    // La validation du manager — ou acquise au dépôt, quand il n'y en a pas.
    const validee = trace('WAITING_IT_PROCESSING', 'WAITING_MANAGER_APPROVAL');
    if (rang === 0) {
        etapes.push(
            rangDArret === 0
                ? arret()
                : {
                      texte: `Chez ${manager} ${depuis(demande.updatedAt)} — validation à faire`,
                      etat: 'ici',
                  },
        );
    } else {
        etapes.push({
            texte: validee
                ? signe('Validée', validee)
                : passeParLeManager
                  ? 'Validée'
                  : 'Validation acquise au dépôt',
            etat: 'franchie',
        });
    }
    if (rangDArret === 0) return etapes;

    // L'informatique choisit, remet ; la dotation se valide entre les deux.
    if (rang < 1) etapes.push({ texte: 'Remise par l’informatique', etat: 'avenir' });
    else if (rang === 1)
        etapes.push(
            rangDArret === 1
                ? arret()
                : {
                      texte: `À l’informatique ${depuis(demande.updatedAt)} — remise à faire`,
                      etat: 'ici',
                  },
        );
    else if (rang === 2) {
        etapes.push({
            texte: `${signe('Unité proposée', trace('WAITING_DOTATION_APPROVAL'))}${demande.assignedEquipmentName ? ` : ${demande.assignedEquipmentName}` : ''}`,
            etat: 'franchie',
        });
        etapes.push(
            rangDArret === 2
                ? arret()
                : {
                      texte: `Chez ${manager} ${depuis(demande.updatedAt)} — dotation à valider`,
                      etat: 'ici',
                  },
        );
    } else {
        etapes.push({
            texte: `${signe('Remise', trace('PENDING_DELIVERY'))}${demande.assignedEquipmentName ? ` : ${demande.assignedEquipmentName}` : ''}`,
            etat: 'franchie',
        });
    }
    if (rangDArret === 1 || rangDArret === 2) return etapes;

    // La réception du bénéficiaire.
    if (rang < 3)
        etapes.push({ texte: `Réception par ${demande.beneficiaryName}`, etat: 'avenir' });
    else if (rang === 3)
        etapes.push(
            rangDArret === 3
                ? arret()
                : {
                      texte: `Chez ${demande.beneficiaryName} ${depuis(demande.updatedAt)} — réception à confirmer`,
                      etat: 'ici',
                  },
        );
    else
        etapes.push({
            texte: signe('Reçue', trace('Completed'), demande.beneficiaryName),
            etat: 'franchie',
        });

    return etapes;
};
