import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { ArrowSquareOut, CaretRight } from '@phosphor-icons/react';

import Icon from './Icon';
import { TONE_CLASS, type ListRowTone } from './ListRow';
import { cn } from '../../lib/utils';

/**
 * Groupe à filets — règle **R4** de la planche **00.1**, dessiné par **14.1**,
 * **11.1** et **05.2**. *Filet* au sens typographique : le trait, pas la règle métier.
 *
 * > **Le filet remplace la carte.** Une carte porte **un sujet**. Une suite de
 * > réglages est **un groupe à filets dans une seule surface**. C'est ce qui datait
 * > le plus. *(00.1, R4)*
 *
 * C'est la correction la plus rentable du portage de 14.1 : **onze cartes blanches
 * deviennent quatre groupes**. Onze cartes disent onze sujets ; quatre groupes
 * disent quatre propriétaires — ce qui est à vous, à l'entreprise, à l'informatique,
 * et ce qui ne se règle pas.
 *
 * ## La valeur est à droite, et elle se lit sans ouvrir
 *
 * Une rangée de ce groupe n'est pas une rangée de liste (`ListRow`, 72 px) ni une
 * rangée de référence (`ReferenceRow`, 44 px, étiquette · valeur). Elle fait **56 px**
 * et porte quatre choses au plus, dans cet ordre : **ce qu'on règle**, **ce que le
 * réglage décide**, **sa valeur**, et **de quoi l'ouvrir**.
 *
 * Le sous-titre **ne répète jamais la valeur** — il dit la conséquence. « Décide de
 * la valeur de 14 actifs » à gauche, « 3 ans » à droite : les deux sont utiles.
 * « Durée d'amortissement : 3 ans » à gauche et « 3 ans » à droite ne l'est pas.
 *
 * ## L'état d'une rangée obéit à I3
 *
 * Une rangée qui porte un état le dit par **un pictogramme et un mot** (§0.3), jamais
 * par la seule teinte : le glyphe prend la couleur, la valeur porte le mot. C'est
 * pour cela que `status` et `value` vont ensemble et que `status` seul est refusé
 * par le typage — une pastille muette n'est pas un état.
 *
 * ## La note du groupe (`note`)
 *
 * Le pied de groupe sur surface encastrée porte **ce que la forme ne peut pas dire** :
 * pourquoi cette ligne renvoie ailleurs, pourquoi ce produit n'est pas ici. Il est en
 * **11/16 sur `text-muted`** — la déclaration de 05.2 et 11.1. *(14.1 la porte en
 * 12/17 sur `ink2` : c'est l'écart relevé au portage, deux planches contre une, et
 * §2.26 tranche par la majorité.)*
 */

export type RuleRowTone = ListRowTone;

