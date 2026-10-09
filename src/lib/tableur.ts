/**
 * **Lire un tableur, comme il arrive** (09/10) — CSV ou Excel, l'en-tête où il est, les
 * colonnes dans l'ordre du fichier.
 *
 * Les imports lisaient le fichier comme du texte, coupaient chaque ligne sur la première
 * virgule venue et prenaient les colonnes **dans l'ordre du contrat** : un `.xlsx` ne
 * passait pas, un CSV exporté par Excel (Windows-1252) écrivait « Lom� », une cellule
 * « Dell, Inc. » décalait la ligne, et un fichier dont les colonnes étaient dans un autre
 * ordre — ou nommées en français — était lu de travers sans que rien ne le dise. Les
 * inventaires de Neemba sont des classeurs Excel : trois feuilles (Ordinateurs,
 * Imprimantes, Écrans), des en-têtes comme « Numéro de Série » ou « Date fin de garantie »,
 * des dates tantôt écrites « 16/03/2014 », tantôt en vraies dates.
 *
 * Ce module rend un classeur — ses feuilles, leurs lignes en texte — puis, pour un contrat
 * de colonnes, la ligne d'en-tête et la correspondance colonne par colonne. Les valeurs se
 * normalisent à la demande (`lireDate`, `lireMontant`).
 */

export interface FeuilleLue {
    nom: string;
    /**
     * Les lignes, cellules en texte, vides retirées en fin de ligne. **Les lignes vides
     * restent** (`[]`) : le numéro montré doit être celui du tableur.
     */
    lignes: string[][];
    /** Le rang de la première ligne lue dans le tableur, à partir de 0 — une plage qui commence en A3 : 2. */
    debut: number;
}

export interface ClasseurLu {
    feuilles: FeuilleLue[];
    /** Ce qui a été déduit de la lecture, pour le dire : « CSV · point-virgule · Windows-1252 ». */
    format: string;
}

const EXCEL = /\.(xlsx|xlsm|xls|ods)$/i;

/** Lettres sans accents, minuscules, sans ponctuation : « N° de Série » → « nodeserie ». */
export const normaliserNom = (texte: string): string =>
    texte
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const pad = (n: number) => String(n).padStart(2, '0');
const isoDe = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* ------------------------------------------------------------------------- Excel */

const lireExcel = async (fichier: File): Promise<ClasseurLu> => {
    const XLSX = await import('xlsx');
    const classeur = XLSX.read(await fichier.arrayBuffer(), { type: 'array', cellDates: true });
    const feuilles = classeur.SheetNames.map((nom) => {
        const feuille = classeur.Sheets[nom];
        const brut = XLSX.utils.sheet_to_json<unknown[]>(feuille, {
            header: 1,
            raw: true,
            defval: '',
            blankrows: true,
        });
        const debut = feuille['!ref'] ? XLSX.utils.decode_range(feuille['!ref']).s.r : 0;
        /* Une vraie date Excel devient « 2020-05-03 » ; un nombre, son écriture ; le reste,
           son texte. */
        const lignes = brut.map((ligne) =>
            (ligne ?? []).map((cellule) =>
                cellule instanceof Date
                    ? isoDe(cellule)
                    : cellule === null || cellule === undefined
                      ? ''
                      : String(cellule).trim(),
            ),
        );
        return { nom, lignes: sansLignesVidesEnFin(lignes.map(sansVidesEnFin)), debut };
    }).filter((feuille) => feuille.lignes.length > 0);
    return { feuilles, format: 'Excel' };
};

/* --------------------------------------------------------------------------- CSV */

/** UTF-8 s'il se décode sans faute ; sinon l'encodage d'Excel sous Windows. */
const decoder = (octets: ArrayBuffer): { texte: string; encodage: string } => {
    try {
        const texte = new TextDecoder('utf-8', { fatal: true }).decode(octets);
        return { texte: texte.replace(/^\uFEFF/, ''), encodage: 'UTF-8' };
    } catch {
        return { texte: new TextDecoder('windows-1252').decode(octets), encodage: 'Windows-1252' };
    }
};

const SEPARATEURS = [';', ',', '\t', '|'] as const;
const NOM_DU_SEPARATEUR: Record<string, string> = {
    ';': 'point-virgule',
    ',': 'virgule',
    '\t': 'tabulation',
    '|': 'barre',
};

