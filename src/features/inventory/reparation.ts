import { Receipt, Tray, WarningCircle, Wrench } from '@phosphor-icons/react';

import { getStatusPresentation, type StatusPresentation } from '../../constants/statusPresentation';
import type { AppSettings, Equipment, RepairStage } from '../../types';

/**
 * **Le parcours d'une réparation, et ce qu'il dit à chaque étape** (24/09).
 *
 * Le produit posait un seul badge, « En réparation », dès qu'un incident immobilisait
 * l'objet : un incident à peine déclaré, un objet déposé au bureau informatique et un
 * objet chez le prestataire se lisaient pareil. Chaque étape a maintenant son mot, sa
 * teinte et son glyphe — et un seul geste suivant :
 *
 * | Étape           | Badge                     | Geste suivant                 | Qui      |
 * |-----------------|---------------------------|-------------------------------|----------|
 * | `declared`      | Incident déclaré (ambre)  | Recevoir le dépôt (attesté)   | IT       |
 * | `deposited`     | Déposé, à prendre en charge | Prendre en charge (+ devis) | IT       |
 * | `quote_pending` | Devis à valider (ambre)   | Valider ou refuser le devis   | Finance  |
 * | `at_repairer`   | En réparation (orange)    | Récupérer (+ facture)         | IT       |
 *
 * La récupération clôt le dossier ; l'objet repart chez son porteur par la remise
 * ordinaire, qu'il confirme.
 */

export const REPAIR_QUOTE_THRESHOLD_DEFAULT = 150000;

/** Le seuil au-delà duquel un devis va à la Finance. */
export const seuilDevis = (settings: Pick<AppSettings, 'repairQuoteThreshold'>): number =>
    settings.repairQuoteThreshold ?? REPAIR_QUOTE_THRESHOLD_DEFAULT;

const PRESENTATION_ETAPE: Record<RepairStage, StatusPresentation> = {
    declared: { icon: WarningCircle, tone: 'pending', label: 'Incident déclaré' },
    deposited: { icon: Tray, tone: 'pending', label: 'À prendre en charge' },
    quote_pending: { icon: Receipt, tone: 'pending', label: 'Devis à valider' },
    at_repairer: { icon: Wrench, tone: 'attention', label: 'En réparation' },
};

/** L'étape de réparation d'un objet, s'il suit le parcours. */
export const etapeDeReparation = (item: Pick<Equipment, 'repair'>): RepairStage | null =>
    item.repair?.stage ?? null;

/**
 * **Le badge d'un objet** : l'étape de réparation quand il en suit une, l'état sinon.
 * C'est la seule porte des écrans qui montrent l'état d'un objet — liste, fiche, file.
 */
export const presentationEtat = (
    item: Pick<Equipment, 'status' | 'repair'>,
): StatusPresentation => {
    const etape = etapeDeReparation(item);
    return etape ? PRESENTATION_ETAPE[etape] : getStatusPresentation(item.status);
};

/** La phrase d'étape, pour la carte de la fiche et la file des tâches. */
export const phraseEtape = (item: Pick<Equipment, 'repair'>): string | null => {
    const r = item.repair;
    if (!r) return null;
    switch (r.stage) {
        case 'declared':
            return r.holderName
                ? `chez ${r.holderName}, à déposer`
                : 'à déposer au bureau informatique';
        case 'deposited':
            return r.quoteDecision?.status === 'rejected'
                ? 'devis refusé, à reprendre'
                : 'au bureau informatique';
        case 'quote_pending':
            return 'devis en attente de la Finance';
        case 'at_repairer':
            return r.takenCharge ? `chez ${r.takenCharge.repairer}` : 'chez le prestataire';
    }
};
