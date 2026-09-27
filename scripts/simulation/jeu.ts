/**
 * LE JEU DE SIMULATION — une organisation fictive, complète et cohérente, pour Firestore.
 *
 * Généré, jamais recopié : le même jeu à chaque lancement (générateur pseudo-aléatoire à graine
 * fixe), daté par rapport au jour du chargement pour que les âges vivent (« en retard », « cette
 * semaine »). Chargé par `charger.mjs`.
 *
 * **Deuxième version (27/09)** : la première laissait vides l'inventaire physique, les finances
 * de l'exercice clos, les fiches de modèle, les groupes d'accès, et ne montrait aucun incident,
 * aucune restitution inspectée ni aucune sortie du parc. Chaque cas d'usage a désormais ses
 * données, **dans la forme exacte que l'application écrit** (mêmes champs, mêmes événements) :
 *
 * - Accueil : « À traiter » à chaque nature, types en tension (tablettes, stations d'accueil),
 *   inventaire en cours à Abidjan, budget de l'année ; une réception à confirmer pour la
 *   manager démo, une réception et une demande à relancer pour l'employé démo ;
 * - Actifs : tous les états — attribué, en stock, proposé, remise en attente, retour en cours,
 *   réparation à chaque étape (devis à l'informatique, à la Finance, refusé ; retour en retard ;
 *   réparé à rendre à son porteur), maintenance préventive, réformé, perdu, manquant, retiré ;
 *   documents, incidents, historique des réparations, porteurs suspendus ou sur le départ ;
 * - Tâches : validation, remise, réception, retour, réparation, collecte ; « À suivre » et
 *   « Historique » (validées, refusées à chaque étape, renvoyées, annulées) ;
 * - Équipe : invitations (une expirée), un compte suspendu, un départ programmé, une note de
 *   manager, des codes PIN (`PIN_DE_SIMULATION`) ; des rôles et groupes d'accès portés ;
 * - Inventaire physique : un site à jour, un en retard, deux campagnes en cours (écarts,
 *   manquants), deux jamais vérifiés ;
 * - Finances : 2026 en cours (une enveloppe épuisée, des factures à justifier), 2025 clos avec
 *   ses dépenses, 2027 à projeter ; les factures de réparation liées aux objets ;
 * - Collecte : des machines à examiner, ambiguës, rattachées, importées, écartées ;
 * - Historique et rapports : les faits qui ont produit cet état, datés, signés, attestés.
 *
 * **Les identifiants ne reprennent jamais ceux du jeu de démonstration du code** (1 à 14) :
 * branchée sur Firestore, l'application les écarte. Les quatre premiers comptes (un par rôle)
 * deviennent les raccourcis de connexion démo de l'écran d'accueil.
 *
 * Aucun nom réel : `nomsInterdits` (les noms de la base réelle, fournis par le chargeur) écarte
 * toute combinaison qui en reproduirait un.
 */
import type {
    Approval,
    ApprovalStatus,
    AttestationMethod,
    DecisionNoteKind,
    DetectedDevice,
    Equipment,
    EquipmentIncident,
    FinanceBudget,
    FinanceExpense,
    HistoryEvent,
    RepairCase,
    User,
    UserRole,
} from '../../src/types';
import { approvalRequiresManagerGate } from '../../src/lib/businessRules';
import catalogue from './catalogue.json';
import modelesDuCatalogue from './modeles.json';

export interface DocumentDeSimulation {
    id: string;
    data: Record<string, unknown>;
}
export type JeuDeSimulation = Record<string, DocumentDeSimulation[]>;

/** Le code personnel des comptes de simulation qui en ont un — à donner aux testeurs. */
export const PIN_DE_SIMULATION = '123456';

// ---------------------------------------------------------------------------------------------
// Hasard reproductible
// ---------------------------------------------------------------------------------------------

