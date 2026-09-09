import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Key,
    LockKey,
    ShieldWarning,
    Signature,
    SignOut,
    Warning,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import Toggle from '../../../components/ui/Toggle';
import BottomSheet from '../../../components/ui/BottomSheet';
import RuleGroup from '../../../components/ui/RuleGroup';
import DetailHero from '../../../components/ui/DetailHero';
import ActionCard from '../../../components/ui/ActionCard';
import PinField from '../../../components/ui/PinField';
import { isValidPinFormat, PIN_LENGTH } from '../../../lib/security';
import type { RuleRowTone } from '../../../components/ui/RuleGroup';
import Notice from '../../../components/ui/Notice';
import Reading from '../../../components/layout/Reading';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { authService } from '../../../services/authService';
import { parseAgentBatchContent } from '../../../lib/agentCheckin';
import { checkAgentApiHealth, postAgentCheckIn } from '../../../services/agentCollectionService';
import { APP_CONFIG } from '../../../config';
import type { BusinessRuleDecision } from '../../../lib/businessRules';
import type {
    AgentCheckInPayload,
    AppSettings,
    AutoCollectionSource,
    ViewType,
} from '../../../types';

/**
 * Paramètres — **porté sur la planche 14.1**.
 *
 * ## Ce que la planche a tranché
 *
 * L'écran tenait 891 lignes derrière **cinq onglets** — *Affichage · Compte &
 * Sécurité · Finances & Paramètres · Collecte automatique · Aide* — dont deux
 * seulement enregistraient, avec un bouton qui changeait de nom selon l'onglet
 * regardé. Le relevé de la planche dit pourquoi c'était intenable : ces cinq
 * sections **n'appartiennent pas aux mêmes personnes**. Deux sont à la personne,
 * une à l'entreprise, une à l'informatique, et la dernière ne se règle pas.
 *
 * **Paramètres devient une liste de destinations**, rangée par propriétaire :
 * quatre **groupes à filets** (`RuleGroup`, R4 de 00.1) au lieu de onze cartes
 * blanches, et **la valeur passe à droite de la rangée**, où elle se lit sans
 * ouvrir. Une personne qui vient changer la devise ne traverse plus les réglages de
 * l'agent local.
 *
 * ## Les quatre retraits, et ce qui les justifie
 *
 * - **La section « Affichage »** portait un seul réglage — un thème clair qu'on ne
 *   peut pas changer — et une promesse : *« Le mode sombre sera proposé dans une
 *   prochaine version. »* On n'annonce pas ce qui n'existe pas, et le clair est une
 *   **décision d'identité**, pas une attente. Le fait descend en ligne d'« À propos ».
 * - **La file des machines détectées** n'est pas un réglage, c'est **du travail qui
 *   attend quelqu'un** : sa place est *Tâches › À faire*, au même titre qu'une
 *   demande à valider. Paramètres règle les sources ; il ne garde pas leur produit.
 * - **Le bouton « Enregistrer » par section.** Un geste qui apparaît et se renomme
 *   selon l'endroit apprend qu'un réglage posé **ne compte pas tant qu'on n'a pas
 *   trouvé le bouton**. Il ne reste qu'en pied de feuille, là où des champs valent
 *   ensemble ou pas du tout : les identifiants d'une source.
 * - **Le « Centre d'aide » et ses quatre pavés** — *Documentation · Support ·
 *   Tutoriels · FAQ* — étaient des `<Button variant="outlined">` **sans `onClick`** :
 *   ils réagissaient au survol et ne menaient nulle part. Un geste mort est pire
 *   qu'un manque. Il en reste **une ligne**, « Contacter le support », qui ne
 *   s'affiche que si l'organisation a rempli l'adresse.
 *
 * ## Deux écarts relevés au portage, et ce qu'ils changent au texte
 *
 * La planche fait dire à l'amortissement qu'il *« décide de la valeur de 14 actifs »*.
 * Le code disait le contraire : `settings.defaultDepreciationYears` **n'avait aucun
 * consommateur** — `AddEquipmentPage` retombait sur un `GLOBAL_FINANCIAL_SETTINGS`
 * écrit en dur à côté. Le portage **branche le réglage** sur la cascade réelle
 * (fiche → type → défaut global) ; et comme les huit types portent déjà leur durée,
 * l'écran dit la vérité mesurée sur la donnée, pas le chiffre de la planche.
 *
 * `renewalThreshold` et `roundingRule` restent sans consommateur **et sans écran** :
 * un réglage qui ne change rien ne mérite pas une rangée.
 */

interface SettingsPageProps {
    onLogout: () => void;
    /** La file de collecte vit dans Tâches : cette page y renvoie, elle ne la refait pas. */
    onNavigate?: (view: ViewType) => void;
    /**
     * La section ouverte d'emblée, quand on n'arrive pas par l'index. « Mon compte » du
     * menu de l'avatar (03.1) et « Sécurité et connexion » de Paramètres mènent **au même
     * écran** — celui de la planche 07.1 — et le second point d'entrée est un renvoi, pas
     * une copie. L'adresse le porte : `/settings/account`.
     */
    initialSection?: 'account';
    /** Paramètres s'atteint depuis la feuille « Plus » : la barre en garde le retour. */
    onBack?: () => void;
}

/** Les vues de l'écran. Chacune est un état de Paramètres, pas une page du produit. */
type SettingsView =
    'index' | 'account' | 'currency' | 'depreciation' | 'inventory' | 'files' | 'sources';

const VIEW_TITLE: Record<SettingsView, string> = {
    index: 'Paramètres',
    account: 'Mon compte',
    currency: 'Devise et année fiscale',
    depreciation: 'Amortissement',
    inventory: "Périodicité de l'inventaire",
    files: "Taille maximale d'un fichier",
    sources: 'Sources de collecte',
};

/**
 * Les périodes proposées. Un inventaire physique se tient au trimestre, au semestre,
 * à l'année ou aux deux ans : au-delà, le parc a changé plus que la liste.
 */
const INVENTORY_PERIODS = [3, 6, 12, 24];

