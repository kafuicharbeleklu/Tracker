import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowElbowDownRight,
    ArrowLeft,
    Briefcase,
    Crosshair,
    Eye,
    Flag,
    GlobeHemisphereWest,
    Lightning,
    LockSimpleOpen,
    Plus,
    Prohibit,
    ShieldCheck,
    ShieldPlus,
    SortAscending,
    User as UserGlyph,
    Users,
    UsersThree,
    Warning,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Toggle from '../../../components/ui/Toggle';
import Notice from '../../../components/ui/Notice';
import RuleGroup from '../../../components/ui/RuleGroup';
import ScreenState from '../../../components/ui/ScreenState';
import SearchField from '../../../components/ui/SearchField';
import FacetChip from '../../../components/ui/FacetChip';
import BottomSheet from '../../../components/ui/BottomSheet';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import DetailHero from '../../../components/ui/DetailHero';
import { useRouter } from '../../../hooks/useRouter';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { DESTINATIONS } from '../../../constants/destinations';
import { RBAC_PERMISSIONS, SYSTEM_ROLE_ID_BY_USER_ROLE } from '../../../config/rbacDefaults';
import type {
    AppViewKey,
    PermissionAccessLevel,
    PermissionKey,
    PermissionRule,
    RbacGroup,
    RbacRole,
    ScopeLevel,
} from '../../../types/rbac';
import { cn } from '../../../lib/utils';

/**
 * Rôles et accès — **porté sur la planche 11.1**.
 *
 * ## La correction de prémisse qui commande l'écran
 *
 * Le relevé du 28/07 disait que l'application ne consommait qu'un booléen et que
 * redessiner la matrice serait redessiner une promesse creuse. **Le code dit le
 * contraire** : `useAccessControl` dérive dix-sept droits de `RBAC_PERMISSIONS`, et
 * `rbacDefaults` déclare **24 clés** — dix vues, quatorze actions — consommées par
 * les quatre surfaces de navigation, le tableau de bord, les six pages de
 * fonctionnalité et les gardes de mutation. La matrice n'est pas une promesse :
 * c'est le moteur.
 *
 * ## Trois faits que le code porte et que l'écran ne montrait pas
 *
 * - **Le niveau d'accès.** Une permission n'est pas un oui/non mais **lecture,
 *   écriture ou suppression**. SuperAdmin et Admin ont les mêmes quatorze actions ;
 *   le premier les a toutes en suppression, le second sur trois seulement.
 * - **Le refus explicite.** `deny` existe, et deux rôles l'utilisent. Un droit
 *   **absent** peut être accordé demain par un groupe ; un droit **refusé** gagne
 *   contre tout ce qui l'accorderait. C'est un troisième état, pas un interrupteur
 *   éteint — d'où l'absence de bascule sur ces rangées.
 * - **La portée de données**, et c'est ici que l'écart déclaré/appliqué est total.
 *   Les huit rôles portent chacun un `dataScope`, trois groupes sur cinq y ajoutent
 *   le leur — onze en tout. `resolveEffectiveAccess` les rassemble dans
 *   `effectiveAccess.dataScopes`… **que personne ne lit**. Le filtrage ligne à ligne
 *   décide sur `currentUser.role`, quatre noms en dur.
 *
 * **Ranger les rôles par portée déclarée est ce qui rend cet écart visible**, au lieu
 * de le laisser dans un champ que personne n'ouvre. Le classement *système /
 * personnalisé* disparaît : il parle de la base, pas de la personne.
 *
 * ## Ce qui tombe
 *
 * Les **cinq cartes de compteurs** — Rôles 8, Groupes 5, Affectations 11, Workflows
 * 1, Conflits 0 — occupaient trois rangées pour ce qu'une ligne dit au-dessus d'une
 * liste ; *Conflits 0* mesurait ce qui n'arrive jamais. Les **workflows** sortent
 * (D1) : un rôle dit **qui peut**, un workflow dit **dans quel ordre**. Sur les
 * quatre états vides du panneau, **deux sont gardés** — dont un au titre faux,
 * corrigé — et **deux disparaissent** avec leur objet : « Aucun rôle sélectionné »
 * était l'attente d'un maître-détail que la fiche remplace, et « Aucun workflow »
 * appartient à l'écran qui réglera les workflows, s'il en a un.
 */

type RbacView = 'roles' | 'groups';

/** L'ordre de lecture des portées : du plus large au plus étroit, l'inexprimable en dernier. */
const SCOPE_ORDER: ScopeLevel[] = [
    'global',
    'country',
    'site',
    'team',
    'service',
    'self',
    'custom',
];

const SCOPE_LABEL: Record<ScopeLevel, string> = {
    global: 'global',
    country: 'pays',
    site: 'site',
    team: 'équipe',
    service: 'service',
    self: 'soi',
    custom: 'sur mesure',
};

const SCOPE_ICON: Record<ScopeLevel, PhosphorGlyph> = {
    global: GlobeHemisphereWest,
    country: Flag,
    site: Flag,
    team: UsersThree,
    service: Briefcase,
    self: UserGlyph,
    custom: Crosshair,
};

const ACCESS_LABEL: Record<PermissionAccessLevel, string> = {
    none: '—',
    read: 'lecture',
    write: 'écriture',
    delete: 'suppression',
};

/**
 * Le nom d'une vue vient du **registre des destinations** (audit X1), jamais d'une
 * table locale : un écran qui rebaptise « Inventaire » ce que la barre du bas appelle
 * « Actifs » apprend deux noms pour une porte.
 */
