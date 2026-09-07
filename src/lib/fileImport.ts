/**
 * **La limite d'un fichier importé** — composant partagé **17.10**, neuf emplois.
 *
 * *« 5 Mo par fichier, pour toutes les formes »* : le tableur, la pièce jointe, la
 * photo, l'image à recadrer. La planche note que **le code n'en portait aucune** — ni
 * sur les imports de référentiel, ni sur les photos d'incident, ni sur les factures.
 * Un fichier de cent mégaoctets partait donc dans la lecture, et l'écran restait sur
 * son attente sans jamais rien dire.
 *
 * La valeur est un arbitrage rendu par défaut le 06/09, revocable : elle vit ici, une
 * seule fois, et 14.1 la rendra réglable le jour où l'organisation le demande.
 */

/** 5 Mo, la borne de 17.10. */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** « 5 Mo », « 12,4 Mo » — la taille telle qu'on la lit dans un refus. */
export const formatFileSize = (bytes: number): string => {
    const mo = bytes / (1024 * 1024);
    /* Un compte rond se dit rond : « 5 Mo », pas « 5,0 Mo ». La décimale ne sert que
       quand elle apprend quelque chose — « 6,4 Mo » contre la borne de 5. */
    if (mo >= 1) {
        const arrondi = mo >= 10 ? Math.round(mo) : Math.round(mo * 10) / 10;
        return `${String(arrondi).replace('.', ',')} Mo`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
};

/**
 * Sépare ce qui passe de ce qui dépasse. Le refus **nomme le fichier et sa taille** :
 * « facture.pdf fait 12,4 Mo » se corrige, « fichier trop lourd » se devine.
 */
export const partitionBySize = (
    files: File[],
    limit: number = MAX_IMPORT_FILE_BYTES,
): { accepted: File[]; rejected: File[] } => ({
    accepted: files.filter((file) => file.size <= limit),
    rejected: files.filter((file) => file.size > limit),
});

/** La phrase du refus — ≤ 60 signes quand un seul fichier dépasse (17.5). */
export const rejectionMessage = (
    rejected: File[],
    limit: number = MAX_IMPORT_FILE_BYTES,
): string | null => {
    if (rejected.length === 0) return null;
    if (rejected.length === 1) {
        return `${rejected[0].name} fait ${formatFileSize(rejected[0].size)}, au-delà de ${formatFileSize(limit)}.`;
    }
    return `${rejected.length} fichiers dépassent ${formatFileSize(limit)}.`;
};
