import React, { useMemo, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import {
    ArrowsClockwise,
    FileText,
    MagnifyingGlass,
    Check,
    SpinnerGap,
    Warning,
    WarningCircle,
    Sliders,
} from '@phosphor-icons/react';
import { formatCurrency } from '../../../lib/financial';
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
import { ExtractionConfidence, FinanceExpenseType } from '../../../types';

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
    { value: 'scan', label: 'Scan automatique' },
    { value: 'manual', label: 'Saisie manuelle' },
];

/** « 6 août 2026 » — la date d'une lecture se lit, elle ne se décode pas. */
const formatReadDate = (date: Date): string => {
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

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
    const { addFinanceExpense, financeBudgets } = useFinanceData();

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

    const currencySymbol =
        settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'XOF' : '€';
    const requiresLowConfidenceReview = Boolean(
        scannedFile && extractionMeta?.confidence === 'low',
    );

    /* `confidenceLabel` et `textSourceLabel` sont tombés avec le bandeau « Données
       extraites par IA » : la confiance et la source de lecture ne s'affichent plus,
       elles décident de ce qui arrive rempli et de ce qui arrive vide (15.1). */

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

    /**
     * **La confiance ne se dit pas, elle décide** — planche 15.1.
     *
     * Le produit pré-remplissait *aussi* ce que la machine n'avait pas su lire, avec
     * une mention de confiance à côté que rien n'oblige à lire — et un `INV-2026-O412`
     * où la lettre O a pris la place du zéro traverse la validation sans être vu.
     * **Personne ne relit un champ déjà rempli.**
     *
     * Un champ lu avec une confiance faible arrive donc **vide** : un champ vide se
     * remplit en trois secondes, un champ faux se découvre trois mois plus tard.
     */
    const keepIfRead = (value: string, confidence: ExtractionConfidence): string =>
        confidence === 'low' ? '' : value;

    /**
     * **Sur quel poste cette dépense s'impute, et ce qu'il en restera après** — planche
     * 15.1, colonne 2. Le bloc existait dans la feuille de détail, au présent (« il
     * reste ») : il disait l'état avant l'acte, pas la conséquence de l'acte. C'est
     * pourtant ici, avant d'enregistrer, que le chiffre décide.
     */
    const budgetImpact = useMemo(() => {
        if (!formData.type) return null;
        const amount = parseAmountString(formData.amount);
        if (amount === null || amount <= 0) return null;

        const year = new Date(formData.date || Date.now()).getFullYear();
        const budget = financeBudgets.find((entry) => entry.year === year) ?? financeBudgets[0];
        const line = budget?.items.find((item) => item.type === formData.type);
        if (!line || line.allocated <= 0) return null;

        const consumed = Math.round((line.spent / line.allocated) * 100);
        return { category: line.category, consumed, after: line.allocated - line.spent - amount };
    }, [financeBudgets, formData.amount, formData.date, formData.type]);

    /** Les champs laissés vides parce que la lecture n'était pas franche. */
    const unreadFields = extractionMeta?.fieldConfidence
        ? (
              [
                  ['le fournisseur', extractionMeta.fieldConfidence.supplier],
                  ['le montant', extractionMeta.fieldConfidence.amount],
                  ['le numéro de facture', extractionMeta.fieldConfidence.invoiceNumber],
                  ['la date', extractionMeta.fieldConfidence.date],
              ] as const
          )
              .filter(([, confidence]) => confidence === 'low')
              .map(([label]) => label)
        : [];

    const applyDraftToForm = (file: File, extracted: ExtractedExpenseDraft) => {
        setScannedFile(file);
        setMode('manual');
        setIsLowConfidenceReviewed(false);
        setFormData({
            type: extracted.type,
            amount: keepIfRead(extracted.amount, extracted.fieldConfidence.amount),
            supplier: keepIfRead(extracted.supplier, extracted.fieldConfidence.supplier),
            date: keepIfRead(extracted.date, extracted.fieldConfidence.date),
            description: extracted.description,
            invoiceNumber: keepIfRead(
                extracted.invoiceNumber,
                extracted.fieldConfidence.invoiceNumber,
            ),
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
            const reason = inserted.reason === 'forbidden' ? 'forbidden' : 'duplicate';
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
                const needsReview =
                    extracted.confidence === 'low' ||
                    !coreAmount ||
                    !extracted.supplier ||
                    extracted.supplier === 'Fournisseur non détecté';

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
            showToast(
                'Action refusée: permissions insuffisantes pour ajouter des dépenses.',
                'error',
            );
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
                showToast(
                    'Action refusée: permissions insuffisantes pour ajouter des dépenses.',
                    'error',
                );
                return;
            }
            showToast('Dépense déjà importée. Aucun doublon ajouté.', 'warning');
            handleClose();
            return;
        }

        showToast(
            `Dépense enregistrée (${createdExpense.expense?.supplier || formData.supplier}).`,
            'success',
        );
        handleClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={handleClose}>
                Annuler
            </Button>
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
            <div className="border-outline-variant from-surface-container-low to-surface-container mb-6 rounded-md border bg-gradient-to-r p-3">
                <div className="text-label-small text-on-surface-variant mb-2 flex items-center gap-2 tracking-widest uppercase">
                    <Icon glyph={ArrowsClockwise} size={18} />
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
                <div className="animate-in fade-in zoom-in-95 flex min-h-[300px] flex-col items-center justify-center space-y-6 text-center duration-300">
                    {!isScanning ? (
                        <FileDropzone
                            onFileSelect={startScan}
                            onFilesSelect={startBatchScan}
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
                            label="Déposez vos factures ici"
                            subLabel="Import unitaire ou en lot: extraction automatique des informations clés"
                            className="border-outline-variant hover:border-primary h-64 w-full"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="border-outline-variant relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4">
                                    <Icon
                                        glyph={FileText}
                                        size={32}
                                        className="text-on-surface-variant"
                                    />
                                    <div
                                        className="bg-primary/20 absolute inset-0 animate-[spin_3s_linear_infinite]"
                                        style={{
                                            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Icon
                                        glyph={MagnifyingGlass}
                                        size={32}
                                        className="text-primary animate-pulse"
                                    />
                                </div>
                            </div>
                            <h3 className="text-title-medium text-on-surface mt-6 font-bold">
                                Analyse en cours...
                            </h3>
                            <div className="text-body-medium text-on-surface-variant mt-2 flex flex-col gap-1">
                                <span className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 delay-100">
                                    <Icon glyph={Check} size={18} className="text-tertiary" />
                                    Détection du fournisseur
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 delay-500">
                                    <Icon glyph={Check} size={18} className="text-tertiary" />
                                    Lecture des montants HT/TTC
                                </span>
                                <span className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 delay-1000">
                                    <Icon
                                        glyph={SpinnerGap}
                                        size={18}
                                        className="text-primary animate-spin"
                                    />
                                    Catégorisation...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-in slide-in-from-right-8 space-y-4 duration-300">
                    {/* Le fichier lu — `.fread` de 15.1. Une surface neutre : icône, nom,
                        date de lecture, et de quoi le retirer. Le bandeau teinté « Données
                        extraites par IA » disait la machine plutôt que le document, et
                        empilait trois lignes de métadonnées que la planche ne porte pas —
                        la confiance ne se dit pas, elle décide (voir `keepIfRead`). */}
                    {scannedFile && (
                        <div className="border-outline-variant bg-surface shadow-elevation-1 rounded-lg border p-4">
                            <div className="flex min-h-[56px] items-center gap-3">
                                <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]">
                                    <Icon glyph={FileText} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <b className="text-on-surface block truncate text-[14px] font-medium">
                                        {scannedFile.name}
                                    </b>
                                    <span className="text-on-surface-variant block text-[12px]">
                                        lue le {formatReadDate(new Date())}
                                    </span>
                                </span>
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
                        </div>
                    )}

                    {extractionMeta?.warnings?.length ? (
                        <div className="border-outline-variant bg-surface-container-low text-body-small text-on-surface-variant rounded-xl border px-3 py-2">
                            {extractionMeta.warnings[0]}
                        </div>
                    ) : null}

                    {/* ── Ce que la machine a lu — `.xrow` de 15.1 ─────────────────────
                        Le second bloc de la colonne 2, qui n'existait qu'en **lecture**,
                        dans la feuille de détail — donc à l'endroit où il ne sert plus à
                        décider. Ce qui a été lu franchement est **acquis** et se relit d'un
                        coup d'œil ; ce qui ne l'a pas été porte « non lu · à saisir », et
                        c'est le seul endroit où l'œil doit se poser. */}
                    {scannedFile && extractionMeta && (
                        <div className="border-outline-variant bg-surface shadow-elevation-1 rounded-lg border p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[13px] font-medium">
                                    Ce que la machine a lu
                                </h3>
                            </div>
                            <div className="divide-outline-variant divide-y">
                                {[
                                    {
                                        label: 'Fournisseur',
                                        value: formData.supplier,
                                        confidence: extractionMeta.fieldConfidence?.supplier,
                                    },
                                    {
                                        label: 'Montant',
                                        value: formData.amount
                                            ? `${formData.amount} ${extractionMeta.currencyCode || settings.currency}`
                                            : '',
                                        confidence: extractionMeta.fieldConfidence?.amount,
                                    },
                                    {
                                        label: 'Date',
                                        value: formData.date
                                            ? formatReadDate(new Date(formData.date))
                                            : '',
                                        confidence: extractionMeta.fieldConfidence?.date,
                                    },
                                    {
                                        label: 'N° de facture',
                                        value: formData.invoiceNumber,
                                        confidence: extractionMeta.fieldConfidence?.invoiceNumber,
                                    },
                                ].map((row) => {
                                    const unread = !row.value || row.confidence === 'low';
                                    return (
                                        <div
                                            key={row.label}
                                            className="flex items-baseline gap-2.5 py-[9px] text-[13px]"
                                        >
                                            <span className="text-on-surface-variant w-[106px] shrink-0">
                                                {row.label}
                                            </span>
                                            <span
                                                className={
                                                    unread
                                                        ? 'text-text-muted min-w-0 flex-1 font-normal'
                                                        : 'text-on-surface min-w-0 flex-1 truncate font-medium tabular-nums'
                                                }
                                            >
                                                {unread ? 'non lu' : row.value}
                                            </span>
                                            {unread && (
                                                <span className="text-text-muted shrink-0 text-[11px]">
                                                    à saisir
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-on-surface-variant mt-1.5 px-0.5 text-[12px] leading-[17px]">
                                {unreadFields.length === 0 ? (
                                    <>Les quatre champs sont acquis. Rien à relire.</>
                                ) : (
                                    <>
                                        {4 - unreadFields.length} champ
                                        {4 - unreadFields.length > 1 ? 's' : ''} sur quatre{' '}
                                        {4 - unreadFields.length > 1 ? 'sont acquis' : 'est acquis'}
                                        . Le
                                        {unreadFields.length > 1
                                            ? 's autres arrivent vides'
                                            : ' quatrième arrive vide'}{' '}
                                        : c'est le seul endroit où l'œil doit se poser.
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {requiresLowConfidenceReview ? (
                        <label className="border-outline-variant bg-surface-container-low text-body-small text-on-surface-variant flex items-start gap-2 rounded-xl border px-3 py-2">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4"
                                checked={isLowConfidenceReviewed}
                                onChange={(e) => setIsLowConfidenceReviewed(e.target.checked)}
                            />
                            <span>
                                Je confirme avoir verifie manuellement le fournisseur, le montant,
                                la date et la reference.
                            </span>
                        </label>
                    ) : null}

                    <div className="border-primary/25 bg-primary-container/10 border p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Icon glyph={WarningCircle} size={18} className="text-primary" />
                            <p className="text-label-medium text-on-surface tracking-widest uppercase">
                                Champs critiques
                            </p>
                        </div>
                        <div className="expanded:grid-cols-3 grid grid-cols-1 gap-4">
                            <InputField
                                label={`Montant (${currencySymbol}) *`}
                                type="number"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                placeholder="0.00"
                                required
                            />
                            <InputField
                                label="Fournisseur *"
                                value={formData.supplier}
                                onChange={(e) =>
                                    setFormData({ ...formData, supplier: e.target.value })
                                }
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

                    <div className="expanded:grid-cols-2 border-outline-variant bg-surface-container-low grid grid-cols-1 gap-4 border p-4">
                        <div className="expanded:col-span-2 mb-1 flex items-center gap-2">
                            <Icon glyph={Sliders} size={18} className="text-on-surface-variant" />
                            <p className="text-label-medium text-on-surface-variant tracking-widest uppercase">
                                Détails complémentaires
                            </p>
                        </div>
                        <InputField
                            label="N° Facture (optionnel)"
                            value={formData.invoiceNumber}
                            onChange={(e) =>
                                setFormData({ ...formData, invoiceNumber: e.target.value })
                            }
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
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                                placeholder="Détails de la dépense..."
                            />
                        </div>
                    </div>

                    {/* L'imputation budgétaire — `.warn` de 15.1. **Ce que l'acte laisse
                        derrière lui**, pas l'état d'avant : le poste, ce qu'il a déjà
                        consommé, et ce qu'il en restera une fois cette dépense enregistrée.
                        Un solde qui passe sous zéro se voit ici, pas à la clôture. */}
                    {budgetImpact && (
                        <div className="border-outline-variant bg-surface-container text-on-surface-variant flex gap-2.5 rounded-md border p-[11px_12px] text-[12px] leading-[17px]">
                            <Icon
                                glyph={Warning}
                                size={18}
                                className="text-on-surface-variant mt-px shrink-0"
                            />
                            <span>
                                <b className="text-on-surface font-medium">
                                    Cette dépense s'impute sur «&nbsp;{budgetImpact.category}&nbsp;»
                                </b>
                                , qui est consommé à {budgetImpact.consumed}&nbsp;%. Après
                                enregistrement, il restera{' '}
                                <b
                                    className={
                                        budgetImpact.after < 0
                                            ? 'text-error font-medium'
                                            : 'text-on-surface font-medium'
                                    }
                                >
                                    {formatCurrency(
                                        budgetImpact.after,
                                        settings.currency,
                                        settings.compactNotation,
                                    )}
                                </b>{' '}
                                sur le poste.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
