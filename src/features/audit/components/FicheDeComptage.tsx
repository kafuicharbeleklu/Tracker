import React, { useMemo, useState } from 'react';

import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import LibelleMouvant from '../../../components/ui/LibelleMouvant';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import type { Equipment, IncidentOutcome, User } from '../../../types';

interface FicheDeComptageProps {
    equipement: Equipment;
    /** `compter` : l'actif est à scanner ; `corriger` : il est déjà retrouvé. */
    mode: 'compter' | 'corriger';
    utilisateurs: User[];
    /** Les services et les locaux du site de la campagne. */
    services: string[];
    locaux: string[];
    /** Corriger la fiche demande le droit de gérer l'inventaire ; compter ne le demande pas. */
    peutCorriger: boolean;
    onFermer: () => void;
    /**
     * `incident` : l'état constaté n'est pas « rien à signaler ». Le comptage s'écrit, puis la
     * campagne ouvre la déclaration d'incident sur ce cran.
     */
    onValider: (
        corrections: Partial<Equipment> | undefined,
        note: string,
        incident?: IncidentOutcome,
    ) => void;
}

const AUCUN = '';

type Etat = 'ras' | IncidentOutcome;

/** Les crans de la déclaration d'incident (04.3), précédés de celui qui n'en ouvre pas. */
const ETATS: Array<{ value: Etat; label: string }> = [
    { value: 'ras', label: 'Rien à signaler' },
    { value: 'serves', label: 'Abîmé, continue de servir' },
    { value: 'immobilised', label: 'Immobilisé, à réviser' },
    { value: 'out_of_service', label: 'Hors service' },
];

/** Une remise, un retour ou une demande court : le détenteur se règle dans son parcours. */
const PARCOURS_OUVERT = new Set<NonNullable<Equipment['assignmentStatus']>>([
    'RESERVED',
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
    'PENDING_RETURN',
]);

/**
 * **La fiche de comptage** (27/09, à la demande : *« valider avec un bouton, mais on doit
 * pouvoir modifier si, entre la dernière campagne et la courante, l'utilisateur change »*).
 *
 * Elle s'ouvre sur un actif du relevé et montre ce que la fiche dit de lui : son détenteur,
 * son service, son local. Si rien n'a bougé, **« Retrouvé »** le compte, comme un scan. Si
 * quelque chose a changé depuis la dernière campagne, on le corrige ici : le comptage et la
 * correction s'écrivent d'un seul geste, et le responsable qui validera la campagne verra
 * combien de fiches ont été corrigées.
 *
 * **Revue du 10/10** (*« le formulaire présente des bugs […] si je retrouve l'équipement mais
 * qu'il est cassé, on aurait du mal à éditer ça depuis la campagne »*) :
 *
 * - **L'état constaté.** Retrouver n'est pas trouver en état : la fiche prend les trois crans
 *   de la déclaration d'incident. Un cran choisi, le comptage s'écrit et la déclaration
 *   s'ouvre dessus, avec ses photos et son attestation : c'est le même acte que sur la fiche
 *   de l'actif, pas un état posé sans trace.
 * - **Le service suit le détenteur.** Changer de détenteur sans toucher au service laissait
 *   l'actif au service de l'ancien.
 * - **« Aucun service » n'est plus proposé** : la fiche d'un actif en porte toujours un, et
 *   le choisir écrivait à sa place un service par défaut (« IT HQ ») qui n'était pas du site.
 * - **Un commentaire seul s'enregistre** : il fallait changer un champ pour pouvoir le poser.
 * - **Le détenteur ne se change pas ici quand un parcours court** (remise, retour,
 *   réparation) : il se réglerait dans le dos de la demande.
 */
