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

/** Le QR de « ASSET-10001 », module par module — ce que l'objectif verra (10/10). */
const QR_ASSET_10001 = [
    '111111100100101111111',
    '100000101011101000001',
    '101110101011001011101',
    '101110101110001011101',
    '101110100000101011101',
    '100000100101001000001',
    '111111101010101111111',
    '000000001000000000000',
    '100000101011011001110',
    '001111011101101100111',
    '011100100110100101010',
    '101111010101100101110',
    '010000111101100110111',
    '000000001000100110100',
    '111111100011000101010',
    '100000100100001111110',
    '101110100111011010101',
    '101110100010100011100',
    '101110100001111110111',
    '100000100111100001100',
    '111111101010111001110',
];

/**
 * Un navigateur **sans décodeur** (iPhone, Firefox), devant un vrai QR : la caméra montre le
 * code dessiné, et rien d'autre que notre lecteur ne peut le lire.
 */
const simulerUnQrSansDecodeur = (rangs) => {
    delete window.BarcodeDetector;
    navigator.mediaDevices.getUserMedia = () => {
        const canevas = document.createElement('canvas');
        canevas.width = 640;
        canevas.height = 480;
        const ctx = canevas.getContext('2d');
        const module = 9;
        const cote = rangs.length * module;
        const x0 = Math.round((640 - cote) / 2);
        const y0 = Math.round((480 - cote) / 2);
        let n = 0;
        window.__peintre = setInterval(() => {
            /* Un fond qui change d'un rien : sans cela, le flux n'émet aucune trame. */
            ctx.fillStyle = n++ % 2 ? '#ffffff' : '#fdfdfd';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#000000';
            rangs.forEach((rang, r) =>
                [...rang].forEach((bit, c) => {
                    if (bit === '1') ctx.fillRect(x0 + c * module, y0 + r * module, module, module);
                }),
            );
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

    // ── Sans décodeur du navigateur : un QR se lit quand même, et le cadre vient sur lui
    /* Le viseur de l'essai précédent est encore ouvert, sur la liste : on le referme. */
    await page.getByRole('button', { name: 'Fermer le scan' }).click();
    await page.waitForTimeout(800);
    await page.evaluate(() => clearInterval(window.__peintre));
    await page.evaluate(simulerUnQrSansDecodeur, QR_ASSET_10001);
    await ouvrirLeViseur(page);
    const auRepos = await page.evaluate(() => {
        const r = document.querySelector('[data-cadre-mobile]')?.getBoundingClientRect();
        return r ? { l: Math.round(r.width), h: Math.round(r.height) } : null;
    });
    const luSansDecodeur = await page
        .getByRole('button', { name: 'Ouvrir la fiche' })
        .waitFor({ timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    p = await pied(page);
    verifier(
        'sans décodeur du navigateur, un QR se lit quand même',
        luSansDecodeur && p.includes('ASSET-10001') && p.includes('LPT-HQ-01'),
        p,
    );
    await page.waitForTimeout(500);
    const surLeCode = await page.evaluate(() => {
        const cadre = document.querySelector('[data-cadre-mobile]')?.getBoundingClientRect();
        const video = document.querySelector('video');
        const rv = video?.getBoundingClientRect();
        if (!cadre || !video || !rv) return null;
        /* Où le QR est à l'écran : la vidéo couvre l'écran, agrandie et rognée. */
        const agr = Math.max(rv.width / video.videoWidth, rv.height / video.videoHeight);
        const cote = 21 * 9 * agr;
        const cx = rv.left + rv.width / 2;
        const cy = rv.top + rv.height / 2;
        return {
            l: Math.round(cadre.width),
            h: Math.round(cadre.height),
            code: Math.round(cote),
            /* Ce que le cadre laisse autour du code, du côté où il en laisse le moins. */
            air: Math.round(
                Math.min(
                    cx - cote / 2 - cadre.left,
                    cadre.right - (cx + cote / 2),
                    cy - cote / 2 - cadre.top,
                    cadre.bottom - (cy + cote / 2),
                ),
            ),
        };
    });
    verifier(
        'le cadre se pose sur le code vu, à sa forme',
        Boolean(surLeCode && auRepos) &&
            /* carré, comme le QR… */
            Math.abs(surLeCode.l - surLeCode.h) <= 10 &&
            /* …il le contient en entier, sans le noyer… */
            surLeCode.air >= 0 &&
            surLeCode.l <= surLeCode.code + 64 &&
            /* …et n'a plus sa forme de repos. */
            (surLeCode.l !== auRepos.l || surLeCode.h !== auRepos.h),
        { auRepos, surLeCode },
    );

    verifier('aucune erreur de page', erreurs.length === 0, erreurs.slice(0, 3));
    if (erreurs.length) await capturer(page, 'scan-erreur');
    await contexte.close();
}
