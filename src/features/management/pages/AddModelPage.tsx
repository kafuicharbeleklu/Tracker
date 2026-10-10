import React, { useEffect, useMemo, useState } from 'react';
import { COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import { cn } from '../../../lib/utils';
import { Info, LockSimple } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import SelectField from '../../../components/ui/SelectField';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { formatFileSize } from '../../../lib/fileImport';
import { estUneImageImportee, poidsDeLImage, reduireLImage } from '../../../lib/imageDeModele';
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

    /** L'image choisie est en cours de réduction. */
    const [reduction, setReduction] = useState(false);
    /** Le fichier choisi n'est pas une image lisible : dit sous la zone, là où il a été posé. */
    const [refusDImage, setRefusDImage] = useState<string | null>(null);

    const importerLImage = async (fichier: File) => {
        setRefusDImage(null);
        setReduction(true);
        try {
            const image = await reduireLImage(fichier);
            setFormData((actuel) => ({ ...actuel, image }));
        } catch {
            setRefusDImage(`« ${fichier.name} » n'est pas une image lisible.`);
        } finally {
            setReduction(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setRefusDImage(null);
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

                <FormSection title="Image" caption="facultatif">
                    {/* **Une image s'importe** (10/10). Le champ ne prenait qu'une adresse :
                        on ne pouvait pas joindre la photo qu'on venait de prendre. Elle est
                        réduite dans le navigateur et rangée dans la fiche du modèle
                        (`lib/imageDeModele`) — tous les postes la voient. L'adresse reste
                        possible, pour une image déjà en ligne. */}
                    {formData.image ? (
                        <div className="flex items-center gap-3">
                            <img
                                src={formData.image}
                                alt=""
                                className="bg-surface-container h-20 w-20 shrink-0 rounded-md object-contain"
                            />
                            <div className="min-w-0 flex-1">
                                <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                    {estUneImageImportee(formData.image)
                                        ? 'Image importée'
                                        : 'Image en ligne'}
                                </span>
                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                    {estUneImageImportee(formData.image)
                                        ? formatFileSize(poidsDeLImage(formData.image))
                                        : formData.image}
                                </span>
                            </div>
                            <Button
                                variant="text"
                                onClick={() => setFormData({ ...formData, image: '' })}
                                className="shrink-0"
                            >
                                Retirer
                            </Button>
                        </div>
                    ) : (
                        <>
                            <FileDropzone
                                accept=".jpg,.jpeg,.png,.webp"
                                label="Glisser-déposer une image"
                                subLabel="ou cliquez pour parcourir"
                                pickLabel="Choisir une image"
                                isProcessing={reduction}
                                onFileSelect={(fichier) => void importerLImage(fichier)}
                            />
                            {refusDImage && <FormWarn glyph={Info}>{refusDImage}</FormWarn>}
                            <InputField
                                label="Ou l'adresse d'une image en ligne"
                                name="image"
                                type="url"
                                value={formData.image}
                                onChange={(e) =>
                                    setFormData({ ...formData, image: e.target.value })
                                }
                                placeholder="https://…"
                            />
                        </>
                    )}
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
