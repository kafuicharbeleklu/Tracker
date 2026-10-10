import React, { useMemo } from 'react';
import { Laptop } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import HandoverTrail from '../../../components/ui/HandoverTrail';
import Icon from '../../../components/ui/Icon';
import ListeDeFaits from '../../../components/ui/ListeDeFaits';
import type { Equipment, HistoryEvent, User } from '../../../types';
import {
    autrePartie,
    faitDe,
    filDe,
    lieuDe,
    lire,
    methodeDe,
    parcoursDeLaDemande,
    partieDe,
    quandDe,
    type Registres,
} from '../lib/journal';
import ParcoursDeDemande, { SignaturesDeLaDemande } from './ParcoursDeDemande';
import Renvoi, { initiales } from './Renvoi';

/** « Vendredi 4 septembre à 19:32 » — le sous-titre commence une ligne. */
const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « vendredi 4 septembre 2026 à 19:32:08 » — l'instant exact, pour qui vérifie. */
const instantExact = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const jour = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
    const heure = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
    return `${jour} à ${heure}`;
};

const ROLE_EN_MOTS: Record<string, string> = {
    SuperAdmin: 'super administrateur',
    Admin: 'administrateur',
    Manager: 'manager',
    User: 'utilisateur',
};

/**
 * **Ce que le journal sait du fait, ligne à ligne** (10/10 : « des vues de détail plus
 * détaillées »). La feuille disait le fait et sa preuve en une phrase ; qui relit un
 * mouvement veut l'instant exact, par qui et à quel titre, sur quoi, où, par quelle
 * attestation, pour quel motif, et la référence du fait. Une ligne ne paraît que si le
 * journal l'a notée — pas de « non renseigné ».
 */
const detailsDuFait = (fait: HistoryEvent, objet?: Equipment): Array<[string, string]> => {
    const lignes: Array<[string, string | undefined]> = [
        ['Date', instantExact(fait.timestamp)],
        [
            'Par',
            fait.isSystem || fait.actorId === 'system'
                ? 'Automatique'
                : [fait.actorName, ROLE_EN_MOTS[fait.actorRole] ?? undefined]
                      .filter(Boolean)
                      .join(' · '),
        ],
        [
            'Objet',
            objet
                ? [objet.assetId, objet.model || objet.name].filter(Boolean).join(' · ')
                : fait.targetType === 'EQUIPMENT'
                  ? fait.targetName
                  : undefined,
        ],
        [
            'Lieu',
            lieuDe(fait) ??
                ([lire(fait, 'scopeSite'), lire(fait, 'scopeLocal')].filter(Boolean).join(' · ') ||
                    undefined),
        ],
        ['Attestation', methodeDe(fait)],
        [
            'État',
            lire(fait, 'fromStatus') && lire(fait, 'toStatus')
                ? `${lire(fait, 'fromStatus')} → ${lire(fait, 'toStatus')}`
                : lire(fait, 'toStatus'),
        ],
        [
            'Changement',
            lire(fait, 'from') && lire(fait, 'to')
                ? `${lire(fait, 'from')} → ${lire(fait, 'to')}`
                : undefined,
        ],
        ['État de l’objet', lire(fait, 'condition')],
        ['Motif', lire(fait, 'reason') ?? lire(fait, 'comment') ?? lire(fait, 'note')],
        ['Fournisseur', lire(fait, 'supplier')],
        ['Facture', lire(fait, 'invoiceNumber')],
        ['Ce que le journal a écrit', fait.description?.trim() || undefined],
        ['Référence', fait.id],
    ];
    return lignes.filter((ligne): ligne is [string, string] => Boolean(ligne[1]));
};

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
                            attestation: preuve.attestation,
                            state: preuve.attente ? 'wait' : 'done',
                        }))}
                    />
                    <SignaturesDeLaDemande etapes={fil} registres={registres} />
                </>
            )}

            {/* Le détail du fait — ce que le journal en a noté, sans rien d'inventé. */}
            <section aria-label="Le détail du fait">
                <h3 className="text-on-surface-variant pb-1 text-[0.75rem] leading-4 font-medium">
                    Le détail
                </h3>
                <ListeDeFaits label="Le détail du fait" faits={detailsDuFait(fait, objet)} />
            </section>

            {(objet || (personne && !parcours)) && (
                <div>
                    {objet && onOpenEquipment && (
                        <Renvoi
                            premier
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
                            premier={!(objet && onOpenEquipment)}
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
