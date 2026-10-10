import { useCallback, useState } from 'react';

/**
 * **Au téléphone, l'en-tête ne porte que son titre ; la loupe déplie le reste** (10/10).
 *
 * Demande du commanditaire : *« par défaut on va mettre uniquement le titre de page, à son
 * extrémité un bouton qui au clic va afficher la barre de recherche accompagnée des autres
 * boutons, filtre etc. — un peu comme le fait WhatsApp »*. La bande de recherche, l'entonnoir,
 * le tri et les puces tenaient sous le titre, toujours : deux à trois lignes prises à la liste
 * avant sa première rangée.
 *
 * Deux règles pour qu'un filtre ne se cache jamais :
 * - **une recherche en cours tient la bande ouverte** — on ne replie pas un champ qui filtre ;
 * - **replier vide la recherche** — comme la flèche de retour de WhatsApp. Ce qui reste posé
 *   ailleurs (un filtre de la feuille, une puce) se signale par un point sur la loupe.
 */
export function useRechercheRepliee(search?: { value: string; onChange: (value: string) => void }) {
    const [depliee, setDepliee] = useState(false);
    const valeur = search?.value ?? '';
    const vider = search?.onChange;
    const ouverte = depliee || valeur.trim().length > 0;

    const basculer = useCallback(() => {
        if (ouverte) {
            if (valeur) vider?.('');
            setDepliee(false);
        } else {
            setDepliee(true);
        }
    }, [ouverte, valeur, vider]);

    /* `parGeste` : dépliée par la loupe, pas par une recherche retrouvée au retour sur la page —
       le champ ne prend le curseur (et le clavier) que dans le premier cas. */
    return { ouverte, basculer, parGeste: depliee };
}
