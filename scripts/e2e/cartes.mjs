/**
 * UNE PART, PUIS SA PAGE (09/10) — une carte ne défile pas dans sa hauteur. Elle montre le
 * début de sa liste, en pièces entières, et renvoie au reste sur une page à part ; le pied
 * ne paraît que si la carte ne montre pas tout.
 *
 * La suite joue sur un portable de 1366 × 657 : c'est là que les cartes manquent de hauteur,
 * et que le panneau de l'inventaire ne montrait plus une rangée. Elle ne suppose rien du jeu
 * de démonstration — elle lit le compte que la carte annonce, et en déduit ce qu'elle doit
 * montrer.
 */
import { aller, capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'cartes';

/** Ce que la fiche montre d'une liste avant de renvoyer à sa page. */
const PLANS_SUR_LA_CARTE = 6;
const MODELES_EN_TUILES = 6;

/** Ce qui défile encore **dans** une carte de `main` — le corps de la page n'en est pas une. */
const cartesQuiDefilent = () =>
    [...document.querySelectorAll('main section *, main aside section')]
        .filter((el) => {
            const style = getComputedStyle(el);
            return (
                /auto|scroll/.test(style.overflowY) &&
                el.clientHeight > 40 &&
                el.scrollHeight > el.clientHeight + 2
            );
        })
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);

/** Les zones mesurées : chaque pièce visible tient entière, et un pied suit ce qui est caché. */
const zonesMesurees = () =>
    [...document.querySelectorAll('main *')]
        .filter((el) => getComputedStyle(el).overflowY === 'clip' && el.clientHeight > 20)
        .map((zone) => {
            const cadre = zone.getBoundingClientRect();
            const pieces = [...zone.children];
            const vues = pieces.filter((p) => getComputedStyle(p).visibility !== 'hidden');
            const carte = zone.closest('section');
            return {
                titre: (carte?.querySelector('h2, h3')?.innerText ?? '').slice(0, 30),
                pieces: pieces.length,
                vues: vues.length,
                rognees: vues.filter((p) => p.getBoundingClientRect().bottom > cadre.bottom + 1.5)
                    .length,
                pied: Boolean(
                    carte &&
                    [...carte.querySelectorAll('button')].some((b) =>
                        /^(Tous|Toutes|Toute|Tout|Les \d|Voir les)/.test(b.innerText.trim()),
                    ),
                ),
            };
        });

const texteDe = (page) =>
    page.evaluate(() => (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' '));
const attendre = (page, motif, delai = 60_000) =>
    page
        .waitForFunction(
            (source) =>
                new RegExp(source).test(
                    (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' '),
                ),
            motif.source,
            { timeout: delai },
        )
        .then(() => true)
        .catch(() => false);
const pied = (page, motif) =>
    page.locator('main button:visible').filter({ hasText: motif }).first();
const retour = (page) => page.locator('[aria-label^="Retour"]:visible').first().click();

