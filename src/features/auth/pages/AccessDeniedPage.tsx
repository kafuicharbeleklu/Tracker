import React, { useMemo } from 'react';
import { LockSimple } from '@phosphor-icons/react';

import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import Button from '../../../components/ui/Button';
import ScreenState from '../../../components/ui/ScreenState';
import { APP_CONFIG } from '../../../config';

/**
 * Accès refusé — planche **17.1**, quatrième état.
 *
 * *« Trois écrans, une forme. »* Hors ligne, introuvable et refusé empruntent l'état
 * vide : même motif, même place du titre, même geste de sortie, et une seule chose qui
 * change, **ce qu'on peut faire ensuite**. L'écran portait sa propre composition — un
 * rond de 80, une icône de 40, un titre d'un autre palier — pour dire la même chose que
 * les deux autres.
 *
 * **Un accès refusé ne fait pas deviner sa cause.** Le produit sait laquelle est la
 * sienne, compte en attente, suspendu ou hors liste, et la vérification la renvoie : le
 * motif est le **titre**, parce que c'est le fait, et qu'il n'y a rien de plus important
 * à lire. L'écran précédent listait les trois causes et laissait la personne trier.
 *
 * Deux phrases de l'ancienne version sont retirées. Elle affirmait *« votre identifiant
 * Microsoft est valide »*, alors que la connexion Microsoft est hors périmètre depuis
 * l'arbitrage du 01/09 : l'écran promettait un chemin qui n'existe pas. Et elle renvoyait
 * à *« la personne qui gère les comptes de votre entité »*.
 *
 * **Le nom, depuis le 08/09.** La planche demande *« un nom, jamais l'administrateur »*,
 * et l'écran en a un : il vit sous `DataProvider`, donc il lit le parc des comptes et
 * y prend le SuperAdmin, à défaut un Admin. Le geste devient **« Écrire à … »** —
 * une porte qui mène quelque part. Sans aucun compte administrateur, la phrase
 * générique revient : l'écran ne nomme jamais quelqu'un au hasard.
 *
 * Pas de barre du bas : il n'y a rien à naviguer.
 */
const AccessDeniedPage: React.FC = () => {
    const { logout, accessDeniedReason } = useAuth();
    const { users } = useData();

    const motif = accessDeniedReason ?? "Votre compte n'a pas accès à cette application.";

    /* Qui peut ouvrir cette porte. Le SuperAdmin d'abord — c'est lui qui crée les
       comptes —, un Admin ensuite. Un compte sans adresse ne sert à rien ici. */
    const ouvreur = useMemo(
        () =>
            users.find((u) => u.role === 'SuperAdmin' && u.email) ??
            users.find((u) => u.role === 'Admin' && u.email),
        [users],
    );

    return (
        <div className="bg-background text-on-surface flex min-h-dvh flex-col">
            <ScreenState
                icon={LockSimple}
                title={motif}
                description={
                    ouvreur
                        ? `${ouvreur.name} ouvre les accès à ${APP_CONFIG.appName}. Prévenez-le : cela se fait en une fois.`
                        : `Votre informatique ouvre les accès à ${APP_CONFIG.appName}. Prévenez-la : elle peut le faire en une fois.`
                }
                actions={
                    <>
                        {ouvreur && (
                            <Button
                                variant="filled"
                                onClick={() => {
                                    window.location.href = `mailto:${ouvreur.email}`;
                                }}
                                className="!rounded-[4px]"
                            >
                                Écrire à {ouvreur.name}
                            </Button>
                        )}
                        <Button variant="outlined" onClick={logout} className="!rounded-[4px]">
                            Retour à la connexion
                        </Button>
                    </>
                }
            />
        </div>
    );
};

export default AccessDeniedPage;
