/**
 * Garde-fou de conformité du TRACKER DS (`npm run ds:check`, CI-bloquant).
 *
 * Anciennement `check-md3-compliance.mjs` / `md3:check` : renommé le 2026-07-25 avec
 * le passage au design system propriétaire « Tracker DS » (le vocabulaire MD3 n'est
 * plus une source, cf. DESIGN_SYSTEM.md).
 *
 * PÉRIMÈTRE — `src/**` en entier (+ `index.html`). L'audit mobile §1.3 a montré que
 * les règles de couleur ne couvraient que `src/components/**` : `features/` y
 * échappait, et c'est précisément là que vivaient les seuls écarts (LoginPage).
 * Une règle qui ne s'applique qu'aux fichiers déjà conformes ne garde rien.
 *
 * ANTI-RÉGRESSION — les règles ci-dessous outillent une partie des « Interdits absolus »
 * de DESIGN_BRIEF.md §8 (contrat ADN mobile v1). La couverture est PARTIELLE et l'écart
 * est documenté dans le tableau §8 du brief : les interdits qui portent sur la structure
 * et la composition (icône destructive en liste, bouton désactivé + phrase, carte
 * orpheline, formulaire incrusté…) ne sont pas décidables par une analyse lexicale et se
 * vérifient en revue. Ne pas les simuler ici par des heuristiques faussement rassurantes.
 *
 * Ce que le script bloque (exit 1) :
 *   1. Classes héritées purgées du pont Tailwind (`*-dark`, `surface-subtle`,
 *      `rounded-pill`, `duration-micro/macro`, `variant="outline"`).
 *   2. Rayons hors échelle 2/4/8/full (`rounded` nu, `rounded-2xl`, `rounded-3xl`).
 *   3. Jaune/ambre Tailwind brut (la marque passe par les tokens ; warning = orange).
 *   4. Palette Tailwind nommée + blanc/noir OPAQUES — désormais dans tout `src/**`.
 *   5. Couleurs hex écrites en dur — désormais SANS liste d'exception : les valeurs
 *      brutes vivent exclusivement dans le fichier de tokens (`index.css`, hors `src/`).
 *      Seule exception connue et assumée, hors périmètre de ce scan : le
 *      `<meta name="theme-color">` d'`index.html`, qu'aucune variable CSS ne peut porter.
 *   6. Contrôles natifs (`<button>`, `<input>`…) hors primitives `src/components/ui/**`.
 *   7. Tailwind par CDN / config inline dans `index.html`.
 *
 * Ce que le script AVERTIT sans bloquer (exit 0) :
 *   8. `title=` porteur d'information seule sur un élément natif (DESIGN_BRIEF.md §8.3,
 *      § Tooltip du DS) —
 *      l'attribut natif ne se déclenche pas au tap et n'est pas vocalisé de façon
 *      fiable ; il n'est toléré qu'en REDONDANCE d'une information déjà visible ou
 *      déjà portée par `aria-label`. Avertissement et non erreur : la redondance
 *      « libellé visible juste à côté » n'est pas décidable par une analyse lexicale.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const INDEX_HTML_PATH = path.resolve('index.html');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);
const UI_COMPONENTS_PREFIX = `${path.normalize('src/components/ui')}${path.sep}`;

// Clés purgées de tailwind.config.js le 2026-07-25 (§8 → Tracker DS). Une clé de
// couleur engendre TOUS les utilitaires de couleur, pas seulement bg-/text- : la
// purge de `dark` avait laissé passer un `fill-dark` vivant. On couvre donc tous
// les préfixes, sinon la classe morte ne rend simplement plus rien, en silence.
const COLOR_UTILITY_PREFIXES =
  'bg|text|border|ring|outline|divide|fill|stroke|accent|caret|decoration|shadow|from|via|to|placeholder';

const FORBIDDEN_PATTERNS = [
  new RegExp(`\\b(?:${COLOR_UTILITY_PREFIXES})-dark(?:-light)?\\b`, 'g'),
  new RegExp(`\\b(?:${COLOR_UTILITY_PREFIXES})-surface-(?:subtle|background)\\b`, 'g'),
  /\brounded(?:-[trblxyse])?-pill\b/g,
  /\bduration-(?:micro|macro)\b/g,
  /variant\s*=\s*["']outline["']/g,
  // Design System Caterpillar : interdiction du jaune/ambre Tailwind brut
  // (la marque passe par les tokens ; warning = orange). Voir docs/DESIGN_TOKENS_SPEC.md.
  /\b(?:bg|text|border|ring)-(?:amber|yellow)-(?:50|100|200|300|400|500|600|700|800|900)\b/g,
  // Rayons : `rounded` nu (défaut Tailwind, hors tokens) et 2xl/3xl (non remappés)
  // sont interdits — échelle effective 2/4/8/full, voir DESIGN_TOKENS_SPEC.md §4.1.
  /\brounded\b(?![-\w])/g,
  /\brounded-(?:2xl|3xl)\b/g,
];
const NATIVE_CONTROL_PATTERN = /<(button|input|select|textarea)\b/;

// Toute couleur passe par les tokens : palette Tailwind nommée et blanc/noir
// OPAQUES interdits — les overlays alpha sur fond sombre (bg-white/5, bg-white/95)
// restent permis. Voir docs/AUDIT_DESIGN_SYSTEM.md §6.
// Périmètre élargi de `src/components/**` à `src/**` le 2026-07-25 (Tracker DS v1,
// tâche 5a) : `features/` portait les 6 seuls écarts du dépôt.
const RAW_COLOR_PATTERNS = [
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|divide)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
  /\b(?:bg-white|text-black)\b(?!\/)/g,
];

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/g;

const NATIVE_CONTROL_ALLOWLIST = new Set([
  path.normalize('src/components/layout/ListTemplate.tsx'),
  path.normalize('src/components/layout/NavigationBar.tsx'),
  path.normalize('src/features/audit/pages/AuditDetailsPage.tsx'),
  path.normalize('src/features/finance/components/AddBudgetModal.tsx'),
  path.normalize('src/features/finance/components/AddExpenseModal.tsx'),
  path.normalize('src/features/finance/pages/FinanceManagementPage.tsx'),
  path.normalize('src/features/inventory/pages/EquipmentDetailsPage.tsx'),
  path.normalize('src/features/inventory/pages/InventoryPage.tsx'),
  path.normalize('src/features/management/components/RbacManagementPanel.tsx'),
  path.normalize('src/features/management/pages/CategoryDetailsPage.tsx'),
  path.normalize('src/features/management/pages/ManagementPage.tsx'),
  path.normalize('src/features/management/pages/ModelDetailsPage.tsx'),
  path.normalize('src/features/tasks/pages/TasksPage.tsx'),
  path.normalize('src/features/users/pages/UserDetailsPage.tsx'),
  path.normalize('src/features/users/pages/UsersPage.tsx'),
]);

/**
 * `title=` déjà arbitrés comme REDONDANTS lors du lot mobile #6 : l'information
 * qu'ils portent est visible à l'écran (libellé affiché sous l'icône). Toute
 * NOUVELLE entrée doit être justifiée dans la PR qui l'ajoute.
 */
