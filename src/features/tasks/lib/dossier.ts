import {
    calculateLinearDepreciation,
    formatCurrency,
    getBudgetCategoryByExpenseType,
} from '../../../lib/financial';
import { codeDAttestation, codeDeLaPreuve, libelleAttestation } from '../../../lib/attestation';
import type {
    AppSettings,
    Equipment,
    FinanceBudget,
    HistoryEvent,
    RepairCase,
    User,
} from '../../../types';
import type { Task } from './file';

/**
 * **Ce qu'une tâche montre quand on l'ouvre** (08/10).
 *
 * Une réparation s'ouvrait sur « LPT-DKR-01 · Afi Mbaye · chez Bureautique Plus · retour en
 * retard » : on savait qu'il y avait un problème, pas de quoi agir. Un retour, une remise,
 * une réception, pas mieux — un code et un mot. Le dossier de l'objet portait pourtant tout :
 * la panne déclarée, le dépôt et sa preuve, le réparateur et son ticket, la garantie, le
 * devis et qui l'a tranché, la date de retour promise.
 *
 * Le dossier d'une tâche dit, dans la forme de l'historique :
 * - **une sous-ligne** qui nomme les parties et l'étape ;
 * - **ce qui a été déclaré**, cité tel quel, avec qui et quand ;
 * - **le parcours** : ce qui est fait, l'étape en cours, ce qui viendra.
 *
 * **Pas de cartes de faits** (08/10, second passage) : trois cartes au-dessus du parcours
 * surchargeaient la vue, et au téléphone elles s'empilaient en un tableau à deux colonnes.
 * Ce qu'elles disaient d'utile se lit maintenant **dans l'étape qui en a besoin** — la
 * garantie là où l'on prend en charge, la part du devis dans la valeur de l'objet là où on
 * le tranche.
 *
 * Les demandes ont leur parcours, tiré du journal (`parcoursDeLaDemande`) ; la collecte, sa
 * feuille d'examen.
 */

export interface EtapeDuDossier {
    titre: string;
    detail?: string;
    /** Le code de l'attestation de l'étape — signature, code PIN : son badge dans le fil. */
    attestation?: string;
    etat: 'faite' | 'ici' | 'avenir' | 'arret';
}

export interface DossierDeTache {
    sousLigne?: string;
    citation?: { texte: string; source?: string };
    etapes: EtapeDuDossier[];
}

export interface ContexteDuDossier {
    equipment: readonly Equipment[];
    users: readonly User[];
    events: readonly HistoryEvent[];
    settings: AppSettings;
    /** Les budgets, pour qui lit la finance ; vide sinon. */
    budgets: readonly FinanceBudget[];
    /** Qui lit : son étape lui parle — « Vous devez confirmer la réception ». */
    moi?: string;
}

const JOUR = 86_400_000;

const joursDepuis = (iso?: string | null): number | null => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / JOUR));
};

/** « 25 sept. », et l'année quand ce n'est pas celle en cours. */
const jourCourt = (iso?: string | null): string => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
    });
};

/** « mercredi 23 septembre » — la date d'une étape, comme le journal l'écrit. */
const jourLong = (iso?: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
    });
};

const enJours = (n: number | null): string =>
    n === null || n === 0 ? 'aujourd’hui' : `${n} jour${n > 1 ? 's' : ''}`;

const enAttente = (iso?: string | null): string => {
    const n = joursDepuis(iso);
    return n === null ? '' : n === 0 ? 'depuis aujourd’hui' : `en attente depuis ${enJours(n)}`;
};

const joindre = (...morceaux: (string | null | undefined | false)[]): string =>
    morceaux.filter(Boolean).join(' · ');

/** La garantie, en mots — `null` quand on ne la connaît pas. */
const garantieEnMots = (item: Equipment): string | null => {
    if (!item.warrantyEnd) return null;
    return new Date(item.warrantyEnd).getTime() >= Date.now()
        ? `sous garantie jusqu’au ${jourCourt(item.warrantyEnd)}`
        : 'garantie échue';
};

