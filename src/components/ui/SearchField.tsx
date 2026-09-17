import React, { useId } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * Champ de recherche d'une liste — planches **04.1** et **00.4**.
 *
 * **Une recherche cherche un identifiant que la personne a sous les yeux** : un
 * code collé sur une machine, un nom lu dans un courriel. C'est pourquoi il vit
 * dans la bande attachée à la barre du haut (§2.37) et non dans la page — et
 * pourquoi la file de Tâches n'en a pas (§2.30 : une tâche n'a pas d'identifiant
 * propre, elle ne se cherche pas, elle se vide).
 *
 * **Ce qui le sépare de `SearchFilterBar`** (§11) : celle-ci est la barre MD3 en
 * gélule qui embarque son bouton de filtre ; celui-ci est le **champ seul**, au
 * gabarit des planches — 48 px, rayon 4, filet de contrôle — que le gabarit de
 * liste pose à côté d'un bouton de filtre qu'il ne possède pas. Deux formes, deux
 * rôles ; l'écran qui n'a pas encore basculé garde la première.
 *
 * Au téléphone, il n'est pas permanent : c'est une loupe dans la barre du haut. Il
 * se déplie en champ **dès `medium`**, où la place existe (00.4).
 *
 * ## Le bureau le reprend cerné, et plus court — `dense`
 *
 * 17.11 dessine la ligne d'outils du bureau : `.tools .field` fait **40 de haut, sur
 * `--surface`, avec un filet**, en 14, la loupe en 18. Au téléphone le champ est un
 * creux sans filet parce qu'il occupe la largeur entière d'une bande calme ; au
 * bureau il partage sa ligne avec des pastilles, un tri et un sélecteur, tous cernés
 * de la même façon — le creux y serait le seul objet sans bord, et la ligne perdrait
 * son alignement.
 */

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Nom accessible quand aucun libellé n'est visible. */
    label?: string;
    /** Le régime du bureau (17.11) : 40 de haut, cerné sur `--surface`, texte 14. */
    dense?: boolean;
    className?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
    value,
    onChange,
    placeholder,
    label = 'Rechercher',
    dense = false,
    className,
}) => {
    const id = useId();

    return (
        <div
            className={cn(
                /* `.srch` des planches (03.3, 05.1, 10.1) : un **creux**, pas un
                   cerné — fond `--inset`, aucun filet, rayon 4, 48 de haut,
                   14 de remplissage, gouttière 10, texte 16, invite en encre
                   tertiaire. Le filet doublait la lecture : le champ se voit déjà
                   à son fond, et deux signaux pour une même chose alourdissent la
                   bande du haut, que la passe sobre veut calme. */
                'flex min-w-0 items-center gap-2.5 rounded-[4px] px-3.5',
                dense
                    ? 'bg-surface border-outline-variant h-10 border'
                    : 'bg-surface-container h-12',
                'focus-within:ring-focus-ring focus-within:ring-2',
                className,
            )}
        >
            <Icon
                glyph={MagnifyingGlass}
                size={dense ? 18 : 20}
                className="text-on-surface-variant"
            />
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={cn(
                    'text-on-surface min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--tk-color-text-tertiary)]',
                    dense ? 'text-[14px] leading-5' : 'text-[16px] leading-6',
                )}
            />
        </div>
    );
};

export default SearchField;
