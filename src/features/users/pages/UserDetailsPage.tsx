import React, { useEffect, useMemo, useState } from 'react';
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
    UserMinus,
    UserPlus,
    Warning,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import type { AppUser, Equipment, HistoryEvent, ViewType } from '../../../types';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import RuleGroup from '../../../components/ui/RuleGroup';
import DetailHero from '../../../components/ui/DetailHero';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import ScreenState from '../../../components/ui/ScreenState';
import BottomSheet from '../../../components/ui/BottomSheet';
import TintedTile, { TintedTileRow } from '../../../components/ui/TintedTile';

import {
    ACTIVE_APPROVAL_STATUSES,
    canDeleteUserByRoleRule,
    getStatusLabel,
    isEquipmentMovementEvent,
} from '../../../lib/businessRules';
import { authService } from '../../../services/authService';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';

/**
 * Fiche utilisateur — planche 05.2, **passe sobre du 03/09**.
 *
 * Ce que la passe change par rapport au 02/09 : les chiffres **sortent du héro** et
 * deviennent deux tuiles teintées posées dessous — ce qu'elle détient, sa demande en
 * cours. Le héro ne garde que le sujet, son état et le geste. « Dernier accès »
 * descend en rangée. Les coordonnées rejoignent la carte « Compte » au lieu d'ouvrir
 * la leur. Et une carte « Ses accès » paraît, qui renvoie à 11.1.
 *
 * *Le lien entre une personne et ce qu'elle détient.*
 *
 * Règle de la passe : **un fait sans source dans le store n'est pas affiché.**
 * - `user.status` ne dit que l'accès : `active`, `inactive` (suspendu — `suspendedAt`,
 *   `suspendedBy`, `suspensionReason`), `pending` (invité, au sens d'`authService`).
 * - Le départ est un champ à part, `user.departureDate`, indépendant de la suspension.
 * - La note est `user.managerNote` (texte, auteur, date), écrite par `updateUser`.
 * - L'historique est lu dans `events` : mouvements d'équipement où la personne est
 *   bénéficiaire ou porteur précédent, plus les événements sur son compte. Vide → dit vide.
 * - Code PIN et mot de passe sont lus dans `authService` (`PinStatus`, `MustChangePassword`).
 *
 * Hypothèse retenue (zone d'ombre) : suspension et départ **signalent** les objets encore
 * détenus (`Equipment.holderAlert`, écrit par `updateUser` dans le DataContext) ; la fiche
 * montre ce signal sous chaque rangée et « Organiser la restitution » devient le geste primaire.
 */

interface UserDetailsPageProps {
    userId: string;
    onBack: () => void;
    onViewChange?: (view: ViewType) => void;
    onEquipmentClick?: (id: string) => void;
    onEditUser?: (id: string) => void;
}

const getEquipmentIcon = (categoryName?: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('souris') || cat.includes('mouse')) return Mouse;
    if (cat.includes('serveur') || cat.includes('server') || cat.includes('drive'))
        return HardDrives;
    return Laptop;
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

/** ISO → « 12/03/2026 ». Une valeur illisible rend `null`, jamais une date de remplacement. */
const formatDate = (value?: string | null): string | null => {
    if (!value) return null;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) return value.slice(0, 10);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : FR_DATE.format(d);
};

/** « 14/01/2026 12:07 » (seed) ou ISO → « 14/01 ». */
const formatShortDate = (value?: string | null): string | null => {
    const full = formatDate(value);
    return full ? full.slice(0, 5) : null;
};

const toDateInputValue = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const HISTORY_ICON: Partial<Record<HistoryEvent['type'], typeof Package>> = {
    RETURN: ArrowUUpLeft,
    CREATE: UserPlus,
    DELETE: UserMinus,
};

const historyIcon = (evt: HistoryEvent) => {
    if (evt.targetType === 'USER') {
        if (evt.metadata?.accountStatus === 'inactive') return Prohibit;
        if (evt.metadata?.accountStatus === 'active') return ArrowCounterClockwise;
        if (evt.metadata?.departureDate !== undefined) return SignOut;
        return HISTORY_ICON[evt.type] ?? UserPlus;
    }
    if (evt.metadata?.holderAlert) return Warning;
    return HISTORY_ICON[evt.type] ?? Package;
};

/** Ce qu'un niveau de portée veut dire en clair, sur la fiche d'une personne. */
const SCOPE_LABEL: Record<string, string> = {
    global: 'tout le parc',
    country: 'son pays',
    service: 'son service',
    team: 'son équipe',
    self: 'ses seuls objets',
};

const PIN_LABEL: Record<NonNullable<AppUser['PinStatus']>, string> = {
    active: 'Défini',
    pending: 'Temporaire, à redéfinir',
    not_set: 'Non défini',
};