export default async function cartes(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);
    const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
        role: 'Super admin',
        largeur: 1366,
        hauteur: 657,
        page: '/',
    });

    try {
        // ── L'accueil : ses listes tiennent, entières, sans défiler
        await attendre(page, /Derniers événements/);
        await page.waitForTimeout(1500);
        let zones = await page.evaluate(zonesMesurees);
        verifier(
            'accueil : les cartes montrent des pièces entières',
            zones.length >= 1 && zones.every((z) => z.rognees === 0 && z.vues >= 1),
            zones,
        );
        verifier(
            'accueil : aucune carte ne défile',
            (await page.evaluate(cartesQuiDefilent)).length === 0,
            await page.evaluate(cartesQuiDefilent),
        );

        // ── Les plans par type : six sur la carte, tous sur leur écran
        await aller(page, '/settings');
        await page.locator('main').getByText('Amortissement par défaut').first().click();
        await attendre(page, /Ce que porte chaque type/);
        await page.waitForTimeout(600);
        const plans = await page.evaluate(() => {
            const carte = [...document.querySelectorAll('main section')].find((s) =>
                /^Ce que porte chaque type/.test(s.innerText.trim()),
            );
            const boutons = [...(carte?.querySelectorAll('button') ?? [])];
            return {
                types: Number((carte?.innerText.match(/sur (\d+) ont leur plan/) ?? [])[1] ?? -1),
                rangees: boutons.filter((b) => !/^Tous les types/.test(b.innerText.trim())).length,
                pied: boutons.some((b) => /^Tous les types/.test(b.innerText.trim())),
            };
        });
        verifier(
            'amortissement : la carte montre une part des types',
            plans.rangees === Math.min(plans.types, PLANS_SUR_LA_CARTE),
            plans,
        );
        verifier(
            'amortissement : le pied ne paraît que si la carte ne montre pas tout',
            plans.pied === plans.types > PLANS_SUR_LA_CARTE,
            plans,
        );
        if (plans.pied) {
            await pied(page, /^Tous les types/).click();
            await page.waitForTimeout(900);
            const ecran = await page.evaluate(() => ({
                titre: document.querySelector('h1, h2')?.innerText,
                rangees: document.querySelectorAll('main section button').length,
            }));
            verifier(
                'amortissement : l’écran « Plans par type » les porte tous',
                ecran.titre === 'Plans par type' && ecran.rangees === plans.types,
                ecran,
            );
            await retour(page);
            await page.waitForTimeout(700);
            verifier(
                'amortissement : son retour ramène à l’amortissement, pas au sommaire',
                /Méthode/.test(await texteDe(page)),
                (await texteDe(page)).slice(0, 80),
            );
        }
        verifier(
            'amortissement : aucune carte ne défile',
            (await page.evaluate(cartesQuiDefilent)).length === 0,
            await page.evaluate(cartesQuiDefilent),
        );

        // ── Les modèles d'un type : le type le plus fourni du catalogue
        await aller(page, '/management');
        await attendre(page, /mod[èe]le/i);
        const fiche = await page.evaluate(() => {
            const cartes = [...document.querySelectorAll('main button, main [role="button"]')]
                .map((el) => ({ el, n: Number((el.innerText.match(/(\d+) modèles?/) ?? [])[1]) }))
                .filter((c) => Number.isFinite(c.n))
                .sort((a, b) => b.n - a.n);
            cartes[0]?.el.click();
            return cartes[0]?.n ?? -1;
        });
        await attendre(page, /Réglages/);
        await page.waitForTimeout(700);
        const modeles = await page.evaluate(() => {
            const carte = [...document.querySelectorAll('main section')].find((s) =>
                /^Modèles/.test(s.innerText.trim()),
            );
            return {
                adresse: location.hash,
                total: Number((carte?.innerText.match(/^Modèles\s+(\d+)/) ?? [])[1] ?? -1),
                tuiles: carte?.querySelectorAll('ul > li').length ?? -1,
                pied: [...(carte?.querySelectorAll('button') ?? [])].some((b) =>
                    /^Tous les modèles/.test(b.innerText.trim()),
                ),
            };
        });
        verifier(
            'type : la carte montre une part de ses modèles',
            modeles.total === fiche &&
                modeles.tuiles === Math.min(modeles.total, MODELES_EN_TUILES),
            { ...modeles, annonce: fiche },
        );
        verifier(
            'type : le pied ne paraît que si la carte ne montre pas tout',
            modeles.pied === modeles.total > MODELES_EN_TUILES,
            modeles,
        );
        if (modeles.pied) {
            await pied(page, /^Tous les modèles/).click();
            await attendre(page, /modèles? · \d+ actifs?/);
            const tous = await page.evaluate(() => ({
                adresse: location.hash,
                tuiles: document.querySelectorAll('main ul > li').length,
            }));
            verifier(
                'type : la page de ses modèles les porte tous',
                tous.adresse === `${modeles.adresse}/modeles` && tous.tuiles === modeles.total,
                tous,
            );
            await retour(page);
            await attendre(page, /Réglages/);
            verifier(
                'type : son retour ramène à la fiche',
                (await page.evaluate(() => location.hash)) === modeles.adresse,
                await page.evaluate(() => location.hash),
            );
        }
        verifier(
            'type : aucune carte ne défile',
            (await page.evaluate(cartesQuiDefilent)).length === 0,
            await page.evaluate(cartesQuiDefilent),
        );

        // ── Le panneau de l'inventaire : des rangées entières, et la page de tous les lieux
        await aller(page, '/audit/overview');
        await page.waitForSelector('main [role="button"]', { timeout: 60_000 });
        await page.waitForTimeout(800);
        /* Le pays qui a le plus de sites : son panneau a une liste à montrer. */
        const pays = await page.evaluate(() => {
            const rangees = [...document.querySelectorAll('main [role="button"]')]
                .map((el) => ({
                    el,
                    nom: el.innerText.trim().split('\n')[0],
                    sites: Number((el.innerText.match(/(\d+) sites?/) ?? [])[1] ?? 0),
                }))
                .sort((x, y) => y.sites - x.sites);
            rangees[0]?.el.click();
            return rangees[0] ? { nom: rangees[0].nom, sites: rangees[0].sites } : null;
        });
        const auPanneau = await attendre(page, /Sites · \d+/, 15_000);
        verifier('inventaire : le panneau montre les sites du pays choisi', auPanneau, pays);
        if (auPanneau && pays) {
            await page.waitForTimeout(700);
            zones = (await page.evaluate(zonesMesurees)).filter((z) => /Sites/.test(z.titre));
            const panneau = zones[0];
            verifier(
                'inventaire : le panneau montre au moins deux rangées, entières',
                Boolean(panneau) &&
                    panneau.pieces === pays.sites &&
                    panneau.rognees === 0 &&
                    panneau.vues >= Math.min(2, panneau.pieces),
                panneau,
            );
            const defile = await page.evaluate(
                () =>
                    [...document.querySelectorAll('main aside *')].filter(
                        (el) =>
                            /auto|scroll/.test(getComputedStyle(el).overflowY) &&
                            el.scrollHeight > el.clientHeight + 2,
                    ).length,
            );
            verifier('inventaire : rien ne défile dans le panneau', defile === 0, defile);
            verifier(
                'inventaire : le pied ne paraît que si le panneau ne montre pas tout',
                Boolean(panneau) && panneau.pied === panneau.vues < panneau.pieces,
                panneau,
            );

            /* La page de tous les lieux, par son adresse : le panneau y renvoie quand il
               ne montre pas tout. */
            await aller(page, `/audit/lieux/${encodeURIComponent(pays.nom)}`, 900);
            await attendre(page, /attendus?/);
            const lieux = await page.evaluate(() => ({
                titre: document.querySelector('h1, h2')?.innerText,
                rangees: document.querySelectorAll('main section [role="button"]').length,
                entete: (document.querySelector('main section')?.innerText ?? '')
                    .replace(/\s+/g, ' ')
                    .slice(0, 60),
            }));
            verifier(
                'inventaire : la page des sites d’un pays les porte tous',
                lieux.titre === 'Sites' && lieux.rangees === pays.sites,
                lieux,
            );
            await retour(page);
            await page.waitForTimeout(900);
            verifier(
                'inventaire : son retour rend la vue globale, panneau tel quel',
                /audit\/overview/.test(await page.evaluate(() => location.hash)) &&
                    /Sites · \d+/.test(await texteDe(page)),
                await page.evaluate(() => location.hash),
            );
        }

        verifier('aucune erreur de page', erreurs.length === 0, erreurs.slice(0, 3));
    } catch (erreur) {
        await capturer(page, 'cartes-arret');
        verifier('la suite va au bout', false, String(erreur).slice(0, 200));
    }
    await contexte.close();
}
