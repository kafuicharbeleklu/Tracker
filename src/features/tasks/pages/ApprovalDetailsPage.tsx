import React, { useMemo, useState } from 'react';
import {
    ArrowCounterClockwise,
    Check,
    Handshake,
    Hourglass,
    User as UserIcon,
    X,
    XCircle,
} from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero from '../../../components/ui/DetailHero';
import ActSheet from '../../../components/ui/ActSheet';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import HandoverTrail, { type TrailStep } from '../../../components/ui/HandoverTrail';
import Icon from '../../../components/ui/Icon';
import ScreenState from '../../../components/ui/ScreenState';
import { TextArea } from '../../../components/ui/TextArea';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';
import { formatDate } from '../../../lib/financial';
import type { Approval, ApprovalStatus, Equipment } from '../../../types';

/**
 * **Arbitrer une demande** — planche **06.5**, passe sobre du 03/09.
 *
 * *« La rangée de 03.3 suffit pour un oui ; un non, un renvoi ou un abandon se prennent
 * ici, devant ce qu'on décide. »* La file portait tout : le motif, la décision et le
 * refus tenaient dans une feuille de détail, et l'on tranchait sans voir ce que la
 * personne détient déjà — c'est-à-dire sans la donnée qui fait le oui ou le non.
 *
 * ## Trois étapes, et un seul fil pour les dire
 *
 * Le manager valide, l'informatique remet, le bénéficiaire confirme. Le fil dit où l'on
 * en est, **et où le parcours s'est arrêté** quand il s'arrête : les étapes qui suivent
 * un refus n'ont pas eu lieu, elles ne sont pas « en attente ».
 *
 * Quand le manager dépose pour lui-même, la première étape est **acquise** : son
 * attestation a signé le dépôt, et le fil le dit plutôt que de faire attendre quelqu'un
 * qui n'attend personne.
 *
 * ## Chaque écran voit ce qu'il décide
 *
 * Le manager voit le motif et ce que la personne détient. L'informatique ne valide pas,
 * elle **remet** : elle voit ce qui est disponible sur le site, et ce qui devra être
 * rendu. Le demandeur suit, et peut retirer sa demande tant que rien n'est parti.
 *
 * ## Refuser est sombre, pas rouge
 *
 * *« Rien d'irréversible »* : le demandeur lira le motif et pourra redéposer. Le rouge
 * reste à ce qui ne se défait pas (17.2, C3).
 */

/** Ce que l'état de la demande dit dans le héro — le badge `.bst`. */
const ETAT_BADGE: Record<
    ApprovalStatus,
    {
        label: string;
        tone: 'pending' | 'info' | 'positive' | 'attention' | 'muted';
        icon: typeof Check;
    }
> = {
    WAITING_MANAGER_APPROVAL: { label: 'Attend la validation', tone: 'pending', icon: Hourglass },
    WAITING_IT_PROCESSING: { label: 'Attend l’informatique', tone: 'info', icon: Handshake },
    WAITING_DOTATION_APPROVAL: {
        label: 'Attend la validation de dotation',
        tone: 'pending',
        icon: Hourglass,
    },
    PENDING_DELIVERY: { label: 'Attend la réception', tone: 'pending', icon: UserIcon },
    Completed: { label: 'Remise confirmée', tone: 'positive', icon: Check },
    Rejected: { label: 'Refusée', tone: 'attention', icon: XCircle },
    Cancelled: { label: 'Annulée par le demandeur', tone: 'muted', icon: ArrowCounterClockwise },
};

/**
 * `.hact .btn-ghost` — le second geste du héro. Sur une surface inversée, le creux clair
 * des boutons ordinaires ferait une tache : la planche lui donne un **voile blanc**, et
 * l'encre du héro.
 */
const GESTE_SECOND = '!bg-white/[0.12] !text-inverse-on-surface hover:!bg-white/[0.18]';

/** Depuis combien de jours la demande attend — le fait qui accompagne l'état (R3). */
const joursDepuis = (iso?: string): number | null => {
    if (!iso) return null;
    const depart = new Date(iso).getTime();
    if (Number.isNaN(depart)) return null;
    return Math.max(0, Math.floor((Date.now() - depart) / 86_400_000));
};

const enJours = (jours: number | null): string => {
    if (jours === null) return '';
    if (jours === 0) return 'depuis aujourd’hui';
    return `depuis ${jours} jour${jours > 1 ? 's' : ''}`;
};

interface ApprovalDetailsPageProps {
    approvalId?: string;
    onBack: () => void;
}

