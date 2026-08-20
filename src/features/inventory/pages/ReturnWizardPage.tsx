import React, { useState, useRef, useEffect } from 'react';
import {
    Check,
    Fingerprint,
    Key,
    Package,
    PenNib,
    User as UserIcon,
    Warning,
    Wrench,
} from '@phosphor-icons/react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Equipment } from '../../../types';
import Pagination from '../../../components/ui/Pagination';
import { WizardLayout, WizardStep } from '../../../components/layout/WizardLayout';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import { TextArea } from '../../../components/ui/TextArea';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { formatDate } from '../../../lib/financial';
import { EmptyState } from '../../../components/ui/EmptyState';
import { cn } from '../../../lib/utils';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { getEquipmentUpdatesForReturnWorkflow } from '../../../lib/businessRules';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import InputField from '../../../components/ui/InputField';
import Icon from '../../../components/ui/Icon';

type ReturnCondition = 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais';
/**
 * Restituer l'équipement — porté sur la planche **06.1**, colonnes « la personne rend
 * et atteste » et « l'informatique réceptionne et constate ».
 *
 * ## Le retour est le même mécanisme, dans l'autre sens
 *
 * La personne atteste, et l'objet **quitte immédiatement sa responsabilité** : il
 * passe en « retour à confirmer ». Il ne redevient pas disponible pour autant —
 * personne ne peut se le voir attribuer tant que l'informatique ne l'a pas dans les
 * mains.
 *
 * ## La réception est le seul écran du parcours qui ne soit pas symétrique
 *
 * On est devant l'objet, donc l'attestation seule ne suffit pas : il faut dire **dans
 * quel état il revient**, parce que c'est ce qui décide s'il repart en stock. Les
 * crans sont nommés **par leur conséquence** et non par une appréciation — « Repart
 * en stock », « À réviser d'abord », « Hors service » — et la photo passe avant le
 * texte : une rayure se photographie en une seconde et se décrit mal en trois phrases.
 */

type ValidationMethod = 'signature' | 'pin' | 'fingerprint';

