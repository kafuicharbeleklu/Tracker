import React, { useState } from 'react';

import Badge from '../../../components/ui/Badge';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Chip from '../../../components/ui/Chip';
import CloseButton from '../../../components/ui/CloseButton';
import ConfirmationDialog from '../../../components/ui/ConfirmationDialog';
import DemoBadge from '../../../components/ui/DemoBadge';
import Divider from '../../../components/ui/Divider';
import { EmptyState } from '../../../components/ui/EmptyState';
import { EntityRow } from '../../../components/ui/EntityRow';
import ErrorBoundary from '../../../components/ui/ErrorBoundary';
import { FabContainer } from '../../../components/ui/FabContainer';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import FloatingActionButton from '../../../components/ui/FloatingActionButton';
import IconButton from '../../../components/ui/IconButton';
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
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import SelectField from '../../../components/ui/SelectField';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import SideSheet from '../../../components/ui/SideSheet';
import Snackbar, { type SnackbarMessage } from '../../../components/ui/Snackbar';
import StatusBadge from '../../../components/ui/StatusBadge';
import TableScrollArea from '../../../components/ui/TableScrollArea';
import { TextArea } from '../../../components/ui/TextArea';
import Toggle from '../../../components/ui/Toggle';
import Tooltip from '../../../components/ui/Tooltip';
import { UserAvatar } from '../../../components/ui/UserAvatar';

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
      {description && <p className="mt-1 text-body-medium text-on-surface-variant">{description}</p>}
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
  <div className="rounded-xl border border-outline-variant bg-surface shadow-elevation-1 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container px-4 py-2.5">
      <p className="text-label-large text-on-surface">{name}</p>
      <div className="flex items-center gap-2">
        {interactive && (
          <Badge variant="info">à exercer : survol / tab / appui</Badge>
        )}
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
    <span className="text-label-small uppercase tracking-wide text-on-surface-variant">{label}</span>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

