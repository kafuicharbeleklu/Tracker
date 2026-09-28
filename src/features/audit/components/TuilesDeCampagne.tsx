import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import Icon from '../../../components/ui/Icon';
import { useEntree } from '../../../hooks/useEntree';
import { cn } from '../../../lib/utils';

export type TeinteDeTuile = 'vert' | 'bleu' | 'orange' | 'ambre' | 'neutre';

export interface TuileDeCampagne {
    id: string;
    glyph: PhosphorGlyph;
    teinte: TeinteDeTuile;
    label: string;
    valeur: number;
    /** « sur 9 · 22 % » — à côté du chiffre. */
    suffixe?: string;
    /** La phrase sous le chiffre. */
    detail?: string;
    /** Le chiffre et sa phrase passent à l'orange : il y a quelque chose à faire. */
    alerte?: boolean;
    /** Une jauge, de 0 à 100 — la tuile des retrouvés. */
    progression?: number;
    choisie?: boolean;
    onClick?: () => void;
}

const PASTILLE: Record<TeinteDeTuile, string> = {
    vert: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    bleu: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    orange: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    ambre: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    neutre: 'bg-surface-container text-on-surface-variant',
};

/**
 * **Les tuiles de la campagne** (28/09, refonte — « éclater le héros »). Le bloc sombre
 * portait l'état, le lieu, trois chiffres, la jauge et le geste en un seul aplat. Ses
 * chiffres deviennent quatre tuiles claires, chacune teintée par ce qu'elle compte — le vert
 * des retrouvés, le bleu de ce qui reste, l'orange de ce qui demande une décision, l'ambre
 * des fiches corrigées — et **chacune est un filtre** : elle remplace les puces, et la tuile
 * choisie est cerclée.
 *
 * **Une tuile qui filtre se comporte en bouton** (28/09, relevé de l'utilisateur : *« ni
 * d'état d'action hover »*) : elle se creuse au survol, s'enfonce à l'appui, porte l'anneau
 * de focus au clavier. Une tuile sans liste à montrer (aucun écart, aucune fiche corrigée)
 * n'est pas un bouton : elle ne réagit pas, et le lecteur d'écran ne l'annonce pas.
 */
const TuilesDeCampagne: React.FC<{ tuiles: TuileDeCampagne[]; className?: string }> = ({
    tuiles,
    className,
}) => {
    /* Les quatre tuiles entrent l'une après l'autre, comme les cartes de Finances. */
    const entree = useEntree();
    return (
        <section
            aria-label="Où en est le comptage"
            className={cn(
                'grid shrink-0 grid-cols-4 gap-4',
                entree && 'mvt-cascade-cartes',
                className,
            )}
        >
            {tuiles.map((tuile) => {
                const contenu = (
                    <>
                        <span className="flex w-full min-w-0 items-center gap-2.5">
                            <span
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                    PASTILLE[tuile.teinte],
                                )}
                            >
                                <Icon glyph={tuile.glyph} size={18} />
                            </span>
                            <span className="text-text-secondary min-w-0 flex-1 truncate text-[0.8125rem] leading-[1.125rem] font-medium">
                                {tuile.label}
                            </span>
                            {tuile.choisie && (
                                <span className="text-on-surface shrink-0 text-[0.6875rem] leading-4 font-semibold tracking-[0.04em] uppercase">
                                    affiché
                                </span>
                            )}
                        </span>
                        <span className="flex items-baseline gap-1.5">
                            <span
                                className={cn(
                                    'font-brand text-[1.875rem] leading-9 font-semibold tabular-nums',
                                    tuile.alerte
                                        ? 'text-[var(--tk-color-on-tint-orange)]'
                                        : 'text-on-surface',
                                )}
                            >
                                <ChiffreAnime valeur={tuile.valeur} />
                            </span>
                            {tuile.suffixe && (
                                <span className="text-text-secondary text-[0.875rem] leading-5 tabular-nums">
                                    {tuile.suffixe}
                                </span>
                            )}
                        </span>
                        {typeof tuile.progression === 'number' ? (
                            <span className="bg-surface-muted-strong mt-auto block h-1.5 w-full overflow-hidden rounded-full">
                                <span
                                    className="mvt-jauge duration-medium2 ease-emphasized block h-full rounded-full bg-[var(--tk-color-st-vert)] transition-[width]"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, tuile.progression))}%`,
                                    }}
                                />
                            </span>
                        ) : (
                            tuile.detail && (
                                <span
                                    className={cn(
                                        'mt-auto text-[0.75rem] leading-4',
                                        tuile.alerte
                                            ? 'font-medium text-[var(--tk-color-on-tint-orange)]'
                                            : 'text-text-secondary',
                                    )}
                                >
                                    {tuile.detail}
                                </span>
                            )
                        )}
                    </>
                );
                const forme = cn(
                    'bg-surface flex min-w-0 flex-col items-start gap-2 rounded-xl px-[18px] py-4 text-left',
                    tuile.choisie && 'shadow-[0_0_0_2px_var(--tk-color-text-primary)]',
                );
                return tuile.onClick ? (
                    <Button
                        key={tuile.id}
                        variant="text"
                        layout="card"
                        aria-pressed={Boolean(tuile.choisie)}
                        onClick={tuile.onClick}
                        className={cn(
                            forme,
                            'hover:bg-surface-container active:bg-surface-container-high focus-visible:ring-offset-background h-auto min-h-0 cursor-pointer font-normal whitespace-normal active:scale-[0.99]',
                            !tuile.choisie &&
                                'hover:shadow-[0_0_0_1px_var(--tk-color-outline-variant)]',
                        )}
                    >
                        {contenu}
                    </Button>
                ) : (
                    <div key={tuile.id} className={forme}>
                        {contenu}
                    </div>
                );
            })}
        </section>
    );
};

export default TuilesDeCampagne;
