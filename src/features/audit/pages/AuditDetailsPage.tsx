import { MEDIA } from '../../../constants/breakpoints';
import React, { useMemo, useState, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PageTabs } from '../../../components/ui/PageTabs';
import FacetChip from '../../../components/ui/FacetChip';
import { DetailHeader } from '../../../components/layout/DetailHeader';
import { useToast } from '../../../context/ToastContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import SideSheet from '../../../components/ui/SideSheet';
import SelectField from '../../../components/ui/SelectField';
import { parseAuditQrPayload } from '../../../lib/auditQr';
import { AuditScanPayload, AuditScanResult, Equipment, ViewType } from '../../../types';
import ListActionFab from '../../../components/ui/ListActionFab';
import { MetricCard } from '../../../components/ui/MetricCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { getDisplayedEquipmentStatus } from '../../../lib/businessRules';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { cn } from '../../../lib/utils';

interface AuditDetailsPageProps {
    onBack: () => void;
    onViewChange?: (view: ViewType) => void;
}

type AuditTab = 'todo' | 'scanned' | 'missing' | 'exceptions';

interface LocalExceptionEntry {
    id: string;
    timestamp: string;
    payload: AuditScanPayload;
    result: AuditScanResult;
    resolved: boolean;
}

interface StoredAuditScope {
    country?: string;
    site?: string;
    service?: string;
}

const AUDIT_SCOPE_PREF_KEY = 'audit_scope_pref';

