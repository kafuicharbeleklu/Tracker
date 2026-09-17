import React, { useMemo, useState, useEffect } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    ArrowLeft,
    ArrowsLeftRight,
    ArrowUUpLeft,
    CaretRight,
    CheckCircle,
    CircleDashed,
    CircleHalf,
    ClockCountdown,
    DotsThreeVertical,
    Export,
    Info,
    LockSimple,
    PlusCircle,
    QrCode,
    Question,
    Wrench,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import { useData } from '../../../context/DataContext';
import FacetChip from '../../../components/ui/FacetChip';
import { EmptyState } from '../../../components/ui/EmptyState';
import DetailHero, { type DetailMetrics } from '../../../components/ui/DetailHero';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import ListRow, { type ListRowStatus } from '../../../components/ui/ListRow';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import SideSheet from '../../../components/ui/SideSheet';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { parseAuditQrPayload } from '../../../lib/auditQr';
import { AUDIT_SCOPE_PREF_KEY } from '../../../lib/auditScope';
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
/**
 * Les partitions du parc — **des puces, pas des onglets** (16.2, et 17.8 : *« aucun
 * onglet dans le corpus »*). Un actif est *à scanner*, puis *retrouvé*, et *manquant*
 * seulement si la campagne se clôture sans lui : trois moments d'un même sujet.
 *
 * `horsSite` est le quatrième, et il n'existe qu'après la clôture : l'actif chez le
 * réparateur n'a pas été vu, mais son absence est justifiée — *« ni retrouvé ni
 * manquant »*. Le compter manquant accusait le porteur d'une perte que la fiche
 * expliquait déjà.
 */
type AuditTab = 'todo' | 'scanned' | 'missing' | 'horsSite';

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

/**
 * **La portée d'un comptage est un lieu** — 16.1 : *« le périmètre d'une campagne est un
 * site, ou un local quand le site en a »*. Elle portait un `service` : 16.1 ne lui en
 * envoie plus depuis le 06/09, si bien que l'écran ouvrait sur un périmètre vide.
 *
 * `local` absent **et** `horsLocal` faux : le site entier. `horsLocal` vrai : le site
 * **moins** ses locaux — le périmètre des 211 actifs que nulle pièce ne situe.
 */
