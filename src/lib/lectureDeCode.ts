import { distance } from './tableur';

/**
 * **Ce qu'une lecture désigne** (09/10) — un code-barres, un QR, ou le texte d'une étiquette
 * lu en photo, rapproché des codes du parc.
 *
 * Trois écrans cherchaient l'objet d'une lecture chacun à sa façon, en égalité stricte : un
 * QR qui portait `{"assetId":"ASSET-10001"}` ne trouvait rien, et une étiquette lue en photo
 * — où le O et le 0, le I et le 1 se confondent — non plus.
 */

/** La valeur utile d'un QR : son `assetId`, son numéro de série, sinon le texte tel quel. */
export const codeDeLaLecture = (brut: string): string => {
    const texte = brut.trim();
    if (texte.startsWith('{')) {
        try {
            const objet = JSON.parse(texte) as Record<string, unknown>;
            const valeur = objet.assetId ?? objet.serialNumber ?? objet.serial ?? objet.hostname;
            if (typeof valeur === 'string' && valeur.trim()) return valeur.trim();
        } catch {
            /* Pas du JSON : le texte tel quel. */
        }
    }
    return texte;
};

/** Majuscules, sans espaces ni tirets, O lu comme 0 et I ou L comme 1. */
const forme = (code: string) =>
    code
        .toUpperCase()
        .replace(/[\s\-_./]/g, '')
        .replace(/O/g, '0')
        .replace(/[IL]/g, '1');

/** Deux codes égaux à la confusion de lecture près. */
export const memeCode = (a: string | undefined, b: string | undefined): boolean =>
    Boolean(a && b) && forme(a as string) === forme(b as string);

/** Le premier objet dont l'identifiant, le numéro de série ou le nom répond à la lecture. */
export const trouverParCode = <
    T extends { assetId?: string; serialNumber?: string; name?: string },
>(
    objets: readonly T[],
    lecture: string,
): T | undefined => {
    const code = codeDeLaLecture(lecture);
    return (
        objets.find((o) => memeCode(o.assetId, code) || memeCode(o.serialNumber, code)) ??
        objets.find((o) => o.name?.trim().toLowerCase() === code.toLowerCase())
    );
};

/**
 * **Le code tel que le parc l'écrit** — l'identifiant ou le numéro de série de l'objet que
 * la lecture désigne. Une étiquette lue « PF5XK2O » rend « PF5XK20 » : la suite cherche
 * en égalité stricte.
 */
export const codeConnu = <T extends { assetId?: string; serialNumber?: string }>(
    objets: readonly T[],
    lecture: string,
): string | undefined => {
    const code = codeDeLaLecture(lecture);
    for (const o of objets) {
        if (memeCode(o.assetId, code)) return o.assetId;
        if (memeCode(o.serialNumber, code)) return o.serialNumber;
    }
    return undefined;
};

/**
 * **Le code du parc qu'une lecture en photo désigne, à une faute près.** La lecture du texte
 * insère ou confond un signe (« WALDVES5G93 » pour « WALDVE5G93 ») : si **un seul** code du
 * parc est à une faute de la lecture, c'est lui. Deux candidats — des numéros qui se
 * suivent — et rien n'est choisi : la personne lit, et tranche.
 *
 * Réservé à la photo. Un code-barres se lit juste ou ne se lit pas : il passe par `codeConnu`.
 */
export const codeProche = <T extends { assetId?: string; serialNumber?: string }>(
    objets: readonly T[],
    lecture: string,
): string | undefined => {
    const exact = codeConnu(objets, lecture);
    if (exact) return exact;
    const lu = forme(codeDeLaLecture(lecture));
    if (lu.length < 7) return undefined;
    const proches = new Set<string>();
    for (const o of objets) {
        for (const code of [o.assetId, o.serialNumber]) {
            if (!code) continue;
            const f = forme(code);
            if (Math.abs(f.length - lu.length) <= 1 && distance(f, lu) <= 1) proches.add(code);
        }
    }
    return proches.size === 1 ? [...proches][0] : undefined;
};

/** Ce qui annonce un numéro de série sur une étiquette : « S/N », « Serial », « N° de série », « Service Tag ». */
const ANNONCE = /^(S\/?N|SN|SERIAL|SERIE|SÉRIE|SERIALNO|SERVICETAG|TAG)$/;
const LIAISON = /^(NO|N|NR|NUM|NUMBER|#)$/;

/**
 * Les codes candidats dans le texte d'une étiquette : des mots d'au moins cinq signes, avec
 * au moins un chiffre. **Celui qui suit « S/N » passe devant** — une étiquette porte aussi
 * une référence, un code produit, souvent plus longs que le numéro de série ; puis les plus
 * longs d'abord.
 */
export const codesDuTexte = (texte: string): string[] => {
    const mots = texte
        .toUpperCase()
        .split(/[\s:;,()[\]|]+/)
        .map((mot) => mot.replace(/^[^A-Z0-9É]+|[^A-Z0-9É]+$/g, ''))
        .filter(Boolean);
    /* Tout en chiffres, il faut huit signes sans barre ni point : « 2023/05 » est une date. */
    const estUnCode = (mot: string) =>
        mot.length >= 5 &&
        /\d/.test(mot) &&
        /^[A-Z0-9\-/.]+$/.test(mot) &&
        (/[A-Z]/.test(mot) || /^\d{8,}$/.test(mot));
    const nu = (mot: string) => mot.replace(/[.°]/g, '');
    /* « Serial No. PF505FBW », « Serial Number: … » : un mot de liaison entre l'annonce et le code. */
    const annonce = (i: number) => {
        let j = i - 1;
        if (j >= 0 && LIAISON.test(nu(mots[j]))) j -= 1;
        return j >= 0 && ANNONCE.test(nu(mots[j]));
    };
    const annonces = mots.filter((mot, i) => estUnCode(mot) && annonce(i));
    const autres = mots.filter(estUnCode).sort((a, b) => b.length - a.length);
    return [...new Set([...annonces, ...autres])];
};
