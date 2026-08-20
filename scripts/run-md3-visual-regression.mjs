import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const RUN_DATE = new Date().toISOString().slice(0, 10);
// Horloge figée. Sans elle, les écrans qui calculent depuis « maintenant » —
// tableau de bord, finances, âges de la file — changent TOUS LES JOURS, et la suite
// signale une régression à chaque run. Le 06/08 a coûté deux runs complets et un
// arbre témoin pour distinguer 14 écarts réels de 9 dérives de date.
// L'instant retenu est celui de la re-baseline du 2026-08-06 : les références
// déposées ce jour-là restent valides. Le changer impose de re-baseliner.
const FROZEN_CLOCK = new Date('2026-08-06T12:00:00.000Z');
const UPDATE_BASELINE = process.argv.includes('--update');
const VITE_BIN = path.resolve('node_modules/vite/bin/vite.js');

const DEVICES = [
  { id: 'compact', label: 'Compact (iPhone 14 Pro)', width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { id: 'medium', label: 'Medium (iPad Mini)', width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'expanded', label: 'Expanded (Desktop 1440p)', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

const LOGIN_CHECKPOINT = { id: 'login', label: 'Login', hash: '/' };

const AUTH_CHECKPOINTS = [
  // '/dashboard' (not '/') : évite un goto same-URL après login, qui rechargerait la page
  // et perdrait la session démo (état React uniquement, non persisté).
  { id: 'dashboard', label: 'Dashboard', hash: '/dashboard' },
  { id: 'approvals', label: 'Approvals', hash: '/approvals' },
  { id: 'locations', label: 'Locations', hash: '/locations' },
  { id: 'management', label: 'Management catalog', hash: '/management' },
  { id: 'reports', label: 'Reports', hash: '/reports' },
  { id: 'settings', label: 'Settings', hash: '/settings' },
  { id: 'assignment_wizard', label: 'Assignment wizard', hash: '/wizards/assignment' },
  { id: 'return_wizard', label: 'Return wizard', hash: '/wizards/return' },
  { id: 'add_equipment', label: 'Add equipment', hash: '/inventory/add' },
  { id: 'user_details', label: 'User details', hash: '/users/1' },
  { id: 'audit_details', label: 'Audit details', hash: '/audit/details' },
  { id: 'finance', label: 'Finance', hash: '/finance' },
  { id: 'finance-expenses', label: 'Journal des dépenses', hash: '/finance/expenses' },
];

const DEVICE_FILTER = process.env.VISUAL_DEVICE_IDS
  ? new Set(process.env.VISUAL_DEVICE_IDS.split(',').map((value) => value.trim()).filter(Boolean))
  : null;
const CHECKPOINT_FILTER = process.env.VISUAL_CHECKPOINT_IDS
  ? new Set(process.env.VISUAL_CHECKPOINT_IDS.split(',').map((value) => value.trim()).filter(Boolean))
  : null;

const ACTIVE_DEVICES = DEVICE_FILTER ? DEVICES.filter((device) => DEVICE_FILTER.has(device.id)) : DEVICES;
const ACTIVE_AUTH_CHECKPOINTS = CHECKPOINT_FILTER
  ? AUTH_CHECKPOINTS.filter((checkpoint) => CHECKPOINT_FILTER.has(checkpoint.id))
  : AUTH_CHECKPOINTS;

const TEMP_DIR = path.resolve(`docs/.tmp/md3-visual-regression/${RUN_DATE}`);
const BASELINE_DIR = path.resolve('docs/md3-visual-baseline');
const CURRENT_DIR = path.resolve(`docs/md3-visual-current/${RUN_DATE}`);
const PIXEL_DIFF_RATIO_THRESHOLD = Number(process.env.VISUAL_MAX_DIFF_RATIO ?? '0.0005');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Retry.
    }
    await wait(1000);
  }
  throw new Error(`Timed out waiting for server at ${url}`);
};

const sha256 = async (filePath) => {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
};

const getPixelDiffRatio = async (baselinePath, currentPath) => {
  const [baselineBytes, currentBytes] = await Promise.all([readFile(baselinePath), readFile(currentPath)]);
  const baselineImage = PNG.sync.read(baselineBytes);
  const currentImage = PNG.sync.read(currentBytes);

  if (
    baselineImage.width !== currentImage.width
    || baselineImage.height !== currentImage.height
  ) {
    return 1;
  }

  const diff = new PNG({ width: baselineImage.width, height: baselineImage.height });
  const diffPixels = pixelmatch(
    baselineImage.data,
    currentImage.data,
    diff.data,
    baselineImage.width,
    baselineImage.height,
    {
      threshold: 0.12,
      includeAA: false,
    }
  );

  const totalPixels = baselineImage.width * baselineImage.height;
  if (totalPixels === 0) return 0;
  return diffPixels / totalPixels;
};

const startDevServer = () => {
  const child = spawn(process.execPath, [VITE_BIN, '--host', HOST, '--port', String(PORT)], {
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) process.stdout.write(`[vite] ${line}\n`);
  });
  child.stderr.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) process.stderr.write(`[vite] ${line}\n`);
  });

  return child;
};

