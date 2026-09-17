import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Camera,
    CheckCircle,
    Clock,
    HandPointing,
    ImageSquare,
    Key,
    LockKey,
    ShieldWarning,
    Signature,
    SignOut,
    Trash,
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
import PinConfirmation, { PinSteps, usePinConfirmation } from '../../../components/ui/PinConfirmation';
import PinField from '../../../components/ui/PinField';
import { PIN_MAX_ATTEMPTS } from '../../../lib/security';
import Slider from '../../../components/ui/Slider';
import FilePicker from '../../../components/ui/FilePicker';
import { formatFileSize, getImportLimitBytes } from '../../../lib/fileImport';
import { signatureService } from '../../../services/signatureService';
import { cn } from '../../../lib/utils';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import type { RuleRowTone } from '../../../components/ui/RuleGroup';
import Notice from '../../../components/ui/Notice';
import Reading from '../../../components/layout/Reading';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { authService } from '../../../services/authService';
import PasswordMeter from '../../../components/ui/PasswordMeter';
import { measurePasswordStrength, PASSWORD_MIN_LENGTH } from '../../../lib/passwordStrength';
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
    | 'index'
    | 'account'
    | 'currency'
    | 'depreciation'
    | 'inventory'
    | 'files'
    | 'sources'
    /** Le recadrage d'une signature importée — 07.1, lot 28 D2. */
    | 'signature';

