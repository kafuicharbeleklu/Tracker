import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import IconButton from '../../../components/ui/IconButton';
import Badge from '../../../components/ui/Badge';
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
    id: string;
    category: string;
    amount: string;
}

type AddBudgetMode = 'import' | 'manual';

const MODE_OPTIONS = [
    { value: 'import', label: 'Import Excel', icon: 'table_chart' },
    { value: 'manual', label: 'Saisie', icon: 'pie_chart' },
];

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const { settings } = useData();
    const { financeBudgets, upsertFinanceBudget } = useFinanceData();
    // Sans vrai survol (tactile), l'action supprimer-ligne reste visible en permanence
    // (sinon opacity-0 group-hover la cache au tap). Pattern repris de LocationsPage.
    const isHoverCapable = useMediaQuery(MEDIA.hoverCapable);
    // Le tableau de saisie à 4 colonnes est recomposé en cartes empilées sous 600px (#12) :
    // bascule JS et non `hidden`/`medium:hidden`, pour ne pas dupliquer des CHAMPS de
    // formulaire (deux instances contrôlées du même `name` dans le DOM).
    const isCompact = useMediaQuery(MEDIA.compact);

    const [mode, setMode] = useState<AddBudgetMode>('import');
    const [isProcessing, setIsProcessing] = useState(false);
    const [importedFile, setImportedFile] = useState<File | null>(null);
    const [importMeta, setImportMeta] = useState<Pick<ExtractedBudgetDraft, 'confidence' | 'warnings' | 'source'> | null>(null);
    const [isLowConfidenceReviewed, setIsLowConfidenceReviewed] = useState(false);

    const [year, setYear] = useState(new Date().getFullYear().toString());
    const requiresLowConfidenceReview = Boolean(importedFile && importMeta?.confidence === 'low');

    // Dynamic Rows State
    const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([
        { id: '1', category: 'Matériel IT', amount: '' },
        { id: '2', category: 'Licences Logiciel', amount: '' }
    ]);

    const totalBudget = useMemo(() => {
        return budgetLines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);
    }, [budgetLines]);

    // Helper pour déterminer le type (CAPEX/OPEX) et l'icône dynamiquement
    const getCategoryDetails = (category: string, amount: string) => {
        const lower = category.toLowerCase();
        const amountVal = parseFloat(amount) || 0;

        let type: 'CAPEX' | 'OPEX' = 'OPEX';
        let icon = <MaterialIcon name="layers" size={16} />;
        let iconBg = 'bg-surface-container text-on-surface-variant';

        // Détection Icône & Style
        if (lower.includes('matériel') || lower.includes('capex') || lower.includes('hardware') || lower.includes('serveur')) {
            icon = <MaterialIcon name="work" size={16} />;
            iconBg = 'bg-secondary-container text-secondary';
        } else if (lower.includes('licence') || lower.includes('software')) {
            icon = <MaterialIcon name="vpn_key" size={16} />;
            iconBg = 'bg-secondary-container text-on-secondary-container';
        } else if (lower.includes('cloud') || lower.includes('hosting') || lower.includes('infrastructure')) {
            icon = <MaterialIcon name="cloud_upload" size={16} />;
            iconBg = 'bg-tertiary-container text-tertiary';
        } else if (lower.includes('maintenance') || lower.includes('service')) {
            icon = <MaterialIcon name="layers" size={16} />;
            iconBg = 'bg-surface-container text-on-surface-variant';
        }

        // Détection Type (IA logic simulation)
        if (lower.includes('matériel') || lower.includes('hardware') || lower.includes('ordinateur')) {
            type = 'CAPEX';
        } else if (lower.includes('licence') || lower.includes('cloud') || lower.includes('service') || lower.includes('maintenance')) {
            type = 'OPEX';
        } else {
            // Fallback sur le montant si ambigu
            type = amountVal > 5000 ? 'CAPEX' : 'OPEX';
        }

        return { type, icon, iconBg };
    };

    const getFinanceTypeFromCategory = (category: string): FinanceExpenseType => {
        const lower = category.toLowerCase();
        if (lower.includes('licence') || lower.includes('software')) return 'License';
        if (lower.includes('cloud') || lower.includes('hosting') || lower.includes('infrastructure')) return 'Cloud';
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
            { id: '2', category: 'Licences Logiciel', amount: '' }
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
        setBudgetLines(prev => [...prev, { id: Date.now().toString(), category: '', amount: '' }]);
    };

    const removeLine = (id: string) => {
        setBudgetLines(prev => prev.filter(line => line.id !== id));
    };

    const updateLine = (id: string, field: keyof BudgetLine, value: string) => {
        setBudgetLines(prev => prev.map(line => line.id === id ? { ...line, [field]: value } : line));
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
                setBudgetLines(extracted.lines.map((line, index) => ({
                    id: `${Date.now()}_${index}`,
                    category: line.category,
                    amount: line.amount,
                })));
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
            showToast("Le budget total ne peut pas être nul.", "error");
            return;
        }
        const emptyLines = budgetLines.filter(l => !l.category || !l.amount);
        if (emptyLines.length > 0) {
            showToast("Veuillez remplir toutes les lignes ou les supprimer.", "error");
            return;
        }

        const budgetYear = Number(year) || new Date().getFullYear();
        const existingBudget = financeBudgets.find(budget => budget.year === budgetYear);
        const existingSpentByCategory = new Map(
            (existingBudget?.items || []).map(item => [item.category, item.spent]),
        );

        const normalizedItems: FinanceBudget['items'] = budgetLines.map((line) => {
            const allocated = Number(line.amount) || 0;
            const existingSpent = existingSpentByCategory.get(line.category) || 0;

            return {
                category: line.category,
                type: getFinanceTypeFromCategory(line.category),
                allocated,
                spent: Math.min(existingSpent, allocated),
            };
        });

        upsertFinanceBudget({
            year: budgetYear,
            status: budgetYear < new Date().getFullYear() ? 'Clôturé' : 'En cours',
            totalAllocated: normalizedItems.reduce((acc, item) => acc + item.allocated, 0),
            items: normalizedItems,
            sourceFileName: importedFile?.name,
        });

        showToast(`Budget ${year} de ${formatCurrency(totalBudget, settings.currency)} enregistré avec succès.`, "success");
        handleClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={handleClose}>Annuler</Button>
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
            <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-low p-2">
                <SegmentedButton
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleModeChange}
                    className="w-full"
                />
            </div>

            {mode === 'import' && (
                <div className="min-h-[350px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {!isProcessing ? (
                        <div className="w-full space-y-4">
                            <FileDropzone
                                onFileSelect={startImportProcess}
                                accept=".xlsx,.xls,.csv,.txt,.pdf,.jpg,.jpeg,.png,.webp"
                                label="Importer votre fichier Budget"
                                subLabel={"L'IA détectera automatiquement les colonnes Catégorie, Montant et Année."}
                                className="w-full h-72 border-outline-variant hover:border-tertiary hover:bg-tertiary-container/10"
                            />
                            <div className="flex gap-2 justify-center">
                                <span className="text-label-small font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded-md">.XLSX</span>
                                <span className="text-label-small font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded-md">.CSV</span>
                                <span className="text-label-small font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded-md">.PDF</span>
                                <span className="text-label-small font-bold bg-surface-container text-on-surface-variant px-2 py-1 rounded-md">.JPG/.PNG</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full max-w-sm">
                            <div className="flex items-center gap-4 mb-6 w-full">
                                <div className="w-12 h-12 bg-surface border border-outline-variant rounded-lg flex items-center justify-center shadow-elevation-1">
                                    <MaterialIcon name="table_chart" size={24} className="text-tertiary" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                                        <div className="h-full bg-tertiary animate-[width_2s_var(--tk-motion-easing-emphasized)_infinite]" style={{ width: '60%' }} />
                                    </div>
                                    <div className="flex justify-between text-label-medium text-on-surface-variant font-bold">
                                        <span>Analyse structurelle...</span>
                                        <span>60%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full bg-surface-container rounded-xl p-4 border border-outline-variant text-left space-y-2">
                                <p className="text-label-medium font-bold text-on-surface-variant uppercase tracking-widest mb-2">Journal de traitement</p>
                                <span className="animate-in fade-in slide-in-from-left-4 delay-100 flex items-center gap-2 text-body-medium text-on-surface-variant"><MaterialIcon name="check" size={12} className="text-tertiary" /> Fichier "{importedFile?.name}" chargé</span>
                                <span className="animate-in fade-in slide-in-from-left-4 delay-500 flex items-center gap-2 text-body-medium text-on-surface-variant"><MaterialIcon name="check" size={12} className="text-tertiary" /> Détection de l'exercice fiscal</span>
                                <span className="animate-in fade-in slide-in-from-left-4 delay-1000 flex items-center gap-2 text-body-medium text-on-surface-variant"><MaterialIcon name="progress_activity" size={12} className="animate-spin text-primary" /> Extraction des lignes budgétaires...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'manual' && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    {importedFile && (
                        <div className="bg-tertiary-container border border-tertiary/20 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-tertiary/20 rounded-lg text-on-tertiary-container"><MaterialIcon name="auto_awesome" size={16} /></div>
                                <div>
                                    <p className="text-label-medium font-bold text-on-tertiary-container uppercase">Données pré-remplies par IA</p>
                                    <p className="text-body-small text-tertiary">Vérifiez les montants ci-dessous.</p>
                                    {importMeta && (
                                        <p className="text-label-small text-on-tertiary-container/80 mt-0.5">
                                            Confiance: {importMeta.confidence === 'high' ? 'elevee' : importMeta.confidence === 'medium' ? 'moyenne' : 'faible'}
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
                        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant">
                            {importMeta.warnings[0]}
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
                                Je confirme avoir verifie manuellement l'annee, les categories et les montants.
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
                                icon={<MaterialIcon name="calendar_today" size={16} />}
                                className="font-bold"
                                required
                            />
                        </div>
                        <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant flex justify-between items-center h-[54px]">
                            <span className="text-label-large font-bold text-on-surface-variant pl-2">Budget Global Calculé</span>
                            <span className="text-title-large font-black text-on-surface pr-2">{formatCurrency(totalBudget, settings.currency)}</span>
                        </div>
                    </div>

                    {/* Table Container exactly like Finance Detail List */}
                    <div className="bg-surface rounded-xl shadow-elevation-1 border border-outline-variant overflow-hidden">
                        {isCompact ? (
                            <div className="divide-y divide-outline-variant">
                                {budgetLines.map((line) => {
                                    const details = getCategoryDetails(line.category, line.amount);
                                    return (
                                        <div key={line.id} className="p-4 space-y-3">
                                            <div className="flex items-end gap-3">
                                                <div className={cn('p-2 rounded-lg shrink-0 mb-1', details.iconBg)}>
                                                    {details.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <SelectField
                                                        name={`cat-${line.id}`}
                                                        label="Catégorie"
                                                        options={categoryOptions}
                                                        value={line.category}
                                                        onChange={(e) => updateLine(line.id, 'category', e.target.value)}
                                                        placeholder="Choisir une catégorie..."
                                                        className="w-full"
                                                    />
                                                </div>
                                                <IconButton
                                                    icon="delete"
                                                    variant="standard"
                                                    aria-label="Supprimer la ligne budgétaire"
                                                    onClick={() => removeLine(line.id)}
                                                    className="shrink-0 mb-1 text-on-surface-variant hover:text-error hover:bg-error-container"
                                                />
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <InputField
                                                        label="Montant alloué"
                                                        type="number"
                                                        value={line.amount}
                                                        onChange={(e) => updateLine(line.id, 'amount', e.target.value)}
                                                        aria-label={`Montant pour ${line.category || 'la ligne budgétaire'}`}
                                                        placeholder="0.00"
                                                        prefix={settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'XOF' : '€'}
                                                        className="py-2 text-right font-mono font-bold bg-surface-container-low"
                                                    />
                                                </div>
                                                {line.category ? (
                                                    <Badge
                                                        variant={details.type === 'CAPEX' ? 'info' : 'warning'}
                                                        className="shrink-0 mb-2"
                                                    >
                                                        {details.type}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}

                                {budgetLines.length === 0 && (
                                    <p className="px-6 py-8 text-center text-on-surface-variant italic text-body-medium">
                                        Aucune ligne budgétaire.
                                    </p>
                                )}
                            </div>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-body-medium text-left">
                                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-small tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Catégorie</th>
                                        <th className="px-6 py-4 w-48 text-right">Montant Alloué</th>
                                        <th className="px-6 py-4 text-center w-32">Type (IA)</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant bg-surface">
                                    {budgetLines.map((line) => {
                                        const details = getCategoryDetails(line.category, line.amount);
                                        return (
                                            <tr key={line.id} className="hover:bg-surface-container/50 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className={cn("p-2 rounded-lg shrink-0", details.iconBg)}>
                                                            {details.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-[200px]">
                                                            <SelectField
                                                                name={`cat-${line.id}`}
                                                                options={categoryOptions}
                                                                value={line.category}
                                                                onChange={(e) => updateLine(line.id, 'category', e.target.value)}
                                                                placeholder="Choisir une catégorie..."
                                                                className="mb-0 w-full border-none bg-transparent hover:bg-transparent px-0 py-0 h-auto"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-label-medium">{settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'XOF' : '€'}</span>
                                                        <InputField
                                                            type="number"
                                                            value={line.amount}
                                                            onChange={(e) => updateLine(line.id, 'amount', e.target.value)}
                                                            aria-label={`Montant pour ${line.category || 'la ligne budgétaire'}`}
                                                            placeholder="0.00"
                                                            className="py-2 pr-4 pl-8 text-right font-mono font-bold bg-surface-container-low"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {line.category ? (
                                                        <Badge variant={details.type === 'CAPEX' ? 'info' : 'warning'}>
                                                            {details.type}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-on-surface-variant text-body-small">-</span>
                                                    )}
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
                                                                ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                                                                : 'opacity-100'
                                                        )}
                                                        title="Supprimer la ligne"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {budgetLines.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant italic text-body-medium">
                                                Aucune ligne budgétaire.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        )}

                        <div className="p-2 border-t border-outline-variant">
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={addLine}
                                className="w-full border-dashed"
                                icon={<MaterialIcon name="add" size={16} />}
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

