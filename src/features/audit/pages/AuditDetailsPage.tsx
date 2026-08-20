import React, { useMemo, useState, useEffect } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    ArrowLeft,
    ArrowsLeftRight,
    ArrowUUpLeft,
    CheckCircle,
    CircleDashed,
    CircleHalf,
    ClockCountdown,
    DotsThreeVertical,
    Export,
    Info,
    MapPin,
    Package,
    PlusCircle,
    QrCode,
    Question,
    Scan,
    Warning,
} from '@phosphor-icons/react';

import { MEDIA } from '../../../constants/breakpoints';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PageTabs } from '../../../components/ui/PageTabs';
import FacetChip from '../../../components/ui/FacetChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import DetailHero, {
    type DetailHeroFact,
    type DetailMetrics,
} from '../../../components/ui/DetailHero';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import ListRow, { type ListRowStatus } from '../../../components/ui/ListRow';
import { useToast } from '../../../context/ToastContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import SideSheet from '../../../components/ui/SideSheet';
import SelectField from '../../../components/ui/SelectField';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { parseAuditQrPayload } from '../../../lib/auditQr';
import { buildCsvLine } from '../../../lib/csv';
import { AuditScanPayload, AuditScanResult, Equipment, ViewType } from '../../../types';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { cn } from '../../../lib/utils';

interface AuditDetailsPageProps {
    onBack: () => void;
    onViewChange?: (view: ViewType) => void;
}

/**
 * Les trois moments du parc, et le sujet d'à côté. `parc` n'est pas une valeur :
 * les trois premières sont des **puces** d'un même onglet (C2), `exceptions` est
 * l'autre onglet.
 */
type AuditTab = 'todo' | 'scanned' | 'missing' | 'exceptions';

/**
 * Ce qu'on a décidé d'un écart. `null` = pas encore tranché, et c'est ce qui
 * **bloque la clôture** : un objet trouvé là où il n'était pas attendu ne peut pas
 * rester sans réponse, et la campagne ne peut pas décider à notre place.
 *
 * - `attached` — « Rattacher ici » : l'objet vit dans ce service, on écrit
 *   l'emplacement dans la fiche. Annulable jusqu'à la clôture.
 * - `left` — « Il reste là-bas » : l'objet est de passage. Rien à écrire, mais la
 *   décision est prise et elle se voit. Ce geste n'existait pas dans le code :
 *   l'écart restait ouvert indéfiniment et n'empêchait rien.
 * - `kept` — « Compléter la fiche » : le code inconnu correspond à un vrai actif. La
 *   fiche que le scan a créée est gardée, et on va la finir.
 * - `discarded` — « Écarter » : le code lu ne mérite pas de fiche. Le scan en avait
 *   déjà créé une, elle est retirée.
 */
type ExceptionDecision = 'attached' | 'left' | 'kept' | 'discarded';

interface AuditScope {
    country: string;
    site: string;
    service: string;
}

