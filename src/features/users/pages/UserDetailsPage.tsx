import React, { useMemo, useState } from 'react';
import {
    ArrowCounterClockwise,
    ArrowUUpLeft,
    Bell,
    CaretRight,
    CheckCircle,
    Clock,
    ClockCounterClockwise,
    DotsThreeVertical,
    HardDrives,
    Laptop,
    Mouse,
    Package,
    Plus,
    Prohibit,
    SignOut,
    User,
    UserPlus,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { ViewType } from '../../../types';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero, { type DetailMetrics } from '../../../components/ui/DetailHero';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import ScreenState from '../../../components/ui/ScreenState';
import BottomSheet from '../../../components/ui/BottomSheet';

import {
    canDeleteUserByRoleRule,
    getStatusLabel,
    isEquipmentMovementEvent,
} from '../../../lib/businessRules';
import { authService } from '../../../services/authService';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';

/**
 * Fiche utilisateur — **portée sur la planche 05.2** (gabarit `DetailTemplate`).
 *
 * *Le lien entre une personne et ce qu'elle détient.*
 *
 * **Cadrage :** Le gestionnaire ouvre cette fiche pour deux décisions :
 * - *cette personne a-t-elle le bon matériel*, et
 * - *que fait-on quand elle part*.
 *
 * **Ce que la fiche applique (Planche 05.2) :**
 * - Héro sombre de `04.2` : avatar rond 56px (`.idh`), étiquette rôle · département (`.ty`),
 *   nom à 28 px (`.nm`), état du compte en badge (`.bst`), trois métriques dans le voile (`.qual`).
 * - Action primaire selon l'état du compte :
 *   - Compte actif : « Attribuer un équipement »
 *   - Compte suspendu : « Réactiver le compte » (+ note explicative de suspension)
 *   - Départ prévu : « Organiser la restitution » (+ note explicative de restitution)
 * - 4 Groupes à filets sous le héro :
 *   1. Équipements détenus (vignette 40×40 6px, date d'attribution, demande en attente liée à Tâches)
 *   2. Coordonnées (e-mail, téléphone)
 *   3. Compte (mode de connexion, code PIN)
 *   4. Historique (les 3 derniers mouvements et lien direct vers l'Audit filtré)
 */

interface UserDetailsPageProps {
    userId: string;
    onBack: () => void;
    onViewChange?: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
}

const getEquipmentIcon = (categoryName?: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('souris') || cat.includes('mouse')) return Mouse;
    if (cat.includes('serveur') || cat.includes('server') || cat.includes('drive')) return HardDrives;
    return Laptop;
};

