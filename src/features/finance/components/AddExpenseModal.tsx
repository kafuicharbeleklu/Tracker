import React, { useMemo, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { FileText, Keyboard, Warning } from '@phosphor-icons/react';
import { formatCurrency } from '../../../lib/financial';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import IconButton from '../../../components/ui/IconButton';
import { FullScreenLayout } from '../../../components/layout/FullScreenLayout';
import {
    FieldLabel,
    FormNote,
    FormSection,
    FormWarn,
    Segmented,
} from '../../../components/ui/FormParts';
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

const MODE_OPTIONS: ReadonlyArray<{ value: AddExpenseMode; label: string }> = [
    { value: 'scan', label: 'Lire une facture' },
    { value: 'manual', label: 'Saisir à la main' },
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
            showToast("Vous n'avez pas le droit d'ajouter une dépense.", 'error');
            return;
        }

        if (firstReviewItem) {
            applyDraftToForm(firstReviewItem.file, firstReviewItem.draft);
        }

        showToast(
            `${imported} dépense(s) ajoutée(s) · ${duplicates + reviewRequired + failed} écartée(s)`,
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
                showToast("Vous n'avez pas le droit d'ajouter une dépense.", 'error');
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

    if (!isOpen) return null;

    /* `.tbar .save` de 15.4 — **le verbe seul, et seulement quand il y a de quoi
       enregistrer.** Les colonnes « lecture en cours » et « lecture échouée » portent
       une barre nue : il n'y a rien à valider tant que rien n'est lu ni saisi. */
    const headerActions =
        mode === 'manual' ? (
            <Button
                variant="text"
                onClick={() => {
                    void handleSubmit();
                }}
                className="text-on-surface text-ts-body h-12 px-3 font-medium"
            >
                Enregistrer
            </Button>
        ) : undefined;

    return (
        <FullScreenLayout
            title="Nouvelle dépense"
            onBack={handleClose}
            onClose={handleClose}
            headerActions={headerActions}
            className="bg-background"
        >
            <div className="flex flex-col gap-4">
                {/* **Deux chemins, pas un réglage.** 15.3 pose les trois chemins dans le menu
                du geste d'ajout — photographier, importer, saisir ; le produit n'a qu'un
                geste, l'échelle courte de 17.4 les tient donc ici, sans bandeau en
                dégradé ni capitales. */}
                <FormSection title="Comment saisir">
                    <Segmented
                        label="Mode de saisie"
                        value={mode}
                        onChange={(value) => setMode(value)}
                        options={MODE_OPTIONS}
                    />
                </FormSection>

                {mode === 'scan' && (
                    <>
                        {!isScanning ? (
                            <FormSection title="La facture">
                                <FileDropzone
                                    onFileSelect={startScan}
                                    onFilesSelect={startBatchScan}
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
                                    label="Déposez vos factures ici"
                                    subLabel="Une seule ou tout un lot : ce qui est lu franchement arrive rempli."
                                />
                            </FormSection>
                        ) : (
                            /* **Le transitoire de 15.4** : le fichier est déjà là, les champs
                           attendent leur valeur, et la sortie est offerte tout de suite —
                           on peut saisir à la main sans attendre la fin de la lecture.
                           L'écran tournait un disque de 96 et trois lignes de commentaire
                           sur ce que la machine faisait ; la planche montre ce qui va être
                           rempli, pas la machine au travail. */
                            <FormSection title="Lecture en cours">
                                {scannedFile && (
                                    <div className="flex min-h-14 items-center gap-3">
                                        <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                            <Icon glyph={FileText} size={20} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                                {scannedFile.name}
                                            </span>
                                            <span className="text-on-surface-variant text-ts-sub leading-ts-sub block">
                                                {Math.max(1, Math.round(scannedFile.size / 1024))}{' '}
                                                Ko
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* `.pbar` — une piste de 4 sur le creux, et le trait qui la
                                parcourt : la lecture dure deux à cinq secondes. */}
                                <div
                                    className="bg-surface-container h-1 overflow-hidden rounded-full"
                                    role="progressbar"
                                    aria-label="Lecture de la facture"
                                >
                                    <div className="bg-on-surface h-full w-1/3 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full" />
                                </div>

                                {/* `.skrow` — la clé est déjà lisible, la valeur est une barre
                                en attente : on sait ce qui va arriver, et où. */}
                                <div className="flex flex-col gap-3">
                                    {['Fournisseur', 'Montant', 'Date', 'N° de facture'].map(
                                        (label) => (
                                            <div key={label} className="flex items-center gap-3">
                                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub w-[110px] shrink-0">
                                                    {label}
                                                </span>
                                                <span className="bg-surface-container h-4 min-w-0 flex-1 rounded-[2px]" />
                                            </div>
                                        ),
                                    )}
                                </div>

                                <Button
                                    variant="outlined"
                                    icon={<Icon glyph={Keyboard} size={20} />}
                                    onClick={() => setMode('manual')}
                                    className="w-full"
                                >
                                    Saisir à la main
                                </Button>
                            </FormSection>
                        )}

                        {isScanning && (
                            <FormWarn glyph={FileText}>
                                Le fichier est déjà gardé comme justificatif.
                            </FormWarn>
                        )}
                    </>
                )}

                {mode === 'manual' && (
                    <div className="animate-in slide-in-from-right-8 flex flex-col gap-4 duration-300">
                        {/* Le fichier lu — `.fread` de 15.1. Une surface neutre : icône, nom,
                        date de lecture, et de quoi le retirer. Le bandeau teinté « Données
                        extraites par IA » disait la machine plutôt que le document, et
                        empilait trois lignes de métadonnées que la planche ne porte pas —
                        la confiance ne se dit pas, elle décide (voir `keepIfRead`). */}
                        {scannedFile && (
                            <FormSection title="La facture">
                                {/* `.doc` de 15.4 — la vignette, le nom, le poids, et de quoi
                                le retirer. La carte était cernée et posait le nom en 14 ;
                                une planche ne cerne pas une section. */}
                                <div className="flex min-h-14 items-center gap-3">
                                    <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                        <Icon glyph={FileText} size={20} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                            {scannedFile.name}
                                        </span>
                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub block">
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

                                {extractionMeta?.warnings?.length ? (
                                    <FormNote>{extractionMeta.warnings[0]}</FormNote>
                                ) : null}
                            </FormSection>
                        )}

                        {/* ── Ce que la machine a lu — `.xrow` de 15.1 ─────────────────────
                        Le second bloc de la colonne 2, qui n'existait qu'en **lecture**,
                        dans la feuille de détail — donc à l'endroit où il ne sert plus à
                        décider. Ce qui a été lu franchement est **acquis** et se relit d'un
                        coup d'œil ; ce qui ne l'a pas été porte « non lu · à saisir », et
                        c'est le seul endroit où l'œil doit se poser. */}
                        {scannedFile && extractionMeta && (
                            <FormSection title="Ce que la machine a lu">
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
                                            confidence:
                                                extractionMeta.fieldConfidence?.invoiceNumber,
                                        },
                                    ].map((row) => {
                                        const unread = !row.value || row.confidence === 'low';
                                        return (
                                            <div
                                                key={row.label}
                                                /* `.xrow` — 44 de haut, la clé à gauche en
                                               encre secondaire, la valeur à droite. */
                                                className="text-ts-sub leading-ts-sub flex min-h-11 items-center gap-2.5"
                                            >
                                                <span className="text-on-surface-variant w-[110px] shrink-0">
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
                                                    <span className="text-text-muted shrink-0 text-[0.75rem] leading-4">
                                                        à saisir
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <FormNote>
                                    {unreadFields.length === 0 ? (
                                        <>Les quatre champs sont acquis. Rien à relire.</>
                                    ) : (
                                        <>
                                            {4 - unreadFields.length} champ
                                            {4 - unreadFields.length > 1 ? 's' : ''} sur quatre{' '}
                                            {4 - unreadFields.length > 1
                                                ? 'sont acquis'
                                                : 'est acquis'}
                                            . Le
                                            {unreadFields.length > 1
                                                ? 's autres arrivent vides'
                                                : ' quatrième arrive vide'}{' '}
                                            : c'est le seul endroit où l'œil doit se poser.
                                        </>
                                    )}
                                </FormNote>

                                {requiresLowConfidenceReview ? (
                                    <label className="bg-surface-container text-on-surface-variant text-ts-sub leading-ts-sub flex items-start gap-3 rounded-[4px] px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4"
                                            checked={isLowConfidenceReviewed}
                                            onChange={(e) =>
                                                setIsLowConfidenceReviewed(e.target.checked)
                                            }
                                        />
                                        <span>
                                            Je confirme avoir relu le fournisseur, le montant, la
                                            date et le numéro de facture.
                                        </span>
                                    </label>
                                ) : null}
                            </FormSection>
                        )}

                        {/* `.fsec` « La dépense » de 15.4 — **ce qui décide, dans l'ordre de
                        la facture**. Le bloc portait un cadre jaune pâle et « CHAMPS
                        CRITIQUES » en capitales espacées : les planches n'écrivent pas de
                        capitales, ne cernent pas une section, et ne posent le jaune que
                        sur un acte. L'astérisque tombe : `.rq` dit « obligatoire » quand
                        il le faut, le champ le signale à la validation. */}
                        <FormSection title="La dépense">
                            <InputField
                                label="Montant"
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                placeholder="0"
                                supportingText={`en ${currencySymbol}`}
                                required
                            />
                            <InputField
                                label="Fournisseur"
                                name="supplier"
                                value={formData.supplier}
                                onChange={(e) =>
                                    setFormData({ ...formData, supplier: e.target.value })
                                }
                                placeholder="Dell Technologies"
                                required
                            />
                            <InputField
                                label="Date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </FormSection>

                        {/* `.fsec` « La nature » — le poste sur lequel la dépense s'impute,
                        le numéro qui l'identifie, et ce qu'elle couvre. */}
                        <FormSection title="La nature">
                            <SelectField
                                label="Poste"
                                name="expense-type"
                                options={EXPENSE_TYPE_OPTIONS}
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                placeholder="Sélectionner un poste"
                                required
                            />
                            <InputField
                                label="N° de facture"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, invoiceNumber: e.target.value })
                                }
                                placeholder="INV-0412"
                                supportingText="facultatif"
                            />
                            <div>
                                <FieldLabel>Description</FieldLabel>
                                <TextArea
                                    aria-label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                    placeholder="Deux postes de travail pour l'atelier de Lomé."
                                />
                            </div>
                        </FormSection>

                        {/* L'imputation budgétaire — `.warn` de 15.1. **Ce que l'acte laisse
                        derrière lui**, pas l'état d'avant : le poste, ce qu'il a déjà
                        consommé, et ce qu'il en restera une fois cette dépense enregistrée.
                        Un solde qui passe sous zéro se voit ici, pas à la clôture. */}
                        {budgetImpact && (
                            <FormWarn glyph={Warning}>
                                <span>
                                    <b className="text-on-surface font-medium">
                                        Cette dépense s'impute sur «&nbsp;{budgetImpact.category}
                                        &nbsp;»
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
                            </FormWarn>
                        )}
                    </div>
                )}
            </div>
        </FullScreenLayout>
    );
};
