import React, { useMemo, useState } from 'react';
import { CaretRight, Check, FileCsv, ListChecks, X } from '@phosphor-icons/react';

import Button from '../ui/Button';
import { FileDropzone } from '../ui/FileDropzone';
import Icon from '../ui/Icon';
import { FullScreenFormLayout } from './FullScreenFormLayout';
import { cn } from '../../lib/utils';

/**
 * Une colonne du contrat — `.chp` de la planche 09.2. **Un jeton ne porte que le nom
 * de la colonne** : ce qu'elle exige se dit une fois, dans la phrase sous les jetons
 * (`contractNote`). Les descriptions par colonne faisaient trois rangées de texte
 * au-dessus d'une zone de dépôt qu'on ne voyait plus.
 */
export interface ImportColumn {
    /** Le nom écrit dans le fichier, tel quel. */
    key: string;
    /** Requise : le jeton prend la teinte bleue. */
    required?: boolean;
    /** Ce que la colonne porte — conservé pour le fichier d'exemple et la documentation. */
    description?: React.ReactNode;
    /** Le mot du contrat : « requis », « facultatif », « selon le type ». */
    requirement?: string;
}

/** Une ligne de données lue dans le fichier, retenue ou refusée. */
export interface ImportCandidate<T> {
    /** Le numéro de ligne **du tableur**, en-tête comprise : c'est là qu'on ira corriger. */
    line: number;
    /** Ce qui nomme la ligne — son nom, ou « (sans nom) ». */
    label: string;
    /** La cause du refus, en toutes lettres. Absente : la ligne entre. */
    error?: string;
    /** Ce qui sera écrit si la ligne entre. */
    value?: T;
}

interface ReferentialImportTemplateProps<T> {
    title: string;
    onCancel: () => void;
    /** Le contrat de colonnes, montré **avant** d'aller chercher un fichier. */
    columns: ImportColumn[];
    /** Le fichier d'exemple — il illustre le contrat qu'on vient de lire. */
    sample: { fileName: string; content: string };
    /** Le nom de ce qui entre, pour les décomptes et le pied. */
    noun: { one: string; many: string };
    /** Lit le texte du fichier et rend une candidate par ligne de données. */
    parse: (text: string) => ImportCandidate<T>[];
    /** Écrit les lignes retenues, dans l'ordre du fichier. */
    onImport: (values: T[]) => void;
    /** Une précision propre au référentiel, sous les lignes refusées. */
    rejectionNote?: React.ReactNode;
    /**
     * `.fnote` — la phrase qui dit **ce que le contrat exige au juste**, sous les jetons
     * de colonnes : « les deux premières sont requises ; Category doit être un type du
     * catalogue ». La planche la préfère à une description par colonne, qui faisait
     * trois rangées là où une phrase suffit.
     */
    contractNote?: React.ReactNode;
    /** Ce que la zone de dépôt annonce en second. */
    dropSubLabel?: string;
}

/**
 * **L'import d'un référentiel — un composant, pas deux écrans qui se ressemblent**
 * (planche 09.2, colonnes 3 et 4).
 *
 * *« Même écran, même pied, même contrat : c'est un seul composant. Une seule chose
 * change, et elle est propre à la géographie : une ligne peut être juste et refusée
 * quand même, parce que son parent n'existe pas encore. »*
 *
 * Les deux imports du référentiel — modèles, emplacements — posaient la même question
 * et avaient chacun leur réponse : deux analyses de CSV, deux jeux de messages, deux
 * mises en page, et un seul des deux écrivait vraiment. Ce gabarit tient tout ce qui
 * ne dépend pas du référentiel ; l'appelant ne fournit plus que **son contrat, sa
 * lecture et son écriture**.
 *
 * ## La règle qu'il applique
 *
 * **Un import ne se juge pas au fichier, il se juge à ce qui va entrer.**
 *
 * - **Le contrat avant le dépôt.** Chaque colonne, ce qu'elle porte, si elle est
 *   requise — c'est la seule information dont on a besoin *avant* d'aller chercher un
 *   fichier, et la seule qu'on n'a plus sous les yeux quand on est dans son tableur.
 *   Le produit l'annonçait en une ligne de petit texte sous « Étape 1 ».
 * - **Le décompte avant l'écriture** : deux totaux, ce qui entre et ce qui est refusé.
 * - **Les lignes refusées se nomment, elles ne se comptent pas.** *« Trois lignes
 *   nommées valent mieux qu'un compte : c'est dans le tableur qu'on les corrigera, et
 *   il faut savoir lesquelles. »* Le produit affichait un tableau de **toutes** les
 *   lignes avec une pastille par rangée — il fallait chercher les fautives dedans.
 * - **Un fichier à moitié bon ne force pas à choisir entre tout et rien** : le pied
 *   propose d'écrire les valides. Quand il n'y en a aucune, il ne propose plus
 *   d'écrire — il propose de corriger le fichier.
 */
