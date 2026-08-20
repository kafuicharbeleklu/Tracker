import React, { useState, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import {
    Stack,
    ShoppingBag,
    Key,
    Cloud,
    FileCsv,
    Check,
    SpinnerGap,
    Sparkle,
    Calendar,
    Plus,
} from '@phosphor-icons/react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import IconButton from '../../../components/ui/IconButton';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { cn } from '../../../lib/utils';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatCurrency } from '../../../lib/financial';
import { FinanceBudget, FinanceExpenseType } from '../../../types';
import { ExtractedBudgetDraft, extractBudgetDraftFromFile } from '../../../lib/budgetExtraction';

interface AddBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BudgetLine {
    category: string;
    amount: string;
    type: FinanceExpenseType;
    capitalization?: 'CAPEX' | 'OPEX';
}

type AddBudgetMode = 'import' | 'manual';

/**
 * Le classement d'une ligne de budget — **demandé, jamais deviné**. C'est l'arbitrage
 * central de la planche 15.1 : *« un chiffre deviné ne se présente pas comme un chiffre
 * su »*. Le produit le déduisait autrefois du montant (au-dessus de 5 000, investissement),
 * et rien ne distinguait ce classement d'un classement saisi.
 *
 * La liste **n'existait pas** : `CAPITALIZATION_OPTIONS` était référencée deux fois et
 * définie nulle part, si bien que le sélecteur recevait `undefined` et n'offrait aucun
 * choix. L'arbitrage était écrit dans le balisage et inerte à l'écran. Relevé le 20/08.
 */
const CAPITALIZATION_OPTIONS = [
    { value: 'CAPEX', label: 'CAPEX — investissement' },
    { value: 'OPEX', label: 'OPEX — frais courant' },
];

const MODE_OPTIONS = [
    { value: 'import', label: 'Import fichier' },
    { value: 'manual', label: 'Saisie manuelle' },
];

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const { settings } = useData();
    const { financeBudgets, upsertFinanceBudget } = useFinanceData();
    const isCompact = useMediaQuery(MEDIA.compact);
    /* La corbeille d'une ligne ne s'efface au survol que là où le survol existe : sans
       ce test elle restait invisible au doigt. `isHoverCapable` était employée sans
       jamais être déclarée dans ce fichier. */
    const isHoverCapable = useMediaQuery(MEDIA.hoverCapable);

    const [mode, setMode] = useState<AddBudgetMode>('import');
    const [isProcessing, setIsProcessing] = useState(false);
    const [importedFile, setImportedFile] = useState<File | null>(null);
    const [importMeta, setImportMeta] = useState<Pick<
        ExtractedBudgetDraft,
        'confidence' | 'warnings' | 'source'
    > | null>(null);
    const [isLowConfidenceReviewed, setIsLowConfidenceReviewed] = useState(false);

    const [year, setYear] = useState(new Date().getFullYear().toString());
    const requiresLowConfidenceReview = Boolean(importedFile && importMeta?.confidence === 'low');

    const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([
        { category: 'Matériel IT', amount: '25000', type: 'Purchase', capitalization: 'CAPEX' },
        {
            category: 'Licences & Logiciels',
            amount: '12000',
            type: 'License',
            capitalization: 'OPEX',
        },
        { category: 'Infrastructure Cloud', amount: '8000', type: 'Cloud', capitalization: 'OPEX' },
    ]);

    const totalBudget = useMemo(() => {
        return budgetLines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);
    }, [budgetLines]);

    /** L'icône d'une catégorie — une aide à la lecture, pas un classement comptable. */
    const getCategoryDetails = (category: string) => {
        const lower = category.toLowerCase();

        let icon = <Icon glyph={Stack} size={18} />;
        let iconBg = 'bg-surface-container text-on-surface-variant';

        // Détection Icône & Style
        if (
            lower.includes('matériel') ||
            lower.includes('capex') ||
            lower.includes('hardware') ||
            lower.includes('serveur')
        ) {
            icon = <Icon glyph={ShoppingBag} size={18} />;
            iconBg = 'bg-secondary-container text-secondary';
        } else if (lower.includes('licence') || lower.includes('software')) {
            icon = <Icon glyph={Key} size={18} />;
            iconBg = 'bg-secondary-container text-on-secondary-container';
        } else if (
            lower.includes('cloud') ||
            lower.includes('hosting') ||
            lower.includes('infrastructure')
        ) {
            icon = <Icon glyph={Cloud} size={18} />;
            iconBg = 'bg-tertiary-container text-tertiary';
        } else if (lower.includes('maintenance') || lower.includes('service')) {
            icon = <Icon glyph={Stack} size={18} />;
            iconBg = 'bg-surface-container text-on-surface-variant';
        }

        return { icon, iconBg };
    };

    const getFinanceTypeFromCategory = (category: string): FinanceExpenseType => {
        const lower = category.toLowerCase();
        if (lower.includes('licence') || lower.includes('software')) return 'License';
        if (
            lower.includes('cloud') ||
            lower.includes('hosting') ||
            lower.includes('infrastructure')
        )
            return 'Cloud';
        if (lower.includes('maintenance') || lower.includes('service')) return 'Service';
        return 'Purchase';
    };

    const reset = () => {
        setMode('import');
        setIsProcessing(false);
        setImportedFile(null);
        setImportMeta(null);
        setIsLowConfidenceReviewed(false);
        setYear(new Date().getFullYear().toString());
        setBudgetLines([
            { id: '1', category: 'Matériel IT', amount: '' },
            { id: '2', category: 'Licences Logiciel', amount: '' },
        ]);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleModeChange = (value: string | string[]) => {
        if (typeof value === 'string') {
            setMode(value as AddBudgetMode);
        }
    };

    // --- Row Management ---
    const addLine = () => {
        setBudgetLines((prev) => [
            ...prev,
            { id: Date.now().toString(), category: '', amount: '' },
        ]);
    };

    const removeLine = (id: string) => {
        setBudgetLines((prev) => prev.filter((line) => line.id !== id));
    };

    const updateLine = (id: string, field: keyof BudgetLine, value: string) => {
        setBudgetLines((prev) =>
            prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
        );
    };

    // --- Import Logic ---
    const startImportProcess = async (file: File) => {
        setImportedFile(file);
        setIsProcessing(true);
        setIsLowConfidenceReviewed(false);

        try {
            const extracted = await extractBudgetDraftFromFile(file);
            setIsProcessing(false);
            setMode('manual');
            setImportMeta({
                confidence: extracted.confidence,
                warnings: extracted.warnings,
                source: extracted.source,
            });

            setYear(extracted.year);
            if (extracted.lines.length > 0) {
                setBudgetLines(
                    extracted.lines.map((line, index) => ({
                        id: `${Date.now()}_${index}`,
                        category: line.category,
                        amount: line.amount,
                    })),
                );
            } else {
                setBudgetLines([
                    { id: '1', category: 'Matériel IT', amount: '' },
                    { id: '2', category: 'Licences Logiciel', amount: '' },
                ]);
            }

            if (extracted.confidence === 'high') {
                showToast('Budget importé avec succès.', 'success');
            } else if (extracted.lines.length > 0) {
                showToast('Import partiel. Vérifiez les lignes avant validation.', 'warning');
            } else {
                showToast('Aucune ligne exploitable détectée. Complétez manuellement.', 'warning');
            }
        } catch {
            setIsProcessing(false);
            setMode('manual');
            setImportMeta({
                confidence: 'low',
                warnings: ['Erreur de lecture du fichier.'],
                source: 'manual',
            });
            showToast('Impossible de traiter ce fichier.', 'error');
        }
    };

    const handleSubmit = () => {
        if (requiresLowConfidenceReview && !isLowConfidenceReviewed) {
            showToast('Confirmez la revue manuelle du budget avant validation.', 'warning');
            return;
        }

        if (totalBudget <= 0) {
            showToast('Le budget total ne peut pas être nul.', 'error');
            return;
        }
        const emptyLines = budgetLines.filter((l) => !l.category || !l.amount);
        if (emptyLines.length > 0) {
            showToast('Veuillez remplir toutes les lignes ou les supprimer.', 'error');
            return;
        }

        const budgetYear = Number(year) || new Date().getFullYear();
        const existingBudget = financeBudgets.find((budget) => budget.year === budgetYear);
        const existingSpentByCategory = new Map(
            (existingBudget?.items || []).map((item) => [item.category, item.spent]),
        );

        const normalizedItems: FinanceBudget['items'] = budgetLines.map((line) => {
            const allocated = Number(line.amount) || 0;
            const existingSpent = existingSpentByCategory.get(line.category) || 0;

            return {
                category: line.category,
                type: getFinanceTypeFromCategory(line.category),
                allocated,
                spent: Math.min(existingSpent, allocated),
                capitalization: line.capitalization || undefined,
            };
        });

        upsertFinanceBudget({
            year: budgetYear,
            status: budgetYear < new Date().getFullYear() ? 'Clôturé' : 'En cours',
            totalAllocated: normalizedItems.reduce((acc, item) => acc + item.allocated, 0),
            items: normalizedItems,
            sourceFileName: importedFile?.name,
        });

        showToast(
            `Budget ${year} de ${formatCurrency(totalBudget, settings.currency)} enregistré avec succès.`,
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
                onClick={handleSubmit}
                disabled={requiresLowConfidenceReview && !isLowConfidenceReviewed}
            >
                Valider le Budget
            </Button>
        </>
    );

    const categoryOptions = [
        { value: 'Matériel IT', label: 'Matériel IT' },
        { value: 'Licences Logiciel', label: 'Licences Logiciel' },
        { value: 'Cloud Infrastructure', label: 'Cloud Infrastructure' },
        { value: 'Maintenance & Services', label: 'Maintenance & Services' },
        { value: 'Consulting', label: 'Consulting & Audit' },
        { value: 'Formation', label: 'Formation' },
        { value: 'Autre', label: 'Autre' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Définir le Budget Annuel"
            footer={mode === 'manual' ? footer : undefined}
            maxWidth="max-w-4xl" // Wider modal for table view
        >
            <div className="border-outline-variant bg-surface-container-low mb-6 rounded-xl border p-2">
                <SegmentedButton
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleModeChange}
                    className="w-full"
                />
            </div>

            {mode === 'import' && (
                <div className="animate-in fade-in zoom-in-95 flex min-h-[350px] flex-col items-center justify-center space-y-6 text-center duration-300">
                    {!isProcessing ? (
                        <div className="w-full space-y-4">
                            <FileDropzone
                                onFileSelect={startImportProcess}
                                accept=".xlsx,.xls,.csv,.txt,.pdf,.jpg,.jpeg,.png,.webp"
                                label="Importer votre fichier Budget"
                                subLabel={
                                    "L'IA détectera automatiquement les colonnes Catégorie, Montant et Année."
                                }
                                className="border-outline-variant hover:border-tertiary hover:bg-tertiary-container/10 h-72 w-full"
                            />
                            <div className="flex justify-center gap-2">
                                <span className="text-label-small bg-surface-container text-on-surface-variant rounded-md px-2 py-1 font-bold">
                                    .XLSX
                                </span>
                                <span className="text-label-small bg-surface-container text-on-surface-variant rounded-md px-2 py-1 font-bold">
                                    .CSV
                                </span>
                                <span className="text-label-small bg-surface-container text-on-surface-variant rounded-md px-2 py-1 font-bold">
                                    .PDF
                                </span>
                                <span className="text-label-small bg-surface-container text-on-surface-variant rounded-md px-2 py-1 font-bold">
                                    .JPG/.PNG
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full max-w-sm flex-col items-center">
                            <div className="mb-6 flex w-full items-center gap-4">
                                <div className="bg-surface border-outline-variant shadow-elevation-1 flex h-12 w-12 items-center justify-center rounded-lg border">
                                    <Icon glyph={FileCsv} size={24} className="text-tertiary" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="bg-surface-container h-2 overflow-hidden rounded-full">
                                        <div
                                            className="bg-tertiary h-full animate-[width_2s_var(--tk-motion-easing-emphasized)_infinite]"
                                            style={{ width: '60%' }}
                                        />
                                    </div>
                                    <div className="text-label-medium text-on-surface-variant flex justify-between font-bold">
                                        <span>Analyse structurelle...</span>
                                        <span>60%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-container border-outline-variant w-full space-y-2 rounded-xl border p-4 text-left">
                                <p className="text-label-medium text-on-surface-variant mb-2 font-bold tracking-widest uppercase">
                                    Journal de traitement
                                </p>
                                <span className="animate-in fade-in slide-in-from-left-4 text-body-medium text-on-surface-variant flex items-center gap-2 delay-100">
                                    <Icon glyph={Check} size={18} className="text-tertiary" />{' '}
                                    Fichier "{importedFile?.name}" chargé
                                </span>
                                <span className="animate-in fade-in slide-in-from-left-4 text-body-medium text-on-surface-variant flex items-center gap-2 delay-500">
                                    <Icon glyph={Check} size={18} className="text-tertiary" />{' '}
                                    Détection de l'exercice fiscal
                                </span>
                                <span className="animate-in fade-in slide-in-from-left-4 text-body-medium text-on-surface-variant flex items-center gap-2 delay-1000">
                                    <Icon
                                        glyph={SpinnerGap}
                                        size={18}
                                        className="text-primary animate-spin"
                                    />{' '}
                                    Extraction des lignes budgétaires...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-in slide-in-from-right-8 space-y-6 duration-300">
                    {importedFile && (
                        <div className="bg-tertiary-container border-tertiary/20 flex items-center justify-between rounded-xl border p-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-tertiary/20 text-on-tertiary-container rounded-lg p-2">
                                    <Icon glyph={Sparkle} size={18} />
                                </div>
                                <div>
                                    <p className="text-label-medium text-on-tertiary-container font-bold uppercase">
                                        Données pré-remplies par IA
                                    </p>
                                    <p className="text-body-small text-tertiary">
                                        Vérifiez les montants ci-dessous.
                                    </p>
                                    {importMeta && (
                                        <p className="text-label-small text-on-tertiary-container/80 mt-0.5">
                                            Confiance:{' '}
                                            {importMeta.confidence === 'high'
                                                ? 'elevee'
                                                : importMeta.confidence === 'medium'
                                                  ? 'moyenne'
                                                  : 'faible'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <IconButton
                                icon="close"
                                variant="standard"
                                aria-label="Retirer le fichier importé"
                                onClick={() => {
                                    setImportedFile(null);
                                    setImportMeta(null);
                                    setIsLowConfidenceReviewed(false);
                                }}
                            />
                        </div>
                    )}

                    {importMeta?.warnings?.length ? (
                        <div className="border-outline-variant bg-surface-container-low text-body-small text-on-surface-variant rounded-xl border px-3 py-2">
                            {importMeta.warnings[0]}
                        </div>
                    ) : null}

                    {requiresLowConfidenceReview ? (
                        <label className="border-outline-variant bg-surface-container-low text-body-small text-on-surface-variant flex items-start gap-2 rounded-xl border px-3 py-2">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4"
                                checked={isLowConfidenceReviewed}
                                onChange={(e) => setIsLowConfidenceReviewed(e.target.checked)}
                            />
                            <span>
                                Je confirme avoir verifie manuellement l'annee, les categories et
                                les montants.
                            </span>
                        </label>
                    ) : null}

                    <div className="flex items-end gap-4">
                        <div className="w-40">
                            <InputField
                                label="Exercice Fiscal *"
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                icon={<Icon glyph={Calendar} size={18} />}
                                className="font-bold"
                                required
                            />
                        </div>
                        <div className="bg-surface-container-low border-outline-variant flex h-[54px] flex-1 items-center justify-between rounded-xl border p-3">
                            <span className="text-label-large text-on-surface-variant pl-2 font-bold">
                                Budget Global Calculé
                            </span>
                            <span className="text-title-large text-on-surface pr-2 font-black">
                                {formatCurrency(totalBudget, settings.currency)}
                            </span>
                        </div>
                    </div>

                    {/* Table Container exactly like Finance Detail List */}
                    <div className="bg-surface shadow-elevation-1 border-outline-variant overflow-hidden rounded-xl border">
                        {isCompact ? (
                            <div className="divide-outline-variant divide-y">
                                {budgetLines.map((line) => {
                                    const details = getCategoryDetails(line.category);
                                    return (
                                        <div key={line.id} className="space-y-3 p-4">
                                            <div className="flex items-end gap-3">
                                                <div
                                                    className={cn(
                                                        'mb-1 shrink-0 rounded-lg p-2',
                                                        details.iconBg,
                                                    )}
                                                >
                                                    {details.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <SelectField
                                                        name={`cat-${line.id}`}
                                                        label="Catégorie"
                                                        options={categoryOptions}
                                                        value={line.category}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                line.id,
                                                                'category',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Choisir une catégorie..."
                                                        className="w-full"
                                                    />
                                                </div>
                                                <IconButton
                                                    icon="delete"
                                                    variant="standard"
                                                    aria-label="Supprimer la ligne budgétaire"
                                                    onClick={() => removeLine(line.id)}
                                                    className="text-on-surface-variant hover:text-error hover:bg-error-container mb-1 shrink-0"
                                                />
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <InputField
                                                        label="Montant alloué"
                                                        type="number"
                                                        value={line.amount}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                line.id,
                                                                'amount',
                                                                e.target.value,
                                                            )
                                                        }
                                                        aria-label={`Montant pour ${line.category || 'la ligne budgétaire'}`}
                                                        placeholder="0.00"
                                                        prefix={
                                                            settings.currency === 'USD'
                                                                ? '$'
                                                                : settings.currency === 'XOF'
                                                                  ? 'XOF'
                                                                  : '€'
                                                        }
                                                        className="bg-surface-container-low py-2 text-right font-mono font-bold"
                                                    />
                                                </div>
                                                <div className="w-40 shrink-0">
                                                    <SelectField
                                                        name={`cap-${line.id}`}
                                                        label="Immobilisation"
                                                        options={CAPITALIZATION_OPTIONS}
                                                        value={line.capitalization}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                line.id,
                                                                'capitalization',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="À renseigner"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {budgetLines.length === 0 && (
                                    <p className="text-on-surface-variant text-body-medium px-6 py-8 text-center italic">
                                        Aucune ligne budgétaire.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="text-body-medium w-full text-left">
                                    <thead className="bg-surface-container text-on-surface-variant text-label-small font-bold tracking-widest uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Catégorie</th>
                                            <th className="w-48 px-6 py-4 text-right">
                                                Montant Alloué
                                            </th>
                                            <th className="w-40 px-6 py-4 text-center">
                                                Immobilisation
                                            </th>
                                            <th className="w-16 px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-outline-variant bg-surface divide-y">
                                        {budgetLines.map((line) => {
                                            const details = getCategoryDetails(line.category);
                                            return (
                                                <tr
                                                    key={line.id}
                                                    className="hover:bg-surface-container/50 group transition-colors"
                                                >
                                                    <td className="px-6 py-3">
                                                        <div className="flex w-full items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    'shrink-0 rounded-lg p-2',
                                                                    details.iconBg,
                                                                )}
                                                            >
                                                                {details.icon}
                                                            </div>
                                                            <div className="min-w-[200px] flex-1">
                                                                <SelectField
                                                                    name={`cat-${line.id}`}
                                                                    options={categoryOptions}
                                                                    value={line.category}
                                                                    onChange={(e) =>
                                                                        updateLine(
                                                                            line.id,
                                                                            'category',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Choisir une catégorie..."
                                                                    className="mb-0 h-auto w-full border-none bg-transparent px-0 py-0 hover:bg-transparent"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="relative">
                                                            <span className="text-on-surface-variant text-label-medium absolute top-1/2 left-3 -translate-y-1/2 font-bold">
                                                                {settings.currency === 'USD'
                                                                    ? '$'
                                                                    : settings.currency === 'XOF'
                                                                      ? 'XOF'
                                                                      : '€'}
                                                            </span>
                                                            <InputField
                                                                type="number"
                                                                value={line.amount}
                                                                onChange={(e) =>
                                                                    updateLine(
                                                                        line.id,
                                                                        'amount',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                aria-label={`Montant pour ${line.category || 'la ligne budgétaire'}`}
                                                                placeholder="0.00"
                                                                className="bg-surface-container-low py-2 pr-4 pl-8 text-right font-mono font-bold"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <SelectField
                                                            name={`cap-${line.id}`}
                                                            options={CAPITALIZATION_OPTIONS}
                                                            value={line.capitalization}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    line.id,
                                                                    'capitalization',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="À renseigner"
                                                            className="mb-0 w-full"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <IconButton
                                                            icon="delete"
                                                            variant="standard"
                                                            aria-label="Supprimer la ligne budgétaire"
                                                            onClick={() => removeLine(line.id)}
                                                            className={cn(
                                                                'text-on-surface-variant hover:text-error hover:bg-error-container transition-opacity',
                                                                isHoverCapable
                                                                    ? 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
                                                                    : 'opacity-100',
                                                            )}
                                                            title="Supprimer la ligne"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {budgetLines.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="text-on-surface-variant text-body-medium px-6 py-8 text-center italic"
                                                >
                                                    Aucune ligne budgétaire.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="border-outline-variant border-t p-2">
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={addLine}
                                className="w-full border-dashed"
                                icon={<Icon glyph={Plus} size={18} />}
                            >
                                Ajouter une ligne
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
