import React, { useMemo, useState, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PageTabs } from '../../../components/ui/PageTabs';
import { DetailHeader } from '../../../components/layout/DetailHeader';
import { useToast } from '../../../context/ToastContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import SideSheet from '../../../components/ui/SideSheet';
import SelectField from '../../../components/ui/SelectField';
import { parseAuditQrPayload } from '../../../lib/auditQr';
import { AuditScanPayload, AuditScanResult, Equipment } from '../../../types';

interface AuditDetailsPageProps {
    onBack: () => void;
}

type AuditTab = 'todo' | 'scanned' | 'missing' | 'exceptions';

interface LocalExceptionEntry {
    id: string;
    timestamp: string;
    payload: AuditScanPayload;
    result: AuditScanResult;
    resolved: boolean;
}

const matchesSearch = (item: Equipment, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
        item.name.toLowerCase().includes(q)
        || item.assetId.toLowerCase().includes(q)
        || (item.hostname || '').toLowerCase().includes(q)
        || (item.serialNumber || '').toLowerCase().includes(q)
        || (item.user?.name || '').toLowerCase().includes(q)
    );
};

const statusPill = (
    label: string,
    className: string,
) => (
    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-label-small font-semibold ${className}`}>
        {label}
    </span>
);

const AuditDetailsPage: React.FC<AuditDetailsPageProps> = ({ onBack }) => {
    const {
        equipment,
        locationData,
        upsertEquipmentFromAuditScan,
        removeEquipmentFromServiceAfterAudit,
        updateEquipment,
    } = useData();
    const { showToast } = useToast();
    const isMobile = useMediaQuery('(max-width: 839px)');

    const [activeTab, setActiveTab] = useState<AuditTab>('todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [scanSheetOpen, setScanSheetOpen] = useState(false);
    const [scanRawValue, setScanRawValue] = useState('');
    const [auditStartedAt, setAuditStartedAt] = useState<string | null>(null);
    const [auditFinalized, setAuditFinalized] = useState(false);
    const [baselineIds, setBaselineIds] = useState<string[]>([]);
    const [foundIds, setFoundIds] = useState<string[]>([]);
    const [exceptionEntries, setExceptionEntries] = useState<LocalExceptionEntry[]>([]);

    const [selectedCountry, setSelectedCountry] = useState<string>(locationData.countries[0] || '');
    const [selectedSite, setSelectedSite] = useState<string>('');
    const [selectedService, setSelectedService] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 250);

    const countryOptions = useMemo(
        () => locationData.countries.map((country) => ({ value: country, label: country })),
        [locationData.countries],
    );
    const siteOptions = useMemo(
        () => (locationData.sites[selectedCountry] || []).map((site) => ({ value: site, label: site })),
        [locationData.sites, selectedCountry],
    );
    const serviceOptions = useMemo(
        () => (locationData.services[selectedSite] || []).map((service) => ({ value: service, label: service })),
        [locationData.services, selectedSite],
    );

    useEffect(() => {
        if (!selectedCountry && locationData.countries.length > 0) {
            setSelectedCountry(locationData.countries[0]);
        }
    }, [locationData.countries, selectedCountry]);

    useEffect(() => {
        const sites = locationData.sites[selectedCountry] || [];
        if (sites.length === 0) {
            setSelectedSite('');
            return;
        }
        if (!sites.includes(selectedSite)) {
            setSelectedSite(sites[0]);
        }
    }, [locationData.sites, selectedCountry, selectedSite]);

    useEffect(() => {
        const services = locationData.services[selectedSite] || [];
        if (services.length === 0) {
            setSelectedService('');
            return;
        }
        if (!services.includes(selectedService)) {
            setSelectedService(services[0]);
        }
    }, [locationData.services, selectedSite, selectedService]);

    const scopedEquipment = useMemo(() => {
        if (!selectedCountry || !selectedSite || !selectedService) return [];
        return equipment.filter((item) =>
            item.country === selectedCountry
            && item.site === selectedSite
            && item.department === selectedService,
        );
    }, [equipment, selectedCountry, selectedSite, selectedService]);

    const baselineEquipment = useMemo(() => {
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return baselineIds
            .map((id) => byId.get(id))
            .filter((item): item is Equipment => Boolean(item));
    }, [baselineIds, equipment]);

    const foundSet = useMemo(() => new Set(foundIds), [foundIds]);
    const scannedItems = useMemo(
        () => baselineEquipment.filter((item) => foundSet.has(item.id)),
        [baselineEquipment, foundSet],
    );
    const todoItems = useMemo(
        () => baselineEquipment.filter((item) => !foundSet.has(item.id)),
        [baselineEquipment, foundSet],
    );
    const missingItems = useMemo(
        () => (auditFinalized ? todoItems : []),
        [auditFinalized, todoItems],
    );

    const exceptionsDisplay = useMemo(() => {
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return exceptionEntries.map((entry) => ({
            ...entry,
            equipment: entry.result.equipmentId ? byId.get(entry.result.equipmentId) : undefined,
        }));
    }, [exceptionEntries, equipment]);

    const filteredTodo = useMemo(
        () => todoItems.filter((item) => matchesSearch(item, debouncedSearch)),
        [todoItems, debouncedSearch],
    );
    const filteredScanned = useMemo(
        () => scannedItems.filter((item) => matchesSearch(item, debouncedSearch)),
        [scannedItems, debouncedSearch],
    );
    const filteredMissing = useMemo(
        () => missingItems.filter((item) => matchesSearch(item, debouncedSearch)),
        [missingItems, debouncedSearch],
    );
    const filteredExceptions = useMemo(() => {
        if (!debouncedSearch) return exceptionsDisplay;
        const q = debouncedSearch.toLowerCase();
        return exceptionsDisplay.filter((entry) => {
            const name = entry.result.equipmentName || entry.payload.machineName || entry.payload.hostname || '';
            const asset = entry.payload.assetId || entry.equipment?.assetId || '';
            return name.toLowerCase().includes(q) || asset.toLowerCase().includes(q);
        });
    }, [exceptionsDisplay, debouncedSearch]);

    const sessionTotal = baselineEquipment.length;
    const sessionFound = scannedItems.length;
    const progressPercentage = sessionTotal > 0 ? Math.round((sessionFound / sessionTotal) * 100) : 0;

    const currentListCount = useMemo(() => {
        if (activeTab === 'todo') return filteredTodo.length;
        if (activeTab === 'scanned') return filteredScanned.length;
        if (activeTab === 'missing') return filteredMissing.length;
        return filteredExceptions.length;
    }, [activeTab, filteredTodo.length, filteredScanned.length, filteredMissing.length, filteredExceptions.length]);

    const startAuditSession = () => {
        const ids = scopedEquipment.map((item) => item.id);
        setBaselineIds(ids);
        setFoundIds([]);
        setExceptionEntries([]);
        setAuditFinalized(false);
        setAuditStartedAt(new Date().toISOString());
        setActiveTab('todo');
        showToast(`Audit démarré pour ${selectedService} (${ids.length} machine(s) ciblée(s)).`, 'success');
    };

    const handleSubmitScan = () => {
        const parsed = parseAuditQrPayload(scanRawValue);
        if (!parsed.ok || !parsed.payload) {
            showToast(parsed.error || 'QR invalide.', 'error');
            return;
        }

        if (!selectedCountry || !selectedSite || !selectedService) {
            showToast('Sélectionnez d’abord un pays, un site et un service.', 'warning');
            return;
        }

        const scope = {
            country: selectedCountry,
            site: selectedSite,
            service: selectedService,
        };

        const result = upsertEquipmentFromAuditScan(parsed.payload, scope);
        if (!result.ok) {
            showToast(result.message, 'error');
            return;
        }

        if (result.equipmentId && result.serviceMatches && baselineIds.includes(result.equipmentId)) {
            setFoundIds((prev) => (prev.includes(result.equipmentId!) ? prev : [...prev, result.equipmentId!]));
        }

        if (result.resolution !== 'found_in_service') {
            const entry: LocalExceptionEntry = {
                id: `audit_scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                timestamp: new Date().toISOString(),
                payload: parsed.payload,
                result,
                resolved: false,
            };
            setExceptionEntries((prev) => [entry, ...prev]);
            setActiveTab('exceptions');
        } else {
            setActiveTab('scanned');
        }

        if (result.resolution === 'found_out_of_service') {
            showToast(result.message, 'warning');
        } else {
            showToast(result.message, 'success');
        }

        setScanRawValue('');
        setScanSheetOpen(false);
    };

    const handleFinalizeAudit = () => {
        setAuditFinalized(true);
        if (todoItems.length === 0) {
            showToast('Audit terminé: aucune machine manquante.', 'success');
            setActiveTab('scanned');
            return;
        }

        showToast(
            `Audit terminé: ${todoItems.length} machine(s) manquante(s) à traiter par l'IT.`,
            'warning',
        );
        setActiveTab('missing');
    };

    const handleRemoveFromService = (item: Equipment) => {
        const scope = {
            country: selectedCountry,
            site: selectedSite,
            service: selectedService,
        };
        const ok = removeEquipmentFromServiceAfterAudit(item.id, scope);
        if (!ok) {
            showToast("Mise à jour impossible pour cet équipement.", 'error');
            return;
        }

        setBaselineIds((prev) => prev.filter((id) => id !== item.id));
        setFoundIds((prev) => prev.filter((id) => id !== item.id));
        showToast(`${item.name} retiré du service ${selectedService}.`, 'success');
    };

    const handleAlignService = (entryId: string, item: Equipment | undefined) => {
        if (!item) return;

        updateEquipment(
            item.id,
            {
                country: selectedCountry,
                site: selectedSite,
                department: selectedService,
            },
            {
                source: 'audit_scan_alignment',
                scopeCountry: selectedCountry,
                scopeSite: selectedSite,
                scopeService: selectedService,
            },
        );

        setExceptionEntries((prev) =>
            prev.map((entry) => (entry.id === entryId ? { ...entry, resolved: true } : entry)),
        );
        showToast(`${item.name} aligné sur ${selectedService}.`, 'success');
    };

    const scopeIsReady = Boolean(selectedCountry && selectedSite && selectedService);
    const sessionStarted = Boolean(auditStartedAt);

    return (
        <div className="flex flex-col h-full bg-surface-container-low">
            <DetailHeader
                onBack={onBack}
                pretitle={(
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded">
                            {auditFinalized ? 'TERMINÉ' : sessionStarted ? 'EN COURS' : 'PRÊT'}
                        </span>
                        <span className="text-on-surface-variant text-sm font-medium">
                            {selectedCountry} • {selectedSite} • {selectedService}
                        </span>
                    </div>
                )}
                title="Audit ciblé par service"
                subtitle={sessionStarted ? `Session démarrée le ${new Date(auditStartedAt!).toLocaleString('fr-FR')}` : 'Préparez le périmètre puis lancez la session.'}
                actions={(
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="qr_code_scanner" size={16} />}
                                onClick={() => setScanSheetOpen(true)}
                                disabled={!sessionStarted}
                            >
                                Scanner
                            </Button>
                        )}
                        <Button
                            variant={sessionStarted ? 'outlined' : 'filled'}
                            onClick={startAuditSession}
                            disabled={!scopeIsReady}
                            icon={<MaterialIcon name="play_arrow" size={16} />}
                        >
                            {sessionStarted ? 'Réinitialiser la session' : "Démarrer l'audit"}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleFinalizeAudit}
                            disabled={!sessionStarted}
                            icon={<MaterialIcon name="task_alt" size={16} />}
                        >
                            Clôturer
                        </Button>
                    </div>
                )}
                tabs={(
                    <PageTabs
                        activeId={activeTab}
                        onChange={(tabId) => setActiveTab(tabId as AuditTab)}
                        items={[
                            { id: 'todo', label: 'À scanner', badge: todoItems.length },
                            { id: 'scanned', label: 'Retrouvés', badge: scannedItems.length },
                            { id: 'missing', label: 'Manquants', badge: missingItems.length },
                            { id: 'exceptions', label: 'Écarts', badge: exceptionEntries.length },
                        ]}
                    />
                )}
            />

            <div className="p-page-sm medium:p-page overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                    <SelectField
                        label="Pays"
                        name="auditCountry"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        options={countryOptions}
                        placeholder="Choisir pays"
                    />
                    <SelectField
                        label="Site"
                        name="auditSite"
                        value={selectedSite}
                        onChange={(e) => setSelectedSite(e.target.value)}
                        options={siteOptions}
                        placeholder="Choisir site"
                    />
                    <SelectField
                        label="Service"
                        name="auditService"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        options={serviceOptions}
                        placeholder="Choisir service"
                    />
                </div>

                <div className="rounded-card border border-outline-variant bg-surface px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-label-small uppercase tracking-wider text-on-surface-variant">Progression audit</span>
                        <span className="text-title-small font-semibold text-on-surface">
                            {sessionFound}/{sessionTotal} • {progressPercentage}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                    </div>
                </div>

                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    resultCount={currentListCount}
                    placeholder="Rechercher par nom, asset ID, hostname..."
                />

                {!isMobile && (
                    <div className="text-body-small text-on-surface-variant rounded-card border border-outline-variant bg-surface px-4 py-3">
                        Le scan QR est réservé à la version mobile. Utilisez un téléphone pour scanner les QR générés par le script.
                    </div>
                )}

                {activeTab === 'todo' && filteredTodo.map((item) => (
                    <div key={item.id} className="bg-surface p-card-compact rounded-card border border-outline-variant flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-title-small text-on-surface truncate">{item.name}</p>
                            <p className="text-body-small text-on-surface-variant truncate">
                                {item.assetId} • {item.model}
                            </p>
                        </div>
                        {statusPill('À scanner', 'bg-surface-container-high text-on-surface-variant')}
                    </div>
                ))}

                {activeTab === 'scanned' && filteredScanned.map((item) => (
                    <div key={item.id} className="bg-surface p-card-compact rounded-card border border-outline-variant flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-title-small text-on-surface truncate">{item.name}</p>
                            <p className="text-body-small text-on-surface-variant truncate">
                                {item.assetId} • {item.user?.name || 'Utilisateur non détecté'}
                            </p>
                        </div>
                        {statusPill('Retrouvé', 'bg-tertiary-container text-tertiary')}
                    </div>
                ))}

                {activeTab === 'missing' && filteredMissing.map((item) => (
                    <div key={item.id} className="bg-surface p-card-compact rounded-card border border-error/30 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-title-small text-on-surface truncate">{item.name}</p>
                            <p className="text-body-small text-on-surface-variant truncate">
                                {item.assetId} • {item.model}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {statusPill('Manquant', 'bg-error-container text-error')}
                            {auditFinalized && (
                                <Button
                                    variant="outlined"
                                    size="sm"
                                    onClick={() => handleRemoveFromService(item)}
                                >
                                    Retirer du service
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {activeTab === 'exceptions' && filteredExceptions.map((entry) => (
                    <div key={entry.id} className="bg-surface p-card-compact rounded-card border border-outline-variant flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-title-small text-on-surface truncate">
                                {entry.result.equipmentName || entry.payload.machineName || entry.payload.hostname || 'Machine inconnue'}
                            </p>
                            <p className="text-body-small text-on-surface-variant truncate">
                                {entry.payload.assetId || entry.equipment?.assetId || 'Asset inconnu'} • {new Date(entry.timestamp).toLocaleString('fr-FR')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {entry.result.resolution === 'created' && statusPill('Nouveau', 'bg-primary-container text-primary')}
                            {entry.result.resolution === 'found_out_of_service' && statusPill('Hors service ciblé', 'bg-secondary-container text-on-secondary-container')}
                            {entry.resolved && statusPill('Traité', 'bg-tertiary-container text-tertiary')}
                            {entry.result.resolution === 'found_out_of_service' && !entry.resolved && (
                                <Button
                                    variant="outlined"
                                    size="sm"
                                    onClick={() => handleAlignService(entry.id, entry.equipment)}
                                    disabled={!entry.equipment}
                                >
                                    Affecter à ce service
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {currentListCount === 0 && (
                    <div className="text-center py-10 text-on-surface-variant">
                        Aucun élément à afficher pour cet onglet.
                    </div>
                )}
            </div>

            <SideSheet
                open={scanSheetOpen}
                onClose={() => setScanSheetOpen(false)}
                title="Scanner un QR machine"
                description="Collez le contenu du QR généré par le script (JSON ou format clé=valeur)."
            >
                <div className="space-y-4">
                    <textarea
                        value={scanRawValue}
                        onChange={(e) => setScanRawValue(e.target.value)}
                        className="w-full min-h-40 rounded-card border border-outline-variant bg-surface px-3 py-2 text-body-medium text-on-surface outline-none focus:border-primary"
                        placeholder={`Exemple JSON:\n{\n  "assetId": "ASSET-10001",\n  "hostname": "PC-HQ-01",\n  "userEmail": "user@company.com"\n}`}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="text" onClick={() => setScanSheetOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={handleSubmitScan}>
                            Traiter le scan
                        </Button>
                    </div>
                </div>
            </SideSheet>
        </div>
    );
};

export default AuditDetailsPage;