interface LocalExceptionEntry {
    id: string;
    timestamp: string;
    payload: AuditScanPayload;
    result: AuditScanResult;
    resolved: boolean;
    decision?: ExceptionDecision;
    decidedAt?: string;
    /** L'emplacement d'avant le rattachement — ce qu'« Annuler » restitue. */
    previousScope?: AuditScope;
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
        item.name.toLowerCase().includes(q) ||
        item.assetId.toLowerCase().includes(q) ||
        (item.hostname || '').toLowerCase().includes(q) ||
        (item.serialNumber || '').toLowerCase().includes(q) ||
        (item.user?.name || '').toLowerCase().includes(q)
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

/**
 * « il y a 12 min » — dans une campagne, ce qui compte est **quand** l'objet a été
 * vu, pas la date complète. L'heure remplace le statut sur la puce « Retrouvés ».
 */
const formatSince = (value?: string): string => {
    if (!value) return '-';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '-';
    const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    return `il y a ${Math.floor(hours / 24)} j`;
};

/**
 * La marque d'une carte d'écart — **pictogramme et mot** (I3). Elle remplace la
 * pastille peinte qui disait la nature d'un écart par sa seule couleur de fond ;
 * une teinte ne se lit pas pour qui ne la distingue pas, ni à l'impression.
 */
const ExceptionMark: React.FC<{
    icon: PhosphorGlyph;
    label: string;
    tone: ListRowStatus['tone'];
}> = ({ icon, label, tone }) => (
    <span className="text-text-secondary flex shrink-0 items-center gap-[5px] text-[12px] whitespace-nowrap">
        <Icon glyph={icon} size={18} className={EXCEPTION_TONE[tone]} />
        {label}
    </span>
);

const EXCEPTION_TONE: Record<ListRowStatus['tone'], string> = {
    positive: 'text-[var(--tk-color-st-vert)]',
    info: 'text-[var(--tk-color-st-bleu)]',
    pending: 'text-[var(--tk-color-st-ambre)]',
    attention: 'text-[var(--tk-color-st-orange)]',
    refused: 'text-[var(--tk-color-st-rouge)]',
    muted: 'text-[var(--tk-color-st-gris)]',
};

/**
 * Détail campagne — **porté sur la planche 16.2**.
 *
 * L'écran le plus riche de l'audit, et il portait le seul acte destructeur du
 * domaine : la clôture retire des actifs d'un service. Le portage traite les sept
 * relevés de la planche. Les deux premiers l'avaient déjà été (C1 la puce
 * « Manquants » à zéro pendant la campagne, C2 deux onglets et trois puces) ; les
 * cinq autres le sont ici :
 *
 * - **C3 — « Démarrer » et « Réinitialiser » étaient le même bouton.** À l'endroit
 *   exact où l'on attend un démarrage, un appui effaçait le relevé en cours, sans
 *   confirmation. Le démarrage vit maintenant dans 16.1 (« Lancer » sur la rangée) ;
 *   **une campagne ouverte n'a plus de bouton de démarrage**, et abandonner un relevé
 *   est un acte du débordement, confirmé.
 * - **C4 — un badge peint, en majuscules, en jaune.** « PRÊT / EN COURS / TERMINÉ »
 *   en `bg-primary` plein cumulait trois interdits : majuscules peintes, jaune hors
 *   geste, état dit par la seule couleur. L'état passe dans le voile du héro, en
 *   pictogramme **et** mot, en bas de casse (I3) — et le héro emporte les trois
 *   qualifiants, donc la rangée de tuiles et la barre de progression tombent
 *   (corollaire R3 : ce que le héro porte, les cartes ne le reprennent pas).
 * - **C5 — un seul état vide pour quatre situations.** « Aucun équipement dans cet
 *   onglet » servait au parc entièrement scanné, à la campagne sans écart, au
 *   manquant inexistant et à la recherche sans résultat : quatre nouvelles opposées,
 *   une phrase. Le vide dit maintenant **ce qui vient d'arriver**.
 * - **C6 — « le scan QR est réservé à la version mobile »**, écrit sur l'écran qui
 *   *est* la version mobile. Le scan passe au canevas de 17.3 en mode lot, à toutes
 *   les largeurs, avec la saisie manuelle en repli — c'est le seul mécanisme de
 *   lecture que ce produit possède réellement.
 * - **C7 — le mot-clé à recopier.** La confirmation exigeait de taper « CLOTURER ».
 *   Recopier un mot ne fait pas relire la conséquence, et il faut pouvoir clôturer
 *   debout dans un local. Reste la confirmation de 17.2 : le sujet nommé, les lignes
 *   de conséquence chiffrées, l'irréversible en rouge, le verbe sur le bouton.
 *
 * **La seule contrainte que la planche ajoute au produit :** un écart non tranché
 * **bloque la clôture**. Elle remplace le mot-clé — un objet trouvé là où il n'était
 * pas attendu a déjà une réponse, soit il vit ici et on le rattache, soit il n'y vit
 * pas et on le laisse. La clôture ne se propose donc pas tant qu'une décision
 * manque.
 */
const AuditDetailsPage: React.FC<AuditDetailsPageProps> = ({ onBack, onViewChange }) => {
    const {
        equipment,
        locationData,
        upsertEquipmentFromAuditScan,
        removeEquipmentFromServiceAfterAudit,
        updateEquipment,
        deleteEquipment,
    } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const { navigateToItem } = useAppNavigation();
    const isMobile = useMediaQuery(MEDIA.belowExpanded);
    const storedScope = useMemo(() => readStoredScope(), []);

    const [activeTab, setActiveTab] = useState<AuditTab>('todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [scanOpen, setScanOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [scanRawValue, setScanRawValue] = useState('');
    const [scanHits, setScanHits] = useState<ScanHit[]>([]);
    const [auditStartedAt, setAuditStartedAt] = useState<string | null>(null);
    const [auditFinalized, setAuditFinalized] = useState(false);
    const [finalizedAt, setFinalizedAt] = useState<string | null>(null);
    const [baselineIds, setBaselineIds] = useState<string[]>([]);
    const [foundIds, setFoundIds] = useState<string[]>([]);
    const [foundAt, setFoundAt] = useState<Record<string, string>>({});
    const [missingIds, setMissingIds] = useState<string[]>([]);
    const [exceptionEntries, setExceptionEntries] = useState<LocalExceptionEntry[]>([]);

    const [selectedCountry, setSelectedCountry] = useState<string>(
        storedScope.country || locationData.countries[0] || '',
    );
    const [selectedSite, setSelectedSite] = useState<string>(storedScope.site || '');
    const [selectedService, setSelectedService] = useState<string>(storedScope.service || '');

    const debouncedSearch = useDebounce(searchQuery, 250);

    const countryOptions = useMemo(
        () => locationData.countries.map((country) => ({ value: country, label: country })),
        [locationData.countries],
    );
    const siteOptions = useMemo(
        () =>
            (locationData.sites[selectedCountry] || []).map((site) => ({
                value: site,
                label: site,
            })),
        [locationData.sites, selectedCountry],
    );
    const serviceOptions = useMemo(
        () =>
            (locationData.services[selectedSite] || []).map((service) => ({
                value: service,
                label: service,
            })),
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
        return equipment.filter(
            (item) =>
                item.country === selectedCountry &&
                item.site === selectedSite &&
                item.department === selectedService,
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
    /**
     * « À scanner » n'existe que pendant la campagne. La clôture ne supprime pas les
     * actifs jamais vus — elle les requalifie (`status: 'Manquant'`, `department`
     * vidé) — donc ils restent dans la ligne de base et continueraient à se compter
     * ici. Après la clôture il n'y a plus rien à parcourir : ils sont passés
     * manquants, et la puce disparaît avec la campagne.
     */
    const todoItems = useMemo(
        () => (auditFinalized ? [] : baselineEquipment.filter((item) => !foundSet.has(item.id))),
        [auditFinalized, baselineEquipment, foundSet],
    );

    /**
     * C1 — **le manquant n'existe qu'après la clôture.** La puce vaut zéro pendant
     * toute la campagne, et devient la puce active à la clôture. Le relevé est figé
     * sur les identifiants retirés : après la clôture les actifs ne sont plus dans le
     * périmètre, donc `todoItems` ne les retrouve plus.
     */
    const missingItems = useMemo(() => {
        if (!auditFinalized) return [];
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return missingIds
            .map((id) => byId.get(id))
            .filter((item): item is Equipment => Boolean(item));
    }, [auditFinalized, equipment, missingIds]);

    const exceptionsDisplay = useMemo(() => {
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return exceptionEntries.map((entry) => ({
            ...entry,
            equipment: entry.result.equipmentId ? byId.get(entry.result.equipmentId) : undefined,
        }));
    }, [exceptionEntries, equipment]);

    /** Ce qui bloque la clôture — la planche l'appelle « une décision en attente ». */
    const pendingExceptions = useMemo(
        () => exceptionEntries.filter((entry) => !entry.resolved),
        [exceptionEntries],
    );
    const closureBlocked = pendingExceptions.length > 0;

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
            const name =
                entry.result.equipmentName ||
                entry.payload.machineName ||
                entry.payload.hostname ||
                '';
            const asset = entry.payload.assetId || entry.equipment?.assetId || '';
            return name.toLowerCase().includes(q) || asset.toLowerCase().includes(q);
        });
    }, [exceptionsDisplay, debouncedSearch]);

    /**
     * Le nombre d'attendus est **figé au démarrage** et ne bouge plus : c'est la ligne
     * de base. Ne pas y ajouter les manquants après la clôture — la requalification
     * les garde dans `baselineEquipment`, et les compter deux fois donnait 45 attendus
     * pour un parc de 41.
     */
    const sessionTotal = baselineEquipment.length;
    const sessionFound = scannedItems.length;
    const sessionExceptions = exceptionEntries.length;
    const resolvedExceptions = sessionExceptions - pendingExceptions.length;
    /**
     * Le périmètre en clair, pour la barre du haut — « Support Afrique · Campus Dakar »
     * pendant la campagne, la date de clôture après : ce n'est plus un lieu qu'on
     * consulte, c'est un relevé daté.
     */
    const scopeCaption = auditFinalized
        ? `clôturée · ${formatDateTime(finalizedAt || undefined)}`
        : [selectedService, selectedSite].filter(Boolean).join(' · ') || 'périmètre à choisir';

    /** Deux des quatre manquants sont attribués : c'est le fait qui pèse le plus après une clôture. */
    const assignedMissingCount = useMemo(
        () => missingItems.filter((item) => Boolean(item.user)).length,
        [missingItems],
    );
    const progressPercentage =
        sessionTotal > 0 ? Math.round((sessionFound / sessionTotal) * 100) : 0;
    const lastScanAt = useMemo(() => {
        const stamps = Object.values(foundAt);
        return stamps.length > 0 ? stamps.slice().sort().at(-1) : undefined;
    }, [foundAt]);

    const currentListCount = useMemo(() => {
        if (activeTab === 'todo') return filteredTodo.length;
        if (activeTab === 'scanned') return filteredScanned.length;
        if (activeTab === 'missing') return filteredMissing.length;
        return filteredExceptions.length;
    }, [
        activeTab,
        filteredTodo.length,
        filteredScanned.length,
        filteredMissing.length,
        filteredExceptions.length,
    ]);

