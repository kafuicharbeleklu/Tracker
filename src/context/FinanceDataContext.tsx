import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { mockFinanceBudgets, mockFinanceExpenses } from '../data/mockFinanceData';
import {
    FinanceBudget,
    FinanceExpense,
    FinanceExpenseInsertResult,
    FinanceExpenseType,
} from '../types';
import { canManageFinanceByRole } from '../lib/businessRules';
import { deleteExpenseSourceFile } from '../lib/financeFileStorage';
import { getPersistedValue } from '../lib/persistence';
import { EffectiveAccessProfile } from '../types/rbac';

interface FinanceDataContextType {
    financeExpenses: FinanceExpense[];
    financeBudgets: FinanceBudget[];
    addFinanceExpense: (
        expense: Omit<FinanceExpense, 'id' | 'createdAt'>,
    ) => FinanceExpenseInsertResult;
    updateFinanceExpense: (
        id: string,
        updates: Partial<Omit<FinanceExpense, 'id' | 'createdAt'>>,
    ) => boolean;
    deleteFinanceExpense: (id: string) => boolean;
    upsertFinanceBudget: (
        budget: Omit<FinanceBudget, 'updatedAt'> & { updatedAt?: string },
    ) => void;
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
    financeExpenses: { current: 'tracker_finance_expenses', legacy: 'neemba_finance_expenses' },
    financeBudgets: { current: 'tracker_finance_budgets', legacy: 'neemba_finance_budgets' },
} as const;

const getBudgetCategoryByExpenseType = (type: FinanceExpenseType): string => {
    if (type === 'Purchase') return 'Matériel IT';
    if (type === 'License') return 'Licences Logiciel';
    if (type === 'Cloud') return 'Cloud Infrastructure';
    return 'Maintenance & Services';
};

