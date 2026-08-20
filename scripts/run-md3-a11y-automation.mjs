import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const RUN_DATE = new Date().toISOString().slice(0, 10);

const ROUTES = [
  // '/dashboard' (not '/') : évite un goto same-URL après login, qui rechargerait la page
  // et perdrait la session démo (état React uniquement, non persisté).
  { id: 'dashboard', hash: '/dashboard', label: 'Dashboard' },
  { id: 'approvals', hash: '/approvals', label: 'Approvals' },
  { id: 'locations', hash: '/locations', label: 'Locations' },
  { id: 'management', hash: '/management', label: 'Management catalog' },
  { id: 'reports', hash: '/reports', label: 'Reports' },
  { id: 'settings', hash: '/settings', label: 'Settings' },
  { id: 'assignment_wizard', hash: '/wizards/assignment', label: 'Assignment wizard' },
  { id: 'return_wizard', hash: '/wizards/return', label: 'Return wizard' },
  { id: 'user_details', hash: '/users/1', label: 'User details' },
  { id: 'add_equipment', hash: '/inventory/add', label: 'Add equipment' },
  { id: 'audit_details', hash: '/audit/details', label: 'Audit details' },
  { id: 'category_details', hash: '/management/categories/1', label: 'Category details' },
  { id: 'import_locations', hash: '/locations/import', label: 'Import locations' },
  { id: 'import_models', hash: '/management/models/import', label: 'Import models' },
  { id: 'finance', hash: '/finance', label: 'Finance' },
  { id: 'finance-expenses', hash: '/finance/expenses', label: 'Journal des dépenses' },
  { id: 'site-details', hash: '/locations/site/Bureau%20Paris', label: 'Détail site' },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore and retry
    }
    await wait(1000);
  }
  throw new Error(`Timed out waiting for server at ${url}`);
};

const startDevServer = () => {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT)], {
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

const loginWithDemoAccount = async (page) => {
  const byLabel = page.getByLabel('Adresse e-mail').first();
  const byPlaceholder = page.getByPlaceholder(/Ex:\s*nom@/i).first();
  // Cold Vite dev on a slow disk can take minutes before the login form renders.
  await byPlaceholder.waitFor({ state: 'visible', timeout: 180000 });
  const emailInput = (await byLabel.count()) > 0 ? byLabel : byPlaceholder;

  await emailInput.fill('alice.admin@tracker.app');
  await page.getByPlaceholder('Votre mot de passe').fill('demo-password');
  const submitButton = page.getByRole('button', { name: /Se connecter/i }).first();
  await submitButton.click();
  await submitButton.waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1300);
};

const focusProbe = async (page, presses = 12) => {
  const focused = [];
  let hasVisibleFocus = false;

  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(90);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        id: el.id || '',
        className: el.className || '',
        text: (el.textContent || '').trim().slice(0, 60),
        outlineStyle: style.outlineStyle || '',
        outlineWidth: style.outlineWidth || '',
        boxShadow: style.boxShadow || '',
      };
    });

    if (info) {
      focused.push(info);
      const hasOutline = info.outlineStyle !== 'none' && info.outlineWidth !== '0px';
      const hasShadow = info.boxShadow && info.boxShadow !== 'none';
      if (hasOutline || hasShadow) hasVisibleFocus = true;
    }
  }

  const uniqueFocusTargets = new Set(
    focused.map((f) => `${f.tag}|${f.role}|${f.id}|${String(f.className).slice(0, 64)}|${f.text}`)
  ).size;

  return {
    tabPresses: presses,
    uniqueFocusTargets,
    hasVisibleFocus,
    focusedSample: focused.slice(0, 6),
  };
};

const collectPageMetrics = async (page) =>
  page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll('button, [role="button"], input, select, textarea, a[href]')
    );

    const iconOnlyButtonsMissingLabel = Array.from(document.querySelectorAll('button'))
      .filter((btn) => {
        const text = (btn.textContent || '').trim();
        if (text.length > 0) return false;
        const aria = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        return !aria && !title;
      })
      .length;

    const disabledCount = controls.filter((el) => {
      if (el.hasAttribute('disabled')) return true;
      if (el.getAttribute('aria-disabled') === 'true') return true;
      return false;
    }).length;

    return {
      interactiveCount: controls.length,
      iconOnlyButtonsMissingLabel,
      disabledCount,
      title: document.title,
    };
  });

