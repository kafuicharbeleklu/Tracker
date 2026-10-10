import React, { useEffect, useMemo, useState } from 'react';

import Button from './Button';
import PinField from './PinField';
import SignaturePad, { SIGNATURE_BOX } from './SignaturePad';
import { cn } from '../../lib/utils';
import { FieldLabel } from './FormParts';
import { PIN_LENGTH, PIN_MAX_ATTEMPTS } from '../../lib/security';
import { poserLaSignatureDeLActe, signatureDeLImage } from '../../lib/signatureDeLActe';
import type { AttestationMethod } from '../../types';

/**
 * **L'attestation** — planche 06.2. *Un fait décide, pas un choix au moment du geste.*
 *
 * ## Ce que la planche tranche
 *
 * *« Deux méthodes, code PIN à six chiffres ou signature, et un seul fait qui décide :
 * la personne a-t-elle un code défini. »*
 *
 * | La personne a un code | Méthode | Sortie de secours |
 * | --- | --- | --- |
 * | oui | **code PIN** | *Signer à la place*, une fois, et l'attestation le note |
 * | non | **signature** | aucune — la signature *est* la méthode, et la feuille dit pourquoi |
 *
 * **L'empreinte sort du périmètre** (WebAuthn, hors projet). Elle était offerte ici en
 * troisième onglet, et un tap sur son cercle « reconnaissait » n'importe quel doigt :
 * une preuve qui ne prouve rien est pire qu'une preuve absente, parce qu'elle se
 * consigne au journal comme les autres. `SecurityGate` avait déjà retiré « Face /
 * Signature / Empreinte » pour cette raison ; l'assistant d'attribution les gardait.
 *
 * **Et ce n'était pas un choix à faire ici.** Trois onglets demandaient à celui qui
 * remet de décider comment l'autre allait prouver — alors que la réponse est déjà dans
 * le compte de l'autre. Un code que la personne n'a pas ne se saisit pas.
 *
 * ## Ce que l'historique garde
 *
 * *« Qui, quand, par quelle méthode. »* La méthode remonte à l'appelant pour être
 * écrite : « Remis par Clara Admin · 09:42 · code PIN ». C'est ce qui rend le passage
 * de main relisible deux ans après.
 *
 * ## La signature enregistrée s'appose d'elle-même — lot 28, D3
 *
 * Quand la personne a **une signature enregistrée** (07.1) et que son code vaut, l'image
 * s'appose **sans un tap de plus** : le code a déjà prouvé qui agit, et redemander un
 * tracé ferait signer deux fois la même chose. La méthode devient `pin+signature`, et
 * l'historique l'écrit ainsi — « code PIN, signature apposée ».
 *
 * Sans signature enregistrée, **le code suffit** : la ligne le dit plutôt que de laisser
 * croire à une preuve manquante. Et « Signer à la place » reste offert dans les deux cas
 * — c'est l'autre méthode, pas un repli.
 */

export type { AttestationMethod } from '../../types';

/* Les libellés des méthodes vivent dans `lib/attestation` : le magasin de données les lit
   aussi, et il n'importe pas de composant. */
export { DECISION_A_L_ECRAN, LIBELLE_ATTESTATION, libelleAttestation } from '../../lib/attestation';

interface AttestationProps {
    /** Qui atteste. Son nom va au bas de la signature. */
    signerName: string;
    /** Le code personnel de cette personne, s'il est défini. Absent : signature. */
    signerPin?: string;
    /**
     * La signature enregistrée de cette personne, lue par l'appelant
     * (`signatureService.get(signer.id)`). Absente : le code suffit, et la ligne le dit.
     *
     * **En présence** (17.4, colonne 3), le second signataire ne l'a jamais : sur
     * l'appareil d'un autre, on trace — jamais le code d'autrui, jamais son image.
     */
    signature?: Blob | null;
    /** Rendu à chaque changement : la méthode retenue et si l'attestation est faite. */
    onChange: (state: { method: AttestationMethod; done: boolean }) => void;
    /** Le libellé du bloc — « Votre attestation » par défaut. */
    label?: string;
}

/** Trois essais, puis la signature prend le relais (06.2, colonne 2). */
const MAX_ATTEMPTS = PIN_MAX_ATTEMPTS;

