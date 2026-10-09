import React, { useMemo } from 'react';
import { FolderOpen } from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ScreenState from '../../../components/ui/ScreenState';
import { MEDIA } from '../../../constants/breakpoints';
import { getCategoryLabel } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ModelesDuType from '../components/ModelesDuType';

interface TypeModelesPageProps {
    categoryId: string;
    onBack: () => void;
    onModelClick: (id: string) => void;
}

/**
 * **Les modèles d'un type, tous** (09/10) — `/management/categories/<type>/modeles`.
 *
 * La fiche du type en montre les plus fournis et renvoie ici pour le reste, comme la fiche
 * d'un site renvoie à la page de ses locaux : sa carte ne défile plus dans sa hauteur.
 */
const TypeModelesPage: React.FC<TypeModelesPageProps> = ({ categoryId, onBack, onModelClick }) => {
    const { categories, models } = useData();
    const enGrille = useMediaQuery(MEDIA.expandedUp);
    const category = categories.find((c) => c.id === categoryId);
    const modeles = useMemo(
        () =>
            category
                ? models
                      .filter((m) => m.type === category.name)
                      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
                : [],
        [category, models],
    );

    if (!category) {
        return (
            <ScreenState
                icon={FolderOpen}
                title="Type introuvable"
                description="Ce type n'existe plus dans le catalogue."
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir au catalogue
                    </Button>
                }
            />
        );
    }

    const actifs = modeles.reduce((somme, modele) => somme + modele.count, 0);

    return (
        <DetailTemplate code="Modèles" onBack={onBack}>
            <section className="rounded-card bg-surface p-4">
                <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                        {getCategoryLabel(category.name)}
                    </h3>
                    <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                        {modeles.length} modèle{modeles.length > 1 ? 's' : ''} · {actifs} actif
                        {actifs > 1 ? 's' : ''}
                    </span>
                </div>
                {modeles.length > 0 ? (
                    <ModelesDuType modeles={modeles} enGrille={enGrille} onOuvrir={onModelClick} />
                ) : (
                    <CardEmptyState
                        glyph={FolderOpen}
                        title="Aucun modèle"
                        description="Ce type n'a encore aucun modèle au catalogue."
                    />
                )}
            </section>
        </DetailTemplate>
    );
};

export default TypeModelesPage;
