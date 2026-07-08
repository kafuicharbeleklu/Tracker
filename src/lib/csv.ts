export const sanitizeCsvCell = (value: unknown): string => {
    const raw = value === null || value === undefined ? '' : String(value);
    const normalized = raw.replace(/\r?\n/g, ' ').trim();
    const prefixed = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
    const escaped = prefixed.replace(/"/g, '""');
    return `"${escaped}"`;
};

export const buildCsvLine = (values: unknown[], delimiter: ';' | ',' = ';'): string =>
    values.map((value) => sanitizeCsvCell(value)).join(delimiter);

/**
 * Découpe une ligne CSV en respectant les guillemets (valeurs contenant le
 * délimiteur, guillemets doublés `""`). Symétrique de `buildCsvLine` : un
 * export réimporté ne casse pas sur les virgules internes.
 */
export const parseCsvLine = (line: string, delimiter: ';' | ',' = ';'): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === delimiter) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
};
