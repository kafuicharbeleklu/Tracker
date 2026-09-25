import React, { useMemo, useState } from 'react';
import { COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import { cn } from '../../../lib/utils';
import Icon from '../../../components/ui/Icon';
import { Check, CheckCircle, FileText, Keyboard, Warning } from '@phosphor-icons/react';
import { formatCurrency, getBudgetCategoryByExpenseType } from '../../../lib/financial';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import IconButton from '../../../components/ui/IconButton';
import { FullScreenLayout } from '../../../components/layout/FullScreenLayout';
import {
    FormNote,
    FormSection,
    FormWarn,
    OptionRow,
    Segmented,
} from '../../../components/ui/FormParts';
import { useToast } from '../../../context/ToastContext';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
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

/**
 * **Les postes, dans l'ordre de la facture** — une rangée par ligne du budget où une
 * dépense peut s'imputer. Le produit impute par nature (`getBudgetCategoryByExpenseType`) :
 * Maintenance et Service tombent sur la même ligne, la rangée garde donc les deux, et
 * l'échelle courte les départage une fois la ligne prise.
 */
const POSTES: ReadonlyArray<{
    type: FinanceExpenseType;
    nature: string;
    aussi?: FinanceExpenseType;
}> = [
    { type: 'Purchase', nature: 'achat de matériel' },
    { type: 'License', nature: 'licence, abonnement logiciel' },
    { type: 'Cloud', nature: 'hébergement, services en ligne' },
    { type: 'Maintenance', nature: 'maintenance, prestation', aussi: 'Service' },
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
    const isCompact = useMediaQuery(MEDIA.compact);
    const { settings } = useData();
    const { addFinanceExpense, financeBudgets } = useFinanceData();

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
    const exerciceDeLaDate = useMemo(() => {
        const year = new Date(formData.date || Date.now()).getFullYear();
        return { year, budget: financeBudgets.find((entry) => entry.year === year) };
    }, [financeBudgets, formData.date]);

    /** Ce qu'il reste sur la ligne d'un poste, cette année-là — `null` si la ligne n'existe pas. */
    const resteDe = (type: FinanceExpenseType) => {
        const line = exerciceDeLaDate.budget?.items.find(
            (item) => item.category === getBudgetCategoryByExpenseType(type),
        );
        return line ? { line, reste: line.allocated - line.spent } : null;
    };

    const budgetImpact = useMemo(() => {
        if (!formData.type) return null;
        const amount = parseAmountString(formData.amount);
        if (amount === null || amount <= 0) return null;
        const category = getBudgetCategoryByExpenseType(formData.type as FinanceExpenseType);
        const line = exerciceDeLaDate.budget?.items.find((item) => item.category === category);
        if (!line) return { category, after: null };
        return { category, after: line.allocated - line.spent - amount };
    }, [exerciceDeLaDate, formData.amount, formData.type]);

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

    const cur = extractionMeta?.currencyCode || settings.currency;
    const lu = (confidence?: ExtractionConfidence) =>
        Boolean(scannedFile && extractionMeta && confidence && confidence !== 'low');

    /* `.tbar .save` de 15.4 — **le verbe seul, et seulement quand il y a de quoi
       enregistrer.** La lecture en cours porte une barre nue. */
    /* Au téléphone, la coche seule — comme « Lignes du budget » : le mot à côté d'un
       titre de 28 coupait « Nouvelle dépense » en « Nouvelle… » à 393. */
    const headerActions = isScanning ? undefined : isCompact ? (
        <Button
            variant="text"
            iconOnly
            aria-label="Enregistrer"
            onClick={() => {
                void handleSubmit();
            }}
        >
            <Icon glyph={Check} size={24} />
        </Button>
    ) : (
        <Button
            variant="text"
            onClick={() => {
                void handleSubmit();
            }}
            className="text-on-surface text-ts-body h-12 px-3 font-medium"
        >
            Enregistrer
        </Button>
    );

    return (
        <FullScreenLayout
            title="Nouvelle dépense"
            onBack={handleClose}
            onClose={handleClose}
            headerActions={headerActions}
            className="bg-background"
            mesure="double"
        >
            {/* **Un formulaire, pas deux chemins** (refonte du 24/09, vers 15.4). L'écran
                s'ouvrait sur un réglage « Comment saisir — Lire une facture | Saisir à la
                main » et une zone de dépôt seule : rien du formulaire n'était visible avant
                d'avoir choisi. 15.4 pose **la facture en tête** — la lire remplit ce
                qu'elle dit franchement — puis la dépense, le poste et ce qu'il en restera.
                On saisit à la main en remplissant, simplement ; il n'y a rien à choisir. */}
            <div className={cn('flex flex-col gap-4', COLONNES_FORMULAIRE)}>
                {isScanning ? (
                    <>
                        {/* **Le transitoire de 15.4** : le fichier est déjà là, les champs
                            attendent leur valeur, et la sortie est offerte tout de suite. */}
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
                                            {Math.max(1, Math.round(scannedFile.size / 1024))} Ko
                                        </span>
                                    </span>
                                </div>
                            )}
                            <div
                                className="bg-surface-container h-1 overflow-hidden rounded-full"
                                role="progressbar"
                                aria-label="Lecture de la facture"
                            >
                                <div className="bg-on-surface h-full w-1/3 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full" />
                            </div>
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
                                onClick={() => setIsScanning(false)}
                                className="w-full"
                            >
                                Saisir à la main
                            </Button>
                        </FormSection>
                        <FormWarn glyph={FileText}>
                            Le fichier est déjà gardé comme justificatif.
                        </FormWarn>
                    </>
                ) : (
                    <>
                        {/* `.fsec` « La facture » — le justificatif, et sa lecture. */}
                        <FormSection
                            title="La facture"
                            caption={scannedFile ? undefined : 'la lire remplit le reste'}
                        >
                            {scannedFile ? (
                                <>
                                    <div className="flex min-h-14 items-center gap-3">
                                        <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                            <Icon glyph={FileText} size={20} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                                {scannedFile.name}
                                            </span>
                                            <span className="text-on-surface-variant text-ts-sub leading-ts-sub block">
                                                {extractionMeta
                                                    ? unreadFields.length === 0
                                                        ? `lue le ${formatReadDate(new Date())} · tout est acquis`
                                                        : `lue le ${formatReadDate(new Date())} · ${unreadFields.length} champ${unreadFields.length > 1 ? 's' : ''} à saisir`
                                                    : 'gardée comme justificatif'}
                                            </span>
                                        </span>
                                        <IconButton
                                            icon="close"
                                            variant="standard"
                                            aria-label="Retirer la facture"
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
                                                J'ai relu le fournisseur, le montant, la date et le
                                                numéro.
                                            </span>
                                        </label>
                                    ) : null}
                                </>
                            ) : (
                                <FileDropzone
                                    onFileSelect={startScan}
                                    onFilesSelect={startBatchScan}
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
                                    label="Déposez vos factures ici"
                                    subLabel="Une seule ou tout un lot : ce qui est lu franchement arrive rempli."
                                />
                            )}
                        </FormSection>

                        {/* `.fsec` « La dépense » — ce que dit la facture. Un champ lu
                            franchement le dit sous lui ; un champ mal lu arrive vide
                            (`keepIfRead`), c'est là que l'œil se pose. */}
                        <FormSection title="La dépense">
                            <InputField
                                label="Montant"
                                name="amount"
                                inputMode="decimal"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                placeholder="0"
                                suffix={cur}
                                supportingText={
                                    lu(extractionMeta?.fieldConfidence?.amount)
                                        ? 'lu sur la facture'
                                        : undefined
                                }
                                className="tabular-nums"
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
                                supportingText={
                                    lu(extractionMeta?.fieldConfidence?.supplier)
                                        ? 'lu sur la facture'
                                        : undefined
                                }
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField
                                    label="Date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
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
                                />
                            </div>
                        </FormSection>

                        {/* `.fsec` « Le poste » — `.pick` de 15.4 : chaque ligne dit ce qui lui
                            reste **avant** qu'on la prenne. Remplace une liste déroulante de
                            natures (« Achat (CAPEX) », « Service »…) qui ne disait ni sur quelle
                            ligne la dépense tombait, ni ce qu'il y restait. */}
                        <FormSection
                            title="Le poste"
                            caption={
                                exerciceDeLaDate.budget
                                    ? `budget ${exerciceDeLaDate.year}`
                                    : `pas de budget ${exerciceDeLaDate.year}`
                            }
                        >
                            <div
                                role="radiogroup"
                                aria-label="Poste"
                                className="flex flex-col gap-2"
                            >
                                {POSTES.map((poste) => {
                                    const pris =
                                        formData.type === poste.type ||
                                        (poste.aussi !== undefined &&
                                            formData.type === poste.aussi);
                                    const r = resteDe(poste.type);
                                    return (
                                        <OptionRow
                                            key={poste.type}
                                            title={getBudgetCategoryByExpenseType(poste.type)}
                                            hint={
                                                r
                                                    ? `${r.line.capitalization ? `${r.line.capitalization} · ` : ''}${formatCurrency(r.reste, settings.currency, settings.compactNotation)} restants`
                                                    : poste.nature
                                            }
                                            tint="bleu"
                                            selected={pris}
                                            onSelect={() =>
                                                !pris &&
                                                setFormData({ ...formData, type: poste.type })
                                            }
                                        />
                                    );
                                })}
                            </div>
                            {(formData.type === 'Maintenance' || formData.type === 'Service') && (
                                <Segmented
                                    label="Nature"
                                    value={formData.type}
                                    onChange={(value) => setFormData({ ...formData, type: value })}
                                    options={[
                                        { value: 'Maintenance', label: 'Maintenance' },
                                        { value: 'Service', label: 'Prestation' },
                                    ]}
                                />
                            )}
                            {/* `.warn` de 15.4 — **ce que l'acte laisse derrière lui**. */}
                            {budgetImpact && (
                                <FormWarn
                                    glyph={
                                        budgetImpact.after !== null && budgetImpact.after < 0
                                            ? Warning
                                            : CheckCircle
                                    }
                                    tint={
                                        budgetImpact.after === null
                                            ? undefined
                                            : budgetImpact.after < 0
                                              ? 'orange'
                                              : 'vert'
                                    }
                                >
                                    {budgetImpact.after === null ? (
                                        <>
                                            {exerciceDeLaDate.year} n'a pas de ligne «&nbsp;
                                            {budgetImpact.category}&nbsp;» : elle sera ouverte à ce
                                            montant.
                                        </>
                                    ) : budgetImpact.after < 0 ? (
                                        <>
                                            S'impute sur {budgetImpact.category} : la ligne
                                            dépassera de{' '}
                                            <b className="font-medium">
                                                {formatCurrency(
                                                    -budgetImpact.after,
                                                    settings.currency,
                                                    settings.compactNotation,
                                                )}
                                            </b>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            S'impute sur {budgetImpact.category} : il restera{' '}
                                            <b className="font-medium">
                                                {formatCurrency(
                                                    budgetImpact.after,
                                                    settings.currency,
                                                    settings.compactNotation,
                                                )}
                                            </b>
                                            .
                                        </>
                                    )}
                                </FormWarn>
                            )}
                        </FormSection>

                        <FormSection title="Description" caption="facultatif">
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
                        </FormSection>
                    </>
                )}
            </div>
        </FullScreenLayout>
    );
};
