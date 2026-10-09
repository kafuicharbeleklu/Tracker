import React, { useEffect, useMemo, useState } from 'react';
import { COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import { cn } from '../../../lib/utils';
import { Info, LockSimple } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import InputField from '../../../components/ui/InputField';
import { TextArea } from '../../../components/ui/TextArea';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { FieldLabel, FormNote, FormSection, FormWarn } from '../../../components/ui/FormParts';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';
import { Model } from '../../../types';

interface AddModelPageProps {
    isOpen: boolean;
    onClose: () => void;
    modelToEdit?: Model | null;
    /** Le modèle vient d'être créé : l'appelant ouvre sa fiche (09/10). */
    onCreated?: (id: string) => void;
    /**
     * Le type déjà posé à l'ouverture. Sert au geste « Ajouter le premier modèle » de
     * la fiche d'un type sans modèle (09.1, colonne 3) : le geste qui lève la situation
     * doit atterrir **sur ce type**, pas sur un sélecteur vide.
     */
    initialType?: string;
}

/**
 * **09.2, « État — créer un modèle » : un écran plein, pas une fenêtre.** La planche
 * dessine la coque de 04.3 — barre de 56 avec la flèche de retour, le titre, et le
 * verbe seul à droite — puis trois sections : l'identité, les spécifications dites
 * facultatives, l'image. La saisie tenait dans un `Modal` : un cadre de 560 posé sur
 * la page, un pied à deux boutons, et au téléphone une boîte qui remplissait l'écran
 * sans en avoir la barre. Relevé de structure du 13/09, seul restant au 19/09.
 */
const AddModelPage: React.FC<AddModelPageProps> = ({
    isOpen,
    onClose,
    modelToEdit,
    initialType,
    onCreated,
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
            const id = addModel(payload);
            showToast('Modèle créé avec succès', 'success');
            onClose();
            if (id) onCreated?.(id);
            return;
        }
        onClose();
    };

    if (!isOpen) return null;

    /* **Le type est verrouillé quand on vient d'une fiche de type** (09.2) : la rangée
       le montre — vignette, libellé, famille — et porte le cadenas au lieu d'un verbe.
       Un sélecteur qui n'a qu'une réponse possible n'est pas un choix. */
    const lockedCategory = !modelToEdit && initialType ? initialType : null;
    const lockedInfo = lockedCategory
        ? categories.find((category) => category.name === lockedCategory)
        : undefined;

    return (
        <FullScreenFormLayout
            title={modelToEdit ? 'Modifier le modèle' : 'Nouveau modèle'}
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={modelToEdit ? 'Enregistrer' : 'Créer'}
            submitButtonLocation="header"
            mesure="double"
            className="bg-background"
        >
            <div className={cn('flex flex-col gap-4', COLONNES_FORMULAIRE)}>
                <FormSection title="Identité">
                    <InputField
                        label="Nom du modèle"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Latitude 7420"
                        required
                    />

                    {lockedCategory ? (
                        <div>
                            <FieldLabel>Type</FieldLabel>
                            {/* `.pick` de 09.2 — 56 de haut, sur le creux, rayon 4. */}
                            <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                                <span className="bg-surface text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={getCategoryGlyph(lockedCategory)} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="text-ts-body leading-ts-body block truncate font-medium">
                                        {getCategoryLabel(lockedCategory)}
                                    </span>
                                    {lockedInfo && (
                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                            {lockedInfo.assignable
                                                ? 'attribuable'
                                                : 'non attribuable'}
                                        </span>
                                    )}
                                </span>
                                <Icon
                                    glyph={LockSimple}
                                    size={20}
                                    className="text-text-tertiary shrink-0"
                                />
                            </div>
                        </div>
                    ) : (
                        /* B1 — *« La donnée garde sa clé anglaise, le français est un libellé.
                           Aucun écran ne traduit ; celui-ci montre la clé […] c'est le seul
                           écran qui en a besoin »* : le seul, c'est le référentiel. Ce
                           sélecteur proposait « Laptop », « Furniture », « Server » — la clé
                           technique en guise de choix. La valeur reste la clé, l'étiquette
                           passe au libellé. */
                        <SelectField
                            label="Type"
                            name="category"
                            options={typeOptions}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        />
                    )}

                    <InputField
                        label="Marque"
                        name="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Dell"
                    />
                </FormSection>

                <FormSection title="Spécifications" caption="facultatif">
                    <TextArea
                        aria-label="Spécifications"
                        name="specs"
                        value={formData.specs}
                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                        placeholder="Ce que le support demandera en premier : processeur, mémoire, stockage."
                        rows={3}
                    />
                </FormSection>

                <FormSection title="Image">
                    {/* La zone « Télécharger l'image » n'avait ni `input`, ni `onClick`, ni
                        gestionnaire : elle prenait le curseur en main, l'état de survol, et ne
                        faisait rien — d'où la photo posée d'office à l'enregistrement. Le
                        modèle porte une **adresse** d'image dans la donnée : le champ la
                        demande, ce qui marche aujourd'hui sans réserve de fichiers. Un vrai
                        dépôt suppose un magasin comme celui des factures de dépense
                        (`financeFileStorage`) ; il n'est pas simulé en attendant. */}
                    <InputField
                        label="Adresse de l'image"
                        name="image"
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://…"
                    />
                    <FormNote>Sans image, la rangée porte l&apos;initiale de la marque.</FormNote>
                </FormSection>

                <FormWarn glyph={Info}>
                    Un modèle ne compte pas, il décrit : aucun objet n&apos;entre au parc en le
                    créant.
                </FormWarn>
            </div>
        </FullScreenFormLayout>
    );
};

export default AddModelPage;
