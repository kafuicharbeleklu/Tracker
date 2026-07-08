import { useMediaQuery } from './useMediaQuery';
import { MEDIA } from '../constants/breakpoints';

export type WindowSizeClass = 'compact' | 'medium' | 'expanded';

/**
 * Classe de taille de fenêtre MD3 courante + booléens pratiques.
 * Source unique des seuils : `src/constants/breakpoints.ts`.
 *
 * Pour des besoins ponctuels (paysage, sous-expanded…), passer une clé de
 * `MEDIA` à `useMediaQuery(...)`.
 */
export const useBreakpoint = () => {
    const isCompact = useMediaQuery(MEDIA.compact);
    const isMedium = useMediaQuery(MEDIA.medium);
    const isExpanded = useMediaQuery(MEDIA.expandedUp);

    const sizeClass: WindowSizeClass = isCompact ? 'compact' : isMedium ? 'medium' : 'expanded';

    return { isCompact, isMedium, isExpanded, sizeClass };
};