const ReturnWizardPage: React.FC<{
    initialEquipmentId?: string;
    onCancel: () => void;
    onComplete: () => void;
}> = ({ initialEquipmentId, onCancel, onComplete }) => {
    const [accessories, setAccessories] = useState<string[]>([]);
    const { equipment, updateEquipment } = useData();
    const { user: actor } = useAccessControl();
    const { showToast } = useToast();

    const [refus, setRefus] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [condition, setCondition] = useState<ReturnCondition>('Bon');
    const [comment, setComment] = useState('');
    const [validationMethod, setValidationMethod] = useState<ValidationMethod>('signature');
    const [isValidated, setIsValidated] = useState(false);
    const [signatureCaptured, setSignatureCaptured] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const searchQuery = window.location.search.replace(/^\?/, '');
        const queryString = hashQuery || searchQuery;
        const urlParams = queryString ? new URLSearchParams(queryString) : null;
        const pEquipmentId = initialEquipmentId || urlParams?.get('equipmentId');

        if (pEquipmentId) {
            const found = equipment.find((e) => e.id === pEquipmentId);
            if (found) {
                setSelectedEquipment(found);
                setStep(2);
            }
        }
    }, [initialEquipmentId, equipment]);

    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [pin, setPin] = useState(['', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const isCompactViewport = useMediaQuery(MEDIA.compact);
    const isMediumViewport = useMediaQuery(MEDIA.medium);
    const itemsPerPage = isCompactViewport ? 5 : isMediumViewport ? 8 : 10;

    const filteredEquipment = equipment
        .filter((e) => e.status === 'Attribué' || e.assignmentStatus === 'PENDING_RETURN')
        .filter(
            (e) =>
                e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                e.assetId.toLowerCase().includes(equipmentSearch.toLowerCase()),
        );

    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
    const safePage = Math.min(equipmentPage, Math.max(1, totalPages));
    const paginatedEquipment = filteredEquipment.slice(
        (safePage - 1) * itemsPerPage,
        safePage * itemsPerPage,
    );

    useEffect(() => {
        setEquipmentPage(1);
    }, [equipmentSearch]);

    const isInspectionFlow = selectedEquipment?.assignmentStatus === 'PENDING_RETURN';

    const handlePinDigitChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }

        if (newPin.every((d) => d !== '')) {
            setIsValidated(true);
        }
    };

    const handleClearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureCaptured(false);
        setIsValidated(false);
    };

    const handleCanvasMouseDown = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.strokeStyle = 'rgb(26, 25, 23)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
        setSignatureCaptured(true);
        setIsValidated(true);
    };

    const handleCanvasMouseMove = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const handleCanvasMouseUp = () => {
        setIsDrawing(false);
    };

    const handleFingerprintConfirm = () => {
        setIsValidated(true);
    };

    const handleNext = () => {
        setRefus(null);
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

                const decision = updateEquipment(
                    selectedEquipment.id,
                    {
                        ...initiationUpdates,
                        notes: `${selectedEquipment.notes || ''}\n[DEMANDE RETOUR ${formatDate()}] ${comment.trim() || 'Aucun commentaire'}`,
                    },
                    {
                        source: 'return_wizard',
                        stage: 'initiation',
                        comment: comment.trim() || undefined,
                        requestedBy: actor?.id || 'system',
                    },
                );

                if (!decision.allowed) {
                    setRefus(
                        decision.reason || "Vous n'avez pas le droit de modifier cet équipement.",
                    );
                    return;
                }

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

            const decision = updateEquipment(
                selectedEquipment.id,
                {
                    ...inspectionUpdates,
                    operationalStatus: 'Actif',
                    notes: `${selectedEquipment.notes || ''}\n[INSPECTION RETOUR ${formatDate()}] État: ${condition}${comment ? ` - ${comment}` : ''}`,
                },
                {
                    condition,
                    accessories: accessories.join(', '),
                    comment: comment.trim() || undefined,
                    previousUser: selectedEquipment.user?.name || null,
                    source: 'return_wizard',
                    stage: 'inspection',
                },
            );

            if (!decision.allowed) {
                setRefus(decision.reason || "Vous n'avez pas le droit de modifier cet équipement.");
                return;
            }

            showToast(`Retour clôturé : ${selectedEquipment.name}`, 'success');
            onComplete();
        }
    };

    const toggleAccessory = (acc: string) => {
        setAccessories((prev) =>
            prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc],
        );
    };

    const handleEquipmentSelect = (item: Equipment) => {
        setSelectedEquipment(item);
        setStep(2);
    };

    const wizardSteps = [
        { id: 1, title: 'Équipement' },
        { id: 2, title: 'État' },
        { id: 3, title: 'Attestation' },
        { id: 4, title: 'Synthèse' },
    ];

    return (
        <WizardLayout
            title={isInspectionFlow ? 'Réceptionner le retour' : 'Restituer un équipement'}
            subtitle={
                isInspectionFlow
                    ? `Rendu par ${selectedEquipment?.user?.name || 'Karim Diallo'}, hier à 17:20.`
                    : "Vous attestez rendre. L'informatique attestera recevoir."
            }
            currentStep={step}
            steps={wizardSteps}
            onClose={onCancel}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            actions={
                <>
                    <Button
                        variant="text"
                        onClick={onCancel}
                        className="text-[14px] text-[var(--tk-color-text-primary)]"
                    >
                        {isInspectionFlow && step === 4 ? 'Plus tard' : 'Annuler'}
                    </Button>
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <Button variant="primary" onClick={() => setStep(3)}>
                                Continuer vers l'attestation
                            </Button>
                        )}
                        {step === 3 && (
                            <Button variant="primary" onClick={() => setStep(4)}>
                                Continuer vers la synthèse
                            </Button>
                        )}
                        {step === 4 && (
                            <Button variant="primary" onClick={handleNext}>
                                {isInspectionFlow ? 'Réceptionner' : 'Je rends cet équipement'}
                            </Button>
                        )}
                    </div>
                </>
            }
        >
            {refus && (
                <div className="flex items-start gap-2.5 rounded-md border border-[var(--tk-color-danger)]/30 bg-[var(--tk-color-surface-muted)] p-3 text-[13px] text-[var(--tk-color-danger)]">
                    <Icon glyph={Warning} size={18} className="mt-0.5 shrink-0" />
                    <span>{refus}</span>
                </div>
            )}

            {/* Étape 1 : Sélection de l'équipement à restituer */}
            {step === 1 && (
                <WizardStep>
                    <SearchFilterBar
                        searchValue={equipmentSearch}
                        onSearchChange={setEquipmentSearch}
                        placeholder="Rechercher par numéro de série, code ou modèle..."
                        resultCount={filteredEquipment.length}
                    />

                    <div className="bg-surface divide-y divide-[var(--tk-color-border-default)] overflow-hidden rounded-lg border border-[var(--tk-color-border-default)]">
                        {paginatedEquipment.length > 0 ? (
                            paginatedEquipment.map((item) => (
                                <Button
                                    key={item.id}
                                    variant="text"
                                    layout="card"
                                    onClick={() => handleEquipmentSelect(item)}
                                    className={cn(
                                        'flex w-full items-center justify-start gap-3.5 rounded-none p-3.5 text-left font-normal hover:bg-[var(--tk-color-surface-muted)]',
                                        selectedEquipment?.id === item.id &&
                                            'bg-[var(--tk-color-surface-muted)]',
                                    )}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]">
                                        <Icon glyph={Package} size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="font-brand truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--tk-color-text-primary)]">
                                                {item.assetId}
                                            </span>
                                            <span className="text-[12px] whitespace-nowrap text-[var(--tk-color-text-secondary)]">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 truncate text-[13px] text-[var(--tk-color-text-secondary)]">
                                            {item.name} {item.user ? `· ${item.user.name}` : ''}
                                        </div>
                                    </div>
                                    <StatusBadge
                                        status={
                                            item.assignmentStatus === 'PENDING_RETURN'
                                                ? 'PENDING_RETURN'
                                                : item.status
                                        }
                                        size="sm"
                                    />
                                </Button>
                            ))
                        ) : (
                            <div className="p-8">
                                <EmptyState
                                    icon="inventory_2"
                                    title="Aucun équipement à restituer"
                                    description={
                                        equipmentSearch
                                            ? 'Aucun équipement ne correspond à votre recherche.'
                                            : 'Aucun équipement attribué disponible pour un retour.'
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {filteredEquipment.length > 0 && (
                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={setEquipmentPage}
                        />
                    )}
                </WizardStep>
            )}

            {/* Étape 2 : Constat de l'état (Planche 06.1 Restituer & Réceptionner) */}
            {step === 2 && selectedEquipment && (
                <WizardStep>
                    {/* Matériel sélectionné (.fixed) */}
                    <div className="flex items-center gap-3 border-b border-[var(--tk-color-border-default)] py-2">
                        <div className="font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[15px] font-semibold text-[var(--tk-color-text-secondary)]">
                            <Icon glyph={Package} size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-brand truncate text-[15px] font-medium text-[var(--tk-color-text-primary)] tabular-nums">
                                {selectedEquipment.assetId}
                            </div>
                            <div className="truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                                {selectedEquipment.name} ·{' '}
                                {selectedEquipment.user?.name || 'Non attribué'}
                            </div>
                        </div>
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => setStep(1)}
                            className="px-2 text-[13px] font-medium text-[var(--tk-color-text-primary)]"
                        >
                            Changer
                        </Button>
                    </div>

                    {/* Destinataire / Rendu à (.pick) */}
                    <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            Rendu à
                        </p>
                        <div className="bg-surface flex min-h-[48px] items-center gap-3 rounded-md border border-[var(--tk-color-border-default)] px-3 py-2">
                            <div className="font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[14px] font-semibold text-[var(--tk-color-text-primary)]">
                                CA
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {actor?.name || 'Clara Admin'}
                                </div>
                                <div className="truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                                    Informatique · Bureau Paris
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Choix de qualification de l'état (Planche 06.1 Réceptionner) */}
                    <div>
                        <p className="mb-2 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            {isInspectionFlow
                                ? "Ce que l'objet devient"
                                : 'État constaté du matériel'}
                        </p>
                        <div className="flex flex-col gap-2">
                            {[
                                {
                                    value: 'Bon' as ReturnCondition,
                                    label: 'Repart en stock',
                                    sub: 'Rien à signaler',
                                },
                                {
                                    value: 'Moyen' as ReturnCondition,
                                    label: 'À réviser d’abord',
                                    sub: 'Ne sera pas proposé avant l’intervention',
                                },
                                {
                                    value: 'Mauvais' as ReturnCondition,
                                    label: 'Hors service',
                                    sub: 'Sortie d’inventaire — une validation est demandée',
                                },
                            ].map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={condition === opt.value ? 'tonal' : 'outlined'}
                                    layout="card"
                                    onClick={() => setCondition(opt.value)}
                                    className={cn(
                                        'flex min-h-[56px] items-center gap-3 rounded-md border p-3 text-left',
                                        condition === opt.value
                                            ? 'border-[1.5px] border-[var(--tk-color-text-primary)] bg-[var(--tk-color-surface-muted)]'
                                            : 'bg-surface border-[var(--tk-color-border-default)]',
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-medium text-[var(--tk-color-text-primary)]">
                                            {opt.label}
                                        </span>
                                        <span className="mt-0.5 block text-[12px] text-[var(--tk-color-text-secondary)]">
                                            {opt.sub}
                                        </span>
                                    </div>
                                    <div
                                        className={cn(
                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                                            condition === opt.value
                                                ? 'border-transparent bg-[var(--tk-color-inverse-surface)] text-white'
                                                : 'border-[var(--tk-color-border-default)]',
                                        )}
                                    >
                                        {condition === opt.value && (
                                            <Icon glyph={Check} size={18} />
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Bloc conséquence (.conseq) */}
                    <div className="flex flex-col gap-2.5 rounded-md bg-[var(--tk-color-surface-muted)] p-3.5 text-[13px] leading-[19px] text-[var(--tk-color-text-primary)]">
                        <span className="text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            Ce que cela déclenche
                        </span>
                        <div className="flex items-start gap-2.5">
                            <Icon
                                glyph={Wrench}
                                size={18}
                                className="mt-0.5 shrink-0 text-[var(--tk-color-text-secondary)]"
                            />
                            <span>
                                {condition === 'Bon' && (
                                    <>
                                        L’équipement <strong>repassera « Disponible »</strong> et
                                        pourra être réattribué sans délai.
                                    </>
                                )}
                                {condition === 'Moyen' && (
                                    <>
                                        L’objet passe <strong>en réparation</strong> et une tâche
                                        est ouverte. Il <strong>ne rejoint pas</strong> les
                                        disponibles.
                                    </>
                                )}
                                {condition === 'Mauvais' && (
                                    <>
                                        L’objet passe <strong>hors service</strong> et une demande
                                        de sortie de parc est ouverte.
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <Icon
                                glyph={Check}
                                size={18}
                                className="mt-0.5 shrink-0 text-[var(--tk-color-text-secondary)]"
                            />
                            <span>
                                {selectedEquipment.user?.name || 'L’utilisateur'}{' '}
                                <strong>n'en répond plus</strong> à compter de cet instant.
                            </span>
                        </div>
                    </div>

                    {/* Observations / Commentaire */}
                    <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            Un mot sur l'état, si nécessaire
                        </p>
                        <TextArea
                            label=""
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Optionnel — l'informatique constatera de son côté."
                            rows={2}
                        />
                    </div>

                    {/* Accessoires restitués */}
                    <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            Accessoires remis
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Chargeur secteur',
                                'Câble USB-C',
                                'Sacoche',
                                'Souris',
                                'Adaptateur HDMI',
                            ].map((acc) => (
                                <Button
                                    key={acc}
                                    variant={accessories.includes(acc) ? 'tonal' : 'outlined'}
                                    size="sm"
                                    onClick={() => toggleAccessory(acc)}
                                    className={cn(
                                        'px-3 py-1.5 text-[12px] font-medium',
                                        accessories.includes(acc) &&
                                            'border-[var(--tk-color-brand-dark)] bg-[var(--tk-color-brand-muted)] text-[var(--tk-color-text-primary)]',
                                    )}
                                >
                                    {acc}
                                </Button>
                            ))}
                        </div>
                    </div>
                </WizardStep>
            )}

            {/* Étape 3 : Attestation (Planche 06.2) */}
            {step === 3 && selectedEquipment && (
                <WizardStep>
                    {/* Attestation — Planche 06.2 */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                                Votre attestation ({actor?.name || 'Karim Diallo'})
                            </p>
                        </div>

                        {/* Onglets de méthode d'attestation */}
                        <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-lg bg-[var(--tk-color-surface-muted)] p-1">
                            <Button
                                variant={validationMethod === 'signature' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setValidationMethod('signature')}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium',
                                    validationMethod === 'signature' &&
                                        'bg-surface text-[var(--tk-color-text-primary)] shadow-xs',
                                )}
                            >
                                <Icon glyph={PenNib} size={18} />
                                <span>Signature</span>
                            </Button>
                            <Button
                                variant={validationMethod === 'pin' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setValidationMethod('pin')}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium',
                                    validationMethod === 'pin' &&
                                        'bg-surface text-[var(--tk-color-text-primary)] shadow-xs',
                                )}
                            >
                                <Icon glyph={Key} size={18} />
                                <span>Code PIN</span>
                            </Button>
                            <Button
                                variant={validationMethod === 'fingerprint' ? 'tonal' : 'text'}
                                size="sm"
                                onClick={() => setValidationMethod('fingerprint')}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium',
                                    validationMethod === 'fingerprint' &&
                                        'bg-surface text-[var(--tk-color-text-primary)] shadow-xs',
                                )}
                            >
                                <Icon glyph={Fingerprint} size={18} />
                                <span>Empreinte</span>
                            </Button>
                        </div>

                        {/* Méthode : Signature (.sig) */}
                        {validationMethod === 'signature' && (
                            <div className="bg-surface relative flex h-[140px] items-end justify-center overflow-hidden rounded-md border border-[var(--tk-color-border-default)] pb-2.5 text-[12px] text-[var(--tk-color-text-muted)]">
                                <canvas
                                    ref={canvasRef}
                                    width={480}
                                    height={140}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onTouchStart={handleCanvasMouseDown}
                                    onTouchMove={handleCanvasMouseMove}
                                    onTouchEnd={handleCanvasMouseUp}
                                    className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                                />
                                {!signatureCaptured && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[var(--tk-color-text-muted)]">
                                        Signez dans cette zone
                                    </div>
                                )}
                                <span className="relative z-10 font-medium text-[var(--tk-color-text-secondary)]">
                                    {actor?.name || 'Karim Diallo'}
                                </span>
                                {signatureCaptured && (
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        onClick={handleClearSignature}
                                        className="absolute top-2 right-2 z-10 h-7 px-2 text-[11px]"
                                    >
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Méthode : Code PIN (.pin) */}
                        {validationMethod === 'pin' && (
                            <div className="flex flex-col items-center gap-2 py-1">
                                <div className="flex justify-center gap-3">
                                    {pin.map((digit, idx) => (
                                        <InputField
                                            key={idx}
                                            ref={(el) => {
                                                pinRefs.current[idx] = el;
                                            }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) =>
                                                handlePinDigitChange(idx, e.target.value)
                                            }
                                            aria-label={`Chiffre PIN ${idx + 1}`}
                                            className="font-brand h-[76px] w-[64px] text-center text-[34px] font-semibold"
                                            containerClassName="w-auto"
                                        />
                                    ))}
                                </div>
                                <p className="text-center text-[12px] text-[var(--tk-color-text-secondary)]">
                                    Code PIN à 4 chiffres ({actor?.name || 'Karim Diallo'})
                                </p>
                            </div>
                        )}

                        {/* Méthode : Empreinte (.bio) */}
                        {validationMethod === 'fingerprint' && (
                            <div className="flex h-[148px] flex-col items-center justify-center gap-2.5 rounded-md bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]">
                                <Button
                                    variant="outlined"
                                    onClick={handleFingerprintConfirm}
                                    className={cn(
                                        'flex h-16 w-16 items-center justify-center rounded-full p-0',
                                        isValidated
                                            ? 'border-transparent bg-[var(--tk-color-success)] text-white'
                                            : 'bg-surface text-[var(--tk-color-text-primary)]',
                                    )}
                                >
                                    <Icon glyph={Fingerprint} size={32} />
                                </Button>
                                <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                    {isValidated
                                        ? 'Empreinte reconnue'
                                        : 'Posez votre doigt pour valider'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bannière d'engagement (.warn) */}
                    <div className="flex gap-2.5 rounded-md bg-[var(--tk-color-surface-muted)] p-3 text-[12px] leading-[17px] text-[var(--tk-color-text-primary)]">
                        <Icon
                            glyph={Check}
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--tk-color-success)]"
                        />
                        <span>
                            <strong>C'est votre preuve.</strong> L'objet quitte votre
                            responsabilité, horodaté.
                        </span>
                    </div>
                </WizardStep>
            )}

            {/* Étape 4 : Synthèse (Planche 06.1) */}
            {step === 4 && selectedEquipment && (
                <WizardStep>
                    {/* Acquittement croisé (.ack) */}
                    <div className="bg-surface divide-y divide-[var(--tk-color-border-default)] overflow-hidden rounded-md border border-[var(--tk-color-border-default)]">
                        <div className="flex min-h-[64px] items-center gap-3 p-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-white">
                                <Icon glyph={Check} size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {selectedEquipment.user?.name || actor?.name || 'Karim Diallo'}{' '}
                                    atteste avoir rendu
                                </div>
                                <div className="mt-0.5 text-[12px] text-[var(--tk-color-text-secondary)]">
                                    Aujourd'hui · Méthode {validationMethod}
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-[64px] items-center gap-3 p-3">
                            <div
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                    isInspectionFlow
                                        ? 'bg-[var(--tk-color-inverse-surface)] text-white'
                                        : 'bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]',
                                )}
                            >
                                {isInspectionFlow ? (
                                    <Icon glyph={Check} size={18} />
                                ) : (
                                    <Icon glyph={UserIcon} size={18} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {isInspectionFlow
                                        ? 'Support Informatique réceptionne'
                                        : "L'informatique attestera réceptionner"}
                                </div>
                                <div className="mt-0.5 text-[12px] text-[var(--tk-color-text-secondary)]">
                                    {isInspectionFlow
                                        ? `Constat : ${condition}`
                                        : "Ce qui sera fait à l'arrivée en stock"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Récapitulatif équipement et décision */}
                    <div className="bg-surface flex flex-col gap-3 rounded-md border border-[var(--tk-color-border-default)] p-4">
                        <div className="flex items-center justify-between border-b border-[var(--tk-color-border-default)] pb-2">
                            <span className="text-[12px] text-[var(--tk-color-text-secondary)]">
                                Équipement
                            </span>
                            <span className="font-brand text-[13px] font-semibold text-[var(--tk-color-text-primary)] tabular-nums">
                                {selectedEquipment.assetId} · {selectedEquipment.name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[var(--tk-color-border-default)] pb-2">
                            <span className="text-[12px] text-[var(--tk-color-text-secondary)]">
                                État constaté
                            </span>
                            <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                {condition}
                            </span>
                        </div>
                        {accessories.length > 0 && (
                            <div className="flex items-center justify-between border-b border-[var(--tk-color-border-default)] pb-2">
                                <span className="text-[12px] text-[var(--tk-color-text-secondary)]">
                                    Accessoires
                                </span>
                                <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                    {accessories.join(', ')}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[var(--tk-color-text-secondary)]">
                                Statut après confirmation
                            </span>
                            <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                {isInspectionFlow
                                    ? condition === 'Mauvais'
                                        ? 'En réparation'
                                        : 'Disponible'
                                    : 'En attente de réception IT'}
                            </span>
                        </div>
                    </div>
                </WizardStep>
            )}
        </WizardLayout>
    );
};

export default ReturnWizardPage;
