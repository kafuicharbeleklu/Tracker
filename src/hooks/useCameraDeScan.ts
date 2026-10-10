import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { codesDuTexte } from '../lib/lectureDeCode';

/**
 * **La caméra du scan** (09/10) — elle lit enfin.
 *
 * Le viseur (17.3) était un cadre posé sur une surface sombre : « il ne décode rien », et la
 * seule lecture possible était la saisie au clavier. Ce crochet ouvre la caméra arrière et
 * lit de deux façons :
 *
 * - **en continu**, par le décodeur du navigateur (`BarcodeDetector` — Chrome sous Android) :
 *   code-barres et QR, sans geste ;
 * - **en photo**, par la lecture du texte de l'étiquette (Tesseract, déjà au projet pour les
 *   factures) : là où le décodeur manque (iPhone), et pour les étiquettes qui ne portent
 *   que des lettres. Le geste est explicite — « Lire l'étiquette » —, la lecture prend
 *   quelques secondes.
 *
 * Rien ne s'accepte sans être écrit en clair (N2) : ce crochet rend des codes, la vue les
 * montre, la personne tranche.
 */

export type EtatCamera = 'inactive' | 'demande' | 'active' | 'refusee' | 'indisponible';

/** Les formats d'étiquettes du parc, dans l'ordre où on les rencontre. */
const FORMATS = [
    'qr_code',
    'code_128',
    'code_39',
    'data_matrix',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
    'code_93',
    'itf',
    'codabar',
    'pdf417',
    'aztec',
];

/** Un point de l'image, en pixels de la vidéo. */
interface Point {
    x: number;
    y: number;
}
/** Où un code a été vu, en pixels de la vidéo. */
interface Zone {
    x: number;
    y: number;
    l: number;
    h: number;
}
interface CodeDetecte {
    rawValue: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    cornerPoints?: Point[];
}
/** Où le cadre se pose à l'écran pour entourer le code vu — relatif au cadre de repos. */
export interface Visee {
    left: number;
    top: number;
    width: number;
    height: number;
}
interface Detecteur {
    detect: (source: HTMLVideoElement) => Promise<CodeDetecte[]>;
}
interface ConstructeurDeDetecteur {
    new (options: { formats: string[] }): Detecteur;
    getSupportedFormats?: () => Promise<string[]>;
}

/** Ce que le crochet emploie de `jsqr` — le décodeur de QR, là où le navigateur n'en a pas. */
type LecteurDeQr = (
    donnees: Uint8ClampedArray,
    largeur: number,
    hauteur: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' },
) => {
    data: string;
    location: {
        topLeftCorner: Point;
        topRightCorner: Point;
        bottomRightCorner: Point;
        bottomLeftCorner: Point;
    };
} | null;

/** Ce que le crochet emploie du lecteur de Tesseract. */
interface LecteurDeTexte {
    recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
    terminate: () => Promise<unknown>;
}

const constructeur = (): ConstructeurDeDetecteur | undefined =>
    typeof window === 'undefined'
        ? undefined
        : (window as unknown as { BarcodeDetector?: ConstructeurDeDetecteur }).BarcodeDetector;

/**
 * **Ce que le cadre vise, dans l'image de la caméra.** La vidéo couvre l'écran
 * (`object-cover`) : elle est agrandie et rognée, et le cadre n'est pas au centre en mode
 * lot. On ramène donc le rectangle du cadre — élargi d'un quart, la main tremble — aux
 * pixels de la vidéo. Sans cadre : la bande centrale.
 */
