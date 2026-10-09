/**
 * TÂCHES — la refonte du bureau (26/09) : une file partagée (badge = onglet = accueil), le
 * panneau de décision, l'enchaînement, « Annuler » pendant cinq secondes, le clavier, la
 * validation en lot, la remise depuis le panneau ; et le téléphone, qui ouvre ses tâches en feuille.
 */
import { aller, capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'taches';

const etat = (page) =>
    page.evaluate(() => {
        const main = document.querySelector('main');
        const rows = [...main.querySelectorAll('[data-rangee]')];
        const onglet = (t) =>
            [...main.querySelectorAll('button[aria-pressed]')]
                .find((x) => x.textContent.trim().startsWith(t))
                ?.textContent.trim();
        const badge = [...document.querySelectorAll('aside nav button')]
            .find((x) => /Tâches/.test(x.textContent))
            ?.textContent.replace(/\s+/g, '');
        return {
            adresse: location.hash,
            ouverte: main.querySelector('aside h2')?.textContent.trim() ?? null,
            rangees: rows.map((r) => r.querySelector('.truncate')?.textContent.trim()),
            aFaire: onglet('À faire'),
            badge,
            bandeau:
                document
                    .querySelector('[role="status"].mvt-barre')
                    ?.innerText.replace(/\n/g, ' ') ?? null,
            refus: Boolean(document.getElementById('motif-du-refus')),
            vide:
                main.querySelector('aside')?.textContent.includes('Aucune tâche ouverte') ?? false,
        };
    });

const touche = async (page, k, attente = 400) => {
    await page.keyboard.press(k);
    await page.waitForTimeout(attente);
};

export default async function taches(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);

    // — Manager : valider, se reprendre, refuser, enchaîner —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Manager',
        });
        await page.waitForSelector('main aside h2', { timeout: 60_000 });
        let e = await etat(page);
        verifier(
            'la première tâche s’ouvre en arrivant',
            e.ouverte && e.adresse.includes('ouvert='),
            e,
        );
        verifier(
            'badge = onglet « À faire »',
            e.badge &&
                e.aFaire &&
                e.badge.replace('Tâches', '') === e.aFaire.replace('À faire', ''),
            { badge: e.badge, aFaire: e.aFaire },
        );
        const premiere = e.ouverte;
        await touche(page, 'j');
        e = await etat(page);
        verifier('J ouvre la suivante', e.ouverte && e.ouverte !== premiere, e.ouverte);
        await touche(page, 'k');
        e = await etat(page);
        verifier('K revient', e.ouverte === premiere, e.ouverte);
        await touche(page, 'a', 600);
        e = await etat(page);
        verifier(
            'A valide : le bandeau « Annuler » paraît',
            /Validée/.test(e.bandeau ?? ''),
            e.bandeau,
        );
        verifier(
            '  la tâche quitte la file, la suivante s’ouvre',
            e.ouverte && e.ouverte !== premiere,
            { ouverte: e.ouverte, rangees: e.rangees },
        );
        await touche(page, 'z', 600);
        e = await etat(page);
        verifier('Z annule : la tâche revient, rouverte', e.ouverte === premiere && !e.bandeau, {
            ouverte: e.ouverte,
            bandeau: e.bandeau,
        });
        await touche(page, 'a', 300);
        await page.waitForTimeout(5800);
        e = await etat(page);
        verifier(
            'après 5 s, la validation est écrite : badge et onglet suivent',
            !e.bandeau && e.aFaire === 'À faire2' && e.badge === 'Tâches2',
            { aFaire: e.aFaire, badge: e.badge },
        );
        const avantRefus = e.ouverte;
        await touche(page, 'r', 500);
        e = await etat(page);
        verifier('R ouvre le motif dans le pied', e.refus, e);
        await page.locator('main aside form button[type="submit"]').click();
        await page.waitForTimeout(300);
        const manque = await page.evaluate(() =>
            document.getElementById('motif-du-refus')?.getAttribute('aria-invalid'),
        );
        verifier('  refuser sans motif : le champ le dit', manque === 'true', manque);
        await page.locator('main aside form button[aria-pressed]').first().click();
        await page.waitForTimeout(200);
        const motif = await page.evaluate(() => document.getElementById('motif-du-refus')?.value);
        verifier('  une puce remplit le motif', Boolean(motif), motif);
        await page.locator('main aside form button[type="submit"]').click();
        await page.waitForTimeout(600);
        e = await etat(page);
        verifier(
            '  refusé : bandeau, la suivante s’ouvre',
            /Refusée/.test(e.bandeau ?? '') && e.ouverte !== avantRefus,
            { bandeau: e.bandeau, ouverte: e.ouverte },
        );
        await page.waitForTimeout(5800);
        await touche(page, '?', 500);
        const aide = await page.evaluate(() =>
            document.querySelector('[role="dialog"]')?.innerText.slice(0, 80),
        );
        verifier('? ouvre l’aide des touches', /touches/i.test(aide ?? ''), aide);
        await touche(page, 'Escape', 400);
        await page.locator('main [role="group"] button:has-text("À suivre")').click();
        await page.waitForTimeout(900);
        e = await etat(page);
        verifier('la tâche ouverte suit l’onglet', e.ouverte && e.adresse.includes('following-'), {
            ouverte: e.ouverte,
            adresse: e.adresse,
        });
        await touche(page, 'Escape', 500);
        e = await etat(page);
        verifier('Échap laisse le panneau vide', e.vide && !e.adresse.includes('ouvert='), e);
        await touche(page, 'j', 500);
        e = await etat(page);
        verifier('J rouvre la première', Boolean(e.ouverte), e.ouverte);
        await page.locator('main [role="group"] button:has-text("À faire")').click();
        await page.waitForTimeout(900);
        await page.locator('main [data-rangee]').first().hover();
        await page.waitForTimeout(150);
        await page.locator('main [data-rangee] button[aria-label^="Sélectionner"]').first().click();
        await page.waitForTimeout(500);
        const lot = await page.evaluate(() =>
            [...document.querySelectorAll('[role="toolbar"] button')]
                .map((x) => x.textContent.trim())
                .filter((t) => /^Valider|^Exporter/.test(t)),
        );
        verifier(
            'la case au survol coche ; « Valider » paraît dans la barre',
            lot.some((t) => t.startsWith('Valider')),
            lot,
        );
        verifier('manager : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        if (erreurs.length) await capturer(page, 'taches-manager');
        await contexte.close();
    }

    // — Super admin : remettre depuis le panneau, la file reste dessous —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Super admin',
        });
        // L'ordre de la file bouge avec les âges : on ouvre une remise nommément.
        await page
            .locator('main [data-rangee]')
            .filter({ has: page.locator('span', { hasText: /^Remise$/ }) })
            .first()
            .click();
        await page.waitForTimeout(600);
        let e = await etat(page);
        const avant = e.ouverte;
        await touche(page, 'a', 1500);
        const r = await page.evaluate(() => ({
            adresse: location.hash,
            fileDessous: document.querySelectorAll('main [data-rangee]').length,
        }));
        verifier(
            /* L'unité se choisit dans la feuille, plus dans le panneau (08/10). */
            'A sur une remise : la feuille s’ouvre, demande et personne connues',
            /wizards\/assignment/.test(r.adresse) &&
                /approvalId=/.test(r.adresse) &&
                /userId=/.test(r.adresse) &&
                !/equipmentId=/.test(r.adresse) &&
                /ouvert=/.test(r.adresse),
            r.adresse,
        );
        verifier('  la file reste dessous', r.fileDessous > 0, r.fileDessous);
        await touche(page, 'Escape', 1200);
        e = await etat(page);
        verifier(
            '  refermer revient à la file, la tâche ouverte',
            e.adresse.startsWith('#/tasks') && e.ouverte === avant,
            { adresse: e.adresse, ouverte: e.ouverte },
        );
        await aller(page, '/');
        /* L'accueil peut mettre plus que l'attente fixe à se rendre : on attend son nombre
           (08/10 — deux échecs sur trois, la valeur absente, pas fausse). */
        await page
            .waitForFunction(
                () =>
                    /(\d+) (demandes en attente|choses? vous attend)/.test(
                        document.querySelector('main')?.innerText ?? '',
                    ),
                undefined,
                { timeout: 20_000 },
            )
            .catch(() => {});
        const accueil = await page.evaluate(
            () =>
                document
                    .querySelector('main')
                    ?.innerText.match(/(\d+) (demandes en attente|choses? vous attend)/)?.[1],
        );
        verifier(
            'accueil : le même nombre que l’onglet',
            accueil === (e.aFaire ?? '').replace('À faire', ''),
            { accueil, aFaire: e.aFaire },
        );
        verifier('super admin : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        if (erreurs.length) await capturer(page, 'taches-superadmin');
        await contexte.close();
    }

    // — Admin et utilisateur : les comptes concordent —
    for (const role of ['Admin', 'Utilisateur']) {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, { role });
        // L'onglet peut se rendre après l'ouverture de session : on l'attend.
        await page
            .waitForFunction(
                () =>
                    [...document.querySelectorAll('main button[aria-pressed]')].some((x) =>
                        x.textContent.trim().startsWith('À faire'),
                    ),
                undefined,
                { timeout: 20_000 },
            )
            .catch(() => {});
        const e = await etat(page);
        const badge = (e.badge ?? 'Tâches0').replace('Tâches', '');
        const onglet = (e.aFaire ?? 'À faire0').replace('À faire', '');
        verifier(`${role} : badge = onglet « À faire »`, badge === onglet, {
            badge: e.badge,
            aFaire: e.aFaire,
        });
        verifier(`${role} : aucune erreur`, erreurs.length === 0, erreurs.slice(0, 2));
        await contexte.close();
    }

    // — Téléphone : la file groupée, une tâche s'ouvre en feuille —
    {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Manager',
            largeur: 393,
            hauteur: 852,
            tactile: true,
        });
        /* L'accueil a déjà son `main` : on attend la file elle-même, pas un délai fixe
           (09/10 — sur une machine chargée, le test lisait encore l'accueil). */
        await page
            .locator('main [data-rangee]')
            .first()
            .waitFor({ timeout: 30_000 })
            .catch(() => {});
        const m = await page.evaluate(() => ({
            groupes: [...document.querySelectorAll('main h3')].map((h) => h.textContent.trim()),
            panneaux: document.querySelectorAll('main aside').length,
            rangees: document.querySelectorAll('main [data-rangee]').length,
        }));
        verifier(
            'téléphone : la file groupée, sans panneau',
            m.groupes.length >= 1 && m.rangees > 0 && m.panneaux === 0,
            m,
        );
        /* **Une seule porte au téléphone : la feuille** (08/10). La tâche s'y lit avec le
           détail du panneau du bureau ; l'écran de la demande est retiré. */
        await page.locator('main [data-rangee]').first().click();
        await page.waitForTimeout(1200);
        const f = await page.evaluate(() => {
            const feuille = [...document.querySelectorAll('[role=dialog]')].pop();
            return {
                adresse: location.hash,
                titre: feuille?.querySelector('h2')?.textContent.trim() ?? null,
                parcours: /Le parcours/.test(feuille?.textContent ?? ''),
            };
        });
        verifier(
            'téléphone : une tâche s’ouvre en feuille, la file dessous',
            Boolean(f.titre) && f.parcours && /^#\/tasks/.test(f.adresse),
            f,
        );
        verifier('téléphone : aucune erreur', erreurs.length === 0, erreurs.slice(0, 2));
        await contexte.close();
    }
}
