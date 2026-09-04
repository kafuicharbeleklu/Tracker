import { getCategoryGlyph } from '../../../constants/categoryIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowCounterClockwise,
    BellRinging,
    Check,
    ClipboardText,
    Funnel,
    Laptop,
    Package,
    Prohibit,
    X,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import { rowActivation } from '../../../lib/a11y';
import Icon from '../../../components/ui/Icon';
import BottomSheet from '../../../components/ui/BottomSheet';
import CloseButton from '../../../components/ui/CloseButton';
import SecurityGate from '../../../components/security/SecurityGate';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import {
    canUserActOnApproval,
    getApprovalRejectTarget,
    getAvailableApprovalActions,
    isApprovalActiveStatus,
    isApprovalHistoryStatus,
} from '../../../lib/businessRules';
import { getCategoryLabel } from '../../../constants/glossary';
import { ApprovalStatus, ViewType } from '../../../types';
import { cn } from '../../../lib/utils';

/** La boîte de travail unique de la planche 08.1. */
export type TaskNature = 'validation' | 'collecte' | 'reception' | 'retour' | 'remise';
type TaskScope = 'todo' | 'following' | 'history';
type TaskOrder = 'oldest' | 'newest';

interface Task {
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
    /** La teinte de la vignette. Par défaut la nature ; l'historique met son issue. */
    tone?: TaskTone;
    /**
     * Le motif d'un refus, cité tel quel sous la sous-ligne (`.tt .q`, en italique) :
     * c'est le seul texte que le demandeur a reçu, l'historique ne le reformule pas.
     */
    quote?: string;
    /** Qui a décidé — la seconde ligne du bloc de droite (`.rt .by`). */
    decidedBy?: string;
    /** Depuis quand, quand la donnée le dit. */
    since: string | null;
    /** Le verbe n'apparaît que si la transition est réellement disponible ici. */
    action?: string;
    /**
     * Ce que la rangée ouvre. **Facultatif** : une tâche dont l'objet n'existe pas
     * encore — une demande sans équipement affecté — n'ouvre rien, elle porte son
     * geste sur place. Elle valait obligatoirement `'approvals'`, ce qui envoyait
     * vers un **second inventaire de la même file** (17.7 : « deux portes vers la
     * même file »). Corrigé le 20/08.
     */
    target?: ViewType;
    targetId?: string;
    /**
     * La machine remontée par la collecte. Elle **s'examine ici** : la planche 14.1
     * a sorti sa file de Paramètres — « Paramètres règle les sources ; il ne garde
     * pas leur produit » — et un geste qui renvoyait à l'écran de réglages faisait
     * traverser trois onglets pour dire oui ou non.
     */
    deviceId?: string;
    initials?: string;
    icon?: PhosphorGlyph;
    transition?: { approvalId: string; nextStatus: ApprovalStatus };
    /**
     * Une demande arrivée chez l'informatique n'a pas de transition : son geste est
     * de **remettre**, et cela ouvre l'assistant avec la demande. Sans cette clé, la
     * rangée n'avait ni verbe ni destination (planche 03.3).
     */
    assign?: { approvalId: string };
    /**
     * Le non, avec sa cible : `Rejected`, ou renvoi à l'IT pour une dotation. Il
     * n'existe **que là où un oui existe** — même acteur, même gate. Les règles du
     * refus étaient écrites depuis longtemps ; aucune UI ne les déclenchait
     * (zone d'ombre n° 8). Planches 03.3 et 06.5 — lot 5.
     */
    refusal?: { approvalId: string; nextStatus: ApprovalStatus; requesterName: string };
    /**
     * Ma propre demande, **encore en amont de la remise** : je peux la retirer. Une
     * fois l'objet remis (`PENDING_DELIVERY`), on refuse la réception — on n'annule
     * plus. Planche 03.3, onglet « À suivre » — lot 6.
     */
    cancel?: { approvalId: string };
    /**
     * Ma demande, que j'attends de quelqu'un d'autre depuis trop longtemps : je peux
     * la relancer. **Le seul acte de « À suivre »** (planche 03.3), et seulement
     * au-delà du délai — une relance qui s'offre au premier jour n'est pas une relance.
     */
    remind?: { approvalId: string; remindedAt?: string };
    /** « demandé par Kossi Adjovi » — la sous-ligne de l'en-tête de la feuille. */
    askedBy?: string;
    /** Le motif écrit par le demandeur — cité tel quel dans la feuille (planche 03.3). */
    reason?: string;
    /** Ce qui situe la demande sans l'ouvrir : ce qu'il détient, l'urgence. */
    detail?: string;
    /**
     * Une réception à confirmer sans demande derrière (attribution directe). Elle
     * s'écrit **depuis la rangée**, par la même porte que toutes les autres :
     * `confirmEquipmentReception`. Lot 7, S3.
     */
    reception?: { equipmentId: string };
}

const NATURE_LABEL: Record<TaskNature, string> = {
    /* « Validations » et non « Demandes » : sous « Nature », le mot doit nommer ce
       qui attend un geste, pas l'objet administratif. C'est le libellé de la feuille
       de filtre de la planche. */
    validation: 'Validations',
    collecte: 'Collecte',
    remise: 'Remises',
    reception: 'Réceptions',
    retour: 'Retours',
};

/**
 * L'issue d'une tâche close — ce que l'historique montre à la place de sa nature.
 * La planche en dessine trois : validée (`.vig.ok`), refusée (`.vig.no`), annulée.
 */
type TaskOutcome = 'ok' | 'no' | 'undone';

/** Ce que la vignette peut porter comme couleur : une nature, ou une issue. */
type TaskTone = TaskNature | TaskOutcome;

/**
 * **La couleur de la vignette dit la nature** — `.vig.val`, `.rem`, `.rec`, `.ret`,
 * `.ok`, `.no` de la planche 03.3, passe sobre du 02/09.
 *
 * Avant cette passe, la nature se lisait à une pastille de mots posée sous le titre.
 * La planche la supprime : la rangée n'a plus qu'un titre, une sous-ligne et un âge,
 * et c'est le carré de 40 px à gauche — celui qui portait déjà les initiales ou le
 * glyphe de catégorie — qui prend la teinte. Un fait de moins à lire, une couleur de
 * plus à reconnaître.
 *
 * Une paire = un fond et l'encre qui tient dessus ; le socle les déclare ensemble
 * pour qu'aucune ne dérive sans l'autre.
 */
const VIG_TINT: Record<TaskTone, string> = {
    validation: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    remise: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    reception: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    retour: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    collecte: 'bg-[var(--tk-color-surface-muted-strong)] text-on-surface-variant',
    ok: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    no: 'bg-[var(--tk-color-tint-danger)] text-[var(--tk-color-on-tint-danger)]',
    undone: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
};

