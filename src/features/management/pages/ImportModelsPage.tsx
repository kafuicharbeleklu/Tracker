import React, { useMemo } from 'react';

import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
} from '../../../components/layout/ReferentialImportTemplate';
import { getCategoryLabel } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface ImportModelsPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface ModelDraft {
    name: string;
    type: string;
    brand: string;
}

/** Le contrat de 09.2, colonne 3 — trois colonnes, deux requises. */
const COLUMNS: ImportColumn[] = [
    {
        key: 'Name',
        description: "Le nom du modèle, tel qu'il s'affichera",
        requirement: 'requis',
        required: true,
    },
    {
        key: 'Category',
        description: 'Un type du catalogue — sinon la ligne est refusée',
        requirement: 'requis',
        required: true,
    },
    { key: 'Brand', description: 'La marque', requirement: 'facultatif' },
];

const SAMPLE = {
    fileName: 'modeles-exemple.csv',
    content: [
        'Name,Category,Brand',
        'Latitude 7420,Laptop,Dell',
        'U2722,Monitor,Dell',
        'MX Keys,Keyboard,Logitech',
    ].join('\n'),
};

/**
 * **Importer des modèles** — planche 09.2, colonne 3.
 *
 * L'écran ne tient plus que ce qui lui est propre : son contrat de colonnes, la
 * lecture d'une ligne, et l'écriture. Le reste — le contrat montré avant le dépôt,
 * les deux totaux, les lignes refusées nommées, le pied qui n'oblige pas à choisir
 * entre tout et rien — vient de `ReferentialImportTemplate`, qu'il partage avec
 * l'import d'emplacements : *« c'est un seul composant, pas deux écrans qui se
 * ressemblent »*.
 */
const ImportModelsPage: React.FC<ImportModelsPageProps> = ({ onCancel, onSave }) => {
    const { categories, models, addModel } = useData();
    const { showToast } = useToast();

    /**
     * Un type se désigne par sa **clé** — c'est ce que lisent les imports (B1). Son
     * libellé français est accepté aussi : un fichier monté à la main depuis l'écran
     * du catalogue portera « Ordinateur portable », et le refuser serait pinailler.
     */
    const typeByKey = useMemo(() => {
        const table = new Map<string, string>();
        categories.forEach((category) => {
            table.set(category.name.toLowerCase(), category.name);
            table.set(getCategoryLabel(category.name).toLowerCase(), category.name);
        });
        return table;
    }, [categories]);

    const parse = (text: string): ImportCandidate<ModelDraft>[] => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) return [];

        const separator = lines[0].includes(';') ? ';' : ',';
        /* Le référentiel grandit au fil du fichier : deux lignes qui portent le même
           nom ne peuvent pas entrer toutes les deux, et la seconde doit le savoir
           avant l'écriture plutôt que d'être perdue en silence. */
        const knownNames = new Set(models.map((model) => model.name.toLowerCase()));

        return lines.slice(1).map((line, index) => {
            const values = line
                .split(separator)
                .map((value) => value.replace(/^["']|["']$/g, '').trim());
            const [name = '', rawType = '', brand = ''] = values;
            const resolvedType = typeByKey.get(rawType.toLowerCase());

            let error: string | undefined;
            if (!name) error = 'Nom absent';
            else if (!rawType) error = 'Type absent — la colonne Category est vide';
            else if (!resolvedType) error = `Type « ${rawType} » inconnu au catalogue`;
            else if (knownNames.has(name.toLowerCase()))
                error = `« ${name} » existe déjà au catalogue`;

            if (!error) knownNames.add(name.toLowerCase());

            return {
                line: index + 2,
                label: name || '(sans nom)',
                error,
                value: error ? undefined : { name, type: resolvedType as string, brand },
            };
        });
    };

    const handleImport = (drafts: ModelDraft[]) => {
        drafts.forEach((draft) => {
            /* `count: 0` — **un modèle ne compte pas, il décrit** (09.2). L'import
               précédent l'omettait : la fiche affichait « undefined actifs » jusqu'à
               ce qu'une unité soit saisie. Et pas d'image : sans elle, la rangée porte
               l'initiale de la marque. */
            addModel({
                name: draft.name,
                type: draft.type,
                brand: draft.brand,
                specs: '',
                image: '',
                count: 0,
            });
        });
        showToast(
            `${drafts.length} modèle${drafts.length > 1 ? 's' : ''} ajouté${drafts.length > 1 ? 's' : ''} au catalogue.`,
            'success',
        );
        onSave();
    };

    return (
        <ReferentialImportTemplate<ModelDraft>
            title="Importer des modèles"
            onCancel={onCancel}
            columns={COLUMNS}
            sample={SAMPLE}
            noun={{ one: 'modèle', many: 'modèles' }}
            parse={parse}
            onImport={handleImport}
        />
    );
};

export default ImportModelsPage;