const creerHasard = (graine: number) => {
    let etat = graine >>> 0;
    const suivant = () => {
        etat = (etat + 0x6d2b79f5) >>> 0;
        let t = etat;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const entier = (min: number, max: number) => min + Math.floor(suivant() * (max - min + 1));
    const choisir = <T>(liste: readonly T[]): T => liste[Math.floor(suivant() * liste.length)];
    const chance = (p: number) => suivant() < p;
    return { suivant, entier, choisir, chance };
};

// ---------------------------------------------------------------------------------------------
// L'organisation
// ---------------------------------------------------------------------------------------------

interface SiteDeSimulation {
    site: string;
    pays: string;
    code: string;
    effectif: number;
    indicatif: string;
    services: string[];
    locaux: string[];
    /**
     * L'âge minimal de ce qui s'y trouve, en années. L'inventaire physique compte **tout**
     * l'objet d'un site : un objet acheté après la dernière campagne ferait d'un site « à jour »
     * ou « en retard » un site « en cours ». Lomé Port a été compté il y a six semaines, Cotonou
     * il y a quatorze mois.
     */
    ageMin?: number;
}

const SITES: SiteDeSimulation[] = [
    {
        site: 'Lomé Siège',
        pays: 'Togo',
        code: 'LOM',
        effectif: 28,
        indicatif: '+228 90',
        services: ['Commercial', 'Administratif & Financier', 'Logistique', 'Technique', 'Ressources humaines', 'After Market'],
        locaux: ['Direction', 'Open space', 'Atelier', 'Salle serveur', 'Salle de réunion', 'Accueil'],
    },
    {
        site: 'Lomé Port',
        pays: 'Togo',
        code: 'LMP',
        effectif: 8,
        indicatif: '+228 91',
        services: ['Logistique', 'Location', 'Technique'],
        locaux: ['Bureau de quai', 'Entrepôt', 'Atelier'],
        ageMin: 0.25,
    },
    {
        site: 'Cotonou',
        pays: 'Bénin',
        code: 'COT',
        effectif: 8,
        indicatif: '+229 97',
        services: ['Commercial', 'Administratif & Financier', 'Technique'],
        locaux: ['Plateau', 'Atelier', 'Salle de réunion'],
        ageMin: 1.25,
    },
    {
        site: 'Abidjan',
        pays: "Côte d'Ivoire",
        code: 'ABJ',
        effectif: 8,
        indicatif: '+225 07',
        services: ['Commercial', 'Logistique', 'Technique'],
        locaux: ['Plateau', 'Entrepôt', 'Salle de réunion'],
    },
    {
        site: 'Campus Dakar',
        pays: 'Sénégal',
        code: 'DKR',
        effectif: 8,
        indicatif: '+221 77',
        services: ['Support', 'Commercial', 'Technique'],
        locaux: ['Bâtiment A', 'Bâtiment B', 'Salle serveur'],
    },
    {
        site: 'Bureau Paris',
        pays: 'France',
        code: 'PAR',
        effectif: 6,
        indicatif: '+33 6',
        services: ['Finance', 'Marketing', 'Achats'],
        locaux: ['3e étage', 'Salle de réunion'],
    },
];
const [LOME, LOME_PORT, COTONOU, ABIDJAN] = SITES;

const PRENOMS = [
    'Kossi', 'Afi', 'Yawo', 'Ama', 'Komla', 'Akouvi', 'Edem', 'Délali', 'Kafui', 'Séna', 'Mawuli',
    'Enyonam', 'Moussa', 'Aminata', 'Ibrahima', 'Awa', 'Cheikh', 'Mariama', 'Serge', 'Nadège',
    'Didier', 'Chantal', 'Hervé', 'Olivier', 'Mireille', 'Rodrigue', 'Carine', 'Fabrice', 'Estelle',
    'Yves', 'Pélagie', 'Arnaud', 'Béatrice', 'Grégoire', 'Josiane', 'Kouamé', 'Adjoua', 'Koffi',
    'Aya', 'Fousséni', 'Rachida', 'Gildas', 'Prisca', 'Elom', 'Dzifa', 'Sylvain', 'Nafissatou',
];
const NOMS = [
    'Tchalla', 'Djossou', 'Hounkpatin', 'Sow', 'Ndiaye', 'Diallo', 'Fall', 'Kouassi', 'Konan',
    'Bamba', 'Traoré', 'Koné', 'Gbaguidi', 'Akakpo', 'Dossou', 'Attisso', 'Ekoué', 'Folly',
    'Houngbo', 'Kodjo', 'Adandé', 'Sossou', 'Ahouansou', 'Zinsou', 'Tossou', 'Dègbè', 'Anani',
    'Kouadio', 'Ouattara', 'Coulibaly', 'Sarr', 'Gueye', 'Mbaye', 'Faye', 'Seck', 'Mensah',
];

const sansAccent = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const courriel = (nom: string, domaine = 'neemba.test') =>
    `${sansAccent(nom).replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')}@${domaine}`;
const avatar = (nom: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nom)}`;

// ---------------------------------------------------------------------------------------------
// Le matériel
// ---------------------------------------------------------------------------------------------

interface ModeleCatalogue {
    id: string;
    name: string;
    type: string;
    brand: string;
    specs: string;
}

const CODE_DU_TYPE: Record<string, string> = {
    Laptop: 'LPT',
    Desktop: 'DSK',
    Monitor: 'SCR',
    Phone: 'TEL',
    Tablet: 'TAB',
    DockingStation: 'DCK',
    Server: 'SRV',
    Switch: 'SW',
    Firewall: 'FW',
    AccessPoint: 'AP',
    NetworkDevice: 'NET',
    Printer: 'PRT',
    Projector: 'PRJ',
};

/** Fourchettes de prix d'achat, en XOF. */
const PRIX: Record<string, [number, number]> = {
    Laptop: [650_000, 1_250_000],
    Desktop: [450_000, 800_000],
    Monitor: [95_000, 260_000],
    Phone: [85_000, 620_000],
    Tablet: [240_000, 520_000],
    DockingStation: [120_000, 210_000],
    Server: [3_200_000, 8_500_000],
    Switch: [380_000, 2_100_000],
    Firewall: [1_100_000, 4_200_000],
    AccessPoint: [150_000, 420_000],
    NetworkDevice: [250_000, 900_000],
    Printer: [210_000, 1_600_000],
    Projector: [320_000, 720_000],
};

const ANNEES_AMORTISSEMENT: Record<string, number> = Object.fromEntries(
    (catalogue.categories as { name: string; defaultDepreciation?: { years?: number } }[]).map(
        (categorie) => [categorie.name, categorie.defaultDepreciation?.years ?? 5],
    ),
);

const FOURNISSEUR: Record<string, string> = {
    Dell: 'Dell Technologies Afrique de l’Ouest',
    HP: 'HP Inc. — distributeur CFAO Technologies',
    HPE: 'HPE — intégrateur Smart Africa',
    Lenovo: 'Lenovo — distributeur Techno Plus',
    Apple: 'iStore Lomé',
    Samsung: 'Samsung Electronics West Africa',
    Tecno: 'Tecno Mobile Togo',
    Nokia: 'HMD Global — distributeur Afrimobile',
    Cisco: 'Cisco — intégrateur Smart Africa',
    'HPE Aruba': 'HPE — intégrateur Smart Africa',
    Sophos: 'Sophos — intégrateur CyberSec Lomé',
    Fortinet: 'Fortinet — intégrateur CyberSec Lomé',
    Ubiquiti: 'Réseaux & Co',
    'Cisco Meraki': 'Cisco — intégrateur Smart Africa',
    APC: 'Schneider Electric Togo',
    Canon: 'Bureautique Plus',
    Ricoh: 'Bureautique Plus',
    Epson: 'Bureautique Plus',
    BenQ: 'Bureautique Plus',
};

const MOTIFS_DE_DEMANDE: Record<string, string[]> = {
    Laptop: [
        'Portable actuel en fin de garantie, batterie HS',
        'Nouvelle recrue, poste à équiper',
        'Déplacements chez les clients, besoin d’un poste léger',
        'Écran fissuré après une chute',
    ],
    Desktop: ['Poste d’atelier trop lent pour le logiciel de diagnostic', 'Nouveau poste d’accueil'],
    Monitor: ['Second écran pour les tableaux de bord', 'Écran principal défaillant', 'Travail sur plans'],
    Phone: ['Astreinte du week-end', 'Téléphone de terrain pour les tournées', 'Téléphone perdu, déclaration faite'],
    Tablet: ['Démonstrations clients sur salon', 'Inventaires d’entrepôt', 'Relevés de machines chez les clients'],
    DockingStation: ['Télétravail deux jours par semaine', 'Poste partagé en salle de réunion'],
};

const MOTIFS_DE_REFUS = [
    'Son équipement actuel suffit',
    'Budget épuisé sur ce poste',
    'Demande en double',
    'À revoir au prochain exercice',
];

const PRESTATAIRES = ['TechCare Lomé', 'Bureautique Plus', 'Atelier Numérique Cotonou', 'SAV Constructeur'];

/** Les libellés de preuve que l'application écrit sur l'objet (`Attestation`). */
const PREUVE: Record<AttestationMethod, string> = {
    pin: 'code PIN',
    signature: 'signature apposée',
    'pin+signature': 'code PIN, signature apposée',
};

// ---------------------------------------------------------------------------------------------
// La construction
// ---------------------------------------------------------------------------------------------

interface Options {
    maintenant: Date;
    /** Noms complets réels (en minuscules, sans accents) à ne jamais reproduire. */
    nomsInterdits?: Set<string>;
}

export const construireJeu = ({ maintenant, nomsInterdits = new Set() }: Options): JeuDeSimulation => {
    const h = creerHasard(20260927);
    const JOUR = 86_400_000;
    const MAINTENANT = maintenant.getTime();
    /** Jamais dans le futur : un fait daté d'une heure à venir n'aurait pas encore eu lieu. */
    const borne = (ms: number) => new Date(Math.min(ms, MAINTENANT - 20 * 60_000)).toISOString();
    /** Une date `jours` avant le chargement, à une heure ouvrée. */
    const ilYa = (jours: number, heure = h.entier(8, 17), minute = h.choisir([0, 10, 20, 30, 40, 50])) => {
        const d = new Date(MAINTENANT - jours * JOUR);
        d.setUTCHours(heure, minute, 0, 0);
        /* Une date à venir (un départ programmé) reste à venir ; aujourd'hui s'arrête à l'heure du chargement. */
        return jours < 0 ? d.toISOString() : borne(d.getTime());
    };
    const plus = (iso: string, heures: number) => borne(new Date(iso).getTime() + heures * 3_600_000);
    const joursDepuis = (iso: string) => Math.round((MAINTENANT - new Date(iso).getTime()) / JOUR);
    const jourSeul = (iso: string) => iso.slice(0, 10);
    const ajouterAns = (iso: string, ans: number) => {
        const d = new Date(iso);
        d.setUTCFullYear(d.getUTCFullYear() + ans);
        return jourSeul(d.toISOString());
    };

    // ----- Le journal (rempli au fil de la construction) ------------------------------------------

    const faits: HistoryEvent[] = [];
    let numeroFait = 1;
    const fait = (
        evenement: Omit<HistoryEvent, 'id' | 'isSystem' | 'isSensitive'> & {
            isSystem?: boolean;
            isSensitive?: boolean;
        },
    ) => {
        faits.push({
            isSystem: false,
            isSensitive: false,
            ...evenement,
            id: `ev-${String(numeroFait++).padStart(5, '0')}`,
        });
    };
    const signe = (acteur: User) => ({
        actorId: acteur.id,
        actorName: acteur.name,
        actorRole: acteur.role as UserRole,
    });

    // ----- Les personnes -----------------------------------------------------------------------

    const personnes: User[] = [];
    const nomsPris = new Set<string>();
    const nouveauNom = (): string => {
        for (let essai = 0; essai < 500; essai += 1) {
            const nom = `${h.choisir(PRENOMS)} ${h.choisir(NOMS)}`;
            const cle = sansAccent(nom);
            if (!nomsPris.has(cle) && !nomsInterdits.has(cle)) {
                nomsPris.add(cle);
                return nom;
            }
        }
        throw new Error('Plus de noms disponibles');
    };
    const ajouterPersonne = (personne: Omit<User, 'email' | 'avatar'> & { email?: string }) => {
        const complete: User = {
            ...personne,
            email: personne.email ?? courriel(personne.name),
            avatar: avatar(personne.name),
        };
        nomsPris.add(sansAccent(personne.name));
        personnes.push(complete);
        return complete;
    };
    const telephone = (site: SiteDeSimulation) =>
        `${site.indicatif} ${h.entier(10, 99)} ${h.entier(10, 99)} ${h.entier(10, 99)}`;
    /** La dernière connexion, telle que l'application l'écrit : ISO. */
    const connexion = (jours: number) => ilYa(jours);

    /* Les quatre personnages — les raccourcis démo, un par rôle, dans cet ordre. Ils ont tous
       leur code PIN : les testeurs attestent les remises et les réceptions avec. */
    const superAdmin = ajouterPersonne({
        id: 'u-001',
        name: 'Afi Lawson',
        role: 'SuperAdmin',
        department: 'Systèmes d’information',
        country: LOME.pays,
        site: LOME.site,
        status: 'active',
        phone: telephone(LOME),
        lastLogin: connexion(0),
        pin: PIN_DE_SIMULATION,
    });
    const adminTogo = ajouterPersonne({
        id: 'u-002',
        name: 'Komlan Agbeko',
        role: 'Admin',
        department: 'Systèmes d’information',
        country: LOME.pays,
        site: LOME.site,
        managedCountries: ['Togo', 'Bénin'],
        managerId: superAdmin.id,
        status: 'active',
        phone: telephone(LOME),
        lastLogin: connexion(0),
        pin: PIN_DE_SIMULATION,
        /* Le responsable sécurité : un rôle sur mesure, porté. */
        rbacRoleIds: ['role.custom.security_lead'],
    });
    const managerCommercial = ajouterPersonne({
        id: 'u-003',
        name: 'Sandrine Kpodar',
        role: 'Manager',
        department: 'Commercial',
        country: LOME.pays,
        site: LOME.site,
        status: 'active',
        phone: telephone(LOME),
        lastLogin: connexion(1),
        pin: PIN_DE_SIMULATION,
    });
    const employe = ajouterPersonne({
        id: 'u-004',
        name: 'Yawo Amouzou',
        role: 'User',
        department: 'Commercial',
        country: LOME.pays,
        site: LOME.site,
        managerId: managerCommercial.id,
        status: 'active',
        phone: telephone(LOME),
        lastLogin: connexion(0),
        pin: PIN_DE_SIMULATION,
    });

    /* L'informatique des autres pays. */
    let rang = 5;
    const prochainId = () => `u-${String(rang++).padStart(3, '0')}`;
    const admins: User[] = [superAdmin, adminTogo];
    for (const [pays, site, groupe] of [
        ["Côte d'Ivoire", SITES[3], undefined],
        ['Sénégal', SITES[4], 'group.it.senegal'],
        ['France', SITES[5], 'group.it.france'],
    ] as const) {
        admins.push(
            ajouterPersonne({
                id: prochainId(),
                name: nouveauNom(),
                role: 'Admin',
                department: 'Systèmes d’information',
                country: pays,
                site: site.site,
                managedCountries: [pays],
                managerId: superAdmin.id,
                status: 'active',
                phone: telephone(site),
                lastLogin: connexion(h.entier(0, 3)),
                pin: PIN_DE_SIMULATION,
                ...(groupe ? { rbacGroupIds: [groupe] } : {}),
            }),
        );
    }
    const adminDu = (pays?: string) =>
        admins.find((admin) => admin.managedCountries?.includes(pays ?? '')) ?? adminTogo;

    /* Les managers ; le reste des effectifs sous eux. */
    const managersParCle = new Map<string, User>([[`${LOME.site}|Commercial`, managerCommercial]]);
    for (const site of SITES) {
        for (const service of site.services.slice(0, site === LOME ? 3 : 1)) {
            const cle = `${site.site}|${service}`;
            if (managersParCle.has(cle)) continue;
            managersParCle.set(
                cle,
                ajouterPersonne({
                    id: prochainId(),
                    name: nouveauNom(),
                    role: 'Manager',
                    department: service,
                    country: site.pays,
                    site: site.site,
                    status: 'active',
                    phone: telephone(site),
                    lastLogin: connexion(h.entier(0, 6)),
                    pin: PIN_DE_SIMULATION,
                }),
            );
        }
    }
    const managerDe = (site: SiteDeSimulation, service: string) =>
        managersParCle.get(`${site.site}|${service}`) ??
        [...managersParCle.values()].find((manager) => manager.site === site.site) ??
        managerCommercial;

    /* Les profils qui portent un accès sur mesure (page Accès) : le contrôle de gestion à
       Paris, les ressources humaines à Lomé, un auditeur externe, deux opérateurs d'inventaire. */
    const salarie = (site: SiteDeSimulation, service: string, extra: Partial<User> = {}) =>
        ajouterPersonne({
            id: prochainId(),
            name: nouveauNom(),
            role: 'User',
            department: service,
            country: site.pays,
            site: site.site,
            managerId: managerDe(site, service).id,
            status: 'active',
            phone: telephone(site),
            lastLogin: connexion(h.entier(0, 20)),
            ...(h.chance(0.7) ? { pin: PIN_DE_SIMULATION } : {}),
            ...extra,
        });
    const controleurDeGestion = salarie(SITES[5], 'Finance', {
        rbacRoleIds: ['role.custom.finance_controller'],
        rbacGroupIds: ['group.finance.reviewers'],
        pin: PIN_DE_SIMULATION,
    });
    salarie(LOME, 'Ressources humaines', { rbacRoleIds: ['role.custom.hr'] });
    const nomAuditeur = nouveauNom();
    salarie(LOME, 'Audit externe', {
        name: nomAuditeur,
        email: courriel(nomAuditeur, 'cabinet-audit.test'),
        managerId: adminTogo.id,
        rbacRoleIds: ['role.custom.external_auditor'],
        rbacGroupIds: ['group.external.auditors'],
    });
    const operateursInventaire = [
        salarie(LOME, 'Logistique', { rbacGroupIds: ['group.audit.operators'], pin: PIN_DE_SIMULATION }),
        salarie(LOME, 'Logistique', { rbacGroupIds: ['group.audit.operators'], pin: PIN_DE_SIMULATION }),
    ];

    for (const site of SITES) {
        const dejaLa = personnes.filter((p) => p.site === site.site).length;
        const aCreer = Math.max(0, site.effectif - dejaLa);
        for (let i = 0; i < aCreer; i += 1) {
            /* Le commercial de Lomé est l'équipe du manager démo : il en reçoit davantage. */
            const service = site === LOME && i < 6 ? 'Commercial' : h.choisir(site.services);
            salarie(site, service);
        }
    }

    /* Deux invitations (une expirée), un compte suspendu, un départ programmé, une note. */
    const salaries = personnes.filter(
        (p) => p.role === 'User' && p.id !== employe.id && !p.rbacRoleIds && !p.rbacGroupIds,
    );
    const aLaPosition = (part: number) => salaries[Math.floor(part * (salaries.length - 1))];
    const [inviteA, inviteB, suspendu, partant] = [0.1, 0.45, 0.7, 0.95].map(aLaPosition);
    for (const [invite, jours] of [
        [inviteA, 2],
        [inviteB, 10],
    ] as const) {
        Object.assign(invite, {
            status: 'pending',
            invitedAt: ilYa(jours),
            invitedBy: adminTogo.name,
            invitationToken: `inv-${invite.id}-${h.entier(100000, 999999)}`,
            mustChangePassword: true,
            lastLogin: undefined,
            pin: undefined,
        });
    }
    Object.assign(suspendu, {
        status: 'inactive',
        suspendedAt: ilYa(12),
        suspendedBy: adminTogo.name,
        suspensionReason: 'Absence prolongée',
    });
    Object.assign(partant, { departureDate: jourSeul(ilYa(-9)) });
    const equipeCommerciale = personnes.filter(
        (p) => p.managerId === managerCommercial.id && p.role === 'User' && p.status === 'active',
    );
    const suivi = equipeCommerciale.find((p) => p.id !== employe.id) as User;
    suivi.managerNote = {
        text: 'Batterie de son portable faible, à remplacer avant la tournée d’octobre.',
        authorId: managerCommercial.id,
        authorName: managerCommercial.name,
        updatedAt: ilYa(3),
    };

    const actifs = personnes.filter((p) => p.status === 'active');
    const personne = (id: string) => personnes.find((p) => p.id === id) as User;
    const porteur = (p: User) => ({ id: p.id, name: p.name, email: p.email, avatar: p.avatar });

    // ----- Le matériel --------------------------------------------------------------------------

    const modeles = modelesDuCatalogue as ModeleCatalogue[];
    const modelesDuType = (type: string) => modeles.filter((modele) => modele.type === type);
    const actifsParc: Equipment[] = [];
    const compteurs = new Map<string, number>();
    let numeroActif = 1;

    const creerActif = (
        type: string,
        site: SiteDeSimulation,
        options: { ageAnnees?: number; modele?: ModeleCatalogue; local?: string | null; departement?: string } = {},
    ): Equipment => {
        const modele = options.modele ?? h.choisir(modelesDuType(type));
        const cleCompteur = `${CODE_DU_TYPE[type]}-${site.code}`;
        const numero = (compteurs.get(cleCompteur) ?? 0) + 1;
        compteurs.set(cleCompteur, numero);
        const age = Math.max(options.ageAnnees ?? h.suivant() * 4.5, site.ageMin ?? 0);
        const achat = ilYa(Math.round(age * 365) + h.entier(1, 20), 9, 0);
        const [bas, haut] = PRIX[type] ?? [100_000, 500_000];
        const id = `eq-${String(numeroActif++).padStart(4, '0')}`;
        const poste = type === 'Laptop' || type === 'Desktop';
        const memoire = modele.specs.match(/(\d+) Go/)?.[1];
        const disque = modele.specs.match(/SSD (\d+ [GT]o)/)?.[1];
        const actif: Equipment = {
            id,
            name: `${cleCompteur}-${String(numero).padStart(2, '0')}`,
            assetId: `NT-${achat.slice(0, 4)}-${String(10_000 + numeroActif).slice(-5)}`,
            type,
            /* Le nom du modèle **seul** : la fiche d'un modèle rassemble ses unités par ce nom. */
            model: modele.name,
            status: 'Disponible',
            assignmentStatus: 'NONE',
            operationalStatus: 'Actif',
            image: '',
            user: null,
            country: site.pays,
            site: site.site,
            ...(options.local === null ? {} : { local: options.local ?? h.choisir(site.locaux) }),
            department: options.departement ?? site.services[0],
            serialNumber: Array.from({ length: 10 }, () =>
                h.choisir('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'.split('')),
            ).join(''),
            financial: {
                purchasePrice: Math.round((bas + h.suivant() * (haut - bas)) / 1000) * 1000,
                purchaseDate: jourSeul(achat),
                supplier: FOURNISSEUR[modele.brand] ?? 'Distributeur agréé',
                invoiceNumber: `FA-${achat.slice(0, 4)}-${h.entier(1000, 9999)}`,
                depreciationMethod: 'linear',
                depreciationYears: ANNEES_AMORTISSEMENT[type] ?? 5,
            },
            warrantyEnd: ajouterAns(achat, type === 'Phone' || type === 'Tablet' ? 2 : 3),
            ...(poste
                ? {
                      hostname: `NT-${site.code}-${CODE_DU_TYPE[type]}${String(numero).padStart(3, '0')}`,
                      os: modele.brand === 'Apple'
                          ? 'macOS Sonoma 14.6'
                          : h.choisir(['Windows 11 Pro 23H2', 'Windows 11 Pro 24H2', 'Windows 10 Pro 22H2']),
                      ram: memoire ? `${memoire} Go` : '16 Go',
                      storage: disque ? `${disque} SSD` : '512 Go SSD',
                      securityAgents: {
                          sentinelOne: h.chance(0.92),
                          matrix42: h.chance(0.88),
                          manageEngine: h.chance(0.9),
                          lastCheckedAt: ilYa(h.entier(0, 6)),
                      },
                  }
                : {}),
        } as Equipment;
        actifsParc.push(actif);
        return actif;
    };

    /** Remettre un objet à quelqu'un — l'état confirmé, daté, attesté. */
    const remettre = (actif: Equipment, beneficiaire: User, jours: number) => {
        const admin = adminDu(beneficiaire.country);
        const methode: AttestationMethod = beneficiaire.pin
            ? h.choisir(['pin', 'pin', 'pin+signature'] as const)
            : 'signature';
        Object.assign(actif, {
            status: 'Attribué',
            assignmentStatus: 'CONFIRMED',
            user: porteur(beneficiaire),
            department: beneficiaire.department,
            assignedAt: ilYa(jours + 1),
            assignedBy: admin.id,
            assignedByName: admin.name,
            confirmedBy: beneficiaire.id,
            confirmedAt: ilYa(jours),
            handoverProof: PREUVE[methode],
        });
    };

    /* Chacun son poste ; un téléphone pour la plupart ; un écran ou une station pour certains.
       Les tablettes et les stations d'accueil sont toutes en main : ce sont les types en
       tension de l'accueil, et les demandes qui les attendent n'ont pas d'unité à proposer. */
    for (const p of personnes) {
        const site = SITES.find((s) => s.site === p.site) ?? LOME;
        if (p.status === 'pending') continue;
        const poste = creerActif(h.chance(0.72) || p.role !== 'User' ? 'Laptop' : 'Desktop', site, {
            ageAnnees: h.suivant() * 3.8,
        });
        remettre(poste, p, h.entier(20, 900));
        if (h.chance(0.62) || p.role !== 'User') remettre(creerActif('Phone', site), p, h.entier(15, 700));
        if (h.chance(0.35)) remettre(creerActif('Monitor', site), p, h.entier(15, 700));
        if (poste.type === 'Laptop' && h.chance(0.18)) {
            remettre(creerActif('DockingStation', site), p, h.entier(15, 500));
        }
        if (p.role === 'Manager' && h.chance(0.5)) remettre(creerActif('Tablet', site), p, h.entier(30, 400));
    }
    remettre(creerActif('Tablet', LOME), managerCommercial, 140);
    remettre(creerActif('Monitor', LOME), employe, 210);

    /* Le stock de chaque site, et l'infrastructure. À Abidjan, deux écrans n'ont pas de local :
       l'inventaire les compte « hors local ». */
    for (const site of SITES) {
        const grand = site === LOME;
        for (const [type, n] of [
            ['Laptop', grand ? 6 : 2],
            ['Desktop', grand ? 2 : 1],
            ['Monitor', grand ? 5 : 2],
            ['Phone', grand ? 4 : 2],
        ] as const) {
            for (let i = 0; i < n; i += 1) {
                creerActif(type, site, {
                    ageAnnees: h.suivant() * 0.9,
                    local: site === ABIDJAN && type === 'Monitor' ? null : undefined,
                });
            }
        }
        for (const [type, n] of [
            ['Server', grand ? 3 : 1],
            ['Switch', grand ? 3 : 1],
            ['Firewall', 1],
            ['AccessPoint', grand ? 4 : 2],
            ['Printer', grand ? 3 : 1],
            ['NetworkDevice', grand ? 2 : 1],
            ['Projector', grand ? 2 : 0],
        ] as const) {
            for (let i = 0; i < n; i += 1) {
                const local = type === 'Server' || type === 'Switch' || type === 'Firewall' || type === 'NetworkDevice'
                    ? site.locaux.find((l) => /serveur|entrepôt|atelier/i.test(l)) ?? site.locaux[0]
                    : undefined;
                creerActif(type, site, { local, ageAnnees: 0.5 + h.suivant() * 4 });
            }
        }
    }

    /** Les porteurs, par objet — pour choisir ceux qui vivent un incident ou une restitution. */
    const enMain = (type?: string, site?: SiteDeSimulation) =>
        actifsParc.filter(
            (a) =>
                a.assignmentStatus === 'CONFIRMED' &&
                a.user?.id &&
                (!type || a.type === type) &&
                (!site || a.site === site.site) &&
                a.user.id !== employe.id &&
                a.user.id !== managerCommercial.id,
        );
    const reserves = new Set<string>();
    const prendre = (liste: Equipment[]) => {
        const libre = liste.find((a) => !reserves.has(a.id));
        if (!libre) throw new Error('Plus d’objet disponible pour ce scénario');
        reserves.add(libre.id);
        return libre;
    };

    /** L'événement qu'écrit `applyEquipmentWrite` : lieu, preuve, statuts avant et après. */
    const faitSurObjet = (
        acteur: User,
        actif: Equipment,
        quand: string,
        type: HistoryEvent['type'],
        description: string,
        avant: { status: string; assignmentStatus?: string; user?: Partial<User> | null },
        metadata: Record<string, unknown> = {},
    ) => {
        fait({
            ...signe(acteur),
            type,
            timestamp: quand,
            targetType: 'EQUIPMENT',
            targetId: actif.id,
            targetName: actif.name,
            description,
            metadata: {
                ...(actif.site ? { location: actif.site } : {}),
                ...metadata,
                fromStatus: avant.status,
                toStatus: actif.status,
                fromAssignmentStatus: avant.assignmentStatus ?? 'NONE',
                toAssignmentStatus: actif.assignmentStatus ?? 'NONE',
                ...(actif.user?.id ? { beneficiaryId: actif.user.id, beneficiaryName: actif.user.name } : {}),
                ...(avant.user?.id && avant.user.id !== actif.user?.id
                    ? { previousUserId: avant.user.id, previousUser: avant.user.name }
                    : {}),
            },
        });
    };

    // ----- Porteurs suspendus ou sur le départ ------------------------------------------------------

    for (const actif of actifsParc.filter((a) => a.user?.id === suspendu.id)) {
        actif.holderAlert = { kind: 'suspended', since: suspendu.suspendedAt as string, userId: suspendu.id };
    }
    for (const actif of actifsParc.filter((a) => a.user?.id === partant.id)) {
        actif.holderAlert = {
            kind: 'departure',
            since: ilYa(4),
            until: partant.departureDate as string,
            userId: partant.id,
        };
    }

    // ----- Les restitutions ------------------------------------------------------------------------

    /* En cours : l'objet est « en attente », retour à réceptionner par l'informatique. Deux
       demandées par leur porteur, deux par l'informatique (dont le départ programmé). */
    const restituer = (actif: Equipment, jours: number, parLAdmin: boolean) => {
        const detenteur = personne(actif.user?.id as string);
        const admin = adminDu(actif.country);
        const avant = { status: actif.status, assignmentStatus: actif.assignmentStatus, user: actif.user };
        const quand = ilYa(jours);
        Object.assign(actif, {
            status: 'En attente',
            assignmentStatus: 'PENDING_RETURN',
            returnRequestedAt: quand,
            returnRequestedBy: parLAdmin ? admin.id : detenteur.id,
        });
        faitSurObjet(parLAdmin ? admin : detenteur, actif, quand, 'RETURN', 'Restitution initiée, en attente d’inspection IT', avant, {
            source: 'return_act_sheet',
            stage: 'initiation',
            comment: parLAdmin ? 'Départ de la société' : 'Remplacé par un poste plus récent',
            requestedBy: parLAdmin ? admin.name : detenteur.name,
        });
    };
    restituer(prendre(enMain('Laptop')), 2, false);
    restituer(prendre(enMain('Phone')), 5, false);
    for (const actif of actifsParc.filter((a) => a.user?.id === partant.id).slice(0, 2)) {
        reserves.add(actif.id);
        restituer(actif, 1, true);
    }

    /* Déjà inspectées : l'objet est revenu — en stock, en maintenance préventive, ou retiré. */
    const inspecter = (condition: string, statut: Equipment['status'], joursRetour: number) => {
        const site = h.choisir([LOME, SITES[3], SITES[4]]);
        const ancien = h.choisir(actifs.filter((p) => p.site === site.site && p.role === 'User'));
        const actif = creerActif(h.choisir(['Laptop', 'Phone', 'Monitor']), site, { ageAnnees: 2 + h.suivant() * 2 });
        remettre(actif, ancien, joursRetour + h.entier(200, 500));
        const admin = adminDu(site.pays);
        const demandee = ilYa(joursRetour + 3);
        const avant = { status: 'Attribué', assignmentStatus: 'CONFIRMED', user: actif.user };
        fait({
            ...signe(ancien),
            type: 'RETURN',
            timestamp: demandee,
            targetType: 'EQUIPMENT',
            targetId: actif.id,
            targetName: actif.name,
            description: 'Restitution initiée, en attente d’inspection IT',
            metadata: { location: site.site, source: 'return_act_sheet', stage: 'initiation', requestedBy: ancien.name, fromStatus: 'Attribué', toStatus: 'En attente', fromAssignmentStatus: 'CONFIRMED', toAssignmentStatus: 'PENDING_RETURN', beneficiaryId: ancien.id, beneficiaryName: ancien.name },
        });
        const inspectee = ilYa(joursRetour);
        Object.assign(actif, {
            status: statut,
            assignmentStatus: 'NONE',
            user: null,
            returnInspectedAt: inspectee,
            lastReturnCondition: condition,
            ...(statut === 'Retiré' ? { operationalStatus: 'Retiré' } : {}),
        });
        faitSurObjet(admin, actif, inspectee, 'RETURN', 'Restitution inspectée: équipement remis en stock', { ...avant, status: 'En attente' }, {
            source: 'return_act_sheet',
            stage: 'inspection',
            condition,
            photos: condition === 'Bon' ? 0 : 2,
            comment: condition === 'Bon' ? 'Rien à signaler' : 'Rayures sur la coque, charnière fatiguée',
            method: 'pin',
        });
        return actif;
    };
    inspecter('Bon', 'Disponible', 18);
    inspecter('Excellent', 'Disponible', 44);
    inspecter('Moyen', 'Disponible', 75);
    inspecter('Dégradé', 'En maintenance préventive', 9);
    inspecter('Hors service', 'Retiré', 33);

    // ----- Les incidents et les réparations ----------------------------------------------------------

    let numeroIncident = 1;
    /** Déclarer un incident — `declareIncident` : l'objet quitte les mains de son porteur. */
    const declarer = (actif: Equipment, jours: number, commentaire: string, issue: EquipmentIncident['outcome'] = 'immobilised') => {
        const detenteur = personne(actif.user?.id as string);
        const admin = adminDu(actif.country);
        const quand = ilYa(jours);
        const incident: EquipmentIncident = {
            id: `inc-${String(numeroIncident++).padStart(3, '0')}`,
            declaredAt: quand,
            declaredBy: admin.id,
            declaredByName: admin.name,
            outcome: issue,
            photos: issue === 'serves' ? [] : ['photo-1.jpg', 'photo-2.jpg'],
            comment: commentaire,
        };
        const avant = { status: actif.status, assignmentStatus: actif.assignmentStatus, user: actif.user };
        actif.incidents = [incident, ...(actif.incidents ?? [])];
        if (issue === 'immobilised') {
            Object.assign(actif, {
                status: 'En réparation',
                repairStartDate: quand,
                repairPreviousUser: actif.user,
                user: null,
                assignmentStatus: 'NONE',
                repair: {
                    id: `rep-${actif.id}`,
                    stage: 'declared',
                    incidentId: incident.id,
                    openedAt: quand,
                    holderId: detenteur.id,
                    holderName: detenteur.name,
                } satisfies RepairCase,
            });
            faitSurObjet(admin, actif, quand, 'REPAIR_START', 'Entrée en maintenance', avant, { source: 'incident', outcome: issue, photos: 2, method: 'pin' });
        } else if (issue === 'out_of_service') {
            Object.assign(actif, { status: 'Réformé', user: null, assignmentStatus: 'NONE', operationalStatus: 'Retiré' });
            faitSurObjet(admin, actif, quand, 'RETURN', `Retour de l'équipement (${detenteur.name})`, avant, { source: 'incident', outcome: issue, photos: 2, method: 'pin' });
        } else {
            faitSurObjet(admin, actif, quand, 'UPDATE', 'Mise à jour équipement', avant, { source: 'incident', outcome: issue, photos: 0 });
        }
        return { actif, detenteur, admin };
    };

    const repare = (actif: Equipment) => actif.repair as RepairCase;
    const deposer = (actif: Equipment, jours: number) => {
        const r = repare(actif);
        const avant = { status: actif.status, assignmentStatus: actif.assignmentStatus, user: actif.user };
        r.stage = 'deposited';
        r.deposit = { at: ilYa(jours), method: 'pin', byName: r.holderName ?? adminDu(actif.country).name };
        faitSurObjet(adminDu(actif.country), actif, r.deposit.at, 'UPDATE', 'Mise à jour équipement', avant, { source: 'repair', action: 'deposit', method: 'pin' });
    };
    const prendreEnCharge = (actif: Equipment, jours: number, options: { garantie?: boolean; devis?: number; retourDans: number }) => {
        const r = repare(actif);
        const admin = adminDu(actif.country);
        const quand = ilYa(jours);
        const prestataire = options.garantie ? 'SAV Constructeur' : h.choisir(PRESTATAIRES.filter((p) => p !== 'SAV Constructeur'));
        r.takenCharge = {
            at: quand,
            byName: admin.name,
            repairer: prestataire,
            underWarranty: Boolean(options.garantie),
            expectedReturn: jourSeul(ilYa(-options.retourDans + jours)),
            ticket: `TK-${h.entier(10000, 99999)}`,
        };
        const aLaFinance = !options.garantie && (options.devis ?? 0) > 150_000;
        if (options.devis) r.quote = { fileName: `devis-${actif.name.toLowerCase()}.pdf`, uploadedAt: quand, amount: options.devis };
        r.quoteDecision = aLaFinance
            ? { level: 'finance', status: 'pending' }
            : { level: 'it', status: 'approved', at: quand, byName: admin.name };
        r.stage = aLaFinance ? 'quote_pending' : 'at_repairer';
        if (!aLaFinance) r.sentAt = plus(quand, 2);
        Object.assign(actif, {
            repairer: prestataire,
            repairExpectedReturn: r.takenCharge.expectedReturn,
            repairCost: options.devis ?? 0,
            repairTicket: r.takenCharge.ticket,
        });
        const avant = { status: actif.status, assignmentStatus: actif.assignmentStatus, user: actif.user };
        faitSurObjet(admin, actif, quand, 'UPDATE', 'Mise à jour équipement', avant, { source: 'repair', action: 'take_charge', repairer: prestataire, quote: options.devis ?? 0 });
    };

    /* Déclarés, à déposer. */
    declarer(prendre(enMain('Laptop', LOME)), 1, 'Ne démarre plus après une coupure de courant');
    declarer(prendre([...enMain('Phone', COTONOU), ...enMain('Phone')]), 3, 'Écran fissuré, tactile inopérant');
    /* Déposés, à prendre en charge — dont un dont la Finance a refusé le devis. */
    deposer(declarer(prendre(enMain('Laptop')), 6, 'Clavier inondé').actif, 5);
    const refuse = declarer(prendre(enMain('Laptop', LOME)), 21, 'Charnière cassée, écran qui bascule').actif;
    deposer(refuse, 20);
    prendreEnCharge(refuse, 17, { devis: 420_000, retourDans: 14 });
    repare(refuse).stage = 'deposited';
    repare(refuse).quoteDecision = {
        level: 'finance',
        status: 'rejected',
        at: ilYa(12),
        byName: controleurDeGestion.name,
        reason: 'Plus cher que le remplacement : proposer un poste du stock',
    };
    /* Devis à la Finance (au-dessus du seuil de 150 000). */
    for (const [jours, devis] of [
        [8, 385_000],
        [4, 240_000],
    ] as const) {
        const { actif } = declarer(prendre(enMain(h.choisir(['Laptop', 'Phone']))), jours + 3, 'Carte mère à remplacer');
        deposer(actif, jours + 2);
        prendreEnCharge(actif, jours, { devis, retourDans: 12 });
    }
    /* Chez le prestataire : devis validé par l'informatique, sous garantie, et un retour en
       retard. */
    for (const [jours, options] of [
        [7, { devis: 95_000, retourDans: 10 }],
        [5, { garantie: true, retourDans: 15 }],
        [26, { devis: 120_000, retourDans: 20 }],
    ] as const) {
        const { actif } = declarer(prendre(enMain()), jours + 2, h.choisir(['Batterie gonflée', 'Port de charge hors d’usage', 'Écran qui clignote']));
        deposer(actif, jours + 1);
        prendreEnCharge(actif, jours, options);
    }
    /* Un incident noté sans immobiliser l'objet, et un objet réformé. */
    declarer(prendre(enMain('Laptop')), 15, 'Touche E qui accroche, utilisable', 'serves');
    declarer(prendre(enMain('Phone')), 40, 'Tombé à l’eau, carte mère oxydée', 'out_of_service');

    /* Les réparations closes : elles vivent dans `repairHistory`, et leur facture est une dépense
       de l'année (liée par `expenseId`). */
    const facturesDeReparation: { actif: Equipment; montant: number; prestataire: string; date: string; id: string }[] = [];
    let numeroDepense = 1;
    const prochaineDepense = () => `dp-${String(numeroDepense++).padStart(4, '0')}`;
    const clore = (
        actif: Equipment,
        joursOuverture: number,
        joursRetour: number,
        issue: NonNullable<RepairCase['outcome']>,
        montant: number,
    ) => {
        const detenteur = actif.user?.id ? personne(actif.user.id) : undefined;
        const admin = adminDu(actif.country);
        const prestataire = h.choisir(PRESTATAIRES);
        const retour = ilYa(joursRetour);
        const idDepense = prochaineDepense();
        const dossier: RepairCase = {
            id: `rep-${actif.id}-${joursOuverture}`,
            stage: 'at_repairer',
            openedAt: ilYa(joursOuverture),
            holderId: detenteur?.id,
            holderName: detenteur?.name,
            deposit: { at: ilYa(joursOuverture - 1), method: 'pin', byName: detenteur?.name ?? admin.name },
            takenCharge: { at: ilYa(joursOuverture - 2), byName: admin.name, repairer: prestataire, underWarranty: false, expectedReturn: jourSeul(ilYa(joursRetour + 2)), ticket: `TK-${h.entier(10000, 99999)}` },
            quote: { fileName: 'devis.pdf', uploadedAt: ilYa(joursOuverture - 2), amount: montant },
            quoteDecision: { level: montant > 150_000 ? 'finance' : 'it', status: 'approved', at: ilYa(joursOuverture - 3), byName: montant > 150_000 ? controleurDeGestion.name : admin.name },
            sentAt: ilYa(joursOuverture - 3),
            returnedAt: retour,
            outcome: issue,
            invoice: { fileName: `facture-${prestataire.toLowerCase().replace(/\W+/g, '-')}.pdf`, uploadedAt: retour, amount: montant, supplier: prestataire, expenseId: idDepense },
            closedAt: retour,
        };
        actif.repairHistory = [dossier, ...(actif.repairHistory ?? [])];
        actif.repairEndDate = retour;
        facturesDeReparation.push({ actif, montant, prestataire, date: jourSeul(retour), id: idDepense });
        fait({ ...signe(admin), type: 'REPAIR_START', timestamp: dossier.openedAt, targetType: 'EQUIPMENT', targetId: actif.id, targetName: actif.name, description: 'Entrée en maintenance', metadata: { location: actif.site, source: 'incident', outcome: 'immobilised', fromStatus: 'Attribué', toStatus: 'En réparation', ...(detenteur ? { previousUserId: detenteur.id, previousUser: detenteur.name } : {}) } });
        fait({ ...signe(admin), type: 'REPAIR_END', timestamp: retour, targetType: 'EQUIPMENT', targetId: actif.id, targetName: actif.name, description: 'Fin de maintenance', metadata: { location: actif.site, source: 'repair', action: 'receive', outcome: issue, fromStatus: 'En réparation', toStatus: issue === 'irreparable' ? 'Retiré' : 'Attribué' } });
    };
    for (const [ouverture, retour, issue, montant] of [
        [70, 58, 'repaired', 68_000],
        [130, 115, 'diminished', 45_000],
        [200, 184, 'repaired', 175_000],
    ] as const) {
        clore(prendre(enMain()), ouverture, retour, issue, montant);
    }
    const irreparable = prendre(enMain('Laptop'));
    clore(irreparable, 95, 80, 'irreparable', 35_000);
    Object.assign(irreparable, { status: 'Retiré', operationalStatus: 'Retiré', assignmentStatus: 'NONE', user: null });

    /* Réparé hier, à rendre à son porteur — l'employé démo confirme la réception. */
    const aRendre = actifsParc.find((a) => a.user?.id === employe.id && a.type === 'Phone') ??
        (() => {
            const t = creerActif('Phone', LOME, { ageAnnees: 1 });
            remettre(t, employe, 300);
            return t;
        })();
    reserves.add(aRendre.id);
    clore(aRendre, 16, 1, 'repaired', 68_000);
    /* La remise repart du retour de réparation : la réception à confirmer date d'hier, pas de
       la première remise. */
    Object.assign(aRendre, {
        status: 'En attente',
        assignmentStatus: 'PENDING_DELIVERY',
        repairPreviousUser: undefined,
        assignedAt: ilYa(1),
        assignedBy: adminTogo.id,
        assignedByName: adminTogo.name,
        confirmedAt: undefined,
        confirmedBy: undefined,
    });

    /* Perdu, retirés en fin de vie, et ce qui a quitté le parc (l'objet disparaît, l'événement
       reste — `deleteEquipment`). */
    /* À Dakar, jamais inventorié : un site compté le retrouverait « en place ». */
    const perdu = prendre([...enMain('Phone', SITES[4]), ...enMain('Phone')]);
    const avantPerdu = { status: perdu.status, assignmentStatus: perdu.assignmentStatus, user: perdu.user };
    Object.assign(perdu, { status: 'Perdu', assignmentStatus: 'NONE', user: null });
    faitSurObjet(adminDu(perdu.country), perdu, ilYa(35), 'RETURN', `Retour de l'équipement (${avantPerdu.user?.name})`, avantPerdu, { comment: 'Déclaré perdu lors d’une tournée' });
    for (let i = 0; i < 6; i += 1) {
        const site = h.choisir([LOME, SITES[3], SITES[4], SITES[5]]);
        const actif = creerActif(h.choisir(['Laptop', 'Desktop', 'Monitor', 'Phone']), site, { ageAnnees: 4.6 + h.suivant() * 2 });
        Object.assign(actif, { status: 'Retiré', operationalStatus: 'Retiré' });
    }
    for (const [motif, nom, jours] of [
        ['end_of_life', 'LPT-LOM-98', 60],
        ['sold', 'LPT-LOM-99', 120],
        ['lost', 'TEL-ABJ-97', 45],
        ['end_of_life', 'SCR-DKR-96', 200],
    ] as const) {
        fait({
            ...signe(adminTogo),
            type: 'DELETE',
            timestamp: ilYa(jours),
            targetType: 'EQUIPMENT',
            targetId: `eq-sorti-${nom.toLowerCase()}`,
            targetName: nom,
            description: `Sortie du parc de ${nom} — ${{ end_of_life: 'Fin de vie', sold: 'Vendu ou donné', lost: 'Volé ou perdu' }[motif]}`,
            metadata: { retirementReason: motif, method: 'pin' },
        });
    }

    /* Des documents joints (factures, bons de livraison) sur une partie du parc récent. */
    for (const actif of actifsParc.filter((a) => (a.financial?.purchaseDate ?? '') > jourSeul(ilYa(500))).slice(0, 24)) {
        actif.documents = [
            { id: `doc-${actif.id}-1`, name: `Facture ${actif.financial?.invoiceNumber}.pdf`, type: 'Facture', url: '', size: `${h.entier(90, 420)} Ko`, date: actif.financial?.purchaseDate as string },
            ...(h.chance(0.5) ? [{ id: `doc-${actif.id}-2`, name: 'Bon de livraison.pdf', type: 'Bon de livraison', url: '', size: `${h.entier(60, 200)} Ko`, date: actif.financial?.purchaseDate as string }] : []),
        ];
    }

    // ----- Les demandes --------------------------------------------------------------------------

    const demandes: Approval[] = [];
    let numeroDemande = 1;
    const TYPES_DEMANDES = ['Laptop', 'Monitor', 'Phone', 'DockingStation', 'Tablet', 'Desktop'] as const;
    const COUT: Record<string, number> = {
        Laptop: 980_000,
        Monitor: 165_000,
        Phone: 320_000,
        DockingStation: 150_000,
        Tablet: 390_000,
        Desktop: 610_000,
    };

    const nouvelleDemande = (
        beneficiaire: User,
        statut: ApprovalStatus,
        options: { age: number; type?: string; demandeur?: User; urgence?: Approval['urgency'] },
    ): Approval => {
        const type = options.type ?? h.choisir(TYPES_DEMANDES);
        const modele = h.choisir(modelesDuType(type));
        const demandeur = options.demandeur ?? beneficiaire;
        const creee = ilYa(options.age);
        const demande: Approval = {
            id: `dm-${String(numeroDemande++).padStart(4, '0')}`,
            requesterId: demandeur.id,
            requesterName: demandeur.name,
            requesterRole: demandeur.role,
            beneficiaryId: beneficiaire.id,
            beneficiaryName: beneficiaire.name,
            isDelegated: demandeur.id !== beneficiaire.id,
            equipmentCategory: type,
            equipmentModel: modele.name,
            reason: h.choisir(MOTIFS_DE_DEMANDE[type] ?? ['Besoin de service']),
            urgency: options.urgence ?? (h.chance(0.25) ? 'high' : h.chance(0.3) ? 'low' : 'normal'),
            estimatedCost: COUT[type],
            status: statut,
            createdAt: creee,
            updatedAt: creee,
            equipmentName: `${modele.brand} ${modele.name}`,
            equipmentType: type,
            requestType: 'Attribution',
            requester: demandeur.name,
            requestDate: jourSeul(creee),
            image: '',
        };
        demandes.push(demande);
        return demande;
    };

    const equipe = (manager: User) => actifs.filter((p) => p.managerId === manager.id && p.role === 'User');
    /* Les tirages au hasard épargnent l'employé démo : ses scénarios sont écrits un à un. */
    const avecManager = actifs.filter((p) => p.role === 'User' && p.managerId && !p.rbacRoleIds && p.id !== employe.id);
    const piocher = (liste: User[]) => liste[h.entier(0, liste.length - 1)];

    /* Chez le manager démo : cinq validations, dont une urgente et deux en retard. */
    const equipeDeSandrine = equipe(managerCommercial).filter((p) => p.id !== employe.id);
    [2, 9, 12, 4, 0].forEach((age, i) =>
        nouvelleDemande(equipeDeSandrine[(i + 1) % equipeDeSandrine.length], 'WAITING_MANAGER_APPROVAL', {
            age,
            urgence: i === 3 ? 'high' : undefined,
        }),
    );
    /* L'employé démo attend depuis neuf jours : « Relancer » lui est offert. */
    nouvelleDemande(employe, 'WAITING_MANAGER_APPROVAL', { age: 9, type: 'DockingStation' });
    /* Chez les autres managers ; une déjà relancée. */
    for (let i = 0; i < 6; i += 1) {
        const beneficiaire = piocher(avecManager.filter((p) => p.managerId !== managerCommercial.id));
        const d = nouvelleDemande(beneficiaire, 'WAITING_MANAGER_APPROVAL', { age: [0, 3, 6, 11, 15, 22][i] });
        if (i === 5) d.remindedAt = ilYa(4);
    }

    /* Validées, à l'informatique : les remises à faire (tablettes et stations comprises, sans
       unité en stock — ce sont elles qui tendent l'accueil). */
    const valider = (demande: Approval, joursApres: number) => {
        demande.status = 'WAITING_IT_PROCESSING';
        demande.updatedAt = borne(new Date(demande.createdAt).getTime() + joursApres * JOUR);
    };
    for (let i = 0; i < 9; i += 1) {
        const demande = nouvelleDemande(piocher(avecManager), 'WAITING_MANAGER_APPROVAL', {
            age: [1, 3, 6, 9, 14, 2, 20, 0, 4][i],
            urgence: i === 0 || i === 5 ? 'high' : undefined,
            type: i === 2 ? 'Tablet' : i === 6 ? 'DockingStation' : undefined,
        });
        valider(demande, 0.4);
    }
    /* Déposées pour d'autres : par un manager pour son équipe, par l'informatique pour une
       arrivée. */
    const deposee = nouvelleDemande(equipeDeSandrine[1], 'WAITING_IT_PROCESSING', { age: 3, demandeur: managerCommercial, type: 'Laptop' });
    deposee.reason = 'Nouvelle recrue, poste à équiper';
    nouvelleDemande(piocher(avecManager.filter((p) => p.country === 'Sénégal')), 'WAITING_IT_PROCESSING', {
        age: 1,
        demandeur: admins[3],
        type: 'Phone',
    }).reason = 'Arrivée lundi, ligne à ouvrir';

    /* Une unité proposée, en attente de la dotation ; des réceptions à confirmer. */
    const stockLibre = (type: string, site?: string) =>
        actifsParc.find((a) => a.type === type && a.status === 'Disponible' && !reserves.has(a.id) && (!site || a.site === site));
    const proposer = (demande: Approval, statut: 'WAITING_DOTATION_APPROVAL' | 'PENDING_DELIVERY') => {
        const beneficiaire = personne(demande.beneficiaryId);
        const unite = stockLibre(demande.equipmentCategory, beneficiaire.site) ?? stockLibre(demande.equipmentCategory);
        if (!unite) return false;
        reserves.add(unite.id);
        demande.status = statut;
        demande.assignedEquipmentId = unite.id;
        demande.assignedEquipmentName = unite.name;
        demande.equipmentModel = unite.model;
        demande.updatedAt = ilYa(Math.max(0, joursDepuis(demande.createdAt) - 2));
        const admin = adminDu(unite.country);
        Object.assign(unite, {
            status: 'En attente',
            assignmentStatus: statut,
            assignedAt: demande.updatedAt,
            assignedBy: admin.id,
            assignedByName: admin.name,
            ...(statut === 'PENDING_DELIVERY' ? { user: porteur(beneficiaire) } : {}),
        });
        return true;
    };
    for (let i = 0; i < 3; i += 1) {
        const demande = nouvelleDemande(piocher(avecManager), 'WAITING_IT_PROCESSING', {
            age: [4, 8, 11][i],
            type: h.choisir(['Laptop', 'Monitor', 'Phone']),
        });
        proposer(demande, approvalRequiresManagerGate(demande, personnes) ? 'WAITING_DOTATION_APPROVAL' : 'PENDING_DELIVERY');
    }
    for (const [beneficiaire, age, type] of [
        [employe, 2, 'Monitor'],
        /* La manager démo a, elle aussi, une réception à confirmer. */
        [managerCommercial, 3, 'Monitor'],
        [piocher(avecManager), 6, 'Laptop'],
        [piocher(avecManager), 9, 'Phone'],
        [piocher(avecManager), 1, 'Laptop'],
    ] as const) {
        proposer(nouvelleDemande(beneficiaire, 'WAITING_IT_PROCESSING', { age, type }), 'PENDING_DELIVERY');
    }

    /* L'historique : reçues, refusées à chaque étape, renvoyée, annulées. */
    for (let i = 0; i < 14; i += 1) {
        const beneficiaire = piocher(avecManager);
        const demande = nouvelleDemande(beneficiaire, 'Completed', { age: h.entier(20, 160) });
        const site = SITES.find((s) => s.site === beneficiaire.site) ?? LOME;
        const unite = creerActif(demande.equipmentCategory, site, { ageAnnees: joursDepuis(demande.createdAt) / 365 });
        remettre(unite, beneficiaire, Math.max(1, joursDepuis(demande.createdAt) - 5));
        demande.assignedEquipmentId = unite.id;
        demande.assignedEquipmentName = unite.name;
        demande.equipmentModel = unite.model;
        demande.updatedAt = unite.confirmedAt as string;
    }
    const refuser = (demande: Approval, kind: DecisionNoteKind, acteur: User, raison: string, statut: ApprovalStatus = 'Rejected') => {
        demande.status = statut;
        demande.updatedAt = ilYa(Math.max(1, joursDepuis(demande.createdAt) - 2));
        demande.decisionNote = { kind, reason: raison, actorId: acteur.id, actorName: acteur.name, at: demande.updatedAt, method: 'code PIN' };
    };
    for (let i = 0; i < 3; i += 1) {
        const b = piocher(avecManager);
        refuser(nouvelleDemande(b, 'Rejected', { age: h.entier(10, 90) }), 'MANAGER_REJECT', personne(b.managerId as string), h.choisir(MOTIFS_DE_REFUS));
    }
    {
        const b = piocher(avecManager);
        refuser(nouvelleDemande(b, 'Rejected', { age: 25, type: 'Laptop' }), 'IT_REJECT', adminDu(b.country), 'Modèle hors catalogue : refaire la demande sur un modèle référencé');
        const c = piocher(avecManager);
        refuser(nouvelleDemande(c, 'Rejected', { age: 30, type: 'Monitor' }), 'DELIVERY_REJECT', c, 'L’écran livré a un pixel mort');
        const d = piocher(avecManager.filter((p) => p.site === LOME.site));
        const renvoyee = nouvelleDemande(d, 'WAITING_IT_PROCESSING', { age: 13, type: 'Laptop' });
        refuser(renvoyee, 'DOTATION_REJECT', personne(d.managerId as string), 'Proposer un modèle moins cher', 'WAITING_IT_PROCESSING');
    }
    for (let i = 0; i < 2; i += 1) {
        const b = piocher(avecManager);
        const demande = nouvelleDemande(b, 'Cancelled', { age: h.entier(8, 60) });
        demande.updatedAt = ilYa(Math.max(1, joursDepuis(demande.createdAt) - 1));
        demande.decisionNote = { kind: 'CANCEL', reason: 'Plus besoin, un poste s’est libéré dans le service', actorId: b.id, actorName: b.name, at: demande.updatedAt };
    }

    // ----- L'inventaire physique ----------------------------------------------------------------

    /**
     * Un comptage, tel que l'application l'écrit (`audit_scan`). Il est compté pour le local
     * de l'objet (`scopeLocal` = son local, ou vide hors local).
     */
    const compter = (actif: Equipment, quand: string, acteur: User) => {
        fait({
            ...signe(acteur),
            type: 'UPDATE',
            timestamp: quand,
            targetType: 'EQUIPMENT',
            targetId: actif.id,
            targetName: actif.name,
            description: 'Mise à jour équipement',
            metadata: {
                source: 'audit_scan',
                scannedAt: quand,
                scopeCountry: actif.country,
                scopeSite: actif.site,
                scopeLocal: actif.local ?? '',
                location: actif.site,
                fromStatus: actif.status,
                toStatus: actif.status,
                fromAssignmentStatus: actif.assignmentStatus ?? 'NONE',
                toAssignmentStatus: actif.assignmentStatus ?? 'NONE',
            },
        });
    };
    const duSite = (site: SiteDeSimulation) => actifsParc.filter((a) => a.site === site.site);

    /* Lomé Port, compté il y a six semaines : à jour. */
    for (const actif of duSite(LOME_PORT)) compter(actif, ilYa(h.entier(40, 42)), operateursInventaire[0]);
    /* Cotonou, compté il y a quatorze mois : en retard. */
    for (const actif of duSite(COTONOU)) compter(actif, ilYa(h.entier(420, 423)), adminTogo);
    /* Lomé Siège : trois locaux comptés il y a cinq mois ; deux objets de l'accueil manquaient,
       la campagne les a déclarés manquants à sa clôture (`audit_finalize`). */
    {
        const accueil = duSite(LOME).filter((a) => a.local === 'Accueil' && a.status === 'Disponible' && !reserves.has(a.id));
        const manquants = accueil.slice(0, 2);
        for (const actif of duSite(LOME).filter((a) => ['Salle serveur', 'Direction', 'Accueil'].includes(a.local ?? ''))) {
            if (manquants.includes(actif)) continue;
            compter(actif, ilYa(h.entier(148, 152)), operateursInventaire[1]);
        }
        for (const actif of manquants) {
            const quand = ilYa(147);
            fait({
                ...signe(adminTogo),
                type: 'UPDATE',
                timestamp: quand,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: 'Mise à jour équipement',
                metadata: { source: 'audit_finalize', reason: 'missing_in_place', scopeCountry: actif.country, scopeSite: actif.site, scopeLocal: 'Accueil', location: actif.site, fromStatus: 'Disponible', toStatus: 'Manquant' },
            });
            Object.assign(actif, { status: 'Manquant', local: undefined, notes: 'Audit: non retrouvé dans Accueil' });
        }
    }
    /* Abidjan : la campagne en cours — six objets sur dix comptés depuis trois jours, le dernier
       ce matin (la carte « Inventaire en cours » de l'accueil), et deux écarts rattachés. */
    {
        const abidjan = duSite(ABIDJAN);
        const comptes = abidjan.filter((_, i) => i % 5 !== 1 && i % 5 !== 3);
        const admin = adminDu(ABIDJAN.pays);
        comptes.forEach((actif, i) => {
            const jours = i < comptes.length - 3 ? h.entier(1, 3) : 0;
            compter(actif, jours === 0 ? ilYa(0, 7, 10 + i * 5) : ilYa(jours), admin);
        });
        for (const actif of comptes.slice(0, 2)) {
            fait({
                ...signe(admin),
                type: 'UPDATE',
                timestamp: ilYa(1),
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: `Rattaché à ${actif.local ?? 'ce site'}`,
                metadata: { source: 'audit_scan_alignment', scopeCountry: actif.country, scopeSite: actif.site, scopeLocal: actif.local ?? '', location: actif.site },
            });
        }
    }

    // ----- Le journal des faits de base -----------------------------------------------------------

    const METHODE_DE: Record<string, AttestationMethod> = { 'code PIN': 'pin', 'signature apposée': 'signature', 'code PIN, signature apposée': 'pin+signature' };
    for (const actif of actifsParc) {
        const admin = adminDu(actif.country);
        fait({
            ...signe(admin),
            type: 'CREATE',
            timestamp: `${actif.financial?.purchaseDate ?? jourSeul(ilYa(400))}T10:00:00.000Z`,
            targetType: 'EQUIPMENT',
            targetId: actif.id,
            targetName: `${actif.model} (${actif.assetId})`,
            description: 'Création de l’équipement',
            metadata: { location: actif.site },
        });
        const detenteur = actif.user?.id ? actif.user : actif.repairPreviousUser?.id ? actif.repairPreviousUser : undefined;
        if (actif.assignedAt && detenteur?.id) {
            const methode = METHODE_DE[actif.handoverProof ?? ''] ?? 'pin';
            fait({
                ...signe(admin),
                type: 'ASSIGN_PENDING',
                timestamp: actif.assignedAt,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: `Attribution initiée pour ${detenteur.name}`,
                metadata: { location: actif.site, proof: actif.handoverProof, method: methode, fromStatus: 'Disponible', toStatus: 'En attente', fromAssignmentStatus: 'NONE', toAssignmentStatus: 'PENDING_DELIVERY', beneficiaryId: detenteur.id, beneficiaryName: detenteur.name },
            });
            if (actif.confirmedAt) {
                fait({
                    ...signe(personne(detenteur.id as string)),
                    type: 'ASSIGN_CONFIRMED',
                    timestamp: actif.confirmedAt,
                    targetType: 'EQUIPMENT',
                    targetId: actif.id,
                    targetName: actif.name,
                    description: `Équipement attribué à ${detenteur.name}`,
                    metadata: { location: actif.site, method: methode, fromStatus: 'En attente', toStatus: 'Attribué', fromAssignmentStatus: 'PENDING_DELIVERY', toAssignmentStatus: 'CONFIRMED', beneficiaryId: detenteur.id, beneficiaryName: detenteur.name },
                });
            }
        }
    }

    /* Le parcours de chaque demande, tel que l'application le journalise (`metadata.from/to`). */
    for (const demande of demandes) {
        const demandeur = personne(demande.requesterId);
        const beneficiaire = personne(demande.beneficiaryId);
        const manager = beneficiaire.managerId ? personne(beneficiaire.managerId) : undefined;
        const admin = adminDu(beneficiaire.country);
        const cible = { targetType: 'APPROVAL' as const, targetId: demande.id, targetName: `Demande de ${demande.requesterName}` };
        const t0 = new Date(demande.createdAt).getTime();
        const a = (heures: number) => borne(t0 + heures * 3_600_000);
        fait({ ...signe(demandeur), ...cible, type: 'APPROVAL_CREATE', timestamp: demande.createdAt, description: `Demande : ${demande.equipmentCategory}` });

        const passeParLeManager = approvalRequiresManagerGate(demande, personnes);
        const transition = (acteur: User, type: HistoryEvent['type'], de: ApprovalStatus, vers: ApprovalStatus, heures: number, raison?: string) =>
            fait({ ...signe(acteur), ...cible, type, timestamp: a(heures), description: `Statut mis à jour: ${vers}`, metadata: { from: de, to: vers, ...(raison ? { reason: raison } : {}) } });

        const note = demande.decisionNote;
        const rang = { WAITING_MANAGER_APPROVAL: 0, WAITING_IT_PROCESSING: 1, WAITING_DOTATION_APPROVAL: 2, PENDING_DELIVERY: 3, Completed: 4 }[demande.status as string];
        if (passeParLeManager && manager && ((rang ?? 0) >= 1 || note?.kind === 'IT_REJECT' || note?.kind === 'DELIVERY_REJECT')) {
            transition(manager, 'APPROVAL_MANAGER', 'WAITING_MANAGER_APPROVAL', 'WAITING_IT_PROCESSING', 9);
        }
        if (note?.kind === 'DOTATION_REJECT' && manager) {
            transition(admin, 'ASSIGN_DOTATION_WAIT', 'WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL', 30);
            fait({ ...signe(manager), ...cible, type: 'APPROVAL_DOTATION_REJECT', timestamp: demande.updatedAt, description: 'Statut mis à jour: WAITING_IT_PROCESSING', metadata: { from: 'WAITING_DOTATION_APPROVAL', to: 'WAITING_IT_PROCESSING', reason: note.reason } });
        }
        if ((rang ?? 0) >= 2 && passeParLeManager && note?.kind !== 'DOTATION_REJECT') {
            transition(admin, 'ASSIGN_DOTATION_WAIT', 'WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL', 30);
        }
        if ((rang ?? 0) >= 3 || note?.kind === 'DELIVERY_REJECT') {
            if (passeParLeManager && manager) transition(manager, 'ASSIGN_PENDING', 'WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 40);
            else transition(admin, 'ASSIGN_PENDING', 'WAITING_IT_PROCESSING', 'PENDING_DELIVERY', 30);
        }
        if (demande.status === 'Completed') {
            fait({ ...signe(beneficiaire), ...cible, type: 'ASSIGN_CONFIRMED', timestamp: demande.updatedAt, description: 'Statut mis à jour: Completed', metadata: { from: 'PENDING_DELIVERY', to: 'Completed', beneficiaryId: beneficiaire.id } });
        }
        if (demande.status === 'Rejected' && note) {
            const de = { MANAGER_REJECT: 'WAITING_MANAGER_APPROVAL', IT_REJECT: 'WAITING_IT_PROCESSING', DELIVERY_REJECT: 'PENDING_DELIVERY' }[note.kind as string] ?? 'WAITING_MANAGER_APPROVAL';
            fait({ ...signe(personne(note.actorId)), ...cible, type: 'APPROVAL_REJECT', timestamp: demande.updatedAt, description: 'Statut mis à jour: Rejected', metadata: { from: de, to: 'Rejected', reason: note.reason } });
        }
        if (demande.status === 'Cancelled') {
            fait({ ...signe(demandeur), ...cible, type: 'APPROVAL_CANCEL', timestamp: demande.updatedAt, description: 'Statut mis à jour: Cancelled', metadata: { from: 'WAITING_MANAGER_APPROVAL', to: 'Cancelled' } });
        }
    }

    /* Les comptes, les accès, la sécurité. */
    for (const p of actifs.slice(0, 30)) {
        fait({ ...signe(p), type: 'LOGIN', timestamp: ilYa(h.entier(1, 14)), targetType: 'USER', targetId: p.id, targetName: p.name, description: 'Connexion réussie (Email)' });
    }
    for (const invite of [inviteA, inviteB]) {
        fait({ ...signe(adminTogo), type: 'CREATE', timestamp: invite.invitedAt as string, targetType: 'USER', targetId: invite.id, targetName: invite.name, description: 'Compte créé, invitation envoyée' });
    }
    fait({ ...signe(adminTogo), type: 'UPDATE', timestamp: suspendu.suspendedAt as string, targetType: 'USER', targetId: suspendu.id, targetName: suspendu.name, description: 'Compte suspendu', metadata: { accountStatus: 'inactive', reason: suspendu.suspensionReason } });
    fait({ ...signe(adminTogo), type: 'UPDATE', timestamp: ilYa(4), targetType: 'USER', targetId: partant.id, targetName: partant.name, description: 'Départ programmé', metadata: { departureDate: partant.departureDate } });
    for (const p of personnes.filter((q) => q.rbacRoleIds || q.rbacGroupIds)) {
        fait({ ...signe(superAdmin), type: 'UPDATE', timestamp: ilYa(h.entier(20, 90)), targetType: 'USER', targetId: p.id, targetName: p.name, description: `Accès modifiés pour ${p.name}`, metadata: { source: 'rbac_assignments', roleIds: p.rbacRoleIds ?? [], groupIds: p.rbacGroupIds ?? [] } });
    }
    for (const [jours, rapport] of [
        [2, 'Inventaire complet'],
        [9, 'Garanties qui expirent'],
        [23, 'Équipement vieillissant'],
    ] as const) {
        fait({ ...signe(h.choisir([superAdmin, adminTogo])), type: 'EXPORT', timestamp: ilYa(jours), targetType: 'SYSTEM', targetId: 'rapports', targetName: rapport, description: `Export : ${rapport}`, isSensitive: true });
    }
    fait({ ...signe(controleurDeGestion), type: 'SECURITY_STEP_UP', timestamp: ilYa(12), targetType: 'SYSTEM', targetId: 'finance', targetName: 'Finances', description: 'Code demandé avant de trancher un devis', isSensitive: true });
    fait({ ...signe(superAdmin), type: 'UPDATE', timestamp: ilYa(30), targetType: 'SYSTEM', targetId: 'settings', targetName: 'Paramètres', description: 'Seuil de devis réglé à 150 000 XOF' });
    faits.sort((x, y) => x.timestamp.localeCompare(y.timestamp));

    // ----- La collecte --------------------------------------------------------------------------

    const machines: DetectedDevice[] = [];
    const postes = actifsParc.filter((a) => a.type === 'Laptop' && a.assignmentStatus === 'CONFIRMED');
    const machine = (i: number, statut: DetectedDevice['status'], extra: Partial<DetectedDevice> = {}): DetectedDevice => {
        const site = h.choisir(SITES);
        const utilisateur = h.choisir(actifs.filter((p) => p.site === site.site));
        return {
            id: `dd-${String(i).padStart(3, '0')}`,
            source: h.choisir(['agent', 'agent', 'active_directory', 'network_scan'] as const),
            fingerprint: `fp-${h.entier(100000, 999999)}`,
            machineName: `NT-${site.code}-PC${String(h.entier(100, 999))}`,
            hostname: `nt-${site.code.toLowerCase()}-pc${h.entier(100, 999)}.neemba.local`,
            serialNumber: `SN${h.entier(10_000_000, 99_999_999)}`,
            os: h.choisir(['Windows 11 Pro 24H2', 'Windows 10 Pro 22H2']),
            ram: h.choisir(['8 Go', '16 Go']),
            storage: h.choisir(['256 Go SSD', '512 Go SSD']),
            cpu: h.choisir(['Intel Core i5-1245U', 'Intel Core i7-1265U', 'AMD Ryzen 5 PRO 5650U']),
            currentUserName: utilisateur.name,
            currentUserEmail: utilisateur.email,
            macAddress: Array.from({ length: 6 }, () => h.entier(16, 255).toString(16)).join(':'),
            ipAddress: `10.${SITES.indexOf(site) + 10}.${h.entier(1, 20)}.${h.entier(10, 250)}`,
            domain: 'NEEMBA',
            country: site.pays,
            site: site.site,
            service: utilisateur.department,
            apps: { sentinelOne: h.chance(0.7), matrix42: h.chance(0.6), manageEngine: h.chance(0.8) },
            status: statut,
            matchConfidence: 'none',
            matchScore: 0.1,
            firstSeenAt: ilYa(h.entier(2, 12)),
            lastSeenAt: ilYa(h.entier(0, 5)),
            ...extra,
        };
    };
    let n = 1;
    for (let i = 0; i < 6; i += 1) machines.push(machine(n++, 'pending_review'));
    for (let i = 0; i < 2; i += 1) {
        machines.push(machine(n++, 'ambiguous_match', { matchConfidence: 'ambiguous', matchScore: 0.62, candidateEquipmentIds: [postes[i].id, postes[i + 7].id] }));
    }
    for (let i = 0; i < 4; i += 1) {
        const poste = postes[20 + i];
        machines.push(machine(n++, 'linked_existing', {
            source: 'agent',
            machineName: poste.hostname ?? poste.name,
            hostname: poste.hostname,
            assetId: poste.assetId,
            serialNumber: poste.serialNumber,
            currentUserName: poste.user?.name,
            currentUserEmail: poste.user?.email,
            country: poste.country,
            site: poste.site,
            matchConfidence: 'strong',
            matchScore: 0.97,
            linkedEquipmentId: poste.id,
            firstSeenAt: ilYa(h.entier(30, 90)),
            lastSeenAt: ilYa(h.entier(0, 2)),
        }));
    }
    for (let i = 0; i < 2; i += 1) machines.push(machine(n++, 'imported', { firstSeenAt: ilYa(h.entier(40, 80)), lastSeenAt: ilYa(h.entier(1, 6)) }));
    for (let i = 0; i < 2; i += 1) machines.push(machine(n++, 'ignored', { machineName: `LAB-TEST-${i + 1}`, domain: 'WORKGROUP' }));

    // ----- Les finances --------------------------------------------------------------------------

    const annee = maintenant.getUTCFullYear();
    const moisEcoules = maintenant.getUTCMonth() + 1;
    const depenses: FinanceExpense[] = [];
    const depense = (d: Omit<FinanceExpense, 'id' | 'createdAt' | 'currencyCode'> & { id?: string }) => {
        depenses.push({ ...d, id: d.id ?? prochaineDepense(), currencyCode: 'XOF', createdAt: `${d.date}T12:00:00.000Z` });
    };
    const date = (an: number, mois: number, jour: number) =>
        `${an}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    const avantAujourdhui = (iso: string) => iso <= jourSeul(new Date(MAINTENANT).toISOString());

    /* L'exercice en cours : les achats de matériel de l'année, regroupés par mois et par
       fournisseur ; les abonnements ; les licences ; les réparations (factures liées). */
    const achats = new Map<string, number>();
    for (const actif of actifsParc) {
        const achat = actif.financial?.purchaseDate;
        if (!achat || !achat.startsWith(String(annee))) continue;
        const cle = `${achat.slice(0, 7)}|${actif.financial?.supplier}`;
        achats.set(cle, (achats.get(cle) ?? 0) + (actif.financial?.purchasePrice ?? 0));
    }
    for (const [cle, montant] of achats) {
        const [mois, fournisseur] = cle.split('|');
        const d = `${mois}-${String(h.entier(3, 26)).padStart(2, '0')}`;
        depense({ date: avantAujourdhui(d) ? d : `${mois}-01`, supplier: fournisseur, amount: montant, type: 'Purchase', status: 'Paid', description: 'Achat de matériel informatique', invoiceNumber: `FA-${mois.replace('-', '')}-${h.entier(100, 999)}`, sourceFileName: `facture-${mois}.pdf`, extractionConfidence: 'high' });
    }
    for (let mois = 1; mois <= moisEcoules; mois += 1) {
        depense({ date: date(annee, mois, 5), supplier: 'Microsoft', amount: 1_450_000, type: 'Cloud', status: 'Recurring', description: 'Microsoft 365 et Azure — abonnement mensuel', invoiceNumber: `MS-${annee}${String(mois).padStart(2, '0')}` });
        const jourTel = date(annee, mois, 10);
        if (avantAujourdhui(jourTel)) {
            depense({ date: jourTel, supplier: h.choisir(['Moov Africa', 'Togocom']), amount: 980_000 + h.entier(0, 120) * 1000, type: 'Service', status: mois === moisEcoules ? 'Pending' : 'Recurring', description: 'Forfaits mobiles de la flotte', invoiceNumber: `TEL-${annee}${String(mois).padStart(2, '0')}` });
        }
    }
    depense({ date: date(annee, 1, 15), supplier: 'Sophos', amount: 4_200_000, type: 'License', status: 'Paid', description: 'Licences pare-feu et protection des postes — annuel', invoiceNumber: `SOP-${annee}-01` });
    depense({ date: date(annee, 2, 3), supplier: 'Adobe', amount: 1_150_000, type: 'License', status: 'Paid', description: 'Licences Creative Cloud (Marketing)', invoiceNumber: `ADB-${annee}-02` });
    depense({ date: date(annee, 3, 20), supplier: 'SAP', amount: 3_600_000, type: 'License', status: 'Paid', description: 'Maintenance du progiciel de gestion', invoiceNumber: `SAP-${annee}-03` });
    for (const f of facturesDeReparation) {
        depense({ id: f.id, date: f.date, supplier: f.prestataire, amount: f.montant, type: 'Maintenance', status: 'Paid', description: `Réparation ${f.actif.name} (${f.actif.assetId})`, invoiceNumber: `REP-${f.date.replace(/-/g, '')}`, sourceFileName: `facture-reparation-${f.actif.name.toLowerCase()}.pdf`, extractionConfidence: 'high' });
    }
    /* Deux factures déposées, à vérifier : l'extraction n'est pas sûre d'elle. */
    depense({ date: jourSeul(ilYa(3)), supplier: 'CFAO Technologies', amount: 2_340_000, type: 'Purchase', status: 'Pending', description: 'Écrans et stations d’accueil — commande de rentrée', invoiceNumber: 'CFAO-2026-0917', sourceFileName: 'scan-facture-cfao.pdf', extractionConfidence: 'medium' });
    depense({ date: jourSeul(ilYa(1)), supplier: 'Réseaux & Co', amount: 610_000, type: 'Service', status: 'Pending', description: 'Câblage de la salle de réunion', invoiceNumber: '', sourceFileName: 'photo-facture-reseaux.jpg', extractionConfidence: 'low' });

    /* L'exercice précédent, clos : ses dépenses rejoignent ce que son budget déclare consommé. */
    const clos: Record<string, { type: FinanceExpense['type']; total: number; fournisseurs: string[]; libelle: string }> = {
        'Matériel IT': { type: 'Purchase', total: 55_400_000, fournisseurs: ['Dell Technologies Afrique de l’Ouest', 'HP Inc. — distributeur CFAO Technologies', 'Lenovo — distributeur Techno Plus', 'Samsung Electronics West Africa'], libelle: 'Achat de matériel informatique' },
        'Licences Logiciel': { type: 'License', total: 10_850_000, fournisseurs: ['Sophos', 'SAP', 'Adobe'], libelle: 'Licences et maintenance logicielle' },
        'Cloud Infrastructure': { type: 'Cloud', total: 16_900_000, fournisseurs: ['Microsoft'], libelle: 'Microsoft 365 et Azure — abonnement mensuel' },
        'Maintenance & Services': { type: 'Service', total: 12_380_000, fournisseurs: ['Moov Africa', 'Togocom', 'TechCare Lomé'], libelle: 'Forfaits mobiles et prestations' },
    };
    for (const poste of Object.values(clos)) {
        const nombre = poste.type === 'Cloud' ? 12 : poste.type === 'License' ? 4 : poste.type === 'Service' ? 12 : 9;
        let reste = poste.total;
        for (let i = 0; i < nombre; i += 1) {
            const montant = i === nombre - 1 ? reste : Math.round(poste.total / nombre / 1000 + h.entier(-60, 60)) * 1000;
            reste -= montant;
            const mois = poste.type === 'License' ? [1, 3, 6, 9][i] : poste.type === 'Purchase' ? [1, 2, 3, 5, 6, 8, 9, 10, 11][i] : i + 1;
            depense({ date: date(annee - 1, mois, h.entier(3, 26)), supplier: h.choisir(poste.fournisseurs), amount: montant, type: poste.type, status: 'Paid', description: poste.libelle, invoiceNumber: `${poste.type.slice(0, 3).toUpperCase()}-${annee - 1}${String(mois).padStart(2, '0')}-${i}` });
        }
    }

    const categorieBudget = (type: FinanceExpense['type']) =>
        type === 'Purchase' ? 'Matériel IT' : type === 'License' ? 'Licences Logiciel' : type === 'Cloud' ? 'Cloud Infrastructure' : 'Maintenance & Services';
    const consomme = (an: number, categorie: string) =>
        depenses.filter((d) => d.date.startsWith(String(an)) && categorieBudget(d.type) === categorie).reduce((s, d) => s + d.amount, 0);
    const budgets: (FinanceBudget & { id: string })[] = [
        {
            id: String(annee),
            year: annee,
            status: 'En cours',
            totalAllocated: 0,
            updatedAt: `${annee}-01-06T09:00:00.000Z`,
            sourceFileName: `budget-si-${annee}.xlsx`,
            items: [
                { category: 'Matériel IT', type: 'Purchase', capitalization: 'CAPEX', allocated: 62_000_000, spent: consomme(annee, 'Matériel IT') },
                { category: 'Licences Logiciel', type: 'License', capitalization: 'OPEX', allocated: 12_000_000, spent: consomme(annee, 'Licences Logiciel') },
                /* L'enveloppe épuisée : l'abonnement a dépassé ce que le budget avait prévu. */
                { category: 'Cloud Infrastructure', type: 'Cloud', capitalization: 'OPEX', allocated: 12_000_000, spent: consomme(annee, 'Cloud Infrastructure') },
                { category: 'Maintenance & Services', type: 'Service', capitalization: 'OPEX', allocated: 14_000_000, spent: consomme(annee, 'Maintenance & Services') },
            ],
        } as FinanceBudget & { id: string },
        {
            id: String(annee - 1),
            year: annee - 1,
            status: 'Clôturé',
            totalAllocated: 0,
            updatedAt: `${annee - 1}-12-31T18:00:00.000Z`,
            sourceFileName: `budget-si-${annee - 1}.xlsx`,
            items: [
                { category: 'Matériel IT', type: 'Purchase', capitalization: 'CAPEX', allocated: 58_000_000, spent: consomme(annee - 1, 'Matériel IT') },
                { category: 'Licences Logiciel', type: 'License', capitalization: 'OPEX', allocated: 11_000_000, spent: consomme(annee - 1, 'Licences Logiciel') },
                { category: 'Cloud Infrastructure', type: 'Cloud', capitalization: 'OPEX', allocated: 16_000_000, spent: consomme(annee - 1, 'Cloud Infrastructure') },
                { category: 'Maintenance & Services', type: 'Service', capitalization: 'OPEX', allocated: 13_000_000, spent: consomme(annee - 1, 'Maintenance & Services') },
            ],
        } as FinanceBudget & { id: string },
        /* L'exercice suivant, ouvert sans lignes : « à projeter ». */
        {
            id: String(annee + 1),
            year: annee + 1,
            status: 'En cours',
            totalAllocated: 0,
            updatedAt: ilYa(6),
            items: [],
        } as FinanceBudget & { id: string },
    ];
    for (const budget of budgets) {
        budget.totalAllocated = budget.items.reduce((somme, poste) => somme + poste.allocated, 0);
    }

    // ----- Le catalogue, les emplacements, les réglages ------------------------------------------

    const categories = catalogue.categories as { id: string }[];
    const modelesAvecCompte = modeles.map((modele) => ({
        ...modele,
        image: '',
        count: actifsParc.filter((a) => a.model === modele.name && a.type === modele.type).length,
    }));

    const emplacements = {
        countries: [...new Set(SITES.map((s) => s.pays))],
        sites: SITES.reduce<Record<string, string[]>>((acc, s) => ({ ...acc, [s.pays]: [...(acc[s.pays] ?? []), s.site] }), {}),
        locals: Object.fromEntries(SITES.map((s) => [s.site, s.locaux])),
        services: Object.fromEntries(SITES.map((s) => [s.site, s.services])),
    };
    /* `service → identifiant du manager` : le formulaire d'une personne en tire son manager. Un
       service présent sur plusieurs sites prend le manager du siège. */
    const responsablesDeService: Record<string, string> = {};
    for (const manager of [...managersParCle.values()].reverse()) responsablesDeService[manager.department as string] = manager.id;

    /** Ce que la simulation règle (le chargeur le pose par-dessus les réglages existants). */
    const reglages = {
        inventoryPeriodMonths: 12,
        repairQuoteThreshold: 150_000,
        autoCollectionAgentEnabled: true,
        autoCollectionAdEnabled: true,
        autoCollectionAdHost: 'dc01.neemba.local',
        autoCollectionAdBaseDn: 'DC=neemba,DC=local',
        autoCollectionNetworkEnabled: true,
        autoCollectionNetworkRanges: '10.10.0.0/16, 10.12.0.0/16',
    };

    // ----- Les documents -----------------------------------------------------------------------

    const docs = <T extends { id: string }>(liste: T[]) =>
        liste.map((item) => ({ id: item.id, data: item as unknown as Record<string, unknown> }));

    return {
        users: docs(personnes),
        equipment: docs(actifsParc),
        approvals: docs(demandes),
        events: docs(faits),
        detectedDevices: docs(machines),
        financeExpenses: docs(depenses),
        financeBudgets: docs(budgets),
        categories: docs(categories),
        models: docs(modelesAvecCompte),
        meta: [
            { id: 'locations', data: emplacements },
            { id: 'serviceManagers', data: responsablesDeService },
            { id: 'settings', data: reglages },
        ],
    };
};
