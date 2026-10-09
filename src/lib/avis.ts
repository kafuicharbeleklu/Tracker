/**
 * **Avertir sans qu'on regarde** (08/10) — le son, la vibration, la notification système et la
 * pastille de l'icône, pour une tâche qui arrive d'un autre appareil.
 *
 * Testé entre deux téléphones : une affectation faite par l'informatique n'arrivait chez le
 * destinataire qu'en rechargeant, sans un bruit. L'écoute en temps réel (`ecouterCollection`)
 * apporte la tâche ; ce module la signale.
 *
 * **Ce que le navigateur permet, et pas plus.** Tant que l'application est ouverte — au
 * premier plan, ou depuis peu en arrière-plan —, tout fonctionne. Application fermée ou
 * téléphone en veille depuis longtemps, le navigateur l'endort : rien n'arrive avant qu'on la
 * rouvre, où la tâche attend. Réveiller un téléphone endormi demande un envoi depuis un
 * serveur (Web Push), que le projet n'a pas.
 */

const BASE = import.meta.env.BASE_URL;

let enregistrement: Promise<ServiceWorkerRegistration | null> | null = null;

/** Le service worker des notifications — enregistré une fois, au démarrage. */
export const enregistrerLeServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
    if (enregistrement) return enregistrement;
    enregistrement =
        typeof navigator !== 'undefined' && 'serviceWorker' in navigator
            ? navigator.serviceWorker
                  .register(`${BASE}sw.js`, { scope: BASE })
                  .catch((erreur: unknown) => {
                      console.warn('[avis] service worker non enregistré', erreur);
                      return null;
                  })
            : Promise.resolve(null);

    /* Toucher une notification : le service worker demande d'ouvrir la tâche. */
    navigator.serviceWorker?.addEventListener('message', (evenement: MessageEvent) => {
        const donnees = evenement.data as { type?: string; adresse?: string } | undefined;
        if (donnees?.type === 'tracker:ouvrir' && donnees.adresse) {
            window.location.hash = donnees.adresse;
        }
    });
    return enregistrement;
};

/* ------------------------------------------------------------------- le son */

let audio: AudioContext | null = null;

/**
 * **Le son se déverrouille au premier geste.** Un navigateur refuse de jouer un son qu'aucun
 * geste n'a précédé ; le contexte audio se crée donc au premier toucher, et sert ensuite.
 */
const deverrouillerLeSon = () => {
    if (audio || typeof window === 'undefined') return;
    const Contexte =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexte) return;
    audio = new Contexte();
    void audio.resume();
};
if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', deverrouillerLeSon, { once: true, capture: true });
    window.addEventListener('keydown', deverrouillerLeSon, { once: true, capture: true });
}

/** Deux notes brèves, montantes — reconnaissables sans être une alarme. */
export const sonner = () => {
    if (!audio || audio.state === 'closed') return;
    void audio.resume();
    const debut = audio.currentTime + 0.02;
    [
        { frequence: 880, a: 0 },
        { frequence: 1320, a: 0.14 },
    ].forEach(({ frequence, a }) => {
        if (!audio) return;
        const oscillateur = audio.createOscillator();
        const volume = audio.createGain();
        oscillateur.type = 'sine';
        oscillateur.frequency.value = frequence;
        volume.gain.setValueAtTime(0.0001, debut + a);
        volume.gain.exponentialRampToValueAtTime(0.18, debut + a + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, debut + a + 0.32);
        oscillateur.connect(volume).connect(audio.destination);
        oscillateur.start(debut + a);
        oscillateur.stop(debut + a + 0.34);
    });
};

/** Android seulement : iOS n'expose pas la vibration aux pages. */
export const vibrer = () => {
    try {
        navigator.vibrate?.([120, 70, 120]);
    } catch {
        /* Sans geste préalable, le navigateur refuse : rien à dire. */
    }
};

/* ------------------------------------------------ la notification système */

export const notificationsPossibles = (): boolean =>
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export const permissionDesNotifications = (): NotificationPermission | 'indisponible' =>
    notificationsPossibles() ? Notification.permission : 'indisponible';

/** La demande d'autorisation — toujours depuis un geste : sans lui, le navigateur l'ignore. */
export const demanderLesNotifications = async (): Promise<
    NotificationPermission | 'indisponible'
> => {
    if (!notificationsPossibles()) return 'indisponible';
    return Notification.requestPermission();
};

/**
 * La notification du système — quand l'application n'est pas sous les yeux. Au premier plan,
 * le bandeau de l'application suffit : une notification en plus ferait doublon.
 */
export const notifierLeSysteme = async (avis: {
    titre: string;
    corps: string;
    /** L'adresse à ouvrir au toucher, sans le `#`. */
    adresse: string;
    /** Deux avis de même étiquette se remplacent au lieu de s'empiler. */
    etiquette: string;
}) => {
    if (permissionDesNotifications() !== 'granted') return;
    const inscription = await enregistrerLeServiceWorker();
    if (!inscription) return;
    await inscription.showNotification(avis.titre, {
        body: avis.corps,
        tag: avis.etiquette,
        icon: `${BASE}icon.svg`,
        badge: `${BASE}icon.svg`,
        data: { adresse: avis.adresse },
    });
};

/** La pastille de l'icône de l'application installée (Android, iOS 16.4+, bureau). */
export const pastilleDeLApplication = (nombre: number) => {
    const nav = navigator as Navigator & {
        setAppBadge?: (n?: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
    };
    try {
        if (nombre > 0) void nav.setAppBadge?.(nombre);
        else void nav.clearAppBadge?.();
    } catch {
        /* Non installée, ou navigateur qui ne la connaît pas. */
    }
};
