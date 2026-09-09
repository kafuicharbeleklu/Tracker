import { useMemo } from 'react';

import { useAccessControl } from './useAccessControl';
import type { DestinationId } from '../constants/destinations';

/**
 * **Où cette personne peut aller, et sous quel groupe** — une seule réponse pour les
 * quatre surfaces de navigation.
 *
 * La barre du bas (17.7) et la barre latérale répondaient chacune à leur façon, et pas
 * la même : la feuille « Plus » ouvrait *Référentiels* sur `canManageInventory`, la
 * barre latérale la même rangée sur `canViewManagement || canManageSystem` ; la latérale
 * ne portait **pas** *Historique*, que la feuille porte depuis le 07/09. Le même compte,
 * sur le même écran, n'avait donc pas les mêmes chemins selon la largeur de la fenêtre.
 *
 * ## Deux étages, et le second est nommé
 *
 * **Les principales** sont les quatre destinations de la barre du bas — celles qu'on
 * ouvre plusieurs fois par jour. **Les groupes** sont ce que la cinquième case, « Plus »,
 * range au téléphone : *Référentiels*, *Suivi*, *Administration* (17.7, passe du 05/09),
 * nommés par ce qu'on y fait. Au bureau il n'y a plus de « Plus » : la barre latérale
 * déplie les groupes sous les principales (00.3, 03.1 bureau).
 *
 * **Paramètres et Mon compte n'y sont pas** : ils ont quitté la feuille le 06/09 pour le
 * menu de la personne — l'avatar au téléphone, le pied de la barre latérale au bureau.
 * Deux portes vers le même réglage en font une de trop.
 */
export interface NavigationGroup {
    label: string;
    ids: DestinationId[];
}

export interface NavigationDestinations {
    /** Les quatre de la barre du bas, dans l'ordre. */
    principales: DestinationId[];
    /** Ce que « Plus » range, et que le bureau déplie. Un groupe vide n'est pas rendu. */
    groupes: NavigationGroup[];
}

export const useNavigationDestinations = (): NavigationDestinations => {
    const { permissions } = useAccessControl();

    return useMemo(() => {
        const principales: DestinationId[] = [];
        if (permissions.canViewInventory) principales.push('dashboard', 'equipment');
        if (permissions.canViewApprovals) principales.push('tasks');
        if (permissions.canViewUsers) principales.push('users');

        const referentiels: DestinationId[] = [];
        if (permissions.canManageInventory) referentiels.push('management');
        if (permissions.canViewLocations) referentiels.push('locations');

        const suivi: DestinationId[] = [];
        if (permissions.canViewAudit) suivi.push('audit');
        /* Le journal se lit par qui peut lire les rapports : ce sont les mêmes faits,
           l'un par nature et par jour, l'autre agrégés. */
        if (permissions.canViewReports) suivi.push('history');
        if (permissions.canViewFinance) suivi.push('finance');
        if (permissions.canViewReports) suivi.push('reports');

        const administration: DestinationId[] = [];
        /* `canManageRbac` n'existe pas dans le jeu de permissions : administrer les
           rôles est un acte d'administration système, et c'est `canManageSystem` qui
           le garde. */
        if (permissions.canManageSystem) administration.push('rbac');

        return {
            principales,
            groupes: [
                { label: 'Référentiels', ids: referentiels },
                { label: 'Suivi', ids: suivi },
                { label: 'Administration', ids: administration },
            ].filter((groupe) => groupe.ids.length > 0),
        };
    }, [
        permissions.canManageInventory,
        permissions.canManageSystem,
        permissions.canViewApprovals,
        permissions.canViewAudit,
        permissions.canViewFinance,
        permissions.canViewInventory,
        permissions.canViewLocations,
        permissions.canViewReports,
        permissions.canViewUsers,
    ]);
};
