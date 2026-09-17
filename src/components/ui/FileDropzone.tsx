import React, { useState, useRef } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    Camera,
    CaretRight,
    FolderOpen,
    Images,
    UploadSimple,
    XCircle,
} from '@phosphor-icons/react';
import MaterialIcon from './MaterialIcon';
import Icon from './Icon';
import BottomSheet from './BottomSheet';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';
import {
    getImportLimitBytes,
    formatFileSize,
    partitionBySize,
    rejectionMessage,
} from '../../lib/fileImport';

interface FileDropzoneProps {
    onFileSelect: (file: File) => void;
    onFilesSelect?: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
    label?: string;
    subLabel?: string;
    /** Le verbe de la rangée au téléphone — « Choisir un fichier » par défaut. */
    pickLabel?: string;
    isProcessing?: boolean;
    /** La borne de 17.10 — 5 Mo par défaut, la valeur arbitrée le 06/09. */
    maxSize?: number;
    className?: string;
}

/** « .pdf,.jpg,.jpeg,.png » → « PDF, JPG ou PNG » — la contrainte se lit en mots (17.10). */
const formatsInWords = (accept: string): string => {
    const names = accept
        .split(',')
        .map((token) => token.trim().replace(/^\./, '').toUpperCase())
        .filter((token) => token && !token.includes('/'))
        .map((token) => (token === 'JPEG' ? 'JPG' : token === 'TIF' ? 'TIFF' : token));
    const unique = [...new Set(names)];
    if (unique.length === 0) return '';
    if (unique.length === 1) return unique[0];
    return `${unique.slice(0, -1).join(', ')} ou ${unique[unique.length - 1]}`;
};

