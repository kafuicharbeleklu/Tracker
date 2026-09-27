/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
    /** `true` : Firestore coupé, jeu de démonstration (voir `src/lib/firebase.ts`). */
    readonly VITE_FIREBASE_DISABLED?: string;
    /** `true` : en développement, se brancher quand même sur le projet configuré. */
    readonly VITE_FIREBASE_EN_DEV?: string;
    /** `hôte:port` d'un émulateur Firestore local, en développement. */
    readonly VITE_FIRESTORE_EMULATEUR?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
