import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import Modal from '../../../components/ui/Modal';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { parseAmountString } from '../../../lib/expenseExtraction';
import { FinanceExpense, FinanceExpenseStatus, FinanceExpenseType } from '../../../types';
import {
    EXPENSE_STATUS_OPTIONS,
    EXPENSE_TYPE_OPTIONS,
    toExpenseDisplayTitle,
} from '../lib/expensePresentation';

interface ExpenseEditModalProps {
    /** La dépense à modifier, `null` quand la fenêtre est fermée. */
    expenseId: string | null;
    onClose: () => void;
}

const formulaireDe = (expense: FinanceExpense) => ({
    date: expense.date,
    supplier: expense.supplier,
    amount: expense.amount.toFixed(2).replace('.', ','),
    type: expense.type as string,
    status: expense.status as string,
    description: expense.description,
    invoiceNumber: expense.invoiceNumber || '',
});

type Formulaire = ReturnType<typeof formulaireDe>;

/**
 * **La fenêtre de modification d'une dépense** — une seule, pour les deux endroits qui la
 * modifient : la feuille de détail au téléphone, le panneau de la dépense ouverte au
 * bureau (27/09). Elle vivait dans la feuille ; le panneau l'aurait recopiée.
 *
 * Elle lit la dépense **dans la donnée, par son identifiant**, comme la feuille : une
 * modification enregistrée se voit aussitôt dans ce qui l'a ouverte.
 */
const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({ expenseId, onClose }) => {
    const { financeExpenses, updateFinanceExpense } = useFinanceData();
    const { showToast } = useToast();
    const expense = expenseId
        ? (financeExpenses.find((item) => item.id === expenseId) ?? null)
        : null;

    /* Le formulaire part des valeurs de la dépense ouverte, jamais de la précédente : il se
       réinitialise quand l'identifiant change (état dérivé, posé pendant le rendu). */
    const [form, setForm] = useState<Formulaire | null>(null);
    const [pourId, setPourId] = useState<string | null>(null);
    if (expense && pourId !== expense.id) {
        setPourId(expense.id);
        setForm(formulaireDe(expense));
    }
    if (!expense && pourId !== null) {
        setPourId(null);
        setForm(null);
    }

    const changer = (field: keyof Formulaire, value: string) =>
        setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

    const enregistrer = () => {
        if (!expense || !form) return;

        const normalizedAmount = parseAmountString(form.amount);
        if (!normalizedAmount || normalizedAmount <= 0) {
            showToast('Le montant doit être supérieur à zéro.', 'error');
            return;
        }

        if (!form.supplier.trim()) {
            showToast('Le fournisseur est obligatoire.', 'error');
            return;
        }

        const isUpdated = updateFinanceExpense(expense.id, {
            date: form.date,
            supplier: form.supplier.trim(),
            amount: normalizedAmount,
            type: form.type as FinanceExpenseType,
            status: form.status as FinanceExpenseStatus,
            description: form.description.trim() || `Facture ${form.supplier.trim()}`,
            invoiceNumber: form.invoiceNumber.trim() || undefined,
        });

        if (!isUpdated) {
            showToast('Modification refusée : doublon ou donnée invalide.', 'error');
            return;
        }

        showToast('Dépense mise à jour avec succès.', 'success');
        onClose();
    };

    return (
        <Modal
            isOpen={Boolean(expense && form)}
            onClose={onClose}
            title={expense ? `Modifier · ${toExpenseDisplayTitle(expense)}` : 'Modifier la dépense'}
            maxWidth="max-w-2xl"
            footer={
                <>
                    <Button variant="outlined" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={enregistrer}>
                        Enregistrer
                    </Button>
                </>
            }
        >
            {form && (
                <>
                    <div className="medium:grid-cols-2 grid grid-cols-1 gap-4">
                        <InputField
                            label="Fournisseur"
                            value={form.supplier}
                            onChange={(event) => changer('supplier', event.target.value)}
                            required
                        />
                        <InputField
                            label="Date"
                            type="date"
                            value={form.date}
                            onChange={(event) => changer('date', event.target.value)}
                            required
                        />
                        <InputField
                            label="Montant"
                            value={form.amount}
                            onChange={(event) => changer('amount', event.target.value)}
                            supportingText="Format accepté: 1.000.000,00"
                            required
                        />
                        <InputField
                            label="Référence facture"
                            value={form.invoiceNumber}
                            onChange={(event) => changer('invoiceNumber', event.target.value)}
                        />
                        <SelectField
                            name="expense-type-edit"
                            label="Type"
                            value={form.type}
                            onChange={(event) => changer('type', event.target.value)}
                            options={EXPENSE_TYPE_OPTIONS}
                        />
                        <SelectField
                            name="expense-status-edit"
                            label="Statut"
                            value={form.status}
                            onChange={(event) => changer('status', event.target.value)}
                            options={EXPENSE_STATUS_OPTIONS}
                        />
                    </div>
                    <div className="mt-4">
                        <TextArea
                            label="Description"
                            value={form.description}
                            onChange={(event) => changer('description', event.target.value)}
                            rows={4}
                        />
                    </div>
                </>
            )}
        </Modal>
    );
};

export default ExpenseEditModal;