const TITLE_REDUNDANT_ALLOWLIST = new Set([
  path.normalize('src/components/layout/NavigationBar.tsx'),
]);

/**
 * Fichiers exclus du périmètre Tracker DS (outils internes / non-production,
 * cf. DECISION-DOCUMENTATION-14-08.md et DOSSIER-PASSATION-DEV.md §5).
 */
const EXCLUDED_PATHS = new Set([
  path.normalize('src/features/documentation/pages/DocumentationExplorerPage.tsx'),
]);

const findings = [];
const warnings = [];

const findLineNumber = (content, pattern) => {
  const index = content.search(pattern);
  if (index === -1) {
    return 1;
  }
  return content.slice(0, index).split(/\r?\n/).length;
};

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }
    await scanFile(fullPath);
  }
};

/**
 * Repère les `title=` qui portent SEULS une information.
 *
 * On ne regarde que les balises NATIVES (nom en minuscule) : sur un composant
 * React, `title` est une prop rendue visuellement (`<Modal title>`, `<Card title>`,
 * `<MetricCard title>`) et n'a rien à voir avec l'attribut HTML. Sur une balise
 * native, le `title` est considéré comme redondant — donc acceptable — dès que la
 * balise porte aussi `aria-label` / `aria-labelledby` ; sinon on avertit.
 */
