import React from 'react';
import { Check, Hourglass, User, X, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **Le fil d'un passage de main** — `.ack` de la planche 06.1.
 *
 * *« Un objet ne change pas de mains sans que les deux parties le disent. »* Une
 * ligne par partie, dans l'ordre où elles agissent : ce qui est fait, et ce qui
 * reste. **Chacune atteste son propre acte, jamais celui de l'autre** — c'est
 * précisément ce que le fil rend lisible.
 *
 * **L'attente est un état, pas une erreur.** Entre deux attestations l'objet a un
 * propriétaire et un geste ; la ligne en attente le nomme, et vire à l'ambre quand
 * elle dure. Le produit affichait « En attente » sans dire *de qui* ni *depuis
 * quand* : le lecteur ne pouvait ni relancer ni comprendre.
 */

/**
 * `fail` vient de **06.5** : un parcours peut s'arrêter. Une demande refusée n'est pas
 * « en attente pour toujours » — le fil doit pouvoir dire où elle s'est arrêtée, et les
 * étapes qui suivent n'ont **pas eu lieu**.
 */
export type TrailState = 'done' | 'wait' | 'late' | 'fail';

export interface TrailStep {
    /** Ce que la partie atteste — « Clara Admin atteste avoir remis ». */
    title: React.ReactNode;
    /** Quand, et par quelle méthode : « lundi 09:42 · code PIN ». */
    detail?: React.ReactNode;
    state: TrailState;
    /**
     * Le glyphe de l'étape, quand l'état ne suffit pas à le dire : le parcours d'une
     * demande (06.5) nomme ses trois étapes par leur acteur — la poignée de main pour
     * l'informatique, la personne pour le bénéficiaire — et elles restent à venir.
     */
    glyph?: PhosphorGlyph;
}

const STEP_CLASS: Record<TrailState, string> = {
    done: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    late: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    wait: 'bg-surface-container text-text-tertiary',
    fail: 'bg-[var(--tk-color-tint-danger)] text-[var(--tk-color-on-tint-danger)]',
};

const STEP_GLYPH: Record<TrailState, PhosphorGlyph> = {
    done: Check,
    late: Hourglass,
    wait: User,
    fail: X,
};

const HandoverTrail: React.FC<{ steps: TrailStep[]; className?: string }> = ({
    steps,
    className,
}) => (
    <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => (
            <div
                key={index}
                className={cn(
                    'flex min-h-14 items-center gap-3 py-2',
                    index > 0 && 'border-outline-variant border-t',
                )}
            >
                <span
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        STEP_CLASS[step.state],
                    )}
                >
                    <Icon glyph={step.glyph ?? STEP_GLYPH[step.state]} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                    <span
                        className={cn(
                            'block text-[16px] leading-6',
                            step.state === 'wait' ? 'text-on-surface-variant' : 'text-on-surface',
                        )}
                    >
                        {step.title}
                    </span>
                    {step.detail && (
                        <span className="text-on-surface-variant block text-[14px] leading-5">
                            {step.detail}
                        </span>
                    )}
                </span>
            </div>
        ))}
    </div>
);

export default HandoverTrail;