const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
    userId,
    onBack,
    onViewChange,
    onEquipmentClick,
    onEditUser,
}) => {
    const {
        users,
        equipment,
        events,
        approvals,
        updateUser,
        deleteUser,
        rbacRoles,
        rbacGroups,
        getEffectiveAccessForUser,
    } = useData();
    const { permissions, user: currentUser } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const [sheet, setSheet] = useState<null | 'note' | 'suspend' | 'departure' | 'restitution'>(
        null,
    );
    const [noteDraft, setNoteDraft] = useState('');
    const [reasonDraft, setReasonDraft] = useState('');
    const [departureDraft, setDepartureDraft] = useState('');
    const [showAllHistory, setShowAllHistory] = useState(false);
    // Les faits d'authentification (PIN, mot de passe) vivent dans authService, pas dans le store.
    const [authUser, setAuthUser] = useState<AppUser | null | undefined>(undefined);

    const user = users.find((u) => u.id === userId);

    // L'appel ne se relance que si l'identité change — pas à chaque nouvel objet `user`
    // produit par le store. Les deux clés sont donc extraites avant l'effet.
    const authKeyId = user?.id;
    const authKeyEmail = user?.email;

    useEffect(() => {
        let cancelled = false;
        setAuthUser(undefined);
        if (!authKeyId || !authKeyEmail) return;
        authService
            .getAllUsers()
            .then((list) => {
                if (cancelled) return;
                const found =
                    list.find((a) => a.id === authKeyId) ||
                    list.find(
                        (a) => a.MicrosoftEmail?.toLowerCase() === authKeyEmail.toLowerCase(),
                    );
                setAuthUser(found ?? null);
            })
            .catch(() => !cancelled && setAuthUser(null));
        return () => {
            cancelled = true;
        };
    }, [authKeyId, authKeyEmail]);

    const userEquipment = useMemo<Equipment[]>(() => {
        if (!user) return [];
        return equipment.filter(
            (item) =>
                item.user?.id === user.id ||
                (!!item.user?.email && item.user.email === user.email) ||
                item.user?.name === user.name,
        );
    }, [equipment, user]);

    // Demandes en cours : bénéficiaire ou demandeur, statut actif de la machine à états.
    const userApprovals = useMemo(() => {
        if (!user) return [];
        return approvals.filter(
            (a) =>
                (a.beneficiaryId === user.id || a.requesterId === user.id) &&
                ACTIVE_APPROVAL_STATUSES.includes(a.status),
        );
    }, [approvals, user]);

    // L'historique réel : mouvements d'objets où la personne figure, événements sur son compte.
    const userEvents = useMemo(() => {
        if (!user) return [];
        const norm = user.name.trim().toLowerCase();
        const nameMatches = (v: unknown) =>
            typeof v === 'string' && v.trim().toLowerCase() === norm;
        return events
            .filter((evt) => {
                if (evt.targetType === 'USER') return evt.targetId === user.id;
                if (evt.targetType !== 'EQUIPMENT') return false;
                const m = evt.metadata ?? {};
                if (m.holderId === user.id) return true;
                if (m.beneficiaryId === user.id || m.previousUserId === user.id) return true;
                if (!isEquipmentMovementEvent(evt)) return false;
                return nameMatches(m.beneficiaryName) || nameMatches(m.previousUser);
            })
            .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    }, [events, user]);

    /**
     * « Ses accès » (planche 05.2, carte 4) — le rôle, les groupes, et ce que ça donne
     * une fois résolu. Lu dans le moteur RBAC pour **cette** personne, pas pour celle
     * qui regarde.
     */
    const access = useMemo(() => {
        if (!user) return null;
        const profile = getEffectiveAccessForUser(user.id);
        if (!profile) return null;
        const roles = profile.roleIds
            .map((id) => rbacRoles.find((r) => r.id === id)?.name)
            .filter(Boolean) as string[];
        const groups = profile.groupIds
            .map((id) => rbacGroups.find((g) => g.id === id)?.name)
            .filter(Boolean) as string[];
        const grantedKeys = Object.entries(profile.permissions)
            .filter(([, decision]) => Boolean(decision))
            .map(([key]) => key);
        /* La planche distingue deux comptes : les **permissions** accordées et les
           **ressources** qu'elles ouvrent. Une ressource est une **page** — c'est ce
           que 11.1 range « une page par rangée ». Les clés `action.*` ne comptent pas :
           elles disent ce qu'on fait, pas où l'on entre. */
        const resources = grantedKeys.filter(
            (key) =>
                key.startsWith('view.') &&
                /* `view.approvals` survit dans `AppViewKey` alors que la section a été
                   fusionnée dans Tâches — routeur et fichier compris. La compter
                   donnerait une page de plus que ce qui existe (la planche en dit 9,
                   le moteur en rend 10). Résidu à retirer du modèle RBAC. */
                key !== 'view.approvals',
        ).length;
        /* Un périmètre `global` n'est pas un périmètre borné : c'est tout le parc.
           Le compter comme une borne faisait lire « périmètre borné » à un SuperAdmin. */
        const levels = profile.dataScopes.map((scope) => scope.level);
        const global = levels.length === 0 || levels.includes('global');
        return {
            roleLabel: roles.length ? roles.join(' · ') : getStatusLabel(user.role),
            groups,
            granted: grantedKeys.length,
            resources,
            scope: global ? 'tout le parc' : SCOPE_LABEL[levels[0]] || 'périmètre borné',
            reach: global ? 'contrôle total partout' : SCOPE_LABEL[levels[0]] || 'périmètre borné',
        };
    }, [user, rbacRoles, rbacGroups, getEffectiveAccessForUser]);

    const activeSuperAdminCount = useMemo(
        () => users.filter((u) => u.role === 'SuperAdmin' && u.status !== 'inactive').length,
        [users],
    );

    if (!user) {
        return (
            <div className="p-6">
                <ScreenState
                    icon={User}
                    title="Utilisateur introuvable"
                    description="Cette personne n'existe plus ou a été retirée."
                    actions={
                        <Button variant="filled" onClick={onBack}>
                            Retour à l'équipe
                        </Button>
                    }
                />
            </div>
        );
    }

    const go = (hash: string) => {
        window.location.hash = hash;
    };

    const isSelf = currentUser?.id === user.id;
    const isSuspended = user.status === 'inactive';
    const isInvited = user.status === 'pending';
    const held = userEquipment.length;
    const heldLabel = `${held} équipement${held > 1 ? 's' : ''}`;
    const hasActiveApprovals = userApprovals.length > 0;
    const departure = formatDate(user.departureDate);
    const departureShort = formatShortDate(user.departureDate);
    const canDelete =
        permissions.canManageUsers && !isSelf && held === 0 && !hasActiveApprovals;
    const firstName = user.name.split(' ')[0];
    const initials = user.name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const writeUser = (updates: Parameters<typeof updateUser>[1], ok: string) => {
        const decision = updateUser(user.id, updates);
        if (!decision.allowed) {
            showToast(decision.reason || 'Écriture refusée.', 'error');
            return false;
        }
        showToast(ok, 'success');
        if (isDemoSeedUser(user.id)) showToast(DEMO_RESEED_NOTICE, 'info');
        return true;
    };

    // --- Actes ---------------------------------------------------------------

    const openSuspend = () => {
        if (hasActiveApprovals) {
            // La règle du store (canUpdateUserByBusinessRule) refuse : on le dit avant le tap.
            requestConfirmation({
                title: `Suspension bloquée pour ${user.name}`,
                message: (
                    <p>
                        Une demande est en cours à son nom. La règle refuse de suspendre tant
                        qu'elle n'est pas arbitrée — acceptée, refusée ou annulée dans la file.
                    </p>
                ),
                confirmText: 'Voir la demande',
                tone: 'neutral',
                onConfirm: () => onViewChange?.('tasks'),
            });
            return;
        }
        setReasonDraft('');
        setSheet('suspend');
    };

    const confirmSuspend = () => {
        const ok = writeUser(
            {
                status: 'inactive',
                suspendedAt: new Date().toISOString(),
                suspendedBy: currentUser?.name || 'Gestionnaire',
                suspensionReason: reasonDraft.trim() || undefined,
            },
            held > 0
                ? `Compte suspendu. ${heldLabel} signalé${held > 1 ? 's' : ''} à récupérer.`
                : 'Compte suspendu.',
        );
        if (ok) {
            setSheet(null);
            authService.setUserStatus(user.id, 'inactive').catch(() => undefined);
        }
    };

    const handleReactivate = () => {
        requestConfirmation({
            title: `Réactiver le compte de ${user.name} ?`,
            message: `${user.name} pourra se reconnecter immédiatement.${
                held > 0 ? ` Le signal « à récupérer » sur ${heldLabel} est levé.` : ''
            }`,
            confirmText: 'Réactiver',
            tone: 'neutral',
            onConfirm: () => {
                const ok = writeUser(
                    {
                        status: 'active',
                        suspendedAt: undefined,
                        suspendedBy: undefined,
                        suspensionReason: undefined,
                    },
                    'Compte réactivé.',
                );
                if (ok) authService.setUserStatus(user.id, 'active').catch(() => undefined);
            },
        });
    };

    const openDeparture = () => {
        setDepartureDraft(toDateInputValue(user.departureDate));
        setSheet('departure');
    };

    const saveDeparture = () => {
        if (!departureDraft) return;
        const iso = new Date(`${departureDraft}T00:00:00`).toISOString();
        const label = formatDate(iso);
        if (
            writeUser(
                { departureDate: iso },
                held > 0
                    ? `Départ fixé au ${label}. ${heldLabel} à récupérer avant.`
                    : `Départ fixé au ${label}.`,
            )
        )
            setSheet(null);
    };

    const removeDeparture = () => {
        if (writeUser({ departureDate: undefined }, 'Date de départ retirée.')) setSheet(null);
    };

    const openNote = () => {
        setNoteDraft(user.managerNote?.text ?? '');
        setSheet('note');
    };

    const saveNote = () => {
        const text = noteDraft.trim();
        if (!text) return;
        if (
            writeUser(
                {
                    managerNote: {
                        text,
                        authorId: currentUser?.id || 'system',
                        authorName: currentUser?.name || 'Gestionnaire',
                        updatedAt: new Date().toISOString(),
                    },
                },
                'Note enregistrée.',
            )
        )
            setSheet(null);
    };

    const deleteNote = () => {
        if (writeUser({ managerNote: undefined }, 'Note supprimée.')) setSheet(null);
    };

    const handleResetPin = () => {
        requestConfirmation({
            title: `Réinitialiser le code PIN de ${user.name} ?`,
            message: `Son code actuel cesse de fonctionner immédiatement. Jusqu'à ce qu'elle en redéfinisse un, ses réceptions passeront par signature.`,
            confirmText: 'Réinitialiser le code',
            tone: 'neutral',
            onConfirm: async () => {
                try {
                    const res = await authService.resetUserPin(user.id);
                    showToast(`Code PIN temporaire : ${res.temporaryPin}`, 'success');
                    setAuthUser((prev) => (prev ? { ...prev, PinStatus: 'pending' } : prev));
                } catch {
                    showToast('La réinitialisation du code a échoué.', 'error');
                }
            },
        });
    };

    const handleResetPassword = () => {
        requestConfirmation({
            title: `Réinitialiser le mot de passe de ${user.name} ?`,
            message: `Un mot de passe temporaire est généré et s'affiche une fois. ${firstName} devra le changer à sa prochaine connexion.`,
            confirmText: 'Générer le mot de passe',
            tone: 'neutral',
            onConfirm: async () => {
                try {
                    const res = await authService.resetUserPassword(user.id);
                    showToast(`Mot de passe temporaire : ${res.temporaryPassword}`, 'success');
                    setAuthUser(res.user);
                } catch {
                    showToast('La réinitialisation du mot de passe a échoué.', 'error');
                }
            },
        });
    };

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
                    L'accès est coupé et l'adresse redevient libre. Les attestations signées et
                    l'historique des objets restent lisibles sur leur fiche.
                </p>
            ),
            confirmText: 'Supprimer définitivement',
            tone: 'destructive',
            irreversible: true,
            onConfirm: () => {
                const decision = deleteUser(user.id);
                if (decision.allowed) {
                    showToast('Compte utilisateur supprimé.', 'success');
                    if (isDemoSeedUser(user.id)) showToast(DEMO_RESEED_NOTICE, 'info');
                    onBack();
                } else {
                    showToast(decision.reason || 'Suppression impossible.', 'error');
                }
            },
        });
    };

    const openRestitution = () => {
        if (held === 1) {
            go(`/wizards/return?equipmentId=${encodeURIComponent(userEquipment[0].id)}`);
            return;
        }
        setSheet('restitution');
    };

    // --- Héro ----------------------------------------------------------------

    const suspendedAt = formatDate(user.suspendedAt);
    const accountStatus = isSuspended
        ? {
              icon: Prohibit,
              tone: 'attention' as const,
              label: suspendedAt
                  ? `Suspendu le ${suspendedAt}${user.suspendedBy ? ` · par ${user.suspendedBy}` : ''}`
                  : 'Compte suspendu',
          }
        : isInvited
          ? { icon: Clock, tone: 'pending' as const, label: 'Invité · mot de passe à définir' }
          : { icon: CheckCircle, tone: 'positive' as const, label: 'Compte actif' };

    const lastLogin = formatShortDate(user.lastLogin);

    const roleLabel = `${getStatusLabel(user.role)} · ${user.department || user.site || '—'}`;

    // `Button` n'a pas de prop `fullWidth` dans ce DS : la pleine largeur passe par la
    // classe, comme sur la fiche équipement (04.2). Sans cela React reversait `fullWidth`
    // sur le <button> du DOM et le signalait à chaque rendu.
    const primaryButtonClass =
        'w-full !bg-primary hover:!bg-primary-hover !rounded-md !text-[var(--tk-color-brand-text)] !shadow-none';

    const heroAction = isSuspended ? (
        <Button variant="filled" onClick={handleReactivate} className={primaryButtonClass}>
            <Icon glyph={ArrowCounterClockwise} size={18} />
            Réactiver le compte
        </Button>
    ) : departure && held > 0 ? (
        <Button variant="filled" onClick={openRestitution} className={primaryButtonClass}>
            <Icon glyph={SignOut} size={18} />
            Organiser la restitution
        </Button>
    ) : (
        <Button
            variant="filled"
            onClick={() => go(`/wizards/assignment?userId=${encodeURIComponent(user.id)}`)}
            className={primaryButtonClass}
        >
            <Icon glyph={Plus} size={18} />
            Attribuer un équipement
        </Button>
    );

    const heroNote =
        isSuspended && held > 0 ? (
            <p className="text-body-small text-on-nav-surface-variant">
                {user.suspensionReason ? `Motif : ${user.suspensionReason}. ` : ''}
                <strong className="text-inverse-on-surface font-medium">
                    {heldLabel} reste{held > 1 ? 'nt' : ''} à son nom et {held > 1 ? 'sont' : 'est'}{' '}
                    signalé{held > 1 ? 's' : ''}
                </strong>{' '}
                : une suspension coupe l'accès, elle ne rend pas le matériel.
            </p>
        ) : isSuspended && user.suspensionReason ? (
            <p className="text-body-small text-on-nav-surface-variant">
                Motif : {user.suspensionReason}.
            </p>
        ) : departure && held > 0 ? (
            <p className="text-body-small text-on-nav-surface-variant">
                {heldLabel} {held > 1 ? 'doivent' : 'doit'} être récupéré{held > 1 ? 's' : ''} avant
                le {departureShort}, sinon {held > 1 ? 'ils resteront attribués' : 'il restera attribué'}{' '}
                à un compte fermé.
            </p>
        ) : undefined;

    // --- Menu : lu dans la donnée du compte ------------------------------------

    const menuItems = [
        { id: 'edit', label: 'Modifier la fiche', onSelect: () => onEditUser?.(user.id) },
        {
            id: 'note',
            label: user.managerNote ? 'Modifier la note' : 'Ajouter une note',
            onSelect: openNote,
        },
        ...(authUser && authUser.PinStatus !== 'not_set'
            ? [
                  {
                      id: 'reset-pin',
                      label: 'Réinitialiser le code PIN',
                      description: 'Ses prochaines réceptions passeront par signature.',
                      dividerBefore: true,
                      onSelect: handleResetPin,
                  },
              ]
            : []),
        ...(authUser
            ? [
                  {
                      id: 'reset-password',
                      label: 'Réinitialiser le mot de passe',
                      description: 'Un mot de passe temporaire est généré.',
                      dividerBefore: !(authUser.PinStatus !== 'not_set'),
                      onSelect: handleResetPassword,
                  },
              ]
            : []),
        {
            id: 'departure',
            label: departure ? 'Modifier la date de départ' : 'Fixer une date de départ',
            description: departure ? `Fixée au ${departure}.` : 'Indépendante de la suspension.',
            dividerBefore: !authUser,
            onSelect: openDeparture,
        },
        ...(held > 0
            ? [
                  {
                      id: 'restitution',
                      label: 'Organiser la restitution',
                      description: `${held} objet${held > 1 ? 's' : ''} à récupérer.`,
                      onSelect: openRestitution,
                  },
              ]
            : []),
        ...(!isSelf
            ? [
                  isSuspended
                      ? {
                            id: 'toggle-status',
                            label: 'Réactiver le compte',
                            description:
                                held > 0
                                    ? 'Rétablit l’accès et lève le signal sur ses objets.'
                                    : 'Rétablit l’accès.',
                            dividerBefore: true,
                            onSelect: handleReactivate,
                        }
                      : {
                            id: 'toggle-status',
                            label: 'Suspendre le compte',
                            description: hasActiveApprovals
                                ? 'Bloqué : une demande est en cours à son nom.'
                                : held > 0
                                  ? 'L’accès est coupé ; ce qu’elle détient est signalé.'
                                  : 'L’accès est coupé, rien d’autre.',
                            dividerBefore: true,
                            onSelect: openSuspend,
                        },
              ]
            : []),
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

    // --- Rangées -----------------------------------------------------------------

    const rowClass =
        'border-outline-variant hover:bg-surface-container flex min-h-[56px] w-full cursor-pointer items-center gap-3 border-t px-4 py-2.5 text-left transition-colors';

    const alertLabel = (item: Equipment): string | null => {
        const alert = item.holderAlert;
        const kind =
            alert?.kind ?? (isSuspended ? 'suspended' : departure ? 'departure' : null);
        if (!kind) return null;
        const inHand = item.user ? true : false;
        const verb = inHand ? 'À récupérer' : 'À réattribuer';
        if (kind === 'suspended') return `${verb} — porteur suspendu`;
        const until = formatShortDate(alert?.until ?? user.departureDate);
        return until ? `${verb} avant le ${until}` : verb;
    };

    const visibleEvents = showAllHistory ? userEvents : userEvents.slice(0, 3);

    const pinValue = authUser === undefined ? '…' : authUser ? PIN_LABEL[authUser.PinStatus ?? 'not_set'] : '—';
    const passwordValue =
        authUser === undefined
            ? '…'
            : authUser
              ? authUser.MustChangePassword
                  ? 'Temporaire, à changer'
                  : 'Défini'
              : '—';

    return (
        <DetailTemplate
            code={user.name}
            reference={roleLabel}
            onBack={onBack}
            menu={
                <Menu
                    align="end"
                    items={menuItems}
                    trigger={
                        <Button variant="text" iconOnly aria-label="Options de la personne">
                            <Icon glyph={DotsThreeVertical} />
                        </Button>
                    }
                />
            }
            hero={
                <DetailHero
                    avatar={initials}
                    label={roleLabel}
                    subject={user.name}
                    status={accountStatus}
                    statusDetail={
                        departure ? (
                            <span className="inline-flex items-center gap-1.5">
                                <Icon glyph={SignOut} size={16} className="text-[var(--tk-color-live-ambre)]" />
                                Départ le {departure}
                            </span>
                        ) : undefined
                    }
                    actions={heroAction}
                    note={heroNote}
                    className={isSuspended ? '!bg-surface-container-highest !text-on-surface' : undefined}
                />
            }
            aside={
                <>
                    {/* Les deux tuiles de la passe sobre : elles remplacent les trois
                        métriques qui vivaient dans le héro. Deux au plus, jamais trois. */}
                    <TintedTileRow>
                        <TintedTile
                            tone="bleu"
                            glyph={Laptop}
                            value={held}
                            label={held > 1 ? 'objets détenus' : 'objet détenu'}
                        />
                        <TintedTile
                            tone="ambre"
                            glyph={Bell}
                            value={userApprovals.length}
                            label={userApprovals.length > 1 ? 'demandes en cours' : 'demande en cours'}
                            onClick={
                                userApprovals.length > 0 ? () => onViewChange?.('tasks') : undefined
                            }
                        />
                    </TintedTileRow>

                    <RuleGroup header="Équipements détenus">
                        {held > 0 ? (
                            <div>
                                {userEquipment.map((item) => {
                                    const EqIcon = getEquipmentIcon(item.type);
                                    const since = formatDate(item.confirmedAt || item.assignedAt);
                                    const alert = alertLabel(item);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => onEquipmentClick?.(item.id)}
                                            className={rowClass}
                                        >
                                            <span className="rounded-vignette bg-surface-container text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center">
                                                <Icon glyph={EqIcon} size={20} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-label-large text-on-surface truncate font-medium">
                                                    {item.assetId || item.name}
                                                </p>
                                                <p className="text-body-small text-text-secondary mt-px truncate">
                                                    {item.type || item.model || 'Équipement'}
                                                </p>
                                                {alert && (
                                                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 font-medium text-[var(--tk-color-on-tint-ambre)]">
                                                        <span className="h-[7px] w-[7px] shrink-0 rounded-[2px] bg-[var(--tk-color-live-ambre)]" />
                                                        {alert}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={
                                                    since
                                                        ? 'text-body-medium text-on-surface shrink-0 font-medium tabular-nums'
                                                        : 'text-body-medium text-text-muted shrink-0'
                                                }
                                            >
                                                {since ?? '—'}
                                            </span>
                                            <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-body-medium text-text-muted px-4 py-3">
                                Aucun équipement à son nom.
                            </div>
                        )}
                        {userApprovals.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => onViewChange?.('tasks')}
                                className={rowClass}
                            >
                                <Icon glyph={Bell} size={20} className="shrink-0 text-[var(--tk-color-st-ambre)]" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-large text-on-surface truncate font-medium">
                                        {a.beneficiaryId === user.id ? 'Sa demande' : 'Demande déposée'} ·{' '}
                                        {a.equipmentCategory}
                                    </p>
                                    <p className="text-body-small text-text-secondary mt-px truncate">
                                        {getStatusLabel(a.status)} · dans les Tâches
                                    </p>
                                </div>
                                <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                            </button>
                        ))}
                    </RuleGroup>

                    {user.managerNote && (
                        <RuleGroup
                            header="Note"
                            headerTrailing={`${user.managerNote.authorName} · ${formatDate(user.managerNote.updatedAt) ?? ''}`}
                            note="Visible par les gestionnaires uniquement."
                        >
                            <button type="button" onClick={openNote} className="w-full px-4 py-2.5 text-left">
                                <p className="text-label-large text-on-surface whitespace-pre-wrap font-normal">
                                    {user.managerNote.text}
                                </p>
                            </button>
                        </RuleGroup>
                    )}
                </>
            }
        >
            {/* Une seule carte « Compte » : l'adresse, le téléphone, le code, le dernier
                accès. La planche du 03/09 a replié « Coordonnées » dedans — deux cartes
                pour quatre rangées disaient deux fois le même sujet. */}
            <RuleGroup header="Compte">
                <RuleGroup.Row title={user.email} subtitle="Adresse de l'annuaire" />
                {user.phone && <RuleGroup.Row title={user.phone} subtitle="Mobile professionnel" />}
                <RuleGroup.Row
                    title="Mot de passe"
                    subtitle="Réinitialisable par un gestionnaire"
                    value={passwordValue}
                    valueTone={authUser?.MustChangePassword ? 'pending' : undefined}
                />
                <RuleGroup.Row
                    title="Code PIN"
                    subtitle="Sert à signer une réception sans e-mail"
                    value={pinValue}
                    valueTone={authUser && authUser.PinStatus === 'pending' ? 'pending' : undefined}
                />
                <RuleGroup.Row
                    title="Dernier accès"
                    value={lastLogin ?? 'Jamais connecté'}
                    valueTone={lastLogin ? undefined : 'pending'}
                />
            </RuleGroup>

            {/* « Ses accès » — le rôle, les groupes, et ce que ça donne résolu. La
                planche renvoie chaque rangée vers 11.1, qui détient le détail. */}
            {access && (
                <RuleGroup header="Ses accès">
                    <RuleGroup.Row
                        title={access.roleLabel}
                        subtitle={`rôle · ${access.granted} permission${access.granted > 1 ? 's' : ''}, ${access.scope}`}
                        onOpen={() => onViewChange?.('rbac')}
                        external
                    />
                    <RuleGroup.Row
                        title={
                            access.groups.length ? access.groups.join(' · ') : 'Aucun groupe'
                        }
                        subtitle="un groupe borne un rôle à un pays ou un service"
                        onOpen={() => onViewChange?.('rbac')}
                        external
                    />
                    <RuleGroup.Row
                        title="Accès effectifs"
                        subtitle={`${access.resources} ressource${access.resources > 1 ? 's' : ''} · ${access.reach}`}
                        onOpen={() => onViewChange?.('rbac')}
                        external
                    />
                </RuleGroup>
            )}

            <RuleGroup
                header="Historique"
                headerTrailing={
                    userEvents.length > 0
                        ? `${userEvents.length} mouvement${userEvents.length > 1 ? 's' : ''}`
                        : undefined
                }
            >
                <div>
                    {userEvents.length === 0 && (
                        <p className="text-body-medium text-text-secondary px-4 pt-3.5 pb-4">
                            <strong className="text-on-surface font-medium">Aucun mouvement enregistré</strong>{' '}
                            pour {firstName}. Le journal n'a ni attribution, ni retour, ni changement de
                            compte à son nom.
                        </p>
                    )}
                    {visibleEvents.map((evt, i) => {
                        const EvIcon = historyIcon(evt);
                        const when = formatDate(evt.timestamp);
                        return (
                            <div
                                key={evt.id}
                                className={`flex min-h-[56px] items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-outline-variant border-t' : ''}`}
                            >
                                <span className="bg-surface-container text-text-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                    <Icon glyph={EvIcon} size={18} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-label-large text-on-surface truncate">{evt.description}</p>
                                    <p className="text-body-small text-text-secondary mt-px tabular-nums">
                                        {when ?? '—'}
                                        {evt.actorName && !evt.isSystem ? ` · ${evt.actorName}` : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {userEvents.length > 3 && (
                        <button
                            type="button"
                            onClick={() => setShowAllHistory((v) => !v)}
                            className={rowClass}
                        >
                            <Icon glyph={ClockCounterClockwise} size={20} className="text-text-secondary shrink-0" />
                            <p className="text-label-large text-on-surface min-w-0 flex-1 font-medium">
                                {showAllHistory
                                    ? 'Replier'
                                    : `Voir les ${userEvents.length} mouvements de ${firstName}`}
                            </p>
                        </button>
                    )}
                    {userEvents.length === 0 && (
                        <button type="button" onClick={() => onViewChange?.('audit')} className={rowClass}>
                            <Icon glyph={ClockCounterClockwise} size={20} className="text-text-secondary shrink-0" />
                            <p className="text-label-large text-on-surface min-w-0 flex-1 font-medium">
                                Ouvrir l'Audit
                            </p>
                            <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                        </button>
                    )}
                </div>
            </RuleGroup>

            {/* Feuille — note */}
            <BottomSheet
                open={sheet === 'note'}
                onClose={() => setSheet(null)}
                title={user.managerNote ? 'Modifier la note' : 'Ajouter une note'}
            >
                <div className="space-y-4 px-1 pb-4">
                    <p className="text-body-medium text-text-secondary">
                        {user.name} · visible par les gestionnaires.
                    </p>
                    <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Ex : en attente d'un poste fixe pour le bureau du 2ᵉ."
                        rows={4}
                        className="border-outline bg-surface text-label-large text-on-surface focus:border-primary w-full rounded-md border p-3 focus:outline-hidden"
                    />
                    {user.managerNote && (
                        <p className="text-body-small text-text-muted">
                            Dernière écriture : {user.managerNote.authorName} ·{' '}
                            {formatDate(user.managerNote.updatedAt)}. L'enregistrement remplace l'auteur
                            et la date par les vôtres.
                        </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                        {user.managerNote ? (
                            <Button variant="text" onClick={deleteNote} className="!text-error">
                                Supprimer la note
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button variant="text" onClick={() => setSheet(null)}>
                                Annuler
                            </Button>
                            <Button variant="filled" onClick={saveNote} disabled={!noteDraft.trim()}>
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            {/* Feuille — suspendre */}
            <BottomSheet open={sheet === 'suspend'} onClose={() => setSheet(null)} title="Suspendre le compte">
                <div className="space-y-3 px-1 pb-4">
                    <p className="text-body-medium text-text-secondary">{user.name}</p>
                    <p className="flex items-center gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-3 py-2.5 text-[12px] leading-4 font-medium text-[var(--tk-color-on-tint-ambre)]">
                        <Icon glyph={ArrowCounterClockwise} size={18} />
                        Réversible — « Réactiver le compte » redevient le geste primaire de la fiche.
                    </p>
                    <ul className="bg-surface-container text-body-medium text-text-secondary space-y-2 rounded-md px-3.5 py-3">
                        <li>L'accès est coupé <strong className="text-on-surface font-medium">immédiatement</strong>.</li>
                        <li>Le nom <strong className="text-on-surface font-medium">disparaît des sélecteurs d'attribution</strong>.</li>
                        {held > 0 && (
                            <li>
                                {heldLabel}{' '}
                                <strong className="text-on-surface font-medium">
                                    reste{held > 1 ? 'nt' : ''} à son nom et {held > 1 ? 'sont' : 'est'} signalé{held > 1 ? 's' : ''} « à récupérer »
                                </strong>
                                , ici et sur {held > 1 ? 'leur' : 'sa'} fiche.
                            </li>
                        )}
                    </ul>
                    <label className="block">
                        <span className="text-text-muted mb-1 block text-[11px] font-medium tracking-[0.06em] uppercase">
                            Motif <span className="text-text-secondary font-normal tracking-normal normal-case">— optionnel, écrit au journal</span>
                        </span>
                        <input
                            value={reasonDraft}
                            onChange={(e) => setReasonDraft(e.target.value)}
                            placeholder="Congé sabbatique, départ en cours…"
                            className="border-outline bg-surface text-label-large text-on-surface focus:border-primary w-full rounded-md border px-3 py-2.5 focus:outline-hidden"
                        />
                    </label>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="text" onClick={() => setSheet(null)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={confirmSuspend}>
                            Suspendre le compte
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Feuille — date de départ */}
            <BottomSheet open={sheet === 'departure'} onClose={() => setSheet(null)} title="Date de départ">
                <div className="space-y-3 px-1 pb-4">
                    <p className="text-body-medium text-text-secondary">{user.name}</p>
                    <p className="flex items-center gap-2 rounded-md bg-[var(--tk-color-tint-bleu)] px-3 py-2.5 text-[12px] leading-4 font-medium text-[var(--tk-color-on-tint-bleu)]">
                        <Icon glyph={SignOut} size={18} />
                        Rien n'est coupé — son accès reste ouvert jusqu'au dernier jour.
                    </p>
                    <label className="block">
                        <span className="text-text-muted mb-1 block text-[11px] font-medium tracking-[0.06em] uppercase">
                            Dernier jour
                        </span>
                        <input
                            type="date"
                            value={departureDraft}
                            onChange={(e) => setDepartureDraft(e.target.value)}
                            className="border-outline bg-surface text-label-large text-on-surface focus:border-primary w-full rounded-md border px-3 py-2.5 tabular-nums focus:outline-hidden"
                        />
                    </label>
                    {held > 0 && (
                        <ul className="bg-surface-container text-body-medium text-text-secondary space-y-2 rounded-md px-3.5 py-3">
                            <li>
                                {heldLabel}{' '}
                                <strong className="text-on-surface font-medium">
                                    {held > 1 ? 'sont signalés' : 'est signalé'} « à récupérer avant cette date »
                                </strong>
                                , ici et sur {held > 1 ? 'leur' : 'sa'} fiche.
                            </li>
                            <li>
                                « <strong className="text-on-surface font-medium">Organiser la restitution</strong> » devient le geste primaire.
                            </li>
                        </ul>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-1">
                        {user.departureDate ? (
                            <Button variant="text" onClick={removeDeparture}>
                                Retirer la date
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button variant="text" onClick={() => setSheet(null)}>
                                Annuler
                            </Button>
                            <Button variant="filled" onClick={saveDeparture} disabled={!departureDraft}>
                                Enregistrer la date
                            </Button>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            {/* Feuille — organiser la restitution : la liste de ce qui reste, un assistant par objet */}
            <BottomSheet open={sheet === 'restitution'} onClose={() => setSheet(null)} title="Organiser la restitution">
                <div className="space-y-3 px-1 pb-4">
                    <p className="text-body-medium text-text-secondary">
                        {heldLabel} à récupérer{departure ? ` avant le ${departure}` : ''}.
                    </p>
                    <div>
                        {userEquipment.map((item, i) => {
                            const EqIcon = getEquipmentIcon(item.type);
                            const since = formatDate(item.confirmedAt || item.assignedAt);
                            return (
                                <div
                                    key={item.id}
                                    className={`flex min-h-[60px] items-center gap-3 py-2 ${i > 0 ? 'border-outline-variant border-t' : ''}`}
                                >
                                    <span className="rounded-vignette bg-surface-container text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center">
                                        <Icon glyph={EqIcon} size={20} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-label-large text-on-surface truncate font-medium">
                                            {item.assetId || item.name}
                                        </p>
                                        <p className="text-body-small text-text-secondary mt-px truncate">
                                            {item.type || item.model || 'Équipement'}
                                            {since ? ` · depuis le ${since}` : ''}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setSheet(null);
                                            go(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`);
                                        }}
                                    >
                                        Restituer
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-body-small text-text-muted">
                        Chaque restitution passe par l'assistant : état constaté, attestation. Rien ne se
                        rend depuis cette liste.
                    </p>
                    <div className="flex justify-end">
                        <Button variant="text" onClick={() => setSheet(null)}>
                            Fermer
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </DetailTemplate>
    );
};

export default UserDetailsPage;
