/**
 * LE CLAVIER D'UNE TABLETTE OU D'UN BUREAU (P3, 25/09) — ⌘K (Ctrl+K) pour chercher, Échap pour
 * fermer une chose à la fois : la feuille avant la fiche, la fiche avant la liste, la feuille
 * d'acte avant la page qu'elle couvre, la sélection, la tâche du panneau.
 */
import { aller, capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'clavier';

const etat = (page) =>
    page.evaluate(() => ({
        hash: location.hash,
        focus:
            document.activeElement?.tagName +
            (document.activeElement?.hasAttribute('data-recherche-de-page') ? '[recherche]' : '') +
            (document.activeElement?.closest('[aria-modal="true"]') ? '(dans feuille)' : ''),
        feuille:
            [...document.querySelectorAll('[aria-modal="true"]')]
                .map((d) => d.querySelector('h2')?.textContent || d.getAttribute('aria-label'))
                .join('|') || null,
        valeur: document.querySelector('input[data-recherche-de-page]')?.value ?? null,
    }));

/** La première carte de la liste (hors panneau). */
const ouvrirPremiereCarte = (page) =>
    page.evaluate(() => {
        document.activeElement?.blur();
        const carte = [...document.querySelectorAll('main button[type="button"]')].filter(
            (x) => x.getBoundingClientRect().height >= 52 && !x.closest('aside'),
        )[0];
        carte?.click();
    });

export default async function clavier(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);
    const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
        role: 'Super admin',
        largeur: 1180,
        hauteur: 820,
        tactile: true,
        page: '/inventory',
    });

    // ⌘K sur une liste
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Meta+k');
    let e = await etat(page);
    verifier('⌘K met le curseur dans la recherche d’Actifs', e.focus.includes('[recherche]'), e);
    await page.keyboard.type('LPT');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    e = await etat(page);
    verifier('Échap vide la recherche', e.valeur === '' && e.focus.includes('[recherche]'), e);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    e = await etat(page);
    verifier('Échap sur un champ vide rend la main', !e.focus.includes('[recherche]'), e);
    await page.keyboard.press('Control+k');
    e = await etat(page);
    verifier('Ctrl+K aussi', e.focus.includes('[recherche]'), e);

    // ⌘K d'une page sans recherche : Actifs
    await aller(page, '/finance', 1500);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(1800);
    e = await etat(page);
    verifier(
        '⌘K depuis Finances ouvre Actifs, curseur prêt',
        e.hash === '#/inventory' && e.focus.includes('[recherche]'),
        e,
    );

    // Échap ferme une chose à la fois
    await aller(page, '/inventory', 1500);
    await ouvrirPremiereCarte(page);
    await page.waitForTimeout(1200);
    e = await etat(page);
    verifier('une carte ouvre sa fiche à côté', e.hash.includes('ouvert='), e);
    await page.locator('main button:has-text("Filtrer")').first().click();
    await page.waitForTimeout(600);
    e = await etat(page);
    verifier('la feuille de filtre s’ouvre', Boolean(e.feuille), e);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    e = await etat(page);
    verifier('Échap ferme la feuille, pas la fiche', !e.feuille && e.hash.includes('ouvert='), e);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    e = await etat(page);
    verifier('Échap ferme ensuite la fiche', !e.hash.includes('ouvert='), e);

    // La feuille d'acte, sur la liste et sa fiche
    await ouvrirPremiereCarte(page);
    await page.waitForTimeout(1200);
    const attribuer = page.locator('main aside button:has-text("Attribuer")').first();
    if (await attribuer.count()) {
        await attribuer.click();
        await page.waitForTimeout(800);
        await page.keyboard.press('Meta+k');
        e = await etat(page);
        verifier(
            '⌘K dans la feuille « Remettre » : sa propre recherche',
            e.focus.includes('(dans feuille)'),
            e,
        );
        const dessous = await page.evaluate(() => ({
            liste: Boolean(document.querySelector('input[data-recherche-de-page]')),
            panneau: [...document.querySelectorAll('main aside h2')]
                .map((h) => h.textContent)
                .join('|'),
        }));
        verifier(
            'sous la feuille : la liste et la fiche du panneau',
            dessous.liste && dessous.panneau.length > 0,
            dessous,
        );
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
        e = await etat(page);
        if (e.feuille) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(600);
            e = await etat(page);
        }
        verifier(
            'Échap ferme la feuille d’acte et revient à la liste, fiche ouverte',
            !e.feuille && e.hash.startsWith('#/inventory?ouvert='),
            e,
        );
    } else {
        verifier('la fiche porte « Attribuer »', false, 'bouton introuvable');
    }

    // Échap quitte la sélection
    await aller(page, '/inventory', 1500);
    const tableau = page.locator('main button[aria-label="Tableau"]');
    if (await tableau.count()) {
        await tableau.click();
        await page.waitForTimeout(1000);
        const cases = page.locator('main table button[aria-label="Sélectionner"]');
        if ((await cases.count()) > 1) {
            await cases.nth(1).click();
            await page.waitForTimeout(600);
            const avant = await page.evaluate(() =>
                Boolean(document.querySelector('button[aria-label="Quitter la sélection"]')),
            );
            await page.evaluate(() => document.activeElement?.blur());
            await page.keyboard.press('Escape');
            await page.waitForTimeout(600);
            const apres = await page.evaluate(() =>
                Boolean(document.querySelector('button[aria-label="Quitter la sélection"]')),
            );
            verifier('Échap quitte la sélection', avant && !apres, { avant, apres });
        }
        await page.locator('main button[aria-label="Cartes"]').click();
        await page.waitForTimeout(600);
    }

    // Échap referme la tâche du panneau
    await aller(page, '/tasks', 1800);
    const ouverte = await page.evaluate(() => Boolean(document.querySelector('main aside h2')));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const fermee = await page.evaluate(() =>
        Boolean(
            [...document.querySelectorAll('main aside')].find((a) =>
                a.textContent.includes('Aucune tâche ouverte'),
            ),
        ),
    );
    verifier('Échap referme la tâche du panneau', ouverte && fermee, { ouverte, fermee });

    verifier('clavier : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
    if (erreurs.length) await capturer(page, 'clavier');
    await contexte.close();
}
