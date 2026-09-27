import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import {
    connectFirestoreEmulator,
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    type Firestore,
} from 'firebase/firestore';

type FirebaseEnv = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
};

function readFirebaseEnv(): FirebaseEnv {
    const {
        VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID,
        VITE_FIREBASE_MEASUREMENT_ID,
    } = import.meta.env;

    return {
        apiKey: VITE_FIREBASE_API_KEY?.trim() || 'AIzaSyB-iGbWTZnvEQXYdjbVwY2l4cg6Vi2fMbU',
        authDomain: VITE_FIREBASE_AUTH_DOMAIN?.trim() || 'tracker-c801e.firebaseapp.com',
        projectId: VITE_FIREBASE_PROJECT_ID?.trim() || 'tracker-c801e',
        storageBucket: VITE_FIREBASE_STORAGE_BUCKET?.trim() || 'tracker-c801e.firebasestorage.app',
        messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '645261169143',
        appId: VITE_FIREBASE_APP_ID?.trim() || '1:645261169143:web:43e9532eb299d6c4d15ef2',
        measurementId: VITE_FIREBASE_MEASUREMENT_ID?.trim() || 'G-7N6C0ME6HN',
    };
}

export const firebaseConfig = readFirebaseEnv();

export function isFirebaseConfigured(): boolean {
    return Boolean(
        firebaseConfig.apiKey &&
            firebaseConfig.authDomain &&
            firebaseConfig.projectId &&
            firebaseConfig.storageBucket &&
            firebaseConfig.messagingSenderId &&
            firebaseConfig.appId,
    );
}

/**
 * **Couper Firestore** (26/09) — `VITE_FIREBASE_DISABLED=true`. Sans lui, faute de variables,
 * l'application se branche sur le projet de production : un essai en local, ou la régression
 * visuelle de la CI, lisait et pouvait écrire les données réelles du parc. Coupé, `firestore`
 * vaut `null` et les contextes de données retombent sur le jeu de démonstration, le même à
 * chaque chargement.
 */
/**
 * **Un émulateur local**, en développement (27/09) — `VITE_FIRESTORE_EMULATEUR=127.0.0.1:8085`.
 * Les lectures et les écritures y sont gratuites et n'atteignent jamais la base réelle.
 */
export const FIRESTORE_EMULATEUR = import.meta.env.DEV
    ? import.meta.env.VITE_FIRESTORE_EMULATEUR?.trim() || null
    : null;

/**
 * **En développement, la base de production est coupée par défaut** (27/09). Chaque
 * chargement lit toute la base ; le serveur de développement recharge la page à chaque
 * modification, React en mode strict double la lecture, et chaque navigateur de test repart
 * de zéro. Le quota gratuit (50 000 lectures par jour) partait ainsi dans les outils, pas
 * dans l'usage : les erreurs « quota dépassé » des 06, 09 et 22/09 sont nées de sessions de
 * capture. Pour travailler quand même sur la base réelle : `VITE_FIREBASE_EN_DEV=true`.
 */
export const FIREBASE_DISABLED =
    import.meta.env.VITE_FIREBASE_DISABLED === 'true' ||
    (import.meta.env.DEV &&
        !FIRESTORE_EMULATEUR &&
        import.meta.env.VITE_FIREBASE_EN_DEV !== 'true');

export const firebaseApp: FirebaseApp | null = !FIREBASE_DISABLED && isFirebaseConfigured()
    ? getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig)
    : null;

/**
 * **Les écritures survivent à la page** (27/09). Le cache persistant du SDK garde dans le
 * navigateur la file des écritures non confirmées : un onglet rechargé ou fermé pendant une
 * coupure — réseau, quota épuisé — les renvoie à sa prochaine ouverture au lieu de les perdre.
 * Plusieurs onglets partagent la même file. Déjà initialisé (rechargement à chaud du module),
 * on reprend l'instance existante.
 */
const ouvrir = (app: FirebaseApp): Firestore => {
    try {
        return initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
    } catch {
        return getFirestore(app);
    }
};

const brancher = (app: FirebaseApp): Firestore => {
    const db = ouvrir(app);
    if (FIRESTORE_EMULATEUR) {
        const [hote, port] = FIRESTORE_EMULATEUR.split(':');
        try {
            connectFirestoreEmulator(db, hote, Number(port) || 8085);
        } catch {
            /* Déjà branchée : l'instance reprise après un rechargement à chaud. */
        }
    }
    return db;
};

export const firestore: Firestore | null = firebaseApp ? brancher(firebaseApp) : null;

let analyticsInstance: Analytics | null = null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
    if (!firebaseApp || !firebaseConfig.measurementId) {
        return null;
    }

    if (analyticsInstance) {
        return analyticsInstance;
    }

    if (!(await isSupported())) {
        return null;
    }

    analyticsInstance = getAnalytics(firebaseApp);
    return analyticsInstance;
}
