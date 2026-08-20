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
 */

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Nom accessible quand aucun libellé n'est visible. */
    label?: string;
    className?: string;
}

const SearchField: React.FC<SearchFieldProps> = ({
    value,
    onChange,
    placeholder,
    label = 'Rechercher',
    className,
}) => {
    const id = useId();

    return (
        <div
            className={cn(
                'border-outline bg-surface flex h-12 min-w-0 items-center gap-2.5 rounded-md border px-3',
                'focus-within:ring-focus-ring focus-within:ring-2',
                className,
            )}
        >
            <Icon glyph={MagnifyingGlass} size={20} className="text-on-surface-variant" />
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="text-body-large text-on-surface placeholder:text-on-surface-variant min-w-0 flex-1 bg-transparent outline-none"
            />
        </div>
    );
};

export default SearchField;
