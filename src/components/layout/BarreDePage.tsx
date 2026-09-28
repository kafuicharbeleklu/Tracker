import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { cn } from '../../lib/utils';

/**
 * **La barre du haut d'une page au téléphone — une seule géométrie** (24/09).
 *
 * Relevé à 393 : les listes posaient leur titre à **56 / 16** dans le bloc `.top` (intérieur
 * `8 / 16 / 12`, rangée de 48, retour rentré de 12), mais les fiches, les sous-écrans de
 * Paramètres, la fiche d'un rôle, la campagne, « Lignes du budget » et les formulaires le
 * posaient à **60 / 12** dans une barre de 56 (intérieur `0 8 0 4`). En passant d'une liste
 * à une fiche, le titre sautait de 4 px à droite et de 4 px vers le haut.
 *
 * Toutes les barres prennent donc celle des listes : la flèche de retour à 16 du bord
 * (carré de 48 rentré de 12, glyphe de 24), le titre en 28 sur 32 à 56, les gestes à droite
 * rentrés de 12 pour que leur glyphe tombe à 16 du bord droit. Ce qui suit le titre
 * (`children` : une bande de recherche, un fil) se pose dessous, à 12.
 */
interface BarreDePageProps {
    title: React.ReactNode;
    /**
     * Une ligne sous le titre — le lieu et l'état d'une campagne (28/09). Le titre descend
     * alors à 22 sur 28 : deux lignes dans la rangée de 48, sans grandir la barre.
     */
    subtitle?: React.ReactNode;
    onBack?: () => void;
    /** Le libellé du retour, quand « Retour » ne dit pas où l'on va. */
    backLabel?: string;
    /** Les gestes de droite : ⋮, enregistrer, fermer. */
    actions?: React.ReactNode;
    /** Ce qui vient sous la rangée du titre. */
    children?: React.ReactNode;
    className?: string;
}

const BarreDePage: React.FC<BarreDePageProps> = ({
    title,
    subtitle,
    onBack,
    backLabel = 'Retour',
    actions,
    children,
    className,
}) => (
    <div
        className={cn(
            'border-outline-variant bg-surface flex flex-col gap-3 border-b px-4 pt-2 pb-3',
            className,
        )}
    >
        <div className="flex min-h-12 items-center gap-1">
            {onBack && (
                <Button
                    variant="text"
                    iconOnly
                    aria-label={backLabel}
                    onClick={onBack}
                    className="-ml-3 shrink-0"
                >
                    <Icon glyph={ArrowLeft} size={24} />
                </Button>
            )}
            {subtitle ? (
                <div className="min-w-0 flex-1">
                    <h1 className="font-brand text-on-surface truncate text-[1.375rem] leading-7 font-semibold tracking-[-0.015em]">
                        {title}
                    </h1>
                    <p className="text-on-surface-variant truncate text-[0.75rem] leading-4">
                        {subtitle}
                    </p>
                </div>
            ) : (
                <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 flex-1 truncate font-semibold tracking-[-0.02em]">
                    {title}
                </h1>
            )}
            {actions && <div className="-mr-3 flex shrink-0 items-center">{actions}</div>}
        </div>
        {children}
    </div>
);

export default BarreDePage;
