import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowCounterClockwise,
    BellRinging,
    Check,
    ClipboardText,
    Funnel,
    Package,
    Pause,
    Prohibit,
    SortAscending,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import FilterButton from '../../../components/ui/FilterButton';
import FacetChip from '../../../components/ui/FacetChip';
import SelectableRow, { SelectionBox } from '../../../components/ui/SelectableRow';
import { useSelection } from '../../../hooks/useSelection';
import { buildCsvLine } from '../../../lib/csv';
import Icon from '../../../components/ui/Icon';
import BottomSheet from '../../../components/ui/BottomSheet';
import ActSheet from '../../../components/ui/ActSheet';
import { DECISION_A_L_ECRAN } from '../../../lib/attestation';
import Modal from '../../../components/ui/Modal';
import Onglets from '../../../components/ui/Onglets';
import SearchField from '../../../components/ui/SearchField';
import Touche from '../../../components/ui/Touche';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useEchap } from '../../../hooks/useEchap';
import { useDerniereValeur } from '../../../hooks/useDerniereValeur';
import { avecObjetOuvert, useObjetOuvert } from '../../../hooks/useObjetOuvert';
import { MEDIA } from '../../../constants/breakpoints';
import { RACCOURCI_RECHERCHE, toucheSimplePourLaPage } from '../../../lib/clavier';
import { ApprovalStatus, AttestationMethod, ViewType } from '../../../types';
import { cn } from '../../../lib/utils';
import { NOM_SUR_UNE_LIGNE, infobulle } from '../../../lib/nomLong';
import PanneauDeTache, { type EtatDuRefus } from '../components/PanneauDeTache';
import BandeauAnnuler from '../components/BandeauAnnuler';
import { useDecisionDifferee } from '../hooks/useDecisionDifferee';
import { useFileDeTaches } from '../hooks/useFileDeTaches';
import {
    GROUPE_LABEL,
    NATURE_LABEL,
    NATURE_MOT,
    SCOPE_LABEL,
    ageLabel,
    daysSince,
    groupeDe,
    ordonnerLaFile,
    palierDe,
    type GroupeDeFile,
    type Palier,
    type Task,
    type TaskNature,
    type TaskOrder,
    type TaskScope,
} from '../lib/file';

/**
 * **La couleur de la vignette dit la nature** — `.vig.val`, `.rem`, `.rec`, `.ret` de la
 * planche 03.3, passe sobre du 02/09. Une paire = un fond et l'encre qui tient dessus ; le
 * socle les déclare ensemble pour qu'aucune ne dérive sans l'autre. (`.ok` et `.no`, les
 * issues d'une demande close, sont partis avec l'historique de la file, le 08/10.)
 */
const VIG_TINT: Record<TaskNature, string> = {
    validation: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    remise: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    reception: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    retour: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    collecte: 'bg-[var(--tk-color-surface-muted-strong)] text-on-surface-variant',
    reparation: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
};

/**
 * **L'âge dit ce qui presse** (26/09) : gris le jour même, ambre dans la semaine, rouge
 * au-delà de sept jours — et le groupe « En retard » le redit en toutes lettres.
 */
const AGE_TON: Record<Palier, string> = {
    frais: 'text-text-tertiary',
    ambre: 'text-[var(--tk-color-st-ambre)] font-medium',
    rouge: 'text-[var(--tk-color-st-rouge)] font-semibold',
};

/**
 * L'intitulé d'un groupe de la feuille de filtre prend **`.lab`** — 12 sur 16 en 500,
 * encre secondaire, sans capitales (arbitré le 13/09 contre `.fh`).
 */
const FILTER_HEADING = 'text-text-muted text-[0.75rem] leading-4 font-medium';

const ORDRE_LABEL: Record<TaskOrder, string> = {
    urgence: 'Ce qui presse d’abord',
    oldest: 'Les plus anciennes',
    newest: 'Les plus récentes',
};

/** L'ordre suivant, au clic sur le tri du bureau — trois crans, dans cet ordre. */
const ORDRE_SUIVANT: Record<TaskOrder, TaskOrder> = {
    urgence: 'oldest',
    oldest: 'newest',
    newest: 'urgence',
};

/** « Toutes », « Urgentes », « En retard » — les puces de la ligne d'outils (26/09). */
type Presse = 'toutes' | 'urgentes' | 'retard';

const PRESSE_LABEL: Record<Presse, string> = {
    toutes: 'Toutes',
    urgentes: 'Urgentes',
    retard: 'En retard',
};

const TASKS_PAGE_SIZE = 30;

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

/**
 * Ce que le bandeau « Annuler » dit d'une décision prise dans le panneau — la forme de la
 * maquette : *« Remis à Ethan Employé · LPT-HQ-07 »*, le verbe, la personne, l'objet.
 */
const messageDeLaDecision = (task: Task, statut: ApprovalStatus): string => {
    const verbe =
        statut === 'WAITING_IT_PROCESSING' && task.refusal?.nextStatus !== statut
            ? 'Validée'
            : statut === 'PENDING_DELIVERY'
              ? 'Dotation validée'
              : statut === 'Completed'
                ? 'Réception confirmée'
                : statut === 'Rejected'
                  ? 'Refusée'
                  : 'Renvoyée à l’informatique';
    const pour =
        task.who && task.who !== 'ma demande' && !verbe.startsWith('Renvoyée')
            ? ` pour ${task.who}`
            : '';
    return `${verbe}${pour} · ${task.title}${task.force ? ` — à la place de ${task.force}` : ''}`;
};

/** Les touches de la file, telles que l'aide les liste (« ? »). */
const TOUCHES: [string[], string][] = [
    [['J', 'K'], 'Tâche suivante, tâche précédente'],
    [['A'], 'L’acte principal — valider, remettre, confirmer'],
    [['R'], 'Refuser, avec son motif'],
    [['X'], 'Sélectionner la tâche'],
    [['Z'], 'Annuler la dernière décision, pendant cinq secondes'],
    [['Échap'], 'Refermer le motif, puis la tâche'],
    [[RACCOURCI_RECHERCHE], 'Chercher dans la file'],
    [['?'], 'Cette aide'],
];

interface TasksPageProps {
    onNavigate: (view: ViewType) => void;
    onItemClick: (view: ViewType, id: string) => void;
    /** Revenir d'où l'on vient — la flèche de l'en-tête (08/10 : partout sauf à l'accueil). */
    onBack?: () => void;
}