const ApprovalDetailsPage: React.FC<ApprovalDetailsPageProps> = ({ approvalId, onBack }) => {
    const { approvals, users, equipment, updateApproval } = useData();
    const { showToast } = useToast();
    const { user: currentUser, permissions } = useAccessControl();
    const { navigate } = useAppNavigation();

    /** L'acte engagé depuis le héro : il s'atteste dans la feuille de 17.4. */
    const [acte, setActe] = useState<'valider' | 'refuser' | 'annuler' | null>(null);
    const [motif, setMotif] = useState('');
    const [refus, setRefus] = useState<string | null>(null);

    const demande = useMemo<Approval | null>(
        () => approvals.find((item) => item.id === approvalId) ?? null,
        [approvals, approvalId],
    );

    const beneficiaire = useMemo(
        () => users.find((person) => person.id === demande?.beneficiaryId) ?? null,
        [users, demande?.beneficiaryId],
    );

    const detenus = useMemo<Equipment[]>(
        () => equipment.filter((item) => item.user?.id === demande?.beneficiaryId),
        [equipment, demande?.beneficiaryId],
    );

    const disponibles = useMemo<Equipment[]>(() => {
        if (!demande) return [];
        const site = beneficiaire?.site;
        return equipment.filter(
            (item) =>
                item.status === 'Disponible' &&
                item.type === demande.equipmentCategory &&
                (!site || item.site === site),
        );
    }, [equipment, demande, beneficiaire?.site]);

    if (!demande) {
        return (
            <ScreenState
                icon={XCircle}
                title="Cette demande n’existe plus"
                description="Elle a peut-être été close, ou son historique déplacé. Le journal, lui, la garde."
                actions={
                    <Button variant="filled" className="!rounded-[4px]" onClick={onBack}>
                        Revenir aux tâches
                    </Button>
                }
            />
        );
    }

    const estLeDemandeur = currentUser?.id === demande.requesterId;
    const estLeBeneficiaire = currentUser?.id === demande.beneficiaryId;
    const estLeManager = Boolean(
        beneficiaire?.managerId && currentUser?.id === beneficiaire.managerId,
    );
    const estInformatique = permissions.canManageInventory;

    const close = ['Completed', 'Rejected', 'Cancelled'].includes(demande.status);
    const badge = ETAT_BADGE[demande.status];
    const attenteDepuis = joursDepuis(demande.updatedAt || demande.createdAt);

    /**
     * Le fil des trois étapes. La première est **acquise sans attente** quand le
     * demandeur est lui-même le manager du bénéficiaire : son dépôt vaut validation.
     */
    const etapes: TrailStep[] = (() => {
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
                    title: estLeManager ? 'Vous validez' : 'Le manager valide',
                    detail: `déposée le ${formatDate(demande.createdAt)}`,
                };

        return [
            premiere,
            {
                state: arretee ? 'wait' : remise ? 'done' : 'late',
                glyph: Handshake,
                title: 'L’informatique remet',
                detail: arretee
                    ? 'n’a pas eu lieu'
                    : remise
                      ? demande.assignedEquipmentName
                      : `choisit ${getCategoryLabel(demande.equipmentCategory).toLowerCase()}`,
            },
            {
                state: arretee ? 'wait' : confirmee ? 'done' : 'wait',
                glyph: UserIcon,
                title: `${estLeBeneficiaire ? 'Vous confirmez' : `${demande.beneficiaryName.split(' ')[0]} confirme`} la réception`,
                detail: arretee ? 'n’a pas eu lieu' : undefined,
            },
        ];
    })();

    const etapeCourante = etapes.findIndex((etape) => etape.state === 'late');

    const trancher = (statut: ApprovalStatus, method: string, raison?: string) => {
        const decision = updateApproval(demande.id, statut, {
            reason: raison,
            method: method === 'pin' ? 'code PIN' : 'signature',
        });
        if (!decision.allowed) {
            setRefus(decision.reason || 'Action non autorisée pour cette demande.');
            return;
        }
        setActe(null);
        setMotif('');
        setRefus(null);
        showToast(
            statut === 'Rejected'
                ? 'Demande refusée. Le motif est transmis.'
                : statut === 'Cancelled'
                  ? 'Demande retirée.'
                  : 'Demande validée. Elle part à l’informatique.',
            'success',
        );
        if (statut !== 'WAITING_IT_PROCESSING') onBack();
    };

    /** Le geste primaire suit l'état, et **qui le lit** (règle du héro, R3). */
    const gestes = (() => {
        if (close) return undefined;

        if (demande.status === 'WAITING_MANAGER_APPROVAL' && (estLeManager || estInformatique)) {
            return (
                <div className="grid w-full grid-cols-2 gap-3">
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Check} size={20} />}
                        onClick={() => setActe('valider')}
                    >
                        Valider
                    </Button>
                    <Button
                        variant="ghost"
                        className={GESTE_SECOND}
                        icon={<Icon glyph={X} size={20} />}
                        onClick={() => setActe('refuser')}
                    >
                        Refuser
                    </Button>
                </div>
            );
        }

        /* L'informatique **ne valide pas, elle remet** : le geste ouvre la feuille de
           remise de 17.4, bénéficiaire et demande connus. */
        if (
            ['WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL'].includes(demande.status) &&
            estInformatique
        ) {
            return (
                <div className="grid w-full grid-cols-2 gap-3">
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Handshake} size={20} />}
                        onClick={() =>
                            navigate(
                                `/wizards/assignment?approvalId=${encodeURIComponent(demande.id)}&userId=${encodeURIComponent(demande.beneficiaryId)}&category=${encodeURIComponent(demande.equipmentCategory)}`,
                            )
                        }
                    >
                        Remettre
                    </Button>
                    <Button
                        variant="ghost"
                        className={GESTE_SECOND}
                        icon={<Icon glyph={X} size={20} />}
                        onClick={() => setActe('refuser')}
                    >
                        Refuser
                    </Button>
                </div>
            );
        }

        /* Retirer sa demande appartient au demandeur seul, et tant que rien n'est parti. */
        if (estLeDemandeur && demande.status !== 'PENDING_DELIVERY') {
            return (
                <Button
                    variant="ghost"
                    className={`w-full ${GESTE_SECOND}`}
                    icon={<Icon glyph={X} size={20} />}
                    onClick={() => setActe('annuler')}
                >
                    Annuler la demande
                </Button>
            );
        }

        return undefined;
    })();

    const rangee = (item: Equipment, note?: string) => (
        <div
            key={item.id}
            className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-2 first:border-t-0"
        >
            <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                <Icon glyph={getCategoryGlyph(item.type)} size={20} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="text-on-surface block truncate text-[16px] leading-6">
                    {item.name}
                </span>
                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                    {[item.model || item.type, note].filter(Boolean).join(' · ')}
                </span>
            </span>
        </div>
    );

    return (
        <>
            <DetailTemplate
                code="Demande"
                onBack={onBack}
                hero={
                    <DetailHero
                        label={
                            close
                                ? 'Demande · close'
                                : demande.isDelegated
                                  ? `Demande · déposée par ${demande.requesterName}`
                                  : estLeBeneficiaire
                                    ? 'Demande · pour vous'
                                    : 'Demande · pour lui-même'
                        }
                        subject={getCategoryLabel(demande.equipmentCategory)}
                        subtitle={[
                            demande.beneficiaryName,
                            beneficiaire?.department,
                            beneficiaire?.site,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                        status={{ icon: badge.icon, label: badge.label, tone: badge.tone }}
                        statusDetail={close ? undefined : enJours(attenteDepuis)}
                        actions={gestes}
                    />
                }
            >
                {/* Ce qu'il demande — le motif, tel qu'il l'a écrit. */}
                {demande.reason && !close && (
                    <Card className="flex flex-col gap-3 p-4">
                        <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                            {estLeBeneficiaire ? 'Ce que vous demandez' : 'Ce qu’il demande'}
                        </h3>
                        <p className="text-on-surface text-[17px] leading-6 text-pretty">
                            «&nbsp;{demande.reason}&nbsp;»
                        </p>
                        {detenus.length > 0 && (
                            <div className="flex flex-col">
                                {detenus.slice(0, 3).map((item) => rangee(item))}
                            </div>
                        )}
                    </Card>
                )}

                {/* La décision — son motif, son auteur, sa méthode. */}
                {close && demande.decisionNote && (
                    <Card className="flex flex-col gap-3 p-4">
                        <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                            La décision
                        </h3>
                        <div className="bg-surface-container flex flex-col gap-1.5 rounded-[4px] px-4 py-3">
                            <p className="text-on-surface text-[16px] leading-6 text-pretty">
                                «&nbsp;{demande.decisionNote.reason}&nbsp;»
                            </p>
                            <p className="text-on-surface-variant text-[14px] leading-5">
                                {[
                                    demande.decisionNote.actorName,
                                    formatDate(demande.decisionNote.at),
                                    demande.decisionNote.method,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Ce qui pourrait partir, et ce qui devra revenir — la vue de l'IT. */}
                {estInformatique &&
                    ['WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL'].includes(
                        demande.status,
                    ) && (
                        <>
                            <Card className="flex flex-col gap-3 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                                        {beneficiaire?.site
                                            ? `Disponibles à ${beneficiaire.site}`
                                            : 'Disponibles'}
                                    </h3>
                                    <span className="text-on-surface-variant text-[14px] leading-5 tabular-nums">
                                        {disponibles.length}
                                    </span>
                                </div>
                                {disponibles.length > 0 ? (
                                    <div className="flex flex-col">
                                        {disponibles.slice(0, 3).map((item) => rangee(item))}
                                    </div>
                                ) : (
                                    <p className="text-on-surface-variant text-[14px] leading-5">
                                        Rien de ce type n’est disponible ici. Refuser dit pourquoi ;
                                        le demandeur pourra redéposer.
                                    </p>
                                )}
                            </Card>

                            {detenus.length > 0 && (
                                <Card className="flex flex-col gap-3 p-4">
                                    <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                                        {estLeBeneficiaire
                                            ? 'Vous détenez déjà'
                                            : 'Il détient déjà'}
                                    </h3>
                                    <div className="flex flex-col">
                                        {detenus.map((item) =>
                                            rangee(
                                                item,
                                                item.type === demande.equipmentCategory
                                                    ? 'à restituer à la remise'
                                                    : undefined,
                                            ),
                                        )}
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                {/* Le parcours — trois étapes, et où il s'arrête. */}
                <Card className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                            Le parcours
                        </h3>
                        <span className="text-on-surface-variant text-[14px] leading-5">
                            {close
                                ? demande.status === 'Completed'
                                    ? 'terminé'
                                    : 'arrêté à 1'
                                : `${etapeCourante >= 0 ? etapeCourante + 1 : 3} sur 3`}
                        </span>
                    </div>
                    <HandoverTrail steps={etapes} />
                </Card>
            </DetailTemplate>

            {/* Chaque décision passe par la feuille d'acte, et garde son motif (17.4). */}
            {acte && (
                <ActSheet
                    open
                    onClose={() => {
                        setActe(null);
                        setRefus(null);
                    }}
                    title={
                        acte === 'valider'
                            ? 'Valider la demande'
                            : acte === 'refuser'
                              ? 'Refuser la demande'
                              : 'Annuler la demande'
                    }
                    subtitle={
                        acte === 'valider'
                            ? 'Elle part à l’informatique, qui remettra.'
                            : acte === 'refuser'
                              ? `${demande.beneficiaryName.split(' ')[0]} lira votre motif. Il pourra redéposer.`
                              : 'Rien n’est perdu : vous pourrez redemander.'
                    }
                    subject={{
                        vignette: (
                            <Icon glyph={getCategoryGlyph(demande.equipmentCategory)} size={20} />
                        ),
                        title: getCategoryLabel(demande.equipmentCategory),
                        subtitle: `demandé par ${demande.requesterName} · ${enJours(joursDepuis(demande.createdAt))}`,
                    }}
                    question={
                        acte === 'valider'
                            ? undefined
                            : {
                                  label:
                                      acte === 'refuser'
                                          ? 'Motif — lu par le demandeur'
                                          : 'Motif — facultatif',
                                  children: (
                                      <TextArea
                                          value={motif}
                                          onChange={(event) => setMotif(event.target.value)}
                                          rows={3}
                                          aria-label="Motif"
                                          placeholder={
                                              acte === 'refuser'
                                                  ? 'Ce que le demandeur doit savoir.'
                                                  : 'Plus besoin, j’ai trouvé autrement…'
                                          }
                                      />
                                  ),
                              }
                    }
                    signer={{ name: currentUser?.name ?? '', pin: currentUser?.pin }}
                    consequence={
                        acte === 'valider'
                            ? {
                                  tone: 'bleu',
                                  glyph: Handshake,
                                  text:
                                      disponibles.length > 0 ? (
                                          <>
                                              Part à l’informatique :{' '}
                                              <strong className="font-medium">
                                                  {disponibles.length} disponible
                                                  {disponibles.length > 1 ? 's' : ''}
                                              </strong>{' '}
                                              sur le site.
                                          </>
                                      ) : (
                                          <>
                                              Part à l’informatique.{' '}
                                              <strong className="font-medium">
                                                  Rien de ce type n’est disponible
                                              </strong>{' '}
                                              sur le site.
                                          </>
                                      ),
                              }
                            : {
                                  tone: 'orange',
                                  glyph: X,
                                  text: (
                                      <>
                                          La demande est{' '}
                                          <strong className="font-medium">close</strong> ; le motif
                                          reste lisible dans l’historique.
                                      </>
                                  ),
                              }
                    }
                    confirmLabel={
                        acte === 'valider'
                            ? 'Valider'
                            : acte === 'refuser'
                              ? 'Refuser'
                              : 'Annuler la demande'
                    }
                    /* Rien d'irréversible : le sombre, pas le rouge (17.2, C3). */
                    confirmVariant={acte === 'valider' ? 'filled' : 'tonal'}
                    cancelLabel={acte === 'annuler' ? 'Garder la demande' : 'Annuler'}
                    onConfirm={(method) =>
                        trancher(
                            acte === 'valider'
                                ? 'WAITING_IT_PROCESSING'
                                : acte === 'refuser'
                                  ? 'Rejected'
                                  : 'Cancelled',
                            method,
                            acte === 'valider' ? undefined : motif.trim() || undefined,
                        )
                    }
                    error={refus}
                />
            )}
        </>
    );
};

export default ApprovalDetailsPage;
