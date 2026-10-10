import React, { useMemo, useRef, useState } from 'react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FilePicker from '../../../components/ui/FilePicker';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { useDerniereValeur } from '../../../hooks/useDerniereValeur';
import { saveExpenseSourceFile } from '../../../lib/financeFileStorage';
import { cn } from '../../../lib/utils';
import { FinanceBudgetItem } from '../../../types';
import { useExpenseActions } from '../hooks/useExpenseActions';
import {
    EXPENSE_TYPE_LABELS,
    etatDuJustificatif,
    posteDeLaDepense,
} from '../lib/expensePresentation';
import ExpenseEditModal from './ExpenseEditModal';
import { CorpsDeLaDepense } from './PanneauDeDepense';

interface ExpenseDetailSheetProps {
    /** L'identifiant de la dépense ouverte, `null` quand la feuille est fermée. */
    expenseId: string | null;
    onClose: () => void;
    /** Les postes de l'exercice, pour dire sur lequel la dépense s'impute. */
    budgetItems: FinanceBudgetItem[];
}

/** Un acte secondaire de la feuille — une rangée de 48, sous un filet. */
const ACTE =
    'border-outline-variant text-ts-body leading-ts-body -mx-5 h-12 min-h-12 w-[calc(100%+2.5rem)] justify-start rounded-none border-t px-5 font-normal';

/**
 * **La dépense ouverte, au téléphone et à la tablette** (10/10) — la feuille de 15.1.
 *
 * Sous 840, la dépense s'ouvrait encore dans l'ancienne feuille : trois cartes encadrées
 * (le fichier lu, « Ce que la machine a lu », l'imputation sous un triangle d'alerte), un
 * titre « Détail · … » et « Supprimer » en rouge au pied. Le bureau avait reçu son panneau le
 * 27/09 ; la feuille rend désormais **le même corps** (`CorpsDeLaDepense`) : le montant et
 * son état, la pièce et ses gestes, les faits de la facture, le poste et ce qu'il y reste.
 *
 * - **Le titre est le fournisseur**, le poste et l'objet dessous — comme le panneau.
 * - **Le pied porte ce qu'on fait d'une dépense qu'on relit** : « Modifier », et « Marquer
 *   payée » sur une dépense en attente. « Supprimer » quitte le pied : c'est le dernier des
 *   actes secondaires, détaché, comme dans tout menu.
 * - À la tablette, la feuille se centre en dialogue (`BottomSheet`, dès 600) au lieu de
 *   s'étirer sur 768 px.
 *
 * Elle lit la dépense **dans la donnée, par son identifiant** : une modification faite d'ici
 * se voit aussitôt, sans qu'un écran ait à recoudre son état.
 */
export const ExpenseDetailSheet: React.FC<ExpenseDetailSheetProps> = ({
    expenseId,
    onClose,
    budgetItems,
}) => {
    const { settings } = useData();
    const { financeExpenses, updateFinanceExpense } = useFinanceData();
    const { showToast } = useToast();
    const { requestExpenseDeletion, previewSourceFile, downloadSourceFile } = useExpenseActions();

    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const selecteurDePiece = useRef<HTMLInputElement>(null);

    const ouverte = useMemo(
        () => (expenseId ? (financeExpenses.find((item) => item.id === expenseId) ?? null) : null),
        [financeExpenses, expenseId],
    );
    /* La feuille garde ce qu'elle montrait le temps de redescendre. */
    const depense = useDerniereValeur(ouverte);

    /* Le poste qui a compté la dépense — la règle d'imputation, pas une ressemblance. */
    const poste = useMemo(
        () => (depense ? posteDeLaDepense(depense, budgetItems) : null),
        [budgetItems, depense],
    );

    const recevoirLaPiece = async (fichier: File | undefined) => {
        if (!depense || !fichier) return;
        let sourceFileId: string | undefined;
        try {
            sourceFileId = await saveExpenseSourceFile(fichier);
        } catch {
            sourceFileId = undefined;
        }
        if (!sourceFileId) {
            showToast('Le justificatif n’a pas pu être enregistré sur cet appareil.', 'error');
            return;
        }
        const joint = updateFinanceExpense(depense.id, {
            sourceFileId,
            sourceFileName: fichier.name,
        });
        showToast(
            joint ? 'Justificatif joint.' : 'Modification refusée.',
            joint ? 'success' : 'error',
        );
    };

    const marquerPayee = () => {
        if (!depense) return;
        const fait = updateFinanceExpense(depense.id, { status: 'Paid' });
        showToast(
            fait ? 'Dépense marquée payée.' : 'Modification refusée.',
            fait ? 'success' : 'error',
        );
    };

    const sousTitre = depense
        ? [poste?.category ?? EXPENSE_TYPE_LABELS[depense.type], depense.description?.trim()]
              .filter(Boolean)
              .join(' · ')
        : undefined;

    return (
        <>
            <ExpenseEditModal
                expenseId={editingExpenseId}
                onClose={() => setEditingExpenseId(null)}
            />
            {/* Le sélecteur du système de design : il refuse de lui-même un fichier trop lourd. */}
            <FilePicker
                ref={selecteurDePiece}
                accept="application/pdf,image/*"
                onFiles={(_noms, fichiers) => void recevoirLaPiece(fichiers[0])}
                onReject={(message) => showToast(message, 'error')}
            />

            <BottomSheet
                id="feuille-de-depense"
                open={Boolean(ouverte)}
                onClose={onClose}
                title={depense?.supplier ?? ''}
                subtitle={sousTitre}
            >
                {depense && (
                    <div className="flex flex-col gap-5">
                        <CorpsDeLaDepense
                            depense={depense}
                            poste={poste}
                            devise={settings.currency}
                            notationCompacte={settings.compactNotation}
                            auDoigt
                            onJoindre={() => selecteurDePiece.current?.click()}
                            onVoir={() => void previewSourceFile(depense)}
                            onTelecharger={() => void downloadSourceFile(depense)}
                        />

                        {/* Les actes secondaires — l'irréversible en dernier, à l'encre du danger. */}
                        <div className="flex flex-col">
                            {etatDuJustificatif(depense) === 'joint' && (
                                <Button
                                    variant="text"
                                    onClick={() => selecteurDePiece.current?.click()}
                                    className={cn(ACTE, 'text-on-surface')}
                                >
                                    Remplacer le justificatif
                                </Button>
                            )}
                            <Button
                                variant="text"
                                onClick={() =>
                                    requestExpenseDeletion(depense, () => {
                                        setEditingExpenseId(null);
                                        onClose();
                                    })
                                }
                                className={cn(
                                    ACTE,
                                    'text-on-tint-danger hover:text-on-tint-danger',
                                )}
                            >
                                Supprimer la dépense
                            </Button>
                        </div>

                        <div
                            data-pied
                            className="border-outline-variant duo-de-pied -mx-5 -mt-5 gap-3 border-t px-5 pt-4 pb-1"
                        >
                            <Button
                                variant="outlined"
                                className="justify-center"
                                onClick={() => setEditingExpenseId(depense.id)}
                            >
                                Modifier
                            </Button>
                            {depense.status === 'Pending' && (
                                <Button
                                    variant="filled"
                                    className="justify-center"
                                    onClick={marquerPayee}
                                >
                                    Marquer payée
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

export default ExpenseDetailSheet;
