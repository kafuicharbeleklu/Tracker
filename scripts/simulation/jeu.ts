/**
 * LE JEU DE SIMULATION — une organisation fictive, complète et cohérente, pour Firestore.
 *
 * Généré, jamais recopié : le même jeu à chaque lancement (générateur pseudo-aléatoire à graine
 * fixe), daté par rapport au jour du chargement pour que les âges vivent (« en retard », « cette
 * semaine »). Chargé par `charger.mjs`.
 *
 * Ce qu'il alimente, écran par écran :
 * - Équipe : ~60 personnes sur six sites, avec leurs managers, deux invitations en attente, deux
 *   comptes suspendus ou partis ;
 * - Actifs : ~260 objets — postes et téléphones attribués, stock par site, infrastructure,
 *   réparations à chaque étape, restitutions en cours, objets retirés, perdus ou manquants ;
 * - Tâches : des demandes à chaque étape du parcours (validation, remise, dotation, réception),
 *   urgentes ou non, en retard ou non, et leur historique (validées, refusées, annulées) ;
 * - Historique : les faits qui ont produit cet état, datés et signés ;
 * - Collecte : des machines remontées à examiner ;
 * - Finances : le budget 2026 en cours, 2025 clos, et les dépenses de l'année.
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
    DetectedDevice,
    Equipment,
    FinanceBudget,
    FinanceExpense,
    FinanceExpenseType,
    HistoryEvent,
    RepairCase,
    User,
    UserRole,
} from '../../src/types';
import { approvalRequiresManagerGate } from '../../src/lib/businessRules';
import catalogue from './catalogue.json';

export interface DocumentDeSimulation {
    id: string;
    data: Record<string, unknown>;
}
export type JeuDeSimulation = Record<string, DocumentDeSimulation[]>;

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
}

const SITES: SiteDeSimulation[] = [
    {
        site: 'Lomé Siège',
        pays: 'Togo',
        code: 'LOM',
        effectif: 24,
        indicatif: '+228 90',
        services: ['Commercial', 'Administratif & Financier', 'Logistique', 'Technique', 'Ressources humaines', 'After Market'],
        locaux: ['Direction', 'Open space', 'Atelier', 'Salle serveur', 'Salle de réunion', 'Accueil'],
    },
    {
        site: 'Lomé Port',
        pays: 'Togo',
        code: 'LMP',
        effectif: 7,
        indicatif: '+228 91',
        services: ['Logistique', 'Location', 'Technique'],
        locaux: ['Bureau de quai', 'Entrepôt', 'Atelier'],
    },
    {
        site: 'Cotonou',
        pays: 'Bénin',
        code: 'COT',
        effectif: 7,
        indicatif: '+229 97',
        services: ['Commercial', 'Administratif & Financier', 'Technique'],
        locaux: ['Plateau', 'Atelier', 'Salle de réunion'],
    },
    {
        site: 'Abidjan',
        pays: "Côte d'Ivoire",
        code: 'ABJ',
        effectif: 7,
        indicatif: '+225 07',
        services: ['Commercial', 'Logistique', 'Technique'],
        locaux: ['Plateau', 'Entrepôt', 'Salle de réunion'],
    },
    {
        site: 'Campus Dakar',
        pays: 'Sénégal',
        code: 'DKR',
        effectif: 7,
        indicatif: '+221 77',
        services: ['Support', 'Commercial', 'Technique'],
        locaux: ['Bâtiment A', 'Bâtiment B', 'Salle serveur'],
    },
    {
        site: 'Bureau Paris',
        pays: 'France',
        code: 'PAR',
        effectif: 5,
        indicatif: '+33 6',
        services: ['Finance', 'Marketing', 'Achats'],
        locaux: ['3e étage', 'Salle de réunion'],
    },
];

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
const courriel = (nom: string) =>
    `${sansAccent(nom).replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')}@neemba.test`;
const avatar = (nom: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nom)}`;

// ---------------------------------------------------------------------------------------------
// Le matériel
// ---------------------------------------------------------------------------------------------

interface ModeleCatalogue {
    id: string;
    name: string;
    type: string;
    brand?: string;
    image?: string;
    specs?: string;
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
    Tablet: ['Démonstrations clients sur salon', 'Inventaires d’entrepôt'],
    DockingStation: ['Télétravail deux jours par semaine', 'Poste partagé en salle de réunion'],
};

const MOTIFS_DE_REFUS = [
    'Son équipement actuel suffit',
    'Budget épuisé sur ce poste',
    'Demande en double',
    'À revoir au prochain exercice',
];

const PRESTATAIRES = ['TechCare Lomé', 'Bureautique Plus', 'Atelier Numérique Cotonou', 'SAV Constructeur'];

// ---------------------------------------------------------------------------------------------
// La construction
// ---------------------------------------------------------------------------------------------

interface Options {
    maintenant: Date;
    /** Noms complets réels (en minuscules, sans accents) à ne jamais reproduire. */
    nomsInterdits?: Set<string>;
}

