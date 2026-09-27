/**
 * Les outils partagés des tests de bout en bout : ouvrir une session démo sur un format,
 * noter un résultat, garder une trace d'un échec.
 */
import fs from 'node:fs';
import path from 'node:path';

export const creerBilan = () => {
    const resultats = [];
    /** Une vérification : son nom, son verdict, ce qui a été mesuré. */
    const ok = (suite, nom, verdict, mesure) => {
        resultats.push({ suite, nom, verdict: Boolean(verdict), mesure });
        const detail = mesure === undefined ? '' : ` ${JSON.stringify(mesure).slice(0, 240)}`;
        process.stdout.write(`${verdict ? '✓' : '✗'} [${suite}] ${nom}${verdict ? '' : detail}\n`);
    };
    return { ok, resultats };
};

/**
 * Une session démo, prête sur `/tasks` ou la page demandée. Chaque session a son navigateur
 * propre (contexte neuf) : aucun état ne passe d'un test à l'autre.
 */
export const ouvrirSession = async (
    navigateur,
    baseUrl,
    { role, largeur = 1440, hauteur = 900, tactile = false, page: adresse = '/tasks' },
) => {
    const contexte = await navigateur.newContext({
        viewport: { width: largeur, height: hauteur },
        locale: 'fr-FR',
        hasTouch: tactile,
        isMobile: tactile,
    });
    // Ceinture et bretelles : Firestore est coupé côté serveur, rien ne doit en sortir.
    await contexte.route('**/*', (route) =>
        /firestore\.googleapis\.com|:commit|\/Write\//.test(route.request().url())
            ? route.abort()
            : route.continue(),
    );
    const page = await contexte.newPage();
    const erreurs = [];
    page.on('pageerror', (erreur) => erreurs.push(erreur.message));

    await page.goto(`${baseUrl}/#/login`, { timeout: 180_000 });
    const compte = page
        .locator(`[aria-label^="Connexion démo"][aria-label$="rôle ${role}"]:visible`)
        .first();
    await compte.waitFor({ timeout: 180_000 });
    await compte.click();
    await page.locator('button[type="submit"]:visible').first().click();
    await page.waitForFunction(() => !location.hash.includes('login'), undefined, {
        timeout: 60_000,
    });
    await page.waitForTimeout(1200);
    await aller(page, adresse);
    return { contexte, page, erreurs };
};

export const aller = async (page, adresse, attente = 1800) => {
    await page.evaluate((cible) => {
        location.hash = cible;
    }, adresse);
    // Au premier passage, le serveur compile encore la page à la demande : on attend qu'elle
    // soit là, puis le temps de ses entrées.
    await page.waitForSelector('main', { timeout: 120_000 });
    await page.waitForTimeout(attente);
};

/** Une capture de l'écran fautif, pour l'artefact de la CI. */
export const capturer = async (page, nom) => {
    const dossier = path.resolve('docs/.tmp/e2e');
    fs.mkdirSync(dossier, { recursive: true });
    await page.screenshot({ path: path.join(dossier, `${nom}.png`) }).catch(() => {});
};
