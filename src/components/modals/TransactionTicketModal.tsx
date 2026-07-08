import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import SideSheet from '../ui/SideSheet';
import { cn } from '../../lib/utils';
import { formatDate, formatDateTime } from '../../lib/financial';
import { HistoryEvent } from '../../types';

interface TransactionTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: HistoryEvent | null;
}

const TransactionTicketModal: React.FC<TransactionTicketModalProps> = ({ isOpen, onClose, event }) => {
    if (!event) return null;

    const { equipmentSnapshot, userSnapshot, condition, previousUser } = event.metadata ?? {};
    const isAssignment = ['ASSIGN', 'ASSIGN_PENDING', 'ASSIGN_CONFIRMED'].includes(event.type);
    const isReturn = event.type === 'RETURN';
    const isCreation = event.type === 'CREATE';
    const isDeletion = event.type === 'DELETE';
    const isModification = event.type === 'UPDATE';

    const sheetTitle = isAssignment
        ? 'Ticket d’attribution'
        : isReturn
            ? 'Reçu de retour'
            : 'Détail de l’activité';

    const renderAssignmentTicket = () => (
        <div className="bg-surface-container-lowest rounded-xl shadow-elevation-1 overflow-hidden border border-outline-variant relative w-full">
            <div className="absolute -left-3 top-1/2 w-6 h-6 bg-surface rounded-full z-10 border-r border-outline-variant" />
            <div className="absolute -right-3 top-1/2 w-6 h-6 bg-surface rounded-full z-10 border-l border-outline-variant" />

            <div className="bg-primary p-5 text-on-primary relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-on-primary/20 rounded-full blur-xl pointer-events-none" />
                <div className="flex justify-between items-center relative z-10 gap-3">
                    <div>
                        <p className="text-label-small uppercase tracking-widest opacity-60 mb-1">Bon de Mouvement</p>
                        <h3 className="text-title-large tracking-tight">Attribution Matériel</h3>
                    </div>
                    <div className="bg-on-primary/20 p-2 rounded-sm backdrop-blur-sm">
                        {equipmentSnapshot?.type === 'Laptop'
                            ? <MaterialIcon name="laptop" size={24} />
                            : equipmentSnapshot?.type === 'Phone'
                                ? <MaterialIcon name="smartphone" size={24} />
                                : <MaterialIcon name="monitor" size={24} />}
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex gap-4 items-start mb-6">
                    <div className="w-16 h-16 bg-surface-container-low rounded-md flex items-center justify-center border border-outline-variant shrink-0">
                        {equipmentSnapshot?.image ? (
                            <img src={equipmentSnapshot.image} className="w-full h-full object-contain mix-blend-multiply p-2" alt="" />
                        ) : (
                            <MaterialIcon name="inventory_2" size={20} className="text-on-surface-variant" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-title-medium text-on-surface mb-1 truncate">{equipmentSnapshot?.name || event.targetName}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {equipmentSnapshot?.assetId && (
                                <span className="text-label-small font-mono bg-surface-container px-2 py-0.5 rounded-xs text-on-surface-variant border border-outline-variant">
                                    {equipmentSnapshot.assetId}
                                </span>
                            )}
                            {equipmentSnapshot?.type && (
                                <span className="text-label-small text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-xs border border-outline-variant uppercase">
                                    {equipmentSnapshot.type}
                                </span>
                            )}
                        </div>
                        {equipmentSnapshot?.model && (
                            <p className="text-label-small text-on-surface-variant truncate">{equipmentSnapshot.model}</p>
                        )}
                    </div>
                </div>

                <div className="border-b-2 border-dashed border-outline-variant my-6 relative">
                    <div className="absolute left-0 -top-1.5 text-on-surface-variant text-label-small bg-surface-container-lowest pr-2 font-mono">LINK</div>
                </div>

                <div className="flex gap-4 items-center">
                    {userSnapshot?.avatar ? (
                        <img src={userSnapshot.avatar} className="w-12 h-12 rounded-full border-2 border-surface-container-low shadow-elevation-1" alt="" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                            <MaterialIcon name="person" size={18} className="text-on-surface-variant" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">Bénéficiaire</p>
                        <h4 className="text-title-small text-on-surface truncate">{userSnapshot?.name || 'Utilisateur'}</h4>
                        {userSnapshot?.email && (
                            <div className="flex items-center gap-2 text-body-small text-on-surface-variant mt-1 truncate">
                                <MaterialIcon name="mail" size={12} /> {userSnapshot.email}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-outline-variant flex flex-col gap-4">
                    <div>
                        <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">Date d'effet</p>
                        <div className="flex items-center gap-2 text-title-small text-on-surface">
                            <MaterialIcon name="calendar_today" size={16} className="text-primary" />
                            {formatDate(event.timestamp)}
                        </div>
                    </div>
                    <div>
                        <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">Validé par</p>
                        <div className="flex items-center gap-2 text-title-small text-on-surface">
                            {event.actorName} <MaterialIcon name="check_circle" size={16} className="text-tertiary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReturnReceipt = () => (
        <div className="bg-surface-container-lowest p-0 rounded-xl shadow-elevation-1 border border-outline-variant relative overflow-hidden flex flex-col w-full">
            <div
                className={cn(
                    'h-3 w-full',
                    condition === 'Excellent'
                        ? 'bg-tertiary'
                        : condition === 'Bon'
                            ? 'bg-secondary'
                            : condition === 'Moyen'
                                ? 'bg-primary'
                                : 'bg-error'
                )}
            />

            <div className="p-5 pb-6 flex-1">
                <div className="flex justify-between items-start mb-6 gap-4">
                    <div>
                        <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">Type de transaction</p>
                        <h3 className="text-title-large text-on-surface flex items-center gap-2">
                            <MaterialIcon name="task" className="text-primary" /> Reçu de retour
                        </h3>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-label-small text-on-surface-variant uppercase tracking-widest mb-1">Date</p>
                        <p className="text-title-small text-on-surface">{formatDate(event.timestamp)}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6 bg-surface-container-low p-4 rounded-md border border-outline-variant">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-outline-variant bg-surface-container-highest flex items-center justify-center text-title-small text-on-surface-variant">
                            {previousUser ? previousUser[0] : '?'}
                        </div>
                        <div className="leading-tight">
                            <p className="text-label-small text-on-surface-variant uppercase">Origine</p>
                            <p className="text-label-large text-on-surface">{previousUser || 'Utilisateur'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <MaterialIcon name="south" size={16} className="text-outline" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center shadow-elevation-1',
                                condition === 'Mauvais'
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-tertiary-container text-on-tertiary-container'
                            )}
                        >
                            {condition === 'Mauvais' ? <MaterialIcon name="build" size={16} /> : <MaterialIcon name="check_circle" size={16} />}
                        </div>
                        <div className="leading-tight">
                            <p className="text-label-small text-on-surface-variant uppercase">Destination</p>
                            <p className="text-label-large text-on-surface">{condition === 'Mauvais' ? 'Maintenance' : 'Stock IT'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 pb-6 border-b border-dashed border-outline-variant">
                    <div className="w-16 h-16 bg-surface-container-lowest border border-outline-variant rounded-md flex items-center justify-center p-2 shrink-0">
                        {equipmentSnapshot?.image ? (
                            <img src={equipmentSnapshot.image} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                        ) : (
                            <MaterialIcon name="inventory_2" size={20} className="text-on-surface-variant" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-title-small text-on-surface mb-1 truncate">{equipmentSnapshot?.name || event.targetName}</h4>
                        {equipmentSnapshot?.assetId && (
                            <p className="text-label-small text-on-surface-variant mb-2 font-mono">#{equipmentSnapshot.assetId}</p>
                        )}
                        <div
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-small uppercase',
                                condition === 'Excellent'
                                    ? 'bg-tertiary-container text-on-tertiary-container'
                                    : condition === 'Bon'
                                        ? 'bg-secondary-container text-on-secondary-container'
                                        : condition === 'Moyen'
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-error-container text-on-error-container'
                            )}
                        >
                            <span>État : {condition || 'Non spécifié'}</span>
                        </div>
                    </div>
                </div>

                <p className="text-center text-label-small text-on-surface-variant uppercase tracking-widest">
                    Reçu généré par {event.actorName}
                </p>
            </div>
        </div>
    );

    const renderSimpleAction = (icon: React.ReactNode, title: string, colorClass: string) => (
        <div className="w-full text-center py-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5', colorClass)}>
                {icon}
            </div>
            <h3 className="text-title-large text-on-surface mb-2">{title}</h3>
            <p className="text-body-medium text-on-surface-variant mb-5">{event.description}</p>

            <div className="bg-surface-container-low p-4 rounded-md text-left border border-outline-variant">
                <div className="flex justify-between text-body-small mb-2 gap-4">
                    <span className="text-on-surface-variant">Cible</span>
                    <span className="text-label-large text-on-surface text-right">{event.targetName}</span>
                </div>
                <div className="flex justify-between text-body-small gap-4">
                    <span className="text-on-surface-variant">Date</span>
                    <span className="text-label-large text-on-surface text-right">{formatDateTime(event.timestamp)}</span>
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
            className="!rounded-none"
        >
            <div className="space-y-4">
                {isAssignment && renderAssignmentTicket()}
                {isReturn && renderReturnReceipt()}
                {isCreation && renderSimpleAction(<MaterialIcon name="add_box" size={32} />, 'Création', 'bg-tertiary-container text-tertiary')}
                {isDeletion && renderSimpleAction(<MaterialIcon name="delete" size={32} />, 'Suppression', 'bg-error-container text-error')}
                {isModification && renderSimpleAction(<MaterialIcon name="edit" size={32} />, 'Modification', 'bg-secondary-container text-secondary')}
            </div>
        </SideSheet>
    );
};

export default TransactionTicketModal;