interface AuditScope {
    country: string;
    site: string;
    local: string;
    horsLocal: boolean;
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
    local?: string;
    horsLocal?: boolean;
}

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
        upsertEquipmentFromAuditScan,
        removeEquipmentFromServiceAfterAudit,
        updateEquipment,
        deleteEquipment,
    } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const { navigateToItem } = useAppNavigation();
    const storedScope = useMemo(() => readStoredScope(), []);

    const [activeTab, setActiveTab] = useState<AuditTab>('todo');
    /**
     * **Les écarts sont un écran, pas un onglet** (16.2, colonne 2) : *« un détail de la
     * campagne, avec retour »*. On y entre par la carte de tension, et le retour ramène
     * au parc — pas à la vue globale.
     */
    const [vueEcarts, setVueEcarts] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    /**
     * **Les deux niveaux côte à côte, à partir de 1280** — 16.2, colonne bureau : *« la
     * campagne à gauche (7/12), les écarts à droite (5/12) : les cartes de décision
     * telles quelles, plus d'écran « Écarts » ni de carte de tension — la file est sous
     * les yeux, c'est elle qui tient lieu d'alerte »*.
     */
    const enDeuxNiveaux = useMediaQuery(MEDIA.twoColumn);
    const [scanRawValue, setScanRawValue] = useState('');
    const [scanHits, setScanHits] = useState<ScanHit[]>([]);
    const [auditStartedAt, setAuditStartedAt] = useState<string | null>(null);
    const [auditFinalized, setAuditFinalized] = useState(false);
    const [finalizedAt, setFinalizedAt] = useState<string | null>(null);
    const [baselineIds, setBaselineIds] = useState<string[]>([]);
    const [foundIds, setFoundIds] = useState<string[]>([]);
    const [foundAt, setFoundAt] = useState<Record<string, string>>({});
    const [missingIds, setMissingIds] = useState<string[]>([]);
    /** Le relevé fige aussi les absences justifiées : elles ne sont pas des manquants. */
    const [horsSiteSnapshot, setHorsSiteSnapshot] = useState<string[]>([]);
    const [exceptionEntries, setExceptionEntries] = useState<LocalExceptionEntry[]>([]);

    /**
     * **Le périmètre n'est pas un choix de cet écran.** La planche 16.2 ne dessine
     * aucun sélecteur : elle ouvre sur une campagne *déjà nommée* — « Support
     * Afrique · Campus Dakar » dans la barre du haut, le lieu au palier haut du
     * héro, et le sous-titre qui dit *« périmètre figé au démarrage »*.
     *
     * L'écran portait pourtant trois `SelectField` — pays, site, service —, hérités
     * de l'écran d'avant, où l'on composait sa portée sur place. C'est **16.1 qui
     * désigne le lieu** : sa rangée porte « Lancer », et c'est ce geste qui fixe le
     * triplet. Ici, il se lit ; il ne se compose plus. Les trois valeurs arrivent donc
     * de la portée posée à la navigation, une fois, et ne bougent plus de la vie de
     * l'écran — ce qui est exactement ce que « figé au démarrage » veut dire.
     */
    const selectedCountry = storedScope.country || '';
    const selectedSite = storedScope.site || '';
    const selectedLocal = storedScope.local || '';
    const selectedHorsLocal = Boolean(storedScope.horsLocal);
    /** Ce que le titre et les phrases nomment : le local s'il y en a un, sinon le site. */
    const selectedPlace = selectedHorsLocal
        ? `${selectedSite} — hors local`
        : selectedLocal || selectedSite;

    const scopedEquipment = useMemo(() => {
        if (!selectedCountry || !selectedSite) return [];
        return equipment.filter((item) => {
            if (item.country !== selectedCountry || item.site !== selectedSite) return false;
            if (selectedHorsLocal) return !(item.local || '').trim();
            if (!selectedLocal) return true;
            return (item.local || '').trim().toLowerCase() === selectedLocal.trim().toLowerCase();
        });
    }, [equipment, selectedCountry, selectedSite, selectedLocal, selectedHorsLocal]);

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

    /**
     * **Hors site, justifié** — 16.2 : *« 1 chez le réparateur, hors site justifié : ni
     * retrouvé ni manquant »*, et la puce du relevé clôturé le compte à part
     * (41 = 37 retrouvés + 3 manquants + 1 hors site).
     *
     * Pendant la campagne l'actif en réparation **reste à scanner** — c'est le relevé
     * qui dit s'il est là, pas son statut. C'est à la **clôture** que la distinction se
     * fait : ne pas l'avoir vu n'est pas l'avoir perdu, la fiche disait déjà où il est.
     */
    const horsSiteIds = useMemo(
        () =>
            baselineEquipment
                .filter((item) => !foundSet.has(item.id) && item.status === 'En réparation')
                .map((item) => item.id),
        [baselineEquipment, foundSet],
    );

    const horsSiteItems = useMemo(() => {
        if (!auditFinalized) return [];
        const byId = new Map(equipment.map((item) => [item.id, item]));
        return horsSiteSnapshot
            .map((id) => byId.get(id))
            .filter((item): item is Equipment => Boolean(item));
    }, [auditFinalized, equipment, horsSiteSnapshot]);

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

    /**
     * **Pas de recherche sur une campagne.** La planche 16.2 n'en dessine aucune, et
     * sa feuille de style n'en déclare même pas le rôle : les trois puces *sont* le
     * filtre, sur un parc borné au service et figé au démarrage. Chercher un code
     * dans une liste qu'on parcourt un objet à la main, scanner à la main, n'a pas
     * d'emploi — c'est le scan qui trouve, et il coche la rangée lui-même. La barre
     * de recherche héritée obligeait en plus le vide à raconter une cinquième
     * histoire (« rien ne correspond ») par-dessus les quatre de C5.
     */
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

    const scopeIsReady = Boolean(selectedCountry && selectedSite);
    const currentScope: AuditScope = {
        country: selectedCountry,
        site: selectedSite,
        local: selectedLocal,
        horsLocal: selectedHorsLocal,
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
        if (sessionStarted || !scopeIsReady) return;
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
    };

    /**
     * **La campagne s'ouvre déjà lancée.** « Lancer » est un geste de 16.1 : c'est la
     * rangée du lieu qui le porte, et l'écran qui s'ouvre derrière montre une
     * campagne *en cours* — « démarrée il y a 2 h », « périmètre figé au démarrage ».
     * Le relevé part donc à l'arrivée, sur la portée que la navigation a posée.
     *
     * Il ne part **pas** sur un service qui n'attend aucun actif : il n'y aurait rien
     * à parcourir, et le voile doit pouvoir dire « rien à auditer » plutôt que « en
     * cours » devant une liste vide.
     */
    useEffect(() => {
        if (sessionStarted || auditFinalized) return;
        if (!scopeIsReady || scopedEquipment.length === 0) return;
        startAuditSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditFinalized, scopeIsReady, scopedEquipment.length, sessionStarted]);

    /**
     * Abandonner le relevé — l'ancien « Réinitialiser », rendu à sa nature. Il jette
     * un travail en cours : il descend au débordement, sous son vrai verbe, et passe
     * par la confirmation de 17.2.
     */
    const abandonAuditSession = () => {
        requestConfirmation({
            title: `Abandonner le relevé de ${selectedPlace} ?`,
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

    const finalizeAuditSession = (missingSnapshot: Equipment[], horsSite: string[] = []) => {
        const closedAt = new Date().toISOString();
        setAuditFinalized(true);
        setFinalizedAt(closedAt);
        setMissingIds(missingSnapshot.map((item) => item.id));
        setHorsSiteSnapshot(horsSite);

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
            result.placeMatches &&
            baselineSourceIds.includes(result.equipmentId)
        ) {
            const equipmentId = result.equipmentId;
            setFoundIds((prev) => (prev.includes(equipmentId) ? prev : [...prev, equipmentId]));
            setFoundAt((prev) => ({ ...prev, [equipmentId]: new Date().toISOString() }));
        }

        if (result.resolution !== 'found_in_place') {
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
        } else {
            registerScanHit(
                result.equipmentName || scannedCode,
                scannedCode,
                'attendu — retrouvé',
                'expected',
            );
            setActiveTab('scanned');
        }

        if (result.resolution === 'found_out_of_place') {
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
            setVueEcarts(true);
            return;
        }

        /* Ce qui n'a pas été vu se sépare en deux : ce dont l'absence s'explique — la
           machine chez le réparateur — et ce dont elle ne s'explique pas. Seul le second
           devient un manquant. */
        const justifies = new Set(horsSiteIds);
        const missingSnapshot = todoItems.filter((item) => !justifies.has(item.id));
        if (missingSnapshot.length === 0) {
            finalizeAuditSession(missingSnapshot, horsSiteIds);
            return;
        }

        requestConfirmation({
            title: `Clôturer l'audit de ${selectedPlace} ?`,
            message: (
                <>
                    <strong>{missingSnapshot.length} actif(s) jamais scanné(s)</strong> seront
                    marqués manquants et retirés du lieu. Ils restent au parc, avec tout leur
                    historique, et réapparaîtront s'ils sont scannés ailleurs.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Clôturer',
            cancelText: 'Annuler',
            // Les trois lignes de la planche, et pas une de plus : chacune est une
            // conséquence, pas un commentaire. Le fait « dont attribués » n'est pas ici
            // — il vit sur l'écran clôturé, où il a une suite ; dans la confirmation, il
            // ferait une quatrième chose à peser au moment de décider.
            details: [
                { icon: CheckCircle, label: 'Retrouvés, inchangés', value: sessionFound },
                {
                    icon: Question,
                    label: 'Marqués manquants, retirés du lieu',
                    value: missingSnapshot.length,
                },
                {
                    icon: ArrowsLeftRight,
                    label: 'Écarts tranchés',
                    value: `${resolvedExceptions} sur ${sessionExceptions}`,
                },
                /* La quatrième ligne de `.conseq` — elle ne paraît que si elle a un
                   sujet : *« hors site justifié : ni retrouvé ni manquant »*. */
                ...(horsSiteIds.length > 0
                    ? [
                          {
                              icon: Wrench,
                              label: 'Hors site, justifié : ni retrouvé ni manquant',
                              value: horsSiteIds.length,
                          },
                      ]
                    : []),
            ],
            onConfirm: () => finalizeAuditSession(missingSnapshot, horsSiteIds),
        });
    };

    /** « Rattacher ici » — écrit l'emplacement dans la fiche. C'est une modification d'actif, journalisée. */
    const attachException = (entryId: string, item: Equipment | undefined) => {
        if (!item) return;

        const previousScope: AuditScope = {
            country: item.country || '',
            site: item.site || '',
            local: item.local || '',
            horsLocal: !(item.local || '').trim(),
        };

        updateEquipment(
            item.id,
            {
                country: selectedCountry,
                site: selectedSite,
                local: selectedLocal,
            },
            {
                source: 'audit_scan_alignment',
                scopeCountry: selectedCountry,
                scopeSite: selectedSite,
                scopeLocal: selectedHorsLocal ? '' : selectedLocal,
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
        showToast(`${item.name} rattaché à ${selectedPlace}.`, 'success');
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
        showToast('Écart tranché : l’actif reste rattaché à son lieu d’origine.', 'info');
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
                    /* On rend le **lieu** d'origine, pas le service : c'est le lieu que
                       « Rattacher ici » avait écrit, et lui seul qu'il faut défaire. */
                    local: entry.previousScope.local,
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

        const filename = `releve_audit_${selectedPlace || 'lieu'}_${new Date().toISOString().split('T')[0]}.csv`;
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
    const renderEmptyList = (scope: AuditTab | 'exceptions') => {
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
                    title="Ce lieu n'attend aucun actif"
                    description="Il n'y a rien à compter ici : aucun actif du parc n'est situé dans ce périmètre."
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
                    description="La campagne s'est clôturée sans perte : tout ce que le lieu attendait a été retrouvé."
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
                description="Tout ce qui a été scanné était attendu dans ce lieu. Rien à trancher."
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
    const renderEquipmentRows = (
        rows: Equipment[],
        mode: 'todo' | 'scanned' | 'missing' | 'horsSite',
    ) => {
        if (rows.length === 0) return renderEmptyList(mode);

        return rows.map((item) => {
            const holder = item.user?.name || 'non attribué';
            const mark: ListRowStatus =
                mode === 'scanned'
                    ? { icon: CheckCircle, label: formatSince(foundAt[item.id]), tone: 'positive' }
                    : mode === 'missing'
                      ? { icon: Question, label: 'manquant', tone: 'attention' }
                      : mode === 'horsSite'
                        ? { icon: Wrench, label: 'hors site', tone: 'pending' }
                        : { icon: CircleDashed, label: 'à scanner', tone: 'muted' };

            return (
                <ListRow
                    key={item.id}
                    vignette={<Icon glyph={getCategoryGlyph(item.type)} size={20} />}
                    title={item.assetId}
                    /* **Le local en bout de rangée, au bureau** — 16.2 : la colonne est
                       assez large pour dire *où* l'objet est attendu, et c'est ce qu'on
                       cherche quand on parcourt un site entier. */
                    type={enDeuxNiveaux ? item.local : undefined}
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
     * objet que le lieu n'attendait pas.
     *
     * Les puces filtrent le même parc ; l'onglet change de sujet.
     */
    /** « 2 rattachés, 1 écarté » — ce que la carte tranchée dit d'elle-même. */
    const repartitionDesEcarts = useMemo(() => {
        const compte = { attached: 0, left: 0, kept: 0, discarded: 0 };
        exceptionEntries.forEach((entry) => {
            if (entry.resolved && entry.decision) compte[entry.decision] += 1;
        });
        const morceaux: string[] = [];
        if (compte.attached > 0)
            morceaux.push(`${compte.attached} rattaché${compte.attached > 1 ? 's' : ''}`);
        if (compte.kept > 0) morceaux.push(`${compte.kept} complété${compte.kept > 1 ? 's' : ''}`);
        if (compte.left > 0)
            morceaux.push(`${compte.left} laissé${compte.left > 1 ? 's' : ''} là-bas`);
        if (compte.discarded > 0)
            morceaux.push(`${compte.discarded} écarté${compte.discarded > 1 ? 's' : ''}`);
        return morceaux.join(', ') || 'aucune décision';
    }, [exceptionEntries]);

    /**
     * `.tens` — **la carte de tension.** L'écart est une file de décisions, pas une vue :
     * trois objets trouvés ici sans y être attendus, contre quarante et un à parcourir.
     * Il prend donc la place où l'œil va — une carte ambre en tête du parc, qui ouvre les
     * cartes de décision — et **il n'existe pas quand il n'y a rien à trancher**.
     *
     * Il était un onglet, à côté du parc. 17.8 a retiré le slot du corpus le 06/09 :
     * *« là où une partition exclusive existe, elle est en chips dans la feuille de
     * filtre »* — et ici l'écart n'est même pas une partition du parc, c'est un autre
     * sujet. La planche le dessine en carte, et l'écran des écarts a son propre retour.
     */
    const carteDeTension =
        sessionExceptions === 0 ? null : (
            <button
                type="button"
                onClick={() => setVueEcarts(true)}
                className={cn(
                    'flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left',
                    closureBlocked
                        ? 'bg-tint-ambre text-on-tint-ambre'
                        : /* `.tens.done` — la surface seule : la planche n'y met pas
                             d'ombre, et l'écart tranché n'est plus une alerte. */
                          'bg-surface text-on-surface',
                )}
            >
                <span
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                        closureBlocked
                            ? 'bg-white/55 text-[color:inherit]'
                            : 'bg-tint-vert text-on-tint-vert',
                    )}
                >
                    <Icon glyph={closureBlocked ? ArrowsLeftRight : CheckCircle} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] leading-6">
                        {closureBlocked
                            ? `${pendingExceptions.length} objet${pendingExceptions.length > 1 ? 's' : ''} non attendu${pendingExceptions.length > 1 ? 's' : ''} ici`
                            : `${resolvedExceptions} écart${resolvedExceptions > 1 ? 's' : ''} tranché${resolvedExceptions > 1 ? 's' : ''}`}
                    </span>
                    <span
                        className={cn(
                            'block truncate text-[14px] leading-5',
                            closureBlocked ? 'opacity-80' : 'text-on-surface-variant',
                        )}
                    >
                        {closureBlocked ? 'à trancher avant de clôturer' : repartitionDesEcarts}
                    </span>
                </span>
                {closureBlocked ? (
                    /* `.go` — le geste de la carte est **sombre**, pas jaune : le jaune de
                       l'écran est pris par le scan, et ceci mène à une décision. */
                    <span className="bg-inverse-surface text-inverse-on-surface flex h-10 shrink-0 items-center rounded-sm px-3.5 text-[15px] font-medium">
                        Trancher
                    </span>
                ) : (
                    <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
                )}
            </button>
        );

    /**
     * Les trois moments du même parc — et il n'y en a que deux sur une campagne
     * clôturée : « plus de scan, plus de puce à scanner, une seule sortie ». La puce
     * « Manquants » reste visible pendant la campagne, à zéro : c'est le même fait,
     * montré au bon moment (C1).
     */
    const parcChips = (
        <div className="-mr-page-sm medium:-mr-page pr-page-sm medium:pr-page flex [scrollbar-width:none] gap-2 overflow-x-auto">
            {(
                [
                    ...(auditFinalized
                        ? []
                        : [['todo', 'À scanner', todoItems.length, CircleDashed] as const]),
                    ['scanned', 'Retrouvés', scannedItems.length, CheckCircle],
                    ['missing', 'Manquants', missingItems.length, Question],
                    /* La quatrième puce n'a de sujet qu'après la clôture, et seulement
                       s'il y a eu une absence justifiée à mettre à part. */
                    ...(auditFinalized && horsSiteItems.length > 0
                        ? [
                              [
                                  'horsSite',
                                  'Hors site, justifié',
                                  horsSiteItems.length,
                                  Wrench,
                              ] as const,
                          ]
                        : []),
                ] as ReadonlyArray<readonly [AuditTab, string, number, PhosphorGlyph]>
            ).map(([id, label, count]) => (
                /* `.chip` de 16.2 — **36 de haut, 14 sur 20, sur fond de surface, sans
                   pictogramme**. Les trois pastilles tenaient 434 px pour 361 de page : la
                   troisième, « Manquants », sortait de l'écran. Le pictogramme doublait un
                   mot qui se suffit — « À scanner » n'a pas besoin d'un cercle pointillé
                   pour se comprendre —, et la planche n'en met pas. */
                <FacetChip
                    key={id}
                    label={label}
                    count={count}
                    compact
                    onCanvas
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
            /* V4 : `circle-dashed` **neutre** — « rien à auditer » est un état de
               donnée, pas une alerte de campagne. */
            return { icon: CircleDashed, label: 'rien à auditer' };
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
    /**
     * **La ligne d'état, et la ligne de portée** — l'ordre de la planche, qui est
     * aussi celui de R3 : l'état, *puis le fait qui situe*, puis le sujet, puis les
     * qualifiants. Ces deux phrases descendaient sous les métriques, dans deux blocs
     * à filet et à pictogramme : le voile faisait deux fois sa hauteur pour dire la
     * même chose, et le sujet se retrouvait au milieu au lieu d'être en tête.
     */
    const heroStatusDetail = auditFinalized
        ? `par vous, ${formatSince(finalizedAt || undefined)}`
        : sessionStarted
          ? `démarrée ${formatSince(auditStartedAt || undefined)}`
          : undefined;

    const heroSubtitle = auditFinalized
        ? `Campagne du ${formatDateTime(finalizedAt || undefined)}`
        : sessionStarted
          ? `Périmètre figé au démarrage${
                lastScanAt ? ` · dernier scan ${formatSince(lastScanAt)}` : ' · aucun scan'
            }`
          : scopeIsReady
            ? `${selectedSite} · ${selectedCountry}`
            : undefined;

    /**
     * La couverture, en barre puis en clair — « 34 sur 41 · 83 % ». C'est le seul
     * endroit où elle vit : la carte de progression qui la redisait sous le héro est
     * tombée avec les tuiles (corollaire R3).
     */
    const heroGauge = sessionStarted ? (
        <>
            {/* `.prog` de 16.2 — **6 de haut, rayon 2**, sur le voile blanc à 12 %.
                Elle portait le rayon plein : une jauge de campagne n'est pas une pilule,
                et les quatre autres du produit (15.1, 16.1, 02.2) sont carrées. */}
            <span
                aria-hidden="true"
                className="block h-1.5 overflow-hidden rounded-xs bg-white/[0.12]"
            >
                {/* La jauge prend l'encre de la surface inversée, pas une couleur
                    d'état : elle mesure une avancée, elle ne qualifie rien. Le vert
                    disait « tout va bien » à 12 % de relevé. */}
                <span
                    className="bg-inverse-on-surface block h-full"
                    style={{ width: `${progressPercentage}%` }}
                />
            </span>
            {/* `.pk` — 12 sur 16 en encre estompée, comme la ligne de lecture de 16.1
                et de 15.1. Elle prenait le corps de la page, 14 sur 21 : une mesure qui
                n'est sur aucune marche, et deux points de plus que la clé des tuiles
                juste au-dessus. */}
            <span className="mt-2 block text-[12px] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
                {sessionFound} sur {sessionTotal} · {progressPercentage} %
                {auditFinalized &&
                    sessionExceptions > 0 &&
                    ` · ${resolvedExceptions} écart${resolvedExceptions > 1 ? 's' : ''} tranché${resolvedExceptions > 1 ? 's' : ''}`}
            </span>
        </>
    ) : undefined;

    /**
     * Le ⋮ de la barre — **l'ordre de la planche** : exporter, clôturer, abandonner.
     *
     * *« Le ⋮ s'ouvre au tap : Exporter, Abandonner ; Clôturer n'y entre qu'une fois les
     * écarts tranchés. »* La clôture vivait en pied de contenu, en second bouton, avec un
     * bandeau à sa place quand un écart bloquait. Deux formes pour un même acte selon
     * qu'il est possible ou non : la planche n'en garde qu'une, et **l'entrée disparaît**
     * — c'est la carte de tension, en tête du parc, qui dit ce qui manque pour l'obtenir.
     */
    const overflowItems: MenuItem[] = useMemo(() => {
        const items: MenuItem[] = [];
        if (sessionStarted) {
            items.push({
                id: 'export-releve',
                label: 'Exporter le relevé',
                description: 'le parc, son état et l’heure de chaque lecture',
                icon: 'download',
                onSelect: exportRelevé,
            });
        }
        if (sessionStarted && !auditFinalized && !closureBlocked) {
            items.push({
                id: 'finalize-session',
                label: 'Clôturer la campagne',
                description: 'les jamais scannés passent manquants ; sans retour',
                icon: 'lock',
                destructive: true,
                onSelect: handleFinalizeAudit,
            });
        }
        if (sessionStarted && !auditFinalized) {
            items.push({
                id: 'abandon-session',
                label: 'Abandonner la campagne',
                description: 'jette les scans en cours ; aucun actif modifié',
                icon: 'restart_alt',
                destructive: true,
                onSelect: abandonAuditSession,
            });
        }
        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sessionStarted,
        auditFinalized,
        closureBlocked,
        sessionFound,
        sessionExceptions,
        selectedPlace,
    ]);

    /* Au bureau, l'export a son bouton nommé dans l'en-tête : le laisser aussi dans le
       ⋮ donnerait deux portes au même acte, à trois centimètres l'une de l'autre. */
    const overflowAffiche = enDeuxNiveaux
        ? overflowItems.filter((item) => item.id !== 'export-releve')
        : overflowItems;

    /**
     * Le héro **ne porte aucun geste** : la planche les pose en pied de contenu, en
     * pleine largeur, parce qu'on les atteint avec le pouce en tenant l'appareil d'une
     * main dans un local. Et l'identité — « Campagne d'audit · service · site » — vit
     * dans la barre du haut, pas dans le voile : le voile porte le sujet, une fois.
     */
    /** La vue globale : c'est là que se choisit le lieu, et nulle part ailleurs. */
    const backToOverview = () => {
        if (typeof onViewChange === 'function') {
            onViewChange('audit');
            return;
        }
        onBack();
    };

    const hero = (
        <DetailHero
            /* `.ty` — l'état est dans le surtitre, pas en pastille : « Inventaire
               physique · en cours ». La planche ne dessine pas de badge ici. */
            label={`Inventaire physique · ${heroStatus.label}`}
            subject={selectedPlace || 'Périmètre à choisir'}
            metrics={heroMetrics}
            metricsStyle="boxes"
            statusDetail={heroStatusDetail}
            subtitle={heroSubtitle}
            gauge={heroGauge}
            /* Au bureau le geste tient sa mesure : 16.2 le pose à côté du sujet, pas
               en barre sous la jauge. */
            actionsInline={enDeuxNiveaux}
            /* `.hact` — **le scan est le geste du héro**, et le seul jaune de l'écran.
               Il vivait en pied de contenu, sous quarante rangées : dans un local, on
               tient l'appareil d'une main et on scanne — ce geste-là ne se cherche pas.
               Une campagne clôturée n'en a plus : la barre du haut porte l'export. */
            /* **Pas de scan au bureau** — 17.11 : *« le geste de la caméra reste au
               téléphone ; au bureau, le héro dit “Saisir un code” »*. Le geste ne
               disparaît pas, il change de porte : la même saisie, celle qui accepte
               aussi le contenu d'un QR, sans passer par une caméra qu'un poste fixe
               n'a pas. */
            actions={
                sessionStarted && !auditFinalized ? (
                    <Button
                        variant="filled"
                        onClick={() => (enDeuxNiveaux ? setManualOpen(true) : setScanOpen(true))}
                        icon={<Icon glyph={QrCode} size={20} />}
                    >
                        {enDeuxNiveaux ? 'Saisir un code' : 'Scanner'}
                    </Button>
                ) : undefined
            }
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
     *
     * **Et rien du tout avant le premier scan** : C3 veut *« une campagne ouverte n'a
     * plus de bouton de démarrage »*. Le « Lancer la campagne » qui restait ici était
     * le second exemplaire du geste que 16.1 porte déjà sur sa rangée — donc un même
     * acte à deux endroits, et un écran qui s'ouvrait en attendant qu'on répète ce
     * qu'on venait de dire. Le seul cas où le pied est vide est celui du service qui
     * n'attend aucun actif : il n'y a rien à engager, et la liste le dit.
     */
    /**
     * **Le pied d'acte n'existe plus** — 16.2 ne dessine aucun `.pfoot`. Ses trois
     * contenus sont retournés là où la planche les pose : le **scan** dans le héro
     * (`.hact`, le seul jaune), la **clôture** dans le ⋮ une fois les écarts tranchés,
     * et le bandeau « n écarts à trancher » remplacé par la **carte de tension**, en
     * tête du parc, qui dit la même chose *et* mène à l'endroit où trancher. L'export
     * d'une campagne close est dans la barre du haut.
     */

    return (
        /* **Le canevas derrière les cartes.** `surface-container-low` vaut exactement
           `surface` dans les jetons du produit : la page se peignait donc de la couleur
           de ses propres cartes, et seule une ombre — qu'aucune planche ne déclare — les
           détachait. `.phone` de 16.2 est sur le canevas, `.card` sur la surface. */
        <div className="bg-background flex h-full flex-col">
            {/* `.tbar` — **une barre de 56, la même à toutes les largeurs** : retour,
                l'identité de l'écran, le débordement. Les onglets « Vue globale / Détails »
                en sont partis avec 17.8 (*« aucun onglet dans le corpus »*) : le retour dit
                déjà d'où l'on vient, et il le disait mieux qu'un onglet qui restait allumé.

                Le titre est **« Campagne »**, pas « Campagne d'audit · Salle serveur · Togo » :
                le héro porte le sujet et sa portée, juste dessous. La barre les redisait en
                11 px, sous le titre — deux fois le même fait, dont une fois trop petit. */}
            {enDeuxNiveaux ? (
                /*
                  `.dhead.fiche` de 17.11 — **le lieu devient le titre de la page**, son
                  fil dessous, l'export en acte nommé et le ⋮ pour le reste. Sans filet :
                  le chrome du bureau n'en pose pas sous l'en-tête.
                */
                <div className="px-page flex min-h-10 items-center gap-2 pt-5">
                    <Button
                        variant="text"
                        iconOnly
                        onClick={onBack}
                        aria-label="Retour"
                        className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface -ml-2.5 h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 shrink-0 rounded-md"
                    >
                        <Icon glyph={ArrowLeft} size={20} />
                    </Button>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-brand text-on-surface truncate text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {selectedPlace || 'Campagne'}
                        </h1>
                        <span className="text-on-surface-variant block truncate text-[13px] leading-4">
                            Inventaire physique › {heroStatus.label}
                        </span>
                    </div>
                    {sessionStarted && (
                        /* `.hbtn.g` — l'export est un acte nommé au bureau ; il quitte
                           donc le ⋮, où il ferait doublon. */
                        <Button
                            variant="outlined"
                            onClick={exportRelevé}
                            icon={<Icon glyph={Export} size={20} />}
                            className="h-10 min-h-10 shrink-0 gap-2 rounded-md px-3 text-[14px] font-medium shadow-none"
                        >
                            Exporter
                        </Button>
                    )}
                    {overflowAffiche.length > 0 && (
                        <Menu
                            align="end"
                            items={overflowAffiche}
                            trigger={
                                <Button
                                    variant="text"
                                    iconOnly
                                    aria-label="Autres actes"
                                    className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 shrink-0 rounded-md"
                                >
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    )}
                </div>
            ) : (
                <div className="bg-surface border-outline-variant border-b">
                    <Reading className="flex min-h-14 items-center gap-1 px-1 pr-2">
                        <Button
                            variant="text"
                            onClick={vueEcarts ? () => setVueEcarts(false) : onBack}
                            className="text-on-surface h-12 w-12 min-w-0 shrink-0 rounded-md p-0"
                            icon={<Icon glyph={ArrowLeft} size={24} />}
                            aria-label="Retour"
                        />
                        <span className="font-brand text-on-surface min-w-0 flex-1 truncate px-1 text-[17px] leading-6 font-semibold tracking-[-0.01em]">
                            {vueEcarts ? 'Écarts' : 'Campagne'}
                        </span>
                        {/* Après la clôture il n'y a plus rien à décider : le débordement se
                        vide, et la barre porte le seul geste qui reste. */}
                        {auditFinalized ? (
                            <Button
                                variant="text"
                                iconOnly
                                onClick={exportRelevé}
                                aria-label="Exporter le relevé"
                            >
                                <Icon glyph={Export} size={20} />
                            </Button>
                        ) : (
                            !vueEcarts &&
                            overflowItems.length > 0 && (
                                <Menu
                                    align="end"
                                    items={overflowItems}
                                    trigger={
                                        <Button variant="text" iconOnly aria-label="Autres actes">
                                            <Icon glyph={DotsThreeVertical} size={20} />
                                        </Button>
                                    }
                                />
                            )
                        )}
                    </Reading>
                </div>
            )}

            {/* Plus de FAB, donc plus de dégagement bas à réserver : le pied d'acte est
                dans le flux, en fin de contenu. */}
            {/* **La mesure de lecture du système — 960 px** (§2.43). L'écran s'étirait
                sur toute la fenêtre alors que la vue globale d'où l'on vient s'arrête à
                960 : on ouvrait un service et la page changeait de largeur sous le
                doigt. Une largeur, une seule, et le reste est de la marge. */}
            <div className="overflow-y-auto">
                {/* **Deux zones au bureau** — 7 douzièmes pour la campagne, 5 pour les
                    écarts (16.2). En deçà de 1280, la mesure de lecture reprend : une
                    colonne de 960, et les écarts derrière leur carte de tension. */}
                <div
                    className={cn(
                        'p-page-sm medium:p-page w-full',
                        enDeuxNiveaux
                            ? 'flex items-start gap-4'
                            : 'mx-auto max-w-[960px] space-y-4',
                    )}
                >
                    {!scopeIsReady ? (
                        /* **Une campagne sans service n'est pas une campagne.** L'écran
                       n'ouvre plus trois sélecteurs pour s'en composer une : il renvoie
                       à la liste qui les porte déjà, avec ses statuts et ses comptes. */
                        <EmptyState
                            icon="pin_drop"
                            title="Aucune campagne ouverte"
                            description="Une campagne porte sur un lieu, et c'est la vue globale qui le désigne : sa rangée dit ce qui reste à vérifier, et son geste lance le relevé."
                            action={
                                <Button variant="filled" onClick={backToOverview}>
                                    Choisir un lieu à compter
                                </Button>
                            }
                        />
                    ) : (
                        <>
                            {/* **Le parc et les écarts sont deux écrans**, pas deux onglets :
                                la carte de tension mène à l'un, son retour ramène à l'autre. */}
                            {(!vueEcarts || enDeuxNiveaux) && (
                                <div
                                    className={cn(
                                        'space-y-4',
                                        enDeuxNiveaux && 'min-w-0 shrink grow-[7] basis-0',
                                    )}
                                >
                                    {hero}

                                    {/* La carte de tension **n'existe pas au bureau** : elle
                                        mène aux écarts, et les écarts sont déjà à droite.
                                        Une alerte qui pointe vers ce qu'on regarde est du
                                        décor. */}
                                    {!enDeuxNiveaux && carteDeTension}

                                    {parcChips}

                                    {/* La légende de liste : le sujet à gauche, le compte à droite. */}
                                    {/* `.ord` — rentrée de **4**, comme la ligne de compte
                                        de toutes les listes ; elle l'était de 2. */}
                                    <div className="text-body-small flex items-baseline justify-between gap-3 px-1">
                                        <p className="text-text-secondary">{listCaption().title}</p>
                                        <p className="text-text-muted shrink-0 tabular-nums">
                                            {listCaption().count}
                                        </p>
                                    </div>

                                    {/* `.card` de 16.2 — surface, rayon 8, **4 / 16**, et
                                        pas d'ombre : aucune planche n'en déclare sur une
                                        carte de rangées. */}
                                    <section className="rounded-card bg-surface px-4 py-1">
                                        {activeTab === 'todo' &&
                                            renderEquipmentRows(todoItems, 'todo')}
                                        {activeTab === 'scanned' &&
                                            renderEquipmentRows(scannedItems, 'scanned')}
                                        {activeTab === 'missing' &&
                                            renderEquipmentRows(missingItems, 'missing')}
                                        {activeTab === 'horsSite' &&
                                            renderEquipmentRows(horsSiteItems, 'horsSite')}

                                        {/* Les indices de la planche : ils ne paraissent que quand ils
                                s'appliquent. Une explication permanente devient du décor. */}
                                        {activeTab === 'todo' &&
                                            todoItems.some(
                                                (item) => item.status === 'En réparation',
                                            ) && (
                                                <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                                                    <strong className="text-on-surface font-medium">
                                                        L'actif en réparation reste à scanner.
                                                    </strong>{' '}
                                                    Il est attendu dans le lieu : c'est le relevé
                                                    qui dit s'il y est, pas son statut. À la
                                                    clôture, ne pas l'avoir vu ne le rendra pas
                                                    manquant — son absence est justifiée.
                                                </p>
                                            )}
                                        {activeTab === 'scanned' && scannedItems.length > 0 && (
                                            <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                                                L'heure remplace le statut : dans une campagne, ce
                                                qui compte est{' '}
                                                <strong className="text-on-surface font-medium">
                                                    quand l'objet a été vu
                                                </strong>
                                                .
                                            </p>
                                        )}
                                        {activeTab === 'horsSite' && horsSiteItems.length > 0 && (
                                            <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                                                <strong className="text-on-surface font-medium">
                                                    Ni retrouvés, ni manquants.
                                                </strong>{' '}
                                                Ces actifs sont chez le réparateur : leur absence du
                                                lieu s'explique, et la clôture ne les accuse pas.
                                            </p>
                                        )}
                                        {activeTab === 'missing' &&
                                            auditFinalized &&
                                            assignedMissingCount > 0 && (
                                                <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                                                    <strong className="text-on-surface font-medium">
                                                        {assignedMissingCount} des{' '}
                                                        {missingItems.length} manquants sont
                                                        attribués.
                                                    </strong>{' '}
                                                    Leur porteur reste responsable : le manquant
                                                    devrait ouvrir une tâche chez lui, et il ne
                                                    s'efface pas avec la campagne. La file ne le
                                                    fait pas encore — dette D3.
                                                </p>
                                            )}
                                    </section>
                                </div>
                            )}

                            {/* L'écart est le seul objet propre à cet écran : une **carte à décision**.
                    Chaque écart porte son fait — où l'objet est enregistré, ou pourquoi il est
                    inconnu — **avant** ses gestes. Un écart sans son fait ne se tranche pas, il
                    se devine. Et le geste principal est sombre, pas jaune : le jaune est pris
                    par le scan, et ceci est une décision de ligne, pas l'acte de l'écran. */}
                            {(vueEcarts || enDeuxNiveaux) && (
                                <div
                                    className={cn(
                                        'space-y-3',
                                        enDeuxNiveaux && 'min-w-0 shrink grow-[5] basis-0',
                                    )}
                                >
                                    {enDeuxNiveaux ? (
                                        /* `.panh` — au bureau, les écarts sont une colonne,
                                           pas un écran : elle porte son nom et son reste à
                                           faire, comme une file. */
                                        <div className="flex min-h-10 items-center gap-3 px-1">
                                            <h2 className="font-brand text-on-surface min-w-0 flex-1 text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                                                Écarts
                                            </h2>
                                            <span className="text-on-surface-variant shrink-0 text-[13px] leading-4 tabular-nums">
                                                {pendingExceptions.length > 0
                                                    ? `${pendingExceptions.length} à trancher`
                                                    : 'aucun à trancher'}
                                                {sessionExceptions - pendingExceptions.length > 0
                                                    ? ` · ${sessionExceptions - pendingExceptions.length} tranché${sessionExceptions - pendingExceptions.length > 1 ? 's' : ''}`
                                                    : ''}
                                            </span>
                                        </div>
                                    ) : (
                                        /* La légende de l'onglet écarts : combien de décisions, et d'où elles viennent. */
                                        <div className="text-body-small flex items-baseline justify-between gap-3 px-1">
                                            <p className="text-text-secondary">
                                                {pendingExceptions.length > 0
                                                    ? `${pendingExceptions.length} décision${pendingExceptions.length > 1 ? 's' : ''} en attente`
                                                    : sessionExceptions > 0
                                                      ? `${sessionExceptions} écart${sessionExceptions > 1 ? 's' : ''} tranché${sessionExceptions > 1 ? 's' : ''}`
                                                      : 'Aucun écart'}
                                            </p>
                                            <p className="text-text-muted shrink-0">
                                                scannés hors attendus
                                            </p>
                                        </div>
                                    )}

                                    {exceptionsDisplay.length === 0
                                        ? /* Le vide d'un onglet n'est pas une carte : la carte
                                           est ce qui porte un écart, et il n'y en a aucun. */
                                          renderEmptyList('exceptions')
                                        : exceptionsDisplay.map((entry) => {
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
                                                  entry.result.resolution === 'found_out_of_place';
                                              /* Où la fiche dit que l'actif vit —
                                                 **un lieu**, pas un service : c'est ce
                                                 qu'on compare à l'endroit où on l'a
                                                 trouvé (16.1). */
                                              const registeredAt = entry.equipment
                                                  ? [entry.equipment.local, entry.equipment.site]
                                                        .filter(Boolean)
                                                        .join(' · ')
                                                  : '';

                                              return (
                                                  <section
                                                      key={entry.id}
                                                      /* `.ec` de 16.2 — **16 / 20**, sans ombre. */
                                                      className="rounded-card bg-surface px-5 py-4"
                                                  >
                                                      <div className="flex items-center gap-3">
                                                          {/* La pastille de nature à gauche, comme le « pin » de la
                                                planche : elle dit d'un coup d'œil de quel genre d'écart
                                                il s'agit avant même de lire le code. */}
                                                          <span
                                                              className={cn(
                                                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                                  isOutOfService
                                                                      ? 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-st-orange)]'
                                                                      : 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-st-bleu)]',
                                                              )}
                                                          >
                                                              <Icon
                                                                  glyph={
                                                                      isOutOfService
                                                                          ? ArrowsLeftRight
                                                                          : Question
                                                                  }
                                                                  size={20}
                                                              />
                                                          </span>
                                                          <div className="min-w-0 flex-1">
                                                              <p className="font-brand text-on-surface truncate text-[16px] font-semibold tracking-[-0.01em]">
                                                                  {code}
                                                              </p>
                                                              <p className="text-body-small text-text-secondary truncate">
                                                                  {name} · scanné{' '}
                                                                  {formatSince(entry.timestamp)}
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
                                                                  label="hors lieu"
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

                                                      {/* Le fait, avant les gestes — et sur le creux que la
                                            planche lui donne : ce n'est pas la suite de la carte,
                                            c'est le relevé sur lequel on va trancher. */}
                                                      <p className="bg-surface-container text-body-small text-on-surface mt-3 rounded-sm px-3 py-2.5">
                                                          {entry.resolved ? (
                                                              entry.decision === 'attached' ? (
                                                                  <>
                                                                      Rattaché à{' '}
                                                                      <strong className="font-medium">
                                                                          {selectedPlace}
                                                                      </strong>{' '}
                                                                      {formatSince(entry.decidedAt)}
                                                                      . L'actif compte désormais
                                                                      parmi les retrouvés.
                                                                  </>
                                                              ) : entry.decision === 'left' ? (
                                                                  <>
                                                                      Laissé à son lieu d'origine{' '}
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
                                                                      Fiche gardée et ouverte pour
                                                                      être complétée{' '}
                                                                      {formatSince(entry.decidedAt)}
                                                                      . Elle est rattachée au
                                                                      périmètre de la campagne.
                                                                  </>
                                                              ) : (
                                                                  <>
                                                                      Fiche écartée et retirée du
                                                                      parc. Le code pourra être
                                                                      rescanné.
                                                                  </>
                                                              )
                                                          ) : isOutOfService ? (
                                                              <>
                                                                  Cet actif est enregistré sur{' '}
                                                                  <strong className="font-medium">
                                                                      {registeredAt ||
                                                                          'un autre lieu'}
                                                                  </strong>
                                                                  . Il a été trouvé dans{' '}
                                                                  <strong className="font-medium">
                                                                      {selectedPlace}
                                                                  </strong>
                                                                  . Vit-il ici ?
                                                              </>
                                                          ) : (
                                                              <>
                                                                  Aucune fiche ne portait ce code.
                                                                  Le scan a lu{' '}
                                                                  <strong className="font-medium">
                                                                      {name}
                                                                  </strong>{' '}
                                                                  sur l'étiquette — le reste de la
                                                                  fiche est à saisir. Faut-il la
                                                                  garder ?
                                                              </>
                                                          )}
                                                      </p>

                                                      {/* `.acts .btn{flex:1}` — les deux réponses pèsent le
                                            même poids et prennent la même largeur : on ne
                                            suggère pas laquelle prendre, on demande laquelle
                                            est vraie. Le second est sombre, pas jaune — le
                                            jaune de l'écran est pris par le scan, et ceci est
                                            une décision de ligne, pas l'acte de l'écran. */}
                                                      {!entry.resolved && (
                                                          <div className="mt-3 flex items-center gap-2.5">
                                                              {isOutOfService ? (
                                                                  <>
                                                                      <Button
                                                                          variant="outlined"
                                                                          onClick={() =>
                                                                              leaveException(
                                                                                  entry.id,
                                                                              )
                                                                          }
                                                                          className="flex-1"
                                                                      >
                                                                          Il reste là-bas
                                                                      </Button>
                                                                      <Button
                                                                          variant="tonal"
                                                                          onClick={() =>
                                                                              attachException(
                                                                                  entry.id,
                                                                                  entry.equipment,
                                                                              )
                                                                          }
                                                                          disabled={
                                                                              !entry.equipment
                                                                          }
                                                                          className="flex-1"
                                                                      >
                                                                          Rattacher ici
                                                                      </Button>
                                                                  </>
                                                              ) : (
                                                                  <>
                                                                      <Button
                                                                          variant="outlined"
                                                                          onClick={() =>
                                                                              discardException(
                                                                                  entry.id,
                                                                                  entry.equipment,
                                                                              )
                                                                          }
                                                                          className="flex-1"
                                                                      >
                                                                          Écarter
                                                                      </Button>
                                                                      <Button
                                                                          variant="tonal"
                                                                          onClick={() =>
                                                                              completeException(
                                                                                  entry.id,
                                                                                  entry.equipment,
                                                                              )
                                                                          }
                                                                          disabled={
                                                                              !entry.equipment
                                                                          }
                                                                          className="flex-1"
                                                                      >
                                                                          Compléter la fiche
                                                                      </Button>
                                                                  </>
                                                              )}
                                                          </div>
                                                      )}

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
                                                      {entry.resolved &&
                                                          (auditFinalized ? (
                                                              <p className="text-label-small text-on-surface-variant mt-2.5">
                                                                  La campagne est clôturée : la
                                                                  décision est figée.
                                                              </p>
                                                          ) : (
                                                              <Button
                                                                  variant="text"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                      undoException(entry.id)
                                                                  }
                                                                  icon={
                                                                      <Icon
                                                                          glyph={ArrowUUpLeft}
                                                                          size={18}
                                                                      />
                                                                  }
                                                                  className="text-label-small text-on-surface-variant mt-2 min-h-0 px-0"
                                                              >
                                                                  {entry.decision === 'attached'
                                                                      ? 'Annuler ce rattachement'
                                                                      : 'Annuler cette décision'}{' '}
                                                                  — possible jusqu'à la clôture
                                                              </Button>
                                                          ))}
                                                  </section>
                                              );
                                          })}

                                    {/* `.warn` — au bureau, la clôture ne se cherche pas :
                                        la colonne dit ce qui la retient et où elle
                                        s'ouvrira. Au téléphone, c'est la carte de tension
                                        qui porte cette phrase, en tête du parc. */}
                                    {enDeuxNiveaux &&
                                        !auditFinalized &&
                                        pendingExceptions.length > 0 && (
                                            <div className="bg-tint-ambre text-on-tint-ambre flex gap-3 rounded-md px-4 py-3 text-[14px] leading-5">
                                                <Icon
                                                    glyph={LockSimple}
                                                    size={18}
                                                    className="mt-px shrink-0"
                                                />
                                                <span>
                                                    <b className="font-medium">Clôturer</b>{' '}
                                                    s'ouvrira dans le ⋮ une fois{' '}
                                                    {pendingExceptions.length > 1
                                                        ? `les ${pendingExceptions.length} écarts tranchés`
                                                        : "l'écart tranché"}
                                                    .
                                                </span>
                                            </div>
                                        )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* C6 — le canevas de 17.3, en **mode lot** : la caméra ne se referme pas entre
                deux lectures, le compteur qualifie (« n sur m attendus ») et la clôture du lot
                est explicite. Ce composant ne décode rien par contrat : la lecture reste celle
                que ce produit possède réellement — la saisie du contenu du QR — et elle est
                atteinte par « Saisir à la main », l'affordance que la vue porte déjà. */}
            {/* **Le scan doit passer devant le bandeau de navigation.** Il valait
                `z-50`, exactement celui du bandeau
                de navigation : le bandeau, plus bas dans le document, passait devant et
                **recouvrait le pied de la vue de scan** — donc « Saisir à la main », le
                seul geste par lequel ce produit enregistre une lecture. Le bouton était
                à l'écran, et aucun doigt ne pouvait l'atteindre.

                `90` et non `110` : au-dessus du bandeau (`50`), et **en dessous des
                feuilles** (`100`), puisque la saisie du code s'ouvre par-dessus le scan
                qui l'appelle. */}
            {scanOpen && (
                <div className="fixed inset-0 z-[90] bg-[var(--tk-color-inverse-surface)]">
                    <ScanView
                        mode="batch"
                        onClose={() => setScanOpen(false)}
                        tip="Cadrez le numéro de série ou le code-barres. Le compteur monte à chaque lecture."
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
                title="Saisir le code lu"
                description="Le numéro de série ou le code d’actif lu sur l’étiquette — ou le contenu d’un QR, si l’actif en porte un."
            >
                <div className="space-y-4">
                    <textarea
                        value={scanRawValue}
                        onChange={(e) => setScanRawValue(e.target.value)}
                        className="rounded-card border-outline-variant bg-surface text-body-medium text-on-surface focus:border-primary min-h-40 w-full border px-3 py-2 outline-none"
                        placeholder={`ASSET-10001\n7QK4XZ2\n\n— ou le contenu d\u2019un QR :\n{ "assetId": "ASSET-10001", "hostname": "PC-HQ-01" }`}
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
