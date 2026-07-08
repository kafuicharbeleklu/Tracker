import React, { useId, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import BottomSheet from './BottomSheet';
import Button from './Button';
import { FabContainer } from './FabContainer';
import FloatingActionButton from './FloatingActionButton';
import MaterialIcon from './MaterialIcon';

interface ListActionFabItem {
    id: string;
    label: string;
    icon: string;
    onSelect: () => void;
    variant?: 'filled' | 'outlined' | 'text';
    disabled?: boolean;
}

interface ListActionFabProps {
    label: string;
    sheetTitle?: string;
    actions: ListActionFabItem[];
    className?: string;
    disabled?: boolean;
}

const ListActionFab: React.FC<ListActionFabProps> = ({
    label,
    sheetTitle,
    actions,
    className,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const sheetId = `list-action-sheet-${useId().replace(/:/g, '')}`;

    const resolvedActions = useMemo(() => actions.filter((action) => Boolean(action.label)), [actions]);

    if (resolvedActions.length === 0) {
        return null;
    }

    return (
        <>
            <FabContainer
                className={cn('right-4', className)}
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
                description={`Actions ${label}`}
            >
                <FloatingActionButton
                    icon="add"
                    size="medium"
                    variant="primary"
                    className="!bg-primary !text-on-primary"
                    aria-label={`Ouvrir les actions ${label.toLowerCase()}`}
                    aria-controls={sheetId}
                    aria-expanded={open}
                    onClick={() => setOpen(true)}
                    disabled={disabled}
                />
            </FabContainer>

            <BottomSheet
                id={sheetId}
                open={open}
                onClose={() => setOpen(false)}
                title={sheetTitle ?? `Actions ${label}`}
            >
                <div className="space-y-3">
                    {resolvedActions.map((action) => (
                        <Button
                            key={action.id}
                            variant={action.variant ?? 'outlined'}
                            className="w-full justify-start"
                            icon={<MaterialIcon name={action.icon} size={18} />}
                            disabled={action.disabled}
                            onClick={() => {
                                setOpen(false);
                                action.onSelect();
                            }}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            </BottomSheet>
        </>
    );
};

export default ListActionFab;





