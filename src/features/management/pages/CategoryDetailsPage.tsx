import React, { useMemo, useState } from 'react';
import {
    CaretRight,
    Info,
    Warning,
} from '@phosphor-icons/react';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { renderCategoryIcon } from '../../../data/mockData';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useToast } from '../../../context/ToastContext';
import AddCategoryPage from './AddCategoryPage';

interface CategoryDetailsPageProps {
    categoryId: string;
    onBack: () => void;
    onModelClick: (id: string) => void;
}

const CategoryDetailsPage: React.FC<CategoryDetailsPageProps> = ({ categoryId, onBack, onModelClick }) => {
    const { equipment, categories, models, deleteCategory } = useData();
    const { navigateToView } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();
    const { showToast } = useToast();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const category = categories.find((c) => c.id === categoryId);

    const categoryModels = useMemo(
        () => (category ? models.filter((m) => m.type === category.name) : []),
        [category, models]
    );
    const categoryEquipment = useMemo(
        () => (category ? equipment.filter((e) => e.type === category.name) : []),
        [equipment, category]
    );

    if (!category) {
        return (
            <ScreenState
                title="Catégorie introuvable"
                description="La catégorie demandée n'existe pas ou a été retirée du catalogue."
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir au catalogue
                    </Button>
                }
            />
        );
    }

    // B1 — la clé de la donnée **est** le nom porté par le type ; le français est un
    // libellé. Cet écran la montre, les autres ne la montrent jamais (09.1). La famille
    // se lit sur le type (A2) : elle était déduite du nom par un `switch` de trente
    // lignes, qui se trompait sur tout type créé après lui.
    const family = category.family || 'Mobilier et divers';
    const dataKey = category.name;
    const isDataKeyReleve = true;
    const isAssignable = category.assignable !== false;
    const depreciationYears = category.defaultDepreciation?.years ?? 3;
    const depreciationMethod = category.defaultDepreciation?.method === 'degressive' ? 'Dégressif' : 'Linéaire';

    return (
        <DetailTemplate
            code={category.name}
            reference={`${categoryEquipment.length} actif(s) · ${categoryModels.length} modèle(s)`}
            onBack={onBack}
            hero={
                <section className="flex flex-col gap-3 rounded-lg bg-inverse-surface p-4 text-inverse-on-surface">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-white/12 text-white">
                            {renderCategoryIcon(category, 28)}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <h1 className="truncate font-brand text-[20px] font-semibold tracking-[-0.01em] text-white">
                                {category.name}
                            </h1>
                            <p className="mt-0.5 text-[13px] text-text-secondary">
                                {family} · {isAssignable ? 'Attribuable' : 'Non attribuable'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2.5 border-t border-white/14 pt-3.5">
                        <b className="font-brand text-[32px] font-semibold tracking-[-0.01em] tabular-nums text-white">
                            {categoryEquipment.length}
                        </b>
                        <span className="text-[13px] leading-[19px] text-text-secondary">
                            actif{categoryEquipment.length > 1 ? 's' : ''} au parc sur {categoryModels.length} modèle{categoryModels.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </section>
            }
        >
            {/* Section 1 : Caractéristiques du type (Planche 09.1) */}
            <section className="rounded-lg bg-surface p-4 shadow-elevation-1 divide-y divide-outline-variant">
                <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-body-medium text-on-surface">Famille</span>
                    <span className="text-body-medium font-medium text-on-surface">{family}</span>
                </div>
                <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-body-medium text-on-surface">Attribuable à une personne</span>
                        <span className="text-body-small text-text-secondary">
                            {isAssignable
                                ? "décide si le type entre dans le sélecteur d'attribution"
                                : 'ne se remet pas en main propre'}
                        </span>
                    </div>
                    <span className="text-body-medium font-medium text-on-surface shrink-0">
                        {isAssignable ? 'Oui' : 'Non'}
                    </span>
                </div>
                <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-body-medium text-on-surface">Clé de la donnée</span>
                        <span className="text-body-small text-text-secondary">
                            {isDataKeyReleve
                                ? 'ce que lisent les imports et les intégrations'
                                : 'aucune clé relevée — les imports ne savent pas nommer ce type'}
                        </span>
                    </div>
                    <span
                        className={`text-body-medium shrink-0 ${
                            isDataKeyReleve ? 'font-medium text-on-surface' : 'text-text-secondary italic'
                        }`}
                    >
                        {dataKey}
                    </span>
                </div>
                <div className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-body-medium text-on-surface">Amortissement</span>
                        <span className="text-body-small text-text-secondary">
                            décide de la valeur actuelle affichée en Finances
                        </span>
                    </div>
                    <span className="text-body-medium font-medium text-on-surface shrink-0 text-right">
                        {depreciationMethod} <span className="block text-body-small font-normal text-text-secondary">{depreciationYears} ans</span>
                    </span>
                </div>
            </section>

            {/* Section 2 : Modèles référencés */}
            <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="text-body-medium font-semibold text-on-surface">Modèles</h3>
                    <span className="font-brand text-body-medium font-semibold tabular-nums text-text-secondary">
                        {categoryModels.length}
                    </span>
                </div>

                {categoryModels.length > 0 ? (
                    <div className="divide-y divide-outline-variant">
                        {categoryModels.map((model) => (
                            <div
                                key={model.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onModelClick(model.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onModelClick(model.id);
                                    }
                                }}
                                className="flex min-h-14 w-full items-center gap-3 py-2 text-left transition-colors hover:bg-surface-container cursor-pointer px-1 rounded-md"
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="font-brand text-body-medium font-semibold text-on-surface truncate">
                                            {model.name}
                                        </span>
                                        <span className="text-body-small font-medium text-on-surface shrink-0">
                                            {model.brand || ''}
                                        </span>
                                    </div>
                                    <span className="truncate text-body-small text-text-secondary">
                                        {model.count} actif{model.count > 1 ? 's' : ''} dans le parc
                                    </span>
                                </div>
                                <Icon glyph={CaretRight} size={18} className="shrink-0 text-text-secondary" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-start gap-2.5 rounded-md bg-surface-container p-3 text-body-small text-on-surface">
                        <Icon glyph={Warning} size={18} className="text-[var(--tk-color-st-ambre)] shrink-0 mt-0.5" />
                        <span>
                            <strong>Aucun modèle.</strong> Tant qu'il n'y en a pas un, ce type n'apparaît pas dans la création d'équipement.
                        </span>
                    </div>
                )}
            </section>

            {/* Section 3 : Note d'amortissement et actions */}
            <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col gap-3">
                <div className="flex items-start gap-2.5 rounded-md bg-surface-container p-3 text-body-small text-text-secondary">
                    <Icon glyph={Info} size={18} className="shrink-0 text-text-secondary mt-0.5" />
                    <span>
                        Changer l'amortissement <strong>ne recalcule pas le passé</strong> : la valeur des {categoryEquipment.length} actifs déjà créés suit le paramètre en vigueur à leur acquisition.
                    </span>
                </div>

                {categoryEquipment.length > 0 && (
                    <Button
                        variant="text"
                        onClick={() => navigateToView('equipment')}
                        className="flex min-h-12 w-full items-center justify-start gap-2.5 border-t border-outline-variant pt-2 text-left text-body-medium font-medium text-on-surface transition-colors hover:text-text-secondary rounded-none px-1"
                    >
                        <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
                        <span>Voir les {categoryEquipment.length} actifs dans l'inventaire</span>
                    </Button>
                )}
            </section>

            {/* Les deux actes du type. **Rien de destructif dans une rangée** : une
                suppression se décide devant l'objet, jamais en le survolant dans une
                liste (04.1). Ils étaient au survol d'une carte du catalogue. */}
            <section className="flex flex-col gap-3">
                <Button variant="outlined" onClick={() => setIsEditOpen(true)}>
                    Modifier le type
                </Button>
                <Button
                    variant="text"
                    className="text-error"
                    onClick={() =>
                        requestConfirmation({
                            title: `Supprimer « ${category.name} » du catalogue ?`,
                            message:
                                categoryEquipment.length > 0
                                    ? `${categoryEquipment.length} actif(s) portent ce type. Ils ne sont pas supprimés, mais plus rien ne définira ce qu'ils sont.`
                                    : 'Aucun actif ne porte ce type. Les modèles qui en dépendent perdent leur rattachement.',
                            confirmText: 'Supprimer le type',
                            tone: 'destructive',
                            irreversible: true,
                            onConfirm: () => {
                                deleteCategory(category.id);
                                showToast(`« ${category.name} » supprimé du catalogue.`, 'success');
                                onBack();
                            },
                        })
                    }
                >
                    Supprimer le type
                </Button>
            </section>

            <AddCategoryPage
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                categoryToEdit={category}
            />
        </DetailTemplate>
    );
};

export default CategoryDetailsPage;