/**
 * Tâches — la boîte de travail unique, planche 03.3, **passe sobre du 02/09**, et sa
 * **refonte du bureau du 26/09**.
 *
 * *Une recherche, un filtre, une rangée.*
 *
 * Au téléphone : la bande du haut porte le titre, la recherche et l'entonnoir ; une ligne
 * nomme ce qu'on regarde (`.ord`) ; la rangée est un sujet — l'objet en titre, la personne
 * et l'état en sous-ligne, l'âge à droite ; son tap ouvre la feuille de la tâche, ou
 * l'écran de la demande (06.5).
 *
 * **Au bureau (dès 840), la file se traite sans la quitter** (26/09) :
 *
 * · **« À faire » est ce que vous pouvez faire**, et le badge de la barre compte la même
 *   chose — la file est construite une fois (`useFileDeTaches`) ;
 * · **la file dit ce qui presse** : groupes « En retard · Cette semaine · Aujourd'hui »,
 *   l'âge coloré, la marque « Urgent », la nature écrite ; 400 px, la tâche prend le reste ;
 * · **le panneau de décision** montre les faits, l'unité à remettre et le parcours, et
 *   un seul acte appuyé ;
 * · **la file s'enchaîne** : après une décision, la tâche suivante s'ouvre ; valider et
 *   refuser se défont pendant cinq secondes au lieu d'être confirmés avant ;
 * · **le clavier** (J/K, A, R, Entrée, X, Z, ?) et **la validation en lot**.
 *
 * La tâche ouverte vit dans l'adresse (`?ouvert=`) : un rechargement la retrouve, et la
 * feuille de remise ouverte depuis le panneau laisse la file dessous.
 */
