import React from 'react';
import { Info } from '@phosphor-icons/react';

import Icon from './Icon';
import Tooltip from './Tooltip';
import { cn } from '../../lib/utils';

/**
 * L'infobulle **ⓘ** — `.iw`/`.info`/`.tip` des planches **11.1**, **14.1** et **17.9**.
 *
 * ## Ce qu'elle porte, et ce qu'elle ne porte pas
 *
 * Elle porte **ce qui explique un chiffre**, et rien d'autre : pourquoi « 4 » ne dit
 * pas ce que le rôle porte vraiment, ce que « 24 permissions » recouvre, ce que
 * « par défaut » veut dire. Une explication qui ne se rattache à aucune valeur n'est
 * pas une infobulle : c'est un pied de groupe, et il a sa forme (`RuleGroup` `note`).
 *
 * ## Pourquoi elle existe — la passe R13 du 19/08
 *
 * 11.1 portait **30 phrases longues dans ses cadres**, le record du chantier, parce
 * qu'elle se servait du téléphone comme d'un carnet de relevé. L'arbitrage tient en
 * trois gestes : le relevé de code **descend sous le cadre**, où il a la place ; ce
 * qui **explique un chiffre monte en ⓘ** ; et il ne reste **qu'un seul repli**, celui
 * qui a un renvoi. Sans ce composant, les trois retombent en pavés gris permanents —
 * du texte que personne ne lit, posé là où il gêne la lecture des rangées.
 *
 * ## La forme
 *
 * Le glyphe fait 18 px et vit dans une cible de 44 px (§2.14) : la couronne déborde
 * le dessin, elle ne l'élargit pas. La bulle porte **deux lignes** — un titre en
 * encre pleine, un détail en encre secondaire —, jamais un paragraphe : au-delà de
 * deux lignes, le fait appartient au pied du groupe.
 */
interface InfoTipProps {
    /** La première ligne de la bulle, en encre pleine. Une proposition, pas un titre. */
    title: React.ReactNode;
    /** La seconde ligne, en encre secondaire. Facultative. */
    detail?: React.ReactNode;
    /** Ce que le lecteur d'écran annonce à la place du glyphe. */
    label?: string;
    className?: string;
}

const InfoTip: React.FC<InfoTipProps> = ({ title, detail, label, className }) => (
    <Tooltip
        variant="rich"
        placement="top"
        strategy="fixed"
        content={
            <span className="block">
                <span className="text-inverse-on-surface block font-medium">{title}</span>
                {detail && <span className="text-on-nav-surface-variant block">{detail}</span>}
            </span>
        }
    >
        <button
            type="button"
            aria-label={label ?? (typeof title === 'string' ? title : 'En savoir plus')}
            className={cn(
                /* `.info::before` de la planche : la cible de 44 px est une couronne
                   posée autour du glyphe, pas une boîte de 44 qui écarterait le
                   chiffre auquel l'ⓘ est collée. */
                'text-text-muted hover:text-on-surface relative inline-flex h-[18px] w-[18px]',
                'items-center justify-center rounded-full align-[-4px] outline-none',
                'focus-visible:ring-focus-ring focus-visible:ring-2',
                'before:absolute before:-top-[13px] before:-left-[13px] before:h-11 before:w-11',
                className,
            )}
        >
            <Icon glyph={Info} size={18} />
        </button>
    </Tooltip>
);

export default InfoTip;
