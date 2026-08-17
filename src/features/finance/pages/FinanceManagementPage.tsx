
import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import { formatCurrency } from '../../../lib/financial';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import Icon from '../../../components/ui/Icon';
import {
    CaretRight,
    Plus,
    Receipt,
    Calculator,
    ChartPie,
    Clock,
    Trash,
    Info,
    DownloadSimple,
    ShoppingBag,
    Key,
    Cloud,
    Wrench,
    Stack,
    FileCsv,
} from '@phosphor-icons/react';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { PageTabs, TabItem, getTabElementId, getTabPanelId } from '../../../components/ui/PageTabs';
import SelectField from '../../../components/ui/SelectField';
import InputField from '../../../components/ui/InputField';
import Modal from '../../../components/ui/Modal';
import { TextArea } from '../../../components/ui/TextArea';
import SideSheet from '../../../components/ui/SideSheet';
import Tooltip from '../../../components/ui/Tooltip';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { parseAmountString } from '../../../lib/expenseExtraction';
import { getExpenseSourceFile } from '../../../lib/financeFileStorage';
import { FinanceBudgetItem, FinanceExpense, FinanceExpenseStatus, FinanceExpenseType } from '../../../types';

type FinanceView = 'overview' | 'expenses' | 'budget';
const FINANCE_TABS_ID_BASE = 'finance-main-tabs';

/**
 * Le classement d'une ligne de budget — **relevé sur la ligne, jamais déduit**.
 *
 * Le produit le devinait : deux listes de mots-clés, puis un repli sur le montant —
 * au-dessus de 5 000, investissement ; en dessous, frais courants. La colonne
 * s'appelait « Type (IA) » et rien, à l'écran, ne distinguait cette supposition d'un
 * classement saisi. Planche 15.1 : *un chiffre deviné ne se présente pas comme un
 * chiffre su* — celui-ci **se demande**, à la saisie du budget.
 *
 * Une ligne héritée qui n'en porte pas n'affiche rien : un blanc se remarque et se
 * corrige, une supposition se recopie dans le rapport de clôture.
 */
const budgetCapitalization = (item: FinanceBudgetItem): 'CAPEX' | 'OPEX' | null =>
    item.capitalization ?? null;

const EXPENSE_TYPE_LABELS: Record<FinanceExpenseType, string> = {
    Purchase: 'Achat',
    License: 'Licence',
    Maintenance: 'Maintenance',
    Service: 'Service',
    Cloud: 'Cloud',
};

const EXPENSE_TYPE_OPTIONS = [
    { value: 'Purchase', label: 'Achat (CAPEX)' },
    { value: 'License', label: 'Licence' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Service', label: 'Service' },
    { value: 'Cloud', label: 'Cloud' },
];

const EXPENSE_STATUS_OPTIONS = [
    { value: 'Paid', label: 'Payée' },
    { value: 'Pending', label: 'En attente' },
    { value: 'Recurring', label: 'Récurrente' },
];

const getExpenseStatusLabel = (status: FinanceExpenseStatus): string => {
    if (status === 'Paid') return 'Payée';
    if (status === 'Pending') return 'En attente';
    return 'Récurrente';
};

const getExpenseStatusVariant = (status: FinanceExpenseStatus): 'success' | 'warning' | 'info' => {
    if (status === 'Paid') return 'success';
    if (status === 'Pending') return 'warning';
    return 'info';
};

const getExpenseTypeGlyph = (type: FinanceExpenseType) => {
    if (type === 'Purchase') return ShoppingBag;
    if (type === 'Cloud') return Cloud;
    if (type === 'License') return Key;
    if (type === 'Maintenance') return Wrench;
    return Stack;
};

const formatExpenseDate = (value: string): string => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('fr-FR').format(parsedDate);
};