/**
 * Les bornes proposées. 5 Mo est l'arbitrage du 06/09 (17.10) ; les trois autres
 * encadrent ce qu'un tableur d'inventaire et une photo d'incident pèsent réellement.
 */
const FILE_LIMITS = [2, 5, 10, 20];

/** Ce que chaque choix veut dire, pour que la durée ne soit pas qu'un chiffre. */
const PERIOD_SUBTITLES: Record<number, string> = {
    3: 'Un parc qui bouge tous les jours',
    6: 'Deux comptages par an',
    12: 'Le rythme courant d’un inventaire annuel',
    24: 'Un parc stable, peu de mouvements',
};

const FILE_LIMIT_SUBTITLES: Record<number, string> = {
    2: 'Un tableur, pas une photo',
    5: 'Un tableur et une photo de téléphone',
    10: 'Une facture scannée, plusieurs pages',
    20: 'Tout passe, la lecture peut être longue',
};

/**
 * L'ordinal se compose : 14.1 écrit `1<sup>er</sup> janv.`. L'exposant rend trois
 * pixels à la rangée — assez pour que « Devise et année fiscale » ne se coupe plus.
 */
const Premier: React.FC = () => (
    <>
        1<sup className="text-[0.7em] leading-none">er</sup>
    </>
);

const FISCAL_MONTHS: Array<{
    value: string;
    label: React.ReactNode;
    short: React.ReactNode;
}> = [
    {
        value: '01',
        label: (
            <>
                <Premier /> janvier
            </>
        ),
        short: (
            <>
                <Premier /> janv.
            </>
        ),
    },
    {
        value: '04',
        label: (
            <>
                <Premier /> avril
            </>
        ),
        short: (
            <>
                <Premier /> avr.
            </>
        ),
    },
    {
        value: '09',
        label: (
            <>
                <Premier /> septembre
            </>
        ),
        short: (
            <>
                <Premier /> sept.
            </>
        ),
    },
];

const DEPRECIATION_METHODS: Array<{
    value: AppSettings['defaultDepreciationMethod'];
    label: string;
}> = [
    { value: 'linear', label: 'Linéaire' },
    { value: 'degressive', label: 'Dégressif' },
];

interface SourceDescriptor {
    id: AutoCollectionSource;
    title: string;
    subtitle: string;
    enabledKey: keyof AppSettings;
}

/** Les trois sources relevées dans le code, dans l'ordre où 14.1 les pose. */
const SOURCES: SourceDescriptor[] = [
    {
        id: 'agent',
        title: 'Agent local',
        subtitle: 'GPO / Intune',
        enabledKey: 'autoCollectionAgentEnabled',
    },
    {
        id: 'active_directory',
        title: 'Annuaire',
        subtitle: 'LDAP',
        enabledKey: 'autoCollectionAdEnabled',
    },
    {
        id: 'network_scan',
        title: 'Scan réseau',
        subtitle: 'Passif, sur les plages déclarées',
        enabledKey: 'autoCollectionNetworkEnabled',
    },
];

/** « il y a 6 j » — l'état d'une source, c'est ce qu'elle a renvoyé **et quand**. */
const daysSince = (iso: string): number =>
    Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

/**
 * La barre de Paramètres — **deux formes, et aucun sous-titre** (R16).
 *
 * 14.1 n'écrit pas la même barre sur ses trois colonnes, et la différence n'est pas
 * cosmétique : l'index est **une liste de destinations**, il porte donc la barre des
 * listes — `.top`, titre à **28/32** comme Actifs, Catalogue, Emplacements et
 * Finances. Une sous-vue est **un objet ouvert** : elle porte la barre de fiche —
 * `.tbar`, le nom du réglage en `.code` à **17/24**, la flèche de retour à gauche.
 *
 * Ce qui tombe : la ligne « Paramètres · vous » sous le titre. R16 — *une barre porte
 * un titre, un étage, jamais un sous-titre* — et le propriétaire du réglage est déjà
 * dit par le groupe à filets d'où l'on vient (« Vous », « L'entreprise »,
 * « L'informatique »). La barre le redisait un étage plus haut, dans un corps de
 * 11 px étiré par `text-label-small`.
 */
const SettingsBar: React.FC<{
    title: string;
    onBack?: () => void;
    /** L'index porte la barre de liste ; une sous-vue porte la barre de fiche. */
    variant: 'liste' | 'fiche';
}> = ({ title, onBack, variant }) => {
    const retour = onBack && (
        <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="shrink-0">
            <Icon glyph={ArrowLeft} size={24} />
        </Button>
    );

    if (variant === 'fiche') {
        return (
            <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-1 border-b pr-2 pl-1">
                {retour}
                <h1 className="font-brand text-on-surface min-w-0 flex-1 truncate px-1 text-[17px] leading-6 font-semibold tracking-[-0.01em]">
                    {title}
                </h1>
            </div>
        );
    }

    return (
        <div className="border-outline-variant bg-surface flex flex-col gap-3 border-b px-4 pt-2 pb-3">
            <div className="flex min-h-12 items-center gap-1">
                {retour}
                <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                    {title}
                </h1>
            </div>
        </div>
    );
};

/** « Kafui Charbel EKLU » → « KE ». Les deux bouts d'un nom, jamais trois lettres. */
const initiales = (nom?: string): string => {
    const mots = (nom ?? '').trim().split(/\s+/).filter(Boolean);
    if (mots.length === 0) return '?';
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
    return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
};