    const scopeIsReady = Boolean(selectedCountry && selectedSite && selectedService);
    const scopeLocked = sessionStarted;
    const currentScope: AuditScope = {
        country: selectedCountry,
        site: selectedSite,
        service: selectedService,
    };

    const resetAuditSession = () => {
        setAuditStartedAt(null);
        setAuditFinalized(false);
        setFinalizedAt(null);
        setBaselineIds([]);
        setFoundIds([]);
        setFoundAt({});
        setMissingIds([]);
        setExceptionEntries([]);
        setScanHits([]);
        setActiveTab('todo');
    };

    /**
     * C3 — **démarrer, et rien d'autre.** Cette fonction réinitialisait quand une
     * session tournait : le même bouton, au même endroit, faisait deux choses
     * opposées. Elle ne démarre plus que ce qui n'a pas commencé ; l'abandon est un
     * acte séparé, nommé, et confirmé.
     */
    const startAuditSession = () => {
        if (sessionStarted) return;
        if (!scopeIsReady) {
            showToast('Sélectionnez un pays, un site et un service.', 'warning');
            return;
        }
        const ids = scopedEquipment.map((item) => item.id);
        setBaselineIds(ids);
        setFoundIds([]);
        setFoundAt({});
        setMissingIds([]);
        setExceptionEntries([]);
        setScanHits([]);
        setAuditFinalized(false);
        setFinalizedAt(null);
        setAuditStartedAt(new Date().toISOString());
        setActiveTab('todo');
        showToast(
            `Audit démarré pour ${selectedService} (${ids.length} machine(s) ciblée(s)).`,
            'success',
        );
    };