const bootstrapDeterministicSession = async (page) => {
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'neemba_settings',
      JSON.stringify({
        theme: 'light',
        accentColor: 'yellow',
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Cold Vite dev on a slow disk can take minutes before the login form renders.
  // On vise le CHAMP, jamais sa formulation : la sonde s'accrochait au texte de
  // l'invite (« Ex: nom@… »), et le portage de la connexion sur la planche 02.1 l'a
  // cassée en changeant une phrase. Un harnais qui dépend de la copie casse à chaque
  // portage — et il en reste vingt-quatre.
  await page
    .locator('input[type="email"]')
    .first()
    .waitFor({ state: 'visible', timeout: 180000 });
  await page.waitForTimeout(500);
};

const loginWithDemoAccount = async (page) => {
  const emailField = () => page.locator('input[type="email"]').first();
  const isLoginVisible = async () => (await emailField().count()) > 0;

  const emailInput = emailField();

  if ((await emailInput.count()) > 0) {
    await emailInput.fill('alice.admin@tracker.app');
    await page.locator('input[type="password"]').first().fill('demo-password');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await page.waitForTimeout(1300);
  }

  if (await isLoginVisible()) {
    const demoAccountButton = page.getByRole('button', { name: /Connexion démo:/i }).first();
    if ((await demoAccountButton.count()) > 0) {
      await demoAccountButton.click();
      await page.getByRole('button', { name: /Se connecter/i }).click();
      await page.waitForTimeout(1300);
    }
  }

  if (await isLoginVisible()) {
    throw new Error('Demo login failed before visual capture.');
  }
};

const waitForStablePaint = async (page) => {
  await page
    .waitForFunction(
      () =>
        !document.querySelector('[data-testid="route-loading-fallback"]')
        && !document.querySelector('[data-testid="app-shell-loading"]'),
      { timeout: 30000 }
    )
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: '* { caret-color: transparent !important; }' }).catch(() => {});
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  });
  await page.mouse.move(1, 1).catch(() => {});
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(250);
};

const snapshotCheckpoint = async (page, device, checkpoint) => {
  const routeUrl = `${BASE_URL}/#${checkpoint.hash}`;
  await page.goto(routeUrl, { waitUntil: 'domcontentloaded' });
  await waitForStablePaint(page);

  const tempPath = path.join(TEMP_DIR, device.id, `${checkpoint.id}.png`);
  const baselinePath = path.join(BASELINE_DIR, device.id, `${checkpoint.id}.png`);
  await mkdir(path.dirname(tempPath), { recursive: true });
  await page.screenshot({
    path: tempPath,
    fullPage: false,
    animations: 'disabled',
    mask: [page.locator('img')],
    maskColor: '#888888',
  });

  if (!existsSync(baselinePath)) {
    await mkdir(path.dirname(baselinePath), { recursive: true });
    await copyFile(tempPath, baselinePath);

    const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
    await mkdir(path.dirname(currentPath), { recursive: true });
    await copyFile(tempPath, currentPath);

    return {
      status: 'baseline-created',
      pass: true,
      baselinePath,
      currentPath,
      hash: await sha256(tempPath),
    };
  }

  const [baselineHash, currentHash, pixelDiffRatio] = await Promise.all([
    sha256(baselinePath),
    sha256(tempPath),
    getPixelDiffRatio(baselinePath, tempPath),
  ]);

  if (baselineHash === currentHash || pixelDiffRatio <= PIXEL_DIFF_RATIO_THRESHOLD) {
    return {
      status: 'match',
      pass: true,
      baselinePath,
      currentPath: null,
      hash: currentHash,
    };
  }

  if (UPDATE_BASELINE) {
    await copyFile(tempPath, baselinePath);
    const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
    await mkdir(path.dirname(currentPath), { recursive: true });
    await copyFile(tempPath, currentPath);
    return {
      status: 'updated',
      pass: true,
      baselinePath,
      currentPath,
      hash: currentHash,
    };
  }

  const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
  await mkdir(path.dirname(currentPath), { recursive: true });
  await copyFile(tempPath, currentPath);
  return {
    status: 'changed',
    pass: false,
    baselinePath,
    currentPath,
    hash: currentHash,
  };
};

