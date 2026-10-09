import { ExtractionConfidence } from '../types';
import { extractDocumentText } from './documentTextExtraction';
import { lireClasseur, lireMontant } from './tableur';

export interface ExtractedBudgetLine {
    category: string;
    amount: string;
    /** CAPEX ou OPEX, quand toutes les lignes que le poste regroupe le disent d'une seule voix. */
    capitalization?: 'CAPEX' | 'OPEX';
    /** Ce que le poste regroupe — « 11 lignes du fichier : Casques, Tablette… ». */
    detail?: string;
}

export interface ExtractedBudgetDraft {
    year: string;
    lines: ExtractedBudgetLine[];
    confidence: ExtractionConfidence;
    warnings: string[];
    source: 'csv' | 'text' | 'filename' | 'manual';
    /** Ce que la lecture a compris, en une ligne : lignes lues, postes, total, et sa preuve. */
    summary?: string;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff']);

const parseNumericAmount = (rawValue: string): string => {
    const cleaned = rawValue.replace(/[^\d., ]/g, '').trim();
    if (!cleaned) return '';

    const noSpaces = cleaned.replace(/\s+/g, '');
    const commaCount = (noSpaces.match(/,/g) || []).length;
    const dotCount = (noSpaces.match(/\./g) || []).length;

    let normalized = noSpaces;
    if (commaCount > 0 && dotCount > 0) {
        const lastComma = noSpaces.lastIndexOf(',');
        const lastDot = noSpaces.lastIndexOf('.');
        const decimalSep = lastComma > lastDot ? ',' : '.';
        normalized = noSpaces
            .replace(decimalSep === ',' ? /\./g : /,/g, '')
            .replace(decimalSep, '.');
    } else if (commaCount === 1 && dotCount === 0) {
        const [intPart, frac] = noSpaces.split(',');
        normalized = frac?.length === 2 ? `${intPart}.${frac}` : `${intPart}${frac || ''}`;
    } else if (dotCount === 1 && commaCount === 0) {
        const [intPart, frac] = noSpaces.split('.');
        normalized = frac?.length === 2 ? `${intPart}.${frac}` : `${intPart}${frac || ''}`;
    } else {
        normalized = noSpaces.replace(/[.,]/g, '');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed.toString() : '';
};

const detectDelimiter = (line: string): string => {
    if (line.includes(';')) return ';';
    if (line.includes('\t')) return '\t';
    return ',';
};

/* Les guillemets qui entourent une cellule, pas celui d'un « Écran 24" ». */
const normalizeCell = (value: string): string => {
    const texte = value.trim();
    return texte.length >= 2 && texte.startsWith('"') && texte.endsWith('"')
        ? texte.slice(1, -1).trim()
        : texte;
};

const normalizeHeaderCell = (value: string): string => {
    return normalizeCell(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const extractYearFromText = (value: string): string => {
    const yearMatch = value.match(/\b(20\d{2})\b/);
    return yearMatch?.[1] || new Date().getFullYear().toString();
};

const findBestHeaderRow = (matrix: string[][]): number => {
    const scanLimit = Math.min(matrix.length, 20);
    let bestIndex = 0;
    let bestScore = -1;

    for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
        const row = matrix[rowIndex] || [];
        const normalized = row.map(normalizeHeaderCell);
        const nonEmptyCount = normalized.filter(Boolean).length;
        if (nonEmptyCount < 2) continue;

        const hasCategory = normalized.some((cell) =>
            /categorie|category|poste|rubrique|designation/.test(cell),
        );
        const hasAmount = normalized.some((cell) =>
            /total|montant|amount|budget|allocated|alloue|valeur|cout|prix/.test(cell),
        );
        const hasYear = normalized.some((cell) => /annee|year|exercice/.test(cell));

        const score =
            (hasCategory ? 3 : 0) + (hasAmount ? 3 : 0) + (hasYear ? 1 : 0) + nonEmptyCount * 0.1;
        if (score > bestScore) {
            bestScore = score;
            bestIndex = rowIndex;
        }
    }

    return bestIndex;
};

const findBestAmountColumn = (
    matrix: string[][],
    startRow: number,
    categoryIndex: number,
    hintedIndex: number,
): number => {
    if (hintedIndex >= 0) return hintedIndex;

    const maxColumns = matrix.reduce((max, row) => Math.max(max, row.length), 0);
    let bestIndex = categoryIndex === 0 ? 1 : 0;
    let bestScore = -1;

    for (let col = 0; col < maxColumns; col += 1) {
        if (col === categoryIndex) continue;
        let numericHits = 0;
        let weightedSum = 0;
        let nonEmpty = 0;

        const sampleEnd = Math.min(matrix.length, startRow + 40);
        for (let rowIndex = startRow; rowIndex < sampleEnd; rowIndex += 1) {
            const value = normalizeCell(matrix[rowIndex]?.[col] || '');
            if (!value) continue;
            nonEmpty += 1;
            const parsed = parseNumericAmount(value);
            if (parsed) {
                numericHits += 1;
                weightedSum += Number(parsed);
            }
        }

        const score = numericHits * 10 + Math.log10(weightedSum + 1) + nonEmpty * 0.1;
        if (score > bestScore) {
            bestScore = score;
            bestIndex = col;
        }
    }

    return bestIndex;
};

/** Une ligne du fichier, telle qu'elle est écrite — avant tout regroupement. */
interface LigneDeBudgetLue {
    category: string;
    designation: string;
    nature?: 'CAPEX' | 'OPEX';
    amount: number;
}

/**
 * **Lire un tableau de budget** — la colonne du poste, celle du montant, et la ligne de total.
 *
 * **Le total d'abord** (09/10). Le montant se prenait dans la première colonne dont le nom
 * contenait « prix », « total », « montant »… Sur le budget de Neemba — Prix unitaire,
 * Quantité, Total —, c'était le **prix unitaire** : 21,9 millions lus pour un budget de 42,7,
 * avec une confiance « élevée ». L'ordre est désormais : la colonne du total ; à défaut,
 * prix × quantité ; à défaut, le prix seul ; à défaut, la colonne la plus chiffrée.
 *
 * La ligne de total du fichier — sans poste, ou nommée « Total » — n'entre pas : elle sert
 * de preuve, et l'appelant la compare à la somme des lignes lues.
 */
const extractBudgetFromMatrix = (
    matrix: string[][],
    fallbackYearText: string,
): {
    lines: ExtractedBudgetLine[];
    lues: LigneDeBudgetLue[];
    total?: number;
    year: string;
    parsed: boolean;
} => {
    if (!matrix.length) {
        return { lines: [], lues: [], year: extractYearFromText(fallbackYearText), parsed: false };
    }

    const headerRowIndex = findBestHeaderRow(matrix);
    const header = (matrix[headerRowIndex] || []).map(normalizeHeaderCell);
    const colonne = (nom: RegExp, sauf?: RegExp) =>
        header.findIndex((cell) => nom.test(cell) && !sauf?.test(cell));

    const posteIndex = colonne(/categorie|category|poste|rubrique/);
    const designationIndex = colonne(/designation|libelle|description|intitule|equipement|objet/);
    const totalIndex = colonne(/total|montant|amount|budget|allocated|alloue/, /unitaire|unit\b/);
    const prixIndex = colonne(/prix|unitaire|unit price|cout|valeur|tarif/);
    const quantiteIndex = colonne(/quantite|qte|qty|quantity|nombre/);
    const natureIndex = colonne(/opex|capex|nature|capitalisation/);
    const yearIndex = colonne(/annee|year|exercice/);

    const categoryIndex = posteIndex >= 0 ? posteIndex : designationIndex;
    /* Aucun nom de colonne reconnu : pas d'en-tête, la première ligne est déjà une ligne. */
    const sansEntete = categoryIndex < 0 && totalIndex < 0 && prixIndex < 0;
    const catIndex = categoryIndex >= 0 ? categoryIndex : 0;
    const startRow = sansEntete ? 0 : headerRowIndex + 1;
    const devineIndex =
        totalIndex < 0 && prixIndex < 0 ? findBestAmountColumn(matrix, startRow, catIndex, -1) : -1;

    const nombre = (row: string[] | undefined, index: number): number => {
        if (index < 0) return 0;
        const valeur = lireMontant(row?.[index] || '');
        return Number.isFinite(valeur) && valeur > 0 ? valeur : 0;
    };

    const lues: LigneDeBudgetLue[] = [];
    let total: number | undefined;
    for (let i = startRow; i < matrix.length; i += 1) {
        const row = matrix[i];
        const category = normalizeCell(row?.[catIndex] || '');
        let amount = nombre(row, totalIndex);
        if (!amount) {
            const prix = nombre(row, prixIndex);
            const quantite = nombre(row, quantiteIndex);
            amount = prix && quantite ? prix * quantite : prix;
        }
        if (!amount) amount = nombre(row, devineIndex);
        if (!amount) continue;

        if (!category || /^(grand[- ]?)?total\b/i.test(category)) {
            total = Math.max(total ?? 0, amount);
            continue;
        }
        if (/^sous[- ]?total/i.test(category)) continue;

        const nature = natureIndex >= 0 ? normalizeHeaderCell(row?.[natureIndex] || '') : '';
        lues.push({
            category,
            designation:
                designationIndex >= 0 && designationIndex !== catIndex
                    ? normalizeCell(row?.[designationIndex] || '')
                    : '',
            nature: /capex|invest/.test(nature)
                ? 'CAPEX'
                : /opex|fonction/.test(nature)
                  ? 'OPEX'
                  : undefined,
            amount,
        });
    }

    let detectedYear = extractYearFromText(fallbackYearText);
    if (yearIndex >= 0) {
        const yearToken = normalizeCell(
            matrix[startRow]?.[yearIndex] || matrix[headerRowIndex]?.[yearIndex] || '',
        );
        detectedYear = extractYearFromText(yearToken || fallbackYearText);
    }

    return {
        lines: lues.map((ligne) => ({ category: ligne.category, amount: String(ligne.amount) })),
        lues,
        total,
        year: detectedYear,
        parsed: lues.length > 0,
    };
};

/** Les postes d'un budget, dans l'ordre où l'écran les propose. */
const POSTES = [
    'Matériel IT',
    'Licences Logiciel',
    'Cloud Infrastructure',
    'Maintenance & Services',
    'Consulting',
    'Formation',
    'Autre',
] as const;

/**
 * **Le poste de l'application qu'une ligne du fichier désigne** (09/10).
 *
 * Une dépense s'impute à un poste par sa nature (`getBudgetCategoryByExpenseType`) : achat →
 * « Matériel IT », licence → « Licences Logiciel », cloud → « Cloud Infrastructure », le reste →
 * « Maintenance & Services ». Un budget importé avec les catégories du fichier —
 * « Périphériques », « PC », « Réseau » — ne recevait donc jamais aucune dépense : quinze
 * lignes à zéro, et chaque dépense hors poste. La ligne est rattachée au poste qui comptera ses
 * dépenses, par sa catégorie **et** sa désignation : dans « Réseau », un point d'accès est du
 * matériel, le lien Internet un service.
 */
const posteDe = (categorie: string, designation: string): string => {
    const c = normalizeHeaderCell(categorie);
    const exact = POSTES.find((poste) => normalizeHeaderCell(poste) === c);
    if (exact) return exact;
    const texte = `${c} ${normalizeHeaderCell(designation)}`;
    if (/formation|training/.test(texte)) return 'Formation';
    if (/\baudit|conseil|consult|\betudes?\b/.test(texte)) return 'Consulting';
    if (/cloud|hebergement|hosting|saas|\baws\b|azure/.test(texte)) return 'Cloud Infrastructure';
    if (/logiciel|licen[cs]e|software/.test(c)) return 'Licences Logiciel';
    if (
        /maintenance|contrat|entretien|forfait|lien internet|liaison|interconnexion|communication|support|prestation|infogerance|\bservices?\b/.test(
            texte,
        )
    )
        return 'Maintenance & Services';
    if (/logiciel|licen[cs]e|software|abonnement|\berp\b|antivirus|antispam/.test(texte))
        return 'Licences Logiciel';
    if (
        /\bpc\b|ordinateur|portable|peripherique|ecran|imprim|impression|tablette|telephon|mobile|serveur|reseau|infrastructure|materiel|accessoire|stockage|onduleur|switch|point d.?acces|borne|consommable|casque|souris|clavier/.test(
            texte,
        )
    )
        return 'Matériel IT';
    return 'Autre';
};

const enChiffres = (montant: number) =>
    Math.round(montant)
        .toLocaleString('fr-FR')
        .replace(/[\u202f\u00a0]/g, ' ');

/**
 * Une ligne par poste : la somme de ce que le fichier y range, et ce qu'elle regroupe. Un
 * budget tient une ligne par poste — six lignes « Périphériques » n'en faisaient pas une.
 */
const regrouperParPoste = (lues: readonly LigneDeBudgetLue[]): ExtractedBudgetLine[] => {
    const parPoste = new Map<string, LigneDeBudgetLue[]>();
    for (const ligne of lues) {
        const poste = posteDe(ligne.category, ligne.designation);
        parPoste.set(poste, [...(parPoste.get(poste) ?? []), ligne]);
    }
    return POSTES.filter((poste) => parPoste.has(poste)).map((poste) => {
        const lignes = parPoste.get(poste) ?? [];
        const natures = new Set(lignes.map((ligne) => ligne.nature));
        const noms = [...new Set(lignes.map((ligne) => ligne.designation || ligne.category))];
        const seule =
            lignes.length === 1 && normalizeHeaderCell(noms[0]) === normalizeHeaderCell(poste);
        const [nature] = natures;
        return {
            category: poste,
            amount: String(
                Math.round(lignes.reduce((somme, l) => somme + l.amount, 0) * 100) / 100,
            ),
            capitalization: natures.size === 1 ? nature : undefined,
            detail: seule
                ? undefined
                : `${lignes.length} ligne${lignes.length > 1 ? 's' : ''} du fichier : ${noms.slice(0, 4).join(', ')}${noms.length > 4 ? '…' : ''}`,
        };
    });
};

const extractBudgetFromCsvLike = (
    text: string,
    fallbackYearText: string,
): { lines: ExtractedBudgetLine[]; year: string; parsed: boolean } => {
    const rows = text
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean);

    if (rows.length === 0) {
        return { lines: [], year: new Date().getFullYear().toString(), parsed: false };
    }

    const delimiter = detectDelimiter(rows[0]);
    const matrix = rows.map((row) => row.split(delimiter).map(normalizeCell));
    return extractBudgetFromMatrix(matrix, fallbackYearText);
};

const isPdfBinaryNoise = (value: string): boolean => {
    const lower = value.toLowerCase();
    const markers = ['endobj', 'endstream', 'xref', 'trailer', 'startxref', '/type', '/length'];
    const markerHits = markers.reduce(
        (count, marker) => (lower.includes(marker) ? count + 1 : count),
        0,
    );
    const slashTokens = (value.match(/\/[A-Za-z]{2,}/g) || []).length;
    const objectCount = (value.match(/\bobj\b/gi) || []).length;
    return markerHits >= 3 || slashTokens >= 12 || objectCount >= 8;
};

const extractPrintablePdfTextFallback = async (file: File): Promise<string> => {
    try {
        const buffer = await file.arrayBuffer();
        const latin = new TextDecoder('latin1').decode(buffer);
        const chunks = latin.match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 ,.:;#@/\-_%()€$]{3,}/g) || [];
        const raw = chunks.join('\n');
        if (!raw || isPdfBinaryNoise(raw)) return '';
        return raw
            .split('\n')
            .map((line) => line.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .join('\n');
    } catch {
        return '';
    }
};

const normalizeUnstructuredLine = (value: string): string => {
    return value.replace(/\s+/g, ' ').replace(/[|]/g, ' ').trim();
};

const isNoiseCategory = (category: string): boolean => {
    const lower = category.toLowerCase();
    const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!/[a-z]/i.test(normalized)) return true;
    if (normalized.length < 3) return true;
    if (/^(budget|annee|year|exercice|devise|currency)$/.test(normalized)) return true;
    return /(total|sous total|sub total|grand total)/.test(normalized);
};

const extractBudgetFromUnstructuredText = (
    text: string,
    fallbackYearText: string,
): { lines: ExtractedBudgetLine[]; year: string; parsed: boolean } => {
    const lines = text.split(/\r?\n/).map(normalizeUnstructuredLine).filter(Boolean);
    const year = extractYearFromText(`${fallbackYearText} ${text}`);

    if (!lines.length) {
        return { lines: [], year, parsed: false };
    }

    const delimiterLikeLines = lines.filter((line) => /[;,\t]/.test(line)).length;
    if (delimiterLikeLines >= Math.max(2, Math.floor(lines.length * 0.3))) {
        const csvLikeResult = extractBudgetFromCsvLike(lines.join('\n'), year);
        if (csvLikeResult.parsed) {
            return csvLikeResult;
        }
    }

    const extracted: ExtractedBudgetLine[] = [];
    const seen = new Set<string>();

    const pushCandidate = (categoryRaw: string, amountRaw: string): void => {
        const category = normalizeCell(categoryRaw)
            .replace(/[-:;]+$/g, '')
            .trim();
        const amount = parseNumericAmount(amountRaw);
        if (!category || !amount || isNoiseCategory(category)) return;
        const key = `${category.toLowerCase()}::${amount}`;
        if (seen.has(key)) return;
        seen.add(key);
        extracted.push({ category, amount });
    };

    for (const line of lines) {
        if (/(total|sous-total|grand total)/i.test(line)) continue;

        const numericTokens = [...line.matchAll(/([0-9][0-9\s.,]{1,18})/g)]
            .map((match) => ({ token: match[1], amount: parseNumericAmount(match[1]) }))
            .filter((entry) => entry.amount);

        if (!numericTokens.length) continue;

        const selected = numericTokens.reduce((best, current) =>
            Number(current.amount) > Number(best.amount) ? current : best,
        );

        let category = line
            .replace(selected.token, ' ')
            .replace(/(?:€|\$|xof|fcfa|cfa|eur|usd)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Keep only the textual label that likely represents the budget category.
        category = category
            .replace(/^[^A-Za-zÀ-ÿ]+/, '')
            .replace(/[^A-Za-zÀ-ÿ0-9 '&/()_-]+$/g, '')
            .trim();

        pushCandidate(category, selected.amount);
    }

    if (extracted.length) {
        return { lines: extracted, year, parsed: true };
    }

    const fallbackRegex = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 '&/()_-]{2,})\s+([0-9][0-9\s.,]{1,18})/g;
    for (const match of text.matchAll(fallbackRegex)) {
        const category = normalizeUnstructuredLine(match[1]);
        const amount = parseNumericAmount(match[2]);
        pushCandidate(category, amount);
    }

    return { lines: extracted, year, parsed: extracted.length > 0 };
};

export const extractBudgetDraftFromFile = async (file: File): Promise<ExtractedBudgetDraft> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const warnings: string[] = [];
    const defaultYear = extractYearFromText(file.name);

    /* CSV et Excel, lus comme les autres imports (`lib/tableur`) : encodage et séparateur
       déduits, toutes les feuilles regardées. */
    if (['csv', 'txt', 'xls', 'xlsx', 'xlsm', 'ods'].includes(extension)) {
        const tableur = extension === 'csv' || extension === 'txt' ? 'csv' : 'text';
        try {
            const classeur = await lireClasseur(file);
            /* La feuille qui porte le plus de lignes de budget — pas la première venue : un
               classeur garde souvent une feuille de références à côté. */
            let lue: ReturnType<typeof extractBudgetFromMatrix> | null = null;
            for (const feuille of classeur.feuilles) {
                const essai = extractBudgetFromMatrix(feuille.lignes, defaultYear);
                if (!lue || essai.lues.length > lue.lues.length) lue = essai;
            }

            if (!lue || lue.lues.length === 0) {
                warnings.push('Aucune ligne exploitable détectée dans le fichier.');
                return {
                    year: lue?.year || defaultYear,
                    lines: [],
                    confidence: 'low',
                    warnings,
                    source: tableur === 'csv' ? 'text' : 'manual',
                };
            }

            const lines = regrouperParPoste(lue.lues);
            const somme = lue.lues.reduce((total, ligne) => total + ligne.amount, 0);
            /* **La preuve par le total** : le fichier porte sa propre somme, on la compare. */
            const ecart = lue.total !== undefined && Math.abs(lue.total - somme) > 0.5;
            if (ecart && lue.total !== undefined) {
                warnings.push(
                    `Le total du fichier (${enChiffres(lue.total)}) diffère de la somme des lignes lues (${enChiffres(somme)}) : vérifiez les montants.`,
                );
            }
            const n = lue.lues.length;
            return {
                year: lue.year || defaultYear,
                lines,
                confidence: ecart ? 'medium' : n >= 3 ? 'high' : 'medium',
                warnings,
                source: tableur,
                summary: `${n} ligne${n > 1 ? 's' : ''} du fichier en ${lines.length} poste${lines.length > 1 ? 's' : ''} · total ${enChiffres(somme)}${lue.total !== undefined && !ecart ? ', égal à celui du fichier' : ''}`,
            };
        } catch {
            warnings.push('Impossible de lire ce fichier.');
            return {
                year: defaultYear,
                lines: [],
                confidence: 'low',
                warnings,
                source: 'manual',
            };
        }
    }

    if (extension === 'pdf' || IMAGE_EXTENSIONS.has(extension)) {
        const extractedText = await extractDocumentText(file, {
            maxPdfTextPages: 6,
            maxPdfOcrPages: 4,
        });
        let fallbackPdfText = '';
        if (extension === 'pdf') {
            fallbackPdfText = await extractPrintablePdfTextFallback(file);
        }

        const mergedText = [extractedText.text, fallbackPdfText].filter(Boolean).join('\n').trim();
        const canRead = extractedText.canReadText || fallbackPdfText.length > 0;
        const extractedWarnings = extractedText.warnings.filter(
            (warning) => warning !== 'Impossible de traiter ce PDF.',
        );
        warnings.push(...extractedWarnings);

        if (fallbackPdfText && !extractedText.canReadText) {
            warnings.push('Lecture native PDF indisponible, fallback texte brut utilisé.');
        }

        if (!canRead) {
            warnings.push('Aucune donnée lisible détectée sur ce document.');
            return {
                year: defaultYear,
                lines: [],
                confidence: 'low',
                warnings: Array.from(new Set(warnings)),
                source: 'manual',
            };
        }

        const parsed = extractBudgetFromUnstructuredText(mergedText, `${defaultYear} ${file.name}`);
        if (!parsed.parsed) {
            warnings.push(
                'Le document est lisible mais aucune ligne budgétaire fiable n’a été détectée.',
            );
            return {
                year: parsed.year || defaultYear,
                lines: [],
                confidence: 'low',
                warnings: Array.from(new Set(warnings)),
                source: 'text',
            };
        }

        const confidence: ExtractionConfidence =
            parsed.lines.length >= 3
                ? extractedText.source === 'native'
                    ? 'high'
                    : 'medium'
                : 'low';

        if (parsed.lines.length < 3) {
            warnings.push(
                'Extraction partielle: peu de lignes budgétaires détectées, vérifiez avant validation.',
            );
        }

        if (extractedText.source === 'ocr' || extractedText.source === 'hybrid') {
            warnings.push('Extraction OCR utilisée: vérifiez les montants avant validation.');
        }

        return {
            year: parsed.year || defaultYear,
            lines: parsed.lines,
            confidence,
            warnings: Array.from(new Set(warnings)),
            source: 'text',
        };
    }

    warnings.push('Format non pris en charge pour extraction budget automatique.');
    return {
        year: defaultYear,
        lines: [],
        confidence: 'low',
        warnings,
        source: 'filename',
    };
};
