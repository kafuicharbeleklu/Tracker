import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowElbowDownRight,
    ArrowLeft,
    Briefcase,
    Check,
    Crosshair,
    DotsThreeVertical,
    Eye,
    Flag,
    Funnel,
    GlobeHemisphereWest,
    Lightning,
    PencilSimple,
    Prohibit,
    ShieldPlus,
    Trash,
    User as UserGlyph,
    UserPlus,
    Users,
    UsersThree,
    Warning,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Toggle from '../../../components/ui/Toggle';
import Notice from '../../../components/ui/Notice';
import { type Tint } from '../../../components/ui/FormParts';
import FacetChip from '../../../components/ui/FacetChip';
import { PiedDeCarte, ToutVoir } from '../../../components/ui/ToutVoir';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import SearchField from '../../../components/ui/SearchField';
import { SelectionBox } from '../../../components/ui/SelectableRow';
import FactRow from '../../../components/ui/FactRow';
import RuleGroup from '../../../components/ui/RuleGroup';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ListTemplate from '../../../components/layout/ListTemplate';
import BarreDePage from '../../../components/layout/BarreDePage';
import { cheminPrecedent, remplacerAdresseCourante } from '../../../lib/cheminParcouru';
import { useDeclareSelectionRegime } from '../../../context/SelectionRegimeContext';
import ListActionFab from '../../../components/ui/ListActionFab';
import BottomSheet from '../../../components/ui/BottomSheet';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import DetailHero from '../../../components/ui/DetailHero';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { useRouter } from '../../../hooks/useRouter';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { DESTINATIONS } from '../../../constants/destinations';
import { RBAC_PERMISSIONS, buildRbacAssignmentFromUser } from '../../../config/rbacDefaults';
import type { User } from '../../../types';
import type {
    AppViewKey,
    PermissionAccessLevel,
    PermissionKey,
    PermissionRule,
    RbacGroup,
    RbacRole,
    ScopeLevel,
} from '../../../types/rbac';

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

const SCOPE_LABEL: Record<ScopeLevel, string> = {
    global: 'global',
    country: 'pays',
    site: 'site',
    team: 'équipe',
    service: 'service',
    self: 'soi',
    custom: 'sur mesure',
};

/**
 * **Ce que la portée veut dire, en mots** — 11.1 les écrit sous chaque nom de rôle :
 * *« tout le parc »*, *« ses pays »*, *« son équipe »*. Le mot technique (`country`,
 * `team`) nomme un mécanisme ; ces phrases-là nomment ce que la personne verra, et
 * c'est le seul des deux qu'on puisse arbitrer sans lire le moteur.
 */
