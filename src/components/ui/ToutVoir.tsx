import React from 'react';
import { CaretRight } from '@phosphor-icons/react';

import { cn } from '../../lib/utils';
import Button from './Button';
import Icon from './Icon';

/**
 * **Une carte montre une part, sa page montre tout** (08/10 pour les locaux d'un site,
 * étendu à toutes les cartes le 09/10).
 *
 * Une carte ne défile pas dans sa hauteur. Elle montre le début de sa liste et renvoie au
 * reste sur une page à part, comme « Derniers événements » renvoie à l'historique.
 * `ListeBornee`, qui bornait la carte et faisait défiler la suite dedans, est retirée :
 * une liste dans une liste, et un fondu pour dire qu'il fallait y penser.
 *
 * `ToutVoir` est ce renvoi — « Tous les modèles 23 › » —, `PiedDeCarte` le pied qui le
 * porte sous un filet. Le pied ne paraît que si la carte ne montre pas tout : un renvoi
 * vers une page qui redit la carte serait un geste pour rien.
 */

/** La hauteur d'un `PiedDeCarte`, filet compris — ce qu'une carte mesurée lui réserve. */
export const HAUTEUR_DU_PIED = 49;

export const ToutVoir: React.FC<{
    libelle: string;
    /** Le compte entier, celui de la page — pas ce qu'il reste à voir. */
    total?: number;
    onOuvrir: () => void;
    className?: string;
}> = ({ libelle, total, onOuvrir, className }) => (
    <Button
        variant="text"
        onClick={onOuvrir}
        className={cn(
            'text-on-surface text-ts-control -mr-2 ml-auto min-h-12 gap-1 px-2 font-medium',
            className,
        )}
    >
        {libelle}
        {total !== undefined && <span className="text-text-secondary tabular-nums">{total}</span>}
        <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
    </Button>
);

export const PiedDeCarte: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <div
        className={cn(
            'border-outline-variant flex min-h-12 shrink-0 items-center justify-between gap-3 border-t',
            className,
        )}
    >
        {children}
    </div>
);
