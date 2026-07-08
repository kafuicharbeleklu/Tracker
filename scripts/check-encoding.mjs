// Garde d'hygiène de contenu (audit UX 2026-07-07, §5) : détecte le mojibake
// UTF-8 double-encodé dans les littéraux (ex. « MatÃ©riel IT ») avant qu'il
// n'atteigne le rendu. Échoue avec la liste fichier:ligne des séquences.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const EXTRA_FILES = ['index.html', 'index.css', 'index.tsx', 'App.tsx'].map((f) =>
  path.resolve(f)
);
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html', '.json', '.md']);

// Séquences typiques d'un décodage latin-1/cp1252 de texte UTF-8 : « Ã » (U+00C3)
// suivi soit d'un caractère U+0080–U+00BF (chemin latin-1), soit d'une ponctuation
// cp1252 (ˆ ‹ Œ ‘ ’ “ ” – — ™ …), plus « â€ » (typographie double-encodée).
const CP1252_ARTIFACTS =
  '€‚ƒ„…†‡ˆ‰Š‹ŒŽ' +
  '‘’“”•–—˜™š›œžŸ';
const MOJIBAKE_PATTERN = new RegExp(
  `Ã[\\u0080-\\u00BF${CP1252_ARTIFACTS}]|â€`,
  'g'
);

const findings = [];

const scanFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    MOJIBAKE_PATTERN.lastIndex = 0;
    const match = MOJIBAKE_PATTERN.exec(line);
    if (match) {
      findings.push(
        `${path.relative(process.cwd(), filePath)}:${index + 1} Mojibake « ${match[0]} » — littéral probablement double-encodé.`
      );
    }
  });
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

await walk(SRC_DIR);
for (const file of EXTRA_FILES) {
  try {
    await scanFile(file);
  } catch {
    // fichier racine absent : ignorer
  }
}

if (findings.length > 0) {
  console.error('Encoding check failed:');
  for (const finding of findings.sort()) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Encoding check passed (aucun mojibake détecté).');