const VIEW_LABEL: Record<AppViewKey, string> = {
    dashboard: DESTINATIONS.dashboard.label,
    inventory: DESTINATIONS.equipment.label,
    finance: DESTINATIONS.finance.label,
    // `view.approvals` est une **clé de permission**, stockée dans les rôles : elle ne se
    // renomme pas sans migrer la donnée RBAC. Ce qu'elle garde, en revanche, est
    // désormais la file — la destination « Approbations » a été retirée le 20/08.
    approvals: DESTINATIONS.tasks.label,
    audit: DESTINATIONS.audit.label,
    reports: DESTINATIONS.reports.label,
    management: DESTINATIONS.management.label,
    locations: DESTINATIONS.locations.label,
    settings: DESTINATIONS.settings.label,
    users: DESTINATIONS.users.label,
};

/** Les actions portent le verbe de la planche — un acte se nomme, il ne s'abrège pas. */
const ACTION_LABEL: Record<string, string> = {
    'action.inventory.manage': 'Gérer le parc',
    'action.inventory.import': 'Importer des équipements',
    'action.inventory.export': 'Exporter le parc',
    'action.finance.manage': 'Gérer les finances',
    'action.finance.import': 'Importer des dépenses',
    'action.finance.export': 'Exporter les finances',
    'action.users.manage': 'Gérer les personnes',
    'action.audit.manage': 'Gérer les campagnes d’audit',
    'action.audit.scan': 'Scanner en audit',
    'action.reports.view': 'Consulter les rapports',
    'action.reports.export': 'Exporter les rapports',
    'action.management.manage': 'Gérer le catalogue',
    'action.locations.manage': 'Gérer les emplacements',
    'action.settings.manage': 'Gérer les paramètres',
};

const AUTH_METHOD_LABEL: Record<string, string> = {
    password: 'mot de passe',
    '2fa': 'double authentification',
    pin: 'code PIN',
    sso: 'authentification unique',
    otp: 'code à usage unique',
    biometric: 'biométrie',
};

const VIEW_KEYS = Object.values(RBAC_PERMISSIONS.views) as PermissionKey[];
const ACTION_KEYS = Object.values(RBAC_PERMISSIONS.actions) as PermissionKey[];
const TOTAL_PERMISSIONS = VIEW_KEYS.length + ACTION_KEYS.length;

const permissionLabel = (key: PermissionKey): string =>
    key.startsWith('view.')
        ? VIEW_LABEL[key.slice('view.'.length) as AppViewKey]
        : (ACTION_LABEL[key] ?? key);

const declaredScope = (role: RbacRole): ScopeLevel => role.dataScopes?.[0]?.level ?? 'custom';

const allowedRules = (role: RbacRole): PermissionRule[] =>
    role.permissions.filter((rule) => rule.effect === 'allow');

const deniedRules = (role: RbacRole): PermissionRule[] =>
    role.permissions.filter((rule) => rule.effect === 'deny');

const isView = (rule: PermissionRule) => rule.key.startsWith('view.');

/** « 5 h », « 90 min » — une durée de session se lit, elle ne se convertit pas de tête. */
const sessionLabel = (minutes: number): string =>
    minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;

/**
 * Ce que l'héritage change vraiment. Un décompte de rôle hérité **ne dit pas ce qu'il
 * porte** : *Responsable sécurité* affiche 4, porte 24, et n'ajoute rien — ses quatre
 * règles sont déjà dans celles de l'Admin. La rangée doit le dire ; la colonne de
 * droite ne peut pas.
 */
const inheritanceFact = (
    role: RbacRole,
    byId: Map<string, RbacRole>,
): { baseName: string; addsNothing: boolean } | null => {
    if (!role.baseRoleId) return null;
    const base = byId.get(role.baseRoleId);
    if (!base) return null;

    const baseIndex = new Map(base.permissions.map((rule) => [rule.key, rule]));
    const addsNothing = role.permissions.every((rule) => {
        const inherited = baseIndex.get(rule.key);
        if (!inherited) return false;
        return inherited.effect === rule.effect;
    });

    return { baseName: base.name, addsNothing };
};

/**
 * La note d'un groupe de portée — **c'est elle qui porte le fait central de 11.1**.
 *
 * Ranger les rôles par portée déclarée rend l'écart visible ; la note dit *en quoi* il
 * consiste, groupe par groupe. Sans elle, la liste montre un classement sans dire que
 * ce sur quoi elle classe n'est lu par personne.
 *
 * Chaque note est **déduite de ce que le groupe contient réellement** — jamais posée en
 * dur sur un nom de rôle, qui changerait sans que la phrase change.
 */
