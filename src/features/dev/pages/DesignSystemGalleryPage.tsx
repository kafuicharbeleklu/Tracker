import React, { useState } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    ArrowsClockwise,
    CheckCircle,
    Laptop,
    ClockCounterClockwise,
    DotsThreeVertical,
    MagnifyingGlass,
    MapPin,
    Monitor,
    Package,
    Pause,
    Plus,
    ShieldWarning,
    Trash,
    User,
    Wallet,
    Wrench,
} from '@phosphor-icons/react';

import Badge from '../../../components/ui/Badge';
import BottomSheet from '../../../components/ui/BottomSheet';
import BulkActionBar from '../../../components/ui/BulkActionBar';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Chip from '../../../components/ui/Chip';
import CloseButton from '../../../components/ui/CloseButton';
import ConfirmationSheet from '../../../components/ui/ConfirmationSheet';
import { ContextBanner } from '../../../components/ui/ContextBanner';
import DemoBadge from '../../../components/ui/DemoBadge';
import Divider from '../../../components/ui/Divider';
import { EmptyState } from '../../../components/ui/EmptyState';
import { EntityRow } from '../../../components/ui/EntityRow';
import ErrorBoundary from '../../../components/ui/ErrorBoundary';
import { FabContainer } from '../../../components/ui/FabContainer';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import FloatingActionButton from '../../../components/ui/FloatingActionButton';
import Icon from '../../../components/ui/Icon';
import IconButton from '../../../components/ui/IconButton';
import DetailHero from '../../../components/ui/DetailHero';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import ListRow from '../../../components/ui/ListRow';
import ProportionRow from '../../../components/ui/ProportionRow';
import ReferenceRow from '../../../components/ui/ReferenceRow';
import ListTemplate, { type ListFacet } from '../../../components/layout/ListTemplate';
import InlineError from '../../../components/ui/InlineError';
import InputField from '../../../components/ui/InputField';
import ListActionFab from '../../../components/ui/ListActionFab';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Menu from '../../../components/ui/Menu';
import { MetricCard } from '../../../components/ui/MetricCard';
import Modal from '../../../components/ui/Modal';
import MovementTimeline from '../../../components/ui/MovementTimeline';
import NavButton from '../../../components/ui/NavButton';
import { PageTabs } from '../../../components/ui/PageTabs';
import Pagination from '../../../components/ui/Pagination';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import ScreenState from '../../../components/ui/ScreenState';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import SelectField from '../../../components/ui/SelectField';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import SelectionTopBar from '../../../components/ui/SelectionTopBar';
import SideSheet from '../../../components/ui/SideSheet';
import { SkeletonDetail, SkeletonList, SkeletonQueue } from '../../../components/ui/Skeleton';
import Snackbar, { type SnackbarMessage } from '../../../components/ui/Snackbar';
import StatusBadge from '../../../components/ui/StatusBadge';
import TableScrollArea from '../../../components/ui/TableScrollArea';
import { TextArea } from '../../../components/ui/TextArea';
import Toggle from '../../../components/ui/Toggle';
import Tooltip from '../../../components/ui/Tooltip';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import useSelection from '../../../hooks/useSelection';

/**
 * Vitrine vivante du TRACKER DS — route interne `#/dev/design-system`, montée
 * uniquement en développement (voir `App.tsx`).
 *
 * Principe : la galerie n'illustre RIEN. Elle instancie les composants réels de
 * `src/components/ui/**` ; ce qu'elle affiche est donc, par construction, ce que
 * l'application affiche. Une régression d'état se voit ici avant d'atteindre une
 * page métier.
 *
 * Ce qu'on peut y montrer, et ce qu'on ne peut pas : les états pilotés par une
 * prop (repos, sélectionné, désactivé, chargement, erreur) sont rendus côte à
 * côte ; `hover` / `focus-visible` / `pressed` sont des états du POINTEUR et du
 * CLAVIER — ils ne se figent pas dans le balisage. Les blocs concernés portent
 * la mention « à exercer » : survoler, tabuler, maintenir.
 *
 * Contrainte : ce fichier est dans `src/**`, donc soumis à `npm run ds:check`
 * comme le reste — aucune couleur brute, aucun contrôle natif, rayons de
 * l'échelle. La vitrine se plie aux règles qu'elle expose.
 */

/** Ancres de la galerie. `id` sert d'ancre HTML : pas d'espace ni de ponctuation. */
const SECTIONS = [
    { id: 'fondations', label: 'Fondations' },
    { id: 'actions', label: 'Actions' },
    { id: 'saisie', label: 'Champs de saisie' },
    { id: 'selection', label: 'Sélection & navigation' },
    { id: 'surfaces', label: 'Surfaces & données' },
    { id: 'retroaction', label: 'Rétroaction & états' },
    { id: 'superpositions', label: 'Superpositions' },
] as const;

interface SectionProps {
    id: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, description, children }) => (
    <section id={id} className="scroll-mt-24">
        <div className="mb-4">
            <h2 className="text-headline-small text-on-surface">{title}</h2>
            {description && (
                <p className="text-body-medium text-on-surface-variant mt-1">{description}</p>
            )}
        </div>
        <div className="space-y-6">{children}</div>
    </section>
);

interface SpecimenProps {
    /** Nom du composant, tel qu'il s'importe. */
    name: string;
    /** Ce que le bloc démontre (états couverts). */
    note?: string;
    /** États non figeables dans le balisage : survol, focus clavier, appui. */
    interactive?: boolean;
    children: React.ReactNode;
}

const Specimen: React.FC<SpecimenProps> = ({ name, note, interactive, children }) => (
    <div className="border-outline-variant bg-surface shadow-elevation-1 overflow-hidden rounded-xl border">
        <div className="border-outline-variant bg-surface-container flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
            <p className="text-label-large text-on-surface">{name}</p>
            <div className="flex items-center gap-2">
                {interactive && <Badge variant="info">à exercer : survol / tab / appui</Badge>}
                {note && <p className="text-label-small text-on-surface-variant">{note}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

/** Rangée d'états : chaque échantillon reçoit l'étiquette de l'état qu'il incarne. */
const StateRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">{children}</div>
);

const StateCell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex min-w-0 flex-col gap-2">
        <span className="text-label-small text-on-surface-variant tracking-wide uppercase">
            {label}
        </span>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
);

/** Surface sombre : les variantes `nav` n'ont de sens que posées dessus. */
const DarkStage: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => <div className={`bg-inverse-surface rounded-lg p-4 ${className ?? ''}`}>{children}</div>;

/** Enfant qui lève une exception de rendu à la demande — démonstration d'ErrorBoundary. */
const Bomb: React.FC<{ armed: boolean }> = ({ armed }) => {
    if (armed) {
        throw new Error('Exception de rendu déclenchée depuis la galerie du design system.');
    }
    return (
        <p className="text-body-medium text-on-surface-variant">
            Composant sain. Amorcez la charge pour voir le repli du boundary.
        </p>
    );
};

const TIMELINE_ITEMS = [
    {
        id: 'mv-1',
        timestamp: '2026-07-24T09:12:00',
        title: 'Attribution à Awa Koffi',
        actor: 'Marc Adjovi',
        meta: 'Siège — 2e étage',
        icon: 'assignment_ind',
    },
    {
        id: 'mv-2',
        timestamp: '2026-07-18T16:40:00',
        title: 'Retour matériel enregistré',
        actor: 'Awa Koffi',
        meta: 'État : bon',
        icon: 'assignment_return',
    },
];

const TABLE_ROWS = [
    {
        serial: 'NB-2291',
        model: 'Latitude 5440',
        category: 'Ordinateur portable',
        site: 'Lomé — Siège',
        owner: 'Awa Koffi',
        status: 'Attribué',
    },
    {
        serial: 'NB-2292',
        model: 'ThinkPad T14',
        category: 'Ordinateur portable',
        site: 'Kara — Agence',
        owner: '—',
        status: 'Disponible',
    },
    {
        serial: 'NB-2293',
        model: 'ProBook 450',
        category: 'Ordinateur portable',
        site: 'Lomé — Entrepôt',
        owner: '—',
        status: 'En réparation',
    },
];

/** Liste de démonstration du gabarit — planches 04.1 et 00.4. */
const LIST_FACETS: ListFacet[] = [
    { id: 'tous', label: 'Tous', count: 14 },
    { id: 'dispo', label: 'Disponibles', count: 5, icon: CheckCircle, tone: 'positive' },
    { id: 'attr', label: 'Attribués', count: 7, icon: ArrowCircleRight, tone: 'info' },
    { id: 'repar', label: 'En réparation', count: 2, icon: Wrench, tone: 'attention' },
];

const LIST_ROWS = [
    {
        id: 'r1',
        code: 'LPT-HQ-01',
        model: 'Latitude 5540',
        glyph: Laptop,
        holder: 'Bureau Paris',
        date: 'il y a 40 min',
        status: { icon: CheckCircle, label: 'disponible', tone: 'positive' as const },
    },
    {
        id: 'r2',
        code: 'MBP-SALES-01',
        model: 'MacBook Pro 14',
        glyph: Laptop,
        holder: 'Claire Martin · Bureau Paris',
        date: 'il y a 2 h',
        status: { icon: ArrowCircleRight, label: 'attribué', tone: 'info' as const },
    },
    {
        id: 'r3',
        code: 'SCR-DK-01',
        model: 'Dell U2722DE',
        glyph: Monitor,
        holder: 'atelier · Campus Dakar',
        date: 'hier',
        status: { icon: Wrench, label: 'en réparation', tone: 'attention' as const },
    },
];