const scanTitleAttributes = (content, relativePath) => {
  if (TITLE_REDUNDANT_ALLOWLIST.has(relativePath)) {
    return;
  }

  for (const match of content.matchAll(/\stitle=/g)) {
    // Remonter jusqu'au '<' ouvrant la balise qui porte l'attribut.
    const openIndex = content.lastIndexOf('<', match.index);
    if (openIndex === -1) continue;

    const tagName = /^<([A-Za-z][\w.-]*)/.exec(content.slice(openIndex, openIndex + 40))?.[1];
    // Balise native uniquement : un composant React commence par une majuscule.
    if (!tagName || tagName[0] !== tagName[0].toLowerCase()) continue;

    // La balise s'arrête au premier '>' suivant l'attribut — approximation
    // suffisante : on ne cherche qu'une PRÉSENCE d'attribut dans la même balise.
    const closeIndex = content.indexOf('>', match.index);
    const tagBody = content.slice(openIndex, closeIndex === -1 ? undefined : closeIndex + 1);
    if (/aria-label(?:ledby)?\s*=/.test(tagBody)) continue;

    // Cas de redondance MÉCANIQUE : la balise tronque son propre contenu
    // (`truncate` / `line-clamp-*`) et le `title` en restitue la version complète.
    // L'information reste visible — elle est seulement coupée — donc la règle du DS
    // est respectée par construction.
    if (/\b(?:truncate|line-clamp-\d+)\b/.test(tagBody)) continue;

    warnings.push({
      file: relativePath,
      line: content.slice(0, match.index).split(/\r?\n/).length,
      reason:
        `\`title=\` sur <${tagName}> sans aria-label : l'attribut natif ne se déclenche pas au tap. ` +
        "Réservé à la REDONDANCE d'une information déjà visible ou vocalisée — sinon, utiliser <Tooltip> " +
        '(interdit DESIGN_BRIEF.md §8.3 ; DESIGN_SYSTEM.md §11.3).',
    });
  }
};

const scanFile = async (filePath) => {
  const relativePath = path.normalize(path.relative(process.cwd(), filePath));
  if (EXCLUDED_PATHS.has(relativePath)) {
    return;
  }
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach((pattern) => {
      if (pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          reason: `Classe héritée interdite (purgée du pont Tailwind) : ${pattern}`,
        });
      }
      pattern.lastIndex = 0;
    });

    RAW_COLOR_PATTERNS.forEach((pattern) => {
      if (pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          reason: `Couleur Tailwind brute dans src/** (tokens uniquement) : ${pattern}`,
        });
      }
      pattern.lastIndex = 0;
    });

    if (HEX_COLOR_PATTERN.test(line)) {
      findings.push({
        file: relativePath,
        line: index + 1,
        reason: 'Couleur hex en dur : les valeurs brutes vivent dans le fichier de tokens (index.css).',
      });
    }
    HEX_COLOR_PATTERN.lastIndex = 0;

    if (
      !NATIVE_CONTROL_ALLOWLIST.has(relativePath) &&
      !relativePath.startsWith(UI_COMPONENTS_PREFIX) &&
      NATIVE_CONTROL_PATTERN.test(line)
    ) {
      findings.push({
        file: relativePath,
        line: index + 1,
        reason: 'Contrôle natif hors des primitives du DS (`src/components/ui/**`).',
      });
    }
  });

  scanTitleAttributes(content, relativePath);
};

const scanIndexHtml = async () => {
  const content = await fs.readFile(INDEX_HTML_PATH, 'utf8');
  const relativePath = path.normalize(path.relative(process.cwd(), INDEX_HTML_PATH));

  if (/cdn\.tailwindcss\.com/i.test(content)) {
    findings.push({
      file: relativePath,
      line: findLineNumber(content, /cdn\.tailwindcss\.com/i),
      reason: 'Tailwind par CDN interdit. Utiliser la chaîne de build Tailwind.',
    });
  }

  if (/\btailwind\.config\s*=/i.test(content)) {
    findings.push({
      file: relativePath,
      line: findLineNumber(content, /\btailwind\.config\s*=/i),
      reason: 'Config Tailwind inline dans index.html interdite. Une seule source de config, au build.',
    });
  }
};

const main = async () => {
  await walk(SRC_DIR);
  await scanIndexHtml();

  if (warnings.length > 0) {
    console.warn(`Tracker DS — ${warnings.length} avertissement(s) « title= » :`);
    warnings.forEach((warning) => {
      console.warn(`- ${warning.file}:${warning.line} ${warning.reason}`);
    });
    console.warn('');
  }

  if (findings.length === 0) {
    console.log(
      `Conformité Tracker DS : OK (périmètre src/** + index.html, ${warnings.length} avertissement(s)).`
    );
    return;
  }

  console.error('Conformité Tracker DS : ÉCHEC');
  findings.forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} ${finding.reason}`);
  });
  process.exit(1);
};

main().catch((error) => {
  console.error('Le script de conformité Tracker DS a échoué de façon inattendue.');
  console.error(error);
  process.exit(1);
});
