import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { CheckSquare, Square } from '@phosphor-icons/react';

import useLongPress from '../../hooks/useLongPress';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Rangée de liste — planches **04.1** (contenu) et **00.4** (régime), registre §2.43.
 *
 * **72 px, à toutes les largeurs.** C'est la phrase à retenir d'un portage : la
 * rangée fait 72 px à 393 px et 72 px à 1280 px, la vignette 40 (§2.2), et un
 * écran plus large ne mérite pas des rangées plus hautes — il mérite **plus de
 * rangées visibles**. Onze rangées tiennent à 768 px là où le téléphone en montre
 * six, sans qu'aucune décision de dessin ne change.
 *
 * **Une rangée n'est pas une fiche résumée.** Elle porte le minimum qui permet de
 * reconnaître et de choisir, sur **deux lignes** :
 *
 * 1. ce **qu'est** l'objet — son nom, et son modèle en second ;
 * 2. **où il en est et chez qui** — l'état, puis le porteur et le lieu.
 *
 * **Rien de destructif ne s'y trouve.** La corbeille de chaque rangée est tombée
 * avec la planche : c'était l'acte le plus irréversible de l'écran, en rouge, à
 * droite, exactement là où passe le pouce qui fait défiler. Une suppression se
 * décide **devant l'objet** — au menu de sa fiche, pas en le survolant.
 *
 * **L'état se dit par une icône *et* un mot** (I3, §0.3), jamais par la couleur
 * seule. Les cinq paires canoniques du registre :
 *
 * | État | Ton | Glyphe |
 * | --- | --- | --- |
 * | en service | `positive` | `CheckCircle` |
 * | attribué | `info` | `ArrowCircleRight` |
 * | en attente | `pending` | `Clock` |
 * | hors service | `attention` | `Warning` |
 * | refus, suppression | `refused` | `XCircle` |
 * | retiré du parc | `muted` | `CircleDashed` |
 *
 * **La sélection appartient à cette rangée** (planche 17.2). Le point de bascule est
 * la rangée elle-même : la vignette cède la place à une case **au pixel près** —
 * même position, mêmes 40 px —, le texte ne bouge pas d'un point, et la zone de
 * frappe passe à 48 sans que rien ne se voie. Deux entrées, dont une **écrite** dans
 * le menu de débordement (S2) : un geste qui ne s'annonce nulle part n'est découvert
 * que par ceux qui le connaissaient déjà. Et **jamais un acte au seul survol** (S4).
 *
 * **Deux faits au téléphone, quatre au-delà** (00.4) : le modèle et la date
 * apparaissent dès `medium` parce que la place existe — ils viennent de la fiche,
 * **aucun n'est inventé pour remplir**.
 */

export type ListRowTone = 'positive' | 'info' | 'pending' | 'attention' | 'refused' | 'muted';

/**
 * **La teinte est portée par le glyphe, pas par le mot.** C'est ce que 04.1 dessine
 * — l'icône est colorée, le libellé garde l'encre de la rangée — et c'est aussi ce
 * qui tient l'accessibilité : un objet graphique se juge à 3:1 (WCAG 1.4.11), un
 * texte à 4,5:1. Colorer le mot obligerait à ne garder que les teintes les plus
 * sombres, donc à perdre la distinction orange / rouge du registre §0.3.
 *
 * *(00.4 colore les deux ; c'est 04.1 qui l'emporte, étant la planche de la page.)* *
 * **Une teinte manque au produit, et il faut le savoir.** Le registre §0.3 fixe
 * *cinq* états dont un **orange** (celui du registre, hors service) distinct du rouge de
 * refus. La palette du produit n'a pas cet orange à un contraste tenable :
 * `attention` emprunte donc `danger` et ne se distingue de `refused` que par la
 * nuance et par son glyphe. À reprendre le jour où la couche de couleur bascule —
 * c'est un jeton à ajouter, pas une décision de composant.
 */
export const TONE_CLASS: Record<ListRowTone, string> = {
    positive: 'text-[var(--tk-color-st-vert)]',
    info: 'text-[var(--tk-color-st-bleu)]',
    pending: 'text-[var(--tk-color-st-ambre)]',
    attention: 'text-[var(--tk-color-st-orange)]',
    refused: 'text-[var(--tk-color-st-rouge)]',
    muted: 'text-[var(--tk-color-st-gris)]',
};

export interface ListRowStatus {
    /** Le pictogramme de l'état — table de `CORRESPONDANCE-ICONES.md`. */
    icon: PhosphorGlyph;
    /** Le mot. Il ne s'omet pas : une couleur seule n'est pas un état (I3). */
    label: string;
    tone: ListRowTone;
}