    /**
     * Abandonner le relevé — l'ancien « Réinitialiser », rendu à sa nature. Il jette
     * un travail en cours : il descend au débordement, sous son vrai verbe, et passe
     * par la confirmation de 17.2.
     */
    const abandonAuditSession = () => {
        requestConfirmation({
            title: `Abandonner le relevé de ${selectedService} ?`,
            message: (
                <>
                    Les {sessionFound} scan(s) déjà faits seront perdus et le périmètre redeviendra
                    modifiable. Aucun actif n'est modifié : le parc reste tel qu'il est aujourd'hui.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Abandonner',
            cancelText: 'Continuer le relevé',
            icon: ArrowUUpLeft,
            details: [
                { label: 'Scans perdus', value: sessionFound },
                { label: 'Écarts perdus', value: sessionExceptions },
                { label: 'Actifs modifiés', value: 'aucun' },
            ],
            onConfirm: () => {
                resetAuditSession();
                showToast('Relevé abandonné. Le périmètre est de nouveau modifiable.', 'info');
            },
        });
    };

    const finalizeAuditSession = (missingSnapshot: Equipment[]) => {
        const closedAt = new Date().toISOString();
        setAuditFinalized(true);
        setFinalizedAt(closedAt);
        setMissingIds(missingSnapshot.map((item) => item.id));

        if (missingSnapshot.length === 0) {
            showToast('Campagne clôturée : tout le parc a été retrouvé.', 'success');
            setActiveTab('scanned');
            return;
        }

        let flaggedAsMissing = 0;
        missingSnapshot.forEach((item) => {
            if (removeEquipmentFromServiceAfterAudit(item.id, currentScope)) {
                flaggedAsMissing += 1;
            }
        });

        showToast(
            `Campagne clôturée : ${flaggedAsMissing} actif(s) marqué(s) manquant(s).`,
            'warning',
        );
        setActiveTab('missing');
    };

    const registerScanHit = (
        label: string,
        code: string,
        detail: string,
        kind: ScanHit['kind'],
    ) => {
        setScanHits((prev) => [
            {
                id: `hit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                label,
                code,
                detail,
                kind,
            },
            ...prev,
        ]);
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

        if (!scopeIsReady) {
            showToast('Sélectionnez d’abord un pays, un site et un service.', 'warning');
            return;
        }

        const result = upsertEquipmentFromAuditScan(parsed.payload, currentScope);
        if (!result.ok) {
            showToast(result.message, 'error');
            return;
        }

        const scannedCode =
            parsed.payload.assetId || parsed.payload.serialNumber || parsed.payload.hostname || '—';

        if (
            result.equipmentId &&
            result.serviceMatches &&
            baselineSourceIds.includes(result.equipmentId)
        ) {
            const equipmentId = result.equipmentId;
            setFoundIds((prev) => (prev.includes(equipmentId) ? prev : [...prev, equipmentId]));
            setFoundAt((prev) => ({ ...prev, [equipmentId]: new Date().toISOString() }));
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
            registerScanHit(
                result.equipmentName || scannedCode,
                scannedCode,
                'écart — à trancher',
                'exception',
            );
            setActiveTab('exceptions');
        } else {
            registerScanHit(
                result.equipmentName || scannedCode,
                scannedCode,
                'attendu — retrouvé',
                'expected',
            );
            setActiveTab('scanned');
        }

        if (result.resolution === 'found_out_of_service') {
            showToast(result.message, 'warning');
        } else {
            showToast(result.message, 'success');
        }

        setScanRawValue('');
        setManualOpen(false);
    };

    /**
     * C7 — **la conséquence chiffrée remplace le mot-clé.** Le sujet est nommé dans la
     * question, les lignes disent ce qui arrive et ce qui est conservé, l'irréversible
     * est en rouge, et le bouton porte le verbe. Plus rien à recopier.
     */
    const handleFinalizeAudit = () => {
        if (!sessionStarted) {
            showToast("Démarrez d'abord une session d'audit.", 'warning');
            return;
        }

        if (auditFinalized) {
            showToast('Cette campagne est déjà clôturée.', 'info');
            return;
        }

        if (closureBlocked) {
            showToast(
                `${pendingExceptions.length} écart(s) à trancher avant de pouvoir clôturer.`,
                'warning',
            );
            setActiveTab('exceptions');
            return;
        }

        const missingSnapshot = [...todoItems];
        if (missingSnapshot.length === 0) {
            finalizeAuditSession(missingSnapshot);
            return;
        }

        requestConfirmation({
            title: `Clôturer l'audit de ${selectedService} ?`,
            message: (
                <>
                    <strong>{missingSnapshot.length} actif(s) jamais scanné(s)</strong> seront
                    marqués manquants et retirés du service. Ils restent au parc, avec tout leur
                    historique, et réapparaîtront s'ils sont scannés ailleurs.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Clôturer',
            cancelText: 'Annuler',
            icon: Warning,
            // Les trois lignes de la planche, et pas une de plus : chacune est une
            // conséquence, pas un commentaire. Le fait « dont attribués » n'est pas ici
            // — il vit sur l'écran clôturé, où il a une suite ; dans la confirmation, il
            // ferait une quatrième chose à peser au moment de décider.
            details: [
                { icon: CheckCircle, label: 'Retrouvés, inchangés', value: sessionFound },
                {
                    icon: Question,
                    label: 'Marqués manquants, retirés du service',
                    value: missingSnapshot.length,
                },
                {
                    icon: ArrowsLeftRight,
                    label: 'Écarts tranchés',
                    value: `${resolvedExceptions} sur ${sessionExceptions}`,
                },
            ],
            onConfirm: () => finalizeAuditSession(missingSnapshot),
        });
    };

    /** « Rattacher ici » — écrit l'emplacement dans la fiche. C'est une modification d'actif, journalisée. */
    const attachException = (entryId: string, item: Equipment | undefined) => {
        if (!item) return;

        const previousScope: AuditScope = {
            country: item.country || '',
            site: item.site || '',
            service: item.department || '',
        };

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
            prev.map((entry) =>
                entry.id === entryId
                    ? {
                          ...entry,
                          resolved: true,
                          decision: 'attached',
                          decidedAt: new Date().toISOString(),
                          previousScope,
                      }
                    : entry,
            ),
        );
        showToast(`${item.name} rattaché à ${selectedService}.`, 'success');
    };

    /**
     * « Il reste là-bas » — le cas inverse du rattachement, et il n'avait **aucun
     * geste** : l'écart restait ouvert indéfiniment et n'empêchait rien. Rien n'est
     * écrit dans la fiche ; c'est la décision qui est enregistrée.
     */
    const leaveException = (entryId: string) => {
        setExceptionEntries((prev) =>
            prev.map((entry) =>
                entry.id === entryId
                    ? {
                          ...entry,
                          resolved: true,
                          decision: 'left',
                          decidedAt: new Date().toISOString(),
                      }
                    : entry,
            ),
        );
        showToast('Écart tranché : l’actif reste rattaché à son service d’origine.', 'info');
    };

    /**
     * « Compléter la fiche » — la planche l'appelle « Créer la fiche » et renvoie au
     * formulaire de 04.3, pré-rempli du code lu et du périmètre de la campagne. Le code
     * **crée déjà** la fiche au scan (`resolution: 'created'`), avec le seul contenu de
     * l'étiquette : le geste qui reste n'est donc pas de créer mais d'aller finir. Le
     * mot suit ce que le produit fait, pas ce que la planche supposait qu'il ferait —
     * annoncer une création qui a déjà eu lieu apprendrait quelque chose de faux.
     */
    const completeException = (entryId: string, item: Equipment | undefined) => {
        if (!item) return;
        setExceptionEntries((prev) =>
            prev.map((entry) =>
                entry.id === entryId
                    ? {
                          ...entry,
                          resolved: true,
                          decision: 'kept',
                          decidedAt: new Date().toISOString(),
                      }
                    : entry,
            ),
        );
        navigateToItem('edit_equipment', item.id);
    };

    /**
     * « Écarter » — le scan a déjà créé une fiche (`resolution: 'created'`) avec le
     * strict minimum lu sur l'étiquette. Écarter, c'est la retirer : sans cela, un
     * code lu par erreur laisserait un actif fantôme au parc.
     */
    const discardException = (entryId: string, item: Equipment | undefined) => {
        const label = item?.name || 'la fiche créée';
        requestConfirmation({
            title: `Écarter ${label} ?`,
            message: (
                <>
                    Le scan avait créé une fiche à partir du seul code lu. L'écarter la retire du
                    parc. Le code pourra être rescanné plus tard s'il correspond à un vrai actif.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Écarter',
            cancelText: 'Annuler',
            icon: Package,
            onConfirm: () => {
                if (item) deleteEquipment(item.id);
                setExceptionEntries((prev) =>
                    prev.map((entry) =>
                        entry.id === entryId
                            ? {
                                  ...entry,
                                  resolved: true,
                                  decision: 'discarded',
                                  decidedAt: new Date().toISOString(),
                              }
                            : entry,
                    ),
                );
                showToast('Fiche écartée et retirée du parc.', 'info');
            },
        });
    };

    /** « Annuler ce rattachement » — possible jusqu'à la clôture, et pas après. */
    const undoException = (entryId: string) => {
        const entry = exceptionEntries.find((candidate) => candidate.id === entryId);
        if (!entry) return;

        if (entry.decision === 'attached' && entry.previousScope && entry.result.equipmentId) {
            updateEquipment(
                entry.result.equipmentId,
                {
                    country: entry.previousScope.country,
                    site: entry.previousScope.site,
                    department: entry.previousScope.service,
                },
                { source: 'audit_scan_alignment_undo' },
            );
        }

        setExceptionEntries((prev) =>
            prev.map((candidate) =>
                candidate.id === entryId
                    ? {
                          ...candidate,
                          resolved: false,
                          decision: undefined,
                          decidedAt: undefined,
                          previousScope: undefined,
                      }
                    : candidate,
            ),
        );
        showToast('Décision annulée. L’écart est de nouveau à trancher.', 'info');
    };

    /**
     * Export du relevé — le **seul** geste d'une campagne clôturée, et il est neutre :
     * il n'y a plus rien à engager. Le jaune disparaît avec la clôture.
     */
    const exportRelevé = () => {
        const rows = [
            ...scannedItems.map((item) => [
                item.assetId,
                item.name,
                item.user?.name || 'non attribué',
                'retrouvé',
                formatDateTime(foundAt[item.id]),
            ]),
            ...missingItems.map((item) => [
                item.assetId,
                item.name,
                item.user?.name || 'non attribué',
                'manquant',
                '',
            ]),
        ];
        const csv = [
            buildCsvLine(['Référence', 'Actif', 'Détenteur', 'Résultat', 'Scanné le'], ','),
            ...rows.map((row) => buildCsvLine(row, ',')),
        ].join('\n');

        const filename = `releve_audit_${selectedService || 'service'}_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Relevé « ${filename} » exporté.`, 'success');
    };

    /**
     * C5 — **le vide dit ce qui vient d'arriver.** « Tout est retrouvé » n'est pas
     * « rien ne correspond à votre recherche », et les manquants qui n'existent pas
     * encore ne sont pas des manquants absents. Une seule phrase pour quatre nouvelles
     * opposées apprenait quelque chose de faux trois fois sur quatre.
     */
    const renderEmptyList = (scope: AuditTab) => {
        if (debouncedSearch) {
            return (
                <EmptyState
                    icon="search_off"
                    title="Rien ne correspond à cette recherche"
                    description={`Aucun résultat pour « ${debouncedSearch} » dans cette liste.`}
                    action={
                        <Button variant="text" onClick={() => setSearchQuery('')}>
                            Effacer la recherche
                        </Button>
                    }
                />
            );
        }

        if (scope === 'todo') {
            if (auditFinalized) {
                return (
                    <EmptyState
                        icon="lock"
                        title="La campagne est clôturée"
                        description="Il n'y a plus rien à scanner : les actifs jamais vus sont passés en manquants."
                    />
                );
            }
            return sessionTotal === 0 ? (
                <EmptyState
                    icon="inventory_2"
                    title="Ce service n'attend aucun actif"
                    description="Il n'y a rien à auditer ici : aucun actif du parc n'est rattaché à ce périmètre."
                />
            ) : (
                <EmptyState
                    icon="task_alt"
                    title="Tout est retrouvé"
                    description={`Les ${sessionFound} actifs attendus ont été scannés. La campagne peut être clôturée.`}
                />
            );
        }

        if (scope === 'scanned') {
            return (
                <EmptyState
                    icon="qr_code_scanner"
                    title="Aucun scan pour l'instant"
                    description="Les actifs retrouvés apparaîtront ici, du plus récent au plus ancien."
                />
            );
        }

        if (scope === 'missing') {
            return auditFinalized ? (
                <EmptyState
                    icon="task_alt"
                    title="Aucun manquant"
                    description="La campagne s'est clôturée sans perte : tout le parc du service a été retrouvé."
                />
            ) : (
                <EmptyState
                    icon="hourglass_empty"
                    title="Les manquants n'existent qu'après la clôture"
                    description="Un actif n'est manquant que si la campagne se termine sans lui. Tant qu'elle tourne, il est simplement à scanner."
                />
            );
        }

        return (
            <EmptyState
                icon="check_circle"
                title="Aucun écart"
                description="Tout ce qui a été scanné était attendu dans ce service. Rien à trancher."
            />
        );
    };

    /**
     * La rangée de campagne — **la rangée de 04.1, marque à droite**.
     *
     * L'écran portait ici un tableau à cinq colonnes avec sa ligne d'en-têtes : nom,
     * asset, hostname, détenteur, résultat, statut. Six faits pour choisir un objet à
     * aller chercher dans un local, alors que la question tient en trois — *quel code*,
     * *quel objet chez qui*, *vu ou pas*.
     *
     * Ce que la marque dit change avec la puce, et c'est tout ce qui change : à scanner
     * en attente, l'**heure** pour un retrouvé — dans une campagne, ce qui compte est
     * quand l'objet a été vu, pas son statut au parc —, et le mot « manquant » après la
     * clôture. Le statut de l'objet n'apparaît nulle part : c'est justement ce que
     * l'audit est en train de vérifier.
     */
    const renderEquipmentRows = (rows: Equipment[], mode: 'todo' | 'scanned' | 'missing') => {
        if (rows.length === 0) return renderEmptyList(mode);

        return rows.map((item) => {
            const holder = item.user?.name || 'non attribué';
            const mark: ListRowStatus =
                mode === 'scanned'
                    ? { icon: CheckCircle, label: formatSince(foundAt[item.id]), tone: 'positive' }
                    : mode === 'missing'
                      ? { icon: Question, label: 'manquant', tone: 'attention' }
                      : { icon: CircleDashed, label: 'à scanner', tone: 'muted' };

            return (
                <ListRow
                    key={item.id}
                    vignette={<Icon glyph={getCategoryGlyph(item.type)} size={20} />}
                    title={item.assetId}
                    holder={`${item.model || item.name} · ${mode === 'missing' && item.status === 'En réparation' ? 'était en réparation' : holder}`}
                    mark={mark}
                />
            );
        });
    };

    /**
     * Le titre de la liste — ce qu'on regarde, et combien il en reste sur combien.
     * « Les 7 qui restent à trouver » n'est pas « Les 34 retrouvés » : la même liste
     * lue dans deux sens n'a pas le même emploi, et le dire évite de compter les
     * rangées pour savoir où l'on est.
     */
    const listCaption = () => {
        if (activeTab === 'todo') {
            return {
                title: `Les ${todoItems.length} qui restent à trouver`,
                count: `${todoItems.length} sur ${sessionTotal}`,
            };
        }
        if (activeTab === 'scanned') {
            return {
                title: `Les ${scannedItems.length} retrouvés, du plus récent`,
                count: `${scannedItems.length} sur ${sessionTotal}`,
            };
        }
        return {
            title: auditFinalized
                ? `Les ${missingItems.length} jamais retrouvés`
                : 'Les manquants, après la clôture',
            count: `${missingItems.length} sur ${sessionTotal}`,
        };
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
                {
                    id: 'parc',
                    label: 'Le parc du service',
                    shortLabel: 'Le parc',
                    badge: sessionTotal,
                },
                { id: 'exceptions', label: 'Écarts', badge: sessionExceptions },
            ]}
        />
    );

