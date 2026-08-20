import { useEffect, useState } from 'react';

/**
 * Le réseau — planche **17.1**, règle 2 ; dette **D9** du dossier de passation.
 *
 * Le produit ne détectait rien : `navigator.onLine` n'apparaissait nulle part dans
 * `src/`, alors que l'état hors ligne est dessiné. Ce crochet est le déclencheur qui
 * manquait, et rien de plus.
 *
 * **Ce qu'il ne décide pas.** La règle dessinée est *« on lit, on n'écrit pas »* : le
 * bandeau le dit une fois sous la barre du haut, et les gestes qui écrivent
 * **disparaissent** au lieu de s'afficher barrés — un bouton barré demande de
 * comprendre pourquoi, son absence expliquée en haut ne demande rien. Mais **ce que
 * « écrire » veut dire exactement reste à trancher côté produit** : le produit
 * persiste aujourd'hui dans le navigateur et son serveur est optionnel, si bien
 * qu'une partie des actes aboutit sans réseau. La planche le dit elle-même :
 * *proposition*. Tant que l'arbitrage n'est pas rendu, ce crochet ne retire aucun
 * geste — il dit l'état, il ne l'applique pas.
 *
 * `navigator.onLine` ne dit que la connectivité de l'interface réseau, jamais qu'un
 * serveur répond. C'est suffisant pour l'usage dessiné — un couloir, un local
 * technique — et insuffisant pour prétendre à autre chose.
 */
export const useOnlineStatus = (): boolean => {
    const [online, setOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        setOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return online;
};

export default useOnlineStatus;
