import React, { useState, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { FileCsv, Check, Keyboard, Plus } from '@phosphor-icons/react';
import { FullScreenLayout } from '../../../components/layout/FullScreenLayout';
import { FormNote, FormSection } from '../../../components/ui/FormParts';
import { COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import IconButton from '../../../components/ui/IconButton';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/financial';
import { FinanceBudget, FinanceExpenseType } from '../../../types';
import { ExtractedBudgetDraft, extractBudgetDraftFromFile } from '../../../lib/budgetExtraction';

interface AddBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BudgetLine {
    /**
     * **L'identité d'une ligne en cours de saisie.** Elle sert de clé de rendu, et c'est
     * par elle que « retirer » et « modifier » désignent leur ligne : deux enveloppes
     * peuvent porter le même nom tant qu'on les tape. Le champ était **écrit partout et
     * déclaré nulle part** — six créations le posaient, trois lectures s'en servaient.
     */
    id: string;
    category: string;
    amount: string;
    /**
     * **`type` a été retiré.** Il était posé sur les trois lignes de départ et jamais
     * relu : à l'enregistrement, la nature se **recalcule** de la catégorie
     * (`getFinanceTypeFromCategory`). Deux sources pour un même fait, dont une morte.
     */
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

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const { settings } = useData();
    const { financeBudgets, upsertFinanceBudget } = useFinanceData();

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

    /*
      **Les trois lignes de départ n'avaient pas d'identité**, et `id` sert de clé de
      rendu *et* de désignation à « retirer » et « modifier » : `removeLine(undefined)`
      ne filtrait rien, `updateLine(undefined)` ne trouvait personne, et React recevait
      trois clés `undefined` côte à côte. Le formulaire s'ouvrait donc sur trois lignes
      qu'on ne pouvait ni corriger ni supprimer.
    */
    /* Une ligne vide, pas trois lignes d'exemple chiffrées (24/09) : 25 000, 12 000 et
       8 000 arrivaient pré-remplis et passaient pour un budget. */
    const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([
        { id: 'depart', category: '', amount: '' },
    ]);

    const totalBudget = useMemo(() => {
        return budgetLines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);
    }, [budgetLines]);

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
        setBudgetLines([{ id: 'depart', category: '', amount: '' }]);
    };

    const handleClose = () => {
        reset();
        onClose();
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

    const categoryOptions = [
        { value: 'Matériel IT', label: 'Matériel IT' },
        { value: 'Licences Logiciel', label: 'Licences Logiciel' },
        { value: 'Cloud Infrastructure', label: 'Cloud Infrastructure' },
        { value: 'Maintenance & Services', label: 'Maintenance & Services' },
        { value: 'Consulting', label: 'Consulting & Audit' },
        { value: 'Formation', label: 'Formation' },
        { value: 'Autre', label: 'Autre' },
    ];

    if (!isOpen) return null;

    const enRevue = mode === 'manual';

    /*
      **Lire un budget — un formulaire plein écran, pas une boîte** (24/09). La boîte de
      896 px portait des onglets « Import fichier | Saisie manuelle », un bandeau « Données
      pré-remplies par IA » en capitales avec sa confiance, un tableau à en-têtes espacés
      et trois lignes d'exemple chiffrées. Elle prend la coque des formulaires : au bureau,
      deux colonnes — la lecture et l'exercice à gauche, les lignes à droite —, au
      téléphone une seule. Ce qui a été lu arrive rempli ; rien ne s'écrit avant « Créer ».
    */
    return (
        <FullScreenLayout
            title="Lire un budget"
            onBack={handleClose}
            onClose={handleClose}
            className="bg-background"
            mesure="double"
            headerActions={
                enRevue ? (
                    <Button
                        variant="text"
                        onClick={handleSubmit}
                        disabled={requiresLowConfidenceReview && !isLowConfidenceReviewed}
                        className="text-on-surface text-ts-body h-12 px-3 font-medium"
                    >
                        Créer l’exercice
                    </Button>
                ) : undefined
            }
        >
            {!enRevue ? (
                <div className="mx-auto flex max-w-[560px] flex-col gap-4">
                    {isProcessing ? (
                        <FormSection title="Lecture en cours">
                            <div className="flex min-h-14 items-center gap-3">
                                <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={FileCsv} size={20} />
                                </span>
                                <span className="text-on-surface text-ts-body leading-ts-body min-w-0 flex-1 truncate font-medium">
                                    {importedFile?.name}
                                </span>
                            </div>
                            <div
                                className="bg-surface-container h-1 overflow-hidden rounded-full"
                                role="progressbar"
                                aria-label="Lecture du budget"
                            >
                                <div className="bg-on-surface h-full w-1/3 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full" />
                            </div>
                            <div className="flex flex-col gap-3">
                                {['Exercice', 'Postes', 'Montants'].map((label) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub w-[110px] shrink-0">
                                            {label}
                                        </span>
                                        <span className="bg-surface-container h-4 min-w-0 flex-1 rounded-[2px]" />
                                    </div>
                                ))}
                            </div>
                        </FormSection>
                    ) : (
                        <FormSection title="Le fichier" caption="tableur, PDF ou photo">
                            <FileDropzone
                                onFileSelect={startImportProcess}
                                accept=".xlsx,.xls,.csv,.txt,.pdf,.jpg,.jpeg,.png,.webp"
                                label="Déposer le budget"
                                subLabel="L'année, les postes et leurs montants arrivent remplis ; ce qui est mal lu arrive vide."
                            />
                            <Button
                                variant="text"
                                icon={<Icon glyph={Keyboard} size={20} />}
                                onClick={() => setMode('manual')}
                                className="self-start"
                            >
                                Saisir à la main
                            </Button>
                        </FormSection>
                    )}
                </div>
            ) : (
                <div className={cn('flex flex-col gap-4', COLONNES_FORMULAIRE)}>
                    {importedFile && (
                        <FormSection title="La lecture">
                            <div className="flex min-h-14 items-center gap-3">
                                <span className="bg-tint-vert text-on-tint-vert flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={Check} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                        {importedFile.name}
                                    </span>
                                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block">
                                        {budgetLines.length} ligne
                                        {budgetLines.length > 1 ? 's' : ''} lue
                                        {budgetLines.length > 1 ? 's' : ''} · à relire
                                    </span>
                                </span>
                                <Button
                                    variant="text"
                                    onClick={() => {
                                        reset();
                                    }}
                                    className="text-ts-control shrink-0 font-medium"
                                >
                                    Changer
                                </Button>
                            </div>
                            {importMeta?.warnings?.length ? (
                                <FormNote>{importMeta.warnings[0]}</FormNote>
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
                                    <span>J'ai relu l'année, les postes et les montants.</span>
                                </label>
                            ) : null}
                        </FormSection>
                    )}

                    <FormSection title="L'exercice">
                        <InputField
                            label="Année"
                            name="annee"
                            inputMode="numeric"
                            mesure="courte"
                            value={year}
                            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            required
                        />
                        <div className="border-outline-variant border-t pt-4">
                            <p className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                                Enveloppe, somme des lignes
                            </p>
                            <p className="mt-1 flex items-baseline gap-2">
                                <b className="font-brand text-on-surface text-ts-page leading-ts-page font-semibold tracking-[-0.02em] tabular-nums">
                                    {formatCurrency(
                                        totalBudget,
                                        settings.currency,
                                        settings.compactNotation,
                                    )}
                                </b>
                            </p>
                        </div>
                    </FormSection>

                    <FormSection
                        title="Les lignes"
                        caption={`${budgetLines.length} poste${budgetLines.length > 1 ? 's' : ''}`}
                    >
                        <div className="flex flex-col">
                            {budgetLines.map((line, index) => (
                                <div
                                    key={line.id}
                                    className="border-outline-variant flex flex-col gap-3 border-t py-4 first:border-t-0 first:pt-0"
                                >
                                    <div className="flex items-end gap-2">
                                        <div className="min-w-0 flex-1">
                                            <SelectField
                                                name={`cat-${line.id}`}
                                                label={`Poste ${index + 1}`}
                                                options={categoryOptions}
                                                value={line.category}
                                                onChange={(e) =>
                                                    updateLine(line.id, 'category', e.target.value)
                                                }
                                                placeholder="Choisir un poste"
                                            />
                                        </div>
                                        <IconButton
                                            icon="delete"
                                            variant="standard"
                                            aria-label={`Retirer le poste ${index + 1}`}
                                            onClick={() => removeLine(line.id)}
                                            className="text-on-surface-variant hover:text-error shrink-0"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField
                                            label="Montant"
                                            name={`montant-${line.id}`}
                                            inputMode="decimal"
                                            value={line.amount}
                                            onChange={(e) =>
                                                updateLine(line.id, 'amount', e.target.value)
                                            }
                                            placeholder="0"
                                            suffix={settings.currency}
                                            className="tabular-nums"
                                        />
                                        <SelectField
                                            name={`cap-${line.id}`}
                                            label="Nature"
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
                                        />
                                    </div>
                                </div>
                            ))}
                            {budgetLines.length === 0 && (
                                <FormNote>Aucune ligne : ajoutez le premier poste.</FormNote>
                            )}
                        </div>
                        <Button
                            variant="outlined"
                            icon={<Icon glyph={Plus} size={20} />}
                            onClick={addLine}
                            className="w-full"
                        >
                            Ajouter un poste
                        </Button>
                    </FormSection>
                </div>
            )}
        </FullScreenLayout>
    );
};
