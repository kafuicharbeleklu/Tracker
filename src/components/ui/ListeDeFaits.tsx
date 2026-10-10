import React from 'react';

import { cn } from '../../lib/utils';

/**
 * **La liste de faits d'un détail** (10/10) — une seule forme pour ce qu'on relit d'un objet
 * ouvert : les faits d'une facture, ce qu'une machine dit d'elle-même, ce que le journal a
 * noté d'un fait.
 *
 * Chaque détail avait la sienne. La dépense posait une grille de 148 px en tailles fixes du
 * bureau (13 et 14, au téléphone comme ailleurs) ; la collecte, des rangées de 48 en corps
 * 16 avec la valeur en gras, alignée à droite ; l'historique, une troisième. Trois écritures
 * du même objet, et aucune ne suivait l'échelle par régime.
 *
 * Celle-ci prend **le secondaire de l'échelle** (`text-ts-sub` : 14 sur 20 au doigt, 13 sur 18
 * au bureau), l'étiquette à l'encre secondaire, la valeur à l'encre pleine, sans graisse, à
 * gauche ; un filet entre les rangées. Une ligne sans valeur ne paraît pas : pas de « non
 * renseigné » à lire.
 *
 * L'étiquette prend 38 % de la largeur, 176 px au plus : « Date de la facture » tient sur une
 * ligne dans une feuille de 393, et la valeur ne part pas à 250 px dans un panneau de 700.
 */
export type Fait = readonly [etiquette: string, valeur: React.ReactNode | undefined | null | false];

const ListeDeFaits: React.FC<{
    faits: readonly Fait[];
    /** Ce que la liste décrit, pour un lecteur d'écran. */
    label?: string;
    /** Les valeurs sont des nombres ou des codes : chiffres tabulaires. */
    chiffres?: boolean;
    className?: string;
}> = ({ faits, label, chiffres = false, className }) => {
    const montres = faits.filter(
        (fait) => fait[1] !== undefined && fait[1] !== null && fait[1] !== false && fait[1] !== '',
    );
    if (montres.length === 0) return null;
    return (
        <dl
            aria-label={label}
            className={cn(
                'border-outline-variant text-ts-sub leading-ts-sub grid grid-cols-[minmax(96px,min(38%,11rem))_minmax(0,1fr)] border-b',
                className,
            )}
        >
            {montres.map(([etiquette, valeur]) => (
                <React.Fragment key={etiquette}>
                    <dt className="border-outline-variant text-text-secondary border-t py-2 pr-3">
                        {etiquette}
                    </dt>
                    <dd
                        className={cn(
                            'border-outline-variant text-on-surface min-w-0 border-t py-2 break-words',
                            chiffres && 'tabular-nums',
                        )}
                    >
                        {valeur}
                    </dd>
                </React.Fragment>
            ))}
        </dl>
    );
};

export default ListeDeFaits;
