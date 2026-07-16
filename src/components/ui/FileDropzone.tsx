import React, { useState, useRef } from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  subLabel?: string;
  isProcessing?: boolean;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept = ".csv,.xlsx,.pdf,.jpg,.png",
  label = "Glisser-déposer votre fichier",
  subLabel = "ou cliquez pour parcourir",
  isProcessing = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
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

    if (multiple) {
      if (onFilesSelect) {
        onFilesSelect(normalizedFiles);
      } else {
        onFileSelect(normalizedFiles[0]);
      }
      return;
    }

    onFileSelect(normalizedFiles[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
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
    dispatchFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatchFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-md p-8 medium:p-12 flex flex-col items-center justify-center text-center transition-all duration-short4 ease-emphasized cursor-pointer group relative overflow-hidden",
        isDragging ? "border-primary bg-primary-container/20 scale-[1.01]" : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
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
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-medium2">
          <div className="w-14 h-14 rounded-lg border border-outline-variant bg-surface flex items-center justify-center relative mb-4">
            <MaterialIcon name="progress_activity" size={28} className="text-primary animate-spin" />
          </div>
          <p className="text-title-small text-on-surface">Traitement en cours...</p>
        </div>
      ) : (
        <>
          <div className={cn(
            "w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all duration-medium2 ease-emphasized border border-outline-variant",
            isDragging ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant group-hover:text-on-surface group-hover:bg-surface-container-low shadow-elevation-1"
          )}>
            <MaterialIcon name="cloud_upload" size={32} />
          </div>
          <p className="text-title-small text-on-surface mb-1">
            {label}
          </p>
          <p className="text-body-small text-on-surface-variant">
            {subLabel}
          </p>
        </>
      )}
    </div>
  );
};
