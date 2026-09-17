import React, { useEffect, useMemo, useState } from 'react';
import {
    CaretRight,
    EnvelopeSimple,
    FileCsv,
    Prohibit,
    SignOut,
    UsersThree,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useDebounce } from '../../../hooks/useDebounce';
import useSelection from '../../../hooks/useSelection';
import { ViewType, UserRole, type User } from '../../../types';

import ListTemplate from '../../../components/layout/ListTemplate';
import ListRow, { TONE_CLASS, type ListRowStatus } from '../../../components/ui/ListRow';
import DataTable, { type DataColumn } from '../../../components/ui/DataTable';
import { useListView } from '../../../hooks/useListView';
import ScreenState from '../../../components/ui/ScreenState';
import BulkOverflow from '../../../components/ui/BulkOverflow';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import BottomSheet from '../../../components/ui/BottomSheet';
import FilterButton from '../../../components/ui/FilterButton';
import InviteSheet from '../components/InviteSheet';

import { canDeleteUserByRoleRule } from '../../../lib/businessRules';
import { buildCsvLine } from '../../../lib/csv';
import { DEMO_RESEED_NOTICE, isDemoSeedUser } from '../../../lib/demoSeed';
import { cn } from '../../../lib/utils';

/**
 * Annuaire des personnes — **porté sur la planche 05.1** (gabarit `ListTemplate`).
 *
 * *Un annuaire de parc, pas un annuaire d'entreprise.* Le gestionnaire l'ouvre pour
 * deux choses : trouver une personne dont on lui parle, et **choisir à qui attribuer
 * un objet**. La question n'est donc jamais « qui travaille ici » — l'entreprise a
 * déjà un annuaire pour ça — mais **qui détient quoi**.
 *
 * **Ce que le portage ajoute**, et c'est la seule donnée qui décide quelque chose :
 * **le nombre d'équipements détenus**. C'est le pendant exact de « chez qui est
 * l'objet » sur la liste des actifs, dans l'autre sens.
 *
 * **Ce qu'il retire :**
 *
 * - **les avatars illustrés** → des initiales. Onze visages de dessin animé dans une
 *   liste font onze taches de couleur qui ne signifient rien et pèsent plus que les
 *   noms.
 * - **les badges de rôle en majuscules colorées** — deux interdits d'un coup : les
 *   capitales (§8.4), et **la couleur qui code une catégorie** (§8.8). Un rôle n'est
 *   pas un état ; le peindre, c'est le défaut corrigé au tableau de bord.
 * - **la corbeille de rangée** et **la pagination** — même arbitrage que 04.1.
 * - **l'e-mail de la rangée.** Il reste **clé de recherche** — le champ l'annonce —
 *   mais trente caractères écrasaient le nom qu'ils accompagnaient. Écart assumé avec
 *   `ASSET-10001`, gardé sur les actifs : une étiquette se lit **sur l'objet**, une
 *   adresse ne se lit pas sur une personne.
 *
 * **Le tri est dit.** Il n'y a pas d'ordre naturel pour des personnes : la liste
 * actuelle rangeait sans le dire. Il est alphabétique, il partage la ligne du
 * décompte, et il se renverse.
 *
 * ## Passe sobre du 03/09 — ce que la planche rééditée change
 *
 * Même contenu, moins de texte, plus d'air (R15 : quatre marches 28 · 17 · 16 · 12,
 * deux graisses, **aucune note dans l'écran**). Quatre décisions, toutes prises par
 * la planche :
 *
 * 1. **La rangée dit qui c'est, puis deux faits** — le lieu et la charge
 *    (« Lomé Siège · 2 objets »). Le rôle **quitte la première ligne** : le mot
 *    n'était lu par personne, et la vignette le porte maintenant par sa teinte. Le
 *    service quitte lui aussi la rangée : il se filtre, et il se lit sur la fiche.
 * 2. **L'état du compte passe à droite de la rangée**, et seulement quand il n'est
 *    pas « actif ». C'est le « état en rangée » du lot 14 : trois crans visibles
 *    (invité · suspendu · départ), alignés d'une rangée à l'autre.
 * 3. **Plus de ligne de pastilles sous la recherche.** Le rôle rejoint le site et
 *    l'état **dans la feuille de filtre** — un seul endroit où l'on restreint, et le
 *    compteur du bouton dit combien d'axes sont posés.
 * 4. **Plus de pied de liste.** « 7 des 14 actifs sont portés par 5 personnes » était
 *    exactement la note que R15 interdit : un commentaire sur la liste, pas un fait
 *    de la liste.
 *
 * *La couleur qui code une catégorie revient par la vignette — c'est un retournement
 * assumé de l'arbitrage d'août rappelé plus haut, et il est tenable : la teinte ne
 * porte plus l'information seule (le rôle reste lisible en filtre et sur la fiche),
 * elle ne fait que **grouper le regard**.*
 */