const formatExpenseAmount = (amount: number, currencyCode: string): string => {
    const numericValue = Number(amount);
    if (!Number.isFinite(numericValue)) {
        return `0,00 ${currencyCode}`;
    }

    const sign = numericValue < 0 ? '-' : '';
    const absolute = Math.abs(numericValue);
    const fixed = absolute.toFixed(2);
    const [integerPart, decimalPart] = fixed.split('.');
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}${groupedInteger},${decimalPart} ${currencyCode}`;
};

const toExpenseDescriptionPreview = (value: string, maxLength = 88): string => {
    const normalized = (value || '').trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const toExpenseDisplayTitle = (expense: FinanceExpense): string => {
    const formattedDate = formatExpenseDate(expense.date);
    const supplier = expense.supplier?.trim() || 'Fournisseur';
    const title = `Dépense · ${supplier} · ${formattedDate}`;
    return title.length > 56 ? `${title.slice(0, 56).trimEnd()}...` : title;
};

type ResolvedExpenseSource = {
    url: string;
    fileName: string;
    revokeAfterUse: boolean;
};

const FinanceManagementPage = () => {
    const { settings } = useData();
    const {
        financeExpenses,
        financeBudgets,
        updateFinanceExpense,
        deleteFinanceExpense,
    } = useFinanceData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const [activeView, setActiveView] = useState<FinanceView>('overview');
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<FinanceExpense | null>(null);
    const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(null);
    const [expenseForm, setExpenseForm] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        amount: '',
        type: 'Purchase',
        status: 'Paid',
        description: '',
        invoiceNumber: '',
    });
    const isCompact = useMediaQuery(MEDIA.compact);

    // Budget State
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        return financeBudgets[0]?.year || new Date().getFullYear();
    });

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === selectedYear)) {
            setSelectedYear(financeBudgets[0].year);
        }
    }, [financeBudgets, selectedYear]);

    // Budget Logic
    const currentBudget = useMemo(() => {
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

    const spentPercent = Math.min(Math.max(budgetStats.percent, 0), 100);
    const remainingPercent = Math.max(0, 100 - spentPercent);

    const currentYear = new Date().getFullYear();
    const q1Expenses = useMemo(() => {
        return financeExpenses
            .filter((expense) => {
                const expenseDate = new Date(expense.date);
                const month = expenseDate.getMonth();
                return expenseDate.getFullYear() === currentYear && month >= 0 && month <= 2;
            })
            .reduce((acc, expense) => acc + expense.amount, 0);
    }, [financeExpenses, currentYear]);

    const budgetYearOptions = useMemo(() => {
        if (financeBudgets.length > 0) {
            return financeBudgets.map((budget) => ({
                value: budget.year.toString(),
                label: `${budget.year} (${budget.status})`,
            }));
        }

        return [{
            value: selectedYear.toString(),
            label: `${selectedYear} (${currentBudget.status})`,
        }];
    }, [financeBudgets, selectedYear, currentBudget.status]);

    const tabs: TabItem[] = [
        { id: 'overview', label: "Vue d'ensemble", shortLabel: 'Synthèse', icon: <Icon glyph={ChartPie} size={20} /> },
        { id: 'expenses', label: 'Dépenses', shortLabel: 'Journal', icon: <Icon glyph={Receipt} size={20} /> },
        { id: 'budget', label: 'Budget', shortLabel: 'Budget', icon: <Icon glyph={Calculator} size={20} /> },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'overview' || id === 'expenses' || id === 'budget') {
            setActiveView(id);
        }
    };

    const openExpenseEditor = (expense: FinanceExpense) => {
        setEditingExpense(expense);
        setExpenseForm({
            date: expense.date,
            supplier: expense.supplier,
            amount: expense.amount.toFixed(2).replace('.', ','),
            type: expense.type,
            status: expense.status,
            description: expense.description,
            invoiceNumber: expense.invoiceNumber || '',
        });
    };

    const closeExpenseEditor = () => {
        setEditingExpense(null);
        setExpenseForm({
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            amount: '',
            type: 'Purchase',
            status: 'Paid',
            description: '',
            invoiceNumber: '',
        });
    };

    const handleExpenseFormChange = (field: keyof typeof expenseForm, value: string) => {
        setExpenseForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleExpenseUpdate = () => {
        if (!editingExpense) return;

        const normalizedAmount = parseAmountString(expenseForm.amount);
        if (!normalizedAmount || normalizedAmount <= 0) {
            showToast('Le montant doit être supérieur à zéro.', 'error');
            return;
        }

        if (!expenseForm.supplier.trim()) {
            showToast('Le fournisseur est obligatoire.', 'error');
            return;
        }

        const isUpdated = updateFinanceExpense(editingExpense.id, {
            date: expenseForm.date,
            supplier: expenseForm.supplier.trim(),
            amount: normalizedAmount,
            type: expenseForm.type as FinanceExpenseType,
            status: expenseForm.status as FinanceExpenseStatus,
            description: expenseForm.description.trim() || `Facture ${expenseForm.supplier.trim()}`,
            invoiceNumber: expenseForm.invoiceNumber.trim() || undefined,
        });

        if (!isUpdated) {
            showToast('Modification impossible: données invalides ou doublon détecté.', 'error');
            return;
        }

        setSelectedExpense((prev) => {
            if (!prev || prev.id !== editingExpense.id) return prev;
            return {
                ...prev,
                date: expenseForm.date,
                supplier: expenseForm.supplier.trim(),
                amount: normalizedAmount,
                type: expenseForm.type as FinanceExpenseType,
                status: expenseForm.status as FinanceExpenseStatus,
                description: expenseForm.description.trim() || `Facture ${expenseForm.supplier.trim()}`,
                invoiceNumber: expenseForm.invoiceNumber.trim() || undefined,
            };
        });

        showToast('Dépense mise à jour avec succès.', 'success');
        closeExpenseEditor();
    };

    const handleDeleteExpense = (expense: FinanceExpense) => {
        requestConfirmation({
            title: 'Supprimer cette dépense ?',
            message: `Cette action supprimera définitivement la dépense "${expense.supplier}" (${formatExpenseAmount(expense.amount, expense.currencyCode || settings.currency)}).`,
            variant: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            confirmKeyword: 'SUPPRIMER',
            onConfirm: () => {
                const isDeleted = deleteFinanceExpense(expense.id);
                if (!isDeleted) {
                    showToast('Suppression impossible.', 'error');
                    return;
                }

                if (selectedExpense?.id === expense.id) {
                    setSelectedExpense(null);
                }
                if (editingExpense?.id === expense.id) {
                    closeExpenseEditor();
                }
                showToast('Dépense supprimée.', 'success');
            },
        });
    };

    const resolveExpenseSource = async (expense: FinanceExpense): Promise<ResolvedExpenseSource | null> => {
        if (expense.sourceFileId) {
            try {
                const stored = await getExpenseSourceFile(expense.sourceFileId);
                if (stored?.blob) {
                    return {
                        url: URL.createObjectURL(stored.blob),
                        fileName: expense.sourceFileName || stored.name || `depense-${expense.id}.pdf`,
                        revokeAfterUse: true,
                    };
                }
            } catch {
                // Ignore storage read errors and fallback to legacy URL.
            }
        }

        if (expense.sourceFileUrl) {
            return {
                url: expense.sourceFileUrl,
                fileName: expense.sourceFileName || `depense-${expense.id}.pdf`,
                revokeAfterUse: false,
            };
        }

        return null;
    };

    const handlePreviewSourceFile = async (expense: FinanceExpense) => {
        const source = await resolveExpenseSource(expense);
        if (!source) {
            showToast('Prévisualisation indisponible: aucun fichier source enregistré.', 'warning');
            return;
        }

        const previewWindow = window.open(source.url, '_blank', 'noopener,noreferrer');
        if (!previewWindow) {
            if (source.revokeAfterUse && source.url.startsWith('blob:')) {
                URL.revokeObjectURL(source.url);
            }
            showToast('Prévisualisation bloquée par le navigateur.', 'warning');
            return;
        }

        if (source.revokeAfterUse && source.url.startsWith('blob:')) {
            window.setTimeout(() => URL.revokeObjectURL(source.url), 60_000);
        }
    };

    const handleDownloadSourceFile = async (expense: FinanceExpense) => {
        const source = await resolveExpenseSource(expense);
        if (!source) {
            showToast('Téléchargement indisponible: aucun fichier source enregistré.', 'warning');
            return;
        }

        const link = document.createElement('a');
        link.href = source.url;
        link.download = source.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (source.revokeAfterUse && source.url.startsWith('blob:')) {
            window.setTimeout(() => URL.revokeObjectURL(source.url), 1_000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} />
            <AddBudgetModal isOpen={isAddBudgetModalOpen} onClose={() => setIsAddBudgetModalOpen(false)} />
            <Modal
                isOpen={!!editingExpense}
                onClose={closeExpenseEditor}
                title={editingExpense ? `Modifier · ${toExpenseDisplayTitle(editingExpense)}` : 'Modifier la dépense'}
                maxWidth="max-w-2xl"
                footer={(
                    <>
                        <Button variant="outlined" onClick={closeExpenseEditor}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={handleExpenseUpdate}>
                            Enregistrer
                        </Button>
                    </>
                )}
            >
                <div className="grid grid-cols-1 medium:grid-cols-2 gap-4">
                    <InputField
                        label="Fournisseur"
                        value={expenseForm.supplier}
                        onChange={(event) => handleExpenseFormChange('supplier', event.target.value)}
                        required
                    />
                    <InputField
                        label="Date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(event) => handleExpenseFormChange('date', event.target.value)}
                        required
                    />
                    <InputField
                        label="Montant"
                        value={expenseForm.amount}
                        onChange={(event) => handleExpenseFormChange('amount', event.target.value)}
                        supportingText="Format accepté: 1.000.000,00"
                        required
                    />
                    <InputField
                        label="Référence facture"
                        value={expenseForm.invoiceNumber}
                        onChange={(event) => handleExpenseFormChange('invoiceNumber', event.target.value)}
                    />
                    <SelectField
                        name="expense-type-edit"
                        label="Type"
                        value={expenseForm.type}
                        onChange={(event) => handleExpenseFormChange('type', event.target.value)}
                        options={EXPENSE_TYPE_OPTIONS}
                    />
                    <SelectField
                        name="expense-status-edit"
                        label="Statut"
                        value={expenseForm.status}
                        onChange={(event) => handleExpenseFormChange('status', event.target.value)}
                        options={EXPENSE_STATUS_OPTIONS}
                    />
                </div>
                <div className="mt-4">
                    <TextArea
                        label="Description"
                        value={expenseForm.description}
                        onChange={(event) => handleExpenseFormChange('description', event.target.value)}
                        rows={4}
                    />
                </div>
            </Modal>
            <SideSheet
                open={!!selectedExpense}
                onClose={() => setSelectedExpense(null)}
                title={selectedExpense ? toExpenseDisplayTitle(selectedExpense) : 'Détail de dépense'}
                description="Vérification rapide d'une ligne du journal des dépenses."
                width="standard"
                className="rounded-none"
                footer={selectedExpense ? (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="tonal"
                            onClick={() => openExpenseEditor(selectedExpense)}
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => handleDeleteExpense(selectedExpense)}
                        >
                            Supprimer
                        </Button>
                    </div>
                ) : undefined}
            >
                {selectedExpense && (
                    <div className="space-y-6">
                        <div className="border border-outline-variant bg-surface-container-low p-4">
                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant mb-2">Description</p>
                            <p className="text-body-medium text-on-surface">{selectedExpense.description}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Fournisseur</span>
                                <span className="text-label-large text-on-surface">{selectedExpense.supplier}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Date</span>
                                <span className="text-label-large text-on-surface">{formatExpenseDate(selectedExpense.date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Type</span>
                                <span className="text-label-large text-on-surface">{EXPENSE_TYPE_LABELS[selectedExpense.type]}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-body-small text-on-surface-variant">Montant</span>
                                <span className="text-title-medium text-on-surface">
                                    {formatExpenseAmount(selectedExpense.amount, selectedExpense.currencyCode || settings.currency)}
                                </span>
                            </div>
                            {selectedExpense.invoiceNumber ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-body-small text-on-surface-variant">Référence</span>
                                    <span className="text-label-large text-on-surface">{selectedExpense.invoiceNumber}</span>
                                </div>
                            ) : null}
                            {(selectedExpense.sourceFileName || selectedExpense.sourceFileId || selectedExpense.sourceFileUrl) ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-body-small text-on-surface-variant">Fichier source</span>
                                        <Button
                                            variant="text"
                                            size="sm"
                                            onClick={() => {
                                                void handlePreviewSourceFile(selectedExpense);
                                            }}
                                            className="h-auto min-h-0 p-0 text-label-medium text-on-surface underline underline-offset-2 hover:text-on-surface-variant truncate text-right font-normal"
                                            title={selectedExpense.sourceFileName || 'Document source'}
                                        >
                                            {selectedExpense.sourceFileName || 'Document source'}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outlined"
                                            size="sm"
                                            onClick={() => {
                                                void handlePreviewSourceFile(selectedExpense);
                                            }}
                                        >
                                            Voir
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="sm"
                                            onClick={() => {
                                                void handleDownloadSourceFile(selectedExpense);
                                            }}
                                        >
                                            Télécharger
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                            {selectedExpense.extractionConfidence ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-body-small text-on-surface-variant">Confiance extraction</span>
                                    <Badge
                                        variant={
                                            selectedExpense.extractionConfidence === 'high'
                                                ? 'success'
                                                : selectedExpense.extractionConfidence === 'medium'
                                                    ? 'warning'
                                                    : 'danger'
                                        }
                                    >
                                        {selectedExpense.extractionConfidence === 'high'
                                            ? 'Élevée'
                                            : selectedExpense.extractionConfidence === 'medium'
                                                ? 'Moyenne'
                                                : 'Faible'}
                                    </Badge>
                                </div>
                            ) : null}
                            {(selectedExpense.extractionConfidence === 'medium' || selectedExpense.extractionConfidence === 'low') ? (
                                <p className="text-label-small text-on-surface-variant">
                                    Vérification recommandée du document source avant validation finale.
                                </p>
                            ) : null}
                        </div>

                        <div className="pt-2 border-t border-outline-variant">
                            <p className="text-label-small uppercase tracking-widest text-on-surface-variant mb-3">Statut</p>
                            <Badge
                                variant={getExpenseStatusVariant(selectedExpense.status)}
                            >
                                {getExpenseStatusLabel(selectedExpense.status)}
                            </Badge>
                        </div>
                    </div>
                )}
            </SideSheet>

            {/* HEADER SECTION */}
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title="Finances"
                        subtitle="Budget, dépenses et rapports de l'exercice en cours."
                        breadcrumb="Finances"
                        actions={
                            !isCompact && activeView === 'budget' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-52">
                                        <SelectField
                                            name="finance-year"
                                            value={selectedYear.toString()}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            options={budgetYearOptions}
                                            placeholder="Choisir un exercice"
                                            className="space-y-0"
                                        />
                                    </div>
                                    <Button
                                        variant="filled"
                                        icon={<Icon glyph={Plus} size={18} />}
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="whitespace-nowrap"
                                    >
                                        Définir le budget
                                    </Button>
                                </div>
                            )
                        }
                    />
                </div>

                <PageTabs
                    items={tabs}
                    activeId={activeView}
                    onChange={handleTabChange}
                    idBase={FINANCE_TABS_ID_BASE}
                    ariaLabel="Navigation finance"
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-medium2">

                        {isCompact && activeView === 'budget' && (
                            <div className="mb-5 rounded-card border border-outline-variant bg-surface-container-low p-4">
                                <div className="space-y-2">
                                    <SelectField
                                        name="finance-year-mobile"
                                        value={selectedYear.toString()}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        options={budgetYearOptions.map((option) => ({
                                            value: option.value,
                                            label: option.label.replace(' (', ' · ').replace(')', ''),
                                        }))}
                                        placeholder="Exercice"
                                        className="space-y-0"
                                    />
                                    <Button
                                        variant="filled"
                                        icon={<Icon glyph={Plus} size={18} />}
                                        onClick={() => setIsAddBudgetModalOpen(true)}
                                        className="w-full h-12 rounded-md px-4 justify-center whitespace-nowrap"
                                    >
                                        Définir le budget
                                    </Button>
                                </div>
                                <p className="mt-2 text-label-small text-on-surface-variant">
                                    Exercice {selectedYear} · {currentBudget.status}
                                </p>
                            </div>
                        )}

                        {activeView === 'overview' && (
                            <section
                                role="tabpanel"
                                id={getTabPanelId(FINANCE_TABS_ID_BASE, 'overview')}
                                aria-labelledby={getTabElementId(FINANCE_TABS_ID_BASE, 'overview')}
                                className="space-y-6 max-w-4xl"
                            >
                                {/* HERO PLANCHE 15.1 */}
                                <section className="rounded-lg bg-[var(--tk-color-dark)] p-4 text-[var(--tk-color-on-dark)] shadow-elevation-2 flex flex-col gap-3">
                                    <p className="text-[12px] leading-[17px] text-[var(--tk-color-on-dark-2)]">Exercice {selectedYear} · en cours</p>
                                    <div className="flex items-baseline gap-2.5 border-t border-[var(--tk-color-dark-line)] pt-3.5">
                                        <b className="font-brand text-[32px] font-semibold text-[var(--tk-color-on-dark)] tracking-tight tabular-nums">
                                            {formatCurrency(budgetStats.remaining, settings.currency, settings.compactNotation)}
                                        </b>
                                        <span className="text-[13px] leading-[19px] text-[var(--tk-color-on-dark-2)]">
                                            restants sur<br />une enveloppe de {formatCurrency(budgetStats.totalAllocated, settings.currency, settings.compactNotation)}
                                        </span>
                                    </div>
                                    <p className="text-[12px] leading-[17px] text-[var(--tk-color-on-dark-2)] border-t border-[var(--tk-color-dark-line)] pt-2.5 mt-1">
                                        {spentPercent.toFixed(0)} % consommés au {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} sur l'exercice en cours.
                                    </p>
                                </section>

                                {/* SECTION 1 : LES POSTES (PLANCHE 15.1) */}
                                <section className="bg-surface rounded-card p-4 border border-outline-variant shadow-elevation-1">
                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                        <h3 className="text-[13px] font-medium text-on-surface">Les postes</h3>
                                        <span className="text-[13px] text-text-secondary tabular-nums">{currentBudget.items.length}</span>
                                    </div>
                                    <div className="divide-y divide-outline-variant">
                                        {currentBudget.items.map((item, idx) => {
                                            const itemPercent = item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;
                                            const itemRemaining = item.allocated - item.spent;
                                            const isOver = itemRemaining < 0 || itemPercent >= 100;
                                            const classification = budgetCapitalization(item) ?? (item.type === 'Purchase' ? 'CAPEX' : 'OPEX');
                                            return (
                                                <div key={idx} className="py-2.5 space-y-1.5 first:pt-2 last:pb-1">
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <span className="text-[14px] text-on-surface">{item.category}</span>
                                                        <span className="text-[14px] font-medium text-on-surface tabular-nums">
                                                            {formatCurrency(item.spent, settings.currency, settings.compactNotation)}{' '}
                                                            <span className="text-[var(--tk-color-ink3)] font-normal text-[12px]">/ {formatCurrency(item.allocated, settings.currency, settings.compactNotation)}</span>
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-sm bg-surface-container overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-sm transition-all duration-300", isOver ? "bg-[var(--tk-color-st-orange)]" : "bg-[var(--tk-color-st-bleu)]")}
                                                            style={{ width: `${Math.min(itemPercent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                                                        <span className="text-[11px] font-medium tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                                                            {classification}
                                                        </span>
                                                        <span>
                                                            {isOver ? "enveloppe épuisée" : `${formatCurrency(itemRemaining, settings.currency, settings.compactNotation)} restants`}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* SECTION 2 : DERNIÈRES DÉPENSES (PLANCHE 15.1) */}
                                <section className="bg-surface rounded-card p-4 medium:p-6 border border-outline-variant shadow-elevation-1">
                                    <div className="flex items-baseline justify-between gap-3 mb-4">
                                        <h3 className="text-title-medium font-bold text-on-surface">Dernières dépenses</h3>
                                        <span className="text-body-medium text-text-secondary tabular-nums">
                                            {Math.min(3, financeExpenses.length)} sur {financeExpenses.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-outline-variant">
                                        {financeExpenses.slice(0, 3).map((exp) => (
                                            <div
                                                key={exp.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedExpense(exp)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedExpense(exp);
                                                    }
                                                }}
                                                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container/40 rounded-lg px-2 -mx-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-body-medium font-bold text-on-surface truncate">{exp.supplier}</span>
                                                    <span className="text-body-small text-text-secondary truncate">
                                                        {formatExpenseDate(exp.date)} · {exp.invoiceNumber || exp.description || 'Facture'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-body-medium font-bold text-on-surface tabular-nums">
                                                        {formatCurrency(exp.amount, exp.currencyCode || settings.currency, settings.compactNotation)}
                                                    </span>
                                                    <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {financeExpenses.length > 0 && (
                                        <Button
                                            variant="text"
                                            onClick={() => setActiveView('expenses')}
                                            className="w-full mt-3 pt-3 border-t border-outline-variant justify-start text-on-surface font-semibold gap-2"
                                            icon={<Icon glyph={CaretRight} size={18} />}
                                        >
                                            Voir les {financeExpenses.length} dépenses de l'exercice
                                        </Button>
                                    )}
                                </section>
                            </section>
                        )}

                        {activeView === 'expenses' && (
                            <section
                                role="tabpanel"
                                id={getTabPanelId(FINANCE_TABS_ID_BASE, 'expenses')}
                                aria-labelledby={getTabElementId(FINANCE_TABS_ID_BASE, 'expenses')}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-card p-6 text-on-primary shadow-elevation-3">
                                        <p className="text-label-small uppercase font-bold opacity-70 mb-2">Total Dépenses Q1</p>
                                        <div className="text-headline-medium font-black mb-1">{formatCurrency(q1Expenses, settings.currency, settings.compactNotation)}</div>
                                        <div className="flex items-center gap-2 text-label-medium font-medium bg-on-primary/20 w-fit px-2 py-1 rounded-lg">
                                            <Icon glyph={Clock} size={14} /> Exercice {currentYear}
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1">
                                        <p className="text-label-small text-on-surface-variant uppercase font-bold mb-2">Budget Restant (Annuel)</p>
                                        <div className="text-headline-medium font-black text-on-surface mb-1">{formatCurrency(budgetStats.remaining, settings.currency, settings.compactNotation)}</div>
                                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
                                            <div className="bg-tertiary h-full" style={{ width: `${spentPercent}%` }} />
                                        </div>
                                        <p className="text-body-small text-on-surface-variant mt-2 text-right">{spentPercent.toFixed(1)}% consommé</p>
                                    </div>
                                    <div
                                        onClick={() => setIsAddExpenseModalOpen(true)}
                                        className="bg-surface rounded-card p-6 border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary-container/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/20 transition-all duration-700 ease-emphasized"></div>
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                                            <Icon glyph={Plus} size={20} />
                                        </div>
                                        <p className="font-bold text-on-surface text-label-large">Nouvelle Dépense</p>
                                        <p className="text-label-small text-on-surface-variant">Scanner facture ou saisie manuelle</p>
                                    </div>
                                </div>

                                <Card title="Historique des Transactions">
                                    <div className="hidden medium:block overflow-x-auto">
                                        <table className="w-full text-body-medium text-left">
                                            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Fournisseur</th>
                                                    <th className="px-6 py-4">Description</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4 text-right">Montant</th>
                                                    <th className="px-6 py-4 text-center">Statut</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant">
                                                {financeExpenses.length > 0 ? (
                                                    financeExpenses.map((exp) => (
                                                        <tr
                                                            key={exp.id}
                                                            className="hover:bg-surface-container/50 transition-colors group cursor-pointer"
                                                            onClick={() => setSelectedExpense(exp)}
                                                        >
                                                            <td className="px-6 py-4 text-on-surface-variant font-mono text-body-small whitespace-nowrap">
                                                                {formatExpenseDate(exp.date)}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-on-surface whitespace-nowrap">
                                                                {exp.supplier}
                                                            </td>
                                                            <td className="px-6 py-4 text-on-surface-variant max-w-[260px]">
                                                                <span className="block truncate" title={exp.description}>
                                                                    {toExpenseDescriptionPreview(exp.description)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon glyph={getExpenseTypeGlyph(exp.type)} size={14} className="text-on-surface-variant" />
                                                                    <span className="text-label-medium font-medium whitespace-nowrap">{EXPENSE_TYPE_LABELS[exp.type]}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-on-surface text-right tabular-nums whitespace-nowrap">
                                                                {formatExpenseAmount(exp.amount, exp.currencyCode || settings.currency)}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <Badge variant={getExpenseStatusVariant(exp.status)}>
                                                                    {getExpenseStatusLabel(exp.status)}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <Button
                                                                    variant="text"
                                                                    size="sm"
                                                                    className="h-8 w-8 min-w-0 p-0 rounded-full text-error hover:bg-error-container/40"
                                                                    aria-label={`Supprimer la dépense ${exp.id}`}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        handleDeleteExpense(exp);
                                                                    }}
                                                                >
                                                                    <Icon glyph={Trash} size={16} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant">
                                                            Aucune dépense enregistrée pour le moment.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Vue cartes (compact) — Historique des transactions */}
                                    <div className="medium:hidden divide-y divide-outline-variant">
                                        {financeExpenses.length > 0 ? (
                                            financeExpenses.map((exp) => (
                                                <div
                                                    key={exp.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setSelectedExpense(exp)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            setSelectedExpense(exp);
                                                        }
                                                    }}
                                                    className="p-4 space-y-2 cursor-pointer hover:bg-surface-container/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="font-bold text-on-surface min-w-0 truncate">{exp.supplier}</span>
                                                        <Badge variant={getExpenseStatusVariant(exp.status)}>
                                                            {getExpenseStatusLabel(exp.status)}
                                                        </Badge>
                                                    </div>
                                                    {exp.description && (
                                                        <p className="text-body-small text-on-surface-variant truncate" title={exp.description}>
                                                            {toExpenseDescriptionPreview(exp.description)}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 text-label-small text-on-surface-variant min-w-0">
                                                            <span className="font-mono whitespace-nowrap">{formatExpenseDate(exp.date)}</span>
                                                            <span className="inline-flex items-center gap-1 truncate">
                                                                <Icon glyph={getExpenseTypeGlyph(exp.type)} size={14} />
                                                                {EXPENSE_TYPE_LABELS[exp.type]}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-on-surface tabular-nums whitespace-nowrap">
                                                            {formatExpenseAmount(exp.amount, exp.currencyCode || settings.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="text"
                                                            size="sm"
                                                            className="h-9 min-w-0 px-2 rounded-full text-error hover:bg-error-container/40"
                                                            aria-label={`Supprimer la dépense ${exp.id}`}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDeleteExpense(exp);
                                                            }}
                                                            icon={<Icon glyph={Trash} size={16} />}
                                                        >
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-6 py-10 text-center text-on-surface-variant">
                                                Aucune dépense enregistrée pour le moment.
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </section>
                        )}

                        {activeView === 'budget' && (
                            <section
                                role="tabpanel"
                                id={getTabPanelId(FINANCE_TABS_ID_BASE, 'budget')}
                                aria-labelledby={getTabElementId(FINANCE_TABS_ID_BASE, 'budget')}
                                className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-medium2"
                            >
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Budget Total {selectedYear}</p>
                                        <div className="text-headline-medium font-black text-on-surface">{formatCurrency(budgetStats.totalAllocated, settings.currency, settings.compactNotation)}</div>
                                        <div className="flex items-center gap-2 mt-4 text-label-medium font-bold text-on-surface-variant">
                                            <span className={cn("px-2 py-0.5 rounded-md text-label-small uppercase", currentBudget.status === 'En cours' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container')}>
                                                {currentBudget.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Dépenses {selectedYear}</p>
                                        <div className="text-headline-medium font-black text-on-surface">{formatCurrency(budgetStats.totalSpent, settings.currency, settings.compactNotation)}</div>
                                        <div className="mt-4 flex items-center justify-between text-label-small">
                                            <span className="text-on-surface-variant">Utilisation</span>
                                            <span className="text-on-surface font-semibold">{spentPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-surface-container-highest rounded-full h-2.5 mt-2 overflow-hidden">
                                            <div className="bg-error h-full rounded-full" style={{ width: `${spentPercent}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-1 flex flex-col justify-between">
                                        <p className="text-label-small text-on-surface-variant uppercase font-black tracking-widest mb-2">Restant</p>
                                        {/* Règle X12 : valeur en on-surface (le jaune n'est jamais une couleur de texte sur fond clair) */}
                                        <div className={cn("text-headline-medium font-black", budgetStats.remaining < 0 ? "text-error" : "text-on-surface")}>
                                            {formatCurrency(budgetStats.remaining, settings.currency, settings.compactNotation)}
                                        </div>
                                        <div className="text-label-small text-on-surface mt-4 font-semibold">
                                            {remainingPercent.toFixed(1)}% du budget restant
                                        </div>
                                    </div>
                                </div>

                                {/* Detail List Table (Style Image) */}
                                <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
                                    <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low">
                                        <div className="flex flex-col medium:flex-row medium:items-center medium:justify-between gap-3">
                                            <div className="space-y-1">
                                                <h2 className="font-bold text-on-surface text-title-medium">Détails du budget</h2>
                                                <div className="flex items-center gap-2 text-label-small text-on-surface-variant">
                                                    {/* Règle X12 : texte sombre sur fond teinté primaire */}
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-on-primary-container font-semibold">
                                                        <Icon glyph={Calculator} size={12} /> Analyse CAPEX/OPEX
                                                    </span>
                                                    <Tooltip
                                                        variant="rich"
                                                        placement="bottom"
                                                        content={(
                                                            <div className="space-y-3">
                                                                <p className="text-body-small text-on-surface-variant">
                                                                    La classification CAPEX/OPEX est demandée ou qualifiée à la saisie du budget.
                                                                </p>
                                                                <Button
                                                                    variant="text"
                                                                    size="sm"
                                                                    onClick={() => setActiveView('expenses')}
                                                                    className="h-auto min-h-0 px-0"
                                                                >
                                                                    Ouvrir le journal des dépenses
                                                                </Button>
                                                            </div>
                                                        )}
                                                    >
                                                        <IconButton
                                                            icon={<Icon glyph={Info} size={14} />}
                                                            size="sm"
                                                            variant="standard"
                                                            aria-label="Aide analyse"
                                                            className="w-6 h-6 p-0 hover:bg-surface-container-high"
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <Button variant="outlined" size="sm" icon={<Icon glyph={DownloadSimple} size={16} />} className="w-full medium:w-auto whitespace-nowrap">
                                                Exporter le tableau
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="hidden medium:block overflow-x-auto">
                                        <table className="w-full text-body-medium text-left">
                                            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-small tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Catégorie</th>
                                                    <th className="px-6 py-4 text-right">Alloué</th>
                                                    <th className="px-6 py-4 text-right">Dépensé</th>
                                                    <th className="px-6 py-4 text-right">Restant</th>
                                                    <th className="px-6 py-4 w-1/5">Utilisation</th>
                                                    <th className="px-6 py-4 text-center">Immobilisation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant bg-surface">
                                                {currentBudget.items.map((item, idx) => {
                                                    const itemPercent = (item.spent / item.allocated) * 100;
                                                    const itemRemaining = item.allocated - item.spent;
                                                    const budgetType = budgetCapitalization(item);

                                                    return (
                                                        <tr key={idx} className="hover:bg-surface-container/50 transition-colors group">
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "p-2 rounded-lg",
                                                                        item.type === 'Purchase' ? "bg-secondary-container text-secondary" :
                                                                            item.type === 'License' ? "bg-secondary-container text-on-secondary-container" :
                                                                                item.type === 'Cloud' ? "bg-tertiary-container text-tertiary" : "bg-surface-container text-on-surface-variant"
                                                                    )}>
                                                                        <Icon glyph={getExpenseTypeGlyph(item.type)} size={16} />
                                                                    </div>
                                                                    <span className="font-bold text-on-surface">{item.category}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-medium text-on-surface-variant">
                                                                {formatCurrency(item.allocated, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-bold text-on-surface">
                                                                {formatCurrency(item.spent, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className={cn("px-6 py-5 text-right font-bold", itemRemaining < 0 ? "text-error" : "text-tertiary")}>
                                                                {formatCurrency(itemRemaining, settings.currency, settings.compactNotation)}
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full",
                                                                            itemPercent > 100 ? "bg-error" :
                                                                                itemPercent > 80 ? "bg-secondary" : "bg-tertiary"
                                                                        )}
                                                                        style={{ width: `${Math.min(itemPercent, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="text-label-small text-on-surface-variant mt-1 font-medium text-right">
                                                                    {itemPercent.toFixed(0)}%
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                {budgetType ? (
                                                                    <Badge variant={budgetType === 'CAPEX' ? 'info' : 'warning'}>
                                                                        {budgetType}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-body-small text-text-muted">non renseigné</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Vue cartes (compact) — table simplifiée en mobile */}
                                    <div className="medium:hidden divide-y divide-outline-variant">
                                        {currentBudget.items.map((item, idx) => {
                                            const itemPercent = (item.spent / item.allocated) * 100;
                                            const itemRemaining = item.allocated - item.spent;
                                            const budgetType = budgetCapitalization(item);
                                            return (
                                                <div key={idx} className="p-4 space-y-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={cn(
                                                                "p-2 rounded-lg shrink-0",
                                                                item.type === 'Purchase' ? "bg-secondary-container text-secondary" :
                                                                    item.type === 'License' ? "bg-secondary-container text-on-secondary-container" :
                                                                        item.type === 'Cloud' ? "bg-tertiary-container text-tertiary" : "bg-surface-container text-on-surface-variant"
                                                            )}>
                                                                <Icon glyph={getExpenseTypeGlyph(item.type)} size={16} />
                                                            </div>
                                                            <span className="font-bold text-on-surface truncate">{item.category}</span>
                                                        </div>
                                                        {budgetType ? (
                                                            <Badge variant={budgetType === 'CAPEX' ? 'info' : 'warning'}>
                                                                {budgetType}
                                                            </Badge>
                                                        ) : (
                                                            <span className="shrink-0 text-body-small text-text-muted">non renseigné</span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <p className="text-label-small text-on-surface-variant uppercase">Alloué</p>
                                                            <p className="font-medium text-on-surface-variant">{formatCurrency(item.allocated, settings.currency, settings.compactNotation)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-label-small text-on-surface-variant uppercase">Dépensé</p>
                                                            <p className="font-bold text-on-surface">{formatCurrency(item.spent, settings.currency, settings.compactNotation)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-label-small text-on-surface-variant uppercase">Restant</p>
                                                            <p className={cn("font-bold", itemRemaining < 0 ? "text-error" : "text-tertiary")}>{formatCurrency(itemRemaining, settings.currency, settings.compactNotation)}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    itemPercent > 100 ? "bg-error" : itemPercent > 80 ? "bg-secondary" : "bg-tertiary"
                                                                )}
                                                                style={{ width: `${Math.min(itemPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-label-small text-on-surface-variant mt-1 font-medium text-right">{itemPercent.toFixed(0)}% utilisé</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div
                                    onClick={() => setIsAddBudgetModalOpen(true)}
                                    className="border-2 border-dashed border-outline-variant rounded-card p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-3 text-on-surface-variant group-hover:text-primary transition-colors">
                                        <Icon glyph={FileCsv} size={24} />
                                    </div>
                                    <h3 className="font-bold text-on-surface">Importer un nouveau budget</h3>
                                    <p className="text-body-medium text-on-surface-variant mt-1">
                                        Écrasez les données actuelles en important un fichier Excel validé pour l'année en cours.
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>
                </PageContainer>
            </div>

        </div>
    );
};



export default FinanceManagementPage;




