/** `.arow` de la feuille de source — la vignette de 40, le chemin, et sa sous-ligne. */
const SourceRow: React.FC<{
    glyph: PhosphorGlyph;
    title: string;
    detail: string;
    onClick: () => void;
}> = ({ glyph, title, detail, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="border-outline-variant focus-visible:ring-focus-ring flex min-h-14 w-full cursor-pointer items-center gap-3 border-t py-2 text-left outline-none first:border-t-0 focus-visible:ring-2 focus-visible:ring-inset"
    >
        <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <Icon glyph={glyph} size={20} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="text-on-surface block text-[16px] leading-6">{title}</span>
            <span className="text-on-surface-variant block text-[14px] leading-5">{detail}</span>
        </span>
    </button>
);

/**
 * **La source d'un fichier — deux formes, et c'est la largeur qui choisit** (17.10).
 *
 * *« Jamais : un glisser-déposer sur mobile. »* Au téléphone, on ne dépose rien : la zone
 * en pointillé devient **une rangée de choix** — la vignette teintée, le verbe, et la
 * contrainte en sous-ligne (formats, poids). Quand une photo est un chemin possible, la
 * rangée ouvre **la feuille de source**, sans pied : Fichiers, Photothèque, Prendre en
 * photo. Quand le fichier ne peut être qu'un fichier — un CSV —, la feuille n'aurait
 * qu'une rangée : la rangée ouvre directement le sélecteur.
 *
 * *« Sur grand écran, une zone en pointillé tient lieu de feuille »* : au-delà de 600, la
 * zone reste. Relevé du 13/09 : quatre imports et la saisie d'une dépense posaient au
 * téléphone une zone de 188 à 256 px à glisser-déposer.
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFileSelect,
    onFilesSelect,
    multiple = false,
    accept = '.csv,.xlsx,.pdf,.jpg,.png',
    label = 'Glisser-déposer votre fichier',
    subLabel = 'ou cliquez pour parcourir',
    pickLabel,
    isProcessing = false,
    maxSize = getImportLimitBytes(),
    className,
}) => {
    const compact = useMediaQuery(MEDIA.compact);
    const [isDragging, setIsDragging] = useState(false);
    const [sourcesOpen, setSourcesOpen] = useState(false);
    /* Le refus se lit **là où le fichier a été déposé** : c'est un champ précis en
       cause, donc le message vit sous la zone et reste tant que rien n'a changé
       (17.5, troisième réponse). Il valait le silence : le fichier disparaissait. */
    const [refus, setRefus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const acceptsImages = /\.(jpe?g|png|webp|heic|bmp|tiff?)\b|image\//i.test(accept);
    const acceptsPdf = /\.pdf\b|application\/pdf/i.test(accept);
    const contrainte = [formatsInWords(accept), `${formatFileSize(maxSize)} au plus`]
        .filter(Boolean)
        .join(', ');
    const verbe = pickLabel ?? (multiple ? 'Choisir des fichiers' : 'Choisir un fichier');

    const getNormalizedFiles = (incomingFiles: File[]): File[] => {
        if (!incomingFiles.length) return [];

        const acceptTokens = accept
            .split(',')
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);

        if (!acceptTokens.length) return incomingFiles;

        return incomingFiles.filter((file) => {
            const fileName = file.name.toLowerCase();
            const fileType = (file.type || '').toLowerCase();

            return acceptTokens.some((token) => {
                if (token === '*/*') return true;
                if (token.endsWith('/*')) {
                    const typePrefix = token.slice(0, -1);
                    return fileType.startsWith(typePrefix);
                }
                if (token.startsWith('.')) {
                    return fileName.endsWith(token);
                }
                return fileType === token;
            });
        });
    };

    const dispatchFiles = (incomingFiles: File[]) => {
        const normalizedFiles = getNormalizedFiles(incomingFiles);
        if (!normalizedFiles.length) return;

        const { accepted, rejected } = partitionBySize(normalizedFiles, maxSize);
        setRefus(rejectionMessage(rejected, maxSize));
        if (!accepted.length) return;

        if (multiple) {
            if (onFilesSelect) {
                onFilesSelect(accepted);
            } else {
                onFileSelect(accepted[0]);
            }
            return;
        }

        onFileSelect(accepted[0]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (isProcessing) return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isProcessing) return;
        dispatchFiles(Array.from(e.dataTransfer.files || []));
    };

    const openInput = (input: React.RefObject<HTMLInputElement | null>) => {
        if (isProcessing) return;
        setSourcesOpen(false);
        input.current?.click();
    };

    const openFilePicker = () => openInput(fileInputRef);

    /**
     * La zone est un `div` cliquable dont l'input de fichier est `hidden` (donc non
     * focalisable) : sans ces attributs, elle était totalement inatteignable au
     * clavier et n'avait aucun état de focus (Tracker DS v1, tâche 1).
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openFilePicker();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatchFiles(Array.from(e.target.files || []));
        e.target.value = '';
    };

    const inputs = (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                disabled={isProcessing}
            />
            {compact && acceptsImages && (
                <>
                    <input
                        type="file"
                        ref={photoInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple={multiple}
                        onChange={handleFileChange}
                        disabled={isProcessing}
                    />
                    <input
                        type="file"
                        ref={cameraInputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                    />
                </>
            )}
        </>
    );

    /* Le refus, sous la source : 14 sur 20, glyphe de 18, encre danger — la forme du
       message au champ de 17.5. Il nomme le fichier et sa taille. */
    const refusMessage = refus && (
        <p className="text-error mt-2 flex items-start gap-1.5 text-[14px] leading-5" role="alert">
            <Icon glyph={XCircle} size={18} className="mt-px" />
            <span>{refus}</span>
        </p>
    );

    if (compact) {
        return (
            <>
                {inputs}
                {/* `.pick` de 17.10 — 56 au moins, `8 14`, sur le creux, rayon 4. */}
                <button
                    type="button"
                    onClick={acceptsImages ? () => setSourcesOpen(true) : openFilePicker}
                    disabled={isProcessing}
                    aria-busy={isProcessing || undefined}
                    aria-haspopup={acceptsImages ? 'dialog' : undefined}
                    className="bg-surface-container focus-visible:ring-focus-ring flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-3.5 py-2 text-left outline-none focus-visible:ring-2 disabled:cursor-progress"
                >
                    <span className="bg-tint-vert text-on-tint-vert flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                        <Icon glyph={UploadSimple} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="text-on-surface block text-[16px] leading-6">
                            {isProcessing ? 'Lecture en cours' : verbe}
                        </span>
                        <span className="text-on-surface-variant block text-[14px] leading-5">
                            {contrainte}
                        </span>
                    </span>
                    <Icon glyph={CaretRight} size={20} className="text-text-tertiary" />
                </button>
                {refusMessage}

                {acceptsImages && (
                    <BottomSheet
                        open={sourcesOpen}
                        onClose={() => setSourcesOpen(false)}
                        title={verbe}
                    >
                        {/* La contrainte se lit en sous-ligne du titre (`.sttl .sub`). */}
                        <p className="text-on-surface-variant -mt-3 mb-2 text-[14px] leading-5">
                            {contrainte}
                        </p>
                        <SourceRow
                            glyph={FolderOpen}
                            title="Fichiers"
                            detail={
                                acceptsPdf
                                    ? "un PDF ou une image de l'appareil"
                                    : "un fichier de l'appareil"
                            }
                            onClick={() => openInput(fileInputRef)}
                        />
                        <SourceRow
                            glyph={Images}
                            title="Photothèque"
                            detail="une photo déjà prise"
                            onClick={() => openInput(photoInputRef)}
                        />
                        <SourceRow
                            glyph={Camera}
                            title="Prendre en photo"
                            detail="le document à plat, bien éclairé"
                            onClick={() => openInput(cameraInputRef)}
                        />
                    </BottomSheet>
                )}
            </>
        );
    }

    return (
        <>
            {inputs}
            <div
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-busy={isProcessing || undefined}
                aria-disabled={isProcessing || undefined}
                className={cn(
                    'medium:p-12 duration-short4 ease-emphasized group relative flex flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed p-8 text-center transition-all',
                    'focus-visible:ring-focus-ring focus-visible:ring-offset-surface outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    isProcessing ? 'cursor-progress' : 'cursor-pointer',
                    isDragging
                        ? 'border-primary bg-primary-container/20 scale-[1.01]'
                        : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low',
                    className,
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onKeyDown={handleKeyDown}
                onClick={openFilePicker}
            >
                {isProcessing ? (
                    <div className="animate-in fade-in zoom-in duration-medium2 flex flex-col items-center">
                        <div className="border-outline-variant bg-surface relative mb-4 flex h-14 w-14 items-center justify-center rounded-lg border">
                            <MaterialIcon
                                name="progress_activity"
                                size={28}
                                className="text-primary animate-spin"
                            />
                        </div>
                        <p className="text-title-small text-on-surface">Traitement en cours...</p>
                    </div>
                ) : (
                    <>
                        {/* La vignette de la zone est posée à plat : rien ne flotte dans
                            une zone de dépôt (17.11). */}
                        <div
                            className={cn(
                                'duration-medium2 ease-emphasized border-outline-variant mb-4 flex h-14 w-14 items-center justify-center rounded-lg border transition-all',
                                isDragging
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-high text-on-surface-variant group-hover:text-on-surface group-hover:bg-surface-container-low',
                            )}
                        >
                            <MaterialIcon name="cloud_upload" size={32} />
                        </div>
                        <p className="text-title-small text-on-surface mb-1">{label}</p>
                        <p className="text-body-small text-on-surface-variant">{subLabel}</p>
                        <p className="text-on-surface-variant mt-2 text-[12px] leading-4">
                            {formatFileSize(maxSize)} par fichier au plus
                        </p>
                    </>
                )}
            </div>
            {refusMessage}
        </>
    );
};
