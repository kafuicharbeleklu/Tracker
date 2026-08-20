import React from 'react';
import { Warning } from '@phosphor-icons/react';

import ReferentialImportTemplate, {
    type ImportCandidate,
    type ImportColumn,
} from '../../../components/layout/ReferentialImportTemplate';
import Icon from '../../../components/ui/Icon';
import { GLOSSARY } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface ImportLocationsPageProps {
    onCancel: () => void;
    onSave: () => void;
}

/**
 * Les quatre valeurs admises. Le **local** s'ajoute aux trois de la planche : depuis
 * l'arbitrage A2 de 10.1, l'arbre des emplacements est pays → site → local, et un
 * import qui ne saurait pas écrire un local ne saurait pas remplir le référentiel.
 * Le **service** reste admis : il n'est plus un niveau de l'arbre, mais il sert de
 * périmètre à une campagne d'audit.
 */
type LocationKind = 'country' | 'site' | 'local' | 'service';
const LOCATION_KINDS: LocationKind[] = ['country', 'site', 'local', 'service'];

interface LocationDraft {
    kind: LocationKind;
    name: string;
    parent?: string;
}

/** Le contrat de 09.2, colonne 4 — mêmes trois colonnes, une exigence conditionnelle. */
const COLUMNS: ImportColumn[] = [
    {
        key: 'Name',
        description: 'Le nom du pays, du site ou du local',
        requirement: 'requis',
        required: true,
    },
    {
        key: 'Type',
        description: (
            <>
                <b className="text-on-surface font-medium">country</b>,{' '}
                <b className="text-on-surface font-medium">site</b>,{' '}
                <b className="text-on-surface font-medium">local</b> ou{' '}
                <b className="text-on-surface font-medium">service</b>
            </>
        ),
        requirement: 'requis',
        required: true,
    },
    {
        key: 'ParentName',
        description: 'Le nom exact du niveau au-dessus — vide pour un pays',
        requirement: 'selon le type',
    },
];

const SAMPLE = {
    fileName: 'emplacements-exemple.csv',
    content: [
        'Name,Type,ParentName',
        'Togo,country,',
        'Lomé Siège,site,Togo',
        'Salle serveurs,local,Lomé Siège',
    ].join('\n'),
};

/**
 * **Importer des emplacements** — planche 09.2, colonne 4.
 *
 * *« Même écran, même pied, même contrat : c'est un seul composant. »* Il partage donc
 * `ReferentialImportTemplate` avec l'import de modèles, et ne garde que ce qui lui est
 * propre — **la seule chose qui change, et elle est propre à la géographie** : une
 * ligne peut être juste et refusée quand même, parce que son parent n'existe pas
 * encore. C'est le seul cas où l'ordre des lignes du fichier compte.
 *
 * L'écran était resté le « avant » que la planche décrit : « Étape 1 : Télécharger le
 * fichier CSV », les colonnes en une ligne de petit texte, un tableau de toutes les
 * lignes avec une pastille par rangée — et un `handleImport` qui annonçait le succès
 * sans rien écrire.
 */
const ImportLocationsPage: React.FC<ImportLocationsPageProps> = ({ onCancel, onSave }) => {
    const { locationData, addLocation } = useData();
    const { showToast } = useToast();

    const parse = (text: string): ImportCandidate<LocationDraft>[] => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) return [];

        const separator = lines[0].includes(';') ? ';' : ',';
        /* Le référentiel grandit au fil du fichier : un pays créé à la ligne 3 rend
           valide le site de la ligne 4. C'est ce qui permet de dire « il suffit souvent
           de remonter la ligne du pays au-dessus de ses sites » plutôt que « Type
           invalide » pour trois causes différentes. */
        const knownCountries = new Set(
            locationData.countries.map((country) => country.toLowerCase()),
        );
        const knownSites = new Set(
            (Object.values(locationData.sites) as string[][])
                .flat()
                .map((site) => site.toLowerCase()),
        );

        return lines.slice(1).map((line, index) => {
            const values = line
                .split(separator)
                .map((value) => value.replace(/^["']|["']$/g, '').trim());
            const [name = '', rawKind = '', parent = ''] = values;
            const kind = rawKind.toLowerCase() as LocationKind;
            const nameKey = name.toLowerCase();
            const parentKey = parent.toLowerCase();

            let error: string | undefined;
            if (!name) {
                error = 'Nom absent';
            } else if (!LOCATION_KINDS.includes(kind)) {
                error = `Type « ${rawKind || '—'} » invalide — attendu : country, site, local ou service`;
            } else if (kind === 'country') {
                if (knownCountries.has(nameKey)) error = `« ${name} » existe déjà`;
            } else if (kind === 'site') {
                if (!parent) error = 'Parent absent — un site doit dire à quel pays il appartient';
                else if (!knownCountries.has(parentKey)) {
                    error = `Parent « ${parent} » introuvable — le pays doit être créé avant ses sites`;
                } else if (knownSites.has(nameKey)) error = `« ${name} » existe déjà`;
            } else if (!parent) {
                error = `Parent absent — un ${kind === 'local' ? 'local' : 'service'} doit dire à quel site il appartient`;
            } else if (!knownSites.has(parentKey)) {
                error = `Parent « ${parent} » introuvable — le site doit être créé avant ses ${kind === 'local' ? 'locaux' : 'services'}`;
            }

            if (!error) {
                if (kind === 'country') knownCountries.add(nameKey);
                if (kind === 'site') knownSites.add(nameKey);
            }

            return {
                line: index + 2,
                label: name || '(sans nom)',
                error,
                value: error ? undefined : { kind, name, parent: parent || undefined },
            };
        });
    };

    /** Écrites **dans l'ordre du fichier** : c'est l'ordre qui a rendu les enfants valides. */
    const handleImport = (drafts: LocationDraft[]) => {
        drafts.forEach((draft) => {
            addLocation(
                draft.kind,
                draft.name,
                draft.kind === 'country' ? undefined : draft.parent,
            );
        });
        showToast(
            `${drafts.length} emplacement${drafts.length > 1 ? 's' : ''} importé${drafts.length > 1 ? 's' : ''}.`,
            'success',
        );
        onSave();
    };

    return (
        <ReferentialImportTemplate<LocationDraft>
            title={`Importer des ${GLOSSARY.LOCATION_PLURAL.toLowerCase()}`}
            onCancel={onCancel}
            columns={COLUMNS}
            sample={SAMPLE}
            noun={{ one: 'emplacement', many: 'emplacements' }}
            parse={parse}
            onImport={handleImport}
            dropSubLabel="Un pays doit figurer avant ses sites, un site avant ses services"
            rejectionNote={
                <>
                    <Icon
                        glyph={Warning}
                        size={18}
                        className="mt-px shrink-0 text-[var(--tk-color-st-ambre)]"
                    />
                    <span>
                        <b className="text-on-surface font-medium">
                            Un parent manquant n'est pas une faute de saisie.
                        </b>{' '}
                        Il suffit souvent de remonter la ligne du pays au-dessus de ses sites.
                    </span>
                </>
            }
        />
    );
};

export default ImportLocationsPage;
