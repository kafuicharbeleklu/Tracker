import React, { useEffect, useMemo, useState } from 'react';

import Button from './Button';
import PinField from './PinField';
import SignaturePad from './SignaturePad';
import { FieldLabel } from './FormParts';
import { PIN_LENGTH, PIN_MAX_ATTEMPTS } from '../../lib/security';
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

/**
 * **Ce que la méthode s'appelle** — une fois, pour l'historique, la colonne
 * « Attestation » du bureau et les feuilles d'acte. Les trois l'écrivaient chacun de leur
 * côté, et aucun ne connaissait `pin+signature`.
 */
export const LIBELLE_ATTESTATION: Record<AttestationMethod, string> = {
    pin: 'code PIN',
    signature: 'signature apposée',
    'pin+signature': 'code PIN, signature apposée',
};

/** Le libellé d'une méthode relue d'un enregistrement — inconnue, elle ne dit rien. */
export const libelleAttestation = (methode?: string): string | undefined =>
    methode && methode in LIBELLE_ATTESTATION
        ? LIBELLE_ATTESTATION[methode as AttestationMethod]
        : undefined;

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

    const hint = useMemo(() => {
        if (method === 'signature' && !hasPin)
            return (
                <>
                    Pas encore de code PIN : <b className="font-medium">signez</b>. Vous pourrez en
                    définir un dans Mon compte.
                </>
            );
        if (method === 'signature' && attempts >= MAX_ATTEMPTS)
            return (
                <>
                    Trois essais passés :{' '}
                    <b className="font-medium">la signature prend le relais</b>.
                </>
            );
        if (method === 'signature')
            return <>Signature à la place du code — l'attestation le note.</>;
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
        /* D3 — sans image enregistrée, le code **suffit** : le dire, plutôt que laisser
           chercher une preuve qui n'existe pas. */
        if (done && method === 'pin')
            return (
                <>
                    Attesté par code PIN, {attestedAt}.{' '}
                    <b className="font-medium">Sans signature enregistrée, le code suffit.</b>
                </>
            );
        if (done && method === 'pin+signature')
            return <>Votre signature enregistrée est apposée — le code l'a autorisée.</>;
        return <>Il vaut signature. Personne ne peut le lire, pas même l'informatique.</>;
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
                        className="text-on-surface h-auto !min-h-0 !px-0 !py-0 text-[14px] font-medium underline underline-offset-2"
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
                        className="text-on-surface h-auto !min-h-0 !px-0 !py-0 text-[14px] font-medium underline underline-offset-2"
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
                <div className="bg-tint-vert text-on-tint-vert relative h-[120px] overflow-hidden rounded-md">
                    <img
                        src={signatureUrl}
                        alt={`Signature de ${signerName}`}
                        className="absolute inset-x-0 top-3 mx-auto h-[64px] w-auto max-w-[70%] object-contain"
                    />
                    <span className="absolute top-3 right-3 text-[12px] leading-4">
                        apposée · code PIN
                    </span>
                    <span className="absolute inset-x-0 bottom-2.5 text-center text-[14px] leading-5">
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
                />
            )}

            <p
                className={
                    failed && method === 'pin'
                        ? 'text-error mt-2 text-center text-[14px] leading-5'
                        : 'text-on-surface-variant mt-2 text-center text-[14px] leading-5'
                }
            >
                {hint}
            </p>
        </div>
    );
};

export default Attestation;