/** La part d'un devis dans la valeur nette de l'objet — ce qu'une réparation doit justifier. */
const partDeLaValeur = (item: Equipment, settings: AppSettings, devis?: number): string | null => {
    const f = item.financial;
    if (!devis || !f?.purchasePrice || !f.purchaseDate) return null;
    const valeur = calculateLinearDepreciation(
        f.purchasePrice,
        f.purchaseDate,
        f.depreciationYears || settings.defaultDepreciationYears || 3,
        settings.salvageValuePercent ?? 0,
    ).currentValue;
    return valeur > 0 ? `${Math.round((devis / valeur) * 100)} % de sa valeur nette` : null;
};

/** La dernière trace d'un type sur l'objet, au journal. */
const derniereTrace = (
    ctx: ContexteDuDossier,
    item: Equipment,
    filtre: (e: HistoryEvent) => boolean,
): HistoryEvent | undefined =>
    [...ctx.events]
        .filter((e) => e.targetType === 'EQUIPMENT' && e.targetId === item.id && filtre(e))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

/**
 * La preuve d'une étape : son code quand un badge sait le dire (signature, code PIN), ses
 * mots sinon — « confirmée à l'écran, session ouverte ».
 */
const preuveDe = (methode: unknown, ecrite?: unknown): { attestation?: string; mots?: string } => {
    const m = typeof methode === 'string' ? methode : undefined;
    const code =
        codeDAttestation(m) ?? codeDeLaPreuve(typeof ecrite === 'string' ? ecrite : undefined);
    return code ? { attestation: code } : { mots: libelleAttestation(m) ?? undefined };
};

/* ------------------------------------------------------------------- la réparation */

