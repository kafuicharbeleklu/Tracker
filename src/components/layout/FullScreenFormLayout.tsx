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

    /*
     * **Quand le geste est dans la barre, il n'y a pas de pied.** 04.3 dessine deux
     * gabarits : la saisie d'une fiche porte « Enregistrer » en haut et rien en bas ;
     * l'import porte un bouton pleine largeur en pied et rien en haut. Le pied ne
     * gardait ici qu'un « Annuler » solitaire — une barre entière pour le geste que la
     * flèche de retour fait déjà.
     */
    const defaultFooterActions =
        submitButtonLocation === 'footer' ? (
            <>
                <Button variant="outlined" onClick={onCancel} disabled={isSaving}>
                    Annuler
                </Button>
                <SaveButton />
            </>
        ) : null;

    /*
     * `.tbar .save` de 04.3 — **un mot, pas un bouton plein.** La planche pose
     * « Enregistrer » en 16 px sur 500, sans fond ni glyphe, dans la barre du haut :
     * l'écran n'a qu'un geste, et un aplat de plus n'en fait pas deux. Le pied à deux
     * boutons reste le gabarit des écrans qui posent une alternative.
     */
    const headerActions =
        submitButtonLocation === 'header' ? (
            <Button
                type="submit"
                form={formId}
                variant="text"
                disabled={isSaving}
                className="text-on-surface h-12 px-3 text-[16px] font-medium"
            >
                {saveLabel}
            </Button>
        ) : null;

    return (
        <FullScreenLayout
            title={title}
            subtitle={subtitle}
            /* La barre de 04.3 porte une **flèche de retour** à gauche et rien à
               droite que son geste : sur un écran plein, on revient d'où l'on vient,
               on ne « ferme » pas une fenêtre qui n'en est pas une. */
            onBack={onCancel}
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
