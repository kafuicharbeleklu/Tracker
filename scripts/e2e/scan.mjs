/**
 * LE SCAN (09/10) — le viseur ouvre la caméra et lit : un code dans le cadre devient une
 * lecture écrite en clair, la caméra se tait tant qu'un verdict attend, un code que rien ne
 * porte ne s'accepte pas, et le viseur se referme en rendant la caméra.
 *
 * La caméra et le décodeur du navigateur sont simulés dans la page : un flux tiré d'un
 * canevas, un `BarcodeDetector` qui rend le code qu'on lui souffle. Ce que la suite vérifie
 * est le viseur — pas l'optique.
 */
import { capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'scan';

/** Posé dans la page avant d'ouvrir le viseur : le crochet lit ces deux API à son montage. */
const simulerLaCamera = (refusee = false) => {
    window.__code = '';
    window.__regards = 0;
    window.BarcodeDetector = class {
        static getSupportedFormats() {
            return Promise.resolve(['qr_code', 'code_128']);
        }
        detect() {
            window.__regards += 1;
            return Promise.resolve(window.__code ? [{ rawValue: window.__code }] : []);
        }
    };
    navigator.mediaDevices.getUserMedia = () => {
        if (refusee)
            return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
        const canevas = document.createElement('canvas');
        canevas.width = 640;
        canevas.height = 480;
        const ctx = canevas.getContext('2d');
        let n = 0;
        /* Une image qui change : sans cela, le flux n'émet aucune trame. */
        window.__peintre = setInterval(() => {
            ctx.fillStyle = n++ % 2 ? '#445' : '#454';
            ctx.fillRect(0, 0, 640, 480);
        }, 100);
        window.__flux = canevas.captureStream(10);
        return Promise.resolve(window.__flux);
    };
};

const ouvrirLeViseur = async (page) => {
    await page
        .getByRole('button', { name: /^Ajouter/ })
        .first()
        .click();
    await page.getByText('Scanner l’étiquette').first().click();
    await page.getByRole('button', { name: 'Fermer le scan' }).waitFor({ timeout: 30_000 });
};
const souffler = (page, code) =>
    page.evaluate((c) => {
        window.__code = c;
    }, code);
const pied = (page) =>
    page.evaluate(() =>
        [...document.querySelectorAll('.rounded-t-card')].pop()?.innerText.replace(/\s+/g, ' '),
    );
const consigne = (page) => page.locator('p[aria-live="polite"]').first().innerText();

export default async function scan(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);
    const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
        role: 'Super admin',
        largeur: 393,
        hauteur: 852,
        tactile: true,
        page: '/inventory',
    });
    await page.waitForSelector('main [data-rangee]', { timeout: 60_000 });

    // ── La caméra s'ouvre, le viseur couvre tout
    await page.evaluate(simulerLaCamera, false);
    await ouvrirLeViseur(page);
    await page
        .waitForFunction(() => document.querySelector('video')?.videoWidth > 0, undefined, {
            timeout: 15_000,
        })
        .catch(() => {});
    const video = await page.evaluate(() => {
        const v = document.querySelector('video');
        return v ? { largeur: v.videoWidth, opacite: getComputedStyle(v).opacity } : null;
    });
    verifier('le viseur ouvre la caméra', video?.largeur > 0 && video.opacite === '1', video);
    /* La barre du bas et le bouton d'ajout passaient par-dessus : en bas à droite, c'est le
       viseur qu'on touche. */
    const dessus = await page.evaluate(() => {
        const el = document.elementFromPoint(innerWidth - 40, innerHeight - 30);
        return Boolean(el?.closest('.bg-inverse-surface'));
    });
    verifier('rien ne passe par-dessus le viseur', dessus, dessus);

    // ── Un code dans le cadre : écrit en clair, avec ce qu'il désigne
    await souffler(page, 'ASSET-10001');
    await page.getByRole('button', { name: 'Ouvrir la fiche' }).waitFor({ timeout: 10_000 });
    let p = await pied(page);
    verifier(
        'le code lu s’écrit en clair, avec l’actif qu’il désigne',
        p.includes('ASSET-10001') && p.includes('LPT-HQ-01'),
        p,
    );

    // la caméra se tait tant que le verdict attend
    const avant = await page.evaluate(() => window.__regards);
    await souffler(page, 'AUTRE-CODE-999');
    await page.waitForTimeout(900);
    const pendant = (await page.evaluate(() => window.__regards)) - avant;
    p = await pied(page);
    verifier(
        'rien ne se lit par-dessus une lecture en attente',
        pendant === 0 && p.includes('ASSET-10001'),
        { regards: pendant, pied: p },
    );

    // ── Un code que rien ne porte ne s'accepte pas
    await souffler(page, '');
    await page.getByRole('button', { name: 'Reprendre' }).click();
    await souffler(page, 'INCONNU-12345');
    await page.getByText('Aucun actif ne porte ce code').waitFor({ timeout: 10_000 });
    const accepter = await page.getByRole('button', { name: 'Ouvrir la fiche' }).count();
    verifier('un code inconnu ne propose que de reprendre', accepter === 0, await pied(page));

    // ── Un QR : sa valeur utile, puis la fiche — et la caméra est rendue
    await souffler(page, '');
    await page.getByRole('button', { name: 'Reprendre' }).click();
    await souffler(page, '{"assetId":"ASSET-10001","hostname":"PC-HQ-01"}');
    await page.getByRole('button', { name: 'Ouvrir la fiche' }).waitFor({ timeout: 10_000 });
    p = await pied(page);
    verifier('d’un QR, le viseur écrit le code, pas son JSON', !p.includes('{'), p);
    await page.getByRole('button', { name: 'Ouvrir la fiche' }).click();
    await page.waitForTimeout(1500);
    const apres = await page.evaluate(() => ({
        hash: location.hash,
        videos: document.querySelectorAll('video').length,
        pistes: window.__flux?.getTracks().map((piste) => piste.readyState),
    }));
    verifier(
        'accepter ouvre la fiche et rend la caméra',
        /#\/inventory\/.+/.test(apres.hash) &&
            apres.videos === 0 &&
            apres.pistes?.every((etat) => etat === 'ended'),
        apres,
    );

    // ── Caméra refusée : la consigne le dit, la saisie reste
    await page.evaluate(() => {
        clearInterval(window.__peintre);
        location.hash = '/inventory';
    });
    await page.waitForSelector('main [data-rangee]', { timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.evaluate(simulerLaCamera, true);
    await ouvrirLeViseur(page);
    await page.waitForTimeout(800);
    const texte = await consigne(page);
    verifier(
        'caméra refusée : la consigne le dit et la saisie reste',
        texte.includes('La caméra est refusée') &&
            (await page.getByRole('button', { name: /Saisir à la main/ }).count()) === 1 &&
            (await page.getByRole('button', { name: /Lire l’étiquette/ }).count()) === 0,
        texte,
    );
    // la saisie à la main rend le même verdict que la caméra
    await page.getByRole('button', { name: /Saisir à la main/ }).click();
    await page.getByLabel('Code lu sur l’étiquette').fill('asset-10001');
    await page.getByRole('button', { name: 'Valider' }).click();
    await page.getByRole('button', { name: 'Ouvrir la fiche' }).waitFor({ timeout: 10_000 });
    p = await pied(page);
    verifier('la saisie à la main retrouve le même actif', p.includes('LPT-HQ-01'), p);

    verifier('aucune erreur de page', erreurs.length === 0, erreurs.slice(0, 3));
    if (erreurs.length) await capturer(page, 'scan-erreur');
    await contexte.close();
}