const dossierDeReparation = (
    item: Equipment,
    dossier: RepairCase,
    ctx: ContexteDuDossier,
): DossierDeTache => {
    const devise = ctx.settings.currency;
    const incident =
        item.incidents?.find((i) => i.id === dossier.incidentId) ?? item.incidents?.[0];
    const porteur = dossier.holderName || item.user?.name;
    const moiPorteur = Boolean(ctx.moi) && dossier.holderId === ctx.moi;
    const charge = dossier.takenCharge;
    const decision = dossier.quoteDecision;
    const devis = dossier.quote?.amount;
    const montant = typeof devis === 'number' ? formatCurrency(devis, devise) : null;
    const attendu = charge?.expectedReturn;
    const retard = attendu ? Math.floor((Date.now() - new Date(attendu).getTime()) / JOUR) : null;
    const refuse = dossier.stage === 'deposited' && decision?.status === 'rejected';

    /* La sous-ligne dit l'étape : une prise en charge d'avant un devis refusé n'est plus
       « chez » personne. */
    const sousLigne = joindre(
        porteur,
        ...(dossier.stage === 'at_repairer'
            ? [
                  `chez ${charge?.repairer ?? 'le prestataire'}`,
                  charge?.ticket ? `ticket ${charge.ticket}` : null,
                  retard === null
                      ? null
                      : retard > 0
                        ? `${retard} j de retard`
                        : `retour prévu le ${jourCourt(attendu)}`,
              ]
            : dossier.stage === 'quote_pending'
              ? [charge?.repairer ? `devis de ${charge.repairer}` : 'devis à trancher']
              : refuse
                ? [`devis refusé${decision?.byName ? ` par ${decision.byName}` : ''}`]
                : dossier.stage === 'deposited'
                  ? ['déposé, à prendre en charge']
                  : ['à déposer à l’informatique']),
    );

    const etapes: EtapeDuDossier[] = [];
    if (incident)
        etapes.push({
            etat: 'faite',
            titre: `${incident.declaredByName} a déclaré la panne`,
            detail: joindre(
                jourLong(incident.declaredAt),
                incident.photos.length > 0 &&
                    `${incident.photos.length} photo${incident.photos.length > 1 ? 's' : ''}`,
            ),
        });

    if (dossier.deposit)
        etapes.push({
            etat: 'faite',
            titre: `${dossier.deposit.byName} a reçu le dépôt`,
            detail: joindre(jourLong(dossier.deposit.at), preuveDe(dossier.deposit.method).mots),
            attestation: preuveDe(dossier.deposit.method).attestation,
        });
    else
        etapes.push({
            etat: 'ici',
            titre: moiPorteur
                ? 'Vous devez déposer l’objet à l’informatique'
                : `${porteur ?? 'Le porteur'} doit déposer l’objet à l’informatique`,
            detail: enAttente(dossier.openedAt),
        });

    if (charge)
        etapes.push({
            etat: 'faite',
            titre: `${charge.byName} a pris en charge`,
            detail: joindre(
                jourLong(charge.at),
                charge.repairer,
                charge.underWarranty && 'sous garantie',
                charge.ticket && `ticket ${charge.ticket}`,
            ),
        });
    else if (dossier.deposit)
        /* La garantie décide de qui paiera : elle se lit là où l'on prend en charge. */
        etapes.push({
            etat: 'ici',
            titre: 'L’informatique doit prendre en charge',
            detail: joindre(
                `déposé depuis ${enJours(joursDepuis(dossier.deposit.at))}`,
                garantieEnMots(item),
            ),
        });
    else etapes.push({ etat: 'avenir', titre: 'Prise en charge', detail: 'à venir' });

    if (refuse)
        etapes.push(
            {
                etat: 'arret',
                titre: `${decision?.byName ?? 'La Finance'} a refusé le devis`,
                /* Le motif entre guillemets, comme le journal l'écrit d'un refus. */
                detail: joindre(
                    jourLong(decision?.at),
                    montant,
                    partDeLaValeur(item, ctx.settings, devis),
                    decision?.reason && `«\u00a0${decision.reason}\u00a0»`,
                ),
            },
            {
                etat: 'ici',
                titre: 'L’informatique doit reprendre le dossier',
                detail: 'un autre devis, un poste du stock, ou la réforme',
            },
        );
    else if (decision?.status === 'approved' && montant)
        etapes.push({
            etat: 'faite',
            titre: `${decision.byName ?? 'L’informatique'} a validé le devis`,
            detail: joindre(
                jourLong(decision.at),
                montant,
                decision.level === 'finance' ? 'Finance' : 'sous le seuil',
            ),
        });
    else if (dossier.stage === 'quote_pending') {
        /* Ce qui tranche un devis : ce qu'il pèse face à l'objet, et face au budget. */
        const ligne = ctx.budgets
            .find((b) => b.year === new Date().getFullYear())
            ?.items.find((i) => i.category === getBudgetCategoryByExpenseType('Maintenance'));
        const depasse = ligne && typeof devis === 'number' && devis > ligne.allocated - ligne.spent;
        etapes.push({
            etat: 'ici',
            titre: 'La Finance doit trancher le devis',
            detail: joindre(
                montant,
                partDeLaValeur(item, ctx.settings, devis),
                depasse && 'au-delà du budget maintenance restant',
            ),
        });
    }

    if (dossier.sentAt)
        etapes.push({
            etat: 'faite',
            titre: `Envoyé chez ${charge?.repairer ?? 'le prestataire'}`,
            detail: jourLong(dossier.sentAt),
        });
    if (dossier.stage === 'at_repairer')
        etapes.push({
            etat: 'ici',
            titre: `Retour attendu le ${jourCourt(attendu)}`,
            detail:
                retard !== null && retard > 0
                    ? `${retard} j de retard`
                    : `chez ${charge?.repairer ?? 'le prestataire'}`,
        });
    else etapes.push({ etat: 'avenir', titre: 'Retour du réparateur', detail: 'à venir' });
    etapes.push({
        etat: 'avenir',
        titre: porteur ? `Remise à ${porteur}` : 'Retour en stock',
        detail: 'à venir',
    });

    return {
        sousLigne,
        citation: incident?.comment
            ? {
                  texte: incident.comment,
                  source: `panne déclarée par ${incident.declaredByName}, ${jourCourt(incident.declaredAt)}`,
              }
            : undefined,
        etapes,
    };
};

/* ------------------------------------------------------- les passages de main */

