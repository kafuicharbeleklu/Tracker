import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';
import { IconGestureSizeContext } from '../../hooks/useIconGestureSize';
import { cn } from '../../lib/utils';

/**
 * **La flèche de retour, partout sauf à l'accueil** (08/10).
 *
 * Elle manquait aux destinations : au téléphone, aux onglets de la barre du bas (Actifs,
 * Tâches, Équipe) ; au bureau, à toute page que la barre latérale atteint (25/09 : « la barre
 * latérale mène déjà partout »). Le commanditaire y a vu un écart — une page avait sa flèche,
 * la voisine non. Elle suit le chemin parcouru (`goBack`), et ramène à l'accueil à défaut.
 *
 * Le geste du téléphone fait 48, son glyphe 24, calé sur le bord (`-ml-3`) ; celui du bureau
 * 40, glyphe 20, en encre secondaire, comme les gestes d'icône de son chrome (17.11).
 */
const FlecheDeRetour: React.FC<{
    onBack: () => void;
    /** Le chrome du téléphone (sous 840). */
    compact: boolean;
    label?: string;
    className?: string;
}> = ({ onBack, compact, label = 'Retour', className }) => (
    <IconGestureSizeContext.Provider value={compact ? 48 : 40}>
        <Button
            variant="text"
            iconOnly
            aria-label={label}
            onClick={onBack}
            className={cn(
                'shrink-0 rounded-md',
                compact
                    ? 'text-on-surface hover:bg-surface-container -ml-3'
                    : 'text-on-surface-variant hover:text-on-surface -ml-2.5',
                className,
            )}
        >
            <Icon glyph={ArrowLeft} size={compact ? 24 : 20} />
        </Button>
    </IconGestureSizeContext.Provider>
);

export default FlecheDeRetour;
