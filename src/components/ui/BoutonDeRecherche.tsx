import React from 'react';
import { Funnel, MagnifyingGlass, X } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';

/**
 * **La loupe d'un en-tête de téléphone** (10/10) — à l'extrémité du titre, elle déplie la
 * recherche et ce qui l'accompagne (`useRechercheRepliee`) ; dépliée, elle devient la croix
 * qui la referme.
 *
 * Une liste qui n'a que des filtres, sans champ, montre l'entonnoir à la place. Le point dit
 * que quelque chose filtre encore la liste alors que la bande est repliée : sans lui, une
 * liste réduite n'aurait plus d'étiquette.
 */
const BoutonDeRecherche: React.FC<{
    ouverte: boolean;
    onBasculer: () => void;
    /** Un filtre ou une puce reste posé, bande repliée. */
    pose?: boolean;
    /** Pas de champ de recherche : le bouton n'ouvre que des filtres. */
    filtresSeuls?: boolean;
    className?: string;
}> = ({ ouverte, onBasculer, pose = false, filtresSeuls = false, className }) => {
    const nom = filtresSeuls ? 'Filtrer' : 'Rechercher';
    return (
        <Button
            variant="text"
            iconOnly
            aria-expanded={ouverte}
            aria-label={
                ouverte
                    ? `Fermer ${filtresSeuls ? 'les filtres' : 'la recherche'}`
                    : pose
                      ? `${nom} — un filtre est posé`
                      : nom
            }
            onClick={onBasculer}
            className={className}
        >
            <span className="relative flex">
                <Icon glyph={ouverte ? X : filtresSeuls ? Funnel : MagnifyingGlass} size="geste" />
                {pose && !ouverte && (
                    <span
                        aria-hidden="true"
                        className="border-surface absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-[var(--tk-color-st-bleu)]"
                    />
                )}
            </span>
        </Button>
    );
};

export default BoutonDeRecherche;
