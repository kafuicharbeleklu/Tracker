import React, { useMemo, useState } from 'react';
import { CaretRight } from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import SearchField from '../../../components/ui/SearchField';
import { cn } from '../../../lib/utils';
import type { Concerne } from '../lib/journal';

/** Une personne ou un objet que le journal cite — une ligne du choix. */
export interface ChoixConcerne extends Concerne {
    /** La vignette de 40 : des initiales, ou le glyphe de l'objet. */
    vignette: React.ReactNode;
    /** Une personne se teinte en bleu (`.vig.c-bleu`) ; un objet garde le creux. */
    teinte?: string;
    /** « Support · Lomé Siège · 14 faits » */
    subtitle: string;
    /** Le texte sur lequel porte la recherche : nom, code, numéro de série. */
    searchText: string;
}

/**
 * **Le choix « Personne ou objet »** — le troisième axe de la feuille de 18.1 (*« une
 * personne ou un objet à choisir »*) et la troisième pastille de la ligne d'outils.
 *
 * Il ne se range pas en chips comme la nature et la période : le journal cite soixante
 * personnes et deux cents objets. Il se **cherche** — la recherche et la liste de 06.4,
 * les personnes puis les objets, chaque ligne avec le nombre de faits qui la concernent.
 * On n'y trouve que ce que le journal cite : choisir un nom qui n'y figure pas donnerait
 * une page vide.
 */
const ConcernPicker: React.FC<{
    personnes: ChoixConcerne[];
    objets: ChoixConcerne[];
    onPick: (choix: Concerne) => void;
}> = ({ personnes, objets, onPick }) => {
    const [recherche, setRecherche] = useState('');

    const groupes = useMemo(() => {
        const terme = recherche.trim().toLowerCase();
        const garde = (liste: ChoixConcerne[]) =>
            terme ? liste.filter((c) => c.searchText.toLowerCase().includes(terme)) : liste;
        return [
            { label: 'Personnes', lignes: garde(personnes) },
            { label: 'Objets', lignes: garde(objets) },
        ].filter((groupe) => groupe.lignes.length > 0);
    }, [objets, personnes, recherche]);

    const choisir = (choix: ChoixConcerne) =>
        onPick({ kind: choix.kind, id: choix.id, name: choix.name });

    return (
        <div className="flex flex-col gap-4">
            <SearchField
                value={recherche}
                onChange={setRecherche}
                placeholder="Nom, identifiant, numéro de série"
                label="Chercher une personne ou un objet"
            />

            {groupes.length === 0 ? (
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub py-2">
                    Aucune personne ni aucun objet de ce nom dans le journal.
                </p>
            ) : (
                groupes.map((groupe) => (
                    <div key={groupe.label}>
                        {/* `.lab` — l'axe à gauche, son compte à droite, en 12. */}
                        <p className="text-on-surface-variant mb-2 flex items-baseline justify-between gap-3 text-[0.75rem] leading-4 font-medium">
                            <span>{groupe.label}</span>
                            <span className="text-text-tertiary font-normal tabular-nums">
                                {groupe.lignes.length}
                            </span>
                        </p>
                        {groupe.lignes.map((choix, index) => (
                            <div
                                key={`${choix.kind}-${choix.id}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => choisir(choix)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        choisir(choix);
                                    }
                                }}
                                className={cn(
                                    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                                    index > 0 && 'border-outline-variant border-t',
                                )}
                            >
                                <span
                                    className={cn(
                                        'font-brand text-ts-control flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] font-semibold',
                                        choix.teinte ??
                                            'bg-surface-container text-on-surface-variant',
                                    )}
                                >
                                    {choix.vignette}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            'text-on-surface text-ts-body leading-ts-body block truncate',
                                            choix.kind === 'objet' && 'tabular-nums',
                                        )}
                                    >
                                        {choix.name}
                                    </span>
                                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                        {choix.subtitle}
                                    </span>
                                </span>
                                <Icon
                                    glyph={CaretRight}
                                    size={20}
                                    className="text-text-tertiary shrink-0"
                                />
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
};

export default ConcernPicker;