const STORAGE_KEY_SEARCH = 'users_search';
const STORAGE_KEY_ROLE = 'users_role';

/** L'ordre de lecture des rôles, du plus nombreux au plus rare (05.1). */
const ROLE_ORDER: UserRole[] = ['User', 'Manager', 'Admin', 'SuperAdmin'];

/** Le pluriel du rôle, tel que la planche l'écrit sur les puces de la feuille. */
const ROLE_LABEL: Record<UserRole, string> = {
    User: 'Utilisateurs',
    Manager: 'Managers',
    Admin: 'Admins',
    SuperAdmin: 'Super admin',
};

/**
 * **La vignette teinte le rôle** (`.vig.m` / `.vig.a` / `.vig.sa` de la planche). Le
 * rôle n'a plus son mot en rangée : trois teintes le rendent d'un coup d'œil, et le
 * rôle courant — celui de la plupart des gens — garde la vignette neutre du gabarit.
 * Une teinte de moins à peindre, c'est une liste de moins à décoder.
 */
const VIGNETTE_TONE: Partial<Record<UserRole, string>> = {
    Manager: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    Admin: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    SuperAdmin: 'bg-[var(--tk-color-dark)] text-[var(--tk-color-on-dark)]',
};

/**
 * L'état du compte à droite de la rangée — les trois crans que la planche peint, et
 * rien d'autre : un compte actif ne porte pas de marque, sans quoi onze rangées
 * répètent onze fois la normale.
 *
 * Les crans suivent le lot 2 : `pending` = **invité** (mot de passe à définir), le
 * départ est le champ `departureDate` et se cumule avec « actif ».
 *
 * *La planche accorde le mot au genre de la personne (« Invitée », « Suspendue ») ;
 * la donnée ne porte pas le genre, le libellé reste donc au masculin générique.*
 */
const accountMark = (user: User): ListRowStatus | undefined => {
    if (user.status === 'inactive') return { icon: Prohibit, label: 'Suspendu', tone: 'refused' };
    if (user.status === 'pending') return { icon: EnvelopeSimple, label: 'Invité', tone: 'info' };
    if (user.departureDate) return { icon: SignOut, label: 'Départ', tone: 'pending' };
    return undefined;
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

/**
 * La puce de la feuille de filtre — `.chip` de la planche : 40 px de haut, 14 px de
 * gouttière, rayon 4, et l'aplat sombre pour l'axe posé. Quatre groupes la
 * partagent ; elle était recopiée trois fois avant que le rôle ne les rejoigne.
 */
const FilterChip: React.FC<{
    selected: boolean;
    onClick: () => void;
    /** Le décompte, quand l'axe en a un — seul le rôle le porte sur la planche. */
    count?: number;
    children: React.ReactNode;
}> = ({ selected, onClick, count, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md px-3.5 text-[15px] leading-5 transition-colors',
            selected
                ? 'bg-inverse-surface text-inverse-on-surface font-medium'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
        )}
    >
        {children}
        {typeof count === 'number' && (
            <b
                className={cn(
                    'font-medium tabular-nums',
                    selected ? 'text-[var(--tk-color-on-dark-2)]' : 'text-text-secondary',
                )}
            >
                {count}
            </b>
        )}
    </button>
);

