import React from 'react';

import useOnlineStatus from '../../hooks/useOnlineStatus';
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
            'border-b border-outline-variant bg-surface px-5 py-3 text-body-small text-text-secondary',
            className
        )}
    >
        {children}
    </div>
);

interface OfflineBannerProps {
    /**
     * Ce que l'écran laisse faire, et ce qui revient avec le réseau. Une phrase, et
     * elle nomme **les gestes de cet écran** — « créer, attribuer et déclarer
     * reviendront avec le réseau » — parce qu'une phrase générique n'apprend rien.
     */
    children?: React.ReactNode;
    className?: string;
}

/**
 * Hors ligne — planche **17.1**, règle 2 : **on lit, on n'écrit pas**.
 *
 * Le bandeau le dit **une fois**, sous la barre du haut, et jamais deux : ni une
 * pastille dans la barre, ni un second message dans la page. Ce qui est déjà chargé
 * reste lisible — un parc qu'on ne peut plus consulter dans un couloir sans réseau ne
 * sert à rien.
 *
 * Il ne s'affiche que hors ligne : un bandeau qui dirait « connecté » serait un état
 * de plus à lire pour une information que personne n'attend.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ children, className }) => {
    const online = useOnlineStatus();

    if (online) return null;

    return (
        <ContextBanner className={className}>
            <b className="font-medium text-on-surface">Hors ligne.</b>{' '}
            {children ?? 'Vous pouvez consulter ce qui est déjà chargé ; les gestes qui écrivent reviendront avec le réseau.'}
        </ContextBanner>
    );
};

export default OfflineBanner;