interface ListRowProps {
    /** La vignette de 40 px — photo, glyphe de catégorie ou initiales (§2.2). */
    vignette?: React.ReactNode;
    /** Ce qu'est l'objet : son code, son nom. */
    title: React.ReactNode;
    /** Le modèle, le type : aligné à droite sur la ligne 1. */
    type?: React.ReactNode;
    status?: ListRowStatus;
    /** Chez qui, et où. C'est l'information la plus demandée sur un parc. */
    holder?: React.ReactNode;
    /** La référence, à droite de la seconde ligne — chiffres tabulaires (ex: ASSET-10001). */
    reference?: React.ReactNode;
    referenceClassName?: string;
    /** Quatrième fait, dès `medium` : la date du dernier mouvement. */
    date?: React.ReactNode;
    /**
     * **Variante déclarée (§2.27) — la marque à droite de la rangée entière**, demandée
     * par la campagne d'audit (planche 16.2).
     *
     * La rangée canonique de 04.1 met l'état sur la **seconde ligne**, devant le porteur :
     * dans une liste de parc, l'état qualifie l'objet. Dans une campagne, il ne qualifie
     * pas l'objet mais **le relevé** — *à scanner*, *retrouvé il y a 12 min*, *manquant* —
     * et c'est le seul axe qu'on parcourt du regard, colonne par colonne, en tenant un
     * téléphone. D'où la marque à droite, alignée d'une rangée à l'autre.
     *
     * `status` reste disponible en parallèle : la campagne ne l'emploie pas, parce qu'elle
     * n'a rien à dire de l'état de l'objet — c'est justement l'objet de l'audit de le dire.
     * Optionnelle : les rangées de 04.1 et 05.1 ne la passent pas et ne changent pas.
     */
    mark?: ListRowStatus;
    /** Ouvre la fiche. */
    onOpen?: () => void;
    /** Le régime de sélection est-il engagé sur cet écran ? (17.2) */
    selectionActive?: boolean;
    selected?: boolean;
    onToggle?: () => void;
    /** Entrer en sélection par l'appui long — la seconde entrée de S2. */
    onLongPress?: () => void;
    className?: string;
}

const ListRow: React.FC<ListRowProps> = ({
    vignette,
    title,
    type,
    status,
    holder,
    reference,
    referenceClassName,
    date,
    mark,
    onOpen,
    selectionActive = false,
    selected = false,
    onToggle,
    onLongPress,
    className,
}) => {
    const longPress = useLongPress(selectionActive ? undefined : onLongPress);

    const content = (
        <>
            {selectionActive ? (
                <span
                    className={cn(
                        'touch-target flex h-10 w-10 shrink-0 items-center justify-center',
                        selected ? 'text-on-surface' : 'text-on-surface-variant'
                    )}
                >
                    <Icon glyph={selected ? CheckSquare : Square} emphasis={selected ? 'fill' : 'regular'} />
                </span>
            ) : (
                vignette && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-vignette bg-surface-container text-on-surface-variant">
                        {vignette}
                    </span>
                )
            )}

            <span className="min-w-0 flex-1">
                {/* Ligne 1 : Nom/Code à gauche, Type à droite */}
                <span className="flex items-baseline gap-2.5">
                    <span className="truncate text-[15px] font-medium leading-5 text-on-surface">
                        {title}
                    </span>
                    {type && (
                        <span className="ml-auto shrink-0 whitespace-nowrap text-[12px] text-text-secondary">
                            {type}
                        </span>
                    )}
                </span>

                {/* Ligne 2 : Icône d'état + Porteur/État à gauche, Asset ID à droite */}
                <span className="mt-[3px] flex min-w-0 items-center gap-[7px] text-[13px] text-text-secondary">
                    {status && (
                        <Icon glyph={status.icon} size={18} className={cn('shrink-0', TONE_CLASS[status.tone])} />
                    )}
                    <span className="truncate">{holder || status?.label}</span>
                    {reference && (
                        <span
                            className={cn(
                                'ml-auto shrink-0 whitespace-nowrap text-[11px] tabular-nums tracking-[0.02em]',
                                referenceClassName || 'text-text-muted'
                            )}
                        >
                            {reference}
                        </span>
                    )}
                </span>
            </span>

            {date && (
                <span className="hidden whitespace-nowrap text-body-small tabular-nums text-on-surface-variant medium:block">
                    {date}
                </span>
            )}

            {/* La marque, à toutes les largeurs : c'est l'axe de lecture de la campagne,
                pas un quatrième fait qu'on peut se permettre de cacher en compact. */}
            {mark && (
                <span className="flex shrink-0 items-center gap-[5px] whitespace-nowrap text-[12px] text-text-secondary">
                    <Icon glyph={mark.icon} size={18} className={cn('shrink-0', TONE_CLASS[mark.tone])} />
                    {mark.label}
                </span>
            )}
        </>
    );

    const shell = cn(
        'flex min-h-[72px] w-full items-center gap-3 border-t border-outline-variant py-2.5 text-left first:border-t-0',
        (onOpen || selectionActive) &&
            'outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        // Le fond de la rangée cochée déborde la gouttière de la carte (16 px) :
        // sinon la surbrillance s'arrête au texte et la rangée paraît coupée.
        selected &&
            'bg-surface-container shadow-[-16px_0_0_var(--tk-color-surface-container),16px_0_0_var(--tk-color-surface-container)]',
        className
    );

    if (selectionActive) {
        return (
            <div
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        onToggle?.();
                    }
                }}
                className={cn(shell, 'cursor-pointer')}
            >
                {content}
            </div>
        );
    }

    if (!onOpen) {
        return <div className={shell}>{content}</div>;
    }

    return (
        <button type="button" onClick={onOpen} {...longPress} className={shell}>
            {content}
        </button>
    );
};

export default ListRow;