    /**
     * Les trois moments du même parc — et il n'y en a que deux sur une campagne
     * clôturée : « plus de scan, plus de puce à scanner, une seule sortie ». La puce
     * « Manquants » reste visible pendant la campagne, à zéro : c'est le même fait,
     * montré au bon moment (C1).
     */
    const parcChips = (
        <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto">
            {(
                [
                    ...(auditFinalized
                        ? []
                        : [['todo', 'À scanner', todoItems.length, CircleDashed] as const]),
                    ['scanned', 'Retrouvés', scannedItems.length, CheckCircle],
                    ['missing', 'Manquants', missingItems.length, Question],
                ] as ReadonlyArray<readonly [AuditTab, string, number, PhosphorGlyph]>
            ).map(([id, label, count, glyph]) => (
                <FacetChip
                    key={id}
                    label={label}
                    count={count}
                    icon={glyph}
                    selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                />
            ))}
        </div>
    );

    /**
     * C4 — **l'état dans le voile, en pictogramme et en mot.** Les trois glyphes sont
     * ceux que 16.1 a fixés pour la même donnée : `clock-countdown` ambre pour ce qui
     * est à lancer, `circle-half` bleu pour ce qui tourne, `check-circle` vert pour ce
     * qui est complet — et `circle-dashed` neutre quand il n'y a rien à auditer.
     */
    const heroStatus = useMemo(() => {
        if (auditFinalized) {
            return { icon: CheckCircle, label: 'clôturée', tone: 'positive' as const };
        }
        if (sessionStarted) {
            return { icon: CircleHalf, label: 'en cours', tone: 'info' as const };
        }
        if (scopeIsReady && scopedEquipment.length === 0) {
            return { icon: CircleDashed, label: 'rien à auditer', tone: 'attention' as const };
        }
        return { icon: ClockCountdown, label: 'à lancer', tone: 'pending' as const };
    }, [auditFinalized, scopeIsReady, scopedEquipment.length, sessionStarted]);

    /**
     * Trois qualifiants, et **le manquant n'y est pas tant que la campagne tourne** :
     * un chiffre qui vaudra zéro jusqu'à la dernière seconde n'est pas un qualifiant.
     * Il prend la place des écarts à la clôture, quand ils sont tous tranchés.
     */
    const heroMetrics: DetailMetrics = useMemo(() => {
        if (auditFinalized) {
            return [
                { value: sessionTotal, label: 'attendus' },
                { value: sessionFound, label: 'retrouvés' },
                { value: missingItems.length, label: 'manquants' },
            ];
        }
        return [
            { value: sessionTotal, label: 'attendus' },
            { value: sessionFound, label: 'retrouvés' },
            { value: sessionExceptions, label: 'écarts' },
        ];
    }, [auditFinalized, missingItems.length, sessionExceptions, sessionFound, sessionTotal]);

