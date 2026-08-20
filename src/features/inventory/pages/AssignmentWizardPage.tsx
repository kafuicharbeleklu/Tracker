import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    CalendarBlank,
    Check,
    Fingerprint,
    Info,
    Key,
    Package,
    PenNib,
    User as UserIcon,
    Warning,
} from '@phosphor-icons/react';
import { ApprovalStatus, AssignmentStatus, Equipment, User } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import Pagination from '../../../components/ui/Pagination';
import { WizardLayout, WizardStep } from '../../../components/layout/WizardLayout';
import Button from '../../../components/ui/Button';
import { useAccessControl } from '../../../hooks/useAccessControl';
import StatusBadge from '../../../components/ui/StatusBadge';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';
import { approvalRequiresManagerGate } from '../../../lib/businessRules';
import { formatDate } from '../../../lib/financial';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import InputField from '../../../components/ui/InputField';
import Icon from '../../../components/ui/Icon';

/**
 * Remettre l'équipement — porté sur la planche **06.1**, colonne « l'informatique
 * remet et atteste ».
 *
 * ## Chaque partie atteste son propre acte
 *
 * C'est le principe qui commande tout l'écran, et il est déjà dans le produit :
 * le tableau de bord utilisateur porte un compteur « Réceptions à confirmer », celui
 * de l'administrateur un statut « En attente ». Les deux disent la même chose —
 * **une remise faite par l'informatique n'est pas une remise reçue**.
 *
 * L'attestation d'ici ne dit donc pas « Karim a reçu », elle dit « j'ai remis ». À sa
 * validation l'objet **ne devient pas attribué** : il passe en attente jusqu'au second
 * acquittement. Tant que les deux ne sont pas là, l'objet est dans un état
 * intermédiaire **qui n'accuse personne** — ce n'est plus une parole contre une autre,
 * ce sont deux traces horodatées, ou une seule et un objet qui n'est passé nulle part.
 *
 * ## Ce qui n'est pas porté, et pourquoi
 *
 * - **« L'application propose la méthode que la situation permet. »** La planche
 *   nomme les trois boutons équivalents comme le défaut de l'écran actuel, et elle a
 *   raison — mais la donnée qui trancherait n'existe pas : le modèle `User` ne porte
 *   **aucun code PIN**, donc rien ne dit si le bénéficiaire en a un. La planche laisse
 *   d'ailleurs la question ouverte (« quel code : celui de la fiche, ou un code à
 *   usage unique ? »). Trancher ici reviendrait à inventer la donnée.
 */

type ValidationMethod = 'signature' | 'pin' | 'fingerprint';
type WizardContextMode = 'generic' | 'fromEquipment' | 'fromUser';
type WizardStage = 'equipment' | 'user' | 'validation' | 'summary';

