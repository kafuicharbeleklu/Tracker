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
        apiKey: VITE_FIREBASE_API_KEY?.trim() || '',
        authDomain: VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
        projectId: VITE_FIREBASE_PROJECT_ID?.trim() || '',
        storageBucket: VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
        messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
        appId: VITE_FIREBASE_APP_ID?.trim() || '',
        measurementId: VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
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

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured()
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
