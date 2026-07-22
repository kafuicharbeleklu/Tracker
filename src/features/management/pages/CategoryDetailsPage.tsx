import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { mockCategories, mockModels, renderCategoryIcon } from '../../../data/mockData';
import Badge from '../../../components/ui/Badge';
import { PageTabs } from '../../../components/ui/PageTabs';
import { DetailHeader } from '../../../components/layout/DetailHeader';

interface CategoryDetailsPageProps {
    categoryId: string;
    onBack: () => void;
    onModelClick: (id: string) => void;
}

const CategoryDetailsPage: React.FC<CategoryDetailsPageProps> = ({ categoryId, onBack, onModelClick }) => {
    const { equipment } = useData();
    const [activeTab, setActiveTab] = useState<'models' | 'assets'>('models');
    const category = mockCategories.find(c => c.id === categoryId);

    if (!category) return <div className="p-page-sm medium:p-page">Category not found</div>;

    // Filter models and equipment
    const categoryModels = mockModels.filter(m => m.type === category.name);
    const categoryEquipment = equipment.filter(e => e.type === category.name);

    return (
        <div className="flex flex-col h-full bg-surface-container-low">
            {/* Header */}
            <DetailHeader
                onBack={onBack}
                title={category.name}
                subtitle={`${categoryEquipment.length} actifs • ${categoryModels.length} modèles`}
                leadingVisual={(
                    <div className="w-16 h-16 bg-primary rounded-card flex items-center justify-center text-on-surface shadow-elevation-2">
                        {renderCategoryIcon(category, 32)}
                    </div>
                )}
                tabs={(
                    <PageTabs
                        activeId={activeTab}
                        onChange={(tabId) => setActiveTab(tabId as 'models' | 'assets')}
                        items={[
                            { id: 'models', label: 'Modèles' },
                            { id: 'assets', label: 'Tous les actifs', shortLabel: 'Actifs' }
                        ]}
                    />
                )}
            />

            {/* Content */}
            <div className="p-page-sm medium:p-page overflow-y-auto">
                {activeTab === 'models' ? (
                    <div className="grid grid-cols-1 expanded:grid-cols-2 extra-large:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                        {categoryModels.map(model => (
                            <div
                                key={model.id}
                                onClick={() => onModelClick(model.id)}
                                className="bg-surface rounded-card p-card shadow-elevation-1 border border-transparent hover:border-primary/50 hover:shadow-elevation-2 transition-all cursor-pointer group flex flex-col"
                            >
                                <div className="flex-1 flex flex-col items-center mb-6">
                                    <div className="w-full h-32 bg-surface-container rounded-card mb-4 p-4 border border-outline-variant group-hover:scale-105 transition-transform">
                                        <img
                                            src={model.image}
                                            alt={model.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                    <h3 className="font-bold text-on-surface text-title-medium text-center group-hover:text-primary transition-colors">{model.name}</h3>
                                    <p className="text-on-surface-variant text-body-medium">{model.type}</p>
                                </div>
                                <div className="border-t border-outline-variant/30 pt-4 flex justify-between items-center text-body-medium">
                                    <span className="text-on-surface-variant">Unités</span>
                                    <span className="font-bold text-on-surface">{model.count}</span>
                                </div>
                            </div>
                        ))}
                        {categoryModels.length === 0 && (
                            <div className="col-span-full text-center py-12 text-on-surface-variant">
                                Aucun modèle trouvé pour cette catégorie.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <table className="w-full text-body-medium text-left">
                            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase text-label-medium">
                                <tr>
                                    <th className="px-6 py-4">Nom</th>
                                    <th className="px-6 py-4">Asset ID</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4">Utilisateur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {categoryEquipment.map(item => (
                                    <tr key={item.id} className="hover:bg-surface-container/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-on-surface">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.image}
                                                    loading="lazy"
                                                    decoding="async"
                                                    alt={item.name}
                                                    className="w-8 h-8 rounded-md bg-surface-container object-cover"
                                                />
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-on-surface-variant">{item.assetId}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={item.status === 'Disponible' ? 'success' : item.status === 'Attribué' ? 'info' : 'warning'}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-on-surface-variant">
                                            {item.user ? item.user.name : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {categoryEquipment.length === 0 && (
                            <div className="text-center py-12 text-on-surface-variant">
                                Aucun actif trouvé.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryDetailsPage;