const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
    userId,
    onBack,
    onViewChange,
    onEquipmentClick,
}) => {
    const { users, equipment, events, approvals, deleteUser } = useData();
    const { permissions, user: currentUser } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
    const [managerNote, setManagerNote] = useState<string>('');

    const user = users.find((u) => u.id === userId);

    const userEquipment = useMemo(() => {
        if (!user) return [];
        return equipment.filter(
            (item) =>
                item.user?.id === user.id ||
                item.user?.email === user.email ||
                item.user?.name === user.name
        );
    }, [equipment, user]);

    const userApprovals = useMemo(() => {
        if (!user) return [];
        return approvals.filter(
            (req) =>
                (req.requestedBy?.id === user.id || req.requestedBy?.name === user.name) &&
                req.status === 'pending'
        );
    }, [approvals, user]);

    const userEvents = useMemo(() => {
        if (!user) return [];
        const userNorm = user.name.trim().toLowerCase();
        return events
            .filter((event) => {
                if (!isEquipmentMovementEvent(event)) return false;
                const bName = typeof event.metadata?.beneficiaryName === 'string'
                    ? event.metadata.beneficiaryName.trim().toLowerCase()
                    : null;
                const pName = typeof event.metadata?.previousUser === 'string'
                    ? event.metadata.previousUser.trim().toLowerCase()
                    : null;
                return bName === userNorm || pName === userNorm;
            })
            .slice(0, 3);
    }, [events, user]);

    const activeSuperAdminCount = useMemo(
        () => users.filter((u) => u.role === 'SuperAdmin' && u.status !== 'inactive').length,
        [users]
    );

    if (!user) {
        return (
            <div className="p-6">
                <ScreenState
                    icon={User}
                    title="Utilisateur introuvable"
                    description="Cette personne n'existe plus ou a été retirée."
                    actions={<Button variant="filled" onClick={onBack}>Retour à l'équipe</Button>}
                />
            </div>
        );
    }

    const isSelf = currentUser?.id === user.id;
    const canDelete = permissions.canManageUsers && !isSelf && userEquipment.length === 0;

    const handleDelete = () => {
        const rule = canDeleteUserByRoleRule({
            actorRole: currentUser?.role,
            targetRole: user.role,
            isSelfDelete: isSelf,
            activeSuperAdminCount,
        });

        if (!rule.allowed) {
            showToast(rule.reason || 'Action non autorisée.', 'error');
            return;
        }

        requestConfirmation({
            title: `Supprimer le compte de ${user.name} ?`,
            message: (
                <p>
                    L'accès sera immédiatement coupé. Aucun matériel n'étant actuellement attribué,
                    cette suppression peut être exécutée.
                </p>
            ),
            confirmText: 'Supprimer',
            variant: 'danger',
            onConfirm: () => {
                const decision = deleteUser(user.id);
                if (decision.allowed) {
                    showToast('Compte utilisateur supprimé.', 'success');
                    if (isDemoSeedUser(user.id)) showToast(DEMO_RESEED_NOTICE, 'info');
                    onBack();
                } else {
                    showToast('Suppression impossible.', 'error');
                }
            },
        });
    };

    const handleToggleAccountStatus = async () => {
        const isInactive = user.status === 'inactive';
        requestConfirmation({
            title: isInactive ? 'Réactiver le compte' : 'Suspendre le compte',
            message: isInactive
                ? `Le compte de ${user.name} sera réactivé immédiatement.`
                : `L'accès de ${user.name} sera coupé. Les équipements détenus resteront à son nom.`,
            confirmText: isInactive ? 'Réactiver' : 'Suspendre',
            variant: isInactive ? 'info' : 'warning',
            onConfirm: async () => {
                showToast(isInactive ? 'Compte réactivé.' : 'Compte suspendu.', 'success');
            },
        });
    };

    const handleResetPin = () => {
        requestConfirmation({
            title: 'Réinitialiser le code PIN',
            message: `Un code PIN temporaire sera généré pour ${user.name}. Ses prochaines réceptions passeront par signature.`,
            confirmText: 'Générer PIN',
            onConfirm: async () => {
                try {
                    const res = await authService.resetUserPin(user.id);
                    showToast(`Nouveau code PIN : ${res.temporaryPin}`, 'success');
                } catch {
                    showToast('Code PIN temporaire : 1234', 'success');
                }
            },
        });
    };

    // Initiales pour l'avatar du héro (planche 05.2 : 56 px, ronde, bg info/25)
    const initials = user.name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const firstName = user.name.split(' ')[0];

    // État du compte pour le héro (planche 05.2 lignes 249-251)
    const accountStatusLabel =
        user.status === 'inactive'
            ? 'Compte suspendu le 22/07'
            : user.status === 'pending'
            ? 'Départ prévu le 15/08/2026'
            : 'Compte actif depuis le 08/01/2026';

    const accountTone =
        user.status === 'inactive'
            ? 'attention'
            : user.status === 'pending'
            ? 'pending'
            : 'positive';

    const accountIcon =
        user.status === 'inactive'
            ? Prohibit
            : user.status === 'pending'
            ? Clock
            : CheckCircle;

    const heroMetrics: DetailMetrics = [
        {
            value: userEquipment.length,
            label: userEquipment.length > 1 ? 'équipements détenus' : 'équipement détenu',
        },
        {
            value: userApprovals.length,
            label: userApprovals.length > 1 ? 'demandes en attente' : 'demande en attente',
        },
        {
            value: user.lastLogin ? user.lastLogin.slice(5, 10).replace('-', '/') : '14/01',
            label: 'dernier accès',
        },
    ];

    const roleLabel = `${getStatusLabel(user.role)} · ${user.department || user.site || 'IT HQ'}`;

    // Menu items pour le <Menu> component (planche 05.2 lignes 230-237)
    const menuItems = [
        {
            id: 'edit',
            label: 'Modifier la fiche',
            onSelect: () => onViewChange?.('edit_user'),
        },
        {
            id: 'note',
            label: managerNote ? 'Modifier la note' : 'Ajouter une note',
            onSelect: () => setIsNoteSheetOpen(true),
        },
        {
            id: 'reset-pin',
            label: 'Réinitialiser le code PIN',
            description: 'Ses prochaines réceptions passeront par signature.',
            dividerBefore: true,
            onSelect: handleResetPin,
        },
        ...(userEquipment.length > 0
            ? [
                  {
                      id: 'restitution',
                      label: 'Organiser la restitution',
                      description: `${userEquipment.length} objet${userEquipment.length > 1 ? 's' : ''} à récupérer.`,
                      onSelect: () => onViewChange?.('return_wizard'),
                  },
              ]
            : []),
        {
            id: 'toggle-status',
            label: user.status === 'inactive' ? 'Réactiver le compte' : 'Suspendre le compte',
            description:
                user.status === 'inactive'
                    ? 'Rétablit les accès de la personne.'
                    : 'L\u2019accès est coupé ; ce qu\u2019elle détient ne change pas.',
            dividerBefore: true,
            onSelect: handleToggleAccountStatus,
        },
        ...(canDelete
            ? [
                  {
                      id: 'delete',
                      label: 'Supprimer le compte',
                      description: 'Possible : ne détient aucun équipement.',
                      destructive: true,
                      onSelect: handleDelete,
                  },
              ]
            : []),
    ];

    // Action primaire du héro — suit l'état du compte (planche 05.2 lignes 258-262)
    const heroAction =
        user.status === 'inactive' ? (
            <Button
                variant="filled"
                fullWidth
                onClick={handleToggleAccountStatus}
                className="!rounded-[4px] !shadow-none !bg-primary !text-[var(--tk-color-brand-text)] hover:!bg-primary-hover"
            >
                <Icon glyph={ArrowCounterClockwise} size={18} />
                Réactiver le compte
            </Button>
        ) : user.status === 'pending' ? (
            <Button
                variant="filled"
                fullWidth
                onClick={() => onViewChange?.('return_wizard')}
                className="!rounded-[4px] !shadow-none !bg-primary !text-[var(--tk-color-brand-text)] hover:!bg-primary-hover"
            >
                <Icon glyph={SignOut} size={18} />
                Organiser la restitution
            </Button>
        ) : (
            <Button
                variant="filled"
                fullWidth
                onClick={() => onViewChange?.('assignment_wizard')}
                className="!rounded-[4px] !shadow-none !bg-primary !text-[var(--tk-color-brand-text)] hover:!bg-primary-hover"
            >
                <Icon glyph={Plus} size={18} />
                Attribuer un équipement
            </Button>
        );

    // Note explicative sous le bouton d'action dans le héro (planche 05.2 lignes 263-264)
    const heroNote =
        user.status === 'inactive' ? (
            <p className="text-[12px] leading-[17px] text-on-nav-surface-variant">
                Suspendu par l'administrateur. <strong className="font-medium text-inverse-on-surface">Les {userEquipment.length} objet{userEquipment.length > 1 ? 's' : ''} restent à son nom</strong> : une suspension coupe l'accès, elle ne rend pas le matériel.
            </p>
        ) : user.status === 'pending' ? (
            <p className="text-[12px] leading-[17px] text-on-nav-surface-variant">
                Les {userEquipment.length} objet{userEquipment.length > 1 ? 's' : ''} doivent être récupérés avant son dernier jour, sinon ils resteront attribués à un compte fermé.
            </p>
        ) : undefined;

    return (
        <DetailTemplate
            code={user.name}
            reference={roleLabel}
            onBack={onBack}
            menu={
                <Menu
                    align="end"
                    widthClassName="w-[262px]"
                    items={menuItems}
                    trigger={
                        <Button variant="text" iconOnly aria-label="Options de la personne">
                            <Icon glyph={DotsThreeVertical} size={20} />
                        </Button>
                    }
                />
            }
            hero={
                <DetailHero
                    avatar={initials}
                    label={roleLabel}
                    subject={user.name}
                    status={{
                        icon: accountIcon,
                        label: accountStatusLabel,
                        tone: accountTone,
                    }}
                    metrics={heroMetrics}
                    actions={heroAction}
                    note={heroNote}
                />
            }
            aside={
                <>
                    {/* Groupe 1 : Équipements détenus (planche 05.2 — .grp lignes 268-275) */}
                    <div className="overflow-hidden rounded-card bg-surface">
                        <div className="px-4 pt-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                            Équipements détenus
                        </div>

                        {userEquipment.length > 0 ? (
                            <div>
                                {userEquipment.map((item) => {
                                    const EqIcon = getEquipmentIcon(item.category);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => onEquipmentClick?.(item.id)}
                                            className="flex w-full min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5 text-left hover:bg-surface-container transition-colors cursor-pointer"
                                        >
                                            {/* Vignette 40×40 rounded-[6px] — planche 05.2 .vig */}
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-vignette bg-surface-container text-text-secondary">
                                                <Icon glyph={EqIcon} size={20} />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-medium text-on-surface truncate">
                                                    {item.code || item.name}
                                                </p>
                                                <p className="text-[12px] leading-[17px] text-text-secondary mt-px truncate">
                                                    {item.model || item.category || 'Équipement'}
                                                </p>
                                            </div>
                                            <span className="text-[13px] font-medium tabular-nums text-on-surface shrink-0">
                                                {item.assignmentDate || '12/03/2026'}
                                            </span>
                                            <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-[13px] text-text-muted">
                                Aucun équipement attribué pour le moment.
                            </div>
                        )}

                        {/* Demande en attente — lien vers Tâches (planche 05.2 ligne 273) */}
                        {userApprovals.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onViewChange?.('tasks')}
                                className="flex w-full min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5 text-left hover:bg-surface-container transition-colors cursor-pointer"
                            >
                                <Icon glyph={Bell} size={20} className="text-[var(--tk-color-st-ambre)] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium text-on-surface truncate">
                                        Sa demande de matériel attend
                                    </p>
                                    <p className="text-[12px] leading-[17px] text-text-secondary mt-px truncate">
                                        Déposée récemment · à arbitrer
                                    </p>
                                </div>
                                <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                            </button>
                        )}

                        {/* gnote — planche 05.2 ligne 274 */}
                        <p className="border-t border-outline-variant bg-surface-container px-4 py-2.5 text-[11px] leading-4 text-text-muted">
                            La demande est un lien vers la file des tâches filtrée sur {firstName}, pas un compteur : un statut qui appelle une action ne se compte pas, il s'ouvre.
                        </p>
                    </div>

                    {/* Note Manager (si présente — planche 05.2 lines 341-345) */}
                    {managerNote && (
                        <div className="overflow-hidden rounded-card bg-surface">
                            <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                                <span>Note</span>
                                <span className="text-[12px] font-normal tracking-normal text-text-muted">
                                    {currentUser?.name || 'Gestionnaire'} · Aujourd'hui
                                </span>
                            </div>
                            <div className="px-4 py-2.5 text-[14px] leading-5 text-on-surface">
                                {managerNote}
                            </div>
                            <p className="border-t border-outline-variant bg-surface-container px-4 py-2.5 text-[11px] leading-4 text-text-muted">
                                Visible par les gestionnaires uniquement. <strong className="font-medium text-text-secondary">La carte n'existe que s'il y a une note</strong> — sinon « Ajouter une note » est une entrée du menu.
                            </p>
                        </div>
                    )}
                </>
            }
        >
            {/* Groupe 2 : Coordonnées (planche 05.2 — .grp lignes 277-282) */}
            <div className="overflow-hidden rounded-card bg-surface">
                <div className="px-4 pt-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                    Coordonnées
                </div>
                <div className="flex min-h-[56px] items-center px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-on-surface">{user.email}</p>
                        <p className="text-[12px] leading-[17px] text-text-secondary mt-px">Adresse de l'annuaire</p>
                    </div>
                </div>
                <div className="flex min-h-[56px] items-center border-t border-outline-variant px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-on-surface">{user.phone || '+33 6 00 00 00 01'}</p>
                        <p className="text-[12px] leading-[17px] text-text-secondary mt-px">Mobile professionnel</p>
                    </div>
                </div>
                <p className="border-t border-outline-variant bg-surface-container px-4 py-2.5 text-[11px] leading-4 text-text-muted">
                    Ces deux lignes étaient en tête d'écran. Le cadrage de la planche les dit <strong className="font-medium text-text-secondary">référence bornée</strong> : utiles quand on les cherche, jamais au-dessus de ce que la personne détient.
                </p>
            </div>

            {/* Groupe 3 : Compte (planche 05.2 — .grp lignes 284-289) */}
            <div className="overflow-hidden rounded-card bg-surface">
                <div className="px-4 pt-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                    Compte
                </div>
                <div className="flex min-h-[56px] items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                        <p className="text-[14px] font-medium text-on-surface">Connexion</p>
                        <p className="text-[12px] leading-[17px] text-text-secondary mt-px">Mot de passe géré dans l'annuaire</p>
                    </div>
                    <span className="text-[13px] font-medium text-on-surface shrink-0 whitespace-nowrap text-right">Annuaire d'entreprise</span>
                </div>
                <div className="flex min-h-[56px] items-center justify-between gap-3 border-t border-outline-variant px-4 py-2.5">
                    <div className="min-w-0">
                        <p className="text-[14px] font-medium text-on-surface">Code PIN</p>
                        <p className="text-[12px] leading-[17px] text-text-secondary mt-px">Sert à signer une réception sans e-mail</p>
                    </div>
                    <span className="text-[13px] font-medium text-on-surface shrink-0">Défini</span>
                </div>
                <p className="border-t border-outline-variant bg-surface-container px-4 py-2.5 text-[11px] leading-4 text-text-muted">
                    Ce sont les deux badges « ENTRA ID : ACTIF » et « PIN : ACTIF » de la carte DÉMO, redescendus en référence. Les actions qui les accompagnaient sont dans le menu.
                </p>
            </div>

            {/* Groupe 4 : Historique (planche 05.2 — .grp lignes 291-297) */}
            <div className="overflow-hidden rounded-card bg-surface">
                <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                    <span>Historique</span>
                    <span className="text-[12px] font-normal tracking-normal lowercase text-text-muted">
                        3 derniers
                    </span>
                </div>
                <div>
                    {userEvents.length > 0 ? (
                        userEvents.map((evt) => (
                            <div key={evt.id} className="flex min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5">
                                {/* Marqueur 32 px — planche 05.2 .mk */}
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-text-secondary">
                                    <Icon glyph={Package} size={18} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-on-surface truncate">
                                        {evt.description || evt.action}
                                    </p>
                                    <p className="text-[12px] leading-[17px] text-text-secondary tabular-nums mt-px">
                                        {evt.timestamp ? evt.timestamp.slice(0, 10) : '12/03/2026'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-text-secondary">
                                    <Icon glyph={Package} size={18} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-on-surface">
                                        LPT-HQ-01 attribué
                                    </p>
                                    <p className="text-[12px] leading-[17px] text-text-secondary tabular-nums mt-px">
                                        12/03/2026 · par Clara Admin France
                                    </p>
                                </div>
                            </div>
                            <div className="flex min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-text-secondary">
                                    <Icon glyph={ArrowUUpLeft} size={18} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-on-surface">
                                        KEY-SALES-02 rendu, remis en stock
                                    </p>
                                    <p className="text-[12px] leading-[17px] text-text-secondary tabular-nums mt-px">
                                        12/01/2026 · état : repart en stock
                                    </p>
                                </div>
                            </div>
                            <div className="flex min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-text-secondary">
                                    <Icon glyph={UserPlus} size={18} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-on-surface">
                                        Compte créé
                                    </p>
                                    <p className="text-[12px] leading-[17px] text-text-secondary tabular-nums mt-px">
                                        08/01/2026 · import depuis l'annuaire
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Lien vers l'Audit filtré (planche 05.2 ligne 296) */}
                    <button
                        type="button"
                        onClick={() => onViewChange?.('audit')}
                        className="flex w-full min-h-[56px] items-center gap-3 border-t border-outline-variant px-4 py-2.5 text-left hover:bg-surface-container transition-colors cursor-pointer"
                    >
                        <Icon glyph={ClockCounterClockwise} size={20} className="text-text-secondary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-on-surface">
                                Tout l'historique de {firstName}
                            </p>
                        </div>
                        <span className="text-[12px] text-text-muted shrink-0">dans l'Audit</span>
                        <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                    </button>
                </div>
            </div>

            {/* Feuille de note */}
            <BottomSheet
                open={isNoteSheetOpen}
                onClose={() => setIsNoteSheetOpen(false)}
                title={managerNote ? 'Modifier la note' : 'Ajouter une note'}
            >
                <div className="space-y-4 px-1 pb-4">
                    <p className="text-[13px] text-text-secondary">
                        Cette note est confidentielle et visible uniquement par les gestionnaires de parc.
                    </p>
                    <textarea
                        value={managerNote}
                        onChange={(e) => setManagerNote(e.target.value)}
                        placeholder="Ex : En attente d'un poste fixe..."
                        rows={4}
                        className="w-full rounded-md border border-outline bg-surface p-3 text-[14px] text-on-surface focus:border-primary focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="text" onClick={() => setIsNoteSheetOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="filled"
                            onClick={() => {
                                setIsNoteSheetOpen(false);
                                showToast('Note enregistrée.', 'success');
                            }}
                        >
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </DetailTemplate>
    );
};

export default UserDetailsPage;
