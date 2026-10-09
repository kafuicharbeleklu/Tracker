import React, { useMemo, useState } from 'react';

import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
    type TableauImporte,
} from '../../../components/layout/ReferentialImportTemplate';
import SelectField from '../../../components/ui/SelectField';
import { trouverModele } from '../../../lib/correspondanceModele';
import { normaliserNom, plusProche } from '../../../lib/tableur';
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
        alias: ['Nom', 'Modèle', 'Model Commercial', 'Désignation'],
    },
    {
        key: 'Category',
        description: 'Un type du catalogue — sinon la ligne est refusée',
        requirement: 'requis',
        required: true,
        alias: ['Catégorie', 'Type'],
    },
    {
        key: 'Brand',
        description: 'La marque',
        requirement: 'facultatif',
        alias: ['Marque', 'Fabricant', 'Constructeur'],
    },
];

/** Ce qu'un nom de feuille dit du type de ses lignes, au-delà du libellé du catalogue. */
const FEUILLES: Record<string, string> = {
    ordinateur: 'Laptop',
    portable: 'Laptop',
    ecran: 'Monitor',
    moniteur: 'Monitor',
    phone: 'Phone',
    telephone: 'Phone',
    mobile: 'Phone',
    tablette: 'Tablet',
    videoprojecteur: 'Projector',
    projecteur: 'Projector',
    stationaccueil: 'DockingStation',
    dock: 'DockingStation',
    switch: 'Switch',
    serveur: 'Server',
    accesspoint: 'AccessPoint',
    borne: 'AccessPoint',
    parefeu: 'Firewall',
    firewall: 'Firewall',
    imprimante: 'Printer',
    nas: 'NetworkDevice',
    interco: 'NetworkDevice',
    routeur: 'NetworkDevice',
};

/** Le type que le nom d'une feuille désigne — « Imprimantes » → Printer —, s'il est au catalogue. */
const typeDeFeuille = (feuille: string, categories: readonly { name: string }[]) => {
    const cle = normaliserNom(feuille).replace(/(s|x)$/, '');
    const parLibelle = categories.find(
        (c) =>
            normaliserNom(c.name) === cle ||
            normaliserNom(getCategoryLabel(c.name)).replace(/(s|x)$/, '') === cle,
    );
    if (parLibelle) return parLibelle.name;
    const type = FEUILLES[cle];
    return type && categories.some((c) => c.name === type) ? type : undefined;
};

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

    /**
     * **Le type des lignes qui n'en portent pas** (09/10) — la feuille « Imprimantes » de
     * l'inventaire n'a pas de colonne de catégorie : son nom la dit. Le type deviné de la
     * feuille est proposé ; on peut en choisir un autre.
     */
    const [typeChoisi, setTypeChoisi] = useState<{ feuille: string; type: string } | null>(null);
    const typeDeLaFeuille = (feuille: string) =>
        typeChoisi?.feuille === feuille
            ? typeChoisi.type
            : (typeDeFeuille(feuille, categories) ?? '');

    const parse = (tableau: TableauImporte): ImportCandidate<ModelDraft>[] => {
        /* Le référentiel grandit au fil du fichier : un inventaire porte le même modèle sur
           dix lignes, et il n'entre qu'une fois. */
        const auCatalogue = new Set(models.map((model) => normaliserNom(model.name)));
        const lus = new Set<string>();
        const typeParDefaut = typeDeLaFeuille(tableau.feuille);

        return tableau.lignes.map((ligne) => {
            const name = ligne.get('Name');
            const rawType = ligne.get('Category');
            const brand = ligne.get('Brand');
            const cle = normaliserNom(name);
            const resolvedType = rawType ? typeByKey.get(rawType.toLowerCase()) : typeParDefaut;

            /* Au catalogue sous un autre nom — « T14 Gen 4 » est « ThinkPad T14 Gen 4 » :
               ne pas le créer une seconde fois. */
            const sousUnAutreNom = !auCatalogue.has(cle)
                ? trouverModele(models, name, brand).modele
                : undefined;

            let error: string | undefined;
            let ecartee: string | undefined;
            if (!name) error = 'Nom absent';
            else if (auCatalogue.has(cle)) ecartee = 'Déjà au catalogue';
            else if (sousUnAutreNom) ecartee = `Déjà au catalogue sous « ${sousUnAutreNom.name} »`;
            else if (lus.has(cle)) ecartee = 'Répète un modèle lu plus haut';
            else if (!rawType && !typeParDefaut)
                error = 'Type absent — la colonne Category est vide';
            else if (!resolvedType) {
                const proche = plusProche(rawType, [...typeByKey.keys()]);
                error = `Type « ${rawType} » inconnu au catalogue${proche ? ` — « ${getCategoryLabel(typeByKey.get(proche) as string)} » ?` : ''}`;
            }

            if (!error && !ecartee) lus.add(cle);

            return {
                line: ligne.line,
                label: brand ? `${name} · ${brand}` : name || '(sans nom)',
                error,
                ecartee,
                value: error || ecartee ? undefined : { name, type: resolvedType as string, brand },
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
            contractNote={
                <>
                    Les deux premières sont requises ;{' '}
                    <b className="text-on-surface font-medium">Category</b> doit être un type du
                    catalogue.
                </>
            }
            parse={parse}
            onImport={handleImport}
            reglages={(tableau) =>
                /* Seulement si des lignes n'ont pas de catégorie. */
                tableau.lignes.some((ligne) => ligne.get('Name') && !ligne.get('Category')) ? (
                    <SelectField
                        label="Type des lignes sans catégorie"
                        name="typeParDefaut"
                        value={typeDeLaFeuille(tableau.feuille)}
                        onChange={(e) =>
                            setTypeChoisi({ feuille: tableau.feuille, type: e.target.value })
                        }
                        options={[
                            { value: '', label: 'Aucun — elles sont refusées' },
                            ...categories.map((c) => ({
                                value: c.name,
                                label: getCategoryLabel(c.name),
                            })),
                        ]}
                        supportingText={
                            typeDeFeuille(tableau.feuille, categories)
                                ? `Deviné du nom de la feuille, « ${tableau.feuille} ».`
                                : 'Une colonne Category renseignée l’emporte, ligne par ligne.'
                        }
                    />
                ) : null
            }
        />
    );
};

export default ImportModelsPage;