const VIEW_TITLE: Record<SettingsView, string> = {
    signature: 'Recadrer',
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
 * **« Mon compte » prend la barre de liste, et c'est un arbitrage du commanditaire**
 * (10/09). 07.1 le dessine en `.tbar`, comme tout ce qu'une rangée ouvre ; mais c'est
 * le seul de ces écrans à avoir **son adresse propre** (`/settings/account`), à
 * s'atteindre par deux chemins — Paramètres et l'avatar de 03.1 — et à porter un héro.
 * Vu de l'usage c'est une destination, pas la valeur d'un réglage, et le commanditaire
 * l'a relevé : « Mon compte a son header plus petit que les autres. » Les cinq écrans
 * de réglage — Devise, Amortissement, Périodicité, Fichiers, Sources — gardent la
 * barre de fiche : eux n'existent qu'au bout d'une rangée.
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
    const isCompact = useMediaQuery(MEDIA.compact);
    const retour = onBack && (
        <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="shrink-0">
            <Icon glyph={ArrowLeft} size={24} />
        </Button>
    );

    /* Au-delà de 600, les deux barres prennent **l'en-tête du bureau** (17.11) : sur le
       canevas, sans filet, le retour en carré de 40 et le titre en 28 sur 32 — la forme
       des fiches du gabarit. Le bloc blanc du téléphone y faisait une seconde surface. */
    if (!isCompact) {
        return (
            <IconGestureSizeContext.Provider value={40}>
                <div className="px-page flex min-h-10 items-center gap-2 pt-5">
                    {onBack && (
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour"
                            onClick={onBack}
                            className="text-on-surface-variant hover:text-on-surface -ml-2.5 shrink-0"
                        >
                            <Icon glyph={ArrowLeft} size={20} />
                        </Button>
                    )}
                    <h1 className="font-brand text-on-surface min-w-0 flex-1 truncate text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                        {title}
                    </h1>
                </div>
            </IconGestureSizeContext.Provider>
        );
    }

    if (variant === 'fiche') {
        /* `.tbar` — l'intérieur `0 8 0 4` place déjà la flèche à 4 du bord. */
        return (
            <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-1 border-b pr-2 pl-1">
                {retour}
                <h1 className="font-brand text-on-surface min-w-0 flex-1 truncate px-1 text-[17px] leading-6 font-semibold tracking-[-0.01em]">
                    {title}
                </h1>
            </div>
        );
    }

    /* `.top .tt` — la rangée du titre rentre sa flèche de 12, et le titre tombe à 56 : huit
       planches de page l'écrivent ainsi (04.1, 05.1, 09.1, 10.1, 11.1, 14.1, 16.1, 18.1). Le
       retrait de 8 ne venait que de 17.9, et posait le titre à 60 sur toutes les pages du
       menu (relevé du 13/09). */
    return (
        <div className="border-outline-variant bg-surface flex flex-col gap-3 border-b px-4 pt-2 pb-3">
            <div className="flex min-h-12 items-center gap-1">
                {retour && <span className="-ml-3 flex shrink-0">{retour}</span>}
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
        updateUser,
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
     * **La signature enregistrée** — 07.1, lot 28. Trois états, et un seul fait les
     * distingue : y a-t-il une image dans le magasin.
     */
    const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
    const [signatureSavedAt, setSignatureSavedAt] = useState<string | null>(null);
    const [signatureSheetOpen, setSignatureSheetOpen] = useState(false);
    const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
    /** Le refus se lit **dans la rangée** qui l'a demandé, jamais en toast (17.10). */
    const [refusFichier, setRefusFichier] = useState<string | null>(null);
    /** L'image choisie, en attente de recadrage. */
    const [imageAImporter, setImageAImporter] = useState<File | null>(null);
    const champImage = React.useRef<HTMLInputElement>(null);
    const champPhoto = React.useRef<HTMLInputElement>(null);

    const relireLaSignature = React.useCallback(async () => {
        if (!currentUser?.id) return;
        const [image, pose] = await Promise.all([
            signatureService.get(currentUser.id),
            signatureService.getSavedAt(currentUser.id),
        ]);
        setSignatureBlob(image);
        setSignatureSavedAt(pose);
    }, [currentUser?.id]);

    useEffect(() => {
        void relireLaSignature();
    }, [relireLaSignature]);

    /**
     * Ce que la rangée accepte : une image, et **5 Mo au plus** (17.10). Le refus nomme
     * le poids ou le format lu — « 12 Mo, la limite est 5 Mo » —, parce qu'un refus qui
     * ne dit pas ce qui cloche fait recommencer à l'aveugle.
     */
    const choisirLImage = (fichier?: File | null) => {
        if (!fichier) return;
        if (!['image/png', 'image/jpeg'].includes(fichier.type)) {
            setRefusFichier('format non lu : PNG ou JPG');
            return;
        }
        if (fichier.size > getImportLimitBytes()) {
            setRefusFichier(
                `${formatFileSize(fichier.size)}, la limite est ${formatFileSize(getImportLimitBytes())}`,
            );
            return;
        }
        setRefusFichier(null);
        setSourceSheetOpen(false);
        setImageAImporter(fichier);
        setView('signature');
    };

    const enregistrerLaSignature = async (image: Blob) => {
        if (!currentUser?.id) return;
        try {
            const { id } = await signatureService.save(currentUser.id, image);
            updateUser(currentUser.id, { signatureId: id });
            await relireLaSignature();
            setImageAImporter(null);
            setView('account');
            showToast('Signature enregistrée. Votre code PIN suffira à l’apposer.', 'success');
        } catch {
            showToast("La signature n'a pas pu être enregistrée sur cet appareil.", 'error');
        }
    };

    const supprimerLaSignature = async () => {
        if (!currentUser?.id) return;
        await signatureService.remove(currentUser.id);
        updateUser(currentUser.id, { signatureId: undefined });
        await relireLaSignature();
        setSignatureSheetOpen(false);
        showToast('Signature supprimée. Le tracé revient à chaque remise.', 'success');
    };

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
     *
     * **Il se lit aux deux endroits** (16/09) : en pied de l'écran du réglage, là où l'on
     * s'apprête à changer la valeur, et en sous-ligne de la rangée, comme 14.1 la dessine.
     * Le 10/09 l'avait retiré de la rangée parce qu'il y disputait sa place au titre : la
     * sous-ligne y était rendue en 14 sur 20 au lieu des 12 sur 16 de la planche.
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

    /**
     * 14.1 écrit « Vaut pour les 9 imports ». Le produit en porte **quatre** — équipements,
     * modèles, emplacements, personnes : c'est ce nombre-là qui est vrai ici, et il se compte
     * à la main faute d'un registre des écrans d'import.
     */
    const importSurfaces = 4;

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
        /* **La valeur ne redit pas le titre.** « Code PIN défini » prenait 137 px à
           droite de « Mon compte » : avec la vignette, le titre n'avait plus la place et
           se coupait à « Mon… ». La rangée dit déjà de quel réglage il s'agit, et le
           pictogramme dit déjà que c'est une alerte. */
        ? { tone: 'positive', icon: CheckCircle, label: 'Défini' }
        : { tone: 'pending', icon: ShieldWarning, label: 'À définir' };

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
                variant={view === 'index' || view === 'account' ? 'liste' : 'fiche'}
                onBack={view === 'index' ? onBack : goBack}
            />

            {/* `.page` de 14.1 — `16px 16px 24px`. La gouttière valait 20 : quatre pixels
                pris de chaque côté à des rangées qui n'en avaient pas de trop. */}
            <div className="medium:px-page flex-1 overflow-y-auto px-4 pt-4 pb-6">
                {/* `.page` de 07.1 : 16 d'écart entre le héro et les cartes (10/09 ; il valait 20). */}
                <Reading className="flex flex-col gap-4 pb-16">
                    {view === 'index' && (
                        <>
                            {/* **La liste ne porte plus de note.** Chaque groupe en avait
                                une, longue, qui expliquait le classement plutôt que les
                                réglages : trois lignes de gris pour une carte d'une rangée.
                                Ce qu'elles disaient appartient à l'écran du réglage, où il
                                se lit au moment d'agir — c'est là que les notes restent. */}
                            {/* **Ni vignette.** Les rangées de 14.1 ouvrent sur leur titre, à
                                16 du bord de la carte : les glyphes le poussaient à 68 et
                                ajoutaient six pixels à chaque rangée (relevé du 13/09). */}
                            <RuleGroup form="grp" header="Vous">
                                <RuleGroup.Row
                                    title="Mon compte"
                                    /* **Pas de sous-ligne quand la valeur dit déjà l'état.**
                                       Elle en portait une, et la valeur « Code PIN à définir »
                                       ne lui laissait qu'une centaine de pixels : la phrase
                                       tombait sur trois lignes et la rangée passait de 60 à
                                       104. Ce que le sous-titre disait — que sans code la
                                       remise se trace — la valeur le dit en un mot. */
                                    status={{ icon: codePin.icon, tone: codePin.tone }}
                                    value={codePin.label}
                                    valueTone={codePin.tone}
                                    onOpen={() => setView('account')}
                                />
                            </RuleGroup>

                            <RuleGroup form="grp" header="L'entreprise">
                                <RuleGroup.Row
                                    title="Devise et année fiscale"
                                    /* 14.1 ne lui donne aucune sous-ligne : la valeur
                                       « XOF · 1ᵉʳ janv. » se suffit, et la phrase se coupait
                                       à « Tout montant du produit s'écrit avec ». */
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
                                    subtitle={`Décide de la valeur de ${governedAssets} actif${governedAssets > 1 ? 's' : ''}`}
                                    value={`${settings.defaultDepreciationYears} ans`}
                                    onOpen={() => setView('depreciation')}
                                />
                                {/* Les deux bornes ajoutées à la planche le 05/09. Elles
                                    existaient dans le code — l'une nulle part, l'autre en
                                    dur dans `lib/fileImport.ts` — mais ne se réglaient
                                    d'aucun écran. */}
                                <RuleGroup.Row
                                    title="Périodicité de l'inventaire"
                                    subtitle={`Donne son sens à « en retard » sur ${sitesInventories} site${sitesInventories > 1 ? 's' : ''}`}
                                    value={`${settings.inventoryPeriodMonths} mois`}
                                    onOpen={() => setView('inventory')}
                                />
                                <RuleGroup.Row
                                    title="Taille maximale d'un fichier"
                                    subtitle={`Vaut pour les ${importSurfaces} imports`}
                                    value={`${settings.maxImportFileMb} Mo`}
                                    onOpen={() => setView('files')}
                                />
                            </RuleGroup>

                            <RuleGroup form="grp" header="L'informatique">
                                <RuleGroup.Row
                                    title="Sources de collecte"
                                    /* Sans source muette, la valeur — « Aucune active »,
                                       « 2 actives sur 3 » — dit tout : la liste des trois
                                       sources ne tenait pas dans les 113 px que la valeur
                                       lui laisse, et repassait à la ligne. */
                                    subtitle={
                                        stalestSource
                                            ? `${stalestSource.title} muet depuis ${stalestSource.days} j`
                                            : undefined
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
                                {/* Le titre dit « à valider » et la flèche dit qu'on sort :
                                    « Elles attendent dans Tâches » ne faisait que nommer la
                                    destination une seconde fois. */}
                                {pendingDevices > 0 && (
                                    <RuleGroup.Row
                                        title={`${pendingDevices} machine${pendingDevices > 1 ? 's' : ''} détectée${pendingDevices > 1 ? 's' : ''} à valider`}
                                        external
                                        onOpen={() => onNavigate?.('tasks')}
                                    />
                                )}
                            </RuleGroup>

                            {/*
                              **L'application** — la carte que 07.1 dessine dans sa dernière
                              colonne. Elle répond à trois questions qu'on se pose sur le
                              produit lui-même, et non sur le parc : de quoi me préviendra-t-il,
                              dans quelle langue et sur quel périmètre je le lis, à qui
                              m'adresser.

                              **Deux de ses rangées ne s'ouvrent pas, et c'est exact.** Rien
                              n'est réglable derrière : les deux notifications sont celles que
                              le produit émet, la langue est le français et le site vient de la
                              fiche, où un gestionnaire le change (05.2). Leur poser un chevron
                              promettrait un écran qui n'existe pas — c'est précisément ce que
                              14.1 a fait tomber du Centre d'aide. Une rangée qui se lit sans
                              s'ouvrir est le cas ordinaire d'« À propos », pas une exception.
                            */}
                            <RuleGroup form="grp" header="L'application">
                                <RuleGroup.Row title="Notifications" value="Réceptions, relances" />
                                {/* **« Langue »**, et la langue seule. Le titre portait
                                    « Langue et site » pour une valeur « français · Lomé
                                    Siège » : deux faits dans une rangée, dont un — le site —
                                    que le héro de Mon compte affiche déjà sous le nom. */}
                                <RuleGroup.Row title="Langue" value="Français" />
                                {APP_CONFIG.supportEmail && (
                                    /* `Aide` — 07.1 la range ici, et elle ne promet pas de
                                       « documentation », le produit n'en ayant aucune à
                                       ouvrir. L'adresse ne s'écrit pas non plus dans la
                                       rangée : la flèche de sortie dit qu'on part écrire, et
                                       le client de messagerie la montrera de toute façon. */
                                    <RuleGroup.Row
                                        title="Aide"
                                        onOpen={() => {
                                            window.location.href = `mailto:${APP_CONFIG.supportEmail}`;
                                        }}
                                        external
                                    />
                                )}
                            </RuleGroup>

                            {/* La note disait que les objets de démonstration revenaient à
                                chaque chargement. Le jeu de démonstration a été retiré et le
                                parc est désormais celui du tableur : la phrase décrivait un
                                produit qui n'existe plus, et un écran de réglages est le
                                dernier endroit où l'on peut se permettre de mentir. */}
                            <RuleGroup form="grp" header="À propos">
                                <RuleGroup.Row title="Version" value={APP_CONFIG.version} />
                                {/* « Clair », pas « Clair — identité Neemba » : la seconde
                                    moitié justifiait le choix, et une rangée d'« À propos »
                                    se lit, elle ne se plaide pas. */}
                                <RuleGroup.Row title="Thème" value="Clair" />
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
                                {/* **La sous-ligne dit l'état, pas la règle** — 07.1 :
                                    *« chaque acte n'a qu'une entrée, l'état se lit en
                                    sous-ligne »*, et la planche y écrit « changé il y a
                                    4 mois ». Elle portait « il ouvre la session, il ne
                                    signe pas » : une règle, et la même que celle que la
                                    feuille pose maintenant sous ses champs — la rangée la
                                    disait donc deux fois et n'apprenait rien du compte.
                                    « jamais changé depuis l'ouverture du compte » se
                                    coupait d'ailleurs à « …du comp » : l'état tient en
                                    deux mots. */}
                                <ActionCard.Row
                                    glyph={LockKey}
                                    title="Changer mon mot de passe"
                                    subtitle={
                                        currentUser?.passwordChangedAt
                                            ? `changé le ${new Date(
                                                  currentUser.passwordChangedAt,
                                              ).toLocaleDateString('fr-FR', {
                                                  day: 'numeric',
                                                  month: 'long',
                                              })}`
                                            : 'jamais changé'
                                    }
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
                                    /* **Le même mot que dans Paramètres** — « défini » /
                                       « à définir » —, les deux écrans étant atteints par
                                       le même menu. Elle portait la conséquence (« sans
                                       lui, chaque remise se trace »), que la feuille du
                                       code énonce déjà au moment de le poser. */
                                    subtitle={currentUser?.pin ? 'défini' : 'à définir'}
                                    onOpen={() => setPinSheetOpen(true)}
                                />
                                {/* **Ma signature** — 07.1, lot 28. Trois états, un seul
                                    fait les sépare : y a-t-il une image enregistrée. Sans
                                    elle, la rangée ouvre le choix de la source ; avec
                                    elle, la feuille qui la montre, la remplace ou la
                                    supprime. Le refus d'un fichier se lit ici même. */}
                                <ActionCard.Row
                                    glyph={Signature}
                                    title="Ma signature"
                                    tone={refusFichier ? 'refus' : undefined}
                                    subtitle={
                                        refusFichier ??
                                        (signatureSavedAt
                                            ? `importée le ${new Date(signatureSavedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                                            : 'aucune')
                                    }
                                    onOpen={() => {
                                        setRefusFichier(null);
                                        if (signatureBlob) setSignatureSheetOpen(true);
                                        else setSourceSheetOpen(true);
                                    }}
                                />
                            </ActionCard>

                            <ActionCard title="Où je suis connecté">
                                {/* Aucun état à dire : « de cet appareil seulement »
                                    commentait l'acte, et la carte « Où je suis connecté »
                                    le situe déjà. */}
                                <ActionCard.Row
                                    glyph={SignOut}
                                    title="Se déconnecter"
                                    onOpen={onLogout}
                                />
                            </ActionCard>
                        </>
                    )}
                    {view === 'signature' && imageAImporter && (
                        <SignatureCrop
                            fichier={imageAImporter}
                            onAutreImage={() => {
                                setImageAImporter(null);
                                setView('account');
                                setSourceSheetOpen(true);
                            }}
                            onEnregistrer={enregistrerLaSignature}
                        />
                    )}

                    {view === 'currency' && (
                        <>
                            <RuleGroup
                                form="grp"
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

                            <RuleGroup form="grp" header="Début de l'année fiscale">
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
                                form="grp"
                                header="Par défaut"
                                note={
                                    <>
                                        Un plan se prend d'abord sur la fiche, puis sur le type, et
                                        seulement ensuite ici.
                                        {typesWithOwnPlan === categories.length &&
                                        categories.length > 0
                                            ? ` Les ${categories.length} types portent déjà le leur : ce plan ne sert donc qu'aux types créés sans lui.`
                                            : ` ${categories.length - typesWithOwnPlan} type(s) n'en portent pas : ce plan est le leur.`}{' '}
                                        {governedAssets > 0 && (
                                            <>
                                                {' '}
                                                Il décide aujourd'hui de la valeur de{' '}
                                                <strong className="text-text-secondary font-medium">
                                                    {governedAssets} actif
                                                    {governedAssets > 1 ? 's' : ''}
                                                </strong>
                                                .
                                            </>
                                        )}{' '}
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

                            <RuleGroup form="grp" header="Durée et fin de vie">
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
                                form="grp"
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
                                form="grp"
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
                                        {sitesInventories > 0 && (
                                            <>
                                                {' '}
                                                Il donne son sens à « en retard » sur{' '}
                                                <strong className="text-text-secondary font-medium">
                                                    {sitesInventories} site
                                                    {sitesInventories > 1 ? 's' : ''}
                                                </strong>
                                                .
                                            </>
                                        )}
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
                                form="grp"
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
                            <RuleGroup
                                form="grp"
                                note="L'état d'une source, c'est ce qu'elle a renvoyé et quand. Une source qui ne dit plus rien depuis six jours est le seul fait qui mérite d'être remonté au sommaire."
                            >
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
                                form="grp"
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
                userId={currentUser?.id ?? ''}
                dejaDefini={Boolean(currentUser?.pin)}
                codeActuel={currentUser?.pin}
                onSubmit={(pin, actuel) => setUserPin(currentUser?.id ?? '', pin, actuel)}
            />

            {/*
              **D'où vient l'image** — 17.6, feuille de choix **sans pied** : deux chemins,
              et le choix *est* la validation. Le second passe par la caméra (`capture`),
              parce qu'une signature se photographie plus souvent qu'elle ne se retrouve
              dans un dossier.
            */}
            <BottomSheet
                open={sourceSheetOpen}
                onClose={() => setSourceSheetOpen(false)}
                title="Ma signature"
            >
                <div className="flex flex-col pb-1">
                    {/* `.slead` — **la raison avant les chemins.** Sans elle, la feuille
                        demande un fichier sans dire ce qu'il deviendra ; c'est pourtant là
                        que se gagne l'envie d'en déposer un. */}
                    <p className="text-on-surface-variant mb-2 text-[14px] leading-5">
                        Une image de votre signature. Avec votre code PIN, elle s'apposera
                        d'elle-même.
                    </p>
                    {/* Les deux champs sont **cachés** : c'est la rangée qu'on voit, et
                        c'est elle qui les déclenche (`FilePicker`, primitive de 17.10). */}
                    <FilePicker
                        ref={champImage}
                        accept="image/png,image/jpeg"
                        onFiles={(_, fichiers) => choisirLImage(fichiers?.[0])}
                        onReject={(message) => setRefusFichier(message)}
                    />
                    <FilePicker
                        ref={champPhoto}
                        accept="image/png,image/jpeg"
                        onFiles={(_, fichiers) => choisirLImage(fichiers?.[0])}
                        onReject={(message) => setRefusFichier(message)}
                    />
                    <ActionCard.Row
                        glyph={ImageSquare}
                        title="Choisir une image"
                        subtitle={`PNG ou JPG, ${formatFileSize(getImportLimitBytes())} au plus`}
                        onOpen={() => champImage.current?.click()}
                    />
                    <ActionCard.Row
                        glyph={Camera}
                        title="Prendre en photo"
                        /* La formulation de 07.1 — la mienne se tronquait à 393. */
                        subtitle="sur une feuille blanche, bien éclairée"
                        onOpen={() => {
                            /* `capture` ne se déclare pas en prop de la primitive : on
                               le pose sur le champ au moment d'ouvrir, pour que le
                               téléphone offre la caméra plutôt que ses dossiers. */
                            champPhoto.current?.setAttribute('capture', 'environment');
                            champPhoto.current?.click();
                        }}
                    />
                </div>
            </BottomSheet>

            {/*
              **La signature enregistrée** — ce qu'elle change, et les deux gestes qui la
              défont. Le bloc de conséquences dit ce que le code PIN suffit à faire : sans
              lui, on croirait qu'il faut encore tracer.
            */}
            <BottomSheet
                open={signatureSheetOpen}
                onClose={() => setSignatureSheetOpen(false)}
                title="Ma signature"
            >
                <div className="flex flex-col gap-4 pb-1">
                    <p className="text-on-surface-variant text-[14px] leading-5">
                        Avec votre code PIN, elle s'appose d'elle-même à chaque remise.
                    </p>

                    {signatureBlob && (
                        <SignatureApercu
                            image={signatureBlob}
                            nom={currentUser?.name ?? ''}
                            depuis={signatureSavedAt}
                        />
                    )}

                    {/* `.conseq` — **le bloc répond à la question qu'on se pose ici**, et
                        cette question est « puis-je la supprimer sans me bloquer ». Le
                        libellé disait « Ce que cela change » : ce que *quoi* change ?
                        L'image existe déjà ; c'est la suppression qui change quelque
                        chose, et 07.1 l'écrit — « Si vous la supprimez ». */}
                    <div className="bg-surface-container flex flex-col gap-2.5 rounded-[4px] px-4 py-3">
                        <p className="text-on-surface-variant text-[12px] leading-4 font-medium">
                            Si vous la supprimez
                        </p>
                        <p className="text-on-surface flex items-center gap-3 text-[14px] leading-5">
                            <span className="bg-tint-bleu text-on-tint-bleu flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={Key} size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                                Le code PIN <b className="font-medium">suffit</b> à attester.
                            </span>
                        </p>
                        <p className="text-on-surface flex items-center gap-3 text-[14px] leading-5">
                            <span className="bg-tint-vert text-on-tint-vert flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={Signature} size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                                Un <b className="font-medium">tracé</b> reste possible à chaque
                                remise.
                            </span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="tonal"
                            icon={<Icon glyph={Trash} size={20} />}
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={() => void supprimerLaSignature()}
                        >
                            Supprimer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => {
                                setSignatureSheetOpen(false);
                                setSourceSheetOpen(true);
                            }}
                        >
                            Remplacer
                        </Button>
                    </div>
                </div>
            </BottomSheet>

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
 * **La signature enregistrée** — 07.1 : une case de **160**, la date en haut à droite,
 * le tracé au milieu, le nom au bas. On la relit ici avant de décider de la remplacer.
 *
 * Elle a valu 120, la hauteur de la case d'attestation (06.1), pour qu'on la relise
 * « dans la forme qu'elle aura sur la preuve ». La raison ne tenait pas à l'usage : à
 * 120, **la date et le tracé se chevauchent** — une signature claire sur fond blanc passe
 * par-dessus le coin où la date se pose, et la date devient illisible. 07.1 donne 160
 * précisément parce qu'ici on juge l'image, alors que sur la preuve on la constate.
 */
const SignatureApercu: React.FC<{ image: Blob; nom: string; depuis?: string | null }> = ({
    image,
    nom,
    depuis,
}) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objet = URL.createObjectURL(image);
        setUrl(objet);
        return () => URL.revokeObjectURL(objet);
    }, [image]);

    if (!url) return null;

    return (
        <div className="bg-surface-container relative h-[160px] overflow-hidden rounded-md">
            {/* `.tag` — **quand elle a été posée**, en haut à droite : c'est le seul fait
                que l'image ne porte pas d'elle-même, et celui qui dit si elle est encore
                la bonne. */}
            {depuis && (
                <span className="text-text-tertiary absolute top-3 right-3 text-[12px] leading-4">
                    importée le{' '}
                    {new Date(depuis).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                    })}
                </span>
            )}
            <img
                src={url}
                alt={`Signature de ${nom}`}
                className="absolute inset-x-0 top-9 mx-auto h-[70px] w-auto max-w-[70%] object-contain"
            />
            <span className="text-on-surface-variant absolute inset-x-0 bottom-2.5 text-center text-[14px] leading-5">
                {nom}
            </span>
        </div>
    );
};

