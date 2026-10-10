/**
 * **La signature d'un acte, gardée avec le fait** (10/10).
 *
 * *« Stocke les signatures, on veut pouvoir les afficher. »* Une signature tracée au moment
 * d'un acte n'était pas gardée, et la signature enregistrée d'une personne ne se relisait que
 * sur l'appareil où elle l'avait posée (`signatureService`, dans le navigateur). Le journal
 * disait donc « signature apposée » sans pouvoir la montrer.
 *
 * Elle est désormais **réduite, puis écrite dans le fait** (`metadata.signatures`) : rognée à
 * son trait, 320 px de large au plus, quelques kilo-octets. Le journal est en ajout seul —
 * une signature ne se corrige pas, elle non plus —, et tous les postes la relisent.
 *
 * **Le passage de l'attestation au journal.** Une douzaine d'actes écrivent un fait ; plutôt
 * que de faire traverser l'image à chacun, l'attestation la **pose** ici quand elle est faite,
 * et `logEvent` la **prend** en écrivant le premier fait attesté par une signature. Une feuille
 * d'acte qui s'ouvre vide ce qui restait (`oublierLesSignatures`) ; ce qui a plus de dix
 * minutes ne compte plus.
 */

/** La largeur de l'image gardée, en pixels, et les replis si elle pèse trop. */
const LARGEURS = [320, 240, 180];
/** Ce que l'image gardée ne dépasse pas — la chaîne `data:`, en caractères. */
export const POIDS_MAX_DE_LA_SIGNATURE = 12_000;
/** Au-delà, une signature posée n'est plus celle de l'acte en cours. */
const VALIDITE_MS = 10 * 60_000;

export interface SignatureDeFait {
    /** Qui a signé — son nom, tel que l'attestation l'écrit sous le trait. */
    par: string;
    /** L'image, en `data:`. */
    image: string;
}

const enAttente = new Map<string, { image: string; posee: number }>();

/** Pose (ou retire, avec `null`) la signature d'un signataire pour l'acte en cours. */
export const poserLaSignatureDeLActe = (par: string, image: string | null): void => {
    if (image) enAttente.set(par, { image, posee: Date.now() });
    else enAttente.delete(par);
};

/** Une feuille d'acte s'ouvre : rien de ce qui a été signé avant ne la concerne. */
export const oublierLesSignatures = (): void => enAttente.clear();

/** Ce qu'un fait dit de son attestation : vrai quand une signature y a part. */
export const attesteParSignature = (metadata?: Record<string, unknown>): boolean => {
    const methode = metadata?.method;
    const preuve = metadata?.proof;
    return (
        methode === 'signature' ||
        methode === 'pin+signature' ||
        (typeof preuve === 'string' && /signature/i.test(preuve))
    );
};

/** Prend les signatures posées pour l'acte en cours, et vide la réserve. */
export const prendreLesSignaturesDeLActe = (): SignatureDeFait[] => {
    const maintenant = Date.now();
    const prises = [...enAttente.entries()]
        .filter(([, valeur]) => maintenant - valeur.posee < VALIDITE_MS)
        .map(([par, valeur]) => ({ par, image: valeur.image }));
    enAttente.clear();
    return prises;
};

/** Les signatures gardées avec un fait — lues telles qu'elles ont été écrites. */
export const signaturesDuFait = (metadata?: Record<string, unknown>): SignatureDeFait[] => {
    const valeur = metadata?.signatures;
    if (!Array.isArray(valeur)) return [];
    return valeur.filter(
        (s): s is SignatureDeFait =>
            Boolean(s) &&
            typeof (s as SignatureDeFait).par === 'string' &&
            typeof (s as SignatureDeFait).image === 'string' &&
            (s as SignatureDeFait).image.startsWith('data:image/'),
    );
};

const exporter = (toile: HTMLCanvasElement): string => {
    /* Un trait sur fond transparent se range mieux en PNG ; une image importée, en WebP. */
    const png = toile.toDataURL('image/png');
    const webp = toile.toDataURL('image/webp', 0.8);
    return webp.startsWith('data:image/webp') && webp.length < png.length ? webp : png;
};

const reduire = (
    source: CanvasImageSource,
    zone: { x: number; y: number; l: number; h: number },
): string | null => {
    const toile = document.createElement('canvas');
    const trait = toile.getContext('2d');
    if (!trait || zone.l < 2 || zone.h < 2) return null;
    let derniere: string | null = null;
    for (const largeur of LARGEURS) {
        const echelle = Math.min(1, largeur / zone.l);
        toile.width = Math.max(1, Math.round(zone.l * echelle));
        toile.height = Math.max(1, Math.round(zone.h * echelle));
        trait.clearRect(0, 0, toile.width, toile.height);
        trait.drawImage(source, zone.x, zone.y, zone.l, zone.h, 0, 0, toile.width, toile.height);
        derniere = exporter(toile);
        if (derniere.length <= POIDS_MAX_DE_LA_SIGNATURE) return derniere;
    }
    return derniere;
};

/**
 * La signature **tracée** sur un canevas : rognée à son trait (avec un peu d'air), réduite.
 * `null` si le canevas est vide.
 */
export const signatureDuCanevas = (canevas: HTMLCanvasElement): string | null => {
    const trait = canevas.getContext('2d');
    if (!trait || !canevas.width || !canevas.height) return null;
    const { data, width, height } = trait.getImageData(0, 0, canevas.width, canevas.height);
    let gauche = width;
    let haut = height;
    let droite = -1;
    let bas = -1;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (data[(y * width + x) * 4 + 3] > 16) {
                if (x < gauche) gauche = x;
                if (x > droite) droite = x;
                if (y < haut) haut = y;
                if (y > bas) bas = y;
            }
        }
    }
    if (droite < 0) return null;
    const air = Math.round(Math.max(width, height) * 0.02) + 4;
    const x = Math.max(0, gauche - air);
    const y = Math.max(0, haut - air);
    return reduire(canevas, {
        x,
        y,
        l: Math.min(width, droite + air) - x,
        h: Math.min(height, bas + air) - y,
    });
};

/** La signature **enregistrée** d'une personne (une image) : réduite à la même mesure. */
export const signatureDeLImage = (image: Blob): Promise<string | null> =>
    new Promise((resolve) => {
        const adresse = URL.createObjectURL(image);
        const element = new Image();
        element.onload = () => {
            URL.revokeObjectURL(adresse);
            resolve(
                reduire(element, {
                    x: 0,
                    y: 0,
                    l: element.naturalWidth,
                    h: element.naturalHeight,
                }),
            );
        };
        element.onerror = () => {
            URL.revokeObjectURL(adresse);
            resolve(null);
        };
        element.src = adresse;
    });