    /**
     * Les faits qui situent la campagne — **quand elle a commencé, et où en est le
     * relevé**. R3 fixe leur place après les qualifiants et cette place ne se
     * renégocie pas par écran : la planche les dessine au-dessus, le registre les met
     * en dessous, et c'est le registre qui décide de la hiérarchie du héro.
     */
    const heroFacts = useMemo(() => {
        const facts: DetailHeroFact[] = [];
        if (auditFinalized) {
            facts.push({
                icon: CheckCircle,
                children: `clôturée ${formatSince(finalizedAt || undefined)} · le ${formatDateTime(finalizedAt || undefined)}`,
            });
        } else if (sessionStarted) {
            facts.push({
                icon: ClockCountdown,
                children: `démarrée ${formatSince(auditStartedAt || undefined)}`,
            });
            facts.push({
                icon: QrCode,
                children: `périmètre figé au démarrage · dernier scan ${formatSince(lastScanAt)}`,
            });
        } else if (scopeIsReady) {
            facts.push({ icon: MapPin, children: `${selectedSite} · ${selectedCountry}` });
        }
        return facts;
    }, [
        auditFinalized,
        auditStartedAt,
        finalizedAt,
        lastScanAt,
        scopeIsReady,
        selectedCountry,
        selectedSite,
        sessionStarted,
    ]);

    /**
     * La couverture, en barre puis en clair — « 34 sur 41 · 83 % ». C'est le seul
     * endroit où elle vit : la carte de progression qui la redisait sous le héro est
     * tombée avec les tuiles (corollaire R3).
     */
    const heroNote = sessionStarted ? (
        <>
            <span
                aria-hidden="true"
                className="block h-1.5 overflow-hidden rounded-full bg-white/[0.16]"
            >
                <span
                    className="block h-full rounded-full bg-[var(--tk-color-live-vert)]"
                    style={{ width: `${progressPercentage}%` }}
                />
            </span>
            <span className="mt-1.5 block tabular-nums">
                {sessionFound} sur {sessionTotal} · {progressPercentage} %
                {auditFinalized &&
                    sessionExceptions > 0 &&
                    ` · ${resolvedExceptions} écarts tranchés`}
            </span>
        </>
    ) : undefined;

    const overflowItems: MenuItem[] = useMemo(() => {
        const items: MenuItem[] = [];
        if (sessionStarted && !auditFinalized) {
            items.push({
                id: 'abandon-session',
                label: 'Abandonner le relevé',
                description: 'jette les scans en cours ; aucun actif modifié',
                icon: 'restart_alt',
                destructive: true,
                onSelect: abandonAuditSession,
            });
        }
        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStarted, auditFinalized, sessionFound, sessionExceptions, selectedService]);

    /**
     * Le héro **ne porte aucun geste** : la planche les pose en pied de contenu, en
     * pleine largeur, parce qu'on les atteint avec le pouce en tenant l'appareil d'une
     * main dans un local. Et l'identité — « Campagne d'audit · service · site » — vit
     * dans la barre du haut, pas dans le voile : le voile porte le sujet, une fois.
     */
    const hero = (
        <DetailHero
            subject={selectedService || 'Périmètre à choisir'}
            status={heroStatus}
            metrics={heroMetrics}
            facts={heroFacts}
            note={heroNote}
        />
    );

    /**
     * Le pied d'acte — **l'ordre de la planche, et le jaune une seule fois**.
     *
     * Le scan est le geste jaune de l'écran, en pleine largeur. La clôture le précède
     * en second rang, et elle n'apparaît **pas du tout** tant qu'un écart attend : à sa
     * place, le bandeau qui dit ce qui manque. Un bouton grisé aurait redit la même
     * chose en donnant à croire qu'on peut cliquer. Sur une campagne clôturée il ne
     * reste que l'export, en neutre : plus rien à engager.
     */
    const footerActions = auditFinalized ? (
        <Button
            variant="outlined"
            onClick={exportRelevé}
            className="w-full"
            icon={<Icon glyph={Export} size={20} />}
        >
            Exporter le relevé
        </Button>
    ) : sessionStarted ? (
        <>
            {closureBlocked ? (
                <p className="rounded-card border-outline-variant bg-surface text-body-small text-on-surface flex items-start gap-2.5 border px-3.5 py-3">
                    <Icon
                        glyph={Warning}
                        size={18}
                        className="mt-px shrink-0 text-[var(--tk-color-st-orange)]"
                    />
                    <span>
                        <strong className="font-medium">
                            {pendingExceptions.length} écart
                            {pendingExceptions.length > 1 ? 's' : ''} à trancher
                        </strong>{' '}
                        avant de pouvoir clôturer. Un objet trouvé ici sans y être attendu ne peut
                        pas rester sans réponse.
                    </span>
                </p>
            ) : (
                <Button variant="outlined" onClick={handleFinalizeAudit} className="w-full">
                    Clôturer la campagne
                </Button>
            )}
            <Button
                variant="filled"
                onClick={() => setScanOpen(true)}
                className="w-full"
                icon={<Icon glyph={Scan} size={20} />}
            >
                Scanner — mode lot
            </Button>
        </>
    ) : (
        <Button
            variant="filled"
            onClick={startAuditSession}
            className="w-full"
            disabled={!scopeIsReady}
        >
            Lancer la campagne
        </Button>
    );