const SettingsPage: React.FC<SettingsPageProps> = ({
    onLogout,
    onNavigate,
    initialSection,
    onBack,
}) => {
    const { showToast } = useToast();
    const { currentUser } = useAuth();
    const {
        settings,
        updateSettings,
        equipment,
        categories,
        detectedDevices,
        ingestAgentCheckIn,
        setUserPin,
    } = useData();

    const [view, setView] = useState<SettingsView>(initialSection ?? 'index');

    /* L'adresse change sans démontage quand on revient sur Paramètres depuis le menu. */
    useEffect(() => {
        if (initialSection) setView(initialSection);
    }, [initialSection]);

    /** La feuille d'une source — le seul endroit de l'écran qui garde un pied. */
    const [openSource, setOpenSource] = useState<AutoCollectionSource | null>(null);
    const [sourceDraft, setSourceDraft] = useState<AppSettings>(settings);
    const [sourceError, setSourceError] = useState<string | null>(null);

    const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
    const [pinSheetOpen, setPinSheetOpen] = useState(false);

    /**
     * `.ty` du héro de 07.1 — *« Finances · Lomé Siège · mot de passe local »*. Le
     * troisième terme dit le **mode de connexion** ; ce produit n'en a qu'un et ne
     * vérifie rien à l'ouverture, alors l'écrire serait affirmer un fait de sécurité
     * qui n'existe pas. Restent le service et le site, tous deux portés par la fiche.
     */
    const identiteLabel = useMemo(
        () =>
            [currentUser?.department, currentUser?.site].filter(Boolean).join(' · ') ||
            currentUser?.role,
        [currentUser],
    );
    const [feedSheetOpen, setFeedSheetOpen] = useState(false);

    useEffect(() => {
        if (!openSource) setSourceDraft(settings);
    }, [openSource, settings]);

    /** Un réglage s'applique **au geste** : il n'attend pas un bouton (14.1). */
    const apply = (patch: Partial<AppSettings>) => updateSettings({ ...settings, ...patch });

    const fiscalMonth = useMemo(
        () =>
            FISCAL_MONTHS.find((month) => month.value === settings.fiscalYearStart) ??
            FISCAL_MONTHS[0],
        [settings.fiscalYearStart],
    );

    /**
     * Ce que le réglage d'amortissement décide **réellement** : les actifs dont ni la
     * fiche ni le type ne portent de plan. Le chiffre est compté sur la donnée — la
     * planche en annonçait 14 sans avoir vu la cascade.
     */
    const governedAssets = useMemo(() => {
        const typedWithoutPlan = new Set(
            categories
                .filter((category) => !category.defaultDepreciation?.years)
                .map((category) => category.name),
        );
        return equipment.filter(
            (item) => !item.financial?.depreciationYears && typedWithoutPlan.has(item.type),
        ).length;
    }, [categories, equipment]);

    /**
     * Combien de lieux la périodicité gouverne. 14.1 écrit *« Donne son sens à “en
     * retard” sur 6 sites »* : ce n'est pas le nombre de retardataires mais **l'étendue
     * du réglage**, comme « 14 actifs » sous l'amortissement. Un site sans aucun objet
     * n'a rien à compter : il n'entre pas dans le compte.
     */
    const sitesInventories = useMemo(
        () =>
            new Set(
                equipment.map((item) => (item.site || '').trim()).filter((site) => site.length > 0),
            ).size,
        [equipment],
    );

    const typesWithOwnPlan = useMemo(
        () => categories.filter((category) => Boolean(category.defaultDepreciation?.years)).length,
        [categories],
    );

    /** L'état d'une source : ce qu'elle a renvoyé, et quand. */
    const sourceState = useMemo(() => {
        const bySource = new Map<AutoCollectionSource, { last: string | null; count: number }>();
        SOURCES.forEach((source) => bySource.set(source.id, { last: null, count: 0 }));

        detectedDevices.forEach((device) => {
            const entry = bySource.get(device.source);
            if (!entry) return;
            entry.count += 1;
            if (!entry.last || new Date(device.lastSeenAt) > new Date(entry.last)) {
                entry.last = device.lastSeenAt;
            }
        });

        return bySource;
    }, [detectedDevices]);

    const enabledSources = useMemo(
        () => SOURCES.filter((source) => Boolean(settings[source.enabledKey])).length,
        [settings],
    );

    /**
     * La source dont l'état mérite d'être remonté au sommaire : celle qui est active
     * et qui **ne dit plus rien**. Une source éteinte n'est pas une anomalie.
     */
    const stalestSource = useMemo(() => {
        let worst: { title: string; days: number } | null = null;
        SOURCES.forEach((source) => {
            if (!settings[source.enabledKey]) return;
            const last = sourceState.get(source.id)?.last;
            const days = last ? daysSince(last) : Infinity;
            if (days < 2) return;
            if (!worst || days > worst.days) worst = { title: source.title, days };
        });
        return worst as { title: string; days: number } | null;
    }, [settings, sourceState]);

    const pendingDevices = useMemo(
        () =>
            detectedDevices.filter((device) =>
                ['pending_review', 'ambiguous_match'].includes(device.status),
            ).length,
        [detectedDevices],
    );

    /**
     * **L'état que la rangée « Mon compte » porte, c'est celui du code PIN.**
     *
     * Elle portait « 2FA active / inactive », lu d'un `useState` local — un fait
     * inventé à chaque montage, remis à *inactive* au rechargement, et derrière
     * lequel il n'y avait aucun second facteur. Le code de remise, lui, est **réel**
     * (`User.pin`, lu par `Attestation`), il décide de la façon dont une remise
     * s'atteste, et son absence est déjà signalée par la feuille « Plus ».
     */
    const codePin: { tone: RuleRowTone; icon: PhosphorGlyph; label: string } = currentUser?.pin
        ? { tone: 'positive', icon: CheckCircle, label: 'Code PIN défini' }
        : { tone: 'pending', icon: ShieldWarning, label: 'Code PIN à définir' };

    const openSourceSheet = (id: AutoCollectionSource) => {
        setSourceDraft(settings);
        setSourceError(null);
        setOpenSource(id);
    };

    const saveSource = () => {
        updateSettings(sourceDraft);
        setOpenSource(null);
        setSourceError(null);
        showToast('Source enregistrée.', 'success');
    };

    const testApiConnection = async () => {
        if (!sourceDraft.autoCollectionApiBaseUrl.trim()) {
            setSourceError("L'URL de l'API est vide : rien à joindre.");
            return;
        }
        const health = await checkAgentApiHealth(sourceDraft.autoCollectionApiBaseUrl);
        if (!health.ok) {
            setSourceError(
                'L’API n’a pas répondu. Vos deux réglages restent écrits — aucune source n’a été enregistrée.',
            );
            return;
        }
        setSourceError(null);
        showToast(`API joignable (${health.service || 'service check-in'}).`, 'success');
    };

    const ingestWithOptionalApiForwarding = async (rawPayload: AgentCheckInPayload) => {
        const payload: AgentCheckInPayload = {
            ...rawPayload,
            apiKey: rawPayload.apiKey || settings.autoCollectionAgentApiKey,
        };
        const forward =
            settings.autoCollectionForwardToApi &&
            Boolean(settings.autoCollectionApiBaseUrl.trim());

        if (forward) {
            await postAgentCheckIn(
                settings.autoCollectionApiBaseUrl,
                payload,
                settings.autoCollectionAgentApiKey,
            );
        }
        return ingestAgentCheckIn(payload);
    };

    const importCheckInFiles = async (files: File[]) => {
        if (!files.length) return;
        let accepted = 0;
        let rejected = 0;

        try {
            for (const file of files) {
                const parsed = parseAgentBatchContent(await file.text());
                for (const payload of parsed.payloads) {
                    const result = await ingestWithOptionalApiForwarding(payload);
                    if (result.ok) accepted += 1;
                    else rejected += 1;
                }
                rejected += parsed.errors.length;
            }
        } catch {
            showToast('Impossible de lire les fichiers de remontée.', 'error');
            return;
        }

        setFeedSheetOpen(false);
        if (accepted && !rejected) {
            showToast(`${accepted} remontée(s), en attente dans Tâches.`, 'success');
        } else if (accepted) {
            showToast(`${accepted} remontée(s), ${rejected} rejetée(s).`, 'warning');
        } else {
            showToast('Aucune entrée valide dans les fichiers.', 'error');
        }
    };

    const goBack = () => setView('index');

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <SettingsBar
                title={VIEW_TITLE[view]}
                variant={view === 'index' ? 'liste' : 'fiche'}
                onBack={view === 'index' ? onBack : goBack}
            />

            {/* `.page` de 14.1 — `16px 16px 24px`. La gouttière valait 20 : quatre pixels
                pris de chaque côté à des rangées qui n'en avaient pas de trop. */}
            <div className="medium:px-page flex-1 overflow-y-auto px-4 pt-4 pb-6">
                <Reading className="flex flex-col gap-5 pb-16">
                    {view === 'index' && (
                        <>
                            <RuleGroup
                                header="Vous"
                                note="Une seule vue pour ces réglages, atteinte aussi depuis votre avatar. Cette ligne ne les refait pas, elle y mène."
                            >
                                <RuleGroup.Row
                                    title="Mon compte"
                                    /* Le sous-titre **ne répète pas le contenu** : il dit la
                                       conséquence. « Mot de passe, double authentification,
                                       session » énumérait ce qu'il y a derrière la porte —
                                       ce que le chevron dit déjà. */
                                    subtitle={
                                        currentUser?.pin
                                            ? 'Votre code atteste vos remises'
                                            : 'Sans code, chaque remise se trace'
                                    }
                                    status={{ icon: codePin.icon, tone: codePin.tone }}
                                    value={codePin.label}
                                    valueTone={codePin.tone}
                                    onOpen={() => setView('account')}
                                />
                            </RuleGroup>

                            <RuleGroup header="L'entreprise">
                                <RuleGroup.Row
                                    title="Devise et année fiscale"
                                    subtitle="Tout montant du produit s'écrit avec"
                                    /* 14.1 écrit `XOF · 1<sup>er</sup> janv.` — et
                                       l'exposant n'est pas un ornement : sans lui la
                                       valeur prenait trois pixels de trop et coupait
                                       « Devise et année fisc… ». */
                                    value={
                                        <>
                                            {settings.currency} · {fiscalMonth.short}
                                        </>
                                    }
                                    onOpen={() => setView('currency')}
                                />
                                <RuleGroup.Row
                                    title="Amortissement par défaut"
                                    subtitle={
                                        governedAssets > 0
                                            ? `Décide de la valeur de ${governedAssets} actif${governedAssets > 1 ? 's' : ''}`
                                            : 'Sert quand ni le type ni la fiche ne portent le leur'
                                    }
                                    value={`${settings.defaultDepreciationYears} ans`}
                                    onOpen={() => setView('depreciation')}
                                />
                                {/* Les deux bornes ajoutées à la planche le 05/09. Elles
                                    existaient dans le code — l'une nulle part, l'autre en
                                    dur dans `lib/fileImport.ts` — mais ne se réglaient
                                    d'aucun écran. */}
                                <RuleGroup.Row
                                    title="Périodicité de l'inventaire"
                                    subtitle={
                                        sitesInventories > 0
                                            ? `Donne son sens à « en retard » sur ${sitesInventories} site${sitesInventories > 1 ? 's' : ''}`
                                            : 'Dit au bout de combien de temps un lieu est à recompter'
                                    }
                                    value={`${settings.inventoryPeriodMonths} mois`}
                                    onOpen={() => setView('inventory')}
                                />
                                <RuleGroup.Row
                                    title="Taille maximale d'un fichier"
                                    subtitle="Vaut pour tout fichier déposé — tableur, pièce, photo"
                                    value={`${settings.maxImportFileMb} Mo`}
                                    onOpen={() => setView('files')}
                                />
                            </RuleGroup>

                            <RuleGroup
                                header="L'informatique"
                                note={
                                    <>
                                        Ce que les sources produisent est{' '}
                                        <strong className="text-text-secondary font-medium">
                                            du travail
                                        </strong>
                                        , pas un réglage : il attend dans la file, avec le reste.
                                        Paramètres règle les sources ; il ne garde pas leur produit.
                                    </>
                                }
                            >
                                <RuleGroup.Row
                                    title="Sources de collecte"
                                    subtitle={
                                        stalestSource
                                            ? `${stalestSource.title} n'a rien renvoyé depuis ${stalestSource.days} jours`
                                            : 'Agent local, annuaire, scan réseau'
                                    }
                                    status={
                                        stalestSource ? { icon: Clock, tone: 'pending' } : undefined
                                    }
                                    value={
                                        enabledSources === 0
                                            ? 'Aucune active'
                                            : `${enabledSources} active${enabledSources > 1 ? 's' : ''} sur ${SOURCES.length}`
                                    }
                                    valueTone={
                                        enabledSources === 0
                                            ? 'muted'
                                            : stalestSource
                                              ? 'pending'
                                              : undefined
                                    }
                                    onOpen={() => setView('sources')}
                                />
                                {pendingDevices > 0 && (
                                    <RuleGroup.Row
                                        title={`${pendingDevices} machine${pendingDevices > 1 ? 's' : ''} détectée${pendingDevices > 1 ? 's' : ''} à valider`}
                                        subtitle="Ce que les sources produisent attend dans Tâches › À faire"
                                        external
                                        onOpen={() => onNavigate?.('tasks')}
                                    />
                                )}
                            </RuleGroup>

                            {/* La note disait que les objets de démonstration revenaient à
                                chaque chargement. Le jeu de démonstration a été retiré et le
                                parc est désormais celui du tableur : la phrase décrivait un
                                produit qui n'existe plus, et un écran de réglages est le
                                dernier endroit où l'on peut se permettre de mentir. */}
                            <RuleGroup header="À propos">
                                <RuleGroup.Row title="Version" value={APP_CONFIG.version} />
                                {/* 14.1 : `Thème | Clair — identité Neemba`. La décision
                                    est **dans la valeur**, pas dans une phrase de 69
                                    signes sous le titre — une rangée d'« À propos » se
                                    lit, elle ne se plaide pas. */}
                                <RuleGroup.Row title="Thème" value="Clair — identité Neemba" />
                                {APP_CONFIG.supportEmail && (
                                    /* La planche ne met **aucune valeur** sur cette
                                       rangée : elle mène ailleurs, elle ne se lit pas.
                                       L'adresse en valeur prenait 155 px pour 88
                                       disponibles, et le titre partait en « Contacter
                                       le su… ». Elle passe en sous-titre, où elle
                                       reste lisible sans disputer la place. */
                                    <RuleGroup.Row
                                        title="Contacter le support"
                                        subtitle={APP_CONFIG.supportEmail}
                                        onOpen={() => {
                                            window.location.href = `mailto:${APP_CONFIG.supportEmail}`;
                                        }}
                                        external
                                    />
                                )}
                            </RuleGroup>
                        </>
                    )}

                    {view === 'account' && (
                        <>
                            {/* `.prof` de 07.1 — **le héro ne porte que l'identité**.
                                *« Un acte n'a qu'une entrée, dans sa carte »* : pas de
                                geste ici, pas de qualifiant chiffré. */}
                            <DetailHero
                                avatar={
                                    <span className="font-brand text-[20px] font-semibold">
                                        {initiales(currentUser?.name)}
                                    </span>
                                }
                                label={identiteLabel}
                                subject={currentUser?.name ?? 'Mon compte'}
                                subtitle={currentUser?.email}
                            />

                            <ActionCard title="Me connecter">
                                <ActionCard.Row
                                    glyph={LockKey}
                                    title="Changer mon mot de passe"
                                    subtitle="il ouvre la session, il ne signe pas"
                                    onOpen={() => setPasswordSheetOpen(true)}
                                />
                            </ActionCard>

                            {/* La carte que 07.1 appelle « Prouver une remise », et qui
                                manquait entièrement. `NavigationBar` promettait déjà
                                *« code PIN à définir »* sur la rangée « Mon compte » de
                                la feuille « Plus » — la destination ne tenait pas la
                                promesse : aucune rangée n'y parlait du code. */}
                            <ActionCard title="Prouver une remise">
                                <ActionCard.Row
                                    glyph={Key}
                                    title={
                                        currentUser?.pin
                                            ? 'Remplacer mon code PIN'
                                            : 'Définir mon code PIN'
                                    }
                                    subtitle={
                                        currentUser?.pin
                                            ? "l'ancien cessera aussitôt de valoir"
                                            : 'sans lui, chaque remise se trace'
                                    }
                                    onOpen={() => setPinSheetOpen(true)}
                                />
                                {/* 07.1 dessine une **signature enregistrée** — importée,
                                    recadrée, apposée d'elle-même. Ce produit ne la porte
                                    pas : `Attestation` fait tracer la signature au moment
                                    de la remise, et rien ne la garde. La rangée dit donc
                                    ce qui est, et n'ouvre rien : une porte qui ne mène
                                    nulle part vaut moins qu'une phrase vraie. */}
                                <ActionCard.Row
                                    glyph={Signature}
                                    title="Ma signature"
                                    subtitle="tracée à chaque remise, jamais conservée"
                                />
                            </ActionCard>

                            <ActionCard title="Où je suis connecté">
                                <ActionCard.Row
                                    glyph={SignOut}
                                    title="Se déconnecter"
                                    subtitle="de cet appareil seulement"
                                    onOpen={onLogout}
                                />
                            </ActionCard>
                        </>
                    )}
                    {view === 'currency' && (
                        <>
                            <RuleGroup
                                header="Lecture des montants"
                                note="Ces réglages ne changent pas un calcul mais une lecture : tous les montants du produit s'écrivent avec."
                            >
                                <RuleGroup.Row
                                    title="Devise"
                                    subtitle="Le franc CFA est la seule devise du parc"
                                    value={settings.currency}
                                />
                                <RuleGroup.Row
                                    title="Notation compacte"
                                    subtitle="1 200 000 s'écrit 1,2 M"
                                    trailing={
                                        <Toggle
                                            checked={settings.compactNotation}
                                            onChange={(value) => apply({ compactNotation: value })}
                                        />
                                    }
                                />
                            </RuleGroup>

                            <RuleGroup header="Début de l'année fiscale">
                                {FISCAL_MONTHS.map((month) => (
                                    <RuleGroup.Row
                                        key={month.value}
                                        title={month.label}
                                        status={
                                            settings.fiscalYearStart === month.value
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={
                                            settings.fiscalYearStart === month.value
                                                ? 'Retenu'
                                                : undefined
                                        }
                                        valueTone={
                                            settings.fiscalYearStart === month.value
                                                ? 'positive'
                                                : undefined
                                        }
                                        onOpen={() => apply({ fiscalYearStart: month.value })}
                                        choice
                                    />
                                ))}
                            </RuleGroup>

                            <p className="text-text-muted text-[12px] leading-[17px]">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'depreciation' && (
                        <>
                            <RuleGroup
                                header="Par défaut"
                                note={
                                    <>
                                        Un plan se prend d'abord sur la fiche, puis sur le type, et
                                        seulement ensuite ici.
                                        {typesWithOwnPlan === categories.length &&
                                        categories.length > 0
                                            ? ` Les ${categories.length} types portent déjà le leur : ce plan ne sert donc qu'aux types créés sans lui.`
                                            : ` ${categories.length - typesWithOwnPlan} type(s) n'en portent pas : ce plan est le leur.`}{' '}
                                        Les changer{' '}
                                        <strong className="text-text-secondary font-medium">
                                            ne touche pas au passé
                                        </strong>{' '}
                                        : les objets déjà amortis gardent leur plan, les prochains
                                        prennent le nouveau.
                                    </>
                                }
                            >
                                {DEPRECIATION_METHODS.map((method) => (
                                    <RuleGroup.Row
                                        key={method.value}
                                        title={method.label}
                                        subtitle={
                                            method.value === 'linear'
                                                ? 'La valeur se répartit également sur la durée'
                                                : 'La valeur tombe plus vite les premières années'
                                        }
                                        status={
                                            settings.defaultDepreciationMethod === method.value
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={
                                            settings.defaultDepreciationMethod === method.value
                                                ? 'Retenue'
                                                : undefined
                                        }
                                        valueTone={
                                            settings.defaultDepreciationMethod === method.value
                                                ? 'positive'
                                                : undefined
                                        }
                                        onOpen={() =>
                                            apply({ defaultDepreciationMethod: method.value })
                                        }
                                        choice
                                    />
                                ))}
                            </RuleGroup>

                            <RuleGroup header="Durée et fin de vie">
                                <RuleGroup.Row
                                    title="Durée"
                                    subtitle="Au bout de laquelle un objet ne vaut plus rien au bilan"
                                    trailing={
                                        <InputField
                                            mesure="courte"
                                            type="number"
                                            aria-label="Durée en années"
                                            value={String(settings.defaultDepreciationYears)}
                                            onChange={(event) =>
                                                apply({
                                                    defaultDepreciationYears: Number(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-24"
                                        />
                                    }
                                />
                                <RuleGroup.Row
                                    title="Valeur résiduelle"
                                    subtitle="Ce qu'il vaut encore à la fin, en pourcentage"
                                    trailing={
                                        <InputField
                                            mesure="courte"
                                            type="number"
                                            aria-label="Valeur résiduelle en pourcentage"
                                            value={String(settings.salvageValuePercent)}
                                            onChange={(event) =>
                                                apply({
                                                    salvageValuePercent: Number(event.target.value),
                                                })
                                            }
                                            className="w-24"
                                        />
                                    }
                                />
                            </RuleGroup>

                            <RuleGroup
                                header="Ce que porte chaque type"
                                headerTrailing={`${typesWithOwnPlan} sur ${categories.length}`}
                            >
                                {categories.map((category) => (
                                    <RuleGroup.Row
                                        key={category.id}
                                        title={category.name}
                                        value={
                                            category.defaultDepreciation?.years
                                                ? `${category.defaultDepreciation.years} ans`
                                                : 'Prend le défaut'
                                        }
                                        valueTone={
                                            category.defaultDepreciation?.years
                                                ? undefined
                                                : 'muted'
                                        }
                                    />
                                ))}
                            </RuleGroup>

                            <Notice>
                                <strong className="text-on-surface font-medium">
                                    La devise et l'année fiscale sont ailleurs.
                                </strong>{' '}
                                Elles ne changent pas un calcul mais une lecture.
                            </Notice>

                            <p className="text-text-muted text-[12px] leading-[17px]">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'inventory' && (
                        <>
                            <RuleGroup
                                header="Recompter un lieu"
                                note={
                                    <>
                                        Au-delà de cette durée, un lieu que personne n'a recompté
                                        est dit{' '}
                                        <strong className="text-text-secondary font-medium">
                                            en retard
                                        </strong>{' '}
                                        dans l'inventaire physique. Le réglage ne lance rien : il
                                        dit à partir de quand le silence devient un manque.
                                    </>
                                }
                            >
                                {INVENTORY_PERIODS.map((mois) => (
                                    <RuleGroup.Row
                                        key={mois}
                                        title={`${mois} mois`}
                                        subtitle={PERIOD_SUBTITLES[mois]}
                                        status={
                                            settings.inventoryPeriodMonths === mois
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={
                                            settings.inventoryPeriodMonths === mois
                                                ? 'Retenue'
                                                : undefined
                                        }
                                        valueTone={
                                            settings.inventoryPeriodMonths === mois
                                                ? 'positive'
                                                : undefined
                                        }
                                        onOpen={() => apply({ inventoryPeriodMonths: mois })}
                                        choice
                                    />
                                ))}
                            </RuleGroup>

                            <p className="text-text-muted text-[12px] leading-[17px]">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'files' && (
                        <>
                            <RuleGroup
                                header="Ce qu'un dépôt accepte"
                                note="Un fichier au-delà de la borne est refusé au dépôt, nommé et mesuré — il ne part pas dans une lecture qui ne finira pas. La borne vaut pour toutes les formes : le tableur d'un import, la pièce jointe d'une facture, la photo d'un incident."
                            >
                                {FILE_LIMITS.map((mo) => (
                                    <RuleGroup.Row
                                        key={mo}
                                        title={`${mo} Mo`}
                                        subtitle={FILE_LIMIT_SUBTITLES[mo]}
                                        status={
                                            settings.maxImportFileMb === mo
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={
                                            settings.maxImportFileMb === mo ? 'Retenue' : undefined
                                        }
                                        valueTone={
                                            settings.maxImportFileMb === mo ? 'positive' : undefined
                                        }
                                        onOpen={() => apply({ maxImportFileMb: mo })}
                                        choice
                                    />
                                ))}
                            </RuleGroup>

                            <p className="text-text-muted text-[12px] leading-[17px]">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'sources' && (
                        <>
                            <RuleGroup note="L'état d'une source, c'est ce qu'elle a renvoyé et quand. Une source qui ne dit plus rien depuis six jours est le seul fait qui mérite d'être remonté au sommaire.">
                                {SOURCES.map((source) => {
                                    const enabled = Boolean(settings[source.enabledKey]);
                                    const state = sourceState.get(source.id);
                                    const days = state?.last ? daysSince(state.last) : null;
                                    const stale = enabled && (days === null || days >= 2);

                                    return (
                                        <RuleGroup.Row
                                            key={source.id}
                                            title={source.title}
                                            subtitle={source.subtitle}
                                            status={
                                                !enabled
                                                    ? undefined
                                                    : stale
                                                      ? { icon: Clock, tone: 'pending' }
                                                      : { icon: CheckCircle, tone: 'positive' }
                                            }
                                            value={
                                                !enabled
                                                    ? 'Désactivée'
                                                    : days === null
                                                      ? 'Rien reçu'
                                                      : days === 0
                                                        ? `${state?.count} machines aujourd'hui`
                                                        : `Rien depuis ${days} j`
                                            }
                                            valueTone={
                                                !enabled ? 'muted' : stale ? 'pending' : 'positive'
                                            }
                                            onOpen={() => openSourceSheet(source.id)}
                                        />
                                    );
                                })}
                            </RuleGroup>

                            <RuleGroup
                                header="Alimenter à la main"
                                note="Une machine remontée n'entre pas au parc toute seule : elle attend une validation dans Tâches."
                            >
                                <RuleGroup.Row
                                    title="Importer des fichiers de remontée"
                                    subtitle="JSON, tableau, ou NDJSON"
                                    onOpen={() => setFeedSheetOpen(true)}
                                />
                                <RuleGroup.Row
                                    title="Validation manuelle obligatoire"
                                    subtitle="Sans elle, une machine reconnue entre au parc sans être vue"
                                    trailing={
                                        <Toggle
                                            checked={settings.autoCollectionRequireManualValidation}
                                            onChange={(value) =>
                                                apply({
                                                    autoCollectionRequireManualValidation: value,
                                                })
                                            }
                                        />
                                    }
                                />
                            </RuleGroup>
                        </>
                    )}
                </Reading>
            </div>

            {/* ── La feuille d'une source : la seule exception au geste ─────────────
                Une clé d'API et une URL **valent ensemble ou pas du tout** — à moitié
                saisies, elles cassent la collecte. C'est le seul pied de l'écran. */}
            <BottomSheet
                open={openSource !== null}
                onClose={() => setOpenSource(null)}
                title={SOURCES.find((source) => source.id === openSource)?.title}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-on-surface text-[14px] font-medium">
                            Source active
                        </span>
                        <Toggle
                            checked={Boolean(
                                sourceDraft[
                                    SOURCES.find((source) => source.id === openSource)
                                        ?.enabledKey ?? 'autoCollectionAgentEnabled'
                                ],
                            )}
                            onChange={(value) => {
                                const key = SOURCES.find(
                                    (source) => source.id === openSource,
                                )?.enabledKey;
                                if (key) setSourceDraft((draft) => ({ ...draft, [key]: value }));
                            }}
                        />
                    </div>

                    {openSource === 'agent' && (
                        <>
                            <InputField
                                label="Clé d'API"
                                value={sourceDraft.autoCollectionAgentApiKey}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAgentApiKey: event.target.value,
                                    }))
                                }
                                placeholder="NEEMBA_AGENT_KEY"
                            />
                            <InputField
                                mesure="courte"
                                label="Fréquence de remontée (minutes)"
                                type="number"
                                value={String(sourceDraft.autoCollectionHeartbeatMinutes)}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionHeartbeatMinutes: Number(event.target.value),
                                    }))
                                }
                            />
                            <p className="text-text-secondary text-[12px] leading-[17px]">
                                En dessous de 15 minutes, l'agent parle plus qu'il n'observe.
                            </p>
                            <InputField
                                label="URL de l'API"
                                value={sourceDraft.autoCollectionApiBaseUrl}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionApiBaseUrl: event.target.value,
                                    }))
                                }
                                placeholder="http://localhost:8787"
                            />
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-on-surface text-[14px]">
                                    Renvoyer les remontées à l'API
                                </span>
                                <Toggle
                                    checked={sourceDraft.autoCollectionForwardToApi}
                                    onChange={(value) =>
                                        setSourceDraft((draft) => ({
                                            ...draft,
                                            autoCollectionForwardToApi: value,
                                        }))
                                    }
                                />
                            </div>
                            <Button
                                variant="text"
                                size="sm"
                                onClick={testApiConnection}
                                className="self-start"
                            >
                                Tester la connexion
                            </Button>
                        </>
                    )}

                    {openSource === 'active_directory' && (
                        <>
                            <InputField
                                label="Contrôleur de domaine"
                                value={sourceDraft.autoCollectionAdHost}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAdHost: event.target.value,
                                    }))
                                }
                                placeholder="dc01.tracker.local"
                            />
                            <InputField
                                label="Base DN"
                                value={sourceDraft.autoCollectionAdBaseDn}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAdBaseDn: event.target.value,
                                    }))
                                }
                                placeholder="OU=Computers,DC=tracker,DC=local"
                            />
                            <InputField
                                label="Compte de service"
                                value={sourceDraft.autoCollectionAdServiceAccount}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAdServiceAccount: event.target.value,
                                    }))
                                }
                                placeholder="svc-neemba-ldap"
                            />
                        </>
                    )}

                    {openSource === 'network_scan' && (
                        <InputField
                            label="Plages IP (séparées par une virgule)"
                            value={sourceDraft.autoCollectionNetworkRanges}
                            onChange={(event) =>
                                setSourceDraft((draft) => ({
                                    ...draft,
                                    autoCollectionNetworkRanges: event.target.value,
                                }))
                            }
                            placeholder="10.10.0.0/24, 10.20.0.0/24"
                        />
                    )}

                    <Notice>
                        Une machine remontée{' '}
                        <strong className="text-on-surface font-medium">
                            n'entre pas au parc toute seule
                        </strong>{' '}
                        : elle attend une validation dans Tâches.
                    </Notice>

                    {sourceError && (
                        <p className="text-error flex gap-2 text-[12px] leading-[17px]">
                            <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                            <span>{sourceError}</span>
                        </p>
                    )}

                    <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                        <Button variant="text" onClick={() => setOpenSource(null)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={saveSource} className="flex-1">
                            Enregistrer la source
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Le mot de passe — l'ancien bouton « Mettre à jour » n'avait pas de `onClick`. */}
            <PasswordSheet
                open={passwordSheetOpen}
                onClose={() => setPasswordSheetOpen(false)}
                userId={currentUser?.id}
            />

            <PinSheet
                open={pinSheetOpen}
                onClose={() => setPinSheetOpen(false)}
                dejaDefini={Boolean(currentUser?.pin)}
                onSubmit={(pin) => setUserPin(currentUser?.id ?? '', pin)}
            />

            <BottomSheet
                open={feedSheetOpen}
                onClose={() => setFeedSheetOpen(false)}
                title="Importer des remontées"
            >
                <FileDropzone
                    onFileSelect={(file) => importCheckInFiles([file])}
                    onFilesSelect={importCheckInFiles}
                    multiple
                    accept=".json,.ndjson,.txt"
                    label="Déposer les fichiers de remontée"
                    subLabel="JSON (objet, tableau ou checkins[]) et NDJSON"
                />
            </BottomSheet>
        </div>
    );
};

