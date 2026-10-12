/**
 * **Du serveur de collecte à l'application, par Firestore.**
 *
 * L'application est une page statique : elle ne peut pas joindre un serveur du réseau local
 * depuis son adresse publique. Le serveur écrit donc là où elle lit déjà.
 *
 * - `detectedDevices/<machine>` : une machine remontée. L'application l'écoute, la rapproche
 *   du parc et l'envoie dans Tâches. Le serveur n'écrit que **les faits** : le statut, le
 *   rapprochement et la décision de l'informatique restent à l'application.
 * - `meta/settings`, lu : « Source active » éteinte dans les réglages, le serveur refuse les
 *   remontées de l'agent.
 * - `meta/collecte`, écrit : l'état du serveur, que l'écran des sources affiche.
 *
 * Une machine ne s'écrit que si elle est nouvelle, si ses faits ont changé, ou une fois par
 * jour pour dater sa dernière remontée : le forfait gratuit de Firestore compte les
 * écritures.
 */
import { readFile } from 'node:fs/promises';

const DEJA_LA = 6;
const QUOTA = 8;

/** Sans valeur vide : une fusion ne doit pas effacer un fait par un silence. */
const sansVide = (objet) =>
    Object.fromEntries(
        Object.entries(objet).filter(([, valeur]) => valeur !== '' && valeur !== undefined),
    );

/** La machine du registre, dans la forme que l'application range (`DetectedDevice`). */
export const enMachineDetectee = (machine) => {
    const faits = machine.faits;
    return sansVide({
        id: machine.id,
        source: machine.source,
        fingerprint: machine.id,
        machineName: faits.machineName || faits.hostname || faits.assetId || 'Machine détectée',
        hostname: faits.hostname,
        assetId: faits.assetId,
        serialNumber: faits.serialNumber,
        biosUuid: faits.biosUuid,
        os: faits.os,
        ram: faits.ram,
        storage: faits.storage,
        cpu: faits.cpu,
        type: faits.type,
        model: faits.model,
        currentUserName: faits.userName,
        currentUserEmail: faits.userEmail,
        macAddress: faits.macAddress,
        ipAddress: faits.ipAddress,
        domain: faits.domain,
        country: faits.country,
        site: faits.site,
        service: faits.service,
        apps: machine.agents ? { ...machine.agents } : undefined,
        lastSeenAt: machine.derniereRemontee,
    });
};

