import React from 'react';
import { CaretRight, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';
import { TINT_CLASS, type Tint } from './FormParts';
import { cn } from '../../lib/utils';

/**
 * **La rangée à chiffre** (24/09) — une langue unique pour les référentiels au téléphone
 * (Type, Emplacements, Inventaire, Accès).
 *
 * Chacune de ces pages avait inventé sa rangée : du texte seul, « 8 actifs · 8 personnes »
 * en phrase, des boutons « Lancer » empilés, huit rôles gris identiques. La rangée pose
 * toujours les mêmes trois temps :
 *
 * - **à gauche, ce que c'est** — une vignette de 40 teintée par la nature (portée d'un
 *   rôle, état d'un site, marque d'un modèle) ;
 * - **au milieu, son nom et un fait** — 16 sur 24, puis 14 sur 20 en encre secondaire ;
 * - **à droite, le chiffre qui se compare d'une rangée à l'autre** — Archivo 17 et son
 *   unité en 12 dessous —, puis le chevron quand la rangée ouvre.
 *
 * Une rangée « éteinte » (un site jamais servi) garde sa place et baisse d'un ton.
 */
export interface FactRowProps {
    /** Le glyphe de la vignette — ou `vignetteText` pour une initiale. */
    glyph?: PhosphorGlyph;
    vignetteText?: string;
    /** La teinte de la vignette ; sans elle, le creux neutre. */
    tint?: Tint;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Le chiffre de droite et son unité : « 8 » / « actifs ». */
    figure?: { value: React.ReactNode; unit?: React.ReactNode };
    /** Ce qui remplace le chiffre — un bouton, une pastille. */
    trailing?: React.ReactNode;
    onOpen?: () => void;
    muted?: boolean;
    className?: string;
}

const FactRow: React.FC<FactRowProps> = ({
    glyph,
    vignetteText,
    tint,
    title,
    subtitle,
    figure,
    trailing,
    onOpen,
    muted = false,
    className,
}) => {
    const contenu = (
        <>
            <span
                className={cn(
                    'rounded-vignette font-brand text-ts-control flex h-10 w-10 shrink-0 items-center justify-center font-semibold',
                    tint && !muted
                        ? TINT_CLASS[tint]
                        : 'bg-surface-container text-on-surface-variant',
                    muted && 'text-text-muted',
                )}
                aria-hidden="true"
            >
                {glyph ? <Icon glyph={glyph} size={20} /> : vignetteText}
            </span>
            <span className="min-w-0 flex-1">
                <span
                    className={cn(
                        'text-ts-body leading-ts-body block truncate',
                        muted ? 'text-text-secondary' : 'text-on-surface',
                    )}
                >
                    {title}
                </span>
                {subtitle && (
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                        {subtitle}
                    </span>
                )}
            </span>
            {figure && (
                <span className="flex shrink-0 flex-col items-end">
                    <span
                        className={cn(
                            'font-brand text-ts-head leading-ts-head font-semibold tabular-nums',
                            muted ? 'text-text-tertiary' : 'text-on-surface',
                        )}
                    >
                        {figure.value}
                    </span>
                    {figure.unit && (
                        <span className="text-text-muted text-[0.75rem] leading-4">
                            {figure.unit}
                        </span>
                    )}
                </span>
            )}
            {trailing}
            {onOpen && (
                <Icon glyph={CaretRight} size={20} className="text-text-tertiary -mr-1 shrink-0" />
            )}
        </>
    );

    const forme = cn(
        'border-outline-variant flex min-h-16 w-full items-center gap-3 border-t py-3 text-left first:border-t-0',
        className,
    );

    return onOpen ? (
        <Button
            variant="text"
            layout="card"
            onClick={onOpen}
            className={cn(
                forme,
                'hover:bg-surface-container -mx-4 w-[calc(100%+2rem)] rounded-none px-4 font-normal',
            )}
        >
            {contenu}
        </Button>
    ) : (
        <div className={forme}>{contenu}</div>
    );
};

export default FactRow;