interface RuleGroupProps {
    /** L'en-tête du groupe — ce qu'il regroupe, en capitales. */
    header?: React.ReactNode;
    /** À droite de l'en-tête : un décompte, une portée. */
    headerTrailing?: React.ReactNode;
    /** Le pied du groupe, sur surface encastrée. */
    note?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

const RuleGroup: React.FC<RuleGroupProps> & { Row: typeof RuleGroupRow } = ({
    header,
    headerTrailing,
    note,
    children,
    className,
}) => (
    /*
     * `.card` de la passe sobre — surface, rayon 8, **intérieur `8 / 20`**. La carte
     * portait 16 de gouttière : ses rangées étaient donc plus rentrées que celles des
     * listes, sur des écrans qui alternent les deux.
     */
    <section className={cn('rounded-card bg-surface overflow-hidden px-5 py-2', className)}>
        {header && (
            /*
             * `.ch` — **un vrai titre de carte, pas un micro-libellé.** 17 sur 24 en
             * 500 sur l'encre pleine, et son décompte à droite en 14 sur 20. Il était
             * en 11 px, capitales espacées, sur l'encre secondaire : le registre des
             * étiquettes de champ, appliqué à ce qui nomme une section entière. Deux
             * marches sous l'échelle de R15, qui n'a pas de 11.
             */
            <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                <span className="text-on-surface min-w-0 text-[17px] leading-6 font-medium">
                    {header}
                </span>
                {headerTrailing && (
                    <span className="text-on-surface-variant shrink-0 text-[14px] leading-5 tabular-nums">
                        {headerTrailing}
                    </span>
                )}
            </div>
        )}
        {/* Les rangées sont encloses pour que `first:` désigne la première **rangée**
            et non l'en-tête : `.grp>.gh+.row{border-top:0}` de 14.1. */}
        <div>{children}</div>
        {note && (
            <p className="border-outline-variant text-on-surface-variant -mx-5 border-t px-5 py-2.5 text-[12px] leading-4">
                {note}
            </p>
        )}
    </section>
);

interface RuleGroupRowProps {
    /** Ce qu'on règle. */
    title: React.ReactNode;
    /** Ce que le réglage décide — jamais la valeur redite. */
    subtitle?: React.ReactNode;
    /** La valeur, à droite : elle se lit sans ouvrir. */
    value?: React.ReactNode;
    /** Le pictogramme d'état, à gauche de la valeur — le mot est dans `value` (I3). */
    status?: { icon: PhosphorGlyph; tone: RuleRowTone };
    /** Teinte de la valeur, quand elle porte le mot de l'état. */
    valueTone?: RuleRowTone;
    /**
     * Un contrôle posé au bout de la rangée — une bascule. Il **remplace** la valeur
     * et le chevron : un réglage qui se pose du pouce ne s'ouvre pas.
     */
    trailing?: React.ReactNode;
    /** Ouvre le réglage : chevron, et la rangée devient un bouton. */
    onOpen?: () => void;
    /**
     * La destination est **hors de cet écran** : le chevron cède au glyphe de sortie.
     * Une rangée qui renvoie ailleurs doit le dire avant le clic, pas après.
     */
    external?: boolean;
    className?: string;
}

const RuleGroupRow: React.FC<RuleGroupRowProps> = ({
    title,
    subtitle,
    value,
    status,
    valueTone,
    trailing,
    onOpen,
    external = false,
    className,
}) => {
    const content = (
        <>
            <span className="min-w-0 flex-1">
                {/* `.row .t` — 16 sur 24, **chasse normale** : c'est le sujet de la
                    rangée, pas son appui. `.row .s` le qualifie en 14 sur 20. */}
                <span className="text-on-surface block text-[16px] leading-6">{title}</span>
                {subtitle && (
                    <span className="text-on-surface-variant block text-[14px] leading-5">
                        {subtitle}
                    </span>
                )}
            </span>

            {status && (
                <Icon
                    glyph={status.icon}
                    size={18}
                    className={cn('shrink-0', TONE_CLASS[status.tone])}
                />
            )}

            {value !== undefined && value !== null && (
                <span
                    className={cn(
                        'shrink-0 text-right text-[16px] leading-6 font-medium whitespace-nowrap',
                        valueTone ? TONE_CLASS[valueTone] : 'text-on-surface',
                    )}
                >
                    {value}
                </span>
            )}

            {trailing && <span className="shrink-0">{trailing}</span>}

            {onOpen && (
                <Icon
                    glyph={external ? ArrowSquareOut : CaretRight}
                    size={20}
                    className="text-text-muted shrink-0"
                />
            )}
        </>
    );

    /* `.row` — 60 de haut, gouttière 16, intérieur vertical 10, et le filet qui la
       sépare de la précédente. Elle valait 56 avec 12 de gouttière. */
    const shell = cn(
        'flex min-h-[60px] w-full items-center gap-4 border-t border-outline-variant py-2.5 text-left first:border-t-0',
        className,
    );

    if (!onOpen) {
        return <div className={shell}>{content}</div>;
    }

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                shell,
                /* Le survol déborde la gouttière de la carte : sinon la rangée
                   paraît coupée à 20 px de chaque bord. */
                'hover:bg-surface-container focus-visible:ring-focus-ring transition-colors outline-none hover:shadow-[-20px_0_0_var(--tk-color-surface-container),20px_0_0_var(--tk-color-surface-container)] focus-visible:ring-2 focus-visible:ring-inset',
            )}
        >
            {content}
        </button>
    );
};

RuleGroup.Row = RuleGroupRow;

export { RuleGroupRow };
export default RuleGroup;
