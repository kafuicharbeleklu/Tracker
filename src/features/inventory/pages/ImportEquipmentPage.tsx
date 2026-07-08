import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { buildCsvLine, parseCsvLine } from '../../../lib/csv';

interface ImportEquipmentPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface ParsedEquipmentRow {
    _id: number;
    _status: 'valid' | 'error';
    _error: string;
    name?: string;
    assetId?: string;
    type?: string;
    model?: string;
    status?: string;
    [key: string]: string | number | undefined;
}

const ImportEquipmentPage: React.FC<ImportEquipmentPageProps> = ({ onCancel, onSave }) => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedEquipmentRow[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const validateAndSetFile = (uploadedFile: File) => {
        if (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv')) {
            setFile(uploadedFile);
            parseFile(uploadedFile);
        } else {
            showToast('Veuillez télécharger un fichier CSV valide.', 'error');
        }
    };

    const parseFile = (fileToParse: File) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                showToast("Le fichier semble vide ou ne contient pas d'en-têtes.", "error");
                setIsProcessing(false);
                return;
            }

            const headers = parseCsvLine(lines[0], ',');

            const data = lines.slice(1).map((line, index) => {
                const values = parseCsvLine(line, ',');
                const row: ParsedEquipmentRow = {
                    _id: index,
                    _status: 'valid',
                    _error: ''
                };

                headers.forEach((header, i) => {
                    const key = header.toLowerCase();
                    if (key.includes('nom') || key.includes('name')) row.name = values[i];
                    else if (key.includes('asset') || key.includes('tag')) row.assetId = values[i];
                    else if (key.includes('type') || key.includes('cat')) row.type = values[i];
                    else if (key.includes('model')) row.model = values[i];
                    else if (key.includes('status') || key.includes('statut')) row.status = values[i];
                    else row[key] = values[i];
                });

                if (!row.name || !row.assetId || !row.type) {
                    row._status = 'error';
                    row._error = 'Champs obligatoires manquants';
                }

                return row;
            });

            setParsedData(data);
            setPreviewMode(true);
            setIsProcessing(false);
        };
        reader.readAsText(fileToParse);
    };

    const stats = useMemo(() => {
        return {
            total: parsedData.length,
            valid: parsedData.filter(d => d._status === 'valid').length,
            invalid: parsedData.filter(d => d._status === 'error').length
        };
    }, [parsedData]);

    const handleDownloadTemplate = () => {
        // Delimiter ',' to stay re-importable by parseFile, which splits on commas.
        const csvContent = [
            buildCsvLine(['Name', 'AssetID', 'Type', 'Model'], ','),
            buildCsvLine(['Ordinateur portable Dell', 'NEEMBA-0001', 'Laptop', 'Latitude 5540'], ','),
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = 'modele-import-equipements.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        if (!file || stats.valid === 0) return;
        setTimeout(() => {
            showToast(`${stats.valid} équipements importés avec succès.`, 'success');
            onSave();
        }, 1000);
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setPreviewMode(false);
    };

    return (
        <FullScreenFormLayout
            title="Importer des équipements"
            onCancel={onCancel}
            onSave={handleImport}
            saveLabel={isProcessing ? "Analyse..." : `Importer ${stats.valid > 0 ? `(${stats.valid})` : ''}`}
            isSaving={!previewMode || stats.valid === 0}
        >
            {!previewMode ? (
                <div className="bg-surface rounded-md p-8 shadow-elevation-1 border border-outline-variant animate-in fade-in zoom-in-95 duration-300">
                    <h3 className="text-label-large text-on-surface mb-4">Étape 1: Télécharger le fichier CSV</h3>
                    <p className="text-body-medium text-on-surface-variant mb-6">
                        Le fichier doit contenir les colonnes : <span className="font-mono text-on-surface bg-surface-container px-1 rounded-xs">Name</span>, <span className="font-mono text-on-surface bg-surface-container px-1 rounded-xs">AssetID</span>, <span className="font-mono text-on-surface bg-surface-container px-1 rounded-xs">Type</span>, <span className="font-mono text-on-surface bg-surface-container px-1 rounded-xs">Model</span>.
                    </p>

                    <div className="mb-8">
                        <Button variant="outlined" onClick={handleDownloadTemplate} icon={<MaterialIcon name="download" size={18} />}>
                            Télécharger le modèle
                        </Button>
                    </div>

                    <FileDropzone
                        onFileSelect={validateAndSetFile}
                        accept=".csv"
                        isProcessing={isProcessing}
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="bg-surface-container-lowest p-4 rounded-md border border-outline-variant shadow-elevation-1 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary-container rounded-sm flex items-center justify-center text-secondary">
                                <MaterialIcon name="description" size={20} />
                            </div>
                            <div>
                                <p className="text-label-large text-on-surface">{file?.name}</p>
                                <div className="flex items-center gap-3 text-label-small mt-0.5">
                                    <span className="text-on-surface-variant">{stats.total} lignes détectées</span>
                                    <span className="text-tertiary flex items-center gap-1"><MaterialIcon name="check_circle" size={12} /> {stats.valid} valides</span>
                                    {stats.invalid > 0 && <span className="text-error flex items-center gap-1"><MaterialIcon name="warning" size={12} /> {stats.invalid} erreurs</span>}
                                </div>
                            </div>
                        </div>
                        <Button variant="outlined" size="sm" onClick={reset} className="text-error hover:bg-error-container hover:text-on-error-container">
                            Changer de fichier
                        </Button>
                    </div>

                    <div className="bg-surface rounded-md shadow-elevation-1 border border-outline-variant overflow-hidden">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-body-small text-left">
                                <thead className="bg-surface-container text-on-surface-variant text-label-small uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3">Statut</th>
                                        <th className="px-4 py-3">Nom</th>
                                        <th className="px-4 py-3">Asset ID</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Modèle</th>
                                        <th className="px-4 py-3">Message</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {parsedData.map((row) => (
                                        <tr key={row._id} className={cn("hover:bg-surface-container-low transition-colors duration-short4", row._status === 'error' && "bg-error-container/30")}>
                                            <td className="px-4 py-3">
                                                {row._status === 'valid' ? (
                                                    <Badge variant="success" className="shadow-none">Prêt</Badge>
                                                ) : (
                                                    <Badge variant="danger" className="shadow-none">Erreur</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-label-large text-on-surface">{row.name || '-'}</td>
                                            <td className="px-4 py-3 font-mono text-on-surface-variant">{row.assetId || '-'}</td>
                                            <td className="px-4 py-3 text-on-surface">{row.type || '-'}</td>
                                            <td className="px-4 py-3 text-on-surface-variant">{row.model || '-'}</td>
                                            <td className="px-4 py-3 text-label-small text-error">
                                                {row._error && <span className="flex items-center gap-1"><MaterialIcon name="error" size={12} /> {row._error}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </FullScreenFormLayout>
    );
};

export default ImportEquipmentPage;