    return (
        <div className="bg-surface-container-low flex h-full flex-col">
            {isMobile ? (
                /* La barre du haut de la planche : retour · identité · débordement. Les onglets
                   n'y sont pas — ils descendent sous le héro, avec les puces qu'ils commandent
                   (§9.4 : la barre « Vue globale / Détails » disparaît, le Retour l'assume). */
                <div className="bg-surface border-outline-variant px-page-sm medium:px-page flex items-center gap-1 border-b py-1.5">
                    <Button
                        variant="text"
                        onClick={onBack}
                        className="text-on-surface-variant hover:text-on-surface h-11 w-11 min-w-0 shrink-0 rounded-full p-0"
                        icon={<Icon glyph={ArrowLeft} size={24} />}
                        aria-label="Retour"
                    />
                    {/* L'identité de l'écran vit ici — « Campagne d'audit », puis le périmètre.
                        Le héro porte le sujet, pas son étiquette : la dire deux fois volerait
                        une ligne au voile pour un fait qu'on a déjà lu. */}
                    <span className="min-w-0 flex-1 leading-tight">
                        <span className="text-on-surface block truncate text-[13px] font-medium">
                            Campagne d'audit
                        </span>
                        <span className="text-text-secondary block truncate text-[11px]">
                            {scopeCaption}
                        </span>
                    </span>
                    {overflowItems.length > 0 && (
                        <Menu
                            align="end"
                            items={overflowItems}
                            trigger={
                                <Button variant="text" iconOnly aria-label="Autres actions">
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    )}
                </div>
            ) : (
                <div className="bg-surface border-outline-variant px-page-sm medium:px-page flex items-center justify-between gap-3 border-b">
                    {/* **Le périmètre courant se lit dans la barre du haut** (16.1). Au
                        rail, la barre ne portait que les deux onglets : on ne savait pas
                        de quelle campagne on regardait les écarts. Le téléphone le disait
                        déjà — c'est le même fait, il ne dépend pas de la largeur. */}
                    <span className="min-w-0 shrink leading-tight">
                        <span className="text-on-surface block truncate text-[13px] font-medium">
                            Campagne d'audit
                        </span>
                        <span className="text-text-secondary block truncate text-[11px]">
                            {scopeCaption}
                        </span>
                    </span>
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
                    {overflowItems.length > 0 && (
                        <Menu
                            align="end"
                            items={overflowItems}
                            trigger={
                                <Button variant="text" iconOnly aria-label="Autres actions">
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    )}
                </div>
            )}

            {/* Plus de FAB, donc plus de dégagement bas à réserver : le pied d'acte est
                dans le flux, en fin de contenu. */}
            <div className="p-page-sm medium:p-page space-y-4 overflow-y-auto">
                {hero}

                {sessionTabs}

                {/* Le périmètre ne se choisit que hors campagne : une fois lancée, il est figé,
                    et le dire une fois vaut mieux que trois champs grisés sans explication. */}
                {!sessionStarted ? (
                    <div className="medium:grid-cols-3 grid grid-cols-1 gap-3">
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
                ) : null}

                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    resultCount={currentListCount}
                    placeholder="Rechercher par nom, asset ID, hostname..."
                />

                {activeTab !== 'exceptions' && (
                    <>
                        {parcChips}

                        {/* La légende de liste : le sujet à gauche, le compte à droite. */}
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-on-surface text-[15px] font-medium">
                                {listCaption().title}
                            </p>
                            <p className="text-body-small text-text-secondary shrink-0 tabular-nums">
                                {listCaption().count}
                            </p>
                        </div>

                        <section className="rounded-card border-outline-variant bg-surface border px-4">
                            {activeTab === 'todo' && renderEquipmentRows(filteredTodo, 'todo')}
                            {activeTab === 'scanned' &&
                                renderEquipmentRows(filteredScanned, 'scanned')}
                            {activeTab === 'missing' &&
                                renderEquipmentRows(filteredMissing, 'missing')}

                            {/* Les indices de la planche : ils ne paraissent que quand ils
                                s'appliquent. Une explication permanente devient du décor. */}
                            {activeTab === 'todo' &&
                                filteredTodo.some((item) => item.status === 'En réparation') && (
                                    <p className="border-outline-variant text-body-small text-on-surface-variant border-t py-3">
                                        <strong className="text-on-surface font-medium">
                                            L'actif en réparation reste à scanner.
                                        </strong>{' '}
                                        Il est attendu dans le service : c'est l'audit qui dit s'il
                                        y est encore, pas son statut.
                                    </p>
                                )}
                            {activeTab === 'scanned' && filteredScanned.length > 0 && (
                                <p className="border-outline-variant text-body-small text-on-surface-variant border-t py-3">
                                    L'heure remplace le statut : dans une campagne, ce qui compte
                                    est{' '}
                                    <strong className="text-on-surface font-medium">
                                        quand l'objet a été vu
                                    </strong>
                                    .
                                </p>
                            )}
                            {activeTab === 'missing' &&
                                auditFinalized &&
                                assignedMissingCount > 0 && (
                                    <p className="border-outline-variant text-body-small text-on-surface-variant border-t py-3">
                                        <strong className="text-on-surface font-medium">
                                            {assignedMissingCount} des {missingItems.length}{' '}
                                            manquants sont attribués.
                                        </strong>{' '}
                                        Leur porteur reste responsable : le manquant devrait ouvrir
                                        une tâche chez lui, et il ne s'efface pas avec la campagne.
                                        La file ne le fait pas encore — dette D3.
                                    </p>
                                )}
                        </section>
                    </>
                )}

                {/* L'écart est le seul objet propre à cet écran : une **carte à décision**.
                    Chaque écart porte son fait — où l'objet est enregistré, ou pourquoi il est
                    inconnu — **avant** ses gestes. Un écart sans son fait ne se tranche pas, il
                    se devine. Et le geste principal est sombre, pas jaune : le jaune est pris
                    par le scan, et ceci est une décision de ligne, pas l'acte de l'écran. */}
                {activeTab === 'exceptions' && (
                    <div className="space-y-3">
                        {/* La légende de l'onglet écarts : combien de décisions, et d'où elles viennent. */}
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-on-surface text-[15px] font-medium">
                                {pendingExceptions.length > 0
                                    ? `${pendingExceptions.length} décision${pendingExceptions.length > 1 ? 's' : ''} en attente`
                                    : sessionExceptions > 0
                                      ? `${sessionExceptions} écart${sessionExceptions > 1 ? 's' : ''} tranché${sessionExceptions > 1 ? 's' : ''}`
                                      : 'Aucun écart'}
                            </p>
                            <p className="text-body-small text-text-secondary shrink-0">
                                scannés hors campagne
                            </p>
                        </div>

                        {filteredExceptions.length === 0 ? (
                            <section className="rounded-card border-outline-variant bg-surface overflow-hidden border">
                                {renderEmptyList('exceptions')}
                            </section>
                        ) : (
                            filteredExceptions.map((entry) => {
                                const name =
                                    entry.result.equipmentName ||
                                    entry.payload.machineName ||
                                    entry.payload.hostname ||
                                    'Machine inconnue';
                                const code =
                                    entry.payload.assetId ||
                                    entry.payload.serialNumber ||
                                    entry.equipment?.assetId ||
                                    'code inconnu';
                                const isOutOfService =
                                    entry.result.resolution === 'found_out_of_service';
                                const registeredAt = entry.equipment
                                    ? [entry.equipment.department, entry.equipment.site]
                                          .filter(Boolean)
                                          .join(' · ')
                                    : '';

                                return (
                                    <section
                                        key={entry.id}
                                        className="rounded-card border-outline-variant bg-surface border px-4 py-3.5"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* La pastille de nature à gauche, comme le « pin » de la
                                                planche : elle dit d'un coup d'œil de quel genre d'écart
                                                il s'agit avant même de lire le code. */}
                                            <span
                                                className={cn(
                                                    'rounded-vignette bg-surface-container flex h-10 w-10 shrink-0 items-center justify-center',
                                                    isOutOfService
                                                        ? 'text-[var(--tk-color-st-orange)]'
                                                        : 'text-[var(--tk-color-st-bleu)]',
                                                )}
                                            >
                                                <Icon
                                                    glyph={
                                                        isOutOfService ? ArrowsLeftRight : Question
                                                    }
                                                    size={20}
                                                />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-on-surface truncate text-[15px] font-medium">
                                                    {code}
                                                </p>
                                                <p className="text-body-small text-text-secondary truncate">
                                                    {name} · scanné {formatSince(entry.timestamp)}
                                                </p>
                                            </div>
                                            {entry.resolved ? (
                                                <ExceptionMark
                                                    icon={CheckCircle}
                                                    label="tranché"
                                                    tone="positive"
                                                />
                                            ) : isOutOfService ? (
                                                <ExceptionMark
                                                    icon={ArrowsLeftRight}
                                                    label="hors service"
                                                    tone="attention"
                                                />
                                            ) : (
                                                <ExceptionMark
                                                    icon={PlusCircle}
                                                    label="nouveau"
                                                    tone="info"
                                                />
                                            )}
                                        </div>

                                        {/* Le fait, avant les gestes. */}
                                        <p className="text-body-small text-on-surface mt-2.5">
                                            {entry.resolved ? (
                                                entry.decision === 'attached' ? (
                                                    <>
                                                        Rattaché à{' '}
                                                        <strong className="font-medium">
                                                            {selectedService}
                                                        </strong>{' '}
                                                        {formatSince(entry.decidedAt)}. L'actif
                                                        compte désormais parmi les retrouvés.
                                                    </>
                                                ) : entry.decision === 'left' ? (
                                                    <>
                                                        Laissé à son service d'origine{' '}
                                                        {registeredAt ? (
                                                            <>
                                                                —{' '}
                                                                <strong className="font-medium">
                                                                    {registeredAt}
                                                                </strong>
                                                            </>
                                                        ) : null}
                                                        . Il était de passage ici.
                                                    </>
                                                ) : entry.decision === 'kept' ? (
                                                    <>
                                                        Fiche gardée et ouverte pour être complétée{' '}
                                                        {formatSince(entry.decidedAt)}. Elle est
                                                        rattachée au périmètre de la campagne.
                                                    </>
                                                ) : (
                                                    <>
                                                        Fiche écartée et retirée du parc. Le code
                                                        pourra être rescanné.
                                                    </>
                                                )
                                            ) : isOutOfService ? (
                                                <>
                                                    Cet actif est enregistré sur{' '}
                                                    <strong className="font-medium">
                                                        {registeredAt || 'un autre service'}
                                                    </strong>
                                                    . Il a été trouvé dans le local de{' '}
                                                    <strong className="font-medium">
                                                        {selectedService}
                                                    </strong>
                                                    . Vit-il ici ?
                                                </>
                                            ) : (
                                                <>
                                                    Aucune fiche ne portait ce code. Le scan a lu{' '}
                                                    <strong className="font-medium">{name}</strong>{' '}
                                                    sur l'étiquette — le reste de la fiche est à
                                                    saisir. Faut-il la garder ?
                                                </>
                                            )}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {entry.resolved ? (
                                                auditFinalized ? (
                                                    <span className="text-body-small text-on-surface-variant">
                                                        La campagne est clôturée : la décision est
                                                        figée.
                                                    </span>
                                                ) : (
                                                    <Button
                                                        variant="text"
                                                        size="sm"
                                                        onClick={() => undoException(entry.id)}
                                                        icon={
                                                            <Icon glyph={ArrowUUpLeft} size={16} />
                                                        }
                                                    >
                                                        {entry.decision === 'attached'
                                                            ? 'Annuler ce rattachement'
                                                            : 'Annuler cette décision'}
                                                    </Button>
                                                )
                                            ) : isOutOfService ? (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        size="sm"
                                                        onClick={() => leaveException(entry.id)}
                                                    >
                                                        Il reste là-bas
                                                    </Button>
                                                    <Button
                                                        variant="tonal"
                                                        size="sm"
                                                        onClick={() =>
                                                            attachException(
                                                                entry.id,
                                                                entry.equipment,
                                                            )
                                                        }
                                                        disabled={!entry.equipment}
                                                    >
                                                        Rattacher ici
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        size="sm"
                                                        onClick={() =>
                                                            discardException(
                                                                entry.id,
                                                                entry.equipment,
                                                            )
                                                        }
                                                    >
                                                        Écarter
                                                    </Button>
                                                    <Button
                                                        variant="tonal"
                                                        size="sm"
                                                        onClick={() =>
                                                            completeException(
                                                                entry.id,
                                                                entry.equipment,
                                                            )
                                                        }
                                                        disabled={!entry.equipment}
                                                    >
                                                        Compléter la fiche
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        {/* La ligne de conséquence, sous les gestes : ce que le geste écrit
                                            réellement. Le pictogramme la distingue du fait au-dessus. */}
                                        {!entry.resolved && (
                                            <p className="text-label-small text-on-surface-variant mt-2 flex items-start gap-2">
                                                <Icon
                                                    glyph={Info}
                                                    size={18}
                                                    className="mt-px shrink-0"
                                                />
                                                <span>
                                                    {isOutOfService
                                                        ? "« Rattacher » écrit l'emplacement dans la fiche — c'est une modification d'actif, elle est journalisée."
                                                        : 'La fiche existe déjà, créée du seul code lu : « Compléter » ouvre le formulaire de 04.3 pour le reste.'}
                                                </span>
                                            </p>
                                        )}
                                        {entry.resolved && !auditFinalized && (
                                            <p className="text-label-small text-on-surface-variant mt-2 flex items-start gap-2">
                                                <Icon
                                                    glyph={ArrowUUpLeft}
                                                    size={18}
                                                    className="mt-px shrink-0"
                                                />
                                                <span>
                                                    Annulable jusqu'à la clôture — après, la
                                                    décision est figée.
                                                </span>
                                            </p>
                                        )}
                                    </section>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Le pied d'acte, en pleine largeur et en fin de contenu : la planche n'a
                    pas de bouton flottant ici. Un FAB masque une rangée et impose un
                    dégagement bas ; le geste au fil du contenu se pose sous ce qu'il
                    concerne, et se lit avant d'être frappé. */}
                <div className="flex flex-col gap-2.5 pt-1">{footerActions}</div>
            </div>

            {/* C6 — le canevas de 17.3, en **mode lot** : la caméra ne se referme pas entre
                deux lectures, le compteur qualifie (« n sur m attendus ») et la clôture du lot
                est explicite. Ce composant ne décode rien par contrat : la lecture reste celle
                que ce produit possède réellement — la saisie du contenu du QR — et elle est
                atteinte par « Saisir à la main », l'affordance que la vue porte déjà. */}
            {scanOpen && (
                <div className="fixed inset-0 z-50 bg-[var(--tk-color-inverse-surface)]">
                    <ScanView
                        mode="batch"
                        onClose={() => setScanOpen(false)}
                        tip="Cadrez le QR collé sur l'actif. Le compteur monte à chaque lecture."
                        hits={scanHits}
                        expected={sessionTotal}
                        finishLabel="Terminer le lot"
                        onFinish={() => setScanOpen(false)}
                        onManualEntry={() => setManualOpen(true)}
                    />
                </div>
            )}

            <SideSheet
                open={manualOpen}
                onClose={() => setManualOpen(false)}
                title="Saisir le contenu du QR"
                description="Collez le contenu du QR généré par le script (JSON ou format clé=valeur)."
            >
                <div className="space-y-4">
                    <textarea
                        value={scanRawValue}
                        onChange={(e) => setScanRawValue(e.target.value)}
                        className="rounded-card border-outline-variant bg-surface text-body-medium text-on-surface focus:border-primary min-h-40 w-full border px-3 py-2 outline-none"
                        placeholder={`Exemple JSON:\n{\n  "assetId": "ASSET-10001",\n  "hostname": "PC-HQ-01",\n  "userEmail": "user@company.com"\n}`}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="text" onClick={() => setManualOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={handleSubmitScan}>
                            Enregistrer la lecture
                        </Button>
                    </div>
                </div>
            </SideSheet>
        </div>
    );
};

export default AuditDetailsPage;
