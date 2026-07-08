
import { MEDIA } from '../../../constants/breakpoints';
import React, { useState, useMemo, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { PageHeader, useHasMobileTopBar } from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import Badge from '../../../components/ui/Badge';
import Toggle from '../../../components/ui/Toggle';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { calculateLinearDepreciation, formatCurrency } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { PageContainer } from '../../../components/layout/PageContainer';
import type { AgentCheckInPayload } from '../../../types';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { APP_CONFIG } from '../../../config';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { parseAgentBatchContent } from '../../../lib/agentCheckin';
import { checkAgentApiHealth, postAgentCheckIn } from '../../../services/agentCollectionService';

interface SettingsPageProps {
    onLogout: () => void;
}

type SettingsSection = 'general' | 'finance' | 'collection' | 'account' | 'help';

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
    const { showToast } = useToast();
    const {
        settings,
        updateSettings,
        detectedDevices,
        ingestAgentCheckIn,
        promoteDetectedDeviceToInventory,
        markDetectedDeviceAsIgnored,
    } = useData();
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const isCompactOrMedium = useMediaQuery(MEDIA.belowExpanded);
    const hasMobileTopBar = useHasMobileTopBar();

    // Local state for finance form
    const [financeForm, setFinanceForm] = useState(settings);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
    const [isBatchImporting, setIsBatchImporting] = useState(false);
    const [batchImportSummary, setBatchImportSummary] = useState<{
        files: number;
        accepted: number;
        rejected: number;
        apiForwarded: number;
        apiFailed: number;
    } | null>(null);

    useEffect(() => {
        setFinanceForm(settings);
    }, [settings]);

    const handleFinanceChange = (field: string, value: string | boolean | number) => {
        setFinanceForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateSettings(financeForm);
        const scopeLabel = activeSection === 'collection' ? 'Collecte automatique' : 'Paramètres financiers';
        showToast(`${scopeLabel} sauvegardés.`, 'success');
        setSaveFeedback(`${scopeLabel} enregistrés`);
    };

    useEffect(() => {
        if (!saveFeedback) return;
        const timeoutId = window.setTimeout(() => setSaveFeedback(null), 2500);
        return () => window.clearTimeout(timeoutId);
    }, [saveFeedback]);

    // --- SIMULATION ---
    // Aperçu calculé avec le vrai moteur de valorisation (calculateLinearDepreciation),
    // qui applique la formule linéaire quelle que soit la méthode configurée.
    const simulation = useMemo(() => {
        const price = 1000000;
        const years = Number(financeForm.defaultDepreciationYears) || 1;
        const salvagePercent = Number(financeForm.salvageValuePercent) || 0;

        const { monthlyDepreciation, salvageValue } = calculateLinearDepreciation(
            price,
            new Date(),
            years,
            salvagePercent,
        );

        return { monthly: monthlyDepreciation, salvageValue };
    }, [financeForm]);

    const detectedStats = useMemo(() => {
        const total = detectedDevices.length;
        const pending = detectedDevices.filter((item) => item.status === 'pending_review').length;
        const linked = detectedDevices.filter((item) => item.status === 'linked_existing').length;
        const imported = detectedDevices.filter((item) => item.status === 'imported').length;
        const ambiguous = detectedDevices.filter((item) => item.status === 'ambiguous_match').length;
        return { total, pending, linked, imported, ambiguous };
    }, [detectedDevices]);

    const recentDetectedDevices = useMemo(
        () => [...detectedDevices]
            .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
            .slice(0, 12),
        [detectedDevices],
    );

    const shouldForwardToApi = useMemo(
        () => financeForm.autoCollectionForwardToApi && Boolean(financeForm.autoCollectionApiBaseUrl.trim()),
        [financeForm.autoCollectionApiBaseUrl, financeForm.autoCollectionForwardToApi],
    );

    const formatCheckinDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const buildDetectedStatusBadge = (status: string) => {
        if (status === 'pending_review') return <Badge variant="warning">À valider</Badge>;
        if (status === 'linked_existing') return <Badge variant="info">Équipement lié</Badge>;
        if (status === 'ambiguous_match') return <Badge variant="danger">Ambigu</Badge>;
        if (status === 'imported') return <Badge variant="success">Importé</Badge>;
        return <Badge variant="neutral">Ignoré</Badge>;
    };

    const ingestWithOptionalApiForwarding = async (rawPayload: AgentCheckInPayload) => {
        const payload: AgentCheckInPayload = {
            ...rawPayload,
            apiKey: rawPayload.apiKey || financeForm.autoCollectionAgentApiKey,
        };

        let apiOk = false;
        let apiMessage = '';
        if (shouldForwardToApi) {
            const apiResult = await postAgentCheckIn(
                financeForm.autoCollectionApiBaseUrl,
                payload,
                financeForm.autoCollectionAgentApiKey,
            );
            apiOk = apiResult.ok;
            apiMessage = apiResult.message || '';
        }

        const localResult = ingestAgentCheckIn(payload);
        return {
            localResult,
            apiForwarded: shouldForwardToApi,
            apiOk,
            apiMessage,
        };
    };

    const handleSimulateAgentCheckIn = async () => {
        const token = Date.now().toString().slice(-4);
        const { localResult, apiForwarded, apiOk, apiMessage } = await ingestWithOptionalApiForwarding({
            source: 'agent',
            machineName: `PC-IT-${token}`,
            hostname: `pc-it-${token}`,
            assetId: `ASSET-AUTO-${token}`,
            serialNumber: `SN-AUTO-${token}`,
            os: 'Windows 11 Pro 23H2',
            ram: '16 GB',
            storage: '512 GB SSD',
            cpu: 'Intel Core i7',
            userName: 'Alice SuperAdmin',
            userEmail: 'alice.admin@tracker.app',
            country: 'France',
            site: 'Bureau Paris',
            service: 'IT',
            ipAddress: '10.10.0.25',
            domain: 'tracker.local',
            macAddress: '00:1A:2B:3C:4D:5E',
            scannedAt: new Date().toISOString(),
            agents: {
                sentinelOne: true,
                matrix42: true,
                manageEngine: true,
            },
        });

        if (!localResult.ok) {
            showToast(localResult.message, 'error');
            return;
        }

        if (apiForwarded && !apiOk) {
            showToast(`Check-in local OK, mais API indisponible (${apiMessage || 'erreur inconnue'}).`, 'warning');
            return;
        }

        if (apiForwarded && apiOk) {
            showToast('Check-in envoyé API + appliqué localement.', 'success');
            return;
        }

        showToast(localResult.message, 'success');
    };

    const handleBatchCheckInImport = async (files: File[]) => {
        if (!files.length) return;

        setIsBatchImporting(true);
        try {
            let accepted = 0;
            let rejected = 0;
            let apiForwarded = 0;
            let apiFailed = 0;

            for (const file of files) {
                const raw = await file.text();
                const parsedBatch = parseAgentBatchContent(raw);

                for (const payload of parsedBatch.payloads) {
                    const result = await ingestWithOptionalApiForwarding(payload);
                    if (result.localResult.ok) accepted += 1;
                    else rejected += 1;
                    if (result.apiForwarded) {
                        apiForwarded += 1;
                        if (!result.apiOk) apiFailed += 1;
                    }
                }

                rejected += parsedBatch.errors.length;
            }

            setBatchImportSummary({
                files: files.length,
                accepted,
                rejected,
                apiForwarded,
                apiFailed,
            });

            if (accepted > 0 && rejected === 0 && apiFailed === 0) {
                showToast(`Import check-in terminé: ${accepted} machine(s) traitée(s).`, 'success');
            } else if (accepted > 0 && apiForwarded > 0 && apiFailed > 0) {
                showToast(
                    `Import partiel: ${accepted} locale(s), ${rejected} rejetée(s), API en échec sur ${apiFailed}/${apiForwarded}.`,
                    'warning',
                );
            } else if (accepted > 0) {
                showToast(`Import partiel: ${accepted} traitée(s), ${rejected} rejetée(s).`, 'warning');
            } else {
                showToast("Aucune entrée valide trouvée dans les fichiers d'import.", 'error');
            }
        } catch {
            showToast("Impossible de lire les fichiers d'import check-in.", 'error');
        } finally {
            setIsBatchImporting(false);
        }
    };

    const handlePromoteDetected = (detectedId: string) => {
        const result = promoteDetectedDeviceToInventory(detectedId);
        showToast(result.message, result.ok ? 'success' : 'error');
    };

    const handleIgnoreDetected = (detectedId: string) => {
        const ok = markDetectedDeviceAsIgnored(detectedId);
        showToast(ok ? 'Machine ignorée.' : 'Action refusée.', ok ? 'success' : 'warning');
    };

    const handleTestApiConnection = async () => {
        if (!financeForm.autoCollectionApiBaseUrl.trim()) {
            showToast("Veuillez renseigner l'URL API backend.", 'warning');
            return;
        }

        const health = await checkAgentApiHealth(financeForm.autoCollectionApiBaseUrl);
        if (!health.ok) {
            showToast('Connexion API impossible. Vérifiez URL, port et backend.', 'error');
            return;
        }

        showToast(`API joignable (${health.service || 'service check-in'}).`, 'success');
    };

    // --- SECTIONS ---
    const sections: Array<{ id: SettingsSection; label: string; icon: string }> = [
        { id: 'general', label: isCompactOrMedium ? 'Affichage' : 'Affichage', icon: 'palette' },
        { id: 'finance', label: isCompactOrMedium ? 'Finances' : 'Finances & Paramètres', icon: 'account_balance' },
        { id: 'collection', label: isCompactOrMedium ? 'Collecte auto' : 'Collecte automatique', icon: 'developer_board' },
        { id: 'account', label: isCompactOrMedium ? 'Compte' : 'Compte & Sécurité', icon: 'manage_accounts' },
        { id: 'help', label: 'Aide', icon: 'help' },
    ];

    const canSaveSettings = activeSection === 'finance' || activeSection === 'collection';
    const saveButtonLabel = activeSection === 'collection' ? 'Enregistrer collecte' : 'Enregistrer finances';
    const passiveSectionHint = activeSection === 'general'
        ? 'Apparence appliquée automatiquement'
        : activeSection === 'account'
            ? 'Gestion du compte sans sauvegarde globale'
            : activeSection === 'help'
                ? 'Section informative'
                : null;

    return (
        <PageContainer className="flex flex-col h-full !p-0 gap-0 max-w-full">
            {/* WRAPPED HEADER TO MATCH STANDARD SPACING */}
            <div className="px-page-sm medium:px-page pt-page-sm medium:pt-page sticky top-0 z-20 bg-surface/95 backdrop-blur-sm">
                <PageHeader
                    sticky={false}
                    title="Paramètres"
                    subtitle="Gérez vos préférences et la configuration système."
                    breadcrumb="PARAMÈTRES"
                    actions={
                        // Sur compact portrait, seules les sections sauvegardables ont une action réelle :
                        // ne rien passer sinon (le hint est masqué sous medium — éviter la bande vide, X11).
                        canSaveSettings || !hasMobileTopBar ? (
                            <div className="flex gap-2 flex-wrap justify-end">
                                {canSaveSettings ? (
                                    <Button
                                        variant="filled"
                                        icon={<MaterialIcon name="save" size={18} />}
                                        onClick={handleSave}
                                        className="whitespace-nowrap"
                                        title="Enregistrer la configuration de cette section."
                                    >
                                        {saveButtonLabel}
                                    </Button>
                                ) : (
                                    <span className="hidden medium:inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-3 py-2 text-label-small text-on-surface-variant whitespace-nowrap">
                                        <MaterialIcon name="check_circle" size={14} />
                                        {passiveSectionHint}
                                    </span>
                                )}
                                {saveFeedback && (
                                    <span className="hidden medium:inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-3 py-2 text-label-small text-on-tertiary-container whitespace-nowrap">
                                        <MaterialIcon name="done" size={14} />
                                        {saveFeedback}
                                    </span>
                                )}
                            </div>
                        ) : undefined
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <PageContainer className="h-full flex flex-col expanded:flex-row gap-0 expanded:gap-8 !p-0 md:!px-page max-w-[1600px] mx-auto">

                    {/* SIDEBAR NAVIGATION */}
                    <aside className="w-full expanded:w-64 shrink-0 bg-surface expanded:bg-transparent border-b expanded:border-b-0 border-outline-variant p-4 expanded:py-8 overflow-x-auto expanded:overflow-visible">
                        <nav className={cn('flex expanded:flex-col gap-2', isCompactOrMedium && 'min-w-max')}>
                            {sections.map(section => (
                                <Button
                                    key={section.id}
                                    type="button"
                                    variant={activeSection === section.id ? 'tonal' : 'text'}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        isCompactOrMedium
                                            ? "h-11 !w-auto shrink-0 !rounded-full !px-4 !py-2 !text-label-medium !font-medium whitespace-nowrap !justify-center"
                                            : "h-auto w-full !rounded-md !px-4 !py-3 !text-title-small !font-medium !transition-all whitespace-nowrap expanded:whitespace-normal !justify-start",
                                        activeSection === section.id
                                            ? "!bg-primary-container !text-on-primary-container shadow-elevation-1"
                                            : "!text-on-surface-variant hover:!bg-surface-container-high hover:!text-on-surface"
                                    )}
                                >
                                    <MaterialIcon name={section.icon} size={20} className={activeSection === section.id ? "text-primary" : "text-on-surface-variant"} />
                                    {section.label}
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 overflow-y-auto p-4 expanded:py-8 expanded:pr-4">
                        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-medium2 pb-20">

                            {/* --- GENERAL SECTION --- */}
                            {activeSection === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Apparence</h2>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                        <h3 className="text-title-medium font-semibold mb-2">Thème</h3>
                                        <div className="flex items-center gap-3 rounded-md bg-surface-container-low border border-outline-variant p-4">
                                            <MaterialIcon name="light_mode" size={24} className="text-primary" />
                                            <div>
                                                <p className="text-body-medium font-medium text-on-surface">Thème clair (identité Caterpillar)</p>
                                                <p className="text-body-small text-on-surface-variant">Le mode sombre sera proposé dans une prochaine version.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- FINANCE SECTION --- */}
                            {activeSection === 'finance' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-title-large font-bold">Configuration Financière</h2>
                                        <Badge variant="neutral" className="gap-1">
                                            <MaterialIcon name="info" size={14} /> Global
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 h-full">
                                                <h3 className="text-title-medium font-semibold mb-4 flex items-center gap-2">
                                                    <MaterialIcon name="settings" size={20} className="text-primary" />
                                                    Paramètres Généraux
                                                </h3>
                                                <div className="space-y-4">
                                                    <SelectField
                                                        label="Devise"
                                                        name="currency"
                                                        value={financeForm.currency}
                                                        onChange={(e) => handleFinanceChange('currency', e.target.value)}
                                                        options={[
                                                            { value: 'XOF', label: 'XOF (Franc CFA)' }
                                                        ]}
                                                    />
                                                    <SelectField
                                                        label="Début année fiscale"
                                                        name="fiscalYearStart"
                                                        value={financeForm.fiscalYearStart}
                                                        onChange={(e) => handleFinanceChange('fiscalYearStart', e.target.value)}
                                                        options={[
                                                            { value: '01', label: 'Janvier' },
                                                            { value: '04', label: 'Avril' },
                                                            { value: '09', label: 'Septembre' }
                                                        ]}
                                                    />

                                                    <div className="flex items-center justify-between pt-2">
                                                        <label className="text-title-small font-medium text-on-surface">Notation compacte (1k, 1M)</label>
                                                        <Toggle checked={financeForm.compactNotation} onChange={(v) => handleFinanceChange('compactNotation', v)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-6 bg-primary-container/20 rounded-lg border border-primary/20 h-full">
                                                <h3 className="text-title-medium font-semibold mb-4 flex items-center gap-2 text-primary">
                                                    <MaterialIcon name="preview" size={20} />
                                                    Aperçu Amortissement
                                                </h3>
                                                <div className="space-y-4 text-body-medium">
                                                    <div className="flex justify-between py-2 border-b border-outline-variant/50">
                                                        <span className="text-on-surface-variant">Base (Exemple)</span>
                                                        <span className="font-mono font-bold">1 000 000 {financeForm.currency}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-outline-variant/50">
                                                        <span className="text-on-surface-variant">Mensualité</span>
                                                        <span className="font-mono font-bold text-primary">{formatCurrency(simulation.monthly, financeForm.currency, financeForm.compactNotation)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-on-surface-variant">Valeur Résiduelle</span>
                                                        <span className="font-mono font-bold text-tertiary">{formatCurrency(simulation.salvageValue, financeForm.currency, financeForm.compactNotation)}</span>
                                                    </div>
                                                    <div className="bg-surface/50 p-3 rounded text-body-small text-on-surface-variant italic mt-4 border border-outline-variant/50">
                                                        {financeForm.defaultDepreciationMethod === 'linear'
                                                            ? '* Estimation calculée avec la formule linéaire du moteur de valorisation.'
                                                            : "* Méthode dégressive sélectionnée : le moteur de valorisation applique aujourd'hui la formule linéaire — l'aperçu reflète ce calcul réel."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                        <h3 className="text-title-medium font-semibold mb-4">Règles d'Amortissement par défaut</h3>
                                        <div className="grid grid-cols-1 expanded:grid-cols-2 gap-6">
                                            <SelectField
                                                label="Méthode"
                                                name="method"
                                                value={financeForm.defaultDepreciationMethod}
                                                onChange={(e) => handleFinanceChange('defaultDepreciationMethod', e.target.value)}
                                                options={[
                                                    { value: 'linear', label: 'Linéaire (Constant)' },
                                                    { value: 'degressive', label: 'Dégressif (Accéléré)' }
                                                ]}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField
                                                    label="Durée (Ans)"
                                                    type="number"
                                                    value={financeForm.defaultDepreciationYears.toString()}
                                                    onChange={(e) => handleFinanceChange('defaultDepreciationYears', Number(e.target.value))}
                                                />
                                                <InputField
                                                    label="Valeur Résid. (%)"
                                                    type="number"
                                                    value={financeForm.salvageValuePercent.toString()}
                                                    onChange={(e) => handleFinanceChange('salvageValuePercent', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- AUTO COLLECTION SECTION --- */}
                            {activeSection === 'collection' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-title-large font-bold">Collecte automatique</h2>
                                        <Button
                                            variant="outlined"
                                            icon={<MaterialIcon name="data_object" size={16} />}
                                            onClick={handleSimulateAgentCheckIn}
                                        >
                                            Simuler check-in
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 medium:grid-cols-5 gap-3">
                                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Détectées</p>
                                            <p className="text-title-large font-semibold">{detectedStats.total}</p>
                                        </div>
                                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">À valider</p>
                                            <p className="text-title-large font-semibold text-secondary">{detectedStats.pending}</p>
                                        </div>
                                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Liées existant</p>
                                            <p className="text-title-large font-semibold text-primary">{detectedStats.linked}</p>
                                        </div>
                                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Importées</p>
                                            <p className="text-title-large font-semibold text-tertiary">{detectedStats.imported}</p>
                                        </div>
                                        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                                            <p className="text-label-small uppercase tracking-wide text-on-surface-variant">Ambiguës</p>
                                            <p className="text-title-large font-semibold text-error">{detectedStats.ambiguous}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-title-medium font-semibold">Agent local (GPO / Intune)</h3>
                                            <Toggle
                                                checked={financeForm.autoCollectionAgentEnabled}
                                                onChange={(value) => handleFinanceChange('autoCollectionAgentEnabled', value)}
                                            />
                                        </div>
                                        <InputField
                                            label="Clé API agent"
                                            value={financeForm.autoCollectionAgentApiKey}
                                            onChange={(e) => handleFinanceChange('autoCollectionAgentApiKey', e.target.value)}
                                            placeholder="NEEMBA_AGENT_KEY"
                                        />
                                        <InputField
                                            label="Fréquence check-in (minutes)"
                                            type="number"
                                            value={String(financeForm.autoCollectionHeartbeatMinutes)}
                                            onChange={(e) => handleFinanceChange('autoCollectionHeartbeatMinutes', Number(e.target.value))}
                                        />
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-body-medium text-on-surface">Forward des check-ins vers API backend</span>
                                            <Toggle
                                                checked={financeForm.autoCollectionForwardToApi}
                                                onChange={(value) => handleFinanceChange('autoCollectionForwardToApi', value)}
                                            />
                                        </div>
                                        <InputField
                                            label="URL API backend"
                                            value={financeForm.autoCollectionApiBaseUrl}
                                            onChange={(e) => handleFinanceChange('autoCollectionApiBaseUrl', e.target.value)}
                                            placeholder="http://localhost:8787"
                                        />
                                        <div className="flex justify-end">
                                            <Button variant="outlined" size="sm" onClick={handleTestApiConnection}>
                                                Tester la connexion API
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-body-medium text-on-surface">Validation manuelle obligatoire</span>
                                            <Toggle
                                                checked={financeForm.autoCollectionRequireManualValidation}
                                                onChange={(value) => handleFinanceChange('autoCollectionRequireManualValidation', value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-title-medium font-semibold">Active Directory (LDAP)</h3>
                                            <Toggle
                                                checked={financeForm.autoCollectionAdEnabled}
                                                onChange={(value) => handleFinanceChange('autoCollectionAdEnabled', value)}
                                            />
                                        </div>
                                        <InputField
                                            label="Contrôleur de domaine"
                                            value={financeForm.autoCollectionAdHost}
                                            onChange={(e) => handleFinanceChange('autoCollectionAdHost', e.target.value)}
                                            placeholder="dc01.tracker.local"
                                        />
                                        <InputField
                                            label="Base DN"
                                            value={financeForm.autoCollectionAdBaseDn}
                                            onChange={(e) => handleFinanceChange('autoCollectionAdBaseDn', e.target.value)}
                                            placeholder="OU=Computers,DC=tracker,DC=local"
                                        />
                                        <InputField
                                            label="Compte de service"
                                            value={financeForm.autoCollectionAdServiceAccount}
                                            onChange={(e) => handleFinanceChange('autoCollectionAdServiceAccount', e.target.value)}
                                            placeholder="svc-neemba-ldap"
                                        />
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-title-medium font-semibold">Scan réseau passif</h3>
                                            <Toggle
                                                checked={financeForm.autoCollectionNetworkEnabled}
                                                onChange={(value) => handleFinanceChange('autoCollectionNetworkEnabled', value)}
                                            />
                                        </div>
                                        <InputField
                                            label="Plages IP (séparées par virgule)"
                                            value={financeForm.autoCollectionNetworkRanges}
                                            onChange={(e) => handleFinanceChange('autoCollectionNetworkRanges', e.target.value)}
                                            placeholder="10.10.0.0/24, 10.20.0.0/24"
                                        />
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 space-y-4">
                                        <h3 className="text-title-medium font-semibold">Import batch check-in</h3>
                                        <p className="text-body-small text-on-surface-variant">
                                            Formats acceptés: JSON (objet, tableau ou `checkins[]`) et NDJSON.
                                            Schema versionné supporté: <code>{'neemba.agent.checkin.v1'}</code>.
                                        </p>
                                        <FileDropzone
                                            onFileSelect={(file) => handleBatchCheckInImport([file])}
                                            onFilesSelect={handleBatchCheckInImport}
                                            multiple
                                            accept=".json,.ndjson,.txt"
                                            isProcessing={isBatchImporting}
                                            label="Importer des fichiers check-in"
                                            subLabel="Déposez un ou plusieurs fichiers de remontée agent"
                                        />
                                        {batchImportSummary && (
                                            <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant">
                                                {batchImportSummary.files} fichier(s) • {batchImportSummary.accepted} entrée(s) traitée(s) • {batchImportSummary.rejected} rejetée(s)
                                                {batchImportSummary.apiForwarded > 0 && (
                                                    <> • API: {batchImportSummary.apiForwarded - batchImportSummary.apiFailed}/{batchImportSummary.apiForwarded} OK</>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 space-y-4">
                                        <h3 className="text-title-medium font-semibold">Machines détectées</h3>
                                        {recentDetectedDevices.length === 0 ? (
                                            <div className="rounded-md border border-dashed border-outline-variant p-5 text-body-small text-on-surface-variant">
                                                Aucune machine détectée pour le moment.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recentDetectedDevices.map((device) => (
                                                    <div
                                                        key={device.id}
                                                        className="rounded-md border border-outline-variant bg-surface-container-low p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-title-small font-semibold">{device.machineName}</p>
                                                                <p className="text-body-small text-on-surface-variant">
                                                                    {device.assetId || '-'} • {device.hostname || '-'} • {formatCheckinDate(device.lastSeenAt)}
                                                                </p>
                                                            </div>
                                                            {buildDetectedStatusBadge(device.status)}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-body-small text-on-surface-variant">
                                                            <span>{device.country || '-'} / {device.site || '-'} / {device.service || '-'}</span>
                                                            <span>•</span>
                                                            <span>Confiance: {device.matchConfidence || 'none'}</span>
                                                            <span>•</span>
                                                            <span>S1: {device.apps.sentinelOne ? 'Oui' : 'Non'}</span>
                                                            <span>•</span>
                                                            <span>M42: {device.apps.matrix42 ? 'Oui' : 'Non'}</span>
                                                            <span>•</span>
                                                            <span>ME: {device.apps.manageEngine ? 'Oui' : 'Non'}</span>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Button
                                                                variant="outlined"
                                                                size="sm"
                                                                disabled={device.status === 'ignored' || device.status === 'imported'}
                                                                onClick={() => handlePromoteDetected(device.id)}
                                                            >
                                                                Importer / Mettre à jour
                                                            </Button>
                                                            <Button
                                                                variant="text"
                                                                size="sm"
                                                                className="text-error"
                                                                disabled={device.status === 'ignored'}
                                                                onClick={() => handleIgnoreDetected(device.id)}
                                                            >
                                                                Ignorer
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- ACCOUNT SECTION --- */}
                            {activeSection === 'account' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Mon Compte</h2>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 flex items-start gap-6">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-display-small font-bold border-2 border-surface shadow-elevation-1 shrink-0">
                                            AA
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-title-large font-bold">Alice Admin</h3>
                                            <p className="text-on-surface-variant">alice.admin@tracker.app</p>
                                            <div className="flex gap-2 mt-3">
                                                <Badge variant="info">SuperAdmin</Badge>
                                                <Badge variant="neutral">IT Department</Badge>
                                            </div>
                                        </div>
                                        <Button variant="outlined" size="sm">Modifier</Button>
                                    </div>

                                    <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="text-title-medium font-semibold">Session</h3>
                                            <p className="text-body-medium text-on-surface-variant mt-1">Se déconnecter de l'application sur cet appareil.</p>
                                        </div>
                                        <Button
                                            variant="outlined"
                                            onClick={onLogout}
                                            className="text-error hover:text-error hover:bg-error-container whitespace-nowrap shrink-0"
                                            icon={<MaterialIcon name="logout" size={18} />}
                                        >
                                            Déconnexion
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-6 bg-surface rounded-lg border border-outline-variant shadow-elevation-1">
                                            <h3 className="text-title-medium font-semibold mb-6 flex items-center gap-2">
                                                <MaterialIcon name="security" size={20} className="text-tertiary" />
                                                Sécurité
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between py-2">
                                                    <div>
                                                        <p className="font-medium">Mot de passe</p>
                                                        <p className="text-body-medium text-on-surface-variant">Dernière modification il y a 90 jours</p>
                                                    </div>
                                                    <Button variant="outlined" className="text-primary whitespace-nowrap !px-4">Mettre à jour</Button>
                                                </div>
                                                <div className="h-px bg-outline-variant/50" />
                                                <div className="flex items-center justify-between py-2 gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">Authentification 2FA</p>
                                                        <p className="text-body-medium text-on-surface-variant">Recommandé pour les administrateurs</p>
                                                        {!isTwoFactorEnabled && (
                                                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-1 text-label-small text-on-error-container">
                                                                <MaterialIcon name="warning" size={14} />
                                                                Protection inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Toggle checked={isTwoFactorEnabled} onChange={setIsTwoFactorEnabled} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- HELP SECTION --- */}
                            {activeSection === 'help' && (
                                <div className="space-y-6">
                                    <h2 className="text-title-large font-bold">Centre d'aide</h2>

                                    <div className="grid grid-cols-1 expanded:grid-cols-2 gap-4">
                                        {[ 
                                            { title: 'Documentation', icon: 'menu_book', desc: 'Guides complets et manuels.' },
                                            { title: 'Support', icon: 'support_agent', desc: 'Contacter l\'équipe technique.' },
                                            { title: 'Tutoriels', icon: 'play_circle', desc: 'Vidéos de démonstration.' },
                                            { title: 'FAQ', icon: 'quiz', desc: 'Questions fréquentes.' },
                                        ].map((item, idx) => (
                                            <Button
                                                key={idx}
                                                type="button"
                                                variant="outlined"
                                                className="h-auto !rounded-lg !p-4 !bg-surface !border-outline-variant hover:!border-primary/50 hover:!bg-surface-container-low !text-left group !justify-start"
                                            >
                                                <div className="w-10 h-10 bg-secondary-container text-secondary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <MaterialIcon name={item.icon} size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-on-surface">{item.title}</h3>
                                                    <p className="text-body-medium text-on-surface-variant">{item.desc}</p>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-surface-container-low rounded-lg border border-outline-variant text-center">
                                        <p className="text-body-medium text-on-surface-variant mb-2">Version du système</p>
                                        <p className="font-mono font-bold">{APP_CONFIG.appName} v{APP_CONFIG.version}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </PageContainer>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;














