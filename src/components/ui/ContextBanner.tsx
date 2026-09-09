import React from 'react';

import { cn } from '../../lib/utils';

/**
 * La bande sous la barre du haut — registre **§2.37**, planche **17.1**.
 *
 * Ce n'est pas la page : c'est du chrome **attaché à la barre du haut**, et c'est
 * pour cela qu'elle en partage la surface et le filet. Elle prend **12 px en haut
 * comme en bas** — pas 16, qui est la respiration d'une page : sans marge en tête, le
 * filet de la barre et la bordure du premier contrôle se retrouvent à 1 px l'un de
 * l'autre, et la bande semble sortir de la barre au lieu de vivre sous elle.
 */

interface ContextBannerProps {
    children: React.ReactNode;
    className?: string;
}

export const ContextBanner: React.FC<ContextBannerProps> = ({ children, className }) => (
    <div
        className={cn(
            'border-outline-variant bg-surface text-body-small text-text-secondary border-b px-5 py-3',
            className,
        )}
    >
        {children}
    </div>
);

/*
 * `OfflineBanner` a été retiré le 08/09. 17.1 (règle 2) dit l'état hors ligne **dans
 * la forme de l'état vide** — motif, titre, phrase, heure de la dernière lecture — et
 * jamais en bandeau : voir `OfflineState` dans `ScreenState.tsx`. Le bandeau annonçait
 * la coupure sans dire ce qu'on pouvait encore faire, et restait affiché par-dessus un
 * contenu parfois vide.
 */

export default ContextBanner;
