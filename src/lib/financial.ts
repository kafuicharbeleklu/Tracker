/**
 * Utility functions for Financial Calculations with Inheritance Support
 */

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
