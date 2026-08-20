type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type TesseractModule = typeof import('tesseract.js');

export type DocumentExtractionSource = 'native' | 'ocr' | 'hybrid' | 'none';

interface DocumentTextExtractionResult {
    text: string;
    canReadText: boolean;
    source: DocumentExtractionSource;
    warnings: string[];
}

interface ExtractionOptions {
    maxPdfTextPages?: number;
    maxPdfOcrPages?: number;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff']);

const normalizeWhitespace = (value: string): string => {
    return value
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
};

const loadPdfJs = async (): Promise<PdfJsModule> => {
    return import('pdfjs-dist/legacy/build/pdf.mjs');
};

const loadTesseract = async (): Promise<TesseractModule> => {
    return import('tesseract.js');
};

const extractPdfNativeText = async (pdfData: ArrayBuffer, maxPages: number): Promise<string> => {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
        data: pdfData,
        disableWorker: true,
        useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pagesToRead = Math.min(pdfDocument.numPages || 0, Math.max(maxPages, 1));
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
            .map((item) => {
                if (typeof item === 'object' && item !== null && 'str' in item) {
                    return String((item as { str?: unknown }).str || '');
                }
                return '';
            })
            .join(' ');

        pageTexts.push(normalizeWhitespace(text));
    }

    await pdfDocument.destroy();
    await loadingTask.destroy();
    return normalizeWhitespace(pageTexts.join('\n'));
};

const renderPdfPagesAsDataUrls = async (
    pdfData: ArrayBuffer,
    maxPages: number,
): Promise<string[]> => {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
        data: pdfData,
        disableWorker: true,
        useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pagesToRender = Math.min(pdfDocument.numPages || 0, Math.max(maxPages, 1));
    const images: string[] = [];

    for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            continue;
        }

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        await page.render({
            canvasContext: context,
            viewport,
        }).promise;

        images.push(canvas.toDataURL('image/png'));
    }

    await pdfDocument.destroy();
    await loadingTask.destroy();
    return images;
};

const ocrFromImageSource = async (image: Blob | string): Promise<string> => {
    const tesseract = await loadTesseract();
    let worker = await tesseract.createWorker('fra+eng');
    try {
        const result = await worker.recognize(image);
        return normalizeWhitespace(result.data.text || '');
    } catch {
        await worker.terminate();
        worker = await tesseract.createWorker('eng');
        const fallbackResult = await worker.recognize(image);
        return normalizeWhitespace(fallbackResult.data.text || '');
    } finally {
        await worker.terminate();
    }
};

const extractFromImage = async (file: File): Promise<DocumentTextExtractionResult> => {
    try {
        const text = await ocrFromImageSource(file);
        if (!text) {
            return {
                text: '',
                canReadText: false,
                source: 'none',
                warnings: ['OCR image n’a pas pu extraire de texte exploitable.'],
            };
        }

        return {
            text,
            canReadText: true,
            source: 'ocr',
            warnings: [],
        };
    } catch {
        return {
            text: '',
            canReadText: false,
            source: 'none',
            warnings: ['OCR image indisponible ou en échec.'],
        };
    }
};

const extractFromPdf = async (
    file: File,
    options: ExtractionOptions,
): Promise<DocumentTextExtractionResult> => {
    const warnings: string[] = [];
    const maxTextPages = options.maxPdfTextPages ?? 3;
    const maxOcrPages = options.maxPdfOcrPages ?? 2;

    try {
        const data = await file.arrayBuffer();
        let nativeText = '';

        try {
            nativeText = await extractPdfNativeText(data, maxTextPages);
        } catch {
            warnings.push('Lecture texte PDF native échouée, bascule OCR.');
        }

        if (nativeText.length >= 120) {
            return {
                text: nativeText,
                canReadText: true,
                source: 'native',
                warnings,
            };
        }

        const pageImages = await renderPdfPagesAsDataUrls(data, maxOcrPages);
        const ocrTexts: string[] = [];
        for (const image of pageImages) {
            const pageText = await ocrFromImageSource(image);
            if (pageText) {
                ocrTexts.push(pageText);
            }
        }

        const ocrText = normalizeWhitespace(ocrTexts.join('\n'));
        const mergedText = normalizeWhitespace(`${nativeText}\n${ocrText}`);

        if (!mergedText) {
            warnings.push('Aucun texte exploitable extrait du PDF.');
            return {
                text: '',
                canReadText: false,
                source: 'none',
                warnings,
            };
        }

        const source: DocumentExtractionSource =
            nativeText && ocrText ? 'hybrid' : ocrText ? 'ocr' : 'native';

        if (source === 'ocr') {
            warnings.push(
                'Texte extrait via OCR, vérifiez les champs sensibles (montants/références).',
            );
        }

        return {
            text: mergedText,
            canReadText: true,
            source,
            warnings,
        };
    } catch {
        return {
            text: '',
            canReadText: false,
            source: 'none',
            warnings: ['Impossible de traiter ce PDF.'],
        };
    }
};

export const extractDocumentText = async (
    file: File,
    options: ExtractionOptions = {},
): Promise<DocumentTextExtractionResult> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (extension === 'pdf') {
        return extractFromPdf(file, options);
    }

    if (IMAGE_EXTENSIONS.has(extension)) {
        return extractFromImage(file);
    }

    return {
        text: '',
        canReadText: false,
        source: 'none',
        warnings: [],
    };
};
