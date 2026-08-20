import React, { useEffect, useMemo, useRef, useState } from 'react';
import uiFlowMapMarkdown from '../../../../UI_FLOW_MAP.md?raw';
import IconButton from '../../../components/ui/IconButton';
import MaterialIcon from '../../../components/ui/MaterialIcon';

type Section = {
    id: string;
    title: string;
    level: 2 | 3;
    content: string;
};

type Screen = {
    id: string;
    name: string;
    kind: 'entry' | 'screen' | 'wizard' | 'detail';
    next: string[];
    actions: Array<{ label: string; to?: string }>;
    source: string;
    issues?: string[];
};

const toId = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const parseSections = (markdown: string): Section[] => {
    const blocks = markdown.split(/\n(?=##?\s)/);
    return blocks
        .map((block) => {
            const match = block.match(/^(##|###)\s+(.+)$/m);
            if (!match) return null;
            return {
                id: toId(match[2]),
                title: match[2],
                level: match[1].length as 2 | 3,
                content: block.replace(match[0], '').trim(),
            };
        })
        .filter((section): section is Section => section !== null);
};

const screens: Screen[] = [
    { id: 'login', name: 'Login', kind: 'entry', next: ['dashboard'], actions: [{ label: 'Se connecter', to: 'dashboard' }], source: 'LoginPage.tsx' },
    { id: 'global-navigation', name: 'Navigation globale', kind: 'entry', next: ['dashboard', 'inventory', 'approvals', 'users', 'finance', 'management', 'rbac', 'locations', 'audit', 'reports', 'settings'], actions: [{ label: 'Tableau de bord', to: 'dashboard' }, { label: 'Équipements', to: 'inventory' }, { label: 'Approbations', to: 'approvals' }, { label: 'Utilisateurs', to: 'users' }, { label: 'Finances', to: 'finance' }, { label: 'Gestion', to: 'management' }, { label: 'Rôles et accès', to: 'rbac' }, { label: 'Emplacements', to: 'locations' }, { label: 'Audit', to: 'audit' }, { label: 'Rapports', to: 'reports' }, { label: 'Paramètres', to: 'settings' }], source: 'Sidebar.tsx · NavigationRail.tsx · NavigationBar.tsx' },
    {
        id: 'dashboard',
        name: 'Tableau de bord',
        kind: 'screen',
        next: ['inventory', 'assignment', 'return', 'approvals', 'audit', 'finance'],
        actions: [{ label: 'Carte statut', to: 'inventory' }, { label: 'Attribuer', to: 'assignment' }, { label: 'Restituer', to: 'return' }, { label: 'Nouvelle demande', to: 'new-request' }, { label: 'Approbations', to: 'approvals' }, { label: 'Audit', to: 'audit' }, { label: 'Finances', to: 'finance' }],
        source: 'DashboardPage.tsx',
    },
    {
        id: 'inventory',
        name: 'Équipements',
        kind: 'screen',
        next: ['equipment-details', 'add-equipment', 'import-equipment', 'user-details', 'audit-details'],
        actions: [{ label: 'Rangée équipement', to: 'equipment-details' }, { label: 'Porteur', to: 'user-details' }, { label: 'Ajouter / FAB', to: 'add-equipment' }, { label: 'Importer', to: 'import-equipment' }, { label: 'Audit', to: 'audit-details' }],
        source: 'InventoryPage.tsx',
    },
    {
        id: 'equipment-details',
        name: 'Détail équipement',
        kind: 'detail',
        next: ['inventory', 'add-equipment', 'user-details', 'assignment', 'return'],
        actions: [{ label: 'Retour', to: 'inventory' }, { label: 'Modifier', to: 'add-equipment' }, { label: 'Utilisateur courant', to: 'user-details' }, { label: 'Attribuer', to: 'assignment' }, { label: 'Restituer', to: 'return' }],
        source: 'EquipmentDetailsPage.tsx',
    },
    {
        id: 'users',
        name: 'Utilisateurs',
        kind: 'screen',
        next: ['user-details', 'add-user', 'import-users'],
        actions: [{ label: 'Rangée utilisateur', to: 'user-details' }, { label: 'Ajouter / FAB', to: 'add-user' }, { label: 'Importer', to: 'import-users' }],
        source: 'UsersPage.tsx',
    },
    {
        id: 'user-details',
        name: 'Détail utilisateur',
        kind: 'detail',
        next: ['users', 'equipment-details', 'add-user', 'assignment'],
        actions: [{ label: 'Retour', to: 'users' }, { label: 'Modifier', to: 'add-user' }, { label: 'Équipement attribué', to: 'equipment-details' }, { label: 'Attribuer', to: 'assignment' }],
        source: 'UserDetailsPage.tsx',
    },
    {
        id: 'approvals',
        name: 'Approbations',
        kind: 'screen',
        next: ['new-request', 'assignment'],
        actions: [{ label: 'Nouvelle demande / FAB', to: 'new-request' }, { label: 'Action assign', to: 'assignment' }],
        source: 'TasksPage.tsx',
    },
    { id: 'management', name: 'Gestion', kind: 'screen', next: ['category-details', 'model-details', 'import-models'], actions: [{ label: 'Catégorie', to: 'category-details' }, { label: 'Modèle', to: 'model-details' }, { label: 'Importer modèles', to: 'import-models' }], source: 'ManagementPage.tsx' },
    { id: 'category-details', name: 'Détail catégorie', kind: 'detail', next: ['model-details', 'management'], actions: [{ label: 'Modèle', to: 'model-details' }, { label: 'Retour', to: 'management' }], source: 'CategoryDetailsPage.tsx' },
    { id: 'model-details', name: 'Détail modèle', kind: 'detail', next: ['management'], actions: [{ label: 'Retour', to: 'management' }], source: 'ModelDetailsPage.tsx' },
    { id: 'import-models', name: 'Importer modèles', kind: 'wizard', next: ['management'], actions: [{ label: 'Valider', to: 'management' }], source: 'ImportModelsPage.tsx' },
    { id: 'locations', name: 'Emplacements', kind: 'screen', next: ['import-locations', 'inventory', 'users', 'audit-details'], actions: [{ label: 'Importer', to: 'import-locations' }, { label: 'Carte équipements', to: 'inventory' }, { label: 'Carte utilisateurs', to: 'users' }, { label: 'Carte audit', to: 'audit-details' }], source: 'LocationsPage.tsx' },
    { id: 'import-locations', name: 'Importer emplacements', kind: 'wizard', next: ['locations'], actions: [{ label: 'Valider', to: 'locations' }], source: 'ImportLocationsPage.tsx' },
    { id: 'rbac', name: 'Rôles et accès', kind: 'screen', next: [], actions: [], source: 'RbacPage.tsx' },
    { id: 'reports', name: 'Rapports', kind: 'screen', next: [], actions: [], source: 'ReportsPage.tsx' },
    { id: 'settings', name: 'Paramètres', kind: 'screen', next: ['login'], actions: [{ label: 'Déconnexion', to: 'login' }], source: 'SettingsPage.tsx' },
    { id: 'assignment', name: "Assistant d'attribution", kind: 'wizard', next: ['inventory'], actions: [{ label: 'Terminer', to: 'inventory' }], source: 'AssignmentWizardPage.tsx' },
    { id: 'return', name: 'Assistant de retour', kind: 'wizard', next: ['inventory'], actions: [{ label: 'Annuler', to: 'inventory' }, { label: 'Terminer', to: 'inventory' }], source: 'ReturnWizardPage.tsx' },
    { id: 'audit', name: 'Audit', kind: 'screen', next: ['audit-details'], actions: [{ label: 'Démarrer audit / FAB', to: 'audit-details' }], source: 'AuditPage.tsx' },
    { id: 'audit-details', name: "Détail audit", kind: 'detail', next: ['audit'], actions: [{ label: 'Retour', to: 'audit' }], source: 'AuditDetailsPage.tsx' },
    { id: 'finance', name: 'Finances', kind: 'screen', next: ['finance-expenses'], actions: [{ label: "Voir les dépenses de l'exercice", to: 'finance-expenses' }], source: 'FinanceManagementPage.tsx' },
    { id: 'finance-expenses', name: 'Journal des dépenses', kind: 'screen', next: ['finance'], actions: [{ label: 'Retour', to: 'finance' }], source: 'ExpenseJournalPage.tsx' },
    { id: 'add-equipment', name: 'Ajouter un équipement', kind: 'wizard', next: ['inventory', 'equipment-details'], actions: [{ label: 'Enregistrer (création)', to: 'inventory' }, { label: 'Enregistrer (édition)', to: 'equipment-details' }], source: 'AddEquipmentPage.tsx' },
    { id: 'add-user', name: 'Ajouter un utilisateur', kind: 'wizard', next: ['users', 'user-details'], actions: [{ label: 'Enregistrer (création)', to: 'users' }, { label: 'Enregistrer (édition)', to: 'user-details' }], source: 'AddUserPage.tsx' },
    { id: 'import-equipment', name: 'Importer équipements', kind: 'wizard', next: ['inventory'], actions: [{ label: 'Valider', to: 'inventory' }], source: 'ImportEquipmentPage.tsx', issues: ['Callbacks onCancel/onSave absents au montage'] },
    { id: 'import-users', name: 'Importer utilisateurs', kind: 'wizard', next: ['users'], actions: [{ label: 'Valider', to: 'users' }], source: 'ImportUsersPage.tsx', issues: ['Callbacks onCancel/onSave absents au montage'] },
    { id: 'new-request', name: 'Nouvelle demande', kind: 'wizard', next: ['approvals'], actions: [{ label: 'Soumettre', to: 'approvals' }], source: 'NewRequestPage.tsx' },
];

const kindLabel: Record<Screen['kind'], string> = {
    entry: "Porte d'entrée",
    screen: 'Écran',
    wizard: 'Workflow',
    detail: 'Détail',
};

const graphPositions: Record<string, { x: number; y: number }> = {
    login: { x: 32, y: 380 },
    'global-navigation': { x: 270, y: 660 },
    dashboard: { x: 270, y: 380 },
    inventory: { x: 560, y: 48 },
    users: { x: 560, y: 180 },
    approvals: { x: 560, y: 312 },
    audit: { x: 560, y: 444 },
    finance: { x: 560, y: 576 },
    'finance-expenses': { x: 880, y: 596 },
    'equipment-details': { x: 880, y: 20 },
    'add-equipment': { x: 1180, y: 20 },
    'import-equipment': { x: 880, y: 116 },
    'user-details': { x: 880, y: 204 },
    'add-user': { x: 1180, y: 204 },
    'import-users': { x: 880, y: 300 },
    'new-request': { x: 880, y: 388 },
    assignment: { x: 1180, y: 388 },
    return: { x: 1460, y: 388 },
    'audit-details': { x: 880, y: 500 },
    management: { x: 1180, y: 104 },
    'category-details': { x: 1460, y: 104 },
    'model-details': { x: 1460, y: 200 },
    'import-models': { x: 1460, y: 296 },
    locations: { x: 1180, y: 500 },
    'import-locations': { x: 1460, y: 500 },
    rbac: { x: 880, y: 660 },
    reports: { x: 1180, y: 660 },
    settings: { x: 1460, y: 660 },
};

const nodeWidth = 164;
const nodeHeight = 78;
const portOffset = (index: number, total: number) => {
    if (total <= 1) return nodeHeight / 2;
    return 14 + (index * (nodeHeight - 28)) / (total - 1);
};

const renderInline = (text: string) => {
    const chunks = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return chunks.map((chunk, index) => {
        if (chunk.startsWith('`')) return <code key={index} className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[0.82em] text-primary">{chunk.slice(1, -1)}</code>;
        if (chunk.startsWith('**')) return <strong key={index}>{chunk.slice(2, -2)}</strong>;
        return chunk;
    });
};

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const blocks = content.split(/\n\n+/);
    return (
        <div className="doc-markdown space-y-4 text-body-medium leading-7 text-on-surface-variant">
            {blocks.map((block, index) => {
                const lines = block.split('\n');
                if (block.startsWith('```')) {
                    return <pre key={index} className="overflow-x-auto rounded-lg bg-inverse-surface p-4 text-sm leading-6 text-inverse-on-surface"><code>{lines.slice(1, -1).join('\n')}</code></pre>;
                }
                if (block.startsWith('>')) {
                    return <blockquote key={index} className="border-l-4 border-primary/60 bg-primary-container/35 px-4 py-3 text-on-surface">{lines.map((line) => <p key={line}>{renderInline(line.replace(/^>\s?/, ''))}</p>)}</blockquote>;
                }
                if (lines.every((line) => /^[-*]\s/.test(line))) {
                    return <ul key={index} className="list-disc space-y-1 pl-5">{lines.map((line) => <li key={line}>{renderInline(line.replace(/^[-*]\s/, ''))}</li>)}</ul>;
                }
                if (lines.every((line) => /^\|/.test(line))) {
                    return <div key={index} className="overflow-x-auto rounded-lg border border-outline-variant"><table><tbody>{lines.filter((line) => !/^\|\s*---/.test(line)).map((line) => <tr key={line}>{line.split('|').filter(Boolean).map((cell, cellIndex) => <td key={cellIndex} className="border-b border-outline-variant px-3 py-2 align-top">{renderInline(cell.trim())}</td>)}</tr>)}</tbody></table></div>;
                }
                if (/^---+$/.test(block.trim())) return <hr key={index} className="border-outline-variant" />;
                return <p key={index}>{lines.map((line, lineIndex) => <React.Fragment key={lineIndex}>{renderInline(line)}{lineIndex < lines.length - 1 && <br />}</React.Fragment>)}</p>;
            })}
        </div>
    );
};

const _RelationshipInspector: React.FC<{
    selectedScreen: Screen;
    onSelectScreen: (screen: Screen) => void;
}> = ({ selectedScreen, onSelectScreen }) => {
    const incoming = screens.filter((screen) =>
        screen.actions.some((action) => action.to === selectedScreen.id),
    );
    const outgoing = selectedScreen.actions.filter((action) => action.to);

    return (
        <div className="mb-5 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-elevation-1">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-3">
                <div className="flex items-center gap-2 text-label-medium text-on-surface-variant">
                    <MaterialIcon name="account_tree" size={18} className="text-primary" />
                    Points d'ouverture, actions et écrans cibles
                </div>
                <span className="rounded-full bg-primary-container px-2.5 py-1 text-label-small text-on-primary-container">
                    {incoming.length} entrée{incoming.length !== 1 ? 's' : ''} · {outgoing.length} sortie{outgoing.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1fr_72px_minmax(240px,0.9fr)_72px_1fr]">
                <div className="p-4">
                    <p className="mb-3 text-label-medium text-on-surface-variant">POINTS D'OUVERTURE</p>
                    <div className="space-y-2">
                        {incoming.length ? incoming.map((screen) => {
                            const actions = screen.actions.filter((action) => action.to === selectedScreen.id);
                            return <button key={screen.id} type="button" onClick={() => onSelectScreen(screen)} className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-surface-container"><span className="block text-label-small text-on-surface-variant">{actions.map((action) => action.label).join(' · ')}</span><span className="mt-1 block text-label-large text-on-surface">{screen.name}</span></button>;
                        }) : <p className="rounded-lg border border-dashed border-outline-variant p-3 text-body-small text-on-surface-variant">Aucun point d'ouverture routé.</p>}
                    </div>
                </div>
                <div className="hidden items-center justify-center lg:flex"><MaterialIcon name="arrow_forward" className="text-primary" size={28} /></div>
                <div className="flex items-center bg-primary-container/35 p-4">
                    <div className="w-full rounded-lg border-2 border-primary bg-primary p-4 text-on-primary shadow-elevation-2"><span className="text-label-small opacity-80">PLANCHE SÉLECTIONNÉE · {kindLabel[selectedScreen.kind]}</span><h3 className="mt-2 text-title-large font-semibold">{selectedScreen.name}</h3><p className="mt-2 text-body-small opacity-90">Source : {selectedScreen.source}</p></div>
                </div>
                <div className="hidden items-center justify-center lg:flex"><MaterialIcon name="arrow_forward" className="text-primary" size={28} /></div>
                <div className="p-4">
                    <p className="mb-3 text-label-medium text-on-surface-variant">BOUTONS ET DESTINATIONS</p>
                    <div className="space-y-2">
                        {outgoing.length ? outgoing.map((action) => {
                            const target = screens.find((screen) => screen.id === action.to);
                            return <button key={action.label} type="button" onClick={() => target && onSelectScreen(target)} className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-surface-container"><span className="flex items-center justify-between gap-2 text-label-large text-on-surface"><span>{action.label}</span><MaterialIcon name="arrow_forward" size={18} /></span><span className="mt-1 block text-body-small text-primary">{target?.name ?? 'Destination non résolue'}</span></button>;
                        }) : <p className="rounded-lg border border-dashed border-outline-variant p-3 text-body-small text-on-surface-variant">Aucune sortie routée documentée.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FlowCanvas: React.FC<{
    selectedScreen: Screen;
    onSelectScreen: (screen: Screen) => void;
}> = ({ selectedScreen, onSelectScreen }) => {
    const [positions, setPositions] = useState(graphPositions);
    const [zoom, setZoom] = useState(0.78);
    const [spacing, setSpacing] = useState(1.45);
    const [isPositionMode, setIsPositionMode] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [miniMapOpen, setMiniMapOpen] = useState(true);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [activeDomain, setActiveDomain] = useState('all');
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({ navigation: true, workflow: true, import: true, return: true, standard: true });
    const viewportRef = useRef<HTMLDivElement>(null);
    const domains: Record<string, Set<string>> = {
        all: new Set(screens.map((screen) => screen.id)),
        equipment: new Set(['dashboard', 'inventory', 'equipment-details', 'add-equipment', 'import-equipment', 'assignment', 'return', 'new-request']),
        users: new Set(['dashboard', 'users', 'user-details', 'add-user', 'import-users', 'assignment']),
        management: new Set(['dashboard', 'management', 'category-details', 'model-details', 'import-models', 'locations', 'import-locations', 'rbac', 'settings']),
        operations: new Set(['dashboard', 'approvals', 'audit', 'audit-details', 'finance', 'finance-expenses', 'reports']),
    };
    const edgeColor: Record<string, string> = { navigation: '#8aa6a0', workflow: '#f7c948', import: '#4cc9c0', return: '#ef8f72', standard: '#79b8ff' };
    const edgeLabel: Record<string, string> = { navigation: 'Navigation globale', workflow: 'Workflow', import: 'Import', return: 'Retour / sortie', standard: 'Navigation' };
    const edgeType = (edge: { from: string; to: string; label: string }) => {
        if (edge.from === 'global-navigation') return 'navigation';
        if (/import/i.test(edge.label) || /import/i.test(edge.from) || /import/i.test(edge.to)) return 'import';
        if (/retour|annuler|d.connexion/i.test(edge.label)) return 'return';
        return ['assignment', 'return', 'new-request'].includes(edge.to) ? 'workflow' : 'standard';
    };
    const canvasWidth = Math.round(1660 * spacing);
    const canvasHeight = Math.round(820 * spacing);
    const positionFor = (id: string) => ({
        x: positions[id].x * spacing,
        y: positions[id].y * spacing,
    });
    const moveNode = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
        if (!isPositionMode || event.buttons !== 1) return;
        setPositions((current) => ({
            ...current,
            [id]: {
                x: Math.max(12, current[id].x + event.movementX / (zoom * spacing)),
                y: Math.max(12, current[id].y + event.movementY / (zoom * spacing)),
            },
        }));
    };
    const domainScreens = domains[activeDomain] ?? domains.all;
    const visibleScreens = screens.filter((screen) => graphPositions[screen.id] && (activeDomain === 'all' || domainScreens.has(screen.id) || screen.id === 'global-navigation'));
    const rawEdges = visibleScreens.flatMap((screen) =>
        screen.actions
            .filter((action) => action.to && graphPositions[action.to] && visibleScreens.some((target) => target.id === action.to))
            .map((action, sourceIndex) => ({
                from: screen.id,
                to: action.to!,
                label: action.label,
                sourceIndex,
                sourceCount: screen.actions.length,
                type: edgeType({ from: screen.id, to: action.to!, label: action.label }),
            })),
    );
    const graphEdges = rawEdges.filter((edge) => activeFilters[edge.type]).map((edge) => {
        const targetEdges = rawEdges.filter((candidate) => candidate.to === edge.to);
        return {
            ...edge,
            targetIndex: targetEdges.findIndex((candidate) => candidate === edge),
            targetCount: targetEdges.length,
        };
    });
    const selectedEdge = graphEdges.find((edge) => `${edge.from}:${edge.label}:${edge.to}` === selectedEdgeId);
    const focusScreens = new Set([selectedScreen.id, ...graphEdges.filter((edge) => edge.from === selectedScreen.id || edge.to === selectedScreen.id).flatMap((edge) => [edge.from, edge.to])]);
    const resetLayout = () => {
        setPositions(graphPositions);
        setZoom(0.78);
        setSpacing(1.45);
        setFocusMode(false);
        setSelectedEdgeId(null);
        window.requestAnimationFrame(() => {
            const viewport = viewportRef.current;
            if (viewport) {
                viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
                viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
            }
        });
    };

    return (
        <div className="relative flex h-full flex-col overflow-hidden border-y border-outline-variant bg-[#15211f] shadow-elevation-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/15 px-5 py-3 text-white">
                <div><p className="text-label-large text-primary">VUE CANEVAS</p><p className="mt-0.5 text-body-small text-white/70">Chaque ligne représente un bouton ou une action qui ouvre une autre planche.</p></div>
                <div className="flex items-center gap-3 text-label-small text-white/70"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Planche sélectionnée</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#8aa6a0]" />Relation routée</span></div>
            </div>
            <div className="border-b border-white/10 bg-black/20 px-4 py-3 text-white">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div className="flex items-center gap-1"><IconButton icon="remove" variant="nav" size={18} density="dense" aria-label="Réduire le zoom" onClick={() => setZoom((value) => Math.max(0.55, value - 0.1))} /><span className="min-w-12 text-center text-label-medium">{Math.round(zoom * 100)}%</span><IconButton icon="add" variant="nav" size={18} density="dense" aria-label="Augmenter le zoom" onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))} /></div>
                    <label className="flex items-center gap-2 text-label-medium">Espacement <input aria-label="Espacement des relations" type="range" min="80" max="145" value={Math.round(spacing * 100)} onChange={(event) => setSpacing(Number(event.target.value) / 100)} className="accent-primary" /><span className="w-9 text-right text-white/70">{Math.round(spacing * 100)}%</span></label>
                    <label className="flex items-center gap-2 text-label-medium">Domaine <select value={activeDomain} onChange={(event) => setActiveDomain(event.target.value)} className="h-8 rounded-md border border-white/20 bg-[#20312e] px-2 text-label-small text-white"><option value="all">Tous</option><option value="equipment">Equipements</option><option value="users">Utilisateurs</option><option value="management">Gestion</option><option value="operations">Operations</option></select></label>
                    {Object.keys(edgeLabel).map((type) => <button key={type} type="button" onClick={() => setActiveFilters((current) => ({ ...current, [type]: !current[type] }))} className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] ${activeFilters[type] ? 'border-white/35 bg-white/10 text-white' : 'border-white/10 text-white/40'}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: edgeColor[type] }} />{edgeLabel[type]}</button>)}
                    <button type="button" onClick={() => setFocusMode((value) => !value)} className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-label-medium ${focusMode ? 'border-primary bg-primary text-on-primary' : 'border-white/20 text-white hover:bg-white/10'}`}><MaterialIcon name="center_focus_strong" size={17} />Focus</button>
                    <button type="button" onClick={() => setIsPositionMode((value) => !value)} className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-label-medium transition-colors ${isPositionMode ? 'border-primary bg-primary text-on-primary' : 'border-white/20 text-white hover:bg-white/10'}`}><MaterialIcon name="open_with" size={17} />Positionner</button>
                    <button type="button" onClick={resetLayout} className="inline-flex h-8 items-center gap-2 rounded-md border border-white/20 px-3 text-label-medium text-white hover:bg-white/10"><MaterialIcon name="fit_screen" size={17} />Organiser</button>
                    <button type="button" onClick={() => setMiniMapOpen((value) => !value)} className="inline-flex h-8 items-center gap-2 rounded-md border border-white/20 px-3 text-label-medium text-white hover:bg-white/10"><MaterialIcon name="map" size={17} />Mini-carte</button>
                    <span className="text-body-small text-white/60">{isPositionMode ? 'Glissez les planches pour les repositionner.' : 'Activez Positionner pour déplacer une planche.'}</span>
                </div>
            </div>
            <div ref={viewportRef} className="min-h-0 flex-1 overflow-auto p-4">
                <div style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
                    <div className="relative rounded-lg border border-white/10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[size:18px_18px]" style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} aria-label="Relations entre les planches">
                        <defs>{Object.entries(edgeColor).map(([type, color]) => <marker key={type} id={`flow-arrow-${type}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill={color} /></marker>)}</defs>
                        {graphEdges.map((edge, edgeIndex) => {
                            const from = positionFor(edge.from);
                            const to = positionFor(edge.to);
                            const goesRight = to.x >= from.x;
                            const startX = goesRight ? from.x + nodeWidth : from.x;
                            const endX = goesRight ? to.x : to.x + nodeWidth;
                            const startY = from.y + portOffset(edge.sourceIndex, edge.sourceCount);
                            const endY = to.y + portOffset(edge.targetIndex, edge.targetCount);
                            const direction = goesRight ? 1 : -1;
                            const laneOffset = 34 + ((edge.sourceIndex + edgeIndex) % 7) * 14;
                            const laneX = startX + direction * laneOffset;
                            const active = edge.from === selectedScreen.id || edge.to === selectedScreen.id;
                            const edgeId = `${edge.from}:${edge.label}:${edge.to}`;
                            const selected = edgeId === selectedEdgeId;
                            const dimmed = focusMode && !focusScreens.has(edge.from) && !focusScreens.has(edge.to);
                            return <path key={edgeId} onClick={() => { setSelectedEdgeId(edgeId); const source = screens.find((screen) => screen.id === edge.from); if (source) onSelectScreen(source); }} className="cursor-pointer" d={`M ${startX} ${startY} H ${laneX} V ${endY} H ${endX}`} fill="none" stroke={selected ? '#ffffff' : edgeColor[edge.type]} strokeWidth={selected ? 4 : active ? 2.6 : 1.7} strokeDasharray={edge.type === 'navigation' ? '5 5' : undefined} opacity={dimmed ? 0.08 : active || selected ? 1 : 0.62} markerEnd={`url(#flow-arrow-${edge.type})`} />;
                        })}
                    </svg>
                    {graphEdges.filter((edge) => edge.from === selectedScreen.id).map((edge) => {
                        const from = positionFor(edge.from);
                        const to = positionFor(edge.to);
                        return <div key={`label-${edge.label}`} className="pointer-events-none absolute z-20 max-w-36 truncate rounded-md bg-[#f7c948] px-2 py-0.5 text-[11px] font-medium text-[#15211f] shadow-sm" style={{ left: Math.max(8, (from.x + to.x) / 2), top: Math.max(8, (from.y + to.y) / 2) }}>{edge.label}</div>;
                    })}
                    {visibleScreens.map((screen) => {
                        const position = positionFor(screen.id);
                        const active = screen.id === selectedScreen.id;
                        const related = screen.actions.some((action) => action.to === selectedScreen.id) || selectedScreen.actions.some((action) => action.to === screen.id);
                        const incomingEdges = graphEdges.filter((edge) => edge.to === screen.id);
                        return <button key={screen.id} type="button" onClick={() => onSelectScreen(screen)} onPointerDown={(event) => { if (isPositionMode) event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => moveNode(event, screen.id)} className={`absolute z-10 w-[164px] rounded-lg border p-3 text-left shadow-lg transition-all duration-short4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isPositionMode ? 'cursor-grab active:cursor-grabbing' : ''} ${active ? 'scale-[1.04] border-primary bg-primary text-on-primary shadow-[0_0_0_4px_rgba(247,201,72,0.18)]' : related ? 'border-[#b9d3cc] bg-[#28453f] text-white hover:-translate-y-0.5' : 'border-white/15 bg-[#20312e] text-white/85 hover:border-white/50 hover:-translate-y-0.5'}`} style={{ left: position.x, top: position.y, minHeight: nodeHeight }}>{incomingEdges.map((edge) => <span key={`in-${edge.from}-${edge.label}`} className="absolute -left-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#15211f] bg-[#8aa6a0]" style={{ top: portOffset(edge.targetIndex, edge.targetCount) }} title={`${edge.from} → ${edge.label}`} />)}{screen.actions.map((action, index) => <span key={`out-${action.label}`} className="absolute -right-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#15211f] bg-primary" style={{ top: portOffset(index, screen.actions.length) }} title={`${action.label} → ${action.to ?? 'surface locale'}`} />)}<span className="block text-[10px] font-medium uppercase tracking-wide opacity-70">{kindLabel[screen.kind]}</span><span className="mt-1 block text-sm font-semibold leading-5">{screen.name}</span><span className="mt-1 flex items-center justify-between text-[11px] opacity-65"><span>{incomingEdges.length} entrée{incomingEdges.length !== 1 ? 's' : ''}</span><span>{screen.actions.length} sortie{screen.actions.length !== 1 ? 's' : ''}</span></span></button>;
                    })}
                    </div>
                </div>
            </div>
            {miniMapOpen ? <div className="absolute bottom-5 right-5 z-30 w-48 rounded-lg border border-white/20 bg-[#111b19]/95 p-3 shadow-xl"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/65"><span>Mini-carte</span><button type="button" onClick={resetLayout} className="text-primary hover:text-white">Centrer</button></div><div className="relative h-24 overflow-hidden rounded-md border border-white/10 bg-[#15211f]">{visibleScreens.map((screen) => { const position = positionFor(screen.id); return <button key={`mini-${screen.id}`} type="button" aria-label={`Afficher ${screen.name}`} onClick={() => onSelectScreen(screen)} className={`absolute h-1.5 w-2 rounded-sm ${screen.id === selectedScreen.id ? 'bg-primary' : 'bg-[#8aa6a0]'}`} style={{ left: `${(position.x / canvasWidth) * 100}%`, top: `${(position.y / canvasHeight) * 100}%` }} />; })}</div></div> : null}
            {selectedEdge ? <div className="absolute bottom-5 left-5 z-30 max-w-xs rounded-lg border border-white/20 bg-[#111b19]/95 p-4 text-white shadow-xl"><div className="flex items-start justify-between gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: edgeColor[selectedEdge.type] }}>{edgeLabel[selectedEdge.type]}</p><p className="mt-1 text-sm font-semibold">{selectedEdge.label}</p></div><button type="button" aria-label="Fermer l'inspecteur" onClick={() => setSelectedEdgeId(null)} className="text-white/60 hover:text-white"><MaterialIcon name="close" size={18} /></button></div><p className="mt-3 text-xs text-white/70">{screens.find((screen) => screen.id === selectedEdge.from)?.name} vers {screens.find((screen) => screen.id === selectedEdge.to)?.name}</p><p className="mt-2 text-[11px] text-white/45">Cliquez une autre ligne pour examiner une action distincte.</p></div> : null}
        </div>
    );
};

const DocumentationExplorerPage: React.FC = () => {
    const sections = useMemo(() => parseSections(uiFlowMapMarkdown), []);
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
    const [selectedScreen, setSelectedScreen] = useState<Screen>(screens[1]);
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
    }, [dark]);

    const normalizedQuery = query.trim().toLowerCase();
    const visibleSections = sections.filter((section) => !normalizedQuery || `${section.title} ${section.content}`.toLowerCase().includes(normalizedQuery));
    const relatedScreens = screens.filter((screen) => selectedScreen.next.includes(screen.id) || screen.next.includes(selectedScreen.id));
    const selectSection = (section: Section) => {
        setActiveId(section.id);
        setSidebarOpen(false);
        window.setTimeout(() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    };

    return (
        <div className="min-h-screen bg-background text-on-surface">
            <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
                    <a href="#/documentation/ui-flow-map" className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary"><MaterialIcon name="account_tree" size={19} /></span>
                        <span className="truncate text-title-medium font-semibold">Neemba <span className="text-on-surface-variant">Docs</span></span>
                    </a>
                    <div className="mx-auto hidden min-w-[280px] max-w-xl flex-1 md:block">
                        <label className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <MaterialIcon name="search" size={20} className="text-on-surface-variant" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans la documentation" className="min-w-0 flex-1 bg-transparent text-body-medium outline-none placeholder:text-on-surface-variant" />
                            <kbd className="hidden rounded-md border border-outline-variant px-1.5 text-label-small text-on-surface-variant lg:inline">/</kbd>
                        </label>
                    </div>
                    <IconButton icon={dark ? 'light_mode' : 'dark_mode'} variant="standard" selected={false} aria-label="Changer de thème" onClick={() => setDark((value) => !value)} />
                </div>
                <div className="border-t border-outline-variant px-4 py-2 md:hidden">
                    <label className="flex h-10 items-center gap-2 rounded-lg bg-surface-container px-3"><MaterialIcon name="search" size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
                </div>
            </header>

            <div className="mx-auto h-[calc(100vh-4rem)] max-w-none">
                <aside className="hidden" onClick={() => setSidebarOpen(false)}>
                    <nav className="h-full w-[288px] overflow-y-auto border-r border-outline-variant bg-surface p-4 lg:w-auto" onClick={(event) => event.stopPropagation()} aria-label="Navigation de la documentation">
                        <p className="mb-3 px-3 text-label-medium uppercase tracking-wide text-on-surface-variant">UI Flow Map</p>
                        <button type="button" onClick={() => selectSection(sections[0])} className="mb-2 flex w-full items-center gap-3 rounded-lg bg-primary-container px-3 py-2.5 text-left text-label-large text-on-primary-container"><MaterialIcon name="space_dashboard" size={19} />Vue d'ensemble</button>
                        {sections.filter((section) => section.level === 2).map((section) => (
                            <button key={section.id} type="button" onClick={() => selectSection(section)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-body-medium transition-colors ${activeId === section.id ? 'bg-surface-container-high text-on-surface font-medium' : 'text-on-surface-variant hover:bg-surface-container'}`}><MaterialIcon name="description" size={18} />{section.title}</button>
                        ))}
                    </nav>
                </aside>

                <main className="h-full min-w-0 p-0 [&>div:first-child]:hidden [&>section:nth-child(2)]:hidden [&>section:nth-child(3)]:mb-0 [&>section:nth-child(3)]:h-full [&>section:nth-child(3)>div:first-child]:hidden [&>section:last-child]:hidden">
                    <div className="mb-8 flex items-center gap-2 text-label-medium text-on-surface-variant"><span>Documentation</span><MaterialIcon name="chevron_right" size={16} /><span>Architecture</span><MaterialIcon name="chevron_right" size={16} /><span className="text-on-surface">UI Flow Map</span></div>
                    <section className="mb-10 border-b border-outline-variant pb-10">
                        <div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary-container px-3 py-1 text-label-medium text-on-primary-container">Architecture</span><span className="rounded-full bg-secondary-container px-3 py-1 text-label-medium text-on-secondary-container">33 écrans analysés</span><span className="rounded-full bg-error-container px-3 py-1 text-label-medium text-on-error-container">10 points d'audit</span></div>
                        <h1 className="text-headline-large font-semibold text-on-surface sm:text-display-small">Cartographie de la navigation</h1>
                        <p className="mt-3 max-w-3xl text-body-large leading-7 text-on-surface-variant">Une exploration structurée de l'architecture de navigation Neemba Tracker, de ses écrans, de ses workflows et de leurs dépendances.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-outline-variant bg-surface-container p-4"><p className="text-label-medium text-on-surface-variant">Écrans cartographiés</p><p className="mt-1 text-headline-medium font-semibold">{screens.length}</p></div><div className="rounded-lg border border-outline-variant bg-surface-container p-4"><p className="text-label-medium text-on-surface-variant">Relations directes</p><p className="mt-1 text-headline-medium font-semibold">{screens.reduce((total, screen) => total + screen.next.length, 0)}</p></div><div className="rounded-lg border border-outline-variant bg-surface-container p-4"><p className="text-label-medium text-on-surface-variant">Sections source</p><p className="mt-1 text-headline-medium font-semibold">{sections.filter((section) => section.level === 2).length}</p></div></div>
                    </section>

                    <section className="mb-12" aria-labelledby="flow-explorer"><div className="mb-5 flex items-center justify-between"><div><p className="text-label-large text-primary">EXPLORATEUR INTERACTIF</p><h2 id="flow-explorer" className="mt-1 text-headline-medium font-semibold">Graphe des parcours</h2></div><span className="hidden items-center gap-1 text-label-medium text-on-surface-variant sm:flex"><MaterialIcon name="ads_click" size={17} />Sélectionnez un écran</span></div>
                        <FlowCanvas selectedScreen={selectedScreen} onSelectScreen={setSelectedScreen} />
                        <div className="hidden grid overflow-hidden rounded-xl border border-outline-variant bg-surface lg:grid-cols-[minmax(0,1fr)_300px]">
                            <div className="min-h-[410px] border-b border-outline-variant bg-surface-container-low p-5 lg:border-b-0 lg:border-r">
                                <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                    {screens.map((screen) => <button key={screen.id} type="button" onClick={() => setSelectedScreen(screen)} className={`relative z-10 min-h-[76px] rounded-lg border p-3 text-left transition-all duration-short4 ${selectedScreen.id === screen.id ? 'border-primary bg-primary text-on-primary shadow-elevation-2' : (selectedScreen.next.includes(screen.id) || screen.next.includes(selectedScreen.id)) ? 'border-secondary bg-secondary-container text-on-secondary-container' : 'border-outline-variant bg-surface text-on-surface hover:border-outline hover:bg-surface-container'}`}><span className="block text-label-small opacity-75">{kindLabel[screen.kind]}</span><span className="mt-1 block text-label-large leading-5">{screen.name}</span></button>)}
                                </div>
                            </div>
                            <aside className="p-5"><span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-small text-on-surface-variant">{kindLabel[selectedScreen.kind]}</span><h3 className="mt-3 text-title-large font-semibold">{selectedScreen.name}</h3><div className="mt-5"><p className="text-label-medium text-on-surface-variant">ACTIONS DISPONIBLES</p><div className="mt-2 flex flex-wrap gap-2">{selectedScreen.actions.length ? selectedScreen.actions.map((action) => <span key={action.label} className="rounded-md bg-primary-container px-2.5 py-1 text-label-medium text-on-primary-container">{action.label}</span>) : <span className="text-body-small text-on-surface-variant">Aucune transition sortante</span>}</div></div><div className="mt-5"><p className="text-label-medium text-on-surface-variant">ÉCRANS LIÉS</p><div className="mt-2 space-y-1">{relatedScreens.map((screen) => <button key={screen.id} type="button" onClick={() => setSelectedScreen(screen)} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-body-medium hover:bg-surface-container"><span>{screen.name}</span><MaterialIcon name="arrow_forward" size={17} /></button>)}</div></div></aside>
                        </div>
                    </section>

                    <section className="hidden mb-12" aria-labelledby="screens"><div className="mb-5"><p className="text-label-large text-primary">RÉPERTOIRE</p><h2 id="screens" className="mt-1 text-headline-medium font-semibold">Écrans et fonctionnalités</h2></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{screens.map((screen) => <button type="button" key={screen.id} onClick={() => { setSelectedScreen(screen); document.getElementById('flow-explorer')?.scrollIntoView({ behavior: 'smooth' }); }} className="group rounded-lg border border-outline-variant bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elevation-1"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container-high text-primary"><MaterialIcon name={screen.kind === 'wizard' ? 'account_tree' : screen.kind === 'detail' ? 'article' : 'web'} size={19} /></span><span className="rounded-full bg-surface-container-high px-2 py-1 text-label-small text-on-surface-variant">{kindLabel[screen.kind]}</span></div><h3 className="mt-4 text-title-medium font-semibold">{screen.name}</h3><p className="mt-1 text-body-small text-on-surface-variant">{screen.next.length} transition{screen.next.length !== 1 ? 's' : ''} documentée{screen.next.length !== 1 ? 's' : ''}</p></button>)}</div></section>

                    <section aria-labelledby="source"><div className="mb-5"><p className="text-label-large text-primary">DOCUMENT SOURCE</p><h2 id="source" className="mt-1 text-headline-medium font-semibold">Analyse complète</h2><p className="mt-2 text-body-medium text-on-surface-variant">Le contenu ci-dessous est chargé directement depuis <code className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-primary">UI_FLOW_MAP.md</code>.</p></div>{visibleSections.length ? <div className="space-y-3">{visibleSections.map((section) => <details key={section.id} id={section.id} open={activeId === section.id} className="group scroll-mt-24 rounded-lg border border-outline-variant bg-surface"><summary onClick={() => setActiveId(section.id)} className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-title-medium font-semibold marker:hidden"><span>{section.title}</span><MaterialIcon name="expand_more" className="transition-transform group-open:rotate-180" /></summary><div className="border-t border-outline-variant px-5 py-5"><MarkdownContent content={section.content} /></div></details>)}</div> : <div className="rounded-lg border border-outline-variant p-8 text-center text-body-medium text-on-surface-variant">Aucun résultat pour « {query} ».</div>}</section>
                </main>
            </div>
        </div>
    );
};

export default DocumentationExplorerPage;