/**
 * `.rbtn` — le geste d'une rangée, déclaré **une seule fois**. Métrique de la planche
 * 03.3 après la passe sobre : **40 px** de haut, 14 de remplissage latéral, rayon 4,
 * **15 px / 500**, gouttière de 6 avant un glyphe.
 *
 * Le remplissage suit la **surface**, jamais l'écran (§2.7) : ces rangées sont sur une
 * carte claire, donc `--inset` et l'encre. Le tableau de bord emploie le même rôle sur
 * son héro inversé, où c'est le voile blanc qui s'applique — deux surfaces, deux
 * remplissages, un seul rôle.
 *
 * **Le verbe a quitté la rangée** (planche du 02/09, portée le 04/09) : la rangée est
 * un pur sujet, et les deux décisions vivent dans la feuille de la tâche. Ce rôle
 * n'habille donc plus qu'un bouton de feuille.
 */
/**
 * `.fh` — l'intitulé d'un groupe de la feuille de filtre : 12 px sur la grille de 4,
 * capitales espacées, encre tertiaire. Il était à 11.
 */
const FILTER_HEADING = 'text-text-secondary text-[12px] leading-4 tracking-[0.06em] uppercase';

/**
 * `.chip` de la feuille — **40 px** de haut, 14 de remplissage latéral, rayon 4,
 * **15 px**. Elle descend de 44 à 40 : la feuille en aligne désormais trois groupes,
 * et la planche du 02/09 les mesure à 40.
 */
const sheetChip = (on: boolean) =>
    cn(
        'min-h-10 gap-1.5 rounded-md px-3.5 text-[15px] leading-5 font-normal',
        on
            ? 'bg-inverse-surface text-inverse-on-surface'
            : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
    );

/** Le décompte d'une puce : 500, sur l'encre secondaire de sa surface. */
const chipCount = (on: boolean) =>
    cn('font-medium tabular-nums', on ? 'text-inverse-on-surface/75' : 'text-on-surface-variant');

const SCOPE_LABEL: Record<TaskScope, string> = {
    todo: 'À faire',
    following: 'À suivre',
    history: 'Historique',
};

const TASKS_PAGE_SIZE = 30;

/** Jours écoulés, en entier — une file se lit en jours, pas en minutes. */
const daysSince = (iso: string | null): number | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

const ageLabel = (iso: string | null): string => {
    const days = daysSince(iso);
    if (days === null || days === 0) return "aujourd'hui";
    if (days === 1) return '1 j';
    return `${days} j`;
};

/**
 * Dans l'historique, la droite porte la **date** de la décision, pas son âge : une
 * décision du 14 août ne se lit pas « 21 j ». Planche 03.3, `.rt .age`.
 */
const dateLabel = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—';

/**
 * Le sujet en toutes lettres — « Kossi Adjovi — Dell Latitude 7420 ». La rangée l'a
 * scindé en deux lignes, mais un `aria-label` et le libellé que signe le code personnel
 * ont besoin de la phrase entière : hors de la rangée, l'objet seul ne dit plus de qui
 * il s'agit.
 */
const extractInitials = (name?: string): string | undefined => {
    if (!name) return undefined;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase();
};

/**
 * Ce qu'ouvre une rangée d'approbation : **l'équipement dont elle parle**, comme une
 * rangée d'équipement ouvre le sien. Tant qu'aucun objet n'est affecté — une demande
 * encore à arbitrer — il n'y a rien à ouvrir : la rangée porte son geste sur place et
 * ne navigue pas. C'est ce qui remplace le renvoi vers l'ancienne liste des demandes.
 */
const approvalTarget = (approval: { assignedEquipmentId?: string }) =>
    approval.assignedEquipmentId
        ? { target: 'equipment_details' as ViewType, targetId: approval.assignedEquipmentId }
        : {};

/**
 * La sous-ligne de la planche dit **l'état en un mot**, jamais une phrase : « validation »,
 * « réception », « chez sa manager », « refusée ». Un même statut se lit donc de trois
 * façons, une par partition — ce qui attend mon geste, ce que j'attends d'un autre, ce
 * qui est décidé. C'était une seule phrase pour les trois, et elle disait « Validation
 * du manager » là où la vignette dit déjà « validation » par sa couleur.
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

/** Ce que j'attends, et de qui : « À suivre » nomme la porte, pas l'acte. */
const followingState = (status: ApprovalStatus, mine: boolean): string => {
    switch (status) {
        case 'WAITING_MANAGER_APPROVAL':
            return mine ? 'chez ma manager' : 'chez sa manager';
        case 'WAITING_IT_PROCESSING':
            return 'chez l’informatique';
        case 'WAITING_DOTATION_APPROVAL':
            return 'chez la dotation';
        case 'PENDING_DELIVERY':
            return 'réception';
        default:
            return 'en cours';
    }
};

/** L'issue au participe passé, et la teinte que la vignette prend avec elle. */
const historyOutcome = (
    status: ApprovalStatus,
): { word: string; tone: TaskOutcome; glyph: PhosphorGlyph } => {
    switch (status) {
        case 'Rejected':
            return { word: 'refusée', tone: 'no', glyph: X };
        case 'Cancelled':
            return { word: 'annulée', tone: 'undone', glyph: ArrowCounterClockwise };
        default:
            return { word: 'validée', tone: 'ok', glyph: Check };
    }
};

/**
 * Au-delà de combien de jours une demande se relance. La planche montre la cloche sur
 * une rangée de 9 jours et pas sur celles de 1 à 3 : **sept jours est une convention
 * lue sur le dessin**, pas une mesure. Elle vaut ce que vaut l'usage.
 */
const RELANCE_APRES_JOURS = 7;

