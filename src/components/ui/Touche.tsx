import React from 'react';

import { cn } from '../../lib/utils';

/**
 * **La marque d'une touche** (26/09) — 11 sur 16, un cerné de rayon 4 dont le filet du bas
 * est doublé : une touche qu'on voit comme une touche. Encre secondaire. Décorative : le
 * raccourci se dit aussi dans le nom accessible (`aria-keyshortcuts`) du geste.
 */
const Touche: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <kbd
        aria-hidden="true"
        className={cn(
            'border-outline-variant text-text-secondary inline-flex min-w-[18px] shrink-0 items-center justify-center rounded-md border border-b-2 px-[5px] font-sans text-[0.6875rem] leading-4 font-normal',
            className,
        )}
    >
        {children}
    </kbd>
);

export default Touche;