interface UsersPageProps {
    onUserClick?: (id: string) => void;
    onViewChange: (view: ViewType) => void;
    /** Le site reçu d'un autre écran — la fiche d'un site renvoie ici, filtrée (10.1, C2). */
    initialSite?: string | null;
}

const UsersPage: React.FC<UsersPageProps> = ({ onUserClick, onViewChange, initialSite }) => {
    const { users: allUsers, equipment, deleteUser, locationData } = useData();
    const { user: currentUser, filterUsers, permissions } = useAccessControl();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const users = useMemo(() => filterUsers(allUsers), [allUsers, filterUsers]);
    const activeSuperAdminCount = useMemo(
        () =>
            allUsers.filter((user) => user.role === 'SuperAdmin' && user.status !== 'inactive')
                .length,
        [allUsers],
    );

    const [searchQuery, setSearchQuery] = useState(
        () => sessionStorage.getItem(STORAGE_KEY_SEARCH) || '',
    );
    const [roleFilter, setRoleFilter] = useState(
        () => sessionStorage.getItem(STORAGE_KEY_ROLE) || '',
    );
    const [ascending, setAscending] = useState(true);
    const selection = useSelection();

    // Filtres avancés feuille montante (05.1)
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState('Tous');
    const [siteFilter, setSiteFilter] = useState(() => initialSite || 'Tous');
    /** Vrai tant qu'on n'a pas quitté le filtre reçu d'un autre écran (04.1). */
    const [arrivedFiltered, setArrivedFiltered] = useState(() => Boolean(initialSite));
    const [statusFilter, setStatusFilter] = useState('Tous');

    // Feuille montante d'ajout (05.1)
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY_ROLE, roleFilter);
    }, [roleFilter]);

    /**
     * Ce que chaque personne détient — la donnée que la liste n'avait pas et qui
     * décide du choix d'un destinataire.
     */
    const holdings = useMemo(() => {
        const counts = new Map<string, number>();
        equipment.forEach((item) => {
            const key = item.user?.id || item.user?.email || item.user?.name;
            if (!key) return;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return (user: { id: string; email: string; name: string }) =>
            counts.get(user.id) ?? counts.get(user.email) ?? counts.get(user.name) ?? 0;
    }, [equipment]);

    const departments = useMemo(() => {
        const set = new Set<string>();
        users.forEach((u) => {
            if (u.department) set.add(u.department);
        });
        return ['Tous', ...Array.from(set)];
    }, [users]);

    const sites = useMemo(() => {
        const allSites: string[] = [];
        Object.values(locationData.sites).forEach((sList) => allSites.push(...sList));
        return ['Tous', ...Array.from(new Set(allSites))];
    }, [locationData.sites]);

    /**
     * Le compteur du bouton de filtre. **Le rôle y entre** : la passe sobre retire la
     * ligne de pastilles, donc le seul endroit qui dit « un rôle est posé » est ce
     * chiffre. L'oublier laisserait une liste réduite sans rien qui l'annonce.
     */
    const activeSheetFiltersCount = useMemo(() => {
        let count = 0;
        if (roleFilter) count += 1;
        if (departmentFilter !== 'Tous') count += 1;
        if (siteFilter !== 'Tous') count += 1;
        if (statusFilter !== 'Tous') count += 1;
        return count;
    }, [roleFilter, departmentFilter, siteFilter, statusFilter]);

    const filteredUsers = useMemo(() => {
        const searchLower = debouncedSearch.toLowerCase();
        const matching = users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                (user.department && user.department.toLowerCase().includes(searchLower));
            const matchesRole = roleFilter === '' || user.role === roleFilter;
            const matchesDept = departmentFilter === 'Tous' || user.department === departmentFilter;
            const matchesSite = siteFilter === 'Tous' || user.site === siteFilter;
            const matchesStatus =
                statusFilter === 'Tous' ||
                (statusFilter === 'Actif' && user.status === 'active') ||
                (statusFilter === 'Invité' && user.status === 'pending') ||
                (statusFilter === 'Suspendu' && user.status === 'inactive') ||
                // `pending` = invité, mot de passe à définir (sens d'`authService`). Le départ
                // est un champ à part, et peut se cumuler avec « Actif ». Lot 2, D5.
                (statusFilter === 'Départ prévu' && !!user.departureDate);

            return matchesSearch && matchesRole && matchesDept && matchesSite && matchesStatus;
        });

        // Le tri est dit, donc il est appliqué : alphabétique, réversible.
        return matching
            .slice()
            .sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name, 'fr'));
    }, [users, debouncedSearch, roleFilter, departmentFilter, siteFilter, statusFilter, ascending]);

    /** Les puces de rôle — descendues de la bande de tête dans la feuille (05.1). */
    const roleOptions = useMemo(() => {
        const counts = new Map<string, number>();
        users.forEach((user) => counts.set(user.role, (counts.get(user.role) ?? 0) + 1));

        return [
            { id: '', label: 'Tous', count: users.length },
            ...ROLE_ORDER.filter((role) => counts.has(role)).map((role) => ({
                id: role as string,
                label: ROLE_LABEL[role],
                count: counts.get(role) ?? 0,
            })),
        ];
    }, [users]);

    /**
     * **Cartes ou tableau** (recherche bureau du 08/09) — même geste que sur 04.1, même
     * mémoire, et ses propres colonnes : *Nom · Rôle · Site · Actifs portés · Dernière
     * connexion*. Ce que la carte porte en plus — la marque de compte, le service —
     * reste sur la carte et dans la fiche : cinq colonnes disent qui est là et ce qu'il
     * détient, le reste est du détail de personne.
     */
    const vue = useListView('users');
    const enTableau = vue.view === 'tableau';

    const colonnes = useMemo<DataColumn<User>[]>(
        () => [
            {
                id: 'nom',
                header: 'Nom',
                width: '240px',
                title: (user) => user.name,
                cell: (user) => <span className="text-on-surface font-medium">{user.name}</span>,
            },
            {
                id: 'role',
                header: 'Rôle',
                width: '150px',
                cell: (user) => <span className="text-text-muted">{ROLE_LABEL[user.role]}</span>,
            },
            {
                id: 'site',
                header: 'Site',
                width: '180px',
                title: (user) => user.site || user.department || undefined,
                /* Le lieu d'abord, le service à défaut — la même substitution que la
                   carte, pour que les deux formes ne racontent pas deux choses. En encre
                   secondaire, comme le rôle et l'état : `td.dim` de 05.1, seul le nom est à
                   l'encre pleine. */
                cell: (user) => (
                    <span className="text-text-muted">{user.site || user.department || '—'}</span>
                ),
            },
            {
                id: 'objets',
                header: 'Objets',
                width: '100px',
                numeric: true,
                cell: (user) => {
                    const nombre = holdings(user);
                    /* `td.num` de 05.1 — le compte en encre secondaire, et un tiret quand la
                       personne ne porte rien : la colonne se balaie pour trouver qui porte
                       beaucoup, et un zéro s'y lisait comme une valeur. */
                    return <span className="text-text-muted">{nombre > 0 ? nombre : '—'}</span>;
                },
            },
            {
                id: 'compte',
                header: 'État du compte',
                width: '160px',
                cell: (user) => {
                    /* La **même** marque que la carte — `accountMark` : un compte ne
                       change pas d'état parce qu'on l'a mis dans une colonne. Sans
                       marque, le compte est simplement actif, et la planche l'écrit. */
                    const marque = accountMark(user);
                    if (!marque) return <span className="text-text-muted">Actif</span>;
                    return (
                        <span className="flex min-w-0 items-center gap-1.5">
                            <Icon
                                glyph={marque.icon}
                                size={18}
                                className={cn('shrink-0', TONE_CLASS[marque.tone])}
                            />
                            <span className="truncate">{marque.label}</span>
                        </span>
                    );
                },
            },
        ],
        [holdings],
    );

    const selectedUsers = useMemo(
        () => filteredUsers.filter((user) => selection.isSelected(user.id)),
        [filteredUsers, selection],
    );

    const handleExport = (itemsToExport = filteredUsers) => {
        if (itemsToExport.length === 0) {
            showToast('Aucune donnée à exporter avec les filtres actuels.', 'info');
            return;
        }

        const headers = [
            'Nom',
            'Email',
            'Département',
            'Rôle',
            'Dernière connexion',
            'Pays',
            'Site',
            'Statut',
        ];
        const rows = itemsToExport.map((user) => [
            user.name,
            user.email,
            user.department || '',
            user.role,
            user.lastLogin || '',
            user.country || '',
            user.site || '',
            user.status || '',
        ]);

        const csvContent = [buildCsvLine(headers), ...rows.map((row) => buildCsvLine(row))].join(
            '\n',
        );
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const fileDate = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = `utilisateurs-${fileDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`${itemsToExport.length} compte(s) exporté(s).`, 'success');
    };

    const handleBulkDelete = () => {
        if (selection.count === 0) return;
        const ids = [...selection.selectedIds];

        /* C1 — **le sujet est nommé.** « Supprimer ce compte ? » est l'anti-exemple
           que la planche donne en toutes lettres : sur une sélection à un, c'est le
           nom qui nomme ; au-delà, c'est le compte. */
        const soleTarget = ids.length === 1 ? allUsers.find((user) => user.id === ids[0]) : null;

        requestConfirmation({
            title: soleTarget
                ? `Supprimer le compte de ${soleTarget.name} ?`
                : `Supprimer ${ids.length} comptes ?`,
            /* C2 — la conséquence, et ce qui est conservé. L'irréversibilité sort du
               corps : elle a sa ligne rouge (C4), et deux formes pour un même fait
               n'en font pas un fait plus lu. */
            message: (
                <p>
                    {soleTarget ? 'Son accès est révoqué' : 'Leurs accès sont révoqués'}{' '}
                    immédiatement. L'historique des mouvements est conservé et reste consultable
                    depuis le journal d'audit.
                </p>
            ),
            confirmText: soleTarget ? 'Supprimer le compte' : `Supprimer les ${ids.length}`,
            tone: 'destructive',
            irreversible: true,
            onConfirm: () => {
                let deleted = 0;
                let blocked = 0;
                let seeded = 0;

                ids.forEach((id) => {
                    const target = allUsers.find((user) => user.id === id);
                    const rule = canDeleteUserByRoleRule({
                        actorRole: currentUser?.role,
                        targetRole: target?.role,
                        isSelfDelete: id === currentUser?.id,
                        activeSuperAdminCount,
                    });
                    if (!rule.allowed) {
                        blocked += 1;
                        return;
                    }
                    const decision = deleteUser(id);
                    if (decision.allowed) {
                        deleted += 1;
                        if (isDemoSeedUser(id)) seeded += 1;
                    } else {
                        blocked += 1;
                    }
                });

                selection.exit();

                if (deleted > 0) showToast(`${deleted} compte(s) supprimé(s).`, 'success');
                if (seeded > 0) showToast(DEMO_RESEED_NOTICE, 'info');
                if (blocked > 0) {
                    showToast(`${blocked} compte(s) n’ont pas pu être supprimés.`, 'warning');
                }
            },
        });
    };

    const isFiltered = Boolean(
        roleFilter ||
        debouncedSearch ||
        departmentFilter !== 'Tous' ||
        siteFilter !== 'Tous' ||
        statusFilter !== 'Tous',
    );

    return (
        <>
            <ListTemplate
                title="Équipe"
                /* **Une arrivée pré-filtrée se dit** (04.1) : la provenance en toutes
                   lettres, et une sortie qui nomme sa destination. */
                origin={
                    arrivedFiltered && siteFilter !== 'Tous'
                        ? {
                              token: siteFilter,
                              from: (
                                  <span>
                                      Depuis <b>{siteFilter}</b> · fiche du site
                                  </span>
                              ),
                              clearLabel: `Voir les ${users.length} personnes de l'équipe`,
                              onClear: () => {
                                  setSiteFilter('Tous');
                                  setArrivedFiltered(false);
                              },
                              displayToken: false,
                              clearPresentation: 'more',
                          }
                        : undefined
                }
                search={{
                    value: searchQuery,
                    onChange: setSearchQuery,
                    placeholder: 'Nom, e-mail, département',
                }}
                /* `.fbtn` : un carré plein sur l'aplat de la recherche, pas un bouton
                   cerné — la planche donne au filtre le même fond que le champ qu'il
                   accompagne, et le filet en trop faisait deux formes là où il n'y a
                   qu'une bande. Sa pastille de compte est carrée (rayon 2). */
                filter={
                    <FilterButton
                        label="Filtrer"
                        count={activeSheetFiltersCount}
                        onClick={() => setIsFilterSheetOpen(true)}
                    />
                }
                count={{ total: users.length, shown: filteredUsers.length, noun: 'personnes' }}
                /* « Nom » suffit : la planche n'écrit pas le sens du tri sur la ligne du
                   décompte, elle le laisse au glyphe. */
                view={vue.canChoose ? { value: vue.view, onChange: vue.setView } : undefined}
                sort={{
                    label: 'Nom',
                    onClick: () => setAscending((previous) => !previous),
                }}
                selection={{
                    active: selection.isActive,
                    count: selection.count,
                    total: filteredUsers.length,
                    onExit: selection.exit,
                    onSelectAll: () => selection.selectAll(filteredUsers.map((user) => user.id)),
                    onClearAll: selection.clear,
                    actions: (
                        <Button variant="filled" onClick={() => handleExport(selectedUsers)}>
                            Exporter {selection.count > 1 ? `les ${selection.count}` : ''}
                        </Button>
                    ),
                    /* Le ⋮ porte les autres actes (17.2) : la colonne du débordement
                       fait 48 px et rognait le verbe à un carré muet. */
                    bulkOverflow: permissions.canManageUsers ? (
                        <BulkOverflow
                            items={[
                                {
                                    id: 'supprimer',
                                    label: 'Supprimer les comptes',
                                    icon: 'delete',
                                    destructive: true,
                                    onSelect: handleBulkDelete,
                                },
                            ]}
                        />
                    ) : undefined,
                }}
                hasRows={filteredUsers.length > 0}
                empty={
                    <ScreenState
                        icon={UsersThree}
                        title={isFiltered ? 'Personne ne correspond' : 'Aucune personne ici'}
                        description={
                            isFiltered
                                ? 'Élargissez la recherche, ou revenez à toute l’équipe.'
                                : 'Ce périmètre n’a encore aucun compte rattaché.'
                        }
                        actions={
                            isFiltered ? (
                                <Button
                                    variant="filled"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setRoleFilter('');
                                        setDepartmentFilter('Tous');
                                        setSiteFilter('Tous');
                                        setStatusFilter('Tous');
                                    }}
                                >
                                    {`Voir les ${users.length} personnes`}
                                </Button>
                            ) : permissions.canManageUsers ? (
                                /* **Le vide ouvre la même feuille que le bouton
                                   flottant** (17.1 et 17.6). Il allait droit à
                                   l'invitation : une équipe vide ne se voyait donc
                                   jamais proposer l'import d'un annuaire, qui est
                                   pourtant le geste de ce moment-là. */
                                <Button variant="filled" onClick={() => setIsAddSheetOpen(true)}>
                                    Ajouter une personne
                                </Button>
                            ) : undefined
                        }
                    />
                }
                /* Pas de pied de liste : R15 interdit la note dans l'écran, et le
                   décompte des porteurs se lit déjà rangée par rangée. */
                /* Le geste d'ajout est **déclaré**, et le gabarit le place selon le
                   régime : bouton rond au-dessus de la barre du bas (17.6), bouton jaune
                   de l'en-tête au bureau (17.11). La feuille reste à la page. */
                pageAction={
                    permissions.canManageUsers && !selection.isActive
                        ? {
                              label: 'Ajouter',
                              description: 'Ajouter une personne',
                              onClick: () => setIsAddSheetOpen(true),
                          }
                        : undefined
                }
            >
                {/*
                  **Cartes ou tableau** — la même liste, la même donnée, deux formes. Le
                  tableau lit `filteredUsers`, garde la sélection et l'état vide du
                  gabarit : c'est la forme qui change, jamais ce qu'on regarde.
                */}
                {enTableau ? (
                    <DataTable<User>
                        columns={colonnes}
                        rows={filteredUsers}
                        rowId={(user) => user.id}
                        onOpen={(user) => onUserClick?.(user.id)}
                        rowLabel={(user) => `${user.name}, ouvrir la fiche`}
                        selection={{
                            isActive: selection.isActive,
                            isSelected: (id) => selection.isSelected(id),
                            toggle: (id) => selection.toggle(id),
                        }}
                    />
                ) : (
                    filteredUsers.map((user) => {
                        const held = holdings(user);
                        /* Le lieu d'abord — c'est le fait que la planche met sous le nom.
                       À défaut de site, le service prend sa place : c'est déjà la
                       substitution que la planche dessine sur la vue « choisir un
                       destinataire », où le site est l'en-tête du groupe. */
                        const place = user.site || user.department || '—';
                        return (
                            <ListRow
                                key={user.id}
                                vignette={
                                    <span
                                        className={cn(
                                            'font-brand flex h-full w-full items-center justify-center text-[15px] font-semibold',
                                            VIGNETTE_TONE[user.role],
                                        )}
                                    >
                                        {initials(user.name)}
                                    </span>
                                }
                                title={user.name}
                                person
                                /* Deux faits, une seule phrase : « Lomé Siège · 2 objets ».
                               La charge disparaît quand elle est nulle — « aucun
                               équipement » sur six rangées sur onze était du bruit. */
                                holder={
                                    held > 0
                                        ? `${place} · ${held} objet${held > 1 ? 's' : ''}`
                                        : place
                                }
                                mark={accountMark(user)}
                                onOpen={() => onUserClick?.(user.id)}
                                selectionActive={selection.isActive}
                                selected={selection.isSelected(user.id)}
                                onToggle={() => selection.toggle(user.id)}
                                onLongPress={() => selection.enter(user.id)}
                            />
                        );
                    })
                )}
            </ListTemplate>

            {/* Feuille montante de filtrage (05.1) */}
            <BottomSheet
                open={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filtrer"
            >
                <div className="space-y-5 px-1 pb-2">
                    {/* Rôle — descendu de la bande de tête : c'est la feuille qui porte
                        désormais les trois axes de restriction (05.1). */}
                    <div>
                        <p className="text-text-muted mb-2 text-[12px] leading-4 font-medium">
                            Rôle
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {roleOptions.map((option) => (
                                <FilterChip
                                    key={option.id || 'tous'}
                                    selected={roleFilter === option.id}
                                    count={option.count}
                                    onClick={() => setRoleFilter(option.id)}
                                >
                                    {option.label}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    {/* Département — la planche ne dessine pas ce groupe, mais son intro
                        dit que le service « se filtre » depuis qu'il a quitté la rangée :
                        le retirer supprimerait l'axe que la rangée vient de céder. */}
                    <div>
                        <p className="text-text-muted mb-2 text-[12px] leading-4 font-medium">
                            Département
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {departments.map((dept) => (
                                <FilterChip
                                    key={dept}
                                    selected={departmentFilter === dept}
                                    onClick={() => setDepartmentFilter(dept)}
                                >
                                    {dept}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    {/* Site */}
                    <div>
                        <p className="text-text-muted mb-2 text-[12px] leading-4 font-medium">
                            Site
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {sites.map((s) => (
                                <FilterChip
                                    key={s}
                                    selected={siteFilter === s}
                                    onClick={() => setSiteFilter(s)}
                                >
                                    {s}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    {/* État du compte */}
                    <div>
                        <p className="text-text-muted mb-2 text-[12px] leading-4 font-medium">
                            État du compte
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['Tous', 'Actif', 'Invité', 'Suspendu', 'Départ prévu'].map((st) => (
                                <FilterChip
                                    key={st}
                                    selected={statusFilter === st}
                                    onClick={() => setStatusFilter(st)}
                                >
                                    {st}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    {/* Le pied de la feuille : deux boutons de même largeur, sans filet
                        (`.sfoot`, grille 1fr 1fr). L'effacement porte maintenant le rôle
                        aussi, sinon « Tout effacer » mentirait sur un axe. */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setRoleFilter('');
                                setDepartmentFilter('Tous');
                                setSiteFilter('Tous');
                                setStatusFilter('Tous');
                            }}
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high flex h-12 cursor-pointer items-center justify-center rounded-md text-[16px] font-medium transition-colors"
                        >
                            Tout effacer
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFilterSheetOpen(false)}
                            className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 flex h-12 cursor-pointer items-center justify-center rounded-md text-[16px] font-medium transition-colors"
                        >
                            Voir {filteredUsers.length} personnes
                        </button>
                    </div>
                </div>
            </BottomSheet>

            {/* Feuille montante d'ajout (05.1 et 05.3, colonne 1). Le pluriel est
                celui de la planche : la feuille ouvre deux chemins, dont l'un en
                crée plusieurs d'un coup. */}
            <BottomSheet
                open={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                title="Ajouter des personnes"
            >
                {/* Deux rangées `.si` séparées d'un filet, pas deux blocs à survol : la
                    planche les traite comme une liste de chemins, et leurs vignettes
                    prennent la teinte de ce qu'elles ouvrent (bleu la saisie, vert le
                    fichier). Les sous-titres disent le contrat d'entrée, pas la
                    mécanique : « Une adresse, un rôle, un site. » */}
                <div className="px-1 pb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            setIsInviteSheetOpen(true);
                        }}
                        className="flex min-h-[60px] w-full cursor-pointer items-center gap-3 py-2 text-left"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]">
                            <Icon glyph={EnvelopeSimple} size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-on-surface text-[16px] leading-6">
                                Inviter une personne
                            </p>
                            <p className="text-on-surface-variant text-[14px] leading-5">
                                Une adresse, un rôle, un site.
                            </p>
                        </div>
                        <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsAddSheetOpen(false);
                            onViewChange('import_users');
                        }}
                        className="border-outline-variant flex min-h-[60px] w-full cursor-pointer items-center gap-3 border-t py-2 text-left"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]">
                            <Icon glyph={FileCsv} size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-on-surface text-[16px] leading-6">
                                Importer une équipe
                            </p>
                            <p className="text-on-surface-variant text-[14px] leading-5">
                                Un fichier, une ligne par personne.
                            </p>
                        </div>
                        <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                    </button>
                </div>
            </BottomSheet>

            {/* 05.3 colonne 2 — inviter tient en trois réponses, dans une feuille.
                L'écran plein de huit champs reste accessible en **édition** : il sert
                à compléter une fiche, plus à en créer une. */}
            <InviteSheet
                open={isInviteSheetOpen}
                onClose={() => setIsInviteSheetOpen(false)}
                onInvited={(user) => onUserClick?.(user.id)}
                onOpenExisting={(user) => onUserClick?.(user.id)}
            />
        </>
    );
};

export default UsersPage;
