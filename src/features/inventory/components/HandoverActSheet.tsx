import React, { useEffect, useMemo, useState } from 'react';
import { CalendarBlank, Check, Hourglass, Laptop, User as UserIcon } from '@phosphor-icons/react';

import ActSheet, { type ActChoice } from '../../../components/ui/ActSheet';
import ActScanOverlay from './ActScanOverlay';
import Icon from '../../../components/ui/Icon';
import { LIBELLE_ATTESTATION, type AttestationMethod } from '../../../components/ui/Attestation';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { approvalRequiresManagerGate } from '../../../lib/businessRules';
import { formatDate } from '../../../lib/financial';
import type { ApprovalStatus, AssignmentStatus, Equipment, User } from '../../../types';

/**
 * **Remettre l'équipement** — la feuille d'acte de **17.4**, et non plus un assistant.
 *
 * L'assistant d'attribution tenait quatre étapes plein écran : choisir l'objet, choisir
 * la personne, attester, relire une synthèse. 17.4 les proscrit — *« jamais un wizard à
 * étapes, une page de validation »* — parce que la synthèse relisait ce qu'on venait de
 * saisir et que le stepper faisait passer pour un parcours ce qui est **un seul geste**.
 *
 * ## Ce que le point de départ change
 *
 * Il change **ce qui est déjà connu**, jamais la forme. Depuis la fiche d'un objet, le
 * bloc 1 est rempli ; depuis une tâche, les blocs 1 et 2 le sont ; depuis l'accueil, la
 * feuille s'ouvre sur le choix de l'objet — recherche et scan sur une ligne, l'objet
 * demandé en tête, en bleu.
 *
 * ## La liste des disponibles n'est pas restreinte au site
 *
 * La planche intitule le groupe « Disponibles à Lomé Siège ». Filtrer sur le site de
 * celui qui remet **retirerait de la liste** des objets que l'inventaire importé place
 * ailleurs, sans lui donner d'autre chemin pour les atteindre. Le groupe s'appelle donc
 * « Disponibles », les objets du site de l'opérateur passent devant, et aucun ne
 * disparaît.
 *
 * ## L'état « en présence » remplace la case « remise immédiate »
 *
 * L'assistant demandait *avant* d'attester si la remise était immédiate, et écrivait
 * alors les deux attestations d'un coup — la personne était réputée avoir confirmé sans
 * avoir rien signé. La feuille pose la question **après** : l'objet est en attente, et
 * si le destinataire est là, il signe sur cet appareil. Jamais un code sur l'appareil
 * d'un autre.
 */

/** Les initiales servent de vignette quand la personne n'a pas d'avatar. */
const initiales = (nom: string): string => {
    const parts = nom.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || 'U';
};

const prenom = (nom: string): string => nom.trim().split(/\s+/)[0] || nom;

/** « pas celui de Karim », mais « pas celui d'Alice » : l'élision se calcule. */
const deQui = (nom: string): string =>
    /^[aeiouyàâäéèêëîïôöûüh]/i.test(nom) ? `d’${nom}` : `de ${nom}`;

interface HandoverActSheetProps {
    open: boolean;
    onClose: () => void;
    /** L'objet désigné par l'entrée — fiche, tâche, lien profond. */
    initialEquipmentId?: string;
    /** Le destinataire désigné par l'entrée — fiche personne, tâche. */
    initialUserId?: string;
}