const SCOPE_PHRASE: Record<ScopeLevel, string> = {
    global: 'tout le parc',
    country: 'ses pays',
    site: 'ses sites',
    team: 'son équipe',
    service: 'son service',
    self: 'ses objets',
    custom: 'un périmètre sur mesure',
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

/** La teinte d'une portée — de la plus large (orange) à la plus étroite (neutre). */
const SCOPE_TINT: Record<ScopeLevel, Tint | undefined> = {
    global: 'orange',
    country: 'bleu',
    site: 'bleu',
    team: 'vert',
    service: 'vert',
    self: undefined,
    custom: 'ambre',
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

/** Le glyphe d'une vue — celui de sa destination, pour que la pastille se reconnaisse. */
const VIEW_GLYPH: Record<AppViewKey, PhosphorGlyph> = {
    dashboard: DESTINATIONS.dashboard.glyph,
    inventory: DESTINATIONS.equipment.glyph,
    finance: DESTINATIONS.finance.glyph,
    approvals: DESTINATIONS.tasks.glyph,
    audit: DESTINATIONS.audit.glyph,
    reports: DESTINATIONS.reports.glyph,
    management: DESTINATIONS.management.glyph,
    locations: DESTINATIONS.locations.glyph,
    settings: DESTINATIONS.settings.glyph,
    users: DESTINATIONS.users.glyph,
};

const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « Jane Manager » → « JM ». */
const initiales = (nom: string) =>
    nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot.charAt(0))
        .join('')
        .toUpperCase();

/** L'en-tête d'une carte de fiche : son glyphe, puis ce qu'elle dit. */
const titreDeCarte = (glyph: PhosphorGlyph, texte: string) => (
    <span className="flex items-center gap-2">
        <Icon glyph={glyph} size={20} />
        {texte}
    </span>
);

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

const permissionLabel = (key: PermissionKey): string =>
    key.startsWith('view.')
        ? VIEW_LABEL[key.slice('view.'.length) as AppViewKey]
        : (ACTION_LABEL[key] ?? key);

const declaredScope = (role: RbacRole): ScopeLevel => role.dataScopes?.[0]?.level ?? 'custom';

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
interface RbacPageProps {
    /** Le retour vers « Plus » — la flèche de 11.1, au téléphone seulement. */
    onBack?: () => void;
}

const RbacPage: React.FC<RbacPageProps> = ({ onBack }) => {
    const { routeSegments, navigate } = useRouter();
    const isCompact = useMediaQuery(MEDIA.compact);
    /* Les rôles et les groupes côte à côte à deux colonnes (≥ 1280, 23/09). */
    const enColonnes = useMediaQuery(MEDIA.twoColumn);
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
    /* Un groupe a son adresse, comme un rôle (25/09) : `/rbac/groups/<id>`. */
    const openGroupId = routeSegments[1] === 'groups' ? routeSegments[2] : undefined;

    const [query, setQuery] = useState('');
    const [roleSheetOpen, setRoleSheetOpen] = useState(false);
    const [groupSheetOpen, setGroupSheetOpen] = useState(false);
    const [assignmentSheetOpen, setAssignmentSheetOpen] = useState(false);
    const [membresOuvert, setMembresOuvert] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<PermissionRule[] | null>(null);

    useEffect(() => {
        if (routeSegments[0] !== 'rbac') return;
        /* Une redirection **remplace** l'adresse dans le chemin parcouru : sinon la flèche de
           la liste des rôles renverrait sur `/rbac`, qui redirige ici — une boucle. */
        if (!routeSegments[1]) {
            remplacerAdresseCourante('/rbac/roles');
            navigate('/rbac/roles');
        }
    }, [navigate, routeSegments]);

    const rolesById = useMemo(() => new Map(rbacRoles.map((role) => [role.id, role])), [rbacRoles]);

    /* **Modifier un rôle change le régime de l'écran** (17.2) : au téléphone, le pied
       « Annuler · Enregistrer » prend la place de la barre du bas au lieu de passer dessous. */
    useDeclareSelectionRegime(isCompact && editing && Boolean(openRoleId));

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

    /**
     * **L'affectation de chaque personne** (25/09) — celle qu'on a enregistrée, sinon celle
     * que son compte déduit (rôle historique, modèle par adresse, `rbacRoleIds`,
     * `rbacGroupIds`). Les porteurs et les membres se comptaient sur les seuls champs du
     * compte : une personne ajoutée à un groupe depuis l'écran n'y apparaissait jamais,
     * puisque l'ajout écrit l'affectation, pas le compte.
     */
    const affectations = useMemo(() => {
        const enregistrees = new Map(rbacAssignments.map((entry) => [entry.userId, entry]));
        const table = new Map<string, { roleIds: string[]; groupIds: string[] }>();
        users.forEach((user) => {
            const affectation = enregistrees.get(user.id) ?? buildRbacAssignmentFromUser(user);
            table.set(user.id, {
                roleIds: affectation.roleIds ?? [],
                groupIds: affectation.groupIds ?? [],
            });
        });
        return table;
    }, [rbacAssignments, users]);

    /**
     * **Qui porte chaque rôle** — le chiffre que 11.1 met à droite de la rangée. Un compte
     * porte son rôle par `rbacRoleIds` **ou** par le champ historique `role` : ne compter
     * que le premier donnait zéro sur un parc où les 59 comptes passent par le second.
     * L'affectation réunit les deux.
     */
    const porteursParRole = useMemo(() => {
        const table = new Map<string, number>();
        affectations.forEach(({ roleIds }) =>
            roleIds.forEach((id) => table.set(id, (table.get(id) ?? 0) + 1)),
        );
        return table;
    }, [affectations]);

    /** Les membres de chaque groupe — `RbacGroup` ne porte pas de liste de membres. */
    const membresParGroupe = useMemo(() => {
        const table = new Map<string, number>();
        affectations.forEach(({ groupIds }) =>
            groupIds.forEach((id) => table.set(id, (table.get(id) ?? 0) + 1)),
        );
        return table;
    }, [affectations]);

    /** Le second fait de la ligne d'ordre de « Groupes » — 11.1 : « 5 groupes · 10 membres ». */
    const membresTotal = useMemo(
        () => rbacGroups.reduce((total, group) => total + (membresParGroupe.get(group.id) ?? 0), 0),
        [rbacGroups, membresParGroupe],
    );

    const goToRole = (roleId: string) => navigate(`/rbac/roles/${roleId}`);
    /** La flèche d'un rôle ou des groupes : d'où l'on vient, à défaut la liste des rôles. */
    const retourAuxRoles = () => navigate(cheminPrecedent() ?? '/rbac/roles');

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

    // ── La fiche d'un groupe ──────────────────────────────────────────────────
    /*
     * **Un groupe a sa page** (25/09). Il n'avait qu'une feuille de deux rangées — le rôle
     * porté, la portée — et un bouton de suppression : on ne voyait ni **qui** en était, ni
     * **où** il s'appliquait en toutes lettres, et on ne pouvait y ajouter personne. La
     * page dit les trois, comme la fiche d'un rôle, et se gère d'ici.
     */
    if (openGroup) {
        const membres = users.filter((user) =>
            affectations.get(user.id)?.groupIds.includes(openGroup.id),
        );
        if (routeSegments[3] === 'membres')
            return (
                <PersonnesDUnAcces
                    compact={isCompact}
                    titre="Membres"
                    fil={`Groupe · ${openGroup.name}`}
                    retourLabel="Retour au groupe"
                    onRetour={() => navigate(cheminPrecedent() ?? `/rbac/groups/${openGroup.id}`)}
                    carte="Ses membres"
                    personnes={membres}
                    onOuvrir={(id) => navigate(`/users/${id}`)}
                />
            );
        const rolesPortes = openGroup.roleIds
            .map((id) => rolesById.get(id))
            .filter((role): role is RbacRole => Boolean(role));
        const portee = openGroup.dataScopes?.[0];
        const lieux = portee
            ? [...(portee.countries ?? []), ...(portee.services ?? []), ...(portee.sites ?? [])]
            : [];
        const droitsAjoutes = openGroup.permissions ?? [];

        const supprimerLeGroupe = () =>
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
                    if (decision.allowed) navigate('/rbac/groups');
                },
            });

        const hero = (
            <DetailHero
                label="Groupe · ajoute un rôle à ses membres"
                subject={openGroup.name}
                status={
                    portee
                        ? {
                              icon: SCOPE_ICON[portee.level],
                              label: `${capitale(SCOPE_LABEL[portee.level])}${lieux.length ? ` : ${lieux.join(', ')}` : ''}`,
                              tone: 'info',
                          }
                        : { icon: Crosshair, label: 'Sans portée' }
                }
                metrics={[
                    {
                        value: membres.length,
                        label: membres.length > 1 ? 'membres' : 'membre',
                    },
                    {
                        value: rolesPortes.length,
                        label: rolesPortes.length > 1 ? 'rôles portés' : 'rôle porté',
                    },
                    {
                        value: droitsAjoutes.length,
                        label: droitsAjoutes.length > 1 ? 'droits en plus' : 'droit en plus',
                    },
                ]}
                note="Un groupe ajoute un droit à ses membres, jamais un lien hiérarchique."
            />
        );

        const carteMembres = (
            <RuleGroup
                header={titreDeCarte(UsersThree, 'Ses membres')}
                headerTrailing={`${membres.length} personne${membres.length > 1 ? 's' : ''}`}
            >
                {membres.length === 0 ? (
                    <CardEmptyState
                        glyph={UsersThree}
                        title="Personne dans ce groupe"
                        description="Ajoutez-y les personnes qui doivent porter son rôle."
                    />
                ) : (
                    <>
                        {/* **Une part, puis sa page** (09/10) : la carte défilait dans sa
                            hauteur ; elle montre les premiers et renvoie à tous. */}
                        {membres.slice(0, PERSONNES_SUR_LA_FICHE).map((user) => (
                            <FactRow
                                key={user.id}
                                vignetteText={initiales(user.name)}
                                title={user.name}
                                subtitle={[user.site, user.department].filter(Boolean).join(' · ')}
                                onOpen={() => navigate(`/users/${user.id}`)}
                            />
                        ))}
                        {membres.length > PERSONNES_SUR_LA_FICHE && (
                            <PiedDeCarte>
                                <ToutVoir
                                    libelle="Tous les membres"
                                    total={membres.length}
                                    onOuvrir={() =>
                                        navigate(`/rbac/groups/${openGroup.id}/membres`)
                                    }
                                />
                            </PiedDeCarte>
                        )}
                    </>
                )}
                <RuleGroup.Row
                    glyph={UserPlus}
                    className="gap-3"
                    title="Ajouter ou retirer des membres"
                    onOpen={() => setMembresOuvert(true)}
                />
            </RuleGroup>
        );

        const carteAjout = (
            <RuleGroup header={titreDeCarte(ShieldPlus, 'Ce qu’il ajoute')}>
                {rolesPortes.map((role) => {
                    const niveau = declaredScope(role);
                    return (
                        <FactRow
                            key={role.id}
                            glyph={SCOPE_ICON[niveau]}
                            tint={SCOPE_TINT[niveau]}
                            title={`Le rôle ${role.name}`}
                            subtitle={SCOPE_PHRASE[niveau]}
                            onOpen={() => goToRole(role.id)}
                            className="-mx-4 w-[calc(100%+2rem)] px-4"
                        />
                    );
                })}
                {droitsAjoutes.map((rule) => (
                    <RuleGroup.Row
                        key={rule.key}
                        title={permissionLabel(rule.key)}
                        subtitle="Droit ajouté par le groupe"
                        value={ACCESS_LABEL[rule.access ?? 'read']}
                    />
                ))}
                {rolesPortes.length === 0 && droitsAjoutes.length === 0 && (
                    <CardEmptyState
                        glyph={ShieldPlus}
                        title="Il n’ajoute rien"
                        description="Ni rôle ni droit : ses membres gardent leur accès propre."
                    />
                )}
            </RuleGroup>
        );

        const cartePortee = (
            <RuleGroup
                header={titreDeCarte(Crosshair, 'Où il s’applique')}
                note={
                    portee
                        ? 'Déclarée ; le filtrage des données ne l’applique pas encore.'
                        : undefined
                }
            >
                <RuleGroup.Row
                    glyph={portee ? SCOPE_ICON[portee.level] : Crosshair}
                    className="gap-3"
                    title={
                        portee
                            ? lieux.length
                                ? lieux.join(', ')
                                : capitale(SCOPE_PHRASE[portee.level])
                            : 'Partout où le rôle s’applique'
                    }
                    subtitle={
                        portee ? `Portée ${SCOPE_LABEL[portee.level]}` : 'Aucune portée propre'
                    }
                    value={portee ? 'non appliquée' : undefined}
                    valueTone={portee ? 'refused' : undefined}
                    status={portee ? { icon: Warning, tone: 'pending' } : undefined}
                />
            </RuleGroup>
        );

        return (
            <div className="flex min-h-0 w-full flex-1 flex-col">
                <EnTeteDeFiche
                    compact={isCompact}
                    titre={openGroup.name}
                    fil="Groupe"
                    retourLabel="Retour aux groupes"
                    onRetour={() => navigate(cheminPrecedent() ?? '/rbac/groups')}
                    gestesDuBureau={
                        <Button variant="text" onClick={supprimerLeGroupe} className="text-error">
                            Supprimer
                        </Button>
                    }
                    menu={[
                        {
                            id: 'membres',
                            label: 'Ajouter ou retirer des membres',
                            glyph: UserPlus,
                            onSelect: () => setMembresOuvert(true),
                        },
                        {
                            id: 'supprimer',
                            label: 'Supprimer le groupe',
                            glyph: Trash,
                            destructive: true,
                            dividerBefore: true,
                            onSelect: supprimerLeGroupe,
                        },
                    ]}
                />

                <div className="medium:px-page flex-1 overflow-y-auto px-4 py-4">
                    <div className="large:mx-0 large:max-w-none mx-auto flex w-full max-w-[960px] flex-col gap-4 pb-16">
                        {enColonnes ? (
                            <div className="grid grid-cols-12 items-start gap-4">
                                <div className="col-span-7 flex flex-col gap-4">
                                    {hero}
                                    {carteAjout}
                                    {cartePortee}
                                </div>
                                <div className="col-span-5 flex flex-col gap-4">{carteMembres}</div>
                            </div>
                        ) : (
                            <>
                                {hero}
                                {carteMembres}
                                {carteAjout}
                                {cartePortee}
                            </>
                        )}
                    </div>
                </div>

                <MembresSheet
                    open={membresOuvert}
                    onClose={() => setMembresOuvert(false)}
                    groupe={openGroup}
                    users={users}
                    membresInitiaux={membres.map((user) => user.id)}
                    onSave={(changements) => {
                        let refus: string | undefined;
                        changements.forEach(({ userId, entre }) => {
                            const actuels = affectations.get(userId)?.groupIds ?? [];
                            const decision = upsertUserRbacAssignment(userId, {
                                groupIds: entre
                                    ? [...actuels, openGroup.id]
                                    : actuels.filter((id) => id !== openGroup.id),
                            });
                            if (!decision.allowed) refus = decision.reason;
                        });
                        showToast(
                            refus ??
                                `${changements.length} changement${changements.length > 1 ? 's' : ''} dans « ${openGroup.name} ».`,
                            refus ? 'error' : 'success',
                        );
                        setMembresOuvert(false);
                    }}
                />
            </div>
        );
    }

    // ── La fiche d'un rôle ────────────────────────────────────────────────────
    /*
     * **La fiche refondue** (25/09). Elle tenait 2 200 px au téléphone : sept rangées
     * « lecture » pour dire quelles pages s'ouvrent, une carte « ce que rôle du système ne
     * veut pas dire » qui affichait du code (`kind === 'system'`), et une note ambre de
     * 250 signes. Elle dit maintenant dans l'ordre de ce qu'on vient y chercher : qui le
     * porte, ce qu'il ouvre (en pastilles), ce qu'il permet et refuse (une seule carte), où
     * il s'applique. « Ne se supprime pas » monte dans le surtitre du héro.
     */
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
        const supprimable = openRole.kind === 'custom';

        /** Ceux qui portent le rôle — d'après leur affectation (voir `affectations`). */
        const titulaires = users.filter((user) =>
            affectations.get(user.id)?.roleIds.includes(openRole.id),
        );
        if (routeSegments[3] === 'personnes')
            return (
                <PersonnesDUnAcces
                    compact={isCompact}
                    titre="Personnes"
                    fil={`Rôle · ${openRole.name}`}
                    retourLabel="Retour au rôle"
                    onRetour={() => navigate(cheminPrecedent() ?? `/rbac/roles/${openRole.id}`)}
                    carte="Qui le porte"
                    personnes={titulaires}
                    onOuvrir={(id) => navigate(`/users/${id}`)}
                />
            );

        const quitterLEdition = () => {
            setEditing(false);
            setDraft(null);
        };

        const hero = (
            <DetailHero
                label={
                    openRole.kind === 'system'
                        ? 'Rôle du système · ne se supprime pas'
                        : inheritance
                          ? `Rôle personnalisé · hérite de ${inheritance.baseName}`
                          : 'Rôle personnalisé'
                }
                subject={openRole.name}
                status={
                    denied.length > 0
                        ? {
                              icon: Prohibit,
                              label: `Refuse ${denied.length} action${denied.length > 1 ? 's' : ''}`,
                              tone: 'attention',
                          }
                        : {
                              icon: SCOPE_ICON[scope],
                              label: `Voit ${SCOPE_PHRASE[scope]}`,
                              tone: 'info',
                          }
                }
                metrics={[
                    {
                        value: titulaires.length,
                        label: titulaires.length > 1 ? 'porteurs' : 'porteur',
                    },
                    { value: `${openViews.length}/${VIEW_KEYS.length}`, label: 'vues ouvertes' },
                    {
                        value: `${openActions.length}/${ACTION_KEYS.length}`,
                        label: 'actions permises',
                    },
                ]}
                note={
                    <>
                        Connexion par <strong className="font-medium">{methods}</strong>, session de{' '}
                        {sessionLabel(openRole.authPolicy.sessionMaxMinutes)} au plus.
                        {openRole.authPolicy.requireStepUpForSensitiveActions &&
                            ' Élévation demandée sur les actes sensibles.'}
                    </>
                }
            />
        );

        /* **Qui le porte** — ce qu'on vient d'abord chercher : à qui ce rôle s'applique. */
        const porteurs = (
            <RuleGroup
                header={titreDeCarte(UsersThree, 'Qui le porte')}
                headerTrailing={`${titulaires.length} personne${titulaires.length > 1 ? 's' : ''}`}
            >
                {titulaires.length === 0 ? (
                    <CardEmptyState
                        glyph={UsersThree}
                        title="Personne ne le porte"
                        description="Affectez-le depuis la liste des accès, ou par un groupe."
                    />
                ) : (
                    <>
                        {titulaires.slice(0, PERSONNES_SUR_LA_FICHE).map((user) => (
                            <FactRow
                                key={user.id}
                                vignetteText={initiales(user.name)}
                                title={user.name}
                                subtitle={[user.site, user.department].filter(Boolean).join(' · ')}
                                onOpen={() => navigate(`/users/${user.id}`)}
                            />
                        ))}
                        {titulaires.length > PERSONNES_SUR_LA_FICHE && (
                            <PiedDeCarte>
                                <ToutVoir
                                    libelle="Toutes les personnes"
                                    total={titulaires.length}
                                    onOuvrir={() =>
                                        navigate(`/rbac/roles/${openRole.id}/personnes`)
                                    }
                                />
                            </PiedDeCarte>
                        )}
                    </>
                )}
            </RuleGroup>
        );

        /* **Les vues en pastilles** : dix rangées « lecture » disaient la même chose dix
           fois — une vue s'ouvre ou ne s'ouvre pas. En modification, toutes les vues
           paraissent, et la pastille se coche. */
        const vues = (
            <RuleGroup
                header={titreDeCarte(Eye, 'Ce qu’il ouvre')}
                headerTrailing={`${openViews.length} vue${openViews.length > 1 ? 's' : ''} sur ${VIEW_KEYS.length}`}
            >
                {!editing && openViews.length === 0 ? (
                    <CardEmptyState
                        glyph={Eye}
                        title="Aucune vue ouverte"
                        description="Ce rôle n’ouvre aucune page à lui seul."
                    />
                ) : (
                    <div className="flex flex-wrap gap-2 pt-1 pb-4">
                        {VIEW_KEYS.filter(
                            (key) => editing || allowed.some((rule) => rule.key === key),
                        ).map((key) => {
                            const ouverte = allowed.some((rule) => rule.key === key);
                            return editing ? (
                                <FacetChip
                                    key={key}
                                    compact
                                    label={permissionLabel(key)}
                                    selected={ouverte}
                                    onClick={() => toggleRule(key, !ouverte, 'read')}
                                />
                            ) : (
                                <span
                                    key={key}
                                    className="bg-surface-container text-on-surface text-ts-sub leading-ts-sub inline-flex h-9 items-center gap-2 rounded-md px-3"
                                >
                                    <Icon
                                        glyph={VIEW_GLYPH[key.slice('view.'.length) as AppViewKey]}
                                        size={18}
                                        className="text-on-surface-variant"
                                    />
                                    {permissionLabel(key)}
                                </span>
                            );
                        })}
                    </div>
                )}
            </RuleGroup>
        );

        /* **Ce qu'il permet et ce qu'il refuse, dans une carte** : le refus est un troisième
           état du même droit, pas un autre sujet. Un refus ne se bascule pas : il se retire. */
        const actions = (
            <RuleGroup
                header={titreDeCarte(Lightning, 'Ce qu’il permet')}
                headerTrailing={`${openActions.length} sur ${ACTION_KEYS.length}`}
                note="Valider une demande dépend du lien — manager, bénéficiaire —, pas du rôle."
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
                            value={ACCESS_LABEL[rule?.access ?? 'none']}
                            valueTone={rule ? undefined : 'muted'}
                            off={!rule}
                            trailing={
                                editing ? (
                                    <Toggle
                                        checked={Boolean(rule)}
                                        onChange={(next) => toggleRule(key, next, 'write')}
                                    />
                                ) : undefined
                            }
                        />
                    );
                })}
                {denied.map((rule) => (
                    <RuleGroup.Row
                        key={rule.key}
                        title={permissionLabel(rule.key)}
                        value="refusé"
                        valueTone="refused"
                        status={{ icon: Prohibit, tone: 'refused' }}
                    />
                ))}
                {!editing && openActions.length === 0 && denied.length === 0 && (
                    <CardEmptyState
                        glyph={Lightning}
                        title="Aucune action permise"
                        description="Il ouvre des pages, sans y rien changer."
                    />
                )}
            </RuleGroup>
        );

        /* **Où il s'applique**, et d'où il vient — deux rangées, une carte. */
        const portee = (
            <RuleGroup
                header={titreDeCarte(Crosshair, 'Où il s’applique')}
                note="Déclarée ; le filtrage des données ne l’applique pas encore."
            >
                <RuleGroup.Row
                    glyph={SCOPE_ICON[scope]}
                    className="gap-3"
                    title={capitale(SCOPE_PHRASE[scope])}
                    subtitle={
                        openRole.dataScopes?.[0]?.expression ?? `Portée ${SCOPE_LABEL[scope]}`
                    }
                    value="non appliquée"
                    valueTone="refused"
                    status={{ icon: Warning, tone: 'pending' }}
                />
                {inheritance && (
                    <RuleGroup.Row
                        glyph={ArrowElbowDownRight}
                        className="gap-3"
                        title={`Hérite de ${inheritance.baseName}`}
                        subtitle={
                            inheritance.addsNothing
                                ? 'N’ajoute aucun droit à sa base'
                                : 'Reprend ses droits, puis ajoute ou refuse les siens'
                        }
                        onOpen={() => goToRole(openRole.baseRoleId as string)}
                    />
                )}
            </RuleGroup>
        );

        return (
            <div className="flex min-h-0 w-full flex-1 flex-col">
                <EnTeteDeFiche
                    compact={isCompact}
                    titre={openRole.name}
                    fil={openRole.kind === 'system' ? 'Rôle du système' : 'Rôle personnalisé'}
                    retourLabel="Retour aux rôles"
                    onRetour={() => retourAuxRoles()}
                    gestesDuBureau={
                        editing ? (
                            <>
                                <Button variant="outlined" onClick={quitterLEdition}>
                                    Annuler
                                </Button>
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={Check} size={20} />}
                                    onClick={saveDraft}
                                >
                                    Enregistrer le rôle
                                </Button>
                            </>
                        ) : (
                            <>
                                {supprimable && (
                                    <Button
                                        variant="text"
                                        onClick={() => removeRole(openRole)}
                                        className="text-error"
                                    >
                                        Supprimer
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    icon={<Icon glyph={PencilSimple} size={20} />}
                                    onClick={() => setEditing(true)}
                                >
                                    Modifier le rôle
                                </Button>
                            </>
                        )
                    }
                    menu={
                        editing
                            ? undefined
                            : [
                                  {
                                      id: 'modifier',
                                      label: 'Modifier le rôle',
                                      glyph: PencilSimple,
                                      onSelect: () => setEditing(true),
                                  },
                                  ...(supprimable
                                      ? [
                                            {
                                                id: 'supprimer',
                                                label: 'Supprimer le rôle',
                                                glyph: Trash,
                                                destructive: true,
                                                dividerBefore: true,
                                                onSelect: () => removeRole(openRole),
                                            },
                                        ]
                                      : []),
                              ]
                    }
                />

                <div className="medium:px-page flex-1 overflow-y-auto px-4 py-4">
                    <div
                        className={cn(
                            'large:mx-0 large:max-w-none mx-auto flex w-full max-w-[960px] flex-col gap-4',
                            isCompact && editing ? 'pb-28' : 'pb-16',
                        )}
                    >
                        {enColonnes ? (
                            /* **Au bureau, deux colonnes indépendantes** : ce que le rôle permet
                               à gauche (7), à qui et où il s'applique à droite (5). */
                            <div className="grid grid-cols-12 items-start gap-4">
                                <div className="col-span-7 flex flex-col gap-4">
                                    {hero}
                                    {vues}
                                    {actions}
                                </div>
                                <div className="col-span-5 flex flex-col gap-4">
                                    {porteurs}
                                    {portee}
                                </div>
                            </div>
                        ) : (
                            <>
                                {hero}
                                {!editing && porteurs}
                                {vues}
                                {actions}
                                {!editing && portee}
                            </>
                        )}
                    </div>
                </div>

                {/* En modification au téléphone, le pied d'acte reste sous le pouce. */}
                {isCompact && editing && (
                    <div className="border-outline-variant bg-surface fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                        <Button variant="text" onClick={quitterLEdition}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={saveDraft} className="flex-1">
                            Enregistrer le rôle
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // ── La liste ──────────────────────────────────────────────────────────────
    return (
        <>
            <ListTemplate
                /*
                 * **La barre de 17.8, la même que les cinq autres listes.** L'écran
                 * portait un titre à 22/28 et, sous lui, un champ de recherche toujours
                 * ouvert puis deux jetons « Rôles 8 · Groupes 5 ». 17.8 a relevé qu'il
                 * n'y a **pas d'onglets dans le corpus** : les deux jetons étaient une
                 * barre d'onglets déguisée, et 11.1 dessine bien **deux écrans de
                 * liste** — « Accès » puis « Groupes » — chacun avec son en-tête.
                 */
                title={view === 'groups' ? 'Groupes' : 'Accès'}
                onBack={view === 'groups' ? retourAuxRoles : onBack}
                /* Groupes est une sous-page d'Accès : sa flèche vaut aussi au bureau. */
                backLabel={view === 'groups' ? 'Retour aux accès' : 'Retour'}
                search={{
                    value: query,
                    onChange: setQuery,
                    placeholder: view === 'groups' ? 'Nom d’un groupe' : 'Rôle, permission',
                }}
                count={
                    view === 'groups'
                        ? {
                              total: filteredGroups.length,
                              noun: `groupe${filteredGroups.length > 1 ? 's' : ''} · ${membresTotal} membre${membresTotal > 1 ? 's' : ''}`,
                          }
                        : {
                              total: filteredRoles.length,
                              /* `.ord` de 11.1 : « 8 rôles · 5 groupes » à gauche,
                                 « 25 personnes » à droite. Les trois faits comptent le
                                 même sujet et tiennent sur une ligne. */
                              noun: `rôle${filteredRoles.length > 1 ? 's' : ''} · ${rbacGroups.length} groupe${rbacGroups.length > 1 ? 's' : ''} · ${users.length} personne${users.length > 1 ? 's' : ''}`,
                          }
                }
                fab={
                    <ListActionFab
                        label={view === 'groups' ? 'groupe' : 'accès'}
                        sheetTitle="Créer"
                        actions={
                            view === 'groups'
                                ? [
                                      {
                                          id: 'group',
                                          label: 'Un groupe',
                                          icon: 'group_add',
                                          onSelect: () => setGroupSheetOpen(true),
                                      },
                                  ]
                                : [
                                      {
                                          id: 'role',
                                          label: 'Un rôle',
                                          icon: 'shield',
                                          onSelect: () => setRoleSheetOpen(true),
                                      },
                                      {
                                          id: 'group',
                                          label: 'Un groupe',
                                          icon: 'group_add',
                                          onSelect: () => setGroupSheetOpen(true),
                                      },
                                      {
                                          id: 'assign',
                                          label: 'Affecter une personne',
                                          icon: 'person_add',
                                          onSelect: () => setAssignmentSheetOpen(true),
                                      },
                                  ]
                        }
                    />
                }
                /* Le vide dans la carte (25/09) ; filtré, il nomme sa sortie. */
                empty={
                    query.trim() ? (
                        <CardEmptyState
                            glyph={Funnel}
                            title={
                                view === 'groups'
                                    ? 'Aucun groupe ne correspond'
                                    : 'Aucun rôle ne correspond'
                            }
                            description="Changez de mot, ou revenez à la liste entière."
                            action={
                                <Button variant="outlined" onClick={() => setQuery('')}>
                                    {view === 'groups'
                                        ? `Voir les ${rbacGroups.length} groupes`
                                        : `Voir les ${rbacRoles.length} rôles`}
                                </Button>
                            }
                        />
                    ) : view === 'groups' ? (
                        <CardEmptyState
                            glyph={Users}
                            title="Aucun groupe"
                            description="Un groupe donne un rôle à plusieurs personnes d'un coup, dans un pays ou un service."
                        />
                    ) : (
                        <CardEmptyState
                            glyph={ShieldPlus}
                            title="Aucun rôle"
                            description="Les rôles du système sont livrés avec le produit."
                        />
                    )
                }
                hasRows={view === 'groups' ? filteredGroups.length > 0 : filteredRoles.length > 0}
                /* Le corps de 11.1 est fait de **groupes à filets**, qui sont déjà des
                   cartes : sans cela, le gabarit en posait une autour et les rangées se
                   trouvaient rentrées de 16 de plus qu'ailleurs (10/09). */
                body="cartes"
            >
                {view === 'roles' ? (
                    <div
                        className={cn(
                            /* **Au bureau, deux colonnes** (23/09) : les rôles sur 8, les
                               groupes sur 4. Empilée, la carte des groupes n'était qu'une
                               rangée de 124 px sous 580 de rôles. */
                            'flex flex-col gap-4',
                            enColonnes && 'grid grid-cols-12 items-start',
                        )}
                    >
                        {/*
                         * **La carte des rôles de 11.1** — un rôle par rangée, ce qu'il
                         * couvre en sous-ligne, et **le nombre de personnes qui le
                         * portent** à droite. L'écran rangeait les rôles en six cartes
                         * par portée déclarée et mettait à droite leur nombre de
                         * permissions : un classement d'analyse, pas la liste d'un
                         * produit. Ce que la planche demande de lire d'un coup d'œil,
                         * c'est qui est concerné.
                         */}
                        <RuleGroup
                            className={cn(enColonnes && 'col-span-8')}
                            header="Les rôles"
                            headerTrailing="porteurs"
                            note="Les rôles du système ne se suppriment pas. La portée d'un rôle est déclarée, pas encore appliquée."
                        >
                            {filteredRoles.map((role) => {
                                const niveau = declaredScope(role);
                                const heritage = inheritanceFact(role, rolesById);
                                const refus = deniedRules(role);
                                const faits = [
                                    heritage
                                        ? `Hérite de ${heritage.baseName}${heritage.addsNothing ? " — n'ajoute aucun droit" : ''}`
                                        : SCOPE_PHRASE[niveau],
                                    refus.length > 0 &&
                                        `refuse ${refus.length} action${refus.length > 1 ? 's' : ''}`,
                                ].filter(Boolean);
                                const porteurs = porteursParRole.get(role.id) ?? 0;

                                /* **La portée se voit avant de se lire** (24/09) :
                                   huit rangées grises identiques ne distinguaient pas
                                   « tout le parc » de « ses objets ». La vignette porte
                                   le glyphe de la portée dans sa teinte, les porteurs
                                   passent en chiffre. */
                                return (
                                    <FactRow
                                        key={role.id}
                                        glyph={SCOPE_ICON[niveau]}
                                        tint={SCOPE_TINT[niveau]}
                                        title={role.name}
                                        subtitle={faits.join(' · ')}
                                        figure={{
                                            value: porteurs,
                                            unit: porteurs > 1 ? 'porteurs' : 'porteur',
                                        }}
                                        onOpen={() => goToRole(role.id)}
                                        className="-mx-4 w-[calc(100%+2rem)] px-4"
                                    />
                                );
                            })}
                        </RuleGroup>

                        {/* **La carte liste les groupes** (23/09, contre 11.1 qui n'y met qu'un
                            renvoi) : les premiers et leurs membres — cinq au bureau, trois au
                            téléphone —, puis le renvoi vers la page des groupes. */}
                        <RuleGroup
                            className={cn(enColonnes && 'col-span-4')}
                            header="Les groupes"
                            headerTrailing="membres"
                        >
                            {rbacGroups.slice(0, enColonnes ? 5 : 3).map((group) => {
                                const membres = membresParGroupe.get(group.id) ?? 0;
                                return (
                                    <FactRow
                                        key={group.id}
                                        glyph={UsersThree}
                                        title={group.name}
                                        subtitle={groupSummary(group, rolesById)}
                                        figure={{
                                            value: membres,
                                            unit: membres > 1 ? 'membres' : 'membre',
                                        }}
                                        onOpen={() => navigate(`/rbac/groups/${group.id}`)}
                                        className="-mx-4 w-[calc(100%+2rem)] px-4"
                                    />
                                );
                            })}
                            <RuleGroup.Row
                                glyph={UsersThree}
                                className="gap-3"
                                title={
                                    rbacGroups.length > (enColonnes ? 5 : 3)
                                        ? `Voir les ${rbacGroups.length} groupes`
                                        : 'Ouvrir les groupes'
                                }
                                subtitle="Ce qui s'ajoute aux rôles"
                                onOpen={() => navigate('/rbac/groups')}
                            />
                        </RuleGroup>
                    </div>
                ) : (
                    <RuleGroup
                        header="Ce qu'ils ajoutent"
                        headerTrailing="membres"
                        note="Un groupe ajoute un droit, jamais la hiérarchie. Sa portée est déclarée, pas encore appliquée."
                    >
                        {filteredGroups.map((group) => (
                            <RuleGroup.Row
                                key={group.id}
                                title={group.name}
                                subtitle={groupSummary(group, rolesById)}
                                value={membresParGroupe.get(group.id) ?? 0}
                                quiet
                                onOpen={() => navigate(`/rbac/groups/${group.id}`)}
                            />
                        ))}
                    </RuleGroup>
                )}
            </ListTemplate>

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
        </>
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

/** Combien la fiche d'un rôle ou d'un groupe montre de personnes avant de renvoyer à toutes. */
const PERSONNES_SUR_LA_FICHE = 5;

/**
 * **Toutes les personnes d'un rôle ou d'un groupe** (09/10) — `/rbac/roles/<id>/personnes`,
 * `/rbac/groups/<id>/membres`. La fiche en montre les premières et renvoie ici : sa carte
 * ne défile plus dans sa hauteur.
 */
const PersonnesDUnAcces: React.FC<{
    compact: boolean;
    titre: string;
    fil: string;
    retourLabel: string;
    onRetour: () => void;
    /** Le titre de la carte — celui qu'elle porte sur la fiche. */
    carte: string;
    personnes: User[];
    onOuvrir: (id: string) => void;
}> = ({ compact, titre, fil, retourLabel, onRetour, carte, personnes, onOuvrir }) => (
    <div className="flex min-h-0 w-full flex-1 flex-col">
        <EnTeteDeFiche
            compact={compact}
            titre={titre}
            fil={fil}
            retourLabel={retourLabel}
            onRetour={onRetour}
        />
        <div className="medium:px-page flex-1 overflow-y-auto px-4 py-4">
            <div className="large:mx-0 mx-auto flex w-full max-w-[960px] flex-col gap-4 pb-16">
                <RuleGroup
                    header={titreDeCarte(UsersThree, carte)}
                    headerTrailing={`${personnes.length} personne${personnes.length > 1 ? 's' : ''}`}
                >
                    {personnes.length === 0 ? (
                        <CardEmptyState
                            glyph={UsersThree}
                            title="Personne"
                            description="Aucune personne n'est rattachée ici."
                        />
                    ) : (
                        personnes.map((user) => (
                            <FactRow
                                key={user.id}
                                vignetteText={initiales(user.name)}
                                title={user.name}
                                subtitle={[user.site, user.department].filter(Boolean).join(' · ')}
                                onOpen={() => onOuvrir(user.id)}
                            />
                        ))
                    )}
                </RuleGroup>
            </div>
        </div>
    </div>
);

/**
 * **L'en-tête d'une fiche d'accès** — rôle ou groupe. Au téléphone, la barre commune et un
 * ⋮ qui porte les actes ; au bureau, le nom en titre de page, son fil dessous, et les actes
 * nommés à droite (17.11).
 */
const EnTeteDeFiche: React.FC<{
    compact: boolean;
    titre: string;
    fil: string;
    retourLabel: string;
    onRetour: () => void;
    gestesDuBureau?: React.ReactNode;
    menu?: MenuItem[];
}> = ({ compact, titre, fil, retourLabel, onRetour, gestesDuBureau, menu }) =>
    compact ? (
        <BarreDePage
            title={titre}
            onBack={onRetour}
            backLabel={retourLabel}
            actions={
                menu && menu.length > 0 ? (
                    <Menu
                        align="end"
                        items={menu}
                        trigger={
                            <Button variant="text" iconOnly aria-label="Autres actes">
                                <Icon glyph={DotsThreeVertical} size="geste" />
                            </Button>
                        }
                    />
                ) : undefined
            }
        />
    ) : (
        <IconGestureSizeContext.Provider value={40}>
            <div className="px-page flex min-h-[72px] items-center gap-2 pt-5">
                <Button
                    variant="text"
                    iconOnly
                    aria-label={retourLabel}
                    onClick={onRetour}
                    className="text-on-surface-variant hover:text-on-surface -ml-2.5 shrink-0"
                >
                    <Icon glyph={ArrowLeft} size={20} />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="font-brand text-on-surface text-ts-page leading-ts-page truncate font-semibold tracking-[-0.02em]">
                        {titre}
                    </h1>
                    <span className="text-text-muted block truncate text-[0.8125rem] leading-4">
                        {fil}
                    </span>
                </div>
                {gestesDuBureau && (
                    <div className="flex shrink-0 items-center gap-2">{gestesDuBureau}</div>
                )}
            </div>
        </IconGestureSizeContext.Provider>
    );

/**
 * **Ajouter ou retirer des membres** — une liste à cocher, les membres d'abord. Un seul
 * enregistrement pour plusieurs changements, et le pied dit combien il en porte.
 */
const MembresSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    groupe: RbacGroup;
    users: User[];
    membresInitiaux: string[];
    onSave: (changements: Array<{ userId: string; entre: boolean }>) => void;
}> = ({ open, onClose, groupe, users, membresInitiaux, onSave }) => {
    const cle = membresInitiaux.join('|');
    const [choisis, setChoisis] = useState<Set<string>>(() => new Set(membresInitiaux));
    const [recherche, setRecherche] = useState('');

    useEffect(() => {
        if (open) {
            setChoisis(new Set(cle ? cle.split('|') : []));
            setRecherche('');
        }
    }, [open, cle]);

    const initiaux = useMemo(() => new Set(cle ? cle.split('|') : []), [cle]);
    const terme = recherche.trim().toLowerCase();
    const visibles = users
        .filter((user) => !terme || user.name.toLowerCase().includes(terme))
        .sort(
            (a, b) =>
                Number(initiaux.has(b.id)) - Number(initiaux.has(a.id)) ||
                a.name.localeCompare(b.name, 'fr'),
        );
    const changements = users
        .filter((user) => choisis.has(user.id) !== initiaux.has(user.id))
        .map((user) => ({ userId: user.id, entre: choisis.has(user.id) }));

    const basculer = (id: string) =>
        setChoisis((actuels) => {
            const suivants = new Set(actuels);
            if (suivants.has(id)) suivants.delete(id);
            else suivants.add(id);
            return suivants;
        });

    return (
        <BottomSheet open={open} onClose={onClose} title={`Membres de « ${groupe.name} »`}>
            <div className="flex flex-col gap-3">
                <SearchField
                    value={recherche}
                    onChange={setRecherche}
                    placeholder="Nom d’une personne"
                />
                <div className="-mx-5 max-h-[50vh] overflow-y-auto px-5">
                    {visibles.map((user) => (
                        <Button
                            key={user.id}
                            variant="text"
                            layout="card"
                            onClick={() => basculer(user.id)}
                            aria-pressed={choisis.has(user.id)}
                            className="border-outline-variant flex min-h-14 w-full items-center justify-start gap-3 rounded-none border-t px-0 py-2 text-left font-normal first:border-t-0"
                        >
                            <SelectionBox selected={choisis.has(user.id)} />
                            <span className="min-w-0 flex-1">
                                <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                    {user.name}
                                </span>
                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                    {[user.site, user.department].filter(Boolean).join(' · ')}
                                </span>
                            </span>
                        </Button>
                    ))}
                </div>
                <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                    <Button
                        variant="tonal"
                        className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                        onClick={onClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        className="justify-center"
                        disabled={changements.length === 0}
                        onClick={() => onSave(changements)}
                    >
                        {changements.length > 0
                            ? `Enregistrer ${changements.length} changement${changements.length > 1 ? 's' : ''}`
                            : 'Enregistrer'}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default RbacPage;
