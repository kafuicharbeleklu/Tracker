import { useMemo } from 'react';

import { useFinanceData } from '../../../context/FinanceDataContext';
import { FinanceBudget } from '../../../types';

/**
 * L'exercice budgétaire ouvert, et ses trois chiffres — **calculés une fois**.
 *
 * Le héro de la planche 15.1 énonce « X restants sur une enveloppe de Y » ; le
 * panneau de détail d'une dépense a besoin des mêmes postes pour dire sur lequel
 * elle s'impute. Deux écrans, un seul calcul.
 */
export const useBudgetExercise = (selectedYear: number) => {
    const { financeBudgets } = useFinanceData();

    const currentBudget = useMemo<FinanceBudget>(() => {
        const selected = financeBudgets.find((budget) => budget.year === selectedYear);
        if (selected) return selected;

        return {
            year: selectedYear,
            status: 'En cours',
            totalAllocated: 0,
            items: [],
            updatedAt: new Date().toISOString(),
        };
    }, [financeBudgets, selectedYear]);

    const budgetStats = useMemo(() => {
        const totalSpent = currentBudget.items.reduce((acc, item) => acc + item.spent, 0);
        const totalAllocated = currentBudget.totalAllocated;
        const remaining = totalAllocated - totalSpent;
        const percent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
        return { totalSpent, totalAllocated, remaining, percent };
    }, [currentBudget]);

    return { currentBudget, budgetStats };
};
