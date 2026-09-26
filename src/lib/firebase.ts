import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';

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
export const FIREBASE_DISABLED = import.meta.env.VITE_FIREBASE_DISABLED === 'true';

export const firebaseApp: FirebaseApp | null = !FIREBASE_DISABLED && isFirebaseConfigured()
    ? getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig)
    : null;

export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

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
