import React, { useState, useMemo } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    CaretDown,
    ChartBar,
    Check,
    CheckCircle,
    Clock,
    ClockCounterClockwise,
    FileText,
    Laptop,
    Package,
    Plus,
    ShieldWarning,
    Tray,
    Truck,
    UserCheck,
    Warning,
    Wrench,
} from '@phosphor-icons/react';

import { ViewType } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useHistory } from '../../../hooks/useHistory';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import ProportionRow from '../../../components/ui/ProportionRow';
import { OfflineBanner } from '../../../components/ui/ContextBanner';
import SecurityGate from '../../../components/security/SecurityGate';
import dashboardHeroImage from '../../../../Desing_System/uploads/footer-cartouche-bas-nl.webp';

import { getCategoryLabel } from '../../../constants/glossary';
import { calculateLinearDepreciation, formatDate } from '../../../lib/financial';
import {
    ACTIVE_APPROVAL_STATUSES,
    canUserActOnApproval,
    getHistoryEventSentence,
} from '../../../lib/businessRules';
import { Approval } from '../../../types';
import { cn } from '../../../lib/utils';

/**
 * Tableau de bord — **porté sur la planche 03.1**.
 *
 * L'arc de l'écran est fixe : **décision → état → analyse → activité**. Le code
 * plaçait l'activité avant les graphiques ; elle passe en dernier.
 *
 * ## « À traiter » n'est pas une liste, c'est une zone bornée
 *
 * Sa **forme change avec le volume**, jamais sa hauteur : rien à traiter, quelques
 * rangées qui agissent **sur place**, ou les plus anciennes suivies d'un renvoi. À
 * dix-sept demandes elle n'est pas plus haute qu'à deux. Le tableau de bord dit la
 * **taille et la forme** du travail ; la file (onglet Tâches) est le lieu où on le
 * fait.
 *
 * **Une seule destination** : les liens n'ouvrent pas un autre écran, ils ouvrent
 * **le même** — Tâches — en portant le filtre et le tri. Un second inventaire de la
 * même liste serait une deuxième source de vérité.
 *
 * ## « Répartition par type » devient « Types en tension »
 *
 * Compter les unités de chaque type décrit le parc sans rien décider ; ce qui décide,
 * c'est **de quel type il ne reste plus rien**. La carte ne liste que les types à
 * **zéro disponible**, les plus nombreux d'abord, bornée à cinq lignes. Pas de barre :
 * à zéro disponible, une barre ne dit rien. Ce qui est couvert se dit **en une
 * phrase**, jamais en lignes.
 *
 * ## Ce que le portage retire
 *
 * - **l'anneau de répartition** et ses quatre couleurs de catégorie — un type n'est
 *   pas un état, et le peindre est l'interdit §8.8 ;
 * - **les quatre cartes financières** (dépenses, valeur, amortissement mensuel) : ce
 *   sont des totaux qui ne décident rien. Reste ce qui appelle un geste — les
 *   équipements en fin de vie comptable, et ceux qui ne sont plus couverts ;
 * - **les deux bandeaux d'alerte** empilés en tête, remplacés par la zone unique ;
 * - **le sous-titre « Vue d'ensemble de votre parc informatique »**, qui ne dit rien
 *   qu'on ne sache déjà : il devient **le volume de travail qui attend**.
 *
 * ## Ce qui n'est pas porté, et pourquoi
 *
 * - **Le filtrage déjà appliqué dans Tâches** : le régime saturé en présente les
 *   natures d'action, puis ouvre la file unique. La définition précise du filtre
 *   appartient au travail de cette file, pas au tableau de bord.
 * - **Le menu de compte sous l'avatar** : la planche l'y déplace en même temps qu'elle
 *   redécoupe Paramètres (14.1). Tant que ce découpage n'est pas fait, l'accès au
 *   compte reste là où il est — « Plus » au téléphone, la barre latérale au-delà.
 */

interface DashboardPageProps {
    onViewChange: (view: ViewType) => void;
    onNavigate?: (path: string) => void;
}

type DashboardTask =
    | {
          id: string;
          status: Approval['status'];
          who: string;
          what: string;
          kind: 'validation' | 'receipt';
      }
    | {
          id: string;
          who: string;
          what: string;
          kind: 'return';
      };

const TODO_SATURATION_THRESHOLD = 250;
const HERO_BACKGROUND_STYLE: React.CSSProperties = {
    backgroundImage: `linear-gradient(180deg, rgb(10 25 29 / 0.62) 0%, rgb(10 25 29 / 0.78) 62%), url(${dashboardHeroImage})`,
    backgroundPosition: 'center 42%',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
};

/** La mesure de lecture du système — §2.43. */
const Reading: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('mx-auto w-full max-w-[960px]', className)}>{children}</div>
);

