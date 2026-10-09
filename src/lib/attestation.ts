import type { AttestationMethod } from '../types';

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

/**
 * **La décision prise à l'écran** (08/10) — au bureau, valider ou refuser une demande ne
 * demande plus le code (arbitrage du 26/09) : la session ouverte et les cinq secondes pour
 * annuler en tiennent lieu. Le journal l'écrit sous ce nom, plutôt que de laisser lire
 * « méthode non consignée » sous une décision qui a bien été prise par quelqu'un.
 */
export const DECISION_A_L_ECRAN = 'ecran';

/**
 * **Le code qu'un badge sait dire** (09/10) — signature, code PIN, ou les deux. Une décision
 * prise à l'écran, une preuve écrite en toutes lettres n'en sont pas : elles gardent leurs mots.
 */
export const codeDAttestation = (methode?: string): AttestationMethod | undefined =>
    methode && methode in LIBELLE_ATTESTATION ? (methode as AttestationMethod) : undefined;

/**
 * Le code d'une preuve **écrite en toutes lettres** : une remise l'écrit ainsi sur l'objet
 * (`handoverProof`) et dans le journal (`proof`) — « code PIN, signature apposée »,
 * « signature sur l'appareil de Clara Admin ».
 */
export const codeDeLaPreuve = (preuve?: string): AttestationMethod | undefined => {
    if (!preuve) return undefined;
    const exact = (Object.keys(LIBELLE_ATTESTATION) as AttestationMethod[]).find(
        (code) => LIBELLE_ATTESTATION[code] === preuve,
    );
    return exact ?? (/^signature\b/i.test(preuve) ? 'signature' : undefined);
};

/** Le libellé d'une méthode relue d'un enregistrement — inconnue, elle ne dit rien. */
export const libelleAttestation = (methode?: string): string | undefined =>
    methode === DECISION_A_L_ECRAN
        ? 'confirmée à l’écran, session ouverte'
        : methode && methode in LIBELLE_ATTESTATION
          ? LIBELLE_ATTESTATION[methode as AttestationMethod]
          : undefined;
