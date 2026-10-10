/**
 * **L'image importée d'un modèle** (10/10).
 *
 * La fiche d'un modèle ne prenait qu'une **adresse** d'image : on ne pouvait pas joindre la
 * photo qu'on venait de prendre. Le produit n'a pas de réserve de fichiers partagée — les
 * justificatifs et les signatures vivent dans le navigateur de l'appareil, et ne se relisent
 * que là. Une image de catalogue, elle, doit se voir de tous les postes.
 *
 * Elle est donc **réduite ici, puis rangée dans la fiche du modèle** : 640 px au plus grand
 * côté, quelques dizaines de kilo-octets, en `data:` dans le champ `image` qui portait
 * l'adresse. Rien d'autre ne change : l'aperçu lit ce champ tel quel.
 *
 * **Une image importée ne se recopie pas.** Un actif gardait une copie de l'image de son
 * modèle ; pour une adresse c'est une ligne, pour une image c'est trente kilo-octets par
 * actif — neuf mégaoctets sur un parc de trois cents. `imageARecopier` ne laisse passer que
 * les adresses, et l'actif lit l'image de son modèle au moment de l'afficher
 * (`imageDeLActif`).
 */

/** Le plus grand côté de l'image rangée, en pixels. */
const COTES = [640, 480, 360, 256];
/** La compression essayée à chaque taille, de la plus fidèle à la plus légère. */
const QUALITES = [0.82, 0.7, 0.55];
/** Ce que l'image rangée ne dépasse pas — la chaîne `data:`, en caractères. */
export const POIDS_MAX_DE_L_IMAGE = 60_000;

export const estUneImageImportee = (image?: string | null): boolean =>
    typeof image === 'string' && image.startsWith('data:image/');

/** Ce qu'un actif recopie de son modèle : une adresse, jamais une image importée. */
export const imageARecopier = (image?: string | null): string =>
    estUneImageImportee(image) ? '' : (image ?? '');

/** L'image d'un actif : la sienne s'il en porte une, sinon celle de son modèle. */
export const imageDeLActif = (
    actif: { image?: string; model?: string },
    modeles: ReadonlyArray<{ name: string; image?: string }>,
): string => actif.image || modeles.find((modele) => modele.name === actif.model)?.image || '';

/** Le poids de l'image rangée, en octets — une chaîne base64 pèse un tiers de plus. */
export const poidsDeLImage = (image: string): number => {
    const donnees = image.slice(image.indexOf(',') + 1);
    return Math.round((donnees.length * 3) / 4);
};

const lire = (fichier: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const adresse = URL.createObjectURL(fichier);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(adresse);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(adresse);
            reject(new Error('illisible'));
        };
        image.src = adresse;
    });

/**
 * Réduit une image choisie à ce que la fiche du modèle peut porter. Rend la chaîne `data:` ;
 * rejette `illisible` si le fichier n'est pas une image que le navigateur sait ouvrir.
 */
export const reduireLImage = async (fichier: File): Promise<string> => {
    const source = await lire(fichier);
    const largeur = source.naturalWidth;
    const hauteur = source.naturalHeight;
    if (!largeur || !hauteur) throw new Error('illisible');

    const toile = document.createElement('canvas');
    const trait = toile.getContext('2d');
    if (!trait) throw new Error('illisible');

    let derniere = '';
    for (const cote of COTES) {
        const echelle = Math.min(1, cote / Math.max(largeur, hauteur));
        toile.width = Math.max(1, Math.round(largeur * echelle));
        toile.height = Math.max(1, Math.round(hauteur * echelle));
        /* Le fond blanc : une photo détourée, rangée en JPEG, sortirait sur du noir. */
        trait.fillStyle = 'white';
        trait.fillRect(0, 0, toile.width, toile.height);
        trait.drawImage(source, 0, 0, toile.width, toile.height);
        for (const qualite of QUALITES) {
            /* WebP quand le navigateur sait l'écrire ; sinon il rend du PNG, et l'on repasse
               en JPEG, que tous écrivent. */
            let image = toile.toDataURL('image/webp', qualite);
            if (!image.startsWith('data:image/webp'))
                image = toile.toDataURL('image/jpeg', qualite);
            derniere = image;
            if (image.length <= POIDS_MAX_DE_L_IMAGE) return image;
        }
    }
    return derniere;
};
