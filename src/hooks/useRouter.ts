import { useState, useEffect, useCallback } from 'react';

import { passer } from '../lib/passageDeFiche';

// Helper to get path segments from hash
// e.g. #/users/123 -> ['users', '123']
const getHashSegments = () => {
    const hash = window.location.hash;
    const path = hash.replace(/^#/, '') || '/';
    const [pathname] = path.split('?');
    return pathname.split('/').filter(Boolean);
};

export const useRouter = () => {
    const [routeSegments, setRouteSegments] = useState<string[]>(getHashSegments());

    useEffect(() => {
        /* La mise à jour passe par `passer` : d'une liste à sa fiche, elle se joue dans une
           transition de vue (11/10). Ailleurs, rien ne change. */
        const handleHashChange = (event: HashChangeEvent) => {
            passer(event, () => setRouteSegments(getHashSegments()));
        };

        // Initialize if empty
        if (!window.location.hash) {
            window.location.hash = '/';
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = useCallback((path: string) => {
        window.location.hash = path.startsWith('/') ? path : `/${path}`;
    }, []);

    return { routeSegments, navigate };
};
