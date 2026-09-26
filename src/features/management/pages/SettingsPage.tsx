import React, { useEffect, useMemo, useState } from 'react';
import BarreDePage from '../../../components/layout/BarreDePage';
import {
    ArrowLeft,
    Camera,
    CheckCircle,
    Clock,
    HandPointing,
    ImageSquare,
    Info,
    Key,
    LockKey,
    MagicWand,
    ShieldWarning,
    Signature,
    SignOut,
    Trash,
    Warning,
    X,
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
import PinConfirmation, {
    PinSteps,
    usePinConfirmation,
} from '../../../components/ui/PinConfirmation';
import PinField from '../../../components/ui/PinField';
import { PIN_MAX_ATTEMPTS } from '../../../lib/security';
import Slider from '../../../components/ui/Slider';
import Stepper from '../../../components/ui/Stepper';
import ListeBornee from '../../../components/ui/ListeBornee';
import { echeancierAmortissement } from '../../../lib/financial';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';
import { useRouter } from '../../../hooks/useRouter';
import FilePicker from '../../../components/ui/FilePicker';
import { formatFileSize, getImportLimitBytes } from '../../../lib/fileImport';
import { signatureService } from '../../../services/signatureService';
import { cn } from '../../../lib/utils';
import { PAGE_BUREAU, COLONNES_FORMULAIRE } from '../../../lib/regimeBureau';
import { seuilDevis } from '../../inventory/reparation';
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
import { useEntree } from '../../../hooks/useEntree';
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
    /** Le seuil de validation d'un devis de réparation (24/09). */
    | 'repair'
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
    repair: 'Validation des devis',
};

/** Les seuils proposés pour un devis de réparation ; 0 : tout devis va à la Finance. */
const SEUILS_DEVIS = [0, 50000, 150000, 500000] as const;

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
 * Il ne descend pas sous le plancher de 11 : au bureau, 0,7em du corps de 14 font 9,8.
 */
