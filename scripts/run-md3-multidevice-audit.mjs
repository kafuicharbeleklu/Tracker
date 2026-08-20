import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const RUN_DATE = new Date().toISOString().slice(0, 10);
const TOUCH_TARGET_MIN_SIZE_PX = 48;
const TOUCH_SPACING_MIN_GAP_PX = 8;
const TOUCH_SPACING_WARNING_MAX_VIOLATIONS = 0;
const TOUCH_SPACING_MAX_VIOLATIONS = 12;

const DEVICES = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'iphone-14-pro', label: 'iPhone 14 Pro', width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'ipad-pro', label: 'iPad Pro', width: 1024, height: 1366, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'desktop-1440p', label: 'Desktop 1440p', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { id: 'desktop-4k', label: 'Desktop 4K', width: 3840, height: 2160, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

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
];

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

const focusProbe = async (page, presses = 10) => {
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

const collectResponsiveMetrics = async (
  page,
  { touchTargetMinSizePx = TOUCH_TARGET_MIN_SIZE_PX, touchSpacingMinGapPx = TOUCH_SPACING_MIN_GAP_PX } = {}
) =>
  page.evaluate(({ touchTargetMinSizePx, touchSpacingMinGapPx }) => {
    const controls = Array.from(
      document.querySelectorAll('button, [role="button"], input, select, textarea, a[href]')
    );

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        return false;
      }
      if (style.pointerEvents === 'none') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;
      const intersectsViewport = rect.bottom > 0
        && rect.right > 0
        && rect.top < window.innerHeight
        && rect.left < window.innerWidth;
      const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      const hasUsableVisibleArea = visibleWidth >= 12 && visibleHeight >= 12;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const centerInViewport = centerX >= 0
        && centerX <= window.innerWidth
        && centerY >= 0
        && centerY <= window.innerHeight;
      return hasSize && intersectsViewport && hasUsableVisibleArea && centerInViewport;
    };

    const visibleControls = controls.filter((el) => isVisible(el));
    const interactiveRects = visibleControls.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        id: el.id || '',
        className: (el.className || '').toString().slice(0, 240),
        text: (el.textContent || '').trim().slice(0, 80),
        ariaLabel: el.getAttribute('aria-label') || '',
        title: el.getAttribute('title') || '',
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });

    const touchTargetTooSmall = interactiveRects.filter(
      (r) => r.width < touchTargetMinSizePx || r.height < touchTargetMinSizePx
    );
    const touchTargetTooSmallCount = touchTargetTooSmall.length;

    const overlapOnAxis = (startA, endA, startB, endB) =>
      Math.min(endA, endB) - Math.max(startA, startB);

    let touchSpacingViolationsCount = 0;
    const touchSpacingViolationsSample = [];
    for (let i = 0; i < interactiveRects.length; i += 1) {
      for (let j = i + 1; j < interactiveRects.length; j += 1) {
        const a = interactiveRects[i];
        const b = interactiveRects[j];
        const horizontalOverlap = overlapOnAxis(a.left, a.right, b.left, b.right);
        const verticalOverlap = overlapOnAxis(a.top, a.bottom, b.top, b.bottom);

        const horizontalGap = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const verticalGap = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));

        const isOverlapping = horizontalOverlap > 0 && verticalOverlap > 0;
        if (isOverlapping) {
          continue;
        }

        const strongHorizontalOverlap = horizontalOverlap >= Math.min(a.width, b.width) * 0.3;
        const strongVerticalOverlap = verticalOverlap >= Math.min(a.height, b.height) * 0.3;
        const isVerticalNeighbor = strongHorizontalOverlap && verticalGap < touchSpacingMinGapPx;
        const isHorizontalNeighbor = strongVerticalOverlap && horizontalGap < touchSpacingMinGapPx;
        const isLikelyStackedListRow = isVerticalNeighbor
          && a.tag === 'div'
          && b.tag === 'div'
          && a.role === 'button'
          && b.role === 'button'
          && a.width >= 180
          && b.width >= 180
          && a.height >= 56
          && b.height >= 56;

        if (isLikelyStackedListRow) {
          continue;
        }

        if (isVerticalNeighbor || isHorizontalNeighbor) {
          touchSpacingViolationsCount += 1;
          if (touchSpacingViolationsSample.length < 8) {
            touchSpacingViolationsSample.push({
              axis: isVerticalNeighbor ? 'vertical' : 'horizontal',
              horizontalGap: Math.round(horizontalGap * 10) / 10,
              verticalGap: Math.round(verticalGap * 10) / 10,
              first: {
                tag: a.tag,
                text: a.text,
                className: a.className,
                width: a.width,
                height: a.height,
              },
              second: {
                tag: b.tag,
                text: b.text,
                className: b.className,
                width: b.width,
                height: b.height,
              },
            });
          }
        }
      }
    }

    const iconOnlyButtonsMissingLabel = Array.from(document.querySelectorAll('button'))
      .filter((btn) => {
        const text = (btn.textContent || '').trim();
        if (text.length > 0) return false;
        const aria = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        return !aria && !title;
      })
      .length;

    const root = document.documentElement;
    const horizontalOverflow = root.scrollWidth - window.innerWidth > 1;

    return {
      interactiveCount: visibleControls.length,
      iconOnlyButtonsMissingLabel,
      horizontalOverflow,
      touchTargetTooSmallCount,
      touchTargetTooSmallSample: touchTargetTooSmall.slice(0, 8),
      touchSpacingViolationsCount,
      touchSpacingViolationsSample,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      title: document.title,
    };
  }, { touchTargetMinSizePx, touchSpacingMinGapPx });

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
    const deviceResults = [];

    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        deviceScaleFactor: device.deviceScaleFactor,
        reducedMotion: 'reduce',
      });
      // Cold Vite dev on a slow disk can take minutes to transform the module graph.
      context.setDefaultNavigationTimeout(180000);
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/#/`);
      await page.waitForTimeout(600);

      await loginWithDemoAccount(page);

      const flowResults = [];
      for (const route of ROUTES) {
        await page.goto(`${BASE_URL}/#${route.hash}`);
        await page.waitForTimeout(900);
        // Lazy route chunks can outlive the fixed wait on slow disks: wait out the Suspense fallback.
        await page
          .waitForFunction(() => !document.body.innerText.includes('Chargement de la vue'), {
            timeout: 30000,
          })
          .catch(() => {});

        const responsiveMetrics = await collectResponsiveMetrics(page);
        const focusMetrics = await focusProbe(page, 10);

        const hasCriticalTouchIssue = device.hasTouch
          && (
            responsiveMetrics.touchTargetTooSmallCount > 0
            || responsiveMetrics.touchSpacingViolationsCount > TOUCH_SPACING_MAX_VIOLATIONS
          );
        const pass = !responsiveMetrics.horizontalOverflow
          && responsiveMetrics.iconOnlyButtonsMissingLabel === 0
          && focusMetrics.uniqueFocusTargets >= 3
          && !hasCriticalTouchIssue;

        flowResults.push({
          ...route,
          responsiveMetrics,
          focusMetrics,
          pass,
        });
      }

      await context.close();

      const totals = {
        flows: flowResults.length,
        pass: flowResults.filter((r) => r.pass).length,
        fail: flowResults.filter((r) => !r.pass).length,
        overflowFailures: flowResults.filter((r) => r.responsiveMetrics.horizontalOverflow).length,
        touchTargetFailures: flowResults.filter((r) => r.responsiveMetrics.touchTargetTooSmallCount > 0).length,
        touchSpacingIssueFlows: flowResults.filter(
          (r) => r.responsiveMetrics.touchSpacingViolationsCount > TOUCH_SPACING_WARNING_MAX_VIOLATIONS
        ).length,
        touchSpacingFailures: flowResults.filter(
          (r) => r.responsiveMetrics.touchSpacingViolationsCount > TOUCH_SPACING_MAX_VIOLATIONS
        ).length,
      };

      deviceResults.push({
        device,
        totals,
        flows: flowResults,
      });
    }

    await browser.close();
    stopServer();

    const summary = {
      date: RUN_DATE,
      baseUrl: BASE_URL,
      thresholds: {
        touchTargetMinSizePx: TOUCH_TARGET_MIN_SIZE_PX,
        touchSpacingMinGapPx: TOUCH_SPACING_MIN_GAP_PX,
        touchSpacingWarningMaxViolations: TOUCH_SPACING_WARNING_MAX_VIOLATIONS,
        touchSpacingMaxViolations: TOUCH_SPACING_MAX_VIOLATIONS,
      },
      totals: {
        devices: deviceResults.length,
        flows: deviceResults.reduce((acc, d) => acc + d.totals.flows, 0),
        pass: deviceResults.reduce((acc, d) => acc + d.totals.pass, 0),
        fail: deviceResults.reduce((acc, d) => acc + d.totals.fail, 0),
        touchSpacingIssueFlows: deviceResults.reduce((acc, d) => acc + d.totals.touchSpacingIssueFlows, 0),
        touchSpacingFailures: deviceResults.reduce((acc, d) => acc + d.totals.touchSpacingFailures, 0),
      },
      deviceResults,
    };

    const jsonPath = path.resolve(`docs/md3-multidevice-audit-results-${RUN_DATE}.json`);
    const mdPath = path.resolve(`docs/md3-multidevice-audit-results-${RUN_DATE}.md`);

    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    const lines = [];
    lines.push('# MD3 Multi-Device Audit Results');
    lines.push('');
    lines.push(`Date: ${RUN_DATE}`);
    lines.push(`Base URL: ${BASE_URL}`);
    lines.push('');
    lines.push(`- Devices checked: ${summary.totals.devices}`);
    lines.push(`- Flows checked: ${summary.totals.flows}`);
    lines.push(`- Pass: ${summary.totals.pass}`);
    lines.push(`- Fail: ${summary.totals.fail}`);
    lines.push(`- Touch spacing issue flows (warning): ${summary.totals.touchSpacingIssueFlows}`);
    lines.push(`- Touch spacing failure flows (critical): ${summary.totals.touchSpacingFailures}`);
    lines.push('');
    lines.push('## Device Summary');
    lines.push('');
    lines.push('| Device | Viewport | Touch | Pass | Fail | Overflow issues | Touch target issues | Touch spacing issue flows | Touch spacing failure flows |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

    for (const result of deviceResults) {
      lines.push(
        `| ${result.device.label} | ${result.device.width}x${result.device.height} | ${result.device.hasTouch ? 'Yes' : 'No'} | ${result.totals.pass} | ${result.totals.fail} | ${result.totals.overflowFailures} | ${result.totals.touchTargetFailures} | ${result.totals.touchSpacingIssueFlows} | ${result.totals.touchSpacingFailures} |`
      );
    }

    lines.push('');
    lines.push('## Failures');
    lines.push('');
    lines.push('| Device | Flow | Route | Overflow | Small touch targets | Touch spacing violations | Icon-only buttons missing label | Focus targets |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

    let failureRows = 0;
    for (const result of deviceResults) {
      for (const flow of result.flows.filter((f) => !f.pass)) {
        failureRows += 1;
        lines.push(
          `| ${result.device.label} | ${flow.label} | \`${flow.hash}\` | ${flow.responsiveMetrics.horizontalOverflow ? 'Yes' : 'No'} | ${flow.responsiveMetrics.touchTargetTooSmallCount} | ${flow.responsiveMetrics.touchSpacingViolationsCount} | ${flow.responsiveMetrics.iconOnlyButtonsMissingLabel} | ${flow.focusMetrics.uniqueFocusTargets} |`
        );
      }
    }

    if (failureRows === 0) {
      lines.push('| None | - | - | - | - | - | - | - |');
    }

    lines.push('');
    lines.push('Notes:');
    lines.push(
      `- Touch target checks use a ${TOUCH_TARGET_MIN_SIZE_PX}x${TOUCH_TARGET_MIN_SIZE_PX} CSS px minimum for visible interactive controls.`
    );
    lines.push(
      `- Touch spacing checks use a ${TOUCH_SPACING_MIN_GAP_PX}px minimum gap. Flows warn when violations exceed ${TOUCH_SPACING_WARNING_MAX_VIOLATIONS} and fail touch-device gating only when violations exceed ${TOUCH_SPACING_MAX_VIOLATIONS}.`
    );
    lines.push('- Manual visual verification remains required for nuanced readability and UX quality.');

    await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

    process.stdout.write(`Multi-device audit report written:\n- ${jsonPath}\n- ${mdPath}\n`);

    if (summary.totals.fail > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`MD3 multi-device audit failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    // Close the browser even on failure: a live CDP connection keeps the process alive forever.
    if (browser) await browser.close().catch(() => {});
    stopServer();
  }
};

run();
