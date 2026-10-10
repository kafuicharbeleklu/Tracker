import React, { useState, useEffect } from 'react';
import { COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import Toggle from '../../../components/ui/Toggle';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { FieldLabel, FormSection, GlyphTile, Segmented } from '../../../components/ui/FormParts';
import { CATEGORY_FAMILIES, Category, CategoryFamily } from '../../../types';
import { CATEGORY_GLYPHS, CATEGORY_ICONS } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';

interface AddCategoryPageProps {
    isOpen: boolean;
    onClose: () => void;
    categoryToEdit?: Category | null;
    /** Le type vient d'être créé : l'appelant ouvre sa fiche (09/10 — créer mène à l'objet). */
    onCreated?: (id: string) => void;
}

/**
 * **La fiche d'un type prend la coque de 09.2**, comme le modèle : barre de 56, le
 * verbe seul à droite, des sections sur la toile. 09.1 ne dessine pas la saisie d'un
 * type — elle dessine ce qu'il porte, et c'est de là que viennent les quatre sections :
 * l'identité (nom, famille), le pictogramme, ce que le type autorise, l'amortissement
 * par défaut — les trois lignes de sa carte « Référence ».
 *
 * L'écran tenait dans un `Modal` et empruntait la palette MD3 : cartes cernées à
 * l'ombre, titres capitales en 700, pastilles jaunes, tuiles à anneau qui grossissent
 * au survol. Les planches ne cernent pas une carte, n'écrivent pas de capitales et ne
 * posent le jaune que sur un acte.
 */
const AddCategoryPage: React.FC<AddCategoryPageProps> = ({
    isOpen,
    onClose,
    categoryToEdit,
    onCreated,
}) => {
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
            const id = addCategory(payload);
            showToast('Catégorie créée avec succès', 'success');
            onClose();
            if (id) onCreated?.(id);
            return;
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <FullScreenFormLayout
            title={categoryToEdit ? 'Modifier le type' : 'Nouveau type'}
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={categoryToEdit ? 'Enregistrer' : 'Créer'}
            submitButtonLocation="header"
            mesure="double"
            className="bg-background"
        >
            <div className={cn('flex flex-col gap-4', COLONNES_FORMULAIRE)}>
                <FormSection title="Identité">
                    <InputField
                        label="Nom du type"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Écran incurvé"
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

                    <TextArea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ce que ce type couvre, si son nom ne suffit pas."
                        rows={3}
                    />
                </FormSection>

                {/* Le pictogramme — le jeu figé de `categoryIcons`, pas un dessin libre.
                    Le cran pris passe en encre inversée, comme la tuile `.tile` de 06.4 ;
                    il portait un anneau jaune et grossissait au survol. */}
                <FormSection title="Pictogramme">
                    <div
                        role="radiogroup"
                        aria-label="Pictogramme du type"
                        className="medium:grid-cols-8 grid grid-cols-6 gap-2"
                    >
                        {Object.entries(CATEGORY_GLYPHS).map(([name, glyph]) => (
                            <GlyphTile
                                key={name}
                                glyph={glyph}
                                label={getCategoryLabel(name)}
                                selected={formData.iconName === name}
                                onClick={() => setFormData({ ...formData, iconName: name })}
                            />
                        ))}
                    </div>
                </FormSection>

                {/* Ce que le type autorise — arbitrage du 2026-08-05, REGLES-TRANSVERSES.md §5.7 */}
                <FormSection title="Ce que le type autorise">
                    <Toggle
                        checked={formData.assignable}
                        onChange={(assignable) => setFormData({ ...formData, assignable })}
                        label="Attribuable à une personne"
                    />
                </FormSection>

                <FormSection title="Amortissement" caption="par défaut">
                    <div>
                        <FieldLabel>Méthode</FieldLabel>
                        {/* `.seg` — deux crans, le pris en surface : la méthode n'en a que
                            deux, et deux cartes à cocher de 120 de haut pour un choix
                            binaire tiennent la place d'une section entière. */}
                        <Segmented
                            label="Méthode d'amortissement"
                            value={formData.method}
                            onChange={(method) => setFormData({ ...formData, method })}
                            options={[
                                { value: 'linear' as const, label: 'Linéaire' },
                                { value: 'degressive' as const, label: 'Dégressif' },
                            ]}
                        />
                    </div>

                    <div className="expanded:grid-cols-2 grid grid-cols-1 gap-4">
                        <InputField
                            mesure="courte"
                            label="Durée d'usage"
                            name="years"
                            type="number"
                            value={formData.years.toString()}
                            onChange={(e) =>
                                setFormData({ ...formData, years: parseInt(e.target.value) || 0 })
                            }
                            supportingText="en années"
                        />
                        <InputField
                            mesure="courte"
                            label="Valeur résiduelle"
                            name="salvage"
                            type="number"
                            value={formData.salvageValuePercent.toString()}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    salvageValuePercent: parseInt(e.target.value) || 0,
                                })
                            }
                            supportingText="en pour-cent"
                        />
                    </div>
                </FormSection>
            </div>
        </FullScreenFormLayout>
    );
};

export default AddCategoryPage;
