/**
 * **La signature enregistrée — lot 28, D1.**
 *
 * *« Importer, recadrer et garder une signature ; quand le code PIN vaut, l'apposer
 * d'elle-même comme preuve visuelle. »* (planches 07.1, 17.4, 17.10)
 *
 * **Une image ne va pas dans `localStorage`.** Elle y tiendrait en base64 — un tiers plus
 * lourde, dans un quota de 5 Mo partagé par toutes les clés du produit, et relue en
 * synchrone à chaque démarrage. Elle vit donc en **IndexedDB**, un `Blob` PNG par
 * personne, comme les justificatifs de dépense (`lib/financeFileStorage.ts`).
 *
 * **Ce fichier est la seule porte.** Les écrans ne connaissent que `get`, `save` et
 * `remove` ; ils ne savent pas où l'image est rangée. Basculer vers un stockage serveur,
 * c'est réécrire ce fichier et rien d'autre.
 *
 * **Remplacer purge d'abord** (D5) : `save` supprime l'enregistrement précédent avant
 * d'écrire, pour qu'une personne n'ait jamais deux signatures dont une invisible.
 */

/** Ce que le magasin garde : l'image, et quand elle a été posée. */
interface SignatureRecord {
    /** L'identifiant de la personne : une signature par compte, pas une par import. */
    userId: string;
    /** L'identifiant de l'enregistrement, celui que `User.signatureId` porte. */
    id: string;
    blob: Blob;
    savedAt: string;
}

export interface SavedSignature {
    id: string;
    savedAt: string;
}

const DB_NAME = 'tracker_signatures';
const DB_VERSION = 1;
const STORE_NAME = 'signatures';

let dbPromise: Promise<IDBDatabase> | null = null;

const canUseIndexedDb = (): boolean =>
    typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const createSignatureId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `signature_${crypto.randomUUID()}`;
    }
    return `signature_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
                /* La clé est la **personne** : une signature par compte, et l'écriture
                   suivante écrase la précédente sans qu'on ait à la chercher. */
                database.createObjectStore(STORE_NAME, { keyPath: 'userId' });
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
            reject(new Error('IndexedDB bloquée'));
        };
    });

    dbPromise = opening.catch((error) => {
        dbPromise = null;
        throw error;
    });

    return dbPromise;
};

/**
 * La signature d'une personne, ou `null`. **Un magasin indisponible n'est pas une
 * erreur** : le produit sait attester sans image — le code PIN suffit, et le tracé reste
 * là. Un navigateur en navigation privée ne doit pas casser une remise.
 */
const get = async (userId?: string): Promise<Blob | null> => {
    if (!userId || !canUseIndexedDb()) return null;

    try {
        const database = await openDatabase();
        return await new Promise<Blob | null>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readonly');
            const request = transaction.objectStore(STORE_NAME).get(userId);
            request.onsuccess = () => {
                const record = request.result as SignatureRecord | undefined;
                resolve(record?.blob ?? null);
            };
            request.onerror = () =>
                reject(request.error || new Error('Lecture de la signature impossible'));
        });
    } catch {
        return null;
    }
};

/** Quand la signature a été posée — la sous-ligne de 07.1 : « importée le 5 septembre ». */
const getSavedAt = async (userId?: string): Promise<string | null> => {
    if (!userId || !canUseIndexedDb()) return null;

    try {
        const database = await openDatabase();
        return await new Promise<string | null>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readonly');
            const request = transaction.objectStore(STORE_NAME).get(userId);
            request.onsuccess = () => {
                const record = request.result as SignatureRecord | undefined;
                resolve(record?.savedAt ?? null);
            };
            request.onerror = () =>
                reject(request.error || new Error('Lecture de la signature impossible'));
        });
    } catch {
        return null;
    }
};

/**
 * Enregistre — et **purge l'ancienne d'abord** (D5). Rend l'identifiant à écrire dans
 * `User.signatureId` : c'est lui qui dit, hors du magasin, qu'une signature existe.
 */
const save = async (userId: string, blob: Blob): Promise<SavedSignature> => {
    const database = await openDatabase();
    await remove(userId);

    const record: SignatureRecord = {
        userId,
        id: createSignatureId(),
        blob,
        savedAt: new Date().toISOString(),
    };

    return new Promise<SavedSignature>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const request = transaction.objectStore(STORE_NAME).put(record);
        request.onsuccess = () => resolve({ id: record.id, savedAt: record.savedAt });
        request.onerror = () =>
            reject(request.error || new Error('Enregistrement de la signature impossible'));
        transaction.onabort = () =>
            reject(transaction.error || new Error('Transaction IndexedDB annulée'));
    });
};

/** Supprime — la rangée de 07.1 revient à « aucune », et un compte supprimé emporte la sienne. */
const remove = async (userId?: string): Promise<void> => {
    if (!userId || !canUseIndexedDb()) return;

    try {
        const database = await openDatabase();
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            const request = transaction.objectStore(STORE_NAME).delete(userId);
            request.onsuccess = () => resolve();
            request.onerror = () =>
                reject(request.error || new Error('Suppression de la signature impossible'));
        });
    } catch {
        /* Rien à supprimer si le magasin n'ouvre pas : l'appelant n'a rien à rattraper. */
    }
};

export const signatureService = { get, getSavedAt, save, remove };