function ReferentialImportTemplate<T>({
    title,
    onCancel,
    columns,
    sample,
    noun,
    parse,
    onImport,
    rejectionNote,
    contractNote,
    dropSubLabel = 'Séparateur virgule ou point-virgule, encodage UTF-8',
}: ReferentialImportTemplateProps<T>) {
    const [file, setFile] = useState<File | null>(null);
    const [candidates, setCandidates] = useState<ImportCandidate<T>[]>([]);
    const [previewMode, setPreviewMode] = useState(false);

    /**
     * **Ce que la liste montre** — la planche en dessine quatre lignes : une retenue,
     * puis les refusées. Tout lister ferait défiler cinq cents rangées pour trouver les
     * trois qui demandent un geste ; ne montrer que les refusées laisserait croire que
     * rien n'a été lu. La première retenue prouve la lecture, les refusées disent où
     * corriger.
     */
    const APERCU_REFUS_MAX = 12;

    const accepted = useMemo(() => candidates.filter((row) => !row.error), [candidates]);
    const rejected = useMemo(() => candidates.filter((row) => Boolean(row.error)), [candidates]);

    const processFile = (uploadedFile: File) => {
        setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            setCandidates(parse(text));
            setPreviewMode(true);
        };
        reader.readAsText(uploadedFile);
    };

    const reset = () => {
        setFile(null);
        setCandidates([]);
        setPreviewMode(false);
    };

    /** Le fichier d'exemple, fabriqué depuis le contrat qu'il illustre. */
    const downloadSample = () => {
        const blob = new Blob([sample.content], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = sample.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    };

    const acceptedCount = accepted.length;

    /** La première retenue, puis les refusées — dans l'ordre du fichier. */
    const apercu = useMemo(
        () =>
            [...(accepted.length > 0 ? [accepted[0]] : []), ...rejected.slice(0, APERCU_REFUS_MAX)]
                .slice()
                .sort((a, b) => a.line - b.line),
        [accepted, rejected],
    );
    const canWrite = previewMode && acceptedCount > 0;

    const saveLabel = !previewMode
        ? `Importer des ${noun.many}`
        : acceptedCount === 0
          ? 'Corriger le fichier'
          : acceptedCount === 1
            ? `Importer le ${noun.one}`
            : `Importer les ${acceptedCount}`;

    return (
        <FullScreenFormLayout
            title={title}
            onCancel={onCancel}
            onSave={() => {
                if (!previewMode) return;
                if (acceptedCount === 0) {
                    reset();
                    return;
                }
                onImport(accepted.map((row) => row.value as T));
            }}
            saveLabel={saveLabel}
            isSaving={!previewMode}
        >
            {!previewMode ? (
                <div className="flex flex-col gap-4">
                    {/* LE CONTRAT — `.cols` : chaque colonne, ce qu'elle porte, si elle
                        est requise. Avant le dépôt, pas après. */}
                    <section className="rounded-card bg-surface shadow-elevation-1 flex flex-col gap-4 p-5">
                        {/* `.sh` — un pictogramme de 32 teinté, puis le titre en 17 sur
                            24. Il valait 13 px : un titre de section se lisait comme une
                            étiquette de champ. */}
                        <div className="flex items-center gap-3">
                            <span className="bg-tint-vert text-on-tint-vert flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={FileCsv} size={18} />
                            </span>
                            <p className="text-on-surface flex-1 text-[17px] leading-6 font-medium">
                                Le fichier
                            </p>
                        </div>

                        {/* `.chips` — **les colonnes sont des jetons**, pas des rangées :
                            le contrat se lit d'un coup d'œil et les requises portent la
                            teinte bleue. Trois rangées de description disaient en trois
                            phrases ce qu'une phrase dit sous les jetons. */}
                        <div>
                            <p className="text-on-surface-variant mb-2 text-[12px] leading-4 font-medium">
                                Colonnes attendues
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {columns.map((column) => (
                                    <span
                                        key={column.key}
                                        className={cn(
                                            'inline-flex min-h-8 items-center rounded-[4px] px-3 font-mono text-[14px] leading-5',
                                            column.required
                                                ? 'bg-tint-bleu text-on-tint-bleu'
                                                : 'bg-surface-container text-on-surface',
                                        )}
                                    >
                                        {column.key}
                                    </span>
                                ))}
                            </div>
                            {contractNote && (
                                <p className="text-on-surface-variant mt-2 text-[14px] leading-5">
                                    {contractNote}
                                </p>
                            )}
                        </div>
                        {/* `.more` — la rangée « voir plus » du système : 48 px, filet en
                            tête, 14 px/500. C'est un geste, donc un `Button` du DS et non
                            un contrôle natif posé dans un gabarit. */}
                        <Button
                            variant="text"
                            onClick={downloadSample}
                            className="border-outline-variant text-on-surface hover:text-text-secondary mt-2 flex min-h-12 w-full items-center justify-start gap-2.5 rounded-none border-t px-1 pt-2 text-left text-[14px] font-medium transition-colors"
                        >
                            <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
                            Télécharger un fichier d'exemple
                        </Button>
                    </section>

                    <FileDropzone
                        onFileSelect={processFile}
                        accept=".csv"
                        label="Déposer le fichier"
                        subLabel={dropSubLabel}
                        className="p-6"
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* LE FICHIER LU, ET LES DEUX TOTAUX — `.fread` puis `.tals`.
                        Le décompte se lit **avant** d'écrire. */}
                    <section className="rounded-card bg-surface shadow-elevation-1 flex flex-col gap-4 p-5">
                        <div className="flex items-center gap-3">
                            <span className="bg-tint-vert text-on-tint-vert flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={FileCsv} size={18} />
                            </span>
                            <p className="text-on-surface flex-1 text-[17px] leading-6 font-medium">
                                Le fichier
                            </p>
                        </div>

                        {/* `.pick` — le fichier lu est un choix fait : vignette verte,
                            ce qu'il porte, et le verbe qui le reprend. Une croix disait
                            « retirer » là où la planche dit « changer ». */}
                        <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                            <span className="bg-tint-vert text-on-tint-vert flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={Check} size={20} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="text-on-surface block truncate text-[16px] leading-6 font-medium">
                                    {file?.name}
                                </span>
                                <span className="text-on-surface-variant block text-[14px] leading-5 tabular-nums">
                                    {candidates.length} ligne{candidates.length > 1 ? 's' : ''} ·{' '}
                                    {columns.length} colonnes
                                </span>
                            </span>
                            <Button
                                variant="text"
                                onClick={reset}
                                className="h-auto !min-h-0 shrink-0 !px-0 !py-0 text-[15px] font-medium"
                            >
                                Changer
                            </Button>
                        </div>
                    </section>

                    {/* `.cgroup` — **le décompte avant l'écriture** : le nombre en 28,
                        ce qu'il compte à côté, et la proportion en barre de 6. Deux
                        cases de 24 disaient deux nombres sans dire leur rapport. */}
                    <section className="rounded-card bg-surface shadow-elevation-1 flex flex-col gap-4 p-5">
                        <div className="flex items-center gap-3">
                            <span className="bg-tint-bleu text-on-tint-bleu flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={ListChecks} size={18} />
                            </span>
                            <p className="text-on-surface flex-1 text-[17px] leading-6 font-medium">
                                Ce qui sera créé
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="flex items-baseline gap-2">
                                <b className="font-brand text-on-surface text-[28px] leading-8 font-semibold tracking-[-0.01em] tabular-nums">
                                    {acceptedCount}
                                </b>
                                <span className="text-on-surface-variant text-[14px] leading-5">
                                    {acceptedCount > 1 ? noun.many : noun.one} sur{' '}
                                    {candidates.length} ligne{candidates.length > 1 ? 's' : ''}
                                </span>
                            </p>
                            <span className="bg-surface-container block h-1.5 overflow-hidden rounded-[2px]">
                                <i
                                    className="block h-1.5 rounded-[2px] bg-[var(--tk-color-st-vert)]"
                                    style={{
                                        width: `${candidates.length > 0 ? Math.round((acceptedCount / candidates.length) * 100) : 0}%`,
                                    }}
                                />
                            </span>
                        </div>

                        {/* `.urow` — une ligne par verdict : le numéro du tableur, ce qui
                            la nomme, sa cause, et le carré qui tranche. La première
                            retenue montre que la lecture a marché ; les refusées disent
                            où corriger. */}
                        <div className="flex flex-col">
                            {apercu.map((row) => (
                                <div
                                    key={row.line}
                                    className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-2 first:border-t-0"
                                >
                                    <span className="text-text-tertiary w-8 shrink-0 text-[12px] leading-4 tabular-nums">
                                        {String(row.line).padStart(2, '0')}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={cn(
                                                'block truncate text-[16px] leading-6',
                                                row.error
                                                    ? 'text-on-surface-variant'
                                                    : 'text-on-surface',
                                            )}
                                        >
                                            {row.label}
                                        </span>
                                        {row.error && (
                                            <span className="text-error block text-[14px] leading-5">
                                                {row.error}
                                            </span>
                                        )}
                                    </span>
                                    <span
                                        className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]',
                                            row.error
                                                ? 'bg-tint-danger text-on-tint-danger'
                                                : 'bg-tint-vert text-on-tint-vert',
                                        )}
                                    >
                                        <Icon glyph={row.error ? X : Check} size={18} />
                                    </span>
                                </div>
                            ))}
                        </div>

                        {rejectionNote && rejected.length > 0 && (
                            <div className="bg-tint-ambre text-on-tint-ambre flex gap-3 rounded-[4px] px-4 py-3 text-[14px] leading-5">
                                {rejectionNote}
                            </div>
                        )}
                    </section>

                    {!canWrite && (
                        <p className="text-text-secondary px-0.5 text-[12px] leading-[17px]">
                            Aucune ligne ne peut entrer. Corrigez le fichier dans votre tableur,
                            puis déposez-le à nouveau.
                        </p>
                    )}
                </div>
            )}
        </FullScreenFormLayout>
    );
}

export default ReferentialImportTemplate;
