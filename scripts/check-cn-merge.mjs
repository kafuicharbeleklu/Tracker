/**
 * Sonde de fumée tailwind-merge — reproduit la sonde de docs/AUDIT_DESIGN_SYSTEM.md §11.4.
 *
 * Deux familles de vérifications, sur le VRAI `cn()` (src/lib/utils.ts, bundlé via esbuild) :
 * 1. Synchro config ↔ sources de vérité : chaque classe du typescale (index.css) doit être
 *    classée taille-de-texte (pas couleur), chaque `shadow-elevation-*` (tailwind.config.js)
 *    doit fusionner avec `shadow-none`. Une classe maison ajoutée sans déclaration dans
 *    extendTailwindMerge ferait avaler des couleurs — c'est LE mode d'échec de §11.4.
 * 2. Cas mesurés de l'étude : coexistences, conflits résolus, préservation des `!`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const bundle = await esbuild.build({
  entryPoints: [path.resolve('src/lib/utils.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  logLevel: 'silent',
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(
  bundle.outputFiles[0].text
).toString('base64')}`;
const { cn } = await import(moduleUrl);

const failures = [];
const classesOf = (output) => output.split(/\s+/).filter(Boolean);
const check = (label, output, { keeps = [], drops = [] }) => {
  const emitted = classesOf(output);
  const missing = keeps.filter((cls) => !emitted.includes(cls));
  const lingering = drops.filter((cls) => emitted.includes(cls));
  if (missing.length > 0 || lingering.length > 0) {
    failures.push(
      `${label}\n    sortie   : "${output}"` +
        (missing.length > 0 ? `\n    manquant : ${missing.join(', ')}` : '') +
        (lingering.length > 0 ? `\n    résiduel : ${lingering.join(', ')}` : '')
    );
  }
};

// --- 1a. Synchro typescale (source de vérité : index.css) ---------------------------------
const indexCss = await fs.readFile(path.resolve('index.css'), 'utf8');
// `-plain` / `-mobile` : rôles typographiques de l'ADN mobile (DESIGN_BRIEF.md §2),
// suffixés pour ne pas écraser le cran canonique tant que la bascule est en cours.
const typescale = [
  ...new Set(
    [
      ...indexCss.matchAll(
        /\.text-((?:display|headline|title|body|label)-(?:large|medium|small)(?:-plain)?|stat-value(?:-mobile)?)\b/g
      ),
    ].map((m) => m[1])
  ),
];
if (typescale.length < 16) {
  failures.push(`typescale : ${typescale.length}/16 classes trouvées dans index.css (regex à revoir ?)`);
}
for (const name of typescale) {
  const sized = `text-${name}`;
  check(
    `typescale ${sized} : doit coexister avec une couleur de texte`,
    cn(`${sized} text-on-primary`),
    { keeps: [sized, 'text-on-primary'] }
  );
  check(
    `typescale ${sized} : doit être classé taille (fusionne avec text-[9px])`,
    cn(sized, 'text-[9px]'),
    { keeps: ['text-[9px]'], drops: [sized] }
  );
}

// --- 1b. Synchro élévations (source de vérité : tailwind.config.js) -----------------------
const tailwindConfig = await fs.readFile(path.resolve('tailwind.config.js'), 'utf8');
const elevations = [...new Set([...tailwindConfig.matchAll(/'(elevation-\d+)'/g)].map((m) => m[1]))];
if (elevations.length < 6) {
  failures.push(`élévations : ${elevations.length}/6 trouvées dans tailwind.config.js (regex à revoir ?)`);
}
for (const name of elevations) {
  check(
    `shadow-${name} : doit fusionner avec shadow-none (groupe shadow)`,
    cn('shadow-none', `shadow-${name}`),
    { keeps: [`shadow-${name}`], drops: ['shadow-none'] }
  );
}

// --- 1c. Synchro espacements nommés (source de vérité : tailwind.config.js) ---------------
// Un espacement maison non déclaré n'entre en conflit avec RIEN : `p-card` et `px-4`
// cohabitent et c'est l'ordre du CSS qui tranche — d'où les `!` de reprise en main
// constatés en AUDIT_MOBILE #15.
const spacingBlock = tailwindConfig.match(/spacing:\s*\{([^}]*)\}/)?.[1] ?? '';
const spacings = [...new Set([...spacingBlock.matchAll(/'([a-z][\w-]*)'\s*:/g)].map((m) => m[1]))];
if (spacings.length < 4) {
  failures.push(`espacements : ${spacings.length}/4 trouvés dans tailwind.config.js (regex à revoir ?)`);
}
for (const name of spacings) {
  check(
    `p-${name} : doit fusionner avec le padding du size (groupe padding)`,
    cn('px-4 py-2', `p-${name}`),
    { keeps: [`p-${name}`], drops: ['px-4', 'py-2'] }
  );
}

// --- 1d. Échelle de rayons de l'ADN mobile (source de vérité : tailwind.config.js) --------
// Ces classes existent pour SURCHARGER le rayon canonique d'une primitive (`rounded-xl`
// de Card, `rounded-lg` du FAB…) depuis un `className`. Non déclarées à tailwind-merge,
// les deux classes seraient émises et le rendu dépendrait de l'ordre du CSS.
const adnRadii = [...new Set([...tailwindConfig.matchAll(/'(adn-(?:control|card|sheet))'\s*:/g)].map((m) => m[1]))];
if (adnRadii.length < 3) {
  failures.push(`rayons ADN : ${adnRadii.length}/3 trouvés dans tailwind.config.js (regex à revoir ?)`);
}
for (const name of adnRadii) {
  check(
    `rounded-${name} : doit chasser le rayon canonique d'une primitive (groupe rounded)`,
    cn('rounded-xl', `rounded-${name}`),
    { keeps: [`rounded-${name}`], drops: ['rounded-xl'] }
  );
}
// Les deux rayons de rôle (carte, vignette) : posés sur un bouton en forme de carte, ils
// doivent chasser le `rounded-md` de la primitive — sinon l'ordre du CSS rend 4 px.
const rayonsDeRole = ['card', 'vignette'];
for (const name of rayonsDeRole) {
  if (!new RegExp(`'${name}'\\s*:`).test(tailwindConfig)) {
    failures.push(`rayon de rôle « ${name} » : absent de tailwind.config.js`);
  }
  check(
    `rounded-${name} : doit chasser le rayon d'une primitive (groupe rounded)`,
    cn('rounded-md', `rounded-${name}`),
    { keeps: [`rounded-${name}`], drops: ['rounded-md'] }
  );
}
check(
  'w-fab / h-fab : doivent chasser le gabarit du FAB (groupes w et h)',
  cn('w-14 h-14', 'w-fab h-fab'),
  { keeps: ['w-fab', 'h-fab'], drops: ['w-14', 'h-14'] }
);

// --- 1e. L'échelle par régime (source de vérité : index.css, `@utility text-ts-*`) -------
// Des tailles qui changent au bureau (22/09). Non déclarées, `text-ts-body` serait lue comme
// une couleur et avalerait `text-on-surface` — ou l'inverse — ; `leading-ts-body` ne
// chasserait pas le `leading-6` d'une primitive.
const echelle = [...new Set([...indexCss.matchAll(/@utility text-(ts-[a-z]+)\b/g)].map((m) => m[1]))];
if (echelle.length < 6) {
  failures.push(`échelle par régime : ${echelle.length}/6 utilitaires trouvés dans index.css (regex à revoir ?)`);
}
for (const name of echelle) {
  check(
    `text-${name} : doit coexister avec une couleur de texte`,
    cn(`text-${name} text-on-surface-variant`),
    { keeps: [`text-${name}`, 'text-on-surface-variant'] }
  );
  check(
    `text-${name} : doit être classé taille (chasse text-[1rem])`,
    cn('text-[1rem]', `text-${name}`),
    { keeps: [`text-${name}`], drops: ['text-[1rem]'] }
  );
  check(
    `leading-${name} : doit chasser l'interligne d'une primitive (groupe leading)`,
    cn('leading-6', `leading-${name}`),
    { keeps: [`leading-${name}`], drops: ['leading-6'] }
  );
}

// --- 2. Cas mesurés (§11.3 / §11.4) -------------------------------------------------------
check(
  'sonde §11.4 : le typescale ne doit pas être avalé par une couleur',
  cn('min-h-8 px-3 py-1.5 text-label-medium gap-1.5 text-on-primary'),
  { keeps: ['min-h-8', 'px-3', 'py-1.5', 'text-label-medium', 'gap-1.5', 'text-on-primary'] }
);
check(
  'Button filled : couleur (variant) puis taille (size) coexistent',
  cn('bg-primary text-on-primary', 'min-h-10 px-4 text-label-large'),
  { keeps: ['text-on-primary', 'text-label-large'] }
);
check(
  'conflit couleur de fond : le dernier écrit gagne (EntityRow §11.3)',
  cn('bg-surface', 'bg-primary-container/45'),
  { keeps: ['bg-primary-container/45'], drops: ['bg-surface'] }
);
check(
  'conflit couleur de texte : le dernier écrit gagne (Menu désactivé §11.3)',
  cn('text-on-surface', 'text-on-surface-variant'),
  { keeps: ['text-on-surface-variant'], drops: ['text-on-surface'] }
);
check(
  'arbitraire layout/ : text-[var(--…)] est une couleur, coexiste avec le typescale',
  cn('text-[var(--color-on-surface)]', 'text-title-medium'),
  { keeps: ['text-[var(--color-on-surface)]', 'text-title-medium'] }
);
check(
  'surcharges E10/E11 : une classe ! ne supprime pas la non-! (pas d’interaction)',
  cn('text-on-surface', '!text-error'),
  { keeps: ['text-on-surface', '!text-error'] }
);
check(
  'ombre Tailwind native : shadow-md fusionne toujours avec shadow-none',
  cn('shadow-none', 'shadow-md'),
  { keeps: ['shadow-md'], drops: ['shadow-none'] }
);

// --- Verdict ------------------------------------------------------------------------------
const total = typescale.length * 2 + elevations.length + spacings.length + adnRadii.length + rayonsDeRole.length + echelle.length * 3 + 1 + 7;
if (failures.length > 0) {
  console.error(`✗ Sonde cn()/tailwind-merge : ${failures.length} échec(s) sur ${total} vérifications\n`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}
console.log(
  `✓ Sonde cn()/tailwind-merge : ${total} vérifications (typescale ${typescale.length}, échelle par régime ${echelle.length}, élévations ${elevations.length}, espacements ${spacings.length}, rayons ADN ${adnRadii.length}, cas §11) — OK`
);
