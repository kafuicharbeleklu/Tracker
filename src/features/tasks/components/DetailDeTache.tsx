import React from 'react';

import HandoverTrail, { type TrailState } from '../../../components/ui/HandoverTrail';
import { INTITULE } from '../../history/components/ParcoursDeDemande';
import type { DossierDeTache, EtapeDuDossier } from '../lib/dossier';

/**
 * **Le détail d'une tâche, dessiné une fois** (08/10) — ce qui a été déclaré, puis le
 * parcours. Le panneau de décision du bureau et la feuille du téléphone le posent tous deux :
 * une réparation se lit de la même façon des deux côtés, et de la même façon qu'une demande
 * dans l'historique (le fil de 17.4, les intitulés de 18.1).
 */

const ETAT: Record<EtapeDuDossier['etat'], TrailState> = {
    faite: 'done',
    ici: 'late',
    avenir: 'wait',
    arret: 'fail',
};

/** Ce qui a été déclaré, cité tel quel, puis qui l'a dit et quand. */
export const CitationDeTache: React.FC<{ citation: NonNullable<DossierDeTache['citation']> }> = ({
    citation,
}) => (
    <figure className="bg-surface-container flex flex-col gap-1 rounded-md px-3.5 py-2.5">
        <blockquote className="text-on-surface text-ts-body leading-ts-body italic">
            «&nbsp;{citation.texte}&nbsp;»
        </blockquote>
        {citation.source && (
            <figcaption className="text-on-surface-variant text-[0.75rem] leading-4">
                {citation.source}
            </figcaption>
        )}
    </figure>
);

/** Le dossier entier, sous les intitulés de l'historique. */
const DetailDeTache: React.FC<{ dossier: DossierDeTache }> = ({ dossier }) => (
    <>
        {dossier.citation && <CitationDeTache citation={dossier.citation} />}
        {dossier.etapes.length > 0 && (
            <section>
                <h3 className={INTITULE}>Le parcours</h3>
                <HandoverTrail
                    steps={dossier.etapes.map((etape) => ({
                        title: etape.titre,
                        detail: etape.detail,
                        attestation: etape.attestation,
                        state: ETAT[etape.etat],
                    }))}
                />
            </section>
        )}
    </>
);

export default DetailDeTache;