const Premier: React.FC = () => (
    <>
        1<sup className="text-[length:max(0.7em,0.6875rem)] leading-none">er</sup>
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

    /* Les trois formes **restent** quand le réglage défile (17.8 : *« l'en-tête est fixe ;
       le contenu défile »*) — d'où `sticky` sur chacune, et un fond au bureau, où la barre
       n'en avait pas. */

    /* Au-delà de 600, les deux barres prennent **l'en-tête du bureau** (17.11) : sur le
       canevas, sans filet, le retour en carré de 40 et le titre en 28 sur 32 — la forme
       des fiches du gabarit. Le bloc blanc du téléphone y faisait une seconde surface. */
    if (!isCompact) {
        return (
            <IconGestureSizeContext.Provider value={40}>
                {/* Le titre suit la colonne centrée des réglages (23/09). */}
                <div className="px-page bg-background deux:mx-auto deux:max-w-[calc(63rem+2*var(--tk-space-page))] sticky top-0 z-20 flex min-h-[72px] w-full items-center gap-2 pt-5">
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
                    <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 flex-1 truncate font-semibold tracking-[-0.02em]">
                        {title}
                    </h1>
                </div>
            </IconGestureSizeContext.Provider>
        );
    }

    if (variant === 'fiche') {
        /* La barre commune du téléphone (24/09) : le titre à 56 / 16, comme l'index. */
        return <BarreDePage className="sticky top-0 z-20" title={title} onBack={onBack} />;
    }

    /* `.top .tt` — la rangée du titre rentre sa flèche de 12, et le titre tombe à 56 : huit
       planches de page l'écrivent ainsi (04.1, 05.1, 09.1, 10.1, 11.1, 14.1, 16.1, 18.1). Le
       retrait de 8 ne venait que de 17.9, et posait le titre à 60 sur toutes les pages du
       menu (relevé du 13/09). */
    return (
        <div className="border-outline-variant bg-surface sticky top-0 z-20 flex flex-col gap-3 border-b px-4 pt-2 pb-3">
            <div className="flex min-h-12 items-center gap-1">
                {retour && <span className="-ml-3 flex shrink-0">{retour}</span>}
                <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 flex-1 font-semibold tracking-[-0.02em]">
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
    /* Les groupes de réglages entrent en cascade à l'arrivée (26/09). */
    const entree = useEntree();
    const { showToast } = useToast();
    const { navigate } = useRouter();
    /*
      **Au bureau, deux colonnes** (23/09) — les groupes de réglages en colonnes équilibrées,
      et « Mon compte » en fiche : l'identité à gauche, les actes à droite. Une seule colonne
      de 1 008 posait des cartes d'une rangée d'un bord à l'autre.
    */
    const deuxColonnes = useMediaQuery(MEDIA.twoColumn);
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

    /** Les types qui prennent le défaut d'abord — ceux que la page règle —, puis par nom. */
    const typesParPlan = useMemo(
        () =>
            [...categories].sort(
                (a, b) =>
                    Number(Boolean(a.defaultDepreciation?.years)) -
                        Number(Boolean(b.defaultDepreciation?.years)) ||
                    getCategoryLabel(a.name).localeCompare(getCategoryLabel(b.name), 'fr'),
            ),
        [categories],
    );

    const echeancierParDefaut = useMemo(
        () =>
            echeancierAmortissement(
                settings.defaultDepreciationMethod,
                settings.defaultDepreciationYears,
                settings.salvageValuePercent,
            ),
        [
            settings.defaultDepreciationMethod,
            settings.defaultDepreciationYears,
            settings.salvageValuePercent,
        ],
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
        ? /* **La valeur ne redit pas le titre.** « Code PIN défini » prenait 137 px à
           droite de « Mon compte » : avec la vignette, le titre n'avait plus la place et
           se coupait à « Mon… ». La rangée dit déjà de quel réglage il s'agit, et le
           pictogramme dit déjà que c'est une alerte. */
          { tone: 'positive', icon: CheckCircle, label: 'Défini' }
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
        /* **Au bureau, la page tient la fenêtre** (23/09) : la barre reste, les groupes
           défilent dessous. Le corps portait déjà son `overflow-y-auto` ; il lui manquait
           une hauteur à remplir — sans elle, il s'étirait au contenu et c'était la page
           entière qui défilait, titre compris. */
        <div className={cn('flex min-h-0 w-full flex-1 flex-col', PAGE_BUREAU)}>
            <SettingsBar
                title={VIEW_TITLE[view]}
                variant={view === 'index' || view === 'account' ? 'liste' : 'fiche'}
                onBack={view === 'index' ? onBack : goBack}
            />

            {/* `.page` de 14.1 — `16px 16px 24px`. La gouttière valait 20 : quatre pixels
                pris de chaque côté à des rangées qui n'en avaient pas de trop. */}
            <div className="medium:px-page flex-1 overflow-y-auto px-4 pt-4 pb-6">
                {/* `.page` de 07.1 : 16 d'écart entre le héro et les cartes (10/09 ; il valait 20). */}
                {/* **Au bureau, un sous-écran n'est plus une colonne de téléphone** (24/09).
                    Les rangées couraient sur 1 008 px, la valeur ou l'interrupteur à 900 px
                    de son libellé. Les réglages à deux groupes ou plus se rangent en deux
                    colonnes (`COLONNES_FORMULAIRE`) ; ceux qui n'en ont qu'un se tiennent à
                    la mesure d'un formulaire, 560, centrés. */}
                <Reading
                    desk
                    className={cn(
                        'flex flex-col gap-4 pb-16',
                        (view === 'currency' || view === 'sources') && COLONNES_FORMULAIRE,
                        (view === 'inventory' ||
                            view === 'files' ||
                            view === 'repair' ||
                            view === 'signature') &&
                            'deux:mx-auto deux:max-w-[560px]',
                    )}
                >
                    {view === 'index' && (
                        <div
                            className={cn(
                                deuxColonnes
                                    ? /* Des colonnes de texte, pas une grille : chaque groupe
                                         garde sa hauteur, et la seconde colonne commence où la
                                         première s'arrête — pas de trou sous un groupe court. */
                                      'columns-2 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid'
                                    : 'contents',
                                entree && 'mvt-cascade-cartes',
                            )}
                        >
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
                                    title="Validation des devis"
                                    subtitle="Au-delà, la Finance valide une réparation"
                                    value={
                                        seuilDevis(settings) === 0
                                            ? 'toujours'
                                            : `${seuilDevis(settings).toLocaleString('fr-FR')} ${settings.currency}`
                                    }
                                    onOpen={() => setView('repair')}
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
                        </div>
                    )}

                    {view === 'account' && (
                        <div
                            className={
                                deuxColonnes ? 'grid grid-cols-12 items-start gap-4' : 'contents'
                            }
                        >
                            <div className={deuxColonnes ? 'col-span-5' : 'contents'}>
                                {/* `.prof` de 07.1 — **le héro ne porte que l'identité**.
                                *« Un acte n'a qu'une entrée, dans sa carte »* : pas de
                                geste ici, pas de qualifiant chiffré. */}
                                <DetailHero
                                    /* Les initiales nues : `DetailHero` pose déjà la fonte de marque,
                                   20 sur 30 et la graisse d'appui, comme 07.1 les dessine. Les
                                   redéclarer ici ajoutait un second style au même texte. */
                                    avatar={initiales(currentUser?.name)}
                                    label={identiteLabel}
                                    subject={currentUser?.name ?? 'Mon compte'}
                                    subtitle={currentUser?.email}
                                />
                            </div>

                            <div
                                className={
                                    deuxColonnes ? 'col-span-7 flex flex-col gap-4' : 'contents'
                                }
                            >
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
                            </div>
                        </div>
                    )}
                    {view === 'signature' && imageAImporter && (
                        <SignatureCrop
                            fichier={imageAImporter}
                            onAutreImage={() => {
                                setImageAImporter(null);
                                setView('account');
                                setSourceSheetOpen(true);
                            }}
                            onAnnuler={() => {
                                setImageAImporter(null);
                                setView('account');
                            }}
                            onEnregistrer={enregistrerLaSignature}
                        />
                    )}

                    {view === 'currency' && (
                        <>
                            <RuleGroup form="grp" header="Lecture des montants">
                                <RuleGroup.Row title="Devise" value={settings.currency} />
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

                            <p className="text-text-muted text-ts-sub leading-ts-sub">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'depreciation' && (
                        /*
                          **Amortissement, refondu** (25/09). C'était une page de réglages comme
                          les autres : deux rangées « Retenue », deux cases numériques de 96 px
                          sans unité, quinze types sous leur clé technique (« Laptop »,
                          « DockingStation ») et un renvoi vers la devise. Rien ne montrait ce que
                          le plan fait à la valeur d'un objet — c'est pourtant ce qu'on règle.
                          L'aperçu le dessine, la méthode se choisit sur sa courbe, la durée et le
                          résiduel se règlent d'un cran, et chaque type ouvre sa fiche.
                        */
                        <div className="deux:grid deux:grid-cols-2 deux:items-start flex flex-col gap-4">
                            <div className="flex flex-col gap-4">
                                <section className="rounded-card bg-surface px-4 pt-4 pb-4">
                                    <p className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                                        Ce que devient un objet, en part de son prix
                                    </p>
                                    <p className="text-on-surface text-ts-body leading-ts-body mt-1 text-pretty">
                                        {phraseDuPlan(
                                            settings.defaultDepreciationMethod,
                                            echeancierParDefaut,
                                        )}
                                    </p>
                                    <CourbeDeValeur
                                        valeurs={echeancierParDefaut}
                                        className="mt-4"
                                    />
                                    {settings.defaultDepreciationMethod === 'degressive' && (
                                        <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-3 flex items-start gap-2">
                                            <Icon
                                                glyph={Info}
                                                size={18}
                                                className="text-text-tertiary mt-px shrink-0"
                                            />
                                            Les valeurs du parc se calculent encore en linéaire.
                                        </p>
                                    )}
                                </section>

                                <RuleGroup
                                    form="grp"
                                    header="Méthode"
                                    note={
                                        governedAssets > 0
                                            ? `Elle vaut pour les types sans plan à eux — ${governedAssets} actif${governedAssets > 1 ? 's' : ''} aujourd'hui.`
                                            : 'Elle vaut pour les types sans plan à eux.'
                                    }
                                >
                                    <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-4">
                                        {DEPRECIATION_METHODS.map((method) => (
                                            <CarteMethode
                                                key={method.value}
                                                titre={method.label}
                                                phrase={
                                                    method.value === 'linear'
                                                        ? 'La même part chaque année'
                                                        : 'Plus forte les premières années'
                                                }
                                                valeurs={echeancierAmortissement(
                                                    method.value,
                                                    settings.defaultDepreciationYears,
                                                    settings.salvageValuePercent,
                                                )}
                                                choisie={
                                                    settings.defaultDepreciationMethod ===
                                                    method.value
                                                }
                                                onChoisir={() =>
                                                    apply({
                                                        defaultDepreciationMethod: method.value,
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                </RuleGroup>

                                <RuleGroup form="grp" header="Durée et fin de vie">
                                    <RuleGroup.Row
                                        title="Durée"
                                        subtitle="Jusqu'à ce qu'il ne vaille plus que son résiduel"
                                        trailing={
                                            <Stepper
                                                label="Durée"
                                                value={settings.defaultDepreciationYears}
                                                min={1}
                                                max={20}
                                                format={(annees) =>
                                                    `${annees} an${annees > 1 ? 's' : ''}`
                                                }
                                                onChange={(annees) =>
                                                    apply({ defaultDepreciationYears: annees })
                                                }
                                            />
                                        }
                                    />
                                    <RuleGroup.Row
                                        title="Valeur résiduelle"
                                        subtitle="Ce qu'il vaut encore à la fin"
                                        trailing={
                                            <Stepper
                                                label="Valeur résiduelle"
                                                value={settings.salvageValuePercent}
                                                min={0}
                                                max={50}
                                                step={5}
                                                format={(part) => `${part} %`}
                                                onChange={(part) =>
                                                    apply({ salvageValuePercent: part })
                                                }
                                            />
                                        }
                                    />
                                </RuleGroup>
                            </div>

                            <div className="flex flex-col gap-4">
                                <RuleGroup
                                    form="grp"
                                    header="Ce que porte chaque type"
                                    headerTrailing={`${typesWithOwnPlan} sur ${categories.length} ont leur plan`}
                                >
                                    {/* Ceux qui prennent le défaut d'abord : ce sont eux que la
                                        page règle. Chaque type ouvre sa fiche, où son plan se
                                        modifie. */}
                                    <ListeBornee hauteur={30} label="Les types et leur plan">
                                        {typesParPlan.map((category) => {
                                            const plan = category.defaultDepreciation;
                                            return (
                                                <RuleGroup.Row
                                                    key={category.id}
                                                    glyph={getCategoryGlyph(category.name)}
                                                    title={getCategoryLabel(category.name)}
                                                    subtitle={
                                                        plan?.years
                                                            ? `${plan.method === 'degressive' ? 'Dégressif' : 'Linéaire'}${plan.salvageValuePercent ? ` · ${plan.salvageValuePercent} % résiduel` : ''}`
                                                            : 'Prend le réglage par défaut'
                                                    }
                                                    value={
                                                        plan?.years
                                                            ? `${plan.years} an${plan.years > 1 ? 's' : ''}`
                                                            : 'défaut'
                                                    }
                                                    valueTone={plan?.years ? undefined : 'muted'}
                                                    onOpen={() =>
                                                        navigate(
                                                            `/management/categories/${category.id}`,
                                                        )
                                                    }
                                                />
                                            );
                                        })}
                                    </ListeBornee>
                                </RuleGroup>

                                <p className="text-text-muted text-ts-sub leading-ts-sub">
                                    Aucun bouton d'enregistrement : chaque réglage s'applique quand
                                    on le pose.
                                </p>
                            </div>
                        </div>
                    )}

                    {view === 'repair' && (
                        <>
                            <RuleGroup
                                form="grp"
                                header="Un devis de réparation va à la Finance"
                                note="Sous le seuil, l'informatique qui prend en charge valide seule et l'objet part chez le prestataire. Au-delà, la Finance tranche d'abord ; la réparation attend."
                            >
                                {SEUILS_DEVIS.map((seuil) => {
                                    const retenu = seuilDevis(settings) === seuil;
                                    return (
                                        <RuleGroup.Row
                                            key={seuil}
                                            title={
                                                seuil === 0
                                                    ? 'Toujours'
                                                    : `Au-delà de ${seuil.toLocaleString('fr-FR')} ${settings.currency}`
                                            }
                                            subtitle={
                                                seuil === 0
                                                    ? 'chaque devis, quel que soit son montant'
                                                    : undefined
                                            }
                                            status={
                                                retenu
                                                    ? { icon: CheckCircle, tone: 'positive' }
                                                    : undefined
                                            }
                                            value={retenu ? 'Retenu' : undefined}
                                            valueTone={retenu ? 'positive' : undefined}
                                            onOpen={() => apply({ repairQuoteThreshold: seuil })}
                                            choice
                                        />
                                    );
                                })}
                            </RuleGroup>

                            <p className="text-text-muted text-ts-sub leading-ts-sub">
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

                            <p className="text-text-muted text-ts-sub leading-ts-sub">
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
                                note="Au-delà de la borne, un fichier est refusé — import, facture ou photo."
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

                            <p className="text-text-muted text-ts-sub leading-ts-sub">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on
                                le pose.
                            </p>
                        </>
                    )}

                    {view === 'sources' && (
                        <>
                            <RuleGroup
                                form="grp"
                                note="Une source muette depuis six jours remonte au sommaire."
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
                                note="Une machine remontée attend une validation dans Tâches."
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
                        <span className="text-on-surface text-ts-sub font-medium">
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
                            <p className="text-text-secondary text-ts-sub leading-ts-sub">
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
                                <span className="text-on-surface text-ts-sub">
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
                        <p className="text-error text-ts-sub leading-ts-sub flex gap-2">
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
                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub mb-2">
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
                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
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
                        <p className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                            Si vous la supprimez
                        </p>
                        <p className="text-on-surface text-ts-sub leading-ts-sub flex items-center gap-3">
                            <span className="bg-tint-bleu text-on-tint-bleu flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={Key} size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                                Le code PIN <b className="font-medium">suffit</b> à attester.
                            </span>
                        </p>
                        <p className="text-on-surface text-ts-sub leading-ts-sub flex items-center gap-3">
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
                <span className="text-text-tertiary absolute top-3 right-3 text-[0.75rem] leading-4">
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
            <span className="text-on-surface-variant text-ts-sub leading-ts-sub absolute inset-x-0 bottom-2.5 text-center">
                {nom}
            </span>
        </div>
    );
};

/** « 33,3 » — une part d'un chiffre après la virgule, à la française. */
const part = (valeur: number) =>
    Number.isInteger(Math.round(valeur * 10) / 10)
        ? String(Math.round(valeur))
        : (Math.round(valeur * 10) / 10).toFixed(1).replace('.', ',');

/** Ce que le plan fait à un objet, en une phrase — celle de l'aperçu. */
const phraseDuPlan = (methode: 'linear' | 'degressive', valeurs: number[]) => {
    const duree = valeurs.length - 1;
    const residuel = valeurs[duree];
    const fin =
        residuel > 0
            ? `il vaut ${part(residuel)} % de son prix au bout de ${duree} an${duree > 1 ? 's' : ''}`
            : `il ne vaut plus rien au bout de ${duree} an${duree > 1 ? 's' : ''}`;
    return methode === 'linear'
        ? `Il perd ${part(100 - valeurs[1])} % de son prix chaque année ; ${fin}.`
        : `Il perd ${part(100 - valeurs[1])} % la première année, puis moins chaque année ; ${fin}.`;
};

/**
 * **La courbe de valeur** — de l'achat (100 %) à la fin de la durée, une année par point.
 * `mini` : la même, sans axes ni libellés, pour la carte d'une méthode.
 */
const CourbeDeValeur: React.FC<{ valeurs: number[]; mini?: boolean; className?: string }> = ({
    valeurs,
    mini = false,
    className,
}) => {
    const largeur = 320;
    const hauteur = mini ? 44 : 132;
    const haut = mini ? 4 : 18;
    const bas = mini ? 4 : 22;
    const duree = Math.max(1, valeurs.length - 1);
    const x = (annee: number) => 6 + (annee / duree) * (largeur - 12);
    const y = (valeur: number) => haut + (1 - valeur / 100) * (hauteur - haut - bas);
    const points = valeurs.map((valeur, annee) => `${x(annee)},${y(valeur)}`).join(' ');
    const pas = duree > 10 ? 5 : duree > 5 ? 2 : 1;
    return (
        <svg
            viewBox={`0 0 ${largeur} ${hauteur}`}
            className={cn('block w-full overflow-visible', className)}
            role={mini ? undefined : 'img'}
            aria-hidden={mini ? true : undefined}
            aria-label={
                mini
                    ? undefined
                    : `De 100 % à l'achat à ${part(valeurs[duree])} % au bout de ${duree} ans`
            }
        >
            {!mini &&
                [100, 50, 0].map((niveau) => (
                    <line
                        key={niveau}
                        x1={0}
                        x2={largeur}
                        y1={y(niveau)}
                        y2={y(niveau)}
                        stroke="var(--tk-color-outline-variant)"
                        strokeWidth={1}
                        strokeDasharray={niveau === 0 ? undefined : '3 4'}
                    />
                ))}
            <polygon
                points={`${x(0)},${y(0)} ${points} ${x(duree)},${y(0)}`}
                fill="var(--tk-color-live-bleu)"
                fillOpacity={0.12}
            />
            <polyline
                points={points}
                fill="none"
                stroke="var(--tk-color-live-bleu)"
                strokeWidth={mini ? 2 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {!mini && (
                <>
                    {valeurs.map((valeur, annee) => (
                        <circle
                            key={annee}
                            cx={x(annee)}
                            cy={y(valeur)}
                            r={3}
                            fill="var(--tk-color-surface)"
                            stroke="var(--tk-color-live-bleu)"
                            strokeWidth={2}
                        />
                    ))}
                    {valeurs.map((_, annee) =>
                        annee === 0 || annee === duree || annee % pas === 0 ? (
                            <text
                                key={annee}
                                x={x(annee)}
                                y={hauteur - 4}
                                textAnchor={
                                    annee === 0 ? 'start' : annee === duree ? 'end' : 'middle'
                                }
                                fontSize={11}
                                fill="var(--tk-color-text-tertiary)"
                            >
                                {annee === 0 ? 'achat' : `an ${annee}`}
                            </text>
                        ) : null,
                    )}
                    <text
                        x={x(0) + 6}
                        y={y(100) - 6}
                        fontSize={11}
                        fill="var(--tk-color-on-surface-variant)"
                    >
                        100 %
                    </text>
                    <text
                        x={x(duree)}
                        y={y(valeurs[duree]) - 8}
                        textAnchor="end"
                        fontSize={11}
                        fill="var(--tk-color-on-surface-variant)"
                    >
                        {part(valeurs[duree])} %
                    </text>
                </>
            )}
        </svg>
    );
};

/** Une méthode, sur sa courbe : on choisit ce qu'on voit, pas un mot. */
const CarteMethode: React.FC<{
    titre: string;
    phrase: string;
    valeurs: number[];
    choisie: boolean;
    onChoisir: () => void;
}> = ({ titre, phrase, valeurs, choisie, onChoisir }) => (
    <Button
        variant="text"
        layout="card"
        aria-pressed={choisie}
        onClick={onChoisir}
        className={cn(
            'flex h-full w-full flex-col items-stretch justify-start gap-2 rounded-lg border p-3 text-left font-normal whitespace-normal',
            choisie
                ? 'border-on-surface bg-surface-container'
                : 'border-outline-variant hover:bg-surface-container',
        )}
    >
        <CourbeDeValeur valeurs={valeurs} mini />
        <span className="flex items-center gap-2">
            <span className="text-on-surface text-ts-body leading-ts-body font-medium">
                {titre}
            </span>
            {choisie && (
                <Icon
                    glyph={CheckCircle}
                    size={18}
                    className="ml-auto shrink-0 text-[var(--tk-color-st-vert)]"
                />
            )}
        </span>
        <span className="text-on-surface-variant text-ts-sub leading-ts-sub">{phrase}</span>
    </Button>
);

/**
 * **Recadrer** — 07.1, lot 28 D2, **refondu le 25/09** pour le téléphone.
 *
 * Le cadre au format de la case d'attestation (3:1) ne mesurait que 330 × 110 au
 * téléphone, l'image arrivait « couvrant » ce cadre — donc au hasard de sa composition, la
 * signature souvent coupée ou minuscule —, rien ne se voyait autour du cadre, et « pincez
 * pour zoomer » était écrit sans que le pincement soit programmé. Recadrer prenait une
 * minute de tâtonnements pour un geste qui devrait en prendre zéro.
 *
 * - **Le cadrage est automatique.** L'image est lue une fois : le fond (le papier) est la
 *   luminance la plus fréquente parmi les clairs, l'encre ce qui s'en écarte nettement. Le
 *   cadre se pose sur le tracé, avec sa marge. Toucher deux fois, ou « Recadrer
 *   automatiquement », y revient.
 * - **Le fond est effacé.** Une signature photographiée arrivait sur un papier beige et son
 *   ombre, qui faisaient un rectangle sur la case verte de l'attestation. Le PNG ne garde
 *   que le tracé ; le cadre le montre sur blanc.
 * - **On voit autour du cadre** : l'image entière, voilée hors du cadre. On sait ce qu'on
 *   coupe.
 * - **Les gestes du téléphone** : glisser, pincer (deux doigts, autour de leur milieu), et
 *   la molette au bureau. Le curseur reste pour qui préfère le cran.
 *
 * Ce qu'on voit dans le cadre *est* ce qui sera enregistré : le PNG sort d'un canevas de
 * 900 × 300 dessiné avec les mêmes nombres. Aucune librairie : le Canvas natif suffit.
 */
const LARGEUR_CADRE = 900;
const HAUTEUR_CADRE = 300;

interface ImageLue {
    /** L'image, ramenée à 1 600 px au plus sur son grand côté. */
    original: HTMLCanvasElement;
    /** La même, fond effacé : l'encre seule. */
    detouree: HTMLCanvasElement;
    /** Le rectangle du tracé, en pixels de l'image lue — absent si rien ne s'est distingué. */
    encre: { x: number; y: number; l: number; h: number } | null;
}

/** Lit l'image : le fond, l'encre, et le rectangle qui la contient. */
const lireLImage = (image: HTMLImageElement): ImageLue => {
    const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
    const l = Math.max(1, Math.round(image.width * echelle));
    const h = Math.max(1, Math.round(image.height * echelle));
    const original = document.createElement('canvas');
    original.width = l;
    original.height = h;
    const contexte = original.getContext('2d', { willReadFrequently: true });
    const detouree = document.createElement('canvas');
    detouree.width = l;
    detouree.height = h;
    if (!contexte) return { original, detouree, encre: null };
    contexte.drawImage(image, 0, 0, l, h);
    const pixels = contexte.getImageData(0, 0, l, h);
    const d = pixels.data;

    /* La luminance de chaque pixel, posé sur blanc (un PNG transparent a un fond blanc). */
    const luminance = new Float32Array(l * h);
    const histogramme = new Uint32Array(256);
    for (let i = 0; i < l * h; i += 1) {
        const a = d[i * 4 + 3] / 255;
        const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        const valeur = a * lum + (1 - a) * 255;
        luminance[i] = valeur;
        histogramme[Math.min(255, Math.round(valeur))] += 1;
    }
    /* Le fond : le 80ᵉ centile — le papier occupe l'essentiel de l'image. */
    let cumul = 0;
    let fond = 255;
    for (let niveau = 0; niveau < 256; niveau += 1) {
        cumul += histogramme[niveau];
        if (cumul >= l * h * 0.8) {
            fond = niveau;
            break;
        }
    }
    const clair = fond - 28;
    const fonce = Math.max(0, fond - 110);

    const sortie = contexte.createImageData(l, h);
    const s = sortie.data;
    const colonnes = new Uint32Array(l);
    const rangees = new Uint32Array(h);
    let total = 0;
    for (let i = 0; i < l * h; i += 1) {
        const alpha = Math.min(1, Math.max(0, (clair - luminance[i]) / (clair - fonce)));
        s[i * 4] = d[i * 4];
        s[i * 4 + 1] = d[i * 4 + 1];
        s[i * 4 + 2] = d[i * 4 + 2];
        s[i * 4 + 3] = Math.round(alpha * 255);
        if (alpha > 0.5) {
            colonnes[i % l] += 1;
            rangees[Math.floor(i / l)] += 1;
            total += 1;
        }
    }
    detouree.getContext('2d')?.putImageData(sortie, 0, 0);

    /* Le rectangle de l'encre, sans ses poussières : du 0,5ᵉ au 99,5ᵉ centile. */
    const bornes = (comptes: Uint32Array) => {
        let vus = 0;
        let debut = 0;
        let fin = comptes.length - 1;
        for (let k = 0; k < comptes.length; k += 1) {
            vus += comptes[k];
            if (vus > total * 0.005) {
                debut = k;
                break;
            }
        }
        vus = 0;
        for (let k = comptes.length - 1; k >= 0; k -= 1) {
            vus += comptes[k];
            if (vus > total * 0.005) {
                fin = k;
                break;
            }
        }
        return [debut, fin] as const;
    };
    /* Moins d'un pixel sur deux mille : rien d'assez net pour cadrer dessus. */
    if (total < (l * h) / 2000) return { original, detouree, encre: null };
    const [x0, x1] = bornes(colonnes);
    const [y0, y1] = bornes(rangees);
    return {
        original,
        detouree,
        encre: { x: x0, y: y0, l: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) },
    };
};

/** Où l'image se pose : son échelle, et le point de l'image qui tombe au centre du cadre. */
interface Pose {
    echelle: number;
    cx: number;
    cy: number;
}

const poseAutomatique = (lue: ImageLue): Pose => {
    const { original, encre } = lue;
    if (!encre) {
        return {
            echelle: Math.max(LARGEUR_CADRE / original.width, HAUTEUR_CADRE / original.height),
            cx: original.width / 2,
            cy: original.height / 2,
        };
    }
    /* Le tracé tient dans le cadre avec un cinquième de marge. */
    return {
        echelle: Math.min(LARGEUR_CADRE / (encre.l * 1.2), HAUTEUR_CADRE / (encre.h * 1.25)),
        cx: encre.x + encre.l / 2,
        cy: encre.y + encre.h / 2,
    };
};

/** Dessine le tracé posé dans un cadre de 900 × 300, sans fond : ce qui sera enregistré. */
const dessinerLeCadre = (contexte: CanvasRenderingContext2D, lue: ImageLue, pose: Pose) => {
    contexte.drawImage(
        lue.detouree,
        LARGEUR_CADRE / 2 - pose.cx * pose.echelle,
        HAUTEUR_CADRE / 2 - pose.cy * pose.echelle,
        lue.original.width * pose.echelle,
        lue.original.height * pose.echelle,
    );
};

const SignatureCrop: React.FC<{
    fichier: File;
    onAutreImage: () => void;
    onAnnuler: () => void;
    onEnregistrer: (image: Blob) => void;
}> = ({ fichier, onAutreImage, onAnnuler, onEnregistrer }) => {
    /*
      **Au téléphone, le recadrage prend tout l'écran** (25/09, « la zone de cadrage est trop
      petite ») : dans le flux des réglages, la scène tenait 254 px de haut et le cadre
      330 × 110. Plein écran, sur fond sombre comme un éditeur de photo, l'image a toute la
      hauteur du téléphone pour se glisser et se pincer, et le cadre toute sa largeur ; les
      réglages se rangent dans un pied. Au-delà du téléphone, la scène reste dans la page.
    */
    const pleinEcran = useMediaQuery(MEDIA.compact);
    const scene = React.useRef<HTMLCanvasElement>(null);
    const boite = React.useRef<HTMLDivElement>(null);
    const [lue, setLue] = useState<ImageLue | null>(null);
    const [pose, setPose] = useState<Pose | null>(null);
    const [dimensions, setDimensions] = useState({ l: 0, h: 0 });
    const pointeurs = React.useRef(new Map<number, { x: number; y: number }>());
    const pincement = React.useRef<{
        distance: number;
        pose: Pose;
        milieu: { x: number; y: number };
    } | null>(null);

    useEffect(() => {
        const url = URL.createObjectURL(fichier);
        const element = new Image();
        element.onload = () => {
            const resultat = lireLImage(element);
            setLue(resultat);
            setPose(poseAutomatique(resultat));
        };
        element.src = url;
        return () => URL.revokeObjectURL(url);
    }, [fichier]);

    useEffect(() => {
        const el = boite.current;
        if (!el) return;
        const mesurer = () => setDimensions({ l: el.clientWidth, h: el.clientHeight });
        mesurer();
        const observateur = new ResizeObserver(mesurer);
        observateur.observe(el);
        return () => observateur.disconnect();
    }, [pleinEcran]);

    /* Le plein écran se ferme aussi par la touche Échap, et bloque le défilement dessous. */
    useEffect(() => {
        if (!pleinEcran) return;
        const surTouche = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onAnnuler();
        };
        const debordement = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', surTouche);
        return () => {
            document.body.style.overflow = debordement;
            window.removeEventListener('keydown', surTouche);
        };
    }, [pleinEcran, onAnnuler]);

    /* La géométrie : le cadre 3:1 le plus large possible, centré. Dans la page, la scène
       mesure le cadre plus 72 d'image au-dessus et au-dessous ; plein écran, elle prend la
       hauteur qui reste, et le cadre ne s'arrête qu'à 12 des bords. */
    const margeX = pleinEcran ? 12 : 16;
    const largeurDuCadre = Math.max(
        0,
        Math.min(
            dimensions.l - 2 * margeX,
            pleinEcran && dimensions.h > 0 ? (dimensions.h - 48) * 3 : Infinity,
        ),
    );
    const k = largeurDuCadre / LARGEUR_CADRE;
    const hauteurDuCadre = HAUTEUR_CADRE * k;
    const hauteurScene = pleinEcran ? dimensions.h : Math.round(hauteurDuCadre + 144);
    const gaucheDuCadre = (dimensions.l - largeurDuCadre) / 2;
    const hautDuCadre = (hauteurScene - hauteurDuCadre) / 2;

    const echelleDeBase = lue
        ? Math.max(LARGEUR_CADRE / lue.original.width, HAUTEUR_CADRE / lue.original.height)
        : 1;
    const zoomAuto = lue ? poseAutomatique(lue).echelle / echelleDeBase : 1;
    const zoomMax = Math.max(4, zoomAuto * 2);
    const zoomMin = 0.25;

    useEffect(() => {
        const canvas = scene.current;
        const el = boite.current;
        const contexte = canvas?.getContext('2d');
        if (
            !canvas ||
            !el ||
            !contexte ||
            !lue ||
            !pose ||
            dimensions.l === 0 ||
            hauteurScene === 0
        )
            return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(dimensions.l * ratio);
        canvas.height = Math.round(hauteurScene * ratio);
        contexte.setTransform(ratio, 0, 0, ratio, 0, 0);
        /* Les couleurs de la scène sont celles de sa boîte : creux clair dans la page,
           fond sombre en plein écran. */
        const styleDeBoite = getComputedStyle(el);
        const fondDeScene = styleDeBoite.backgroundColor;
        const encreDuCadre = styleDeBoite.color;

        contexte.clearRect(0, 0, dimensions.l, hauteurScene);
        contexte.fillStyle = fondDeScene;
        contexte.fillRect(0, 0, dimensions.l, hauteurScene);

        /* L'image entière, à sa place, puis voilée hors du cadre. */
        contexte.drawImage(
            lue.original,
            gaucheDuCadre + (LARGEUR_CADRE / 2 - pose.cx * pose.echelle) * k,
            hautDuCadre + (HAUTEUR_CADRE / 2 - pose.cy * pose.echelle) * k,
            lue.original.width * pose.echelle * k,
            lue.original.height * pose.echelle * k,
        );
        contexte.globalAlpha = pleinEcran ? 0.55 : 0.66;
        contexte.fillStyle = fondDeScene;
        contexte.fillRect(0, 0, dimensions.l, hauteurScene);
        contexte.globalAlpha = 1;

        /* Le cadre : le tracé seul, sur blanc — ce qui sera apposé. */
        contexte.save();
        contexte.translate(gaucheDuCadre, hautDuCadre);
        contexte.scale(k, k);
        contexte.beginPath();
        contexte.rect(0, 0, LARGEUR_CADRE, HAUTEUR_CADRE);
        contexte.clip();
        contexte.fillStyle = 'white';
        contexte.fillRect(0, 0, LARGEUR_CADRE, HAUTEUR_CADRE);
        dessinerLeCadre(contexte, lue, pose);
        contexte.restore();

        /* Le filet et les quatre coins. */
        contexte.strokeStyle = encreDuCadre;
        contexte.lineWidth = 1;
        contexte.strokeRect(
            gaucheDuCadre + 0.5,
            hautDuCadre + 0.5,
            largeurDuCadre - 1,
            hauteurDuCadre - 1,
        );
        contexte.lineWidth = 3;
        const coin = 20;
        const x0 = gaucheDuCadre;
        const y0 = hautDuCadre;
        const x1 = gaucheDuCadre + largeurDuCadre;
        const y1 = hautDuCadre + hauteurDuCadre;
        contexte.beginPath();
        [
            [x0, y0 + coin, x0, y0, x0 + coin, y0],
            [x1 - coin, y0, x1, y0, x1, y0 + coin],
            [x0, y1 - coin, x0, y1, x0 + coin, y1],
            [x1 - coin, y1, x1, y1, x1, y1 - coin],
        ].forEach(([ax, ay, bx, by, cx, cy]) => {
            contexte.moveTo(ax, ay);
            contexte.lineTo(bx, by);
            contexte.lineTo(cx, cy);
        });
        contexte.stroke();
    }, [
        lue,
        pose,
        dimensions.l,
        hauteurScene,
        gaucheDuCadre,
        hautDuCadre,
        hauteurDuCadre,
        largeurDuCadre,
        k,
        pleinEcran,
    ]);

    /** Le point du pointeur, en unités du cadre (900 × 300), depuis le coin du cadre. */
    const dansLeCadre = (clientX: number, clientY: number) => {
        const rect = scene.current?.getBoundingClientRect();
        if (!rect || k === 0) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left - gaucheDuCadre) / k,
            y: (clientY - rect.top - hautDuCadre) / k,
        };
    };

    const borner = (echelle: number) =>
        Math.min(zoomMax * echelleDeBase, Math.max(zoomMin * echelleDeBase, echelle));

    /** Change d'échelle en gardant fixe le point de l'image sous `ancre` (unités du cadre). */
    const zoomerAutour = (depart: Pose, echelle: number, ancre: { x: number; y: number }): Pose => {
        const suivante = borner(echelle);
        const px = depart.cx + (ancre.x - LARGEUR_CADRE / 2) / depart.echelle;
        const py = depart.cy + (ancre.y - HAUTEUR_CADRE / 2) / depart.echelle;
        return {
            echelle: suivante,
            cx: px - (ancre.x - LARGEUR_CADRE / 2) / suivante,
            cy: py - (ancre.y - HAUTEUR_CADRE / 2) / suivante,
        };
    };

    const recadrerAutomatiquement = () => {
        if (lue) setPose(poseAutomatique(lue));
    };

    /** Le PNG : le tracé seul, sans fond — il se pose sur la case teintée de l'attestation. */
    const enregistrer = () => {
        if (!lue || !pose) return;
        const sortie = document.createElement('canvas');
        sortie.width = LARGEUR_CADRE;
        sortie.height = HAUTEUR_CADRE;
        const contexte = sortie.getContext('2d');
        if (!contexte) return;
        dessinerLeCadre(contexte, lue, pose);
        sortie.toBlob((image) => {
            if (image) onEnregistrer(image);
        }, 'image/png');
    };

    const canevas = (
        <canvas
            ref={scene}
            style={{ height: hauteurScene || 240 }}
            aria-label="L'image de la signature, et le cadre qui sera enregistré"
            role="img"
            onPointerDown={(event) => {
                pointeurs.current.set(event.pointerId, dansLeCadre(event.clientX, event.clientY));
                try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                    /* Un pointeur déjà relâché ne se capture pas : le geste continue. */
                }
                pincement.current = null;
            }}
            onPointerMove={(event) => {
                const precedent = pointeurs.current.get(event.pointerId);
                if (!precedent || !pose) return;
                const point = dansLeCadre(event.clientX, event.clientY);
                pointeurs.current.set(event.pointerId, point);
                const actifs = [...pointeurs.current.values()];
                if (actifs.length >= 2) {
                    /* Deux doigts : l'échelle suit leur écart, autour de leur milieu, et le
                       milieu qui se déplace fait glisser l'image. */
                    const [a, b] = actifs;
                    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
                    const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                    if (!pincement.current) {
                        pincement.current = { distance, pose, milieu };
                        return;
                    }
                    const depart = pincement.current;
                    const zoomee = zoomerAutour(
                        depart.pose,
                        depart.pose.echelle * (distance / depart.distance),
                        depart.milieu,
                    );
                    setPose({
                        ...zoomee,
                        cx: zoomee.cx - (milieu.x - depart.milieu.x) / zoomee.echelle,
                        cy: zoomee.cy - (milieu.y - depart.milieu.y) / zoomee.echelle,
                    });
                    return;
                }
                setPose({
                    ...pose,
                    cx: pose.cx - (point.x - precedent.x) / pose.echelle,
                    cy: pose.cy - (point.y - precedent.y) / pose.echelle,
                });
            }}
            onPointerUp={(event) => {
                pointeurs.current.delete(event.pointerId);
                pincement.current = null;
            }}
            onPointerCancel={(event) => {
                pointeurs.current.delete(event.pointerId);
                pincement.current = null;
            }}
            onWheel={(event) => {
                if (!pose) return;
                setPose(
                    zoomerAutour(
                        pose,
                        pose.echelle * Math.exp(-event.deltaY * 0.0015),
                        dansLeCadre(event.clientX, event.clientY),
                    ),
                );
            }}
            onDoubleClick={recadrerAutomatiquement}
            className="block w-full cursor-grab touch-none active:cursor-grabbing"
        />
    );

    const reglages = (
        <>
            <Slider
                label="Taille de la signature"
                min={zoomMin}
                max={zoomMax}
                step={0.05}
                stepperStep={0.25}
                steppers
                value={pose ? pose.echelle / echelleDeBase : 1}
                onChange={(zoom) =>
                    pose &&
                    setPose(
                        zoomerAutour(pose, zoom * echelleDeBase, {
                            x: LARGEUR_CADRE / 2,
                            y: HAUTEUR_CADRE / 2,
                        }),
                    )
                }
                valueText={`${(pose ? pose.echelle / echelleDeBase : 1).toFixed(1).replace('.', ',')}×`}
            />

            {/* La consigne pleine largeur, le geste dessous au téléphone ; côte à côte au-delà. */}
            <div className="medium:flex-row medium:items-center medium:justify-between flex flex-col items-start gap-x-4 gap-y-1">
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub flex min-w-0 items-start gap-2">
                    <Icon
                        glyph={HandPointing}
                        size={18}
                        className="text-text-tertiary mt-px shrink-0"
                    />
                    <span>
                        {lue && !lue.encre
                            ? 'Aucun tracé reconnu : cadrez à la main.'
                            : 'Glissez, pincez, ou touchez deux fois pour recadrer.'}{' '}
                        <b className="text-on-surface font-medium">
                            Le cadre garde le tracé, sans le fond.
                        </b>
                    </span>
                </p>
                <Button
                    variant="text"
                    icon={<Icon glyph={MagicWand} size={18} />}
                    onClick={recadrerAutomatiquement}
                    disabled={!lue?.encre}
                    className="text-on-surface -ml-2 shrink-0 px-2"
                >
                    Recadrer automatiquement
                </Button>
            </div>

            {/* `.pfoot` — deux gestes, le second enregistre, détachés par un filet. */}
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
                    disabled={!lue}
                    onClick={enregistrer}
                >
                    Enregistrer
                </Button>
            </div>
        </>
    );

    if (pleinEcran) {
        return (
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Recadrer la signature"
                className="bg-inverse-surface text-inverse-on-surface fixed inset-0 z-[80] flex flex-col"
            >
                <div className="flex h-14 shrink-0 items-center gap-1 px-1 pt-[env(safe-area-inset-top,0px)]">
                    <Button
                        variant="text"
                        iconOnly
                        aria-label="Fermer sans enregistrer"
                        onClick={onAnnuler}
                        className="text-inverse-on-surface hover:bg-white/10"
                    >
                        <Icon glyph={X} size={24} />
                    </Button>
                    <h2 className="font-brand text-ts-head leading-ts-head min-w-0 flex-1 truncate font-semibold">
                        Recadrer la signature
                    </h2>
                </div>
                <div
                    ref={boite}
                    className="bg-inverse-surface text-inverse-on-surface relative min-h-0 flex-1 overflow-hidden"
                >
                    {canevas}
                </div>
                <div className="bg-surface text-on-surface flex shrink-0 flex-col gap-3 rounded-t-xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                    {reglages}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div
                ref={boite}
                className="rounded-card bg-surface-container text-on-surface overflow-hidden"
            >
                {canevas}
            </div>
            {reglages}
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
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub mx-auto max-w-[300px] text-center text-balance">
                    {phrase}
                </p>

                {bloque ? (
                    <p className="text-on-surface text-ts-sub leading-ts-sub mx-auto max-w-[300px] text-center text-balance">
                        Votre informatique peut réinitialiser votre code depuis votre fiche. Vous en
                        poserez alors un nouveau.
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
                                'text-ts-sub leading-ts-sub mt-2 max-w-[300px] text-center',
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
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
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
                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                        {PASSWORD_MIN_LENGTH} caractères minimum ; une phrase vaut mieux qu'un mot
                        compliqué.
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
                    <p className="text-error text-ts-sub leading-ts-sub flex gap-2">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        <span>{error}</span>
                    </p>
                )}

                {/* `.alt` — **les deux secrets ne se confondent pas.** Une personne qui
                    vient de changer « son code » doit repartir en sachant lequel. */}
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub flex items-start gap-2">
                    <Icon glyph={Key} size={18} className="text-text-tertiary mt-px shrink-0" />
                    <span>
                        Votre <b className="text-on-surface font-medium">code PIN</b> ne change pas
                        : il signe, il n'ouvre pas.
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