const AssignmentWizardPage: React.FC<{
    initialEquipmentId?: string;
    initialUserId?: string;
    onCancel: () => void;
    onComplete: () => void;
}> = ({ initialEquipmentId, initialUserId, onCancel, onComplete }) => {
    const {
        equipment,
        users,
        updateEquipment,
        updateApproval,
        addApproval,
        approvals,
        categories,
    } = useData();
    const { showToast } = useToast();
    const { user: adminUser } = useAccessControl();

    const [refus, setRefus] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [validationMethod, setValidationMethod] = useState<ValidationMethod>('signature');
    const [isValidated, setIsValidated] = useState(false);
    const [validatedBy, setValidatedBy] = useState<ValidationMethod | null>(null);

    const [isImmediateHandover, setIsImmediateHandover] = useState(false);
    const [signatureCaptured, setSignatureCaptured] = useState(false);

    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);

    const [approvalId, setApprovalId] = useState<string | null>(null);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    const [contextMode, setContextMode] = useState<WizardContextMode>('generic');

    const [pin, setPin] = useState(['', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const searchQuery = window.location.search.replace(/^\?/, '');
        const queryString = hashQuery || searchQuery;
        const urlParams = queryString ? new URLSearchParams(queryString) : null;
        const pApprovalId = urlParams?.get('approvalId');
        const pUserId = initialUserId || urlParams?.get('userId');
        const pEquipmentId = initialEquipmentId || urlParams?.get('equipmentId');
        const pCategory = urlParams?.get('category');
        const pContext = urlParams?.get('context');

        if (pApprovalId) setApprovalId(pApprovalId);
        if (pCategory) {
            setSuggestedCategory(pCategory);
            setEquipmentSearch(pCategory);
        }
        if (pUserId) {
            const foundUser = users.find((u) => u.id === pUserId);
            if (foundUser) setSelectedUser(foundUser);
        }
        if (pEquipmentId) {
            const foundEquipment = equipment.find((item) => item.id === pEquipmentId);
            if (
                foundEquipment?.status === 'Disponible' ||
                foundEquipment?.assignmentStatus === 'PENDING_DELIVERY'
            ) {
                setSelectedEquipment(foundEquipment);
            }
        }

        let nextContext: WizardContextMode = 'generic';
        if (pContext === 'equipment_details' || pEquipmentId) nextContext = 'fromEquipment';
        else if (pContext === 'user_details' || pUserId) nextContext = 'fromUser';
        setContextMode(nextContext);
    }, [initialEquipmentId, initialUserId, equipment, users]);

    const stageSequence = useMemo<WizardStage[]>(() => {
        if (contextMode === 'fromEquipment' && selectedEquipment) {
            return ['user', 'validation', 'summary'];
        }
        if (contextMode === 'fromUser' && selectedUser) {
            return ['equipment', 'validation', 'summary'];
        }
        return ['equipment', 'user', 'validation', 'summary'];
    }, [contextMode, selectedEquipment, selectedUser]);

    const currentStage = stageSequence[step - 1];
    const isLastStep = step === stageSequence.length;

    useEffect(() => {
        setStep((prev) => Math.min(prev, stageSequence.length));
    }, [stageSequence.length]);

    useEffect(() => {
        setEquipmentPage(1);
    }, [equipmentSearch]);

    useEffect(() => {
        setUserPage(1);
    }, [userSearch]);

    const isCompactViewport = useMediaQuery(MEDIA.compact);
    const isMediumViewport = useMediaQuery(MEDIA.medium);
    const itemsPerPage = isCompactViewport ? 5 : isMediumViewport ? 8 : 10;

    const nonAssignableTypes = useMemo(
        () => new Set(categories.filter((c) => !c.assignable).map((c) => c.name)),
        [categories],
    );

    const filteredEquipment = equipment
        .filter((e) => e.status === 'Disponible')
        .filter((e) => !nonAssignableTypes.has(e.type))
        .filter(
            (e) =>
                e.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                e.assetId.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                e.type.toLowerCase().includes(equipmentSearch.toLowerCase()),
        );

    const totalEquipmentPages = Math.ceil(filteredEquipment.length / itemsPerPage);
    const safeEquipmentPage = Math.min(equipmentPage, Math.max(1, totalEquipmentPages));
    const paginatedEquipment = filteredEquipment.slice(
        (safeEquipmentPage - 1) * itemsPerPage,
        safeEquipmentPage * itemsPerPage,
    );

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.department.toLowerCase().includes(userSearch.toLowerCase()),
    );

    const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const safeUserPage = Math.min(userPage, Math.max(1, totalUserPages));
    const paginatedUsers = filteredUsers.slice(
        (safeUserPage - 1) * itemsPerPage,
        safeUserPage * itemsPerPage,
    );

    const userInitials = useMemo(() => {
        if (!selectedUser?.name) return 'U';
        const parts = selectedUser.name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0].slice(0, 2).toUpperCase();
    }, [selectedUser?.name]);

    const handlePinDigitChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }

        if (newPin.every((d) => d !== '')) {
            setValidatedBy('pin');
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
        setValidatedBy('signature');
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
        setValidatedBy('fingerprint');
        setIsValidated(true);
    };

    const handleNext = () => {
        setRefus(null);
        if (!isLastStep) {
            setStep((prev) => Math.min(prev + 1, stageSequence.length));
        } else if (selectedEquipment && selectedUser) {
            if (approvalId) {
                const approval = approvals.find((a) => a.id === approvalId);

                if (approval && approval.status === 'WAITING_IT_PROCESSING') {
                    const nextStatus = approvalRequiresManagerGate(approval, users)
                        ? 'WAITING_DOTATION_APPROVAL'
                        : 'PENDING_DELIVERY';
                    const transitionDecision = updateApproval(approvalId, nextStatus, {
                        assignedEquipmentId: selectedEquipment.id,
                        assignedEquipmentName: selectedEquipment.name,
                    });
                    if (!transitionDecision.allowed) {
                        setRefus(
                            transitionDecision.reason || 'Action non autorisée pour cette demande.',
                        );
                        return;
                    }

                    updateEquipment(selectedEquipment.id, {
                        status: 'En attente',
                        assignmentStatus: nextStatus,
                        assignedAt: new Date().toISOString(),
                        assignedBy: adminUser?.id || '1',
                        assignedByName: adminUser?.name || 'Admin',
                        user: {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            avatar: selectedUser.avatar,
                            email: selectedUser.email,
                        },
                    });

                    showToast(
                        nextStatus === 'WAITING_DOTATION_APPROVAL'
                            ? 'Matériel sélectionné. En attente de validation par le Manager.'
                            : 'Matériel affecté. En attente de confirmation par le bénéficiaire.',
                        'success',
                    );
                } else {
                    const transitionDecision = updateApproval(approvalId, 'PENDING_DELIVERY', {
                        assignedEquipmentId: selectedEquipment.id,
                        assignedEquipmentName: selectedEquipment.name,
                    });
                    if (!transitionDecision.allowed) {
                        setRefus(
                            transitionDecision.reason || 'Action non autorisée pour cette demande.',
                        );
                        return;
                    }

                    updateEquipment(selectedEquipment.id, {
                        status: 'En attente',
                        assignmentStatus: 'PENDING_DELIVERY',
                        assignedAt: new Date().toISOString(),
                        assignedBy: adminUser?.id,
                        user: {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            avatar: selectedUser.avatar,
                            email: selectedUser.email,
                        },
                    });
                    showToast(
                        'Matériel affecté. En attente de confirmation utilisateur.',
                        'success',
                    );
                }
            } else {
                const finalAssignmentStatus: AssignmentStatus = isImmediateHandover
                    ? 'CONFIRMED'
                    : 'PENDING_DELIVERY';
                const finalApprovalStatus: ApprovalStatus = isImmediateHandover
                    ? 'Completed'
                    : 'PENDING_DELIVERY';
                const finalMainStatus = isImmediateHandover ? 'Attribué' : 'En attente';

                addApproval({
                    requesterId: adminUser?.id || '1',
                    requesterName: adminUser?.name || 'Admin',
                    requesterRole: adminUser?.role || 'Admin',
                    beneficiaryId: selectedUser.id,
                    beneficiaryName: selectedUser.name,
                    isDelegated: true,
                    equipmentCategory: selectedEquipment.type,
                    reason: 'Attribution directe par informatique',
                    urgency: 'normal',
                    status: finalApprovalStatus,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    requester: adminUser?.name || 'Admin',
                    equipmentName: selectedEquipment.name,
                    equipmentType: selectedEquipment.type,
                    requestType: 'Attribution',
                    requestDate: formatDate(),
                    image: selectedEquipment.image,
                    assignedEquipmentId: selectedEquipment.id,
                    assignedEquipmentName: selectedEquipment.name,
                });

                updateEquipment(selectedEquipment.id, {
                    status: finalMainStatus,
                    assignmentStatus: finalAssignmentStatus,
                    assignedAt: new Date().toISOString(),
                    assignedBy: adminUser?.id || '1',
                    assignedByName: adminUser?.name || 'Admin',
                    user: {
                        id: selectedUser.id,
                        name: selectedUser.name,
                        avatar: selectedUser.avatar,
                        email: selectedUser.email,
                    },
                    ...(isImmediateHandover
                        ? {
                              confirmedBy: selectedUser.id,
                              confirmedAt: new Date().toISOString(),
                          }
                        : {}),
                });

                if (isImmediateHandover) {
                    showToast('Attribution effectuée et confirmée.', 'success');
                } else {
                    showToast('Remise attestée. En attente de confirmation.', 'success');
                }
            }

            onComplete();
        }
    };

    const wizardSteps = stageSequence.map((stage, index) => ({
        id: index + 1,
        title:
            stage === 'equipment'
                ? 'Équipement'
                : stage === 'user'
                  ? 'Bénéficiaire'
                  : stage === 'validation'
                    ? 'Attestation'
                    : 'Synthèse',
    }));

    return (
        <WizardLayout
            title={
                approvalId
                    ? `Affectation pour Demande #${approvalId.substring(0, 8)}`
                    : "Remettre l'équipement"
            }
            subtitle="Vous attestez votre geste, pas celui du bénéficiaire."
            currentStep={step}
            steps={wizardSteps}
            onClose={onCancel}
            onBack={step > 1 ? () => setStep((prev) => Math.max(1, prev - 1)) : undefined}
            actions={
                <>
                    <Button
                        variant="text"
                        onClick={onCancel}
                        className="text-[14px] text-[var(--tk-color-text-primary)]"
                    >
                        Annuler
                    </Button>
                    <div className="flex items-center gap-3">
                        {currentStage === 'validation' && (
                            <Button
                                variant="primary"
                                onClick={() => setStep(stageSequence.indexOf('summary') + 1)}
                            >
                                Continuer vers la synthèse
                            </Button>
                        )}
                        {currentStage === 'summary' && (
                            <Button variant="primary" onClick={handleNext}>
                                {approvalId ? "Valider l'affectation" : 'Remettre'}
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

            {/* Étape 1 : Sélection équipement */}
            {currentStage === 'equipment' && (
                <WizardStep>
                    {suggestedCategory && (
                        <div className="flex items-center gap-2.5 rounded-md border border-[var(--tk-color-border-default)] bg-[var(--tk-color-surface-muted)] p-3 text-[13px] text-[var(--tk-color-text-primary)]">
                            <Icon
                                glyph={Info}
                                size={18}
                                className="shrink-0 text-[var(--tk-color-brand-dark)]"
                            />
                            <span>
                                Matériel suggéré pour cette demande :{' '}
                                <strong>{suggestedCategory}</strong>
                            </span>
                        </div>
                    )}

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
                                    onClick={() => {
                                        setSelectedEquipment(item);
                                        setStep((prev) => Math.min(prev + 1, stageSequence.length));
                                    }}
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
                                            {item.name} · {item.location || 'Bureau Paris'}
                                        </div>
                                    </div>
                                    <StatusBadge status={item.status} size="sm" />
                                </Button>
                            ))
                        ) : (
                            <div className="p-8">
                                <EmptyState
                                    icon="inventory_2"
                                    title="Aucun équipement disponible"
                                    description={
                                        equipmentSearch
                                            ? 'Aucun équipement ne correspond à votre recherche.'
                                            : 'Aucun équipement disponible pour cette catégorie.'
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {filteredEquipment.length > 0 && (
                        <Pagination
                            currentPage={safeEquipmentPage}
                            totalPages={totalEquipmentPages}
                            onPageChange={setEquipmentPage}
                        />
                    )}
                </WizardStep>
            )}

            {/* Étape 2 : Sélection utilisateur */}
            {currentStage === 'user' && (
                <WizardStep>
                    <SearchFilterBar
                        searchValue={userSearch}
                        onSearchChange={setUserSearch}
                        placeholder="Rechercher une personne par nom ou département..."
                        resultCount={filteredUsers.length}
                    />

                    <div className="bg-surface divide-y divide-[var(--tk-color-border-default)] overflow-hidden rounded-lg border border-[var(--tk-color-border-default)]">
                        {paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user) => {
                                const initials = user.name
                                    .trim()
                                    .split(/\s+/)
                                    .map((p) => p[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <Button
                                        key={user.id}
                                        variant="text"
                                        layout="card"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setStep((prev) =>
                                                Math.min(prev + 1, stageSequence.length),
                                            );
                                        }}
                                        className={cn(
                                            'flex w-full items-center justify-start gap-3.5 rounded-none p-3.5 text-left font-normal hover:bg-[var(--tk-color-surface-muted)]',
                                            selectedUser?.id === user.id &&
                                                'bg-[var(--tk-color-surface-muted)]',
                                        )}
                                    >
                                        <div className="font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-[14px] font-semibold text-white">
                                            {initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                                {user.name}
                                            </div>
                                            <div className="mt-0.5 truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                                                {user.department} · {user.email}
                                            </div>
                                        </div>
                                        <Badge variant="neutral">{user.role}</Badge>
                                    </Button>
                                );
                            })
                        ) : (
                            <div className="p-8">
                                <EmptyState
                                    icon="person_off"
                                    title="Aucun utilisateur trouvé"
                                    description={
                                        userSearch
                                            ? 'Aucun utilisateur ne correspond à votre recherche.'
                                            : 'Aucun utilisateur disponible pour cette attribution.'
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {filteredUsers.length > 0 && (
                        <Pagination
                            currentPage={safeUserPage}
                            totalPages={totalUserPages}
                            onPageChange={setUserPage}
                        />
                    )}
                </WizardStep>
            )}

            {/* Étape 3 : Attestation (Planches 06.1 & 06.2) */}
            {currentStage === 'validation' && selectedEquipment && selectedUser && (
                <WizardStep>
                    {/* Équipement sélectionné (.fixed) */}
                    <div className="flex items-center gap-3 border-b border-[var(--tk-color-border-default)] py-2">
                        <div className="font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[15px] font-semibold text-[var(--tk-color-text-secondary)]">
                            <Icon glyph={Package} size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-brand truncate text-[15px] font-medium text-[var(--tk-color-text-primary)] tabular-nums">
                                {selectedEquipment.assetId}
                            </div>
                            <div className="truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                                {selectedEquipment.name} · {selectedEquipment.type}
                            </div>
                        </div>
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => setStep(stageSequence.indexOf('equipment') + 1)}
                            className="px-2 text-[13px] font-medium text-[var(--tk-color-text-primary)]"
                        >
                            Changer
                        </Button>
                    </div>

                    {/* Bénéficiaire sélectionné (.pick) */}
                    <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            Remis à
                        </p>
                        <div className="bg-surface flex min-h-[48px] items-center gap-3 rounded-md border border-[var(--tk-color-border-default)] px-3 py-2">
                            <div className="font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[14px] font-semibold text-[var(--tk-color-text-primary)]">
                                {userInitials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {selectedUser.name}
                                </div>
                                <div className="truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                                    {selectedUser.department} ·{' '}
                                    {selectedUser.location || 'Bureau Paris'}
                                </div>
                            </div>
                            <Button
                                variant="text"
                                size="sm"
                                onClick={() => setStep(stageSequence.indexOf('user') + 1)}
                                className="px-2 text-[13px] font-medium text-[var(--tk-color-text-primary)]"
                            >
                                Changer
                            </Button>
                        </div>
                    </div>

                    {/* Date d'effet (.val) */}
                    <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                            À partir du
                        </p>
                        <div className="bg-surface flex min-h-[48px] items-center gap-2.5 rounded-md border border-[var(--tk-color-border-default)] px-3 text-[15px] text-[var(--tk-color-text-primary)]">
                            <Icon
                                glyph={CalendarBlank}
                                size={18}
                                className="shrink-0 text-[var(--tk-color-text-secondary)]"
                            />
                            <span>
                                aujourd'hui (
                                {new Date().toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                })}
                                )
                            </span>
                        </div>
                    </div>

                    {/* Attestation — Planche 06.2 */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium tracking-[0.06em] text-[var(--tk-color-text-muted)] uppercase">
                                Votre attestation
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
                                    {adminUser?.name || 'Clara Admin'}
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
                                    Code PIN à 4 chiffres ({adminUser?.name || 'Clara Admin'})
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
                                        isValidated && validatedBy === 'fingerprint'
                                            ? 'border-transparent bg-[var(--tk-color-success)] text-white'
                                            : 'bg-surface text-[var(--tk-color-text-primary)]',
                                    )}
                                >
                                    <Icon glyph={Fingerprint} size={32} />
                                </Button>
                                <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                    {isValidated && validatedBy === 'fingerprint'
                                        ? 'Empreinte reconnue'
                                        : 'Posez votre doigt pour valider'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bannière explicative (.warn) */}
                    <div className="flex gap-2.5 rounded-md bg-[var(--tk-color-surface-muted)] p-3 text-[12px] leading-[17px] text-[var(--tk-color-text-primary)]">
                        <Icon
                            glyph={Info}
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--tk-color-text-secondary)]"
                        />
                        <span>
                            Enregistré au nom de <strong>{adminUser?.name || 'Clara Admin'}</strong>
                            , horodaté. <strong>L'objet ne devient pas « attribué »</strong> : il
                            passe <strong>en attente</strong> jusqu'à ce que {selectedUser.name}{' '}
                            confirme la réception.
                        </span>
                    </div>

                    {/* Option remise immédiate */}
                    <Button
                        variant={isImmediateHandover ? 'tonal' : 'outlined'}
                        layout="card"
                        onClick={() => setIsImmediateHandover(!isImmediateHandover)}
                        className="flex w-full items-start gap-3 rounded-md p-3 text-left"
                    >
                        <div
                            className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border',
                                isImmediateHandover
                                    ? 'border-[var(--tk-color-brand-dark)] bg-[var(--tk-color-brand)] text-[var(--tk-color-text-primary)]'
                                    : 'border-[var(--tk-color-border-default)]',
                            )}
                        >
                            {isImmediateHandover && <Icon glyph={Check} size={18} />}
                        </div>
                        <div className="flex-1 text-[13px]">
                            <span className="block font-medium text-[var(--tk-color-text-primary)]">
                                Remise en main propre immédiate
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[var(--tk-color-text-secondary)]">
                                Le bénéficiaire est présent au comptoir et réceptionne maintenant.
                            </span>
                        </div>
                    </Button>
                </WizardStep>
            )}

            {/* Étape 4 : Synthèse (Planche 06.1) */}
            {currentStage === 'summary' && selectedEquipment && selectedUser && (
                <WizardStep>
                    {/* Acquittement croisé (.ack) */}
                    <div className="bg-surface divide-y divide-[var(--tk-color-border-default)] overflow-hidden rounded-md border border-[var(--tk-color-border-default)]">
                        <div className="bg-surface flex items-center gap-3 p-3.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-white">
                                <Icon glyph={Check} size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {adminUser?.name || 'Clara Admin'} atteste avoir remis
                                </div>
                                <div className="mt-0.5 text-[12px] text-[var(--tk-color-text-secondary)]">
                                    Aujourd'hui · Méthode {validationMethod}
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface flex items-center gap-3 p-3.5">
                            <div
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                    isImmediateHandover
                                        ? 'bg-[var(--tk-color-inverse-surface)] text-white'
                                        : 'bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]',
                                )}
                            >
                                {isImmediateHandover ? (
                                    <Icon glyph={Check} size={18} />
                                ) : (
                                    <Icon glyph={UserIcon} size={18} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-medium text-[var(--tk-color-text-primary)]">
                                    {isImmediateHandover
                                        ? `${selectedUser.name} confirme la réception`
                                        : `${selectedUser.name} attestera avoir reçu`}
                                </div>
                                <div className="mt-0.5 text-[12px] text-[var(--tk-color-text-secondary)]">
                                    {isImmediateHandover
                                        ? 'Confirmé en direct au comptoir'
                                        : "C'est ce qui reste à faire sur son appareil"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Récapitulatif équipement et personne */}
                    <div className="bg-surface flex flex-col gap-3 rounded-lg border border-[var(--tk-color-border-default)] p-4">
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
                                Bénéficiaire
                            </span>
                            <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                {selectedUser.name} ({selectedUser.department})
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[var(--tk-color-text-secondary)]">
                                Statut après validation
                            </span>
                            <span className="text-[13px] font-medium text-[var(--tk-color-text-primary)]">
                                {isImmediateHandover
                                    ? 'Attribué (confirmé)'
                                    : 'En attente de réception'}
                            </span>
                        </div>
                    </div>
                </WizardStep>
            )}
        </WizardLayout>
    );
};

export default AssignmentWizardPage;
