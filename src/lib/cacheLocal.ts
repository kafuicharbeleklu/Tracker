/**
 * **Le cache local des collections** (27/09) — une base IndexedDB du navigateur, une entrée par
 * collection Firestore.
 *
 * Il sert une seule chose : ne pas relire au serveur ce qu'on a déjà lu. Sans lui, chaque
 * ouverture de l'application relisait la base entière — ~1 000 lectures par visite, et le
 * quota gratuit (50 000 par jour) tombait en une cinquantaine d'ouvertures.
 *
 * **Le cache n'est jamais indispensable.** Navigation privée, stockage plein, IndexedDB
 * refusé : chaque fonction rend alors `null` ou ne fait rien, et l'application relit au
 * serveur comme avant. Une erreur de cache ne fait jamais tomber un chargement.
 */

const BASE = 'tracker-cache';
const MAGASIN = 'collections';

let ouverture: Promise<IDBDatabase | null> | null = null;

const ouvrir = (): Promise<IDBDatabase | null> => {
    ouverture ??= new Promise((resolve) => {
        try {
            if (typeof indexedDB === 'undefined') {
                resolve(null);
                return;
            }
            const requete = indexedDB.open(BASE, 1);
            requete.onupgradeneeded = () => {
                if (!requete.result.objectStoreNames.contains(MAGASIN)) {
                    requete.result.createObjectStore(MAGASIN);
                }
            };
            requete.onsuccess = () => resolve(requete.result);
            requete.onerror = () => resolve(null);
            requete.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
    return ouverture;
};

const transaction = async <T>(
    mode: IDBTransactionMode,
    agir: (magasin: IDBObjectStore) => IDBRequest,
): Promise<T | null> => {
    const base = await ouvrir();
    if (!base) return null;
    return new Promise((resolve) => {
        try {
            const requete = agir(base.transaction(MAGASIN, mode).objectStore(MAGASIN));
            requete.onsuccess = () => resolve((requete.result as T | undefined) ?? null);
            requete.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
};

export const lireCache = <T>(cle: string): Promise<T | null> =>
    transaction<T>('readonly', (magasin) => magasin.get(cle));

export const ecrireCache = async (cle: string, valeur: unknown): Promise<void> => {
    await transaction('readwrite', (magasin) => magasin.put(valeur, cle));
};
