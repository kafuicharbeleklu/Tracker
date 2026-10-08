import React, { useMemo } from 'react';
import { ClipboardText, Laptop } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import HandoverTrail from '../../../components/ui/HandoverTrail';
import Icon from '../../../components/ui/Icon';
import { getStatusLabel } from '../../../lib/businessRules';
import { getCategoryLabel } from '../../../constants/glossary';
import type { Equipment, HistoryEvent, User } from '../../../types';
import {
    autrePartie,
    faitDe,
    filDe,
    lieuDe,
    lire,
    parcoursDeLaDemande,
    partieDe,
    quandDe,
    type Registres,
} from '../lib/journal';
import ParcoursDeDemande, { SignaturesDeLaDemande, etapesSignees } from './ParcoursDeDemande';
import Renvoi, { initiales } from './Renvoi';

/** « Vendredi 4 septembre à 19:32 » — le sous-titre commence une ligne. */
const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

interface FactSheetProps {
    fait: HistoryEvent | null;
    /** Tout le journal lisible : la seconde attestation d'un passage de main y est. */
    journal: readonly HistoryEvent[];
    registres: Registres;
    users: readonly User[];
    equipment: readonly Equipment[];
    onClose: () => void;
    /** Ouvre la fiche de l'objet. */
    onOpenEquipment?: (id: string) => void;
    /** Ouvre la fiche d'une personne — absent pour qui ne peut pas la lire. */
    canOpenUser: (id: string) => boolean;
    onOpenUser?: (id: string) => void;
    /**
     * Ouvre la demande (06.5) — le fait d'une demande y renvoie (08/10). La file des Tâches
     * gardait son propre historique des demandes tranchées ; il n'y en a plus qu'un, celui-ci,
     * et c'est d'ici qu'on rouvre la demande, son parcours et son motif.
     */
    onOpenApproval?: (id: string) => void;
    /**
     * **Le fait ouvert à côté du journal** (P2a, 25/09) — dès 840, en cartes : le même
     * contenu, dans une carte du panneau et non dans une feuille. Rien ne voile le journal.
     */
    enPanneau?: boolean;
}

/**
 * **Un événement ouvert, sa preuve** — 18.1, colonne 3.
 *
 * *« Le fait en titre, puis qui a attesté quoi et comment. Deux rangées renvoient à
 * l'objet et à la personne ; rien ne se modifie. »* C'est la même feuille au téléphone et
 * au bureau, où elle se centre en dialogue (§2.43) : `BottomSheet` le fait déjà dès 600.
 */
