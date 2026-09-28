import { Cloud, Desktop, Key, ShoppingBag, Stack, Wrench } from '@phosphor-icons/react';

import { getBudgetCategoryByExpenseType } from '../../../lib/financial';
import {
    FinanceBudgetItem,
    FinanceExpense,
    FinanceExpenseStatus,
    FinanceExpenseType,
} from '../../../types';

/**
 * Le vocabulaire d'une dépense — **écrit une fois pour les deux écrans**.
 *
 * Depuis que la planche 15.1 a séparé « Finances, ce qui reste » du journal des
 * dépenses, les mêmes libellés, les mêmes formats de date et de montant servent
 * deux pages et un panneau de détail. Ils vivent ici plutôt que recopiés : un
 * libellé recopié finit par diverger, et deux écrans qui nomment différemment la
 * même dépense se lisent comme deux dépenses.
 */

export const EXPENSE_TYPE_LABELS: Record<FinanceExpenseType, string> = {
    Purchase: 'Achat',
    License: 'Licence',
    Maintenance: 'Maintenance',
    Service: 'Service',
    Cloud: 'Cloud',
};

export const EXPENSE_TYPE_OPTIONS = [
    { value: 'Purchase', label: 'Achat (CAPEX)' },
    { value: 'License', label: 'Licence' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Service', label: 'Service' },
    { value: 'Cloud', label: 'Cloud' },
];

export const EXPENSE_STATUS_OPTIONS = [
    { value: 'Paid', label: 'Payée' },
    { value: 'Pending', label: 'En attente' },
    { value: 'Recurring', label: 'Récurrente' },
];

export const getExpenseStatusLabel = (status: FinanceExpenseStatus): string => {
    if (status === 'Paid') return 'Payée';
    if (status === 'Pending') return 'En attente';
    return 'Récurrente';
};

export const getExpenseStatusVariant = (
    status: FinanceExpenseStatus,
): 'success' | 'warning' | 'info' => {
    if (status === 'Paid') return 'success';
    if (status === 'Pending') return 'warning';
    return 'info';
};

export const getExpenseTypeGlyph = (type: FinanceExpenseType) => {
    if (type === 'Purchase') return ShoppingBag;
    if (type === 'Cloud') return Cloud;
    if (type === 'License') return Key;
    if (type === 'Maintenance') return Wrench;
    return Stack;
};

/**
 * **Le glyphe d'un poste** (27/09) — un par ligne de budget, pas un par nature : la
 * maintenance et le service s'imputent sur le même poste, ils portent la même clé. Le
 * journal du bureau le met en tête de rangée, à la place des deux lettres du fournisseur
 * (« L— » pour Lenovo — distributeur…, « R& » pour Réseaux & Co).
 */
export const getPosteGlyph = (type: FinanceExpenseType) => {
    if (type === 'Purchase') return Desktop;
    if (type === 'License') return Key;
    if (type === 'Cloud') return Cloud;
    return Wrench;
};

/**
 * **Le poste d'une dépense** — la ligne dont elle consomme l'enveloppe. Le produit impute
 * par nature et par elle seule (`getBudgetCategoryByExpenseType`) : c'est la règle qui fait
 * monter le `spent` du poste à l'enregistrement. Le poste qu'on affiche est donc celui qui
 * a compté la dépense, pas une ligne devinée par ressemblance de libellé.
 */
export const posteDeLaDepense = (
    expense: Pick<FinanceExpense, 'type'>,
    items: readonly FinanceBudgetItem[],
): FinanceBudgetItem | null =>
    items.find((item) => item.category === getBudgetCategoryByExpenseType(expense.type)) ?? null;

/** Le justificatif d'une dépense — **trois états, pas deux** (27/09). */
export type EtatDuJustificatif = 'joint' | 'manquant' | 'facultatif';

export const aUnJustificatif = (expense: FinanceExpense): boolean =>
    Boolean(expense.sourceFileName || expense.sourceFileId || expense.sourceFileUrl);

/**
 * Joint, manquant — ou **facultatif** : une dépense récurrente se justifie par son contrat,
 * pas par une pièce chaque mois. Sans ce troisième état, la vue « Sans justificatif »
 * comptait les 17 abonnements de l'exercice, dix-sept fausses alertes pour quatre vraies
 * (arbitrage du 27/09 ; Qonto et Pennylane font de même).
 */
export const etatDuJustificatif = (expense: FinanceExpense): EtatDuJustificatif => {
    if (aUnJustificatif(expense)) return 'joint';
    return expense.status === 'Recurring' ? 'facultatif' : 'manquant';
};

export const formatExpenseDate = (value: string): string => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('fr-FR').format(parsedDate);
};

export const formatExpenseAmount = (amount: number, currencyCode: string): string => {
    const numericValue = Number(amount);
    if (!Number.isFinite(numericValue)) {
        return `0,00 ${currencyCode}`;
    }

    const sign = numericValue < 0 ? '-' : '';
    const absolute = Math.abs(numericValue);
    const fixed = absolute.toFixed(2);
    const [integerPart, decimalPart] = fixed.split('.');
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${groupedInteger},${decimalPart} ${currencyCode}`;
};

export const toExpenseDescriptionPreview = (value: string, maxLength = 88): string => {
    const normalized = (value || '').trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

export const toExpenseDisplayTitle = (expense: FinanceExpense): string => {
    const formattedDate = formatExpenseDate(expense.date);
    const supplier = expense.supplier?.trim() || 'Fournisseur';
    const title = `Dépense · ${supplier} · ${formattedDate}`;
    return title.length > 56 ? `${title.slice(0, 56).trimEnd()}...` : title;
};
