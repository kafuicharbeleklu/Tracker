import React from 'react';
import { CaretRight } from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';

export const initiales = (nom: string): string =>
    nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() ?? '')
        .join('');

/** `.arow` — une rangée qui renvoie ailleurs : vignette de 40, deux lignes, chevron. */
const Renvoi: React.FC<{
    vignette: React.ReactNode;
    teinte?: string;
    titre: string;
    sousTitre?: string;
    code?: boolean;
    premier?: boolean;
    /** Absent : la rangée se lit sans s'ouvrir (une personne qu'on n'a pas le droit de lire). */
    onOpen?: () => void;
}> = ({ vignette, teinte, titre, sousTitre, code, premier, onOpen }) => (
    <div
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={
            onOpen
                ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onOpen();
                      }
                  }
                : undefined
        }
        className={cn(
            'flex min-h-14 items-center gap-3 py-2',
            onOpen && 'cursor-pointer',
            !premier && 'border-outline-variant border-t',
        )}
    >
        <span
            className={cn(
                'font-brand text-ts-control flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] font-semibold',
                teinte ?? 'bg-surface-container text-on-surface-variant',
            )}
        >
            {vignette}
        </span>
        <span className="min-w-0 flex-1">
            <span
                className={cn(
                    'text-on-surface text-ts-body leading-ts-body block truncate',
                    code && 'tabular-nums',
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
        {onOpen && <Icon glyph={CaretRight} size={20} className="text-text-tertiary shrink-0" />}
    </div>
);

export default Renvoi;