const readStoredScope = (): StoredAuditScope => {
    try {
        const raw = sessionStorage.getItem(AUDIT_SCOPE_PREF_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as StoredAuditScope;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

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

const formatDateTime = (value?: string): string => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const scanResultPill = (
    label: string,
    tone: 'success' | 'warning' | 'neutral' | 'error' | 'info',
) => (
    <span
        className={`inline-flex items-center rounded-sm px-2 py-1 text-label-small font-semibold ${tone === 'success'
            ? 'bg-tertiary-container text-on-tertiary-container'
            : tone === 'warning'
                ? 'bg-secondary-container text-on-secondary-container'
                : tone === 'error'
                    ? 'bg-error-container text-on-error-container'
                    : tone === 'info'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
            }`}
    >
        {label}
    </span>
);

const AuditDetailsPage: React.FC<AuditDetailsPageProps> = ({ onBack, onViewChange }) => {
    const {
        equipment,
        locationData,
        upsertEquipmentFromAuditScan,
        removeEquipmentFromServiceAfterAudit,
        updateEquipment,
    } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const isMobile = useMediaQuery(MEDIA.belowExpanded);
    const storedScope = useMemo(() => readStoredScope(), []);

    const [activeTab, setActiveTab] = useState<AuditTab>('todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [scanSheetOpen, setScanSheetOpen] = useState(false);
    const [scanRawValue, setScanRawValue] = useState('');
    const [auditStartedAt, setAuditStartedAt] = useState<string | null>(null);
    const [auditFinalized, setAuditFinalized] = useState(false);
    const [baselineIds, setBaselineIds] = useState<string[]>([]);
    const [foundIds, setFoundIds] = useState<string[]>([]);
    const [exceptionEntries, setExceptionEntries] = useState<LocalExceptionEntry[]>([]);

    const [selectedCountry, setSelectedCountry] = useState<string>(storedScope.country || locationData.countries[0] || '');
    const [selectedSite, setSelectedSite] = useState<string>(storedScope.site || '');
    const [selectedService, setSelectedService] = useState<string>(storedScope.service || '');

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

    useEffect(() => {
        try {
            sessionStorage.setItem(
                AUDIT_SCOPE_PREF_KEY,
                JSON.stringify({
                    country: selectedCountry,
                    site: selectedSite,
                    service: selectedService,
                }),
            );
        } catch {
            // Ignore storage failures.
        }
    }, [selectedCountry, selectedService, selectedSite]);

    const scopedEquipment = useMemo(() => {
        if (!selectedCountry || !selectedSite || !selectedService) return [];
        return equipment.filter((item) =>
            item.country === selectedCountry
            && item.site === selectedSite
            && item.department === selectedService,
        );
    }, [equipment, selectedCountry, selectedSite, selectedService]);

    const sessionStarted = Boolean(auditStartedAt);
    const baselineSourceIds = useMemo(
        () => (sessionStarted ? baselineIds : scopedEquipment.map((item) => item.id)),
        [baselineIds, scopedEquipment, sessionStarted],
    );

    const baselineEquipment = useMemo(() => {
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return baselineSourceIds
            .map((id) => byId.get(id))
            .filter((item): item is Equipment => Boolean(item));
    }, [baselineSourceIds, equipment]);

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
    const sessionExceptions = exceptionEntries.length;
    const progressPercentage = sessionTotal > 0 ? Math.round((sessionFound / sessionTotal) * 100) : 0;

    const currentListCount = useMemo(() => {
        if (activeTab === 'todo') return filteredTodo.length;
        if (activeTab === 'scanned') return filteredScanned.length;
        if (activeTab === 'missing') return filteredMissing.length;
        return filteredExceptions.length;
    }, [activeTab, filteredTodo.length, filteredScanned.length, filteredMissing.length, filteredExceptions.length]);

    const scopeIsReady = Boolean(selectedCountry && selectedSite && selectedService);
    const scopeLocked = sessionStarted;

    const resetAuditSession = () => {
        setAuditStartedAt(null);
        setAuditFinalized(false);
        setBaselineIds([]);
        setFoundIds([]);
        setExceptionEntries([]);
        setActiveTab('todo');
        showToast('Session audit réinitialisée. Vous pouvez modifier le périmètre.', 'info');
    };

    const startAuditSession = () => {
        if (sessionStarted) {
            resetAuditSession();
            return;
        }
        if (!scopeIsReady) {
            showToast('Sélectionnez un pays, un site et un service.', 'warning');
            return;
        }
        const ids = scopedEquipment.map((item) => item.id);
        setBaselineIds(ids);
        setFoundIds([]);
        setExceptionEntries([]);
        setAuditFinalized(false);
        setAuditStartedAt(new Date().toISOString());
        setActiveTab('todo');
        showToast(`Audit démarré pour ${selectedService} (${ids.length} machine(s) ciblée(s)).`, 'success');
    };

    const finalizeAuditSession = (missingSnapshot: Equipment[]) => {
        setAuditFinalized(true);
        if (missingSnapshot.length === 0) {
            showToast('Audit terminé: aucune machine manquante.', 'success');
            setActiveTab('scanned');
            return;
        }

        const scope = {
            country: selectedCountry,
            site: selectedSite,
            service: selectedService,
        };

        let flaggedAsMissing = 0;
        missingSnapshot.forEach((item) => {
            if (removeEquipmentFromServiceAfterAudit(item.id, scope)) {
                flaggedAsMissing += 1;
            }
        });

        showToast(`Audit clôturé: ${flaggedAsMissing} machine(s) marquée(s) manquante(s).`, 'warning');
        setActiveTab('missing');
    };

    const handleSubmitScan = () => {
        if (!sessionStarted) {
            showToast("Démarrez d'abord la session d'audit.", 'warning');
            return;
        }

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

        if (result.equipmentId && result.serviceMatches && baselineSourceIds.includes(result.equipmentId)) {
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
        if (!sessionStarted) {
            showToast("Démarrez d'abord une session d'audit.", 'warning');
            return;
        }

        if (auditFinalized) {
            showToast('Cette session est déjà clôturée.', 'info');
            return;
        }

        const missingSnapshot = [...todoItems];
        if (missingSnapshot.length === 0) {
            finalizeAuditSession(missingSnapshot);
            return;
        }

        requestConfirmation({
            title: 'Clôturer la session d’audit ?',
            message: `Cette action va marquer ${missingSnapshot.length} machine(s) comme manquante(s) et les retirer du service ${selectedService} (${selectedSite}, ${selectedCountry}).`,
            variant: 'danger',
            confirmText: 'Clôturer et retirer',
            cancelText: 'Annuler',
            confirmKeyword: 'CLOTURER',
            onConfirm: () => finalizeAuditSession(missingSnapshot),
        });
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

    const renderEquipmentRows = (rows: Equipment[], mode: 'todo' | 'scanned' | 'missing') => {
        if (rows.length === 0) {
            return (
                <div className="p-8 text-center text-on-surface-variant">
                    Aucun équipement dans cet onglet.
                </div>
            );
        }

        return rows.map((item) => {
            const displayedStatus = getDisplayedEquipmentStatus({
                status: item.status,
                assignmentStatus: item.assignmentStatus,
            });

            return (
                <div
                    key={item.id}
                    className="grid grid-cols-1 medium:grid-cols-[minmax(0,_2.2fr)_minmax(0,_1.2fr)_minmax(0,_1.5fr)_140px_190px] gap-2 border-b border-outline-variant/60 px-4 py-3 last:border-b-0 medium:items-center"
                >
                    <div className="min-w-0">
                        <p className="truncate text-title-small text-on-surface">{item.name}</p>
                        <p className="truncate text-body-small text-on-surface-variant">{item.model} • {item.type}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-body-small text-on-surface">{item.assetId}</p>
                        <p className="truncate text-label-small text-on-surface-variant">{item.hostname || 'Hostname non détecté'}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-body-small text-on-surface">{item.user?.name || 'Non assigné'}</p>
                        <p className="truncate text-label-small text-on-surface-variant">{item.user?.email || '-'}</p>
                    </div>
                    <div className="flex justify-start medium:justify-end">
                        {mode === 'todo' && scanResultPill('À scanner', 'neutral')}
                        {mode === 'scanned' && scanResultPill('Retrouvé', 'success')}
                        {mode === 'missing' && scanResultPill('Manquant', 'error')}
                    </div>
                    <div className="flex items-center justify-start medium:justify-end">
                        {mode === 'scanned' && <StatusBadge status={displayedStatus} size="sm" />}
                        {mode === 'todo' && (
                            <span className="text-body-small text-on-surface-variant">En attente du scan</span>
                        )}
                        {mode === 'missing' && (
                            <span className="text-body-small text-on-surface-variant">
                                {auditFinalized ? 'Statut mis à jour' : 'Clôturez pour mise à jour'}
                            </span>
                        )}
                    </div>
                </div>
            );
        });
    };

    /**
     * **Deux onglets, trois puces** — planche 16.2.
     *
     * Trois des quatre onglets d'origine montraient **la même liste à trois moments** :
     * un actif est *à scanner*, puis *retrouvé*, et *manquant* seulement si la campagne
     * se clôture sans lui. Ce ne sont pas trois sujets, ce sont **trois états d'un même
     * sujet** — donc un onglet et trois puces. L'écart, lui, est un autre sujet : un
     * objet que le service n'attendait pas.
     *
     * Les puces filtrent le même parc ; l'onglet change de sujet.
     */
    const sessionTabs = (
        <PageTabs
            activeId={activeTab === 'exceptions' ? 'exceptions' : 'parc'}
            onChange={(tabId) => setActiveTab(tabId === 'exceptions' ? 'exceptions' : 'todo')}
            items={[
                { id: 'parc', label: 'Le parc du service', shortLabel: 'Le parc', badge: sessionTotal },
                { id: 'exceptions', label: 'Écarts', badge: exceptionEntries.length },
            ]}
        />
    );

    /** Les trois moments du même parc. Le badge d'écart est le seul qui demande une décision. */
    const parcChips = (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {([
                ['todo', 'À scanner', todoItems.length],
                ['scanned', 'Retrouvés', scannedItems.length],
                ['missing', 'Manquants', missingItems.length],
            ] as const).map(([id, label, count]) => (
                <FacetChip
                    key={id}
                    label={label}
                    count={count}
                    selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                />
            ))}
        </div>
    );

    const heroHeader = (
            <DetailHeader
                onBack={isMobile ? undefined : onBack}
                className={isMobile ? 'rounded-card border border-outline-variant shadow-elevation-1' : undefined}
                pretitle={(
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-on-primary text-label-medium font-bold px-2 py-1 rounded-md">
                            {auditFinalized ? 'TERMINÉ' : sessionStarted ? 'EN COURS' : 'PRÊT'}
                        </span>
                        <span className="text-on-surface-variant text-title-small font-medium">
                            {selectedCountry} • {selectedSite} • {selectedService}
                        </span>
                    </div>
                )}
                title="Audit de service"
                subtitle={sessionStarted ? `Session démarrée le ${formatDateTime(auditStartedAt || undefined)}` : 'Préparez le périmètre puis lancez la session.'}
                actions={(
                    <div className="flex items-center gap-2">
                        <Button
                            variant={sessionStarted ? 'outlined' : 'filled'}
                            onClick={startAuditSession}
                            disabled={!sessionStarted && !scopeIsReady}
                            icon={<MaterialIcon name={sessionStarted ? 'restart_alt' : 'play_arrow'} size={16} />}
                        >
                            {sessionStarted ? 'Réinitialiser' : "Démarrer"}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleFinalizeAudit}
                            disabled={!sessionStarted || auditFinalized}
                            icon={<MaterialIcon name="task_alt" size={16} />}
                        >
                            Clôturer
                        </Button>
                    </div>
                )}
                tabs={isMobile ? undefined : sessionTabs}
            />
    );

    return (
        <div className="flex flex-col h-full bg-surface-container-low">
            {isMobile ? (
                /* Chrome compact/medium réduit (§9.4) : Retour + onglets session collés sous le
                   TopAppBar — la barre « Vue globale/Détails » disparaît (le Retour l'assume)
                   et le héro défile avec le contenu. */
                <div className="bg-surface border-b border-outline-variant px-page-sm medium:px-page py-1.5 flex items-center gap-1">
                    <Button
                        variant="text"
                        onClick={onBack}
                        className="h-11 w-11 min-w-0 p-0 rounded-full shrink-0 text-on-surface-variant hover:text-on-surface"
                        icon={<MaterialIcon name="arrow_back" size={24} />}
                        aria-label="Retour"
                    />
                    <div className="flex-1 min-w-0">{sessionTabs}</div>
                </div>
            ) : (
                <div className="bg-surface border-b border-outline-variant px-page-sm medium:px-page">
                    <PageTabs
                        activeId="details"
                        onChange={(tabId) => {
                            if (tabId === 'overview') {
                                if (typeof onViewChange === 'function') {
                                    onViewChange('audit');
                                    return;
                                }
                                onBack();
                            }
                        }}
                        items={[
                            { id: 'overview', label: 'Vue globale' },
                            { id: 'details', label: 'Détails campagne', shortLabel: 'Détails' },
                        ]}
                    />
                </div>
            )}

            {!isMobile && heroHeader}

            {/* pb-28 : dégagement bas pour que le FAB ne recouvre pas le contenu */}
            <div className={cn('p-page-sm medium:p-page overflow-y-auto space-y-4', isMobile && 'pb-28')}>
                {isMobile && heroHeader}
                <div className="grid grid-cols-1 medium:grid-cols-3 gap-3">
                    <SelectField
                        label="Pays"
                        name="auditCountry"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        options={countryOptions}
                        placeholder="Choisir pays"
                        disabled={scopeLocked}
                    />
                    <SelectField
                        label="Site"
                        name="auditSite"
                        value={selectedSite}
                        onChange={(e) => setSelectedSite(e.target.value)}
                        options={siteOptions}
                        placeholder="Choisir site"
                        disabled={scopeLocked}
                    />
                    <SelectField
                        label="Service"
                        name="auditService"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        options={serviceOptions}
                        placeholder="Choisir service"
                        disabled={scopeLocked}
                    />
                </div>
                {scopeLocked && (
                    <p className="-mt-1 text-body-small text-on-surface-variant">
                        Le périmètre est verrouillé pendant la session active. Utilisez “Réinitialiser” pour changer de service.
                    </p>
                )}

                <div className="rounded-card border border-outline-variant bg-surface px-4 py-3 text-body-small text-on-surface-variant">
                    Source inventaire: <span className="font-semibold text-on-surface">{scopedEquipment.length}</span> équipement(s) rattaché(s) au service {selectedService || '—'}.
                    {!sessionStarted && (
                        <span className="ml-1">La liste "À scanner" ci-dessous est directement générée depuis cet inventaire.</span>
                    )}
                </div>

                {/* Rangée de stats X9 : tuiles MetricCard compactes (§9.4) */}
                <div className="grid grid-cols-2 large:grid-cols-5 gap-3">
                    <MetricCard compact title="Attendus" value={sessionTotal} />
                    <MetricCard compact title="Retrouvés" value={sessionFound} />
                    {/* « Manquants » n'est pas un qualifiant : il n'existe qu'**après la
                        clôture**, et un chiffre qui vaudra zéro jusqu'à la dernière seconde
                        n'en est pas un (16.2). Il reste, en puce, dans le parc du service. */}
                    <MetricCard compact title="Écarts" value={sessionExceptions} />
                    <MetricCard compact title="Couverture" value={`${progressPercentage}%`} />
                </div>

                <div className="rounded-card border border-outline-variant bg-surface px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-label-small uppercase tracking-wider text-on-surface-variant">Progression session</span>
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

                {activeTab !== 'exceptions' && parcChips}

                {activeTab !== 'exceptions' && (
                    <section className="overflow-hidden rounded-card border border-outline-variant bg-surface shadow-elevation-1">
                        <div className="hidden medium:grid grid-cols-[minmax(0,_2.2fr)_minmax(0,_1.2fr)_minmax(0,_1.5fr)_140px_190px] gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3 text-label-small uppercase tracking-wide text-on-surface-variant">
                            <span>Équipement</span>
                            <span>Asset / Host</span>
                            <span>Utilisateur</span>
                            <span className="text-right">Résultat</span>
                            <span className="text-right">Statut / Action</span>
                        </div>
                        {activeTab === 'todo' && renderEquipmentRows(filteredTodo, 'todo')}
                        {activeTab === 'scanned' && renderEquipmentRows(filteredScanned, 'scanned')}
                        {activeTab === 'missing' && renderEquipmentRows(filteredMissing, 'missing')}
                    </section>
                )}

                {activeTab === 'exceptions' && (
                    <section className="overflow-hidden rounded-card border border-outline-variant bg-surface shadow-elevation-1">
                        <div className="hidden medium:grid grid-cols-[minmax(0,_2fr)_minmax(0,_1.4fr)_170px_170px_200px] gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3 text-label-small uppercase tracking-wide text-on-surface-variant">
                            <span>Machine détectée</span>
                            <span>Référence</span>
                            <span className="text-right">Résultat</span>
                            <span className="text-right">Horodatage</span>
                            <span className="text-right">Action</span>
                        </div>

                        {filteredExceptions.length === 0 ? (
                            <div className="p-8 text-center text-on-surface-variant">
                                Aucun écart détecté.
                            </div>
                        ) : (
                            filteredExceptions.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="grid grid-cols-1 medium:grid-cols-[minmax(0,_2fr)_minmax(0,_1.4fr)_170px_170px_200px] gap-2 border-b border-outline-variant/60 px-4 py-3 last:border-b-0 medium:items-center"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-title-small text-on-surface">
                                            {entry.result.equipmentName || entry.payload.machineName || entry.payload.hostname || 'Machine inconnue'}
                                        </p>
                                        <p className="truncate text-body-small text-on-surface-variant">
                                            {entry.payload.hostname || 'Hostname non fourni'}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-body-small text-on-surface">
                                            {entry.payload.assetId || entry.equipment?.assetId || 'Asset inconnu'}
                                        </p>
                                        <p className="truncate text-label-small text-on-surface-variant">
                                            {entry.payload.site || selectedSite} • {entry.payload.service || selectedService}
                                        </p>
                                    </div>
                                    <div className="flex justify-start medium:justify-end">
                                        {entry.result.resolution === 'created' && scanResultPill('Nouveau', 'info')}
                                        {entry.result.resolution === 'found_out_of_service' && scanResultPill('Hors service', 'warning')}
                                        {entry.result.resolution === 'found_in_service' && scanResultPill('Retrouvé', 'success')}
                                    </div>
                                    <div className="text-body-small text-on-surface-variant text-left medium:text-right">
                                        {formatDateTime(entry.timestamp)}
                                    </div>
                                    <div className="flex items-center justify-start gap-2 medium:justify-end">
                                        {entry.resolved && scanResultPill('Traité', 'success')}
                                        {entry.result.resolution === 'found_out_of_service' && !entry.resolved && (
                                            <Button
                                                variant="outlined"
                                                size="sm"
                                                onClick={() => handleAlignService(entry.id, entry.equipment)}
                                                disabled={!entry.equipment}
                                            >
                                                Réaffecter
                                            </Button>
                                        )}
                                        {entry.result.resolution === 'created' && !entry.resolved && (
                                            <span className="text-body-small text-on-surface-variant">Ajouté au stock</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                )}
            </div>

            {isMobile && (
                <ListActionFab
                    label="Audit"
                    sheetTitle="Actions Audit"
                    actions={[
                        {
                            id: 'scan-now',
                            label: 'Scanner',
                            icon: 'qr_code_scanner',
                            variant: 'filled' as const,
                            onSelect: () => setScanSheetOpen(true),
                            disabled: !sessionStarted,
                        },
                        {
                            id: 'start-session',
                            label: sessionStarted ? 'Réinitialiser session' : 'Démarrer session',
                            icon: sessionStarted ? 'restart_alt' : 'play_arrow',
                            variant: 'outlined' as const,
                            onSelect: startAuditSession,
                            disabled: !sessionStarted && !scopeIsReady,
                        },
                        {
                            id: 'finalize-session',
                            label: 'Clôturer audit',
                            icon: 'task_alt',
                            variant: 'outlined' as const,
                            onSelect: handleFinalizeAudit,
                            disabled: !sessionStarted || auditFinalized,
                        },
                    ]}
                />
            )}

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
