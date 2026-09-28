import React, { useMemo, useRef, useState, useEffect } from 'react';
import { moisDepuis } from '../placeAudit';
import { identifiantsDe, lireLaCampagne } from '../campagne';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    ArrowLeft,
    ArrowsLeftRight,
    ArrowUUpLeft,
    Check,
    CheckCircle,
    CircleDashed,
    DotsThreeVertical,
    Export,
    Hourglass,
    Info,
    Funnel,
    LockSimple,
    MagnifyingGlass,
    MapPin,
    Package,
    PencilSimple,
    PlusCircle,
    QrCode,
    Question,
    Wrench,
} from '@phosphor-icons/react';

import Reading from '../../../components/layout/Reading';
import BarreDePage from '../../../components/layout/BarreDePage';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import { useData } from '../../../context/DataContext';
import FacetChip from '../../../components/ui/FacetChip';
import SearchField from '../../../components/ui/SearchField';
import ScreenState from '../../../components/ui/ScreenState';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import { SelectionBox } from '../../../components/ui/SelectableRow';
import { useSelection } from '../../../hooks/useSelection';
import FicheDeComptage from '../components/FicheDeComptage';
import TuilesDeCampagne, { type TuileDeCampagne } from '../components/TuilesDeCampagne';
import EtapesDeCampagne from '../components/EtapesDeCampagne';
import ActiviteDeCampagne, { type FaitDeCampagne } from '../components/ActiviteDeCampagne';
import RangeeDeCampagne from '../components/RangeeDeCampagne';
import type { ListRowStatus } from '../../../components/ui/ListRow';
import { FabContainer } from '../../../components/ui/FabContainer';
import { useToast } from '../../../context/ToastContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useScanPossible } from '../../../hooks/useScanPossible';
import { useEntree } from '../../../hooks/useEntree';
import { MEDIA } from '../../../constants/breakpoints';
import SideSheet from '../../../components/ui/SideSheet';
import Modal from '../../../components/ui/Modal';
import { TextArea } from '../../../components/ui/TextArea';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { parseAuditQrPayload } from '../../../lib/auditQr';
import { AUDIT_SCOPE_PREF_KEY } from '../../../lib/auditScope';
import { buildCsvLine } from '../../../lib/csv';
import {
    AuditScanPayload,
    AuditScanResult,
    Equipment,
    HistoryEvent,
    ViewType,
} from '../../../types';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { cn } from '../../../lib/utils';
import { CADRE_BUREAU } from '../../../lib/regimeBureau';
import { NOM_SUR_UNE_LIGNE, infobulle } from '../../../lib/nomLong';

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
type AuditTab = 'todo' | 'scanned' | 'missing' | 'corrigees';

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

/** « aujourd’hui à 08:12 », « hier à 17:40 », « le 12/09 à 09:05 » — l'heure d'une étape. */
const formatQuand = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const jour = new Date(date);
    jour.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const ecart = Math.round((aujourdhui.getTime() - jour.getTime()) / 86400000);
    if (ecart === 0) return `aujourd’hui à ${heure}`;
    if (ecart === 1) return `hier à ${heure}`;
    return `le ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${heure}`;
};

/** Les étapes et les faits de la campagne qui paraissent dans son activité. */
const SOURCES_DE_CAMPAGNE = new Set([
    'audit_scan',
    'audit_scan_alignment',
    'audit_cloture',
    'audit_renvoi',
    'audit_validation',
]);

/** Une correction de fiche, telle que le journal la garde (28/09). */
interface ChampCorrige {
    champ: string;
    de: string;
    a: string;
}

