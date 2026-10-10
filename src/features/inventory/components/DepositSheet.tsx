import React, { useEffect, useState } from 'react';
import { Tray, User, Wrench } from '@phosphor-icons/react';

import Attestation, { type AttestationMethod } from '../../../components/ui/Attestation';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { Consequences, SubjectRow } from '../../../components/ui/FormParts';
import { motifIncident } from '../incidents';
import type { Equipment } from '../../../types';
import { oublierLesSignatures } from '../../../lib/signatureDeLActe';

/**
 * **Recevoir le dépôt d'un objet à réparer** — premier passage de main du parcours de
 * réparation (24/09) : du porteur à l'informatique.
 *
 * Il s'atteste comme une remise : **le porteur**, présent au comptoir, pose son code ou sa
 * signature. C'est ce qui manquait — l'incident retirait l'objet à son porteur sans que
 * personne ne dise l'avoir reçu, et un objet « en réparation » pouvait être encore sur un
 * bureau. Sans porteur (un objet du stock), le gestionnaire atteste lui-même.
 */
interface DepositSheetProps {
    open: boolean;
    onClose: () => void;
    item: Equipment;
    /** Qui remet : le porteur au moment de l'incident, ou le gestionnaire. */
    signataire: { name: string; pin?: string };
    onConfirm: (method: AttestationMethod) => void;
}

const DepositSheet: React.FC<DepositSheetProps> = ({
    open,
    onClose,
    item,
    signataire,
    onConfirm,
}) => {
    const [attestation, setAttestation] = useState<{ method: AttestationMethod; done: boolean }>({
        method: signataire.pin ? 'pin' : 'signature',
        done: false,
    });

    /* Une feuille qui s'ouvre commence un acte : ce qui a été signé avant ne la concerne pas. */
    useEffect(() => {
        if (open) oublierLesSignatures();
    }, [open]);

    return (
        <BottomSheet
            open={open}
            onClose={onClose}
            title="Recevoir le dépôt"
            subtitle={motifIncident(item) || 'Incident déclaré'}
        >
            <div className="flex flex-col gap-4">
                <SubjectRow
                    glyph={Wrench}
                    title={item.name}
                    detail={[
                        item.assetId,
                        item.repair?.holderName && `chez ${item.repair.holderName}`,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                />

                <Consequences
                    label="Ce que cela déclenche"
                    lines={[
                        {
                            glyph: Tray,
                            tint: 'bleu',
                            content: 'L’objet passe au bureau informatique, à prendre en charge.',
                        },
                        {
                            glyph: User,
                            tint: 'bleu',
                            content: item.repair?.holderName
                                ? `Il reviendra à ${item.repair.holderName} après réparation.`
                                : 'Il reviendra au stock après réparation.',
                        },
                    ]}
                />

                <Attestation
                    signerName={signataire.name}
                    signerPin={signataire.pin}
                    label={`${signataire.name} remet l’objet`}
                    onChange={setAttestation}
                />

                <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="ghost" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Tray} size={20} />}
                        disabled={!attestation.done}
                        onClick={() => onConfirm(attestation.method)}
                    >
                        Recevoir
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default DepositSheet;
