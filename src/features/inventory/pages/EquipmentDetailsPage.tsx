import React, { useMemo, useState } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    BellRinging,
    CaretDown,
    Check,
    CheckCircle,
    ClockCounterClockwise,
    DotsThreeVertical,
    FileText,
    Package,
    Receipt,
    Tray,
    Warning,
    Wrench,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import type { RepairCase } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useJournalComplet } from '../../../hooks/useJournalComplet';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { avecObjetOuvert } from '../../../hooks/useObjetOuvert';

import {
    RETIREMENT_REASON_LABELS,
    type AttestationMethod,
    type RetirementReason,
} from '../../../types';
import { getCategoryLabel } from '../../../constants/glossary';
import HandoverTrail, { type TrailStep } from '../../../components/ui/HandoverTrail';
import RuleGroup from '../../../components/ui/RuleGroup';
import IncidentSheet from '../components/IncidentSheet';
import TakeChargeSheet from '../components/TakeChargeSheet';
import { motifIncident } from '../incidents';
import ReceiveRepairSheet from '../components/ReceiveRepairSheet';
import DepositSheet from '../components/DepositSheet';
import QuoteDecisionSheet from '../components/QuoteDecisionSheet';
import { phraseEtape, presentationEtat, seuilDevis } from '../reparation';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { getExpenseSourceFile, saveExpenseSourceFile } from '../../../lib/financeFileStorage';
import ActSheet from '../../../components/ui/ActSheet';
import ClosureBanner, { type ClosureBannerProps } from '../../../components/ui/ClosureBanner';
import RetireSheet from '../components/RetireSheet';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero, { type DetailMetrics } from '../../../components/ui/DetailHero';
import ReferenceRow from '../../../components/ui/ReferenceRow';
import ProportionRow from '../../../components/ui/ProportionRow';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import DemoBadge from '../../../components/ui/DemoBadge';
import ScreenState from '../../../components/ui/ScreenState';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ImagePreview from '../../../components/ui/ImagePreview';

import { getDisplayedEquipmentStatus } from '../../../lib/businessRules';
import { getStatusPresentation } from '../../../constants/statusPresentation';
import {
    calculateLinearDepreciation,
    formatCurrency,
    formatNumber,
    getBudgetCategoryByExpenseType,
} from '../../../lib/financial';
import { DEMO_RESEED_NOTICE, isDemoSeedEquipment } from '../../../lib/demoSeed';
import { cn } from '../../../lib/utils';
import { GLOSSARY } from '../../../constants/glossary';

/**
 * Fiche équipement — **portée sur la planche 04.2** (gabarit `DetailTemplate`).
 *
 * Une fiche répond d'abord à **« quel objet, dans quel état, chez qui, et quoi
 * faire »**, et cela tient dans la zone inversée, sans défilement. Tout le reste est
 * de la **référence bornée**.
 *
 * **Ce que le portage retire :**
 *
 * - **les trois cartes de démonstration** — « Santé 100 % », « Maintenance à jour »
 *   et leur voisine occupaient le premier écran avec des chiffres fabriqués, avant
 *   la moindre donnée réelle. Elles reviendront le jour où l'agent de collecte les
 *   alimente : c'est exactement ce que leur badge DÉMO avouait.
 * - **le bloc financier** — prix d'achat, valeur actuelle, amortissement total **en
 *   rouge**, barre en dégradé, tableau de trois lignes et deux encarts d'alerte
 *   tenaient un tiers de l'écran pour dire « amorti à 50 % ». Rien là-dedans ne
 *   portait de décision. **Un amortissement n'est pas une anomalie** : reste une
 *   rangée, puis la conséquence — quand renouveler.
 * - **le second en-tête.** « Détail équipement » ne dit rien qu'on ne sache déjà et
 *   coûte 56 px. La barre porte le code, l'identifiant et le menu, et elle est le
 *   seul endroit où l'identité est écrite.
 * - **le crayon et le triangle sans libellé** — un triangle peut vouloir dire
 *   « signaler un problème » comme « il y a un problème ». Ils deviennent des
 *   entrées **nommées**.
 * - **« Supprimer » du rang primaire.** Un acte irréversible ne se tient pas à côté
 *   d'« Attribuer » : il descend au menu, derrière un séparateur, sous le mot juste —
 *   **« Sortir du parc »**, parce qu'un actif qui a un historique ne s'efface pas.
 * - **l'ascenseur interne de l'historique** (200 mouvements) — il est borné à trois
 *   et renvoie à l'écran d'Audit, qui fait déjà ce travail : le dupliquer créerait
 *   une seconde source de vérité.
 *
 * **Les qualifiants du voile suivent le rôle**, jamais la recopie : le gestionnaire
 * voit le prix d'achat, le porteur voit à la même place la **date de remise**. Le
 * prix ne franchit pas la frontière de rôle.
 *
 * **Ce qui n'est pas porté, et pourquoi.** L'entrée « Déclarer un incident » attend
 * la planche **04.3** : le geste actuel affiche « Signalement envoyé au support »
 * alors que **rien n'est envoyé ni créé**. Reconduire une phrase fausse serait pire
 * que l'absence — l'entrée est retirée jusqu'à ce que la feuille d'incident existe.
 */

