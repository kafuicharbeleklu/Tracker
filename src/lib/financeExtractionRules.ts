import { FinanceExpenseType } from '../types';

export const INVOICE_NUMBER_PATTERNS: RegExp[] = [
    /\b(?:invoice|facture|fact|inv|bill|document)\s*(?:no|n|num|number|#|n[°º])?\s*[:-]?\s*([a-z0-9][a-z0-9/_-]{2,})\b/i,
    /\b((?:inv|fac|fact|bill|doc)[-_ ]?\d{2,}[a-z0-9/_-]*)\b/i,
    /\b(?:ref(?:erence)?|reference|piece|n[°º])\s*[:-]?\s*([a-z0-9][a-z0-9/_-]{2,})\b/i,
];

export const AMOUNT_LABEL_PATTERNS: RegExp[] = [
    /\b(?:total(?:\s+(?:ttc|ht|due))?|montant(?:\s+(?:ttc|ht))?|net\s*a\s*payer|amount\s*due)\b[^\d]{0,20}([0-9][0-9\s.,]{0,20})/i,
    /\b(?:ttc|grand\s*total|total\s*general)\b[^\d]{0,20}([0-9][0-9\s.,]{0,20})/i,
];

export const DATE_PATTERNS: RegExp[] = [
    /\b(?:date|issued|émis|emise|emission)\b[^\d]{0,10}(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,
    /\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/,
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/,
];

export const SUPPLIER_LABEL_PATTERNS: RegExp[] = [
    /\b(?:fournisseur|vendor|seller|supplier|societe|company)\b\s*[:-]?\s*(.+)/i,
    /\b(?:from|emetteur|émetteur|issued\s+by)\b\s*[:-]?\s*(.+)/i,
];

export const CURRENCY_PATTERNS: Array<{ code: string; regex: RegExp }> = [
    { code: 'EUR', regex: /(?:€|\beur\b|euro)/i },
    { code: 'USD', regex: /(?:\$|\busd\b|dollar)/i },
    { code: 'XOF', regex: /(?:\bxof\b|\bcfa\b|fcfa)/i },
];

export const EXPENSE_TYPE_KEYWORDS: Record<FinanceExpenseType, string[]> = {
    Purchase: [
        'laptop',
        'ordinateur',
        'pc',
        'monitor',
        'materiel',
        'hardware',
        'equipment',
        'device',
        'serveur',
    ],
    License: ['license', 'licence', 'subscription', 'abonnement', 'saas', 'microsoft 365', 'adobe'],
    Maintenance: ['maintenance', 'support', 'warranty', 'garantie', 'repair', 'reparation'],
    Service: ['service', 'consulting', 'audit', 'installation', 'telecom', 'internet', 'fibre'],
    Cloud: ['cloud', 'aws', 'azure', 'gcp', 'hosting', 'storage', 'compute'],
};

export const NON_SUPPLIER_TOKENS = [
    'facture',
    'invoice',
    'total',
    'montant',
    'date',
    'client',
    'description',
    'tva',
    'objet',
    'service',
    'article',
    'payment',
    'paiement',
    'due',
];
