import React from 'react';

import ListeDeFaits from '../../../components/ui/ListeDeFaits';
import type { DetectedDevice } from '../../../types';
import { ageLabel } from '../lib/file';

/**
 * **L'examen d'une machine remontée par l'agent** (14.1) — ce qu'elle dit d'elle-même.
 *
 * Dessiné une fois (08/10) : au téléphone, il remplit la feuille d'examen ; au bureau, le
 * panneau de décision, comme toute autre tâche.
 *
 * **À la forme des autres détails** (10/10). C'était un tableau de neuf rangées de 48, la
 * valeur en gras à droite, suivi d'une section « Les actifs qui lui ressemblent » : le
 * commanditaire les a jugés hors du système de design, et la section de trop (« ça surcharge
 * la vue »). Les faits prennent la liste commune (`ListeDeFaits`) ; la ressemblance se lit
 * dans la sous-ligne de la tâche (« correspondance à confirmer »), et se tranche à l'import.
 */
const ExamenDeMachine: React.FC<{ machine: DetectedDevice }> = ({ machine }) => (
    <ListeDeFaits
        label="Ce que la machine dit d’elle-même"
        faits={[
            ['Nom réseau', machine.hostname],
            ['Identifiant', machine.assetId],
            ['Numéro de série', machine.serialNumber],
            ['Système', machine.os],
            /* Qui s'en sert, et ce qu'elle a dans le ventre (08/10) : on reconnaît une
               machine à son utilisateur avant son numéro. */
            ['Session ouverte', machine.currentUserName],
            ['Matériel', [machine.cpu, machine.ram, machine.storage].filter(Boolean).join(' · ')],
            [
                'Emplacement',
                [machine.country, machine.site, machine.service].filter(Boolean).join(' · '),
            ],
            ['Première vue', ageLabel(machine.firstSeenAt)],
            ['Dernière vue', ageLabel(machine.lastSeenAt)],
        ]}
    />
);

export default ExamenDeMachine;