/**
 * **Poser son code de remise** — 07.1, carte « Prouver une remise ».
 *
 * Le code vaut signature (06.2) : il n'a pas de « confirmer », il a **une seule
 * saisie qui se relit**. La sixième frappe valide seule — `PinField` le fait — et
 * le refus ne vide pas le pavé : il dit ce qui ne va pas.
 *
 * Ce que la feuille **ne fait pas** : demander l'ancien code. `setUserPin` ne le
 * vérifie pas, et prétendre le contraire par un champ de plus donnerait à croire
 * qu'un code oublié protège quelque chose. La sous-ligne de la rangée dit à sa
 * place ce qui arrive à l'ancien : *« il cesse aussitôt de valoir »*.
 */
const PinSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    dejaDefini: boolean;
    onSubmit: (pin: string) => BusinessRuleDecision;
}> = ({ open, onClose, dejaDefini, onSubmit }) => {
    const { showToast } = useToast();
    const [pin, setPin] = useState('');
    const [refus, setRefus] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setPin('');
            setRefus(null);
        }
    }, [open]);

    const poser = (code: string) => {
        if (!isValidPinFormat(code)) {
            setRefus('Ni une suite, ni six fois le même chiffre.');
            return;
        }
        const decision = onSubmit(code);
        if (!decision.allowed) {
            setRefus(decision.reason ?? "Le code n'a pas pu être posé.");
            return;
        }
        showToast(dejaDefini ? 'Code PIN remplacé.' : 'Code PIN défini.', 'success');
        onClose();
    };

    return (
        <BottomSheet
            open={open}
            onClose={onClose}
            title={dejaDefini ? 'Remplacer mon code PIN' : 'Définir mon code PIN'}
        >
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-[14px] leading-5">
                    Six chiffres. Il vaut signature à chaque remise — personne ne peut le lire, pas
                    même l'informatique.
                </p>
                <PinField
                    value={pin}
                    onChange={(suivant) => {
                        setPin(suivant);
                        if (refus && suivant.length < PIN_LENGTH) setRefus(null);
                    }}
                    onComplete={poser}
                    state={refus ? 'error' : 'idle'}
                    autoFocus
                    label={dejaDefini ? 'Nouveau code PIN' : 'Code PIN'}
                />
                {refus ? (
                    <p className="text-error text-[14px] leading-5">{refus}</p>
                ) : (
                    <p className="text-text-muted text-[12px] leading-4">
                        {dejaDefini
                            ? "L'ancien code cesse de valoir dès celui-ci posé."
                            : 'Sans code, la remise se prouve par un tracé.'}
                    </p>
                )}
            </div>
        </BottomSheet>
    );
};

