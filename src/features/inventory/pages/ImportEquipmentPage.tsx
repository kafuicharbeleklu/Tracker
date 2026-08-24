import React, { useMemo } from 'react';

import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
} from '../../../components/layout/ReferentialImportTemplate';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Equipment } from '../../../types';
import { nextInternalCode, proposeReadableId } from '../lib/assetCode';

interface ImportEquipmentPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface EquipmentDraft {
    model: string;
    type: string;
    serial: string;
    country: string;
    site: string;
    purchaseDate: string;
    purchasePrice: number;
}

/**
 * **Importer des équipements** — le gabarit d'import de la planche 09.2, appliqué au
 * parc.
 *
 * L'écran tenait sa propre version de l'import, et elle portait exactement les trois
 * défauts que 09.2 relève :
 *
 * - **le contrat n'était pas montré** — quatre noms de colonnes en petit texte sous
 *   « Étape 1 », sans dire lesquels sont requis ni ce qu'ils portent ;
 * - **les lignes refusées se comptaient au lieu de se nommer** : un tableau de
 *   *toutes* les lignes avec une pastille par rangée, dans lequel il fallait chercher
 *   les fautives — *« trois lignes nommées valent mieux qu'un compte : c'est dans le
 *   tableur qu'on les corrigera, et il faut savoir lesquelles »* ;
 * - **et surtout, il n'écrivait rien.** `handleImport` posait un `setTimeout`,
 *   affichait « N équipements importés avec succès » et refermait l'écran. Aucun actif
 *   n'entrait au parc. C'est le cas nommé par la planche : *« un seul des deux
 *   écrivait vraiment »*.
 *
 * ## Ce que l'écran garde en propre
 *
 * Son contrat, sa lecture, son écriture — rien d'autre. Le reste vient du gabarit,
 * qu'il partage désormais avec les imports de modèles et d'emplacements.
 *
 * **Le numéro de série est la clé.** C'est le seul champ que rien ne connaît (04.3) :
 * il est requis, et une série déjà au parc — ou répétée dans le fichier — est refusée
 * plutôt que dupliquée. Le **modèle** doit exister au catalogue, puisque c'est lui qui
 * porte le type, la marque et la durée d'amortissement. Les **deux codes** ne se
 * lisent pas dans le fichier : l'identifiant lisible et le code interne sont
 * **générés**, par les mêmes règles que la saisie d'une fiche.
 */

/** Le contrat, montré avant d'aller chercher un fichier — 09.2. */
const COLUMNS: ImportColumn[] = [
    {
        key: 'Model',
        description: 'Un modèle du catalogue — il porte le type et la marque',
        requirement: 'requis',
        required: true,
    },
    {
        key: 'Serial',
        description: "Le numéro de série lu sur l'étiquette, unique au parc",
        requirement: 'requis',
        required: true,
    },
    { key: 'Country', description: 'Le pays du référentiel', requirement: 'facultatif' },
    {
        key: 'Site',
        description: "L'emplacement — il compose le code lisible de l'actif",
        requirement: 'facultatif',
    },
    {
        key: 'PurchaseDate',
        description: "Date d'achat, au format AAAA-MM-JJ",
        requirement: 'facultatif',
    },
    { key: 'PurchasePrice', description: "Prix d'achat, en chiffres", requirement: 'facultatif' },
];

const SAMPLE = {
    fileName: 'equipements-exemple.csv',
    content: [
        'Model,Serial,Country,Site,PurchaseDate,PurchasePrice',
        'Dell Latitude 7420,5CG1234ABC,France,Paris HQ,2026-01-05,1250',
        'Dell U2721DE,CN0J8K2L,France,Paris HQ,2026-01-05,320',
        'Logitech MX Keys,2145LZ0A9,Togo,Lomé,2026-02-11,95',
    ].join('\n'),
};

