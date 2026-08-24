import React, { useId } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import { FullScreenLayout } from './FullScreenLayout';

interface FullScreenFormLayoutProps {
    title: string;
    /** Ce sur quoi on travaille, sous le titre — le `.aid` de 04.3. */
    subtitle?: string;
    onCancel: () => void;
    onSave: () => void;
    children: React.ReactNode;
    actions?: React.ReactNode;
    saveLabel?: string;
    isSaving?: boolean;
    submitButtonLocation?: 'header' | 'footer';
    /**
     * Passe à la coque. Un écran dont le contenu est fait de **cartes** doit poser sa
     * toile — `bg-background` : sur la surface blanche du plein écran, une carte
     * blanche ne se voit pas.
     */
    className?: string;
}

export const FullScreenFormLayout: React.FC<FullScreenFormLayoutProps> = ({
    title,
    subtitle,
    onCancel,
    onSave,
    children,
    actions,
    saveLabel = 'Enregistrer',
    isSaving = false,
    submitButtonLocation = 'footer',
    className,
}) => {
    const formId = useId().replace(/:/g, '');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isSaving) {
            onSave();
        }
    };

    const SaveButton = ({
        className,
        variant = 'filled',
    }: {
        className?: string;
        variant?: 'filled' | 'text' | 'tonal';
    }) => (
        <Button
            type="submit"
            form={formId}
            variant={variant}
            icon={
                submitButtonLocation === 'footer' ? (
                    <MaterialIcon name="save" size={18} />
                ) : (
                    <MaterialIcon name="check" size={18} />
                )
            }
            disabled={isSaving}
            className={className}
        >
            {saveLabel}
        </Button>
    );

    const defaultFooterActions = (
        <>
            <Button variant="outlined" onClick={onCancel} disabled={isSaving}>
                Annuler
            </Button>
            {submitButtonLocation === 'footer' && <SaveButton />}
        </>
    );

    const headerActions =
        submitButtonLocation === 'header' ? (
            <SaveButton variant="filled" className="text-label-medium h-9 px-4" /> // Compact button for header
        ) : null;

    return (
        <FullScreenLayout
            title={title}
            subtitle={subtitle}
            onClose={onCancel}
            headerActions={headerActions}
            footerActions={actions || defaultFooterActions}
            className={className}
        >
            <form id={formId} onSubmit={handleSubmit} className="space-y-6">
                {children}
            </form>
        </FullScreenLayout>
    );
};