/** Changer son propre mot de passe — trois champs, un pied, et rien d'autre. */
const PasswordSheet: React.FC<{ open: boolean; onClose: () => void; userId?: string }> = ({
    open,
    onClose,
    userId,
}) => {
    const { showToast } = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!open) {
            setCurrent('');
            setNext('');
            setConfirm('');
            setError(null);
        }
    }, [open]);

    const submit = async () => {
        if (!userId) return;
        if (next.length < 8) {
            setError('Le nouveau mot de passe fait au moins 8 caractères.');
            return;
        }
        if (next !== confirm) {
            setError('Les deux saisies ne sont pas identiques.');
            return;
        }

        setPending(true);
        try {
            await authService.changePassword(userId, current, next);
            showToast('Mot de passe modifié.', 'success');
            onClose();
        } catch {
            setError("Le mot de passe actuel n'a pas été reconnu. Rien n'a été modifié.");
        } finally {
            setPending(false);
        }
    };

    return (
        <BottomSheet open={open} onClose={onClose} title="Mot de passe">
            <div className="flex flex-col gap-3">
                <InputField
                    label="Mot de passe actuel"
                    type="password"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                />
                <InputField
                    label="Nouveau mot de passe"
                    type="password"
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                />
                <InputField
                    label="Confirmer"
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                />

                {error && (
                    <p className="text-error flex gap-2 text-[12px] leading-[17px]">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        <span>{error}</span>
                    </p>
                )}

                <div className="border-outline-variant mt-3 flex items-center gap-3 border-t pt-3.5">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={submit} disabled={pending} className="flex-1">
                        Changer le mot de passe
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default SettingsPage;
