import { useCallback, useEffect, useState } from 'react';

const lireObjetOuvert = (): string | null => {
    const [, requete = ''] = window.location.hash.split('?');
    return new URLSearchParams(requete).get('ouvert');
};

/**
 * **Un acte engagé depuis la fiche d'un panneau garde l'objet ouvert** (P3, 25/09) — la
 * remise, la restitution ouvertes de la fiche à côté d'une liste. `ouvert=` suit l'adresse
 * de l'acte : la coque laisse la liste et sa fiche sous la feuille, et y revient en la
 * refermant, au lieu d'ouvrir la page de l'objet.
 */
export const avecObjetOuvert = (adresse: string): string => {
    const ouvert = lireObjetOuvert();
    if (!ouvert || !adresse.startsWith('/wizards/')) return adresse;
    return `${adresse}${adresse.includes('?') ? '&' : '?'}ouvert=${encodeURIComponent(ouvert)}`;
};

/**
 * **L'objet ouvert à côté d'une liste, tenu dans l'adresse** (P2a, 25/09) — `?ouvert=ID`
 * sur l'adresse de la liste : `#/inventory?ouvert=12`.
 *
 * Dans l'adresse, et pas dans l'état de la page : un rechargement, un lien partagé, un
 * retour depuis la pleine page retrouvent la fiche ouverte ; et en tournant l'appareil
 * sous 840, la liste passe la main à la page de l'objet au lieu de l'oublier. Changer
 * d'objet **remplace** l'adresse (`location.replace`) : ce n'est pas une page de plus
 * dans l'historique du navigateur.
 */
export const useObjetOuvert = () => {
    const [ouvert, setOuvert] = useState<string | null>(lireObjetOuvert);

    useEffect(() => {
        const suivre = () => setOuvert(lireObjetOuvert());
        window.addEventListener('hashchange', suivre);
        return () => window.removeEventListener('hashchange', suivre);
    }, []);

    const poser = useCallback((id: string | null) => {
        const [chemin, requete = ''] = window.location.hash.replace(/^#/, '').split('?');
        const parametres = new URLSearchParams(requete);
        if (id) parametres.set('ouvert', id);
        else parametres.delete('ouvert');
        const reste = parametres.toString();
        window.location.replace(`#${chemin || '/'}${reste ? `?${reste}` : ''}`);
    }, []);

    const fermer = useCallback(() => poser(null), [poser]);

    return { ouvert, ouvrir: poser, fermer };
};
