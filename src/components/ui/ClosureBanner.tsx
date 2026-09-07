import React, { useEffect, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import { cn } from '../../lib/utils';

/**
 * **Le bandeau de clôture** — planche **06.3**, et la **forme 3 de 17.5**.
 *
 * *« La forme d'une clôture dépend de ce que l'acte laisse derrière lui, pas de son
 * importance. »* Trois questions : le sujet est-il encore là, la suite dépend-elle de
 * quelqu'un d'autre, l'acte est-il défaisable. Trois formes, classées par coût ; **on
 * prend la moins chère qui suffit**.
 *
 * | Forme | Quand | Ce que le bandeau fait |
 * | --- | --- | --- |
 * | 1 · l'écran a changé | le sujet est là, tout se met à jour sous les yeux | il nomme ce qui vient de se produire, **puis s'efface** |
 * | 2 · l'accusé en ligne | rien de visible n'a changé, l'effet est ailleurs | il dit quoi, chez qui, quand, et **reste jusqu'à la sortie** |
 * | 3 · l'écran de clôture | le sujet a disparu | il se pose sur l'écran où l'on revient |
 *
 * **Aucune coche animée, aucun « Terminé » à taper** : la preuve est faite, l'écran n'a
 * pas à s'en réjouir. C'est aussi ce que 17.5 réclamait sans pouvoir le construire —
 * *« la vue a changé → bandeau en tête de page »* — faute d'un seul appelant.
 *
 * **Le geste du bandeau existe quand l'acte est défaisable là où il vient d'être fait** :
 * « Annuler » sous une suspension, jamais sous une suppression.
 */

export type ClosureTone = 'vert' | 'bleu' | 'ambre' | 'neutre';

const TEINTE: Record<ClosureTone, string> = {
    vert: 'bg-tint-vert text-on-tint-vert',
    bleu: 'bg-tint-bleu text-on-tint-bleu',
    ambre: 'bg-tint-ambre text-on-tint-ambre',
    /* `.ban.grey` — la surface, pas une teinte : une clôture qui ne se réjouit pas. */
    neutre: 'bg-surface text-on-surface-variant',
};

export interface ClosureBannerProps {
    tone: ClosureTone;
    glyph: PhosphorGlyph;
    /** Ce qui vient de se produire — « Réception confirmée », « Demande envoyée ». */
    title: string;
    /** Chez qui, quand : « chez Jane Manager · 09:12 ». */
    detail?: string;
    /** Le geste qui défait, quand l'acte se défait ici même. */
    action?: { label: string; onClick: () => void };
    /**
     * Forme 1 : le bandeau s'efface, parce que l'écran dit déjà tout. Absent, il reste
     * jusqu'à la sortie de l'écran — c'est la forme 2, où rien d'autre n'a bougé.
     */
    fadeAfterMs?: number;
    className?: string;
}

const ClosureBanner: React.FC<ClosureBannerProps> = ({
    tone,
    glyph,
    title,
    detail,
    action,
    fadeAfterMs,
    className,
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!fadeAfterMs) return;
        const minuteur = setTimeout(() => setVisible(false), fadeAfterMs);
        return () => clearTimeout(minuteur);
    }, [fadeAfterMs]);

    if (!visible) return null;

    return (
        <div
            role="status"
            className={cn(
                'flex min-h-14 items-center gap-3 rounded-lg px-4 py-3',
                TEINTE[tone],
                className,
            )}
        >
            <Icon glyph={glyph} size={20} className="shrink-0" />
            <span className="min-w-0 flex-1 text-[14px] leading-5">
                <strong
                    className={cn(
                        'block text-[16px] leading-6 font-medium',
                        tone === 'neutre' && 'text-on-surface',
                    )}
                >
                    {title}
                </strong>
                {detail}
            </span>
            {action && (
                <Button
                    variant="text"
                    onClick={action.onClick}
                    className="h-auto !min-h-0 shrink-0 !px-0 !py-0 text-[14px] leading-5 font-medium text-current"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default ClosureBanner;
