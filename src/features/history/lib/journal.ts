import {
    ArrowUUpLeft,
    Bell,
    CheckCircle,
    ClipboardText,
    Export,
    Handshake,
    Hourglass,
    PaperPlaneTilt,
    ShieldCheck,
    SignOut,
    UserPlus,
    Wrench,
    XCircle,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import { libelleAttestation } from '../../../components/ui/Attestation';
import type { Approval, Equipment, EventType, HistoryEvent, User } from '../../../types';

/**
 * **Ce que le journal sait lire d'un événement** — planche 18.1.
 *
 * La couche de données écrit un événement par acte, avec une description faite pour le
 * développeur (« Statut mis à jour: PENDING_DELIVERY »). La planche veut **un fait** :
 * *« l'objet ou la personne en titre, qui l'a fait et par quelle méthode en sous-ligne »*.
 * Ce module fait la traduction, une fois, pour les trois lectures du journal — la carte
 * d'un jour au téléphone, la rangée du tableau au bureau, et le fait ouvert.
 *
 * Rien n'y est inventé : un fait que ce module ne sait pas nommer garde sa description.
 */

/** Les six natures de la planche — les chips de la feuille, les options du menu. */
export type Nature = 'remises' | 'demandes' | 'incidents' | 'inventaires' | 'comptes' | 'securite';

export const NATURES: readonly { id: Nature; label: string; aucun: string }[] = [
    { id: 'remises', label: 'Remises et retours', aucun: 'Aucune remise ni retour' },
    { id: 'demandes', label: 'Demandes', aucun: 'Aucune demande' },
    { id: 'incidents', label: 'Incidents et sorties', aucun: 'Aucun incident ni sortie' },
    { id: 'inventaires', label: 'Inventaires', aucun: 'Aucun inventaire' },
    { id: 'comptes', label: 'Comptes et rôles', aucun: 'Aucun changement de compte' },
    { id: 'securite', label: 'Sécurité et exports', aucun: 'Aucun fait de sécurité' },
];

const REMISES: readonly EventType[] = [
    'ASSIGN',
    'ASSIGN_PENDING',
    'ASSIGN_CONFIRMED',
    'ASSIGN_IT_SELECTED',
    'RETURN',
];

const DEMANDES: readonly EventType[] = [
    'APPROVAL_CREATE',
    'APPROVAL_MANAGER',
    'APPROVAL_ADMIN',
    'APPROVAL_REJECT',
    'APPROVAL_CANCEL',
    'APPROVAL_DOTATION_REJECT',
    'ASSIGN_MANAGER_WAIT',
    'ASSIGN_MANAGER_OK',
    'ASSIGN_IT_PROCESSING',
    'ASSIGN_DOTATION_WAIT',
    'ASSIGN_DOTATION_OK',
];

const SECURITE: readonly EventType[] = [
    'LOGIN',
    'LOGOUT',
    'EXPORT',
    'VIEW_SENSITIVE',
    'SECURITY_STEP_UP',
];

/** Lit une valeur texte du sac `metadata` — il est fait d'`unknown`, rien ne s'y suppose. */
export const lire = (evenement: HistoryEvent, cle: string): string | undefined => {
    const valeur = evenement.metadata?.[cle];
    return typeof valeur === 'string' && valeur.trim() ? valeur : undefined;
};

/**
 * **La nature d'un fait.** La source de l'acte l'emporte sur son type : une campagne
 * d'inventaire écrit des `CREATE` et des `UPDATE`, un incident écrit un `UPDATE` ou un
 * `REPAIR_START` — c'est ce qui les a produits qui dit ce qu'ils sont. Un fait qu'aucune
 * des six ne décrit (la collecte automatique d'un poste) ne se lit que sous « Tout ».
 */
export const natureDe = (evenement: HistoryEvent): Nature | null => {
    const source = lire(evenement, 'source') ?? '';
    if (source.startsWith('audit')) return 'inventaires';
    if (source === 'incident') return 'incidents';
    if (source.startsWith('rbac')) return 'comptes';
    if (source === 'agent_checkin') return null;

    const { type, targetType } = evenement;
    /* Une demande qui avance écrit aussi `ASSIGN_PENDING` et `ASSIGN_CONFIRMED` : sur une
       demande, c'est l'avancée de la demande, pas le passage de main de l'objet. */
    if (targetType === 'APPROVAL') return 'demandes';
    if (REMISES.includes(type)) return 'remises';
    if (DEMANDES.includes(type)) return 'demandes';
    if (SECURITE.includes(type)) return 'securite';
    if (type === 'REPAIR_START' || type === 'REPAIR_END') return 'incidents';
    if (targetType === 'EQUIPMENT') {
        if (type === 'DELETE' || lire(evenement, 'toStatus') === 'Réformé') return 'incidents';
        return null;
    }
    if (targetType === 'USER' || targetType === 'SYSTEM') return 'comptes';
    return null;
};

/**
 * **La marque ronde de 32** — *« la nature par l'icône et la teinte »* (I3). La teinte
 * est celle de la nature ; seul le refus prend le rouge, parce que c'est le seul fait de
 * la planche qui ferme une porte. La sécurité garde le creux neutre de `.ev .mk`.
 */
const TEINTE: Record<Nature, string> = {
    remises: 'bg-tint-vert text-on-tint-vert',
    demandes: 'bg-tint-bleu text-on-tint-bleu',
    incidents: 'bg-tint-orange text-on-tint-orange',
    inventaires: 'bg-tint-ambre text-on-tint-ambre',
    comptes: 'bg-tint-bleu text-on-tint-bleu',
    securite: 'bg-surface-container text-on-surface-variant',
};

const NEUTRE = 'bg-surface-container text-on-surface-variant';

export interface Marque {
    glyph: PhosphorGlyph;
    /** Les classes de fond et d'encre — ou le cerne sans fond d'un fait système. */
    teinte: string;
}

export const marqueDe = (evenement: HistoryEvent): Marque => {
    /* `.ev.sys .mk` — un fait système est cerclé, sans fond : il n'a pas d'auteur à
       teinter. */
    if (evenement.isSystem)
        return { glyph: Bell, teinte: 'border-outline-variant text-text-tertiary border' };

    const nature = natureDe(evenement);
    const teinte = nature ? TEINTE[nature] : NEUTRE;
    const { type } = evenement;

    if (nature === 'inventaires') return { glyph: ClipboardText, teinte };
    if (type === 'APPROVAL_REJECT' || type === 'APPROVAL_DOTATION_REJECT')
        return { glyph: XCircle, teinte: 'bg-tint-danger text-on-tint-danger' };
    if (type === 'APPROVAL_CANCEL') return { glyph: XCircle, teinte: NEUTRE };
    if (type === 'APPROVAL_CREATE') return { glyph: PaperPlaneTilt, teinte };
    if (
        type === 'ASSIGN_MANAGER_WAIT' ||
        type === 'ASSIGN_DOTATION_WAIT' ||
        type === 'ASSIGN_IT_PROCESSING'
    )
        return { glyph: Hourglass, teinte };
    if (nature === 'demandes') return { glyph: CheckCircle, teinte };
    if (type === 'RETURN') return { glyph: ArrowUUpLeft, teinte };
    if (nature === 'remises') return { glyph: Handshake, teinte };
    if (nature === 'incidents')
        return {
            glyph:
                type === 'DELETE' || lire(evenement, 'toStatus') === 'Réformé' ? SignOut : Wrench,
            teinte,
        };
    if (type === 'EXPORT') return { glyph: Export, teinte };
    if (nature === 'securite') return { glyph: ShieldCheck, teinte };
    if (type === 'CREATE' && evenement.targetType === 'USER') return { glyph: UserPlus, teinte };
    return { glyph: nature === 'comptes' ? ShieldCheck : Bell, teinte };
};

/** Ce que le journal consulte pour nommer : l'objet par son code, la demande par son type. */
export interface Registres {
    equipment: ReadonlyMap<string, Equipment>;
    approvals: ReadonlyMap<string, Approval>;
}

/** « de casque », « d'ordinateur » — l'élision que la planche écrit. */
const de = (mot: string): string => (/^[aeiouyhéèêàâîôû]/i.test(mot) ? `d'${mot}` : `de ${mot}`);

/** Le sujet d'un fait sur un objet : son code d'actif, qui se relève sur l'étiquette. */
const objetDe = (evenement: HistoryEvent, registres: Registres): string =>
    registres.equipment.get(evenement.targetId)?.assetId || evenement.targetName;

/** L'étape d'une restitution : engagée par le porteur, ou réceptionnée par l'informatique. */
const restitutionEngagee = (evenement: HistoryEvent) =>
    lire(evenement, 'toAssignmentStatus') === 'PENDING_RETURN' ||
    lire(evenement, 'stage') === 'initiation';

/**
 * **Le titre d'une rangée est le fait, pas son sujet** — *« LFW-PF5XK2M remis »*, pas
 * « LFW-PF5XK2M ». La cible et la méthode descendent en sous-ligne.
 */
export const faitDe = (evenement: HistoryEvent, registres: Registres): string => {
    const { type, targetType } = evenement;

    if (targetType === 'EQUIPMENT') {
        const objet = objetDe(evenement, registres);
        if (lire(evenement, 'source') === 'incident') {
            return lire(evenement, 'toStatus') === 'Réformé'
                ? `${objet} · sorti du parc`
                : `${objet} · incident déclaré`;
        }
        switch (type) {
            case 'ASSIGN':
            case 'ASSIGN_PENDING':
                return `${objet} remis`;
            case 'ASSIGN_CONFIRMED':
                return `${objet} reçu`;
            case 'RETURN':
                return restitutionEngagee(evenement)
                    ? `${objet} · restitution engagée`
                    : `${objet} restitué`;
            case 'REPAIR_START':
                return `${objet} · en réparation`;
            case 'REPAIR_END':
                return `${objet} · réparation terminée`;
            case 'DELETE':
                return `${objet} · sorti du parc`;
            case 'CREATE':
                return `${objet} ajouté au parc`;
            default:
                if (lire(evenement, 'toStatus') === 'Réformé') return `${objet} · sorti du parc`;
        }
    }

    if (targetType === 'APPROVAL') {
        const demande = registres.approvals.get(evenement.targetId);
        const categorie = demande?.equipmentCategory?.toLowerCase();
        const sujet = categorie ? `Demande ${de(categorie)}` : 'Demande';
        switch (type) {
            case 'APPROVAL_CREATE':
                return `${sujet} envoyée`;
            case 'APPROVAL_MANAGER':
            case 'APPROVAL_ADMIN':
            case 'ASSIGN_MANAGER_OK':
            case 'ASSIGN_DOTATION_OK':
                return `${sujet} validée`;
            case 'APPROVAL_REJECT':
                return `${sujet} refusée`;
            case 'APPROVAL_DOTATION_REJECT':
                return `${sujet} · dotation refusée`;
            case 'APPROVAL_CANCEL':
                return `${sujet} annulée`;
            case 'ASSIGN_MANAGER_WAIT':
                return `${sujet} · en attente du responsable`;
            case 'ASSIGN_IT_PROCESSING':
                return `${sujet} · en traitement`;
            case 'ASSIGN_DOTATION_WAIT':
                return `${sujet} · dotation à valider`;
            case 'ASSIGN_IT_SELECTED':
                return `${sujet} · objet choisi`;
            case 'ASSIGN_PENDING':
                return `${sujet} servie`;
            case 'ASSIGN_CONFIRMED':
                return `${sujet} close`;
        }
    }

    return evenement.description || evenement.targetName;
};

/** Une personne nommée par un fait : son identifiant quand il est connu, et son nom. */
export interface Partie {
    id?: string;
    name: string;
}

/**
 * **L'autre partie d'un fait** — celle que le titre ne nomme pas et que l'auteur n'est
 * pas : à qui l'objet a été remis, par qui il a été rendu, pour qui la demande a été
 * faite. `null` quand le fait n'en a pas, ou quand c'est l'auteur lui-même.
 */
export const autrePartie = (evenement: HistoryEvent, registres: Registres): Partie | null => {
    const partie = ((): Partie | null => {
        if (evenement.targetType === 'USER')
            return { id: evenement.targetId, name: evenement.targetName };
        if (evenement.targetType === 'APPROVAL') {
            const demande = registres.approvals.get(evenement.targetId);
            return demande ? { id: demande.beneficiaryId, name: demande.beneficiaryName } : null;
        }
        if (evenement.targetType !== 'EQUIPMENT') return null;
        if (evenement.type === 'RETURN') {
            const porteur = lire(evenement, 'previousUser') ?? lire(evenement, 'beneficiaryName');
            return porteur
                ? {
                      id: lire(evenement, 'previousUserId') ?? lire(evenement, 'beneficiaryId'),
                      name: porteur,
                  }
                : null;
        }
        const beneficiaire = lire(evenement, 'beneficiaryName');
        return beneficiaire ? { id: lire(evenement, 'beneficiaryId'), name: beneficiaire } : null;
    })();

    if (!partie) return null;
    if (partie.id ? partie.id === evenement.actorId : partie.name === evenement.actorName)
        return null;
    return partie;
};

/** « à Karim Diallo », « par Jane Smith », « pour Fatou Ndiaye » — la préposition du fait. */
export const partieDe = (evenement: HistoryEvent, registres: Registres): string | undefined => {
    const partie = autrePartie(evenement, registres);
    if (!partie) return undefined;
    const { type, targetType } = evenement;
    if (targetType === 'APPROVAL') return `pour ${partie.name}`;
    if (targetType !== 'EQUIPMENT') return partie.name;
    if (type === 'ASSIGN' || type === 'ASSIGN_PENDING') return `à ${partie.name}`;
    if (type === 'ASSIGN_CONFIRMED' || type === 'RETURN') return `par ${partie.name}`;
    return partie.name;
};

/**
 * Le pourquoi — un motif de refus, le commentaire d'un incident, entre guillemets
 * parce que ce sont les mots de quelqu'un.
 */
const pourquoiDe = (evenement: HistoryEvent): string | undefined => {
    const mots = lire(evenement, 'reason') ?? lire(evenement, 'comment');
    return mots ? `« ${mots} »` : undefined;
};

/**
 * **Le complément du fait** — au bureau, c'est tout ce qui reste en sous-ligne : l'auteur,
 * la méthode et le lieu ont leur colonne. « à Karim Diallo », « écran fendu ».
 */
export const complementDe = (evenement: HistoryEvent, registres: Registres): string =>
    [partieDe(evenement, registres), pourquoiDe(evenement)].filter(Boolean).join(' · ');

/**
 * **La méthode d'attestation** — *« c'est ce qui rend le fait relisible deux ans
 * après »*. Un acte l'écrit par son code (`pin`, `pin+signature`) ; une remise écrit sa
 * preuve en toutes lettres (« signature sur l'appareil de Clara Admin »).
 */
export const methodeDe = (evenement: HistoryEvent): string | undefined =>
    libelleAttestation(lire(evenement, 'method')) ?? lire(evenement, 'proof');

/** Le lieu du fait, tel qu'il a été relevé au moment de l'acte — jamais le lieu d'aujourd'hui. */
export const lieuDe = (evenement: HistoryEvent): string | undefined => lire(evenement, 'location');

/** Qui a fait le fait — « Automatique » pour le système, « vous » dans Mon historique. */
export const auteurDe = (evenement: HistoryEvent, moi?: string): string => {
    if (evenement.isSystem) return 'Automatique';
    if (moi && evenement.actorId === moi) return 'vous';
    return evenement.actorName;
};

/**
 * **La sous-ligne du téléphone** — *« à Karim Diallo, par Clara Admin · code PIN,
 * signature apposée »*. Au bureau elle se déplie en trois colonnes ; ici elle se lit
 * d'un trait, l'autre partie d'abord, puis l'auteur, la méthode et le pourquoi.
 */
export const sousLigneDe = (
    evenement: HistoryEvent,
    registres: Registres,
    moi?: string,
): string => {
    const auteur = auteurDe(evenement, moi);
    const partie = partieDe(evenement, registres);
    const methode = methodeDe(evenement);
    /* « par Jane Smith » nomme déjà qui a fait le geste — celle qui a rendu, celui qui a
       reçu. L'auteur de l'écriture n'est alors que l'appareil : la preuve le dit
       (« signature, sur l'appareil de Clara Admin ») et, à défaut, la sous-ligne. */
    if (partie?.startsWith('par ') && !evenement.isSystem) {
        return [
            partie,
            methode ?? (auteur === 'vous' ? 'consigné par vous' : `consigné par ${auteur}`),
            pourquoiDe(evenement),
        ]
            .filter(Boolean)
            .join(' · ');
    }
    const qui = evenement.isSystem
        ? 'automatique'
        : partie
          ? `${partie}, par ${auteur}`
          : auteur === 'vous'
            ? 'par vous'
            : auteur;
    return [qui, methode, pourquoiDe(evenement)].filter(Boolean).join(' · ');
};

/**
 * **Ce qui concerne une personne** — le périmètre de *Mon historique*. Ses actes, ce qui
 * lui a été remis ou repris, ses demandes, son compte. **Pas l'histoire d'un objet
 * d'avant qu'il ne le tienne**, ni la sécurité : la feuille de la planche les retire.
 */
export const concerneLaPersonne = (
    evenement: HistoryEvent,
    personne: string,
    registres: Registres,
): boolean => {
    if (evenement.isSensitive) return false;
    if (natureDe(evenement) === 'securite') return false;
    if (evenement.actorId === personne) return true;
    if (evenement.targetType === 'USER') return evenement.targetId === personne;
    if (evenement.targetType === 'APPROVAL') {
        const demande = registres.approvals.get(evenement.targetId);
        return demande?.beneficiaryId === personne || demande?.requesterId === personne;
    }
    return (
        lire(evenement, 'beneficiaryId') === personne ||
        lire(evenement, 'previousUserId') === personne
    );
};

/** Un choix de la feuille — une personne, ou un objet. */
export type Concerne = { kind: 'personne' | 'objet'; id: string; name: string };

/** Le fait concerne-t-il la personne ou l'objet choisis dans la feuille ? */
export const concerne = (
    evenement: HistoryEvent,
    choix: Concerne,
    registres: Registres,
): boolean => {
    if (choix.kind === 'objet') {
        if (evenement.targetType === 'EQUIPMENT') return evenement.targetId === choix.id;
        if (evenement.targetType === 'APPROVAL')
            return registres.approvals.get(evenement.targetId)?.assignedEquipmentId === choix.id;
        return false;
    }
    if (evenement.actorId === choix.id) return true;
    if (evenement.targetType === 'USER') return evenement.targetId === choix.id;
    if (evenement.targetType === 'APPROVAL') {
        const demande = registres.approvals.get(evenement.targetId);
        return demande?.beneficiaryId === choix.id || demande?.requesterId === choix.id;
    }
    return (
        lire(evenement, 'beneficiaryId') === choix.id ||
        lire(evenement, 'previousUserId') === choix.id
    );
};

/* ------------------------------------------------------------------ le temps du journal */

const JOUR = 86_400_000;

/** Au-delà de trente jours, le journal se lit par mois (Mon historique, colonne 4). */
const HORIZON_JOURS = 30;

const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const ancien = (iso: string) => Date.now() - new Date(iso).getTime() > HORIZON_JOURS * JOUR;

/** « Lundi 1er septembre » — la planche écrit l'ordinal du premier du mois. */
const dateLongue = (jour: Date): string => {
    const semaine = jour.toLocaleDateString('fr-FR', { weekday: 'long' });
    const mois = jour.toLocaleDateString('fr-FR', { month: 'long' });
    const quantieme = jour.getDate() === 1 ? '1er' : String(jour.getDate());
    const annee = jour.getFullYear() !== new Date().getFullYear() ? ` ${jour.getFullYear()}` : '';
    return `${semaine} ${quantieme} ${mois}${annee}`;
};

const nomDuMois = (jour: Date): string => {
    const mois = jour.toLocaleDateString('fr-FR', { month: 'long' });
    return jour.getFullYear() !== new Date().getFullYear() ? `${mois} ${jour.getFullYear()}` : mois;
};

/** Le groupe d'un fait : son jour, ou son mois au-delà de l'horizon. */
export interface Groupe {
    cle: string;
    /** « Aujourd'hui », « Hier », « mardi 2 septembre », « juillet ». */
    titre: string;
    /** « d'hier », « du mardi 2 septembre », « de juillet » — pour « Voir les 2 autres faits … ». */
    de: string;
    /** Le groupe est un mois : la rangée porte sa date, pas son heure. */
    mensuel: boolean;
}

/** La majuscule d'un titre de groupe : `::first-letter` ne prend pas sur un `span`. */
const capitale = (mot: string) => mot.charAt(0).toUpperCase() + mot.slice(1);

export const groupeDe = (iso: string): Groupe => {
    const jour = new Date(iso);
    if (ancien(iso)) {
        const mois = nomDuMois(jour);
        return {
            cle: `${jour.getFullYear()}-${jour.getMonth()}`,
            titre: capitale(mois),
            de: de(mois),
            mensuel: true,
        };
    }
    const aujourdhui = new Date();
    const veille = new Date(aujourdhui.getTime() - JOUR);
    const cle = jour.toDateString();
    if (memeJour(jour, aujourdhui))
        return { cle, titre: "Aujourd'hui", de: "d'aujourd'hui", mensuel: false };
    if (memeJour(jour, veille)) return { cle, titre: 'Hier', de: "d'hier", mensuel: false };
    const longue = dateLongue(jour);
    return { cle, titre: capitale(longue), de: `du ${longue}`, mensuel: false };
};

export const heure = (iso: string): string =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** L'âge d'une rangée, à droite : l'heure dans un jour, « 28 juil. » dans un mois. */
export const ageDe = (iso: string): string =>
    ancien(iso)
        ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : heure(iso);

/** « Aujourd'hui à 09:42 », « mardi 2 septembre à 16:40 » — le sous-titre du fait ouvert. */
export const quandDe = (iso: string): string => {
    const jour = new Date(iso);
    const aujourdhui = new Date();
    const veille = new Date(aujourdhui.getTime() - JOUR);
    const date = memeJour(jour, aujourdhui)
        ? "Aujourd'hui"
        : memeJour(jour, veille)
          ? 'Hier'
          : dateLongue(jour);
    return `${date} à ${heure(iso)}`;
};

/* --------------------------------------------------------------------- les périodes */

export type PeriodeId = '7' | '30' | 'exercice' | 'tout';

export const PERIODES: readonly {
    id: PeriodeId;
    label: string;
    /** Ce que la ligne `.ord` en dit : « Tout » y redirait la nature. */
    regard: string;
    phrase: string;
}[] = [
    { id: '7', label: '7 jours', regard: '7 jours', phrase: 'ces 7 jours' },
    { id: '30', label: '30 jours', regard: '30 jours', phrase: 'ces 30 jours' },
    { id: 'exercice', label: 'Exercice', regard: 'exercice', phrase: "sur l'exercice" },
    { id: 'tout', label: 'Tout', regard: 'toutes périodes', phrase: '' },
];

/**
 * Le début d'une période, ou `null` pour tout le journal. **L'exercice** commence au
 * mois que Paramètres fixe (`fiscalYearStart`, « 01 » par défaut) : c'est celui des
 * Finances, et un journal qui borne autrement contredirait leurs rapports.
 */
export const debutDe = (periode: PeriodeId, moisDebutExercice: string): number | null => {
    if (periode === 'tout') return null;
    if (periode === '7' || periode === '30') return Date.now() - Number(periode) * JOUR;
    const maintenant = new Date();
    const mois = Math.min(Math.max(Number(moisDebutExercice) || 1, 1), 12) - 1;
    const annee =
        maintenant.getMonth() >= mois ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
    return new Date(annee, mois, 1).getTime();
};

/* ------------------------------------------------------------------ la preuve d'un fait */

/** Une attestation relue — une ligne du fil `.trail` du fait ouvert. */
export interface Preuve {
    evenement: HistoryEvent;
    /** « Clara Admin atteste avoir remis » */
    titre: string;
    /** « 09:42 · code PIN, signature apposée » */
    detail: string;
    /** L'autre partie n'a pas encore attesté : la ligne attend. */
    attente?: boolean;
    /** Une étape qui n'a pas encore commencé — le parcours d'une demande ouverte la montre. */
    avenir?: boolean;
    /** L'étape a arrêté le parcours : un refus. */
    arret?: boolean;
}

/** Le participe d'un acte, pour « atteste avoir … » et « a … ». */
const participeDe = (evenement: HistoryEvent, registres: Registres): string | undefined => {
    const fait = faitDe(evenement, registres);
    const { type, targetType } = evenement;
    if (targetType === 'EQUIPMENT') {
        if (lire(evenement, 'source') === 'incident')
            return fait.endsWith('sorti du parc') ? "sorti l'objet du parc" : "déclaré l'incident";
        if (type === 'ASSIGN' || type === 'ASSIGN_PENDING') return 'remis';
        if (type === 'ASSIGN_CONFIRMED') return 'reçu';
        if (type === 'RETURN') return restitutionEngagee(evenement) ? 'restitué' : 'réceptionné';
        if (type === 'DELETE' || fait.endsWith('sorti du parc')) return "sorti l'objet du parc";
        if (type === 'REPAIR_START') return "mis l'objet en réparation";
        if (type === 'REPAIR_END') return 'clos la réparation';
        if (type === 'CREATE') return "ajouté l'objet au parc";
        return undefined;
    }
    if (targetType === 'APPROVAL') {
        if (type === 'APPROVAL_CREATE') return 'envoyé la demande';
        if (type === 'APPROVAL_REJECT' || type === 'APPROVAL_DOTATION_REJECT')
            return 'refusé la demande';
        if (type === 'APPROVAL_CANCEL') return 'annulé la demande';
        if (fait.endsWith('validée')) return 'validé la demande';
        return undefined;
    }
    if (type === 'LOGIN') return 'ouvert une session';
    if (type === 'LOGOUT') return 'fermé sa session';
    if (type === 'EXPORT') return 'exporté des données';
    return undefined;
};

/** Les actes qui s'attestent — une méthode absente s'y dit, elle ne se tait pas. */
const sAttesteDe = (evenement: HistoryEvent): boolean => {
    const nature = natureDe(evenement);
    return (
        nature === 'remises' ||
        nature === 'incidents' ||
        evenement.type === 'APPROVAL_MANAGER' ||
        evenement.type === 'APPROVAL_ADMIN' ||
        evenement.type === 'APPROVAL_REJECT'
    );
};

const preuveDe = (evenement: HistoryEvent, registres: Registres, fait: HistoryEvent): Preuve => {
    const quand = memeJour(new Date(evenement.timestamp), new Date(fait.timestamp))
        ? heure(evenement.timestamp)
        : quandDe(evenement.timestamp);
    if (evenement.isSystem)
        return { evenement, titre: 'Le système, sans intervention', detail: quand };

    const methode = methodeDe(evenement);
    const participe = participeDe(evenement, registres);
    /* **Chacun atteste son propre acte** (06.1) : une réception est attestée par qui
       reçoit, même quand elle s'écrit depuis la session de qui remet — la signature en
       présence se trace sur son appareil. */
    const signataire =
        evenement.targetType === 'EQUIPMENT' && evenement.type === 'ASSIGN_CONFIRMED'
            ? (autrePartie(evenement, registres)?.name ?? evenement.actorName)
            : evenement.actorName;
    const titre = participe
        ? methode
            ? `${signataire} atteste avoir ${participe}`
            : `${signataire} a ${participe}`
        : signataire;
    const comment = methode ?? (sAttesteDe(evenement) ? 'méthode non consignée' : undefined);
    return { evenement, titre, detail: [quand, comment].filter(Boolean).join(' · ') };
};

/**
 * **Le fil d'un fait ouvert** — *« qui a attesté quoi et comment »*. Un passage de main
 * a deux attestations, **chacune la sienne** (06.1) : celle qui remet et celle qui reçoit,
 * celle qui rend et celle qui réceptionne. Le journal les écrit en deux faits ; ouvrir
 * l'un montre les deux, dans l'ordre où elles ont eu lieu. Quand la seconde manque encore
 * et que l'objet l'attend toujours, la ligne le dit.
 */
export const filDe = (
    fait: HistoryEvent,
    tous: readonly HistoryEvent[],
    registres: Registres,
): Preuve[] => {
    const lignes = [preuveDe(fait, registres, fait)];
    if (fait.targetType !== 'EQUIPMENT') return lignes;

    const surLObjet = tous
        .filter((e) => e.targetType === 'EQUIPMENT' && e.targetId === fait.targetId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const index = surLObjet.findIndex((e) => e.id === fait.id);
    if (index < 0) return lignes;

    const remise = (e: HistoryEvent) => e.type === 'ASSIGN' || e.type === 'ASSIGN_PENDING';
    const retourEngage = (e: HistoryEvent) => e.type === 'RETURN' && restitutionEngagee(e);
    const retourClos = (e: HistoryEvent) => e.type === 'RETURN' && !restitutionEngagee(e);

    const paire: { avant?: (e: HistoryEvent) => boolean; apres?: (e: HistoryEvent) => boolean } =
        remise(fait)
            ? { apres: (e) => e.type === 'ASSIGN_CONFIRMED' }
            : fait.type === 'ASSIGN_CONFIRMED'
              ? { avant: remise }
              : retourEngage(fait)
                ? { apres: retourClos }
                : retourClos(fait)
                  ? { avant: retourEngage }
                  : {};

    if (paire.apres) {
        /* La seconde attestation est le prochain fait du même passage — et seulement
           lui : une remise suivante ouvrirait un autre passage de main. */
        const suivant = surLObjet.slice(index + 1).find((e) => paire.apres!(e) || remise(e));
        if (suivant && paire.apres(suivant)) {
            lignes.push(preuveDe(suivant, registres, fait));
        } else if (!suivant) {
            const objet = registres.equipment.get(fait.targetId);
            const partie = autrePartie(fait, registres);
            const attendu = remise(fait) ? 'PENDING_DELIVERY' : 'PENDING_RETURN';
            if (objet?.assignmentStatus === attendu) {
                lignes.push({
                    evenement: fait,
                    titre: remise(fait)
                        ? `${partie?.name ?? 'Le destinataire'} n'a pas encore confirmé`
                        : "L'informatique n'a pas encore réceptionné",
                    detail: remise(fait) ? 'réception à confirmer' : 'inspection à faire',
                    attente: true,
                });
            }
        }
    }

    if (paire.avant) {
        const precedent = surLObjet
            .slice(0, index)
            .reverse()
            .find((e) => paire.avant!(e) || e.type === 'ASSIGN_CONFIRMED' || retourClos(e));
        if (precedent && paire.avant(precedent))
            lignes.unshift(preuveDe(precedent, registres, fait));
    }

    return lignes;
};

/* ----------------------------------------------------------- le parcours d'une demande */

/**
 * **Une demande se relit de bout en bout** (08/10) — ouvrir l'un de ses faits montrait une
 * ligne : « Ama Koné a validé la demande · méthode non consignée ». Qui l'avait demandée, qui
 * l'a validée, qui a remis l'objet, par quelle preuve chacun : il fallait ouvrir cinq faits
 * pour le savoir, et la remise n'était même pas reliée à la demande. Le fil reprend donc
 * **toutes les attestations de la demande**, celles qu'elle porte (création, validation,
 * dotation, refus, annulation) et celles de l'objet remis (remise par l'informatique,
 * réception par le bénéficiaire), dans l'ordre, chacune avec son rôle et sa méthode.
 */

/** Un acte porté par la demande elle-même : ce que la personne a fait, lu de la transition. */
const acteSurLaDemande = (evenement: HistoryEvent): { verbe: string; atteste: boolean } => {
    const de_ = lire(evenement, 'from');
    switch (evenement.type) {
        case 'APPROVAL_CREATE':
            return { verbe: 'a envoyé la demande', atteste: false };
        case 'APPROVAL_MANAGER':
        case 'APPROVAL_ADMIN':
        case 'ASSIGN_MANAGER_OK':
            return { verbe: 'a validé la demande', atteste: true };
        case 'APPROVAL_REJECT':
            return { verbe: 'a refusé la demande', atteste: true };
        case 'APPROVAL_DOTATION_REJECT':
            return { verbe: 'a refusé la dotation', atteste: true };
        case 'APPROVAL_CANCEL':
            return { verbe: 'a annulé la demande', atteste: false };
        case 'ASSIGN_DOTATION_WAIT':
            return { verbe: 'a soumis la dotation à validation', atteste: false };
        case 'ASSIGN_DOTATION_OK':
            return { verbe: 'a validé la dotation', atteste: true };
        case 'ASSIGN_PENDING':
            return de_ === 'WAITING_DOTATION_APPROVAL'
                ? { verbe: 'a validé la dotation', atteste: true }
                : { verbe: 'a préparé la remise', atteste: false };
        case 'ASSIGN_CONFIRMED':
            return { verbe: 'a confirmé la réception', atteste: true };
        default:
            return { verbe: 'a fait avancer la demande', atteste: false };
    }
};

/** Le rôle d'une personne dans une demande — ce qu'elle y est, pas son rôle dans le produit. */
const roleDans = (demande: Approval, personneId: string, roleProduit?: string): string => {
    if (personneId === demande.requesterId && personneId === demande.beneficiaryId)
        return 'demandeur et bénéficiaire';
    if (personneId === demande.requesterId) return 'demandeur';
    if (personneId === demande.beneficiaryId) return 'bénéficiaire';
    if (roleProduit === 'Manager') return 'manager';
    if (roleProduit === 'Admin' || roleProduit === 'SuperAdmin') return 'informatique';
    return 'intervenant';
};

/** Une partie prenante : qui, son rôle dans la demande, ce qu'elle y a fait. */
export interface PartiePrenante {
    id?: string;
    nom: string;
    role: string;
    actes: string[];
    /** Elle n'a pas encore agi : son geste est attendu. */
    attendue?: boolean;
}

export interface ParcoursDeDemande {
    demande: Approval;
    etapes: Preuve[];
    parties: PartiePrenante[];
}

const MEME_ACTE_MS = 10 * 60 * 1000;

/** « aujourd'hui à 07:18 » — la date prend sa minuscule au milieu d'une ligne. */
const dansLaLigne = (texte: string): string => texte.charAt(0).toLowerCase() + texte.slice(1);

export const parcoursDeLaDemande = (
    approvalId: string,
    tous: readonly HistoryEvent[],
    registres: Registres,
    users: readonly User[],
    /** Qui lit : l'étape qui l'attend lui parle — « Vous devez valider la demande ». */
    moi?: string,
): ParcoursDeDemande | null => {
    const demande = registres.approvals.get(approvalId);
    if (!demande) return null;
    const temps = (e: HistoryEvent) => new Date(e.timestamp).getTime();
    const chrono = (a: HistoryEvent, b: HistoryEvent) => temps(a) - temps(b);

    const traces = tous
        .filter((e) => e.targetType === 'APPROVAL' && e.targetId === approvalId)
        .sort(chrono);
    /* Le dépôt est toujours la première étape : une demande d'avant le journal n'en a pas de
       trace, mais elle a bien été déposée, par quelqu'un, un jour. */
    const surLaDemande: HistoryEvent[] = traces.some((e) => e.type === 'APPROVAL_CREATE')
        ? traces
        : [
              {
                  id: `depot-${approvalId}`,
                  type: 'APPROVAL_CREATE',
                  actorId: demande.requesterId,
                  actorName: demande.requesterName,
                  actorRole: demande.requesterRole ?? 'User',
                  targetType: 'APPROVAL',
                  targetId: approvalId,
                  targetName: `Demande de ${demande.requesterName}`,
                  timestamp: demande.createdAt,
                  description: 'Dépôt de la demande',
                  isSystem: false,
                  isSensitive: false,
              } as HistoryEvent,
              ...traces,
          ];
    const depot = new Date(demande.createdAt).getTime();

    /* La remise et la réception de l'objet servi : écrites sur l'objet, reliées à la demande
       par son identifiant quand l'écriture le porte, sinon par le bénéficiaire et la date. */
    const surLObjet = demande.assignedEquipmentId
        ? tous
              .filter(
                  (e) =>
                      e.targetType === 'EQUIPMENT' &&
                      e.targetId === demande.assignedEquipmentId &&
                      ['ASSIGN', 'ASSIGN_PENDING', 'ASSIGN_CONFIRMED'].includes(e.type) &&
                      (lire(e, 'approvalId') === approvalId ||
                          (lire(e, 'beneficiaryId') === demande.beneficiaryId &&
                              temps(e) >= depot)),
              )
              .sort(chrono)
        : [];
    const remise = surLObjet.find((e) => e.type === 'ASSIGN' || e.type === 'ASSIGN_PENDING');
    const reception = remise
        ? surLObjet.find((e) => e.type === 'ASSIGN_CONFIRMED' && temps(e) >= temps(remise))
        : undefined;
    const procheDe = (e: HistoryEvent, autre?: HistoryEvent) =>
        Boolean(autre) && Math.abs(temps(e) - temps(autre!)) <= MEME_ACTE_MS;

    const roleProduitDe = (e: HistoryEvent) =>
        e.actorRole ?? users.find((u) => u.id === e.actorId)?.role;

    const etapes: { evenement: HistoryEvent; preuve: Preuve }[] = [];
    for (const e of surLaDemande) {
        /* La remise et la réception se lisent sur l'objet, avec leur preuve : leur double
           écrit sur la demande au même instant ne se répète pas. */
        if (e.type === 'ASSIGN_CONFIRMED' && procheDe(e, reception)) continue;
        if (
            e.type === 'ASSIGN_PENDING' &&
            lire(e, 'from') !== 'WAITING_DOTATION_APPROVAL' &&
            procheDe(e, remise)
        )
            continue;
        const { verbe, atteste } = acteSurLaDemande(e);
        const methode = methodeDe(e);
        const motif = lire(e, 'reason') ?? lire(e, 'comment');
        const role = e.isSystem ? undefined : roleDans(demande, e.actorId, roleProduitDe(e));
        etapes.push({
            evenement: e,
            preuve: {
                evenement: e,
                arret: e.type === 'APPROVAL_REJECT' || e.type === 'APPROVAL_DOTATION_REJECT',
                titre: `${e.isSystem ? 'Le système' : e.actorName} ${verbe}`,
                detail: [
                    role,
                    dansLaLigne(quandDe(e.timestamp)),
                    methode ?? (atteste ? 'méthode non consignée' : undefined),
                    motif ? `« ${motif} »` : undefined,
                ]
                    .filter(Boolean)
                    .join(' · '),
            },
        });
    }
    for (const e of [remise, reception]) {
        if (!e) continue;
        const preuve = preuveDe(e, registres, e);
        const signataire = e.type === 'ASSIGN_CONFIRMED' ? demande.beneficiaryId : e.actorId;
        const role = roleDans(
            demande,
            signataire,
            e.type === 'ASSIGN_CONFIRMED' ? undefined : roleProduitDe(e),
        );
        etapes.push({
            evenement: e,
            preuve: {
                ...preuve,
                titre: `${preuve.titre} ${objetDe(e, registres)}`,
                detail: [
                    role,
                    dansLaLigne(quandDe(e.timestamp)),
                    methodeDe(e) ?? 'méthode non consignée',
                ].join(' · '),
            },
        });
    }
    etapes.sort((a, b) => chrono(a.evenement, b.evenement));

    /* Ce qui reste à faire, tant que la demande est ouverte. */
    const beneficiaire = users.find((u) => u.id === demande.beneficiaryId);
    const managerAttendu = beneficiaire?.managerId
        ? users.find((u) => u.id === beneficiaire.managerId)
        : undefined;
    const derniere = surLaDemande[surLaDemande.length - 1];
    const jours = Math.max(
        0,
        Math.floor((Date.now() - new Date(derniere.timestamp).getTime()) / JOUR),
    );
    const depuis =
        jours === 0 ? 'depuis aujourd’hui' : `depuis ${jours} jour${jours > 1 ? 's' : ''}`;
    const managerLit = Boolean(moi) && managerAttendu?.id === moi;
    const beneficiaireLit = Boolean(moi) && demande.beneficiaryId === moi;
    const qui = managerAttendu?.name ?? 'Le manager';
    const beneficiaireNom = demande.beneficiaryName || 'Le bénéficiaire';
    /* **Ce qui reste à faire** (08/10) — l'étape attendue, puis celles qui suivront : le
       détail d'une tâche et la fiche de l'historique racontent ainsi la même demande, du dépôt
       à la réception. */
    const remiseAVenir: Preuve = {
        evenement: derniere,
        titre: 'Remise par l’informatique',
        detail: 'à venir',
        avenir: true,
    };
    const receptionAVenir: Preuve = {
        evenement: derniere,
        titre: `Réception par ${beneficiaireNom}`,
        detail: 'à venir',
        avenir: true,
    };
    const ici = (titre: string): Preuve => ({
        evenement: derniere,
        titre,
        detail: `en attente ${depuis}`,
        attente: true,
    });
    const suite: Record<string, Preuve[]> = {
        WAITING_MANAGER_APPROVAL: [
            ici(managerLit ? 'Vous devez valider la demande' : `${qui} doit valider la demande`),
            remiseAVenir,
            receptionAVenir,
        ],
        WAITING_IT_PROCESSING: [ici('L’informatique doit préparer la remise'), receptionAVenir],
        WAITING_DOTATION_APPROVAL: [
            ici(managerLit ? 'Vous devez valider la dotation' : `${qui} doit valider la dotation`),
            remiseAVenir,
            receptionAVenir,
        ],
        PENDING_DELIVERY: [
            ici(
                beneficiaireLit
                    ? 'Vous devez confirmer la réception'
                    : `${beneficiaireNom} doit confirmer la réception`,
            ),
        ],
    };
    const preuves = [...etapes.map((x) => x.preuve), ...(suite[demande.status] ?? [])];

    /* Les parties prenantes : chacune une fois, avec tout ce qu'elle a fait. */
    const parties = new Map<string, PartiePrenante>();
    const ajouter = (
        id: string | undefined,
        nom: string | undefined,
        role: string,
        acte?: string,
        attendue = false,
    ) => {
        if (!nom) return;
        const cle = id ?? nom;
        const deja = parties.get(cle);
        if (deja) {
            if (acte && !deja.actes.includes(acte)) deja.actes.push(acte);
            if (!attendue) deja.attendue = false;
            return;
        }
        parties.set(cle, { id, nom, role, actes: acte ? [acte] : [], attendue });
    };
    ajouter(demande.requesterId, demande.requesterName, roleDans(demande, demande.requesterId));
    ajouter(
        demande.beneficiaryId,
        demande.beneficiaryName,
        roleDans(demande, demande.beneficiaryId),
    );
    for (const { evenement: e, preuve } of etapes) {
        if (e.isSystem) continue;
        const id =
            e.type === 'ASSIGN_CONFIRMED' && e.targetType === 'EQUIPMENT'
                ? demande.beneficiaryId
                : e.actorId;
        const nom =
            e.type === 'ASSIGN_CONFIRMED' && e.targetType === 'EQUIPMENT'
                ? demande.beneficiaryName
                : e.actorName;
        const acte = preuve.titre.slice((nom ?? '').length).trim();
        ajouter(
            id,
            nom,
            roleDans(demande, id, e.type === 'ASSIGN_CONFIRMED' ? undefined : roleProduitDe(e)),
            acte,
        );
    }
    if (
        (demande.status === 'WAITING_MANAGER_APPROVAL' ||
            demande.status === 'WAITING_DOTATION_APPROVAL') &&
        managerAttendu
    )
        ajouter(
            managerAttendu.id,
            managerAttendu.name,
            'manager',
            demande.status === 'WAITING_DOTATION_APPROVAL'
                ? 'doit valider la dotation'
                : 'doit valider la demande',
            true,
        );

    return { demande, etapes: preuves, parties: [...parties.values()] };
};
