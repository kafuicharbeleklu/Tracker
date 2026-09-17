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

/**
 * **Deux formes du groupe à filets, et c'est la page qui choisit.**
 *
 * - `card` — la carte de 05.2 et 11.1 : intérieur `8 16`, un vrai titre de carte en
 *   17 sur 24, des rangées de 60 dont les filets s'arrêtent à la gouttière.
 * - `grp` — le groupe de 14.1 : **aucun intérieur**, le nom du groupe en 12 sur 16 à
 *   l'encre secondaire, des rangées de 56 portant elles-mêmes leurs 16 de côté, donc des
 *   filets d'un bord à l'autre, et la note sur le creux.
 *
 * Paramètres portait la première forme (13/09) : des titres de carte là où la planche
 * nomme un propriétaire, et des rangées de 60.
 */
export type RuleGroupForm = 'card' | 'grp';

const RuleGroupFormContext = React.createContext<RuleGroupForm>('card');

interface RuleGroupProps {
    /** `card` (05.2, 11.1, par défaut) ou `grp` (14.1). */
    form?: RuleGroupForm;
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
    form = 'card',
    header,
    headerTrailing,
    note,
    children,
    className,
}) => (
    /*
     * `.card` de la passe sobre — surface, rayon 8, **intérieur `8 / 16`** (05.2, 05.3 ;
     * la passe du 05/09 aligne toutes les cartes sur 16). Elle avait pris 20 le 03/09 pour
     * que ses rangées ne soient pas plus rentrées que celles des listes — mais la carte de
     * liste (04.1, `.card{padding:2px 16px}`) est à 16 aussi : 20 les rentrait *plus*.
     */
    <RuleGroupFormContext.Provider value={form}>
        <section
            className={cn(
                'rounded-card bg-surface overflow-hidden',
                form === 'card' && 'px-4 py-2',
                className,
            )}
        >
            {header && (
                /*
                 * `.ch` — **un vrai titre de carte, pas un micro-libellé.** 17 sur 24 en
                 * 500 sur l'encre pleine, et son décompte à droite en 14 sur 20. Il était
                 * en 11 px, capitales espacées, sur l'encre secondaire : le registre des
                 * étiquettes de champ, appliqué à ce qui nomme une section entière. Deux
                 * marches sous l'échelle de R15, qui n'a pas de 11.
                 */
                <div
                    className={cn(
                        'flex items-center justify-between gap-3',
                        form === 'grp' ? 'px-4 pt-3.5 pb-1.5' : 'min-h-12 pt-2 pb-1',
                    )}
                >
                    {/* `.grp > .gh` — 12 sur 16 en 500, encre secondaire : il nomme à qui
                        appartient le réglage, il ne titre pas une carte (14.1). */}
                    <span
                        className={cn(
                            'min-w-0',
                            form === 'grp'
                                ? 'text-on-surface-variant text-[12px] leading-4 font-medium'
                                : 'text-on-surface text-[17px] leading-6 font-medium',
                        )}
                    >
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
                <p
                    className={cn(
                        'border-outline-variant text-on-surface-variant border-t px-4 text-[12px] leading-4',
                        /* `.gnote` de 14.1 — sur le creux, `10 16 14`. */
                        form === 'grp' ? 'bg-surface-container pt-2.5 pb-3.5' : '-mx-4 py-2.5',
                    )}
                >
                    {note}
                </p>
            )}
        </section>
    </RuleGroupFormContext.Provider>
);

interface RuleGroupRowProps {
    /**
     * **La vignette de 40**, à gauche du sujet. 14.1 dessine ses rangées sans elle ;
     * **07.1 dessine la même page avec** (`.arow` et sa `.vig`), et c'est la forme que
     * « Mon compte » porte déjà. Deux écrans voisins, atteints par le même menu, ne
     * gagnent rien à s'écrire dans deux grammaires : la vignette est donc offerte, et
     * les pages de réglages la prennent.
     *
     * Les groupes de 05.2 et 11.1 ne la passent pas et ne changent pas.
     */
    glyph?: PhosphorGlyph;
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
    /**
     * **La rangée choisit, elle n'ouvre pas** — et perd donc son chevron. Une liste de
     * paliers (3 · 6 · 12 · 24 mois) est un choix posé sur place : le `>` y promettait
     * un écran de plus à chaque ligne, et l'état retenu est déjà dit par le glyphe et
     * le mot (I3). C'est la même règle que pour la feuille « Plus », dont les flèches
     * ont sauté le 06/09.
     */
    choice?: boolean;
    /**
     * **La valeur est une quantité, pas un appui** — `.v.q` de 11.1 la pose en chasse
     * normale sur l'encre tertiaire. Le nombre de porteurs d'un rôle se lit, il ne se
     * martèle pas ; le graisser le mettrait au même rang que le nom du rôle.
     */
    quiet?: boolean;
    className?: string;
}

