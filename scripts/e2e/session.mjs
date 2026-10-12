/**
 * LA DÉCONNEXION (12/10) — elle ferme la session du Tracker sans ouvrir de fenêtre. Une
 * fenêtre de Microsoft s'ouvrait à chaque déconnexion, même d'un compte de démonstration,
 * qui n'a rien à fermer chez Microsoft.
 */
import { capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'session';

const FORMATS = [
    ['bureau', { largeur: 1440, hauteur: 900 }],
    ['téléphone', { largeur: 393, hauteur: 852, tactile: true }],
];

export default async function session(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);

    for (const [format, taille] of FORMATS) {
        const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
            role: 'Super admin',
            ...taille,
            page: '/',
        });
        /* Toute fenêtre ouverte par la page, et tout appel à `window.open`. */
        const fenetres = [];
        contexte.on('page', (ouverte) => fenetres.push(ouverte.url()));
        await page.evaluate(() => {
            window.__ouvertures = [];
            const ouvrir = window.open;
            window.open = (...args) => {
                window.__ouvertures.push(String(args[0] ?? ''));
                return ouvrir.apply(window, args);
            };
        });

        await page.locator('button[aria-label^="Compte"]:visible').first().click();
        const sortie = page.locator('[role="menuitem"]').filter({ hasText: 'Se déconnecter' });
        await sortie.first().waitFor({ timeout: 10_000 });
        await sortie.first().click();

        const fermee = await page
            .locator('[aria-label^="Connexion démo"]:visible')
            .first()
            .waitFor({ timeout: 20_000 })
            .then(() => true)
            .catch(() => false);
        /* Une fenêtre de Microsoft mettrait un instant à paraître. */
        await page.waitForTimeout(800);
        const ouvertures = await page.evaluate(() => window.__ouvertures ?? []);

        verifier(`${format} : se déconnecter ramène à l'écran de connexion`, fermee, {
            adresse: await page.evaluate(() => location.hash),
        });
        verifier(
            `${format} : aucune fenêtre ne s'ouvre à la déconnexion`,
            fenetres.length === 0 && ouvertures.length === 0,
            { fenetres, ouvertures },
        );

        /* Recharger ne rouvre pas la session qu'on vient de fermer. */
        await page.reload();
        const toujoursFermee = await page
            .locator('[aria-label^="Connexion démo"]:visible')
            .first()
            .waitFor({ timeout: 60_000 })
            .then(() => true)
            .catch(() => false);
        verifier(`${format} : la session reste fermée après rechargement`, toujoursFermee, {
            adresse: await page.evaluate(() => location.hash),
        });

        if (!fermee || fenetres.length || ouvertures.length)
            await capturer(page, `session-${format}`);
        verifier(`${format} : aucune erreur de page`, erreurs.length === 0, erreurs.slice(0, 2));
        await contexte.close();
    }
}