/**
 * **Recadrer** — 07.1, lot 28 D2. *« Un `<canvas>` (zone 320 de haut, fond `--inset-2`),
 * l'image glissée au pointeur, pincer ou curseur pour le zoom, cadre fixe à quatre
 * poignées. »*
 *
 * **Aucune librairie.** `SignaturePad` avait déjà prouvé que le Canvas natif suffit à
 * dessiner ; il suffit aussi à recadrer — une image, une échelle, deux décalages. Ce
 * qu'on voit dans le cadre *est* ce qui sera enregistré : le PNG sort du canvas
 * lui-même, à sa définition, et pas d'un calcul parallèle qui pourrait en diverger.
 *
 * Le cadre a le **rapport de la case d'attestation** (3:1) : recadrer dans une forme et
 * apposer dans une autre ferait mentir l'aperçu.
 *
 * Ni rotation ni seuil de contraste : ils étaient **suggérés, non confirmés** (le prompt
 * des lots 28-32, §2), et une commande qu'on ajoute « au cas où » ne s'enlève plus.
 */
const SignatureCrop: React.FC<{
    fichier: File;
    onAutreImage: () => void;
    onEnregistrer: (image: Blob) => void;
}> = ({ fichier, onAutreImage, onEnregistrer }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [decalage, setDecalage] = useState({ x: 0, y: 0 });
    const glisse = React.useRef<{ x: number; y: number } | null>(null);

    /* La définition du PNG produit — 3:1, la forme de la case d'attestation. */
    const LARGEUR = 900;
    const HAUTEUR = 300;

    useEffect(() => {
        const url = URL.createObjectURL(fichier);
        const element = new Image();
        element.onload = () => setImage(element);
        element.src = url;
        return () => URL.revokeObjectURL(url);
    }, [fichier]);

    /* À l'ouverture, l'image **couvre** le cadre : on recadre ce qui déborde, on ne
       cherche pas d'abord à faire tenir un timbre au milieu d'un vide. */
    const echelleDeBase = useMemo(() => {
        if (!image) return 1;
        return Math.max(LARGEUR / image.width, HAUTEUR / image.height);
    }, [image]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const contexte = canvas?.getContext('2d');
        if (!canvas || !contexte || !image) return;
        contexte.clearRect(0, 0, LARGEUR, HAUTEUR);
        const echelle = echelleDeBase * zoom;
        const largeur = image.width * echelle;
        const hauteur = image.height * echelle;
        contexte.drawImage(
            image,
            (LARGEUR - largeur) / 2 + decalage.x,
            (HAUTEUR - hauteur) / 2 + decalage.y,
            largeur,
            hauteur,
        );
    }, [image, zoom, decalage, echelleDeBase]);

    const pointeur = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const boite = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - boite.left) / boite.width) * LARGEUR,
            y: ((event.clientY - boite.top) / boite.height) * HAUTEUR,
        };
    };

    return (
        <div className="flex flex-col gap-4">
            {/* La zone de 320 porte le cadre **au format de la case d'attestation** : les
                poignées épousent le canevas, pas la boîte — sinon elles promettent un
                recadrage que l'enregistrement ne fait pas. Rayon 8 : c'est une surface de
                la page, pas un champ. */}
            <div className="bg-surface-muted-strong rounded-card flex h-[320px] items-center justify-center overflow-hidden">
                <div className="relative aspect-[3/1] w-full">
                    <canvas
                        ref={canvasRef}
                        width={LARGEUR}
                        height={HAUTEUR}
                        onPointerDown={(event) => {
                            glisse.current = pointeur(event);
                            event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                        onPointerMove={(event) => {
                            if (!glisse.current) return;
                            const point = pointeur(event);
                            const depart = glisse.current;
                            glisse.current = point;
                            setDecalage((precedent) => ({
                                x: precedent.x + (point.x - depart.x),
                                y: precedent.y + (point.y - depart.y),
                            }));
                        }}
                        onPointerUp={() => {
                            glisse.current = null;
                        }}
                        onPointerCancel={() => {
                            glisse.current = null;
                        }}
                        className="absolute inset-0 h-full w-full cursor-grab touch-none"
                    />
                    {/* Les quatre poignées du cadre — elles disent où l'image sera coupée ;
                    elles ne se saisissent pas : c'est l'image qui bouge, pas le cadre. */}
                    {[
                        'top-0 left-0 border-t-2 border-l-2',
                        'top-0 right-0 border-t-2 border-r-2',
                        'bottom-0 left-0 border-b-2 border-l-2',
                        'bottom-0 right-0 border-b-2 border-r-2',
                    ].map((coin) => (
                        <span
                            key={coin}
                            aria-hidden="true"
                            className={cn(
                                'border-on-surface pointer-events-none absolute h-6 w-6',
                                coin,
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* `.zoom` — **le moins et le plus encadrent la piste** (07.1). Le curseur
                seul demande un geste fin pour un réglage grossier ; les deux glyphes
                donnent le cran, et disent au passage dans quel sens la piste travaille. */}
            <Slider
                label="Taille de la signature"
                min={0.5}
                max={4}
                step={0.05}
                stepperStep={0.25}
                steppers
                value={zoom}
                onChange={setZoom}
                valueText={`${zoom.toFixed(1).replace('.', ',')}×`}
            />

            {/* `.alt` — **sous le réglage, pas avant le cadre.** Elle ne dit plus quoi
                faire (le cadre le montre) mais ce que le geste garantit : ce qu'on voit
                est ce qui sera enregistré. C'est la phrase qui dispense de vérifier. */}
            <p className="text-on-surface-variant flex items-start gap-2 text-[14px] leading-5">
                <Icon
                    glyph={HandPointing}
                    size={18}
                    className="text-text-tertiary mt-px shrink-0"
                />
                <span>
                    Glissez l'image, pincez pour zoomer.{' '}
                    <b className="text-on-surface font-medium">
                        Le cadre garde ce qu'il contient.
                    </b>
                </span>
            </p>

            {/* `.pfoot` — deux gestes, le second enregistre, détachés par un filet.
                07.1 les **colle au bas de l'écran** sur sa coque pleine page ; le
                recadrage vit ici dans le flux des réglages, et une barre de surface
                pleine largeur y flotterait au milieu du vide dès que la page est courte.
                Le filet fait le même travail sans mentir sur la structure. */}
            <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                <Button
                    variant="tonal"
                    className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                    onClick={onAutreImage}
                >
                    Autre image
                </Button>
                <Button
                    variant="filled"
                    className="justify-center"
                    onClick={() =>
                        canvasRef.current?.toBlob((image) => {
                            if (image) onEnregistrer(image);
                        }, 'image/png')
                    }
                >
                    Enregistrer
                </Button>
            </div>
        </div>
    );
};

/** Le compte des essais sur le code actuel, gardé pour la session de l'onglet. */
const cleEssaisPin = (userId: string) => `tracker.pin.essais.${userId}`;
const lireEssaisPin = (userId: string): number => {
    try {
        return Number(sessionStorage.getItem(cleEssaisPin(userId))) || 0;
    } catch {
        return 0;
    }
};
const ecrireEssaisPin = (userId: string, essais: number) => {
    try {
        if (essais > 0) sessionStorage.setItem(cleEssaisPin(userId), String(essais));
        else sessionStorage.removeItem(cleEssaisPin(userId));
    } catch {
        /* Stockage refusé (navigation privée) : le compte vaut alors pour la feuille. */
    }
};

/**
 * **Poser son code de remise** — 07.1, carte « Prouver une remise ».
 *
 * **Deux saisies, comme un mot de passe** (11/09, demandé par le commanditaire) : une
 * faute de frappe devenait le code et ne se découvrait qu'à la première remise. Le
 * formulaire est `PinConfirmation`, partagé avec la première connexion (02.2).
 *
 * **Remplacer exige le code actuel** (11/09, même demande) — comme changer son mot de
 * passe exige l'ancien. Il vient **en premier temps**, seul, avant le nouveau et sa
 * confirmation : trois tirets au lieu de deux. La vérification n'est pas décorative :
 * `setUserPin` refuse un remplacement sans le bon code actuel, et la feuille ne fait que
 * le demander au bon moment.
 *
 * **Trois essais**, la borne de l'attestation (`PIN_MAX_ATTEMPTS`) : sans elle, la feuille
 * serait un pavé où deviner le code de quelqu'un dont le téléphone est resté ouvert. Le
 * compte **survit à la fermeture de la feuille** — la rouvrir ne rend pas d'essais — et
 * vaut pour la session de l'onglet. Au bout, la feuille ne demande plus rien : elle dit
 * que l'informatique peut réinitialiser le code depuis la fiche de la personne (05.2), et
 * le premier code se pose alors sans ancien.
 */
const PinSheet: React.FC<{
    open: boolean;
    onClose: () => void;
    userId: string;
    dejaDefini: boolean;
    /** Le code en place, pour le premier temps — comme `Attestation` lit `signerPin`. */
    codeActuel?: string;
    onSubmit: (pin: string, codeActuel?: string) => BusinessRuleDecision;
}> = ({ open, onClose, userId, dejaDefini, codeActuel, onSubmit }) => {
    const { showToast } = useToast();

    const [phase, setPhase] = useState<'actuel' | 'nouveau'>(dejaDefini ? 'actuel' : 'nouveau');
    const [actuel, setActuel] = useState('');
    const [refusActuel, setRefusActuel] = useState<string | null>(null);
    const [essais, setEssais] = useState(() => lireEssaisPin(userId));

    const saisie = usePinConfirmation({
        validate: (code) =>
            dejaDefini && code === actuel ? "Le nouveau code est identique à l'actuel." : null,
    });
    const { restart } = saisie;

    const bloque = dejaDefini && essais >= PIN_MAX_ATTEMPTS;

    /* À chaque ouverture, la feuille repart du premier temps et relit le compte des
       essais ; refermée, elle oublie ce qui a été tapé — pas les essais. */
    useEffect(() => {
        if (open) {
            setEssais(lireEssaisPin(userId));
            return;
        }
        setPhase(dejaDefini ? 'actuel' : 'nouveau');
        setActuel('');
        setRefusActuel(null);
        restart();
    }, [open, dejaDefini, userId, restart]);

    const verifierActuel = (code: string) => {
        if (code === codeActuel) {
            ecrireEssaisPin(userId, 0);
            setEssais(0);
            setRefusActuel(null);
            setPhase('nouveau');
            return;
        }
        const suivant = essais + 1;
        ecrireEssaisPin(userId, suivant);
        setEssais(suivant);
        setActuel('');
        const restants = PIN_MAX_ATTEMPTS - suivant;
        setRefusActuel(
            restants > 1
                ? `Code incorrect. Encore ${restants} essais.`
                : restants === 1
                  ? 'Code incorrect. Dernier essai.'
                  : null,
        );
    };

    const enregistrer = () => {
        if (!saisie.matched) return;
        const decision = onSubmit(saisie.pin, dejaDefini ? actuel : undefined);
        if (!decision.allowed) {
            saisie.refuse(decision.reason ?? "Le code n'a pas pu être posé.");
            return;
        }
        showToast(dejaDefini ? 'Code PIN remplacé.' : 'Code PIN défini.', 'success');
        onClose();
    };

    /* Le titre, la phrase et le pied ne changent pas d'un temps à l'autre : seul le
       champ avance. Une feuille qui changerait de forme à chaque temps obligerait à la
       relire. */
    const phrase = bloque
        ? 'Trois essais sans le bon code actuel.'
        : phase === 'actuel'
          ? 'Entrez votre code actuel.'
          : dejaDefini
            ? "Six chiffres. L'ancien cesse de valoir dès que le nouveau est posé."
            : "Six chiffres. Il vaut signature à chaque remise — personne ne peut le lire, pas même l'informatique.";

    return (
        <BottomSheet
            open={open}
            onClose={onClose}
            title={dejaDefini ? 'Remplacer mon code PIN' : 'Définir mon code PIN'}
        >
            {/*
              **Un seul axe : le centre** — `.pinpage` de 06.2, repris par 02.2 (écran 3).
              Le titre de la feuille reste à gauche, comme dans toutes les feuilles.
            */}
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant mx-auto max-w-[300px] text-center text-[14px] leading-5 text-balance">
                    {phrase}
                </p>

                {bloque ? (
                    <p className="text-on-surface mx-auto max-w-[300px] text-center text-[14px] leading-5 text-balance">
                        Votre informatique peut réinitialiser votre code depuis votre fiche.
                        Vous en poserez alors un nouveau.
                    </p>
                ) : phase === 'actuel' ? (
                    <div className="flex flex-col items-center">
                        <PinField
                            /* Un essai manqué rend six cases vides : on retape le code
                               entier, on ne corrige pas un chiffre qu'on ne voit pas. */
                            key={`actuel-${essais}`}
                            value={actuel}
                            onChange={(valeur) => {
                                if (refusActuel) setRefusActuel(null);
                                setActuel(valeur);
                            }}
                            onComplete={verifierActuel}
                            state={refusActuel ? 'error' : 'idle'}
                            autoFocus
                            label="Code PIN actuel"
                        />
                        <PinSteps className="mt-4" total={3} current={0} />
                        <p
                            className={cn(
                                'mt-2 max-w-[300px] text-center text-[14px] leading-5',
                                refusActuel ? 'text-error' : 'text-on-surface-variant',
                            )}
                            role={refusActuel ? 'alert' : undefined}
                            aria-live="polite"
                        >
                            {refusActuel ?? 'Ensuite, le nouveau code, deux fois.'}
                        </p>
                    </div>
                ) : (
                    <PinConfirmation
                        model={saisie}
                        autoFocus
                        stepsBefore={dejaDefini ? 1 : 0}
                        labels={{
                            entry: dejaDefini ? 'Nouveau code PIN' : 'Code PIN',
                            confirm: 'Confirmer le code PIN',
                        }}
                    />
                )}

                {/* `.sfoot` — le pied de la feuille du mot de passe, à l'identique. Bloquée,
                    la feuille n'a plus qu'un geste. */}
                <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                    {bloque ? (
                        /* `.btn-ghost` — le creux, pas l'encre pleine : fermer n'est pas
                           l'acte principal d'une feuille, c'est en sortir. */
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high col-span-2 justify-center"
                            onClick={onClose}
                        >
                            Fermer
                        </Button>
                    ) : (
                        <>
                            <Button variant="text" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button
                                variant="filled"
                                onClick={enregistrer}
                                disabled={!saisie.matched}
                            >
                                Enregistrer
                            </Button>
                        </>
                    )}
                </div>
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
    /* La date part au compte comme `signatureId` le fait : c'est elle que la rangée de
       07.1 relit ensuite. */
    const { updateUser } = useData();
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

    /* La jauge de 07.1, la même qu'en 02.2 : elle décrit la robustesse, le refus vient
       de la longueur. Le mot de passe se compare au nom et à l'adresse — un mot de passe
       qui les contient perd un segment. */
    const forceNouveau = measurePasswordStrength(next);
    const forceConfirme = measurePasswordStrength(confirm);

    const submit = async () => {
        if (!userId) return;
        if (next.length < PASSWORD_MIN_LENGTH) {
            setError(`Le nouveau mot de passe fait au moins ${PASSWORD_MIN_LENGTH} caractères.`);
            return;
        }
        if (next !== confirm) {
            setError('Les deux saisies ne sont pas identiques.');
            return;
        }

        setPending(true);
        try {
            await authService.changePassword(userId, current, next);
            updateUser(userId, { passwordChangedAt: new Date().toISOString() });
            showToast('Mot de passe modifié.', 'success');
            onClose();
        } catch {
            setError("Le mot de passe actuel n'a pas été reconnu. Rien n'a été modifié.");
        } finally {
            setPending(false);
        }
    };

    return (
        /* **La feuille de 07.1, colonne 2** — remesurée le 10/09 : elle portait le titre
           « Mot de passe », trois champs nus et un pied à deux boutons de largeurs
           inégales. La planche en demande huit choses, et chacune fait un travail :
           l'ancien mot de passe (*« c'est ce qui distingue cet acte de celui de
           l'administrateur »*), la phrase qui rassure avant le geste, la jauge sous
           chacune des deux saisies, la règle de longueur en toutes lettres, et la note
           qui sépare les deux secrets — la confusion que 02.2 passe un écran entier à
           éviter se rejouerait ici sans elle. */
        <BottomSheet open={open} onClose={onClose} title="Changer mon mot de passe">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-[14px] leading-5">
                    Vous resterez connecté sur cet appareil.
                </p>

                <InputField
                    label="Mot de passe actuel"
                    type="password"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                />

                <div>
                    <InputField
                        label="Nouveau mot de passe"
                        type="password"
                        value={next}
                        onChange={(event) => setNext(event.target.value)}
                    />
                    <PasswordMeter filled={forceNouveau.score} />
                    {/* `.hint` — la règle se lit **avant** la faute, pas après : c'est la
                        seule ligne de l'écran qui évite un aller-retour. */}
                    <p className="text-on-surface-variant mt-2 text-[14px] leading-5">
                        {PASSWORD_MIN_LENGTH} caractères minimum ; une phrase vaut mieux qu'un
                        mot compliqué.
                    </p>
                </div>

                <div>
                    <InputField
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                    />
                    <PasswordMeter filled={forceConfirme.score} />
                </div>

                {error && (
                    <p className="text-error flex gap-2 text-[14px] leading-5">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        <span>{error}</span>
                    </p>
                )}

                {/* `.alt` — **les deux secrets ne se confondent pas.** Une personne qui
                    vient de changer « son code » doit repartir en sachant lequel. */}
                <p className="text-on-surface-variant flex items-start gap-2 text-[14px] leading-5">
                    <Icon glyph={Key} size={18} className="text-text-tertiary mt-px shrink-0" />
                    <span>
                        Votre <b className="text-on-surface font-medium">code PIN</b> ne change
                        pas : il signe, il n'ouvre pas.
                    </span>
                </p>

                {/* `.sfoot` — deux boutons de **même largeur**, le filet au-dessus. */}
                <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={submit} disabled={pending}>
                        Enregistrer
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default SettingsPage;
