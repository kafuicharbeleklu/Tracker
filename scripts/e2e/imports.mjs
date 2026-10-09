/**
 * LES IMPORTS (09/10) — un fichier se lit comme il arrive : CSV d'Excel sous Windows
 * (point-virgule, Windows-1252, guillemets) ou classeur, colonnes reconnues à leur nom
 * français, en-tête où il est. L'analyse regroupe les refus par cause, laisse de côté ce
 * qui est déjà là, et un import en lot crée bien autant d'objets qu'il en annonce.
 */
import XLSX from 'xlsx';
import { aller, capturer, ouvrirSession } from './outils.mjs';

const SUITE = 'imports';

/** Un CSV comme Excel l'enregistre en français : `;`, Windows-1252, CRLF. */
const csvWindows = (lignes) => Buffer.from(`${lignes.join('\r\n')}\r\n`, 'latin1');

const PARC = csvWindows([
    "N° Série;Modèle;Marque;Pays;Site;Date d'achat;Prix d'achat;Commentaire",
    'E2E-0001;Dell Latitude 7420;Dell;Togo;Lomé Siège;16/03/2024;1 250 000;"Écran rayé; clavier QWERTY"',
    '',
    'E2E-0002;dell latitude 7420;Dell;Togo;Lome siege;2024-03-16;850000;',
    'E2E-0001;Dell Latitude 7420;Dell;Togo;Lomé Siège;;;',
    '3.195E+12;Dell Latitude 7420;Dell;Togo;Lomé Siège;;;',
    'E2E-0003;Dell Latitud 7420;Dell;Togo;Lomé Siège;;;',
    'E2E-0004;Dell Latitude 7420;Dell;;;;;',
]);

/** Un classeur à deux feuilles ; la bonne a deux lignes de titre au-dessus de son en-tête. */
const classeurDeModeles = () => {
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        classeur,
        XLSX.utils.aoa_to_sheet([['Notes'], ['À revoir avant la fin du mois']]),
        'Notes',
    );
    XLSX.utils.book_append_sheet(
        classeur,
        XLSX.utils.aoa_to_sheet([
            ['INVENTAIRE DES IMPRIMANTES'],
            ['Mis à jour le 27/03/2026'],
            ['ID', 'Marque', 'Modèle', 'Numéro de série'],
            ['PRT01', 'HP', 'E2E LaserJet 400', 'SN-A'],
            ['PRT02', 'HP', 'E2E LaserJet 400', 'SN-B'],
            ['PRT03', 'Canon', 'E2E Sensys 455', 'SN-C'],
            ['PRT04', 'Ricoh', 'E2E IM 3000', 'SN-D'],
            ['PRT05', 'Dell', 'Dell U2721DE', 'SN-E'],
        ]),
        'Imprimantes',
    );
    return XLSX.write(classeur, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Un budget comme celui de Neemba : une feuille de références devant, puis prix unitaire,
 * quantité, total — et la ligne de total en pied.
 */
const classeurDeBudget = () => {
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        classeur,
        XLSX.utils.aoa_to_sheet([
            ['Catégorie', 'Equipements'],
            ['PC', 'Portable'],
        ]),
        'Références',
    );
    XLSX.utils.book_append_sheet(
        classeur,
        XLSX.utils.aoa_to_sheet([
            ['Catégorie', 'Désignation', 'OPEX/CAPEX', 'Prix unitaire', 'Quantité', 'Total'],
            ['PC', 'Portable', 'CAPEX', 700000, 4, 2800000],
            ['Périphériques', 'Casques', 'CAPEX', 20000, 30, 600000],
            ['Réseau', 'Lien Internet principal', 'OPEX', 400000, 12, 4800000],
            ['Téléphonie', 'Forfaits mobile', 'OPEX', 100000, 8, 800000],
            ['', '', '', '', '', 9000000],
        ]),
        'Budget',
    );
    return XLSX.write(classeur, { type: 'buffer', bookType: 'xlsx' });
};

const deposer = async (page, fichier) => {
    await page.locator('input[type="file"]').first().setInputFiles(fichier);
    await page.getByText('Ce qui sera créé').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(300);
};
const texteDe = async (page) => (await page.locator('main').innerText()).replace(/\s+/g, ' ');
/** Le pied : le seul bouton plein de la page. */
const pied = (page) =>
    page.getByRole('button', { name: /^(Importer (le|les) |Choisir un autre|Corriger le)/ }).last();

