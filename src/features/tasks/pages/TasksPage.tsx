import React, { useMemo, useState } from 'react';

import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import Chip from '../../../components/ui/Chip';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { canUserActOnApproval } from '../../../lib/businessRules';
import { getCategoryLabel } from '../../../constants/glossary';
import { ViewType } from '../../../types';

/**
 * Tâches — la file, planche 03.3.
 *
 * La destination unique des liens du tableau de bord et de la moitié des flux.
 * Trois principes de la planche, tenus ici :
 *
 * - **Le plus ancien d'abord.** Une file de travail ne se cherche pas, elle se vide ;
 *   l'ordre est l'ancienneté, jamais la nature ni l'importance déclarée.
 * - **Pas de barre de recherche** (exception déclarée au registre §2.30) : une tâche
 *   n'a pas d'identifiant propre — elle désigne un objet et une personne, qui se
 *   cherchent chacun dans leur liste.
 * - **L'état vide est le bon état**, et il arrive plusieurs fois par jour : il dit ce
 *   qui arrivera ici, pour qu'on n'ait pas à revenir surveiller.
 *
 * Ce que la file ne porte pas encore : « code PIN à définir » et « réparations » de la
 * planche, dont la donnée n'est pas lisible côté produit. Rien n'est deviné.
 */

type TaskNature = 'validation' | 'reception' | 'retour';

interface Task {
    id: string;
    nature: TaskNature;
    /** Ce dont il s'agit — un objet ou une personne, jamais le nom de la tâche. */
    title: string;
    /** L'état qui appelle le geste. */
    context: string;
    /** Depuis quand, quand la donnée le dit. */
    since: string | null;
    /** Le verbe, au lexique. */
    action: string;
    target: ViewType;
    targetId?: string;
}

const NATURE_LABEL: Record<TaskNature, string> = {
    validation: 'Validations',
    reception: 'Réceptions',
    retour: 'Retours',
};

const NATURE_ICON: Record<TaskNature, string> = {
    validation: 'how_to_reg',
    reception: 'inventory_2',
    retour: 'assignment_return',
};

/** Jours écoulés, en entier — une file se lit en jours, pas en minutes. */
const daysSince = (iso: string | null): number | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

const ageLabel = (iso: string | null): string | null => {
    const d = daysSince(iso);
    if (d === null) return null;
    if (d === 0) return "aujourd'hui";
    if (d === 1) return 'depuis 1 jour';
    return `depuis ${d} jours`;
};

