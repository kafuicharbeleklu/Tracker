import React, { useState } from 'react';

import Button from './Button';
import FacetChip from './FacetChip';

/**
 * **Un axe de filtre qui ne déborde pas** — arbitrage du 22/09.
 *
 * R11 range les partitions dans la feuille, en puces : c'est là qu'on les compare avant
 * de choisir. Mais un axe qui porte huit valeurs en pose trois rangées, et la feuille de
 * l'Équipe montait à **quatre axes, vingt-deux puces, 800 px** — Material borne la
 * hauteur d'ouverture d'une feuille modale à la moitié de l'écran, et demande de n'y
 * mettre que l'essentiel ; NN/g dit la même chose autrement : ce qui sert rarement se
 * déplie, ce qui sert souvent reste sous les yeux.
 *
 * L'axe montre donc ses **six premières valeurs** et nomme le reste (« Voir les 4
 * autres »). **La valeur retenue est toujours visible**, où qu'elle soit dans la liste :
 * le repli ne doit jamais cacher le filtre qu'on a posé — c'est le « mauvais partage »
 * que NN/g décrit, quand le dépliage cache ce dont on a besoin.
 */
export interface FacetChipGroupOption {
    id: string;
    label: string;
    /** Le décompte de la valeur. Un filtre sans compte se choisit à l'aveugle (16.1). */
    count?: number;
}

interface FacetChipGroupProps {
    /** Le nom de l'axe — « Rôle », « Département ». */
    label: string;
    options: FacetChipGroupOption[];
    value: string;
    onChange: (id: string) => void;
    /** Combien de valeurs se voient sans déplier. Six, sauf mention contraire. */
    max?: number;
}

const FacetChipGroup: React.FC<FacetChipGroupProps> = ({
    label,
    options,
    value,
    onChange,
    max = 6,
}) => {
    const [deplie, setDeplie] = useState(false);
    const choisiAuDela = options.findIndex((option) => option.id === value) >= max;
    const visibles =
        deplie || options.length <= max
            ? options
            : /* La valeur retenue prend la dernière place visible : on ne replie pas un
                 filtre posé hors de vue. */
              choisiAuDela
              ? [...options.slice(0, max - 1), options.find((option) => option.id === value)!]
              : options.slice(0, max);
    const reste = options.length - visibles.length;

    return (
        <div>
            <p className="text-on-surface-variant mb-2 text-[0.75rem] leading-4 font-medium">
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {visibles.map((option) => (
                    <FacetChip
                        key={option.id}
                        label={option.label}
                        count={option.count}
                        selected={value === option.id}
                        onClick={() => onChange(option.id)}
                    />
                ))}
                {reste > 0 && (
                    <Button
                        variant="text"
                        onClick={() => setDeplie(true)}
                        className="text-on-surface text-ts-sub min-h-10 px-2 font-medium underline underline-offset-2"
                    >
                        Voir {reste > 1 ? `les ${reste} autres` : "l'autre"}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default FacetChipGroup;
