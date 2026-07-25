import React, { useState, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { TableScrollArea } from '../../../components/ui/TableScrollArea';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';

interface ImportModelsPageProps {
    onCancel: () => void;
    onSave: () => void;
}

interface ParsedModelRow {
    _id: number;
    name?: string;
    category?: string;
    brand?: string;
    _status: 'valid' | 'error';
    _error: string;
    [key: string]: string | number | undefined;
}

const ImportModelsPage: React.FC<ImportModelsPageProps> = ({ onCancel, onSave }) => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedModelRow[]>([]);
    const [previewMode, setPreviewMode] = useState(false);

    const processFile = (uploadedFile: File) => {
        if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
            showToast('Fichier CSV requis', 'error');
            return;
        }
        setFile(uploadedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) return;

            const data = lines.slice(1).map((line, idx) => {
                const vals = line.split(',');
                const row: ParsedModelRow = {
                    _id: idx,
                    name: vals[0]?.trim(),
                    category: vals[1]?.trim(),
                    brand: vals[2]?.trim(),
                    _status: 'error',
                    _error: ''
                };

                row._status = (row.name && row.category) ? 'valid' : 'error';
                row._error = row._status === 'error' ? 'Nom et Catégorie requis' : '';
                return row;
            });
            setParsedData(data);
            setPreviewMode(true);
        };
        reader.readAsText(uploadedFile);
    };

    const stats = useMemo(() => ({
        valid: parsedData.filter(d => d._status === 'valid').length,
        invalid: parsedData.filter(d => d._status === 'error').length
    }), [parsedData]);

    const handleImport = () => {
        if (!file || stats.valid === 0) return;
        setTimeout(() => {
            showToast(`${stats.valid} modèles importés.`, 'success');
            onSave();
        }, 800);
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setPreviewMode(false);
    };

    return (
        <FullScreenFormLayout
            title="Importer des modèles"
            onCancel={onCancel}
            onSave={handleImport}
            saveLabel={`Importer ${stats.valid > 0 ? `(${stats.valid})` : ''}`}
            isSaving={!previewMode || stats.valid === 0}
        >
            {!previewMode ? (
                <div className="bg-surface rounded-card p-page shadow-elevation-1 border border-outline-variant animate-in fade-in zoom-in-95">
                    <h3 className="text-label-large font-bold text-on-surface mb-4">Étape 1: Télécharger le fichier CSV</h3>
                    <p className="text-body-medium text-on-surface-variant mb-6">Colonnes : Name, Category, Brand.</p>
                    <FileDropzone
                        onFileSelect={processFile}
                        accept=".csv"
                        label="Glisser un fichier CSV"
                        subLabel="ou cliquer pour importer"
                        className="rounded-card p-12"
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-8">
                    <div className="bg-surface p-4 rounded-xl border border-outline-variant flex justify-between items-center">
                        <div>
                            <p className="font-bold text-on-surface">{file?.name}</p>
                            <p className="text-body-small text-on-surface-variant">{stats.valid} valides, {stats.invalid} erreurs</p>
                        </div>
                        <Button variant="outlined" size="sm" onClick={reset} className="text-error">Annuler</Button>
                    </div>

                    <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                        <TableScrollArea
                            label="Aperçu des modèles à importer"
                            scrollerClassName="max-h-[400px]"
                        >
                            <table className="w-full text-body-medium text-left">
                                <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 sticky left-0 z-20 bg-surface-container border-r border-outline-variant">Statut</th>
                                        <th className="px-4 py-3">Modèle</th>
                                        <th className="px-4 py-3">Catégorie</th>
                                        <th className="px-4 py-3">Marque</th>
                                        <th className="px-4 py-3">Info</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((row) => (
                                        <tr key={row._id} className="group hover:bg-surface-container border-b border-outline-variant/30 last:border-0">
                                            <td className="px-4 py-3 sticky left-0 z-10 bg-surface group-hover:bg-surface-container border-r border-outline-variant transition-colors">
                                                {row._status === 'valid' ? <Badge variant="success">OK</Badge> : <Badge variant="danger">Erreur</Badge>}
                                            </td>
                                            <td className="px-4 py-3 font-bold">{row.name || '-'}</td>
                                            <td className="px-4 py-3">{row.category || '-'}</td>
                                            <td className="px-4 py-3 text-on-surface-variant">{row.brand || '-'}</td>
                                            <td className="px-4 py-3 text-label-medium text-error font-bold">{row._error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableScrollArea>
                    </div>
                </div>
            )}
        </FullScreenFormLayout>
    );
};

export default ImportModelsPage;

