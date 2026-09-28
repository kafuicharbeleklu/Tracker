import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { TINT_CLASS, type Tint } from '../../../components/ui/FormParts';
import { cn } from '../../../lib/utils';
import { NOM_SUR_UNE_LIGNE, infobulle } from '../../../lib/nomLong';

interface RangeeDeCampagneProps {
    glyph: PhosphorGlyph;
    tint?: Tint;
    titre: string;
    sousTitre?: string;
    /** Toucher ou cliquer le corps de la rangée ouvre la fiche. */
    onOuvrir?: () => void;
    libelleOuvrir?: string;
    /** Les gestes et la marque de droite. */
    fin?: React.ReactNode;
}

/**
 * **La rangée d'une campagne** (28/09). **Le corps ouvre la fiche** et, à droite, les gestes
 * rapides (le rond ✓ au téléphone ; le crayon et « Retrouvé » au bureau) : deux cibles côte
 * à côte, que `FactRow` ne sait pas porter — sa rangée entière est un seul bouton, et un
 * bouton ne peut pas en contenir un autre.
 *
 * **Le survol et l'appui couvrent la rangée d'un bord à l'autre de la carte** (relevé de
 * l'utilisateur, 28/09 : *« ni d'état d'action hover »*) — la forme des rangées cliquables
 * du produit (`ActionCard`, la fiche d'un utilisateur) : le creux `surface-container`, et
 * deux ombres latérales de la même teinte qui le prolongent sur la marge de la carte, sans
 * toucher aux filets qui restent rentrés. Une rangée qui ne s'ouvre pas ne réagit pas.
 */
const RangeeDeCampagne: React.FC<RangeeDeCampagneProps> = ({
    glyph,
    tint,
    titre,
    sousTitre,
    onOuvrir,
    libelleOuvrir,
    fin,
}) => {
    const corps = (
        <>
            <span
                aria-hidden="true"
                className={cn(
                    'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center',
                    tint ? TINT_CLASS[tint] : 'bg-surface-container text-on-surface-variant',
                )}
            >
                <Icon glyph={glyph} size={20} />
            </span>
            <span className="min-w-0 flex-1">
                <span
                    title={infobulle(titre)}
                    className={cn(
                        'text-on-surface text-ts-body leading-ts-body deux:font-medium',
                        NOM_SUR_UNE_LIGNE,
                    )}
                >
                    {titre}
                </span>
                {sousTitre && (
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                        {sousTitre}
                    </span>
                )}
            </span>
        </>
    );
    return (
        <div
            data-rangee=""
            className={cn(
                'border-outline-variant deux:gap-3.5 flex min-h-16 items-center gap-3 border-t first:border-t-0',
                onOuvrir &&
                    'duration-short4 ease-emphasized hover:bg-surface-container active:bg-surface-container-high deux:hover:shadow-[-20px_0_0_var(--tk-color-surface-container),20px_0_0_var(--tk-color-surface-container)] deux:active:shadow-[-20px_0_0_var(--tk-color-surface-container-high),20px_0_0_var(--tk-color-surface-container-high)] transition-[background-color,box-shadow] hover:shadow-[-16px_0_0_var(--tk-color-surface-container),16px_0_0_var(--tk-color-surface-container)] active:shadow-[-16px_0_0_var(--tk-color-surface-container-high),16px_0_0_var(--tk-color-surface-container-high)]',
            )}
        >
            {onOuvrir ? (
                <Button
                    variant="text"
                    layout="card"
                    aria-label={libelleOuvrir ? `${libelleOuvrir} — ${titre}` : undefined}
                    onClick={onOuvrir}
                    className="deux:gap-3.5 flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-none px-0 py-2.5 text-left font-normal whitespace-normal hover:bg-transparent active:scale-100"
                >
                    {corps}
                </Button>
            ) : (
                <div className="deux:gap-3.5 flex min-w-0 flex-1 items-center gap-3 py-2.5">
                    {corps}
                </div>
            )}
            {fin}
        </div>
    );
};

export default RangeeDeCampagne;
