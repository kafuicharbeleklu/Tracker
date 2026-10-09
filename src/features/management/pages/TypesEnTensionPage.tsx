import React, { useMemo } from 'react';
import { Check } from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import FactRow from '../../../components/ui/FactRow';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { typesEnTension } from '../../../lib/tensionDesTypes';

interface TypesEnTensionPageProps {
    onBack: () => void;
    /** La fiche du type, par son identifiant du catalogue. */
    onOpenCategory: (id: string) => void;
}

/**
 * **Les types en tension, tous** (09/10) — `/management/tension`.
 *
 * La carte de l'accueil en montre les plus fournis et renvoie ici pour le reste : elle ne
 * défile pas dans sa hauteur. Un type est en tension quand aucune de ses unités n'est
 * disponible ; sa rangée ouvre sa fiche.
 */
const TypesEnTensionPage: React.FC<TypesEnTensionPageProps> = ({ onBack, onOpenCategory }) => {
    const { equipment: tout, users, categories } = useData();
    const { filterEquipment } = useAccessControl();
    const { enTension, calmes } = useMemo(
        () => typesEnTension(filterEquipment(tout, users)),
        [filterEquipment, tout, users],
    );

    return (
        <DetailTemplate code="Types en tension" onBack={onBack}>
            <section className="rounded-card bg-surface px-4 py-1">
                <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                        Aucune unité disponible
                    </h3>
                    <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                        {enTension.length} type{enTension.length > 1 ? 's' : ''}
                    </span>
                </div>
                {enTension.length > 0 ? (
                    enTension.map((entree) => {
                        /* La tension connaît le type par sa clé de donnée ; sa fiche
                           s'ouvre par son identifiant. Un type absent du catalogue se lit,
                           sans s'ouvrir. */
                        const fiche = categories.find((c) => c.name === entree.type);
                        return (
                            <FactRow
                                key={entree.type}
                                glyph={getCategoryGlyph(entree.type)}
                                tint="orange"
                                title={entree.label}
                                subtitle="0 disponible"
                                figure={{
                                    value: entree.total,
                                    unit: entree.total > 1 ? 'actifs' : 'actif',
                                }}
                                onOpen={fiche ? () => onOpenCategory(fiche.id) : undefined}
                            />
                        );
                    })
                ) : (
                    <CardEmptyState
                        glyph={Check}
                        tone="positive"
                        title="Aucun type en tension"
                        description="Chaque type a au moins une unité disponible."
                    />
                )}
                {enTension.length > 0 && calmes > 0 && (
                    <p className="border-outline-variant text-on-surface-variant text-ts-sub leading-ts-sub border-t py-3">
                        {calmes === 1
                            ? 'L’autre type a au moins une unité.'
                            : `Les ${calmes} autres types ont au moins une unité.`}
                    </p>
                )}
            </section>
        </DetailTemplate>
    );
};

export default TypesEnTensionPage;