const FactSheet: React.FC<FactSheetProps> = ({
    fait,
    journal,
    registres,
    users,
    equipment,
    onClose,
    onOpenEquipment,
    canOpenUser,
    onOpenUser,
    onOpenApproval,
    enPanneau = false,
}) => {
    const fil = useMemo(
        () => (fait ? filDe(fait, journal, registres) : []),
        [fait, journal, registres],
    );
    /* Le fait d'une demande ouvre **toute la demande** : ses étapes et ses parties (08/10). */
    const parcours = useMemo(
        () =>
            fait?.targetType === 'APPROVAL'
                ? parcoursDeLaDemande(fait.targetId, journal, registres, users)
                : null,
        [fait, journal, registres, users],
    );

    if (!fait)
        return (
            <BottomSheet open={false} onClose={onClose}>
                {null}
            </BottomSheet>
        );

    const partie = partieDe(fait, registres);
    const titre = [faitDe(fait, registres), partie].filter(Boolean).join(' ');
    const lieu = lieuDe(fait);

    /* Le pourquoi se lit sous l'attestation qui l'a donné — un motif de refus, le mot de
       l'incident. */
    const pourquoi = lire(fait, 'reason') ?? lire(fait, 'comment');

    const objet =
        fait.targetType === 'EQUIPMENT'
            ? registres.equipment.get(fait.targetId)
            : fait.targetType === 'APPROVAL'
              ? equipment.find(
                    (e) => e.id === registres.approvals.get(fait.targetId)?.assignedEquipmentId,
                )
              : undefined;

    const demande =
        fait.targetType === 'APPROVAL' && onOpenApproval
            ? registres.approvals.get(fait.targetId)
            : undefined;

    /* La personne du fait : l'autre partie quand il en a une, son auteur sinon. */
    const autre = autrePartie(fait, registres);
    const personneId =
        autre?.id ?? (fait.isSystem || fait.actorId === 'system' ? undefined : fait.actorId);
    const personne = personneId ? users.find((u) => u.id === personneId) : undefined;
    const detenus = personne ? equipment.filter((e) => e.user?.id === personne.id).length : 0;

    const ouvrir = (geste: () => void) => {
        onClose();
        geste();
    };

    const sousTitre = [capitale(quandDe(fait.timestamp)), lieu].filter(Boolean).join(' · ');

    /* Les preuves à relire : chaque étape attestée par une signature, celle de qui l'a
       donnée — à la réception, c'est le bénéficiaire qui signe. */
    const corps = (
        <div className="flex flex-col gap-4">
            {/* Le fait d'une demande se lit comme la tâche : la même pièce, les mêmes mots. */}
            {parcours ? (
                <ParcoursDeDemande
                    parcours={parcours}
                    registres={registres}
                    canOpenUser={canOpenUser}
                    onOpenUser={onOpenUser ? (id) => ouvrir(() => onOpenUser(id)) : undefined}
                />
            ) : (
                <>
                    <HandoverTrail
                        steps={fil.map((preuve, index) => ({
                            title: preuve.titre,
                            detail:
                                index === fil.findIndex((p) => p.evenement.id === fait.id) &&
                                !preuve.attente &&
                                pourquoi
                                    ? `${preuve.detail} · « ${pourquoi} »`
                                    : preuve.detail,
                            state: preuve.attente ? 'wait' : 'done',
                        }))}
                    />
                    {etapesSignees(fil).length > 0 && (
                        <SignaturesDeLaDemande etapes={fil} registres={registres} />
                    )}
                </>
            )}

            {(demande || objet || (personne && !parcours)) && (
                <div>
                    {demande && onOpenApproval && (
                        <Renvoi
                            premier
                            vignette={<Icon glyph={ClipboardText} size={20} />}
                            teinte="bg-tint-bleu text-on-tint-bleu"
                            titre={`Demande · ${demande.equipmentName || getCategoryLabel(demande.equipmentCategory || '') || 'équipement'}`}
                            sousTitre={[
                                demande.beneficiaryName ? `pour ${demande.beneficiaryName}` : null,
                                getStatusLabel(demande.status).toLowerCase(),
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => ouvrir(() => onOpenApproval(demande.id))}
                        />
                    )}
                    {objet && onOpenEquipment && (
                        <Renvoi
                            premier={!demande}
                            vignette={<Icon glyph={Laptop} size={20} />}
                            titre={objet.assetId || objet.name}
                            code
                            sousTitre={[objet.name, objet.status?.toLowerCase()]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => ouvrir(() => onOpenEquipment(objet.id))}
                        />
                    )}
                    {/* Sur une demande, les personnes sont dans « Les parties prenantes ». */}
                    {!parcours && personne && onOpenUser && canOpenUser(personne.id) && (
                        <Renvoi
                            premier={!demande && !(objet && onOpenEquipment)}
                            vignette={initiales(personne.name)}
                            teinte="bg-tint-bleu text-on-tint-bleu"
                            titre={personne.name}
                            sousTitre={[
                                personne.department,
                                `${detenus} objet${detenus > 1 ? 's' : ''} détenu${detenus > 1 ? 's' : ''}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => ouvrir(() => onOpenUser(personne.id))}
                        />
                    )}
                </div>
            )}
        </div>
    );

    if (enPanneau)
        return (
            /* La carte du panneau reprend la tête de la feuille — titre de feuille, date et
               lieu dessous — et son corps tel quel. */
            <section className="bg-surface flex flex-col gap-4 rounded-xl px-5 pt-4 pb-5">
                <header>
                    <h2 className="font-brand text-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em]">
                        {titre}
                    </h2>
                    {sousTitre && (
                        <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-1">
                            {sousTitre}
                        </p>
                    )}
                </header>
                {corps}
            </section>
        );

    return (
        <BottomSheet open onClose={onClose} title={titre} subtitle={sousTitre}>
            {corps}
        </BottomSheet>
    );
};

export default FactSheet;
