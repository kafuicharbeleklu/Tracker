import { collection, doc, getDoc, getDocs, setDoc, type Firestore } from 'firebase/firestore';

/**
 * La couche de persistance Firestore — le magasin distant de la simulation réelle.
 *
 * **Deux règles, et elles viennent d'un incident.** Un enregistrement a fait tomber
 * l'application entière : `UserAccessAssignment` n'a pas de champ `id`, il porte
 * `userId`, si bien que l'écriture demandait un document sans nom et que Firestore
 * levait « Cannot read properties of undefined ». L'erreur remontait jusqu'à React,
 * à chaque changement d'état, sur toutes les pages.
 *
 * 1. **L'identifiant d'un document se déclare**, il ne se devine pas : `getId` vaut
 *    `item.id` par défaut, et une collection qui nomme autrement le dit à l'appel.
 * 2. **Une écriture qui n'a pas de nom est ignorée, pas fatale.** Une couche de
 *    persistance ne fait pas tomber l'interface : ce qu'elle ne sait pas écrire, elle
 *    le laisse, et le dit une fois en console.
 */

function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([, entry]) => entry !== undefined)
                .map(([key, entry]) => [key, stripUndefined(entry)]),
        ) as T;
    }

    return value;
}

/**
 * `object` et non `Record<string, unknown>` : une interface déclarée — `User`,
 * `Equipment` — n'a pas de signature d'index, donc elle ne satisfait jamais cette
 * contrainte. Les quatorze appels du produit la violaient tous.
 */
export async function loadCollectionDocs<T extends object>(
    db: Firestore,
    collectionName: string,
): Promise<Array<T & { id: string }>> {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((documentSnapshot) => ({
        ...(documentSnapshot.data() as T),
        id: documentSnapshot.id,
    }));
}

export async function saveCollectionDocs<T extends object>(
    db: Firestore,
    collectionName: string,
    items: readonly T[],
    /** Le nom du document. Par défaut `item.id` ; `rbacAssignments` passe `userId`. */
    getId: (item: T) => string | undefined = (item) => (item as { id?: string }).id,
): Promise<void> {
    const nommables: Array<{ id: string; item: T }> = [];
    let sansNom = 0;

    for (const item of items) {
        const id = getId(item);
        if (typeof id === 'string' && id.length > 0) nommables.push({ id, item });
        else sansNom += 1;
    }

    if (sansNom > 0) {
        console.warn(
            `[firestore] ${sansNom} document(s) de « ${collectionName} » sans identifiant : non enregistrés.`,
        );
    }

    await Promise.all(
        nommables.map(({ id, item }) =>
            setDoc(doc(db, collectionName, id), stripUndefined(item) as Record<string, unknown>, {
                merge: true,
            }),
        ),
    );
}

/**
 * **Ce qui a changé depuis la dernière écriture** — et rien d'autre.
 *
 * `saveCollectionDocs` réécrivait la collection entière à chaque changement d'état :
 * confirmer une réception, c'est modifier **un** équipement, et cela écrivait les 257
 * documents du parc. Dix gestes de test suffisaient à consommer le budget quotidien du
 * plan gratuit, et Firestore répondait alors `RESOURCE_EXHAUSTED` à toute lecture —
 * l'application repartait sur ses données de démonstration, qui se mélangeaient à
 * l'inventaire réel. C'est le défaut relevé le 06/09.
 *
 * L'empreinte est le document sérialisé : deux rendus qui produisent le même objet
 * n'écrivent rien.
 */
export function documentsModifies<T extends object>(
    items: readonly T[],
    empreintes: Map<string, string>,
    getId: (item: T) => string | undefined = (item) => (item as { id?: string }).id,
): { aEcrire: T[]; empreintes: Map<string, string> } {
    const prochaines = new Map<string, string>();
    const aEcrire: T[] = [];

    for (const item of items) {
        const id = getId(item);
        if (typeof id !== 'string' || id.length === 0) continue;
        const empreinte = JSON.stringify(stripUndefined(item));
        prochaines.set(id, empreinte);
        if (empreintes.get(id) !== empreinte) aEcrire.push(item);
    }

    return { aEcrire, empreintes: prochaines };
}

export async function loadSingleDoc<T extends object>(
    db: Firestore,
    collectionName: string,
    documentId: string,
): Promise<T | null> {
    const snapshot = await getDoc(doc(db, collectionName, documentId));
    return snapshot.exists() ? (snapshot.data() as T) : null;
}

export async function saveSingleDoc<T extends object>(
    db: Firestore,
    collectionName: string,
    documentId: string,
    data: T,
): Promise<void> {
    await setDoc(
        doc(db, collectionName, documentId),
        stripUndefined(data) as Record<string, unknown>,
        { merge: true },
    );
}
