import { useEffect, useState } from 'react';

import { MOBILE_ONLY, MOBILE_ONLY_ANSWERS } from '../constants/breakpoints';

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
export function useMediaQuery(query: string): boolean {
    const forced = MOBILE_ONLY ? MOBILE_ONLY_ANSWERS[query] : undefined;

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