const scopeNote = (
    level: ScopeLevel,
    roles: RbacRole[],
    byId: Map<string, RbacRole>,
): string | null => {
    const parts: string[] = [];

    if (level === 'global') {
        parts.push(
            "Une portée globale reçoit le parc entier — mais l'Admin le reçoit aussi dès qu'aucun pays ne lui est affecté : c'est le repli de filterEquipment. Ce qui les sépare tient à managedCountries, une donnée de la personne, pas au rôle.",
        );
    }

    if (level === 'custom') {
        parts.push(
            "Une portée sur mesure est une expression nommée qu'aucun code ne sait résoudre. Les autres portées sont au moins exprimables ; celle-ci n'a même pas de forme — elle est ignorée deux fois.",
        );
    }

    const inheritsNothing = roles.filter((role) => inheritanceFact(role, byId)?.addsNothing);
    if (inheritsNothing.length > 0) {
        parts.push(
            `Le décompte d'un rôle qui hérite ne dit pas ce qu'il porte : ${inheritsNothing
                .map((role) => role.name)
                .join(
                    ', ',
                )} n'ajoute${inheritsNothing.length > 1 ? 'nt' : ''} aucun droit à sa base. La rangée le dit ; la colonne de droite ne peut pas.`,
        );
    }

    const inheritsOtherScope = roles.filter((role) => {
        if (!role.baseRoleId) return false;
        const base = byId.get(role.baseRoleId);
        if (!base) return false;
        return declaredScope(base) !== level;
    });
    if (inheritsOtherScope.length > 0) {
        parts.push(
            'Un rôle qui hérite empile sa portée sur celle de sa base : gatherDataScopes garde les deux sans les départager, et rien ne dit laquelle gagnerait — puisque rien ne les lit.',
        );
    }

    return parts.length > 0 ? parts.join(' ') : null;
};