const Card: React.FC<{ icon: React.ComponentProps<typeof Icon>['glyph']; title: string; children: React.ReactNode }> = ({
    icon,
    title,
    children,
}) => (
    <section className="rounded-card bg-surface p-4">
        <p className="mb-1 flex items-center gap-2.5 text-body-medium font-medium text-on-surface">
            <Icon glyph={icon} size={18} className="text-on-surface-variant" />
            {title}
        </p>
        {children}
    </section>
);

/** Rangée d'orientation commune aux liens « Voir… » de la planche 03.1. */
const DashboardMoreAction: React.FC<{
    label: React.ReactNode;
    destination: React.ReactNode;
    onClick: () => void;
    tone?: 'surface' | 'inverse';
    spacing?: 'card' | 'hero';
}> = ({ label, destination, onClick, tone = 'surface', spacing = 'card' }) => {
    const isInverse = tone === 'inverse';

    return (
        <Button
            variant="text"
            onClick={onClick}
            className={cn(
                'min-h-11 w-full justify-start gap-2.5 border-t px-0 text-label-large hover:bg-transparent',
                spacing === 'card' ? 'mt-2' : 'mt-0.5',
                isInverse
                    ? 'border-white/[0.14] text-inverse-on-surface hover:text-inverse-on-surface focus-visible:ring-primary'
                    : 'border-outline-variant text-on-surface hover:text-on-surface'
            )}
        >
            <span className="shrink-0">{label}</span>
            <span
                className={cn(
                    'ml-auto min-w-0 flex-1 truncate text-right text-body-medium font-normal',
                    isInverse ? 'text-on-nav-surface-variant' : 'text-text-secondary'
                )}
            >
                {destination}
            </span>
            <Icon
                glyph={CaretDown}
                size={18}
                className={cn('-rotate-90 shrink-0', isInverse ? 'text-on-nav-surface-variant' : 'text-on-surface')}
            />
        </Button>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onViewChange, onNavigate }) => {
    const { logout } = useAuth();
    const { equipment: allEquipment, users, approvals, updateApproval } = useData();
    const { filterEquipment, permissions, user: currentUser } = useAccessControl();
    const { getRecentActivity } = useHistory();
    const { showToast } = useToast();
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    const userInitials = useMemo(() => {
        return (
            (currentUser?.name || '')
                .split(' ')
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AS'
        );
    }, [currentUser?.name]);

    const equipment = useMemo(() => filterEquipment(allEquipment, users), [allEquipment, users, filterEquipment]);
    const equipmentById = useMemo(() => new Map(allEquipment.map((item) => [item.id, item])), [allEquipment]);

    // ---- ce qui attend un geste ------------------------------------------------
    const pendingValidations = useMemo<DashboardTask[]>(() => {
        if (!currentUser) return [];
        return approvals
            .filter(
                (approval) =>
                    (approval.status === 'WAITING_MANAGER_APPROVAL' ||
                        approval.status === 'WAITING_DOTATION_APPROVAL') &&
                    canUserActOnApproval({ approval, actorRole: currentUser.role, actorId: currentUser.id, users })
            )
            .map((approval) => ({
                id: approval.id,
                status: approval.status,
                who: approval.beneficiaryName || '',
                what:
                    approval.assignedEquipmentName ||
                    (approval.assignedEquipmentId ? equipmentById.get(approval.assignedEquipmentId)?.name : undefined) ||
                    approval.equipmentName ||
                    approval.equipmentCategory ||
                    '',
                kind: 'validation' as const,
            }));
    }, [approvals, currentUser, equipmentById, users]);

    const pendingReceipts = useMemo<DashboardTask[]>(() => {
        if (!currentUser) return [];
        return approvals
            .filter(
                (approval) =>
                    approval.status === 'PENDING_DELIVERY' &&
                    canUserActOnApproval({ approval, actorRole: currentUser.role, actorId: currentUser.id, users })
            )
            .map((approval) => ({
                id: approval.id,
                status: approval.status,
                who: approval.beneficiaryName || '',
                what:
                    approval.assignedEquipmentName ||
                    (approval.assignedEquipmentId ? equipmentById.get(approval.assignedEquipmentId)?.name : undefined) ||
                    approval.equipmentName ||
                    approval.equipmentCategory ||
                    '',
                kind: 'receipt' as const,
            }));
    }, [approvals, currentUser, equipmentById, users]);

    const pendingReturns = useMemo<DashboardTask[]>(
        () =>
            equipment
                .filter((item) => item.assignmentStatus === 'PENDING_RETURN')
                .map((item) => ({
                    id: `return-${item.id}`,
                    who: item.user?.name || '',
                    what: item.name || `${getCategoryLabel(item.type)} (${item.assetId})`,
                    kind: 'return',
                })),
        [equipment]
    );

    const todo = useMemo(
        () => [...pendingValidations, ...pendingReceipts, ...pendingReturns],
        [pendingValidations, pendingReceipts, pendingReturns]
    );

    const todoBreakdown = useMemo(
        () => [
            { label: "validations d'attribution", count: pendingValidations.length, nature: 'validation' as const },
            { label: 'réceptions à confirmer', count: pendingReceipts.length, nature: 'reception' as const },
            { label: 'retours à réceptionner', count: pendingReturns.length, nature: 'retour' as const },
        ].filter((item) => item.count > 0),
        [pendingValidations.length, pendingReceipts.length, pendingReturns.length]
    );

    const openTasks = () => onViewChange('tasks');

    // ---- l'état du parc --------------------------------------------------------
    const counts = useMemo(
        () => ({
            total: equipment.length,
            assigned: equipment.filter((item) => item.status === 'Attribué').length,
            available: equipment.filter((item) => item.status === 'Disponible').length,
            repair: equipment.filter((item) => item.status === 'En réparation').length,
        }),
        [equipment]
    );

    /**
     * **Types en tension** : uniquement ceux dont il ne reste aucune unité
     * disponible, les plus nombreux d'abord. Ce qui est couvert tient en une phrase.
     */
    const tension = useMemo(() => {
        const byType = new Map<string, { label: string; total: number; available: number }>();
        equipment.forEach((item) => {
            const entry = byType.get(item.type) ?? { label: getCategoryLabel(item.type), total: 0, available: 0 };
            entry.total += 1;
            if (item.status === 'Disponible') entry.available += 1;
            byType.set(item.type, entry);
        });

        const all = [...byType.entries()];
        const stressed = all
            .filter(([, entry]) => entry.available === 0)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
        return { stressed, calm: all.length - stressed.length };
    }, [equipment]);

    const fleet = useMemo(() => {
        const active = equipment.filter((item) => item.operationalStatus !== 'Retiré');
        const now = Date.now();

        const endOfLife = active.filter((item) => {
            if (!item.financial) return false;
            const stats = calculateLinearDepreciation(
                item.financial.purchasePrice,
                item.financial.purchaseDate,
                item.financial.depreciationYears,
                item.financial.purchasePrice > 0
                    ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100
                    : 0
            );
            return stats.progressPercent > 85;
        }).length;

        const uncovered = active.filter(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() <= now
        ).length;
        const unknownWarranty = active.filter((item) => !item.warrantyEnd).length;

        return { size: active.length, endOfLife, uncovered, unknownWarranty };
    }, [equipment]);

    const { financeBudgets } = useFinanceData();

    const budgetStats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const currentBudget = financeBudgets.find((b) => b.year === currentYear) || financeBudgets[0];
        if (!currentBudget) return null;
        const totalAllocated = currentBudget.totalAllocated || 0;
        const totalSpent = currentBudget.items.reduce((acc, item) => acc + (item.spent || 0), 0);
        const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
        const remaining = totalAllocated - totalSpent;
        const overPacedCount = currentBudget.items.filter(
            (item) => item.allocated > 0 && item.spent / item.allocated > 0.25
        ).length;

        return {
            year: currentBudget.year,
            totalAllocated,
            totalSpent,
            percentSpent,
            remaining,
            itemCount: currentBudget.items.length,
            overPacedCount,
        };
    }, [financeBudgets]);

    const recentEvents = useMemo(() => getRecentActivity(3), [getRecentActivity]);

    // ---- la vue de l'utilisateur porteur ---------------------------------------
    const myEquipment = useMemo(
        () => allEquipment.filter((item) => item.user?.id === currentUser?.id || item.user?.name === currentUser?.name),
        [allEquipment, currentUser]
    );

    const myTypes = useMemo(() => {
        const countsByType = new Map<string, number>();
        myEquipment.forEach((item) => {
            countsByType.set(getCategoryLabel(item.type), (countsByType.get(getCategoryLabel(item.type)) || 0) + 1);
        });
        const max = Math.max(...countsByType.values(), 1);
        return [...countsByType.entries()].map(([type, count]) => ({
            type,
            count,
            percent: (count / max) * 100,
        }));
    }, [myEquipment]);

    const myWarranty = useMemo(() => {
        const now = Date.now();
        const covered = myEquipment.filter(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() > now
        ).length;
        const uncoveredItem = myEquipment.find(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() <= now
        );
        const percent = myEquipment.length > 0 ? (covered / myEquipment.length) * 100 : 0;
        return { covered, total: myEquipment.length, percent, uncoveredItem };
    }, [myEquipment]);

    const mine = useMemo(
        () => ({
            equipment: myEquipment.length,
            requests: approvals.filter(
                (approval) =>
                    ACTIVE_APPROVAL_STATUSES.includes(approval.status) &&
                    (approval.requesterId === currentUser?.id || approval.beneficiaryId === currentUser?.id)
            ).length,
            receipts: approvals.filter(
                (approval) => approval.status === 'PENDING_DELIVERY' && approval.beneficiaryId === currentUser?.id
            ).length,
        }),
        [myEquipment, approvals, currentUser]
    );

    // ---- les actes -------------------------------------------------------------
    const confirmReceipt = (approvalId: string): boolean => {
        const decision = updateApproval(approvalId, 'Completed');
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast('Réception confirmée.', 'success');
        return true;
    };

    const validate = (approvalId: string, status: Approval['status'], approve: boolean, reason?: string): boolean => {
        const isDotation = status === 'WAITING_DOTATION_APPROVAL';
        const next: Approval['status'] = isDotation
            ? approve
                ? 'PENDING_DELIVERY'
                : 'WAITING_IT_PROCESSING'
            : approve
              ? 'WAITING_IT_PROCESSING'
              : 'Rejected';

        const decision = updateApproval(approvalId, next, approve ? undefined : { reason });
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(
            approve ? 'Demande validée.' : isDotation ? 'Dotation renvoyée au traitement IT.' : 'Demande refusée.',
            approve ? 'success' : 'info'
        );
        return true;
    };

    const openFleet = (status: string) => onNavigate?.(`/inventory/filter/${encodeURIComponent(status)}`);

    const isManager = permissions.canManageInventory;
    const firstName = (currentUser?.name || '').split(' ')[0];

    /** Le sous-titre dit **le volume de travail**, pas la nature de l'écran. */
    const subtitle = isManager
        ? `${todo.length === 0 ? 'Rien à traiter' : `${todo.length} chose${todo.length > 1 ? 's' : ''} vous attend${todo.length > 1 ? 'ent' : ''}`} · ${counts.total} actifs`
        : `${mine.receipts === 0 ? 'Rien à confirmer' : `${mine.receipts} réception${mine.receipts > 1 ? 's' : ''} à confirmer`} · ${mine.equipment} équipements`;

    /** Trois rangées au plus dans la zone : au-delà, c'est la file qui prend. */
    const isTodoSaturated = todo.length >= TODO_SATURATION_THRESHOLD;
    const shown = todo.slice(0, 3);
    const rest = todo.length - shown.length;

    return (
        <div className="flex min-w-0 flex-1 flex-col bg-background pb-8">
            <OfflineBanner />

            <div className="flex flex-1 flex-col gap-5 px-5 py-4 medium:px-page">
                <Reading>
                    <header className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="font-brand text-[23px] font-semibold leading-7 tracking-tight text-on-surface">
                                Bonjour {firstName}
                            </h1>
                            <p className="mt-1 text-body-large text-text-secondary">{subtitle}</p>
                        </div>

                        <div className="relative shrink-0">
                            <Button
                                variant="text"
                                size="md"
                                iconOnly
                                onClick={() => setIsAccountOpen((prev) => !prev)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] font-brand text-[15px] font-semibold tracking-wide text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`Compte — ${currentUser?.name || 'Utilisateur'}`}
                                aria-expanded={isAccountOpen}
                            >
                                {userInitials}
                            </Button>

                            {isAccountOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsAccountOpen(false)}
                                    />
                                    <div className="absolute right-0 top-[52px] z-50 w-[240px] rounded-lg border border-outline-variant bg-surface p-1.5 shadow-elevation-3">
                                        <div className="flex items-center gap-2.5 p-2 pb-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] font-brand text-sm font-semibold text-white">
                                                {userInitials}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-on-surface">
                                                    {currentUser?.name || 'Utilisateur'}
                                                </p>
                                                <p className="truncate text-xs text-text-secondary">
                                                    {currentUser?.role === 'ADMIN'
                                                        ? 'Super-administrateur'
                                                        : currentUser?.jobTitle || currentUser?.department || 'Utilisateur'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="text"
                                            size="sm"
                                            layout="card"
                                            onClick={() => {
                                                setIsAccountOpen(false);
                                                if (currentUser?.id) onNavigate?.(`/users/${currentUser.id}`);
                                            }}
                                            className="flex w-full flex-col items-start justify-center gap-0.5 rounded-md border-t border-outline-variant px-2.5 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                                        >
                                            <span className="font-medium">Mon profil</span>
                                            <span className="text-[11px] text-text-secondary">
                                                Mes équipements, mon historique
                                            </span>
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="sm"
                                            layout="card"
                                            onClick={() => {
                                                setIsAccountOpen(false);
                                                onViewChange('settings');
                                            }}
                                            className="flex w-full flex-col items-start justify-center gap-0.5 rounded-md border-t border-outline-variant px-2.5 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                                        >
                                            <span className="font-medium">Mon compte</span>
                                            <span className="text-[11px] text-text-secondary">
                                                Mot de passe, code PIN, sessions
                                            </span>
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="sm"
                                            layout="card"
                                            onClick={() => {
                                                setIsAccountOpen(false);
                                                onNavigate?.('/documentation/ui-flow-map');
                                            }}
                                            className="flex w-full flex-col items-start justify-center gap-0.5 rounded-md border-t border-outline-variant px-2.5 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                                        >
                                            <span className="font-medium">Aide et support</span>
                                            <span className="text-[11px] text-text-secondary">
                                                Documentation, tutoriels, FAQ
                                            </span>
                                        </Button>

                                        <div className="my-1 h-px bg-outline-variant" />

                                        <Button
                                            variant="text"
                                            size="sm"
                                            layout="card"
                                            onClick={() => {
                                                setIsAccountOpen(false);
                                                logout();
                                            }}
                                            className="flex w-full min-h-[40px] items-center rounded-md px-2.5 py-2 text-left text-sm font-medium text-danger hover:bg-error-container/30"
                                        >
                                            Se déconnecter
                                        </Button>

                                        <div className="border-t border-outline-variant px-2.5 pt-2 pb-0.5 text-[11px] tabular-nums text-text-secondary">
                                            Tracker v1.2.0
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </header>
                </Reading>

                {/* Décision — les deux gestes, et l'unique jaune du contenu. */}
                <Reading>
                    {isManager ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="tonal"
                                className="!rounded-[4px] !shadow-none bg-[var(--tk-color-inverse-surface)] text-white hover:bg-[var(--tk-color-inverse-surface)]/90"
                                icon={<Icon glyph={ArrowUUpLeft} size={18} />}
                                onClick={() => onViewChange('return_wizard')}
                            >
                                Restituer
                            </Button>
                            <Button
                                variant="filled"
                                className="!rounded-[4px] !shadow-none bg-primary text-[var(--tk-color-brand-text)] hover:bg-primary-hover"
                                icon={<Icon glyph={ArrowCircleRight} size={18} />}
                                onClick={() => onViewChange('assignment_wizard')}
                            >
                                Attribuer
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="filled"
                            className="w-full !rounded-[4px] !shadow-none bg-primary text-[var(--tk-color-brand-text)] hover:bg-primary-hover"
                            icon={<Icon glyph={Plus} size={18} />}
                            onClick={() => onViewChange('new_request')}
                        >
                            Demander un équipement
                        </Button>
                    )}
                </Reading>

                {/* La zone bornée : sa forme suit le volume, jamais sa hauteur. */}
                <Reading>
                    <section
                        className="relative min-h-[196px] overflow-hidden rounded-card bg-inverse-surface p-4 text-inverse-on-surface"
                        style={HERO_BACKGROUND_STYLE}
                    >
                        <p className="mb-1 flex items-center gap-2.5 font-brand text-[17px] font-semibold">
                            <Icon glyph={CheckCircle} size={18} className="text-on-nav-surface-variant" />
                            À traiter
                        </p>

                        {todo.length === 0 ? (
                            <div className="flex items-center gap-3.5 py-4">
                                <Icon glyph={Tray} size={32} className="text-on-nav-surface-variant" />
                                <div>
                                    <p className="font-brand text-base font-semibold">Rien à traiter</p>
                                    <p className="mt-0.5 text-body-medium text-on-nav-surface-variant">
                                        Aucune demande en attente. Le parc est à jour.
                                    </p>
                                </div>
                            </div>
                        ) : isTodoSaturated ? (
                            <div className="mt-3">
                                <p className="font-brand text-[30px] font-semibold leading-[34px] tracking-tight tabular-nums">
                                    {todo.length}
                                </p>
                                <p className="mt-0.5 text-body-medium text-on-nav-surface-variant">
                                    demandes en attente : ouvrez Tâches pour traiter la file.
                                </p>
                                <div className="mt-2 border-t border-white/[0.14]">
                                    {todoBreakdown.map((item) => (
                                        <Button
                                            key={item.label}
                                            variant="text"
                                            onClick={openTasks}
                                            className="min-h-11 w-full justify-start border-b border-white/[0.14] px-0 text-inverse-on-surface hover:bg-transparent hover:text-inverse-on-surface focus-visible:ring-primary"
                                        >
                                            <span className="w-11 font-brand text-base font-semibold tabular-nums">
                                                {item.count}
                                            </span>
                                            <span className="text-body-large text-on-nav-surface-variant">{item.label}</span>
                                            <Icon glyph={CaretDown} size={18} className="ml-auto -rotate-90 text-on-nav-surface-variant" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="mt-1 text-body-medium tabular-nums text-on-nav-surface-variant">
                                    {todo.length} {todo.length > 1 ? 'demandes' : 'demande'}
                                </p>

                                {shown.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-3 border-t border-white/[0.14] py-2.5 first-of-type:border-t-0"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-vignette bg-info/25 font-brand text-[15px] font-semibold">
                                            {entry.who
                                                .split(' ')
                                                .map((part) => part[0])
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase() || '—'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-medium">
                                                {entry.who ? `${entry.who} — ${entry.what}` : entry.what}
                                            </p>
                                            <p className="mt-px text-body-medium text-on-nav-surface-variant">
                                                {entry.kind === 'receipt'
                                                    ? 'Réception à confirmer'
                                                    : entry.kind === 'return'
                                                      ? 'Retour à réceptionner'
                                                    : entry.status === 'WAITING_DOTATION_APPROVAL'
                                                      ? 'Validation de la dotation'
                                                      : 'Validation du manager'}
                                            </p>
                                        </div>
                                        {entry.kind === 'receipt' ? (
                                            <SecurityGate
                                                onVerified={() => confirmReceipt(entry.id)}
                                                title="Confirmer la réception"
                                                description="Confirmez-vous avoir bien reçu cet équipement ?"
                                                entityId={entry.id}
                                                entityName={entry.what}
                                                trigger={
                                                    <Button
                                                        variant="text"
                                                        size="sm"
                                                        className="h-11 shrink-0 bg-white/[0.14] px-3.5 text-inverse-on-surface hover:bg-white/20 hover:text-inverse-on-surface focus-visible:ring-primary"
                                                    >
                                                        Confirmer la réception
                                                    </Button>
                                                }
                                            />
                                        ) : entry.kind === 'return' ? (
                                            <Button
                                                variant="text"
                                                size="sm"
                                                onClick={() => onViewChange('return_wizard')}
                                                className="h-11 shrink-0 bg-white/[0.14] px-3.5 text-inverse-on-surface hover:bg-white/20 hover:text-inverse-on-surface focus-visible:ring-primary"
                                            >
                                                Réceptionner
                                            </Button>
                                        ) : (
                                            <SecurityGate
                                                onVerified={() => validate(entry.id, entry.status, true)}
                                                title="Valider la demande"
                                                description="Confirmer cette action."
                                                entityId={entry.id}
                                                entityName={entry.what}
                                                trigger={
                                                    <Button
                                                        variant="text"
                                                        size="sm"
                                                        className="h-11 shrink-0 bg-white/[0.14] px-3.5 text-inverse-on-surface hover:bg-white/20 hover:text-inverse-on-surface focus-visible:ring-primary"
                                                    >
                                                        Valider la demande
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                ))}

                                {rest > 0 && (
                                    <DashboardMoreAction
                                        label={`Voir ${rest > 1 ? `les ${rest} autres` : "l'autre"}`}
                                        destination="dans Tâches, par ancienneté"
                                        onClick={() => openTasks()}
                                        tone="inverse"
                                        spacing="hero"
                                    />
                                )}
                            </>
                        )}
                    </section>
                </Reading>

                {/* État — une carte à séparateurs, le rouge sur le seul chiffre qui alerte. */}
                <Reading>
                    <section className="rounded-card bg-surface p-4">
                        <div className="grid grid-cols-2">
                            {(isManager
                                ? [
                                      { label: 'Total actifs', value: counts.total, icon: Package, iconTint: 'text-on-surface-variant', onClick: () => openFleet('') },
                                      { label: 'Attribués', value: counts.assigned, icon: UserCheck, iconTint: 'text-info', onClick: () => openFleet('Attribué') },
                                      { label: 'Disponibles', value: counts.available, icon: Check, iconTint: 'text-success', onClick: () => openFleet('Disponible') },
                                      { label: 'En réparation', value: counts.repair, icon: Wrench, iconTint: 'text-warning-strong', alert: true, onClick: () => openFleet('En réparation') },
                                  ]
                                : [
                                      { label: 'Mes équipements', value: mine.equipment, icon: Laptop, iconTint: 'text-on-surface-variant', onClick: () => openFleet('') },
                                      { label: 'Demandes en cours', value: mine.requests, icon: Clock, iconTint: 'text-info', onClick: () => onViewChange('approvals') },
                                      { label: 'Réceptions à confirmer', value: mine.receipts, icon: Truck, iconTint: 'text-warning-strong', onClick: () => onViewChange('approvals') },
                                  ]
                            ).map((kpi, index, all) => (
                                <Button
                                    key={kpi.label}
                                    variant="text"
                                    layout="card"
                                    onClick={kpi.onClick}
                                    className={cn(
                                        'block rounded-none py-3.5 hover:bg-transparent',
                                        index % 2 === 1 ? 'border-l border-outline-variant pl-3.5' : 'pr-3.5',
                                        index > 1 && 'border-t border-outline-variant',
                                        index < 2 && 'pt-0',
                                        // Une troisième cellule seule occupe toute la largeur (2 + 1).
                                        all.length === 3 && index === 2 && 'col-span-2 border-l-0 pl-0'
                                    )}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="text-body-medium text-text-secondary">{kpi.label}</span>
                                        <Icon glyph={kpi.icon} size={18} className={kpi.iconTint} />
                                    </span>
                                    <span
                                        className={cn(
                                            'mt-1.5 block font-brand text-2xl font-semibold tabular-nums',
                                            kpi.alert ? 'text-danger' : 'text-on-surface'
                                        )}
                                    >
                                        {kpi.value}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </section>
                </Reading>

                {/* Analyse — ce qui décide, pas ce qui décrit. */}
                {isManager ? (
                    <>
                        <Reading>
                            <Card icon={ChartBar} title="Types en tension">
                                {tension.stressed.length > 0 ? (
                                    <>
                                        <p className="mt-1 text-body-medium leading-4 text-text-secondary">
                                            Aucune unité disponible — les plus nombreux d’abord.
                                        </p>
                                        {tension.stressed.map(([type, entry]) => (
                                            <p key={type} className="mt-3 flex items-center gap-2.5 text-body-large">
                                                <Icon glyph={Warning} size={18} className="text-warning-strong" />
                                                <span className="min-w-0 flex-1 truncate text-on-surface">{entry.label}</span>
                                                <span className="tabular-nums text-text-secondary">
                                                    0 sur {entry.total}
                                                </span>
                                            </p>
                                        ))}
                                        {tension.calm > 0 && (
                                            <p className="mt-3 border-t border-outline-variant pt-3 text-body-medium text-text-secondary">
                                                {tension.calm === 1
                                                    ? 'L’autre type a au moins une unité disponible.'
                                                    : `Les ${tension.calm} autres types ont au moins une unité disponible.`}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-2 text-body-medium text-text-secondary">
                                        Chaque type a au moins une unité disponible.
                                    </p>
                                )}
                            </Card>
                        </Reading>

                        <Reading>
                            <Card icon={ShieldWarning} title="État du parc">
                                <ProportionRow
                                    value={fleet.endOfLife}
                                    label={`équipements sur ${fleet.size} arrivent en fin de vie comptable`}
                                    percent={fleet.size > 0 ? (fleet.endOfLife / fleet.size) * 100 : 0}
                                    tone={fleet.endOfLife > 0 ? 'attention' : 'neutral'}
                                    note="Amortis à plus de 85 %. Leur renouvellement reste à provisionner."
                                />
                                <ProportionRow
                                    className="mt-4 border-t border-outline-variant pt-1"
                                    value={fleet.uncovered}
                                    label={`équipements sur ${fleet.size} ne sont plus sous garantie`}
                                    percent={fleet.size > 0 ? (fleet.uncovered / fleet.size) * 100 : 0}
                                    tone={fleet.uncovered > 0 ? 'attention' : 'neutral'}
                                    note={
                                        fleet.unknownWarranty > 0
                                            ? `${fleet.unknownWarranty} sans date de fin connue. Leur remise en état n’est provisionnée nulle part.`
                                            : 'Aucun sans date de fin. Leur remise en état n’est provisionnée nulle part.'
                                    }
                                />
                                <DashboardMoreAction
                                    label="Valeur et amortissement"
                                    destination="dans Finances"
                                    onClick={() => onViewChange('finance')}
                                />
                            </Card>
                        </Reading>

                        <Reading>
                            <Card icon={FileText} title={`Budget ${budgetStats?.year || 2026}`}>
                                {budgetStats ? (
                                    <>
                                        <div className="mt-3 flex items-baseline gap-2.5">
                                            <span className="font-brand text-[24px] font-semibold leading-none tabular-nums text-on-surface">
                                                {new Intl.NumberFormat('fr-FR').format(budgetStats.totalSpent)}
                                            </span>
                                            <span className="min-w-0 flex-1 text-body-large leading-[19px] text-text-secondary">
                                                XOF engagés sur les {new Intl.NumberFormat('fr-FR').format(budgetStats.totalAllocated)} de l’exercice
                                            </span>
                                            <span className="text-body-medium font-medium tabular-nums text-text-secondary">
                                                {budgetStats.percentSpent.toFixed(1).replace('.', ',')} %
                                            </span>
                                        </div>

                                        <div
                                            role="img"
                                            aria-label={`${budgetStats.percentSpent.toFixed(1)} % ; repère du premier trimestre à 25 %`}
                                            className="relative mt-3.5 h-1.5 overflow-hidden rounded-xs bg-surface-container"
                                        >
                                            <span
                                                className="block h-full rounded-xs bg-on-surface"
                                                style={{ width: `${Math.min(100, Math.max(0, budgetStats.percentSpent))}%` }}
                                            />
                                            <span
                                                className="absolute top-0 bottom-0 w-0.5 bg-outline-variant"
                                                style={{ left: '25%' }}
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <p className="mt-2 text-body-medium leading-[18px] text-text-secondary">
                                            Le repère marque le quart d’exercice écoulé : l’engagement est{' '}
                                            <strong className="font-semibold text-on-surface">
                                                {Math.abs(Math.round(25 - budgetStats.percentSpent))} points {budgetStats.percentSpent <= 25 ? 'sous le rythme' : 'au-dessus du rythme'}
                                            </strong>
                                            .{' '}
                                            {budgetStats.overPacedCount === 0
                                                ? `Aucune des ${budgetStats.itemCount > 0 ? budgetStats.itemCount : 'quatre'} enveloppes ne dépasse son rythme.`
                                                : `${budgetStats.overPacedCount} enveloppe${budgetStats.overPacedCount > 1 ? 's dépassent' : ' dépasse'} son rythme.`}{' '}
                                            {new Intl.NumberFormat('fr-FR').format(budgetStats.remaining)} XOF restent disponibles.
                                        </p>

                                        <DashboardMoreAction
                                            label="Détail par enveloppe"
                                            destination="dans Pilotage"
                                            onClick={() => onViewChange('finance')}
                                        />
                                    </>
                                ) : (
                                    <p className="mt-2 text-body-medium text-text-secondary">
                                        Aucun budget configuré pour cet exercice.
                                    </p>
                                )}
                            </Card>
                        </Reading>
                    </>
                ) : (
                    <>
                        {/* Vue Utilisateur — Mes équipements par type */}
                        <Reading>
                            <Card icon={ChartBar} title="Mes équipements par type">
                                {myTypes.length > 0 ? (
                                    <div className="mt-2 space-y-3">
                                        {myTypes.map((item) => (
                                            <div key={item.type} className="flex items-center gap-2.5 text-body-medium">
                                                <span className="min-w-0 flex-1 truncate text-on-surface">{item.type}</span>
                                                <div className="h-1 w-24 shrink-0 overflow-hidden rounded-xs bg-surface-container">
                                                    <div
                                                        className="h-full rounded-xs bg-on-surface"
                                                        style={{ width: `${item.percent}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right font-medium tabular-nums text-text-secondary">
                                                    {item.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-body-medium text-text-secondary">
                                        Aucun équipement ne vous est actuellement attribué.
                                    </p>
                                )}
                            </Card>
                        </Reading>

                        {/* Vue Utilisateur — Garantie de mes équipements */}
                        <Reading>
                            <Card icon={ShieldWarning} title="Garantie de mes équipements">
                                <ProportionRow
                                    value={myWarranty.covered}
                                    label={`de mes ${myWarranty.total} équipements sont couverts`}
                                    percent={myWarranty.percent}
                                    tone={myWarranty.percent > 0 ? 'positive' : 'neutral'}
                                    note={
                                        myWarranty.uncoveredItem
                                            ? `1 hors garantie : ${myWarranty.uncoveredItem.name || myWarranty.uncoveredItem.model}, depuis ${formatDate(new Date(myWarranty.uncoveredItem.warrantyEnd || ''))}.`
                                            : 'Tous vos équipements sont sous garantie constructeur active.'
                                    }
                                />
                            </Card>
                        </Reading>
                    </>
                )}

                {/* Activité — en dernier. */}
                <Reading>
                    <Card icon={ClockCounterClockwise} title="Derniers événements">
                        {recentEvents.length > 0 ? (
                            <>
                                <div className="mt-2">
                                    {recentEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex min-h-14 items-center gap-3 border-t border-outline-variant py-2.5 first-of-type:border-t-0"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                                                <Icon glyph={ClockCounterClockwise} size={18} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-body-large leading-5 text-on-surface">
                                                    {getHistoryEventSentence({ event, perspectiveActorId: currentUser?.id })}
                                                </p>
                                                <p className="mt-0.5 text-body-medium tabular-nums text-text-secondary">
                                                    {formatDate(new Date(event.timestamp))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <DashboardMoreAction
                                    label="Voir tout"
                                    destination={isManager ? 'dans Audit' : 'dans Mon profil'}
                                    onClick={() => {
                                        if (isManager) {
                                            onViewChange('audit');
                                        } else if (currentUser?.id) {
                                            onNavigate?.(`/users/${currentUser.id}`);
                                        }
                                    }}
                                />
                            </>
                        ) : (
                            <p className="mt-2 text-body-medium text-text-secondary">
                                Aucun événement enregistré pour l’instant.
                            </p>
                        )}
                    </Card>
                </Reading>
            </div>
        </div>
    );
};

export default DashboardPage;
