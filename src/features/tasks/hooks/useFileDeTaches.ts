import { useMemo } from 'react';

import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { construireLaFile, type Task } from '../lib/file';

/**
 * La file de la personne connectée, dans ses trois partitions — la même pour la page
 * Tâches, l'accueil et le badge de la barre (26/09). Voir `construireLaFile`.
 */
export const useFileDeTaches = (): Task[] => {
    const { approvals, equipment, users, detectedDevices } = useData();
    const { user: currentUser, role, permissions, filterEquipment } = useAccessControl();
    const { canManageInventory, canManageFinance } = permissions;

    /* Les tâches d'un objet suivent le périmètre de la personne : un administrateur des
       sites du Togo ne réceptionne pas les retours de Paris (la barre le faisait déjà). */
    const parc = useMemo(
        () => filterEquipment(equipment, users),
        [equipment, users, filterEquipment],
    );

    return useMemo(
        () =>
            construireLaFile({
                approvals,
                equipment: parc,
                users,
                detectedDevices,
                currentUser,
                role,
                permissions: { canManageInventory, canManageFinance },
            }),
        [
            approvals,
            parc,
            users,
            detectedDevices,
            currentUser,
            role,
            canManageInventory,
            canManageFinance,
        ],
    );
};
