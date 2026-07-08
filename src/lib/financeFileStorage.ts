interface ExpenseSourceFileRecord {
    id: string;
    name: string;
    type: string;
    blob: Blob;
    createdAt: string;
}

interface StoredExpenseSourceFile {
    id: string;
    name: string;
    type: string;
    blob: Blob;
}

const DB_NAME = 'tracker_finance_files';
const DB_VERSION = 1;
const STORE_NAME = 'expense_source_files';

let dbPromise: Promise<IDBDatabase> | null = null;

const canUseIndexedDb = (): boolean => {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
};

const createFileId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `expense_file_${crypto.randomUUID()}`;
    }
    return `expense_file_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const openDatabase = async (): Promise<IDBDatabase> => {
    if (!canUseIndexedDb()) {
        throw new Error('IndexedDB indisponible');
    }

    if (dbPromise) {
        return dbPromise;
    }

    const opening = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => {
            const database = request.result;
            database.onversionchange = () => {
                database.close();
                dbPromise = null;
            };
            resolve(database);
        };

        request.onerror = () => {
            reject(request.error || new Error('Ouverture IndexedDB impossible'));
        };

        request.onblocked = () => {
            reject(new Error('IndexedDB bloquee'));
        };
    });

    dbPromise = opening.catch((error) => {
        dbPromise = null;
        throw error;
    });

    return dbPromise;
};

export const saveExpenseSourceFile = async (file?: File | null): Promise<string | undefined> => {
    if (!file) {
        return undefined;
    }

    if (!canUseIndexedDb()) {
        return undefined;
    }

    const database = await openDatabase();
    const id = createFileId();
    const payload: ExpenseSourceFileRecord = {
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        blob: file,
        createdAt: new Date().toISOString(),
    };

    return new Promise<string>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(payload);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error || new Error('Enregistrement du fichier impossible'));
        transaction.onabort = () => reject(transaction.error || new Error('Transaction IndexedDB annulee'));
    });
};

export const getExpenseSourceFile = async (id?: string): Promise<StoredExpenseSourceFile | null> => {
    if (!id || !canUseIndexedDb()) {
        return null;
    }

    const database = await openDatabase();
    return new Promise<StoredExpenseSourceFile | null>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const record = request.result as ExpenseSourceFileRecord | undefined;
            if (!record) {
                resolve(null);
                return;
            }
            resolve({
                id: record.id,
                name: record.name,
                type: record.type,
                blob: record.blob,
            });
        };
        request.onerror = () => reject(request.error || new Error('Lecture du fichier impossible'));
    });
};

export const deleteExpenseSourceFile = async (id?: string): Promise<void> => {
    if (!id || !canUseIndexedDb()) {
        return;
    }

    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Suppression du fichier impossible'));
        transaction.onabort = () => reject(transaction.error || new Error('Transaction IndexedDB annulee'));
    });
};