/** Surface sombre : les variantes `nav` n'ont de sens que posées dessus. */
const DarkStage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`rounded-lg bg-inverse-surface p-4 ${className ?? ''}`}>{children}</div>
);

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
  { serial: 'NB-2291', model: 'Latitude 5440', category: 'Ordinateur portable', site: 'Lomé — Siège', owner: 'Awa Koffi', status: 'Attribué' },
  { serial: 'NB-2292', model: 'ThinkPad T14', category: 'Ordinateur portable', site: 'Kara — Agence', owner: '—', status: 'Disponible' },
  { serial: 'NB-2293', model: 'ProBook 450', category: 'Ordinateur portable', site: 'Lomé — Entrepôt', owner: '—', status: 'En réparation' },
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
  const [snacks, setSnacks] = useState<SnackbarMessage[]>([]);

  const pushSnack = (message: SnackbarMessage) => setSnacks((queue) => [...queue, message]);
  const dismissSnack = (id: string) => setSnacks((queue) => queue.filter((item) => item.id !== id));

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-page-sm py-4 medium:px-page">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-headline-medium text-on-surface">Tracker DS</h1>
                <Badge variant="neutral">v1</Badge>
                <DemoBadge label="dev" title="Route montée uniquement en développement" />
              </div>
              <p className="mt-1 text-body-medium text-on-surface-variant">
                Galerie vivante des primitives — instances réelles de <code>src/components/ui</code>.
              </p>
            </div>
            <Button
              variant="outlined"
              icon={<MaterialIcon name="arrow_back" size={18} />}
              onClick={() => { window.location.hash = '/dashboard'; }}
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
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-12 px-page-sm py-8 medium:px-page">
        {/* ------------------------------------------------------------------ */}
        <Section
          id="fondations"
          title="Fondations"
          description="Rôles de couleur, rayons et élévations résolus par le pont Tailwind sur la couche sémantique --tk-*."
        >
          <Specimen name="Rôles de couleur" note="tier 2 — sémantique">
            <div className="grid grid-cols-2 gap-3 medium:grid-cols-4 expanded:grid-cols-6">
              {[
                { name: 'primary', box: 'bg-primary', text: 'text-on-primary' },
                { name: 'primary-container', box: 'bg-primary-container', text: 'text-on-primary-container' },
                { name: 'secondary-container', box: 'bg-secondary-container', text: 'text-on-secondary-container' },
                { name: 'tertiary-container', box: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
                { name: 'error', box: 'bg-error', text: 'text-on-error' },
                { name: 'error-container', box: 'bg-error-container', text: 'text-on-error-container' },
                { name: 'surface', box: 'bg-surface border border-outline-variant', text: 'text-on-surface' },
                { name: 'surface-container', box: 'bg-surface-container', text: 'text-on-surface' },
                { name: 'surface-container-high', box: 'bg-surface-container-high', text: 'text-on-surface' },
                { name: 'inverse-surface', box: 'bg-inverse-surface', text: 'text-inverse-on-surface' },
                { name: 'neutral-fill', box: 'bg-neutral-fill', text: 'text-inverse-on-surface' },
                { name: 'focus-ring', box: 'bg-focus-ring', text: 'text-inverse-on-surface' },
              ].map((role) => (
                <div key={role.name} className="min-w-0">
                  <div className={`flex h-16 items-end rounded-lg p-2 ${role.box}`}>
                    <span className={`text-label-small ${role.text}`}>Aa</span>
                  </div>
                  <p className="mt-1 truncate text-label-small text-on-surface-variant">{role.name}</p>
                </div>
              ))}
            </div>
          </Specimen>

          <Specimen name="Tons sémantiques" note="Badge / StatusBadge — paire fond clair + texte fort">
            <StateRow>
              <StateCell label="success"><Badge variant="success">Succès</Badge></StateCell>
              <StateCell label="warning"><Badge variant="warning">Attention</Badge></StateCell>
              <StateCell label="danger"><Badge variant="danger">Danger</Badge></StateCell>
              <StateCell label="info"><Badge variant="info">Info</Badge></StateCell>
              <StateCell label="neutral"><Badge variant="neutral">Neutre</Badge></StateCell>
              <StateCell label="default"><Badge>Défaut</Badge></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="Échelle de rayons" note="2 / 4 / 8 / full — toute autre valeur est bloquée par ds:check">
            <StateRow>
              {['rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full'].map((radius) => (
                <StateCell key={radius} label={radius}>
                  <div className={`h-12 w-12 bg-surface-container-highest ${radius}`} />
                </StateCell>
              ))}
            </StateRow>
          </Specimen>

          <Specimen name="Élévations">
            <StateRow>
              {['shadow-elevation-0', 'shadow-elevation-1', 'shadow-elevation-2', 'shadow-elevation-3', 'shadow-elevation-4', 'shadow-elevation-5'].map((elevation) => (
                <StateCell key={elevation} label={elevation.replace('shadow-', '')}>
                  <div className={`h-12 w-16 rounded-lg bg-surface ${elevation}`} />
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
                <span className="text-body-small text-on-surface-variant">vertical</span>
                <Divider vertical />
                <span className="text-body-small text-on-surface-variant">séparés</span>
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
              <StateCell label="filled"><Button>Enregistrer</Button></StateCell>
              <StateCell label="tonal"><Button variant="tonal">Attribuer</Button></StateCell>
              <StateCell label="outlined"><Button variant="outlined">Annuler</Button></StateCell>
              <StateCell label="text"><Button variant="text">Ignorer</Button></StateCell>
              <StateCell label="elevated"><Button variant="elevated">Exporter</Button></StateCell>
              <StateCell label="danger"><Button variant="danger">Supprimer</Button></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="Button — tailles, icône, disposition">
            <StateRow>
              <StateCell label="sm"><Button size="sm">Petit</Button></StateCell>
              <StateCell label="md"><Button size="md">Moyen</Button></StateCell>
              <StateCell label="lg"><Button size="lg">Grand</Button></StateCell>
              <StateCell label="icône">
                <Button icon={<MaterialIcon name="add" />}>Ajouter un équipement</Button>
              </StateCell>
              <StateCell label="iconOnly">
                <Button iconOnly aria-label="Ajouter" icon={<MaterialIcon name="add" />} />
              </StateCell>
            </StateRow>
            <div className="mt-4">
              <p className="mb-2 text-label-small uppercase tracking-wide text-on-surface-variant">layout=&quot;card&quot;</p>
              <Button variant="outlined" layout="card" className="w-full p-4">
                <span className="flex flex-col gap-1">
                  <span className="text-title-small text-on-surface">Tuile de choix</span>
                  <span className="text-body-small text-on-surface-variant">Hauteur libre, contenu aligné à gauche.</span>
                </span>
              </Button>
            </div>
          </Specimen>

          <Specimen name="Button — états" note="loading force aussi disabled + aria-busy">
            <StateRow>
              <StateCell label="repos"><Button>Valider</Button></StateCell>
              <StateCell label="chargement"><Button loading>Valider</Button></StateCell>
              <StateCell label="chargement (icône seule)">
                <Button loading iconOnly loadingLabel="Envoi en cours" aria-label="Envoyer" />
              </StateCell>
              <StateCell label="désactivé"><Button disabled>Valider</Button></StateCell>
              <StateCell label="désactivé (outlined)"><Button variant="outlined" disabled>Annuler</Button></StateCell>
              <StateCell label="désactivé (danger)"><Button variant="danger" disabled>Supprimer</Button></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="Button — variante nav" note="posée sur surface SOMBRE : anneau de focus primary">
            <DarkStage>
              <StateRow>
                <StateCell label="repos"><Button variant="nav">Tableau de bord</Button></StateCell>
                <StateCell label="désactivé"><Button variant="nav" disabled>Rapports</Button></StateCell>
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
              <p className="mb-2 text-label-small uppercase tracking-wide text-on-surface-variant">variant=&quot;nav&quot;</p>
              <DarkStage>
                <div className="flex gap-2">
                  <IconButton icon="menu" variant="nav" aria-label="Ouvrir le menu" />
                  <IconButton icon="settings" variant="nav" selected aria-label="Paramètres" />
                </div>
              </DarkStage>
            </div>
          </Specimen>

          <Specimen name="CloseButton" note="Button variant=text + iconOnly, aria-label « Fermer » figé">
            <StateRow>
              <StateCell label="repos"><CloseButton onClick={() => undefined} /></StateCell>
              <StateCell label="désactivé"><CloseButton disabled onClick={() => undefined} /></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="FloatingActionButton" interactive note="état désactivé ajouté en v1">
            <StateRow>
              <StateCell label="primary / medium">
                <FloatingActionButton icon="add" aria-label="Ajouter" />
              </StateCell>
              <StateCell label="secondary">
                <FloatingActionButton icon="edit" variant="secondary" aria-label="Modifier" />
              </StateCell>
              <StateCell label="tertiary">
                <FloatingActionButton icon="check" variant="tertiary" aria-label="Valider" />
              </StateCell>
              <StateCell label="surface">
                <FloatingActionButton icon="more_horiz" variant="surface" aria-label="Plus" />
              </StateCell>
              <StateCell label="small">
                <FloatingActionButton icon="add" size="small" aria-label="Ajouter" />
              </StateCell>
              <StateCell label="étendu">
                <FloatingActionButton icon="add" label="Nouvelle demande" aria-label="Nouvelle demande" />
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
            <div className="grid gap-5 medium:grid-cols-2">
              <InputField label="Repos" placeholder="Ex : NB-2291" />
              <InputField label="Avec icône" icon={<MaterialIcon name="search" size={20} />} placeholder="Rechercher" />
              <InputField label="Requis" required placeholder="Numéro de série" />
              <InputField label="Texte d’aide" supportingText="Format attendu : NB-0000." placeholder="NB-0000" />
              <InputField label="Erreur" error="Ce champ est requis" defaultValue="" />
              <InputField label="Désactivé" disabled defaultValue="Valeur figée" />
              <InputField label="Mot de passe" isPassword placeholder="Votre mot de passe" />
              <InputField label="Compteur" maxLength={40} showCharacterCount placeholder="Commentaire court" />
              <InputField label="Préfixe / suffixe" prefix="FCFA" suffix="TTC" placeholder="0" />
              <InputField label="Variante outlined" variant="outlined" placeholder="Bordure haute" />
            </div>
          </Specimen>

          <Specimen name="TextArea">
            <div className="grid gap-5 medium:grid-cols-2">
              <TextArea label="Repos" placeholder="Motif de la demande" />
              <TextArea label="Erreur" error="Le motif est obligatoire" />
              <TextArea label="Compteur" maxLength={120} showCharacterCount placeholder="120 caractères max" />
              <TextArea label="Désactivé" disabled defaultValue="Non modifiable" />
            </div>
          </Specimen>

          <Specimen name="SelectField" note="role=combobox + listbox, navigation clavier complète" interactive>
            <div className="grid gap-5 medium:grid-cols-2">
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

          <Specimen name="Toggle" note="état de focus clavier ajouté en v1 (relais peer-focus-visible)" interactive>
            <StateRow>
              <StateCell label="activé">
                <Toggle checked={toggleOn} onChange={setToggleOn} label="Notifications" />
              </StateCell>
              <StateCell label="désactivé (off)">
                <Toggle checked={false} onChange={() => undefined} label="Mode sombre" />
              </StateCell>
              <StateCell label="avec icône">
                <Toggle checked={toggleOn} onChange={setToggleOn} icon="check" label="Avec glyphe" />
              </StateCell>
              <StateCell label="inactif">
                <Toggle checked disabled onChange={() => undefined} label="Verrouillé" />
              </StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="FileDropzone" note="zone focalisable au clavier depuis la v1 (Entrée / Espace)" interactive>
            <div className="space-y-4">
              <FileDropzone onFileSelect={() => undefined} isProcessing={processing} />
              <Button variant="outlined" size="sm" onClick={() => setProcessing((value) => !value)}>
                {processing ? 'Arrêter le traitement simulé' : 'Simuler le traitement'}
              </Button>
            </div>
          </Specimen>

          <Specimen name="SearchFilterBar" note="anneau de focus ajouté en v1" interactive>
            <div className="space-y-4">
              <SearchFilterBar searchValue={search} onSearchChange={setSearch} placeholder="Rechercher un équipement" />
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
          <Specimen name="PageTabs" note="tablist ARIA, flèches ←/→, feuille « toutes les vues » en cas de débordement" interactive>
            <PageTabs
              activeId={tab}
              onChange={setTab}
              idBase="ds-gallery"
              items={[
                { id: 'etats', label: 'Matrice d’états', shortLabel: 'États', icon: <MaterialIcon name="grid_view" /> },
                { id: 'patterns', label: 'Patterns officiels', shortLabel: 'Patterns', icon: <MaterialIcon name="dashboard" />, badge: 4 },
                { id: 'contenu', label: 'Contenu', icon: <MaterialIcon name="translate" /> },
                { id: 'gouvernance', label: 'Gouvernance', icon: <MaterialIcon name="policy" />, badge: '!' },
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

          <Specimen name="Chip" note="état pressé ajouté en v1 ; le survol du chip sélectionné ne s’applique plus s’il est désactivé" interactive>
            <StateRow>
              <StateCell label="assist"><Chip label="Assistance" leadingIcon="help" onClick={() => undefined} /></StateCell>
              <StateCell label="filter (repos)"><Chip label="Disponibles" variant="filter" selected={false} onClick={() => setFilterChip(true)} /></StateCell>
              <StateCell label="filter (sélectionné)"><Chip label="Disponibles" variant="filter" selected={filterChip} onClick={() => setFilterChip((value) => !value)} /></StateCell>
              <StateCell label="input"><Chip label="Lomé" variant="input" onClose={() => undefined} /></StateCell>
              <StateCell label="suggestion"><Chip label="Suggestion" variant="suggestion" onClick={() => undefined} /></StateCell>
              <StateCell label="désactivé"><Chip label="Indisponible" disabled onClick={() => undefined} /></StateCell>
              <StateCell label="sélectionné + désactivé"><Chip label="Verrouillé" variant="filter" selected disabled /></StateCell>
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

          <Specimen name="NavButton" note="primitive autonome — trois surfaces d’accueil" interactive>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-label-small uppercase tracking-wide text-on-surface-variant">surface=&quot;bar&quot; (fond clair)</p>
                <div className="flex h-[68px] items-stretch gap-1 rounded-lg border border-outline-variant bg-surface px-2">
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
                <p className="mb-2 text-label-small uppercase tracking-wide text-on-surface-variant">surface=&quot;rail&quot; / &quot;drawer&quot; (fond sombre)</p>
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

          <Specimen name="Pagination" note="anneau de focus et état pressé ajoutés en v1" interactive>
            <Pagination currentPage={page} totalPages={7} onPageChange={setPage} />
          </Specimen>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section
          id="surfaces"
          title="Surfaces & données"
          description="Le continuum Card / MetricCard / EntityRow : surface générique, tuile de stat, rangée d'entité."
        >
          <Specimen name="Card" note="état pressé ajouté en v1 sur la carte cliquable" interactive>
            <div className="grid gap-4 medium:grid-cols-3">
              <Card title="Elevated" icon={<MaterialIcon name="layers" size={20} />}>
                <p className="text-body-medium text-on-surface-variant">Surface + ombre légère. Variante par défaut.</p>
              </Card>
              <Card title="Filled" variant="filled">
                <p className="text-body-medium text-on-surface-variant">Fond surface-container, sans ombre.</p>
              </Card>
              <Card title="Outlined" variant="outlined">
                <p className="text-body-medium text-on-surface-variant">Bordure seule.</p>
              </Card>
              <Card title="Cliquable" onClick={() => undefined}>
                <p className="text-body-medium text-on-surface-variant">role=button, Entrée / Espace, anneau de focus.</p>
              </Card>
              <Card
                title="Avec action"
                actionIcon={<MaterialIcon name="more_vert" size={20} />}
                actionLabel="Autres actions"
                onActionClick={() => undefined}
              >
                <p className="text-body-medium text-on-surface-variant">L’action d’en-tête arrête la propagation.</p>
              </Card>
              <Card title="Désactivée" onClick={() => undefined} disabled>
                <p className="text-body-medium text-on-surface-variant">aria-disabled, pointeur neutralisé.</p>
              </Card>
            </div>
          </Specimen>

          <Specimen name="MetricCard" note="tuile de stat — cran typographique stat-value (30 → 24 px en compact)" interactive>
            <div className="grid gap-4 medium:grid-cols-3">
              <MetricCard title="Équipements" value={128} icon={<MaterialIcon name="inventory_2" size={20} />} subtitle="Parc total" />
              <MetricCard
                title="Demandes en cours"
                value={7}
                icon={<MaterialIcon name="pending_actions" size={20} />}
                trend={{ value: 12, direction: 'up', label: 'vs. mois dernier' }}
                onClick={() => undefined}
              />
              <MetricCard title="Manquants" value={3} valueClassName="text-error" icon={<MaterialIcon name="error" size={20} />} />
            </div>
            <div className="mt-4 grid gap-3 medium:grid-cols-4">
              <MetricCard compact title="Compact" value={42} icon={<MaterialIcon name="bolt" size={18} />} />
              <MetricCard compact title="Titre long qui passe sur deux lignes" value={9} />
            </div>
          </Specimen>

          <Specimen name="EntityRow" note="rangée d’entité — variantes list et card" interactive>
            <div className="overflow-hidden rounded-lg border border-outline-variant">
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
                actions={<IconButton icon="more_vert" aria-label="Autres actions" />}
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

          <Specimen name="StatusBadge" note="libellés issus de getStatusLabel() — ce composant ne mappe que statut → ton">
            <StateRow>
              <StateCell label="sm"><StatusBadge status="Disponible" size="sm" /></StateCell>
              <StateCell label="md"><StatusBadge status="Attribué" /></StateCell>
              <StateCell label="lg"><StatusBadge status="En réparation" size="lg" /></StateCell>
              <StateCell label="workflow"><StatusBadge status="WAITING_MANAGER_APPROVAL" /></StateCell>
              <StateCell label="rôle"><StatusBadge status="SuperAdmin" /></StateCell>
              <StateCell label="inconnu (repli neutre)"><StatusBadge status="Statut inédit" /></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="UserAvatar">
            <StateRow>
              <StateCell label="xs"><UserAvatar name="Awa Koffi" size="xs" /></StateCell>
              <StateCell label="sm"><UserAvatar name="Awa Koffi" size="sm" /></StateCell>
              <StateCell label="md"><UserAvatar name="Awa Koffi" /></StateCell>
              <StateCell label="lg"><UserAvatar name="Awa Koffi" size="lg" /></StateCell>
              <StateCell label="xl"><UserAvatar name="Awa Koffi" size="xl" /></StateCell>
              <StateCell label="SuperAdmin"><UserAvatar name="Marc Adjovi" role="SuperAdmin" size="lg" /></StateCell>
              <StateCell label="Admin"><UserAvatar name="Marc Adjovi" role="Admin" size="lg" /></StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="DemoBadge" note="politique X5 — toute donnée simulée est étiquetée">
            <DemoBadge />
          </Specimen>

          <Specimen name="MovementTimeline">
            <div className="grid gap-4 expanded:grid-cols-2">
              <MovementTimeline title="Historique" items={TIMELINE_ITEMS} emptyMessage="Aucun mouvement." />
              <MovementTimeline title="Historique (vide)" items={[]} emptyMessage="Aucun mouvement enregistré." />
            </div>
          </Specimen>

          <Specimen
            name="TableScrollArea"
            note="exception documentée : défilement horizontal assumé, première colonne épinglée"
          >
            <TableScrollArea label="Tableau de démonstration" className="rounded-lg border border-outline-variant">
              <table className="w-full min-w-[720px] border-collapse text-body-small">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface-container px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Série</th>
                    <th className="px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Modèle</th>
                    <th className="px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Catégorie</th>
                    <th className="px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Site</th>
                    <th className="px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Détenteur</th>
                    <th className="px-4 py-2 text-left text-label-small uppercase text-on-surface-variant">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row) => (
                    <tr key={row.serial} className="border-t border-outline-variant">
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left font-medium text-on-surface">{row.serial}</th>
                      <td className="px-4 py-3 text-on-surface">{row.model}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.category}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.site}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.owner}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} size="sm" /></td>
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
          <Specimen name="EmptyState">
            <div className="grid gap-4 medium:grid-cols-2">
              <EmptyState icon="inventory_2" title="Aucun équipement" description="Aucun équipement ne correspond à ces filtres." />
              <EmptyState
                icon="search_off"
                title="Aucun résultat"
                description="Élargissez la recherche ou réinitialisez les filtres."
                action={<Button variant="outlined" icon={<MaterialIcon name="restart_alt" size={18} />}>Réinitialiser les filtres</Button>}
              />
            </div>
          </Specimen>

          <Specimen name="LoadingSpinner">
            <StateRow>
              <StateCell label="sm"><LoadingSpinner size="sm" /></StateCell>
              <StateCell label="md"><LoadingSpinner /></StateCell>
              <StateCell label="lg"><LoadingSpinner size="lg" /></StateCell>
              <StateCell label="avec texte"><LoadingSpinner text="Chargement…" /></StateCell>
            </StateRow>
            <div className="mt-4">
              <p className="mb-2 text-label-small uppercase tracking-wide text-on-surface-variant">variant=&quot;linear&quot;</p>
              <LoadingSpinner variant="linear" text="Extraction du document…" />
            </div>
          </Specimen>

          <Specimen name="ErrorBoundary" note="filet de rendu — remontage par changement de key">
            <div className="space-y-4">
              <Button variant={armed ? 'outlined' : 'danger'} size="sm" onClick={() => setArmed((value) => !value)}>
                {armed ? 'Désamorcer' : 'Déclencher une exception de rendu'}
              </Button>
              <div className="rounded-lg border border-outline-variant p-4">
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

          <Specimen name="Snackbar" note="file d’attente : un message à la fois, auto-effacement 4 s">
            <StateRow>
              <StateCell label="default">
                <Button
                  variant="outlined"
                  onClick={() => pushSnack({ id: `d-${Date.now()}`, message: 'Équipement enregistré.' })}
                >
                  Afficher
                </Button>
              </StateCell>
              <StateCell label="success">
                <Button
                  variant="outlined"
                  onClick={() => pushSnack({ id: `s-${Date.now()}`, message: 'Attribution confirmée.', variant: 'success' })}
                >
                  Afficher
                </Button>
              </StateCell>
              <StateCell label="error">
                <Button
                  variant="outlined"
                  onClick={() => pushSnack({ id: `e-${Date.now()}`, message: 'Échec de l’enregistrement.', variant: 'error' })}
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
          <Specimen name="Modal / BottomSheet / SideSheet / ConfirmationDialog / Menu / Tooltip" interactive>
            <StateRow>
              <StateCell label="Modal">
                <Button variant="outlined" onClick={() => setModalOpen(true)}>Ouvrir la boîte de dialogue</Button>
              </StateCell>
              <StateCell label="BottomSheet">
                <Button variant="outlined" onClick={() => setSheetOpen(true)}>Ouvrir la feuille de bas</Button>
              </StateCell>
              <StateCell label="SideSheet">
                <Button variant="outlined" onClick={() => setSideSheetOpen(true)}>Ouvrir le panneau latéral</Button>
              </StateCell>
              <StateCell label="ConfirmationDialog">
                <Button variant="outlined" onClick={() => setConfirmOpen(true)}>Demander confirmation</Button>
              </StateCell>
              <StateCell label="Menu">
                <Menu
                  title="Actions"
                  trigger={<Button variant="outlined" icon={<MaterialIcon name="more_vert" size={18} />}>Menu</Button>}
                  items={[
                    { id: 'edit', label: 'Modifier', icon: 'edit', onSelect: () => undefined },
                    { id: 'export', label: 'Exporter', icon: 'download', trailingText: 'CSV', onSelect: () => undefined },
                    { id: 'locked', label: 'Action réservée', icon: 'lock', disabled: true, onSelect: () => undefined },
                    { id: 'delete', label: 'Supprimer', icon: 'delete', destructive: true, dividerBefore: true, onSelect: () => undefined },
                  ]}
                />
              </StateCell>
              <StateCell label="Tooltip (plain)">
                <Tooltip content="Infobulle simple — appui long au tactile" delay={200}>
                  <Button variant="outlined">Survoler</Button>
                </Tooltip>
              </StateCell>
              <StateCell label="Tooltip (rich)">
                <Tooltip
                  variant="rich"
                  placement="bottom"
                  content={
                    <div className="space-y-2">
                      <p className="text-title-small text-on-surface">Infobulle riche</p>
                      <p className="text-body-small text-on-surface-variant">Reste ouverte au survol, se ferme avec Échap.</p>
                    </div>
                  }
                >
                  <Button variant="outlined">Survoler</Button>
                </Tooltip>
              </StateCell>
            </StateRow>
          </Specimen>

          <Specimen name="FabContainer + ListActionFab" note="ancrés au coin bas-droit de la fenêtre, safe-area comprise">
            <p className="text-body-medium text-on-surface-variant">
              Les deux composants sont montés en bas à droite de cette page — la feuille d’actions s’ouvre au clic.
            </p>
          </Specimen>
        </Section>

        <footer className="border-t border-outline-variant pt-6">
          <p className="text-body-small text-on-surface-variant">
            Définition de « terminé » d’un composant, règles d’usage et matrice d’états complète :
            <span className="text-on-surface"> DESIGN_SYSTEM.md</span> — journal des évolutions :
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
            <Button variant="text" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => setModalOpen(false)}>Confirmer</Button>
          </>
        }
      >
        <p className="text-body-medium text-on-surface-variant">
          Plein écran en compact, centrée dès medium. Piège de focus actif, Échap ferme.
        </p>
      </Modal>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Feuille de bas">
        <p className="text-body-medium text-on-surface-variant">
          Poignée de glissement : un tirage vers le bas de plus de 120 px ferme la feuille.
        </p>
      </BottomSheet>

      <SideSheet
        open={sideSheetOpen}
        onClose={() => setSideSheetOpen(false)}
        title="Panneau latéral"
        description="Feuille de bas sous 840 px, panneau latéral au-delà."
        footer={<Button className="w-full" onClick={() => setSideSheetOpen(false)}>Fermer</Button>}
      >
        <p className="text-body-medium text-on-surface-variant">
          Contenu défilant, largeur standard 360 dp.
        </p>
      </SideSheet>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        variant="danger"
        title="Supprimer l’équipement"
        message="Cette action est irréversible. Tapez le mot-clé pour confirmer."
        confirmKeyword="SUPPRIMER"
        confirmText="Supprimer"
      />

      <Snackbar messages={snacks} onDismiss={dismissSnack} />

      <FabContainer description="Actions de la galerie">
        <FloatingActionButton icon="palette" aria-label="Action flottante de démonstration" />
      </FabContainer>

      <ListActionFab
        label="galerie"
        sheetTitle="Actions de démonstration"
        actions={[
          { id: 'a', label: 'Première action', icon: 'add', onSelect: () => undefined },
          { id: 'b', label: 'Deuxième action', icon: 'upload', variant: 'text', onSelect: () => undefined },
          { id: 'c', label: 'Action indisponible', icon: 'lock', disabled: true, onSelect: () => undefined },
        ]}
      />
    </div>
  );
};

export default DesignSystemGalleryPage;
