import { useMemo } from 'react';

import { useData } from '../context/DataContext';
import { useAccessControl } from './useAccessControl';
import { canUserActOnApproval } from '../lib/businessRules';
import { getCategoryLabel } from '../constants/glossary';
import type { Approval } from '../types';

/**
 * **Ce qui attend le geste de la personne connectée** — la file de 03.3, telle que
 * l'accueil (03.1) la résume et que la barre du bas (17.7) la compte.
 *
 * *Une décision pour N surfaces.* Trois endroits énonçaient ce nombre, et de trois
 * façons : l'accueil croisait les trois natures d'attente en passant par la règle
 * métier ; la barre latérale comptait les demandes d'un rôle en comparant des **noms**
 * de personnes ; la barre du bas n'affichait rien du tout. Le même écran pouvait donc
 * annoncer « 17 choses vous attendent » en haut et ne rien porter en bas.
 *
 * La règle retenue est celle qui était déjà arbitrée : `canUserActOnApproval`. Une
 * tâche est ici **parce qu'elle attend un geste de vous**, pas parce qu'elle est
 * ouverte quelque part.
 */

export type PendingTaskKind = 'validation' | 'receipt' | 'return';

export type PendingTask =
    | {
          id: string;
          status: Approval['status'];
          who: string;
          what: string;
          kind: 'validation' | 'receipt';
          /** ISO de l'ouverture de l'attente — la source de `.age`. */
          since?: string;
      }
    | {
          id: string;
          who: string;
          what: string;
          kind: 'return';
          since?: string;
      };

const DAY_MS = 86_400_000;

/** Le nombre de jours d'attente, ou `null` quand la source ne porte pas de date. */
export const daysSince = (iso?: string): number | null => {
    if (!iso) return null;
    const at = new Date(iso).getTime();
    if (Number.isNaN(at)) return null;
    return Math.max(0, Math.floor((Date.now() - at) / DAY_MS));
};

export const usePendingTasks = () => {
    const { equipment: allEquipment, users, approvals } = useData();
    const { filterEquipment, user: currentUser } = useAccessControl();

    const equipment = useMemo(
        () => filterEquipment(allEquipment, users),
        [allEquipment, users, filterEquipment],
    );
    const equipmentById = useMemo(
        () => new Map(allEquipment.map((item) => [item.id, item])),
        [allEquipment],
    );

    /** Le nom de l'objet d'une demande, quelle que soit l'étape où elle en est. */
    const labelOf = useMemo(
        () => (approval: Approval) =>
            approval.assignedEquipmentName ||
            (approval.assignedEquipmentId
                ? equipmentById.get(approval.assignedEquipmentId)?.name
                : undefined) ||
            approval.equipmentName ||
            approval.equipmentCategory ||
            '',
        [equipmentById],
    );

    const validations = useMemo<PendingTask[]>(() => {
        if (!currentUser) return [];
        return approvals
            .filter(
                (approval) =>
                    (approval.status === 'WAITING_MANAGER_APPROVAL' ||
                        approval.status === 'WAITING_DOTATION_APPROVAL') &&
                    canUserActOnApproval({
                        approval,
                        actorRole: currentUser.role,
                        actorId: currentUser.id,
                        users,
                    }),
            )
            .map((approval) => ({
                id: approval.id,
                status: approval.status,
                who: approval.beneficiaryName || '',
                what: labelOf(approval),
                kind: 'validation' as const,
                since: approval.createdAt,
            }));
    }, [approvals, currentUser, labelOf, users]);

    const receipts = useMemo<PendingTask[]>(() => {
        if (!currentUser) return [];
        return approvals
            .filter(
                (approval) =>
                    approval.status === 'PENDING_DELIVERY' &&
                    canUserActOnApproval({
                        approval,
                        actorRole: currentUser.role,
                        actorId: currentUser.id,
                        users,
                    }),
            )
            .map((approval) => ({
                id: approval.id,
                status: approval.status,
                who: approval.beneficiaryName || '',
                what: labelOf(approval),
                kind: 'receipt' as const,
                since: approval.createdAt,
            }));
    }, [approvals, currentUser, labelOf, users]);

    const returns = useMemo<PendingTask[]>(
        () =>
            equipment
                .filter((item) => item.assignmentStatus === 'PENDING_RETURN')
                .map((item) => ({
                    id: `return-${item.id}`,
                    who: item.user?.name || '',
                    what: item.name || `${getCategoryLabel(item.type)} (${item.assetId})`,
                    kind: 'return' as const,
                    since: item.returnRequestedAt,
                })),
        [equipment],
    );

    const tasks = useMemo(
        () => [...validations, ...receipts, ...returns],
        [validations, receipts, returns],
    );

    /**
     * « La plus ancienne depuis 14 jours » — `.bigl` du régime saturé de 03.1. La
     * donnée vit dans `Approval.createdAt` et `Equipment.returnRequestedAt`.
     */
    const oldestWaitDays = useMemo(() => {
        const ages = tasks
            .map((entry) => daysSince(entry.since))
            .filter((d): d is number => d !== null);
        return ages.length > 0 ? Math.max(...ages) : null;
    }, [tasks]);

    /** Les natures d'attente, chacune un renvoi vers la file — régime saturé de 03.1. */
    const breakdown = useMemo(
        () =>
            [
                { label: 'validations', count: validations.length },
                { label: 'réceptions à confirmer', count: receipts.length },
                { label: 'retours à réceptionner', count: returns.length },
            ].filter((item) => item.count > 0),
        [validations.length, receipts.length, returns.length],
    );

    return { tasks, count: tasks.length, validations, receipts, returns, oldestWaitDays, breakdown };
};
