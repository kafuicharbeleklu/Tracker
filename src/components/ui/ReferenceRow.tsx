import React, { useState } from 'react';
import { Copy } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Rangée de référence — registre **§2.11**, planche **04.2**.
 *
 * Une étiquette à gauche, sa valeur à droite. C'est le composant de la moitié des
 * cartes du produit, et le registre en fixe **la déclaration entière** : 44 px de
 * haut, 11 px de gouttière, filet entre rangées, 13/19.
 *
 * **Le gris est porté par l'étiquette, jamais par la rangée.** C'est le point qui
 * compte, et c'est le seul mécanisme qui survive à une rangée portant un troisième
 * enfant : griser la rangée puis rencrer la valeur laisse tout le reste — une
 * sous-ligne, une pastille, un bouton de copie — hériter du gris sans que personne
 * l'ait décidé.
 *
 * > Ce composant a coûté d'être appris : la règle écrite le 01/08 ne fixait que
 * > `font-size` et `padding`, si bien que **deux anatomies opposées la respectaient
 * > toutes les deux**. Une règle qui ne fixe qu'une partie d'un composant ne le
 * > tient pas : elle légitime ses variantes.
 *
 * **La valeur copiable** (`copyable`) est réservée à ce qu'on lit à voix haute au
 * téléphone avec le support — le numéro de série, et à peu près rien d'autre. Sur
 * 04.2 il passe **en premier** de la référence technique : il était dernier.
 */

interface ReferenceRowProps {
    /** L'étiquette. C'est elle qui porte le gris. */
    label: React.ReactNode;
    value: React.ReactNode;
    /** Sous-ligne de la valeur — une destination, une provenance. */
    detail?: React.ReactNode;
    /** Valeur estompée : ce qui n'est pas renseigné, sans le prétendre absent. */
    quiet?: boolean;
    /** Rend la valeur copiable d'un geste. */
    copyable?: boolean;
    className?: string;
}

const ReferenceRow: React.FC<ReferenceRowProps> = ({
    label,
    value,
    detail,
    quiet = false,
    copyable = false,
    className,
}) => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            className={cn(
                'flex min-h-11 items-center justify-between gap-3.5 border-t border-outline-variant py-[11px] text-body-medium leading-[19px] first:border-t-0',
                className
            )}
        >
            <span className="shrink-0 text-text-secondary">{label}</span>

            {copyable ? (
                <button
                    type="button"
                    onClick={copy}
                    className="touch-target -mr-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-body-large font-medium text-on-surface outline-none hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                    <span className="tabular-nums tracking-wide">{value}</span>
                    <Icon glyph={Copy} size={18} className="text-on-surface-variant" />
                    <span className="sr-only">{copied ? 'Copié' : 'Copier'}</span>
                </button>
            ) : (
                <span
                    className={cn(
                        'min-w-0 break-words text-right',
                        quiet ? 'text-on-surface-variant' : 'font-medium text-on-surface'
                    )}
                >
                    {value}
                    {detail && (
                        <span className="mt-0.5 block text-label-small font-normal text-on-surface-variant">
                            {detail}
                        </span>
                    )}
                </span>
            )}
        </div>
    );
};

export default ReferenceRow;
