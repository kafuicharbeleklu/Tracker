import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where,
    type DocumentData,
    type Firestore,
    type SnapshotMetadata,
} from 'firebase/firestore';
import { ecrireCache, lireCache } from './cacheLocal';
import { FIRESTORE_EMULATEUR } from './firebase';

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
 * **L'heure du serveur, posée par chaque écriture** (27/09). Elle permet à une ouverture de ne
 * relire que les documents écrits depuis la précédente (`chargerCollection`). Elle ne remonte
 * jamais dans l'état de l'application : la lecture la retire, et l'empreinte d'un document
 * (`documentsModifies`) ne la voit donc pas.
 */
export const CHAMP_MAJ = '_maj';

/**
 * **La pierre tombale d'un document supprimé** (27/09). Effacer le document ne suffirait pas :
 * les navigateurs ne relisent que ce qui a changé (`_maj`), et un document absent n'a pas
 * changé — l'objet supprimé resterait dans leur cache. On le remplace donc par une trace datée,
 * que chaque lecture retire.
 */
export const CHAMP_SUPPRIME = '_supprime';

const estSupprime = (data: DocumentData) => data[CHAMP_SUPPRIME] === true;

/**
 * **Jamais de lecture hors ligne dans l'état ni dans le cache** (27/09). Quand Firestore ne
 * répond pas, le SDK rend ce qu'il a en cache local — vide, ou périmé — en le marquant
 * `fromCache`. Graver cela, c'était montrer une base vide et la garder en cache sept jours.
 */
const duServeur = <T extends { metadata: SnapshotMetadata }>(instantane: T): T => {
    if (instantane.metadata.fromCache) {
        throw new Error('Firestore ne répond pas : lecture hors ligne écartée.');
    }
    return instantane;
};

type Repere = { s: number; ns: number };

const retirerMaj = (data: DocumentData): { donnees: DocumentData; maj: Repere | null } => {
    const donnees = { ...data };
    const brut: unknown = donnees[CHAMP_MAJ];
    delete donnees[CHAMP_MAJ];
    return {
        donnees,
        maj: brut instanceof Timestamp ? { s: brut.seconds, ns: brut.nanoseconds } : null,
    };
};

const plusRecent = (a: Repere | null, b: Repere | null): Repere | null => {
    if (!a) return b;
    if (!b) return a;
    return b.s > a.s || (b.s === a.s && b.ns > a.ns) ? b : a;
};

/** L'ordre de Firestore : par identifiant. Les raccourcis de connexion en dépendent. */
const parIdentifiant = ([a]: [string, unknown], [b]: [string, unknown]) =>
    a < b ? -1 : a > b ? 1 : 0;

/**
 * **La génération des données** — `meta/synchro.generation`. Un script qui remplace la base
 * (chargement de la simulation, restauration, import) écrit sans l'heure du serveur : les
 * caches ne verraient jamais ses documents. Il annonce donc une nouvelle génération
 * (`scripts/lib/generation.mjs`), et tout cache d'une autre génération se relit en entier.
 * Une lecture par chargement de page.
 */
let generation: Promise<string> | null = null;

const lireGeneration = (db: Firestore): Promise<string> => {
    generation ??= getDoc(doc(db, 'meta', 'synchro')).then(
        (instantane) => String(duServeur(instantane).data()?.generation ?? ''),
        (erreur: unknown) => {
            generation = null;
            throw erreur;
        },
    );
    return generation;
};

/**
 * Passé ce délai, un cache se relit en entier même si rien ne l'a annoncé : c'est le filet
 * d'une retouche faite à la main dans la console Firebase, qui ne pose pas `_maj`.
 */
const DUREE_DU_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

interface EntreeDeCache {
    generation: string;
    /** L'instant de la dernière lecture complète. */
    completLe: number;
    /** Le `_maj` le plus récent déjà lu : la prochaine ouverture lit au-delà. */
    repere: Repere | null;
    docs: Array<[string, DocumentData]>;
}

/* Le projet et le serveur dans la clé : l'émulateur et la base réelle ne se mélangent pas. */
const cleDeCache = (db: Firestore, nom: string) =>
    `${db.app.options.projectId ?? '?'}|${FIRESTORE_EMULATEUR ?? 'serveur'}|${nom}`;

const enDocuments = <T extends object>(docs: Array<[string, DocumentData]>) =>
    docs.map(([id, donnees]) => ({ ...(donnees as T), id }));

