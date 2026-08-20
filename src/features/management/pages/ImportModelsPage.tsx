import React, { useState, useMemo } from 'react';
import { FileCsv } from '@phosphor-icons/react';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { useData } from '../../../context/DataContext';

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
}

const ImportModelsPage: React.FC<ImportModelsPageProps> = ({ onCancel, onSave }) => {
    const { categories, addModel } = useData();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedModelRow[]>([]);
    const [previewMode, setPreviewMode] = useState(false);

    const validCategoryKeys = useMemo(() => {
        const set = new Set<string>();
        categories.forEach((c) => {
            set.add(c.name.toLowerCase());
            if (c.name.toUpperCase() === 'ORDINATEUR PORTABLE') set.add('laptop');
            if (c.name.toUpperCase() === 'MONITEUR') set.add('monitor');
            if (c.name.toUpperCase() === 'SOURIS') set.add('mouse');
            if (c.name.toUpperCase() === 'CASQUE') set.add('headphones');
            if (c.name.toUpperCase() === 'CLAVIER') set.add('keyboard');
            if (c.name.toUpperCase() === 'IMPRIMANTE') set.add('printer');
            if (c.name.toUpperCase() === 'SERVEUR') set.add('server');
        });
        return set;
    }, [categories]);

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

            const lines = text.split(/\r?\n/).filter((l) => l.trim());
            if (lines.length < 2) {
                showToast('Le fichier doit contenir une ligne d’en-tête et au moins une ligne de données.', 'warning');
                return;
            }

            const separator = lines[0].includes(';') ? ';' : ',';
            const data = lines.slice(1).map((line, idx) => {
                const vals = line.split(separator).map((v) => v.replace(/^["']|["']$/g, '').trim());
                const name = vals[0] || '';
                const category = vals[1] || '';
                const brand = vals[2] || '';

                let error = '';
                if (!name) {
                    error = 'Nom de modèle manquant';
                } else if (!category) {
                    error = 'Catégorie de type manquante';
                } else if (!validCategoryKeys.has(category.toLowerCase())) {
                    error = `Catégorie « ${category} » non reconnue dans le catalogue`;
                }

                const row: ParsedModelRow = {
                    _id: idx + 2, // 1-indexed including header
                    name,
                    category,
                    brand,
                    _status: error ? 'error' : 'valid',
                    _error: error,
                };
                return row;
            });
            setParsedData(data);
            setPreviewMode(true);
        };
        reader.readAsText(uploadedFile);
    };

    const stats = useMemo(
        () => ({
            valid: parsedData.filter((d) => d._status === 'valid').length,
            invalid: parsedData.filter((d) => d._status === 'error').length,
        }),
        [parsedData]
    );

    const handleImport = () => {
        if (!file || stats.valid === 0) return;
        const validRows = parsedData.filter((d) => d._status === 'valid');
        validRows.forEach((row) => {
            if (row.name && row.category) {
                addModel({
                    name: row.name,
                    type: row.category,
                    brand: row.brand || '',
                    specs: '',
                });
            }
        });
        showToast(`${stats.valid} modèle(s) ajouté(s) au catalogue.`, 'success');
        onSave();
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setPreviewMode(false);
    };

    const rejectedRows = useMemo(() => parsedData.filter((d) => d._status === 'error'), [parsedData]);

    return (
        <FullScreenFormLayout
            title="Importer des modèles"
            onCancel={onCancel}
            onSave={handleImport}
            saveLabel={`Écrire les ${stats.valid} modèles`}
            isSaving={!previewMode || stats.valid === 0}
        >
            {!previewMode ? (
                <div className="flex flex-col gap-4">
                    {/* Carte 1 : Contrat de colonnes (Planche 09.2) */}
                    <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                        <h3 className="text-body-medium font-semibold text-on-surface mb-2">Colonnes attendues</h3>
                        <div className="divide-y divide-outline-variant text-body-small">
                            <div className="flex items-baseline justify-between py-2 first:pt-0 gap-3">
                                <code className="rounded-xs bg-surface-container px-1.5 py-0.5 font-mono text-[12px] font-semibold text-on-surface">
                                    name
                                </code>
                                <span className="flex-1 text-text-secondary">Nom complet du modèle (ex. Dell Latitude 7420)</span>
                                <span className="font-medium text-on-surface">Obligatoire</span>
                            </div>
                            <div className="flex items-baseline justify-between py-2 gap-3">
                                <code className="rounded-xs bg-surface-container px-1.5 py-0.5 font-mono text-[12px] font-semibold text-on-surface">
                                    type
                                </code>
                                <span className="flex-1 text-text-secondary">Clé ou nom de la catégorie (ex. Laptop, Monitor)</span>
                                <span className="font-medium text-on-surface">Obligatoire</span>
                            </div>
                            <div className="flex items-baseline justify-between py-2 last:pb-0 gap-3">
                                <code className="rounded-xs bg-surface-container px-1.5 py-0.5 font-mono text-[12px] font-semibold text-on-surface">
                                    brand
                                </code>
                                <span className="flex-1 text-text-secondary">Marque du constructeur (ex. Dell, Apple)</span>
                                <span className="text-text-secondary">Facultatif</span>
                            </div>
                        </div>
                    </section>

                    {/* Carte 2 : Zone de dépôt */}
                    <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                        <FileDropzone
                            onFileSelect={processFile}
                            accept=".csv"
                            label="Glisser un fichier CSV"
                            subLabel="Séparateur virgule ou point-virgule, encodage UTF-8"
                            className="p-8"
                        />
                    </section>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Carte 1 : Fichier lu et totaux */}
                    <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface">
                                <Icon glyph={FileCsv} size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-body-medium font-semibold text-on-surface">
                                    {file?.name}
                                </b>
                                <span className="text-body-small text-text-secondary">
                                    {parsedData.length} ligne{parsedData.length > 1 ? 's' : ''} analysée{parsedData.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={reset}>
                                Changer de fichier
                            </Button>
                        </div>

                        <div className="mt-3 flex gap-3">
                            <div className="flex-1 rounded-md bg-surface-container p-3">
                                <b className="block font-brand text-[24px] font-semibold tracking-[-0.01em] tabular-nums text-[var(--tk-color-st-vert)]">
                                    {stats.valid}
                                </b>
                                <span className="text-body-small text-text-secondary">
                                    modèle{stats.valid > 1 ? 's' : ''} prêt{stats.valid > 1 ? 's' : ''} à entrer
                                </span>
                            </div>
                            {stats.invalid > 0 && (
                                <div className="flex-1 rounded-md bg-surface-container p-3">
                                    <b className="block font-brand text-[24px] font-semibold tracking-[-0.01em] tabular-nums text-error">
                                        {stats.invalid}
                                    </b>
                                    <span className="text-body-small text-text-secondary">
                                        ligne{stats.invalid > 1 ? 's' : ''} refusée{stats.invalid > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Carte 2 : Lignes refusées explicitées */}
                    {rejectedRows.length > 0 && (
                        <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                            <h3 className="text-body-medium font-semibold text-error mb-2">
                                Lignes non conformes (ne seront pas importées)
                            </h3>
                            <div className="divide-y divide-outline-variant text-body-small">
                                {rejectedRows.map((row) => (
                                    <div key={row._id} className="flex items-start gap-3 py-2">
                                        <span className="font-mono text-text-secondary shrink-0">Ligne {row._id}</span>
                                        <div className="min-w-0 flex-1">
                                            <b className="text-on-surface">{row.name || 'Nom vide'}</b>
                                            <span className="block text-error text-[12px]">{row._error}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </FullScreenFormLayout>
    );
};

export default ImportModelsPage;

