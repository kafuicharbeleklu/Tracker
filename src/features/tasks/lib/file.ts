import { ClipboardText, Laptop, Wrench, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';
import {
    approvalAttendLActeur,
    canUserActOnApproval,
    getApprovalRejectTarget,
    getAvailableApprovalActions,
    isApprovalActiveStatus,
    quiALaMainSurLaDemande,
} from '../../../lib/businessRules';
import type {
    Approval,
    ApprovalStatus,
    DetectedDevice,
    Equipment,
    User,
    UserRole,
    ViewType,
} from '../../../types';

/**
 * **La file de travail, construite une seule fois** (26/09).
 *
 * Trois surfaces énonçaient ce qui attend la personne connectée : la barre latérale et la
 * barre du bas (un badge), l'accueil (03.1), et la page Tâches (03.3). Elles le calculaient
 * chacune à sa façon — la page mettait « à faire » tout ce que la personne *pouvait* faire,
 * la barre ne comptait ni les remises ni les réparations. Un super administrateur lisait
 * 9 dans la barre et 17 dans l'onglet, et aucun des deux n'était juste : 8 tâches lui
 * revenaient. La file est désormais construite ici, et les trois la lisent.
 */

/** La boîte de travail unique de la planche 08.1. */
export type TaskNature =
    'validation' | 'collecte' | 'reception' | 'retour' | 'remise' | 'reparation';
/**
 * **Deux portées, plus d'historique** (08/10) — la file disait « À faire · À suivre ·
 * Historique », et le menu latéral portait un autre Historique : deux journaux pour une même
 * demande tranchée. Le commanditaire n'en garde qu'un, celui du menu (`HistoryPage`), où
 * les demandes se lisent dans la nature « Demandes ». La file ne montre que ce qui attend.
 */
export type TaskScope = 'todo' | 'following';
/**
 * **Ce qui presse d'abord** est l'ordre par défaut (26/09) : les groupes « En retard »,
 * « Cette semaine », « Aujourd'hui », l'urgence signalée en tête de chacun. Les deux
 * ordres d'ancienneté restent, pour qui veut la file brute.
 */
export type TaskOrder = 'urgence' | 'oldest' | 'newest';

export interface Task {
    id: string;
    nature: TaskNature;
    scope: TaskScope;
    /**
     * **L'objet, et lui seul** — `.tt .t` de la planche. Il portait « Kossi Adjovi —
     * Dell Latitude 7420 » : deux faits cousus dans une ligne qui n'en tient qu'un au
     * téléphone. La personne descend d'une ligne, à sa place.
     */
    title: string;
    /** Qui, ou quelle référence — la première moitié de la sous-ligne (`.tt .s`). */
    who?: string;
    /** L'état **en un mot** — la seconde moitié de la sous-ligne. */
    context: string;
    /**
     * Le motif d'un refus, cité tel quel sous la sous-ligne (`.tt .q`, en italique) :
     * c'est le seul texte que le demandeur a reçu, la file ne le reformule pas.
     */
    quote?: string;
    /**
     * Depuis quand la tâche attend, quand la donnée le dit — pour une demande, **son dépôt** :
     * c'est l'âge que la personne qui attend ressent, et celui que la maquette compte.
     */
    since: string | null;
    /** Le verbe n'apparaît que si la transition est réellement disponible ici. */
    action?: string;
    /**
     * Ce que la rangée ouvre. **Facultatif** : une tâche dont l'objet n'existe pas
     * encore — une demande sans équipement affecté — n'ouvre rien, elle porte son
     * geste sur place (17.7 : « deux portes vers la même file », corrigé le 20/08).
     */
    target?: ViewType;
    targetId?: string;
    /**
     * La machine remontée par la collecte. Elle **s'examine ici** : la planche 14.1
     * a sorti sa file de Paramètres.
     */
    deviceId?: string;
    initials?: string;
    icon?: PhosphorGlyph;
    /** La demande derrière la tâche, quelle que soit sa partition. */
    approvalId?: string;
    /** L'urgence signalée par le demandeur — la marque « Urgent » de la rangée. */
    urgent?: boolean;
    /** Qui a déposé la demande pour la personne, quand ce n'est pas elle — « , par Jane Manager ». */
    deposePar?: string;
    /** Qui a la main, pour « À suivre » — « ⏸ chez Jane Manager depuis 15 j » au bureau. */
    aLaMain?: string;
    transition?: { approvalId: string; nextStatus: ApprovalStatus };
    /**
     * Une demande arrivée chez l'informatique n'a pas de transition : son geste est
     * de **remettre** — la feuille de remise, la demande connue (planche 03.3).
     */
    assign?: { approvalId: string; beneficiaryId: string; category: string };
    /**
     * Le non, avec sa cible : `Rejected`, ou renvoi à l'IT pour une dotation. Il
     * n'existe **que là où un oui existe** — même acteur, même gate (lot 5).
     */
    refusal?: { approvalId: string; nextStatus: ApprovalStatus; requesterName: string };
    /**
     * **Le geste que le super administrateur peut forcer** (26/09) : la tâche est dans
     * « À suivre » parce qu'elle attend quelqu'un d'autre — nommé ici — et ses gestes
     * restent, écrits « à sa place ».
     */
    force?: string;
    /**
     * Ma propre demande, **encore en amont de la remise** : je peux la retirer (lot 6).
     */
    cancel?: { approvalId: string };
    /**
     * Ma demande, que j'attends de quelqu'un d'autre depuis trop longtemps : je peux
     * la relancer — seulement au-delà du délai.
     */
    remind?: { approvalId: string; remindedAt?: string };
    /** « demandé par Kossi Adjovi » — la sous-ligne de l'en-tête de la feuille. */
    askedBy?: string;
    /** Le motif écrit par le demandeur — cité tel quel dans la feuille (planche 03.3). */
    reason?: string;
    /** Ce qui situe la demande sans l'ouvrir : ce qu'il détient, l'urgence. */
    detail?: string;
    /**
     * Une réception à confirmer sans demande derrière (attribution directe) — par la
     * même porte que toutes les autres : `confirmEquipmentReception` (lot 7).
     */
    reception?: { equipmentId: string };
}

export const NATURE_LABEL: Record<TaskNature, string> = {
    /* « Validations » et non « Demandes » : sous « Nature », le mot doit nommer ce
       qui attend un geste, pas l'objet administratif. */
    validation: 'Validations',
    collecte: 'Collecte',
    remise: 'Remises',
    reception: 'Réceptions',
    retour: 'Retours',
    reparation: 'Réparations',
};

/** La nature au singulier, telle que la rangée du bureau et l'accueil l'écrivent. */
export const NATURE_MOT: Record<TaskNature, string> = {
    validation: 'Validation',
    collecte: 'Collecte',
    remise: 'Remise',
    reception: 'Réception',
    retour: 'Retour',
    reparation: 'Réparation',
};

export const SCOPE_LABEL: Record<TaskScope, string> = {
    todo: 'À faire',
    following: 'À suivre',
};

/** Jours écoulés, en entier — une file se lit en jours, pas en minutes. */
export const daysSince = (iso: string | null | undefined): number | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

export const ageLabel = (iso: string | null): string => {
    const days = daysSince(iso);
    if (days === null || days === 0) return "aujourd'hui";
    return `${days} j`;
};

/**
 * **L'âge dit ce qui presse** (26/09, tel que la maquette le dessine) — gris le jour même,
 * ambre dans la semaine, rouge **au-delà de sept jours** : la couleur suit le groupe, et le
 * groupe « En retard » le redit en toutes lettres. C'est la couleur d'un délai de service
 * (Jira Service Management, ServiceNow) : la file dit ce qui presse avant qu'on lise les
 * nombres.
 */
export const JOURS_RETARD = 7;

export type Palier = 'frais' | 'ambre' | 'rouge';

/** Les trois groupes de la file, dans l'ordre où elle se traite. */
export type GroupeDeFile = 'retard' | 'semaine' | 'aujourdhui';

export const GROUPES: readonly GroupeDeFile[] = ['retard', 'semaine', 'aujourdhui'];

export const GROUPE_LABEL: Record<GroupeDeFile, string> = {
    retard: `En retard · plus de ${JOURS_RETARD} jours`,
    semaine: 'Cette semaine',
    aujourdhui: 'Aujourd’hui',
};

export const groupeDe = (task: Pick<Task, 'since'>): GroupeDeFile => {
    const jours = daysSince(task.since) ?? 0;
    if (jours > JOURS_RETARD) return 'retard';
    if (jours >= 1) return 'semaine';
    return 'aujourdhui';
};

const PALIER: Record<GroupeDeFile, Palier> = {
    retard: 'rouge',
    semaine: 'ambre',
    aujourdhui: 'frais',
};

export const palierDe = (iso: string | null): Palier =>
    daysSince(iso) === null ? 'frais' : PALIER[groupeDe({ since: iso })];

const horodatage = (task: Pick<Task, 'since'>, absent: number) => {
    const at = task.since ? new Date(task.since).getTime() : Number.NaN;
    return Number.isNaN(at) ? absent : at;
};

/**
 * **Ordonner la file.** « Ce qui presse d'abord » : le groupe (en retard, cette semaine,
 * aujourd'hui), puis l'urgence signalée, puis la plus ancienne. Une tâche sans date
 * ferme la marche.
 */
export const ordonnerLaFile = <T extends Pick<Task, 'since' | 'urgent'>>(
    tasks: readonly T[],
    order: TaskOrder,
): T[] =>
    [...tasks].sort((left, right) => {
        if (order === 'urgence') {
            const groupe = GROUPES.indexOf(groupeDe(left)) - GROUPES.indexOf(groupeDe(right));
            if (groupe !== 0) return groupe;
            const urgence = Number(Boolean(right.urgent)) - Number(Boolean(left.urgent));
            if (urgence !== 0) return urgence;
        }
        if (order === 'newest') {
            return (
                horodatage(right, Number.NEGATIVE_INFINITY) -
                horodatage(left, Number.NEGATIVE_INFINITY)
            );
        }
        return (
            horodatage(left, Number.POSITIVE_INFINITY) - horodatage(right, Number.POSITIVE_INFINITY)
        );
    });

/**
 * Les initiales d'une personne — la vignette d'une rangée qui la nomme.
 */
export const extractInitials = (name?: string): string | undefined => {
    if (!name) return undefined;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase();
};

/**
 * Ce qu'ouvre une rangée d'approbation : **l'équipement dont elle parle**. Tant qu'aucun
 * objet n'est affecté — une demande encore à arbitrer — il n'y a rien à ouvrir.
 */
const approvalTarget = (approval: { assignedEquipmentId?: string }) =>
    approval.assignedEquipmentId
        ? { target: 'equipment_details' as ViewType, targetId: approval.assignedEquipmentId }
        : {};

/** La nature d'une demande à son étape : l'informatique **remet**, elle ne valide pas. */
const natureDeLaDemande = (status: ApprovalStatus): TaskNature => {
    if (status === 'PENDING_DELIVERY') return 'reception';
    if (status === 'WAITING_IT_PROCESSING') return 'remise';
    return 'validation';
};

/**
 * La sous-ligne de la planche dit **l'état en un mot**, jamais une phrase : « validation »,
 * « réception », « chez Jane Manager », « refusée ».
 */
const todoState = (status: ApprovalStatus): string => {
    switch (status) {
        case 'WAITING_MANAGER_APPROVAL':
            return 'validation';
        case 'WAITING_IT_PROCESSING':
            return 'unité à choisir';
        case 'WAITING_DOTATION_APPROVAL':
            return 'validation de la dotation';
        case 'PENDING_DELIVERY':
            return 'réception';
        default:
            return 'demande';
    }
};

/**
 * Au-delà de combien de jours une demande se relance. La planche 03.3 montre la cloche sur
 * une rangée de 9 jours et pas sur celles de 1 à 3 : **sept jours est une convention lue sur
 * le dessin**, pas une mesure.
 */
export const RELANCE_APRES_JOURS = 7;

const getApprovalActionLabel = (status: ApprovalStatus): string | undefined => {
    switch (status) {
        // Court : le verbe s'écrit à côté du refus (planche 03.3).
        case 'WAITING_MANAGER_APPROVAL':
            return 'Valider';
        case 'WAITING_DOTATION_APPROVAL':
            return 'Valider la dotation';
        case 'PENDING_DELIVERY':
            return 'Confirmer la réception';
        default:
            return undefined;
    }
};

export interface FileParams {
    approvals: readonly Approval[];
    equipment: readonly Equipment[];
    users: User[];
    detectedDevices: readonly DetectedDevice[];
    currentUser: Pick<User, 'id' | 'email'> | null | undefined;
    role: UserRole | undefined;
    permissions: { canManageInventory: boolean; canManageFinance: boolean };
}

/**
 * **Construire la file** — toutes les tâches de la personne connectée, dans leurs trois
 * partitions.
 *
 * « À faire » = **ce qui attend votre geste** (`approvalAttendLActeur`), et rien d'autre ;
 * « À suivre » = ce qui vous concerne et attend quelqu'un d'autre, avec son nom ; le
 * super administrateur y garde les gestes qu'il peut forcer.
 */
export const construireLaFile = ({
    approvals,
    equipment,
    users,
    detectedDevices,
    currentUser,
    role,
    permissions,
}: FileParams): Task[] => {
    if (!currentUser) return [];

    const out: Task[] = [];
    const gere = permissions.canManageInventory;
    const teamUserIds = new Set(
        role === 'Manager'
            ? users.filter((user) => user.managerId === currentUser.id).map((user) => user.id)
            : [],
    );

    /**
     * La ligne de contexte de la feuille — *« détient 3 objets · aucun portable · urgence
     * normale »* (planche 03.3). Elle évite d'ouvrir la fiche pour trancher.
     */
    const requestContext = (approval: Approval): string => {
        const held = equipment.filter(
            (item) =>
                item.user?.id === approval.beneficiaryId ||
                item.user?.name === approval.beneficiaryName,
        );
        const wanted = getCategoryLabel(approval.equipmentCategory).toLowerCase();
        const hasSame = held.some((item) => getCategoryLabel(item.type).toLowerCase() === wanted);
        const urgency =
            approval.urgency === 'high'
                ? 'urgence signalée'
                : approval.urgency === 'low'
                  ? 'sans urgence'
                  : 'urgence normale';
        return [
            held.length > 0
                ? `détient ${held.length} objet${held.length > 1 ? 's' : ''}`
                : 'ne détient rien',
            hasSame ? `déjà un ${wanted}` : `aucun ${wanted}`,
            urgency,
        ].join(' · ');
    };

    const isRelatedApproval = (approval: Approval) => {
        if (role === 'Admin' || role === 'SuperAdmin') return true;
        if (role === 'Manager') {
            return (
                approval.requesterId === currentUser.id ||
                approval.beneficiaryId === currentUser.id ||
                teamUserIds.has(approval.requesterId) ||
                teamUserIds.has(approval.beneficiaryId)
            );
        }
        return approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id;
    };

    approvals.forEach((approval) => {
        const equipmentLabel =
            approval.assignedEquipmentName ||
            approval.equipmentName ||
            getCategoryLabel(approval.equipmentCategory || '');
        const beneficiary = approval.beneficiaryName || approval.requesterName;
        const subject = equipmentLabel || 'Demande d’équipement';
        const mine =
            approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id;

        if (!isApprovalActiveStatus(approval.status)) return;

        const contexte = { approval, actorRole: role, actorId: currentUser.id, users };
        const attend = approvalAttendLActeur(contexte);
        if (!attend && !isRelatedApproval(approval)) return;

        const peutAgir = canUserActOnApproval(contexte);
        const actions = getAvailableApprovalActions(contexte);
        const primary = peutAgir ? actions.primary : null;
        const transition =
            primary?.kind === 'transition' && primary.nextStatus
                ? { approvalId: approval.id, nextStatus: primary.nextStatus }
                : undefined;
        const assign =
            primary?.kind === 'assign'
                ? {
                      approvalId: approval.id,
                      beneficiaryId: approval.beneficiaryId,
                      category: approval.equipmentCategory,
                  }
                : undefined;
        const refusal =
            primary && actions.reject
                ? {
                      approvalId: approval.id,
                      nextStatus: getApprovalRejectTarget(approval.status),
                      requesterName:
                          approval.beneficiaryName || approval.requesterName || 'le demandeur',
                  }
                : undefined;
        const action = transition
            ? getApprovalActionLabel(approval.status)
            : assign
              ? 'Remettre'
              : undefined;

        const commun = {
            nature: natureDeLaDemande(approval.status),
            title: subject,
            since: approval.createdAt || null,
            reason: approval.reason,
            detail: requestContext(approval),
            approvalId: approval.id,
            urgent: approval.urgency === 'high',
            deposePar: approval.isDelegated ? approval.requesterName : undefined,
            askedBy: approval.isDelegated
                ? `demandé par ${approval.requesterName} pour ${approval.beneficiaryName}`
                : `demandé par ${approval.beneficiaryName || approval.requesterName}`,
            ...approvalTarget(approval),
            initials: extractInitials(beneficiary),
            icon: ClipboardText,
        };

        if (attend) {
            out.push({
                ...commun,
                id: `approval-${approval.id}`,
                scope: 'todo',
                who: beneficiary,
                context: todoState(approval.status),
                action,
                transition,
                assign,
                refusal,
            });
            return;
        }

        const main = quiALaMainSurLaDemande(approval, users);
        const cancel =
            actions.cancel && approval.status !== 'PENDING_DELIVERY'
                ? { approvalId: approval.id }
                : undefined;
        out.push({
            ...commun,
            id: `following-${approval.id}`,
            scope: 'following',
            who: approval.requesterId === currentUser.id ? 'ma demande' : beneficiary,
            /* « À suivre » nomme **qui a la main**, pas une porte : « chez Jane Manager »
               plutôt que « chez sa manager » (26/09). */
            aLaMain: main?.nom,
            context: !main
                ? 'en cours'
                : main.personneId && main.personneId === approval.beneficiaryId
                  ? 'réception à confirmer'
                  : `chez ${main.nom}`,
            cancel,
            // Seule ma demande se relance, et seulement passé le délai.
            remind:
                mine && (daysSince(commun.since) ?? 0) >= RELANCE_APRES_JOURS
                    ? { approvalId: approval.id, remindedAt: approval.remindedAt }
                    : undefined,
            /* Le super administrateur peut forcer ce qu'un autre doit faire : ses
               gestes restent, écrits « à sa place ». */
            ...(primary && main
                ? { action, transition, assign, refusal, force: main.nom }
                : undefined),
        });
    });

    /* Les objets dont **une demande en cours** attend la réception : sa tâche le porte déjà
       (« Réception », avec « à sa place » pour l'informatique). Le filtre comptait toutes
       les demandes, closes comprises (08/10) : l'informatique trouvait en plus « Remettre »
       un objet déjà remis et attesté, et un objet revenu de réparation ne redonnait plus
       de réception à son porteur s'il était un jour venu par une demande. */
    const approvalEquipmentIds = new Set(
        approvals.flatMap((approval) =>
            approval.assignedEquipmentId && approval.status === 'PENDING_DELIVERY'
                ? [approval.assignedEquipmentId]
                : [],
        ),
    );

    equipment.forEach((item) => {
        /* Le code descend en sous-ligne ; quand un porteur est connu, c'est lui qui prend
           cette moitié : elle dit à qui la remise est due. */
        const title = item.name;
        const isHolder = item.user?.email?.toLowerCase() === currentUser.email?.toLowerCase();
        const who = item.user?.name || item.assetId;

        /* **La remise et le retour appartiennent à qui gère l'inventaire** (26/09) : la
           feuille de remise ne s'ouvre qu'avec ce droit. La règle disait « tout rôle sauf
           l'utilisateur » — un manager y trouvait des remises qu'il ne pouvait pas faire,
           et jamais la réception de son propre objet. */
        if (item.assignmentStatus === 'PENDING_DELIVERY') {
            if (gere && !approvalEquipmentIds.has(item.id)) {
                out.push({
                    id: `handover-${item.id}`,
                    nature: 'remise',
                    scope: 'todo',
                    title,
                    who,
                    context: 'remise',
                    since: item.assignedAt ?? null,
                    action: 'Remettre',
                    target: 'assignment_wizard',
                    targetId: item.id,
                    icon: getCategoryGlyph(item.type),
                });
            } else if (isHolder && !approvalEquipmentIds.has(item.id)) {
                out.push({
                    id: `delivery-${item.id}`,
                    nature: 'reception',
                    scope: 'todo',
                    title,
                    /* « Réception · réception » ne disait rien : le modèle se reconnaît. */
                    context: item.model ? `${item.model} · à confirmer` : 'à confirmer',
                    since: item.assignedAt ?? null,
                    action: 'Confirmer',
                    target: 'equipment_details',
                    targetId: item.id,
                    reception: { equipmentId: item.id },
                    icon: getCategoryGlyph(item.type),
                });
            }
        }

        /* **Le parcours de réparation dans la file** (24/09) : chaque étape est la
           tâche de qui la tient. Ce qu'on attend d'un autre passe à « À suivre ». */
        const dossier = item.repair;
        if (dossier) {
            const base = {
                nature: 'reparation' as const,
                title,
                who: dossier.holderName || item.assetId,
                target: 'equipment_details' as ViewType,
                targetId: item.id,
                icon: Wrench,
            };
            if (dossier.stage === 'declared') {
                if (gere)
                    out.push({
                        ...base,
                        id: `rep-depot-${item.id}`,
                        scope: 'todo',
                        context: 'dépôt à recevoir',
                        since: dossier.openedAt,
                        action: 'Recevoir',
                    });
                else if (dossier.holderId === currentUser.id)
                    out.push({
                        ...base,
                        id: `rep-deposer-${item.id}`,
                        scope: 'todo',
                        context: 'à déposer à l’informatique',
                        since: dossier.openedAt,
                    });
            } else if (dossier.stage === 'deposited' && gere) {
                out.push({
                    ...base,
                    id: `rep-charge-${item.id}`,
                    scope: 'todo',
                    context:
                        dossier.quoteDecision?.status === 'rejected'
                            ? 'devis refusé, à reprendre'
                            : 'à prendre en charge',
                    quote:
                        dossier.quoteDecision?.status === 'rejected'
                            ? dossier.quoteDecision.reason
                            : undefined,
                    since: dossier.deposit?.at ?? dossier.openedAt,
                    action: 'Prendre en charge',
                });
            } else if (dossier.stage === 'quote_pending') {
                if (permissions.canManageFinance)
                    out.push({
                        ...base,
                        id: `rep-devis-${item.id}`,
                        scope: 'todo',
                        context: `devis · ${(dossier.quote?.amount ?? 0).toLocaleString('fr-FR')}`,
                        since: dossier.takenCharge?.at ?? null,
                        action: 'Examiner',
                    });
                else if (gere)
                    out.push({
                        ...base,
                        id: `rep-devis-${item.id}`,
                        scope: 'following',
                        context: 'devis chez la Finance',
                        since: dossier.takenCharge?.at ?? null,
                    });
            } else if (dossier.stage === 'at_repairer' && gere) {
                const attendu = dossier.takenCharge?.expectedReturn;
                const enRetard = attendu ? new Date(attendu).getTime() < Date.now() : false;
                /* La date promise, et le délai compté **depuis elle** quand elle est passée
                   (08/10) : « retour en retard · 36 j » comptait depuis l'envoi, si bien
                   qu'on ne savait ni de combien, ni depuis quand. */
                const promis = attendu
                    ? new Date(attendu).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                      })
                    : null;
                out.push({
                    ...base,
                    id: `rep-retour-${item.id}`,
                    scope: enRetard ? 'todo' : 'following',
                    context: [
                        `chez ${dossier.takenCharge?.repairer ?? 'le prestataire'}`,
                        promis ? `${enRetard ? 'attendu le' : 'retour le'} ${promis}` : null,
                    ]
                        .filter(Boolean)
                        .join(' · '),
                    since: (enRetard ? attendu : dossier.sentAt) ?? null,
                    action: enRetard ? 'Récupérer' : undefined,
                });
            }
        }

        if (item.assignmentStatus === 'PENDING_RETURN') {
            if (gere) {
                out.push({
                    id: `return-${item.id}`,
                    nature: 'retour',
                    scope: 'todo',
                    title,
                    who,
                    context: 'retour à réceptionner',
                    since: item.returnRequestedAt || item.assignedAt || null,
                    action: 'Réceptionner',
                    target: 'return_wizard',
                    targetId: item.id,
                    icon: getCategoryGlyph(item.type),
                });
            } else if (isHolder) {
                out.push({
                    id: `return-user-${item.id}`,
                    nature: 'retour',
                    scope: 'todo',
                    title,
                    context: 'restitution demandée',
                    since: item.returnRequestedAt || item.assignedAt || null,
                    action: 'Restituer',
                    target: 'return_wizard',
                    targetId: item.id,
                    icon: getCategoryGlyph(item.type),
                });
            }
        }
    });

    if (gere) {
        detectedDevices
            .filter((device) => ['pending_review', 'ambiguous_match'].includes(device.status))
            .forEach((device) => {
                out.push({
                    id: `collection-${device.id}`,
                    nature: 'collecte',
                    scope: 'todo',
                    title: device.machineName || device.hostname || 'Machine détectée',
                    who: device.assetId || device.hostname || undefined,
                    context:
                        device.status === 'ambiguous_match'
                            ? 'correspondance à confirmer'
                            : 'collecte à valider',
                    since: device.firstSeenAt || device.lastSeenAt || null,
                    action: 'Examiner',
                    target: 'tasks',
                    deviceId: device.id,
                    icon: Laptop,
                });
            });
    }

    return ordonnerLaFile(out, 'urgence');
};
