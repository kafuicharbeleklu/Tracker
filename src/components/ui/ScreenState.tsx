import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * État d'écran — planche **17.1** (composant partagé, 4 états).
 *
 * **Une forme pour l'écran vide, la page introuvable et l'accès refusé.** Les deux
 * portes fermées n'ont pas de forme propre : elles empruntent l'état vide — même
 * place du titre, même geste de sortie, la seule image que le produit s'autorise.
 * Une seule chose change d'un cas à l'autre : **ce qu'on peut faire ensuite**.
 *
 * Ce que la planche interdit, et qui est du contenu, pas de la forme :
 *
 * - **Un écran introuvable ne montre pas son code.** Le *404* tombe — c'est un mot
 *   d'un autre métier, adressé à personne. *« Vérifiez le lien »* tombe aussi : sur
 *   un téléphone, personne n'a tapé de lien. Reste le seul fait vrai — ce qui était
 *   là n'y est plus — et une porte de sortie qui mène quelque part.
 * - **Un accès refusé ne fait pas deviner sa cause.** L'écran actuel liste trois
 *   causes possibles et laisse la personne trier. Le produit **sait** laquelle est la
 *   sienne — compte en attente, suspendu, hors liste — et il la dit. Il nomme aussi
 *   **qui** peut ouvrir la porte : un nom, pas « l'administrateur ».
 *
 * L'icône de 32 px est le seul emploi de cette taille, **une fois par écran** (§0.2),
 * et elle ne remplace pas le titre : elle l'accompagne (I3).
 */

interface ScreenStateProps {
    icon: PhosphorGlyph;
    /** Le fait, en toutes lettres — « Cette page n'existe plus ». */
    title: string;
    /** Ce qui a pu se passer, et ce qui reste. Une ou deux phrases. */
    description?: React.ReactNode;
    /**
     * Les portes qui servent — deux au plus, empilées, la première en geste
     * primaire. Une porte qui ne mène nulle part n'en est pas une : pas de « retour
     * en arrière » depuis un écran qui n'a pas d'arrière.
     */
    actions?: React.ReactNode;
    /** Une précision de pied — ce que l'écran ne dit pas, et pourquoi. */
    footnote?: React.ReactNode;
    className?: string;
}

const ScreenState: React.FC<ScreenStateProps> = ({
    icon,
    title,
    description,
    actions,
    footnote,
    className,
}) => (
    <div
        className={cn(
            'flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-14 pt-7 text-center',
            className
        )}
    >
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Icon glyph={icon} size={32} />
        </span>

        <div>
            <p className="font-brand text-2xl font-semibold leading-7 tracking-tight text-on-surface">
                {title}
            </p>
            {description && (
                <p className="mx-auto mt-2 max-w-[280px] text-body-medium leading-5 text-text-secondary">
                    {description}
                </p>
            )}
        </div>

        {actions && (
            <div className="flex w-full max-w-[280px] flex-col gap-2.5 [&>*]:w-full">{actions}</div>
        )}

        {footnote && (
            <p className="mx-auto max-w-[280px] text-body-small text-on-surface-variant">{footnote}</p>
        )}
    </div>
);

export default ScreenState;
