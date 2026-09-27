/**
 * Utility functions for Financial Calculations with Inheritance Support
 */

import type { FinanceBudget, FinanceExpenseType } from '../types';

// Taux de change fixes pour conversion explicite (pas appliquée automatiquement à l'affichage)
const EXCHANGE_RATES: Record<string, number> = {
    EUR: 1,
    USD: 1.05, // 1 EUR = 1.05 USD
    XOF: 655.957, // 1 EUR = 655.957 XOF (Taux fixe BCEAO)
    GBP: 0.85, // 1 EUR = 0.85 GBP
    JPY: 160, // 1 EUR = 160 JPY
};

interface DepreciationConfig {
    method: 'linear' | 'degressive';
    years: number;
    salvagePercent: number;
    source: 'global' | 'category' | 'equipment';
}

/**
 * Résout la configuration finale d'amortissement selon la hiérarchie de priorité.
 * Ordre : Équipement (Override) > Catégorie > Paramètres Globaux
 */
export function resolveDepreciationConfig(
    equipmentOverride: Partial<DepreciationConfig> | null,
    categoryConfig:
        | { method: 'linear' | 'degressive'; years: number; salvageValuePercent: number }
        | null
        | undefined,
    globalConfig: Omit<DepreciationConfig, 'source'>,
): DepreciationConfig {
    // Priorité 1 : Override manuel sur l'équipement
    if (equipmentOverride && equipmentOverride.years && equipmentOverride.years > 0) {
        return {
            method: equipmentOverride.method || 'linear',
            years: equipmentOverride.years,
            salvagePercent: equipmentOverride.salvagePercent ?? 0,
            source: 'equipment',
        };
    }

    // Priorité 2 : Configuration par défaut de la catégorie
    if (categoryConfig && categoryConfig.years > 0) {
        return {
            method: categoryConfig.method,
            years: categoryConfig.years,
            salvagePercent: categoryConfig.salvageValuePercent,
            source: 'category',
        };
    }

    // Priorité 3 : Paramètres globaux du système
    return {
        ...globalConfig,
        source: 'global',
    };
}

/**
 * Calcul de l'amortissement linéaire
 */
export function calculateLinearDepreciation(
    purchasePrice: number,
    purchaseDate: string | Date,
    depreciationYears: number,
    salvagePercent: number,
) {
    const pDate = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
    const salvageValue = purchasePrice * (salvagePercent / 100);
    const depreciableAmount = purchasePrice - salvageValue;

    if (depreciationYears <= 0) {
        return {
            purchasePrice,
            salvageValue,
            currentValue: purchasePrice,
            totalDepreciation: 0,
            monthlyDepreciation: 0,
            progressPercent: 0,
            isFullyDepreciated: false,
        };
    }

    const annualDepreciation = depreciableAmount / depreciationYears;
    const monthlyDepreciation = annualDepreciation / 12;

    // Calcul des mois écoulés
    const monthsElapsed = getMonthsDifference(pDate, new Date());

    const totalDepreciation = Math.min(monthlyDepreciation * monthsElapsed, depreciableAmount);

    const currentValue = purchasePrice - totalDepreciation;

    return {
        purchasePrice,
        salvageValue,
        currentValue: Number(currentValue.toFixed(2)),
        totalDepreciation: Number(totalDepreciation.toFixed(2)),
        monthlyDepreciation: Number(monthlyDepreciation.toFixed(2)),
        progressPercent:
            depreciableAmount > 0 ? (totalDepreciation / depreciableAmount) * 100 : 100,
        isFullyDepreciated: totalDepreciation >= depreciableAmount,
    };
}

/**
 * **L'échéancier d'un plan d'amortissement**, en pourcentage du prix d'achat, de l'achat
 * (année 0) à la fin de la durée — pour l'aperçu des Paramètres (25/09).
 *
 * Linéaire : la même part chaque année. Dégressif, selon la règle fiscale : le taux
 * linéaire majoré (×1,25 jusqu'à 4 ans, ×1,75 jusqu'à 6, ×2,25 au-delà) appliqué à ce qui
 * reste à amortir, jusqu'à ce que le linéaire sur les années restantes le rattrape.
 *
 * **Ce n'est pas le calcul du parc** : `calculateLinearDepreciation` reste linéaire quelle
 * que soit la méthode retenue — l'aperçu le dit quand on choisit le dégressif.
 */
export function echeancierAmortissement(
    method: 'linear' | 'degressive',
    years: number,
    salvagePercent: number,
): number[] {
    const duree = Math.max(1, Math.round(years));
    const residuel = Math.min(100, Math.max(0, salvagePercent));
    const valeurs = [100];
    if (method === 'linear') {
        for (let annee = 1; annee <= duree; annee += 1) {
            valeurs.push(100 - ((100 - residuel) * annee) / duree);
        }
        return valeurs;
    }
    const taux = (duree <= 4 ? 1.25 : duree <= 6 ? 1.75 : 2.25) / duree;
    let valeur = 100;
    for (let annee = 1; annee <= duree; annee += 1) {
        const restant = valeur - residuel;
        const dotation = Math.max(restant * taux, restant / (duree - annee + 1));
        valeur = Math.max(residuel, valeur - dotation);
        valeurs.push(valeur);
    }
    return valeurs;
}

