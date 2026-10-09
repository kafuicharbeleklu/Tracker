import { normaliserNom } from './tableur';

interface ModeleNomme {
    name: string;
    brand?: string;
}

/**
 * **Retrouver un modèle comme il est écrit** (09/10) — « T440 » chez Lenovo est le
 * « ThinkPad T440 » du catalogue ; « latitude 5440 » est « Latitude 5440 ». Le nom exact
 * d'abord, puis la marque et le nom, puis le nom contenu, départagé par la marque. Plusieurs
 * candidats : `ambigus` les nomme, rien n'est choisi.
 *
 * Les deux imports s'en servent : celui des actifs pour rattacher une ligne à son modèle,
 * celui des modèles pour ne pas créer « T14 Gen 4 » à côté de « ThinkPad T14 Gen 4 ».
 */
export const trouverModele = <T extends ModeleNomme>(
    modeles: readonly T[],
    brut: string,
    marque = '',
): { modele?: T; ambigus: string[] } => {
    const cle = normaliserNom(brut);
    const cleMarque = normaliserNom(marque);
    if (!cle) return { ambigus: [] };
    const exact = modeles.filter(
        (m) =>
            normaliserNom(m.name) === cle ||
            normaliserNom(`${m.brand ?? ''}${m.name}`) === cle ||
            (cleMarque !== '' && normaliserNom(m.name) === normaliserNom(`${marque}${brut}`)),
    );
    if (exact.length === 1) return { modele: exact[0], ambigus: [] };
    const contenus = (exact.length > 1 ? exact : modeles).filter((m) => {
        const n = normaliserNom(m.name);
        const b = normaliserNom(m.brand ?? '');
        const parNom = cle.length >= 3 && (n.includes(cle) || cle.includes(n));
        const parMarque = !cleMarque || !b || b.includes(cleMarque) || cleMarque.includes(b);
        return parNom && parMarque;
    });
    if (contenus.length === 1) return { modele: contenus[0], ambigus: [] };
    return { ambigus: contenus.map((m) => m.name) };
};
