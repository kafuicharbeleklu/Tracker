/**
 * Garde de la couche de tokens du TRACKER DS (DESIGN_SYSTEM.md).
 *
 * Vérifie les invariants que la migration `--md-sys-*` → `--tk-*` a établis et
 * qu'une PR peut casser silencieusement (un token invalide ne « plante » pas :
 * il rend une couleur manquante, ce que ni le build ni ESLint ne voient) :
 *
 *   1. Aucun `--md-sys-*` orphelin : tout ancien nom est déclaré dans le bloc
 *      d'alias ET pointe vers un token `--tk-*`.
 *   2. Aucun cycle de propriétés personnalisées (un cycle invalide TOUTE la
 *      chaîne, en silence).
 *   3. Aucun token `--tk-*` ne dépend d'un alias @deprecated (sens interdit :
 *      la couche sémantique est la SOURCE).
 *   4. Toute référence `var(--…)` vise un token déclaré.
 *   5. Le pont Tailwind ne consomme que la couche sémantique.
 *   6. Les composants ne consomment que la couche sémantique (+ leurs propres
 *      tokens de composant). Les écarts connus sont listés, et la liste ne doit
 *      que rétrécir.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const CSS_PATH = path.resolve('index.css');
const CONFIG_PATH = path.resolve('tailwind.config.js');
const SRC_DIR = path.resolve('src');
/** En-tête du bloc d'alias — daté, pour ne pas confondre avec les mentions en prose. */
const ALIAS_MARKER = /ALIAS @deprecated \d{4}-\d{2}-\d{2}/;

/** Préfixes du tier 1 (primitifs) : valeurs brutes, interdites aux composants. */
const PRIMITIVE_PREFIXES = ['--cat-', '--ref-', '--color-neutral-', '--color-anthracite', '--font-'];
/** Tier 3 : tokens de composant, consommables par LEUR composant seulement. */
const COMPONENT_PREFIXES = ['--color-sidebar-', '--color-login-'];
const COMPONENT_TOKEN_OWNERS = [
  {
    prefix: '--color-sidebar-',
    owners: ['src/components/layout/Sidebar.tsx', 'src/components/layout/NavigationRail.tsx'],
  },
  { prefix: '--color-login-', owners: ['src/features/auth/pages/LoginPage.tsx'] },
];
/** Primitifs exposés à dessein par le pont Tailwind (échelle de marque Q-V5). */
const BRIDGE_PRIMITIVE_ALLOWLIST = ['--ref-brand-50', '--ref-brand-100', '--ref-brand-200'];

/**
 * Dette connue : composants consommant encore un primitif. À faire décroître —
 * ne JAMAIS ajouter d'entrée ici sans créer d'abord le rôle sémantique manquant.
 */
const COMPONENT_DEBT = new Map([
  // Icône de destination INACTIVE de la barre du bas (surface claire) : #79736B,
  // sans rôle sémantique équivalent — en créer un avant de migrer.
  ['src/components/layout/NavigationBar.tsx', ['--color-neutral-500']],
  // Panneaux de connexion : fonds locaux repris de la rampe de neutres.
  ['src/features/auth/pages/LoginPage.tsx', ['--color-neutral-50', '--color-neutral-100']],
]);

/** Namespace de thème interne à Tailwind v4 : déclaré par le framework, pas par nous. */
const TAILWIND_OWNED = /^--(tw-|spacing$|color-(white|black|slate)|radius-3xl|text-(xs|sm|base|lg|xl|\dxl)|font-weight-|leading-|tracking-|container-|blur-|ease-|animate-|drop-shadow-|default-)/;

const failures = [];
const fail = (msg) => failures.push(msg);

const css = await fs.readFile(CSS_PATH, 'utf8');
const aliasIndex = css.search(ALIAS_MARKER);
if (aliasIndex === -1) {
  fail(`index.css : en-tête du bloc d'alias (${ALIAS_MARKER}) introuvable — structure du fichier modifiée ?`);
}