export const ouvrirFirestore = async ({
    registre,
    version,
    projet = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '',
    identifiants = process.env.FIREBASE_ADMIN_CREDENTIALS ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        '',
    emulateur = process.env.FIRESTORE_EMULATOR_HOST || '',
    rafraichirApresMs = Number(process.env.AGENT_PUSH_REFRESH_HOURS || 24) * 3600 * 1000,
    etatToutesLesMs = 30 * 60 * 1000,
    etatApresPousseeMs = 15 * 60 * 1000,
    delaiDePousseeMs = 800,
    journaliser = console,
} = {}) => {
    const { cert, initializeApp, deleteApp } = await import('firebase-admin/app');
    const { FieldValue, getFirestore } = await import('firebase-admin/firestore');

    let options;
    if (emulateur) {
        options = { projectId: projet || 'tracker-c801e' };
    } else if (identifiants) {
        const compte = JSON.parse(await readFile(identifiants, 'utf8'));
        options = { credential: cert(compte), projectId: projet || compte.project_id };
    } else {
        throw new Error(
            'Firestore demandé sans identifiants : posez FIREBASE_ADMIN_CREDENTIALS (compte de service) ou FIRESTORE_EMULATOR_HOST.',
        );
    }

    const application = initializeApp(options, `collecte-${Date.now()}`);
    const base = getFirestore(application);
    const maj = () => FieldValue.serverTimestamp();

    /** `null` tant que les réglages n'ont pas été lus : dans le doute, on reçoit. */
    let reglages = null;
    let enAttente = 0;
    let recul = 0;
    let pousseeProgrammee = null;
    let pousseeEnCours = null;
    let etatEcritLe = 0;
    let premierePoussee = true;
    let ferme = false;

    const arreterLEcoute = base.doc('meta/settings').onSnapshot(
        (instantane) => {
            reglages = instantane.exists ? instantane.data() : {};
        },
        (erreur) => journaliser.warn('[collecte] réglages non suivis :', erreur.message),
    );
    /* La première lecture, attendue : sans elle, les premières remontées passeraient alors
       que la source est éteinte. Firestore muet, on démarre quand même. */
    try {
        const lu = await Promise.race([
            base.doc('meta/settings').get(),
            new Promise((_, refuser) => {
                const garde = setTimeout(() => refuser(new Error('délai dépassé')), 8000);
                garde.unref?.();
            }),
        ]);
        reglages = lu.exists ? lu.data() : {};
    } catch (erreur) {
        journaliser.warn('[collecte] réglages illisibles au démarrage :', erreur.message);
    }

    const pousserUne = async (machine) => {
        const empreinte = machine.empreinte;
        const document = base.collection('detectedDevices').doc(machine.id);
        const faits = enMachineDetectee(machine);
        if (!machine.pousseeLe) {
            try {
                await document.create({
                    apps: { sentinelOne: false, matrix42: false, manageEngine: false },
                    ...faits,
                    status: 'pending_review',
                    firstSeenAt: machine.premiereRemontee,
                    _maj: maj(),
                });
                registre.marquerPoussee(machine.id, empreinte);
                return;
            } catch (erreur) {
                if (erreur.code !== DEJA_LA) throw erreur;
                /* Le document existe (registre perdu puis reconstruit, ou machine déposée
                   à la main dans l'application) : on le complète sans rien lui retirer. */
            }
        }
        await document.set({ ...faits, _maj: maj() }, { merge: true });
        registre.marquerPoussee(machine.id, empreinte);
    };

    const ecrireLEtat = async () => {
        const etat = registre.etat();
        etatEcritLe = Date.now();
        await base.doc('meta/collecte').set({
            vuLe: new Date().toISOString(),
            version,
            machines: etat.machines,
            derniereRemontee: etat.derniereRemontee,
            enAttente,
            _maj: maj(),
        });
    };

    const vider = async () => {
        if (ferme) return;
        const liste = registre.aPousser({ rafraichirApresMs });
        enAttente = liste.length;
        let echec = null;
        for (const machine of liste) {
            try {
                await pousserUne(machine);
                enAttente -= 1;
            } catch (erreur) {
                echec = erreur;
                break;
            }
        }
        if (echec) {
            /* Quota épuisé : inutile d'insister avant une heure. Sinon, de 30 s à 1 h. */
            recul =
                echec.code === QUOTA ? 3600_000 : Math.min(Math.max(recul * 2, 30_000), 3600_000);
            journaliser.warn(
                `[collecte] Firestore refuse (${echec.code ?? '?'} ${echec.message}) : ${enAttente} machine(s) en attente, nouvel essai dans ${Math.round(recul / 1000)} s.`,
            );
            programmer(recul);
            return;
        }
        recul = 0;
        /* Des machines viennent de partir : l'état suit, sans attendre le battement, mais
           pas plus d'une fois par quart d'heure. La première poussée après le démarrage
           l'écrit aussitôt : l'écran ne reste pas sur « 0 machine ». */
        const delai =
            liste.length > 0 ? (premierePoussee ? 0 : etatApresPousseeMs) : etatToutesLesMs;
        if (liste.length > 0) premierePoussee = false;
        if (Date.now() - etatEcritLe >= delai) {
            await ecrireLEtat().catch((erreur) =>
                journaliser.warn('[collecte] état non écrit :', erreur.message),
            );
        }
    };

    const programmer = (delai = delaiDePousseeMs) => {
        if (ferme || pousseeProgrammee) return;
        pousseeProgrammee = setTimeout(() => {
            pousseeProgrammee = null;
            pousseeEnCours = (pousseeEnCours ?? Promise.resolve()).then(vider).catch((erreur) => {
                journaliser.warn('[collecte] poussée interrompue :', erreur.message);
            });
        }, delai);
        pousseeProgrammee.unref?.();
    };

    /* Le serveur se signale à son démarrage puis toutes les demi-heures, même sans remontée :
       l'écran des sources distingue ainsi un serveur muet d'un parc silencieux. */
    const battement = setInterval(() => {
        ecrireLEtat().catch((erreur) =>
            journaliser.warn('[collecte] état non écrit :', erreur.message),
        );
    }, etatToutesLesMs);
    battement.unref?.();
    await ecrireLEtat().catch((erreur) =>
        journaliser.warn('[collecte] état non écrit au démarrage :', erreur.message),
    );
    programmer();

    return {
        /**
         * La source est-elle allumée dans les réglages de l'application ? Seul l'agent a un
         * interrupteur ; un export d'annuaire ou de scan est un geste, qui vaut activation.
         */
        sourceActive(source) {
            if (source !== 'agent' || reglages === null) return true;
            return reglages.autoCollectionAgentEnabled === true;
        },

        /** Il y a du nouveau dans le registre : pousser sous peu, d'un seul élan. */
        signaler: () => programmer(),

        /** Pousser maintenant et attendre : à l'arrêt, et dans les tests. */
        async pousserMaintenant() {
            if (pousseeProgrammee) {
                clearTimeout(pousseeProgrammee);
                pousseeProgrammee = null;
            }
            pousseeEnCours = (pousseeEnCours ?? Promise.resolve()).then(vider);
            await pousseeEnCours;
        },

        etat: () => ({ projet: options.projectId, emulateur: Boolean(emulateur), enAttente }),

        async fermer() {
            if (pousseeProgrammee) clearTimeout(pousseeProgrammee);
            pousseeProgrammee = null;
            clearInterval(battement);
            await (pousseeEnCours ?? Promise.resolve()).catch(() => {});
            ferme = true;
            arreterLEcoute();
            await deleteApp(application).catch(() => {});
        },
    };
};
