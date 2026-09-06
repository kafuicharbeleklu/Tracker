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
 *
 * ## Les mesures, arrêtées le 06/09
 *
 * *« Cinq métriques coexistaient pour le même état vide. »* Le canon est celui des
 * pages — 03.3, 09.1, 16.1 et les écrans de finances — et cette planche s'y range :
 * motif rond de **96** sur le creux, titre **22 sur 28** en Archivo, phrase **16 sur
 * 24** en encre secondaire bornée à 280, marges **24 · 16 · 64**, **16** entre les
 * blocs, un ou deux gestes de 48 empilés à 12. Le composant portait un motif de 112,
 * un titre de 20 et une phrase de 14.
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
    /**
     * `.vnext` — le panneau que 03.3 pose **sous** l'état vide : « ce qui arrivera
     * ici ». Une carte pleine largeur, alignée à gauche, qui dit ce qui remplira la
     * file. C'est ce qui distingue un vide **rassurant** d'un vide muet : la phrase
     * en 12 px ne peut porter ni titre ni liste, et trois lignes à glyphe s'y
     * écrasaient en une phrase de 130 signes.
     */
    after?: React.ReactNode;
    className?: string;
}

const ScreenState: React.FC<ScreenStateProps> = ({
    icon,
    title,
    description,
    actions,
    footnote,
    after,
    className,
}) => (
    <div
        className={cn(
            'flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-6 pb-16 text-center',
            className,
        )}
    >
        <span className="bg-surface-container text-text-tertiary flex h-24 w-24 items-center justify-center rounded-full">
            <Icon glyph={icon} size={32} />
        </span>

        <div>
            <p className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                {title}
            </p>
            {description && (
                <p className="text-on-surface-variant mx-auto mt-1 max-w-[280px] text-[16px] leading-6 text-pretty">
                    {description}
                </p>
            )}
        </div>

        {actions && (
            <div className="flex w-full max-w-[280px] flex-col gap-3 [&>*]:w-full">{actions}</div>
        )}

        {/* `.lfoot` — le fait de pied : une heure de dernière lecture, un compte.
            12 sur 16, encre tertiaire, chiffres tabulaires. */}
        {footnote && (
            <p className="text-text-tertiary mx-auto max-w-[280px] text-[12px] leading-4 tabular-nums">
                {footnote}
            </p>
        )}

        {after && <div className="rounded-card bg-surface mt-1 w-full p-4 text-left">{after}</div>}
    </div>
);

export default ScreenState;
