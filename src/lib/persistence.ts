export const getPersistedValue = (currentKey: string, legacyKey: string): string | null => {
    const currentValue = localStorage.getItem(currentKey);
    if (currentValue !== null) {
        return currentValue;
    }

    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue !== null) {
        localStorage.setItem(currentKey, legacyValue);
        localStorage.removeItem(legacyKey);
        return legacyValue;
    }

    return null;
};
