import React from 'react';

import HandoverTrail, { type TrailState } from '../../../components/ui/HandoverTrail';
import type { HistoryEvent } from '../../../types';
import {
    autrePartie,
    lire,
    type ParcoursDeDemande as Parcours,
    type Preuve,
    type Registres,
} from '../lib/journal';
import Renvoi, { initiales } from './Renvoi';
import SignatureDeLEtape from './SignatureDeLEtape';

/**
 * **Le parcours d'une demande, une seule lecture** (08/10).
 *
 * La même demande se racontait de trois façons : la fiche d'un fait de l'historique (qui,
 * son rôle, quand, par quelle preuve), l'écran de la demande (trois étapes à venir, des
 * dates en chiffres) et le panneau de décision de la file (une frise à points en 13). Le
 * commanditaire a demandé qu'elles se ressemblent : elles lisent maintenant le même parcours
 * (`parcoursDeLaDemande`, tiré du journal) et le dessinent avec les mêmes pièces — le fil
 * de 17.4 (`HandoverTrail`), la signature d'une étape et la rangée de renvoi de 18.1.
 *
 * Trois morceaux, pour qu'un écran à cartes les pose chacun dans sa carte : `FilDeLaDemande`,
 * `SignaturesDeLaDemande`, `PartiesDeLaDemande`. Le composant par défaut les enchaîne sous
 * leurs intitulés, comme une feuille ou un panneau les lit.
 */

/** L'intitulé d'une section — 12, encre secondaire, comme un groupe de liste. */
export const INTITULE = 'text-on-surface-variant mb-1 text-[0.75rem] leading-4 font-medium';

const etatDe = (preuve: Preuve): TrailState =>
    preuve.attente ? 'late' : preuve.avenir ? 'wait' : preuve.arret ? 'fail' : 'done';

export const FilDeLaDemande: React.FC<{ parcours: Parcours }> = ({ parcours }) => (
    <HandoverTrail
        steps={parcours.etapes.map((preuve) => ({
            title: preuve.titre,
            detail: preuve.detail,
            state: etatDe(preuve),
        }))}
    />
);

/** À la réception, c'est le bénéficiaire qui signe, même depuis la session de qui remet. */
export const signataireDe = (evenement: HistoryEvent, registres: Registres): string =>
    evenement.type === 'ASSIGN_CONFIRMED' && evenement.targetType === 'EQUIPMENT'
        ? (autrePartie(evenement, registres)?.name ?? evenement.actorName)
        : evenement.actorName;

/** Les étapes signées d'un fil, celles dont la preuve se relit. */
export const etapesSignees = (etapes: readonly Preuve[]): Preuve[] =>
    etapes.filter(
        (preuve) =>
            !preuve.attente &&
            !preuve.avenir &&
            /signature/.test(lire(preuve.evenement, 'method') ?? ''),
    );

export const SignaturesDeLaDemande: React.FC<{
    etapes: readonly Preuve[];
    registres: Registres;
}> = ({ etapes, registres }) => (
    <div className="flex flex-col gap-2">
        {etapesSignees(etapes).map((preuve) => (
            <SignatureDeLEtape
                key={preuve.evenement.id}
                evenement={preuve.evenement}
                signataire={signataireDe(preuve.evenement, registres)}
            />
        ))}
    </div>
);

const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

export const PartiesDeLaDemande: React.FC<{
    parcours: Parcours;
    canOpenUser?: (id: string) => boolean;
    onOpenUser?: (id: string) => void;
}> = ({ parcours, canOpenUser, onOpenUser }) => (
    <div>
        {parcours.parties.map((partie, index) => (
            <Renvoi
                key={partie.id ?? partie.nom}
                premier={index === 0}
                vignette={initiales(partie.nom)}
                teinte={
                    partie.attendue
                        ? 'bg-tint-ambre text-on-tint-ambre'
                        : 'bg-tint-bleu text-on-tint-bleu'
                }
                titre={partie.nom}
                sousTitre={[capitale(partie.role), partie.actes.join(', ')]
                    .filter(Boolean)
                    .join(' · ')}
                onOpen={
                    partie.id && onOpenUser && (canOpenUser?.(partie.id) ?? true)
                        ? () => onOpenUser(partie.id!)
                        : undefined
                }
            />
        ))}
    </div>
);

const ParcoursDeDemande: React.FC<{
    parcours: Parcours;
    registres: Registres;
    canOpenUser?: (id: string) => boolean;
    onOpenUser?: (id: string) => void;
}> = ({ parcours, registres, canOpenUser, onOpenUser }) => (
    <>
        <div>
            <p className={INTITULE}>Le parcours de la demande</p>
            <FilDeLaDemande parcours={parcours} />
        </div>
        {etapesSignees(parcours.etapes).length > 0 && (
            <div>
                <p className={INTITULE}>Les signatures</p>
                <SignaturesDeLaDemande etapes={parcours.etapes} registres={registres} />
            </div>
        )}
        {parcours.parties.length > 0 && (
            <div>
                <p className={INTITULE}>Les parties prenantes</p>
                <PartiesDeLaDemande
                    parcours={parcours}
                    canOpenUser={canOpenUser}
                    onOpenUser={onOpenUser}
                />
            </div>
        )}
    </>
);

export default ParcoursDeDemande;
