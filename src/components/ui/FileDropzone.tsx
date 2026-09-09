import React, { useState, useRef } from 'react';
import { XCircle } from '@phosphor-icons/react';
import MaterialIcon from './MaterialIcon';
import Icon from './Icon';
import { cn } from '../../lib/utils';
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
    isProcessing?: boolean;
    /** La borne de 17.10 — 5 Mo par défaut, la valeur arbitrée le 06/09. */
    maxSize?: number;
    className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFileSelect,
    onFilesSelect,
    multiple = false,
    accept = '.csv,.xlsx,.pdf,.jpg,.png',
    label = 'Glisser-déposer votre fichier',
    subLabel = 'ou cliquez pour parcourir',
    isProcessing = false,
    maxSize = getImportLimitBytes(),
    className,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    /* Le refus se lit **là où le fichier a été déposé** : c'est un champ précis en
       cause, donc le message vit sous la zone et reste tant que rien n'a changé
       (17.5, troisième réponse). Il valait le silence : le fichier disparaissait. */
    const [refus, setRefus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const openFilePicker = () => {
        if (isProcessing) return;
        fileInputRef.current?.click();
    };

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

    return (
        <>
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
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={isProcessing}
                />

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
                        <div
                            className={cn(
                                'duration-medium2 ease-emphasized border-outline-variant mb-4 flex h-14 w-14 items-center justify-center rounded-lg border transition-all',
                                isDragging
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-high text-on-surface-variant group-hover:text-on-surface group-hover:bg-surface-container-low shadow-elevation-1',
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

            {/* Le refus, sous la zone : 14 sur 20, glyphe de 18, encre danger — la forme
            du message au champ de 17.5. Il nomme le fichier et sa taille. */}
            {refus && (
                <p
                    className="text-error mt-2 flex items-start gap-1.5 text-[14px] leading-5"
                    role="alert"
                >
                    <Icon glyph={XCircle} size={18} className="mt-px" />
                    <span>{refus}</span>
                </p>
            )}
        </>
    );
};