const champsCorriges = (event: HistoryEvent): ChampCorrige[] => {
    const champs = event.metadata?.champs;
    if (Array.isArray(champs)) {
        return champs.filter(
            (champ): champ is ChampCorrige =>
                Boolean(champ) && typeof (champ as ChampCorrige).champ === 'string',
        );
    }
    /* Avant le 28/09, le journal ne gardait que le détenteur. */
    const avant = event.metadata?.previousUser;
    const apres = event.metadata?.beneficiaryName;
    return typeof avant === 'string' || typeof apres === 'string'
        ? [
              {
                  champ: 'Détenteur',
                  de: typeof avant === 'string' ? avant : '',
                  a: typeof apres === 'string' ? apres : '',
              },
          ]
        : [];
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
    <span className="text-text-secondary flex shrink-0 items-center gap-[5px] text-[0.75rem] whitespace-nowrap">
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

/** La pastille d'état de la campagne : son fond, son point, son encre (28/09). */
const PASTILLE_ETAT = {
    bleu: {
        fond: 'bg-tint-bleu text-on-tint-bleu',
        point: 'bg-[var(--tk-color-st-bleu)]',
        encre: 'text-on-tint-bleu',
    },
    ambre: {
        fond: 'bg-tint-ambre text-on-tint-ambre',
        point: 'bg-[var(--tk-color-st-ambre)]',
        encre: 'text-on-tint-ambre',
    },
    vert: {
        fond: 'bg-tint-vert text-on-tint-vert',
        point: 'bg-[var(--tk-color-st-vert)]',
        encre: 'text-on-tint-vert',
    },
    orange: {
        fond: 'bg-tint-orange text-on-tint-orange',
        point: 'bg-[var(--tk-color-st-orange)]',
        encre: 'text-on-tint-orange',
    },
    neutre: {
        fond: 'bg-surface-container text-on-surface-variant',
        point: 'bg-[var(--tk-color-st-gris)]',
        encre: 'text-on-surface-variant',
    },
} as const;

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
        events,
        settings,
        upsertEquipmentFromAuditScan,
        updateEquipment,
        deleteEquipment,
        consignerCampagne,
        enregistrerComptage,
        users,
        locationData,
    } = useData();
    /* Compter et clôturer : `audit.scan` ; valider, renvoyer : `audit.manage` (27/09). */
    const { permissions } = useAccessControl();
    const peutCompter = permissions.canScanAudit || permissions.canManageInventory;
    const peutValider = permissions.canManageAudit;
    /* Corriger une fiche pendant le comptage : le droit de gérer l'inventaire. */
    const peutCorriger = permissions.canManageInventory;
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
    /**
     * **La bande de recherche de toutes les listes** (25/09) : un terme qui borne les
     * rangées de la puce retenue — modèle, code, porteur. Ce n'est pas « Saisir un code »,
     * qui enregistre un scan : la recherche ne fait que chercher.
     */
    const [recherche, setRecherche] = useState('');
    /** Au téléphone, la recherche s'ouvre à la loupe : la bande porte la jauge et les puces. */
    const [rechercheOuverte, setRechercheOuverte] = useState(false);
    /** La carte des écarts, dans la colonne de droite — la tuile « Écarts » y mène. */
    const carteDesEcarts = useRef<HTMLElement>(null);
    const [scanOpen, setScanOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    /** La fiche de comptage ouverte — pour compter un actif, ou corriger un retrouvé. */
    const [ficheOuverte, setFicheOuverte] = useState<{
        id: string;
        mode: 'compter' | 'corriger';
    } | null>(null);
    /** La validation d'un lot : plusieurs actifs retrouvés d'un geste. */
    const selection = useSelection();
    /** Le renvoi d'une campagne clôturée : son motif est demandé, il sera lu par l'opérateur. */
    const [renvoiOuvert, setRenvoiOuvert] = useState(false);
    const [motifDeRenvoi, setMotifDeRenvoi] = useState('');
    /**
     * **Les deux niveaux côte à côte, à partir de 1280** — 16.2, colonne bureau : *« la
     * campagne à gauche (7/12), les écarts à droite (5/12) : les cartes de décision
     * telles quelles, plus d'écran « Écarts » ni de carte de tension — la file est sous
     * les yeux, c'est elle qui tient lieu d'alerte »*.
     */
    const enDeuxNiveaux = useMediaQuery(MEDIA.twoColumn);
    /** La caméra sur un appareil qu'on tient (téléphone, tablette), la saisie à la souris. */
    const scanPossible = useScanPossible();
    const [scanRawValue, setScanRawValue] = useState('');
    const [scanHits, setScanHits] = useState<ScanHit[]>([]);
    const [auditStartedAt, setAuditStartedAt] = useState<string | null>(null);
    const [baselineIds, setBaselineIds] = useState<string[]>([]);
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
    /**
     * **Le lieu dans le site** — « Hors local », ou le local (23/09). Le titre de la page
     * et le héro écrivaient tous deux « Lomé Siège — hors local », l'un au-dessus de
     * l'autre : le site va au titre, le lieu au héro, et chacun ne se dit qu'une fois.
     */
    const lieuDansLeSite = selectedHorsLocal ? 'Hors local' : selectedLocal;

    const scopedEquipment = useMemo(() => {
        if (!selectedCountry || !selectedSite) return [];
        return equipment.filter((item) => {
            if (item.country !== selectedCountry || item.site !== selectedSite) return false;
            if (selectedHorsLocal) return !(item.local || '').trim();
            if (!selectedLocal) return true;
            return (item.local || '').trim().toLowerCase() === selectedLocal.trim().toLowerCase();
        });
    }, [equipment, selectedCountry, selectedSite, selectedLocal, selectedHorsLocal]);

    /**
     * **Reprendre, c'est retrouver ce qui a déjà été compté** (27/09). La campagne s'ouvrait
     * toujours à zéro : ses comptages ne vivaient qu'en mémoire, et « Reprendre la
     * campagne » — depuis la vue d'ensemble, qui les montrait pourtant — recommençait tout.
     * Elle repart désormais des comptages du journal sur ce périmètre, **dans la périodicité
     * d'inventaire** : un lieu compté il y a six semaines s'ouvre complet, un lieu compté
     * il y a quatorze mois ouvre une nouvelle campagne. Pour chaque objet, le dernier.
     */
    /**
     * **L'état de la campagne, lu dans le journal** (27/09) — en cours, clôturée en attente
     * d'un responsable, ou validée. Il vivait dans la mémoire de l'écran : un rechargement
     * rouvrait une campagne close, et la clôture ne laissait aucune trace.
     */
    const campagne = useMemo(
        () =>
            lireLaCampagne(
                events,
                {
                    country: selectedCountry,
                    site: selectedSite,
                    local: selectedLocal,
                    horsLocal: selectedHorsLocal,
                },
                settings.inventoryPeriodMonths || 12,
            ),
        [
            events,
            selectedCountry,
            selectedSite,
            selectedLocal,
            selectedHorsLocal,
            settings.inventoryPeriodMonths,
        ],
    );
    /** Après un abandon ou une relance, les comptages d'avant ne comptent plus. */
    const repartDepuis = campagne.depuis;
    const auditFinalized = campagne.etat !== 'en_cours';
    /** Le relevé de la clôture : les manquants et les absences justifiées, figés. */
    const missingIds = useMemo(
        () => identifiantsDe(campagne.cloture, 'missingIds') ?? [],
        [campagne.cloture],
    );
    const horsSiteSnapshot = useMemo(
        () => identifiantsDe(campagne.cloture, 'horsSiteIds') ?? [],
        [campagne.cloture],
    );

    const comptesDeLaPeriode = useMemo(() => {
        const texte = (valeur: unknown) =>
            (typeof valeur === 'string' ? valeur : '').trim().toLowerCase();
        const periode = settings.inventoryPeriodMonths || 12;
        const duPerimetre = new Set(scopedEquipment.map((item) => item.id));
        const vus = new Map<string, string>();
        for (const event of events) {
            const metadata = event.metadata;
            if (metadata?.source !== 'audit_scan' || !duPerimetre.has(event.targetId)) continue;
            if (texte(metadata.scopeCountry) !== texte(selectedCountry)) continue;
            if (texte(metadata.scopeSite) !== texte(selectedSite)) continue;
            if (selectedHorsLocal && texte(metadata.scopeLocal)) continue;
            if (selectedLocal && texte(metadata.scopeLocal) !== texte(selectedLocal)) continue;
            if (repartDepuis && event.timestamp <= repartDepuis) continue;
            const mois = moisDepuis(event.timestamp);
            if (mois === null || mois >= periode) continue;
            const dernier = vus.get(event.targetId);
            if (!dernier || event.timestamp > dernier) vus.set(event.targetId, event.timestamp);
        }
        return vus;
    }, [
        events,
        settings.inventoryPeriodMonths,
        scopedEquipment,
        selectedCountry,
        selectedSite,
        selectedLocal,
        selectedHorsLocal,
        repartDepuis,
    ]);

    /**
     * **Ce qui s'est passé sur ce lieu, depuis le début de la campagne** (28/09) — comptages,
     * rattachements, clôture, renvoi, validation. La colonne de droite en tire son activité,
     * les étapes leur premier comptage, et la clôture sa part de scans et de saisies.
     */
    const faitsDuLieu = useMemo(() => {
        const texte = (valeur: unknown) =>
            (typeof valeur === 'string' ? valeur : '').trim().toLowerCase();
        const periode = settings.inventoryPeriodMonths || 12;
        return events
            .filter((event) => {
                const metadata = event.metadata;
                const source = metadata?.source;
                if (typeof source !== 'string' || !SOURCES_DE_CAMPAGNE.has(source)) return false;
                if (texte(metadata?.scopeCountry) !== texte(selectedCountry)) return false;
                if (texte(metadata?.scopeSite) !== texte(selectedSite)) return false;
                if (selectedHorsLocal && texte(metadata?.scopeLocal)) return false;
                if (selectedLocal && texte(metadata?.scopeLocal) !== texte(selectedLocal))
                    return false;
                if (repartDepuis && event.timestamp <= repartDepuis) return false;
                const mois = moisDepuis(event.timestamp);
                return mois !== null && mois < periode;
            })
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [
        events,
        settings.inventoryPeriodMonths,
        selectedCountry,
        selectedSite,
        selectedLocal,
        selectedHorsLocal,
        repartDepuis,
    ]);

    const sessionStarted = Boolean(auditStartedAt);
    /* Une campagne clôturée garde sa ligne de base : après la validation, les manquants ont
       quitté le lieu et ne seraient plus dans le périmètre. */
    const baselineSourceIds = useMemo(
        () =>
            identifiantsDe(campagne.cloture, 'baselineIds') ??
            (sessionStarted ? baselineIds : scopedEquipment.map((item) => item.id)),
        [baselineIds, campagne.cloture, scopedEquipment, sessionStarted],
    );
    /* **Les retrouvés sont les comptages du journal** — scan ou validation à la main, par
       n'importe qui, sur n'importe quel appareil : la liste ne dépend plus de cet écran. */
    const foundAt = useMemo(() => Object.fromEntries(comptesDeLaPeriode), [comptesDeLaPeriode]);
    const foundIds = useMemo(() => [...comptesDeLaPeriode.keys()], [comptesDeLaPeriode]);

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
        setBaselineIds([]);
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
        const dejaComptes = [...comptesDeLaPeriode.entries()];
        setBaselineIds(ids);
        setExceptionEntries([]);
        setScanHits([]);
        /* Une campagne reprise a commencé à son premier comptage. */
        setAuditStartedAt(
            dejaComptes.reduce(
                (premier, [, quand]) => (quand < premier ? quand : premier),
                new Date().toISOString(),
            ),
        );
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
        if (sessionStarted) return;
        if (!scopeIsReady || scopedEquipment.length === 0) return;
        startAuditSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopeIsReady, scopedEquipment.length, sessionStarted]);

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
                const decision = consignerCampagne('abandon', currentScope, {
                    found: sessionFound,
                });
                if (!decision.allowed) {
                    showToast(decision.reason || 'Abandon refusé.', 'error');
                    return;
                }
                resetAuditSession();
                showToast('Relevé abandonné. Le périmètre est de nouveau modifiable.', 'info');
            },
        });
    };

    /**
     * **Clôturer, c'est remettre le relevé à un responsable** (27/09). La clôture écrivait
     * aussitôt les manquants, sans relecture ni trace de qui l'avait décidée. Elle fige
     * maintenant le relevé au journal (qui, quand, la ligne de base, les retrouvés, les
     * manquants, les absences justifiées) ; les manquants ne s'écrivent qu'à la validation.
     */
    const finalizeAuditSession = (missingSnapshot: Equipment[], horsSite: string[] = []) => {
        const decision = consignerCampagne('cloture', currentScope, {
            baselineIds: baselineSourceIds,
            missingIds: missingSnapshot.map((item) => item.id),
            horsSiteIds: horsSite,
            total: sessionTotal,
            found: sessionFound,
            missing: missingSnapshot.length,
            ecarts: sessionExceptions,
        });
        if (!decision.allowed) {
            showToast(decision.reason || 'Clôture refusée.', 'error');
            return;
        }
        showToast(
            peutValider
                ? 'Campagne clôturée : il reste à la valider.'
                : 'Campagne clôturée : un responsable d’inventaire doit la valider.',
            'success',
        );
        setActiveTab(missingSnapshot.length > 0 ? 'missing' : 'scanned');
    };

    /** Les fiches corrigées pendant le comptage — ce que le responsable relit avant de valider. */
    const fichesCorrigees = useMemo(() => {
        const base = new Set(baselineSourceIds);
        return events.filter(
            (event) =>
                event.metadata?.source === 'audit_scan' &&
                Boolean(event.metadata?.corrige) &&
                base.has(event.targetId) &&
                (!repartDepuis || event.timestamp > repartDepuis) &&
                (moisDepuis(event.timestamp) ?? Infinity) < (settings.inventoryPeriodMonths || 12),
        );
    }, [baselineSourceIds, events, repartDepuis, settings.inventoryPeriodMonths]);

    /** Les fiches corrigées, une fois chacune : la dernière correction de chaque actif. */
    const correctionsParActif = useMemo(() => {
        const dernieres = new Map<string, HistoryEvent>();
        for (const event of fichesCorrigees) {
            const avant = dernieres.get(event.targetId);
            if (!avant || event.timestamp > avant.timestamp) dernieres.set(event.targetId, event);
        }
        return dernieres;
    }, [fichesCorrigees]);
    const itemsCorriges = useMemo(
        () => baselineEquipment.filter((item) => correctionsParActif.has(item.id)),
        [baselineEquipment, correctionsParActif],
    );

    /** Les comptages des actifs attendus — le premier dit quand la campagne a commencé. */
    const comptagesAttendus = useMemo(() => {
        const base = new Set(baselineSourceIds);
        return faitsDuLieu.filter(
            (event) => event.metadata?.source === 'audit_scan' && base.has(event.targetId),
        );
    }, [baselineSourceIds, faitsDuLieu]);
    const premierComptage = comptagesAttendus.at(-1);
    /** Retrouvés à la main (« Retrouvé », la fiche, le lot) plutôt qu'au scan. */
    const comptesALaMain = useMemo(
        () =>
            new Set(
                comptagesAttendus
                    .filter((event) => event.metadata?.methode === 'manuel')
                    .map((event) => event.targetId),
            ).size,
        [comptagesAttendus],
    );

    /**
     * **L'activité** (28/09) — les six derniers faits du lieu, avec qui et quand : un
     * comptage, une fiche corrigée (de quoi à quoi), un objet trouvé hors de son lieu, une
     * étape de la campagne.
     */
    const faitsDActivite = useMemo((): FaitDeCampagne[] => {
        const base = new Set(baselineSourceIds);
        const parId = new Map(equipment.map((item) => [item.id, item]));
        const prenom = (nom?: string) => (nom || '').split(' ')[0] || 'quelqu’un';
        return faitsDuLieu.slice(0, 6).map((event) => {
            const item = parId.get(event.targetId);
            const nom = item?.model || item?.name || event.targetName || 'Actif';
            const quand = `${prenom(event.actorName)} · ${formatSince(event.timestamp)}`;
            const metadata = event.metadata ?? {};
            switch (metadata.source) {
                case 'audit_cloture':
                    return {
                        id: event.id,
                        ton: 'bleu',
                        titre: 'Campagne clôturée',
                        detail: `${String(metadata.found ?? '')} sur ${String(metadata.total ?? '')}`,
                        quand,
                    };
                case 'audit_renvoi':
                    return {
                        id: event.id,
                        ton: 'orange',
                        titre: 'Renvoyée',
                        detail: `« ${String(metadata.reason ?? '')} »`,
                        quand,
                    };
                case 'audit_validation':
                    return {
                        id: event.id,
                        ton: 'vert',
                        titre: 'Inventaire validé',
                        detail: '',
                        quand,
                    };
                case 'audit_scan_alignment':
                    return { id: event.id, ton: 'bleu', titre: nom, detail: 'rattaché ici', quand };
                default: {
                    if (!base.has(event.targetId)) {
                        return {
                            id: event.id,
                            ton: 'orange',
                            titre: item?.assetId || nom,
                            detail: 'scanné, non attendu ici',
                            quand,
                        };
                    }
                    if (metadata.corrige) {
                        const champs = champsCorriges(event);
                        return {
                            id: event.id,
                            ton: 'ambre',
                            titre: nom,
                            detail: champs.length
                                ? `retrouvé, ${champs
                                      .map(
                                          (champ) =>
                                              `${champ.champ.toLowerCase()} corrigé : ${champ.de || 'aucun'} → ${champ.a || 'aucun'}`,
                                      )
                                      .join(', ')}`
                                : 'retrouvé, fiche corrigée',
                            quand,
                        };
                    }
                    return {
                        id: event.id,
                        ton: 'vert',
                        titre: nom,
                        detail: metadata.methode === 'manuel' ? 'retrouvé à la main' : 'retrouvé',
                        quand,
                    };
                }
            }
        });
    }, [baselineSourceIds, equipment, faitsDuLieu]);

    /**
     * **Valider** (27/09) — le responsable relit le relevé que l'opérateur a clôturé. Le
     * relevé devient définitif et ce qu'il annonçait s'applique : les jamais vus passent
     * manquants et quittent le lieu.
     */
    const validerLaCampagne = () => {
        const manquants = missingIds.length;
        requestConfirmation({
            title: `Valider l’inventaire de ${selectedPlace} ?`,
            message:
                manquants > 0 ? (
                    <>
                        Le relevé devient définitif : <strong>{manquants} actif(s)</strong>{' '}
                        passeront manquants et quitteront le lieu. Ils restent au parc, avec leur
                        historique.
                    </>
                ) : (
                    <>Le relevé devient définitif : tout le parc attendu a été retrouvé.</>
                ),
            tone: manquants > 0 ? 'destructive' : 'neutral',
            irreversible: manquants > 0,
            confirmText: 'Valider',
            cancelText: 'Relire encore',
            details: [
                { icon: CheckCircle, label: 'Retrouvés', value: sessionFound },
                { icon: Question, label: 'Passent manquants', value: manquants },
                ...(itemsCorriges.length > 0
                    ? [
                          {
                              icon: PencilSimple,
                              label: 'Fiches corrigées pendant le comptage',
                              value: itemsCorriges.length,
                          },
                      ]
                    : []),
            ],
            onConfirm: () => {
                const decision = consignerCampagne('validation', currentScope, {
                    missingIds,
                    clotureId: campagne.cloture?.id,
                    found: sessionFound,
                    missing: manquants,
                });
                showToast(
                    decision.allowed
                        ? 'Inventaire validé.'
                        : decision.reason || 'Validation refusée.',
                    decision.allowed ? 'success' : 'error',
                );
            },
        });
    };

    /** **Renvoyer** — le relevé revient à l'opérateur, avec le motif ; le comptage reprend. */
    const renvoyerLaCampagne = () => {
        const motif = motifDeRenvoi.trim();
        if (!motif) {
            showToast('Dites ce qu’il faut revoir.', 'warning');
            return;
        }
        const decision = consignerCampagne('renvoi', currentScope, {
            reason: motif,
            clotureId: campagne.cloture?.id,
        });
        if (!decision.allowed) {
            showToast(decision.reason || 'Renvoi refusé.', 'error');
            return;
        }
        setRenvoiOuvert(false);
        setMotifDeRenvoi('');
        setActiveTab('todo');
        showToast('Campagne renvoyée : le comptage reprend.', 'info');
    };

    /** Après une campagne validée, en ouvrir une nouvelle sur le même lieu. */
    const relancerLaCampagne = () => {
        const decision = consignerCampagne('relance', currentScope);
        if (!decision.allowed) {
            showToast(decision.reason || 'Relance refusée.', 'error');
            return;
        }
        resetAuditSession();
        showToast('Nouvelle campagne ouverte.', 'success');
    };

    /**
     * **Compter à la main** (27/09) — le même fait qu'un scan (`audit_scan`), sans caméra ni
     * code : on voit l'actif, on le valide. Avec des corrections, la fiche est réécrite dans
     * le même geste.
     */
    const compterALaMain = (id: string, corrections?: Partial<Equipment>, note = '') => {
        const decision = enregistrerComptage(id, currentScope, corrections, note);
        if (!decision.allowed) {
            showToast(decision.reason || 'Comptage refusé.', 'error');
            return false;
        }
        return true;
    };

    const retrouveEnUnGeste = (item: Equipment) => {
        if (compterALaMain(item.id)) {
            showToast(`${item.model || item.name} : retrouvé.`, 'success');
        }
    };

    const validerLaSelection = () => {
        let comptes = 0;
        for (const id of selection.selectedIds) {
            if (compterALaMain(id)) comptes += 1;
        }
        selection.exit();
        if (comptes > 0) {
            showToast(
                `${comptes} actif${comptes > 1 ? 's' : ''} validé${comptes > 1 ? 's' : ''} comme retrouvé${comptes > 1 ? 's' : ''}.`,
                'success',
            );
        }
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

        /* Le comptage est au journal (`audit_scan`) : la liste des retrouvés le lit de là. */

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
            /* Au bureau, les écarts sont dans la colonne de droite ; au téléphone, un écran. */
            if (enDeuxNiveaux) {
                carteDesEcarts.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                setVueEcarts(true);
            }
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
                    Le relevé est figé et remis à un responsable d’inventaire. À la validation,{' '}
                    <strong>{missingSnapshot.length} actif(s) jamais scanné(s)</strong> seront
                    marqués manquants et retirés du lieu ; s’il renvoie la campagne, le comptage
                    reprend.
                </>
            ),
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
                    label: 'Manquants, à la validation',
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
    const renderEmptyList = (scope: AuditTab | 'horsSite' | 'exceptions') => {
        /* **Des vides de carte** (25/09) : ils vivent dans la carte des rangées, et la forme
           héritée (`EmptyState`, carré de 56 et titre de 16 en 700) n'était plus celle
           d'aucun autre écran. Le vert dit ce qui est en ordre. */
        if (scope === 'todo') {
            if (auditFinalized) {
                return (
                    <CardEmptyState
                        glyph={LockSimple}
                        title="La campagne est clôturée"
                        description="Il n'y a plus rien à scanner : les actifs jamais vus sont passés en manquants."
                    />
                );
            }
            return sessionTotal === 0 ? (
                <CardEmptyState
                    glyph={Package}
                    title="Ce lieu n'attend aucun actif"
                    description="Aucun actif du parc n'est situé dans ce périmètre."
                />
            ) : (
                <CardEmptyState
                    glyph={CheckCircle}
                    tone="positive"
                    title="Tout est retrouvé"
                    description={`Les ${sessionFound} actifs attendus ont été comptés. La campagne peut être clôturée.`}
                />
            );
        }

        if (scope === 'scanned') {
            return (
                <CardEmptyState
                    glyph={QrCode}
                    title="Aucun comptage pour l'instant"
                    description="Les actifs retrouvés, scannés ou validés à la main, apparaîtront ici du plus récent au plus ancien."
                />
            );
        }

        if (scope === 'missing' || scope === 'horsSite') {
            return auditFinalized ? (
                <CardEmptyState
                    glyph={CheckCircle}
                    tone="positive"
                    title="Aucun manquant"
                    description="La campagne s'est clôturée sans perte : tout ce que le lieu attendait a été retrouvé."
                />
            ) : (
                <CardEmptyState
                    glyph={Hourglass}
                    title="Les manquants viennent à la clôture"
                    description="Tant que la campagne tourne, un actif non vu est simplement à scanner."
                />
            );
        }

        if (scope === 'corrigees') {
            return (
                <CardEmptyState
                    glyph={PencilSimple}
                    title="Aucune fiche corrigée"
                    description="Une fiche corrigée pendant le comptage paraîtra ici : le responsable la relit avant de valider."
                />
            );
        }

        return (
            <CardEmptyState
                glyph={CheckCircle}
                tone="positive"
                title="Aucun écart"
                description="Tout ce qui a été scanné était attendu dans ce lieu. Rien à trancher."
            />
        );
    };

    /** Les rangées que la recherche retient — modèle, code, série, porteur. */
    const parRecherche = (liste: Equipment[]) => {
        const terme = recherche.trim().toLowerCase();
        if (!terme) return liste;
        return liste.filter((item) =>
            [item.name, item.model, item.assetId, item.serialNumber, item.hostname, item.user?.name]
                .filter(Boolean)
                .some((valeur) => String(valeur).toLowerCase().includes(terme)),
        );
    };

    type ModeDeRangee = 'todo' | 'scanned' | 'missing' | 'horsSite' | 'corrigees';

    /**
     * La rangée de campagne — **le modèle en titre, la marque à droite**.
     *
     * L'écran portait ici un tableau à cinq colonnes avec sa ligne d'en-têtes : nom,
     * asset, hostname, détenteur, résultat, statut. Six faits pour choisir un objet à
     * aller chercher dans un local, alors que la question tient en trois — *quel code*,
     * *quel objet chez qui*, *vu ou pas*.
     *
     * **Refonte du 28/09.** Au bureau, le crayon ouvre la fiche et « Retrouvé » compte
     * l'actif d'un geste. Au téléphone, **toucher la rangée ouvre la fiche** et le rond ✓
     * compte l'actif : la cible du pouce est la rangée entière, et le geste rapide reste à
     * droite. Après la clôture, les jamais vus portent « passera manquant » — ce que la
     * validation va écrire, lu avant qu'elle l'écrive.
     */
    const renderEquipmentRows = (
        toutes: Equipment[],
        mode: ModeDeRangee,
        modeDe: (item: Equipment) => ModeDeRangee = () => mode,
    ) => {
        if (toutes.length === 0) return renderEmptyList(mode);
        const rows = parRecherche(toutes);
        if (rows.length === 0)
            return (
                <CardEmptyState
                    glyph={Funnel}
                    title={`Aucun actif pour « ${recherche.trim()} »`}
                    description="Cherchez un modèle, un code ou un porteur."
                    action={
                        <Button variant="outlined" onClick={() => setRecherche('')}>
                            Effacer la recherche
                        </Button>
                    }
                />
            );

        const TEINTE_MODE = {
            todo: undefined,
            scanned: 'vert',
            missing: 'orange',
            horsSite: 'ambre',
            corrigees: 'ambre',
        } as const;
        return rows.map((item) => {
            const modeRangee = modeDe(item);
            /* Compter, sélectionner, corriger : pendant la campagne seulement. */
            const comptable = modeRangee === 'todo' && peutCompter && !auditFinalized;
            const corrigeable =
                (modeRangee === 'scanned' || modeRangee === 'corrigees') &&
                peutCorriger &&
                !auditFinalized;
            const holder =
                modeRangee === 'missing' && item.status === 'En réparation'
                    ? 'était en réparation'
                    : item.user?.name || 'non attribué';
            const titre = item.model || item.name;
            /* Au bureau, le local suit le porteur : on y lit où l'objet est attendu. */
            const sousTitre = [
                item.assetId,
                holder,
                comptable && enDeuxNiveaux ? item.local : undefined,
                modeRangee === 'missing' && enDeuxNiveaux
                    ? 'jamais scanné pendant la campagne'
                    : undefined,
            ]
                .filter(Boolean)
                .join(' · ');

            /* **Le lot** : en sélection, la rangée entière coche l'actif. */
            if (comptable && selection.isActive) {
                const coche = selection.isSelected(item.id);
                return (
                    <Button
                        key={item.id}
                        variant="text"
                        layout="card"
                        aria-pressed={coche}
                        onClick={() => selection.toggle(item.id)}
                        className="border-outline-variant hover:bg-surface-container deux:-mx-5 deux:w-[calc(100%+2.5rem)] deux:px-5 -mx-4 flex min-h-16 w-[calc(100%+2rem)] items-center gap-3 rounded-none border-t px-4 py-2 text-left font-normal whitespace-normal first:border-t-0 active:scale-100"
                    >
                        <SelectionBox selected={coche} />
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface text-ts-body leading-ts-body deux:font-medium block truncate">
                                {titre}
                            </span>
                            <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                {sousTitre}
                            </span>
                        </span>
                    </Button>
                );
            }

            const etiquette = (texte: string, teinte: 'orange' | 'ambre') => (
                <span
                    className={cn(
                        'shrink-0 rounded-sm px-2 text-[0.75rem] leading-6 font-semibold whitespace-nowrap',
                        teinte === 'orange'
                            ? 'bg-tint-orange text-on-tint-orange'
                            : 'bg-tint-ambre text-on-tint-ambre',
                    )}
                >
                    {texte}
                </span>
            );
            const marque =
                modeRangee === 'scanned' ? (
                    /* L'heure remplace le statut : ce qui compte est quand l'objet a été vu. */
                    <span className="text-ts-sub leading-ts-sub flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap text-[var(--tk-color-st-vert)]">
                        <Icon glyph={CheckCircle} size={18} />
                        {formatSince(foundAt[item.id])}
                    </span>
                ) : modeRangee === 'corrigees' ? (
                    /* Le crayon est déjà le geste de la rangée : la marque dit quand. */
                    <span className="text-ts-sub leading-ts-sub text-on-tint-ambre shrink-0 font-medium whitespace-nowrap">
                        corrigée {formatSince(correctionsParActif.get(item.id)?.timestamp)}
                    </span>
                ) : modeRangee === 'missing' ? (
                    etiquette(
                        campagne.etat === 'validee' ? 'manquant' : 'passera manquant',
                        'orange',
                    )
                ) : modeRangee === 'horsSite' ? (
                    etiquette('hors site, justifié', 'ambre')
                ) : null;

            if (enDeuxNiveaux) {
                const crayon = (libelle: string, ficheMode: 'compter' | 'corriger') => (
                    <Button
                        variant="text"
                        iconOnly
                        size="sm"
                        aria-label={`${libelle} — ${titre}`}
                        onClick={() => setFicheOuverte({ id: item.id, mode: ficheMode })}
                        /* La rangée survolée est déjà grise : le crayon fonce d'un cran. */
                        className="text-text-secondary hover:bg-surface-muted-strong hover:text-on-surface h-9 w-9"
                    >
                        <Icon glyph={PencilSimple} size={20} />
                    </Button>
                );
                return (
                    <RangeeDeCampagne
                        key={item.id}
                        glyph={getCategoryGlyph(item.type)}
                        tint={TEINTE_MODE[modeRangee]}
                        titre={titre}
                        sousTitre={sousTitre}
                        /* Au bureau aussi, cliquer la rangée ouvre sa fiche : le crayon le dit. */
                        onOuvrir={
                            comptable || corrigeable
                                ? () =>
                                      setFicheOuverte({
                                          id: item.id,
                                          mode: comptable ? 'compter' : 'corriger',
                                      })
                                : undefined
                        }
                        libelleOuvrir={comptable ? 'Vérifier la fiche' : 'Corriger la fiche'}
                        fin={
                            comptable ? (
                                <span className="flex shrink-0 items-center gap-1">
                                    {crayon('Vérifier la fiche', 'compter')}
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        onClick={() => retrouveEnUnGeste(item)}
                                        className="hover:bg-surface hover:border-on-surface-variant active:bg-surface-container-high h-9 min-h-9 gap-1.5 px-3 text-[0.8125rem]"
                                    >
                                        <Icon glyph={Check} size={18} />
                                        Retrouvé
                                    </Button>
                                </span>
                            ) : marque || corrigeable ? (
                                <span className="flex shrink-0 items-center gap-1">
                                    {marque}
                                    {corrigeable && crayon('Corriger la fiche', 'corriger')}
                                </span>
                            ) : undefined
                        }
                    />
                );
            }

            return (
                <RangeeDeCampagne
                    key={item.id}
                    glyph={getCategoryGlyph(item.type)}
                    tint={TEINTE_MODE[modeRangee]}
                    titre={titre}
                    sousTitre={sousTitre}
                    onOuvrir={
                        comptable || corrigeable
                            ? () =>
                                  setFicheOuverte({
                                      id: item.id,
                                      mode: comptable ? 'compter' : 'corriger',
                                  })
                            : undefined
                    }
                    libelleOuvrir={comptable ? 'Vérifier la fiche' : 'Corriger la fiche'}
                    fin={
                        comptable ? (
                            <Button
                                variant="text"
                                iconOnly
                                aria-label={`Retrouvé — ${titre}`}
                                onClick={() => retrouveEnUnGeste(item)}
                                className="bg-tint-vert text-on-tint-vert h-11 max-h-11 min-h-11 w-11 max-w-11 min-w-11 shrink-0 rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--tk-color-st-vert)_35%,var(--tk-color-surface))] hover:bg-[color-mix(in_srgb,var(--tk-color-st-vert)_22%,var(--tk-color-surface))] active:scale-[0.92] active:bg-[color-mix(in_srgb,var(--tk-color-st-vert)_32%,var(--tk-color-surface))]"
                            >
                                <Icon glyph={Check} size={20} />
                            </Button>
                        ) : (
                            (marque ?? undefined)
                        )
                    }
                />
            );
        });
    };

    /**
     * **Ce que la liste montre** — la tuile choisie au bureau, la puce au téléphone. « À
     * scanner » n'existe plus après la clôture, « Jamais vus » pas avant : l'onglet retenu
     * suit l'état de la campagne sans qu'on ait à le reprendre.
     */
    const ongletAffiche: AuditTab = auditFinalized
        ? activeTab === 'todo'
            ? missingItems.length + horsSiteItems.length > 0
                ? 'missing'
                : 'scanned'
            : activeTab
        : activeTab === 'missing'
          ? 'todo'
          : activeTab;
    /* L'arrivée : les cartes de la colonne entrent en cascade ; les rangées aussi, et de
       nouveau quand on change de liste. */
    const entreePage = useEntree();
    const entreeListe = useEntree(ongletAffiche);
    const choisir = (onglet: AuditTab) => {
        setActiveTab(onglet);
        if (selection.isActive) selection.exit();
    };
    /** Les retrouvés, du plus récent au plus ancien. */
    const retrouvesRecents = useMemo(
        () =>
            [...scannedItems].sort((a, b) =>
                (foundAt[b.id] || '').localeCompare(foundAt[a.id] || ''),
            ),
        [foundAt, scannedItems],
    );
    const horsSiteSet = useMemo(
        () => new Set(horsSiteItems.map((item) => item.id)),
        [horsSiteItems],
    );
    const listeAffichee =
        ongletAffiche === 'todo'
            ? todoItems
            : ongletAffiche === 'scanned'
              ? retrouvesRecents
              : ongletAffiche === 'corrigees'
                ? itemsCorriges
                : [...missingItems, ...horsSiteItems];
    const TITRE_DE_LISTE: Record<AuditTab, string> = {
        todo: 'À scanner',
        scanned: 'Retrouvés',
        missing: 'Jamais vus',
        corrigees: 'Fiches corrigées',
    };
    const compteDeListe = recherche.trim()
        ? `${parRecherche(listeAffichee).length} des ${listeAffichee.length}`
        : `${listeAffichee.length} sur ${sessionTotal}`;
    const rangeesDeLaListe = renderEquipmentRows(listeAffichee, ongletAffiche, (item) =>
        ongletAffiche === 'missing' && horsSiteSet.has(item.id) ? 'horsSite' : ongletAffiche,
    );
    /** « Sélectionner plusieurs » : pendant la campagne, sur ce qui reste à scanner. */
    const selectionPossible =
        ongletAffiche === 'todo' && peutCompter && !auditFinalized && todoItems.length > 0;
    const listeCorrigeable =
        (ongletAffiche === 'scanned' || ongletAffiche === 'corrigees') &&
        peutCorriger &&
        !auditFinalized &&
        listeAffichee.length > 0;

    /* Les indices de la planche : ils ne paraissent que quand ils s'appliquent. Une
       explication permanente devient du décor. */
    const indicesDeLaListe = (
        <>
            {ongletAffiche === 'todo' &&
                todoItems.some((item) => item.status === 'En réparation') && (
                    <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                        <strong className="text-on-surface font-medium">
                            L'actif en réparation reste à scanner.
                        </strong>{' '}
                        Il est attendu dans le lieu : c'est le relevé qui dit s'il y est, pas son
                        statut. À la clôture, ne pas l'avoir vu ne le rendra pas manquant — son
                        absence est justifiée.
                    </p>
                )}
            {ongletAffiche === 'missing' && horsSiteItems.length > 0 && (
                <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                    <strong className="text-on-surface font-medium">
                        Hors site : ni retrouvés, ni manquants.
                    </strong>{' '}
                    Ces actifs sont chez le réparateur : leur absence du lieu s'explique, et la
                    validation ne les accuse pas.
                </p>
            )}
            {ongletAffiche === 'missing' && auditFinalized && assignedMissingCount > 0 && (
                <p className="text-body-small text-on-surface-variant pt-[7px] pb-4">
                    <strong className="text-on-surface font-medium">
                        {assignedMissingCount} des {missingItems.length} jamais vus sont attribués.
                    </strong>{' '}
                    Leur porteur reste responsable : le manquant devrait ouvrir une tâche chez lui,
                    et il ne s'efface pas avec la campagne. La file ne le fait pas encore — dette
                    D3.
                </p>
            )}
        </>
    );

    /** « 2 rattachés, 1 écarté » — ce que la carte tranchée dit d'elle-même. */
    const repartitionDesEcarts = useMemo(() => {
        const compte = { attached: 0, left: 0, kept: 0, discarded: 0 };
        exceptionEntries.forEach((entry) => {
            if (entry.resolved && entry.decision) compte[entry.decision] += 1;
        });
        const morceaux: string[] = [];
        if (compte.attached > 0)
            morceaux.push(`${compte.attached} rattaché${compte.attached > 1 ? 's' : ''} ici`);
        if (compte.kept > 0) morceaux.push(`${compte.kept} complété${compte.kept > 1 ? 's' : ''}`);
        if (compte.left > 0)
            morceaux.push(`${compte.left} laissé${compte.left > 1 ? 's' : ''} là-bas`);
        if (compte.discarded > 0)
            morceaux.push(`${compte.discarded} écarté${compte.discarded > 1 ? 's' : ''}`);
        return morceaux.join(', ') || 'aucune décision';
    }, [exceptionEntries]);

    /**
     * **L'état de la campagne, en pastille** (28/09) — à côté du lieu au bureau, en encre
     * dans la ligne du lieu au téléphone. Le mot, pas la seule couleur (I3) : « en cours »
     * bleu, « clôturée · à valider » ambre, « validée » vert, « renvoyée » orange.
     */
    const etatAffiche = useMemo((): {
        long: string;
        court: string;
        teinte: keyof typeof PASTILLE_ETAT;
    } => {
        if (campagne.etat === 'validee')
            return { long: 'Validée', court: 'validée', teinte: 'vert' };
        if (campagne.etat === 'cloturee')
            return { long: 'Clôturée · à valider', court: 'clôturée, à valider', teinte: 'ambre' };
        if (campagne.renvoi)
            return { long: 'Renvoyée · à recompter', court: 'renvoyée', teinte: 'orange' };
        if (scopeIsReady && scopedEquipment.length === 0)
            return { long: 'Rien à auditer', court: 'rien à auditer', teinte: 'neutre' };
        return { long: 'En cours', court: 'en cours', teinte: 'bleu' };
    }, [campagne.etat, campagne.renvoi, scopeIsReady, scopedEquipment.length]);

    /** « Campus Dakar · Sénégal · lancée aujourd’hui à 08:12 · dernier comptage il y a 3 min ». */
    const sousTitreDeCampagne = [
        lieuDansLeSite ? selectedSite : null,
        selectedCountry,
        ...(campagne.validation
            ? [
                  `validée par ${campagne.validation.actorName} ${formatQuand(campagne.validation.timestamp)}`,
              ]
            : campagne.cloture
              ? [
                    `clôturée par ${campagne.cloture.actorName} ${formatQuand(campagne.cloture.timestamp)}`,
                ]
              : [
                    premierComptage
                        ? `lancée ${formatQuand(premierComptage.timestamp)}`
                        : 'aucun comptage encore',
                    lastScanAt ? `dernier comptage ${formatSince(lastScanAt)}` : null,
                ]),
    ]
        .filter(Boolean)
        .join(' · ');

    /** Le nombre d'écarts de la campagne : ceux de la clôture, sinon ceux de la séance. */
    const ecartsDeLaCampagne =
        typeof campagne.cloture?.metadata?.ecarts === 'number'
            ? (campagne.cloture.metadata.ecarts as number)
            : sessionExceptions;

    /**
     * **Les quatre tuiles** (28/09) — le héros éclaté. Chacune compte une chose et, quand
     * elle a une liste, la montre : la tuile choisie est cerclée et la liste dessous prend
     * son nom. Pendant la campagne : retrouvés, à scanner, écarts, fiches corrigées ; après
     * la clôture, « À scanner » cède la place aux jamais vus.
     */
    const tuiles: TuileDeCampagne[] = [
        {
            id: 'scanned',
            glyph: CheckCircle,
            teinte: 'vert',
            label: 'Retrouvés',
            valeur: sessionFound,
            suffixe: `sur ${sessionTotal} · ${progressPercentage} %`,
            progression: progressPercentage,
            choisie: ongletAffiche === 'scanned',
            onClick: () => choisir('scanned'),
        },
        auditFinalized
            ? {
                  id: 'missing',
                  glyph: Question,
                  teinte: 'orange',
                  label: 'Jamais vus',
                  valeur: missingItems.length,
                  alerte: campagne.etat === 'cloturee' && missingItems.length > 0,
                  detail: [
                      missingItems.length === 0
                          ? 'aucun manquant'
                          : campagne.etat === 'cloturee'
                            ? 'passeront manquants à la validation'
                            : 'passés manquants',
                      horsSiteItems.length > 0
                          ? `${horsSiteItems.length} hors site, justifié${horsSiteItems.length > 1 ? 's' : ''}`
                          : null,
                  ]
                      .filter(Boolean)
                      .join(' · '),
                  choisie: ongletAffiche === 'missing',
                  onClick: () => choisir('missing'),
              }
            : {
                  id: 'todo',
                  glyph: CircleDashed,
                  teinte: 'bleu',
                  label: 'À scanner',
                  valeur: todoItems.length,
                  detail:
                      sessionTotal === 0
                          ? 'rien à compter ici'
                          : todoItems.length > 0
                            ? 'restent à trouver'
                            : 'tout est retrouvé',
                  choisie: ongletAffiche === 'todo',
                  onClick: () => choisir('todo'),
              },
        {
            id: 'ecarts',
            glyph: ArrowsLeftRight,
            teinte: !auditFinalized && pendingExceptions.length > 0 ? 'orange' : 'neutre',
            label: 'Écarts',
            valeur: ecartsDeLaCampagne,
            alerte: !auditFinalized && pendingExceptions.length > 0,
            detail:
                !auditFinalized && pendingExceptions.length > 0
                    ? 'à trancher avant la clôture'
                    : ecartsDeLaCampagne === 0
                      ? auditFinalized
                          ? 'aucun'
                          : 'aucun pour l’instant'
                      : sessionExceptions > 0
                        ? `tranché${sessionExceptions > 1 ? 's' : ''} : ${repartitionDesEcarts}`
                        : `tranché${ecartsDeLaCampagne > 1 ? 's' : ''} avant la clôture`,
            onClick:
                exceptionsDisplay.length > 0
                    ? () =>
                          carteDesEcarts.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                          })
                    : undefined,
        },
        {
            id: 'corrigees',
            glyph: PencilSimple,
            teinte: 'ambre',
            label: 'Fiches corrigées',
            valeur: itemsCorriges.length,
            detail:
                itemsCorriges.length === 0
                    ? auditFinalized
                        ? 'aucune'
                        : 'aucune pour l’instant'
                    : campagne.etat === 'cloturee'
                      ? 'à relire avant de valider'
                      : campagne.etat === 'validee'
                        ? 'gardées à la validation'
                        : 'relues par le responsable à la validation',
            choisie: ongletAffiche === 'corrigees',
            onClick: itemsCorriges.length > 0 ? () => choisir('corrigees') : undefined,
        },
    ];

    /**
     * Le ⋮ de la barre — **l'ordre de la planche** : exporter, clôturer, abandonner.
     *
     * *« Le ⋮ s'ouvre au tap : Exporter, Abandonner ; Clôturer n'y entre qu'une fois les
     * écarts tranchés. »* Au bureau, la clôture paraît aussi dans les étapes, au moment où
     * tout est retrouvé : c'est là que la question se pose.
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
        if (sessionStarted && !auditFinalized && !closureBlocked && peutCompter) {
            items.push({
                id: 'finalize-session',
                label: 'Clôturer la campagne',
                description: 'le relevé est remis à un responsable, qui le valide',
                icon: 'lock',
                destructive: true,
                onSelect: handleFinalizeAudit,
            });
        }
        if (campagne.etat === 'validee' && peutCompter) {
            items.push({
                id: 'relance',
                label: 'Lancer une nouvelle campagne',
                description: 'le lieu se recompte depuis zéro',
                icon: 'restart_alt',
                onSelect: relancerLaCampagne,
            });
        }
        if (sessionStarted && !auditFinalized && peutCompter) {
            items.push({
                id: 'abandon-session',
                label: 'Abandonner la campagne',
                description: 'jette les comptages en cours ; aucun actif modifié',
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
        campagne.etat,
        peutCompter,
    ]);

    /* Au bureau, l'export a son bouton nommé dans l'en-tête : le laisser aussi dans le
       ⋮ donnerait deux portes au même acte, à trois centimètres l'une de l'autre. */
    const overflowAffiche = enDeuxNiveaux
        ? overflowItems.filter((item) => item.id !== 'export-releve')
        : overflowItems;

    /** La vue globale : c'est là que se choisit le lieu, et nulle part ailleurs. */
    const backToOverview = () => {
        if (typeof onViewChange === 'function') {
            onViewChange('audit');
            return;
        }
        onBack();
    };

    /**
     * **Le bandeau de la campagne, au téléphone** (27/09) — clôturée et en attente d'un
     * responsable, validée, ou renvoyée avec son motif. Le responsable y trouve ses deux
     * gestes. Au bureau, les étapes de la colonne de droite le remplacent (28/09).
     */
    const bandeauDeCampagne =
        campagne.etat === 'cloturee' && campagne.cloture ? (
            <section className="flex flex-col gap-3 rounded-md bg-[var(--tk-color-tint-ambre)] px-4 py-3 text-[var(--tk-color-on-tint-ambre)]">
                <p className="text-ts-sub leading-ts-sub flex items-start gap-2">
                    <Icon glyph={Hourglass} size={18} className="mt-px shrink-0" />
                    <span>
                        <b className="font-semibold">
                            Clôturée par {campagne.cloture.actorName},{' '}
                            {formatSince(campagne.cloture.timestamp)}.
                        </b>{' '}
                        {peutValider
                            ? 'Relisez le relevé, puis validez-le ou renvoyez-le.'
                            : 'Un responsable d’inventaire doit la valider.'}
                        {itemsCorriges.length > 0 &&
                            ` ${itemsCorriges.length} fiche${itemsCorriges.length > 1 ? 's' : ''} corrigée${itemsCorriges.length > 1 ? 's' : ''} pendant le comptage.`}
                    </span>
                </p>
                {peutValider && (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outlined"
                            onClick={() => setRenvoiOuvert(true)}
                            className="h-10 min-h-10 px-4 text-[0.875rem]"
                        >
                            <Icon glyph={ArrowUUpLeft} size={18} />
                            Renvoyer
                        </Button>
                        <Button
                            variant="filled"
                            onClick={validerLaCampagne}
                            className="h-10 min-h-10 px-4 text-[0.875rem]"
                        >
                            <Icon glyph={CheckCircle} size={18} />
                            Valider l’inventaire
                        </Button>
                    </div>
                )}
            </section>
        ) : campagne.etat === 'validee' && campagne.validation ? (
            <p className="text-ts-sub leading-ts-sub flex items-start gap-2 rounded-md bg-[var(--tk-color-tint-vert)] px-4 py-3 text-[var(--tk-color-on-tint-vert)]">
                <Icon glyph={CheckCircle} size={18} className="mt-px shrink-0" />
                <span>
                    <b className="font-semibold">
                        Validée par {campagne.validation.actorName},{' '}
                        {formatSince(campagne.validation.timestamp)}.
                    </b>{' '}
                    Le relevé est définitif.
                </span>
            </p>
        ) : campagne.renvoi ? (
            <p className="text-ts-sub leading-ts-sub flex items-start gap-2 rounded-md bg-[var(--tk-color-tint-orange)] px-4 py-3 text-[var(--tk-color-on-tint-orange)]">
                <Icon glyph={ArrowUUpLeft} size={18} className="mt-px shrink-0" />
                <span>
                    <b className="font-semibold">
                        Renvoyée par {campagne.renvoi.actorName},{' '}
                        {formatSince(campagne.renvoi.timestamp)} :
                    </b>{' '}
                    « {String(campagne.renvoi.metadata?.reason ?? '')} »
                </span>
            </p>
        ) : null;

    type EcartAffiche = (typeof exceptionsDisplay)[number];
    const faitsDeLEcart = (entry: EcartAffiche) => ({
        name:
            entry.equipment?.model ||
            entry.result.equipmentName ||
            entry.payload.machineName ||
            entry.payload.hostname ||
            'Machine inconnue',
        code:
            entry.payload.assetId ||
            entry.payload.serialNumber ||
            entry.equipment?.assetId ||
            'code inconnu',
        isOutOfService: entry.result.resolution === 'found_out_of_place',
        /* Où la fiche dit que l'actif vit — **un lieu**, pas un service : c'est ce qu'on
           compare à l'endroit où on l'a trouvé (16.1). */
        registeredAt: entry.equipment
            ? [entry.equipment.local, entry.equipment.site].filter(Boolean).join(' · ')
            : '',
    });

    /**
     * **L'écart, en carte de colonne** (28/09) — au bureau, il tient dans la colonne de
     * droite : le code et le modèle, le fait en une ligne, les deux réponses de même poids.
     * Tranché, il dit la décision et se défait jusqu'à la clôture.
     */
    const renderEcartCompact = (entry: EcartAffiche) => {
        const { name, code, isOutOfService, registeredAt } = faitsDeLEcart(entry);
        const decision = entry.resolved
            ? entry.decision === 'attached'
                ? `Rattaché ici ${formatSince(entry.decidedAt)}`
                : entry.decision === 'left'
                  ? `Laissé à ${registeredAt || 'son lieu d’origine'}`
                  : entry.decision === 'kept'
                    ? 'Fiche gardée, à compléter'
                    : 'Fiche écartée du parc'
            : isOutOfService
              ? `Scanné ici, attendu ${registeredAt ? `à ${registeredAt}` : 'ailleurs'}`
              : 'Code inconnu du parc : la fiche a été créée du seul code lu';
        return (
            <div
                key={entry.id}
                className={cn(
                    'rounded-card px-3 py-3',
                    entry.resolved
                        ? 'bg-surface-container'
                        : 'border-tint-orange border bg-[color-mix(in_srgb,var(--tk-color-tint-orange)_45%,var(--tk-color-surface))]',
                )}
            >
                <p
                    title={infobulle(`${name} · ${code}`)}
                    className="text-on-surface truncate text-[0.875rem] leading-5 font-medium"
                >
                    {name} · {code}
                </p>
                <p className="text-text-secondary mt-0.5 flex items-center gap-1.5 text-[0.75rem] leading-4">
                    {entry.resolved && (
                        <Icon
                            glyph={CheckCircle}
                            size={18}
                            className="-my-px shrink-0 text-[var(--tk-color-st-vert)]"
                        />
                    )}
                    <span className="min-w-0">{decision}</span>
                </p>
                {!entry.resolved ? (
                    /* Deux réponses de même poids ; dans une colonne étroite (tablette), elles
                       passent l'une sous l'autre au lieu de déborder de leur bouton. */
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={() =>
                                isOutOfService
                                    ? leaveException(entry.id)
                                    : discardException(entry.id, entry.equipment)
                            }
                            className="h-[34px] min-h-[34px] min-w-[7.5rem] flex-1 justify-center px-3 text-[0.8125rem]"
                        >
                            {isOutOfService ? 'Il reste là-bas' : 'Écarter'}
                        </Button>
                        <Button
                            variant="tonal"
                            size="sm"
                            disabled={!entry.equipment}
                            onClick={() =>
                                isOutOfService
                                    ? attachException(entry.id, entry.equipment)
                                    : completeException(entry.id, entry.equipment)
                            }
                            className="h-[34px] min-h-[34px] min-w-[7.5rem] flex-1 justify-center px-3 text-[0.8125rem]"
                        >
                            {isOutOfService ? 'Rattacher ici' : 'Compléter la fiche'}
                        </Button>
                    </div>
                ) : (
                    !auditFinalized && (
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => undoException(entry.id)}
                            icon={<Icon glyph={ArrowUUpLeft} size={18} />}
                            className="text-on-surface-variant mt-1 -ml-1 h-8 min-h-8 px-1 text-[0.75rem]"
                        >
                            Annuler la décision
                        </Button>
                    )
                )}
            </div>
        );
    };

    /** L'écart en carte pleine — l'écran « Écarts » du téléphone. */
    const renderCarteDEcart = (entry: EcartAffiche) => {
        const { name, code, isOutOfService, registeredAt } = faitsDeLEcart(entry);
        return (
            <section
                key={entry.id}
                /* `.ec` de 16.2 — **16 / 20**, sans ombre. */
                className="rounded-card bg-surface px-4 py-4"
            >
                <div className="flex items-center gap-3">
                    {/* La pastille de nature à gauche : elle dit d'un coup d'œil de quel
                        genre d'écart il s'agit avant même de lire le code. */}
                    <span
                        className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            isOutOfService
                                ? 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-st-orange)]'
                                : 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-st-bleu)]',
                        )}
                    >
                        <Icon glyph={isOutOfService ? ArrowsLeftRight : Question} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p
                            title={infobulle(code)}
                            className={cn(
                                'font-brand text-on-surface text-ts-body font-semibold tracking-[-0.01em]',
                                NOM_SUR_UNE_LIGNE,
                            )}
                        >
                            {code}
                        </p>
                        <p className="text-body-small text-text-secondary truncate">
                            {name} · scanné {formatSince(entry.timestamp)}
                        </p>
                    </div>
                    {entry.resolved ? (
                        <ExceptionMark icon={CheckCircle} label="tranché" tone="positive" />
                    ) : isOutOfService ? (
                        <ExceptionMark icon={ArrowsLeftRight} label="hors lieu" tone="attention" />
                    ) : (
                        <ExceptionMark icon={PlusCircle} label="nouveau" tone="info" />
                    )}
                </div>

                {/* Le fait, avant les gestes — sur le creux que la planche lui donne : c'est
                    le relevé sur lequel on va trancher. */}
                <p className="bg-surface-container text-body-small text-on-surface mt-3 rounded-sm px-3 py-2.5">
                    {entry.resolved ? (
                        entry.decision === 'attached' ? (
                            <>
                                Rattaché à <strong className="font-medium">{selectedPlace}</strong>{' '}
                                {formatSince(entry.decidedAt)}. L'actif compte désormais parmi les
                                retrouvés.
                            </>
                        ) : entry.decision === 'left' ? (
                            <>
                                Laissé à son lieu d'origine{' '}
                                {registeredAt ? (
                                    <>
                                        — <strong className="font-medium">{registeredAt}</strong>
                                    </>
                                ) : null}
                                . Il était de passage ici.
                            </>
                        ) : entry.decision === 'kept' ? (
                            <>
                                Fiche gardée et ouverte pour être complétée{' '}
                                {formatSince(entry.decidedAt)}. Elle est rattachée au périmètre de
                                la campagne.
                            </>
                        ) : (
                            <>Fiche écartée et retirée du parc. Le code pourra être rescanné.</>
                        )
                    ) : isOutOfService ? (
                        <>
                            Cet actif est enregistré sur{' '}
                            <strong className="font-medium">
                                {registeredAt || 'un autre lieu'}
                            </strong>
                            . Il a été trouvé dans{' '}
                            <strong className="font-medium">{selectedPlace}</strong>. Vit-il ici ?
                        </>
                    ) : (
                        <>
                            Aucune fiche ne portait ce code. Le scan a lu{' '}
                            <strong className="font-medium">{name}</strong> sur l'étiquette — le
                            reste de la fiche est à saisir. Faut-il la garder ?
                        </>
                    )}
                </p>

                {/* `.acts .btn{flex:1}` — les deux réponses pèsent le même poids : on ne
                    suggère pas laquelle prendre, on demande laquelle est vraie. */}
                {!entry.resolved && (
                    <div className="mt-3 flex items-center gap-2.5">
                        <Button
                            variant="outlined"
                            onClick={() =>
                                isOutOfService
                                    ? leaveException(entry.id)
                                    : discardException(entry.id, entry.equipment)
                            }
                            className="flex-1"
                        >
                            {isOutOfService ? 'Il reste là-bas' : 'Écarter'}
                        </Button>
                        <Button
                            variant="tonal"
                            onClick={() =>
                                isOutOfService
                                    ? attachException(entry.id, entry.equipment)
                                    : completeException(entry.id, entry.equipment)
                            }
                            disabled={!entry.equipment}
                            className="flex-1"
                        >
                            {isOutOfService ? 'Rattacher ici' : 'Compléter la fiche'}
                        </Button>
                    </div>
                )}

                {/* La ligne de conséquence, sous les gestes : ce que le geste écrit
                    réellement. */}
                {!entry.resolved && (
                    <p className="text-label-small text-on-surface-variant mt-2 flex items-start gap-2">
                        <Icon glyph={Info} size={18} className="mt-px shrink-0" />
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
                            La campagne est clôturée : la décision est figée.
                        </p>
                    ) : (
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => undoException(entry.id)}
                            icon={<Icon glyph={ArrowUUpLeft} size={18} />}
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
    };

    /**
     * **Les puces du téléphone** (28/09) — dans la bande fixe, sous la jauge : ce qu'on
     * regarde, et combien. « Écarts » n'est pas une partition du parc : sa puce, orange
     * tant qu'une décision attend, mène à l'écran des écarts.
     */
    const pucesDuTelephone: { id: AuditTab; label: string; count: number }[] = [
        ...(auditFinalized
            ? [
                  {
                      id: 'missing' as const,
                      label: 'Jamais vus',
                      count: missingItems.length + horsSiteItems.length,
                  },
              ]
            : [{ id: 'todo' as const, label: 'À scanner', count: todoItems.length }]),
        { id: 'scanned', label: 'Retrouvés', count: scannedItems.length },
        ...(itemsCorriges.length > 0
            ? [{ id: 'corrigees' as const, label: 'Corrigées', count: itemsCorriges.length }]
            : []),
    ];

    /** Les fiches corrigées, pour la colonne de la campagne clôturée — de quoi à quoi. */
    const correctionsARelire = itemsCorriges
        .map((item) => ({ item, event: correctionsParActif.get(item.id) }))
        .filter((entree): entree is { item: Equipment; event: HistoryEvent } =>
            Boolean(entree.event),
        )
        .sort((a, b) => b.event.timestamp.localeCompare(a.event.timestamp));

    const enteteDeListe = (
        <div className="border-outline-variant flex min-h-16 shrink-0 items-center gap-3 border-b px-5 py-3">
            <h2 className="text-on-surface text-[1rem] leading-6 font-semibold whitespace-nowrap">
                {TITRE_DE_LISTE[ongletAffiche]}
            </h2>
            <span className="text-text-secondary text-[0.8125rem] leading-[1.125rem] whitespace-nowrap tabular-nums">
                {selection.isActive
                    ? `${selection.count} sélectionné${selection.count > 1 ? 's' : ''} sur ${todoItems.length}`
                    : compteDeListe}
            </span>
            <div className="ml-auto flex min-w-0 items-center gap-2">
                {selection.isActive ? (
                    <>
                        <Button
                            variant="text"
                            size="sm"
                            onClick={() => selection.selectAll(todoItems.map((item) => item.id))}
                            className="text-on-surface h-9 min-h-9 px-2.5 text-[0.8125rem]"
                        >
                            Tout
                        </Button>
                        <Button
                            variant="text"
                            size="sm"
                            onClick={selection.exit}
                            className="text-on-surface h-9 min-h-9 px-2.5 text-[0.8125rem]"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="filled"
                            size="sm"
                            disabled={selection.count === 0}
                            onClick={validerLaSelection}
                            className="h-9 min-h-9 gap-1.5 px-3 text-[0.8125rem]"
                        >
                            <Icon glyph={Check} size={18} />
                            Valider comme retrouvés
                        </Button>
                    </>
                ) : (
                    <>
                        <SearchField
                            dense
                            value={recherche}
                            onChange={setRecherche}
                            placeholder="Modèle, code, porteur"
                            className="w-[240px] min-w-[9rem] shrink"
                        />
                        {selectionPossible && (
                            <Button
                                variant="text"
                                size="sm"
                                onClick={() => selection.enter()}
                                className="text-on-surface h-9 min-h-9 shrink-0 px-2.5 text-[0.8125rem]"
                            >
                                Sélectionner plusieurs
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        /* **Le canevas derrière les cartes.** `.phone` de 16.2 est sur le canevas, `.card`
           sur la surface. */
        <div className="bg-background flex h-full flex-col">
            {enDeuxNiveaux ? (
                /*
                  **L'en-tête de la campagne** (28/09) — le lieu en titre, son état en
                  pastille à côté, et dessous où il est et où en est le comptage. Les gestes
                  à droite : exporter, « Saisir un code » (le seul jaune, pendant la
                  campagne), et le ⋮ pour le reste.
                */
                <header className="px-page flex shrink-0 items-start justify-between gap-6 pt-[26px] pb-5">
                    <div className="flex min-w-0 items-start gap-1.5">
                        <Button
                            variant="text"
                            iconOnly
                            onClick={onBack}
                            aria-label="Retour à l’inventaire"
                            className="text-on-surface hover:bg-surface-container doigt:h-12 doigt:max-h-12 doigt:min-h-12 doigt:w-12 doigt:max-w-12 doigt:min-w-12 -ml-2.5 h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 shrink-0 rounded-md"
                        >
                            <Icon glyph={ArrowLeft} size={20} />
                        </Button>
                        <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-3">
                                <h1 className="font-brand text-on-surface truncate text-[1.75rem] leading-10 font-semibold tracking-[-0.02em]">
                                    {lieuDansLeSite || selectedSite || 'Campagne'}
                                </h1>
                                {scopeIsReady && (
                                    <span
                                        className={cn(
                                            'inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-semibold whitespace-nowrap',
                                            PASTILLE_ETAT[etatAffiche.teinte].fond,
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'h-[7px] w-[7px] rounded-full',
                                                PASTILLE_ETAT[etatAffiche.teinte].point,
                                            )}
                                        />
                                        {etatAffiche.long}
                                    </span>
                                )}
                            </div>
                            {scopeIsReady && (
                                <p className="text-text-secondary truncate text-[0.8125rem] leading-[1.125rem]">
                                    {sousTitreDeCampagne}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {sessionStarted && (
                            <Button
                                variant="outlined"
                                onClick={exportRelevé}
                                icon={<Icon glyph={Export} size={20} />}
                                className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 shrink-0 gap-2 rounded-md px-3.5 text-[0.875rem] font-medium shadow-none"
                            >
                                {auditFinalized ? 'Exporter le relevé' : 'Exporter'}
                            </Button>
                        )}
                        {/* **Pas de scan à la souris** — 17.11 : le geste de la caméra reste
                            à l'appareil qu'on tient ; à la souris, « Saisir un code », la même
                            saisie. Une tablette en paysage garde sa caméra (27/09). */}
                        {sessionStarted && !auditFinalized && peutCompter && (
                            <Button
                                variant="filled"
                                onClick={() =>
                                    scanPossible ? setScanOpen(true) : setManualOpen(true)
                                }
                                icon={<Icon glyph={QrCode} size={20} />}
                                className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control h-10 min-h-10 shrink-0 gap-2 rounded-md pr-4 pl-3.5 text-[0.875rem] font-semibold"
                            >
                                {scanPossible ? 'Scanner' : 'Saisir un code'}
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
                                        className="text-on-surface hover:bg-surface-container doigt:h-12 doigt:max-h-12 doigt:min-h-12 doigt:w-12 doigt:max-w-12 doigt:min-w-12 h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 shrink-0 rounded-md"
                                    >
                                        <Icon glyph={DotsThreeVertical} size={20} />
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </header>
            ) : (
                /* **Fixe, comme l'en-tête de toute liste** (17.8, 25/09) : le lieu, son état,
                   la jauge et les puces ne partent pas au premier défilement. */
                <div className="bg-surface border-outline-variant sticky top-0 z-20 border-b">
                    <Reading>
                        <BarreDePage
                            className="border-b-0"
                            title={
                                vueEcarts ? 'Écarts' : lieuDansLeSite || selectedSite || 'Campagne'
                            }
                            subtitle={
                                vueEcarts || !scopeIsReady ? undefined : (
                                    <>
                                        {lieuDansLeSite ? selectedSite : selectedCountry} ·{' '}
                                        <span
                                            className={cn(
                                                'font-semibold',
                                                PASTILLE_ETAT[etatAffiche.teinte].encre,
                                            )}
                                        >
                                            {etatAffiche.court}
                                        </span>
                                    </>
                                )
                            }
                            onBack={vueEcarts ? () => setVueEcarts(false) : onBack}
                            backLabel={vueEcarts ? 'Retour à la campagne' : 'Retour à l’inventaire'}
                            actions={
                                !vueEcarts && (
                                    <>
                                        {scopeIsReady && sessionTotal > 0 && (
                                            <Button
                                                variant="text"
                                                iconOnly
                                                aria-label="Chercher un actif"
                                                aria-pressed={rechercheOuverte}
                                                onClick={() => {
                                                    if (rechercheOuverte) setRecherche('');
                                                    setRechercheOuverte(!rechercheOuverte);
                                                }}
                                            >
                                                <Icon glyph={MagnifyingGlass} size="geste" />
                                            </Button>
                                        )}
                                        {auditFinalized ? (
                                            <Button
                                                variant="text"
                                                iconOnly
                                                onClick={exportRelevé}
                                                aria-label="Exporter le relevé"
                                            >
                                                <Icon glyph={Export} size="geste" />
                                            </Button>
                                        ) : (
                                            overflowItems.length > 0 && (
                                                <Menu
                                                    align="end"
                                                    items={overflowItems}
                                                    trigger={
                                                        <Button
                                                            variant="text"
                                                            iconOnly
                                                            aria-label="Autres actes"
                                                        >
                                                            <Icon
                                                                glyph={DotsThreeVertical}
                                                                size="geste"
                                                            />
                                                        </Button>
                                                    }
                                                />
                                            )
                                        )}
                                    </>
                                )
                            }
                        >
                            {scopeIsReady && !vueEcarts && sessionTotal > 0 && (
                                <>
                                    {/* La jauge : combien sont retrouvés, sur combien. */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-[0.875rem] leading-5">
                                                <b className="font-brand text-on-surface text-[1.125rem] font-semibold tabular-nums">
                                                    {sessionFound}
                                                </b>{' '}
                                                <span className="text-text-secondary">
                                                    sur {sessionTotal} retrouvé
                                                    {sessionFound > 1 ? 's' : ''}
                                                </span>
                                            </span>
                                            <span className="text-on-tint-vert text-[0.8125rem] leading-[1.125rem] font-semibold tabular-nums">
                                                {progressPercentage} %
                                            </span>
                                        </div>
                                        <span
                                            aria-hidden="true"
                                            className="bg-surface-muted-strong block h-1.5 overflow-hidden rounded-full"
                                        >
                                            <span
                                                className="mvt-jauge duration-medium2 ease-emphasized block h-full rounded-full bg-[var(--tk-color-st-vert)] transition-[width]"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </span>
                                    </div>
                                    <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
                                        {pucesDuTelephone.map((puce) => (
                                            <FacetChip
                                                compact
                                                key={puce.id}
                                                label={puce.label}
                                                count={puce.count}
                                                selected={ongletAffiche === puce.id}
                                                onClick={() => choisir(puce.id)}
                                                className={cn(
                                                    'border',
                                                    ongletAffiche === puce.id
                                                        ? 'border-inverse-surface'
                                                        : 'border-outline-variant bg-surface hover:bg-surface-container',
                                                )}
                                            />
                                        ))}
                                        {sessionExceptions > 0 && (
                                            <Button
                                                variant="text"
                                                onClick={() => setVueEcarts(true)}
                                                className={cn(
                                                    'text-ts-sub leading-ts-sub h-9 max-h-9 min-h-9 shrink-0 gap-1.5 rounded-md border px-3 font-medium',
                                                    pendingExceptions.length > 0
                                                        ? 'border-tint-orange text-on-tint-orange hover:bg-tint-orange active:bg-tint-orange bg-[color-mix(in_srgb,var(--tk-color-tint-orange)_45%,var(--tk-color-surface))]'
                                                        : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container',
                                                )}
                                            >
                                                Écarts
                                                <b className="font-bold tabular-nums">
                                                    {pendingExceptions.length > 0
                                                        ? pendingExceptions.length
                                                        : sessionExceptions}
                                                </b>
                                            </Button>
                                        )}
                                    </div>
                                    {rechercheOuverte && (
                                        <SearchField
                                            value={recherche}
                                            onChange={setRecherche}
                                            placeholder="Modèle, code, porteur"
                                            className="w-full"
                                        />
                                    )}
                                </>
                            )}
                        </BarreDePage>
                    </Reading>
                </div>
            )}

            {/* **Le corps défile, l'en-tête reste** (23/09). Au bureau, les tuiles restent en
                haut et chaque zone défile pour son compte : la liste à gauche, la campagne
                à droite. */}
            <div className={cn('overflow-y-auto', CADRE_BUREAU, 'expanded:flex-1')}>
                <div
                    className={cn(
                        'w-full',
                        enDeuxNiveaux
                            ? 'px-page flex h-full min-h-0 flex-col gap-5'
                            : 'px-page-sm medium:px-page mx-auto max-w-[960px] space-y-2.5 pt-3 pb-4',
                        /* La place du bouton « Scanner » flottant, sous la dernière rangée. */
                        !enDeuxNiveaux && sessionStarted && !auditFinalized && 'pb-28',
                    )}
                >
                    {!scopeIsReady ? (
                        /* **Une campagne sans lieu n'est pas une campagne.** L'écran renvoie à
                           la liste qui les porte déjà, avec ses statuts et ses comptes. */
                        <ScreenState
                            icon={MapPin}
                            title="Aucune campagne ouverte"
                            description="Une campagne porte sur un lieu : la vue globale le désigne, et sa rangée lance le relevé."
                            actions={
                                <Button variant="filled" onClick={backToOverview}>
                                    Choisir un lieu à compter
                                </Button>
                            }
                        />
                    ) : enDeuxNiveaux ? (
                        <>
                            <TuilesDeCampagne tuiles={tuiles} />
                            <div
                                className={cn(
                                    'grid flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4',
                                    /* **La hauteur que la colonne de droite demande** (28/09) :
                                       sur un écran bas (1024 × 768, portable de 1366 × 657),
                                       elle recoupait ses cartes. En deçà de ce minimum, c'est
                                       la page qui défile, et chaque carte reste entière. */
                                    campagne.etat === 'cloturee'
                                        ? 'large:min-h-[38rem] min-h-[42rem]'
                                        : exceptionsDisplay.length > 0
                                          ? 'min-h-[39rem]'
                                          : 'min-h-[26rem]',
                                )}
                            >
                                <section
                                    aria-label={`Les actifs — ${TITRE_DE_LISTE[ongletAffiche].toLowerCase()}`}
                                    className="rounded-card bg-surface col-span-8 flex min-h-0 flex-col overflow-hidden"
                                >
                                    {enteteDeListe}
                                    <div
                                        className={cn(
                                            'min-h-0 flex-1 overflow-y-auto px-5 pb-2',
                                            entreeListe && 'mvt-cascade',
                                        )}
                                    >
                                        {rangeesDeLaListe}
                                        {indicesDeLaListe}
                                    </div>
                                </section>
                                <aside
                                    aria-label="La campagne"
                                    className={cn(
                                        /* Les étapes gardent leur hauteur ; les écarts et l'activité
                                           se partagent le reste et défilent **dans** leur carte :
                                           la colonne coupait ses cartes au bas de l'écran (relevé
                                           du 28/09). Son propre défilement ne sert plus que de
                                           repli, sur une fenêtre très basse. */
                                        'col-span-4 flex min-h-0 flex-col gap-4 overflow-y-auto',
                                        entreePage && 'mvt-cascade-cartes',
                                    )}
                                >
                                    <EtapesDeCampagne
                                        etat={campagne.etat}
                                        lancee={
                                            premierComptage
                                                ? `${premierComptage.actorName} · ${formatQuand(premierComptage.timestamp)}`
                                                : undefined
                                        }
                                        total={sessionTotal}
                                        retrouves={sessionFound}
                                        scannes={Math.max(0, sessionFound - comptesALaMain)}
                                        manuels={comptesALaMain}
                                        ecartsATrancher={pendingExceptions.length}
                                        manquants={missingItems.length}
                                        corrigees={itemsCorriges.length}
                                        premiereCorrigee={
                                            itemsCorriges.length === 1
                                                ? itemsCorriges[0].model || itemsCorriges[0].name
                                                : undefined
                                        }
                                        cloture={
                                            campagne.cloture && {
                                                acteur: campagne.cloture.actorName,
                                                quand: formatQuand(campagne.cloture.timestamp),
                                            }
                                        }
                                        validation={
                                            campagne.validation && {
                                                acteur: campagne.validation.actorName,
                                                quand: formatQuand(campagne.validation.timestamp),
                                            }
                                        }
                                        renvoi={
                                            campagne.renvoi && {
                                                acteur: campagne.renvoi.actorName,
                                                quand: formatQuand(campagne.renvoi.timestamp),
                                                motif: String(
                                                    campagne.renvoi.metadata?.reason ?? '',
                                                ),
                                            }
                                        }
                                        peutCloturer={
                                            sessionStarted &&
                                            peutCompter &&
                                            !closureBlocked &&
                                            sessionTotal > 0 &&
                                            todoItems.length === 0
                                        }
                                        peutValider={peutValider}
                                        onCloturer={handleFinalizeAudit}
                                        onValider={validerLaCampagne}
                                        onRenvoyer={() => setRenvoiOuvert(true)}
                                        className="shrink-0"
                                    />

                                    {exceptionsDisplay.length > 0 && (
                                        <section
                                            ref={carteDesEcarts}
                                            aria-label="Les écarts"
                                            className="rounded-card bg-surface flex min-h-[13.5rem] shrink flex-col gap-2.5 px-[18px] py-4"
                                        >
                                            <div className="flex shrink-0 items-baseline justify-between gap-3">
                                                <h2 className="text-on-surface text-[1rem] leading-6 font-semibold">
                                                    Écarts
                                                </h2>
                                                <span
                                                    className={cn(
                                                        'text-[0.75rem] leading-4 font-semibold tabular-nums',
                                                        pendingExceptions.length > 0
                                                            ? 'text-on-tint-orange'
                                                            : 'text-text-secondary',
                                                    )}
                                                >
                                                    {pendingExceptions.length > 0
                                                        ? `${pendingExceptions.length} à trancher`
                                                        : `${sessionExceptions} tranché${sessionExceptions > 1 ? 's' : ''}`}
                                                </span>
                                            </div>
                                            <div className="-mr-2 flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-2">
                                                {exceptionsDisplay.map(renderEcartCompact)}
                                            </div>
                                        </section>
                                    )}

                                    {campagne.etat === 'cloturee' &&
                                    correctionsARelire.length > 0 ? (
                                        <section
                                            aria-label="Les fiches corrigées"
                                            className="rounded-card bg-surface flex min-h-[8rem] flex-1 flex-col px-[18px] py-4"
                                        >
                                            <h2 className="text-on-surface mb-2.5 shrink-0 text-[1rem] leading-6 font-semibold">
                                                Corrigé pendant le comptage
                                            </h2>
                                            <ul className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">
                                                {correctionsARelire.map(({ item, event }) => {
                                                    const note = event.metadata?.note;
                                                    return (
                                                        <li
                                                            key={item.id}
                                                            className="flex gap-2.5 text-[0.8125rem] leading-[1.1875rem]"
                                                        >
                                                            <span
                                                                aria-hidden="true"
                                                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--tk-color-st-ambre)]"
                                                            />
                                                            <span className="min-w-0">
                                                                <b className="text-on-surface font-medium">
                                                                    {item.model || item.name}
                                                                </b>{' '}
                                                                · {item.assetId}
                                                                {champsCorriges(event).map(
                                                                    (champ) => (
                                                                        <span
                                                                            key={champ.champ}
                                                                            className="block"
                                                                        >
                                                                            <span className="text-text-secondary">
                                                                                {champ.champ} :{' '}
                                                                            </span>
                                                                            <s className="text-text-secondary">
                                                                                {champ.de ||
                                                                                    'aucun'}
                                                                            </s>{' '}
                                                                            → {champ.a || 'aucun'}
                                                                        </span>
                                                                    ),
                                                                )}
                                                                <span className="text-text-secondary block">
                                                                    {event.actorName} ·{' '}
                                                                    {formatQuand(event.timestamp)}
                                                                    {typeof note === 'string' &&
                                                                    note
                                                                        ? ` · « ${note} »`
                                                                        : ''}
                                                                </span>
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </section>
                                    ) : (
                                        <ActiviteDeCampagne
                                            faits={faitsDActivite}
                                            className="min-h-[6.5rem] flex-1"
                                        />
                                    )}
                                </aside>
                            </div>
                            {/* La marge du bas, en élément : quand la grille dépasse (écran
                                bas), un `padding` du conteneur ne se compte pas dans le
                                défilement, et la dernière carte touchait le bord. */}
                            <div aria-hidden="true" className="h-1 shrink-0" />
                        </>
                    ) : vueEcarts ? (
                        /* **Le parc et les écarts sont deux écrans** au téléphone : la puce
                           « Écarts » mène à l'un, son retour ramène à l'autre. */
                        <div className="space-y-3">
                            <div className="text-body-small flex items-baseline justify-between gap-3 px-1">
                                <p className="text-text-secondary">
                                    {pendingExceptions.length > 0
                                        ? `${pendingExceptions.length} décision${pendingExceptions.length > 1 ? 's' : ''} en attente`
                                        : sessionExceptions > 0
                                          ? `${sessionExceptions} écart${sessionExceptions > 1 ? 's' : ''} tranché${sessionExceptions > 1 ? 's' : ''}`
                                          : 'Aucun écart'}
                                </p>
                                <p className="text-text-muted shrink-0">scannés hors attendus</p>
                            </div>
                            {exceptionsDisplay.length === 0
                                ? renderEmptyList('exceptions')
                                : exceptionsDisplay.map(renderCarteDEcart)}
                        </div>
                    ) : (
                        <>
                            {bandeauDeCampagne}

                            {/* **Valider un lot** (27/09) : on entre en sélection, on coche ce
                                qu'on voit, on valide d'un geste. */}
                            {selection.isActive && selectionPossible ? (
                                <div className="bg-inverse-surface text-inverse-on-surface sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md px-3 py-2">
                                    <span className="text-ts-sub leading-ts-sub min-w-0 flex-1 font-medium tabular-nums">
                                        {selection.count} sélectionné
                                        {selection.count > 1 ? 's' : ''} sur {todoItems.length}
                                    </span>
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={() =>
                                            selection.selectAll(todoItems.map((item) => item.id))
                                        }
                                        className="text-inverse-on-surface h-9 min-h-9 px-2 text-[0.8125rem] hover:bg-white/10"
                                    >
                                        Tout
                                    </Button>
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={selection.exit}
                                        className="text-inverse-on-surface h-9 min-h-9 px-2 text-[0.8125rem] hover:bg-white/10"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        variant="filled"
                                        size="sm"
                                        disabled={selection.count === 0}
                                        onClick={validerLaSelection}
                                        className="h-9 min-h-9 gap-1.5 px-3 text-[0.8125rem]"
                                    >
                                        <Icon glyph={Check} size={18} />
                                        Valider comme retrouvés
                                    </Button>
                                </div>
                            ) : (
                                (selectionPossible || listeCorrigeable) && (
                                    <div className="text-text-secondary flex min-h-9 items-center justify-between gap-3 px-0.5 text-[0.75rem] leading-4">
                                        <span className="min-w-0">
                                            {ongletAffiche === 'todo'
                                                ? 'Touchez un actif pour vérifier sa fiche'
                                                : 'Touchez un actif pour corriger sa fiche'}
                                        </span>
                                        {selectionPossible && (
                                            <Button
                                                variant="text"
                                                size="sm"
                                                onClick={() => selection.enter()}
                                                className="text-on-surface -mr-2 h-9 min-h-9 shrink-0 px-2 text-[0.8125rem]"
                                            >
                                                Sélectionner
                                            </Button>
                                        )}
                                    </div>
                                )
                            )}

                            <section
                                className={cn(
                                    'rounded-card bg-surface overflow-hidden px-4 py-0.5',
                                    entreeListe && 'mvt-cascade',
                                )}
                            >
                                {rangeesDeLaListe}
                                {indicesDeLaListe}
                            </section>
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
            {/* **« Scanner », bouton flottant étendu, au téléphone** (25/09) — l'ancrage des
                gestes flottants (17.6, 76 px du bas), le mot à côté du glyphe : c'est le
                geste de la page, et il se nomme. */}
            {!enDeuxNiveaux && sessionStarted && !auditFinalized && peutCompter && !scanOpen && (
                <FabContainer description={scanPossible ? 'Scanner' : 'Saisir un code'}>
                    <Button
                        variant="filled"
                        onClick={() => (scanPossible ? setScanOpen(true) : setManualOpen(true))}
                        icon={<Icon glyph={QrCode} size={24} />}
                        className="h-14 min-h-14 gap-2.5 rounded-xl px-5 text-[1rem] font-medium shadow-[0_6px_16px_rgba(10,25,29,0.24)]"
                    >
                        {scanPossible ? 'Scanner' : 'Saisir un code'}
                    </Button>
                </FabContainer>
            )}

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

            {ficheOuverte &&
                (() => {
                    const item = equipment.find((entry) => entry.id === ficheOuverte.id);
                    if (!item) return null;
                    return (
                        <FicheDeComptage
                            key={item.id}
                            equipement={item}
                            mode={ficheOuverte.mode}
                            utilisateurs={users}
                            services={locationData?.services?.[selectedSite] ?? []}
                            locaux={locationData?.locals?.[selectedSite] ?? []}
                            peutCorriger={peutCorriger}
                            onFermer={() => setFicheOuverte(null)}
                            onValider={(corrections, note) => {
                                if (!compterALaMain(item.id, corrections, note)) return;
                                setFicheOuverte(null);
                                showToast(
                                    corrections
                                        ? `${item.model || item.name} : fiche corrigée${ficheOuverte.mode === 'compter' ? ', retrouvé' : ''}.`
                                        : `${item.model || item.name} : retrouvé.`,
                                    'success',
                                );
                            }}
                        />
                    );
                })()}

            {/* Le renvoi — son motif est ce que l'opérateur lira en reprenant le comptage. */}
            <Modal
                isOpen={renvoiOuvert}
                onClose={() => setRenvoiOuvert(false)}
                title={`Renvoyer l’inventaire de ${selectedPlace}`}
                footer={
                    <>
                        <Button variant="outlined" onClick={() => setRenvoiOuvert(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={renvoyerLaCampagne}>
                            Renvoyer
                        </Button>
                    </>
                }
            >
                <TextArea
                    label="Ce qu’il faut revoir"
                    value={motifDeRenvoi}
                    onChange={(event) => setMotifDeRenvoi(event.target.value)}
                    rows={4}
                    placeholder="Recompter le bureau 204 : trois écrans n’y ont pas été vus."
                />
            </Modal>
        </div>
    );
};

export default AuditDetailsPage;