const TasksPage: React.FC<TasksPageProps> = ({ onNavigate, onItemClick, onBack }) => {
    const {
        updateApproval,
        confirmEquipmentReception,
        remindApproval,
        promoteDetectedDeviceToInventory,
        markDetectedDeviceAsIgnored,
    } = useData();
    const { user: currentUser, permissions } = useAccessControl();
    const { showToast } = useToast();

    const [nature, setNature] = useState<TaskNature | 'toutes'>('toutes');
    const [scope, setScope] = useState<TaskScope>('todo');
    /* La recherche que `.srch` dessine sur la planche — « Personne, objet, code ». */
    const [query, setQuery] = useState('');
    const [order, setOrder] = useState<TaskOrder>('urgence');
    const [presse, setPresse] = useState<Presse>('toutes');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    // Feuille de motif du refus (téléphone) : la tâche visée, et le texte que le demandeur lira.
    const [refusing, setRefusing] = useState<Task | null>(null);
    /* Les feuilles gardent leur tâche le temps de redescendre (26/09). */
    const refusAffiche = useDerniereValeur(refusing);
    const [refusalReason, setRefusalReason] = useState('');
    const [cancelling, setCancelling] = useState<Task | null>(null);
    /**
     * L'acte engagé depuis une tâche — planche **17.4**. Au bureau, il ne reste que les
     * réceptions : on atteste avoir reçu. Valider et refuser se défont désormais au lieu de
     * s'attester (26/09) ; la remise s'atteste dans sa propre feuille.
     */
    const [acte, setActe] = useState<Task | null>(null);
    const acteAffiche = useDerniereValeur(acte);
    /* 17.2 — la file est l'un des quatre écrans qui portent la sélection groupée. */
    const selection = useSelection();
    /** Au téléphone, la tâche ouverte en feuille. Au bureau, elle vit dans l'adresse. */
    const [feuille, setFeuille] = useState<Task | null>(null);
    const [aideOuverte, setAideOuverte] = useState(false);
    const [refus, setRefus] = useState<EtatDuRefus>({ ouvert: false, motif: '' });

    /**
     * **La file et la tâche choisie côte à côte, dès 840** — 03.3, colonne bureau : *« une
     * boîte de travail se traite sans quitter la page »*. 360 px sous 1 200, 400 au-delà.
     */
    const enPanneau = useMediaQuery(MEDIA.expandedUp);
    /* Les marques des touches et la case au survol : sous un pointeur fin seulement. */
    const souris = useMediaQuery(MEDIA.hoverCapable);
    const { ouvert: ouverteId, ouvrir: ouvrirId, fermer: fermerId } = useObjetOuvert();
    const [visibleCount, setVisibleCount] = useState(TASKS_PAGE_SIZE);

    const { enSuspens, decider, annuler } = useDecisionDifferee((motif) =>
        showToast(motif, 'error'),
    );
    const masques = useMemo(() => new Set(enSuspens?.tachesIds ?? []), [enSuspens]);

    const tasks = useFileDeTaches();
    /* La feuille du téléphone suit la file — un changement venu d'ailleurs s'y lit — et
       garde sa tâche le temps de redescendre. */
    const feuilleAffichee = useDerniereValeur(
        feuille ? (tasks.find((tache) => tache.id === feuille.id) ?? feuille) : null,
    );

    /* Une décision qui attend son écriture a déjà quitté la file : les comptes le disent. */
    const presentes = useMemo(
        () => (masques.size > 0 ? tasks.filter((task) => !masques.has(task.id)) : tasks),
        [masques, tasks],
    );
    const scopeTasks = useMemo(
        () => presentes.filter((task) => task.scope === scope),
        [presentes, scope],
    );
    const counts = useMemo(() => {
        const next: Record<TaskNature, number> = {
            validation: 0,
            collecte: 0,
            remise: 0,
            reception: 0,
            retour: 0,
            reparation: 0,
        };
        scopeTasks.forEach((task) => {
            next[task.nature] += 1;
        });
        return next;
    }, [scopeTasks]);

    const scopeCounts = useMemo(
        () => ({
            todo: presentes.filter((task) => task.scope === 'todo').length,
            following: presentes.filter((task) => task.scope === 'following').length,
        }),
        [presentes],
    );

    const presseCounts = useMemo(
        () => ({
            urgentes: scopeTasks.filter((task) => task.urgent).length,
            retard: scopeTasks.filter((task) => groupeDe(task) === 'retard').length,
        }),
        [scopeTasks],
    );

    const enGroupes = order === 'urgence';

    const filteredTasks = useMemo(() => {
        const byNature =
            nature === 'toutes' ? scopeTasks : scopeTasks.filter((task) => task.nature === nature);
        const byPresse =
            presse === 'urgentes'
                ? byNature.filter((task) => task.urgent)
                : presse === 'retard'
                  ? byNature.filter((task) => groupeDe(task) === 'retard')
                  : byNature;
        // La recherche porte sur ce que la rangée montre : l'objet, la personne, l'état.
        const needle = query.trim().toLowerCase();
        const selected = needle
            ? byPresse.filter((task) =>
                  [task.title, task.who, task.context, task.reason, NATURE_MOT[task.nature]]
                      .filter(Boolean)
                      .some((field) => (field as string).toLowerCase().includes(needle)),
              )
            : byPresse;
        return ordonnerLaFile(selected, order);
    }, [nature, order, presse, query, scopeTasks]);

    useEffect(() => {
        setVisibleCount(TASKS_PAGE_SIZE);
    }, [nature, order, presse, query, scope]);

    /* Au bureau, la nature n'a plus de menu (elle se lit sur la rangée et se cherche par son
       nom) : un filtre posé au téléphone ne doit pas y rester invisible. */
    useEffect(() => {
        if (enPanneau) setNature('toutes');
    }, [enPanneau]);

    const visibleTasks = useMemo(
        () => filteredTasks.slice(0, visibleCount),
        [filteredTasks, visibleCount],
    );

    const groupCounts = useMemo(() => {
        const next: Record<GroupeDeFile, number> = { retard: 0, semaine: 0, aujourdhui: 0 };
        filteredTasks.forEach((task) => {
            next[groupeDe(task)] += 1;
        });
        return next;
    }, [filteredTasks]);

    /**
     * **La tâche ouverte, au bureau.** Elle est lue dans l'adresse, et **dans la file
     * affichée** : une tâche d'un autre onglet, filtrée ou décidée n'est plus ouverte.
     */
    const openedTask = enPanneau
        ? (filteredTasks.find((task) => task.id === ouverteId) ?? null)
        : feuille;

    /*
      **La file s'enchaîne** (26/09). Quand la tâche ouverte quitte la file — décidée,
      filtrée, passée dans un autre onglet —, celle qui prend sa place s'ouvre ; en
      arrivant, la première. Seul Échap laisse le panneau vide, jusqu'au prochain choix.
      Changer d'onglet, de filtre ou d'ordre repart du haut de la file.
    */
    const derniere = useRef<number | null>(null);
    const fermeeExpres = useRef(false);
    useEffect(() => {
        derniere.current = null;
        fermeeExpres.current = false;
    }, [scope, nature, presse, query, order]);
    useEffect(() => {
        if (!enPanneau) {
            /* Au téléphone, l'adresse ouvre la feuille de la tâche — un avis qu'on touche —,
               puis s'efface : la feuille ne vit pas dans l'adresse. */
            if (ouverteId) {
                const visee = tasks.find((task) => task.id === ouverteId);
                if (visee) setFeuille(visee);
                fermerId();
            }
            return;
        }
        if (selection.isActive) return;
        if (ouverteId) {
            const index = filteredTasks.findIndex((task) => task.id === ouverteId);
            if (index >= 0) {
                derniere.current = index;
                return;
            }
        } else if (fermeeExpres.current) return;
        const suivante =
            filteredTasks[Math.min(derniere.current ?? 0, Math.max(0, filteredTasks.length - 1))];
        if (suivante) {
            if (suivante.id !== ouverteId) ouvrirId(suivante.id);
        } else if (ouverteId) fermerId();
    }, [enPanneau, fermerId, filteredTasks, ouverteId, ouvrirId, selection.isActive, tasks]);

    /* Une autre tâche : le motif en cours ne la suit pas. */
    useEffect(() => {
        setRefus({ ouvert: false, motif: '' });
    }, [openedTask?.id]);

    const ouvrir = useCallback(
        (task: Task) => {
            fermeeExpres.current = false;
            ouvrirId(task.id);
            window.requestAnimationFrame(() =>
                document.getElementById(`tache-${task.id}`)?.scrollIntoView({ block: 'nearest' }),
            );
        },
        [ouvrirId],
    );

    const activeFilterCount =
        Number(nature !== 'toutes') +
        Number(order !== 'urgence') +
        Number(scope !== 'todo') +
        Number(presse !== 'toutes');

    /*
      `.ord` — LA LIGNE QUI NOMME CE QU'ON REGARDE, posée au-dessus de la liste. Quand une
      nature est posée, le compte devient relatif : « 6 des 17 ».
    */
    const ordLabel = [
        SCOPE_LABEL[scope],
        nature !== 'toutes' ? NATURE_LABEL[nature].toLowerCase() : null,
        presse === 'urgentes' ? 'urgentes' : presse === 'retard' ? 'en retard' : null,
        `${ORDRE_LABEL[order].toLowerCase()}${order === 'urgence' ? '' : ' d’abord'}`,
    ]
        .filter(Boolean)
        .join(' · ');

    /** Ce que la tâche ouvre quand elle n'a aucune décision à faire prendre. */
    const navigateToTask = (task: Task) => {
        if (task.deviceId) {
            setFeuille(task);
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
     * l'insistance**, la rangée l'affiche ensuite, et le journal la garde.
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
     * **Exporter la sélection** — il ne change rien : c'est pourquoi il peut être groupé
     * sans qu'on ait à trancher la question de l'attestation.
     */
    const exporterSelection = () => {
        const choisies = filteredTasks.filter((task) => selection.isSelected(task.id));
        if (choisies.length === 0) {
            showToast('Aucune tâche sélectionnée.', 'info');
            return;
        }

        const entetes = ['Nature', 'Objet', 'Personne', 'Contexte', 'Depuis', 'Partition'];
        const lignes = choisies.map((task) => [
            task.nature,
            task.title,
            task.who || '',
            task.context || '',
            task.since || '',
            task.scope,
        ]);

        const csv = [buildCsvLine(entetes), ...lignes.map((ligne) => buildCsvLine(ligne))].join(
            '\n',
        );
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `taches-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(url);

        showToast(`${choisies.length} tâche(s) exportée(s).`, 'success');
        selection.exit();
    };

    /**
     * **Valider en lot** (26/09) — plusieurs validations **de même nature**, d'un geste,
     * et défaisables comme une seule. Les remises n'en sont pas : chacune s'atteste.
     */
    const validationsChoisies = filteredTasks.filter((task) => selection.isSelected(task.id));
    const enLot =
        enPanneau &&
        validationsChoisies.length > 0 &&
        validationsChoisies.every(
            (task) =>
                task.scope === 'todo' &&
                task.nature === 'validation' &&
                task.transition &&
                !task.force,
        ) &&
        new Set(validationsChoisies.map((task) => task.transition?.nextStatus)).size === 1;

    const validerEnLot = () => {
        const lot = validationsChoisies;
        const n = lot.length;
        decider({
            message: `${n} demande${n > 1 ? 's' : ''} validée${n > 1 ? 's' : ''}`,
            tachesIds: lot.map((task) => task.id),
            ecrire: () => {
                const refusees = lot
                    .map((task) =>
                        task.transition
                            ? updateApproval(
                                  task.transition.approvalId,
                                  task.transition.nextStatus,
                                  {
                                      method: DECISION_A_L_ECRAN,
                                  },
                              )
                            : { allowed: true },
                    )
                    .filter((decision) => !decision.allowed);
                return refusees.length > 0
                    ? `${refusees.length} validation${refusees.length > 1 ? 's' : ''} refusée${refusees.length > 1 ? 's' : ''} par la règle. ${refusees[0].reason ?? ''}`.trim()
                    : null;
            },
        });
        selection.exit();
    };

    /** Valider — ou confirmer à la place du bénéficiaire —, défaisable cinq secondes. */
    const validerDiffere = (task: Task) => {
        if (!task.transition) return;
        const { approvalId, nextStatus } = task.transition;
        decider({
            message: messageDeLaDecision(task, nextStatus),
            tachesIds: [task.id],
            ecrire: () => {
                /* Au bureau, sans code : la session et les cinq secondes en tiennent lieu, et
                   le journal le dit (08/10). */
                const decision = updateApproval(approvalId, nextStatus, {
                    method: DECISION_A_L_ECRAN,
                });
                return decision.allowed ? null : decision.reason || 'Action non autorisée.';
            },
            surAnnulation: () => ouvrir(task),
        });
    };

    /** Refuser, ou renvoyer une dotation — le motif écrit dans le pied du panneau. */
    const refuserDiffere = (task: Task, motif: string) => {
        if (!task.refusal) return;
        const { approvalId, nextStatus } = task.refusal;
        decider({
            message: messageDeLaDecision(task, nextStatus),
            tachesIds: [task.id],
            ecrire: () => {
                const decision = updateApproval(approvalId, nextStatus, {
                    reason: motif.trim(),
                    method: DECISION_A_L_ECRAN,
                });
                return decision.allowed ? null : decision.reason || 'Refus impossible.';
            },
            surAnnulation: () => ouvrir(task),
        });
    };

    /**
     * **Remettre depuis le panneau** : la feuille de remise (17.4) s'ouvre avec la demande et
     * la personne ; **l'unité s'y choisit** (08/10 — le panneau en proposait trois, ce qui
     * surchargeait le détail et doublait la feuille). `ouvert=` suit
     * l'adresse de la feuille : la file reste dessous, et y revient en la refermant.
     */
    const remettre = (task: Task) => {
        if (!task.assign) return;
        const parametres = new URLSearchParams({
            approvalId: task.assign.approvalId,
            userId: task.assign.beneficiaryId,
            category: task.assign.category,
        });
        window.location.hash = avecObjetOuvert(`/wizards/assignment?${parametres.toString()}`);
    };

    /** L'acte principal de la tâche ouverte — le bouton appuyé du pied, et la touche A. */
    const faireLePrincipal = (task: Task) => {
        if (task.deviceId) {
            /* Le panneau — ou la feuille — montre déjà l'examen : l'acte principal importe. */
            importerLaMachine(task.deviceId);
        } else if (
            task.nature === 'reception' &&
            !task.force &&
            (task.transition || task.reception)
        )
            setActe(task);
        else if (task.transition) {
            /* Au bureau, la décision se reprend cinq secondes ; au téléphone, elle se signe. */
            if (enPanneau) validerDiffere(task);
            else setActe(task);
        } else if (task.assign) remettre(task);
        else if (
            (task.target === 'assignment_wizard' || task.target === 'return_wizard') &&
            task.targetId
        ) {
            /* La remise et le retour d'un objet : leur feuille s'ouvre sur la file. */
            const assistant = task.target === 'assignment_wizard' ? 'assignment' : 'return';
            window.location.hash = avecObjetOuvert(
                `/wizards/${assistant}?equipmentId=${encodeURIComponent(task.targetId)}`,
            );
        } else navigateToTask(task);
    };

    /*
      **Le clavier de la file** (26/09) — J/K pour passer d'une tâche à l'autre, A pour
      l'acte, R pour refuser, Entrée pour la demande, X pour cocher, Z pour se reprendre,
      « ? » pour l'aide. Au bureau, et jamais dans un champ ni sous un calque.
    */
    const surTouche = useRef<(event: KeyboardEvent) => void>(() => undefined);
    surTouche.current = (event: KeyboardEvent) => {
        if (!toucheSimplePourLaPage(event)) return;
        const touche = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        const agir = (geste: () => void) => {
            event.preventDefault();
            geste();
        };

        if (touche === '?') return agir(() => setAideOuverte(true));
        if (touche === 'z' && enSuspens) return agir(annuler);
        if (touche === 'x' && openedTask) {
            return agir(() =>
                selection.isActive
                    ? selection.toggle(openedTask.id)
                    : selection.enter(openedTask.id),
            );
        }
        if (selection.isActive) return;

        if (touche === 'j' || touche === 'k') {
            const index = openedTask
                ? filteredTasks.findIndex((task) => task.id === openedTask.id)
                : -1;
            const cible = touche === 'j' ? index + 1 : Math.max(0, index - 1);
            const task = filteredTasks[Math.min(cible, filteredTasks.length - 1)];
            if (!task) return;
            return agir(() => {
                if (cible >= visibleCount) setVisibleCount((count) => count + TASKS_PAGE_SIZE);
                ouvrir(task);
            });
        }
        if (!openedTask || refus.ouvert) return;
        if (touche === 'a') return agir(() => faireLePrincipal(openedTask));
        if (touche === 'r' && openedTask.refusal)
            return agir(() => setRefus({ ouvert: true, motif: '' }));
    };
    useEffect(() => {
        if (!enPanneau) return;
        const ecouter = (event: KeyboardEvent) => surTouche.current(event);
        document.addEventListener('keydown', ecouter);
        return () => document.removeEventListener('keydown', ecouter);
    }, [enPanneau]);

    /* Échap referme d'abord le motif, puis la tâche ; le panneau reste vide jusqu'au
       prochain choix (P3). Sous 840, c'est la feuille qui répond. */
    const surEchap = useCallback(() => {
        if (refus.ouvert) {
            setRefus({ ouvert: false, motif: '' });
            return;
        }
        fermeeExpres.current = true;
        fermerId();
    }, [fermerId, refus.ouvert]);
    useEchap(enPanneau && !selection.isActive && (refus.ouvert || Boolean(openedTask)), surEchap);

    /**
     * **Le contenu d'une tâche ouverte, au téléphone** — la feuille de 03.3 (colonne 2) :
     * l'en-tête, le contexte, deux décisions de même largeur. Au bureau, c'est le panneau
     * de décision (`PanneauDeTache`).
     */
    const openTask = (task: Task) => {
        /* Au bureau, la rangée sélectionne — elle ne quitte pas la page. */
        if (enPanneau) {
            ouvrir(task);
            return;
        }
        /* **Au téléphone, une seule porte : la feuille** (08/10). Une demande ouvrait son
           écran (06.5), une collecte sa feuille d'examen, le reste une feuille réduite : trois
           façons de lire une tâche. Toutes s'ouvrent maintenant par-dessus la file, avec le
           détail du panneau du bureau ; l'écran de la demande reste à un geste. */
        setRefus({ ouvert: false, motif: '' });
        setFeuille(task);
    };

    /**
     * Le refus se prend en deux temps au téléphone : un motif, puis le code personnel.
     * `updateApproval` refuse un motif absent : l'UI n'est pas la seule barrière.
     */
    const refuseApprovalTask = (task: Task, method?: AttestationMethod) => {
        if (!task.refusal) return;
        const decision = updateApproval(task.refusal.approvalId, task.refusal.nextStatus, {
            reason: refusalReason.trim(),
            method,
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
     * Une annulation n'engage personne d'autre que moi : pas d'attestation, et le motif
     * est facultatif. Lot 6, A3.
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

    const confirmReceptionTask = (task: Task, method?: AttestationMethod): boolean => {
        if (!task.reception) return false;
        const decision = confirmEquipmentReception(task.reception.equipmentId, method);
        if (!decision.allowed) {
            showToast(decision.reason || 'Confirmation refusée.', 'error');
            return false;
        }
        showToast('Réception confirmée.', 'success');
        return true;
    };

    const completeApprovalTask = (task: Task, method?: AttestationMethod): boolean => {
        if (!task.transition) return false;
        const decision = updateApproval(task.transition.approvalId, task.transition.nextStatus, {
            method,
        });
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(getTransitionSuccessMessage(task.transition.nextStatus), 'success');
        return true;
    };

    /** Importer une machine remontée, ou l'ignorer — de la feuille comme du panneau. */
    const importerLaMachine = (id: string): boolean => {
        const result = promoteDetectedDeviceToInventory(id);
        showToast(result.message, result.ok ? 'success' : 'error');
        return result.ok;
    };
    const ignorerLaMachine = (id: string) => {
        const ok = markDetectedDeviceAsIgnored(id);
        showToast(ok ? 'Machine ignorée.' : 'Action refusée.', ok ? 'success' : 'warning');
    };

    const clearFilters = () => {
        setNature('toutes');
        setScope('todo');
        setOrder('urgence');
        setPresse('toutes');
    };

    const panneau = !enPanneau ? undefined : openedTask ? (
        <PanneauDeTache
            tache={openedTask}
            touches={souris}
            refus={refus}
            onRefus={setRefus}
            onPrincipal={() => faireLePrincipal(openedTask)}
            onRefuser={() => refuserDiffere(openedTask, refus.motif)}
            onAnnulerDemande={
                openedTask.cancel
                    ? () => {
                          setRefusalReason('');
                          setCancelling(openedTask);
                      }
                    : undefined
            }
            onRelancer={openedTask.remind ? () => remindTask(openedTask) : undefined}
            onIgnorer={
                openedTask.deviceId
                    ? () => ignorerLaMachine(openedTask.deviceId as string)
                    : undefined
            }
            onOuvrirActif={(id) => onItemClick('equipment_details', id)}
        />
    ) : visibleTasks.length > 0 ? (
        /* **Le panneau vide tient la colonne** (23/09) : il n'arrive plus qu'après Échap. */
        <div className="bg-surface flex h-full flex-col rounded-xl">
            <CardEmptyState
                glyph={ClipboardText}
                title="Aucune tâche ouverte"
                description={
                    souris
                        ? 'Choisissez une tâche dans la file, ou appuyez sur J.'
                        : 'Choisissez une tâche dans la file pour la traiter sans la quitter.'
                }
            />
        </div>
    ) : undefined;

    let groupePrecedent: GroupeDeFile | null = null;

    return (
        <ListTemplate
            onBack={onBack}
            /* 03.3 est une **file** : ses rangées font 56 et portent une marque ronde. */
            skeleton="file"
            title="Tâches"
            /*
              **Les partitions en onglets, à côté du titre** (26/09, maquette de la refonte) :
              « À faire 8 · À suivre 9 ». Au téléphone elles restent dans la feuille de filtre
              (R11). « Historique » est parti le 08/10 : les demandes tranchées se lisent dans
              l'Historique du menu, le seul journal du produit.
            */
            titreAnnexe={
                enPanneau ? (
                    <Onglets
                        label="Partition de la file"
                        items={(Object.keys(SCOPE_LABEL) as TaskScope[]).map((taskScope) => ({
                            id: taskScope,
                            label: SCOPE_LABEL[taskScope],
                            count: scopeCounts[taskScope],
                        }))}
                        active={scope}
                        onSelect={(id) => setScope(id as TaskScope)}
                    />
                ) : undefined
            }
            /*
              **La ligne d'outils de la maquette** : un champ de 300, les trois puces de ce qui
              presse — « Toutes », « Urgentes », « En retard », avec leur compte — et l'ordre à
              droite. La nature se lit sur la rangée et se cherche par son nom.
            */
            outilsBureau={
                enPanneau ? (
                    <div className="flex flex-wrap items-center gap-2 pb-1">
                        <SearchField
                            dense
                            raccourci
                            value={query}
                            onChange={setQuery}
                            placeholder="Personne, objet, code"
                            className="h-9 w-[300px] max-w-full gap-2 px-2.5"
                        />
                        {(['toutes', 'urgentes', 'retard'] as const).map((filtre) => (
                            <FacetChip
                                key={filtre}
                                dense
                                label={PRESSE_LABEL[filtre]}
                                count={
                                    filtre === 'toutes' ? scopeTasks.length : presseCounts[filtre]
                                }
                                selected={presse === filtre}
                                onClick={() => setPresse(filtre)}
                                className="min-h-8 px-[11px]"
                            />
                        ))}
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => setOrder(ORDRE_SUIVANT[order])}
                            aria-label={`Ordre : ${ORDRE_LABEL[order]} — changer`}
                            className="text-on-surface ml-auto h-8 min-h-8 gap-1 px-1 text-[0.8125rem] leading-[1.125rem] font-medium hover:bg-transparent"
                        >
                            <Icon glyph={SortAscending} size={18} className="text-text-muted" />
                            {ORDRE_LABEL[order]}
                        </Button>
                    </div>
                ) : undefined
            }
            /* **La file à 400, la tâche le reste** (26/09) — dès 840, à toutes les largeurs
               du bureau : les douzièmes de 03.3 donnaient 700 px à une file de rangées. */
            listeEtFiche={enPanneau}
            listeLarge
            panel={panneau}
            /* Au téléphone, l'entonnoir et sa feuille. */
            filter={
                <FilterButton
                    label="Filtrer les tâches"
                    count={activeFilterCount}
                    onClick={() => setIsFilterSheetOpen(true)}
                />
            }
            search={{
                value: query,
                onChange: setQuery,
                placeholder: 'Personne, objet, code',
            }}
            count={{
                total: filteredTasks.length,
                noun:
                    nature === 'toutes'
                        ? `· ${ordLabel}`
                        : `des ${scopeTasks.length} · ${ordLabel}`,
                /* Au téléphone, la partition en tête, en 500, et le compte à droite. */
                regard: (
                    <>
                        <b className="text-on-surface font-medium">{SCOPE_LABEL[scope]}</b>
                        {ordLabel.slice(SCOPE_LABEL[scope].length)}
                    </>
                ),
                de: scopeTasks.length,
                unite: `tâche${filteredTasks.length > 1 ? 's' : ''}`,
            }}
            /*
              17.2 — la sélection groupée. Le pied porte ce que la file sait faire sur
              plusieurs tâches : **exporter**, et au bureau **valider** des validations de
              même nature (26/09) — défaisable cinq secondes comme une seule.
            */
            selection={{
                active: selection.isActive,
                count: selection.count,
                total: filteredTasks.length,
                onExit: selection.exit,
                onSelectAll: () => selection.selectAll(filteredTasks.map((task) => task.id)),
                onClearAll: selection.clear,
                actions: (
                    <>
                        {enLot && (
                            <Button
                                variant="filled"
                                icon={<Icon glyph={Check} size={20} />}
                                onClick={validerEnLot}
                            >
                                {selection.count > 1 ? `Valider les ${selection.count}` : 'Valider'}
                            </Button>
                        )}
                        <Button variant={enLot ? 'outlined' : 'filled'} onClick={exporterSelection}>
                            Exporter {selection.count > 1 ? `les ${selection.count}` : ''}
                        </Button>
                    </>
                ),
            }}
            hasRows={visibleTasks.length > 0}
            /* **Demander un équipement, depuis la file** (09/10) : le geste n'existait que sur
               l'accueil de qui ne gère pas le parc. C'est ici qu'on suit sa demande ; c'est
               donc aussi ici qu'on en fait une. La feuille s'ouvre sur cette page (06.4). */
            pageAction={
                permissions.canManageInventory
                    ? undefined
                    : {
                          label: 'Demander',
                          description: 'Demander un équipement',
                          onClick: () => onNavigate('new_request'),
                      }
            }
            empty={
                /* **Une recherche sans résultat n'est pas « à jour »** (25/09). */
                query.trim() || nature !== 'toutes' || presse !== 'toutes' ? (
                    <CardEmptyState
                        glyph={Funnel}
                        title="Aucune tâche ne correspond"
                        description="Élargissez la recherche, ou revenez à toutes les tâches."
                        action={
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setQuery('');
                                    setNature('toutes');
                                    setPresse('toutes');
                                }}
                            >
                                {scopeCounts[scope] > 1
                                    ? `Voir les ${scopeCounts[scope]} tâches`
                                    : scopeCounts[scope] === 1
                                      ? 'Voir la tâche'
                                      : 'Effacer la recherche'}
                            </Button>
                        }
                    />
                ) : (
                    /* LE VIDE EST LE BON ÉTAT, ET IL ARRIVE SOUVENT — « à jour », en vert. */
                    <CardEmptyState
                        glyph={scope === 'todo' ? Check : ClipboardText}
                        tone={scope === 'todo' ? 'positive' : 'neutral'}
                        title={
                            scope === 'todo'
                                ? 'Vous êtes à jour'
                                : `Aucune tâche ${SCOPE_LABEL[scope].toLowerCase()}`
                        }
                        description={
                            scope === 'todo'
                                ? 'Rien n’attend votre geste. La file se remplira d’elle-même.'
                                : 'Changez de vue ou de nature.'
                        }
                    />
                )
            }
        >
            {visibleTasks.map((task) => {
                const IconGlyph = task.icon || Package;
                /* La nature donne sa couleur à la vignette. Au bureau, la nature est écrite :
                   la remise y garde le bleu de la maquette. */
                const teinte: TaskNature =
                    enPanneau && task.nature === 'remise' ? 'validation' : task.nature;
                /* **Les groupes de ce qui presse** (26/09) : un intitulé à chaque changement. */
                const groupe = enGroupes ? groupeDe(task) : null;
                const entete = groupe !== null && groupe !== groupePrecedent ? groupe : null;
                groupePrecedent = groupe;
                /* En sélection, le panneau se retire : aucune rangée n'est « ouverte ». */
                const ouverte = !selection.isActive && openedTask?.id === task.id;
                const jours = daysSince(task.since);

                return (
                    <React.Fragment key={task.id}>
                        {entete && (
                            <h3
                                className={cn(
                                    '-mx-4 flex items-baseline justify-between gap-3 px-4 pt-3 pb-1.5 text-[0.75rem] leading-4 font-medium',
                                    entete === 'retard'
                                        ? 'text-[var(--tk-color-st-rouge)]'
                                        : 'text-text-secondary',
                                )}
                            >
                                <span>{GROUPE_LABEL[entete]}</span>
                                <span className="tabular-nums">{groupCounts[entete]}</span>
                            </h3>
                        )}
                        {/*
                          `.trow` de la planche 03.3 au téléphone : 56 px au minimum, 8 de
                          remplissage vertical, 12 de gouttière. Au bureau, `.rg` de la maquette
                          de la refonte : vignette de 36, 10 de remplissage, alignée en haut ; la
                          rangée ouverte prend le creux et un filet court à gauche, et porte au
                          survol la case qui la coche (17.2).
                        */}
                        <SelectableRow
                            id={`tache-${task.id}`}
                            nature={task.nature}
                            onOpen={() => openTask(task)}
                            selectionActive={selection.isActive}
                            selected={selection.isSelected(task.id)}
                            onToggle={() => selection.toggle(task.id)}
                            onLongPress={() => selection.enter(task.id)}
                            className={cn(
                                'group/rangee border-outline-variant hover:bg-surface-container/50 relative -mx-4 flex cursor-pointer gap-3 border-t px-4 transition-colors first:border-t-0',
                                enPanneau
                                    ? 'items-start py-2.5'
                                    : 'min-h-14 items-center rounded-md py-2',
                                entete && 'border-t-0',
                                ouverte &&
                                    (enPanneau
                                        ? "bg-surface-muted-strong hover:bg-surface-muted-strong before:bg-inverse-surface before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-r-[2px] before:content-['']"
                                        : 'bg-surface-container'),
                                selection.isSelected(task.id) && 'bg-surface-container',
                            )}
                        >
                            {selection.isActive ? (
                                <SelectionBox selected={selection.isSelected(task.id)} />
                            ) : (
                                <span className="relative shrink-0">
                                    <span
                                        className={cn(
                                            'font-brand flex items-center justify-center rounded-md font-semibold',
                                            enPanneau
                                                ? 'h-9 w-9 text-[0.75rem] leading-4'
                                                : 'text-ts-control leading-ts-control h-10 w-10',
                                            VIG_TINT[teinte],
                                        )}
                                    >
                                        {task.initials ? (
                                            <span>{task.initials}</span>
                                        ) : (
                                            <Icon glyph={IconGlyph} size={enPanneau ? 18 : 20} />
                                        )}
                                    </span>
                                    {/* La case au survol — cocher sans appui long, au bureau. */}
                                    {enPanneau && souris && (
                                        <button
                                            type="button"
                                            aria-label={`Sélectionner — ${task.title}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                selection.enter(task.id);
                                            }}
                                            className="bg-surface absolute inset-0 hidden items-center justify-center rounded-md group-hover/rangee:flex"
                                        >
                                            <span className="h-5 w-5 rounded-[4px] shadow-[inset_0_0_0_1.5px_var(--tk-color-border-strong)]" />
                                        </button>
                                    )}
                                </span>
                            )}

                            {/*
                              **Deux lignes, et rien d'autre** (10/10 : « la liste de tâches est
                              trop chargée »). La rangée portait un badge de nature, deux lignes
                              de motif, la citation d'un refus en italique, l'âge en rouge et
                              « Urgent » dessous. Elle garde ce qui sert à choisir : l'objet, puis
                              **qui et où en est la tâche** — « Cheikh Ouattara · remise »,
                              comme la file de l'accueil. Le motif et la citation se lisent en
                              ouvrant la tâche ; la recherche les trouve toujours.
                            */}
                            <div className="min-w-0 flex-1">
                                <span
                                    title={infobulle(task.title)}
                                    className={cn(
                                        'text-on-surface block',
                                        enPanneau
                                            ? 'text-ts-body leading-ts-body font-medium'
                                            : 'text-ts-head leading-ts-head tracking-[-0.01em]',
                                        NOM_SUR_UNE_LIGNE,
                                    )}
                                >
                                    {task.title}
                                </span>
                                <p className="text-text-secondary text-ts-sub leading-ts-sub flex min-w-0 items-center gap-1">
                                    {task.scope === 'following' && task.aLaMain ? (
                                        <>
                                            <Icon
                                                glyph={Pause}
                                                size={18}
                                                className="text-text-tertiary -my-px shrink-0"
                                            />
                                            <span className="truncate">
                                                chez {task.aLaMain}
                                                {jours !== null && ` depuis ${jours} j`}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="truncate">
                                            {[task.who, task.context || NATURE_MOT[task.nature]]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/*
                              À droite, ce que la partition demande. « À faire » et « À suivre »
                              portent l'âge, coloré par ce qui presse, et la marque « Urgent » ;
                              au bureau, une demande à relancer dit « Relancer » à sa place.
                            */}
                            {enPanneau && task.remind ? (
                                <Button
                                    variant="text"
                                    size="sm"
                                    aria-label={`Relancer — ${task.title}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        remindTask(task);
                                    }}
                                    className="h-auto min-h-0 shrink-0 self-start p-0 text-[0.75rem] leading-4 font-medium text-[var(--tk-color-st-ambre)] hover:bg-transparent hover:underline"
                                >
                                    Relancer
                                </Button>
                            ) : (
                                <span
                                    className="flex shrink-0 items-center gap-1 self-center"
                                    onClick={task.remind ? (e) => e.stopPropagation() : undefined}
                                >
                                    {/* **L'âge, et un point quand c'est urgent.** Le groupe dit
                                        déjà « En retard » en rouge : trente-trois âges rouges
                                        dessous le répétaient. L'âge ne se colore plus que dans
                                        une file sans groupes ; « Urgent » tient en un point. */}
                                    <span className="flex min-w-8 items-center justify-end gap-1.5">
                                        {task.urgent && task.scope === 'todo' && (
                                            <span
                                                role="img"
                                                aria-label="Urgent"
                                                title="Urgent"
                                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tk-color-st-rouge)]"
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                'text-right text-[0.75rem] leading-4 whitespace-nowrap tabular-nums',
                                                groupe !== null
                                                    ? 'text-text-secondary'
                                                    : AGE_TON[palierDe(task.since)],
                                            )}
                                        >
                                            {enPanneau
                                                ? jours !== null
                                                    ? `${jours} j`
                                                    : ''
                                                : ageLabel(task.since)}
                                        </span>
                                    </span>
                                    {/* `.rt.bell` — la relance au téléphone, seul acte de
                                        « À suivre », au-delà du délai (planche 03.3). */}
                                    {task.remind && (
                                        <Button
                                            variant="text"
                                            iconOnly
                                            size="sm"
                                            aria-label={`Relancer — ${task.title}`}
                                            onClick={() => remindTask(task)}
                                        >
                                            <Icon glyph={BellRinging} size={20} />
                                        </Button>
                                    )}
                                </span>
                            )}
                        </SelectableRow>
                    </React.Fragment>
                );
            })}

            {visibleTasks.length < filteredTasks.length && (
                <Button
                    variant="text"
                    onClick={() => setVisibleCount((count) => count + TASKS_PAGE_SIZE)}
                    className="border-outline-variant text-on-surface text-ts-control leading-ts-control min-h-12 w-full justify-between rounded-none border-t px-0 font-medium"
                >
                    {/* `.pag` — la file **pagine, elle ne synthétise pas** (règle de 03.3). */}
                    <span>
                        Voir les{' '}
                        {Math.min(TASKS_PAGE_SIZE, filteredTasks.length - visibleTasks.length)}{' '}
                        suivantes
                    </span>
                    <span className="text-on-surface-variant text-[0.75rem] leading-4 font-normal tabular-nums">
                        {visibleTasks.length} sur {filteredTasks.length}
                    </span>
                </Button>
            )}

            {enSuspens && (
                <BandeauAnnuler
                    message={enSuspens.message}
                    cle={enSuspens.cle}
                    onAnnuler={annuler}
                    touches={enPanneau && souris}
                />
            )}

            {/* L'aide des touches — « ? », au bureau. */}
            <Modal
                isOpen={aideOuverte}
                onClose={() => setAideOuverte(false)}
                title="Les touches de la file"
                maxWidth="max-w-md"
            >
                <dl className="flex flex-col">
                    {TOUCHES.map(([touches, sens]) => (
                        <div
                            key={sens}
                            className="border-outline-variant text-ts-body leading-ts-body flex min-h-11 items-center justify-between gap-4 border-t py-2 first:border-t-0"
                        >
                            <dt className="text-on-surface">{sens}</dt>
                            <dd className="flex shrink-0 gap-1">
                                {touches.map((touche) => (
                                    <Touche key={touche}>{touche}</Touche>
                                ))}
                            </dd>
                        </div>
                    ))}
                </dl>
            </Modal>

            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
                emploi="filtre"
            >
                {/*
                  LA FEUILLE PORTE LES RÉGLAGES, DANS L'ORDRE DE LA PLANCHE : **Où** — les
                  partitions —, **Nature**, **Ce qui presse** (26/09) et **Ordre**.
                */}
                <div className="flex flex-col gap-6">
                    <div>
                        <p className={FILTER_HEADING}>Où</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.keys(SCOPE_LABEL) as TaskScope[]).map((taskScope) => (
                                <FacetChip
                                    key={taskScope}
                                    label={SCOPE_LABEL[taskScope]}
                                    count={scopeCounts[taskScope]}
                                    selected={scope === taskScope}
                                    onClick={() => setScope(taskScope)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={FILTER_HEADING}>Nature</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <FacetChip
                                label="Tout"
                                count={scopeTasks.length}
                                selected={nature === 'toutes'}
                                onClick={() => setNature('toutes')}
                            />
                            {(Object.keys(NATURE_LABEL) as TaskNature[]).map((taskNature) => (
                                <FacetChip
                                    key={taskNature}
                                    label={NATURE_LABEL[taskNature]}
                                    count={counts[taskNature]}
                                    selected={nature === taskNature}
                                    onClick={() => setNature(taskNature)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={FILTER_HEADING}>Ce qui presse</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(
                                [
                                    ['toutes', 'Tout', undefined],
                                    ['urgentes', 'Urgentes', presseCounts.urgentes],
                                    ['retard', 'En retard', presseCounts.retard],
                                ] as const
                            ).map(([valeur, label, compte]) => (
                                <FacetChip
                                    key={valeur}
                                    label={label}
                                    count={compte}
                                    selected={presse === valeur}
                                    onClick={() => setPresse(valeur)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={FILTER_HEADING}>Ordre</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(Object.keys(ORDRE_LABEL) as TaskOrder[]).map((valeur) => (
                                <FacetChip
                                    key={valeur}
                                    label={ORDRE_LABEL[valeur]}
                                    selected={order === valeur}
                                    onClick={() => setOrder(valeur)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* `.sfoot` — deux gestes de même largeur : ils se valent, la grille le dit. */}
                    <div
                        data-pied
                        className="border-outline-variant duo-de-pied gap-3 border-t pt-4"
                    >
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
              **La feuille d'une tâche** — au téléphone, planche 03.3, colonne « État — la
              feuille d'une demande ». Le oui ne décide pas seul : il **conduit à
              l'attestation** (06.2).
            */}
            {/* La feuille du téléphone : le panneau du bureau, posé par-dessus la file (08/10). */}
            <BottomSheet open={!enPanneau && !!feuille} onClose={() => setFeuille(null)}>
                {feuilleAffichee && (
                    <PanneauDeTache
                        surface="feuille"
                        tache={feuilleAffichee}
                        touches={false}
                        refus={refus}
                        onRefus={setRefus}
                        onFermer={() => setFeuille(null)}
                        onPrincipal={() => {
                            setFeuille(null);
                            faireLePrincipal(feuilleAffichee);
                        }}
                        onRefuser={() => refuserDiffere(feuilleAffichee, refus.motif)}
                        onDemanderRefus={() => {
                            setRefusalReason('');
                            setRefusing(feuilleAffichee);
                            setFeuille(null);
                        }}
                        onAnnulerDemande={
                            feuilleAffichee.cancel
                                ? () => {
                                      setRefusalReason('');
                                      setCancelling(feuilleAffichee);
                                      setFeuille(null);
                                  }
                                : undefined
                        }
                        onRelancer={
                            feuilleAffichee.remind ? () => remindTask(feuilleAffichee) : undefined
                        }
                        onIgnorer={
                            feuilleAffichee.deviceId
                                ? () => {
                                      ignorerLaMachine(feuilleAffichee.deviceId as string);
                                      setFeuille(null);
                                  }
                                : undefined
                        }
                        onOuvrirActif={(id) => {
                            setFeuille(null);
                            onItemClick('equipment_details', id);
                        }}
                    />
                )}
            </BottomSheet>

            {/*
              LE REFUS AU TÉLÉPHONE — un des neuf actes de 17.4 : le motif est le bloc 3,
              l'attestation le bloc 4, avec le code personnel de celui qui refuse.
            */}
            {refusAffiche?.refusal && (
                <ActSheet
                    open={Boolean(refusing?.refusal)}
                    onClose={() => setRefusing(null)}
                    title={
                        refusAffiche.refusal.nextStatus === 'Rejected'
                            ? 'Refuser la demande'
                            : 'Renvoyer à l’IT'
                    }
                    subtitle={
                        refusAffiche.refusal.nextStatus === 'Rejected'
                            ? `Définitif. ${refusAffiche.refusal.requesterName} lira votre motif, tel quel.`
                            : 'La demande repart au traitement, avec votre motif.'
                    }
                    subject={{ title: refusAffiche.title, subtitle: refusAffiche.context }}
                    counterparty={
                        refusAffiche.who
                            ? { label: 'Concerne', title: refusAffiche.who }
                            : undefined
                    }
                    question={{
                        label: 'Motif obligatoire',
                        children: (
                            <textarea
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                rows={3}
                                placeholder="Budget gelé jusqu’au prochain exercice…"
                                className="bg-surface-container text-on-surface placeholder:text-on-surface-variant focus-visible:ring-focus-ring text-ts-body leading-ts-body min-h-24 w-full rounded-[4px] border-0 px-3.5 py-3 outline-none focus-visible:ring-2"
                            />
                        ),
                    }}
                    signer={{
                        name: currentUser?.name ?? '',
                        pin: currentUser?.pin,
                        id: currentUser?.id,
                    }}
                    consequence={{
                        tone: 'rouge',
                        glyph: Prohibit,
                        text: (
                            <>
                                Le motif lui est transmis <b className="font-medium">tel quel</b> :
                                c’est le seul texte qu’il recevra.
                            </>
                        ),
                    }}
                    confirmLabel={
                        refusAffiche.refusal.nextStatus === 'Rejected' ? 'Refuser' : 'Renvoyer'
                    }
                    onConfirm={(method) => refuseApprovalTask(refusAffiche, method)}
                />
            )}

            {/* Feuille — annuler ma demande. Motif facultatif, aucun code : je ne signe
                pas une décision sur autrui, je retire la mienne. Lot 6, A3. */}
            <BottomSheet
                open={!!cancelling}
                onClose={() => setCancelling(null)}
                title="Annuler ma demande"
            >
                {cancelling?.cancel && (
                    <div className="space-y-4">
                        <p className="text-text-secondary text-ts-body leading-ts-body">
                            {cancelling.title}
                        </p>
                        <p className="flex items-center gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-4 py-2 text-[0.75rem] leading-4 font-medium text-[var(--tk-color-on-tint-ambre)]">
                            <Icon glyph={ArrowCounterClockwise} size={18} />
                            Rien n'est perdu — vous pourrez redemander. La personne qui l'examinait
                            ne la verra plus.
                        </p>
                        <label className="block">
                            <span className="text-text-muted mb-2 block text-[0.75rem] leading-4 font-medium">
                                Motif{' '}
                                <span className="text-text-secondary font-normal">
                                    — facultatif
                                </span>
                            </span>
                            <textarea
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                rows={2}
                                placeholder="Plus besoin, j'ai trouvé un poste libre…"
                                className="border-outline bg-surface text-on-surface focus:border-primary text-ts-body leading-ts-body w-full rounded-md border p-4 focus:outline-hidden"
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

            {/*
              LA FEUILLE D'ACTE — 17.4, six blocs. Ici les blocs 1 et 2 sont connus — on
              vient d'une tâche — et il n'y a pas de question : reste à attester.
            */}
            {acteAffiche && (
                <ActSheet
                    open={acte !== null}
                    onClose={() => setActe(null)}
                    title={acteAffiche.action ?? 'Confirmer'}
                    subtitle={
                        acteAffiche.nature === 'reception'
                            ? 'Vous attestez avoir reçu cet équipement.'
                            : 'Vous attestez votre décision.'
                    }
                    subject={{ title: acteAffiche.title, subtitle: acteAffiche.context }}
                    counterparty={
                        acteAffiche.who ? { label: 'Concerne', title: acteAffiche.who } : undefined
                    }
                    signer={{
                        name: currentUser?.name ?? '',
                        pin: currentUser?.pin,
                        id: currentUser?.id,
                    }}
                    consequence={
                        acteAffiche.nature === 'reception'
                            ? {
                                  tone: 'bleu',
                                  glyph: Check,
                                  text: (
                                      <>
                                          L'objet passe <b className="font-medium">à votre nom</b>.
                                      </>
                                  ),
                              }
                            : {
                                  tone: 'vert',
                                  glyph: Check,
                                  text: <>La demande avance à l'étape suivante.</>,
                              }
                    }
                    /* 17.4 — la feuille dit « Je confirme » : c'est la personne qui parle. */
                    confirmLabel={
                        acteAffiche.nature === 'reception'
                            ? 'Je confirme'
                            : (acteAffiche.action ?? 'Confirmer')
                    }
                    cancelLabel="Plus tard"
                    onConfirm={(method) => {
                        const abouti = acteAffiche.reception
                            ? confirmReceptionTask(acteAffiche, method)
                            : completeApprovalTask(acteAffiche, method);
                        if (abouti) setActe(null);
                    }}
                />
            )}
        </ListTemplate>
    );
};

export default TasksPage;
