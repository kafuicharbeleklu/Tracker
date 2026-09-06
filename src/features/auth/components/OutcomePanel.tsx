import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';

/**
 * **L'issue d'un parcours hors session** — la forme que 02.1 (lien envoyé, refus de
 * l'annuaire) et 02.2 (lien expiré, compte indisponible) partagent : une icône
 * teintée dans un rond de 72, un titre 22 sur 28 en Archivo 600, une phrase 16 sur 24,
 * puis la précision 14 sur 20 — centrées, sur 300 de large au plus. Le geste vient
 * sous elle, en pile de 12.
 *
 * Elle n'est pas l'état vide de 17.1 (motif de 96 sur le creux, dans une page) : ici
 * la page est le panneau sous le bandeau, et l'icône dit la nature (bleu = envoyé,
 * ambre = une porte fermée).
 */
interface OutcomePanelProps {
    icon: PhosphorGlyph;
    tone: 'bleu' | 'ambre';
    title: string;
    message: React.ReactNode;
    detail?: React.ReactNode;
    actions?: React.ReactNode;
}

const OutcomePanel: React.FC<OutcomePanelProps> = ({
    icon,
    tone,
    title,
    message,
    detail,
    actions,
}) => (
    <>
        <div className="flex flex-1 flex-col items-center justify-center px-2 pt-2 pb-6 text-center">
            <span
                className={cn(
                    'mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full',
                    tone === 'bleu' ? 'bg-tint-bleu text-on-tint-bleu' : 'bg-tint-ambre text-on-tint-ambre',
                )}
            >
                <Icon glyph={icon} size={32} />
            </span>
            <p className="font-brand mb-2 text-[22px] leading-7 font-semibold tracking-[-0.01em]">
                {title}
            </p>
            <p className="text-on-surface-variant max-w-[300px] text-[16px] leading-6 text-pretty [&_b]:font-medium [&_b]:text-[var(--tk-color-text-primary)]">
                {message}
            </p>
            {detail && (
                <p className="text-on-surface-variant mt-2 max-w-[300px] text-[14px] leading-5 text-pretty">
                    {detail}
                </p>
            )}
        </div>
        {actions && <div className="flex flex-col gap-3 [&>button:not(.self-center)]:w-full">{actions}</div>}
    </>
);

export default OutcomePanel;
