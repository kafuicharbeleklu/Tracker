import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useMemo, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import DemoBadge from '../../../components/ui/DemoBadge';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { mockModels } from '../../../data/mockData';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { formatCurrency, resolveDepreciationConfig, calculateLinearDepreciation } from '../../../lib/financial';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';
import { GLOSSARY } from '../../../constants/glossary';
import { APP_CONFIG } from '../../../config';
import { Equipment } from '../../../types';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface AddEquipmentPageProps {
    equipmentId?: string; // Optional for Edit Mode
    onCancel: () => void;
    onSave: () => void;
}

const GLOBAL_FINANCIAL_SETTINGS = {
    method: 'linear' as const,
    years: 3,
    salvagePercent: 0
};

const EQUIPMENT_STATUS_OPTIONS = [
    { value: 'Disponible', label: 'Disponible' },
    { value: 'Attribué', label: 'Attribué' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En réparation', label: 'En réparation' },
    { value: 'En maintenance préventive', label: 'En maintenance préventive' },
    { value: 'Manquant', label: 'Manquant' },
    { value: 'Perdu', label: 'Perdu' },
    { value: 'Retiré', label: 'Retiré' },
    { value: 'Réformé', label: 'Réformé' },
];

const OPERATIONAL_STATUS_OPTIONS = [
    { value: 'Actif', label: 'Actif' },
    { value: 'Inactif', label: 'Inactif' },
    { value: 'Retiré', label: 'Retiré' },
];

const AddEquipmentPage: React.FC<AddEquipmentPageProps> = ({ equipmentId, onCancel, onSave }) => {
    const { showToast } = useToast();
    const { locationData, categories, equipment, addEquipment, updateEquipment, settings } = useData();
    const isMobile = useMediaQuery(MEDIA.belowExpanded);

    const isEditMode = !!equipmentId;

    const [formData, setFormData] = useState({
        categoryName: '',
        model: '',
        serialNumber: '',
        hostname: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
        manualMethod: 'linear' as 'linear' | 'degressive',
        manualYears: '',
        manualSalvagePercent: '0',
        supplier: '',
        invoiceNumber: '',
        warrantyStart: '',
        warrantyEnd: '',
        os: '',
        ram: '',
        storage: '',
        country: '',
        site: '',
        department: '',
        status: 'Disponible',
        operationalStatus: 'Actif',
        notes: ''
    });

    const [isScanning, setIsScanning] = useState(false);
    const [useCustomDepreciation, setUseCustomDepreciation] = useState(false);

    // Load data for edit mode
    useEffect(() => {
        if (equipmentId) {
            const itemToEdit = equipment.find(e => e.id === equipmentId);
            if (itemToEdit) {
                setFormData({
                    categoryName: itemToEdit.type || '',
                    model: itemToEdit.model || '',
                    serialNumber: itemToEdit.serialNumber || '',
                    hostname: itemToEdit.hostname || '',
                    purchaseDate: itemToEdit.financial?.purchaseDate ? new Date(itemToEdit.financial.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    purchasePrice: itemToEdit.financial?.purchasePrice.toString() || '',
                    manualMethod: itemToEdit.financial?.depreciationMethod || 'linear',
                    manualYears: itemToEdit.financial?.depreciationYears.toString() || '',
                    manualSalvagePercent: '0',
                    supplier: itemToEdit.financial?.supplier || '',
                    invoiceNumber: itemToEdit.financial?.invoiceNumber || '',
                    warrantyStart: '',
                    warrantyEnd: itemToEdit.warrantyEnd ? new Date(itemToEdit.warrantyEnd).toISOString().split('T')[0] : '',
                    os: itemToEdit.os || '',
                    ram: itemToEdit.ram || '',
                    storage: itemToEdit.storage || '',
                    country: itemToEdit.country || '',
                    site: itemToEdit.site || '',
                    department: itemToEdit.department || '',
                    status: itemToEdit.status,
                    operationalStatus: itemToEdit.operationalStatus || 'Actif',
                    notes: itemToEdit.notes || ''
                });

                const category = categories.find(c => c.name === itemToEdit.type);
                if (category && category.defaultDepreciation.years !== itemToEdit.financial?.depreciationYears) {
                    setUseCustomDepreciation(true);
                }
            }
        }
    }, [equipmentId, equipment, categories]);

    // Image inheritance
    const selectedModelData = useMemo(() =>
        mockModels.find(m => m.name === formData.model),
        [formData.model]);

    const selectedCategory = useMemo(() =>
        categories.find(c => c.name === formData.categoryName),
        [formData.categoryName, categories]);

    const filteredModels = useMemo(() => {
        if (!formData.categoryName) return mockModels;
        return mockModels.filter(m => m.type === formData.categoryName);
    }, [formData.categoryName]);

    const effectiveConfig = useMemo(() => {
        return resolveDepreciationConfig(
            useCustomDepreciation ? {
                method: formData.manualMethod,
                years: parseInt(formData.manualYears) || 0,
                salvagePercent: parseFloat(formData.manualSalvagePercent) || 0,
                source: 'equipment'
            } : null,
            selectedCategory?.defaultDepreciation ? {
                method: selectedCategory.defaultDepreciation.method,
                years: selectedCategory.defaultDepreciation.years,
                salvageValuePercent: selectedCategory.defaultDepreciation.salvageValuePercent
            } : null,
            GLOBAL_FINANCIAL_SETTINGS
        );
    }, [useCustomDepreciation, formData.manualMethod, formData.manualYears, formData.manualSalvagePercent, selectedCategory]);

    const financialEstimates = useMemo(() => {
        const price = parseFloat(formData.purchasePrice) || 0;
        if (price <= 0 || effectiveConfig.years <= 0) return null;

        return calculateLinearDepreciation(
            price,
            formData.purchaseDate,
            effectiveConfig.years,
            effectiveConfig.salvagePercent
        );
    }, [formData.purchasePrice, formData.purchaseDate, effectiveConfig]);

    const availableSites = useMemo(() => {
        return formData.country ? (locationData.sites[formData.country] || []) : [];
    }, [formData.country, locationData.sites]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'country') { newData.site = ''; }
            if (name === 'categoryName') {
                const fits = mockModels.find(m => m.name === prev.model && m.type === value);
                if (!fits) newData.model = '';
            }
            return newData;
        });
    };

    const handleScanSerial = () => {
        if (!isMobile) return;

        setIsScanning(true);
        showToast("Simulation du scan (démo)...", "info");
        setTimeout(() => {
            setIsScanning(false);
            const mockSerial = "SN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
            setFormData(prev => ({ ...prev, serialNumber: mockSerial }));
            showToast("Numéro de série d'exemple généré (démo) — vérifiez ou corrigez la valeur.", "info");
        }, 1500);
    };

    const handleSave = () => {
        if (!formData.categoryName || !formData.model || !formData.serialNumber) {
            showToast('Veuillez remplir les champs obligatoires (Catégorie, Modèle, N° Série)', 'error');
            return;
        }

        const payload = {
            name: formData.model,
            assetId: isEditMode && equipmentId ? equipment.find(e => e.id === equipmentId)?.assetId || '' : `ASSET-${Date.now()}`,
            type: formData.categoryName,
            model: formData.model,
            status: formData.status,
            serialNumber: formData.serialNumber,
            hostname: formData.hostname,
            os: formData.os,
            ram: formData.ram,
            storage: formData.storage,
            country: formData.country,
            site: formData.site,
            department: formData.department,
            warrantyEnd: formData.warrantyEnd,
            notes: formData.notes,
            operationalStatus: formData.operationalStatus as Equipment['operationalStatus'],
            image: selectedModelData?.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop',
            financial: {
                purchasePrice: parseFloat(formData.purchasePrice) || 0,
                purchaseDate: formData.purchaseDate,
                supplier: formData.supplier,
                invoiceNumber: formData.invoiceNumber,
                depreciationMethod: effectiveConfig.method,
                depreciationYears: effectiveConfig.years,
                salvageValue: financialEstimates?.salvageValue || 0
            }
        };

        if (isEditMode && equipmentId) {
            updateEquipment(equipmentId, payload);
            showToast(GLOSSARY.SUCCESS_UPDATE(GLOSSARY.EQUIPMENT), 'success');
        } else {
            addEquipment({
                ...payload,
                id: Date.now().toString(),
                assignmentStatus: 'NONE'
            });
            showToast(GLOSSARY.SUCCESS_CREATE(GLOSSARY.EQUIPMENT), 'success');
        }

        onSave();
    };

    return (
        <FullScreenFormLayout
            title={isEditMode ? "Modifier l'actif" : "Nouvel actif"}
            onCancel={onCancel}
            onSave={handleSave}
            saveLabel={isEditMode ? "Enregistrer les modifications" : "Créer l'équipement"}
        >
            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-8 max-w-7xl mx-auto">

                {/* COLONNE GAUCHE: IDENTITÉ & APERÇU (1/3) */}
                <div className="expanded:col-span-1 space-y-6">
                    {/* Photo Card */}
                    <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant flex flex-col items-center">
                        <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest mb-6 self-start flex items-center gap-2">
                            <MaterialIcon name="image" size={14} /> Aperçu visuel
                        </h3>

                        <div className="relative w-full aspect-square max-w-[240px]">
                            <div className={cn(
                                "w-full h-full rounded-md border-2 flex flex-col items-center justify-center transition-all duration-short4 overflow-hidden bg-surface-container-low",
                                selectedModelData ? "border-tertiary-container shadow-inner" : "border-outline-variant border-dashed"
                            )}>
                                {selectedModelData ? (
                                    <div className="relative w-full h-full p-6 flex items-center justify-center">
                                        <img src={selectedModelData.image} alt={selectedModelData.name} className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-sm animate-in zoom-in-95 duration-500" />
                                        <div className="absolute top-3 right-3">
                                            <Badge variant="success" className="shadow-none">Hérité du modèle</Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-8 opacity-40">
                                        <MaterialIcon name="select_all" size={48} className="text-on-surface-variant mx-auto mb-3" />
                                        <p className="text-label-small text-on-surface-variant uppercase tracking-tight leading-relaxed">
                                            Choisissez un modèle<br />pour voir l'aperçu
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedModelData && (
                            <div className="mt-4 w-full text-center">
                                <p className="text-label-large text-on-surface">{selectedModelData.name}</p>
                                <p className="text-label-small text-on-surface-variant uppercase tracking-tighter">Catalogue {APP_CONFIG.companyName}</p>
                            </div>
                        )}
                    </section>

                    {/* Identification */}
                    <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant space-y-5">
                        <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-2">
                            <MaterialIcon name="label" size={14} className="text-primary" /> Identification
                        </h3>

                        <SelectField
                            label="Catégorie d'actif"
                            name="categoryName"
                            options={categories.map(c => ({ value: c.name, label: c.name }))}
                            value={formData.categoryName}
                            onChange={handleChange}
                            required
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-label-large text-on-surface">Numéro de série</label>
                                {isMobile && (
                                    <div className="flex items-center gap-1.5">
                                        <DemoBadge label="Simulation" title="Le scan caméra est simulé : il génère un numéro de série d'exemple" />
                                        <Button
                                            type="button"
                                            variant="text"
                                            onClick={handleScanSerial}
                                            disabled={isScanning}
                                            className="!px-2 !py-0.5 !rounded-xs !bg-primary-container !text-on-primary-container hover:!text-on-primary-container/80 !uppercase !text-label-small"
                                        >
                                            {isScanning ? <MaterialIcon name="sync" size={12} className="animate-spin" /> : <MaterialIcon name="qr_code_scanner" size={12} />}
                                            {isScanning ? "Analyse..." : "Scan Caméra"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <InputField
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleChange}
                                placeholder={isMobile ? "Saisir ou scanner le SN..." : "Saisir le SN..."}
                                icon={<MaterialIcon name="inventory_2" size={18} />}
                                required
                            />
                        </div>

                        <InputField
                            label="Nom de l'hôte (Hostname)"
                            name="hostname"
                            value={formData.hostname}
                            onChange={handleChange}
                            placeholder="Ex: PC-SENEGAL-001"
                            icon={<MaterialIcon name="info" size={18} />}
                        />
                    </section>
                </div>

                {/* COLONNE DROITE: SPECS & FINANCE (2/3) */}
                <div className="expanded:col-span-2 space-y-6">

                    {/* Spécifications */}
                    <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant">
                        <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-6">
                            <MaterialIcon name="memory" size={14} className="text-secondary" /> Modèle & Spécifications
                        </h3>
                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-x-8 gap-y-6">
                            <SelectField
                                label="Modèle Exact"
                                name="model"
                                options={filteredModels.map(m => ({ value: m.name, label: m.name }))}
                                value={formData.model}
                                onChange={handleChange}
                                required
                                placeholder={formData.categoryName ? "Rechercher un modèle..." : "Choisissez d'abord une catégorie"}
                                disabled={!formData.categoryName}
                            />
                            <InputField
                                label="OS / Version"
                                name="os"
                                value={formData.os}
                                onChange={handleChange}
                                placeholder="Windows 11 / macOS / Android"
                            />
                            <InputField
                                label="Mémoire RAM"
                                name="ram"
                                value={formData.ram}
                                onChange={handleChange}
                                placeholder="Ex: 16 GB"
                                icon={<MaterialIcon name="layers" size={16} />}
                            />
                            <InputField
                                label="Stockage"
                                name="storage"
                                value={formData.storage}
                                onChange={handleChange}
                                placeholder="Ex: 512 GB SSD"
                                icon={<MaterialIcon name="storage" size={16} />}
                            />
                        </div>
                    </section>

                    {/* Finance */}
                    <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                                <MaterialIcon name="euro" size={14} className="text-tertiary" /> Acquisition Financière
                            </h3>
                            {financialEstimates && (
                                <div className="flex items-center gap-2 bg-tertiary-container px-3 py-1 rounded-full border border-outline-variant animate-in fade-in zoom-in-95">
                                    <span className="text-label-small text-on-tertiary-container uppercase">Valeur Résiduelle :</span>
                                    <span className="text-label-large text-on-tertiary-container">{formatCurrency(financialEstimates.salvageValue, settings.currency)}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-8">
                            <InputField
                                label="Prix d'achat (HT)"
                                type="number"
                                name="purchasePrice"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                placeholder="0.00"
                                icon={<span className="text-on-surface-variant font-medium">{settings.currency === 'USD' ? '$' : settings.currency === 'XOF' ? 'XOF' : '€'}</span>}
                                required
                            />
                            <InputField
                                label="Date d'achat"
                                type="date"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Bloc Amortissement */}
                        <div className={cn(
                            "p-6 rounded-md border transition-all duration-medium2 ease-emphasized",
                            useCustomDepreciation ? "bg-surface-container-low border-outline-variant" : "bg-secondary-container border-outline-variant"
                        )}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-md transition-colors duration-short4", useCustomDepreciation ? "bg-surface-container-highest text-on-surface-variant" : "bg-secondary text-on-secondary shadow-elevation-1")}>
                                        <MaterialIcon name="calculate" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-label-large text-on-surface">Règle de dépréciation</h4>
                                        <p className="text-label-small text-on-surface-variant uppercase tracking-tighter mt-0.5">
                                            Source : {effectiveConfig.source === 'category' ? 'Paramètres Catégorie' : effectiveConfig.source === 'equipment' ? 'Override Manuel' : 'Global System'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={() => setUseCustomDepreciation(!useCustomDepreciation)}
                                    className="!px-0 !py-0 !text-label-small !text-secondary hover:!text-secondary/80 underline uppercase tracking-widest"
                                >
                                    {useCustomDepreciation ? "Rétablir défauts" : "Personnaliser"}
                                </Button>
                            </div>

                            {useCustomDepreciation ? (
                                <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                    <SelectField
                                        label="Méthode"
                                        name="manualMethod"
                                        options={[{ value: 'linear', label: 'Linéaire' }, { value: 'degressive', label: 'Dégressif' }]}
                                        value={formData.manualMethod}
                                        onChange={handleChange}
                                    />
                                    <InputField
                                        label="Durée (Ans)"
                                        type="number"
                                        name="manualYears"
                                        value={formData.manualYears}
                                        onChange={handleChange}
                                        placeholder="Nb ans"
                                        icon={<MaterialIcon name="calendar_today" size={14} />}
                                    />
                                    <InputField
                                        label="Résiduel (%)"
                                        type="number"
                                        name="manualSalvagePercent"
                                        value={formData.manualSalvagePercent}
                                        onChange={handleChange}
                                        placeholder="Ex: 5%"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col medium:flex-row items-center gap-6 text-on-secondary-container">
                                    <div className="flex gap-4 w-full medium:w-auto">
                                        <div className="bg-surface-container-lowest/70 backdrop-blur-sm px-4 py-3 rounded-md text-center flex-1 medium:min-w-[100px] border border-outline-variant shadow-elevation-1">
                                            <span className="block text-label-small uppercase opacity-40 mb-1">Durée</span>
                                            <span className="text-title-large">{effectiveConfig.years} ans</span>
                                        </div>
                                        <div className="bg-surface-container-lowest/70 backdrop-blur-sm px-4 py-3 rounded-md text-center flex-1 medium:min-w-[100px] border border-outline-variant shadow-elevation-1">
                                            <span className="block text-label-small uppercase opacity-40 mb-1">Méthode</span>
                                            <span className="text-title-large">{effectiveConfig.method === 'linear' ? 'LIN' : 'DEG'}</span>
                                        </div>
                                    </div>

                                    {financialEstimates && (
                                        <div className="medium:ml-auto text-center medium:text-right bg-secondary/5 px-4 py-2 rounded-md border border-outline-variant w-full medium:w-auto">
                                            <span className="block text-label-small uppercase text-secondary mb-1 tracking-widest">Amortissement Estimé</span>
                                            <span className="text-headline-small text-on-surface">{formatCurrency(financialEstimates.monthlyDepreciation, settings.currency)} <span className="text-body-small opacity-60">/ mois</span></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Localisation */}
                    <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant">
                        <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-6">
                            <MaterialIcon name="location_on" size={14} className="text-error" /> Emplacement Physique
                        </h3>
                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                            <SelectField
                                label="Pays"
                                name="country"
                                options={locationData.countries.map(c => ({ value: c, label: c }))}
                                value={formData.country}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Site / Campus"
                                name="site"
                                options={availableSites.map(s => ({ value: s, label: s }))}
                                value={formData.site}
                                onChange={handleChange}
                                disabled={!formData.country}
                                placeholder={!formData.country ? "Sélectionnez un pays" : "Choisir un site"}
                            />
                            <SelectField
                                label="Statut inventaire"
                                name="status"
                                options={EQUIPMENT_STATUS_OPTIONS}
                                value={formData.status}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Statut opérationnel"
                                name="operationalStatus"
                                options={OPERATIONAL_STATUS_OPTIONS}
                                value={formData.operationalStatus}
                                onChange={handleChange}
                            />
                        </div>
                    </section>

                    {/* PREVIEW CARD */}
                    <div className="sticky top-8">
                        <div className="bg-surface rounded-card p-6 border border-outline-variant shadow-elevation-3 text-center">
                            <h3 className="text-title-medium font-bold text-on-surface mb-6">Aperçu de la fiche</h3>
                        </div>
                    </div>

                    {/* Garantie & Notes */}
                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-8">
                        <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant space-y-5">
                            <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-2">
                                <MaterialIcon name="verified_user" size={14} className="text-tertiary" /> Garantie Constructeur
                            </h3>
                            <InputField
                                label="Date expiration"
                                type="date"
                                name="warrantyEnd"
                                value={formData.warrantyEnd}
                                onChange={handleChange}
                            />
                        </section>

                        <section className="bg-surface rounded-md p-6 shadow-elevation-1 border border-outline-variant">
                            <h3 className="text-label-small text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-6">
                                <MaterialIcon name="description" size={14} className="text-primary" /> Observations
                            </h3>
                            <TextArea
                                label=""
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Détails de configuration..."
                                rows={3}
                            />
                        </section>
                    </div>
                </div>
            </div>
        </FullScreenFormLayout>
    );
};

export default AddEquipmentPage;





