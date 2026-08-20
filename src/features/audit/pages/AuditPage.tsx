import React from 'react';

import { PageContainer } from '../../../components/layout/PageContainer';
import { ViewType } from '../../../types';
import { AuditOverviewContainer } from '../components/AuditOverviewContainer';

interface AuditPageProps {
    onViewChange: (view: ViewType) => void;
}

/**
 * **L'audit a un écran, pas deux** (planche 16.1).
 *
 * La page composait deux fois la même vue : sous 600 px la composition de la planche —
 * barre qui nomme le périmètre, segment, bandeau de portée, porte-voix, rangées à
 * geste, bouton de pied —, et au-dessus l'écran d'avant : une carte « Pilotage des
 * services à auditer », trois sélecteurs toujours ouverts, un tableau de huit colonnes
 * et un bouton flottant. Deux réponses opposées à la même question, dans le même
 * fichier : la planche dit *« le geste jaune est en pied de page, **pas** en bouton
 * flottant »*, et l'un des deux rendus faisait exactement l'inverse.
 *
 * 00.4 fixe **six lignes** qui changent avec la largeur — navigation, padding,
 * recherche, pastilles, faits par rangée, en-tête — *« et rien d'autre »*. Une seconde
 * composition n'en fait pas partie. `AuditOverview` est donc la vue, à toutes les
 * largeurs, et elle porte son en-tête : la page n'ajoute ni titre ni onglets par
 * dessus.
 */
const AuditPage: React.FC<AuditPageProps> = ({ onViewChange }) => (
    <PageContainer
        padding="none"
        className="medium:p-page space-y-0 p-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]"
    >
        <AuditOverviewContainer onViewChange={onViewChange} />
    </PageContainer>
);

export default AuditPage;