/** Toute la collection, au serveur ; le cache repart de cette lecture. */
const lireEnEntier = async <T extends object>(
    db: Firestore,
    nom: string,
): Promise<Array<T & { id: string }>> => {
    const [generationActuelle, instantane] = await Promise.all([
        lireGeneration(db),
        getDocs(collection(db, nom)).then(duServeur),
    ]);
    let repere: Repere | null = null;
    const docs: Array<[string, DocumentData]> = [];
    for (const document of instantane.docs) {
        const { donnees, maj } = retirerMaj(document.data());
        repere = plusRecent(repere, maj);
        if (!estSupprime(donnees)) docs.push([document.id, donnees]);
    }
    const entree: EntreeDeCache = {
        generation: generationActuelle,
        completLe: Date.now(),
        repere,
        docs,
    };
    await ecrireCache(cleDeCache(db, nom), entree);
    return enDocuments<T>(docs);
};

/**
 * Le cache de la collection, complété de ce qui a changé depuis sa dernière lecture — les
 * suppressions comprises (`CHAMP_SUPPRIME`) ; `null` quand il n'y a pas de cache valable
 * (absent, d'une autre génération, trop ancien).
 */
const lireDepuisCache = async <T extends object>(
    db: Firestore,
    nom: string,
): Promise<Array<T & { id: string }> | null> => {
    const [generationActuelle, cache] = await Promise.all([
        lireGeneration(db),
        lireCache<EntreeDeCache>(cleDeCache(db, nom)),
    ]);
    if (
        !cache ||
        cache.generation !== generationActuelle ||
        Date.now() - cache.completLe > DUREE_DU_CACHE_MS
    ) {
        return null;
    }

    const depuis = cache.repere
        ? new Timestamp(cache.repere.s, cache.repere.ns)
        : new Timestamp(0, 0);
    const changes = duServeur(
        await getDocs(query(collection(db, nom), where(CHAMP_MAJ, '>', depuis))),
    );
    if (changes.empty) return enDocuments<T>(cache.docs);

    const parId = new Map(cache.docs);
    let repere = cache.repere;
    for (const document of changes.docs) {
        const { donnees, maj } = retirerMaj(document.data());
        if (estSupprime(donnees)) parId.delete(document.id);
        else parId.set(document.id, donnees);
        repere = plusRecent(repere, maj);
    }
    const docs = [...parId].sort(parIdentifiant);
    await ecrireCache(cleDeCache(db, nom), { ...cache, repere, docs } satisfies EntreeDeCache);
    return enDocuments<T>(docs);
};

/**
 * **Une collection, sans la relire en entier** (27/09). La première ouverture la lit au
 * serveur et la garde dans le navigateur (`cacheLocal`) ; les suivantes ne demandent que les
 * documents écrits depuis — une lecture facturée quand rien n'a changé, au lieu d'une par
 * document. Avant, chaque ouverture relisait la base entière : ~1 000 lectures.
 *
 * `object` et non `Record<string, unknown>` : une interface déclarée — `User`,
 * `Equipment` — n'a pas de signature d'index, donc elle ne satisfait jamais cette
 * contrainte.
 */
export async function chargerCollection<T extends object>(
    db: Firestore,
    nom: string,
): Promise<Array<T & { id: string }>> {
    return (await lireDepuisCache<T>(db, nom)) ?? lireEnEntier<T>(db, nom);
}

/** Les sources des événements de campagne d'inventaire : `audit_scan`, `audit_finalize`… */
const PREFIXE_CAMPAGNE = 'audit_';

/**
 * **Le journal, sans le lire en entier** (27/09). C'est la plus grosse collection (543 des
 * 971 documents au 26/09), elle grossit à chaque geste et n'est jamais purgée.
 *
 * Déjà en cache, il se complète comme une autre collection. Sinon, l'ouverture n'en lit que
 * les `recents` derniers événements (l'accueil, la file, les parcours récents) et ceux des
 * campagnes d'inventaire (la carte « Inventaire en cours » les compte tous) ; le reste attend
 * qu'un écran le demande (`chargerJournalComplet`, via `useJournalComplet`).
 */
export async function chargerJournal<T extends object>(
    db: Firestore,
    recents: number,
): Promise<{ docs: Array<T & { id: string }>; complet: boolean }> {
    const enCache = await lireDepuisCache<T>(db, 'events');
    if (enCache) return { docs: enCache, complet: true };

    const journal = collection(db, 'events');
    const [derniers, campagnes] = await Promise.all([
        getDocs(query(journal, orderBy('timestamp', 'desc'), limit(recents))).then(duServeur),
        getDocs(
            query(
                journal,
                where('metadata.source', '>=', PREFIXE_CAMPAGNE),
                /* « ` » suit « _ » : la borne ferme le préfixe. */
                where('metadata.source', '<', 'audit`'),
            ),
        ).then(duServeur),
    ]);
    const parId = new Map<string, DocumentData>();
    for (const document of [...derniers.docs, ...campagnes.docs]) {
        const { donnees } = retirerMaj(document.data());
        if (!estSupprime(donnees)) parId.set(document.id, donnees);
    }
    return { docs: enDocuments<T>([...parId].sort(parIdentifiant)), complet: false };
}

