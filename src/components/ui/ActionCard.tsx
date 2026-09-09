import React from 'react';
import { CaretRight, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **La carte d'actes de 07.1** — `.card` et `.arow`.
 *
 * Un sujet, une carte ; un acte, une rangée. C'est la forme que « Mon compte » donne
 * à ses trois sujets — *me connecter*, *prouver une remise*, *où je suis connecté*.
 *
 * Elle se distingue du groupe à filets (`RuleGroup`) sur un point qui n'est pas
 * décoratif : **une rangée d'acte ouvre un geste, une rangée de réglage porte une
 * valeur**. L'une a une vignette et un chevron, l'autre un chiffre à droite. Confondre
 * les deux ferait promettre une valeur là où il y a un acte, et l'inverse.
 *
 * `.card` porte un intérieur de `8 / 16` — quatre pixels de moins que le groupe à
 * filets, parce qu'une rangée d'acte commence par une vignette de 40 et n'a pas la
 * place d'être rentrée deux fois. Son titre est en 17/24 comme partout ailleurs
 * (`.ch h3`).
 */
const ActionCard: React.FC<{ title: string; children: React.ReactNode }> & {
    Row: typeof ActionRow;
} = ({ title, children }) => (
    <section className="rounded-card bg-surface overflow-hidden px-4 py-2">
        <div className="flex min-h-12 items-center pt-2 pb-1">
            <span className="text-on-surface text-[17px] leading-6 font-medium">{title}</span>
        </div>
        <div>{children}</div>
    </section>
);

/**
 * `.arow` — vignette 40, sujet, sous-ligne d'état, chevron. Les deux lignes sont
 * **tronquées à une ligne chacune** (`.ftt .t` et `.ftt .s` portent l'ellipse dans la
 * planche) : la rangée fait 56 et ne grandit pas.
 *
 * Sans `onOpen`, elle ne prend ni chevron ni curseur : *« un acte n'a qu'une entrée »*,
 * et une rangée qui ne mène nulle part ne doit pas prétendre le contraire.
 */
const ActionRow: React.FC<{
    glyph: PhosphorGlyph;
    title: string;
    subtitle: string;
    onOpen?: () => void;
}> = ({ glyph, title, subtitle, onOpen }) => {
    const contenu = (
        <>
            <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                <Icon glyph={glyph} size={20} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="text-on-surface block truncate text-[16px] leading-6">
                    {title}
                </span>
                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                    {subtitle}
                </span>
            </span>
            {onOpen && <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />}
        </>
    );

    const forme =
        'border-outline-variant flex min-h-14 w-full items-center gap-3 border-t py-2 text-left first:border-t-0';

    if (!onOpen) return <div className={forme}>{contenu}</div>;

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                forme,
                /* Le survol déborde la gouttière de la carte, comme sur `RuleGroup` :
                   sinon la rangée paraît coupée à 16 px de chaque bord. */
                'hover:bg-surface-container focus-visible:ring-focus-ring transition-colors outline-none hover:shadow-[-16px_0_0_var(--tk-color-surface-container),16px_0_0_var(--tk-color-surface-container)] focus-visible:ring-2 focus-visible:ring-inset',
            )}
        >
            {contenu}
        </button>
    );
};

ActionCard.Row = ActionRow;

export { ActionRow };
export default ActionCard;