const ImportEquipmentPage: React.FC<ImportEquipmentPageProps> = ({ onCancel, onSave }) => {
    const { equipment, models, addEquipment, categories, settings } = useData();
    const { showToast } = useToast();

    /** Un modèle se désigne par son nom ; la casse ne doit pas décider d'un refus. */
    const modelByName = useMemo(() => {
        const table = new Map<string, (typeof models)[number]>();
        models.forEach((model) => table.set(model.name.toLowerCase(), model));
        return table;
    }, [models]);

    const parse = (text: string): ImportCandidate<EquipmentDraft>[] => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) return [];

        const separator = lines[0].includes(';') ? ';' : ',';
        /* Le parc grandit au fil du fichier : deux lignes qui portent la même série ne
           peuvent pas entrer toutes les deux, et la seconde doit le savoir avant
           l'écriture plutôt que d'écraser la première. */
        const knownSerials = new Set(
            equipment
                .map((item) => (item.serialNumber || '').toLowerCase())
                .filter((serial) => serial),
        );

        return lines.slice(1).map((line, index) => {
            const values = line
                .split(separator)
                .map((value) => value.replace(/^["']|["']$/g, '').trim());
            const [
                rawModel = '',
                serial = '',
                country = '',
                site = '',
                purchaseDate = '',
                rawPrice = '',
            ] = values;
            const model = modelByName.get(rawModel.toLowerCase());

            let error: string | undefined;
            if (!rawModel) error = 'Modèle absent — la colonne Model est vide';
            else if (!model) error = `Modèle « ${rawModel} » inconnu au catalogue`;
            else if (!serial) error = 'Numéro de série absent';
            else if (knownSerials.has(serial.toLowerCase()))
                error = `Le numéro de série ${serial} est déjà au parc`;

            if (!error) knownSerials.add(serial.toLowerCase());

            return {
                line: index + 2,
                label: serial
                    ? `${rawModel || '(sans modèle)'} · ${serial}`
                    : rawModel || '(sans nom)',
                error,
                value: error
                    ? undefined
                    : {
                          model: model!.name,
                          type: model!.type,
                          serial,
                          country,
                          site,
                          purchaseDate,
                          purchasePrice: parseFloat(rawPrice.replace(',', '.')) || 0,
                      },
            };
        });
    };

    const handleImport = (drafts: EquipmentDraft[]) => {
        /* Les deux codes se calculent sur un parc qui **grandit à chaque ligne** : les
           lire sur le contexte ne rendrait le rang suivant qu'au prochain rendu, et les
           douze unités d'une livraison porteraient toutes le même code. */
        const parc: Equipment[] = [...equipment];

        drafts.forEach((draft, index) => {
            const category = categories.find((item) => item.name === draft.type);
            const created: Equipment = {
                id: `${Date.now()}_${index}`,
                name: proposeReadableId(draft.type, draft.site, parc) || draft.serial,
                assetId: nextInternalCode(parc),
                type: draft.type,
                model: draft.model,
                status: 'Disponible',
                assignmentStatus: 'NONE',
                serialNumber: draft.serial,
                country: draft.country,
                site: draft.site,
                image: models.find((item) => item.name === draft.model)?.image || '',
                financial: {
                    purchasePrice: draft.purchasePrice,
                    purchaseDate: draft.purchaseDate || new Date().toISOString().split('T')[0],
                    depreciationMethod:
                        category?.defaultDepreciation.method || settings.defaultDepreciationMethod,
                    depreciationYears:
                        category?.defaultDepreciation.years || settings.defaultDepreciationYears,
                },
            };

            parc.push(created);
            addEquipment(created);
        });

        showToast(
            `${drafts.length} équipement${drafts.length > 1 ? 's sont entrés' : ' est entré'} au parc.`,
            'success',
        );
        onSave();
    };

    return (
        <ReferentialImportTemplate<EquipmentDraft>
            title="Importer des équipements"
            onCancel={onCancel}
            columns={COLUMNS}
            sample={SAMPLE}
            noun={{ one: 'équipement', many: 'équipements' }}
            parse={parse}
            onImport={handleImport}
            dropSubLabel="Une ligne par unité — un modèle, un numéro de série"
            rejectionNote={
                /* Le gabarit pose la note en `flex` : elle doit lui arriver en **un**
                   enfant, sinon chaque fragment devient une colonne. */
                <span>
                    Un modèle absent du catalogue se crée d'abord au{' '}
                    <b className="font-medium">Référentiel</b>. L'identifiant lisible et le code
                    interne, eux, ne se lisent pas dans le fichier — ils sont générés à l'écriture,
                    par les règles de la saisie d'une fiche.
                </span>
            }
        />
    );
};

export default ImportEquipmentPage;
