/**
 * SÉLECTION GROUPÉE (26/09) — au bureau et au rail, le titre reste, `SelectionBarBureau`
 * remplace la ligne d'outils et porte les gestes à leur largeur, sans pied pleine fenêtre ;
 * le panneau d'une liste reste et résume. Au téléphone, rien ne change (17.2).
 */
import { aller, capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'selection';

const mesure = (page) =>
    page.evaluate(() => {
        const r = (el) => {
            if (!el) return null;
            const { x, y, width, height } = el.getBoundingClientRect();
            return {
                x: Math.round(x),
                y: Math.round(y),
                w: Math.round(width),
                h: Math.round(height),
            };
        };
        const barre = document.querySelector('[role="toolbar"][aria-label="Sélection"]');
        const pied = [...document.querySelectorAll('.fixed.bottom-0')].find((x) =>
            x.className.includes('mvt-barre'),
        );
        const main = document.querySelector('main');
        return {
            titre: main.querySelector('h1')?.textContent,
            barre: r(barre),
            boutons: barre
                ? [...barre.querySelectorAll('button')].map((x) => [
                      x.innerText.trim() || x.getAttribute('aria-label'),
                      r(x).w,
                      r(x).h,
                  ])
                : null,
            pied: r(pied),
            premiereRangee: r(main.querySelector('[data-rangee]')),
            panneau: main.querySelector('aside')?.innerText.slice(0, 60) ?? null,
        };
    });

/** Cocher une rangée : la case du tableau, sinon un appui long. */
const selectionner = async (page) => {
    const coche = page.locator('main button[aria-label="Sélectionner"]:visible');
    if (await coche.count()) {
        await page.locator('main table tbody tr:visible').nth(1).hover();
        await coche.nth(1).click();
    } else {
        const box = await page.locator('main [data-rangee]:visible').nth(1).boundingBox();
        await page.mouse.move(box.x + 40, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(800);
        await page.mouse.up();
    }
    await page.waitForTimeout(600);
};

export default async function selection(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesureFaite) => ok(SUITE, nom, verdict, mesureFaite);

    // — Bureau —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Super admin',
            page: '/inventory',
        });
        const tableau = page.locator('main button:has-text("Tableau")').first();
        if (await tableau.count()) {
            await tableau.click();
            await page.waitForTimeout(1200);
        }
        await page.waitForSelector('main table tbody tr[data-rangee]');
        await page.waitForTimeout(1200);
        const avant = await mesure(page);
        await page.locator('main table tbody tr').nth(1).hover();
        await page.locator('main table button[aria-label="Sélectionner"]').nth(1).click();
        await page.waitForTimeout(500);
        let m = await mesure(page);
        verifier(
            'Actifs (tableau) : le titre reste, la barre est dans la page',
            m.titre === 'Actifs' && m.barre && m.barre.x >= 240 && !m.pied,
            m,
        );
        verifier(
            '  la première rangée ne bouge pas',
            avant.premiereRangee &&
                m.premiereRangee &&
                Math.abs(avant.premiereRangee.y - m.premiereRangee.y) <= 4,
            { avant: avant.premiereRangee, apres: m.premiereRangee },
        );
        verifier(
            '  « Exporter » garde sa largeur',
            m.boutons?.some(([texte, largeur]) => /Exporter/.test(texte) && largeur < 200),
            m.boutons,
        );
        const plus = page.locator('[role="toolbar"] button[aria-label^="Autres actions"]');
        if (await plus.count()) {
            await plus.click();
            await page.waitForTimeout(400);
            const menu = await page.evaluate(() => {
                const liste = document.querySelector('[role="menu"]');
                const barre = document.querySelector('[role="toolbar"]');
                return liste && barre
                    ? {
                          menu: Math.round(liste.getBoundingClientRect().top),
                          barre: Math.round(barre.getBoundingClientRect().bottom),
                      }
                    : null;
            });
            verifier('  le ⋮ s’ouvre sous la barre', menu && menu.menu >= menu.barre - 2, menu);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        m = await mesure(page);
        verifier('  Échap sort de la sélection', !m.barre, m.barre);

        await aller(page, '/tasks');
        await page.waitForSelector('main [data-rangee]');
        await page.waitForTimeout(1200);
        const av = await mesure(page);
        await page.locator('main [data-rangee]').nth(1).hover();
        await page.locator('main [data-rangee] button[aria-label^="Sélectionner"]').nth(1).click();
        await page.waitForTimeout(600);
        m = await mesure(page);
        verifier(
            'Tâches : la liste ne saute pas, le panneau résume',
            av.premiereRangee &&
                m.premiereRangee &&
                av.premiereRangee.x === m.premiereRangee.x &&
                av.premiereRangee.w === m.premiereRangee.w &&
                /dans la sélection/.test(m.panneau ?? ''),
            { avant: av.premiereRangee, apres: m.premiereRangee, panneau: m.panneau },
        );
        verifier('  barre dans la page, pas de pied', m.barre && !m.pied, {
            barre: m.barre,
            pied: m.pied,
        });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        await aller(page, '/users');
        await selectionner(page);
        m = await mesure(page);
        verifier('Équipe : barre dans la page', Boolean(m.barre) && !m.pied, m);
        verifier('bureau : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        if (erreurs.length) await capturer(page, 'selection-bureau');
        await contexte.close();
    }

    // — Rail, au doigt —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Super admin',
            largeur: 768,
            hauteur: 1024,
            tactile: true,
            page: '/management',
        });
        await selectionner(page);
        let m = await mesure(page);
        verifier(
            'Catalogue (768, au doigt) : barre dans la page, gestes à 40',
            Boolean(m.barre) && !m.pied && m.boutons?.every(([, , hauteur]) => hauteur >= 40),
            m,
        );
        await aller(page, '/inventory');
        await selectionner(page);
        m = await mesure(page);
        verifier('Actifs (768, au doigt) : barre dans la page', Boolean(m.barre) && !m.pied, m);
        verifier('tablette : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        if (erreurs.length) await capturer(page, 'selection-tablette');
        await contexte.close();
    }

    // — Téléphone —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Super admin',
            largeur: 393,
            hauteur: 852,
            tactile: true,
            page: '/inventory',
        });
        await page.locator('main [data-rangee]').nth(1).click({ delay: 800 });
        await page.waitForTimeout(600);
        const m = await mesure(page);
        const hautSombre = await page.evaluate(() =>
            Boolean(document.querySelector('.bg-inverse-surface.min-h-14')),
        );
        verifier(
            'téléphone : inchangé — barre sombre en haut, pied en bas',
            hautSombre && m.pied && !m.barre,
            { pied: m.pied, barre: m.barre },
        );
        verifier('téléphone : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        await contexte.close();
    }
}
