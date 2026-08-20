import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { PageHeader, useHasMobileTopBar } from '../../../components/layout/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { GLOSSARY } from '../../../constants/glossary';
import { cn } from '../../../lib/utils';
import { useData } from '../../../context/DataContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import SelectField from '../../../components/ui/SelectField';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ListActionFab from '../../../components/ui/ListActionFab';
import Modal from '../../../components/ui/Modal';
import { buildCsvLine } from '../../../lib/csv';
import { rowActivation } from '../../../lib/a11y';

type EntityType = 'country' | 'site' | 'service';

const normalizeLocationValue = (value?: string | null) => (value || '').trim().toLowerCase();

const LocationsPage = () => {
    const { showToast } = useToast();
    const { navigate } = useAppNavigation();
    const { locationData, addLocation, renameLocation, deleteLocation, equipment, users, assignManagerToService, serviceManagers } = useData();
    const { requestConfirmation } = useConfirmation();
    const isCompact = useMediaQuery(MEDIA.compact);
    const isHoverCapable = useMediaQuery(MEDIA.hoverCapable);
    const hasMobileTopBar = useHasMobileTopBar();

    // Hierarchy Selection State
    const [selectedCountry, setSelectedCountry] = useState(locationData.countries[0] || 'France');
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedService, setSelectedService] = useState('');

    // Modal State
    const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
    const [targetType, setTargetType] = useState<EntityType | null>(null);
    const [editingName, setEditingName] = useState('');

    // Form State
    const [newName, setNewName] = useState('');
    const [parentId, setParentId] = useState('');
    const [selectedManagerId, setSelectedManagerId] = useState(''); // NEW

    // Update selection when dependencies change
    useEffect(() => {
        const sites = locationData.sites[selectedCountry] || [];
        if (!sites.includes(selectedSite)) setSelectedSite(sites[0] || '');
    }, [selectedCountry, locationData.sites, selectedSite]);

    useEffect(() => {
        const services = locationData.services[selectedSite] || [];
        if (!services.includes(selectedService)) setSelectedService(services[0] || '');
    }, [selectedSite, locationData.services, selectedService]);

    const currentSites = locationData.sites[selectedCountry] || [];
    const currentServices = locationData.services[selectedSite] || [];

    // Statistiques pour l'affichage résumé
    const stats = useMemo(() => {
        if (!selectedService) return null;

        const targetCountry = normalizeLocationValue(selectedCountry);
        const targetSite = normalizeLocationValue(selectedSite);
        const targetService = normalizeLocationValue(selectedService);

        const strictEquipment = equipment.filter((item) => {
            const country = normalizeLocationValue(item.country);
            const site = normalizeLocationValue(item.site);
            const service = normalizeLocationValue(item.department);
            return country === targetCountry && site === targetSite && service === targetService;
        });

        const strictUsers = users.filter((item) => {
            const country = normalizeLocationValue(item.country);
            const site = normalizeLocationValue(item.site);
            const service = normalizeLocationValue(item.department);
            return country === targetCountry && site === targetSite && service === targetService;
        });

        // Fallback: when service metadata is incomplete, keep a useful site-level recap instead of zeros.
        const fallbackEquipment = equipment.filter((item) => {
            const country = normalizeLocationValue(item.country);
            const site = normalizeLocationValue(item.site);
            return country === targetCountry && (!site || site === targetSite);
        });

        const fallbackUsers = users.filter((item) => {
            const country = normalizeLocationValue(item.country);
            const site = normalizeLocationValue(item.site);
            return country === targetCountry && (!site || site === targetSite);
        });

        const usesSiteFallback = strictEquipment.length === 0 && strictUsers.length === 0;
        const locationEquipment = usesSiteFallback ? fallbackEquipment : strictEquipment;
        const locationUsers = usesSiteFallback ? fallbackUsers : strictUsers;
        const functionalCount = locationEquipment.filter(
            (item) => item.status !== 'En réparation' && item.operationalStatus !== 'Inactif'
        ).length;

        const managerId = serviceManagers[selectedService];
        const manager = users.find((item) => item.id === managerId);

        return {
            equipmentCount: locationEquipment.length,
            userCount: locationUsers.length,
            isAllFunctional: functionalCount === locationEquipment.length && locationEquipment.length > 0,
            // Repli site : comptes au niveau du site quand rien n'est rattaché au service (à étiqueter à l'affichage)
            usesSiteFallback: usesSiteFallback && (locationEquipment.length > 0 || locationUsers.length > 0),
            managerName: manager ? manager.name : 'Non assigné'
        };
    }, [selectedCountry, selectedSite, selectedService, equipment, users, serviceManagers]);

    // Liste des managers potentiels (exclut les simples users si besoin, ou filtre sur rôle)
    const potentialManagers = useMemo(() => {
        return users.filter(u => u.role !== 'User').map(u => ({
            value: u.id,
            label: `${u.name} (${u.role})`
        }));
    }, [users]);

    const exportLocations = useCallback(() => {
        const headers = ['Pays', 'Site', 'Service', 'Responsable', 'Equipements', 'Utilisateurs'];
        const rows: string[][] = [];

        locationData.countries.forEach((country) => {
            const sites = locationData.sites[country] || [''];
            sites.forEach((site) => {
                const services = site ? (locationData.services[site] || ['']) : [''];
                services.forEach((service) => {
                    const equipmentCount = equipment.filter((item) => {
                        const matchesCountry = normalizeLocationValue(item.country) === normalizeLocationValue(country);
                        const matchesSite = !site || !item.site || normalizeLocationValue(item.site) === normalizeLocationValue(site);
                        const matchesService = !service || !item.department || normalizeLocationValue(item.department) === normalizeLocationValue(service);
                        return matchesCountry && matchesSite && matchesService;
                    }).length;

                    const userCount = users.filter((item) => {
                        const matchesCountry = normalizeLocationValue(item.country) === normalizeLocationValue(country);
                        const matchesSite = !site || !item.site || normalizeLocationValue(item.site) === normalizeLocationValue(site);
                        const matchesService = !service || normalizeLocationValue(item.department) === normalizeLocationValue(service);
                        return matchesCountry && matchesSite && matchesService;
                    }).length;

                    const managerId = service ? serviceManagers[service] : undefined;
                    const managerName = managerId ? users.find((item) => item.id === managerId)?.name || '' : '';

                    rows.push([
                        country,
                        site,
                        service,
                        managerName,
                        String(equipmentCount),
                        String(userCount),
                    ]);
                });
            });
        });

        const csvLines = [
            buildCsvLine(headers),
            ...rows.map((row) => buildCsvLine(row)),
        ];

        const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emplacements-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Export des emplacements terminé.', 'success');
    }, [equipment, locationData.countries, locationData.services, locationData.sites, serviceManagers, showToast, users]);

    const compactActions = (() => {
        const actions = [
            {
                id: 'export-locations',
                label: 'Exporter les emplacements',
                icon: 'download',
                variant: 'outlined' as const,
                onSelect: exportLocations,
            },
            {
                id: 'import-locations',
                label: 'Importer des emplacements',
                icon: 'upload',
                variant: 'outlined' as const,
                onSelect: () => navigate('/locations/import'),
            },
            {
                id: 'add-country',
                label: 'Ajouter un pays',
                icon: 'add',
                variant: 'filled' as const,
                onSelect: () => openCreateForm('country'),
            },
        ];

        if (selectedCountry) {
            actions.push({
                id: 'add-site',
                label: 'Ajouter un site',
                icon: 'apartment',
                variant: 'outlined' as const,
                onSelect: () => openCreateForm('site'),
            });
        }

        if (selectedSite) {
            actions.push({
                id: 'add-service',
                label: 'Ajouter un service',
                icon: 'meeting_room',
                variant: 'outlined' as const,
                onSelect: () => openCreateForm('service'),
            });
        }

        return actions;
    })();

    function resetForm() {
        setModalType(null);
        setTargetType(null);
        setNewName('');
        setParentId('');
        setEditingName('');
        setSelectedManagerId('');
    }

    function openCreateForm(type: EntityType) {
        resetForm();
        setModalType('create');
        setTargetType(type);
        if (type === 'site') setParentId(selectedCountry);
        if (type === 'service') setParentId(selectedSite);
    }

    const openEditForm = (e: React.MouseEvent, type: EntityType, name: string) => {
        e.stopPropagation();
        resetForm();
        setModalType('edit');
        setTargetType(type);
        setEditingName(name);
        setNewName(name);
        if (type === 'site') setParentId(selectedCountry);
        if (type === 'service') {
            setParentId(selectedSite);
            // Load existing manager
            if (serviceManagers[name]) {
                setSelectedManagerId(serviceManagers[name]);
            }
        }
    };

    const handleDelete = (e: React.MouseEvent, type: EntityType, name: string) => {
        e.stopPropagation();

        requestConfirmation({
            title: `Supprimer ${name}`,
            message: `Êtes-vous sûr de vouloir supprimer ${type === 'country' ? 'le pays' : type === 'site' ? 'le site' : 'le service'} "${name}" ?`,
            variant: 'warning',
            onConfirm: () => {
                let pid = '';
                if (type === 'site') pid = selectedCountry;
                if (type === 'service') pid = selectedSite;

                deleteLocation(type, name, pid);
                showToast(`${name} supprimé avec succès`, 'info');

                if (type === 'country' && selectedCountry === name) setSelectedCountry('');
                if (type === 'site' && selectedSite === name) setSelectedSite('');
                if (type === 'service' && selectedService === name) setSelectedService('');
            }
        });
    };

    const handleSave = () => {
        if (!newName) { showToast('Le nom est requis', 'error'); return; }

        let success = false;

        if (modalType === 'create' && targetType) {
            if (addLocation(targetType, newName, parentId)) {
                success = true;
                if (targetType === 'country') setSelectedCountry(newName);
                if (targetType === 'site') setSelectedSite(newName);
                if (targetType === 'service') setSelectedService(newName);
            } else { showToast(`Existe déjà`, 'error'); return; }
        } else if (modalType === 'edit' && targetType) {
            if (renameLocation(targetType, editingName, newName, parentId)) {
                success = true;
                if (targetType === 'country' && selectedCountry === editingName) setSelectedCountry(newName);
                if (targetType === 'site' && selectedSite === editingName) setSelectedSite(newName);
                if (targetType === 'service' && selectedService === editingName) setSelectedService(newName);
            } else { showToast(`Existe déjà`, 'error'); return; }
        }

        if (success) {
            // Sauvegarde du manager si c'est un service
            if (targetType === 'service' && selectedManagerId) {
                assignManagerToService(newName, selectedManagerId);
            }
            showToast(modalType === 'create' ? `${newName} ajouté` : `${newName} mis à jour`, 'success');
            resetForm();
        }
    };

    // LOC : la rangée n'est plus un role="button" englobant — la sélection est un Button DS
    // frère des actions, plus d'interactifs imbriqués pour les lecteurs d'écran.
    const renderListItem = (item: string, type: EntityType, isSelected: boolean, onClick: () => void) => (
        <div
            key={item}
            className={cn(
                "group relative flex min-h-11 items-center overflow-hidden rounded-xl text-label-large font-bold transition-all",
                isSelected
                    ? 'bg-primary-container text-on-primary-container shadow-elevation-1 border border-primary/30'
                    : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
            )}
        >
            <Button
                variant="text"
                type="button"
                onClick={onClick}
                aria-current={isSelected || undefined}
                className="flex min-h-11 flex-1 items-center justify-start gap-3 overflow-hidden rounded-xl px-4 py-2.5 pr-[5.75rem] text-left text-current text-label-large font-bold hover:bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                {type === 'country' && <MaterialIcon name="public" size={16} className={isSelected ? "text-on-primary-container" : "text-primary"} />}
                {type === 'site' && <MaterialIcon name="apartment" size={16} className={isSelected ? "text-on-primary-container" : "text-secondary"} />}
                {type === 'service' && <MaterialIcon name="meeting_room" size={16} className={isSelected ? "text-on-primary-container" : "text-tertiary"} />}
                <span className="truncate">{item}</span>
            </Button>

            <div
                className={cn(
                    'absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-surface/85 p-0.5 backdrop-blur-[1px] transition-all duration-short4',
                    // Hover-reveal uniquement quand un vrai survol existe ; toujours visible au tactile.
                    isHoverCapable &&
                        'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
                )}
            >
                <Button
                    variant="text"
                    size="sm"
                    onClick={(e) => openEditForm(e, type, item)}
                    className={cn("h-8 w-8 min-w-0 p-0 aspect-square rounded-md border-none shadow-none inline-flex items-center justify-center", isSelected ? "hover:bg-surface/20 text-current" : "hover:bg-outline-variant text-on-surface-variant")}
                    title="Renommer"
                >
                    <MaterialIcon name="edit" size={16} />
                </Button>
                <Button
                    variant="text"
                    size="sm"
                    onClick={(e) => handleDelete(e, type, item)}
                    className={cn("h-8 w-8 min-w-0 p-0 aspect-square rounded-md border-none shadow-none inline-flex items-center justify-center", isSelected ? "hover:bg-error hover:text-on-error text-current" : "hover:bg-error-container text-on-surface-variant hover:text-error")}
                    title="Supprimer"
                >
                    <MaterialIcon name="delete" size={16} />
                </Button>
            </div>
        </div>
    );

    const modalTitle = targetType
        ? `${modalType === 'create' ? 'Ajouter' : 'Modifier'} ${targetType === 'country' ? 'Pays' : targetType === 'site' ? 'Site' : 'Service'}`
        : '';
    const modalIcon = targetType ? (
        targetType === 'country'
            ? <MaterialIcon name="public" size={22} />
            : targetType === 'site'
                ? <MaterialIcon name="apartment" size={22} />
                : <MaterialIcon name="meeting_room" size={22} />
    ) : undefined;
    const modalFooter = (
        <>
            <Button variant="outlined" onClick={resetForm}>Annuler</Button>
            <Button variant="filled" icon={<MaterialIcon name="save" size={18} />} onClick={handleSave}>
                {modalType === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Enveloppe non rendue quand le PageHeader n'affiche rien (compact portrait, X11) */}
            {!hasMobileTopBar && (
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title={GLOSSARY.LOCATIONS}
                        subtitle="Gérez la hiérarchie géographique et organisationnelle de vos actifs."
                        breadcrumb={GLOSSARY.LOCATIONS}
                        actions={
                            !isCompact && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outlined"
                                        icon={<MaterialIcon name="download" size={18} />}
                                        onClick={exportLocations}
                                    >
                                        Exporter
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        icon={<MaterialIcon name="upload" size={18} />}
                                        onClick={() => navigate('/locations/import')}
                                    >
                                        Importer
                                    </Button>
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="add" size={18} />}
                                        onClick={() => openCreateForm('country')}
                                    >
                                        Ajouter un pays
                                    </Button>
                                </div>
                            )
                        }
                    />
                </div>
            </div>
            )}

            <Modal
                isOpen={Boolean(modalType)}
                onClose={resetForm}
                title={modalTitle}
                icon={modalIcon}
                footer={modalFooter}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    <p className="text-body-small text-on-surface-variant">
                        {modalType === 'create'
                            ? 'Créez un nouvel élément dans la hiérarchie.'
                            : `Renommez l'élément "${editingName}".`}
                    </p>

                    {/* Champs Code/Description retirés : ils étaient collectés puis silencieusement ignorés (audit LOC-4) */}
                    <InputField
                        label="Nom"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        icon={<MaterialIcon name="dashboard" size={18} />}
                        variant="outlined"
                        required
                    />

                    {targetType === 'service' && (
                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                            <h4 className="text-label-small font-semibold text-on-surface uppercase tracking-wide mb-3 flex items-center gap-2">
                                <MaterialIcon name="account_circle" size={16} />
                                Hiérarchie
                            </h4>
                            <SelectField
                                label="Responsable du service (Manager)"
                                name="managerId"
                                options={[{ value: '', label: 'Non assigné' }, ...potentialManagers]}
                                value={selectedManagerId}
                                onChange={(e) => setSelectedManagerId(e.target.value)}
                                placeholder="Assigner un manager..."
                            />
                            <p className="text-label-small text-on-surface-variant mt-2">
                                Tous les utilisateurs de ce service seront automatiquement rattachés à ce manager.
                            </p>
                        </div>
                    )}

                </div>
            </Modal>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="px-page-sm medium:px-page pt-6 animate-in fade-in slide-in-from-right-4 duration-medium2 pb-12">
                    <div className="grid grid-cols-12 gap-6">
                        <Card className="col-span-12 expanded:col-span-4 h-[320px]" title="Pays" actionIcon={!isCompact ? <MaterialIcon name="add" size={18} /> : undefined} onActionClick={!isCompact ? () => openCreateForm('country') : undefined}>
                            <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
                                {locationData.countries.map(c => renderListItem(c, 'country', selectedCountry === c, () => setSelectedCountry(c)))}
                            </div>
                        </Card>

                        <Card className={cn("col-span-12 expanded:col-span-4 h-[320px] transition-all", !selectedCountry && "opacity-50 grayscale pointer-events-none")} title="Sites" actionIcon={!isCompact ? <MaterialIcon name="add" size={18} /> : undefined} onActionClick={!isCompact ? () => openCreateForm('site') : undefined}>
                            <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
                                {selectedCountry ? (
                                    currentSites.length > 0 ? currentSites.map(s => renderListItem(s, 'site', selectedSite === s, () => setSelectedSite(s))) : <div className="text-center py-10 text-on-surface-variant text-label-medium font-bold uppercase">Aucun site</div>
                                ) : <div className="text-center py-10 text-on-surface-variant text-label-medium font-bold uppercase">Sélectionnez un pays</div>}
                            </div>
                        </Card>

                        <Card className={cn("col-span-12 expanded:col-span-4 h-[320px] transition-all", !selectedSite && "opacity-50 grayscale pointer-events-none")} title="Services" actionIcon={!isCompact ? <MaterialIcon name="add" size={18} /> : undefined} onActionClick={!isCompact ? () => openCreateForm('service') : undefined}>
                            <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
                                {selectedSite ? (
                                    currentServices.length > 0 ? currentServices.map(s => renderListItem(s, 'service', selectedService === s, () => setSelectedService(s))) : <div className="text-center py-10 text-on-surface-variant text-label-medium font-bold uppercase">Aucun service</div>
                                ) : <div className="text-center py-10 text-on-surface-variant text-label-medium font-bold uppercase">Sélectionnez un site</div>}
                            </div>
                        </Card>

                        <Card className={cn("col-span-12 transition-all mt-2", !selectedService && "opacity-50 grayscale")} title="Récapitulatif de l'emplacement">
                            {stats ? (
                                <div className="grid grid-cols-1 expanded:grid-cols-4 gap-8">
                                    <div className="expanded:col-span-1 bg-surface-container-low p-card rounded-card border border-outline-variant">
                                        <span className="text-label-small font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-4">Hiérarchie</span>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3"><MaterialIcon name="public" size={14} className="text-primary" /><span className="text-label-large font-bold text-on-surface">{selectedCountry}</span></div>
                                            <div className="w-px h-4 bg-outline-variant ml-4"></div>
                                            <div className="flex items-center gap-3"><MaterialIcon name="apartment" size={14} className="text-secondary" /><span className="text-label-large font-bold text-on-surface">{selectedSite}</span></div>
                                            <div className="w-px h-4 bg-outline-variant ml-4"></div>
                                            <div className="flex items-center gap-3"><MaterialIcon name="meeting_room" size={14} className="text-tertiary" /><span className="text-label-large font-bold text-on-surface">{selectedService}</span></div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-outline-variant">
                                            <span className="text-label-small font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-2">Responsable</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-tertiary-container text-tertiary flex items-center justify-center font-bold text-label-medium">
                                                    {stats.managerName[0]}
                                                </div>
                                                <span className="text-label-large font-bold text-on-surface">{stats.managerName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="expanded:col-span-3 grid grid-cols-1 medium:grid-cols-3 gap-6">
                                        <div {...rowActivation(() => navigate('/inventory'))} aria-label="Voir les équipements" className="bg-surface p-card rounded-card focus-visible:ring-focus-ring outline-none focus-visible:ring-2 border border-outline-variant shadow-elevation-1 flex flex-col justify-between group hover:border-secondary/30 cursor-pointer transition-all">
                                            <div className="flex items-center gap-2 text-on-surface-variant font-black text-label-small uppercase tracking-widest mb-2"><MaterialIcon name="desktop_windows" size={16} className="text-secondary" /> {GLOSSARY.EQUIPMENT_PLURAL}</div>
                                            <div className="text-display-small font-black text-on-surface group-hover:text-secondary transition-colors">{stats.equipmentCount}</div>
                                            <div className={cn("text-label-small font-bold mt-2 flex items-center gap-1 uppercase tracking-wider", stats.usesSiteFallback ? "text-on-surface-variant" : stats.isAllFunctional ? "text-tertiary" : "text-secondary")}>
                                                {stats.usesSiteFallback
                                                    ? <span>Au site — service non renseigné</span>
                                                    : stats.isAllFunctional ? <><MaterialIcon name="check" size={12} /> Tous fonctionnels</> : <span>Attention requise</span>}
                                            </div>
                                        </div>
                                        <div {...rowActivation(() => navigate('/users'))} aria-label="Voir les utilisateurs" className="bg-surface p-card rounded-card focus-visible:ring-focus-ring outline-none focus-visible:ring-2 border border-outline-variant shadow-elevation-1 flex flex-col justify-between group hover:border-tertiary/30 cursor-pointer transition-all">
                                            <div className="flex items-center gap-2 text-on-surface-variant font-black text-label-small uppercase tracking-widest mb-2"><MaterialIcon name="group" size={16} className="text-tertiary" /> {GLOSSARY.USER_PLURAL}</div>
                                            <div className="text-display-small font-black text-on-surface group-hover:text-tertiary transition-colors">{stats.userCount}</div>
                                            <div className="text-label-small text-on-surface-variant mt-2 uppercase tracking-wider font-bold">
                                                {stats.usesSiteFallback ? 'Au site — service non renseigné' : 'Actifs rattachés'}
                                            </div>
                                        </div>
                                        <div {...rowActivation(() => navigate('/audit/details'))} aria-label="Voir l'audit" className="bg-surface p-card rounded-card focus-visible:ring-focus-ring outline-none focus-visible:ring-2 border border-outline-variant shadow-elevation-1 flex flex-col justify-between group hover:border-primary/30 cursor-pointer transition-all">
                                            <div className="flex items-center gap-2 text-on-surface-variant font-black text-label-small uppercase tracking-widest mb-2"><MaterialIcon name="info" size={16} className="text-secondary" /> Dernier Audit</div>
                                            <div className="text-title-large font-black text-on-surface group-hover:text-primary transition-colors">—</div>
                                            <div className="text-label-small text-on-surface-variant mt-2 uppercase tracking-wider font-bold italic">Voir les campagnes d'audit</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-outline text-center">
                                    <p className="text-label-large font-bold uppercase tracking-widest text-on-surface-variant">Veuillez sélectionner un service pour voir le résumé</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {isCompact && (
                    <ListActionFab
                        label="Emplacement"
                        sheetTitle="Actions Emplacements"
                        actions={compactActions}
                    />
                )}
            </div>

        </div>
    );
}

export default LocationsPage;
