interface TasksPageProps {
    onNavigate: (view: ViewType) => void;
    onItemClick: (view: ViewType, id: string) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ onNavigate, onItemClick }) => {
    const { approvals, equipment, users } = useData();
    const { user: currentUser, role } = useAccessControl();
    const [nature, setNature] = useState<TaskNature | 'toutes'>('toutes');

    const tasks = useMemo<Task[]>(() => {
        if (!currentUser) return [];
        const out: Task[] = [];

        // 1 · Ce que je dois valider — la règle est celle des approbations, pas une seconde.
        approvals
            .filter((approval) =>
                canUserActOnApproval({
                    approval,
                    actorRole: role,
                    actorId: currentUser.id,
                    users,
                }),
            )
            .forEach((approval) => {
                out.push({
                    id: `approval-${approval.id}`,
                    nature: 'validation',
                    // Clé anglaise dans la donnée, libellé français porté par le
                    // catalogue : aucun écran ne traduit (LEXIQUE, dette n°2).
                    title: approval.equipmentCategory
                        ? getCategoryLabel(approval.equipmentCategory)
                        : approval.equipmentName || 'Demande',
                    // L'icône et le verbe disent déjà qu'il s'agit d'une demande : la
                    // ligne porte QUI, et depuis quand — les deux qui décident de l'ordre.
                    context: approval.beneficiaryName || approval.requesterName || 'Demande',
                    since: approval.createdAt ?? null,
                    action: 'Valider la demande',
                    target: 'approvals',
                });
            });

        // 2 · Ce que je dois confirmer — l'objet est posé, il attend mon accusé.
        equipment
            .filter(
                (item) =>
                    item.assignmentStatus === 'PENDING_DELIVERY'
                    && item.user?.email === currentUser.email,
            )
            .forEach((item) => {
                out.push({
                    id: `delivery-${item.id}`,
                    nature: 'reception',
                    title: item.name,
                    context: `${item.model} — remis, en attente de votre confirmation`,
                    since: item.assignedAt ?? null,
                    action: 'Confirmer la réception',
                    target: 'equipment_details',
                    targetId: item.id,
                });
            });

        // 3 · Ce que l'informatique doit réceptionner — le retour est parti, il faut le clore.
        if (role !== 'User') {
            equipment
                .filter((item) => item.assignmentStatus === 'PENDING_RETURN')
                .forEach((item) => {
                    out.push({
                        id: `return-${item.id}`,
                        nature: 'retour',
                        title: item.name,
                        context: item.user?.name
                            ? `Restitué par ${item.user.name}`
                            : 'Restitution en attente de réception',
                        since: item.assignedAt ?? null,
                        action: 'Réceptionner',
                        target: 'equipment_details',
                        targetId: item.id,
                    });
                });
        }

        // Le plus ancien d'abord ; ce qui n'a pas de date passe en fin de file plutôt
        // que de se voir attribuer une ancienneté qu'on ignore.
        return out.sort((a, b) => {
            if (!a.since) return 1;
            if (!b.since) return -1;
            return new Date(a.since).getTime() - new Date(b.since).getTime();
        });
    }, [approvals, equipment, users, currentUser, role]);

    const counts = useMemo(() => {
        const c: Record<TaskNature, number> = { validation: 0, reception: 0, retour: 0 };
        tasks.forEach((task) => { c[task.nature] += 1; });
        return c;
    }, [tasks]);

    const visible = nature === 'toutes' ? tasks : tasks.filter((task) => task.nature === nature);
    const natures = (Object.keys(NATURE_LABEL) as TaskNature[]).filter((n) => counts[n] > 0);

    const openTask = (task: Task) => {
        if (task.targetId) onItemClick(task.target, task.targetId);
        else onNavigate(task.target);
    };

    return (
        <PageContainer>
            <PageHeader
                title="Tâches"
                subtitle={
                    tasks.length === 0
                        ? 'Rien n\'attend votre geste'
                        : `${tasks.length} ${tasks.length > 1 ? 'choses vous attendent' : 'chose vous attend'}`
                }
            />

            {tasks.length === 0 ? (
                <EmptyState
                    icon="task_alt"
                    title="Vous êtes à jour"
                    description="Rien n'attend votre geste. La file se remplira d'elle-même — vous n'avez pas à revenir la surveiller."
                    action={
                        <Button variant="text" onClick={() => onNavigate('approvals')}>
                            Voir toutes les demandes
                        </Button>
                    }
                />
            ) : (
                <>
                    {natures.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                            <Chip
                                label={`Toutes ${tasks.length}`}
                                variant="filter"
                                selected={nature === 'toutes'}
                                onClick={() => setNature('toutes')}
                            />
                            {natures.map((n) => (
                                <Chip
                                    key={n}
                                    label={`${NATURE_LABEL[n]} ${counts[n]}`}
                                    variant="filter"
                                    selected={nature === n}
                                    onClick={() => setNature(n)}
                                />
                            ))}
                        </div>
                    )}

                    <ul className="bg-surface rounded-card divide-y divide-outline-variant">
                        {visible.map((task) => {
                            const age = ageLabel(task.since);
                            return (
                                <li
                                    key={task.id}
                                    // Sur 393 px, un geste posé à droite du texte ne laisse plus rien
                                    // lire : la rangée dit ce dont il s'agit, le geste passe dessous
                                    // et prend toute la largeur (planche 03.3). À partir de `medium`,
                                    // la place revient et les deux tiennent sur une ligne.
                                    className="p-4 flex flex-col gap-3 medium:flex-row medium:items-center"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="w-10 h-10 shrink-0 rounded-md bg-surface-container flex items-center justify-center text-on-surface-variant">
                                            <MaterialIcon name={NATURE_ICON[task.nature]} size={20} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-body-large text-on-surface truncate">{task.title}</p>
                                            <p className="text-body-small text-on-surface-variant truncate">
                                                {task.context}
                                                {age ? ` · ${age}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="tonal"
                                        onClick={() => openTask(task)}
                                        className="w-full medium:w-auto shrink-0"
                                    >
                                        {task.action}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>

                    <p className="text-body-small text-on-surface-variant text-center mt-4">
                        Le plus ancien d'abord. Une file de travail ne se cherche pas, elle se vide.
                    </p>
                    <div className="flex justify-center mt-2">
                        <Button variant="text" onClick={() => onNavigate('approvals')}>
                            Voir toutes les demandes
                        </Button>
                    </div>
                </>
            )}
        </PageContainer>
    );
};

export default TasksPage;