/**
 * Helper : différence en mois entre deux dates
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
    if (isNaN(startDate.getTime())) return 0;
    return (
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    );
}

/**
 * Conversion explicite d'un montant d'une devise vers une autre.
 *
 * @param amount Montant source
 * @param fromCurrency Devise source
 * @param toCurrency Devise cible
 */
const convertCurrency = (amount: number, fromCurrency = 'EUR', toCurrency = 'EUR') => {
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    if (fromRate === 0) return amount;

    // Conversion pivotée via EUR
    const amountInEur = amount / fromRate;
    return amountInEur * toRate;
};

/**
 * Formatage monétaire standardisé.
 * Par défaut, le montant est supposé déjà dans la devise cible pour éviter
 * les écarts visuels entre saisie et affichage.
 *
 * @param amount Montant à afficher
 * @param currency Code devise cible (ex: 'XOF', 'USD')
 * @param compact Si true, utilise la notation compacte (ex: 2K, 1.5M)
 * @param convertFrom Devise source optionnelle (si conversion explicite requise)
 */
export const formatCurrency = (
    amount: number,
    currency = 'EUR',
    compact = false,
    convertFrom?: string,
) => {
    let locale = 'fr-FR';

    // Configuration Locale
    if (currency === 'USD') locale = 'en-US';
    if (currency === 'GBP') locale = 'en-GB';
    if (currency === 'JPY') locale = 'ja-JP';

    const displayAmount =
        convertFrom && convertFrom !== currency
            ? convertCurrency(amount, convertFrom, currency)
            : amount;

    // 2. Définir les décimales (0 pour XOF/JPY, 2 pour les autres)
    const digits = currency === 'XOF' || currency === 'JPY' ? 0 : 2;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        currencyDisplay: currency === 'XOF' ? 'code' : 'symbol',
        minimumFractionDigits: compact ? 0 : digits,
        maximumFractionDigits: compact ? 1 : digits,
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
        useGrouping: true, // Assure le séparateur de milliers
    }).format(displayAmount);
};

/**
 * Formatage de date localisé fr-FR (jj/mm/aaaa).
 * À utiliser à la place de `toLocaleDateString()` sans locale,
 * qui suit la locale du navigateur (formats US visibles).
 */
export const formatDate = (date: string | number | Date = new Date()) => {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('fr-FR');
};

/**
 * Formatage date + heure localisé fr-FR (jj/mm/aaaa hh:mm:ss).
 * Même rôle que `formatDate` pour les usages `toLocaleString()`.
 */
export const formatDateTime = (date: string | number | Date = new Date()) => {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('fr-FR');
};

/**
 * **Le moment d'un événement** — `.ev .d` de 03.1 et 18.1 : « aujourd'hui, 11:21 »,
 * « hier, 09:30 », sinon « 14 janvier, 13:15 » (l'année seulement si elle n'est pas
 * la nôtre). Une date de journal se lit d'un coup d'œil ; « 14/01/2026 » demande de la
 * déchiffrer.
 */
export const formatMoment = (date: string | number | Date = new Date()) => {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    const time = parsed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const now = new Date();
    const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const delta = Math.round((dayOf(now) - dayOf(parsed)) / 86_400_000);
    if (delta === 0) return `aujourd'hui, ${time}`;
    if (delta === 1) return `hier, ${time}`;
    const day = parsed.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        ...(parsed.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
    });
    return `${day}, ${time}`;
};

/**
 * Formatage de nombres simples (compteurs, stats)
 */
export const formatNumber = (amount: number, compact = false) => {
    return new Intl.NumberFormat('fr-FR', {
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
        useGrouping: true,
        maximumFractionDigits: 1,
    }).format(amount);
};

/**
 * **La ligne du budget sur laquelle une dépense s'impute** — par sa nature, et par elle
 * seule : le produit ne rattache pas une dépense à une ligne choisie (relevé du 10/09).
 * La saisie la montre avant « Enregistrer », pour dire ce qu'il restera sur ce poste.
 */
export const getBudgetCategoryByExpenseType = (type: FinanceExpenseType): string => {
    if (type === 'Purchase') return 'Matériel IT';
    if (type === 'License') return 'Licences Logiciel';
    if (type === 'Cloud') return 'Cloud Infrastructure';
    return 'Maintenance & Services';
};

/**
 * **L'exercice qu'on ouvre par défaut** (27/09) : celui de l'année en cours, sinon le premier
 * exercice en cours qui a des lignes, sinon le premier. Les pages prenaient le premier de la
 * liste — et les exercices arrivent de la base par identifiant, « 2025 » avant « 2026 » :
 * Finances s'ouvrait sur l'exercice clos.
 */
export const exerciceParDefaut = (budgets: readonly FinanceBudget[]): number | undefined =>
    (
        budgets.find((budget) => budget.year === new Date().getFullYear()) ??
        budgets.find((budget) => budget.status === 'En cours' && budget.items.length > 0) ??
        budgets[0]
    )?.year;