const RuleGroupRow: React.FC<RuleGroupRowProps> = ({
    glyph,
    title,
    subtitle,
    value,
    status,
    valueTone,
    trailing,
    onOpen,
    external = false,
    choice = false,
    quiet = false,
    className,
}) => {
    const form = React.useContext(RuleGroupFormContext);
    const content = (
        <>
            {glyph && (
                <span className="bg-surface-container text-on-surface-variant rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon glyph={glyph} size={20} />
                </span>
            )}
            <span className="min-w-0 flex-1">
                {/* `.row .t` — 16 sur 24, **chasse normale** : c'est le sujet de la
                    rangée, pas son appui. `.row .s` le qualifie en 14 sur 20.
                    Le titre **tient sur une ligne** — 11.1 écrit `white-space:nowrap;
                    overflow:hidden;text-overflow:ellipsis` sur `.row .t`, et sans
                    cela « Compte et sécurité » passait à la ligne dès qu'une valeur
                    un peu longue lui prenait sa place : la rangée de 60 px en faisait
                    98, et les quatre groupes ne tenaient plus dans un écran. */}
                {/* **Avec une vignette, le titre passe à la ligne ; sans elle, il se
                    coupe.** 11.1 le veut sur une ligne, et l'ellipse y est le bon
                    compromis : la rangée y porte un titre court et une valeur d'un mot.
                    Les réglages de 14.1 ont des titres de vingt-cinq signes *et* une
                    valeur ; la vignette leur prend 52 px de plus, et « Périodicité de
                    l'inventaire » sortait en « Périodicité de l'inve… ». Un réglage
                    qu'on ne peut pas nommer ne se règle pas : on préfère deux lignes. */}
                <span
                    className={cn(
                        'text-on-surface block text-[16px] leading-6',
                        glyph ? 'break-words' : 'truncate',
                    )}
                >
                    {title}
                </span>
                {/* La sous-ligne suit la forme du groupe : **12 sur 16** dans les réglages
                    (`.grp .row .s` de 14.1, 2 px sous le titre), 14 sur 20 dans une carte
                    (`.row .s` de 05.2). Les deux étaient rendues en 14 sur 20 — la sous-ligne
                    d'un réglage y prenait la place de la valeur (relevé du 16/09). */}
                {subtitle && (
                    <span
                        className={cn(
                            'text-on-surface-variant block',
                            form === 'grp'
                                ? 'mt-0.5 text-[12px] leading-4'
                                : 'text-[14px] leading-5',
                        )}
                    >
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
                        'shrink-0 text-right text-[16px] leading-6 whitespace-nowrap',
                        quiet ? 'text-text-muted font-normal' : 'font-medium',
                        valueTone ? TONE_CLASS[valueTone] : !quiet && 'text-on-surface',
                    )}
                >
                    {value}
                </span>
            )}

            {trailing && <span className="shrink-0">{trailing}</span>}

            {onOpen && !choice && (
                <Icon
                    glyph={external ? ArrowSquareOut : CaretRight}
                    size={20}
                    className="text-text-muted shrink-0"
                />
            )}
        </>
    );

    /* `.row` — 60 de haut, gouttière 16, intérieur vertical 10, et le filet qui la
       sépare de la précédente. Elle valait 56 avec 12 de gouttière — et la gouttière
       était restée à 12 dans les classes (10/09). */
    const shell = cn(
        'flex w-full items-center border-t border-outline-variant py-2.5 text-left first:border-t-0',
        /* `.grp .row` de 14.1 — 56, `10 16`, gouttière 12 : la rangée porte ses côtés. */
        form === 'grp' ? 'min-h-14 gap-3 px-4' : 'min-h-[60px] gap-4',
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
                'hover:bg-surface-container focus-visible:ring-focus-ring transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset',
                /* Dans la carte, le survol déborde la gouttière : sinon la rangée paraît
                   coupée à 16 px de chaque bord. Le groupe n'en a pas besoin. */
                form === 'card' &&
                    'hover:shadow-[-16px_0_0_var(--tk-color-surface-container),16px_0_0_var(--tk-color-surface-container)]',
            )}
        >
            {content}
        </button>
    );
};

RuleGroup.Row = RuleGroupRow;

export { RuleGroupRow };
export default RuleGroup;
