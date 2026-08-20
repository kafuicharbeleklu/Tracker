import React, { useState, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import { Model } from '../../../types';

interface AddModelPageProps {
    isOpen: boolean;
    onClose: () => void;
    modelToEdit?: Model | null;
    /**
     * Le type déjà posé à l'ouverture. Sert au geste « Ajouter le premier modèle » de
     * la fiche d'un type sans modèle (09.1, colonne 3) : le geste qui lève la situation
     * doit atterrir **sur ce type**, pas sur un sélecteur vide.
     */
    initialType?: string;
}

const AddModelPage: React.FC<AddModelPageProps> = ({ isOpen, onClose, modelToEdit, initialType }) => {
    const { showToast } = useToast();
    const { addModel, updateModel, categories } = useData();

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: '',
        specs: '',
        image: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (modelToEdit) {
                setFormData({
                    name: modelToEdit.name,
                    brand: modelToEdit.brand || '',
                    category: modelToEdit.type,
                    specs: modelToEdit.specs || '',
                    image: modelToEdit.image || ''
                });
            } else {
                setFormData({ name: '', brand: '', category: initialType || '', specs: '', image: '' });
            }
        }
    }, [isOpen, modelToEdit, initialType]);

    const handleSave = () => {
        if (!formData.name || !formData.category) {
            showToast('Veuillez remplir les champs obligatoires', 'error');
            return;
        }

        const payload = {
            name: formData.name,
            type: formData.category,
            brand: formData.brand,
            specs: formData.specs,
            image: formData.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop', // Fallback image
            count: modelToEdit ? modelToEdit.count : 0
        };

        if (modelToEdit) {
            updateModel(modelToEdit.id, payload);
            showToast(`Modèle "${formData.name}" mis à jour`, 'success');
        } else {
            addModel(payload);
            showToast('Modèle créé avec succès', 'success');
        }
        onClose();
    };

    const footer = (
        <>
            <Button variant="outlined" onClick={onClose}>Annuler</Button>
            <Button variant="filled" icon={<MaterialIcon name="save" size={18} />} onClick={handleSave}>
                {modelToEdit ? 'Enregistrer les modifications' : 'Créer le modèle'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modelToEdit ? "Modifier le modèle" : "Nouveau modèle"}
            footer={footer}
        >
            <div className="space-y-5">
                <InputField
                    label="Nom du modèle"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Latitude 7420"
                    required
                />

                <div className="grid grid-cols-1 expanded:grid-cols-2 gap-5">
                    <InputField
                        label="Marque"
                        name="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Ex: Dell"
                    />
                    <SelectField
                        label="Catégorie"
                        name="category"
                        options={categories.map(c => ({ value: c.name, label: c.name }))}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                    />
                </div>

                <TextArea
                    label="Spécifications"
                    name="specs"
                    value={formData.specs}
                    onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                    placeholder="Détails techniques (CPU, RAM, etc.)"
                    rows={3}
                />

                <div>
                    <label className="block text-label-medium font-bold text-on-surface-variant mb-3 ml-1">Image du modèle</label>
                    <div className="border-2 border-dashed border-outline-variant rounded-card p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low transition-all group">
                        <div className="w-12 h-12 bg-surface-container-low rounded-full flex items-center justify-center mb-3 text-on-surface-variant group-hover:text-primary transition-colors">
                            <MaterialIcon name="cloud_upload" size={24} />
                        </div>
                        {/* Règle X12 : libellé sombre, pas de jaune en texte sur fond clair */}
                        <p className="text-title-small font-medium text-on-surface">Télécharger l'image</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddModelPage;