const normalizeValueForFingerprint = (value: string | undefined): string => {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const buildExpenseFingerprint = (
    expense: Pick<FinanceExpense, 'supplier' | 'invoiceNumber' | 'amount' | 'date'>,
): string => {
    const supplier = normalizeValueForFingerprint(expense.supplier);
    const invoice = normalizeValueForFingerprint(expense.invoiceNumber || '');
    const amount = Number(expense.amount || 0).toFixed(2);
    const date = normalizeValueForFingerprint(expense.date || '');
    return `${supplier}|${invoice}|${amount}|${date}`;
};

const resolveExpenseYear = (date: string): number => {
    const parsedYear = Number(date?.slice(0, 4));
    if (Number.isFinite(parsedYear) && parsedYear > 0) {
        return parsedYear;
    }
    return new Date().getFullYear();
};

const adjustBudgetWithExpense = (
    budgets: FinanceBudget[],
    expense: Pick<FinanceExpense, 'date' | 'type' | 'amount'>,
    direction: 1 | -1,
    updatedAt: string,
): FinanceBudget[] => {
    const expenseYear = resolveExpenseYear(expense.date);
    const budgetCategory = getBudgetCategoryByExpenseType(expense.type);
    const normalizedAmount = Math.max(0, Number(expense.amount) || 0);

    if (normalizedAmount <= 0) {
        return budgets;
    }

    const existingBudget = budgets.find((budget) => budget.year === expenseYear);

    if (!existingBudget) {
        if (direction < 0) {
            return budgets;
        }

        const createdBudget: FinanceBudget = {
            year: expenseYear,
            status: expenseYear < new Date().getFullYear() ? 'Clôturé' : 'En cours',
            totalAllocated: normalizedAmount,
            items: [
                {
                    category: budgetCategory,
                    type: expense.type,
                    allocated: normalizedAmount,
                    spent: normalizedAmount,
                },
            ],
            updatedAt,
        };

        return [createdBudget, ...budgets].sort((a, b) => b.year - a.year);
    }

    const hasCategory = existingBudget.items.some((item) => item.category === budgetCategory);

    const nextItems = hasCategory
        ? existingBudget.items.map((item) => {
              if (item.category !== budgetCategory) {
                  return item;
              }

              return {
                  ...item,
                  spent:
                      direction > 0
                          ? item.spent + normalizedAmount
                          : Math.max(0, item.spent - normalizedAmount),
              };
          })
        : direction > 0
          ? [
                ...existingBudget.items,
                {
                    category: budgetCategory,
                    type: expense.type,
                    allocated: normalizedAmount,
                    spent: normalizedAmount,
                },
            ]
          : existingBudget.items;

    const nextBudget: FinanceBudget = {
        ...existingBudget,
        items: nextItems,
        totalAllocated:
            direction > 0 && !hasCategory
                ? existingBudget.totalAllocated + normalizedAmount
                : existingBudget.totalAllocated,
        updatedAt,
    };

    return budgets
        .map((budget) => (budget.year === expenseYear ? nextBudget : budget))
        .sort((a, b) => b.year - a.year);
};

export const FinanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { logEvent, getEffectiveAccessForUser } = useData();

    // Accès RBAC effectif (même moteur que l'UI) pour les gardes de mutation finance — via ref (lint-safe).
    const currentUserAccessRef = useRef<EffectiveAccessProfile | null>(null);
    currentUserAccessRef.current = currentUser ? getEffectiveAccessForUser(currentUser.id) : null;

    const [financeExpenses, setFinanceExpenses] = useState<FinanceExpense[]>(() => {
        try {
            const saved = getPersistedValue(
                STORAGE_KEYS.financeExpenses.current,
                STORAGE_KEYS.financeExpenses.legacy,
            );
            if (!saved) return mockFinanceExpenses;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : mockFinanceExpenses;
        } catch {
            return mockFinanceExpenses;
        }
    });

    const [financeBudgets, setFinanceBudgets] = useState<FinanceBudget[]>(() => {
        try {
            const saved = getPersistedValue(
                STORAGE_KEYS.financeBudgets.current,
                STORAGE_KEYS.financeBudgets.legacy,
            );
            if (!saved) return mockFinanceBudgets;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : mockFinanceBudgets;
        } catch {
            return mockFinanceBudgets;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.financeExpenses.current, JSON.stringify(financeExpenses));
    }, [financeExpenses]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.financeBudgets.current, JSON.stringify(financeBudgets));
    }, [financeBudgets]);

    const addFinanceExpense = useCallback(
        (expenseData: Omit<FinanceExpense, 'id' | 'createdAt'>): FinanceExpenseInsertResult => {
            const permissionDecision = canManageFinanceByRole(currentUserAccessRef.current);
            if (!permissionDecision.allowed) {
                return {
                    ok: false,
                    reason: 'forbidden',
                };
            }

            const now = new Date().toISOString();
            const computedFingerprint =
                expenseData.importFingerprint ||
                buildExpenseFingerprint({
                    supplier: expenseData.supplier,
                    invoiceNumber: expenseData.invoiceNumber,
                    amount: expenseData.amount,
                    date: expenseData.date,
                });

            const duplicateExpense = financeExpenses.find((existing) => {
                if (
                    existing.importFingerprint &&
                    existing.importFingerprint === computedFingerprint
                ) {
                    return true;
                }

                const sameInvoice =
                    existing.invoiceNumber &&
                    expenseData.invoiceNumber &&
                    normalizeValueForFingerprint(existing.invoiceNumber) ===
                        normalizeValueForFingerprint(expenseData.invoiceNumber);
                const sameSupplier =
                    normalizeValueForFingerprint(existing.supplier) ===
                    normalizeValueForFingerprint(expenseData.supplier);
                const sameAmount =
                    Number(existing.amount).toFixed(2) === Number(expenseData.amount).toFixed(2);
                const sameDate = existing.date === expenseData.date;

                if (sameInvoice && sameSupplier && sameAmount) return true;
                if (
                    existing.sourceFileName &&
                    expenseData.sourceFileName &&
                    existing.sourceFileName === expenseData.sourceFileName &&
                    sameAmount
                ) {
                    return true;
                }

                return sameSupplier && sameAmount && sameDate;
            });

            if (duplicateExpense) {
                logEvent({
                    type: 'UPDATE',
                    actorId: currentUser?.id || 'system',
                    actorName: currentUser?.name || 'Système',
                    actorRole: currentUser?.role || 'Admin',
                    targetType: 'SYSTEM',
                    targetId: duplicateExpense.id,
                    targetName: `Dépense ${duplicateExpense.supplier}`,
                    description: `Tentative d'import dupliqué ignorée (${expenseData.supplier})`,
                    metadata: {
                        duplicateOf: duplicateExpense.id,
                        sourceFileName: expenseData.sourceFileName || null,
                        invoiceNumber: expenseData.invoiceNumber || null,
                    },
                    isSystem: false,
                    isSensitive: false,
                });

                return {
                    ok: false,
                    duplicateOf: duplicateExpense,
                    reason: 'duplicate',
                };
            }

            const createdAt = now;
            const newExpense: FinanceExpense = {
                ...expenseData,
                id: `expense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                createdAt,
                importFingerprint: computedFingerprint,
            };

            const expenseYear = Number(newExpense.date.slice(0, 4)) || new Date().getFullYear();
            const budgetCategory = getBudgetCategoryByExpenseType(newExpense.type);

            setFinanceExpenses((prev) => [newExpense, ...prev]);
            setFinanceBudgets((prev) => {
                const targetBudget = prev.find((budget) => budget.year === expenseYear);

                if (!targetBudget) {
                    const createdBudget: FinanceBudget = {
                        year: expenseYear,
                        status: expenseYear < new Date().getFullYear() ? 'Clôturé' : 'En cours',
                        totalAllocated: newExpense.amount,
                        items: [
                            {
                                category: budgetCategory,
                                type: newExpense.type,
                                allocated: newExpense.amount,
                                spent: newExpense.amount,
                            },
                        ],
                        updatedAt: createdAt,
                        sourceFileName: newExpense.sourceFileName,
                    };

                    return [createdBudget, ...prev].sort((a, b) => b.year - a.year);
                }

                const hasCategory = targetBudget.items.some(
                    (item) => item.category === budgetCategory,
                );
                const updatedItems = hasCategory
                    ? targetBudget.items.map((item) =>
                          item.category === budgetCategory
                              ? { ...item, spent: item.spent + newExpense.amount }
                              : item,
                      )
                    : [
                          ...targetBudget.items,
                          {
                              category: budgetCategory,
                              type: newExpense.type,
                              allocated: newExpense.amount,
                              spent: newExpense.amount,
                          },
                      ];

                const updatedBudget: FinanceBudget = {
                    ...targetBudget,
                    items: updatedItems,
                    totalAllocated: hasCategory
                        ? targetBudget.totalAllocated
                        : targetBudget.totalAllocated + newExpense.amount,
                    updatedAt: createdAt,
                };

                return prev
                    .map((budget) => (budget.year === expenseYear ? updatedBudget : budget))
                    .sort((a, b) => b.year - a.year);
            });

            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'SYSTEM',
                targetId: newExpense.id,
                targetName: `Dépense ${newExpense.supplier}`,
                description: `Nouvelle dépense enregistrée (${newExpense.supplier})`,
                metadata: {
                    amount: newExpense.amount,
                    type: newExpense.type,
                    date: newExpense.date,
                    invoiceNumber: newExpense.invoiceNumber || null,
                },
                isSystem: false,
                isSensitive: false,
            });

            return {
                ok: true,
                expense: newExpense,
            };
        },
        [currentUser, financeExpenses, logEvent],
    );

    const updateFinanceExpense = useCallback(
        (id: string, updates: Partial<Omit<FinanceExpense, 'id' | 'createdAt'>>) => {
            const permissionDecision = canManageFinanceByRole(currentUserAccessRef.current);
            if (!permissionDecision.allowed) {
                return false;
            }

            const existingExpense = financeExpenses.find((expense) => expense.id === id);
            if (!existingExpense) {
                return false;
            }

            const now = new Date().toISOString();
            const mergedExpense: FinanceExpense = {
                ...existingExpense,
                ...updates,
                id: existingExpense.id,
                createdAt: existingExpense.createdAt,
                supplier:
                    typeof updates.supplier === 'string'
                        ? updates.supplier.trim()
                        : existingExpense.supplier,
                description:
                    typeof updates.description === 'string'
                        ? updates.description.trim()
                        : existingExpense.description,
                invoiceNumber:
                    typeof updates.invoiceNumber === 'string'
                        ? updates.invoiceNumber.trim() || undefined
                        : existingExpense.invoiceNumber,
                amount:
                    updates.amount !== undefined ? Number(updates.amount) : existingExpense.amount,
            };

            if (!Number.isFinite(mergedExpense.amount) || mergedExpense.amount <= 0) {
                return false;
            }

            const updatedFingerprint = buildExpenseFingerprint({
                supplier: mergedExpense.supplier,
                invoiceNumber: mergedExpense.invoiceNumber,
                amount: mergedExpense.amount,
                date: mergedExpense.date,
            });

            const duplicateExpense = financeExpenses.find((existing) => {
                if (existing.id === id) {
                    return false;
                }

                if (
                    existing.importFingerprint &&
                    existing.importFingerprint === updatedFingerprint
                ) {
                    return true;
                }

                const sameInvoice =
                    existing.invoiceNumber &&
                    mergedExpense.invoiceNumber &&
                    normalizeValueForFingerprint(existing.invoiceNumber) ===
                        normalizeValueForFingerprint(mergedExpense.invoiceNumber);
                const sameSupplier =
                    normalizeValueForFingerprint(existing.supplier) ===
                    normalizeValueForFingerprint(mergedExpense.supplier);
                const sameAmount =
                    Number(existing.amount).toFixed(2) === Number(mergedExpense.amount).toFixed(2);
                const sameDate = existing.date === mergedExpense.date;

                if (sameInvoice && sameSupplier && sameAmount) return true;
                return sameSupplier && sameAmount && sameDate;
            });

            if (duplicateExpense) {
                return false;
            }

            const finalExpense: FinanceExpense = {
                ...mergedExpense,
                importFingerprint: updatedFingerprint,
            };

            setFinanceExpenses((prev) =>
                prev.map((expense) => (expense.id === id ? finalExpense : expense)),
            );
            setFinanceBudgets((prev) => {
                const removed = adjustBudgetWithExpense(prev, existingExpense, -1, now);
                return adjustBudgetWithExpense(removed, finalExpense, 1, now);
            });

            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'SYSTEM',
                targetId: finalExpense.id,
                targetName: `Dépense ${finalExpense.supplier}`,
                description: `Dépense mise à jour (${finalExpense.supplier})`,
                metadata: {
                    amount: {
                        from: existingExpense.amount,
                        to: finalExpense.amount,
                    },
                    supplier: {
                        from: existingExpense.supplier,
                        to: finalExpense.supplier,
                    },
                    date: {
                        from: existingExpense.date,
                        to: finalExpense.date,
                    },
                },
                isSystem: false,
                isSensitive: false,
            });

            return true;
        },
        [currentUser, financeExpenses, logEvent],
    );

    const deleteFinanceExpense = useCallback(
        (id: string) => {
            const permissionDecision = canManageFinanceByRole(currentUserAccessRef.current);
            if (!permissionDecision.allowed) {
                return false;
            }

            const existingExpense = financeExpenses.find((expense) => expense.id === id);
            if (!existingExpense) {
                return false;
            }

            if (existingExpense.sourceFileId) {
                void deleteExpenseSourceFile(existingExpense.sourceFileId).catch(() => {
                    // Ignore cleanup failures; expense deletion must stay deterministic.
                });
            }

            if (
                typeof existingExpense.sourceFileUrl === 'string' &&
                existingExpense.sourceFileUrl.startsWith('blob:')
            ) {
                try {
                    URL.revokeObjectURL(existingExpense.sourceFileUrl);
                } catch {
                    // Ignore URL revocation errors for stale blob handles.
                }
            }

            const now = new Date().toISOString();
            setFinanceExpenses((prev) => prev.filter((expense) => expense.id !== id));
            setFinanceBudgets((prev) => adjustBudgetWithExpense(prev, existingExpense, -1, now));

            logEvent({
                type: 'DELETE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'SYSTEM',
                targetId: existingExpense.id,
                targetName: `Dépense ${existingExpense.supplier}`,
                description: `Dépense supprimée (${existingExpense.supplier})`,
                metadata: {
                    amount: existingExpense.amount,
                    type: existingExpense.type,
                    date: existingExpense.date,
                },
                isSystem: false,
                isSensitive: true,
            });

            return true;
        },
        [currentUser, financeExpenses, logEvent],
    );

    const upsertFinanceBudget = useCallback(
        (budgetData: Omit<FinanceBudget, 'updatedAt'> & { updatedAt?: string }) => {
            const permissionDecision = canManageFinanceByRole(currentUserAccessRef.current);
            if (!permissionDecision.allowed) {
                return;
            }

            const updatedBudget: FinanceBudget = {
                ...budgetData,
                updatedAt: budgetData.updatedAt || new Date().toISOString(),
            };

            setFinanceBudgets((prev) => {
                const hasYear = prev.some((budget) => budget.year === updatedBudget.year);
                const next = hasYear
                    ? prev.map((budget) =>
                          budget.year === updatedBudget.year ? updatedBudget : budget,
                      )
                    : [...prev, updatedBudget];

                return next.sort((a, b) => b.year - a.year);
            });

            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'SYSTEM',
                targetId: `budget_${updatedBudget.year}`,
                targetName: `Budget ${updatedBudget.year}`,
                description: `Budget ${updatedBudget.year} enregistré`,
                metadata: {
                    totalAllocated: updatedBudget.totalAllocated,
                    lineCount: updatedBudget.items.length,
                    sourceFileName: updatedBudget.sourceFileName || null,
                },
                isSystem: false,
                isSensitive: false,
            });
        },
        [currentUser, logEvent],
    );

    const value = useMemo(
        () => ({
            financeExpenses,
            financeBudgets,
            addFinanceExpense,
            updateFinanceExpense,
            deleteFinanceExpense,
            upsertFinanceBudget,
        }),
        [
            financeExpenses,
            financeBudgets,
            addFinanceExpense,
            updateFinanceExpense,
            deleteFinanceExpense,
            upsertFinanceBudget,
        ],
    );

    return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
};

export const useFinanceData = () => {
    const context = useContext(FinanceDataContext);
    if (!context) {
        throw new Error('useFinanceData must be used within a FinanceDataProvider');
    }
    return context;
};
