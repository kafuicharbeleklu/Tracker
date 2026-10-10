import React from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';

import CardEmptyState from '../../../components/ui/CardEmptyState';
import { HAUTEUR_DU_PIED, PiedDeCarte, ToutVoir } from '../../../components/ui/ToutVoir';
import { useCeQuiTient } from '../../../hooks/useCeQuiTient';
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

/** Ce que la carte donne à mesurer : les derniers faits, jamais plus. */
const FAITS_SUR_LA_CARTE = 6;

const Fait: React.FC<{ fait: FaitDeCampagne }> = ({ fait }) => (
    <li className="flex gap-2.5">
        <span
            aria-hidden="true"
            className={cn('mt-[5px] h-2 w-2 shrink-0 rounded-full', POINT[fait.ton])}
        />
        {/* Le fait, puis qui et quand, sur sa propre ligne : collé au bout
            de la phrase, « · Afi · il y a 3 min » se coupait n'importe où. */}
        <span className="min-w-0">
            <span className="text-on-surface block">
                <b className="font-medium">{fait.titre}</b>
                {fait.detail && ` ${fait.detail}`}
            </span>
            <span className="text-text-secondary block text-[0.75rem] leading-4">{fait.quand}</span>
        </span>
    </li>
);

/**
 * **L'activité de la campagne** (28/09) — les derniers comptages, corrections et étapes, avec
 * qui et quand. La colonne de droite ne restait jamais vide pour rien : sans écart, elle
 * montrait une carte blanche de 600 px ; elle dit maintenant ce qui vient de se passer.
 *
 * **La carte montre ce qui tient, son écran montre tout** (09/10) : la liste défilait dans
 * la carte. Elle montre les derniers faits qui tiennent entiers et renvoie au reste
 * (`onTout`) ; `entiere` est cet écran-là, sans borne.
 */
const ActiviteDeCampagne: React.FC<{
    faits: FaitDeCampagne[];
    /** Ouvrir l'activité entière — le pied de la carte, quand elle ne montre pas tout. */
    onTout?: () => void;
    /** L'écran de toute l'activité : tous les faits, la page défile. */
    entiere?: boolean;
    className?: string;
}> = ({ faits, onTout, entiere = false, className }) => {
    const part = useCeQuiTient<HTMLUListElement>(entiere ? 0 : faits.length, HAUTEUR_DU_PIED + 8);

    if (entiere) {
        return (
            <section
                aria-label="Toute l’activité de la campagne"
                className={cn('bg-surface rounded-card p-4', className)}
            >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="text-on-surface text-ts-head leading-ts-head font-medium">
                        Activité
                    </h2>
                    <span className="text-text-secondary text-[0.75rem] leading-4 tabular-nums">
                        {faits.length} fait{faits.length > 1 ? 's' : ''}
                    </span>
                </div>
                {faits.length === 0 ? (
                    <CardEmptyState
                        glyph={ClockCounterClockwise}
                        title="Aucune activité"
                        description="Le premier comptage paraîtra ici."
                    />
                ) : (
                    <ul className="text-ts-sub leading-ts-sub flex flex-col gap-3">
                        {faits.map((fait) => (
                            <Fait key={fait.id} fait={fait} />
                        ))}
                    </ul>
                )}
            </section>
        );
    }

    return (
        <section
            aria-label="L’activité de la campagne"
            className={cn('bg-surface rounded-card flex flex-col p-4', className)}
        >
            <h2 className="text-on-surface text-ts-head leading-ts-head mb-2 font-medium">
                Activité
            </h2>
            {faits.length === 0 ? (
                /* Le vide de la carte, à sa forme (10/10) : c'était une ligne de 13 en haut
                   d'une carte de 300 px. */
                <CardEmptyState
                    glyph={ClockCounterClockwise}
                    title="Aucune activité"
                    description="Le premier comptage paraîtra ici."
                />
            ) : (
                <>
                    <ul
                        ref={part.zone}
                        className="text-ts-sub leading-ts-sub relative flex min-h-0 flex-1 flex-col gap-3 overflow-clip"
                    >
                        {faits.slice(0, FAITS_SUR_LA_CARTE).map((fait) => (
                            <Fait key={fait.id} fait={fait} />
                        ))}
                    </ul>
                    {part.tronque && onTout && (
                        <PiedDeCarte className="mt-2">
                            <ToutVoir
                                libelle="Toute l’activité"
                                total={faits.length}
                                onOuvrir={onTout}
                            />
                        </PiedDeCarte>
                    )}
                </>
            )}
        </section>
    );
};

export default ActiviteDeCampagne;
