import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { Info } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Encart d'information — `.warn` des planches **14.1** et **11.1**, `.pv` de 11.1.
 *
 * **Ce n'est pas une alerte.** Il porte ce que la forme ne peut pas dire : où vit un
 * réglage voisin, ce qu'un décompte recouvre, pourquoi une case est vide. D'où la
 * surface encastrée et l'absence de rouge — le rouge reste à l'irréversible, et un
 * encart qui crie à chaque écran n'est plus lu nulle part.
 *
 * Pour l'échec d'un acte, ce n'est pas ce composant : voir `InlineError` (17.1).
 */

interface NoticeProps {
    /** Le pictogramme. `Info` par défaut ; un autre quand le sujet le mérite. */
    glyph?: PhosphorGlyph;
    children: React.ReactNode;
    className?: string;
}

const Notice: React.FC<NoticeProps> = ({ glyph = Info, children, className }) => (
    <div
        className={cn(
            'bg-surface-container text-text-secondary flex gap-2.5 rounded-md px-3 py-2.5 text-[12px] leading-[17px]',
            className,
        )}
    >
        <Icon glyph={glyph} size={18} className="text-text-muted mt-px shrink-0" />
        <span className="min-w-0">{children}</span>
    </div>
);

export default Notice;
