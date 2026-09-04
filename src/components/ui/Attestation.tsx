import React, { useMemo, useState } from 'react';

import Button from './Button';
import PinField from './PinField';
import SignaturePad from './SignaturePad';
import { FieldLabel } from './FormParts';
import { PIN_LENGTH } from '../../lib/security';

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
 */

export type AttestationMethod = 'pin' | 'signature';

interface AttestationProps {
    /** Qui atteste. Son nom va au bas de la signature. */
    signerName: string;
    /** Le code personnel de cette personne, s'il est défini. Absent : signature. */
    signerPin?: string;
    /** Rendu à chaque changement : la méthode retenue et si l'attestation est faite. */
    onChange: (state: { method: AttestationMethod; done: boolean }) => void;
    /** Le libellé du bloc — « Votre attestation » par défaut. */
    label?: string;
}

/** Trois essais, puis la signature prend le relais (06.2, colonne 2). */
const MAX_ATTEMPTS = 3;

const Attestation: React.FC<AttestationProps> = ({
    signerName,
    signerPin,
    onChange,
    label = 'Votre attestation',
}) => {
    const hasPin = Boolean(signerPin);
    const [method, setMethod] = useState<AttestationMethod>(hasPin ? 'pin' : 'signature');
    const [pin, setPin] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [failed, setFailed] = useState(false);
    const [done, setDone] = useState(false);

    const remaining = MAX_ATTEMPTS - attempts;

    const settle = (nextMethod: AttestationMethod, nextDone: boolean) => {
        setDone(nextDone);
        onChange({ method: nextMethod, done: nextDone });
    };

    const verify = (entered: string) => {
        if (entered === signerPin) {
            setFailed(false);
            settle('pin', true);
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
        return <>Il vaut signature. Personne ne peut le lire, pas même l'informatique.</>;
    }, [method, hasPin, failed, attempts, remaining]);

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <FieldLabel>{label}</FieldLabel>
                {/* La sortie de secours n'existe **que** si un code existe : sans code,
                    la signature est déjà la méthode, et proposer d'y basculer n'aurait
                    aucun sens. */}
                {hasPin && method === 'pin' && (
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

            {method === 'pin' ? (
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