/** Le journal entier, au serveur ; il entre alors dans le cache. */
export const chargerJournalComplet = <T extends object>(db: Firestore) =>
    lireEnEntier<T>(db, 'events');

/**
 * **Les écritures, suivies une à une** (27/09). Elles partaient sans que personne n'attende
 * leur issue : l'empreinte les tenait pour faites, un refus ne se voyait qu'en console, et le
 * geste disparaissait au rechargement suivant. Chaque écriture est désormais comptée tant
 * qu'elle n'est pas confirmée — le SDK la retente seul quand le réseau ou le quota manquent,
 * et la garde dans le navigateur d'une ouverture à l'autre (voir `lib/firebase.ts`) — et un
 * refus définitif est compté à part. `ecouterEcritures` permet de le dire à l'écran.
 */
export interface EtatDesEcritures {
    /** Les écritures envoyées et pas encore confirmées par la base. */
    enAttente: number;
    /** Les écritures refusées pour de bon depuis l'ouverture (droits, document invalide…). */
    refus: number;
}

const etatDesEcritures: EtatDesEcritures = { enAttente: 0, refus: 0 };
const abonnes = new Set<(etat: EtatDesEcritures) => void>();
const publier = () => abonnes.forEach((abonne) => abonne({ ...etatDesEcritures }));

export const ecouterEcritures = (abonne: (etat: EtatDesEcritures) => void): (() => void) => {
    abonnes.add(abonne);
    abonne({ ...etatDesEcritures });
    return () => {
        abonnes.delete(abonne);
    };
};

/**
 * Compte une écriture jusqu'à son issue ; ne rejette jamais. Elle reçoit l'écriture **à
 * lancer** : le SDK valide les données à l'appel, et une valeur qu'il refuse lève tout de
 * suite — ce refus-là doit être compté comme les autres, pas échapper au suivi.
 */
export const suivreEcriture = async (
    quoi: string,
    ecrire: () => Promise<unknown>,
): Promise<void> => {
    etatDesEcritures.enAttente += 1;
    publier();
    try {
        await ecrire();
    } catch (erreur) {
        etatDesEcritures.refus += 1;
        console.error(`[firestore] écriture refusée : ${quoi}`, erreur);
    } finally {
        etatDesEcritures.enAttente -= 1;
        publier();
    }
};

/** Supprime des documents en posant leur pierre tombale (voir `CHAMP_SUPPRIME`). */
export async function supprimerDocuments(
    db: Firestore,
    nom: string,
    ids: readonly string[],
): Promise<void> {
    await Promise.all(
        ids
            .filter((id) => id.length > 0)
            .map((id) =>
                suivreEcriture(`${nom}/${id}`, () =>
                    setDoc(doc(db, nom, id), {
                        [CHAMP_SUPPRIME]: true,
                        [CHAMP_MAJ]: serverTimestamp(),
                    }),
                ),
            ),
    );
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

    /*
     * **Le document entier, sans fusion** (27/09). Avec `merge: true`, un champ vidé dans
     * l'application (`repair: undefined` à la clôture d'une réparation, `reservedFor` à la
     * libération d'un objet) disparaissait de l'écriture et gardait donc son ancienne valeur
     * en base : au rechargement, la réparation close revenait. L'état de l'application porte
     * le document complet — lu tel quel, normalisé sans rien retirer —, il s'écrit tel quel.
     */
    await Promise.all(
        nommables.map(({ id, item }) =>
            suivreEcriture(`${collectionName}/${id}`, () =>
                setDoc(doc(db, collectionName, id), {
                    ...(stripUndefined(item) as Record<string, unknown>),
                    [CHAMP_MAJ]: serverTimestamp(),
                }),
            ),
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

export async function saveSingleDoc<T extends object>(
    db: Firestore,
    collectionName: string,
    documentId: string,
    data: T,
): Promise<void> {
    /* Sans fusion, comme les collections : un pays, un site ou un responsable de service
       retiré de l'objet l'est aussi du document — avec `merge: true`, un site supprimé
       revenait au rechargement, et un site renommé y figurait sous ses deux noms. */
    await suivreEcriture(`${collectionName}/${documentId}`, () =>
        setDoc(doc(db, collectionName, documentId), {
            ...(stripUndefined(data) as Record<string, unknown>),
            [CHAMP_MAJ]: serverTimestamp(),
        }),
    );
}