export default async function imports(navigateur, baseUrl, ok) {
    const verifier = (nom, verdict, mesure) => ok(SUITE, nom, verdict, mesure);
    const { contexte, page, erreurs } = await ouvrirSession(navigateur, baseUrl, {
        role: 'Super admin',
        largeur: 1440,
        hauteur: 900,
        page: '/inventory/import',
    });
    const cles = [];
    page.on('console', (m) => {
        if (/same key/i.test(m.text())) cles.push(m.text().slice(0, 160));
    });

    // ── Les actifs : un CSV d'Excel sous Windows
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
    await deposer(page, { name: 'parc.csv', mimeType: 'text/csv', buffer: PARC });
    let t = await texteDe(page);
    verifier(
        'le CSV se lit en point-virgule et Windows-1252',
        t.includes('CSV · point-virgule · Windows-1252'),
        t.slice(0, 200),
    );
    verifier(
        'les colonnes se reconnaissent à leur nom français',
        t.includes('« N° Série »') && t.includes('« Modèle »') && t.includes("« Date d'achat »"),
        t.slice(0, 500),
    );
    verifier(
        'la ligne vide ne compte pas, et les numéros sont ceux du tableur',
        t.includes('sur 6 lignes') && /en double dans le fichier ligne 5/.test(t),
        t.match(/sur \d+ lignes?/)?.[0],
    );
    verifier(
        'un numéro de série abîmé par Excel est nommé',
        t.includes('3.195E+12 abîmé par Excel'),
    );
    verifier(
        'un modèle mal écrit reçoit sa suggestion',
        t.includes('Modèle « Dell Latitud 7420 » inconnu au catalogue — « Dell Latitude 7420 » ?'),
    );
    verifier(
        'sans site, la ligne attend le réglage',
        t.includes('Site absent') && t.includes('Importer les 2'),
        (await pied(page).innerText()).trim(),
    );

    // le site des lignes qui n'en portent pas
    await page.getByRole('combobox', { name: /Site des lignes/ }).click();
    await page
        .getByRole('option', { name: /^Lomé Siège · Togo/ })
        .first()
        .click();
    await page.waitForTimeout(300);
    t = await texteDe(page);
    verifier(
        'le site choisi fait entrer la ligne sans site',
        t.includes('Importer les 3') && !t.includes('Site absent'),
        (await pied(page).innerText()).trim(),
    );

    // le fichier des refus
    const [telechargement] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /lignes refusées/ }).click(),
    ]);
    const flux = await telechargement.createReadStream();
    let refus = '';
    for await (const morceau of flux) refus += morceau.toString('utf8');
    verifier(
        'les lignes refusées se téléchargent avec leur motif',
        telechargement.suggestedFilename() === 'parc-refus.csv' &&
            refus.includes('"Motif du refus"') &&
            refus.includes('"5";"E2E-0001"') &&
            refus.split(/\r\n/).filter(Boolean).length === 4,
        refus.slice(0, 200),
    );

    await pied(page).click();
    await page.waitForTimeout(1200);
    await aller(page, '/inventory');
    await page.locator('input[data-recherche-de-page]').first().fill('E2E-000');
    await page.waitForTimeout(700);
    const rangees = await page.locator('main [data-rangee]').count();
    verifier('les trois fiches sont au parc', rangees === 3, rangees);

    // réimporter : rien de nouveau, rien à corriger
    await aller(page, '/inventory/import');
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
    await deposer(page, { name: 'parc.csv', mimeType: 'text/csv', buffer: PARC });
    t = await texteDe(page);
    verifier(
        'le même fichier, redéposé : ses fiches sont laissées de côté, pas refusées',
        /4 laissées de côté/.test(t) && t.includes('Déjà au parc') && !t.includes('Site absent'),
        t.match(/sur \d+ lignes?[^A-Z]*/)?.[0],
    );

    // ── Les modèles : un classeur, la bonne feuille, l'en-tête en ligne 3
    await aller(page, '/management/models/import');
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
    await deposer(page, {
        name: 'inventaire.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: classeurDeModeles(),
    });
    t = await texteDe(page);
    verifier(
        'la feuille qui porte les colonnes est choisie, son en-tête trouvé en ligne 3',
        t.includes('en-tête ligne 3') &&
            (await page
                .getByRole('button', { name: /^Imprimantes/ })
                .getAttribute('aria-pressed')) === 'true',
        t.slice(0, 160),
    );
    verifier(
        'le type se devine du nom de la feuille',
        t.includes('Deviné du nom de la feuille, « Imprimantes »'),
    );
    verifier(
        'trois modèles : la répétition et le modèle déjà au catalogue sont laissés de côté',
        t.includes('Importer les 3') &&
            t.includes('Répète un modèle lu plus haut') &&
            t.includes('Déjà au catalogue'),
        (await pied(page).innerText()).trim(),
    );
    await pied(page).click();
    await page.waitForTimeout(1200);

    // les trois existent bien : redéposé, le classeur n'apporte plus rien
    await aller(page, '/management/models/import');
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
    await deposer(page, {
        name: 'inventaire.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: classeurDeModeles(),
    });
    t = await texteDe(page);
    verifier(
        'redéposé, le classeur n’apporte rien de nouveau',
        t.includes('Rien de nouveau') &&
            /Choisir un autre fichier/.test(await pied(page).innerText()),
        t.match(/\d+ laissées? de côté/)?.[0],
    );
    /* **Un identifiant par modèle.** Créés dans la même milliseconde, les trois portaient le
       même : la liste des imprimantes confondait ses rangées, et ouvrir le dernier montrait
       le premier. */
    await aller(page, '/management/categories/8');
    const dernier = page.getByText('E2E IM 3000').first();
    await dernier.waitFor({ timeout: 30_000 });
    const listes = await page.getByText(/^E2E (LaserJet 400|Sensys 455|IM 3000)$/).count();
    await dernier.click();
    /* La fiche se charge à la demande : on attend son contenu, pas un délai (09/10 — sous
       charge, le test lisait « Chargement en cours »). */
    await page
        .waitForFunction(
            () =>
                location.hash.includes('/management/models/') &&
                /E2E /.test(document.querySelector('main')?.innerText ?? ''),
            undefined,
            { timeout: 30_000 },
        )
        .catch(() => {});
    const fiche = {
        hash: await page.evaluate(() => location.hash),
        texte: (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 300),
    };
    verifier(
        'chaque modèle importé a son identifiant : ouvrir le dernier montre le dernier',
        listes >= 3 &&
            /\/management\/models\//.test(fiche.hash) &&
            fiche.texte.includes('E2E IM 3000') &&
            !fiche.texte.includes('E2E LaserJet 400') &&
            cles.length === 0,
        { listes, ...fiche, cles: cles.slice(0, 1) },
    );

    // ── Le budget : le total et non le prix unitaire, rangé aux postes de l'application
    await aller(page, '/finance/exercices');
    await page.getByText('Lire un budget').first().click();
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 30_000 });
    await page.locator('input[type="file"]').first().setInputFiles({
        name: 'Budget 2031.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: classeurDeBudget(),
    });
    await page.getByText('Les lignes').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(400);
    const budget = await page.evaluate(() => ({
        texte: document.body.innerText.replace(/\s+/g, ' '),
        montants: [...document.querySelectorAll('input[name^="montant-"]')].map((i) => i.value),
    }));
    verifier(
        'le budget se lit dans la colonne du total, et la somme égale celle du fichier',
        budget.texte.includes(
            '4 lignes du fichier en 2 postes · total 9 000 000, égal à celui du fichier',
        ),
        budget.texte.match(/\d+ lignes? du fichier[^.]{0,80}/)?.[0] ?? budget.texte.slice(0, 200),
    );
    verifier(
        'ses lignes sont rangées aux postes qui compteront les dépenses',
        budget.montants.join('|') === '3400000|5600000' &&
            budget.texte.includes('2 lignes du fichier : Portable, Casques') &&
            budget.texte.includes('2 lignes du fichier : Lien Internet principal, Forfaits mobile'),
        budget.montants,
    );

    verifier('aucune erreur de page', erreurs.length === 0, erreurs.slice(0, 3));
    if (erreurs.length) await capturer(page, 'imports-erreur');
    await contexte.close();
}
