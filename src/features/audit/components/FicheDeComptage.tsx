import React, { useMemo, useState } from 'react';

import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import type { Equipment, User } from '../../../types';

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
    onValider: (corrections: Partial<Equipment> | undefined, note: string) => void;
}

const AUCUN = '';

/**
 * **La fiche de comptage** (27/09, à la demande : *« valider avec un bouton, mais on doit
 * pouvoir modifier si, entre la dernière campagne et la courante, l'utilisateur change »*).
 *
 * Elle s'ouvre sur un actif du relevé et montre ce que la fiche dit de lui — son
 * détenteur, son service, son local. Si rien n'a bougé, **« Retrouvé »** le compte, comme
 * un scan. Si quelque chose a changé depuis la dernière campagne, on le corrige ici : le
 * comptage et la correction s'écrivent d'un seul geste, et le responsable qui validera la
 * campagne verra combien de fiches ont été corrigées.
 *
 * Changer le détenteur accorde l'état : un actif disponible qui a trouvé un détenteur
 * devient attribué, un actif attribué sans détenteur redevient disponible.
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
    const [note, setNote] = useState('');

    const optionsDetenteur = useMemo(
        () => [
            { value: AUCUN, label: 'Non attribué' },
            ...[...utilisateurs]
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
                .map((user) => ({ value: user.id, label: user.name })),
        ],
        [utilisateurs],
    );
    /* La valeur actuelle reste choisissable même quand le référentiel ne la connaît plus. */
    const avec = (liste: string[], actuelle: string | undefined, vide: string) => {
        const valeurs = [...new Set([...(actuelle ? [actuelle] : []), ...liste])];
        return [{ value: AUCUN, label: vide }, ...valeurs.map((v) => ({ value: v, label: v }))];
    };
    const optionsService = avec(services, equipement.department, 'Aucun service');
    const optionsLocal = avec(locaux, equipement.local, 'Hors local');

    const corrections = useMemo(() => {
        const changes: Partial<Equipment> = {};
        if (detenteurId !== (equipement.user?.id ?? AUCUN)) {
            const user = utilisateurs.find((candidat) => candidat.id === detenteurId);
            changes.user = user
                ? { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
                : null;
            if (user && equipement.status === 'Disponible') changes.status = 'Attribué';
            if (!user && equipement.status === 'Attribué') changes.status = 'Disponible';
        }
        if (service !== (equipement.department ?? AUCUN)) changes.department = service || undefined;
        if (local !== (equipement.local ?? AUCUN)) changes.local = local || undefined;
        return Object.keys(changes).length > 0 ? changes : undefined;
    }, [detenteurId, equipement, local, service, utilisateurs]);

    const libelle =
        mode === 'corriger'
            ? 'Enregistrer les corrections'
            : corrections
              ? 'Retrouvé, fiche corrigée'
              : 'Retrouvé, fiche conforme';

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
                        disabled={mode === 'corriger' && !corrections}
                        onClick={() => onValider(corrections, note)}
                    >
                        {libelle}
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
                    onChange={(event) => setDetenteurId(event.target.value)}
                    options={optionsDetenteur}
                    disabled={!peutCorriger}
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
                    supportingText={
                        peutCorriger
                            ? undefined
                            : 'Corriger la fiche demande le droit de gérer l’inventaire.'
                    }
                />
                <InputField
                    label="Commentaire (facultatif)"
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
