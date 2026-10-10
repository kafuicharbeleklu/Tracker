/**
 * LE SQUELETTE A LA GRILLE DE SA PAGE (10/10) — pendant qu'un écran arrive, ses cartes sont
 * déjà à leur place : même première ligne, mêmes colonnes. Quand la page paraît, rien ne
 * glisse de côté ni ne descend.
 *
 * Relevé trois fois par le commanditaire (« le squelette de certaines pages n'est pas fidèle
 * aux cartes de ces pages », puis « certaines pages bureau ne sont pas fidèles à 100 % à la
 * grille de leurs cartes ») : une page dont on déplace l'en-tête ou dont on change la grille
 * sans toucher à son squelette refait l'écart. Cette suite le voit.
 *
 * Elle retarde le code de chaque page pour tenir l'attente à l'écran, relève les cartes du
 * squelette, puis celles de la page arrivée. Elle ne compare que ce qui ne dépend pas des
 * données : la forme choisie, le haut de la première carte, et les colonnes (bord gauche et
 * largeur) — pas les hauteurs, qui suivent le nombre de rangées.
 */
import { capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'squelettes';

/** L'adresse, et la forme que le squelette doit prendre. */
const PAGES = [
    ['/dashboard', 'accueil'],
    ['/tasks', 'taches'],
    ['/finance', 'finances'],
    ['/finance/expenses', 'depenses'],
    ['/finance/lines', 'lignes'],
    ['/reports', 'rapports'],
    ['/audit/overview', 'inventaire'],
    ['/management', 'catalogue'],
    ['/inventory', 'tableau'],
    ['/users', 'tableau'],
    ['/locations', 'emplacements'],
    ['/history', 'historique'],
    ['/settings', 'parametres'],
    ['/rbac', 'acces'],
];

/** Ce que le code d'une page attend avant d'arriver : assez pour lire le squelette. */
const RETARD_MS = 2200;
/** Un arrondi de sous-pixel, pas un écart. */
const TOLERANCE = 2;

/** Les cartes de premier rang d'une racine, visibles dans la fenêtre : `[gauche, haut, largeur]`. */
const lireLesCartes = (selecteur) => {
    const racine = document.querySelector(selecteur);
    if (!racine) return null;
    const estUneCarte = (el) => {
        const cadre = el.getBoundingClientRect();
        return (
            /rounded-card|rounded-xl|rounded-lg/.test(String(el.className)) &&
            getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)' &&
            cadre.height > 60 &&
            cadre.width > 140 &&
            cadre.top < innerHeight &&
            cadre.bottom > 0
        );
    };
    const toutes = [...racine.querySelectorAll('*')].filter(estUneCarte);
    return toutes
        .filter((carte) => !toutes.some((autre) => autre !== carte && autre.contains(carte)))
        .map((carte) => {
            const cadre = carte.getBoundingClientRect();
            return [Math.round(cadre.left), Math.round(cadre.top), Math.round(cadre.width)];
        });
};

export default async function squelettes(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);
    const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
        role: 'Super admin',
        largeur: 1440,
        hauteur: 900,
        page: '/dashboard',
    });

    try {
        let retard = 0;
        await contexte.route(/\/features\/.+\/pages\/.+\.tsx/, async (route) => {
            if (retard) await new Promise((suite) => setTimeout(suite, retard));
            await route.fallback();
        });

        for (const [adresse, forme] of PAGES) {
            retard = RETARD_MS;
            await page.evaluate((cible) => {
                location.hash = cible;
            }, adresse);
            await page.reload({ waitUntil: 'commit' });
            const attente = page.locator('[data-testid="route-loading-fallback"]');
            const vu = await attente
                .waitFor({ timeout: 120_000 })
                .then(() => true)
                .catch(() => false);
            if (!vu) {
                verifier(`${adresse} : le squelette paraît pendant l’attente`, false);
                continue;
            }
            await page.waitForTimeout(350);
            const prise = await attente.getAttribute('data-forme');
            const avant = await page.evaluate(
                lireLesCartes,
                '[data-testid="route-loading-fallback"]',
            );
            verifier(`${adresse} : le squelette prend la forme « ${forme} »`, prise === forme, {
                prise,
            });

            retard = 0;
            await attente.waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {});
            /* La page arrivée, ses propres attentes levées, ses entrées jouées. */
            await page
                .waitForFunction(() => !document.querySelector('main .mvt-attente'), undefined, {
                    timeout: 60_000,
                })
                .catch(() => {});
            await page.waitForTimeout(1500);
            const apres = await page.evaluate(lireLesCartes, 'main');

            if (!avant?.length || !apres?.length) {
                verifier(`${adresse} : des cartes à comparer`, false, { avant, apres });
                continue;
            }
            const haut = (cartes) => Math.min(...cartes.map((carte) => carte[1]));
            verifier(
                `${adresse} : la première carte ne bouge pas`,
                Math.abs(haut(avant) - haut(apres)) <= TOLERANCE,
                { squelette: haut(avant), page: haut(apres) },
            );
            /* Chaque colonne de la page existe dans le squelette : bord gauche et largeur. */
            const orphelines = apres.filter(
                ([gauche, , largeur]) =>
                    !avant.some(
                        ([g, , l]) =>
                            Math.abs(g - gauche) <= TOLERANCE && Math.abs(l - largeur) <= TOLERANCE,
                    ),
            );
            verifier(`${adresse} : les colonnes sont celles de la page`, orphelines.length === 0, {
                orphelines: orphelines.slice(0, 4),
                squelette: [...new Set(avant.map(([g, , l]) => `${g}+${l}`))],
            });
            if (orphelines.length > 0)
                await capturer(page, `squelettes${adresse.replace(/\W+/g, '-')}`);
        }

        verifier('aucune erreur de page', erreurs.length === 0, erreurs.slice(0, 3));
    } catch (erreur) {
        await capturer(page, 'squelettes-arret');
        verifier('la suite va au bout', false, String(erreur).slice(0, 200));
    }
    await contexte.close();
}
