import React from 'react';

import Button from '../../../components/ui/Button';
import FactRow from '../../../components/ui/FactRow';
import { NOM_SUR_UNE_LIGNE } from '../../../lib/nomLong';
import { cn } from '../../../lib/utils';
import type { Model } from '../../../types';

/** Combien la fiche d'un type en montre avant de renvoyer à la page de ses modèles. */
export const MODELES_EN_TUILES = 6;
export const MODELES_EN_RANGEES = 5;

/** L'adresse de la page qui porte tous les modèles d'un type. */
export const adresseDesModeles = (typeId: string): string =>
    `/management/categories/${encodeURIComponent(typeId)}/modeles`;

/**
 * **Les modèles d'un type** (09/10) — ce que la fiche du type en montre, et la page qui les
 * porte tous (`/management/categories/<type>/modeles`).
 *
 * La carte « Modèles » était bornée et défilait dans sa hauteur (`ListeBornee`, 25/09) : une
 * liste dans la fiche, et un fondu pour le dire. Elle montre désormais les plus fournis et
 * renvoie au reste. Les deux écrans rendent les mêmes pièces d'ici.
 *
 * **Au bureau, un modèle est une carte** (23/09), comme un type dans le catalogue et un
 * local dans la fiche d'un site : l'initiale de la marque, le nom, la marque, puis ce qu'il
 * compte au parc. Au téléphone, la rangée du système (`FactRow`), l'initiale en vignette.
 */
const ModelesDuType: React.FC<{
    modeles: Model[];
    enGrille: boolean;
    onOuvrir: (id: string) => void;
}> = ({ modeles, enGrille, onOuvrir }) =>
    enGrille ? (
        <ul className="large:grid-cols-3 grid grid-cols-2 gap-3">
            {modeles.map((model) => (
                <li key={model.id}>
                    <Button
                        variant="text"
                        onClick={() => onOuvrir(model.id)}
                        className="bg-surface-container hover:bg-surface-container-high h-full min-h-28 w-full flex-col items-stretch justify-between gap-3 rounded-md p-3 text-left font-normal whitespace-normal"
                    >
                        <span className="flex items-center gap-3">
                            <span className="bg-surface text-on-surface-variant text-ts-control flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-semibold">
                                {(model.brand || model.name).trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span
                                    title={model.name}
                                    className={cn(
                                        'text-on-surface text-ts-body leading-ts-body font-medium',
                                        NOM_SUR_UNE_LIGNE,
                                    )}
                                >
                                    {model.name}
                                </span>
                                {model.brand && (
                                    <span className="text-on-surface-variant block truncate text-[0.75rem] leading-4">
                                        {model.brand}
                                    </span>
                                )}
                            </span>
                        </span>
                        <span>
                            <span className="font-brand text-on-surface text-ts-head leading-ts-head block font-semibold tabular-nums">
                                {model.count}
                            </span>
                            <span className="text-on-surface-variant block text-[0.75rem] leading-4">
                                actif{model.count > 1 ? 's' : ''} au parc
                            </span>
                        </span>
                    </Button>
                </li>
            ))}
        </ul>
    ) : (
        <>
            {modeles.map((model) => (
                <FactRow
                    key={model.id}
                    vignetteText={(model.brand || model.name).trim().charAt(0).toUpperCase()}
                    tint="bleu"
                    title={model.name}
                    subtitle={model.brand || undefined}
                    figure={{
                        value: model.count,
                        unit: model.count > 1 ? 'actifs' : 'actif',
                    }}
                    onOpen={() => onOuvrir(model.id)}
                />
            ))}
        </>
    );

export default ModelesDuType;
