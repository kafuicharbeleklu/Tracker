import React, { useState, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import Toggle from '../../../components/ui/Toggle';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import { CATEGORY_FAMILIES, Category, CategoryFamily } from '../../../types';
import { CATEGORY_ICONS } from '../../../constants/categoryIcons';

interface AddCategoryPageProps {
    isOpen: boolean;
    onClose: () => void;
    categoryToEdit?: Category | null;
}

const AddCategoryPage: React.FC<AddCategoryPageProps> = ({ isOpen, onClose, categoryToEdit }) => {
    const { showToast } = useToast();
    const { addCategory, updateCategory } = useData();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        iconName: 'Laptop',
        family: 'Informatique' as CategoryFamily,
        assignable: true,
        method: 'linear' as 'linear' | 'degressive',
        years: 3,
        salvageValuePercent: 0,
    });

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name,
                description: categoryToEdit.description || '',
                iconName: categoryToEdit.iconName || 'Laptop',
                family: categoryToEdit.family || 'Informatique',
                assignable: categoryToEdit.assignable,
                method: categoryToEdit.defaultDepreciation?.method || 'linear',
                years: categoryToEdit.defaultDepreciation?.years || 3,
                salvageValuePercent: categoryToEdit.defaultDepreciation?.salvageValuePercent || 0,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                iconName: 'Laptop',
                family: 'Informatique',
                assignable: true,
                method: 'linear',
                years: 3,
                salvageValuePercent: 0,
            });
        }
    }, [categoryToEdit, isOpen]);

    // X4 : navigation aux flèches du radiogroup « méthode d'amortissement »
    const handleMethodKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const next = formData.method === 'linear' ? 'degressive' : 'linear';
        setFormData({ ...formData, method: next });
        const radios = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        radios[next === 'linear' ? 0 : 1]?.focus();
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            showToast('Veuillez entrer un nom de catégorie', 'error');
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            icon: CATEGORY_ICONS[formData.iconName],
            iconName: formData.iconName,
            family: formData.family,
            assignable: formData.assignable,
            defaultDepreciation: {
                method: formData.method,
                years: formData.years,
                salvageValuePercent: formData.salvageValuePercent,
            },
        };

        if (categoryToEdit) {
            updateCategory(categoryToEdit.id, payload);
            showToast(`Catégorie "${formData.name}" mise à jour`, 'success');
        } else {
            addCategory(payload);
            showToast('Catégorie créée avec succès', 'success');
        }
        onClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={onClose}>
                Annuler
            </Button>
            <Button
                variant="filled"
                icon={<MaterialIcon name="save" size={18} />}
                onClick={handleSave}
            >
                {categoryToEdit ? 'Enregistrer les modifications' : 'Créer la catégorie'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={categoryToEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            footer={footer}
        >
            <div className="space-y-8">
                {/* Section Informations Générales */}
                <div className="space-y-6">
                    <InputField
                        label="Nom de la catégorie"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Écrans incurvés"
                        variant="outlined"
                        required
                    />

                    {/* A2 — le référentiel se range sur deux niveaux : la famille se choisit
                        à la création du type, elle ne se devine pas de son nom (09.1). */}
                    <SelectField
                        name="category-family"
                        label="Famille"
                        value={formData.family}
                        onChange={(e) =>
                            setFormData({ ...formData, family: e.target.value as CategoryFamily })
                        }
                        options={CATEGORY_FAMILIES.map((family) => ({
                            value: family,
                            label: family,
                        }))}
                    />

                    <div>
                        <TextArea
                            label="Description (Optionnel)"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Détails sur l'utilisation de cette catégorie..."
                            variant="outlined"
                            className="min-h-[100px] resize-none"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Ce que le type autorise — arbitrage du 2026-08-05, REGLES-TRANSVERSES.md §5.7 */}
                <div className="bg-surface-container border-outline-variant space-y-4 rounded-xl border p-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-surface border-outline-variant shadow-elevation-1 text-primary rounded-md border p-1.5">
                            <MaterialIcon name="assignment_ind" size={16} />
                        </div>
                        <h3 className="text-body-medium text-on-surface font-black tracking-wide uppercase">
                            Ce que le type autorise
                        </h3>
                    </div>
                    <Toggle
                        checked={formData.assignable}
                        onChange={(assignable) => setFormData({ ...formData, assignable })}
                        label="Attribuable à une personne"
                    />
                    <p className="text-body-small text-on-surface-variant">
                        {formData.assignable
                            ? "Les objets de ce type apparaissent dans le sélecteur d'attribution."
                            : 'Les objets de ce type en sont retirés — un serveur, une imprimante ou du mobilier sert un lieu, pas une personne. Les attributions déjà faites ne sont pas défaites.'}
                    </p>
                </div>

                {/* Section Configuration Financière Améliorée */}
                <div className="bg-surface-container border-outline-variant space-y-6 rounded-xl border p-6">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="bg-surface border-outline-variant shadow-elevation-1 text-primary rounded-md border p-1.5">
                            <MaterialIcon name="calendar_today" size={16} />
                        </div>
                        <h3 className="text-body-medium text-on-surface font-black tracking-wide uppercase">
                            Amortissement par défaut
                        </h3>
                    </div>

                    {/* Sélecteur de méthode visuel — X4 : sémantique radiogroup */}
                    <div
                        role="radiogroup"
                        aria-label="Méthode d'amortissement"
                        onKeyDown={handleMethodKeyDown}
                        className="expanded:grid-cols-2 grid grid-cols-1 gap-4"
                    >
                        <Button
                            type="button"
                            variant="outlined"
                            layout="card"
                            role="radio"
                            aria-checked={formData.method === 'linear'}
                            tabIndex={formData.method === 'linear' ? 0 : -1}
                            onClick={() => setFormData({ ...formData, method: 'linear' })}
                            className={cn(
                                'group hover:shadow-elevation-2 items-start overflow-hidden rounded-xl border-2 p-4 transition-all',
                                formData.method === 'linear'
                                    ? 'border-primary bg-surface ring-primary/20 ring-1'
                                    : 'border-outline-variant bg-surface hover:border-outline',
                            )}
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <div
                                    className={cn(
                                        'rounded-lg p-2 transition-colors',
                                        // Règle X12 : glyphe sombre sur primary-container (jaune/jaune-pâle ≈1,4:1)
                                        formData.method === 'linear'
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-surface-container text-on-surface-variant',
                                    )}
                                >
                                    <MaterialIcon name="trending_down" size={18} />
                                </div>
                                {formData.method === 'linear' && (
                                    <div className="bg-primary shadow-elevation-1 h-2.5 w-2.5 rounded-full" />
                                )}
                            </div>
                            <span className="text-body-medium text-on-surface mb-0.5 block font-semibold">
                                Linéaire
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Amortissement constant
                            </span>
                        </Button>

                        <Button
                            type="button"
                            variant="outlined"
                            layout="card"
                            role="radio"
                            aria-checked={formData.method === 'degressive'}
                            tabIndex={formData.method === 'degressive' ? 0 : -1}
                            onClick={() => setFormData({ ...formData, method: 'degressive' })}
                            className={cn(
                                'group hover:shadow-elevation-2 items-start overflow-hidden rounded-xl border-2 p-4 transition-all',
                                formData.method === 'degressive'
                                    ? 'border-primary bg-surface ring-primary/20 ring-1'
                                    : 'border-outline-variant bg-surface hover:border-outline',
                            )}
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <div
                                    className={cn(
                                        'rounded-lg p-2 transition-colors',
                                        formData.method === 'degressive'
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-surface-container text-on-surface-variant',
                                    )}
                                >
                                    <MaterialIcon name="show_chart" size={18} />
                                </div>
                                {formData.method === 'degressive' && (
                                    <div className="bg-primary shadow-elevation-1 h-2.5 w-2.5 rounded-full" />
                                )}
                            </div>
                            <span className="text-body-medium text-on-surface mb-0.5 block font-semibold">
                                Dégressif
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Charge plus forte au début
                            </span>
                        </Button>
                    </div>

                    {/* Inputs Numériques */}
                    <div className="expanded:grid-cols-2 grid grid-cols-1 gap-6">
                        <InputField
                            label="Durée d'usage (Années)"
                            type="number"
                            value={formData.years.toString()}
                            onChange={(e) =>
                                setFormData({ ...formData, years: parseInt(e.target.value) || 0 })
                            }
                            variant="outlined"
                            icon={<MaterialIcon name="calendar_today" size={16} />}
                        />
                        <InputField
                            label="Valeur Résiduelle (%)"
                            type="number"
                            value={formData.salvageValuePercent.toString()}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    salvageValuePercent: parseInt(e.target.value) || 0,
                                })
                            }
                            variant="outlined"
                            icon={<MaterialIcon name="percent" size={16} />}
                        />
                    </div>

                    <div className="text-label-small text-on-surface-variant bg-surface border-outline-variant flex items-start gap-2 rounded-lg border p-3">
                        <MaterialIcon
                            name="info"
                            size={14}
                            className="text-primary mt-0.5 shrink-0"
                        />
                        <p>
                            Ces paramètres seront pré-remplis lors de l'ajout d'un nouvel actif de
                            ce type, mais resteront modifiables au cas par cas.
                        </p>
                    </div>
                </div>

                {/* Section Icône */}
                <div>
                    <label className="text-label-large text-on-surface mb-3 ml-1 block font-bold">
                        Sélectionner une icône
                    </label>
                    <div className="medium:grid-cols-8 grid grid-cols-5 gap-3">
                        {Object.entries(CATEGORY_ICONS).map(([name, component]) => (
                            <Button
                                key={name}
                                type="button"
                                variant="text"
                                onClick={() => setFormData({ ...formData, iconName: name })}
                                className={cn(
                                    'aspect-square h-auto min-h-0 w-auto min-w-0 items-center justify-center rounded-xl border-2 p-0 transition-all hover:scale-105 active:scale-95',
                                    // Règle X12 : icône sombre, l'accent jaune reste sur la bordure/ring (non textuel)
                                    formData.iconName === name
                                        ? 'bg-primary-container/45 border-primary text-on-primary-container shadow-elevation-1 ring-primary/20 ring-1'
                                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface hover:border-outline-variant hover:text-on-surface border-transparent',
                                )}
                                title={name}
                            >
                                {React.isValidElement<{ size?: number }>(component)
                                    ? React.cloneElement(component, { size: 20 })
                                    : component}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddCategoryPage;
