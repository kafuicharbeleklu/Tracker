import { useEffect, useState } from 'react';

import { MOBILE_ONLY, MOBILE_ONLY_ANSWERS, MOBILE_ONLY_VIEWPORT } from '../constants/breakpoints';

/**
 * Custom hook to detect media query matches.
 * Useful for rendering components conditionally based on screen size.
 *
 * Usage: const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * **Sous `MOBILE_ONLY`, une requête de largeur ne consulte pas la fenêtre** : elle est
 * répondue pour le téléphone que le produit joue. Sans cela, la coque lirait la vraie
 * largeur et poserait un rail à côté d'une mise en page de téléphone. Les requêtes que
 * la table ne connaît pas — le survol, par exemple — restent lues sur l'appareil.
 */
/**
 * **Le repli, pour toute requête de dimension que la table ne nomme pas.**
 *
 * La table répond aux six requêtes de `MEDIA`. Une septième, déclarée en constante privée
 * dans un gabarit — c'était le cas de `(min-width: 1280px)` sur `DetailTemplate` —
 * passait à travers et consultait la vraie fenêtre : les fiches se mettaient en deux
 * colonnes **à l'intérieur** du cadre de 393 px, et la moitié du contenu sortait du champ.
 *
 * Toute requête qui ne parle que de largeur, de hauteur ou d'orientation est donc évaluée
 * contre le téléphone que le produit joue. Celles qui parlent de l'appareil lui-même — le
 * survol, la finesse du pointeur — restent lues sur l'appareil : une souris est une
 * souris, même devant un rendu mobile.
 */
const DIMENSIONS_SEULES = /^[\s()a-z0-9:.,%-]*$/i;

const repondrePourLeTelephone = (query: string): boolean | undefined => {
    const q = query.toLowerCase();
    if (/hover|pointer|prefers-|resolution|display-mode|color/.test(q)) return undefined;
    if (!/width|height|orientation/.test(q)) return undefined;
    if (!DIMENSIONS_SEULES.test(q)) return undefined;

    const { width, height } = MOBILE_ONLY_VIEWPORT;
    /* Une requête « et » vaut ses termes ; une requête « ou » (virgule) vaut l'un d'eux. */
    const evaluerTerme = (terme: string): boolean => {
        const min = terme.match(/min-width:\s*(\d+(?:\.\d+)?)px/);
        if (min) return width >= Number(min[1]);
        const max = terme.match(/max-width:\s*(\d+(?:\.\d+)?)px/);
        if (max) return width <= Number(max[1]);
        const minH = terme.match(/min-height:\s*(\d+(?:\.\d+)?)px/);
        if (minH) return height >= Number(minH[1]);
        const maxH = terme.match(/max-height:\s*(\d+(?:\.\d+)?)px/);
        if (maxH) return height <= Number(maxH[1]);
        if (/orientation:\s*landscape/.test(terme)) return width > height;
        if (/orientation:\s*portrait/.test(terme)) return height >= width;
        return true;
    };

    return q.split(',').some((ou) =>
        ou
            .split(/\band\b/)
            .map((terme) => terme.trim())
            .filter(Boolean)
            .every(evaluerTerme),
    );
};

export function useMediaQuery(query: string): boolean {
    const forced = MOBILE_ONLY
        ? (MOBILE_ONLY_ANSWERS[query] ?? repondrePourLeTelephone(query))
        : undefined;

    const getInitialValue = () => {
        if (forced !== undefined) return forced;
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState<boolean>(getInitialValue);

    useEffect(() => {
        if (forced !== undefined) {
            setMatches(forced);
            return;
        }
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const onChange = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', onChange);
            return () => mediaQuery.removeEventListener('change', onChange);
        }

        // Fallback for older browsers.
        mediaQuery.addListener(onChange);
        return () => mediaQuery.removeListener(onChange);
    }, [forced, query]);

    return matches;
}
