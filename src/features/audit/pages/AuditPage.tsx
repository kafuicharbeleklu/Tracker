import React from 'react';

import { ViewType } from '../../../types';
import { AuditOverviewContainer } from '../components/AuditOverviewContainer';

interface AuditPageProps {
    onViewChange: (view: ViewType) => void;
}

/**
 * **L'inventaire physique est une liste, et il prend le gabarit des listes** (17.8).
 *
 * La page composait deux fois la même vue — la planche sous 600 px, l'écran d'avant
 * au-dessus —, puis, une fois cette dette réglée, elle portait encore son en-tête à la
 * main : un `<h1>` et une bande de recherche réécrits pour un seul écran. 17.8 tranche :
 * huit listes du produit portent **le même bloc** — titre 28 et retour, recherche et
 * entonnoir à 48, la ligne de compte en 12 —, et *« le gabarit décide, pas la page »*.
 * 16.1 y entre sans exception : sa matrice lui accorde la recherche et le filtre, et lui
 * refuse l'action de page et le tri.
 *
 * Le `PageContainer` est parti avec : le gabarit porte son propre intérieur (`16 / 16 /
 * 24`), et l'envelopper d'un second en ajoutait un que la planche ne déclare pas.
 */
const AuditPage: React.FC<AuditPageProps> = ({ onViewChange }) => (
    <AuditOverviewContainer onViewChange={onViewChange} />
);

export default AuditPage;
