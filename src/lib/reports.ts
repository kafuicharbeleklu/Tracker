import { Equipment, HistoryEvent } from '../types';
import { getHistoryEventTitle, isEquipmentMovementEvent } from './businessRules';

/**
 * Constructeurs de rapports (Reports) — fonctions pures sur l'état vivant du
 * DataContext, pour que les exports CSV/PDF reflètent le parc réel (audit §7.5).
 * L'ordre des clés d'une ligne définit l'ordre des colonnes exportées.
 */
export type ReportRow = Record<string, string | number>;

export const AGING_THRESHOLD_YEARS = 3;
export const WARRANTY_WINDOW_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

const asValidDate = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatIsoDay = (value?: string): string => (value ? value.split('T')[0] : '—');

export const buildInventoryReportRows = (equipment: Equipment[]): ReportRow[] =>
    equipment.map((item) => ({
        ID: item.assetId,
        Nom: item.name,
        Type: item.type,
        Modele: item.model,
        Statut: item.status,
        Utilisateur: item.user?.name || 'N/A',
        Pays: item.country || '—',
    }));

const readMetadataString = (event: HistoryEvent, key: string): string | null => {
    const value = event.metadata?.[key];
    return typeof value === 'string' ? value : null;
};

/**
 * Mouvements (attributions, retours…) concernant un utilisateur donné :
 * il est bénéficiaire du mouvement ou détenteur précédent (retour/réattribution).
 */
export const buildUserMovementReportRows = (
    events: HistoryEvent[],
    userId: string,
): ReportRow[] =>
    events
        .filter(isEquipmentMovementEvent)
        .filter(
            (event) =>
                readMetadataString(event, 'beneficiaryId') === userId
                || readMetadataString(event, 'previousUserId') === userId,
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((event) => ({
            Date: formatIsoDay(event.timestamp),
            Evenement: getHistoryEventTitle(event.type),
            Equipement: event.targetName,
            Sens: readMetadataString(event, 'beneficiaryId') === userId ? 'Attribution' : 'Retour/Retrait',
            Details: event.description,
        }));

/** Équipements de plus de `thresholdYears` ans (strictement), d'après la date d'achat. */
export const buildAgingReportRows = (
    equipment: Equipment[],
    now: Date,
    thresholdYears: number = AGING_THRESHOLD_YEARS,
): ReportRow[] => {
    const threshold = new Date(now);
    threshold.setFullYear(threshold.getFullYear() - thresholdYears);

    return equipment
        .map((item) => ({ item, purchase: asValidDate(item.financial?.purchaseDate) }))
        .filter((entry): entry is { item: Equipment; purchase: Date } =>
            entry.purchase !== null && entry.purchase < threshold,
        )
        .sort((a, b) => a.purchase.getTime() - b.purchase.getTime())
        .map(({ item, purchase }) => ({
            ID: item.assetId,
            Nom: item.name,
            Type: item.type,
            Modele: item.model,
            DateAchat: formatIsoDay(item.financial?.purchaseDate),
            AgeAnnees: Math.floor((now.getTime() - purchase.getTime()) / (365.25 * DAY_MS)),
            Statut: item.status,
            Utilisateur: item.user?.name || 'N/A',
        }));
};

/** Équipements dont la garantie expire dans la fenêtre (exclut les garanties déjà expirées). */
export const buildWarrantyReportRows = (
    equipment: Equipment[],
    now: Date,
    windowDays: number = WARRANTY_WINDOW_DAYS,
): ReportRow[] => {
    const limit = new Date(now.getTime() + windowDays * DAY_MS);

    return equipment
        .map((item) => ({ item, end: asValidDate(item.warrantyEnd) }))
        .filter((entry): entry is { item: Equipment; end: Date } =>
            entry.end !== null && entry.end > now && entry.end <= limit,
        )
        .sort((a, b) => a.end.getTime() - b.end.getTime())
        .map(({ item, end }) => ({
            ID: item.assetId,
            Nom: item.name,
            Type: item.type,
            Modele: item.model,
            FinGarantie: formatIsoDay(item.warrantyEnd),
            JoursRestants: Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
            Utilisateur: item.user?.name || 'N/A',
        }));
};
