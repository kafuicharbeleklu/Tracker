import { useMemo } from 'react';

import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useJournalComplet } from '../../../hooks/useJournalComplet';
import { dossierDeTache, type DossierDeTache } from '../lib/dossier';
import type { Task } from '../lib/file';

/**
 * **Le dossier d'une tâche ouverte** (08/10) — le panneau du bureau et la feuille du téléphone
 * le lisent d'ici. Le journal entier n'est demandé que pour une tâche qui a un dossier : la
 * remise et le retour y retrouvent qui a remis, et par quelle preuve.
 */
export const useDossierDeTache = (tache: Task | null): DossierDeTache | null => {
    const { equipment, users, events, settings } = useData();
    const { financeBudgets } = useFinanceData();
    const { user: currentUser, permissions } = useAccessControl();
    useJournalComplet(Boolean(tache?.targetId && !tache.approvalId && !tache.deviceId));

    return useMemo(
        () =>
            tache
                ? dossierDeTache(tache, {
                      equipment,
                      users,
                      events,
                      settings,
                      budgets: permissions.canViewFinance ? financeBudgets : [],
                      moi: currentUser?.id,
                  })
                : null,
        [
            tache,
            equipment,
            users,
            events,
            settings,
            permissions.canViewFinance,
            financeBudgets,
            currentUser?.id,
        ],
    );
};