const Attestation: React.FC<AttestationProps> = ({
    signerName,
    signerPin,
    signature,
    onChange,
    label = 'Votre attestation',
}) => {
    const hasPin = Boolean(signerPin);
    const [method, setMethod] = useState<AttestationMethod>(hasPin ? 'pin' : 'signature');
    const [pin, setPin] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [failed, setFailed] = useState(false);
    const [done, setDone] = useState(false);
    /* L'heure de l'attestation — « Attesté par code PIN, 09:42 ». Elle se fige au
       moment où le code vaut : la relire à chaque rendu la ferait avancer. */
    const [attestedAt, setAttestedAt] = useState<string | null>(null);

    const remaining = MAX_ATTEMPTS - attempts;

    /* L'image n'est lue qu'une fois, et son URL est rendue au navigateur en sortant :
       un `Blob` laissé ouvert reste en mémoire tant que l'onglet vit. */
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!signature) {
            setSignatureUrl(null);
            return;
        }
        const url = URL.createObjectURL(signature);
        setSignatureUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [signature]);

    const settle = (nextMethod: AttestationMethod, nextDone: boolean) => {
        setDone(nextDone);
        /* Une attestation défaite, ou faite par le code seul, ne laisse aucune signature. */
        if (!nextDone || nextMethod === 'pin') poserLaSignatureDeLActe(signerName, null);
        onChange({ method: nextMethod, done: nextDone });
    };

    const verify = (entered: string) => {
        if (entered === signerPin) {
            setFailed(false);
            setAttestedAt(
                new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            );
            /* Le code a prouvé qui agit : la signature enregistrée s'appose derrière lui,
               sans autre geste. **L'état local prend la méthode retenue**, pas seulement
               l'appelant : c'est lui que la case et la note relisent. */
            const retenue: AttestationMethod = signature ? 'pin+signature' : 'pin';
            setMethod(retenue);
            settle(retenue, true);
            /* La signature enregistrée s'appose : elle est gardée avec le fait, à la mesure
               du journal — tous les postes la reliront, pas seulement celui-ci (10/10). */
            if (signature)
                void signatureDeLImage(signature).then((image) =>
                    poserLaSignatureDeLActe(signerName, image),
                );
            return;
        }
        const used = attempts + 1;
        setAttempts(used);
        setFailed(true);
        /* Épuisés, les essais ne bloquent pas : ils **passent la main à la
           signature**, qui est l'autre méthode et non une punition. */
        if (used >= MAX_ATTEMPTS) {
            setMethod('signature');
            settle('signature', false);
        }
    };

    /* **La note dit un état, pas la mécanique** (10/10, à la demande du commanditaire :
       « retire les surinformations »). Elle expliquait que le code « vaut signature », que
       « personne ne peut le lire », que « l'attestation le note » : rien de cela ne change ce
       que la personne fait. Il reste ce qui vient d'arriver — un code refusé, une attestation
       donnée —, et rien au repos. */
    const hint = useMemo(() => {
        if (method === 'signature' && !hasPin)
            return (
                <>
                    Pas encore de code PIN : <b className="font-medium">signez</b>.
                </>
            );
        if (method === 'signature' && attempts >= MAX_ATTEMPTS)
            return (
                <>
                    Trois essais passés :{' '}
                    <b className="font-medium">la signature prend le relais</b>.
                </>
            );
        if (method === 'signature') return null;
        if (failed)
            return (
                <>
                    Code incorrect.{' '}
                    <b className="font-medium">
                        {remaining} essai{remaining > 1 ? 's' : ''}
                    </b>{' '}
                    avant la signature.
                </>
            );
        if (done && method === 'pin') return <>Attesté par code PIN, {attestedAt}.</>;
        if (done && method === 'pin+signature')
            return <>Votre signature enregistrée est apposée.</>;
        return null;
    }, [method, hasPin, failed, attempts, remaining, done, attestedAt]);

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <FieldLabel>{label}</FieldLabel>
                {/* La sortie de secours n'existe **que** si un code existe : sans code,
                    la signature est déjà la méthode, et proposer d'y basculer n'aurait
                    aucun sens. */}
                {hasPin && method !== 'signature' && (
                    <Button
                        variant="text"
                        onClick={() => {
                            setMethod('signature');
                            settle('signature', false);
                        }}
                        className="text-on-surface text-ts-sub h-auto !min-h-0 !px-0 !py-0 font-medium underline underline-offset-2"
                    >
                        Signer à la place
                    </Button>
                )}
                {hasPin && method === 'signature' && attempts < MAX_ATTEMPTS && (
                    <Button
                        variant="text"
                        onClick={() => {
                            setMethod('pin');
                            setPin('');
                            settle('pin', false);
                        }}
                        className="text-on-surface text-ts-sub h-auto !min-h-0 !px-0 !py-0 font-medium underline underline-offset-2"
                    >
                        Code PIN
                    </Button>
                )}
            </div>

            {done && method === 'pin+signature' && signatureUrl ? (
                /*
                  `.att.ok` — **la preuve, posée** : la case passe en teinte verte, l'image
                  s'y affiche, le nom au bas comme sur un tracé, et le coin dit par quoi
                  elle a été autorisée. Aucun geste n'est demandé ici : c'est un constat.
                */
                <div
                    className={cn(
                        'bg-tint-vert text-on-tint-vert relative overflow-hidden rounded-md',
                        /* La place de la case qu'on aurait tracée : la preuve posée ne
                           rétrécit pas l'étape. */
                        SIGNATURE_BOX,
                    )}
                >
                    <img
                        src={signatureUrl}
                        alt={`Signature de ${signerName}`}
                        className="absolute inset-x-0 top-1/2 mx-auto h-[45%] w-auto max-w-[70%] -translate-y-1/2 object-contain"
                    />
                    <span className="absolute top-3 right-3 text-[0.75rem] leading-4">
                        apposée · code PIN
                    </span>
                    <span className="text-ts-sub leading-ts-sub absolute inset-x-0 bottom-2.5 text-center">
                        {signerName}
                    </span>
                </div>
            ) : method !== 'signature' ? (
                <PinField
                    value={pin}
                    onChange={(next) => {
                        setPin(next);
                        if (next.length < PIN_LENGTH && done) settle('pin', false);
                        if (failed && next.length < PIN_LENGTH) setFailed(false);
                    }}
                    onComplete={verify}
                    state={failed ? 'error' : done ? 'ok' : 'idle'}
                    autoFocus
                />
            ) : (
                <SignaturePad
                    signerName={signerName}
                    onChange={(signed) => settle('signature', signed)}
                    /* Le tracé est gardé avec le fait que l'acte écrira (10/10). */
                    onTrace={(image) => poserLaSignatureDeLActe(signerName, image)}
                />
            )}

            {hint && (
                <p
                    className={
                        failed && method === 'pin'
                            ? 'text-error text-ts-sub leading-ts-sub mt-2 text-center'
                            : 'text-on-surface-variant text-ts-sub leading-ts-sub mt-2 text-center'
                    }
                >
                    {hint}
                </p>
            )}
        </div>
    );
};

export default Attestation;
