import React, { useEffect, useState } from 'react';

import { signatureService } from '../../../services/signatureService';
import type { HistoryEvent } from '../../../types';
import { lire } from '../lib/journal';

/**
 * **La signature d'une étape, relue** — `.att` de l'état « un événement ouvert » de 18.1 :
 * *« c'est ici que la signature apposée par le code (17.4) se relit »*.
 *
 * L'image n'est pas copiée dans le journal : la signature enregistrée vit, une par personne,
 * dans le magasin de 07.1 — **le navigateur de l'appareil où elle a été posée**
 * (`signatureService`). Elle ne se montre donc que sur cet appareil, et **que si elle était
 * déjà là au moment du fait** : remplacer sa signature purge l'ancienne (D5), et montrer la
 * nouvelle sous un fait plus ancien ferait attester à quelqu'un un trait qu'il n'a pas
 * apposé. Une signature tracée à la main n'est pas gardée.
 *
 * **Ce qui ne se montre pas se dit** (08/10) : la case restait vide, et on ne savait pas
 * si une signature avait été donnée. Elle nomme maintenant la preuve, et pourquoi l'image
 * manque.
 */
const SignatureDeLEtape: React.FC<{ evenement: HistoryEvent; signataire: string }> = ({
    evenement,
    signataire,
}) => {
    const methode = lire(evenement, 'method');
    const [image, setImage] = useState<string | null>(null);

    /* L'appelant la remonte d'un fait à l'autre (`key`) : l'image d'un fait ne survit
       pas à l'ouverture du suivant, sans qu'on ait à la vider ici. */
    useEffect(() => {
        let actif = true;
        let url: string | null = null;
        if (evenement.isSystem || methode !== 'pin+signature') return;

        void Promise.all([
            signatureService.get(evenement.actorId),
            signatureService.getSavedAt(evenement.actorId),
        ]).then(([blob, posee]) => {
            if (!actif || !blob || !posee) return;
            if (new Date(posee).getTime() > new Date(evenement.timestamp).getTime()) return;
            url = URL.createObjectURL(blob);
            setImage(url);
        });

        return () => {
            actif = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [evenement, methode]);

    if (methode !== 'pin+signature' && methode !== 'signature') return null;

    if (image)
        return (
            <div className="bg-tint-vert text-on-tint-vert text-ts-sub leading-ts-sub relative flex h-[120px] flex-col items-center justify-center rounded-[4px]">
                <span className="absolute top-3 right-3 text-[0.75rem] leading-4">
                    apposée · code PIN
                </span>
                <img
                    src={image}
                    alt={`Signature de ${signataire}`}
                    className="absolute top-[26px] left-1/2 h-14 w-[150px] -translate-x-1/2 object-contain"
                />
                <span className="absolute bottom-2.5">{signataire}</span>
            </div>
        );

    return (
        <div className="bg-surface-container text-on-surface-variant text-ts-sub leading-ts-sub flex flex-col gap-0.5 rounded-[4px] px-4 py-3">
            <span className="text-on-surface font-medium">
                {methode === 'signature'
                    ? `Signature tracée par ${signataire}`
                    : `Signature enregistrée de ${signataire}, apposée par son code`}
            </span>
            <span>
                {methode === 'signature'
                    ? 'Tracée sur l’appareil au moment de l’acte ; l’image n’est pas conservée.'
                    : 'L’image ne se relit que sur l’appareil où elle a été enregistrée.'}
            </span>
        </div>
    );
};

export default SignatureDeLEtape;
