import React, { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import { getCategoryLabel } from '../../../constants/glossary';
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

const AddModelPage: React.FC<AddModelPageProps> = ({
    isOpen,
    onClose,
    modelToEdit,
    initialType,
}) => {
    const { showToast } = useToast();
    const { addModel, updateModel, categories } = useData();

    const typeOptions = useMemo(
        () =>
            categories
                .map((category) => ({
                    value: category.name,
                    label: getCategoryLabel(category.name),
                }))
                .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
        [categories],
    );

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: '',
        specs: '',
        image: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (modelToEdit) {
                setFormData({
                    name: modelToEdit.name,
                    brand: modelToEdit.brand || '',
                    category: modelToEdit.type,
                    specs: modelToEdit.specs || '',
                    image: modelToEdit.image || '',
                });
            } else {
                setFormData({
                    name: '',
                    brand: '',
                    category: initialType || '',
                    specs: '',
                    image: '',
                });
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
            /* **Pas de photo de repli.** Le formulaire posait d'office une photo
               d'ordinateur Dell sur tout modèle créé — un modèle de mobilier ou une
               imprimante la portaient aussi. C'est le défaut que 09.2 relève sur les
               spécifications inventées, en plus visible : la photo est justement ce qui
               distingue un modèle de son voisin de même marque. Sans photo, la rangée
               porte **l'initiale de la marque** — jamais un cadre vide, jamais la photo
               d'un autre objet. */
            image: formData.image.trim(),
            count: modelToEdit ? modelToEdit.count : 0,
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
            <Button variant="outlined" onClick={onClose}>
                Annuler
            </Button>
            <Button
                variant="filled"
                icon={<MaterialIcon name="save" size={18} />}
                onClick={handleSave}
            >
                {modelToEdit ? 'Enregistrer les modifications' : 'Créer le modèle'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modelToEdit ? 'Modifier le modèle' : 'Nouveau modèle'}
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

                <div className="expanded:grid-cols-2 grid grid-cols-1 gap-5">
                    <InputField
                        label="Marque"
                        name="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Ex: Dell"
                    />
                    {/* B1 — *« La donnée garde sa clé anglaise, le français est un libellé.
                        Aucun écran ne traduit ; celui-ci montre la clé […] c'est le seul
                        écran qui en a besoin »* : le seul, c'est le référentiel. Ce
                        sélecteur proposait « Laptop », « Furniture », « Server » — la clé
                        technique en guise de choix. La valeur reste la clé, l'étiquette
                        passe au libellé. */}
                    <SelectField
                        label="Catégorie"
                        name="category"
                        options={typeOptions}
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

                {/* La zone « Télécharger l'image » n'avait ni `input`, ni `onClick`, ni
                    gestionnaire : elle prenait le curseur en main, l'état de survol, et ne
                    faisait rien — d'où la photo posée d'office à l'enregistrement. Le
                    modèle porte une **adresse** d'image dans la donnée : le champ la
                    demande, ce qui marche aujourd'hui sans réserve de fichiers. Un vrai
                    dépôt suppose un magasin comme celui des factures de dépense
                    (`financeFileStorage`) ; il n'est pas simulé en attendant. */}
                <InputField
                    label="Image du modèle"
                    name="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://…"
                    supportingText="Facultatif. Sans image, la rangée porte l'initiale de la marque — jamais un cadre vide."
                />
            </div>
        </Modal>
    );
};

export default AddModelPage;
