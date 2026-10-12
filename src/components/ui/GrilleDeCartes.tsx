import React from 'react';

/**
 * **Une liste en grille de cartes** (10/10) — la tablette debout, quand aucun objet n'est
 * ouvert à côté.
 *
 * Relevé du commanditaire : *« on se contente de reprendre les vues mobile avec plus de
 * largeur »*. Une rangée de téléphone étirée sur 640 px posait le nom à gauche et son type
 * 400 px plus loin ; la liste des actifs tenait 18,7 écrans. Rangées par deux, chacune dans
 * sa carte, elles montrent deux fois plus d'objets sans rien rapetisser. Un objet touché
 * ouvre la fiche à côté, et la liste revient à une colonne.
 *
 * Les rangées arrivent déjà rendues ; ce module les groupe par ligne. Chaque ligne est un
 * enfant direct de la liste : la fenêtre virtuelle (`useVirtualWindow`) compte en lignes,
 * et mesure une ligne comme elle mesurait une rangée.
 */
export const COLONNES_DE_LA_GRILLE = 2;

/** La hauteur supposée d'une ligne de la grille : la rangée de 68, et 12 dessous. */
export const HAUTEUR_D_UNE_LIGNE_DE_GRILLE = 80;

export const enGrilleDeCartes = (
    rangees: React.ReactElement[],
    enGrille: boolean,
): React.ReactNode => {
    if (!enGrille) return rangees;
    const lignes: React.ReactNode[] = [];
    for (let i = 0; i < rangees.length; i += COLONNES_DE_LA_GRILLE) {
        const groupe = rangees.slice(i, i + COLONNES_DE_LA_GRILLE);
        lignes.push(
            <div key={groupe[0].key} className="grid grid-cols-2 gap-x-3 pb-3">
                {groupe.map((rangee) => (
                    <div key={rangee.key} className="bg-surface rounded-card min-w-0 px-4">
                        {rangee}
                    </div>
                ))}
            </div>,
        );
    }
    return lignes;
};
