import { ExtractionConfidence } from '../types';
import { extractDocumentText } from './documentTextExtraction';
type XlsxModule = typeof import('xlsx');

export interface ExtractedBudgetLine {
    category: string;
    amount: string;
}

export interface ExtractedBudgetDraft {
    year: string;
    lines: ExtractedBudgetLine[];
    confidence: ExtractionConfidence;
    warnings: string[];
    source: 'csv' | 'text' | 'filename' | 'manual';
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

const normalizeCell = (value: string): string => {
    return value.replace(/^"|"$/g, '').trim();
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

const loadXlsx = async (): Promise<XlsxModule> => {
    return import('xlsx');
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

const extractBudgetFromMatrix = (
    matrix: string[][],
    fallbackYearText: string,
): { lines: ExtractedBudgetLine[]; year: string; parsed: boolean } => {
    if (!matrix.length) {
        return { lines: [], year: extractYearFromText(fallbackYearText), parsed: false };
    }

    const headerRowIndex = findBestHeaderRow(matrix);
    const header = (matrix[headerRowIndex] || []).map(normalizeHeaderCell);

    const categoryIndex = header.findIndex((cell) =>
        /categorie|category|poste|rubrique|designation/.test(cell),
    );
    const hintedAmountIndex = header.findIndex((cell) =>
        /total|montant|amount|budget|allocated|alloue|valeur|cout|prix/.test(cell),
    );
    const yearIndex = header.findIndex((cell) => /annee|year|exercice/.test(cell));

    const catIndex = categoryIndex >= 0 ? categoryIndex : 0;
    const startRow = headerRowIndex + 1;
    const amtIndex = findBestAmountColumn(matrix, startRow, catIndex, hintedAmountIndex);

    const lines: ExtractedBudgetLine[] = [];
    for (let i = startRow; i < matrix.length; i += 1) {
        const row = matrix[i];
        const category = normalizeCell(row?.[catIndex] || '');
        const amount = parseNumericAmount(row?.[amtIndex] || '');
        if (!category || !amount) continue;
        lines.push({ category, amount });
    }

    let detectedYear = extractYearFromText(fallbackYearText);
    if (yearIndex >= 0) {
        const yearToken = normalizeCell(
            matrix[startRow]?.[yearIndex] || matrix[headerRowIndex]?.[yearIndex] || '',
        );
        detectedYear = extractYearFromText(yearToken || fallbackYearText);
    }

    return {
        lines,
        year: detectedYear,
        parsed: lines.length > 0,
    };
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

const extractBudgetFromWorkbook = (
    buffer: ArrayBuffer,
    xlsx: XlsxModule,
    fallbackYearText: string,
): { lines: ExtractedBudgetLine[]; year: string; parsed: boolean } => {
    const workbook = xlsx.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        return { lines: [], year: new Date().getFullYear().toString(), parsed: false };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Array<string | number>>(sheet, {
        header: 1,
        raw: false,
        defval: '',
    });

    if (!rows.length) {
        return { lines: [], year: new Date().getFullYear().toString(), parsed: false };
    }

    const normalizedRows = rows.map((row) => row.map((cell) => String(cell || '').trim()));
    return extractBudgetFromMatrix(normalizedRows, fallbackYearText);
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

    if (extension === 'csv' || extension === 'txt') {
        const rawText = await file.text();
        const parsed = extractBudgetFromCsvLike(rawText, defaultYear);
        if (!parsed.parsed) {
            warnings.push('Aucune ligne exploitable détectée dans le fichier.');
            return {
                year: parsed.year || defaultYear,
                lines: [],
                confidence: 'low',
                warnings,
                source: 'text',
            };
        }

        return {
            year: parsed.year || defaultYear,
            lines: parsed.lines,
            confidence: parsed.lines.length >= 3 ? 'high' : 'medium',
            warnings,
            source: 'csv',
        };
    }

    if (extension === 'xls' || extension === 'xlsx') {
        try {
            const xlsx = await loadXlsx();
            const buffer = await file.arrayBuffer();
            const parsed = extractBudgetFromWorkbook(buffer, xlsx, defaultYear);
            if (!parsed.parsed) {
                warnings.push('Aucune ligne exploitable détectée dans ce fichier Excel.');
                return {
                    year: parsed.year || defaultYear,
                    lines: [],
                    confidence: 'low',
                    warnings,
                    source: 'manual',
                };
            }

            return {
                year: parsed.year || defaultYear,
                lines: parsed.lines,
                confidence: parsed.lines.length >= 3 ? 'high' : 'medium',
                warnings,
                source: 'text',
            };
        } catch {
            warnings.push('Impossible de lire ce fichier Excel.');
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
