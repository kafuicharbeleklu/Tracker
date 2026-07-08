import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const INDEX_HTML_PATH = path.resolve('index.html');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);
const UI_COMPONENTS_PREFIX = `${path.normalize('src/components/ui')}${path.sep}`;

const FORBIDDEN_PATTERNS = [
  /\btext-dark\b/g,
  /\bbg-dark\b/g,
  /\bsurface-subtle\b/g,
  /variant\s*=\s*["']outline["']/g,
  // Design System Caterpillar : interdiction du jaune/ambre Tailwind brut
  // (la marque passe par les tokens ; warning = orange). Voir docs/DESIGN_TOKENS_SPEC.md.
  /\b(?:bg|text|border|ring)-(?:amber|yellow)-(?:50|100|200|300|400|500|600|700|800|900)\b/g,
];
const NATIVE_CONTROL_PATTERN = /<(button|input|select|textarea)\b/;

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/g;
const HEX_ALLOWLIST = new Set([
  path.normalize('src/features/auth/pages/LoginPage.tsx'),
  path.normalize('src/components/layout/NavigationRail.tsx'),
  path.normalize('src/components/layout/Sidebar.tsx'),
]);

const NATIVE_CONTROL_ALLOWLIST = new Set([
  path.normalize('src/features/audit/pages/AuditDetailsPage.tsx'),
  path.normalize('src/features/finance/components/AddBudgetModal.tsx'),
  path.normalize('src/features/finance/components/AddExpenseModal.tsx'),
  path.normalize('src/features/finance/pages/FinanceManagementPage.tsx'),
  path.normalize('src/features/inventory/pages/EquipmentDetailsPage.tsx'),
  path.normalize('src/features/inventory/pages/InventoryPage.tsx'),
  path.normalize('src/features/management/components/RbacManagementPanel.tsx'),
  path.normalize('src/features/management/pages/ManagementPage.tsx'),
  path.normalize('src/features/users/pages/UsersPage.tsx'),
]);


const findings = [];

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

const scanFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  const relativePath = path.normalize(path.relative(process.cwd(), filePath));
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach((pattern) => {
      if (pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          reason: `Forbidden MD3 legacy pattern: ${pattern}`,
        });
      }
      pattern.lastIndex = 0;
    });

    if (!HEX_ALLOWLIST.has(relativePath) && HEX_COLOR_PATTERN.test(line)) {
      findings.push({
        file: relativePath,
        line: index + 1,
        reason: 'Hardcoded hex color found outside allowlist.',
      });
    }
    HEX_COLOR_PATTERN.lastIndex = 0;

    if (!NATIVE_CONTROL_ALLOWLIST.has(relativePath) && !relativePath.startsWith(UI_COMPONENTS_PREFIX) && NATIVE_CONTROL_PATTERN.test(line)) {
      findings.push({
        file: relativePath,
        line: index + 1,
        reason: 'Native control used outside DS primitives (`src/components/ui/**`).',
      });
    }
  });
};

const main = async () => {
  await walk(SRC_DIR);
  await scanIndexHtml();

  if (findings.length === 0) {
    console.log('MD3 guardrails check passed.');
    return;
  }

  console.error('MD3 guardrails check failed:');
  findings.forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} ${finding.reason}`);
  });
  process.exit(1);
};

const scanIndexHtml = async () => {
  const content = await fs.readFile(INDEX_HTML_PATH, 'utf8');
  const relativePath = path.normalize(path.relative(process.cwd(), INDEX_HTML_PATH));

  if (/cdn\.tailwindcss\.com/i.test(content)) {
    findings.push({
      file: relativePath,
      line: findLineNumber(content, /cdn\.tailwindcss\.com/i),
      reason: 'Runtime Tailwind CDN is forbidden. Use build-time Tailwind pipeline.',
    });
  }

  if (/\btailwind\.config\s*=/i.test(content)) {
    findings.push({
      file: relativePath,
      line: findLineNumber(content, /\btailwind\.config\s*=/i),
      reason: 'Inline Tailwind config in index.html is forbidden. Keep a single build-time config source.',
    });
  }
};

main().catch((error) => {
  console.error('MD3 guardrails script failed unexpectedly.');
  console.error(error);
  process.exit(1);
});