const FicheDeComptage: React.FC<FicheDeComptageProps> = ({
    equipement,
    mode,
    utilisateurs,
    services,
    locaux,
    peutCorriger,
    onFermer,
    onValider,
}) => {
    const [detenteurId, setDetenteurId] = useState(equipement.user?.id ?? AUCUN);
    const [service, setService] = useState(equipement.department ?? AUCUN);
    const [local, setLocal] = useState(equipement.local ?? AUCUN);
    const [etat, setEtat] = useState<Etat>('ras');
    const [note, setNote] = useState('');

    const enReparation = equipement.status === 'En réparation';
    const parcoursOuvert =
        equipement.assignmentStatus !== undefined &&
        PARCOURS_OUVERT.has(equipement.assignmentStatus);
    /* Un actif déjà sorti du service n'a plus d'incident à déclarer. */
    const horsDuParc = ['Réformé', 'Retiré'].includes(equipement.status);

    const optionsDetenteur = useMemo(
        () => [
            { value: AUCUN, label: 'Non attribué' },
            ...[...utilisateurs]
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                .map((user) => ({ value: user.id, label: user.name })),
        ],
        [utilisateurs],
    );
    /* Le service en cours reste choisissable même quand le référentiel du site ne le connaît
       plus, et celui d'un détenteur venu d'ailleurs aussi. */
    const optionsService = useMemo(() => {
        const valeurs = [
            ...new Set([equipement.department, service, ...services].filter(Boolean) as string[]),
        ];
        return [
            ...(equipement.department ? [] : [{ value: AUCUN, label: 'Aucun service' }]),
            ...valeurs.map((valeur) => ({ value: valeur, label: valeur })),
        ];
    }, [equipement.department, service, services]);
    const optionsLocal = useMemo(() => {
        const valeurs = [...new Set([equipement.local, ...locaux].filter(Boolean) as string[])];
        return [
            { value: AUCUN, label: 'Hors local' },
            ...valeurs.map((valeur) => ({ value: valeur, label: valeur })),
        ];
    }, [equipement.local, locaux]);

    const changerDeDetenteur = (id: string) => {
        setDetenteurId(id);
        /* Le service suit la personne, tant qu'on n'a pas choisi un autre service à la main. */
        const personne = utilisateurs.find((candidat) => candidat.id === id);
        const serviceDAvant =
            utilisateurs.find((candidat) => candidat.id === detenteurId)?.department ??
            equipement.department;
        if (personne?.department && (service === serviceDAvant || !service)) {
            setService(personne.department);
        }
    };

    const corrections = useMemo(() => {
        const changes: Partial<Equipment> = {};
        if (detenteurId !== (equipement.user?.id ?? AUCUN)) {
            const user = utilisateurs.find((candidat) => candidat.id === detenteurId);
            changes.user = user
                ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
                : null;
            /* L'état et l'affectation suivent le détenteur : un actif attribué sans
               affectation confirmée ne se restitue pas. */
            if (user && ['Disponible', 'Attribué'].includes(equipement.status)) {
                changes.status = 'Attribué';
                changes.assignmentStatus = 'CONFIRMED';
            }
            if (!user && equipement.status === 'Attribué') {
                changes.status = 'Disponible';
                changes.assignmentStatus = 'NONE';
            }
        }
        if (service !== (equipement.department ?? AUCUN)) changes.department = service || undefined;
        if (local !== (equipement.local ?? AUCUN)) changes.local = local || undefined;
        return Object.keys(changes).length > 0 ? changes : undefined;
    }, [detenteurId, equipement, local, service, utilisateurs]);

    const incident = etat === 'ras' ? undefined : etat;
    const commentaire = note.trim();

    const libelle =
        mode === 'compter'
            ? incident
                ? 'Retrouvé, avec incident'
                : corrections
                  ? 'Retrouvé, fiche corrigée'
                  : 'Retrouvé, fiche conforme'
            : incident
              ? 'Déclarer l’incident'
              : corrections || !commentaire
                ? 'Enregistrer les corrections'
                : 'Enregistrer le commentaire';

    return (
        <Modal
            isOpen
            onClose={onFermer}
            title={equipement.model || equipement.name}
            maxWidth="max-w-[560px]"
            footer={
                <>
                    <Button variant="outlined" onClick={onFermer}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        disabled={mode === 'corriger' && !corrections && !commentaire && !incident}
                        onClick={() => onValider(corrections, note, incident)}
                    >
                        {/* Seul le mot qui change glisse (11/10) : « conforme », « corrigée ». */}
                        <LibelleMouvant>{libelle}</LibelleMouvant>
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
                    {[equipement.assetId, equipement.serialNumber].filter(Boolean).join(' · ')}
                </p>
                <SelectField
                    name="detenteur"
                    label="Détenteur"
                    value={detenteurId}
                    onChange={(event) => changerDeDetenteur(event.target.value)}
                    options={optionsDetenteur}
                    disabled={!peutCorriger || parcoursOuvert || enReparation}
                    avecRecherche
                    supportingText={
                        !peutCorriger
                            ? undefined
                            : parcoursOuvert
                              ? 'Une remise ou un retour est en cours : il se règle dans Tâches.'
                              : enReparation
                                ? 'En réparation : l’actif repart chez son porteur à la réception.'
                                : undefined
                    }
                />
                <SelectField
                    name="service"
                    label="Service"
                    value={service}
                    onChange={(event) => setService(event.target.value)}
                    options={optionsService}
                    disabled={!peutCorriger}
                />
                <SelectField
                    name="local"
                    label="Local"
                    value={local}
                    onChange={(event) => setLocal(event.target.value)}
                    options={optionsLocal}
                    disabled={!peutCorriger}
                />
                {!enReparation && !horsDuParc && (
                    <SelectField
                        name="etat"
                        label="État constaté"
                        value={etat}
                        onChange={(event) => setEtat(event.target.value as Etat)}
                        options={ETATS}
                        disabled={!peutCorriger}
                        supportingText={
                            peutCorriger
                                ? undefined
                                : 'Corriger la fiche ou déclarer un incident demande le droit de gérer l’inventaire.'
                        }
                    />
                )}
                <InputField
                    label={incident ? 'Ce qui est constaté' : 'Commentaire (facultatif)'}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Écran fissuré, prêté au service RH…"
                    maxLength={140}
                />
            </div>
        </Modal>
    );
};

export default FicheDeComptage;
