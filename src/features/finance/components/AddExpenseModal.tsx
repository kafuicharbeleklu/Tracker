import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import IconButton from '../../../components/ui/IconButton';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import {
    extractExpenseDraftFromFile,
    ExtractedExpenseDraft,
    parseAmountString,
} from '../../../lib/expenseExtraction';
import { deleteExpenseSourceFile, saveExpenseSourceFile } from '../../../lib/financeFileStorage';
import { FinanceExpenseType } from '../../../types';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AddExpenseMode = 'scan' | 'manual';

const EXPENSE_TYPE_OPTIONS = [
    { value: 'Purchase', label: 'Achat (CAPEX)' },
    { value: 'License', label: 'Licence' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Service', label: 'Service' },
    { value: 'Cloud', label: 'Cloud' },
];

const MODE_OPTIONS = [
    { value: 'scan', label: 'Scan IA', icon: 'auto_awesome' },
    { value: 'manual', label: 'Saisie', icon: 'description' },
];

const getObjectUrlForFile = (file?: File | null): string | undefined => {
    if (!file) return undefined;
    try {
        return URL.createObjectURL(file);
    } catch {
        return undefined;
    }
};

type PreparedSourceFile = {
    sourceFileId?: string;
    sourceFileName?: string;
    sourceFileUrl?: string;
};

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const { settings } = useData();
    const { addFinanceExpense } = useFinanceData();

    const [mode, setMode] = useState<AddExpenseMode>('scan');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedFile, setScannedFile] = useState<File | null>(null);
    const [extractionMeta, setExtractionMeta] = useState<Pick<
        ExtractedExpenseDraft,
        'confidence' | 'warnings' | 'fieldConfidence' | 'source' | 'currencyCode' | 'textSource'
    > | null>(null);
    const [isLowConfidenceReviewed, setIsLowConfidenceReviewed] = useState(false);

    const [formData, setFormData] = useState({
        type: '',
        amount: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        invoiceNumber: '',
    });

    const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'XOF' : '€';
    const requiresLowConfidenceReview = Boolean(scannedFile && extractionMeta?.confidence === 'low');

    const confidenceLabel = (value: 'high' | 'medium' | 'low') => (
        value === 'high' ? 'élevée' : value === 'medium' ? 'moyenne' : 'faible'
    );

    const textSourceLabel = (source: ExtractedExpenseDraft['textSource']) => {
        if (source === 'native') return 'Texte natif';
        if (source === 'ocr') return 'OCR';
        if (source === 'hybrid') return 'Natif + OCR';
        return 'Indéterminée';
    };

    const prepareSourceFile = async (file?: File | null): Promise<PreparedSourceFile> => {
        if (!file) {
            return {};
        }

        let sourceFileId: string | undefined;
        try {
            sourceFileId = await saveExpenseSourceFile(file);
        } catch {
            sourceFileId = undefined;
        }

        return {
            sourceFileId,
            sourceFileName: file.name,
            sourceFileUrl: sourceFileId ? undefined : getObjectUrlForFile(file),
        };
    };

    const cleanupPreparedSourceFile = async (prepared: PreparedSourceFile): Promise<void> => {
        if (prepared.sourceFileId) {
            try {
                await deleteExpenseSourceFile(prepared.sourceFileId);
            } catch {
                // Ignore cleanup errors for already-removed records.
            }
        }
        if (prepared.sourceFileUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(prepared.sourceFileUrl);
        }
    };

    const applyDraftToForm = (file: File, extracted: ExtractedExpenseDraft) => {
        setScannedFile(file);
        setMode('manual');
        setIsLowConfidenceReviewed(false);
        setFormData({
            type: extracted.type,
            amount: extracted.amount,
            supplier: extracted.supplier,
            date: extracted.date,
            description: extracted.description,
            invoiceNumber: extracted.invoiceNumber,
        });
        setExtractionMeta({
            confidence: extracted.confidence,
            warnings: extracted.warnings,
            fieldConfidence: extracted.fieldConfidence,
            source: extracted.source,
            currencyCode: extracted.currencyCode,
            textSource: extracted.textSource,
        });
    };

    const createExpenseFromDraft = async (file: File, extracted: ExtractedExpenseDraft) => {
        const parsedAmount = parseAmountString(extracted.amount);
        if (!parsedAmount || parsedAmount <= 0) {
            return { ok: false as const, reason: 'invalid_amount' as const };
        }

        if (!extracted.supplier || extracted.supplier === 'Fournisseur non détecté') {
            return { ok: false as const, reason: 'invalid_supplier' as const };
        }

        const preparedSource = await prepareSourceFile(file);
        const inserted = addFinanceExpense({
            date: extracted.date,
            supplier: extracted.supplier.trim(),
            amount: parsedAmount,
            type: extracted.type,
            status: 'Paid',
            description: extracted.description.trim() || `Facture ${extracted.supplier.trim()}`,
            invoiceNumber: extracted.invoiceNumber.trim() || undefined,
            sourceFileName: preparedSource.sourceFileName,
            sourceFileId: preparedSource.sourceFileId,
            sourceFileUrl: preparedSource.sourceFileUrl,
            currencyCode: extracted.currencyCode,
            extractionSource: extracted.source,
            textSource: extracted.textSource,
            extractionConfidence: extracted.confidence,
        });

        if (!inserted.ok) {
            await cleanupPreparedSourceFile(preparedSource);
            const reason = inserted.reason === 'forbidden'
                ? 'forbidden'
                : 'duplicate';
            return { ok: false as const, reason };
        }

        return { ok: true as const };
    };

    const reset = () => {
        setMode('scan');
        setIsScanning(false);
        setScannedFile(null);
        setExtractionMeta(null);
        setIsLowConfidenceReviewed(false);
        setFormData({
            type: '',
            amount: '',
            supplier: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            invoiceNumber: '',
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleModeChange = (value: string | string[]) => {
        if (typeof value === 'string') {
            setMode(value as AddExpenseMode);
        }
    };

    const startScan = async (file: File) => {
        setScannedFile(file);
        setIsScanning(true);
        setIsLowConfidenceReviewed(false);

        try {
            const extracted = await extractExpenseDraftFromFile(file);

            setIsScanning(false);
            applyDraftToForm(file, extracted);

            if (extracted.confidence === 'high') {
                showToast('Facture analysée avec succès.', 'success');
            } else {
                showToast('Analyse partielle. Vérifiez les champs avant validation.', 'warning');
            }
        } catch {
            setIsScanning(false);
            setMode('manual');
            showToast('Impossible d’analyser ce fichier automatiquement.', 'error');
        }
    };

    const startBatchScan = async (files: File[]) => {
        if (files.length <= 1) {
            if (files[0]) {
                await startScan(files[0]);
            }
            return;
        }

        setIsScanning(true);
        setMode('scan');
        setScannedFile(null);
        setExtractionMeta(null);
        setIsLowConfidenceReviewed(false);

        let imported = 0;
        let duplicates = 0;
        let reviewRequired = 0;
        let failed = 0;
        let firstReviewItem: { file: File; draft: ExtractedExpenseDraft } | null = null;
        let permissionDenied = false;

        for (const file of files) {
            try {
                const extracted = await extractExpenseDraftFromFile(file);
                const coreAmount = parseAmountString(extracted.amount);
                const needsReview = extracted.confidence === 'low'
                    || !coreAmount
                    || !extracted.supplier
                    || extracted.supplier === 'Fournisseur non détecté';

                if (needsReview) {
                    reviewRequired += 1;
                    if (!firstReviewItem) {
                        firstReviewItem = { file, draft: extracted };
                    }
                    continue;
                }

                const created = await createExpenseFromDraft(file, extracted);
                if (created.ok) {
                    imported += 1;
                } else if (created.reason === 'duplicate') {
                    duplicates += 1;
                } else if (created.reason === 'forbidden') {
                    permissionDenied = true;
                    break;
                } else {
                    reviewRequired += 1;
                    if (!firstReviewItem) {
                        firstReviewItem = { file, draft: extracted };
                    }
                }
            } catch {
                failed += 1;
            }
        }

        setIsScanning(false);

        if (permissionDenied) {
            showToast('Action refusée: permissions insuffisantes pour ajouter des dépenses.', 'error');
            return;
        }

        if (firstReviewItem) {
            applyDraftToForm(firstReviewItem.file, firstReviewItem.draft);
        }

        showToast(
            `Import lot: ${imported} ajoutées, ${duplicates} doublons, ${reviewRequired} à vérifier, ${failed} en échec.`,
            reviewRequired > 0 || failed > 0 ? 'warning' : 'success',
        );
    };

    const handleSubmit = async () => {
        if (requiresLowConfidenceReview && !isLowConfidenceReviewed) {
            showToast('Confirmez la revue manuelle des champs avant validation.', 'warning');
            return;
        }

        if (!formData.amount || !formData.supplier || !formData.type) {
            showToast('Veuillez remplir les informations obligatoires.', 'error');
            return;
        }

        const parsedAmount = parseAmountString(formData.amount);
        if (parsedAmount === null || parsedAmount <= 0) {
            showToast('Le montant doit être supérieur à zéro.', 'error');
            return;
        }

        const preparedSource = await prepareSourceFile(scannedFile);
        const createdExpense = addFinanceExpense({
            date: formData.date,
            supplier: formData.supplier.trim(),
            amount: parsedAmount,
            type: formData.type as FinanceExpenseType,
            status: 'Paid',
            description: formData.description.trim() || `Facture ${formData.supplier.trim()}`,
            invoiceNumber: formData.invoiceNumber.trim() || undefined,
            sourceFileName: preparedSource.sourceFileName,
            sourceFileId: preparedSource.sourceFileId,
            sourceFileUrl: preparedSource.sourceFileUrl,
            currencyCode: extractionMeta?.currencyCode,
            extractionSource: extractionMeta?.source,
            textSource: extractionMeta?.textSource,
            extractionConfidence: extractionMeta?.confidence,
        });

        if (!createdExpense.ok) {
            await cleanupPreparedSourceFile(preparedSource);
            if (createdExpense.reason === 'forbidden') {
                showToast('Action refusée: permissions insuffisantes pour ajouter des dépenses.', 'error');
                return;
            }
            showToast('Dépense déjà importée. Aucun doublon ajouté.', 'warning');
            handleClose();
            return;
        }

        showToast(`Dépense enregistrée (${createdExpense.expense?.supplier || formData.supplier}).`, 'success');
        handleClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={handleClose}>Annuler</Button>
            <Button
                variant="filled"
                onClick={() => {
                    void handleSubmit();
                }}
                disabled={requiresLowConfidenceReview && !isLowConfidenceReviewed}
            >
                Enregistrer la dépense
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Enregistrer une dépense"
            footer={mode === 'manual' ? footer : undefined}
            maxWidth="max-w-5xl"
        >
            <div className="mb-6 rounded-md border border-outline-variant bg-gradient-to-r from-surface-container-low to-surface-container p-3">
                <div className="mb-2 flex items-center gap-2 text-label-small text-on-surface-variant uppercase tracking-widest">
                    <MaterialIcon name="sync_alt" size={14} />
                    Mode de saisie
                </div>
                <SegmentedButton
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleModeChange}
                    className="w-full"
                />
            </div>

            {mode === 'scan' && (
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {!isScanning ? (
                        <FileDropzone
                            onFileSelect={startScan}
                            onFilesSelect={startBatchScan}
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
                            label="Déposez vos factures ici"
                            subLabel="Import unitaire ou en lot: extraction automatique des informations clés"
                            className="w-full h-64 border-outline-variant hover:border-primary"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-outline-variant flex items-center justify-center relative overflow-hidden">
                                    <MaterialIcon name="description" size={40} className="text-on-surface-variant" />
                                    <div
                                        className="absolute inset-0 bg-primary/20 animate-[spin_3s_linear_infinite]"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MaterialIcon name="document_scanner" size={48} className="text-primary animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-title-medium font-bold text-on-surface mt-6">Analyse en cours...</h3>
                            <div className="flex flex-col gap-1 mt-2 text-body-medium text-on-surface-variant">
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-100 flex items-center gap-2">
                                    <MaterialIcon name="check" size={12} className="text-tertiary" />
                                    Détection du fournisseur
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-500 flex items-center gap-2">
                                    <MaterialIcon name="check" size={12} className="text-tertiary" />
                                    Lecture des montants HT/TTC
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 delay-1000 flex items-center gap-2">
                                    <MaterialIcon name="progress_activity" size={12} className="animate-spin text-primary" />
                                    Catégorisation...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-in slide-in-from-right-8 duration-300 space-y-4">
                    {scannedFile && (
                        <div className="bg-tertiary-container border border-tertiary/20 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-tertiary/20 rounded-lg text-on-tertiary-container">
                                    <MaterialIcon name="auto_awesome" size={16} />
                                </div>
                                <div>
                                    <p className="text-label-medium font-bold text-on-tertiary-container uppercase">Données extraites par IA</p>
                                    <p className="text-body-small text-tertiary truncate max-w-[260px]">{scannedFile.name}</p>
                                    {extractionMeta && (
                                        <p className="text-label-small text-on-tertiary-container/80 mt-0.5">
                                            Confiance: {confidenceLabel(extractionMeta.confidence)}
                                        </p>
                                    )}
                                    {extractionMeta?.currencyCode ? (
                                        <p className="text-label-small text-on-tertiary-container/80">
                                            Devise détectée: {extractionMeta.currencyCode}
                                        </p>
                                    ) : null}
                                    {extractionMeta ? (
                                        <p className="text-label-small text-on-tertiary-container/80">
                                            Source lecture: {textSourceLabel(extractionMeta.textSource)}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            <IconButton
                                icon="close"
                                variant="standard"
                                aria-label="Retirer le fichier scanné"
                                onClick={() => {
                                    setScannedFile(null);
                                    setExtractionMeta(null);
                                    setIsLowConfidenceReviewed(false);
                                }}
                            />
                        </div>
                    )}

                    {extractionMeta?.warnings?.length ? (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant">
                            {extractionMeta.warnings[0]}
                        </div>
                    ) : null}

                    {extractionMeta?.fieldConfidence ? (
                        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-label-small text-on-surface-variant">
                            Champs détectés: fournisseur {confidenceLabel(extractionMeta.fieldConfidence.supplier)} · montant {confidenceLabel(extractionMeta.fieldConfidence.amount)} · référence {confidenceLabel(extractionMeta.fieldConfidence.invoiceNumber)} · date {confidenceLabel(extractionMeta.fieldConfidence.date)}
                        </div>
                    ) : null}

                    {requiresLowConfidenceReview ? (
                        <label className="flex items-start gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4"
                                checked={isLowConfidenceReviewed}
                                onChange={(e) => setIsLowConfidenceReviewed(e.target.checked)}
                            />
                            <span>
                                Je confirme avoir verifie manuellement le fournisseur, le montant, la date et la reference.
                            </span>
                        </label>
                    ) : null}

                    <div className="border border-primary/25 bg-primary-container/10 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <MaterialIcon name="priority_high" size={16} className="text-primary" />
                            <p className="text-label-medium uppercase tracking-widest text-on-surface">Champs critiques</p>
                        </div>
                        <div className="grid grid-cols-1 expanded:grid-cols-3 gap-4">
                            <InputField
                                label={`Montant (${currencySymbol}) *`}
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                            <InputField
                                label="Fournisseur *"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                placeholder="Ex: Dell Technologies"
                                required
                            />
                            <InputField
                                label="Date *"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4 border border-outline-variant bg-surface-container-low p-4">
                        <div className="expanded:col-span-2 mb-1 flex items-center gap-2">
                            <MaterialIcon name="tune" size={16} className="text-on-surface-variant" />
                            <p className="text-label-medium uppercase tracking-widest text-on-surface-variant">Détails complémentaires</p>
                        </div>
                        <InputField
                            label="N° Facture (optionnel)"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="INV-2024-001"
                        />
                        <SelectField
                            label="Type de dépense *"
                            name="expense-type"
                            options={EXPENSE_TYPE_OPTIONS}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            placeholder="Sélectionner un type"
                            required
                        />
                        <div className="expanded:col-span-2">
                            <TextArea
                                label="Description (optionnelle)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Détails de la dépense..."
                            />
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