/** Le séparateur qui découpe les premières lignes de la façon la plus régulière. */
const deviner = (texte: string): string => {
    const lignes = texte
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .slice(0, 8);
    let meilleur: string = ',';
    let score = -1;
    for (const sep of SEPARATEURS) {
        const comptes = lignes.map((l) => decouper(l, sep)[0].length);
        const max = Math.max(...comptes, 0);
        if (max < 2) continue;
        const reguliers = comptes.filter((c) => c === max).length;
        const s = max * 10 + reguliers;
        if (s > score) {
            score = s;
            meilleur = sep;
        }
    }
    return meilleur;
};

/** Un CSV entier : guillemets, guillemets doublés, retours à la ligne dans une cellule. */
const decouper = (texte: string, sep: string): string[][] => {
    const lignes: string[][] = [];
    let ligne: string[] = [];
    let cellule = '';
    let guillemets = false;
    for (let i = 0; i < texte.length; i++) {
        const c = texte[i];
        if (guillemets) {
            if (c === '"') {
                if (texte[i + 1] === '"') {
                    cellule += '"';
                    i++;
                } else guillemets = false;
            } else cellule += c;
        } else if (c === '"' && cellule.trim() === '') {
            guillemets = true;
            cellule = '';
        } else if (c === sep) {
            ligne.push(cellule.trim());
            cellule = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && texte[i + 1] === '\n') i++;
            ligne.push(cellule.trim());
            lignes.push(ligne);
            ligne = [];
            cellule = '';
        } else cellule += c;
    }
    if (cellule !== '' || ligne.length > 0) {
        ligne.push(cellule.trim());
        lignes.push(ligne);
    }
    return lignes;
};

const sansVidesEnFin = (ligne: string[]) => {
    let fin = ligne.length;
    while (fin > 0 && !ligne[fin - 1]) fin--;
    return ligne.slice(0, fin);
};

const sansLignesVidesEnFin = (lignes: string[][]) => {
    let fin = lignes.length;
    while (fin > 0 && lignes[fin - 1].length === 0) fin--;
    return lignes.slice(0, fin);
};

const lireCsv = async (fichier: File): Promise<ClasseurLu> => {
    const { texte, encodage } = decoder(await fichier.arrayBuffer());
    const sep = deviner(texte);
    const lignes = sansLignesVidesEnFin(decouper(texte, sep).map(sansVidesEnFin));
    return {
        feuilles: lignes.length ? [{ nom: fichier.name, lignes, debut: 0 }] : [],
        format: `CSV · ${NOM_DU_SEPARATEUR[sep]} · ${encodage}`,
    };
};

export const lireClasseur = (fichier: File): Promise<ClasseurLu> =>
    EXCEL.test(fichier.name) ? lireExcel(fichier) : lireCsv(fichier);

/* --------------------------------------------------------------- les colonnes */

export interface ColonneAttendue {
    key: string;
    /** Les autres noms sous lesquels un fichier la porte. */
    alias?: readonly string[];
}

export interface Correspondance {
    /** La ligne d'en-tête, rang dans `lignes` (à partir de 0). */
    ligneEntete: number;
    entetes: string[];
    /** Pour chaque colonne du contrat, l'indice de la colonne du fichier — absente : `undefined`. */
    indices: Record<string, number | undefined>;
}

const nomsDe = (colonne: ColonneAttendue) =>
    [colonne.key, ...(colonne.alias ?? [])].map(normaliserNom);

/** La colonne du fichier qui répond à une colonne du contrat : nom exact d'abord, puis inclus. */
const chercher = (entetes: string[], colonne: ColonneAttendue, prises: Set<number>) => {
    const noms = nomsDe(colonne);
    const norm = entetes.map(normaliserNom);
    const exact = norm.findIndex((n, i) => !prises.has(i) && n && noms.includes(n));
    if (exact >= 0) return exact;
    const inclus = norm.findIndex(
        (n, i) =>
            !prises.has(i) && n.length >= 3 && noms.some((x) => x.length >= 3 && n.includes(x)),
    );
    return inclus >= 0 ? inclus : undefined;
};

/**
 * **L'en-tête est la ligne qui nomme le plus de colonnes du contrat**, parmi les quinze
 * premières : la flotte mobile de Neemba porte deux lignes de titre au-dessus.
 */