const getApprovalActionLabel = (status: ApprovalStatus): string | undefined => {
    switch (status) {
        // Court : le verbe s'écrit dans la feuille de la tâche, à côté du refus, et
        // deux boutons de même largeur n'ont pas la place d'une phrase (planche 03.3).
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

const getTransitionSuccessMessage = (status: ApprovalStatus): string => {
    switch (status) {
        case 'WAITING_IT_PROCESSING':
            return 'Demande validée. Transmise à l’IT.';
        case 'PENDING_DELIVERY':
            return 'Dotation validée. En attente de confirmation utilisateur.';
        case 'Completed':
            return 'Réception confirmée.';
        default:
            return 'Demande mise à jour.';
    }
};

interface TasksPageProps {
    onNavigate: (view: ViewType) => void;
    onItemClick: (view: ViewType, id: string) => void;
}

/**
 * Tâches — la boîte de travail unique, planche 03.3, **passe sobre du 02/09**.
 *
 * *Une recherche, un filtre, une rangée.*
 *
 * Ce que la passe change, et pourquoi la planche le veut :
 *
 * · **La bande du haut se tait.** Elle portait le titre, un sous-titre, une recherche,
 *   un entonnoir, cinq puces de nature et un ⋮ de partition — six commandes au-dessus
 *   de ce qu'on vient lire. Il reste le titre, la recherche et l'entonnoir. Les trois
 *   partitions et les cinq natures descendent dans la feuille de filtre.
 * · **Une ligne nomme ce qu'on regarde** (`.ord`), posée au-dessus de la liste :
 *   « À faire · les plus anciennes d'abord », et le compte à sa droite. C'est elle qui
 *   remplace le sous-titre, le bandeau de filtre actif et le bouton de tri.
 * · **La rangée est un sujet.** L'objet en titre à 17, la personne et l'état en
 *   sous-ligne à 14, l'âge à 12 aligné en haut. La pastille de mots qui nommait la
 *   nature disparaît : c'est la **couleur de la vignette** qui la porte.
 * · **L'historique montre l'issue et qui l'a prise**, empilées à droite, et cite le
 *   motif d'un refus tel quel, en italique.
 * · **Aucune note dans l'écran** (R15) : le panneau « Ce qui arrivera ici » tombe.
 *
 * **Ce que la planche demande et qui n'est pas fait ici.** Son arbitrage du 02/09 retire
 * aussi le verbe et le ⋮ de la rangée, et confie les deux décisions à une *feuille de la
 * tâche* ouverte au tap. Ce déplacement traverse `refusal`, `cancel`, `reception`, le
 * `SecurityGate` et les deux feuilles de motif — les lots 5, 6 et 7 : il se fait avec
 * eux, pas dans une passe de forme. La rangée garde donc son geste, à la métrique de
 * la planche.
 */
const TasksPage: React.FC<TasksPageProps> = ({ onNavigate, onItemClick }) => {
    const {
        approvals,
        equipment,
        users,
        detectedDevices,
        updateApproval,
        confirmEquipmentReception,
        remindApproval,
        promoteDetectedDeviceToInventory,
        markDetectedDeviceAsIgnored,
    } = useData();
    const { user: currentUser, role, permissions } = useAccessControl();
    const { showToast } = useToast();

    const [nature, setNature] = useState<TaskNature | 'toutes'>('toutes');
    const [scope, setScope] = useState<TaskScope>('todo');
    /* La recherche que `.srch` dessine sur la planche — « Personne, objet, code » —
       et que la bande n'avait pas, alors que les cinq autres listes la portent. */
    const [query, setQuery] = useState('');
    const [order, setOrder] = useState<TaskOrder>('oldest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [reviewDeviceId, setReviewDeviceId] = useState<string | null>(null);
    // Feuille de motif du refus : la tâche visée, et le texte que le demandeur lira.
    const [refusing, setRefusing] = useState<Task | null>(null);
    const [refusalReason, setRefusalReason] = useState('');
    const [cancelling, setCancelling] = useState<Task | null>(null);
    /**
     * La tâche ouverte. **Arbitrage du 02/09 (planche 03.3)** : la rangée ne porte ni
     * verbe ni ⋮ — elle est le sujet, et son tap ouvre cette feuille, qui porte le
     * contexte et les décisions. Les lots 5 à 7 avaient posé le verbe et le ⋮ sur la
     * rangée ; à 393 px les trois colonnes ne tenaient pas et le nom de l'objet se
     * réduisait à « Dell L… ». Les mécanismes ne changent pas, seul leur logement.
     */
    const [openedTask, setOpenedTask] = useState<Task | null>(null);
    const [visibleCount, setVisibleCount] = useState(TASKS_PAGE_SIZE);

    const tasks = useMemo<Task[]>(() => {
        if (!currentUser) return [];

        const out: Task[] = [];
        const teamUserIds = new Set(
            role === 'Manager'
                ? users.filter((user) => user.managerId === currentUser.id).map((user) => user.id)
                : [],
        );
        /**
         * La ligne de contexte de la feuille — *« Kossi détient 3 objets · aucun
         * portable · urgence normale »* (planche 03.3). Trois faits, et trois
         * seulement : ce qu'il a, s'il a déjà ce qu'il demande, et l'urgence. Elle
         * évite d'ouvrir la fiche pour trancher.
         */
        const requestContext = (approval: (typeof approvals)[number]): string => {
            const held = equipment.filter(
                (item) =>
                    item.user?.id === approval.beneficiaryId ||
                    item.user?.name === approval.beneficiaryName,
            );
            const wanted = getCategoryLabel(approval.equipmentCategory).toLowerCase();
            const hasSame = held.some(
                (item) => getCategoryLabel(item.type).toLowerCase() === wanted,
            );
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

        const isRelatedApproval = (approval: (typeof approvals)[number]) => {
            if (role === 'Admin' || role === 'SuperAdmin') return true;
            if (role === 'Manager') {
                return (
                    approval.requesterId === currentUser.id ||
                    approval.beneficiaryId === currentUser.id ||
                    teamUserIds.has(approval.requesterId) ||
                    teamUserIds.has(approval.beneficiaryId)
                );
            }
            return (
                approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id
            );
        };

        approvals.forEach((approval) => {
            const equipmentLabel =
                approval.assignedEquipmentName ||
                approval.equipmentName ||
                getCategoryLabel(approval.equipmentCategory || '');
            const beneficiary = approval.beneficiaryName || approval.requesterName;
            /* L'objet seul en titre ; la personne descend en sous-ligne (planche 03.3). */
            const subject = equipmentLabel || 'Demande d’équipement';
            const mine = approval.requesterId === currentUser.id;
            const isActionable = canUserActOnApproval({
                approval,
                actorRole: role,
                actorId: currentUser.id,
                users,
            });

            if (isApprovalHistoryStatus(approval.status)) {
                if (isRelatedApproval(approval)) {
                    /* L'issue, qui l'a prise, et — pour un refus — le motif cité tel
                       quel. La planche empile la date et le nom à droite (`.rt`, `.by`)
                       au lieu de les coudre au contexte, et met l'issue dans la
                       vignette : un glyphe teinté, pas des initiales. */
                    const outcome = historyOutcome(approval.status);
                    out.push({
                        id: `history-${approval.id}`,
                        nature: 'validation',
                        scope: 'history',
                        title: subject,
                        who: beneficiary,
                        context: outcome.word,
                        tone: outcome.tone,
                        quote: approval.decisionNote?.reason,
                        decidedBy: approval.decisionNote?.actorName,
                        since: approval.updatedAt || approval.createdAt,
                        ...approvalTarget(approval),
                        icon: outcome.glyph,
                    });
                }
                return;
            }

            if (!isApprovalActiveStatus(approval.status)) return;

            if (isActionable) {
                const primary = getAvailableApprovalActions({
                    approval,
                    actorRole: role,
                    actorId: currentUser.id,
                    users,
                }).primary;
                const transition =
                    primary?.kind === 'transition' && primary.nextStatus
                        ? { approvalId: approval.id, nextStatus: primary.nextStatus }
                        : undefined;
                const assign = primary?.kind === 'assign' ? { approvalId: approval.id } : undefined;
                const refusal =
                    primary && (primary.kind === 'transition' || primary.kind === 'assign')
                        ? {
                              approvalId: approval.id,
                              nextStatus: getApprovalRejectTarget(approval.status),
                              requesterName:
                                  approval.beneficiaryName ||
                                  approval.requesterName ||
                                  'le demandeur',
                          }
                        : undefined;

                out.push({
                    id: `approval-${approval.id}`,
                    nature: approval.status === 'PENDING_DELIVERY' ? 'reception' : 'validation',
                    scope: 'todo',
                    title: subject,
                    who: beneficiary,
                    context: todoState(approval.status),
                    since: approval.createdAt ?? null,
                    action: transition
                        ? getApprovalActionLabel(approval.status)
                        : assign
                          ? 'Remettre'
                          : undefined,
                    transition,
                    assign,
                    refusal,
                    reason: approval.reason,
                    detail: requestContext(approval),
                    askedBy: approval.isDelegated
                        ? `demandé par ${approval.requesterName} pour ${approval.beneficiaryName}`
                        : `demandé par ${approval.beneficiaryName || approval.requesterName}`,
                    ...approvalTarget(approval),
                    initials: extractInitials(beneficiary),
                    icon: ClipboardText,
                });
            } else if (isRelatedApproval(approval)) {
                const { cancel: cancelAction } = getAvailableApprovalActions({
                    approval,
                    actorRole: role,
                    actorId: currentUser.id,
                    users,
                });
                const cancel =
                    cancelAction && approval.status !== 'PENDING_DELIVERY'
                        ? { approvalId: approval.id }
                        : undefined;
                out.push({
                    id: `following-${approval.id}`,
                    nature: approval.status === 'PENDING_DELIVERY' ? 'reception' : 'validation',
                    scope: 'following',
                    title: subject,
                    who: mine ? 'ma demande' : beneficiary,
                    context: followingState(approval.status, mine),
                    since: approval.createdAt ?? null,
                    ...approvalTarget(approval),
                    cancel,
                    reason: approval.reason,
                    // Seule ma demande se relance, et seulement passé le délai.
                    remind:
                        mine && (daysSince(approval.createdAt ?? null) ?? 0) >= RELANCE_APRES_JOURS
                            ? { approvalId: approval.id, remindedAt: approval.remindedAt }
                            : undefined,
                    initials: extractInitials(beneficiary),
                    icon: ClipboardText,
                });
            }
        });

        const approvalEquipmentIds = new Set(
            approvals.flatMap((approval) =>
                approval.assignedEquipmentId ? [approval.assignedEquipmentId] : [],
            ),
        );

        equipment.forEach((item) => {
            /* Le code ne reste pas entre parenthèses dans le titre : la planche descend
               la référence en sous-ligne — « Écran Dell U2722 / ASSET-30117 · réception ».
               Quand un porteur est connu, c'est lui qui prend cette moitié : elle dit à
               qui la remise est due. Sur ses propres tâches, personne — c'est moi. */
            const title = item.name;
            const isHolder = item.user?.email?.toLowerCase() === currentUser.email?.toLowerCase();
            const who = item.user?.name || item.assetId;

            if (item.assignmentStatus === 'PENDING_DELIVERY') {
                if (role !== 'User') {
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
                        context: 'réception',
                        since: item.assignedAt ?? null,
                        action: 'Confirmer',
                        target: 'equipment_details',
                        targetId: item.id,
                        reception: { equipmentId: item.id },
                        icon: getCategoryGlyph(item.type),
                    });
                }
            }

            if (item.assignmentStatus === 'PENDING_RETURN') {
                if (role !== 'User') {
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

        if (permissions.canManageInventory) {
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

        return out.sort((left, right) => {
            if (!left.since) return 1;
            if (!right.since) return -1;
            return new Date(left.since).getTime() - new Date(right.since).getTime();
        });
    }, [
        approvals,
        equipment,
        users,
        detectedDevices,
        currentUser,
        role,
        permissions.canManageInventory,
    ]);

    const scopeTasks = useMemo(() => tasks.filter((task) => task.scope === scope), [scope, tasks]);
    const counts = useMemo(() => {
        const next: Record<TaskNature, number> = {
            validation: 0,
            collecte: 0,
            remise: 0,
            reception: 0,
            retour: 0,
        };
        scopeTasks.forEach((task) => {
            next[task.nature] += 1;
        });
        return next;
    }, [scopeTasks]);

    const scopeCounts = useMemo(
        () => ({
            todo: tasks.filter((task) => task.scope === 'todo').length,
            following: tasks.filter((task) => task.scope === 'following').length,
            history: tasks.filter((task) => task.scope === 'history').length,
        }),
        [tasks],
    );

    const filteredTasks = useMemo(() => {
        const byNature =
            nature === 'toutes' ? scopeTasks : scopeTasks.filter((task) => task.nature === nature);
        // La recherche porte sur ce que la rangée montre : l'objet, la personne, l'état.
        const needle = query.trim().toLowerCase();
        const selected = needle
            ? byNature.filter((task) =>
                  [task.title, task.who, task.context]
                      .filter(Boolean)
                      .some((field) => (field as string).toLowerCase().includes(needle)),
              )
            : byNature;
        return [...selected].sort((left, right) => {
            const leftDate = left.since ? new Date(left.since).getTime() : Number.POSITIVE_INFINITY;
            const rightDate = right.since
                ? new Date(right.since).getTime()
                : Number.POSITIVE_INFINITY;
            return order === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
        });
    }, [nature, order, query, scopeTasks]);

    useEffect(() => {
        setVisibleCount(TASKS_PAGE_SIZE);
    }, [nature, order, query, scope]);

    const visibleTasks = useMemo(
        () => filteredTasks.slice(0, visibleCount),
        [filteredTasks, visibleCount],
    );

    const activeFilterCount =
        Number(nature !== 'toutes') + Number(order !== 'oldest') + Number(scope !== 'todo');

    /*
      `.ord` — LA LIGNE QUI NOMME CE QU'ON REGARDE, posée au-dessus de la liste.
      C'est elle qui rend la bande du haut silencieuse : la partition, la nature et
      l'ordre n'ont plus besoin d'être des commandes visibles en permanence, ils se
      règlent dans la feuille de filtre et se **lisent** ici. Le sous-titre de l'en-tête
      disparaît avec elle — il disait la même chose une ligne plus haut.
      Quand une nature est posée, le compte devient relatif : « 6 des 17 ».
    */
    const ordLabel = [
        SCOPE_LABEL[scope],
        nature !== 'toutes' ? NATURE_LABEL[nature].toLowerCase() : null,
        order === 'oldest' ? 'les plus anciennes d’abord' : 'les plus récentes d’abord',
    ]
        .filter(Boolean)
        .join(' · ');

    /** Ce que la tâche ouvre quand elle n'a aucune décision à faire prendre. */
    const navigateToTask = (task: Task) => {
        if (task.deviceId) {
            setReviewDeviceId(task.deviceId);
        } else if (task.assign) {
            window.location.hash = `/wizards/assignment?approvalId=${encodeURIComponent(task.assign.approvalId)}`;
        } else if (task.target && task.targetId) {
            onItemClick(task.target, task.targetId);
        } else if (task.target) {
            onNavigate(task.target);
        }
    };

    /**
     * La relance ne prévient personne — il n'y a pas de courrier ici. Elle **date
     * l'insistance**, la rangée l'affiche ensuite, et le journal la garde. Le message
     * dit exactement cela, sans promettre une notification qui n'existe pas.
     */
    const remindTask = (task: Task) => {
        if (!task.remind) return;
        const decision = remindApproval(task.remind.approvalId);
        if (!decision.allowed) {
            showToast(decision.reason || 'Relance impossible.', 'error');
            return;
        }
        showToast('Relance notée sur la demande.', 'success');
    };

    /**
     * **Toute rangée ouvre la feuille** — la planche ne fait pas d'exception : *« son
     * tap ouvre la feuille de la tâche »*. Une rangée sans décision y trouve son
     * contexte et une porte vers l'objet ; ouvrir la feuille pour les unes et partir
     * ailleurs pour les autres ferait deux comportements pour un même geste.
     *
     * La seule exception est la machine remontée par la collecte : elle s'examine dans
     * sa propre feuille (14.1), qui n'est pas celle-ci.
     */
    const openTask = (task: Task) => {
        if (task.deviceId) {
            setReviewDeviceId(task.deviceId);
            return;
        }
        setOpenedTask(task);
    };

    /**
     * Le refus se prend en deux temps : un motif, puis le code personnel. Le motif
     * n'est pas décoratif — `updateApproval` le refuse absent, l'UI n'est donc pas
     * la seule barrière. Lot 5, T3.
     */
    const refuseApprovalTask = (task: Task) => {
        if (!task.refusal) return;
        const decision = updateApproval(task.refusal.approvalId, task.refusal.nextStatus, {
            reason: refusalReason.trim(),
        });
        if (!decision.allowed) {
            showToast(decision.reason || 'Refus impossible.', 'error');
            return;
        }
        setRefusing(null);
        showToast(
            task.refusal.nextStatus === 'Rejected'
                ? 'Demande refusée. Le demandeur lira votre motif.'
                : 'Demande renvoyée à l’IT.',
            'success',
        );
    };

    /**
     * Une annulation n'engage personne d'autre que moi : pas de `SecurityGate`, et le
     * motif est facultatif. Le step-up signe des décisions sur autrui, pas sur soi.
     * Lot 6, A3.
     */
    const cancelApprovalTask = (task: Task) => {
        if (!task.cancel) return;
        const decision = updateApproval(task.cancel.approvalId, 'Cancelled', {
            reason: refusalReason.trim() || undefined,
        });
        if (!decision.allowed) {
            showToast(decision.reason || 'Annulation impossible.', 'error');
            return;
        }
        setCancelling(null);
        showToast('Demande annulée.', 'success');
    };

    const confirmReceptionTask = (task: Task): boolean => {
        if (!task.reception) return false;
        const decision = confirmEquipmentReception(task.reception.equipmentId);
        if (!decision.allowed) {
            showToast(decision.reason || 'Confirmation refusée.', 'error');
            return false;
        }
        showToast('Réception confirmée.', 'success');
        return true;
    };

    const completeApprovalTask = (task: Task): boolean => {
        if (!task.transition) return false;
        const decision = updateApproval(task.transition.approvalId, task.transition.nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(getTransitionSuccessMessage(task.transition.nextStatus), 'success');
        return true;
    };

    const reviewDevice = useMemo(
        () => detectedDevices.find((device) => device.id === reviewDeviceId) ?? null,
        [detectedDevices, reviewDeviceId],
    );

    const clearFilters = () => {
        setNature('toutes');
        setScope('todo');
        setOrder('oldest');
    };

    return (
        <ListTemplate
            title="Tâches"
            /*
              LA BANDE DU HAUT NE PORTE PLUS QUE TROIS CHOSES — le titre, la recherche
              et l'entonnoir (planche 03.3, `.top` + `.frow`). Les trois partitions et
              les cinq natures descendent dans la feuille de filtre : c'était une couche
              de commandes permanente au-dessus de la file, et la file est ce qu'on vient
              lire. Le ⋮ de l'en-tête part avec elles.
            */
            filter={
                /* `.fbtn` — 48 carré, rayon 4, en creux : un remplissage, pas un filet.
                   Son compteur est un carré sombre de 18 (rayon 2), pas une pastille
                   ronde : il compte des filtres, il ne signale pas une alerte. */
                <Button
                    variant="text"
                    aria-label="Filtrer les tâches"
                    onClick={() => setIsFilterSheetOpen(true)}
                    className="bg-surface-container text-on-surface hover:bg-surface-container-high focus-visible:ring-focus-ring relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md p-0 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                    <Icon glyph={Funnel} size={20} />
                    {activeFilterCount > 0 && (
                        <span className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[2px] px-[5px] text-[11px] leading-[18px] font-medium tabular-nums">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            }
            search={{
                value: query,
                onChange: setQuery,
                placeholder: 'Personne, objet, code',
            }}
            /* La ligne `.ord` passe par le décompte du gabarit : c'est le seul rôle
               qu'il pose sur le sol de la page, au-dessus de la carte. Il n'y a plus de
               bouton de tri à sa droite — l'ordre se règle dans la feuille et se lit
               ici, dans la phrase. */
            count={{
                total: filteredTasks.length,
                noun:
                    nature === 'toutes'
                        ? `· ${ordLabel}`
                        : `des ${scopeTasks.length} · ${ordLabel}`,
            }}
            hasRows={visibleTasks.length > 0}
            empty={
                /*
                  LE VIDE EST LE BON ÉTAT, ET IL ARRIVE SOUVENT — la planche ne dit pas
                  « rien », elle dit « à jour ». D'où la pastille **verte de 96**, la
                  teinte de ce qui est en ordre, et non le rond neutre de 112 que
                  l'écran introuvable emploie.
                  Le panneau « Ce qui arrivera ici » tombe : trois lignes qui
                  expliquaient le produit à qui n'a rien à faire. R15 ne veut aucune
                  note dans l'écran, et la planche du 02/09 ne le dessine plus.
                */
                <ScreenState
                    icon={Check}
                    className="[&>span]:h-24 [&>span]:w-24 [&>span]:bg-[var(--tk-color-tint-vert)] [&>span]:text-[var(--tk-color-on-tint-vert)]"
                    title={
                        scope === 'todo'
                            ? 'Vous êtes à jour'
                            : `Aucune tâche ${SCOPE_LABEL[scope].toLowerCase()}`
                    }
                    description={
                        <span className="text-[16px] leading-6">
                            {scope === 'todo'
                                ? 'Rien n’attend votre geste. La file se remplira d’elle-même.'
                                : 'Changez de vue ou de nature.'}
                        </span>
                    }
                />
            }
        >
            {visibleTasks.map((task) => {
                const IconGlyph = task.icon || Package;
                /* Faute d'issue, c'est la nature qui donne sa couleur à la vignette. */
                const tone: TaskTone = task.tone ?? task.nature;

                return (
                    /*
                      `.trow` de la planche 03.3, passe sobre du 02/09 : rangée à plat
                      séparée par un filet, **68 px au minimum**, 16 de gouttière, 12 de
                      remplissage vertical. Le creux du survol déborde de 16 — la mesure
                      du remplissage de la carte, pas 8 : un creux qui s'arrête avant le
                      bord se lit comme une seconde carte.
                      Une rangée qui cite un motif s'aligne en haut : la vignette n'a pas
                      à se centrer sur trois lignes.
                    */
                    <div
                        key={task.id}
                        {...rowActivation(() => openTask(task))}
                        className={cn(
                            'border-outline-variant hover:bg-surface-container/50 -mx-4 flex min-h-[68px] cursor-pointer gap-4 rounded-md border-t px-4 py-3 transition-colors first:border-t-0',
                            task.quote ? 'items-start' : 'items-center',
                            /* `.trow.on` — la rangée tapée reste marquée sous la feuille :
                               en revenant, on retrouve où l'on était. */
                            openedTask?.id === task.id && 'bg-surface-container',
                        )}
                    >
                        {/*
                          LA COULEUR DE LA VIGNETTE DIT LA NATURE. La rangée portait une
                          pastille de mots sous son titre — « Validation », « Remise » —
                          qui redisait en gris ce que le carré de gauche pouvait porter en
                          couleur. La planche la supprime : le carré prend la teinte, et
                          la sous-ligne récupère la place pour dire **qui**.
                        */}
                        <div
                            className={cn(
                                'font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[15px] leading-5 font-semibold',
                                VIG_TINT[tone],
                                task.quote && 'mt-0.5',
                            )}
                        >
                            {task.initials ? (
                                <span>{task.initials}</span>
                            ) : (
                                <Icon glyph={IconGlyph} size={20} />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-on-surface truncate text-[17px] leading-6 tracking-[-0.01em]">
                                {task.title}
                            </p>
                            {/* La sous-ligne : qui, puis l'état en un mot. Deux lignes au
                                plus — au-delà, une rangée n'est plus une rangée. */}
                            <p className="text-on-surface-variant mt-0.5 line-clamp-2 text-[14px] leading-5">
                                {task.who ? (
                                    <>
                                        <b className="text-on-surface font-medium">{task.who}</b> ·{' '}
                                        {task.context}
                                    </>
                                ) : (
                                    task.context
                                )}
                            </p>
                            {/* Le motif d'un refus, cité tel quel et en italique : c'est le
                                seul texte que le demandeur a reçu, l'historique ne le
                                reformule pas (`.tt .q`). */}
                            {task.quote && (
                                <p className="text-on-surface mt-1.5 text-[14px] leading-5 italic">
                                    «&nbsp;{task.quote}&nbsp;»
                                </p>
                            )}
                        </div>

                        {/*
                          À droite, ce que la partition demande. « À faire » et « À suivre »
                          n'ont que l'âge — 12 px, aligné en **haut** de la rangée, parce
                          qu'une file se traite par le haut et que l'âge est le critère de
                          tri. L'historique empile la date de la décision et qui l'a prise
                          (`.rt`, `.by`) : la date, pas l'âge — une décision du 14 août ne
                          se lit pas « 21 j ».
                        */}
                        {task.scope === 'history' ? (
                            <span className="flex shrink-0 flex-col items-end gap-0.5 self-start">
                                <span className="text-on-surface-variant mt-1 text-[12px] leading-4 whitespace-nowrap tabular-nums">
                                    {dateLabel(task.since)}
                                </span>
                                {task.decidedBy && (
                                    <span className="text-text-secondary text-[12px] leading-4 whitespace-nowrap">
                                        {task.decidedBy}
                                    </span>
                                )}
                            </span>
                        ) : task.remind ? (
                            /* `.rt.bell` — l'âge et la cloche, centrés ensemble. C'est le
                               seul acte de « À suivre », et il n'apparaît qu'au-delà du
                               délai (planche 03.3). */
                            <span
                                className="flex shrink-0 items-center gap-1 self-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="text-on-surface-variant text-right text-[12px] leading-4 tabular-nums">
                                    {ageLabel(task.since)}
                                </span>
                                <Button
                                    variant="text"
                                    iconOnly
                                    size="sm"
                                    aria-label={`Relancer — ${task.title}`}
                                    onClick={() => remindTask(task)}
                                >
                                    <Icon glyph={BellRinging} size={20} />
                                </Button>
                            </span>
                        ) : (
                            <span className="text-on-surface-variant mt-1 min-w-8 shrink-0 self-start text-right text-[12px] leading-4 tabular-nums">
                                {ageLabel(task.since)}
                            </span>
                        )}

                        {/* Pas de chevron : la planche n'en dessine aucun. Toute la
                            rangée ouvre déjà — `rowActivation` porte le rôle, la
                            tabulation et la touche Entrée — et un chevron par rangée
                            faisait vingt glyphes de plus pour ne rien ajouter. */}
                    </div>
                );
            })}

            {visibleTasks.length < filteredTasks.length && (
                <Button
                    variant="text"
                    onClick={() => setVisibleCount((count) => count + TASKS_PAGE_SIZE)}
                    className="border-outline-variant text-on-surface min-h-12 w-full justify-between rounded-none border-t px-0 text-[15px] leading-5 font-medium"
                >
                    {/*
                      `.pag` — la file **pagine, elle ne synthétise pas** (règle de 03.3).
                      Le geste et le repère ne sont pas au même rang : « Voir les 11
                      suivantes » se vise à 15 px, « 6 sur 17 » se lit à 12. La planche
                      les met aux deux bouts de la ligne, pas côte à côte au centre.
                    */}
                    <span>
                        Voir les{' '}
                        {Math.min(TASKS_PAGE_SIZE, filteredTasks.length - visibleTasks.length)}{' '}
                        suivantes
                    </span>
                    <span className="text-on-surface-variant text-[12px] leading-4 font-normal tabular-nums">
                        {visibleTasks.length} sur {filteredTasks.length}
                    </span>
                </Button>
            )}

            {/* La machine remontée s'examine où elle attend — 14.1 a sorti la file de
                Paramètres, et un geste ne traverse pas l'application pour dire oui. */}
            <BottomSheet
                open={reviewDevice !== null}
                onClose={() => setReviewDeviceId(null)}
                title={reviewDevice?.machineName || 'Machine détectée'}
            >
                {reviewDevice && (
                    <div className="flex flex-col gap-4">
                        <dl className="flex flex-col">
                            {[
                                ['Nom réseau', reviewDevice.hostname],
                                ['Identifiant', reviewDevice.assetId],
                                ['Numéro de série', reviewDevice.serialNumber],
                                ['Système', reviewDevice.os],
                                [
                                    'Emplacement',
                                    [reviewDevice.country, reviewDevice.site, reviewDevice.service]
                                        .filter(Boolean)
                                        .join(' · '),
                                ],
                                ['Vue pour la dernière fois', ageLabel(reviewDevice.lastSeenAt)],
                            ]
                                .filter(([, value]) => Boolean(value))
                                .map(([label, value]) => (
                                    <div
                                        key={String(label)}
                                        className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-2 text-[16px] leading-6 first:border-t-0"
                                    >
                                        <dt className="text-text-secondary shrink-0">{label}</dt>
                                        <dd className="text-on-surface min-w-0 text-right font-medium break-words">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                        </dl>

                        {reviewDevice.status === 'ambiguous_match' && (
                            <p className="bg-surface-container text-text-secondary rounded-md px-4 py-2 text-[12px] leading-4">
                                Plusieurs actifs du parc lui ressemblent. L'importer en créerait un
                                de plus — vérifiez d'abord lequel elle est.
                            </p>
                        )}

                        <div className="border-outline-variant flex items-center gap-3 border-t pt-4">
                            <Button
                                variant="text"
                                onClick={() => {
                                    const ok = markDetectedDeviceAsIgnored(reviewDevice.id);
                                    showToast(
                                        ok ? 'Machine ignorée.' : 'Action refusée.',
                                        ok ? 'success' : 'warning',
                                    );
                                    setReviewDeviceId(null);
                                }}
                            >
                                Ignorer
                            </Button>
                            <Button
                                variant="filled"
                                className="flex-1"
                                onClick={() => {
                                    const result = promoteDetectedDeviceToInventory(
                                        reviewDevice.id,
                                    );
                                    showToast(result.message, result.ok ? 'success' : 'error');
                                    if (result.ok) setReviewDeviceId(null);
                                }}
                            >
                                Importer au parc
                            </Button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
            >
                {/*
                  LA FEUILLE PORTE LES TROIS RÉGLAGES, DANS L'ORDRE DE LA PLANCHE :
                  **Où** — les trois partitions, qui étaient au ⋮ de l'en-tête —, **Nature**
                  — les cinq puces, qui étaient dans la bande — et **Ordre**. C'est ce qui
                  vide la bande du haut, et c'est le seul endroit où ces trois réglages se
                  posent : la file, elle, se lit.
                  « Historique » ne porte pas de décompte : on n'y vient pas pour compter,
                  on y vient pour retrouver.
                  Le remplissage latéral vient de la feuille elle-même — l'écrire encore
                  ici le doublait à 40.
                */}
                <div className="flex flex-col gap-6">
                    <div>
                        <p className={FILTER_HEADING}>Où</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.keys(SCOPE_LABEL) as TaskScope[]).map((taskScope) => (
                                <Button
                                    key={taskScope}
                                    variant={scope === taskScope ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setScope(taskScope)}
                                    className={sheetChip(scope === taskScope)}
                                >
                                    {SCOPE_LABEL[taskScope]}
                                    {taskScope !== 'history' && (
                                        <b className={chipCount(scope === taskScope)}>
                                            {scopeCounts[taskScope]}
                                        </b>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={FILTER_HEADING}>Nature</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                                variant={nature === 'toutes' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setNature('toutes')}
                                className={sheetChip(nature === 'toutes')}
                            >
                                Tout
                                <b className={chipCount(nature === 'toutes')}>
                                    {scopeTasks.length}
                                </b>
                            </Button>
                            {(Object.keys(NATURE_LABEL) as TaskNature[]).map((taskNature) => (
                                <Button
                                    key={taskNature}
                                    variant={nature === taskNature ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setNature(taskNature)}
                                    className={sheetChip(nature === taskNature)}
                                >
                                    {NATURE_LABEL[taskNature]}
                                    <b className={chipCount(nature === taskNature)}>
                                        {counts[taskNature]}
                                    </b>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={FILTER_HEADING}>Ordre</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(
                                [
                                    ['oldest', 'Les plus anciennes'],
                                    ['newest', 'Les plus récentes'],
                                ] as const
                            ).map(([value, label]) => (
                                <Button
                                    key={value}
                                    variant={order === value ? 'tonal' : 'text'}
                                    size="sm"
                                    onClick={() => setOrder(value)}
                                    className={sheetChip(order === value)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* `.sfoot` — deux gestes de même largeur, pas un ghost serré contre
                        un bouton étiré : ils se valent, la grille le dit. */}
                    <div className="border-outline-variant grid grid-cols-2 gap-3 border-t pt-4">
                        <Button variant="ghost" onClick={clearFilters} className="h-12">
                            Tout effacer
                        </Button>
                        <Button
                            variant="tonal"
                            className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 h-12"
                            onClick={() => setIsFilterSheetOpen(false)}
                        >
                            Voir les {filteredTasks.length}
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/*
              **La feuille d'une tâche** — planche 03.3, colonne « État — la feuille d'une
              demande ». Un tap sur la rangée l'ouvre, et elle tient en trois temps :
              l'en-tête dit le sujet et qui l'a demandé, le contexte donne les trois faits
              qui évitent d'ouvrir la fiche, et les deux décisions ont la même largeur.
              Le oui ne décide pas seul : il **conduit à l'attestation** (06.2), la feuille
              ne l'embarque pas.
            */}
            <BottomSheet open={!!openedTask} onClose={() => setOpenedTask(null)}>
                {openedTask && (
                    <div className="-mx-1 -my-2">
                        {/* `.sttl` — la vignette reprend la teinte de la nature, comme
                            dans la rangée : on retrouve la tâche qu'on vient de taper. */}
                        <div className="flex items-start gap-3 pb-3">
                            <span
                                className={cn(
                                    'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold',
                                    VIG_TINT[openedTask.nature],
                                )}
                            >
                                {openedTask.initials ?? (
                                    <Icon glyph={openedTask.icon ?? ClipboardText} size={20} />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-on-surface text-[17px] leading-6 font-medium">
                                    {openedTask.title}
                                </p>
                                <p className="text-text-secondary mt-0.5 text-[14px] leading-5">
                                    {openedTask.askedBy ?? openedTask.context}
                                    {/* Une décision se date, elle ne se compte pas en jours :
                                        « le 14 août », pas « il y a 21 j » (planche 03.3). */}
                                    {openedTask.since
                                        ? openedTask.scope === 'history'
                                            ? ` · le ${dateLabel(openedTask.since)}`
                                            : ` · il y a ${ageLabel(openedTask.since)}`
                                        : ''}
                                </p>
                            </div>
                            <CloseButton onClick={() => setOpenedTask(null)} />
                        </div>

                        {(openedTask.reason || openedTask.detail) && (
                            <div className="bg-surface-container flex flex-col gap-2 rounded-md p-4">
                                {openedTask.reason && (
                                    <p className="text-on-surface text-[16px] leading-6 italic">
                                        «&nbsp;{openedTask.reason}&nbsp;»
                                    </p>
                                )}
                                {openedTask.detail && (
                                    <p className="text-text-secondary text-[14px] leading-5">
                                        {openedTask.who ? `${openedTask.who} ` : ''}
                                        {openedTask.detail}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* `.sfoot` — deux décisions de même largeur. Le non est sombre,
                            le oui porte le seul jaune de la feuille. */}
                        <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                            {openedTask.refusal ? (
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={X} size={20} />}
                                    className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
                                    onClick={() => {
                                        setRefusalReason('');
                                        setRefusing(openedTask);
                                        setOpenedTask(null);
                                    }}
                                >
                                    {openedTask.refusal.nextStatus === 'Rejected'
                                        ? 'Refuser'
                                        : 'Renvoyer'}
                                </Button>
                            ) : openedTask.cancel ? (
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={X} size={20} />}
                                    className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90"
                                    onClick={() => {
                                        setRefusalReason('');
                                        setCancelling(openedTask);
                                        setOpenedTask(null);
                                    }}
                                >
                                    Annuler
                                </Button>
                            ) : (
                                <Button variant="outlined" onClick={() => setOpenedTask(null)}>
                                    Fermer
                                </Button>
                            )}

                            {openedTask.transition ? (
                                <SecurityGate
                                    onVerified={() => {
                                        if (completeApprovalTask(openedTask)) setOpenedTask(null);
                                    }}
                                    title={openedTask.action ?? 'Confirmer'}
                                    description="Confirmez cette action avant de la rendre effective."
                                    entityId={openedTask.transition.approvalId}
                                    entityName={openedTask.title}
                                    trigger={
                                        <Button variant="filled" icon={<Icon glyph={Check} size={20} />}>
                                            {openedTask.action}
                                        </Button>
                                    }
                                />
                            ) : openedTask.reception ? (
                                <SecurityGate
                                    onVerified={() => {
                                        if (confirmReceptionTask(openedTask)) setOpenedTask(null);
                                    }}
                                    title={openedTask.action ?? 'Confirmer'}
                                    description="Confirmez cette action avant de la rendre effective."
                                    entityId={openedTask.reception.equipmentId}
                                    entityName={openedTask.title}
                                    trigger={
                                        <Button variant="filled" icon={<Icon glyph={Check} size={20} />}>
                                            {openedTask.action}
                                        </Button>
                                    }
                                />
                            ) : openedTask.assign || openedTask.target ? (
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={Check} size={20} />}
                                    onClick={() => {
                                        const task = openedTask;
                                        setOpenedTask(null);
                                        navigateToTask(task);
                                    }}
                                >
                                    {openedTask.action ?? 'Ouvrir'}
                                </Button>
                            ) : null}
                        </div>

                        {/* `.pinl` — le oui ne signe pas ici : il ouvre l'attestation. */}
                        {(openedTask.transition || openedTask.reception) && (
                            <p className="text-text-secondary mt-3 text-center text-[14px] leading-5">
                                {openedTask.action} ouvre l'attestation — signature ou code
                                personnel, au choix.
                            </p>
                        )}
                    </div>
                )}
            </BottomSheet>

            {/* Feuille — refuser, ou renvoyer à l'IT. Le motif est obligatoire : le
                demandeur le lira tel quel, et la règle le refuse absent. Lot 5, T3. */}
            <BottomSheet
                open={!!refusing}
                onClose={() => setRefusing(null)}
                title={
                    refusing?.refusal?.nextStatus === 'Rejected'
                        ? 'Refuser la demande'
                        : 'Renvoyer à l’IT'
                }
            >
                {refusing?.refusal && (
                    <div className="space-y-4">
                        <p className="text-text-secondary text-[16px] leading-6">
                            {refusing.title}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-[var(--tk-color-tint-danger)] px-4 py-2 text-[12px] leading-4 font-medium text-[var(--tk-color-on-tint-danger)]">
                            <Icon glyph={Prohibit} size={18} />
                            {refusing.refusal.nextStatus === 'Rejected'
                                ? `Définitif — ${refusing.refusal.requesterName} lira votre motif, tel quel.`
                                : 'La demande repart au traitement IT avec votre motif.'}
                        </p>
                        <label className="block">
                            <span className="text-text-muted mb-2 block text-[12px] leading-4 font-medium tracking-[0.06em] uppercase">
                                Motif{' '}
                                <span className="text-text-secondary font-normal tracking-normal normal-case">
                                    — obligatoire
                                </span>
                            </span>
                            <textarea
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                rows={3}
                                placeholder="Budget gelé jusqu'au prochain exercice…"
                                className="border-outline bg-surface text-on-surface focus:border-primary w-full rounded-md border p-4 text-[16px] leading-6 focus:outline-hidden"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button variant="text" onClick={() => setRefusing(null)}>
                                Annuler
                            </Button>
                            <SecurityGate
                                onVerified={() => refuseApprovalTask(refusing)}
                                title="Confirmer le refus"
                                description="Votre code personnel signe la décision."
                                entityId={refusing.refusal.approvalId}
                                entityName={refusing.title}
                                trigger={
                                    <Button variant="danger" disabled={!refusalReason.trim()}>
                                        {refusing.refusal.nextStatus === 'Rejected'
                                            ? 'Refuser'
                                            : 'Renvoyer'}
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* Feuille — annuler ma demande. Motif facultatif, aucun code : je ne signe
                pas une décision sur autrui, je retire la mienne. Lot 6, A3. */}
            <BottomSheet
                open={!!cancelling}
                onClose={() => setCancelling(null)}
                title="Annuler ma demande"
            >
                {cancelling?.cancel && (
                    <div className="space-y-4">
                        <p className="text-text-secondary text-[16px] leading-6">
                            {cancelling.title}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-4 py-2 text-[12px] leading-4 font-medium text-[var(--tk-color-on-tint-ambre)]">
                            <Icon glyph={ArrowCounterClockwise} size={18} />
                            Rien n'est perdu — vous pourrez redemander. La personne qui l'examinait
                            ne la verra plus.
                        </p>
                        <label className="block">
                            <span className="text-text-muted mb-2 block text-[12px] leading-4 font-medium tracking-[0.06em] uppercase">
                                Motif{' '}
                                <span className="text-text-secondary font-normal tracking-normal normal-case">
                                    — facultatif
                                </span>
                            </span>
                            <textarea
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                rows={2}
                                placeholder="Plus besoin, j'ai trouvé un poste libre…"
                                className="border-outline bg-surface text-on-surface focus:border-primary w-full rounded-md border p-4 text-[16px] leading-6 focus:outline-hidden"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button variant="text" onClick={() => setCancelling(null)}>
                                Garder la demande
                            </Button>
                            <Button variant="danger" onClick={() => cancelApprovalTask(cancelling)}>
                                Annuler la demande
                            </Button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </ListTemplate>
    );
};

export default TasksPage;
