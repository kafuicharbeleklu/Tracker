import React from 'react';
import { Approval } from '../../../types';
import { cn } from '../../../lib/utils';
import { formatDate } from '../../../lib/financial';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import SecurityGate from '../../../components/security/SecurityGate';
import { getCategoryIcon } from '../../../constants/categoryIcons';
import { getDecisionNoteLabel } from '../../../lib/businessRules';

interface ApprovalRowProps {
    approval: Approval;
    onApprove?: (approval: Approval) => boolean | void;
    onReject?: (approval: Approval, reason?: string) => boolean | void;
    showActions?: boolean;
    compact?: boolean;
    requesterAvatar?: string;
    beneficiaryAvatar?: string;
    stepDetails: {
        label: string;
        color: string;
        bg: string;
        icon: React.ReactNode;
        // Absents pour les statuts terminaux : aucune action dans la machine à états
        btnText?: string;
        rejectText?: string;
    };
}

export const ApprovalRow: React.FC<ApprovalRowProps> = ({
    approval,
    onApprove,
    onReject,
    showActions = false,
    compact = false,
    requesterAvatar,
    beneficiaryAvatar,
    stepDetails,
}) => {
    const [imageError, setImageError] = React.useState(false);
    const isDelegated = approval.beneficiaryId !== approval.requesterId;
    const fallbackIcon = getCategoryIcon(approval.equipmentCategory);
    const equipmentTitle = approval.equipmentName || approval.equipmentModel || approval.equipmentCategory;
    const rejectLabel = stepDetails.rejectText || 'Refuser';
    const rejectIcon = rejectLabel === 'Renvoyer' ? 'reply' : 'block';
    // Motif obligatoire aux 4 points de refus (§9.7.2/D18) — la garde métier
    // d'updateApproval refuse de toute façon un refus sans motif.
    const rejectReasonField = {
        label: rejectLabel === 'Renvoyer' ? 'Motif du renvoi' : 'Motif du refus',
        required: true,
    };
    const decisionNote = approval.decisionNote;

    if (compact) {
        return (
            <div className="group border-b border-outline-variant/50 last:border-0 bg-surface px-3 py-2.5 hover:bg-surface-container-low transition-colors duration-short4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                        <div className="w-9 h-9 bg-surface-container-high rounded-md flex items-center justify-center border border-outline-variant/30 overflow-hidden">
                            {approval.image && !imageError ? (
                                <img
                                    src={approval.image}
                                    alt={equipmentTitle || approval.equipmentCategory}
                                    className="w-full h-full object-cover mix-blend-multiply opacity-85"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <MaterialIcon name={fallbackIcon} size={16} className="text-on-surface-variant" />
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-body-medium font-medium text-on-surface truncate">{equipmentTitle}</span>
                            {approval.urgency === 'high' && (
                                <StatusBadge status="high" size="sm" className="py-0 leading-none shrink-0" />
                            )}
                            <span className="hidden medium:inline text-label-small text-on-surface-variant truncate">
                                {approval.equipmentCategory || 'Demande'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 mt-0.5">
                            <span className="text-label-small text-on-surface-variant truncate">
                                {isDelegated
                                    ? `${approval.requesterName} → ${approval.beneficiaryName}`
                                    : approval.requesterName}
                            </span>
                            <span className={cn('hidden medium:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-small font-medium', stepDetails.bg, stepDetails.color)}>
                                {stepDetails.icon}
                                {stepDetails.label}
                            </span>
                        </div>
                        {decisionNote && (
                            <p
                                className="text-label-small text-on-surface-variant truncate mt-0.5"
                                title={`${getDecisionNoteLabel(decisionNote.kind)} — ${decisionNote.reason}`}
                            >
                                <span className="font-medium">{getDecisionNoteLabel(decisionNote.kind)}</span>
                                {' — « '}{decisionNote.reason}{' »'}
                            </p>
                        )}
                    </div>

                    <span className="text-label-small text-on-surface-variant whitespace-nowrap shrink-0">
                        {formatDate(approval.createdAt)}
                    </span>

                    {/* Actions inline en rangée dense (Approbations desktop, X14/§4.3) —
                        mêmes SecurityGate que la carte, logique de transition inchangée */}
                    {showActions && onApprove && onReject && stepDetails.btnText && (
                        <div className="flex items-center gap-2 shrink-0">
                            <SecurityGate
                                onVerified={(reason) => onReject(approval, reason)}
                                title={rejectLabel}
                                description={`${rejectLabel} cette demande ?`}
                                reasonField={rejectReasonField}
                                entityId={approval.id}
                                entityName={equipmentTitle}
                                trigger={
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        className="min-w-0 px-3 text-error border-error/40 hover:bg-error-container/20"
                                        icon={<MaterialIcon name={rejectIcon} size={16} />}
                                    >
                                        {rejectLabel}
                                    </Button>
                                }
                            />
                            <SecurityGate
                                onVerified={() => onApprove(approval)}
                                title={stepDetails.btnText}
                                description="Confirmer cette action."
                                entityId={approval.id}
                                entityName={equipmentTitle}
                                trigger={
                                    <Button
                                        variant="tonal"
                                        size="sm"
                                        className="min-w-0 px-3"
                                        icon={stepDetails.icon}
                                    >
                                        {stepDetails.btnText}
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group border-b border-outline-variant/50 last:border-0 bg-surface p-3 medium:p-4 hover:bg-surface-container-low transition-colors duration-short4">
            <div className="flex items-start gap-3">
                <div className="shrink-0 relative">
                    <div className="w-11 h-11 bg-surface-container-high rounded-md flex items-center justify-center border border-outline-variant/30 overflow-hidden">
                        {approval.image && !imageError ? (
                            <img
                                src={approval.image}
                                alt={equipmentTitle || approval.equipmentCategory}
                                className="w-full h-full object-cover mix-blend-multiply opacity-85"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <MaterialIcon name={fallbackIcon} size={18} className="text-on-surface-variant" />
                        )}
                    </div>
                    {approval.assignedEquipmentId && (
                        <div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary rounded-full p-0.5 border border-surface text-label-small">
                            <MaterialIcon name="check" size={10} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="min-w-0">
                        <div className="flex items-start gap-2">
                            <span className="text-title-small font-medium text-on-surface leading-snug line-clamp-2 break-words">{equipmentTitle}</span>
                            {approval.urgency === 'high' && (
                                <StatusBadge status="high" size="sm" className="py-0 leading-none shrink-0" />
                            )}
                        </div>
                        <p className="text-body-small text-on-surface-variant line-clamp-2 mt-0.5">
                            {approval.reason || 'Aucune raison'}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center -space-x-1 shrink-0">
                                <UserAvatar name={approval.requesterName} src={requesterAvatar} size="sm" className="border border-surface" />
                                {isDelegated && (
                                    <>
                                        <MaterialIcon name="arrow_right_alt" size={14} className="text-on-surface-variant mx-1" />
                                        <UserAvatar name={approval.beneficiaryName} src={beneficiaryAvatar} size="sm" className="border border-surface" />
                                    </>
                                )}
                            </div>
                            <span className="text-label-small text-on-surface-variant truncate">
                                {isDelegated
                                    ? `${approval.requesterName} → ${approval.beneficiaryName}`
                                    : approval.requesterName}
                            </span>
                        </div>

                        <span className="text-label-small text-on-surface-variant shrink-0">
                            {formatDate(approval.createdAt)}
                        </span>
                    </div>

                    <div>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-small font-medium', stepDetails.bg, stepDetails.color)}>
                            {stepDetails.icon}
                            {stepDetails.label}
                        </span>
                    </div>

                    {decisionNote && (
                        <div className="flex items-start gap-1.5 rounded-md bg-surface-container-high/60 px-2.5 py-1.5">
                            <MaterialIcon name="comment" size={14} className="text-on-surface-variant mt-0.5 shrink-0" />
                            <p className="text-body-small text-on-surface-variant min-w-0 break-words">
                                <span className="font-medium text-on-surface">{getDecisionNoteLabel(decisionNote.kind)}</span>
                                {' — « '}{decisionNote.reason}{' »'}
                            </p>
                        </div>
                    )}

                    {showActions && onApprove && onReject && stepDetails.btnText && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <SecurityGate
                                onVerified={(reason) => onReject(approval, reason)}
                                title={rejectLabel}
                                description={`${rejectLabel} cette demande ?`}
                                reasonField={rejectReasonField}
                                entityId={approval.id}
                                entityName={equipmentTitle}
                                trigger={
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        className="w-full min-w-0 px-3 text-error border-error/40 hover:bg-error-container/20"
                                        icon={<MaterialIcon name={rejectIcon} size={16} />}
                                    >
                                        {rejectLabel}
                                    </Button>
                                }
                            />
                            <SecurityGate
                                onVerified={() => onApprove(approval)}
                                title={stepDetails.btnText}
                                description="Confirmer cette action."
                                entityId={approval.id}
                                entityName={equipmentTitle}
                                trigger={
                                    <Button
                                        variant="tonal"
                                        size="sm"
                                        className="w-full min-w-0 px-3"
                                        icon={stepDetails.icon}
                                    >
                                        {stepDetails.btnText}
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