// --- Inventaire des déclarations ---------------------------------------------
const declarations = new Map(); // nom -> { value, deprecated }
for (const match of css.matchAll(/^[ \t]*(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/gm)) {
  const [, name, value] = match;
  if (name.startsWith('--tw-')) continue; // shims d'animation, pas des tokens
  if (declarations.has(name)) {
    fail(`index.css : ${name} déclaré deux fois (le dernier gagne — valeur ambiguë).`);
  }
  declarations.set(name, {
    value: value.trim(),
    deprecated: aliasIndex !== -1 && match.index > aliasIndex,
  });
}

const isPrimitive = (n) => PRIMITIVE_PREFIXES.some((p) => n.startsWith(p)) || n === '--color-surface';
const isComponentToken = (n) => COMPONENT_PREFIXES.some((p) => n.startsWith(p));
const isSemantic = (n) => n.startsWith('--tk-');
const refsOf = (value) => [...value.matchAll(/var\((--[a-zA-Z0-9-]+)/g)].map((m) => m[1]);

// --- 1. Aucun --md-sys-* orphelin ---------------------------------------------
const legacyMd3 = [...declarations.keys()].filter((n) => n.startsWith('--md-sys-'));
for (const name of legacyMd3) {
  const { value, deprecated } = declarations.get(name);
  if (!deprecated) {
    fail(`${name} : déclaré hors du bloc d'alias — le vocabulaire MD3 n'est plus une source.`);
  }
  if (!/^var\(--tk-[a-zA-Z0-9-]+\)$/.test(value)) {
    fail(`${name} : orphelin — devrait être un alias « var(--tk-…) », vaut « ${value} ».`);
  }
}

// --- 2. Aucun cycle ------------------------------------------------------------
const state = new Map();
const visit = (name, stack) => {
  if (state.get(name) === 'done') return;
  if (state.get(name) === 'visiting') {
    fail(`Cycle de propriétés personnalisées : ${[...stack, name].join(' → ')}`);
    return;
  }
  state.set(name, 'visiting');
  for (const ref of refsOf(declarations.get(name)?.value ?? '')) {
    if (declarations.has(ref)) visit(ref, [...stack, name]);
  }
  state.set(name, 'done');
};
for (const name of declarations.keys()) visit(name, []);

// --- 3. La couche sémantique ne dépend jamais d'un alias -----------------------
for (const [name, { value }] of declarations) {
  if (!isSemantic(name)) continue;
  for (const ref of refsOf(value)) {
    const target = declarations.get(ref);
    if (target?.deprecated) {
      fail(`${name} → ${ref} : un token --tk-* ne doit pas dépendre d'un alias @deprecated.`);
    }
  }
}

// --- 4. Toute référence vise un token déclaré ----------------------------------
const scanRefs = (text, label) => {
  for (const ref of refsOf(text)) {
    if (declarations.has(ref) || TAILWIND_OWNED.test(ref)) continue;
    fail(`${label} : var(${ref}) ne correspond à aucun token déclaré dans index.css.`);
  }
};
scanRefs(css, 'index.css');

// --- 5. Le pont Tailwind ne consomme que la couche sémantique -------------------
const config = await fs.readFile(CONFIG_PATH, 'utf8');
scanRefs(config, 'tailwind.config.js');
for (const ref of new Set(refsOf(config))) {
  if (isSemantic(ref) || BRIDGE_PRIMITIVE_ALLOWLIST.includes(ref)) continue;
  fail(`tailwind.config.js : var(${ref}) — le pont ne doit pointer que sur --tk-* (couche sémantique).`);
}

// --- 6. Les composants ne consomment que la couche sémantique -------------------
const walk = async (dir, out = []) => {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
};

for (const file of await walk(SRC_DIR)) {
  const relative = path.relative(process.cwd(), file).split(path.sep).join('/');
  const text = await fs.readFile(file, 'utf8');
  const allowed = COMPONENT_DEBT.get(relative) ?? [];
  for (const ref of new Set(refsOf(text))) {
    if (isSemantic(ref) || TAILWIND_OWNED.test(ref)) continue;
    if (allowed.includes(ref)) continue;
    if (isComponentToken(ref)) {
      const rule = COMPONENT_TOKEN_OWNERS.find(({ prefix }) => ref.startsWith(prefix));
      if (rule?.owners.includes(relative)) continue;
      fail(`${relative} : var(${ref}) est un token de composant réservé à ${rule?.owners.join(', ')}.`);
      continue;
    }
    if (!declarations.has(ref)) {
      fail(`${relative} : var(${ref}) ne correspond à aucun token déclaré.`);
    } else if (isPrimitive(ref)) {
      fail(`${relative} : var(${ref}) est un PRIMITIF — les composants ne consomment que --tk-*.`);
    } else {
      fail(`${relative} : var(${ref}) est un alias @deprecated — migrer vers le token --tk-* équivalent.`);
    }
  }
}

// --- Verdict --------------------------------------------------------------------
const counts = {
  primitifs: [...declarations.keys()].filter(isPrimitive).length,
  sémantiques: [...declarations.keys()].filter(isSemantic).length,
  composant: [...declarations.keys()].filter(isComponentToken).length,
  alias: [...declarations.values()].filter((d) => d.deprecated).length,
};

if (failures.length > 0) {
  console.error(`✗ Garde des tokens Tracker DS : ${failures.length} problème(s)\n`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const debt = [...COMPONENT_DEBT.values()].reduce((n, refs) => n + refs.length, 0);
console.log(
  `✓ Garde des tokens Tracker DS : ${declarations.size} tokens ` +
    `(primitifs ${counts.primitifs}, sémantiques ${counts.sémantiques}, ` +
    `composant ${counts.composant}, alias @deprecated ${counts.alias}) — ` +
    `0 orphelin, 0 cycle, dette composants ${debt}.`
);