export const construireJeu = ({ maintenant, nomsInterdits = new Set() }: Options): JeuDeSimulation => {
    const h = creerHasard(20260926);
    const JOUR = 86_400_000;
    /** Une date `jours` avant le chargement, à une heure ouvrée. */
    const ilYa = (jours: number, heure = h.entier(8, 17), minute = h.choisir([0, 10, 20, 30, 40, 50])) => {
        const d = new Date(maintenant.getTime() - jours * JOUR);
        d.setUTCHours(heure, minute, 0, 0);
        return d.toISOString();
    };
    const jourSeul = (iso: string) => iso.slice(0, 10);
    const ajouterAns = (iso: string, ans: number) => {
        const d = new Date(iso);
        d.setUTCFullYear(d.getUTCFullYear() + ans);
        return jourSeul(d.toISOString());
    };
    const connexion = (jours: number) => {
        const d = new Date(ilYa(jours));
        const deux = (n: number) => String(n).padStart(2, '0');
        return `${deux(d.getUTCDate())}/${deux(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${deux(d.getUTCHours())}:${deux(d.getUTCMinutes())}`;
    };

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
    const [lome] = SITES;

    /* Les quatre personnages — les raccourcis démo, un par rôle, dans cet ordre. */
    const superAdmin = ajouterPersonne({
        id: 'u-001',
        name: 'Afi Lawson',
        role: 'SuperAdmin',
        department: 'Systèmes d’information',
        country: lome.pays,
        site: lome.site,
        status: 'active',
        phone: telephone(lome),
        lastLogin: connexion(0),
    });
    const adminTogo = ajouterPersonne({
        id: 'u-002',
        name: 'Komlan Agbeko',
        role: 'Admin',
        department: 'Systèmes d’information',
        country: lome.pays,
        site: lome.site,
        managedCountries: ['Togo', 'Bénin'],
        managerId: superAdmin.id,
        status: 'active',
        phone: telephone(lome),
        lastLogin: connexion(0),
    });
    const managerCommercial = ajouterPersonne({
        id: 'u-003',
        name: 'Sandrine Kpodar',
        role: 'Manager',
        department: 'Commercial',
        country: lome.pays,
        site: lome.site,
        status: 'active',
        phone: telephone(lome),
        lastLogin: connexion(1),
    });
    const employe = ajouterPersonne({
        id: 'u-004',
        name: 'Yawo Amouzou',
        role: 'User',
        department: 'Commercial',
        country: lome.pays,
        site: lome.site,
        managerId: managerCommercial.id,
        status: 'active',
        phone: telephone(lome),
        lastLogin: connexion(0),
    });

    /* L'informatique des autres pays, et un administrateur partagé pour l'Afrique de l'Ouest. */
    let rang = 5;
    const prochainId = () => `u-${String(rang++).padStart(3, '0')}`;
    const admins: User[] = [superAdmin, adminTogo];
    for (const [pays, site] of [
        ["Côte d'Ivoire", SITES[3]],
        ['Sénégal', SITES[4]],
        ['France', SITES[5]],
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
            }),
        );
    }

    /* Les managers ; le reste des effectifs sous eux. */
    const managersParCle = new Map<string, User>([[`${lome.site}|Commercial`, managerCommercial]]);
    /* Trois managers au siège, un par site ailleurs : les autres services rapportent au manager
       du site. */
    for (const site of SITES) {
        for (const service of site.services.slice(0, site === lome ? 3 : 1)) {
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
                }),
            );
        }
    }
    const managerDe = (site: SiteDeSimulation, service: string) =>
        managersParCle.get(`${site.site}|${service}`) ??
        [...managersParCle.values()].find((manager) => manager.site === site.site) ??
        managerCommercial;

    for (const site of SITES) {
        const dejaLa = personnes.filter((p) => p.site === site.site).length;
        const aCreer = Math.max(0, site.effectif - dejaLa);
        for (let i = 0; i < aCreer; i += 1) {
            /* Le commercial de Lomé est l'équipe du manager démo : il en reçoit davantage. */
            const service =
                site === lome && i < 6 ? 'Commercial' : h.choisir(site.services);
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
            });
        }
    }

    /* Deux invitations en attente, un compte suspendu, un départ programmé. */
    const salaries = personnes.filter((p) => p.role === 'User' && p.id !== employe.id);
    const aLaPosition = (part: number) => salaries[Math.floor(part * (salaries.length - 1))];
    const [inviteA, inviteB, suspendu, partant] = [0.1, 0.45, 0.7, 0.95].map(aLaPosition);
    for (const invite of [inviteA, inviteB]) {
        Object.assign(invite, {
            status: 'pending',
            invitedAt: ilYa(h.entier(1, 4)),
            invitedBy: adminTogo.id,
            mustChangePassword: true,
            lastLogin: undefined,
        });
    }
    Object.assign(suspendu, {
        status: 'inactive',
        suspendedAt: ilYa(12),
        suspendedBy: adminTogo.id,
        suspensionReason: 'Absence prolongée',
    });
    Object.assign(partant, { departureDate: jourSeul(ilYa(-9)) });

    const actifs = personnes.filter((p) => p.status === 'active');
    const personne = (id: string) => personnes.find((p) => p.id === id) as User;
    const adminDu = (pays?: string) =>
        admins.find((admin) => admin.managedCountries?.includes(pays ?? '')) ?? adminTogo;
    const porteur = (p: User) => ({ id: p.id, name: p.name, email: p.email, avatar: p.avatar });

    // ----- Le matériel --------------------------------------------------------------------------

    const modeles = catalogue.models as ModeleCatalogue[];
    const modelesDuType = (type: string) => modeles.filter((modele) => modele.type === type);
    const actifsParc: Equipment[] = [];
    const compteurs = new Map<string, number>();
    let numeroActif = 1;

    const creerActif = (
        type: string,
        site: SiteDeSimulation,
        options: { ageAnnees?: number; modele?: ModeleCatalogue; local?: string; departement?: string } = {},
    ): Equipment => {
        const modele = options.modele ?? h.choisir(modelesDuType(type));
        const cleCompteur = `${CODE_DU_TYPE[type]}-${site.code}`;
        const numero = (compteurs.get(cleCompteur) ?? 0) + 1;
        compteurs.set(cleCompteur, numero);
        const age = options.ageAnnees ?? h.suivant() * 4.5;
        const achat = ilYa(Math.round(age * 365) + h.entier(0, 20), 9, 0);
        const [bas, haut] = PRIX[type] ?? [100_000, 500_000];
        const id = `eq-${String(numeroActif++).padStart(4, '0')}`;
        const poste = type === 'Laptop' || type === 'Desktop';
        const actif: Equipment = {
            id,
            name: `${cleCompteur}-${String(numero).padStart(2, '0')}`,
            assetId: `NT-${achat.slice(0, 4)}-${String(10_000 + numeroActif).slice(-5)}`,
            type,
            model: [modele.brand, modele.name].filter(Boolean).join(' '),
            brand: modele.brand,
            status: 'Disponible',
            assignmentStatus: 'NONE',
            operationalStatus: 'Actif',
            image: modele.image ?? '',
            user: null,
            country: site.pays,
            site: site.site,
            local: options.local ?? h.choisir(site.locaux),
            department: options.departement,
            serialNumber: Array.from({ length: 10 }, () =>
                h.choisir('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'.split('')),
            ).join(''),
            financial: {
                purchasePrice: Math.round((bas + h.suivant() * (haut - bas)) / 1000) * 1000,
                purchaseDate: jourSeul(achat),
                supplier: modele.brand ? `${modele.brand} Afrique de l’Ouest` : 'Distributeur agréé',
                invoiceNumber: `FA-${achat.slice(0, 4)}-${h.entier(1000, 9999)}`,
                depreciationMethod: 'linear',
                depreciationYears: ANNEES_AMORTISSEMENT[type] ?? 5,
            },
            warrantyEnd: ajouterAns(achat, 3),
            ...(poste
                ? {
                      hostname: `NT-${site.code}-${CODE_DU_TYPE[type]}${String(numero).padStart(3, '0')}`,
                      os: h.choisir(['Windows 11 Pro 23H2', 'Windows 11 Pro 24H2', 'Windows 10 Pro 22H2']),
                      ram: h.choisir(['8 Go', '16 Go', '16 Go', '32 Go']),
                      storage: h.choisir(['256 Go SSD', '512 Go SSD', '512 Go SSD', '1 To SSD']),
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

    /** Remettre un objet à quelqu'un — l'état confirmé, daté. */
    const remettre = (actif: Equipment, beneficiaire: User, joursDepuis: number) => {
        const admin = adminDu(beneficiaire.country);
        Object.assign(actif, {
            status: 'Attribué',
            assignmentStatus: 'CONFIRMED',
            user: porteur(beneficiaire),
            department: beneficiaire.department,
            assignedAt: ilYa(joursDepuis + 1),
            assignedBy: admin.id,
            assignedByName: admin.name,
            confirmedBy: beneficiaire.id,
            confirmedAt: ilYa(joursDepuis),
            handoverProof: h.choisir(['code PIN', 'signature', 'code PIN et signature']),
        });
    };

    /* Chacun son poste ; un téléphone pour la plupart ; un écran pour certains. */
    for (const p of personnes) {
        const site = SITES.find((s) => s.site === p.site) ?? lome;
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
    }
    /* Le manager démo a une tablette ; l'employé démo, un écran en plus. */
    remettre(creerActif('Tablet', lome), managerCommercial, 140);
    remettre(creerActif('Monitor', lome), employe, 210);

    /* Le stock de chaque site, et l'infrastructure. */
    for (const site of SITES) {
        const grand = site === lome;
        for (const [type, n] of [
            ['Laptop', grand ? 6 : 2],
            ['Desktop', grand ? 2 : 1],
            ['Monitor', grand ? 5 : 2],
            ['Phone', grand ? 4 : 2],
            ['Tablet', grand ? 1 : 0],
            ['DockingStation', grand ? 2 : 0],
        ] as const) {
            for (let i = 0; i < n; i += 1) creerActif(type, site, { ageAnnees: h.suivant() * 0.9 });
        }
        for (const [type, n] of [
            ['Server', grand ? 3 : 1],
            ['Switch', grand ? 3 : 1],
            ['Firewall', 1],
            ['AccessPoint', grand ? 4 : 2],
            ['Printer', grand ? 3 : 1],
            ['NetworkDevice', grand ? 1 : 0],
            ['Projector', grand ? 1 : 0],
        ] as const) {
            for (let i = 0; i < n; i += 1) {
                const local = type === 'Server' || type === 'Switch' || type === 'Firewall'
                    ? site.locaux.find((l) => /serveur|entrepôt|atelier/i.test(l)) ?? site.locaux[0]
                    : undefined;
                creerActif(type, site, { local, ageAnnees: 0.5 + h.suivant() * 4 });
            }
        }
    }

    /* Ce qui a quitté le service : retirés, perdu, manquants à l'inventaire. */
    for (let i = 0; i < 9; i += 1) {
        const actif = creerActif(h.choisir(['Laptop', 'Desktop', 'Monitor', 'Phone']), h.choisir(SITES), {
            ageAnnees: 4.6 + h.suivant() * 2,
        });
        Object.assign(actif, { status: 'Retiré', operationalStatus: 'Retiré' });
    }
    const perdu = creerActif('Phone', SITES[1], { ageAnnees: 1.2 });
    remettre(perdu, personnes.find((p) => p.site === SITES[1].site && p.role === 'User') as User, 300);
    Object.assign(perdu, { status: 'Perdu', assignmentStatus: 'NONE' });
    for (let i = 0; i < 3; i += 1) {
        Object.assign(creerActif(h.choisir(['Monitor', 'Phone', 'DockingStation']), lome), {
            status: 'Manquant',
        });
    }

    // ----- Les réparations, à chaque étape -------------------------------------------------------

    const enReparation = (etape: RepairCase['stage'], actif: Equipment, jours: number): void => {
        const detenteur = actif.user?.id ? personne(actif.user.id) : undefined;
        const admin = adminDu(actif.country);
        const dossier: RepairCase = {
            id: `rep-${actif.id}`,
            stage: etape,
            openedAt: ilYa(jours),
            holderId: detenteur?.id,
            holderName: detenteur?.name,
        };
        if (etape !== 'declared') {
            dossier.deposit = { at: ilYa(jours - 1), method: 'pin', byName: detenteur?.name ?? admin.name };
        }
        if (etape === 'quote_pending' || etape === 'at_repairer') {
            dossier.takenCharge = {
                at: ilYa(jours - 2),
                byName: admin.name,
                repairer: h.choisir(PRESTATAIRES),
                underWarranty: etape === 'at_repairer' && h.chance(0.5),
                expectedReturn: jourSeul(ilYa(jours - 16)),
                ticket: `TK-${h.entier(10000, 99999)}`,
            };
        }
        if (etape === 'quote_pending') {
            dossier.quote = { fileName: 'devis-reparation.pdf', uploadedAt: ilYa(jours - 3), amount: 185_000 };
            dossier.quoteDecision = { level: 'finance', status: 'pending' };
        }
        if (etape === 'at_repairer') dossier.sentAt = ilYa(jours - 3);
        Object.assign(actif, {
            status: 'En réparation',
            repair: dossier,
            repairStartDate: jourSeul(dossier.openedAt),
        });
    };
    const postesAttribues = () =>
        actifsParc.filter((a) => a.assignmentStatus === 'CONFIRMED' && (a.type === 'Laptop' || a.type === 'Phone'));
    enReparation('declared', postesAttribues()[5], 1);
    enReparation('declared', postesAttribues()[40], 3);
    enReparation('deposited', postesAttribues()[12], 4);
    enReparation('quote_pending', postesAttribues()[22], 6);
    enReparation('at_repairer', postesAttribues()[31], 10);
    /* Un retour de prestataire en retard : la date attendue est passée. */
    enReparation('at_repairer', postesAttribues()[50], 26);

    /* Des restitutions en cours (départ, remplacement). */
    for (const actif of postesAttribues().slice(60, 64)) {
        Object.assign(actif, {
            assignmentStatus: 'PENDING_RETURN',
            returnRequestedAt: ilYa(h.entier(1, 9)),
            returnRequestedBy: actif.user?.id,
        });
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
            equipmentModel: [modele.brand, modele.name].filter(Boolean).join(' '),
            reason: h.choisir(MOTIFS_DE_DEMANDE[type] ?? ['Besoin de service']),
            urgency: options.urgence ?? (h.chance(0.25) ? 'high' : h.chance(0.3) ? 'low' : 'normal'),
            estimatedCost: COUT[type],
            status: statut,
            createdAt: creee,
            updatedAt: creee,
            equipmentName: [modele.brand, modele.name].filter(Boolean).join(' '),
            equipmentType: type,
            requestType: 'Attribution',
            requester: demandeur.name,
            requestDate: jourSeul(creee),
            image: '',
        };
        demandes.push(demande);
        return demande;
    };

    /* Qui peut demander, et pour qui : une personne active avec un manager. */
    const equipe = (manager: User) =>
        actifs.filter((p) => p.managerId === manager.id && p.role === 'User');
    const avecManager = actifs.filter((p) => p.role === 'User' && p.managerId);
    const piocher = (liste: User[]) => liste[h.entier(0, liste.length - 1)];

    /* Chez le manager démo : cinq validations, dont une urgente et deux en retard. */
    const equipeCommerciale = equipe(managerCommercial);
    [2, 9, 12, 4, 1].forEach((age, i) =>
        nouvelleDemande(equipeCommerciale[i % equipeCommerciale.length], 'WAITING_MANAGER_APPROVAL', {
            age,
            urgence: i === 3 ? 'high' : undefined,
        }),
    );
    /* L'employé démo en attend une chez son manager. */
    nouvelleDemande(employe, 'WAITING_MANAGER_APPROVAL', { age: 5, type: 'DockingStation' });
    /* Chez les autres managers. */
    for (let i = 0; i < 5; i += 1) {
        const beneficiaire = piocher(avecManager.filter((p) => p.managerId !== managerCommercial.id));
        nouvelleDemande(beneficiaire, 'WAITING_MANAGER_APPROVAL', { age: h.entier(0, 16) });
    }

    /* Validées, à l'informatique : les remises à faire. */
    const valider = (demande: Approval, joursApres: number) => {
        demande.status = 'WAITING_IT_PROCESSING';
        demande.updatedAt = new Date(new Date(demande.createdAt).getTime() + joursApres * JOUR).toISOString();
    };
    for (let i = 0; i < 9; i += 1) {
        const beneficiaire = piocher(avecManager);
        const demande = nouvelleDemande(beneficiaire, 'WAITING_MANAGER_APPROVAL', {
            age: [1, 3, 6, 9, 14, 2, 20, 0, 4][i],
            urgence: i === 0 || i === 5 ? 'high' : undefined,
        });
        if (approvalRequiresManagerGate(demande, personnes)) valider(demande, 0.4);
        else demande.status = 'WAITING_IT_PROCESSING';
    }
    /* Une demande déposée par un manager pour son équipe : elle part droit à l'informatique. */
    const deposee = nouvelleDemande(equipeCommerciale[1], 'WAITING_IT_PROCESSING', {
        age: 3,
        demandeur: managerCommercial,
        type: 'Laptop',
    });
    deposee.reason = 'Nouvelle recrue, poste à équiper';

    /* Une unité proposée, en attente de la dotation ; des réceptions à confirmer. */
    const stockLibre = (type: string, site?: string) =>
        actifsParc.find((a) => a.type === type && a.status === 'Disponible' && (!site || a.site === site));
    const proposer = (demande: Approval, statut: 'WAITING_DOTATION_APPROVAL' | 'PENDING_DELIVERY') => {
        const beneficiaire = personne(demande.beneficiaryId);
        const unite = stockLibre(demande.equipmentCategory, beneficiaire.site) ?? stockLibre(demande.equipmentCategory);
        if (!unite) return;
        demande.status = statut;
        demande.assignedEquipmentId = unite.id;
        demande.assignedEquipmentName = unite.name;
        demande.updatedAt = ilYa(Math.max(0, Math.round((maintenant.getTime() - new Date(demande.createdAt).getTime()) / JOUR) - 2));
        const admin = adminDu(unite.country);
        Object.assign(unite, {
            status: 'En attente',
            assignmentStatus: statut,
            assignedAt: demande.updatedAt,
            assignedBy: admin.id,
            assignedByName: admin.name,
            ...(statut === 'PENDING_DELIVERY' ? { user: porteur(beneficiaire) } : {}),
        });
    };
    for (let i = 0; i < 3; i += 1) {
        const demande = nouvelleDemande(piocher(avecManager), 'WAITING_IT_PROCESSING', {
            age: [4, 8, 11][i],
            type: h.choisir(['Laptop', 'Monitor', 'Phone']),
        });
        if (approvalRequiresManagerGate(demande, personnes)) proposer(demande, 'WAITING_DOTATION_APPROVAL');
        else proposer(demande, 'PENDING_DELIVERY');
    }
    for (const [beneficiaire, age] of [
        [employe, 2],
        [piocher(avecManager), 6],
        [piocher(avecManager), 9],
        [piocher(avecManager), 1],
    ] as const) {
        const demande = nouvelleDemande(beneficiaire, 'WAITING_IT_PROCESSING', {
            age,
            type: beneficiaire === employe ? 'Monitor' : h.choisir(['Laptop', 'Phone', 'Monitor']),
        });
        proposer(demande, 'PENDING_DELIVERY');
    }

    /* L'historique : validées et reçues, refusées, annulées. */
    for (let i = 0; i < 12; i += 1) {
        const beneficiaire = piocher(avecManager);
        const demande = nouvelleDemande(beneficiaire, 'Completed', { age: h.entier(20, 160) });
        const site = SITES.find((s) => s.site === beneficiaire.site) ?? lome;
        const unite = creerActif(demande.equipmentCategory, site, { ageAnnees: demande.createdAt ? (maintenant.getTime() - new Date(demande.createdAt).getTime()) / (365 * JOUR) : 0.2 });
        const jours = Math.round((maintenant.getTime() - new Date(demande.createdAt).getTime()) / JOUR) - 5;
        remettre(unite, beneficiaire, Math.max(1, jours));
        demande.assignedEquipmentId = unite.id;
        demande.assignedEquipmentName = unite.name;
        demande.updatedAt = unite.confirmedAt as string;
    }
    for (let i = 0; i < 4; i += 1) {
        const beneficiaire = piocher(avecManager);
        const demande = nouvelleDemande(beneficiaire, 'Rejected', { age: h.entier(10, 90) });
        const manager = personne(beneficiaire.managerId as string);
        demande.updatedAt = ilYa(Math.max(1, Math.round((maintenant.getTime() - new Date(demande.createdAt).getTime()) / JOUR) - 2));
        demande.decisionNote = {
            kind: 'MANAGER_REJECT',
            reason: h.choisir(MOTIFS_DE_REFUS),
            actorId: manager.id,
            actorName: manager.name,
            at: demande.updatedAt,
            method: 'code PIN',
        };
    }
    for (let i = 0; i < 2; i += 1) {
        const beneficiaire = piocher(avecManager);
        const demande = nouvelleDemande(beneficiaire, 'Cancelled', { age: h.entier(8, 60) });
        demande.updatedAt = ilYa(Math.max(1, Math.round((maintenant.getTime() - new Date(demande.createdAt).getTime()) / JOUR) - 1));
        demande.decisionNote = {
            kind: 'CANCEL',
            reason: 'Plus besoin, un poste s’est libéré dans le service',
            actorId: beneficiaire.id,
            actorName: beneficiaire.name,
            at: demande.updatedAt,
        };
    }

    // ----- Le journal -------------------------------------------------------------------------

    const faits: HistoryEvent[] = [];
    let numeroFait = 1;
    const fait = (evenement: Omit<HistoryEvent, 'id' | 'isSystem' | 'isSensitive'> & { isSystem?: boolean; isSensitive?: boolean }) => {
        faits.push({
            isSystem: false,
            isSensitive: false,
            ...evenement,
            id: `ev-${String(numeroFait++).padStart(5, '0')}`,
        });
    };
    const signe = (acteur: User) => ({ actorId: acteur.id, actorName: acteur.name, actorRole: acteur.role as UserRole });

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
        });
        if (actif.assignedAt && actif.user?.id) {
            fait({
                ...signe(admin),
                type: 'ASSIGN',
                timestamp: actif.assignedAt,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: `Remis à ${actif.user.name}`,
                metadata: { beneficiaryId: actif.user.id, method: actif.handoverProof },
            });
        }
        if (actif.confirmedAt && actif.user?.id) {
            const detenteur = personne(actif.user.id);
            fait({
                ...signe(detenteur),
                type: 'ASSIGN_CONFIRMED',
                timestamp: actif.confirmedAt,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: 'Réception confirmée',
            });
        }
        if (actif.repair) {
            fait({
                ...signe(actif.repair.holderId ? personne(actif.repair.holderId) : admin),
                type: 'REPAIR_START',
                timestamp: actif.repair.openedAt,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: 'Panne déclarée',
            });
        }
        if (actif.returnRequestedAt && actif.user?.id) {
            fait({
                ...signe(personne(actif.user.id)),
                type: 'RETURN',
                timestamp: actif.returnRequestedAt,
                targetType: 'EQUIPMENT',
                targetId: actif.id,
                targetName: actif.name,
                description: 'Restitution demandée',
            });
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
        const a = (heures: number) => new Date(Math.min(t0 + heures * 3_600_000, maintenant.getTime() - 60_000)).toISOString();
        fait({ ...signe(demandeur), ...cible, type: 'APPROVAL_CREATE', timestamp: demande.createdAt, description: `Demande : ${demande.equipmentCategory}` });

        const passeParLeManager = approvalRequiresManagerGate(demande, personnes);
        const transition = (acteur: User, type: HistoryEvent['type'], de: ApprovalStatus, vers: ApprovalStatus, heures: number, raison?: string) =>
            fait({
                ...signe(acteur),
                ...cible,
                type,
                timestamp: a(heures),
                description: `Statut mis à jour: ${vers}`,
                metadata: { from: de, to: vers, ...(raison ? { reason: raison } : {}) },
            });

        const rang = { WAITING_MANAGER_APPROVAL: 0, WAITING_IT_PROCESSING: 1, WAITING_DOTATION_APPROVAL: 2, PENDING_DELIVERY: 3, Completed: 4 }[demande.status as string];
        if (passeParLeManager && manager && (rang ?? 0) >= 1) {
            transition(manager, 'APPROVAL_MANAGER', 'WAITING_MANAGER_APPROVAL', 'WAITING_IT_PROCESSING', 9);
        }
        if ((rang ?? 0) >= 2 && passeParLeManager) {
            transition(admin, 'ASSIGN_DOTATION_WAIT', 'WAITING_IT_PROCESSING', 'WAITING_DOTATION_APPROVAL', 30);
        }
        if ((rang ?? 0) >= 3) {
            if (passeParLeManager && manager) transition(manager, 'ASSIGN_PENDING', 'WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 40);
            else transition(admin, 'ASSIGN_PENDING', 'WAITING_IT_PROCESSING', 'PENDING_DELIVERY', 30);
        }
        if (demande.status === 'Completed') {
            fait({ ...signe(beneficiaire), ...cible, type: 'ASSIGN_CONFIRMED', timestamp: demande.updatedAt, description: 'Statut mis à jour: Completed', metadata: { from: 'PENDING_DELIVERY', to: 'Completed' } });
        }
        if (demande.status === 'Rejected' && manager) {
            fait({ ...signe(manager), ...cible, type: 'APPROVAL_REJECT', timestamp: demande.updatedAt, description: 'Statut mis à jour: Rejected', metadata: { from: 'WAITING_MANAGER_APPROVAL', to: 'Rejected', reason: demande.decisionNote?.reason } });
        }
        if (demande.status === 'Cancelled') {
            fait({ ...signe(demandeur), ...cible, type: 'APPROVAL_CANCEL', timestamp: demande.updatedAt, description: 'Statut mis à jour: Cancelled', metadata: { from: 'WAITING_MANAGER_APPROVAL', to: 'Cancelled' } });
        }
    }

    /* Les connexions des derniers jours, et les invitations. */
    for (const p of actifs.slice(0, 40)) {
        fait({ ...signe(p), type: 'LOGIN', timestamp: ilYa(h.entier(0, 6)), targetType: 'USER', targetId: p.id, targetName: p.name, description: 'Connexion réussie (Email)', isSystem: true });
    }
    for (const invite of [inviteA, inviteB]) {
        fait({ ...signe(adminTogo), type: 'CREATE', timestamp: invite.invitedAt as string, targetType: 'USER', targetId: invite.id, targetName: invite.name, description: 'Compte créé, invitation envoyée' });
    }
    fait({ ...signe(adminTogo), type: 'UPDATE', timestamp: suspendu.suspendedAt as string, targetType: 'USER', targetId: suspendu.id, targetName: suspendu.name, description: 'Compte suspendu', metadata: { reason: suspendu.suspensionReason } });
    faits.sort((x, y) => x.timestamp.localeCompare(y.timestamp));

    // ----- La collecte --------------------------------------------------------------------------

    const machines: DetectedDevice[] = [];
    const postes = actifsParc.filter((a) => a.type === 'Laptop' && a.assignmentStatus === 'CONFIRMED');
    for (let i = 0; i < 10; i += 1) {
        const site = h.choisir(SITES);
        const ambigue = i >= 8;
        const utilisateur = h.choisir(actifs.filter((p) => p.site === site.site));
        const vu = ilYa(h.entier(0, 5));
        machines.push({
            id: `dd-${String(i + 1).padStart(3, '0')}`,
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
            status: ambigue ? 'ambiguous_match' : 'pending_review',
            matchConfidence: ambigue ? 'ambiguous' : 'none',
            matchScore: ambigue ? 0.62 : 0.1,
            ...(ambigue ? { candidateEquipmentIds: [postes[i].id, postes[i + 7].id] } : {}),
            firstSeenAt: ilYa(h.entier(2, 12)),
            lastSeenAt: vu,
        });
    }
    for (let i = 0; i < 4; i += 1) {
        const poste = postes[20 + i];
        machines.push({
            id: `dd-${String(machines.length + 1).padStart(3, '0')}`,
            source: 'agent',
            fingerprint: `fp-${h.entier(100000, 999999)}`,
            machineName: poste.hostname ?? poste.name,
            hostname: poste.hostname,
            assetId: poste.assetId,
            serialNumber: poste.serialNumber,
            os: poste.os,
            ram: poste.ram,
            storage: poste.storage,
            currentUserName: poste.user?.name,
            currentUserEmail: poste.user?.email,
            domain: 'NEEMBA',
            country: poste.country,
            site: poste.site,
            apps: { sentinelOne: true, matrix42: true, manageEngine: true },
            status: 'linked_existing',
            matchConfidence: 'strong',
            matchScore: 0.97,
            linkedEquipmentId: poste.id,
            firstSeenAt: ilYa(h.entier(30, 90)),
            lastSeenAt: ilYa(h.entier(0, 2)),
        });
    }

    // ----- Les finances --------------------------------------------------------------------------

    const annee = maintenant.getUTCFullYear();
    const moisEcoules = maintenant.getUTCMonth() + 1;
    const depenses: FinanceExpense[] = [];
    let numeroDepense = 1;
    const depense = (d: Omit<FinanceExpense, 'id' | 'createdAt' | 'currencyCode'>) => {
        depenses.push({ ...d, id: `dp-${String(numeroDepense++).padStart(4, '0')}`, currencyCode: 'XOF', createdAt: `${d.date}T12:00:00.000Z` });
    };
    const date = (mois: number, jour: number) =>
        `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;

    /* Les achats de matériel de l'année, regroupés par mois et par fournisseur. */
    const achats = new Map<string, number>();
    for (const actif of actifsParc) {
        const achat = actif.financial?.purchaseDate;
        if (!achat || !achat.startsWith(String(annee))) continue;
        const cle = `${achat.slice(0, 7)}|${actif.financial?.supplier}`;
        achats.set(cle, (achats.get(cle) ?? 0) + (actif.financial?.purchasePrice ?? 0));
    }
    for (const [cle, montant] of achats) {
        const [mois, fournisseur] = cle.split('|');
        depense({
            date: `${mois}-${String(h.entier(3, 26)).padStart(2, '0')}`,
            supplier: fournisseur,
            amount: montant,
            type: 'Purchase',
            status: 'Paid',
            description: 'Achat de matériel informatique',
            invoiceNumber: `FA-${mois.replace('-', '')}-${h.entier(100, 999)}`,
        });
    }
    for (let mois = 1; mois <= moisEcoules; mois += 1) {
        depense({ date: date(mois, 5), supplier: 'Microsoft', amount: 1_450_000, type: 'Cloud', status: 'Recurring', description: 'Microsoft 365 et Azure — abonnement mensuel', invoiceNumber: `MS-${annee}${String(mois).padStart(2, '0')}` });
        depense({ date: date(mois, 10), supplier: h.choisir(['Moov Africa', 'Togocom']), amount: 980_000 + h.entier(0, 120) * 1000, type: 'Service', status: mois === moisEcoules ? 'Pending' : 'Recurring', description: 'Forfaits mobiles de la flotte', invoiceNumber: `TEL-${annee}${String(mois).padStart(2, '0')}` });
    }
    depense({ date: date(1, 15), supplier: 'Sophos', amount: 4_200_000, type: 'License', status: 'Paid', description: 'Licences pare-feu et protection des postes — annuel', invoiceNumber: `SOP-${annee}-01` });
    depense({ date: date(2, 3), supplier: 'Adobe', amount: 1_150_000, type: 'License', status: 'Paid', description: 'Licences Creative Cloud (Marketing)', invoiceNumber: `ADB-${annee}-02` });
    depense({ date: date(3, 20), supplier: 'SAP', amount: 3_600_000, type: 'License', status: 'Paid', description: 'Maintenance du progiciel de gestion', invoiceNumber: `SAP-${annee}-03` });
    for (const [mois, jour] of [[2, 12], [4, 8], [6, 17], [Math.max(1, moisEcoules - 1), 22]] as const) {
        depense({ date: date(mois, jour), supplier: h.choisir(PRESTATAIRES), amount: 60_000 + h.entier(0, 190) * 1000, type: 'Maintenance', status: 'Paid', description: 'Réparation hors garantie', invoiceNumber: `REP-${annee}-${mois}${jour}` });
    }

    const categorieBudget = (type: FinanceExpenseType) =>
        type === 'Purchase' ? 'Matériel IT' : type === 'License' ? 'Licences Logiciel' : type === 'Cloud' ? 'Cloud Infrastructure' : 'Maintenance & Services';
    const depense2026 = (categorie: string) =>
        depenses.filter((d) => categorieBudget(d.type) === categorie).reduce((s, d) => s + d.amount, 0);
    const budgets: (FinanceBudget & { id: string })[] = [
        {
            id: String(annee),
            year: annee,
            status: 'En cours',
            totalAllocated: 0,
            updatedAt: `${annee}-01-06T09:00:00.000Z`,
            sourceFileName: `budget-si-${annee}.xlsx`,
            items: [
                { category: 'Matériel IT', type: 'Purchase', capitalization: 'CAPEX', allocated: 62_000_000, spent: depense2026('Matériel IT') },
                { category: 'Licences Logiciel', type: 'License', capitalization: 'OPEX', allocated: 12_000_000, spent: depense2026('Licences Logiciel') },
                { category: 'Cloud Infrastructure', type: 'Cloud', capitalization: 'OPEX', allocated: 18_000_000, spent: depense2026('Cloud Infrastructure') },
                { category: 'Maintenance & Services', type: 'Service', capitalization: 'OPEX', allocated: 14_000_000, spent: depense2026('Maintenance & Services') },
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
                { category: 'Matériel IT', type: 'Purchase', capitalization: 'CAPEX', allocated: 58_000_000, spent: 55_400_000 },
                { category: 'Licences Logiciel', type: 'License', capitalization: 'OPEX', allocated: 11_000_000, spent: 10_850_000 },
                { category: 'Cloud Infrastructure', type: 'Cloud', capitalization: 'OPEX', allocated: 16_000_000, spent: 16_900_000 },
                { category: 'Maintenance & Services', type: 'Service', capitalization: 'OPEX', allocated: 13_000_000, spent: 12_380_000 },
            ],
        } as FinanceBudget & { id: string },
    ];

    /* L'enveloppe est la somme de ses postes. */
    for (const budget of budgets) {
        budget.totalAllocated = budget.items.reduce((somme, poste) => somme + poste.allocated, 0);
    }

    // ----- Le catalogue, les emplacements --------------------------------------------------------

    const categories = catalogue.categories as { id: string }[];
    const modelesAvecCompte = modeles.map((modele) => ({
        ...modele,
        count: actifsParc.filter((a) => a.model === [modele.brand, modele.name].filter(Boolean).join(' ')).length,
    }));

    const emplacements = {
        countries: [...new Set(SITES.map((s) => s.pays))],
        sites: SITES.reduce<Record<string, string[]>>((acc, s) => ({ ...acc, [s.pays]: [...(acc[s.pays] ?? []), s.site] }), {}),
        locals: Object.fromEntries(SITES.map((s) => [s.site, s.locaux])),
        services: Object.fromEntries(SITES.map((s) => [s.site, s.services])),
    };
    const responsablesDeService = Object.fromEntries(
        [...managersParCle.values()].map((manager) => [manager.department, manager.name]),
    );

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
        ],
    };
};