/** File de démonstration du mode sélection — planche 17.2. */
const QUEUE_ROWS = [
    {
        id: 'q1',
        initials: 'KA',
        title: 'Kossi Adjovi — Latitude 7420',
        subtitle: 'Validation du manager',
        age: '6 j',
    },
    {
        id: 'q2',
        initials: 'AS',
        title: 'Amina Sow — Souris MX',
        subtitle: 'Retour à réceptionner',
        age: '3 j',
    },
    {
        id: 'q3',
        initials: 'YT',
        title: 'Yao Tetteh — EliteDisplay E243',
        subtitle: 'Dotation à valider',
        age: '2 j',
    },
    {
        id: 'q4',
        initials: 'MB',
        title: 'Mariam Bah — ThinkPad T14',
        subtitle: 'Confirmation utilisateur',
        age: '1 j',
    },
];

/** Lectures de démonstration du canevas de scan — planche 17.3. */
const SCAN_HITS: ScanHit[] = [
    { id: 's1', code: 'ASSET-30117', detail: 'Écran Dell U2722 · local B2', kind: 'expected' },
    { id: 's2', code: 'ASSET-29840', detail: 'Hors campagne — à rattacher', kind: 'exception' },
    { id: 's3', code: 'ASSET-30044', detail: 'Latitude 5540 · local B2', kind: 'expected' },
];

const DesignSystemGalleryPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('fondations');

    // --- États pilotés par la galerie -------------------------------------------
    const [tab, setTab] = useState('etats');
    const [segment, setSegment] = useState('liste');
    const [multiSegment, setMultiSegment] = useState<string[]>(['actifs']);
    const [filterChip, setFilterChip] = useState(true);
    const [toggleOn, setToggleOn] = useState(true);
    const [select, setSelect] = useState('portable');
    const [selectFilter, setSelectFilter] = useState('tous');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(2);
    const [iconToggle, setIconToggle] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [armed, setArmed] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sideSheetOpen, setSideSheetOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTone, setConfirmTone] = useState<'destructive' | 'neutral'>('destructive');
    const [snacks, setSnacks] = useState<SnackbarMessage[]>([]);

    // Étape 1 du portage — les trois composants transverses (planches 17.1/17.2/17.3).
    const selection = useSelection();
    const [scanMode, setScanMode] = useState<'simple' | 'batch'>('simple');
    const [scanOpen, setScanOpen] = useState(false);
    const [listSearch, setListSearch] = useState('');
    const [listFacet, setListFacet] = useState('tous');

    const pushSnack = (message: SnackbarMessage) => setSnacks((queue) => [...queue, message]);
    const dismissSnack = (id: string) =>
        setSnacks((queue) => queue.filter((item) => item.id !== id));

    return (
        <div className="bg-background text-on-surface min-h-dvh">
            {/* En-tête */}
            <header className="border-outline-variant bg-surface/95 sticky top-0 z-40 border-b backdrop-blur-sm">
                <div className="px-page-sm medium:px-page mx-auto flex max-w-[1200px] flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-headline-medium text-on-surface">Tracker DS</h1>
                                <Badge variant="neutral">v1</Badge>
                                <DemoBadge
                                    label="dev"
                                    title="Route montée uniquement en développement"
                                />
                            </div>
                            <p className="text-body-medium text-on-surface-variant mt-1">
                                Galerie vivante des primitives — instances réelles de{' '}
                                <code>src/components/ui</code>.
                            </p>
                        </div>
                        <Button
                            variant="outlined"
                            icon={<MaterialIcon name="arrow_back" size={18} />}
                            onClick={() => {
                                window.location.hash = '/dashboard';
                            }}
                        >
                            Retour à l’application
                        </Button>
                    </div>

                    <nav aria-label="Sections de la galerie" className="flex flex-wrap gap-2">
                        {SECTIONS.map((section) => (
                            <Chip
                                key={section.id}
                                label={section.label}
                                variant="filter"
                                selected={activeSection === section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    document
                                        .getElementById(section.id)
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            />
                        ))}
                    </nav>
                </div>
            </header>

            <main className="px-page-sm medium:px-page mx-auto max-w-[1200px] space-y-12 py-8">
                {/* ------------------------------------------------------------------ */}
                <Section
                    id="fondations"
                    title="Fondations"
                    description="Rôles de couleur, rayons et élévations résolus par le pont Tailwind sur la couche sémantique --tk-*."
                >
                    <Specimen name="Icon" note="Phosphor — I1/I2/I3 du registre §0">
                        <StateRow>
                            <StateCell label="32 — état vide, une fois par écran">
                                <Icon glyph={Package} size={32} />
                            </StateCell>
                            <StateCell label="24 — barres du haut et du bas">
                                <Icon glyph={MagnifyingGlass} />
                            </StateCell>
                            <StateCell label="20 — rangée, geste, chevron">
                                <Icon glyph={Laptop} size={20} />
                            </StateCell>
                            <StateCell label="18 — en ligne dans un texte de 13">
                                <Icon glyph={User} size={18} />
                            </StateCell>
                            <StateCell label="fill — actif ou acquis, et rien d’autre">
                                <Icon glyph={CheckCircle} size={24} emphasis="fill" />
                            </StateCell>
                        </StateRow>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            Quatre tailles, deux graisses : <code>thin</code>, <code>bold</code>,{' '}
                            <code>duotone</code> et les tailles 26/28/40/56 relevées dans le code
                            sont hors d’atteinte par le type. L’icône est toujours
                            <code> aria-hidden</code> — I3 veut le mot à côté, et le nom accessible
                            appartient au contrôle qui la porte. Les 72 fichiers en{' '}
                            <code>MaterialIcon</code> migrent à l’étape 4.
                        </p>
                    </Specimen>

                    <Specimen name="Rôles de couleur" note="tier 2 — sémantique">
                        <div className="medium:grid-cols-4 expanded:grid-cols-6 grid grid-cols-2 gap-3">
                            {[
                                { name: 'primary', box: 'bg-primary', text: 'text-on-primary' },
                                {
                                    name: 'primary-container',
                                    box: 'bg-primary-container',
                                    text: 'text-on-primary-container',
                                },
                                {
                                    name: 'secondary-container',
                                    box: 'bg-secondary-container',
                                    text: 'text-on-secondary-container',
                                },
                                {
                                    name: 'tertiary-container',
                                    box: 'bg-tertiary-container',
                                    text: 'text-on-tertiary-container',
                                },
                                { name: 'error', box: 'bg-error', text: 'text-on-error' },
                                {
                                    name: 'error-container',
                                    box: 'bg-error-container',
                                    text: 'text-on-error-container',
                                },
                                {
                                    name: 'surface',
                                    box: 'bg-surface border border-outline-variant',
                                    text: 'text-on-surface',
                                },
                                {
                                    name: 'surface-container',
                                    box: 'bg-surface-container',
                                    text: 'text-on-surface',
                                },
                                {
                                    name: 'surface-container-high',
                                    box: 'bg-surface-container-high',
                                    text: 'text-on-surface',
                                },
                                {
                                    name: 'inverse-surface',
                                    box: 'bg-inverse-surface',
                                    text: 'text-inverse-on-surface',
                                },
                                {
                                    name: 'neutral-fill',
                                    box: 'bg-neutral-fill',
                                    text: 'text-inverse-on-surface',
                                },
                                {
                                    name: 'focus-ring',
                                    box: 'bg-focus-ring',
                                    text: 'text-inverse-on-surface',
                                },
                            ].map((role) => (
                                <div key={role.name} className="min-w-0">
                                    <div
                                        className={`flex h-16 items-end rounded-lg p-2 ${role.box}`}
                                    >
                                        <span className={`text-label-small ${role.text}`}>Aa</span>
                                    </div>
                                    <p className="text-label-small text-on-surface-variant mt-1 truncate">
                                        {role.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Specimen>

                    <Specimen
                        name="Tons sémantiques"
                        note="Badge / StatusBadge — paire fond clair + texte fort"
                    >
                        <StateRow>
                            <StateCell label="success">
                                <Badge variant="success">Succès</Badge>
                            </StateCell>
                            <StateCell label="warning">
                                <Badge variant="warning">Attention</Badge>
                            </StateCell>
                            <StateCell label="danger">
                                <Badge variant="danger">Danger</Badge>
                            </StateCell>
                            <StateCell label="info">
                                <Badge variant="info">Info</Badge>
                            </StateCell>
                            <StateCell label="neutral">
                                <Badge variant="neutral">Neutre</Badge>
                            </StateCell>
                            <StateCell label="default">
                                <Badge>Défaut</Badge>
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="Échelle de rayons"
                        note="2 / 4 / 8 / full — toute autre valeur est bloquée par ds:check"
                    >
                        <StateRow>
                            {[
                                'rounded-xs',
                                'rounded-sm',
                                'rounded-md',
                                'rounded-lg',
                                'rounded-xl',
                                'rounded-full',
                            ].map((radius) => (
                                <StateCell key={radius} label={radius}>
                                    <div
                                        className={`bg-surface-container-highest h-12 w-12 ${radius}`}
                                    />
                                </StateCell>
                            ))}
                        </StateRow>
                    </Specimen>

                    <Specimen name="Élévations">
                        <StateRow>
                            {[
                                'shadow-elevation-0',
                                'shadow-elevation-1',
                                'shadow-elevation-2',
                                'shadow-elevation-3',
                                'shadow-elevation-4',
                                'shadow-elevation-5',
                            ].map((elevation) => (
                                <StateCell key={elevation} label={elevation.replace('shadow-', '')}>
                                    <div
                                        className={`bg-surface h-12 w-16 rounded-lg ${elevation}`}
                                    />
                                </StateCell>
                            ))}
                        </StateRow>
                    </Specimen>

                    <Specimen name="MaterialIcon">
                        <StateRow>
                            <StateCell label="16 / 18 / 24 / 32">
                                <MaterialIcon name="inventory_2" size={16} />
                                <MaterialIcon name="inventory_2" size={18} />
                                <MaterialIcon name="inventory_2" size={24} />
                                <MaterialIcon name="inventory_2" size={32} />
                            </StateCell>
                            <StateCell label="filled">
                                <MaterialIcon name="inventory_2" size={24} filled />
                            </StateCell>
                            <StateCell label="weight 700">
                                <MaterialIcon name="inventory_2" size={24} weight={700} />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen name="Divider">
                        <div className="space-y-4">
                            <Divider />
                            <Divider variant="inset" />
                            <Divider variant="middle" />
                            <div className="flex h-10 items-center gap-4">
                                <span className="text-body-small text-on-surface-variant">
                                    vertical
                                </span>
                                <Divider vertical />
                                <span className="text-body-small text-on-surface-variant">
                                    séparés
                                </span>
                            </div>
                        </div>
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="actions"
                    title="Actions"
                    description="Boutons et actions d'icône. Cible tactile portée à 48 px par l'utilitaire touch-target, sans effet visuel sur pointeur fin."
                >
                    <Specimen name="Button — variantes" interactive>
                        <StateRow>
                            <StateCell label="filled">
                                <Button>Enregistrer</Button>
                            </StateCell>
                            <StateCell label="tonal">
                                <Button variant="tonal">Attribuer</Button>
                            </StateCell>
                            <StateCell label="outlined">
                                <Button variant="outlined">Annuler</Button>
                            </StateCell>
                            <StateCell label="text">
                                <Button variant="text">Ignorer</Button>
                            </StateCell>
                            <StateCell label="elevated">
                                <Button variant="elevated">Exporter</Button>
                            </StateCell>
                            <StateCell label="danger">
                                <Button variant="danger">Supprimer</Button>
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen name="Button — tailles, icône, disposition">
                        <StateRow>
                            <StateCell label="sm">
                                <Button size="sm">Petit</Button>
                            </StateCell>
                            <StateCell label="md">
                                <Button size="md">Moyen</Button>
                            </StateCell>
                            <StateCell label="lg">
                                <Button size="lg">Grand</Button>
                            </StateCell>
                            <StateCell label="icône">
                                <Button icon={<MaterialIcon name="add" />}>
                                    Ajouter un équipement
                                </Button>
                            </StateCell>
                            <StateCell label="iconOnly">
                                <Button
                                    iconOnly
                                    aria-label="Ajouter"
                                    icon={<MaterialIcon name="add" />}
                                />
                            </StateCell>
                        </StateRow>
                        <div className="mt-4">
                            <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                layout=&quot;card&quot;
                            </p>
                            <Button variant="outlined" layout="card" className="w-full p-4">
                                <span className="flex flex-col gap-1">
                                    <span className="text-title-small text-on-surface">
                                        Tuile de choix
                                    </span>
                                    <span className="text-body-small text-on-surface-variant">
                                        Hauteur libre, contenu aligné à gauche.
                                    </span>
                                </span>
                            </Button>
                        </div>
                    </Specimen>

                    <Specimen name="Button — états" note="loading force aussi disabled + aria-busy">
                        <StateRow>
                            <StateCell label="repos">
                                <Button>Valider</Button>
                            </StateCell>
                            <StateCell label="chargement">
                                <Button loading>Valider</Button>
                            </StateCell>
                            <StateCell label="chargement (icône seule)">
                                <Button
                                    loading
                                    iconOnly
                                    loadingLabel="Envoi en cours"
                                    aria-label="Envoyer"
                                />
                            </StateCell>
                            <StateCell label="désactivé">
                                <Button disabled>Valider</Button>
                            </StateCell>
                            <StateCell label="désactivé (outlined)">
                                <Button variant="outlined" disabled>
                                    Annuler
                                </Button>
                            </StateCell>
                            <StateCell label="désactivé (danger)">
                                <Button variant="danger" disabled>
                                    Supprimer
                                </Button>
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="Button — variante nav"
                        note="posée sur surface SOMBRE : anneau de focus primary"
                    >
                        <DarkStage>
                            <StateRow>
                                <StateCell label="repos">
                                    <Button variant="nav">Tableau de bord</Button>
                                </StateCell>
                                <StateCell label="désactivé">
                                    <Button variant="nav" disabled>
                                        Rapports
                                    </Button>
                                </StateCell>
                            </StateRow>
                        </DarkStage>
                    </Specimen>

                    <Specimen name="IconButton" interactive note="aria-label obligatoire (type TS)">
                        <StateRow>
                            <StateCell label="standard">
                                <IconButton icon="edit" aria-label="Modifier" />
                            </StateCell>
                            <StateCell label="filled">
                                <IconButton icon="edit" variant="filled" aria-label="Modifier" />
                            </StateCell>
                            <StateCell label="tonal">
                                <IconButton icon="edit" variant="tonal" aria-label="Modifier" />
                            </StateCell>
                            <StateCell label="outlined">
                                <IconButton icon="edit" variant="outlined" aria-label="Modifier" />
                            </StateCell>
                            <StateCell label="sélectionné (toggle)">
                                <IconButton
                                    icon="star"
                                    variant="standard"
                                    selected={iconToggle}
                                    filled
                                    aria-label="Mettre en favori"
                                    aria-pressed={iconToggle}
                                    onClick={() => setIconToggle((value) => !value)}
                                />
                            </StateCell>
                            <StateCell label="désactivé">
                                <IconButton icon="delete" aria-label="Supprimer" disabled />
                            </StateCell>
                            <StateCell label="density=dense">
                                <IconButton icon="close" density="dense" aria-label="Effacer" />
                            </StateCell>
                        </StateRow>
                        <div className="mt-4">
                            <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                variant=&quot;nav&quot;
                            </p>
                            <DarkStage>
                                <div className="flex gap-2">
                                    <IconButton
                                        icon="menu"
                                        variant="nav"
                                        aria-label="Ouvrir le menu"
                                    />
                                    <IconButton
                                        icon="settings"
                                        variant="nav"
                                        selected
                                        aria-label="Paramètres"
                                    />
                                </div>
                            </DarkStage>
                        </div>
                    </Specimen>

                    <Specimen
                        name="CloseButton"
                        note="Button variant=text + iconOnly, aria-label « Fermer » figé"
                    >
                        <StateRow>
                            <StateCell label="repos">
                                <CloseButton onClick={() => undefined} />
                            </StateCell>
                            <StateCell label="désactivé">
                                <CloseButton disabled onClick={() => undefined} />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="FloatingActionButton"
                        interactive
                        note="état désactivé ajouté en v1"
                    >
                        <StateRow>
                            <StateCell label="primary / medium">
                                <FloatingActionButton icon="add" aria-label="Ajouter" />
                            </StateCell>
                            <StateCell label="secondary">
                                <FloatingActionButton
                                    icon="edit"
                                    variant="secondary"
                                    aria-label="Modifier"
                                />
                            </StateCell>
                            <StateCell label="tertiary">
                                <FloatingActionButton
                                    icon="check"
                                    variant="tertiary"
                                    aria-label="Valider"
                                />
                            </StateCell>
                            <StateCell label="surface">
                                <FloatingActionButton
                                    icon="more_horiz"
                                    variant="surface"
                                    aria-label="Plus"
                                />
                            </StateCell>
                            <StateCell label="small">
                                <FloatingActionButton
                                    icon="add"
                                    size="small"
                                    aria-label="Ajouter"
                                />
                            </StateCell>
                            <StateCell label="étendu">
                                <FloatingActionButton
                                    icon="add"
                                    label="Nouvelle demande"
                                    aria-label="Nouvelle demande"
                                />
                            </StateCell>
                            <StateCell label="lowered">
                                <FloatingActionButton icon="add" lowered aria-label="Ajouter" />
                            </StateCell>
                            <StateCell label="désactivé">
                                <FloatingActionButton icon="add" disabled aria-label="Ajouter" />
                            </StateCell>
                        </StateRow>
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="saisie"
                    title="Champs de saisie"
                    description="Libellé lié par htmlFor/useId, message d'erreur en role=alert lié par aria-describedby, aria-invalid porté par le champ."
                >
                    <Specimen name="InputField" interactive>
                        <div className="medium:grid-cols-2 grid gap-5">
                            <InputField label="Repos" placeholder="Ex : NB-2291" />
                            <InputField
                                label="Avec icône"
                                icon={<MaterialIcon name="search" size={20} />}
                                placeholder="Rechercher"
                            />
                            <InputField label="Requis" required placeholder="Numéro de série" />
                            <InputField
                                label="Texte d’aide"
                                supportingText="Format attendu : NB-0000."
                                placeholder="NB-0000"
                            />
                            <InputField
                                label="Erreur"
                                error="Ce champ est requis"
                                defaultValue=""
                            />
                            <InputField label="Désactivé" disabled defaultValue="Valeur figée" />
                            <InputField
                                label="Mot de passe"
                                isPassword
                                placeholder="Votre mot de passe"
                            />
                            <InputField
                                label="Compteur"
                                maxLength={40}
                                showCharacterCount
                                placeholder="Commentaire court"
                            />
                            <InputField
                                label="Préfixe / suffixe"
                                prefix="FCFA"
                                suffix="TTC"
                                placeholder="0"
                            />
                            <InputField
                                label="Variante outlined"
                                variant="outlined"
                                placeholder="Bordure haute"
                            />
                        </div>
                    </Specimen>

                    <Specimen name="TextArea">
                        <div className="medium:grid-cols-2 grid gap-5">
                            <TextArea label="Repos" placeholder="Motif de la demande" />
                            <TextArea label="Erreur" error="Le motif est obligatoire" />
                            <TextArea
                                label="Compteur"
                                maxLength={120}
                                showCharacterCount
                                placeholder="120 caractères max"
                            />
                            <TextArea label="Désactivé" disabled defaultValue="Non modifiable" />
                        </div>
                    </Specimen>

                    <Specimen
                        name="SelectField"
                        note="role=combobox + listbox, navigation clavier complète"
                        interactive
                    >
                        <div className="medium:grid-cols-2 grid gap-5">
                            <SelectField
                                label="Repos"
                                name="ds-select"
                                value={select}
                                onChange={(event) => setSelect(event.target.value)}
                                options={[
                                    { value: 'portable', label: 'Ordinateur portable' },
                                    { value: 'fixe', label: 'Ordinateur fixe' },
                                    { value: 'imprimante', label: 'Imprimante' },
                                ]}
                            />
                            <SelectField
                                label="Erreur"
                                name="ds-select-error"
                                value=""
                                onChange={() => undefined}
                                error="Sélectionnez une catégorie"
                                options={[{ value: 'a', label: 'Option A' }]}
                            />
                            <SelectField
                                label="Désactivé"
                                name="ds-select-disabled"
                                value="portable"
                                onChange={() => undefined}
                                disabled
                                options={[{ value: 'portable', label: 'Ordinateur portable' }]}
                            />
                            <SelectField
                                label="Aucune option"
                                name="ds-select-empty"
                                value=""
                                onChange={() => undefined}
                                options={[]}
                            />
                        </div>
                    </Specimen>

                    <Specimen
                        name="Toggle"
                        note="état de focus clavier ajouté en v1 (relais peer-focus-visible)"
                        interactive
                    >
                        <StateRow>
                            <StateCell label="activé">
                                <Toggle
                                    checked={toggleOn}
                                    onChange={setToggleOn}
                                    label="Notifications"
                                />
                            </StateCell>
                            <StateCell label="désactivé (off)">
                                <Toggle
                                    checked={false}
                                    onChange={() => undefined}
                                    label="Mode sombre"
                                />
                            </StateCell>
                            <StateCell label="avec icône">
                                <Toggle
                                    checked={toggleOn}
                                    onChange={setToggleOn}
                                    icon="check"
                                    label="Avec glyphe"
                                />
                            </StateCell>
                            <StateCell label="inactif">
                                <Toggle
                                    checked
                                    disabled
                                    onChange={() => undefined}
                                    label="Verrouillé"
                                />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="FileDropzone"
                        note="zone focalisable au clavier depuis la v1 (Entrée / Espace)"
                        interactive
                    >
                        <div className="space-y-4">
                            <FileDropzone
                                onFileSelect={() => undefined}
                                isProcessing={processing}
                            />
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={() => setProcessing((value) => !value)}
                            >
                                {processing
                                    ? 'Arrêter le traitement simulé'
                                    : 'Simuler le traitement'}
                            </Button>
                        </div>
                    </Specimen>

                    <Specimen
                        name="SearchFilterBar"
                        note="anneau de focus ajouté en v1"
                        interactive
                    >
                        <div className="space-y-4">
                            <SearchFilterBar
                                searchValue={search}
                                onSearchChange={setSearch}
                                placeholder="Rechercher un équipement"
                            />
                            <SearchFilterBar
                                searchValue={search}
                                onSearchChange={setSearch}
                                resultCount={128}
                                onFilterClick={() => undefined}
                                placeholder="Avec compteur et filtre"
                            />
                        </div>
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="selection"
                    title="Sélection & navigation"
                    description="Deux familles distinctes : PageTabs change de VUE (ARIA tablist), SegmentedButton change un PARAMÈTRE de la vue courante (group + aria-pressed)."
                >
                    <Specimen
                        name="SelectionTopBar + ListRow (sélection) + BulkActionBar"
                        note="planche 17.2 — 20 emplois, 4 écrans"
                        interactive
                    >
                        <div className="border-outline-variant overflow-hidden rounded-lg border">
                            {selection.isActive ? (
                                <SelectionTopBar
                                    count={selection.count}
                                    total={QUEUE_ROWS.length}
                                    onExit={selection.exit}
                                    onSelectAll={() =>
                                        selection.selectAll(QUEUE_ROWS.map((row) => row.id))
                                    }
                                    onClearAll={selection.clear}
                                />
                            ) : (
                                <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-2 border-b px-2">
                                    <span className="text-title-small text-on-surface flex-1 px-2">
                                        Tâches
                                    </span>
                                    <Button
                                        variant="text"
                                        size="sm"
                                        onClick={() => selection.enter()}
                                    >
                                        Sélectionner
                                    </Button>
                                </div>
                            )}

                            <div className="bg-surface px-4">
                                {QUEUE_ROWS.map((row) => (
                                    <ListRow
                                        key={row.id}
                                        vignette={
                                            <span className="font-brand text-body-large font-semibold">
                                                {row.initials}
                                            </span>
                                        }
                                        title={row.title}
                                        holder={row.subtitle}
                                        reference={row.age}
                                        selectionActive={selection.isActive}
                                        selected={selection.isSelected(row.id)}
                                        onToggle={() => selection.toggle(row.id)}
                                        onLongPress={() => selection.enter(row.id)}
                                        onOpen={() => undefined}
                                    />
                                ))}
                            </div>

                            <BulkActionBar
                                count={selection.count}
                                overflow={
                                    <Button
                                        variant="tonal"
                                        iconOnly
                                        aria-label="Autres actes sur la sélection"
                                    >
                                        <Icon glyph={ArrowsClockwise} size={20} />
                                    </Button>
                                }
                            >
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={CheckCircle} size={18} />}
                                >
                                    {selection.count > 1
                                        ? `Valider les ${selection.count}`
                                        : 'Valider'}
                                </Button>
                            </BulkActionBar>
                        </div>

                        <p className="text-body-small text-on-surface-variant mt-4">
                            Deux entrées, dont une écrite (S2) : l’appui long sur une rangée, et le
                            bouton « Sélectionner ».{' '}
                            <strong className="text-on-surface font-medium">
                                S1 est portée par le composant
                            </strong>{' '}
                            — à sélection vide, le pied d’actions n’existe pas ; il n’est pas grisé.
                            La case prend la place de la vignette au pixel : le texte ne bouge pas
                            d’un point.
                        </p>
                    </Specimen>

                    <Specimen
                        name="PageTabs"
                        note="tablist ARIA, flèches ←/→, feuille « toutes les vues » en cas de débordement"
                        interactive
                    >
                        <PageTabs
                            activeId={tab}
                            onChange={setTab}
                            idBase="ds-gallery"
                            items={[
                                {
                                    id: 'etats',
                                    label: 'Matrice d’états',
                                    shortLabel: 'États',
                                    icon: <MaterialIcon name="grid_view" />,
                                },
                                {
                                    id: 'patterns',
                                    label: 'Patterns officiels',
                                    shortLabel: 'Patterns',
                                    icon: <MaterialIcon name="dashboard" />,
                                    badge: 4,
                                },
                                {
                                    id: 'contenu',
                                    label: 'Contenu',
                                    icon: <MaterialIcon name="translate" />,
                                },
                                {
                                    id: 'gouvernance',
                                    label: 'Gouvernance',
                                    icon: <MaterialIcon name="policy" />,
                                    badge: '!',
                                },
                            ]}
                        />
                    </Specimen>

                    <Specimen name="SegmentedButton" interactive>
                        <StateRow>
                            <StateCell label="sélection unique">
                                <SegmentedButton
                                    value={segment}
                                    onChange={(value) => setSegment(value as string)}
                                    options={[
                                        { value: 'liste', label: 'Liste', icon: 'list' },
                                        { value: 'grille', label: 'Grille', icon: 'grid_view' },
                                    ]}
                                />
                            </StateCell>
                            <StateCell label="sélection multiple">
                                <SegmentedButton
                                    multiSelect
                                    value={multiSegment}
                                    onChange={(value) => setMultiSegment(value as string[])}
                                    options={[
                                        { value: 'actifs', label: 'Actifs' },
                                        { value: 'retires', label: 'Retirés' },
                                    ]}
                                />
                            </StateCell>
                            <StateCell label="density=compact">
                                <SegmentedButton
                                    density="compact"
                                    value={segment}
                                    onChange={(value) => setSegment(value as string)}
                                    options={[
                                        { value: 'liste', label: 'Liste' },
                                        { value: 'grille', label: 'Grille' },
                                    ]}
                                />
                            </StateCell>
                            <StateCell label="désactivé">
                                <SegmentedButton
                                    disabled
                                    value="liste"
                                    onChange={() => undefined}
                                    options={[
                                        { value: 'liste', label: 'Liste' },
                                        { value: 'grille', label: 'Grille' },
                                    ]}
                                />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="Chip"
                        note="état pressé ajouté en v1 ; le survol du chip sélectionné ne s’applique plus s’il est désactivé"
                        interactive
                    >
                        <StateRow>
                            <StateCell label="assist">
                                <Chip
                                    label="Assistance"
                                    leadingIcon="help"
                                    onClick={() => undefined}
                                />
                            </StateCell>
                            <StateCell label="filter (repos)">
                                <Chip
                                    label="Disponibles"
                                    variant="filter"
                                    selected={false}
                                    onClick={() => setFilterChip(true)}
                                />
                            </StateCell>
                            <StateCell label="filter (sélectionné)">
                                <Chip
                                    label="Disponibles"
                                    variant="filter"
                                    selected={filterChip}
                                    onClick={() => setFilterChip((value) => !value)}
                                />
                            </StateCell>
                            <StateCell label="input">
                                <Chip label="Lomé" variant="input" onClose={() => undefined} />
                            </StateCell>
                            <StateCell label="suggestion">
                                <Chip
                                    label="Suggestion"
                                    variant="suggestion"
                                    onClick={() => undefined}
                                />
                            </StateCell>
                            <StateCell label="désactivé">
                                <Chip label="Indisponible" disabled onClick={() => undefined} />
                            </StateCell>
                            <StateCell label="sélectionné + désactivé">
                                <Chip label="Verrouillé" variant="filter" selected disabled />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen name="SelectFilter" note="déclencheur de barre d’outils" interactive>
                        <SelectFilter
                            label="Statut"
                            value={selectFilter}
                            onChange={setSelectFilter}
                            options={[
                                { value: 'tous', label: 'Tous les statuts' },
                                { value: 'disponible', label: 'Disponible' },
                                { value: 'attribue', label: 'Attribué' },
                            ]}
                        />
                    </Specimen>

                    <Specimen
                        name="NavButton"
                        note="primitive autonome — trois surfaces d’accueil"
                        interactive
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                    surface=&quot;bar&quot; (fond clair)
                                </p>
                                <div className="border-outline-variant bg-surface flex h-[68px] items-stretch gap-1 rounded-lg border px-2">
                                    <NavButton surface="bar" active>
                                        <MaterialIcon name="home" size={24} filled />
                                        <span>Accueil</span>
                                    </NavButton>
                                    <NavButton surface="bar">
                                        <MaterialIcon name="inventory_2" size={24} />
                                        <span>Actifs</span>
                                    </NavButton>
                                </div>
                            </div>
                            <div>
                                <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                    surface=&quot;rail&quot; / &quot;drawer&quot; (fond sombre)
                                </p>
                                <DarkStage>
                                    <div className="flex items-start gap-6">
                                        <div className="flex flex-col gap-1">
                                            <NavButton surface="rail" active>
                                                <MaterialIcon name="home" size={24} filled />
                                                <span>Accueil</span>
                                            </NavButton>
                                            <NavButton surface="rail">
                                                <MaterialIcon name="inventory_2" size={24} />
                                                <span>Actifs</span>
                                            </NavButton>
                                            <NavButton surface="rail" dense>
                                                <MaterialIcon name="settings" size={20} />
                                            </NavButton>
                                        </div>
                                        <div className="flex w-56 flex-col gap-1">
                                            <NavButton surface="drawer" active>
                                                <MaterialIcon name="home" size={20} filled />
                                                <span className="ml-2">Tableau de bord</span>
                                            </NavButton>
                                            <NavButton surface="drawer">
                                                <MaterialIcon name="groups" size={20} />
                                                <span className="ml-2">Équipe</span>
                                            </NavButton>
                                            <NavButton surface="drawer" disabled>
                                                <MaterialIcon name="lock" size={20} />
                                                <span className="ml-2">Réservé</span>
                                            </NavButton>
                                        </div>
                                    </div>
                                </DarkStage>
                            </div>
                        </div>
                    </Specimen>

                    <Specimen
                        name="Pagination"
                        note="anneau de focus et état pressé ajoutés en v1"
                        interactive
                    >
                        <Pagination currentPage={page} totalPages={7} onPageChange={setPage} />
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="surfaces"
                    title="Surfaces & données"
                    description="Le continuum Card / MetricCard / EntityRow : surface générique, tuile de stat, rangée d'entité."
                >
                    <Specimen
                        name="DetailTemplate + DetailHero + ReferenceRow + ProportionRow"
                        note="gabarit fiche — planche 04.2, régime §2.43"
                        interactive
                    >
                        <div className="border-outline-variant bg-background overflow-hidden rounded-lg border">
                            <DetailTemplate
                                code="LPT-HQ-01"
                                reference="ASSET-10001"
                                onBack={() => undefined}
                                menu={
                                    <Button variant="text" iconOnly aria-label="Autres actions">
                                        <Icon glyph={DotsThreeVertical} />
                                    </Button>
                                }
                                hero={
                                    <DetailHero
                                        status={{
                                            icon: ArrowCircleRight,
                                            label: 'Attribué',
                                            tone: 'info',
                                        }}
                                        label="Ordinateur portable"
                                        subject="Dell Latitude 7420"
                                        metrics={[
                                            { value: '2,4 ans', label: 'au parc' },
                                            { value: '18 mois', label: 'de garantie' },
                                            { value: '1 250', label: "XOF à l'achat" },
                                        ]}
                                        facts={[
                                            {
                                                icon: MapPin,
                                                children: (
                                                    <>
                                                        Bureau Paris —{' '}
                                                        <b className="text-inverse-on-surface font-normal">
                                                            2ᵉ étage
                                                        </b>
                                                    </>
                                                ),
                                            },
                                        ]}
                                        relation={{
                                            vignette: 'AS',
                                            title: 'Alice SuperAdmin',
                                            detail: 'porteuse depuis le 25 juillet · réception confirmée',
                                            onOpen: () => undefined,
                                        }}
                                        actions={
                                            <Button
                                                variant="filled"
                                                icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                                            >
                                                Restituer
                                            </Button>
                                        }
                                    />
                                }
                            >
                                <section className="rounded-card bg-surface p-4">
                                    <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                                        <Icon
                                            glyph={Laptop}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                        Référence technique
                                    </p>
                                    <div className="mt-3">
                                        <ReferenceRow
                                            label="Numéro de série"
                                            value="SN-ASSET10001"
                                            copyable
                                        />
                                        <ReferenceRow label="Mémoire" value="16 Go" />
                                        <ReferenceRow label="Stockage" value="512 Go SSD" />
                                        <ReferenceRow label="Système" value="Windows 11 Pro" />
                                        <ReferenceRow
                                            label="Réserve d’usage"
                                            value="Webcam hors service — notée le 29 juillet"
                                        />
                                    </div>
                                </section>

                                <section className="rounded-card bg-surface p-4">
                                    <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                                        <Icon
                                            glyph={ShieldWarning}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                        Garantie et valeur
                                    </p>
                                    <ProportionRow
                                        value="50 %"
                                        label="de la garantie écoulée — 3 ans à compter de l’achat"
                                        percent={50}
                                        tone="positive"
                                        note={
                                            <>
                                                Toute réparation est{' '}
                                                <b className="text-on-surface font-medium">
                                                    prise en charge par le fournisseur
                                                </b>{' '}
                                                jusqu’au{' '}
                                                <b className="text-on-surface font-medium">
                                                    5 janvier 2028
                                                </b>
                                                .
                                            </>
                                        }
                                    />
                                    <ProportionRow
                                        className="border-outline-variant mt-4 border-t pt-1"
                                        value="92 %"
                                        label="de la valeur amortie — 100 XOF restent à amortir"
                                        percent={92}
                                        tone="attention"
                                        note={
                                            <>
                                                <b className="text-on-surface font-medium">
                                                    À renouveler cette année.
                                                </b>{' '}
                                                Son remplacement s’impute sur « Matériel IT ».
                                            </>
                                        }
                                        source="Amortissement issu du paramétrage par catégorie, pas d’une réévaluation."
                                    />
                                </section>

                                <section className="rounded-card bg-surface p-4">
                                    <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                                        <Icon
                                            glyph={ClockCounterClockwise}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                        Historique
                                    </p>
                                    <div className="mt-3">
                                        <ReferenceRow
                                            label="Réception confirmée"
                                            value="25 juillet, 02:19"
                                            quiet
                                        />
                                        <ReferenceRow
                                            label="Attribué puis restitué, 2 fois"
                                            value="du 14 janvier au 25 juillet"
                                            quiet
                                        />
                                        <ReferenceRow
                                            label="Ajouté à l’inventaire"
                                            value="5 janvier 2025"
                                            quiet
                                        />
                                    </div>
                                    <Button variant="text" className="mt-2 px-0">
                                        Les 6 événements — dans Audit
                                    </Button>
                                </section>
                            </DetailTemplate>
                        </div>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            <strong className="text-on-surface font-medium">
                                Trois métriques au plus, et le type le tient
                            </strong>{' '}
                            : une quatrième cellule ne compile pas (R3). Ce que le héro porte, les
                            cartes ne le reprennent pas. Au-delà de{' '}
                            <strong className="text-on-surface font-medium">1280 px</strong>— et là
                            seulement (§2.43) — la fiche passe à deux colonnes : le sujet et ce qui
                            appelle un geste à gauche, la référence bornée à droite.
                        </p>
                    </Specimen>

                    <Specimen
                        name="ListTemplate + ListRow"
                        note="gabarit liste / file — planches 04.1 · 08.1, régime 00.4"
                        interactive
                    >
                        <div className="border-outline-variant bg-background overflow-hidden rounded-lg border">
                            <ListTemplate
                                title="Équipements"
                                subtitle="14 au parc"
                                search={{
                                    value: listSearch,
                                    onChange: setListSearch,
                                    placeholder: 'Code, identifiant, modèle',
                                }}
                                facets={LIST_FACETS}
                                activeFacetId={listFacet}
                                onFacetSelect={setListFacet}
                                count={{ total: 14, noun: 'actifs' }}
                                sort={{ label: 'Ajout récent', onClick: () => undefined }}
                                footer="Fin de liste — 14 sur 14."
                                fab={
                                    <div className="flex justify-end p-4">
                                        <Button
                                            variant="filled"
                                            icon={<Icon glyph={Plus} size={20} />}
                                        >
                                            Ajouter
                                        </Button>
                                    </div>
                                }
                            >
                                {LIST_ROWS.map((row) => (
                                    <ListRow
                                        key={row.id}
                                        vignette={<Icon glyph={row.glyph} size={20} />}
                                        title={row.code}
                                        type={row.model}
                                        status={row.status}
                                        holder={row.holder}
                                        date={row.date}
                                        onOpen={() => undefined}
                                    />
                                ))}
                            </ListTemplate>
                        </div>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            <strong className="text-on-surface font-medium">
                                Une rangée fait 72 px à toutes les largeurs.
                            </strong>{' '}
                            Réduisez la fenêtre sous 600 px : les pastilles se mettent à défiler, le
                            modèle et la date quittent la rangée, l’en-tête reprend son filet —{' '}
                            <em>ce qui change se compte sur les doigts d’une main</em>. Ni hauteur
                            de rangée, ni vignette, ni rayon, ni place du jaune. Le gabarit branche
                            aussi l’attente (17.3), le vide (17.1), le hors-ligne (17.1) et la
                            sélection (17.2) : un écran qui l’adopte les reçoit sans les réécrire.
                        </p>
                    </Specimen>

                    <Specimen
                        name="Card"
                        note="état pressé ajouté en v1 sur la carte cliquable"
                        interactive
                    >
                        <div className="medium:grid-cols-3 grid gap-4">
                            <Card title="Elevated" icon={<MaterialIcon name="layers" size={20} />}>
                                <p className="text-body-medium text-on-surface-variant">
                                    Surface + ombre légère. Variante par défaut.
                                </p>
                            </Card>
                            <Card title="Filled" variant="filled">
                                <p className="text-body-medium text-on-surface-variant">
                                    Fond surface-container, sans ombre.
                                </p>
                            </Card>
                            <Card title="Outlined" variant="outlined">
                                <p className="text-body-medium text-on-surface-variant">
                                    Bordure seule.
                                </p>
                            </Card>
                            <Card title="Cliquable" onClick={() => undefined}>
                                <p className="text-body-medium text-on-surface-variant">
                                    role=button, Entrée / Espace, anneau de focus.
                                </p>
                            </Card>
                            <Card
                                title="Avec action"
                                actionIcon={<MaterialIcon name="more_vert" size={20} />}
                                actionLabel="Autres actions"
                                onActionClick={() => undefined}
                            >
                                <p className="text-body-medium text-on-surface-variant">
                                    L’action d’en-tête arrête la propagation.
                                </p>
                            </Card>
                            <Card title="Désactivée" onClick={() => undefined} disabled>
                                <p className="text-body-medium text-on-surface-variant">
                                    aria-disabled, pointeur neutralisé.
                                </p>
                            </Card>
                        </div>
                    </Specimen>

                    <Specimen
                        name="MetricCard"
                        note="tuile de stat — cran typographique stat-value (30 → 24 px en compact)"
                        interactive
                    >
                        <div className="medium:grid-cols-3 grid gap-4">
                            <MetricCard
                                title="Équipements"
                                value={128}
                                icon={<MaterialIcon name="inventory_2" size={20} />}
                                subtitle="Parc total"
                            />
                            <MetricCard
                                title="Demandes en cours"
                                value={7}
                                icon={<MaterialIcon name="pending_actions" size={20} />}
                                trend={{ value: 12, direction: 'up', label: 'vs. mois dernier' }}
                                onClick={() => undefined}
                            />
                            <MetricCard
                                title="Manquants"
                                value={3}
                                valueClassName="text-error"
                                icon={<MaterialIcon name="error" size={20} />}
                            />
                        </div>
                        <div className="medium:grid-cols-4 mt-4 grid gap-3">
                            <MetricCard
                                compact
                                title="Compact"
                                value={42}
                                icon={<MaterialIcon name="bolt" size={18} />}
                            />
                            <MetricCard
                                compact
                                title="Titre long qui passe sur deux lignes"
                                value={9}
                            />
                        </div>
                    </Specimen>

                    <Specimen
                        name="EntityRow"
                        note="rangée d’entité — variantes list et card"
                        interactive
                    >
                        <div className="border-outline-variant overflow-hidden rounded-lg border">
                            <EntityRow
                                title="Latitude 5440"
                                subtitle="NB-2291 — Ordinateur portable"
                                status={<StatusBadge status="Attribué" />}
                                location="Lomé — Siège"
                                onClick={() => undefined}
                            />
                            <EntityRow
                                title="ThinkPad T14"
                                subtitle="NB-2292 — Ordinateur portable"
                                status={<StatusBadge status="Disponible" />}
                                selected
                                onClick={() => undefined}
                            />
                            <EntityRow
                                title="ProBook 450"
                                subtitle="NB-2293 — Ordinateur portable"
                                status={<StatusBadge status="En réparation" />}
                                disabled
                            />
                            <EntityRow
                                title="Avec actions"
                                subtitle="Les actions remplacent le chevron"
                                actions={
                                    <IconButton icon="more_vert" aria-label="Autres actions" />
                                }
                            />
                        </div>
                        <div className="mt-4">
                            <EntityRow
                                variant="card"
                                title="Variante card"
                                subtitle="Rangée détachée, rayon et élévation propres"
                                status={<StatusBadge status="Disponible" />}
                                onClick={() => undefined}
                            />
                        </div>
                    </Specimen>

                    <Specimen
                        name="StatusBadge"
                        note="libellés issus de getStatusLabel() — ce composant ne mappe que statut → ton"
                    >
                        <StateRow>
                            <StateCell label="sm">
                                <StatusBadge status="Disponible" size="sm" />
                            </StateCell>
                            <StateCell label="md">
                                <StatusBadge status="Attribué" />
                            </StateCell>
                            <StateCell label="lg">
                                <StatusBadge status="En réparation" size="lg" />
                            </StateCell>
                            <StateCell label="workflow">
                                <StatusBadge status="WAITING_MANAGER_APPROVAL" />
                            </StateCell>
                            <StateCell label="rôle">
                                <StatusBadge status="SuperAdmin" />
                            </StateCell>
                            <StateCell label="inconnu (repli neutre)">
                                <StatusBadge status="Statut inédit" />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen name="UserAvatar">
                        <StateRow>
                            <StateCell label="xs">
                                <UserAvatar name="Awa Koffi" size="xs" />
                            </StateCell>
                            <StateCell label="sm">
                                <UserAvatar name="Awa Koffi" size="sm" />
                            </StateCell>
                            <StateCell label="md">
                                <UserAvatar name="Awa Koffi" />
                            </StateCell>
                            <StateCell label="lg">
                                <UserAvatar name="Awa Koffi" size="lg" />
                            </StateCell>
                            <StateCell label="xl">
                                <UserAvatar name="Awa Koffi" size="xl" />
                            </StateCell>
                            <StateCell label="SuperAdmin">
                                <UserAvatar name="Marc Adjovi" role="SuperAdmin" size="lg" />
                            </StateCell>
                            <StateCell label="Admin">
                                <UserAvatar name="Marc Adjovi" role="Admin" size="lg" />
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="DemoBadge"
                        note="politique X5 — toute donnée simulée est étiquetée"
                    >
                        <DemoBadge />
                    </Specimen>

                    <Specimen name="MovementTimeline">
                        <div className="expanded:grid-cols-2 grid gap-4">
                            <MovementTimeline
                                title="Historique"
                                items={TIMELINE_ITEMS}
                                emptyMessage="Aucun mouvement."
                            />
                            <MovementTimeline
                                title="Historique (vide)"
                                items={[]}
                                emptyMessage="Aucun mouvement enregistré."
                            />
                        </div>
                    </Specimen>

                    <Specimen
                        name="TableScrollArea"
                        note="exception documentée : défilement horizontal assumé, première colonne épinglée"
                    >
                        <TableScrollArea
                            label="Tableau de démonstration"
                            className="border-outline-variant rounded-lg border"
                        >
                            <table className="text-body-small w-full min-w-[720px] border-collapse">
                                <thead className="bg-surface-container">
                                    <tr>
                                        <th className="bg-surface-container text-label-small text-on-surface-variant sticky left-0 z-10 px-4 py-2 text-left uppercase">
                                            Série
                                        </th>
                                        <th className="text-label-small text-on-surface-variant px-4 py-2 text-left uppercase">
                                            Modèle
                                        </th>
                                        <th className="text-label-small text-on-surface-variant px-4 py-2 text-left uppercase">
                                            Catégorie
                                        </th>
                                        <th className="text-label-small text-on-surface-variant px-4 py-2 text-left uppercase">
                                            Site
                                        </th>
                                        <th className="text-label-small text-on-surface-variant px-4 py-2 text-left uppercase">
                                            Détenteur
                                        </th>
                                        <th className="text-label-small text-on-surface-variant px-4 py-2 text-left uppercase">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TABLE_ROWS.map((row) => (
                                        <tr
                                            key={row.serial}
                                            className="border-outline-variant border-t"
                                        >
                                            <th
                                                scope="row"
                                                className="bg-surface text-on-surface sticky left-0 z-10 px-4 py-3 text-left font-medium"
                                            >
                                                {row.serial}
                                            </th>
                                            <td className="text-on-surface px-4 py-3">
                                                {row.model}
                                            </td>
                                            <td className="text-on-surface-variant px-4 py-3">
                                                {row.category}
                                            </td>
                                            <td className="text-on-surface-variant px-4 py-3">
                                                {row.site}
                                            </td>
                                            <td className="text-on-surface-variant px-4 py-3">
                                                {row.owner}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={row.status} size="sm" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableScrollArea>
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="retroaction"
                    title="Rétroaction & états d'interface"
                    description="Vide, chargement, erreur : trois écrans distincts, trois composants distincts."
                >
                    <Specimen
                        name="Skeleton — liste · file · fiche"
                        note="planche 17.3 — 28 écrans, rien avant 300 ms"
                    >
                        <div className="expanded:grid-cols-3 grid gap-5">
                            <div>
                                <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                    liste — 4 écrans
                                </p>
                                <div className="bg-surface rounded-lg px-4">
                                    <SkeletonList />
                                </div>
                            </div>
                            <div>
                                <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                    file — 3 écrans
                                </p>
                                <div className="bg-surface rounded-lg px-4">
                                    <SkeletonQueue />
                                </div>
                            </div>
                            <div>
                                <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                    fiche — 5 écrans
                                </p>
                                <div className="bg-background overflow-hidden rounded-lg">
                                    <SkeletonDetail />
                                </div>
                            </div>
                        </div>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            <strong className="text-on-surface font-medium">
                                Cinq rangées, jamais une
                            </strong>{' '}
                            : un squelette à une rangée annonce une liste vide. Une seule nuance,
                            aucune animation — le balayage lumineux attire l’œil <em>sur</em>{' '}
                            l’attente au lieu de l’en détourner (A3). La barre du haut, elle, est
                            déjà vraie : on ne met en squelette que ce qui est réellement en attente
                            (A4).
                        </p>
                    </Specimen>

                    <Specimen
                        name="ScreenState"
                        note="planche 17.1 — une forme pour vide, introuvable et refusé"
                    >
                        <div className="expanded:grid-cols-3 grid gap-4">
                            <div className="bg-surface rounded-lg">
                                <ScreenState
                                    icon={Package}
                                    title="Aucun équipement ici"
                                    description="Ce site n’a encore aucun actif rattaché."
                                    actions={
                                        <Button variant="filled">Ajouter un équipement</Button>
                                    }
                                />
                            </div>
                            <div className="bg-surface rounded-lg">
                                <ScreenState
                                    icon={MagnifyingGlass}
                                    title="Cette page n’existe plus"
                                    description="L’équipement ou la personne que vous cherchiez a peut-être été sorti du parc. Son historique, lui, est conservé dans l’audit."
                                    actions={
                                        <>
                                            <Button variant="filled">Revenir à l’accueil</Button>
                                            <Button variant="tonal">
                                                Chercher dans les équipements
                                            </Button>
                                        </>
                                    }
                                />
                            </div>
                            <div className="bg-surface rounded-lg">
                                <ScreenState
                                    icon={Wallet}
                                    title="Votre compte attend son activation"
                                    description="Il a été créé le 03/08 et n’a pas encore été ouvert. Vous n’avez rien à faire de plus : c’est une validation, pas une inscription."
                                    actions={
                                        <>
                                            <Button variant="filled">
                                                Écrire à Clara Admin France
                                            </Button>
                                            <Button variant="tonal">Se déconnecter</Button>
                                        </>
                                    }
                                    footnote="Les deux autres cas — suspendu, hors liste — disent la même chose avec leur propre phrase. L’écran n’énumère jamais les trois."
                                />
                            </div>
                        </div>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            Pas de <code>404</code> : c’est un mot d’un autre métier, adressé à
                            personne. Pas de « vérifiez le lien » : sur un téléphone, personne n’a
                            tapé de lien. Et un accès refusé
                            <strong className="text-on-surface font-medium">
                                {' '}
                                nomme sa cause et qui peut ouvrir la porte
                            </strong>{' '}
                            — un nom, jamais « l’administrateur ».
                        </p>
                    </Specimen>

                    <Specimen
                        name="ContextBanner / OfflineBanner + InlineError"
                        note="planche 17.1 — règles 1 et 2"
                    >
                        <div className="space-y-4">
                            <div className="border-outline-variant overflow-hidden rounded-lg border">
                                <ContextBanner>
                                    <strong className="text-on-surface font-medium">
                                        Hors ligne.
                                    </strong>{' '}
                                    Vous pouvez consulter le parc ; créer, attribuer et déclarer
                                    reviendront avec le réseau.
                                </ContextBanner>
                            </div>
                            <InlineError>
                                <strong className="font-medium">
                                    La demande n’est pas partie.
                                </strong>{' '}
                                Le serveur n’a pas répondu — ce que vous avez écrit est gardé.
                            </InlineError>
                        </div>
                        <p className="text-body-small text-on-surface-variant mt-4">
                            <code>OfflineBanner</code> ne se montre que hors ligne (il lit{' '}
                            <code>navigator.onLine</code>, dette D9) ; c’est{' '}
                            <code>ContextBanner</code> qui est instancié ici pour qu’il soit
                            visible. L’erreur d’acte vit{' '}
                            <strong className="text-on-surface font-medium">
                                là où le geste a été engagé
                            </strong>{' '}
                            : la feuille reste ouverte, la saisie reste écrite, et le geste primaire
                            devient « Réessayer » — voir <code>ConfirmationSheet</code>.
                        </p>
                    </Specimen>

                    <Specimen name="EmptyState" note="déprécié → ScreenState (12 appels à porter)">
                        <div className="medium:grid-cols-2 grid gap-4">
                            <EmptyState
                                icon="inventory_2"
                                title="Aucun équipement"
                                description="Aucun équipement ne correspond à ces filtres."
                            />
                            <EmptyState
                                icon="search_off"
                                title="Aucun résultat"
                                description="Élargissez la recherche ou réinitialisez les filtres."
                                action={
                                    <Button
                                        variant="outlined"
                                        icon={<MaterialIcon name="restart_alt" size={18} />}
                                    >
                                        Réinitialiser les filtres
                                    </Button>
                                }
                            />
                        </div>
                    </Specimen>

                    <Specimen name="LoadingSpinner">
                        <StateRow>
                            <StateCell label="sm">
                                <LoadingSpinner size="sm" />
                            </StateCell>
                            <StateCell label="md">
                                <LoadingSpinner />
                            </StateCell>
                            <StateCell label="lg">
                                <LoadingSpinner size="lg" />
                            </StateCell>
                            <StateCell label="avec texte">
                                <LoadingSpinner text="Chargement…" />
                            </StateCell>
                        </StateRow>
                        <div className="mt-4">
                            <p className="text-label-small text-on-surface-variant mb-2 tracking-wide uppercase">
                                variant=&quot;linear&quot;
                            </p>
                            <LoadingSpinner variant="linear" text="Extraction du document…" />
                        </div>
                    </Specimen>

                    <Specimen
                        name="ErrorBoundary"
                        note="filet de rendu — remontage par changement de key"
                    >
                        <div className="space-y-4">
                            <Button
                                variant={armed ? 'outlined' : 'danger'}
                                size="sm"
                                onClick={() => setArmed((value) => !value)}
                            >
                                {armed ? 'Désamorcer' : 'Déclencher une exception de rendu'}
                            </Button>
                            <div className="border-outline-variant rounded-lg border p-4">
                                <ErrorBoundary
                                    key={armed ? 'armed' : 'safe'}
                                    context="galerie"
                                    title="Ce bloc n’a pas pu s’afficher"
                                    description="Repli du boundary : titre, explication et sortie explicite."
                                >
                                    <Bomb armed={armed} />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </Specimen>

                    <Specimen
                        name="Snackbar"
                        note="file d’attente : un message à la fois, auto-effacement 4 s"
                    >
                        <StateRow>
                            <StateCell label="default">
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        pushSnack({
                                            id: `d-${Date.now()}`,
                                            message: 'Équipement enregistré.',
                                        })
                                    }
                                >
                                    Afficher
                                </Button>
                            </StateCell>
                            <StateCell label="success">
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        pushSnack({
                                            id: `s-${Date.now()}`,
                                            message: 'Attribution confirmée.',
                                            variant: 'success',
                                        })
                                    }
                                >
                                    Afficher
                                </Button>
                            </StateCell>
                            <StateCell label="error">
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        pushSnack({
                                            id: `e-${Date.now()}`,
                                            message: 'Échec de l’enregistrement.',
                                            variant: 'error',
                                        })
                                    }
                                >
                                    Afficher
                                </Button>
                            </StateCell>
                            <StateCell label="avec action">
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        pushSnack({
                                            id: `a-${Date.now()}`,
                                            message: 'Équipement retiré.',
                                            action: { label: 'Annuler', onClick: () => undefined },
                                        })
                                    }
                                >
                                    Afficher
                                </Button>
                            </StateCell>
                        </StateRow>
                    </Specimen>
                </Section>

                {/* ------------------------------------------------------------------ */}
                <Section
                    id="superpositions"
                    title="Superpositions"
                    description="Toutes portent un piège de focus, la fermeture par Échap et la restauration du focus au déclencheur."
                >
                    <Specimen
                        name="Modal / BottomSheet / SideSheet / ConfirmationSheet / ScanView / Menu / Tooltip"
                        interactive
                    >
                        <StateRow>
                            <StateCell label="Modal">
                                <Button variant="outlined" onClick={() => setModalOpen(true)}>
                                    Ouvrir la boîte de dialogue
                                </Button>
                            </StateCell>
                            <StateCell label="BottomSheet">
                                <Button variant="outlined" onClick={() => setSheetOpen(true)}>
                                    Ouvrir la feuille de bas
                                </Button>
                            </StateCell>
                            <StateCell label="SideSheet">
                                <Button variant="outlined" onClick={() => setSideSheetOpen(true)}>
                                    Ouvrir le panneau latéral
                                </Button>
                            </StateCell>
                            <StateCell label="ConfirmationSheet — irréversible">
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setConfirmTone('destructive');
                                        setConfirmOpen(true);
                                    }}
                                >
                                    Supprimer un équipement
                                </Button>
                            </StateCell>
                            <StateCell label="ConfirmationSheet — réversible">
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setConfirmTone('neutral');
                                        setConfirmOpen(true);
                                    }}
                                >
                                    Suspendre un compte
                                </Button>
                            </StateCell>
                            <StateCell label="ScanView — simple">
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setScanMode('simple');
                                        setScanOpen(true);
                                    }}
                                >
                                    Ouvrir le scan
                                </Button>
                            </StateCell>
                            <StateCell label="ScanView — lot">
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setScanMode('batch');
                                        setScanOpen(true);
                                    }}
                                >
                                    Ouvrir le scan par lot
                                </Button>
                            </StateCell>
                            <StateCell label="Menu">
                                <Menu
                                    title="Actions"
                                    trigger={
                                        <Button
                                            variant="outlined"
                                            icon={<MaterialIcon name="more_vert" size={18} />}
                                        >
                                            Menu
                                        </Button>
                                    }
                                    items={[
                                        {
                                            id: 'edit',
                                            label: 'Modifier',
                                            icon: 'edit',
                                            onSelect: () => undefined,
                                        },
                                        {
                                            id: 'export',
                                            label: 'Exporter',
                                            icon: 'download',
                                            trailingText: 'CSV',
                                            onSelect: () => undefined,
                                        },
                                        {
                                            id: 'locked',
                                            label: 'Action réservée',
                                            icon: 'lock',
                                            disabled: true,
                                            onSelect: () => undefined,
                                        },
                                        {
                                            id: 'delete',
                                            label: 'Supprimer',
                                            icon: 'delete',
                                            destructive: true,
                                            dividerBefore: true,
                                            onSelect: () => undefined,
                                        },
                                    ]}
                                />
                            </StateCell>
                            <StateCell label="Tooltip (plain)">
                                <Tooltip
                                    content="Infobulle simple — appui long au tactile"
                                    delay={200}
                                >
                                    <Button variant="outlined">Survoler</Button>
                                </Tooltip>
                            </StateCell>
                            <StateCell label="Tooltip (rich)">
                                <Tooltip
                                    variant="rich"
                                    placement="bottom"
                                    content={
                                        <div className="space-y-2">
                                            <p className="text-title-small text-on-surface">
                                                Infobulle riche
                                            </p>
                                            <p className="text-body-small text-on-surface-variant">
                                                Reste ouverte au survol, se ferme avec Échap.
                                            </p>
                                        </div>
                                    }
                                >
                                    <Button variant="outlined">Survoler</Button>
                                </Tooltip>
                            </StateCell>
                        </StateRow>
                    </Specimen>

                    <Specimen
                        name="FabContainer + ListActionFab"
                        note="ancrés au coin bas-droit de la fenêtre, safe-area comprise"
                    >
                        <p className="text-body-medium text-on-surface-variant">
                            Les deux composants sont montés en bas à droite de cette page — la
                            feuille d’actions s’ouvre au clic.
                        </p>
                    </Specimen>
                </Section>

                <footer className="border-outline-variant border-t pt-6">
                    <p className="text-body-small text-on-surface-variant">
                        Définition de « terminé » d’un composant, règles d’usage et matrice d’états
                        complète :<span className="text-on-surface"> DESIGN_SYSTEM.md</span> —
                        journal des évolutions :
                        <span className="text-on-surface"> DESIGN_SYSTEM_CHANGELOG.md</span>.
                    </p>
                </footer>
            </main>

            {/* --- Superpositions montées hors flux ------------------------------- */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Boîte de dialogue"
                icon={<MaterialIcon name="info" size={24} />}
                footer={
                    <>
                        <Button variant="text" onClick={() => setModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={() => setModalOpen(false)}>Confirmer</Button>
                    </>
                }
            >
                <p className="text-body-medium text-on-surface-variant">
                    Plein écran en compact, centrée dès medium. Piège de focus actif, Échap ferme.
                </p>
            </Modal>

            <BottomSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title="Feuille de bas"
            >
                <p className="text-body-medium text-on-surface-variant">
                    Poignée de glissement : un tirage vers le bas de plus de 120 px ferme la
                    feuille.
                </p>
            </BottomSheet>

            <SideSheet
                open={sideSheetOpen}
                onClose={() => setSideSheetOpen(false)}
                title="Panneau latéral"
                description="Feuille de bas sous 840 px, panneau latéral au-delà."
                footer={
                    <Button className="w-full" onClick={() => setSideSheetOpen(false)}>
                        Fermer
                    </Button>
                }
            >
                <p className="text-body-medium text-on-surface-variant">
                    Contenu défilant, largeur standard 360 dp.
                </p>
            </SideSheet>

            {/* Feuille sous 840 px, dialogue de 440 px au-delà (§2.43) : la même vue posée
          autrement, jamais une seconde. Les deux tons montrent la règle C3 — le rouge
          est réservé à l'irréversible, le réversible est sombre. */}
            <ConfirmationSheet
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => setConfirmOpen(false)}
                tone={confirmTone}
                irreversible={confirmTone === 'destructive'}
                icon={confirmTone === 'destructive' ? Trash : Pause}
                title={
                    confirmTone === 'destructive'
                        ? 'Supprimer Latitude 5540 du parc ?'
                        : 'Suspendre le compte de Kossi Adjovi ?'
                }
                message={
                    confirmTone === 'destructive' ? (
                        <>
                            L’équipement disparaît de l’inventaire et des rapports.{' '}
                            <strong className="text-on-surface font-medium">
                                Ses 9 mouvements d’historique sont conservés
                            </strong>{' '}
                            et resteront consultables depuis le journal d’audit.
                        </>
                    ) : (
                        <>
                            Il ne pourra plus se connecter.{' '}
                            <strong className="text-on-surface font-medium">
                                Ses 3 équipements restent à son nom
                            </strong>{' '}
                            — la suspension ne restitue rien. Vous pourrez rétablir le compte à tout
                            moment.
                        </>
                    )
                }
                details={
                    confirmTone === 'destructive'
                        ? [
                              { icon: User, label: 'Détenu par', value: 'Amina Sow' },
                              { icon: Wallet, label: 'Valeur résiduelle', value: '168 000 XOF' },
                          ]
                        : undefined
                }
                confirmText={confirmTone === 'destructive' ? 'Supprimer' : 'Suspendre'}
            />

            {scanOpen && (
                <div className="fixed inset-0 z-[110]">
                    <ScanView
                        mode={scanMode}
                        onModeChange={setScanMode}
                        onClose={() => setScanOpen(false)}
                        hit={SCAN_HITS[0]}
                        onRetry={() => undefined}
                        onAccept={() => setScanOpen(false)}
                        onManualEntry={() => undefined}
                        hits={SCAN_HITS}
                        expected={41}
                        onFinish={() => setScanOpen(false)}
                    />
                </div>
            )}

            <Snackbar messages={snacks} onDismiss={dismissSnack} />

            <FabContainer description="Actions de la galerie">
                <FloatingActionButton
                    icon="palette"
                    aria-label="Action flottante de démonstration"
                />
            </FabContainer>

            <ListActionFab
                label="galerie"
                sheetTitle="Actions de démonstration"
                actions={[
                    { id: 'a', label: 'Première action', icon: 'add', onSelect: () => undefined },
                    {
                        id: 'b',
                        label: 'Deuxième action',
                        icon: 'upload',
                        variant: 'text',
                        onSelect: () => undefined,
                    },
                    {
                        id: 'c',
                        label: 'Action indisponible',
                        icon: 'lock',
                        disabled: true,
                        onSelect: () => undefined,
                    },
                ]}
            />
        </div>
    );
};

export default DesignSystemGalleryPage;