const HandoverActSheet: React.FC<HandoverActSheetProps> = ({
    open,
    onClose,
    initialEquipmentId,
    initialUserId,
}) => {
    const { equipment, users, approvals, updateEquipment, updateApproval, addApproval } = useData();
    const { showToast } = useToast();
    const { user: adminUser } = useAccessControl();

    const [objetId, setObjetId] = useState<string | null>(null);
    const [destinataireId, setDestinataireId] = useState<string | null>(null);
    const [approvalId, setApprovalId] = useState<string | null>(null);
    const [categorieSuggeree, setCategorieSuggeree] = useState<string | null>(null);
    const [phase, setPhase] = useState<'acte' | 'presence'>('acte');
    const [scanOuvert, setScanOuvert] = useState(false);
    const [refus, setRefus] = useState<string | null>(null);

    /*
     * L'entrée peut désigner l'objet, la personne, la demande — par les props ou par
     * l'adresse. C'est le seul endroit où la feuille lit l'URL.
     *
     * **Les données n'en font pas partie.** Cette remise à zéro dépendait de la liste
     * des équipements : la remise elle-même modifie cette liste, l'effet repartait, et
     * la feuille retombait sur le choix de l'objet **au moment précis** où elle devait
     * proposer la confirmation en présence. Ce qui rouvre une feuille, c'est son
     * ouverture et son entrée, jamais ce qu'elle vient d'écrire.
     */
    useEffect(() => {
        if (!open) return;

        const hash = window.location.hash;
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const queryString = hashQuery || window.location.search.replace(/^\?/, '');
        const params = queryString ? new URLSearchParams(queryString) : null;

        const equipementDemande = initialEquipmentId || params?.get('equipmentId') || null;
        const personneDemandee = initialUserId || params?.get('userId') || null;

        setApprovalId(params?.get('approvalId') || null);
        setCategorieSuggeree(params?.get('category') || null);
        setDestinataireId(personneDemandee);
        setPhase('acte');
        setScanOuvert(false);
        setRefus(null);

        setObjetId(equipementDemande);
    }, [open, initialEquipmentId, initialUserId]);

    /**
     * L'objet de l'acte — et le contrôle d'éligibilité avec lui : une adresse peut
     * nommer un objet déjà attribué, et le bloc 1 ne doit pas l'accepter. Une fois la
     * remise attestée, l'objet passe « en attente » et **reste le sujet** : c'est de
     * lui que parle la confirmation en présence.
     */
    const objet = useMemo<Equipment | null>(() => {
        const trouve = equipment.find((item) => item.id === objetId) ?? null;
        if (!trouve) return null;
        if (phase === 'presence') return trouve;
        return trouve.status === 'Disponible' || trouve.assignmentStatus === 'PENDING_DELIVERY'
            ? trouve
            : null;
    }, [equipment, objetId, phase]);

    const destinataire = useMemo<User | null>(
        () => users.find((person) => person.id === destinataireId) ?? null,
        [users, destinataireId],
    );

    const demande = useMemo(
        () => approvals.find((approval) => approval.id === approvalId) ?? null,
        [approvals, approvalId],
    );

    /*
     * Le bloc 2 est **connu** dès que quelque chose le désigne : la demande validée qui
     * a ouvert la feuille, ou l'objet lui-même quand il attend déjà d'être remis à
     * quelqu'un. Le redemander alors serait faire choisir ce qui est déjà décidé.
     */
    useEffect(() => {
        if (destinataireId) return;
        const designe = demande?.beneficiaryId || objet?.user?.id;
        if (designe) setDestinataireId(designe);
    }, [demande, objet, destinataireId]);

    /** Ce qui peut être remis — la même liste pour la recherche et pour le scan. */
    const eligibles = useMemo(
        () =>
            equipment.filter(
                (item) =>
                    item.status === 'Disponible' || item.assignmentStatus === 'PENDING_DELIVERY',
            ),
        [equipment],
    );

    /** Ce qui peut être remis, l'objet réclamé par une demande en tête. */
    const objetsDisponibles = useMemo<ActChoice[]>(() => {
        const reclames = new Map<string, string>();
        for (const approval of approvals) {
            if (approval.assignedEquipmentId && approval.beneficiaryName) {
                reclames.set(approval.assignedEquipmentId, approval.beneficiaryName);
            }
        }

        return eligibles
            .map((item) => {
                const reclamePar = reclames.get(item.id);
                const memeSite = Boolean(adminUser?.site) && item.site === adminUser?.site;
                return {
                    id: item.id,
                    vignette: <Icon glyph={Laptop} size={20} />,
                    highlighted:
                        Boolean(reclamePar) ||
                        (Boolean(categorieSuggeree) && item.type === categorieSuggeree),
                    /* Le produit nomme un objet par son code — « LPT-DK-03 » — et
                       range le numéro d'inventaire dessous : la feuille dit la même
                       chose que la fiche, et la recherche accepte toujours les deux. */
                    title: item.name,
                    subtitle: [
                        item.model || item.type,
                        item.site,
                        reclamePar ? `demandé par ${reclamePar}` : null,
                    ]
                        .filter(Boolean)
                        .join(' · '),
                    searchText: `${item.assetId} ${item.name} ${item.model} ${item.type}`,
                    memeSite,
                };
            })
            .sort((a, b) => Number(b.memeSite) - Number(a.memeSite))
            .map(({ memeSite: _memeSite, ...choix }) => choix);
    }, [eligibles, approvals, adminUser?.site, categorieSuggeree]);

    /** Qui peut recevoir : un compte en service, jamais un compte suspendu ni en attente. */
    const beneficiairesPossibles = useMemo<ActChoice[]>(
        () =>
            users
                .filter((person) => person.status !== 'inactive' && person.status !== 'pending')
                .map((person) => ({
                    id: person.id,
                    vignette: initiales(person.name),
                    title: person.name,
                    subtitle: [person.department, person.site].filter(Boolean).join(' · '),
                    searchText: `${person.name} ${person.department} ${person.email}`,
                })),
        [users],
    );

    const passeParLeManager = Boolean(
        demande &&
        demande.status === 'WAITING_IT_PROCESSING' &&
        approvalRequiresManagerGate(demande, users),
    );

    const remettre = (method: AttestationMethod) => {
        if (!objet || !destinataire) return;
        setRefus(null);

        /* « Qui, quand, par quelle méthode » : le libellé vient du même endroit que
           celui de l'historique, sinon les deux divergent au premier ajout. */
        const preuve = LIBELLE_ATTESTATION[method];
        const maintenant = new Date().toISOString();
        const porteur = {
            id: destinataire.id,
            name: destinataire.name,
            avatar: destinataire.avatar,
            email: destinataire.email,
        };

        if (approvalId && demande) {
            const suite: ApprovalStatus = passeParLeManager
                ? 'WAITING_DOTATION_APPROVAL'
                : 'PENDING_DELIVERY';

            const decision = updateApproval(approvalId, suite, {
                assignedEquipmentId: objet.id,
                assignedEquipmentName: objet.name,
            });
            if (!decision.allowed) {
                setRefus(decision.reason || 'Action non autorisée pour cette demande.');
                return;
            }

            updateEquipment(objet.id, {
                status: 'En attente',
                assignmentStatus: suite,
                assignedAt: maintenant,
                assignedBy: adminUser?.id,
                assignedByName: adminUser?.name,
                /* « Qui, quand, par quelle méthode » (06.2) : c'est ce qui rend le
                   passage de main relisible deux ans après. */
                handoverProof: preuve,
                user: porteur,
            });

            if (suite === 'WAITING_DOTATION_APPROVAL') {
                showToast('En attente de validation par le manager.', 'success');
                onClose();
                return;
            }

            showToast('Remise attestée. En attente de confirmation.', 'success');
            setPhase('presence');
            return;
        }

        addApproval({
            requesterId: adminUser?.id || '1',
            requesterName: adminUser?.name || 'Admin',
            requesterRole: adminUser?.role || 'Admin',
            beneficiaryId: destinataire.id,
            beneficiaryName: destinataire.name,
            isDelegated: true,
            equipmentCategory: objet.type,
            reason: 'Attribution directe par informatique',
            urgency: 'normal',
            status: 'PENDING_DELIVERY' as ApprovalStatus,
            createdAt: maintenant,
            updatedAt: maintenant,
            requester: adminUser?.name || 'Admin',
            equipmentName: objet.name,
            equipmentType: objet.type,
            requestType: 'Attribution',
            requestDate: formatDate(),
            image: objet.image,
            assignedEquipmentId: objet.id,
            assignedEquipmentName: objet.name,
        });

        updateEquipment(objet.id, {
            status: 'En attente',
            assignmentStatus: 'PENDING_DELIVERY' as AssignmentStatus,
            assignedAt: maintenant,
            assignedBy: adminUser?.id || '1',
            assignedByName: adminUser?.name || 'Admin',
            handoverProof: preuve,
            user: porteur,
        });

        showToast('Remise attestée. En attente de confirmation.', 'success');
        setPhase('presence');
    };

    /** Le destinataire est là : il atteste sur cet appareil, par signature seulement. */
    const confirmerEnPresence = () => {
        if (!objet || !destinataire) return;
        setRefus(null);

        const maintenant = new Date().toISOString();

        if (approvalId) {
            const decision = updateApproval(approvalId, 'Completed');
            if (!decision.allowed) {
                setRefus(decision.reason || 'Action non autorisée pour cette demande.');
                return;
            }
        }

        updateEquipment(objet.id, {
            status: 'Attribué',
            assignmentStatus: 'CONFIRMED' as AssignmentStatus,
            confirmedBy: destinataire.id,
            confirmedAt: maintenant,
            /* L'historique dit sur quel appareil la signature a été prise. */
            handoverProof: `signature sur l'appareil de ${adminUser?.name || 'l’informatique'}`,
        });

        showToast('Réception confirmée. L’objet est attribué.', 'success');
        onClose();
    };

    if (!open) return null;

    if (phase === 'presence' && objet && destinataire) {
        return (
            <ActSheet
                open
                onClose={onClose}
                title={`${prenom(destinataire.name)} confirme-t-il maintenant ?`}
                subtitle="S’il est là, tendez-lui l’appareil. Sinon, la tâche l’attend."
                subject={null}
                preamble={
                    <div className="flex flex-col">
                        <div className="flex min-h-14 items-center gap-3 py-2">
                            <span className="bg-tint-vert text-on-tint-vert flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                <Icon glyph={Check} size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[16px] leading-6">
                                    {adminUser?.name || 'Vous'} atteste avoir remis
                                </span>
                                <span className="text-on-surface-variant block text-[14px] leading-5">
                                    à l’instant · {objet.handoverProof || 'attestation'}
                                </span>
                            </span>
                        </div>
                        <div className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-2">
                            <span className="bg-surface-container text-text-tertiary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                <Icon glyph={UserIcon} size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[16px] leading-6">
                                    {destinataire.name} atteste avoir reçu
                                </span>
                                <span className="text-on-surface-variant block text-[14px] leading-5">
                                    par signature, sur cet appareil
                                </span>
                            </span>
                        </div>
                    </div>
                }
                /* Jamais de code sur l'appareil d'un autre : le tracé, et lui seul. */
                signer={{ name: destinataire.name }}
                attestationLabel={`Signature de ${destinataire.name}`}
                consequence={{
                    tone: 'bleu',
                    glyph: UserIcon,
                    text: (
                        <>
                            L’objet passe <strong>attribué</strong>, sans attente.
                        </>
                    ),
                }}
                confirmLabel="Il confirme"
                cancelLabel="Plus tard"
                onConfirm={confirmerEnPresence}
                error={refus}
            />
        );
    }

    return (
        <>
            {scanOuvert && (
                <ActScanOverlay
                    eligibles={eligibles}
                    tip="Cadrez l’étiquette collée sur l’objet. Code-barres ou QR, le viseur s’ajuste seul."
                    acceptLabel="Remettre celui-ci"
                    onClose={() => setScanOuvert(false)}
                    onPick={setObjetId}
                />
            )}
            <ActSheet
                open
                onClose={onClose}
                title="Remettre l’équipement"
                subtitle={
                    destinataire
                        ? `Vous attestez votre geste, pas celui ${deQui(prenom(destinataire.name))}.`
                        : 'Vous attestez votre geste, pas celui du bénéficiaire.'
                }
                subject={
                    objet
                        ? {
                              vignette: <Icon glyph={Laptop} size={20} />,
                              title: objet.name,
                              subtitle: [objet.model || objet.type, objet.site]
                                  .filter(Boolean)
                                  .join(' · '),
                          }
                        : null
                }
                subjectPicker={{
                    title: 'Remettre un équipement',
                    prompt: 'Lequel ?',
                    searchPlaceholder: 'Identifiant, modèle, série',
                    groupLabel: 'Disponibles',
                    onScan: () => setScanOuvert(true),
                    items: objetsDisponibles,
                    onPick: setObjetId,
                    emptyLabel: 'Aucun équipement disponible ne correspond.',
                }}
                counterparty={
                    destinataire
                        ? {
                              label: 'Remis à',
                              vignette: initiales(destinataire.name),
                              vignetteTone: 'bleu',
                              title: destinataire.name,
                              subtitle: [
                                  destinataire.department,
                                  demande ? 'demande validée' : null,
                              ]
                                  .filter(Boolean)
                                  .join(' · '),
                          }
                        : null
                }
                counterpartyPicker={{
                    title: 'Remettre l’équipement',
                    prompt: 'À qui ?',
                    searchPlaceholder: 'Nom, service',
                    groupLabel: 'Bénéficiaires',
                    items: beneficiairesPossibles,
                    onPick: setDestinataireId,
                    emptyLabel: 'Aucun compte en service ne correspond.',
                }}
                question={{
                    label: 'À partir du',
                    children: (
                        <div className="bg-surface-container text-on-surface flex min-h-12 items-center gap-2.5 rounded-[4px] px-3.5 text-[16px] leading-6">
                            <Icon
                                glyph={CalendarBlank}
                                size={18}
                                className="text-on-surface-variant shrink-0"
                            />
                            Aujourd’hui
                        </div>
                    ),
                }}
                signer={{ name: adminUser?.name ?? '', pin: adminUser?.pin, id: adminUser?.id }}
                consequence={{
                    tone: 'ambre',
                    glyph: Hourglass,
                    text: passeParLeManager ? (
                        <>
                            L’objet passe <strong>en attente</strong> de la validation du manager.
                        </>
                    ) : (
                        <>
                            L’objet passe <strong>en attente</strong> jusqu’à ce que{' '}
                            {destinataire ? prenom(destinataire.name) : 'le bénéficiaire'} confirme.
                        </>
                    ),
                }}
                confirmLabel="Remettre"
                /*
                 * *« Annuler, ou Plus tard si l'acte vient d'une tâche »* (17.4). Un
                 * objet déjà « en attente de remise » **est** une tâche de la file :
                 * l'acte reste dû quoi qu'il arrive ici, et refermer la feuille ne
                 * l'annule pas, elle le remet à plus tard.
                 */
                cancelLabel={
                    objet?.assignmentStatus === 'PENDING_DELIVERY' ? 'Plus tard' : 'Annuler'
                }
                onConfirm={remettre}
                error={refus}
            />
        </>
    );
};

export default HandoverActSheet;
