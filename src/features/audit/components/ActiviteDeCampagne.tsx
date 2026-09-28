import React from 'react';

import { cn } from '../../../lib/utils';

export interface FaitDeCampagne {
    id: string;
    ton: 'vert' | 'ambre' | 'orange' | 'bleu';
    titre: string;
    detail: string;
    quand: string;
}

const POINT: Record<FaitDeCampagne['ton'], string> = {
    vert: 'bg-[var(--tk-color-st-vert)]',
    ambre: 'bg-[var(--tk-color-st-ambre)]',
    orange: 'bg-[var(--tk-color-st-orange)]',
    bleu: 'bg-[var(--tk-color-st-bleu)]',
};

/**
 * **L'activité de la campagne** (28/09) — les derniers comptages, corrections et étapes, avec
 * qui et quand. La colonne de droite ne restait jamais vide pour rien : sans écart, elle
 * montrait une carte blanche de 600 px ; elle dit maintenant ce qui vient de se passer.
 */
const ActiviteDeCampagne: React.FC<{ faits: FaitDeCampagne[]; className?: string }> = ({
    faits,
    className,
}) => (
    <section
        aria-label="L’activité de la campagne"
        className={cn('bg-surface rounded-xl px-[18px] py-4', className)}
    >
        <h2 className="text-on-surface mb-2 text-[1rem] leading-6 font-semibold">Activité</h2>
        {faits.length === 0 ? (
            <p className="text-text-secondary text-[0.8125rem] leading-[1.125rem]">
                Rien encore : le premier comptage paraîtra ici.
            </p>
        ) : (
            <ul className="flex flex-col gap-2.5 text-[0.8125rem] leading-[1.125rem]">
                {faits.map((fait) => (
                    <li key={fait.id} className="flex gap-2.5">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'mt-[5px] h-2 w-2 shrink-0 rounded-full',
                                POINT[fait.ton],
                            )}
                        />
                        <span className="min-w-0">
                            <b className="text-on-surface font-medium">{fait.titre}</b>{' '}
                            <span className="text-on-surface">{fait.detail}</span>{' '}
                            <span className="text-text-secondary">· {fait.quand}</span>
                        </span>
                    </li>
                ))}
            </ul>
        )}
    </section>
);

export default ActiviteDeCampagne;