const run = async () => {
  let server = null;
  let browser = null;

  const stopServer = () => {
    if (server && !server.killed) {
      server.kill();
    }
  };

  try {
    server = startDevServer();
    await waitForServer(BASE_URL);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    // Cold Vite dev on a slow disk can take minutes to transform the module graph.
    context.setDefaultNavigationTimeout(180000);
    const page = await context.newPage();

    // Login via demo account.
    await page.goto(`${BASE_URL}/#/`);
    await page.waitForTimeout(600);

    await loginWithDemoAccount(page);

    const results = [];

    // Include login route as pre-auth probe (open in fresh context).
    {
      const loginContext = await browser.newContext({ reducedMotion: 'reduce' });
      const loginPage = await loginContext.newPage();
      await loginPage.goto(`${BASE_URL}/#/`);
      await loginPage.waitForTimeout(500);
      const pageMetrics = await collectPageMetrics(loginPage);
      const focusMetrics = await focusProbe(loginPage, 10);
      results.push({
        id: 'login',
        label: 'Login',
        hash: '/#/',
        pageMetrics,
        focusMetrics,
        pass: pageMetrics.iconOnlyButtonsMissingLabel === 0 && focusMetrics.uniqueFocusTargets >= 3,
      });
      await loginContext.close();
    }

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}/#${route.hash}`);
      await page.waitForTimeout(900);
      // Lazy route chunks can outlive the fixed wait on slow disks: wait out the Suspense fallback.
      await page
        .waitForFunction(() => !document.body.innerText.includes('Chargement de la vue'), {
          timeout: 30000,
        })
        .catch(() => {});

      const pageMetrics = await collectPageMetrics(page);
      const focusMetrics = await focusProbe(page, 12);
      const pass = pageMetrics.iconOnlyButtonsMissingLabel === 0 && focusMetrics.uniqueFocusTargets >= 3;

      results.push({
        ...route,
        pageMetrics,
        focusMetrics,
        pass,
      });
    }

    await browser.close();
    stopServer();

    const summary = {
      date: RUN_DATE,
      baseUrl: BASE_URL,
      totals: {
        flows: results.length,
        pass: results.filter((r) => r.pass).length,
        fail: results.filter((r) => !r.pass).length,
      },
      results,
    };

    const jsonPath = path.resolve(`docs/md3-a11y-automation-results-${RUN_DATE}.json`);
    const mdPath = path.resolve(`docs/md3-a11y-automation-results-${RUN_DATE}.md`);

    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    const lines = [];
    lines.push('# MD3 A11Y Automation Results');
    lines.push('');
    lines.push(`Date: ${RUN_DATE}`);
    lines.push(`Base URL: ${BASE_URL}`);
    lines.push('');
    lines.push(`- Flows checked: ${summary.totals.flows}`);
    lines.push(`- Pass: ${summary.totals.pass}`);
    lines.push(`- Fail: ${summary.totals.fail}`);
    lines.push('');
    lines.push('| Flow | Route | Interactive controls | Icon-only buttons missing label | Unique focus targets (Tab probe) | Visible focus detected | Result |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');

    for (const item of results) {
      lines.push(
        `| ${item.label} | \`${item.hash}\` | ${item.pageMetrics.interactiveCount} | ${item.pageMetrics.iconOnlyButtonsMissingLabel} | ${item.focusMetrics.uniqueFocusTargets} | ${item.focusMetrics.hasVisibleFocus ? 'Yes' : 'No'} | ${item.pass ? 'Pass' : 'Fail'} |`
      );
    }

    lines.push('');
    lines.push('Notes:');
    lines.push('- This run validates keyboard/focus smoke and accessible naming heuristics.');
    lines.push('- Screen-reader narration quality and business-rule error semantics still require human manual sign-off.');

    await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

    process.stdout.write(`Automation report written:\n- ${jsonPath}\n- ${mdPath}\n`);

    if (summary.totals.fail > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`MD3 A11Y automation failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    // Close the browser even on failure: a live CDP connection keeps the process alive forever.
    if (browser) await browser.close().catch(() => {});
    stopServer();
  }
};

run();
