import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import SideSheet from '../ui/SideSheet';
import { cn } from '../../lib/utils';
import { formatDate, formatDateTime } from '../../lib/financial';
import { getHistoryEventIcon, getHistoryEventTitle } from '../../lib/businessRules';
import { HistoryEvent } from '../../types';

interface TransactionTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: HistoryEvent | null;
}

// Types avec une iconographie dédiée ; les autres retombent sur le rendu générique.
const SIMPLE_ACTION_PRESETS: Partial<
    Record<HistoryEvent['type'], { icon: string; colorClass: string }>
> = {
    CREATE: { icon: 'add_box', colorClass: 'bg-tertiary-container text-tertiary' },
    DELETE: { icon: 'delete', colorClass: 'bg-error-container text-error' },
    UPDATE: { icon: 'edit', colorClass: 'bg-secondary-container text-secondary' },
};

const TransactionTicketModal: React.FC<TransactionTicketModalProps> = ({
    isOpen,
    onClose,
    event,
}) => {
    if (!event) return null;

    const { equipmentSnapshot, userSnapshot, condition, previousUser } = event.metadata ?? {};
    const isAssignment = ['ASSIGN', 'ASSIGN_PENDING', 'ASSIGN_CONFIRMED'].includes(event.type);
    const isReturn = event.type === 'RETURN';

    const sheetTitle = isAssignment
        ? 'Ticket d’attribution'
        : isReturn
          ? 'Reçu de retour'
          : 'Détail de l’activité';

    const renderAssignmentTicket = () => (
        <div className="bg-surface-container-lowest shadow-elevation-1 border-outline-variant relative w-full overflow-hidden rounded-xl border">
            <div className="bg-surface border-outline-variant absolute top-1/2 -left-3 z-10 h-6 w-6 rounded-full border-r" />
            <div className="bg-surface border-outline-variant absolute top-1/2 -right-3 z-10 h-6 w-6 rounded-full border-l" />

            <div className="bg-primary text-on-primary relative overflow-hidden p-5">
                <div className="bg-on-primary/20 pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-xl" />
                <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-label-small mb-1 tracking-widest uppercase opacity-60">
                            Bon de Mouvement
                        </p>
                        <h3 className="text-title-large tracking-tight">Attribution Matériel</h3>
                    </div>
                    <div className="bg-on-primary/20 rounded-sm p-2 backdrop-blur-sm">
                        {equipmentSnapshot?.type === 'Laptop' ? (
                            <MaterialIcon name="laptop" size={24} />
                        ) : equipmentSnapshot?.type === 'Phone' ? (
                            <MaterialIcon name="smartphone" size={24} />
                        ) : (
                            <MaterialIcon name="monitor" size={24} />
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="mb-6 flex items-start gap-4">
                    <div className="bg-surface-container-low border-outline-variant flex h-16 w-16 shrink-0 items-center justify-center rounded-md border">
                        {equipmentSnapshot?.image ? (
                            <img
                                src={equipmentSnapshot.image}
                                className="h-full w-full object-contain p-2 mix-blend-multiply"
                                alt=""
                            />
                        ) : (
                            <MaterialIcon
                                name="inventory_2"
                                size={20}
                                className="text-on-surface-variant"
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-title-medium text-on-surface mb-1 truncate">
                            {equipmentSnapshot?.name || event.targetName}
                        </h4>
                        <div className="mb-2 flex flex-wrap gap-2">
                            {equipmentSnapshot?.assetId && (
                                <span className="text-label-small bg-surface-container text-on-surface-variant border-outline-variant rounded-xs border px-2 py-0.5 font-mono">
                                    {equipmentSnapshot.assetId}
                                </span>
                            )}
                            {equipmentSnapshot?.type && (
                                <span className="text-label-small text-on-surface-variant bg-surface-container-low border-outline-variant rounded-xs border px-2 py-0.5 uppercase">
                                    {equipmentSnapshot.type}
                                </span>
                            )}
                        </div>
                        {equipmentSnapshot?.model && (
                            <p className="text-label-small text-on-surface-variant truncate">
                                {equipmentSnapshot.model}
                            </p>
                        )}
                    </div>
                </div>

                <div className="border-outline-variant relative my-6 border-b-2 border-dashed">
                    <div className="text-on-surface-variant text-label-small bg-surface-container-lowest absolute -top-1.5 left-0 pr-2 font-mono">
                        LINK
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {userSnapshot?.avatar ? (
                        <img
                            src={userSnapshot.avatar}
                            className="border-surface-container-low shadow-elevation-1 h-12 w-12 rounded-full border-2"
                            alt=""
                        />
                    ) : (
                        <div className="bg-surface-container border-outline-variant flex h-12 w-12 items-center justify-center rounded-full border">
                            <MaterialIcon
                                name="person"
                                size={18}
                                className="text-on-surface-variant"
                            />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-label-small text-on-surface-variant mb-1 tracking-widest uppercase">
                            Bénéficiaire
                        </p>
                        <h4 className="text-title-small text-on-surface truncate">
                            {userSnapshot?.name || 'Utilisateur'}
                        </h4>
                        {userSnapshot?.email && (
                            <div className="text-body-small text-on-surface-variant mt-1 flex items-center gap-2 truncate">
                                <MaterialIcon name="mail" size={12} /> {userSnapshot.email}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-outline-variant mt-6 flex flex-col gap-4 border-t pt-5">
                    <div>
                        <p className="text-label-small text-on-surface-variant mb-1 tracking-widest uppercase">
                            Date d'effet
                        </p>
                        <div className="text-title-small text-on-surface flex items-center gap-2">
                            <MaterialIcon
                                name="calendar_today"
                                size={16}
                                className="text-primary"
                            />
                            {formatDate(event.timestamp)}
                        </div>
                    </div>
                    <div>
                        <p className="text-label-small text-on-surface-variant mb-1 tracking-widest uppercase">
                            Validé par
                        </p>
                        <div className="text-title-small text-on-surface flex items-center gap-2">
                            {event.actorName}{' '}
                            <MaterialIcon name="check_circle" size={16} className="text-tertiary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReturnReceipt = () => (
        <div className="bg-surface-container-lowest shadow-elevation-1 border-outline-variant relative flex w-full flex-col overflow-hidden rounded-xl border p-0">
            <div
                className={cn(
                    'h-3 w-full',
                    condition === 'Excellent'
                        ? 'bg-tertiary'
                        : condition === 'Bon'
                          ? 'bg-secondary'
                          : condition === 'Moyen'
                            ? 'bg-primary'
                            : 'bg-error',
                )}
            />

            <div className="flex-1 p-5 pb-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-label-small text-on-surface-variant mb-1 tracking-widest uppercase">
                            Type de transaction
                        </p>
                        <h3 className="text-title-large text-on-surface flex items-center gap-2">
                            <MaterialIcon name="task" className="text-primary" /> Reçu de retour
                        </h3>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-label-small text-on-surface-variant mb-1 tracking-widest uppercase">
                            Date
                        </p>
                        <p className="text-title-small text-on-surface">
                            {formatDate(event.timestamp)}
                        </p>
                    </div>
                </div>

                <div className="bg-surface-container-low border-outline-variant mb-6 flex flex-col gap-4 rounded-md border p-4">
                    <div className="flex items-center gap-3">
                        <div className="border-outline-variant bg-surface-container-highest text-title-small text-on-surface-variant flex h-9 w-9 items-center justify-center rounded-full border">
                            {previousUser ? previousUser[0] : '?'}
                        </div>
                        <div className="leading-tight">
                            <p className="text-label-small text-on-surface-variant uppercase">
                                Origine
                            </p>
                            <p className="text-label-large text-on-surface">
                                {previousUser || 'Utilisateur'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <MaterialIcon name="south" size={16} className="text-outline" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'shadow-elevation-1 flex h-9 w-9 items-center justify-center rounded-full',
                                condition === 'Mauvais'
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-tertiary-container text-on-tertiary-container',
                            )}
                        >
                            {condition === 'Mauvais' ? (
                                <MaterialIcon name="build" size={16} />
                            ) : (
                                <MaterialIcon name="check_circle" size={16} />
                            )}
                        </div>
                        <div className="leading-tight">
                            <p className="text-label-small text-on-surface-variant uppercase">
                                Destination
                            </p>
                            <p className="text-label-large text-on-surface">
                                {condition === 'Mauvais' ? 'Maintenance' : 'Stock IT'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-outline-variant mb-6 flex gap-4 border-b border-dashed pb-6">
                    <div className="bg-surface-container-lowest border-outline-variant flex h-16 w-16 shrink-0 items-center justify-center rounded-md border p-2">
                        {equipmentSnapshot?.image ? (
                            <img
                                src={equipmentSnapshot.image}
                                className="h-full w-full object-contain mix-blend-multiply"
                                alt=""
                            />
                        ) : (
                            <MaterialIcon
                                name="inventory_2"
                                size={20}
                                className="text-on-surface-variant"
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-title-small text-on-surface mb-1 truncate">
                            {equipmentSnapshot?.name || event.targetName}
                        </h4>
                        {equipmentSnapshot?.assetId && (
                            <p className="text-label-small text-on-surface-variant mb-2 font-mono">
                                #{equipmentSnapshot.assetId}
                            </p>
                        )}
                        <div
                            className={cn(
                                'text-label-small inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 uppercase',
                                condition === 'Excellent'
                                    ? 'bg-tertiary-container text-on-tertiary-container'
                                    : condition === 'Bon'
                                      ? 'bg-secondary-container text-on-secondary-container'
                                      : condition === 'Moyen'
                                        ? 'bg-primary-container text-on-primary-container'
                                        : 'bg-error-container text-on-error-container',
                            )}
                        >
                            <span>État : {condition || 'Non spécifié'}</span>
                        </div>
                    </div>
                </div>

                <p className="text-label-small text-on-surface-variant text-center tracking-widest uppercase">
                    Reçu généré par {event.actorName}
                </p>
            </div>
        </div>
    );

    const renderSimpleAction = (icon: React.ReactNode, title: string, colorClass: string) => (
        <div className="w-full py-4 text-center">
            <div
                className={cn(
                    'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full',
                    colorClass,
                )}
            >
                {icon}
            </div>
            <h3 className="text-title-large text-on-surface mb-2">{title}</h3>
            <p className="text-body-medium text-on-surface-variant mb-5">{event.description}</p>

            <div className="bg-surface-container-low border-outline-variant rounded-md border p-4 text-left">
                <div className="text-body-small mb-2 flex justify-between gap-4">
                    <span className="text-on-surface-variant">Cible</span>
                    <span className="text-label-large text-on-surface text-right">
                        {event.targetName}
                    </span>
                </div>
                <div className="text-body-small flex justify-between gap-4">
                    <span className="text-on-surface-variant">Date</span>
                    <span className="text-label-large text-on-surface text-right">
                        {formatDateTime(event.timestamp)}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <SideSheet
            open={isOpen}
            onClose={onClose}
            title={sheetTitle}
            description="Détails contextualisés de l’événement sélectionné."
            width="standard"
            className="rounded-none"
        >
            <div className="space-y-4">
                {isAssignment
                    ? renderAssignmentTicket()
                    : isReturn
                      ? renderReturnReceipt()
                      : renderSimpleAction(
                            <MaterialIcon
                                name={
                                    SIMPLE_ACTION_PRESETS[event.type]?.icon ??
                                    getHistoryEventIcon(event.type)
                                }
                                size={32}
                            />,
                            getHistoryEventTitle(event.type),
                            SIMPLE_ACTION_PRESETS[event.type]?.colorClass ??
                                'bg-surface-container text-on-surface-variant',
                        )}
            </div>
        </SideSheet>
    );
};

export default TransactionTicketModal;
