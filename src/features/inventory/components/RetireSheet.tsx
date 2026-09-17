import React, { useEffect, useState } from 'react';
import { ClockCounterClockwise, Coins, Info, Package, SignOut } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Attestation, { type AttestationMethod } from '../../../components/ui/Attestation';
import { signatureService } from '../../../services/signatureService';
import Button from '../../../components/ui/Button';
import type { Equipment, RetirementReason } from '../../../types';

import {
    Consequences,
    FieldLabel,
    FormWarn,
    OptionRow,
    SubjectRow,
    type Tint,
} from '../../../components/ui/FormParts';

/**
 * **Sortir du parc** — planche 04.3, colonne 4.
 *
 * *« Ce qui disparaît, ce qui reste, ce que ça coûte : trois lignes, trois couleurs.
 * Le motif est le seul champ obligatoire. »*
 *
 * Ce que la feuille remplace : une confirmation destructive qui demandait de taper
 * **SUPPRIMER** sans jamais demander *pourquoi*. Le mot-clé protégeait le geste ; il
 * ne renseignait rien. Le motif, lui, part avec l'événement du journal — c'est là que
 * l'historique promis reste consultable.
 *
 * **Un objet attribué n'a pas cette entrée** : la planche le dit en pied de feuille,
 * et l'entrée devient « Organiser la restitution ». C'est l'appelant qui garde cette
 * porte fermée ; la feuille se contente de rappeler pourquoi.
 */

const REASONS: Array<{
    value: RetirementReason;
    title: string;
    hint: string;
    tint: Tint;
}> = [
    {
        value: 'end_of_life',
        title: 'Fin de vie',
        hint: 'Amorti, remplacé, mis au rebut',
        tint: 'rouge',
    },
    {
        value: 'sold',
        title: 'Vendu ou cédé',
        hint: 'Une contrepartie est attendue',
        tint: 'rouge',
    },
    {
        value: 'lost',
        title: 'Volé ou perdu',
        hint: 'Déclaration, perte immédiate',
        tint: 'rouge',
    },
];

interface RetireSheetProps {
    open: boolean;
    item: Equipment;
    /** Le nombre d'événements que le journal garde sur cet objet. */
    historyCount: number;
    /** La valeur résiduelle, déjà formatée dans la devise du produit. */
    residualValue?: string;
    /** Le nom au bas de l'attestation — la sortie du parc n'est jamais anonyme. */
    actorName: string;
    /**
     * Qui sort l'objet, et de quoi il dispose pour l'attester — **bloc 4 de 17.4** (lot
     * 28, D4). C'est l'acte le plus destructeur du parc : il se prouve.
     */
    actor?: { pin?: string; id?: string };
    onClose: () => void;
    onRetire: (reason: RetirementReason, method: AttestationMethod) => void;
}

const RetireSheet: React.FC<RetireSheetProps> = ({
    open,
    item,
    historyCount,
    residualValue,
    actorName,
    actor,
    onClose,
    onRetire,
}) => {
    /** Aucun cran pris au départ : le motif est **obligatoire**, il se choisit. */
    const [reason, setReason] = useState<RetirementReason | null>(null);
    /* Le bloc 4 : le motif dit pourquoi, l'attestation dit qui. */
    const [attestation, setAttestation] = useState<{ method: AttestationMethod; done: boolean }>({
        method: actor?.pin ? 'pin' : 'signature',
        done: false,
    });
    const [signature, setSignature] = useState<Blob | null>(null);

    useEffect(() => {
        let vivant = true;
        setAttestation({ method: actor?.pin ? 'pin' : 'signature', done: false });
        if (!open || !actor?.pin || !actor?.id) {
            setSignature(null);
            return;
        }
        void signatureService.get(actor.id).then((image) => {
            if (vivant) setSignature(image);
        });
        return () => {
            vivant = false;
        };
    }, [open, actor?.pin, actor?.id]);

    const close = () => {
        setReason(null);
        onClose();
    };

    const lines = [
        {
            glyph: SignOut,
            tint: 'rouge' as Tint,
            content: <>Quitte la liste et les sélecteurs.</>,
        },
        {
            glyph: ClockCounterClockwise,
            tint: 'bleu' as Tint,
            content: (
                <>
                    <b className="font-medium tabular-nums">
                        {historyCount} événement{historyCount > 1 ? 's' : ''}
                    </b>{' '}
                    rest{historyCount > 1 ? 'ent' : 'e'} dans l'Historique.
                </>
            ),
        },
        ...(residualValue
            ? [
                  {
                      glyph: Coins,
                      tint: 'ambre' as Tint,
                      content: (
                          <>
                              <b className="font-medium tabular-nums">{residualValue}</b> de valeur
                              résiduelle passent en perte.
                          </>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <BottomSheet open={open} onClose={close} title="Sortir du parc">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-[14px] leading-5">
                    Irréversible. L'historique, lui, est conservé.
                </p>

                <SubjectRow
                    glyph={Package}
                    title={item.name}
                    detail={[item.model || item.type, item.status.toLowerCase(), item.site]
                        .filter(Boolean)
                        .join(' · ')}
                />

                <div>
                    <FieldLabel note="obligatoire">Motif</FieldLabel>
                    <div className="flex flex-col gap-2">
                        {REASONS.map((entry) => (
                            <OptionRow
                                key={entry.value}
                                title={entry.title}
                                hint={entry.hint}
                                tint={entry.tint}
                                selected={reason === entry.value}
                                onSelect={() => setReason(entry.value)}
                            />
                        ))}
                    </div>
                </div>

                {/* 4 · l'attestation — après le motif, avant les conséquences (17.4). */}
                <Attestation
                    signerName={actorName}
                    signerPin={actor?.pin}
                    signature={signature}
                    onChange={setAttestation}
                />

                <Consequences label="Ce que cela change" lines={lines} />

                <FormWarn glyph={Info}>
                    Un objet <b className="font-medium">attribué</b> ne sort pas d'ici : l'entrée
                    devient <b className="font-medium">« Organiser la restitution »</b>.
                </FormWarn>

                <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="ghost" onClick={close}>
                        Annuler
                    </Button>
                    {/* `.btn-x` — le seul rouge plein du produit, et il ne s'allume
                        qu'une fois le motif pris. */}
                    <Button
                        variant="danger"
                        disabled={!reason || !attestation.done}
                        onClick={() => {
                            if (!reason) return;
                            onRetire(reason, attestation.method);
                            close();
                        }}
                    >
                        Sortir du parc
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default RetireSheet;