const run = async () => {
  let server = null;
  let browser = null;

  const stopServer = () => {
    if (server && !server.killed) {
      server.kill();
    }
  };

  try {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
    server = startDevServer();
    await waitForServer(BASE_URL);

    browser = await chromium.launch({ headless: true });
    const results = [];

    for (const device of ACTIVE_DEVICES) {
      process.stdout.write(`\n[visual] Device: ${device.label}\n`);
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        deviceScaleFactor: device.deviceScaleFactor,
        reducedMotion: 'reduce',
      });
      // Cold Vite dev on a slow disk can take minutes to transform the module graph.
      context.setDefaultNavigationTimeout(180000);
      // Remote images (avatars, equipment photos) load nondeterministically: block them so
      // the UI always renders its local fallbacks. CDN fonts/styles are still allowed.
      await context.route(
        '**/*',
        (route) =>
          route.request().resourceType() === 'image'
          && !route.request().url().startsWith(BASE_URL)
            ? route.abort()
            : route.continue()
      );

      const page = await context.newPage();
      // `setFixedTime` fige `Date.now()` sans arrêter les minuteries : les
      // transitions et les délais du produit continuent de se dérouler.
      await page.clock.setFixedTime(FROZEN_CLOCK);
      await bootstrapDeterministicSession(page);

      process.stdout.write(`[visual]  - capture: ${LOGIN_CHECKPOINT.id}\n`);
      const loginSnapshot = await snapshotCheckpoint(page, device, LOGIN_CHECKPOINT);
      results.push({
        device,
        checkpoint: LOGIN_CHECKPOINT,
        ...loginSnapshot,
      });

      process.stdout.write('[visual]  - login demo account\n');
      await loginWithDemoAccount(page);
      const closeToastButton = page.getByRole('button', { name: 'Fermer la notification' });
      if ((await closeToastButton.count()) > 0) {
        await closeToastButton.first().click().catch(() => {});
      }
      await page.waitForTimeout(4500);
      await page
        .waitForFunction(
          () => !document.querySelector('[role="status"]'),
          { timeout: 6000 }
        )
        .catch(() => {});
      await page.waitForTimeout(200);

      for (const checkpoint of ACTIVE_AUTH_CHECKPOINTS) {
        process.stdout.write(`[visual]  - capture: ${checkpoint.id}\n`);
        const snapshotResult = await snapshotCheckpoint(page, device, checkpoint);
        results.push({
          device,
          checkpoint,
          ...snapshotResult,
        });
      }

      await context.close();
    }

    await browser.close();
    stopServer();
    await rm(TEMP_DIR, { recursive: true, force: true });

    const totals = {
      checkpoints: results.length,
      match: results.filter((r) => r.status === 'match').length,
      baselineCreated: results.filter((r) => r.status === 'baseline-created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      changed: results.filter((r) => r.status === 'changed').length,
      pass: results.filter((r) => r.pass).length,
      fail: results.filter((r) => !r.pass).length,
    };

    const summary = {
      date: RUN_DATE,
      baseUrl: BASE_URL,
      updateBaseline: UPDATE_BASELINE,
      totals,
      results: results.map((item) => ({
        device: item.device.id,
        checkpoint: item.checkpoint.id,
        route: item.checkpoint.hash,
        status: item.status,
        pass: item.pass,
        hash: item.hash,
        baselinePath: path.relative(process.cwd(), item.baselinePath).replace(/\\/g, '/'),
        currentPath: item.currentPath
          ? path.relative(process.cwd(), item.currentPath).replace(/\\/g, '/')
          : null,
      })),
    };

    const jsonPath = path.resolve(`docs/md3-visual-regression-results-${RUN_DATE}.json`);
    const mdPath = path.resolve(`docs/md3-visual-regression-results-${RUN_DATE}.md`);
    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    const lines = [];
    lines.push('# MD3 Visual Regression Results');
    lines.push('');
    lines.push(`Date: ${RUN_DATE}`);
    lines.push(`Base URL: ${BASE_URL}`);
    lines.push(`Mode: ${UPDATE_BASELINE ? 'Update baseline' : 'Check baseline'}`);
    lines.push('');
    lines.push(`- Checkpoints: ${totals.checkpoints}`);
    lines.push(`- Match: ${totals.match}`);
    lines.push(`- Baseline created: ${totals.baselineCreated}`);
    lines.push(`- Baseline updated: ${totals.updated}`);
    lines.push(`- Changed (regressions): ${totals.changed}`);
    lines.push(`- Pass: ${totals.pass}`);
    lines.push(`- Fail: ${totals.fail}`);
    lines.push('');
    lines.push('| Device | Checkpoint | Route | Status | Baseline | Current |');
    lines.push('| --- | --- | --- | --- | --- | --- |');

    for (const item of results) {
      const baselineLink = path.relative(process.cwd(), item.baselinePath).replace(/\\/g, '/');
      const currentLink = item.currentPath
        ? path.relative(process.cwd(), item.currentPath).replace(/\\/g, '/')
        : '-';
      lines.push(
        `| ${item.device.label} | ${item.checkpoint.label} | \`${item.checkpoint.hash}\` | ${item.status} | \`${baselineLink}\` | ${currentLink === '-' ? '-' : `\`${currentLink}\``} |`
      );
    }

    lines.push('');
    lines.push('Notes:');
    lines.push('- Baselines are stored in `docs/md3-visual-baseline/`.');
    lines.push('- Current run captures (new/updated/changed) are stored in `docs/md3-visual-current/<date>/`.');
    lines.push('- Use `npm run qa:visual:update` to accept intentional UI changes.');

    await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

    process.stdout.write(`Visual regression report written:\n- ${jsonPath}\n- ${mdPath}\n`);

    if (totals.fail > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`MD3 visual regression failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    // Close the browser even on failure: a live CDP connection keeps the process alive forever.
    if (browser) await browser.close().catch(() => {});
    stopServer();
    await rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
  }
};

run();