const dossierDeRetour = (tache: Task, item: Equipment, ctx: ContexteDuDossier): DossierDeTache => {
    const porteur = item.user?.name;
    const engage = derniereTrace(
        ctx,
        item,
        (e) =>
            e.type === 'RETURN' &&
            (e.metadata?.stage === 'initiation' ||
                e.metadata?.toAssignmentStatus === 'PENDING_RETURN'),
    );
    const quand = item.returnRequestedAt ?? engage?.timestamp ?? null;
    const detenu = item.assignedAt ? joursDepuis(item.assignedAt) : null;
    const demandePar = item.returnRequestedBy
        ? ctx.users.find((u) => u.id === item.returnRequestedBy)?.name
        : undefined;
    const parLeGestionnaire = tache.id.startsWith('return-user-');
    const commentaire =
        typeof engage?.metadata?.comment === 'string' ? engage.metadata.comment : undefined;

    const etapes: EtapeDuDossier[] = parLeGestionnaire
        ? [
              {
                  etat: 'faite',
                  titre: `${demandePar ?? 'L’informatique'} a demandé la restitution`,
                  detail: jourLong(quand),
              },
              {
                  etat: 'ici',
                  titre:
                      ctx.moi && item.user?.id === ctx.moi
                          ? 'Vous devez restituer l’objet'
                          : `${porteur ?? 'Le porteur'} doit restituer l’objet`,
                  detail: enAttente(quand),
              },
              { etat: 'avenir', titre: 'Réception par l’informatique', detail: 'à venir' },
          ]
        : [
              {
                  etat: 'faite',
                  titre: `${porteur ?? 'Le porteur'} a restitué l’objet`,
                  detail: joindre(
                      jourLong(quand),
                      preuveDe(engage?.metadata?.method, engage?.metadata?.proof).mots,
                      detenu !== null && `détenu ${enJours(detenu)}`,
                  ),
                  attestation: preuveDe(engage?.metadata?.method, engage?.metadata?.proof)
                      .attestation,
              },
              {
                  etat: 'ici',
                  titre: 'L’informatique doit réceptionner et constater l’état',
                  detail: enAttente(quand),
              },
              { etat: 'avenir', titre: 'Retour en stock', detail: 'à venir' },
          ];

    return {
        sousLigne: joindre(
            porteur,
            parLeGestionnaire ? 'restitution demandée' : 'retour à réceptionner',
        ),
        citation: commentaire
            ? {
                  texte: commentaire,
                  source: `dit par ${porteur ?? 'le porteur'} en rendant l’objet`,
              }
            : undefined,
        etapes,
    };
};

const dossierDeRemise = (item: Equipment, ctx: ContexteDuDossier): DossierDeTache => {
    const destinataire = item.user?.name;
    const remise = derniereTrace(
        ctx,
        item,
        (e) => e.type === 'ASSIGN_PENDING' || e.type === 'ASSIGN',
    );
    const quand = item.assignedAt ?? remise?.timestamp ?? null;
    const moiDestinataire = Boolean(ctx.moi) && item.user?.id === ctx.moi;
    return {
        /* Ce qu'on vérifie en le recevant : le modèle et le numéro de série. */
        sousLigne: joindre(
            !moiDestinataire && destinataire,
            item.model,
            item.serialNumber && `série ${item.serialNumber}`,
        ),
        etapes: [
            {
                etat: 'faite',
                titre: `${remise?.actorName ?? 'L’informatique'} a remis l’objet`,
                detail: joindre(
                    jourLong(quand),
                    preuveDe(remise?.metadata?.method, remise?.metadata?.proof).mots,
                ),
                attestation: preuveDe(remise?.metadata?.method, remise?.metadata?.proof)
                    .attestation,
            },
            {
                etat: 'ici',
                titre: moiDestinataire
                    ? 'Vous devez confirmer la réception'
                    : `${destinataire ?? 'Le destinataire'} doit confirmer la réception`,
                detail: enAttente(quand),
            },
        ],
    };
};

/**
 * Le dossier d'une tâche qui n'est pas une demande — `null` pour une demande (elle a son
 * parcours) ou une collecte (elle a sa feuille d'examen).
 */
export const dossierDeTache = (tache: Task, ctx: ContexteDuDossier): DossierDeTache | null => {
    if (tache.approvalId || tache.deviceId || !tache.targetId) return null;
    const item = ctx.equipment.find((e) => e.id === tache.targetId);
    if (!item) return null;
    if (tache.id.startsWith('rep-') && item.repair)
        return dossierDeReparation(item, item.repair, ctx);
    if (tache.id.startsWith('return-')) return dossierDeRetour(tache, item, ctx);
    if (tache.id.startsWith('handover-') || tache.id.startsWith('delivery-'))
        return dossierDeRemise(item, ctx);
    return null;
};
