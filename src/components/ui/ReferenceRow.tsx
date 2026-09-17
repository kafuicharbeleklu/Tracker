import React, { useState } from 'react';
import { Copy } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Rangée de référence — registre **§2.11**, planche **04.2**.
 *
 * Une étiquette à gauche, sa valeur à droite. C'est le composant de la moitié des
 * cartes du produit, et la planche en fixe **la déclaration entière** — passe sobre du
 * 05/09, `.rrow` de 04.2 et 09.2 : **48 px de haut, 12 de remplissage, 16 sur 24**,
 * filet entre rangées, l'étiquette en encre secondaire, la valeur en encre pleine
 * **sans graisse** (R15 : deux graisses, et 500 sur le geste seul), le creux en encre
 * tertiaire. Le registre §2.11 disait 44 / 11 / 13 : c'était l'échelle d'avant R15,
 * et 13 n'est sur aucune marche.
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
                'border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6 first:border-t-0',
                className,
            )}
        >
            <span className="text-on-surface-variant shrink-0">{label}</span>

            {copyable ? (
                <button
                    type="button"
                    onClick={copy}
                    /* `.cp` — 44 de haut, 8 d'intérieur, en 16 tabulaire et sans graisse. */
                    className="touch-target text-on-surface hover:bg-surface-container focus-visible:ring-focus-ring -mr-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-[16px] leading-6 font-normal outline-none focus-visible:ring-2"
                >
                    <span className="tracking-wide tabular-nums">{value}</span>
                    <Icon glyph={Copy} size={18} className="text-on-surface-variant" />
                    <span className="sr-only">{copied ? 'Copié' : 'Copier'}</span>
                </button>
            ) : (
                <span
                    className={cn(
                        'min-w-0 text-right break-words',
                        quiet ? 'text-text-tertiary' : 'text-on-surface',
                    )}
                >
                    {value}
                    {/* Une phrase, pas une étiquette : 12 sur 16 **sans** interlettrage.
                        `text-label-small` en porte `.075em`, fait pour les capitales — sur
                        une phrase en minuscules, il l'étire lettre à lettre. */}
                    {detail && (
                        <span className="text-on-surface-variant mt-0.5 block text-[12px] leading-4 font-normal">
                            {detail}
                        </span>
                    )}
                </span>
            )}
        </div>
    );
};

export default ReferenceRow;