const zoneVisee = (video: HTMLVideoElement, cadre: HTMLElement | null) => {
    const l = video.videoWidth;
    const h = video.videoHeight;
    if (!cadre) return { sx: l * 0.1, sy: h * 0.3, sl: l * 0.8, sh: h * 0.4 };
    const rv = video.getBoundingClientRect();
    const rc = cadre.getBoundingClientRect();
    const agrandissement = Math.max(rv.width / l, rv.height / h);
    const dx = (rv.width - l * agrandissement) / 2;
    const dy = (rv.height - h * agrandissement) / 2;
    const marge = 0.25;
    const x0 = (rc.left - rv.left - rc.width * marge - dx) / agrandissement;
    const y0 = (rc.top - rv.top - rc.height * marge - dy) / agrandissement;
    const x1 = (rc.right - rv.left + rc.width * marge - dx) / agrandissement;
    const y1 = (rc.bottom - rv.top + rc.height * marge - dy) / agrandissement;
    const sx = Math.max(0, x0);
    const sy = Math.max(0, y0);
    return { sx, sy, sl: Math.min(l, x1) - sx, sh: Math.min(h, y1) - sy };
};

/** La zone qui contient tous les coins d'un code. */
const zoneDesCoins = (coins: Point[], echelle = 1): Zone | null => {
    if (coins.length === 0) return null;
    const xs = coins.map((c) => c.x * echelle);
    const ys = coins.map((c) => c.y * echelle);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, l: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

/**
 * L'air laissé autour du code quand le cadre se resserre sur lui. Le décodeur de QR estime
 * le quatrième coin : à 18, le cadre contient encore le code quand cette estimation dérive
 * d'un module.
 */
const AIR_AUTOUR_DU_CODE = 18;
/** Le cadre ne se resserre pas en deçà : ses quatre coins doivent rester lisibles. */
const COTE_MIN_DU_CADRE = 88;
/** Sans code vu pendant ce temps, le cadre revient à sa place de repos. */
const RETOUR_DU_CADRE_MS = 700;

/**
 * **Le cadre se pose sur le code vu** (10/10). Ramène la zone d'un code, en pixels de la
 * vidéo, à l'écran — la vidéo couvre l'écran, agrandie et rognée — puis au cadre de repos,
 * dont le cadre mobile est l'enfant.
 */
const versLeCadre = (zone: Zone, video: HTMLVideoElement, cadre: HTMLElement): Visee => {
    const rv = video.getBoundingClientRect();
    const rc = cadre.getBoundingClientRect();
    const agrandissement = Math.max(rv.width / video.videoWidth, rv.height / video.videoHeight);
    const dx = (rv.width - video.videoWidth * agrandissement) / 2;
    const dy = (rv.height - video.videoHeight * agrandissement) / 2;
    const largeur = Math.max(COTE_MIN_DU_CADRE, zone.l * agrandissement + 2 * AIR_AUTOUR_DU_CODE);
    const hauteur = Math.max(COTE_MIN_DU_CADRE, zone.h * agrandissement + 2 * AIR_AUTOUR_DU_CODE);
    const centreX = rv.left + dx + (zone.x + zone.l / 2) * agrandissement;
    const centreY = rv.top + dy + (zone.y + zone.h / 2) * agrandissement;
    return {
        left: Math.round(centreX - largeur / 2 - rc.left),
        top: Math.round(centreY - hauteur / 2 - rc.top),
        width: Math.round(largeur),
        height: Math.round(hauteur),
    };
};

/** Le plus grand côté de l'image donnée au décodeur de QR : au-delà, il ralentit sans mieux lire. */
const COTE_DE_LECTURE_QR = 720;

/** Un même code qui reste dans le cadre ne compte qu'une fois : il doit en sortir deux secondes. */
const ABSENCE_AVANT_RELECTURE_MS = 2_000;

interface Options {
    /** Faux : pas de caméra (un emploi qui fournit son propre `preview`). */
    actif: boolean;
    /** Le cadre de visée : la lecture en photo ne lit que ce qu'il montre, et un peu autour. */
    cadreRef?: RefObject<HTMLElement | null>;
    /** Vrai : la caméra reste ouverte, rien ne se lit — une lecture attend son verdict. */
    enPause?: boolean;
    onCode: (code: string) => void;
    /**
     * Parmi les codes lus en photo, celui que le parc connaît passe devant — rendu tel que
     * le parc l'écrit.
     */
    reconnaitre?: (code: string) => string | undefined;
}

export const useCameraDeScan = ({
    actif,
    cadreRef,
    enPause = false,
    onCode,
    reconnaitre,
}: Options) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fluxRef = useRef<MediaStream | null>(null);
    const [etat, setEtat] = useState<EtatCamera>(() =>
        !actif
            ? 'inactive'
            : typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia
              ? 'demande'
              : 'indisponible',
    );
    /**
     * Le décodeur continu : `natif` (celui du navigateur, tous les codes), `qr` (le nôtre, là
     * où le navigateur n'en a pas — les QR seulement), ou `photo` : rien ne se lit seul.
     */
    const [decodeur, setDecodeur] = useState<'natif' | 'qr' | 'photo'>(() =>
        constructeur() ? 'natif' : 'qr',
    );
    /** Où le cadre se pose : sur le code vu, sinon nulle part — il reste à sa place. */
    const [visee, setVisee] = useState<Visee | null>(null);
    const [lampe, setLampe] = useState({ possible: false, allumee: false });
    const [photo, setPhoto] = useState<'repos' | 'lecture' | 'rien'>('repos');

    /* Les rappels changent à chaque rendu ; la boucle de lecture lit toujours les derniers. */
    const onCodeRef = useRef(onCode);
    const reconnaitreRef = useRef(reconnaitre);
    const pauseRef = useRef(enPause);
    useEffect(() => {
        onCodeRef.current = onCode;
        reconnaitreRef.current = reconnaitre;
        pauseRef.current = enPause;
    });

    /** Le lecteur de texte, chargé à la première lecture en photo, refermé avec le viseur. */
    const lecteurRef = useRef<Promise<LecteurDeTexte> | null>(null);
    useEffect(
        () => () => {
            void lecteurRef.current?.then((lecteur) => lecteur.terminate()).catch(() => undefined);
            lecteurRef.current = null;
        },
        [],
    );

    const dernier = useRef<{ code: string; vu: number } | null>(null);
    const signaler = useCallback((code: string) => {
        const maintenant = Date.now();
        const precedent = dernier.current;
        dernier.current = { code, vu: maintenant };
        if (
            precedent &&
            precedent.code === code &&
            maintenant - precedent.vu < ABSENCE_AVANT_RELECTURE_MS
        )
            return;
        onCodeRef.current(code);
    }, []);

    /* Ouvrir la caméra arrière ; la refermer en partant — la lampe s'éteint avec. */
    useEffect(() => {
        if (!actif || !navigator.mediaDevices?.getUserMedia) return;
        let parti = false;
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            })
            .then((flux) => {
                if (parti) {
                    flux.getTracks().forEach((piste) => piste.stop());
                    return;
                }
                fluxRef.current = flux;
                const video = videoRef.current;
                if (video) {
                    video.srcObject = flux;
                    void video.play().catch(() => undefined);
                }
                const piste = flux.getVideoTracks()[0];
                const capacites = piste?.getCapabilities?.() as
                    (MediaTrackCapabilities & { torch?: boolean }) | undefined;
                setLampe({ possible: Boolean(capacites?.torch), allumee: false });
                setEtat('active');
            })
            .catch((erreur: unknown) => {
                if (parti) return;
                const nom = (erreur as { name?: string })?.name;
                setEtat(
                    nom === 'NotAllowedError' || nom === 'SecurityError'
                        ? 'refusee'
                        : 'indisponible',
                );
            });
        return () => {
            parti = true;
            fluxRef.current?.getTracks().forEach((piste) => piste.stop());
            fluxRef.current = null;
        };
    }, [actif]);

    /*
     * La lecture continue : cinq à six regards par seconde, tant que la caméra tourne.
     *
     * **Toute l'image est lue, pas le seul cadre**, et **un QR se lit partout** (10/10). Le
     * décodeur du navigateur n'existe ni sur iPhone ni sur Firefox : là, seule la lecture de
     * l'étiquette en photo restait — du texte —, et un QR ne se lisait jamais. Un décodeur
     * de QR prend le relais (`jsqr`, chargé à l'ouverture du viseur). Quand un code est vu,
     * le cadre vient l'entourer : on voit ce que l'appareil a lu.
     */
    useEffect(() => {
        if (etat !== 'active') return;
        let fini = false;
        let minuterie: number | undefined;
        let dernierCodeVu = 0;
        void (async () => {
            let detecteur: Detecteur | null = null;
            const Constructeur = constructeur();
            if (Constructeur) {
                const offerts = (await Constructeur.getSupportedFormats?.().catch(() => [])) ?? [];
                const formats = FORMATS.filter((f) => offerts.includes(f));
                if (formats.length > 0) detecteur = new Constructeur({ formats });
            }
            let lireUnQr: LecteurDeQr | null = null;
            if (!detecteur) {
                try {
                    const module = (await import('jsqr')) as unknown as {
                        default: LecteurDeQr | { default: LecteurDeQr };
                    };
                    lireUnQr =
                        typeof module.default === 'function'
                            ? module.default
                            : module.default.default;
                } catch {
                    lireUnQr = null;
                }
            }
            if (fini) return;
            setDecodeur(detecteur ? 'natif' : lireUnQr ? 'qr' : 'photo');
            if (!detecteur && !lireUnQr) return;

            const toile = document.createElement('canvas');
            const trait = toile.getContext('2d', { willReadFrequently: true });
            const lire = async (
                video: HTMLVideoElement,
            ): Promise<{ code: string; zone: Zone | null } | null> => {
                if (detecteur) {
                    const codes = await detecteur.detect(video);
                    const lu = codes.find((c) => c.rawValue?.trim());
                    if (!lu) return null;
                    return {
                        code: lu.rawValue.trim(),
                        zone: lu.cornerPoints?.length
                            ? zoneDesCoins(lu.cornerPoints)
                            : lu.boundingBox
                              ? {
                                    x: lu.boundingBox.x,
                                    y: lu.boundingBox.y,
                                    l: lu.boundingBox.width,
                                    h: lu.boundingBox.height,
                                }
                              : null,
                    };
                }
                if (!lireUnQr || !trait) return null;
                const echelle = Math.min(
                    1,
                    COTE_DE_LECTURE_QR / Math.max(video.videoWidth, video.videoHeight),
                );
                toile.width = Math.round(video.videoWidth * echelle);
                toile.height = Math.round(video.videoHeight * echelle);
                trait.drawImage(video, 0, 0, toile.width, toile.height);
                const image = trait.getImageData(0, 0, toile.width, toile.height);
                const qr = lireUnQr(image.data, image.width, image.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (!qr?.data?.trim()) return null;
                return {
                    code: qr.data.trim(),
                    zone: zoneDesCoins(
                        [
                            qr.location.topLeftCorner,
                            qr.location.topRightCorner,
                            qr.location.bottomRightCorner,
                            qr.location.bottomLeftCorner,
                        ],
                        1 / echelle,
                    ),
                };
            };

            const regarder = async () => {
                if (fini) return;
                const video = videoRef.current;
                if (video && video.readyState >= 2 && video.videoWidth > 0 && !pauseRef.current) {
                    try {
                        const lu = await lire(video);
                        if (fini) return;
                        if (lu) {
                            dernierCodeVu = Date.now();
                            const cadre = cadreRef?.current;
                            const pose =
                                lu.zone && cadre ? versLeCadre(lu.zone, video, cadre) : null;
                            setVisee((avant) =>
                                pose &&
                                avant &&
                                Math.abs(avant.left - pose.left) < 3 &&
                                Math.abs(avant.top - pose.top) < 3 &&
                                Math.abs(avant.width - pose.width) < 3 &&
                                Math.abs(avant.height - pose.height) < 3
                                    ? avant
                                    : pose,
                            );
                            signaler(lu.code);
                        } else if (Date.now() - dernierCodeVu > RETOUR_DU_CADRE_MS) {
                            setVisee(null);
                        }
                    } catch {
                        /* Une image illisible : la suivante. */
                    }
                }
                minuterie = window.setTimeout(regarder, detecteur ? 160 : 200);
            };
            void regarder();
        })();
        return () => {
            fini = true;
            window.clearTimeout(minuterie);
            setVisee(null);
        };
    }, [etat, signaler, cadreRef]);

    const basculerLampe = useCallback(async () => {
        const piste = fluxRef.current?.getVideoTracks()[0];
        if (!piste) return;
        const allumee = !lampe.allumee;
        try {
            await piste.applyConstraints({
                advanced: [{ torch: allumee } as unknown as MediaTrackConstraintSet],
            });
            setLampe((l) => ({ ...l, allumee }));
        } catch {
            setLampe({ possible: false, allumee: false });
        }
    }, [lampe.allumee]);

    /**
     * **Lire l'étiquette en photo** — l'image du cadre, agrandie, en noir et blanc, lue par
     * Tesseract en lettres capitales et chiffres. Le code que le parc connaît passe devant ;
     * sinon le plus long.
     */
    const lireLEtiquette = useCallback(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || photo === 'lecture') return;
        setPhoto('lecture');
        try {
            const { sx, sy, sl, sh } = zoneVisee(video, cadreRef?.current ?? null);
            /* Agrandie : Tesseract lit mal des lettres de moins de vingt pixels. */
            const dessiner = (echelle: number) => {
                const toile = document.createElement('canvas');
                toile.width = Math.round(sl * echelle);
                toile.height = Math.round(sh * echelle);
                const ctx = toile.getContext('2d');
                if (!ctx) throw new Error('canvas');
                ctx.filter = 'grayscale(1) contrast(1.6)';
                ctx.drawImage(video, sx, sy, sl, sh, 0, 0, toile.width, toile.height);
                return toile;
            };
            const echelle = Math.min(3, 1600 / sl);

            /* Le lecteur se charge à la première lecture (plusieurs Mo) et reste ouvert tant
               que le viseur l'est : les suivantes prennent une seconde, pas trente. */
            lecteurRef.current ??= (async () => {
                const tesseract = await import('tesseract.js');
                return tesseract.createWorker('eng');
            })();
            const lecteur = await lecteurRef.current;
            const lire = async (e: number) =>
                codesDuTexte((await lecteur.recognize(dessiner(e))).data.text || '');
            const reconnu = (candidats: string[]) => {
                for (const candidat of candidats) {
                    const connu = reconnaitreRef.current?.(candidat);
                    if (connu) return connu;
                }
                return undefined;
            };
            const candidats = await lire(echelle);
            let code = reconnu(candidats);
            /* Rien que le parc connaisse : une seconde passe, à une autre taille — la même
               étiquette se lit juste à une échelle et de travers à la voisine. */
            if (!code && reconnaitreRef.current) code = reconnu(await lire(echelle * 0.7));
            code ??= candidats[0];
            if (code) {
                setPhoto('repos');
                onCodeRef.current(code);
            } else setPhoto('rien');
        } catch (erreur) {
            /* Un chargement manqué (réseau) ne condamne pas la lecture suivante. */
            lecteurRef.current = null;
            console.warn('[scan] lecture de l’étiquette impossible', erreur);
            setPhoto('rien');
        }
    }, [photo, cadreRef]);

    return { videoRef, etat, decodeur, visee, lampe, basculerLampe, lireLEtiquette, photo };
};
