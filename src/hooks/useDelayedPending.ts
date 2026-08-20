import { useEffect, useState } from 'react';

/**
 * « Rien avant 300 ms » — planche 17.3 (règle A5), registre §2.39.
 *
 * En deçà du seuil, l'apparition de quoi que ce soit est un **clignotement** qui
 * coûte plus qu'il n'informe : un squelette qui paraît 200 ms se lit comme un
 * défaut d'affichage, pas comme une attente. Ce petit crochet ne fait qu'une
 * chose — il retarde le passage à `true`, et il rend `false` **immédiatement**
 * quand l'attente se termine : on ne fait jamais patienter après coup.
 *
 * Le seuil est une **convention proposée** par la planche, à vérifier sur un vrai
 * réseau ; il vit ici, en un seul endroit, pour que sa révision soit une ligne.
 *
 * ```tsx
 * const showSkeleton = useDelayedPending(isLoading);
 * return showSkeleton ? <SkeletonList /> : <List items={items} />;
 * ```
 */
export const PENDING_DELAY_MS = 300;

export const useDelayedPending = (
    pending: boolean,
    delayMs: number = PENDING_DELAY_MS,
): boolean => {
    const [elapsed, setElapsed] = useState(false);

    useEffect(() => {
        if (!pending) {
            setElapsed(false);
            return;
        }

        const timer = setTimeout(() => setElapsed(true), delayMs);
        return () => clearTimeout(timer);
    }, [pending, delayMs]);

    return pending && elapsed;
};

export default useDelayedPending;
