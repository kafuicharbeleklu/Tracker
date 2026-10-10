import React, { useMemo, useState } from 'react';

import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
    type TableauImporte,
} from '../../../components/layout/ReferentialImportTemplate';
import SelectField from '../../../components/ui/SelectField';
import { trouverModele } from '../../../lib/correspondanceModele';
import { lireDate, lireMontant, normaliserNom, plusProche } from '../../../lib/tableur';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Equipment } from '../../../types';
import { imageARecopier } from '../../../lib/imageDeModele';
import { deducedAssetName, nextInternalCode, proposeReadableId } from '../lib/assetCode';

interface ImportEquipmentPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface EquipmentDraft {
    department: string;
    model: string;
    type: string;
    serial: string;
    country: string;
    site: string;
    ram: string;
    storage: string;
    os: string;
    supplier: string;
    purchaseDate: string;
    purchasePrice: number;
    warrantyEnd: string;
    notes: string;
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
 *
 * ## Ce que la passe du 03/09 change au contrat
 *
 * *« Les quatre premières sont requises. »* Le pays et l'emplacement passent de
 * facultatifs à **requis**, et ce n'est pas un durcissement de goût : l'identifiant se
 * déduit désormais du **code du pays** et du numéro de série, et une ligne sans pays
 * ne peut plus produire d'identifiant. La règle de composition entraîne le contrat.
 *
 * Huit colonnes facultatives s'ajoutent — la configuration, l'achat, la garantie, la
 * réserve — parce que la fiche les affiche : *« la fiche de saisie porte exactement ce
 * que la fiche de détail affiche »*, et l'import écrit la même fiche.
 *
 * **Le dessin de l'écran reste celui de 09.2**, le gabarit d'import partagé par les
 * trois écrans qui importent. 04.3 colonne 2 dessine deux cartes à tuile teintée, une
 * barre de progression et un pied jaune pleine largeur ; les reprendre ici seul
 * ferait diverger les trois imports. À arbitrer en portant 09.2.
 */

/**
 * Le contrat, montré avant d'aller chercher un fichier — 09.2. **Chaque colonne porte ses
 * autres noms** (09/10) : les inventaires de Neemba disent « Numéro de Série », « Model
 * Commercial », « Fabricant », « Service », « Date fin de garantie ».
 */
const COLUMNS: ImportColumn[] = [
    {
        key: 'Model',
        description: 'Un modèle du catalogue — il porte le type et la marque',
        requirement: 'requis',
        required: true,
        alias: ['Modèle', 'Model Commercial', 'Modèle commercial', 'Référence', 'Désignation'],
    },
    {
        key: 'Serial',
        description: "Le numéro de série lu sur l'étiquette, unique au parc",
        requirement: 'requis',
        required: true,
        alias: ['Numéro de série', 'N° de série', 'N° série', 'No série', 'SN', 'Serial Number'],
    },
    {
        key: 'Country',
        description: "Le pays du référentiel — son code ouvre l'identifiant",
        requirement: 'requis',
        required: true,
        alias: ['Pays'],
        remplacee: 'déduit du site choisi plus bas',
    },
    {
        key: 'Site',
        description: "L'emplacement de la ligne — la fiche y naît",
        requirement: 'requis',
        required: true,
        alias: ['Emplacement', 'Localisation', 'Agence'],
        remplacee: 'le site choisi plus bas',
    },
    {
        key: 'Brand',
        description: 'La marque — elle départage deux modèles au même nom',
        requirement: 'facultatif',
        alias: ['Marque', 'Fabricant', 'Constructeur', 'Manufacturer'],
    },
    {
        key: 'Department',
        description: 'Le service qui l’emploie',
        requirement: 'facultatif',
        alias: ['Service', 'Département', 'Direction'],
    },
    {
        key: 'Memory',
        description: 'Mémoire — « 16 Go »',
        requirement: 'facultatif',
        alias: ['Mémoire', 'RAM'],
    },
    {
        key: 'Storage',
        description: 'Stockage — « 512 Go SSD »',
        requirement: 'facultatif',
        alias: ['Stockage', 'Disque', 'Capacité'],
    },
    {
        key: 'OS',
        description: 'Système — « Windows 11 Pro »',
        requirement: 'facultatif',
        alias: ['Système', "Système d'exploitation", 'Version Windows'],
    },
    {
        key: 'Supplier',
        description: 'Fournisseur',
        requirement: 'facultatif',
        alias: ['Fournisseur', 'Vendeur'],
    },
    {
        key: 'PurchaseDate',
        description: "Date d'achat — « 2026-01-05 » ou « 05/01/2026 »",
        requirement: 'facultatif',
        alias: ['Date achat', "Date d'achat", 'Acheté le', "Date d'acquisition"],
    },
    {
        key: 'PurchasePrice',
        description: "Prix d'achat — « 1 250 000 »",
        requirement: 'facultatif',
        alias: ["Prix d'achat", 'Prix', 'Montant', 'Coût', 'Valeur'],
    },
    {
        key: 'WarrantyEnd',
        description: 'Fin de garantie — « 2028-01-05 » ou « 05/01/2028 »',
        requirement: 'facultatif',
        alias: ['Date fin de garantie', 'Date de fin de garantie', 'Fin de garantie'],
    },
    {
        key: 'Reserve',
        description: 'Réserve — un défaut connu, une pièce manquante',
        requirement: 'facultatif',
        alias: ['Réserve', 'Commentaire', 'Commentaires', 'Observation', 'Remarque', 'Notes'],
    },
];

const SAMPLE = {
    fileName: 'equipements-exemple.csv',
    content: [
        'Model,Serial,Country,Site,Memory,Storage,OS,Supplier,PurchaseDate,PurchasePrice,WarrantyEnd,Reserve',
        'Dell Latitude 7420,PF5XK2M,Togo,Lomé Siège,16 Go,512 Go SSD,Windows 11 Pro,Dell Technologies,2026-01-05,1250,2028-01-05,',
        'Dell U2721DE,CN0J8K2L,Togo,Lomé Siège,,,,Dell Technologies,2026-01-05,320,2028-01-05,',
        'Logitech MX Keys,2145LZ0A9,Togo,Lomé Siège,,,,,2026-02-11,95,,Touche F5 dure',
    ].join('\n'),
};

const ImportEquipmentPage: React.FC<ImportEquipmentPageProps> = ({ onCancel, onSave }) => {
    const { equipment, models, addEquipment, categories, settings, locationData } = useData();
    const { showToast } = useToast();

    /**
     * **Le site des lignes qui n'en portent pas** (09/10) — les inventaires de Neemba ne
     * disent ni le pays ni le site : une feuille par site, le site dans le nom du fichier.
     * On le choisit une fois, après avoir vu ce qui entre ; une colonne Site l'emporte.
     */
    const [siteParDefaut, setSiteParDefaut] = useState('');

    /** Les sites du référentiel, avec leur pays : « Lomé Siège » → Togo. */
    const sites = useMemo(
        () =>
            Object.entries(locationData.sites).flatMap(([pays, noms]) =>
                (noms as string[]).map((nom) => ({ pays, nom, cle: normaliserNom(nom) })),
            ),
        [locationData.sites],
    );

    const parse = (tableau: TableauImporte): ImportCandidate<EquipmentDraft>[] => {
        /* Le parc grandit au fil du fichier : deux lignes qui portent la même série ne
           peuvent pas entrer toutes les deux, et la seconde doit le savoir avant
           l'écriture plutôt que d'écraser la première. */
        const auParc = new Set(
            equipment
                .map((item) => normaliserNom(item.serialNumber || ''))
                .filter((serial) => serial),
        );
        const lus = new Set<string>();
        const defaut = sites.find((site) => site.cle === normaliserNom(siteParDefaut));

        return tableau.lignes.map((ligne) => {
            const rawModel = ligne.get('Model');
            const marque = ligne.get('Brand');
            const serial = ligne.get('Serial');
            const remarques: string[] = [];
            const { modele, ambigus } = trouverModele(models, rawModel, marque);

            /* Le site : celui de la ligne, sinon celui choisi pour le fichier. */
            const siteLu = ligne.get('Site');
            const paysLu = ligne.get('Country');
            const site = siteLu
                ? sites.find(
                      (s) =>
                          s.cle === normaliserNom(siteLu) &&
                          (!paysLu || normaliserNom(s.pays) === normaliserNom(paysLu)),
                  )
                : defaut;

            let error: string | undefined;
            /* **Un catalogue vide ne juge rien** (09/10). Quand la base ne répond pas, la
               lecture rend un catalogue vide et chaque ligne était refusée « modèle
               inconnu » — neuf causes pour une seule : le catalogue n'est pas là. */
            if (models.length === 0)
                error =
                    'Catalogue vide ou non chargé — vérifiez la connexion, ou créez d’abord les modèles';
            else if (!rawModel) error = 'Modèle absent — la colonne Model est vide';
            else if (ambigus.length > 1)
                error = `Modèle « ${rawModel} » ambigu : ${ambigus.slice(0, 3).join(', ')}${ambigus.length > 3 ? '…' : ''}`;
            else if (!modele) {
                const proche = plusProche(
                    rawModel,
                    models.map((m) => m.name),
                );
                error = `Modèle « ${rawModel} » inconnu au catalogue${proche ? ` — « ${proche} » ?` : ''}`;
            } else if (!serial) error = 'Numéro de série absent';
            else if (/^\d+([.,]\d+)?E\+?\d+$/i.test(serial))
                /* « 3.195E+12 » : Excel a pris le numéro pour un nombre et l'a tronqué. */
                error = `Numéro de série ${serial} abîmé par Excel — mettez la colonne au format Texte`;
            else if (lus.has(normaliserNom(serial)))
                error = 'Numéro de série en double dans le fichier';
            else if (siteLu && !site) {
                const proche = plusProche(
                    siteLu,
                    sites.map((s) => s.nom),
                );
                error = `Site « ${siteLu} » absent des emplacements${proche ? ` — « ${proche} » ?` : ''}`;
            } else if (!site)
                error = siteParDefaut
                    ? `Site « ${siteParDefaut} » absent des emplacements`
                    : 'Site absent — choisissez le site des lignes qui n’en portent pas';

            if (!error && modele && normaliserNom(modele.name) !== normaliserNom(rawModel))
                remarques.push(`Modèle « ${rawModel} » lu comme « ${modele.name} »`);

            /* Les dates et le prix, comme on les écrit : illisibles, ils restent vides. */
            const achatLu = ligne.get('PurchaseDate');
            const purchaseDate = lireDate(achatLu);
            if (achatLu && !purchaseDate) remarques.push("Date d'achat illisible, laissée vide");
            const garantieLue = ligne.get('WarrantyEnd');
            const warrantyEnd = lireDate(garantieLue);
            if (garantieLue && !warrantyEnd)
                remarques.push('Fin de garantie illisible, laissée vide');
            const prixLu = ligne.get('PurchasePrice');
            const prix = lireMontant(prixLu);
            if (prixLu && Number.isNaN(prix)) remarques.push('Prix illisible, compté à 0');

            /* Déjà au parc : rien à corriger, la fiche existe — réimporter l'inventaire ne
               fait pas cent refus. Et cela passe avant tout défaut de la ligne : qu'elle
               n'ait pas de site ne se corrige pas, puisqu'elle n'entrera pas. */
            const ecartee =
                serial && auParc.has(normaliserNom(serial)) ? 'Déjà au parc' : undefined;
            if (ecartee) error = undefined;
            if (serial) lus.add(normaliserNom(serial));

            return {
                line: ligne.line,
                label: serial
                    ? `${rawModel || '(sans modèle)'} · ${serial}`
                    : rawModel || '(sans nom)',
                error,
                ecartee,
                remarque: error || ecartee ? undefined : remarques[0],
                value:
                    error || ecartee || !modele || !site
                        ? undefined
                        : {
                              model: modele.name,
                              type: modele.type,
                              serial,
                              country: site.pays,
                              site: site.nom,
                              department: ligne.get('Department'),
                              ram: ligne.get('Memory'),
                              storage: ligne.get('Storage'),
                              os: ligne.get('OS'),
                              supplier: ligne.get('Supplier'),
                              purchaseDate,
                              purchasePrice: Number.isNaN(prix) ? 0 : prix,
                              warrantyEnd,
                              notes: ligne.get('Reserve'),
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
            /* **L'identifiant est déduit ligne par ligne** (04.3) : code du pays,
               puis numéro de série. Un pays sans code garde l'ancienne composition,
               comme à la saisie d'une fiche — même règle, même repli, un seul
               endroit où elle est écrite. */
            const created: Equipment = {
                id: `${Date.now()}_${index}`,
                name:
                    deducedAssetName(draft.country, draft.serial, parc) ||
                    proposeReadableId(draft.type, draft.site, parc) ||
                    draft.serial,
                assetId: nextInternalCode(parc),
                type: draft.type,
                model: draft.model,
                status: 'Disponible',
                assignmentStatus: 'NONE',
                serialNumber: draft.serial,
                country: draft.country,
                site: draft.site,
                department: draft.department || undefined,
                ram: draft.ram || undefined,
                storage: draft.storage || undefined,
                os: draft.os || undefined,
                warrantyEnd: draft.warrantyEnd || undefined,
                notes: draft.notes || undefined,
                image: imageARecopier(models.find((item) => item.name === draft.model)?.image),
                financial: {
                    purchasePrice: draft.purchasePrice,
                    purchaseDate: draft.purchaseDate || new Date().toISOString().split('T')[0],
                    supplier: draft.supplier || undefined,
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
            dropSubLabel="CSV ou Excel · une ligne par objet, l'identifiant déduit"
            reglages={(tableau) =>
                /* Le site des lignes qui n'en portent pas — seulement si le fichier en laisse. */
                tableau.lignes.some((ligne) => !ligne.get('Site')) ? (
                    <SelectField
                        label="Site des lignes qui n’en portent pas"
                        name="siteParDefaut"
                        value={siteParDefaut}
                        onChange={(e) => setSiteParDefaut(e.target.value)}
                        options={[
                            { value: '', label: 'Choisir un site' },
                            ...sites.map((s) => ({ value: s.nom, label: `${s.nom} · ${s.pays}` })),
                        ]}
                        supportingText={
                            tableau.trouvees.Site
                                ? 'Une colonne Site renseignée l’emporte, ligne par ligne.'
                                : 'Le fichier ne dit pas le site : toutes ses lignes y entrent.'
                        }
                    />
                ) : null
            }
            rejectionNote={
                /* **Une note, un fait** : ce qui débloque le refus le plus fréquent. Elle
                   disait aussi d'où viennent l'identifiant et le statut — trois phrases, dont
                   deux sans rapport avec un refus. */
                <span>
                    Un modèle absent se crée au <b className="font-medium">Référentiel</b> :
                    importez-y ce même fichier.
                </span>
            }
        />
    );
};

export default ImportEquipmentPage;
