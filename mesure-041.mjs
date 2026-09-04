import { chromium } from 'playwright';

const px = (v) => (v || '').replace('px', '');
const fmt = (cs, keys) => keys.map((k) => `${k}=${cs[k]}`).join(' · ');

const run = async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await page.goto('http://localhost:5199/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.fill('input[type="email"]', 'alice.admin@tracker.app');
    await page.fill('input[type="password"]', 'demo-password');
    await page.click('button:has-text("Se connecter")');
    await page.waitForTimeout(3500);
    await page.evaluate(() => { window.location.hash = '#/inventory'; });
    await page.waitForTimeout(2500);

    const probe = await page.evaluate(() => {
        const g = (el) => el && getComputedStyle(el);
        const pick = (cs, ks) => (cs ? Object.fromEntries(ks.map((k) => [k, cs[k]])) : null);
        const T = ['fontSize', 'lineHeight', 'fontWeight', 'color', 'letterSpacing'];
        const B = ['height', 'minHeight', 'backgroundColor', 'borderRadius', 'borderTopWidth', 'paddingLeft', 'columnGap'];

        const out = {};
        const h1 = document.querySelector('h1');
        out.h1 = pick(g(h1), [...T, 'paddingTop', 'paddingBottom']);
        const head = h1 && h1.closest('div.border-b');
        out.head = head && { ...pick(g(head), ['paddingTop', 'paddingBottom', 'paddingLeft', 'rowGap']), h: head.getBoundingClientRect().height };

        const field = document.querySelector('input[type="search"], input[placeholder*="Code"]');
        out.field = pick(g(field), [...T]);
        const fieldBox = field && field.closest('div');
        out.fieldBox = fieldBox && { ...pick(g(fieldBox), B), h: fieldBox.getBoundingClientRect().height };

        const fbtn = document.querySelector('button[aria-label^="Filtrer"]');
        out.fbtn = fbtn && { ...pick(g(fbtn), B), w: fbtn.getBoundingClientRect().width, h: fbtn.getBoundingClientRect().height };

        // la ligne du décompte
        const cnt = [...document.querySelectorAll('div')].find((d) => /actifs ·/.test(d.textContent || '') && d.querySelector('button'));
        out.cntText = cnt && cnt.textContent.trim().replace(/\s+/g, ' ');
        out.cnt = cnt && { ...pick(g(cnt), [...T, 'minHeight', 'paddingLeft']) };
        const sort = cnt && cnt.querySelector('button');
        out.sort = sort && pick(g(sort), [...T, 'minHeight']);

        // une rangée
        const row = document.querySelector('section button');
        out.row = row && { ...pick(g(row), ['minHeight', 'columnGap', 'paddingTop', 'paddingBottom']), h: row.getBoundingClientRect().height };
        const spans = row ? row.querySelectorAll('span') : [];
        out.vig = spans[0] && { ...pick(g(spans[0]), ['width', 'height', 'borderRadius', 'backgroundColor']) };
        const l1 = row && row.querySelector('span > span > span');
        out.title = l1 && pick(g(l1), T);
        const ty = l1 && l1.nextElementSibling;
        out.type = ty && pick(g(ty), T);
        const l2 = l1 && l1.parentElement.nextElementSibling;
        out.l2 = l2 && pick(g(l2), [...T, 'marginTop', 'columnGap']);
        const aid = l2 && l2.lastElementChild;
        out.aid = aid && aid.tagName === 'SPAN' ? pick(g(aid), T) : null;

        out.card = (() => { const c = document.querySelector('section'); return c && { ...pick(g(c), ['backgroundColor', 'borderRadius', 'paddingLeft']) }; })();
        out.chips = document.querySelectorAll('[aria-pressed]').length;
        return out;
    });
    console.log(JSON.stringify(probe, null, 1));

    // la feuille du filtre
    await page.click('button[aria-label^="Filtrer"]');
    await page.waitForTimeout(700);
    const sheet = await page.evaluate(() => {
        const g = (el) => el && getComputedStyle(el);
        const pick = (cs, ks) => (cs ? Object.fromEntries(ks.map((k) => [k, cs[k]])) : null);
        const T = ['fontSize', 'lineHeight', 'fontWeight', 'color', 'letterSpacing'];
        const dlg = document.querySelector('[role="dialog"]');
        const h2 = dlg && dlg.querySelector('h2');
        const chip = dlg && dlg.querySelector('[aria-pressed]');
        const on = dlg && dlg.querySelector('[aria-pressed="true"]');
        const lbl = dlg && dlg.querySelector('p');
        const btn = dlg && [...dlg.querySelectorAll('button')].find((b) => /Voir les/.test(b.textContent));
        return {
            title: h2 && pick(g(h2), [...T, 'fontFamily']),
            titleBox: h2 && pick(g(h2.parentElement), ['paddingTop', 'paddingLeft', 'paddingRight', 'borderBottomWidth']),
            groupLabel: lbl && { txt: lbl.textContent, ...pick(g(lbl), T) },
            chip: chip && { txt: chip.textContent, ...pick(g(chip), [...T, 'minHeight', 'paddingLeft', 'backgroundColor', 'borderRadius', 'columnGap']) },
            chipOn: on && { txt: on.textContent, ...pick(g(on), ['backgroundColor', 'color']) },
            chipCount: chip && chip.querySelector('b') && pick(g(chip.querySelector('b')), T),
            btn: btn && { txt: btn.textContent, ...pick(g(btn), [...T, 'minHeight', 'backgroundColor', 'borderRadius']) },
            groups: [...dlg.querySelectorAll('p')].map((p) => p.textContent),
        };
    });
    console.log('--- FEUILLE FILTRER');
    console.log(JSON.stringify(sheet, null, 1));
    await page.screenshot({ path: '/tmp/claude-1000/-mnt-hgfs-111-NEEMBA-NEEMBA-TOGO-TRACKER/64d19aed-04ee-4ab4-bcd8-5ff93de492cf/scratchpad/041-filtre.png' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/claude-1000/-mnt-hgfs-111-NEEMBA-NEEMBA-TOGO-TRACKER/64d19aed-04ee-4ab4-bcd8-5ff93de492cf/scratchpad/041-liste.png' });
    await browser.close();
};
run().catch((e) => { console.error(e); process.exit(1); });
