import React, { useMemo, useState } from 'react';
import { CaretRight, FileCsv, X } from '@phosphor-icons/react';

import Button from '../ui/Button';
import { FileDropzone } from '../ui/FileDropzone';
import Icon from '../ui/Icon';
import { FullScreenFormLayout } from './FullScreenFormLayout';

/** Une colonne du contrat — `.crow` de la planche 09.2. */
export interface ImportColumn {
    /** Le nom écrit dans le fichier, tel quel. */
    key: string;
    /** Ce que la colonne porte, en une ligne. */
    description: React.ReactNode;
    /** Le mot du contrat : « requis », « facultatif », « selon le type ». */
    requirement: string;
    /** Un mot exigeant se lit en encre pleine, un mot facultatif en encre pâle. */
    required?: boolean;
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
    dropSubLabel = 'Séparateur virgule ou point-virgule, encodage UTF-8',
}: ReferentialImportTemplateProps<T>) {
    const [file, setFile] = useState<File | null>(null);
    const [candidates, setCandidates] = useState<ImportCandidate<T>[]>([]);
    const [previewMode, setPreviewMode] = useState(false);

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
                    <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                            <h3 className="text-on-surface text-[13px] font-medium">
                                Ce que le fichier doit contenir
                            </h3>
                            <span className="text-text-secondary text-[13px]">.csv</span>
                        </div>
                        <div className="divide-outline-variant flex flex-col divide-y">
                            {columns.map((column) => (
                                <div
                                    key={column.key}
                                    className="flex min-h-[38px] items-baseline gap-2.5 py-1.5 text-[13px]"
                                >
                                    <code className="bg-surface-container text-on-surface shrink-0 rounded-xs px-1.5 py-0.5 font-mono text-[12px] tracking-[0.01em]">
                                        {column.key}
                                    </code>
                                    <span className="text-text-secondary min-w-0 flex-1 leading-[18px]">
                                        {column.description}
                                    </span>
                                    <span
                                        className={
                                            column.required
                                                ? 'text-on-surface shrink-0 text-[11px] font-medium'
                                                : 'text-text-muted shrink-0 text-[11px]'
                                        }
                                    >
                                        {column.requirement}
                                    </span>
                                </div>
                            ))}
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
                    <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                        <div className="flex min-h-14 items-center gap-3">
                            <span className="rounded-vignette bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center">
                                <Icon glyph={FileCsv} size={20} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <b className="text-on-surface block truncate text-[14px] font-medium">
                                    {file?.name}
                                </b>
                                <span className="text-text-secondary block text-[12px] tabular-nums">
                                    {candidates.length} ligne{candidates.length > 1 ? 's' : ''} lue
                                    {candidates.length > 1 ? 's' : ''}
                                </span>
                            </span>
                            <Button
                                variant="text"
                                iconOnly
                                aria-label="Retirer le fichier"
                                onClick={reset}
                                className="shrink-0"
                            >
                                <Icon glyph={X} size={20} />
                            </Button>
                        </div>

                        <div className="mt-3 flex gap-2.5">
                            <div className="bg-surface-container min-w-0 flex-1 rounded-md px-3 py-[11px]">
                                <b className="font-brand text-on-surface block text-[24px] font-semibold tracking-[-0.01em] tabular-nums">
                                    {acceptedCount}
                                </b>
                                <span className="text-text-secondary mt-px block text-[12px] leading-[17px]">
                                    {noun.many} prêt{acceptedCount > 1 ? 's' : ''} à entrer
                                </span>
                            </div>
                            {rejected.length > 0 && (
                                <div className="bg-surface-container min-w-0 flex-1 rounded-md px-3 py-[11px]">
                                    <b className="font-brand text-error block text-[24px] font-semibold tracking-[-0.01em] tabular-nums">
                                        {rejected.length}
                                    </b>
                                    <span className="text-text-secondary mt-px block text-[12px] leading-[17px]">
                                        ligne{rejected.length > 1 ? 's' : ''} refusée
                                        {rejected.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* LES LIGNES REFUSÉES, NOMMÉES — `.erow`. Trois lignes nommées valent
                        mieux qu'un compte : c'est dans le tableur qu'on les corrigera. */}
                    {rejected.length > 0 && (
                        <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                            <div className="mb-1 flex items-baseline justify-between gap-3">
                                <h3 className="text-on-surface text-[13px] font-medium">
                                    Les lignes refusées
                                </h3>
                                <span className="text-text-secondary text-[13px] tabular-nums">
                                    {rejected.length}
                                </span>
                            </div>
                            <div className="divide-outline-variant flex flex-col divide-y">
                                {rejected.map((row) => (
                                    <div
                                        key={row.line}
                                        className="flex items-start gap-2.5 py-2.5 text-[13px] leading-[19px]"
                                    >
                                        <span className="text-text-muted w-[34px] shrink-0 pt-px text-[12px] tabular-nums">
                                            l. {row.line}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <b className="text-on-surface block font-medium">
                                                {row.label}
                                            </b>
                                            <span className="text-error mt-px block text-[12px] leading-[17px]">
                                                {row.error}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {rejectionNote && (
                                <div className="bg-surface-container text-text-secondary mt-3 flex gap-2.5 rounded-md px-3 py-[11px] text-[12px] leading-[17px]">
                                    {rejectionNote}
                                </div>
                            )}
                        </section>
                    )}

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
