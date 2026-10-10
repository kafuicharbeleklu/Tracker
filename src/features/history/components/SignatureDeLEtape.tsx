import React, { useEffect, useState } from 'react';

import { signatureService } from '../../../services/signatureService';
import type { HistoryEvent } from '../../../types';
import { lire } from '../lib/journal';
import { signaturesDuFait } from '../../../lib/signatureDeLActe';

/**
 * **La signature d'une étape, relue** — `.att` de l'état « un événement ouvert » de 18.1 :
 * *« c'est ici que la signature apposée par le code (17.4) se relit »*.
 *
 * L'image n'est pas copiée dans le journal : la signature enregistrée vit, une par personne,
 * dans le magasin de 07.1 — **le navigateur de l'appareil où elle a été posée**
 * (`signatureService`). Elle ne se montre donc que sur cet appareil, et **que si elle était
 * déjà là au moment du fait** : remplacer sa signature purge l'ancienne (D5), et montrer la
 * nouvelle sous un fait plus ancien ferait attester à quelqu'un un trait qu'il n'a pas
 * apposé. **Depuis le 10/10, la signature d'un acte est gardée avec son fait** — tracée ou
 * apposée — et c'est elle qu'on montre, sur tous les postes ; ce chemin-ci ne sert plus
 * qu'aux faits antérieurs.
 *
 * **Ce qui ne se montre pas ne se commente plus** (09/10). Depuis le 08/10, la case sans
 * image portait deux phrases — *« Signature tracée par… ; l'image n'est pas conservée »*,
 * *« L'image ne se relit que sur l'appareil où elle a été enregistrée »*. Le commanditaire
 * les a fait retirer : elles surchargeaient chaque parcours. La preuve se dit d'un badge sur
 * l'étape (`BadgeDAttestation`, dans le fil) ; ici il ne reste que l'image, quand elle se
 * relit.
 */
const SignatureDeLEtape: React.FC<{ evenement: HistoryEvent; signataire: string }> = ({
    evenement,
    signataire,
}) => {
    const methode = lire(evenement, 'method');
    const [image, setImage] = useState<string | null>(null);
    /* **La signature gardée avec le fait** (10/10) : depuis qu'un acte l'écrit dans le
       journal, elle se relit de tous les postes — tracée ou apposée. Les faits d'avant n'en
       portent pas : ils gardent le chemin ancien, l'image de l'appareil. */
    const gardees = signaturesDuFait(evenement.metadata);
    const gardee = gardees.length > 0;

    /* L'appelant la remonte d'un fait à l'autre (`key`) : l'image d'un fait ne survit
       pas à l'ouverture du suivant, sans qu'on ait à la vider ici. */
    useEffect(() => {
        let actif = true;
        let url: string | null = null;
        if (gardee) return;
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
    }, [evenement, methode, gardee]);

    if (gardee)
        return (
            <div className="flex flex-col gap-2">
                {gardees.map((signature) => (
                    <figure
                        key={signature.par}
                        className="bg-surface-container text-on-surface-variant text-ts-sub leading-ts-sub relative flex h-[132px] flex-col items-center justify-end rounded-md px-3 pb-2.5"
                    >
                        <span className="absolute top-2.5 right-3 text-[0.75rem] leading-4">
                            {methode === 'pin+signature' ? 'apposée · code PIN' : 'tracée'}
                        </span>
                        <img
                            src={signature.image}
                            alt={`Signature de ${signature.par}`}
                            className="absolute top-7 left-1/2 h-16 w-[200px] max-w-[70%] -translate-x-1/2 object-contain"
                        />
                        <figcaption>{signature.par}</figcaption>
                    </figure>
                ))}
            </div>
        );

    if (!image) return null;

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
};

export default SignatureDeLEtape;
