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
import { CATEGORY_ICONS } from '../../../data/mockData';

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
        salvageValuePercent: 0
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
                salvageValuePercent: categoryToEdit.defaultDepreciation?.salvageValuePercent || 0
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
                salvageValuePercent: 0
            });
        }
    }, [categoryToEdit, isOpen]);

    // X4 : navigation aux flèches du radiogroup « méthode d'amortissement »
    const handleMethodKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const next = formData.method === 'linear' ? 'degressive' : 'linear';
        setFormData({ ...formData, method: next });
        e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next === 'linear' ? 0 : 1]?.focus();
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
                salvageValuePercent: formData.salvageValuePercent
            }
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
            <Button variant="outlined" onClick={onClose}>Annuler</Button>
            <Button variant="filled" icon={<MaterialIcon name="save" size={18} />} onClick={handleSave}>
                {categoryToEdit ? 'Enregistrer les modifications' : 'Créer la catégorie'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={categoryToEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
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
                        onChange={(e) => setFormData({ ...formData, family: e.target.value as CategoryFamily })}
                        options={CATEGORY_FAMILIES.map((family) => ({ value: family, label: family }))}
                    />

                    <div>
                        <TextArea
                            label="Description (Optionnel)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Détails sur l'utilisation de cette catégorie..."
                            variant="outlined"
                            className="min-h-[100px] resize-none"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Ce que le type autorise — arbitrage du 2026-08-05, REGLES-TRANSVERSES.md §5.7 */}
                <div className="bg-surface-container rounded-xl p-6 border border-outline-variant space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-surface rounded-md border border-outline-variant shadow-elevation-1 text-primary">
                            <MaterialIcon name="assignment_ind" size={16} />
                        </div>
                        <h3 className="text-body-medium font-black text-on-surface uppercase tracking-wide">
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
                            : "Les objets de ce type en sont retirés — un serveur, une imprimante ou du mobilier sert un lieu, pas une personne. Les attributions déjà faites ne sont pas défaites."}
                    </p>
                </div>

                {/* Section Configuration Financière Améliorée */}
                <div className="bg-surface-container rounded-xl p-6 border border-outline-variant space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-surface rounded-md border border-outline-variant shadow-elevation-1 text-primary">
                            <MaterialIcon name="calendar_today" size={16} />
                        </div>
                        <h3 className="text-body-medium font-black text-on-surface uppercase tracking-wide">
                            Amortissement par défaut
                        </h3>
                    </div>

                    {/* Sélecteur de méthode visuel — X4 : sémantique radiogroup */}
                    <div
                        role="radiogroup"
                        aria-label="Méthode d'amortissement"
                        onKeyDown={handleMethodKeyDown}
                        className="grid grid-cols-1 expanded:grid-cols-2 gap-4"
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
                                "rounded-xl border-2 p-4 items-start transition-all group overflow-hidden hover:shadow-elevation-2",
                                formData.method === 'linear'
                                    ? "border-primary bg-surface ring-1 ring-primary/20"
                                    : "border-outline-variant bg-surface hover:border-outline"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    // Règle X12 : glyphe sombre sur primary-container (jaune/jaune-pâle ≈1,4:1)
                                    formData.method === 'linear' ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                                )}>
                                    <MaterialIcon name="trending_down" size={18} />
                                </div>
                                {formData.method === 'linear' && (
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-elevation-1" />
                                )}
                            </div>
                            <span className="block text-body-medium font-semibold mb-0.5 text-on-surface">
                                Linéaire
                            </span>
                            <span className="text-body-small text-on-surface-variant">Amortissement constant</span>
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
                                "rounded-xl border-2 p-4 items-start transition-all group overflow-hidden hover:shadow-elevation-2",
                                formData.method === 'degressive'
                                    ? "border-primary bg-surface ring-1 ring-primary/20"
                                    : "border-outline-variant bg-surface hover:border-outline"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    formData.method === 'degressive' ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                                )}>
                                    <MaterialIcon name="show_chart" size={18} />
                                </div>
                                {formData.method === 'degressive' && (
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-elevation-1" />
                                )}
                            </div>
                            <span className="block text-body-medium font-semibold mb-0.5 text-on-surface">
                                Dégressif
                            </span>
                            <span className="text-body-small text-on-surface-variant">Charge plus forte au début</span>
                        </Button>
                    </div>

                    {/* Inputs Numériques */}
                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                        <InputField
                            label="Durée d'usage (Années)"
                            type="number"
                            value={formData.years.toString()}
                            onChange={(e) => setFormData({ ...formData, years: parseInt(e.target.value) || 0 })}
                            variant="outlined"
                            icon={<MaterialIcon name="calendar_today" size={16} />}
                        />
                        <InputField
                            label="Valeur Résiduelle (%)"
                            type="number"
                            value={formData.salvageValuePercent.toString()}
                            onChange={(e) => setFormData({ ...formData, salvageValuePercent: parseInt(e.target.value) || 0 })}
                            variant="outlined"
                            icon={<MaterialIcon name="percent" size={16} />}
                        />
                    </div>

                    <div className="flex items-start gap-2 text-label-small text-on-surface-variant bg-surface p-3 rounded-lg border border-outline-variant">
                        <MaterialIcon name="info" size={14} className="text-primary mt-0.5 shrink-0" />
                        <p>Ces paramètres seront pré-remplis lors de l'ajout d'un nouvel actif de ce type, mais resteront modifiables au cas par cas.</p>
                    </div>
                </div>

                {/* Section Icône */}
                <div>
                    <label className="block text-label-large font-bold text-on-surface ml-1 mb-3">Sélectionner une icône</label>
                    <div className="grid grid-cols-5 medium:grid-cols-8 gap-3">
                        {Object.entries(CATEGORY_ICONS).map(([name, component]) => (
                            <Button
                                key={name}
                                type="button"
                                variant="text"
                                onClick={() => setFormData({ ...formData, iconName: name })}
                                className={cn(
                                    "aspect-square w-auto h-auto p-0 min-w-0 min-h-0 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 items-center justify-center",
                                    // Règle X12 : icône sombre, l'accent jaune reste sur la bordure/ring (non textuel)
                                    formData.iconName === name
                                        ? "bg-primary-container/45 border-primary text-on-primary-container shadow-elevation-1 ring-1 ring-primary/20"
                                        : "bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface hover:border-outline-variant hover:text-on-surface"
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