const RbacPage: React.FC = () => {
    const { routeSegments, navigate } = useRouter();
    const isCompact = useMediaQuery(MEDIA.compact);
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const {
        users,
        rbacRoles,
        rbacGroups,
        rbacAssignments,
        upsertRbacRole,
        deleteRbacRole,
        upsertRbacGroup,
        deleteRbacGroup,
        upsertUserRbacAssignment,
    } = useData();

    const view: RbacView = routeSegments[1] === 'groups' ? 'groups' : 'roles';
    const openRoleId = routeSegments[1] === 'roles' ? routeSegments[2] : undefined;

    const [query, setQuery] = useState('');
    const [roleSheetOpen, setRoleSheetOpen] = useState(false);
    const [groupSheetOpen, setGroupSheetOpen] = useState(false);
    const [assignmentSheetOpen, setAssignmentSheetOpen] = useState(false);
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<PermissionRule[] | null>(null);

    useEffect(() => {
        if (routeSegments[0] !== 'rbac') return;
        if (!routeSegments[1]) navigate('/rbac/roles');
    }, [navigate, routeSegments]);

    const rolesById = useMemo(() => new Map(rbacRoles.map((role) => [role.id, role])), [rbacRoles]);

    const openRole = openRoleId ? rolesById.get(openRoleId) : undefined;
    const openGroup = useMemo(
        () => rbacGroups.find((group) => group.id === openGroupId) ?? null,
        [openGroupId, rbacGroups],
    );

    useEffect(() => {
        setEditing(false);
        setDraft(null);
    }, [openRoleId]);

    const filteredRoles = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return rbacRoles;
        return rbacRoles.filter(
            (role) =>
                role.name.toLowerCase().includes(needle) ||
                role.id.toLowerCase().includes(needle) ||
                role.permissions.some((rule) =>
                    permissionLabel(rule.key).toLowerCase().includes(needle),
                ),
        );
    }, [query, rbacRoles]);

    const filteredGroups = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return rbacGroups;
        return rbacGroups.filter((group) => group.name.toLowerCase().includes(needle));
    }, [query, rbacGroups]);

    /** Les rôles rangés par portée **déclarée** — le classement qui rend l'écart visible. */
    const rolesByScope = useMemo(() => {
        const buckets = new Map<ScopeLevel, RbacRole[]>();
        filteredRoles.forEach((role) => {
            const level = declaredScope(role);
            buckets.set(level, [...(buckets.get(level) ?? []), role]);
        });
        return SCOPE_ORDER.filter((level) => buckets.has(level)).map((level) => ({
            level,
            roles: buckets.get(level) as RbacRole[],
        }));
    }, [filteredRoles]);

    const customRoles = useMemo(
        () => rbacRoles.filter((role) => role.kind === 'custom'),
        [rbacRoles],
    );

    const goToRole = (roleId: string) => navigate(`/rbac/roles/${roleId}`);

    const removeRole = (role: RbacRole) => {
        requestConfirmation({
            title: `Supprimer « ${role.name} » ?`,
            message:
                'Les personnes qui le portent perdent ce qu’il accordait. Les autres rôles et groupes ne changent pas.',
            confirmText: 'Supprimer le rôle',
            tone: 'destructive',
            irreversible: true,
            onConfirm: () => {
                const decision = deleteRbacRole(role.id);
                showToast(
                    decision.allowed
                        ? `« ${role.name} » supprimé.`
                        : decision.reason || 'Suppression refusée.',
                    decision.allowed ? 'success' : 'error',
                );
                if (decision.allowed) navigate('/rbac/roles');
            },
        });
    };

    const saveDraft = () => {
        if (!openRole || !draft) return;
        const decision = upsertRbacRole({ ...openRole, permissions: draft });
        if (!decision.allowed) {
            showToast(decision.reason || 'Modification refusée.', 'error');
            return;
        }
        showToast(`« ${openRole.name} » enregistré.`, 'success');
        setEditing(false);
        setDraft(null);
    };

    /** Bascule un droit **permis**. Un refus ne se bascule pas : il se retire. */
    const toggleRule = (key: PermissionKey, next: boolean, access: PermissionAccessLevel) => {
        setDraft((current) => {
            const base = current ?? openRole?.permissions ?? [];
            const without = base.filter((rule) => rule.key !== key);
            return next ? [...without, { key, effect: 'allow', access }] : without;
        });
    };

    // ── La fiche d'un rôle ────────────────────────────────────────────────────
    if (openRole) {
        const rules = draft ?? openRole.permissions;
        const allowed = rules.filter((rule) => rule.effect === 'allow');
        const denied = rules.filter((rule) => rule.effect === 'deny');
        const openViews = allowed.filter(isView);
        const openActions = allowed.filter((rule) => !isView(rule));
        const scope = declaredScope(openRole);
        const inheritance = inheritanceFact(openRole, rolesById);
        const methods = openRole.authPolicy.requiredMethods
            .map((method) => AUTH_METHOD_LABEL[method] ?? method)
            .join(' et ');

        return (
            <div className="flex min-h-0 w-full flex-1 flex-col">
                <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-1 border-b px-2 py-1">
                    <Button
                        variant="text"
                        iconOnly
                        aria-label="Retour aux rôles"
                        onClick={() => navigate('/rbac/roles')}
                        className="shrink-0"
                    >
                        <Icon glyph={ArrowLeft} />
                    </Button>
                    <div className="min-w-0 flex-1 px-1">
                        <p className="font-brand text-on-surface truncate text-base leading-5 font-semibold tracking-tight">
                            {openRole.name}
                        </p>
                        <p className="text-label-small text-text-secondary truncate tracking-wide tabular-nums">
                            {openRole.id}
                        </p>
                    </div>
                </div>

                <div className="medium:px-page flex-1 overflow-y-auto px-5 py-4">
                    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 pb-16">
                        <DetailHero
                            label={`${openRole.kind === 'system' ? 'Rôle du système' : 'Rôle personnalisé'} · portée ${SCOPE_LABEL[scope]}`}
                            subject={openRole.name}
                            status={
                                denied.length > 0
                                    ? {
                                          icon: Prohibit,
                                          label: `Refuse ${denied.length} action${denied.length > 1 ? 's' : ''} explicitement`,
                                          tone: 'attention',
                                      }
                                    : {
                                          icon: SCOPE_ICON[scope],
                                          label: `Portée déclarée : ${SCOPE_LABEL[scope]}`,
                                          tone: 'info',
                                      }
                            }
                            metrics={[
                                { value: openViews.length, label: 'vues ouvertes' },
                                { value: openActions.length, label: 'actions permises' },
                                {
                                    value: sessionLabel(openRole.authPolicy.sessionMaxMinutes),
                                    label: 'session maximale',
                                },
                            ]}
                            note={
                                <>
                                    Connexion par <strong className="font-medium">{methods}</strong>
                                    .{' '}
                                    {openRole.authPolicy.requireStepUpForSensitiveActions
                                        ? 'Une élévation est demandée sur les actes sensibles.'
                                        : 'Aucun renforcement demandé sur les actes sensibles.'}
                                </>
                            }
                        />

                        <RuleGroup
                            header={
                                <span className="flex items-center gap-2">
                                    <Icon glyph={Eye} size={20} />
                                    Ce que le rôle peut ouvrir
                                </span>
                            }
                            headerTrailing={`${openViews.length} vue${openViews.length > 1 ? 's' : ''}`}
                            note="Les vues fermées ne sont pas listées : l'inventaire de ce qu'un rôle n'a pas est aussi long que la matrice entière."
                        >
                            {VIEW_KEYS.filter((key) =>
                                editing ? true : allowed.some((rule) => rule.key === key),
                            ).map((key) => {
                                const rule = allowed.find((entry) => entry.key === key);
                                return (
                                    <RuleGroup.Row
                                        key={key}
                                        title={permissionLabel(key)}
                                        subtitle={key}
                                        value={ACCESS_LABEL[rule?.access ?? 'none']}
                                        valueTone={rule ? undefined : 'muted'}
                                        trailing={
                                            editing ? (
                                                <Toggle
                                                    checked={Boolean(rule)}
                                                    onChange={(next) =>
                                                        toggleRule(key, next, 'read')
                                                    }
                                                />
                                            ) : undefined
                                        }
                                    />
                                );
                            })}
                        </RuleGroup>

                        <RuleGroup
                            header={
                                <span className="flex items-center gap-2">
                                    <Icon glyph={Lightning} size={20} />
                                    Ce que le rôle peut faire
                                </span>
                            }
                            headerTrailing={`${openActions.length} action${openActions.length > 1 ? 's' : ''}`}
                        >
                            {ACTION_KEYS.filter(
                                (key) =>
                                    (editing || allowed.some((rule) => rule.key === key)) &&
                                    !denied.some((rule) => rule.key === key),
                            ).map((key) => {
                                const rule = allowed.find((entry) => entry.key === key);
                                return (
                                    <RuleGroup.Row
                                        key={key}
                                        title={permissionLabel(key)}
                                        subtitle={key}
                                        value={ACCESS_LABEL[rule?.access ?? 'none']}
                                        valueTone={rule ? undefined : 'muted'}
                                        trailing={
                                            editing ? (
                                                <Toggle
                                                    checked={Boolean(rule)}
                                                    onChange={(next) =>
                                                        toggleRule(key, next, 'write')
                                                    }
                                                />
                                            ) : undefined
                                        }
                                    />
                                );
                            })}
                        </RuleGroup>

                        {denied.length > 0 && (
                            <RuleGroup
                                header={
                                    <span className="flex items-center gap-2">
                                        <Icon glyph={Prohibit} size={20} />
                                        Ce que le rôle refuse
                                    </span>
                                }
                                headerTrailing={`${denied.length} action${denied.length > 1 ? 's' : ''}`}
                                note="Aucune bascule sur ces rangées. Un refus n'est pas un droit éteint qu'on rallume : c'est une décision qui gagne contre tout groupe. Le remettre à permis demande de retirer le refus — deux gestes différents, deux formes différentes."
                            >
                                {denied.map((rule) => (
                                    <RuleGroup.Row
                                        key={rule.key}
                                        title={permissionLabel(rule.key)}
                                        subtitle={rule.key}
                                        value="refusé"
                                        valueTone="refused"
                                        status={{ icon: Prohibit, tone: 'refused' }}
                                    />
                                ))}
                            </RuleGroup>
                        )}

                        {inheritance && (
                            <RuleGroup
                                header={
                                    <span className="flex items-center gap-2">
                                        <Icon glyph={ArrowElbowDownRight} size={20} />
                                        Ce que l'héritage change
                                    </span>
                                }
                                note={
                                    inheritance.addsNothing
                                        ? `Toutes ses règles sont déjà dans celles de ${inheritance.baseName} : ajout net, aucun. Ce rôle ne diffère de sa base que par ses réglages de connexion.`
                                        : `Il reprend les permissions de ${inheritance.baseName}, puis ajoute ou refuse les siennes. Son décompte ne dit donc pas ce qu'il porte.`
                                }
                            >
                                <RuleGroup.Row
                                    title={`Part de ${inheritance.baseName}`}
                                    subtitle={openRole.baseRoleId}
                                    value={`${rolesById.get(openRole.baseRoleId as string)?.permissions.length ?? 0} règles héritées`}
                                    onOpen={() => goToRole(openRole.baseRoleId as string)}
                                />
                            </RuleGroup>
                        )}

                        <RuleGroup
                            header={
                                <span className="flex items-center gap-2">
                                    <Icon glyph={Crosshair} size={20} />
                                    La portée déclarée
                                </span>
                            }
                            note="Elle est déclarée, rassemblée par le moteur d'accès… et lue par personne. Le filtrage ligne à ligne décide sur le rôle historique de la personne, quatre noms écrits en dur. Le savoir évite de croire qu'on a borné un périmètre."
                        >
                            <RuleGroup.Row
                                title={`Portée ${SCOPE_LABEL[scope]}`}
                                subtitle={openRole.dataScopes?.[0]?.expression}
                                value="non appliquée"
                                valueTone="refused"
                                status={{ icon: Warning, tone: 'pending' }}
                            />
                        </RuleGroup>

                        <RuleGroup
                            header={
                                <span className="flex items-center gap-2">
                                    <Icon glyph={LockSimpleOpen} size={20} />
                                    Ce que « rôle du système » ne veut pas dire
                                </span>
                            }
                            note="La donnée déclare un seul rôle intouchable ; l'écran en protège quatre, en gatant la suppression sur le genre du rôle et jamais sur ce champ. Les deux règles ne se rencontrent pas."
                        >
                            <RuleGroup.Row
                                title="Déclaré immuable"
                                subtitle="immutable"
                                value={openRole.immutable ? 'oui' : 'non'}
                                valueTone={openRole.immutable ? undefined : 'muted'}
                            />
                            <RuleGroup.Row
                                title="Protégé par l'écran"
                                subtitle="kind === 'system'"
                                value={openRole.kind === 'system' ? 'oui' : 'non'}
                                valueTone={openRole.kind === 'system' ? undefined : 'muted'}
                            />
                        </RuleGroup>

                        <Notice glyph={Warning}>
                            <strong className="text-on-surface font-medium">
                                Valider une demande n'est pas dans cette matrice.
                            </strong>{' '}
                            Cette autorité est{' '}
                            <strong className="text-on-surface font-medium">relationnelle</strong> —
                            être le manager de, être le bénéficiaire de — et vit dans les gardes
                            métier. La case est nommée ici parce que c'est là qu'on la chercherait.
                        </Notice>

                        <div className="flex flex-col gap-3">
                            {editing ? (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            setEditing(false);
                                            setDraft(null);
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                    <Button variant="filled" onClick={saveDraft} className="flex-1">
                                        Enregistrer le rôle
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outlined" onClick={() => setEditing(true)}>
                                    Modifier le rôle
                                </Button>
                            )}

                            {openRole.kind === 'custom' && !editing && (
                                <Button
                                    variant="text"
                                    onClick={() => removeRole(openRole)}
                                    className="text-error"
                                >
                                    Supprimer le rôle
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── La liste ──────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            {isCompact ? (
                <div className="border-outline-variant bg-surface flex min-h-14 items-center border-b px-5 py-1">
                    <h1 className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-tight">
                        Rôles &amp; accès
                    </h1>
                </div>
            ) : (
                <div className="px-page flex items-center gap-3 pt-5">
                    <h1 className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-tight">
                        Rôles &amp; accès
                    </h1>
                </div>
            )}

            <div
                className={cn(
                    'flex flex-col gap-2.5',
                    isCompact
                        ? 'border-outline-variant bg-surface border-b px-5 py-3'
                        : 'px-page pt-4',
                )}
            >
                <div className="w-full max-w-[960px]">
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Rôle, groupe, permission"
                    />
                </div>
                <div className="flex w-full max-w-[960px] gap-2">
                    <FacetChip
                        label="Rôles"
                        count={rbacRoles.length}
                        selected={view === 'roles'}
                        onClick={() => navigate('/rbac/roles')}
                    />
                    <FacetChip
                        label="Groupes"
                        count={rbacGroups.length}
                        selected={view === 'groups'}
                        onClick={() => navigate('/rbac/groups')}
                    />
                </div>
            </div>

            <div className="medium:px-page flex-1 overflow-y-auto px-5 py-4">
                <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 pb-16">
                    <Notice glyph={ShieldCheck}>
                        <strong className="text-on-surface font-medium">
                            {TOTAL_PERMISSIONS} permissions
                        </strong>{' '}
                        — {VIEW_KEYS.length} vues et {ACTION_KEYS.length} actions, en lecture,
                        écriture ou suppression. Toutes sont lues par l'application.
                    </Notice>

                    {view === 'roles' ? (
                        <>
                            <div className="text-text-secondary flex items-center justify-between gap-3 text-[13px]">
                                <span className="tabular-nums">
                                    <strong className="text-on-surface font-medium">
                                        {rbacRoles.length}
                                    </strong>{' '}
                                    rôles ·{' '}
                                    <strong className="text-on-surface font-medium">
                                        {rbacAssignments.length}
                                    </strong>{' '}
                                    affectations
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon glyph={SortAscending} size={18} />
                                    Par portée
                                </span>
                            </div>

                            {customRoles.length === 0 && rolesByScope.length === 0 ? (
                                <ScreenState
                                    icon={ShieldPlus}
                                    title="Aucun rôle personnalisé"
                                    description="Les rôles du système restent — l'écran les protège de la suppression. C'est un rôle sur mesure qu'il n'y a pas encore."
                                    actions={
                                        <Button
                                            variant="filled"
                                            onClick={() => setRoleSheetOpen(true)}
                                            icon={<Icon glyph={Plus} size={18} />}
                                        >
                                            Créer un rôle
                                        </Button>
                                    }
                                />
                            ) : (
                                rolesByScope.map(({ level, roles }) => (
                                    <RuleGroup
                                        key={level}
                                        header={
                                            <span className="flex items-center gap-2">
                                                <Icon glyph={SCOPE_ICON[level]} size={20} />
                                                Portée déclarée : {SCOPE_LABEL[level]}
                                            </span>
                                        }
                                        headerTrailing={`${roles.length} rôle${roles.length > 1 ? 's' : ''}`}
                                        note={scopeNote(level, roles, rolesById)}
                                    >
                                        {roles.map((role) => {
                                            const inheritance = inheritanceFact(role, rolesById);
                                            const denied = deniedRules(role);
                                            const facts = [
                                                inheritance &&
                                                    `Hérite de ${inheritance.baseName}${inheritance.addsNothing ? " — n'ajoute aucun droit" : ''}`,
                                                denied.length > 0 &&
                                                    `Refuse ${denied.length} action${denied.length > 1 ? 's' : ''}`,
                                            ].filter(Boolean);

                                            return (
                                                <RuleGroup.Row
                                                    key={role.id}
                                                    title={role.name}
                                                    subtitle={
                                                        facts.length > 0
                                                            ? facts.join(' · ')
                                                            : role.id
                                                    }
                                                    value={allowedRules(role).length}
                                                    onOpen={() => goToRole(role.id)}
                                                />
                                            );
                                        })}
                                    </RuleGroup>
                                ))
                            )}

                            {/* Le pied de la liste — 11.1. Le classement par portée montre
                                l'écart ; cette note dit **ce que le produit lit à la place**.
                                Sans elle, on croit que ranger sur la portée veut dire qu'elle
                                s'applique. */}
                            <Notice glyph={Crosshair}>
                                <strong className="text-on-surface font-medium">
                                    {Object.keys(SYSTEM_ROLE_ID_BY_USER_ROLE).length} rôles ont une
                                    branche dans le filtrage ligne à ligne
                                </strong>{' '}
                                — les valeurs de <code>UserRole</code>, testées en dur. Leur portée
                                déclarée et ce que le filtre applique coïncident{' '}
                                <strong className="text-on-surface font-medium">
                                    par construction
                                </strong>
                                , jamais parce que la portée est lue. Les {customRoles.length} rôles
                                personnalisés n'ont aucune branche : ils déclarent un périmètre que
                                rien ne borne.
                            </Notice>

                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outlined"
                                    onClick={() => setRoleSheetOpen(true)}
                                    icon={<Icon glyph={Plus} size={18} />}
                                >
                                    Créer un rôle
                                </Button>
                                <Button variant="text" onClick={() => setAssignmentSheetOpen(true)}>
                                    Affecter une personne
                                </Button>
                            </div>
                        </>
                    ) : filteredGroups.length === 0 ? (
                        <ScreenState
                            icon={Users}
                            title="Aucun groupe"
                            description="Un groupe donne un rôle à plusieurs personnes d'un coup, et borne où il s'applique — un pays, un service."
                            actions={
                                <Button
                                    variant="filled"
                                    onClick={() => setGroupSheetOpen(true)}
                                    icon={<Icon glyph={Plus} size={18} />}
                                >
                                    Créer un groupe
                                </Button>
                            }
                        />
                    ) : (
                        <>
                            <RuleGroup
                                header={
                                    <span className="flex items-center gap-2">
                                        <Icon glyph={Users} size={20} />
                                        Les groupes
                                    </span>
                                }
                                headerTrailing={String(filteredGroups.length)}
                                note="Un groupe peut donner un droit que son rôle n'a pas, et cet ajout-là s'applique. Les portées écrites sous chaque nom, elles, sont déclarées puis ignorées."
                            >
                                {filteredGroups.map((group) => (
                                    <RuleGroup.Row
                                        key={group.id}
                                        title={group.name}
                                        subtitle={groupSummary(group, rolesById)}
                                        value={
                                            group.permissions?.length
                                                ? `+${group.permissions.length} droit${group.permissions.length > 1 ? 's' : ''}`
                                                : undefined
                                        }
                                        onOpen={() => setOpenGroupId(group.id)}
                                    />
                                ))}
                            </RuleGroup>

                            <Button
                                variant="outlined"
                                onClick={() => setGroupSheetOpen(true)}
                                icon={<Icon glyph={Plus} size={18} />}
                            >
                                Créer un groupe
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Un groupe n'a pas de fiche : ce qu'il porte tient en trois lignes, et le
                seul acte qu'on y prend est destructeur. Une feuille suffit. */}
            <BottomSheet
                open={openGroup !== null}
                onClose={() => setOpenGroupId(null)}
                title={openGroup?.name}
            >
                {openGroup && (
                    <div className="flex flex-col gap-3">
                        <RuleGroup>
                            <RuleGroup.Row
                                title="Rôle porté"
                                value={
                                    openGroup.roleIds
                                        .map((id) => rolesById.get(id)?.name)
                                        .filter(Boolean)
                                        .join(', ') || '—'
                                }
                            />
                            <RuleGroup.Row
                                title="Portée déclarée"
                                subtitle={
                                    openGroup.dataScopes?.length
                                        ? undefined
                                        : 'Le groupe n’en déclare aucune'
                                }
                                value={
                                    openGroup.dataScopes?.length
                                        ? SCOPE_LABEL[openGroup.dataScopes[0].level]
                                        : 'aucune'
                                }
                                valueTone={openGroup.dataScopes?.length ? 'refused' : 'muted'}
                            />
                            {openGroup.permissions?.map((rule) => (
                                <RuleGroup.Row
                                    key={rule.key}
                                    title={permissionLabel(rule.key)}
                                    subtitle="Droit ajouté par le groupe — celui-ci s'applique"
                                    value={ACCESS_LABEL[rule.access ?? 'read']}
                                />
                            ))}
                        </RuleGroup>

                        <Notice glyph={Warning}>
                            La portée d'un groupe est{' '}
                            <strong className="text-on-surface font-medium">
                                déclarée puis ignorée
                            </strong>{' '}
                            : un membre d'un groupe borné à un pays voit tout de même le parc
                            entier. Le droit ajouté par le groupe, lui, s'applique.
                        </Notice>

                        <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                            <Button variant="text" onClick={() => setOpenGroupId(null)}>
                                Fermer
                            </Button>
                            <Button
                                variant="text"
                                className="text-error"
                                onClick={() =>
                                    requestConfirmation({
                                        title: `Supprimer « ${openGroup.name} » ?`,
                                        message:
                                            'Les personnes du groupe perdent le rôle qu’il portait. Leur rôle propre ne change pas.',
                                        confirmText: 'Supprimer le groupe',
                                        tone: 'destructive',
                                        irreversible: true,
                                        onConfirm: () => {
                                            const decision = deleteRbacGroup(openGroup.id);
                                            showToast(
                                                decision.allowed
                                                    ? `« ${openGroup.name} » supprimé.`
                                                    : decision.reason || 'Suppression refusée.',
                                                decision.allowed ? 'success' : 'error',
                                            );
                                            if (decision.allowed) setOpenGroupId(null);
                                        },
                                    })
                                }
                            >
                                Supprimer le groupe
                            </Button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            <CreateRoleSheet
                open={roleSheetOpen}
                onClose={() => setRoleSheetOpen(false)}
                roles={rbacRoles}
                onCreate={(role) => {
                    const decision = upsertRbacRole(role);
                    showToast(
                        decision.allowed
                            ? `« ${role.name} » créé.`
                            : decision.reason || 'Création refusée.',
                        decision.allowed ? 'success' : 'error',
                    );
                    if (decision.allowed) {
                        setRoleSheetOpen(false);
                        goToRole(role.id);
                    }
                }}
            />

            <CreateGroupSheet
                open={groupSheetOpen}
                onClose={() => setGroupSheetOpen(false)}
                roles={rbacRoles}
                onCreate={(group) => {
                    const decision = upsertRbacGroup(group);
                    showToast(
                        decision.allowed
                            ? `« ${group.name} » créé.`
                            : decision.reason || 'Création refusée.',
                        decision.allowed ? 'success' : 'error',
                    );
                    if (decision.allowed) setGroupSheetOpen(false);
                }}
            />

            <AssignmentSheet
                open={assignmentSheetOpen}
                onClose={() => setAssignmentSheetOpen(false)}
                users={users}
                roles={rbacRoles}
                groups={rbacGroups}
                onSave={(userId, updates) => {
                    const decision = upsertUserRbacAssignment(userId, updates);
                    showToast(
                        decision.allowed
                            ? 'Affectation enregistrée.'
                            : decision.reason || 'Affectation refusée.',
                        decision.allowed ? 'success' : 'error',
                    );
                    if (decision.allowed) setAssignmentSheetOpen(false);
                }}
            />
        </div>
    );
};

/** « Rôle Admin · pays France » — ce qu'un groupe porte, en une ligne. */
const groupSummary = (group: RbacGroup, rolesById: Map<string, RbacRole>): string => {
    const roleNames = group.roleIds
        .map((id) => rolesById.get(id)?.name)
        .filter(Boolean)
        .join(', ');
    const scope = group.dataScopes?.[0];
    const scopeText = scope
        ? `${SCOPE_LABEL[scope.level]} ${[...(scope.countries ?? []), ...(scope.services ?? []), ...(scope.sites ?? [])].join(', ')}`.trim()
        : 'aucune portée';
    return `Rôle ${roleNames || '—'} · ${scopeText}`;
};

const CreateRoleSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    roles: RbacRole[];
    onCreate: (role: RbacRole) => void;
}> = ({ open, onClose, roles, onCreate }) => {
    const [name, setName] = useState('');
    const [templateId, setTemplateId] = useState('');

    useEffect(() => {
        if (!open) {
            setName('');
            setTemplateId('');
        }
    }, [open]);

    const template = roles.find((role) => role.id === templateId);

    return (
        <BottomSheet open={open} onClose={onClose} title="Créer un rôle">
            <div className="flex flex-col gap-3">
                <InputField
                    label="Nom du rôle"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Responsable logistique"
                />
                <SelectField
                    label="Partir d'un rôle existant"
                    name="template"
                    value={templateId}
                    onChange={(event) => setTemplateId(event.target.value)}
                    options={[
                        { value: '', label: 'Aucun — partir de zéro' },
                        ...roles.map((role) => ({ value: role.id, label: role.name })),
                    ]}
                />
                <Notice>
                    Partir d'un rôle en{' '}
                    <strong className="text-on-surface font-medium">copie</strong> les permissions ;
                    l'héritage, lui, les garde liées — c'est ce qui fait qu'un rôle hérité peut
                    afficher quatre règles et en porter vingt-quatre.
                </Notice>

                <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        className="flex-1"
                        disabled={!name.trim()}
                        onClick={() =>
                            onCreate({
                                id: `role.custom.${Date.now()}`,
                                name: name.trim(),
                                kind: 'custom',
                                baseRoleId: template?.id,
                                permissions: template
                                    ? template.permissions.map((rule) => ({ ...rule }))
                                    : [],
                                authPolicy: template
                                    ? {
                                          ...template.authPolicy,
                                          requiredMethods: [...template.authPolicy.requiredMethods],
                                      }
                                    : {
                                          requiredMethods: ['password'],
                                          sessionMaxMinutes: 480,
                                          requireStepUpForSensitiveActions: false,
                                      },
                                dataScopes: template?.dataScopes?.map((scope) => ({ ...scope })),
                            })
                        }
                    >
                        Créer le rôle
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

const CreateGroupSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    roles: RbacRole[];
    onCreate: (group: RbacGroup) => void;
}> = ({ open, onClose, roles, onCreate }) => {
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState('');

    useEffect(() => {
        if (!open) {
            setName('');
            setRoleId('');
        }
    }, [open]);

    return (
        <BottomSheet open={open} onClose={onClose} title="Créer un groupe">
            <div className="flex flex-col gap-3">
                <InputField
                    label="Nom du groupe"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="IT Togo"
                />
                <SelectField
                    label="Rôle porté par le groupe"
                    name="group-role"
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                    options={[
                        { value: '', label: 'Choisir un rôle' },
                        ...roles.map((role) => ({ value: role.id, label: role.name })),
                    ]}
                />

                <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        className="flex-1"
                        disabled={!name.trim() || !roleId}
                        onClick={() =>
                            onCreate({
                                id: `group.custom.${Date.now()}`,
                                name: name.trim(),
                                roleIds: [roleId],
                            })
                        }
                    >
                        Créer le groupe
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

const AssignmentSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    users: Array<{ id: string; name: string }>;
    roles: RbacRole[];
    groups: RbacGroup[];
    onSave: (userId: string, updates: { roleIds: string[]; groupIds: string[] }) => void;
}> = ({ open, onClose, users, roles, groups, onSave }) => {
    const [userId, setUserId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [groupId, setGroupId] = useState('');

    useEffect(() => {
        if (!open) {
            setUserId('');
            setRoleId('');
            setGroupId('');
        }
    }, [open]);

    return (
        <BottomSheet open={open} onClose={onClose} title="Affecter une personne">
            <div className="flex flex-col gap-3">
                <SelectField
                    label="Personne"
                    name="assignment-user"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    options={[
                        { value: '', label: 'Choisir une personne' },
                        ...users.map((user) => ({ value: user.id, label: user.name })),
                    ]}
                />
                <SelectField
                    label="Rôle"
                    name="assignment-role"
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                    options={[
                        { value: '', label: 'Aucun' },
                        ...roles.map((role) => ({ value: role.id, label: role.name })),
                    ]}
                />
                <SelectField
                    label="Groupe"
                    name="assignment-group"
                    value={groupId}
                    onChange={(event) => setGroupId(event.target.value)}
                    options={[
                        { value: '', label: 'Aucun' },
                        ...groups.map((group) => ({ value: group.id, label: group.name })),
                    ]}
                />

                <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        className="flex-1"
                        disabled={!userId}
                        onClick={() =>
                            onSave(userId, {
                                roleIds: roleId ? [roleId] : [],
                                groupIds: groupId ? [groupId] : [],
                            })
                        }
                    >
                        Enregistrer l'affectation
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default RbacPage;
