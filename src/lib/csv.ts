export const sanitizeCsvCell = (value: unknown): string => {
    const raw = value === null || value === undefined ? '' : String(value);
    const normalized = raw.replace(/\r?\n/g, ' ').trim();
    const prefixed = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
    const escaped = prefixed.replace(/"/g, '""');
    return `"${escaped}"`;
};

export const buildCsvLine = (values: unknown[], delimiter: ';' | ',' = ';'): string =>
    values.map((value) => sanitizeCsvCell(value)).join(delimiter);
