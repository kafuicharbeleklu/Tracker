import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { useRouter } from './useRouter';
import { APP_CONFIG } from '../config';
import type { MenuItem } from '../components/ui/Menu';

/**
 * **Le menu de la personne — trois destinations et la sortie**, déclaré une fois pour
 * les deux surfaces qui l'ouvrent : l'avatar de l'en-tête au téléphone (03.1) et le ⋮
 * du pied de la barre latérale au bureau (03.1 bureau, §2.43).
 *
 * Ce qu'il porte vient des arbitrages du 06 et du 07/09 : **ni pictogramme ni chevron**
 * sur les destinations — le glyphe n'ajoutait rien au mot, la flèche ne distinguait rien
 * de sa voisine dans une liste où *toutes* les rangées mènent ailleurs ; **Aide et
 * support** qui ouvre le courrier au support informatique, la seule aide que ce produit
 * possède réellement ; et la sortie détachée par un filet, en encre de danger — c'est un
 * acte, pas une destination.
 *
 * **Paramètres est ici, pas dans « Plus »** : la feuille ne range que des destinations
 * de travail, et deux portes vers le même réglage en font une de trop.
 */
export interface AccountMenu {
    /** La légende du menu — qui l'on est, et à quel titre. */
    legende: string;
    items: MenuItem[];
    /** Les initiales de la personne, pour la pastille qui ouvre le menu. */
    initiales: string;
    nom: string;
    role: string;
}

export const useAccountMenu = (): AccountMenu => {
    const { currentUser, logout } = useAuth();
    const { navigate } = useRouter();

    const nom = currentUser?.name || 'Utilisateur';
    const role = currentUser?.role || '';

    const initiales = useMemo(
        () =>
            nom
                .split(' ')
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AS',
        [nom],
    );

    const items = useMemo<MenuItem[]>(
        () => [
            {
                id: 'account',
                label: 'Mon compte',
                description: 'Mot de passe, code PIN, sessions',
                onSelect: () => navigate('/settings/account'),
            },
            {
                id: 'settings',
                label: 'Paramètres',
                description: 'Notifications, langue et site',
                onSelect: () => navigate('/settings'),
            },
            {
                id: 'support',
                label: 'Aide et support',
                description: APP_CONFIG.supportEmail,
                onSelect: () => {
                    window.location.href = `mailto:${APP_CONFIG.supportEmail}`;
                },
            },
            {
                id: 'logout',
                label: 'Se déconnecter',
                destructive: true,
                dividerBefore: true,
                onSelect: logout,
            },
        ],
        [logout, navigate],
    );

    return {
        legende: role ? `${nom} · ${role}` : nom,
        items,
        initiales,
        nom,
        role,
    };
};
