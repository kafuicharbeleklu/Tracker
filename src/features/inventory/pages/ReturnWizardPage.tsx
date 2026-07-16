import React, { useState, useRef, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Equipment } from '../../../types';
import Pagination from '../../../components/ui/Pagination';
import { WizardLayout, WizardStep } from '../../../components/layout/WizardLayout';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import { TextArea } from '../../../components/ui/TextArea';
import InputField from '../../../components/ui/InputField';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { formatDate } from '../../../lib/financial';
import IconButton from '../../../components/ui/IconButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import Chip from '../../../components/ui/Chip';
import { cn } from '../../../lib/utils';
import DemoBadge from '../../../components/ui/DemoBadge';
import { EntityRow } from '../../../components/ui/EntityRow';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { getEquipmentUpdatesForReturnWorkflow } from '../../../lib/businessRules';

const ITEMS_PER_PAGE = 5;

type ReturnCondition = 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais';
type ValidationMethod = 'fingerprint' | 'pin' | 'face' | 'signature';

const ReturnWizardPage: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({ onCancel, onComplete }) => {
    const [accessories, setAccessories] = useState<string[]>([]);
    const { equipment, updateEquipment } = useData();
    const { user: actor } = useAccessControl();
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [condition, setCondition] = useState<ReturnCondition>('Excellent');
    const [comment, setComment] = useState('');
    const [validationMethod, setValidationMethod] = useState<ValidationMethod | null>(null);
    const [isValidated, setIsValidated] = useState(false);
    const [validatedBy, setValidatedBy] = useState<ValidationMethod | null>(null);
    const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

    // X4 : navigation aux flèches du radiogroup « état du retour » (même ordre que les cartes rendues)
    const conditionOrder: ReturnCondition[] = ['Excellent', 'Bon', 'Moyen', 'Mauvais'];
    const handleConditionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (conditionOrder.indexOf(condition) + delta + conditionOrder.length) % conditionOrder.length;
        setCondition(conditionOrder[nextIndex]);
        e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus();
    };

    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const autoAdvanceTimerRef = useRef<number | null>(null);

    const filteredEquipment = equipment
        .filter(e => e.status === 'Attribué' || e.assignmentStatus === 'PENDING_RETURN')
        .filter(e => e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) || e.assetId.toLowerCase().includes(equipmentSearch.toLowerCase()));

    const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
    const paginatedEquipment = filteredEquipment.slice((equipmentPage - 1) * ITEMS_PER_PAGE, equipmentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setEquipmentPage(1);
    }, [equipmentSearch]);

    useEffect(() => {
        return () => {
            if (autoAdvanceTimerRef.current) {
                window.clearTimeout(autoAdvanceTimerRef.current);
            }
        };
    }, []);

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else if (selectedEquipment) {
            const nowISO = new Date().toISOString();
            const isInspectionPhase = selectedEquipment.assignmentStatus === 'PENDING_RETURN';

            if (!isInspectionPhase) {
                const initiationUpdates = getEquipmentUpdatesForReturnWorkflow({
                    phase: 'initiation',
                    actorId: actor?.id,
                    nowISO,
                });

                updateEquipment(selectedEquipment.id, {
                    ...initiationUpdates,
                    notes: `${selectedEquipment.notes || ''}\n[DEMANDE RETOUR ${formatDate()}] ${comment.trim() || 'Aucun commentaire'}`,
                }, {
                    source: 'return_wizard',
                    stage: 'initiation',
                    comment: comment.trim() || undefined,
                    requestedBy: actor?.id || 'system',
                });

                showToast(`Restitution initiée : ${selectedEquipment.name}`, 'success');
                onComplete();
                return;
            }

            const inspectionUpdates = getEquipmentUpdatesForReturnWorkflow({
                phase: 'inspection',
                condition,
                actorId: actor?.id,
                nowISO,
            });

            updateEquipment(selectedEquipment.id, {
                ...inspectionUpdates,
                operationalStatus: 'Actif',
                notes: `${selectedEquipment.notes || ''}\n[INSPECTION RETOUR ${formatDate()}] État: ${condition}${comment ? ` - ${comment}` : ''}`,
            }, {
                condition,
                accessories: accessories.join(', '),
                comment: comment.trim() || undefined,
                previousUser: selectedEquipment.user?.name || null,
                source: 'return_wizard',
                stage: 'inspection',
            });

            showToast(`Retour clôturé : ${selectedEquipment.name}`, 'success');
            onComplete();
        }
    };

    const toggleAccessory = (acc: string) => {
        setAccessories(prev =>
            prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]
        );
    };

    const validationMethodLabels: Record<ValidationMethod, string> = {
        face: 'Face ID',
        signature: 'Signature',
        fingerprint: 'Empreinte',
        pin: 'Code PIN',
    };

    const completeValidation = (method: ValidationMethod) => {
        setValidatedBy(method);
        setValidationMethod(null);
        setIsValidated(true);
        setIsAutoAdvancing(true);

        if (autoAdvanceTimerRef.current) {
            window.clearTimeout(autoAdvanceTimerRef.current);
        }

        autoAdvanceTimerRef.current = window.setTimeout(() => {
            setIsAutoAdvancing(false);
            setStep(4);
        }, 900);
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value !== '' && index < 5) pinRefs.current[index + 1]?.focus();
        if (index === 5 && value !== '') {
            window.setTimeout(() => completeValidation('pin'), 250);
        }
    };

    const handleEquipmentSelect = (item: Equipment) => {
        setSelectedEquipment(item);
        setStep(2);
    };

    const wizardSteps = [
        { id: 1, title: 'Sélection' },
        { id: 2, title: 'État' },
        { id: 3, title: 'Validation' },
        { id: 4, title: 'Synthèse' },
    ];

    const conditionMetadata: Record<ReturnCondition, {
        description: string;
        recommendation: string;
        destination: string;
        finalStatus: string;
    }> = {
        Excellent: {
            description: 'Équipement comme neuf, sans anomalie visible.',
            recommendation: 'Retour direct au stock IT.',
            destination: 'Stock IT',
            finalStatus: 'Disponible',
        },
        Bon: {
            description: 'Usure normale, matériel pleinement exploitable.',
            recommendation: 'Retour stock avec contrôle standard.',
            destination: 'Stock IT',
            finalStatus: 'Disponible',
        },
        Moyen: {
            description: 'Usure marquée ou défaut mineur constaté.',
            recommendation: 'Contrôle technique recommandé avant réattribution.',
            destination: 'Stock IT',
            finalStatus: 'Disponible',
        },
        Mauvais: {
            description: 'Dommage important ou panne fonctionnelle.',
            recommendation: 'Description détaillée requise pour ouvrir la maintenance.',
            destination: 'Maintenance',
            finalStatus: 'En réparation',
        },
    };

    const activeCondition = conditionMetadata[condition];
    const trimmedComment = comment.trim();
    const commentMinLength = 8;
    const requiresDetailedComment = condition === 'Mauvais';
    const canProceedFromStateStep = !requiresDetailedComment || trimmedComment.length >= commentMinLength;
    const isInspectionFlow = selectedEquipment?.assignmentStatus === 'PENDING_RETURN';

    const conditionBadgeClass =
        condition === 'Excellent'
            ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/30'
            : condition === 'Bon'
                ? 'bg-secondary-container text-on-secondary-container border-secondary/30'
                : condition === 'Moyen'
                    ? 'bg-primary-container text-on-primary-container border-primary/30'
                    : 'bg-error-container text-on-error-container border-error/30';

    return (
        <WizardLayout
            title="Retourner un équipement"
            currentStep={step}
            steps={wizardSteps}
            onClose={onCancel}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            actions={
                <div className="flex gap-3">
                    {(step === 2 || step === 4) && (
                        <Button onClick={handleNext} disabled={(step === 2 && !canProceedFromStateStep) || (step === 3 && !isValidated)}>
                            {step === 4
                                ? (isInspectionFlow ? 'Clôturer le retour' : 'Initier la restitution')
                                : 'Suivant'}
                        </Button>
                    )}
                </div>
            }
        >
            {step === 1 && (
                <WizardStep>
                    <div className="mb-6">
                        <SearchFilterBar
                            searchValue={equipmentSearch}
                            onSearchChange={setEquipmentSearch}
                            placeholder="Rechercher l'équipement à retourner..."
                            resultCount={filteredEquipment.length}
                        />
                    </div>
                    <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden min-h-[400px]">
                        {paginatedEquipment.length > 0 ? (
                        paginatedEquipment.map(item => (
                            <EntityRow
                                key={item.id}
                                image={item.image}
                                title={item.name}
                                subtitle={
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="shrink-0 font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-xs border border-outline-variant text-label-small">
                                            {item.assetId}
                                        </span>
                                        <span className="min-w-0 truncate text-on-surface-variant text-label-small">
                                            {item.user ? `• ${item.user.name}` : ''}
                                        </span>
                                    </div>
                                }
                                status={<StatusBadge status={item.assignmentStatus === 'PENDING_RETURN' ? 'PENDING_RETURN' : item.status} size="sm" />}
                                selected={selectedEquipment?.id === item.id}
                                onClick={() => handleEquipmentSelect(item)}
                            />
                        ))
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon="inventory_2"
                                title="Aucun équipement à retourner"
                                description={equipmentSearch
                                    ? "Aucun équipement ne correspond à votre recherche."
                                    : "Aucun équipement attribué ou en cours de restitution."}
                            />
                        </div>
                    )}
                    </div>
                    {filteredEquipment.length > 0 && <Pagination currentPage={equipmentPage} totalPages={totalPages} onPageChange={setEquipmentPage} className="mt-6" />}
                </WizardStep>
            )}

            {step === 2 && (
                <WizardStep>
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-5">
                            <h3 className="text-headline-small text-on-surface tracking-tight">Vérification de l'état</h3>
                            <p className="text-on-surface-variant text-body-medium mt-1">
                                Qualifiez précisément l'état du matériel avant validation du retour.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 expanded:grid-cols-12 gap-6 items-start">
                            <div className="expanded:col-span-8 space-y-4">
                                <div
                                    role="radiogroup"
                                    aria-label="État du retour"
                                    onKeyDown={handleConditionKeyDown}
                                    className="grid grid-cols-1 medium:grid-cols-2 gap-3"
                                >
                                    {[
                                        {
                                            value: 'Excellent' as ReturnCondition,
                                            icon: 'star',
                                            description: 'Comme neuf',
                                            selectedState: 'border-tertiary !bg-tertiary-container shadow-elevation-2',
                                            hoverState: 'hover:!border-tertiary',
                                            selectedIconState: 'bg-tertiary text-on-tertiary',
                                            hoverIconState: 'group-hover:text-tertiary'
                                        },
                                        {
                                            value: 'Bon' as ReturnCondition,
                                            icon: 'thumb_up',
                                            description: 'Usure normale',
                                            selectedState: 'border-secondary !bg-secondary-container shadow-elevation-2',
                                            hoverState: 'hover:!border-secondary',
                                            selectedIconState: 'bg-secondary text-on-secondary',
                                            hoverIconState: 'group-hover:text-secondary'
                                        },
                                        {
                                            value: 'Moyen' as ReturnCondition,
                                            icon: 'error',
                                            description: 'Rayures / Usé',
                                            selectedState: 'border-primary !bg-primary-container shadow-elevation-2',
                                            hoverState: 'hover:!border-primary',
                                            selectedIconState: 'bg-primary text-on-primary',
                                            hoverIconState: 'group-hover:text-primary'
                                        },
                                        {
                                            value: 'Mauvais' as ReturnCondition,
                                            icon: 'cancel',
                                            description: 'Endommagé / HS',
                                            selectedState: 'border-error !bg-error-container shadow-elevation-2',
                                            hoverState: 'hover:!border-error',
                                            selectedIconState: 'bg-error text-on-error',
                                            hoverIconState: 'group-hover:text-error'
                                        }
                                    ].map(option => {
                                        const isSelected = condition === option.value;
                                        return (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant="outlined"
                                                role="radio"
                                                aria-checked={isSelected}
                                                tabIndex={isSelected ? 0 : -1}
                                                onClick={() => setCondition(option.value)}
                                                className={cn(
                                                    'h-auto w-full !rounded-md !border-2 !px-4 !py-4 !text-on-surface !transition-all !duration-short4 !ease-emphasized !justify-start !items-center text-left group',
                                                    isSelected
                                                        ? option.selectedState
                                                        : `!border-outline-variant !bg-surface ${option.hoverState}`
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-short4 shrink-0',
                                                    isSelected
                                                        ? option.selectedIconState
                                                        : `bg-surface-container-highest text-on-surface-variant ${option.hoverIconState}`
                                                )}>
                                                    <MaterialIcon name={option.icon} size={22} className={option.value === 'Excellent' && isSelected ? 'fill-current' : ''} />
                                                </div>
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <h4 className="text-label-large text-on-surface leading-tight">{option.value}</h4>
                                                    <p className="text-body-small text-on-surface-variant mt-0.5">{option.description}</p>
                                                </div>
                                                {isSelected && <MaterialIcon name="check_circle" size={18} className="text-primary shrink-0" />}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-on-surface text-label-large">
                                            <MaterialIcon name="chat" size={16} className="text-primary" />
                                            <span>Commentaires / Observations</span>
                                        </div>
                                        {requiresDetailedComment && (
                                            <span className="px-2 py-0.5 rounded-full text-label-small bg-error-container text-on-error-container border border-error/30">
                                                Requis
                                            </span>
                                        )}
                                    </div>

                                    <TextArea
                                        label=""
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Précisez les dommages éventuels ou les pièces manquantes..."
                                        className={cn(
                                            'bg-surface-container-lowest',
                                            requiresDetailedComment && !canProceedFromStateStep && 'border-error focus:border-error'
                                        )}
                                        rows={4}
                                    />

                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-body-small text-on-surface-variant">
                                            {requiresDetailedComment
                                                ? `Décrivez le dommage (minimum ${commentMinLength} caractères).`
                                                : 'Ajoutez un commentaire si nécessaire (optionnel).'}
                                        </p>
                                        <span className={cn(
                                            'text-label-small',
                                            requiresDetailedComment && !canProceedFromStateStep ? 'text-error' : 'text-on-surface-variant'
                                        )}>
                                            {trimmedComment.length}{requiresDetailedComment ? `/${commentMinLength}` : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-surface-container-low rounded-card p-4 border border-outline-variant">
                                    <h4 className="text-label-large text-on-surface mb-3 flex items-center gap-2">
                                        <MaterialIcon name="category" size={18} className="text-secondary" />
                                        Accessoires restitués
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {['Câble d\'alimentation', 'Chargeur', 'Sacoche', 'Souris', 'Clavier', 'Autre'].map(acc => (
                                            <Chip
                                                key={acc}
                                                label={acc}
                                                variant="filter"
                                                selected={accessories.includes(acc)}
                                                onClick={() => toggleAccessory(acc)}
                                                className="h-9"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="expanded:col-span-4">
                                <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-4 space-y-4 expanded:sticky expanded:top-4">
                                    <h4 className="text-title-medium text-on-surface">Impact du retour</h4>

                                    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-label-small uppercase', conditionBadgeClass)}>
                                        <MaterialIcon name="verified" size={14} />
                                        État: {condition}
                                    </div>

                                    <p className="text-body-small text-on-surface-variant leading-relaxed">{activeCondition.description}</p>

                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-body-small text-on-surface-variant">Destination</span>
                                            <span className="text-label-large text-on-surface">{activeCondition.destination}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-body-small text-on-surface-variant">Statut final</span>
                                            <span className="text-label-large text-on-surface">{activeCondition.finalStatus}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-body-small text-on-surface-variant">Accessoires</span>
                                            <span className="text-label-large text-on-surface">{accessories.length}</span>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-low rounded-md border border-outline-variant p-3">
                                        <p className="text-label-small text-on-surface-variant uppercase mb-1">Recommandation</p>
                                        <p className="text-body-small text-on-surface">{activeCondition.recommendation}</p>
                                    </div>

                                    {requiresDetailedComment && !canProceedFromStateStep && (
                                        <div className="bg-error-container rounded-md border border-error/30 p-3">
                                            <p className="text-label-small text-on-error-container">
                                                Ajoutez un commentaire détaillé pour continuer.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </WizardStep>
            )}
            {step === 3 && (
                <WizardStep>
                    <div className="min-h-[450px] flex flex-col items-center justify-center">
                        <div className="w-full max-w-2xl mb-6 rounded-md border border-outline-variant bg-surface-container-low p-4">
                            <div className="flex items-center gap-2">
                                <p className="text-title-medium text-on-surface">Validation d'identité administrateur</p>
                                <DemoBadge
                                    label="Simulation"
                                    className="ml-auto"
                                    title="Étape de démonstration — aucune vérification biométrique ou PIN réelle n'est effectuée"
                                />
                            </div>
                            <p className="text-body-small text-on-surface-variant mt-1">
                                Vérifiez l'identité avant de confirmer le retour du matériel.
                            </p>
                        </div>

                        {!validationMethod && !isValidated && (
                            <div className="grid grid-cols-1 medium:grid-cols-2 gap-4 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    {
                                        key: 'signature',
                                        icon: 'edit',
                                        title: 'Signature',
                                        description: 'Validation manuscrite',
                                        iconClass: 'text-tertiary',
                                        action: () => setValidationMethod('signature')
                                    },
                                    {
                                        key: 'fingerprint',
                                        icon: 'fingerprint',
                                        title: 'Empreinte',
                                        description: 'Validation instantanée',
                                        iconClass: 'text-error',
                                        action: () => completeValidation('fingerprint')
                                    },
                                    {
                                        key: 'pin',
                                        icon: 'key',
                                        title: 'Code PIN',
                                        description: 'Saisie manuelle',
                                        iconClass: 'text-secondary',
                                        action: () => {
                                            setPin(['', '', '', '', '', '']);
                                            setValidationMethod('pin');
                                        }
                                    }
                                ].map(option => (
                                    <Button
                                        key={option.key}
                                        type="button"
                                        variant="outlined"
                                        onClick={option.action}
                                        className="h-auto w-full !rounded-md !border !border-outline-variant !bg-surface !px-6 !py-5 !text-on-surface !justify-start !items-center !text-left group hover:!border-primary hover:!shadow-elevation-2"
                                    >
                                        <MaterialIcon name={option.icon} size={28} className={cn(option.iconClass, "mr-4 group-hover:scale-110 transition-transform")} />
                                        <div className="flex-1">
                                            <h3 className="text-label-large text-on-surface mb-0.5">{option.title}</h3>
                                            <p className="text-body-small text-on-surface-variant">{option.description}</p>
                                        </div>
                                        <MaterialIcon name="chevron_right" size={18} className="text-outline group-hover:text-primary" />
                                    </Button>
                                ))}
                            </div>
                        )}

                        {validationMethod === 'signature' && (
                            <div className="bg-surface-container-lowest rounded-md p-10 text-center w-full max-w-lg shadow-elevation-5 animate-in zoom-in-95 border border-outline-variant">
                                <h3 className="text-title-large text-on-surface mb-6 flex items-center justify-center gap-2">
                                    <MaterialIcon name="edit" size={28} className="text-tertiary" /> Signature Admin
                                </h3>
                                <div className="border-2 border-dashed border-outline-variant rounded-md bg-surface-container-low h-48 mb-6 flex items-center justify-center cursor-crosshair group relative overflow-hidden">
                                    <span className="text-on-surface-variant/50 text-label-small uppercase tracking-widest group-hover:hidden transition-all">Signer ici pour valider</span>
                                    <IconButton
                                        icon="ink_eraser"
                                        size={16}
                                        variant="standard"
                                        aria-label="Effacer la signature"
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="absolute bottom-2 right-2 !w-8 !h-8 bg-surface-container-lowest rounded-sm shadow-elevation-1 text-on-surface-variant hover:!text-error"
                                    />
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <Button variant="text" onClick={() => setValidationMethod(null)}>Changer de méthode</Button>
                                    <Button onClick={() => completeValidation('signature')}>Valider la signature</Button>
                                </div>
                            </div>
                        )}

                        {validationMethod === 'pin' && (
                            <div className="bg-surface-container-lowest rounded-md p-10 text-center w-full max-w-md shadow-elevation-5 animate-in zoom-in-95 border border-outline-variant">
                                <div className="w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MaterialIcon name="lock" size={32} />
                                </div>
                                <h3 className="text-title-large text-on-surface mb-8">Code PIN requis</h3>
                                <div className="grid grid-cols-6 gap-3 mb-8 w-full max-w-[324px] mx-auto">
                                    {pin.map((digit, idx) => (
                                        <InputField
                                            key={idx}
                                            ref={el => { pinRefs.current[idx] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePinChange(idx, e.target.value)}
                                            aria-label={`Chiffre PIN ${idx + 1}`}
                                            className="h-14 !px-0 border-2 border-outline-variant rounded-md text-center text-headline-small focus:border-focus-ring focus:ring-2 focus:ring-focus-ring input-pin transition-all duration-short4"
                                        />
                                    ))}
                                </div>
                                <Button variant="text" onClick={() => setValidationMethod(null)}>Changer de méthode</Button>
                            </div>
                        )}

                        {isValidated && (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-500">
                                <div className="relative mb-2">
                                    <div className="w-20 h-20 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary z-10 relative shadow-elevation-3">
                                        <MaterialIcon name="check_circle" size={46} className="animate-in zoom-in duration-500 delay-200" />
                                    </div>
                                    <div className="absolute inset-0 bg-tertiary/20 rounded-full animate-ping"></div>
                                </div>
                                <h3 className="text-headline-small text-on-surface">Identité confirmée</h3>
                                <p className="text-on-surface-variant text-body-medium">
                                    Méthode utilisée: {validatedBy ? validationMethodLabels[validatedBy] : 'Validation sécurisée'}
                                </p>
                                {isAutoAdvancing ? (
                                    <div className="inline-flex items-center gap-2 text-label-medium text-on-surface-variant">
                                        <MaterialIcon name="progress_activity" size={16} className="animate-spin" />
                                        Redirection vers la synthèse...
                                    </div>
                                ) : (
                                    <Button onClick={() => setStep(4)}>Continuer</Button>
                                )}
                            </div>
                        )}
                    </div>
                </WizardStep>
            )}
            {step === 4 && selectedEquipment && (
                <WizardStep>
                    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 p-6">
                            <h3 className="text-headline-small text-on-surface">Synthèse du retour</h3>
                            <p className="text-body-medium text-on-surface-variant mt-1">
                                Confirmez les informations avant d'enregistrer le retour.
                            </p>

                            <div className="grid grid-cols-1 medium:grid-cols-2 gap-4 mt-6">
                                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                                    <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Équipement</p>
                                    <div className="flex items-start gap-3 mt-3">
                                        <div className="w-16 h-16 rounded-lg bg-surface border border-outline-variant flex items-center justify-center overflow-hidden">
                                            <img src={selectedEquipment.image} className="w-full h-full object-contain p-1.5" alt={selectedEquipment.name} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-title-medium text-on-surface truncate">{selectedEquipment.name}</p>
                                            <p className="text-body-small text-on-surface-variant mt-1 font-mono">{selectedEquipment.assetId}</p>
                                            <p className="text-label-small text-on-surface-variant mt-1">{selectedEquipment.user?.name || 'Utilisateur non renseigné'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                                    <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Décision de retour</p>
                                    <div className="space-y-2 mt-3">
                                        <p className="text-body-medium text-on-surface">
                                            État constaté: <span className="font-medium">{condition}</span>
                                        </p>
                                        {isInspectionFlow ? (
                                            <>
                                                <p className="text-body-medium text-on-surface">
                                                    Destination: <span className="font-medium">{condition === 'Mauvais' ? 'Maintenance' : 'Stock IT'}</span>
                                                </p>
                                                <p className="text-body-medium text-on-surface">
                                                    Statut final: <span className="font-medium">{condition === 'Mauvais' ? 'En réparation' : 'Disponible'}</span>
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-body-medium text-on-surface">
                                                    Destination: <span className="font-medium">Inspection IT</span>
                                                </p>
                                                <p className="text-body-medium text-on-surface">
                                                    Statut final: <span className="font-medium">En attente (retour initié)</span>
                                                </p>
                                            </>
                                        )}
                                        <p className="text-body-medium text-on-surface">
                                            Validation: <span className="font-medium">{validatedBy ? validationMethodLabels[validatedBy] : 'Validation sécurisée'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {accessories.length > 0 && (
                                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4 mt-4">
                                    <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Accessoires restitués</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {accessories.map(acc => (
                                            <span key={acc} className="px-2.5 py-1 rounded-full text-label-small bg-surface border border-outline-variant text-on-surface">
                                                {acc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {comment && (
                                <div className="bg-primary-container/30 rounded-xl border border-outline-variant p-4 mt-4">
                                    <p className="text-label-medium text-on-surface-variant uppercase tracking-wide">Commentaire</p>
                                    <p className="text-body-medium text-on-surface mt-2">{comment}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-surface-container-low rounded-card border border-outline-variant p-4">
                            <p className="text-label-large text-on-surface">Effet après confirmation</p>
                            <p className="text-body-small text-on-surface-variant mt-1">
                                {isInspectionFlow
                                    ? (condition === 'Mauvais'
                                        ? "L'équipement sera orienté vers la maintenance et marqué 'En réparation'."
                                        : "L'équipement sera restitué au stock IT et redeviendra 'Disponible'.")
                                    : "La restitution sera initiée et passera en attente d'inspection IT (PENDING_RETURN)."}
                            </p>
                        </div>
                    </div>
                </WizardStep>
            )}
        </WizardLayout>
    );
};

export default ReturnWizardPage;















