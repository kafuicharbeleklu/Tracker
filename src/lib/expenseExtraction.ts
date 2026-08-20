import { ExtractionConfidence, FinanceExpenseType } from '../types';
import {
    AMOUNT_LABEL_PATTERNS,
    CURRENCY_PATTERNS,
    DATE_PATTERNS,
    EXPENSE_TYPE_KEYWORDS,
    INVOICE_NUMBER_PATTERNS,
    NON_SUPPLIER_TOKENS,
    SUPPLIER_LABEL_PATTERNS,
} from './financeExtractionRules';
import { DocumentExtractionSource, extractDocumentText } from './documentTextExtraction';
type XlsxModule = typeof import('xlsx');

export interface ExtractedExpenseDraft {
    supplier: string;
    amount: string;
    invoiceNumber: string;
    date: string;
    type: FinanceExpenseType;
    description: string;
    currencyCode?: string;
    textSource: DocumentExtractionSource;
    confidence: ExtractionConfidence;
    fieldConfidence: {
        supplier: ExtractionConfidence;
        amount: ExtractionConfidence;
        invoiceNumber: ExtractionConfidence;
        date: ExtractionConfidence;
    };
    warnings: string[];
    source: 'filename' | 'content' | 'hybrid';
}

const EXTENSIONS_WITH_DIRECT_TEXT = new Set(['csv', 'txt', 'json', 'md']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff']);

const loadXlsx = async (): Promise<XlsxModule> => {
    return import('xlsx');
};

const sanitizeBaseName = (fileName: string): string => {
    return fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const normalizeTokenNumber = (token: string): number | null => {
    const cleaned = token.replace(/[^\d., ]/g, '').trim();
    if (!cleaned) return null;

    const noSpaces = cleaned.replace(/\s+/g, '');
    const commaCount = (noSpaces.match(/,/g) || []).length;
    const dotCount = (noSpaces.match(/\./g) || []).length;

    if (commaCount > 0 && dotCount > 0) {
        const lastComma = noSpaces.lastIndexOf(',');
        const lastDot = noSpaces.lastIndexOf('.');
        const decimalSep = lastComma > lastDot ? ',' : '.';
        const normalized = noSpaces
            .replace(decimalSep === ',' ? /\./g : /,/g, '')
            .replace(decimalSep, '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (commaCount === 1 && dotCount === 0) {
        const parts = noSpaces.split(',');
        if (parts[1]?.length === 2) {
            const parsed = Number(`${parts[0]}.${parts[1]}`);
            return Number.isFinite(parsed) ? parsed : null;
        }
        const parsed = Number(noSpaces.replace(',', ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (dotCount === 1 && commaCount === 0) {
        const parts = noSpaces.split('.');
        if (parts[1]?.length === 2) {
            const parsed = Number(noSpaces);
            return Number.isFinite(parsed) ? parsed : null;
        }
        const parsed = Number(noSpaces.replace('.', ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    const parsed = Number(noSpaces.replace(/[.,]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
};

export const parseAmountString = (value: string): number | null => {
    return normalizeTokenNumber(value);
};

const normalizeWhitespace = (value: string): string => {
    return value
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
};

const normalizeInlineWhitespace = (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
};

const detectExpenseType = (input: string): FinanceExpenseType => {
    const value = input.toLowerCase();

    for (const [type, keywords] of Object.entries(EXPENSE_TYPE_KEYWORDS) as Array<
        [FinanceExpenseType, string[]]
    >) {
        if (keywords.some((keyword) => value.includes(keyword))) {
            return type;
        }
    }

    return 'Purchase';
};

const parseDateToken = (dateToken: string): string | null => {
    const normalized = dateToken.replace(/[.]/g, '/').replace(/-/g, '/').trim();
    const parts = normalized.split('/');

    if (parts.length !== 3) return null;

    const [a, b, c] = parts;
    let year = 0;
    let month = 0;
    let day = 0;

    if (a.length === 4) {
        year = Number(a);
        month = Number(b);
        day = Number(c);
    } else {
        day = Number(a);
        month = Number(b);
        year = Number(c.length === 2 ? `20${c}` : c);
    }

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const yyyy = String(year).padStart(4, '0');
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
        return normalizeWhitespace(raw);
    } catch {
        return '';
    }
};

const readBestEffortText = async (
    file: File,
): Promise<{
    text: string;
    canReadText: boolean;
    source: DocumentExtractionSource;
    warnings: string[];
}> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (EXTENSIONS_WITH_DIRECT_TEXT.has(extension)) {
        const text = await file.text();
        return {
            text: normalizeWhitespace(text),
            canReadText: text.trim().length > 0,
            source: 'native',
            warnings: [],
        };
    }

    if (extension === 'pdf' || IMAGE_EXTENSIONS.has(extension)) {
        const extracted = await extractDocumentText(file, {
            maxPdfTextPages: 4,
            maxPdfOcrPages: 3,
        });
        const warnings = extracted.warnings.filter(
            (warning) => warning !== 'Impossible de traiter ce PDF.',
        );
        let mergedText = extracted.text;
        let source: DocumentExtractionSource = extracted.source;

        if (extension === 'pdf') {
            const fallbackText = await extractPrintablePdfTextFallback(file);
            mergedText = normalizeWhitespace(
                [extracted.text, fallbackText].filter(Boolean).join('\n'),
            );

            if (fallbackText && !extracted.canReadText) {
                source = 'native';
                warnings.push('Lecture native PDF indisponible, fallback texte brut utilisé.');
            }
        }

        return {
            text: mergedText,
            canReadText: mergedText.length > 0,
            source,
            warnings,
        };
    }

    if (extension === 'xls' || extension === 'xlsx') {
        try {
            const xlsx = await loadXlsx();
            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) return { text: '', canReadText: false, source: 'none', warnings: [] };

            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json<Array<string | number>>(sheet, {
                header: 1,
                raw: false,
                defval: '',
            });
            const flattened = rows
                .map((row) =>
                    row
                        .map((cell) => String(cell || '').trim())
                        .filter(Boolean)
                        .join(' '),
                )
                .filter(Boolean)
                .join('\n');

            return {
                text: normalizeWhitespace(flattened),
                canReadText: flattened.trim().length > 0,
                source: 'native',
                warnings: [],
            };
        } catch {
            return {
                text: '',
                canReadText: false,
                source: 'none',
                warnings: ['Impossible de lire ce fichier Excel automatiquement.'],
            };
        }
    }

    // Fallback for unknown text-like files.
    try {
        const text = await file.text();
        return {
            text: normalizeWhitespace(text),
            canReadText: text.trim().length > 0,
            source: 'native',
            warnings: [],
        };
    } catch {
        return { text: '', canReadText: false, source: 'none', warnings: [] };
    }
};

const extractFromFilename = (
    normalizedName: string,
): {
    supplier: string;
    amount: number | null;
    invoiceNumber: string;
    type: FinanceExpenseType;
} => {
    const amountCandidates = [...normalizedName.matchAll(/\d[\d\s.,]{0,16}\d|\d/g)]
        .map((match) => normalizeTokenNumber(match[0]))
        .filter((value): value is number => value !== null && value > 0);

    const amount = amountCandidates.length ? Math.max(...amountCandidates) : null;
    const supplier =
        normalizeInlineWhitespace(
            normalizedName
                .replace(/\d[\d\s.,]*/g, ' ')
                .replace(/\b(inv|invoice|facture|fact|bill|doc)\b/gi, ' '),
        ) || 'Fournisseur non détecté';

    const invoicePattern = INVOICE_NUMBER_PATTERNS.map((pattern) =>
        normalizedName.match(pattern),
    ).find(Boolean);
    const invoiceNumber = invoicePattern?.[1] || '';

    return {
        supplier,
        amount,
        invoiceNumber,
        type: detectExpenseType(normalizedName),
    };
};

const extractInvoiceNumberFromText = (text: string): string => {
    for (const pattern of INVOICE_NUMBER_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) return normalizeInlineWhitespace(match[1]).toUpperCase();
    }
    return '';
};

const extractAmountFromText = (text: string): number | null => {
    for (const pattern of AMOUNT_LABEL_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const parsed = normalizeTokenNumber(match[1]);
            if (parsed && parsed > 0) return parsed;
        }
    }

    const fallbackCandidates = [...text.matchAll(/(?:€|\$|xof|cfa)?\s*([0-9][0-9\s.,]{1,20})/gi)]
        .map((match) => normalizeTokenNumber(match[1]))
        .filter((value): value is number => value !== null && value > 0);

    if (!fallbackCandidates.length) return null;
    return Math.max(...fallbackCandidates);
};

const cleanSupplierCandidate = (value: string): string => {
    const cleaned = normalizeInlineWhitespace(
        value.replace(/[:|]/g, ' ').replace(/[0-9]/g, ' ').replace(/\s+/g, ' '),
    );

    if (!cleaned) return '';

    const lower = cleaned.toLowerCase();
    if (NON_SUPPLIER_TOKENS.some((token) => lower.includes(token))) return '';
    return cleaned;
};

const extractSupplierFromText = (text: string): string => {
    for (const pattern of SUPPLIER_LABEL_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const cleaned = cleanSupplierCandidate(match[1]);
            if (cleaned) return cleaned;
        }
    }

    const lines = text
        .split(/\r?\n/)
        .map((line) => normalizeInlineWhitespace(line))
        .filter(Boolean)
        .slice(0, 15);

    for (const line of lines) {
        const cleaned = cleanSupplierCandidate(line);
        if (cleaned && cleaned.length >= 3) return cleaned;
    }

    return '';
};

const extractDateFromText = (text: string): string | null => {
    for (const pattern of DATE_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const parsed = parseDateToken(match[1]);
            if (parsed) return parsed;
        }
    }

    return null;
};

const detectCurrencyFromText = (text: string): string | null => {
    const candidate = CURRENCY_PATTERNS.find((entry) => entry.regex.test(text));
    return candidate?.code || null;
};

const computeConfidenceFromFieldScores = (scores: ExtractionConfidence[]): ExtractionConfidence => {
    const hasLow = scores.includes('low');
    const highCount = scores.filter((score) => score === 'high').length;
    const mediumCount = scores.filter((score) => score === 'medium').length;

    if (highCount >= 3 && !hasLow) return 'high';
    if (highCount >= 2 || mediumCount >= 2) return 'medium';
    return 'low';
};

export const extractExpenseDraftFromFile = async (file: File): Promise<ExtractedExpenseDraft> => {
    const warnings: string[] = [];
    const normalizedName = sanitizeBaseName(file.name);
    const fromFilename = extractFromFilename(normalizedName);

    const {
        text,
        canReadText,
        source: extractedTextSource,
        warnings: extractionWarnings,
    } = await readBestEffortText(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    warnings.push(...extractionWarnings);

    if (!canReadText) {
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            warnings.push('Extraction partielle sur Excel. Vérifiez les champs.');
        } else if (fileExtension === 'pdf' || IMAGE_EXTENSIONS.has(fileExtension)) {
            warnings.push('Le document est peu lisible. Vérifiez les champs extraits.');
        } else {
            warnings.push('Contenu non lisible automatiquement. Vérifiez les champs.');
        }
    }

    if ((extractedTextSource === 'ocr' || extractedTextSource === 'hybrid') && canReadText) {
        warnings.push('Texte OCR détecté: vérifiez les montants et références avant validation.');
    }

    const invoiceFromText = text ? extractInvoiceNumberFromText(text) : '';
    const amountFromText = text ? extractAmountFromText(text) : null;
    const supplierFromText = text ? extractSupplierFromText(text) : '';
    const dateFromText = text ? extractDateFromText(text) : null;
    const detectedCurrency = text ? detectCurrencyFromText(text) : null;

    const supplier = supplierFromText || fromFilename.supplier || 'Fournisseur non détecté';
    const amountValue = amountFromText ?? fromFilename.amount ?? null;
    const amount = amountValue !== null ? amountValue.toString() : '';
    const invoiceNumber = invoiceFromText || fromFilename.invoiceNumber;
    const date = dateFromText || new Date().toISOString().split('T')[0];
    const type = detectExpenseType(`${normalizedName} ${text}`);

    const fieldConfidence = {
        supplier: supplierFromText ? 'high' : fromFilename.supplier ? 'medium' : 'low',
        amount: amountFromText ? 'high' : fromFilename.amount ? 'medium' : 'low',
        invoiceNumber: invoiceFromText ? 'high' : fromFilename.invoiceNumber ? 'medium' : 'low',
        date: dateFromText ? 'high' : 'low',
    } as const;

    const confidence = computeConfidenceFromFieldScores([
        fieldConfidence.supplier,
        fieldConfidence.amount,
        fieldConfidence.invoiceNumber,
        fieldConfidence.date,
    ]);

    if (!amount) warnings.push('Montant non détecté automatiquement.');
    if (!invoiceNumber) warnings.push('Numéro de facture non détecté.');
    if (!supplier || supplier === 'Fournisseur non détecté')
        warnings.push('Fournisseur non détecté automatiquement.');

    const source: ExtractedExpenseDraft['source'] =
        canReadText && (amountFromText || supplierFromText || invoiceFromText)
            ? fromFilename.amount || fromFilename.invoiceNumber
                ? 'hybrid'
                : 'content'
            : 'filename';

    const descriptionParts = [
        invoiceNumber ? `Réf ${invoiceNumber}` : null,
        supplier && supplier !== 'Fournisseur non détecté' ? supplier : null,
    ].filter(Boolean);
    const descriptionPrefix = descriptionParts.length ? `${descriptionParts.join(' · ')} · ` : '';
    const descriptionCurrencySuffix = detectedCurrency ? ` (${detectedCurrency})` : '';

    return {
        supplier,
        amount,
        invoiceNumber,
        date,
        type,
        description: `${descriptionPrefix}Facture importée depuis ${file.name}${descriptionCurrencySuffix}`,
        currencyCode: detectedCurrency || undefined,
        textSource: extractedTextSource,
        confidence,
        fieldConfidence,
        warnings: Array.from(new Set(warnings)),
        source,
    };
};