export const correspondre = (lignes: string[][], colonnes: ColonneAttendue[]): Correspondance => {
    let ligneEntete = 0;
    let meilleur = -1;
    lignes.slice(0, 15).forEach((ligne, i) => {
        const prises = new Set<number>();
        const trouvees = colonnes.filter((c) => {
            const j = chercher(ligne, c, prises);
            if (j === undefined) return false;
            prises.add(j);
            return true;
        }).length;
        if (trouvees > meilleur) {
            meilleur = trouvees;
            ligneEntete = i;
        }
    });
    const entetes = lignes[ligneEntete] ?? [];
    const prises = new Set<number>();
    const indices: Record<string, number | undefined> = {};
    /* Les noms exacts d'abord : « Date fin de garantie » ne doit pas prendre la colonne
       « Date Achat » parce qu'elle contient « date ». */
    for (const passe of ['exact', 'inclus'] as const) {
        for (const c of colonnes) {
            if (indices[c.key] !== undefined) continue;
            const noms = nomsDe(c);
            const norm = entetes.map(normaliserNom);
            const j =
                passe === 'exact'
                    ? norm.findIndex((n, i) => !prises.has(i) && n && noms.includes(n))
                    : (chercher(entetes, c, prises) ?? -1);
            if (j >= 0) {
                indices[c.key] = j;
                prises.add(j);
            }
        }
    }
    return { ligneEntete, entetes, indices };
};

/* ------------------------------------------------------------------- les valeurs */

/**
 * Une date en `AAAA-MM-JJ`, ou `''` si elle ne se lit pas. Jour d'abord (« 16/03/2014 »),
 * comme on l'écrit au Togo ; ISO tel quel ; un nombre de série Excel converti.
 */
export const lireDate = (valeur: string): string => {
    const v = valeur.trim();
    if (!v) return '';
    let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return valider(+m[1], +m[2], +m[3]);
    m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (m) {
        const annee = m[3].length === 2 ? 2000 + +m[3] : +m[3];
        return valider(annee, +m[2], +m[1]);
    }
    if (/^\d{5}(\.\d+)?$/.test(v)) {
        const n = Number(v);
        if (n > 20000 && n < 80000) return isoDe(new Date(Date.UTC(1899, 11, 30) + n * 86_400_000));
    }
    return '';
};

const valider = (a: number, mo: number, j: number) => {
    const d = new Date(a, mo - 1, j);
    return d.getFullYear() === a && d.getMonth() === mo - 1 && d.getDate() === j ? isoDe(d) : '';
};

/**
 * Un montant : « 1 250 000 », « 1.250.000,50 », « 1,250,000.50 », « 350000 XOF ». `NaN`
 * s'il ne se lit pas.
 */
export const lireMontant = (valeur: string): number => {
    let v = valeur.replace(/[\s\u00a0\u202f]/g, '').replace(/[^\d.,-]/g, '');
    if (!v) return Number.NaN;
    const point = v.lastIndexOf('.');
    const virgule = v.lastIndexOf(',');
    if (point >= 0 && virgule >= 0) {
        const decimal = point > virgule ? '.' : ',';
        v = v
            .split(decimal === '.' ? ',' : '.')
            .join('')
            .replace(',', '.');
    } else if (virgule >= 0) {
        /* Une seule virgule suivie d'au plus deux chiffres : des décimales ; sinon, des milliers. */
        v =
            /,\d{1,2}$/.test(v) && v.split(',').length === 2
                ? v.replace(',', '.')
                : v.split(',').join('');
    } else if (point >= 0 && v.split('.').length > 2) {
        v = v.split('.').join('');
    }
    return Number(v);
};

/** La distance d'édition, pour proposer le nom le plus proche d'un nom inconnu. */
export const distance = (a: string, b: string): number => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
            );
    return d[a.length][b.length];
};

const chiffres = (texte: string) => texte.replace(/\D/g, '');

/**
 * Le nom le plus proche dans une liste, s'il l'est assez pour être une faute de frappe.
 * **Jamais si les chiffres diffèrent** : « Pro Tower 290 G9 » n'est pas une faute de frappe
 * pour « Pro Tower 400 G9 », c'est un autre modèle.
 */
export const plusProche = (nom: string, candidats: readonly string[]): string | undefined => {
    const cible = normaliserNom(nom);
    if (!cible) return undefined;
    let meilleur: string | undefined;
    let ecart = Infinity;
    for (const c of candidats) {
        const n = normaliserNom(c);
        if (chiffres(n) !== chiffres(cible)) continue;
        const e = n.includes(cible) || cible.includes(n) ? 1 : distance(cible, n);
        if (e < ecart) {
            ecart = e;
            meilleur = c;
        }
    }
    return ecart <= Math.max(2, Math.floor(cible.length / 4)) ? meilleur : undefined;
};
