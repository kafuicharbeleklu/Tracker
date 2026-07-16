import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useData } from '../../../context/DataContext';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import AddModelPage from './AddModelPage';
import { DetailHeader } from '../../../components/layout/DetailHeader';

interface ModelDetailsPageProps {
    modelId: string;
    onBack: () => void;
}

const ModelDetailsPage: React.FC<ModelDetailsPageProps> = ({ modelId, onBack }) => {
    const { equipment, models } = useData();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const model = models.find(m => m.id === modelId);

    if (!model) return <div className="p-page-sm medium:p-page text-center text-on-surface-variant py-10">Modèle introuvable</div>;

    // Filter equipment by model name
    const modelEquipment = equipment.filter(e => e.model === model.name);

    const availableCount = modelEquipment.filter(e => e.status === 'Disponible').length;
    const assignedCount = modelEquipment.filter(e => e.status === 'Attribué').length;

    return (
        <div className="flex flex-col h-full bg-surface-container-low">
            <AddModelPage
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                modelToEdit={model}
            />

            {/* Standardized Header */}
            <DetailHeader
                onBack={onBack}
                title={(
                    <span className="flex flex-wrap items-center gap-3">
                        <span>{model.name}</span>
                        <span className="inline-flex px-2.5 py-0.5 bg-surface-container rounded-full text-label-medium font-bold text-on-surface-variant uppercase tracking-wide border border-outline-variant">
                            {model.type}
                        </span>
                    </span>
                )}
                subtitle={`${modelEquipment.length} unités totales • ${availableCount} disponibles`}
                leadingVisual={(
                    <div className="w-16 h-16 bg-surface-container rounded-card flex items-center justify-center border border-outline-variant">
                        <img
                            src={model.image}
                            alt={model.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain mix-blend-multiply p-2"
                        />
                    </div>
                )}
                actions={(
                    <Button
                        className="rounded-lg shadow-elevation-1"
                        icon={<MaterialIcon name="edit" size={18} />}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        Modifier le modèle
                    </Button>
                )}
                contentClassName="expanded:items-center"
            />

            {/* Content Grid */}
            <div className="p-page-sm medium:p-page overflow-y-auto">
                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-8">
                    {/* Left Column: Product Info */}
                    <div className="expanded:col-span-1 space-y-6">
                        <div className="bg-surface rounded-card p-card border border-outline-variant shadow-elevation-1">
                            <h3 className="font-bold text-on-surface mb-4 text-label-large uppercase tracking-wide">Stock</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant text-body-medium">Total</span>
                                    <span className="font-bold text-on-surface">{modelEquipment.length}</span>
                                </div>
                                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
                                    <div className="bg-tertiary h-full" style={{ width: `${(availableCount / Math.max(modelEquipment.length, 1)) * 100}%` }}></div>
                                    <div className="bg-secondary h-full" style={{ width: `${(assignedCount / Math.max(modelEquipment.length, 1)) * 100}%` }}></div>
                                </div>
                                <div className="flex gap-4 text-label-medium font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                                        <span className="text-on-surface-variant">{availableCount} Disponibles</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                        <span className="text-on-surface-variant">{assignedCount} Attribués</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface rounded-card p-card border border-outline-variant shadow-elevation-1">
                            <h3 className="font-bold text-on-surface mb-4 text-label-large uppercase tracking-wide">Spécifications</h3>
                            <div className="space-y-3">
                                {model.specs ? (
                                    <p className="text-body-medium text-on-surface whitespace-pre-wrap leading-relaxed">{model.specs}</p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 text-body-medium">
                                            <MaterialIcon name="memory" size={16} className="text-on-surface-variant" />
                                            <span className="text-on-surface">Processeur standard</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-body-medium">
                                            <MaterialIcon name="layers" size={16} className="text-on-surface-variant" />
                                            <span className="text-on-surface">Configuration mémoire par défaut</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-body-medium">
                                            <MaterialIcon name="hard_drive" size={16} className="text-on-surface-variant" />
                                            <span className="text-on-surface">Stockage standard</span>
                                        </div>
                                        <p className="text-body-small text-on-surface-variant italic mt-2">Éditez le modèle pour ajouter des spécifications précises.</p>
                                    </>
                                )}
                                {model.brand && (
                                    <div className="pt-2 mt-2 border-t border-outline-variant/30 text-body-medium">
                                        <span className="text-on-surface-variant">Marque :</span> <span className="font-bold text-on-surface">{model.brand}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assets List */}
                    <div className="expanded:col-span-2">
                        <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden">
                            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
                                <h2 className="text-title-medium font-bold text-on-surface">Unités en inventaire</h2>
                                <Button variant="outlined" size="sm" className="!text-primary hover:text-primary-hover p-0 h-auto hover:bg-transparent border-none">
                                    Tout exporter
                                </Button>
                            </div>
                            <div className="hidden medium:block overflow-x-auto">
                                <table className="w-full text-body-medium text-left">
                                    <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium">
                                        <tr>
                                            <th className="px-6 py-4">Asset ID</th>
                                            <th className="px-6 py-4">Numéro de Série</th>
                                            <th className="px-6 py-4">Statut</th>
                                            <th className="px-6 py-4">Utilisateur</th>
                                            <th className="px-6 py-4">Garantie</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant">
                                        {modelEquipment.length > 0 ? (
                                            modelEquipment.map(item => (
                                                <tr key={item.id} className="hover:bg-surface-container/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-medium text-on-surface">{item.assetId}</td>
                                                    <td className="px-6 py-4 text-on-surface-variant">
                                                        {item.serialNumber || `SN-${item.id.padStart(5, '0')}`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={item.status === 'Disponible' ? 'success' : item.status === 'Attribué' ? 'info' : 'warning'}>
                                                            {item.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center text-label-small font-bold text-on-surface-variant overflow-hidden">
                                                                    {item.user.avatar ? (
                                                                        <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover" />
                                                                    ) : item.user.name?.[0]}
                                                                </div>
                                                                <span className="text-on-surface truncate max-w-[120px]">{item.user.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-outline italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-tertiary text-label-medium font-bold flex items-center gap-1">
                                                        <MaterialIcon name="check" size={12} /> Active
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                                                    <MaterialIcon name="inventory_2" size={32} className="mx-auto mb-3 opacity-50" />
                                                    Aucune unité de ce modèle trouvée.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Vue cartes (compact) — unités du modèle */}
                            <div className="medium:hidden divide-y divide-outline-variant">
                                {modelEquipment.length > 0 ? (
                                    modelEquipment.map(item => (
                                        <div key={item.id} className="p-4 space-y-2 hover:bg-surface-container/50 transition-colors">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-mono font-medium text-on-surface truncate">{item.assetId}</span>
                                                <Badge variant={item.status === 'Disponible' ? 'success' : item.status === 'Attribué' ? 'info' : 'warning'}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                            <p className="text-body-small text-on-surface-variant truncate">
                                                <span className="text-on-surface-variant/70">N° série : </span>
                                                {item.serialNumber || `SN-${item.id.padStart(5, '0')}`}
                                            </p>
                                            <div className="flex items-center justify-between gap-3">
                                                {item.user ? (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center text-label-small font-bold text-on-surface-variant overflow-hidden shrink-0">
                                                            {item.user.avatar ? (
                                                                <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover" />
                                                            ) : item.user.name?.[0]}
                                                        </div>
                                                        <span className="text-on-surface truncate">{item.user.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-outline italic">Non assigné</span>
                                                )}
                                                <span className="inline-flex items-center gap-1 text-tertiary text-label-medium font-bold shrink-0">
                                                    <MaterialIcon name="check" size={12} /> Active
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-12 text-center text-on-surface-variant">
                                        <MaterialIcon name="inventory_2" size={32} className="mx-auto mb-3 opacity-50" />
                                        Aucune unité de ce modèle trouvée.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelDetailsPage;


