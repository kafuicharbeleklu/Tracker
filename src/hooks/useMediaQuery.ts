import { useEffect, useState } from 'react';

/**
 * Custom hook to detect media query matches.
 * Useful for rendering components conditionally based on screen size.
 *
 * Usage: const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
    const getInitialValue = () => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState<boolean>(getInitialValue);

    useEffect(() => {
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
    }, [query]);

    return matches;
}
