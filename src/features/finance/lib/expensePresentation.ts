import {
    Cloud,
    Key,
    ShoppingBag,
    Stack,
    Wrench,
} from '@phosphor-icons/react';

import { FinanceExpense, FinanceExpenseStatus, FinanceExpenseType } from '../../../types';

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

export const getExpenseStatusVariant = (status: FinanceExpenseStatus): 'success' | 'warning' | 'info' => {
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