interface EquipmentDetailsPageProps {
    equipmentId: string;
    onBack: () => void;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const formatDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'N/A';

const EquipmentDetailsPage: React.FC<EquipmentDetailsPageProps> = ({ equipmentId, onBack }) => {
    const {
        equipment,
        users,
        events,
        approvals,
        updateEquipment,
        deleteEquipment,
        declareIncident,
        advanceRepair,
        remindApproval,
        confirmEquipmentReception,
        settings,
        models,
    } = useData();
    useJournalComplet();
    const { showToast } = useToast();
    const { permissions, user: currentUser } = useAccessControl();
    const { navigate: allerA } = useAppNavigation();
    /* Un acte ouvert depuis la fiche d'un panneau garde l'objet ouvert (P3). */
    const navigate = (adresse: string) => allerA(avecObjetOuvert(adresse));
    const { requestConfirmation } = useConfirmation();
    const { financeBudgets, addFinanceExpense } = useFinanceData();

    const item = equipment.find((entry) => entry.id === equipmentId);

    /**
     * **La marque vient du catalogue, pas de l'objet.** `brand` vit sur `Model` ; la
     * feuille de prise en charge lisait `item.brand`, qui n'existe pas, et son
     * réparateur sous garantie retombait donc toujours sur le nom du modèle. Le
     * rapprochement se fait par le nom du modèle, seul lien que l'objet porte.
     */
    const marqueDuModele = useMemo(
        () =>
            item?.model
                ? models.find((modele) => modele.name.toLowerCase() === item.model?.toLowerCase())
                      ?.brand
                : undefined,
        [item?.model, models],
    );

    /* Les deux feuilles d'acte de 04.3 (colonnes 3 et 4). Elles remplacent deux
       confirmations : l'une passait l'objet en réparation sans rien demander, l'autre
       demandait de taper « SUPPRIMER » sans jamais demander pourquoi. */
    const [isIncidentSheetOpen, setIsIncidentSheetOpen] = useState(false);
    const [isTakeChargeOpen, setIsTakeChargeOpen] = useState(false);
    const [isReceiveRepairOpen, setIsReceiveRepairOpen] = useState(false);
    /* Le parcours de réparation (24/09) : le dépôt attesté, la décision sur le devis. */
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    /* 17.4 — « Confirmer la réception » est l'un des neuf actes : il s'atteste. */
    const [confirmationOuverte, setConfirmationOuverte] = useState(false);
    /** La clôture du dernier acte posé ici — 06.3, forme 1. */
    const [cloture, setCloture] = useState<ClosureBannerProps | null>(null);
    const [isRetireSheetOpen, setIsRetireSheetOpen] = useState(false);

    const financialStats = useMemo(() => {
        if (!item?.financial) return null;
        return calculateLinearDepreciation(
            item.financial.purchasePrice,
            item.financial.purchaseDate,
            item.financial.depreciationYears,
            item.financial.purchasePrice > 0
                ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100
                : 0,
        );
    }, [item]);

    /**
     * L'historique est **borné à trois** : au-delà, c'est l'écran d'Audit, filtré sur
     * cet actif, qui fait le travail (04.2). Une fiche ne défile pas à l'intérieur
     * d'elle-même.
     */
    const history = useMemo(() => {
        if (!item) return [];
        return events
            .filter((event) => event.targetId === item.id)
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map((event) => ({
                id: event.id,
                title: event.description || 'Mouvement enregistré',
                date: new Date(event.timestamp).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                }),
            }));
    }, [events, item]);

    if (!item) {
        return (
            <ScreenState
                icon={Package}
                title="Cette fiche n’existe plus"
                description={`L’${GLOSSARY.EQUIPMENT.toLowerCase()} que vous cherchiez a peut-être été sorti du parc. Son historique, lui, est conservé dans l’audit.`}
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir aux équipements
                    </Button>
                }
            />
        );
    }

    const displayedStatus = getDisplayedEquipmentStatus({
        status: item.status,
        assignmentStatus: item.assignmentStatus,
    });
    /* L'étape de réparation prime sur l'état : « Incident déclaré », « Devis à valider »,
       « En réparation » ne se confondent plus (24/09). */
    const status = item.repair ? presentationEtat(item) : getStatusPresentation(displayedStatus);

    const holder = item.user
        ? users.find(
              (user) =>
                  (item.user?.id && user.id === item.user.id) ||
                  (item.user?.email && user.email === item.user.email) ||
                  (item.user?.name && user.name === item.user.name),
          )
        : null;

    /* Qui peut confirmer une réception : celui qui reçoit, son manager, ou un
       gestionnaire. Même règle que `confirmEquipmentReception` dans le store — lue
       ici pour ne pas offrir un geste qui serait refusé après le tap. Lot 7, S2. */
    /**
     * **Qui confirme, et qui relance** (06.1). La confirmation appartient à celui qui
     * reçoit — ou à son manager, qui répond de lui. Un gestionnaire de parc qui n'est
     * ni l'un ni l'autre **n'atteste pas à la place d'un tiers** : il relance, ou il
     * reprend l'objet. Le store l'autorise à confirmer (il peut avoir la personne en
     * face de lui), mais le héro ne lui propose plus de le faire à l'aveugle.
     */
    const isReceivingParty =
        (!!currentUser &&
            (item.user?.id === currentUser.id || item.user?.email === currentUser.email)) ||
        (!!currentUser && !!holder && holder.managerId === currentUser.id);

    // ---- les trois qualifiants du voile (R3) -----------------------------------
    const purchaseDate = item.financial?.purchaseDate;
    const ageYears = purchaseDate
        ? (Date.now() - new Date(purchaseDate).getTime()) / MS_PER_YEAR
        : null;

    const warrantyMonthsLeft = item.warrantyEnd
        ? Math.round((new Date(item.warrantyEnd).getTime() - Date.now()) / (MS_PER_YEAR / 12))
        : null;

    /**
     * Les repères chiffrés — passe sobre du 02/09, dont 04.2 est le pilote.
     *
     * Ils **quittent le héro** : celui-ci ne porte plus que quatre choses — l'état,
     * l'objet, la personne, le geste. Les chiffres se posent dessous, en tuiles
     * teintées. **Une teinte par nature de chiffre** (le temps, la garantie,
     * l'argent), jamais par humeur. La valeur longue prend la ligne entière : un
     * prix à sept chiffres ne tient pas dans une demi-tuile.
     */
    const tiles = (() => {
        /* Ni teinte ni pictogramme : `.qual` de 04.2 ne porte que le chiffre et son
           libellé — *« le chiffre et son libellé suffisent »*. */
        const out: { key: string; value: string; label: string; wide?: boolean }[] = [];

        if (ageYears !== null && ageYears >= 0) {
            out.push({
                key: 'age',
                value: `${ageYears.toFixed(1).replace('.', ',')} ans`,
                label: 'au parc',
            });
        }
        if (warrantyMonthsLeft !== null) {
            out.push({
                key: 'warranty',
                value: warrantyMonthsLeft > 0 ? `${warrantyMonthsLeft} mois` : 'expirée',
                label: warrantyMonthsLeft > 0 ? 'de garantie' : 'garantie',
            });
        }

        // Le prix ne franchit pas la frontière de rôle : le porteur voit sa date de remise.
        if (permissions.canManageInventory && item.financial) {
            out.push({
                key: 'price',
                value: formatCurrency(item.financial.purchasePrice, settings.currency),
                label: 'à l’achat',
                wide: true,
            });
        } else if (item.confirmedAt || item.assignedAt) {
            out.push({
                key: 'handover',
                value: new Date(item.confirmedAt || item.assignedAt || '').toLocaleDateString(
                    'fr-FR',
                    { day: 'numeric', month: 'long' },
                ),
                label: 'remis à vous',
                wide: true,
            });
        }

        return out;
    })();

    // ---- les actes -------------------------------------------------------------
    const handleAssign = () =>
        navigate(
            `/wizards/assignment?context=equipment_details&equipmentId=${encodeURIComponent(item.id)}`,
        );

    const handleDeclareIncident = () => setIsIncidentSheetOpen(true);

    /**
     * **Relancer** — la même honnêteté que sur « À suivre » (03.3) : le produit
     * n'envoie rien, il **date l'insistance**. Quand une demande porte l'objet, c'est
     * elle qu'on relance, et le journal la garde ; sans demande — une remise directe
     * — il n'y a rien à dater, et le dire vaut mieux qu'un accusé sans destinataire.
     */
    const handleRemindHolder = () => {
        const linked = approvals.find(
            (approval) =>
                approval.assignedEquipmentId === item.id && approval.status === 'PENDING_DELIVERY',
        );
        if (!linked) {
            showToast('Remise directe : rien à relancer.', 'info');
            return;
        }
        const decision = remindApproval(linked.id);
        showToast(
            decision.allowed
                ? `${item.user?.name || 'La personne'} est relancée — la date est au journal.`
                : decision.reason || 'Relance impossible.',
            decision.allowed ? 'success' : 'error',
        );
    };

    /**
     * **Annuler la remise** — l'objet revient disponible et personne n'en répond plus.
     * C'est l'inverse exact du geste de remise, et il laisse sa trace : une remise
     * annulée n'est pas une remise qui n'a pas eu lieu.
     */
    const handleCancelHandover = () => {
        requestConfirmation({
            title: `Annuler la remise de ${item.name} ?`,
            message: (
                <>
                    L’objet redevient{' '}
                    <strong className="text-on-surface font-normal">disponible</strong> et sort de
                    la file de {item.user?.name || 'la personne'}. L’attestation déjà donnée reste
                    au journal.
                </>
            ),
            confirmText: 'Annuler la remise',
            onConfirm: () => {
                updateEquipment(item.id, {
                    status: 'Disponible',
                    assignmentStatus: 'NONE',
                    user: null,
                    assignedAt: undefined,
                    handoverProof: undefined,
                });
                showToast('Remise annulée. L’objet est de nouveau disponible.', 'success');
            },
        });
    };

    /* 04.4, premier acte. Le geste posait un retour transitoire et n'écrivait rien :
       il annonçait une prise en charge que personne ne pouvait retrouver. */
    const handleTakeCharge = () => setIsTakeChargeOpen(true);

    const handleReassign = () => {
        navigate(
            `/wizards/assignment?context=equipment_details&reassign=true&equipmentId=${encodeURIComponent(item.id)}`,
        );
    };

    /*
     * 04.4, troisième acte. La confirmation qui vivait ici posait toujours la même
     * issue — l'objet repassait « Disponible » —, alors qu'un retour de réparation en
     * a **trois**, et qu'un objet réparé **repart chez son porteur**.
     */
    const handleEndRepair = () => setIsReceiveRepairOpen(true);

    // ---- la réparation (24/09) -------------------------------------------------
    const dossier = item.repair;
    const n = (valeur: number) => formatNumber(valeur, settings.compactNotation);
    /** Ce qui reste sur la ligne Maintenance de l'exercice en cours — null sans ligne. */
    const resteMaintenance = (() => {
        const annee = new Date().getFullYear();
        const ligne = financeBudgets
            .find((budget) => budget.year === annee)
            ?.items.find(
                (entry) => entry.category === getBudgetCategoryByExpenseType('Maintenance'),
            );
        return ligne ? ligne.allocated - ligne.spent : null;
    })();
    /* Qui remet au dépôt : le porteur, présent au comptoir. **Sur l'appareil d'un autre,
       il signe** — son code n'est proposé que s'il est lui-même connecté (17.4). Sans
       porteur, le gestionnaire atteste. */
    const porteurDuDossier = dossier?.holderId
        ? users.find((user) => user.id === dossier.holderId)
        : undefined;
    const signataireDepot = porteurDuDossier
        ? {
              name: porteurDuDossier.name,
              pin: porteurDuDossier.id === currentUser?.id ? currentUser?.pin : undefined,
          }
        : { name: currentUser?.name || 'Le gestionnaire', pin: currentUser?.pin };

    /** Garder un fichier au magasin local, comme un justificatif de dépense. */
    const garder = async (file: File) => ({
        fileId: await saveExpenseSourceFile(file).catch(() => undefined),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
    });

    const ouvrirFichier = async (fileId?: string) => {
        const stocke = await getExpenseSourceFile(fileId).catch(() => null);
        if (!stocke?.blob) {
            showToast('Le fichier n’est gardé que sur l’appareil qui l’a joint.', 'info');
            return;
        }
        window.open(URL.createObjectURL(stocke.blob), '_blank', 'noopener');
    };

    const dire = (decision: { allowed: boolean; reason?: string }, succes: string) =>
        showToast(
            decision.allowed ? succes : decision.reason || 'Refusé.',
            decision.allowed ? 'success' : 'error',
        );

    const surDepot = (method: AttestationMethod) => {
        setIsDepositOpen(false);
        dire(
            advanceRepair(item.id, { type: 'deposit', method }),
            'Dépôt reçu : il attend sa prise en charge.',
        );
    };

    const surPriseEnCharge = async (valeurs: {
        repairer: string;
        underWarranty: boolean;
        expectedReturn: string;
        ticket?: string;
        quote?: { amount: number; file: File };
        pickupSlip?: File;
    }) => {
        const quote = valeurs.quote
            ? { ...(await garder(valeurs.quote.file)), amount: valeurs.quote.amount }
            : undefined;
        const pickupSlip = valeurs.pickupSlip ? await garder(valeurs.pickupSlip) : undefined;
        const aLaFinance = Boolean(
            quote && !valeurs.underWarranty && quote.amount > seuilDevis(settings),
        );
        dire(
            advanceRepair(item.id, {
                type: 'take_charge',
                repairer: valeurs.repairer,
                underWarranty: valeurs.underWarranty,
                expectedReturn: valeurs.expectedReturn,
                ticket: valeurs.ticket,
                quote,
                pickupSlip,
            }),
            aLaFinance
                ? 'Devis envoyé à la Finance.'
                : `Pris en charge : il part chez ${valeurs.repairer}.`,
        );
    };

    const surDecision = (approve: boolean, reason?: string) =>
        dire(
            advanceRepair(item.id, { type: 'decide_quote', approve, reason }),
            approve
                ? 'Devis validé : il part en réparation.'
                : 'Devis refusé : l’informatique reprend le dossier.',
        );

    const surRecuperation = async (
        outcome: 'repaired' | 'diminished' | 'irreparable',
        facture?: { amount: number; supplier: string; file: File },
    ) => {
        let invoice: RepairCase['invoice'] = undefined;
        if (facture) {
            const piece = await garder(facture.file);
            /* **La facture fait la dépense** (24/09) : sur Maintenance & Services, datée du
               jour, le fichier en justificatif, et l'objet nommé dans la description. */
            const depense = addFinanceExpense({
                date: new Date().toISOString().slice(0, 10),
                supplier: facture.supplier,
                amount: facture.amount,
                type: 'Maintenance',
                status: 'Paid',
                description: `Réparation ${item.name}${item.assetId ? ` (${item.assetId})` : ''}`,
                sourceFileName: piece.fileName,
                sourceFileId: piece.fileId,
            });
            invoice = {
                ...piece,
                amount: facture.amount,
                supplier: facture.supplier,
                expenseId: depense.ok ? depense.expense?.id : undefined,
            };
            if (!depense.ok) showToast('La dépense n’a pas pu être enregistrée.', 'error');
        }
        const decision = advanceRepair(item.id, { type: 'receive', outcome, invoice });
        if (!decision.allowed) {
            showToast(decision.reason || 'Réception refusée.', 'error');
            return;
        }
        if (outcome === 'irreparable') {
            handleRetire();
            return;
        }
        const porteur = item.repairPreviousUser?.name;
        showToast(
            [
                porteur ? `Récupéré, il repart chez ${porteur}` : 'Récupéré, il repasse disponible',
                invoice ? ` ; ${n(invoice.amount)} ${settings.currency} en dépense` : '',
                '.',
            ].join(''),
            'success',
        );
    };

    /** « Où en est la réparation » — les étapes du dossier, faites ou attendues. */
    const etapesReparation: TrailStep[] | null = dossier
        ? [
              {
                  title: 'Incident déclaré',
                  detail: formatDate(dossier.openedAt),
                  state: 'done',
              },
              dossier.deposit
                  ? {
                        title: 'Déposé à l’informatique',
                        detail: `${formatDate(dossier.deposit.at)} · attesté`,
                        state: 'done',
                    }
                  : {
                        title: 'Dépôt',
                        detail: dossier.holderName ? `chez ${dossier.holderName}` : 'à recevoir',
                        state: dossier.stage === 'declared' ? 'late' : 'done',
                    },
              dossier.takenCharge
                  ? {
                        title: `Pris en charge · ${dossier.takenCharge.repairer}`,
                        detail: `retour prévu le ${formatDate(dossier.takenCharge.expectedReturn)}`,
                        state: 'done',
                    }
                  : {
                        title: 'Prise en charge',
                        detail: 'prestataire, devis',
                        state: dossier.stage === 'deposited' ? 'late' : 'wait',
                    },
              ...(dossier.takenCharge
                  ? [
                        dossier.takenCharge.underWarranty
                            ? ({
                                  title: 'Sous garantie',
                                  detail: 'sans frais',
                                  state: 'done',
                              } as TrailStep)
                            : ({
                                  title: `Devis · ${n(dossier.quote?.amount ?? 0)} ${settings.currency}`,
                                  detail:
                                      dossier.quoteDecision?.status === 'approved'
                                          ? `validé par ${dossier.quoteDecision.byName ?? '—'}${dossier.quoteDecision.level === 'finance' ? ' (Finance)' : ''}`
                                          : dossier.quoteDecision?.status === 'rejected'
                                            ? `refusé — ${dossier.quoteDecision.reason ?? ''}`
                                            : 'en attente de la Finance',
                                  state:
                                      dossier.quoteDecision?.status === 'approved'
                                          ? 'done'
                                          : dossier.quoteDecision?.status === 'rejected'
                                            ? 'fail'
                                            : 'late',
                              } as TrailStep),
                    ]
                  : []),
              {
                  title: 'Récupération',
                  detail:
                      dossier.stage === 'at_repairer'
                          ? `chez ${dossier.takenCharge?.repairer ?? 'le prestataire'} · facture à joindre`
                          : 'après réparation',
                  state: dossier.stage === 'at_repairer' ? 'late' : 'wait',
              },
          ]
        : null;

    const handleRetire = () => {
        if (item.status !== 'Disponible' && item.status !== 'En réparation') {
            showToast('Un équipement attribué ne peut pas sortir du parc.', 'error');
            return;
        }

        setIsRetireSheetOpen(true);
    };

    const handleRetireConfirmed = (reason: RetirementReason, method: AttestationMethod) => {
        if (deleteEquipment(item.id, reason, method)) {
            showToast(
                `${item.name} est sorti du parc — ${RETIREMENT_REASON_LABELS[reason]}.`,
                'success',
            );
            if (isDemoSeedEquipment(item.id)) showToast(DEMO_RESEED_NOTICE, 'info');
            onBack();
            return;
        }
        showToast('La sortie du parc a échoué.', 'error');
    };

    /**
     * **Les deux lignes d'un passage de main en cours** (06.1). Elles se lisent sur
     * l'objet lui-même — qui a remis, quand, par quelle méthode ; qui doit confirmer,
     * et depuis combien de temps. Rien n'est déduit : ce que la fiche ne porte pas
     * n'est pas affiché.
     */
    const handoverTrail: TrailStep[] | null = (() => {
        if (item.assignmentStatus !== 'PENDING_DELIVERY' || !item.user?.name) return null;

        const handedAt = item.assignedAt ? new Date(item.assignedAt) : undefined;
        const waitingDays = handedAt
            ? Math.floor((Date.now() - handedAt.getTime()) / 86400000)
            : undefined;

        return [
            {
                state: 'done',
                title: `${item.assignedByName || 'L’informatique'} atteste avoir remis`,
                detail: [
                    handedAt
                        ? handedAt.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                          })
                        : undefined,
                    item.handoverProof,
                ]
                    .filter(Boolean)
                    .join(' · '),
            },
            {
                /* Ambre passé trois jours : l'attente cesse d'être normale et le dit
                   d'elle-même, sans qu'on ait à comparer deux dates de tête. */
                state: typeof waitingDays === 'number' && waitingDays >= 3 ? 'late' : 'wait',
                title:
                    typeof waitingDays === 'number' && waitingDays >= 3
                        ? `${item.user.name} n’a pas confirmé`
                        : `${item.user.name} doit confirmer la réception`,
                detail:
                    typeof waitingDays === 'number' && waitingDays > 0
                        ? `dans sa file depuis ${waitingDays} jour${waitingDays > 1 ? 's' : ''}`
                        : 'c’est ce qui reste',
            },
        ];
    })();

    /**
     * `.btn-d` de 04.2 — **le geste secondaire posé sur le héro sombre** : blanc à 12 %,
     * encre claire. `tonal` peignait un fond presque noir sur un héro presque noir : le
     * bouton ne se distinguait plus du voile, et « Restituer » se lisait comme un texte.
     */
    const BOUTON_SUR_HERO =
        'bg-white/[0.12] text-inverse-on-surface shadow-none hover:bg-white/[0.18]';

    /** Le geste primaire **suit l'état** — c'est la règle du héro (04.2). */
    const primaryAction = (() => {
        /* **Le geste suit l'étape de la réparation** (24/09) : un seul, et celui de qui
           tient l'étape — l'informatique reçoit, prend en charge, récupère ; la Finance
           tranche le devis. */
        if (dossier) {
            const geste = (glyph: typeof Tray, libelle: string, onClick: () => void) => (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={glyph} size={20} />}
                    onClick={onClick}
                >
                    {libelle}
                </Button>
            );
            if (dossier.stage === 'quote_pending') {
                return permissions.canManageFinance ? (
                    geste(Receipt, 'Examiner le devis', () => setIsQuoteOpen(true))
                ) : (
                    <p className="text-on-nav-surface-variant text-ts-sub leading-ts-sub w-full">
                        Le devis attend la Finance.
                    </p>
                );
            }
            if (!permissions.canManageInventory) return null;
            if (dossier.stage === 'declared')
                return geste(Tray, 'Recevoir le dépôt', () => setIsDepositOpen(true));
            if (dossier.stage === 'deposited')
                return geste(Wrench, 'Prendre en charge', handleTakeCharge);
            return geste(ArrowUUpLeft, 'Récupérer', handleEndRepair);
        }

        /* Une réception en attente passe **avant** la branche du porteur : le
           bénéficiaire est justement la personne censée confirmer, et la branche
           « non-gestionnaire » retournait avant ce test — il ne voyait donc jamais
           le geste, seulement « Déclarer un incident » et « Restituer ». C'est la
           moitié UI du défaut que le lot 7 corrige côté écriture (§9.0/D15).
           La confirmation passe par l'écriture unique du store, qui synchronise
           l'approbation liée que la fiche oubliait. Lot 7, S2. */
        if (item.assignmentStatus === 'PENDING_DELIVERY' && isReceivingParty) {
            /* Le bouton **ouvre l'acte**, il ne le pose pas : confirmer une réception
               est l'un des neuf actes de 17.4, et un acte s'atteste. Il écrivait
               directement, si bien que le passage de main n'avait de preuve que d'un
               côté — celui qui remet signait, celui qui reçoit tapait un bouton. */
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={Check} size={20} />}
                    onClick={() => setConfirmationOuverte(true)}
                >
                    Confirmer la réception
                </Button>
            );
        }

        /* **Une remise en attente donne deux gestes au gestionnaire** (06.1,
           colonne 5) : relancer celui qui doit confirmer, ou reprendre l'objet.
           L'attente n'était qu'un mot dans le héro — on la constatait sans pouvoir
           rien en faire, et l'objet restait ainsi des semaines. */
        if (item.assignmentStatus === 'PENDING_DELIVERY' && permissions.canManageInventory) {
            return (
                <div className="duo-de-gestes w-full gap-3">
                    <Button
                        variant="filled"
                        className="px-3"
                        icon={<Icon glyph={BellRinging} size={20} />}
                        onClick={handleRemindHolder}
                    >
                        Relancer
                    </Button>
                    <Button
                        variant="tonal"
                        className={cn(BOUTON_SUR_HERO, 'px-3')}
                        onClick={handleCancelHandover}
                    >
                        Annuler la remise
                    </Button>
                </div>
            );
        }

        if (!permissions.canManageInventory) {
            /*
              `.hact.two` de 04.2, « Vue — porteur » : *« deux gestes de même largeur »*,
              **côte à côte**, 12 entre eux et 12 d'intérieur. Ils étaient empilés, en pleine
              largeur, avec 10 d'écart — deux rangées de 48 là où la planche en tient une.

              « Incident », pas « Déclarer un incident » : à 154 px, la moitié du héro, le
              libellé long ne tient pas, et le pictogramme d'alerte dit déjà l'acte. La
              feuille qui s'ouvre porte le nom entier dans son titre. « Restituer » prend le
              blanc à 12 % de `.btn-d`, le jaune restant au geste qui signale.
            */
            return (
                <div className="duo-de-gestes w-full gap-3">
                    <Button
                        variant="filled"
                        className="px-3"
                        icon={<Icon glyph={Warning} size={20} />}
                        onClick={handleDeclareIncident}
                        aria-label="Déclarer un incident"
                    >
                        Incident
                    </Button>
                    <Button
                        variant="tonal"
                        className={cn(BOUTON_SUR_HERO, 'px-3')}
                        icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                        onClick={() =>
                            navigate(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`)
                        }
                    >
                        Restituer
                    </Button>
                </div>
            );
        }

        if (item.status === 'Disponible') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={ArrowCircleRight} size={20} />}
                    onClick={handleAssign}
                >
                    Attribuer
                </Button>
            );
        }
        if (item.status === 'Attribué') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                    onClick={() =>
                        navigate(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`)
                    }
                >
                    Restituer
                </Button>
            );
        }
        if (item.status === 'En réparation') {
            /* `.e-rep` de 04.2 : **« Réceptionner le retour »**, le geste de 04.4 qui
               referme l'incident — « Clore l'intervention » nommait l'effet, pas l'acte
               (10/09). Le glyphe est celui du retour, comme sur « Restituer ». */
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                    onClick={handleEndRepair}
                >
                    Réceptionner le retour
                </Button>
            );
        }
        return null;
    })();

    const menuItems = [
        ...(permissions.canManageInventory
            ? [
                  {
                      id: 'edit',
                      label: 'Modifier la fiche',
                      description: 'code, modèle, emplacement, spécifications',
                      onSelect: () => navigate(`/inventory/edit/${item.id}`),
                  },
                  {
                      id: 'incident',
                      label: 'Déclarer un incident',
                      description: 'ouvre un dossier de réparation : dépôt, devis, retour',
                      onSelect: handleDeclareIncident,
                  },
                  ...(item.status === 'En réparation' &&
                  (!item.repair ||
                      item.repair.stage === 'declared' ||
                      item.repair.stage === 'deposited')
                      ? [
                            {
                                id: 'take_charge',
                                label: 'Prendre en charge',
                                description: 'le réparateur, la date de retour, qui paie',
                                onSelect: handleTakeCharge,
                            },
                        ]
                      : []),
                  {
                      id: 'reassign',
                      label: 'Réaffecter',
                      description: 'restitue et attribue en un geste',
                      onSelect: handleReassign,
                  },
                  {
                      id: 'retire',
                      label: 'Sortir du parc',
                      description: 'retire des disponibles, conserve l’historique',
                      destructive: true,
                      dividerBefore: true,
                      onSelect: handleRetire,
                  },
              ]
            : []),
    ];

    // ---- proportions -----------------------------------------------------------
    const warrantyPercent =
        purchaseDate && item.warrantyEnd
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      ((Date.now() - new Date(purchaseDate).getTime()) /
                          (new Date(item.warrantyEnd).getTime() -
                              new Date(purchaseDate).getTime())) *
                          100,
                  ),
              )
            : null;

    return (
        <>
            <DetailTemplate
                code={item.name}
                onBack={onBack}
                /* 06.3 — la clôture se lit au-dessus de l'état qu'elle a produit. */
                banner={cloture ? <ClosureBanner {...cloture} fadeAfterMs={8000} /> : undefined}
                menu={
                    menuItems.length > 0 ? (
                        <Menu
                            align="end"
                            items={menuItems}
                            trigger={
                                <Button variant="text" iconOnly aria-label="Autres actions">
                                    <Icon glyph={DotsThreeVertical} size="geste" />
                                </Button>
                            }
                        />
                    ) : undefined
                }
                hero={
                    <DetailHero
                        status={{
                            icon: status.icon,
                            label: status.label,
                            tone: statusHeroTone(status.tone),
                        }}
                        /* Le site rejoint l'étiquette — « Ordinateur portable · Bureau Paris » —
                       au lieu d'occuper une rangée de fait à lui seul (planche 04.2, `.ty`). */
                        label={
                            item.site
                                ? `${getCategoryLabel(item.type)} · ${item.site}`
                                : getCategoryLabel(item.type)
                        }
                        subject={item.model || item.name}
                        /* **La photo se regarde à part** (23/09) : elle tapissait le héro,
                           floue sous son voile ; l'œil l'ouvre en plein écran, à sa taille. */
                        corner={
                            item.image ? (
                                <ImagePreview src={item.image} subject={item.model || item.name} />
                            ) : undefined
                        }
                        relation={
                            item.status === 'En réparation'
                                ? {
                                      vignette: <Icon glyph={Wrench} size={20} />,
                                      title: motifIncident(item) || presentationEtat(item).label,
                                      detail:
                                          phraseEtape(item) ??
                                          `signalé le ${formatDate(item.repairStartDate)} · en atelier`,
                                  }
                                : item.assignmentStatus === 'PENDING_DELIVERY' && holder
                                  ? {
                                        vignette: initials(holder.name),
                                        title: `En attente de ${holder.name}`,
                                        detail: 'attribué, réception non confirmée',
                                        onOpen: () => navigate(`/users/${holder.id}`),
                                    }
                                  : holder
                                    ? {
                                          vignette: initials(holder.name),
                                          title: holder.name,
                                          /* Le porteur peut être suspendu ou sur le départ : le
                                         signal posé par `updateUser` se lit ici, sous la
                                         rangée du porteur. Planche 04.2, réglage « Porteur »
                                         — lot 2, D7. */
                                          detail: (
                                              <>
                                                  {item.confirmedAt
                                                      ? `porteur depuis le ${formatDate(item.confirmedAt)} · réception confirmée`
                                                      : 'réception non confirmée'}
                                                  {item.holderAlert && (
                                                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] leading-4 font-medium text-[var(--tk-color-live-ambre)]">
                                                          <span className="h-[7px] w-[7px] shrink-0 rounded-[2px] bg-[var(--tk-color-live-ambre)]" />
                                                          {item.holderAlert.kind === 'suspended'
                                                              ? `À récupérer — porteur suspendu le ${formatDate(item.holderAlert.since)}`
                                                              : `À récupérer avant son départ le ${formatDate(item.holderAlert.until)}`}
                                                      </span>
                                                  )}
                                              </>
                                          ),
                                          onOpen: () => navigate(`/users/${holder.id}`),
                                      }
                                    : {
                                          vignette: <Icon glyph={Package} size={20} />,
                                          title: 'Non attribué',
                                          detail: item.site
                                              ? `en stock au ${item.site}`
                                              : 'en stock',
                                      }
                        }
                        /* **Les repères chiffrés sont des tuiles du héro** — 04.2, passe
                           du 05/09 : *« deux côte à côte, la valeur monétaire en pleine
                           largeur — un prix à sept chiffres y tient. Pas de teinte : le
                           chiffre et son libellé suffisent. »* Ils vivaient sous le héro,
                           en tuiles teintées à pictogramme : trois couleurs et trois
                           glyphes pour dire l'âge, la garantie et le prix, alors que ce
                           sont les qualifiants du sujet et qu'ils appartiennent au voile
                           (R3 : *« trois métriques au plus, dans le voile »*). */
                        metrics={
                            tiles.length > 0
                                ? (tiles.slice(0, 3).map((tile) => ({
                                      value: tile.value,
                                      label: tile.label,
                                      wide: tile.wide,
                                  })) as unknown as DetailMetrics)
                                : undefined
                        }
                        metricsStyle="qual"
                        /* 04.2 au bureau : trois tuiles de front, la large redevient ordinaire. */
                        metricsDeskColumns={3}
                        actions={primaryAction}
                    />
                }
                /* **La colonne de gauche ne tient plus le héro seul** (23/09) : au bureau,
                   la remise en cours, l'historique et les documents passent sous lui — ce
                   qui s'est passé à l'objet se lit à côté de son état, et la référence
                   (numéro de série, garantie) reste à droite. Au téléphone l'ordre ne
                   change pas : ils suivent les cartes de référence, comme avant. */
                asideTail={
                    <>
                        {etapesReparation && (
                            <RuleGroup header="Où en est la réparation">
                                <HandoverTrail steps={etapesReparation} />
                            </RuleGroup>
                        )}

                        {handoverTrail && (
                            <RuleGroup header="Où en est la remise">
                                <HandoverTrail steps={handoverTrail} />
                            </RuleGroup>
                        )}

                        {permissions.canManageInventory && (
                            <section className="rounded-card bg-surface p-4">
                                <header className="mb-2 flex min-h-6 items-center justify-between gap-3">
                                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                                        Historique
                                    </h3>
                                </header>
                                {history.length > 0 ? (
                                    <>
                                        {/* `.ev` — la rangée d'événement de 04.2 : marque ronde de 32,
                                    le fait en 16 sur 24, la date en 14 sur 20 ; 56 de haut,
                                    12 de remplissage, un filet entre deux. Elle passait par
                                    `ReferenceRow`, qui est une rangée de référence, pas de
                                    récit. */}
                                        <div className="mt-2">
                                            {history.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-3 first:border-t-0"
                                                >
                                                    <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                                                        <Icon
                                                            glyph={ClockCounterClockwise}
                                                            size={20}
                                                        />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span
                                                            title={event.title}
                                                            className="text-on-surface text-ts-body leading-ts-body block truncate"
                                                        >
                                                            {event.title}
                                                        </span>
                                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub mt-0.5 block tabular-nums">
                                                            {event.date}
                                                        </span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* `.more` — vers **l'Historique** (18.1), qui existe depuis le
                                    05/09 : le renvoi menait à Audit, qui n'est pas là où le
                                    journal se lit. */}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/history')}
                                            className="border-outline-variant text-on-surface text-ts-body leading-ts-body mt-5 flex min-h-12 w-full cursor-pointer items-center gap-2.5 border-t text-left"
                                        >
                                            <span>
                                                {history.length > 1
                                                    ? `Les ${history.length} événements`
                                                    : 'L’événement'}
                                            </span>
                                            <span className="text-text-secondary flex-1 text-right text-[0.75rem] leading-4 whitespace-nowrap">
                                                dans l’Historique
                                            </span>
                                            <Icon
                                                glyph={CaretDown}
                                                size={20}
                                                className="text-text-secondary -rotate-90"
                                            />
                                        </button>
                                    </>
                                ) : (
                                    /* Le vide garde sa place dans la carte (22/09). */
                                    <CardEmptyState
                                        glyph={ClockCounterClockwise}
                                        title="Aucun mouvement"
                                        description="Les remises, les retours et les réparations de cet équipement s'afficheront ici."
                                    />
                                )}
                            </section>
                        )}

                        {item.documents && item.documents.length > 0 && (
                            <section className="rounded-card bg-surface p-4">
                                <header className="mb-2 flex min-h-6 items-center justify-between gap-3">
                                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                                        Documents
                                    </h3>
                                    <DemoBadge />
                                </header>
                                {/* `.doc` — vignette de 40, le nom en 16, la nature et le poids en 12,
                            chevron en encre tertiaire ; 56 de haut. */}
                                <div className="mt-2">
                                    {item.documents.map((document) => (
                                        <div
                                            key={document.id}
                                            className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-1.5 first:border-t-0"
                                        >
                                            <span className="rounded-vignette bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center">
                                                <Icon glyph={FileText} size={18} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                                    {document.name}
                                                </span>
                                                <span className="text-on-surface-variant mt-0.5 block text-[0.75rem] leading-4 tabular-nums">
                                                    {document.type}
                                                    {document.size ? ` · ${document.size}` : ''}
                                                </span>
                                            </span>
                                            <Icon
                                                glyph={CaretDown}
                                                size={20}
                                                className="text-text-tertiary -rotate-90"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                }
            >
                <section className="rounded-card bg-surface p-4">
                    {/* `.ch` — un titre de 17 sur 24 en 500, 24 de haut, 8 dessous ; **sans
                        icône** (R15, comme 03.1 : une icône devant chaque titre était du
                        bruit répété). Les rangées suivent à 8. */}
                    <header className="mb-2 flex min-h-6 items-center justify-between gap-3">
                        <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                            Référence technique
                        </h3>
                    </header>
                    <div className="mt-2">
                        {/* Le numéro de série passe en premier, et il est copiable : c'est le
                        seul champ qu'on lit à voix haute au téléphone avec le support. */}
                        <ReferenceRow
                            label="Numéro de série"
                            value={item.serialNumber || '—'}
                            copyable={Boolean(item.serialNumber)}
                        />
                        <ReferenceRow
                            label="Modèle"
                            value={item.model || '—'}
                            quiet={!item.model}
                        />
                        {/* **Une rangée sans valeur n'est pas une rangée** (09.2). La
                            fiche en posait trois — Mémoire, Stockage, Système — quel que
                            soit l'objet : une borne Wi-Fi n'a ni mémoire ni système, et
                            elle affichait « N/A » trois fois. Quand aucune des trois n'est
                            renseignée, une seule ligne le dit, et elle le dit en creux. */}
                        {item.ram && <ReferenceRow label="Mémoire" value={item.ram} />}
                        {item.storage && <ReferenceRow label="Stockage" value={item.storage} />}
                        {item.os && <ReferenceRow label="Système" value={item.os} />}
                        {!item.ram && !item.storage && !item.os && (
                            <ReferenceRow label="Spécifications" value="aucune saisie" quiet />
                        )}
                        {item.lastReturnCondition && (
                            <ReferenceRow
                                label="Réserve d’usage"
                                value={item.lastReturnCondition}
                            />
                        )}
                    </div>
                </section>

                {(warrantyPercent !== null ||
                    (financialStats && permissions.canManageInventory)) && (
                    <section className="rounded-card bg-surface flex flex-col p-4">
                        <header className="mb-2 flex min-h-6 items-center justify-between gap-3">
                            <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                                {permissions.canManageInventory ? 'Garantie et valeur' : 'Garantie'}
                            </h3>
                        </header>

                        {warrantyPercent !== null && (
                            <ProportionRow
                                value={`${Math.round(warrantyPercent)} %`}
                                label="de la garantie écoulée"
                                percent={warrantyPercent}
                                tone={warrantyPercent < 100 ? 'positive' : 'neutral'}
                                note={
                                    warrantyPercent < 100 ? (
                                        <>
                                            Toute réparation est{' '}
                                            <strong className="text-on-surface font-normal">
                                                prise en charge par le fournisseur
                                            </strong>{' '}
                                            jusqu’au{' '}
                                            <strong className="text-on-surface font-normal">
                                                {formatDate(item.warrantyEnd)}
                                            </strong>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            La garantie a expiré le {formatDate(item.warrantyEnd)} :
                                            une réparation s’impute désormais sur le budget du
                                            service.
                                        </>
                                    )
                                }
                            />
                        )}

                        {financialStats && item.financial && permissions.canManageInventory && (
                            <>
                                <ProportionRow
                                    className={
                                        warrantyPercent !== null
                                            ? /* 20 de part et d'autre du filet, comme sur
                                                 l'accueil (24/09) : un seul rythme. */
                                              'border-outline-variant mt-5 border-t pt-2'
                                            : undefined
                                    }
                                    value={`${Math.round(financialStats.progressPercent)} %`}
                                    label={`de la valeur amortie — ${formatCurrency(
                                        financialStats.currentValue,
                                        settings.currency,
                                    )} restent à amortir`}
                                    percent={financialStats.progressPercent}
                                    tone={
                                        financialStats.progressPercent > 80
                                            ? 'attention'
                                            : 'neutral'
                                    }
                                    note={
                                        financialStats.progressPercent > 80 ? (
                                            <strong className="text-on-surface font-normal">
                                                À renouveler cette année.
                                            </strong>
                                        ) : (
                                            <>
                                                Renouvellement à prévoir pour{' '}
                                                <strong className="text-on-surface font-normal">
                                                    {new Date(
                                                        item.financial.purchaseDate,
                                                    ).getFullYear() +
                                                        item.financial.depreciationYears}
                                                </strong>
                                                , fin d’amortissement.
                                            </>
                                        )
                                    }
                                />
                                {/* `.more` — **une rangée de renvoi, pas un bouton** :
                                    `flex`, gouttière 10, 48 de haut, un filet au-dessus,
                                    le libellé en 16, la destination en 12 à droite, le
                                    chevron en encre secondaire. Le `Button` du système
                                    l'habillait de son intérieur et de sa cible tactile :
                                    **le chevron sortait de la carte de 14 px**, à
                                    l'extérieur du fond blanc. */}
                                <button
                                    type="button"
                                    onClick={() => navigate('/finance')}
                                    className="border-outline-variant text-on-surface text-ts-body leading-ts-body mt-5 flex min-h-12 w-full cursor-pointer items-center gap-2.5 border-t text-left"
                                >
                                    {/* `.more` de la planche écrit **« Amortissement »**,
                                        pas « Prix d'achat et amortissement » : la phrase
                                        longue ne laissait plus la place à sa destination,
                                        qui passait à la ligne sous le chevron. */}
                                    <span>Amortissement</span>
                                    <span className="text-text-secondary flex-1 text-right text-[0.75rem] leading-4 whitespace-nowrap">
                                        dans Finances
                                    </span>
                                    <Icon
                                        glyph={CaretDown}
                                        size={20}
                                        className="text-text-secondary -rotate-90"
                                    />
                                </button>
                            </>
                        )}
                    </section>
                )}

                {/*
                  **« Où en est la remise »** — planche 06.1, colonne 5.

                  *« Entre deux attestations, l'objet est en attente : un état visible
                  avec un propriétaire, pas une erreur. »* La fiche disait « En
                  attente » et rien d'autre — ni de qui on attend, ni depuis quand, ni
                  par quelle méthode le premier geste a été attesté. Le lecteur ne
                  pouvait donc ni relancer, ni comprendre.
                */}
            </DetailTemplate>

            {/*
              **La quatrième feuille de 06.1** — la personne confirme sa réception, et
              l'atteste. C'est le seul des quatre passages de main que le porteur pose
              lui-même : les blocs 2 et 3 sont vides (17.4 les note « — »), il ne reste
              que l'objet, l'attestation et la conséquence.
            */}
            <ActSheet
                open={confirmationOuverte}
                onClose={() => setConfirmationOuverte(false)}
                title="Confirmer la réception"
                subtitle="Vous attestez avoir reçu cet équipement."
                subject={{
                    vignette: <Icon glyph={Package} size={20} />,
                    title: item.name,
                    subtitle: [item.model || item.type, item.site].filter(Boolean).join(' · '),
                }}
                signer={{
                    name: currentUser?.name ?? '',
                    pin: currentUser?.pin,
                    id: currentUser?.id,
                }}
                consequence={{
                    /* La conséquence se dit par un pictogramme, une teinte et un
                       mot — la feuille d'acte les exige tous les trois (I3). */
                    tone: 'vert',
                    glyph: CheckCircle,
                    text: (
                        <>
                            L’objet passe <strong>à votre nom</strong>, et l’attente se ferme.
                        </>
                    ),
                }}
                confirmLabel="Je confirme"
                onConfirm={(method) => {
                    const decision = confirmEquipmentReception(item.id, method);
                    if (!decision.allowed) {
                        showToast(decision.reason || 'Confirmation refusée.', 'error');
                        return;
                    }
                    setConfirmationOuverte(false);
                    /*
                     * **06.3, forme 1 — l'écran a changé.** « En attente » devient
                     * « Attribué », le geste devient Restituer, l'attestation passe
                     * en tête de l'historique : tout se met à jour sous les yeux. Le
                     * bandeau n'a qu'à nommer ce qui vient de se produire, puis il
                     * s'efface. Un snackbar par-dessus dirait la même chose deux fois.
                     */
                    setCloture({
                        /* I3 : un état se dit par un pictogramme **et** un mot. Le
                           bandeau les exige tous les deux ; ils manquaient. */
                        tone: 'vert',
                        glyph: CheckCircle,
                        title: 'Réception confirmée',
                        detail: `À votre nom depuis ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
                    });
                }}
            />

            {/* Les deux feuilles d'acte de 04.3. Elles se montent **hors du gabarit** :
            une feuille est une couche de l'écran, pas une section de la fiche. */}
            <ReceiveRepairSheet
                open={isReceiveRepairOpen}
                item={item}
                devise={settings.currency}
                formatMontant={n}
                onClose={() => setIsReceiveRepairOpen(false)}
                onConfirm={(outcome, facture) => {
                    setIsReceiveRepairOpen(false);
                    /* **Un objet du parcours se récupère par son dossier** (24/09) : la
                       facture fait la dépense, le dossier se clôt dans l'historique. */
                    if (item.repair) {
                        void surRecuperation(outcome, facture);
                        return;
                    }
                    if (outcome === 'irreparable') {
                        /* La sortie du parc est un acte à part, irréversible : elle ne
                           se glisse pas dans la fermeture d'une intervention. */
                        setIsReceiveRepairOpen(false);
                        handleRetire();
                        return;
                    }
                    const porteur = item.repairPreviousUser;
                    const decision = updateEquipment(item.id, {
                        status: porteur ? 'En attente' : 'Disponible',
                        user: porteur ?? null,
                        /* Il revient chez son porteur, qui doit encore confirmer :
                           c'est l'attente de 06.1, pas une attribution acquise. */
                        assignmentStatus: porteur ? 'PENDING_DELIVERY' : 'NONE',
                        repairEndDate: new Date().toISOString(),
                        repairPreviousUser: null,
                        ...(outcome === 'diminished'
                            ? {
                                  /* La réserve s'ajoute à la note de la fiche, elle ne
                                     l'écrase pas : ce qui y était dit reste vrai. */
                                  notes: [
                                      item.notes,
                                      'Réparé, mais diminué — réserve notée à la réception.',
                                  ]
                                      .filter(Boolean)
                                      .join('\n'),
                              }
                            : {}),
                    });
                    showToast(
                        decision.allowed
                            ? porteur
                                ? `Réceptionné, il repart chez ${porteur.name}.`
                                : 'Réceptionné, il repasse disponible.'
                            : decision.reason || 'Réception refusée.',
                        decision.allowed ? 'success' : 'error',
                    );
                }}
            />

            <TakeChargeSheet
                open={isTakeChargeOpen}
                item={item}
                holderName={item.repair?.holderName ?? item.repairPreviousUser?.name}
                siteName={item.site}
                brandName={marqueDuModele}
                seuil={seuilDevis(settings)}
                devise={settings.currency}
                resteLigne={resteMaintenance}
                formatMontant={n}
                onClose={() => setIsTakeChargeOpen(false)}
                onConfirm={(valeurs) => {
                    if (item.repair) {
                        void surPriseEnCharge(valeurs);
                        return;
                    }
                    /* Un objet passé « En réparation » avant le parcours : les champs
                       d'avant, sans dossier. */
                    const decision = updateEquipment(item.id, {
                        repairer: valeurs.repairer,
                        repairExpectedReturn: valeurs.expectedReturn,
                        repairCost: valeurs.quote?.amount,
                        repairTicket: valeurs.ticket,
                    });
                    showToast(
                        decision.allowed
                            ? 'Prise en charge enregistrée.'
                            : decision.reason || 'Prise en charge refusée.',
                        decision.allowed ? 'success' : 'error',
                    );
                }}
            />

            <DepositSheet
                open={isDepositOpen}
                item={item}
                signataire={signataireDepot}
                onClose={() => setIsDepositOpen(false)}
                onConfirm={surDepot}
            />

            <QuoteDecisionSheet
                open={isQuoteOpen}
                item={item}
                montant={`${n(item.repair?.quote?.amount ?? 0)} ${settings.currency}`}
                resteApres={
                    resteMaintenance !== null && item.repair?.quote
                        ? (() => {
                              const reste = resteMaintenance - item.repair.quote.amount;
                              return reste < 0
                                  ? {
                                        texte: `La ligne Maintenance dépassera de ${n(-reste)} ${settings.currency}.`,
                                        depasse: true,
                                    }
                                  : {
                                        texte: `Il restera ${n(reste)} ${settings.currency} sur la ligne Maintenance.`,
                                        depasse: false,
                                    };
                          })()
                        : null
                }
                onOpenFile={() => void ouvrirFichier(item.repair?.quote?.fileId)}
                onClose={() => setIsQuoteOpen(false)}
                onDecide={surDecision}
            />

            <IncidentSheet
                open={isIncidentSheetOpen}
                item={item}
                declarerName={currentUser?.name || 'un gestionnaire'}
                declarer={{ pin: currentUser?.pin, id: currentUser?.id }}
                onClose={() => setIsIncidentSheetOpen(false)}
                onDeclare={(payload) => {
                    const decision = declareIncident(item.id, payload);
                    if (!decision.allowed) {
                        showToast(decision.reason || 'Déclaration refusée.', 'error');
                        return;
                    }
                    showToast(
                        payload.outcome === 'serves'
                            ? 'Incident déclaré. L’objet reste chez son porteur.'
                            : payload.outcome === 'immobilised'
                              ? 'Incident déclaré. À déposer à l’informatique.'
                              : 'Incident déclaré. L’équipement est hors service.',
                        'info',
                    );
                }}
            />

            <RetireSheet
                open={isRetireSheetOpen}
                item={item}
                historyCount={events.filter((event) => event.targetId === item.id).length}
                residualValue={
                    financialStats
                        ? formatCurrency(financialStats.currentValue, settings.currency)
                        : undefined
                }
                actorName={currentUser?.name || 'un gestionnaire'}
                actor={{ pin: currentUser?.pin, id: currentUser?.id }}
                onClose={() => setIsRetireSheetOpen(false)}
                onRetire={handleRetireConfirmed}
            />
        </>
    );
};

/** Le voile n'a pas de rouge : sur surface inversée, l'alerte se dit en orange. */
const statusHeroTone = (tone: string): 'positive' | 'info' | 'pending' | 'attention' => {
    if (tone === 'positive' || tone === 'info' || tone === 'pending') return tone;
    return 'attention';
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export default EquipmentDetailsPage;
